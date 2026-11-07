import React, { useState, useEffect, useMemo } from 'react';
import { SEOHubPage, SEO_HUBS_DATA } from '../data/seoHubs';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Search, ChevronDown, MessageCircle, ArrowRight, ShieldCheck, MapPin, Zap } from 'lucide-react';
import { parseSearchQuery, isBusinessMatchingQuery } from '../lib/searchCategoryMatcher';
import { LandingHeader } from './common/LandingHeader';
import { BackgroundSvgAnimations } from './common/BackgroundSvgAnimations';
import { SEO } from './common/SEO';

interface Props {
  hub: SEOHubPage;
  onNavigateHome: () => void;
  onSelectHub: (slug: string) => void;
  onNavigatePage?: (page: 'COMPANY' | 'VENDORS_PAGE' | 'ECO_PARTNERS' | 'WHATSAPP_AI' | 'TELEGRAM_AI' | 'BLOG' | 'CONTACT') => void;
  onExploreStalls?: () => void;
}

export default function ProgrammaticHubPage({ hub, onNavigateHome, onSelectHub, onNavigatePage, onExploreStalls }: Props) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [activeMarketFilter, setActiveMarketFilter] = useState<string>('ALL');
  const [simulatedQuery, setSimulatedQuery] = useState<string>('');
  const [liveMerchants, setLiveMerchants] = useState<Array<{
    id?: string;
    name: string;
    market: string;
    category: string;
    items: string[];
    verificationBadge: string;
    hasImage?: boolean;
    imageUrl?: string;
  }>>([]);

  const WHATSAPP_BOT_URL = 'https://wa.me/message/YYWEZAZZIXBRF1';
  const REGISTER_BUSINESS_URL = 'https://wa.me/message/YYWEZAZZIXBRF1?text=REGISTER_BUSINESS';

  // Fetch live verified sellers from Firestore
  useEffect(() => {
    async function loadLiveMerchants() {
      const results: Array<any> = [];
      try {
        const q = query(
          collection(db, 'businesses'),
          where('status', '==', 'active')
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const img = data.imageUrl || data.image || data.photoUrl || '';
          const hasImg = Boolean(img && typeof img === 'string' && img.trim().length > 0);

          results.push({
            id: docSnap.id,
            name: data.businessName || 'Verified Market Stall',
            market: data.market || data.location || hub.cityName,
            category: data.category || 'General Merchant',
            items: Array.isArray(data.items) ? data.items : (data.product ? [data.product] : []),
            verificationBadge: hasImg ? 'FLOATE Verified' : 'Partially Verified',
            hasImage: hasImg,
            imageUrl: hasImg ? img : undefined,
          });
        });
      } catch (e) {
        // ignore
      }

      // Fallback fallback seeds if fewer than 2
      if (results.length < 2) {
        const fallbackSeeds = [
          {
            id: 'seed-1',
            name: `${hub.cityName} Prime Stall Merchant`,
            market: hub.cityName,
            category: 'Direct Importer',
            items: ['Phones & Laptops', 'Wholesale Electronics'],
            verificationBadge: 'FLOATE Verified'
          },
          {
            id: 'seed-2',
            name: `${hub.cityName} Fabric & Fashion Hub`,
            market: hub.cityName,
            category: 'Wholesale Textiles',
            items: ['Austrian Lace', 'Swiss Voile'],
            verificationBadge: 'FLOATE Verified'
          }
        ];
        results.push(...fallbackSeeds);
      }

      setLiveMerchants(results);
    }
    loadLiveMerchants();
  }, [hub]);

  const parsedHubQuery = useMemo(() => {
    return parseSearchQuery(simulatedQuery);
  }, [simulatedQuery]);

  const filteredMerchants = useMemo(() => {
    let list = liveMerchants;
    if (activeMarketFilter !== 'ALL') {
      list = list.filter(m => 
        m.market.toLowerCase().includes(activeMarketFilter.toLowerCase()) || 
        m.category.toLowerCase().includes(activeMarketFilter.toLowerCase())
      );
    }
    if (simulatedQuery.trim()) {
      list = list.filter(m => 
        isBusinessMatchingQuery({
          businessName: m.name,
          category: m.category,
          items: m.items,
          location: m.market,
          city: hub.cityName
        }, parsedHubQuery)
      );
    }
    return list;
  }, [liveMerchants, activeMarketFilter, simulatedQuery, parsedHubQuery, hub.cityName]);

  return (
    <div className="min-h-screen bg-[#0A4D3C] text-white font-sans antialiased relative selection:bg-[#FACC15] selection:text-[#13241F]">
      <SEO
        title={hub.title}
        description={hub.metaDescription}
        url={`https://www.floate.xyz/solutions/${hub.slug}`}
        schemaData={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: hub.h1Heading,
          description: hub.metaDescription,
          url: `https://www.floate.xyz/solutions/${hub.slug}`,
          about: {
            "@type": "Place",
            name: `${hub.cityName}, ${hub.country}`,
            address: {
              "@type": "PostalAddress",
              addressLocality: hub.cityName,
              addressCountry: "NG"
            }
          }
        }}
      />
      <BackgroundSvgAnimations variant="emerald" />

      {/* 1. TOP NAVIGATION HEADER */}
      <LandingHeader
        onNavigateHome={onNavigateHome}
        onNavigatePage={onNavigatePage || (() => {})}
        onExploreStalls={onExploreStalls}
        isDarkBg={true}
      />

      {/* 2. FULL SCREEN HERO SECTION */}
      <section className="min-h-[80vh] pt-32 sm:pt-40 pb-16 flex flex-col justify-center items-center relative px-4 sm:px-8 max-w-5xl mx-auto text-center space-y-8 z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FEF3C7] text-[#78350F] text-xs font-black uppercase tracking-wider border-2 border-[#13241F] shadow-[2px_2px_0px_#13241F]">
          <Zap className="w-4 h-4 text-[#D97706]" />
          <span>{(hub as any).badge || 'VERIFIED MARKET HUB'}</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05]">
          {hub.title}
        </h1>

        <p className="text-base sm:text-xl text-[#FEF3C7] max-w-3xl mx-auto font-medium leading-relaxed">
          {hub.subheading}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <a
            href={WHATSAPP_BOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#FACC15] hover:bg-[#EAB308] text-[#13241F] text-sm font-black shadow-[4px_4px_0px_#13241F] border-2 border-[#13241F] transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-y-[1px]"
          >
            <MessageCircle className="w-5 h-5 fill-[#13241F] text-[#FACC15]" />
            <span>Chat Verified Sellers on WhatsApp</span>
            <ArrowRight className="w-4 h-4 text-[#13241F]" />
          </a>

          <a
            href="#merchants"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-white hover:bg-[#FEF3C7] text-[#13241F] text-sm font-black shadow-[4px_4px_0px_#13241F] border-2 border-[#13241F] transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-y-[1px]"
          >
            <span>Explore Verified Vendors</span>
          </a>
        </div>
      </section>

      {/* 3. VERIFIED MERCHANTS GRID */}
      <section id="merchants" className="py-20 sm:py-28 px-4 sm:px-8 max-w-6xl mx-auto space-y-12 z-10 relative">
        <div className="text-center space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-[#FEF3C7] text-[#78350F] text-xs font-black uppercase tracking-wider border-2 border-[#13241F]">
            Direct Market Access
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Verified Stalls in {hub.cityName}
          </h2>
        </div>

        {/* Search Filter Box */}
        <div className="max-w-xl mx-auto relative">
          <div className="relative flex items-center bg-white border-2 border-[#13241F] rounded-full p-2 shadow-[4px_4px_0px_#FACC15]">
            <Search className="w-5 h-5 text-[#0A4D3C] ml-3" />
            <input
              type="text"
              value={simulatedQuery}
              onChange={(e) => setSimulatedQuery(e.target.value)}
              placeholder={`Search products in ${hub.cityName}...`}
              className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm font-black text-[#13241F] placeholder-[#5B6E66] focus:outline-none"
            />
          </div>
        </div>

        {/* Merchants Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-[#13241F]">
          {filteredMerchants.map((merchant, idx) => (
            <div
              key={merchant.id || idx}
              className="bg-white border-2 border-[#13241F] rounded-[32px] p-6 shadow-[6px_6px_0px_#FACC15] space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-[#E6F4EA] text-[#0A4D3C] text-[10px] font-black uppercase border-2 border-[#13241F]">
                    {merchant.category}
                  </span>
                  <span className="text-xs font-black text-[#0A4D3C] flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                    {merchant.verificationBadge}
                  </span>
                </div>

                <h3 className="text-lg font-black text-[#13241F] leading-tight">
                  {merchant.name}
                </h3>

                <p className="text-xs text-[#5B6E66] font-extrabold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>{merchant.market}</span>
                </p>

                {merchant.items.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {merchant.items.slice(0, 3).map((item, itemIdx) => (
                      <span key={itemIdx} className="px-2.5 py-0.5 rounded-md bg-[#FAF8F2] border border-[#13241F]/20 text-[10px] font-black text-[#13241F]">
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <a
                href={WHATSAPP_BOT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-full bg-[#0A4D3C] hover:bg-[#064E3B] text-white text-xs font-black shadow-[3px_3px_0px_#13241F] border-2 border-[#13241F] transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-y-[1px]"
              >
                <MessageCircle className="w-4 h-4 fill-white text-[#0A4D3C]" />
                <span>Chat Stall Owner</span>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FREQUENTLY ASKED QUESTIONS */}
      <section className="py-20 sm:py-28 px-4 sm:px-8 max-w-4xl mx-auto space-y-8 z-10 relative">
        <div className="text-center space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-[#FEF3C7] text-[#78350F] text-xs font-black uppercase tracking-wider border-2 border-[#13241F]">
            Market FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Common Questions About {hub.cityName}
          </h2>
        </div>

        <div className="space-y-4 text-[#13241F]">
          {hub.faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white border-2 border-[#13241F] rounded-2xl overflow-hidden shadow-[3px_3px_0px_#FACC15]"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left font-black text-sm sm:text-base text-[#13241F] flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-[#0A4D3C] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-[#5B6E66] font-semibold border-t-2 border-[#13241F]/10 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. OTHER POPULAR MARKET HUBS */}
      <section className="py-20 sm:py-28 px-4 sm:px-8 max-w-5xl mx-auto space-y-8 z-10 relative">
        <div className="text-center space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-[#FEF3C7] text-[#78350F] text-xs font-black uppercase tracking-wider border-2 border-[#13241F]">
            Explore More Hubs
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Other Physical Market Destinations
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {Object.values(SEO_HUBS_DATA).map((otherHub) => (
            <button
              key={otherHub.slug}
              onClick={() => onSelectHub(otherHub.slug)}
              className="px-5 py-2.5 rounded-full bg-white hover:bg-[#FEF3C7] text-[#13241F] text-xs font-black border-2 border-[#13241F] shadow-[3px_3px_0px_#FACC15] transition-all cursor-pointer active:translate-y-[1px]"
            >
              {otherHub.cityName}
            </button>
          ))}
        </div>
      </section>

      {/* 6. FULL WIDTH ACTION BANNER */}
      <section className="py-20 sm:py-28 px-4 sm:px-8 max-w-5xl mx-auto z-10 relative">
        <div className="bg-[#13241F] text-white border-2 border-white/20 rounded-[36px] sm:rounded-[44px] p-8 sm:p-14 shadow-[8px_8px_0px_#FACC15] text-center space-y-8">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Register Your Stall in {hub.cityName}
          </h2>
          <p className="text-sm sm:text-lg text-white/80 max-w-2xl mx-auto font-medium leading-relaxed">
            Get 20–50 direct buyer leads on WhatsApp every day with 0% listing commission.
          </p>

          <div>
            <a
              href={REGISTER_BUSINESS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#FACC15] hover:bg-[#EAB308] text-[#13241F] text-sm font-black transition-all shadow-[4px_4px_0px_#FFFFFF] cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-[#13241F] text-[#FACC15]" />
              <span>Register Stall Free on WhatsApp</span>
              <ArrowRight className="w-4 h-4 text-[#13241F]" />
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 border-t-2 border-white/10 text-center text-xs text-[#FEF3C7] font-semibold z-10 relative">
        <div className="max-w-5xl mx-auto px-4 space-y-4">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigateHome();
            }}
            className="block hover:opacity-90 transition-opacity cursor-pointer"
          >
            <img
              src="https://i.postimg.cc/hvHgYf4r/20260929-130945.png"
              alt="FLOATE Footer Logo"
              className="h-28 sm:h-36 w-auto object-contain block mx-auto"
              referrerPolicy="no-referrer"
            />
          </a>
          <p>© 2026 FLOATE AFRICA LTD. Founded by CHUKWUEMEKA RICH IFEANYI. All rights reserved.</p>
          <p>support@floate.xyz</p>
        </div>
      </footer>
    </div>
  );
}
