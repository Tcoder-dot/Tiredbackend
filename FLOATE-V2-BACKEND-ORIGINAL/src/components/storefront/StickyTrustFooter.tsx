import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StickyTrustFooterProps {
  onOpenDetails?: () => void;
}

export const StickyTrustFooter: React.FC<StickyTrustFooterProps> = () => {
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  return (
    <>
      {/* Sticky Fixed Bottom Trust Bar */}
      <aside 
        aria-label="Escrow Protection Information"
        className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#F1F5F9] py-2.5 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowHowItWorks(true)}
            className="flex items-center gap-2.5 text-left cursor-pointer group flex-1 min-h-[44px] min-w-[44px]"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#0F172A] tracking-tight leading-tight flex items-center gap-1">
                <span>SafePay Escrow Protected</span>
                <span className="text-[10px] text-emerald-700 font-semibold underline decoration-dotted hidden sm:inline">
                  (How it works)
                </span>
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                Pay safely. Release code after delivery.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setShowHowItWorks(true)}
            className="h-9 px-3.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition cursor-pointer shrink-0 min-h-[44px]"
          >
            Learn More
          </button>
        </div>
      </aside>

      {/* How SafePay Works Explainer Sheet */}
      <AnimatePresence>
        {showHowItWorks && (
          <div 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowHowItWorks(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="w-full max-w-md bg-white rounded-t-[24px] sm:rounded-[24px] border border-slate-100 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-extrabold text-[#0F172A]">
                    The SafePay 4-Step Escrow Guarantee
                  </h3>
                  <p className="text-[11px] text-slate-500">Buyer protection for African informal commerce</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHowItWorks(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Steps */}
              <div className="space-y-3.5 pt-1">
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#0F172A] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-[#0F172A]">Lock Funds in Escrow</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      You deposit the purchase price into FLOATE's regulated escrow vault. The vendor cannot access these funds yet.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#0F172A] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-[#0F172A]">WhatsApp Dispatch Notification</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      The merchant receives guaranteed proof of funds via their WhatsApp bot and immediately sends out your gadget via dispatch rider or waybill.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#0F172A] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-[#0F172A]">Unbox & Inspect Physical Quality</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      You inspect the cosmetic condition, battery health, and test FaceID/hardware before signing off.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#10B981] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    4
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-[#0F172A]">Provide 6-Digit Release Code</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Only when you are 100% satisfied do you share your secret code with the merchant to release their funds instantly.
                    </p>
                  </div>
                </div>
              </div>

              {/* Safety notice */}
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 leading-snug">
                If the gadget fails inspection or doesn't match the WhatsApp description, simply reject the parcel and your funds are refunded in full.
              </div>

              <button
                type="button"
                onClick={() => setShowHowItWorks(false)}
                className="w-full h-11 bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer min-h-[44px]"
              >
                I Understand, Continue Shopping
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
