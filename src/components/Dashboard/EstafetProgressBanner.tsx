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
  Wheat
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
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    barBg: 'bg-emerald-500',
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
    badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
    barBg: 'bg-blue-500',
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
    badgeClass: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    barBg: 'bg-indigo-500',
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
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    barBg: 'bg-amber-500',
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
    badgeClass: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
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
    badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
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
    badgeClass: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
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
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
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
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
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
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
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
    badgeClass: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
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
    badgeClass: 'bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30',
    barBg: 'bg-green-600',
    description: 'Verifikasi kesanggupan lahan pengganti LP2B (1:1 / 1:3), terbit BAP & TTE Kadis Pertanian.',
    sla: '1 Hari'
  }
];

export const EstafetProgressBanner: React.FC<EstafetProgressBannerProps> = ({
  tickets = [],
  userRole,
  onOpenEstafetModal,
  onOpenBlueprintModal
}) => {
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
    ? 'Sistem Verifikasi Pertimbangan Teknis (Pertek) Tata Ruang'
    : isPertanian 
      ? 'Sistem Perlindungan Lahan & Ketahanan Pangan (LP2B)'
      : 'Sistem Pendampingan Investor Terpadu';

  const opdSubtitle = isPuptr 
    ? '• Dinas PUPTR Kab. Luwu'
    : isPertanian 
      ? '• Dinas Pertanian Kab. Luwu'
      : '• DPMPTSP Kab. Luwu';

  const bannerTitle = isPuptr
    ? 'Dashboard Estafet Pertimbangan Teknis 4 Bidang PUPTR'
    : isPertanian
      ? 'Dashboard Estafet Evaluasi LP2B 4 Bidang Pertanian'
      : 'Dashboard Estafet Alur Investasi 4 Bidang DPMPTSP';

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
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xl space-y-5 transition-all">
      
      {/* Top Title & Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl text-white shadow-md ${
            isPuptr 
              ? 'bg-gradient-to-br from-indigo-600 to-blue-700 shadow-indigo-500/20' 
              : isPertanian 
                ? 'bg-gradient-to-br from-emerald-600 to-green-700 shadow-emerald-500/20' 
                : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20'
          }`}>
            <Zap className="w-6 h-6 animate-pulse text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                isPuptr 
                  ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30' 
                  : isPertanian 
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' 
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              }`}>
                {headerBadge}
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">{opdSubtitle}</span>
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white mt-0.5 tracking-tight flex items-center gap-2">
              {bannerTitle}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl line-clamp-1">
              {bannerDesc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Action Button: Quick Estafet Next Ticket */}
          {actionableTicket && (
            <button
              onClick={() => onOpenEstafetModal(actionableTicket)}
              className={`px-4 py-2 rounded-xl text-white text-xs font-black shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer ${
                isPuptr
                  ? 'bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-500 hover:to-blue-500 shadow-indigo-500/20'
                  : isPertanian
                    ? 'bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 hover:from-emerald-500 hover:to-green-500 shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20'
              }`}
            >
              <Send className="w-4 h-4 text-amber-300" />
              <span>{isPuptr ? 'Proses Berkas Tata Ruang' : isPertanian ? 'Proses Rekomendasi LP2B' : 'Teruskan ke Bidang Berikutnya'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Blueprint Modal Trigger */}
          <button
            onClick={onOpenBlueprintModal}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span>Blueprint &amp; SLA OPD</span>
          </button>
        </div>
      </div>

      {/* Horizontal Progress Bar Flow (4 Sequential Bidang Stages) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
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
              className={`relative p-4 rounded-2xl border transition-all ${
                isCurrentAdminRole 
                  ? 'bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-transparent border-indigo-500 shadow-md ring-2 ring-indigo-500/20' 
                  : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Header Badge & Stage Number */}
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${stage.badgeClass}`}>
                  {stage.shortName}
                </span>
                <span className="text-[9px] font-mono text-slate-400 font-bold">
                  SLA: {stage.sla}
                </span>
              </div>

              {/* Icon & Title */}
              <div className="flex items-center gap-2.5 my-2">
                <div className={`p-2 rounded-xl ${stage.barBg} text-white shadow-sm`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-1">{stage.title}</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1">{stage.description}</p>
                </div>
              </div>

              {/* Stat Count & Progress Visual Bar */}
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Berkas Antrean:</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{count} Berkas</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${stage.barBg} transition-all duration-500 rounded-full`}
                    style={{ width: `${Math.max(percentage, count > 0 ? 15 : 0)}%` }}
                  />
                </div>
              </div>

              {/* Forward Indicator Arrow (hidden on last item) */}
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
      <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">
              {isPuptr 
                ? 'Total Pertimbangan Teknis (Pertek) Tata Ruang Terbit' 
                : isPertanian 
                  ? 'Total Berita Acara Rekomendasi LP2B Terbit' 
                  : 'Total Tiket Pendampingan Selesai / Realisasi'}
            </span>
            <span className="text-sm font-black text-emerald-400">{countDone} Dokumen Selesai Diproses</span>
          </div>
        </div>

        {actionableTicket ? (
          <div className="flex items-center gap-2 text-slate-300 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700/80">
            <Building2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="line-clamp-1">
              <strong>Antrean Siap Proses:</strong> {actionableTicket.company_name || actionableTicket.nama_permohonan || actionableTicket.pemohon_name || actionableTicket.title || 'Berkas Masuk'} ({actionableTicket.potensi_name || actionableTicket.kecamatan || 'Kabupaten Luwu'})
            </span>
          </div>
        ) : (
          <span className="text-slate-400 text-xs italic">Semua berkas di bidang Anda telah diproses.</span>
        )}
      </div>

    </div>
  );
};

export default EstafetProgressBanner;
