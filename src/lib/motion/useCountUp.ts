import { useState, useEffect } from 'react';
import { useReducedMotion } from 'motion/react';
import { COUNT_UP_THRESHOLD } from './tokens';

export interface UseCountUpOptions {
  end: number;
  start?: number;
  duration?: number; // milliseconds
  delay?: number;    // milliseconds
  decimals?: number;
  enabled?: boolean;
  threshold?: number;
}

export function useCountUp({
  end,
  start = 0,
  duration = 900,
  delay = 0,
  decimals = 0,
  enabled = true,
  threshold = COUNT_UP_THRESHOLD,
}: UseCountUpOptions) {
  const shouldReduceMotion = useReducedMotion();
  const isEligible = enabled && !shouldReduceMotion && Math.abs(end) >= threshold;
  
  const [value, setValue] = useState<number>(() => (isEligible ? start : end));

  useEffect(() => {
    // If not eligible (under threshold or reduced motion), immediately output target value
    if (!isEligible) {
      setValue(end);
      return;
    }

    let startTime: number | null = null;
    let animationFrameId: number;
    let delayTimeoutId: NodeJS.Timeout;

    const startAnimation = () => {
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);

        // easeOutExpo for calm, refined settlement
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const current = start + (end - start) * ease;

        setValue(Number(current.toFixed(decimals)));

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else {
          setValue(end); // Guarantee exact terminal value
        }
      };

      animationFrameId = requestAnimationFrame(step);
    };

    if (delay > 0) {
      delayTimeoutId = setTimeout(startAnimation, delay);
    } else {
      startAnimation();
    }

    return () => {
      if (delayTimeoutId) clearTimeout(delayTimeoutId);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [end, start, duration, delay, decimals, isEligible]);

  return { value, isAnimated: isEligible };
}
