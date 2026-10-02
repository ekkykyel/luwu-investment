import React from 'react';
import { Clock, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { calculateSlaStatus } from '../utils/slaCalculator';

interface SlaBadgeProps {
  createdAt?: string | Date | null;
  approvedAt?: string | Date | null;
  targetDays?: number;
  className?: string;
  showIcon?: boolean;
}

export const SlaBadge: React.FC<SlaBadgeProps> = ({
  createdAt,
  approvedAt,
  targetDays = 5,
  className = '',
  showIcon = true
}) => {
  const sla = calculateSlaStatus(createdAt, approvedAt, targetDays);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${sla.badgeClass} ${className}`}
      title={`Standar SLA: ${targetDays} hari kerja. Durasi berjalan: ${sla.elapsedDays} hari (${sla.elapsedHours} jam).`}
    >
      {showIcon && (
        sla.isBreached ? (
          <AlertCircle className="w-3 h-3 text-rose-500 shrink-0 animate-bounce" />
        ) : sla.isWarning ? (
          <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
        ) : approvedAt ? (
          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
        ) : (
          <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
        )
      )}
      <span className={`w-1.5 h-1.5 rounded-full ${sla.dotColorClass} ${sla.isBreached ? 'animate-ping' : ''}`} />
      <span className="font-mono tracking-tight">{sla.label}</span>
    </div>
  );
};

export default SlaBadge;
