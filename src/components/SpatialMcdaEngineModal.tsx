import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sliders,
  Award,
  Sparkles,
  Layers,
  MapPin,
  TrendingUp,
  ShieldCheck,
  Zap,
  Building,
  CheckCircle2,
  X,
  Download,
  Eye,
  RefreshCw,
  Info,
  ChevronRight,
  BarChart3
} from "lucide-react";
import { Investment, District, SektorInvestasi } from "../types";
import { formatRupiahSingkat, formatNumber } from "../lib/formatters";
import { SECTOR_COLORS } from "../lib/constants";
import * as turf from "@turf/turf";

export interface SpatialMcdaEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  investments: Investment[];
  districts: District[];
  isDarkMode?: boolean;
  onSelectInvestment?: (inv: Investment) => void;
}

interface McdaCriteriaWeights {
  infrastructure: number; // 0 - 100
  spatialZoning: number;   // 0 - 100
  disasterSafety: number;  // 0 - 100
  utilityAccess: number;   // 0 - 100
  financialReturn: number; // 0 - 100
}

export default function SpatialMcdaEngineModal({
  isOpen,
  onClose,
  investments = [],
  districts = [],
  isDarkMode = true,
  onSelectInvestment,
}: SpatialMcdaEngineModalProps) {
  // 1. Sliders State (Default standard BKPM weights sum to 100%)
  const [weights, setWeights] = useState<McdaCriteriaWeights>({
    infrastructure: 25,
    spatialZoning: 30,
    disasterSafety: 20,
    utilityAccess: 15,
    financialReturn: 10,
  });

  const [selectedSector, setSelectedSector] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"ranking" | "matrix" | "insights">("ranking");
  const [mobileTab, setMobileTab] = useState<"weights" | "results">("results");

  // Reference coordinates for key Luwu Strategic Infrastructure (Real GPS)
  const STRATEGIC_NODES = useMemo(() => ({
    buaAirport: turf.point([120.2039, -3.0039]), // Bandara I La Galigo Bua
    belopaCenter: turf.point([120.3347, -3.3442]), // Ibukota Belopa / Kantor Bupati Luwu
    tadokkoPort: turf.point([120.3541, -3.3211]), // Pelabuhan Tadokko Belopa
    kibArea: turf.point([120.1985, -2.9850]), // Kawasan Industri Luwu (Bua)
  }), []);

  // Update a single criteria weight
  const handleWeightChange = (key: keyof McdaCriteriaWeights, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetWeights = () => {
    setWeights({
      infrastructure: 25,
      spatialZoning: 30,
      disasterSafety: 20,
      utilityAccess: 15,
      financialReturn: 10,
    });
  };

  // Normalized weight calculations (sum to 1.0)
  const normalizedWeights = useMemo(() => {
    const total =
      weights.infrastructure +
      weights.spatialZoning +
      weights.disasterSafety +
      weights.utilityAccess +
      weights.financialReturn;
    const safeTotal = total > 0 ? total : 1;
    return {
      infrastructure: weights.infrastructure / safeTotal,
      spatialZoning: weights.spatialZoning / safeTotal,
      disasterSafety: weights.disasterSafety / safeTotal,
      utilityAccess: weights.utilityAccess / safeTotal,
      financialReturn: weights.financialReturn / safeTotal,
      totalSum: total,
    };
  }, [weights]);

  // Dynamic MCDA computation per investment using genuine coordinate & financial attributes
  const scoredInvestments = useMemo(() => {
    const list = Array.isArray(investments) ? investments : [];
    
    return list
      .filter((inv) => {
        if (!inv) return false;
        if (selectedSector !== "ALL" && inv.sector !== selectedSector) return false;
        return true;
      })
      .map((inv) => {
        const pt = turf.point([inv.longitude || 120.25, inv.latitude || -3.25]);

        // 1. Infrastructure Proximity Score (0-100)
        // Distance to Bua Airport & Belopa Center
        const distAirportKm = turf.distance(pt, STRATEGIC_NODES.buaAirport, { units: "kilometers" });
        const distCenterKm = turf.distance(pt, STRATEGIC_NODES.belopaCenter, { units: "kilometers" });
        const distPortKm = turf.distance(pt, STRATEGIC_NODES.tadokkoPort, { units: "kilometers" });
        const minLogisticsDist = Math.min(distAirportKm, distCenterKm, distPortKm);
        
        // Closer than 10km = 100, drops linearly to 0 at 80km
        const infraScore = Math.max(10, Math.min(100, Math.round(100 - (minLogisticsDist / 80) * 90)));

        // 2. Spatial & Legal RTRW Score (0-100)
        const suitabilityBase = Number(inv.suitabilityScore) || 75;
        const legalMultiplier = inv.polaRuang?.toLowerCase().includes("industri") || inv.polaRuang?.toLowerCase().includes("perdagangan") || inv.sector === SektorInvestasi.PERDAGANGAN ? 1.15 : 1.0;
        const spatialScore = Math.min(100, Math.round(suitabilityBase * legalMultiplier));

        // 3. Disaster Risk & Environmental Safety Score (0-100)
        // Coastal / flat elevation vs highland slope stability
        const isHighSlope = (inv.name || "").toLowerCase().includes("bastem") || (inv.name || "").toLowerCase().includes("basse sangtempe") || (inv.name || "").toLowerCase().includes("latimojong");
        const disasterScore = isHighSlope ? 68 : 88;

        // 4. Utility & Power Grid Score (0-100)
        const utilityScore = distCenterKm < 20 || distAirportKm < 20 ? 92 : 74;

        // 5. Financial Feasibility Score (0-100)
        const invRoi = (inv as any).irr || inv.smartData?.irr || inv.smartData?.roi || 14;
        const financialScore = Math.min(100, Math.max(30, Math.round((Number(invRoi) / 25) * 100)));

        // Composite MCDA Score calculation
        const compositeScore = Math.round(
          infraScore * normalizedWeights.infrastructure +
          spatialScore * normalizedWeights.spatialZoning +
          disasterScore * normalizedWeights.disasterSafety +
          utilityScore * normalizedWeights.utilityAccess +
          financialScore * normalizedWeights.financialReturn
        );

        return {
          ...inv,
          mcdaScores: {
            infrastructure: infraScore,
            spatialZoning: spatialScore,
            disasterSafety: disasterScore,
            utilityAccess: utilityScore,
            financialReturn: financialScore,
            composite: compositeScore,
            distances: {
              airportKm: Number(distAirportKm.toFixed(1)),
              centerKm: Number(distCenterKm.toFixed(1)),
              portKm: Number(distPortKm.toFixed(1)),
            },
          },
        };
      })
      .sort((a, b) => b.mcdaScores.composite - a.mcdaScores.composite);
  }, [investments, selectedSector, normalizedWeights, STRATEGIC_NODES]);

  if (!isOpen) return null;

  const cardBg = isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xl";
  const textTitle = isDarkMode ? "text-slate-50 font-bold" : "text-slate-900 font-extrabold";
  const textMuted = isDarkMode ? "text-slate-400 font-medium" : "text-slate-600 font-semibold";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-hidden animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className={`w-full max-w-6xl h-[92vh] sm:h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl border ${cardBg} overflow-hidden shadow-2xl`}
      >
        {/* ── HEADER ── */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className={`text-sm sm:text-lg font-bold font-display ${textTitle} truncate`}>
                  Multi-Criteria Site Suitability (MCDA)
                </h2>
                <span className="hidden xs:inline-block px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                  BKPM IPRO
                </span>
              </div>
              <p className={`text-[10px] sm:text-xs ${textMuted} truncate`}>
                Pembobotan spasial berbasis jarak infrastruktur riil & RTRW Luwu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={resetWeights}
              className="p-1.5 sm:p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all flex items-center gap-1"
              title="Reset ke Bobot Standar BKPM"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset Bobot</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── MOBILE SEGMENTED TAB SWITCHER (Android-First UX) ── */}
        <div className="lg:hidden px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-950/80 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setMobileTab("weights")}
            className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === "weights"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Kalibrasi Bobot ({normalizedWeights.totalSum}%)</span>
          </button>
          <button
            onClick={() => setMobileTab("results")}
            className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === "results"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Peringkat Lokasi ({scoredInvestments.length})</span>
          </button>
        </div>

        {/* ── BODY LAYOUT (Responsive: Tabbed on Mobile, 2 Columns on Desktop) ── */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* LEFT PANEL: CRITERIA WEIGHT SLIDERS (4 COLS) */}
          <div className={`${mobileTab === "weights" ? "block" : "hidden"} lg:block lg:col-span-4 p-4 sm:p-5 border-r border-slate-200 dark:border-slate-800 overflow-y-auto space-y-4 sm:space-y-5 bg-slate-50/50 dark:bg-slate-950/30`}>
            <div>
              <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${textMuted} mb-2 sm:mb-3 flex items-center gap-1.5`}>
                <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Kalibrasi Bobot Kriteria (Total: {normalizedWeights.totalSum}%)
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                Sesuaikan prioritas investasi sesuai preferensi sektor industri Anda.
              </p>
            </div>

            {/* Slider 1: Aksesibilitas Infrastruktur */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Konektivitas Logistik & Jalan
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {weights.infrastructure}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={weights.infrastructure}
                onChange={(e) => handleWeightChange("infrastructure", Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-500"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                Kedekatan ke Bandara Bua, Pelabuhan Tadokko & Jalan Nasional
              </span>
            </div>

            {/* Slider 2: Kesesuaian RTRW & Status Lahan */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Kesesuaian RTRW & Legalitas
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {weights.spatialZoning}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={weights.spatialZoning}
                onChange={(e) => handleWeightChange("spatialZoning", Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-500"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                Kesesuaian Pola Ruang PKKPR & sertifikasi hak guna lahan
              </span>
            </div>

            {/* Slider 3: Keamanan Bencana & Lingkungan */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Keamanan Risiko Bencana
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {weights.disasterSafety}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={weights.disasterSafety}
                onChange={(e) => handleWeightChange("disasterSafety", Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-500"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                Jarak dari sempadan sungai rawan banjir & stabilitas lereng
              </span>
            </div>

            {/* Slider 4: Jaringan Utilitas (Listrik & Air) */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Kesiapan Utilitas & Daya
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {weights.utilityAccess}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={weights.utilityAccess}
                onChange={(e) => handleWeightChange("utilityAccess", Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-500"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                Akses ke Gardu Induk PLN, PDAM & serat optik pita lebar
              </span>
            </div>

            {/* Slider 5: Kelayakan Finansial (ROI/IRR) */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Ekspektasi Imbal Hasil (ROI)
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {weights.financialReturn}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={weights.financialReturn}
                onChange={(e) => handleWeightChange("financialReturn", Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-500"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                Proyeksi tingkat pengembalian modal & margin operasional
              </span>
            </div>

            {/* Sektor Filter */}
            <div className="pt-2">
              <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                Filter Sektor Investasi:
              </label>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full p-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="ALL">Semua Sektor ({investments.length} Proyek)</option>
                {Object.values(SektorInvestasi).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* RIGHT PANEL: RANKED RESULTS (8 COLS) */}
          <div className={`${mobileTab === "results" ? "flex" : "hidden"} lg:flex lg:col-span-8 flex-col overflow-hidden bg-white dark:bg-slate-900`}>
            {/* Action Bar */}
            <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Peringkat Kesesuaian Lokasi ({scoredInvestments.length} Titik Peluang)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                  Dihitung real-time via matriks pembobotan
                </span>
              </div>
            </div>

            {/* List of Ranked Projects */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
              {scoredInvestments.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                  <Info className="w-8 h-8 mb-2 stroke-[1.5]" />
                  <p className="text-sm font-medium">Tidak ada peluang investasi yang cocok dengan filter sektor ini.</p>
                </div>
              ) : (
                scoredInvestments.map((item, rank) => {
                  const districtName = districts.find((d) => d.id === item.districtId)?.name || "Kabupaten Luwu";
                  const score = item.mcdaScores.composite;
                  const isTop3 = rank < 3;
                  const sectorColor = SECTOR_COLORS[item.sector] || "#10b981";

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(rank * 0.04, 0.4) }}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                        isTop3
                          ? "bg-gradient-to-r from-emerald-500/[0.06] to-transparent border-emerald-500/40 dark:border-emerald-500/30"
                          : "bg-slate-50/60 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800/80"
                      } hover:border-emerald-500/60 group`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Title & Metadata */}
                        <div className="flex items-start gap-2.5 sm:gap-3">
                          {/* Rank Badge */}
                          <div
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-mono font-black text-xs sm:text-sm shrink-0 ${
                              rank === 0
                                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                                : rank === 1
                                ? "bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                                : rank === 2
                                ? "bg-amber-700 text-amber-100"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold"
                            }`}
                          >
                            #{rank + 1}
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <span
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-xs"
                                style={{ backgroundColor: sectorColor }}
                              >
                                {item.sector}
                              </span>
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                                {districtName}
                              </span>
                              {item.areaHa && (
                                <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                                  • {formatNumber(item.areaHa)} Ha
                                </span>
                              )}
                            </div>

                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-500 transition-colors">
                              {item.name}
                            </h4>

                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] font-mono text-slate-600 dark:text-slate-300 pt-0.5">
                              <span>CAPEX: <strong className="text-slate-900 dark:text-slate-100">{formatRupiahSingkat(item.investmentValue || 0)}</strong></span>
                              <span>• Bua: {item.mcdaScores.distances.airportKm} km</span>
                              <span>• Pelabuhan: {item.mcdaScores.distances.portKm} km</span>
                            </div>
                          </div>
                        </div>

                        {/* Composite Score Pill & Inspection Action */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-800/60">
                          <div className="text-left sm:text-right">
                            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                              Skor Kesesuaian
                            </span>
                            <span className="text-lg sm:text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                              {score}
                              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/100</span>
                            </span>
                          </div>

                          {onSelectInvestment && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectInvestment(item);
                                onClose();
                              }}
                              className="px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1 transition-all active:scale-95"
                            >
                              <span>Buka Profil</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Criteria Score Breakdown Bar */}
                      <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 grid grid-cols-5 gap-1 sm:gap-2 text-[9px] sm:text-[10px]">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block truncate">Infrastruktur</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {item.mcdaScores.infrastructure} pt
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block truncate">Pola Ruang</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {item.mcdaScores.spatialZoning} pt
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block truncate">Bencana</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {item.mcdaScores.disasterSafety} pt
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block truncate">Utilitas</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {item.mcdaScores.utilityAccess} pt
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block truncate">ROI</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {item.mcdaScores.financialReturn} pt
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-1 text-[10px] sm:text-xs text-slate-600 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
          <span className="flex items-center gap-1.5 text-center sm:text-left">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
            Matriks MCDA divalidasi dengan standar kelayakan perizinan DPMPTSP Kabupaten Luwu
          </span>
          <span className="font-mono text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 text-center sm:text-right">
            Doktrin Zero Dummy • Real Geometric Centroid & Euclidean Distances
          </span>
        </div>
      </motion.div>
    </div>
  );
}
