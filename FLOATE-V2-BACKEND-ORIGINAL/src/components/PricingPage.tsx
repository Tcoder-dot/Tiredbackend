import React from "react";
import { ArrowLeft } from "lucide-react";
import { PricingUpgradeMatrix } from "./PricingUpgradeMatrix";

interface PricingPageProps {
  onBack: () => void;
  onSelectPlan?: (plan: string) => void;
  darkMode?: boolean;
  initialCurrency?: string;
}

export default function PricingPage({ onBack }: PricingPageProps) {
  return (
    <div className="min-h-screen bg-[#F7F7F2]">
      {/* Top Header Bar */}
      <div className="bg-[#123F16] border-b border-[#FFC107]/20 py-4 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-black uppercase tracking-wider transition cursor-pointer border border-white/20 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-[#FFC107]" />
            <span>Back to Dashboard</span>
          </button>

          <span className="text-xs font-black text-[#FFC107] uppercase tracking-wider hidden sm:inline">
            Official Floate Billing & Upgrades
          </span>
        </div>
      </div>

      {/* Main Pricing Matrix Component */}
      <PricingUpgradeMatrix onBack={onBack} />
    </div>
  );
}
