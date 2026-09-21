import React, { Fragment } from 'react';
import { 
  LayoutDashboard, 
  ShieldCheck, 
  Calculator, 
  LogOut, 
  TrendingUp,
  Map,
  Layers,
  CheckCircle2,
  MapPin,
  MessageSquare,
  FileText,
  Activity,
  Sparkles,
  Users,
  Building2,
  ArrowUpRight,
  Workflow,
  Settings,
  FileCheck2
} from 'lucide-react';
import { LuwuLogo } from '../LuwuLogo.js';
import ThemeToggle from '@/components/ThemeToggle';
import { useTranslation } from 'react-i18next';

export interface MenuItem {
  id: string;
  name: string;
  icon: React.ElementType;
}

export interface MenuGroup {
  group: string;
  items: MenuItem[];
}

export const isOperatorWorkspaceRole = (role: string): boolean => {
  const normRole = (role || "").toLowerCase().replace(/[\s-]+/g, "_");
  return (
    normRole === 'superadmin' ||
    normRole === 'super_admin' ||
    normRole.includes('super') ||
    normRole === 'admin_promosi' ||
    normRole.includes('promosi') ||
    normRole === 'operator' ||
    normRole.includes('operator')
  );
};

export const getMenusByRole = (role: string): MenuGroup[] => {
  const isAllowedWorkspace = isOperatorWorkspaceRole(role);

  const allMenuGroups: MenuGroup[] = [
    {
      group: 'Utama',
      items: [
        { id: 'overview', name: 'Overview', icon: LayoutDashboard },
        ...(isAllowedWorkspace ? [{ id: 'operator_workspace', name: 'Operator Workspace', icon: Building2 }] : []),
        { id: 'overview_perizinan', name: 'Overview Perizinan', icon: ShieldCheck },
      ]
    },
    {
      group: 'Promosi & Pelayanan',
      items: [
        { id: 'loi_verify', name: 'Tiket Minat (LoI)', icon: FileText },
        { id: 'manage_potential', name: 'Kelola Potensi Investasi', icon: Layers },
        { id: 'site-selection', name: 'Rekomendasi Lokasi AI', icon: MapPin },
        { id: 'komoditas', name: 'Harga Komoditas', icon: Activity },
        { id: 'testimonials', name: 'Review Testimoni', icon: MessageSquare },
      ]
    },
    {
      group: 'Pengawasan & Dalak',
      items: [
        { id: 'pengaduan', name: 'Pengaduan Masyarakat', icon: MessageSquare },
        { id: 'pengawasan', name: 'Pengawasan & Kepatuhan', icon: ShieldCheck },
        { id: 'fasilitasi', name: 'Fasilitasi & Mediasi', icon: Activity },
        { id: 'laporan', name: 'Evaluasi & Laporan Dalak', icon: FileText },
      ]
    },
    {
      group: 'Perizinan & OSS',
      items: [
        { id: 'pkkpr_sync_monitor', name: 'Monitoring Proses Bisnis PKKPR', icon: Workflow },
        { id: 'verifikasi_pkkpr', name: 'Verifikasi PKKPR & Tata Ruang', icon: ShieldCheck },
        { id: 'verifikasi_pertanian', name: 'Rekomendasi Lahan Pertanian (LP2B)', icon: ShieldCheck },
        { id: 'realisasi_nib', name: 'Realisasi NIB (OSS-RBA)', icon: CheckCircle2 },
        { id: 'puptr_archive', name: 'Arsip Pertek PUPTR', icon: FileCheck2 },
        { id: 'pertanian_archive', name: 'Arsip BAP Pertanian', icon: FileCheck2 },
        { id: 'oss_sk_archive', name: 'Arsip SK PKKPR Final', icon: FileCheck2 },
      ]
    },
    {
      group: 'Pengaturan OPD & TTD Kepala Dinas',
      items: [
        { id: 'puptr_settings', name: 'Pengaturan Dinas PUPTR', icon: Settings },
        { id: 'pertanian_settings', name: 'Pengaturan Dinas Pertanian', icon: Settings },
        { id: 'oss_settings', name: 'Pengaturan DPMPTSP / OSS', icon: Settings },
      ]
    },
    {
      group: 'Manajemen Spasial & Finansial',
      items: [
        { id: 'spatial_analytics', name: 'Analitik & Laporan Spasial', icon: TrendingUp },
        { id: 'gis_spatial', name: 'Kelola GIS Spasial', icon: Map },
        { id: 'simulation', name: 'Kalkulasi Dampak & ROI', icon: Calculator },
      ]
    },
    {
      group: 'Administrator & Sistem AI',
      items: [
        { id: 'rag_injection', name: 'Injek Pengetahuan AI (RAG)', icon: Sparkles },
        { id: 'manage_operators', name: 'Tambah & Kelola Operator', icon: Users },
        { id: 'mpp_portal', name: 'Portal MPP Simpurusiang', icon: Building2 },
      ]
    }
  ];

  const normRole = (role || "").toLowerCase().replace(/[\s-]+/g, "_");
  if (normRole === 'superadmin' || normRole.includes('super') || normRole.includes('operator')) return allMenuGroups;

  let matchedRole = 'overview';
  if (normRole === 'admin_dalak' || normRole.includes('dalak')) matchedRole = 'admin_dalak';
  else if (normRole === 'admin_promosi' || normRole.includes('promosi')) matchedRole = 'admin_promosi';
  else if (normRole === 'admin_puptr' || normRole.includes('puptr') || normRole.includes('tata_ruang')) matchedRole = 'admin_puptr';
  else if (normRole === 'admin_pertanian' || normRole.includes('pertanian') || normRole.includes('distan')) matchedRole = 'admin_pertanian';
  else if (normRole === 'admin_oss' || normRole.includes('oss')) matchedRole = 'admin_oss';
  else if (normRole === 'admin_data' || normRole.includes('data')) matchedRole = 'admin_data';

  const allowedIdsByRole: Record<string, string[]> = {
    admin_promosi: ['overview', 'operator_workspace', 'loi_verify', 'manage_potential', 'site-selection', 'testimonials'],
    admin_dalak: ['overview', 'pengaduan', 'pengawasan', 'fasilitasi', 'laporan'],
    admin_puptr: ['overview', 'pkkpr_sync_monitor', 'verifikasi_pkkpr', 'gis_spatial', 'spatial_analytics', 'puptr_archive', 'puptr_settings'],
    admin_pertanian: ['overview', 'pkkpr_sync_monitor', 'verifikasi_pertanian', 'gis_spatial', 'spatial_analytics', 'pertanian_archive', 'pertanian_settings'],
    admin_oss: ['overview_perizinan', 'pkkpr_sync_monitor', 'realisasi_nib', 'spatial_analytics', 'oss_sk_archive', 'oss_settings'],
    admin_data: ['overview', 'pkkpr_sync_monitor', 'spatial_analytics', 'gis_spatial', 'simulation'],
  };

  const allowedIds = allowedIdsByRole[matchedRole] || ['overview'];

  return allMenuGroups.map(group => ({
    ...group,
    items: group.items.filter(item => allowedIds.includes(item.id))
  })).filter(group => group.items.length > 0);
};

interface AdminSidebarProps {
  userRole: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  onLogout: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  userRole,
  activeTab,
  setActiveTab,
  isSidebarOpen,
  setIsSidebarOpen,
  onLogout,
}) => {
  const { t } = useTranslation();
  const menuGroups = getMenusByRole(userRole);

  const getRoleDisplayName = (r: string) => {
    switch (r) {
      case 'admin_promosi': return 'Bidang Promosi & Penanaman Modal';
      case 'admin_dalak': return 'Bidang Dalak';
      case 'admin_oss': return 'Bidang Perizinan / OSS';
      case 'admin_data': return 'Bidang Perencanaan & Data';
      case 'superadmin': return 'Superadmin DPMPTSP';
      default: return 'Administrator';
    }
  };

  return (
    <Fragment>
      {/* Mobile Overlay Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800/80 transform transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:translate-x-0 flex flex-col shadow-2xl
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LuwuLogo className="w-auto h-10 md:h-12 object-contain" />
          <div className="flex flex-col">
            <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-base leading-snug">DPMPTSP Luwu</span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md inline-block w-fit mt-0.5">
              {getRoleDisplayName(userRole)}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Access to Operator Workspace - Khusus Superadmin & Admin Promosi */}
      {isOperatorWorkspaceRole(userRole) && (
        <div className="px-4 pt-3 pb-1">
          <button
            onClick={() => {
              console.log("[AdminSidebar] Operator Workspace Quick Launch clicked -> navigating to /operator-workspace");
              window.location.href = "/operator-workspace";
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/20 hover:shadow-lg transition-all cursor-pointer group active:scale-95"
            title="Buka Ruang Kerja Operator (Input Form & Peta GIS)"
          >
            <div className="flex items-center gap-2.5">
              <Building2 size={16} className="text-white shrink-0" />
              <span className="truncate">Operator Workspace</span>
            </div>
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform opacity-90 shrink-0" />
          </button>
        </div>
      )}

      {/* Navigation Groups */}
      <div className="flex-1 px-3 py-3 space-y-5 overflow-y-auto custom-scrollbar">
        {menuGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 font-mono">
              {group.group}
            </div>
            <div className="space-y-1 mt-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      console.log(`[AdminSidebar] Menu item clicked: id='${item.id}', name='${item.name}'`);
                      if (item.id === 'operator_workspace') {
                        window.location.href = "/operator-workspace";
                        return;
                      }
                      setActiveTab(item.id);
                      setIsSidebarOpen(false);
                      try {
                        window.history.pushState({}, "", `/admin/${item.id}`);
                      } catch (e) {}
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      isActive 
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shadow-sm shadow-emerald-100 dark:shadow-emerald-950' 
                        : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-emerald-400 animate-pulse' : 'text-slate-600 dark:text-slate-400'} />
                    <span className="truncate">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Area */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 space-y-3 bg-white dark:bg-slate-900/50">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Mode Tampilan</span>
          <ThemeToggle />
        </div>

        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-rose-500 dark:hover:text-rose-400 bg-slate-100 dark:bg-slate-800/50 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-slate-200 dark:border-slate-700/50 hover:border-rose-300 dark:hover:border-rose-500/30 rounded-xl transition-all cursor-pointer shadow-sm"
        >
          <LogOut size={15} />
          <span>{t('dashboard.logout', 'Keluar System')}</span>
        </button>
      </div>
      </div>
    </Fragment>
  );
};

export default AdminSidebar;
// architecture refactor: implemented dynamic role-based unified workspace
// ux fix: dynamic role rendering in admin sidebar

// ux pivot: removed i18n and implemented global light/dark mode toggle
// ui/ux pivot: aligned dalak workspace with official government tupoksi