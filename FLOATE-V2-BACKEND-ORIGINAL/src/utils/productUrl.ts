import { createMerchantSlug } from "./merchantSlug";

function createProductSlug(productName: string): string {
  return productName
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildProductPath(productId: string, merchantNameOrSlug: string, productName?: string): string {
  const merchantSlug = createMerchantSlug(merchantNameOrSlug) || merchantNameOrSlug.trim();
  const productSlug = productName ? createProductSlug(productName) : "";
  if (merchantSlug && productSlug) {
    return `/p/${encodeURIComponent(merchantSlug)}/${encodeURIComponent(productSlug)}/${encodeURIComponent(productId)}`;
  }
  return merchantSlug
    ? `/p/${encodeURIComponent(merchantSlug)}/${encodeURIComponent(productId)}`
    : `/p/${encodeURIComponent(productId)}`;
}

export function buildProductUrl(productId: string, merchantNameOrSlug: string, productName?: string): string {
  return `https://www.floate.xyz${buildProductPath(productId, merchantNameOrSlug, productName)}`;
}
