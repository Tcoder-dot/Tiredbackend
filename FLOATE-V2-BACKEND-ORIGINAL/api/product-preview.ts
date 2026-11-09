const BACKEND_URL = (
  process.env.FLOATE_BACKEND_URL ||
  process.env.VITE_FLOATE_BACKEND_URL ||
  process.env.NEXT_PUBLIC_FLOATE_BACKEND_URL ||
  ""
).replace(/\/+$/, "");
const DEFAULT_IMAGE = "https://i.postimg.cc/mkSLsdxb/20260929-122817.jpg";

function queryValue(value: unknown): string {
  return (Array.isArray(value) ? value[0] : value || "").toString();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sendText(res: any, status: number, message: string) {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  return res.status(status).send(message);
}

function absoluteProductImage(value: unknown, id: string): string {
  if (typeof value !== "string" || !value.trim()) return DEFAULT_IMAGE;
  const image = value.trim();
  if (/^https?:\/\//i.test(image)) return image;
  if (/^data:image\//i.test(image)) {
    return `https://www.floate.xyz/product-image/${encodeURIComponent(id)}`;
  }
  return `${BACKEND_URL}/${image.replace(/^\/+/, "")}`;
}

export default async function handler(req: any, res: any) {
  const id = queryValue(req.query?.id);
  if (!id) return sendText(res, 400, "Product ID is required.");

  try {
    const productResponse = await fetch(
      `${BACKEND_URL}/api/v1/products/${encodeURIComponent(id)}`,
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) }
    );
    if (!productResponse.ok) {
      return sendText(res, productResponse.status === 404 ? 404 : 502, "Product preview is unavailable.");
    }

    const payload = await productResponse.json();
    const product = payload?.product;
    if (!payload?.success || !product) {
      return sendText(res, 404, "Product preview is unavailable.");
    }

    const vendor = product.vendor || product.merchant || {};
    const title = String(product.title || product.name || product.product || "FLOATE product").trim();
    const merchantName = String(vendor.name || vendor.businessName || product.businessName || "FLOATE merchant").trim();
    const merchantSlug = String(
      vendor.slug ||
      queryValue(req.query?.merchant) ||
      merchantName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    );
    const canonical = `https://www.floate.xyz/p/${encodeURIComponent(merchantSlug)}/${encodeURIComponent(id)}`;
    const description = String(product.description || `${title} from ${merchantName}. View the product and contact the seller on FLOATE.`)
      .trim()
      .slice(0, 300);
    const rawImage = (Array.isArray(product.photos) ? product.photos[0] : "") ||
      product.photo_url || product.photoUrl || product.imageUrl || product.image || "";
    const image = absoluteProductImage(rawImage, id);
    const priceValue = product.price_naira ?? product.price;
    const price = typeof priceValue === "number"
      ? priceValue
      : Number(String(priceValue || "").replace(/[^0-9.]/g, ""));
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${canonical}#product`,
      url: canonical,
      sku: String(product.id || id),
      name: title,
      image: [image],
      description,
      ...(Number.isFinite(price) && price > 0
        ? { offers: { "@type": "Offer", url: canonical, price, priceCurrency: "NGN" } }
        : {})
    };
    const escapedTitle = escapeHtml(title);
    const escapedDescription = escapeHtml(description);
    const escapedCanonical = escapeHtml(canonical);
    const escapedImage = escapeHtml(image);
    const seoHead = `<title>${escapedTitle} | FLOATE</title>
      <meta name="description" content="${escapedDescription}">
      <meta name="robots" content="index, follow, max-image-preview:large">
      <link rel="canonical" href="${escapedCanonical}">
      <meta property="og:title" content="${escapedTitle} | FLOATE">
      <meta property="og:description" content="${escapedDescription}">
      <meta property="og:image" content="${escapedImage}">
      <meta property="og:image:secure_url" content="${escapedImage}">
      <meta property="og:image:alt" content="${escapedTitle}">
      <meta property="og:type" content="product">
      <meta property="og:site_name" content="FLOATE">
      <meta property="og:url" content="${escapedCanonical}">
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="${escapedTitle} | FLOATE">
      <meta name="twitter:description" content="${escapedDescription}">
      <meta name="twitter:image" content="${escapedImage}">
      <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>`;
    const appResponse = await fetch("https://www.floate.xyz/index.html", {
      signal: AbortSignal.timeout(10000)
    });
    if (!appResponse.ok) throw new Error(`Could not load application shell (HTTP ${appResponse.status}).`);
    const appHtml = await appResponse.text();
    const html = appHtml.replace(
      /<!-- FLOATE SEO START -->[\s\S]*?<!-- FLOATE SEO END -->/,
      `<!-- FLOATE SEO START -->\n${seoHead}\n<!-- FLOATE SEO END -->`
    );
    if (html === appHtml) throw new Error("Application shell has no FLOATE SEO markers.");

    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (error) {
    console.error("[SEO] Vercel product preview rendering failed:", error);
    return sendText(res, 502, "Product preview could not be rendered.");
  }
}
