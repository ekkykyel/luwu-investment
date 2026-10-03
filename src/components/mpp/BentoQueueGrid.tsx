import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Clock, 
  Ticket, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  Sparkles,
  Inbox,
  Activity,
  Layers,
  Search
} from 'lucide-react';

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
  serviceDescription?: string;
  officerName?: string;
}

export interface BentoQueueGridProps {
  /** Callback when user clicks 'Ambil Antrean' on a specific loket */
  onRegisterQueue?: (serviceName?: string, counterNo?: string) => void;
  /** Callback when user selects a counter for details */
  onSelectCounter?: (counter: CounterQueueItem) => void;
  /** Whether dark mode is active */
  isDark?: boolean;
  /** Optional custom class name */
  className?: string;
  /** Initial filter category */
  initialCategory?: string;
  /** Optional external queue data override (from Supabase or API) */
  externalQueues?: CounterQueueItem[];
}

/** Default official counters data for MPP Simpurusiang Kabupaten Luwu */
const DEFAULT_COUNTERS: CounterQueueItem[] = [
  { 
    id: '1', 
    agencyName: 'Dinas Kependudukan & Pencatatan Sipil', 
    shortName: 'Disdukcapil (KTP-el & Biometrik)', 
    loketNo: '01', 
    currentNumber: 'A-042', 
    totalWaiting: 5, 
    avgWaitMins: 8, 
    status: 'active', 
    category: 'Kependudukan',
    serviceDescription: 'Perekaman KTP elektronik baru, penggantian rusak/hilang, & aktivasi IKD.'
  },
  { 
    id: '2', 
    agencyName: 'Dinas Kependudukan & Pencatatan Sipil', 
    shortName: 'Disdukcapil (KK, Akta & Mutasi)', 
    loketNo: '02', 
    currentNumber: 'A-038', 
    totalWaiting: 3, 
    avgWaitMins: 6, 
    status: 'active', 
    category: 'Kependudukan',
    serviceDescription: 'Kartu Keluarga, Kartu Identitas Anak (KIA), Akta Lahir, & Surat Pindah.'
  },
  { 
    id: '3', 
    agencyName: 'Dinas Penanaman Modal & PTSP', 
    shortName: 'DPMPTSP (Izin NIB OSS-RBA)', 
    loketNo: '03', 
    currentNumber: 'B-014', 
    totalWaiting: 2, 
    avgWaitMins: 15, 
    status: 'busy', 
    category: 'Perizinan',
    serviceDescription: 'Penerbitan Nomor Induk Berusaha (NIB) perseorangan & perseroan OSS.'
  },
  { 
    id: '4', 
    agencyName: 'Dinas Penanaman Modal & PTSP', 
    shortName: 'DPMPTSP (Non-OSS & Rekomtek)', 
    loketNo: '04', 
    currentNumber: 'B-009', 
    totalWaiting: 1, 
    avgWaitMins: 12, 
    status: 'active', 
    category: 'Perizinan',
    serviceDescription: 'Izin reklame, trayek angkutan, rekomendasi PKKPR & SIP Tenaga Medis.'
  },
  { 
    id: '5', 
    agencyName: 'Badan Pendapatan Daerah', 
    shortName: 'Bapenda (PBB-P2 & BPHTB)', 
    loketNo: '05', 
    currentNumber: 'C-021', 
    totalWaiting: 4, 
    avgWaitMins: 7, 
    status: 'active', 
    category: 'Perpajakan',
    serviceDescription: 'Pembayaran & cetak SPPT PBB-P2, validasi BPHTB, & Surat Bebas Pajak.'
  },
  { 
    id: '6', 
    agencyName: 'SAMSAT Wilayah Luwu', 
    shortName: 'SAMSAT (Pajak Kendaraan Bermotor)', 
    loketNo: '06', 
    currentNumber: 'C-055', 
    totalWaiting: 8, 
    avgWaitMins: 10, 
    status: 'busy', 
    category: 'Perpajakan',
    serviceDescription: 'Pengesahan STNK tahunan, pembayaran PKB & SWDKLLJ cepat.'
  },
  { 
    id: '7', 
    agencyName: 'Kantor Pertanahan Kab. Luwu (BPN)', 
    shortName: 'BPN (Peralihan Hak & Sertipikat)', 
    loketNo: '07', 
    currentNumber: 'D-007', 
    totalWaiting: 2, 
    avgWaitMins: 20, 
    status: 'active', 
    category: 'Agraria',
    serviceDescription: 'Jual-beli, waris, hibah tanah, pengecekan sertipikat, & peningkatan SHM.'
  },
  { 
    id: '8', 
    agencyName: 'Kantor Pertanahan Kab. Luwu (BPN)', 
    shortName: 'BPN (Roya & SKPT Hak Tanggungan)', 
    loketNo: '08', 
    currentNumber: 'D-004', 
    totalWaiting: 0, 
    avgWaitMins: 5, 
    status: 'active', 
    category: 'Agraria',
    serviceDescription: 'Pencoretan hak tanggungan (Roya elektronik) & permohonan SKPT.'
  },
  { 
    id: '9', 
    agencyName: 'BPJS Kesehatan Cabang Palopo/Luwu', 
    shortName: 'BPJS Kesehatan (JKN-KIS)', 
    loketNo: '09', 
    currentNumber: 'E-031', 
    totalWaiting: 6, 
    avgWaitMins: 9, 
    status: 'busy', 
    category: 'Kesehatan',
    serviceDescription: 'Pendaftaran peserta baru, mutasi faskes primer, & aktivasi BPJS PBI.'
  },
  { 
    id: '10', 
    agencyName: 'BPJS Ketenagakerjaan Luwu', 
    shortName: 'BPJS Ketenagakerjaan (Jamsostek)', 
    loketNo: '10', 
    currentNumber: 'E-012', 
    totalWaiting: 2, 
    avgWaitMins: 11, 
    status: 'active', 
    category: 'Ketenagakerjaan',
    serviceDescription: 'Klaim JHT Jamsostek, kepesertaan BPU pekerja mandiri, & beasiswa.'
  },
  { 
    id: '11', 
    agencyName: 'Kantor Imigrasi Palopo/Luwu', 
    shortName: 'Imigrasi (E-Paspor RI)', 
    loketNo: '11', 
    currentNumber: 'F-005', 
    totalWaiting: 3, 
    avgWaitMins: 18, 
    status: 'active', 
    category: 'Keimigrasian',
    serviceDescription: 'Wawancara & biometrik foto paspor baru/penggantian via M-Paspor.'
  },
  { 
    id: '12', 
    agencyName: 'Polres Luwu (Pelayanan Terpadu)', 
    shortName: 'Polres Luwu (SKCK & Sidik Jari)', 
    loketNo: '12', 
    currentNumber: 'G-019', 
    totalWaiting: 4, 
    avgWaitMins: 10, 
    status: 'active', 
    category: 'Kependudukan',
    serviceDescription: 'Penerbitan SKCK keperluan kerja/pendidikan & perumusan rumus sidik jari.'
  },
];

/** Filter categories for chip selectors */
const CHIP_CATEGORIES = [
  'Semua',
  'Kependudukan',
  'Perizinan',
  'Perpajakan',
  'Agraria',
  'Kesehatan',
  'Ketenagakerjaan',
  'Keimigrasian',
];

/**
 * BentoQueueGrid Component
 * Material Design 3 Responsive Bento Grid for MPP Simpurusiang Live Queues.
 * 
 * Replaces legacy vertical list views with an interactive, responsive grid
 * supporting horizontal scrollable chip filters, status indicators, and
 * empty state handling.
 */
export const BentoQueueGrid: React.FC<BentoQueueGridProps> = ({
  onRegisterQueue,
  onSelectCounter,
  isDark = false,
  className = '',
  initialCategory = 'Semua',
  externalQueues,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  
  // =========================================================================
  // INTEGRATION HOOKS / DATA FETCHING PLACEHOLDER:
  // In production, integrate Supabase Realtime / REST API hook here:
  //
  // const [counters, setCounters] = useState<CounterQueueItem[]>([]);
  // useEffect(() => {
  //   const fetchLiveQueues = async () => {
  //     const { data } = await supabase.from('mpp_counters').select('*').order('loketNo');
  //     if (data) setCounters(data);
  //   };
  //   fetchLiveQueues();
  // }, []);
  // =========================================================================
  
  const rawData = externalQueues || DEFAULT_COUNTERS;

  // Filter queues based on stateful chip selection
  const filteredCounters = useMemo(() => {
    if (activeCategory === 'Semua') {
      return rawData;
    }
    return rawData.filter(item => item.category === activeCategory);
  }, [activeCategory, rawData]);

  // Aggregate stats
  const totalWaiting = useMemo(() => {
    return filteredCounters.reduce((acc, curr) => acc + curr.totalWaiting, 0);
  }, [filteredCounters]);

  const activeCountersCount = useMemo(() => {
    return filteredCounters.filter(c => c.status === 'active' || c.status === 'busy').length;
  }, [filteredCounters]);

  return (
    <section className={`w-full space-y-6 ${className}`}>
      
      {/* 1. SECTION HEADER WITH LIVE PULSE & SUMMARY STATS */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60 mb-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Radar Antrean Real-Time Loket Pelayanan</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
            Transparansi Antrean & Layanan
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl text-justify">
            Pantau status antrean aktif di 12 gerai utama MPP Simpurusiang secara langsung sebelum menuju ke loket.
          </p>
        </div>

        {/* Aggregate Mini Counter Stats */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-2.5">
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Antre</div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white">{totalWaiting} Warga</div>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold text-slate-400">Loket Buka</div>
              <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{activeCountersCount} Loket</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STATEFUL CHIP FILTERS (HORIZONTAL SCROLLABLE ROW) */}
      <div className="relative w-full">
        {/* Left & Right subtle edge fade indicators */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-slate-50/80 dark:from-slate-950/80 to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-50/80 dark:from-slate-950/80 to-transparent z-10" />

        <div 
          className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none py-1 px-1 touch-pan-x"
          role="tablist"
          aria-label="Filter Kategori Loket"
        >
          {CHIP_CATEGORIES.map((category) => {
            const isSelected = activeCategory === category;
            const categoryCount = category === 'Semua' 
              ? rawData.length 
              : rawData.filter(item => item.category === category).length;

            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveCategory(category)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-300 cursor-pointer whitespace-nowrap shrink-0 border select-none active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25 ring-2 ring-emerald-500/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <span>{category}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono transition-colors ${
                  isSelected
                    ? 'bg-emerald-700/60 text-emerald-100'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {categoryCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. MATERIAL 3 BENTO GRID LAYOUT */}
      {filteredCounters.length > 0 ? (
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredCounters.map((counter) => {
              const isServing = counter.status === 'active' || counter.status === 'busy';
              
              return (
                <motion.article
                  key={counter.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  onClick={() => onSelectCounter?.(counter)}
                  className="group relative flex flex-col justify-between p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-100 dark:border-slate-800/80 shadow-xs hover:border-emerald-500/40 hover:shadow-md transition-all duration-300 text-left"
                >
                  {/* Top: Counter Number & Status Badge */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-xs flex items-center justify-center font-mono border border-slate-200/60 dark:border-slate-700/60">
                          {counter.loketNo}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          {counter.category}
                        </span>
                      </div>

                      {/* Status Indicator */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        counter.status === 'active'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : counter.status === 'busy'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          counter.status === 'active' 
                            ? 'bg-emerald-500 animate-pulse' 
                            : counter.status === 'busy' 
                            ? 'bg-amber-500 animate-pulse' 
                            : 'bg-slate-400'
                        }`} />
                        <span>
                          {counter.status === 'active' ? 'Melayani' : counter.status === 'busy' ? 'Ramai' : 'Istirahat'}
                        </span>
                      </span>
                    </div>

                    {/* Counter Name & Agency */}
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug font-sans group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {counter.shortName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {counter.serviceDescription || counter.agencyName}
                    </p>
                  </div>

                  {/* Middle: Prominent Current Calling Ticket */}
                  <div className="my-5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sedang Dilayani</div>
                      <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-emerald-300 font-mono">
                        {counter.currentNumber}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Estimasi</span>
                      </div>
                      <div className="text-xs font-extrabold text-slate-700 dark:text-slate-300 mt-0.5">
                        ~{counter.avgWaitMins} menit/tiket
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Queue Counter & Action Button */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{counter.totalWaiting} mengantre</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRegisterQueue?.(counter.shortName, counter.loketNo);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800 transition-all cursor-pointer active:scale-95"
                    >
                      <Ticket className="w-3 h-3" />
                      <span>Ambil Antrean</span>
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* 4. CLEAN EMPTY STATE UI */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full py-16 px-4 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-200 font-sans">
              Tidak Ada Loket Aktif untuk Kategori "{activeCategory}"
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Saat ini gerai dalam kategori ini sedang tidak memiliki antrean aktif atau dalam masa jeda operasional.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveCategory('Semua')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Tampilkan Semua Kategori
          </button>
        </motion.div>
      )}

    </section>
  );
};

export default BentoQueueGrid;
