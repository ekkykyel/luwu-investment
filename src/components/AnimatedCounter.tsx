import React, { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useInView } from "motion/react";

interface AnimatedCounterProps {
  value: number;
  formatter?: (val: number) => string;
  className?: string;
  duration?: number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ 
  value, 
  formatter = (v) => Math.round(v).toLocaleString("id-ID"),
  className = "",
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });
  
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 35,
    stiffness: 75,
  });
  
  const displayValue = useTransform(springValue, (current) => formatter(current));

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  return <motion.span ref={ref} className={className}>{displayValue}</motion.span>;
};

