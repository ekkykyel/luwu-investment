import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Clock, 
  Ticket, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  Sparkles,
  TrendingUp,
  Activity,
  Layers
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { PreLaunchBanner } from '../common/PreLaunchBanner';
import { Badge } from '../common/Badge';
import { MPP_TYPOGRAPHY, MPP_CARD_SURFACE } from '../common/MppCard';

export interface CounterQueueItem {
  id: string;
  agencyName: string;
  shortName: string;
  loketNo: string;
  currentNumber: string;
  totalWaiting: number;
  avgWaitMins: number;
  status: 'active' | 'busy' | 'break' | 'closed';
  category: 'Kependudukan' | 'Perizinan' | 'Perpajakan' | 'Agraria' | 'Kesehatan' | 'Ketenagakerjaan' | 'Keimigrasian' | 'Lainnya';
}

const INITIAL_COUNTERS: CounterQueueItem[] = [
  { id: '1', agencyName: 'Dinas Kependudukan & Pencatatan Sipil', shortName: 'Disdukcapil (KTP-el)', loketNo: '01', currentNumber: 'A-042', totalWaiting: 5, avgWaitMins: 8, status: 'active', category: 'Kependudukan' },
  { id: '2', agencyName: 'Dinas Kependudukan & Pencatatan Sipil', shortName: 'Disdukcapil (KK/Akta)', loketNo: '02', currentNumber: 'A-038', totalWaiting: 3, avgWaitMins: 6, status: 'active', category: 'Kependudukan' },
  { id: '3', agencyName: 'Dinas Penanaman Modal & PTSP', shortName: 'DPMPTSP (Izin NIB OSS)', loketNo: '03', currentNumber: 'B-014', totalWaiting: 2, avgWaitMins: 15, status: 'busy', category: 'Perizinan' },
  { id: '4', agencyName: 'Dinas Penanaman Modal & PTSP', shortName: 'DPMPTSP (Non-OSS & Rekom)', loketNo: '04', currentNumber: 'B-009', totalWaiting: 1, avgWaitMins: 12, status: 'active', category: 'Perizinan' },
  { id: '5', agencyName: 'Badan Pendapatan Daerah', shortName: 'Bapenda (PBB-P2 & BPHTB)', loketNo: '05', currentNumber: 'C-021', totalWaiting: 4, avgWaitMins: 7, status: 'active', category: 'Perpajakan' },
  { id: '6', agencyName: 'SAMSAT Wilayah Luwu', shortName: 'SAMSAT (Pajak Kendaraan)', loketNo: '06', currentNumber: 'C-055', totalWaiting: 8, avgWaitMins: 10, status: 'busy', category: 'Perpajakan' },
  { id: '7', agencyName: 'Kantor Pertanahan Kab. Luwu', shortName: 'BPN (Peralihan Hak)', loketNo: '07', currentNumber: 'D-007', totalWaiting: 2, avgWaitMins: 20, status: 'active', category: 'Agraria' },
  { id: '8', agencyName: 'Kantor Pertanahan Kab. Luwu', shortName: 'BPN (Roya & SKPT)', loketNo: '08', currentNumber: 'D-004', totalWaiting: 0, avgWaitMins: 5, status: 'active', category: 'Agraria' },
  { id: '9', agencyName: 'BPJS Kesehatan Cabang Palopo/Luwu', shortName: 'BPJS Kesehatan (JKN)', loketNo: '09', currentNumber: 'E-031', totalWaiting: 6, avgWaitMins: 9, status: 'busy', category: 'Kesehatan' },
  { id: '10', agencyName: 'BPJS Ketenagakerjaan Luwu', shortName: 'BPJS Ketenagakerjaan', loketNo: '10', currentNumber: 'E-012', totalWaiting: 2, avgWaitMins: 11, status: 'active', category: 'Ketenagakerjaan' },
  { id: '11', agencyName: 'Kantor Imigrasi Palopo/Luwu', shortName: 'Imigrasi (E-Paspor)', loketNo: '11', currentNumber: 'F-005', totalWaiting: 3, avgWaitMins: 18, status: 'active', category: 'Keimigrasian' },
  { id: '12', agencyName: 'Polres Luwu (SKCK & SIM Corner)', shortName: 'Polres Luwu (SKCK)', loketNo: '12', currentNumber: 'G-019', totalWaiting: 4, avgWaitMins: 10, status: 'active', category: 'Kependudukan' },
];

const CHIP_CATEGORIES = [
  { id: 'Semua', key: 'counters.filter_all', defaultLabel: 'Semua' },
  { id: 'Kependudukan', key: 'counters.filter_civil', defaultLabel: 'Kependudukan' },
  { id: 'Perizinan', key: 'counters.filter_permit', defaultLabel: 'Perizinan' },
  { id: 'Perpajakan', key: 'counters.filter_tax', defaultLabel: 'Perpajakan' },
  { id: 'Agraria', key: 'counters.filter_land', defaultLabel: 'Agraria' },
  { id: 'Kesehatan', key: 'counters.filter_health', defaultLabel: 'Kesehatan' },
  { id: 'Ketenagakerjaan', key: 'counters.filter_labor', defaultLabel: 'Ketenagakerjaan' },
  { id: 'Keimigrasian', key: 'counters.filter_immigration', defaultLabel: 'Keimigrasian' },
];

export interface BentoLiveQueueRadarProps {
  onRegisterQueue?: (serviceName?: string) => void;
  isDark?: boolean;
}

export const BentoLiveQueueRadar: React.FC<BentoLiveQueueRadarProps> = ({
  onRegisterQueue,
  isDark = false,
}) => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [counters, setCounters] = useState<CounterQueueItem[]>(INITIAL_COUNTERS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTicket, setSearchTicket] = useState('');
  const [trackResult, setTrackResult] = useState<string | null>(null);

  // Filter counters based on selected chip
  const filteredCounters = useMemo(() => {
    if (selectedCategory === 'Semua') return counters;
    return counters.filter(c => c.category === selectedCategory);
  }, [selectedCategory, counters]);

  // Total stats
  const totalWaiting = useMemo(() => counters.reduce((acc, c) => acc + c.totalWaiting, 0), [counters]);
  const activeCountersCount = useMemo(() => counters.filter(c => c.status === 'active' || c.status === 'busy').length, [counters]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Simulate real-time tick increment
      setCounters(prev => prev.map(c => ({
        ...c,
        totalWaiting: Math.max(0, c.totalWaiting + (Math.random() > 0.6 ? 1 : Math.random() > 0.3 ? -1 : 0))
      })));
      setIsRefreshing(false);
    }, 600);
  };

  const handleTrackTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTicket.trim()) return;
    const clean = searchTicket.toUpperCase().trim();
    const match = counters.find(c => c.currentNumber === clean);
    if (match) {
      setTrackResult(`Nomor ${clean} sedang dipanggil di Loket ${match.loketNo} (${match.shortName}). Silakan merapat ke loket!`);
    } else {
      setTrackResult(`Nomor ${clean} tercatat dalam sistem. Estimasi giliran 2 antrean lagi (~10 menit).`);
    }
  };

  return (
    <section id="smart-live-queue" className="w-full space-y-4 sm:space-y-6 scroll-mt-36 sm:scroll-mt-40">
      <PreLaunchBanner 
        isDark={isDark} 
        dataCount={totalWaiting} 
        context="portal-mpp" 
      />
      
      {/* 1. SECTION HEADER WITH STANDARDIZED EYEBROW & STATUS */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <Badge variant="status" tone="primary">
            {t('counters.radar_badge', 'RADAR ANTREAN & SLA PELAYANAN REAL-TIME')}
          </Badge>
          <h2 className={MPP_TYPOGRAPHY.sectionTitle}>
            {t('counters.title', 'Transparansi Loket Terpadu')}
          </h2>
          <p className={`${MPP_TYPOGRAPHY.sectionSubtitle} max-w-xl`}>
            {t('counters.subtitle', 'Pantau pergerakan antrean dari rumah tanpa perlu menunggu di loket fisik.')}
          </p>
        </div>

        {/* Live Status Indicator & Refresh */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl ${MPP_CARD_SURFACE.layer1} text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-500/40 transition-all cursor-pointer active:scale-95 disabled:opacity-50`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? t('counters.syncing_btn', 'Memperbarui...') : t('counters.sync_btn', 'Sinkronisasi')}</span>
          </button>
        </div>
      </div>

      {/* 2. ASYMMETRIC BENTO GRID SUMMARY TILES — Standardized p-5 sm:p-6 & rounded-2xl */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Bento Tile 1: Hero Operational Status */}
        <div className={`${MPP_CARD_SURFACE.paddingLg} ${MPP_CARD_SURFACE.radiusMain} bg-emerald-700 dark:bg-[#0F2D4A] border border-emerald-600 dark:border-emerald-500/25 text-white flex flex-col justify-between space-y-4 relative overflow-hidden`}>
          <div className="flex items-center justify-between">
            <Badge variant="status" tone="primary">
              {t('counters.status_badge', 'STATUS HARI INI')}
            </Badge>
            <Activity className="w-5 h-5 text-emerald-300" />
          </div>

          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black font-sans tracking-tight tabular-nums text-white dark:text-slate-50">
              {activeCountersCount} / 20
            </div>
            <div className="text-sm text-emerald-100 dark:text-slate-300 font-normal">
              {t('counters.status_sub', 'Loket Pelayanan Sedang Aktif Melayani')}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/15 dark:border-white/[0.07] text-xs text-emerald-50 dark:text-slate-300">
            <span>{t('counters.total_active_queue', 'Total Antrean Aktif:')}</span>
            <span className="font-extrabold text-white dark:text-emerald-400 font-sans tabular-nums">{totalWaiting} {t('counters.unit_people', 'Orang')}</span>
          </div>
        </div>

        {/* Bento Tile 2: SLA & Waktu Tunggu Rata-Rata */}
        <div 
          onClick={() => {
            const el = document.getElementById('maklumat-pelayanan-sla');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`${MPP_CARD_SURFACE.paddingLg} ${MPP_CARD_SURFACE.radiusMain} ${MPP_CARD_SURFACE.layer1} flex flex-col justify-between space-y-3 cursor-pointer group hover:border-emerald-500/50 transition-all duration-200 active:scale-[0.99]`}
          title="Klik untuk melihat rincian Maklumat Pelayanan & Standar SLA per jenis izin"
        >
          <div className="flex items-center justify-between">
            <Badge variant="category" tone="success">
              {t('counters.sla_badge', 'KOMITMEN SLA')}
            </Badge>
            <Clock className="w-5 h-5 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform" />
          </div>

          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black font-sans tracking-tight text-slate-900 dark:text-slate-50 tabular-nums">
              ~11.5 <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 font-sans">{t('counters.sla_unit', 'Menit')}</span>
            </div>
            <div className={MPP_TYPOGRAPHY.cardBody}>
              {t('counters.sla_avg_label', 'Rata-rata Waktu Pelayanan per Berkas')}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200/70 dark:border-white/[0.07] text-xs text-emerald-700 dark:text-emerald-400 font-bold">
            <div className="flex items-center gap-1.5 min-w-0">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="truncate">{t('counters.sla_guarantee', '98.4% Tuntas Sesuai Standar Layanan')}</span>
            </div>
            <span className="text-[11px] text-slate-400 group-hover:text-emerald-500 transition-colors shrink-0 ml-1">
              Rincian SLA ↗
            </span>
          </div>
        </div>

        {/* Bento Tile 3: Pelacak Nomor Tiket Instan */}
        <div className={`${MPP_CARD_SURFACE.paddingLg} ${MPP_CARD_SURFACE.radiusMain} ${MPP_CARD_SURFACE.layer1} flex flex-col justify-between space-y-3`}>
          <div className="flex items-center justify-between">
            <Badge variant="category" tone="info">
              {t('counters.track_badge', 'LACAK NOMOR ANTREAN')}
            </Badge>
            <Ticket className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          </div>

          <form onSubmit={handleTrackTicket} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTicket}
                onChange={(e) => setSearchTicket(e.target.value)}
                placeholder={t('counters.track_placeholder', 'CONTOH: A-042')}
                className={`w-full px-3 py-2 text-xs font-mono uppercase ${MPP_CARD_SURFACE.layer2} rounded-xl text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/40`}
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer active:scale-95 transition-all"
              >
                {t('counters.track_btn', 'Cek')}
              </button>
            </div>
            {trackResult && (
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium leading-tight">
                {trackResult}
              </p>
            )}
          </form>

          <div className={MPP_TYPOGRAPHY.meta}>
            {t('counters.track_helper', 'Ketik nomor tiket dari struk fisik atau notifikasi WhatsApp Anda.')}
          </div>
        </div>
      </div>

      {/* 3. MATERIAL CHIP FILTERS */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none pb-1 pt-2 touch-pan-x">
        {CHIP_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = cat.id === 'Semua' 
            ? counters.length 
            : counters.filter(c => c.category === cat.id).length;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer active:scale-95 border ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : `${MPP_CARD_SURFACE.layer1} text-slate-700 dark:text-slate-300 hover:border-emerald-500/40`
              }`}
            >
              <span>{t(cat.key, cat.defaultLabel)}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] tabular-nums ${
                isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-[#143755] text-slate-500 dark:text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. FILTERED COUNTER BENTO GRID — Standardized Card Kecil (p-4, rounded-2xl) */}
      <motion.div 
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
      >
        <AnimatePresence>
          {filteredCounters.map((counter) => (
            <motion.div
              layout
              key={counter.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`${MPP_CARD_SURFACE.paddingSm} ${MPP_CARD_SURFACE.radiusMain} ${MPP_CARD_SURFACE.layer1} hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-3 group`}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2">
                <Badge variant="category" tone="primary">
                  {t('counters.card_loket', 'Loket')} {counter.loketNo}
                </Badge>

                <Badge
                  variant="status"
                  tone={counter.status === 'busy' ? 'warning' : 'primary'}
                >
                  {counter.status === 'busy' ? t('counters.card_status_serving', 'Melayani') : t('counters.card_status_ready', 'Siap')}
                </Badge>
              </div>

              {/* Title */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 leading-snug font-sans line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {counter.shortName}
                </h3>
                <span className={`${MPP_TYPOGRAPHY.meta} truncate block mt-0.5`}>
                  {counter.agencyName}
                </span>
              </div>

              {/* Serving Number Hero Box — Layer 2 (#143755) */}
              <div className={`p-3 ${MPP_CARD_SURFACE.radiusSub} ${MPP_CARD_SURFACE.layer2} flex items-center justify-between`}>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    {t('counters.card_now_calling', 'SEDANG DIPANGGIL')}
                  </span>
                  <span className="text-2xl font-black font-sans text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {counter.currentNumber}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    {t('counters.card_waiting', 'MENUNGGU')}
                  </span>
                  <span className="text-base font-extrabold font-['Plus_Jakarta_Sans',sans-serif] text-slate-700 dark:text-slate-300 tabular-nums">
                    {counter.totalWaiting} <span className="text-[10px] font-sans font-normal">{t('counters.card_person_unit', 'org')}</span>
                  </span>
                </div>
              </div>

              {/* CTA Action */}
              <button
                type="button"
                onClick={() => onRegisterQueue && onRegisterQueue(counter.agencyName)}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-600 text-slate-700 hover:text-white dark:text-slate-200 dark:hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
              >
                <span>{t('counters.card_get_ticket', 'Ambil Tiket ↗').replace('↗', '').trim()}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
};

export default BentoLiveQueueRadar;
