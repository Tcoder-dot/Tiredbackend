import React, { useState } from 'react';
import { LandingHeader } from './common/LandingHeader';
import { PageHero } from './common/PageHero';
import { ClosingCtaBand } from './common/ClosingCtaBand';
import { Footer } from './common/Footer';
import { SEO } from './common/SEO';
import { ShieldCheck, CheckCircle2, Mail, FileText, ChevronDown } from 'lucide-react';

interface TermsOfServicePageProps {
  onBack?: () => void;
  onNavigateHome?: () => void;
  onNavigatePage?: (page: any) => void;
  onExploreStalls?: () => void;
}

export default function TermsOfServicePage({ onBack, onNavigateHome, onNavigatePage, onExploreStalls }: TermsOfServicePageProps) {
  const handleHome = onNavigateHome || onBack || (() => {});
  const [activeSection, setActiveSection] = useState('summary');
  const [isTocMobileOpen, setIsTocMobileOpen] = useState(false);

  const tocItems = [
    { id: 'summary', label: 'The Short Version' },
    { id: 'acceptance', label: '1. Acceptance of Terms' },
    { id: 'architecture', label: '2. Services & Architecture' },
    { id: 'merchant-accounts', label: '3. Merchant Registration' },
    { id: 'lead-credits', label: '4. Lead Credits & Billing' },
    { id: 'p2p-trades', label: '5. Direct Peer Trades' },
    { id: 'advertising', label: '6. Advertising & Banners' },
    { id: 'intellectual-property', label: '7. Intellectual Property' },
    { id: 'governing-law', label: '8. Governing Law' },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    setIsTocMobileOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F2] text-[#123F16] font-sans antialiased relative">
      <SEO 
        title="Terms of Service — Legal Operating Agreement | FLOATE AFRICA LTD"
        description="Official Terms of Service for FLOATE AFRICA LTD, covering merchant stall indexing, pay-per-lead credit mechanics, WhatsApp lead routing, and platform standards."
        url="https://www.floate.xyz/terms"
        type="website"
      />

      <LandingHeader
        onNavigateHome={handleHome}
        onNavigatePage={onNavigatePage || (() => {})}
        onExploreStalls={onExploreStalls}
        currentPage="TERMS"
        isDarkBg={true}
      />

      {/* ── HERO HEADER ── */}
      <PageHero
        microLabel="LEGAL · TERMS"
        titleLine1="Terms of Service."
        titleLine2="Clear rules for fair trade."
        subtitle="Last updated: October 27, 2026"
      />

      {/* ── MAIN CONTENT WITH STICKY TOC ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-20">
        
        {/* Mobile TOC Accordion */}
        <div className="lg:hidden mb-8 bg-white border border-[#123F16]/10 rounded-2xl p-4 shadow-sm">
          <button
            onClick={() => setIsTocMobileOpen(!isTocMobileOpen)}
            className="w-full flex items-center justify-between font-bold text-sm text-[#123F16]"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#2E7D32]" />
              <span>On this page: Table of Contents</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${isTocMobileOpen ? 'rotate-180' : ''}`} />
          </button>

          {isTocMobileOpen && (
            <div className="mt-4 pt-3 border-t border-[#123F16]/10 space-y-2">
              {tocItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === item.id 
                      ? 'bg-[#E8F5E9] text-[#123F16] font-bold border-l-4 border-[#FFC107]' 
                      : 'text-[#123F16]/70 hover:bg-[#F7F7F2]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Desktop Sticky Table of Contents Sidebar */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-28 bg-white border border-[#123F16]/10 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-[#123F16]/50 uppercase tracking-widest mb-4">
              Table of Contents
            </h3>
            <nav className="space-y-1">
              {tocItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                    activeSection === item.id 
                      ? 'bg-[#E8F5E9] text-[#123F16] font-bold border-l-4 border-[#FFC107] shadow-xs' 
                      : 'text-[#123F16]/70 hover:bg-[#F7F7F2] hover:text-[#123F16]'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="mt-8 pt-6 border-t border-[#123F16]/10 space-y-3 text-xs text-[#123F16]/70">
              <p className="font-bold text-[#123F16]">Operating Entity:</p>
              <p>FLOATE AFRICA LTD</p>
              <p>CAC RC: 9365804</p>
              <p className="pt-2 text-[#2E7D32] font-semibold">support@floate.xyz</p>
            </div>
          </aside>

          {/* Reading Card Column */}
          <div className="lg:col-span-8 space-y-10">
            <div className="bg-white border border-[#123F16]/10 rounded-[18px] p-6 sm:p-12 shadow-sm space-y-10 text-sm sm:text-base text-[#123F16]/80 leading-relaxed">
              
              {/* Box: The Short Version */}
              <section id="summary" className="bg-[#E8F5E9] border border-[#2E7D32]/20 rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-2 text-[#123F16] font-extrabold text-base sm:text-lg">
                  <ShieldCheck className="w-5 h-5 text-[#2E7D32]" />
                  <span>The Short Version</span>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-[#123F16]/90 font-medium">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
                    <span><strong>Free to list:</strong> Stalls set up free with no monthly subscription software fees.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
                    <span><strong>1 Credit per Live Lead:</strong> Merchants pay 1 credit only when a real buyer connects via WhatsApp.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
                    <span><strong>Direct trade settlement:</strong> Buyers and sellers agree on price and payment directly over WhatsApp or in person at the stall.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
                    <span><strong>Authentic listings required:</strong> Fake items, counterfeit goods, and deceptive pricing result in immediate stall suspension.</span>
                  </li>
                </ul>
              </section>

              {/* Section 1 */}
              <section id="acceptance" className="space-y-4 pt-4 border-t border-[#123F16]/10">
                <h2 className="text-xl sm:text-2xl font-bold text-[#123F16]">
                  1. Acceptance of Terms
                </h2>
                <p>
                  By accessing floate.xyz, using FLOATE AI search bots on WhatsApp or Telegram, registering a market stall, or purchasing lead credits, you enter into a binding agreement with FLOATE AFRICA LTD (CAC RC 9365804).
                </p>
              </section>

              {/* Section 2 */}
              <section id="architecture" className="space-y-4 pt-6 border-t border-[#123F16]/10">
                <h2 className="text-xl sm:text-2xl font-bold text-[#123F16]">
                  2. Platform Architecture & Services
                </h2>
                <p>
                  FLOATE operates as an AI-native search engine and market operating system indexing physical market stalls across major African commerce centers (such as Onitsha Main Market, Computer Village Lagos, Agbani, Enugu, and Ariaria). FLOATE acts strictly as an information routing engine and discovery console.
                </p>
              </section>

              {/* Section 3 */}
              <section id="merchant-accounts" className="space-y-4 pt-6 border-t border-[#123F16]/10">
                <h2 className="text-xl sm:text-2xl font-bold text-[#123F16]">
                  3. Merchant Registration & Stall Standards
                </h2>
                <ul className="space-y-3 font-normal text-[#123F16]">
                  <li className="p-4 rounded-xl bg-[#F7F7F2] border border-[#123F16]/10">
                    <strong className="text-[#123F16] block font-bold mb-1">Truthful Inventory:</strong>
                    Merchants warrant that all listed items, descriptions, prices, and physical stall addresses are authentic and accurate.
                  </li>
                  <li className="p-4 rounded-xl bg-[#F7F7F2] border border-[#123F16]/10">
                    <strong className="text-[#123F16] block font-bold mb-1">Prohibited Products:</strong>
                    Listings containing counterfeit electronics, illegal substances, weapons, or stolen property are strictly prohibited and will be permanently banned.
                  </li>
                </ul>
              </section>

              {/* Section 4 */}
              <section id="lead-credits" className="space-y-4 pt-6 border-t border-[#123F16]/10">
                <h2 className="text-xl sm:text-2xl font-bold text-[#123F16]">
                  4. Lead Credits & Pay-Per-Lead Monetization
                </h2>
                <p>
                  FLOATE operates a pay-per-lead unit economic model:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-[#E8F5E9] border border-[#2E7D32]/20">
                    <strong className="text-[#123F16] block font-bold text-sm mb-1">1 Credit per Buyer Connection</strong>
                    <span className="text-xs text-[#123F16]/80">1 credit is deducted when an organic buyer initiates a WhatsApp inquiry for your stall items.</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#E8F5E9] border border-[#2E7D32]/20">
                    <strong className="text-[#123F16] block font-bold text-sm mb-1">Duplicate Protection</strong>
                    <span className="text-xs text-[#123F16]/80">Repeated messages from the same buyer phone within 48 hours are charged only once.</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#E8F5E9] border border-[#2E7D32]/20">
                    <strong className="text-[#123F16] block font-bold text-sm mb-1">Non-Refundable Top-Ups</strong>
                    <span className="text-[#123F16]/80 text-xs">Credit purchases made via Bachs.io or Paystack are final upon delivery to the merchant balance.</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#E8F5E9] border border-[#2E7D32]/20">
                    <strong className="text-[#123F16] block font-bold text-sm mb-1">Zero-Credit Mode</strong>
                    <span className="text-xs text-[#123F16]/80">Stalls with zero credits remain indexed on Google and FLOATE, but direct buyer leads remain locked until top-up.</span>
                  </div>
                </div>
              </section>

              {/* Section 5 */}
              <section id="p2p-trades" className="space-y-4 pt-6 border-t border-[#123F16]/10">
                <h2 className="text-xl sm:text-2xl font-bold text-[#123F16]">
                  5. Direct Peer Trades & Inspection Advice
                </h2>
                <p>
                  Trade negotiations, delivery waybills, and financial settlements occur directly between buyer and seller. FLOATE strongly advises buyers to inspect items physically or via live WhatsApp video before making payment.
                </p>
              </section>

              {/* Section 6 */}
              <section id="advertising" className="space-y-4 pt-6 border-t border-[#123F16]/10">
                <h2 className="text-xl sm:text-2xl font-bold text-[#123F16]">
                  6. Sponsored Search & Advertising
                </h2>
                <p>
                  Brands may purchase sponsored banner slots or top-of-search placement. All sponsored elements are clearly marked with an "AD" or "Sponsored" tag.
                </p>
              </section>

              {/* Section 7 */}
              <section id="intellectual-property" className="space-y-4 pt-6 border-t border-[#123F16]/10">
                <h2 className="text-xl sm:text-2xl font-bold text-[#123F16]">
                  7. Intellectual Property
                </h2>
                <p>
                  The FLOATE name, logo, search console software, AI lead-routing algorithms, and brand assets are the exclusive intellectual property of FLOATE AFRICA LTD.
                </p>
              </section>

              {/* Section 8 */}
              <section id="governing-law" className="p-6 sm:p-8 rounded-2xl bg-[#F7F7F2] border border-[#123F16]/15 space-y-3">
                <div className="flex items-center gap-2 font-bold text-base text-[#123F16]">
                  <Mail className="w-5 h-5 text-[#2E7D32]" />
                  <span>8. Governing Law & Corporate HQ</span>
                </div>
                <p className="text-xs sm:text-sm text-[#123F16]/80">
                  These terms are governed by the laws of the Federal Republic of Nigeria.
                </p>
                <div className="text-xs font-semibold space-y-1 text-[#123F16]">
                  <p><strong>FLOATE AFRICA LTD</strong></p>
                  <p>CAC Registration: RC 9365804</p>
                  <p>Support Email: <a href="mailto:support@floate.xyz" className="text-[#2E7D32] underline">support@floate.xyz</a></p>
                  <p>Website: <a href="https://www.floate.xyz" className="text-[#2E7D32] underline">www.floate.xyz</a></p>
                </div>
              </section>

            </div>
          </div>

        </div>
      </main>

      {/* ── CLOSING CTA BAND & FOOTER ── */}
      <ClosingCtaBand onNavigatePage={onNavigatePage} />
      <Footer onNavigateHome={handleHome} onNavigatePage={onNavigatePage} />
    </div>
  );
}
