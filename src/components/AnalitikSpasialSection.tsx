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
  isDark?: boolean;
  totalInvestmentValue?: number;
  sectorData?: Array<{ name: string; value: number }>;
  COLORS?: string[];
  districtData?: Array<{ name: string; Area: number }>;
  commodityByDistrictData?: { data?: any[]; sectors?: string[] };
  spatialDistributionText?: string;
  formatRupiah?: (val: number) => string;
  cardBg?: string;
  textMuted?: string;
  investments?: any[];
}

export const AnalitikSpasialSection: React.FC<AnalitikSpasialSectionProps> = ({
  isDark = true,
  totalInvestmentValue = 0,
  sectorData = [],
  COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"],
  districtData = [],
  commodityByDistrictData = { data: [], sectors: [] },
  spatialDistributionText = "-",
  formatRupiah = (val: number) => `Rp ${(val || 0).toLocaleString("id-ID")}`,
  cardBg = "",
  textMuted = "text-slate-400",
  investments = [],
}) => {
  const { t } = useTranslation();

  const safeSectorData = Array.isArray(sectorData) ? sectorData : [];
  const safeDistrictData = Array.isArray(districtData) ? districtData : [];
  const safeCommodityData = Array.isArray(commodityByDistrictData?.data) ? commodityByDistrictData.data : [];
  const safeCommoditySectors = Array.isArray(commodityByDistrictData?.sectors) ? commodityByDistrictData.sectors : [];
  const safeColors = Array.isArray(COLORS) && COLORS.length > 0 ? COLORS : ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"];
  const safeTotalValue = typeof totalInvestmentValue === "number" && !isNaN(totalInvestmentValue) ? totalInvestmentValue : 0;

  // Dynamic Workforce Calculation from Authentic DB Data
  const safeInvestments = Array.isArray(investments) ? investments : [];
  
  // Agregasi Total Serapan Tenaga Kerja (TKL & TKA)
  let totalTKL = 0;
  let totalTKA = 0;
  
  // Data Triwulan
  const qData = [
    { name: "Triwulan I", local: 0, foreign: 0 },
    { name: "Triwulan II", local: 0, foreign: 0 },
    { name: "Triwulan III", local: 0, foreign: 0 },
    { name: "Triwulan IV (Est)", local: 0, foreign: 0 }
  ];

  const parseNum = (val: any) => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (typeof val === 'string') {
      const cleaned = val.replace(/[^0-9.]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  safeInvestments.forEach(inv => {
    const tkl = parseNum(
      inv.komitmenTenagaLokal ??
      inv.komitmen_tenaga_lokal ??
      inv.penyerapan_tenaga_kerja ??
      inv.penyerapanTenagaKerja ??
      inv.tenagaKerja ??
      inv.tenaga_kerja ??
      inv.tenagaLokal ??
      inv.tenaga_lokal ??
      inv.tkl ??
      0
    );
    const tka = parseNum(
      inv.komitmenTenagaAsing ??
      inv.komitmen_tenaga_asing ??
      inv.tenagaAsing ??
      inv.tenaga_asing ??
      inv.tka ??
      0
    );
    
    totalTKL += tkl;
    totalTKA += tka;

    // Distribute into Quarters based on createdAt / created_at / tanggal_input
    const dateStr = inv.createdAt || (inv as any).created_at || (inv as any).tanggal_input || (inv as any).updatedAt || (inv as any).updated_at;
    if (dateStr) {
      const parsedDate = new Date(dateStr);
      const month = !isNaN(parsedDate.getTime()) ? parsedDate.getMonth() + 1 : 9;
      if (month >= 1 && month <= 3) {
        qData[0].local += tkl;
        qData[0].foreign += tka;
      } else if (month >= 4 && month <= 6) {
        qData[1].local += tkl;
        qData[1].foreign += tka;
      } else if (month >= 7 && month <= 9) {
        qData[2].local += tkl;
        qData[2].foreign += tka;
      } else {
        qData[3].local += tkl;
        qData[3].foreign += tka;
      }
    } else {
       // fallback if no date: put in Triwulan III (September)
       qData[2].local += tkl;
       qData[2].foreign += tka;
    }
  });

  const realisasiSerapan = totalTKL + totalTKA;
  const targetSerapan = 12500; // Keep target fixed as a benchmark, or could be dynamic
  const serapanPercentage = Math.min(100, targetSerapan > 0 ? Math.round((realisasiSerapan / targetSerapan) * 100) : 0);

  const computedCardBg = isDark
    ? "bg-slate-900/60 backdrop-blur-xl border-slate-800/80 shadow-xl shadow-black/20 hover:border-emerald-500/40"
    : "bg-white/85 backdrop-blur-xl border-slate-200/80 shadow-lg shadow-slate-200/50 hover:border-emerald-400 hover:shadow-xl";

  const axisTextColor = isDark ? "#94a3b8" : "#475569";

  return (
    <>
      {/* 4. DATA SPASIAL & GRAFIK MODERN */}
      <div className={`w-full h-8 sm:h-12 ${isDark ? 'bg-[#0B0F19]' : 'bg-white'} relative overflow-hidden pointer-events-none`}>
        <svg viewBox="0 0 1440 64" className="absolute bottom-0 w-full" preserveAspectRatio="none">
          <path
            d="M0,0 C360,64 1080,0 1440,64 L1440,64 L0,64 Z"
            fill={isDark ? '#0f172a' : '#f8fafc'}
          />
        </svg>
      </div>
      <div
        id="analitik-spasial-section"
        className={`pt-6 pb-12 sm:pt-10 sm:pb-16 lg:pt-16 lg:pb-24 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}
      >
        <div className="container max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
            <span
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 min-h-[38px] rounded-full text-[11px] sm:text-xs font-semibold uppercase tracking-wider mb-3.5 border animate-fade-in-up ${isDark ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" : "bg-blue-50 text-blue-700 border-blue-200"}`}
              style={{ animationDelay: '50ms' }}
            >
              <Activity size={13} /> {t("sections.analitik.tag", "Sinkronisasi Peta Spasial Real-time")}
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2.5 leading-tight text-balance break-words animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              {t("sections.analitik.title")}
            </h2>
            <div className="h-1 w-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mb-4 mx-auto animate-fade-in-up" style={{ animationDelay: '250ms' }}></div>
            <p className={`text-xs sm:text-sm md:text-base leading-relaxed max-w-2xl mx-auto ${textMuted} animate-fade-in-up`} style={{ animationDelay: '350ms' }}>
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
              className={`col-span-1 md:col-span-2 p-4 sm:p-6 rounded-3xl border flex flex-col h-full min-h-[380px] justify-between relative overflow-hidden transition-all duration-300 hover:border-emerald-500/30 group ${computedCardBg}`}
            >
              {/* Glowing background hint */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-400/5 blur-3xl pointer-events-none" />

              <div className="flex items-center gap-3 mb-4 border-b pb-4 border-slate-500/10">
                <div
                  className={`p-3 rounded-2xl ${isDark ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20" : "bg-blue-50 text-blue-600 border border-blue-100"}`}
                >
                  <TrendingUp size={20} className="group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="flex-1 flex justify-between items-start">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
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

              <div className="w-full relative mt-4 overflow-x-auto overscroll-x-contain hide-scrollbar min-w-0" style={{ width: "100%", height: 260, minHeight: 260 }}>
                <ResponsiveContainer width="100%" height={260}>
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
                      stroke="#94a3b8"
                      tick={{ fill: axisTextColor, fontSize: 12, fontWeight: 500 }}
                      tickMargin={10}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#94a3b8"
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
              className={`col-span-1 p-4 sm:p-6 rounded-3xl border flex flex-col h-[400px] justify-between relative overflow-hidden transition-all duration-300 hover:border-emerald-500/30 group ${computedCardBg}`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-400/5 blur-3xl pointer-events-none" />

              <div className="flex items-center gap-3 mb-4 border-b pb-4 border-slate-500/10">
                <div
                  className={`p-3 rounded-2xl ${isDark ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20" : "bg-indigo-50 text-indigo-600 border border-indigo-100"}`}
                >
                  <PieChartIcon size={20} className="group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {t("charts.compositionTitle")}
                  </h3>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}
                  >
                    {t("charts.distributionValue")}
                  </p>
                </div>
              </div>

              <div className="w-full relative flex items-center justify-center overflow-x-auto overscroll-x-contain hide-scrollbar min-w-0" style={{ width: "100%", height: 256, minHeight: 256 }}>
                {safeSectorData.length > 0 ? (
                  <>
                    {/* Central Value */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                      <span className={`text-[9px] uppercase font-bold tracking-widest ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                        {t("charts.totalRealization", "Total Realisasi")}
                      </span>
                      <span className={`text-base font-bold font-mono tracking-tight ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                        {safeTotalValue >= 1e12 
                          ? `Rp ${(safeTotalValue / 1e12).toFixed(2)} T` 
                          : safeTotalValue >= 1e9 
                            ? `Rp ${(safeTotalValue / 1e9).toFixed(1)} M` 
                            : formatRupiah(safeTotalValue)}
                      </span>
                    </div>

                    <ResponsiveContainer width="100%" height={256}>
                      <PieChart>
                        <Pie
                          data={safeSectorData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={4}
                          cornerRadius={6}
                          dataKey="value"
                        >
                          {safeSectorData.map((entry, index) => {
                            let fillVal = safeColors[index % safeColors.length];
                            if (entry?.name === "Pariwisata") fillVal = "url(#gradSektorPariwisata)";
                            else if (entry?.name === "Pertanian") fillVal = "url(#gradSektorPertanian)";
                            else if (entry?.name === "Kelautan dan Perikanan") fillVal = "url(#gradSektorKelautan)";
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
                          itemStyle={{ color: isDark ? "#ffffff" : "#0f172a", fontSize: "12px", fontWeight: "600" }}
                          labelStyle={{ color: isDark ? "#94a3b8" : "#475569", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}
                        />
                        <Legend
                          formatter={(value: string) => (
                            <span className="text-slate-800 dark:text-slate-200 dark:text-slate-350 font-medium text-xs">
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
                  <div className="flex flex-col items-center justify-center text-slate-600 dark:text-slate-400">
                    <Layers size={40} className="mb-3 opacity-20" />
                    <p className="text-xs">{t("landing.dataSpatialNotAvailable", "Data komposisi spasial belum tersedia")}</p>
                  </div>
                )}
              </div>
            </div>

            {/* NEW CHART: KOMPOSISI SUMBER MODAL */}
            <div
              className={`col-span-1 p-4 sm:p-6 rounded-3xl border flex flex-col h-[400px] justify-between relative overflow-hidden transition-all duration-300 hover:border-emerald-500/30 group ${computedCardBg}`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 dark:bg-amber-400/5 blur-3xl pointer-events-none" />

              <div className="flex items-center gap-3 mb-4 border-b pb-4 border-slate-500/10">
                <div
                  className={`p-3 rounded-2xl ${isDark ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20" : "bg-amber-50 text-amber-600 border border-amber-100"}`}
                >
                  <Globe size={20} className="group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {t("chartsExtra.capitalSource", "Sumber Modal")}
                  </h3>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}
                  >
                    {t("chartsExtra.pmaVsPmdn", "PMA vs PMDN")}
                  </p>
                </div>
              </div>

              <div className="w-full relative flex items-center justify-center overflow-x-auto overscroll-x-contain hide-scrollbar min-w-0" style={{ width: "100%", height: 256, minHeight: 256 }}>
                <ResponsiveContainer width="100%" height={256}>
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
                      itemStyle={{ color: isDark ? "#ffffff" : "#0f172a", fontSize: "12px", fontWeight: "600" }}
                      labelStyle={{ color: isDark ? "#94a3b8" : "#475569", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}
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
              className={`col-span-1 md:col-span-2 p-4 sm:p-6 rounded-3xl border flex flex-col h-[400px] justify-between relative overflow-hidden transition-all duration-300 hover:border-emerald-500/30 group ${computedCardBg}`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-400/5 blur-3xl pointer-events-none" />

              <div className="flex items-center gap-3 mb-4 border-b pb-4 border-slate-500/10">
                <div
                  className={`p-3 rounded-2xl ${isDark ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}
                >
                  <MapPin size={20} className="group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {t("charts.top5Title")}
                  </h3>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}
                  >
                    {t("charts.certifiedArea")}
                  </p>
                </div>
              </div>

              <div className="w-full relative flex items-center justify-center overflow-x-auto overscroll-x-contain hide-scrollbar min-w-0" style={{ width: "100%", height: 256, minHeight: 256 }}>
                {safeDistrictData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={256}>
                    <BarChart
                      data={safeDistrictData}
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
                        stroke="#94a3b8"
                        tick={{ fill: axisTextColor, fontSize: 12, fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#94a3b8"
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
                        itemStyle={{ color: isDark ? "#ffffff" : "#0f172a", fontSize: "12px", fontWeight: "600" }}
                        labelStyle={{ color: isDark ? "#94a3b8" : "#475569", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}
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
                  <div className="flex flex-col items-center justify-center text-slate-600 dark:text-slate-400">
                    <MapPin size={40} className="mb-3 opacity-20" />
                    <p className="text-xs">{t("landing.dataAreaNotAvailable", "Data luasan area per area belum tersedia")}</p>
                  </div>
                )}
              </div>
            </div>

            {/* NEW CHART 5: TARGET VS REALISASI */}
            <div
              className={`col-span-1 p-4 sm:p-6 rounded-3xl border flex flex-col h-[400px] justify-between relative overflow-hidden transition-all duration-300 hover:border-emerald-500/30 group ${computedCardBg}`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-400/5 blur-3xl pointer-events-none" />

              <div className="flex items-center gap-3 mb-4 border-b pb-4 border-slate-500/10">
                <div
                  className={`p-3 rounded-2xl ${isDark ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}
                >
                  <Target size={20} className="group-hover:scale-110 transition-transform duration-300 text-emerald-700 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
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
              <div className="w-full relative flex items-center justify-center overflow-x-auto overscroll-x-contain hide-scrollbar min-w-0" style={{ width: "100%", height: 176, minHeight: 176 }}>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                  <span className="text-3xl font-extrabold font-mono tracking-tight text-emerald-700 dark:text-emerald-400 dark:text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                    {((safeTotalValue / 2500000000000) * 100).toFixed(1)}%
                  </span>
                  <span className={`text-[9px] uppercase font-bold tracking-widest ${isDark ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>
                    {t("performance.achievementPercentage", "Capaian Target")}
                  </span>
                </div>

                <ResponsiveContainer width="100%" height={176}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: t("performance.realizationData", "Realisasi"), value: safeTotalValue },
                        { name: t("performance.remainingTarget", "Sisa Target"), value: Math.max(0, 2500000000000 - safeTotalValue) }
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
                      itemStyle={{ color: isDark ? "#ffffff" : "#0f172a", fontSize: "12px", fontWeight: "600" }}
                      labelStyle={{ color: isDark ? "#94a3b8" : "#475569", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Scorecard Table details below */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/60 mt-1">
                <div>
                  <span className={`text-[9px] uppercase tracking-wider block font-bold ${isDark ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>
                    {t("performance.rpjmdTarget", "Target RPJMD")}
                  </span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-blue-500 dark:text-blue-400">
                    Rp 2,50 T
                  </span>
                </div>
                <div>
                  <span className={`text-[9px] uppercase tracking-wider block font-bold ${isDark ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>
                    {t("performance.realizationData", "Realisasi")}
                  </span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-emerald-500 dark:text-emerald-400">
                    {safeTotalValue >= 1e12 
                      ? `Rp ${(safeTotalValue / 1e12).toFixed(2)} T` 
                      : safeTotalValue >= 1e9 
                        ? `Rp ${(safeTotalValue / 1e9).toFixed(1)} M` 
                        : formatRupiah(safeTotalValue)}
                  </span>
                </div>
              </div>
            </div>

            {/* CHART 4: KOMODITAS PER KECAMATAN */}
            <div
              className={`col-span-1 md:col-span-full p-4 sm:p-6 rounded-3xl border flex flex-col h-[460px] justify-between relative overflow-hidden transition-all duration-300 hover:border-emerald-500/30 group ${computedCardBg}`}
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 dark:bg-amber-400/5 blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b pb-4 border-slate-500/10">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-2xl ${isDark ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20" : "bg-amber-50 text-amber-600 border border-amber-100"}`}
                  >
                    <Layers size={20} className="group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
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

              <div className="w-full relative flex items-center justify-center overflow-x-auto overscroll-x-contain hide-scrollbar min-w-0" style={{ width: "100%", height: 320, minHeight: 320 }}>
                {safeCommodityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={safeCommodityData}
                      margin={{ top: 15, right: 15, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid
                        strokeDasharray="4 4"
                        stroke={isDark ? "rgba(148, 163, 184, 0.05)" : "rgba(148, 163, 184, 0.12)"}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        tick={{ fill: axisTextColor, fontSize: 12, fontWeight: 500 }}
                        tickMargin={10}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#94a3b8"
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
                        itemStyle={{ color: isDark ? "#ffffff" : "#0f172a", fontSize: "12px", fontWeight: "600" }}
                        labelStyle={{ color: isDark ? "#94a3b8" : "#475569", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}
                      />
                      <Legend
                        formatter={(value: string) => (
                          <span className="text-slate-800 dark:text-slate-200 dark:text-slate-350 font-medium text-xs">
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
                      {safeCommoditySectors.map(
                        (sector, index) => {
                          let fillVal = safeColors[index % safeColors.length];
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
                                index === safeCommoditySectors.length - 1
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
                  <div className="flex flex-col items-center justify-center text-slate-600 dark:text-slate-400">
                    <Layers size={40} className="mb-3 opacity-20" />
                    <p className="text-xs">{t("landing.dataCommodityNotAvailable", "Data komoditas per kecamatan belum tersedia")}</p>
                  </div>
                )}
              </div>
            </div>


            {/* CHART 5: SERAPAN TENAGA KERJA */}
            <div
              className={`col-span-1 md:col-span-full p-4 sm:p-6 rounded-3xl border flex flex-col relative overflow-hidden transition-all duration-300 hover:border-emerald-500/30 group ${computedCardBg}`}
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 dark:bg-emerald-400/5 blur-3xl pointer-events-none" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b pb-4 border-slate-500/10">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-2xl ${isDark ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}
                  >
                    <Users size={20} className="group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      {t("chartsExtra.laborAbsorption", "Serapan Tenaga Kerja")}
                    </h3>
                    <p
                      className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}
                    >
                      {t("chartsExtra.socialImpact", "Dampak Sosial Investasi")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Metrics */}
                <div className="col-span-1 flex flex-col justify-center gap-6">
                  <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-800/50 border-slate-700/60" : "bg-slate-50 border-slate-200"}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${textMuted}`}>{t("chartsExtra.absorptionTarget", "Target Serapan 2026")}</p>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-mono font-bold text-slate-900 dark:text-white">{targetSerapan.toLocaleString("id-ID")}</span>
                      <span className={`text-xs font-medium pb-1 ${textMuted}`}>{t("chartsExtra.people", "Orang")}</span>
                    </div>
                  </div>
                  
                  <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-800/50 border-slate-700/60" : "bg-slate-50 border-slate-200"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>{t("chartsExtra.absorptionRealization", "Realisasi Serapan")}</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Supabase DB
                      </span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-mono font-bold text-emerald-600 dark:text-emerald-400">{realisasiSerapan.toLocaleString("id-ID")}</span>
                      <span className={`text-xs font-medium pb-1 ${textMuted}`}>{t("chartsExtra.people", "Orang")}</span>
                    </div>
                    <div className="mt-2.5 flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>TKL (Komitmen Lokal): <strong className="font-mono text-emerald-600 dark:text-emerald-400">{totalTKL}</strong> Orang</span>
                      {totalTKA > 0 && (
                        <>
                          <span className="text-slate-400">•</span>
                          <span>TKA: <strong className="font-mono text-amber-500">{totalTKA}</strong></span>
                        </>
                      )}
                    </div>
                    <div className="mt-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-700" style={{ width: `${serapanPercentage}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Chart Area */}
                <div className="col-span-1 lg:col-span-2 h-[260px] min-h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={qData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="4 4"
                        stroke={isDark ? "rgba(148, 163, 184, 0.05)" : "rgba(148, 163, 184, 0.12)"}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        tick={{ fill: axisTextColor, fontSize: 12, fontWeight: 500 }}
                        tickMargin={10}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        tick={{ fill: axisTextColor, fontSize: 12, fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
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
                        itemStyle={{ color: isDark ? "#ffffff" : "#0f172a", fontSize: "12px", fontWeight: "600" }}
                        labelStyle={{ color: isDark ? "#94a3b8" : "#475569", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: "15px", fontSize: "11px" }}
                      />
                      <Bar dataKey="local" name={t("chartsExtra.localLabor", "Tenaga Kerja Lokal (TKL)")} fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                      <Bar dataKey="foreign" name={t("chartsExtra.foreignLabor", "Tenaga Kerja Asing (TKA)")} fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

