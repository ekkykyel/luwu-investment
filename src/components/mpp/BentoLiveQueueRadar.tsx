import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Clock, 
  Ticket, 
  RefreshCw, 
  CheckCircle2, 
  ArrowUpRight, 
  Activity,
  ShieldCheck
} from 'lucide-react';
import { PreLaunchBanner } from '../common/PreLaunchBanner';
import { MPP_TYPOGRAPHY, MPP_CARD_SURFACE } from '../common/MppCard';
import { supabase } from '../../lib/supabaseClient';

export interface CounterQueueItem {
  id: string;
  agencyName: string;
  shortName: string;
  loketNo: string;
  currentNumber: string;
  totalWaiting: number;
  avgWaitMins: number;
  status: 'active' | 'busy' | 'break' | 'closed';
  category: 'Kependudukan' | 'Perizinan' | 'Perpajakan' | 'Agraria' | 'Kesehatan' | 'Ketenagakerjaan' | 'Perbankan & BUMN' | 'Lainnya';
}

// 20 Official Counters of MPP Simpurusiang Kab. Luwu (Zero Dummy Policy: Truthful Initial State)
const OFFICIAL_20_COUNTERS: CounterQueueItem[] = [
  { id: '1', agencyName: 'Dinas Penanaman Modal & PTSP', shortName: 'DPMPTSP (OSS-RBA & Izin)', loketNo: '01', currentNumber: '-', totalWaiting: 0, avgWaitMins: 15, status: 'active', category: 'Perizinan' },
  { id: '2', agencyName: 'Dinas Kependudukan & Pencatatan Sipil', shortName: 'Disdukcapil (KTP-el & KK)', loketNo: '02', currentNumber: '-', totalWaiting: 0, avgWaitMins: 10, status: 'active', category: 'Kependudukan' },
  { id: '3', agencyName: 'Dinas Pekerjaan Umum & Tata Ruang', shortName: 'Dinas PUPTR (PKKPR & PBG)', loketNo: '03', currentNumber: '-', totalWaiting: 0, avgWaitMins: 15, status: 'active', category: 'Perizinan' },
  { id: '4', agencyName: 'Badan Pendapatan Daerah', shortName: 'Bapenda (PBB-P2 & BPHTB)', loketNo: '04', currentNumber: '-', totalWaiting: 0, avgWaitMins: 10, status: 'active', category: 'Perpajakan' },
  { id: '5', agencyName: 'BPJS Ketenagakerjaan Luwu', shortName: 'BPJS Ketenagakerjaan', loketNo: '05', currentNumber: '-', totalWaiting: 0, avgWaitMins: 12, status: 'active', category: 'Ketenagakerjaan' },
  { id: '6', agencyName: 'BPJS Kesehatan Cabang Palopo / Luwu', shortName: 'BPJS Kesehatan (JKN-KIS)', loketNo: '06', currentNumber: '-', totalWaiting: 0, avgWaitMins: 10, status: 'active', category: 'Kesehatan' },
  { id: '7', agencyName: 'Bank Sulselbar Cabang Belopa', shortName: 'Bank Sulselbar (Kas & Pajak)', loketNo: '07', currentNumber: '-', totalWaiting: 0, avgWaitMins: 8, status: 'active', category: 'Perbankan & BUMN' },
  { id: '8', agencyName: 'SAMSAT Wilayah Luwu', shortName: 'SAMSAT Belopa (PKB)', loketNo: '08', currentNumber: '-', totalWaiting: 0, avgWaitMins: 10, status: 'active', category: 'Perpajakan' },
  { id: '9', agencyName: 'KPP Pratama Palopo (Pojok Pajak)', shortName: 'KPP Pratama (NPWP & SPT)', loketNo: '09', currentNumber: '-', totalWaiting: 0, avgWaitMins: 15, status: 'active', category: 'Perpajakan' },
  { id: '10', agencyName: 'Kejaksaan Negeri Luwu', shortName: 'Kejaksaan Negeri (Datun)', loketNo: '10', currentNumber: '-', totalWaiting: 0, avgWaitMins: 15, status: 'active', category: 'Lainnya' },
  { id: '11', agencyName: 'PT. Taspen (Persero)', shortName: 'PT. Taspen (Pensiun ASN)', loketNo: '11', currentNumber: '-', totalWaiting: 0, avgWaitMins: 12, status: 'active', category: 'Perbankan & BUMN' },
  { id: '12', agencyName: 'Dinas Sosial Kab. Luwu', shortName: 'Dinas Sosial (DTKS & Bansos)', loketNo: '12', currentNumber: '-', totalWaiting: 0, avgWaitMins: 10, status: 'active', category: 'Kependudukan' },
  { id: '13', agencyName: 'Dinas Tenaga Kerja & Transmigrasi', shortName: 'Disnakertrans (Kartu AK-1)', loketNo: '13', currentNumber: '-', totalWaiting: 0, avgWaitMins: 10, status: 'active', category: 'Ketenagakerjaan' },
  { id: '14', agencyName: 'Dinas Perikanan Kab. Luwu', shortName: 'Dinas Perikanan (Izin Tambak)', loketNo: '14', currentNumber: '-', totalWaiting: 0, avgWaitMins: 15, status: 'active', category: 'Perizinan' },
  { id: '15', agencyName: 'Dinas Kominfo Kab. Luwu', shortName: 'Dinas Kominfo (TTE & CSIRT)', loketNo: '15', currentNumber: '-', totalWaiting: 0, avgWaitMins: 15, status: 'active', category: 'Lainnya' },
  { id: '16', agencyName: 'PDAM Tirta Luwu', shortName: 'PDAM Tirta Luwu (Pasang Baru)', loketNo: '16', currentNumber: '-', totalWaiting: 0, avgWaitMins: 10, status: 'active', category: 'Perbankan & BUMN' },
  { id: '17', agencyName: 'DEKRANASDA Luwu & Galeri UMKM', shortName: 'DEKRANASDA (Kemitraan UMKM)', loketNo: '17', currentNumber: '-', totalWaiting: 0, avgWaitMins: 15, status: 'active', category: 'Lainnya' },
  { id: '18', agencyName: 'HAS International Center', shortName: 'HAS International (Vokasi)', loketNo: '18', currentNumber: '-', totalWaiting: 0, avgWaitMins: 15, status: 'active', category: 'Lainnya' },
  { id: '19', agencyName: 'PT. Nevis Sertifikasi', shortName: 'PT. Nevis (Kompetensi)', loketNo: '19', currentNumber: '-', totalWaiting: 0, avgWaitMins: 15, status: 'active', category: 'Lainnya' },
  { id: '20', agencyName: 'Kantor Pertanahan (ATR/BPN) Luwu', shortName: 'BPN Luwu (Sertipikat & Hak)', loketNo: '20', currentNumber: '-', totalWaiting: 0, avgWaitMins: 20, status: 'active', category: 'Agraria' },
];

const CHIP_CATEGORIES = [
  { id: 'Semua', key: 'counters.filter_all', defaultLabel: 'Semua' },
  { id: 'Perizinan', key: 'counters.filter_permit', defaultLabel: 'Perizinan' },
  { id: 'Kependudukan', key: 'counters.filter_civil', defaultLabel: 'Kependudukan' },
  { id: 'Perpajakan', key: 'counters.filter_tax', defaultLabel: 'Perpajakan' },
  { id: 'Agraria', key: 'counters.filter_land', defaultLabel: 'Agraria' },
  { id: 'Kesehatan', key: 'counters.filter_health', defaultLabel: 'Kesehatan' },
  { id: 'Ketenagakerjaan', key: 'counters.filter_labor', defaultLabel: 'Ketenagakerjaan' },
  { id: 'Perbankan & BUMN', key: 'counters.filter_banking', defaultLabel: 'Perbankan & BUMN' },
  { id: 'Lainnya', key: 'counters.filter_others', defaultLabel: 'Lainnya' },
];

export interface BentoLiveQueueRadarProps {
  onRegisterQueue?: (serviceName?: string) => void;
  isDark?: boolean;
  totalAgencies?: number;
}

export const BentoLiveQueueRadar: React.FC<BentoLiveQueueRadarProps> = ({
  onRegisterQueue,
  isDark = false,
  totalAgencies = 20,
}) => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [counters, setCounters] = useState<CounterQueueItem[]>(OFFICIAL_20_COUNTERS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTicket, setSearchTicket] = useState('');
  const [trackResult, setTrackResult] = useState<string | null>(null);

  // Honest Supabase mpp_queues Sync
  const syncLiveQueues = useCallback(async () => {
    try {
      const { data: activeTickets, error } = await supabase
        .from('mpp_queues')
        .select('ticket_code, queue_number, status, tenant_id, tenant:mpp_tenants(name, code)')
        .in('status', ['menunggu', 'dipanggil', 'sedang_dilayani']);

      if (!error && Array.isArray(activeTickets)) {
        setCounters(prev => prev.map(c => {
          const tenantMatches = activeTickets.filter((item: any) => {
            const tName = String(item.tenant?.name || '').toLowerCase();
            const tCode = String(item.tenant?.code || '').toLowerCase();
            const cName = c.agencyName.toLowerCase();
            return cName.includes(tName) || tName.includes(cName) || (tCode && c.shortName.toLowerCase().includes(tCode));
          });

          const callingTicket = tenantMatches.find((item: any) => item.status === 'dipanggil' || item.status === 'sedang_dilayani');
          const waitingCount = tenantMatches.filter((item: any) => item.status === 'menunggu').length;

          return {
            ...c,
            currentNumber: callingTicket ? callingTicket.ticket_code : '-',
            totalWaiting: waitingCount,
            status: callingTicket ? 'busy' : 'active'
          };
        }));
      }
    } catch (err) {
      console.warn('[BentoLiveQueueRadar] Note syncing live queues:', err);
    }
  }, []);

  useEffect(() => {
    syncLiveQueues();
  }, [syncLiveQueues]);

  const filteredCounters = useMemo(() => {
    if (selectedCategory === 'Semua') return counters;
    return counters.filter(c => c.category === selectedCategory);
  }, [selectedCategory, counters]);

  const totalWaiting = useMemo(() => counters.reduce((acc, c) => acc + c.totalWaiting, 0), [counters]);
  const activeCountersCount = useMemo(() => counters.filter(c => c.status === 'active' || c.status === 'busy').length, [counters]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await syncLiveQueues();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  const handleTrackTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTicket.trim()) return;
    const clean = searchTicket.toUpperCase().trim();
    
    // Check locally first
    const match = counters.find(c => c.currentNumber === clean);
    if (match) {
      setTrackResult(`Nomor ${clean} saat ini sedang dipanggil di Loket ${match.loketNo} (${match.shortName}). Silakan merapat ke loket.`);
      return;
    }

    // Query Supabase directly for accurate honest status
    try {
      const { data, error } = await supabase
        .from('mpp_queues')
        .select('ticket_code, status, tenant:mpp_tenants(name)')
        .eq('ticket_code', clean)
        .maybeSingle();

      if (!error && data) {
        const agency = (data as any).tenant?.name || 'Gerai Pelayanan';
        const st = data.status === 'menunggu' ? 'dalam antrean tunggu' : data.status === 'selesai_langsung' ? 'telah selesai dilayani' : 'terdaftar';
        setTrackResult(`Tiket ${clean} (${agency}) berstatus: ${st}. Pantau panggilan audio dan layar antrean di ruang tunggu.`);
      } else {
        setTrackResult(`Nomor tiket ${clean} tidak ditemukan pada daftar antrean aktif hari ini. Pastikan format nomor sesuai struk antrean.`);
      }
    } catch {
      setTrackResult(`Gagal memverifikasi tiket ${clean}. Silakan hubungi meja informasi di lantai 1.`);
    }
  };

  return (
    <section id="smart-live-queue" className="w-full space-y-5 sm:space-y-6 scroll-mt-36 sm:scroll-mt-40">
      <PreLaunchBanner 
        isDark={isDark} 
        dataCount={totalWaiting} 
        context="portal-mpp" 
      />
      
      {/* 1. SECTION HEADER WITH SULAPA EPPA EYEBROW */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className={`${MPP_TYPOGRAPHY.eyebrow} inline-flex items-center gap-2`}>
            <span aria-hidden="true" className="w-1.5 h-1.5 rotate-45 bg-[#C9A24B]" />
            <span>{t('counters.radar_badge', 'Radar Antrean & SLA Pelayanan')}</span>
          </div>
          <h2 className={MPP_TYPOGRAPHY.sectionTitle}>
            {t('counters.title', 'Transparansi Loket Terpadu')}
          </h2>
          <p className={`${MPP_TYPOGRAPHY.sectionSubtitle} max-w-xl`}>
            {t('counters.subtitle', 'Pantau operasional 20 gerai layanan terpadu secara real-time dari mana saja.')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`min-h-[40px] flex items-center gap-2 px-4 py-2 rounded-xl ${MPP_CARD_SURFACE.default} text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#0F6B4F]/40 transition-all cursor-pointer active:scale-95 disabled:opacity-50`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#0F6B4F] dark:text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? t('counters.syncing_btn', 'Memperbarui...') : t('counters.sync_btn', 'Sinkronisasi')}</span>
          </button>
        </div>
      </div>

      {/* 2. SUMMARY TILES — High-Contrast Accessible Typography */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Tile 1: Hero Operational Status */}
        <div className={`${MPP_CARD_SURFACE.paddingLg} ${MPP_CARD_SURFACE.radiusMain} bg-[#0F6B4F] dark:bg-[#0D2338] border border-[#0B543E] dark:border-[#C9A24B]/25 text-white flex flex-col justify-between space-y-4 relative overflow-hidden`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#F5DFA0]">
              {t('counters.status_badge', 'Status Operasional')}
            </span>
            <Activity className="w-5 h-5 text-[#F5DFA0]" />
          </div>

          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight tabular-nums text-white">
              {activeCountersCount} / {totalAgencies}
            </div>
            <div className="text-sm text-emerald-50/95 dark:text-slate-300 font-normal">
              {t('counters.status_sub', 'Gerai Instansi Siap & Beroperasi Normal')}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/15 dark:border-white/[0.08] text-xs text-emerald-50 dark:text-slate-300">
            <span>{t('counters.total_active_queue', 'Total Antrean Menunggu:')}</span>
            <span className="font-extrabold text-white dark:text-emerald-300 font-mono tabular-nums">{totalWaiting} {t('counters.unit_people', 'Orang')}</span>
          </div>
        </div>

        {/* Tile 2: SLA & Waktu Tunggu Rata-Rata */}
        <div 
          onClick={() => {
            const el = document.getElementById('maklumat-pelayanan-sla');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`${MPP_CARD_SURFACE.paddingLg} ${MPP_CARD_SURFACE.radiusMain} ${MPP_CARD_SURFACE.default} flex flex-col justify-between space-y-3 cursor-pointer group hover:border-[#0F6B4F]/45 transition-all duration-200 active:scale-[0.99]`}
          title="Klik untuk melihat rincian Maklumat Pelayanan & Standar SLA per jenis izin"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#0F6B4F] dark:text-emerald-400">
              {t('counters.sla_badge', 'Komitmen Standar Pelayanan (SPM)')}
            </span>
            <Clock className="w-5 h-5 text-[#0F6B4F] dark:text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>

          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-900 dark:text-slate-50 tabular-nums">
              ≤ 15 <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 font-sans">{t('counters.sla_unit', 'Menit')}</span>
            </div>
            <div className={MPP_TYPOGRAPHY.cardBody}>
              {t('counters.sla_avg_label', 'Maksimal Waktu Pelayanan di Loket Front Office')}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#E5DFD3] dark:border-white/[0.07] text-xs text-[#0F6B4F] dark:text-emerald-400 font-bold">
            <div className="flex items-center gap-1.5 min-w-0">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="truncate">{t('counters.sla_guarantee', '100% Bebas Retribusi & Pungutan Liar')}</span>
            </div>
            <span className="text-[11px] text-slate-500 group-hover:text-[#0F6B4F] dark:group-hover:text-emerald-300 transition-colors shrink-0 ml-1">
              Maklumat SLA ↗
            </span>
          </div>
        </div>

        {/* Tile 3: Pelacak Nomor Tiket Instan */}
        <div className={`${MPP_CARD_SURFACE.paddingLg} ${MPP_CARD_SURFACE.radiusMain} ${MPP_CARD_SURFACE.default} flex flex-col justify-between space-y-3`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#855A14] dark:text-[#E2C475]">
              {t('counters.track_badge', 'Lacak Nomor Antrean')}
            </span>
            <Ticket className="w-5 h-5 text-[#855A14] dark:text-[#E2C475]" />
          </div>

          <form onSubmit={handleTrackTicket} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTicket}
                onChange={(e) => setSearchTicket(e.target.value)}
                placeholder={t('counters.track_placeholder', 'CONTOH: MPP-001 ATAU KODE TIKET')}
                className="w-full min-h-[42px] px-3.5 py-2 text-xs font-mono uppercase bg-[#FAF8F3] dark:bg-[#132E48] border border-[#DFD8CA] dark:border-white/[0.10] rounded-xl text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0F6B4F]/30"
              />
              <button
                type="submit"
                className="min-h-[42px] px-4 py-2 bg-[#0F6B4F] hover:bg-[#0B543E] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer active:scale-95 transition-all"
              >
                {t('counters.track_btn', 'Cek')}
              </button>
            </div>
            {trackResult && (
              <p className="text-xs text-[#0F6B4F] dark:text-emerald-400 font-medium leading-relaxed bg-[#FAF8F3] dark:bg-[#0A1E30] p-2 rounded-lg border border-[#0F6B4F]/20">
                {trackResult}
              </p>
            )}
          </form>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            {t('counters.track_helper', 'Ketik nomor tiket dari struk fisik atau konfirmasi pendaftaran Anda.')}
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE FILTER TABS */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none pb-1 pt-1 touch-pan-x">
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
              className={`min-h-[38px] px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer active:scale-95 border ${
                isSelected
                  ? 'bg-[#0F6B4F] dark:bg-emerald-600 text-white border-[#0F6B4F] dark:border-emerald-500'
                  : 'bg-white dark:bg-[#0D2338] border-[#E2DACB] dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:border-[#0F6B4F]/40'
              }`}
            >
              <span>{t(cat.key, cat.defaultLabel)}</span>
              <span className={`font-mono text-[11px] tabular-nums ${
                isSelected ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. FILTERED COUNTER GRID */}
      <motion.div 
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4"
      >
        <AnimatePresence>
          {filteredCounters.map((counter) => (
            <motion.div
              layout
              key={counter.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className={`${MPP_CARD_SURFACE.paddingSm} ${MPP_CARD_SURFACE.default} hover:border-[#0F6B4F]/50 dark:hover:border-emerald-400/50 hover:shadow-[0_10px_26px_-6px_rgba(16,185,129,0.18)] dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.6)] transition-all duration-300 flex flex-col justify-between space-y-3 group`}
            >
              {/* Clean Unboxed Top Metadata */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#EFEAE0] dark:border-white/[0.06] text-[11px] font-semibold">
                <span className="font-mono font-bold text-[#855A14] dark:text-[#E2C475] uppercase tracking-wider">
                  {t('counters.card_loket', 'Loket')} {counter.loketNo}
                </span>
                <span className={`inline-flex items-center gap-1.5 ${
                  counter.status === 'busy'
                    ? 'text-amber-700 dark:text-amber-400 font-bold'
                    : 'text-[#0F6B4F] dark:text-emerald-400 font-semibold'
                }`}>
                  {counter.status === 'busy' ? (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                    </span>
                  ) : (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400/40 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0F6B4F] dark:bg-emerald-400" />
                    </span>
                  )}
                  <span>{counter.status === 'busy' ? t('counters.card_status_serving', 'Melayani') : t('counters.card_status_ready', 'Siap Melayani')}</span>
                </span>
              </div>

              {/* Title & Agency Name */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 leading-snug font-sans line-clamp-1 group-hover:text-[#0F6B4F] dark:group-hover:text-emerald-400 transition-colors">
                  {counter.shortName}
                </h3>
                <span className="text-xs font-sans text-slate-500 dark:text-slate-400 truncate block mt-0.5">
                  {counter.agencyName}
                </span>
              </div>

              {/* Serving Number Box */}
              <div className="p-3 rounded-xl bg-[#FAF8F3] dark:bg-[#132E48] border border-[#EAE3D5] dark:border-white/[0.06] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    {t('counters.card_now_calling', 'Nomor Panggilan')}
                  </span>
                  <span className="text-2xl font-black font-mono text-[#0F6B4F] dark:text-emerald-400 tabular-nums">
                    {counter.currentNumber}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    {t('counters.card_waiting', 'Menunggu')}
                  </span>
                  <span className="text-base font-extrabold font-mono text-slate-800 dark:text-slate-200 tabular-nums">
                    {counter.totalWaiting} <span className="text-[11px] font-sans font-normal text-slate-500">{t('counters.card_person_unit', 'org')}</span>
                  </span>
                </div>
              </div>

              {/* CTA Action */}
              <button
                type="button"
                onClick={() => onRegisterQueue && onRegisterQueue(counter.agencyName)}
                className="w-full min-h-[38px] py-2 px-3 rounded-xl bg-[#F2EFE7] hover:bg-[#0F6B4F] dark:bg-[#132E48] dark:hover:bg-emerald-600 text-slate-800 hover:text-white dark:text-slate-200 dark:hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>{t('counters.card_get_ticket', 'Ambil Tiket').replace('↗', '').trim()}</span>
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
