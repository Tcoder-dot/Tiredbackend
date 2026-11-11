import React, { useState } from "react";
import { 
  ShieldCheck, CheckCircle2, Zap, Award, 
  CreditCard, ArrowRight, MessageCircle, AlertCircle, X, Check, Lock, Building2
} from "lucide-react";
import { initiateFlutterwaveCheckout, FlutterwaveCheckoutPayload } from "../services/floateApi";
import FlutterwaveSandboxModal from "./FlutterwaveSandboxModal";

export interface PricingUpgradeMatrixProps {
  merchantPhone?: string;
  merchantName?: string;
  merchantEmail?: string;
  onBack?: () => void;
}

export interface PricingPackage {
  id: string;
  title: string;
  tagline: string;
  launchPriceNaira: number;
  standardPriceNaira: number;
  billingPeriod: string;
  isPopular?: boolean;
  features: string[];
  badgeText?: string;
  colorTheme: "green" | "yellow" | "dark" | "blue" | "purple";
}

const LAUNCH_PACKAGES: PricingPackage[] = [
  {
    id: "VERIFICATION_BASIC",
    title: "Basic Verification",
    tagline: "Free Market Listing",
    launchPriceNaira: 0,
    standardPriceNaira: 0,
    billingPeriod: "Forever Free",
    features: [
      "Visual KYC badge on storefront",
      "Public market directory search indexing",
      "Basic catalog display (up to 10 items)",
      "Direct WhatsApp chat button"
    ],
    colorTheme: "green"
  },
  {
    id: "VERIFIED_PLUS",
    title: "Verified Plus (Founding Merchant)",
    tagline: "Official Trust Seal & Certificate",
    launchPriceNaira: 5000,
    standardPriceNaira: 7500,
    billingPeriod: "per year",
    isPopular: true,
    badgeText: "FOUNDING MERCHANT DISCOUNT",
    features: [
      "Official Printable Certificate of Verification & Trust",
      "1080x1080 Square Badge Card with QR Code for stall display",
      "Public Verify Link (floate.xyz/v/<FID>)",
      "Match Priority (+25 search ranking boost)",
      "3 Free Product Search Pins included annually"
    ],
    colorTheme: "yellow"
  },
  {
    id: "PRODUCT_BOOST_SINGLE",
    title: "Product Boost (Single)",
    tagline: "Pin 1 Item to #1 Search",
    launchPriceNaira: 1000,
    standardPriceNaira: 1500,
    billingPeriod: "per week",
    features: [
      "Pinned to top of category search results",
      "Highlighted '🔥 BOOSTED' badge on item card",
      "Direct buyer inquiry priority on WhatsApp"
    ],
    colorTheme: "green"
  },
  {
    id: "PRODUCT_BOOST_BUNDLE_5",
    title: "5-Boost Bundle Pack",
    tagline: "Save ₦1,000 on Search Pins",
    launchPriceNaira: 4000,
    standardPriceNaira: 6000,
    billingPeriod: "one-time",
    badgeText: "SAVE ₦1,000",
    features: [
      "5 Product Search Pin Passes",
      "Use anytime for any catalog product",
      "Passes never expire"
    ],
    colorTheme: "green"
  },
  {
    id: "SPONSORED_SPOT",
    title: "Category Sponsored Spot",
    tagline: "Exclusive Category Banner",
    launchPriceNaira: 10000,
    standardPriceNaira: 15000,
    billingPeriod: "per week",
    badgeText: "MAX 2 SLOTS PER CITY",
    features: [
      "Exclusive top banner placement in your category",
      "Max 1–2 slots per category/city for zero clutter",
      "Featured across mobile & web search results"
    ],
    colorTheme: "blue"
  },
  {
    id: "BRAND_SPOT",
    title: "Brand Spot",
    tagline: "Homepage Hero Banner",
    launchPriceNaira: 75000,
    standardPriceNaira: 150000,
    billingPeriod: "per week",
    badgeText: "50% OFF LAUNCH SPECIAL",
    features: [
      "Nationwide homepage hero placement",
      "Corporate & FMCG supplier spotlight",
      "Direct buyer traffic routing to WhatsApp"
    ],
    colorTheme: "purple"
  }
];

export const PricingUpgradeMatrix: React.FC<PricingUpgradeMatrixProps> = ({
  merchantPhone = "",
  merchantName = "",
  merchantEmail = "",
  onBack
}) => {
  const [selectedPkg, setSelectedPkg] = useState<PricingPackage | null>(null);
  const [phone, setPhone] = useState(merchantPhone);
  const [name, setName] = useState(merchantName);
  const [email, setEmail] = useState(merchantEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Sandbox fallback modal states
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [sandboxTxRef, setSandboxTxRef] = useState("");
  const [sandboxAmount, setSandboxAmount] = useState(0);

  const handleOpenCheckout = (pkg: PricingPackage) => {
    if (pkg.launchPriceNaira === 0) return;
    setSelectedPkg(pkg);
    setErrorMsg("");
  };

  const handleProcessCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkg || selectedPkg.launchPriceNaira > 0) return;
    if (!phone.trim()) {
      setErrorMsg("Please enter your WhatsApp merchant phone number.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    const payload: FlutterwaveCheckoutPayload = {
      merchantPhone: phone.trim(),
      packageId: selectedPkg.id,
      customerName: name.trim() || "Floate Merchant",
      customerEmail: email.trim() || "billing@floate.xyz",
      amount: selectedPkg.launchPriceNaira,
      redirectUrl: `${window.location.origin}/billing/done`
    };

    try {
      const res = await initiateFlutterwaveCheckout(payload);
      const checkoutLink = res.data?.link || res.link;
      if (res.success && checkoutLink) {
        // Redirect directly to Flutterwave payment page
        window.location.href = checkoutLink;
      } else {
        // Fallback to interactive sandbox payment modal
        const mockRef = res.txRef || `FLW-TX-${Date.now()}`;
        setSandboxTxRef(mockRef);
        setSandboxAmount(selectedPkg.launchPriceNaira);
        setSelectedPkg(null);
        setIsSandboxOpen(true);
      }
    } catch (err: any) {
      console.warn("Checkout initiation error, opening sandbox fallback:", err);
      const mockRef = `FLW-TX-${Date.now()}`;
      setSandboxTxRef(mockRef);
      setSandboxAmount(selectedPkg.launchPriceNaira);
      setSelectedPkg(null);
      setIsSandboxOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F7F7F2] text-[#111111] font-sans pb-24">
      {/* Launch Banner Header */}
      <div className="w-full bg-[#123F16] text-white pt-8 pb-12 px-4 sm:px-8 border-b-4 border-[#FFC107]">
        <div className="max-w-6xl mx-auto space-y-3 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFC107] text-[#123F16] text-xs font-black uppercase tracking-wider shadow-xs">
            <span>🔥 Launch Special Active</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            Get More Customers & Boost Your Market Stall 🚀
          </h1>

          <p className="text-xs sm:text-sm text-[#E8F5E9] max-w-2xl font-medium leading-relaxed">
            Special Founding Merchant launch prices valid until <strong className="text-[#FFC107]">20 November 2026</strong>. Get your official verification seal, pin your items to #1 in search results, and reach thousands of buyers daily!
          </p>
        </div>
      </div>

      {/* Main Packages Grid Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 -mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {LAUNCH_PACKAGES.map((pkg) => {
            const isFree = pkg.launchPriceNaira === 0;
            const savings = pkg.standardPriceNaira - pkg.launchPriceNaira;

            return (
              <div
                key={pkg.id}
                className={`group relative bg-white rounded-3xl p-6 border-2 flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-md ${
                  pkg.isPopular
                    ? "border-[#FFC107] ring-4 ring-[#FFC107]/20 bg-gradient-to-b from-white to-[#FFFDF0]"
                    : "border-[#0A4D3C]/12 hover:border-[#123F16]"
                }`}
              >
                {/* Badge Overlay */}
                {pkg.badgeText && (
                  <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-[#123F16] text-[#FFC107] border border-[#FFC107]/40 text-[10px] font-black uppercase tracking-wider shadow-md">
                    {pkg.badgeText}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Title & Tagline */}
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#123F16] bg-[#E8F5E9] px-2.5 py-1 rounded-full inline-block">
                      {pkg.tagline}
                    </span>
                    <h3 className="text-lg font-black text-[#111111] mt-2 leading-snug">
                      {pkg.title}
                    </h3>
                  </div>

                  {/* Pricing Box */}
                  <div className="py-3 border-y border-slate-100 space-y-0.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-[#123F16] tabular-nums tracking-tight">
                        {isFree ? "Free" : `₦${pkg.launchPriceNaira.toLocaleString()}`}
                      </span>
                      {!isFree && (
                        <span className="text-xs text-slate-400 line-through font-bold">
                          ₦{pkg.standardPriceNaira.toLocaleString()}
                        </span>
                      )}
                      <span className="text-xs font-bold text-slate-500">
                        / {pkg.billingPeriod}
                      </span>
                    </div>

                    {!isFree && savings > 0 && (
                      <span className="text-[11px] font-extrabold text-[#123F16] block">
                        ✦ Launch Savings: ₦{savings.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Features List */}
                  <ul className="space-y-2.5 text-xs text-[#333333] font-medium pt-1">
                    {pkg.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-snug">
                        <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Upgrade Button */}
                <div className="pt-6">
                  {isFree ? (
                    <div className="w-full py-3 px-4 rounded-2xl bg-[#E8F5E9] text-[#123F16] font-black text-xs uppercase tracking-wider text-center border border-[#123F16]/10">
                      Standard Included Free
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-not-allowed opacity-60 ${
                        pkg.isPopular
                          ? "bg-[#FFC107] text-[#123F16]"
                          : "bg-[#123F16] text-white"
                      }`}
                    >
                      <span>Coming soon</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Flutterwave Checkout Details Modal */}
      {selectedPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 relative animate-scale-up">
            <button
              onClick={() => setSelectedPkg(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1 pr-6">
              <div className="flex items-center gap-2 text-xs font-black text-[#123F16]">
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                <span>FLUTTERWAVE CHECKOUT AUTHORIZATION</span>
              </div>
              <h3 className="text-xl font-black text-[#111111]">
                {selectedPkg.title}
              </h3>
            </div>

            {/* Order Summary Box */}
            <div className="bg-[#F7F7F2] border border-[#0A4D3C]/12 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-600 font-bold">Package Price Today</span>
                <span className="text-lg font-black text-[#123F16] tabular-nums">
                  ₦{selectedPkg.launchPriceNaira.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500 font-medium pt-1 border-t border-slate-200">
                <span>Standard Rate</span>
                <span className="line-through">₦{selectedPkg.standardPriceNaira.toLocaleString()}</span>
              </div>
            </div>

            {/* Form Inputs */}
            <form onSubmit={handleProcessCheckout} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Merchant WhatsApp Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="08031234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 focus:border-[#123F16] focus:outline-none text-xs font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Business / Owner Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chidi Fabrics"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 focus:border-[#123F16] focus:outline-none text-xs font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Email for Receipt (Optional)
                </label>
                <input
                  type="email"
                  placeholder="chidi@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 focus:border-[#123F16] focus:outline-none text-xs font-bold text-slate-900"
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled
                className="w-full py-4 rounded-2xl bg-slate-200 text-slate-500 font-black text-sm uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-2"
              >
                Coming soon
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Flutterwave Interactive Sandbox Fallback Modal */}
      <FlutterwaveSandboxModal
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
        amount={sandboxAmount}
        currency="NGN"
        email={email || "merchant@floate.xyz"}
        name={name || "Floate Merchant"}
        txRef={sandboxTxRef}
        description={`Floate Africa Growth Plan ${sandboxTxRef}`}
        onSuccess={(ref) => {
          setIsSandboxOpen(false);
          alert(`Payment Successful! Transaction Reference: ${ref}`);
          window.location.href = `/billing/done?ref=${encodeURIComponent(ref)}`;
        }}
      />
    </div>
  );
};
