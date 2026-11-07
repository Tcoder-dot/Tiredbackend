import React, { useState, useEffect } from 'react';
import { EscrowTickerItem } from '../../types/storefront';

interface LiveEscrowTickerProps {
  transactions: EscrowTickerItem[];
  onLearnMore?: () => void;
}

export const LiveEscrowTicker: React.FC<LiveEscrowTickerProps> = ({
  transactions,
  onLearnMore
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (transactions.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % transactions.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [transactions.length]);

  const currentTx = transactions[currentIndex] || transactions[0];

  if (!currentTx) return null;

  return (
    <aside
      aria-label="Real-time SafePay Escrow Activity"
      className="fixed bottom-0 inset-x-0 z-40 bg-[#000000] text-white border-t border-white/15 py-2.5 px-4 shadow-[0_-8px_25px_rgba(0,0,0,0.5)]"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Ticker Feed */}
        <div 
          onClick={onLearnMore}
          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer min-h-[44px]"
        >
          {/* Pulsing indicator */}
          <div className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7CFC8A] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7CFC8A]"></span>
          </div>

          <div className="min-w-0 flex items-center gap-2 text-xs sm:text-sm font-medium">
            <span className="px-2 py-0.5 rounded bg-[#1B5E20]/50 text-[#7CFC8A] font-mono font-bold text-[10px] tracking-wide shrink-0 hidden sm:inline">
              LIVE ESCROW
            </span>

            <p className="truncate text-slate-200">
              <strong className="text-white font-extrabold text-xs sm:text-sm">
                ₦{currentTx.amount.toLocaleString()}
              </strong>{' '}
              locked for <span className="text-slate-100 font-semibold">{currentTx.itemTitle}</span>{' '}
              <span className="text-slate-400">({currentTx.location})</span>
            </p>

            <span className="text-slate-500 text-[11px] shrink-0">
              • {currentTx.timeAgo}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onLearnMore}
          className="h-8 px-3.5 rounded-lg bg-white/10 hover:bg-[#1B5E20] text-white text-xs font-bold transition flex items-center shrink-0 cursor-pointer min-h-[44px]"
        >
          <span>SafePay Escrow</span>
        </button>
      </div>
    </aside>
  );
};
