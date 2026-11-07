import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StatusDrop } from '../../types/storefront';

interface StatusRailProps {
  drops: StatusDrop[];
  onSelectDropForCheckout?: (drop: StatusDrop) => void;
  merchantName: string;
}

export const StatusRail: React.FC<StatusRailProps> = ({
  drops,
  onSelectDropForCheckout,
  merchantName
}) => {
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);

  // Auto-advance story viewer when active
  useEffect(() => {
    if (activeStoryIndex === null) {
      setStoryProgress(0);
      return;
    }

    const duration = 6000; // 6 seconds per story
    const step = 50;
    const increment = (step / duration) * 100;

    const interval = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          // Advance to next story if available
          if (activeStoryIndex < drops.length - 1) {
            setActiveStoryIndex(activeStoryIndex + 1);
            return 0;
          } else {
            // Close viewer at the end
            setActiveStoryIndex(null);
            return 0;
          }
        }
        return prev + increment;
      });
    }, step);

    return () => clearInterval(interval);
  }, [activeStoryIndex, drops.length]);

  const activeStory = activeStoryIndex !== null ? drops[activeStoryIndex] : null;

  return (
    <section className="w-full bg-[#FFFFFF] border-b border-[#F1F5F9] py-3.5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Rail Label */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="text-[11px] font-bold tracking-wider uppercase text-[#0F172A]">
              Today's Drops
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              (WhatsApp 24h Feed)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Tap to inspect live condition
          </span>
        </div>

        {/* Horizontal Hide-Scrollbar Overflow Rail */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-1 pt-0.5 -mx-4 px-4 sm:mx-0 sm:px-0">
          {drops.map((drop, index) => {
            const isFresh = index === 0;
            return (
              <button
                key={drop.id}
                type="button"
                onClick={() => {
                  setActiveStoryIndex(index);
                  setStoryProgress(0);
                }}
                className={`group relative shrink-0 w-[100px] sm:w-[115px] aspect-[4/5] rounded-[18px] overflow-hidden border border-[#F1F5F9] bg-slate-100 text-left transition transform active:scale-95 cursor-pointer min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                  isFresh 
                    ? 'ring-2 ring-[#10B981] ring-offset-2' 
                    : 'hover:border-slate-300'
                }`}
                title={`${drop.title} - ${drop.timestamp}`}
              >
                {/* Background 4:5 image */}
                <img
                  src={drop.imageUrl}
                  alt={drop.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />

                {/* Top Live Badge */}
                {isFresh && (
                  <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded bg-[#10B981] text-white text-[9px] font-extrabold uppercase tracking-tight shadow-xs">
                    NEW
                  </span>
                )}

                {/* Dark Gradient Overlay at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/40 to-transparent pointer-events-none" />

                {/* Bottom Text Content */}
                <div className="absolute bottom-0 inset-x-0 p-2 z-10 text-white pointer-events-none">
                  <div className="text-[10px] text-emerald-300 font-medium">
                    {drop.timestamp}
                  </div>
                  <p className="text-[11px] font-bold leading-tight truncate text-white mt-0.5">
                    {drop.title}
                  </p>
                  <p className="text-[10px] font-extrabold text-slate-200">
                    ₦{drop.price.toLocaleString()}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Full-Screen / iOS Lookbook Story Viewer Modal */}
      <AnimatePresence>
        {activeStory && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-4"
            onClick={() => setActiveStoryIndex(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-sm h-full sm:h-auto sm:max-h-[90vh] aspect-[9/16] sm:aspect-[4/5] bg-[#0F172A] sm:rounded-[24px] overflow-hidden flex flex-col justify-between shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Progress Bars at top */}
              <div className="absolute top-3 inset-x-3 z-30 flex gap-1.5">
                {drops.map((d, i) => {
                  const isCurrent = i === activeStoryIndex;
                  const isCompleted = i < (activeStoryIndex || 0);
                  return (
                    <div 
                      key={d.id} 
                      className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
                    >
                      <div
                        className="h-full bg-white transition-all ease-linear"
                        style={{
                          width: isCompleted ? '100%' : isCurrent ? `${storyProgress}%` : '0%'
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Header inside story */}
              <div className="absolute top-7 inset-x-3 z-30 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <div>
                    <p className="text-xs font-bold leading-none">{merchantName}</p>
                    <p className="text-[10px] text-slate-300 mt-0.5">Dropped {activeStory.timestamp}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStoryIndex(null)}
                  className="w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition cursor-pointer"
                  title="Close viewer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Media Visual */}
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                <img
                  src={activeStory.imageUrl}
                  alt={activeStory.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/30 pointer-events-none" />
              </div>

              {/* Left / Right tap zones to navigate stories */}
              <div 
                className="absolute inset-y-16 left-0 w-1/3 z-20 cursor-pointer"
                onClick={() => {
                  if (activeStoryIndex > 0) {
                    setActiveStoryIndex(activeStoryIndex - 1);
                    setStoryProgress(0);
                  }
                }}
              />
              <div 
                className="absolute inset-y-16 right-0 w-1/3 z-20 cursor-pointer"
                onClick={() => {
                  if (activeStoryIndex < drops.length - 1) {
                    setActiveStoryIndex(activeStoryIndex + 1);
                    setStoryProgress(0);
                  } else {
                    setActiveStoryIndex(null);
                  }
                }}
              />

              {/* Bottom Interactive Content & BUY CTA */}
              <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 z-30 bg-gradient-to-t from-black via-black/90 to-transparent text-white space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold tracking-wider uppercase">
                    {activeStory.condition}
                  </span>
                  <div className="text-[11px] text-slate-300">
                    {activeStory.viewsCount} viewing
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold tracking-tight text-white leading-tight">
                    {activeStory.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">{activeStory.specs}</p>
                  {activeStory.caption && (
                    <p className="text-xs text-slate-400 mt-1.5 italic bg-white/5 p-2 rounded-lg border border-white/10">
                      "{activeStory.caption}"
                    </p>
                  )}
                  <div className="mt-2 text-2xl font-black text-emerald-400">
                    ₦{activeStory.price.toLocaleString()}
                  </div>
                </div>

                {/* Direct Action Button: BUY CTA */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveStoryIndex(null);
                    if (onSelectDropForCheckout) {
                      onSelectDropForCheckout(activeStory);
                    }
                  }}
                  className="w-full h-12 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-black text-sm uppercase tracking-wider flex items-center justify-center shadow-lg shadow-emerald-900/40 active:scale-[0.98] transition cursor-pointer min-h-[44px]"
                >
                  <span>BUY</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
