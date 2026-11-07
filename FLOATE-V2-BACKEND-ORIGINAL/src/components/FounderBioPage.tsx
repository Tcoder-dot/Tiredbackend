import React from 'react';
import { LandingHeader } from './common/LandingHeader';
import { PageHero } from './common/PageHero';
import { ClosingCtaBand } from './common/ClosingCtaBand';
import { Footer } from './common/Footer';
import { SEO } from './common/SEO';
import { 
  User, Sparkles, Building2, GraduationCap, Music, Code2, 
  ArrowRight, CheckCircle2, ShieldCheck, Globe
} from 'lucide-react';

interface FounderBioPageProps {
  onBack?: () => void;
  onNavigateHome?: () => void;
  onNavigatePage?: (page: any) => void;
  onExploreStalls?: () => void;
}

export default function FounderBioPage({ onBack, onNavigateHome, onNavigatePage, onExploreStalls }: FounderBioPageProps) {
  const handleHome = onNavigateHome || onBack || (() => {});

  // Person Schema JSON-LD Structured Data
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": "https://www.floate.xyz/founder#person",
    "name": "Chukwuemeka Rich",
    "alternateName": ["TELMAN", "Rich Chigga Emeka", "Chukwuemeka Rich FLOATE"],
    "jobTitle": "Founder & Chief Executive Officer",
    "worksFor": {
      "@type": "Organization",
      "name": "FLOATE AFRICA LTD",
      "url": "https://www.floate.xyz"
    },
    "founder": [
      {
        "@type": "Organization",
        "name": "FLOATE AFRICA LTD",
        "url": "https://www.floate.xyz"
      }
    ],
    "almaMater": {
      "@type": "EducationalOrganization",
      "name": "University of Nigeria, Nsukka",
      "alternateName": "UNN",
      "department": "Department of Microbiology"
    },
    "birthPlace": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Onitsha",
        "addressRegion": "Anambra State",
        "addressCountry": "Nigeria"
      }
    },
    "knowsAbout": [
      "AI Systems Engineering",
      "Market Operating Systems",
      "Informal Economy Commerce",
      "Generative Engine Optimization"
    ],
    "url": "https://www.floate.xyz/founder"
  };

  const timelineItems = [
    {
      year: "2026",
      title: "Founding FLOATE AFRICA LTD",
      desc: "Architected the zero-friction Market Operating System and WhatsApp lead routing engine for West Africa's informal markets."
    },
    {
      year: "2025 - 2026",
      title: "AI Search & Lead Systems Engineering",
      desc: "Developed real-time entity indexing algorithms for local market trade hubs across Lagos, Enugu, and Onitsha."
    },
    {
      year: "2019 - 2023",
      title: "Microbiology & Computational Science at UNN",
      desc: "Conducted scientific research at University of Nigeria, Nsukka, bridging systems biology with computational software design."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F2] text-[#123F16] font-sans antialiased relative">
      <SEO 
        title="Chukwuemeka Rich (TELMAN) — Founder & CEO | FLOATE AFRICA LTD"
        description="Official biography of Chukwuemeka Rich (TELMAN), systems architect, AI engineer, and Founder & CEO of FLOATE AFRICA LTD."
        url="https://www.floate.xyz/founder"
        type="profile"
        schemaData={personSchema}
      />

      <LandingHeader
        onNavigateHome={handleHome}
        onNavigatePage={onNavigatePage || (() => {})}
        onExploreStalls={onExploreStalls}
        currentPage="FOUNDER"
        isDarkBg={true}
      />

      {/* ── HERO HEADER ── */}
      <PageHero
        microLabel="MEET THE FOUNDER"
        titleLine1="Chukwuemeka Rich"
        titleLine2="(TELMAN)"
        subtitle="Founder & Chief Executive Officer, FLOATE AFRICA LTD · Systems Architect & AI Engineer"
      />

      {/* ── MAIN CONTENT AREA ── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-12 sm:py-20 space-y-16">
        
        {/* Profile Card & Bio */}
        <div className="bg-white border border-[#123F16]/10 rounded-[18px] p-6 sm:p-12 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Frame Photo */}
          <div className="md:col-span-5 flex justify-center">
            <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-[18px] border-2 border-[#123F16]/20 bg-[#E8F5E9] overflow-hidden p-2 shadow-xs">
              <img
                src="https://i.postimg.cc/3xvq0kRg/1768560369161.jpg"
                alt="Chukwuemeka Rich (TELMAN)"
                className="w-full h-full object-cover rounded-[14px]"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Short Bio Text */}
          <div className="md:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F5E9] text-[#123F16] text-xs font-bold uppercase tracking-wider">
              <GraduationCap className="w-3.5 h-3.5 text-[#2E7D32]" />
              <span>UNN Microbiology Alumnus</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#123F16]">
              Building the Infrastructure for Africa's Commerce Engine
            </h2>

            <p className="text-sm sm:text-base text-[#123F16]/80 leading-relaxed font-normal">
              Chukwuemeka Rich (known professionally as <strong>TELMAN</strong>) is a Nigerian systems architect, AI engineer, and Founder/CEO of <strong>FLOATE AFRICA LTD</strong>.
            </p>

            <p className="text-sm sm:text-base text-[#123F16]/80 leading-relaxed font-normal">
              Born in Onitsha, Anambra State, Chukwuemeka observed firsthand how millions of physical market stall owners struggle to connect with online buyers. He built FLOATE to eliminate software complexity and empower local traders through direct WhatsApp search and lead routing.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-lg bg-[#F7F7F2] border border-[#123F16]/10 text-xs font-bold text-[#123F16]">
                📍 Onitsha & Lagos, Nigeria
              </span>
              <span className="px-3 py-1 rounded-lg bg-[#F7F7F2] border border-[#123F16]/10 text-xs font-bold text-[#123F16]">
                🔬 UNN Microbiology
              </span>
            </div>
          </div>

        </div>

        {/* Timeline Section */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-[#2E7D32] uppercase tracking-widest">JOURNEY & MILESTONES</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#123F16]">Career & Systems Timeline</h3>
          </div>

          <div className="bg-white border border-[#123F16]/10 rounded-[18px] p-6 sm:p-10 shadow-sm max-w-3xl mx-auto space-y-8">
            {timelineItems.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-start">
                {/* Yellow Dot */}
                <div className="w-4 h-4 rounded-full bg-[#FFC107] border-2 border-[#123F16] shrink-0 mt-1 shadow-xs" />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#2E7D32] uppercase tracking-wider">{item.year}</span>
                  <h4 className="text-base font-bold text-[#123F16]">{item.title}</h4>
                  <p className="text-xs sm:text-sm text-[#123F16]/80 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* ── CLOSING CTA BAND & FOOTER ── */}
      <ClosingCtaBand onNavigatePage={onNavigatePage} />
      <Footer onNavigateHome={handleHome} onNavigatePage={onNavigatePage} />
    </div>
  );
}
