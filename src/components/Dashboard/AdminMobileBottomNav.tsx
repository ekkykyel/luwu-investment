import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  Activity,
  FileText,
  Layers,
  Workflow,
  TrendingUp,
  Map,
  Calculator,
  Printer,
  FileCheck2,
  Compass,
  Wheat,
  Menu,
} from 'lucide-react';

export interface MobileNavTabItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface AdminMobileBottomNavProps {
  userRole: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  badges?: Record<string, number>;
}

export const getPrimaryMobileTabsByRole = (role: string): MobileNavTabItem[] => {
  const normRole = (role || '').toLowerCase().replace(/[\s-]+/g, '_');

  if (normRole === 'admin_dalak' || normRole.includes('dalak')) {
    return [
      { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
      { id: 'pengaduan', label: 'Pengaduan', icon: MessageSquare },
      { id: 'pengawasan', label: 'Pengawasan', icon: ShieldCheck },
      { id: 'fasilitasi', label: 'Fasilitasi', icon: Activity },
    ];
  }

  if (normRole === 'admin_promosi' || normRole.includes('promosi')) {
    return [
      { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
      { id: 'loi_verify', label: 'Tiket LoI', icon: FileText },
      { id: 'manage_potential', label: 'Potensi', icon: Layers },
      { id: 'investor_pipeline', label: 'Estafet', icon: Workflow },
    ];
  }

  if (normRole === 'admin_data' || normRole.includes('data')) {
    return [
      { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
      { id: 'spatial_analytics', label: 'Analitik', icon: TrendingUp },
      { id: 'puptr_spatial_editor', label: 'Peta GIS', icon: Map },
      { id: 'simulation', label: 'Simulasi', icon: Calculator },
    ];
  }

  if (normRole === 'admin_oss' || normRole.includes('oss')) {
    return [
      { id: 'overview_perizinan', label: 'Ringkasan', icon: LayoutDashboard },
      { id: 'oss_pkkpr_issuance', label: 'SK PKKPR', icon: Printer },
      { id: 'pkkpr_sync_monitor', label: 'Monitor', icon: Workflow },
      { id: 'oss_sk_archive', label: 'Arsip SK', icon: FileCheck2 },
    ];
  }

  if (normRole === 'admin_puptr' || normRole.includes('puptr') || normRole.includes('tata_ruang')) {
    return [
      { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
      { id: 'verifikasi_pkkpr', label: 'Pertek', icon: ShieldCheck },
      { id: 'puptr_spatial_catalog', label: 'RTRW', icon: Compass },
      { id: 'puptr_spatial_editor', label: 'Editor GIS', icon: Layers },
    ];
  }

  if (normRole === 'admin_pertanian' || normRole.includes('pertanian') || normRole.includes('distan')) {
    return [
      { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
      { id: 'verifikasi_pertanian', label: 'LP2B', icon: ShieldCheck },
      { id: 'pertanian_lp2b_catalog', label: 'Katalog', icon: Wheat },
      { id: 'pertanian_archive', label: 'Arsip BAP', icon: FileCheck2 },
    ];
  }

  if (normRole === 'admin_bpn' || normRole.includes('bpn') || normRole.includes('kantah')) {
    return [
      { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
      { id: 'verifikasi_bpn', label: 'Pertek BPN', icon: ShieldCheck },
      { id: 'pkkpr_sync_monitor', label: 'Monitor', icon: Workflow },
      { id: 'puptr_spatial_editor', label: 'Peta GIS', icon: Map },
    ];
  }

  // Superadmin / Operator default
  return [
    { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'loi_verify', label: 'Tiket LoI', icon: FileText },
    { id: 'oss_pkkpr_issuance', label: 'SK PKKPR', icon: Printer },
    { id: 'pengawasan', label: 'Dalak', icon: ShieldCheck },
  ];
};

export const AdminMobileBottomNav: React.FC<AdminMobileBottomNavProps> = ({
  userRole,
  activeTab,
  setActiveTab,
  isSidebarOpen,
  setIsSidebarOpen,
  badges = {},
}) => {
  const tabs = getPrimaryMobileTabsByRole(userRole);
  const isPrimaryActive = tabs.some((t) => t.id === activeTab);

  const handleSelectTab = (tabId: string) => {
    setIsSidebarOpen(false);
    setActiveTab(tabId);
    try {
      window.history.pushState({}, '', `/admin/${tabId}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // Ignore history errors in restricted frames
    }
  };

  return (
    <nav
      aria-label="Navigasi Utama Admin Android"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800/90 shadow-[0_-4px_20px_rgba(15,23,42,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.45)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="grid grid-cols-5 items-center min-h-[60px] px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = !isSidebarOpen && activeTab === tab.id;
          const badgeCount = badges[tab.id] || 0;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center min-h-[52px] py-1.5 px-1 rounded-xl transition-colors active:scale-95 cursor-pointer ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute top-0.5 w-6 h-0.5 rounded-full bg-emerald-600 dark:bg-emerald-400"
                />
              )}
              <div className="relative flex items-center justify-center">
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.4 : 1.9}
                  className="shrink-0 transition-transform"
                />
                {badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold tabular-nums flex items-center justify-center shadow-sm">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </div>
              <span
                className={`mt-1 text-[10px] leading-none tracking-tight whitespace-nowrap truncate max-w-full ${
                  isActive ? 'font-bold' : 'font-medium'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* 5th Item: Menu Drawer Trigger (highlights when user is on a secondary drawer tab or drawer is open) */}
        <button
          type="button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-expanded={isSidebarOpen}
          className={`relative flex flex-col items-center justify-center min-h-[52px] py-1.5 px-1 rounded-xl transition-colors active:scale-95 cursor-pointer ${
            isSidebarOpen || !isPrimaryActive
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          {(isSidebarOpen || !isPrimaryActive) && (
            <span
              aria-hidden="true"
              className="absolute top-0.5 w-6 h-0.5 rounded-full bg-emerald-600 dark:bg-emerald-400"
            />
          )}
          <Menu size={20} strokeWidth={isSidebarOpen || !isPrimaryActive ? 2.4 : 1.9} className="shrink-0" />
          <span
            className={`mt-1 text-[10px] leading-none tracking-tight whitespace-nowrap ${
              isSidebarOpen || !isPrimaryActive ? 'font-bold' : 'font-medium'
            }`}
          >
            Menu Lain
          </span>
        </button>
      </div>
    </nav>
  );
};

export default AdminMobileBottomNav;
