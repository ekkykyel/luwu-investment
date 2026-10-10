import React from 'react';
import { 
  CheckCircle2, 
  Activity, 
  Flame, 
  Users, 
  Coffee, 
  Clock 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type CrowdStatusType = 'sepi' | 'sedang' | 'ramai' | 'puncak' | 'istirahat';

export interface CrowdStatusBadgeProps {
  /** Crowd density status identifier */
  status: CrowdStatusType;
  /** Text label to display alongside the icon */
  label?: string;
  /** Optional additional class names */
  className?: string;
  /** Size variant for the icon */
  iconSize?: 'sm' | 'md';
}

/**
 * Reusable CrowdStatusBadge Component
 * Displays semantic SVG icon and color-coded status typography for crowd density.
 */
export const CrowdStatusBadge: React.FC<CrowdStatusBadgeProps> = ({
  status,
  label,
  className = '',
  iconSize = 'sm',
}) => {
  const { t } = useTranslation();
  const iconClass = iconSize === 'md' ? 'w-4.5 h-4.5 shrink-0' : 'w-4 h-4 shrink-0';

  switch (status) {
    case 'sepi':
      return (
        <div className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-500 dark:text-emerald-400 ${className}`}>
          <CheckCircle2 className={iconClass} aria-hidden="true" />
          <span>{label || t('radar.status_smooth', 'Sepi (Lancar)')}</span>
        </div>
      );

    case 'sedang':
      return (
        <div className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-500 dark:text-amber-400 ${className}`}>
          <Activity className={iconClass} aria-hidden="true" />
          <span>{label || t('radar.status_moderate', 'Sedang')}</span>
        </div>
      );

    case 'puncak':
      return (
        <div className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold text-rose-500 dark:text-rose-400 ${className}`}>
          <Flame className={iconClass} aria-hidden="true" />
          <span>{label || t('radar.status_peak', 'Puncak Ramai')}</span>
        </div>
      );

    case 'ramai':
      return (
        <div className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold text-rose-500 dark:text-rose-400 ${className}`}>
          <Users className={iconClass} aria-hidden="true" />
          <span>{label || t('radar.status_busy', 'Ramai')}</span>
        </div>
      );

    case 'istirahat':
      return (
        <div className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-400 dark:text-slate-500 ${className}`}>
          <Coffee className={iconClass} aria-hidden="true" />
          <span>{label || t('radar.status_closed_break', 'Jam Istirahat (Tutup)')}</span>
        </div>
      );

    default:
      return (
        <div className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 ${className}`}>
          <Clock className={iconClass} aria-hidden="true" />
          <span>{label || status}</span>
        </div>
      );
  }
};

export default CrowdStatusBadge;
