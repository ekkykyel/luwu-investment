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
  Filter
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
}

interface EstafetProgressBannerProps {
  tickets: TicketItem[];
  userRole: string; // 'admin_promosi' | 'admin_data' | 'admin_oss' | 'admin_dalak' | 'superadmin' | string
  onOpenEstafetModal: (ticket: TicketItem) => void;
  onOpenBlueprintModal: () => void;
}

export const ESTAFET_STAGES = [
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
    description: 'Inisiasi minat, verifikasi formulir LoI & profil investor.'
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
    description: 'Validasi pasokan bahan baku, LP2B & pola ruang RTRW.'
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
    description: 'Penerbitan NIB OSS-RBA, SK PKKPR & Sertifikat Standar.'
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
    description: 'Pengawasan fisik lapangan, mediasi & verifikasi LKPM.'
  }
];

export const EstafetProgressBanner: React.FC<EstafetProgressBannerProps> = ({
  tickets = [],
  userRole,
  onOpenEstafetModal,
  onOpenBlueprintModal
}) => {
  const [activeTab, setActiveTab] = useState<'all' | string>('all');

  // Count tickets per stage
  const countPromosi = tickets.filter(t => !t.status || t.status === 'Menunggu Verifikasi' || t.status === 'Draft').length;
  const countData = tickets.filter(t => t.status === 'Kajian Data & Spasial' || t.status === 'Persiapan Site Visit').length;
  const countOss = tickets.filter(t => t.status === 'Verifikasi OSS & PKKPR' || t.status === 'Mediasi Lapangan Selesai').length;
  const countDalak = tickets.filter(t => t.status === 'Pengawasan DALAK & LKPM' || t.status === 'Verifikasi OSS Berjalan').length;
  const countDone = tickets.filter(t => t.status === 'Izin Terbit / Realisasi' || t.status === 'Izin Terbit' || t.status === 'Disetujui' || t.status === 'Selesai').length;

  const totalActive = countPromosi + countData + countOss + countDalak;

  // Filter tickets needing immediate action by current admin role
  const getActionableTicketForRole = (): TicketItem | null => {
    if (userRole === 'admin_promosi') {
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
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-white shadow-md shadow-emerald-500/20">
            <Zap className="w-6 h-6 animate-pulse text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Sistem Pendampingan Investor Terpadu
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">• DPMPTSP Kab. Luwu</span>
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white mt-0.5 tracking-tight flex items-center gap-2">
              Dashboard Estafet Alur Investasi 4 Bidang
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Action Button: Quick Estafet Next Ticket */}
          {actionableTicket && (
            <button
              onClick={() => onOpenEstafetModal(actionableTicket)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md hover:shadow-emerald-500/20 transition-all flex items-center gap-2 active:scale-95"
            >
              <Send className="w-4 h-4 text-amber-300" />
              <span>Teruskan ke Bidang Berikutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Blueprint Modal Trigger */}
          <button
            onClick={onOpenBlueprintModal}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all border border-slate-300 dark:border-slate-700 flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>Blueprint & SLA</span>
          </button>
        </div>
      </div>

      {/* Horizontal Progress Bar Flow (4 Sequential Bidang Stages) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
        {ESTAFET_STAGES.map((stage, idx) => {
          const IconComponent = stage.icon;
          
          let count = 0;
          if (stage.id === 'admin_promosi') count = countPromosi;
          if (stage.id === 'admin_data') count = countData;
          if (stage.id === 'admin_oss') count = countOss;
          if (stage.id === 'admin_dalak') count = countDalak;

          const isCurrentAdminRole = userRole === stage.id;
          const percentage = totalActive > 0 ? Math.round((count / totalActive) * 100) : 0;

          return (
            <div
              key={stage.id}
              className={`relative p-4 rounded-2xl border transition-all ${
                isCurrentAdminRole 
                  ? 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-500 shadow-md ring-2 ring-emerald-500/20' 
                  : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Header Badge & Stage Number */}
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${stage.badgeClass}`}>
                  {stage.shortName}
                </span>
                {isCurrentAdminRole && (
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-emerald-500 text-slate-950 animate-pulse">
                    Bidang Anda
                  </span>
                )}
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
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Berkas Aktif:</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{count} Tiket</span>
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
              {idx < ESTAFET_STAGES.length - 1 && (
                <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 items-center justify-center text-slate-400 shadow-sm">
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Summary Bar & Realisasi Metric */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold block">Total Tiket Pendampingan Selesai / Realisasi</span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{countDone} Berkas Berhasil Dampingi</span>
          </div>
        </div>

        {actionableTicket ? (
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span className="line-clamp-1">
              <strong>Tiket Siap Estafet:</strong> {actionableTicket.company_name} ({actionableTicket.potensi_name})
            </span>
          </div>
        ) : (
          <span className="text-slate-500 dark:text-slate-400 text-xs italic">Semua tiket di bidang Anda telah diestafetkan.</span>
        )}
      </div>

    </div>
  );
};

export default EstafetProgressBanner;
