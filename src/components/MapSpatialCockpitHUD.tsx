import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import {
  PieChart as PieIcon,
  BarChart2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  MapPin,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import { District, Investment, SektorInvestasi } from "../types";
import { SECTOR_COLORS } from "../lib/constants";
import { formatRupiahSingkat } from "../lib/formatters";

interface MapSpatialCockpitHUDProps {
  investments: Investment[];
  districts: District[];
  selectedDistrictId: string | null;
  onSelectDistrict?: (districtId: string | null) => void;
  isDarkMode: boolean;
  panelOpacity?: number;
  onSetPanelOpacity?: (opacity: number) => void;
  className?: string;
}

export default function MapSpatialCockpitHUD({
  investments = [],
  districts = [],
  selectedDistrictId,
  onSelectDistrict,
  isDarkMode,
  panelOpacity,
  onSetPanelOpacity,
  className = "",
}: MapSpatialCockpitHUDProps) {
  const { t } = useTranslation();

  // Internal states
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isUltraTransparent, setIsUltraTransparent] = useState<boolean>(true);
  const [activeMetricMode, setActiveMetricMode] = useState<"SECTOR" | "DISTRICT">("SECTOR");
  const [chartViewMode, setChartViewMode] = useState<"ALL" | "PIE" | "BAR">("ALL");

  // Effective opacity calculation
  const currentOpacity = useMemo(() => {
    if (panelOpacity !== undefined) return panelOpacity;
    return isUltraTransparent ? 20 : 80;
  }, [panelOpacity, isUltraTransparent]);

  const effectiveAlpha = Math.max(12, Math.min(95, currentOpacity)) / 100;

  // Toggle transparency
  const toggleTransparency = () => {
    const nextVal = !isUltraTransparent;
    setIsUltraTransparent(nextVal);
    if (onSetPanelOpacity) {
      onSetPanelOpacity(nextVal ? 20 : 80);
    }
  };

  // 1. Calculate Real Sector Data (Strict Zero-Dummy Policy)
  const sectorData = useMemo(() => {
    if (!investments || investments.length === 0) return [];

    const map: Record<string, { name: string; value: number; count: number }> = {};
    investments.forEach((inv) => {
      const sec = inv.sector || "Lainnya";
      if (!map[sec]) {
        map[sec] = { name: sec, value: 0, count: 0 };
      }
      map[sec].value += Number(inv.investmentValue) || 0;
      map[sec].count += 1;
    });

    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [investments]);

  // 2. Calculate Real District Distribution Data (Strict Zero-Dummy Policy)
  const districtData = useMemo(() => {
    if (!investments || investments.length === 0) return [];

    const map: Record<string, { id: string; name: string; value: number; count: number }> = {};
    
    // Group investments by district
    investments.forEach((inv) => {
      const dId = inv.districtId || "unknown";
      const districtObj = districts.find((d) => String(d.id) === String(dId) || d.name.toLowerCase() === (inv.locationName || "").toLowerCase());
      const dName = districtObj ? districtObj.name : (inv.locationName || "Kabupaten Luwu");

      if (!map[dId]) {
        map[dId] = { id: dId, name: dName, value: 0, count: 0 };
      }
      map[dId].value += Number(inv.investmentValue) || 0;
      map[dId].count += 1;
    });

    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [investments, districts]);

  // 3. Calculate Real Readiness Percentage Data per District (0-100%)
  const readinessData = useMemo(() => {
    if (!investments || investments.length === 0) return [];

    const readinessMap: Record<string, { id: string; name: string; totalScore: number; count: number }> = {};

    investments.forEach((inv) => {
      const dId = inv.districtId || "unknown";
      const districtObj = districts.find((d) => String(d.id) === String(dId));
      const dName = districtObj ? districtObj.name : "Kecamatan";

      // Calculate investment readiness
      let score = 50;
      if (typeof (inv as any).readinessPercentage === "number") {
        score = (inv as any).readinessPercentage;
      } else {
        const st = (inv.status || "").toLowerCase();
        if (st.includes("realisasi") || st.includes("operasional")) score = 100;
        else if (st.includes("konstruksi")) score = 75;
        else if (st.includes("publish") || st.includes("izin")) score = 60;
        else if (st.includes("review") || st.includes("penjajakan")) score = 40;
        else if (st.includes("draft") || st.includes("rencana")) score = 20;
      }

      if (!readinessMap[dId]) {
        readinessMap[dId] = { id: dId, name: dName, totalScore: 0, count: 0 };
      }
      readinessMap[dId].totalScore += score;
      readinessMap[dId].count += 1;
    });

    return Object.values(readinessMap)
      .map((item) => ({
        id: item.id,
        name: item.name,
        readiness: Math.round(item.totalScore / (item.count || 1)),
        projectCount: item.count,
      }))
      .sort((a, b) => b.readiness - a.readiness)
      .slice(0, 8); // Top 8 active districts
  }, [investments, districts]);

  // Total investment volume
  const totalInvestmentVolume = useMemo(() => {
    return investments.reduce((sum, inv) => sum + (Number(inv.investmentValue) || 0), 0);
  }, [investments]);

  // Color palette for district slices
  const DISTRICT_PALETTE = [
    "#10b981", "#06b6d4", "#6366f1", "#f59e0b",
    "#ec4899", "#8b5cf6", "#14b8a6", "#f97316"
  ];

  // Theme-aware tokens
  const textTitle = isDarkMode ? "text-white font-bold" : "text-slate-950 font-black";
  const textSub = isDarkMode ? "text-slate-300 font-medium" : "text-slate-850 font-extrabold";
  const textValue = isDarkMode ? "text-emerald-400 font-bold font-mono" : "text-emerald-700 font-black font-mono";
  const axisColor = isDarkMode ? "#94a3b8" : "#0f172a";

  const currentPieData = activeMetricMode === "SECTOR" ? sectorData : districtData;

  // Selected district info
  const selectedDistrictName = useMemo(() => {
    if (!selectedDistrictId) return null;
    const d = districts.find((item) => String(item.id) === String(selectedDistrictId));
    return d ? d.name : null;
  }, [selectedDistrictId, districts]);

  return (
    <div
      className={`font-sans select-none pointer-events-auto transition-all duration-300 ${className}`}
    >
      <div
        style={{
          backgroundColor: isDarkMode
            ? `rgba(2, 6, 23, ${effectiveAlpha})`
            : `rgba(255, 255, 255, ${Math.min(effectiveAlpha + 0.15, 0.95)})`,
          backdropFilter: `blur(${isUltraTransparent ? 3 : 8}px)`,
        }}
        className={`border shadow-2xl rounded-2xl md:rounded-3xl transition-all duration-300 relative overflow-hidden ${
          isDarkMode
            ? "border-white/15 text-slate-100 shadow-black/80"
            : "border-slate-900/20 text-slate-950 shadow-slate-900/15"
        } ${isMinimized ? "p-2 px-3" : "p-3 sm:p-4 max-w-4xl"}`}
      >
        {/* Glow ambient background in dark mode */}
        {isDarkMode && (
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        )}

        {/* ── HEADER BAR ── */}
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                LIVE HUD
              </span>
            </div>

            <div className="flex flex-col">
              <h4 className={`text-xs sm:text-sm tracking-tight flex items-center gap-1.5 ${textTitle}`}>
                <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Cockpit Analitik Spasial</span>
                {selectedDistrictName && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                    {selectedDistrictName}
                  </span>
                )}
              </h4>
              {!isMinimized && (
                <span className={`text-[10px] font-mono ${textSub}`}>
                  {investments.length} Proyek Terdata • Total:{" "}
                  <strong className={textValue}>{formatRupiahSingkat(totalInvestmentVolume)}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Action & Toggle Controls */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Quick-Toggle: Tembus vs Glass */}
            <button
              type="button"
              onClick={toggleTransparency}
              className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                isUltraTransparent
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40"
                  : isDarkMode
                  ? "bg-slate-800/80 text-slate-200 border-slate-700 hover:text-white"
                  : "bg-slate-100 text-slate-800 border-slate-300 hover:text-slate-950"
              }`}
              title={isUltraTransparent ? "Beralih ke Kaca Pekat" : "Beralih ke Tembus Pandang Peta"}
            >
              {isUltraTransparent ? (
                <>
                  <Eye className="w-3 h-3 text-emerald-500" />
                  <span className="hidden sm:inline">Tembus</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3 h-3" />
                  <span className="hidden sm:inline">Kaca</span>
                </>
              )}
            </button>

            {/* Minimize / Expand Toggle */}
            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                isDarkMode
                  ? "bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700"
                  : "bg-slate-100 text-slate-800 border-slate-300 hover:text-slate-950 hover:bg-slate-200"
              }`}
              title={isMinimized ? "Perluas HUD Analitik" : "Kecilkan HUD Analitik"}
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ── EXPANDED CHARTS BODY ── */}
        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-3 pt-3 border-t border-slate-200/50 dark:border-white/10"
            >
              {/* Controls bar: Mode Wilayah/Sektor & View Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                {/* Metric Mode Switcher */}
                <div className="flex items-center gap-1 p-0.5 rounded-xl bg-black/10 dark:bg-white/10 border border-slate-300/60 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setActiveMetricMode("SECTOR")}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      activeMetricMode === "SECTOR"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : isDarkMode
                        ? "text-slate-300 hover:text-white"
                        : "text-slate-700 hover:text-slate-950"
                    }`}
                  >
                    Sebaran Sektor
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMetricMode("DISTRICT")}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      activeMetricMode === "DISTRICT"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : isDarkMode
                        ? "text-slate-300 hover:text-white"
                        : "text-slate-700 hover:text-slate-950"
                    }`}
                  >
                    Sebaran Wilayah
                  </button>
                </div>

                {/* View Switcher: Semua, Pie, Bar */}
                <div className="flex items-center gap-1 p-0.5 rounded-xl bg-black/10 dark:bg-white/10 border border-slate-300/60 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setChartViewMode("ALL")}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      chartViewMode === "ALL"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : isDarkMode
                        ? "text-slate-300 hover:text-white"
                        : "text-slate-700 hover:text-slate-950"
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartViewMode("PIE")}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                      chartViewMode === "PIE"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : isDarkMode
                        ? "text-slate-300 hover:text-white"
                        : "text-slate-700 hover:text-slate-950"
                    }`}
                  >
                    <PieIcon className="w-3 h-3" />
                    Pie
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartViewMode("BAR")}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                      chartViewMode === "BAR"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : isDarkMode
                        ? "text-slate-300 hover:text-white"
                        : "text-slate-700 hover:text-slate-950"
                    }`}
                  >
                    <BarChart2 className="w-3 h-3" />
                    Bar
                  </button>
                </div>
              </div>

              {/* ── CHARTS CONTAINER ── */}
              {investments.length === 0 ? (
                /* Honest Empty State per Doktrin Zero Dummy */
                <div className="py-6 px-4 text-center rounded-xl bg-slate-500/5 border border-dashed border-slate-400/30 flex flex-col items-center justify-center gap-2">
                  <Info className="w-6 h-6 text-slate-400" />
                  <p className={`text-xs font-semibold ${textSub}`}>
                    Belum Ada Data Proyek Investasi Terdaftar
                  </p>
                  <span className={`text-[10px] ${isDarkMode ? "text-slate-400" : "text-slate-700"}`}>
                    Sistem beroperasi dengan Doktrin Zero Dummy. Data grafik akan otomatis terisi saat data dimasukkan ke Supabase.
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  {/* CHART 1: PIE CHART (Sektor / Wilayah) */}
                  {(chartViewMode === "ALL" || chartViewMode === "PIE") && (
                    <div className="flex flex-col gap-2 p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                      <div className="flex items-center justify-between px-1">
                        <span className={`text-[11px] font-extrabold uppercase tracking-wider ${textTitle}`}>
                          {activeMetricMode === "SECTOR" ? "Proporsi Sektor" : "Proporsi Wilayah"}
                        </span>
                        <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {currentPieData.length} Entitas
                        </span>
                      </div>

                      <div className="h-36 min-h-[144px] w-full flex items-center justify-between">
                        <div className="h-full w-1/2 min-w-[120px] relative">
                          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <PieChart>
                              <Pie
                                data={currentPieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={32}
                                outerRadius={50}
                                paddingAngle={3}
                                dataKey="value"
                                stroke="none"
                              >
                                {currentPieData.map((entry, idx) => {
                                  const fill =
                                    activeMetricMode === "SECTOR"
                                      ? SECTOR_COLORS[entry.name as SektorInvestasi] || DISTRICT_PALETTE[idx % DISTRICT_PALETTE.length]
                                      : DISTRICT_PALETTE[idx % DISTRICT_PALETTE.length];
                                  return <Cell key={`cell-${idx}`} fill={fill} />;
                                })}
                              </Pie>
                              <Tooltip
                                formatter={(val) => [formatRupiahSingkat(Number(val)), "Nilai Proyek"]}
                                contentStyle={{
                                  background: isDarkMode ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
                                  backdropFilter: "blur(6px)",
                                  border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)"}`,
                                  borderRadius: "10px",
                                  fontSize: "11px",
                                  fontWeight: "bold",
                                  color: isDarkMode ? "#ffffff" : "#0f172a",
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Pie Legend List */}
                        <div className="w-1/2 flex flex-col gap-1 pl-1 max-h-32 overflow-y-auto custom-scrollbar">
                          {currentPieData.slice(0, 5).map((item, idx) => {
                            const fill =
                              activeMetricMode === "SECTOR"
                                ? SECTOR_COLORS[item.name as SektorInvestasi] || DISTRICT_PALETTE[idx % DISTRICT_PALETTE.length]
                                : DISTRICT_PALETTE[idx % DISTRICT_PALETTE.length];
                            const percent =
                              totalInvestmentVolume > 0
                                ? Math.round((item.value / totalInvestmentVolume) * 100)
                                : 0;

                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-[10px] leading-tight pr-1"
                              >
                                <div className="flex items-center gap-1.5 truncate max-w-[100px]">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: fill }}
                                  />
                                  <span className={`truncate font-medium ${isDarkMode ? "text-slate-200" : "text-slate-900"}`}>
                                    {item.name}
                                  </span>
                                </div>
                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                  {percent}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CHART 2: BAR CHART (Kesiapan & Realisasi 0-100%) */}
                  {(chartViewMode === "ALL" || chartViewMode === "BAR") && (
                    <div className="flex flex-col gap-2 p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                      <div className="flex items-center justify-between px-1">
                        <span className={`text-[11px] font-extrabold uppercase tracking-wider ${textTitle}`}>
                          Kesiapan & Realisasi
                        </span>
                        <span className="text-[9px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                          Skala 0–100%
                        </span>
                      </div>

                      <div className="h-36 min-h-[144px] w-full">
                        {readinessData.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-xs text-slate-500">
                            Belum ada tahapan terdata
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <BarChart
                              data={readinessData}
                              margin={{ top: 12, right: 8, left: -22, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="hudBarGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                                  <stop offset="100%" stopColor="#059669" stopOpacity={0.4} />
                                </linearGradient>
                              </defs>
                              <XAxis
                                dataKey="name"
                                tick={{ fill: axisColor, fontSize: 9, fontWeight: 700 }}
                                tickLine={false}
                                axisLine={{ stroke: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.15)" }}
                                interval={0}
                                tickFormatter={(val) => (val && val.length > 7 ? val.slice(0, 6) + "…" : val)}
                              />
                              <YAxis
                                domain={[0, 100]}
                                ticks={[0, 50, 100]}
                                tick={{ fill: axisColor, fontSize: 9, fontWeight: 700 }}
                                tickLine={false}
                                axisLine={false}
                              />
                              <Tooltip
                                formatter={(val) => [`${val}%`, "Tingkat Kesiapan"]}
                                labelFormatter={(label) => `Kecamatan ${label}`}
                                contentStyle={{
                                  background: isDarkMode ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
                                  backdropFilter: "blur(6px)",
                                  border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)"}`,
                                  borderRadius: "10px",
                                  fontSize: "11px",
                                  fontWeight: "bold",
                                  color: isDarkMode ? "#ffffff" : "#0f172a",
                                }}
                              />
                              <Bar
                                dataKey="readiness"
                                fill="url(#hudBarGrad)"
                                radius={[4, 4, 0, 0]}
                                label={{
                                  position: "top",
                                  fill: axisColor,
                                  fontSize: 8,
                                  fontWeight: 800,
                                  formatter: (v: any) => `${v}%`,
                                }}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
