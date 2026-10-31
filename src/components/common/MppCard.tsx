import React from 'react';

export const MPP_TYPOGRAPHY = {
  sectionTitle: 'text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 font-sans text-balance',
  sectionSubtitle: 'text-sm sm:text-base text-slate-600 dark:text-slate-300/90 max-w-2xl leading-relaxed',
  cardTitle: 'text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white',
  cardBody: 'text-xs sm:text-sm text-slate-600 dark:text-slate-300/90 leading-relaxed',
  eyebrow: 'text-[11px] sm:text-xs font-bold font-sans tracking-[0.14em] uppercase text-[#0F6B4F] dark:text-[#6EE7B7]',
  meta: 'text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400',
  formalCharter: 'text-xs sm:text-sm italic font-serif-display leading-relaxed text-slate-700 dark:text-slate-300'
};

export const MPP_CARD_SURFACE = {
  default:
    'bg-[#F4F0E6] dark:bg-[#0C2135] border border-[#E2DACB] dark:border-white/[0.09] rounded-2xl sm:rounded-3xl shadow-[0_6px_22px_-10px_rgba(24,24,27,0.06)] dark:shadow-[0_14px_34px_-14px_rgba(0,0,0,0.45)] transition-all duration-300',
  glass:
    'bg-[#F4F0E6]/95 dark:bg-[#0C2135]/85 backdrop-blur-xl border border-[#E2DACB] dark:border-white/[0.10] rounded-2xl sm:rounded-3xl shadow-[0_8px_26px_-10px_rgba(24,24,27,0.08)] dark:shadow-[0_16px_38px_-14px_rgba(0,0,0,0.5)] transition-all duration-300',
  elevated:
    'bg-[#F4F0E6] dark:bg-[#112A42] border border-[#E2DACB] dark:border-white/[0.12] rounded-2xl sm:rounded-3xl shadow-[0_12px_32px_-12px_rgba(24,24,27,0.09)] dark:shadow-[0_18px_42px_-14px_rgba(0,0,0,0.55)] transition-all duration-300',
  layer1:
    'bg-[#F4F0E6] dark:bg-[#0D2338] border border-[#E2DACB] dark:border-white/[0.08] shadow-[0_6px_20px_-10px_rgba(24,24,27,0.05)] dark:shadow-none',
  layer2:
    'bg-[#FAF7F0] dark:bg-[#132E48] border border-[#E2DACB] dark:border-white/[0.09]',
  radiusMain: 'rounded-2xl sm:rounded-3xl',
  radiusSub: 'rounded-xl sm:rounded-2xl',
  paddingLg: 'p-5 sm:p-6 lg:p-8',
  paddingSm: 'p-3.5 sm:p-4'
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
