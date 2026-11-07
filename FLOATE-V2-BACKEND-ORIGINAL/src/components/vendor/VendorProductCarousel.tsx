import React, { useState, useEffect, useRef, useCallback } from "react";
import { Product } from "../../types/floate";
import { useCart } from "../../context/CartContext";
import { Plus, ArrowRight, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface VendorProductCarouselProps {
  products: Product[];
  totalProducts: number;
  nextCursor: string | null;
  isLoadingMore: boolean;
  onFetchMore: () => void;
  onOpenProduct: (id: string) => void;
  vendorName: string;
}

export const VendorProductCarousel: React.FC<VendorProductCarouselProps> = ({
  products,
  totalProducts,
  nextCursor,
  isLoadingMore,
  onFetchMore,
  onOpenProduct,
  vendorName
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { addToCart, isLoading: isCartLoading } = useCart();

  // Scroll detection for active centered slide and 2-slide-from-end trigger
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const scrollLeft = el.scrollLeft;
    const itemWidth = el.firstElementChild ? (el.firstElementChild as HTMLElement).offsetWidth + 12 : 1;
    const newActiveIndex = Math.round(scrollLeft / itemWidth);
    const clampedIndex = Math.max(0, Math.min(newActiveIndex, products.length - 1));

    if (clampedIndex !== activeIndex) {
      setActiveIndex(clampedIndex);
    }

    // Trigger prefetch when user is 2 slides from the end
    if (clampedIndex >= products.length - 2 && nextCursor && !isLoadingMore) {
      onFetchMore();
    }
  }, [activeIndex, products.length, nextCursor, isLoadingMore, onFetchMore]);

  const scrollToSlide = (index: number) => {
    const el = containerRef.current;
    if (!el) return;
    const targetChild = el.children[index] as HTMLElement;
    if (targetChild) {
      targetChild.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) scrollToSlide(activeIndex - 1);
  };

  const handleNext = () => {
    if (activeIndex < products.length - 1) scrollToSlide(activeIndex + 1);
  };

  const handleQuickAdd = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    await addToCart(productId, 1);
  };

  if (!products || products.length === 0) {
    return (
      <div className="p-8 text-center bg-[#FFFFFF] border border-slate-200 rounded-2xl text-xs text-[#666666]">
        No active products listed in this stall catalogue today.
      </div>
    );
  }

  return (
    <div className="w-full relative py-2 select-none">
      {/* Top Strip: Catalogue Title + Discreet Slide Counter (e.g. "3 / 17") */}
      <div className="flex items-center justify-between px-4 pb-3 max-w-[720px] mx-auto">
        <div>
          <h2 className="text-xs sm:text-sm font-bold text-[#111111] uppercase tracking-wider">
            Stall Catalogue
          </h2>
          <span className="text-[11px] text-[#666666]">
            Swipe cards to explore inventory
          </span>
        </div>

        {/* Discreet Counter "3 / 17" */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-[#FFFFFF] border border-slate-200 text-xs font-bold text-[#111111] shadow-sm tabular-nums">
            {activeIndex + 1} / {totalProducts || products.length}
          </div>

          {/* Desktop Navigation Buttons */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={handlePrev}
              disabled={activeIndex === 0}
              className="p-1.5 rounded-full border border-slate-200 bg-[#FFFFFF] hover:bg-[#F7F7F2] text-[#111111] disabled:opacity-30 transition-all focus:outline-none"
              aria-label="Previous product"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              disabled={activeIndex === products.length - 1}
              className="p-1.5 rounded-full border border-slate-200 bg-[#FFFFFF] hover:bg-[#F7F7F2] text-[#111111] disabled:opacity-30 transition-all focus:outline-none"
              aria-label="Next product"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Snap Track (Active slide ~80vw, 10vw peek on left/right, 12px gap) */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full flex items-center overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-[12px] px-[10vw] sm:px-[calc(50vw-240px)] py-4"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {products.map((product, index) => {
          const isActive = index === activeIndex;
          // Virtualization: only render full image for slides within window [activeIndex - 2, activeIndex + 2]
          const isNearActive = Math.abs(index - activeIndex) <= 2;

          return (
            <div
              key={product.id}
              onClick={() => onOpenProduct(product.id)}
              className="snap-center flex-shrink-0 w-[80vw] max-w-[420px] sm:max-w-[460px] h-[65vh] min-h-[460px] max-h-[600px] cursor-pointer"
            >
              <article
                className={`relative w-full h-full rounded-2xl overflow-hidden shadow-floate border border-slate-200 bg-[#111111] flex flex-col justify-between transition-transform duration-200 ease-out ${
                  isActive ? "scale-100 opacity-100" : "scale-[0.92] opacity-80"
                }`}
              >
                {/* Full-Bleed Photo with Virtualized Loading */}
                {isNearActive ? (
                  <img
                    src={product.photo_url}
                    alt={product.title}
                    className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                    loading={index <= 2 ? "eager" : "lazy"}
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-[#111111]" />
                )}

                {/* Bottom Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/95 via-[#111111]/40 to-transparent" />

                {/* Top Header Strip: Sale Pill & Quick Add Button */}
                <div className="relative z-10 p-4 sm:p-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {product.is_sale && (
                      <span className="bg-[#FFC107] text-[#123F16] text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                        Sale
                      </span>
                    )}
                    {product.category && (
                      <span className="bg-black/40 backdrop-blur-md text-white/90 border border-white/15 text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                        {product.category}
                      </span>
                    )}
                  </div>

                  {/* Quick Add to Cart Button */}
                  <button
                    onClick={(e) => handleQuickAdd(e, product.id)}
                    disabled={isCartLoading || !product.in_stock}
                    className="p-2.5 rounded-full bg-white/90 hover:bg-white text-[#111111] backdrop-blur-md shadow-lg transition-transform active:scale-90 disabled:opacity-50"
                    aria-label={`Add ${product.title} to cart`}
                  >
                    <Plus className="w-4 h-4 text-[#111111]" />
                  </button>
                </div>

                {/* Bottom Content: Price (Largest), Product Name (22-28px), View CTA */}
                <div className="relative z-10 p-5 sm:p-7 flex flex-col gap-2">
                  {/* Price: Largest type on the card */}
                  <div className="text-3xl sm:text-4xl font-black text-white tabular-nums tracking-tight drop-shadow-sm leading-none">
                    {product.formatted_price}
                  </div>

                  {/* Product Name: 22-28px font */}
                  <h3 className="text-[20px] sm:text-[24px] font-bold text-white leading-tight line-clamp-2 drop-shadow-sm mt-1">
                    {product.title}
                  </h3>

                  {/* Stall Reference & View Handoff */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-white/15 mt-1">
                    <span className="text-xs text-white/70 truncate max-w-[200px]">
                      {vendorName}
                    </span>

                    <span className="text-xs font-semibold text-white/90 flex items-center gap-1 group-hover:translate-x-1 transition-transform flex-shrink-0">
                      <span>View details</span>
                      <ArrowRight className="w-3.5 h-3.5 text-white" />
                    </span>
                  </div>
                </div>
              </article>
            </div>
          );
        })}

        {/* Loading indicator card at end of track while cursor prefetching */}
        {isLoadingMore && (
          <div className="snap-center flex-shrink-0 w-[80vw] max-w-[420px] h-[65vh] min-h-[460px] max-h-[600px] flex flex-col items-center justify-center bg-[#FFFFFF] border border-slate-200 rounded-2xl p-6 shadow-floate">
            <Loader2 className="w-8 h-8 text-[#1B5E20] animate-spin" />
            <span className="text-xs text-[#666666] font-semibold mt-2">
              Loading more stall items...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
