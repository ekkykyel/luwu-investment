import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Award,
  Calculator,
  CheckCircle2,
  Percent,
  Coins,
  ShieldCheck,
  Building2,
  Users,
  Briefcase,
  Sparkles,
  ArrowRight,
  Download,
  Info,
} from "lucide-react";
import { Investment } from "../types";
import { formatRupiahSingkat } from "../lib/formatters";
import { useTranslation } from "react-i18next";

interface IncentiveCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedInvestment?: Investment | null;
  isDark?: boolean;
  simulationContext?: any;
}

export default function IncentiveCalculatorModal({
  isOpen,
  onClose,
  selectedInvestment,
  isDark = true,
  simulationContext,
}: IncentiveCalculatorModalProps) {
  const { t } = useTranslation();

  // Dynamic user input state derived directly from selected Supabase Investment / Simulation Context
  const initialCapex =
    simulationContext?.capex ??
    (selectedInvestment as any)?.investmentValue ??
    (selectedInvestment as any)?.nilaiInvestasi ??
    (selectedInvestment as any)?.total_investment ??
    (selectedInvestment as any)?.financials?.capex ??
    10000000000;

  const [capexInput, setCapexInput] = useState<number>(initialCapex);
  const [capexDisplay, setCapexDisplay] = useState<string>(() =>
    initialCapex ? new Intl.NumberFormat("id-ID").format(initialCapex) : "0"
  );

  const [laborLocalPercent, setLaborLocalPercent] = useState<number>(75); // % TKD lokal Luwu
  const [selectedSector, setSelectedSector] = useState<string>(
    simulationContext?.sector || (selectedInvestment as any)?.sector || (selectedInvestment as any)?.sektor || ""
  );
  const [isExportOriented, setIsExportOriented] = useState<boolean>(true);
  const [isEcoFriendly, setIsEcoFriendly] = useState<boolean>(true);

  // Sync state whenever simulationContext or selectedInvestment changes
  useEffect(() => {
    if (simulationContext) {
      const simCapex = simulationContext.capex ?? (selectedInvestment as any)?.investmentValue ?? 10000000000;
      setCapexInput(simCapex);
      setCapexDisplay(new Intl.NumberFormat("id-ID").format(simCapex));
      if (simulationContext.sector) {
        setSelectedSector(simulationContext.sector);
      }
    } else if (selectedInvestment) {
      const invCapex = (selectedInvestment as any)?.investmentValue ?? (selectedInvestment as any)?.nilaiInvestasi ?? (selectedInvestment as any)?.total_investment ?? (selectedInvestment as any)?.financials?.capex ?? 0;
      setCapexInput(invCapex);
      setCapexDisplay(new Intl.NumberFormat("id-ID").format(invCapex));
      if ((selectedInvestment as any)?.sector) {
        setSelectedSector((selectedInvestment as any).sector);
      }
    }
  }, [isOpen, simulationContext, selectedInvestment]);

  // Focus handler: kosongkan nilai untuk input nilai terbaru sesuai permintaan user
  const handleCapexFocus = () => {
    setCapexDisplay("");
  };

  const handleCapexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, "");
    if (!rawVal) {
      setCapexDisplay("");
      setCapexInput(0);
      return;
    }
    const num = parseInt(rawVal, 10);
    setCapexInput(num);
    setCapexDisplay(new Intl.NumberFormat("id-ID").format(num));
  };

  const handleCapexBlur = () => {
    if (capexInput === 0 || !capexDisplay) {
      setCapexInput(0);
      setCapexDisplay("0");
    } else {
      setCapexDisplay(new Intl.NumberFormat("id-ID").format(capexInput));
    }
  };

  // Incentive Calculation Engine based on Perda & Perbup Kabupaten Luwu
  const incentiveResult = useMemo(() => {
    const capexInBillions = capexInput / 1000000000;

    // Base Regional Incentive Rate (Perbup Luwu No. 42/2021) = 35%
    const baseRegionalIncentivePercent = 35;

    // Tiers for Regional Retribution Reduction (PBG / Persetujuan Bangunan Gedung & Retribusi Daerah)
    let retribDiscount = 35; // base 35% per Perbup Luwu No. 42/2021
    if (capexInBillions >= 50) retribDiscount += 25; // +25% if capex >= 50B
    else if (capexInBillions >= 10) retribDiscount += 15;

    if (laborLocalPercent >= 70) retribDiscount += 15; // +15% if local labor >= 70%
    if (isExportOriented) retribDiscount += 10;
    if (isEcoFriendly) retribDiscount += 10;

    retribDiscount = Math.min(90, retribDiscount); // Cap at 90%

    // Land Lease Discount (Sewa Aset Pemkab Luwu)
    let landLeaseDiscount = 35; // base 35% per Perbup Luwu No. 42/2021
    if (laborLocalPercent >= 80) landLeaseDiscount = 50;
    else if (laborLocalPercent >= 60) landLeaseDiscount = 35;

    // Estimated Monetary Savings (Nominal Rupiah)
    const estimatedPbgCost = Math.min(2500000000, capexInput * 0.008); // Approx PBG fee
    const pbgSavings = estimatedPbgCost * (retribDiscount / 100);
    const regionalIncentiveNominal = estimatedPbgCost * (baseRegionalIncentivePercent / 100);

    // Tax Holiday / Tax Allowance Eligibility Status (PMK & OSS RBA)
    let taxHolidayStatus = "Eligible Tax Allowance (Diskon PPh Badan 30% s/d 6 Tahun)";
    if (capexInBillions >= 100) {
      taxHolidayStatus = "Eligible Super Tax Holiday (Diskon PPh Badan 100% s/d 10 Tahun)";
    } else if (capexInBillions < 5) {
      taxHolidayStatus = "Insentif UMKM / Daerah Luwu (Pembebasan Retribusi Daerah)";
    }

    // OSS RBA Priority SLA
    const slaDays = capexInBillions >= 10 ? "1 Hari" : "2 Hari";

    return {
      baseRegionalIncentivePercent,
      retribDiscount,
      landLeaseDiscount,
      estimatedPbgCost,
      pbgSavings,
      regionalIncentiveNominal,
      taxHolidayStatus,
      slaDays,
      isVipAssistance: capexInBillions >= 10,
    };
  }, [capexInput, laborLocalPercent, selectedSector, isExportOriented, isEcoFriendly]);

  if (!isOpen) return null;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div
      className="fixed inset-0 z-[10005] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-4xl rounded-t-3xl sm:rounded-3xl shadow-2xl border overflow-hidden my-0 sm:my-auto h-[95vh] sm:h-auto sm:max-h-[92vh] flex flex-col ${
          isDark
            ? "bg-black border-neutral-800 text-white"
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        {/* Mobile Drag Bar Indicator */}
        <div className={`w-12 h-1.5 rounded-full mx-auto mt-2 mb-1 sm:hidden shrink-0 ${isDark ? "bg-neutral-800" : "bg-slate-300"}`} />

        {/* Header Banner */}
        <div className={`relative p-3.5 sm:p-5 border-b flex items-center justify-between gap-3 shrink-0 ${
          isDark 
            ? "bg-gradient-to-r from-neutral-950 via-neutral-900 to-black border-amber-500/30" 
            : "bg-gradient-to-r from-amber-50/50 via-white to-amber-50/30 border-amber-500/30 text-slate-900"
        }`}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-3 bg-amber-500/10 rounded-2xl border border-amber-500/30 text-amber-500 shrink-0">
              <Award size={22} className="sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-0.5">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase border border-amber-500/30 whitespace-nowrap">
                  {t('badge_perda_incentive', 'Perda Kabupaten Luwu - Insentif Investasi')}
                </span>
              </div>
              <h3 className={`text-sm sm:text-base md:text-lg font-bold tracking-wide leading-snug ${isDark ? "text-white" : "text-slate-900"}`}>
                {t('modal_title_incentive', 'Kalkulator Insentif Daerah & Tax Allowance Luwu')}
              </h3>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className={`p-2.5 rounded-xl active:scale-95 transition-all cursor-pointer shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center border ${
              isDark 
                ? "bg-neutral-900 active:bg-neutral-800 text-slate-300 hover:text-white border-neutral-800" 
                : "bg-slate-100 active:bg-slate-200 text-slate-800 dark:text-slate-200 hover:text-slate-900 border-slate-200"
            }`}
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className={`p-3.5 sm:p-5 md:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 scrollbar-thin ${
          isDark ? "scrollbar-thumb-neutral-800 bg-black" : "scrollbar-thumb-slate-200 bg-slate-50/50"
        }`}>
          {/* Synchronized Simulation ROI Badge */}
          {simulationContext && (
            <div className={`p-4 rounded-2xl border shadow-lg space-y-3 ${
              isDark 
                ? "bg-gradient-to-r from-amber-950/80 via-neutral-900 to-indigo-950/80 border-amber-500/30" 
                : "bg-gradient-to-r from-amber-50 via-indigo-50/30 to-blue-50 border-amber-500/40 text-slate-900"
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500 animate-pulse shrink-0" />
                  <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-amber-300" : "text-amber-900"}`}>
                    ⚡ {t('sync_roi_general', 'TERSINKRONISASI DENGAN SIMULASI ROI')}: {simulationContext.name}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                  {simulationContext.status === "FEASIBLE" ? t('incentiveCalculator.feasible', 'Sangat Layak (Feasible)') : t('eval_potential_btn', 'EVALUASI POTENSI')}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block font-sans">{t('simulated_capex', 'CAPEX SIMULASI')}</span>
                  <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight">{formatRupiahSingkat(simulationContext.capex)}</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block font-sans">{t('annual_roi', 'ROI TAHUNAN')}</span>
                  <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight">{(Number(simulationContext.roi) || 0).toFixed(1)}%</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block font-sans">{t('incentiveCalculator.npvDiscount', 'NPV (Discount 9%)')}</span>
                  <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight">{formatRupiahSingkat(simulationContext.npv)}</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block font-sans">{t('payback_period', 'PAYBACK PERIOD')}</span>
                  <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight">{(Number(simulationContext.bep) || 0).toFixed(2)} {t('incentiveCalculator.years', 'Thn')}</span>
                </div>
              </div>

              {/* Impact Analysis on ROI */}
              {(() => {
                const totalSavings = incentiveResult.pbgSavings + incentiveResult.regionalIncentiveNominal;
                const netCapex = Math.max(1, capexInput - totalSavings);
                const annualProfit = simulationContext.netProfit || (simulationContext.asumsiPendapatan - simulationContext.opex) || 1;
                const adjustedPayback = (netCapex / Math.max(1, annualProfit)).toFixed(2);
                return (
                  <div className="p-3.5 sm:p-4 rounded-xl text-xs sm:text-sm leading-relaxed font-sans bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200">
                    💡 <strong>{t('impact_incentive_title', 'Dampak Insentif Daerah terhadap Kelayakan ROI:')}</strong>{" "}
                    {t('impact_incentive_desc', {
                      capex: formatRupiah(capexInput),
                      new_capex: formatRupiah(netCapex),
                      savings: formatRupiah(totalSavings),
                      old_bep: (Number(simulationContext.bep) || 0).toFixed(2),
                      new_bep: adjustedPayback,
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Input Parameter Form */}
          <div className={`p-3.5 sm:p-5 rounded-2xl border space-y-4 shadow-md ${
            isDark ? "bg-neutral-900/90 border-neutral-800" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <Calculator size={16} />
              <span>{t('param_sim_commitment', 'PARAMETER SIMULASI KOMITMEN INVESTASI')}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {/* Nilai Investasi (Capex) */}
              <div>
                <label className={`text-[11px] sm:text-[10px] font-bold uppercase block mb-1 ${isDark ? "text-slate-300" : "text-slate-800 dark:text-slate-200"}`}>
                  {t('input_capital_plan', 'MASUKKAN NILAI MODAL / RENCANA INVESTASI')}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-amber-500 select-none">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={capexDisplay}
                    onFocus={handleCapexFocus}
                    onChange={handleCapexChange}
                    onBlur={handleCapexBlur}
                    placeholder={t('incentiveCalculator.capexPlaceholder', 'Masukkan nilai modal (cth: 25.000.000.000)')}
                    className={`w-full border rounded-xl pl-9 pr-3.5 h-12 sm:h-10 text-sm sm:text-xs font-bold focus:outline-none tracking-wide font-mono ${
                      isDark 
                        ? "bg-black border-neutral-800 text-emerald-700 dark:text-emerald-400 focus:border-amber-500/80" 
                        : "bg-slate-50 border-slate-300 text-emerald-800 focus:border-amber-600"
                    }`}
                  />
                </div>
                <div className={`flex items-center justify-between gap-1 mt-1 text-[10px] font-medium ${isDark ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>
                  <span>≈ {(capexInput / 1000000000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} {t('incentiveCalculator.billionRupiah', 'Miliar Rupiah')}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatRupiah(capexInput)}</span>
                </div>
              </div>

              {/* % Tenaga Kerja Lokal Luwu */}
              <div>
                <label className={`text-[11px] sm:text-[10px] font-bold uppercase block mb-1 ${isDark ? "text-slate-300" : "text-slate-800 dark:text-slate-200"}`}>
                  {t('input_local_labor', 'KOMITMEN TENAGA KERJA LOKAL LUWU (%)')}
                </label>
                <div className="flex items-center gap-3 h-12 sm:h-10">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={laborLocalPercent}
                    onChange={(e) => setLaborLocalPercent(Number(e.target.value))}
                    className={`w-full accent-amber-500 cursor-pointer h-3 sm:h-2 rounded-lg ${isDark ? "bg-black" : "bg-slate-200"}`}
                  />
                  <span className="text-sm sm:text-xs font-bold text-amber-600 dark:text-amber-400 font-mono w-12 text-right shrink-0">
                    {laborLocalPercent}%
                  </span>
                </div>
                <span className={`text-[10px] block mt-0.5 font-medium ${isDark ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>
                  {t('target_perda_labor', 'Target Perda: Min. 60% - 70% untuk potongan maksimal')}
                </span>
              </div>

              {/* Sektor Usaha */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label className={`text-[11px] sm:text-[10px] font-bold uppercase block mb-1 ${isDark ? "text-slate-300" : "text-slate-800 dark:text-slate-200"}`}>
                  {t('strategic_sector', 'SEKTOR STRATEGIS')}
                </label>
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className={`w-full border rounded-xl px-3.5 h-12 sm:h-10 text-sm sm:text-xs font-semibold focus:outline-none cursor-pointer ${
                    isDark 
                      ? "bg-black border-neutral-800 text-slate-100 focus:border-amber-500/80" 
                      : "bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-600"
                  }`}
                >
                  <option value="Kakao & Agroindustri">Kakao & Olahan Kakao Premium</option>
                  <option value="Pengolahan Rumput Laut">Processing Rumput Laut Bua</option>
                  <option value="Budidaya Cengkeh & Kopi">Cengkeh & Kopi Organik</option>
                  <option value="Smelter & Industri Logam">Smelter / Pengolahan Mineral</option>
                  <option value="Pariwisata & Ekowisata">Ekowisata & Hotel Latimojong</option>
                  <option value="Energi Terbarukan">PLTA / Energi Hijau Luwu</option>
                </select>
              </div>
            </div>

            {/* Checkboxes Options */}
            <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 pt-3 border-t ${isDark ? "border-neutral-800" : "border-slate-200"}`}>
              <label className={`flex items-center gap-2.5 cursor-pointer text-xs font-medium active:text-amber-500 min-h-[36px] ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                <input
                  type="checkbox"
                  checked={isExportOriented}
                  onChange={(e) => setIsExportOriented(e.target.checked)}
                  className={`w-5 h-5 sm:w-4 sm:h-4 rounded border-slate-400 text-amber-500 focus:ring-amber-500/50 ${isDark ? "bg-black" : "bg-slate-100"}`}
                />
                <span>{t('check_export_oriented', 'Orientasi Ekspor Pasifik / Global')}</span>
              </label>

              <label className={`flex items-center gap-2.5 cursor-pointer text-xs font-medium active:text-emerald-500 min-h-[36px] ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                <input
                  type="checkbox"
                  checked={isEcoFriendly}
                  onChange={(e) => setIsEcoFriendly(e.target.checked)}
                  className={`w-5 h-5 sm:w-4 sm:h-4 rounded border-slate-400 text-emerald-500 focus:ring-emerald-500/50 ${isDark ? "bg-black" : "bg-slate-100"}`}
                />
                <span>{t('check_green_economy', 'Menggunakan Teknologi Ramah Lingkungan (Green Economy)')}</span>
              </label>
            </div>
          </div>

          {/* Incentive Results Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Retribusi Diskon */}
            <div className={`p-3.5 sm:p-5 rounded-2xl border relative overflow-hidden space-y-1 ${
              isDark ? "bg-neutral-900/90 border-amber-500/30" : "bg-amber-50/50 border-amber-300 text-slate-900"
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                {t('discount_retribusi', 'DISKON RETRIBUSI DAERAH & PBG')}
              </span>
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-amber-600 dark:text-amber-300 font-sans">
                {incentiveResult.retribDiscount}%
              </div>
              <span className={`text-[11px] block leading-snug pt-1 ${isDark ? "text-slate-600 dark:text-slate-400" : "text-slate-600"}`}>
                {t('discount_retribusi_desc', { amount: formatRupiahSingkat(incentiveResult.pbgSavings) })}
              </span>
            </div>

            {/* Diskon Sewa Lahan */}
            <div className={`p-3.5 sm:p-5 rounded-2xl border relative overflow-hidden space-y-1 ${
              isDark ? "bg-neutral-900/90 border-emerald-500/30" : "bg-emerald-50/50 border-emerald-300 text-slate-900"
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                {t('discount_sewa', 'DISKON SEWA ASET DAERAH')}
              </span>
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-300 font-sans">
                {incentiveResult.landLeaseDiscount}%
              </div>
              <span className={`text-[11px] block leading-snug pt-1 ${isDark ? "text-slate-600 dark:text-slate-400" : "text-slate-600"}`}>
                {t('discount_sewa_desc', { percent: laborLocalPercent })}
              </span>
            </div>

            {/* SLA OSS RBA */}
            <div className={`p-3.5 sm:p-5 rounded-2xl border relative overflow-hidden space-y-1 ${
              isDark ? "bg-neutral-900/90 border-neutral-800" : "bg-white border-slate-200 text-slate-900 shadow-xs"
            }`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                {t('fast_track_service', 'LAYANAN FAST-TRACK DPMPTSP')}
              </span>
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-amber-600 dark:text-amber-300 font-sans">
                {incentiveResult.slaDays}
              </div>
              <span className={`text-[11px] block leading-snug pt-1 ${isDark ? "text-slate-600 dark:text-slate-400" : "text-slate-600"}`}>
                {incentiveResult.isVipAssistance
                  ? t('incentiveCalculator.vipAssistance', '⭐ Didampingi khusus oleh Tim Pengawalan Investasi VIP DPMPTSP Luwu.')
                  : t('fast_track_desc', 'Proses perizinan diprioritaskan via jalur OSS-RBA.')}
              </span>
            </div>
          </div>

          {/* Tax Allowance & Fasilitas Pusat Banner */}
          <div className={`p-3.5 sm:p-5 rounded-2xl border space-y-3 ${
            isDark ? "bg-neutral-900/90 border-neutral-800" : "bg-white border-slate-200"
          }`}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <Coins size={16} />
              <span>{t('tax_facility_match', 'KESESUAIAN FASILITAS PAJAK (KEMENKEU & BKPM)')}</span>
            </h4>

            <div className={`p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              isDark ? "bg-black border-neutral-800" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="space-y-1">
                <span className={`text-xs font-bold block ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                  {t('eligible_tax_allowance', incentiveResult.taxHolidayStatus)}
                </span>
                <p className={`text-[11px] leading-relaxed ${isDark ? "text-slate-600 dark:text-slate-400" : "text-slate-600"}`}>
                  {t('tax_allowance_desc', { capex: formatRupiah(capexInput) })}
                </p>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-bold whitespace-nowrap shrink-0">
                {t('auto_facility_btn', 'Fasilitas Otomatis')}
              </span>
            </div>
          </div>

          {/* Detail Sumber Perhitungan Insentif Daerah 35% Sesuai Perda */}
          <div className={`p-3.5 sm:p-5 rounded-2xl border space-y-3 ${
            isDark 
              ? "bg-gradient-to-br from-amber-950/40 via-neutral-900 to-black border-amber-500/40" 
              : "bg-gradient-to-br from-amber-50/60 via-white to-amber-50/30 border-amber-300 text-slate-900"
          }`}>
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-3 ${
              isDark ? "border-amber-500/20" : "border-amber-200"
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Percent size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                      {t('regional_incentive_pct', { percent: incentiveResult.baseRegionalIncentivePercent })}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 uppercase">
                      {t('incentiveCalculator.pemkabLuwuBadge', 'Pemkab Luwu')}
                    </span>
                  </div>
                  <span className={`text-[11px] block ${isDark ? "text-slate-300" : "text-slate-800 dark:text-slate-200"}`}>
                    {t('basic_deduction_desc', 'Potongan Dasar Retribusi Daerah & Meringankan Sewa Barang Milik Daerah (BMD)')}
                  </span>
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className={`text-[10px] block ${isDark ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>{t('est_nominal_incentive', 'Estimasi Nominal Insentif:')}</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatRupiah(incentiveResult.regionalIncentiveNominal)}
                </span>
              </div>
            </div>

            <div className={`space-y-2 text-xs ${isDark ? "text-slate-300" : "text-slate-800 dark:text-slate-200"}`}>
              <p className="font-bold text-amber-700 dark:text-amber-200 flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-amber-500" />
                <span>{t('legal_basis_title', 'Sumber Perhitungan & Dasar Hukum Sesuai Perda:')}</span>
              </p>
              <ul className={`space-y-1.5 pl-5 list-disc text-[11px] leading-relaxed ${isDark ? "text-slate-300" : "text-slate-800 dark:text-slate-200"}`}>
                <li>
                  {t('legal_perda_06', 'Peraturan Daerah Kabupaten Luwu No. 06 Tahun 2011 (BAB VIII - Ketentuan Pengendalian & Insentif Penanaman Modal).')}
                </li>
                <li>
                  {t('legal_perbup_42', 'Peraturan Bupati Luwu No. 42 Tahun 2021 (Pasal 12 ayat 2 & Pasal 15 ayat 1 tentang Tata Cara Pemberian Insentif, Keringanan Retribusi Daerah, dan Kemudahan Penanaman Modal).')}
                </li>
                <li>
                  {t('legal_tariff_rule', { percent: incentiveResult.baseRegionalIncentivePercent })}
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 z-10">
          <div className={`flex items-center gap-2 text-[11px] sm:text-xs text-center sm:text-left ${isDark ? "text-slate-600 dark:text-slate-400" : "text-slate-600"}`}>
            <ShieldCheck size={15} className="text-amber-500 shrink-0" />
            <span>{t('footer_perbup_info', 'Peraturan Bupati Luwu tentang Insentif Penanaman Modal')}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-3 min-h-[44px] rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs sm:text-xs transition-all cursor-pointer shadow-md text-center flex items-center justify-center active:scale-98"
          >
            {t('btn_done_close', 'Selesai & Tutup')}
          </button>
        </div>
      </div>
    </div>
  );
}

// i18n update: complete translation for Incentive Calculator modal
