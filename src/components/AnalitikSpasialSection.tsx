import React from "react";
import { useTranslation } from "react-i18next";
import {
  Activity,
  TrendingUp,
  PieChart as PieChartIcon,
  Globe,
  MapPin,
  Target,
  Layers,
  Users,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

export interface AnalitikSpasialSectionProps {
  isDark: boolean;
  totalInvestmentValue: number;
  sectorData: Array<{ name: string; value: number }>;
  COLORS: string[];
  districtData: Array<{ name: string; Area: number }>;
  commodityByDistrictData: { data: any[]; sectors: string[] };
  spatialDistributionText: string;
  formatRupiah: (val: number) => string;
  cardBg: string;
  textMuted: string;
}

export const AnalitikSpasialSection: React.FC<AnalitikSpasialSectionProps> = ({
  isDark,
  totalInvestmentValue,
  sectorData,
  COLORS,
  districtData,
  commodityByDistrictData,
  spatialDistributionText,
  formatRupiah,
  cardBg,
  textMuted,
}) => {
  const { t } = useTranslation();

  const computedCardBg = isDark
    ? "bg-slate-900/60 backdrop-blur-xl border-slate-800/80 shadow-xl shadow-black/20 hover:border-emerald-500/40"
    : "bg-white/85 backdrop-blur-xl border-slate-200/80 shadow-lg shadow-slate-200/50 hover:border-emerald-400 hover:shadow-xl";

  const axisTextColor = isDark ? "#94a3b8" : "#475569";

  return (
    <>
      {/* 4. DATA SPASIAL & GRAFIK MODERN */}
      <div className={`w-full h-16 ${isDark ? 'bg-[#0B0F19]' : 'bg-white'} relative overflow-hidden pointer-events-none`}>
        <svg viewBox="0 0 1440 64" className="absolute bottom-0 w-full" preserveAspectRatio="none">
          <path
            d="M0,0 C360,64 1080,0 1440,64 L1440,64 L0,64 Z"
            fill={isDark ? '#0f172a' : '#f8fafc'}
          />
        </svg>
      </div>
      <div
        id="analitik-spasial-section"
        className={`pt-16 pb-20 lg:pt-20 lg:pb-24 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}
      >
        <div className="container max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span
              className={`inline-flex items-center gap-2 px-4 py-1.5 min-h-[44px] rounded-full text-xs font-normal uppercase tracking-wider mb-4 border opacity-0 animate-fade-in-up ${isDark ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-blue-50 text-blue-700 border-blue-200"}`}
              style={{ animationDelay: '50ms' }}
            >
              <Activity size={14} /> Sinkronisasi Peta Spasial Real-time
            </span>
            <h2 className="text-3xl lg:text-5xl font-medium mb-3 opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              {t("sections.analitik.title")}
            </h2>
            <div className="h-1 w-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mb-6 mx-auto opacity-0 animate-fade-in-up" style={{ animationDelay: '250ms' }}></div>
            <p className={`text-lg leading-relaxed ${textMuted} opacity-0 animate-fade-in-up`} style={{ animationDelay: '350ms' }}>
              {t("sections.analitik.subtitle")}
            </p>
          </div>

          {/* SVG Gradients for Charts */}
          <svg className="absolute w-0 h-0 pointer-events-none invisible" width="0" height="0">
            <defs>
              {/* Trend Chart Gradient */}
              <linearGradient id="gradTrendNilai" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>

              {/* Target vs Realisasi Progress Ring Gradient */}
              <linearGradient id="gradRealisasiNeon" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>

              {/* Pie Chart Sector Gradients */}
              <linearGradient id="gradSektorPariwisata" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1e40af" />
              </linearGradient>
              <linearGradient id="gradSektorPertanian" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#065f46" />
              </linearGradient>
              <linearGradient id="gradSektorKelautan" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#92400e" />
              </linearGradient>

              {/* Spasial Bar Chart Gradient */}
              <linearGradient id="gradSpasialBar" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#059669" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.95} />
              </linearGradient>
            </defs>
          </svg>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {/* CHART 1: AREA & PERTUMBUHAN */}
            <div
              className={`col-span-1 md:col-span-2 p-6 rounded-3xl border flex flex-col h-full min-h-[380px] justify-between relative overflow-hidden transition-all duration-300 hover:border-emerald-500/30 group ${computedCardBg}`}
            >
              {/* Glowing background hint */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-400/5 blur-3xl pointer-events-none" />

              <div className="flex items-center gap-3 mb-4 border-b pb-4 border-slate-500/10">
                <div
                  className={`p-3 rounded-2xl ${isDark ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-blue-50 text-blue-600 border border-blue-100"}`}
                >
                  <TrendingUp size={20} className="group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="flex-1 flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-slate-850 dark:text-slate-100 flex items-center gap-2">
                      {t("charts.trendTitle")}
                    </h3>
                    <p
                      className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}
                    >
                      {t("charts.last12Months")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 min-h-[44px] rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold tracking-widest uppercase">{t("landing.live", "Live")}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 w-full relative min-h-[250px] mt-4">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart
                    data={[
                      { name: "Aug", value: 1.2 }, { name: "Sep", value: 1.5 }, { name: "Oct", value: 1.4 },
                      { name: "Nov", value: 2.1 }, { name: "Dec", value: 2.8 }, { name: "Jan", value: 3.2 },
                      { name: "Feb", value: 3.8 }, { name: "Mar", value: 4.5 }, { name: "Apr", value: 4.8 },
                      { name: "May", value: 5.2 }, { name: "Jun", value: 5.5 }, { name: "Jul", value: 5.8 }
                    ]}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      stroke={isDark ? "rgba(148, 163, 184, 0.05)" : "rgba(148, 163, 184, 0.12)"}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      stroke={isDark ? "#334155" : "#cbd5e1"}
                      tick={{ fill: axisTextColor, fontSize: 12, fontWeight: 500 }}
                      tickMargin={10}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      stroke={isDark ? "#334155" : "#cbd5e1"}
                      tick={{ fill: axisTextColor, fontSize: 12, fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
                        backdropFilter: "blur(12px)",
                        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(15, 23, 42, 0.08)"}`,
                        borderRadius: "16px",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                      }}
                      itemStyle={{ color: isDark ? "#f8fafc" : "#1e293b", fontSize: "12px" }}
                      labelStyle={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: "600" }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: "11px", marginTop: "10px" }}
                    />
                    <Area
                      type="monotone"
                      name={t("charts.accumulatedCapital")}
                      dataKey="value"
                      stroke={isDark ? "#10b981" : "#059669"}
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#gradTrendNilai)"
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 0, fill: "#10b981" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CHART 2: PIE KOMPOSISI */}
            <div
              className={`col-span-1 p-6 rounded-3xl border flex flex-col h-[400px] justify-between relative overflow-hidden transition-all duration-300 hover:border-emerald-500/30 group ${computedCardBg}`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-400/5 blur-3xl pointer-events-none" />

              <div className="flex items-center gap-3 mb-4 border-b pb-4 border-slate-500/10">
                <div
                  className={`p-3 rounded-2xl ${isDark ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-indigo-50 text-indigo-600 border border-indigo-100"}`}
                >
                  <PieChartIcon size={20} className="group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-slate-850 dark:text-slate-100">
                    {t("charts.compositionTitle")}
                  </h3>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}
                  >
                    {t("charts.distributionValue")}
                  </p>
                </div>
              </div>

              <div className="h-64 w-full relative flex items-center justify-center">
                {sectorData.length > 0 ? (
                  <>
                    {/* Central Value */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                      <span className={`text-[9px] uppercase font-bold tracking-widest ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        Total Realisasi
                      </span>
                      <span className={`text-base font-bold font-mono tracking-tight ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                        {totalInvestmentValue >= 1e12 
                          ? `Rp ${(totalInvestmentValue / 1e12).toFixed(2)} T` 
                          : totalInvestmentValue >= 1e9 
                            ? `Rp ${(totalInvestmentValue / 1e9).toFixed(1)} M` 
                            : formatRupiah(totalInvestmentValue)}
                      </span>
                    </div>

                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie
                          data={sectorData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={4}
                          cornerRadius={6}
                          dataKey="value"
                        >
                          {sectorData.map((entry, index) => {
                            let fillVal = COLORS[index % COLORS.length];
                            if (entry.name === "Pariwisata") fillVal = "url(#gradSektorPariwisata)";
                            else if (entry.name === "Pertanian") fillVal = "url(#gradSektorPertanian)";
                            else if (entry.name === "Kelautan dan Perikanan") fillVal = "url(#gradSektorKelautan)";
                            return (
                              <Cell
                                key={`cell-${index}`}
                                fill={fillVal}
                                className="stroke-transparent hover:opacity-90 cursor-pointer transition-opacity duration-300"
                              />
                            );
                          })}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            formatRupiah(value), 
                            name === 'Kelautan dan Perikanan' 
                              ? t('charts.sectorMarine') 
                              : name === 'Pariwisata' 
                                ? t('charts.sectorTourism') 
                                : name === 'Pertanian' 
                                  ? t('charts.sectorAgriculture') 
                                  : name
                          ]}
                          contentStyle={{
                            background: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
                            backdropFilter: "blur(12px)",
                            border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(15, 23, 42, 0.08)"}`,
                            borderRadius: "16px",
                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                          }}
                        />
                        <Legend
                          formatter={(value: string) => (
                            <span className="text-slate-700 dark:text-slate-350 font-medium text-xs">
                              {value === 'Kelautan dan Perikanan' 
                                ? t('charts.sectorMarine') 
                                : value === 'Pariwisata' 
                                  ? t('charts.sectorTourism') 
                                  : value === 'Pertanian' 
                                    ? t('charts.sectorAgriculture') 
                                    : value}
                            </span>
                          )}
                          iconType="circle"
                          layout="horizontal"
                          verticalAlign="bottom"
                          align="center"
                          wrapperStyle={{
                            fontSize: "10px",
                            paddingTop: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <Layers size={40} className="mb-3 opacity-20" />
                    <p className="text-xs">{t("landing.dataSpatialNotAvailable", "Data komposisi spasial belum tersedia")}</p>
                  </div>
                )}
              </div>
            </div>

            {/* NEW CHART: KOMPOSISI SUMBER MODAL */}
            <div
              className={`col-span-1 p-6 rounded-3xl border flex flex-col h-[400px] justify-between relative overflow-hidden transition-all duration-300 hover:border-emerald-500/30 group ${computedCardBg}`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 dark:bg-amber-400/5 blur-3xl pointer-events-none" />

              <div className="flex items-center gap-3 mb-4 border-b pb-4 border-slate-500/10">
                <div
                  className={`p-3 rounded-2xl ${isDark ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-amber-50 text-amber-600 border border-amber-100"}`}
                >
                  <Globe size={20} className="group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-slate-850 dark:text-slate-100">
                    {t("chartsExtra.capitalSource", "Sumber Modal")}
                  </h3>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}
                  >
                    {t("chartsExtra.pmaVsPmdn", "PMA vs PMDN")}
                  </p>
                </div>
              </div>

              <div className="h-64 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'PMDN', value: 85, fill: '#10b981' },
                        { name: 'PMA', value: 15, fill: '#f59e0b' }
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={4}
                      cornerRadius={6}
                      stroke="none"
                    >
                      <Cell key="cell-0" fill="#10b981" />
                      <Cell key="cell-1" fill="#f59e0b" />
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        background: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
                        backdropFilter: "blur(12px)",
                        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(15, 23, 42, 0.08)"}`,
                        borderRadius: "16px",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                      }}
                      formatter={(value: number) => [`${value}%`, t("chartsExtra.percentage", "Persentase")]}
                    />
                    <Legend 
                      iconType="circle" 
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{ fontSize: "10px", paddingTop: "12px" }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CHART 3: TOP KECAMATAN TERLUAS */}
            <div
              className={`col-span-1 md:col-span-2 p-6 rounded-3xl border flex flex-col h-[400px] justify-between relative overflow-hidden transition-all duration-300 hover:border-emerald-500/30 group ${computedCardBg}`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-400/5 blur-3xl pointer-events-none" />

              <div className="flex items-center gap-3 mb-4 border-b pb-4 border-slate-500/10">
                <div
                  className={`p-3 rounded-2xl ${isDark ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}
                >
                  <MapPin size={20} className="group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-slate-850 dark:text-slate-100">
                    {t("charts.top5Title")}
                  </h3>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}
                  >
                    {t("charts.certifiedArea")}
                  </p>
                </div>
              </div>

              <div className="h-64 w-full relative flex items-center justify-center">
                {districtData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart
                      data={districtData}
                      margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
                      layout="vertical"
                    >
                      <CartesianGrid
                        strokeDasharray="4 4"
                        stroke={isDark ? "rgba(148, 163, 184, 0.05)" : "rgba(148, 163, 184, 0.12)"}
                        horizontal={true}
                        vertical={false}
                      />
                      <XAxis
                        type="number"
                        stroke={isDark ? "#334155" : "#cbd5e1"}
                        tick={{ fill: axisTextColor, fontSize: 12, fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke={isDark ? "#334155" : "#cbd5e1"}
                        tick={{ fill: axisTextColor, fontSize: 12, fontWeight: 500 }}
                        tickMargin={10}
                        axisLine={false}
                        tickLine={false}
                        width={110}
                      />
                      <Tooltip
                        cursor={{ fill: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}
                        contentStyle={{
                          background: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
                          backdropFilter: "blur(12px)",
                          border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(15, 23, 42, 0.08)"}`,
                          borderRadius: "16px",
                          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                        }}
                      />
                      <Bar
                        dataKey="Area"
                        fill="url(#gradSpasialBar)"
                        radius={[0, 8, 8, 0]}
                        barSize={20}
                        name={t("charts.certifiedArea")}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <MapPin size={40} className="mb-3 opacity-20" />
                    <p className="text-xs">{t("landing.dataAreaNotAvailable", "Data luasan area per area belum tersedia")}</p>
                  </div>
                )}
              </div>
            </div>

            {/* NEW CHART 5: TARGET VS REALISASI */}
            <div
              className={`col-span-1 p-6 rounded-3xl border flex flex-col h-[400px] justify-between relative overflow-hidden transition-all duration-300 hover:border-emerald-500/30 group ${computedCardBg}`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-400/5 blur-3xl pointer-events-none" />

              <div className="flex items-center gap-3 mb-4 border-b pb-4 border-slate-500/10">
                <div
                  className={`p-3 rounded-2xl ${isDark ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}
                >
                  <Target size={20} className="group-hover:scale-110 transition-transform duration-300 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-slate-850 dark:text-slate-100">
                    {t("performance.realizationTitle", "Target & Capaian Investasi")}
                  </h3>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}
                  >
                    {t("performance.fiscalYear", "Tahun Anggaran Berjalan (2026)")}
                  </p>
                </div>
              </div>

              {/* Ring Gauge Chart Container */}
              <div className="h-44 w-full relative flex items-center justify-center">
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                  <span className="text-3xl font-extrabold font-mono tracking-tight text-emerald-400 dark:text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                    {((totalInvestmentValue / 2500000000000) * 100).toFixed(1)}%
                  </span>
                  <span className={`text-[9px] uppercase font-bold tracking-widest ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {t("performance.achievementPercentage", "Capaian Target")}
                  </span>
                </div>

                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: t("performance.realizationData", "Realisasi"), value: totalInvestmentValue },
                        { name: "Sisa Target", value: Math.max(0, 2500000000000 - totalInvestmentValue) }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={0}
                      cornerRadius={6}
                      dataKey="value"
                    >
                      <Cell key="cell-realisasi" fill="url(#gradRealisasiNeon)" className="stroke-transparent" />
                      <Cell key="cell-sisa" fill={isDark ? "rgba(30, 41, 59, 0.4)" : "rgba(226, 232, 240, 0.6)"} className="stroke-transparent" />
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [formatRupiah(value), name]}
                      contentStyle={{
                        background: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
                        backdropFilter: "blur(12px)",
                        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(15, 23, 42, 0.08)"}`,
                        borderRadius: "16px",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Scorecard Table details below */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/60 mt-1">
                <div>
                  <span className={`text-[9px] uppercase tracking-wider block font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    {t("performance.rpjmdTarget", "Target RPJMD")}
                  </span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-blue-500 dark:text-blue-400">
                    Rp 2,50 T
                  </span>
                </div>
                <div>
                  <span className={`text-[9px] uppercase tracking-wider block font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    {t("performance.realizationData", "Realisasi")}
                  </span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-emerald-500 dark:text-emerald-400">
                    {totalInvestmentValue >= 1e12 
                      ? `Rp ${(totalInvestmentValue / 1e12).toFixed(2)} T` 
                      : totalInvestmentValue >= 1e9 
                        ? `Rp ${(totalInvestmentValue / 1e9).toFixed(1)} M` 
                        : formatRupiah(totalInvestmentValue)}
                  </span>
                </div>
              </div>
            </div>

            {/* CHART 4: KOMODITAS PER KECAMATAN */}
            <div
              className={`col-span-1 md:col-span-2 p-6 rounded-3xl border flex flex-col h-[460px] justify-between relative overflow-hidden transition-all duration-300 hover:border-emerald-500/30 group ${computedCardBg}`}
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 dark:bg-amber-400/5 blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b pb-4 border-slate-500/10">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-2xl ${isDark ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-amber-50 text-amber-600 border border-amber-100"}`}
                  >
                    <Layers size={20} className="group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-slate-850 dark:text-slate-100">
                      {t("chartsExtra.commodityAnalysis")}
                    </h3>
                    <p
                      className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}
                    >
                      {t("charts.distributionValue")} (Rp)
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-80 w-full relative flex items-center justify-center">
                {commodityByDistrictData.data.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart
                      data={commodityByDistrictData.data}
                      margin={{ top: 15, right: 15, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid
                        strokeDasharray="4 4"
                        stroke={isDark ? "rgba(148, 163, 184, 0.05)" : "rgba(148, 163, 184, 0.12)"}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        stroke={isDark ? "#334155" : "#cbd5e1"}
                        tick={{ fill: axisTextColor, fontSize: 12, fontWeight: 500 }}
                        tickMargin={10}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        stroke={isDark ? "#334155" : "#cbd5e1"}
                        tick={{ fill: axisTextColor, fontSize: 12, fontWeight: 500 }}
                        tickFormatter={(value) =>
                          value >= 1e9 ? `Rp${(value / 1e9).toFixed(0)}M` : value >= 1e6 ? `Rp${(value / 1e6).toFixed(0)}Jt` : `Rp${value}`
                        }
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}
                        formatter={(value: number, name: string) => [
                          formatRupiah(value),
                          name === 'Kelautan dan Perikanan' 
                            ? t('charts.sectorMarine') 
                            : name === 'Pariwisata' 
                              ? t('charts.sectorTourism') 
                              : name === 'Pertanian' 
                                ? t('charts.sectorAgriculture') 
                                : name,
                        ]}
                        contentStyle={{
                          background: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
                          backdropFilter: "blur(12px)",
                          border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(15, 23, 42, 0.08)"}`,
                          borderRadius: "16px",
                          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                        }}
                      />
                      <Legend
                        formatter={(value: string) => (
                          <span className="text-slate-700 dark:text-slate-350 font-medium text-xs">
                            {value === 'Kelautan dan Perikanan' 
                              ? t('charts.sectorMarine') 
                              : value === 'Pariwisata' 
                                ? t('charts.sectorTourism') 
                                : value === 'Pertanian' 
                                  ? t('charts.sectorAgriculture') 
                                  : value}
                          </span>
                        )}
                        wrapperStyle={{
                          paddingTop: "15px",
                          fontSize: "11px",
                        }}
                      />
                      {commodityByDistrictData.sectors.map(
                        (sector, index) => {
                          let fillVal = COLORS[index % COLORS.length];
                          if (sector === "Pariwisata") fillVal = "url(#gradSektorPariwisata)";
                          else if (sector === "Pertanian") fillVal = "url(#gradSektorPertanian)";
                          else if (sector === "Kelautan dan Perikanan") fillVal = "url(#gradSektorKelautan)";
                          return (
                            <Bar
                              key={sector}
                              dataKey={sector}
                              stackId="a"
                              fill={fillVal}
                              radius={
                                index === commodityByDistrictData.sectors.length - 1
                                  ? [6, 6, 0, 0]
                                  : [0, 0, 0, 0]
                              }
                              barSize={28}
                            />
                          );
                        },
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <Layers size={40} className="mb-3 opacity-20" />
                    <p className="text-xs">{t("landing.dataCommodityNotAvailable", "Data komoditas per kecamatan belum tersedia")}</p>
                  </div>
                )}
              </div>
            </div>

            {/* CHART 5: SERAPAN TENAGA KERJA */}
            <div
              className={`col-span-1 p-6 rounded-3xl border flex flex-col h-[460px] justify-between relative overflow-hidden transition-all duration-300 hover:border-emerald-500/30 group ${computedCardBg}`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-400/5 blur-3xl pointer-events-none" />

              <div className="flex items-center gap-3 mb-4 border-b pb-4 border-slate-500/10">
                <div
                  className={`p-3 rounded-2xl ${isDark ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}
                >
                  <Users size={20} className="group-hover:scale-110 transition-transform duration-300 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold tracking-tight text-slate-850 dark:text-slate-100">
                      {t("labor_absorption_metrics", "Serapan Tenaga Kerja")}
                    </h3>
                    <span className="px-2 py-0.5 min-h-[44px] rounded text-[9px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      Contoh Ilustrasi
                    </span>
                  </div>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}
                  >
                    {t("performance.fiscalYear", "Tahun Anggaran Berjalan (2026)")}
                  </p>
                </div>
              </div>

              {/* Progress & Target Stats in compact layout */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/60 mb-2">
                <div>
                  <span className={`text-[9px] uppercase tracking-wider block font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    {t("total_target_2026", "Target Serapan")}
                  </span>
                  <span className="text-sm font-bold font-mono text-blue-500 dark:text-blue-400">
                    15.000 <span className="text-xs font-sans text-slate-400">{t("landing.people", "Jiwa")}</span>
                  </span>
                </div>
                <div>
                  <span className={`text-[9px] uppercase tracking-wider block font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    {t("realized_absorption", "Realisasi Serapan")}
                  </span>
                  <span className="text-sm font-bold font-mono text-emerald-500 dark:text-emerald-400">
                    4.250 <span className="text-xs font-sans text-slate-400">{t("landing.people", "Jiwa")}</span>
                  </span>
                </div>
              </div>

              {/* Recharts Pie/Donut Chart */}
              <div className="h-44 w-full relative flex items-center justify-center">
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                  <span className="text-2xl font-extrabold font-mono tracking-tight text-emerald-400 dark:text-emerald-400">
                    28.3%
                  </span>
                  <span className={`text-[8px] uppercase font-bold tracking-widest ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {t("performance.achievementPercentage", "Capaian")}
                  </span>
                </div>

                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: t("local_labor", "Tenaga Kerja Lokal (TKL)"), value: 3800 },
                        { name: t("foreign_labor", "Tenaga Kerja Asing (TKA)"), value: 450 }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      cornerRadius={4}
                      dataKey="value"
                    >
                      <Cell key="cell-tkl" fill="#3b82f6" className="stroke-transparent" />
                      <Cell key="cell-tka" fill="#f59e0b" className="stroke-transparent" />
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value.toLocaleString()} Jiwa`]}
                      contentStyle={{
                        background: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
                        backdropFilter: "blur(12px)",
                        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(15, 23, 42, 0.08)"}`,
                        borderRadius: "16px",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend list below */}
              <div className="space-y-2 pt-2 border-t border-slate-500/10">
                <div className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-slate-700 dark:text-slate-350">{t("local_labor", "TKL")}</span>
                  </div>
                  <span className="font-bold font-mono">3.800 <span className="text-[10px] font-sans font-normal text-slate-400">{t("landing.people", "Jiwa")} (89.4%)</span></span>
                </div>
                <div className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-slate-700 dark:text-slate-350">{t("foreign_labor", "TKA")}</span>
                  </div>
                  <span className="font-bold font-mono">450 <span className="text-[10px] font-sans font-normal text-slate-400">{t("landing.people", "Jiwa")} (10.6%)</span></span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-500/5">
                  <span className="text-slate-500 dark:text-slate-400">{t("landing.spatialDistribution", "Persebaran Spasial:")}</span>
                  <span className="font-semibold text-emerald-500 dark:text-emerald-400">{spatialDistributionText}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ui polish: resolve recharts 0x0 dimension warnings

