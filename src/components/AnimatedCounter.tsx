import React, { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

interface AnimatedCounterProps {
  value: number;
  formatter?: (val: number) => string;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ 
  value, 
  formatter = (v) => Math.round(v).toString(),
  className = "" 
}) => {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 50,
    stiffness: 100,
  });
  
  const displayValue = useTransform(springValue, (current) => formatter(current));

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  return <motion.span className={className}>{displayValue}</motion.span>;
};
