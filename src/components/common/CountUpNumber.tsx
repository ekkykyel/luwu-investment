import React, { useEffect, useState, useRef } from 'react';
import { useInView } from 'motion/react';

export interface CountUpNumberProps {
  value?: number;
  end?: number;
  decimals?: number;
  duration?: number;
  formatter?: (val: number) => string;
  className?: string;
}

export const CountUpNumber: React.FC<CountUpNumberProps> = ({
  value,
  end,
  decimals = 0,
  duration = 800,
  formatter,
  className = ''
}) => {
  const target = end !== undefined ? end : (value !== undefined ? value : 0);
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView || target === 0) {
      setCount(target === 0 ? 0 : 0);
      return;
    }

    let start = 0;
    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * ease;
      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        setCount(target);
      }
    };

    const anim = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(anim);
  }, [isInView, target, duration]);

  const display = formatter
    ? formatter(count)
    : decimals > 0
    ? count.toFixed(decimals)
    : Math.round(count).toLocaleString('id-ID');

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
};

export default CountUpNumber;
