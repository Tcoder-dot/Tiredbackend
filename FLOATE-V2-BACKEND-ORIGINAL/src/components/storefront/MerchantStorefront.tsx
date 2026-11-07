import React, { useState, useEffect, useMemo } from 'react';
import { MerchantHeader } from './MerchantHeader';
import { StatusRail } from './StatusRail';
import { ProductGrid } from './ProductGrid';
import { Merchant, ProductItem, StatusDrop } from '../../types/storefront';
import { Store, ArrowLeft, Loader2 } from 'lucide-react';
import { normalizeWhatsAppNumber } from '../../utils/whatsapp';

interface MerchantStorefrontProps {
  merchantSlug?: string;
  onNavigateHome?: () => void;
  onNavigateToPage?: (page: 'PRIVACY' | 'TERMS' | 'ABOUT' | 'MBO' | 'BLOG', slug?: string) => void;
}

// Client-side cache for instantaneous (<1ms) storefront navigation
const storefrontClientCache = new Map<string, { merchant: Merchant; products: ProductItem[]; statuses: StatusDrop[] }>();

export const MerchantStorefront: React.FC<MerchantStorefrontProps> = ({
  merchantSlug = 'rich-build',
  onNavigateHome,
  onNavigateToPage
}) => {
  const [currentSlug, setCurrentSlug] = useState<string>(merchantSlug);
  
  // Use cached records for instant navigation; never invent merchant contact details.
  const [liveMerchant, setLiveMerchant] = useState<Merchant | null>(() => {
    const cached = storefrontClientCache.get(merchantSlug.toLowerCase());
    return cached?.merchant || null;
  });
  const [products, setProducts] = useState<ProductItem[]>(() => {
    const cached = storefrontClientCache.get(merchantSlug.toLowerCase());
    return cached ? cached.products : [];
  });
  const [statusDrops, setStatusDrops] = useState<StatusDrop[]>(() => {
    const cached = storefrontClientCache.get(merchantSlug.toLowerCase());
    return cached ? cached.statuses : [];
  });
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Sync slug if prop changes
  useEffect(() => {
    if (merchantSlug && merchantSlug !== currentSlug) {
      setCurrentSlug(merchantSlug);
      const cached = storefrontClientCache.get(merchantSlug.toLowerCase());
      if (cached) {
        setLiveMerchant(cached.merchant);
        setProducts(cached.products);
        setStatusDrops(cached.statuses);
        setIsLiveConnected(true);
      } else {
        setLiveMerchant(null);
        setProducts([]);
        setStatusDrops([]);
        setIsLiveConnected(false);
      }
    }
  }, [merchantSlug]);

  // Fetch live storefront data (merchant profile, status drops, product catalog, prices) from FLOATE API
  useEffect(() => {
    let isMounted = true;
    const slugKey = currentSlug.toLowerCase().trim();

    // Check client cache first
    const cached = storefrontClientCache.get(slugKey);
    if (cached) {
      setLiveMerchant(cached.merchant);
      setProducts(cached.products);
      setStatusDrops(cached.statuses);
      setIsLiveConnected(true);
    } else {
      setLiveMerchant(null);
      setProducts([]);
      setStatusDrops([]);
      setIsLiveConnected(false);
      setIsFetching(true);
    }
    setNotFound(false);
    setLoadError(false);

    const fetchLiveStorefront = async () => {
      try {
        const res = await fetch(`/api/storefront/merchants/${slugKey}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && isMounted) {
            const phone = normalizeWhatsAppNumber(
              data.merchant?.whatsappNumber || data.merchant?.whatsapp
            );
            if (!data.merchant || !phone) {
              setLiveMerchant(null);
              setIsLiveConnected(false);
              setLoadError(true);
              return;
            }
            const m = {
              ...data.merchant,
              whatsappNumber: phone,
              verified: data.merchant?.isVerified === true && ['APPROVED', 'VERIFIED'].includes(data.merchant?.verificationStatus),
              verificationStatus: data.merchant?.verificationStatus || 'REGISTERED',
            } as Merchant;
            const p = Array.isArray(data.products) ? data.products : [];
            const s = Array.isArray(data.statuses) ? data.statuses : [];

            setIsLiveConnected(true);
            setLiveMerchant(m);
            setProducts(p);
            setStatusDrops(s);

            // Store in client cache for instant return visits
            storefrontClientCache.set(slugKey, { merchant: m, products: p, statuses: s });
          } else if (isMounted) {
            setNotFound(true);
          }
        } else if (isMounted) {
          setNotFound(res.status === 404);
          setLoadError(res.status !== 404);
        }
      } catch (err) {
        console.warn('Error fetching live merchant storefront:', err);
        if (isMounted) setLoadError(true);
      } finally {
        if (isMounted) setIsFetching(false);
      }
    };

    fetchLiveStorefront();
    return () => {
      isMounted = false;
    };
  }, [currentSlug]);

  // Fetch live Redis scores from REST API on mount
  useEffect(() => {
    const fetchBoostScores = async () => {
      try {
        const res = await fetch('/api/storefront/boost-scores');
        if (res.ok) {
          const data = await res.json();
          if (data.scores) {
            setProducts((prev) =>
              prev.map((p) => {
                const score = data.scores[p.id];
                if (typeof score === 'number') {
                  return {
                    ...p,
                    boostScore: score,
                    isBoosted: score >= 85.0
                  };
                }
                return p;
              })
            );
          }
        }
      } catch (e) {
        // Boost scores optional
      }
    };

    fetchBoostScores();
  }, []);

  // Handle Tap-to-Boost REST call
  const handleBoostProduct = async (productId: string) => {
    try {
      const res = await fetch(`/api/storefront/products/${productId}/boost`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  boostScore: data.boostScore,
                  isBoosted: data.isBoosted
                }
              : p
          )
        );
      }
    } catch (err) {
      console.warn('Boost product offline:', err);
    }
  };

  // Switch merchant
  const handleSelectMerchant = (slug: string) => {
    setCurrentSlug(slug);
    window.history.pushState({}, '', `/@${slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Direct buy handling
  const handleBuyProduct = (product: ProductItem) => {
    if (!liveMerchant) return;
    const internationalPhone = normalizeWhatsAppNumber(liveMerchant.whatsappNumber);
    if (!internationalPhone) return;
    const buyUrl = `https://wa.me/${internationalPhone}?text=${encodeURIComponent(
      `Hello ${liveMerchant.name}, I saw your listing on FLOATE for "${product.title}" (₦${product.price.toLocaleString()}). I want to buy this. Please confirm availability and delivery!`
    )}`;
    window.open(buyUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSelectDropForCheckout = (drop: StatusDrop) => {
    if (!liveMerchant) return;
    const internationalPhone = normalizeWhatsAppNumber(liveMerchant.whatsappNumber);
    if (!internationalPhone) return;
    const dropUrl = `https://wa.me/${internationalPhone}?text=${encodeURIComponent(
      `Hello ${liveMerchant.name}, I saw your today's status drop on FLOATE for "${drop.title}" (₦${drop.price.toLocaleString()}). I want to buy this. Please confirm availability and delivery!`
    )}`;
    window.open(dropUrl, '_blank', 'noopener,noreferrer');
  };

  // Filtered products based on category and query
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.specs.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.condition.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  if (!liveMerchant) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
          {isFetching ? <Loader2 className="w-8 h-8 animate-spin" /> : <Store className="w-8 h-8" />}
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">
            {isFetching ? 'Loading merchant storefront' : notFound ? 'Merchant Storefront Not Found' : 'Storefront Unavailable'}
          </h2>
          <p className="text-sm text-slate-500 max-w-sm">
            {isFetching
              ? 'Checking the registered merchant records.'
              : notFound
              ? `No registered merchant matches the handle "@${currentSlug}".`
              : loadError
              ? 'We could not verify this merchant’s WhatsApp contact. Please try again later.'
              : 'This merchant storefront could not be loaded.'}
          </p>
        </div>
        {onNavigateHome && (
          <button
            type="button"
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition cursor-pointer min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to FLOATE Search</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0F172A] font-sans selection:bg-[#10B981]/20 selection:text-[#059669]">
      {/* 1. Sticky Merchant Header */}
      <MerchantHeader
        merchant={liveMerchant}
        onSelectMerchant={handleSelectMerchant}
        onNavigateHome={onNavigateHome}
      />

      {/* 2. "Today's Drops" Status Rail */}
      {statusDrops.length > 0 && (
        <StatusRail
          drops={statusDrops}
          onSelectDropForCheckout={handleSelectDropForCheckout}
          merchantName={liveMerchant.name}
        />
      )}

      {/* Editorial Sub-Header Banner */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-1">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 border-b border-[#F1F5F9] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#10B981]">
                Verified Catalog
              </span>
              {isLiveConnected && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  FLOATE Database Live
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight leading-tight">
              Live Verified Inventory & Drops
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Direct pricing in Nigerian Naira • Verified Physical Stalls
          </p>
        </div>
      </div>

      {/* 3. Editorial Catalog Grid */}
      <main className="pb-16">
        <ProductGrid
          products={filteredProducts}
          isLoading={isFetching}
          onBuyProduct={handleBuyProduct}
          onBoostProduct={handleBoostProduct}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </main>
    </div>
  );
};
