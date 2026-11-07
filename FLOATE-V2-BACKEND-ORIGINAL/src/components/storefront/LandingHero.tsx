import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

interface LandingHeroProps {
  onSearch: (query: string) => void;
  onNavigateToMerchant?: (slug: string) => void;
  onNavigateToPlatformEngine?: () => void;
}

const PLACEHOLDER_QUERIES = [
  'Vietnamese bone straight hair in Onitsha...',
  'Lutian pure copper generators in Kano...',
  'Silk gowns & fabrics in Balogun...',
  'Building tools & hardware in Enugu...',
  'Find 4K Smart TVs in Alaba...',
  'Tokunbo laptops in Computer Village...',
  'Italian rice 50kg in Trade Fair Complex...',
  'Designer sneakers & shoes in Lagos...'
];

export const LandingHero: React.FC<LandingHeroProps> = ({
  onSearch
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(70);

  // Typing animation cycling through search prompts
  useEffect(() => {
    const fullText = PLACEHOLDER_QUERIES[currentPlaceholderIndex];
    let timer: NodeJS.Timeout;

    if (!isDeleting) {
      if (displayedPlaceholder.length < fullText.length) {
        timer = setTimeout(() => {
          setDisplayedPlaceholder(fullText.slice(0, displayedPlaceholder.length + 1));
        }, typingSpeed);
      } else {
        // Pause at the end before deleting
        timer = setTimeout(() => {
          setIsDeleting(true);
          setTypingSpeed(35);
        }, 2200);
      }
    } else {
      if (displayedPlaceholder.length > 0) {
        timer = setTimeout(() => {
          setDisplayedPlaceholder(fullText.slice(0, displayedPlaceholder.length - 1));
        }, typingSpeed);
      } else {
        setIsDeleting(false);
        setTypingSpeed(70);
        setCurrentPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_QUERIES.length);
      }
    }

    return () => clearTimeout(timer);
  }, [displayedPlaceholder, isDeleting, currentPlaceholderIndex, typingSpeed]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const queryToSearch = searchTerm.trim() || PLACEHOLDER_QUERIES[currentPlaceholderIndex].replace('...', '').replace(/^(Find|Search|Sourcing)\s+/, '');
    onSearch(queryToSearch);
  };

  const quickSearches = [
    'Footwear & Shoes',
    'Beauty, Perfumes & Jewelry',
    'Computers & Laptops',
    'Phones & Tablets',
    'Fashion & Apparel',
    'Bags & Luggage',
    'Solar & Power',
    'Food & Confectioneries'
  ];

  return (
    <section className="relative w-full bg-[#000000] text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-white/10">
      {/* Ambient background glow strictly reserved with deep green */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[320px] bg-[#1B5E20]/25 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Bar Navigation */}
      <div className="max-w-4xl mx-auto flex items-center justify-between pb-8 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
            FLOATE
          </span>
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 text-[10px] font-mono font-medium tracking-wide">
            MARKET SEARCH ENGINE
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline text-[11px] uppercase tracking-wider font-semibold">Live Inventory Feed</span>
          </div>
        </div>
      </div>

      {/* Center Billboard & Semantic Hero */}
      <div className="max-w-3xl mx-auto text-center mt-12 sm:mt-16 space-y-6">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08]">
          Find Verified Stock Across <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-[#FFC107]">
            African Informal Markets.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto font-normal leading-relaxed">
          Real-time catalog search fed directly by merchants via WhatsApp from Computer Village, Onitsha Main Market, Alaba, and Aba.
        </p>

        {/* Massive Stark White Search Input */}
        <form onSubmit={handleSubmit} className="pt-3 w-full max-w-2xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-0 bg-white/10 rounded-2xl blur-xs group-focus-within:bg-[#1B5E20]/30 transition" />
            
            <div className="relative flex items-center bg-[#FFFFFF] rounded-2xl p-1.5 shadow-2xl border-2 border-white focus-within:border-[#1B5E20] transition-all">
              <div className="pl-3.5 text-slate-400">
                <Search className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
              </div>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={displayedPlaceholder || 'Find tokunbo laptops in Onitsha...'}
                className="w-full h-12 sm:h-14 px-3 sm:px-4 bg-transparent text-[#000000] font-bold text-sm sm:text-base placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-0 focus:border-transparent outline-none"
              />

              <button
                type="submit"
                className="h-11 sm:h-12 px-6 sm:px-8 rounded-xl bg-[#1B5E20] hover:bg-[#2E7D32] text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase transition active:scale-95 flex items-center justify-center shadow-md cursor-pointer shrink-0 min-h-[44px] min-w-[44px]"
              >
                Search
              </button>
            </div>
          </div>
        </form>

        {/* Quick Search Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
          <span className="text-slate-500 font-medium text-[11px]">Popular:</span>
          {quickSearches.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onSearch(item)}
              className="h-8 px-3 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition font-medium text-[11px] cursor-pointer min-h-[36px] flex items-center"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
