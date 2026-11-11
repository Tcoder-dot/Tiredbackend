import { lookup } from "node:dns/promises";
import https from "node:https";
import { isIP } from "node:net";

type SafeResponse = {
  contentType: string;
  body: Buffer;
};

function isPublicIpv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }
  const [a, b, c] = octets;
  return !(
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || (b === 0 && c === 0) || (b === 0 && c === 2) || (b === 88 && c === 99))) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113)
  );
}

function isPublicIpv6(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized.startsWith("::ffff:")) {
    const mappedIpv4 = normalized.slice(7);
    return isIP(mappedIpv4) === 4 && isPublicIpv4(mappedIpv4);
  }
  if (isIP(normalized) !== 6) return false;

  const firstSegment = parseInt(normalized.split(":")[0] || "0", 16);
  const secondSegment = parseInt(normalized.split(":")[1] || "0", 16);
  return firstSegment >= 0x2000 && firstSegment <= 0x3fff &&
    firstSegment !== 0x2002 &&
    !(firstSegment === 0x2001 && (secondSegment <= 0x01ff || secondSegment === 0x0db8)) &&
    !(firstSegment === 0x3fff && secondSegment <= 0x0fff);
}

function validateHttpsUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("Enter a valid website URL beginning with https://.");
  }

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443") ||
    !url.hostname ||
    url.hostname.endsWith(".local") ||
    url.hostname.endsWith(".internal")
  ) {
    throw new Error("Portfolio previews only support public HTTPS websites.");
  }
  url.hash = "";
  return url;
}

async function getPublicAddress(hostname: string): Promise<{ address: string; family: 4 | 6 }> {
  hostname = hostname.replace(/^\[|\]$/g, "");
  const literalFamily = isIP(hostname);
  if (literalFamily === 4) {
    if (!isPublicIpv4(hostname)) throw new Error("Private website addresses cannot be previewed.");
    return { address: hostname, family: 4 };
  }
  if (literalFamily === 6) {
    if (!isPublicIpv6(hostname)) throw new Error("Private website addresses cannot be previewed.");
    return { address: hostname, family: 6 };
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  const publicAddress = addresses.find(({ address, family }) =>
    family === 4 ? isPublicIpv4(address) : isPublicIpv6(address)
  );
  if (!publicAddress) throw new Error("This website does not resolve to a public address.");
  return { address: publicAddress.address, family: publicAddress.family as 4 | 6 };
}

function requestPinned(
  url: URL,
  address: { address: string; family: 4 | 6 },
  maxBytes: number
): Promise<{ status: number; location?: string; contentType: string; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const request = https.request(url, {
      method: "GET",
      headers: {
        Accept: "text/html,image/jpeg,image/png,image/webp,image/gif",
        "User-Agent": "FloatePortfolioPreview/1.0"
      },
      lookup: (_hostname, options, callback) => {
        if (options.all) {
          callback(null, [address]);
        } else {
          callback(null, address.address, address.family);
        }
      },
      servername: isIP(url.hostname.replace(/^\[|\]$/g, ""))
        ? undefined
        : url.hostname.replace(/^\[|\]$/g, "")
    }, (response) => {
      const status = response.statusCode || 0;
      const location = response.headers.location;
      const contentType = String(response.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
      const contentLength = Number(response.headers["content-length"] || 0);
      if (contentLength > maxBytes) {
        response.destroy();
        reject(new Error("The portfolio preview response is too large."));
        return;
      }

      const chunks: Buffer[] = [];
      let totalBytes = 0;
      response.on("data", (chunk: Buffer | string) => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        totalBytes += buffer.length;
        if (totalBytes > maxBytes) {
          response.destroy(new Error("The portfolio preview response is too large."));
          return;
        }
        chunks.push(buffer);
      });
      response.on("end", () => resolve({
        status,
        location,
        contentType,
        body: Buffer.concat(chunks)
      }));
      response.on("error", reject);
    });

    request.setTimeout(8000, () => request.destroy(new Error("The portfolio website took too long to respond.")));
    request.on("error", reject);
    request.end();
  });
}

async function fetchPublicHttps(
  input: string,
  maxBytes: number,
  expectedContentType: (contentType: string) => boolean,
  redirects = 0
): Promise<SafeResponse> {
  const url = validateHttpsUrl(input);
  const address = await getPublicAddress(url.hostname);
  const response = await requestPinned(url, address, maxBytes);

  if (response.status >= 300 && response.status < 400 && response.location) {
    if (redirects >= 3) throw new Error("The portfolio website redirected too many times.");
    return fetchPublicHttps(new URL(response.location, url).toString(), maxBytes, expectedContentType, redirects + 1);
  }
  if (response.status !== 200 || !expectedContentType(response.contentType)) {
    throw new Error("The portfolio website did not return a supported preview.");
  }
  return { contentType: response.contentType, body: response.body };
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function getMetaContent(html: string, names: string[]): string {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = new Map<string, string>();
    for (const attribute of match[0].matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
      attributes.set(attribute[1].toLowerCase(), attribute[2] ?? attribute[3] ?? attribute[4] ?? "");
    }
    const key = (attributes.get("property") || attributes.get("name") || "").toLowerCase();
    const content = attributes.get("content") || "";
    if (names.includes(key) && content) return decodeHtmlEntities(content.trim());
  }
  return "";
}

export function normalizePortfolioUrl(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  if (value.length > 2048) throw new Error("Portfolio URLs must be 2,048 characters or fewer.");
  return validateHttpsUrl(value.trim()).toString();
}

export async function createPortfolioPreview(input: string, uploadImage: (buffer: Buffer) => Promise<string>) {
  const portfolioUrl = normalizePortfolioUrl(input);
  if (!portfolioUrl) throw new Error("Enter a portfolio website URL first.");

  const page = await fetchPublicHttps(portfolioUrl, 1024 * 1024, (contentType) => contentType === "text/html");
  const html = page.body.toString("utf8");
  const title = getMetaContent(html, ["og:title", "twitter:title"]).slice(0, 200);
  const description = getMetaContent(html, ["og:description", "twitter:description"]).slice(0, 500);
  const image = getMetaContent(html, ["og:image:secure_url", "og:image", "twitter:image"]);
  if (!image) return { portfolioUrl, title, description, imageUrl: "" };

  const imageUrl = new URL(image, portfolioUrl).toString();
  const fetchedImage = await fetchPublicHttps(
    imageUrl,
    5 * 1024 * 1024,
    (contentType) => ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(contentType)
  );
  return {
    portfolioUrl,
    title,
    description,
    imageUrl: await uploadImage(fetchedImage.body)
  };
}
