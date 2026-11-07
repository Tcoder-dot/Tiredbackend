import React, { useState } from 'react';
import { ProductItem } from '../../types/storefront';

interface ProductGridProps {
  products: ProductItem[];
  onBuyProduct?: (product: ProductItem) => void;
  onBoostProduct: (productId: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onBuyProduct,
  onBoostProduct,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  isLoading = false
}) => {
  const [boostingId, setBoostingId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Inventory' },
    { id: 'iphones', label: 'iPhones' },
    { id: 'smartwatches', label: 'Apple Watches' },
    { id: 'macbooks', label: 'MacBooks' },
    { id: 'audio', label: 'AirPods & Audio' }
  ];

  const handleBoostClick = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    setBoostingId(productId);
    try {
      await onBoostProduct(productId);
    } finally {
      setTimeout(() => setBoostingId(null), 600);
    }
  };

  return (
    <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Category Pills & Search Controls */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search iPhones, MacBooks, condition or specs..."
            className="w-full h-11 px-4 rounded-xl bg-white border border-[#F1F5F9] focus:border-slate-400 focus:outline-none text-xs sm:text-sm text-[#0F172A] placeholder-slate-400 shadow-2xs transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Horizontal Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`h-9 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center min-h-[44px] sm:min-h-[36px] ${
                  isActive
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'bg-white border border-[#F1F5F9] text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid Count Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <span>
          Showing <strong className="text-[#0F172A]">{products.length}</strong> items in stock
        </span>
        <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold">
          LIVE STORE
        </span>
      </div>

      {/* Skeleton Loading State */}
      {isLoading && products.length === 0 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4.5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white rounded-[18px] border border-[#F1F5F9] p-3 space-y-3 animate-pulse">
              <div className="w-full aspect-[4/3] rounded-xl bg-slate-100" />
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="h-4 bg-slate-100 rounded w-1/3" />
                <div className="h-8 bg-slate-100 rounded-lg w-14" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && products.length === 0 && (
        <div className="text-center py-16 px-4 bg-white rounded-[18px] border border-[#F1F5F9] space-y-3">
          <p className="text-sm font-semibold text-slate-700">No matching items in this catalog</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search keywords or switch category filter to view other gadgets.
          </p>
          <button
            onClick={() => {
              onSelectCategory('all');
              onSearchChange('');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer min-h-[44px]"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Editorial Catalog Grid: 2-Column Staggered / Masonry Layout */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4.5">
        {products.map((product, index) => {
          const isBoosted = product.isBoosted;
          const isStaggered = index % 2 === 1;

          return (
            <article
              key={product.id}
              className={`group flex flex-col justify-between bg-white rounded-[18px] overflow-hidden transition-all duration-300 relative ${
                isStaggered ? 'sm:translate-y-2' : ''
              } ${
                isBoosted
                  ? 'border-[1.5px] border-[#1B5E20] shadow-[0_8px_25px_rgba(27,94,32,0.15)]'
                  : 'border border-[#F1F5F9] hover:border-slate-300'
              }`}
            >
              {/* Tap-to-Boost Badge or Regular Condition Badge */}
              <div className="absolute top-2.5 inset-x-2.5 z-20 flex items-center justify-between pointer-events-none">
                {isBoosted ? (
                  <span className="px-2 py-0.5 rounded-md bg-[#1B5E20] text-white text-[9px] sm:text-[10px] font-extrabold tracking-wider uppercase shadow-xs pointer-events-auto">
                    BOOSTED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-xs text-slate-800 text-[9px] sm:text-[10px] font-bold tracking-tight uppercase border border-slate-200 shadow-2xs">
                    {product.condition}
                  </span>
                )}

                {/* Tap to Boost interactive button */}
                <button
                  type="button"
                  onClick={(e) => handleBoostClick(e, product.id)}
                  title={`Tap to Boost on Redis (Current Score: ${product.boostScore || 70})`}
                  className={`pointer-events-auto px-2 py-1 rounded-full text-[10px] font-bold transition backdrop-blur-xs cursor-pointer active:scale-90 ${
                    isBoosted
                      ? 'bg-[#E8F5E9] text-[#1B5E20]'
                      : 'bg-white/90 text-slate-500 hover:text-[#1B5E20] hover:bg-white shadow-xs'
                  }`}
                >
                  {boostingId === product.id ? '...' : '+ BOOST'}
                </button>
              </div>

              {/* 1:1 Square Image Area */}
              <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-104 transition duration-500"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />

                {/* Redis Score Micro Pill */}
                {product.boostScore && (
                  <div className="absolute bottom-2 left-2 z-10 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-white text-[9px] font-mono font-medium">
                    SCORE {product.boostScore}
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between space-y-2.5">
                <div className="space-y-1">
                  {/* Condition Tag (if not shown in top badge) */}
                  {isBoosted && (
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tight block">
                      {product.condition}
                    </span>
                  )}

                  {/* Title */}
                  <h3 className="font-bold text-xs sm:text-sm text-[#0F172A] leading-snug tracking-tight line-clamp-2">
                    {product.title}
                  </h3>

                  {/* Micro specs chips (Battery health / Storage) */}
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {product.storage && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                        {product.storage}
                      </span>
                    )}
                    {product.batteryHealth && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-medium">
                        {product.batteryHealth} BH
                      </span>
                    )}
                  </div>
                </div>

                {/* Price & Action Area: Clean Price & Direct BUY CTA */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-sm sm:text-base font-black text-[#0F172A] tracking-tight block">
                      ₦{product.price.toLocaleString()}
                    </span>
                    {product.originalPrice && (
                      <span className="text-[10px] sm:text-xs text-slate-400 line-through block -mt-0.5">
                        ₦{product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* BUY CTA Button */}
                  <button
                    type="button"
                    onClick={() => onBuyProduct?.(product)}
                    className="h-10 px-4 rounded-xl bg-[#0F172A] hover:bg-black text-white font-black text-xs uppercase tracking-wider flex items-center justify-center shadow-xs active:scale-[0.98] transition cursor-pointer shrink-0 min-h-[44px]"
                    title={`Buy ${product.title}`}
                  >
                    BUY
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
