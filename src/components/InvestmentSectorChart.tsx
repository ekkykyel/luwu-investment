import { useTranslation } from "react-i18next";
import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { formatRupiahSingkat } from "../lib/formatters";
import { Grid, Ban } from "lucide-react";
import { SECTOR_COLORS } from "../lib/constants";
import { SektorInvestasi } from "../types";

interface InvestmentSectorChartProps {
  data: { name: string; value: number; projectCount: number }[];
  isDarkMode: boolean;
  panelOpacity?: number;
}

export default function InvestmentSectorChart({ data, isDarkMode, panelOpacity = 80 }: InvestmentSectorChartProps) {
  const { t } = useTranslation();
  const effectiveOpacity = Math.max(10, Math.min(100, panelOpacity)) / 100;

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
    >
      <div className="flex items-center justify-between mb-5 border-b pb-4 border-slate-200/50 dark:border-white/10">
        <div>
          <h4 className={`text-xs md:text-sm font-bold tracking-wide ${isDarkMode ? "text-white" : "text-slate-950"}`}>
            {t('mapAnalytics.sectorDist')}
          </h4>
          <span className={`text-[10px] md:text-[11px] mt-1 leading-relaxed block ${isDarkMode ? "text-slate-300 font-medium" : "text-slate-800 font-bold"}`}>
            {t('mapAnalytics.distCommitment')}
          </span>
        </div>
        <div className={`p-2 rounded-xl transition-transform hover:scale-110 border ${isDarkMode ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-emerald-100 border-emerald-300 text-emerald-950 font-bold"}`}>
          <Grid className="h-4 w-4 md:h-5 md:w-5" />
        </div>
      </div>

      <div className="h-52 min-h-[208px] w-full relative flex items-center justify-center">
        {!Array.isArray(data) || data.length === 0 ? (
          <div className="text-xs text-slate-600 dark:text-slate-400 italic py-6 flex flex-col items-center gap-2">
            <Ban className="h-8 w-8 text-slate-600 opacity-50" />
            <span>{t('mapAnalytics.noData', 'Belum ada data sektor investasi diinput.')}</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={SECTOR_COLORS[entry.name as SektorInvestasi] || "#475569"} 
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(val) => [formatRupiahSingkat(val as number), "Komitmen Kapital"]} 
                contentStyle={{ 
                  background: isDarkMode ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)", 
                  backdropFilter: "blur(8px)",
                  border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`, 
                  borderRadius: "12px", 
                  fontSize: "12px", 
                  color: isDarkMode ? "#ffffff" : "#0f172a",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
                }}
                itemStyle={{ color: isDarkMode ? "#ffffff" : "#0f172a", fontWeight: "bold", fontSize: "12px" }}
                labelStyle={{ color: isDarkMode ? "#94a3b8" : "#475569", fontWeight: "600", fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className={`grid grid-cols-2 gap-x-4 gap-y-3 mt-4 pt-4 border-t ${isDarkMode ? "border-white/10" : "border-slate-900/10"}`}>
        {(Array.isArray(data) ? data : []).map((item, idx) => {
          const color = SECTOR_COLORS[item.name as SektorInvestasi] || "#475569";
          return (
            <div key={`${item.name}-${idx}`} className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: color }}></span>
              <div className="flex flex-col min-w-0">
                <span className={`text-[11px] truncate capitalize font-medium ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
                  {item.name}
                </span>
                <span className={`text-[10px] font-mono ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  {item.projectCount} Proyek
                </span>
              </div>
              <span className={`text-[11px] font-bold font-mono ml-auto ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                {formatRupiahSingkat(item.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ui polish: resolve recharts 0x0 dimension warnings
