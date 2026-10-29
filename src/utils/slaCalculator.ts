/**
 * SLA Calculation Utility for PKKPR Multi-OPD Processing
 * Target Standard: 5 Days per OPD Stage
 * - ON_TRACK (Hijau): <= 3 Hari
 * - WARNING (Kuning): 4 - 5 Hari
 * - BREACHED (Merah + Pulse): > 5 Hari
 */

export type SlaStatusType = 'ON_TRACK' | 'WARNING' | 'BREACHED';

export interface SlaResult {
  status: SlaStatusType;
  elapsedDays: number;
  elapsedHours: number;
  remainingDays: number;
  targetDays: number;
  label: string;
  badgeClass: string;
  dotColorClass: string;
  isBreached: boolean;
  isWarning: boolean;
  isOnTrack: boolean;
  completionText?: string;
}

export function calculateSlaStatus(
  createdAt: string | Date | null | undefined,
  approvedAt?: string | Date | null,
  targetDays: number = 5
): SlaResult {
  if (!createdAt) {
    return {
      status: 'ON_TRACK',
      elapsedDays: 0,
      elapsedHours: 0,
      remainingDays: targetDays,
      targetDays,
      label: `SLA ${targetDays} Hari`,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      dotColorClass: 'bg-emerald-500',
      isBreached: false,
      isWarning: false,
      isOnTrack: true
    };
  }

  const start = new Date(createdAt).getTime();
  const end = approvedAt ? new Date(approvedAt).getTime() : Date.now();
  const diffMs = Math.max(0, end - start);
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const remainingDays = Math.max(0, targetDays - diffDays);

  if (approvedAt) {
    // Completed stage
    if (diffDays <= targetDays) {
      return {
        status: 'ON_TRACK',
        elapsedDays: diffDays,
        elapsedHours: diffHours,
        remainingDays: 0,
        targetDays,
        label: `Selesai dlm ${diffDays === 0 ? '< 1' : diffDays} Hari (SLA Terpenuhi)`,
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        dotColorClass: 'bg-emerald-500',
        isBreached: false,
        isWarning: false,
        isOnTrack: true,
        completionText: `Diselesaikan dalam ${diffDays} hari.`
      };
    } else {
      return {
        status: 'BREACHED',
        elapsedDays: diffDays,
        elapsedHours: diffHours,
        remainingDays: 0,
        targetDays,
        label: `Selesai ${diffDays} Hari (Over SLA)`,
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
        dotColorClass: 'bg-rose-500',
        isBreached: true,
        isWarning: false,
        isOnTrack: false,
        completionText: `Diselesaikan dalam ${diffDays} hari (melebihi target ${targetDays} hari).`
      };
    }
  }

  // In-progress stage
  if (diffDays <= 3) {
    return {
      status: 'ON_TRACK',
      elapsedDays: diffDays,
      elapsedHours: diffHours,
      remainingDays,
      targetDays,
      label: `SLA: ${diffDays === 0 ? '< 1' : diffDays} Hari (On Track)`,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      dotColorClass: 'bg-emerald-500',
      isBreached: false,
      isWarning: false,
      isOnTrack: true
    };
  } else if (diffDays <= targetDays) {
    return {
      status: 'WARNING',
      elapsedDays: diffDays,
      elapsedHours: diffHours,
      remainingDays,
      targetDays,
      label: `SLA: Hari ke-${diffDays} (Peringatan Batas)`,
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700',
      dotColorClass: 'bg-amber-500',
      isBreached: false,
      isWarning: true,
      isOnTrack: false
    };
  } else {
    return {
      status: 'BREACHED',
      elapsedDays: diffDays,
      elapsedHours: diffHours,
      remainingDays: 0,
      targetDays,
      label: `SLA Lewat: ${diffDays} Hari (Breached)`,
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700 animate-pulse',
      dotColorClass: 'bg-rose-500',
      isBreached: true,
      isWarning: false,
      isOnTrack: false
    };
  }
}
