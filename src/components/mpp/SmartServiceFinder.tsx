import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
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
  ArrowRight
} from 'lucide-react';
import { SelectedFloorItem } from './InteractiveFloorPlan';

export interface SmartServiceFinderProps {
  selectedItem: SelectedFloorItem | null;
  onResetSelection: () => void;
  onSelectCategory: (tenantCodeOrId: string) => void;
  onOpenQueueBooking?: (serviceName?: string) => void;
  isDark?: boolean;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// FAST-TRACK SERVICE DIRECTORY MASTER (KABUPATEN LUWU)
// ─────────────────────────────────────────────────────────────────────────────
export interface FastTrackService {
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

export const FAST_TRACK_SERVICES: FastTrackService[] = [
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
    color: 'from-emerald-600 to-teal-700',
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
    color: 'from-blue-600 to-sky-700',
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
export const CATEGORY_TABS = [
  { id: 'all', labelKey: 'directory.tabs.all', defaultLabel: 'Semua Direktori', icon: Compass },
  { id: 'Kependudukan & Capil', labelKey: 'directory.tabs.civil', defaultLabel: 'Kependudukan', icon: Users, defaultNode: 'DUKCAPIL_W1' },
  { id: 'Perizinan & Investasi', labelKey: 'directory.tabs.licensing', defaultLabel: 'Perizinan OSS', icon: Briefcase, defaultNode: 'DPMPTSP_N' },
  { id: 'Pajak & Retribusi', labelKey: 'directory.tabs.tax', defaultLabel: 'Pajak & SAMSAT', icon: CreditCard, defaultNode: 'SAMSAT' },
  { id: 'Jaminan Sosial', labelKey: 'directory.tabs.health_social', defaultLabel: 'BPJS & Sosial', icon: HeartPulse, defaultNode: 'BPJS_KES' },
  { id: 'Keimigrasian & Hukum', labelKey: 'directory.tabs.passport_law', defaultLabel: 'Paspor & Hukum', icon: Scale, defaultNode: 'IMIGRASI' },
  { id: 'Fasilitas & Inklusi', labelKey: 'directory.tabs.inclusive_facilities', defaultLabel: 'Fasilitas Ramah', icon: Accessibility, defaultNode: 'layanan_disabilitas' }
];

export function SmartServiceFinder({
  selectedItem,
  onResetSelection,
  onSelectCategory,
  onOpenQueueBooking,
  isDark,
  className = ''
}: SmartServiceFinderProps) {
  const { t } = useTranslation();
  const isDarkMode = isDark !== undefined ? isDark : (typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true);
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
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {/* Badge Top 1: Direktori & Pencarian Cepat Layanan */}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border ${
              isDarkMode 
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60' 
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              {t('directory.badge_fast_search', 'DIREKTORI & PENCARIAN CEPAT LAYANAN')}
            </span>

            {/* Badge Top 2: Sinkron ke Denah Spasial */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
              isDarkMode 
                ? 'bg-sky-950/70 text-sky-300 border-sky-800/60' 
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              <Compass className="w-3 h-3 text-sky-400" />
              {t('directory.badge_spatial_sync', 'Sinkron ke Denah Spasial')}
            </span>
          </div>

          <h3 className={`text-xl sm:text-2xl font-bold tracking-tight font-sans ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            {t('directory.title', 'Navigasi Cepat Gerai & Loket Layanan')}
          </h3>
          <p className={`text-xs sm:text-sm mt-1 max-w-2xl font-normal leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            {t('directory.subtitle', 'Pilih kebutuhan administrasi Anda di bawah untuk langsung menyorot posisi gerai pada denah interaktif MPP Simpurusiang.')}
          </p>
        </div>

        {/* Search Bar with clear button */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('nav.search_placeholder', 'Cari layanan (misal: Paspor, KTP, NIB, dll)...')}
            className={`w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border outline-none transition-all shadow-xs font-medium focus:ring-1 focus:ring-emerald-500 ${
              isDarkMode
                ? 'bg-slate-900/90 text-white border-slate-700 placeholder:text-slate-500 focus:border-emerald-500'
                : 'bg-slate-50 text-slate-900 border-slate-200 placeholder:text-slate-400 focus:border-emerald-500'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
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
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-black/25'
                  : isDarkMode
                  ? 'bg-slate-900/80 text-slate-200 border-slate-800 hover:bg-slate-800 hover:text-white'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <span>{t(tab.labelKey, tab.defaultLabel)}</span>
            </button>
          );
        })}
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 3. DYNAMIC PANEL: SELECTED ITEM CALLOUT OR FAST-TRACK CARDS       */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {selectedItem ? (() => {
          const isFacility = selectedItem.type === 'facility' || selectedItem.category === 'facility';
          const displayAmenities = selectedItem.amenities || selectedItem.services || [];
          
          return (
            /* A. ACTIVE SELECTION SPOTLIGHT CARD (FROM DENAH OR DIRECTORY) */
            <motion.div
              key={`selected-${selectedItem.id}`}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 shadow-md transition-all ${
                isDarkMode 
                  ? 'bg-slate-900/95 text-white' 
                  : 'bg-slate-50 text-slate-900'
              } ${
                isFacility 
                  ? isDarkMode ? 'border-teal-500/50 shadow-teal-950/20' : 'border-teal-500/40 shadow-teal-500/5'
                  : isDarkMode ? 'border-emerald-500/50 shadow-emerald-950/20' : 'border-emerald-500/40 shadow-emerald-500/5'
              }`}
            >
              {/* Ambient Background Glow */}
              <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
                isFacility ? 'bg-teal-500/10' : 'bg-emerald-500/10'
              }`} />

              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                
                {/* Left Details */}
                <div className="flex items-start gap-4">
                  <div className={`p-3.5 rounded-2xl border shrink-0 ${
                    isFacility 
                      ? isDarkMode ? 'bg-teal-500/20 text-teal-400 border-teal-500/40' : 'bg-teal-100 text-teal-700 border-teal-200'
                      : isDarkMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  }`}>
                    {isFacility ? <Sparkles className="w-7 h-7" /> : <Building2 className="w-7 h-7" />}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Element Type Tag */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border uppercase tracking-wider ${
                        isFacility 
                          ? isDarkMode ? 'bg-teal-500/20 text-teal-300 border-teal-500/40' : 'bg-teal-50 text-teal-800 border-teal-200'
                          : isDarkMode ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {isFacility ? 'Fasilitas Publik' : 'Gerai Pelayanan'}
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                        isDarkMode 
                          ? 'bg-slate-800 text-slate-300 border-slate-700' 
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}>
                        ID: {selectedItem.code || selectedItem.id}
                      </span>

                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isFacility
                          ? isDarkMode ? 'bg-teal-950/70 text-teal-300 border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200'
                          : isDarkMode ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isFacility ? 'bg-teal-500' : 'bg-emerald-500'}`} />
                        {isFacility ? 'Tersedia / Siap Digunakan' : 'Normal / Buka'}
                      </span>

                      {selectedItem.isDisabilityFriendly && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isDarkMode 
                            ? 'bg-cyan-950/70 text-cyan-300 border-cyan-800' 
                            : 'bg-cyan-50 text-cyan-800 border-cyan-200'
                        }`}>
                          <Accessibility className="w-3 h-3 text-cyan-400" />
                          Ramah Disabilitas
                        </span>
                      )}

                      {isFacility && selectedItem.capacity && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isDarkMode 
                            ? 'bg-sky-950/70 text-sky-300 border-sky-800' 
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          <Users className="w-3 h-3 text-sky-400" />
                          {selectedItem.capacity}
                        </span>
                      )}
                    </div>

                    <h4 className={`text-lg sm:text-xl font-bold tracking-tight font-sans ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {selectedItem.name}
                      {selectedItem.subName && (
                        <span className={`font-semibold text-sm sm:text-base ml-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          — {selectedItem.subName}
                        </span>
                      )}
                    </h4>

                    {selectedItem.description && (
                      <p className={`text-xs sm:text-sm leading-relaxed max-w-2xl font-normal ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {selectedItem.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs pt-0.5">
                      {selectedItem.zone && (
                        <div className={`flex items-center gap-1.5 font-semibold ${
                          isFacility 
                            ? isDarkMode ? 'text-teal-300' : 'text-teal-700'
                            : isDarkMode ? 'text-emerald-300' : 'text-emerald-700'
                        }`}>
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Lokasi: {selectedItem.zone}</span>
                        </div>
                      )}
                      <div className={`flex items-center gap-1.5 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{selectedItem.operatingHours || (isFacility ? '07:30 - 16:00 WITA' : '08:00 - 15:30 WITA')}</span>
                      </div>
                    </div>

                    {/* Section: Amenities (Facility) or Services (Tenant) */}
                    {displayAmenities.length > 0 && (
                      <div className="pt-2">
                        <p className={`text-[11px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {isFacility ? (
                            <>
                              <Sparkles className="w-3 h-3 text-teal-400" />
                              <span>Kelengkapan & Sarana Fasilitas:</span>
                            </>
                          ) : (
                            <>
                              <Building2 className="w-3 h-3 text-emerald-400" />
                              <span>Layanan yang Disediakan:</span>
                            </>
                          )}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {displayAmenities.map((item, idx) => (
                            <span
                              key={idx}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border shadow-2xs ${
                                isDarkMode 
                                  ? 'bg-slate-800 text-slate-200 border-slate-700' 
                                  : 'bg-white text-slate-800 border-slate-200'
                              }`}
                            >
                              <CheckCircle2 className={`w-3 h-3 ${isFacility ? 'text-teal-400' : 'text-emerald-400'}`} />
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Actions: Conditional Button */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 w-full lg:w-auto">
                  <button
                    type="button"
                    onClick={() => onSelectCategory(selectedItem.id)}
                    className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                      isDarkMode 
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700' 
                        : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                    }`}
                  >
                    <Compass className={`w-4 h-4 ${isFacility ? 'text-teal-400' : 'text-emerald-400'}`} />
                    <span>Sorot di Denah Bawah</span>
                  </button>

                  {!isFacility && (
                    /* IF TENANT: Show Ambil Antrean button */
                    <button
                      type="button"
                      onClick={() => onOpenQueueBooking?.(selectedItem.name)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-black/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>Ambil Antrean Online</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onResetSelection}
                    title="Pilih Gerai/Fasilitas Lain"
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isDarkMode 
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-200'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </motion.div>
          );
        })() : (
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
                  className={`group cursor-pointer rounded-2xl border p-4 transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-md hover:-translate-y-0.5 ${
                    isDarkMode 
                      ? 'bg-slate-900/85 hover:bg-slate-800 border-slate-800 hover:border-emerald-500/60 text-white' 
                      : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 hover:border-emerald-500/60 text-slate-900'
                  }`}
                >
                  <div>
                    {/* Card Top: Category, Popular badge & Icon */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${service.color} text-white shadow-sm`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`text-[11px] font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {service.agency}
                        </span>
                      </div>

                      {service.popularLabel && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isDarkMode 
                            ? 'bg-amber-950/70 text-amber-300 border-amber-800/60' 
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {service.popularLabel === 'Paling Dicari' && t('directory.tags.most_searched', 'Paling Dicari')}
                          {service.popularLabel === 'Layanan Cepat' && t('directory.tags.fast_service', 'Layanan Cepat')}
                          {service.popularLabel === 'Investor VIP' && t('directory.tags.vip_investor', 'Investor VIP')}
                          {service.popularLabel === 'Siap Hari Ini' && t('directory.tags.today_ready', 'Siap Hari Ini')}
                          {service.popularLabel === 'Universal Health' && t('directory.tags.universal_health', 'Universal Health')}
                          {service.popularLabel === 'Akses Ramah' && t('directory.tags.inclusive', 'Akses Ramah')}
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <h5 className={`text-sm font-bold group-hover:text-emerald-500 transition-colors line-clamp-1 mb-1 font-sans ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {service.title}
                    </h5>
                    <p className={`text-xs line-clamp-2 leading-relaxed mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      {service.description}
                    </p>

                    {/* Requirements checklist snippet */}
                    <div className={`space-y-1 pt-2 border-t mb-3 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {t('directory.labels.main_requirements', 'SYARAT UTAMA:')}
                      </span>
                      {service.requirements.slice(0, 2).map((req, i) => (
                        <div key={i} className={`flex items-center gap-1.5 text-[11px] ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="truncate">{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Bottom: Location & Action */}
                  <div className={`pt-2 border-t flex items-center justify-between text-xs ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <div className={`flex items-center gap-1 text-[11px] font-semibold truncate max-w-[170px] ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span className="truncate">{service.zone}</span>
                    </div>

                    <span className={`inline-flex items-center gap-1 font-bold text-[11px] group-hover:translate-x-0.5 transition-transform ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      <span>{t('directory.labels.view_on_map', 'Lihat di Denah →')}</span>
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

export const QuickNavigationCard = SmartServiceFinder;
export default SmartServiceFinder;
