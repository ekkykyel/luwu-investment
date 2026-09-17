import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Clock, Activity, Loader2, Calculator, Sparkles } from 'lucide-react';

export interface CommodityItem {
  symbol: string;
  label: string;
  price: number;
  prefix: string;
  suffix: string;
  change: number;
  changePercent: number;
}

interface TickerData {
  symbol: string;
  shortName?: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
}

const getSymbolDisplay = (symbol: string, shortName?: string) => {
  if (symbol === 'CC=F') return { label: 'KAKAO (COCOA)', prefix: '$ ', suffix: '' };
  if (symbol === 'KC=F') return { label: 'KOPI (COFFEE)', prefix: '$ ', suffix: '' };
  if (symbol === 'GC=F') return { label: 'NIKEL (NICKEL/GOLD)', prefix: '$ ', suffix: '' };
  if (symbol === 'LOCAL_CENGKEH') return { label: 'CENGKEH (CLOVES)', prefix: 'Rp ', suffix: '/kg' };
  if (symbol === 'LOCAL_RUMPUT_LAUT') return { label: 'RUMPUT LAUT (SEAWEED)', prefix: 'Rp ', suffix: '/kg' };
  if (symbol === 'LOCAL_SAWIT') return { label: 'SAWIT (PALM OIL)', prefix: 'Rp ', suffix: '/kg' };
  if (symbol === 'LOCAL_PADI') return { label: 'PADI (RICE)', prefix: 'Rp ', suffix: '/kg' };
  if (symbol === 'LOCAL_JAGUNG') return { label: 'JAGUNG (CORN)', prefix: 'Rp ', suffix: '/kg' };
  if (symbol === 'LOCAL_LADA') return { label: 'LADA (PEPPER)', prefix: 'Rp ', suffix: '/kg' };
  if (symbol === 'LOCAL_NILA') return { label: 'NILA (TILAPIA)', prefix: 'Rp ', suffix: '/kg' };
  if (symbol === 'LOCAL_EMAS') return { label: 'EMAS (GOLD)', prefix: 'Rp ', suffix: '/gram' };
  if (symbol === 'IDR=X') return { label: 'USD/IDR', prefix: 'Rp ', suffix: '' };
  if (symbol === '^JKSE') return { label: 'IHSG (IDX)', prefix: '', suffix: '' };
  return { label: shortName || symbol, prefix: '', suffix: '' };
};

export function LiveMarketTicker({
  isDark = false,
  onSelectCommodity,
  onSimulateRoi,
}: {
  isDark?: boolean;
  onSelectCommodity?: (commodity: CommodityItem) => void;
  onSimulateRoi?: () => void;
}) {
  const [data, setData] = useState<TickerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date());

  useEffect(() => {
    const fetchTicker = async () => {
      try {
        const response = await fetch('/api/market-ticker');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const parsed = await response.json();
        if (Array.isArray(parsed) && parsed.length > 0) {
          setData(parsed);
          setLastUpdated(new Date());
        }
      } catch (error) {
        console.error("Failed to fetch ticker from API:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTicker();
    const interval = setInterval(fetchTicker, 15 * 60 * 1000); // 15 min updates
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="inline-flex items-center gap-1.5 text-[10px] py-1 px-3.5 rounded-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-md text-slate-700 dark:text-slate-300">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
        <span className="font-semibold tracking-wide">Memuat Bursa Komoditas Luwu...</span>
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  // Duplicate items to form seamless marquee loop
  const marqueeItems = [...data, ...data, ...data, ...data];

  return (
    <div className="w-full max-w-6xl mx-auto flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 px-2.5 sm:px-4 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/90 dark:border-emerald-500/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] overflow-hidden relative group text-slate-800 dark:text-white transition-all duration-300">
      <style>{`
        @keyframes marquee_infinite {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-infinite {
          animation: marquee_infinite 110s linear infinite;
        }
        .group:hover .animate-marquee-infinite {
          animation-play-state: paused;
        }
      `}</style>
      
      {/* Fixed Left Header / Badge */}
      <div className={`flex items-center gap-1.5 shrink-0 border-r pr-2 sm:pr-3.5 ${isDark ? 'border-slate-800' : 'border-slate-200'} z-10`}>
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 sm:px-2.5 py-0.5 rounded-full border border-emerald-500/30 shadow-xs">
          <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
          <span className="font-extrabold text-[9px] sm:text-[10px] tracking-wider uppercase font-sans">
            <span className="sm:hidden">BURSA</span>
            <span className="hidden sm:inline">BURSA KOMODITAS</span>
          </span>
        </div>
      </div>

      {/* Marquee Running Text Container */}
      <div className="relative overflow-hidden flex-1 mask-fade-edges py-0.5">
        <div className="animate-marquee-infinite w-max flex items-center gap-4 sm:gap-5 pr-5 whitespace-nowrap">
          {marqueeItems.map((item, idx) => {
            const isPositive = item.regularMarketChange >= 0;
            const display = getSymbolDisplay(item.symbol, item.shortName);
            const formattedPrice = item.regularMarketPrice.toLocaleString('id-ID', {
              minimumFractionDigits: item.regularMarketPrice < 100 ? 2 : 0,
              maximumFractionDigits: 2,
            });

            const commodityObj: CommodityItem = {
              symbol: item.symbol,
              label: display.label,
              price: item.regularMarketPrice,
              prefix: display.prefix,
              suffix: display.suffix,
              change: item.regularMarketChange,
              changePercent: item.regularMarketChangePercent,
            };

            return (
              <button 
                type="button"
                key={`${item.symbol}-${idx}`} 
                onClick={() => onSelectCommodity && onSelectCommodity(commodityObj)}
                title={`Klik untuk Simulasi komoditas ${display.label}`}
                className={`flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer active:scale-95 ${
                  isDark 
                    ? 'hover:bg-slate-800 hover:border-emerald-500/40 hover:shadow-sm border border-transparent' 
                    : 'hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-xs border border-transparent'
                }`}
              >
                {/* Symbol Label */}
                <span className="font-semibold text-[10px] sm:text-xs tracking-tight text-slate-700 dark:text-slate-200">
                  {display.label}
                </span>

                {/* Price Number */}
                <span className="font-mono font-bold text-[10px] sm:text-xs tracking-tight text-slate-900 dark:text-white">
                  {display.prefix}{formattedPrice}{display.suffix}
                </span>

                {/* Percentage Change Badge */}
                <span className={`inline-flex items-center font-mono font-bold text-[8.5px] sm:text-[10px] px-1.5 py-0.5 rounded border ${
                  isPositive 
                     ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                     : 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/25'
                }`}>
                  {isPositive ? (
                    <TrendingUp className="w-2.5 h-2.5 mr-0.5 text-emerald-500 stroke-[2.5]" />
                  ) : (
                    <TrendingDown className="w-2.5 h-2.5 mr-0.5 text-rose-500 stroke-[2.5]" />
                  )}
                  {isPositive ? '▲ +' : '▼ '}{item.regularMarketChangePercent.toFixed(2)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Quick Action: Simulasi Investasi */}
      <div className={`flex items-center gap-2 shrink-0 border-l pl-2 sm:pl-3 ${isDark ? 'border-slate-800' : 'border-slate-200'} z-10`}>
        <button
          type="button"
          onClick={() => onSimulateRoi && onSimulateRoi()}
          className="flex items-center justify-center p-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all duration-200 shadow-sm hover:shadow-emerald-500/25 active:scale-95 cursor-pointer"
          title="Buka Kalkulator Simulasi Komoditas"
        >
          <Calculator className="w-4 h-4" />
        </button>

        {/* Right Time Badge */}
        {lastUpdated && (
          <div className={`hidden xl:flex items-center gap-1 text-[10px] font-mono font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <Clock className="w-3 h-3 text-emerald-500" />
            <span>{lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
      </div>
    </div>
  );
}
// ui & logic upgrade: hybrid multi-commodity marquee ticker
// ui polish: apply true glassmorphism to bursa market ticker
