import React from 'react';

export type BadgeTone = 
  | 'emerald' 
  | 'amber' 
  | 'sky' 
  | 'rose' 
  | 'indigo' 
  | 'purple' 
  | 'neutral'
  | 'primary'
  | 'danger'
  | 'success'
  | 'warning'
  | 'info';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'solid' | 'subtle' | 'outline' | 'category' | 'status' | 'overlay';
  dot?: boolean;
  pulse?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  tone = 'emerald',
  size = 'sm',
  variant = 'subtle',
  dot = false,
  pulse = false,
  icon,
  children,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    xs: 'text-[10px] px-2 py-0.5 gap-1',
    sm: 'text-xs px-2.5 py-0.5 gap-1.5',
    md: 'text-sm px-3 py-1 gap-2'
  }[size];

  const toneNormalized: Record<string, string> = {
    primary: 'emerald',
    success: 'emerald',
    danger: 'rose',
    warning: 'amber',
    info: 'sky'
  };

  const activeTone = toneNormalized[tone] || tone;

  const toneClasses: Record<string, string> = {
    emerald:
      variant === 'solid'
        ? 'bg-emerald-600 text-white'
        : variant === 'overlay'
        ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 backdrop-blur-md'
        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
    amber:
      variant === 'solid'
        ? 'bg-amber-600 text-white'
        : variant === 'overlay'
        ? 'bg-amber-950/70 text-amber-300 border border-amber-500/40 backdrop-blur-md'
        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
    sky:
      variant === 'solid'
        ? 'bg-sky-600 text-white'
        : variant === 'overlay'
        ? 'bg-sky-950/70 text-sky-300 border border-sky-500/40 backdrop-blur-md'
        : 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30',
    rose:
      variant === 'solid'
        ? 'bg-rose-600 text-white'
        : variant === 'overlay'
        ? 'bg-rose-950/70 text-rose-300 border border-rose-500/40 backdrop-blur-md'
        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30',
    indigo:
      variant === 'solid'
        ? 'bg-indigo-600 text-white'
        : variant === 'overlay'
        ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-500/40 backdrop-blur-md'
        : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30',
    purple:
      variant === 'solid'
        ? 'bg-purple-600 text-white'
        : variant === 'overlay'
        ? 'bg-purple-950/70 text-purple-300 border border-purple-500/40 backdrop-blur-md'
        : 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30',
    neutral:
      variant === 'solid'
        ? 'bg-slate-700 text-white'
        : variant === 'overlay'
        ? 'bg-slate-950/70 text-slate-300 border border-slate-700/50 backdrop-blur-md'
        : 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30'
  };

  const dotColor: Record<string, string> = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    sky: 'bg-sky-500',
    rose: 'bg-rose-500',
    indigo: 'bg-indigo-500',
    purple: 'bg-purple-500',
    neutral: 'bg-slate-400'
  };

  return (
    <span
      className={`inline-flex items-center font-bold font-sans rounded-full leading-none tracking-wide uppercase transition-colors ${sizeClasses} ${
        toneClasses[activeTone] || toneClasses.emerald
      } ${pulse ? 'animate-pulse' : ''} ${className}`}
      {...props}
    >
      {(dot || pulse) && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            pulse ? 'animate-ping opacity-75' : 'animate-pulse'
          } ${dotColor[activeTone] || 'bg-emerald-500'}`}
        />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;
