import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  ArrowLeft, 
  X, 
  MapPin, 
  SlidersHorizontal, 
  Store, 
  ShieldCheck, 
  Sparkles, 
  Tag, 
  Coins, 
  Compass,
  CheckCircle2,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { 
  SearchResultItem, 
  MatchingVendorItem, 
  ParsedSearchCriteria 
} from '../../types/storefront';
import { MerchantCard } from './MerchantCard';
import { VendorBusinessCard } from './VendorBusinessCard';
import { searchFloateCatalog } from '../../services/searchService';
import { createMerchantSlug } from '../../utils/merchantSlug';

interface SearchResultFeedProps {
  initialQuery?: string;
  initialCategory?: string;
  onNavigateHome: () => void;
  onSelectMerchant: (slug: string) => void;
  onBuyItem?: (item: SearchResultItem) => void;
}

// 15 Verified Floate Marketplace Categories
const FLOATE_CATEGORIES = [
  'All',
  'Footwear & Shoes',
  'Beauty, Perfumes & Jewelry',
  'Solar & Power',
  'Fashion & Apparel',
  'Computers & Laptops',
  'Phones & Tablets',
  'Bags & Luggage',
  'Food & Confectioneries',
  'Auto & Truck Parts',
  'Building & Industrial Supplies',
  'Tech & Digital Services',
  'Media & Graphic Design',
  'Legal & Business Services'
];

// Major Nigerian informal commercial hubs for deterministic proximity resolution
const NIGERIAN_HUBS = [
  { city: 'Lagos', label: 'Lagos (Computer Village & Alaba)', lat: 6.5244, lng: 3.3792 },
  { city: 'Onitsha', label: 'Onitsha Main Market Hub', lat: 6.1512, lng: 6.7865 },
  { city: 'Aba', label: 'Aba (Ariaria International)', lat: 5.1065, lng: 7.3667 },
  { city: 'Kano', label: 'Kano (Farm Centre & Kantin Kwari)', lat: 12.0022, lng: 8.5201 },
  { city: 'Abuja', label: 'Abuja (Wuse & Banex)', lat: 9.0765, lng: 7.4986 },
  { city: 'Enugu', label: 'Enugu (Ogbete Market)', lat: 6.4474, lng: 7.5028 },
  { city: 'Port Harcourt', label: 'Port Harcourt (Garrison)', lat: 4.8156, lng: 7.0498 }
];

function findNearestHub(lat: number, lng: number) {
  let nearest = NIGERIAN_HUBS[0];
  let minDistance = Infinity;

  for (const hub of NIGERIAN_HUBS) {
    const dLat = (hub.lat - lat) * (Math.PI / 180);
    const dLng = (hub.lng - lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat * (Math.PI / 180)) *
        Math.cos(hub.lat * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = 6371 * c; // Earth radius in km

    if (dist < minDistance) {
      minDistance = dist;
      nearest = hub;
    }
  }

  return { hub: nearest, distanceKm: Math.round(minDistance) };
}

export const SearchResultFeed: React.FC<SearchResultFeedProps> = ({
  initialQuery = '',
  initialCategory = 'All',
  onNavigateHome,
  onSelectMerchant,
  onBuyItem
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [liveProducts, setLiveProducts] = useState<SearchResultItem[]>([]);
  const [matchingVendors, setMatchingVendors] = useState<MatchingVendorItem[]>([]);
  const [criteria, setCriteria] = useState<ParsedSearchCriteria | null>(null);
  const [isExactMatch, setIsExactMatch] = useState(false);
  const [exactMatchesCount, setExactMatchesCount] = useState(0);
  const [isLiveLoading, setIsLiveLoading] = useState(false);

  // User location state: deterministic detection without annoying popups
  const [userCoords, setUserCoords] = useState<{
    lat?: number;
    lng?: number;
    city?: string;
    label?: string;
    isAutoDetected: boolean;
  }>({
    isAutoDetected: false
  });

  // Location selector (allows user to filter or override location seamlessly)
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('ALL');

  // Filter mode: ALL | IN_BUDGET | VENDORS
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'IN_BUDGET' | 'VENDORS'>('ALL');

  // Deterministic location listener:
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((status) => {
        if (status.state === 'granted') {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              const { hub, distanceKm } = findNearestHub(latitude, longitude);
              setUserCoords({
                lat: latitude,
                lng: longitude,
                city: hub.city,
                label: `${hub.city} (${distanceKm} km away)`,
                isAutoDetected: true
              });
            },
            (err) => {
              console.debug('Silent geolocation read:', err.message);
            },
            { timeout: 4000, maximumAge: 120000 }
          );
        }
      }).catch(() => {
        // Permissions query not supported
      });
    }
  }, []);

  // Fetch live search results from normalized GET /api/webfront/search endpoint
  useEffect(() => {
    let isMounted = true;
    const fetchLiveSearch = async () => {
      setIsLiveLoading(true);
      try {
        const searchResult = await searchFloateCatalog(searchQuery.trim(), {
          location: selectedCityFilter !== 'ALL' ? selectedCityFilter : undefined,
          userCity: userCoords.city,
          userLat: userCoords.lat,
          userLng: userCoords.lng,
          category: selectedCategory !== 'All' ? selectedCategory : undefined
        });

        if (searchResult.success && isMounted) {
          const rawProducts = searchResult.results || [];
          const searchVendors = (searchResult.merchants && searchResult.merchants.length > 0)
            ? searchResult.merchants
            : rawProducts.map((p: any, idx: number) => ({
                id: p.merchantId || p.id || `vendor_${idx}`,
                slug: p.merchantId || p.slug || p.id,
                name: p.businessName || p.vendorName || p.name || 'Verified Merchant',
                city: p.city || 'Nigeria',
                state: p.state || 'Nigeria',
                category: p.category || 'Commercial Merchandise',
                verified: p.isVerified === true,
                isVerified: p.isVerified === true,
                verificationStatus: p.verificationStatus || (p.isVerified === true ? "APPROVED" : "PENDING_REVIEW"),
                avatar_url: p.imageUrl || p.photo_url || '',
                bio: p.description || p.product || '',
                whatsapp_number: p.phone || p.whatsapp || p.whatsappNumber || ''
              }));
          const rawVendors = searchVendors.map((vendor: any) => {
            const name = vendor.businessName || vendor.vendorName || vendor.name || 'Verified Merchant';
            return {
              ...vendor,
              name,
              slug: createMerchantSlug(name) || vendor.slug || vendor.id || 'merchant'
            };
          });
          const normalizedProducts = rawProducts.map((product: any) => {
            const merchant = product.merchant && typeof product.merchant === 'object'
              ? product.merchant
              : product.vendor && typeof product.vendor === 'object'
              ? product.vendor
              : {};
            const name = merchant.name || merchant.businessName || merchant.vendorName ||
              product.businessName || product.vendorName || product.merchantName;
            if (!name) return product;

            return {
              ...product,
              merchant: {
                ...merchant,
                name,
                slug: createMerchantSlug(name) || merchant.slug || product.merchantId || product.id,
                whatsappNumber: merchant.whatsappNumber || merchant.whatsapp_number ||
                  product.whatsappNumber || product.whatsapp || product.phone || '',
                avatarUrl: merchant.avatarUrl || merchant.avatar_url || product.avatarUrl || product.imageUrl || product.photo_url || ''
              }
            };
          });

          setLiveProducts(normalizedProducts);
          setMatchingVendors(rawVendors as any);
          setCriteria(searchResult.criteria || null);
          setIsExactMatch(searchResult.hasExactMatch ?? rawProducts.length > 0);
          setExactMatchesCount(searchResult.exactMatchesCount ?? rawProducts.length);
        }
      } catch (err) {
        console.warn('Render search error:', err);
      } finally {
        if (isMounted) setIsLiveLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchLiveSearch();
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedCategory, selectedCityFilter, userCoords.lat, userCoords.lng, userCoords.city]);

  // WhatsApp concierge fallback
  const conciergeWhatsAppUrl = `https://wa.me/2349115162081?text=${encodeURIComponent(
    `Hello FLOATE Market Concierge, I am searching for "${searchQuery || selectedCategory || 'products'}" ${criteria?.maxPrice ? `under ₦${criteria.maxPrice.toLocaleString()}` : ''} ${selectedCityFilter !== 'ALL' ? `in ${selectedCityFilter}` : ''}. Can you source directly from verified merchants?`
  )}`;

  // Filter products based on sub-filters
  const filteredProducts = useMemo(() => {
    const list = liveProducts;

    return list.filter((item) => {
      // 1. Budget match
      if (activeFilter === 'IN_BUDGET') {
        if (criteria?.maxPrice) {
          return item.price <= criteria.maxPrice;
        }
        return item.price <= 500000;
      }
      return true;
    });
  }, [liveProducts, activeFilter, criteria]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedCityFilter('ALL');
    setActiveFilter('ALL');
  };

  const hasBudgetInQuery = Boolean(criteria?.maxPrice || criteria?.targetPrice);
  const totalResultsFound = filteredProducts.length + matchingVendors.length;
  const isSearchEmpty = !isLiveLoading && filteredProducts.length === 0 && matchingVendors.length === 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#000000] pb-28">
      {/* Sticky Header with Search Console */}
      <header className="sticky top-0 z-30 bg-[#FFFFFF] border-b border-slate-200 shadow-xs">
        <div className="max-w-2xl mx-auto px-4 py-3 space-y-2.5">
          {/* Top Search Input Row */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onNavigateHome}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer min-h-[44px] min-w-[44px] shrink-0"
              title="Back to home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products: e.g. footwear, solar panel, laptop..."
                className="w-full h-11 pl-10 pr-9 bg-slate-100 focus:bg-white rounded-xl border border-slate-200 focus:border-[#1B5E20] text-xs sm:text-sm font-bold text-[#000000] placeholder:text-slate-400 focus:outline-none transition shadow-2xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>

          {/* Category Horizontal Scroll Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5 text-xs">
            {FLOATE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`h-7 px-3 rounded-full text-[11px] font-bold whitespace-nowrap transition cursor-pointer flex items-center shrink-0 min-h-[30px] ${
                    isSelected
                      ? 'bg-[#1B5E20] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Quick Location Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth pt-0.5 pb-0.5 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 pl-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              Hub:
            </span>

            {[
              { id: 'ALL', label: userCoords.isAutoDetected ? `📍 Near You (${userCoords.city})` : 'All Nigeria' },
              { id: 'Onitsha', label: 'Onitsha (Main Market)' },
              { id: 'Lagos', label: 'Lagos (Computer Village / Alaba)' },
              { id: 'Kano', label: 'Kano (Farm Centre)' },
              { id: 'Aba', label: 'Aba (Ariaria)' },
              { id: 'Abuja', label: 'Abuja (Banex/Wuse)' },
              { id: 'Enugu', label: 'Enugu (Ogbete)' },
              { id: 'Port Harcourt', label: 'Port Harcourt' }
            ].map((loc) => {
              const isSelected = selectedCityFilter === loc.id;
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setSelectedCityFilter(loc.id)}
                  className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer flex items-center shrink-0 min-h-[30px] ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                  }`}
                >
                  {loc.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-5">
        {/* Results Header: "Search Results (X Found)" */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span>Search Results ({totalResultsFound} Found)</span>
              {isLiveLoading && (
                <span className="text-xs font-normal text-slate-400 animate-pulse">Updating...</span>
              )}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Products and merchants are ranked by product match, budget, and preferred location.
            </p>
          </div>

          {/* Active Search & Filter Tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#E8F5E9] text-[#1B5E20] font-bold text-[11px] border border-[#1B5E20]/20">
                <Tag className="w-3 h-3" />
                "{searchQuery}"
              </span>
            )}
            {selectedCategory !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 font-bold text-[11px] border border-blue-200">
                <Store className="w-3 h-3 text-blue-600" />
                {selectedCategory}
              </span>
            )}
            {selectedCategory === 'All' && criteria?.category && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 font-bold text-[11px] border border-blue-200">
                <Store className="w-3 h-3 text-blue-600" />
                {criteria.category}
              </span>
            )}
            {selectedCityFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 font-bold text-[11px] border border-amber-200">
                <MapPin className="w-3 h-3 text-amber-600" />
                {selectedCityFilter}
              </span>
            )}
            {selectedCityFilter === 'ALL' && criteria?.location && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 font-bold text-[11px] border border-amber-200">
                <MapPin className="w-3 h-3 text-amber-600" />
                {criteria.location}
              </span>
            )}
            {criteria?.maxPrice && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 font-bold text-[11px] border border-emerald-200">
                <Coins className="w-3 h-3" />
                Up to ₦{criteria.maxPrice.toLocaleString()}
              </span>
            )}
            {(searchQuery || selectedCategory !== 'All' || selectedCityFilter !== 'ALL' || criteria?.category || criteria?.location || criteria?.maxPrice) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer transition min-h-[28px]"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* View Switcher Sub-Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className={`h-8 px-3 rounded-full text-xs font-bold transition cursor-pointer min-h-[36px] flex items-center shrink-0 ${
                activeFilter === 'ALL'
                  ? 'bg-black text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Matches ({totalResultsFound})
            </button>

            {hasBudgetInQuery && (
              <button
                type="button"
                onClick={() => setActiveFilter('IN_BUDGET')}
                className={`h-8 px-3 rounded-full text-xs font-bold transition cursor-pointer min-h-[36px] flex items-center shrink-0 ${
                  activeFilter === 'IN_BUDGET'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                In Budget (≤ ₦{(criteria?.maxPrice || 500000).toLocaleString()})
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveFilter('VENDORS')}
              className={`h-8 px-3 rounded-full text-xs font-bold transition cursor-pointer min-h-[36px] flex items-center gap-1.5 shrink-0 ${
                activeFilter === 'VENDORS'
                  ? 'bg-[#1B5E20] text-white'
                  : 'bg-white text-[#1B5E20] border border-[#1B5E20]/30 hover:bg-[#E8F5E9]'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Verified Stores ({matchingVendors.length})</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            CASE 1: EMPTY STATE - NO MATCHING BUSINESSES
           ======================================================== */}
        {isSearchEmpty && (
          <div className="bg-white rounded-3xl p-8 sm:p-10 text-center border border-slate-200 shadow-sm space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-[#E8F5E9] border border-[#1B5E20]/20 flex items-center justify-center mx-auto text-[#1B5E20]">
              <Store className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                No matching businesses
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                We couldn't find any active verified merchants matching your search criteria
                {searchQuery ? ` for "${searchQuery}"` : ''}
                {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
                {selectedCityFilter !== 'ALL' ? ` in ${selectedCityFilter}` : ''}.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-[#1B5E20] hover:bg-[#2E7D32] text-white font-bold text-xs tracking-wider uppercase transition cursor-pointer min-h-[44px] shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Filters</span>
              </button>

              <a
                href={conciergeWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs tracking-wider uppercase transition cursor-pointer min-h-[44px]"
              >
                <span>Request Concierge on WhatsApp</span>
              </a>
            </div>
          </div>
        )}

        {/* ========================================================
            CASE 2: REGULAR RESULTS & VENDORS
           ======================================================== */}
        {!isSearchEmpty && (
          <div className="space-y-6">
            {/* If user explicitly tapped "Verified Stores" tab, show vendors first */}
            {activeFilter === 'VENDORS' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs px-1 text-slate-600 font-bold uppercase tracking-wider">
                  <span>Verified Businesses Matching Query</span>
                  <span>{matchingVendors.length} active</span>
                </div>
                {matchingVendors.map((vendor) => (
                  <VendorBusinessCard
                    key={vendor.id}
                    vendor={vendor}
                    searchQuery={searchQuery}
                    onSelectMerchant={onSelectMerchant}
                  />
                ))}
              </div>
            ) : (
              <>
                {/* 1. Products Section */}
                {filteredProducts.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs px-1 text-slate-500 font-medium">
                      <span>
                        Showing <strong className="text-slate-900 font-bold">{filteredProducts.length}</strong> matching stock drop{filteredProducts.length === 1 ? '' : 's'}
                      </span>
                      {criteria?.maxPrice && (
                        <span className="text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md">
                          Budget filter active
                        </span>
                      )}
                    </div>

                    <div className="space-y-6">
                      {filteredProducts.map((item, index) => (
                        <div key={item.id} className="space-y-2">
                          {/* Price match indicator if within user's specified budget */}
                          {criteria?.maxPrice && item.price <= criteria.maxPrice && (
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-xl border border-emerald-300/60">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Within your ₦{criteria.maxPrice.toLocaleString()} budget (₦{(criteria.maxPrice - item.price).toLocaleString()} savings)</span>
                            </div>
                          )}

                          <MerchantCard
                            item={{
                              ...item,
                              isBoosted: item.isBoosted || index === 0
                            }}
                            onBuyItem={onBuyItem}
                            onSelectMerchant={onSelectMerchant}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Followed by Matching Verified Category Stores */}
                {matchingVendors.length > 0 && (
                  <div className="pt-6 border-t border-slate-200 space-y-4">
                    <div className="flex items-center justify-between text-xs px-1">
                      <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-900">
                        <Store className="w-4 h-4 text-[#1B5E20]" />
                        <span>Verified Businesses in this Category</span>
                      </div>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {matchingVendors.length} available
                      </span>
                    </div>

                    <div className="space-y-4">
                      {matchingVendors.map((vendor) => (
                        <VendorBusinessCard
                          key={vendor.id}
                          vendor={vendor}
                          searchQuery={searchQuery}
                          onSelectMerchant={onSelectMerchant}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
