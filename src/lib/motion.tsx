import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'motion/react';

export const MOTION_DURATIONS = {
  fast: 0.2,
  normal: 0.35,
  slow: 0.6,
  relaxed: 0.8
};

export const MOTION_EASINGS = {
  easeOut: [0.16, 1, 0.3, 1] as any,
  easeInOut: [0.65, 0, 0.35, 1] as any,
  spring: { type: 'spring', damping: 25, stiffness: 200 }
};

/**
 * Hook to detect reduced motion user preferences
 */
export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches);
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return prefersReduced;
}

/**
 * Animated number count up with easeOut
 */
export const CountUpNumber: React.FC<{
  value?: number;
  end?: number;
  suffix?: string;
  delay?: number;
  duration?: number;
  formatter?: (val: number) => string;
  className?: string;
}> = ({ value, end, suffix = '', duration = 800, formatter, className = '' }) => {
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
      const current = Math.round(start + (target - start) * ease);
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

  const display = formatter ? formatter(count) : count.toLocaleString('id-ID');

  return (
    <span ref={ref} className={className}>
      {display}{suffix}
    </span>
  );
};

/**
 * Reveal animation wrapper
 */
export const Reveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
}> = ({
  children,
  delay = 0,
  duration = 0.5,
  direction = 'up',
  className = ''
}) => {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  const offset = 24;
  const initialVariants = {
    up: { opacity: 0, y: offset },
    down: { opacity: 0, y: -offset },
    left: { opacity: 0, x: offset },
    right: { opacity: 0, x: -offset },
    none: { opacity: 0 }
  };

  return (
    <motion.div
      initial={initialVariants[direction]}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
