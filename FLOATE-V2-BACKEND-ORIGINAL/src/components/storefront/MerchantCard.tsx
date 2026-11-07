import React from 'react';
import { SearchResultItem } from '../../types/storefront';
import { normalizeWhatsAppNumber } from '../../utils/whatsapp';

interface MerchantCardProps {
  item: SearchResultItem;
  onSelectMerchant: (slug: string) => void;
  onBuyItem?: (item: SearchResultItem) => void;
}

export const MerchantCard: React.FC<MerchantCardProps> = ({
  item,
  onSelectMerchant,
  onBuyItem
}) => {
  const isBoosted = item.isBoosted;

  const internationalPhone = normalizeWhatsAppNumber(item.merchant.whatsappNumber);
  const whatsappBuyUrl = internationalPhone
    ? `https://wa.me/${internationalPhone}?text=${encodeURIComponent(
        `Hello ${item.merchant.name}, I saw your ${item.title} on Floate`
      )}`
    : null;

  const displayLocation = item.formattedLocation || item.location || (item.city && item.state ? `${item.city}, ${item.state}` : item.marketLocation || 'Nigeria');
  const marketHub = item.marketHub || (item as any).geoHubName || (item as any).marketShort;

  return (
    <article
      className={`w-full rounded-[22px] overflow-hidden border transition-all duration-300 ${
        isBoosted
          ? 'bg-[#E8F5E9]/50 border-[#1B5E20]/30 shadow-[0_4px_24px_rgba(27,94,32,0.12)]'
          : 'bg-white border-slate-200 hover:border-slate-400'
      }`}
    >
      {/* Boosted Top Match Bar if Zero-Position */}
      {isBoosted && (
        <div className="bg-[#1B5E20] text-white px-4 py-1.5 flex items-center justify-between text-[11px] font-black uppercase tracking-wider">
          <span>TOP MATCH • BOOSTED BY VENDOR</span>
          <span className="font-mono text-[10px] text-[#FFC107]">
            Verified Rank
          </span>
        </div>
      )}

      {/* Top Bar: Merchant Avatar, Name, Solid Deep Green Verified Checkmark, Active text */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3 border-b border-slate-100">
        <button
          type="button"
          onClick={() => onSelectMerchant(item.merchant.slug)}
          className="flex items-center gap-2.5 text-left cursor-pointer group min-w-0 flex-1 min-h-[44px]"
        >
          <img
            src={item.merchant.avatarUrl}
            alt={item.merchant.name}
            className="w-11 h-11 rounded-full object-cover border border-slate-200 group-hover:ring-2 group-hover:ring-[#1B5E20]/40 transition shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-extrabold text-[#000000] truncate group-hover:text-[#1B5E20] transition">
                {item.merchant.name}
              </h3>
              <span className="text-[9px] font-extrabold tracking-wider text-white bg-[#1B5E20] px-1.5 py-0.2 rounded shrink-0">
                VERIFIED
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate mt-0.5 flex-wrap">
              {marketHub && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold shrink-0">
                  📍 {marketHub}
                </span>
              )}
              <span className="truncate">{displayLocation}</span>
              {item.merchant.activeTimeText && (
                <>
                  <span className="shrink-0 text-slate-300">•</span>
                  <span className="text-slate-500 font-medium shrink-0">
                    {item.merchant.activeTimeText}
                  </span>
                </>
              )}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectMerchant(item.merchant.slug)}
          className="text-[11px] font-bold text-slate-600 hover:text-[#1B5E20] bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition shrink-0 hidden sm:inline-block cursor-pointer min-h-[36px]"
        >
          View Profile
        </button>
      </div>

      {/* Visual Frame: Large 4:5 Aspect Ratio Image Placeholder/Photo */}
      <div className="relative w-full aspect-[4/5] bg-slate-100 overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />

        {/* Minimalist condition tag on the top-left */}
        <div className="absolute top-3 left-3 z-10">
          <span className="px-2.5 py-1 rounded-md bg-[#000000]/80 backdrop-blur-md text-white text-[10px] font-mono font-bold uppercase tracking-wider border border-white/20 shadow-sm">
            {item.condition}
          </span>
        </div>
      </div>

      {/* Bottom Bar: Title, specs, price & BUY CTA */}
      <div className="p-4 sm:p-5 space-y-3.5">
        <div className="space-y-1">
          <h4 className="text-sm sm:text-base font-bold text-[#000000] leading-snug">
            {item.title}
          </h4>

          {/* Specs tags */}
          {item.specs && item.specs.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {item.specs.map((spec, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                >
                  {spec}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Price & Action Area: Show Price and BUY CTA */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <span className="text-xl sm:text-2xl font-black text-[#000000] tracking-tight block">
              ₦{item.price.toLocaleString()}
            </span>
            {item.originalPrice && (
              <span className="text-xs text-slate-400 line-through block -mt-0.5">
                ₦{item.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          {whatsappBuyUrl ? (
            <a
              href={whatsappBuyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (onBuyItem) onBuyItem(item);
              }}
              className="h-11 px-6 rounded-xl bg-[#000000] hover:bg-slate-800 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center shadow-xs transition active:scale-[0.98] cursor-pointer min-h-[44px]"
              title={`Buy ${item.title}`}
            >
              BUY
            </a>
          ) : (
            <span className="h-11 px-4 rounded-xl bg-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider flex items-center justify-center min-h-[44px]">
              WhatsApp unavailable
            </span>
          )}
        </div>
      </div>
    </article>
  );
};
