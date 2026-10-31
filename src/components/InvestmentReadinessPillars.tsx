import React, { useState } from "react";
import {
  Layers,
  Building,
  TrendingUp,
  Coins,
  Leaf,
  Users,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Award,
  Activity,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

export interface InvestmentReadinessPillarsProps {
  isDark?: boolean;
  onOpenRtrwModal?: () => void;
  onOpenIncentiveModal?: () => void;
  onOpenSpatialMap?: () => void;
  onScrollToPotensi?: () => void;
  onScrollToRoadmap?: () => void;
  onScrollToCalculator?: () => void;
  onScrollToUmkm?: () => void;
}

export type PillarId =
  | "spatial"
  | "infrastructure"
  | "industry"
  | "financing"
  | "environment"
  | "local_economy";

interface PillarItem {
  id: PillarId;
  number: string;
  badge: string;
  shortLabel: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  accentColor: string;
  accentBg: string;
  score: string;
  readinessRating: string;
  tagline: string;
  blueprintStandard: string;
  luwuReadinessStatus: string;
  keyMetrics: { label: string; value: string; desc: string }[];
  strategicPoints: { title: string; desc: string; standard: string }[];
  primaryActionLabel: string;
  secondaryActionLabel?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

export default function InvestmentReadinessPillars({
  isDark = true,
  onOpenRtrwModal,
  onOpenIncentiveModal,
  onOpenSpatialMap,
  onScrollToPotensi,
  onScrollToRoadmap,
  onScrollToCalculator,
  onScrollToUmkm,
}: InvestmentReadinessPillarsProps) {
  const { t } = useTranslation();
  const [activePillar, setActivePillar] = useState<string>("spatial");
  const [dbPillars, setDbPillars] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  React.useEffect(() => {
    let isMounted = true;
    const fetchPillars = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/readiness/pillars");
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json && Array.isArray(json.data)) {
            setDbPillars(json.data);
            if (json.data.length > 0 && !json.data.some((p: any) => p.pillar_id === activePillar)) {
              setActivePillar(json.data[0].pillar_id);
            }
          }
        }
      } catch {
        if (isMounted) setDbPillars([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchPillars();
    return () => {
      isMounted = false;
    };
  }, []);

  const PILLAR_ICON_MAP: Record<string, React.ElementType> = {
    spatial: Layers,
    infrastructure: Building,
    industry: TrendingUp,
    financing: Coins,
    environment: Leaf,
    local_economy: Users,
  };

  const getPillarActions = (pillarId: string) => {
    switch (pillarId) {
      case "spatial":
        return { onPrimaryClick: onOpenRtrwModal, onSecondaryClick: onOpenSpatialMap };
      case "infrastructure":
        return { onPrimaryClick: onScrollToRoadmap, onSecondaryClick: onOpenSpatialMap };
      case "industry":
        return { onPrimaryClick: onScrollToPotensi, onSecondaryClick: onOpenSpatialMap };
      case "financing":
        return { onPrimaryClick: onOpenIncentiveModal, onSecondaryClick: onScrollToCalculator };
      case "environment":
        return { onPrimaryClick: onOpenRtrwModal, onSecondaryClick: onOpenSpatialMap };
      case "local_economy":
        return { onPrimaryClick: onScrollToUmkm, onSecondaryClick: onScrollToPotensi };
      default:
        return { onPrimaryClick: onOpenSpatialMap, onSecondaryClick: onScrollToPotensi };
    }
  };

  const pillars: PillarItem[] = dbPillars.map((row: any) => {
    const actions = getPillarActions(row.pillar_id);
    return {
      id: row.pillar_id as PillarId,
      number: row.number,
      badge: row.badge,
      shortLabel: row.short_label,
      title: row.title,
      subtitle: row.subtitle,
      icon: PILLAR_ICON_MAP[row.pillar_id] || Layers,
      accentColor: row.accent_color,
      accentBg: row.accent_bg,
      score: row.score,
      readinessRating: row.readiness_rating,
      tagline: row.tagline,
      blueprintStandard: row.blueprint_standard,
      luwuReadinessStatus: row.luwu_readiness_status,
      keyMetrics: Array.isArray(row.key_metrics) ? row.key_metrics : [],
      strategicPoints: Array.isArray(row.strategic_points) ? row.strategic_points : [],
      primaryActionLabel: row.primary_action_label,
      secondaryActionLabel: row.secondary_action_label,
      onPrimaryClick: actions.onPrimaryClick,
      onSecondaryClick: actions.onSecondaryClick,
    };
  });

  if (isLoading) {
    return (
      <section
        id="readiness-section"
        className={`py-12 sm:py-16 md:py-20 border-t relative overflow-hidden transition-colors duration-500 ${
          isDark ? "bg-[#061826] border-white/10" : "bg-[#FAF7F0] border-[#E2DACB]"
        }`}
      >
        <div className="container max-w-7xl mx-auto px-4">
          <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800/80 rounded animate-pulse mb-3" />
          <div className="h-8 w-72 bg-slate-200 dark:bg-slate-800/80 rounded animate-pulse mb-8" />
          <div className="h-56 w-full bg-slate-200/50 dark:bg-slate-800/40 rounded-2xl animate-pulse" />
        </div>
      </section>
    );
  }

  if (pillars.length === 0) {
    return (
      <section
        id="readiness-section"
        className={`py-12 sm:py-16 md:py-20 border-t relative overflow-hidden transition-colors duration-500 ${
          isDark ? "bg-[#061826] border-white/10" : "bg-[#FAF7F0] border-[#E2DACB]"
        }`}
      >
        <div className="container max-w-7xl mx-auto px-4 text-center py-12">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            {t("readiness.emptyState", "Data pilar kesiapan investasi belum tersedia di database.")}
          </p>
        </div>
      </section>
    );
  }

  const currentPillar = pillars.find((p) => p.id === activePillar) || pillars[0];
  if (!currentPillar) return null;
  const CurrentIcon = currentPillar.icon || Layers;

  return (
    <section
      id="readiness-section"
      className={`py-12 sm:py-16 md:py-20 border-t relative overflow-hidden transition-colors duration-500 ${
        isDark ? "bg-[#061826] border-white/10" : "bg-[#FAF7F0] border-[#E2DACB]"
      }`}
    >
      {/* Decorative ambient radial gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-emerald-500/5 dark:bg-emerald-500/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-10 w-[400px] h-[250px] bg-teal-500/5 dark:bg-teal-500/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="container max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header with Elevated Terverifikasi Resmi Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-[.1em] mb-1">
              {t("readiness.eyebrow", "Blueprint & Pilar Kesiapan • Standar Kementerian Investasi / BKPM RI")}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t("readiness.title", "Investment Readiness")}
            </h2>
          </div>
          {/* Badge pindah ke sini — jauh lebih visible */}
          <div className="sm:ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F4F0E6] dark:bg-emerald-500/10 border border-[#E2DACB] dark:border-emerald-500/25 flex-shrink-0 self-start sm:self-auto">
            <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-500" />
            <div>
              <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-[.06em]">
                {t("readiness.officialVerified", "Terverifikasi Resmi")}
              </div>
              <div className="text-[9px] text-slate-600 dark:text-slate-400">
                {t("readiness.officialDataSource", "Data sumber DPMPTSP Luwu")}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop: horizontal tabs | Mobile: scroll horizontal */}
        <div className="overflow-x-auto pb-1 mb-8 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
          <div className="flex gap-1.5 min-w-max md:min-w-0 md:flex-wrap">
            {pillars.map((pilar) => {
              const Icon = pilar.icon;
              const isActive = activePillar === pilar.id;
              return (
                <button
                  key={pilar.id}
                  type="button"
                  onClick={() => setActivePillar(pilar.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap min-h-[44px] flex-shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-[0_2px_8px_rgba(16,185,129,.3)]"
                      : isDark
                        ? "bg-slate-800/60 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                        : "bg-[#F4F0E6] text-slate-700 border border-[#E2DACB] hover:bg-[#ECE5D6] hover:text-slate-900"
                  }`}
                >
                  <Icon size={15} />
                  {/* Label singkat untuk mobile */}
                  <span className="hidden sm:inline">{pilar.title}</span>
                  <span className="sm:hidden">{pilar.shortLabel}</span>
                  {/* Skor kesiapan sebagai badge kecil */}
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : isDark
                          ? "bg-slate-700 text-slate-300"
                          : "bg-[#FAF7F0] text-slate-800 border border-[#E2DACB]"
                    }`}
                  >
                    {pilar.score}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Showcase Panel for the Active Pillar */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPillar.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className={`p-2.5 sm:p-7 md:p-9 rounded-2xl border relative overflow-hidden backdrop-blur-2xl shadow-xl transition-all duration-300 ${
              isDark
                ? "bg-[#0D253A]/95 border-white/10 shadow-black/60"
                : "bg-[#F4F0E6]/95 border-[#E2DACB] shadow-xl shadow-[#10261E]/5"
            }`}
          >
            {/* Top Volumetric Glow Bar */}
            <div className="absolute top-0 inset-x-0 h-[4px] bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-500" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
              {/* Left Column: Pillar Identity & Strategic Highlights (7 cols) */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-6">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-2 sm:mb-2.5">
                    <span className="text-[11px] sm:text-xs font-mono font-black px-2.5 sm:px-3 py-1 rounded-lg bg-[#FAF7F0] text-emerald-950 dark:bg-emerald-950/80 dark:text-emerald-300 border border-[#E2DACB] dark:border-emerald-500/40">
                      PILAR {currentPillar.number} • {currentPillar.badge}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAF7F0] dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-[#E2DACB] dark:border-slate-700">
                      <Activity size={12} className="text-emerald-600 dark:text-emerald-400" />
                      <span>{currentPillar.readinessRating}</span>
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-950 dark:text-white tracking-tight mb-1 sm:mb-1.5 flex items-center gap-2 sm:gap-3">
                    <span>{currentPillar.title}</span>
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base font-extrabold text-emerald-800 dark:text-emerald-400 mb-2 sm:mb-2.5">
                    {currentPillar.subtitle}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {currentPillar.tagline}
                  </p>
                </div>

                {/* Status Kesiapan Luwu vs Standar Kementerian */}
                <div
                  className={`p-2.5 sm:p-4.5 rounded-xl sm:rounded-2xl border space-y-2.5 sm:space-y-3 ${
                    isDark
                      ? "bg-[#081827]/80 border-slate-800"
                      : "bg-[#FAF7F0] border-[#E2DACB]"
                  }`}
                >
                  <div className="flex items-start gap-2 sm:gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center shrink-0 mt-0.5 text-emerald-700 dark:text-emerald-400">
                      <Check size={13} className="stroke-[3]" />
                    </div>
                    <div className="text-xs leading-relaxed">
                      <span className="font-black text-slate-950 dark:text-white mr-1 sm:mr-1.5">
                        {t("readiness.statusLabel", "Status Kesiapan Luwu:")}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold">
                        {currentPillar.luwuReadinessStatus}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-950/80 flex items-center justify-center shrink-0 mt-0.5 text-sky-700 dark:text-sky-400">
                      <Award size={13} className="stroke-[2.5]" />
                    </div>
                    <div className="text-xs leading-relaxed">
                      <span className="font-black text-slate-950 dark:text-white mr-1 sm:mr-1.5">
                        {t("readiness.standardLabel", "Acuan Blueprint Kementerian:")}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold">
                        {currentPillar.blueprintStandard}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3 Strategic Key Deliverables Grid */}
                <div className="space-y-2.5 sm:space-y-3">
                  <h4 className="text-xs uppercase tracking-wider font-black text-slate-950 dark:text-white flex items-center gap-2">
                    <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>{t("readiness.featuresTitle", "Fitur & Solusi Kesiapan Terintegrasi:")}</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                    {currentPillar.strategicPoints.map((pt, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border flex flex-col justify-between transition-all ${
                          isDark
                            ? "bg-[#091D2E]/90 border-slate-800 hover:border-slate-700"
                            : "bg-[#FAF7F0] border-[#E2DACB] hover:bg-[#ECE5D6]/60 hover:border-[#D5CBB8] hover:shadow-md shadow-xs"
                        }`}
                      >
                        <div>
                          <span className="inline-block text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-[#F4F0E6] dark:bg-slate-800 text-slate-800 dark:text-slate-300 mb-1.5 sm:mb-2 border border-[#E2DACB] dark:border-slate-700">
                            {pt.standard}
                          </span>
                          <h5 className="text-xs font-black text-slate-950 dark:text-white mb-1 sm:mb-1.5 leading-snug">
                            {pt.title}
                          </h5>
                          <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                            {pt.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons for the active pillar */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {currentPillar.primaryActionLabel && (
                    <button
                      type="button"
                      onClick={currentPillar.onPrimaryClick}
                      className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-950/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 group"
                    >
                      <span>{currentPillar.primaryActionLabel}</span>
                      <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                    </button>
                  )}
                  {currentPillar.secondaryActionLabel && (
                    <button
                      type="button"
                      onClick={currentPillar.onSecondaryClick}
                      className={`px-4.5 py-3 rounded-2xl text-xs sm:text-sm font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                        isDark
                          ? "bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700 hover:text-white"
                          : "bg-[#FAF7F0] hover:bg-[#ECE5D6] text-slate-900 border-[#E2DACB] font-bold"
                      }`}
                    >
                      <span>{currentPillar.secondaryActionLabel}</span>
                      <ExternalLink size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Key Quantitative Readiness Indicators (5 cols) */}
              <div className="lg:col-span-5 space-y-2.5 sm:space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-black text-slate-950 dark:text-white flex items-center gap-1.5">
                    <CurrentIcon size={15} className={currentPillar.accentColor} />
                    <span>{t("readiness.quantitativeIndicator", "Indikator Kuantitatif Kesiapan")}</span>
                  </span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#FAF7F0] dark:bg-slate-800 text-slate-800 dark:text-slate-300 font-bold border border-[#E2DACB] dark:border-slate-700">
                    Standar BKPM RI
                  </span>
                </div>

                <div className="space-y-2.5 sm:space-y-3">
                  {currentPillar.keyMetrics.map((met, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${
                        isDark
                          ? "bg-[#091D2E]/80 border-slate-800 hover:border-slate-700"
                          : "bg-[#FAF7F0] border-[#E2DACB] hover:bg-[#ECE5D6]/60 hover:border-[#D5CBB8] hover:shadow-md shadow-xs"
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-300">
                          {met.label}
                        </span>
                        <span className="text-lg sm:text-xl font-mono font-black text-slate-950 dark:text-white">
                          {met.value}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug font-medium">
                        {met.desc}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Regional Integration Card */}
                <div
                  className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${
                    isDark
                      ? "bg-gradient-to-br from-emerald-950/40 to-teal-950/30 border-emerald-500/30 text-slate-200"
                      : "bg-[#FAF7F0] border-[#E2DACB] text-slate-800 shadow-xs"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-xs font-black text-slate-950 dark:text-white">
                      {t("readiness.legalTitle", "Jaminan Kepastian Hukum & Perizinan")}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium mb-2.5">
                    {t("readiness.legalDesc", "Sistem InvestLuwu menghubungkan seluruh perizinan dan tata ruang langsung dengan DPMPTSP Kabupaten Luwu, Dinas PUPR, DLH, dan Kementerian Investasi RI / BKPM melalui Online Single Submission (OSS).")}
                  </p>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap pt-1 border-t border-[#E2DACB] dark:border-emerald-500/20 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                    <span className="px-2.5 py-0.5 rounded bg-[#F4F0E6] dark:bg-emerald-500/10 border border-[#E2DACB] dark:border-emerald-500/20">DPMPTSP Luwu</span>
                    <span className="px-2.5 py-0.5 rounded bg-[#F4F0E6] dark:bg-emerald-500/10 border border-[#E2DACB] dark:border-emerald-500/20">Dinas PUPR</span>
                    <span className="px-2.5 py-0.5 rounded bg-[#F4F0E6] dark:bg-emerald-500/10 border border-[#E2DACB] dark:border-emerald-500/20">DLH Luwu</span>
                    <span className="px-2.5 py-0.5 rounded bg-[#F4F0E6] dark:bg-emerald-500/10 border border-[#E2DACB] dark:border-emerald-500/20">OSS-RBA BKPM</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
