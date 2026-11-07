import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';

interface MboPageProps {
  onBack: () => void;
  onNavigatePage?: (page: 'PRIVACY' | 'TERMS' | 'ABOUT' | 'MBO' | 'BLOG', slug?: string) => void;
}

export default function MboPage({ onBack, onNavigatePage }: MboPageProps) {
  const WHATSAPP_COMMUNITY_URL = 'https://chat.whatsapp.com/DA8AWq2SKtW5UmknNHO43X';

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [inquirySubmitted, setInquirySubmitted] = useState<boolean>(false);
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState<boolean>(false);
  const [notifyModalOpen, setNotifyModalOpen] = useState<boolean>(false);
  const [notifyEmailOrPhone, setNotifyEmailOrPhone] = useState<string>('');
  const [notifySuccess, setNotifySuccess] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    phoneOrWhatsApp: '',
    cityLocation: '',
    serviceInterested: 'VISIBILITY_SERVICES',
    message: ''
  });

  // Dynamic SEO & GEO Meta Tags + Structured Data
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "MBó by Floate — Business Digitization, CAC Registration & Small Business Visibility in Nigeria";

    // Meta Description
    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    const previousDesc = metaDesc ? metaDesc.content : '';
    if (metaDesc) {
      metaDesc.content = "MBó by Floate is Floate Africa's foundation and service arm helping informal and small businesses in Nigeria get official CAC registration, Google Business Profile setup, simple web presence, and practical sales masterclasses at genuine discounts.";
    }

    // Canonical Tag
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    const previousCanonical = canonicalLink ? canonicalLink.href : '';
    if (canonicalLink) {
      canonicalLink.href = "https://www.floate.xyz/mbo";
    } else {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = "canonical";
      canonicalLink.href = "https://www.floate.xyz/mbo";
      document.head.appendChild(canonicalLink);
    }

    // JSON-LD Structured Data for Organization, Services, and GEO FAQPage
    const jsonLdData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://floate.xyz/mbo#organization",
          "name": "MBó by Floate",
          "alternateName": [
            "MBo Floate",
            "MBÓ",
            "MBo",
            "MBO",
            "Mbo by Floate",
            "MBó Africa",
            "Mbo Africa"
          ],
          "description": "MBó by Floate is Floate Africa's foundation, community, and service arm, focused on helping informal and small businesses become visible, properly registered, and positioned to grow.",
          "url": "https://floate.xyz/mbo",
          "logo": "https://i.postimg.cc/nzQ7WvPK/20260807-223513.jpg",
          "parentOrganization": {
            "@type": "Organization",
            "name": "FLOATE AFRICA LTD",
            "url": "https://floate.xyz"
          },
          "areaServed": [
            {
              "@type": "Country",
              "name": "Nigeria"
            },
            {
              "@type": "Continent",
              "name": "Africa"
            }
          ],
          "contactPoint": [
            {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "email": "contact@floate.xyz",
              "telephone": "+2347065599116",
              "areaServed": "NG"
            },
            {
              "@type": "ContactPoint",
              "contactType": "support",
              "email": "support@floate.xyz",
              "areaServed": "NG"
            }
          ],
          "sameAs": [
            "https://chat.whatsapp.com/DA8AWq2SKtW5UmknNHO43X"
          ]
        },
        {
          "@type": "Service",
          "@id": "https://floate.xyz/mbo#visibility-services",
          "name": "MBó Visibility Services (Google Business Profile, CAC Registration & Websites)",
          "provider": {
            "@id": "https://floate.xyz/mbo#organization"
          },
          "serviceType": "Small Business Digitization",
          "description": "Hands-on Google Business Profile setup Nigeria, accredited CAC registration help Nigeria, and simple website builder services for small businesses in Nigeria at genuine discounts versus typical agency rates.",
          "areaServed": "Nigeria"
        },
        {
          "@type": "Service",
          "@id": "https://floate.xyz/mbo#growth-masterclasses",
          "name": "MBó Growth Masterclasses",
          "provider": {
            "@id": "https://floate.xyz/mbo#organization"
          },
          "serviceType": "Business Education and Training",
          "description": "Practical, small group training sessions teaching Nigerian business owners real digital skills, including using WhatsApp and social platforms for sales, pricing strategy, customer conversion, and basic digital presence management.",
          "areaServed": "Nigeria"
        },
        {
          "@type": "Service",
          "@id": "https://floate.xyz/mbo#growth-contracts",
          "name": "MBó Growth Contracts",
          "provider": {
            "@id": "https://floate.xyz/mbo#organization"
          },
          "serviceType": "Ongoing Strategic Business Support",
          "description": "Ongoing, deeper support engagements for Nigerian businesses wanting continued strategic help beyond a one time service, direct outreach support, continued visibility management, and connection into the wider Floate ecosystem.",
          "areaServed": "Nigeria"
        },
        {
          "@type": "FAQPage",
          "@id": "https://floate.xyz/mbo#faq",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is MBó by Floate?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "MBó by Floate (also known as MBo or MBo Floate) is Floate Africa's foundation, community, and service arm, focused on helping informal and small businesses become visible, properly registered, and positioned to grow. Where Floate AI connects buyers to sellers through conversational discovery, MBó works directly with businesses to build the foundation that makes them discoverable and credible in the first place."
              }
            },
            {
              "@type": "Question",
              "name": "How to set up Google Business Profile Nigeria?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "To set up a Google Business Profile in Nigeria, visit business.google.com, enter your exact commercial business name and category, provide your physical address or Nigerian service area, add your phone number, and complete ownership verification. MBó by Floate provides hands-on Google Business Profile setup Nigeria assistance, ensuring your profile is properly mapped, category-optimized, and visible when local customers search for your goods or services."
              }
            },
            {
              "@type": "Question",
              "name": "How to register a business with CAC in Nigeria?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "To register a business with CAC (Corporate Affairs Commission) in Nigeria, conduct a name availability search on the CAC Company Registration Portal (CRP), reserve your approved business name, complete pre-registration form CAC 1.1, submit government-issued identification (NIN or international passport), and pay the official statutory filing fees. MBó by Floate offers accredited CAC registration help in Nigeria, guiding small merchants through name reservation, documentation, and filing so you receive your official RC or BN certificate without costly legal markups."
              }
            },
            {
              "@type": "Question",
              "name": "Where to register business online Nigeria?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "The only official government portal to register a business online in Nigeria is the Corporate Affairs Commission (CAC) Companies Registration Portal at pre.cac.gov.ng. For merchants seeking a guided business registration service in Nigeria without navigating complex legal forms alone, MBó by Floate operates as an accredited foundation service arm assisting informal traders and sole proprietors through the entire registration and TIN generation process."
              }
            },
            {
              "@type": "Question",
              "name": "How to build a website for small business in Nigeria?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "To build a website in Nigeria for a small business, you do not need an expensive agency or complex foreign software charging monthly dollar subscriptions. A high-converting small business web presence requires a fast-loading single address, your verified product catalog, transparent pricing, customer testimonials, and direct WhatsApp ordering. MBó by Floate designs simple, high-speed websites tailored specifically for Nigerian vendors."
              }
            },
            {
              "@type": "Question",
              "name": "What problem does MBó solve for small businesses in Nigeria?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Most informal and small businesses in Nigeria are invisible online, with no Google presence, no proper business registration, and no structured way to be found by customers beyond word of mouth and foot traffic. Freelancers and agencies charge these businesses significant sums for basic digitization services, putting real visibility out of reach for many businesses that need it most. MBó by Floate provides these foundational services at genuine discounts."
              }
            },
            {
              "@type": "Question",
              "name": "How does MBó differ from Floate AI?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Where Floate AI connects buyers to sellers through conversational discovery on WhatsApp and Telegram, MBó works directly with businesses to build the foundation that makes them discoverable and credible in the first place."
              }
            }
          ]
        }
      ]
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'jsonld-mbo-schema';
    script.text = JSON.stringify(jsonLdData);
    document.head.appendChild(script);

    return () => {
      document.title = previousTitle;
      if (metaDesc) metaDesc.content = previousDesc;
      if (canonicalLink && previousCanonical) canonicalLink.href = previousCanonical;
      const el = document.getElementById('jsonld-mbo-schema');
      if (el) document.head.removeChild(el);
    };
  }, []);

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName || !formData.phoneOrWhatsApp) {
      return;
    }

    setIsSubmittingInquiry(true);

    try {
      // 1. Post to official backend API which logs and dispatches to contact@floate.xyz & support@floate.xyz
      await fetch('/api/mbo/inquire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      }).catch((err) => {
        console.warn('Backend inquiry dispatch error (proceeding with mailto fallback):', err);
      });

      // 2. Prepare prefilled official mailto trigger for contact@floate.xyz and support@floate.xyz
      const emailSubject = encodeURIComponent(`MBó Service Inquiry: ${formData.businessName}`);
      const emailBody = encodeURIComponent(
        `Hello MBó by Floate Team,\n\n` +
        `I would like to inquire about MBó services for my business.\n\n` +
        `--- Business Details ---\n` +
        `• Business Name: ${formData.businessName}\n` +
        `• Contact Person: ${formData.contactName || 'Not provided'}\n` +
        `• Phone / WhatsApp: ${formData.phoneOrWhatsApp}\n` +
        `• Location: ${formData.cityLocation || 'Not provided'}\n` +
        `• Service Interested: ${formData.serviceInterested}\n` +
        `• Additional Notes: ${formData.message || 'None'}\n\n` +
        `Please get in touch with me regarding the next steps.\n`
      );

      const mailtoUrl = `mailto:contact@floate.xyz?cc=support@floate.xyz&subject=${emailSubject}&body=${emailBody}`;

      // Trigger mail client safely
      try {
        window.location.href = mailtoUrl;
      } catch (err) {
        // Fallback
      }
    } finally {
      setIsSubmittingInquiry(false);
      setInquirySubmitted(true);
    }
  };

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmailOrPhone.trim()) return;
    setNotifySuccess(true);
    setTimeout(() => {
      setNotifyModalOpen(false);
      setNotifySuccess(false);
      setNotifyEmailOrPhone('');
    }, 2200);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans antialiased selection:bg-[#661C95]/15 selection:text-[#661C95]">
      
      {/* 1. TOP HEADER & BRAND NAV */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={onBack}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
              title="Return to Floate AI Overview"
            >
              <ArrowLeft className="w-4 h-4 text-[#661C95]" />
              <span className="hidden sm:inline">Floate Overview</span>
            </button>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            {/* Brand Logo */}
            <div 
              onClick={onBack}
              className="flex items-center space-x-2.5 cursor-pointer select-none"
            >
              <img
                src="https://i.postimg.cc/nzQ7WvPK/20260807-223513.jpg"
                alt="Floate Africa"
                className="h-9 w-auto object-contain rounded-md"
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-bold tracking-tight uppercase leading-tight text-slate-950 font-sans">
                  MBÓ <span className="text-[#661C95] text-xs sm:text-sm font-bold tracking-widest">BY FLOATE</span>
                </span>
                <span className="text-[10px] tracking-wider uppercase text-slate-500 font-medium">
                  Foundation &amp; Service Arm
                </span>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center space-x-6 text-xs font-semibold uppercase tracking-wider text-slate-600 font-sans">
            <button 
              onClick={() => handleScrollTo('the-problem')}
              className="hover:text-[#661C95] transition cursor-pointer"
            >
              The Problem
            </button>
            <button 
              onClick={() => handleScrollTo('services')}
              className="hover:text-[#661C95] transition cursor-pointer"
            >
              Services
            </button>
            <button 
              onClick={() => handleScrollTo('masterclasses')}
              className="hover:text-[#661C95] transition cursor-pointer"
            >
              Masterclasses
            </button>
            <button 
              onClick={() => handleScrollTo('geo-answers')}
              className="hover:text-[#661C95] transition cursor-pointer"
            >
              Direct Answers
            </button>
          </nav>

          {/* Primary CTA */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => handleScrollTo('inquire')}
              className="px-4 sm:px-5 py-2.5 bg-[#661C95] hover:bg-[#52137E] text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition shadow-sm cursor-pointer"
            >
              <span>Inquire Now</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto space-y-6 text-left">
          
          {/* Semantic H1: Clean, high-legibility sans-serif with MBó by Floate brand name explicitly included */}
          <h1 className="text-3xl sm:text-5xl lg:text-[46px] font-bold text-slate-950 tracking-tight leading-[1.15]">
            <span className="text-[#661C95] block text-xl sm:text-2xl font-bold uppercase tracking-wider mb-2">
              MBó by Floate
            </span>
            A real, professional online presence for small businesses in Nigeria, without the cost of building alone.
          </h1>

          {/* Clear, direct positioning with brand name and search variants */}
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            <strong className="text-slate-950">MBó by Floate</strong> (also known as <strong className="text-slate-900">MBo</strong> or <strong className="text-slate-900">MBo Floate</strong>) is Floate Africa's foundation, community, and service arm. We work directly with informal and small Nigerian businesses to build the foundation they need: official CAC business registration, Google Business Profile setup, simple web presence, and practical sales masterclasses, at a genuine discount versus typical agency rates.
          </p>

          {/* Clear CTAs: Inquire and Join WhatsApp Community */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <button
              onClick={() => handleScrollTo('inquire')}
              className="px-7 py-3.5 bg-[#661C95] hover:bg-[#52137E] text-white font-semibold text-sm rounded-xl transition shadow-sm text-center cursor-pointer"
            >
              Inquire About Services
            </button>
            <a
              href={WHATSAPP_COMMUNITY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 font-semibold text-sm rounded-xl transition text-center cursor-pointer"
            >
              <span>Join WhatsApp Community</span>
            </a>
          </div>

          {/* Factual foundation points */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600 font-medium">
            <span>• CAC business registration assistance</span>
            <span>• Google Business Profile &amp; Search setup</span>
            <span>• Practical WhatsApp &amp; sales masterclasses</span>
          </div>

        </div>
      </section>

      {/* 3. THE PROBLEM SECTION */}
      <section id="the-problem" className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
        
        <div className="space-y-3 text-left">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
            The Problem MBó Solves
          </h2>
        </div>

        {/* Clear Problem Explanation */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
          <div className="space-y-4 text-slate-700 text-sm sm:text-base leading-relaxed">
            <p className="font-semibold text-slate-950 text-base sm:text-lg leading-snug">
              Most informal and small businesses in Nigeria are invisible online: no Google presence, no proper business registration, and no structured way to be found by customers beyond word of mouth and foot traffic.
            </p>
            <p>
              When a small merchant, artisan, or sole proprietor tries to fix this, they run into an unfair financial wall. Freelancers and agencies charge these businesses significant sums for basic digitization services:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="block text-xs font-semibold uppercase text-slate-500">Service</span>
                <span className="font-bold text-slate-900 text-sm">Google Business Profile</span>
                <p className="text-xs text-slate-600 mt-1">Frequently billed at exorbitant setup fees for basic map pins.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="block text-xs font-semibold uppercase text-slate-500">Service</span>
                <span className="font-bold text-slate-900 text-sm">CAC Registration</span>
                <p className="text-xs text-slate-600 mt-1">Marked up heavily by intermediaries without transparent guidance.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="block text-xs font-semibold uppercase text-slate-500">Service</span>
                <span className="font-bold text-slate-900 text-sm">Simple Websites</span>
                <p className="text-xs text-slate-600 mt-1">Overcharged for bloated templates that merchants cannot maintain.</p>
              </div>
            </div>

            <p className="pt-2 text-slate-800 font-medium">
              This expensive friction puts real visibility completely out of reach for many of the businesses that would benefit most. MBó by Floate exists to remove this barrier.
            </p>
          </div>
        </div>

      </section>

      {/* 4. OUR SERVICES: THE THREE PILLARS */}
      <section id="services" className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10 border-t border-slate-200">
        
        <div className="text-left space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
            What MBó Offers: The Three Pillars
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
            Structured services, practical small-group training, and ongoing strategic contracts designed specifically for informal and growing small businesses.
          </p>
        </div>

        <div className="space-y-6">
          
          {/* Pillar 1: Visibility Services */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#661C95]">
                  Pillar 01
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-950">
                  Visibility Services
                </h3>
              </div>
              <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 w-fit">
                Genuine Discount vs Agency Rates
              </span>
            </div>

            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              We help informal and small businesses establish their public, verified digital presence. Instead of paying inflated agency fees, businesses get hands-on assistance at a genuine discount:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#661C95] block">
                  Service 01
                </span>
                <h4 className="text-sm font-bold text-slate-950">Google Business Profile Setup Nigeria</h4>
                <p className="text-xs text-slate-600 leading-normal">
                  Setup and complete profile optimization so local buyers find your business when searching on Google Search and Google Maps across Nigerian cities.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#661C95] block">
                  Service 02
                </span>
                <h4 className="text-sm font-bold text-slate-950">CAC Registration Help Nigeria</h4>
                <p className="text-xs text-slate-600 leading-normal">
                  Guidance and direct administrative assistance to secure official Corporate Affairs Commission (CAC) business name registration and TIN.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#661C95] block">
                  Service 03
                </span>
                <h4 className="text-sm font-bold text-slate-950">Build Website for Small Business Nigeria</h4>
                <p className="text-xs text-slate-600 leading-normal">
                  Simple, fast, and mobile-responsive website builds that showcase your products, address, and credentials without expensive hosting or maintenance fees.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setFormData(prev => ({ ...prev, serviceInterested: 'VISIBILITY_SERVICES' }));
                  handleScrollTo('inquire');
                }}
                className="text-xs font-bold uppercase tracking-wider text-[#661C95] hover:text-[#52137E] flex items-center gap-1 cursor-pointer"
              >
                <span>Inquire About Visibility Services</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Pillar 2: Growth Masterclasses */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#661C95]">
                  Pillar 02
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-950">
                  Growth Masterclasses
                </h3>
              </div>
              <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-purple-50 text-[#661C95] border border-purple-200 w-fit">
                Practical Small Group Sessions
              </span>
            </div>

            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              Practical, small group training sessions teaching business owners real digital skills. No theoretical fluff, just actionable techniques that can be applied immediately:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <h4 className="text-sm font-bold text-slate-950">WhatsApp &amp; Social Platform Sales</h4>
                <p className="text-xs text-slate-600 leading-normal">
                  Structuring daily messaging workflows, status catalogs, and conversational messaging to convert chats into immediate orders.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <h4 className="text-sm font-bold text-slate-950">Pricing Strategy</h4>
                <p className="text-xs text-slate-600 leading-normal">
                  Setting price margins that stay competitive while protecting profitability against inflation and wholesale supply fluctuations.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <h4 className="text-sm font-bold text-slate-950">Customer Conversion</h4>
                <p className="text-xs text-slate-600 leading-normal">
                  Practical handling of objections, closing sales on calls or chats, and turning one-time buyers into loyal repeat patrons.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <h4 className="text-sm font-bold text-slate-950">Basic Digital Presence Management</h4>
                <p className="text-xs text-slate-600 leading-normal">
                  Keeping your business information, operating hours, customer reviews, and online profiles organized and updated regularly.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setFormData(prev => ({ ...prev, serviceInterested: 'GROWTH_MASTERCLASSES' }));
                  handleScrollTo('inquire');
                }}
                className="text-xs font-bold uppercase tracking-wider text-[#661C95] hover:text-[#52137E] flex items-center gap-1 cursor-pointer"
              >
                <span>Inquire About Growth Masterclasses</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Pillar 3: Growth Contracts */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#661C95]">
                  Pillar 03
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-950">
                  Growth Contracts
                </h3>
              </div>
              <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 w-fit">
                Ongoing Strategic Engagements
              </span>
            </div>

            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              Ongoing, deeper support engagements for businesses wanting continued strategic help beyond a one-time service:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
                  Engagement 01
                </span>
                <h4 className="text-sm font-bold text-slate-950">Direct Outreach Support</h4>
                <p className="text-xs text-slate-600 leading-normal">
                  Hands-on assistance executing structured customer outreach, follow-ups, and targeted B2B merchant pipelines.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
                  Engagement 02
                </span>
                <h4 className="text-sm font-bold text-slate-950">Continued Visibility Management</h4>
                <p className="text-xs text-slate-600 leading-normal">
                  Ongoing management of search listings, reputation, profile enhancements, and customer review responses.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
                  Engagement 03
                </span>
                <h4 className="text-sm font-bold text-slate-950">Floate Ecosystem Connection</h4>
                <p className="text-xs text-slate-600 leading-normal">
                  Priority pipeline and structured integration into Floate AI's buyer discovery network for direct qualified leads.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setFormData(prev => ({ ...prev, serviceInterested: 'GROWTH_CONTRACTS' }));
                  handleScrollTo('inquire');
                }}
                className="text-xs font-bold uppercase tracking-wider text-[#661C95] hover:text-[#52137E] flex items-center gap-1 cursor-pointer"
              >
                <span>Inquire About Growth Contracts</span>
                <span>→</span>
              </button>
            </div>
          </div>

        </div>

      </section>

      {/* 5. EVENTS / MASTERCLASSES SECTION (PLACEHOLDER READY FOR FUTURE CONTENT) */}
      <section id="masterclasses" className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 border-t border-slate-200">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-left">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
              Events &amp; Masterclasses
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-sm">
              Practical, small group learning sessions designed to build real digital execution skills for business owners.
            </p>
          </div>
        </div>

        {/* Structured Container: Built with full fields, currently showing friendly empty state */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-2xs space-y-8">
          
          {/* Friendly 'No upcoming events yet' status banner */}
          <div className="p-6 rounded-xl bg-slate-50 border border-slate-200/90 text-center space-y-3">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#661C95] block">
                Cohort Schedule
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-950">
                No upcoming events yet, check back soon
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                Our next cohort of practical small group training sessions is currently being scheduled. Sign up to get notified as soon as registrations open.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setNotifyModalOpen(true)}
                className="px-6 py-2.5 bg-[#661C95] hover:bg-[#52137E] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-sm cursor-pointer"
              >
                <span>Notify Me When Dates Open</span>
              </button>
            </div>
          </div>

          {/* Structured Blueprint for Future Events */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Program Architecture Preview
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-80">
              <div className="p-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Cohort Schedule: To Be Announced</span>
                  <span className="text-[#661C95] font-bold">Small Group</span>
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  Small Business Digital Visibility &amp; Sales Masterclass
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Hands-on workshop covering Google Business Profile setup, WhatsApp business workflows, and pricing optimization for small merchants.
                </p>
                <div className="pt-2 text-[11px] text-slate-500 font-medium">
                  Location: In-person workshops &amp; interactive virtual sessions
                </div>
              </div>

              <div className="p-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Cohort Schedule: To Be Announced</span>
                  <span className="text-[#661C95] font-bold">Small Group</span>
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  CAC Registration &amp; Commercial Credibility Clinic
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Step-by-step assistance clinic helping informal entrepreneurs complete their legal business registration and setup.
                </p>
                <div className="pt-2 text-[11px] text-slate-500 font-medium">
                  Location: In-person workshops &amp; interactive virtual sessions
                </div>
              </div>
            </div>
          </div>

        </div>

      </section>

      {/* 6. GEO DIRECT ANSWERS & SERVICE INTENT GUIDES */}
      <section id="geo-answers" className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12 border-t border-slate-200">
        
        <div className="text-left space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#661C95] block">
            Practical Business Guides &amp; Direct Answers
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
            Direct Answers: Business Registration, Google Presence &amp; Websites in Nigeria
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            Plain, factual guidance designed for small business owners, verified by MBó by Floate's foundation team.
          </p>
        </div>

        {/* 4 Dedicated Service-Intent Answer Blocks with Semantic Headings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Block 1: Google Business Profile Setup Nigeria */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#661C95] block">
              Google Presence Guide
            </span>
            <h3 className="text-lg font-bold text-slate-950 leading-snug">
              Google Business Profile Setup Nigeria: How to Set Up Google Business Profile Nigeria
            </h3>
            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2.5">
              <p>
                To complete a <strong>Google Business Profile setup Nigeria</strong>, visit business.google.com, enter your verified commercial name, select your exact business category, enter your Nigerian store address (or define local delivery service areas), and submit your active phone number.
              </p>
              <p>
                Knowing <strong>how to set up Google Business Profile Nigeria</strong> correctly allows local customers searching on Google Maps and Google Search to find your store immediately. MBó by Floate provides hands-on profile setup, category optimization, and verification support so your business appears in local search results without exorbitant agency charges.
              </p>
            </div>
          </div>

          {/* Block 2: CAC Registration Help Nigeria */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#661C95] block">
              Legal Registration Guide
            </span>
            <h3 className="text-lg font-bold text-slate-950 leading-snug">
              CAC Registration Help Nigeria: How to Register a Business with CAC
            </h3>
            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2.5">
              <p>
                Entrepreneurs wondering <strong>how to register a business with CAC</strong> (Corporate Affairs Commission) must follow four key stages: conducting a name availability search on the CAC portal, reserving the approved name, submitting registration documents along with the owner's National Identification Number (NIN), and paying statutory government filing fees.
              </p>
              <p>
                If you require reliable <strong>CAC registration help Nigeria</strong>, MBó by Floate guides informal traders, artisans, and sole proprietors through the full registration workflow, helping you obtain your official Business Name (BN) or Company Registration (RC) certificate and Tax Identification Number (TIN) without hidden legal fees.
              </p>
            </div>
          </div>

          {/* Block 3: Where to Register Business Online Nigeria */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#661C95] block">
              Online Registration &amp; Services
            </span>
            <h3 className="text-lg font-bold text-slate-950 leading-snug">
              Where to Register Business Online Nigeria: Choosing a Business Registration Service Nigeria
            </h3>
            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2.5">
              <p>
                The official portal for <strong>where to register business online Nigeria</strong> is the Corporate Affairs Commission Companies Registration Portal at pre.cac.gov.ng. All legitimate business registrations and company incorporations must be processed through this platform.
              </p>
              <p>
                Because portal queries, document rejections, and naming conflicts can cause weeks of delay, using an accredited <strong>business registration service Nigeria</strong> like MBó by Floate ensures your documentation is prepared accurately, filed promptly, and tracked to final certificate issuance.
              </p>
            </div>
          </div>

          {/* Block 4: Build Website Nigeria */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#661C95] block">
              Small Business Web Guide
            </span>
            <h3 className="text-lg font-bold text-slate-950 leading-snug">
              Build Website Nigeria: Practical Website Builder for Small Business Nigeria
            </h3>
            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2.5">
              <p>
                When seeking to <strong>build website Nigeria</strong>, small merchants do not need complex, bloated web templates that demand monthly foreign currency hosting fees. A tailored <strong>website builder for small business Nigeria</strong> focuses on what drives local sales: ultra-fast mobile loading on local networks, transparent product pricing, verified contact details, and direct one-click WhatsApp order buttons.
              </p>
              <p>
                MBó by Floate builds streamlined, high-speed single-address web presences tailored for Nigerian merchants, giving your brand instant commercial credibility without technical headaches.
              </p>
            </div>
          </div>

        </div>

        {/* In-depth Guides Cross-Link */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#661C95] block">
                Educational Knowledge Base
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-slate-950">
                In-Depth Guides &amp; Case Studies
              </h3>
            </div>
            <button
              onClick={() => {
                if (onNavigatePage) {
                  onNavigatePage('BLOG');
                } else {
                  window.history.pushState({}, '', '/blog');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }
              }}
              className="text-xs font-bold text-[#661C95] hover:underline cursor-pointer flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Explore All Guides</span>
              <span>→</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div 
              onClick={() => {
                if (onNavigatePage) {
                  onNavigatePage('BLOG', 'how-to-register-a-business-in-nigeria');
                } else {
                  window.history.pushState({}, '', '/blog/how-to-register-a-business-in-nigeria');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }
              }}
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-[#661C95] transition cursor-pointer space-y-1.5 shadow-2xs group"
            >
              <span className="text-[11px] font-bold text-[#661C95] uppercase">CAC Legal Guide</span>
              <h4 className="text-sm font-bold text-slate-950 group-hover:text-[#661C95] transition">
                How to Register a Business in Nigeria (CAC Step by Step 2026)
              </h4>
              <p className="text-xs text-slate-600 line-clamp-2">
                Learn name availability search, documents, NIN requirements, and fee schedules for Business Name vs Limited Company.
              </p>
            </div>

            <div 
              onClick={() => {
                if (onNavigatePage) {
                  onNavigatePage('BLOG', 'from-invisible-to-in-demand-nigerian-businesses-online-presence');
                } else {
                  window.history.pushState({}, '', '/blog/from-invisible-to-in-demand-nigerian-businesses-online-presence');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }
              }}
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-[#661C95] transition cursor-pointer space-y-1.5 shadow-2xs group"
            >
              <span className="text-[11px] font-bold text-[#661C95] uppercase">Google Presence</span>
              <h4 className="text-sm font-bold text-slate-950 group-hover:text-[#661C95] transition">
                From Invisible to In Demand: How Nigerian Businesses Build an Online Presence
              </h4>
              <p className="text-xs text-slate-600 line-clamp-2">
                Why word of mouth isn't enough in 2026, and how local search verification transforms daily customer inquiries.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive FAQ Accordion */}
        <div className="space-y-4 pt-4">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-950">
              Frequently Asked Questions About MBó by Floate
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Click any question below to view detailed answers on services, pricing, and eligibility.
            </p>
          </div>

          <div className="space-y-3">
            
            {/* Q1 */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === 0 ? null : 0)}
                className="w-full p-5 text-left font-bold text-slate-950 text-sm sm:text-base flex items-center justify-between gap-4 hover:bg-slate-50/70 transition cursor-pointer"
              >
                <span>What is MBó by Floate?</span>
                {openFaqIndex === 0 ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
              </button>
              {openFaqIndex === 0 && (
                <div className="px-5 pb-5 pt-1 text-sm text-slate-700 leading-relaxed border-t border-slate-100 font-medium">
                  <strong>MBó by Floate</strong> (also referred to as <strong>MBo</strong> or <strong>MBo Floate</strong>) is Floate Africa's foundation, community, and service arm, focused on helping informal and small businesses become visible, properly registered, and positioned to grow. Where Floate AI connects buyers to sellers through conversational discovery, MBó works directly with businesses to build the foundation that makes them discoverable and credible in the first place.
                </div>
              )}
            </div>

            {/* Q2 */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === 1 ? null : 1)}
                className="w-full p-5 text-left font-bold text-slate-950 text-sm sm:text-base flex items-center justify-between gap-4 hover:bg-slate-50/70 transition cursor-pointer"
              >
                <span>How to set up Google Business Profile Nigeria?</span>
                {openFaqIndex === 1 ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
              </button>
              {openFaqIndex === 1 && (
                <div className="px-5 pb-5 pt-1 text-sm text-slate-700 leading-relaxed border-t border-slate-100 font-medium">
                  To set up a Google Business Profile in Nigeria, create an account at business.google.com, enter your business name and correct category, provide your physical store address or local delivery service area, add your WhatsApp or phone number, and complete phone or postcard verification. MBó by Floate assists business owners through every step of Google Business Profile setup Nigeria to ensure accurate mapping and fast discovery.
                </div>
              )}
            </div>

            {/* Q3 */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === 2 ? null : 2)}
                className="w-full p-5 text-left font-bold text-slate-950 text-sm sm:text-base flex items-center justify-between gap-4 hover:bg-slate-50/70 transition cursor-pointer"
              >
                <span>How to register a business with CAC in Nigeria?</span>
                {openFaqIndex === 2 ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
              </button>
              {openFaqIndex === 2 && (
                <div className="px-5 pb-5 pt-1 text-sm text-slate-700 leading-relaxed border-t border-slate-100 font-medium">
                  To register a business with CAC (Corporate Affairs Commission), perform a name search on the Company Registration Portal, reserve your approved name, submit registration forms with valid identification (NIN or passport), and pay official statutory fees. MBó by Floate provides hands-on CAC registration help Nigeria, managing the filing process for sole proprietorships and limited liability companies.
                </div>
              )}
            </div>

            {/* Q4 */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === 3 ? null : 3)}
                className="w-full p-5 text-left font-bold text-slate-950 text-sm sm:text-base flex items-center justify-between gap-4 hover:bg-slate-50/70 transition cursor-pointer"
              >
                <span>Where to register business online Nigeria?</span>
                {openFaqIndex === 3 ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
              </button>
              {openFaqIndex === 3 && (
                <div className="px-5 pb-5 pt-1 text-sm text-slate-700 leading-relaxed border-t border-slate-100 font-medium">
                  The only statutory government portal is pre.cac.gov.ng. If you prefer experienced guidance to avoid document rejection and delays, MBó by Floate acts as a trusted business registration service Nigeria, handling name clearance and submission until you receive your certified documents.
                </div>
              )}
            </div>

            {/* Q5 */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === 4 ? null : 4)}
                className="w-full p-5 text-left font-bold text-slate-950 text-sm sm:text-base flex items-center justify-between gap-4 hover:bg-slate-50/70 transition cursor-pointer"
              >
                <span>How to build website Nigeria for small businesses?</span>
                {openFaqIndex === 4 ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
              </button>
              {openFaqIndex === 4 && (
                <div className="px-5 pb-5 pt-1 text-sm text-slate-700 leading-relaxed border-t border-slate-100 font-medium">
                  To build a website for small business in Nigeria, focus on mobile responsiveness, fast load speeds, clear Naira pricing, customer proof, and direct WhatsApp ordering. MBó by Floate creates high-performance web presences without expensive recurring costs.
                </div>
              )}
            </div>

            {/* Q6 */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === 5 ? null : 5)}
                className="w-full p-5 text-left font-bold text-slate-950 text-sm sm:text-base flex items-center justify-between gap-4 hover:bg-slate-50/70 transition cursor-pointer"
              >
                <span>What problem does MBó solve for small businesses in Nigeria?</span>
                {openFaqIndex === 5 ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
              </button>
              {openFaqIndex === 5 && (
                <div className="px-5 pb-5 pt-1 text-sm text-slate-700 leading-relaxed border-t border-slate-100 font-medium">
                  Most informal and small businesses in Nigeria are invisible online: no Google presence, no proper business registration, and no structured way to be found by customers beyond word of mouth and foot traffic. Freelancers and agencies charge significant sums for basic digitization services, putting real visibility out of reach for many businesses that need it most. MBó provides these services at genuine discounts.
                </div>
              )}
            </div>

            {/* Q7 */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === 6 ? null : 6)}
                className="w-full p-5 text-left font-bold text-slate-950 text-sm sm:text-base flex items-center justify-between gap-4 hover:bg-slate-50/70 transition cursor-pointer"
              >
                <span>How does MBó by Floate differ from Floate AI?</span>
                {openFaqIndex === 6 ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
              </button>
              {openFaqIndex === 6 && (
                <div className="px-5 pb-5 pt-1 text-sm text-slate-700 leading-relaxed border-t border-slate-100 font-medium">
                  Where Floate AI connects buyers to sellers through conversational discovery on WhatsApp and Telegram, MBó works directly with businesses to build the foundation that makes them discoverable and credible in the first place.
                </div>
              )}
            </div>

          </div>
        </div>

      </section>

      {/* 7. CONTACT / INQUIRE ABOUT SERVICES */}
      <section id="inquire" className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 border-t border-slate-200">
        
        <div className="space-y-3 text-left">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
            Inquire About MBó Services
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl">
            Tell us about your business. Whether you need Google Business Profile setup, CAC registration help, a masterclass seat, or a growth contract, we are here to support your foundation.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          {inquirySubmitted ? (
            <div className="text-center py-10 space-y-6">
              <div className="space-y-2 max-w-lg mx-auto">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">
                  Submission Successful
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-950">Inquiry Sent to Official Floate Team</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Thank you for reaching out for <strong className="text-slate-900">{formData.businessName}</strong>. Your inquiry has been prepared and sent directly to our official emails: <strong className="text-[#661C95]">contact@floate.xyz</strong> and <strong className="text-[#661C95]">support@floate.xyz</strong>.
                </p>
                <p className="text-xs text-slate-500">
                  Our foundation team will review your submission and contact you via phone or WhatsApp. You can also join our official WhatsApp Community to connect with our team and fellow business owners.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={`mailto:contact@floate.xyz?cc=support@floate.xyz&subject=${encodeURIComponent(`MBó Service Inquiry: ${formData.businessName}`)}&body=${encodeURIComponent(
                    `Hello MBó by Floate Team,\n\nI just submitted an inquiry for ${formData.businessName} (${formData.phoneOrWhatsApp}).\nService: ${formData.serviceInterested}\nLocation: ${formData.cityLocation || 'N/A'}\nNotes: ${formData.message || 'N/A'}\n\nThank you.`
                  )}`}
                  className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-xs text-center cursor-pointer"
                >
                  <span>Open in Mail App</span>
                </a>

                <a
                  href={WHATSAPP_COMMUNITY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 bg-[#661C95] hover:bg-[#52137E] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-sm text-center cursor-pointer"
                >
                  <span>Join WhatsApp Community</span>
                </a>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setInquirySubmitted(false);
                    setFormData({
                      businessName: '',
                      contactName: '',
                      phoneOrWhatsApp: '',
                      cityLocation: '',
                      serviceInterested: 'VISIBILITY_SERVICES',
                      message: ''
                    });
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline underline-offset-4 cursor-pointer"
                >
                  Submit Another Inquiry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleInquirySubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Business Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="e.g. Amaka Fabrics &amp; Couture"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#661C95] font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="e.g. Amaka Nwosu"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#661C95] font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Phone or WhatsApp Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phoneOrWhatsApp}
                    onChange={(e) => setFormData({ ...formData, phoneOrWhatsApp: e.target.value })}
                    placeholder="e.g. 08012345678"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#661C95] font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    City / Location
                  </label>
                  <input
                    type="text"
                    value={formData.cityLocation}
                    onChange={(e) => setFormData({ ...formData, cityLocation: e.target.value })}
                    placeholder="e.g. Lagos, Onitsha, Kano, Abuja"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#661C95] font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Service You Are Inquiring About
                </label>
                <select
                  value={formData.serviceInterested}
                  onChange={(e) => setFormData({ ...formData, serviceInterested: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#661C95] font-medium"
                >
                  <option value="VISIBILITY_SERVICES">Pillar 1: Visibility Services (Google Profile, CAC, Website)</option>
                  <option value="GROWTH_MASTERCLASSES">Pillar 2: Growth Masterclasses (Small Group Training)</option>
                  <option value="GROWTH_CONTRACTS">Pillar 3: Growth Contracts (Ongoing Strategic Engagements)</option>
                  <option value="ALL_SERVICES">General Inquiry / Full Foundation Support</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Brief Note or Question
                </label>
                <textarea
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us what your business currently sells and what foundation milestone you want to achieve..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#661C95] font-medium"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="submit"
                  disabled={isSubmittingInquiry}
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#661C95] hover:bg-[#52137E] disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-md cursor-pointer text-center"
                >
                  <span>{isSubmittingInquiry ? 'Sending Inquiry...' : 'Submit Service Inquiry'}</span>
                </button>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                  <span>Official email:</span>
                  <a
                    href="mailto:contact@floate.xyz?subject=MBó%20by%20Floate%20Inquiry"
                    className="text-[#661C95] hover:underline font-bold"
                  >
                    contact@floate.xyz
                  </a>
                  <span>,</span>
                  <a
                    href="mailto:support@floate.xyz?subject=MBó%20by%20Floate%20Inquiry"
                    className="text-[#661C95] hover:underline font-bold"
                  >
                    support@floate.xyz
                  </a>
                  <span className="hidden sm:inline">•</span>
                  <a
                    href={WHATSAPP_COMMUNITY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:underline font-bold inline-flex items-center gap-1"
                  >
                    <span>Join WhatsApp Community</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>
            </form>
          )}
        </div>

      </section>

      {/* 8. NOTIFY MODAL FOR FUTURE MASTERCLASSES */}
      {notifyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-xl border border-slate-200 relative">
            <button
              onClick={() => setNotifyModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#661C95]">
                Masterclasses Notification
              </span>
              <h3 className="text-lg font-bold text-slate-950">
                Get Notified When Cohorts Open
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Leave your email or WhatsApp number to be the first to know when the next practical small group session is scheduled.
              </p>
            </div>

            {notifySuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
                <span>Thank you! You will be notified as soon as registrations open.</span>
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} className="space-y-3 pt-1">
                <input
                  type="text"
                  required
                  value={notifyEmailOrPhone}
                  onChange={(e) => setNotifyEmailOrPhone(e.target.value)}
                  placeholder="Enter email or WhatsApp number"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#661C95] font-medium"
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-[#661C95] hover:bg-[#52137E] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-sm cursor-pointer"
                >
                  <span>Register for Notifications</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-slate-950 text-white border-t border-slate-900 py-12 px-4 sm:px-6 lg:px-8 text-xs">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-slate-900 pb-8">
            <div className="flex items-center space-x-3">
              <img
                src="https://i.postimg.cc/nzQ7WvPK/20260807-223513.jpg"
                alt="MBó by Floate"
                className="h-8 w-auto object-contain rounded-md"
                referrerPolicy="no-referrer"
              />
              <div>
                <span className="font-bold text-sm tracking-wider uppercase block text-white">
                  MBÓ <span className="text-[#E8B923]">BY FLOATE</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  Foundation, Community &amp; Service Arm of Floate Africa Ltd
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-slate-300">
              <button
                onClick={onBack}
                className="hover:text-white underline underline-offset-4 cursor-pointer"
              >
                Floate AI Overview
              </button>
              <span>•</span>
              <a
                href={WHATSAPP_COMMUNITY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#E8B923] cursor-pointer"
              >
                WhatsApp Community
              </a>
              <span>•</span>
              <a
                href="mailto:contact@floate.xyz"
                className="hover:text-[#E8B923] cursor-pointer"
              >
                contact@floate.xyz
              </a>
              <span>,</span>
              <a
                href="mailto:support@floate.xyz"
                className="hover:text-[#E8B923] cursor-pointer"
              >
                support@floate.xyz
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <p>© {new Date().getFullYear()} FLOATE AFRICA LTD (RC: 9365804). 26, Abagana street, fegge onitsha, Anambra State.</p>
            <p>MBó by Floate, Building the Foundation for African Small Business Visibility.</p>
          </div>

        </div>
      </footer>

    </div>
  );
}
