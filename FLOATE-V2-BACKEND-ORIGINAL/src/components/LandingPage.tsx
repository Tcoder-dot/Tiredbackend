import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LandingHeader } from './common/LandingHeader';
import { WebSearchDemo } from './WebSearchDemo';
import { BrandAdBannerCarousel } from './common/BrandAdBannerCarousel';
import { SEO } from './common/SEO';
import { 
  Search, Mic, Sparkles, MessageCircle, Store, CheckCircle2, 
  ArrowRight, MapPin, ChevronRight, ShieldCheck, Zap, 
  Star, Quote, Users, ShoppingBag, PhoneCall, Award, Globe, 
  ArrowUpRight, Clock, MessageSquare, Check, Laptop, Sparkle, Shirt, Footprints, Flame, Wrench,
  Heart, BarChart2
} from 'lucide-react';

interface LandingPageProps {
  onSearch: (query: string) => void;
  onExploreStalls: () => void;
  onOpenVendor: (slug: string) => void;
  onOpenProduct?: (productId: string) => void;
  onSelectCategory: (category: string) => void;
  onSelectHub: (slug: string) => void;
  onOpenMerchantAuth?: () => void;
  onOpenMerchantDashboard?: () => void;
  onNavigatePage?: (page: 'COMPANY' | 'VENDORS_PAGE' | 'ECO_PARTNERS' | 'WHATSAPP_AI' | 'TELEGRAM_AI' | 'BLOG' | 'CONTACT' | 'ABOUT' | 'PRIVACY' | 'TERMS') => void;
}

const WHATSAPP_BOT_URL = "https://wa.me/2349115162081?text=Hi%20Floate%20I%20want%20to%20register%20my%20business";
const REGISTER_BUSINESS_URL = "https://wa.me/2349115162081?text=Hi%20Floate%20I%20want%20to%20register%20my%20business";

// Scroll-Reveal Animation Wrapper with Framer Motion (GPU Accelerated)
interface FadeInWhenVisibleProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  key?: React.Key;
}

const FadeInWhenVisible: React.FC<FadeInWhenVisibleProps> = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.15 }}
    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay }}
    className={`transform-gpu ${className}`}
    style={{ willChange: 'transform, opacity' }}
  >
    {children}
  </motion.div>
);


// 2D Vector Product Illustration Components (Crisp, modern, 2-3 products per category)
const GadgetsIllustration = () => (
  <svg viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-h-32 object-contain">
    {/* MacBook */}
    <g className="transition-transform duration-300 hover:scale-105">
      <rect x="25" y="45" width="95" height="60" rx="6" fill="#13241F" stroke="#13241F" strokeWidth="2.5" />
      <rect x="30" y="50" width="85" height="50" rx="3" fill="#6EE7B7" />
      <path d="M68 70C68 66 74 66 74 70C74 74 68 78 68 78H78" stroke="#13241F" strokeWidth="2" strokeLinecap="round" />
      <path d="M15 106C15 105 20 105 25 105H120C125 105 130 105 130 106L135 112H10L15 106Z" fill="#F4EFE3" stroke="#13241F" strokeWidth="2.5" />
      <rect x="62" y="106" width="20" height="2" rx="1" fill="#13241F" />
    </g>

    {/* iPhone Pro */}
    <g className="transition-transform duration-300 hover:scale-105">
      <rect x="135" y="30" width="48" height="88" rx="10" fill="#FFFFFF" stroke="#13241F" strokeWidth="2.5" />
      <rect x="140" y="35" width="38" height="78" rx="6" fill="#FDE047" />
      <rect x="150" y="32" width="18" height="4" rx="2" fill="#13241F" />
      {/* Camera island */}
      <rect x="142" y="40" width="18" height="18" rx="4" fill="#FFFFFF" stroke="#13241F" strokeWidth="1.5" />
      <circle cx="147" cy="45" r="2.5" fill="#13241F" />
      <circle cx="155" cy="45" r="2.5" fill="#13241F" />
      <circle cx="151" cy="53" r="2.5" fill="#13241F" />
    </g>

    {/* Wireless Earbuds Case */}
    <g className="transition-transform duration-300 hover:scale-105">
      <rect x="190" y="65" width="38" height="46" rx="12" fill="#F472B6" stroke="#13241F" strokeWidth="2.5" />
      <path d="M190 82H228" stroke="#13241F" strokeWidth="2" />
      <circle cx="209" cy="94" r="3" fill="#FFFFFF" stroke="#13241F" strokeWidth="1.5" />
    </g>
  </svg>
);

const FashionIllustration = () => (
  <svg viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-h-32 object-contain">
    {/* Tailored Senator Suit on Hanger */}
    <g className="transition-transform duration-300 hover:scale-105">
      <path d="M48 35L70 24L92 35" stroke="#13241F" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="70" cy="18" r="5" stroke="#13241F" strokeWidth="2" fill="none" />
      <path d="M45 40L35 75L50 80L55 115H85L90 80L105 75L95 40L70 48L45 40Z" fill="#E8F5E9" stroke="#13241F" strokeWidth="2.5" />
      <path d="M70 48V115" stroke="#13241F" strokeWidth="2" strokeDasharray="3 3" />
      <circle cx="70" cy="62" r="2" fill="#13241F" />
      <circle cx="70" cy="74" r="2" fill="#13241F" />
      <circle cx="70" cy="86" r="2" fill="#13241F" />
    </g>

    {/* Rolled African Lace Fabric Bolt */}
    <g className="transition-transform duration-300 hover:scale-105">
      <ellipse cx="130" cy="60" rx="16" ry="32" fill="#FDE047" stroke="#13241F" strokeWidth="2.5" />
      <path d="M130 28C145 28 175 35 185 45L185 105C175 95 145 92 130 92V28Z" fill="#FED7AA" stroke="#13241F" strokeWidth="2.5" />
      <ellipse cx="185" cy="75" rx="14" ry="30" fill="#FDE047" stroke="#13241F" strokeWidth="2.5" />
      {/* Pattern details on fabric */}
      <path d="M142 45L168 55M142 65L168 75M142 85L168 95" stroke="#13241F" strokeWidth="1.5" strokeLinecap="round" />
    </g>

    {/* Tailor Scissors & Measuring Tape */}
    <g className="transition-transform duration-300 hover:scale-105">
      <circle cx="210" cy="95" r="8" fill="#F472B6" stroke="#13241F" strokeWidth="2" />
      <circle cx="222" cy="105" r="8" fill="#F472B6" stroke="#13241F" strokeWidth="2" />
      <path d="M206 90L190 60L195 55L215 88" fill="#FFFFFF" stroke="#13241F" strokeWidth="2" />
      <path d="M218 100L185 70L190 65L226 98" fill="#FFFFFF" stroke="#13241F" strokeWidth="2" />
      <circle cx="200" cy="78" r="2.5" fill="#13241F" />
    </g>
  </svg>
);

const BeautyIllustration = () => (
  <svg viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-h-32 object-contain">
    {/* Raw Hair Bundle with Silk Ribbon */}
    <g className="transition-transform duration-300 hover:scale-105">
      <path d="M35 30C45 45 30 80 40 115C45 120 65 120 70 115C80 80 65 45 75 30C70 25 40 25 35 30Z" fill="#13241F" stroke="#13241F" strokeWidth="2.5" />
      <rect x="38" y="42" width="34" height="14" rx="4" fill="#F59E0B" stroke="#13241F" strokeWidth="2" />
      <path d="M42 46L68 52M42 52L68 46" stroke="#FFFFFF" strokeWidth="1.5" />
      <path d="M48 65C48 85 45 105 52 112" stroke="#6EE7B7" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M58 65C58 85 62 105 58 112" stroke="#6EE7B7" strokeWidth="1.5" strokeLinecap="round" />
    </g>

    {/* Luxury Perfume Atomizer Bottle */}
    <g className="transition-transform duration-300 hover:scale-105">
      <rect x="105" y="52" width="46" height="60" rx="10" fill="#FBCFE8" stroke="#13241F" strokeWidth="2.5" />
      <rect x="115" y="38" width="26" height="14" rx="3" fill="#FDE047" stroke="#13241F" strokeWidth="2" />
      <rect x="122" y="26" width="12" height="12" rx="2" fill="#13241F" stroke="#13241F" strokeWidth="2" />
      {/* Scent mist lines */}
      <circle cx="140" cy="22" r="2" fill="#F472B6" />
      <circle cx="148" cy="18" r="3" fill="#F472B6" />
      <circle cx="156" cy="22" r="2" fill="#F472B6" />
      {/* Label */}
      <rect x="113" y="66" width="30" height="24" rx="4" fill="#FFFFFF" stroke="#13241F" strokeWidth="1.5" />
      <line x1="118" y1="74" x2="138" y2="74" stroke="#13241F" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="121" y1="80" x2="135" y2="80" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
    </g>

    {/* Organic Skincare Glow Dropper */}
    <g className="transition-transform duration-300 hover:scale-105">
      <rect x="175" y="55" width="34" height="56" rx="8" fill="#6EE7B7" stroke="#13241F" strokeWidth="2.5" />
      <rect x="183" y="42" width="18" height="13" rx="2" fill="#13241F" />
      <path d="M188 42C188 34 196 34 196 42" stroke="#13241F" strokeWidth="3" fill="#FED7AA" />
      {/* Botanical Leaf Accent */}
      <path d="M192 72C198 68 204 74 198 82C192 78 188 74 192 72Z" fill="#FFFFFF" stroke="#13241F" strokeWidth="1.5" />
    </g>
  </svg>
);

const ShoesIllustration = () => (
  <svg viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-h-32 object-contain">
    {/* Ariaria Handmade Penny Loafer */}
    <g className="transition-transform duration-300 hover:scale-105">
      <path d="M20 90C35 90 45 75 75 75C105 75 115 88 135 90L132 105C110 105 95 108 80 108C50 108 30 108 20 105V90Z" fill="#F59E0B" stroke="#13241F" strokeWidth="2.5" />
      <path d="M20 105H132V112H20V105Z" fill="#13241F" stroke="#13241F" strokeWidth="1.5" />
      <rect x="24" y="112" width="22" height="6" rx="1" fill="#13241F" />
      {/* Loafer penny strap */}
      <rect x="68" y="74" width="16" height="20" rx="3" fill="#FDE047" stroke="#13241F" strokeWidth="2" />
      <ellipse cx="76" cy="84" rx="4" ry="2" fill="#13241F" />
    </g>

    {/* Executive Leather Briefcase */}
    <g className="transition-transform duration-300 hover:scale-105">
      <rect x="145" y="45" width="75" height="58" rx="8" fill="#FED7AA" stroke="#13241F" strokeWidth="2.5" />
      <path d="M168 45V34C168 30 197 30 197 34V45" stroke="#13241F" strokeWidth="2.5" fill="none" />
      <path d="M145 68H220" stroke="#13241F" strokeWidth="2" />
      {/* Gold Buckle Clasp */}
      <rect x="176" y="63" width="14" height="12" rx="2" fill="#FDE047" stroke="#13241F" strokeWidth="2" />
      <circle cx="183" cy="69" r="2" fill="#13241F" />
      {/* Corner protectors */}
      <path d="M145 93V103H155" stroke="#13241F" strokeWidth="2" />
      <path d="M220 93V103H210" stroke="#13241F" strokeWidth="2" />
    </g>
  </svg>
);

const FoodstuffIllustration = () => (
  <svg viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-h-32 object-contain">
    {/* Jute Burlap Sack of Grain with Tie */}
    <g className="transition-transform duration-300 hover:scale-105">
      <path d="M30 45C30 38 45 42 60 40C75 42 90 38 90 45C95 65 92 110 85 115C70 120 50 120 35 115C28 110 25 65 30 45Z" fill="#FED7AA" stroke="#13241F" strokeWidth="2.5" />
      <path d="M40 44C50 48 70 48 80 44" stroke="#13241F" strokeWidth="3" />
      {/* Grain Ears Sticking Out */}
      <path d="M60 40V22" stroke="#13241F" strokeWidth="2" />
      <circle cx="56" cy="26" r="2.5" fill="#FDE047" stroke="#13241F" strokeWidth="1.5" />
      <circle cx="64" cy="24" r="2.5" fill="#FDE047" stroke="#13241F" strokeWidth="1.5" />
      <circle cx="60" cy="18" r="2.5" fill="#FDE047" stroke="#13241F" strokeWidth="1.5" />
      {/* Rice Tag on Sack */}
      <rect x="42" y="68" width="36" height="24" rx="4" fill="#FFFFFF" stroke="#13241F" strokeWidth="2" />
      <line x1="48" y1="76" x2="72" y2="76" stroke="#C2410C" strokeWidth="2" strokeLinecap="round" />
      <line x1="52" y1="83" x2="68" y2="83" stroke="#13241F" strokeWidth="1.5" strokeLinecap="round" />
    </g>

    {/* Glass Bottle of Red Palm Oil */}
    <g className="transition-transform duration-300 hover:scale-105">
      <rect x="115" y="45" width="36" height="68" rx="8" fill="#F87171" stroke="#13241F" strokeWidth="2.5" />
      <rect x="126" y="32" width="14" height="14" rx="2" fill="#FFFFFF" stroke="#13241F" strokeWidth="2" />
      <rect x="124" y="24" width="18" height="8" rx="2" fill="#F59E0B" stroke="#13241F" strokeWidth="2" />
      {/* Oil Highlight */}
      <path d="M122 55V98" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </g>

    {/* Calabash Spices / Yam Tuber */}
    <g className="transition-transform duration-300 hover:scale-105">
      <path d="M165 85C165 70 215 70 215 85C215 110 165 110 165 85Z" fill="#FDE047" stroke="#13241F" strokeWidth="2.5" />
      <ellipse cx="190" cy="80" rx="25" ry="8" fill="#FED7AA" stroke="#13241F" strokeWidth="2" />
      {/* Red Peppers */}
      <path d="M180 76C185 68 190 74 195 72" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
      <path d="M188 78C193 70 198 76 203 74" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
    </g>
  </svg>
);

const AutoSparesIllustration = () => (
  <svg viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-h-32 object-contain">
    {/* V6 Engine Block */}
    <g className="transition-transform duration-300 hover:scale-105">
      <rect x="25" y="50" width="75" height="58" rx="8" fill="#67E8F9" stroke="#13241F" strokeWidth="2.5" />
      <rect x="35" y="38" width="55" height="12" rx="3" fill="#13241F" />
      {/* Pistons / Belts */}
      <circle cx="45" cy="74" r="10" fill="#FFFFFF" stroke="#13241F" strokeWidth="2" />
      <circle cx="45" cy="74" r="4" fill="#13241F" />
      <circle cx="80" cy="74" r="10" fill="#FFFFFF" stroke="#13241F" strokeWidth="2" />
      <circle cx="80" cy="74" r="4" fill="#13241F" />
      <path d="M45 64H80M45 84H80" stroke="#13241F" strokeWidth="2" />
    </g>

    {/* Heavy Duty Shock Absorber Spring */}
    <g className="transition-transform duration-300 hover:scale-105">
      <rect x="125" y="24" width="14" height="14" rx="7" fill="#FDE047" stroke="#13241F" strokeWidth="2" />
      <rect x="129" y="38" width="6" height="78" fill="#FFFFFF" stroke="#13241F" strokeWidth="2" />
      {/* Coiled Spring */}
      <path d="M120 48L144 54L120 60L144 66L120 72L144 78L120 84L144 90L120 96L144 102" stroke="#F472B6" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="125" y="112" width="14" height="12" rx="2" fill="#13241F" />
    </g>

    {/* Disc Brake Rotor & Spanner Wrench */}
    <g className="transition-transform duration-300 hover:scale-105">
      <circle cx="185" cy="75" r="28" fill="#E8F5E9" stroke="#13241F" strokeWidth="2.5" />
      <circle cx="185" cy="75" r="12" fill="#FFFFFF" stroke="#13241F" strokeWidth="2" />
      {/* Rotor ventilation holes */}
      <circle cx="172" cy="65" r="2" fill="#13241F" />
      <circle cx="198" cy="65" r="2" fill="#13241F" />
      <circle cx="172" cy="85" r="2" fill="#13241F" />
      <circle cx="198" cy="85" r="2" fill="#13241F" />
      {/* Brake Caliper */}
      <path d="M165 52C165 48 185 48 190 52V68H165V52Z" fill="#DC2626" stroke="#13241F" strokeWidth="2" />
    </g>
  </svg>
);

const VendorStallIllustration = () => (
  <svg viewBox="0 0 320 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-h-36 object-contain">
    {/* Physical Market Stall Kiosk */}
    <g className="transition-transform duration-300 hover:scale-105">
      {/* Awning Stripes (Emerald & Gold) */}
      <path d="M40 50L60 25L80 50L100 25L120 50L140 25L160 50L180 25L200 50V55C200 60 180 60 180 55C180 60 160 60 160 55C160 60 140 60 140 55C140 60 120 60 120 55C120 60 100 60 100 55C100 60 80 60 80 55C80 60 60 60 60 55C60 60 40 60 40 55V50Z" fill="#1B5E20" stroke="#13241F" strokeWidth="2.5" />
      <path d="M60 25L80 50H60V25ZM100 25L120 50H100V25ZM140 25L160 50H140V25ZM180 25L200 50H180V25Z" fill="#FFC107" stroke="#13241F" strokeWidth="1.5" />
      <path d="M40 25L60 50H40V25ZM80 25L100 50H80V25ZM120 25L140 50H120V25ZM160 25L180 50H160V25Z" fill="#1B5E20" stroke="#13241F" strokeWidth="1.5" />
      
      {/* Wooden Stall Frame & Counter */}
      <rect x="48" y="55" width="144" height="60" rx="4" fill="#FED7AA" stroke="#13241F" strokeWidth="2.5" />
      <rect x="42" y="70" width="156" height="12" rx="3" fill="#FFC107" stroke="#13241F" strokeWidth="2" />
      
      {/* Products on Shelves (Goods, Boxes, Bundles) */}
      <rect x="56" y="58" width="18" height="12" rx="2" fill="#E8F5E9" stroke="#13241F" strokeWidth="1.5" />
      <rect x="80" y="56" width="22" height="14" rx="2" fill="#F472B6" stroke="#13241F" strokeWidth="1.5" />
      <rect x="108" y="58" width="16" height="12" rx="2" fill="#E8F5E9" stroke="#13241F" strokeWidth="1.5" />
      <rect x="130" y="55" width="24" height="15" rx="2" fill="#FFC107" stroke="#13241F" strokeWidth="1.5" />
      <rect x="160" y="58" width="18" height="12" rx="2" fill="#E8F5E9" stroke="#13241F" strokeWidth="1.5" />

      {/* Stall Signboard */}
      <rect x="68" y="90" width="104" height="20" rx="4" fill="#FFFFFF" stroke="#13241F" strokeWidth="2" />
      <circle cx="80" cy="100" r="4" fill="#10B981" />
      <line x1="90" y1="97" x2="155" y2="97" stroke="#13241F" strokeWidth="2" strokeLinecap="round" />
      <line x1="90" y1="103" x2="135" y2="103" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Stall legs */}
      <rect x="52" y="115" width="8" height="15" fill="#13241F" rx="2" />
      <rect x="180" y="115" width="8" height="15" fill="#13241F" rx="2" />
    </g>

    {/* Incoming WhatsApp Buyer Lead Bubble */}
    <g className="transition-transform duration-300 hover:scale-105">
      <rect x="208" y="30" width="102" height="52" rx="12" fill="#FFFFFF" stroke="#13241F" strokeWidth="2.5" />
      <path d="M220 82L215 92L230 82H220Z" fill="#FFFFFF" stroke="#13241F" strokeWidth="2" />
      <circle cx="225" cy="48" r="8" fill="#10B981" stroke="#13241F" strokeWidth="1.5" />
      <path d="M222 48L224 50L228 46" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="238" y="42" width="62" height="6" rx="3" fill="#13241F" />
      <rect x="238" y="52" width="45" height="5" rx="2.5" fill="#10B981" />
      <rect x="238" y="61" width="30" height="4" rx="2" fill="#F59E0B" />
      {/* Live ping badge */}
      <rect x="270" y="22" width="38" height="16" rx="8" fill="#F59E0B" stroke="#13241F" strokeWidth="1.5" />
      <text x="276" y="33" fill="#13241F" fontSize="8" fontWeight="900" fontFamily="sans-serif">NEW LEAD</text>
    </g>

    {/* Verified Stall Shield / Floating Seal */}
    <g className="transition-transform duration-300 hover:scale-105">
      <circle cx="255" cy="110" r="16" fill="#FDE047" stroke="#13241F" strokeWidth="2.5" />
      <path d="M248 110L253 115L263 105" stroke="#13241F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

const Step1VoiceIllustration = () => (
  <svg viewBox="0 0 340 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-h-36 object-contain">
    {/* Voice Wave Box */}
    <g className="transition-transform duration-300 hover:scale-105">
      <rect x="20" y="30" width="170" height="88" rx="16" fill="#FFFFFF" stroke="#13241F" strokeWidth="2.5" />
      {/* Microphone Icon Badge */}
      <circle cx="55" cy="74" r="22" fill="#F59E0B" stroke="#13241F" strokeWidth="2" />
      <rect x="51" y="62" width="8" height="16" rx="4" fill="#13241F" />
      <path d="M47 71C47 77 63 77 63 71" stroke="#13241F" strokeWidth="2" strokeLinecap="round" />
      <line x1="55" y1="77" x2="55" y2="83" stroke="#13241F" strokeWidth="2" strokeLinecap="round" />
      
      {/* Sound Waves */}
      <rect x="88" y="66" width="4" height="20" rx="2" fill="#13241F" />
      <rect x="97" y="52" width="4" height="46" rx="2" fill="#0A4D3C" />
      <rect x="106" y="60" width="4" height="30" rx="2" fill="#F59E0B" />
      <rect x="115" y="44" width="4" height="62" rx="2" fill="#10B981" />
      <rect x="124" y="58" width="4" height="34" rx="2" fill="#0A4D3C" />
      <rect x="133" y="68" width="4" height="14" rx="2" fill="#13241F" />
      <rect x="142" y="60" width="4" height="28" rx="2" fill="#F59E0B" />
      <rect x="151" y="70" width="4" height="10" rx="2" fill="#13241F" />
      <rect x="160" y="64" width="4" height="22" rx="2" fill="#10B981" />
      <rect x="169" y="72" width="4" height="8" rx="2" fill="#13241F" />
      
      {/* Recording Pill Tag */}
      <rect x="88" y="94" width="84" height="16" rx="8" fill="#E6F4EA" />
      <circle cx="98" cy="102" r="3" fill="#DC2626" />
      <text x="106" y="105" fill="#13241F" fontSize="8" fontWeight="900" fontFamily="sans-serif">VOICE NOTE AI</text>
    </g>

    {/* Search Query Bubble */}
    <g className="transition-transform duration-300 hover:scale-105">
      <rect x="200" y="24" width="130" height="52" rx="14" fill="#FEF3C7" stroke="#13241F" strokeWidth="2.5" />
      <path d="M215 76L210 86L225 76H215Z" fill="#FEF3C7" stroke="#13241F" strokeWidth="2" />
      <text x="214" y="45" fill="#13241F" fontSize="10" fontWeight="900" fontFamily="sans-serif">"MacBook M2 16GB"</text>
      <text x="214" y="62" fill="#0A4D3C" fontSize="9" fontWeight="800" fontFamily="sans-serif">Primary Stall • ₦750k max</text>
    </g>

    {/* Language Badge */}
    <g className="transition-transform duration-300 hover:scale-105">
      <rect x="205" y="90" width="125" height="34" rx="10" fill="#E8F5E9" stroke="#13241F" strokeWidth="2" />
      <text x="215" y="105" fill="#1B5E20" fontSize="8" fontWeight="900" fontFamily="sans-serif">🇳🇬 PIDGIN / ENGLISH</text>
      <text x="215" y="117" fill="#13241F" fontSize="8" fontWeight="700" fontFamily="sans-serif">Direct Natural Speech</text>
    </g>
  </svg>
);

const Step2MatchIllustration = () => (
  <svg viewBox="0 0 340 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-h-36 object-contain">
    {/* Storefront Verification Match */}
    <g className="transition-transform duration-300 hover:scale-105">
      <rect x="20" y="22" width="165" height="100" rx="16" fill="#FFFFFF" stroke="#13241F" strokeWidth="2.5" />
      {/* Header with store pin */}
      <rect x="30" y="32" width="28" height="28" rx="8" fill="#13241F" />
      <path d="M44 38C40 38 38 41 38 44C38 49 44 55 44 55C44 55 50 49 50 44C50 41 48 38 44 38Z" fill="#6EE7B7" />
      <text x="66" y="44" fill="#13241F" fontSize="10" fontWeight="900" fontFamily="sans-serif">Emeka Mac Plaza</text>
      <text x="66" y="55" fill="#5B6E66" fontSize="8" fontWeight="700" fontFamily="sans-serif">Verified Primary Stall</text>

      {/* Stock Verified Badge */}
      <rect x="30" y="68" width="145" height="42" rx="8" fill="#E6F4EA" stroke="#10B981" strokeWidth="1.5" />
      <circle cx="45" cy="89" r="7" fill="#10B981" />
      <path d="M42 89L44 91L48 87" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      <text x="58" y="85" fill="#0A4D3C" fontSize="9" fontWeight="900" fontFamily="sans-serif">IN STOCK & TESTED</text>
      <text x="58" y="97" fill="#13241F" fontSize="8" fontWeight="800" fontFamily="sans-serif">₦740,000 • 16GB / 512GB</text>
    </g>

    {/* Radar Scan Orb */}
    <g className="transition-transform duration-300 hover:scale-105">
      <circle cx="255" cy="74" r="44" fill="#6EE7B7" stroke="#13241F" strokeWidth="2.5" />
      <circle cx="255" cy="74" r="30" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="4 4" />
      <circle cx="255" cy="74" r="16" fill="#FFFFFF" stroke="#13241F" strokeWidth="2" />
      <circle cx="255" cy="74" r="6" fill="#13241F" />
      {/* Scanning needle */}
      <line x1="255" y1="74" x2="285" y2="44" stroke="#13241F" strokeWidth="3" strokeLinecap="round" />
      <circle cx="285" cy="44" r="4" fill="#FDE047" stroke="#13241F" strokeWidth="1.5" />
      
      {/* Floating Match Pill */}
      <rect x="200" y="112" width="115" height="24" rx="12" fill="#FEF3C7" stroke="#13241F" strokeWidth="2" />
      <text x="210" y="127" fill="#13241F" fontSize="9" fontWeight="900" fontFamily="sans-serif">⚡ 4 Active Stalls Found</text>
    </g>
  </svg>
);

const Step3WhatsAppIllustration = () => (
  <svg viewBox="0 0 340 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-h-36 object-contain">
    {/* WhatsApp Chat Message */}
    <g className="transition-transform duration-300 hover:scale-105">
      <rect x="20" y="22" width="180" height="100" rx="16" fill="#FFFFFF" stroke="#13241F" strokeWidth="2.5" />
      {/* Header bar */}
      <rect x="22" y="24" width="176" height="28" rx="14" fill="#0A4D3C" />
      <circle cx="36" cy="38" r="7" fill="#10B981" />
      <text x="48" y="41" fill="#FFFFFF" fontSize="9" fontWeight="900" fontFamily="sans-serif">Emeka Plaza WhatsApp</text>
      
      {/* Chat bubble 1 */}
      <rect x="30" y="58" width="135" height="26" rx="8" fill="#E6F4EA" />
      <text x="38" y="74" fill="#13241F" fontSize="8" fontWeight="800" fontFamily="sans-serif">"MacBook ready! Video call now?"</text>
      
      {/* Chat bubble 2 */}
      <rect x="50" y="88" width="142" height="26" rx="8" fill="#0A4D3C" />
      <text x="58" y="104" fill="#FFFFFF" fontSize="8" fontWeight="800" fontFamily="sans-serif">"Send waybill to Lekki Phase 1"</text>
    </g>

    {/* Doorstep Delivery & Handshake Badge */}
    <g className="transition-transform duration-300 hover:scale-105">
      {/* Delivery Kiosk / Scooter Box */}
      <rect x="215" y="26" width="110" height="54" rx="14" fill="#FDE047" stroke="#13241F" strokeWidth="2.5" />
      <text x="226" y="47" fill="#13241F" fontSize="10" fontWeight="900" fontFamily="sans-serif">🚀 45-Min</text>
      <text x="226" y="66" fill="#78350F" fontSize="9" fontWeight="800" fontFamily="sans-serif">Doorstep Delivery</text>

      {/* Escrow Shield */}
      <rect x="215" y="88" width="110" height="34" rx="10" fill="#6EE7B7" stroke="#13241F" strokeWidth="2" />
      <circle cx="230" cy="105" r="6" fill="#0A4D3C" />
      <path d="M228 105L229 106L232 103" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      <text x="240" y="108" fill="#064E3B" fontSize="8" fontWeight="900" fontFamily="sans-serif">Verified Escrow</text>
    </g>
  </svg>
);

const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    tag: "VOICE & TEXT INTAKE",
    title: "Search in text or voice",
    desc: "Describe what you want naturally — type Nigerian Pidgin, English, or tap the mic to send a voice note with your budget and preferred market.",
    pills: [
      { name: "Voice Note Mic", bg: "bg-white", dot: "bg-[#DC2626]" },
      { name: "Pidgin & Slang AI", bg: "bg-[#FFC107]", dot: "bg-[#123F16]" },
      { name: "Budget Auto-Filter", bg: "bg-[#E8F5E9]", dot: "bg-[#1B5E20]" },
      { name: "City Market Match", bg: "bg-white", dot: "bg-[#111111]" }
    ],
    bg: "bg-[#E8F5E9]", // Mint-50
    borderColor: "border-[#1B5E20]/20",
    badgeBg: "bg-[#1B5E20]",
    badgeText: "text-white",
    Illustration: Step1VoiceIllustration
  },
  {
    step: "02",
    tag: "INSTANT MARKET SCAN",
    title: "AI matches verified stalls",
    desc: "FLOATE instantly searches active physical stalls across Balogun, Computer Village, Onitsha Main & Ariaria to locate verified stock in real-time.",
    pills: [
      { name: "Physical Stalls", bg: "bg-white", dot: "bg-[#1B5E20]" },
      { name: "Real-time Stock", bg: "bg-[#E8F5E9]", dot: "bg-[#1B5E20]" },
      { name: "Primary Depot Prices", bg: "bg-[#FFC107]", dot: "bg-[#123F16]" },
      { name: "Zero Middlemen", bg: "bg-white", dot: "bg-[#111111]" }
    ],
    bg: "bg-[#FFF8E1]", // Surface Cream (Replaces bright blue card)
    borderColor: "border-[#FFC107]/40",
    badgeBg: "bg-[#1B5E20]",
    badgeText: "text-white",
    Illustration: Step2MatchIllustration
  },
  {
    step: "03",
    tag: "DIRECT WHATSAPP COMMERCE",
    title: "Chat & buy on WhatsApp",
    desc: "Jump straight into direct WhatsApp chat with the merchant to negotiate price, request a live video check, and arrange instant doorstep delivery.",
    pills: [
      { name: "Direct WhatsApp", bg: "bg-white", dot: "bg-[#25D366]" },
      { name: "Live Video Inspection", bg: "bg-[#FFC107]", dot: "bg-[#123F16]" },
      { name: "Verified Escrow", bg: "bg-[#E8F5E9]", dot: "bg-[#1B5E20]" },
      { name: "Doorstep Dispatch", bg: "bg-[#FFF8E1]", dot: "bg-[#111111]" }
    ],
    bg: "bg-[#F7F7F2]", // Surface Paper
    borderColor: "border-[#1B5E20]/20",
    badgeBg: "bg-[#FFC107]",
    badgeText: "text-[#123F16]",
    Illustration: Step3WhatsAppIllustration
  }
];

const SPECIALITY_WORLDS = [
  {
    id: "gadgets",
    title: "Gadgets & Electronics",
    hub: "Verified Primary Stalls",
    desc: "Order direct UK used MacBooks, factory unlocked iPhones, solar inverters, cameras, and repair parts straight from verified stalls.",
    bg: "bg-[#E8F5E9]", // Mint-50
    borderColor: "border-[#1B5E20]/20",
    query: "Laptops & Phones",
    Illustration: GadgetsIllustration,
    pills: [
      { name: "MacBooks", bg: "bg-[#FFC107]", dot: "bg-[#123F16]" },
      { name: "iPhones", bg: "bg-[#FFF8E1]", dot: "bg-[#1B5E20]" },
      { name: "Solar Inverters", bg: "bg-white", dot: "bg-[#1B5E20]" },
      { name: "Tech Repairs", bg: "bg-[#E8F5E9]", dot: "bg-[#1B5E20]" },
      { name: "PS5 & Xbox", bg: "bg-white", dot: "bg-[#111111]" },
      { name: "Grade A Used", bg: "bg-[#FFC107]", dot: "bg-[#123F16]" },
      { name: "Sound Systems", bg: "bg-[#FFF8E1]", dot: "bg-[#1B5E20]" },
      { name: "Cameras", bg: "bg-[#E8F5E9]", dot: "bg-[#1B5E20]" }
    ]
  },
  {
    id: "fashion",
    title: "Fashion & Fabrics",
    hub: "Verified Primary Stalls",
    desc: "Source authentic Swiss voile lace, Aso-oke, bespoke senators, and wholesale Ankara bundles directly from verified primary textile merchants.",
    bg: "bg-[#FFF8E1]", // Surface Cream (replaces electric violet)
    borderColor: "border-[#FFC107]/40",
    query: "Fabrics & Lace",
    Illustration: FashionIllustration,
    pills: [
      { name: "Swiss Lace", bg: "bg-[#FFC107]", dot: "bg-[#123F16]" },
      { name: "Aso-Oke", bg: "bg-white", dot: "bg-[#1B5E20]" },
      { name: "Senator Suits", bg: "bg-[#E8F5E9]", dot: "bg-[#1B5E20]" },
      { name: "Ankara Bundles", bg: "bg-[#FFF8E1]", dot: "bg-[#1B5E20]" },
      { name: "Cashmere Wool", bg: "bg-white", dot: "bg-[#111111]" },
      { name: "Bridal Voile", bg: "bg-[#E8F5E9]", dot: "bg-[#1B5E20]" },
      { name: "Ready-to-Wear", bg: "bg-[#FFC107]", dot: "bg-[#123F16]" },
      { name: "Agbada Sets", bg: "bg-white", dot: "bg-[#1B5E20]" }
    ]
  },
  {
    id: "beauty",
    title: "Beauty & Human Hair",
    hub: "Verified Primary Stalls",
    desc: "Direct factory bundles, raw donor hair, HD lace frontals, salon equipment, and certified organic skincare from verified market distributors.",
    bg: "bg-[#FFF8E1]",
    borderColor: "border-[#FFC107]/40",
    query: "Human Hair & Wigs",
    Illustration: BeautyIllustration,
    pills: [
      { name: "Bone Straight", bg: "bg-[#FFC107]", dot: "bg-[#123F16]" },
      { name: "HD Frontals", bg: "bg-white", dot: "bg-[#1B5E20]" },
      { name: "Raw Vietnamese", bg: "bg-[#E8F5E9]", dot: "bg-[#1B5E20]" },
      { name: "13x4 Wigs", bg: "bg-white", dot: "bg-[#111111]" },
      { name: "Salon Tools", bg: "bg-[#E8F5E9]", dot: "bg-[#1B5E20]" },
      { name: "Organic Oils", bg: "bg-[#FFC107]", dot: "bg-[#123F16]" },
      { name: "Perfume Oils", bg: "bg-[#FFF8E1]", dot: "bg-[#1B5E20]" },
      { name: "Body Creams", bg: "bg-white", dot: "bg-[#111111]" }
    ]
  },
  {
    id: "shoes",
    title: "Shoes & Leathercraft",
    hub: "Verified Primary Stalls",
    desc: "Buy custom handmade Italian-style loafers, corporate oxford shoes, school sandals, and durable travel bags directly from master craftsmen.",
    bg: "bg-[#E8F5E9]",
    borderColor: "border-[#1B5E20]/20",
    query: "Leather Shoes",
    Illustration: ShoesIllustration,
    pills: [
      { name: "Men's Loafers", bg: "bg-[#FFC107]", dot: "bg-[#123F16]" },
      { name: "Italian Oxfords", bg: "bg-[#E8F5E9]", dot: "bg-[#1B5E20]" },
      { name: "Leather Slides", bg: "bg-white", dot: "bg-[#111111]" },
      { name: "Executive Bags", bg: "bg-[#FFF8E1]", dot: "bg-[#1B5E20]" },
      { name: "School Sandals", bg: "bg-white", dot: "bg-[#111111]" },
      { name: "Custom Handmade", bg: "bg-[#E8F5E9]", dot: "bg-[#1B5E20]" },
      { name: "Belt Packs", bg: "bg-[#FFF8E1]", dot: "bg-[#1B5E20]" },
      { name: "Mules & Boots", bg: "bg-white", dot: "bg-[#111111]" }
    ]
  },
  {
    id: "foodstuff",
    title: "Foodstuff & Wholesale Grains",
    hub: "Verified Primary Stalls",
    desc: "Buy full bags of Abakaliki rice, pure unadulterated palm oil, dry crayfish, garri, and spices at real primary depot prices without broker additions.",
    bg: "bg-[#FFF8E1]",
    borderColor: "border-[#FFC107]/40",
    query: "Foodstuff & Grains",
    Illustration: FoodstuffIllustration,
    pills: [
      { name: "Abakaliki Rice", bg: "bg-[#FFC107]", dot: "bg-[#123F16]" },
      { name: "Pure Palm Oil", bg: "bg-white", dot: "bg-[#1B5E20]" },
      { name: "Oron Crayfish", bg: "bg-[#E8F5E9]", dot: "bg-[#1B5E20]" },
      { name: "Egusi Seeds", bg: "bg-white", dot: "bg-[#111111]" },
      { name: "Dry Stockfish", bg: "bg-[#FFF8E1]", dot: "bg-[#1B5E20]" },
      { name: "Honey Beans", bg: "bg-[#FFC107]", dot: "bg-[#123F16]" },
      { name: "Yam Tubers", bg: "bg-[#E8F5E9]", dot: "bg-[#1B5E20]" },
      { name: "Pepper Bags", bg: "bg-white", dot: "bg-[#111111]" }
    ]
  },
  {
    id: "autospares",
    title: "Auto Spares & Industrial",
    hub: "Verified Primary Stalls",
    desc: "Direct OEM German and Japanese engine parts, brake systems, shock absorbers, generator motors, and heavy machinery from verified spare parts merchants.",
    bg: "bg-[#E8F5E9]", // Mint-50 (replaces electric sky cyan)
    borderColor: "border-[#1B5E20]/20",
    query: "Auto Spare Parts",
    Illustration: AutoSparesIllustration,
    pills: [
      { name: "Tokunbo Engines", bg: "bg-[#FDE047]", dot: "bg-[#78350F]" },
      { name: "Brake Pads", bg: "bg-[#6EE7B7]", dot: "bg-[#064E3B]" },
      { name: "Shock Absorbers", bg: "bg-[#FED7AA]", dot: "bg-[#9A3412]" },
      { name: "Generator Parts", bg: "bg-[#F472B6]", dot: "bg-[#831843]" },
      { name: "Gearboxes", bg: "bg-[#FFFFFF]", dot: "bg-[#155E75]" },
      { name: "Headlights", bg: "bg-[#FDE047]", dot: "bg-[#13241F]" },
      { name: "Toyota Spares", bg: "bg-[#E8F5E9]", dot: "bg-[#1B5E20]" },
      { name: "Car Batteries", bg: "bg-[#6EE7B7]", dot: "bg-[#78350F]" }
    ]
  }
];

const SPOTLIGHT_VENDORS = [
  {
    name: "Emeka Mac Plaza",
    slug: "emeka-mac-plaza",
    market: "Primary Electronics Hub, Lagos",
    rating: "4.9",
    category: "Grade A Tech",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80",
    waText: "Hello Emeka Mac Plaza, I saw your stall on FLOATE"
  },
  {
    name: "Madam Nkechi Swiss Lace",
    slug: "madam-nkechi-lace",
    market: "Primary Wholesale Line, Onitsha",
    rating: "5.0",
    category: "Wholesale Textiles",
    image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=600&q=80",
    waText: "Hello Madam Nkechi, I saw your fabrics on FLOATE"
  },
  {
    name: "Aba Master Craftsman",
    slug: "aba-master-craftsman",
    market: "Primary Leathercraft Zone, Aba",
    rating: "4.8",
    category: "Handcrafted Leather",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80",
    waText: "Hello Master Craftsman, I saw your footwear on FLOATE"
  },
  {
    name: "Banex Solar Hub",
    slug: "banex-solar-hub",
    market: "Primary Solar & Tech Hub, Abuja",
    rating: "4.9",
    category: "Solar & Inverters",
    image: "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=600&q=80",
    waText: "Hello Banex Solar, I saw your solar deals on FLOATE"
  }
];

const TESTIMONIALS_ROW1 = [
  {
    author: "Tobi",
    handle: "@tobiloba_a",
    verified: false,
    time: "2h",
    text: "Used FLOATE voice search to find an M2 MacBook in a verified tech stall. Video called the vendor on WhatsApp and got it delivered in Lekki within 1 hour.",
    tag: "Verified Tech Stall",
    replies: "14",
    retweets: "38",
    likes: "210",
    views: "3.2K",
    avatar: "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&w=150&q=80"
  },
  {
    author: "Amaka",
    handle: "@amakaa_e",
    verified: false,
    time: "4h",
    text: "Needed 12 yards of lace for a wedding. FLOATE linked me directly to a primary wholesaler. Paid ₦18k instead of ₦35k retail.",
    tag: "Primary Wholesale Stall",
    replies: "9",
    retweets: "22",
    likes: "180",
    views: "2.4K",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&q=80"
  },
  {
    author: "Chinedu",
    handle: "@chinedu_aba",
    verified: true,
    time: "6h",
    text: "Our primary shoe stall now gets direct WhatsApp orders from Abuja and Lagos through FLOATE. No listing fees at all.",
    tag: "Primary Leathercraft Stall",
    replies: "28",
    retweets: "84",
    likes: "520",
    views: "8.1K",
    avatar: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&w=150&q=80"
  },
  {
    author: "Kemi",
    handle: "@kemi_b",
    verified: false,
    time: "8h",
    text: "Found a raw hair importer in Trade Fair Lagos using voice search. Negotiated price on WhatsApp and received it same day.",
    tag: "Trade Fair Complex, Lagos",
    replies: "7",
    retweets: "19",
    likes: "145",
    views: "1.9K",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80"
  }
];

const TESTIMONIALS_ROW2 = [
  {
    author: "Dayo",
    handle: "@dayo_a",
    verified: false,
    time: "11h",
    text: "Searched Ladipo market for a Camry alternator. Vendor sent a video testing it on bench before dispatching with GIG. Smooth deal.",
    tag: "Ladipo Auto Market",
    replies: "18",
    retweets: "45",
    likes: "310",
    views: "4.5K",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80"
  },
  {
    author: "Fatima",
    handle: "@fatima_bello",
    verified: false,
    time: "14h",
    text: "Bought 10 bags of rice straight from Bodija market depots. Direct pricing on WhatsApp saved us over ₦100k on restock.",
    tag: "Bodija & Dawanau Depots",
    replies: "12",
    retweets: "31",
    likes: "240",
    views: "3.8K",
    avatar: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&w=150&q=80"
  },
  {
    author: "Segun",
    handle: "@segun_v",
    verified: false,
    time: "1d",
    text: "Registered our Computer Village phone shop on FLOATE. Getting genuine buyer leads on WhatsApp every day without paying for ads.",
    tag: "Otigba Street, Ikeja",
    replies: "21",
    retweets: "62",
    likes: "410",
    views: "6.2K",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&q=80"
  },
  {
    author: "Nneka",
    handle: "@nneka_o",
    verified: false,
    time: "2d",
    text: "Saved me from walking under the sun in Balogun. Searched what I wanted, got 3 verified stall contacts instantly.",
    tag: "Balogun Market, Lagos Island",
    replies: "8",
    retweets: "16",
    likes: "125",
    views: "1.6K",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=150&q=80"
  }
];

const HUB_CITIES = [
  { name: "Lagos", slug: "lagos-balogun-computer-village", count: "1,420+ Stalls", tag: "Balogun & Otigba" },
  { name: "Onitsha", slug: "onitsha-main-market", count: "980+ Stalls", tag: "Main Market & Bida" },
  { name: "Aba", slug: "aba-ariaria-leather", count: "740+ Stalls", tag: "Ariaria & Bakassi" },
  { name: "Abuja", slug: "abuja-wuse-banex", count: "610+ Stalls", tag: "Banex & Wuse 2" },
  { name: "Port Harcourt", slug: "port-harcourt-mile-one", count: "480+ Stalls", tag: "Mile 1 & Garrison" },
  { name: "Kano", slug: "kano-kantin-kwari", count: "820+ Stalls", tag: "Kantin Kwari & Kurmi" },
  { name: "Ibadan", slug: "ibadan-dugbe-bodija", count: "390+ Stalls", tag: "Dugbe & Bodija" },
  { name: "Accra", slug: "accra-makola-market", count: "290+ Stalls", tag: "Makola & Kantamanto" }
];

const HERO_LANGUAGES = [
  {
    code: "PIDGIN",
    lang: "Pidgin",
    main: "Wetin you",
    highlight: "dey find?"
  },
  {
    code: "IGBO",
    lang: "Igbo",
    main: "Kedu ihe ị",
    highlight: "na-achọ?"
  },
  {
    code: "YORUBA",
    lang: "Yoruba",
    main: "Kí ni o",
    highlight: "ń wá?"
  },
  {
    code: "HAUSA",
    lang: "Hausa",
    main: "Mene ne kake",
    highlight: "nema?"
  },
  {
    code: "ENGLISH",
    lang: "English",
    main: "What are you",
    highlight: "looking for?"
  }
];

const SPONSORED_BRAND_ADS = [
  {
    id: 'mtn-5g-enterprise',
    badge: '✦ Official Telecom Partner',
    badgeBg: 'bg-[#FFCC00] text-[#000000]',
    title: 'MTN Business 5G Broadband for Traders',
    sponsor: 'MTN Nigeria Enterprise',
    desc: 'Get ultra-fast 5G enterprise routers with 200GB free data for registered FLOATE market stalls across Lagos, Onitsha & Aba.',
    fullDetails: 'Power your physical market stall or online storefront with MTN Enterprise 5G Broadband. Designed specifically for traders and business owners handling high-volume online sales, video inspections, and inventory syncing.',
    highlights: [
      'Plug-and-play 5G Enterprise Router',
      '200GB Welcome Data included free',
      'Dedicated 24/7 Priority Support for FLOATE Vendors',
      'Same-day installation at major market plazas'
    ],
    location: 'Lagos, Onitsha, Aba & Abuja Hubs',
    ctaText: 'Claim 5G Offer',
    ctaUrl: WHATSAPP_BOT_URL + '?text=MTN_5G_DISCOUNT_INQUIRY',
    accentBg: 'bg-[#FEF3C7]',
    borderBg: 'border-[#13241F]',
    category: 'Telecom',
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'otigba-wholesale-laptops',
    badge: '✦ Verified Market Ad',
    badgeBg: 'bg-[#10B981] text-white',
    title: 'Otigba Computer Village Direct Clearout',
    sponsor: 'Otigba Plaza Stall 4B',
    desc: 'Bulk UK-Used HP EliteBook, MacBook Air M1/M2 & Dell XPS laptops with 12-month warranty direct from computer village importers.',
    fullDetails: 'Direct warehouse clearout from certified Otigba Street importers. All laptops undergo 24-point hardware diagnostics before delivery. Perfect for business stock, reseller wholesale, or personal upgrade.',
    highlights: [
      'Grade A UK-Used MacBooks, HP & Dell',
      '12-Month Official Warranty Card Included',
      'Live Video Testing on WhatsApp before dispatch',
      'Escrow payment protection supported'
    ],
    location: 'Otigba Street, Computer Village Ikeja',
    ctaText: 'View Catalog',
    ctaUrl: WHATSAPP_BOT_URL + '?text=OTIGBA_LAPTOP_WHOLESALE',
    accentBg: 'bg-[#D1FAE5]',
    borderBg: 'border-[#13241F]',
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'chowdeck-market-freight',
    badge: '✦ Express Freight Partner',
    badgeBg: 'bg-[#F472B6] text-[#13241F]',
    title: 'Same-Day Market Logistics & Haulage',
    sponsor: 'Market Express Haulage',
    desc: 'Direct stall-to-door cargo pickup from Balogun, Ariaria & Main Market Onitsha to any location in Nigeria within 24 hours.',
    fullDetails: 'Express inter-state and intra-city cargo logistics built for market merchants and buyers. We pick up goods directly from the vendor stall, verify contents, and dispatch to your doorstep anywhere in Nigeria.',
    highlights: [
      'Stall-to-Door cargo pickup from major hubs',
      'Real-time GPS parcel tracking',
      'Transit insurance on high-value goods',
      'Discounts for FLOATE registered merchants'
    ],
    location: 'Nationwide Delivery across 36 States',
    ctaText: 'Get Freight Quote',
    ctaUrl: WHATSAPP_BOT_URL + '?text=MARKET_FREIGHT_QUOTE',
    accentBg: 'bg-[#FCE7F3]',
    borderBg: 'border-[#13241F]',
    category: 'Logistics',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'floate-sponsor-slot',
    badge: '✦ Feature Your Brand',
    badgeBg: 'bg-[#13241F] text-[#FDE047]',
    title: 'Promote Your Company or Stall on FLOATE',
    sponsor: 'FLOATE Business Ads',
    desc: 'Reach over 50,000 active wholesale buyers searching for products on FLOATE, Google & LLM search daily.',
    fullDetails: 'Get your brand, company products, or market stall placed directly in front of thousands of daily active buyers searching for wholesale goods across Nigeria & West Africa.',
    highlights: [
      'Prominent placement on FLOATE home search',
      'Direct WhatsApp lead generation',
      'Verification badge & trust seal on listing',
      'Performance report & buyer intent analytics'
    ],
    location: 'FLOATE Platform & Search Network',
    ctaText: 'Book Ad Slot',
    ctaUrl: REGISTER_BUSINESS_URL,
    accentBg: 'bg-[#F3F4F6]',
    borderBg: 'border-[#13241F]',
    category: 'Advertise',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80'
  }
];

export default function LandingPage({
  onSearch,
  onExploreStalls,
  onOpenVendor,
  onOpenProduct,
  onSelectCategory,
  onSelectHub,
  onOpenMerchantAuth,
  onOpenMerchantDashboard,
  onNavigatePage
}: LandingPageProps) {
  const [query, setQuery] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [isStepPaused, setIsStepPaused] = useState(false);
  const [currentLangIdx, setCurrentLangIndex] = useState(0);
  const [currentAdIdx, setCurrentAdIdx] = useState(0);
  const [isAdPaused, setIsAdPaused] = useState(false);
  const [selectedAdModal, setSelectedAdModal] = useState<typeof SPONSORED_BRAND_ADS[0] | null>(null);

  // Auto-rotate 5 Nigerian languages every 4 seconds (4000ms)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentLangIndex((prev) => (prev + 1) % HERO_LANGUAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Auto-rotate Sponsored Brand Ads every 5 seconds (5000ms) unless hovered or modal open
  useEffect(() => {
    if (isAdPaused || selectedAdModal) return;
    const timer = setInterval(() => {
      setCurrentAdIdx((prev) => (prev + 1) % SPONSORED_BRAND_ADS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isAdPaused, selectedAdModal]);

  useEffect(() => {
    if (isStepPaused) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % HOW_IT_WORKS_STEPS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isStepPaused]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    } else {
      onExploreStalls();
    }
  };

  const handlePillClick = (catQuery: string, pillName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSearch(pillName);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F2] text-[#111111] font-sans antialiased selection:bg-[#FFC107]/20 selection:text-[#123F16]">
      <SEO
        title="FLOATE — Discover Nigerian Market Sellers and Products"
        description="Discover Nigerian market sellers, products, prices, and local businesses. Explore merchant storefronts and contact sellers directly on WhatsApp with FLOATE."
        url="https://www.floate.xyz/"
      />

      {/* ── TOP NAV BAR WITH HAMBURGER MENU ── */}
      <LandingHeader
        onNavigateHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onNavigatePage={(page) => onNavigatePage?.(page)}
        onExploreStalls={onExploreStalls}
        onOpenMerchantAuth={onOpenMerchantAuth}
        onOpenMerchantDashboard={onOpenMerchantDashboard}
      />

      {/* ── SECTION 1: HERO SECTION (OFFICIAL HERO GREEN RADIAL GRADIENT) ── */}
      <section className="hero-green-gradient min-h-[85vh] pt-32 sm:pt-40 pb-16 flex flex-col justify-center items-center relative px-4 sm:px-8 text-center text-white">
        
        {/* Animated 5-Language Rotating Heading (Changes every 4 seconds) */}
        <div className="min-h-[140px] sm:min-h-[180px] flex items-center justify-center max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.h1
              key={HERO_LANGUAGES[currentLangIdx].code}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              style={{ willChange: 'transform, opacity' }}
              className="text-5xl sm:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1.02]"
            >
              <span>{HERO_LANGUAGES[currentLangIdx].main} </span>
              <br className="sm:hidden" />
              <span className="text-[#FFC107]">
                {HERO_LANGUAGES[currentLangIdx].highlight}
              </span>
            </motion.h1>
          </AnimatePresence>
        </div>

        <p className="text-base sm:text-lg text-[#E3F0E3] max-w-2xl mx-auto font-medium leading-relaxed mt-4 mb-4">
          Find verified primary market vendors across major trade hubs. Search in text or voice and chat directly with verified stall owners.
        </p>

        {/* Unified Functioning Live Search Console in Hero Section */}
        <div className="w-full max-w-4xl mx-auto pt-2">
          <WebSearchDemo onOpenVendor={onOpenVendor} onOpenProduct={onOpenProduct} onSearch={onSearch} />
        </div>

        <div className="w-full max-w-4xl mx-auto">
          <BrandAdBannerCarousel />
        </div>
      </section>



      {/* ── SECTION 2: STEP-BY-STEP SECTION ── */}
      <section style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 800px' }} className="py-20 sm:py-28 px-4 sm:px-8 max-w-5xl mx-auto space-y-8 transform-gpu">
        
        {/* Section Header */}
        <FadeInWhenVisible className="text-center space-y-2">
          <span className="px-3.5 py-1 rounded-full bg-[#FEF3C7] text-[#78350F] text-xs font-black uppercase tracking-wider border-2 border-[#13241F] shadow-[2px_2px_0px_#13241F]">
            Fast & Direct
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#13241F] tracking-tight">
            Find it in 3 steps
          </h2>
          <p className="text-xs sm:text-sm text-[#5B6E66] max-w-xl mx-auto font-medium">
            How FLOATE matches you with real physical stalls in seconds.
          </p>
        </FadeInWhenVisible>

        {/* 3 Step Interactive Tab Switchers */}
        <div className="flex justify-center gap-2.5 sm:gap-4 w-full max-w-2xl mx-auto">
          {HOW_IT_WORKS_STEPS.map((stepItem, idx) => {
            const isActive = activeStep === idx;
            return (
              <button
                key={stepItem.step}
                onClick={() => setActiveStep(idx)}
                onMouseEnter={() => setIsStepPaused(true)}
                onMouseLeave={() => setIsStepPaused(false)}
                className={`flex-1 py-2.5 px-3 sm:px-4 rounded-2xl border-2 border-[#13241F] text-xs sm:text-sm font-black transition-all flex flex-col items-center gap-1 relative overflow-hidden ${
                  isActive
                    ? `${stepItem.bg} text-[#13241F] shadow-[3px_3px_0px_#13241F] -translate-y-1`
                    : 'bg-white text-[#5B6E66] hover:text-[#13241F] shadow-[1px_1px_0px_#13241F]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    isActive ? 'bg-[#13241F] text-white' : 'bg-[#FAF8F2] text-[#13241F]'
                  }`}>
                    {stepItem.step}
                  </span>
                  <span className="hidden sm:inline">{stepItem.title.split(' ')[0]} {stepItem.title.split(' ')[1]}</span>
                  <span className="sm:hidden">Step {stepItem.step}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main Vibrant Animated Card */}
        {(() => {
          const currentStep = HOW_IT_WORKS_STEPS[activeStep];
          const CurrentIllustration = currentStep.Illustration;

          return (
            <div
              key={activeStep}
              onMouseEnter={() => setIsStepPaused(true)}
              onMouseLeave={() => setIsStepPaused(false)}
              className={`w-full ${currentStep.bg} border-2 border-[#13241F] rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 min-h-[440px] sm:min-h-[480px] flex flex-col justify-between shadow-[0_20px_50px_rgba(19,36,31,0.12)] transition-all duration-500 relative overflow-hidden group`}
            >
              {/* Top Row: Animated Number Box & Tag Badge */}
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  {/* Large 3D Number Glyph Box */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#13241F] text-white flex items-center justify-center shadow-md border-2 border-white/20">
                    <span className="text-2xl sm:text-3xl font-black text-[#FDE047] tabular-nums tracking-tighter">
                      {currentStep.step}
                    </span>
                  </div>

                  <span className={`text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full ${currentStep.badgeBg} ${currentStep.badgeText} border-2 border-[#13241F] shadow-[2px_2px_0px_#13241F]`}>
                    ✦ STEP {currentStep.step}: {currentStep.tag}
                  </span>
                </div>

                {/* Step Headline & Paragraph */}
                <div>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#13241F] tracking-tight leading-tight">
                    {currentStep.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#13241F] font-semibold leading-relaxed mt-2 max-w-xl">
                    {currentStep.desc}
                  </p>
                </div>
              </div>

              {/* Middle Shelf: Custom 2D Vector SVG Illustration for the Active Step */}
              <div className="my-4 py-3 px-6 bg-white/90 backdrop-blur-xs rounded-2xl border-2 border-[#13241F] shadow-[4px_4px_0px_#13241F] flex items-center justify-center transition-all">
                <CurrentIllustration />
              </div>

              {/* Bottom Feature Pills & Step Dots Navigation */}
              <div className="space-y-4 relative z-10">
                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {currentStep.pills.map((pill, pIdx) => (
                    <div
                      key={pIdx}
                      className={`${pill.bg} border-2 border-[#13241F] px-3.5 py-1.5 rounded-full text-xs font-black text-[#13241F] flex items-center gap-1.5 shadow-[2px_2px_0px_#13241F]`}
                    >
                      <span className={`w-2 h-2 rounded-full ${pill.dot}`}></span>
                      <span>{pill.name}</span>
                    </div>
                  ))}
                </div>

                {/* Bottom Step Indicator Bar */}
                <div className="pt-3 border-t-2 border-[#13241F]/15 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {HOW_IT_WORKS_STEPS.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveStep(i)}
                        className={`h-2.5 rounded-full transition-all ${
                          activeStep === i ? 'w-8 bg-[#13241F]' : 'w-2.5 bg-[#13241F]/30 hover:bg-[#13241F]/60'
                        }`}
                        title={`Go to step ${i + 1}`}
                      />
                    ))}
                  </div>

                  <span className="text-xs font-black text-[#13241F] tracking-wide uppercase">
                    Step {activeStep + 1} of 3
                  </span>
                </div>
              </div>

            </div>
          );
        })()}

      </section>





      {/* ── SECTION 6: "FOR VENDORS" ONBOARDING (VIBRANT CHOWDECK-STYLE SPECIALITY CARD) ── */}
      {/* ── SECTION 6: "FOR VENDORS" ONBOARDING (DEEP GREEN SURFACES + YELLOW PRIMARY ACTION) ── */}
      <section style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 800px' }} className="py-20 sm:py-28 px-4 sm:px-8 max-w-6xl mx-auto transform-gpu">
        <FadeInWhenVisible className="bg-[#123F16] border-2 border-white/15 rounded-[36px] sm:rounded-[44px] p-8 sm:p-12 min-h-[500px] sm:min-h-[540px] flex flex-col justify-between shadow-[0_20px_50px_rgba(18,63,22,0.25)] hover:shadow-2xl transition-all duration-300 relative overflow-hidden group text-white">
          
          {/* Top Row: Storefront Icon Badge & Hub Pill */}
          <div className="space-y-6 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 text-[#FFC107] flex items-center justify-center shadow-md p-3 border border-white/20">
                <Store className="w-7 h-7 sm:w-8 sm:h-8 text-[#FFC107]" />
              </div>

              <span className="text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-[#FFC107]/20 text-[#FFC107] border border-[#FFC107]/40 shadow-xs">
                ✦ 100% Free For Market Stall Owners
              </span>
            </div>

            {/* Big Display Title & Description */}
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight group-hover:text-[#FFC107] transition-colors leading-tight">
                Get discovered. Free.
              </h2>
              <p className="text-sm sm:text-base text-[#E3F0E3] font-semibold leading-relaxed mt-3 max-w-2xl">
                Buyers searching for what you sell across Balogun, Otigba, Onitsha Main & Ariaria find your stall directly on WhatsApp & Telegram — no website building or paid ads required.
              </p>
            </div>
          </div>

          {/* Middle Shelf: Neat 2D Vector SVG Market Stall Illustration */}
          <div className="my-6 py-4 px-6 bg-white/95 rounded-3xl border-2 border-white/20 shadow-md flex items-center justify-center">
            <VendorStallIllustration />
          </div>

          {/* Bottom Section: 4-Step Interactive Pill Tags & Direct WhatsApp Register CTA */}
          <div className="space-y-6 relative z-10">
            {/* 4 Step Onboarding Pills */}
            <div className="flex flex-wrap gap-2.5 sm:gap-3">
              <div className="bg-white border border-white/20 px-4 py-2 rounded-full text-xs sm:text-sm font-black text-[#111111] flex items-center gap-2 shadow-sm">
                <span className="w-5 h-5 rounded-full bg-[#1B5E20] text-white flex items-center justify-center text-[10px] font-black">01</span>
                <span>Open WhatsApp Bot</span>
              </div>
              <div className="bg-[#E8F5E9] border border-[#1B5E20]/20 px-4 py-2 rounded-full text-xs sm:text-sm font-black text-[#1B5E20] flex items-center gap-2 shadow-sm">
                <span className="w-5 h-5 rounded-full bg-[#1B5E20] text-white flex items-center justify-center text-[10px] font-black">02</span>
                <span>Send /register & Stall Details</span>
              </div>
              <div className="bg-[#FFF8E1] border border-[#FFC107]/40 px-4 py-2 rounded-full text-xs sm:text-sm font-black text-[#111111] flex items-center gap-2 shadow-sm">
                <span className="w-5 h-5 rounded-full bg-[#1B5E20] text-white flex items-center justify-center text-[10px] font-black">03</span>
                <span>Upload Photos & Prices</span>
              </div>
              <div className="bg-[#FFC107] border border-[#FFC107] px-4 py-2 rounded-full text-xs sm:text-sm font-black text-[#123F16] flex items-center gap-2 shadow-sm">
                <span className="w-5 h-5 rounded-full bg-[#123F16] text-[#FFC107] flex items-center justify-center text-[10px] font-black">04</span>
                <span>Receive Direct Buyer Leads</span>
              </div>
            </div>

            {/* Bottom Action CTA Bar */}
            <div className="pt-6 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs sm:text-sm font-black text-[#CFE3CF]">
                Takes only 2 minutes • Instant live catalog verification
              </span>

              <a
                href={REGISTER_BUSINESS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#FFC107] hover:bg-[#ffcd38] text-[#123F16] text-sm font-black shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 active:translate-y-[1px]"
              >
                <span>Register stall free on WhatsApp</span>
                <ArrowRight className="w-4 h-4 text-[#123F16]" />
              </a>
            </div>
          </div>

        </FadeInWhenVisible>
      </section>

      {/* ── SECTION 8: FINAL CTA (CREAM SURFACE WITH BRAND ACTIONS) ── */}
      <section style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 500px' }} className="py-20 sm:py-28 px-4 max-w-4xl mx-auto transform-gpu">
        <FadeInWhenVisible className="bg-[#FFF8E1] border border-[#FFC107]/40 rounded-[36px] sm:rounded-[44px] p-8 sm:p-14 text-center space-y-8 shadow-sm">
          <h2 className="text-4xl sm:text-6xl font-black text-[#111111] tracking-tight">
            The market is on your phone now.
          </h2>
          <p className="text-base sm:text-lg text-[#555555] max-w-xl mx-auto font-medium">
            Skip traffic, avoid middleman markups, and discover authentic wholesale prices directly on WhatsApp.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onExploreStalls}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#1B5E20] hover:bg-[#2E7D32] text-white text-sm font-extrabold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Start searching catalog</span>
              <ArrowRight className="w-4 h-4 text-[#FFC107]" />
            </button>

            <a
              href={WHATSAPP_BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-7 py-4 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-[#123F16] text-sm font-extrabold shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-[#123F16] text-[#25D366]" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </FadeInWhenVisible>
      </section>

      {/* ── CENTER-ALIGNED VERTICAL DEEP GREEN FOOTER ── */}
      <footer style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 800px' }} className="footer-green text-[#CFE3CF] pt-28 pb-20 px-6 sm:px-12 text-sm border-t border-white/15 transform-gpu">
        <div className="max-w-2xl mx-auto flex flex-col items-center text-center space-y-16 sm:space-y-20">
          
          {/* Brand Block with Logo */}
          <div className="flex flex-col items-center space-y-5">
            <a 
              href="/" 
              onClick={(e) => { 
                e.preventDefault(); 
                window.scrollTo({ top: 0, behavior: 'smooth' }); 
              }}
              className="hover:opacity-90 transition-opacity cursor-pointer block"
            >
              <img
                src="https://i.postimg.cc/hvHgYf4r/20260929-130945.png"
                alt="FLOATE Footer Logo"
                className="h-28 sm:h-36 w-auto object-contain block mx-auto"
                referrerPolicy="no-referrer"
              />
            </a>
            <p className="text-sm text-[#CFE3CF] max-w-md leading-relaxed font-normal">
              FLOATE AI is the conversational commerce engine connecting African buyers with verified primary market stalls via WhatsApp and natural language search.
            </p>
            <div className="text-xs font-black text-[#FFC107] tracking-wider uppercase">
              FLOATE AFRICA LTD (RC: 9365804)
            </div>
          </div>

          {/* Vertical Section 3: Company */}
          <div className="w-full flex flex-col items-center space-y-6 pt-10 border-t border-white/15">
            <h4 className="font-black text-[#FFC107] uppercase text-xs tracking-widest">
              Company
            </h4>
            <div className="flex flex-col items-center gap-5 text-base text-[#CFE3CF] font-semibold">
              <a href={REGISTER_BUSINESS_URL} target="_blank" rel="noopener noreferrer" className="text-[#FFC107] font-black hover:underline">
                Register Stall Free
              </a>
              {onNavigatePage && (
                <>
                  <button onClick={() => onNavigatePage('ABOUT')} className="hover:text-white transition-colors cursor-pointer">About Us</button>
                  <button onClick={() => onNavigatePage('PRIVACY')} className="hover:text-white transition-colors cursor-pointer">Privacy Policy</button>
                  <button onClick={() => onNavigatePage('TERMS')} className="hover:text-white transition-colors cursor-pointer">Terms of Service</button>
                  <button onClick={() => onNavigatePage('BLOG')} className="hover:text-white transition-colors cursor-pointer">Market Insights</button>
                </>
              )}
              <a href="https://x.com/Floatehq" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Twitter / 𝕏</a>
            </div>
          </div>

          {/* Bottom Copyright Bar */}
          <div className="w-full pt-10 border-t border-white/15 flex flex-col items-center gap-3 text-xs text-[#B9D6B9]">
            <p>© {new Date().getFullYear()} FLOATE AFRICA LTD. All rights reserved.</p>
            <p className="flex items-center justify-center gap-2">
              <span>Made for African commerce</span>
              <span>•</span>
              <span className="text-white font-bold">www.floate.xyz</span>
            </p>
          </div>

        </div>
      </footer>
    </div>
  );
}
