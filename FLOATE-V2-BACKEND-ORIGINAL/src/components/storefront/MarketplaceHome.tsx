import React, { useState, useEffect } from 'react';
import { LandingHero } from './LandingHero';
import { MarketClusters } from './MarketClusters';
import { MarketCluster } from '../../types/storefront';

interface MarketplaceHomeProps {
  onSearch: (query: string) => void;
  onSelectMerchant: (slug: string) => void;
  onNavigateToPlatformEngine?: () => void;
}

export const MarketplaceHome: React.FC<MarketplaceHomeProps> = ({
  onSearch,
  onSelectMerchant,
  onNavigateToPlatformEngine
}) => {
  const [marketClusters, setMarketClusters] = useState<MarketCluster[]>([]);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchLiveData = async () => {
      try {
        const clustersRes = await fetch('/api/storefront/market-clusters');

        if (clustersRes.ok) {
          const clusterData = await clustersRes.json();
          if (clusterData.success && Array.isArray(clusterData.clusters) && isMounted) {
            setMarketClusters(clusterData.clusters);
            setIsLiveConnected(true);
          }
        }
      } catch (err) {
        console.warn('Error fetching live marketplace data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchLiveData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col justify-between selection:bg-[#FFC107]/20 selection:text-[#123F16]">
      <div>
        {/* 1. The Semantic Hero */}
        <LandingHero
          onSearch={onSearch}
          onNavigateToMerchant={onSelectMerchant}
          onNavigateToPlatformEngine={onNavigateToPlatformEngine}
        />

        {/* 2. Market Clusters Grid (Dynamically grouped by registered locations from live database) */}
        {marketClusters.length > 0 && (
          <MarketClusters
            clusters={marketClusters}
            onSelectCluster={(queryParam) => onSearch(queryParam)}
          />
        )}
      </div>

      {/* High-Fashion Minimalist Footer */}
      <footer className="w-full bg-[#000000] text-slate-400 py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10 text-xs">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-white uppercase text-sm tracking-tight">FLOATE AFRICA LTD</span>
            <span>• RC: 9365804</span>
            {isLiveConnected && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                FLOATE DATABASE LIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Lagos • Onitsha • Kano • Enugu • Owerri • Aba</span>
            <span>• Live Verified Merchant Hubs</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
