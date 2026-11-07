import React from 'react';
import { 
  BadgeCheck, 
  MapPin, 
  Store, 
  ShieldCheck, 
  ArrowRight, 
  MessageCircle, 
  Star 
} from 'lucide-react';
import { MatchingVendorItem } from '../../types/storefront';
import { normalizeWhatsAppNumber } from '../../utils/whatsapp';

interface VendorBusinessCardProps {
  vendor: MatchingVendorItem;
  searchQuery?: string;
  onSelectMerchant: (slug: string) => void;
}

export const VendorBusinessCard: React.FC<VendorBusinessCardProps> = ({
  vendor,
  searchQuery = '',
  onSelectMerchant
}) => {
  const internationalPhone = normalizeWhatsAppNumber(vendor.whatsappNumber);

  const inquiryText = searchQuery 
    ? `Hello ${vendor.name}, I saw your ${searchQuery} on Floate`
    : `Hello ${vendor.name}, I saw your business on Floate`;

  const whatsappInquiryUrl = internationalPhone
    ? `https://wa.me/${internationalPhone}?text=${encodeURIComponent(inquiryText)}`
    : null;

  const displayLocation = vendor.formattedLocation || vendor.location || `${vendor.city || ''}, ${vendor.state || ''}`.replace(/^,\s*|,\s*$/g, '') || vendor.marketLocation || 'Commercial Hub';
  const marketHub = vendor.marketHub || (vendor as any).geoHubName || vendor.marketShort;

  return (
    <article className="w-full bg-white rounded-[22px] border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Top Banner with Category & Proximity */}
      <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-purple-300">
          <Store className="w-3.5 h-3.5 text-purple-400" />
          <span>{vendor.primaryCategory}</span>
        </div>

        {vendor.distanceText && (
          <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
            <MapPin className="w-3 h-3 text-emerald-400" />
            <span>{vendor.distanceText}</span>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Merchant Header: Avatar, Name, Handle, Rating */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <button
              type="button"
              onClick={() => onSelectMerchant(vendor.slug)}
              className="relative shrink-0 group cursor-pointer"
            >
              <img
                src={vendor.avatarUrl}
                alt={vendor.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 group-hover:border-[#1B5E20] transition shadow-xs"
                referrerPolicy="no-referrer"
              />
              {vendor.verified && (
                <div className="absolute -bottom-1 -right-1 bg-[#1B5E20] text-white rounded-full p-0.5 shadow-xs">
                  <BadgeCheck className="w-3.5 h-3.5 text-white fill-[#1B5E20]" />
                </div>
              )}
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => onSelectMerchant(vendor.slug)}
                  className="font-black text-slate-900 text-base sm:text-lg hover:text-[#1B5E20] transition truncate cursor-pointer text-left"
                >
                  {vendor.name}
                </button>
                <span className="text-[10px] font-black uppercase tracking-wider bg-[#E8F5E9] text-[#1B5E20] px-2 py-0.5 rounded-md">
                  VERIFIED HUB
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                <span className="font-mono text-slate-600 font-medium">@{vendor.slug}</span>
                <span>•</span>
                {marketHub && (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                    📍 {marketHub}
                  </span>
                )}
                <div className="flex items-center gap-1 text-slate-700 font-medium">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span className="truncate">{displayLocation}</span>
                </div>
              </div>

              {/* Trust Metrics */}
              <div className="flex items-center gap-3 text-xs text-slate-600 mt-2">
                <div className="flex items-center gap-1 text-amber-600 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{vendor.rating.toFixed(2)}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{vendor.completedEscrows.toLocaleString()} Escrows completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bio / Market Specialization */}
        {vendor.bio && (
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal bg-slate-50 p-3 rounded-xl border border-slate-100">
            "{vendor.bio}"
          </p>
        )}

        {/* Category Tags */}
        <div className="flex flex-wrap gap-1.5">
          {vendor.categories.map((cat, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium"
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Lookbook / Stock Sample Cards if available */}
        {vendor.sampleProducts && vendor.sampleProducts.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              WhatsApp Lookbook Drops:
            </div>
            <div className="grid grid-cols-2 gap-2">
              {vendor.sampleProducts.map((sp, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/80"
                >
                  {sp.imageUrl && (
                    <img
                      src={sp.imageUrl}
                      alt={sp.title}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{sp.title}</p>
                    <p className="text-xs font-black text-emerald-700">₦{sp.price.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action CTAs */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            type="button"
            onClick={() => onSelectMerchant(vendor.slug)}
            className="flex-1 h-11 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs tracking-wider uppercase transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
          >
            <span>Open Storefront</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {whatsappInquiryUrl ? (
            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider uppercase transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat On WhatsApp</span>
            </a>
          ) : (
            <span className="flex-1 h-11 px-4 rounded-xl bg-slate-200 text-slate-500 font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 min-h-[44px]">
              WhatsApp unavailable
            </span>
          )}
        </div>
      </div>
    </article>
  );
};
