import React, { useState, useEffect } from "react";
import { 
  Store, 
  MapPin, 
  MessageCircle, 
  ShieldCheck, 
  Search, 
  Sparkles,
  Flame,
  CheckCircle2,
  Layers,
  ArrowRight
} from "lucide-react";
import { subscribeDatabaseBusinesses, DatabaseBusiness } from "../../services/businessService";
import { getMonogramGradient } from "../WebSearchDemo";

interface VerifiedBusinessesSectionProps {
  onOpenVendor?: (slug: string) => void;
  className?: string;
}

export const VerifiedBusinessesSection: React.FC<VerifiedBusinessesSectionProps> = ({
  onOpenVendor,
  className = ""
}) => {
  const [businesses, setBusinesses] = useState<DatabaseBusiness[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHub, setSelectedHub] = useState("all");

  useEffect(() => {
    const unsubscribe = subscribeDatabaseBusinesses((liveList) => {
      setBusinesses(liveList);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filter based on search & hub
  const filtered = businesses.filter((b) => {
    const q = searchTerm.toLowerCase();
    const matchesQuery =
      !q ||
      b.businessName.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q) ||
      b.marketLocation.toLowerCase().includes(q) ||
      (b.product && b.product.toLowerCase().includes(q)) ||
      (b.description && b.description.toLowerCase().includes(q));

    const matchesHub =
      selectedHub === "all" ||
      b.marketLocation.toLowerCase().includes(selectedHub.toLowerCase()) ||
      b.city.toLowerCase().includes(selectedHub.toLowerCase());

    return matchesQuery && matchesHub;
  });

  const uniqueHubs = ["all", "Lagos", "Onitsha", "Awka", "Owerri", "Aba", "Abuja", "Kano"];

  return (
    <section className={`w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-8 ${className}`}>
      
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E6F4EA] border border-[#0A4D3C]/20 text-[#0A4D3C] text-xs font-black uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>Direct Database Connection</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#13241F] tracking-tight">
            Verified Market Stalls & Businesses
          </h2>
          <p className="text-sm text-[#5B6E66] max-w-xl font-medium">
            Explore live registered merchants from Alaba, Computer Village, Onitsha Main Market, Awka, and Trade Fair. Connect directly on WhatsApp.
          </p>
        </div>

        {/* Real-time Badge */}
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-xs self-start md:self-end">
          <span className="text-2xl font-black text-[#0A4D3C] font-mono">
            {isLoading ? "..." : businesses.length}
          </span>
          <div className="text-left text-xs leading-tight">
            <span className="font-extrabold text-[#13241F] block">Registered Businesses</span>
            <span className="text-[#5B6E66] text-[11px]">Authoritative Database</span>
          </div>
        </div>
      </div>

      {/* FILTER & IN-SECTION SEARCH BAR */}
      <div className="bg-white p-3 sm:p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter businesses e.g. 'CHIVORA', 'Tech'..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-3 py-2 text-xs text-[#13241F] placeholder-slate-400 focus:outline-none focus:border-[#0A4D3C]"
          />
        </div>

        {/* Hub Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {uniqueHubs.map((hub) => (
            <button
              key={hub}
              type="button"
              onClick={() => setSelectedHub(hub)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                selectedHub === hub
                  ? "bg-[#0A4D3C] text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              {hub === "all" ? "All Commercial Hubs" : hub}
            </button>
          ))}
        </div>
      </div>

      {/* BUSINESSES GRID (DUAL-MODE DYNAMIC CARDS) */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
              <div className="h-10 bg-slate-100 rounded-xl" />
              <div className="h-9 bg-slate-200 rounded-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Store className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-[#13241F]">No Matching Businesses in View</h3>
          <p className="text-xs text-[#5B6E66]">Try resetting your filter or search keyword.</p>
          <button
            onClick={() => { setSearchTerm(""); setSelectedHub("all"); }}
            className="px-4 py-2 bg-[#0A4D3C] text-white rounded-full text-xs font-bold"
          >
            Show All Businesses
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filtered.map((biz) => {
            return (
              <div
                key={biz.id}
                className="bg-white rounded-3xl border border-slate-200 hover:border-[#0A4D3C] p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4 group relative overflow-hidden"
              >
                <div className="space-y-3.5">
                  {/* Top: Avatar & Verified Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {biz.hasImage && biz.avatarUrl ? (
                        /* Mode B: Real Image-enabled Avatar with Zoom Hover */
                        <div className="w-13 h-13 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          <img
                            src={biz.avatarUrl}
                            alt={biz.businessName}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        </div>
                      ) : (
                        /* Mode A: Image-less Typography-led Avatar with Gradient & Store Initials */
                        <div className={`w-13 h-13 rounded-2xl bg-gradient-to-br ${getMonogramGradient(biz.businessName)} font-black text-sm shrink-0 flex items-center justify-center border shadow-xs tracking-wider`}>
                          {biz.initials}
                        </div>
                      )}

                      <div 
                        className="min-w-0 cursor-pointer"
                        onClick={() => onOpenVendor?.(biz.whatsapp || biz.id)}
                        role="button"
                        tabIndex={0}
                      >
                        <h3 className="text-base font-black text-[#13241F] group-hover:text-[#0A4D3C] transition-colors truncate leading-snug">
                          {biz.businessName}
                        </h3>
                        <span className="text-[11px] font-bold text-[#F59E0B] uppercase tracking-wider block truncate">
                          {biz.category}
                        </span>
                      </div>
                    </div>

                    {biz.verified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E6F4EA] text-[#0A4D3C] border border-[#0A4D3C]/10 shrink-0">
                        <ShieldCheck className="w-3 h-3 text-[#10B981]" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span>Not verified yet</span>
                      </span>
                    )}
                  </div>

                  {/* Market Location Hub */}
                  <div className="flex items-center gap-1.5 text-xs text-[#5B6E66] font-medium bg-[#FAF8F2] p-2.5 rounded-2xl border border-slate-100">
                    <MapPin className="w-3.5 h-3.5 text-[#0A4D3C] shrink-0" />
                    <span className="truncate">{biz.marketLocation}</span>
                  </div>

                  {/* Product / Description */}
                  <p className="text-xs text-[#2C2C2C] line-clamp-2 leading-relaxed font-medium">
                    {biz.product || biz.description}
                  </p>

                  {/* Price Tag & Escrow Rating */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="text-[11px] text-[#5B6E66] font-semibold">Price range:</span>
                    <span className="text-xs font-black text-[#0A4D3C] bg-[#E6F4EA] px-2.5 py-0.5 rounded-full">
                      {biz.price}
                    </span>
                  </div>
                </div>

                {/* Direct One-Tap Chat on WhatsApp Action */}
                <div className="pt-2">
                  <a
                    href={biz.whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#1EBE5B] text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl transition flex items-center justify-center gap-2 shadow-xs hover:shadow-md transform active:scale-[0.98]"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Chat on WhatsApp</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </section>
  );
};

export default VerifiedBusinessesSection;
