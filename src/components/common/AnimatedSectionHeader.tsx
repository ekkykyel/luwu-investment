import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedSectionHeaderProps {
  badge?: string | React.ReactNode;
  badgeIcon?: React.ReactNode;
  titlePrefix?: string;
  titleGradient: string;
  titleSuffix?: string;
  subtitle?: string | React.ReactNode;
  align?: 'center' | 'left';
  className?: string;
  isDark?: boolean;
}

export const AnimatedSectionHeader: React.FC<AnimatedSectionHeaderProps> = ({
  badge,
  badgeIcon,
  titlePrefix = '',
  titleGradient,
  titleSuffix = '',
  subtitle,
  align = 'center',
  className = '',
  isDark = true,
}) => {
  const isCenter = align === 'center';

  return (
    <div className={`w-full max-w-4xl ${isCenter ? 'mx-auto text-center' : 'text-left'} mb-8 sm:mb-12 ${className}`}>
      {/* Badge with Fade-up */}
      {badge && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
          className={`inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-3.5 border backdrop-blur-md shadow-xs ${
            isDark
              ? 'bg-teal-500/10 text-teal-300 border-teal-500/30'
              : 'bg-teal-50 text-teal-800 border-teal-200'
          }`}
        >
          {badgeIcon && <span className="shrink-0">{badgeIcon}</span>}
          <span>{badge}</span>
        </motion.div>
      )}

      {/* Section Title with Gradient Keyword & Stagger Delay */}
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight font-sans text-balance text-slate-900 dark:text-white"
      >
        {titlePrefix && <span>{titlePrefix} </span>}
        <span className="bg-gradient-to-r from-teal-500 to-blue-600 bg-clip-text text-transparent drop-shadow-xs">
          {titleGradient}
        </span>
        {titleSuffix && <span> {titleSuffix}</span>}
      </motion.h2>

      {/* Accent Line with Stagger Delay */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
        className={`h-1 sm:h-1.5 w-20 sm:w-24 bg-gradient-to-r from-teal-500 to-blue-600 rounded-full my-3.5 ${
          isCenter ? 'mx-auto' : 'mr-auto'
        }`}
      />

      {/* Description with Stagger Delay */}
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.35, ease: 'easeOut' }}
          className={`text-xs sm:text-sm md:text-base leading-relaxed ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          } ${isCenter ? 'max-w-2xl mx-auto' : 'max-w-2xl'} font-normal text-balance`}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
};
