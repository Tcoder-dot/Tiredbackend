import React from 'react';
import { SpotlightMerchant } from '../../types/storefront';

interface SpotlightGalleryProps {
  merchants: SpotlightMerchant[];
  onSelectMerchant: (slug: string) => void;
}

export const SpotlightGallery: React.FC<SpotlightGalleryProps> = ({
  merchants,
  onSelectMerchant
}) => {
  return (
    <section className="w-full bg-[#050507] text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-white/10">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#FFC107]" />
            <h2 className="text-xs sm:text-sm font-black tracking-widest uppercase text-[#FFC107]">
              Curated Spotlight
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Boosted by Verified Market Leaders
          </span>
        </div>

        {/* Horizontal Hide-Scrollbar Swipeable Gallery */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-3 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {merchants.map((merchant) => (
            <article
              key={merchant.id}
              onClick={() => onSelectMerchant(merchant.slug)}
              className="group relative shrink-0 w-[280px] sm:w-[320px] bg-[#0F0F14] rounded-[22px] border border-[#1B5E20]/50 p-4 shadow-[0_0_30px_rgba(27,94,32,0.25)] hover:shadow-[0_0_35px_rgba(27,94,32,0.4)] transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              {/* Top Bar: Avatar, Name, Verified Badge */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={merchant.avatarUrl}
                      alt={merchant.name}
                      className="w-11 h-11 rounded-xl object-cover border border-[#1B5E20]/40 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#FFC107] transition">
                          {merchant.name}
                        </h3>
                        <span className="text-[9px] font-extrabold tracking-wider text-[#123F16] bg-[#FFC107] px-1.5 py-0.2 rounded shrink-0">
                          VERIFIED
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {merchant.marketShort}
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-[#1B5E20]/30 text-[#FFC107] border border-[#FFC107]/40 text-[9px] font-mono font-bold uppercase tracking-wider shrink-0">
                    {merchant.spotlightBadge}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                  {merchant.bio}
                </p>

                {/* Mini 3-Image Carousel / Preview of Top Stock */}
                <div className="pt-1">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">
                    Live Stock Snapshot
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {merchant.topStockImages.slice(0, 3).map((img, i) => (
                      <div
                        key={i}
                        className="relative aspect-square rounded-lg overflow-hidden bg-black/40 border border-white/5"
                      >
                        <img
                          src={img}
                          alt={`${merchant.name} stock ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-108 transition duration-500"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Card Action */}
              <div className="pt-4 mt-3 border-t border-white/10 flex items-center justify-between">
                <div className="text-[10px] text-slate-400">
                  <span className="text-[#FFC107] font-bold">{merchant.completedEscrows}</span> verified orders
                </div>

                <button
                  type="button"
                  className="h-9 px-3.5 rounded-lg bg-white/10 group-hover:bg-[#1B5E20] text-white font-bold text-xs tracking-wide transition min-h-[44px] sm:min-h-[36px]"
                >
                  View Catalog
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
