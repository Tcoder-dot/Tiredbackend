const BACKEND_URL = (
  process.env.FLOATE_BACKEND_URL ||
  process.env.VITE_FLOATE_BACKEND_URL ||
  process.env.NEXT_PUBLIC_FLOATE_BACKEND_URL ||
  ""
).replace(/\/+$/, "");

function queryValue(value: unknown): string {
  return (Array.isArray(value) ? value[0] : value || "").toString();
}

function sendText(res: any, status: number, message: string) {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  return res.status(status).send(message);
}

export default async function handler(req: any, res: any) {
  const id = queryValue(req.query?.id);
  if (!id) return sendText(res, 400, "Product ID is required.");

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/products/${encodeURIComponent(id)}`,
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) }
    );
    if (!response.ok) {
      return sendText(res, response.status === 404 ? 404 : 502, "Product image is unavailable.");
    }

    const payload = await response.json();
    const product = payload?.product;
    const image = (Array.isArray(product?.photos) ? product.photos[0] : "") ||
      product?.photo_url || product?.photoUrl || product?.imageUrl || product?.image || "";

    if (typeof image !== "string" || !image.trim()) {
      return sendText(res, 404, "Product image is unavailable.");
    }

    if (/^https?:\/\//i.test(image)) return res.redirect(302, image);
    if (!/^data:image\//i.test(image)) {
      const path = image.replace(/^\/+/, "");
      return res.redirect(302, `${BACKEND_URL}/${path}`);
    }
    if (!/^data:image\/(?:jpe?g|png|webp|gif);base64,/i.test(image) || image.length > 11_200_000) {
      return sendText(res, 404, "Product image is unavailable.");
    }

    const match = image.match(/^data:(image\/(?:jpe?g|png|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/i);
    if (!match) return sendText(res, 404, "Product image is unavailable.");

    const bytes = Buffer.from(match[2].replace(/\s/g, ""), "base64");
    if (!bytes.length || bytes.length > 8 * 1024 * 1024) {
      return sendText(res, 404, "Product image is unavailable.");
    }

    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Type", match[1].toLowerCase());
    return res.status(200).send(bytes);
  } catch (error) {
    console.error("[SEO] Vercel product image resolution failed:", error);
    return sendText(res, 502, "Product image could not be loaded.");
  }
}
