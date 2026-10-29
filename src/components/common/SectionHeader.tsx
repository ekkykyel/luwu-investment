import React from 'react';
import { motion } from 'motion/react';

export interface SectionHeaderProps {
  badge?: string;
  badgeTone?: 'emerald' | 'amber' | 'sky' | 'purple' | 'rose';
  kicker?: string;
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  align?: 'left' | 'center' | 'right';
  isDark?: boolean;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  badge,
  badgeTone = 'emerald',
  kicker,
  title,
  subtitle,
  align = 'center',
  isDark = true,
  className = ''
}) => {
  const alignClass = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end'
  }[align];

  return (
    <div className={`flex flex-col ${alignClass} mb-8 sm:mb-12 max-w-3xl mx-auto px-4 ${className}`}>
      {badge && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-2">
          {badge}
        </span>
      )}
      {kicker && (
        <span className="text-[10px] sm:text-xs font-bold font-mono tracking-widest uppercase text-emerald-400 mb-1.5">
          {kicker}
        </span>
      )}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight font-display text-slate-900 dark:text-white leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionHeader;
