import React, { useState } from 'react';
import { LandingHeader } from './common/LandingHeader';
import { PageHero } from './common/PageHero';
import { ClosingCtaBand } from './common/ClosingCtaBand';
import { Footer } from './common/Footer';
import { SEO } from './common/SEO';
import { ShieldCheck, CheckCircle2, Mail, Lock, FileText, ChevronDown } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onBack?: () => void;
  onNavigateHome?: () => void;
  onNavigatePage?: (page: any) => void;
  onExploreStalls?: () => void;
}

export default function PrivacyPolicyPage({ onBack, onNavigateHome, onNavigatePage, onExploreStalls }: PrivacyPolicyPageProps) {
  const handleHome = onNavigateHome || onBack || (() => {});
  const [activeSection, setActiveSection] = useState('summary');
  const [isTocMobileOpen, setIsTocMobileOpen] = useState(false);

  const tocItems = [
    { id: 'summary', label: 'The Short Version' },
    { id: 'introduction', label: '1. Introduction' },
    { id: 'information-collected', label: '2. Information We Collect' },
    { id: 'data-usage', label: '3. How We Use Data' },
    { id: 'data-sharing', label: '4. Data Sharing' },
    { id: 'security-retention', label: '5. Security & Retention' },
    { id: 'user-rights', label: '6. Your Rights & Deletion' },
    { id: 'contact', label: '7. Contact Us' },
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
        title="Privacy Policy — Your Data Stays Yours | FLOATE AFRICA LTD"
        description="Learn how FLOATE AFRICA LTD protects merchant and buyer privacy, data security, WhatsApp authentication, and direct lead routing."
        url="https://www.floate.xyz/privacy"
        type="website"
      />

      <LandingHeader
        onNavigateHome={handleHome}
        onNavigatePage={onNavigatePage || (() => {})}
        onExploreStalls={onExploreStalls}
        currentPage="PRIVACY"
        isDarkBg={true}
      />

      {/* ── HERO HEADER ── */}
      <PageHero
        microLabel="LEGAL · PRIVACY"
        titleLine1="Privacy Policy."
        titleLine2="Your data stays yours."
        subtitle="Last updated: October 27, 2026"
      />

      {/* ── MAIN CONTENT AREA WITH STICKY TOC ── */}
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
                    <span><strong>No data broker sales:</strong> FLOATE never sells, rents, or monetizes your personal data or search histories.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
                    <span><strong>Phone-first authentication:</strong> We use WhatsApp 1-click login codes for merchants—no weak passwords stored.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
                    <span><strong>Direct lead routing:</strong> Buyer queries route directly to the merchant's live WhatsApp chat without hidden middleman fees.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
                    <span><strong>Secure payments:</strong> Credit top-ups are processed through licensed gateways (Bachs.io/Paystack). FLOATE never stores raw banking card numbers.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
                    <span><strong>Data deletion:</strong> You can request full merchant profile or account deletion anytime by emailing support@floate.xyz.</span>
                  </li>
                </ul>
              </section>

              {/* Section 1: Introduction */}
              <section id="introduction" className="space-y-4 pt-4 border-t border-[#123F16]/10">
                <h2 className="text-xl sm:text-2xl font-bold text-[#123F16]">
                  1. Introduction
                </h2>
                <p>
                  FLOATE AFRICA LTD ("FLOATE", "we", "us", or "our") respects your privacy and is committed to protecting your personal data in full compliance with applicable laws of the Federal Republic of Nigeria, including the Nigeria Data Protection Act (NDPA).
                </p>
                <p>
                  This Privacy Policy explains how we collect, process, secure, and store your personal information when you access floate.xyz, interact with FLOATE AI messaging bots on WhatsApp or Telegram, register a physical market stall, or communicate with vendors.
                </p>
              </section>

              {/* Section 2: Information We Collect */}
              <section id="information-collected" className="space-y-4 pt-6 border-t border-[#123F16]/10">
                <h2 className="text-xl sm:text-2xl font-bold text-[#123F16]">
                  2. Information We Collect
                </h2>
                <p>
                  We collect information directly provided by you, as well as operational telemetry necessary to route buyer search queries to physical market stalls:
                </p>
                <ul className="space-y-3 font-normal text-[#123F16]">
                  <li className="p-4 rounded-xl bg-[#F7F7F2] border border-[#123F16]/10">
                    <strong className="text-[#123F16] block font-bold mb-1">Merchant Profile & Identity:</strong>
                    Phone number (used for WhatsApp 1-click verification), business name, market location (e.g. Computer Village, Onitsha Main Market, Agbani, Enugu), stall address, and uploaded catalog inventory.
                  </li>
                  <li className="p-4 rounded-xl bg-[#F7F7F2] border border-[#123F16]/10">
                    <strong className="text-[#123F16] block font-bold mb-1">Buyer Search Queries:</strong>
                    Product text queries, voice notes, city location tags, and lead referral routing tokens.
                  </li>
                  <li className="p-4 rounded-xl bg-[#F7F7F2] border border-[#123F16]/10">
                    <strong className="text-[#123F16] block font-bold mb-1">Payment Transactions:</strong>
                    Top-up transaction references, credit deductions, and billing timestamps. FLOATE does not store raw credit card credentials.
                  </li>
                </ul>
              </section>

              {/* Section 3: How We Use Data */}
              <section id="data-usage" className="space-y-4 pt-6 border-t border-[#123F16]/10">
                <h2 className="text-xl sm:text-2xl font-bold text-[#123F16]">
                  3. How We Use Data
                </h2>
                <p>
                  Your information is processed strictly to enable zero-friction trade between shoppers and physical market merchants:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-[#E8F5E9] border border-[#2E7D32]/20">
                    <strong className="text-[#123F16] block font-bold text-sm mb-1">Direct WhatsApp Routing</strong>
                    <span className="text-xs text-[#123F16]/80">Pre-filling high-intent buyer inquiries straight to merchant WhatsApp numbers.</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#E8F5E9] border border-[#2E7D32]/20">
                    <strong className="text-[#123F16] block font-bold text-sm mb-1">Authenticity Verification</strong>
                    <span className="text-xs text-[#123F16]/80">Confirming physical stall existence and verifying merchant badges.</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#E8F5E9] border border-[#2E7D32]/20">
                    <strong className="text-[#123F16] block font-bold text-sm mb-1">Pay-Per-Lead Billing</strong>
                    <span className="text-xs text-[#123F16]/80">Accurately deducting 1 credit when a verified live lead connects.</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#E8F5E9] border border-[#2E7D32]/20">
                    <strong className="text-[#123F16] block font-bold text-sm mb-1">AI Search Indexing</strong>
                    <span className="text-xs text-[#123F16]/80">Indexing stall products into FLOATE search console and Google entity listings.</span>
                  </div>
                </div>
              </section>

              {/* Section 4: Data Sharing */}
              <section id="data-sharing" className="space-y-4 pt-6 border-t border-[#123F16]/10">
                <h2 className="text-xl sm:text-2xl font-bold text-[#123F16]">
                  4. Data Sharing
                </h2>
                <p>
                  We share data strictly on a need-to-know basis to fulfill trade connections:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>With Merchants:</strong> When a buyer initiates a chat, their query and phone contact are routed to the target merchant on WhatsApp.</li>
                  <li><strong>With Payment Infrastructure:</strong> Credit top-up transactions are securely routed to licensed partners (Bachs.io, Paystack).</li>
                  <li><strong>Official Regulatory Demands:</strong> As mandated by applicable Nigerian law or valid court orders.</li>
                </ul>
              </section>

              {/* Section 5: Security & Retention */}
              <section id="security-retention" className="space-y-4 pt-6 border-t border-[#123F16]/10">
                <h2 className="text-xl sm:text-2xl font-bold text-[#123F16]">
                  5. Security & Retention
                </h2>
                <p>
                  All database connections use encrypted TLS channels and server-side row-level security. We retain merchant catalog listings for as long as the stall account remains active.
                </p>
              </section>

              {/* Section 6: User Rights */}
              <section id="user-rights" className="space-y-4 pt-6 border-t border-[#123F16]/10">
                <h2 className="text-xl sm:text-2xl font-bold text-[#123F16]">
                  6. Your Rights & Data Deletion
                </h2>
                <p>
                  You have the right to access, rectify, or request permanent deletion of your merchant profile and contact details from our search index. To submit a deletion request, email <a href="mailto:support@floate.xyz" className="text-[#2E7D32] font-bold underline">support@floate.xyz</a> with your registered WhatsApp phone number.
                </p>
              </section>

              {/* Section 7: Contact Box */}
              <section id="contact" className="p-6 sm:p-8 rounded-2xl bg-[#F7F7F2] border border-[#123F16]/15 space-y-3">
                <div className="flex items-center gap-2 font-bold text-base text-[#123F16]">
                  <Mail className="w-5 h-5 text-[#2E7D32]" />
                  <span>Contact Data Protection Office</span>
                </div>
                <p className="text-xs sm:text-sm text-[#123F16]/80">
                  For privacy inquiries, data subject rights, or regulatory correspondence:
                </p>
                <div className="text-xs font-semibold space-y-1 text-[#123F16]">
                  <p><strong>FLOATE AFRICA LTD</strong></p>
                  <p>CAC Registration: RC 9365804</p>
                  <p>Email: <a href="mailto:support@floate.xyz" className="text-[#2E7D32] underline">support@floate.xyz</a></p>
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
