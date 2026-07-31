import { useTranslation } from "react-i18next";
import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { formatRupiahSingkat } from "../lib/formatters.js";
import { Grid, Ban } from "lucide-react";
import { SECTOR_COLORS } from "../lib/constants.js";
import { SektorInvestasi } from "../types.js";

interface InvestmentSectorChartProps {
  data: { name: string; value: number; projectCount: number }[];
  isDarkMode: boolean;
}

export default function InvestmentSectorChart({ data, isDarkMode }: InvestmentSectorChartProps) {
  const { t } = useTranslation();

  return (
    <div className={`p-6 rounded-xl backdrop-blur-md border shadow-2xl transition-all duration-300 relative z-10 ${
      isDarkMode ? "bg-slate-900/80 border-slate-700/50" : "bg-white/80 border-white/40"
    }`}>
      <div className="flex items-center justify-between mb-4 border-b pb-3 border-slate-900/10 dark:border-white/10">
        <div>
          <h4 className={`text-sm font-semibold tracking-wide ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
            {t('mapAnalytics.sectorDist')}
          </h4>
          <span className={`text-[10px] sm:text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            {t('mapAnalytics.distCommitment')}
          </span>
        </div>
        <div className={`p-2 rounded-xl border ${isDarkMode ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"}`}>
          <Grid className="h-4 w-4" />
        </div>
      </div>

      <div className="h-52 min-h-[208px] w-full relative flex items-center justify-center">
        {data.length === 0 ? (
          <div className="text-xs text-slate-500 italic py-6 flex flex-col items-center gap-2">
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
                  background: isDarkMode ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.9)", 
                  backdropFilter: "blur(8px)",
                  border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`, 
                  borderRadius: "12px", 
                  fontSize: "12px", 
                  color: isDarkMode ? "#fff" : "#0f172a",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
                }}
                itemStyle={{ fontWeight: "bold" }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className={`grid grid-cols-2 gap-x-4 gap-y-3 mt-4 pt-4 border-t ${isDarkMode ? "border-white/10" : "border-slate-900/10"}`}>
        {data.map((item, idx) => {
          const color = SECTOR_COLORS[item.name as SektorInvestasi] || "#475569";
          return (
            <div key={`${item.name}-${idx}`} className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: color }}></span>
              <div className="flex flex-col min-w-0">
                <span className={`text-[11px] truncate capitalize font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
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
