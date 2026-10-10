import React from 'react';
import { useCountUp, UseCountUpOptions } from './useCountUp';

export interface CountUpNumberProps extends UseCountUpOptions {
  formatter?: (val: number) => string;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const CountUpNumber: React.FC<CountUpNumberProps> = ({
  end,
  start = 0,
  duration = 900,
  delay = 0,
  decimals = 0,
  enabled = true,
  threshold,
  formatter,
  className = '',
  prefix = '',
  suffix = '',
}) => {
  const { value } = useCountUp({ end, start, duration, delay, decimals, enabled, threshold });

  const formatNumber = (num: number): string => {
    if (formatter) return formatter(num);
    if (decimals > 0) {
      return num.toLocaleString('id-ID', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }
    return num.toLocaleString('id-ID');
  };

  const finalFormatted = `${prefix}${formatNumber(end)}${suffix}`;
  const animatedFormatted = `${prefix}${formatNumber(value)}${suffix}`;

  return (
    <span className={`tabular-nums font-mono ${className}`}>
      {/* Screen reader reads the final, accurate value */}
      <span className="sr-only">{finalFormatted}</span>
      {/* Visual display */}
      <span aria-hidden="true">{animatedFormatted}</span>
    </span>
  );
};

export default CountUpNumber;
