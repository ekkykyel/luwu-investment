import React from 'react';
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
  Activity
} from 'lucide-react';
import { LuwuLogo } from '../LuwuLogo.js';
import LanguageSwitcher from '../LanguageSwitcher.js';
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

export const getMenusByRole = (role: string): MenuGroup[] => {
  const allMenuGroups: MenuGroup[] = [
    {
      group: 'Utama',
      items: [
        { id: 'overview', name: 'Overview', icon: LayoutDashboard },
        { id: 'overview_perizinan', name: 'Overview Perizinan', icon: ShieldCheck },
      ]
    },
    {
      group: 'Promosi & Pelayanan',
      items: [
        { id: 'loi_verify', name: 'Tiket Minat (LoI)', icon: FileText },
        { id: 'manage_potential', name: 'Kelola Potensi Investasi', icon: Layers },
        { id: 'site-selection', name: 'Rekomendasi Lokasi AI', icon: MapPin },
        { id: 'testimonials', name: 'Review Testimoni', icon: MessageSquare },
      ]
    },
    {
      group: 'Pengawasan & Dalak',
      items: [
        { id: 'field_inspection', name: 'Pengaduan Masyarakat', icon: MessageSquare },
        { id: 'site_visit', name: 'Jadwal Site Visit / Mediasi', icon: MapPin },
        { id: 'simulation', name: 'Kalkulasi Dampak', icon: Calculator },
      ]
    },
    {
      group: 'Perizinan & OSS',
      items: [
        { id: 'verifikasi_pkkpr', name: 'Verifikasi Tata Ruang (PKKPR)', icon: ShieldCheck },
        { id: 'realisasi_nib', name: 'Realisasi NIB', icon: CheckCircle2 },
        { id: 'verify', name: 'Verifikasi Berkas NIB', icon: Activity },
      ]
    },
    {
      group: 'Data & Spasial',
      items: [
        { id: 'spatial_analytics', name: 'Analitik & Laporan', icon: TrendingUp },
        { id: 'gis_spatial', name: 'Kelola GIS Spasial', icon: Map },
      ]
    }
  ];

  if (role === 'superadmin') return allMenuGroups;

  return allMenuGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (role === 'admin_promosi') {
        return ['Overview', 'Tiket Minat (LoI)', 'Kelola Potensi Investasi', 'Rekomendasi Lokasi AI', 'Review Testimoni'].includes(item.name);
      }
      if (role === 'admin_dalak') {
        return ['Overview', 'Pengaduan Masyarakat', 'Jadwal Site Visit / Mediasi', 'Kalkulasi Dampak'].includes(item.name);
      }
      if (role === 'admin_oss') {
        return ['Overview Perizinan', 'Verifikasi Tata Ruang (PKKPR)', 'Realisasi NIB', 'Verifikasi Berkas NIB'].includes(item.name);
      }
      if (role === 'admin_data') {
        return ['Overview', 'Analitik & Laporan', 'Kelola GIS Spasial', 'Kalkulasi Dampak'].includes(item.name);
      }
      return item.name === 'Overview';
    })
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
      case 'admin_promosi': return 'Admin Promosi';
      case 'admin_dalak': return 'Admin Dalak';
      case 'admin_oss': return 'Admin Perizinan OSS';
      case 'admin_data': return 'Admin Data & Spasial';
      case 'superadmin': return 'Superadmin DPMPTSP';
      default: return 'Administrator';
    }
  };

  return (
    <div className={`
      fixed inset-y-0 left-0 z-30 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/80 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col shadow-2xl
      ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LuwuLogo className="h-9 w-9" />
          <div className="flex flex-col">
            <span className="font-extrabold text-white tracking-tight text-base leading-snug">DPMPTSP Luwu</span>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md inline-block w-fit mt-0.5">
              {getRoleDisplayName(userRole)}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 px-3 py-4 space-y-5 overflow-y-auto custom-scrollbar">
        {menuGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">
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
                      setActiveTab(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      isActive 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-950' 
                        : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'} />
                    <span className="truncate">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Area */}
      <div className="p-4 border-t border-slate-800/80 space-y-3 bg-slate-900/50">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-medium text-slate-400">Bahasa</span>
          <LanguageSwitcher isDark={true} />
        </div>

        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-rose-400 bg-slate-800/50 hover:bg-rose-500/10 border border-slate-700/50 hover:border-rose-500/30 rounded-xl transition-all cursor-pointer shadow-sm"
        >
          <LogOut size={15} />
          <span>{t('dashboard.logout', 'Keluar System')}</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
// architecture refactor: implemented dynamic role-based unified workspace
