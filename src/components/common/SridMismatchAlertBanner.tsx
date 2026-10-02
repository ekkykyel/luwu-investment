import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, Layers, MapPin, ChevronDown, ChevronUp, CheckCircle, Info } from 'lucide-react';
import type { SridMismatchDetectionReport } from '../../utils/geoUtils';

interface SridMismatchAlertBannerProps {
  report?: SridMismatchDetectionReport | null;
  pkkprDocNumber?: string;
  className?: string;
}

export const SridMismatchAlertBanner: React.FC<SridMismatchAlertBannerProps> = ({
  report,
  pkkprDocNumber,
  className = ''
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!report || !report.detected) {
    return null;
  }

  const isCritical = report.severity === 'CRITICAL';
  const isWarning = report.severity === 'WARNING';

  const bgColor = isCritical
    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800';

  const textColor = isCritical
    ? 'text-rose-900 dark:text-rose-100'
    : 'text-amber-900 dark:text-amber-100';

  const iconColor = isCritical ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400';

  return (
    <div className={`rounded-xl border p-3.5 shadow-sm transition-all duration-200 ${bgColor} ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 shadow-xs shrink-0 ${iconColor}`}>
            {isCritical ? <ShieldAlert className="w-5 h-5 animate-pulse" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isCritical ? 'bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200' : 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200'}`}>
                {report.mismatchType === 'METRIC_VS_GEOGRAPHICAL' ? 'SRID Mismatch Warning' : 'Skala Luasan BAP vs Permohonan'}
              </span>
              {pkkprDocNumber && (
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Ref: {pkkprDocNumber}
                </span>
              )}
            </div>
            <p className={`text-xs font-semibold mt-1 leading-relaxed ${textColor}`}>
              {report.message}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 transition-colors shrink-0 ${textColor}`}
        >
          <span>{expanded ? 'Sembunyikan Detail' : 'Detail Spasial'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-xs space-y-2.5 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="p-2 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-slate-200/40 dark:border-slate-800/40">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium block">Delineasi BAP PKKPR (SHM/PUPTR)</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                {report.pkkprAreaHa} Ha
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">{report.sridPkkpr}</span>
            </div>

            <div className="p-2 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-slate-200/40 dark:border-slate-800/40">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium block">Tapak Permohonan Investasi</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                {report.investmentAreaHa} Ha
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">{report.sridInvestment}</span>
            </div>

            <div className="p-2 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-slate-200/40 dark:border-slate-800/40">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium block">Selisih & Rasio Skala</span>
              <span className="font-mono font-bold text-amber-700 dark:text-amber-300 text-sm">
                +{report.areaDeltaHa} Ha ({report.areaRatio}x)
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-0.5">Deviasi +{report.deviationPercent}%</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong className="font-bold">Rekomendasi Tim Teknis Dinas PUPTR:</strong> {report.recommendation}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
