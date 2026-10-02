import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Sparkles,
  MapPin,
  Clock,
  Ticket,
  CheckCircle2,
  X,
  Compass,
  Building2,
  Users,
  Briefcase,
  CreditCard,
  HeartPulse,
  Scale,
  Accessibility,
  ArrowRight,
  RotateCcw,
  Info,
  ChevronRight,
  ShieldCheck,
  PhoneCall,
  Flame,
  BadgeCheck
} from 'lucide-react';
import { SelectedFloorItem } from './InteractiveFloorPlan';

export interface SmartServiceFinderProps {
  selectedItem: SelectedFloorItem | null;
  onResetSelection: () => void;
  onSelectCategory: (tenantCodeOrId: string) => void;
  onOpenQueueBooking?: (serviceName?: string) => void;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// FAST-TRACK SERVICE DIRECTORY MASTER (KABUPATEN LUWU)
// ─────────────────────────────────────────────────────────────────────────────
interface FastTrackService {
  id: string;
  nodeId: string;
  category: string;
  title: string;
  agency: string;
  popularLabel?: string;
  zone: string;
  icon: any;
  color: string;
  description: string;
  requirements: string[];
}

const FAST_TRACK_SERVICES: FastTrackService[] = [
  {
    id: 'paspor',
    nodeId: 'IMIGRASI',
    category: 'Keimigrasian & Hukum',
    title: 'Permohonan & Perpanjangan Paspor RI',
    agency: 'Kantor Imigrasi',
    popularLabel: 'Paling Dicari',
    zone: 'Atrium Sentral (Busur Utara)',
    icon: Scale,
    color: 'from-cyan-500 to-blue-600',
    description: 'Pengurusan paspor elektronik dan reguler untuk haji, umrah, wisata, dan pendidikan luar negeri.',
    requirements: ['e-KTP & Kartu Keluarga Asli', 'Akta Kelahiran / Ijazah / Buku Nikah', 'Paspor Lama (bila perpanjangan)']
  },
  {
    id: 'ktp_kk',
    nodeId: 'DUKCAPIL_W1',
    category: 'Kependudukan & Capil',
    title: 'Perekaman KTP-el & Kartu Keluarga',
    agency: 'Dinas Dukcapil',
    popularLabel: 'Layanan Cepat',
    zone: 'Sayap Barat (West Wing)',
    icon: Users,
    color: 'from-emerald-500 to-teal-600',
    description: 'Penerbitan dokumen identitas kependudukan digital (IKD), perekaman biometrik KTP-el, dan revisi KK.',
    requirements: ['Kartu Keluarga Lama', 'Surat Keterangan Hilang (jika hilang)', 'Akta Kelahiran']
  },
  {
    id: 'oss_nib',
    nodeId: 'DPMPTSP_N',
    category: 'Perizinan & Investasi',
    title: 'Penerbitan NIB & Perizinan OSS-RBA',
    agency: 'DPMPTSP Luwu',
    popularLabel: 'Investor VIP',
    zone: 'Sayap Timur (East Wing)',
    icon: Briefcase,
    color: 'from-indigo-500 to-purple-600',
    description: 'Fasilitasi Nomor Induk Berusaha (NIB) gratis bagi pelaku UMKM hingga korporasi besar secara terintegrasi.',
    requirements: ['e-KTP Pemohon & NPWP', 'Titik Koordinat Lokasi Usaha (PKKPR)', 'Rincian Modal Usaha & KBLI']
  },
  {
    id: 'samsat_stnk',
    nodeId: 'SAMSAT',
    category: 'Pajak & Retribusi',
    title: 'Pajak Kendaraan & Pengesahan STNK',
    agency: 'SAMSAT Wilayah Luwu',
    popularLabel: 'Siap Hari Ini',
    zone: 'Sayap Utara (North Wing)',
    icon: CreditCard,
    color: 'from-amber-500 to-orange-600',
    description: 'Pembayaran Pajak Kendaraan Bermotor (PKB), SWDKLLJ, dan pengesahan tahunan STNK tanpa calo.',
    requirements: ['STNK Asli & Notis Pajak', 'KTP Asli Pemilik Kendaraan', 'BPKB Asli/Fotokopi']
  },
  {
    id: 'bpjs_jkn',
    nodeId: 'BPJS_KES',
    category: 'Jaminan Sosial',
    title: 'Pendaftaran JKN-KIS & Mutasi Faskes',
    agency: 'BPJS Kesehatan',
    popularLabel: 'Universal Health',
    zone: 'Atrium Sentral (Busur Timur)',
    icon: HeartPulse,
    color: 'from-teal-500 to-emerald-600',
    description: 'Pendaftaran kepesertaan BPJS mandiri/PBI, pindah faskes tingkat 1, dan perbaikan data peserta.',
    requirements: ['Kartu Keluarga & e-KTP', 'Nomor Rekening Bank (jika mandiri)', 'Buku Nikah (jika satu keluarga)']
  },
  {
    id: 'disabilitas_laktasi',
    nodeId: 'layanan_disabilitas',
    category: 'Fasilitas & Inklusi',
    title: 'Layanan Prioritas Disabilitas & Laktasi',
    agency: 'Front Office Inklusif',
    popularLabel: 'Akses Ramah',
    zone: 'Sayap Barat (Dekat Selasar)',
    icon: Accessibility,
    color: 'from-pink-500 to-rose-600',
    description: 'Fasilitasi kursi roda, jalur pemandu difabel, ruang laktasi privasi, dan pendampingan petugas.',
    requirements: ['Langsung menuju meja Front Office', 'Bantuan pendampingan tanpa antre']
  }
];

// Categories Grouping for Top Quick Filter Chips
const CATEGORY_TABS = [
  { id: 'all', label: 'Semua Direktori', icon: Compass },
  { id: 'Kependudukan & Capil', label: 'Kependudukan', icon: Users, defaultNode: 'DUKCAPIL_W1' },
  { id: 'Perizinan & Investasi', label: 'Perizinan OSS', icon: Briefcase, defaultNode: 'DPMPTSP_N' },
  { id: 'Pajak & Retribusi', label: 'Pajak & SAMSAT', icon: CreditCard, defaultNode: 'SAMSAT' },
  { id: 'Jaminan Sosial', label: 'BPJS & Sosial', icon: HeartPulse, defaultNode: 'BPJS_KES' },
  { id: 'Keimigrasian & Hukum', label: 'Paspor & Hukum', icon: Scale, defaultNode: 'IMIGRASI' },
  { id: 'Fasilitas & Inklusi', label: 'Fasilitas Ramah', icon: Accessibility, defaultNode: 'layanan_disabilitas' }
];

export function SmartServiceFinder({
  selectedItem,
  onResetSelection,
  onSelectCategory,
  onOpenQueueBooking,
  className = ''
}: SmartServiceFinderProps) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filtered Fast-Track Services based on Search & Tabs
  const filteredServices = useMemo(() => {
    return FAST_TRACK_SERVICES.filter(service => {
      // Tab category filter
      if (activeTab !== 'all' && service.category !== activeTab) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = service.title.toLowerCase().includes(q);
        const matchAgency = service.agency.toLowerCase().includes(q);
        const matchCategory = service.category.toLowerCase().includes(q);
        const matchReqs = service.requirements.some(r => r.toLowerCase().includes(q));
        return matchTitle || matchAgency || matchCategory || matchReqs;
      }
      return true;
    });
  }, [activeTab, searchQuery]);

  return (
    <div className={`w-full flex flex-col space-y-6 ${className}`}>
      
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 1. HEADER WIDGET: TITLE & LIVE TWO-WAY CONNECTIVITY BADGE         */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Direktori & Pencarian Cepat Layanan
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              <Compass className="w-3 h-3 text-indigo-400" />
              Sinkron ke Denah Spasial
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans">
            Navigasi Cepat Gerai & Loket Layanan
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Pilih kebutuhan administrasi Anda di bawah untuk langsung menyorot posisi gerai pada denah denah interaktif MPP Simpurusiang.
          </p>
        </div>

        {/* Search Bar with clear button */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari layanan (Paspor, KTP, NIB, BPJS)..."
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all shadow-inner font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 2. CATEGORY TABS (HORIZONTAL SCROLLABLE CHIPS)                    */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.defaultNode) {
                  onSelectCategory(tab.defaultNode);
                }
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 border ${
                isActive
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/50'
                  : 'bg-slate-800/80 hover:bg-slate-750 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 3. DYNAMIC PANEL: SELECTED ITEM CALLOUT OR FAST-TRACK CARDS       */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {selectedItem ? (
          /* A. ACTIVE SELECTION SPOTLIGHT CARD (FROM DENAH OR DIRECTORY) */
          <motion.div
            key={`selected-${selectedItem.id}`}
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800/90 via-slate-850 to-slate-900 border border-emerald-500/40 p-5 sm:p-6 shadow-2xl"
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              
              {/* Left Details */}
              <div className="flex items-start gap-4">
                <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <Building2 className="w-7 h-7" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ID: {selectedItem.code || selectedItem.id}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Normal / Buka
                    </span>
                    {selectedItem.isDisabilityFriendly && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        <Accessibility className="w-3 h-3 text-cyan-400" />
                        Ramah Disabilitas
                      </span>
                    )}
                  </div>

                  <h4 className="text-lg sm:text-xl font-black text-white tracking-tight font-sans">
                    {selectedItem.name}
                    {selectedItem.subName && (
                      <span className="text-slate-300 font-semibold text-sm sm:text-base ml-2">
                        — {selectedItem.subName}
                      </span>
                    )}
                  </h4>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-0.5">
                    {selectedItem.zone && (
                      <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Lokasi: {selectedItem.zone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedItem.operatingHours || '08:00 - 15:30 WITA'}</span>
                    </div>
                  </div>

                  {/* Services List Preview */}
                  {selectedItem.services && selectedItem.services.length > 0 && (
                    <div className="pt-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Layanan yang Disediakan:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedItem.services.map((srv, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-200 border border-slate-700/80 font-medium"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            {srv}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Actions */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 w-full lg:w-auto">
                <button
                  type="button"
                  onClick={() => onSelectCategory(selectedItem.id)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <span>Sorot di Denah Bawah</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenQueueBooking?.(selectedItem.name)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Ambil Antrean</span>
                </button>

                <button
                  type="button"
                  onClick={onResetSelection}
                  title="Pilih Gerai Lain"
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

            </div>
          </motion.div>
        ) : (
          /* B. FAST-TRACK CARDS DIRECTORY GRID */
          <motion.div
            key="directory-grid"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredServices.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.id}
                  onClick={() => onSelectCategory(service.nodeId)}
                  className="group cursor-pointer rounded-2xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/60 p-4 transition-all duration-200 flex flex-col justify-between hover:shadow-xl hover:shadow-emerald-950/30 hover:-translate-y-0.5"
                >
                  <div>
                    {/* Card Top: Category, Popular badge & Icon */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${service.color} text-white shadow-sm`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                          {service.agency}
                        </span>
                      </div>

                      {service.popularLabel && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {service.popularLabel}
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <h5 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1 mb-1 font-sans">
                      {service.title}
                    </h5>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                      {service.description}
                    </p>

                    {/* Requirements checklist snippet */}
                    <div className="space-y-1 pt-2 border-t border-slate-700/60 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Syarat Utama:
                      </span>
                      {service.requirements.slice(0, 2).map((req, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Bottom: Location & Action */}
                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-[11px] text-emerald-300 font-medium truncate max-w-[170px]">
                      <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">{service.zone}</span>
                    </div>

                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px] group-hover:translate-x-0.5 transition-transform">
                      <span>Lihat di Denah</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default SmartServiceFinder;
