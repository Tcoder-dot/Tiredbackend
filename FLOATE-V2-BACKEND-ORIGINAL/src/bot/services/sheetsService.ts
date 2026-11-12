import { firestoreDb } from './firestoreService.js';
import { withExternalTimeout } from './timeoutService.js';
import { meilisearchClient } from './meilisearchService.js';

export interface LocalSheetRow {
  timestamp: string;
  userId: number | string;
  username: string;
  type: string;
  content: string;
}

export interface SearchLogRow {
  timestamp: string;
  buyerTelegramId: number | string;
  buyerName: string;
  searchedProduct: string;
  searchedPrice: string;
  searchedLocation: string;
  matchFound: 'Yes' | 'No';
  numberOfMatches: number;
}

export interface BusinessAppearanceLog {
  userId: string | number;
  businessName: string;
  timestamp: string;
}

export interface BusinessStats {
  allTimeAppearances: number;
  last7DaysAppearances: number;
  productCount: number;
  registeredDaysAgo: number;
}

export interface BusinessListing {
  id: string;
  userId: number | string;
  businessName: string;
  ownerFullName?: string; // Protected: Never shown to buyers in search results, saved to DB & Column M
  whatsapp: string;
  state: string;
  city: string;
  listingType: string;
  category: string;
  product: string;
  price: string;
  negotiation: 'Yes' | 'No';
  registeredSince: string;
  productCount: number;
  isVerified: boolean;
  telegramId?: string | number;
  claimDate?: string;
  verifiedStatus?: 'YES' | 'PENDING';
  sheetRowIndex?: number;
  isHighlyRecommended?: boolean;
  profileImageUrl?: string;
  verificationMediaUrl?: string;
  productImages?: string[];
  identityVerified?: boolean;
  isVerifiedPlus?: boolean;
  isBoosted?: boolean;
}

/**
 * Checks if a business name matches one of the spotlight / highly recommended vendor accounts:
 * - Chivora
 * - MAKKY LUXE
 * - Mbams
 * - goody's
 * - jules
 */
export function isSpotlightBusiness(businessName: string): boolean {
  if (!businessName) return false;
  const clean = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return (
    clean.includes('chivora') ||
    clean.includes('makkyluxe') ||
    clean.includes('makky') ||
    clean.includes('mbams') ||
    clean.includes('mbam') ||
    clean.includes('goodys') ||
    clean.includes('goody') ||
    clean.includes('jules') ||
    clean.includes('jule')
  );
}

export interface VendorMatchScore {
  listing: BusinessListing;
  totalScore: number; // 0 - 100%
  breakdown: {
    locationScore: number; // Max 35
    budgetScore: number; // Max 30
    urgencyScore: number; // Max 20
    creditHealthScore: number; // Max 15
  };
  matchBadge: '🔥 95%+ Direct Match' | '⚡ High Match' | '✅ Qualified Match' | '📍 Regional Match';
}

export interface PendingClaim {
  id: string;
  businessName: string;
  whatsapp: string;
  listingId: string;
  requestingUserId: number | string;
  requestingUsername: string;
  ownerFullName?: string; // Owner's First & Last Name (Protected, saved to DB & Column M)
  timestamp: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  selfieUrl?: string;
  identityVerified?: boolean;
}

export function normalizePhone(rawPhone: string): string {
  if (!rawPhone) return '';
  let clean = rawPhone.replace(/[^\d]/g, '');
  if (clean.startsWith('234') && clean.length === 13) {
    clean = '0' + clean.slice(3);
  } else if (clean.length === 10 && (clean.startsWith('7') || clean.startsWith('8') || clean.startsWith('9'))) {
    clean = '0' + clean;
  }
  return clean;
}

/**
 * Returns all common format representations of a phone number (e.g. 07065599116, 2347065599116, +2347065599116, 7065599116)
 */
export function getAllPhoneVariants(rawPhone: string): string[] {
  if (!rawPhone) return [];
  const clean = rawPhone.replace(/[^\d]/g, '');
  if (!clean) return [rawPhone.trim()];

  const variants = new Set<string>();
  const trimmed = rawPhone.trim();
  if (trimmed) variants.add(trimmed);
  variants.add(clean);

  // Standard Nigerian 10-digit base without country code or leading 0 (e.g. 7065599116)
  let base10 = '';
  if (clean.startsWith('234') && clean.length === 13) {
    base10 = clean.slice(3);
  } else if (clean.startsWith('0') && clean.length === 11) {
    base10 = clean.slice(1);
  } else if (clean.length === 10 && (clean.startsWith('7') || clean.startsWith('8') || clean.startsWith('9'))) {
    base10 = clean;
  }

  if (base10) {
    variants.add(base10);
    variants.add(`0${base10}`);
    variants.add(`234${base10}`);
    variants.add(`+234${base10}`);
  }

  return Array.from(variants);
}

export function escapeMarkdownText(text: string): string {
  if (!text) return '';
  return text.replace(/([*_`\[\]])/g, '\\$1');
}

/**
 * Heuristically judges whether an item/query text represents a physical product or a service.
 */
export function judgeItemTextHeuristic(itemText: string): 'product' | 'service' | 'unknown' {
  if (!itemText) return 'unknown';
  const text = itemText.toLowerCase().trim();

  const serviceKeywords = [
    'lawyer', 'attorney', 'legal', 'law firm', 'consultation', 'advocate', 'solicitor',
    'editor', 'editing', 'videographer', 'video edit', 'video editor', 'media production',
    'mechanic', 'repair', 'auto repair', 'car repair', 'servicing', 'automobile repair',
    'caterer', 'catering', 'cook', 'chef', 'food service', 'event catering',
    'photographer', 'photography', 'photo shoot',
    'designer', 'graphics', 'web design', 'ui/ux', 'branding', 'logo design',
    'developer', 'software', 'programming', 'app development', 'coder',
    'tutor', 'teacher', 'lesson', 'coaching', 'instructor', 'academic',
    'cleaner', 'cleaning', 'laundry', 'dry cleaning', 'janitor',
    'barber', 'hairdresser', 'stylist', 'hair styling', 'wig installation', 'makeup artist',
    'plumber', 'electrician', 'carpenter', 'painter', 'artisan', 'handyman',
    'driver', 'logistics', 'delivery', 'dispatch', 'courier', 'transport',
    'doctor', 'nurse', 'therapy', 'consultant', 'accountant', 'auditor',
    'tailor', 'fashion designer', 'sewing', 'alteration',
    'agent', 'broker', 'realtor', 'real estate',
    'service', 'services'
  ];

  const productKeywords = [
    'phone', 'iphone', 'samsung', 'gadget', 'laptop', 'macbook', 'computer', 'pc',
    'cloth', 'clothing', 'dress', 'gown', 'shirt', 'trouser', 'pant', 'skirt', 'wear', 'apparel',
    'shoe', 'shoes', 'slipper', 'slippers', 'sandal', 'sandals', 'footwear', 'boot', 'slides',
    'bag', 'handbag', 'backpack', 'purse', 'wallet',
    'wig', 'wigs', 'weave', 'hair extension', 'attachment',
    'generator', 'inverter', 'battery', 'solar', 'tv', 'television', 'radio',
    'cream', 'lotion', 'perfume', 'cosmetics', 'soap',
    'foodstuff', 'rice', 'oil', 'yam', 'garri', 'meat', 'fish', 'drink',
    'car', 'vehicle', 'automobile', 'spare part', 'tire',
    'furniture', 'table', 'chair', 'bed', 'mattress'
  ];

  for (const kw of serviceKeywords) {
    if (new RegExp(`\\b${kw}\\b`, 'i').test(text) || text.includes(kw)) {
      return 'service';
    }
  }

  for (const kw of productKeywords) {
    if (new RegExp(`\\b${kw}\\b`, 'i').test(text) || text.includes(kw)) {
      return 'product';
    }
  }

  return 'unknown';
}

/**
 * Combines Signal 1 (Database Type column) and Signal 2 (Gemini / Item Text judgment)
 * to determine whether an item should be phrased as a product or a service in pre-filled messages.
 */
export function determineItemType(
  itemText: string,
  listingType?: string,
  aiParsedType?: 'product' | 'service'
): 'product' | 'service' {
  // Signal 1: Database Type column
  let typeSignal: 'product' | 'service' | 'unknown' = 'unknown';
  if (listingType && typeof listingType === 'string') {
    const norm = listingType.trim().toLowerCase();
    if (norm.includes('service')) {
      typeSignal = 'service';
    } else if (norm.includes('product') || norm.includes('goods')) {
      typeSignal = 'product';
    }
  }

  // Signal 2: Gemini's independent judgment on the item text itself
  let geminiSignal: 'product' | 'service' | 'unknown' = 'unknown';
  if (aiParsedType === 'product' || aiParsedType === 'service') {
    geminiSignal = aiParsedType;
  } else if (itemText) {
    geminiSignal = judgeItemTextHeuristic(itemText);
  }

  // Combination & Conflict Resolution logic:
  // - If Gemini provides a judgment (Signal 2), use it. It confirms Type if they agree,
  //   and overrides Type if Type is mislabeled or missing.
  // - If Gemini judgment is unknown, fallback to Signal 1 (Type column).
  // - If both are unknown, default to 'product'.
  if (geminiSignal !== 'unknown') {
    return geminiSignal;
  }

  if (typeSignal !== 'unknown') {
    return typeSignal;
  }

  return 'product';
}

export function formatWhatsAppUrl(
  rawPhone: string,
  productName?: string,
  buyerFirstName?: string,
  listingType?: string,
  itemTypeHint?: 'product' | 'service',
  businessName?: string
): string {
  let clean = rawPhone.replace(/[^\d+]/g, '');
  if (clean.startsWith('0')) {
    clean = '234' + clean.slice(1);
  } else if (clean.startsWith('+')) {
    clean = clean.slice(1);
  }
  if (!clean.startsWith('234') && clean.length <= 10) {
    clean = '234' + clean;
  }

  const msg = businessName && businessName.trim()
    ? `HI ${businessName.trim().toUpperCase()}, I found you on FLOATE.`
    : `HI, I found you on FLOATE.`;
  const url = `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;

  // Ensure any parentheses inside the URL parameter string are encoded to prevent breaking Markdown links
  return url.replace(/\(/g, '%28').replace(/\)/g, '%29');
}

export function parsePriceToNumber(priceStr: string): number | null {
  if (!priceStr) return null;
  const clean = priceStr.toLowerCase().replace(/,/g, '').trim();
  if (clean.includes('k')) {
    const num = parseFloat(clean.replace(/[^\d.]/g, ''));
    if (!isNaN(num)) return num * 1000;
  }
  const digits = clean.replace(/[^\d]/g, '');
  if (digits) {
    const val = parseInt(digits, 10);
    return isNaN(val) ? null : val;
  }
  return null;
}

export function formatListingPrice(rawPrice?: string | null): string {
  if (!rawPrice) return 'Contact for price';
  const clean = String(rawPrice).trim();
  const lower = clean.toLowerCase();
  if (
    !clean ||
    lower === 'contact for price' ||
    lower === 'contact for pricing' ||
    lower === 'negotiable' ||
    lower === 'market rate' ||
    lower === 'flexible / market rate' ||
    lower === 'flexible' ||
    lower === 'best price' ||
    lower === 'call' ||
    lower === '0' ||
    lower === '₦0' ||
    lower === 'n0' ||
    lower === 'ngn 0' ||
    lower === 'free'
  ) {
    return 'Contact for price';
  }
  if (/\d/.test(clean)) {
    const withoutNaira = clean
      .replace(/^[₦\s]+/, '')
      .replace(/^naira\s*/i, '')
      .replace(/^ngn\s*/i, '')
      .trim();
    return `₦${withoutNaira}`;
  }
  return 'Contact for price';
}

export function formatListingDisplay(
  listing: BusinessListing,
  buyerFirstName?: string,
  negotiationTip?: string | null,
  searchQuery?: string,
  itemTypeHint?: 'product' | 'service',
  withholdWhatsapp: boolean = true
): string {
  const isSpotlight = listing.isHighlyRecommended || isSpotlightBusiness(listing.businessName);
  const recBadge = isSpotlight ? ' 🔥 *Top Rated Vendor*' : '';
  const verifiedBadge = listing.isVerified ? ' ✓ Verified Merchant' : '';
  const itemToBuy = searchQuery || listing.product || listing.category;

  const locationStr = listing.city && listing.state && listing.city !== listing.state 
    ? `${listing.city}, ${listing.state}` 
    : (listing.city || listing.state || 'Nigeria');
  const negBadge = listing.negotiation === 'Yes' ? ' • Negotiable' : (listing.negotiation === 'No' ? ' • Fixed Price' : '');

  const displayItem = listing.product && listing.product.toLowerCase() !== listing.category.toLowerCase()
    ? listing.product
    : listing.category;

  let waDisplay = '🔒 _Withheld until lead is qualified_';
  if (!withholdWhatsapp) {
    const waUrl = formatWhatsAppUrl(
      listing.whatsapp,
      itemToBuy,
      buyerFirstName,
      listing.listingType,
      itemTypeHint,
      listing.businessName
    );
    waDisplay = `[Message on WhatsApp](${waUrl})`;
  }

  let text = `• *${escapeMarkdownText(displayItem)}*${recBadge}\n\n` +
    `  🏬 *Business Name:* ${escapeMarkdownText(listing.businessName)}${verifiedBadge}\n` +
    `  📂 *Category:* ${escapeMarkdownText(listing.category)}\n` +
    `  💰 *Price:* ${escapeMarkdownText(listing.price)}${negBadge}\n` +
    `  📍 *Location:* ${escapeMarkdownText(locationStr)}\n` +
    `  📱 *WhatsApp:* ${waDisplay}`;

  if (listing.negotiation === 'Yes' && negotiationTip) {
    const cleanTip = negotiationTip.replace(/^💡\s*\*Negotiation Tip:\*\s*/i, '').trim();
    text += `\n\n  💡 *Negotiation Tip:* ${escapeMarkdownText(cleanTip)}`;
  }

  return text;
}

export const DEFAULT_SEED_LISTINGS: BusinessListing[] = [
  {
    id: 'seed-makkys-luxe',
    userId: 'seed-makkys-luxe',
    businessName: "MAKKY'S LUXE",
    whatsapp: '07049113767',
    state: 'Anambra',
    city: 'Main Market, Onitsha',
    listingType: 'Product',
    category: 'Jewelries, Perfumes, Decorations & Packages',
    product: 'Jewelries, Perfumes, Home & Event Decorations, Gift Packages',
    price: 'Contact for Best Price',
    negotiation: 'Yes',
    registeredSince: 'Aug 2026',
    productCount: 1,
    isVerified: true,
    isHighlyRecommended: true,
  },
  {
    id: 'seed-chivora',
    userId: 'seed-chivora',
    businessName: 'CHIVORA',
    whatsapp: '08139598835',
    state: 'Enugu',
    city: 'Enugu',
    listingType: 'Product',
    category: 'Footwear & Shoes',
    product: 'Quality Leather Shoes, Slides & Slippers',
    price: '₦15,000',
    negotiation: 'Yes',
    registeredSince: 'Jul 2026',
    productCount: 1,
    isVerified: true,
    isHighlyRecommended: true,
  },
  {
    id: 'seed-goodys',
    userId: 'seed-goodys',
    businessName: "GOODY'S COLLECTION",
    whatsapp: '08064292345',
    state: 'Anambra',
    city: 'Main Market, Onitsha',
    listingType: 'Product',
    category: 'Footwear & Slippers',
    product: 'Unisex Slippers, Leather Sandals & Slides',
    price: '₦12,000',
    negotiation: 'Yes',
    registeredSince: 'Jul 2026',
    productCount: 1,
    isVerified: true,
    isHighlyRecommended: true,
  },
  {
    id: 'seed-mbams',
    userId: 'seed-mbams',
    businessName: 'MBAMS PHONES & GADGETS',
    whatsapp: '08101234567',
    state: 'Enugu',
    city: 'Enugu',
    listingType: 'Product',
    category: 'Phones & Gadgets',
    product: 'Smartphones, iPhones, UK Used Devices & Accessories',
    price: 'Contact for Best Price',
    negotiation: 'Yes',
    registeredSince: 'Jul 2026',
    productCount: 1,
    isVerified: true,
    isHighlyRecommended: true,
  },
  {
    id: 'seed-jules',
    userId: 'seed-jules',
    businessName: 'JULES BOUTIQUE & APPAREL',
    whatsapp: '08109876543',
    state: 'Lagos',
    city: 'Balogun Market, Lagos Island',
    listingType: 'Product',
    category: 'Boutique & Fashion Wears',
    product: 'Designer Handbags, Corporate & Casual Outfits, Dresses',
    price: 'Contact for Best Price',
    negotiation: 'Yes',
    registeredSince: 'Jul 2026',
    productCount: 1,
    isVerified: true,
    isHighlyRecommended: true,
  },
  {
    id: 'seed-rich-build',
    userId: 'seed-rich-build',
    businessName: 'Rich Build',
    ownerFullName: 'Rich Chukwuemeka',
    whatsapp: '07065599116',
    state: 'Enugu',
    city: 'Enugu',
    listingType: 'Service',
    category: 'Website Development & Tech Solutions',
    product: 'Website Development, Custom Software, Tech Solutions & Mobile Apps',
    price: 'Contact for Best Price',
    negotiation: 'Yes',
    registeredSince: 'Aug 2026',
    productCount: 1,
    isVerified: true,
    isHighlyRecommended: true,
  },
];

class SheetsDatabaseService {
  // Firestore-backed listing cache for synchronous legacy lookups.
  private businessListings: BusinessListing[] = [...DEFAULT_SEED_LISTINGS];
  private lastFirestoreSyncTime = 0;

  // Short-lived cache for Firestore logs.
  private localDb: LocalSheetRow[] = [
    {
      timestamp: new Date().toISOString(),
      userId: 99912345,
      username: 'System',
      type: 'INIT',
      content: 'Firestore database initialized',
    },
  ];

  // In-memory store for SearchLogs
  private searchLogs: SearchLogRow[] = [];

  // In-memory store for tracking business search result appearances
  private businessAppearanceLogs: BusinessAppearanceLog[] = [];

  // Store for pending business claim requests
  private pendingClaims: PendingClaim[] = [];

  /**
   * Registers or updates a business listing with state and city
   */
  public async registerBusiness(data: {
    userId: number | string;
    businessName: string;
    ownerFullName?: string;
    whatsapp: string;
    state: string;
    city: string;
    listingType?: string;
    category: string;
    product: string;
    price: string;
    negotiation?: 'Yes' | 'No';
    profileImageUrl?: string;
    verificationMediaUrl?: string;
    productImages?: string[];
    identityVerified?: boolean;
  }): Promise<{ listing: BusinessListing; mode: 'firestore' | 'local'; success: boolean; error?: string }> {
    const existing = this.businessListings.find((b) => b.userId === data.userId || b.businessName.toLowerCase() === data.businessName.toLowerCase());
    const regDate = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const lType = data.listingType || 'Product';
    const isNeg = data.negotiation === 'No' ? 'No' : 'Yes';
    
    const todayDate = new Date().toISOString().split('T')[0];
    let listing: BusinessListing;
    if (existing) {
      listing = {
        ...existing,
        product: data.product,
        price: data.price,
        negotiation: isNeg,
        state: data.state,
        city: data.city,
        whatsapp: data.whatsapp,
        listingType: lType,
        category: data.category,
        productCount: existing.productCount + 1,
        telegramId: data.userId,
        claimDate: todayDate,
        verifiedStatus: 'YES',
        isVerified: true,
        ...(data.ownerFullName ? { ownerFullName: data.ownerFullName } : {}),
        ...(data.profileImageUrl ? { profileImageUrl: data.profileImageUrl } : {}),
        ...(data.verificationMediaUrl ? { verificationMediaUrl: data.verificationMediaUrl } : {}),
        ...(data.productImages?.length ? { productImages: data.productImages } : {}),
        ...(data.identityVerified !== undefined ? { identityVerified: data.identityVerified } : {}),
      };
    } else {
      listing = {
        id: `biz-${Date.now()}`,
        userId: data.userId,
        telegramId: data.userId,
        businessName: data.businessName,
        ownerFullName: data.ownerFullName,
        whatsapp: data.whatsapp,
        state: data.state,
        city: data.city,
        listingType: lType,
        category: data.category,
        product: data.product,
        price: data.price,
        negotiation: isNeg,
        registeredSince: regDate,
        productCount: 1,
        isVerified: true, // Auto-verified for active onboarding
        claimDate: todayDate,
        verifiedStatus: 'YES',
        profileImageUrl: data.profileImageUrl,
        verificationMediaUrl: data.verificationMediaUrl,
        productImages: data.productImages || [],
        identityVerified: data.identityVerified || false,
      };
    }

    await firestoreDb.syncMerchantsFromListings([listing]);
    if (existing) {
      Object.assign(existing, listing);
    } else {
      this.businessListings.unshift(listing);
    }

    // Also log to localDb for search compatibility (owner's name is kept private)
    const formattedContent = `${listing.product} | Type: ${listing.listingType} | Price: ${listing.price} | Negotiable: ${listing.negotiation} | State: ${listing.state} | City: ${listing.city} | Seller: ${listing.businessName} | WhatsApp: ${listing.whatsapp} | Category: ${listing.category} | RegDate: ${listing.registeredSince} | Products: ${listing.productCount} | Telegram ID: ${listing.telegramId} | Verified: YES`;
    this.localDb.unshift({
      timestamp: new Date().toISOString(),
      userId: data.userId,
      username: data.businessName,
      type: 'REGISTERED_SELLER',
      content: formattedContent,
    });

    return { listing, mode: 'firestore', success: true };
  }

  /**
   * Returns all current business listings
   */
  public getAllListings(): BusinessListing[] {
    return this.businessListings;
  }

  /**
   * Checks if user is a registered business
   */
  public isUserRegisteredBusiness(userId: number | string): boolean {
    return this.businessListings.some((b) => String(b.userId) === String(userId));
  }

  /**
   * Gets all business listings created by a user
   */
  public getBusinessListingsForUser(userId: number | string): BusinessListing[] {
    return this.businessListings.filter((b) => String(b.userId) === String(userId));
  }

  /**
   * Gets a specific listing by ID
   */
  public getListingById(id: string): BusinessListing | undefined {
    return this.businessListings.find((b) => b.id === id);
  }

  /**
   * Resolves a business listing by slug or name string (e.g. "connect_chivora", "chivora", "goodys_collection")
   */
  public getListingBySlugOrName(rawSlugOrName: string): BusinessListing | undefined {
    if (!rawSlugOrName) return undefined;

    const rawLower = rawSlugOrName.toLowerCase();
    const cleanStr = rawLower
      .replace(/^(connect_|lead_|connect_lead_|buy_connect_)/, '')
      .replace(/_/g, ' ')
      .replace(/[^a-z0-9 ]+/g, '')
      .trim();

    if (!cleanStr) return undefined;

    // 1. Exact match on listing ID or slug
    const exactMatch = this.businessListings.find((b) => {
      const bId = (b.id || '').toLowerCase();
      const bNameClean = (b.businessName || '').toLowerCase().replace(/[^a-z0-9 ]+/g, '').trim();
      const bSlug = (b.businessName || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').trim();
      return bId === rawLower || bSlug === rawLower || bSlug === `connect_${rawLower}` || bNameClean === cleanStr;
    });

    if (exactMatch) return exactMatch;

    // 2. Partial / substring match on business name
    const partialMatch = this.businessListings.find((b) => {
      const bNameClean = (b.businessName || '').toLowerCase().replace(/[^a-z0-9 ]+/g, '').trim();
      return bNameClean.includes(cleanStr) || cleanStr.includes(bNameClean);
    });

    if (partialMatch) return partialMatch;

    // 3. Fall back to word token matching
    const tokens = cleanStr.split(/\s+/).filter((t) => t.length > 2);
    if (tokens.length > 0) {
      return this.businessListings.find((b) => {
        const bName = (b.businessName || '').toLowerCase();
        return tokens.every((token) => bName.includes(token));
      });
    }

    return undefined;
  }

  /**
   * Updates a specific listing
   */
  public async updateListing(id: string, updates: Partial<BusinessListing>): Promise<BusinessListing | null> {
    const listing = this.businessListings.find((b) => b.id === id);
    if (!listing) return null;
    const updated = await firestoreDb.updateListingRecord(id, updates);
    if (!updated) return null;
    Object.assign(listing, updates);
    return listing;
  }

  /**
   * Deletes a listing
   */
  public async deleteListing(id: string): Promise<boolean> {
    const index = this.businessListings.findIndex((b) => b.id === id);
    if (index === -1) return false;
    await firestoreDb.deleteProductById(id);
    const removed = this.businessListings.splice(index, 1)[0];
    const remaining = this.getBusinessListingsForUser(removed.userId);
    for (const b of remaining) {
      b.productCount = remaining.length;
    }
    return true;
  }

  /**
   * Deletes all listings belonging to a business matched by their Telegram user ID or query string (e.g. '2345')
   */
  public async deleteBusinessByUserId(userId: number | string): Promise<number> {
    const initialCount = this.businessListings.length;
    const deleted = await firestoreDb.deleteMerchant(String(userId));
    this.businessListings = this.businessListings.filter((b) => String(b.userId) !== String(userId));
    const deletedCount = initialCount - this.businessListings.length;
    if (!deleted.deletedMerchant && deleted.deletedProductsCount === 0) return 0;
    await this.logInteraction(userId, 'System', 'DELETE_BUSINESS', `Removed business and deleted ${deletedCount} listings`);
    return deletedCount;
  }

  /**
   * Finds a business listing by registered WhatsApp phone number (supports all formats: 070..., 234..., +234...)
   */
  public getListingByPhone(phone: string): BusinessListing | undefined {
    if (!phone) return undefined;
    const variants = getAllPhoneVariants(phone);
    const cleanTarget = normalizePhone(phone);
    
    return this.businessListings.find((b) => {
      const bPhone = normalizePhone(b.whatsapp);
      const bVariants = getAllPhoneVariants(b.whatsapp);
      
      if (bPhone === cleanTarget) return true;
      if (cleanTarget && bPhone.endsWith(cleanTarget.slice(-8))) return true;
      for (const v of variants) {
        if (bVariants.includes(v) || b.whatsapp === v) return true;
      }
      return false;
    });
  }

  /**
   * Finds a business listing by exact or fuzzy business name
   */
  public getListingByBusinessName(name: string): BusinessListing | undefined {
    if (!name) return undefined;
    const clean = name.trim().toLowerCase();
    return this.businessListings.find((b) => {
      const bName = (b.businessName || '').toLowerCase().trim();
      return bName === clean || bName.includes(clean) || clean.includes(bName);
    });
  }

  /**
   * Deletes any merchant listing matching ID, phone, user ID or business name query (e.g., '2345')
   */
  public deleteMerchantByQuery(queryStr: string): number {
    const q = (queryStr || '').toLowerCase().trim();
    if (!q) return 0;
    const initialCount = this.businessListings.length;
    this.businessListings = this.businessListings.filter((b) => {
      const match =
        b.id.toLowerCase().includes(q) ||
        String(b.userId).toLowerCase().includes(q) ||
        (b.telegramId && String(b.telegramId).toLowerCase().includes(q)) ||
        b.whatsapp.includes(q) ||
        b.businessName.toLowerCase().includes(q);
      return !match;
    });
    const removedCount = initialCount - this.businessListings.length;
    if (removedCount > 0) {
      console.log(`[SheetsDB] Removed ${removedCount} listing(s) matching merchant query "${queryStr}"`);
    }
    return removedCount;
  }

  /**
   * Updates WhatsApp number for all listings belonging to a business user
   */
  public async updateWhatsappForBusiness(userId: number | string, newWhatsapp: string): Promise<number> {
    const listings = this.getBusinessListingsForUser(userId);
    const updatedRecords = await firestoreDb.updateMerchantWhatsappForUser(userId, newWhatsapp);
    for (const b of listings) {
      b.whatsapp = newWhatsapp;
    }
    return updatedRecords;
  }

  /**
   * Submits a pending claim request for a business by matching registered WhatsApp number
   */
  public async submitClaimRequest(
    userId: number | string,
    username: string,
    rawPhone: string,
    ownerFullName?: string,
    selfieUrl?: string
  ): Promise<{
    success: boolean;
    reason?: 'NOT_FOUND' | 'ALREADY_CLAIMED_BY_YOU' | 'ALREADY_CLAIMED_BY_OTHER' | 'ALREADY_PENDING';
    businessName?: string;
    phone?: string;
    pendingClaim?: PendingClaim;
  }> {
    await this.syncListingsFromFirestore();

    const targetPhoneNorm = normalizePhone(rawPhone);
    if (!targetPhoneNorm) {
      return { success: false, reason: 'NOT_FOUND', phone: rawPhone };
    }

    const matchingListings = this.businessListings.filter((b) => {
      const listingPhoneNorm = normalizePhone(b.whatsapp);
      return listingPhoneNorm === targetPhoneNorm;
    });

    if (matchingListings.length === 0) {
      return { success: false, reason: 'NOT_FOUND', phone: targetPhoneNorm };
    }

    const bizName = matchingListings[0].businessName;

    // Check if already officially claimed and linked to this user
    const alreadyClaimedByThisUser = matchingListings.every((b) => String(b.userId) === String(userId));
    if (alreadyClaimedByThisUser) {
      return { success: false, reason: 'ALREADY_CLAIMED_BY_YOU', businessName: bizName, phone: targetPhoneNorm };
    }

    // Check if officially claimed by another Telegram user
    const isClaimedByOther = matchingListings.some((b) => {
      const strId = String(b.userId);
      return !strId.startsWith('sheet-') && !strId.startsWith('biz-') && strId !== String(userId);
    });

    if (isClaimedByOther) {
      return { success: false, reason: 'ALREADY_CLAIMED_BY_OTHER', businessName: bizName, phone: targetPhoneNorm };
    }

    // Check if this user already has a pending claim for this business or number
    const existingPending = this.pendingClaims.find(
      (c) => c.status === 'Pending' && (String(c.requestingUserId) === String(userId) || c.whatsapp === targetPhoneNorm)
    );
    if (existingPending) {
      return { success: false, reason: 'ALREADY_PENDING', businessName: bizName, phone: targetPhoneNorm, pendingClaim: existingPending };
    }

    const claim: PendingClaim = {
      id: `claim-${Date.now()}`,
      businessName: bizName,
      whatsapp: targetPhoneNorm,
      listingId: matchingListings[0].id,
      requestingUserId: userId,
      requestingUsername: username,
      ownerFullName: ownerFullName || undefined,
      timestamp: new Date().toISOString(),
      status: 'Pending',
      selfieUrl,
      identityVerified: Boolean(selfieUrl),
    };

    if (selfieUrl) {
      for (const b of matchingListings) {
        b.profileImageUrl = selfieUrl;
        b.verificationMediaUrl = selfieUrl;
        b.identityVerified = true;
        if (ownerFullName) b.ownerFullName = ownerFullName;
      }
    }

    this.pendingClaims.unshift(claim);

    await this.logInteraction(
      userId,
      username,
      'SUBMIT_CLAIM_REQUEST',
      `Submitted claim request for "${bizName}" (${targetPhoneNorm}) with owner name "${ownerFullName || 'N/A'}" and selfie verification`
    );

    return {
      success: true,
      businessName: bizName,
      phone: targetPhoneNorm,
      pendingClaim: claim,
    };
  }

  /**
   * Retrieves all currently pending claim requests
   */
  public getPendingClaims(): PendingClaim[] {
    return this.pendingClaims.filter((c) => c.status === 'Pending');
  }

  /**
   * Retrieves a pending claim request for a specific user ID
   */
  public getPendingClaimForUser(userId: number | string): PendingClaim | undefined {
    return this.pendingClaims.find((c) => String(c.requestingUserId) === String(userId) && c.status === 'Pending');
  }

  /**
   * Approves a pending claim request and officially links the Telegram ID to the business listing
   */
  public async approveClaim(
    query: string
  ): Promise<{ success: boolean; pendingClaim?: PendingClaim; error?: string }> {
    await this.syncListingsFromFirestore();

    const q = query.trim().toLowerCase();
    const qPhoneNorm = normalizePhone(query);

    const pendingIndex = this.pendingClaims.findIndex((c) => {
      if (c.status !== 'Pending') return false;
      if (c.id.toLowerCase() === q) return true;
      if (c.businessName.toLowerCase().includes(q)) return true;
      if (qPhoneNorm && c.whatsapp.includes(qPhoneNorm)) return true;
      return false;
    });

    if (pendingIndex === -1) {
      return { success: false, error: 'NOT_FOUND' };
    }

    const claim = this.pendingClaims[pendingIndex];
    claim.status = 'Approved';

    // Officially link the listings in memory to the requesting Telegram user ID number
    const targetPhoneNorm = normalizePhone(claim.whatsapp);
    const matchingListings = this.businessListings.filter((b) => {
      const listingPhoneNorm = normalizePhone(b.whatsapp);
      return listingPhoneNorm === targetPhoneNorm || b.businessName.toLowerCase() === claim.businessName.toLowerCase();
    });

    for (const b of matchingListings) {
      b.userId = claim.requestingUserId;
      b.telegramId = claim.requestingUserId;
      if (claim.ownerFullName) b.ownerFullName = claim.ownerFullName;
      b.isVerified = true;
      b.claimDate = new Date().toISOString().split('T')[0];
      b.verifiedStatus = 'YES';
    }

    // Sync to Firestore
    firestoreDb.syncMerchantsFromListings(matchingListings).catch(() => {});

    await this.logInteraction(
      claim.requestingUserId,
      claim.requestingUsername,
      'APPROVE_CLAIM',
      `Admin approved claim for "${claim.businessName}" (${claim.whatsapp}) with owner "${claim.ownerFullName || 'N/A'}"`
    );

    return { success: true, pendingClaim: claim };
  }

  /**
   * Rejects a pending claim request
   */
  public async rejectClaim(
    query: string
  ): Promise<{ success: boolean; pendingClaim?: PendingClaim; error?: string }> {
    const q = query.trim().toLowerCase();
    const qPhoneNorm = normalizePhone(query);

    const pendingIndex = this.pendingClaims.findIndex((c) => {
      if (c.status !== 'Pending') return false;
      if (c.id.toLowerCase() === q) return true;
      if (c.businessName.toLowerCase().includes(q)) return true;
      if (qPhoneNorm && c.whatsapp.includes(qPhoneNorm)) return true;
      return false;
    });

    if (pendingIndex === -1) {
      return { success: false, error: 'NOT_FOUND' };
    }

    const claim = this.pendingClaims[pendingIndex];
    claim.status = 'Rejected';

    await this.logInteraction(
      claim.requestingUserId,
      claim.requestingUsername,
      'REJECT_CLAIM',
      `Admin rejected claim for "${claim.businessName}" (${claim.whatsapp})`
    );

    return { success: true, pendingClaim: claim };
  }

  /**
   * Claims pre-registered business account(s) by matching verified phone number
   */
  public async claimBusinessByPhone(
    userId: number | string,
    username: string,
    rawPhone: string
  ): Promise<{
    success: boolean;
    reason?: 'NOT_FOUND' | 'ALREADY_CLAIMED_BY_YOU' | 'ALREADY_CLAIMED_BY_OTHER';
    businessName?: string;
    claimedCount?: number;
    phone?: string;
  }> {
    await this.syncListingsFromFirestore();

    const targetPhoneNorm = normalizePhone(rawPhone);
    if (!targetPhoneNorm) {
      return { success: false, reason: 'NOT_FOUND', phone: rawPhone };
    }

    const matchingListings = this.businessListings.filter((b) => {
      const listingPhoneNorm = normalizePhone(b.whatsapp);
      return listingPhoneNorm === targetPhoneNorm;
    });

    if (matchingListings.length === 0) {
      return { success: false, reason: 'NOT_FOUND', phone: targetPhoneNorm };
    }

    const bizName = matchingListings[0].businessName;

    const alreadyClaimedByThisUser = matchingListings.every((b) => String(b.userId) === String(userId));
    if (alreadyClaimedByThisUser) {
      return { success: true, reason: 'ALREADY_CLAIMED_BY_YOU', businessName: bizName, claimedCount: matchingListings.length, phone: targetPhoneNorm };
    }

    const isClaimedByOther = matchingListings.some((b) => {
      const strId = String(b.userId);
      return !strId.startsWith('sheet-') && !strId.startsWith('biz-') && strId !== String(userId);
    });

    if (isClaimedByOther) {
      return { success: false, reason: 'ALREADY_CLAIMED_BY_OTHER', businessName: bizName };
    }

    for (const b of matchingListings) {
      b.userId = userId;
      b.isVerified = true;
    }

    await this.logInteraction(userId, username, 'CLAIM_BUSINESS', `Claimed business "${bizName}" via phone verified: ${targetPhoneNorm}`);

    return {
      success: true,
      businessName: bizName,
      claimedCount: matchingListings.length,
      phone: targetPhoneNorm,
    };
  }

  /**
   * Adds an extra product for an existing business listing or profile
   */
  public async addNewProductListing(
    userId: number | string,
    productName: string,
    price: string,
    fallbackProfile?: any,
    customType?: string,
    customNegotiable?: 'Yes' | 'No',
    customProductImages?: string[]
  ): Promise<{ listing: BusinessListing; mode: 'firestore' | 'local'; success: boolean; error?: string }> {
    const existingListings = this.getBusinessListingsForUser(userId);
    const base = existingListings[0];

    const bizName = base ? base.businessName : (fallbackProfile?.businessName || 'My Business');
    const wa = base ? base.whatsapp : (fallbackProfile?.businessWhatsapp || '08000000000');
    const st = base ? base.state : (fallbackProfile?.businessState || 'Nigeria');
    const ct = base ? base.city : (fallbackProfile?.businessCity || 'Nigeria');
    const cat = base ? base.category : (fallbackProfile?.businessCategory || 'General');
    const lType = customType || fallbackProfile?.tempListingType || base?.listingType || 'Product';
    const regDate = base ? base.registeredSince : new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const isNeg = customNegotiable || fallbackProfile?.tempNegotiable || base?.negotiation || 'Yes';
    const prodImages = customProductImages || fallbackProfile?.tempProductImages || fallbackProfile?.productImages || base?.productImages || [];

    const newListing: BusinessListing = {
      id: `biz-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      businessName: bizName,
      whatsapp: wa,
      state: st,
      city: ct,
      listingType: lType,
      category: cat,
      product: productName,
      price: price,
      negotiation: isNeg === 'No' ? 'No' : 'Yes',
      registeredSince: regDate,
      productCount: existingListings.length + 1,
      isVerified: true,
      productImages: prodImages,
      profileImageUrl: base?.profileImageUrl || fallbackProfile?.profileImageUrl,
      verificationMediaUrl: base?.verificationMediaUrl || fallbackProfile?.verificationMediaUrl,
      identityVerified: base?.identityVerified ?? fallbackProfile?.identityVerified,
    };

    await this.logInteraction(userId, bizName, 'ADD_PRODUCT', `${productName} | Type: ${lType} | Price: ${price} | Negotiable: ${newListing.negotiation}`);

    await firestoreDb.saveProductListing({
      userId,
      businessName: bizName,
      whatsapp: wa,
      state: st,
      city: ct,
      listingType: lType,
      category: cat,
      product: productName,
      price,
      negotiation: newListing.negotiation,
      photoUrl: prodImages[0],
    });

    for (const item of existingListings) {
      item.productCount = existingListings.length + 1;
    }
    this.businessListings.unshift(newListing);

    return { listing: newListing, mode: 'firestore', success: true };
  }

  /**
   * Adds an extra product for an existing business listing
   */
  public async addProductForBusiness(userId: number | string, product: string, price: string, listingType?: string, negotiation?: 'Yes' | 'No'): Promise<{ listing: BusinessListing; mode: 'firestore' | 'local'; success: boolean; error?: string }> {
    return this.addNewProductListing(userId, product, price, undefined, listingType, negotiation);
  }

  public async syncListingsFromFirestore(force: boolean = false): Promise<BusinessListing[]> {
    return withExternalTimeout(
      async () => {
        const now = Date.now();
        if (!force && this.lastFirestoreSyncTime > 0 && (now - this.lastFirestoreSyncTime < 30000)) {
          return this.businessListings;
        }

        const [merchants, products] = await Promise.all([
          firestoreDb.getAllMerchantsForAdmin(),
          firestoreDb.getProductsFromFirestore(),
        ]);
        const merchantsByPhone = new Map<string, Awaited<ReturnType<typeof firestoreDb.getAllMerchantsForAdmin>>[number]>();
        for (const merchant of merchants) {
          const phone = normalizePhone(merchant.whatsapp);
          if (phone) merchantsByPhone.set(phone, merchant);
        }
        const fetchedListings: BusinessListing[] = products.map((product) => {
          const merchant = merchantsByPhone.get(normalizePhone(product.whatsapp));
          const businessName = product.businessName || merchant?.businessName || '';
          return {
            id: product.id,
            userId: product.userId ?? merchant?.userId ?? product.whatsapp,
            telegramId: merchant?.telegramId,
            businessName,
            ownerFullName: merchant?.ownerFullName,
            whatsapp: product.whatsapp || merchant?.whatsapp || '',
            state: product.state || merchant?.state || '',
            city: product.city || merchant?.city || '',
            listingType: product.listingType || merchant?.listingType || 'Product',
            category: product.category || merchant?.category || 'General',
            product: product.product || merchant?.product || businessName,
            price: product.price || 'Contact for price',
            negotiation: product.negotiation === 'No' ? 'No' : 'Yes',
            registeredSince: merchant?.registeredAt || merchant?.claimDate || '',
            productCount: 1,
            isVerified: product.isVerified ?? merchant?.isVerified ?? false,
            verifiedStatus: merchant?.verifiedStatus === 'YES' || product.isVerified ? 'YES' : 'PENDING',
            profileImageUrl: merchant?.profilePhotoUrl,
            isHighlyRecommended: isSpotlightBusiness(businessName),
          };
        });

        const productPhones = new Set(fetchedListings.map((listing) => normalizePhone(listing.whatsapp)));
        for (const merchant of merchants) {
          const phone = normalizePhone(merchant.whatsapp);
          if (!merchant.product || (phone && productPhones.has(phone))) continue;
          fetchedListings.push({
            id: merchant.id,
            userId: merchant.userId ?? merchant.id,
            telegramId: merchant.telegramId,
            businessName: merchant.businessName || '',
            ownerFullName: merchant.ownerFullName,
            whatsapp: merchant.whatsapp || '',
            state: merchant.state || '',
            city: merchant.city || '',
            listingType: merchant.listingType || 'Product',
            category: merchant.category || 'General',
            product: merchant.product,
            price: merchant.price || 'Contact for price',
            negotiation: merchant.negotiation === 'No' ? 'No' : 'Yes',
            registeredSince: merchant.registeredAt || merchant.claimDate || '',
            productCount: merchant.productCount || 1,
            isVerified: merchant.isVerified ?? false,
            verifiedStatus: merchant.verifiedStatus === 'YES' || merchant.isVerified ? 'YES' : 'PENDING',
            isHighlyRecommended: isSpotlightBusiness(merchant.businessName || ''),
          });
        }

        if (merchants.length === 0 && products.length === 0) {
          await firestoreDb.syncMerchantsFromListings(DEFAULT_SEED_LISTINGS);
          fetchedListings.push(...DEFAULT_SEED_LISTINGS);
        }

        this.businessListings = fetchedListings;
        this.lastFirestoreSyncTime = now;
        await meilisearchClient.syncListings(this.businessListings);
        return this.businessListings;

      },
      {
        timeoutMs: 8500,
        serviceName: 'Firestore',
        operationName: 'syncListingsFromFirestore',
        fallbackValue: this.businessListings,
      }
    );
  }

  /**
   * Searches structured BusinessListings with exact product relevance scoring and category fallback matching
   */
  public async searchBusinessListings(
    query: string,
    targetLocation?: string | null,
    categoryHint?: string | null,
    maxPriceNaira?: number | null,
    inferredCategories?: string[] | null
  ): Promise<{
    exactMatches: BusinessListing[];
    categoryMatches: BusinessListing[];
    allMatches: BusinessListing[];
    outOfAreaRecommendations?: BusinessListing[];
    source: 'firestore';
  }> {
    await this.syncListingsFromFirestore();

    const q = (query || '').toLowerCase().trim();
    const cat = (categoryHint || '').toLowerCase().trim();
    const locFilter = targetLocation ? targetLocation.toLowerCase().trim() : null;
    const inferredList = (inferredCategories || [])
      .map((c) => c.toLowerCase().trim())
      .filter((c) => c.length > 0);

    if (!q && !cat && inferredList.length === 0) {
      return {
        exactMatches: [],
        categoryMatches: [],
        allMatches: [],
        outOfAreaRecommendations: [],
        source: 'firestore',
      };
    }

    const cleanSearchTerm = (term: string) => {
      return term
        .toLowerCase()
        .replace(/i want to buy/g, '')
        .replace(/where can i (?:find|buy|get)/g, '')
        .replace(/looking for/g, '')
        .replace(/i am looking for/g, '')
        .replace(/i need/g, '')
        .replace(/i want/g, '')
        .replace(/search for/g, '')
        .replace(/can i get/g, '')
        .trim();
    };

    const cleanQ = cleanSearchTerm(q);

    // Identify product domain keywords & synonym expansions
    const isBagQuery = /\b(bag|bags|handbag|handbags|purse|purses|tote|backpack|backpacks|clutch|clutches|duffle|leather bag|school bag|travelling bag|travel bag)\b/i.test(cleanQ);
    const isFootwearQuery = /\b(footwear|footwears|shoe|shoes|slipper|slippers|sandal|sandals|slide|slides|palm|palms|crocs|heels|boot|boots|leather slipper|leather slippers|footwear vendor|shoe vendor|sneakers|loafers)\b/i.test(cleanQ) || cleanQ.includes('slipper') || cleanQ.includes('footwear');
    const isPhoneQuery = /\b(phone|phones|iphone|samsung|gadget|gadgets|airpod|airpods|earbud|charger|powerbank|smart phone|android|screen guard|phone case|cables)\b/i.test(cleanQ);
    const isLaptopQuery = /\b(laptop|laptops|computer|macbook|pc|desktop|monitor|notebook|thinkpad|latitude|elitebook|ultrabook|computing|hard drive|ssd|keyboard|mouse)\b/i.test(cleanQ);
    const isVideoEditorQuery = /\b(video|videos|edit|editor|editing|videographer|videography|filming|motion graphics|video production|content creator|cinematography|reel|reels)\b/i.test(cleanQ);
    const isLegalQuery = /\b(lawyer|attorney|law|legal|advocate|law firm|barrister|solicitor|cac|agreement|notary|court|legal counsel)\b/i.test(cleanQ);
    const isAutoQuery = /\b(mechanic|auto|automobile|car repair|vehicle|motor|engine|panel beater|car painter|car battery|spare parts|gearbox|car electrician)\b/i.test(cleanQ);
    const isClothingQuery = /\b(cloth|clothing|dress|gown|shirt|trouser|native|native wear|fashion|tailor|sewing|senator wear|agbada|ankara|suit|jeans|hoodie|boutique)\b/i.test(cleanQ);
    const isCateringQuery = /\b(catering|caterer|food|chef|cook|wedding food|meal|restaurant|baking|cakes|pastries|small chops|shawarma|jollof|party food)\b/i.test(cleanQ);
    const isRealEstateQuery = /\b(house|apartment|flat|rent|property|real estate|agent|realtor|land|lands|self contain|duplex|shortlet|landlord|hostel|office space)\b/i.test(cleanQ);
    const isBeautyQuery = /\b(salon|hair|haircut|barber|barbing|wig|wigs|hairstylist|makeup|make up|cosmetics|skincare|skin care|braids|frontals|lashes|pedicure|manicure|spa)\b/i.test(cleanQ);
    const isSolarQuery = /\b(solar|inverter|inverters|battery|batteries|solar panel|panels|ups|energy|backup power|clean power|tubular battery|lithium)\b/i.test(cleanQ);
    const isPrintingQuery = /\b(print|printing|flyer|flyers|banner|banners|branding|graphics|sticker|stickers|business card|business cards|tshirt printing|stationery)\b/i.test(cleanQ);
    const isPhotographyQuery = /\b(photo|photography|photographer|studio|photoshoot|headshot|picture|camera|portrait|event coverage)\b/i.test(cleanQ);
    const isEventPlanningQuery = /\b(event planner|event planning|decorator|event decorator|usher|ushers|mc|master of ceremony|dj|sound system|stage|canopy|chairs)\b/i.test(cleanQ);
    const isTechWebQuery = /\b(website|websites|web\s*site|web\s*sites|web\s*app|web\s*apps|web\s*developer|web\s*design|web\s*designer|programmer|software|developer|coding|coder|frontend|backend|fullstack|seo|mobile\s*app|mobile\s*apps|application|tech\s*solutions|build\s*website|make\s*website)\b/i.test(cleanQ) || inferredList.some(inf => /website|software|tech|developer|coding|web\s*app/i.test(inf));

    const calculateRelevanceScore = (b: BusinessListing): { totalScore: number; productScore: number; isExactProductMatch: boolean; matchesLocation: boolean } => {
      const prod = b.product.toLowerCase();
      const category = b.category.toLowerCase();
      const biz = b.businessName.toLowerCase();
      const type = (b.listingType || '').toLowerCase();

      let score = 0;
      let productScore = 0;
      let exactProductMatch = false;

      // Product group domain traits & synonyms
      const isListingFootwear = /\b(footwear|footwears|shoe|shoes|slipper|slippers|sandal|sandals|slide|slides|palm|palms|crocs|heels|boot|boots|sneakers|loafers|leather slippers|leather slipper)\b/i.test(prod) || /\b(footwear|shoes|shoe)\b/i.test(category);
      const isListingBag = /\b(bag|bags|handbag|handbags|purse|purses|tote|backpack|clutch|duffle|wallet|school bag|travel bag)\b/i.test(prod) || /\b(bag|bags|handbag|luggage|leather goods)\b/i.test(category);
      const isListingPhone = /\b(phone|phones|iphone|samsung|gadget|gadgets|airpod|airpods|charger|powerbank|xiaomi|redmi|tecno|infinix|oppo|smart phone|android)\b/i.test(prod) || /\b(phone|phones|gadget|gadgets|mobile)\b/i.test(category);
      const isListingLaptop = /\b(laptop|laptops|computer|computers|macbook|pc|desktop|monitors|hp|dell|lenovo|thinkpad|latitude|elitebook|probook|pavilion|inspiron|asus|acer|toshiba|surface|notebook|ultrabook|workstation|system|systems)\b/i.test(prod) || /\b(computing|computer|computers|laptop|laptops|it|systems)\b/i.test(category);
      const isListingVideoEditor = /\b(video|edit|editor|editing|videographer|filming|motion|content creation|media production|cinematography)\b/i.test(prod) || /\b(media|video|editing|video production)\b/i.test(category);
      const isListingLegal = /\b(lawyer|attorney|law|legal|advocate|barrister|solicitor|cac|agreement|notary)\b/i.test(prod) || /\b(legal|law|legal services)\b/i.test(category);
      const isListingAuto = /\b(mechanic|auto|car|automobile|vehicle|motor|engine|spare parts|panel beater)\b/i.test(prod) || /\b(auto|mechanic|automotive)\b/i.test(category);
      const isListingClothing = /\b(cloth|clothing|dress|gown|shirt|trouser|native|fashion|tailor|sewing|senator|agbada|ankara)\b/i.test(prod) || /\b(clothing|native wear|textiles)\b/i.test(category);
      const isListingCatering = /\b(catering|caterer|food|cook|meal|baking|cakes|small chops|restaurant)\b/i.test(prod) || /\b(catering|food|hospitality)\b/i.test(category);
      const isListingRealEstate = /\b(house|apartment|flat|rent|property|real estate|realtor|land|lands|self contain|duplex|shortlet|hostel)\b/i.test(prod) || /\b(real estate|property|housing|rentals)\b/i.test(category);
      const isListingBeauty = /\b(salon|hair|barber|barbing|wig|wigs|hairstylist|makeup|cosmetics|skincare|lashes|braids|spa)\b/i.test(prod) || /\b(beauty|salon|hair|cosmetics|skincare|wellness)\b/i.test(category);
      const isListingSolar = /\b(solar|inverter|inverters|battery|batteries|solar panel|ups|energy|power)\b/i.test(prod) || /\b(solar|inverter|power|energy|electrical)\b/i.test(category);
      const isListingPrinting = /\b(print|printing|flyer|banner|graphics|sticker|business card|branding)\b/i.test(prod) || /\b(printing|branding|graphics|publishing)\b/i.test(category);
      const isListingPhotography = /\b(photo|photography|photographer|studio|photoshoot|camera|portrait)\b/i.test(prod) || /\b(photography|photo|media|studio)\b/i.test(category);
      const isListingEventPlanning = /\b(event|planner|decorator|decoration|usher|mc|dj|sound|stage|canopy)\b/i.test(prod) || /\b(events|event planning|decorations|entertainment)\b/i.test(category);
      const isListingTechWeb = (/\b(website|websites|web\s*site|web\s*sites|web\s*app|web\s*apps|software|developer|programmer|coding|mobile\s*app|mobile\s*application|seo\b|web\s*development|tech\s*solutions)\b/i.test(prod) || /\b(website|software|coding|programming|web\s*development)\b/i.test(category)) && !(/\b(accessories|gadgets|smartphones)\b/i.test(prod) && !/\b(website|software|coding|web\s*app)\b/i.test(prod));

      // DOMAIN CONFLICT DISQUALIFIERS / HEAVY PENALTIES
      if (isTechWebQuery && !isListingTechWeb) {
        return { totalScore: -999, productScore: -999, isExactProductMatch: false, matchesLocation: false };
      }
      if (isFootwearQuery && !isListingFootwear) {
        return { totalScore: -999, productScore: -999, isExactProductMatch: false, matchesLocation: false };
      }
      if (isVideoEditorQuery && !isListingVideoEditor) {
        return { totalScore: -999, productScore: -999, isExactProductMatch: false, matchesLocation: false };
      }
      if (isBagQuery && !isListingBag) {
        return { totalScore: -999, productScore: -999, isExactProductMatch: false, matchesLocation: false };
      }
      if (isPhoneQuery && !isListingPhone) {
        return { totalScore: -999, productScore: -999, isExactProductMatch: false, matchesLocation: false };
      }
      if (isLaptopQuery && !isListingLaptop) {
        return { totalScore: -999, productScore: -999, isExactProductMatch: false, matchesLocation: false };
      }
      if (isLegalQuery && !isListingLegal) {
        return { totalScore: -999, productScore: -999, isExactProductMatch: false, matchesLocation: false };
      }
      if (isAutoQuery && !isListingAuto) {
        return { totalScore: -999, productScore: -999, isExactProductMatch: false, matchesLocation: false };
      }
      if (isClothingQuery && !isListingClothing) {
        return { totalScore: -999, productScore: -999, isExactProductMatch: false, matchesLocation: false };
      }
      if (isCateringQuery && !isListingCatering) {
        return { totalScore: -999, productScore: -999, isExactProductMatch: false, matchesLocation: false };
      }
      if (isRealEstateQuery && !isListingRealEstate) {
        return { totalScore: -999, productScore: -999, isExactProductMatch: false, matchesLocation: false };
      }
      if (isBeautyQuery && !isListingBeauty) {
        return { totalScore: -999, productScore: -999, isExactProductMatch: false, matchesLocation: false };
      }
      if (isSolarQuery && !isListingSolar) {
        return { totalScore: -999, productScore: -999, isExactProductMatch: false, matchesLocation: false };
      }
      if (isPrintingQuery && !isListingPrinting) {
        return { totalScore: -999, productScore: -999, isExactProductMatch: false, matchesLocation: false };
      }
      if (isPhotographyQuery && !isListingPhotography) {
        return { totalScore: -999, productScore: -999, isExactProductMatch: false, matchesLocation: false };
      }
      if (isEventPlanningQuery && !isListingEventPlanning) {
        return { totalScore: -999, productScore: -999, isExactProductMatch: false, matchesLocation: false };
      }

      // Exact substring match in product name or listing type
      if (cleanQ && (prod.includes(cleanQ) || type.includes(cleanQ) || (category.includes(cleanQ) && cleanQ.length >= 4))) {
        productScore += 120;
        exactProductMatch = true;
      }

      // Semantic Intent & Inferred Categories matching (Gemini expanded understanding)
      const genericStopWords = new Set(['service', 'services', 'center', 'store', 'shop', 'vendor', 'general', 'business', 'other', 'company', 'firm', 'buy', 'sell', 'product', 'products', 'goods']);

      for (const inf of inferredList) {
        if (!inf || inf.length < 3) continue;

        const isInfGeneric = genericStopWords.has(inf);
        const isCatGeneric = genericStopWords.has(category);
        const isProdGeneric = genericStopWords.has(prod);

        // Direct phrase match between inferred category/term and listing product or category
        if (
          (!isInfGeneric && prod.includes(inf)) ||
          (!isInfGeneric && !isCatGeneric && category.includes(inf)) ||
          (!isInfGeneric && type.includes(inf)) ||
          (!isCatGeneric && category.length >= 4 && inf.includes(category)) ||
          (!isProdGeneric && prod.length >= 4 && inf.includes(prod))
        ) {
          productScore += 100;
          exactProductMatch = true;
          break;
        }

        // Multi-word token overlap check for semantic intent
        const infTokens = inf.split(/\s+/).filter((t) => t.length > 2 && !genericStopWords.has(t));
        let matchedTokenCount = 0;
        for (const tok of infTokens) {
          if ((!isProdGeneric && prod.includes(tok)) || (!isCatGeneric && category.includes(tok))) {
            matchedTokenCount++;
          }
        }
        if (matchedTokenCount > 0 && infTokens.length > 0) {
          productScore += 35 * matchedTokenCount;
          if (matchedTokenCount >= Math.min(2, infTokens.length) || (infTokens.length === 1 && matchedTokenCount === 1)) {
            exactProductMatch = true;
          }
        }
      }

      // Domain alignment bonuses (mild boost for exact domain alignment)
      if (isTechWebQuery && isListingTechWeb) {
        productScore += 100;
        exactProductMatch = true;
      }
      if (isBagQuery && isListingBag) {
        productScore += 80;
        exactProductMatch = true;
      }
      if (isFootwearQuery && isListingFootwear) {
        productScore += 80;
        exactProductMatch = true;
      }
      if (isPhoneQuery && isListingPhone) {
        productScore += 80;
        exactProductMatch = true;
      }
      if (isLaptopQuery && isListingLaptop) { productScore += 80; exactProductMatch = true; }
      if (isVideoEditorQuery && isListingVideoEditor) { productScore += 80; exactProductMatch = true; }
      if (isLegalQuery && isListingLegal) { productScore += 80; exactProductMatch = true; }
      if (isAutoQuery && isListingAuto) { productScore += 80; exactProductMatch = true; }
      if (isClothingQuery && isListingClothing) { productScore += 80; exactProductMatch = true; }
      if (isCateringQuery && isListingCatering) { productScore += 80; exactProductMatch = true; }
      if (isRealEstateQuery && isListingRealEstate) { productScore += 80; exactProductMatch = true; }
      if (isBeautyQuery && isListingBeauty) { productScore += 80; exactProductMatch = true; }
      if (isSolarQuery && isListingSolar) { productScore += 80; exactProductMatch = true; }
      if (isPrintingQuery && isListingPrinting) { productScore += 80; exactProductMatch = true; }
      if (isPhotographyQuery && isListingPhotography) { productScore += 80; exactProductMatch = true; }
      if (isEventPlanningQuery && isListingEventPlanning) { productScore += 80; exactProductMatch = true; }

      // Jewelry, perfume, decorations & luxury gifts
      const isJewelryQuery = /\b(jewel|jewelry|jewelries|pendant|necklace|ring|earring|perfume|perfumes|fragrance|decoration|decorations|package|packages|gift|luxury)\b/i.test(cleanQ) || inferredList.some(inf => /jewel|perfume|decorat|package|gift|luxury/i.test(inf));
      const isListingJewelry = /\b(jewel|jewelry|jewelries|perfume|perfumes|decoration|decorations|package|packages|gift|luxury)\b/i.test(prod) || /\b(jewel|jewelry|perfume|decoration|package|gift|luxury)\b/i.test(category);
      if (isJewelryQuery && isListingJewelry) {
        productScore += 100;
        exactProductMatch = true;
      }

      // Direct business name search match (e.g., user specifically searches for "Chivora", "Makky Luxe", "Mbams", "Goody's", "Jules")
      if (cleanQ && (biz.includes(cleanQ) || (cleanQ.length >= 4 && cleanQ.includes(biz)))) {
        productScore += 2500;
        exactProductMatch = true;
      }

      // Token matching
      const stopWords = new Set(['in', 'for', 'at', 'from', 'of', 'to', 'a', 'an', 'the', 'and', 'with', 'on', 'my', 'me', 'buy', 'want', 'need', 'service', 'services', 'store', 'shop']);
      const tokens = cleanQ.split(/\s+/).filter((t) => t.length > 2 && !stopWords.has(t));

      for (const tok of tokens) {
        if (prod.includes(tok)) {
          productScore += 40;
          exactProductMatch = true;
        } else if (type.includes(tok)) {
          productScore += 25;
        } else if (category.includes(tok) && !genericStopWords.has(tok)) {
          productScore += 20;
        } else if (biz.includes(tok)) {
          productScore += 15;
          exactProductMatch = true;
        }
      }

      // Category match hint
      if (cat && !genericStopWords.has(cat) && (category.includes(cat) || prod.includes(cat))) {
        productScore += 25;
        exactProductMatch = true;
      }

      // Base totalScore on productScore
      score = productScore;

      // Spotlight Business Prioritization (Modest boost within matched location)
      if (b.isHighlyRecommended || isSpotlightBusiness(b.businessName)) {
        if (exactProductMatch || productScore > 0) {
          score += 50;
        }
      }

      // Location match check with Multi-Tier Proximity & Nigerian Cluster Mapping
      let matchesLocation = true;
      if (locFilter && locFilter !== 'nigeria' && locFilter !== 'all_nigeria' && locFilter !== 'all') {
        const stateLower = (b.state || '').toLowerCase().trim();
        const cityLower = (b.city || '').toLowerCase().trim();
        const combinedLoc = `${cityLower} ${stateLower}`.trim();

        // City to state & cluster mapping for Nigeria
        const NIGERIAN_CLUSTERS: Record<string, string[]> = {
          enugu: ['enugu', 'nsukka', 'agbani', '9th mile', 'abakpa', 'gariki', 'ogui', 'coal camp', 'kenyatta', 'independence layout', 'new haven', 'trans ekulu'],
          lagos: ['lagos', 'ikeja', 'lekki', 'vi', 'victoria island', 'yaba', 'surulere', 'alaba', 'trade fair', 'oshodi', 'festac', 'ikorodu', 'apapa', 'ajah', 'ogba', 'maryland', 'gbagada', 'agege', 'idumu', 'egbeda', 'ipaja', 'balogun', 'mandilas', 'idunmota', 'island', 'mainland'],
          onitsha: ['onitsha', 'awka', 'nnewi', 'anambra', 'main market', 'emeka offor', 'head bridge', 'ogidi', 'ihiala', 'echeck', 'bridgehead'],
          anambra: ['anambra', 'onitsha', 'awka', 'nnewi', 'main market', 'emeka offor', 'head bridge', 'ogidi', 'ihiala', 'bridgehead'],
          abuja: ['abuja', 'fct', 'wuse', 'garki', 'maitama', 'gwarinpa', 'kubwa', 'jabi', 'utako', 'banex', 'lugbe', 'asokoro', 'apo', 'dei-dei', 'mararaba', 'nyanya'],
          fct: ['abuja', 'fct', 'wuse', 'garki', 'maitama', 'gwarinpa', 'kubwa', 'jabi', 'utako', 'banex', 'lugbe', 'asokoro', 'apo', 'dei-dei', 'mararaba', 'nyanya'],
          'port harcourt': ['port harcourt', 'ph', 'rivers', 'obio akpor', 'oil mill', 'garrison', 'mile 1', 'mile 2', 'mile 3', 'trans amadi', 'diobu', 'rumuokoro', 'rumuola', 'woji', 'ada george', 'choba', 'eleme', 'gra'],
          rivers: ['port harcourt', 'ph', 'rivers', 'obio akpor', 'oil mill', 'garrison', 'mile 1', 'mile 2', 'mile 3', 'trans amadi', 'diobu', 'rumuokoro', 'rumuola', 'woji', 'ada george', 'choba', 'eleme', 'gra'],
          ph: ['port harcourt', 'ph', 'rivers', 'obio akpor', 'oil mill', 'garrison', 'trans amadi', 'diobu', 'rumuokoro', 'rumuola'],
          aba: ['aba', 'umuahia', 'abia', 'ariaria', 'ngwa road', 'eheke', 'shopping center'],
          abia: ['aba', 'umuahia', 'abia', 'ariaria', 'ngwa road', 'eheke', 'shopping center'],
          ibadan: ['ibadan', 'oyo', 'dugbe', 'bodija', 'iwo road', 'mokola', 'ring road', 'challenge', 'gbagi', 'agodi', 'ui', 'apata'],
          oyo: ['ibadan', 'oyo', 'dugbe', 'bodija', 'iwo road', 'mokola', 'ring road', 'challenge', 'gbagi', 'agodi', 'ui', 'apata'],
          kano: ['kano', 'kurmi', 'kantin kwari', 'sabongari', 'fagge', 'bompai'],
          asaba: ['asaba', 'warri', 'delta', 'effurun', 'ughelli', 'sapele', 'ogwashi'],
          warri: ['warri', 'asaba', 'delta', 'effurun', 'ughelli', 'sapele'],
          delta: ['asaba', 'warri', 'delta', 'effurun', 'ughelli', 'sapele', 'ogwashi'],
          benin: ['benin', 'benin city', 'edo', 'ring road', 'ekiosa', 'oba market', 'ekpoma', 'uromi'],
          'benin city': ['benin', 'benin city', 'edo', 'ring road', 'ekiosa', 'oba market', 'ekpoma', 'uromi'],
          edo: ['benin', 'benin city', 'edo', 'ring road', 'ekiosa', 'oba market', 'ekpoma', 'uromi'],
          owerri: ['owerri', 'imo', 'orlu', 'okigwe', 'douglas', 'relief market'],
          imo: ['owerri', 'imo', 'orlu', 'okigwe', 'douglas', 'relief market'],
          uyo: ['uyo', 'akwa ibom', 'eket', 'ikot ekpene'],
          'akwa ibom': ['uyo', 'akwa ibom', 'eket', 'ikot ekpene'],
          calabar: ['calabar', 'cross river', 'ikom'],
          'cross river': ['calabar', 'cross river', 'ikom'],
          abakaliki: ['abakaliki', 'ebonyi', 'afikpo'],
          ebonyi: ['abakaliki', 'ebonyi', 'afikpo']
        };

        const locWords = locFilter.split(/[,\s]+/).filter((w) => w.length >= 3 && !['market', 'hub', 'area', 'state', 'town', 'city', 'nigeria'].includes(w));

        const isDirectCityMatch = cityLower && (cityLower === locFilter || cityLower.includes(locFilter) || locFilter.includes(cityLower));
        const isDirectStateMatch = stateLower && (stateLower === locFilter || stateLower.includes(locFilter) || locFilter.includes(stateLower));
        
        let isClusterMatch = false;
        for (const [key, cluster] of Object.entries(NIGERIAN_CLUSTERS)) {
          if (locFilter.includes(key) || key.includes(locFilter) || locWords.some((w) => w === key)) {
            if (cluster.some((c) => cityLower.includes(c) || stateLower.includes(c) || combinedLoc.includes(c))) {
              isClusterMatch = true;
              break;
            }
          }
        }

        matchesLocation = isDirectCityMatch || isDirectStateMatch || isClusterMatch || (locWords.length > 0 && locWords.some((w) => combinedLoc.includes(w)));

        // ONLY apply positive location proximity boost if the business has actual product relevance,
        // or if the user is just browsing a location without a specific search term
        const hasProductRelevance = exactProductMatch || productScore > 0 || !cleanQ;

        if (hasProductRelevance) {
          if (isDirectCityMatch) {
            score += 400; // Strongest boost for direct city
          } else if (isDirectStateMatch) {
            score += 250; // State boost
          } else if (isClusterMatch) {
            score += 200; // Regional cluster boost
          } else if (matchesLocation) {
            score += 100;
          }
        }

        if (!matchesLocation) {
          // Out of target location
          score -= 500;
        }
      }

      // Budget match check
      if (maxPriceNaira && maxPriceNaira > 0) {
        const numericPrice = parsePriceToNumber(b.price);
        if (numericPrice) {
          if (numericPrice <= maxPriceNaira) {
            score += 20;
          } else {
            score -= 100;
          }
        }
      }

      return { totalScore: score, productScore, isExactProductMatch: exactProductMatch, matchesLocation };
    };

    const scoredListings = this.businessListings
      .map((b) => ({ listing: b, ...calculateRelevanceScore(b) }));

    // Primary matches: Strictly matching the requested location when locFilter is provided, with verified product relevance
    const localScoredListings = scoredListings
      .filter((item) => (locFilter && locFilter !== 'nigeria' && locFilter !== 'all_nigeria' && locFilter !== 'all' ? item.matchesLocation : true) && item.totalScore > 0 && (!cleanQ || item.productScore > 0 || item.isExactProductMatch));
    localScoredListings.sort((a, b) => b.totalScore - a.totalScore);

    const exactMatches = localScoredListings
      .filter((item) => item.isExactProductMatch && item.totalScore >= 50 && (!cleanQ || item.productScore > 0 || item.isExactProductMatch))
      .map((item) => item.listing);

    const categoryMatches = localScoredListings
      .filter((item) => item.totalScore >= 20 && (!cleanQ || item.productScore > 0 || item.isExactProductMatch))
      .map((item) => item.listing);

    // Out-of-area recommendations: When location filter is active, find relevant merchants from other states/markets
    let outOfAreaRecommendations: BusinessListing[] = [];
    if (locFilter && locFilter !== 'nigeria' && locFilter !== 'all_nigeria' && locFilter !== 'all') {
      const outOfAreaScored = scoredListings
        .filter((item) => !item.matchesLocation && (item.isExactProductMatch || (item.productScore > 0 && item.totalScore > -100)));

      // Sort out-of-area recommendations by raw relevance
      outOfAreaScored.sort((a, b) => b.totalScore - a.totalScore);
      outOfAreaRecommendations = outOfAreaScored.map((item) => item.listing);
    }

    return {
      exactMatches,
      categoryMatches,
      allMatches: categoryMatches,
      outOfAreaRecommendations,
      source: 'firestore',
    };
  }

  /**
   * Multi-Attribute Automated Lead Matching & Prioritization Algorithm
   * Scores and ranks business responses/listings based on location, budget, urgency, and wallet credit status.
   */
  public rankVendorsForLead(
    itemOrCategory: string,
    location?: string | null,
    budget?: string | null,
    urgency?: string | null,
    overrideListings?: BusinessListing[]
  ): VendorMatchScore[] {
    const locNorm = (location || '').toLowerCase().trim();
    const budgetNorm = (budget || '').toLowerCase().trim();
    const urgencyNorm = (urgency || '').toLowerCase().trim();
    const itemNorm = (itemOrCategory || '').toLowerCase().trim();

    const pool = overrideListings && overrideListings.length > 0 ? overrideListings : this.businessListings;

    // 1. Filter candidates relevant to product/category
    const candidates = pool.filter((b) => {
      const prod = b.product.toLowerCase();
      const cat = b.category.toLowerCase();
      const type = (b.listingType || '').toLowerCase();
      if (!itemNorm) return true;
      return prod.includes(itemNorm) || cat.includes(itemNorm) || type.includes(itemNorm) || itemNorm.includes(prod) || itemNorm.includes(cat);
    });

    const listingsToScore = candidates.length > 0 ? candidates : pool;

    const scoredVendors: VendorMatchScore[] = listingsToScore.map((listing) => {
      // --- PILLAR 1: Location Proximity (Max 35) ---
      let locationScore = 0;
      const stateLower = (listing.state || '').toLowerCase();
      const cityLower = (listing.city || '').toLowerCase();
      const combinedLoc = `${cityLower} ${stateLower}`.trim();
      const locWords = locNorm.split(/[,\s]+/).filter((w) => w.length >= 3 && !['market', 'hub', 'area', 'state', 'town', 'city', 'nigeria'].includes(w));

      if (locNorm) {
        const isCityOrMarketMatch = cityLower && (locNorm.includes(cityLower) || cityLower.includes(locNorm) || (locWords.length > 0 && locWords.some((w) => cityLower.includes(w))));
        const isStateMatch = stateLower && (locNorm.includes(stateLower) || stateLower.includes(locNorm) || (locWords.length > 0 && locWords.some((w) => stateLower.includes(w))));

        if (isCityOrMarketMatch) {
          locationScore = 35; // Exact city / commercial market hub match (e.g. Main Market, Onitsha / Computer Village, Ikeja)
        } else if (isStateMatch) {
          locationScore = 28; // Same state match
        } else if (locWords.length > 0 && locWords.some((w) => combinedLoc.includes(w))) {
          locationScore = 22; // Sub-area / neighborhood overlap
        } else {
          locationScore = 5; // Cross-state / nationwide fallback
        }
      } else {
        locationScore = 20; // Neutral if no location specified
      }

      // --- PILLAR 2: Budget Alignment (Max 30) ---
      let budgetScore = 20; // Default neutral
      const listingPrice = parsePriceToNumber(listing.price);

      if (budgetNorm && listingPrice) {
        if (budgetNorm.includes('under 20') || budgetNorm.includes('under ₦20')) {
          if (listingPrice <= 20000) budgetScore = 30;
          else if (listingPrice <= 25000) budgetScore = 18; // 25% tolerance
          else budgetScore = 5;
        } else if (budgetNorm.includes('20,000 - 50,000') || budgetNorm.includes('20k - 50k') || (listingPrice >= 20000 && listingPrice <= 50000)) {
          if (listingPrice >= 18000 && listingPrice <= 55000) budgetScore = 30;
          else budgetScore = 12;
        } else if (budgetNorm.includes('above 50') || budgetNorm.includes('above ₦50')) {
          if (listingPrice >= 50000) budgetScore = 30;
          else if (listingPrice >= 35000) budgetScore = 20;
          else budgetScore = 10;
        } else if (budgetNorm.includes('flexible') || budgetNorm.includes('market rate') || listing.price.toLowerCase().includes('contact')) {
          budgetScore = 25;
        }
      } else {
        budgetScore = 22; // Flexible default
      }

      // --- PILLAR 3: Urgency & Fulfillment Capability (Max 20) ---
      let urgencyScore = 12;
      if (urgencyNorm.includes('immediately') || urgencyNorm.includes('today')) {
        // High urgency requires local presence
        if (locationScore >= 25) urgencyScore = 20;
        else if (locationScore >= 20) urgencyScore = 12;
        else urgencyScore = 5;
      } else if (urgencyNorm.includes('24-48') || urgencyNorm.includes('hours')) {
        if (locationScore >= 20) urgencyScore = 20;
        else urgencyScore = 12;
      } else {
        // Flexible urgency
        urgencyScore = 18;
      }

      // --- PILLAR 4: Merchant Reputation & Credit Health (Max 15) ---
      let creditHealthScore = 15; // Active registered listing

      const totalScore = locationScore + budgetScore + urgencyScore + creditHealthScore;

      let matchBadge: VendorMatchScore['matchBadge'] = '✅ Qualified Match';
      if (totalScore >= 90) matchBadge = '🔥 95%+ Direct Match';
      else if (totalScore >= 75) matchBadge = '⚡ High Match';
      else if (locationScore < 20) matchBadge = '📍 Regional Match';

      return {
        listing,
        totalScore,
        breakdown: {
          locationScore,
          budgetScore,
          urgencyScore,
          creditHealthScore,
        },
        matchBadge,
      };
    });

    // Sort descending by total composite score
    return scoredVendors.sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Appends a bot interaction record to Firestore.
   */
  public async logInteraction(userId: number | string, username: string, type: string, content: string): Promise<{ success: boolean; mode: 'firestore'; message: string }> {
    const timestamp = new Date().toISOString();
    const row: LocalSheetRow = { timestamp, userId, username, type, content };
    await firestoreDb.logBotInteraction(row);
    this.localDb.unshift(row);
    if (this.localDb.length > 100) this.localDb.pop();

    return { success: true, mode: 'firestore', message: 'Saved to Firestore.' };
  }

  /**
   * Searches Firestore bot interaction logs for rows matching a query string.
   */
  public async searchDatabase(query: string): Promise<{ matches: LocalSheetRow[]; totalSearched: number; source: 'firestore' }> {
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) {
      return { matches: [], totalSearched: 0, source: 'firestore' };
    }

    const rows = await firestoreDb.getBotInteractions();
    const matches = rows.filter((row) =>
      row.content.toLowerCase().includes(cleanQuery) ||
      row.username.toLowerCase().includes(cleanQuery) ||
      row.type.toLowerCase().includes(cleanQuery)
    );

    return {
      matches,
      totalSearched: rows.length,
      source: 'firestore',
    };
  }

  /**
   * Retrieves recent bot interaction records from Firestore.
   */
  public async getRecentLogs(): Promise<{ rows: LocalSheetRow[] }> {
    const rows = await firestoreDb.getBotInteractions();
    return { rows: rows.slice(0, 20) };
  }

  /**
   * Logs buyer search queries to Firestore automatically.
   * Columns: Timestamp, Buyer Telegram ID, Buyer Name, Searched Product, Searched Price, Searched Location, Match Found (Yes/No), Number of Matches
   */
  public async logSearch(
    buyerId: number | string,
    buyerName: string,
    searchedProduct: string,
    searchedPrice: string,
    searchedLocation: string,
    matchFound: boolean,
    numberOfMatches: number,
    matchedMerchantPhones: string[] = [],
    matchedProductIds: string[] = [],
    channel: 'whatsapp' | 'telegram' | 'web' = 'telegram'
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const row: SearchLogRow = {
      timestamp,
      buyerTelegramId: buyerId,
      buyerName: buyerName || 'Buyer',
      searchedProduct: searchedProduct || 'General',
      searchedPrice: searchedPrice || 'Any',
      searchedLocation: searchedLocation || 'Any',
      matchFound: matchFound ? 'Yes' : 'No',
      numberOfMatches,
    };

    this.searchLogs.unshift(row);
    if (this.searchLogs.length > 200) this.searchLogs.pop();

    await firestoreDb.logSearch({
      buyerTelegramId: row.buyerTelegramId,
      buyerName: row.buyerName,
      searchedProduct: row.searchedProduct,
      searchedPrice: row.searchedPrice,
      searchedLocation: row.searchedLocation,
      matchFound: row.matchFound,
      numberOfMatches: row.numberOfMatches,
      matchedMerchantPhones,
      matchedProductIds,
      channel,
      timestamp: row.timestamp,
    });
  }

  /**
   * Records that businesses appeared in a buyer search result
   */
  public recordBusinessAppearances(listings: BusinessListing[]): void {
    if (!listings || listings.length === 0) return;
    const now = new Date().toISOString();
    const recordedUsers = new Set<string>();

    for (const listing of listings) {
      const uIdKey = String(listing.userId);
      if (!recordedUsers.has(uIdKey)) {
        recordedUsers.add(uIdKey);
        this.businessAppearanceLogs.unshift({
          userId: listing.userId,
          businessName: listing.businessName,
          timestamp: now,
        });
      }
    }
    if (this.businessAppearanceLogs.length > 500) {
      this.businessAppearanceLogs.length = 500;
    }
  }

  /**
   * Calculates stats for a registered business
   */
  public getBusinessStats(userId: number | string): BusinessStats {
    const userStr = String(userId);
    const userAppearances = this.businessAppearanceLogs.filter((log) => String(log.userId) === userStr);
    const allTimeAppearances = userAppearances.length;

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const last7DaysAppearances = userAppearances.filter((log) => {
      const t = new Date(log.timestamp).getTime();
      return !isNaN(t) && t >= sevenDaysAgo;
    }).length;

    const listings = this.getBusinessListingsForUser(userId);
    const productCount = listings.length;

    let registeredDaysAgo = 1;
    if (listings.length > 0) {
      // Find earliest registeredSince or default
      const regSince = listings[0].registeredSince;
      // If we have date string, estimate or default to 9 days if fresh
      registeredDaysAgo = 9;
    }

    return {
      allTimeAppearances,
      last7DaysAppearances,
      productCount,
      registeredDaysAgo,
    };
  }

  /**
   * Returns all current business listings in memory
   */
  public getAllBusinessListings(): BusinessListing[] {
    return [...this.businessListings];
  }
}

export const sheetsDb = new SheetsDatabaseService();
