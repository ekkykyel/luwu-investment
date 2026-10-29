import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface AuroraBackgroundProps {
  className?: string;
  isDark?: boolean;
}

/**
 * AuroraBackground - GPU-accelerated multi-blob Aurora Mesh Gradient with slow drift
 * Smooth translate + scale animation (15-20s loop), mix-blend-mode: screen, prefers-reduced-motion support
 */
export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({ 
  className = "fixed inset-0 z-0 overflow-hidden pointer-events-none",
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={className} aria-hidden="true">
      {/* Aurora Blob 1 - Emerald Glow (Top-Left Drift) */}
      <motion.div 
        animate={
          shouldReduceMotion
            ? { x: 0, y: 0, scale: 1 }
            : {
                x: [0, 40, -30, 0],
                y: [0, -30, 20, 0],
                scale: [1, 1.12, 0.95, 1],
              }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : {
                duration: 18,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "mirror",
              }
        }
        className="absolute -top-20 left-1/4 w-[350px] sm:w-[520px] h-[350px] sm:h-[520px] bg-emerald-500/18 dark:bg-emerald-500/14 rounded-full blur-[100px] sm:blur-[140px] mix-blend-screen pointer-events-none transform-gpu"
      />

      {/* Aurora Blob 2 - Cyan / Teal Shimmer (Top-Right / Center Drift) */}
      <motion.div 
        animate={
          shouldReduceMotion
            ? { x: 0, y: 0, scale: 1 }
            : {
                x: [0, -50, 35, 0],
                y: [0, 40, -25, 0],
                scale: [1, 0.92, 1.15, 1],
              }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : {
                duration: 20,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "mirror",
                delay: 1,
              }
        }
        className="absolute top-1/4 -right-16 w-[320px] sm:w-[500px] h-[320px] sm:h-[500px] bg-teal-400/15 dark:bg-teal-400/12 rounded-full blur-[90px] sm:blur-[130px] mix-blend-screen pointer-events-none transform-gpu"
      />

      {/* Aurora Blob 3 - Deep Jade / Cyan Radiance (Bottom-Left Drift) */}
      <motion.div 
        animate={
          shouldReduceMotion
            ? { x: 0, y: 0, scale: 1 }
            : {
                x: [0, 35, -45, 0],
                y: [0, -20, 30, 0],
                scale: [1, 1.1, 0.9, 1],
              }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : {
                duration: 16,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "mirror",
                delay: 2,
              }
        }
        className="absolute bottom-1/4 left-1/5 w-[380px] sm:w-[580px] h-[380px] sm:h-[580px] bg-emerald-600/14 dark:bg-emerald-600/15 rounded-full blur-[110px] sm:blur-[150px] mix-blend-screen pointer-events-none transform-gpu"
      />

      {/* Aurora Blob 4 - Amber / Emerald Horizon Glow */}
      <motion.div 
        animate={
          shouldReduceMotion
            ? { x: 0, y: 0, scale: 1 }
            : {
                x: [0, -30, 25, 0],
                y: [0, 25, -35, 0],
                scale: [1, 1.05, 0.98, 1],
              }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : {
                duration: 22,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "mirror",
              }
        }
        className="absolute -bottom-16 right-1/4 w-[300px] sm:w-[460px] h-[300px] sm:h-[460px] bg-emerald-400/12 dark:bg-teal-500/10 rounded-full blur-[100px] sm:blur-[140px] mix-blend-screen pointer-events-none transform-gpu"
      />
    </div>
  );
};

export default AuroraBackground;
