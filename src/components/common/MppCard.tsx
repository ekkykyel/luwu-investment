import React from 'react';

export const MPP_TYPOGRAPHY = {
  sectionTitle: 'text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight font-display-sora font-display text-slate-900 dark:text-white',
  sectionSubtitle: 'text-sm sm:text-base text-slate-700 dark:text-slate-300 font-medium max-w-2xl',
  cardTitle: 'text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white',
  cardBody: 'text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed',
  eyebrow: 'text-[11px] sm:text-xs font-bold font-mono tracking-wider uppercase text-emerald-700 dark:text-emerald-400',
  meta: 'text-xs font-mono text-slate-600 dark:text-slate-400',
  formalCharter: 'text-xs sm:text-sm italic font-serif leading-relaxed text-slate-700 dark:text-slate-300'
};

export const MPP_CARD_SURFACE = {
  default:
    'bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-sm ring-1 ring-slate-900/[0.03] dark:ring-0 transition-all duration-300',
  glass:
    'bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-md ring-1 ring-slate-900/[0.03] dark:ring-0 transition-all duration-300',
  elevated:
    'bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-lg dark:shadow-black/40 ring-1 ring-slate-900/[0.04] dark:ring-0 transition-all duration-300',
  layer1:
    'bg-white dark:bg-[#0F2D4A] border border-slate-200/90 dark:border-white/[0.08] shadow-sm dark:shadow-none ring-1 ring-slate-900/[0.03] dark:ring-0',
  layer2:
    'bg-slate-50 dark:bg-[#143755] border border-slate-200/80 dark:border-white/[0.08]',
  radiusMain: 'rounded-2xl sm:rounded-3xl',
  radiusSub: 'rounded-xl sm:rounded-2xl',
  paddingLg: 'p-4 sm:p-6 lg:p-8',
  paddingSm: 'p-3 sm:p-4'
};

export interface MppCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof MPP_CARD_SURFACE;
  children: React.ReactNode;
  className?: string;
}

export const MppCard: React.FC<MppCardProps> = ({
  variant = 'default',
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`${MPP_CARD_SURFACE[variant] || MPP_CARD_SURFACE.default} ${className}`} {...props}>
      {children}
    </div>
  );
};

export default MppCard;
