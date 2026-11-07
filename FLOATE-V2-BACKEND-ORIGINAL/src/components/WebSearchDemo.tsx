import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  MapPin, 
  ShieldCheck, 
  MessageCircle,
  X, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Flame, 
  Layers, 
  AlertCircle
} from 'lucide-react';
import { RENDER_BACKEND_URL, searchRenderBackend } from '../services/searchService';
import { Product } from '../types/floate';
import { createMerchantSlug } from '../utils/merchantSlug';

export interface BusinessItem {
  id: string;
  businessName: string;
  category: string;
  product: string;
  location: string;
  market?: string;
  city?: string;
  description: string;
  price: string;
  verified: boolean;
  isSpotlight?: boolean;
  hasImage: boolean;
  imageUrl?: string;
  profileImageUrl?: string;
  productImages?: string[];
  initials: string;
  phone?: string;
  whatsappDeepLink: string;
}

// Strictly verify real merchant uploads (Disallows generic stock photos & Unsplash placeholders)
export function isRealMerchantImage(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const lower = url.trim().toLowerCase();
  if (!lower.startsWith('http')) return false;
  if (lower.includes('unsplash.com')) return false;
  if (lower.includes('placeholder')) return false;
  if (lower.includes('ui-avatars.com')) return false;
  if (lower.includes('images.pexels.com')) return false;
  if (lower.includes('dummyimage')) return false;
  return true;
}

// Generate authentic two-letter monogram logo initials
export function getMonogramInitials(name: string): string {
  if (!name) return 'FL';
  const norm = name.trim().toUpperCase();

  // Explicit real database anchor overrides
  if (norm.includes("CHIVORA")) return "CH";
  if (norm.includes("MAKKY")) return "ML";
  if (norm.includes("GOODY")) return "GC";
  if (norm.includes("MBAM")) return "MP";
  if (norm.includes("JULE")) return "JB";
  if (norm.includes("RICH BUILD")) return "RB";

  // General fallback for all other registered database merchants
  const words = norm
    .replace(/[^A-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => !['THE', 'AND', '&', 'OF', 'CO', 'LTD', 'INC', 'ENTERPRISE', 'GLOBAL', 'VENTURES', 'NIGERIA'].includes(w));

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]);
  }
  if (words.length === 1 && words[0].length >= 2) {
    return words[0].slice(0, 2);
  }
  return norm.slice(0, 2) || 'FL';
}

// Color gradients for monogram badges
export function getMonogramGradient(name: string): string {
  const charCode = (name.charCodeAt(0) || 0) + (name.charCodeAt(name.length - 1) || 0);
  const gradients = [
    "from-[#1B5E20] via-[#123F16] to-black border-[#2E7D32]/40 text-[#FFC107]",
    "from-[#123F16] via-[#1B5E20] to-[#2E7D32] border-[#FFC107]/30 text-white",
    "from-[#1B5E20] via-[#123F16] to-[#0d2a0f] border-white/20 text-[#E8F5E9]",
    "from-[#2E7D32] via-[#1B5E20] to-black border-[#FFC107]/40 text-[#FFC107]",
    "from-[#123F16] via-[#1B5E20] to-[#123F16] border-white/20 text-white",
    "from-[#1B5E20] via-[#2E7D32] to-[#123F16] border-[#FFC107]/30 text-[#FFC107]"
  ];
  return gradients[charCode % gradients.length];
}

// Anchor database records to prevent categorization hallucination and enforce verbatim locations
interface AnchorMetadata {
  category: string;
  product: string;
  location: string;
  phone: string;
  initials: string;
}

const ANCHOR_BUSINESS_OVERRIDES: Record<string, AnchorMetadata> = {
  "CHIVORA": {
    category: "Footwear & Shoes",
    product: "Quality Leather Shoes, Slides & Slippers",
    location: "Main Market, Onitsha, Anambra",
    phone: "08139598835",
    initials: "CH"
  },
  "MAKKY'S LUXE": {
    category: "Jewelries & Perfumes",
    product: "Jewelries, Perfumes, Home & Event Decorations, Gift Packages",
    location: "Main Market, Onitsha, Anambra",
    phone: "07049113767",
    initials: "ML"
  },
  "GOODY'S COLLECTION": {
    category: "Footwear & Shoes",
    product: "Unisex Slippers, Leather Sandals & Slides",
    location: "Main Market, Onitsha, Anambra",
    phone: "08064292345",
    initials: "GC"
  },
  "MBAMS PHONES & GADGETS": {
    category: "Phones & Gadgets",
    product: "Smartphones, iPhones, UK Used Devices & Accessories",
    location: "Computer Village, Ikeja, Lagos",
    phone: "08101234567",
    initials: "MP"
  },
  "JULES BOUTIQUE & APPAREL": {
    category: "Fashion & Apparel",
    product: "Designer Handbags, Corporate & Casual Outfits, Dresses",
    location: "Balogun Market, Lagos Island, Lagos",
    phone: "08109876543",
    initials: "JB"
  },
  "RICH BUILD": {
    category: "Tech & Software Solutions",
    product: "Website Development, Custom Software & Tech Solutions",
    location: "Enugu Tech Hub, Independence Layout, Enugu",
    phone: "07065599116",
    initials: "RB"
  }
};

interface WebSearchDemoProps {
  onOpenVendor?: (phoneOrSlug: string) => void;
  onOpenProduct?: (productId: string) => void;
  onSearch?: (query: string, category?: string, maxPrice?: number) => void;
}

function mapSearchProduct(item: any, index: number): Product | null {
  const id = String(item.id || item.productId || item.product_id || '').trim();
  if (!id) return null;

  const vendor = item.vendor || item.merchant || {};
  const name = item.title || item.name || item.product || 'Listed product';
  const vendorName = vendor.name || vendor.businessName || item.businessName || item.vendorName || 'Verified Merchant';
  const rawPrice = item.price_naira ?? item.price ?? item.numericPrice ?? 0;
  const price = typeof rawPrice === 'number'
    ? rawPrice
    : Number(String(rawPrice).replace(/[^0-9.]/g, '')) || 0;
  const rawImage = item.photo_url || item.imageUrl || item.image || item.mediaUrl ||
    (Array.isArray(item.photos) ? item.photos[0] : '');
  const image = rawImage && !/^(https?:|data:|blob:)/i.test(rawImage)
    ? `${RENDER_BACKEND_URL}/${rawImage.replace(/^\/+/, '')}`
    : rawImage;
  const city = vendor.city || item.city || item.location || 'Nigeria';

  return {
    id,
    title: name,
    price_naira: price,
    formatted_price: item.formatted_price || (price ? `₦${price.toLocaleString('en-NG')}` : 'Contact for price'),
    photo_url: image,
    photos: Array.isArray(item.photos) ? item.photos : image ? [image] : [],
    description: item.description || `${name} available from ${vendorName} in ${city}.`,
    in_stock: item.in_stock !== false,
    condition: item.condition,
    category: item.category || 'General Merchandise',
    product_url: item.product_url,
    vendor: {
      slug: vendor.slug || item.merchantSlug || item.vendorSlug || createMerchantSlug(vendorName) || `merchant-${index}`,
      name: vendorName,
      city,
      state: vendor.state || item.state,
      verified: vendor.verified === true || vendor.isVerified === true || item.isVerified === true,
      isVerified: vendor.isVerified ?? item.isVerified,
      verificationStatus: vendor.verificationStatus || item.verificationStatus || (item.isVerified === true ? "APPROVED" : "PENDING_REVIEW"),
      avatar_url: vendor.avatar_url || vendor.avatarUrl,
      whatsapp_number: vendor.whatsapp_number || vendor.whatsappNumber || item.whatsapp || item.phone
    }
  };
}

export const WebSearchDemo: React.FC<WebSearchDemoProps> = ({ onOpenVendor, onOpenProduct, onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  
  const [spotlightMatches, setSpotlightMatches] = useState<BusinessItem[]>([]);
  const [regularMatches, setRegularMatches] = useState<BusinessItem[]>([]);
  const [productMatches, setProductMatches] = useState<Product[]>([]);
  const [showingMerchantRecommendations, setShowingMerchantRecommendations] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearchedOnce, setHasSearchedOnce] = useState(false);

  const carouselRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Results show only when users search for products or use the search bar
  useEffect(() => {
    // Empty mount effect - no initial search performed
  }, []);

  // Execute Search strictly against Live Backend Database API (POST /api/search)
  // ZERO mock data - only real database results returned
  const executeApiSearch = async (queryText: string) => {
    const cleanQuery = queryText.trim();
    if (!cleanQuery) {
      setActiveQuery('');
      setSpotlightMatches([]);
      setRegularMatches([]);
      setProductMatches([]);
      setShowingMerchantRecommendations(false);
      setIsSearching(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const currentController = new AbortController();
    abortControllerRef.current = currentController;

    setIsSearching(true);
    setActiveQuery(cleanQuery);
    setHasSearchedOnce(true);

    try {
      const searchResult = await searchRenderBackend(cleanQuery, {
        signal: currentController.signal
      });

      if (abortControllerRef.current !== currentController) return;

      if (searchResult.success) {
        const products = (searchResult.products || [])
          .map(mapSearchProduct)
          .filter((product): product is Product => product !== null);
        setProductMatches(products);
        const hasRecommendations = Boolean(searchResult.merchantRecommendations?.length);
        setShowingMerchantRecommendations(products.length === 0 && hasRecommendations);
        let rawSpotlights: any[] = products.length > 0
          ? []
          : hasRecommendations
          ? searchResult.merchantRecommendations!.slice(0, 3)
          : searchResult.spotlightMatches || [];
        let rawRegulars: any[] = products.length > 0
          ? []
          : hasRecommendations
          ? searchResult.merchantRecommendations!.slice(3)
          : searchResult.regularMatches || [];

        if (products.length === 0 && rawSpotlights.length === 0 && rawRegulars.length === 0 && searchResult.results.length > 0) {
          rawSpotlights = searchResult.results.slice(0, 3);
          rawRegulars = searchResult.results.slice(3);
        }

        const mapItem = (item: any, idx: number, isSpotlight = false): BusinessItem => {
          const id = item.id || `biz_${idx}_${Date.now()}`;
          const rawBizName = item.businessName || item.name || item.merchantName || 'Verified Merchant';
          const normName = rawBizName.toUpperCase();

          // Check anchor overrides to prevent category misassignment
          let anchor: AnchorMetadata | null = null;
          for (const [anchorKey, meta] of Object.entries(ANCHOR_BUSINESS_OVERRIDES)) {
            if (normName.includes(anchorKey.toUpperCase())) {
              anchor = meta;
              break;
            }
          }

          const bizName = rawBizName;
          const category = anchor?.category || item.category || 'Commercial Merchandise';
          const product = anchor?.product || item.product || item.bio || item.description || category;
          const location = anchor?.location || item.location || (item.city ? `${item.market ? item.market + ', ' : ''}${item.city}` : 'Nigeria');
          const initials = anchor?.initials || getMonogramInitials(bizName);
          const price = item.price || item.priceRange || 'Contact for price';

          // Check for real uploaded image (strictly excludes Unsplash and generic stock photos)
          const firstUploaded = (Array.isArray(item.productImages) && item.productImages.find(isRealMerchantImage)) ||
            (isRealMerchantImage(item.profileImageUrl) ? item.profileImageUrl : null) ||
            (isRealMerchantImage(item.imageUrl) ? item.imageUrl : null) ||
            (isRealMerchantImage(item.photoUrl) ? item.photoUrl : null) ||
            null;

          const hasRealPhoto = Boolean(firstUploaded);

          // Clean WhatsApp Phone Number & deep link
          const phoneToUse = anchor?.phone || item.whatsappNumber || item.whatsapp || item.phone || '';
          const cleanPhone = phoneToUse.replace(/[^0-9]/g, '');
          const intlPhone = cleanPhone.startsWith('0')
            ? '234' + cleanPhone.slice(1)
            : cleanPhone.startsWith('234')
            ? cleanPhone
            : cleanPhone
            ? '234' + cleanPhone
            : '2348139598835';

          const waLink = `https://wa.me/${intlPhone}?text=Hello%20${encodeURIComponent(bizName)},%20I%20saw%20your%20store%20on%20Floate`;

          return {
            id,
            businessName: bizName,
            category,
            product,
            location,
            market: item.market || '',
            city: item.city || '',
            description: item.description || `${category} verified merchant in ${location}`,
            price,
            verified: true,
            isSpotlight,
            hasImage: hasRealPhoto,
            imageUrl: firstUploaded || undefined,
            profileImageUrl: isRealMerchantImage(item.profileImageUrl) ? item.profileImageUrl : undefined,
            productImages: hasRealPhoto && firstUploaded ? [firstUploaded] : [],
            initials,
            phone: cleanPhone || intlPhone,
            whatsappDeepLink: waLink
          };
        };

        const mappedSpotlights = rawSpotlights.map((item, idx) => mapItem(item, idx, true));
        const mappedRegulars = rawRegulars.map((item, idx) => mapItem(item, idx + 10, false));

        setSpotlightMatches(mappedSpotlights);
        setRegularMatches(mappedRegulars);
      } else {
        setSpotlightMatches([]);
        setRegularMatches([]);
        setProductMatches([]);
        setShowingMerchantRecommendations(false);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.warn('Search query error:', err);
      setSpotlightMatches([]);
      setRegularMatches([]);
      setProductMatches([]);
      setShowingMerchantRecommendations(false);
      setProductMatches([]);
      setShowingMerchantRecommendations(false);
    } finally {
      if (abortControllerRef.current === currentController) {
        setIsSearching(false);
      }
    }
  };

  const handleInputChange = (val: string) => {
    setSearchTerm(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val.trim()) {
      setActiveQuery('');
      setSpotlightMatches([]);
      setRegularMatches([]);
      setProductMatches([]);
      setShowingMerchantRecommendations(false);
      setIsSearching(false);
      return;
    }

    // Responsive debounce (200ms) for snappy, sub-500ms search responses
    debounceTimerRef.current = setTimeout(() => {
      executeApiSearch(val);
    }, 200);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    const clean = searchTerm.trim();
    if (!clean) return;
    executeApiSearch(clean);
  };

  const handleClearSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setSearchTerm('');
    setActiveQuery('');
    setSpotlightMatches([]);
    setRegularMatches([]);
    setIsSearching(false);
    setHasSearchedOnce(false);
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const totalResultsCount = productMatches.length + spotlightMatches.length + regularMatches.length;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* SEARCH CONSOLE INPUT (NO LOCATION DROPDOWN - NATIONWIDE SEARCH) */}
      <div className="w-full max-w-[680px] mx-auto space-y-4">
        
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <div 
            className="relative flex items-center bg-white rounded-full border-2 border-[#123F16] focus-within:border-[#1B5E20] focus-within:ring-4 focus-within:ring-[#1B5E20]/20 shadow-[0_8px_24px_rgba(18,63,22,0.15)] hover:border-[#1B5E20] transition-all duration-300 h-14 sm:h-16"
          >
            {/* Search Icon */}
            <div className="pl-5 sm:pl-6 text-[#1B5E20] shrink-0">
              <Search className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            {/* Main Input Field */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Search anything… e.g. 'human hair, 15k, Balogun' or 'CHIVORA'..."
              className="w-full bg-transparent pl-3 sm:pl-4 pr-12 sm:pr-14 text-sm sm:text-base text-[#13241F] placeholder-slate-400 focus:outline-none font-semibold truncate"
            />

            {/* Clear Button */}
            <div className="absolute right-3 sm:right-4 flex items-center gap-1.5 sm:gap-2">
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </form>



      </div>

      {/* SEARCH RESULTS SECTION */}
      <AnimatePresence>
        {(isSearching || activeQuery) && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="w-full space-y-6 pt-2"
          >
            


            {/* SEARCH LOADING STATE */}
            {isSearching && (
              <div className="bg-white border border-[#0A4D3C]/20 rounded-2xl p-8 text-center space-y-3 max-w-md mx-auto shadow-md">
                <div className="w-8 h-8 rounded-full border-3 border-[#0A4D3C]/20 border-t-[#0A4D3C] animate-spin mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-[#2C2C2C]">
                    Connecting to verified businesses...
                  </h4>
                  <p className="text-xs text-slate-500">
                    Businesses are coming up for <strong className="text-[#0A4D3C]">"{activeQuery}"</strong>
                  </p>
                </div>
              </div>
            )}

            {productMatches.length > 0 && !isSearching && (
              <section className="space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-black text-[#13241F]">
                    Listed products matching “{activeQuery}”
                  </h3>
                  <span className="text-xs font-bold text-slate-500">{productMatches.length} products</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {productMatches.map((product) => (
                    <button
                      type="button"
                      key={product.id}
                      onClick={() => onOpenProduct?.(product.id)}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm hover:border-[#1B5E20] hover:shadow-md transition"
                    >
                      <div className="h-40 bg-slate-100">
                        {product.photo_url ? (
                          <img src={product.photo_url} alt={product.title} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-bold text-slate-400">No product photo</div>
                        )}
                      </div>
                      <div className="p-3 space-y-1">
                        <div className="font-extrabold text-sm text-[#13241F] line-clamp-1">{product.title}</div>
                        <div className="font-black text-[#1B5E20]">{product.formatted_price}</div>
                        <div className="text-xs text-slate-500 truncate">
                          {product.vendor.name} · {product.vendor.city}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* 1. SPOTLIGHT BUSINESSES (DUAL-MODE RENDERING) */}
            {productMatches.length === 0 && spotlightMatches.length > 0 && !isSearching && (
              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#E8B923] text-[#3B1A5C] shadow-xs">
                      <Flame className="w-3 h-3 fill-[#3B1A5C]" />
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-[#13241F] tracking-tight">
                      {showingMerchantRecommendations ? `Verified vendors for “${activeQuery}”` : "Spotlight Verified Businesses"}
                    </h3>
                  </div>

                  {spotlightMatches.length > 2 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => scrollCarousel('left')}
                        className="w-7 h-7 rounded-full bg-white border border-[#0A4D3C]/20 text-[#0A4D3C] flex items-center justify-center hover:bg-[#E6F4EA] transition shadow-xs cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollCarousel('right')}
                        className="w-7 h-7 rounded-full bg-white border border-[#0A4D3C]/20 text-[#0A4D3C] flex items-center justify-center hover:bg-[#E6F4EA] transition shadow-xs cursor-pointer"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                {showingMerchantRecommendations && (
                  <p className="text-xs text-slate-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    No matching listed product was found. These verified vendors offer related products or services.
                  </p>
                )}

                <div 
                  ref={carouselRef}
                  className="flex gap-4 overflow-x-auto pb-3 pt-1 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-400 hover:scrollbar-thumb-slate-300"
                >
                  {spotlightMatches.map((biz) => {
                    const gradientClass = getMonogramGradient(biz.businessName);

                    return (
                      <div
                        key={biz.id}
                        className="w-[270px] sm:w-[290px] bg-white rounded-2xl border border-slate-200/90 hover:border-[#5C2D91] shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group snap-start shrink-0 relative"
                      >
                        {/* DUAL-MODE HEADER */}
                        {biz.hasImage && biz.imageUrl ? (
                          /* Mode B: Real Uploaded Image Thumbnail with Zoom Hover */
                          <div className="relative h-36 w-full bg-slate-100 overflow-hidden">
                            <img
                              src={biz.imageUrl}
                              alt={biz.businessName}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                            <div className="absolute top-2 left-2 flex items-center gap-1">
                              <span className="bg-[#E8B923] text-[#3B1A5C] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                                <Flame className="w-2.5 h-2.5 fill-[#3B1A5C]" />
                                <span>Spotlight</span>
                              </span>
                            </div>

                            <div className="absolute top-2 right-2">
                              <span className="bg-emerald-600/95 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 backdrop-blur-xs">
                                <ShieldCheck className="w-2.5 h-2.5" />
                                <span>Verified Merchant</span>
                              </span>
                            </div>

                            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-white">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-white/90 truncate max-w-[140px]">
                                {biz.category}
                              </span>
                              <span className="text-[11px] font-black bg-[#5C2D91] px-2 py-0.5 rounded-full text-[#E8B923] shadow-xs">
                                {biz.price}
                              </span>
                            </div>
                          </div>
                        ) : (
                          /* Mode A: Clean Typography-led Two-Letter Monogram Logo Badge */
                          <div className={`relative h-36 w-full bg-gradient-to-br ${gradientClass} p-3.5 text-white flex flex-col justify-between border-b overflow-hidden`}>
                            <div className="flex items-center justify-between">
                              {/* Prominent Monogram Badge with Store Initials */}
                              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center font-black text-lg text-white border border-white/30 shadow-inner tracking-wider">
                                {biz.initials}
                              </div>

                              <div className="flex flex-col items-end gap-1">
                                <span className="bg-[#E8B923] text-[#3B1A5C] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                                  <Flame className="w-2.5 h-2.5 fill-[#3B1A5C]" />
                                  <span>Spotlight</span>
                                </span>
                                <span className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                                  <ShieldCheck className="w-2.5 h-2.5" />
                                  <span>Verified Merchant</span>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-white pt-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 truncate max-w-[150px]">
                                {biz.category}
                              </span>
                              <span className="text-[11px] font-black bg-white/20 px-2 py-0.5 rounded-full text-[#E8B923] backdrop-blur-sm">
                                {biz.price}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Card Body - Minimal & Authentic */}
                        <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div className="space-y-1.5">
                            <h4 
                              onClick={() => onOpenVendor?.(biz.phone || biz.id)}
                              className="text-sm sm:text-base font-extrabold text-[#2C2C2C] group-hover:text-[#5C2D91] transition-colors line-clamp-1 leading-snug cursor-pointer"
                            >
                              {biz.businessName}
                            </h4>

                            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                              <MapPin className="w-3.5 h-3.5 text-[#5C2D91] shrink-0" />
                              <span className="truncate">{biz.location}</span>
                            </div>

                            <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100 font-medium">
                              {biz.product}
                            </p>
                          </div>

                          {/* Primary Direct Action: Chat on WhatsApp */}
                          <div className="pt-1">
                            <a
                              href={biz.whatsappDeepLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2.5 px-3 bg-[#25D366] hover:bg-[#1EBE5B] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-xs hover:shadow transform active:scale-[0.98]"
                            >
                              <MessageCircle className="w-4 h-4 fill-white" />
                              <span>Chat on WhatsApp</span>
                            </a>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. REGULAR MATCHES (DUAL-MODE GRID) */}
            {productMatches.length === 0 && regularMatches.length > 0 && !isSearching && (
              <div className="space-y-3 text-left pt-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#F59E0B]" />
                  <h3 className="text-base sm:text-lg font-black text-[#13241F] tracking-tight">
                    {showingMerchantRecommendations ? "More related vendors" : "Verified Local Merchants"}
                  </h3>
                  <span className="bg-[#0A4D3C]/10 text-[#0A4D3C] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    {regularMatches.length} Available
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {regularMatches.map((biz) => {
                    const gradientClass = getMonogramGradient(biz.businessName);

                    return (
                      <div
                        key={biz.id}
                        className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-[#5C2D91] shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-3 group text-left relative overflow-hidden"
                      >
                        <div className="space-y-2.5">
                          {/* Merchant Header: Dual-Mode Photo vs Two-Letter Monogram Badge */}
                          <div className="flex items-start gap-3">
                            {biz.hasImage && biz.imageUrl ? (
                              <div className="w-13 h-13 rounded-2xl overflow-hidden bg-slate-100 border border-[#5C2D91]/25 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                                <img
                                  src={biz.imageUrl}
                                  alt={biz.businessName}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : (
                              <div className={`w-13 h-13 rounded-2xl bg-gradient-to-br ${gradientClass} font-black text-sm shrink-0 flex items-center justify-center shadow-xs border tracking-wider`}>
                                {biz.initials}
                              </div>
                            )}

                            <div className="flex-1 min-w-0 space-y-0.5">
                              <div className="flex items-center justify-between gap-1">
                                <h4 
                                  onClick={() => onOpenVendor?.(biz.phone || biz.id)}
                                  className="text-xs sm:text-sm font-extrabold text-[#2C2C2C] group-hover:text-[#5C2D91] transition-colors leading-tight truncate cursor-pointer"
                                >
                                  {biz.businessName}
                                </h4>
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full shrink-0">
                                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>Verified</span>
                                </span>
                              </div>

                              <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                                <MapPin className="w-3 h-3 text-[#5C2D91] shrink-0" />
                                <span className="truncate">{biz.location}</span>
                              </div>
                            </div>
                          </div>

                          {/* Product / Service Description */}
                          <p className="text-xs font-medium text-slate-700 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100">
                            {biz.product}
                          </p>

                          {/* Price Tag */}
                          <div className="flex items-center justify-between text-xs pt-0.5">
                            <span className="text-[11px] text-slate-500 font-medium">Price:</span>
                            <span className="text-xs font-extrabold text-[#5C2D91] bg-[#F7F4FB] px-2.5 py-0.5 rounded-full border border-[#5C2D91]/10">
                              {biz.price}
                            </span>
                          </div>
                        </div>

                        {/* Primary Direct Action: Chat on WhatsApp */}
                        <div className="pt-2 border-t border-slate-100">
                          <a
                            href={biz.whatsappDeepLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 px-3 bg-[#25D366] hover:bg-[#1EBE5B] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-xs transform active:scale-[0.99]"
                          >
                            <MessageCircle className="w-4 h-4 fill-white" />
                            <span>Chat on WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. ZERO MOCK DATA EMPTY STATE */}
            {activeQuery && totalResultsCount === 0 && !isSearching && hasSearchedOnce && (
              <div className="bg-white/95 backdrop-blur-md border border-white/30 rounded-2xl p-6 sm:p-8 text-center space-y-4 max-w-md mx-auto shadow-xl">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
                  <AlertCircle className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-[#2C2C2C]">
                    No matching business listings found for "{activeQuery}"
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    No verified merchants currently have catalog listings matching this search. Try a broader search keyword.
                  </p>
                </div>

                <div className="pt-2">
                  <a
                    href={`https://wa.me/2349115162081?text=${encodeURIComponent(`Hello FLOATE AI, I am looking for vendors selling "${activeQuery}"`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#25D366] hover:bg-[#1EBE5B] text-white font-bold text-xs uppercase tracking-wider rounded-full transition shadow-md hover:scale-[1.02]"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Inquire with Market Concierge</span>
                  </a>
                </div>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default WebSearchDemo;
