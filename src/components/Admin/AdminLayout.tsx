import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Compass,
  FileText,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Bell,
  Search,
  ExternalLink,
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  Briefcase,
  MapPin,
  TrendingUp,
  Layers,
  Sparkles,
  RefreshCw,
  FolderOpen,
  Send,
  Database,
  Sliders,
  Sun,
  Moon
} from "lucide-react";
import { LuwuLogo } from "../LuwuLogo";
import { supabase } from "../../lib/supabaseClient";
import LoketPelayanan from "./Views/LoketPelayanan";
import EOffice from "./Views/EOffice";
import ManajemenASN from "./Views/ManajemenASN";
import TataRuangInvestasi from "./Views/TataRuangInvestasi";
import PengaturanWeb from "./Views/PengaturanWeb";
import PortalMppManagement from "./Views/PortalMppManagement";
import { MppAdminReport } from "../mpp/MppAdminReport";
import { Star } from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: any;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "beranda",
    label: "Beranda",
    path: "/admin/beranda",
    icon: LayoutDashboard,
    description: "Ringkasan metrik eksekutif & operasional MPP"
  },
  {
    id: "laporan-mpp",
    label: "Laporan Eksekutif MPP",
    path: "/admin/laporan-mpp",
    icon: Star,
    description: "Laporan statistik Antrean & Survei Kepuasan SKM"
  },
  {
    id: "loket-pelayanan",
    label: "Loket Pelayanan",
    path: "/admin/loket-pelayanan",
    icon: Building2,
    description: "Antrean terpadu, instansi vertikal & loket OPD"
  },
  {
    id: "tata-ruang-investasi",
    label: "Tata Ruang & Investasi",
    path: "/admin/tata-ruang-investasi",
    icon: Compass,
    description: "Digitasi spasial RTRW, IPRO & izin investasi"
  },
  {
    id: "e-office",
    label: "Sistem E-Office",
    path: "/admin/e-office",
    icon: FileText,
    description: "Persuratan dinas, disposisi digital & verifikasi berkas"
  },
  {
    id: "manajemen-asn",
    label: "Manajemen ASN",
    path: "/admin/manajemen-asn",
    icon: Users,
    description: "Jadwal petugas front office, absensi & penugasan"
  },
  {
    id: "kelola-portal",
    label: "Kelola Portal MPP",
    path: "/admin/kelola-portal",
    icon: Sliders,
    description: "Kelola instansi, layanan, fasilitas, berita & aduan warga"
  },
  {
    id: "pengaturan-web",
    label: "Pengaturan Web",
    path: "/admin/pengaturan-web",
    icon: Settings,
    description: "Konfigurasi portal publik, banner & integrasi sistem"
  }
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // State Management & Theme Control
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem("luwu_admin_theme");
    return saved !== "light";
  });

  useEffect(() => {
    localStorage.setItem("luwu_admin_theme", isDark ? "dark" : "light");
  }, [isDark]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<"online" | "offline" | "checking">("checking");
  const [operatorUser, setOperatorUser] = useState<{
    email: string;
    fullName: string;
    roleName: string;
  }>({
    email: "operator@luwukab.go.id",
    fullName: "Petugas Administrator",
    roleName: "Operator MPP Simpurusiang"
  });
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Active Route Calculation
  const activePath = location.pathname.toLowerCase();
  const currentNav = NAV_ITEMS.find((item) => activePath === item.path || activePath.startsWith(item.path)) || NAV_ITEMS[0];

  // Supabase Session Fetching & Guard
  useEffect(() => {
    let isMounted = true;

    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          // Check local token fallback
          const localToken = localStorage.getItem("luwu_session_token");
          if (!localToken) {
            navigate("/gerbang-operator-luwu", { replace: true });
            return;
          }
        }

        if (session?.user && isMounted) {
          const email = session.user.email || "petugas@luwukab.go.id";
          const fullName = session.user.user_metadata?.full_name || 
                           session.user.user_metadata?.name || 
                           email.split("@")[0].replace(/[._]/g, " ").toUpperCase();
          const role = session.user.user_metadata?.role || "Administrator MPP";

          setOperatorUser({
            email,
            fullName,
            roleName: typeof role === "string" ? role : "Operator Pelayanan Terpadu"
          });
        }
      } catch {
        // Fallback diam
      }
    };

    fetchSession();

    // Listen to Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        navigate("/gerbang-operator-luwu", { replace: true });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Realtime Database Status Checker
  const checkDatabaseConnection = useCallback(async () => {
    try {
      const { error } = await supabase
        .from("investments")
        .select("id", { count: "exact", head: true });

      if (error && error.message && !error.message.includes("permission")) {
        setDbStatus("offline");
      } else {
        setDbStatus("online");
      }
    } catch {
      setDbStatus("offline");
    }
  }, []);

  useEffect(() => {
    checkDatabaseConnection();
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        checkDatabaseConnection();
      }
    }, 60000); // 60s lightweight polling when tab is active
    return () => clearInterval(interval);
  }, [checkDatabaseConnection]);

  // Handle Logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("luwu_session_token");
      localStorage.removeItem("luwu_user_role");
      document.cookie = "sb-access-token=; path=/; max-age=0; SameSite=None; Secure";
      navigate("/gerbang-operator-luwu", { replace: true });
    } catch {
      navigate("/gerbang-operator-luwu", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div id="admin-root-container" className={`min-h-screen w-full flex flex-col md:flex-row overflow-hidden font-sans select-none transition-colors duration-300 ${
      isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    }`}>
      {/* ── GLOBAL ANDROID FRIENDLY & DUAL THEME STYLES ── */}
      <style>{`
        /* Android Friendly Font Scaling & Comfort Touch Targets */
        @media (max-width: 640px) {
          #admin-root-container h1 { font-size: 1.1rem !important; }
          #admin-root-container h2 { font-size: 1.05rem !important; }
          #admin-root-container h3 { font-size: 0.95rem !important; }
          #admin-root-container h4 { font-size: 0.88rem !important; }
          #admin-root-container h5 { font-size: 0.82rem !important; }
          
          /* Prevent giant numbers from overflowing card grids */
          #admin-root-container .text-2xl,
          #admin-root-container .text-3xl,
          #admin-root-container .text-4xl {
            font-size: 1.25rem !important;
            line-height: 1.3 !important;
          }

          #admin-root-container p,
          #admin-root-container span,
          #admin-root-container td,
          #admin-root-container th,
          #admin-root-container input,
          #admin-root-container select,
          #admin-root-container textarea {
            font-size: 11.5px !important;
          }

          /* Minimum touch height for Android fingers */
          #admin-root-container button,
          #admin-root-container select,
          #admin-root-container input,
          #admin-root-container a,
          #admin-root-container .cursor-pointer {
            min-height: 44px !important;
          }

          /* Ensure badges wrap and don't get cut off */
          #admin-root-container .px-3.py-1,
          #admin-root-container .rounded-full {
            max-width: 100% !important;
            white-space: normal !important;
            word-break: break-word !important;
          }
        }

        /* LIGHT MODE OVERRIDES */
        ${!isDark ? `
          #admin-root-container {
            background-color: #f8fafc !important;
            color: #0f172a !important;
          }
          #admin-root-container header {
            background-color: rgba(255, 255, 255, 0.95) !important;
            border-bottom-color: #e2e8f0 !important;
          }
          #admin-root-container aside {
            background-color: #ffffff !important;
            border-right-color: #e2e8f0 !important;
          }
          #admin-root-container aside h1,
          #admin-root-container header h2 {
            color: #0f172a !important;
          }
          #admin-root-container .bg-slate-900,
          #admin-root-container .bg-slate-950,
          #admin-root-container .bg-slate-850,
          #admin-root-container .bg-slate-900\\/90,
          #admin-root-container .bg-slate-900\\/80,
          #admin-root-container .bg-slate-900\\/40,
          #admin-root-container .bg-slate-950\\/70,
          #admin-root-container .bg-slate-950\\/60 {
            background-color: #ffffff !important;
            border-color: #e2e8f0 !important;
            color: #0f172a !important;
            box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.04) !important;
          }
          #admin-root-container .border-slate-800,
          #admin-root-container .border-slate-800\\/80,
          #admin-root-container .border-slate-850 {
            border-color: #e2e8f0 !important;
          }
          #admin-root-container .text-white,
          #admin-root-container h1,
          #admin-root-container h2,
          #admin-root-container h3,
          #admin-root-container h4,
          #admin-root-container h5 {
            color: #0f172a !important;
          }
          #admin-root-container .text-slate-400,
          #admin-root-container .text-slate-300,
          #admin-root-container .text-slate-500 {
            color: #475569 !important;
          }
          #admin-root-container input,
          #admin-root-container select,
          #admin-root-container textarea {
            background-color: #ffffff !important;
            border-color: #cbd5e1 !important;
            color: #0f172a !important;
          }
          #admin-root-container table th {
            background-color: #f1f5f9 !important;
            color: #334155 !important;
          }
          #admin-root-container table tr {
            border-bottom-color: #e2e8f0 !important;
          }
          #admin-root-container table tr:hover {
            background-color: #f8fafc !important;
          }
        ` : ''}
      `}</style>
      
      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
        />
      )}

      {/* ── SIDEBAR KIRI ── */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isDark ? "bg-slate-900 border-r border-slate-800/80" : "bg-white border-r border-slate-200"
        } ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Sidebar Brand Header */}
        <div className={`p-5 border-b ${isDark ? "border-slate-800/80" : "border-slate-200"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LuwuLogo className="w-9 h-9 object-contain drop-shadow-md" />
              <div>
                <h1 className={`text-xs font-black tracking-wider uppercase font-sans ${isDark ? "text-white" : "text-slate-900"}`}>
                  MPP SIMPURUSIANG
                </h1>
                <p className="text-[10px] text-emerald-500 font-semibold tracking-tight">
                  Pemerintah Kabupaten Luwu
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Sidebar Navigation Links */}
        <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className={`px-3 pb-2 text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Menu Utama Sistem
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentNav.id === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  setIsSidebarOpen(false);
                }}
                className={`w-full group flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-950/40"
                    : isDark
                    ? "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    size={17}
                    className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? "text-white" : isDark ? "text-slate-400 group-hover:text-emerald-400" : "text-slate-500 group-hover:text-emerald-600"
                    }`}
                  />
                  <span className="truncate tracking-wide text-left">{item.label}</span>
                </div>
                {isActive && <ChevronRight size={14} className="text-white/80 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Sidebar Bottom Footer Info */}
        <div className={`p-4 border-t space-y-3 ${isDark ? "border-slate-800/80 bg-slate-900/40" : "border-slate-200 bg-slate-50"}`}>
          <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? "bg-slate-850 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className={`text-[11px] font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>Server SPBE Luwu</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
              v2.6 Live
            </span>
          </div>

          <button
            onClick={() => navigate("/")}
            className={`w-full py-2 px-3 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all ${
              isDark ? "bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200" : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs"
            }`}
          >
            <ExternalLink size={13} />
            <span>Lihat Portal Publik</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* ── TOP HEADER ── */}
        <header className={`h-16 px-4 sm:px-6 border-b backdrop-blur-md flex items-center justify-between z-30 sticky top-0 transition-colors ${
          isDark ? "bg-slate-900/90 border-slate-800/80" : "bg-white/95 border-slate-200 shadow-xs"
        }`}>
          
          {/* Left: Mobile Toggle & Breadcrumb Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={`p-2 rounded-xl md:hidden shrink-0 ${
                isDark ? "bg-slate-800 text-slate-300 hover:text-white" : "bg-slate-100 text-slate-700 hover:text-slate-900"
              }`}
              aria-label="Buka Menu"
            >
              <Menu size={18} />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider hidden sm:inline-block">
                  Dashboard
                </span>
                <span className={`${isDark ? "text-slate-600" : "text-slate-300"} hidden sm:inline-block`}>/</span>
                <h2 className={`text-sm sm:text-base font-bold tracking-tight truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                  {currentNav.label}
                </h2>
              </div>
              <p className={`text-[11px] truncate hidden md:block ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {currentNav.description}
              </p>
            </div>
          </div>

          {/* Right: Theme Toggle, Database Indicator, Profile Info, & Logout */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* ── PROMINENT THEME TOGGLE BUTTON ── */}
            <button
              onClick={() => setIsDark(!isDark)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer min-h-[44px] ${
                isDark
                  ? "bg-amber-950/50 border-amber-500/30 text-amber-300 hover:bg-amber-900/70"
                  : "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100 shadow-xs"
              }`}
              title="Ganti Tema Dashboard (Gelap / Terang)"
            >
              {isDark ? <Sun size={15} className="text-amber-400 shrink-0" /> : <Moon size={15} className="text-amber-700 shrink-0" />}
              <span className="text-[11px] font-bold">
                {isDark ? "Tema Terang" : "Tema Gelap"}
              </span>
            </button>

            {/* Database Realtime Indicator */}
            <div
              title={dbStatus === "online" ? "Koneksi Supabase PostgreSQL Stabil" : "Koneksi Database Terputus"}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                dbStatus === "online"
                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/30"
                  : dbStatus === "offline"
                  ? "bg-rose-950/80 text-rose-300 border-rose-500/30"
                  : "bg-amber-950/80 text-amber-300 border-amber-500/30"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  dbStatus === "online"
                    ? "bg-emerald-400 animate-pulse"
                    : dbStatus === "offline"
                    ? "bg-rose-500"
                    : "bg-amber-400 animate-ping"
                }`}
              />
              <span className="hidden sm:inline">
                {dbStatus === "online"
                  ? "Online"
                  : dbStatus === "offline"
                  ? "Offline"
                  : "Cek..."}
              </span>
            </div>

            {/* Operator Staff Profile Badge */}
            <div className={`hidden lg:flex items-center gap-2.5 pl-2 border-l ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <div className="w-8 h-8 rounded-lg bg-emerald-900/60 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold text-xs">
                {operatorUser.fullName.charAt(0)}
              </div>
              <div className="text-left">
                <span className={`text-xs font-bold block leading-none ${isDark ? "text-white" : "text-slate-900"}`}>
                  {operatorUser.fullName}
                </span>
                <span className={`text-[10px] block mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {operatorUser.roleName}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-white border border-rose-800/40 text-xs font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50 min-h-[44px]"
              title="Keluar dari sesi petugas"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">{isLoggingOut ? "Keluar..." : "Logout"}</span>
            </button>
          </div>
        </header>

        {/* ── MAIN BODY CONTENT AREA ── */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 space-y-6">
          
          {/* Sub-view Rendering based on Active Nav */}
          {currentNav.id === "beranda" && <BerandaDashboardView operatorUser={operatorUser} isDark={isDark} />}
          {currentNav.id === "loket-pelayanan" && <LoketPelayanan isDark={isDark} />}
          {currentNav.id === "tata-ruang-investasi" && <TataRuangInvestasi isDark={isDark} />}
          {currentNav.id === "e-office" && <EOffice isDark={isDark} />}
          {currentNav.id === "manajemen-asn" && <ManajemenASN isDark={isDark} />}
          {currentNav.id === "kelola-portal" && <PortalMppManagement isDark={isDark} />}
          {currentNav.id === "pengaturan-web" && <PengaturanWeb isDark={isDark} />}
          {currentNav.id === "laporan-mpp" && <MppAdminReport isDarkMode={isDark} />}
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-VIEWS FOR ADMIN LAYOUT MODULES
// ─────────────────────────────────────────────────────────────────────────────

function BerandaDashboardView({ operatorUser, isDark = true }: { operatorUser: any; isDark?: boolean }) {
  const navigate = useNavigate();
  const [metrics, setMetrics] = React.useState({
    totalLoket: 0,
    antreanHariIni: 0,
    skmScore: 0,
    potensiInvestasi: 0
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Fetch Total Loket
        const { count: loketCount } = await supabase
          .from('mpp_tenants')
          .select('*', { count: 'exact', head: true });

        // Fetch Antrean Hari Ini
        const today = new Date().toISOString().split('T')[0];
        const { count: antreanCount } = await supabase
          .from('mpp_queues')
          .select('*', { count: 'exact', head: true })
          .eq('queue_date', today);

        // Fetch SKM Kepuasan Warga
        const { data: skmData } = await supabase
          .from('mpp_skm')
          .select('rating');
        
        let avgSkm = 0;
        if (skmData && skmData.length > 0) {
          const total = skmData.reduce((sum, item) => sum + (Number(item.rating) || 0), 0);
          avgSkm = Number((total / skmData.length).toFixed(1));
        }

        // Fetch Potensi Investasi count
        const { count: potensiCount } = await supabase
          .from('gis_potensi_investasi')
          .select('*', { count: 'exact', head: true });

        setMetrics({
          totalLoket: loketCount || 0,
          antreanHariIni: antreanCount || 0,
          skmScore: avgSkm,
          potensiInvestasi: potensiCount || 0
        });
      } catch (error) {
        console.error('Error fetching beranda metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className={`p-5 sm:p-6 rounded-2xl relative overflow-hidden transition-all ${
        isDark 
          ? "bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/20" 
          : "bg-white border border-slate-200 shadow-xs"
      }`}>
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/30">
            Pusat Komando Administrasi MPP
          </span>
          <h2 className={`text-lg sm:text-2xl font-bold mt-3 tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
            Selamat Datang, {operatorUser.fullName}
          </h2>
          <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            Sistem Pelayanan Terpadu Satu Pintu & Perizinan Investasi Mal Pelayanan Publik Simpurusiang Kabupaten Luwu beroperasi normal.
          </p>
        </div>
      </div>

      {/* Quick Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-sans">
        {/* Card 1 */}
        <div className={`p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border transition-all ${
          isDark ? "bg-slate-900 border-white/10" : "bg-white border-slate-200/80 shadow-xs"
        }`}>
          <div className="flex justify-between items-start mb-2 sm:mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">TOTAL LOKET</span>
            <div className={`p-2 rounded-xl ${isDark ? "bg-emerald-950/80 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
              <Building2 size={16} />
            </div>
          </div>
          <div className={`text-lg sm:text-xl md:text-2xl font-bold font-mono ${isDark ? "text-white" : "text-slate-900"} mt-1`}>
            {loading ? "..." : `${metrics.totalLoket} Loket`}
          </div>
          <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">
            Total Loket Terdaftar
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
            <CheckCircle2 size={11} /> Data riil terverifikasi
          </div>
        </div>

        {/* Card 2 */}
        <div className={`p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border transition-all ${
          isDark ? "bg-slate-900 border-white/10" : "bg-white border-slate-200/80 shadow-xs"
        }`}>
          <div className="flex justify-between items-start mb-2 sm:mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">ANTREAN HARI INI</span>
            <div className={`p-2 rounded-xl ${isDark ? "bg-sky-950/80 text-sky-400" : "bg-sky-50 text-sky-600"}`}>
              <Activity size={16} />
            </div>
          </div>
          <div className={`text-lg sm:text-xl md:text-2xl font-bold font-mono ${isDark ? "text-white" : "text-slate-900"} mt-1`}>
            {loading ? "..." : `${metrics.antreanHariIni} Pemohon`}
          </div>
          <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">
            Antrean Hari Ini
          </div>
          <div className="text-[10px] text-sky-600 dark:text-sky-400 font-bold mt-1.5 flex items-center gap-1">
            <Clock size={11} /> Sinkronisasi real-time
          </div>
        </div>

        {/* Card 3 */}
        <div className={`p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border transition-all ${
          isDark ? "bg-slate-900 border-white/10" : "bg-white border-slate-200/80 shadow-xs"
        }`}>
          <div className="flex justify-between items-start mb-2 sm:mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">PROYEK INVESTASI</span>
            <div className={`p-2 rounded-xl ${isDark ? "bg-amber-950/80 text-amber-400" : "bg-amber-50 text-amber-600"}`}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div className={`text-lg sm:text-xl md:text-2xl font-bold font-mono ${isDark ? "text-white" : "text-slate-900"} mt-1`}>
            {loading ? "..." : `${metrics.potensiInvestasi} Titik`}
          </div>
          <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">
            Proyek Investasi (GIS)
          </div>
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1.5 flex items-center gap-1">
            <Compass size={11} /> Terpetakan di Luwu
          </div>
        </div>

        {/* Card 4 */}
        <div className={`p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border transition-all ${
          isDark ? "bg-slate-900 border-white/10" : "bg-white border-slate-200/80 shadow-xs"
        }`}>
          <div className="flex justify-between items-start mb-2 sm:mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">KEPUASAN WARGA</span>
            <div className={`p-2 rounded-xl ${isDark ? "bg-purple-950/80 text-purple-400" : "bg-purple-50 text-purple-600"}`}>
              <Sparkles size={16} />
            </div>
          </div>
          <div className={`text-lg sm:text-xl md:text-2xl font-bold font-mono ${isDark ? "text-white" : "text-slate-900"} mt-1`}>
            {loading ? "..." : metrics.skmScore > 0 ? `${metrics.skmScore} / 5` : 'Belum Ada'}
          </div>
          <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">
            SKM Kepuasan Warga
          </div>
          <div className="text-[10px] text-purple-600 dark:text-purple-400 font-bold mt-1.5 flex items-center gap-1">
            <CheckCircle2 size={11} /> Indeks Kepuasan Terpadu
          </div>
        </div>
      </div>

      {/* Action Shortcut Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className={`p-5 sm:p-6 rounded-2xl border space-y-4 transition-all ${
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
        }`}>
          <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
            <Building2 size={16} className="text-emerald-500" />
            <span>Akses Cepat Pengelolaan Loket</span>
          </h3>
          <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Kelola status pemanggilan antrean, instansi vertikal (Polres, ATR/BPN, BPJS), dan OPD teknis di lantai 1 dan 2 MPP Simpurusiang.
          </p>
          <button
            onClick={() => navigate("/admin/loket-pelayanan")}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow min-h-[44px] flex items-center justify-center cursor-pointer"
          >
            Buka Loket Pelayanan
          </button>
        </div>

        <div className={`p-5 sm:p-6 rounded-2xl border space-y-4 transition-all ${
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
        }`}>
          <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
            <Compass size={16} className="text-emerald-500" />
            <span>Tata Ruang & Digitasi Investasi</span>
          </h3>
          <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Perbarui data IPRO, periksa batas spasial RDTR/RTRW, dan verifikasi permohonan insentif penanaman modal Kabupaten Luwu.
          </p>
          <button
            onClick={() => navigate("/admin/tata-ruang-investasi")}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold border transition-all shadow min-h-[44px] flex items-center justify-center cursor-pointer ${
              isDark 
                ? "bg-slate-800 hover:bg-slate-750 text-white border-slate-700" 
                : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
            }`}
          >
            Kelola Tata Ruang & Investasi
          </button>
        </div>
      </div>
    </div>
  );
}
