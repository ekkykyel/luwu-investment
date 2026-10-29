import React, { useState } from 'react';
import { 
  TrendingUp, 
  Database, 
  FileCheck2, 
  Activity, 
  CheckCircle2, 
  ArrowRight, 
  Send, 
  Sparkles, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  Building2,
  Zap,
  Filter,
  MapPin,
  Layers,
  Compass,
  Droplets,
  Sprout,
  Wheat,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface TicketItem {
  id: string;
  company_name: string;
  investor_name: string;
  potensi_name: string;
  nilai_investasi: number;
  status: string;
  created_at: string;
  catatan_admin?: string;
  [key: string]: any;
}

interface EstafetProgressBannerProps {
  tickets: TicketItem[];
  userRole: string; // 'admin_puptr' | 'admin_pertanian' | 'admin_promosi' | 'admin_data' | 'admin_oss' | 'admin_dalak' | 'superadmin' | string
  onOpenEstafetModal: (ticket: TicketItem) => void;
  onOpenBlueprintModal: () => void;
  defaultCollapsedOnMobile?: boolean;
}

// 1. DPMPTSP 4 Bidang Pipeline
export const DPMPTSP_ESTAFET_STAGES = [
  {
    id: 'admin_promosi',
    key: 'Promosi',
    title: '1. Promosi & Penanaman Modal',
    shortName: 'Promosi',
    statusTag: 'Menunggu Verifikasi',
    nextRoleName: 'Bidang Data',
    icon: TrendingUp,
    color: 'emerald',
    badgeClass: 'text-emerald-700 dark:text-emerald-300',
    barBg: 'bg-emerald-600',
    description: 'Inisiasi minat, verifikasi formulir LoI & profil investor.',
    sla: '1-2 Hari'
  },
  {
    id: 'admin_data',
    key: 'Data',
    title: '2. Perencanaan, Iklim & Data',
    shortName: 'Data & Spasial',
    statusTag: 'Kajian Data & Spasial',
    nextRoleName: 'Bidang OSS',
    icon: Database,
    color: 'blue',
    badgeClass: 'text-blue-700 dark:text-blue-300',
    barBg: 'bg-blue-600',
    description: 'Validasi pasokan bahan baku, LP2B & pola ruang RTRW.',
    sla: '2-3 Hari'
  },
  {
    id: 'admin_oss',
    key: 'OSS',
    title: '3. Pelayanan Perizinan (OSS)',
    shortName: 'Perizinan OSS',
    statusTag: 'Verifikasi OSS & PKKPR',
    nextRoleName: 'Bidang DALAK',
    icon: FileCheck2,
    color: 'indigo',
    badgeClass: 'text-indigo-700 dark:text-indigo-300',
    barBg: 'bg-indigo-600',
    description: 'Penerbitan NIB OSS-RBA, SK PKKPR & Sertifikat Standar.',
    sla: '1-2 Hari'
  },
  {
    id: 'admin_dalak',
    key: 'DALAK',
    title: '4. Pengendalian & Pengawasan',
    shortName: 'DALAK & LKPM',
    statusTag: 'Pengawasan DALAK & LKPM',
    nextRoleName: 'Realisasi Izin',
    icon: Activity,
    color: 'amber',
    badgeClass: 'text-amber-700 dark:text-amber-300',
    barBg: 'bg-amber-600',
    description: 'Pengawasan fisik lapangan, mediasi & verifikasi LKPM.',
    sla: '1-2 Hari'
  }
];

// 2. DINAS PUPTR 4 Bidang Pipeline (Tugas Pokok & Fungsi Dinas Pekerjaan Umum & Tata Ruang)
export const PUPTR_ESTAFET_STAGES = [
  {
    id: 'puptr_tataruang',
    key: 'TataRuang',
    title: '1. Penataan Ruang & Studio GIS',
    shortName: '1. Tata Ruang & GIS',
    statusTag: 'Audit Pola Ruang RTRW',
    nextRoleName: 'Bidang Bina Marga',
    icon: Compass,
    color: 'indigo',
    badgeClass: 'text-indigo-700 dark:text-indigo-300',
    barBg: 'bg-indigo-600',
    description: 'Validasi pola ruang RTRW No. 3/2024, overlay poligon WebGIS & audit topologi batas.',
    sla: '1-2 Hari'
  },
  {
    id: 'puptr_binamarga',
    key: 'BinaMarga',
    title: '2. Bidang Bina Marga',
    shortName: '2. Bina Marga',
    statusTag: 'Kajian Aksesibilitas Jalan',
    nextRoleName: 'Bidang SDA',
    icon: Building2,
    color: 'blue',
    badgeClass: 'text-blue-700 dark:text-blue-300',
    barBg: 'bg-blue-600',
    description: 'Kajian teknis jalan daerah, sempadan Rumija/Ruwasja, akses masuk & trase jembatan.',
    sla: '1 Hari'
  },
  {
    id: 'puptr_sda',
    key: 'SDA',
    title: '3. Bidang Sumber Daya Air (SDA)',
    shortName: '3. Sumber Daya Air',
    statusTag: 'Kajian Sempadan Sungai & Air',
    nextRoleName: 'Bidang Cipta Karya',
    icon: Droplets,
    color: 'cyan',
    badgeClass: 'text-cyan-700 dark:text-cyan-300',
    barBg: 'bg-cyan-600',
    description: 'Analisis hidrologi, sempadan sungai, saluran irigasi teknis & retensi limpasan air.',
    sla: '1 Hari'
  },
  {
    id: 'puptr_ciptakarya',
    key: 'CiptaKarya',
    title: '4. Cipta Karya & TPT Konstruksi',
    shortName: '4. Cipta Karya & TPT',
    statusTag: 'Finalisasi Pertek & TTE',
    nextRoleName: 'Penerbitan SK PKKPR',
    icon: ShieldCheck,
    color: 'emerald',
    badgeClass: 'text-emerald-700 dark:text-emerald-300',
    barBg: 'bg-emerald-600',
    description: 'Penetapan KDB/KLB/GSB/KDH, draft Berita Acara Pertek & pengesahan TTE Digital Kadis.',
    sla: '1 Hari'
  }
];

// 3. DINAS PERTANIAN 4 Bidang Pipeline (Tugas Pokok & Fungsi Dinas Pertanian)
export const PERTANIAN_ESTAFET_STAGES = [
  {
    id: 'pertanian_psp',
    key: 'PSP',
    title: '1. Prasarana, Sarana & Lahan (PSP)',
    shortName: '1. PSP & LP2B',
    statusTag: 'Audit Spasial LP2B',
    nextRoleName: 'Bidang Tanaman Pangan',
    icon: Database,
    color: 'emerald',
    badgeClass: 'text-emerald-700 dark:text-emerald-300',
    barBg: 'bg-emerald-600',
    description: 'Verifikasi layer LP2B & Lahan Sawah Dilindungi (LSD), audit irigasi teknis persil.',
    sla: '1-2 Hari'
  },
  {
    id: 'pertanian_pangan',
    key: 'Pangan',
    title: '2. Tanaman Pangan & Hortikultura',
    shortName: '2. Tanaman Pangan',
    statusTag: 'Kajian Indeks Pertanaman',
    nextRoleName: 'Bidang Perkebunan',
    icon: Wheat,
    color: 'amber',
    badgeClass: 'text-amber-700 dark:text-amber-300',
    barBg: 'bg-amber-600',
    description: 'Evaluasi indeks pertanaman (IP200/IP300), produktivitas gabah & dampak alih fungsi.',
    sla: '1 Hari'
  },
  {
    id: 'pertanian_perkebunan',
    key: 'Perkebunan',
    title: '3. Bidang Perkebunan',
    shortName: '3. Perkebunan',
    statusTag: 'Kesesuaian Komoditas',
    nextRoleName: 'Bidang Usaha Tani',
    icon: Sprout,
    color: 'teal',
    badgeClass: 'text-teal-700 dark:text-teal-300',
    barBg: 'bg-teal-600',
    description: 'Kajian agroklimatologi kakao, kelapa sawit, kopi, cengkeh & komoditas perkebunan.',
    sla: '1 Hari'
  },
  {
    id: 'pertanian_penyuluhan',
    key: 'Penyuluhan',
    title: '4. Penyuluhan & Perlindungan Usaha',
    shortName: '4. Kompensasi & BAP',
    statusTag: 'Terbit BAP & TTE Kadis',
    nextRoleName: 'PUPTR / DPMPTSP',
    icon: FileCheck2,
    color: 'green',
    badgeClass: 'text-green-700 dark:text-green-300',
    barBg: 'bg-green-600',
    description: 'Verifikasi kesanggupan lahan pengganti LP2B (1:1 / 1:3), terbit BAP & TTE Kadis Pertanian.',
    sla: '1 Hari'
  }
];

export const EstafetProgressBanner: React.FC<EstafetProgressBannerProps> = ({
  tickets = [],
  userRole,
  onOpenEstafetModal,
  onOpenBlueprintModal,
  defaultCollapsedOnMobile = false,
}) => {
  const [isMobileCollapsed, setIsMobileCollapsed] = useState<boolean>(defaultCollapsedOnMobile);

  const normRole = (userRole || '').toLowerCase();
  const isPuptr = normRole.includes('puptr') || normRole.includes('gis') || normRole.includes('tata_ruang');
  const isPertanian = normRole.includes('pertanian') || normRole.includes('lp2b');

  // Select appropriate OPD stages & branding metadata
  const currentStages = isPuptr 
    ? PUPTR_ESTAFET_STAGES 
    : isPertanian 
      ? PERTANIAN_ESTAFET_STAGES 
      : DPMPTSP_ESTAFET_STAGES;

  const headerBadge = isPuptr 
    ? 'Verifikasi Pertek Tata Ruang'
    : isPertanian 
      ? 'Perlindungan Lahan LP2B'
      : 'Pendampingan Investor Terpadu';

  const opdSubtitle = isPuptr 
    ? 'Dinas PUPTR Kab. Luwu'
    : isPertanian 
      ? 'Dinas Pertanian Kab. Luwu'
      : 'DPMPTSP Kab. Luwu';

  const bannerTitle = isPuptr
    ? 'Estafet Pertimbangan Teknis 4 Bidang PUPTR'
    : isPertanian
      ? 'Estafet Evaluasi LP2B 4 Bidang Pertanian'
      : 'Estafet Alur Investasi 4 Bidang DPMPTSP';

  const bannerDesc = isPuptr
    ? 'Alur koordinasi teknis 4 bidang Dinas PUPTR dalam menerbitkan Berita Acara Pertimbangan Teknis (Pertek) Tata Ruang & Kesesuaian Ruang (PKKPR).'
    : isPertanian
      ? 'Alur pengujian teknis agraria, proteksi lahan pangan berkelanjutan (LP2B) & penerbitan Berita Acara Rekomendasi Alih Fungsi Lahan Dinas Pertanian.'
      : 'Alur pendampingan dan eskalasi terintegrasi permohonan investasi lintas 4 bidang teknis DPMPTSP Kabupaten Luwu.';

  // Count tickets per stage based on OPD context
  let countStage1 = 0;
  let countStage2 = 0;
  let countStage3 = 0;
  let countStage4 = 0;
  let countDone = 0;

  if (isPuptr) {
    countStage1 = tickets.filter(t => !t.status || t.status === 'Menunggu Verifikasi' || t.status === 'Draft' || t.status === 'DITINJAU_PUPTR' || t.status === 'Submitted').length;
    countStage2 = tickets.filter(t => t.status === 'Kajian Data & Spasial' || t.status === 'Persiapan Site Visit' || t.status === 'Tinjau Lapangan').length;
    countStage3 = tickets.filter(t => t.status === 'Verifikasi OSS & PKKPR' || t.status === 'Mediasi Lapangan Selesai' || t.status === 'Verifikasi Spasial Berjalan').length;
    countStage4 = tickets.filter(t => t.status === 'Pengawasan DALAK & LKPM' || t.status === 'Approved_PUPTR' || t.status === 'PERTEK_TERBIT').length;
    countDone = tickets.filter(t => t.status === 'Izin Terbit / Realisasi' || t.status === 'Izin Terbit' || t.status === 'Disetujui' || t.status === 'Selesai' || t.status === 'PROSES_OSS' || t.status === 'IZIN_TERBIT').length;
  } else if (isPertanian) {
    countStage1 = tickets.filter(t => !t.status || t.status === 'Menunggu Verifikasi' || t.status === 'Draft' || t.status === 'LP2B Review' || t.status === 'Submitted_Pertanian').length;
    countStage2 = tickets.filter(t => t.status === 'Kajian Data & Spasial' || t.status === 'Persiapan Site Visit' || t.status === 'Review Produktivitas').length;
    countStage3 = tickets.filter(t => t.status === 'Verifikasi OSS & PKKPR' || t.status === 'Review Perkebunan').length;
    countStage4 = tickets.filter(t => t.status === 'Pengawasan DALAK & LKPM' || t.status === 'BA_TERBIT' || t.status === 'Approved_Pertanian').length;
    countDone = tickets.filter(t => t.status === 'Izin Terbit / Realisasi' || t.status === 'Izin Terbit' || t.status === 'Disetujui' || t.status === 'Selesai' || t.status === 'PROSES_OSS').length;
  } else {
    // DPMPTSP
    countStage1 = tickets.filter(t => !t.status || t.status === 'Menunggu Verifikasi' || t.status === 'Draft').length;
    countStage2 = tickets.filter(t => t.status === 'Kajian Data & Spasial' || t.status === 'Persiapan Site Visit').length;
    countStage3 = tickets.filter(t => t.status === 'Verifikasi OSS & PKKPR' || t.status === 'Mediasi Lapangan Selesai').length;
    countStage4 = tickets.filter(t => t.status === 'Pengawasan DALAK & LKPM' || t.status === 'Verifikasi OSS Berjalan').length;
    countDone = tickets.filter(t => t.status === 'Izin Terbit / Realisasi' || t.status === 'Izin Terbit' || t.status === 'Disetujui' || t.status === 'Selesai').length;
  }

  const totalActive = countStage1 + countStage2 + countStage3 + countStage4;

  // Filter tickets needing immediate action by current admin role
  const getActionableTicketForRole = (): TicketItem | null => {
    if (isPuptr) {
      return tickets.find(t => !t.status || t.status === 'Menunggu Verifikasi' || t.status === 'Draft' || t.status === 'Submitted' || t.status === 'DITINJAU_PUPTR') || tickets[0] || null;
    } else if (isPertanian) {
      return tickets.find(t => t.status === 'Kajian Data & Spasial' || t.status === 'LP2B Review' || t.status === 'Submitted_Pertanian') || tickets[0] || null;
    } else if (userRole === 'admin_promosi') {
      return tickets.find(t => !t.status || t.status === 'Menunggu Verifikasi' || t.status === 'Draft') || null;
    } else if (userRole === 'admin_data') {
      return tickets.find(t => t.status === 'Kajian Data & Spasial' || t.status === 'Persiapan Site Visit') || null;
    } else if (userRole === 'admin_oss') {
      return tickets.find(t => t.status === 'Verifikasi OSS & PKKPR' || t.status === 'Mediasi Lapangan Selesai') || null;
    } else if (userRole === 'admin_dalak') {
      return tickets.find(t => t.status === 'Pengawasan DALAK & LKPM' || t.status === 'Verifikasi OSS Berjalan') || null;
    }
    return tickets[0] || null;
  };

  const actionableTicket = getActionableTicketForRole();

  return (
    <div className="w-full bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-sm space-y-3.5 sm:space-y-5 transition-all">
      
      {/* Top Title & Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 dark:border-slate-800 pb-3 sm:pb-4">
        <div className="flex items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-white shadow-sm shrink-0 ${
              isPuptr 
                ? 'bg-gradient-to-br from-indigo-600 to-blue-700' 
                : isPertanian 
                  ? 'bg-gradient-to-br from-emerald-600 to-green-700' 
                  : 'bg-gradient-to-br from-emerald-600 to-teal-600'
            }`}>
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                <span className="truncate">{headerBadge}</span>
                <span aria-hidden="true" className="text-slate-400">·</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium truncate">{opdSubtitle}</span>
              </div>
              <h2 className="text-sm sm:text-lg font-extrabold text-slate-900 dark:text-white mt-0.5 tracking-tight leading-snug [text-wrap:balance]">
                {bannerTitle}
              </h2>
              <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl line-clamp-1">
                {bannerDesc}
              </p>
            </div>
          </div>

          {/* Mobile Collapse/Expand Affordance */}
          <button
            type="button"
            onClick={() => setIsMobileCollapsed(!isMobileCollapsed)}
            aria-expanded={!isMobileCollapsed}
            aria-label={isMobileCollapsed ? 'Tampilkan kartu tahapan estafet' : 'Ringkas kartu tahapan estafet'}
            className="md:hidden min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 active:scale-95 transition-transform cursor-pointer"
          >
            {isMobileCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Action Button: Quick Estafet Next Ticket */}
          {actionableTicket && (
            <button
              onClick={() => onOpenEstafetModal(actionableTicket)}
              className={`flex-1 sm:flex-initial min-h-[44px] sm:min-h-[38px] px-3.5 py-2 rounded-xl text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer whitespace-nowrap ${
                isPuptr
                  ? 'bg-indigo-600 hover:bg-indigo-500'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="truncate">{isPuptr ? 'Proses Pertek' : isPertanian ? 'Proses LP2B' : 'Teruskan Estafet'}</span>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          )}

          {/* Blueprint Modal Trigger */}
          <button
            onClick={onOpenBlueprintModal}
            className="min-h-[44px] sm:min-h-[38px] px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
            <span>Blueprint &amp; SLA</span>
          </button>
        </div>
      </div>

      {/* Horizontal Snap-Scroll Flow on Android -> 2/4-Col Grid on Tablet/Desktop */}
      <div className={`${isMobileCollapsed ? 'hidden md:block' : 'block'} space-y-3`}>
        <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 overflow-x-auto sm:overflow-visible snap-x snap-mandatory pb-1 sm:pb-0 -mx-1 px-1 sm:mx-0 sm:px-0 no-scrollbar relative">
          {currentStages.map((stage, idx) => {
            const IconComponent = stage.icon;
            
            let count = 0;
            if (idx === 0) count = countStage1;
            if (idx === 1) count = countStage2;
            if (idx === 2) count = countStage3;
            if (idx === 3) count = countStage4;

            const isCurrentAdminRole = isPuptr 
              ? idx === 0 
              : isPertanian 
                ? idx === 0 
                : userRole === stage.id;
            const percentage = totalActive > 0 ? Math.round((count / totalActive) * 100) : 0;

            return (
              <div
                key={stage.id}
                className={`relative min-w-[244px] w-[76vw] max-w-[280px] sm:min-w-0 sm:w-auto sm:max-w-none shrink-0 snap-start p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  isCurrentAdminRole 
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/25 border-emerald-500/70 ring-1 ring-emerald-500/20' 
                    : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Header Metadata Row */}
                <div className="flex items-center justify-between gap-2 mb-2 text-[11px]">
                  <span className={`font-bold truncate ${stage.badgeClass}`}>
                    {stage.shortName}
                    {isCurrentAdminRole ? ' · Bidang Anda' : ''}
                  </span>
                  <span className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400 font-semibold shrink-0">
                    SLA {stage.sla}
                  </span>
                </div>

                {/* Icon & Title */}
                <div className="flex items-center gap-2.5 my-2">
                  <div className={`p-2 rounded-xl ${stage.barBg} text-white shadow-sm shrink-0`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-1">{stage.title}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1">{stage.description}</p>
                  </div>
                </div>

                {/* Stat Count & Progress Visual Bar */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Berkas Antrean</span>
                    <span className="text-xs sm:text-sm font-black tabular-nums text-slate-900 dark:text-white">{count} Berkas</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${stage.barBg} transition-all duration-300 rounded-full`}
                      style={{ width: `${Math.max(percentage, count > 0 ? 15 : 0)}%` }}
                    />
                  </div>
                </div>

                {/* Forward Indicator Arrow (hidden on mobile/tablet & last item) */}
                {idx < currentStages.length - 1 && (
                  <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 items-center justify-center text-slate-400 shadow-sm">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Summary Bar & Realisasi Metric */}
        <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-medium">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-slate-400 text-[10px] font-semibold block truncate">
                {isPuptr 
                  ? 'Total Pertek Tata Ruang Terbit' 
                  : isPertanian 
                    ? 'Total Berita Acara Rekomendasi LP2B Terbit' 
                    : 'Total Tiket Pendampingan Selesai / Realisasi'}
              </span>
              <span className="text-xs sm:text-sm font-extrabold tabular-nums text-emerald-400">{countDone} Dokumen Selesai Diproses</span>
            </div>
          </div>

          {actionableTicket ? (
            <div className="flex items-center gap-2 text-slate-200 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700/80 min-w-0">
              <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate text-[11px] sm:text-xs">
                <strong>Siap Proses:</strong> {actionableTicket.company_name || actionableTicket.nama_permohonan || actionableTicket.pemohon_name || actionableTicket.title || 'Berkas Masuk'} ({actionableTicket.potensi_name || actionableTicket.kecamatan || 'Kab. Luwu'})
              </span>
            </div>
          ) : (
            <span className="text-slate-400 text-[11px] sm:text-xs">Semua berkas di bidang Anda telah diproses.</span>
          )}
        </div>
      </div>

    </div>
  );
};

export default EstafetProgressBanner;
