import React, { useEffect, useState } from 'react';
import { formatRupiahSingkat, formatRupiah } from '../../lib/formatters';

interface HeroStatCounterProps {
  value: number | string;
  isCurrency?: boolean;
  duration?: number;
  className?: string;
}

export const HeroStatCounter: React.FC<HeroStatCounterProps> = ({
  value,
  isCurrency = false,
  duration = 650,
  className = ''
}) => {
  const numValue = typeof value === 'number' ? value : parseFloat(String(value || '0').replace(/[^0-9.-]+/g, '')) || 0;
  const [displayValue, setDisplayValue] = useState<number>(0);

  useEffect(() => {
    if (numValue === 0) {
      setDisplayValue(0);
      return;
    }

    let start = 0;
    const startTime = performance.now();

    const updateCount = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(start + (numValue - start) * easeProgress);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        setDisplayValue(numValue);
      }
    };

    const animFrame = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animFrame);
  }, [numValue, duration]);

  if (numValue === 0) {
    return (
      <span className={`text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 font-sans tracking-tight ${className}`}>
        Segera tersedia
      </span>
    );
  }

  if (isCurrency) {
    return (
      <span
        title={formatRupiah(numValue)}
        className={`font-['Plus_Jakarta_Sans',sans-serif] font-black text-sm sm:text-base md:text-lg lg:text-xl tracking-tight text-slate-950 dark:text-emerald-300 tabular-nums whitespace-nowrap drop-shadow-[0_0.5px_0_rgba(0,0,0,0.15)] dark:drop-shadow-none ${className}`}
      >
        {formatRupiahSingkat(displayValue)}
      </span>
    );
  }

  return (
    <span className={`font-['Plus_Jakarta_Sans',sans-serif] font-black text-lg sm:text-2xl md:text-3xl tracking-tight text-slate-950 dark:text-white tabular-nums whitespace-nowrap drop-shadow-[0_0.5px_0_rgba(0,0,0,0.12)] dark:drop-shadow-none ${className}`}>
      {displayValue.toLocaleString('id-ID')}
    </span>
  );
};
