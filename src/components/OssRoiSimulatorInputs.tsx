import React, { useState, useEffect } from 'react';
import { SektorInvestasi } from '../types.js';
import { OSS_CAPEX_VARIABLES, OSS_OPEX_VARIABLES } from '../lib/ossVariables.js';
import { useTranslation } from 'react-i18next';
import { Settings2, Calculator, ChevronDown, Users, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatRupiahSingkat, formatRupiahKompak } from '../lib/formatters.js';

export function OssRoiSimulatorInputs({
  sector,
  capital,
  setCapital,
  opex,
  setOpex,
  isDark,
  textMuted,
  inputBg,
  useDetailed,
  setUseDetailed
}: {
  sector: SektorInvestasi | null;
  capital: string;
  setCapital: (val: string) => void;
  opex: string;
  setOpex: (val: string) => void;
  isDark: boolean;
  textMuted: string;
  inputBg: string;
  useDetailed?: boolean;
  setUseDetailed?: (val: boolean) => void;
}) {
  const { t } = useTranslation();
  const [localUseDetailed, setLocalUseDetailed] = useState(false);
  const isDetailed = useDetailed !== undefined ? useDetailed : localUseDetailed;
  const toggleDetailed = setUseDetailed || setLocalUseDetailed;
  
  // Detailed states
  const [capexDetails, setCapexDetails] = useState<Record<string, string>>({});
  const [opexDetails, setOpexDetails] = useState<Record<string, string>>({});
  const [isCapexExpanded, setIsCapexExpanded] = useState(true);
  const [isOpexExpanded, setIsOpexExpanded] = useState(true);
  const [isLaborExpanded, setIsLaborExpanded] = useState(true);
  
  // Labor Cost states
  const [tkaCount, setTkaCount] = useState<string>("");
  const [tkaSalary, setTkaSalary] = useState<string>("15000000"); // 15M Default
  const [tklCount, setTklCount] = useState<string>("");
  const [tklSalary, setTklSalary] = useState<string>("3500000"); // 3.5M Default UMR

  // Preset chips for rapid mobile input (No keyboard fatigue)
  const capexPresets = [
    { label: "1 M", value: "1000000000" },
    { label: "5 M", value: "5000000000" },
    { label: "10 M", value: "10000000000" },
    { label: "25 M", value: "25000000000" },
    { label: "50 M", value: "50000000000" },
  ];

  const opexPresets = [
    { label: "150 Jt", value: "150000000" },
    { label: "500 Jt", value: "500000000" },
    { label: "1,2 M", value: "1200000000" },
    { label: "2,5 M", value: "2500000000" },
    { 
      label: "15% Modal", 
      dynamic: true, 
      getValue: () => {
        const cap = parseFloat(capital) || 0;
        return cap > 0 ? Math.round(cap * 0.15).toString() : "500000000";
      }
    },
  ];

  // Calculate Labor Cost and Sync to Opex
  useEffect(() => {
    if (isDetailed) {
      const countTKA = parseInt(tkaCount) || 0;
      const salaryTKA = parseInt(tkaSalary) || 0;
      const countTKL = parseInt(tklCount) || 0;
      const salaryTKL = parseInt(tklSalary) || 0;
      
      const totalMonthlyLaborCost = (countTKA * salaryTKA) + (countTKL * salaryTKL);
      const totalAnnualLaborCost = totalMonthlyLaborCost * 12;
      
      if (totalAnnualLaborCost > 0 || countTKA > 0 || countTKL > 0) {
        setOpexDetails(prev => ({
          ...prev,
          opex_naker: totalAnnualLaborCost.toString()
        }));
      }
    }
  }, [tkaCount, tkaSalary, tklCount, tklSalary, isDetailed]);

  // Sync detailed states to parent state when they change
  useEffect(() => {
    if (isDetailed) {
      const totalCapex = Object.values(capexDetails).reduce((sum, val) => sum + (parseInt(val) || 0), 0);
      const totalOpex = Object.values(opexDetails).reduce((sum, val) => sum + (parseInt(val) || 0), 0);
      
      if (totalCapex > 0) setCapital(totalCapex.toString());
      if (totalOpex > 0) setOpex(totalOpex.toString());
    }
  }, [capexDetails, opexDetails, isDetailed, setCapital, setOpex]);

  const formatInputAmount = (val: string) => {
    if (!val) return "";
    return parseInt(val.replace(/\D/g, "") || "0").toLocaleString("id-ID");
  };

  const handleNumericInput = (val: string, setter: (v: string) => void) => {
    const numericValue = val.replace(/\D/g, "");
    setter(numericValue);
  };

  const getBusinessScaleBadge = (capitalStr: string) => {
    const capitalVal = parseFloat(capitalStr) || 0;
    if (capitalVal <= 1000000000) {
      return { label: t("business_micro", "Usaha Mikro"), color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20" };
    } else if (capitalVal <= 5000000000) {
      return { label: t("business_small", "Usaha Kecil"), color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20" };
    } else if (capitalVal <= 10000000000) {
      return { label: t("business_medium", "Usaha Menengah"), color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20" };
    } else {
      return { label: t("business_large", "Usaha Besar"), color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20" };
    }
  };

  const currentSector = sector || SektorInvestasi.PERTANIAN; // Default to pertanian if none selected
  const capexFields = OSS_CAPEX_VARIABLES[currentSector] || [];
  const opexFields = OSS_OPEX_VARIABLES[currentSector] || [];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Toggle OSS/Odoo Standard Switcher */}
      <div className={`flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl border transition-all duration-300 ${isDetailed ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/30' : 'bg-slate-50 dark:bg-[#0A2238]/60 border-slate-200 dark:border-white/10'}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 shrink-0">
            <Settings2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block truncate">
              {t("use_oss_standard", "Standar Kalkulasi Terperinci OSS / BKPM")}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400 block truncate">
              {t("detailed_calc_desc", "Rincian item CAPEX, Tenaga Kerja (TKL/TKA), & OPEX")}
            </span>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={isDetailed}
            onChange={(e) => toggleDetailed(e.target.checked)}
          />
          <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
        </label>
      </div>

      <AnimatePresence mode="wait">
        {!isDetailed ? (
          <motion.div
            key="simple"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5"
          >
            {/* CAPEX Input Card */}
            <div className="p-4 rounded-2xl border bg-slate-50/80 dark:bg-elevated border-slate-200/90 dark:border-white/10 shadow-sm dark:shadow-lg dark:shadow-black/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    {t("roiSimulator.capex", "CAPEX (Modal Awal Investasi)")}
                  </label>
                  {capital && parseFloat(capital) > 0 && (
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${getBusinessScaleBadge(capital).color}`}>
                      {getBusinessScaleBadge(capital).label}
                    </span>
                  )}
                </div>
                
                <div className="relative mb-3">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs sm:text-sm text-slate-500 dark:text-slate-400 select-none">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatInputAmount(capital)}
                    onFocus={(e) => {
                      e.target.select();
                    }}
                    onChange={(e) => handleNumericInput(e.target.value, setCapital)}
                    className="w-full pl-10 pr-3 py-2.5 sm:py-3 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 font-mono font-bold text-sm sm:text-base outline-none transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50 bg-white text-gray-900 placeholder-gray-400 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400"
                    placeholder="Contoh: 5.000.000.000"
                  />
                </div>

                {/* Tactile Preset Chips (Anti-Form Fatigue on Mobile) */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mr-0.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Cepat:
                  </span>
                  {capexPresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setCapital(preset.value)}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                        capital === preset.value
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 dark:bg-surface dark:hover:bg-slate-700 dark:text-slate-300 dark:border-white/10'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* OPEX Input Card */}
            <div className="p-4 rounded-2xl border bg-slate-50/80 dark:bg-elevated border-slate-200/90 dark:border-white/10 shadow-sm dark:shadow-lg dark:shadow-black/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    {t("roiSimulator.opex", "OPEX (Biaya Operasional / Thn)")}
                  </label>
                  {capital && parseFloat(capital) > 0 && opex && parseFloat(opex) > 0 && (
                    <span className="text-[10px] font-mono font-bold text-sky-700 dark:text-sky-400">
                      {((parseFloat(opex) / parseFloat(capital)) * 100).toFixed(0)}% dari CAPEX
                    </span>
                  )}
                </div>
                
                <div className="relative mb-3">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs sm:text-sm text-slate-500 dark:text-slate-400 select-none">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatInputAmount(opex)}
                    onFocus={(e) => {
                      e.target.select();
                    }}
                    onChange={(e) => handleNumericInput(e.target.value, setOpex)}
                    className="w-full pl-10 pr-3 py-2.5 sm:py-3 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 font-mono font-bold text-sm sm:text-base outline-none transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50 bg-white text-gray-900 placeholder-gray-400 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400"
                    placeholder="Contoh: 1.000.000.000"
                  />
                </div>

                {/* Tactile Preset Chips for OPEX */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mr-0.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Cepat:
                  </span>
                  {opexPresets.map((preset) => {
                    const presetVal = preset.dynamic && preset.getValue ? preset.getValue() : preset.value;
                    const isSelected = opex === presetVal;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setOpex(presetVal)}
                        className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 dark:bg-surface dark:hover:bg-slate-700 dark:text-slate-300 dark:border-white/10'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="detailed"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4 w-full"
          >
            {/* CAPEX Detailed Form */}
            <div className="p-3.5 sm:p-4 rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col bg-slate-50/90 dark:bg-elevated border-slate-200/90 dark:border-white/10 shadow-sm dark:shadow-lg dark:shadow-black/20">
              <button 
                type="button"
                onClick={() => setIsCapexExpanded(!isCapexExpanded)}
                className="w-full flex items-center justify-between gap-2 group text-left min-h-[44px]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shrink-0">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-900 dark:text-white truncate">
                      {t("capex_breakdown", "Rincian CAPEX")}
                    </h4>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                    {formatRupiahKompak(capital)}
                  </span>
                  <div className="p-1 rounded-full bg-slate-200 dark:bg-slate-800 transition-colors">
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isCapexExpanded ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`} />
                  </div>
                </div>
              </button>
              
              <AnimatePresence>
                {isCapexExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden flex flex-col flex-1"
                  >
                    <div className="pt-3 pb-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {capexFields.map((field) => (
                        <div key={field.id} className="space-y-1">
                          <label className="block text-[10px] sm:text-[11px] font-semibold tracking-wide truncate text-slate-700 dark:text-slate-300">
                            {t(field.id, field.label)}
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 dark:text-slate-400 pointer-events-none select-none">
                              Rp
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="0"
                              value={formatInputAmount(capexDetails[field.id] || "")}
                              onFocus={(e) => {
                                e.target.select();
                              }}
                              onChange={(e) => {
                                const numericValue = e.target.value.replace(/\D/g, "");
                                setCapexDetails(prev => ({ ...prev, [field.id]: numericValue }));
                              }}
                              className="w-full pl-8 pr-2.5 py-1.5 min-h-[40px] text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 outline-none transition-all focus:ring-2 focus:ring-emerald-500/30 bg-white text-gray-900 placeholder-gray-400 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-2.5 border-t border-dashed border-slate-200 dark:border-white/10 flex justify-between items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {t("total_capex", "Total CAPEX:")}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                        {formatRupiahKompak(capital)}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Labor Detailed Form */}
            <div className="p-3.5 sm:p-4 rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col bg-slate-50/90 dark:bg-elevated border-slate-200/90 dark:border-white/10 shadow-sm dark:shadow-lg dark:shadow-black/20">
              <button 
                type="button"
                onClick={() => setIsLaborExpanded(!isLaborExpanded)}
                className="w-full flex items-center justify-between gap-2 group text-left min-h-[44px]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-900 dark:text-white truncate">
                    {t("labor_costs_section", "Biaya Tenaga Kerja")}
                  </h4>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 font-mono">
                    {formatRupiahKompak((((parseInt(tkaCount) || 0) * (parseInt(tkaSalary) || 0)) + ((parseInt(tklCount) || 0) * (parseInt(tklSalary) || 0))) * 12)}
                  </span>
                  <div className="p-1 rounded-full bg-slate-200 dark:bg-slate-800 transition-colors">
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isLaborExpanded ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`} />
                  </div>
                </div>
              </button>
              
              <AnimatePresence>
                {isLaborExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden flex flex-col flex-1"
                  >
                    <div className="pt-3 pb-2 space-y-3">
                      {/* TKL Input Group */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-[#0A2238]/60 border border-slate-200 dark:border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">{t("local_workers", "Tenaga Kerja Lokal (TKL)")}</h5>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {formatRupiahKompak((parseInt(tklCount) || 0) * (parseInt(tklSalary) || 0) * 12)} / thn
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold mb-1 text-slate-700 dark:text-slate-300">
                              {t("qty_local_workers", "Jumlah (Orang)")}
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formatInputAmount(tklCount)}
                              onFocus={(e) => { e.target.select(); setTklCount(""); }}
                              onChange={(e) => setTklCount(e.target.value.replace(/\D/g, ""))}
                              className="w-full px-2.5 py-1.5 min-h-[40px] text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 outline-none transition-all focus:ring-2 focus:ring-indigo-500/30 bg-white text-gray-900 placeholder-gray-400 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400"
                              placeholder="50"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold mb-1 text-slate-700 dark:text-slate-300">
                              {t("base_salary", "Gaji / Bulan")}
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formatInputAmount(tklSalary)}
                              onFocus={(e) => { e.target.select(); setTklSalary(""); }}
                              onChange={(e) => setTklSalary(e.target.value.replace(/\D/g, ""))}
                              className="w-full px-2.5 py-1.5 min-h-[40px] text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 outline-none transition-all focus:ring-2 focus:ring-indigo-500/30 bg-white text-gray-900 placeholder-gray-400 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400"
                              placeholder="3.500.000"
                            />
                          </div>
                        </div>
                      </div>

                      {/* TKA Input Group */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-[#0A2238]/60 border border-slate-200 dark:border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">{t("foreign_workers", "Tenaga Asing (TKA)")}</h5>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {formatRupiahKompak((parseInt(tkaCount) || 0) * (parseInt(tkaSalary) || 0) * 12)} / thn
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold mb-1 text-slate-700 dark:text-slate-300">
                              {t("qty_foreign_workers", "Jumlah (Orang)")}
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formatInputAmount(tkaCount)}
                              onFocus={(e) => { e.target.select(); setTkaCount(""); }}
                              onChange={(e) => setTkaCount(e.target.value.replace(/\D/g, ""))}
                              className="w-full px-2.5 py-1.5 min-h-[40px] text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 outline-none transition-all focus:ring-2 focus:ring-indigo-500/30 bg-white text-gray-900 placeholder-gray-400 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400"
                              placeholder="2"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold mb-1 text-slate-700 dark:text-slate-300">
                              {t("base_salary", "Gaji / Bulan")}
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formatInputAmount(tkaSalary)}
                              onFocus={(e) => { e.target.select(); setTkaSalary(""); }}
                              onChange={(e) => setTkaSalary(e.target.value.replace(/\D/g, ""))}
                              className="w-full px-2.5 py-1.5 min-h-[40px] text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 outline-none transition-all focus:ring-2 focus:ring-indigo-500/30 bg-white text-gray-900 placeholder-gray-400 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400"
                              placeholder="15.000.000"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-2 pt-2.5 border-t border-dashed border-slate-200 dark:border-white/10 flex justify-between items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {t("total_labor_year", "Total Biaya TK:")}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-indigo-700 dark:text-indigo-400 font-mono">
                        {formatRupiahKompak((((parseInt(tkaCount) || 0) * (parseInt(tkaSalary) || 0)) + ((parseInt(tklCount) || 0) * (parseInt(tklSalary) || 0))) * 12)}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* OPEX Detailed Form */}
            <div className="p-3.5 sm:p-4 rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col bg-slate-50/90 dark:bg-elevated border-slate-200/90 dark:border-white/10 shadow-sm dark:shadow-lg dark:shadow-black/20">
              <button 
                type="button"
                onClick={() => setIsOpexExpanded(!isOpexExpanded)}
                className="w-full flex items-center justify-between gap-2 group text-left min-h-[44px]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400 shrink-0">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-900 dark:text-white truncate">
                    {t("opex_breakdown", "Rincian OPEX")}
                  </h4>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-400 font-mono">
                    {formatRupiahKompak(opex)}
                  </span>
                  <div className="p-1 rounded-full bg-slate-200 dark:bg-slate-800 transition-colors">
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpexExpanded ? 'rotate-180 text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
                  </div>
                </div>
              </button>
              
              <AnimatePresence>
                {isOpexExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden flex flex-col flex-1"
                  >
                    <div className="pt-3 pb-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {opexFields.map((field) => (
                        <div key={field.id} className="space-y-1">
                          <label className="block text-[10px] sm:text-[11px] font-semibold tracking-wide truncate text-slate-700 dark:text-slate-300">
                            {t(field.id, field.label)}
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 dark:text-slate-400 pointer-events-none select-none">
                              Rp
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="0"
                              value={formatInputAmount(opexDetails[field.id] || "")}
                              onFocus={(e) => {
                                e.target.select();
                              }}
                              onChange={(e) => {
                                const numericValue = e.target.value.replace(/\D/g, "");
                                setOpexDetails(prev => ({ ...prev, [field.id]: numericValue }));
                              }}
                              className="w-full pl-8 pr-2.5 py-1.5 min-h-[40px] text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 outline-none transition-all focus:ring-2 focus:ring-blue-500/30 bg-white text-gray-900 placeholder-gray-400 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-2.5 border-t border-dashed border-slate-200 dark:border-white/10 flex justify-between items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {t("total_opex", "Total OPEX:")}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-400 font-mono">
                        {formatRupiahKompak(opex)}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ui polish: applied formatRupiahSingkat to prevent text truncation
