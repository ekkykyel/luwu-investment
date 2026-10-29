import React, { useEffect, useState } from 'react';
import { formatRupiahSingkat, formatRupiah } from '../../lib/formatters';

interface HeroStatCounterProps {
  value: number | string;
  isCurrency?: boolean;
  duration?: number;
  className?: string;
  isDark?: boolean;
  allowZero?: boolean;
  zeroLabel?: string;
}

export const HeroStatCounter: React.FC<HeroStatCounterProps> = ({
  value,
  isCurrency = false,
  duration = 650,
  className = '',
  isDark,
  allowZero = true,
  zeroLabel,
}) => {
  const numValue = typeof value === 'number' ? value : parseFloat(String(value || '0').replace(/[^0-9.-]+/g, '')) || 0;
  const [displayValue, setDisplayValue] = useState<number>(0);

  useEffect(() => {
    if (numValue === 0) {
      setDisplayValue(0);
      return;
    }

    const start = 0;
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

  if (numValue === 0 && !allowZero) {
    const zeroColorClass =
      isDark === undefined
        ? 'text-slate-800 dark:text-slate-200'
        : isDark
          ? 'text-slate-200'
          : 'text-slate-800';
    return (
      <span className={`text-xs sm:text-sm font-black ${zeroColorClass} font-sans tracking-tight ${className}`}>
        {zeroLabel || '0'}
      </span>
    );
  }

  if (isCurrency) {
    const currencyColorClass =
      isDark === undefined
        ? 'text-emerald-900 dark:text-emerald-300'
        : isDark
          ? 'text-emerald-300'
          : 'text-emerald-900';
    return (
      <span
        title={formatRupiah(numValue)}
        className={`font-['Plus_Jakarta_Sans',sans-serif] font-black text-sm sm:text-[17px] md:text-lg lg:text-xl tracking-tight ${currencyColorClass} tabular-nums whitespace-nowrap ${className}`}
      >
        {formatRupiahSingkat(displayValue)}
      </span>
    );
  }

  const numberColorClass =
    isDark === undefined
      ? 'text-slate-950 dark:text-white drop-shadow-[0_0.5px_0_rgba(0,0,0,0.12)] dark:drop-shadow-none'
      : isDark
        ? 'text-white'
        : 'text-slate-950 drop-shadow-[0_0.5px_0_rgba(0,0,0,0.12)]';

  return (
    <span className={`font-['Plus_Jakarta_Sans',sans-serif] font-black text-lg sm:text-2xl md:text-3xl tracking-tight ${numberColorClass} tabular-nums whitespace-nowrap ${className}`}>
      {displayValue.toLocaleString('id-ID')}
    </span>
  );
};
