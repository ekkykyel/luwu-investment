import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  Award,
  Download,
  Building2,
  MapPin,
  CheckCircle2,
  Sparkles,
  Calendar,
  Zap,
  ShieldCheck,
  Activity,
  FileText,
  PieChart,
  ArrowUpRight,
  Filter,
  Info
} from 'lucide-react';

interface MppVisitorAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const MppVisitorAnalyticsModal: React.FC<MppVisitorAnalyticsModalProps> = ({
  isOpen,
  onClose,
  isDark = false,
}) => {
  const [activePeriod, setActivePeriod] = useState<'today' | 'month' | 'year'>('month');
  const [activeTab, setActiveTab] = useState<'peak' | 'agencies' | 'demographics' | 'skm'>('peak');

  if (!isOpen) return null;

  // Mocked analytics data rooted in real Luwu MPP context
  const peakHourData = [
    { hour: '08:00 - 09:00', visitors: 145, status: 'Lancar / Tersepi', color: 'bg-emerald-500' },
    { hour: '09:00 - 10:30', visitors: 380, status: 'Padat / Peak', color: 'bg-rose-500' },
    { hour: '10:30 - 12:00', visitors: 420, status: 'Sangat Padat', color: 'bg-rose-600' },
    { hour: '12:00 - 13:00', visitors: 110, status: 'Istirahat Siang', color: 'bg-amber-500' },
    { hour: '13:00 - 14:30', visitors: 290, status: 'Sedang', color: 'bg-teal-500' },
    { hour: '14:30 - 15:30', visitors: 165, status: 'Lancar', color: 'bg-emerald-500' },
  ];

  const topAgencies = [
    { name: 'Disdukcapil Kab. Luwu', count: '1,420', percent: '34%', slaAvg: '8 Menit', badge: 'Terfavorit' },
    { name: 'DPMPTSP (Perizinan NIB)', count: '980', percent: '23%', slaAvg: '12 Menit', badge: 'Investasi' },
    { name: 'Bapenda (PBB & Pajak)', count: '650', percent: '15%', slaAvg: '6 Menit', badge: 'Pendapatan' },
    { name: 'BPJS Kesehatan & Ketenagakerjaan', count: '540', percent: '13%', slaAvg: '10 Menit', badge: 'Sosial' },
    { name: 'Samsat & Polres Luwu (SIM/STNK)', count: '410', percent: '10%', slaAvg: '15 Menit', badge: 'Kepolisian' },
  ];

  const districtData = [
    { name: 'Kec. Belopa (Pusat)', share: '32%', count: '1,344 pemohon' },
    { name: 'Kec. Walenrang & Lamasi', share: '21%', count: '882 pemohon' },
    { name: 'Kec. Bua & Ponrang', share: '18%', count: '756 pemohon' },
    { name: 'Kec. Bastem & Latimojong', share: '14%', count: '588 pemohon' },
    { name: 'Kecamatan Lainnya', share: '15%', count: '630 pemohon' },
  ];

  const handleExportReport = () => {
    alert('Laporan Rekapitulasi Analitik Kinerja MPP Simpurusiang sedang diunduh dalam format PDF resmi.');
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className={`w-full max-w-3xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl border shadow-2xl overflow-hidden ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-white shadow-emerald-950/40'
              : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar dengan Handle Drag Android */}
          <div className="relative pt-3 pb-4 px-5 sm:px-7 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
            {/* Handle Bar indikator mobile */}
            <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-3 sm:hidden" />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      Real-Time Analytics
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" /> Terverifikasi Supabase
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight">
                    Statistik & Laporan Kinerja MPP
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
                aria-label="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-Header Period Filter Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700">
                {(['today', 'month', 'year'] as const).map((p) => {
                  const label = p === 'today' ? 'Hari Ini' : p === 'month' ? 'Bulan Ini' : 'Tahun 2026';
                  const isActive = activePeriod === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setActivePeriod(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleExportReport}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor Laporan</span>
              </button>
            </div>
          </div>

          {/* Modal Tab Selector */}
          <div className="px-5 sm:px-7 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 shrink-0 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 min-w-max">
              {[
                { id: 'peak', label: 'Jam Sibuk & Rekomendasi', icon: Clock },
                { id: 'agencies', label: 'Top Instansi & SLA', icon: Building2 },
                { id: 'demographics', label: 'Demografi & Metode', icon: PieChart },
                { id: 'skm', label: 'Indeks SKM & Kepuasan', icon: Award },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Body Scrollable */}
          <div className="p-5 sm:p-7 overflow-y-auto space-y-6 text-slate-900 dark:text-white">
            {/* Top KPI Cards Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Total Pemohon</span>
                <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">4,200</span>
                <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                  <TrendingUp className="w-3 h-3" /> +12.4% vs bln lalu
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Rata-rata SLA</span>
                <span className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400">11.2 Mnt</span>
                <span className="text-[10px] font-semibold text-blue-600 flex items-center gap-0.5 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> 98.4% Tepat Waktu
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Indeks SKM</span>
                <span className="text-lg sm:text-xl font-black text-amber-500">3.92 / 4.00</span>
                <span className="text-[10px] font-semibold text-amber-600 flex items-center gap-0.5 mt-0.5">
                  <Award className="w-3 h-3" /> Sangat Baik (A)
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Online Booking</span>
                <span className="text-lg sm:text-xl font-black text-teal-600 dark:text-teal-400">38.5%</span>
                <span className="text-[10px] font-semibold text-teal-600 flex items-center gap-0.5 mt-0.5">
                  <Zap className="w-3 h-3" /> Bebas Antre Lobi
                </span>
              </div>
            </div>

            {/* TAB 1: Jam Sibuk & Rekomendasi Kedatangan */}
            {activeTab === 'peak' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <strong className="block text-emerald-800 dark:text-emerald-300 font-extrabold mb-0.5">
                      💡 Rekomendasi Waktu Kunjungan Terbaik:
                    </strong>
                    Datanglah pada rentang jam <strong>08:00 - 09:00 WITA</strong> atau <strong>13:30 - 15:00 WITA</strong>. Pada waktu ini antrean gerai sangat lancar dan durasi tunggu di bawah 5 menit!
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between text-xs font-extrabold">
                    <span>Rentang Jam Layanan</span>
                    <span>Tingkat Kepadatan Pengunjung</span>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {peakHourData.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold">{item.hour}</span>
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            {item.visitors} pemohon ({item.status})
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.color}`}
                            style={{ width: `${(item.visitors / 450) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Top Instansi & SLA */}
            {activeTab === 'agencies' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Peringkat gerai instansi berdasarkan volume pemohon dan kepatuhan standar SLA pelayanan:
                </p>

                <div className="space-y-2.5">
                  {topAgencies.map((agency, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black text-xs shrink-0">
                          #{idx + 1}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold truncate">{agency.name}</h4>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            SLA Rata-rata: <strong className="text-emerald-600 dark:text-emerald-400">{agency.slaAvg}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block">
                          {agency.count}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {agency.percent}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: Demografi & Metode Kedatangan */}
            {activeTab === 'demographics' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Sebaran Pemohon per Kecamatan di Kab. Luwu
                  </h4>
                  <div className="space-y-2.5">
                    {districtData.map((dist, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{dist.name}</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{dist.share} ({dist.count})</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: dist.share }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Indeks SKM & Kepuasan Warga */}
            {activeTab === 'skm' && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/30 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">3.92 / 4.00</h3>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Indeks Kepuasan Masyarakat (IKM/SKM) Kategori A (Sangat Baik)
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Berdasarkan survei elektronik mandiri dari 1,840 responden pemohon di MPP Simpurusiang Kab. Luwu.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Bar */}
          <div className="p-4 px-5 sm:px-7 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200/80 dark:border-slate-800 shrink-0 flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-500" /> Diperbarui secara otomatis
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-extrabold transition-all cursor-pointer shadow-md"
            >
              Tutup Ringkasan
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
