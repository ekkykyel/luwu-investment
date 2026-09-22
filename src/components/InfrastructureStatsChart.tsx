import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie, Legend, CartesianGrid 
} from "recharts";
import { Hammer, Ban, LayoutGrid, BarChart2, PieChart as PieIcon, ShieldAlert } from "lucide-react";

interface InfrastructureStatsChartProps {
  infrastructure: any[];
  isDarkMode: boolean;
  panelOpacity?: number;
}

const INFRA_COLORS: { [key: string]: string } = {
  "Rumah Sakit": "#f43f5e",        // Rose
  "Bandara": "#0ea5e9",            // Sky
  "Pelabuhan": "#2563eb",          // Blue
  "Kantor Polisi": "#6366f1",      // Indigo
  "Kantor Camat": "#a855f7",       // Purple
  "Kantor Desa": "#d946ef",        // Fuchsia
  "Perkantoran Daerah": "#ec4899", // Pink
  "Pusat Perdagangan": "#f59e0b",  // Amber
  "Toko / Swalayan": "#eab308",    // Yellow
  "Sarana Pendidikan": "#3b82f6",  // Royal Blue
  "Fasilitas Umum": "#10b981",     // Emerald
  "Lainnya": "#64748b",            // Slate
  "Akses Jalan": "#14b8a6",        // Teal
  "Jalan": "#0d9488",              // Teal dark
};

// Elegant color generation for unmapped categories
function getCategoryColor(name: string): string {
  if (INFRA_COLORS[name]) return INFRA_COLORS[name];
  
  // Custom hash to generate a pleasant color from slate/indigo/teal/emerald ranges
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", 
    "#06b6d4", "#14b8a6", "#6366f1", "#f43f5e", "#a855f7"
  ];
  return colors[Math.abs(hash) % colors.length];
}

export default function InfrastructureStatsChart({ infrastructure = [], isDarkMode, panelOpacity = 80 }: InfrastructureStatsChartProps) {
  const { t } = useTranslation();
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");
  const effectiveOpacity = Math.max(10, Math.min(100, panelOpacity)) / 100;

  // Dynamic aggregation of infrastructure from real-time spatial layer points
  const aggregatedData = useMemo(() => {
    if (!infrastructure || infrastructure.length === 0) return [];

    const counts: { [key: string]: number } = {};
    infrastructure.forEach((item) => {
      // Normalize name and category
      const type = item.type || item.category || "Lainnya";
      counts[type] = (counts[type] || 0) + 1;
    });

    const totalCount = infrastructure.length;

    return Object.entries(counts)
      .map(([name, count]) => ({
        name: t(`infraStats.categories.${name}`, name),
        count,
        percentage: parseFloat(((count / totalCount) * 100).toFixed(1)),
        color: getCategoryColor(name),
      }))
      .sort((a, b) => b.count - a.count);
  }, [infrastructure, t]);

  const totalInfraCount = infrastructure.length;

  return (
    <div 
      style={{
        backgroundColor: isDarkMode 
          ? `rgba(2, 6, 23, ${effectiveOpacity})` 
          : `rgba(255, 255, 255, ${effectiveOpacity})`
      }}
      className={`border p-5 lg:p-6 rounded-2xl shadow-sm transition-all duration-300 ease-in-out hover:shadow-md relative z-10 backdrop-blur-md ${
        isDarkMode ? "border-white/10 text-white" : "border-slate-900/15 text-slate-950"
      }`} 
      id="infra-stats-section"
    >
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b pb-4 border-slate-200/50 dark:border-white/10">
        <div>
          <h4 className={`text-xs md:text-sm font-bold tracking-wide ${isDarkMode ? "text-white" : "text-slate-950"}`}>
            {t("infraStats.title", "Statistik Infrastruktur Luwu")}
          </h4>
          <span className={`text-[10px] md:text-[11px] block mt-1 leading-relaxed ${isDarkMode ? "text-slate-300 font-medium" : "text-slate-800 font-bold"}`}>
            {t("infraStats.subtitle", "Distribusi aset & fasilitas berdasarkan klasifikasi spasial")}
          </span>
        </div>

        {/* Chart switcher controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            onClick={() => setChartType("bar")}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              chartType === "bar"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                : isDarkMode
                  ? "border-slate-800 hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                  : "border-slate-200 hover:bg-slate-50 text-slate-600"
            }`}
            title={t("infraStats.barChart", "Grafik Batang")}
          >
            <BarChart2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setChartType("pie")}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              chartType === "pie"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                : isDarkMode
                  ? "border-slate-800 hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                  : "border-slate-200 hover:bg-slate-50 text-slate-600"
            }`}
            title={t("infraStats.pieChart", "Grafik Donat")}
          >
            <PieIcon className="h-3.5 w-3.5" />
          </button>
          <div className={`p-1.5 rounded-lg border font-mono text-[9.5px] font-bold ${
            isDarkMode ? "bg-slate-950 border-slate-800 text-emerald-700 dark:text-emerald-400" : "bg-slate-50 border-slate-200 text-emerald-600"
          }`}>
            {t("infraStats.assetCount", "{{count}} Aset", { count: totalInfraCount })}
          </div>
        </div>
      </div>

      {/* Chart Visualization Area */}
      <div className="h-56 min-h-[224px] w-full relative flex items-center justify-center">
        {aggregatedData.length === 0 ? (
          <div className="text-center italic py-6 flex flex-col items-center gap-2 font-sans">
            <Ban className="h-8 w-8 text-rose-500 animate-pulse opacity-80" />
            <span className={`text-[11px] font-semibold ${isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>
              {t("infraStats.noData", "Belum ada data spasial infrastruktur")}
            </span>
            <span className={`text-[9.5px] ${isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>
              {t("infraStats.noDataDesc", "Gunakan form untuk menambahkan titik atau sinkronkan peta.")}
            </span>
          </div>
        ) : chartType === "bar" ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart
              data={aggregatedData}
              layout="vertical"
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"} />
              <XAxis 
                type="number" 
                tick={{ fill: isDarkMode ? "#94a3b8" : "#475569", fontSize: 9, fontFamily: "monospace" }} 
                stroke={isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fill: isDarkMode ? "#e2e8f0" : "#0f172a", fontSize: 9 }}
                stroke={isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
                width={85}
              />
              <Tooltip
                cursor={{ fill: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)" }}
                formatter={(val, name) => [val, t("infraStats.assetCountTooltip", "Jumlah Aset")]}
                contentStyle={{
                  background: isDarkMode ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(12px)",
                  border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`,
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontFamily: "sans-serif",
                  color: isDarkMode ? "#ffffff" : "#0f172a",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)"
                }}
                itemStyle={{ color: isDarkMode ? "#ffffff" : "#0f172a", fontWeight: "bold", fontSize: "11px" }}
                labelStyle={{ color: isDarkMode ? "#94a3b8" : "#475569", fontWeight: "600", fontSize: "11px" }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {aggregatedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <PieChart>
              <Pie
                data={aggregatedData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={3}
                dataKey="count"
                stroke="none"
              >
                {aggregatedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val, name) => [val, t("infraStats.countTooltip", "Jumlah")]}
                contentStyle={{
                  background: isDarkMode ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(12px)",
                  border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`,
                  borderRadius: "12px",
                  fontSize: "11px",
                  color: isDarkMode ? "#ffffff" : "#0f172a",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)"
                }}
                itemStyle={{ color: isDarkMode ? "#ffffff" : "#0f172a", fontWeight: "bold", fontSize: "11px" }}
                labelStyle={{ color: isDarkMode ? "#94a3b8" : "#475569", fontWeight: "600", fontSize: "11px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Grid List Breakdown (Anti-AI-Slop Clean Typography) */}
      {aggregatedData.length > 0 && (
        <div className={`grid grid-cols-2 gap-x-4 gap-y-2.5 mt-3 pt-3.5 border-t max-h-[140px] overflow-y-auto custom-scrollbar ${
          isDarkMode ? "border-white/5" : "border-slate-900/5"
        }`}>
          {aggregatedData.map((item, idx) => (
            <div key={`${item.name}-${idx}`} className="flex items-center gap-2 min-w-0">
              <span className="h-2 w-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: item.color }}></span>
              <div className="flex flex-col min-w-0 flex-1">
                <span className={`text-[10px] truncate font-medium leading-tight ${isDarkMode ? "text-slate-200" : "text-slate-700"}`} title={item.name}>
                  {item.name}
                </span>
                <span className={`text-[8.5px] font-mono leading-none ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  {t("infraStats.ofTotal", "{{percentage}}% dari total", { percentage: item.percentage })}
                </span>
              </div>
              <span className={`text-[10.5px] font-bold font-mono ml-auto pl-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                {item.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ui polish: resolve recharts 0x0 dimension warnings
