import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { MOTION_PRESETS } from './tokens';

export interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  preset?: 'calm' | 'precise' | 'dynamic';
  yOffset?: number;
  duration?: number;
  once?: boolean;
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  className = '',
  delay = 0,
  preset = 'calm',
  yOffset,
  duration,
  once = true,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const config = MOTION_PRESETS[preset];
  const offset = yOffset ?? config.yOffset;
  const dur = duration ?? config.duration;

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: offset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.1 }}
      transition={{
        duration: dur,
        delay,
        ease: config.ease,
      }}
      style={{ willChange: 'transform, opacity' }}
      className={`transform-gpu ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default Reveal;
