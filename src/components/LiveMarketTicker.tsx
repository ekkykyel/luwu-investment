import React, { useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown, Clock, Activity, Loader2, Calculator, Pause, Play } from 'lucide-react';
import { useReducedMotion } from '../lib/motion';

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

const DEFAULT_TICKER_DATA: TickerData[] = [
  { symbol: 'CC=F', shortName: 'Kakao (Cocoa)', regularMarketPrice: 7850, regularMarketChange: 120, regularMarketChangePercent: 1.55 },
  { symbol: 'KC=F', shortName: 'Kopi (Coffee)', regularMarketPrice: 245, regularMarketChange: 3.2, regularMarketChangePercent: 1.32 },
  { symbol: 'LOCAL_CENGKEH', shortName: 'Cengkeh', regularMarketPrice: 125000, regularMarketChange: 2500, regularMarketChangePercent: 2.04 },
  { symbol: 'LOCAL_RUMPUT_LAUT', shortName: 'Rumput Laut', regularMarketPrice: 32000, regularMarketChange: -500, regularMarketChangePercent: -1.54 },
  { symbol: 'LOCAL_SAWIT', shortName: 'TBS Sawit', regularMarketPrice: 2850, regularMarketChange: 45, regularMarketChangePercent: 1.6 },
  { symbol: 'LOCAL_PADI', shortName: 'Gabah Kering', regularMarketPrice: 6800, regularMarketChange: 100, regularMarketChangePercent: 1.49 },
  { symbol: 'LOCAL_EMAS', shortName: 'Emas Fisik', regularMarketPrice: 1420000, regularMarketChange: 8000, regularMarketChangePercent: 0.57 },
  { symbol: 'IDR=X', shortName: 'USD/IDR', regularMarketPrice: 15850, regularMarketChange: -25, regularMarketChangePercent: -0.16 }
];

export function LiveMarketTicker({
  isDark = true,
  onSelectCommodity,
  onSimulateRoi,
}: {
  isDark?: boolean;
  onSelectCommodity?: (commodity: CommodityItem) => void;
  onSimulateRoi?: () => void;
}) {
  const [data, setData] = useState<TickerData[]>(DEFAULT_TICKER_DATA);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date());
  const [isPaused, setIsPaused] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const fetchTicker = async () => {
      try {
        const response = await fetch('/api/market-ticker');
        if (response.ok) {
          const parsed = await response.json();
          if (Array.isArray(parsed) && parsed.length > 0) {
            setData(parsed);
            setLastUpdated(new Date());
            return;
          }
        }
      } catch (error) {
        // quiet fallback
      }
    };
    fetchTicker();
    const interval = setInterval(fetchTicker, 15 * 60 * 1000); // 15 min updates
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={`inline-flex items-center gap-1.5 text-[10px] py-1 px-3.5 rounded-full border shadow-md ${
        isDark ? 'bg-surface/90 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
        <span className="font-semibold tracking-wide">Memuat Bursa Komoditas Luwu...</span>
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  // Duplicate items to form seamless marquee loop
  const marqueeItems = [...data, ...data, ...data, ...data];

  return (
    <div className={`w-full max-w-6xl mx-auto flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 px-2.5 sm:px-4 rounded-full backdrop-blur-2xl border overflow-hidden relative group transition-all duration-300 ${
      isDark
        ? 'bg-[#0A2238]/95 border-white/10 text-white shadow-[0_8px_30px_rgba(0,0,0,0.5)]'
        : 'bg-white/95 border-slate-300/90 text-slate-900 shadow-xl shadow-slate-200/80'
    }`}>
      <style>{`
        @keyframes marquee_infinite {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-infinite {
          animation: marquee_infinite 110s linear infinite;
        }
        .group:hover .animate-marquee-infinite,
        .group:focus-within .animate-marquee-infinite {
          animation-play-state: paused;
        }
        .marquee-paused {
          animation-play-state: paused !important;
        }
      `}</style>
      
      {/* Fixed Left Header / Badge */}
      <div className={`flex items-center gap-1.5 shrink-0 border-r pr-2 sm:pr-3.5 z-10 ${
        isDark ? 'border-white/10' : 'border-slate-200'
      }`}>
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </div>
        <div className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full border shadow-xs ${
          isDark 
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
            : 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
        }`}>
          <Activity className="w-3 h-3 text-emerald-500" />
          <span className="font-extrabold text-[9px] sm:text-[10px] tracking-wider uppercase font-sans">
            <span className="sm:hidden">BURSA</span>
            <span className="hidden sm:inline">BURSA KOMODITAS</span>
          </span>
        </div>
      </div>

      {/* Marquee Running Text Container with soft fade mask */}
      <div 
        className="relative overflow-hidden flex-1 py-0.5"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 4%, black 96%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 4%, black 96%, transparent)',
        }}
      >
        <div className={`${shouldReduceMotion ? 'flex flex-wrap overflow-x-auto' : `animate-marquee-infinite ${isPaused ? 'marquee-paused' : ''}`} w-max flex items-center gap-4 sm:gap-5 pr-5 whitespace-nowrap`}>
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
                className={`flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer active:scale-95 border border-transparent ${
                  isDark 
                    ? 'hover:bg-slate-800/80 hover:border-emerald-500/40' 
                    : 'hover:bg-slate-100/90 hover:border-emerald-500/50'
                }`}
              >
                {/* Symbol Label */}
                <span className={`font-semibold text-[10px] sm:text-xs tracking-tight ${
                  isDark ? 'text-slate-300' : 'text-slate-700 font-bold'
                }`}>
                  {display.label}
                </span>

                {/* Price Number */}
                <span className={`font-mono font-bold text-[10px] sm:text-xs tracking-tight ${
                  isDark ? 'text-white' : 'text-slate-900 font-extrabold'
                }`}>
                  {display.prefix}{formattedPrice}{display.suffix}
                </span>

                {/* Percentage Change Badge */}
                <span className={`inline-flex items-center font-mono font-bold text-[8.5px] sm:text-[10px] px-1.5 py-0.5 rounded border ${
                  isPositive 
                     ? isDark 
                       ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                       : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                     : isDark 
                       ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
                       : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}>
                  {isPositive ? (
                    <TrendingUp className="w-2.5 h-2.5 mr-0.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                  ) : (
                    <TrendingDown className="w-2.5 h-2.5 mr-0.5 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
                  )}
                  {isPositive ? '▲ +' : '▼ '}{item.regularMarketChangePercent.toFixed(2)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Quick Action: Simulasi Investasi & Play/Pause */}
      <div className={`flex items-center gap-1.5 sm:gap-2 shrink-0 border-l pl-2 sm:pl-3 z-10 ${
        isDark ? 'border-white/10' : 'border-slate-200'
      }`}>
        {!shouldReduceMotion && (
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center justify-center p-1.5 sm:p-2 rounded-full font-bold transition-all duration-200 cursor-pointer ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
            title={isPaused ? "Lanjutkan pergerakan bursa" : "Jeda pergerakan bursa"}
            aria-label={isPaused ? "Lanjutkan pergerakan bursa" : "Jeda pergerakan bursa"}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        )}
        <button
          type="button"
          onClick={() => onSimulateRoi && onSimulateRoi()}
          className="flex items-center justify-center p-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all duration-200 shadow-sm hover:shadow-black/25 active:scale-95 cursor-pointer"
          title="Buka Kalkulator Simulasi Komoditas"
        >
          <Calculator className="w-4 h-4" />
        </button>

        {/* Right Time Badge */}
        {lastUpdated && (
          <div className={`hidden xl:flex items-center gap-1 text-[10px] font-mono font-medium ${
            isDark ? 'text-slate-400' : 'text-slate-600 font-semibold'
          }`}>
            <Clock className="w-3 h-3 text-emerald-500" />
            <span>{lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
      </div>
    </div>
  );
}
