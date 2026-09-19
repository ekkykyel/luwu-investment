import React, { useMemo, useState } from 'react';
import { 
  Users, 
  UserCheck, 
  Globe, 
  ShieldCheck, 
  TrendingUp, 
  Building2, 
  MapPin, 
  ChevronRight, 
  Info, 
  Sparkles,
  Layers,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell 
} from 'recharts';
import { SECTOR_COLORS } from '../../lib/constants.js';
import { SektorInvestasi } from '../../types.js';
import { formatRupiahSingkat } from '../../lib/formatters.js';

interface OperatorLaborWidgetProps {
  investments: any[];
  onSelectInvestment?: (id: string) => void;
  className?: string;
  isCompact?: boolean;
}

export const OperatorLaborWidget: React.FC<OperatorLaborWidgetProps> = ({
  investments,
  onSelectInvestment,
  className = "",
  isCompact = false
}) => {
  const [activeView, setActiveView] = useState<'chart' | 'table'>('chart');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('all');

  // Filter active investments only (Doktrin Zero Dummy: Real data only)
  const activeInvestments = useMemo(() => {
    return (investments || []).filter((inv: any) => {
      // Must not be explicitly deactivated or rejected
      const isActive = inv.isActive !== false && inv.is_active !== false;
      const notRejected = String(inv.status || '').toLowerCase() !== 'rejected';
      return isActive && notRejected;
    });
  }, [investments]);

  // Safe helper to extract local labor
  const getLocalLabor = (inv: any): number => {
    const val = 
      inv.komitmenTenagaLokal ?? 
      inv.komitmen_tenaga_lokal ?? 
      inv.penyerapan_tenaga_kerja ?? 
      inv.penyerapanTenagaKerja ?? 
      inv.tenagaLokal ?? 
      inv.tenaga_lokal ?? 
      inv.tenagaKerja ?? 
      inv.tenaga_kerja ?? 
      inv.tkl ?? 
      0;
    return typeof val === 'number' ? val : (parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0);
  };

  // Safe helper to extract foreign labor
  const getForeignLabor = (inv: any): number => {
    const val = 
      inv.komitmenTenagaAsing ?? 
      inv.komitmen_tenaga_asing ?? 
      inv.tenagaAsing ?? 
      inv.tenaga_asing ?? 
      inv.tka ?? 
      0;
    return typeof val === 'number' ? val : (parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0);
  };

  // Aggregate stats
  const metrics = useMemo(() => {
    let totalLocal = 0;
    let totalForeign = 0;
    const sectorAggMap: { 
      [key: string]: { 
        sector: string; 
        local: number; 
        foreign: number; 
        total: number; 
        projectCount: number;
        totalValue: number;
      } 
    } = {};

    activeInvestments.forEach((inv: any) => {
      const loc = getLocalLabor(inv);
      const fgn = getForeignLabor(inv);
      const invVal = Number(inv.investmentValue || inv.investment_value || inv.nilai_investasi || inv.estimasi_nilai || 0) || 0;
      const sec = inv.sector || inv.sektor_utama || 'Lainnya';

      totalLocal += loc;
      totalForeign += fgn;

      if (!sectorAggMap[sec]) {
        sectorAggMap[sec] = {
          sector: sec,
          local: 0,
          foreign: 0,
          total: 0,
          projectCount: 0,
          totalValue: 0
        };
      }

      sectorAggMap[sec].local += loc;
      sectorAggMap[sec].foreign += fgn;
      sectorAggMap[sec].total += (loc + fgn);
      sectorAggMap[sec].projectCount += 1;
      sectorAggMap[sec].totalValue += invVal;
    });

    const totalLabor = totalLocal + totalForeign;
    const localPercent = totalLabor > 0 ? (totalLocal / totalLabor) * 100 : 0;
    const foreignPercent = totalLabor > 0 ? (totalForeign / totalLabor) * 100 : 0;

    // Convert to sorted array for chart display
    const sectorChartData = Object.values(sectorAggMap).sort((a, b) => b.total - a.total);

    // Dominant labor absorbing sector
    const topSector = sectorChartData.length > 0 ? sectorChartData[0] : null;

    return {
      totalActiveProjects: activeInvestments.length,
      totalLocal,
      totalForeign,
      totalLabor,
      localPercent,
      foreignPercent,
      sectorChartData,
      topSector,
      avgPerProject: activeInvestments.length > 0 ? Math.round(totalLabor / activeInvestments.length) : 0
    };
  }, [activeInvestments]);

  // Filtered investments for the detail table
  const tableData = useMemo(() => {
    return activeInvestments
      .map((inv: any) => {
        const local = getLocalLabor(inv);
        const foreign = getForeignLabor(inv);
        const total = local + foreign;
        const localPct = total > 0 ? Math.round((local / total) * 100) : 100;
        return {
          id: inv.id,
          name: inv.name || inv.nama || 'Proyek Investasi',
          sector: inv.sector || inv.sektor_utama || 'Lainnya',
          district: inv.district || inv.kecamatan || 'Kabupaten Luwu',
          local,
          foreign,
          total,
          localPct,
          investmentValue: Number(inv.investmentValue || inv.investment_value || inv.nilai_investasi || inv.estimasi_nilai || 0) || 0
        };
      })
      .filter((item) => {
        if (selectedSectorFilter === 'all') return true;
        return item.sector === selectedSectorFilter;
      })
      .sort((a, b) => b.total - a.total);
  }, [activeInvestments, selectedSectorFilter]);

  // Unique sector names for filter pills
  const uniqueSectors = useMemo(() => {
    const list = Array.from(new Set(activeInvestments.map(i => i.sector || i.sektor_utama || 'Lainnya')));
    return list.filter(Boolean);
  }, [activeInvestments]);

  return (
    <div className={`p-5 sm:p-6 rounded-2xl bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all ${className}`}>
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Users size={18} />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Ringkasan Komitmen Tenaga Kerja
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Supabase
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Penghitungan otomatis serapan Tenaga Kerja Lokal (TKL) vs Asing (TKA) dari {metrics.totalActiveProjects} proyek investasi aktif.
          </p>
        </div>

        {/* View Toggle button */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
          <button
            onClick={() => setActiveView('chart')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeView === 'chart'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Grafik Per Sektor
          </button>
          <button
            onClick={() => setActiveView('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeView === 'table'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Rincian Proyek
          </button>
        </div>
      </div>

      {/* 4 Metric Bento Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-5">
        {/* Total Komitmen */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between group hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Komitmen
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Users size={14} />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {metrics.totalLabor.toLocaleString('id-ID')}{' '}
              <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">Jiwa</span>
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span>Rata-rata:</span>
              <strong className="text-slate-900 dark:text-slate-200 font-bold">{metrics.avgPerProject} Jiwa/Proyek</strong>
            </div>
          </div>
        </div>

        {/* Tenaga Kerja Lokal (TKL) */}
        <div className="p-4 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 flex flex-col justify-between group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Tenaga Lokal (TKL)
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <UserCheck size={14} />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
              {metrics.totalLocal.toLocaleString('id-ID')}{' '}
              <span className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400/80">Jiwa</span>
            </div>
            <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold mt-1 flex items-center justify-between">
              <span>Porsi Penyerapan:</span>
              <span className="font-mono font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded text-[10px]">
                {metrics.localPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Tenaga Kerja Asing (TKA) */}
        <div className="p-4 rounded-xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 flex flex-col justify-between group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Tenaga Asing (TKA)
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Globe size={14} />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400 tracking-tight">
              {metrics.totalForeign.toLocaleString('id-ID')}{' '}
              <span className="text-xs sm:text-sm font-semibold text-amber-600 dark:text-amber-400/80">Jiwa</span>
            </div>
            <div className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold mt-1 flex items-center justify-between">
              <span>Alih Keahlian/Spesialis:</span>
              <span className="font-mono font-bold bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px]">
                {metrics.foreignPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Kepatuhan Regulasi Perda Luwu */}
        <div className="p-4 rounded-xl bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/20 flex flex-col justify-between group hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
              Standar Perda Luwu
            </span>
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400">
              <ShieldCheck size={14} />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-purple-800 dark:text-purple-300 tracking-tight">
              {metrics.totalLabor > 0 && metrics.localPercent >= 70 ? (
                <span className="text-emerald-700 dark:text-emerald-400">Optimal (≥70%)</span>
              ) : metrics.totalLabor > 0 && metrics.localPercent >= 60 ? (
                <span className="text-teal-700 dark:text-teal-400">Sesuai (≥60%)</span>
              ) : metrics.totalLabor > 0 ? (
                <span className="text-amber-700 dark:text-amber-400">Evaluasi (&lt;60%)</span>
              ) : (
                <span className="text-slate-500">0%</span>
              )}
            </div>
            <div className="text-[10px] text-purple-800 dark:text-purple-300 mt-1">
              Target regulasi daerah: Min. 60% s.d. 70% TKL
            </div>
          </div>
        </div>
      </div>

      {/* Visual Ratio Progress Bar */}
      {metrics.totalLabor > 0 && (
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 mb-6">
          <div className="flex justify-between items-center text-xs mb-1.5 font-semibold">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-800 dark:text-slate-200">
                Tenaga Lokal (TKL): <strong className="font-mono text-emerald-600 dark:text-emerald-400">{metrics.totalLocal} Jiwa ({metrics.localPercent.toFixed(1)}%)</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-slate-800 dark:text-slate-200">
                Tenaga Asing (TKA): <strong className="font-mono text-amber-600 dark:text-amber-400">{metrics.totalForeign} Jiwa ({metrics.foreignPercent.toFixed(1)}%)</strong>
              </span>
            </div>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex shadow-inner">
            <div 
              style={{ width: `${metrics.localPercent}%` }}
              className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-700"
              title={`Tenaga Lokal: ${metrics.localPercent.toFixed(1)}%`}
            />
            <div 
              style={{ width: `${metrics.foreignPercent}%` }}
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-700"
              title={`Tenaga Asing: ${metrics.foreignPercent.toFixed(1)}%`}
            />
          </div>
        </div>
      )}

      {/* Conditional Content: Chart vs Table */}
      {activeView === 'chart' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Bar Chart: Tren Penyerapan Tenaga Kerja Per Sektor */}
          <div className="lg:col-span-8 p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-500" />
                  <span>Grafik Tren Penyerapan Tenaga Kerja per Sektor</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Distribusi kumulatif komitmen tenaga kerja lokal vs tenaga kerja asing
                </p>
              </div>
            </div>

            {metrics.sectorChartData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                <Users size={32} className="text-slate-300 dark:text-slate-600 mb-2" />
                <p>Belum ada data komitmen tenaga kerja pada sektor aktif.</p>
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metrics.sectorChartData}
                    margin={{ top: 15, right: 15, left: -10, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.15} />
                    <XAxis 
                      dataKey="sector" 
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={45}
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#1e293b',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '11px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                      }}
                      itemStyle={{ fontSize: '11px', fontWeight: 600 }}
                      formatter={(val: any, name: string) => [
                        `${Number(val).toLocaleString('id-ID')} Jiwa`, 
                        name === 'local' ? 'Tenaga Lokal (TKL)' : 'Tenaga Asing (TKA)'
                      ]}
                      labelFormatter={(label) => `Sektor: ${label}`}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36}
                      formatter={(val) => (
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {val === 'local' ? 'Tenaga Kerja Lokal (TKL)' : 'Tenaga Kerja Asing (TKA)'}
                        </span>
                      )}
                    />
                    <Bar 
                      dataKey="local" 
                      name="local" 
                      fill="#10b981" 
                      radius={[6, 6, 0, 0]} 
                      maxBarSize={48} 
                    />
                    <Bar 
                      dataKey="foreign" 
                      name="foreign" 
                      fill="#f59e0b" 
                      radius={[6, 6, 0, 0]} 
                      maxBarSize={48} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Sector Breakdown & Highlights */}
          <div className="lg:col-span-4 flex flex-col justify-between p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                <Layers size={16} className="text-blue-500" />
                <span>Peringkat Serapan per Sektor</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                Urutan kontribusi tenaga kerja terbesar
              </p>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {metrics.sectorChartData.map((item, idx) => {
                  const color = SECTOR_COLORS[item.sector as SektorInvestasi] || "#64748b";
                  const pct = metrics.totalLabor > 0 ? ((item.total / metrics.totalLabor) * 100).toFixed(0) : '0';
                  return (
                    <div 
                      key={item.sector}
                      className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-md flex items-center justify-center font-mono font-bold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                            <span className="truncate">{item.sector}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <span>{item.projectCount} Proyek</span>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{item.local} TKL</span>
                            {item.foreign > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">{item.foreign} TKA</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {item.total.toLocaleString('id-ID')} Jiwa
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {pct}% Total
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick highlight box */}
            {metrics.topSector && (
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-2">
                <Sparkles size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  Sektor <strong className="text-slate-900 dark:text-white">{metrics.topSector.sector}</strong> menyerap tenaga kerja tertinggi dengan komitmen <strong className="text-emerald-600 dark:text-emerald-400">{metrics.topSector.total.toLocaleString('id-ID')} jiwa</strong>.
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Table View: Active Investments Detail */
        <div className="space-y-4">
          {/* Sector filter pills */}
          {uniqueSectors.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 pb-2">
              <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
                <Filter size={12} /> Filter:
              </span>
              <button
                onClick={() => setSelectedSectorFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedSectorFilter === 'all'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Semua Sektor ({activeInvestments.length})
              </button>
              {uniqueSectors.map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSelectedSectorFilter(sec)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedSectorFilter === sec
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-mono font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Nama Proyek Investasi</th>
                  <th className="py-3 px-4">Sektor / Lokasi</th>
                  <th className="py-3 px-4 text-center">TKL (Lokal)</th>
                  <th className="py-3 px-4 text-center">TKA (Asing)</th>
                  <th className="py-3 px-4 text-right">Total Serapan</th>
                  <th className="py-3 px-4 text-center">Porsi Lokal</th>
                  {onSelectInvestment && <th className="py-3 px-4 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
                {tableData.length === 0 ? (
                  <tr>
                    <td colSpan={onSelectInvestment ? 7 : 6} className="py-8 text-center text-slate-400">
                      Tidak ada data proyek investasi yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  tableData.map((item) => {
                    const sectorColor = SECTOR_COLORS[item.sector as SektorInvestasi] || "#64748b";
                    return (
                      <tr 
                        key={item.id} 
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Building2 size={14} className="text-emerald-500 shrink-0" />
                            <span className="truncate max-w-xs">{item.name}</span>
                          </div>
                          {item.investmentValue > 0 && (
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                              Est. {formatRupiahSingkat(item.investmentValue)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span 
                            className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-0.5"
                            style={{ backgroundColor: `${sectorColor}15`, color: sectorColor }}
                          >
                            {item.sector}
                          </span>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <MapPin size={10} />
                            <span>{item.district}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {item.local} Jiwa
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                          {item.foreign} Jiwa
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-slate-900 dark:text-white">
                          {item.total.toLocaleString('id-ID')} Jiwa
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            item.localPct >= 70
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                              : item.localPct >= 60
                              ? 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20'
                              : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                          }`}>
                            {item.localPct}% TKL
                          </span>
                        </td>
                        {onSelectInvestment && (
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => onSelectInvestment(item.id)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white text-slate-600 dark:text-slate-300 transition-colors"
                              title="Buka Detail Proyek"
                            >
                              <ArrowUpRight size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorLaborWidget;
