import React from 'react';
import { MarketCluster } from '../../types/storefront';

interface MarketClustersProps {
  clusters: MarketCluster[];
  onSelectCluster: (clusterQuery: string) => void;
}

export const MarketClusters: React.FC<MarketClustersProps> = ({
  clusters,
  onSelectCluster
}) => {
  return (
    <section className="w-full bg-[#FFFFFF] text-[#000000] py-14 px-4 sm:px-6 lg:px-8 border-b border-slate-200">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Section Title & Subheading */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-[#1B5E20]">
              Physical Hub Network
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#000000] tracking-tight">
              Browse by Market Cluster
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Over 2,400+ physical stalls wired into WhatsApp catalogs
          </p>
        </div>

        {/* Text-Led Clean Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clusters.map((cluster) => (
            <button
              key={cluster.id}
              type="button"
              onClick={() => onSelectCluster(cluster.queryParam)}
              className="group p-5 rounded-[18px] bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-900 transition-all duration-200 text-left flex flex-col justify-between cursor-pointer min-h-[125px]"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-[#000000] group-hover:text-[#1B5E20] transition leading-snug">
                    {cluster.name}
                  </h3>
                  <span className="text-[11px] font-bold text-slate-400 group-hover:text-[#000000] transition">
                    {cluster.city}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 pt-0.5">
                  {cluster.tagline}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Indexed Vendors</span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                  {cluster.activeVendorsCount}+ online
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
