import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  MapPin, 
  CheckCircle2, 
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
import { searchRenderBackend } from '../services/searchService';
import { doc, setDoc, onSnapshot, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  parseSearchQuery, 
  ParsedSearchQuery,
  getSpotlightImage
} from '../lib/searchCategoryMatcher';

export interface BusinessItem {
  id: string;
  businessName: string;
  category: string;
  product?: string;
  location: string;
  market?: string;
  city?: string;
  description: string;
  items: string[];
  priceRange: string;
  price?: string;
  verified: boolean;
  verificationStatus?: string;
  isSpotlight?: boolean;
  hasImage?: boolean;
  imageUrl?: string;
  profileImageUrl?: string;
  productImages?: string[];
  status: string;
  fastResponder: boolean;
  rating?: number | string;
  score?: number | string;
  ratingTier?: string;
  telegramBotUrl?: string;
  whatsappDeepLink?: string;
  continueUrl?: string;
}

export function formatVendorRating(score?: number | string) {
  const num = typeof score === 'number' ? score : parseFloat(String(score)) || 4.9;
  return {
    scoreFormatted: num.toFixed(1),
    tier: num >= 4.8 ? 'Tier 1 Top Rated' : 'Verified Vendor'
  };
}

export const SearchConsoleSection: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchBudget, setSearchBudget] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  
  const [spotlightMatches, setSpotlightMatches] = useState<BusinessItem[]>([]);
  const [regularMatches, setRegularMatches] = useState<BusinessItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearchedOnce, setHasSearchedOnce] = useState(false);

  // Real-time counter
  const [linkedUsersCount, setLinkedUsersCount] = useState<number>(160);
  const carouselRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to real-time search & linked users stat counter in Firestore
  useEffect(() => {
    const statsDocRef = doc(db, 'stats', 'global');
    const unsubscribe = onSnapshot(statsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const rawCount = typeof data.totalUsersLinked === 'number'
          ? data.totalUsersLinked
          : typeof data.totalSearches === 'number'
          ? data.totalSearches
          : typeof data.searchCount === 'number'
          ? data.searchCount
          : typeof data.count === 'number'
          ? data.count
          : null;

        if (rawCount !== null) {
          if (typeof data.totalUsersLinked !== 'number' || typeof data.totalSearches !== 'number') {
            setDoc(statsDocRef, {
              totalUsersLinked: 160,
              totalSearches: 160,
              lastUpdated: new Date().toISOString()
            }, { merge: true }).catch(err => {
              console.warn('Could not migrate stats doc:', err);
            });
            setLinkedUsersCount(160);
          } else {
            setLinkedUsersCount(Math.max(160, rawCount));
          }
        }
      } else {
        setDoc(statsDocRef, {
          totalUsersLinked: 160,
          totalSearches: 160,
          lastUpdated: new Date().toISOString()
        }, { merge: true }).catch(err => {
          console.warn('Could not initialize stats doc:', err);
        });
      }
    }, (error) => {
      console.warn('Firestore stats snapshot listener error:', error);
    });

    return () => unsubscribe();
  }, []);

  const incrementLinkedUsers = async () => {
    setLinkedUsersCount(prev => prev + 1);
    try {
      const statsDocRef = doc(db, 'stats', 'global');
      await setDoc(statsDocRef, {
        totalUsersLinked: increment(1),
        totalSearches: increment(1),
        lastUpdated: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('Failed to increment linked users stat in Firestore:', err);
    }
  };

  const parsedActiveQuery = useMemo<ParsedSearchQuery>(() => {
    return parseSearchQuery(activeQuery);
  }, [activeQuery]);

  // Execute API Search against live Floate API
  const executeApiSearch = async (queryText: string, loc?: string, bud?: string) => {
    const cleanQuery = queryText.trim();
    if (!cleanQuery) {
      setActiveQuery('');
      setSpotlightMatches([]);
      setRegularMatches([]);
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
    incrementLinkedUsers();

    const locationToSend = loc || searchLocation || undefined;
    const budgetToSend = bud || searchBudget || undefined;

    try {
      const searchResult = await searchRenderBackend(cleanQuery, {
        location: locationToSend,
        budget: budgetToSend,
        signal: currentController.signal
      });

      if (abortControllerRef.current !== currentController) return;

      if (searchResult.success) {
        let rawSpotlights: any[] = searchResult.spotlightMatches || [];
        let rawRegulars: any[] = searchResult.regularMatches || [];

        if (rawSpotlights.length === 0 && rawRegulars.length === 0 && searchResult.results.length > 0) {
          rawSpotlights = searchResult.results.slice(0, 3);
          rawRegulars = searchResult.results.slice(3);
        }

        const mapItem = (item: any, idx: number, isSpotlight = false): BusinessItem => {
          const id = item.id || `floate_biz_${idx}_${Date.now()}`;
          const bizName = item.businessName || item.name || item.merchantName || 'Business';
          const prod = item.product || item.category || item.description || cleanQuery;
          const locStr = item.location || (item.city ? `${item.market ? item.market + ', ' : ''}${item.city}` : 'Nigeria');
          const priceVal = item.price || item.priceRange || 'Contact for price';
          const isVer = item.isVerified === true && ["APPROVED", "VERIFIED"].includes(item.verificationStatus || "");
          
          const rawImg = item.productImages?.[0] || item.profileImageUrl || item.imageUrl || item.image || item.photoUrl || (Array.isArray(item.images) && item.images[0]) || '';
          const hasRealImage = Boolean(
            (item.productImages && item.productImages.length > 0) ||
            item.profileImageUrl ||
            (rawImg && rawImg.startsWith('http') && !rawImg.includes('unsplash.com/photo-1472851294608-062f824d29cc'))
          );

          const imgUrl = rawImg && rawImg.startsWith('http') 
            ? rawImg 
            : getSpotlightImage({
                category: item.category,
                name: bizName,
                businessName: bizName,
                product: prod,
                description: item.description,
                image: rawImg
              });

          const cleanPhone = (item.whatsapp || item.whatsappNumber || item.phone || '').replace(/[^0-9]/g, '');
          const intlPhone = cleanPhone.startsWith('0')
            ? '234' + cleanPhone.slice(1)
            : cleanPhone.startsWith('234')
            ? cleanPhone
            : cleanPhone
            ? '234' + cleanPhone
            : '';

          const waLink = intlPhone
            ? `https://wa.me/${intlPhone}?text=${encodeURIComponent(`Hello ${bizName}, I saw your ${prod} on Floate`)}`
            : item.whatsappDeepLink || "";

          const initials = bizName
            .split(' ')
            .map((w: string) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          return {
            id,
            businessName: bizName,
            category: item.category || 'Supplier',
            product: prod,
            location: locStr,
            market: item.market || '',
            city: item.city || '',
            description: item.description || `Floate supplier offering ${prod}`,
            items: Array.isArray(item.items) ? item.items : [prod],
            priceRange: priceVal,
            price: priceVal,
            verified: isVer,
            verificationStatus: item.verificationStatus || 'REGISTERED',
            isSpotlight: isSpotlight || item.isSpotlight === true,
            hasImage: hasRealImage,
            imageUrl: imgUrl,
            profileImageUrl: item.profileImageUrl,
            productImages: item.productImages || (rawImg ? [rawImg] : []),
            status: 'active',
            fastResponder: true,
            rating: item.rating ?? item.score ?? 4.9,
            score: item.score ?? 96,
            ratingTier: item.ratingTier || (isVer ? 'FLOATE reviewed' : 'New listing'),
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
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.warn('Search query error:', err);
      setSpotlightMatches([]);
      setRegularMatches([]);
    } finally {
      if (abortControllerRef.current === currentController) {
        setIsSearching(false);
      }
    }
  };

  // Fast responsive debounce (200ms) before sending search request
  const handleInputChange = (val: string) => {
    setSearchTerm(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val.trim()) {
      setActiveQuery('');
      setSpotlightMatches([]);
      setRegularMatches([]);
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
    if (!searchTerm.trim()) return;
    executeApiSearch(searchTerm);
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

  const totalResultsCount = spotlightMatches.length + regularMatches.length;
  const moreBusinessesWhatsAppDeepLink = `https://wa.me/message/YYWEZAZZIXBRF1?text=SEARCH_${encodeURIComponent(activeQuery || searchTerm || "all")}`;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* SEARCH CONSOLE INPUT */}
      <div className="w-full max-w-[680px] mx-auto space-y-4">
        
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <div 
            className="relative flex items-center bg-white rounded-full border-2 border-slate-200/90 focus-within:border-[#1B5E20] focus-within:ring-4 focus-within:ring-[#1B5E20]/20 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.3)] hover:border-[#1B5E20]/60 transition-all duration-300 h-14 sm:h-16"
          >
            {/* Search Icon */}
            <div className="pl-5 sm:pl-6 text-[#1B5E20] shrink-0">
              <Search className="w-5 h-5" />
            </div>

            {/* Main Input Field */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Search phones, gadgets, fashion, jerseys, laptops..."
              className="w-full bg-transparent pl-3 sm:pl-4 pr-12 sm:pr-14 text-sm sm:text-base text-[#2C2C2C] placeholder-slate-400 focus:outline-none font-medium"
            />

            {/* Clear Button */}
            <div className="absolute right-3 sm:right-4 flex items-center gap-1.5 sm:gap-2">
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </form>

        {/* REAL-TIME SOCIAL PROOF BADGE */}
        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-white bg-[#1B5E20]/40 backdrop-blur-md px-4 py-1.5 sm:py-2 rounded-full border border-white/20 w-fit mx-auto shadow-md transition-all duration-300">
          <span className="flex h-2.5 w-2.5 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#25D366]" />
          </span>
          <span className="font-extrabold text-[#E8B923] text-sm sm:text-base font-mono tracking-wide">{linkedUsersCount.toLocaleString()}</span>
          <span className="text-white/95 font-semibold">users linked to verified local merchants</span>
        </div>



      </div>

      {/* SEARCH RESULTS SECTION (Only rendered when user performs a search) */}
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
              <div className="bg-white border border-[#1B5E20]/20 rounded-2xl p-8 text-center space-y-3 max-w-md mx-auto shadow-md">
                <div className="w-8 h-8 rounded-full border-3 border-[#1B5E20]/20 border-t-[#1B5E20] animate-spin mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-[#2C2C2C]">
                    Connecting to verified businesses...
                  </h4>
                  <p className="text-xs text-slate-500">
                    Businesses are coming up for <strong className="text-[#1B5E20]">"{activeQuery}"</strong>
                  </p>
                </div>
              </div>
            )}

            {/* 1. SPOTLIGHT BUSINESSES (Clean, proportional carousel) */}
            {spotlightMatches.length > 0 && !isSearching && (
              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#FFC107] text-[#123F16] shadow-xs">
                      <Flame className="w-3 h-3 fill-[#123F16]" />
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                      Spotlight Businesses
                    </h3>
                    <span className="bg-[#FFC107]/20 border border-[#FFC107] text-[#FFC107] text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                      Priority Placement
                    </span>
                  </div>

                  {/* Scroll controls */}
                  {spotlightMatches.length > 2 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => scrollCarousel('left')}
                        className="w-7 h-7 rounded-full bg-white/20 border border-white/30 text-white flex items-center justify-center hover:bg-[#1B5E20] transition shadow-xs"
                        aria-label="Scroll left"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollCarousel('right')}
                        className="w-7 h-7 rounded-full bg-white/20 border border-white/30 text-white flex items-center justify-center hover:bg-[#1B5E20] transition shadow-xs"
                        aria-label="Scroll right"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Horizontal-scrolling Carousel */}
                <div 
                  ref={carouselRef}
                  className="flex gap-4 overflow-x-auto pb-3 pt-1 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-400 hover:scrollbar-thumb-slate-300"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {spotlightMatches.map((biz) => {
                    const coverImage = biz.imageUrl || getSpotlightImage(biz);
                    const waLink = biz.whatsappDeepLink || "";
                    const initials = biz.businessName
                      .split(' ')
                      .map((w: string) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <div
                        key={biz.id}
                        className="w-[260px] sm:w-[280px] bg-white rounded-xl border border-[#E8B923]/60 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group snap-start shrink-0 relative"
                      >
                        {/* DUAL-MODE DYNAMIC CARD HEADER */}
                        {biz.hasImage ? (
                          /* Mode B: Image-enabled Thumbnail with Zoom Hover */
                          <div className="relative h-32 w-full bg-slate-100 overflow-hidden">
                            <img
                              src={coverImage}
                              alt={biz.businessName}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80";
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                            <div className="absolute top-2 left-2 flex items-center gap-1">
                              <span className="bg-[#E8B923] text-[#3B1A5C] text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
                                <Flame className="w-2.5 h-2.5 fill-[#3B1A5C]" />
                                <span>Spotlight</span>
                              </span>
                            </div>

                            {biz.verified && (
                              <div className="absolute top-2 right-2">
                                <span className="bg-emerald-600/95 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-0.5 backdrop-blur-xs">
                                  <ShieldCheck className="w-2.5 h-2.5" />
                                  <span>FLOATE reviewed</span>
                                </span>
                              </div>
                            )}

                            <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-white">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-white/90 truncate max-w-[140px]">
                                {biz.category}
                              </span>
                              <span className="text-[11px] font-black bg-[#1B5E20]/90 px-1.5 py-0.5 rounded text-[#FFC107] backdrop-blur-xs">
                                {biz.price || biz.priceRange}
                              </span>
                            </div>
                          </div>
                        ) : (
                          /* Mode A: Image-less Typography-led Card with Gradient Avatar & Initials */
                          <div className="relative h-32 w-full bg-gradient-to-br from-[#1B5E20] via-[#123F16] to-[#0B280E] p-3 text-white flex flex-col justify-between overflow-hidden">
                            <div className="flex items-center justify-between">
                              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xs text-[#FFC107] border border-white/30 shadow-inner">
                                {initials || 'FL'}
                              </div>

                              <div className="flex items-center gap-1">
                                <span className="bg-[#FFC107] text-[#123F16] text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                                  <Flame className="w-2.5 h-2.5 fill-[#123F16]" />
                                  <span>Spotlight</span>
                                </span>
                                {biz.verified && (
                                  <span className="bg-emerald-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                                    <ShieldCheck className="w-2.5 h-2.5" />
                                    <span>FLOATE reviewed</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            <div>
                              <span className="text-[10px] font-semibold text-white/80 uppercase tracking-wide block truncate">
                                {biz.category}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-white">
                              <span className="text-[10px] text-white/70 italic">Business listing</span>
                              <span className="text-[11px] font-black bg-white/20 px-2 py-0.5 rounded text-[#FFC107] backdrop-blur-sm">
                                {biz.price || biz.priceRange}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Card Body */}
                        <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                          <div className="space-y-1.5">
                            <h4 className="text-sm font-extrabold text-[#2C2C2C] group-hover:text-[#1B5E20] transition-colors line-clamp-1 leading-snug">
                              {biz.businessName}
                            </h4>

                            <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                              <MapPin className="w-3 h-3 text-[#1B5E20] shrink-0" />
                              <span className="truncate">{biz.location}</span>
                            </div>

                            <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-1.5 rounded border border-slate-100">
                              {biz.product || biz.description}
                            </p>
                          </div>

                          {/* WhatsApp Deep-Link Connect Button */}
                          <div className="pt-1">
                            {waLink ? (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => incrementLinkedUsers()}
                                className="w-full py-2 px-3 bg-[#25D366] hover:bg-[#1EBE5B] text-white font-bold text-[11px] uppercase tracking-wider rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs hover:shadow transform active:scale-[0.98]"
                              >
                                <MessageCircle className="w-3.5 h-3.5 fill-white" />
                                <span>Connect on WhatsApp</span>
                              </a>
                            ) : (
                              <span className="w-full py-2 px-3 bg-slate-100 text-slate-500 font-bold text-[11px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5">
                                WhatsApp unavailable
                              </span>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. REGULAR MATCHES (Responsive grid below carousel with Dual-Mode Support) */}
            {regularMatches.length > 0 && !isSearching && (
              <div className="space-y-3 text-left pt-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#E8B923]" />
                  <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                    Local Businesses
                  </h3>
                  <span className="bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {regularMatches.length} Available
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {regularMatches.map((biz) => {
                    const coverImage = biz.imageUrl || getSpotlightImage(biz);
                    const waLink = biz.whatsappDeepLink || "";
                    const initials = biz.businessName
                      .split(' ')
                      .map((w: string) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <div
                        key={biz.id}
                        className="bg-white rounded-xl p-3.5 border border-slate-200 hover:border-[#1B5E20] shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-3 group text-left relative overflow-hidden"
                      >
                        <div className="space-y-2.5">
                          {/* Merchant Header: Dual-Mode Thumbnail vs Typography Avatar */}
                          <div className="flex items-start gap-2.5">
                            {biz.hasImage ? (
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-[#1B5E20]/25 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                                <img
                                  src={coverImage}
                                  alt={biz.businessName}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80";
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1B5E20] to-[#123F16] text-[#FFC107] font-black text-xs shrink-0 flex items-center justify-center shadow-sm border border-[#1B5E20]/30">
                                {initials || 'FL'}
                              </div>
                            )}

                            <div className="flex-1 min-w-0 space-y-0.5">
                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                <h4 className="text-xs sm:text-sm font-extrabold text-[#2C2C2C] group-hover:text-[#1B5E20] transition-colors leading-tight truncate">
                                  {biz.businessName}
                                </h4>
                                <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  biz.verified
                                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                                    : 'text-amber-900 bg-amber-50 border border-amber-200'
                                }`}>
                                  {biz.verified ? 'FLOATE reviewed' : biz.verificationStatus === 'EVIDENCE_SUBMITTED' ? 'Under review' : 'Not verified'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                                <MapPin className="w-3 h-3 text-[#1B5E20] shrink-0" />
                                <span className="truncate">{biz.location}</span>
                              </div>
                            </div>
                          </div>

                          {/* Product Detail */}
                          <p className="text-[11px] font-medium text-slate-700 line-clamp-2 leading-snug bg-slate-50 p-1.5 rounded border border-slate-100">
                            {biz.product || biz.description}
                          </p>

                          {/* Price Tag */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[10px] text-slate-400 font-medium">Price:</span>
                            <span className="text-[11px] font-extrabold text-[#1B5E20] bg-[#E8F5E9] px-2 py-0.5 rounded">
                              {biz.price || biz.priceRange}
                            </span>
                          </div>
                        </div>

                        {/* Action Button: Chat directly with this business */}
                        <div className="pt-1 border-t border-slate-100">
                          {waLink ? (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => incrementLinkedUsers()}
                              className="w-full py-2 px-3 bg-[#25D366] hover:bg-[#1EBE5B] text-white font-bold text-[11px] uppercase tracking-wider rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs transform active:scale-[0.98]"
                            >
                              <MessageCircle className="w-3.5 h-3.5 fill-white" />
                              <span>Chat business on WhatsApp</span>
                            </a>
                          ) : (
                            <span className="w-full py-2 px-3 bg-slate-100 text-slate-500 font-bold text-[11px] uppercase tracking-wider rounded-lg flex items-center justify-center">
                              WhatsApp unavailable
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. EXPLORE MORE BUSINESSES CTA */}
            {activeQuery && totalResultsCount > 0 && !isSearching && (
              <div className="pt-2 pb-1 flex flex-col items-center justify-center gap-1 text-center">
                <a
                  href={moreBusinessesWhatsAppDeepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => incrementLinkedUsers()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#25D366] hover:bg-[#1EBE5B] text-white font-extrabold text-xs uppercase tracking-wider rounded-full transition shadow-md hover:scale-[1.02] active:scale-[0.99] border border-white/20"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Search More Across WhatsApp</span>
                </a>
              </div>
            )}

            {/* 4. EMPTY STATES: When no matching vendor is found (with Quick-Test Preset Buttons) */}
            {activeQuery && totalResultsCount === 0 && !isSearching && hasSearchedOnce && (
              <div className="bg-white/95 backdrop-blur-md border border-white/30 rounded-2xl p-6 sm:p-8 text-center space-y-4 max-w-md mx-auto shadow-xl">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
                  <AlertCircle className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-[#2C2C2C]">
                    No Exact Match for "{activeQuery}"
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Our WhatsApp concierge can scan unlisted market inventories across Lagos, Aba, Onitsha, and Abuja directly for you.
                  </p>
                </div>

                {/* Quick-Test Preset Buttons */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Try Popular Searches:</span>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {["Footwear & Shoes", "Laptops", "Phones", "Jerseys", "Perfumes"].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setSearchTerm(preset);
                          executeApiSearch(preset);
                        }}
                        className="bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#1B5E20] border border-[#1B5E20]/20 px-3 py-1 rounded-full text-xs font-bold transition"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href={moreBusinessesWhatsAppDeepLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => incrementLinkedUsers()}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#25D366] hover:bg-[#1EBE5B] text-white font-bold text-xs uppercase tracking-wider rounded-full transition shadow-md hover:scale-[1.02]"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Search Nationwide on WhatsApp</span>
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
