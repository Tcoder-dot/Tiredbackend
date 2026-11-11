import { buildProductUrl } from '../../config/siteUrls.js';

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'buy', 'can', 'for', 'find', 'get', 'i', 'in', 'is',
  'looking', 'me', 'my', 'of', 'on', 'please', 'product', 'products', 'search',
  'the', 'to', 'want', 'where', 'with', 'someone', 'need', 'service', 'services',
]);

const TERM_GROUPS = [
  ['phone', 'phones', 'mobile', 'mobiles', 'smartphone', 'smartphones', 'iphone', 'android'],
  ['laptop', 'laptops', 'notebook', 'notebooks', 'computer', 'computers', 'pc'],
  ['shoe', 'shoes', 'footwear', 'sneaker', 'sneakers', 'trainer', 'trainers'],
  ['bag', 'bags', 'handbag', 'handbags', 'purse', 'purses', 'backpack', 'backpacks'],
  ['slipper', 'slippers', 'sandal', 'sandals', 'slides', 'slide'],
  ['wig', 'wigs', 'hairpiece', 'hairpieces'],
  ['dress', 'dresses', 'gown', 'gowns'],
  ['shirt', 'shirts', 'tshirt', 'tshirts', 'tee', 'tees'],
  ['jean', 'jeans', 'denim'],
  ['trouser', 'trousers', 'pant', 'pants'],
];

function normalizeText(value: unknown): string {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\bmake[\s-]+up\b/g, 'makeup')
    .replace(/\bt[\s-]+shirts?\b/g, 'tshirt')
    .replace(/\btee\s+shirts?\b/g, 'tshirt')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeToken(token: string): string {
  if (token.length > 4 && token.endsWith('ies')) return `${token.slice(0, -3)}y`;
  if (token.length > 3 && token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1);
  return token;
}

function queryTerms(query: string): string[] {
  return [...new Set(
    normalizeText(query)
      .split(/\s+/)
      .map(normalizeToken)
      .filter((term) => term.length > 1 && !STOP_WORDS.has(term))
  )];
}

function termMatches(term: string, textTerms: Set<string>): boolean {
  if (textTerms.has(term)) return true;
  if (term === 'iphone' || term === 'android') return false;
  const group = TERM_GROUPS.find((terms) => terms.includes(term));
  return Boolean(group?.some((variant) => textTerms.has(normalizeToken(variant))));
}

export interface CatalogSearchProduct {
  id: string;
  name: string;
  title: string;
  product: string;
  price: string;
  numericPrice?: number;
  category: string;
  description: string;
  imageUrl: string;
  productUrl: string;
  vendorPhone: string;
  vendor: {
    name: string;
    phone: string;
    city: string;
    state: string;
  };
  city: string;
  state: string;
  [key: string]: unknown;
}

export interface CatalogSearchOptions {
  category?: string | null;
  inferredCategories?: string[] | null;
  maxPriceNaira?: number | null;
  itemType?: 'product' | 'service';
}

function parseListedPrice(product: any): number | null {
  const numeric = Number(product.numericPrice ?? product.price_naira);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;

  const price = String(product.price ?? product.formatted_price ?? '').trim();
  const match = price.match(/(?:₦|NGN)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|m)?/i);
  if (!match) return null;
  const value = Number(match[1].replace(/,/g, ''));
  if (!Number.isFinite(value) || value <= 0) return null;
  const multiplier = match[2]?.toLowerCase() === 'm' ? 1_000_000 :
    match[2]?.toLowerCase() === 'k' ? 1_000 : 1;
  return value * multiplier;
}

function isServiceProduct(product: any, productName: string): boolean | null {
  const listingType = String(product.listingType || product.listing_type || '').toLowerCase();
  if (/\bservice\b/.test(listingType)) return true;
  if (/\bproduct\b/.test(listingType)) return false;
  if (/\bservices?\b/.test(String(product.category || '').toLowerCase())) return true;
  if (/\b(product|goods|merchandise)\b/.test(String(product.category || '').toLowerCase())) return false;
  if (/\bservices?\b/i.test(productName)) return true;
  return null;
}

export function matchCatalogProducts(
  catalog: any[],
  query: string,
  location?: string,
  maxResults = 20,
  options: CatalogSearchOptions = {},
): CatalogSearchProduct[] {
  const terms = queryTerms(query);
  const itemAnchors = terms.filter((term) => TERM_GROUPS.some((group) => group.includes(term)));
  const inferredCategories = [options.category || '', ...(options.inferredCategories || [])]
    .map(normalizeText)
    .filter(Boolean);
  if (!terms.length && !inferredCategories.length) return [];
  const specificTerms = terms.filter((term) => /\d/.test(term));

  const normalizedLocation = normalizeText(location);
  const matched = (catalog || []).flatMap((rawProduct) => {
    const productName = String(rawProduct.product || rawProduct.name || rawProduct.title || '').trim();
    if (!productName) return [];

    const titleText = normalizeText(productName);
    const detailText = normalizeText([
      rawProduct.specs,
      rawProduct.description,
      ...(Array.isArray(rawProduct.visualTags) ? rawProduct.visualTags : []),
      rawProduct.ocrText,
    ].join(' '));
    const categoryText = normalizeText(rawProduct.category || '');
    const titleTerms = new Set(titleText.split(/\s+/).map(normalizeToken));
    const detailTerms = new Set(detailText.split(/\s+/).map(normalizeToken));
    const categoryTerms = new Set(categoryText.split(/\s+/).map(normalizeToken));
    const matchedTitleTerms = terms.filter((term) => termMatches(term, titleTerms));
    const matchedDetailTerms = terms.filter((term) => termMatches(term, detailTerms));
    const matchedCategoryTerms = terms.filter((term) => termMatches(term, categoryTerms));
    const matchedInferredCategories = inferredCategories.filter((phrase) =>
      titleText.includes(phrase) || detailText.includes(phrase) || categoryText.includes(phrase)
    );

    if (itemAnchors.length && !itemAnchors.some((term) =>
      termMatches(term, titleTerms) || termMatches(term, detailTerms)
    )) return [];
    if (specificTerms.some((term) => !termMatches(term, titleTerms) && !termMatches(term, detailTerms))) return [];
    if (
      !matchedTitleTerms.length &&
      !matchedDetailTerms.length &&
      !matchedCategoryTerms.length &&
      !(options.itemType === 'service' && matchedInferredCategories.length)
    ) return [];

    const serviceProduct = isServiceProduct(rawProduct, productName);
    if (options.itemType && serviceProduct !== null &&
      (options.itemType === 'service') !== serviceProduct) return [];

    const listedPrice = parseListedPrice(rawProduct);
    if (options.maxPriceNaira && listedPrice !== null && listedPrice > options.maxPriceNaira) return [];

    const city = String(rawProduct.city || '').trim();
    const state = String(rawProduct.state || '').trim();
    const productLocation = normalizeText(`${city} ${state}`);
    const locationMatch = normalizedLocation && productLocation.includes(normalizedLocation);
    const score =
      (titleText.includes(normalizeText(query)) ? 1000 : 0) +
      matchedTitleTerms.length * 120 +
      matchedDetailTerms.length * 30 +
      matchedCategoryTerms.length * 65 +
      matchedInferredCategories.length * 45 +
      (locationMatch ? 50 : 0) +
      (options.maxPriceNaira && listedPrice !== null ? 20 : 0) +
      (options.itemType && serviceProduct === (options.itemType === 'service') ? 10 : 0);
    const vendorName = String(rawProduct.businessName || rawProduct.vendorName || rawProduct.vendor?.name || 'Verified Merchant');
    const vendorPhone = String(rawProduct.whatsapp || rawProduct.vendorPhone || rawProduct.vendor?.whatsapp_number || '');
    const vendorSlug = vendorName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || vendorPhone || 'verified-store';
    const imageUrl = String(rawProduct.photo_url || rawProduct.photoUrl || rawProduct.imageUrl || rawProduct.image || '');
    const id = String(rawProduct.id || '');

    if (!id) return [];
    return [{
      score,
      product: {
        ...rawProduct,
        id,
        name: productName,
        title: productName,
        product: productName,
        price: String(rawProduct.price || rawProduct.formatted_price || ''),
        numericPrice: Number(rawProduct.numericPrice ?? rawProduct.price_naira) || undefined,
        category: String(rawProduct.category || ''),
        description: String(rawProduct.description || rawProduct.specs || ''),
        imageUrl,
        productUrl: buildProductUrl(id, vendorSlug),
        vendorSlug,
        vendorPhone,
        vendor: {
          ...(rawProduct.vendor || {}),
          slug: vendorSlug,
          name: vendorName,
          phone: vendorPhone,
          city,
          state,
        },
        city,
        state,
      } as CatalogSearchProduct,
    }];
  });

  matched.sort((a, b) => b.score - a.score);
  return matched.slice(0, maxResults).map(({ product }) => product);
}
