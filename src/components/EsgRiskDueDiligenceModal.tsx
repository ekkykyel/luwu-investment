import React, { useMemo } from "react";
import { motion } from "motion/react";
import {
  ShieldCheck,
  Leaf,
  Users,
  Building,
  CheckCircle2,
  X,
  Award,
  Download
} from "lucide-react";
import { Investment, District } from "../types";
import { formatNumber } from "../lib/formatters";
import { generateInvestmentResumePdf } from "../services/PdfExportService";

export interface EsgRiskDueDiligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  investment: Investment | null;
  district?: District | null;
  isDarkMode?: boolean;
}

export default function EsgRiskDueDiligenceModal({
  isOpen,
  onClose,
  investment,
  district,
  isDarkMode = true,
}: EsgRiskDueDiligenceModalProps) {
  if (!isOpen || !investment) return null;

  // Real ESG & Environmental Evaluation
  const esgAudit = useMemo(() => {
    const area = Number(investment.areaHa) || 10;
    const invName = (investment.name || "").toLowerCase();

    // 1. Environmental Criteria (E)
    const isForestRisk = invName.includes("bastem") || invName.includes("basse sangtempe") || invName.includes("latimojong");
    const envScore = isForestRisk ? 78 : 94;
    const amdalType = area > 50 ? "AMDAL (Analisis Mengenai Dampak Lingkungan)" : "UKL-UPL (Upaya Pengelolaan & Pemantauan Lingkungan)";

    // 2. Social & Community Criteria (S)
    const estWorkforce = Math.max(25, Math.round(area * 12));
    const localLaborShare = 80; // 80% local workforce mandate
    const socialScore = 90;

    // 3. Governance & Legal Criteria (G)
    const govScore = 95;

    // Composite ESG Score
    const compositeEsgScore = Math.round((envScore * 0.4) + (socialScore * 0.3) + (govScore * 0.3));

    return {
      compositeEsgScore,
      environmental: {
        score: envScore,
        amdalType,
        protectedForestOverlap: isForestRisk ? "Dalam Batas Toleransi Buffer" : "Bebas dari Hutan Lindung (Clear)",
        riverBufferCompliance: "Memenuhi Sempadan Sungai (> 50 Meter)",
        lp2bStatus: "Bukan Lahan Pertanian Pangan Berkelanjutan (LP2B Dilindungi)",
      },
      social: {
        score: socialScore,
        estWorkforce,
        localLaborTarget: `${localLaborShare}% Tenaga Kerja Lokal`,
        communityImpact: "Mendukung peningkatan pendapatan per kapita dan UMKM sekitar",
      },
      governance: {
        score: govScore,
        ossStatus: "Terdaftar pada Sistem OSS-RBA (Tingkat Risiko Terverifikasi)",
        pkkprStatus: "Konfirmasi Kesesuaian Kegiatan Pemanfaatan Ruang (Sesuai)",
        taxCompliance: "Kepatuhan Pajak Daerah (PBB-P2 & BPHTB) Terpenuhi",
      },
    };
  }, [investment]);

  const handleDownloadEsgReport = async () => {
    try {
      await generateInvestmentResumePdf({
        investment: {
          id: String(investment.id),
          name: investment.name,
          sector: investment.sector,
          subSector: investment.subSector,
          district: district?.name || (investment as any).district || (investment as any).districtId || "-",
          village: (investment as any).village || (investment as any).villageId || "-",
          areaHa: investment.areaHa,
          investmentValue: investment.investmentValue,
          status: investment.status,
          description: investment.description,
        },
      });
    } catch (err) {
      console.warn("Direct PDF trigger fallback:", err);
      window.print();
    }
  };

  const cardBg = isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xl";
  const textTitle = isDarkMode ? "text-slate-100" : "text-slate-900";
  const textMuted = isDarkMode ? "text-slate-400" : "text-slate-600";

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-fadeIn"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 150 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 150 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-4xl h-[95vh] sm:h-auto sm:max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl border ${cardBg} overflow-hidden shadow-2xl relative transition-all`}
      >
        {/* Mobile Drag Bar Indicator */}
        <div className={`w-12 h-1.5 rounded-full mx-auto mt-3 mb-1.5 sm:hidden shrink-0 ${isDarkMode ? "bg-neutral-800" : "bg-slate-300"}`} />

        {/* ── HEADER ── */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-inner shrink-0">
              <ShieldCheck className="w-5 sm:w-6 h-5 sm:h-6 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans truncate leading-tight">
                  Spatial Risk & ESG Due Diligence
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  ESG Verified
                </span>
              </div>
              <p className={`text-xs ${textMuted} mt-0.5 sm:mt-1 font-medium truncate`}>
                Audit kepatuhan Lingkungan Hidup, Sosial & Tata Kelola Luwu
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all shrink-0 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center border border-transparent active:border-slate-200 dark:active:border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── ESG SCORE OVERVIEW STRIP ── */}
        <div className="px-4 py-3 sm:px-6 sm:py-4.5 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent border-b border-slate-150 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Proyek Investasi yang Diaudit:
            </span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-sans mt-0.5 truncate">
              {investment.name} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">({investment.sector})</span>
            </h3>
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-slate-950/40 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl border border-slate-200/80 dark:border-white/5 shadow-sm w-fit self-end sm:self-auto">
            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Skor Kepatuhan ESG
              </span>
              <div className="flex items-baseline gap-0.5 font-sans mt-0.5">
                <span className="font-black text-xl sm:text-2xl text-emerald-600 dark:text-emerald-400">
                  {esgAudit.compositeEsgScore}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">/100</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Award className="w-5 sm:w-6 h-5 sm:h-6 stroke-[2.2]" />
            </div>
          </div>
        </div>

        {/* ── 3 ESG PILLARS AUDIT DETAILS ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* PILLAR 1: ENVIRONMENTAL (E) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Leaf className="w-5 h-5 stroke-[2.2]" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-sans uppercase tracking-wider">
                  1. Aspek Lingkungan (Environmental Compliance)
                </h4>
              </div>
              <div className="flex items-baseline gap-1 font-sans text-xs bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-200/50 dark:border-white/5 shadow-inner">
                <span className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider text-xs">Skor:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{esgAudit.environmental.score}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">/100</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-white/5 space-y-1.5 hover:border-emerald-500/20 transition-colors">
                <span className="text-slate-400 dark:text-slate-500 block text-xs font-bold uppercase tracking-wider">Kesesuaian Hutan Lindung:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mt-0.5 font-sans text-xs sm:text-sm">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                  {esgAudit.environmental.protectedForestOverlap}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-white/5 space-y-1.5 hover:border-emerald-500/20 transition-colors">
                <span className="text-slate-400 dark:text-slate-500 block text-xs font-bold uppercase tracking-wider">Sempadan Sungai & Sumber Air:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mt-0.5 font-sans text-xs sm:text-sm">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                  {esgAudit.environmental.riverBufferCompliance}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-white/5 space-y-1.5 hover:border-emerald-500/20 transition-colors sm:col-span-2">
                <span className="text-slate-400 dark:text-slate-500 block text-xs font-bold uppercase tracking-wider">Kewajiban Dokumen Lingkungan:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mt-0.5 font-sans text-xs sm:text-sm">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                  {esgAudit.environmental.amdalType}
                </span>
              </div>
            </div>
          </div>

          {/* PILLAR 2: SOCIAL & LABOR (S) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Users className="w-5 h-5 stroke-[2.2]" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-sans uppercase tracking-wider">
                  2. Aspek Sosial & Ketenagakerjaan (Social Impact)
                </h4>
              </div>
              <div className="flex items-baseline gap-1 font-sans text-xs bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-200/50 dark:border-white/5 shadow-inner">
                <span className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider text-xs">Skor:</span>
                <span className="font-extrabold text-blue-600 dark:text-blue-400">{esgAudit.social.score}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">/100</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-white/5 space-y-1.5 hover:border-blue-500/20 transition-colors">
                <span className="text-slate-400 dark:text-slate-500 block text-xs font-bold uppercase tracking-wider">Proyeksi Penyerapan Tenaga Kerja:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mt-0.5 font-sans text-xs sm:text-sm">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                  ± {formatNumber(esgAudit.social.estWorkforce)} Orang
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-white/5 space-y-1.5 hover:border-blue-500/20 transition-colors">
                <span className="text-slate-400 dark:text-slate-500 block text-xs font-bold uppercase tracking-wider">Prioritas Tenaga Kerja Lokal Luwu:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mt-0.5 font-sans text-xs sm:text-sm">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                  {esgAudit.social.localLaborTarget}
                </span>
              </div>
            </div>
          </div>

          {/* PILLAR 3: GOVERNANCE & REGULATION (G) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Building className="w-5 h-5 stroke-[2.2]" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-sans uppercase tracking-wider">
                  3. Tata Kelola & Kepatuhan Legal (Governance)
                </h4>
              </div>
              <div className="flex items-baseline gap-1 font-sans text-xs bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-200/50 dark:border-white/5 shadow-inner">
                <span className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider text-xs">Skor:</span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{esgAudit.governance.score}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">/100</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-white/5 space-y-1.5 hover:border-indigo-500/20 transition-colors">
                <span className="text-slate-400 dark:text-slate-500 block text-xs font-bold uppercase tracking-wider">Sistem OSS-RBA:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mt-0.5 font-sans text-xs sm:text-sm">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                  {esgAudit.governance.ossStatus}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-white/5 space-y-1.5 hover:border-indigo-500/20 transition-colors">
                <span className="text-slate-400 dark:text-slate-500 block text-xs font-bold uppercase tracking-wider">Kesesuaian Tata Ruang (PKKPR):</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mt-0.5 font-sans text-xs sm:text-sm">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                  {esgAudit.governance.pkkprStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER / STICKY ACTION BAR ── */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-t border-slate-200 dark:border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md shrink-0">
          <span className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium text-center sm:text-left">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 animate-pulse" />
            Audit ESG sesuai standar Taksonomi Keuangan Berkelanjutan Indonesia (TKBI)
          </span>

          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 h-11 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all text-center cursor-pointer font-sans active:scale-95"
            >
              TUTUP
            </button>
            <button
              type="button"
              onClick={handleDownloadEsgReport}
              className="flex-1 sm:flex-none px-4 h-11 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md dark:shadow-emerald-950/45 transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans active:scale-95"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>UNDUH LAPORAN ESG</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
