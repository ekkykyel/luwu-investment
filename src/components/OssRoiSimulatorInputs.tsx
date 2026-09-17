import React, { useState, useEffect } from 'react';
import { SektorInvestasi } from '../types.js';
import { OSS_CAPEX_VARIABLES, OSS_OPEX_VARIABLES } from '../lib/ossVariables.js';
import { useTranslation } from 'react-i18next';
import { Settings2, Calculator, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatRupiahSingkat } from '../lib/formatters.js';

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
      return { label: t("business_micro", "Usaha Mikro"), color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" };
    } else if (capitalVal <= 5000000000) {
      return { label: t("business_small", "Usaha Kecil"), color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800" };
    } else if (capitalVal <= 10000000000) {
      return { label: t("business_medium", "Usaha Menengah"), color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800" };
    } else {
      return { label: t("business_large", "Usaha Besar"), color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800" };
    }
  };

  const currentSector = sector || SektorInvestasi.PERTANIAN; // Default to pertanian if none selected
  const capexFields = OSS_CAPEX_VARIABLES[currentSector] || [];
  const opexFields = OSS_OPEX_VARIABLES[currentSector] || [];

  return (
    <div className="space-y-6">
      <div className={`flex items-start sm:items-center justify-between gap-2 p-3 sm:p-4 rounded-2xl border transition-all duration-300 ${isDetailed ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border-emerald-500/30 shadow-lg shadow-emerald-500/5' : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600'}`}>
        <div className="flex flex-row items-center gap-2 flex-wrap">
          <div className="p-2 md:p-2.5 rounded-xl bg-emerald-500/20 dark:bg-emerald-400/20 mr-1"><Settings2 className="w-5 h-5 md:w-6 md:h-6 text-emerald-600 dark:text-emerald-400" /></div>
          <div className="flex flex-col mt-0.5 sm:mt-0"><span className="text-sm md:text-base font-bold leading-tight mb-0.5 text-emerald-700 dark:text-emerald-300">{t("use_oss_standard", "Gunakan Standar OSS / Odoo")}</span><span className="text-[11px] md:text-xs leading-tight font-medium text-emerald-600/70 dark:text-emerald-400/70">{t("detailed_calc_desc", "Kalkulasi rinci (CAPEX, OPEX, Naker)")}</span></div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={isDetailed}
            onChange={(e) => toggleDetailed(e.target.checked)}
          />
          <div className="w-12 h-6 bg-slate-300/80 peer-focus:outline-none rounded-full peer dark:bg-slate-700/80 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm dark:border-slate-600 peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-400"></div>
        </label>
      </div>

      <AnimatePresence mode="wait">
        {!isDetailed ? (
          <motion.div
            key="simple"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                <label className={`block text-xs font-normal uppercase tracking-wider ${textMuted}`}>
                  {t("roiSimulator.capex", "CAPEX (MODAL AWAL)")}
                </label>
                {capital && parseFloat(capital) > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getBusinessScaleBadge(capital).color}`}>
                    {getBusinessScaleBadge(capital).label}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 font-normal ${textMuted}`}>
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatInputAmount(capital)}
                  onFocus={(e) => {
                    e.target.select();
                    setCapital("");
                  }}
                  onChange={(e) => handleNumericInput(e.target.value, setCapital)}
                  className={`w-full pl-8 sm:pl-9 pr-3 sm:pr-3 py-2.5 sm:py-3 min-h-[44px] sm:min-h-[48px] rounded-2xl border font-bold text-sm sm:text-base outline-none transition-all focus:ring-4 focus:ring-emerald-500/20 ${inputBg}`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-normal uppercase tracking-wider mb-2 ${textMuted}`}>
                {t("roiSimulator.opex", "OPEX (BIAYA OPERASIONAL TAHUNAN)")}
              </label>
              <div className="relative">
                <span className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 font-normal ${textMuted}`}>
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatInputAmount(opex)}
                  onFocus={(e) => {
                    e.target.select();
                    setOpex("");
                  }}
                  onChange={(e) => handleNumericInput(e.target.value, setOpex)}
                  className={`w-full pl-8 sm:pl-9 pr-3 sm:pr-3 py-2.5 sm:py-3 min-h-[44px] sm:min-h-[48px] rounded-2xl border font-bold text-sm sm:text-base outline-none transition-all focus:ring-4 focus:ring-emerald-500/20 ${inputBg}`}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="detailed"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5 w-full"
          >
            {/* CAPEX Detailed Form */}
            <div className={`p-3.5 sm:p-5 rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col ${isDark ? "bg-slate-900/60 border-slate-700/50 hover:border-slate-600/80 shadow-lg shadow-black/20" : "bg-white border-slate-200/90 hover:border-slate-300 shadow-md shadow-slate-200/40"}`}>
              <button 
                type="button"
                onClick={() => setIsCapexExpanded(!isCapexExpanded)}
                className="w-full flex items-center justify-between gap-2 group text-left min-h-[44px]"
              >
                <div className="flex flex-row items-center gap-2 flex-wrap min-w-0">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-400/10">
                    <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-900 dark:text-white">{t("capex_breakdown", "Rincian CAPEX")}</h4>
                  {capital && parseFloat(capital) > 0 && (
                     <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${getBusinessScaleBadge(capital).color}`}>
                        {getBusinessScaleBadge(capital).label}
                     </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatRupiahSingkat(capital)}
                  </span>
                  <div className={`p-1.5 rounded-full transition-colors ${isDark ? 'bg-slate-800 group-hover:bg-slate-700' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isCapexExpanded ? 'rotate-180 text-emerald-500' : textMuted}`} />
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
                    <div className="pt-3 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                      {capexFields.map((field) => (
                        <div key={field.id} className="space-y-1">
                          <label className={`block text-[10px] sm:text-[11px] font-semibold tracking-wide truncate ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                            {t(field.id, field.label)}
                          </label>
                          <div className="relative">
                            <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none select-none ${isDark ? "text-slate-400" : "text-slate-500"}`}>
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
                              className={`w-full pl-9 pr-3 py-2 min-h-[44px] text-xs sm:text-sm font-semibold rounded-xl border outline-none transition-all focus:ring-2 focus:ring-emerald-500/30 ${inputBg}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-auto pt-3 border-t border-dashed border-slate-200 dark:border-slate-700/60 flex justify-between items-center gap-2 bg-slate-50/60 dark:bg-slate-800/40 -mx-3.5 sm:-mx-5 px-3.5 sm:px-5 py-3 rounded-b-2xl overflow-hidden">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex-1 min-w-0">
                        {t("total_capex", "Total CAPEX:")}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap shrink-0 font-mono">
                        {formatRupiahSingkat(capital)}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Labor Detailed Form */}
            <div className={`p-3.5 sm:p-5 rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col ${isDark ? "bg-slate-900/60 border-slate-700/50 hover:border-slate-600/80 shadow-lg shadow-black/20" : "bg-white border-slate-200/90 hover:border-slate-300 shadow-md shadow-slate-200/40"}`}>
              <button 
                type="button"
                onClick={() => setIsLaborExpanded(!isLaborExpanded)}
                className="w-full flex items-center justify-between gap-2 group text-left min-h-[44px]"
              >
                <div className="flex flex-row items-center gap-2 flex-wrap min-w-0">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 dark:bg-indigo-400/10">
                    <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-900 dark:text-white">{t("labor_costs_section", "Biaya Tenaga Kerja")}</h4>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    {formatRupiahSingkat((((parseInt(tkaCount) || 0) * (parseInt(tkaSalary) || 0)) + ((parseInt(tklCount) || 0) * (parseInt(tklSalary) || 0))) * 12)}
                  </span>
                  <div className={`p-1.5 rounded-full transition-colors ${isDark ? 'bg-slate-800 group-hover:bg-slate-700' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isLaborExpanded ? 'rotate-180 text-indigo-500' : textMuted}`} />
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
                    <div className="pt-3 pb-3 space-y-4">
                      {/* TKL Input Group */}
                      <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-700/50 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">{t("local_workers", "Tenaga Kerja Lokal (TKL)")}</h5>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {formatRupiahSingkat((parseInt(tklCount) || 0) * (parseInt(tklSalary) || 0) * 12)} / thn
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className={`block text-[10px] sm:text-[11px] font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                              {t("qty_local_workers", "Jumlah TKL (Orang)")}
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formatInputAmount(tklCount)}
                              onFocus={(e) => { e.target.select(); setTklCount(""); }}
                              onChange={(e) => setTklCount(e.target.value.replace(/\D/g, ""))}
                              className={`w-full px-3 py-2 min-h-[44px] text-xs sm:text-sm font-semibold rounded-xl border outline-none transition-all focus:ring-2 focus:ring-indigo-500/30 ${inputBg}`}
                              placeholder="e.g. 50"
                            />
                          </div>
                          <div>
                            <label className={`block text-[10px] sm:text-[11px] font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                              {t("base_salary", "Gaji Pokok / Bulan")}
                            </label>
                            <div className="relative">
                              <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none select-none ${isDark ? "text-slate-400" : "text-slate-500"}`}>Rp</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={formatInputAmount(tklSalary)}
                                onFocus={(e) => { e.target.select(); setTklSalary(""); }}
                                onChange={(e) => setTklSalary(e.target.value.replace(/\D/g, ""))}
                                className={`w-full pl-9 pr-3 py-2 min-h-[44px] text-xs sm:text-sm font-semibold rounded-xl border outline-none transition-all focus:ring-2 focus:ring-indigo-500/30 ${inputBg}`}
                                placeholder={t("std_umr", "UMR Standar")}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* TKA Input Group */}
                      <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-700/50 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">{t("foreign_workers", "Tenaga Kerja Asing (TKA)")}</h5>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {formatRupiahSingkat((parseInt(tkaCount) || 0) * (parseInt(tkaSalary) || 0) * 12)} / thn
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className={`block text-[10px] sm:text-[11px] font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                              {t("qty_foreign_workers", "Jumlah TKA (Orang)")}
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formatInputAmount(tkaCount)}
                              onFocus={(e) => { e.target.select(); setTkaCount(""); }}
                              onChange={(e) => setTkaCount(e.target.value.replace(/\D/g, ""))}
                              className={`w-full px-3 py-2 min-h-[44px] text-xs sm:text-sm font-semibold rounded-xl border outline-none transition-all focus:ring-2 focus:ring-indigo-500/30 ${inputBg}`}
                              placeholder="e.g. 2"
                            />
                          </div>
                          <div>
                            <label className={`block text-[10px] sm:text-[11px] font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                              {t("base_salary", "Gaji Pokok / Bulan")}
                            </label>
                            <div className="relative">
                              <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none select-none ${isDark ? "text-slate-400" : "text-slate-500"}`}>Rp</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={formatInputAmount(tkaSalary)}
                                onFocus={(e) => { e.target.select(); setTkaSalary(""); }}
                                onChange={(e) => setTkaSalary(e.target.value.replace(/\D/g, ""))}
                                className={`w-full pl-9 pr-3 py-2 min-h-[44px] text-xs sm:text-sm font-semibold rounded-xl border outline-none transition-all focus:ring-2 focus:ring-indigo-500/30 ${inputBg}`}
                                placeholder={t("std_tka", "Standar TKA")}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-3 border-t border-dashed border-slate-200 dark:border-slate-700/60 flex justify-between items-center gap-2 bg-slate-50/60 dark:bg-slate-800/40 -mx-3.5 sm:-mx-5 px-3.5 sm:px-5 py-3 rounded-b-2xl overflow-hidden">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex-1 min-w-0">
                        {t("total_labor_year", "Total Biaya TK / Tahun:")}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap shrink-0 font-mono">
                        {formatRupiahSingkat((((parseInt(tkaCount) || 0) * (parseInt(tkaSalary) || 0)) + ((parseInt(tklCount) || 0) * (parseInt(tklSalary) || 0))) * 12)}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* OPEX Detailed Form */}
            <div className={`p-3.5 sm:p-5 rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col ${isDark ? "bg-slate-900/60 border-slate-700/50 hover:border-slate-600/80 shadow-lg shadow-black/20" : "bg-white border-slate-200/90 hover:border-slate-300 shadow-md shadow-slate-200/40"}`}>
              <button 
                type="button"
                onClick={() => setIsOpexExpanded(!isOpexExpanded)}
                className="w-full flex items-center justify-between gap-2 group text-left min-h-[44px]"
              >
                <div className="flex flex-row items-center gap-2 flex-wrap min-w-0">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 dark:bg-blue-400/10">
                    <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-900 dark:text-white">{t("opex_breakdown", "Rincian OPEX")}</h4>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                    {formatRupiahSingkat(opex)}
                  </span>
                  <div className={`p-1.5 rounded-full transition-colors ${isDark ? 'bg-slate-800 group-hover:bg-slate-700' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpexExpanded ? 'rotate-180 text-blue-500' : textMuted}`} />
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
                    <div className="pt-3 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                      {opexFields.map((field) => (
                        <div key={field.id} className="space-y-1">
                          <label className={`block text-[10px] sm:text-[11px] font-semibold tracking-wide truncate ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                            {t(field.id, field.label)}
                          </label>
                          <div className="relative">
                            <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none select-none ${isDark ? "text-slate-400" : "text-slate-500"}`}>
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
                              className={`w-full pl-9 pr-3 py-2 min-h-[44px] text-xs sm:text-sm font-semibold rounded-xl border outline-none transition-all focus:ring-2 focus:ring-blue-500/30 ${inputBg}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-auto pt-3 border-t border-dashed border-slate-200 dark:border-slate-700/60 flex justify-between items-center gap-2 bg-slate-50/60 dark:bg-slate-800/40 -mx-3.5 sm:-mx-5 px-3.5 sm:px-5 py-3 rounded-b-2xl overflow-hidden">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex-1 min-w-0">
                        {t("total_opex", "Total OPEX:")}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap shrink-0 font-mono">
                        {formatRupiahSingkat(opex)}
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
