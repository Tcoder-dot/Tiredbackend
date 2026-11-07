import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ArrowLeft
} from 'lucide-react';
import { Merchant } from '../../types/storefront';
import { normalizeWhatsAppNumber } from '../../utils/whatsapp';

interface MerchantHeaderProps {
  merchant: Merchant;
  onSelectMerchant: (slug: string) => void;
  onNavigateHome?: () => void;
}

export const MerchantHeader: React.FC<MerchantHeaderProps> = ({
  merchant,
  onSelectMerchant,
  onNavigateHome
}) => {
  const [showMerchantSwitcher, setShowMerchantSwitcher] = useState(false);
  const [merchantList, setMerchantList] = useState<Merchant[]>([merchant]);

  useEffect(() => {
    let isMounted = true;
    const fetchAllMerchants = async () => {
      try {
        const res = await fetch('/api/storefront/all-merchants');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.merchants) && isMounted) {
            const mapped = data.merchants.map((apiM: any) => ({
              id: apiM.id,
              slug: apiM.slug,
              name: apiM.name,
              handle: `@${apiM.slug}`,
              whatsappNumber: apiM.whatsappNumber,
              avatarUrl: apiM.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
              verified: apiM.isVerified === true && ['APPROVED', 'VERIFIED'].includes(apiM.verificationStatus),
              verificationStatus: apiM.verificationStatus || 'REGISTERED',
              marketLocation: apiM.marketLocation || `${apiM.city}, ${apiM.state}`,
              marketShort: apiM.marketShort || `${apiM.city}, ${apiM.state}`,
              rating: apiM.rating || 4.96,
              completedEscrows: apiM.completedEscrows || 850,
              activeStatus: 'Active on WhatsApp now',
              bio: apiM.bio || 'Verified merchant directory',
              safePayLevel: 'Verified Merchant',
              joinedDate: 'Joined 2024',
              dispatchCity: `${apiM.city}, Nigeria`
            }));
            if (mapped.length > 0) {
              setMerchantList(mapped);
            }
          }
        }
      } catch (e) {
        console.warn('Error fetching all merchants switcher list:', e);
      }
    };

    fetchAllMerchants();
    return () => {
      isMounted = false;
    };
  }, []);

  const whatsappNumber = normalizeWhatsAppNumber(merchant.whatsappNumber);
  const isVerified = merchant.verified === true && ['APPROVED', 'VERIFIED'].includes(merchant.verificationStatus || '');
  const verificationLabel = isVerified
    ? 'FLOATE reviewed'
    : merchant.verificationStatus === 'EVIDENCE_SUBMITTED' || merchant.verificationStatus === 'UNDER_REVIEW'
      ? 'Review in progress'
      : merchant.verificationStatus === 'REJECTED'
        ? 'Not approved'
        : 'Registered · not verified';
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        `Hello ${merchant.name}, I am browsing your live catalog on FLOATE. I have an inquiry about available gadgets.`
      )}`
    : null;

  return (
    <>
      {/* Sticky Merchant Header - Heavy Blur Backdrop */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-[#F1F5F9] transition-all">
        {/* Top Mini Brand Bar */}
        <div className="bg-[#0F172A] text-white px-4 py-1.5 text-[11px] font-medium flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {onNavigateHome && (
              <button
                type="button"
                onClick={onNavigateHome}
                className="hover:text-emerald-400 font-extrabold flex items-center gap-1.5 text-[11px] text-white cursor-pointer mr-1.5 shrink-0 bg-white/10 hover:bg-white/20 px-2.5 py-0.5 rounded"
                title="Back to FLOATE Search"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>FLOATE</span>
              </button>
            )}
            <span className="inline-block w-2 h-2 rounded-full bg-[#10B981] animate-pulse shrink-0" />
            <span className="tracking-wide text-slate-300 truncate">
              Storefront • <span className="text-white font-semibold">{merchant.marketShort}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] uppercase font-bold tracking-wider ${isVerified ? 'text-emerald-400' : 'text-amber-300'}`}>
              {verificationLabel}
            </span>
          </div>
        </div>

        {/* Main Sticky Profile Header */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          {/* Avatar & Store Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src={merchant.avatarUrl}
                alt={merchant.name}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-slate-200 shadow-sm"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowMerchantSwitcher(!showMerchantSwitcher)}
                  className="group inline-flex items-center gap-1 text-left cursor-pointer focus:outline-none"
                  title="Switch Vendor"
                >
                  <h1 className="text-sm sm:text-base font-bold text-[#0F172A] tracking-tight truncate group-hover:text-emerald-700 transition">
                    {merchant.name}
                  </h1>
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition shrink-0" />
                </button>
                <span className={`text-[9px] font-extrabold tracking-wider px-1.5 py-0.2 rounded shrink-0 ${
                  isVerified ? 'text-white bg-[#10B981]' : 'text-amber-950 bg-amber-200'
                }`}>
                  {verificationLabel}
                </span>
              </div>

              {/* Location Subtitle & Status */}
              <div className="flex items-center gap-2 text-xs text-slate-500 truncate mt-0.5">
                <span className="truncate font-medium text-slate-600">
                  {merchant.marketLocation}
                </span>
              </div>

              {/* Micro Trust Stats */}
              <div className="hidden sm:flex items-center gap-2.5 text-[11px] text-slate-500 mt-1">
                <span className="font-semibold text-slate-800">
                  ★ {merchant.rating}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-700 font-medium">
                  {merchant.completedEscrows.toLocaleString()} verified orders
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  {merchant.activeStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Pill-shaped Action Button: "Chat" (WhatsApp Deep-link) */}
          <div className="flex items-center gap-2 shrink-0">
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-4 sm:px-5 rounded-full bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center shadow-sm transition active:scale-95 cursor-pointer min-w-[44px]"
                title={`Chat with ${merchant.name} on WhatsApp`}
              >
                <span className="tracking-wide">Chat Vendor</span>
              </a>
            ) : (
              <span className="h-10 px-4 sm:px-5 rounded-full bg-slate-200 text-slate-500 font-bold text-xs sm:text-sm flex items-center min-w-[44px]">
                WhatsApp unavailable
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Switcher Modal / Dropdown */}
      {showMerchantSwitcher && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-start justify-center p-4 pt-20"
          onClick={() => setShowMerchantSwitcher(false)}
        >
          <div 
            className="w-full max-w-sm bg-white rounded-[18px] border border-[#F1F5F9] shadow-2xl p-4 overflow-hidden animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Switch Merchant Catalog
              </span>
              <button 
                onClick={() => setShowMerchantSwitcher(false)}
                className="text-xs text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
              {merchantList.map((m) => {
                const isCurrent = m.slug === merchant.slug;
                return (
                  <button
                    key={m.slug}
                    onClick={() => {
                      onSelectMerchant(m.slug);
                      setShowMerchantSwitcher(false);
                    }}
                    className={`w-full p-3 rounded-xl text-left flex items-center gap-3 transition cursor-pointer border ${
                      isCurrent 
                        ? 'bg-emerald-50/70 border-[#10B981]/40 ring-1 ring-[#10B981]/20' 
                        : 'bg-white hover:bg-slate-50 border-slate-100'
                    }`}
                  >
                    <img
                      src={m.avatarUrl}
                      alt={m.name}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-[#0F172A] truncate">
                          {m.name}
                        </span>
                        {m.verified && (
                          <span className="text-[8px] font-extrabold text-[#10B981] bg-emerald-50 px-1 py-0.2 rounded">
                            VERIFIED
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{m.marketShort}</p>
                      <p className="text-[10px] text-emerald-700 font-medium">
                        {m.completedEscrows} orders
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-3 pt-2 border-t border-slate-100">
              Merchants update items via WhatsApp bot in realtime.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
