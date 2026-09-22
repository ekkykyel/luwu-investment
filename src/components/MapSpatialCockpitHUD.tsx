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
            ? `rgba(2, 6, 23, ${Math.min(effectiveAlpha, 0.45)})`
            : `rgba(255, 255, 255, ${Math.min(effectiveAlpha + 0.1, 0.65)})`,
          backdropFilter: `blur(${isUltraTransparent ? 2 : 6}px)`,
        }}
        className={`border shadow-xl rounded-xl sm:rounded-2xl transition-all duration-300 relative overflow-hidden ${
          isDarkMode
            ? "border-white/15 text-slate-100 shadow-black/80"
            : "border-slate-900/15 text-slate-950 shadow-slate-900/15"
        } ${isMinimized ? "p-1.5 px-2.5" : "p-2 sm:p-3 w-full max-w-[96vw] sm:max-w-xl md:max-w-3xl lg:max-w-4xl"}`}
      >
        {/* Glow ambient background in dark mode */}
        {isDarkMode && (
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        )}

        {/* ── COMPACT HEADER BAR ── */}
        <div className="flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                LIVE HUD
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 truncate">
              <h4 className={`text-[11px] sm:text-xs tracking-tight flex items-center gap-1 truncate ${textTitle}`}>
                <Sparkles className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="truncate">Cockpit Spasial</span>
                {selectedDistrictName && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 truncate">
                    {selectedDistrictName}
                  </span>
                )}
              </h4>
              {!isMinimized && (
                <span className={`hidden sm:inline text-[9px] font-mono truncate ${textSub}`}>
                  • {investments.length} Proyek • Total:{" "}
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
              className={`flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${
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
                  <Eye className="w-2.5 h-2.5 text-emerald-500" />
                  <span className="hidden xs:inline">Tembus</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-2.5 h-2.5" />
                  <span className="hidden xs:inline">Kaca</span>
                </>
              )}
            </button>

            {/* Minimize / Expand Toggle */}
            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className={`p-1 rounded-lg border transition-all cursor-pointer ${
                isDarkMode
                  ? "bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white"
                  : "bg-slate-100 text-slate-800 border-slate-300 hover:text-slate-950"
              }`}
              title={isMinimized ? "Perluas HUD Analitik" : "Kecilkan HUD Analitik"}
            >
              {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* ── EXPANDED COMPACT CHARTS BODY (HORIZONTAL LAYOUT) ── */}
        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-1.5 pt-1.5 border-t border-slate-200/40 dark:border-white/10"
            >
              {/* Controls bar: Metric Mode & View Switcher (Slim) */}
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                {/* Metric Mode Switcher */}
                <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-black/10 dark:bg-white/10 border border-slate-300/40 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setActiveMetricMode("SECTOR")}
                    className={`px-2 py-0.5 text-[9px] sm:text-[10px] font-bold rounded transition-all cursor-pointer ${
                      activeMetricMode === "SECTOR"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : isDarkMode
                        ? "text-slate-300 hover:text-white"
                        : "text-slate-700 hover:text-slate-950"
                    }`}
                  >
                    Sektor
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMetricMode("DISTRICT")}
                    className={`px-2 py-0.5 text-[9px] sm:text-[10px] font-bold rounded transition-all cursor-pointer ${
                      activeMetricMode === "DISTRICT"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : isDarkMode
                        ? "text-slate-300 hover:text-white"
                        : "text-slate-700 hover:text-slate-950"
                    }`}
                  >
                    Wilayah
                  </button>
                </div>

                {/* View Switcher: Semua, Pie, Bar */}
                <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-black/10 dark:bg-white/10 border border-slate-300/40 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setChartViewMode("ALL")}
                    className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition-all cursor-pointer ${
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
                    className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition-all flex items-center gap-0.5 cursor-pointer ${
                      chartViewMode === "PIE"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : isDarkMode
                        ? "text-slate-300 hover:text-white"
                        : "text-slate-700 hover:text-slate-950"
                    }`}
                  >
                    <PieIcon className="w-2.5 h-2.5" />
                    <span>Pie</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartViewMode("BAR")}
                    className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition-all flex items-center gap-0.5 cursor-pointer ${
                      chartViewMode === "BAR"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : isDarkMode
                        ? "text-slate-300 hover:text-white"
                        : "text-slate-700 hover:text-slate-950"
                    }`}
                  >
                    <BarChart2 className="w-2.5 h-2.5" />
                    <span>Bar</span>
                  </button>
                </div>
              </div>

              {/* ── CHARTS CONTAINER (HORIZONTAL ON BOTH MOBILE AND DESKTOP) ── */}
              {investments.length === 0 ? (
                /* Honest Empty State per Doktrin Zero Dummy */
                <div className="py-3 px-3 text-center rounded-lg bg-slate-500/5 border border-dashed border-slate-400/30 flex flex-col items-center justify-center gap-1">
                  <Info className="w-4 h-4 text-slate-400" />
                  <p className={`text-[10px] font-semibold ${textSub}`}>
                    Belum Ada Data Proyek Investasi Terdaftar
                  </p>
                  <span className={`text-[8px] ${isDarkMode ? "text-slate-400" : "text-slate-700"}`}>
                    Sistem beroperasi dengan Doktrin Zero Dummy. Data grafik akan otomatis terisi saat data dimasukkan ke Supabase.
                  </span>
                </div>
              ) : (
                <div className={`grid gap-2 items-stretch ${
                  chartViewMode === "ALL" ? "grid-cols-2" : "grid-cols-1"
                }`}>
                  {/* CHART 1: PIE CHART (Sektor / Wilayah) */}
                  {(chartViewMode === "ALL" || chartViewMode === "PIE") && (
                    <div className="flex flex-col gap-1 p-1.5 sm:p-2 rounded-xl bg-transparent border border-white/10 dark:border-white/5 backdrop-blur-none">
                      <div className="flex items-center justify-between px-0.5">
                        <span className={`text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider ${textTitle}`}>
                          {activeMetricMode === "SECTOR" ? "Proporsi Sektor" : "Proporsi Wilayah"}
                        </span>
                        <span className="text-[8px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {currentPieData.length} Data
                        </span>
                      </div>

                      <div className="h-22 sm:h-26 min-h-[88px] sm:min-h-[104px] w-full flex items-center justify-between">
                        <div className="h-full w-1/2 min-w-[70px] sm:min-w-[90px] relative">
                          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <PieChart>
                              <Pie
                                data={currentPieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={18}
                                outerRadius={34}
                                paddingAngle={2}
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
                                formatter={(val) => [formatRupiahSingkat(Number(val)), "Nilai"]}
                                contentStyle={{
                                  background: isDarkMode ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
                                  backdropFilter: "blur(6px)",
                                  border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)"}`,
                                  borderRadius: "8px",
                                  fontSize: "9px",
                                  fontWeight: "bold",
                                  color: isDarkMode ? "#ffffff" : "#0f172a",
                                  padding: "4px 8px",
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Pie Legend List (Slim) */}
                        <div className="w-1/2 flex flex-col gap-0.5 pl-1 max-h-22 sm:max-h-26 overflow-y-auto custom-scrollbar">
                          {currentPieData.slice(0, 4).map((item, idx) => {
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
                                className="flex items-center justify-between text-[8px] sm:text-[9px] leading-tight pr-0.5"
                              >
                                <div className="flex items-center gap-1 truncate max-w-[70px] sm:max-w-[85px]">
                                  <span
                                    className="w-1.5 h-1.5 rounded-full shrink-0"
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
                    <div className="flex flex-col gap-1 p-1.5 sm:p-2 rounded-xl bg-transparent border border-white/10 dark:border-white/5 backdrop-blur-none">
                      <div className="flex items-center justify-between px-0.5">
                        <span className={`text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider ${textTitle}`}>
                          Kesiapan & Realisasi
                        </span>
                        <span className="text-[8px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                          0–100%
                        </span>
                      </div>

                      <div className="h-22 sm:h-26 min-h-[88px] sm:min-h-[104px] w-full">
                        {readinessData.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-[10px] text-slate-500">
                            Belum ada tahapan terdata
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <BarChart
                              data={readinessData.slice(0, 5)}
                              margin={{ top: 8, right: 4, left: -28, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="hudBarGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                                  <stop offset="100%" stopColor="#059669" stopOpacity={0.4} />
                                </linearGradient>
                              </defs>
                              <XAxis
                                dataKey="name"
                                tick={{ fill: axisColor, fontSize: 8, fontWeight: 700 }}
                                tickLine={false}
                                axisLine={{ stroke: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.15)" }}
                                interval={0}
                                tickFormatter={(val) => (val && val.length > 5 ? val.slice(0, 4) + "…" : val)}
                              />
                              <YAxis
                                domain={[0, 100]}
                                ticks={[0, 50, 100]}
                                tick={{ fill: axisColor, fontSize: 7, fontWeight: 700 }}
                                tickLine={false}
                                axisLine={false}
                              />
                              <Tooltip
                                formatter={(val) => [`${val}%`, "Kesiapan"]}
                                labelFormatter={(label) => `Kec. ${label}`}
                                contentStyle={{
                                  background: isDarkMode ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
                                  backdropFilter: "blur(6px)",
                                  border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)"}`,
                                  borderRadius: "8px",
                                  fontSize: "9px",
                                  fontWeight: "bold",
                                  color: isDarkMode ? "#ffffff" : "#0f172a",
                                  padding: "4px 8px",
                                }}
                              />
                              <Bar
                                dataKey="readiness"
                                fill="url(#hudBarGrad)"
                                radius={[3, 3, 0, 0]}
                                label={{
                                  position: "top",
                                  fill: axisColor,
                                  fontSize: 7,
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
