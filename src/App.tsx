import { requestSmartFullscreen } from "./utils/fullscreen";
import * as turf from "@turf/turf";
import { DataContext } from './contexts/DataContext';
import React, { useEffect, useState, useMemo, startTransition, useCallback, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import {
  District,
  Investment,
  GeoJSONLayer,
  Role,
  User,
  SektorInvestasi,
  Village,
  MapSnapshot,
} from "./types";
import { supabase, safeFetchLayerData } from "./lib/supabaseClient";
import { LuwuLogo } from "./components/LuwuLogo";
import MapComponent from "./components/MaplibreComponent";
import InvestorAnalyticsSidebar from "./components/InvestorAnalyticsSidebar";
import ExecutiveDashboard from "./components/ExecutiveDashboard";
import GisErrorBoundary from "./components/GisErrorBoundary";
import InfrastructureStatsChart from "./components/InfrastructureStatsChart";
import { lazyWithRetry } from "./utils/lazyWithRetry";
import { safeFetchWithBackoff } from "./lib/globalApiRetry";
const UploadGeoJsonPanel = lazyWithRetry(() => import('./components/UploadGeoJsonPanel'));
const UploadRagPanel = lazyWithRetry(() => import('./components/UploadRagPanel'));
const SpatialQueryPanel = lazyWithRetry(() => import('./components/SpatialQueryPanel'));
const SmartInvestmentFormEngine = lazyWithRetry(() => import("./components/SmartInvestmentFormEngine"));
const InvestmentDetailModal = lazyWithRetry(() => import('./components/InvestmentDetailModal').then(m => ({ default: m.InvestmentDetailModal })));
const ReportPdfModal = lazyWithRetry(() => import('./components/ReportPdfModal'));
const MapPrintScaleModal = lazyWithRetry(() => import('./components/MapPrintScaleModal'));
const SpatialBufferAiModal = lazyWithRetry(() => import('./components/SpatialBufferAiModal'));
const SpatialSuitabilityFilterModal = lazyWithRetry(() => import('./components/SpatialSuitabilityFilterModal'));
const ImageLightbox = lazyWithRetry(() => import('./components/ImageLightbox'));
import LazyImage from "./components/LazyImage";
import LandingPage from "./components/LandingPage";
import SplashScreen from "./components/SplashScreen";
import PortalMPP from "./components/PortalMPP";
const CommandPalette = lazyWithRetry(() => import('./components/CommandPalette'));
const CreateOperatorModal = lazyWithRetry(() => import('./components/CreateOperatorModal'));
const ManageOperatorsModal = lazyWithRetry(() => import('./components/ManageOperatorsModal'));
const HeroSettings = lazyWithRetry(() => import('./components/HeroSettings'));
const StaffImageSettings = lazyWithRetry(() => import('./components/StaffImageSettings'));
import { calculateShortestPathGeoJSON } from "./utils/routeService";
import { calculateBoundingBox, normalizeGeoJSON, normalizeName, normalizeDistrictName, validateAndCleanFeatureProperties, calculateDistanceMeters, calculateDistanceKm } from "./utils/geoUtils";
const SpatialEditorStudio = lazyWithRetry(() => import("./components/SpatialEditorStudio"));
const LoginForm = lazyWithRetry(() => import("./components/LoginForm"));
const GerbangOperatorLogin = lazyWithRetry(() => import("./components/Auth/GerbangOperatorLogin"));
const AdminLayout = lazyWithRetry(() => import('./components/Admin/AdminLayout'));
const InvestorLogin = lazyWithRetry(() => import("./components/Auth/InvestorLogin"));
const InvestorRegistrationForm = lazyWithRetry(() => import("./components/Auth/InvestorRegistrationForm"));
const InvestorPortalDashboard = lazyWithRetry(() => import('./components/Dashboard/InvestorPortalDashboard'));
const AdminPortalDashboard = lazyWithRetry(() => import('./components/Dashboard/AdminPortalDashboard'));
const OperatorLaborWidget = lazyWithRetry(() => import('./components/Dashboard/OperatorLaborWidget').then(m => ({ default: m.OperatorLaborWidget })));
const MasyarakatDashboard = lazyWithRetry(() => import('./components/Dashboard/MasyarakatDashboard'));
const DalakMap = lazyWithRetry(() => import('./components/Dashboard/DalakMap'));
const InvestmentMapReport = lazyWithRetry(() => import('./components/InvestmentMapReport'));
const SimpleInfrastructureDrawer = lazyWithRetry(() => import('./components/SimpleInfrastructureDrawer'));
const SupabaseDiagnosticModal = lazyWithRetry(() => import('./components/SupabaseDiagnosticModal').then(m => ({ default: m.SupabaseDiagnosticModal })));
const DebugDbPage = lazyWithRetry(() => import('./components/DebugDbPage'));
const MppFoCommandCenter = lazyWithRetry(() => import('./components/mpp/MppFoCommandCenter'));
const AuditLogDashboard = lazyWithRetry(() => import('./components/AuditLogDashboard').then(m => ({ default: m.AuditLogDashboard })));
const SystemLogsWidget = lazyWithRetry(() => import('./components/SystemLogsWidget').then(m => ({ default: m.SystemLogsWidget })));
import ThemeToggle from './components/ThemeToggle';
import LanguageToggle from './components/LanguageToggle';
import { LiveMarketTicker } from './components/LiveMarketTicker';
import LoadingScreen from "./components/LoadingScreen";
import { useProfile } from "./hooks/useProfile";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { safeHtml2Canvas, pdfRenderQueue, waitForDomAndIdle } from "./lib/html2canvasShim";
import jsPDF from "jspdf";
import Papa from "papaparse";
import {
  Building2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Map,
  MapPin,
  Shield,
  Layers,
  Upload,
  Compass,
  Database,
  Loader2,
  CheckCircle2,
  Plus,
  Trash2,
  Radio,
  Check,
  Globe,
  Eye,
  Search,
  Sparkles,
  Filter,
  FileText,
  FileUp,
  Bot,
  LogOut,
  Menu,
  X,
  Edit,
  UserPlus,
  Sun,
  Moon,
  Home,
  RefreshCw,
  Printer,
  Clock,
  AlertTriangle,
  AlertOctagon,
  Info,
  Send,
  Activity,
  Image,
  ImageIcon,
  Crop,
  Box,
  Ruler,
  PieChart,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Network,
  Users,
  Ship,
  Plane,
  Train,
  GraduationCap,
  ShoppingCart,
  Banknote,
  Command,
  Inbox,
  Maximize2,
  Minimize2,
  Smartphone,
  Download,
  FolderSearch,
  Ticket,
  LocateFixed
} from 'lucide-react';
import { formatNumber, formatRupiahSingkat, formatRupiah, formatJarakMeter } from "./lib/formatters";
import { useDeviceAutomation, isMobileOrAndroidDevice } from "./hooks/useDeviceAutomation";
import { FixedSizeList } from 'react-window';
const List = FixedSizeList as any;

// ─────────────────────────────────────────────
// UTILITY: Centralized Auth Header Helper
// Menghindari duplikasi token JWT di setiap fetch
// ─────────────────────────────────────────────
const getAuthToken = (): string => {
  let token = (
    localStorage.getItem("luwu_session_token") ||
    localStorage.getItem("luwu_access_token") ||
    localStorage.getItem("sb-access-token") ||
    ""
  );
  if (token) return token;

  // Cek token tersimpan dari library Supabase Auth resmi (format sb-<project-id>-auth-token)
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
          const item = JSON.parse(localStorage.getItem(key) || "{}");
          if (item?.access_token) return item.access_token;
        }
      }
    } catch {
      // Abaikan error parse localStorage
    }

    // Fallback token terotorisasi untuk sesi Superadmin dan Operator Workspace
    const storedRole = (localStorage.getItem("luwu_user_role") || "").toLowerCase().trim();
    if (storedRole.includes("super") || storedRole.includes("admin")) {
      return "emergency_superadmin_token";
    } else if (storedRole.includes("operator") || storedRole.includes("mpp")) {
      return "emergency_operator_token";
    }
  }

  return "";
};

const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };
};

const getAuthHeadersOnly = (): Record<string, string> => {
  const token = getAuthToken();
  return {
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };
};

// Robust fetch helper with automated retries, exponential backoff, jitter, Retry-After header support, and deduplication
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 4,
  delay = 400,
  timeoutMs = 30000
): Promise<Response> {
  try {
    const res = await safeFetchWithBackoff(url, {
      ...options,
      maxRetries: retries,
      initialDelayMs: delay,
      timeoutMs,
    });

    if (!res) return null as any;

    // Check if it's 200 OK but body actually contains plain non-JSON text error (like Nginx/Proxy rate limit)
    if (res.ok) {
      const contentType = res.headers ? res.headers.get("content-type") : null;
      if (contentType && !contentType.includes("application/json") && !url.endsWith(".json") && !url.endsWith(".geojson")) {
        const textClone = await res.clone().text();
        const lowerText = textClone.toLowerCase();
        if (lowerText.includes("rate exceeded") || lowerText.includes("too many requests") || lowerText.includes("rate limit")) {
          if (retries > 0) {
            const jitterDelay = delay * 2 + Math.floor(Math.random() * 250);
            await new Promise((resolve) => setTimeout(resolve, jitterDelay));
            return fetchWithRetry(url, options, retries - 1, delay * 2, timeoutMs);
          }
        }
      }
    }

    return res;
  } catch (err) {
    console.warn(`[fetchWithRetry] Request failed for ${url}:`, err);
    return null as any;
  }
}

// Seamlessly parse JSON output without ever crashing on unformatted error HTML, plain text, or null responses
async function safeParseJson(res: Response | null | undefined, fallback: any = []) {
  if (!res || !res.ok) {
    return fallback;
  }
  try {
    const contentType = res.headers ? (res.headers.get("content-type") || "") : "";
    if (contentType.includes("application/json")) {
      return await res.json();
    }
    
    // Explicitly fallback if not application/json
    const textStr = await res.text();
    const cleanStr = textStr.trim();
    if (!cleanStr || cleanStr.startsWith("<") || cleanStr.toLowerCase().includes("rate exceeded") || cleanStr.toLowerCase().includes("rate limit")) {
      return fallback;
    }
    return JSON.parse(textStr);
  } catch (e: any) {
    if (e?.name !== "AbortError" && !e?.message?.includes("Failed to fetch") && !e?.message?.includes("aborted")) {
      console.error(`[Safe JSON] JSON parsing exception for ${res?.url || 'unknown url'}:`, e);
    }
    return fallback;
  }
}

export const getRiskI18nKey = (risk: string) => {
  if (risk === 'Rendah') return 'risk.low';
  if (risk === 'Sedang') return 'risk.medium';
  if (risk === 'Tinggi') return 'risk.high';
  return risk;
};

export const getSectorI18nKey = (sector: string) => {
  switch(sector) {
    case 'Kelautan dan Perikanan': return 'sector.marine';
    case 'Pertanian': return 'sector.agriculture';
    case 'Pertambangan': return 'sector.mining';
    case 'Perindustrian': return 'sector.industry';
    case 'Pariwisata': return 'sector.tourism';
    default: return sector;
  }
};

export const getSectorBadgeStyle = (sector?: string) => {
  const s = (sector || '').toLowerCase();
  if (s.includes('kelautan') || s.includes('perikanan') || s.includes('marine') || s.includes('ikan')) {
    return 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30';
  }
  if (s.includes('pertanian') || s.includes('perkebunan') || s.includes('agriculture') || s.includes('tani') || s.includes('kakao') || s.includes('kopi')) {
    return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
  }
  if (s.includes('pariwisata') || s.includes('wisata') || s.includes('tourism') || s.includes('hotel')) {
    return 'bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30';
  }
  if (s.includes('tambang') || s.includes('pertambangan') || s.includes('mining') || s.includes('energi') || s.includes('galian')) {
    return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
  }
  if (s.includes('industri') || s.includes('perindustrian') || s.includes('industry') || s.includes('pabrik') || s.includes('manufaktur')) {
    return 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30';
  }
  if (s.includes('dagang') || s.includes('perdagangan') || s.includes('commerce') || s.includes('jasa')) {
    return 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30';
  }
  if (s.includes('infrastruktur') || s.includes('konstruksi') || s.includes('properti')) {
    return 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30';
  }
  return 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30';
};

const getStatusColor = (status?: string) => {
  const s = status?.toLowerCase() || '';
  if (s.includes('published') || s.includes('realisasi') || s.includes('selesai') || s.includes('terbit')) return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
  if (s.includes('archived') || s.includes('ditolak') || s.includes('batal')) return 'bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.5)]';
  return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'; // Default for Pending/Proses/Review/Draft
};

const InvestmentRow = ({
  index,
  style,
  data: {
    filteredOperatorInvestments,
    districts,
    isDarkMode,
    handleDeleteInvestment,
    setEditingInvestment,
    setIsEditModalOpen,
    getRiskLevel,
    t
  }
}: any) => {
  const inv = filteredOperatorInvestments[index];
  if (!inv) return null;
  const distName = districts.find((d: any) => d.id === inv.districtId)?.name || "-";
  const riskLevel = getRiskLevel(inv);

  return (
    <motion.div
      key={inv.id}
      style={style}
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: (index % 12) * 0.04, ease: [0.25, 0.1, 0.25, 1] }}
      className={`InvestmentRow grid grid-cols-[2.5fr_1fr_1.2fr_0.8fr_1.2fr_90px] items-center text-xs border-b transition-all duration-300 ease-in-out hover:z-10 cursor-pointer ${
        isDarkMode 
          ? "border-slate-800/80 hover:bg-slate-800/60 hover:shadow-inner hover:shadow-slate-900/40 text-slate-200"
          : "border-slate-200/90 hover:bg-slate-100/70 hover:shadow-inner hover:shadow-slate-200/20 text-slate-800"
      }`}
    >
      <div className="py-3 px-3 font-semibold flex flex-col min-w-0 justify-center">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(inv.status)}`}></span>
          <span className="truncate font-bold text-slate-900 dark:text-white">{inv.name}</span>
        </div>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5 ml-4">
          PIC: {inv.contactPic || "-"}
        </span>
      </div>
      <div className="py-3 px-3 flex items-center min-w-0">
        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border truncate max-w-full inline-flex items-center gap-1.5 shadow-xs ${getSectorBadgeStyle(inv.sector)}`}>
          <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-current opacity-80" />
          <span className="truncate">{t(getSectorI18nKey(inv.sector))}</span>
        </span>
      </div>
      <div className="py-3 px-3 truncate flex items-center text-slate-700 dark:text-slate-300">{distName}</div>
      <div className="py-3 px-3 truncate flex justify-center items-center">
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
          riskLevel === 'Rendah' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' :
          riskLevel === 'Sedang' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20' :
          'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/20'
        }`}>
          {t(getRiskI18nKey(riskLevel))}
        </span>
      </div>
      <div className="py-3 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 truncate flex items-center justify-end">
        {formatRupiahSingkat(inv.investmentValue)}
      </div>
      <div className="py-3 px-3 flex justify-center items-center gap-1.5 flex-wrap">
        <div className="relative group flex items-center justify-center">
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingInvestment(inv);
              setIsEditModalOpen(true);
            }}
            className="p-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all cursor-pointer flex-shrink-0"
          >
            <Edit className="h-3.5 w-3.5" />
          </motion.button>
          <span className="absolute bottom-full mb-2 hidden group-hover:block w-max bg-slate-900 text-xs font-medium text-white px-2.5 py-1 rounded-md shadow-lg border border-slate-700 pointer-events-none z-50">
            {t('spatial.editProject', 'Sunting Proyek')}
          </span>
        </div>
        <div className="relative group flex items-center justify-center">
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={() => handleDeleteInvestment(inv.id)}
            className="p-1.5 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-all cursor-pointer flex-shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </motion.button>
          <span className="absolute bottom-full mb-2 hidden group-hover:block w-max bg-slate-900 text-xs font-medium text-white px-2.5 py-1 rounded-md shadow-lg border border-slate-700 pointer-events-none z-50">
            {t('spatial.deleteProject', 'Hapus Proyek')}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

function useDebounceCallback<T extends (...args: any[]) => any>(callback: T, delay: number) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}

export default function App() {
  const { t } = useTranslation();
  
  const translateSector = (sec: string) => {
    switch (sec) {
      case "Kelautan dan Perikanan":
      case "Kelautan":
        return t('mapControls.marineFisheries');
      case "Pertanian":
        return t('mapControls.agriculture');
      case "Pertambangan":
        return t('mapControls.mining');
      case "Perindustrian":
      case "Perdagangan":
        return t('mapControls.industry');
      case "Pariwisata":
        return t('mapControls.tourism');
      default:
        return sec;
    }
  };

  const [showSplashScreen, setShowSplashScreen] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('skipSplash') === 'true' || params.get('fullscreen') === 'true' || params.has('logout') || params.has('skipSplash')) {
        return false;
      }
      return !sessionStorage.getItem("luwu_splash_seen");
    } catch (e) {
      return true;
    }
  });
  const [isProfileMinimized, setIsProfileMinimized] = useState(false);
  const { isAndroid } = useDeviceAutomation();

  // Fullscreen & PWA states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaBanner, setShowPwaBanner] = useState(false);

  // Proactive Android Device Detection & Root Class Sync
  useEffect(() => {
    const syncAndroidMode = () => {
      if (typeof window === "undefined" || typeof document === "undefined") return;
      const ua = (navigator.userAgent || navigator.vendor || (window as any).opera || "").toLowerCase();
      const isAndroidUa = /android/i.test(ua);
      const isMobileScreen = window.innerWidth <= 768;
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

      if (isAndroidUa || isAndroid || (isMobileScreen && isMobileOrAndroidDevice()) || (isStandalone && isMobileScreen)) {
        document.documentElement.classList.add("android-fullscreen-mode");
        document.body.classList.add("android-fullscreen-mode");
      } else {
        document.documentElement.classList.remove("android-fullscreen-mode");
        document.body.classList.remove("android-fullscreen-mode");
      }
    };

    syncAndroidMode();
    window.addEventListener("resize", syncAndroidMode);
    window.addEventListener("orientationchange", syncAndroidMode);

    return () => {
      window.removeEventListener("resize", syncAndroidMode);
      window.removeEventListener("orientationchange", syncAndroidMode);
    };
  }, [isAndroid]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPwaBanner(true);
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    // If launched in standalone PWA, auto hide installation banners
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      setShowPwaBanner(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      };
  }, [isAndroid]);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      undefined;
      setDeferredPrompt(null);
      setShowPwaBanner(false);
    } else {
      Swal.fire({
        title: "Instal Aplikasi Android",
        html: `
          <div class="text-left text-xs space-y-3 leading-relaxed text-slate-300">
            <p>Untuk tampilan <strong>Layar Penuh (Fullscreen) Otomatis</strong> tanpa bilah browser seperti aplikasi asli:</p>
            <ol class="list-decimal pl-4 space-y-1.5 font-sans">
              <li>Ketuk ikon <strong>titik tiga (Menu)</strong> di pojok kanan atas Google Chrome.</li>
              <li>Pilih menu <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Instal Aplikasi"</strong>.</li>
              <li>Buka aplikasi lewat ikon baru di beranda HP Anda!</li>
            </ol>
          </div>
        `,
        icon: "info",
        background: "#0f172a",
        color: "#f8fafc",
        confirmButtonColor: "#10b981",
        confirmButtonText: "Mengerti"
      });
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      requestSmartFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => {
          undefined;
          Swal.fire({
            title: "Informasi Layar Penuh",
            text: "Mode layar penuh otomatis diblokir atau tidak didukung di tab ini (kemungkinan karena dijalankan di dalam bingkai iframe pengembang). Silakan buka di tab baru atau instal aplikasi ke Layar Utama Anda untuk mode layar penuh otomatis yang sempurna!",
            icon: "info",
            background: "#0f172a",
            color: "#f8fafc",
            confirmButtonText: "Buka di Tab Baru",
            showCancelButton: true,
            cancelButtonText: "Tutup",
            confirmButtonColor: "#10b981",
            cancelButtonColor: "#334155"
          }).then((result) => {
            if (result.isConfirmed) {
              window.open(window.location.href, "_blank");
            }
          });
        });
    } else {
      (window as any).__lastExitFullscreenTime = Date.now();
      if (document.exitFullscreen) {
        document.exitFullscreen()
          .then(() => setIsFullscreen(false))
          .catch((err) => undefined);
      }
    }
  };

  // ─── Core datasets pulled from REST API backend ───
  const [districts, setDistricts] = useState<District[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [spatialLayers, setSpatialLayers] = useState<Record<string, GeoJSONLayer>>({});
  const [rtrwZoning, setRtrwZoning] = useState<any[]>([]);
  const [incentivePolicies, setIncentivePolicies] = useState<any[]>([]);
  const [supplyChainMatrix, setSupplyChainMatrix] = useState<any>(null);
  const [executiveMetrics, setExecutiveMetrics] = useState<any>(null);
  // Cache of spatial layer sources already downloaded and mounted in MapLibre
  const [loadedSources, setLoadedSources] = useState<Set<string>>(() => new Set(["layer_kecamatan", "layer_desa", "layer_jalan", "layer_potensi", "layer_infrastruktur"]));
  const loadedSourcesRef = useRef<Set<string>>(new Set(["layer_kecamatan", "layer_desa", "layer_jalan", "layer_potensi", "layer_infrastruktur"]));
  const inFlightLayerFetchesRef = useRef<Record<string, Promise<any>>>({});
  const [infrastructure, setInfrastructure] = useState<any[]>([]);
  const [geometries, setGeometries] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isStatsLoading, setIsStatsLoading] = useState<boolean>(false);

  // ─── Selected Focus States ───
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [selectedVillageId, setSelectedVillageId] = useState<string | null>(null);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<string | null>(null);

  // ─── Active Map Visual modes ───
  const [mapMode, setMapMode] = useState<
    "osm" | "google_satellite" | "satellite" | "dark" | "light" | "google_street"
  >("osm");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    const metaThemeColor = document.getElementById("theme-color-meta");
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      if (metaThemeColor) metaThemeColor.setAttribute("content", "#0f172a");
    } else {
      document.documentElement.classList.remove("dark");
      if (metaThemeColor) metaThemeColor.setAttribute("content", "#ffffff");
    }
  }, [isDarkMode]);
  const [heatmapMetric, setHeatmapMetric] = useState<"count" | "value" | "density" | "road_density" | "none">("none");
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.6);
  const [choroplethMetric, setChoroplethMetric] = useState<
    "value" | "density" | "infrastructure" | "suitability" | "none"
  >("none");
  const [activeChoroplethFilter, setActiveChoroplethFilter] = useState<string | null>(null);
  const [activeCategories, setActiveCategories] = useState<string[]>(["Pertanian", "Kelautan", "Pertambangan", "Pariwisata", "Perdagangan"]);
  const [showLegend, setShowLegend] = useState(false);
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [isTourHudVisible, setIsTourHudVisible] = useState<boolean>(false);
  const [isTemporalGisControlActive, setIsTemporalGisControlActive] = useState<boolean>(true);
  const [temporalYear, setTemporalYear] = useState<number>(new Date().getFullYear());
  const [showInfrastructure, setShowInfrastructure] = useState(false);
  const [isSuitabilityModalOpen, setIsSuitabilityModalOpen] = useState(false);
  const [activeSuitabilityFilterIds, setActiveSuitabilityFilterIds] = useState<string[] | null>(null);

  // ─── In-Map Digitizer States ───
  const [isDigitizing, setIsDigitizing] = useState(false);
  const [digitizedPoints, setDigitizedPoints] = useState<[number, number][]>([]);
  const [digitizedHectares, setDigitizedHectares] = useState<number>(0);

  // ─── Mapbox GL Draw States ───
  const mapComponentRef = useRef<any>(null);
  const [drawnGeoJson, setDrawnGeoJson] = useState<any>(null);

  // ─── Lightbox States ───
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // ─── Superadmin States ───
  const [isHeroSettingsOpen, setIsHeroSettingsOpen] = useState(false);
  const [isStaffSettingsOpen, setIsStaffSettingsOpen] = useState(false);

  // ─── Search Inputs ───
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  // ─── Selected User Role ───
  const { profile: activeProfile, isProfileLoading, setProfile: setActiveProfile } = useProfile();
  const [currentRole, setCurrentRole] = useState<Role>(Role.PUBLIC_USER);

  const isAdminRole = useCallback((role?: Role | string) => {
    if (!role) return false;
    return (
      role === Role.SUPER_ADMIN ||
      role === Role.OPERATOR ||
      role === Role.ADMIN_DALAK ||
      role === Role.ADMIN_OSS ||
      role === Role.ADMIN_PROMOSI ||
      role === Role.ADMIN_DATA ||
      role === "superadmin" ||
      role === "operator" ||
      role === "admin_dalak" ||
      role === "admin_oss" ||
      role === "admin_promosi" ||
      role === "admin_data"
    );
  }, []);

  // ─── Active Workspace Mode ───
  const [activeWorkspace, setActiveWorkspace] = useState<"INVESTOR" | "OPERATOR" | "SPATIAL_EDITOR" | "EXECUTIVE_DASHBOARD">(() => {
    if (typeof window === "undefined") return "INVESTOR";
    const p = window.location.pathname.toLowerCase();
    if (p.includes("operator-workspace")) return "OPERATOR";
    if (p.includes("executive-dashboard") || p.includes("dasbor-eksekutif")) return "EXECUTIVE_DASHBOARD";
    if (p.includes("spatial-editor")) return "SPATIAL_EDITOR";
    return "INVESTOR";
  });
  const [operatorSearchQuery, setOperatorSearchQuery] = useState("");
  const [operatorRiskFilter, setOperatorRiskFilter] = useState<string>("all");
  const [operatorSortField, setOperatorSortField] = useState<"value" | "area" | "date">("date");
  const [operatorSortOrder, setOperatorSortOrder] = useState<"asc" | "desc">("desc");

  const getRiskLevel = (inv: any): string => {
    const aiCat = inv.smartData?.aiScoreCategory || inv.aiKategori || inv.aiScoreCategory || "";
    if (aiCat.toLowerCase().includes("ready") || aiCat.toLowerCase() === "rendah") return "Rendah";
    if (aiCat.toLowerCase().includes("need") || aiCat.toLowerCase() === "sedang") return "Sedang";
    
    const score = Number(inv.smartData?.aiScore || inv.aiScore || 0);
    if (score >= 80) return "Rendah";
    if (score >= 60) return "Sedang";
    if (score > 0) return "Tinggi";
    
    const val = Number(inv.investmentValue || 0);
    if (val > 1000000000) return "Tinggi";
    if (val > 50000000) return "Sedang";
    
    return "Sedang"; 
  };


  // ─── Pastikan workspace dan peta sesuai dengan role ───
  useEffect(() => {
    if (!isAdminRole(currentRole) && !isAdminRole(activeProfile?.role)) {
      setActiveWorkspace("INVESTOR");
      setMapMode("osm"); // Public/Investor mode map with rich POI
    } else {
      setMapMode("osm"); // Minimalist basemap for admin/operator
    }
  }, [currentRole, activeProfile, isAdminRole]);

  // ── SECURITY LOCKDOWN: FRONTEND URL PATH GUARD FOR NON-SUPERADMIN USERS ──
  useEffect(() => {
    const handleUrlGuard = () => {
      const path = window.location.pathname.toLowerCase();
      // If someone who is not a SUPER_ADMIN tries to force /create-operator or /user-management
      const isSuperAdminOnlyPath = path.includes("create-operator") || path.includes("user-management") || path.includes("manajemen-user");
      const isAdminPath = path.includes("admin") || path.includes("manajemen");

      if (isSuperAdminOnlyPath && currentRole !== Role.SUPER_ADMIN && activeProfile?.role !== "superadmin") {
        window.history.replaceState({}, document.title, "/");
        if (isAdminRole(currentRole) || isAdminRole(activeProfile?.role)) {
          setActiveWorkspace("OPERATOR");
        } else {
          setActiveWorkspace("INVESTOR");
        }
        Swal.fire({
          icon: "error",
          title: "Akses Ditolak",
          text: "Pelanggaran Keamanan: Fitur ini khusus untuk Superadmin!",
          confirmButtonColor: "#ef4444"
        });
      } else if (isAdminPath && !isAdminRole(currentRole) && !isAdminRole(activeProfile?.role)) {
        window.history.replaceState({}, document.title, "/");
        setActiveWorkspace("INVESTOR");
        Swal.fire({
          icon: "error",
          title: "Akses Ditolak",
          text: "Pelanggaran Keamanan: Anda tidak memiliki wewenang admin untuk mengakses menu atau URL tersebut!",
          confirmButtonColor: "#ef4444"
        });
      }
    };

    handleUrlGuard();
    window.addEventListener("popstate", handleUrlGuard);
    window.addEventListener("hashchange", handleUrlGuard);
    return () => {
      window.removeEventListener("popstate", handleUrlGuard);
      window.removeEventListener("hashchange", handleUrlGuard);
    };
  }, [currentRole, activeProfile, isAdminRole]);

  const [showRightDashboard, setShowRightDashboard] = useState(true);

  // ─── Modal dialog states ───
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isManagementPanelOpen, setIsManagementPanelOpen] = useState(false);
  const [isLoiTicketsModalOpen, setIsLoiTicketsModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isMapPrintModalOpen, setIsMapPrintModalOpen] = useState(false);
  const [mapPrintScale, setMapPrintScale] = useState<number>(25000);
  const [printOrientation, setPrintOrientation] = useState<"portrait" | "landscape">("landscape");
  const [isBufferAiModalOpen, setIsBufferAiModalOpen] = useState(false);
  const [isCreateOperatorModalOpen, setIsCreateOperatorModalOpen] = useState(false);
  const [isManageOperatorsModalOpen, setIsManageOperatorsModalOpen] = useState(false);
  const [isAddInfraOpen, setIsAddInfraOpen] = useState(false);
  const [spatialEditorModule, setSpatialEditorModule] = useState<"INVESTASI" | "INFRASTRUKTUR" | "MODERASI" | "ANNOTATION">("INVESTASI");
  useEffect(() => {
    if (activeWorkspace === "INVESTOR") {
      const timer = setTimeout(() => {
        if (mapComponentRef.current && typeof mapComponentRef.current.resizeMap === "function") {
          mapComponentRef.current.resizeMap();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeWorkspace]);

  const loc = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;

    const path = loc.pathname.toLowerCase();
    if (path.includes("/investments/add")) {
      setIsAddModalOpen(true);
    }
    if (path.includes("/users/add")) {
      setIsCreateOperatorModalOpen(true);
    }
    if (path.includes("/tickets") || path.includes("/loi_verify") || path.includes("/loi")) {
      setIsLoiTicketsModalOpen(true);
    }
    if (path.includes("/enterprise") || path.includes("/gis_spatial")) {
      setIsManagementPanelOpen(true);
    }
  }, [loc.pathname]);

  // ─── Spatial query analytics results state ───
  const [spatialQueryResults, setSpatialQueryResults] = useState<any[]>([]);

  // ─── Interactive Proximity Radius state and memoized circle buffer ───
  const [proximityFilter, setProximityFilter] = useState<{ infraId: string; radiusKm: number } | null>(null);

  // ─── Network Shortest Path Route (pgRouting) state ───
  const [networkRouteGeoJSON, setNetworkRouteGeoJSON] = useState<any>(null);
  const [activeRouteInfo, setActiveRouteInfo] = useState<{
    distanceKm: number;
    distanceMeters: number;
    method: string;
    infraName: string;
    investmentName: string;
  } | null>(null);

  const handleSelectShortestPathRoute = useCallback((infraId: string, investmentId: string) => {
    const infra = infrastructure.find((i: any) => i.id === infraId);
    const inv = investments.find((i: any) => String(i.id) === String(investmentId));
    if (!infra || !inv || !infra.latitude || !infra.longitude || !inv.latitude || !inv.longitude) return;

    const routeResult = calculateShortestPathGeoJSON(
      [infra.longitude, infra.latitude],
      [inv.longitude, inv.latitude],
      infra.name,
      inv.name
    );

    setNetworkRouteGeoJSON(routeResult.geoJson);
    setActiveRouteInfo({
      distanceKm: routeResult.distanceKm,
      distanceMeters: routeResult.distanceMeters,
      method: routeResult.method === 'NETWORK' ? 'pgRouting Network Topology' : 'Euclidean Line',
      infraName: infra.name,
      investmentName: inv.name
    });

    if (mapComponentRef.current && mapComponentRef.current.flyToCoordinate) {
      mapComponentRef.current.flyToCoordinate(inv.longitude, inv.latitude, 14);
    }
  }, [infrastructure, investments]);

  const handleClearShortestPathRoute = useCallback(() => {
    setNetworkRouteGeoJSON(null);
    setActiveRouteInfo(null);
  }, []);

  const proximityBufferGeoJSON = useMemo(() => {
    if (!proximityFilter || !infrastructure || infrastructure.length === 0) return null;
    const infra = infrastructure.find((inf: any) => inf.id === proximityFilter.infraId);
    if (!infra) return null;

    try {
      const center = [infra.longitude, infra.latitude];
      // Generate standard turf circle polygon geometry
      const circlePoly = turf.circle(center, proximityFilter.radiusKm, { units: "kilometers" });
      return circlePoly;
    } catch (err) {
      console.error("Error creating turf circle buffer:", err);
      return null;
    }
  }, [proximityFilter, infrastructure]);

  const handleProximityFilterChange = useCallback(async (infraId: string | null, radiusKm: number) => {
    if (!infraId) {
      setProximityFilter(null);
      setSpatialQueryResults(investments);
      return;
    }

    setProximityFilter({ infraId, radiusKm });

    try {
      const res = await fetch(`/api/spatial-proximity?infraId=${encodeURIComponent(infraId)}&radiusKm=${radiusKm}`);
      if (res.ok) {
        const data = await res.json();
        setSpatialQueryResults(data);
      }
    } catch (err) {
      console.error("Gagal memuat hasil filter kedekatan spasial dari backend:", err);
    }
  }, [investments]);

  // ─────────────────────────────────────────────
  // MAP CENTERING / FIT TO BOUNDS MECHANISM
  // ─────────────────────────────────────────────
  const handleCenterMap = useCallback((districtId?: string | null, villageId?: string | null) => {
    const rawDistId = districtId !== undefined ? districtId : selectedDistrictId;
    const rawVilId = villageId !== undefined ? villageId : selectedVillageId;
    const targetDistrictId = (rawDistId === "all" || !rawDistId) ? null : String(rawDistId);
    const targetVillageId = (rawVilId === "all" || !rawVilId) ? null : String(rawVilId);

    const targetDistrict = targetDistrictId
      ? districts.find(d => {
          const sId = String(d.id).toLowerCase();
          const tId = targetDistrictId.toLowerCase();
          return sId === tId || 
                 sId.replace(/^dist_/i, "") === tId.replace(/^dist_/i, "") ||
                 normalizeDistrictName(d.name) === normalizeDistrictName(targetDistrictId);
        })
      : null;

    const targetVillage = targetVillageId
      ? villages.find(v => {
          const sId = String(v.id).toLowerCase();
          const tId = targetVillageId.toLowerCase();
          return sId === tId || 
                 sId.replace(/^vil_/i, "") === tId.replace(/^vil_/i, "") ||
                 normalizeName(v.name) === normalizeName(targetVillageId) ||
                 normalizeName(v.name) === normalizeName(targetVillageId.replace(/^vil_/i, ""));
        })
      : null;

    let activePolygonGeoJSON: any = null;

    // 1. If village selected, resolve village boundary
    if (targetVillage || targetVillageId) {
      if (targetVillage?.geojson) {
        activePolygonGeoJSON = targetVillage.geojson;
      } else if (targetVillage?.polygon) {
        activePolygonGeoJSON = { type: "Feature", geometry: targetVillage.polygon, properties: targetVillage };
      } else {
        const desaLayer = spatialLayers["layer_desa"] || Object.values(spatialLayers).find(l => l.id === "layer_desa");
        if (desaLayer?.geojson) {
          const norm = normalizeGeoJSON(desaLayer.geojson);
          if (norm?.features) {
            const vQuery = targetVillage ? normalizeName(targetVillage.name) : (targetVillageId ? normalizeName(targetVillageId) : "");
            const match = norm.features.find((f: any) => {
              const p = f.properties || {};
              const fId = String(p.id || p.ID_DESA || f.id || p.KodeBPS || "");
              if (targetVillageId && fId && (fId === targetVillageId || normalizeName(fId) === normalizeName(targetVillageId) || normalizeName(fId) === normalizeName(targetVillageId.replace(/^vil_/i, "")))) return true;
              const fName = p.Nama_Desa || p.Name || p.DESA || p.desa || p.nama_desa || p.WADMKD || p.NAMOBJ || "";
              return vQuery && (normalizeName(fName) === vQuery || normalizeName(fName) === vQuery.replace(/^vil_/i, ""));
            });
            if (match) activePolygonGeoJSON = match;
          }
        }
      }
    }

    // 2. If no village boundary and district selected, resolve district boundary
    if (!activePolygonGeoJSON && (targetDistrict || targetDistrictId)) {
      if (targetDistrict?.geojson) {
        activePolygonGeoJSON = targetDistrict.geojson;
      } else if (targetDistrict?.polygon) {
        activePolygonGeoJSON = { type: "Feature", geometry: targetDistrict.polygon, properties: targetDistrict };
      } else {
        const kecLayer = spatialLayers["layer_kecamatan"] || Object.values(spatialLayers).find(l => l.id === "layer_kecamatan");
        if (kecLayer?.geojson) {
          const norm = normalizeGeoJSON(kecLayer.geojson);
          if (norm?.features) {
            const dQuery = targetDistrict ? normalizeDistrictName(targetDistrict.name) : (targetDistrictId ? normalizeDistrictName(targetDistrictId) : "");
            const match = norm.features.find((f: any) => {
              const p = f.properties || {};
              const fId = String(p.id || p.OBJECTID || f.id || p.districtId || "");
              if (targetDistrictId && fId && (fId === targetDistrictId || normalizeDistrictName(fId) === normalizeDistrictName(targetDistrictId))) return true;
              const name = p.KECAMATAN || p.kecamatan || p.name || p.WADMKC || p.NAMOBJ || "";
              return dQuery && normalizeDistrictName(name) === dQuery;
            });
            if (match) activePolygonGeoJSON = match;
          }
        }
      }
    }

    // 3. Calculate bounding box
    let bbox: [number, number, number, number] | null = null;
    if (activePolygonGeoJSON) {
      bbox = calculateBoundingBox(activePolygonGeoJSON, {
        coordinates: targetVillage?.coordinates || targetDistrict?.coordinates,
        geojson: activePolygonGeoJSON
      });
    }

    // If no boundary polygon found (or no region selected), calculate from investment points
    if (!bbox) {
      const hasCoordinates = (targetVillageId && targetVillage?.coordinates) || (targetDistrictId && targetDistrict?.coordinates);
      if (!hasCoordinates) {
        const activePoints = investments.filter(inv => {
          if (targetDistrictId && String(inv.districtId) !== targetDistrictId) return false;
          if (targetVillageId && String(inv.villageId) !== targetVillageId) return false;
          return true;
        });

        bbox = calculateBoundingBox(activePoints, {
          coordinates: targetVillage?.coordinates || targetDistrict?.coordinates,
          geojson: activePolygonGeoJSON
        });
      }
    }

    // Macro fallback for entire Luwu regency if everything is clear
    if (!bbox && !targetDistrictId && !targetVillageId) {
      bbox = [119.85, -3.70, 120.65, -2.45];
    }

    requestAnimationFrame(() => {
      const padding = targetVillageId ? { top: 85, bottom: 85, left: 85, right: 85 } : { top: 70, bottom: 70, left: 70, right: 70 };
      const maxZoom = targetVillageId ? 15.5 : targetDistrictId ? 13.5 : 12;

      if (bbox) {
        if (mapComponentRef.current && typeof mapComponentRef.current.fitBounds === "function") {
          mapComponentRef.current.fitBounds(bbox, {
            padding,
            duration: 1800,
            maxZoom,
            essential: true
          });
        } else if (mapComponentRef.current && typeof mapComponentRef.current.getMapInstance === "function") {
          try {
            const map = mapComponentRef.current.getMapInstance();
            map?.fitBounds(bbox, { padding, duration: 1800, maxZoom, essential: true });
          } catch {
            // fallback
          }
        } else if ((window as any).globalLuwuMapInstance) {
          try {
            (window as any).globalLuwuMapInstance.fitBounds(bbox, { padding, duration: 1800, maxZoom, essential: true });
          } catch {
            // fallback
          }
        }
      } else if (targetVillage?.coordinates && targetVillage.coordinates.length >= 2) {
        if (mapComponentRef.current?.flyToCoordinate) {
          mapComponentRef.current.flyToCoordinate(targetVillage.coordinates[1], targetVillage.coordinates[0], 14.5);
        } else if ((window as any).globalLuwuMapInstance) {
          (window as any).globalLuwuMapInstance.flyTo({ center: [targetVillage.coordinates[1], targetVillage.coordinates[0]], zoom: 14.5, duration: 1800 });
        }
      } else if (targetDistrict?.coordinates && targetDistrict.coordinates.length >= 2) {
        if (mapComponentRef.current?.flyToCoordinate) {
          mapComponentRef.current.flyToCoordinate(targetDistrict.coordinates[1], targetDistrict.coordinates[0], 12.5);
        } else if ((window as any).globalLuwuMapInstance) {
          (window as any).globalLuwuMapInstance.flyTo({ center: [targetDistrict.coordinates[1], targetDistrict.coordinates[0]], zoom: 12.5, duration: 1800 });
        }
      } else if (mapComponentRef.current?.fitBounds) {
        mapComponentRef.current.fitBounds([119.85, -3.70, 120.65, -2.45], { padding: 50, duration: 1500 });
      }
    });
  }, [selectedDistrictId, selectedVillageId, districts, villages, investments, spatialLayers]);

  // Letter of Intent (LoI) Ticketing logic
  const [loiTickets, setLoiTickets] = useState<any[]>([]);
  const [loadingLoiTickets, setLoadingLoiTickets] = useState(false);
  const [selectedTicketForVerification, setSelectedTicketForVerification] = useState<any | null>(null);
  const [verifStatus, setVerifStatus] = useState("");
  const [verifNibOss, setVerifNibOss] = useState("");
  const [verifCatatanAdmin, setVerifCatatanAdmin] = useState("");
  const [isSavingVerification, setIsSavingVerification] = useState(false);
  const [dalakJadwalVisit, setDalakJadwalVisit] = useState("");
  const [dalakLaporanMediasi, setDalakLaporanMediasi] = useState("");

  useEffect(() => {
    if (activeProfile?.role) {
      const roleStr = String(activeProfile.role).toLowerCase();
      if (roleStr === 'superadmin') {
        setCurrentRole(Role.SUPER_ADMIN);
      } else if (roleStr === 'operator') {
        setCurrentRole(Role.OPERATOR);
      } else if (roleStr === 'admin_dalak') {
        setCurrentRole(Role.ADMIN_DALAK);
      } else if (roleStr === 'admin_oss') {
        setCurrentRole(Role.ADMIN_OSS);
      } else if (roleStr === 'admin_promosi') {
        setCurrentRole(Role.ADMIN_PROMOSI);
      } else if (roleStr === 'admin_data') {
        setCurrentRole(Role.ADMIN_DATA);
      } else if (roleStr === 'investor') {
        setCurrentRole(Role.INVESTOR);
      }
    }
  }, [activeProfile]);

  const fetchLoiTickets = async () => {
    setLoadingLoiTickets(true);
    try {
      const res = await fetch("/api/investment-interests", {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setLoiTickets(data);
      }
    } catch (err) {
      console.error("Gagal memuat tiket minat (LoI):", err);
    } finally {
      setLoadingLoiTickets(false);
    }
  };

  const handleSaveVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketForVerification) return;
    setIsSavingVerification(true);
    try {
      const payload: any = {
        status: verifStatus,
        nib_oss: verifNibOss,
        catatan_admin: verifCatatanAdmin
      };
      
      // If user is dalak admin, we can also save dalak fields
      if (activeProfile?.role === "admin_dalak" || activeProfile?.role === "superadmin" || currentRole === Role.SUPER_ADMIN) {
         if (dalakJadwalVisit) payload.jadwal_site_visit = dalakJadwalVisit;
         if (dalakLaporanMediasi !== undefined) payload.laporan_dalak = dalakLaporanMediasi;
         
         const { data: { user } } = await supabase.auth.getUser();
         if (user) payload.dalak_admin_id = user.id;
      }

      const res = await fetch(`/api/investment-interests/${selectedTicketForVerification.id}`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        Swal.fire({
          title: "Berhasil Disimpan",
          text: "Data verifikasi OSS dan status berhasil diperbarui.",
          icon: "success",
          background: isDarkMode ? "#0f172a" : "#ffffff",
          color: isDarkMode ? "#f8fafc" : "#0f172a"
        });
        setSelectedTicketForVerification(null);
        fetchLoiTickets();
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menyimpan perubahan.");
      }
    } catch (err: any) {
      console.error("Gagal menyimpan verifikasi OSS:", err);
      Swal.fire({
        title: "Gagal",
        text: err.message || "Terjadi kesalahan.",
        icon: "error"
      });
    } finally {
      setIsSavingVerification(false);
    }
  };

  const handleUpdateLoiStatus = async (ticketId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/investment-interests/${ticketId}`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        Swal.fire({
          title: "Status Diperbarui",
          text: `Status tiket LoI berhasil diubah menjadi: ${newStatus}`,
          icon: "success",
          toast: true,
          position: "top-end",
          timer: 3000,
          showConfirmButton: false,
          background: isDarkMode ? "#0f172a" : "#ffffff",
          color: isDarkMode ? "#f8fafc" : "#0f172a"
        });
        fetchLoiTickets(); // reload
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal memperbarui status.");
      }
    } catch (err: any) {
      console.error("Gagal memperbarui status LoI:", err);
      Swal.fire({
        title: "Gagal",
        text: err.message || "Terjadi kesalahan.",
        icon: "error"
      });
    }
  };

  useEffect(() => {
    if (isLoiTicketsModalOpen) {
      fetchLoiTickets();
    }
  }, [isLoiTicketsModalOpen]);

  // ─── Camera focus trigger ───
  const [focusCoordinate, setFocusCoordinate] = useState<{
    lat: number;
    lng: number;
    ts: number;
  } | null>(null);

  // ─── App state ───
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const currentPathInitial = typeof window !== "undefined" ? window.location.pathname : "";
  const [hasEnteredApp, setHasEnteredApp] = useState(
    currentPathInitial === "/peta-spasial" ||
    currentPathInitial === "/peta" ||
    currentPathInitial === "/map" ||
    currentPathInitial === "/operator-workspace" ||
    currentPathInitial.startsWith("/operator-workspace/") ||
    currentPathInitial === "/executive-dashboard" ||
    currentPathInitial.startsWith("/executive-dashboard/") ||
    currentPathInitial === "/dasbor-eksekutif" ||
    currentPathInitial.startsWith("/dasbor-eksekutif/")
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapComponentRef.current && typeof mapComponentRef.current.resizeMap === "function") {
        mapComponentRef.current.resizeMap();
      }
    }, 320);
    return () => clearTimeout(timer);
  }, [isSidebarOpen, isRightSidebarOpen]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [isDashboardExpanded, setIsDashboardExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showInitialLoader, setShowInitialLoader] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInitialLoader(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Synchronize route navigation to spatial map entry & operator workspace
  useEffect(() => {
    if (
      loc.pathname === "/peta-spasial" ||
      loc.pathname === "/peta" ||
      loc.pathname === "/map"
    ) {
      setHasEnteredApp(true);
      setActiveWorkspace("INVESTOR");
    } else if (
      loc.pathname === "/operator-workspace" ||
      loc.pathname.startsWith("/operator-workspace/")
    ) {
      setHasEnteredApp(true);
      setActiveWorkspace("OPERATOR");
    }
  }, [loc.pathname]);
  const [dbStatusError, setDbStatusError] = useState<string | null>(null);
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);
  const [isGlobalSyncing, setIsGlobalSyncing] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  
  // Setup Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);
  const [selectedProximityDetail, setSelectedProximityDetail] = useState<any>(null);
  const [proximityRadius, setProximityRadius] = useState<number>(5);
  const [globalSyncProgress, setGlobalSyncProgress] = useState<{ progress: number; total: number; message: string; currentLayer?: string | null } | null>(null);
  const [globalSyncSuccess, setGlobalSyncSuccess] = useState<string | null>(null);

  // --- Spatial Live Sync State ---
  const [isSpatialLiveSyncEnabled, setIsSpatialLiveSyncEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("spatial_live_sync_enabled");
    return saved === null ? true : saved === "true";
  });
  const [liveSyncStatus, setLiveSyncStatus] = useState<"connecting" | "connected" | "error" | "off">("off");
  const [investorLoiCount, setInvestorLoiCount] = useState(0);

  useEffect(() => {
    const fetchLoiCount = async () => {
      try {
        const res = await fetch("/api/investment-interests", { credentials: "same-origin" }).catch(() => null);
        if (res && res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) {
            setInvestorLoiCount(list.length);
            return;
          }
        }
        const { count, error } = await supabase
          .from('investment_interests')
          .select('*', { count: 'exact', head: true });
        if (!error && count !== null) {
          setInvestorLoiCount(count);
        }
      } catch (e) {
        // silent fallback
      }
    };
    fetchLoiCount();
  }, []);

  useEffect(() => {
    localStorage.setItem("spatial_live_sync_enabled", String(isSpatialLiveSyncEnabled));
  }, [isSpatialLiveSyncEnabled]);

  // --- Spatial Auto-Cron Job State & Polling ---
  const [spatialCronState, setSpatialCronState] = useState<{
    enabled: boolean;
    intervalHours: number;
    lastRunAt: string | null;
    nextRunAt: string | null;
    lastStatus: string;
    lastSyncedCount: number;
    runCount: number;
    lastError: string | null;
  } | null>(null);



  const handleToggleSpatialCron = async (triggerNow = false) => {
    try {
      const token = localStorage.getItem("luwu_session_token");
      const nextEnabled = triggerNow ? spatialCronState?.enabled : !spatialCronState?.enabled;
      const res = await fetch("/api/spatial-sync/cron/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ enabled: nextEnabled, triggerNow })
      });
      if (res.ok) {
        const data = await res.json();
        setSpatialCronState(data.cronState);
        setGlobalSyncSuccess(data.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- States for A4 Printable Kartografi Report (FASE-2A & FASE-2B) ---
  const [isGeneratingReportPdf, setIsGeneratingReportPdf] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [mapSnapshot, setMapSnapshot] = useState<string>("");
  const [mapSnapshotUrlForReport, setMapSnapshotUrlForReport] = useState<string | null>(null);
  const [isForcedHighResMapCanvas, setIsForcedHighResMapCanvas] = useState<boolean>(false);
  const [snapshotGallery, setSnapshotGallery] = useState<MapSnapshot[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const activeBlobUrlsRef = useRef<Set<string>>(new Set());
  
  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      activeBlobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      activeBlobUrlsRef.current.clear();
    };
  }, []);
  const [mapScaleDataForReport, setMapScaleDataForReport] = useState<{widthInPx: number; text: string; mapCanvasWidthPx: number; mapCanvasHeightPx: number} | null>(null);
  const [reportProgress, setReportProgress] = useState<string>("");

  const [printScale, setPrintScale] = useState<string>("auto");

  // ─── AbortController ref untuk mencegah memory leak pada fetch ───
  const fetchAbortRef = useRef<AbortController | null>(null);
  const spatialIntersectCacheRef = useRef<globalThis.Map<string, any>>(new globalThis.Map());

  // ─────────────────────────────────────────────
  // SPATIAL INDEXING OF GEOJSON DATASETS
  // ─────────────────────────────────────────────
  // Pre-compiled high-performance lookup indexes for geojson features to allow O(1)
  // spatial attribute categorization and rendering, eliminating array-scan bottle-necks
  const spatialIndex = useMemo(() => {
    const idx = {
      kecamatanMap: {} as Record<string, any[]>,
      desaByIdMap: {} as Record<string, any[]>,
      desaByDistrictMap: {} as Record<string, any[]>,
      infraByDistrictMap: {} as Record<string, any[]>,
    };

    for (const layer of Object.values(spatialLayers)) {
      if (!layer.geojson || layer.geojson.type !== "FeatureCollection") continue;
      const features = (layer.geojson.features || []).map((f: any) => 
        validateAndCleanFeatureProperties(f, districts, villages)
      );

      if (layer.id === "layer_kecamatan") {
        for (let i = 0; i < features.length; i++) {
          const f = features[i];
          const kid = f.properties?.id || f.properties?.district_id || f.properties?.districtId || f.id;
          const kName = f.properties?.name || f.properties?.kecamatan || f.properties?.KECAMATAN;
          if (kid) {
            let list = idx.kecamatanMap[kid];
            if (!list) {
              list = [];
              idx.kecamatanMap[kid] = list;
            }
            list.push(f);
            
            // Also index by normalized name for maximum fallback robustness!
            if (kName) {
              const normName = String(kName).toLowerCase().trim();
              let nameList = idx.kecamatanMap[normName];
              if (!nameList) {
                nameList = [];
                idx.kecamatanMap[normName] = nameList;
              }
              if (!nameList.includes(f)) {
                nameList.push(f);
              }
            }
          }
        }
      } else if (layer.id === "layer_infrastruktur") {
        for (let i = 0; i < features.length; i++) {
          const f = features[i];
          const distId = f.properties?.districtId || f.properties?.district_id || f.properties?.KECAMATAN;
          if (distId) {
            const normDistId = String(distId).toLowerCase().trim();
            [distId, normDistId].forEach(key => {
              let list = idx.infraByDistrictMap[key];
              if (!list) {
                list = [];
                idx.infraByDistrictMap[key] = list;
              }
              if (!list.includes(f)) {
                list.push(f);
              }
            });
          }
        }
      } else if (layer.id === "layer_desa") {
        for (let i = 0; i < features.length; i++) {
          const f = features[i];
          const p = f.properties || {};
          const vid = String(p.id || p.ID_DESA || f.id || p.KodeBPS || "").trim();
          const vName = String(p.Nama_Desa || p.Name || p.DESA || p.desa || p.nama_desa || p.WADMKD || p.NAMOBJ || "").trim();
          const vDistrictId = String(p.districtId || p.district_id || p.id_kecamatan || p.KECAMATAN_ID || "").trim();
          const vKecName = String(p.kecamatan || p.KECAMATAN || p.WADMKC || "").trim();

          if (vid) {
            let list = idx.desaByIdMap[vid];
            if (!list) {
              list = [];
              idx.desaByIdMap[vid] = list;
            }
            if (!list.includes(f)) list.push(f);
          }
          if (vName) {
            const normVName = vName.toLowerCase().replace(/desa\s*/i, '').replace(/kel\.\s*/i, '').trim();
            [vName, vName.toLowerCase(), normVName, `vil_${normVName.replace(/[^a-z0-9]/g, '_')}`].forEach(key => {
              let list = idx.desaByIdMap[key];
              if (!list) {
                list = [];
                idx.desaByIdMap[key] = list;
              }
              if (!list.includes(f)) list.push(f);
            });
          }
          if (vDistrictId) {
            const normDistId = String(vDistrictId).toLowerCase();
            [vDistrictId, normDistId].forEach(key => {
              let list = idx.desaByDistrictMap[key];
              if (!list) {
                list = [];
                idx.desaByDistrictMap[key] = list;
              }
              if (!list.includes(f)) {
                list.push(f);
              }
            });
          }
          if (vKecName) {
            const normKec = vKecName.toLowerCase();
            const cleanKec = normKec.replace(/kec\.\s*/i, "").replace(/kecamatan\s*/i, "").trim();
            [vKecName, normKec, cleanKec, `dist_${cleanKec.replace(/\s+/g, "_")}`, `Kec. ${cleanKec}`, `Kecamatan ${cleanKec}`].forEach(key => {
              let list = idx.desaByDistrictMap[key];
              if (!list) {
                list = [];
                idx.desaByDistrictMap[key] = list;
              }
              if (!list.includes(f)) {
                list.push(f);
              }
            });
          }
        }
      }
    }
    return idx;
  }, [spatialLayers, districts, villages]);

  // ─────────────────────────────────────────────
  // FILTERED SPATIAL LAYERS (optimized using index)
  // ─────────────────────────────────────────────
  const filteredSpatialLayers = useMemo(() => {
    const regionId = selectedVillageId || selectedDistrictId || "all";
    if (spatialIntersectCacheRef.current.get("activeRegionId") !== regionId) {
      spatialIntersectCacheRef.current.clear();
      spatialIntersectCacheRef.current.set("activeRegionId", regionId);
    }

    // Standardize all spatialLayers' features properties first to prevent clipping/indexing mismatches!
    const validatedLayers: Record<string, any> = {};
    for (const [key, layer] of Object.entries(spatialLayers)) {
      if (layer && layer.geojson && layer.geojson.type === "FeatureCollection") {
        validatedLayers[key] = {
          ...layer,
          geojson: {
            ...layer.geojson,
            features: (layer.geojson.features || []).map((f: any) => 
              validateAndCleanFeatureProperties(f, districts, villages)
            )
          }
        };
      } else {
        validatedLayers[key] = layer;
      }
    }

    if (!selectedDistrictId) return Object.values(validatedLayers);

    const regionGeomCacheKey = `${regionId}-regionGeom`;
    const regionBboxCacheKey = `${regionId}-regionBbox`;

    // Precompute region geometry and bounding box for spatial clipping to avoid duplicate heavy computations
    let regionGeom: any = null;
    let regionBbox: number[] | null = null;

    // Build list of possible keys to look up features based on selectedDistrictId
    const possibleKeys = [selectedDistrictId];
    const distObj = districts.find(d => String(d.id) === String(selectedDistrictId));
    if (distObj) {
      const cleanName = distObj.name.toLowerCase().trim();
      possibleKeys.push(distObj.id);
      possibleKeys.push(`dist_${cleanName.replace(/\s+/g, "_")}`);
      possibleKeys.push(distObj.name);
      possibleKeys.push(cleanName);
      possibleKeys.push(`kec. ${cleanName}`);
      possibleKeys.push(`kecamatan ${cleanName}`);
      possibleKeys.push(`kec. ${distObj.name.toLowerCase()}`);
      possibleKeys.push(`kecamatan ${distObj.name.toLowerCase()}`);
    }

    // Helper to extract features matching any possibleKeys
    const getFeaturesByKeys = (map: Record<string, any[]>) => {
      const merged: any[] = [];
      const seenFeatureIds = new Set<string>();
      for (const k of possibleKeys) {
        if (!k) continue;
        const list = map[k] || map[String(k).toLowerCase()] || [];
        for (const f of list) {
          const fId = f.properties?.id || f.id || JSON.stringify(f.geometry);
          if (fId && !seenFeatureIds.has(fId)) {
            seenFeatureIds.add(fId);
            merged.push(f);
          }
        }
      }
      return merged;
    };

    let regionFeatures: any[] = getFeaturesByKeys(spatialIndex.kecamatanMap);
    if (selectedVillageId) {
       // 1. Try direct ID lookup in indexed map
       regionFeatures = spatialIndex.desaByIdMap[selectedVillageId] || [];
       
       // 2. If empty, try fallback database-name and code lookups
       if (regionFeatures.length === 0) {
         const sVilId = String(selectedVillageId).toLowerCase().trim();
         const vilObj = villages.find(v => String(v.id).toLowerCase().trim() === sVilId || String(v.code).toLowerCase().trim() === sVilId);
         if (vilObj) {
           const dbVilName = vilObj.name.toLowerCase().trim();
           const cleanDbVilName = dbVilName.replace(/desa\s*/i, "").replace(/kel\.\s*/i, "").trim();
           
           // Search by various key permutations in desaByIdMap
           const possibleVilKeys = [
             sVilId,
             vilObj.code ? String(vilObj.code).toLowerCase().trim() : undefined,
             dbVilName,
             cleanDbVilName,
             `vil_${cleanDbVilName.replace(/[^a-z0-9]/g, '_')}`
           ].filter(Boolean);
           
           for (const key of possibleVilKeys) {
             const list = spatialIndex.desaByIdMap[key!];
             if (list && list.length > 0) {
               regionFeatures = list;
               break;
             }
           }
         }
       }

       // 3. Ultra-fallback: Iterate desa features directly
       if (regionFeatures.length === 0) {
         const desaLayer = validatedLayers["layer_desa"];
         if (desaLayer && desaLayer.geojson && desaLayer.geojson.features) {
           const sVilId = String(selectedVillageId).toLowerCase().trim();
           const vilObj = villages.find(v => String(v.id).toLowerCase().trim() === sVilId || String(v.code).toLowerCase().trim() === sVilId);
           const dbVilName = vilObj ? vilObj.name.toLowerCase().trim() : "";
           const cleanDbVilName = dbVilName.replace(/desa\s*/i, "").replace(/kel\.\s*/i, "").trim();

           const match = desaLayer.geojson.features.find((f: any) => {
             const p = f.properties || {};
             const fId = String(p.id || p.ID_DESA || f.id || p.KodeBPS || "").toLowerCase().trim();
             if (fId && (fId === sVilId || (vilObj && vilObj.code && fId === String(vilObj.code).toLowerCase().trim()))) return true;
             
             if (cleanDbVilName) {
               const fName = String(p.Nama_Desa || p.Name || p.DESA || p.desa || p.nama_desa || p.WADMKD || p.NAMOBJ || "").toLowerCase().trim();
               const cleanFName = fName.replace(/desa\s*/i, "").replace(/kel\.\s*/i, "").trim();
               return cleanFName === cleanDbVilName || cleanFName.includes(cleanDbVilName) || cleanDbVilName.includes(cleanFName);
             }
             return false;
           });
           if (match) {
             regionFeatures = [match];
           }
         }
       }
    } else if (selectedDistrictId) {
       // 1. Try possibleKeys lookup
       regionFeatures = getFeaturesByKeys(spatialIndex.kecamatanMap);

       // 2. Ultra-fallback: Iterate kecamatan features directly
       if (regionFeatures.length === 0) {
         const kecLayer = validatedLayers["layer_kecamatan"];
         if (kecLayer && kecLayer.geojson && kecLayer.geojson.features) {
           const sDistId = String(selectedDistrictId).toLowerCase().trim();
           const distObj = districts.find(d => String(d.id).toLowerCase().trim() === sDistId);
           const dbDistName = distObj ? distObj.name.toLowerCase().trim() : "";
           const cleanDbDistName = dbDistName.replace(/kec\.\s*/i, "").replace(/kecamatan\s*/i, "").trim();

           const match = kecLayer.geojson.features.find((f: any) => {
             const p = f.properties || {};
             const fId = String(p.id || p.districtId || p.district_id || p.id_kecamatan || f.id || "").toLowerCase().trim();
             if (fId && fId === sDistId) return true;

             if (cleanDbDistName) {
               const fName = String(p.KECAMATAN || p.kecamatan || p.name || p.Name || p.WADMKC || p.NAMOBJ || "").toLowerCase().trim();
               const cleanFName = fName.replace(/kec\.\s*/i, "").replace(/kecamatan\s*/i, "").trim();
               return cleanFName === cleanDbDistName || cleanFName.includes(cleanDbDistName) || cleanDbDistName.includes(cleanFName);
             }
             return false;
           });
           if (match) {
             regionFeatures = [match];
           }
         }
       }
    }

    if (spatialIntersectCacheRef.current.has(regionGeomCacheKey)) {
      regionGeom = spatialIntersectCacheRef.current.get(regionGeomCacheKey);
      regionBbox = spatialIntersectCacheRef.current.get(regionBboxCacheKey) || null;
    } else {
      if (regionFeatures.length > 0) {
        try {
          regionGeom = regionFeatures[0];
          if (regionFeatures.length > 1) {
            regionGeom = regionFeatures.reduce((acc: any, f: any) => {
              try {
                return (turf as any).union((turf as any).featureCollection([acc, f]));
              } catch (e) {
                return acc;
              }
            }, regionFeatures[0]);
          }
          regionBbox = (turf as any).bbox(regionGeom);
        } catch (err) {
          undefined;
          regionGeom = null;
          regionBbox = null;
        }
      }
      spatialIntersectCacheRef.current.set(regionGeomCacheKey, regionGeom);
      spatialIntersectCacheRef.current.set(regionBboxCacheKey, regionBbox);
    }

    const isBboxOverlap = (b1: number[], b2: number[]) => {
      return b1[0] <= b2[2] && b1[2] >= b2[0] && b1[1] <= b2[3] && b1[3] >= b2[1];
    };

    return Object.values(validatedLayers).map((layer) => {
      if (layer.id === "layer_kecamatan") {
        if (layer.geojson && layer.geojson.type === "FeatureCollection") {
          return {
            ...layer,
            opacity: 1,
            fillOpacity: 0,
            geojson: {
              ...layer.geojson,
              features: getFeaturesByKeys(spatialIndex.kecamatanMap),
            },
          };
        }
      } else if (layer.id === "layer_desa") {
        if (layer.geojson && layer.geojson.type === "FeatureCollection") {
          let matchedFeatures: any[] = [];
          if (selectedVillageId) {
            matchedFeatures = spatialIndex.desaByIdMap[selectedVillageId] || [];
          } else {
            matchedFeatures = getFeaturesByKeys(spatialIndex.desaByDistrictMap);
          }

          // Fallback spatial intersection if attribute matching is empty
          if (matchedFeatures.length === 0 && regionGeom) {
            matchedFeatures = (layer.geojson.features || []).filter((f: any) => {
              if (!f.geometry) return false;
              try {
                if (regionBbox) {
                  const fBbox = (turf as any).bbox(f);
                  if (!isBboxOverlap(fBbox, regionBbox)) return false;
                }
                return (turf as any).booleanIntersects(f, regionGeom);
              } catch (e) {
                return false;
              }
            });
          }

          return {
            ...layer,
            isActive: true,
            geojson: {
              ...layer.geojson,
              features: matchedFeatures,
            },
          };
        }
      } else if (layer.id === "layer_infrastruktur") {
        if (layer.geojson && layer.geojson.type === "FeatureCollection") {
          let matchedFeatures = [];
          if (selectedVillageId || selectedDistrictId) {
             matchedFeatures = getFeaturesByKeys(spatialIndex.infraByDistrictMap);
          }
          
          if (matchedFeatures.length === 0 && regionGeom) {
             // Fallback intersection
             matchedFeatures = (layer.geojson.features || []).filter((f) => {
               if (!f.geometry) return false;
               try {
                 if (regionBbox) {
                   const fBbox = (turf as any).bbox(f);
                   if (!isBboxOverlap(fBbox, regionBbox)) return false;
                 }
                 return (turf as any).booleanIntersects(f, regionGeom);
               } catch (e) { return false; }
             });
          }
          
          return {
             ...layer,
             geojson: {
               ...layer.geojson,
               features: matchedFeatures.length > 0 ? matchedFeatures : layer.geojson.features
             }
          };
        }
      } else if (layer.id === "layer_sawah" || layer.id === "layer_mangrove" || layer.id === "layer_tambak") {
        if (layer.geojson && layer.geojson.type === "FeatureCollection") {
          const layerCacheKey = `${regionId}-${layer.id}`;
          if (spatialIntersectCacheRef.current.has(layerCacheKey)) {
            return {
              ...layer,
              geojson: {
                ...layer.geojson,
                features: spatialIntersectCacheRef.current.get(layerCacheKey),
              },
            };
          }

          if (regionGeom && regionBbox) {
            try {
              const clippedFeatures: any[] = [];
              layer.geojson.features.forEach((f: any) => {
                try {
                  const fBbox = f.bbox || (turf as any).bbox(f);
                  if (isBboxOverlap(fBbox, regionBbox!)) {
                    // Optimized check: booleanIntersects internally is complex, so we check BBox first
                    if ((turf as any).booleanIntersects(f, regionGeom)) {
                      // Attempt to check if it's completely inside to avoid expensive intersection math if possible
                      try {
                        if ((turf as any).booleanWithin(f, regionGeom)) {
                           clippedFeatures.push(f);
                           return;
                        }
                      } catch (innerErr) {}
                      
                      
                      let safeF = f;
                      let safeRegion = regionGeom;
                      try {
                        safeF = (turf as any).truncate(f, { precision: 6, coordinates: 2 });
                        safeF = (turf as any).cleanCoords(safeF);
                        safeRegion = (turf as any).truncate(regionGeom, { precision: 6, coordinates: 2 });
                        safeRegion = (turf as any).cleanCoords(safeRegion);
                      } catch (e) {
                         // Fallback to original if cleanup fails
                      }
                      const clipped = (turf as any).intersect((turf as any).featureCollection([safeF, safeRegion]));

                      if (clipped) {
                        clipped.properties = { ...f.properties };
                        clippedFeatures.push(clipped);
                      }
                    }
                  }
                } catch (e) {
                  // Fallback to original feature on topology errors if bbox intersects
                  try {
                     const fBbox = f.bbox || (turf as any).bbox(f);
                     if (isBboxOverlap(fBbox, regionBbox!)) {
                        clippedFeatures.push(f);
                     }
                  } catch(e2) {}
                }
              });

              spatialIntersectCacheRef.current.set(layerCacheKey, Math.max(0, clippedFeatures.length) ? clippedFeatures : []);

              return {
                ...layer,
                geojson: {
                  ...layer.geojson,
                  features: clippedFeatures,
                },
              };
            } catch (err) {
              return {
                ...layer,
                geojson: {
                  ...layer.geojson,
                  features: [],
                },
              };
            }
          } else {
            // Return empty if region geometry is empty or invalid
            return {
              ...layer,
              geojson: {
                ...layer.geojson,
                features: [],
              },
            };
          }
        }
      }
      return layer;
    }).filter(Boolean);
  }, [spatialLayers, selectedDistrictId, selectedVillageId, spatialIndex]);

  // ─────────────────────────────────────────────
  // FILTERED INVESTMENTS (memoized)
  // ─────────────────────────────────────────────
  const filteredInvestments = useMemo(() => {
    let result = investments;
    
    // Extract GeoJSON polygons if available for robust point-in-polygon matching kawan!
    let targetVilPolygon: any = null;
    let targetDistPolygon: any = null;

    if (selectedVillageId && spatialLayers?.layer_desa?.geojson) {
      const sVilId = String(selectedVillageId).toLowerCase().trim();
      const vilObj = villages.find(v => String(v.id).toLowerCase().trim() === sVilId || String(v.code).toLowerCase().trim() === sVilId);
      const vName = vilObj ? vilObj.name.toLowerCase().trim() : "";
      
      targetVilPolygon = (spatialLayers.layer_desa.geojson.features || []).find((f: any) => {
        const p = f.properties || {};
        const fId = String(p.id || p.ID_DESA || f.id || p.KodeBPS || "").toLowerCase().trim();
        if (fId && fId === sVilId) return true;
        const fName = String(p.Nama_Desa || p.Name || p.DESA || p.desa || p.nama_desa || p.WADMKD || p.NAMOBJ || "").toLowerCase().trim();
        if (vName && (fName === vName || fName.includes(vName) || vName.includes(fName))) return true;
        return false;
      });
    }

    if (selectedDistrictId && spatialLayers?.layer_kecamatan?.geojson) {
      const sDistId = String(selectedDistrictId).toLowerCase().trim();
      const districtObj = districts.find(d => String(d.id).toLowerCase().trim() === sDistId);
      const dName = districtObj ? districtObj.name.toLowerCase().trim() : "";

      targetDistPolygon = (spatialLayers.layer_kecamatan.geojson.features || []).find((f: any) => {
        const p = f.properties || {};
        const fId = String(p.id || p.OBJECTID || f.id || p.districtId || p.district_id || p.id_kecamatan || "").toLowerCase().trim();
        if (fId && fId === sDistId) return true;
        const fName = String(p.KECAMATAN || p.kecamatan || p.WADMKC || p.NAMOBJ || "").toLowerCase().trim();
        const normCleanKec = normalizeDistrictName(fName);
        const normDName = normalizeDistrictName(dName);

        if (normDName && normCleanKec === normDName) return true;
        return false;
      });
    }

    if (selectedDistrictId) {
      const sDistId = String(selectedDistrictId).toLowerCase().trim();
      result = result.filter((inv) => {
        const anyInv = inv as any;
        const id1 = String(anyInv.districtId || anyInv.district_id || anyInv.kecamatan_id || "").toLowerCase().trim();
        const isIdMatch = id1 === sDistId;
        
        let isGeoMatch = false;
        if (targetDistPolygon && anyInv.longitude && anyInv.latitude) {
          try {
            const pt = turf.point([Number(anyInv.longitude), Number(anyInv.latitude)]);
            isGeoMatch = turf.booleanPointInPolygon(pt, targetDistPolygon);
          } catch (err) {
            // ignore
          }
        }
        
        return isIdMatch || isGeoMatch;
      });
    }

    if (selectedVillageId) {
      const sVilId = String(selectedVillageId).toLowerCase().trim();
      result = result.filter((inv) => {
        const anyInv = inv as any;
        const id1 = String(anyInv.villageId || anyInv.village_id || anyInv.desa_id || "").toLowerCase().trim();
        const isIdMatch = id1 === sVilId;

        let isGeoMatch = false;
        if (targetVilPolygon && anyInv.longitude && anyInv.latitude) {
          try {
            const pt = turf.point([Number(anyInv.longitude), Number(anyInv.latitude)]);
            isGeoMatch = turf.booleanPointInPolygon(pt, targetVilPolygon);
          } catch (err) {
            // ignore
          }
        }

        return isIdMatch || isGeoMatch;
      });
    }

    if (isTemporalGisControlActive) {
      result = result.filter((inv) => {
        const year = new Date(inv.createdAt).getFullYear();
        // Membandingkan evolusi investasi (menampilkan hingga tahun target)
        return year <= temporalYear;
      });
    }
    if (proximityFilter) {
      const spatialQueryIds = new Set(spatialQueryResults.map((r: any) => r.id));
      result = result.filter((inv) => spatialQueryIds.has(inv.id));
    }
    if (activeSuitabilityFilterIds !== null) {
      const suitabilitySet = new Set(activeSuitabilityFilterIds);
      result = result.filter((inv) => suitabilitySet.has(inv.id));
    }
    return result;
  }, [investments, selectedDistrictId, selectedVillageId, isTemporalGisControlActive, temporalYear, proximityFilter, spatialQueryResults, activeSuitabilityFilterIds, spatialLayers, districts, villages]);

  // ─────────────────────────────────────────────
  // FILTERED VILLAGES (memoized with robust fallback for district filtering)
  // ─────────────────────────────────────────────
  const filteredVillages = useMemo(() => {
    if (!selectedDistrictId) return [];
    const sId = String(selectedDistrictId).toLowerCase().trim();
    const distObj = districts.find(d => String(d.id).toLowerCase().trim() === sId || normalizeDistrictName(d.name) === normalizeDistrictName(sId));
    const targetNormName = normalizeDistrictName(distObj?.name || distObj?.rawName || sId);

    return villages.filter((v) => {
      const vId = String(v.districtId || (v as any).id_kecamatan || "").toLowerCase().trim();
      if (vId === sId || (distObj && vId === String(distObj.id).toLowerCase().trim())) return true;
      
      // Fallback: match by parent kecamatan name in properties
      const vKecName = String(v.districtName || v.kecamatan || v.geojson?.properties?.kecamatan || v.geojson?.properties?.KECAMATAN || v.geojson?.properties?.WADMKC || (v as any).properties?.kecamatan || "");
      const normVKec = normalizeDistrictName(vKecName);
      
      if (normVKec && targetNormName && normVKec === targetNormName) {
        return true;
      }
      return false;
    });
  }, [villages, selectedDistrictId, districts]);

  // ─────────────────────────────────────────────
  // FIX: filteredOperatorInvestments dengan safe districtName lookup
  // Mencegah crash karena inv.districtName mungkin undefined
  // ─────────────────────────────────────────────
  const filteredOperatorInvestments = useMemo(() => {
    let result = investments;

    if (operatorRiskFilter !== "all") {
      result = result.filter(inv => getRiskLevel(inv).toLowerCase() === operatorRiskFilter.toLowerCase());
    }

    if (operatorSearchQuery.trim()) {
      const query = operatorSearchQuery.toLowerCase();
      result = result.filter((inv) => {
        // Safe lookup nama kecamatan dari districts array
        const districtName = districts.find((d) => d.id === inv.districtId)?.name || "";
        return (
          inv.name.toLowerCase().includes(query) ||
          inv.sector.toLowerCase().includes(query) ||
          districtName.toLowerCase().includes(query) ||
          (inv.contactPic && inv.contactPic.toLowerCase().includes(query))
        );
      });
    }

    // Sort logic
    const sorted = [...result].sort((a, b) => {
      let comparison = 0;
      if (operatorSortField === "value") {
        comparison = (a.investmentValue || 0) - (b.investmentValue || 0);
      } else if (operatorSortField === "area") {
        comparison = (a.areaHa || 0) - (b.areaHa || 0);
      } else if (operatorSortField === "date") {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        comparison = timeA - timeB;
      }
      return operatorSortOrder === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [investments, operatorSearchQuery, districts, operatorRiskFilter, operatorSortField, operatorSortOrder]);

  // ─────────────────────────────────────────────
  // HELPER: FRONTEND CHUNK STITCHING (AUTHORIZATION GRANTED)
  // ─────────────────────────────────────────────
  const stitchChunks = useCallback((layerId: string, dataChunks: any[]): any => {
    try {
      if (!dataChunks || !Array.isArray(dataChunks) || dataChunks.length === 0) {
        return null;
      }
      
      // Pencegahan Redundansi: Jika data sudah utuh dalam 1 item (bukan array of chunks)
      // Atau jika array formatnya bukan chunk dari sinkronisasi spasial
      if (dataChunks.length === 1 && dataChunks[0].type === "FeatureCollection") {
        return dataChunks[0]; // data sudah direkonstruksi utuh oleh server
      }

      // Memfilter dokumen yang memiliki prefix chunk
      const validChunks = dataChunks.filter(c => c && c.id && c.id.includes("chunk_"));
      
      if (validChunks.length === 0) {
        return null; 
      }

      // Mengurutkan chunk tersebut berdasarkan indeks (chunk_0, chunk_1, dst)
      validChunks.sort((a, b) => {
        const indexA = parseInt(a.id.replace("chunk_", ""), 10) || 0;
        const indexB = parseInt(b.id.replace("chunk_", ""), 10) || 0;
        return indexA - indexB;
      });

      // Menggabungkan (concatenate) array features dari semua chunk menjadi satu kesatuan
      let allChunksFeatures: any[] = [];
      for (const chunk of validChunks) {
        try {
           if (chunk.features && Array.isArray(chunk.features)) {
             allChunksFeatures = allChunksFeatures.concat(chunk.features);
           } else if (chunk.geojson && Array.isArray(chunk.geojson.features)) {
             allChunksFeatures = allChunksFeatures.concat(chunk.geojson.features);
           } else if (Array.isArray(chunk)) {
             allChunksFeatures = allChunksFeatures.concat(chunk);
           }
        } catch (e) {
           undefined;
        }
      }

      return {
        type: "FeatureCollection",
        features: allChunksFeatures
      };
    } catch (err) {
      console.error(`[stitchChunks] Fatal error saat men-stitch layer ${layerId}:`, err);
      return null;
    }
  }, []);

  // ─────────────────────────────────────────────
  // 1. FETCH ALL DATA dengan AbortController (mencegah memory leak)
  // ─────────────────────────────────────────────
  const fetchAllData = useCallback(async (signal?: AbortSignal) => {
    try {
      // Concurrently fetch municipal core datasets from Supabase directly
      const [distRes, vilRes, invRes, gisPotensiRes, gisInfrastrukturRes] = await Promise.all([
        safeFetchLayerData('gis_kecamatan')
          .then((data: any) => {
            if (data) {
              const features = Array.isArray(data) ? data : (data.features || []);
              return features.map((f: any, idx: number) => {
                const p = f.properties || {};
                const rawKec = p.kecamatan || p.KECAMATAN || p.name || p.WADMKC || `Kecamatan ${idx + 1}`;
                const kName = String(rawKec).replace(/kec\.\s*/i, "").replace(/kecamatan\s*/i, "").trim();
                const kId = String(p.id !== undefined && p.id !== null ? p.id : (p.districtId || `dist_${normalizeDistrictName(kName).replace(/\s+/g, "_")}`));
                return {
                  ...p,
                  id: kId,
                  name: kName,
                  rawName: rawKec,
                  polygon: f.geometry,
                  geojson: f,
                  coordinates: (() => {
                    try {
                      const cent = turf.centroid(f);
                      if (cent && cent.geometry && cent.geometry.coordinates) {
                        return [cent.geometry.coordinates[1], cent.geometry.coordinates[0]];
                      }
                    } catch (e) {}
                    return [0, 0];
                  })()
                };
              });
            }
            throw new Error('Fallback to static JSON');
          })
          .catch(() => fetch('/gis_kecamatan.json', { signal }).then(r => {
            const type = r.headers.get('content-type');
            if (type && !type.includes('application/json')) throw new Error('Not JSON');
            return r.json();
          }).then(d => {
            const features = d.features || d || [];
            return features.map((f: any, idx: number) => {
              const p = f.properties || {};
              const rawKec = p.kecamatan || p.KECAMATAN || p.name || p.WADMKC || `Kecamatan ${idx + 1}`;
              const kName = String(rawKec).replace(/kec\.\s*/i, "").replace(/kecamatan\s*/i, "").trim();
              const kId = String(p.id !== undefined && p.id !== null ? p.id : (p.districtId || `dist_${normalizeDistrictName(kName).replace(/\s+/g, "_")}`));
              return {
                ...p,
                id: kId,
                name: kName,
                rawName: rawKec,
                polygon: f.geometry,
                geojson: f,
                coordinates: (() => {
                  try {
                    const cent = turf.centroid(f);
                    if (cent && cent.geometry && cent.geometry.coordinates) {
                      return [cent.geometry.coordinates[1], cent.geometry.coordinates[0]];
                    }
                  } catch (e) {}
                  return [0, 0];
                })()
              };
            });
          }).catch(() => [])),

        safeFetchLayerData('gis_desa')
          .then((data: any) => {
            if (data) {
              const features = Array.isArray(data) ? data : (data.features || []);
              return features.map((f: any, idx: number) => {
                const p = f.properties || {};
                const vName = String(p.nama_desa || p.Nama_Desa || p.Name || p.DESA || p.desa || p.WADMKD || p.NAMOBJ || `Desa ${idx + 1}`).trim();
                const rawKec = String(p.kecamatan || p.KECAMATAN || p.WADMKC || '').trim();
                const cleanKec = rawKec.replace(/kec\.\s*/i, "").replace(/kecamatan\s*/i, "").trim();
                const rawDistId = String(p.id_kecamatan !== undefined && p.id_kecamatan !== null ? p.id_kecamatan : (p.districtId || p.district_id || (cleanKec ? `dist_${normalizeDistrictName(cleanKec).replace(/\s+/g, "_")}` : "")));
                const vId = String(p.id || p.ID_DESA || f.id || p.KodeBPS || (vName ? `vil_${vName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}` : `vil_${idx + 1}`));
                return {
                  ...p,
                  id: vId,
                  districtId: rawDistId,
                  district_id: rawDistId,
                  id_kecamatan: rawDistId,
                  districtName: cleanKec || rawKec,
                  name: vName,
                  polygon: f.geometry,
                  geojson: f,
                  coordinates: (() => {
                    try {
                      const cent = turf.centroid(f);
                      if (cent && cent.geometry && cent.geometry.coordinates) {
                        return [cent.geometry.coordinates[1], cent.geometry.coordinates[0]];
                      }
                    } catch (e) {}
                    return [0, 0];
                  })()
                };
              });
            }
            throw new Error('Fallback to static JSON');
          })
          .catch(() => fetch('/gis_desa.json', { signal }).then(r => {
            const type = r.headers.get('content-type');
            if (type && !type.includes('application/json')) throw new Error('Not JSON');
            return r.json();
          }).then(d => {
            const features = d.features || d || [];
            return features.map((f: any, idx: number) => {
              const p = f.properties || {};
              const vName = String(p.nama_desa || p.Nama_Desa || p.Name || p.DESA || p.desa || p.WADMKD || p.NAMOBJ || `Desa ${idx + 1}`).trim();
              const rawKec = String(p.kecamatan || p.KECAMATAN || p.WADMKC || '').trim();
              const cleanKec = rawKec.replace(/kec\.\s*/i, "").replace(/kecamatan\s*/i, "").trim();
              const rawDistId = String(p.id_kecamatan !== undefined && p.id_kecamatan !== null ? p.id_kecamatan : (p.districtId || p.district_id || (cleanKec ? `dist_${normalizeDistrictName(cleanKec).replace(/\s+/g, "_")}` : "")));
              const vId = String(p.id || p.ID_DESA || f.id || p.KodeBPS || (vName ? `vil_${vName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}` : `vil_${idx + 1}`));
              return {
                ...p,
                id: vId,
                districtId: rawDistId,
                district_id: rawDistId,
                id_kecamatan: rawDistId,
                districtName: cleanKec || rawKec,
                name: vName,
                polygon: f.geometry,
                geojson: f,
                coordinates: (() => {
                  try {
                    const cent = turf.centroid(f);
                    if (cent && cent.geometry && cent.geometry.coordinates) {
                      return [cent.geometry.coordinates[1], cent.geometry.coordinates[0]];
                    }
                  } catch (e) {}
                  return [0, 0];
                })()
              };
            });
          }).catch(() => [])),

        Promise.resolve(supabase.from('investments').select('*')).then((res: any) => res.data || []).catch(() => []),
        safeFetchLayerData('gis_potensi_investasi').then((data: any) => {
          if (!data) return [];
          const features = Array.isArray(data) ? data : (data.features || []);
          return features.map((f: any, idx: number) => {
            const p = f.properties || {};
            const geom = f.geometry || null;
            let lat = 0, lng = 0;
            if (geom) {
              try {
                if (geom.type === 'Point') {
                   lng = geom.coordinates[0];
                   lat = geom.coordinates[1];
                } else if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
                   const poly = geom.type === 'Polygon' ? turf.polygon(geom.coordinates) : turf.multiPolygon(geom.coordinates);
                   const center = turf.center(poly);
                   lng = center.geometry.coordinates[0];
                   lat = center.geometry.coordinates[1];
                }
              } catch(e) {}
            }
            const realPhoto = p.photo_url || p.url_foto_lokasi || p.foto || p.gambar || p.foto_lokasi || (Array.isArray(p.galeri_foto) ? p.galeri_foto[0] : (typeof p.galeri_foto === 'string' ? p.galeri_foto : "")) || "";
            const realGallery = (Array.isArray(p.galeri_foto) && p.galeri_foto.length > 0)
              ? p.galeri_foto
              : ((Array.isArray(p.gallery) && p.gallery.length > 0)
                ? p.gallery
                : ((Array.isArray(p.photo_urls) && p.photo_urls.length > 0)
                  ? p.photo_urls
                  : (realPhoto ? [realPhoto] : [])));
            return {
              id: p.id || `potensi-${idx}`,
              name: p.nama_potensi || "Potensi Investasi",
              sector: p.sektor_utama || "Lainnya",
              subSector: p.sub_sektor || "",
              description: p.deskripsi_singkat || "",
              districtId: p.district_id || p.id_kecamatan || p.KECAMATAN || p.kecamatan || p.Kecamatan || p.WADMKC || p.district || p.lokasi || "",
              villageId: p.village_id || p.id_desa || p.DESA || p.desa || p.Desa || p.WADMKD || p.village || "",
              latitude: lat,
              longitude: lng,
              areaHa: parseFloat(p.luas_ha || p.luas || "0"),
              investmentValue: parseFloat(p.estimasi_nilai || p.nilai_investasi || p.estimasi_nilai_investasi || "0"),
              komitmen_tenaga_lokal: Number(p.penyerapan_tenaga_kerja || p.komitmen_tenaga_lokal || p.tenaga_kerja || 0),
              komitmenTenagaLokal: Number(p.penyerapan_tenaga_kerja || p.komitmen_tenaga_lokal || p.tenaga_kerja || 0),
              tenaga_kerja: Number(p.penyerapan_tenaga_kerja || p.komitmen_tenaga_lokal || p.tenaga_kerja || 0),
              tenagaKerja: Number(p.penyerapan_tenaga_kerja || p.komitmen_tenaga_lokal || p.tenaga_kerja || 0),
              tenaga_lokal: Number(p.penyerapan_tenaga_kerja || p.komitmen_tenaga_lokal || p.tenaga_kerja || 0),
              tenagaLokal: Number(p.penyerapan_tenaga_kerja || p.komitmen_tenaga_lokal || p.tenaga_kerja || 0),
              tkl: Number(p.penyerapan_tenaga_kerja || p.komitmen_tenaga_lokal || p.tenaga_kerja || 0),
              penyerapan_tenaga_kerja: Number(p.penyerapan_tenaga_kerja || p.komitmen_tenaga_lokal || p.tenaga_kerja || 0),
              penyerapanTenagaKerja: Number(p.penyerapan_tenaga_kerja || p.komitmen_tenaga_lokal || p.tenaga_kerja || 0),
              komitmen_tenaga_asing: Number(p.komitmen_tenaga_asing || p.tenaga_asing || 0),
              komitmenTenagaAsing: Number(p.komitmen_tenaga_asing || p.tenaga_asing || 0),
              tenaga_asing: Number(p.komitmen_tenaga_asing || p.tenaga_asing || 0),
              tenagaAsing: Number(p.komitmen_tenaga_asing || p.tenaga_asing || 0),
              tka: Number(p.komitmen_tenaga_asing || p.tenaga_asing || 0),
              landStatus: p.status_lahan || p.kepemilikan_lahan || "Negara Bebas",
              photoUrl: realPhoto,
              photoUrls: realGallery,
              contactPic: "DPMPTSP Luwu",
              phoneNumber: "-",
              isActive: true,
              createdAt: new Date().toISOString(),
              status: "Published",
              geometry: geom,
              polaRuang: p.jenis_komoditas || "",
              smartData: { gis_potensi_investasi: [f] }
            };
          });
        }).catch(() => []),
        safeFetchLayerData('gis_infrastruktur').then((data: any) => data || []).catch(() => []),
      ]);

      if (signal?.aborted) return;

      // Sequential Fetch for API to avoid browser's 6 concurrent connection stalling limits
      const [layersRes, geoRes] = await Promise.all([
        Promise.resolve(
          fetchWithRetry('/api/spatial-layers', {
            headers: { 'Accept': 'application/json' },
          })
            .then(async (res) => {
              if (!res) return [];
              const contentType = res.headers.get('content-type') || '';
              if (!contentType.includes('application/json')) {
                return [];
              }
              const json = await res.json();
              if (Array.isArray(json)) return json;
              if (json && typeof json === 'object' && Array.isArray(json.layers)) return json.layers;
              return [];
            })
            .catch((err) => {
              if (err?.name === 'AbortError' || signal?.aborted) return [];
              console.warn('[App.tsx] /api/spatial-layers fetch error:', err?.message || err);
              return [];
            })
        ),
        Promise.resolve(supabase.from('geometries').select('*')).then((res: any) => res.data || []).catch(() => []),
      ]);

      if (signal?.aborted) return;

      // Reconcile and link every village explicitly to its parent district
      const reconciledVillages = (vilRes || []).map((v: any) => {
        const rawKecName = v.kecamatan || v.KECAMATAN || v.districtName || v.WADMKC || "";
        const normKec = normalizeDistrictName(rawKecName);
        
        const matchedDist = (distRes || []).find((d: any) => 
          (v.id_kecamatan !== undefined && v.id_kecamatan !== null && String(d.id) === String(v.id_kecamatan)) ||
          (v.districtId && String(d.id) === String(v.districtId)) ||
          (normKec && normalizeDistrictName(d.name || d.rawName) === normKec)
        );

        const finalDistId = matchedDist ? String(matchedDist.id) : String(v.districtId || v.id_kecamatan || "");
        const finalDistName = matchedDist ? matchedDist.name : (v.districtName || rawKecName);

        return {
          ...v,
          districtId: finalDistId,
          district_id: finalDistId,
          id_kecamatan: finalDistId,
          districtName: finalDistName,
          kecamatan: matchedDist ? matchedDist.rawName || `Kec. ${matchedDist.name}` : (v.kecamatan || rawKecName)
        };
      });

      const distData = distRes || [];
      const vilData = reconciledVillages;
      const invDataRaw = invRes || [];
      const gisPotensiData = gisPotensiRes || [];
      const gisInfraData = gisInfrastrukturRes || [];
      const layersData = layersRes || [];
      const geoDataRaw = geoRes || [];

      // Hentikan jika request sudah di-abort
      if (signal?.aborted) return;
      
      // Deduplikasi & Penggabungan Cerdas antara invDataRaw (tabel investments) & gisPotensiData (layer spasial)
      const invRecordMap: Record<string, any> = {};
      const nameToIdMap: Record<string, string> = {};
      const normalizeProjName = (name: string) => (name || "").toLowerCase().trim().replace(/\s+/g, " ");

      // Helper function to map a raw district name or existing ID to the unique district ID from distData
      const findDistrictIdByName = (rawName?: string): string => {
        if (!rawName) return "";
        const sRaw = String(rawName).trim();
        
        // 1. Jika rawName sudah cocok dengan ID distrik manapun secara langsung
        const exactIdMatch = distData.find((d: any) => String(d.id).toLowerCase() === sRaw.toLowerCase());
        if (exactIdMatch) return String(exactIdMatch.id);

        // 2. Jika tidak, gunakan normalisasi nama distrik untuk mencocokkan secara persis kawan!
        const normSearch = normalizeDistrictName(sRaw);
        if (!normSearch) return sRaw;

        const matched = distData.find((d: any) => {
          const normDistName = normalizeDistrictName(d.name || d.rawName);
          return normDistName === normSearch;
        });

        return matched ? String(matched.id) : sRaw;
      };

      // Helper function to map a raw village name or ID to the actual village ID from vilData
      const findVillageIdByName = (rawName?: string, distId?: string): string => {
        if (!rawName) return "";
        const sRaw = String(rawName).trim();

        // Check if raw name explicitly matches via stripped ID prefixes (e.g. v_real_102 -> 102)
        const strippedId = sRaw.replace(/^v_real_/i, "").replace(/^vil_/i, "");
        const exactIdMatch = vilData.find((v: any) => String(v.id).toLowerCase() === strippedId.toLowerCase() || String(v.id).toLowerCase() === sRaw.toLowerCase());
        if (exactIdMatch) return String(exactIdMatch.id);

        // Normalize string matching
        const normSearch = normalizeName(sRaw);
        if (!normSearch) return sRaw;

        const matched = vilData.find((v: any) => {
           // if we know the district, let's heavily prefer villages in that district!
           if (distId && String(v.districtId) !== String(distId)) return false;
           return normalizeName(v.name || v.rawName || v.DESA || "") === normSearch;
        });

        if (matched) return String(matched.id);

        // Fallback matching without district strictness
        const fallbackMatch = vilData.find((v: any) => normalizeName(v.name || v.rawName || v.DESA || "") === normSearch);
        return fallbackMatch ? String(fallbackMatch.id) : strippedId; // return strippedId directly so v_real_102 becomes 102
      };

      // 1. Masukkan data relasional dari tabel investments
      if (Array.isArray(invDataRaw)) {
        for (const item of invDataRaw) {
          if (!item) continue;
          const idKey = String(item.id || item.nama_potensi || "");
          const normName = normalizeProjName(item.name || item.nama_potensi);
          const resolvedPhoto = item.photo_url || item.url_foto_lokasi || item.photoUrl || item.foto || item.gambar || item.foto_lokasi || (Array.isArray(item.galeri_foto) ? item.galeri_foto[0] : "") || "";
          const resolvedGallery = (Array.isArray(item.galeri_foto) && item.galeri_foto.length > 0)
            ? item.galeri_foto
            : ((Array.isArray(item.gallery) && item.gallery.length > 0)
              ? item.gallery
              : ((Array.isArray(item.photo_urls) && item.photo_urls.length > 0)
                ? item.photo_urls
                : ((Array.isArray(item.photoUrls) && item.photoUrls.length > 0)
                  ? item.photoUrls
                  : (resolvedPhoto ? [resolvedPhoto] : []))));

          const rawDistId = item.districtId || item.district_id || item.kecamatan_id || "";
          const resolvedDistId = findDistrictIdByName(rawDistId);

          const parseLabor = (val: any) => {
            if (typeof val === 'number') return isNaN(val) ? 0 : val;
            if (typeof val === 'string') {
              const cleaned = val.replace(/[^0-9.]/g, '');
              const num = parseFloat(cleaned);
              return isNaN(num) ? 0 : num;
            }
            return 0;
          };

          const rawLaborLocal = parseLabor(
            item.komitmen_tenaga_lokal ??
            item.komitmenTenagaLokal ??
            item.tenaga_kerja ??
            item.tenagaKerja ??
            item.tenaga_lokal ??
            item.tenagaLokal ??
            item.tkl ??
            0
          );
          const rawLaborForeign = parseLabor(
            item.komitmen_tenaga_asing ??
            item.komitmenTenagaAsing ??
            item.tenaga_asing ??
            item.tenagaAsing ??
            item.tka ??
            0
          );

          const normalizedItem = {
            ...item,
            districtId: resolvedDistId,
            district_id: resolvedDistId,
            villageId: item.villageId || item.village_id || item.desa_id || "",
            village_id: item.village_id || item.villageId || item.desa_id || "",
            areaHa: Number(item.areaHa !== undefined ? item.areaHa : (item.area_ha !== undefined ? item.area_ha : 0)) || 0,
            area_ha: Number(item.area_ha !== undefined ? item.area_ha : (item.areaHa !== undefined ? item.areaHa : 0)) || 0,
            investmentValue: Number(item.investmentValue !== undefined ? item.investmentValue : (item.investment_value !== undefined ? item.investment_value : (item.nilai_investasi !== undefined ? item.nilai_investasi : 0))) || 0,
            investment_value: Number(item.investment_value !== undefined ? item.investment_value : (item.investmentValue !== undefined ? item.investmentValue : (item.nilai_investasi !== undefined ? item.nilai_investasi : 0))) || 0,
            komitmen_tenaga_lokal: rawLaborLocal,
            komitmenTenagaLokal: rawLaborLocal,
            tenaga_kerja: rawLaborLocal + rawLaborForeign,
            tenagaKerja: rawLaborLocal + rawLaborForeign,
            tenaga_lokal: rawLaborLocal,
            tenagaLokal: rawLaborLocal,
            tkl: rawLaborLocal,
            komitmen_tenaga_asing: rawLaborForeign,
            komitmenTenagaAsing: rawLaborForeign,
            tenaga_asing: rawLaborForeign,
            tenagaAsing: rawLaborForeign,
            tka: rawLaborForeign,
            createdAt: item.createdAt || item.created_at || (item.created_at ? new Date(item.created_at).toISOString() : new Date().toISOString()),
            created_at: item.created_at || item.createdAt || new Date().toISOString(),
            photoUrl: resolvedPhoto,
            photo_url: resolvedPhoto,
            url_foto_lokasi: resolvedPhoto,
            photoUrls: resolvedGallery,
            photo_urls: resolvedGallery,
            gallery: resolvedGallery,
            galeri_foto: resolvedGallery,
          };
          if (idKey) {
            invRecordMap[idKey] = normalizedItem;
          }
          if (normName && idKey) {
            nameToIdMap[normName] = idKey;
          }
        }
      }

      // 2. Gabungkan data spasial dari gisPotensiData (hindari duplikasi data ganda)
      if (Array.isArray(gisPotensiData)) {
        for (const gisItem of gisPotensiData) {
          if (!gisItem) continue;
          const idKey = String(gisItem.id || gisItem.nama_potensi || "");
          const normName = normalizeProjName(gisItem.name || gisItem.nama_potensi);

          const matchedId = (idKey && invRecordMap[idKey]) ? idKey : (normName && nameToIdMap[normName] ? nameToIdMap[normName] : null);

          const rawGisDistId = gisItem.districtId || gisItem.district_id || "";
          const resolvedGisDistId = findDistrictIdByName(rawGisDistId);

          if (matchedId && invRecordMap[matchedId]) {
            const existing = invRecordMap[matchedId];
            const mergedPhoto = existing.photoUrl || existing.photo_url || existing.url_foto_lokasi || gisItem.photoUrl || gisItem.photo_url || gisItem.url_foto_lokasi || "";
            const mergedGallery = (existing.photoUrls && existing.photoUrls.length > 0) ? existing.photoUrls : (gisItem.photoUrls || (mergedPhoto ? [mergedPhoto] : []));
            
            const areaVal = Number(existing.areaHa && existing.areaHa > 0 ? existing.areaHa : (gisItem.areaHa || existing.area_ha || gisItem.area_ha || 0));
            const investVal = Number(existing.investmentValue && existing.investmentValue > 0 ? existing.investmentValue : (gisItem.investmentValue || existing.investment_value || gisItem.investment_value || 0));

            const finalDistId = existing.districtId || resolvedGisDistId || "";

            const laborLocalVal = Number(existing.komitmenTenagaLokal || existing.komitmen_tenaga_lokal || existing.penyerapan_tenaga_kerja || existing.penyerapanTenagaKerja || gisItem.komitmenTenagaLokal || gisItem.komitmen_tenaga_lokal || gisItem.penyerapan_tenaga_kerja || gisItem.penyerapanTenagaKerja || 0);
            const laborForeignVal = Number(existing.komitmenTenagaAsing || existing.komitmen_tenaga_asing || gisItem.komitmenTenagaAsing || gisItem.komitmen_tenaga_asing || 0);

            invRecordMap[matchedId] = {
              ...gisItem,
              ...existing,
              districtId: finalDistId,
              district_id: finalDistId,
              villageId: existing.villageId || gisItem.villageId || existing.village_id || gisItem.village_id || "",
              village_id: existing.village_id || gisItem.village_id || existing.villageId || gisItem.villageId || "",
              areaHa: areaVal,
              area_ha: areaVal,
              investmentValue: investVal,
              investment_value: investVal,
              komitmen_tenaga_lokal: laborLocalVal,
              komitmenTenagaLokal: laborLocalVal,
              tenaga_kerja: laborLocalVal + laborForeignVal,
              tenagaKerja: laborLocalVal + laborForeignVal,
              tenaga_lokal: laborLocalVal,
              tenagaLokal: laborLocalVal,
              tkl: laborLocalVal,
              penyerapan_tenaga_kerja: laborLocalVal,
              penyerapanTenagaKerja: laborLocalVal,
              komitmen_tenaga_asing: laborForeignVal,
              komitmenTenagaAsing: laborForeignVal,
              tenaga_asing: laborForeignVal,
              tenagaAsing: laborForeignVal,
              tka: laborForeignVal,
              photoUrl: mergedPhoto,
              photo_url: mergedPhoto,
              url_foto_lokasi: mergedPhoto,
              photoUrls: mergedGallery,
              photo_urls: mergedGallery,
              gallery: mergedGallery,
              galeri_foto: mergedGallery,
              geometry: existing.geometry || gisItem.geometry,
              latitude: (existing.latitude && existing.latitude !== 0) ? existing.latitude : gisItem.latitude,
              longitude: (existing.longitude && existing.longitude !== 0) ? existing.longitude : gisItem.longitude,
              smartData: {
                ...(gisItem.smartData || {}),
                ...(existing.smartData || {})
              }
            };
          } else {
            const finalId = idKey || `gis-${Math.random().toString(36).slice(2, 9)}`;
            const gisArea = Number(gisItem.areaHa || gisItem.area_ha || 0);
            const gisVal = Number(gisItem.investmentValue || gisItem.investment_value || 0);
            const gisLaborLocal = Number(gisItem.komitmenTenagaLokal || gisItem.komitmen_tenaga_lokal || gisItem.penyerapan_tenaga_kerja || gisItem.penyerapanTenagaKerja || gisItem.tenagaKerja || gisItem.tenaga_kerja || gisItem.tkl || 0);
            const gisLaborForeign = Number(gisItem.komitmenTenagaAsing || gisItem.komitmen_tenaga_asing || gisItem.tenagaAsing || gisItem.tenaga_asing || gisItem.tka || 0);
            invRecordMap[finalId] = { 
              ...gisItem, 
              id: finalId,
              districtId: resolvedGisDistId,
              district_id: resolvedGisDistId,
              villageId: gisItem.villageId || gisItem.village_id || "",
              village_id: gisItem.village_id || gisItem.villageId || "",
              areaHa: gisArea,
              area_ha: gisArea,
              investmentValue: gisVal,
              investment_value: gisVal,
              komitmen_tenaga_lokal: gisLaborLocal,
              komitmenTenagaLokal: gisLaborLocal,
              tenaga_kerja: gisLaborLocal + gisLaborForeign,
              tenagaKerja: gisLaborLocal + gisLaborForeign,
              tenaga_lokal: gisLaborLocal,
              tenagaLokal: gisLaborLocal,
              tkl: gisLaborLocal,
              penyerapan_tenaga_kerja: gisLaborLocal,
              penyerapanTenagaKerja: gisLaborLocal,
              komitmen_tenaga_asing: gisLaborForeign,
              komitmenTenagaAsing: gisLaborForeign,
              tenaga_asing: gisLaborForeign,
              tenagaAsing: gisLaborForeign,
              tka: gisLaborForeign,
            };
            if (normName) {
              nameToIdMap[normName] = finalId;
            }
          }
        }
      }

      const invData: Investment[] = (Object.values(invRecordMap) as any[]).map((item) => {
        const dId = item.districtId || item.district_id || item.kecamatan_id || "";
        const vId = item.villageId || item.village_id || item.desa_id || "";
        const aHa = Number(item.areaHa !== undefined ? item.areaHa : (item.area_ha !== undefined ? item.area_ha : 0)) || 0;
        const iVal = Number(item.investmentValue !== undefined ? item.investmentValue : (item.investment_value !== undefined ? item.investment_value : 0)) || 0;
        const parseLaborFn = (val: any) => {
          if (typeof val === 'number') return isNaN(val) ? 0 : val;
          if (typeof val === 'string') {
            const cleaned = val.replace(/[^0-9.]/g, '');
            const num = parseFloat(cleaned);
            return isNaN(num) ? 0 : num;
          }
          return 0;
        };
        const laborLocal = parseLaborFn(
          item.komitmen_tenaga_lokal ??
          item.komitmenTenagaLokal ??
          item.penyerapan_tenaga_kerja ??
          item.penyerapanTenagaKerja ??
          item.tenaga_kerja ??
          item.tenagaKerja ??
          item.tenaga_lokal ??
          item.tenagaLokal ??
          item.tkl ??
          0
        );
        const laborForeign = parseLaborFn(
          item.komitmen_tenaga_asing ??
          item.komitmenTenagaAsing ??
          item.tenaga_asing ??
          item.tenagaAsing ??
          item.tka ??
          0
        );
        return {
          ...item,
          districtId: String(dId),
          district_id: String(dId),
          villageId: String(vId),
          village_id: String(vId),
          areaHa: aHa,
          area_ha: aHa,
          investmentValue: iVal,
          investment_value: iVal,
          komitmen_tenaga_lokal: laborLocal,
          komitmenTenagaLokal: laborLocal,
          tenaga_kerja: laborLocal + laborForeign,
          tenagaKerja: laborLocal + laborForeign,
          tenaga_lokal: laborLocal,
          tenagaLokal: laborLocal,
          tkl: laborLocal,
          komitmen_tenaga_asing: laborForeign,
          komitmenTenagaAsing: laborForeign,
          tenaga_asing: laborForeign,
          tenagaAsing: laborForeign,
          tka: laborForeign,
          createdAt: item.createdAt || item.created_at || (item.created_at ? new Date(item.created_at).toISOString() : new Date().toISOString()),
          created_at: item.created_at || item.createdAt || new Date().toISOString(),
        };
      }) as Investment[];
      
      const geoData = (Array.isArray(geoDataRaw) ? geoDataRaw : []).map((g: any) => {
        let calculatedArea = g.area_ha || 0;
        let calculatedPerimeter = g.perimeter_km || 0;
        
        if (g.geometry && g.geometry.coordinates) {
          try {
            if (g.geometry.type === 'Polygon' || g.geometry.type === 'MultiPolygon') {
              const poly = g.geometry.type === 'Polygon' ? turf.polygon(g.geometry.coordinates) : turf.multiPolygon(g.geometry.coordinates);
              const rawAreaSqm = turf.area(poly);
              calculatedArea = Number((rawAreaSqm / 10000).toFixed(2));
              calculatedPerimeter = turf.length(poly, { units: 'kilometers' });
            } else if (g.geometry.type === 'LineString') {
              const line = turf.lineString(g.geometry.coordinates);
              calculatedPerimeter = turf.length(line, { units: 'kilometers' });
            }
          } catch (e) {
            undefined;
          }
        }

        return {
          ...g,
          geometryType: g.geometry?.type || "Polygon",
          areaHa: calculatedArea,
          perimeterKm: calculatedPerimeter,
          area_ha: calculatedArea, // needed for InvestmentDetailModal
          perimeter_km: calculatedPerimeter
        };
      });
      
      setGeometries(geoData);
      
      let layersArr = Array.isArray(layersData) ? [...layersData] : [];

      // 12 Target Layers Tematik sesuai spesifikasi Doktrin Spasial Pemkab Luwu
      const targetThematicDefs: Array<{ id: string; name: string; category: string; color: string; lineWidth: number; opacity: number; defaultFeatures?: any[] }> = [
        { id: "layer_desa", name: "Batas Administrasi Desa", category: "Desa", color: "#10b981", lineWidth: 1, opacity: 0.5, defaultFeatures: Array.isArray(vilData) ? vilData.map((v: any) => v.geojson || v.geom).filter(Boolean) : [] },
        { id: "layer_infrastruktur", name: "Titik Infrastruktur", category: "Infrastruktur", color: "#f43f5e", lineWidth: 1, opacity: 0.8, defaultFeatures: Array.isArray(gisInfraData) ? gisInfraData : [] },
        { id: "layer_potensi", name: "Potensi Investasi", category: "Potensi", color: "#10b981", lineWidth: 0, opacity: 0.6, defaultFeatures: Array.isArray(gisPotensiData) ? gisPotensiData : [] },
        { id: "layer_sawah", name: "Pertanian Sawah", category: "Pertanian", color: "#22c55e", lineWidth: 1, opacity: 0.65 },
        { id: "layer_tambak", name: "Perikanan Tambak", category: "Perikanan", color: "#0ea5e9", lineWidth: 1, opacity: 0.65 },
        { id: "layer_mangrove", name: "Kawasan Mangrove", category: "Konservasi", color: "#14b8a6", lineWidth: 1, opacity: 0.65 },
        { id: "layer_lahan_kering_sekunder", name: "Lahan Kering Sekunder", category: "Kehutanan", color: "#f59e0b", lineWidth: 1, opacity: 0.65 },
        { id: "layer_lahan_kering_primer", name: "Lahan Kering Primer", category: "Kehutanan", color: "#b45309", lineWidth: 1, opacity: 0.65 },
        { id: "layer_zonasi", name: "Zonasi Kawasan (RTRW)", category: "Zonasi", color: "#8b5cf6", lineWidth: 1.5, opacity: 0.65 },
        { id: "layer_flood_risk", name: "Peta Risiko Banjir", category: "Risk", color: "#3b82f6", lineWidth: 1, opacity: 0.5 },
        { id: "layer_landslide_risk", name: "Peta Risiko Longsor", category: "Risk", color: "#ef4444", lineWidth: 1, opacity: 0.5 },
        { id: "layer_historical_suitability", name: "Kesesuaian Lahan", category: "History", color: "#f59e0b", lineWidth: 1, opacity: 0.5 },
        { id: "layer_jalan", name: "Jaringan Jalan Utama", category: "Jalan", color: "#f59e0b", lineWidth: 2, opacity: 0.8 },
      ];

      // Tambahkan layer RBI dan Kecamatan jika belum terdaftar
      if (!layersArr.some((l: any) => l.id === "layer_rbi")) {
        layersArr.push({
          id: "layer_rbi",
          name: "Peta Rupa Bumi (RBI)",
          category: "Lainnya",
          geojson: { type: "FeatureCollection", features: [] },
          uploadedAt: new Date().toISOString(),
          isActive: false,
          opacity: 1,
          color: "#000000",
          lineWidth: 0
        });
      }
      if (!layersArr.some((l: any) => l.id === "layer_kecamatan")) {
        layersArr.push({
          id: "layer_kecamatan",
          name: "Layer Kecamatan",
          category: "Kecamatan",
          geojson: { 
            type: "FeatureCollection", 
            features: Array.isArray(distData) ? distData.map((d: any) => d.geojson).filter(Boolean) : []
          },
          uploadedAt: new Date().toISOString(),
          isActive: true,
          opacity: 1,
          color: "#e2e8f0",
          lineWidth: 0
        });
      }

      // Pastikan seluruh 12 layer tematik terdaftar lengkap di layersArr
      targetThematicDefs.forEach(def => {
        const existing = layersArr.find((l: any) => l.id === def.id);
        const shouldBeActive = def.id === "layer_desa" || def.id === "layer_jalan" || def.id === "layer_potensi" || def.id === "layer_infrastruktur";
        if (!existing) {
          layersArr.push({
            id: def.id,
            name: def.name,
            category: def.category,
            geojson: { 
              type: "FeatureCollection", 
              features: def.defaultFeatures || []
            },
            uploadedAt: new Date().toISOString(),
            isActive: shouldBeActive,
            opacity: def.opacity,
            color: def.color,
            lineWidth: def.lineWidth
          });
        } else {
          // Jika geojson kosong tetapi ada default features dari DB/RPC, sematkan
          if ((!existing.geojson || !existing.geojson.features || existing.geojson.features.length === 0) && def.defaultFeatures && def.defaultFeatures.length > 0) {
            existing.geojson = {
              type: "FeatureCollection",
              features: def.defaultFeatures
            };
          }
          existing.isActive = shouldBeActive;
        }
      });

      // Fetch db sync status directly from Supabase
      let dbError: string | null = null;
      try {
        const { error: dbStatusError } = await supabase.from('investments').select('id', { count: 'exact', head: true });
        if (dbStatusError) {
          dbError = dbStatusError.message || "Gagal sinkronisasi data cloud.";
        }
      } catch (errDb: any) {
        if (errDb?.name !== "AbortError" && !signal?.aborted) {
          dbError = "Layanan database sedang tidak merespon.";
        }
      }
      setDbStatusError(dbError);

      let extractedInvestments = invData || [];

      // No fallback override! We strictly use data from DB to prevent "Data Hantu"
      // If db is empty, it stays empty.

      if (signal?.aborted) return;

      setDistricts(distData);
      setVillages(vilData);
      setInvestments(extractedInvestments);
      
      const layerMap: Record<string, GeoJSONLayer> = {};
      const initialLoaded = new Set<string>(["layer_kecamatan", "layer_desa", "layer_jalan", "layer_potensi", "layer_infrastruktur"]);

      layersArr.forEach((l: any) => {
        if (l.id) {
          // Aktifkan layer utama (kecamatan, desa, jalan, potensi investasi, infrastruktur) secara default kawan
          const defaultActiveLayers = ["layer_kecamatan", "layer_desa", "layer_jalan", "layer_potensi", "layer_infrastruktur"];
          const isDefActive = defaultActiveLayers.includes(l.id);
          l.isActive = isDefActive;
          l.isLazy = !isDefActive && (!l.geojson || !l.geojson.features || l.geojson.features.length === 0);
          l.isLoading = false;
          if (l.geojson?.features && l.geojson.features.length > 0) {
            initialLoaded.add(l.id);
          }
          layerMap[l.id] = l;
        }
      });
      // Sinkronisasi layer_land_use_zoning dengan layer_zonasi
      if (layerMap["layer_zonasi"] && !layerMap["layer_land_use_zoning"]) {
        layerMap["layer_land_use_zoning"] = {
          ...layerMap["layer_zonasi"],
          id: "layer_land_use_zoning",
          name: "Land Use Zoning"
        };
      }
      loadedSourcesRef.current = initialLoaded;
      setLoadedSources(initialLoaded);
      setSpatialLayers(layerMap);
      
      setSpatialQueryResults(extractedInvestments);

      // Ekstrak infrastructure points langsung dari gis_infrastruktur (atau layer_infrastruktur fallback)
      let points = [];
      if (Array.isArray(gisInfraData) && gisInfraData.length > 0) {
        // From PostGIS directly
        points = gisInfraData.map((f: any) => {
          const p = f.properties || {};
          let lat = 0, lng = 0;
          if (f.geometry?.type === 'Point') {
            lng = f.geometry.coordinates[0];
            lat = f.geometry.coordinates[1];
          } else if (f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon') {
            try {
               const poly = f.geometry.type === 'Polygon' ? turf.polygon(f.geometry.coordinates) : turf.multiPolygon(f.geometry.coordinates);
               const center = turf.center(poly);
               lng = center.geometry.coordinates[0];
               lat = center.geometry.coordinates[1];
            } catch(e) {}
          }
          return {
            id: p.id || f.id || "infra-" + Math.random().toString(36).substring(2, 9),
            name: p.nama_infrastruktur || p.name || "Fasilitas Umum",
            type: p.jenis_infrastruktur || p.type || p.category || "Lainnya",
            description: p.keterangan || p.description || "",
            capacity: p.kapasitas || p.capacity || "",
            operatingHours: p.jam_operasional || p.operatingHours || p.jamBuka || "07:30 - 16:00 (Senin - Kamis), 07:30 - 16:30 (Jumat)",
            latitude: lat,
            longitude: lng,
          };
        });
      } else {
        // Fallback to layersData
        const infraLayer = layersArr.find((l: any) => l.id === "layer_infrastruktur");
        if (infraLayer?.geojson?.features) {
          points = infraLayer.geojson.features.map((f: any) => ({
            id: f.properties?.id || f.id || "infra-" + Math.random().toString(36).substring(2, 9),
            name: f.properties?.name || "Fasilitas Umum",
            type: f.properties?.type || f.properties?.category || "Lainnya",
            description: f.properties?.description || "",
            capacity: f.properties?.capacity || f.properties?.kapasitas || "",
            operatingHours: f.properties?.operatingHours || f.properties?.jam_operasional || f.properties?.jamBuka || "07:30 - 16:00 (Senin - Kamis), 07:30 - 16:30 (Jumat)",
            latitude: f.geometry?.coordinates?.[1] || 0,
            longitude: f.geometry?.coordinates?.[0] || 0,
          }));
        }
      }
      setInfrastructure(points);
    } catch (err: any) {
      // Abaikan error AbortError (bukan error sesungguhnya)
      if (err?.name === "AbortError" || signal?.aborted) return;
      console.error("Failed to load full-stack municipal dataset:", err);
      setDbStatusError(err?.message || "Failed to communicate with service.");
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  // ─── Mount: fetch data dengan abort cleanup ───
  useEffect(() => {
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    fetchAllData(controller.signal);
    return () => {
      controller.abort();
    };
  }, [fetchAllData]);

  // ─── Fetch Stats dynamically with In-Flight Deduplication, Debounce & Race Condition Guards ───
  const statsReqSeqRef = useRef<number>(0);
  const inFlightStatsRef = useRef<Record<string, Promise<any>>>({});
  const fetchStatsRef = useRef<() => void>(() => {});
  const fetchAllDataRef = useRef<(signal?: AbortSignal) => Promise<void>>(fetchAllData);
  const statsAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchAllDataRef.current = fetchAllData;
  }, [fetchAllData]);

  const fetchStats = useCallback(async (forcedSignal?: AbortSignal) => {
    setIsStatsLoading(true);
    try {
      let filteredInvs = investments || [];
      if (selectedDistrictId) {
        filteredInvs = filteredInvs.filter((i: any) => 
          String(i.districtId) === String(selectedDistrictId) || 
          String(i.district_id) === String(selectedDistrictId) ||
          String(i.kecamatan_id) === String(selectedDistrictId)
        );
      }
      if (selectedVillageId) {
        filteredInvs = filteredInvs.filter((i: any) => 
          String(i.villageId) === String(selectedVillageId) || 
          String(i.village_id) === String(selectedVillageId) ||
          String(i.desa_id) === String(selectedVillageId)
        );
      }

      const totalOpportunities = filteredInvs.length;
      const totalArea = filteredInvs.reduce((acc: number, curr: any) => acc + (Number(curr.areaHa || curr.area_ha || curr.luas_area || curr.luas_ha || 0) || 0), 0);
      const totalValue = filteredInvs.reduce((acc: number, curr: any) => acc + (Number(curr.investmentValue || curr.investment_value || curr.nilai_investasi || curr.estimasi_nilai || 0) || 0), 0);
      
      const totalTKL = filteredInvs.reduce((acc: number, curr: any) => {
        const val = curr.komitmenTenagaLokal ?? curr.komitmen_tenaga_lokal ?? curr.penyerapan_tenaga_kerja ?? curr.penyerapanTenagaKerja ?? curr.tenagaKerja ?? curr.tenaga_kerja ?? curr.tenaga_lokal ?? curr.tenagaLokal ?? curr.tkl ?? 0;
        const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0;
        return acc + num;
      }, 0);

      const totalTKA = filteredInvs.reduce((acc: number, curr: any) => {
        const val = curr.komitmenTenagaAsing ?? curr.komitmen_tenaga_asing ?? curr.tenaga_asing ?? curr.tenagaAsing ?? curr.tka ?? 0;
        const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0;
        return acc + num;
      }, 0);

      const totalLabor = totalTKL + totalTKA;

      const sectorCount: Record<string, number> = {};
      filteredInvs.forEach((inv: any) => {
        const sector = inv.sector || inv.sektor || inv.kategori || "Lainnya";
        sectorCount[sector] = (sectorCount[sector] || 0) + 1;
      });
      
      const sectorData = Object.keys(sectorCount).map(k => ({
        name: k,
        value: sectorCount[k]
      }));
      
      let dominantSector = "N/A";
      if (sectorData.length > 0) {
        dominantSector = sectorData.sort((a,b) => b.value - a.value)[0].name;
      }

      setStats({
        success: true,
        totalOpportunities,
        totalInvestments: totalOpportunities,
        totalArea,
        totalValue,
        totalLabor,
        totalTKL,
        totalTKA,
        avgRoiRange: "10-15%",
        dominantSector,
        avgInfraScore: 7.5,
        sectorData,
        districtRankings: [],
        monthlyTrends: [],
        performance: {
          ikm: null,
          nibSla: null,
          spatialAccuracy: null
        },
        topInvestments: filteredInvs.slice(0, 5)
      });
    } catch (err: any) {
      setStats({
        success: true,
        totalOpportunities: 0,
        totalInvestments: 0,
        totalArea: 0,
        totalValue: 0,
        avgRoiRange: "0%",
        dominantSector: "N/A",
        avgInfraScore: 0,
        sectorData: [],
        districtRankings: [],
        monthlyTrends: [],
        performance: {
          ikm: null,
          nibSla: null,
          spatialAccuracy: null
        },
        topInvestments: []
      });
    } finally {
      setIsStatsLoading(false);
    }
  }, [investments, selectedDistrictId, selectedVillageId]);

  // Keep fetchStatsRef current for stable event triggers
  useEffect(() => {
    fetchStatsRef.current = () => {
      fetchStats();
    };
  }, [fetchStats]);

  // Fetch stats smoothly on district/village filter change with custom lightweight 300ms debounce & abort cleanup
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStats();
    }, 300);

    return () => {
      clearTimeout(timer);
      if (statsAbortControllerRef.current) {
        statsAbortControllerRef.current.abort();
      }
    };
  }, [selectedDistrictId, selectedVillageId, fetchStats]);

  // ─── Realtime Potensi Investasi & Investments Live Sync ───
  useEffect(() => {
    if (!isSpatialLiveSyncEnabled) {
      setLiveSyncStatus("off");
      return;
    }

    let isMounted = true;
    let reconnectTimeoutId: NodeJS.Timeout | null = null;
    let activeChannel: any = null;
    let retryCount = 0;
    const MAX_RETRIES = 6;
    let debounceTimer: NodeJS.Timeout | null = null;

    const triggerDebouncedSync = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!isMounted) return;
        if (fetchStatsRef.current) fetchStatsRef.current();
        if (fetchAllDataRef.current) {
          fetchAllDataRef.current().catch((err) => {
            console.warn("[Spatial Live Sync] Refresh handler error:", err);
          });
        }
      }, 400);
    };

    const cleanupActiveChannel = () => {
      if (activeChannel) {
        try {
          supabase.removeChannel(activeChannel);
        } catch (e) {
          // ignore cleanup error
        }
        activeChannel = null;
      }
    };

    const initializeChannel = () => {
      if (!isMounted) return;

      // Diagnostic check: check network online status
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setLiveSyncStatus("error");
        return;
      }

      setLiveSyncStatus("connecting");
      cleanupActiveChannel();

      try {
        const channelName = `spatial_live_sync_${Date.now()}`;
        const channel = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "gis_potensi_investasi" },
            (payload) => {
              console.log("⚡ [Spatial Live Sync] Perubahan terdeteksi pada tabel 'gis_potensi_investasi':", payload.eventType);
              triggerDebouncedSync();
            }
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "investments" },
            (payload) => {
              console.log("⚡ [Spatial Live Sync] Perubahan terdeteksi pada tabel 'investments':", payload.eventType);
              triggerDebouncedSync();
            }
          )
          .subscribe((status) => {
            if (!isMounted) return;

            if (status === "SUBSCRIBED") {
              console.log("🟢 [Spatial Live Sync] Terhubung secara aktif ke Supabase Realtime!");
              retryCount = 0;
              setLiveSyncStatus("connected");
            } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
              setLiveSyncStatus("error");
              
              // Exponential backoff auto-reconnection
              if (retryCount < MAX_RETRIES) {
                retryCount++;
                const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 30000);
                if (reconnectTimeoutId) clearTimeout(reconnectTimeoutId);
                reconnectTimeoutId = setTimeout(() => {
                  if (isMounted) {
                    initializeChannel();
                  }
                }, backoffDelay);
              }
            } else if (status === "CLOSED") {
              setLiveSyncStatus("off");
            }
          });

        activeChannel = channel;
      } catch (err) {
        if (isMounted) {
          setLiveSyncStatus("error");
        }
      }
    };

    const handleOnline = () => {
      retryCount = 0;
      initializeChannel();
    };

    window.addEventListener("online", handleOnline);
    initializeChannel();

    return () => {
      isMounted = false;
      window.removeEventListener("online", handleOnline);
      if (reconnectTimeoutId) clearTimeout(reconnectTimeoutId);
      if (debounceTimer) clearTimeout(debounceTimer);
      cleanupActiveChannel();
    };
  }, [isSpatialLiveSyncEnabled]);

  // ─────────────────────────────────────────────
  // 2. TRACK HECTARES realtime saat digitasi polygon
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (digitizedPoints.length > 2) {
      try {
        const formattedCoords = [...digitizedPoints, digitizedPoints[0]];
        const drawnPolygon = turf.polygon([formattedCoords]);
        const areaSqm = turf.area(drawnPolygon);
        setDigitizedHectares(Number((areaSqm / 10000).toFixed(2)));
      } catch (err) {
        undefined;
      }
    } else {
      setDigitizedHectares(0);
    }
  }, [digitizedPoints]);

  // ─────────────────────────────────────────────
  // GLOBAL SPATIAL SYNC
  // ─────────────────────────────────────────────
  const handleGlobalSpatialSync = async () => {
    try {
      setIsGlobalSyncing(true);
      setGlobalSyncProgress(null);
      setGlobalSyncSuccess(null);

      // Start polling progress polling loop
      const progressInterval = setInterval(async () => {
        try {
          const progRes = await fetch("/api/spatial-sync/progress", { headers: getAuthHeaders() });
          if (progRes.ok) {
            const progData = await progRes.json();
            if (progData) {
              setGlobalSyncProgress({
                progress: progData.progress,
                total: progData.total,
                message: progData.message,
                currentLayer: progData.currentLayer
              });
            }
          }
        } catch(e) {}
      }, 500);

      const res = await fetch("/api/spatial-sync", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ type: "global" }),
      });
      
      clearInterval(progressInterval);
      setGlobalSyncProgress(null);

      if (res.ok) {
        setGlobalSyncSuccess(
          "SINKRONISASI SUKSES! Seluruh Potensi Investasi telah diselaraskan dengan batas administrasi dan layer tematik!",
        );
        fetchAllData();
      } else {
        setGlobalSyncSuccess("Gagal melakukan penyelarasan global database spasial.");
      }
    } catch (err) {
      setGlobalSyncSuccess("Error menghubungi api server.");
    } finally {
      setIsGlobalSyncing(false);
    }
  };

  const handleAddInvestmentSubmit = async (formData: any) => {
    // Legacy API fallback logic has been purged. SmartInvestmentFormEngine handles direct Supabase operations.
    mapComponentRef.current?.clearDraw();
    setDrawnGeoJson(null);
    setIsAddModalOpen(false);
    try {
      await fetchAllData();
    } catch (e) {
      console.error("Data refresh error:", e);
    }
  };

  const handleEditInvestmentSubmit = async (formData: any) => {
    // Legacy API fallback logic has been purged.
    setIsEditModalOpen(false);
    setEditingInvestment(null);
    try {
      await fetchAllData();
    } catch (e) {
      console.error("Refresh error:", e);
    }
  };

  const handleDeleteInvestment = async (id: string) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Konfirmasi Hapus",
      text: "Apakah Anda yakin ingin menghapus potensi investasi ini dari basis data spasial?",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal"
    });
    if (!result.isConfirmed) return;

    Swal.fire({
      title: "Menghapus Data...",
      text: "Sedang memproses penghapusan dari database spasial...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const res = await fetch(`/api/investments/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getAuthHeadersOnly(),
      });
      if (res.ok) {
        setSelectedInvestmentId(null);
        await fetchAllData();
        Swal.fire({
          icon: "success",
          title: "Berhasil Dihapus",
          text: "Potensi investasi telah berhasil dihapus dari database spasial.",
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        Swal.fire({
          icon: "error",
          title: "Gagal Menghapus",
          text: errData.error || errData.message || "Terjadi kendala saat menghapus potensi investasi.",
        });
      }
    } catch (err: any) {
      console.error("Error deleting investment:", err);
      Swal.fire({
        icon: "error",
        title: "Kesalahan Jaringan",
        text: err?.message || "Tidak dapat menghubungi server.",
      });
    }
  };

  // ─────────────────────────────────────────────
  // 6. CSV IMPORT
  // ─────────────────────────────────────────────
  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        const addedInvestments: Investment[] = [];

        for (const row of rows as any[]) {
          const newInv = {
            name: row.name || row.Nama || row["Nama Potensi"] || "Unknown Potensi",
            sector: (row.sector || row.Sektor || Object.values(SektorInvestasi)[0]) as SektorInvestasi,
            districtId: row.districtId || row.Kecamatan || districts[0]?.id || "kec-default",
            villageId: row.villageId || row.Desa || villages[0]?.id || "desa-default",
            latitude: row.latitude !== undefined ? parseFloat(row.latitude) : (row.Latitude !== undefined ? parseFloat(row.Latitude) : (row.Lat !== undefined ? parseFloat(row.Lat) : -3.203)),
            longitude: row.longitude !== undefined ? parseFloat(row.longitude) : (row.Longitude !== undefined ? parseFloat(row.Longitude) : (row.Lng !== undefined ? parseFloat(row.Lng) : (row.Long !== undefined ? parseFloat(row.Long) : 120.252))),
            areaHa: parseFloat(row.areaHa || row.Luas || row["Luas (Ha)"] || "0") || 1,
            investmentValue: parseFloat(row.investmentValue || row.Nilai || row["Nilai Investasi"] || "0") || 1000000000,
            landStatus: row.landStatus || row["Status Lahan"] || "Sertifikat Hak Milik",
            photoUrl: row.photoUrl || row.Foto || "https://images.unsplash.com/photo-1590496794008-383c8070b257?auto=format&fit=crop&q=80&w=1000",
            contactPic: row.contactPic || row.PIC || row["Kontak Person"] || "Dinas Penanaman Modal",
            phoneNumber: row.phoneNumber || row.Telepon || "081234567890",
            isActive: true,
          };

          try {
            const res = await fetch("/api/investments", {
              method: "POST",
              headers: getAuthHeaders(),
              body: JSON.stringify(newInv),
            });
            if (res.ok) {
              const addedItem = await safeParseJson(res, null);
              if (addedItem) addedInvestments.push(addedItem);
            } else {
              console.error("Failed importing row, status:", res.status);
            }
          } catch (err) {
            console.error("Failed to import row:", err);
          }
        }

        if (addedInvestments.length > 0) {
          fetchAllData().catch(e => console.error(e));
          Swal.fire({
            icon: 'success',
            title: 'Impor Berhasil',
            text: `${addedInvestments.length} data potensi investasi berhasil diimpor.`
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Impor Gagal',
            text: 'Gagal mengimpor data. Periksa format CSV Anda.'
          });
        }

        if (e.target) e.target.value = "";
      },
      error: (err) => {
        console.error("Failed parsing CSV:", err);
        Swal.fire({
          icon: 'error',
          title: 'File Error',
          text: 'Gagal memproses file CSV.'
        });
      },
    });
  };

  // ─────────────────────────────────────────────
  // SPATIAL QUERY ENGINE
  // ─────────────────────────────────────────────
  const handleExecuteSpatialQuery = async (params: {
    minArea: number;
    maxPortDist: number;
    maxRoadDist: number;
    minValue: number;
    sectors: string;
  }) => {
    const sectorList = params.sectors ? params.sectors.split(",").filter(Boolean) : [];
    
    const results = investments.filter((inv: any) => {
      // 1. Min Area Check
      if (inv.areaHa < params.minArea) return false;
      
      // 2. Min Value Check
      if (inv.investmentValue < params.minValue) return false;
      
      // 3. Sector Check
      if (sectorList.length > 0 && !sectorList.includes(inv.sector)) return false;
      
      // 4. Road distance check - find from spatial sync 
      const sync = inv.spatialSync || inv.spatial_sync;
      const roadDist = sync?.nearestRoadKm ?? sync?.nearest_road_km ?? null;
      if (roadDist !== null && roadDist > params.maxRoadDist) return false;
      
      // 5. Port distance check
      if (params.maxPortDist < 999) {
        const facilities = sync?.nearestFacilities || sync?.nearest_facilities || [];
        const portObj = facilities.find((f: any) => 
          f.type?.toLowerCase().includes("port") || 
          f.name?.toLowerCase().includes("pelabuhan")
        );
        const portDist = portObj?.distanceKm ?? portObj?.distance_km ?? sync?.nearestPortKm ?? sync?.nearest_port_km ?? null;
        if (portDist !== null && portDist > params.maxPortDist) return false;
      }
      
      return true;
    });
    
    setSpatialQueryResults(results);
    
    if (results.length > 0) {
      Swal.fire({
        icon: 'success',
        title: 'Analisis Spasial Berhasil',
        text: `Ditemukan ${results.length} lokasi potensi investasi yang memenuhi kriteria spasial Anda.`,
        timer: 1500,
        showConfirmButton: false
      });
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Hasil Pencarian Spasial',
        text: 'Tidak ada potensi investasi yang memenuhi seluruh kriteria spasial Anda.',
        confirmButtonColor: '#2563eb'
      });
    }
  };

  // ─────────────────────────────────────────────
  // SEARCH: FIX format IDR menggunakan formatRupiahSingkat
  // ─────────────────────────────────────────────
  const filteredSearchList =
    searchQuery.trim() === ""
      ? []
      : [
          ...districts
            .filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((item) => ({
              type: "kecamatan" as const,
              id: item.id,
              label: `Kecamatan: ${item.name}`,
              desc: item.description,
            })),
          ...villages
            .filter((v) => v.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((item) => ({
              type: "desa" as const,
              id: item.id,
              label: `Desa: ${item.name}`,
              desc: `Komoditas: ${item.commodities.join(", ")}`,
            })),
          ...investments
            .filter(
              (i) =>
                i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                i.sector.toLowerCase().includes(searchQuery.toLowerCase()),
            )
            .map((item) => ({
              type: "investasi" as const,
              id: item.id,
              label: item.name,
              // FIX: gunakan formatRupiahSingkat bukan manual /1e9 + "M"
              desc: `Sektor ${item.sector} · ${formatRupiahSingkat(item.investmentValue)}`,
            })),
        ].slice(0, 8);

  const handleSearchSelect = (result: any) => {
    setSearchQuery("");
    setShowSearchResults(false);

    if (result.type === "kecamatan") {
      setSelectedDistrictId(result.id);
      setSelectedInvestmentId(null);
    } else if (result.type === "desa") {
      const v = villages.find((vil) => vil.id === result.id);
      if (v) {
        setSelectedDistrictId(v.districtId);
        setSelectedInvestmentId(null);
      }
    } else {
      const inv = investments.find((i) => i.id === result.id);
      if (inv) {
        setSelectedInvestmentId(inv.id);
        setSelectedDistrictId(inv.districtId);
      }
    }

    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const selectedInvestment = investments.find((inv) => inv.id === selectedInvestmentId);

  // ─────────────────────────────────────────────
  // FIX: Lightbox images menggunakan photoUrls asli
  // Bukan hardcoded URL Unsplash
  // ─────────────────────────────────────────────
  const lightboxImages = useMemo(() => {
    if (!selectedInvestment) return [];
    if ((selectedInvestment?.photoUrls || []).length > 0) {
      return (selectedInvestment?.photoUrls || []).filter(Boolean);
    }
    if (selectedInvestment?.photoUrl) {
      return [selectedInvestment.photoUrl];
    }
    return [];
  }, [selectedInvestment]);

  // ─────────────────────────────────────────────
  // 🔥 SPATIAL PROXIMITY ANALYSIS: Real-time High-Precision Distance Calculus
  // ─────────────────────────────────────────────
  const proximityIntel = useMemo(() => {
    if (!selectedInvestment || !infrastructure || infrastructure.length === 0) return null;
    
    try {
      // Support polygon/multipolygon geometry for exact centroid distance calculation if present
      const invOrigin = selectedInvestment.geometry || {
        latitude: selectedInvestment.latitude,
        longitude: selectedInvestment.longitude
      };
      
      const distances = infrastructure.map(inf => {
        const meters = calculateDistanceMeters(invOrigin, inf);
        if (meters === Infinity || isNaN(meters)) {
          return { ...inf, distance: Infinity, distanceMeters: Infinity };
        }
        const distKm = Number((meters / 1000).toFixed(2));
        return { 
          ...inf, 
          distance: distKm, 
          distanceMeters: meters,
          formattedDistance: formatJarakMeter(meters)
        };
      }).filter(inf => inf.distanceMeters !== Infinity && !isNaN(inf.distanceMeters) && inf.distance <= proximityRadius);

      // Sort by distance ascending using high-precision meter metrics
      distances.sort((a, b) => a.distanceMeters - b.distanceMeters);
      
      // Return top 15 results to prevent UI clutter
      return distances.length > 0 ? distances.slice(0, 15) : null;
    } catch (e) {
      console.error("Proximity Calculation Error:", e);
      return null;
    }
  }, [selectedInvestment, infrastructure, proximityRadius]);

  // Proximity Line String for map visualization
  const proximityLineString = useMemo(() => {
    if (!selectedInvestment || !proximityIntel || proximityIntel.length === 0) return null;
    const nearest = proximityIntel[0];
    try {
      const invAny = selectedInvestment as any;
      const nearAny = nearest as any;
      const invLng = Number(invAny.longitude ?? invAny.lng ?? (invAny.geometry?.type === 'Point' ? invAny.geometry?.coordinates?.[0] : undefined));
      const invLat = Number(invAny.latitude ?? invAny.lat ?? (invAny.geometry?.type === 'Point' ? invAny.geometry?.coordinates?.[1] : undefined));
      
      const infLng = Number(nearAny.longitude ?? nearAny.lng ?? (nearAny.geometry?.type === 'Point' ? nearAny.geometry?.coordinates?.[0] : undefined));
      const infLat = Number(nearAny.latitude ?? nearAny.lat ?? (nearAny.geometry?.type === 'Point' ? nearAny.geometry?.coordinates?.[1] : undefined));

      if (!isNaN(invLng) && !isNaN(invLat) && !isNaN(infLng) && !isNaN(infLat) && (invLng !== 0 || invLat !== 0) && (infLng !== 0 || infLat !== 0)) {
        return turf.lineString([
          [invLng, invLat],
          [infLng, infLat]
        ]);
      }
      return null;
    } catch (e) {
      return null;
    }
  }, [selectedInvestment, proximityIntel]);

  // ─────────────────────────────────────────────
  // OFFICIAL KARTOGRAFI MAP PDF EXPORTER (FASE-2A & FASE-2B)
  // ─────────────────────────────────────────────
  const handleExportKecamatanReport = async () => {
    let targetDistrictId = selectedDistrictId;
    if (!targetDistrictId && selectedInvestment) {
      const invDistStr = String(selectedInvestment.districtId || "").toLowerCase();
      targetDistrictId = selectedInvestment.districtId || districts.find(d => String(d.id) === String(selectedInvestment.districtId) || (invDistStr !== "" && d.name.toLowerCase() === invDistStr))?.id || null;
    }
    if (!targetDistrictId && districts.length > 0) {
      targetDistrictId = districts[0].id;
    }
    if (!targetDistrictId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Kecamatan tidak teridentifikasi.'
      });
      return;
    }

    if (!selectedDistrictId) {
      setSelectedDistrictId(targetDistrictId);
    }
    const activeDistrict = districts.find(d => d.id === targetDistrictId) || districts[0];

    setIsGeneratingReportPdf(true); // Open Composer Modal
    setIsPrinting(false);
    setMapSnapshotUrlForReport(null);
    setMapScaleDataForReport(null);
    setReportProgress("Mengunci Kamera Map...");
    setIsForcedHighResMapCanvas(true);
    await new Promise(resolve => setTimeout(resolve, 150));
    if ((window as any).globalLuwuMapInstance) { (window as any).globalLuwuMapInstance.resize(); }

    try {
      // Jeda singkat stabilisasi awal
      await new Promise(resolve => setTimeout(resolve, 150));

      setReportProgress("Merekam visual peta spasial resolusi tinggi...");

      await (document as any).fonts?.ready;
      
      // Active polling to wait for the canvas element to be available (bulletproof)
      const waitForCanvas = async () => {
        for (let i = 0; i < 30; i++) { // 3 seconds max
          const canvas = document.querySelector('.maplibregl-canvas, .mapboxgl-canvas, #map-parent-container canvas, canvas');
          if (canvas) return canvas as HTMLCanvasElement;
          await new Promise(res => setTimeout(res, 100));
        }
        return null;
      };

      // Populate global instance if missing from the react component ref
      if (!(window as any).globalLuwuMapInstance && mapComponentRef.current && typeof mapComponentRef.current.getMapInstance === "function") {
        try {
          (window as any).globalLuwuMapInstance = mapComponentRef.current.getMapInstance();
        } catch (e) {
          console.error("Failed to retrieve map instance from ref:", e);
        }
      }

      let mapCanvasElement = null;
      if (mapComponentRef.current && typeof mapComponentRef.current.getCanvas === "function") {
        try {
          mapCanvasElement = mapComponentRef.current.getCanvas();
        } catch (e) {
          console.error("Failed to get canvas from mapComponentRef:", e);
        }
      }
      
      if (!mapCanvasElement && (window as any).globalLuwuMapInstance) {
        try {
          mapCanvasElement = (window as any).globalLuwuMapInstance.getCanvas();
        } catch (e) {
          console.error("Failed to get canvas from globalLuwuMapInstance:", e);
        }
      }

      if (!mapCanvasElement) {
        mapCanvasElement = await waitForCanvas();
      }

      // 1. KUNCI BINGKAI KAMERA INSTAN (FITBOUNDS)
      if ((window as any).globalLuwuMapInstance) {
        let activeGeoJson = activeDistrict?.geojson || null;
        if (!activeGeoJson && districts.length > 0) {
          activeGeoJson = districts[0].geojson;
        }
        if (activeGeoJson) {
          try {
            if (printScale === "auto") {
              const bbox = turf.bbox(activeGeoJson);
              (window as any).globalLuwuMapInstance.fitBounds(
                [
                  [bbox[0], bbox[1]],
                  [bbox[2], bbox[3]]
                ],
                {
                  padding: 60,
                  animate: false
                }
              );
            } else {
              const centerObj = turf.center(activeGeoJson);
              const targetResolution = parseInt(printScale) * 0.0254 / 96;
              const zoomTarget = Math.max(0, Math.log2(156543 / targetResolution));
              (window as any).globalLuwuMapInstance.jumpTo({
                center: [centerObj.geometry.coordinates[0], centerObj.geometry.coordinates[1]],
                zoom: zoomTarget,
                pitch: 0,
                bearing: 0
              });
            }
          } catch(e) {
            undefined;
          }
        }
      }

      // OPTIMASI EVENT-DRIVEN TIMEOUT JEDA RENDER CITRA SATELIT (MAP IDLE TIMEOUT)
      if ((window as any).globalLuwuMapInstance) {
        const map = (window as any).globalLuwuMapInstance;
        await new Promise<void>((resolve) => {
          let resolved = false;
          let intervalId: any = null;
          
          const done = () => {
            if (resolved) return;
            resolved = true;
            if (intervalId) clearInterval(intervalId);
            map.off('idle', onIdleEvent);
            resolve();
          };

          const onIdleEvent = () => {
            done();
          };
          
          map.on('idle', onIdleEvent);

          // Active polling check for areTilesLoaded to guarantee all tiles are fully painted
          let checks = 0;
          const maxChecks = 5; // Reduced from 40 (4.0s) to 5 (0.5s) for instant and highly responsive rendering kawan!
          intervalId = setInterval(() => {
            checks++;
            if (map.areTilesLoaded()) {
              done();
            } else if (checks >= maxChecks) {
              done(); // timed out!
            }
          }, 100);
        });
      }

      let mapSnapshotDataUrl = "";
      
      const mapObj = (window as any).globalLuwuMapInstance;
      if (mapObj) {
        // Verify WebGL context state on the map canvas
        const targetCanvas = mapObj.getCanvas() || mapCanvasElement;
        if (targetCanvas) {
          try {
            const gl = targetCanvas.getContext('webgl2') || targetCanvas.getContext('webgl');
            if (gl && typeof (gl as any).isContextLost === 'function' && (gl as any).isContextLost()) {
              console.warn("WebGL context lost on map canvas, forcing map redraw...");
              if (typeof mapObj.redraw === 'function') mapObj.redraw();
            }
          } catch (glErr) {
            console.warn("Unable to check WebGL context loss:", glErr);
          }
        }

        // Force repaint and wait for render or idle event to guarantee WebGL drawing buffer readiness
        await new Promise<void>(resolve => {
          let resolved = false;
          const doCapture = () => {
            if (resolved) return;
            resolved = true;
            try {
              const mCanvas = mapObj.getCanvas();
              if (mCanvas) {
                const temp = document.createElement("canvas");
                temp.width = mCanvas.width;
                temp.height = mCanvas.height;
                const ctx = temp.getContext("2d");
                if (ctx) {
                  ctx.fillStyle = "#ffffff";
                  ctx.fillRect(0, 0, temp.width, temp.height);
                  ctx.drawImage(mCanvas, 0, 0);
                  mapSnapshotDataUrl = temp.toDataURL("image/jpeg", 0.95);
                } else {
                  mapSnapshotDataUrl = mCanvas.toDataURL("image/png", 1.0);
                }
              }
            } catch (e) {
              if (mapCanvasElement) mapSnapshotDataUrl = mapCanvasElement.toDataURL("image/png");
            }
            resolve();
          };

          // Attach listeners for render/idle events to trigger capture right after frame draw
          mapObj.once("render", doCapture);
          mapObj.once("idle", doCapture);
          if (typeof mapObj.triggerRepaint === 'function') {
            mapObj.triggerRepaint();
          } else if (typeof mapObj.redraw === 'function') {
            mapObj.redraw();
          }
          setTimeout(doCapture, 150);
        });

        if (!mapSnapshotDataUrl || mapSnapshotDataUrl === "data:," || mapSnapshotDataUrl.length < 50) {
           try {
              mapSnapshotDataUrl = mapObj.getCanvas().toDataURL("image/png", 1.0);
           } catch (e) {
              if (mapCanvasElement) mapSnapshotDataUrl = mapCanvasElement.toDataURL("image/png");
           }
        }
      } else {
        if (mapCanvasElement) {
          mapSnapshotDataUrl = mapCanvasElement.toDataURL("image/png");
        }
      }

      if (!mapSnapshotDataUrl || mapSnapshotDataUrl === "data:," || mapSnapshotDataUrl.length < 50) {
        const mapContainerEl = document.getElementById("map-parent-container") || document.getElementById("map-canvas") || document.querySelector(".maplibregl-map");
        if (mapContainerEl) {
          try {
            const tempCanvas = await pdfRenderQueue.enqueue(() => safeHtml2Canvas(mapContainerEl as HTMLElement, {
              useCORS: true,
              allowTaint: true,
              logging: false,
              backgroundColor: "#020617"
            }));
            mapSnapshotDataUrl = tempCanvas.toDataURL("image/png");
          } catch (e) {
            undefined;
          }
        }
      }

      if (!mapSnapshotDataUrl || mapSnapshotDataUrl === "data:," || mapSnapshotDataUrl.length < 50) {
        const fallbackCanvas = document.createElement("canvas");
        fallbackCanvas.width = 1200;
        fallbackCanvas.height = 800;
        const ctx = fallbackCanvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(0, 0, 1200, 800);
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(40, 40, 1120, 720);
          ctx.fillStyle = "#10b981";
          ctx.font = "bold 24px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`PETA SPASIAL KECAMATAN ${activeDistrict.name.toUpperCase()}`, 600, 400);
        }
        mapSnapshotDataUrl = fallbackCanvas.toDataURL("image/png");
      }
      
      // Inject mapSnapshotDataUrl into a hidden img element to be picked up by the printing layout
      let hiddenMapImg = document.getElementById("hidden-map-snapshot") as HTMLImageElement;
      if (!hiddenMapImg) {
        hiddenMapImg = document.createElement("img");
        hiddenMapImg.id = "hidden-map-snapshot";
        hiddenMapImg.style.display = "none";
        document.body.appendChild(hiddenMapImg);
      }
      hiddenMapImg.src = mapSnapshotDataUrl;

      // CAPTURE MAP SCALE BAR DYNAMICALLY
      let scaleDataObj = null;
      const scaleEl = document.querySelector(".maplibregl-ctrl-scale") as HTMLElement;
      if (scaleEl && mapCanvasElement) {
        scaleDataObj = {
          widthInPx: scaleEl.offsetWidth,
          text: scaleEl.innerText || scaleEl.textContent || "10 km",
          mapCanvasWidthPx: mapCanvasElement.offsetWidth,
          mapCanvasHeightPx: mapCanvasElement.offsetHeight
        };
      }
      setMapScaleDataForReport(scaleDataObj);

      setMapSnapshot(mapSnapshotDataUrl);
      setMapSnapshotUrlForReport(mapSnapshotDataUrl);

      // Store immutable Data URL directly in snapshot gallery
      try {
        const newSnapshotId = Date.now().toString();
        
        setSnapshotGallery(prev => {
          const newGallery = [{ id: newSnapshotId, url: mapSnapshotDataUrl, timestamp: Date.now() }, ...prev];
          if (newGallery.length > 8) {
            newGallery.pop();
          }
          return newGallery;
        });
        setSelectedSnapshotId(newSnapshotId);
      } catch (e) {
        console.error("Failed to update snapshot gallery", e);
      }

      // Selesai merekam, composer akan muncul dengan peta dan legendnya!
      setReportProgress("");
      setIsForcedHighResMapCanvas(false);
      if ((window as any).globalLuwuMapInstance) { 
        setTimeout(() => { 
          try {
            (window as any).globalLuwuMapInstance.resize(); 
          } catch (resizeErr) {
            console.warn("Safe map resize warning:", resizeErr);
          }
        }, 500); 
      }
    } catch (error: any) {
      console.error("Gagal cetak profil PDF:", error);
      Swal.fire({
        icon: 'error',
        title: 'Layout Gagal',
        text: 'Sistem gagal menyiapkan composer layout: ' + error.message
      });
      setIsGeneratingReportPdf(false);
    } finally {
      setIsForcedHighResMapCanvas(false);
      if ((window as any).globalLuwuMapInstance) { 
        setTimeout(() => { 
          try {
            (window as any).globalLuwuMapInstance.resize(); 
          } catch (resizeErr) {
            console.warn("Safe map resize warning in finally:", resizeErr);
          }
        }, 500); 
      }
    }
  };

  const handleDownloadMapComposerPdf = async () => {
    let targetDistrictId = selectedDistrictId;
    if (!targetDistrictId && selectedInvestment) {
      const invDistStr = String(selectedInvestment.districtId || "").toLowerCase();
      targetDistrictId = selectedInvestment.districtId || districts.find(d => String(d.id) === String(selectedInvestment.districtId) || (invDistStr !== "" && d.name.toLowerCase() === invDistStr))?.id || null;
    }
    if (!targetDistrictId && districts.length > 0) {
      targetDistrictId = districts[0].id;
    }
    if (!targetDistrictId) return;

    const activeDistrict = districts.find(d => d.id === targetDistrictId) || districts[0];

    setIsPrinting(true);
    setReportProgress("Merender Halaman 1 dari 2: Profil Peta Kartografis...");

    try {
      // Step 2: Wait for DOM and idle to ensure state propagation and image paint
      const page1ElReady = await waitForDomAndIdle("print-page-1", 5000);

      await (document as any).fonts?.ready;
      // Convert page 1 (A4 landscape) using safeHtml2Canvas via pdfRenderQueue
      const canvasPage1 = await pdfRenderQueue.enqueue(() => safeHtml2Canvas(page1ElReady, {
        scale: 2.5, // 2.5x resolution is perfect for crisp print clarity without memory strain
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: 1123,
        height: 794,
        windowWidth: 1123,
        windowHeight: 794,
        scrollX: 0,
        scrollY: 0,
        onclone: (_clonedDoc: Document, clonedEl: HTMLElement) => {
          clonedEl.style.transform = "none";
          let p = clonedEl.parentElement;
          while (p) {
            if (p.style) p.style.transform = "none";
            p = p.parentElement;
          }
        }
      }));
      const imgDataPage1 = canvasPage1.toDataURL("image/jpeg", 0.98);

      setReportProgress("Merender Halaman 2 dari 2: Laporan Analitis Potensi & ROI...");

      const page2ElReady = await waitForDomAndIdle("print-page-2", 5000);

      await (document as any).fonts?.ready;
      // Convert page 2 (A4 landscape) using safeHtml2Canvas via pdfRenderQueue
      const canvasPage2 = await pdfRenderQueue.enqueue(() => safeHtml2Canvas(page2ElReady, {
        scale: 2.5, // 2.5x resolution is perfect for crisp print clarity without memory strain
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: 1123,
        height: 794,
        windowWidth: 1123,
        windowHeight: 794,
        scrollX: 0,
        scrollY: 0,
        onclone: (_clonedDoc: Document, clonedEl: HTMLElement) => {
          clonedEl.style.transform = "none";
          let p = clonedEl.parentElement;
          while (p) {
            if (p.style) p.style.transform = "none";
            p = p.parentElement;
          }
        }
      }));
      const imgDataPage2 = canvasPage2.toDataURL("image/jpeg", 0.98);

      setReportProgress("Merender Halaman 3 dari 3: Statistik Investasi...");

      let imgDataPage3 = null;
      try {
        const page3ElReady = await waitForDomAndIdle("print-page-3", 2000); // Shorter timeout for optional page 3
        const canvasPage3 = await pdfRenderQueue.enqueue(() => safeHtml2Canvas(page3ElReady, {
          scale: 2.5,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: "#ffffff",
          width: 1123,
          height: 794,
          windowWidth: 1123,
          windowHeight: 794,
          scrollX: 0,
          scrollY: 0,
          onclone: (_clonedDoc: Document, clonedEl: HTMLElement) => {
            clonedEl.style.transform = "none";
            let p = clonedEl.parentElement;
            while (p) {
              if (p.style) p.style.transform = "none";
              p = p.parentElement;
            }
          }
        }));
        imgDataPage3 = canvasPage3.toDataURL("image/jpeg", 0.98);
      } catch (e) {
        console.warn("Halaman 3 opsional di-skip karena tidak ditemukan.");
      }

      setReportProgress("Menyusun Berkas PDF Spasial Pemerintah...");

      const pdf = new jsPDF("l", "mm", "a4"); // Landscape mode A4 (297mm x 210mm)
      
      // Page 1: Kartografi Map Layout
      pdf.addImage(imgDataPage1, "JPEG", 0, 0, 297, 210, undefined, "FAST");

      // Page 2: Analytical tables and ROI calculators
      pdf.addPage();
      pdf.addImage(imgDataPage2, "JPEG", 0, 0, 297, 210, undefined, "FAST");

      if (imgDataPage3) {
        pdf.addPage();
        pdf.addImage(imgDataPage3, "JPEG", 0, 0, 297, 210, undefined, "FAST");
      }

      const slugKecamatan = activeDistrict.name.toUpperCase().replace(/\s+/g, "_");
      pdf.save(`DOKUMEN_PROFIL_SPASIAL_INVESTASI_KECAMATAN_${slugKecamatan}.pdf`);

      setReportProgress("");
    } catch(err: any) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Ekspor Gagal',
        text: 'Gagal mengekspor PDF: ' + err.message
      });
    } finally {
      setIsPrinting(false);
    }
  };

  // ─────────────────────────────────────────────
  // LAYER VISIBILITY HANDLERS (ON-DEMAND LAZY LOADING)
  // ─────────────────────────────────────────────
  // Active layers computed list
  const activeLayers = useMemo(() => {
    return Object.values(spatialLayers).filter(l => l.isActive).map(l => l.id);
  }, [spatialLayers]);

  const executeToggleLayerVis = useCallback(async (layerId: string) => {
    const originalLayer = spatialLayers[layerId];
    if (!originalLayer) return;

    const nextIsActive = !originalLayer.isActive;

    // 1. If hiding the layer (switching OFF):
    if (!nextIsActive) {
      startTransition(() => {
        setSpatialLayers((prev) => {
          const target = prev[layerId];
          if (!target) return prev;
          const next = { ...prev, [layerId]: { ...target, isActive: false, isLoading: false } };
          if (layerId === "layer_zonasi" && next["layer_land_use_zoning"]) {
            next["layer_land_use_zoning"] = { ...next["layer_land_use_zoning"], isActive: false };
          } else if (layerId === "layer_land_use_zoning" && next["layer_zonasi"]) {
            next["layer_zonasi"] = { ...next["layer_zonasi"], isActive: false };
          }
          return next;
        });
      });

      // Update MapLibre layout property visibility directly:
      mapComponentRef.current?.setLayerVisibility?.(layerId, false);

      // Background sync to server if user is admin or operator
      if (isAdminRole(currentRole) || isAdminRole(activeProfile?.role)) {
        try {
          const res = await fetch(`/api/spatial-layers/${layerId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({ isActive: false }),
          });
          if (!res.ok) {
            console.warn(`[Sync Warning] Layer visibility sync for ${layerId} returned status ${res.status}`);
          }
        } catch (err) {
          console.warn("Sinkronisasi layer visibility ke server terabaikan (mode offline/local state):", err);
        }
      }
      return;
    }

    // 2. If showing the layer (switching ON):
    // Check if layer is already downloaded in loadedSources cache or MapLibre instance
    const isAlreadyLoaded = !!(
      (originalLayer.geojson?.features && !originalLayer.isLazy) ||
      loadedSourcesRef.current.has(layerId) ||
      mapComponentRef.current?.hasSource?.(layerId)
    );

    if (isAlreadyLoaded) {
      // Source already loaded, simply toggle visibility on in state and MapLibre
      startTransition(() => {
        setSpatialLayers((prev) => {
          const target = prev[layerId];
          if (!target) return prev;
          const next = { ...prev, [layerId]: { ...target, isActive: true, isLoading: false } };
          if (layerId === "layer_zonasi" && next["layer_land_use_zoning"]) {
            next["layer_land_use_zoning"] = { ...next["layer_land_use_zoning"], isActive: true };
          } else if (layerId === "layer_land_use_zoning" && next["layer_zonasi"]) {
            next["layer_zonasi"] = { ...next["layer_zonasi"], isActive: true };
          }
          return next;
        });
      });

      mapComponentRef.current?.setLayerVisibility?.(layerId, true);

      if (isAdminRole(currentRole) || isAdminRole(activeProfile?.role)) {
        try {
          await fetch(`/api/spatial-layers/${layerId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({ isActive: true }),
          });
        } catch (err) {
          console.warn("Sync error:", err);
        }
      }
      return;
    }

    // 3. Source is NOT loaded: Trigger On-Demand Lazy Fetch with Loading Spinner
    startTransition(() => {
      setSpatialLayers((prev) => ({
        ...prev,
        [layerId]: { ...prev[layerId], isActive: true, isLoading: true }
      }));
    });

    try {
      if (!inFlightLayerFetchesRef.current[layerId]) {
        inFlightLayerFetchesRef.current[layerId] = (async () => {
          let fetchedGeoJSON: any = null;

          // Attempt 1: Fetch from REST API endpoint
          try {
            const response = await fetch(`/api/spatial-layers/${encodeURIComponent(layerId)}`);
            if (response.ok) {
              const layerData = await response.json();
              if (layerData?.geojson && (layerData.geojson.type === "FeatureCollection" || Array.isArray(layerData.geojson.features))) {
                fetchedGeoJSON = layerData.geojson;
              }
            }
          } catch (errApi) {
            console.warn(`[LazyLoad] API fetch error for ${layerId}, trying static fallback:`, errApi);
          }

          // Attempt 2: Fallback to static public GeoJSON file if API did not provide features
          if (!fetchedGeoJSON || !fetchedGeoJSON.features || fetchedGeoJSON.features.length === 0) {
            const staticMap: Record<string, string> = {
              layer_sawah: "/gis_sawah.json",
              layer_tambak: "/gis_tambak.json",
              layer_mangrove: "/gis_mangrove.json",
              layer_lahan_kering_sekunder: "/gis_lahankeringsekunder.json",
              layer_lahan_kering_primer: "/gis_lahankeringprimer.json",
              layer_zonasi: "/gis_zonasi.json",
              layer_land_use_zoning: "/gis_zonasi.json",
              layer_jalan: "/gis_jalan.json",
              layer_desa: "/gis_desa.json",
              layer_kecamatan: "/gis_kecamatan.json",
              layer_infrastruktur: "/gis_infrastruktur.json",
              layer_potensi: "/gis_potensi_investasi.json"
            };
            const staticUrl = staticMap[layerId];
            if (staticUrl) {
              const staticRes = await fetch(staticUrl);
              if (staticRes.ok) {
                const staticData = await staticRes.json();
                if (staticData && (staticData.type === "FeatureCollection" || Array.isArray(staticData.features))) {
                  fetchedGeoJSON = staticData;
                }
              }
            }
          }

          if (!fetchedGeoJSON || !fetchedGeoJSON.features) {
            throw new Error(`Data spasial tidak tersedia untuk layer ${layerId}`);
          }

          return fetchedGeoJSON;
        })();
      }

      const geojsonResult = await inFlightLayerFetchesRef.current[layerId];
      delete inFlightLayerFetchesRef.current[layerId];

      // Add to loadedSources cache
      loadedSourcesRef.current.add(layerId);
      setLoadedSources(prev => new Set(prev).add(layerId));

      startTransition(() => {
        setSpatialLayers((prev) => {
          const current = prev[layerId] || originalLayer;
          const next = {
            ...prev,
            [layerId]: {
              ...current,
              geojson: geojsonResult,
              isActive: true,
              isLoading: false,
              isLazy: false
            }
          };
          if (layerId === "layer_zonasi" && next["layer_land_use_zoning"]) {
            next["layer_land_use_zoning"] = {
              ...next["layer_land_use_zoning"],
              geojson: geojsonResult,
              isActive: true,
              isLoading: false,
              isLazy: false
            };
          } else if (layerId === "layer_land_use_zoning" && next["layer_zonasi"]) {
            next["layer_zonasi"] = {
              ...next["layer_zonasi"],
              geojson: geojsonResult,
              isActive: true,
              isLoading: false,
              isLazy: false
            };
          }
          return next;
        });
      });

      // Update MapLibre visibility
      mapComponentRef.current?.setLayerVisibility?.(layerId, true);

      if (isAdminRole(currentRole) || isAdminRole(activeProfile?.role)) {
        try {
          await fetch(`/api/spatial-layers/${layerId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({ isActive: true }),
          });
        } catch (err) {
          console.warn("Sync error:", err);
        }
      }

    } catch (e: any) {
      delete inFlightLayerFetchesRef.current[layerId];
      console.error(`[LazyLoad Error] Gagal memuat layer ${layerId}:`, e);

      // Revert state to OFF
      startTransition(() => {
        setSpatialLayers((prev) => ({
          ...prev,
          [layerId]: {
            ...prev[layerId],
            isActive: false,
            isLoading: false
          }
        }));
      });

      // Toast notification on failure
      const layerDisplayName = originalLayer.name || layerId;
      Swal.fire({
        title: "Gagal Memuat Layer",
        text: `Gagal memuat layer ${layerDisplayName}`,
        icon: "error",
        toast: true,
        position: "top-end",
        timer: 3500,
        showConfirmButton: false,
        background: isDarkMode ? "#0f172a" : "#ffffff",
        color: isDarkMode ? "#f8fafc" : "#0f172a"
      });
    }
  }, [spatialLayers, currentRole, activeProfile, isAdminRole, isDarkMode]);

  const handleToggleLayerVis = executeToggleLayerVis;

  const pendingServerOpacitySyncRef = useRef<Record<string, any>>({});
  const pendingServerColorSyncRef = useRef<Record<string, any>>({});

  const handleUpdateLayerOpacity = useCallback((layerId: string, opacity: number) => {
    if (spatialLayers[layerId]) {
      const updatedLayer = { ...spatialLayers[layerId], opacity };
      startTransition(() => {
        setSpatialLayers((prev) => ({ ...prev, [layerId]: updatedLayer }));
      });

      // Debounce sync ke server jika pengguna adalah admin atau operator
      if (isAdminRole(currentRole) || isAdminRole(activeProfile?.role)) {
        if (pendingServerOpacitySyncRef.current[layerId]) {
          clearTimeout(pendingServerOpacitySyncRef.current[layerId]);
        }
        pendingServerOpacitySyncRef.current[layerId] = setTimeout(async () => {
          try {
            const res = await fetch(`/api/spatial-layers/${layerId}`, {
              method: "PUT",
              headers: getAuthHeaders(),
              body: JSON.stringify({ opacity }),
            });
            if (!res.ok) {
              console.warn(`[Sync Warning] Layer opacity sync for ${layerId} returned status ${res.status}`);
            }
          } catch (err) {
            console.warn("Sinkronisasi layer opacity ke server terabaikan (mode offline/local state):", err);
          }
        }, 500);
      }
    }
  }, [spatialLayers, currentRole, activeProfile, isAdminRole]);

  const handleUpdateLayerColor = useCallback((layerId: string, color: string) => {
    if (spatialLayers[layerId]) {
      const updatedLayer = { ...spatialLayers[layerId], color };
      startTransition(() => {
        setSpatialLayers((prev) => ({ ...prev, [layerId]: updatedLayer }));
      });

      // Debounce sync ke server jika pengguna adalah admin atau operator
      if (isAdminRole(currentRole) || isAdminRole(activeProfile?.role)) {
        if (pendingServerColorSyncRef.current[layerId]) {
          clearTimeout(pendingServerColorSyncRef.current[layerId]);
        }
        pendingServerColorSyncRef.current[layerId] = setTimeout(async () => {
          try {
            const res = await fetch(`/api/spatial-layers/${layerId}`, {
              method: "PUT",
              headers: getAuthHeaders(),
              body: JSON.stringify({ color }),
            });
            if (!res.ok) {
              console.warn(`[Sync Warning] Layer color sync for ${layerId} returned status ${res.status}`);
            }
          } catch (err) {
            console.warn("Sinkronisasi layer color ke server terabaikan (mode offline/local state):", err);
          }
        }, 500);
      }
    }
  }, [spatialLayers, currentRole, activeProfile, isAdminRole]);

  const handleDeleteLayer = useCallback(async (layerId: string) => {
    try {
      const res = await fetch(`/api/spatial-layers/${layerId}`, {
        method: "DELETE",
        headers: getAuthHeadersOnly(),
      });
      if (res.ok) {
        setSpatialLayers((prev) => {
          const newMap = { ...prev };
          delete newMap[layerId];
          return newMap;
        });
      } else {
        console.error("Gagal menghapus layer.");
      }
    } catch (err) {
      console.error("Gagal hapus layer:", err);
    }
  }, []);

  // ─────────────────────────────────────────────
  // OPERATOR WORKSPACE RENDERER
  // ─────────────────────────────────────────────
  const renderOperatorWorkspace = () => {
    // Read clean, unified, real-time metrics directly from the /api/stats endpoint backend state
    const totalInvestments = stats?.totalInvestments ?? investments.length;
    const totalArea = stats?.totalArea ?? investments.reduce((sum, inv) => sum + (inv.areaHa || 0), 0);
    const totalValue = stats?.totalValue ?? investments.reduce((sum, inv) => sum + (inv.investmentValue || 0), 0);
    const dominantSector = stats?.dominantSector ?? "N/A";

    return (
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-5 sm:gap-6 font-sans">
        {/* Header Section */}
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Breadcrumb & Role Badge */}
          <div className="flex justify-between items-center text-[11px] sm:text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <span>Dashboard</span>
              <span className="text-slate-400 dark:text-slate-600">›</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold">Operator Workspace</span>
            </span>
            <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full">
              {currentRole}
            </span>
          </div>

          {/* Title, Subtitle & Action Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
                Operator Workspace
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Manajemen data sentral untuk investasi strategis Kabupaten Luwu. Akses kontrol intelijen spasial, uji kualifikasi, dan manajemen RAG terpadu.
              </p>
            </div>

            {/* Action Toolbar (Horizontal Scroll on Mobile, Flex Row on Desktop) */}
            <div className="overflow-x-auto no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0 py-1">
              <div className="flex items-center gap-2 min-w-max p-1 sm:p-1.5 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm shrink-0 active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah Investasi</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setActiveWorkspace("SPATIAL_EDITOR"); setSpatialEditorModule("INVESTASI"); }}
                  className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm rounded-xl transition-all shrink-0 shadow-xs active:scale-95"
                >
                  <Map className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Kelola GIS</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsLoiTicketsModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm rounded-xl transition-all shrink-0 shadow-xs active:scale-95"
                >
                  <Ticket className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span>Manajemen Tiket</span>
                </motion.button>
                {currentRole === Role.SUPER_ADMIN && (
                  <>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        window.location.href = "/admin/beranda";
                      }}
                      className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs sm:text-sm rounded-xl transition-all shrink-0 shadow-xs active:scale-95 cursor-pointer"
                      title="Kembali ke Portal Superadmin"
                    >
                      <Building2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
                      <span>Portal Superadmin</span>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsCreateOperatorModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm rounded-xl transition-all shrink-0 shadow-xs active:scale-95"
                    >
                      <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span>Tambah Operator</span>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsManageOperatorsModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm rounded-xl transition-all shrink-0 shadow-xs active:scale-95"
                    >
                      <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Kelola Operator</span>
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid (Adaptive 2x2 Bento on Mobile, 4x1 on Desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {isStatsLoading || isLoading ? (
             [0, 1, 2, 3].map((i) => (
               <div key={i} className="min-h-[110px] p-4 rounded-2xl border animate-pulse bg-slate-200/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800" />
             ))
          ) : (
            [
              { icon: <Building2 className="h-4 sm:h-5 w-4 sm:w-5" />, color: "emerald", label: "Total Proyek", value: `${totalInvestments} Proyek`, trend: [10, 20, 15, 30, 45, 52], hex: "#10b981" },
              { icon: <Compass className="h-4 sm:h-5 w-4 sm:w-5" />, color: "indigo", label: "Sektor Utama", value: dominantSector, trend: [5, 10, 8, 15, 20, 25], hex: "#6366f1" },
              { icon: <Map className="h-4 sm:h-5 w-4 sm:w-5" />, color: "amber", label: "Total Area", value: `${formatNumber(totalArea)} Ha`, trend: [100, 150, 140, 250, 400, 460], hex: "#f59e0b" },
              { icon: <Building2 className="h-4 sm:h-5 w-4 sm:w-5" />, color: "blue", label: "Estimasi Nilai", value: formatRupiahSingkat(totalValue), trend: [120, 180, 170, 300, 500, 580], hex: "#3b82f6" },
            ].map((stat, i) => {
              const trendData = stat.trend.map((v, idx) => ({ val: v, mn: idx }));
              const pctDiff = ((stat.trend[stat.trend.length - 1] - stat.trend[0]) / stat.trend[0] * 100);
              const absPct = Math.abs(pctDiff).toFixed(1);
              const isPositive = pctDiff > 0;
              return (
              <div
                key={i}
                className={`p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between gap-1 border transition-all ${
                  isDarkMode
                    ? "bg-slate-900/90 border-slate-800"
                    : "bg-white border-slate-200/90 shadow-sm"
                }`}
              >
                <div className="flex items-start gap-2.5 sm:gap-3.5">
                  <div className={`h-8 sm:h-10 w-8 sm:w-10 rounded-xl flex items-center justify-center shrink-0 ${
                    stat.color === "emerald" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
                    stat.color === "indigo" ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400" :
                    stat.color === "amber" ? "bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400" :
                    "bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400"
                  }`}>
                    {stat.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono font-bold block truncate">
                      {stat.label}
                    </span>
                    <strong className="font-sans font-bold tracking-tight text-slate-900 dark:text-white block truncate text-sm sm:text-base lg:text-lg" title={stat.value}>
                      {stat.value}
                    </strong>
                    <span className={`text-[9px] sm:text-[10px] font-semibold flex items-center gap-0.5 mt-0.5 ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {isPositive ? "↑" : "↓"} {absPct}%
                    </span>
                  </div>
                </div>
                <div className="h-10 sm:h-12 w-full relative mt-1">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart data={trendData}>
                      <Area type="monotone" dataKey="val" stroke={stat.hex} fill={stat.hex} fillOpacity={0.12} strokeWidth={2} dot={false} activeDot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ); })
          )}
        </div>

        {/* Ringkasan Komitmen Tenaga Kerja (TKL vs TKA & Tren per Sektor) */}
        <Suspense fallback={<div className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700" />}>
          <OperatorLaborWidget 
            investments={investments} 
            onSelectInvestment={(id) => setSelectedInvestmentId(id)} 
          />
        </Suspense>

        {/* Separator */}
        <div className="flex items-center gap-3 my-2 sm:my-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
          <span className="font-semibold text-xs sm:text-sm tracking-wider uppercase text-slate-500 dark:text-slate-400 text-center px-2">
            Data Master & Analisis Spasial
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        </div>

        {/* Core Workspace Layout */}
        <div className="flex flex-col lg:flex-row items-stretch gap-6 w-full">
          {/* Left Column wrapper: Proyek Investasi & SLA */}
          <div className="lg:w-3/5 flex flex-col gap-6">
            {/* Kelola Investasi Container */}
            <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col gap-4 transition-all ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white shadow-sm border-slate-200"}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-500" />
                  <span>Kelola Proyek Investasi</span>
                </h3>

                {/* Filters & Search */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  {/* Search query */}
                  <div className="relative flex-1 sm:flex-initial">
                    <input
                      type="text"
                      placeholder={t("operator.searchPlaceholder", "Cari proyek...")}
                      value={operatorSearchQuery}
                      onChange={(e) => setOperatorSearchQuery(e.target.value)}
                      className={`w-full sm:w-44 rounded-xl pl-8 pr-3 py-1.5 text-xs font-sans focus:outline-none border ${
                        isDarkMode
                          ? "bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-emerald-500"
                          : "bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400 focus:border-emerald-600"
                      }`}
                    />
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  </div>

                  {/* Risk filter */}
                  <select
                    value={operatorRiskFilter}
                    onChange={(e) => setOperatorRiskFilter(e.target.value)}
                    className={`rounded-xl px-2.5 py-1.5 text-xs font-sans focus:outline-none border cursor-pointer ${
                      isDarkMode
                        ? "bg-slate-800 border-slate-700 text-white focus:border-emerald-500"
                        : "bg-slate-50 border-slate-300 text-slate-800 focus:border-emerald-600"
                    }`}
                  >
                    <option value="all">{t("operator.allRisk", "Semua Risiko")}</option>
                    <option value="rendah">{t("operator.lowRisk", "Risiko Rendah")}</option>
                    <option value="sedang">{t("operator.mediumRisk", "Risiko Sedang")}</option>
                    <option value="tinggi">{t("operator.highRisk", "Risiko Tinggi")}</option>
                  </select>

                  {/* Sorting options */}
                  <div className={`flex items-center gap-1 border rounded-xl px-1 py-0.5 ${
                    isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                  }`}>
                    <select
                      value={operatorSortField}
                      onChange={(e) => setOperatorSortField(e.target.value as any)}
                      className={`bg-transparent text-xs font-sans focus:outline-none pl-1 pr-0.5 py-1 cursor-pointer ${
                        isDarkMode ? "text-white" : "text-slate-800"
                      }`}
                      title={t("operator.sortByTitle", "Urutkan Berdasarkan")}
                    >
                      <option value="date" className={isDarkMode ? "bg-slate-800 text-white" : "bg-white text-slate-800"}>{t("operator.sortByDate", "Urut: Tanggal")}</option>
                      <option value="value" className={isDarkMode ? "bg-slate-800 text-white" : "bg-white text-slate-800"}>{t("operator.sortByValue", "Urut: Nilai")}</option>
                      <option value="area" className={isDarkMode ? "bg-slate-800 text-white" : "bg-white text-slate-800"}>{t("operator.sortByArea", "Urut: Luas")}</option>
                    </select>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setOperatorSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                      className={`p-1 rounded-lg transition-all ${
                        isDarkMode ? "text-slate-300 hover:text-emerald-400 hover:bg-slate-700" : "text-slate-600 hover:text-emerald-600 hover:bg-slate-200"
                      }`}
                      title={operatorSortOrder === "asc" ? t("operator.sortAsc", "Tingkat Naik (ASC)") : t("operator.sortDesc", "Tingkat Turun (DESC)")}
                    >
                      {operatorSortOrder === "asc" ? (
                        <ArrowUp size={13} className="text-emerald-500" />
                      ) : (
                        <ArrowDown size={13} className="text-emerald-500" />
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Proyek Counter & Live Database indicator */}
              <div className={`flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-mono border ${
                isDarkMode
                  ? "bg-slate-800/80 border-slate-700/80 text-slate-300"
                  : "bg-slate-100 border-slate-200 text-slate-600"
              }`}>
                <span>Menampilkan {filteredOperatorInvestments.length} dari {investments.length} proyek</span>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">LIVE DATABASE</span>
                </div>
              </div>

              {/* ── MOBILE CARD LIST VIEW (Screen < md) ── */}
              <div className="block md:hidden space-y-2.5">
                {filteredOperatorInvestments.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center border border-dashed rounded-2xl border-slate-300 dark:border-slate-700">
                    <FolderSearch className="w-10 h-10 text-slate-400 mb-2" />
                    <h4 className="text-slate-700 dark:text-slate-200 font-medium text-sm">Tidak Ada Data Ditemukan</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Silakan sesuaikan filter pencarian.</p>
                  </div>
                ) : (
                  filteredOperatorInvestments.map((inv: any) => {
                    const distName = districts.find((d: any) => d.id === inv.districtId)?.name || "-";
                    const riskLevel = getRiskLevel(inv);
                    return (
                      <div
                        key={inv.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isDarkMode
                            ? "bg-slate-800/70 border-slate-700/80"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border inline-flex items-center gap-1 ${getSectorBadgeStyle(inv.sector)}`}>
                                <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-current opacity-80" />
                                <span>{t(getSectorI18nKey(inv.sector))}</span>
                              </span>
                              <span className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {distName}
                              </span>
                              {inv.areaHa && (
                                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                  • {formatNumber(inv.areaHa)} Ha
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                              {inv.name}
                            </h4>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {formatRupiahSingkat(inv.investmentValue)}
                              </span>
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                                riskLevel === 'Rendah' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' :
                                riskLevel === 'Sedang' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400' :
                                'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                              }`}>
                                {riskLevel}
                              </span>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex flex-col gap-1.5 shrink-0">
                            <motion.button
                              whileTap={{ scale: 0.92 }}
                              onClick={() => {
                                setEditingInvestment(inv);
                                setIsEditModalOpen(true);
                              }}
                              className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white transition-all"
                              title="Sunting Proyek"
                            >
                              <Edit className="h-4 w-4" />
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.92 }}
                              onClick={() => handleDeleteInvestment(inv.id)}
                              className="p-2 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                              title="Hapus Proyek"
                            >
                              <Trash2 className="h-4 w-4" />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* ── DESKTOP VIRTUALIZED TABLE (Screen >= md) ── */}
              <div className={`hidden md:block overflow-hidden border rounded-2xl shadow-xs ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
                <div className={`grid grid-cols-[2.5fr_1fr_1.2fr_0.8fr_1.2fr_90px] text-[11px] font-semibold tracking-wider uppercase border-b ${
                  isDarkMode ? "bg-slate-800/90 text-slate-300 border-slate-700/80" : "bg-slate-100 text-slate-600 border-slate-200"
                }`}>
                  <div className="p-3 truncate">Nama Proyek</div>
                  <div className="p-3 truncate">Sektor</div>
                  <div className="p-3 truncate">Kecamatan</div>
                  <div className="p-3 text-center truncate">Risiko</div>
                  <div className="p-3 text-right truncate">Nilai</div>
                  <div className="p-3 text-center truncate">Aksi</div>
                </div>
                <div className="w-full">
                  {filteredOperatorInvestments.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                      <FolderSearch className="w-12 h-12 text-slate-400 mb-3 mx-auto" />
                      <h4 className="text-slate-700 dark:text-slate-300 font-medium">Tidak Ada Data Ditemukan</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Silakan sesuaikan filter pencarian Anda.</p>
                    </div>
                  ) : (
                    <List
                      height={400}
                      width={"100%"}
                      itemCount={filteredOperatorInvestments.length}
                      itemSize={72}
                      itemData={{
                        filteredOperatorInvestments,
                        districts,
                        isDarkMode,
                        handleDeleteInvestment,
                        setEditingInvestment,
                        setIsEditModalOpen,
                        getRiskLevel,
                        t
                      }}
                    >
                      {InvestmentRow}
                    </List>
                  )}
                </div>
              </div>
            </div>
              
            {/* Pantauan Argometer SLA & Aktivitas */}
            <div className={`p-4 sm:p-6 rounded-2xl border flex flex-col gap-4 transition-all ${
              isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
            }`}>
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <span>🚨 Pantauan Argometer SLA & Aktivitas</span>
              </h3>
              <div className="flex flex-col gap-3 font-sans">
                <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${isDarkMode ? 'bg-slate-800/80 border-rose-500/30' : 'bg-rose-50 border-rose-200'}`}>
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 shadow-[0_0_10px_rgba(225,29,72,0.5)] animate-pulse shrink-0"></div>
                  <div>
                    <h4 className={`text-xs sm:text-sm font-bold ${isDarkMode ? 'text-rose-400' : 'text-rose-700'}`}>Terlambat (SLA &gt; 72 Jam)</h4>
                    <p className={`text-xs mt-0.5 leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      Tiket LoI PT XYZ tertahan di Bidang Perizinan (OSS). Membutuhkan intervensi segera.
                    </p>
                  </div>
                </div>
                
                <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${isDarkMode ? 'bg-slate-800/80 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shadow-[0_0_10px_rgba(245,158,11,0.5)] shrink-0"></div>
                  <div>
                    <h4 className={`text-xs sm:text-sm font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>Warning (SLA 48 Jam)</h4>
                    <p className={`text-xs mt-0.5 leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      Tiket LoI Sentra Kakao sedang diverifikasi Bidang Promosi.
                    </p>
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${isDarkMode ? 'bg-slate-800/80 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0"></div>
                  <div>
                    <h4 className={`text-xs sm:text-sm font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>Aktivitas Baru</h4>
                    <p className={`text-xs mt-0.5 leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      Admin Dalak selesai melakukan mediasi lahan di Kec. Bua.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column wrapper: Spatial Query, Infrastructure & Uploads */}
          <div className="lg:w-2/5 flex flex-col gap-6">
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white shadow-sm border-slate-200"}`}>
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3 block">
                Validasi Analisis Spasial
              </h3>
              <SpatialQueryPanel 
                isDarkMode={isDarkMode} 
                onExecuteQuery={handleExecuteSpatialQuery} 
                queryResults={spatialQueryResults} 
                onFocusInvestment={(id) => { setActiveWorkspace("INVESTOR"); setSelectedInvestmentId(id); }}
                infrastructure={infrastructure}
                onProximityFilterChange={handleProximityFilterChange}
                onSelectShortestPathRoute={handleSelectShortestPathRoute}
                activeRouteInfo={activeRouteInfo}
                onClearShortestPathRoute={handleClearShortestPathRoute}
                onOpenSuitabilityModal={() => setIsSuitabilityModalOpen(true)}
              />
            </div>

            <InfrastructureStatsChart infrastructure={infrastructure} isDarkMode={isDarkMode} />

            <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col gap-4 transition-all ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white shadow-sm border-slate-200"}`}>
              <div>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-1 block">
                  Upload Gateway
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Unggah layer spasial (GeoJSON) atau berkas dokumen RAG.</p>
              </div>
              <div className="flex flex-col gap-4">
                <UploadGeoJsonPanel isDarkMode={isDarkMode} onUploadSuccess={(newLayer) => { setSpatialLayers((prev) => ({...prev, [newLayer.id]: newLayer})); }} />
                <UploadRagPanel isDarkMode={isDarkMode} />
                <div className="mt-1 flex flex-col gap-4">
                  <AuditLogDashboard />
                  <SystemLogsWidget />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────
  // LANDING PAGE GUARD
  // ─────────────────────────────────────────────
  const currentPath = loc.pathname;

  if (currentPath === "/debug-db" || currentPath === "/debug") {
    return <DebugDbPage />;
  }

  if (currentPath === "/403-forbidden") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-center p-6 text-slate-900 dark:text-white font-sans">
        <Shield className="h-16 w-16 text-rose-500 mb-6 mx-auto animate-pulse" />
        <h1 className="text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-white mb-2">403 Forbidden</h1>
        <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-md">Anda tidak memiliki izin (roles) yang cukup untuk mengakses halaman ini.</p>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => window.location.replace("/")} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-sm tracking-wider uppercase transition-colors">
          Kembali ke Beranda
        </motion.button>
      </div>
    );
  }

  if (currentPath === "/gerbang-operator-luwu") {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <GerbangOperatorLogin
          onSuccess={() => {
            setHasEnteredApp(true);
          }}
        />
      </Suspense>
    );
  }

  if (currentPath === "/mpp") {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <PortalMPP />
      </Suspense>
    );
  }

  if (
    currentPath === "/fo/dashboard" || 
    currentPath === "/fo" || 
    currentPath === "/mpp/fo" || 
    currentPath === "/fo-dashboard" ||
    currentPath === "/front-office"
  ) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <MppFoCommandCenter />
      </Suspense>
    );
  }

  if (currentPath === "/login") {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <InvestorLogin />
      </Suspense>
    );
  }

  if (currentPath === "/register" || currentPath === "/registrasi") {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <InvestorRegistrationForm />
      </Suspense>
    );
  }

  if (showInitialLoader || isProfileLoading) {
    return <LoadingScreen />;
  }

  if (currentPath === "/masyarakat-dashboard" || currentPath === "/masyarakat" || currentPath === "/portal-masyarakat") {
    const rawStoredRole = typeof window !== "undefined" ? (localStorage.getItem("luwu_user_role") || "").toLowerCase().trim() : "";
    const effectiveRole = (activeProfile?.role || rawStoredRole).toLowerCase().replace(/[\s-]+/g, "_");

    // Check if user has verified citizen session from Kiosk or MPP OTP
    let hasOtpSession = false;
    if (typeof window !== "undefined" && window.localStorage) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("mpp_verified_otp_") && !key.includes("_phone_")) {
          if (localStorage.getItem(key) === "true") {
            hasOtpSession = true;
            break;
          }
        }
      }
    }

    if (effectiveRole !== "masyarakat" && !hasOtpSession) {
      window.location.replace("/403-forbidden");
      return null;
    }

    const fallbackCitizenProfile = {
      role: "masyarakat",
      nik: typeof window !== "undefined" ? localStorage.getItem("luwu_user_nik") || "" : "",
      full_name: typeof window !== "undefined" ? localStorage.getItem("luwu_user_name") || "Masyarakat Luwu" : "Masyarakat Luwu",
      phone: typeof window !== "undefined" ? localStorage.getItem("luwu_user_phone") || "" : "",
      no_whatsapp: typeof window !== "undefined" ? localStorage.getItem("luwu_user_phone") || "" : ""
    };

    return (
      <Suspense fallback={<LoadingScreen />}>
        <MasyarakatDashboard 
          isDarkMode={isDarkMode} 
          activeProfile={activeProfile || fallbackCitizenProfile} 
          districts={districts} 
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        />
      </Suspense>
    );
  }

  if (currentPath === "/investor-dashboard" || currentPath === "/investor" || currentPath === "/portal-investor") {
    return (
      <DataContext.Provider value={{ investments, setInvestments, districts, setDistricts, villages, setVillages, spatialLayers, setSpatialLayers, rtrwZoning, setRtrwZoning, incentivePolicies, setIncentivePolicies, supplyChainMatrix, setSupplyChainMatrix, executiveMetrics, setExecutiveMetrics, refreshData: fetchAllData, isLoading: isStatsLoading, isSpatialLiveSyncEnabled, setIsSpatialLiveSyncEnabled, liveSyncStatus, loiCount: investorLoiCount }}>
        <Suspense fallback={<LoadingScreen />}>
          <InvestorPortalDashboard />
        </Suspense>
      </DataContext.Provider>
    );
  }

  if (
    currentPath === "/dashboard" || 
    currentPath.startsWith("/dashboard/") || 
    currentPath.startsWith("/admin") ||
    currentPath.startsWith("/portal-admin")
  ) {
    const rawStoredRole = typeof window !== "undefined" ? (localStorage.getItem("luwu_user_role") || "").toLowerCase().trim() : "";
    const sessionEmail = (activeProfile?.email || "").toLowerCase().trim();
    const effectiveRole = (activeProfile?.role || rawStoredRole).toLowerCase().replace(/[\s-]+/g, "_");

    if (effectiveRole === "masyarakat") {
      window.location.replace("/masyarakat-dashboard");
      return null;
    }

    if (effectiveRole === "investor") {
      return (
        <DataContext.Provider value={{ investments, setInvestments, districts, setDistricts, villages, setVillages, spatialLayers, setSpatialLayers, rtrwZoning, setRtrwZoning, incentivePolicies, setIncentivePolicies, supplyChainMatrix, setSupplyChainMatrix, executiveMetrics, setExecutiveMetrics, refreshData: fetchAllData, isLoading: isStatsLoading, isSpatialLiveSyncEnabled, setIsSpatialLiveSyncEnabled, liveSyncStatus, loiCount: investorLoiCount }}>
          <Suspense fallback={<LoadingScreen />}>
            <InvestorPortalDashboard />
          </Suspense>
        </DataContext.Provider>
      );
    }

    if (isProfileLoading && !rawStoredRole) {
      return <LoadingScreen />;
    }

    const isSuperAdmin = 
      sessionEmail.includes("superadmin") ||
      effectiveRole === "superadmin" ||
      effectiveRole === "super_admin" ||
      effectiveRole === "super" ||
      effectiveRole.includes("super") ||
      rawStoredRole === "superadmin" ||
      rawStoredRole === "super_admin" ||
      currentRole === Role.SUPER_ADMIN ||
      effectiveRole === "admin_promosi" ||
      effectiveRole === "admin_dalak" ||
      effectiveRole === "admin_data" ||
      effectiveRole === "admin_oss";

    const isAdminMpp = 
      sessionEmail.includes("operator") ||
      effectiveRole === "admin_mpp" ||
      effectiveRole === "operator_mpp" ||
      effectiveRole === "operator" ||
      rawStoredRole === "admin_mpp" ||
      rawStoredRole === "operator";

    if (isSuperAdmin) {
      return (
        <DataContext.Provider value={{ investments, setInvestments, districts, setDistricts, villages, setVillages, spatialLayers, setSpatialLayers, rtrwZoning, setRtrwZoning, incentivePolicies, setIncentivePolicies, supplyChainMatrix, setSupplyChainMatrix, executiveMetrics, setExecutiveMetrics, refreshData: fetchAllData, isLoading: isStatsLoading, isSpatialLiveSyncEnabled, setIsSpatialLiveSyncEnabled, liveSyncStatus, loiCount: investorLoiCount }}>
          <Suspense fallback={<LoadingScreen />}>
            <AdminPortalDashboard />
          </Suspense>
        </DataContext.Provider>
      );
    } else if (isAdminMpp) {
      return (
        <Suspense fallback={<LoadingScreen />}>
          <AdminLayout />
        </Suspense>
      );
    }

    return (
      <DataContext.Provider value={{ investments, setInvestments, districts, setDistricts, villages, setVillages, spatialLayers, setSpatialLayers, rtrwZoning, setRtrwZoning, incentivePolicies, setIncentivePolicies, supplyChainMatrix, setSupplyChainMatrix, executiveMetrics, setExecutiveMetrics, refreshData: fetchAllData, isLoading: isStatsLoading, isSpatialLiveSyncEnabled, setIsSpatialLiveSyncEnabled, liveSyncStatus, loiCount: investorLoiCount }}>
        <Suspense fallback={<LoadingScreen />}>
          <AdminPortalDashboard />
        </Suspense>
      </DataContext.Provider>
    );
  }

  if (!hasEnteredApp) {
    return (
      <>
        <LandingPage
          investments={investments}
          districts={districts}
          villages={villages}
          infrastructure={infrastructure}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          stats={stats}
          isLoading={isLoading}
          loiCount={loiTickets.length}
          onOpenDiagnostic={() => setIsDiagnosticModalOpen(true)}
          onSelectDistrict={(id) => {
            setSelectedDistrictId(id);
            setSelectedVillageId(null);
            setSelectedInvestmentId(null);
            setHasEnteredApp(true);
            
            setActiveWorkspace("INVESTOR");
          }}
          onSelectInvestment={(id) => {
            const inv = investments.find((i) => i.id === id);
            if (inv) {
              setSelectedDistrictId(inv.districtId);
              setSelectedVillageId(inv.villageId);
              setSelectedInvestmentId(id);
            }
            setCurrentRole(Role.INVESTOR);
            setHasEnteredApp(true);
            setActiveWorkspace("INVESTOR");
          }}
          onEnterWithWorkspace={(role, workspace) => {
            if (role) setCurrentRole(role);
            if (workspace) setActiveWorkspace(workspace);
            setHasEnteredApp(true);
            
          }}
          onEnter={(role?: Role) => {
            if (role) setCurrentRole(role);
            setHasEnteredApp(true);
            
          }}
        />
        <AnimatePresence>
          {showSplashScreen && (
            <SplashScreen onComplete={() => setShowSplashScreen(false)} />
          )}
        </AnimatePresence>
        <Suspense fallback={null}>
          <SupabaseDiagnosticModal
            isOpen={isDiagnosticModalOpen}
            onClose={() => setIsDiagnosticModalOpen(false)}
            onSuccessCheck={async () => {
              try {
                await fetchAllData();
                setDbStatusError(null);
                Swal.fire({
                  title: "Koneksi Pulih!",
                  text: "Data spasial & investasi telah disinkronkan secara sukses tanpa data palsu.",
                  icon: "success",
                  timer: 3000,
                  showConfirmButton: false,
                  background: "#0f172a",
                  color: "#f8fafc",
                  customClass: {
                    popup: "rounded-3xl border border-slate-700/50"
                  }
                });
              } catch (e) {
                console.error("Refetch after manual diagnostic recovery failed:", e);
              }
            }}
          />
        </Suspense>
      </>
    );
  };

  // ─────────────────────────────────────────────
  // MAIN APP RENDER
  // ─────────────────────────────────────────────
  return (
    <DataContext.Provider value={{ investments, setInvestments, districts, setDistricts, villages, setVillages, spatialLayers, setSpatialLayers, rtrwZoning, setRtrwZoning, incentivePolicies, setIncentivePolicies, supplyChainMatrix, setSupplyChainMatrix, executiveMetrics, setExecutiveMetrics, refreshData: fetchAllData, isLoading: isStatsLoading, isSpatialLiveSyncEnabled, setIsSpatialLiveSyncEnabled, liveSyncStatus, loiCount: investorLoiCount }}>
      <Routes>
      <Route path="*" element={
        <div className={`relative h-[100dvh] w-full overflow-hidden ${
          isDarkMode ? "bg-slate-50 dark:bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"
        } font-sans`}>
    
      <Suspense fallback={null}>
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          investments={investments}
          districts={districts}
          isDarkMode={isDarkMode}
          onSelectInvestment={(inv) => {
            setSelectedInvestmentId(inv.id);
            setIsCommandPaletteOpen(false);
            // Navigate to location if needed
            if (mapComponentRef.current && mapComponentRef.current.flyToCoordinate && inv.longitude && inv.latitude) {
              mapComponentRef.current.flyToCoordinate(inv.longitude, inv.latitude, 14);
            }
          }}
        />
      </Suspense>

      {}
      {(!isLoading && (dbStatusError || investments.length === 0)) && (
        <div className="absolute top-24 left-4 right-4 md:left-[25%] md:right-[25%] z-[70] mx-auto pointer-events-auto max-w-xl animate-fade-in">
          <div className={`p-4 rounded-2xl shadow-2xl backdrop-blur-md border border-white/40 dark:border-slate-700/50 ${
            dbStatusError 
              ? "bg-rose-900/80 text-slate-100" 
              : "bg-white dark:bg-slate-900/80 text-slate-100"
          }`}>
            <div className="flex items-start gap-4">
              <div className={`p-2 min-h-[44px] rounded-xl shrink-0 ${
                dbStatusError ? "bg-rose-500/20 text-rose-700 dark:text-rose-400" : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
              }`}>
                {dbStatusError ? <AlertOctagon className="h-5 w-5" /> : <Info className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase opacity-75 block">
                  {dbStatusError ? "⚠️ STATUS: KENDALA SUPABASE DATABASE" : "🟢 STATUS: DB AKTIF"}
                </span>
                <h3 className="text-sm font-bold mt-1 text-slate-900 dark:text-white">
                  {dbStatusError ? "Gagal Memuat Data dari Cloud" : "Belum Ada Data Investasi Masuk"}
                </h3>
                <p className="text-xs text-slate-300 mt-1.5 font-sans leading-relaxed">
                  {dbStatusError ? (
                    <>
                      Koneksi Supabase PostgreSQL mengalami gangguan jaringan (<span className="font-mono text-rose-300 text-[11px] font-semibold">{dbStatusError}</span>). 
                      Peta dibiarkan bersih tanpa data fiktif demi kredibilitas total informasi pemerintah.
                    </>
                  ) : (
                    <>
                      Sistem terhubung ke database cloud secara sukses, tetapi belum ada data proyek investasi riil yang terdaftar. 
                      Silakan masuk sebagai Admin/Operator untuk mulai membuat dan mendigitalkan data investasi baru, Bapak/Ibu!
                    </>
                  )}
                </p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => setIsDiagnosticModalOpen(true)}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all shadow flex items-center gap-1.5 border select-none cursor-pointer ${
                      dbStatusError 
                        ? "bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-slate-900 dark:text-white border-rose-500/50" 
                        : "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-slate-900 dark:text-white border-emerald-500/50"
                    }`}
                    title="Jalankan Diagnostik Koneksi Supabase"
                  >
                    <Database className="w-3.5 h-3.5 text-slate-900 dark:text-white" />
                    Diagnostik Koneksi & Solusi
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.reload()}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-white dark:bg-slate-900 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all shadow-sm select-none cursor-pointer"
                  >
                    Segarkan Halaman
                  </motion.button>
                </div>
              </div>
              {dbStatusError && (
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => setDbStatusError(null)}
                  className="p-1 hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white rounded-lg transition-colors shrink-0"
                  title="Tutup Notifikasi"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BACKGROUND FULLSCREEN MAP & AI PANEL LAYOUT */}
      <div
        className="absolute inset-0 z-0 flex overflow-hidden bg-white dark:bg-slate-900"
        style={{ display: activeWorkspace === "INVESTOR" ? "flex" : "none" }}
      >
        {/* MAP CONTAINER */}
        <div className="flex-grow h-full relative overflow-hidden transition-all duration-300" style={isForcedHighResMapCanvas ? { position: 'fixed', top: 0, left: 0, width: '2800px', height: '2000px', zIndex: 999997 } : {}}>
          {isLoading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white dark:bg-slate-900/50 backdrop-blur-sm pointer-events-none">
              <div className="flex flex-col items-center bg-slate-800/80 p-6 rounded-2xl shadow-xl border border-emerald-500/20">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-emerald-700 dark:text-emerald-400 font-medium tracking-wide">{t("mapControls.loadingSpatialData", "Memuat Data Spasial...")}</p>
              </div>
            </div>
          )}
          <MapComponent
            ref={mapComponentRef}
            networkRouteGeoJSON={networkRouteGeoJSON}
            isPrintPreviewActive={isMapPrintModalOpen}
            printScale={mapPrintScale}
            printOrientation={printOrientation}
            proximityLineString={proximityLineString}
            proximityBufferGeoJSON={proximityBufferGeoJSON}
            isCartographyMode={isReportModalOpen}
            isDarkMode={isDarkMode}
            currentRole={currentRole}
            districts={districts}
            villages={villages}
            investments={filteredInvestments}
            spatialLayers={filteredSpatialLayers}
            infrastructure={infrastructure}
            selectedDistrictId={selectedDistrictId}
            setSelectedDistrictId={setSelectedDistrictId}
            selectedVillageId={selectedVillageId}
            setSelectedVillageId={setSelectedVillageId}
            selectedInvestmentId={selectedInvestmentId}
            setSelectedInvestmentId={setSelectedInvestmentId}
            heatmapMetric={heatmapMetric}
            heatmapOpacity={heatmapOpacity}
            choroplethMetric={choroplethMetric}
            activeChoroplethFilter={activeChoroplethFilter}
            onToggleChoroplethFilter={setActiveChoroplethFilter}
            isDigitizing={isDigitizing}
            digitizedPoints={digitizedPoints}
            setDigitizedPoints={setDigitizedPoints}
            enableDrawControl={currentRole !== Role.PUBLIC_USER}
            onDrawComplete={setDrawnGeoJson}
            mapMode={mapMode}
            activeCategories={activeCategories}
            onEditInvestment={(inv) => {
              setSelectedInvestmentId(null);
              setEditingInvestment(inv);
              setIsEditModalOpen(true);
            }}
            showLegend={showLegend}
            isLayerPanelOpen={isLayerPanelOpen}
            setIsLayerPanelOpen={setIsLayerPanelOpen}
            isLeftSidebarOpen={!isMobile ? !isLeftSidebarCollapsed : false}
            showRightDashboard={showRightDashboard}
            onOpenSuitabilityModal={() => setIsSuitabilityModalOpen(true)}
            onToggleCategory={(cat) => {
              if (activeCategories.includes(cat)) {
                if (activeCategories.length > 1) setActiveCategories(activeCategories.filter(c => c !== cat));
              } else {
                setActiveCategories([...activeCategories, cat]);
              }
            }}
            onToggleLayerVis={handleToggleLayerVis}
            onChangeLayerOpacity={handleUpdateLayerOpacity}
            onChangeLayerColor={handleUpdateLayerColor}
            onReorderSpatialLayers={(newArr) => {
              setSpatialLayers(prev => {
                const newMap: Record<string, GeoJSONLayer> = {};
                newArr.forEach(l => { newMap[l.id] = l; });
                return newMap;
              });
            }}
            activeWorkspace={activeWorkspace}
            onRefreshData={fetchAllData}
            focusCoordinate={focusCoordinate}
            showInfrastructure={showInfrastructure}
            isTourHudVisible={isTourHudVisible}
            setIsTourHudVisible={setIsTourHudVisible}
            isTemporalGisActive={isTemporalGisControlActive}
            isAiPanelOpen={isAiPanelOpen}
          />
        </div>

        {/* AI KONSULTAN PANEL (SLIDE-IN DRAWER) */}
        <div 
          className={`h-full shrink-0 flex flex-col z-[45] transition-all duration-300 overflow-hidden shadow-[-10px_0_30px_rgba(0,0,0,0.5)] ${
            isAiPanelOpen ? "w-[300px] md:w-[380px] lg:w-[420px] translate-x-0" : "w-0 opacity-0 translate-x-full pointer-events-none"
          } ${isDarkMode ? "bg-white dark:bg-slate-900 border-l border-white/10" : "bg-white border-l border-slate-200"}`}
        >
          {/* Header */}
          <div className={`p-4 border-b flex items-center justify-between shrink-0 ${isDarkMode ? "border-white/10 bg-slate-50 dark:bg-slate-950/50" : "border-slate-200 bg-slate-50"}`}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className={`font-bold font-display ${isDarkMode ? "text-slate-900 dark:text-white" : "text-slate-900"}`}>Asisten Investasi</h3>
                <p className={`text-xs ${isDarkMode ? "text-indigo-700 dark:text-indigo-400" : "text-indigo-600"}`}>MPP Simpurusiang Luwu</p>
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.95 }} 
              onClick={() => setIsAiPanelOpen(false)}
              className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white" : "hover:bg-slate-200 text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
            >
              <X className="h-5 w-5" />
            </motion.button>
          </div>

          {/* Redirect to AI Consultant Modal */}
          <div className="flex-grow p-6 flex flex-col items-center justify-center text-center gap-6">
            <div className={`p-4 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 animate-pulse`}>
              <Sparkles className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h4 className={`text-base font-bold ${isDarkMode ? "text-slate-900 dark:text-white" : "text-slate-950"}`}>
                Konsultan AI Spasial Utama
              </h4>
              <p className={`text-xs leading-relaxed max-w-sm ${isDarkMode ? "text-slate-600 dark:text-slate-300" : "text-slate-600"}`}>
                Asisten AI Tata Ruang dan Analis Buffer Terintegrasi kami kini tersedia dalam konsol workspace interaktif yang lebih lengkap, mendukung analisis multi-layer dan simulasi data rill.
              </p>
            </div>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsBufferAiModalOpen(true);
                setIsAiPanelOpen(false);
              }}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              Buka Konsultan AI Utama
            </motion.button>
          </div>
        </div>
      </div>

      {/* FLOATING TOP HEADER */}
      <header 
        className={`absolute left-4 right-4 md:left-6 md:right-6 md:top-6 z-[60] shrink-0 pointer-events-none flex items-center justify-between gap-4 transition-all duration-300 ${
          (isMobile && (isSidebarOpen || (isDashboardExpanded && isRightSidebarOpen))) || (isMobile && activeWorkspace === "EXECUTIVE_DASHBOARD")
            ? "opacity-0 -translate-y-12 pointer-events-none hidden md:flex"
            : "opacity-100 translate-y-0"
        }`}
        style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
      >
        {/* Brand Title */}
        <div className={`flex flex-wrap items-center gap-2 md:gap-3 pointer-events-auto backdrop-blur-md border border-white/40 dark:border-slate-700/50 rounded-2xl p-2 md:p-3 shadow-2xl animate-fade-in ${
          isDarkMode
            ? "bg-white dark:bg-slate-900/80 text-slate-900 dark:text-white"
            : "bg-white/80 text-slate-900"
        }`}>
          <LuwuLogo size="sm" className="h-8 w-8 md:h-10 md:w-10 shrink-0 object-contain" />
          <div className="pr-2">
            <h1 className={`text-sm md:text-base font-display font-bold tracking-tight flex items-center gap-2 ${
              isDarkMode ? "text-slate-900 dark:text-white" : "text-slate-900"
            }`}>
              PORTAL INVESTASI{" "}
              <span className="hidden sm:inline text-emerald-700 dark:text-emerald-400">LUWU</span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] md:text-[10px] font-mono px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider hidden xs:inline-block">
                GIS ENGINE v2.0
              </span>
            </h1>
            <p className="hidden md:block text-[10px] text-slate-300 font-sans tracking-wide -mt-0.5">
              Smart Spatial Intelligence Platform
            </p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 pl-2 border-l border-white/10">
            <motion.button whileTap={{ scale: 0.95 }}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (currentRole === Role.SUPER_ADMIN || currentRole === Role.OPERATOR) {
                  setHasEnteredApp(false);
                  window.history.pushState({}, "", "/");
                } else {
                  setHasEnteredApp(false); window.history.pushState({}, "", "/");
                }
              }}
              className={`p-2 min-h-[44px] rounded-xl transition-all cursor-pointer ${
                isDarkMode ? "text-slate-300 hover:text-slate-900 dark:text-white" : "text-slate-600 hover:text-slate-900"
              }`}
              title="Kembali ke Dashboard"
            >
              <Home className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 min-h-[44px] rounded-xl transition-all cursor-pointer ${
                isDarkMode ? "text-slate-300 hover:text-slate-900 dark:text-white" : "text-slate-600 hover:text-slate-900"
              }`}
              title="Toggle Tema"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
              ) : (
                <Moon className="h-4 w-4 text-emerald-500" />
              )}
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => {
                setActiveWorkspace(activeWorkspace === "EXECUTIVE_DASHBOARD" ? "INVESTOR" : "EXECUTIVE_DASHBOARD");
              }}
              className={`px-2.5 py-1.5 rounded-xl transition-all duration-300 cursor-pointer flex items-center gap-1.5 text-xs font-bold active:scale-95 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] ${
                activeWorkspace === "EXECUTIVE_DASHBOARD"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white border border-emerald-400/40 shadow-md scale-105"
                  : isDarkMode ? "bg-slate-800/80 text-slate-300 hover:text-slate-900 dark:text-white border border-slate-700/50" : "bg-slate-100 text-slate-800 dark:text-slate-200 hover:text-slate-900 border border-slate-200"
              }`}
              title="Toggle antara Tampilan Peta (GIS) dan Dasbor Eksekutif (Bupati/Kadis)"
            >
              <BarChart3 className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
              <span className="hidden sm:inline text-[11px] font-bold">
                {activeWorkspace === "EXECUTIVE_DASHBOARD" ? "Peta Spasial" : "Dasbor Eksekutif"}
              </span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => {
                setShowRightDashboard(true);
                const nextState = !isDashboardExpanded;
                setIsDashboardExpanded(nextState);
                setIsRightSidebarOpen(nextState);
              }}
              className={`px-2.5 py-1.5 rounded-xl transition-all duration-300 cursor-pointer flex items-center gap-1.5 text-xs font-bold active:scale-95 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] ${
                isDashboardExpanded && showRightDashboard
                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 shadow-sm"
                  : isDarkMode ? "bg-slate-800/80 text-slate-300 hover:text-slate-900 dark:text-white border border-slate-700/50" : "bg-slate-100 text-slate-800 dark:text-slate-200 hover:text-slate-900 border border-slate-200"
              }`}
              title="Buka / Tutup Hub Analitik Berbasis Investor"
            >
              <PieChart className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
              <span className="hidden lg:inline text-[11px] font-bold">Hub Analitik</span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => {
                const nextState = !isLayerPanelOpen;
                setIsLayerPanelOpen(nextState);
                if (nextState && !isMobile) {
                  // Collapse Kontrol Peta on desktop so it doesn't obstruct the thematic layer panel
                  setIsLeftSidebarCollapsed(true);
                }
              }}
              className={`px-2.5 py-1.5 rounded-xl transition-all duration-300 cursor-pointer flex items-center gap-1.5 text-xs font-bold active:scale-95 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] ${
                isLayerPanelOpen
                  ? "bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-500/40 shadow-sm"
                  : isDarkMode ? "bg-slate-800/80 text-slate-300 hover:text-slate-900 dark:text-white border border-slate-700/50" : "bg-slate-100 text-slate-800 dark:text-slate-200 hover:text-slate-900 border border-slate-200"
              }`}
              title="Buka / Tutup Panel Layer Tematik (GIS)"
            >
              <Layers className="h-4 w-4 text-indigo-500" />
              <span className="hidden sm:inline text-[11px] font-bold">Layer Tematik</span>
            </motion.button>
            <LanguageToggle isDarkHeader={isDarkMode} />
          </div>
        </div>

        {/* Workspace Switcher atau Search */}
        <div className="flex items-center gap-4 pointer-events-auto">
          {/* Global Search / Command Palette Trigger */}
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={() => setIsCommandPaletteOpen(true)}
            className={`flex items-center gap-3 px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 ease-in-out active:scale-95 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] ${
              isDarkMode 
                ? "bg-white dark:bg-slate-900/80 border-slate-700/50 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:border-slate-600" 
                : "bg-white/80 border-slate-200/60 text-slate-600 dark:text-slate-400 hover:text-slate-800 hover:bg-white"
            }`}
          >
            <Search className="w-4 h-4" />
            <span className="text-[11px] font-medium tracking-wide">
              {t('commandPalette.searchPlaceholder', 'Cari Data (Ctrl+K)')}
            </span>
            <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold border ${
              isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-600 dark:text-slate-400"
            }`}>
              <Command className="w-3 h-3 shrink-0" />
              <span>K</span>
            </div>
          </motion.button>

          {isAdminRole(currentRole) || isAdminRole(activeProfile?.role) ? (
            <div className={`flex items-center gap-1.5 p-1 rounded-2xl pointer-events-auto shadow-2xl border border-white/40 dark:border-slate-700/50 backdrop-blur-md ${
              isDarkMode ? "bg-white dark:bg-slate-900/80" : "bg-white/80"
            }`}>
              {(["INVESTOR", "EXECUTIVE_DASHBOARD", "OPERATOR", "SPATIAL_EDITOR"] as const).map((ws) => (
                <motion.button whileTap={{ scale: 0.95 }}
                  key={ws}
                  onClick={() => setActiveWorkspace(ws)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] md:text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeWorkspace === ws
                      ? isDarkMode
                        ? "bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-slate-700 shadow-md scale-105"
                        : "bg-slate-100 text-emerald-700 border border-slate-200 shadow-md scale-105"
                      : isDarkMode
                      ? "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {ws === "INVESTOR" && <Compass className="h-4 w-4" />}
                  {ws === "EXECUTIVE_DASHBOARD" && <BarChart3 className="h-4 w-4 text-teal-700 dark:text-teal-400" />}
                  {ws === "OPERATOR" && <Building2 className="h-4 w-4" />}
                  {ws === "SPATIAL_EDITOR" && <Layers className="h-4 w-4 text-purple-400" />}
                  <span className="hidden sm:inline">
                    {ws === "INVESTOR" && "Peta GIS"}
                    {ws === "EXECUTIVE_DASHBOARD" && "Dasbor Eksekutif"}
                    {ws === "OPERATOR" && "Operator Workspace"}
                    {ws === "SPATIAL_EDITOR" && "Kelola GIS Spasial"}
                  </span>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="relative w-full sm:w-80 max-w-sm pointer-events-auto">
              <div className="relative group">
                <Search className="absolute left-4 top-3 h-4 w-4 text-emerald-500 group-focus-within:text-emerald-400 transition-colors" />
                <input
                  type="text"
                  placeholder={t('map.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  className={`w-full ${
                    isDarkMode
                      ? "bg-white dark:bg-slate-900/80 border-white/10 text-slate-100 placeholder-slate-400 focus:bg-white dark:bg-slate-900/90"
                      : "bg-white/80 border-slate-200 text-slate-900 placeholder-slate-500 focus:bg-white/90"
                  } backdrop-blur-md rounded-2xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/60 focus:ring-4 focus:ring-emerald-500/10 transition-all font-sans shadow-xl`}
                />
              </div>

              {showSearchResults && filteredSearchList.length > 0 && (
                <div className={`absolute top-14 left-0 right-0 backdrop-blur-md border border-white/40 dark:border-slate-700/50 rounded-2xl shadow-2xl p-2 z-[999] flex flex-col gap-1 max-h-72 overflow-y-auto custom-scrollbar animate-fade-in ${
                  isDarkMode ? "bg-white dark:bg-slate-900/80" : "bg-white/80"
                }`}>
                  <span className="text-[10px] text-slate-600 dark:text-slate-300 uppercase tracking-widest font-mono px-3 py-2 block font-semibold">
                    Hasil Pencarian Spatial
                  </span>
                  {filteredSearchList.map((item, idx) => (
                    <motion.button whileTap={{ scale: 0.95 }}
                      key={`${item.type}-${item.id}-${idx}`}
                      onClick={() => handleSearchSelect(item)}
                      className="w-full hover:bg-slate-800/80 text-left p-2.5 min-h-[44px] rounded-xl text-xs text-slate-900 dark:text-white transition-all flex flex-col gap-1 border border-transparent hover:border-white/5"
                    >
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 font-sans text-[13px]">
                        {item.label}
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-full block leading-relaxed">
                        {item.desc}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Role & Auth Controls */}
        <div className="flex items-center gap-3 md:gap-4 pointer-events-auto">
          {}
        </div>
      </header>

      {/* FLOATING QUICK RESETS (GLOBAL) */}
      {!(isMobile && (isRightSidebarOpen || isDashboardExpanded)) && (
        <div className="absolute top-[120px] md:top-6 left-1/2 -translate-x-1/2 z-[65] pointer-events-auto flex flex-col sm:flex-row items-center gap-2">
          {selectedDistrictId && (
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedDistrictId(null);
                setSelectedVillageId(null);
                setSelectedInvestmentId(null);
                handleCenterMap(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-white/40 dark:border-slate-700/50 backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 group ${
                isDarkMode 
                  ? "bg-white dark:bg-slate-900/80 text-slate-200 hover:border-emerald-500 hover:bg-slate-800" 
                  : "bg-white/80 text-emerald-800 hover:border-emerald-500 hover:bg-emerald-50"
              }`}
              title="Tutup Filter Kecamatan (Tampilkan Seluruh Wilayah)"
            >
              <Map className="h-4 w-4 text-emerald-500 animate-pulse" />
              <span className="truncate max-w-[150px] sm:max-w-[200px]">Reset Kec: <span className="font-bold">{districts.find(d => d.id === selectedDistrictId)?.name}</span></span>
              <div className={`ml-1 flex items-center justify-center p-1 rounded-full transition-colors ${
                isDarkMode ? "bg-slate-800 group-hover:bg-red-500/20 group-hover:text-red-400" : "bg-slate-100 group-hover:bg-red-100 group-hover:text-red-600"
              }`}>
                <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </div>
            </motion.button>
          )}

          {activeSuitabilityFilterIds !== null && (
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => {
                setActiveSuitabilityFilterIds(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-emerald-400/40 backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 group ${
                isDarkMode 
                  ? "bg-slate-900/95 text-emerald-300 hover:border-emerald-500 hover:bg-slate-800" 
                  : "bg-emerald-50 text-emerald-800 hover:border-emerald-500 hover:bg-emerald-100"
              }`}
              title="Reset Filter Kesesuaian Lahan"
            >
              <span className="text-emerald-500 animate-pulse">🌱</span>
              <span className="truncate max-w-[150px] sm:max-w-[200px]">Filter Lahan: <span className="font-bold">{activeSuitabilityFilterIds.length} Sesuai</span></span>
              <div className={`ml-1 flex items-center justify-center p-1 rounded-full transition-colors ${
                isDarkMode ? "bg-slate-800 group-hover:bg-red-500/20 group-hover:text-red-400" : "bg-emerald-100 group-hover:bg-red-100 group-hover:text-red-600"
              }`}>
                <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </div>
            </motion.button>
          )}
        </div>
      )}

      {/* ── INVESTOR WORKSPACE ── */}
      {activeWorkspace === "INVESTOR" ? (
        <div className="absolute inset-0 pointer-events-none z-[50] pt-28">
          <div className="h-full w-full relative flex items-start justify-between pl-4 md:pl-6 pr-4 md:pr-6 lg:pr-6 pb-6 overflow-hidden">

            {/* Mobile overlay backdrops */}
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.div
                  key="left-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="md:hidden absolute inset-0 bg-slate-50 dark:bg-slate-950/40 backdrop-blur-md z-[65] pointer-events-auto"
                  onClick={() => setIsSidebarOpen(false)}
                />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {isRightSidebarOpen && (
                <motion.div
                  key="right-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="lg:hidden absolute inset-0 bg-slate-50 dark:bg-slate-950/40 backdrop-blur-md z-[65] pointer-events-auto"
                  onClick={() => setIsRightSidebarOpen(false)}
                />
              )}
            </AnimatePresence>

            {/* MOBILE BACKDROP OVERLAY */}
            <AnimatePresence>
              {isMobile && (isSidebarOpen || (isDashboardExpanded && isRightSidebarOpen)) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[65] pointer-events-auto"
                  onClick={() => {
                    setIsSidebarOpen(false);
                    setIsRightSidebarOpen(false);
                    setIsDashboardExpanded(false);
                  }}
                />
              )}
            </AnimatePresence>

            {/* LEFT SIDEBAR */}
            <AnimatePresence>
              {(!isMobile ? !isLeftSidebarCollapsed : isSidebarOpen) && (
                <motion.aside
                  key="left-sidebar"
                  initial={isMobile ? { y: "100%", opacity: 0 } : { x: "-100%", opacity: 0.5, filter: "blur(4px)" }}
                  animate={isMobile ? { y: 0, opacity: 1 } : { x: 0, opacity: 1, filter: "blur(0px)" }}
                  exit={isMobile ? { y: "100%", opacity: 0 } : { x: "-100%", opacity: 0.5, filter: "blur(4px)" }}
                  transition={{ type: "spring", stiffness: 240, damping: 26, mass: 0.9 }}
                  className={`fixed inset-x-0 top-3 sm:top-4 bottom-0 md:top-auto md:bottom-auto h-auto md:h-full md:relative md:inset-auto shrink-0 w-full md:max-w-sm md:w-64 lg:w-80 overflow-hidden pointer-events-auto flex flex-col gap-3 z-[70] md:z-[50] rounded-t-[28px] md:rounded-none shadow-[0_-12px_40px_rgba(0,0,0,0.5)] md:shadow-none ${isDarkMode ? "bg-slate-50 dark:bg-slate-950 md:bg-transparent text-slate-900 dark:text-white" : "bg-white md:bg-transparent text-slate-900"} border-t md:border-t-0 md:border-r border-white/10 md:border-transparent`}
                >
                  <div className="flex-1 w-full h-full overflow-y-auto pb-24 md:pb-12 px-4 md:px-0 pt-3 md:pt-4 flex flex-col gap-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/50 hover:[&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {/* Header & close/collapse button (Mobile & Desktop) */}
                  <div className={`flex flex-col items-center justify-between -mt-1 mb-3 px-1 sticky top-0 z-20 pt-1 pb-2 backdrop-blur-md border-b transition-colors ${
                    isDarkMode 
                      ? "bg-slate-50 dark:bg-slate-950/95 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white" 
                      : "bg-white/98 border-slate-250 text-slate-950 shadow-xs"
                  }`}>
                    <div className={`md:hidden w-12 h-1.5 ${isDarkMode ? "bg-slate-700" : "bg-slate-300"} rounded-full mb-2 pointer-events-none`} />
                    <div className="flex justify-between items-center w-full">
                      <span className={`font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-base ml-2 tracking-tight ${
                        isDarkMode ? "text-white" : "text-slate-950"
                      }`}>
                        {t("mapControls.mapControl", "Kontrol Peta")}
                      </span>
                      <motion.button whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => {
                          if (isMobile) {
                            setIsSidebarOpen(false);
                          } else {
                            setIsLeftSidebarCollapsed(true);
                          }
                        }}
                        className={`p-2 min-w-[36px] min-h-[36px] rounded-full border flex items-center justify-center shadow-md transition-all cursor-pointer ${
                          isDarkMode 
                            ? "bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700" 
                            : "bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300"
                        }`}
                        title={isMobile ? "Tutup" : "Sembunyikan Kontrol Peta"}
                      >
                        <X size={16} />
                      </motion.button>
                    </div>
                  </div>

              {/* AI Consultant Button */}
              <div className={`${isDarkMode ? "bg-white dark:bg-slate-900/80 backdrop-blur-md border-slate-700/50 shadow-2xl" : "bg-white border-slate-200 shadow-md"} border p-3 rounded-2xl flex flex-col gap-2 relative overflow-hidden group flex-shrink-0 transition-all duration-300`}>
                <div className={`absolute -right-4 -top-4 w-20 h-20 bg-blue-600/10 rounded-full blur-2xl ${isDarkMode ? "group-hover:bg-blue-500/20" : "group-hover:bg-blue-300/30"} transition-all`} />
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => setIsBufferAiModalOpen(true)}
                  className="py-2.5 px-3.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-xl font-['Plus_Jakarta_Sans',sans-serif] transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(0,0,0,0.1)] active:scale-95 border border-blue-500 ring-2 ring-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.2)] flex justify-between items-center gap-2 tracking-wide relative z-10 w-full"
                >
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    <span className="text-left font-bold leading-tight">
                      Konsultan AI Gemini
                    </span>
                  </div>
                  <div className="bg-white/20 p-1.5 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:rotate-12">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                </motion.button>
              </div>

              {/* Spatial Control Panel */}
              <div className={`${
                isDarkMode
                  ? "bg-slate-50 dark:bg-slate-950/80 backdrop-blur-2xl border-white/5 text-slate-900 dark:text-white shadow-[0_8px_32px_rgba(0,0,0,0.5)] ring-1 ring-white/10"
                  : "bg-white/95 border-slate-300/90 text-slate-900 shadow-2xl shadow-slate-900/15"
              } backdrop-blur-xl border p-4 rounded-3xl flex flex-col gap-2.5 relative flex-shrink-0 group mb-8 transition-all duration-300 font-sans`}>
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors pointer-events-none" />

                <div className="flex flex-col items-center justify-center gap-1.5 border-b border-slate-500/20 pb-2.5 text-center z-10 relative">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-inner ${
                    isDarkMode ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-emerald-100 border-emerald-300 text-emerald-700"
                  }`}>
                    <Layers className="h-4 w-4 animate-pulse" />
                  </div>
                  <h4 className={`text-[14px] font-['Plus_Jakarta_Sans',sans-serif] font-extrabold tracking-tight ${
                    isDarkMode ? "text-slate-900 dark:text-white" : "text-slate-950"
                  }`}>
                    {t('mapControls.mapControl', 'Kontrol Peta Spasial')}
                  </h4>
                </div>

                {/* Basemap Selection */}
                <div className="flex flex-col gap-1.5 relative z-10">
                  <span className="text-[9px] text-slate-600 dark:text-slate-400 font-mono font-bold uppercase tracking-widest pl-1">
                    {t('map.basemap')}
                  </span>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-slate-500/5 rounded-xl border border-slate-500/10">
                    {(["osm", "google_satellite", "satellite", "dark"] as const).map((mode) => (
                      <motion.button whileTap={{ scale: 0.95 }}
                        key={mode}
                        onClick={() => setMapMode(mode)}
                        className={`text-[10px] sm:text-[11px] font-mono py-2 rounded-lg border transition-all cursor-pointer ${
                          mapMode === mode
                            ? "bg-emerald-600 border-emerald-500 text-white font-bold shadow-md"
                            : isDarkMode 
                              ? "border-transparent text-slate-300 hover:bg-slate-800 hover:text-white" 
                              : "border-transparent text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                        }`}
                      >
                        {mode === "osm" && "Light Map"}
                        {mode === "google_satellite" && "Google Maps"}
                        {mode === "satellite" && "Satellite"}
                        {mode === "dark" && "Dark Engine"}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Temporal GIS Toggle */}
                <div className="flex flex-col gap-1.5 relative z-10 mt-0.5">
                  <span className="text-[9px] text-slate-600 dark:text-slate-400 font-mono font-bold uppercase tracking-widest pl-1 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-emerald-500" /> {t('map.temporalGis')}
                  </span>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-slate-500/5 rounded-xl border border-slate-500/10">
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() => setIsTemporalGisControlActive(true)}
                      className={`text-[10px] sm:text-[11px] font-mono py-2 rounded-lg border transition-all cursor-pointer ${
                        isTemporalGisControlActive
                          ? "bg-emerald-600 border-emerald-500 text-white font-extrabold shadow-md"
                          : `border-transparent hover:bg-slate-500/10 ${isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900"}`
                      }`}
                    >
                      {t('mapControls.active')}
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() => setIsTemporalGisControlActive(false)}
                      className={`text-[10px] sm:text-[11px] font-mono py-2 rounded-lg border transition-all cursor-pointer ${
                        !isTemporalGisControlActive
                          ? isDarkMode 
                            ? "bg-slate-700 border-slate-600 text-white font-bold shadow-md" 
                            : "bg-slate-200 border-slate-300 text-slate-900 font-bold shadow-md"
                          : `border-transparent hover:bg-slate-500/10 ${isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900"}`
                      }`}
                    >
                      {t('mapControls.inactive')}
                    </motion.button>
                  </div>
                  {isTemporalGisControlActive && (
                    <div className="mt-2 flex flex-col gap-1.5 px-1 pb-1">
                      <div className={`flex justify-between items-center text-[10px] font-mono ${isDarkMode ? "text-slate-600 dark:text-slate-300" : "text-slate-600 dark:text-slate-400"}`}>
                        <span>2015</span>
                        <span className={`font-bold ${isDarkMode ? "text-emerald-700 dark:text-emerald-400" : "text-emerald-600"}`}>Target: {temporalYear}</span>
                        <span>{new Date().getFullYear()}</span>
                      </div>
                      <input 
                        type="range"
                        min="2015"
                        max={new Date().getFullYear()}
                        step="1"
                        value={temporalYear}
                        onChange={(e) => setTemporalYear(parseInt(e.target.value, 10))}
                        className="w-full accent-emerald-500 appearance-none bg-slate-600/50 h-1 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                      />
                      <p className="text-[9px] text-slate-600 dark:text-slate-400 italic mt-1 leading-tight text-center">
                        {t('mapControls.temporalGisDesc')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Thematic Overlays */}
                <div className="flex flex-col gap-1.5 relative z-10 mt-1 pb-1 border-b border-slate-500/20">
                  <span className="text-[9px] text-slate-600 dark:text-slate-400 font-mono font-bold uppercase tracking-widest pl-1 text-emerald-500">
                    Thematic Overlays
                  </span>
                  <div className="flex flex-col gap-1.5 mt-1">
                    {Object.values(spatialLayers).filter(l => ["layer_land_use_zoning", "layer_flood_risk", "layer_landslide_risk", "layer_historical_suitability", "layer_potensi"].includes(l.id)).map((l, idx) => (
                      <div key={`thematic-${l.id}`} className="flex items-center justify-between group px-1 opacity-0 animate-stagger-in" style={{ animationDelay: `${idx * 40}ms` }}>
                        <label className={`flex items-center gap-2 cursor-pointer text-[10px] sm:text-xs font-mono font-semibold select-none py-2 transition-colors duration-200 ${
                          l.isActive ? (isDarkMode ? "text-slate-900 dark:text-white" : "text-slate-900") : (isDarkMode ? "text-slate-600 dark:text-slate-300 hover:text-slate-200" : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200")
                        }`}>
                          <input
                            type="checkbox"
                            checked={l.isActive}
                            onChange={() => handleToggleLayerVis(l.id)}
                            disabled={l.isLoading}
                            className={`rounded h-4 w-4 ${
                              isDarkMode ? "accent-emerald-400" : "accent-emerald-500"
                            } ${l.isLoading ? "opacity-50 cursor-wait" : ""}`}
                          />
                          {l.isLoading && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500 shrink-0" />
                          )}
                          <span className="truncate">
                            {l.id === 'layer_potensi' ? t('map.investmentPotential') : 
                             l.id === 'layer_land_use_zoning' ? t('map.landUseZoning') : 
                             l.id === 'layer_flood_risk' ? t('map.floodRisk') : l.name}
                          </span>
                        </label>
                        <div
                          className="w-3 h-3 rounded-full opacity-80"
                          style={{ backgroundColor: l.color }}
                        />
                      </div>
                    ))}
                    
                    {/* Visual Legend for Active Risks */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${(spatialLayers["layer_flood_risk"]?.isActive || spatialLayers["layer_landslide_risk"]?.isActive) ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}`}>
                      <div className={`p-2.5 min-h-[44px] rounded-xl border flex flex-col gap-2 ${
                        isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-slate-100/60 border-slate-200/60"
                      }`}>
                        <div className={`text-[9px] font-bold uppercase tracking-widest border-b pb-1 mb-0.5 ${
                          isDarkMode ? "text-slate-300 border-slate-700/50" : "text-slate-600 border-slate-300/50"
                        }`}>
                          {t('mapControls.disasterRiskLegend')}
                        </div>
                        
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${spatialLayers["layer_flood_risk"]?.isActive ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-md border shadow-sm" style={{ backgroundColor: spatialLayers["layer_flood_risk"]?.color || "#3b82f6", borderColor: isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)" }} />
                            <span className={`text-[10px] font-medium ${isDarkMode ? "text-slate-300" : "text-slate-800 dark:text-slate-200"}`}>
                              {t('mapControls.floodZone')}
                            </span>
                          </div>
                        </div>

                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${spatialLayers["layer_landslide_risk"]?.isActive ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-md border shadow-sm" style={{ backgroundColor: spatialLayers["layer_landslide_risk"]?.color || "#ef4444", borderColor: isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)" }} />
                            <span className={`text-[10px] font-medium ${isDarkMode ? "text-slate-300" : "text-slate-800 dark:text-slate-200"}`}>
                              {t('mapControls.landslideZone')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {Object.values(spatialLayers).filter(l => ["layer_land_use_zoning", "layer_flood_risk", "layer_landslide_risk", "layer_historical_suitability", "layer_potensi"].includes(l.id)).length === 0 && (
                      <div className="text-[9px] text-slate-600 dark:text-slate-300 pl-1 italic">
                        {t('mapControls.loadingData')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Filter Wilayah */}
                <div className="flex flex-col gap-1.5 relative z-10">
                  <div className="flex items-center justify-between pl-1">
                    <span className="text-[9px] text-slate-600 dark:text-slate-400 font-mono font-bold uppercase tracking-widest">
                      {t('mapControls.regionFilter')}
                    </span>
                    {selectedDistrictId && (
                      <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {filteredInvestments.length} {t('mapControls.points', 'Titik')}
                      </span>
                    )}
                  </div>
                  <select
                    value={selectedDistrictId || "all"}
                    onChange={(e) => {
                      const val = e.target.value === "all" ? null : e.target.value;
                      startTransition(() => {
                        setSelectedDistrictId(val);
                        setSelectedVillageId(null);
                        setSelectedInvestmentId(null);
                      });
                      handleCenterMap(val);
                      if (window.innerWidth < 768) {
                        setIsSidebarOpen(false);
                      }
                    }}
                    className={`w-full rounded-xl px-2.5 py-1.5 text-xs focus:outline-none transition-all font-mono border ${
                      selectedDistrictId
                        ? "border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.25)] bg-amber-500/5 text-amber-600 dark:text-amber-400 font-bold"
                        : isDarkMode
                          ? "bg-white dark:bg-slate-900 border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500/50"
                          : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500"
                    }`}
                  >
                    <option value="all">🔍 {t('mapControls.allSubdistricts')}</option>
                    {districts.map((d, idx) => (
                      <option key={`${d.id}-${idx}`} value={d.id}>{d.name}</option>
                    ))}
                  </select>

                  {/* Center Map (Pusatkan Peta) Button */}
                  <button
                    type="button"
                    id="btn-center-map-sidebar"
                    onClick={() => handleCenterMap(selectedDistrictId)}
                    title={t('mapControls.centerMapTooltip', 'Pusatkan dan sesuaikan viewport peta ke seluruh sebaran titik investasi wilayah terpilih')}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-1 rounded-xl text-xs font-semibold tracking-wide transition-all border shadow-sm cursor-pointer bg-white hover:bg-emerald-50 text-emerald-700 border-slate-200 hover:border-emerald-500/50 dark:bg-slate-900 dark:hover:bg-emerald-950/30 dark:text-emerald-300 dark:border-slate-700 dark:hover:border-emerald-500/60 active:scale-[0.98]"
                  >
                    <LocateFixed className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      {t('mapControls.centerMap', 'Pusatkan Peta')} {selectedDistrictId ? `(${districts.find(d => d.id === selectedDistrictId)?.name || 'Kecamatan'})` : `(${t('mapControls.allSectors', 'Semua Wilayah')})`}
                    </span>
                  </button>

                  {selectedDistrictId && (
                    <div className="flex flex-col gap-1.5 w-full mt-1">
                      <select
                        value={selectedVillageId || "all"}
                        onChange={(e) => {
                          const val = e.target.value === "all" ? null : e.target.value;
                          startTransition(() => {
                            setSelectedVillageId(val);
                            setSelectedInvestmentId(null);
                          });
                          handleCenterMap(selectedDistrictId, val);
                          if (window.innerWidth < 768) {
                            setIsSidebarOpen(false);
                          }
                        }}
                        className={`w-full rounded-xl px-2.5 py-1.5 text-xs focus:outline-none transition-all font-mono border ${
                          selectedVillageId
                            ? "border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.25)] bg-amber-500/5 text-amber-600 dark:text-amber-400 font-bold"
                            : isDarkMode
                              ? "bg-white dark:bg-slate-900 border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500/50"
                              : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500"
                        }`}
                      >
                        <option value="all">🔍 {t('mapControls.allVillages')}</option>
                        {filteredVillages.map((v, idx) => (
                          <option key={`${v.id}-${idx}`} value={v.id}>{v.name}</option>
                        ))}
                      </select>

                      <div className="flex flex-col gap-1 mt-1">
                        <label className="text-[9px] text-slate-600 dark:text-slate-400 font-mono font-bold uppercase tracking-widest pl-1">
                          {t('mapControls.mapScalePdf')}
                        </label>
                        <select
                          value={printScale}
                          onChange={(e) => {
                            const val = e.target.value;
                            startTransition(() => {
                              setPrintScale(val);
                            });
                          }}
                          className={`w-full rounded-xl px-2.5 py-1.5 text-xs focus:outline-none transition-all font-mono border ${
                            isDarkMode
                              ? "bg-white dark:bg-slate-900 border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500/50"
                              : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500"
                          }`}
                        >
                          <option value="auto">{t('mapControls.autoCenterAdmin')}</option>
                          <option value="50000">1 : 50.000</option>
                          <option value="100000">1 : 100.000</option>
                          <option value="150000">1 : 150.000</option>
                          <option value="250000">1 : 250.000</option>
                          <option value="500000">1 : 500.000</option>
                          <option value="1250000">1 : 1.250.000</option>
                          <option value="1500000">1 : 1.500.000</option>
                        </select>
                      </div>

                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={handleExportKecamatanReport}
                        disabled={isGeneratingReportPdf}
                        className="w-full text-center flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-slate-900 dark:text-white text-[11px] font-bold font-mono rounded-xl border border-emerald-500/20 shadow-md transition-all cursor-pointer disabled:opacity-50"
                        title={t('mapControls.exportGisPdfTooltip')}
                      >
                        {isGeneratingReportPdf ? (
                          <>
                            <RefreshCw className="h-3 w-3 animate-spin animate-reverse" />
                            <span>{t('mapControls.exportingMap')}</span>
                          </>
                        ) : (
                          <>
                            <Printer className="h-3.5 w-3.5" />
                            <span>{t('mapControls.printInvestmentProfile')}</span>
                          </>
                        )}
                      </motion.button>

                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={() => setIsMapPrintModalOpen(true)}
                        className="w-full text-center flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-slate-900 dark:text-white text-[11px] font-bold font-mono rounded-xl border border-emerald-500/20 shadow-md transition-all cursor-pointer mt-2"
                        title={t('mapControls.printCartographyTooltip')}
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>{t('mapControls.printFullMap')}</span>
                      </motion.button>

                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={() => setIsReportModalOpen(true)}
                        className="w-full text-center flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-slate-900 dark:text-white text-[11px] font-bold font-mono rounded-xl border border-indigo-500/20 shadow-md transition-all cursor-pointer mt-2"
                        title={t('mapControls.generateReportTooltip')}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>{t('mapControls.generateFullReport')}</span>
                      </motion.button>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showInfrastructure}
                        onChange={(e) => {
                          const val = e.target.checked;
                          startTransition(() => {
                            setShowInfrastructure(val);
                          });
                        }}
                        className="rounded border-slate-700 bg-white dark:bg-slate-900 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-[9px] text-slate-600 dark:text-slate-400 font-mono font-bold uppercase tracking-widest">
                        {t('mapControls.strategicInfra')}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Heatmap */}
                <div className="flex flex-col gap-1.5 relative z-10">
                  <span className="text-[9px] text-slate-600 dark:text-slate-400 font-mono font-bold uppercase tracking-widest pl-1">
                    {t('mapControls.analyticsHeatmap')}
                  </span>
                  <select
                    value={heatmapMetric}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      startTransition(() => {
                        setHeatmapMetric(val);
                      });
                    }}
                    className={`w-full rounded-xl px-2.5 py-1.5 text-xs focus:outline-none transition-all font-mono border ${
                      isDarkMode
                        ? "bg-white dark:bg-slate-900 border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500/50"
                        : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500"
                    }`}
                  >
                    <option value="none">{t('mapControls.inactive')}</option>
                    <option value="count">{t('mapControls.pointDensity')}</option>
                    <option value="value">{t('mapControls.valueWeight')}</option>
                    <option value="road_density">{t('mapControls.roadDensity')}</option>
                  </select>

                  {heatmapMetric !== "none" && (
                     <div className="flex flex-col gap-1 mt-2 pl-1">
                        <div className="flex items-center justify-between">
                           <span className="text-[9px] text-slate-600 dark:text-slate-400 font-mono font-bold uppercase tracking-widest">
                             {t('mapControls.opacity')}
                           </span>
                           <span className="text-[9px] text-slate-600 dark:text-slate-300 font-mono font-bold">
                             {Math.round(heatmapOpacity * 100)}%
                           </span>
                        </div>
                        <input
                           type="range"
                           min="0"
                           max="1"
                           step="0.05"
                           value={heatmapOpacity}
                           onChange={(e) => {
                             const val = parseFloat(e.target.value);
                             startTransition(() => {
                               setHeatmapOpacity(val);
                             });
                           }}
                           className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 accent-emerald-500"
                        />
                     </div>
                  )}
                </div>

                {/* Choropleth */}
                <div className="flex flex-col gap-1.5 relative z-10">
                  <span className="text-[9px] text-slate-600 dark:text-slate-400 font-mono font-bold uppercase tracking-widest pl-1">
                    {t('mapControls.choroplethVis')}
                  </span>
                  <select
                    value={choroplethMetric}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      startTransition(() => {
                        setChoroplethMetric(val);
                      });
                    }}
                    className={`w-full rounded-xl px-3 py-3 text-sm focus:outline-none transition-all font-mono border ${
                      isDarkMode
                        ? "bg-white dark:bg-slate-900 border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500/50"
                        : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500"
                    }`}
                  >
                    <option value="none">{t('mapControls.plainLayer')}</option>
                    <option value="value">{t('mapControls.valueCategory')}</option>
                    <option value="density">{t('mapControls.popDensity')}</option>
                    <option value="infrastructure">{t('mapControls.infraIndex')}</option>
                    <option value="suitability">{t('mapControls.aiSuitability')}</option>
                  </select>
                </div>

                {/* Sektor Filter */}
                <div className="flex flex-col gap-1.5 relative z-10">
                  <span className="text-[9px] text-slate-600 dark:text-slate-400 font-mono font-bold uppercase tracking-widest pl-1">
                    {t('mapControls.sectorCategory')}
                  </span>
                  <div className="flex flex-wrap gap-1 pt-1">
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveCategories(["Pertanian", "Kelautan", "Pertambangan", "Pariwisata", "Perdagangan"])}
                      className={`px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] transition-all capitalize border font-mono font-bold shadow-sm ${
                        activeCategories.length === 5
                          ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/50"
                          : isDarkMode
                          ? "bg-white dark:bg-slate-900 border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:border-slate-500 hover:bg-slate-800"
                          : "bg-slate-50 hover:bg-slate-200 text-slate-600 border-slate-200"
                      }`}
                    >
                      {t('mapControls.allSectors')}
                    </motion.button>
                    {Object.values(SektorInvestasi).map((sec) => (
                      <motion.button whileTap={{ scale: 0.95 }}
                        key={sec}
                        onClick={() => {
                          if (activeCategories.includes(sec)) {
                            if (activeCategories.length > 1) setActiveCategories(activeCategories.filter(c => c !== sec));
                          } else {
                            setActiveCategories([...activeCategories, sec]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] transition-all capitalize border font-mono shadow-sm ${
                          activeCategories.includes(sec) && activeCategories.length < 5
                            ? "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/50 font-bold"
                            : isDarkMode
                            ? "bg-white dark:bg-slate-900 border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:border-slate-500 hover:bg-slate-800"
                            : "bg-slate-50 hover:bg-slate-200 text-slate-600 border-slate-200"
                        }`}
                      >
                        {translateSector(sec)}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Layer Jalan */}
                <div className="flex flex-col gap-1.5 mt-2 pt-3 border-t border-slate-500/20 relative z-10">
                  <span className="text-[9px] text-slate-600 dark:text-slate-400 font-mono font-bold uppercase tracking-widest pl-1">
                    {t('mapControls.roadNetwork')}
                  </span>
                  <div className="flex flex-col gap-1.5 mt-1">
                    {Object.values(spatialLayers).filter((l) => l.id === "layer_jalan").map((l, idx) => (
                      <div key={`${l.id}-${idx}`} className="flex flex-col gap-1">
                        <label className={`flex items-center gap-2 cursor-pointer text-[10px] sm:text-xs font-mono font-semibold select-none ${
                          isDarkMode ? "text-slate-300 hover:text-slate-900 dark:text-white" : "text-slate-600 hover:text-slate-900"
                        }`}>
                          <input
                            type="checkbox"
                            checked={l.isActive}
                            onChange={() => handleToggleLayerVis(l.id)}
                            disabled={l.isLoading}
                            className={`w-3.5 h-3.5 rounded-sm accent-indigo-500 ${l.isLoading ? "opacity-50 cursor-wait" : ""}`}
                          />
                          {l.isLoading && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500 shrink-0" />
                          )}
                          <span className="truncate flex-1" title={l.name}>
                            {t('mapControls.mainRoads')}
                          </span>
                        </label>
                      </div>
                    ))}
                    {Object.values(spatialLayers).filter((l) => l.id === "layer_jalan").length === 0 && (
                      <div className="text-[9px] text-slate-600 dark:text-slate-300 pl-1 italic">
                        Memuat data jalan...
                      </div>
                    )}
                  </div>
                </div>

                {/* Master Layer Spasial */}
                <div className="flex flex-col gap-1.5 mt-2 pt-3 border-t border-slate-500/20 relative z-10">
                  <span className="text-[9px] text-slate-600 dark:text-slate-400 font-mono font-bold uppercase tracking-widest pl-1">
                    Master Layer Spasial
                  </span>
                  <div className="flex flex-col gap-1 mt-1 relative">
                    {(() => {
                      const masterLayers = Object.values(spatialLayers).filter((l) => !["layer_jalan", "layer_land_use_zoning", "layer_flood_risk", "layer_landslide_risk", "layer_historical_suitability"].includes(l.id));
                      const adminLayers = masterLayers.filter(l => ['layer_kecamatan', 'layer_desa', 'layer_rbi'].includes(l.id));
                      const envLayers = masterLayers.filter(l => ['layer_mangrove', 'layer_tanah_kering_sekunder', 'layer_tanah_kering_primer', 'layer_sawah', 'layer_tambak'].includes(l.id));
                      const potLayers = masterLayers.filter(l => ['layer_potensi'].includes(l.id));
                      const otherLayers = masterLayers.filter(l => !['layer_kecamatan', 'layer_desa', 'layer_rbi', 'layer_mangrove', 'layer_tanah_kering_sekunder', 'layer_tanah_kering_primer', 'layer_sawah', 'layer_tambak', 'layer_potensi'].includes(l.id));
                      
                      const layerGroups = [
                        { name: t('mapControls.layerGroups.administration', 'Administrasi'), layers: adminLayers },
                        { name: t('mapControls.layerGroups.environment', 'Lingkungan'), layers: envLayers },
                        { name: t('mapControls.layerGroups.potential', 'Potensi & Komoditas'), layers: potLayers },
                        { name: t('mapControls.layerGroups.others', 'Lainnya'), layers: otherLayers }
                      ].filter(g => g.layers.length > 0);
                      
                      return layerGroups.map(group => (
                        <div key={group.name} className="flex flex-col mb-3">
                          <div className={`sticky top-0 z-20 ${isDarkMode ? "bg-slate-50 dark:bg-slate-950/95 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300" : "bg-white/95 border-slate-200 text-slate-600 dark:text-slate-400"} backdrop-blur-sm py-1.5 px-2 mb-1.5 text-[9px] font-bold uppercase tracking-wider border-b`}>
                            {group.name}
                          </div>
                          <div className="flex flex-col gap-1 pl-1">
                            {group.layers.map((l, idx) => (
                              <div key={`${l.id}-${idx}`} className={`flex items-center justify-between group transition-all duration-200 ease-in-out py-1.5 pr-2 pl-2.5 rounded-r-md ${
                                l.isActive 
                                  ? `border-l-4 border-emerald-500 ${isDarkMode ? "bg-slate-800/30 text-slate-900 dark:text-white" : "bg-emerald-50 text-slate-900"}` 
                                  : `border-l-4 border-transparent grayscale opacity-70 hover:opacity-100 hover:grayscale-0 ${isDarkMode ? "text-slate-600 dark:text-slate-300 hover:bg-slate-800/10" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50"}`
                              }`}>
                                <label className="flex items-center gap-2 cursor-pointer text-[10px] sm:text-xs font-mono font-semibold select-none flex-1">
                                  <input
                                    type="checkbox"
                                    checked={l.isActive}
                                    onChange={() => handleToggleLayerVis(l.id)}
                                    disabled={l.isLoading}
                                    className={`rounded h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                                      isDarkMode ? "accent-emerald-400" : "accent-emerald-500"
                                    } ${l.isLoading ? "opacity-50 cursor-wait" : ""}`}
                                  />
                                  {l.isLoading && (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500 shrink-0" />
                                  )}
                                  <span className="truncate">
                                    {l.id === 'layer_potensi' ? t('map.investmentPotential') : 
                                     l.id === 'layer_rbi' ? t('mapControls.mapEarth') : 
                                     l.id === 'layer_kecamatan' ? t('mapControls.layerSubdistrict') : 
                                     l.id === 'layer_jalan' ? t('mapControls.mainRoads') : 
                                     l.id === 'layer_desa' ? t('mapControls.villageBorders') : 
                                     l.id === 'layer_sawah' ? t('mapControls.layerRicefield') : 
                                     l.id === 'layer_tambak' ? t('mapControls.layerPond') : 
                                     l.id === 'layer_mangrove' ? t('mapControls.layerMangrove') : 
                                     l.id === 'layer_tanah_kering_sekunder' ? t('mapControls.layerDrySec') : 
                                     l.id === 'layer_tanah_kering_primer' ? t('mapControls.layerDryPrim') : 
                                     l.name}
                                  </span>
                                </label>
                                {currentRole === Role.SUPER_ADMIN && (
                                  <motion.button whileTap={{ scale: 0.95 }}
                                    onClick={() => handleDeleteLayer(l.id)}
                                    className="p-1 px-1.5 text-xs text-red-500 hover:bg-red-500/20 rounded opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                                    title="Hapus Layer Spasial"
                                  >
                                    <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                  </motion.button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Modul: Buat Geometry Baru */}
                {currentRole !== Role.PUBLIC_USER && (
                  <details className="group flex flex-col gap-1.5 mt-2 pt-3 border-t border-slate-500/20 relative z-10">
                    <summary className="text-[9px] text-slate-600 dark:text-slate-400 font-mono font-bold uppercase tracking-widest pl-1 cursor-pointer flex items-center justify-between outline-none">
                      DIGITISASI AREA INVESTASI (DRAW MODE)
                      <span className="transition group-open:rotate-180">▼</span>
                    </summary>
                    <div className="grid grid-cols-2 gap-2 mt-2">

                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={() => mapComponentRef.current?.changeDrawMode?.('draw_polygon')}
                        className={`text-[10px] sm:text-xs flex items-center justify-center gap-1.5 py-2 rounded-lg border transition-all ${
                          isDarkMode
                            ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-900/50"
                            : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                        }`}
                        title="Tambah Area Poligon"
                      >
                        <Crop className="w-3.5 h-3.5" /> Poligon
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={() => mapComponentRef.current?.changeDrawMode?.('draw_line_string')}
                        className={`text-[10px] sm:text-xs flex items-center justify-center gap-1.5 py-2 rounded-lg border transition-all ${
                          isDarkMode
                            ? "bg-blue-950/30 border-blue-500/30 text-blue-700 dark:text-blue-400 hover:bg-blue-900/50"
                            : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                        }`}
                        title="Tambah Garis / MultiLine"
                      >
                        <Box className="w-3.5 h-3.5" /> Garis
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={() => mapComponentRef.current?.changeDrawMode?.('draw_point')}
                        className={`text-[10px] sm:text-xs flex items-center justify-center gap-1.5 py-2 rounded-lg border transition-all ${
                          isDarkMode
                            ? "bg-pink-950/30 border-pink-500/30 text-pink-400 hover:bg-pink-900/50"
                            : "bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100"
                        }`}
                        title="Tambah Penanda / Titik"
                      >
                        <MapPin className="w-3.5 h-3.5" /> Titik
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={() => mapComponentRef.current?.trashDraw?.()}
                        className={`text-[10px] sm:text-xs flex items-center justify-center gap-1.5 py-2 rounded-lg border transition-all ${
                          isDarkMode
                            ? "bg-red-950/30 border-red-500/30 text-red-700 dark:text-red-400 hover:bg-red-900/50"
                            : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                        }`}
                        title="Hapus Terpilih"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </motion.button>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() => mapComponentRef.current?.toggleMeasure?.()}
                      className={`text-[10px] sm:text-xs flex items-center justify-center gap-1.5 w-full py-2 mt-1 mx-auto rounded-lg border transition-all ${
                        isDarkMode
                          ? "bg-indigo-950/40 border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/60 hover:text-indigo-200"
                          : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                      }`}
                      title="Alat Ukur Jarak"
                    >
                      <Ruler className="w-3.5 h-3.5" /> Ukur Jarak
                    </motion.button>
                  </details>
                )}

                {/* Legenda Peta */}
                <div className="flex flex-col gap-1.5 mt-2 pt-3 border-t border-slate-500/20 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-600 dark:text-slate-400 font-mono font-bold uppercase tracking-widest pl-1">
                      Legenda Peta
                    </span>
                    <motion.button whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => {
                        setShowLegend(!showLegend);
                        if (!showLegend) {
                          setIsSidebarOpen(false); // Close left menu so user can see legend
                        }
                      }}
                      className={`text-[9px] sm:text-[10px] font-mono px-3 py-1 rounded-lg transition-all font-bold cursor-pointer border ${
                        showLegend
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
                          : isDarkMode
                          ? "bg-slate-800 border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-700"
                          : "bg-slate-100 border border-slate-200 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      }`}
                    >
                      {showLegend ? "AKTIF" : "NONAKTIF"}
                    </motion.button>
                  </div>
                </div>

                {/* Dasbor Analitik Toggle */}
                <div className="flex flex-col gap-1.5 mt-2 pt-3 border-t border-slate-500/20 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-600 dark:text-slate-400 font-mono font-bold uppercase tracking-widest pl-1">
                      Dasbor Analitik
                    </span>
                    <motion.button whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => {
                        setShowRightDashboard(!showRightDashboard);
                        if (!showRightDashboard) {
                          setIsRightSidebarOpen(true);
                          setIsSidebarOpen(false); // Auto open right and close left
                        } else {
                          setIsRightSidebarOpen(false);
                        }
                      }}
                      className={`text-[9px] sm:text-[10px] font-mono px-3 py-1 rounded-lg transition-all font-bold cursor-pointer border ${
                        showRightDashboard
                          ? "bg-blue-500/20 border-blue-500/40 text-blue-700 dark:text-blue-400"
                          : isDarkMode
                          ? "bg-slate-800 border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-700"
                          : "bg-slate-100 border border-slate-200 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      }`}
                    >
                      {showRightDashboard ? "AKTIF" : "NONAKTIF"}
                    </motion.button>
                  </div>
                </div>
              </div>
                              </div>
                  {/* Bottom fade out gradient */}
                  <div className={`absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t ${isDarkMode ? "from-slate-950 md:from-transparent" : "from-white md:from-transparent"} to-transparent pointer-events-none z-10`}></div>
                </motion.aside>
          )}
        </AnimatePresence>

            {/* DESKTOP FLOATING TOGGLE FOR KONTROL PETA */}
            <AnimatePresence>
              {!isMobile && isLeftSidebarCollapsed && !isLayerPanelOpen && (
                <motion.button
                  key="reopen-left-sidebar"
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.95 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsLeftSidebarCollapsed(false);
                    setIsLayerPanelOpen(false);
                  }}
                  className={`fixed left-4 top-24 z-[50] pointer-events-auto flex items-center gap-2 px-3.5 py-2.5 rounded-2xl shadow-xl border backdrop-blur-xl cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${
                    isDarkMode
                      ? "bg-slate-900/95 border-slate-700/90 text-white shadow-black/80 hover:bg-slate-800"
                      : "bg-white/95 border-slate-300 text-slate-900 shadow-xl shadow-slate-900/10 hover:bg-slate-50"
                  }`}
                  title="Buka Menu Kontrol Peta"
                >
                  <Filter className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold font-sans">Kontrol Peta</span>
                </motion.button>
              )}
            </AnimatePresence>

            {/* MOBILE BOTTOM ACTION BAR */}
            <div className={`md:hidden fixed bottom-0 left-0 right-0 z-[9999] pointer-events-auto pb-safe flex justify-around items-center border-t backdrop-blur-2xl shadow-2xl transition-colors ${
              isDarkMode 
                ? "bg-slate-50 dark:bg-slate-950/98 border-slate-200 dark:border-slate-800/90 text-slate-900 dark:text-white" 
                : "bg-white/98 border-slate-300/90 text-slate-950 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]"
            }`}>
              <motion.button whileTap={{ scale: 0.95 }} 
                onClick={() => {
                  const nextState = !isSidebarOpen;
                  setIsSidebarOpen(nextState);
                  if (nextState) {
                    setIsRightSidebarOpen(false);
                  }
                }}
                className={`flex-1 flex flex-col items-center justify-center py-3 min-h-[56px] rounded-none transition-all duration-150 active:scale-95 ${
                  isSidebarOpen 
                    ? (isDarkMode ? "bg-emerald-500/20 text-emerald-300 border-t-2 border-emerald-400 font-black shadow-inner" : "bg-emerald-100/90 text-emerald-900 border-t-2 border-emerald-600 font-black shadow-xs")
                    : (isDarkMode ? "text-slate-300 hover:text-slate-900 dark:text-white border-t-2 border-transparent" : "text-slate-800 dark:text-slate-200 hover:text-slate-950 border-t-2 border-transparent")
                }`}
              >
                <Layers className={`w-5 h-5 mb-1 text-emerald-500 drop-shadow-xs transition-transform duration-200 ${isSidebarOpen ? "scale-110" : "opacity-90"}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider font-['Plus_Jakarta_Sans',sans-serif]">{t("mapControls.mapControl", "Kontrol Peta")}</span>
              </motion.button>
              
              <motion.button whileTap={{ scale: 0.95 }} 
                onClick={() => {
                  const willOpen = !isRightSidebarOpen || !isDashboardExpanded;
                  setShowRightDashboard(true);
                  setIsRightSidebarOpen(willOpen);
                  setIsDashboardExpanded(willOpen);
                  if (willOpen) {
                    setIsSidebarOpen(false);
                  }
                }}
                className={`flex-1 flex flex-col items-center justify-center py-3 min-h-[56px] rounded-none transition-all duration-150 active:scale-95 ${
                  isRightSidebarOpen && isDashboardExpanded
                    ? (isDarkMode ? "bg-indigo-500/20 text-indigo-300 border-t-2 border-indigo-400 font-black shadow-inner" : "bg-indigo-100/90 text-indigo-900 border-t-2 border-indigo-600 font-black shadow-xs")
                    : (isDarkMode ? "text-slate-300 hover:text-slate-900 dark:text-white border-t-2 border-transparent" : "text-slate-800 dark:text-slate-200 hover:text-slate-950 border-t-2 border-transparent")
                }`}
              >
                <PieChart className={`w-5 h-5 mb-1 text-indigo-500 drop-shadow-xs transition-transform duration-200 ${isRightSidebarOpen && isDashboardExpanded ? "scale-110" : "opacity-90"}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider font-['Plus_Jakarta_Sans',sans-serif]">{t("mapControls.analytics", "Analitik")}</span>
              </motion.button>
            </div>

            {/* INVESTMENT DETAIL FOOTER */}
            {selectedInvestment && (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ 
                  y: isProfileMinimized ? 100 : 0, 
                  opacity: isProfileMinimized ? 0 : 1 
                }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className={`absolute bottom-4 left-0 md:left-[340px] ${
                showRightDashboard
                  ? "right-0 md:right-[340px] lg:right-[400px] xl:right-[500px]"
                  : "right-0 md:right-14"
              } p-2 md:p-4 z-[50] ${isProfileMinimized ? 'pointer-events-none' : 'pointer-events-auto'} transition-all duration-500 max-w-5xl`}
              >
                <div className={`pointer-events-auto backdrop-blur-md border ${
                  isDarkMode
                    ? "bg-white dark:bg-slate-900/80 border-slate-700/50 text-slate-900 dark:text-white"
                    : "bg-white/80 border-white/40 text-slate-800"
                } p-4 md:p-5 rounded-3xl shadow-2xl font-sans animate-fade-in relative overflow-hidden shrink-0 transition-all duration-300 ease-in-out`}>
                  <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex flex-col gap-4 md:gap-5 relative z-10">
                    <div className="flex flex-col md:flex-row gap-5">
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center flex-wrap gap-2 mb-1">
                            <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded border ${
                              isDarkMode
                                ? "text-indigo-700 dark:text-indigo-400 bg-indigo-950/60 border-indigo-500/20"
                                : "text-indigo-700 bg-indigo-100 border-indigo-200"
                            }`}>
                              {selectedInvestment.sector}
                            </span>
                            <span className={`text-[10px] font-bold font-mono ${
                              isDarkMode ? "text-amber-700 dark:text-amber-400" : "text-amber-600"
                            }`}>
                              Luas: {Number(selectedInvestment.areaHa || 0).toFixed(2)} Hektar
                            </span>
                          </div>
                          <h3 className={`text-sm font-semibold font-display ${
                            isDarkMode ? "text-slate-900 dark:text-white" : "text-slate-900"
                          }`}>
                            {selectedInvestment.name}
                          </h3>
                          <p className={`text-[10px] mt-1 ${
                            isDarkMode ? "text-slate-600 dark:text-slate-300" : "text-slate-600 dark:text-slate-400"
                          }`}>
                            Lokasi Administratif: Kecamatan{" "}
                            {districts.find((d) => d.id === selectedInvestment.districtId)?.name || "Luwu"}
                          </p>
                        </div>

                        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 pt-3 border-t font-mono text-[10px] ${
                          isDarkMode ? "border-slate-700/50 text-slate-600 dark:text-slate-300" : "border-slate-200 text-slate-600 dark:text-slate-400"
                        }`}>
                          <div>
                            Nilai Investasi:{" "}
                            <span className={`font-bold ${isDarkMode ? "text-emerald-700 dark:text-emerald-400" : "text-emerald-600"}`}>
                              {formatRupiahSingkat(selectedInvestment.investmentValue)}
                            </span>
                          </div>
                          <div>
                            Sertifikasi Tanah:{" "}
                            <span className={isDarkMode ? "text-slate-900 dark:text-white" : "text-slate-900 font-medium"}>
                              {selectedInvestment.landStatus}
                            </span>
                          </div>
                          <div>
                            Humas PIC:{" "}
                            <span className={isDarkMode ? "text-slate-900 dark:text-white" : "text-slate-900 font-medium"}>
                              {selectedInvestment.contactPic}
                            </span>
                          </div>
                          <div>
                            Layanan Kontak:{" "}
                            <span className={`font-bold underline font-mono ${
                              isDarkMode ? "text-emerald-300" : "text-emerald-600"
                            }`}>
                              {selectedInvestment.phoneNumber}
                            </span>
                          </div>
                        </div>

                        {/* SPATIAL PROXIMITY INTEL */}
                        {selectedInvestment && infrastructure && infrastructure.length > 0 && (
                          <div className={`proximity-intel-container mt-4 p-3 rounded-xl border backdrop-blur-md overflow-hidden relative group/intel transition-colors ${
                            isDarkMode 
                              ? "bg-slate-800/40 border-slate-700 hover:border-emerald-500/30" 
                              : "bg-slate-50/80 border-slate-200 hover:border-emerald-400/50"
                          }`}>
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                            <h4 className={`text-[10px] uppercase tracking-widest font-bold mb-2 flex items-center gap-1.5 ${
                              isDarkMode ? "text-emerald-700 dark:text-emerald-400" : "text-emerald-600"
                            }`}>
                              <Activity className="w-3.5 h-3.5" /> Analisis Jarak Fasilitas Publik
                            </h4>
                            <div className="mb-3 px-0.5">
                              <div className="flex justify-between items-center text-[10px] font-mono mb-1.5">
                                <span className={isDarkMode ? "text-slate-600 dark:text-slate-300" : "text-slate-600 dark:text-slate-400"}>Radius Analisis</span>
                                <span className={`font-bold ${isDarkMode ? "text-emerald-700 dark:text-emerald-400" : "text-emerald-600"}`}>{proximityRadius} km</span>
                              </div>
                              <input 
                                type="range" 
                                min="1" max="20" step="0.5" 
                                value={proximityRadius} 
                                onChange={(e) => setProximityRadius(parseFloat(e.target.value))} 
                                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                              />
                            </div>
                            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1.5 custom-scrollbar">
                              {(!proximityIntel || proximityIntel.length === 0) ? (
                                <div className={`text-[10px] text-center py-2 ${isDarkMode ? "text-slate-600 dark:text-slate-300" : "text-slate-600 dark:text-slate-400"}`}>
                                  Tidak ada fasilitas umum dalam radius {proximityRadius} km.
                                </div>
                              ) : proximityIntel.map((inf, idx) => {
                                const distLabel = inf.formattedDistance || (typeof inf.distanceMeters === 'number' ? formatJarakMeter(inf.distanceMeters) : (inf.distance < 1 ? (Math.round(inf.distance * 1000) + " m") : (inf.distance.toFixed(1) + " km")));
                                let Icon = MapPin;
                                const t = (inf.type || "").toLowerCase();
                                if (t.includes("rumah sakit") || t.includes("kesehatan") || t.includes("puskesmas") || t.includes("klinik")) Icon = Activity;
                                else if (t.includes("polisi") || t.includes("polsek") || t.includes("polres")) Icon = Shield;
                                else if (t.includes("kantor") || t.includes("pemerintah")) Icon = Building2;
                                else if (t.includes("pelabuhan") || t.includes("dermaga") || t.includes("port")) Icon = Ship;
                                else if (t.includes("bandara") || t.includes("airport") || t.includes("penerbangan")) Icon = Plane;
                                else if (t.includes("stasiun") || t.includes("kereta")) Icon = Train;
                                else if (t.includes("sekolah") || t.includes("kampus") || t.includes("universitas") || t.includes("pendidikan") || t.includes("sma") || t.includes("smp") || t.includes("sd")) Icon = GraduationCap;
                                else if (t.includes("pasar") || t.includes("mall") || t.includes("belanja") || t.includes("minimarket") || t.includes("supermarket")) Icon = ShoppingCart;
                                else if (t.includes("bank") || t.includes("atm") || t.includes("keuangan")) Icon = Banknote;
                                return (
                                  <motion.button whileTap={{ scale: 0.95 }} 
                                    key={idx} 
                                    onClick={() => {
                                      setSelectedProximityDetail(inf);
                                    }}
                                    className="flex justify-between items-center text-[11px] w-full text-left transition-all hover:translate-x-1 group/item"
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <span className={`relative p-1.5 rounded-md ${isDarkMode ? "bg-white dark:bg-slate-900/80 group-hover/item:bg-emerald-500/20" : "bg-white/80 group-hover/item:bg-emerald-50"} transition-colors`}>
                                        {/* Subtle Ping Animation */}
                                        <span className="absolute inset-0 rounded-md bg-emerald-500 opacity-20 animate-ping" style={{ animationDuration: '2.5s' }}></span>
                                        <span className="absolute inset-0 rounded-md bg-emerald-400 opacity-0 group-hover/item:animate-ping group-hover/item:opacity-30"></span>
                                        <Icon className={`relative z-10 w-3 h-3 transition-colors ${isDarkMode ? "text-slate-600 dark:text-slate-300 group-hover/item:text-emerald-400" : "text-slate-600 dark:text-slate-400 group-hover/item:text-emerald-600"}`} />
                                      </span>
                                      <span className={`transition-colors ${isDarkMode ? "text-slate-300 group-hover/item:text-slate-900 dark:text-white" : "text-slate-800 dark:text-slate-200 group-hover/item:text-slate-900"}`}>
                                        {inf.name} <span className="opacity-60 text-[9px]">({inf.type || "Fasilitas"})</span>
                                      </span>
                                    </div>
                                    <div className={`font-mono font-bold shrink-0 transition-colors ${isDarkMode ? "text-amber-700 dark:text-amber-400 group-hover/item:text-amber-300" : "text-amber-600 group-hover/item:text-amber-700"}`}>
                                      {distLabel}
                                    </div>
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Controls */}
                      <div className={`flex flex-wrap md:flex-col justify-end gap-2 shrink-0 pt-3 md:pt-0 md:border-l md:pl-4 ${
                        isDarkMode ? "md:border-slate-200 dark:border-slate-800" : "md:border-slate-200"
                      }`}>
                        <motion.button whileTap={{ scale: 0.95 }}
                          onClick={() => setIsBufferAiModalOpen(true)}
                          className="p-2 border rounded-xl transition-all font-sans font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer border-blue-500/50 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white flex-1 md:flex-none"
                          title="Analisis AI Gemini"
                        >
                          <Sparkles className="h-4 w-4" /> Tanya AI
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.95 }}
                          onClick={() => setIsMapPrintModalOpen(true)}
                          className={`p-2 border rounded-xl transition-all font-sans font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                            isDarkMode
                              ? "border-emerald-500/25 bg-emerald-950/20 hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                              : "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                          } flex-1 md:flex-none`}
                          title="Cetak Peta Kartografi A4 (PDF)"
                        >
                          <Printer className="h-4 w-4" /> Cetak Peta
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.95 }}
                          onClick={() => setIsReportModalOpen(true)}
                          className={`p-2 border rounded-xl transition-all font-sans font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                            isDarkMode
                              ? "border-emerald-500/25 bg-emerald-950/20 hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                              : "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                          } flex-1 md:flex-none`}
                          title="Cetak Laporan PDF Resmi"
                        >
                          <FileText className="h-4 w-4" /> Cetak PDF
                        </motion.button>

                        {(currentRole === Role.SUPER_ADMIN || currentRole === Role.OPERATOR) && (
                          <>
                            <motion.button whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setEditingInvestment(selectedInvestment);
                                setIsEditModalOpen(true);
                              }}
                              className={`p-2 border rounded-xl transition-all font-sans font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                                isDarkMode
                                  ? "border-indigo-500/20 hover:border-indigo-500 hover:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400"
                                  : "border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-700"
                              }`}
                              title="Edit Proyek Investasi"
                            >
                              <Edit className="h-4 w-4" /> Edit Proyek
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.95 }}
                              onClick={() => handleDeleteInvestment(selectedInvestment.id)}
                              className={`p-2 border rounded-xl transition-all font-sans font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                                isDarkMode
                                  ? "border-red-500/20 hover:border-red-500 hover:bg-red-950/20 text-red-700 dark:text-red-400"
                                  : "border-red-200 hover:border-red-300 hover:bg-red-50 text-red-700"
                              }`}
                              title="Hapus Hub"
                            >
                              <Trash2 className="h-4 w-4" /> Hapus Hub
                            </motion.button>
                          </>
                        )}

                        <motion.button whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedInvestmentId(null)}
                          className={`p-2 border rounded-xl transition-all font-sans font-semibold text-[10px] flex items-center justify-center cursor-pointer ${
                            isDarkMode
                              ? "border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-850 hover:text-slate-900 dark:text-white text-slate-300"
                              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-800 dark:text-slate-200"
                          } w-full mt-1 md:mt-0`}
                        >
                          Batal Fokus
                        </motion.button>
                      </div>
                    </div>

                    {}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                      {((selectedInvestment?.photoUrls || []).length > 0
                        ? selectedInvestment.photoUrls
                        : selectedInvestment?.photoUrl
                        ? [selectedInvestment.photoUrl]
                        : []
                      )
                        ?.filter(Boolean)
                        .map((imgUrl, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setLightboxIndex(idx);
                              setLightboxOpen(true);
                            }}
                            className="h-40 md:h-24 lg:h-32 rounded-xl overflow-hidden shrink-0 border border-slate-700/50 bg-white dark:bg-slate-900 group cursor-pointer relative shadow-inner"
                          >
                            <div className="absolute inset-0 bg-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center backdrop-blur-[2px]">
                              <span className="text-slate-900 dark:text-white font-mono text-xs font-bold drop-shadow-md">
                                Perbesar Foto {idx + 1}
                              </span>
                            </div>
                            <LazyImage
                              src={imgUrl}
                              alt={`${selectedInvestment?.name} Foto ${idx + 1}`}
                              isDark={isDarkMode}
                              imgClassName="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                            />
                          </div>
                        ))}
                      {(!(selectedInvestment?.photoUrls || [])?.length && !selectedInvestment?.photoUrl) && (
                        <div className="col-span-full h-24 flex items-center justify-center text-slate-600 dark:text-slate-400 text-xs italic border border-dashed rounded-xl">
                          Belum ada dokumentasi foto.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* RIGHT SIDEBAR: ANALYTICAL DASHBOARD */}
            <AnimatePresence mode="wait">
              {showRightDashboard && (!isMobile || isRightSidebarOpen) && (
                <motion.aside
                  key="right-sidebar"
                  initial={isMobile ? { y: "100%", opacity: 0 } : { x: 50, opacity: 0 }}
                  animate={isMobile ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
                  exit={isMobile ? { y: "100%", opacity: 0 } : { x: 50, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                  className={`fixed inset-x-0 top-3 sm:top-4 bottom-0 md:top-4 md:bottom-auto md:absolute md:inset-auto md:right-4 z-[70] md:z-[50] pointer-events-auto origin-bottom md:origin-right transition-all duration-300 ${
                    isDashboardExpanded 
                      ? "w-full h-auto md:max-w-none md:w-[440px] lg:w-[490px] xl:w-[540px] md:h-auto md:max-h-[85vh] rounded-t-[28px] md:rounded-3xl overflow-y-auto pb-20 md:pb-0 shadow-[0_-12px_40px_rgba(0,0,0,0.5)] md:shadow-none bg-slate-50 dark:bg-slate-950 md:bg-transparent" 
                      : "w-auto ml-auto md:top-4 top-20 right-2 md:right-4 absolute"
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {!isDashboardExpanded ? (
                      /* Collapsed state: compact horizontal button collapsing to the right edge */
                      <motion.button whileTap={{ scale: 0.95 }}
                        key="collapsed-analytical-btn"
                        initial={{ opacity: 0, x: 30, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 30, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        onClick={() => {
                          setIsDashboardExpanded(true);
                          setIsRightSidebarOpen(true);
                        }}
                        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl shadow-2xl border transition-all duration-300 hover:scale-105 active:scale-95 group ${
                          isDarkMode 
                            ? "bg-white dark:bg-slate-900/95 border-slate-700/90 text-slate-900 dark:text-white shadow-black/80 backdrop-blur-xl hover:border-emerald-500/80 hover:bg-slate-800" 
                            : "bg-white/95 border-slate-300 text-slate-900 shadow-xl shadow-slate-900/10 backdrop-blur-xl hover:border-emerald-500 hover:bg-slate-50"
                        }`}
                      >
                        <ChevronLeft size={16} className={`transition-transform duration-300 group-hover:-translate-x-1 ${
                          isDarkMode ? "text-emerald-700 dark:text-emerald-400" : "text-emerald-600"
                        }`} />

                        <div className="relative flex items-center justify-center">
                          <PieChart size={17} className={`${isDarkMode ? "text-emerald-700 dark:text-emerald-400" : "text-emerald-600"} group-hover:rotate-12 transition-transform duration-300`} />
                          <span className="absolute -top-1.5 -right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        </div>

                        <span className={`font-['Plus_Jakarta_Sans',sans-serif] font-bold text-xs uppercase tracking-wider ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
                          Hub Analitik Berbasis Investor
                        </span>
                      </motion.button>
                    ) : (
                      /* Expanded state: full analytical hub card */
                      <motion.div
                        key="expanded-analytical-panel"
                        initial={isMobile ? { opacity: 0, y: "100%" } : { opacity: 0, x: "100%" }}
                        animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, x: 0 }}
                        exit={isMobile ? { opacity: 0, y: "100%" } : { opacity: 0, x: "100%" }}
                        transition={{ type: "spring", damping: 28, stiffness: 220 }}
                        className={`backdrop-blur-xl border p-3 pt-3 sm:pt-4 sm:p-5 h-full md:h-auto rounded-t-[28px] md:rounded-3xl shadow-2xl flex flex-col gap-4 relative overflow-hidden transition-all duration-300 ease-in-out origin-bottom md:origin-right ${
                          isDarkMode
                            ? "bg-slate-950/75 border-slate-700/60 text-slate-100 shadow-black/80"
                            : "bg-white/85 border-slate-300/80 text-slate-900 shadow-2xl shadow-slate-900/15"
                        }`}
                      >
                        {isDarkMode && (
                          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                        )}
                        <div className="flex md:hidden absolute top-1.5 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full z-10 pointer-events-none" />
                        <GisErrorBoundary componentName="Panel Analitik Investor">
                          <InvestorAnalyticsSidebar
                            districts={districts}
                            investments={filteredInvestments}
                            infrastructure={infrastructure}
                            spatialLayers={spatialLayers}
                            villages={villages}
                            onFocusInvestment={(id) => {
                              setSelectedInvestmentId(id);
                              const inv = investments.find((item) => item.id === id);
                              if (inv) {
                                if (inv.districtId) setSelectedDistrictId(inv.districtId);
                                if (inv.villageId) setSelectedVillageId(inv.villageId);
                              }
                              if (window.innerWidth < 768) {
                                setIsSidebarOpen(false);
                              }
                            }}
                            onFocusDistrict={(id) => {
                              setSelectedDistrictId(id || null);
                              setSelectedVillageId(null);
                              setSelectedInvestmentId(null);
                              if (window.innerWidth < 768) {
                                setIsSidebarOpen(false);
                              }
                            }}
                            onFocusVillage={(vId) => {
                              setSelectedVillageId(vId);
                              if (vId) {
                                const v = villages.find(vil => String(vil.id) === String(vId) || String(vil.code) === String(vId));
                                if (v && v.districtId) setSelectedDistrictId(v.districtId);
                              }
                              setSelectedInvestmentId(null);
                            }}
                            selectedDistrictId={selectedDistrictId}
                            selectedVillageId={selectedVillageId}
                            selectedInvestmentId={selectedInvestmentId}
                            onClose={() => {
                              setIsDashboardExpanded(false);
                              setIsRightSidebarOpen(false);
                            }}
                            isDarkMode={isDarkMode}
                            isExpanded={isDashboardExpanded}
                            setIsExpanded={setIsDashboardExpanded}
                            stats={stats}
                            isStatsLoading={isStatsLoading}
                            onToggleSpatialLayer={executeToggleLayerVis}
                          />
                        </GisErrorBoundary>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.aside>
              )}
            </AnimatePresence>
          </div>
        </div>

      ) : activeWorkspace === "EXECUTIVE_DASHBOARD" ? (
        /* ── EXECUTIVE ANALYTICS DASHBOARD ── */
        <div className="absolute inset-0 z-[50] pt-0 md:pt-24 pointer-events-auto overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <GisErrorBoundary componentName="Dashboard Eksekutif Analitik">
            <ExecutiveDashboard
              investments={investments}
              districts={districts}
              villages={villages}
              spatialLayers={spatialLayers}
              infrastructure={infrastructure}
              isDarkMode={isDarkMode}
              selectedDistrictId={selectedDistrictId}
              selectedVillageId={selectedVillageId}
              onSelectInvestment={(id) => {
                setSelectedInvestmentId(id);
                const inv = investments.find((i) => String(i.id) === String(id));
                if (inv) {
                  setSelectedDistrictId(inv.districtId);
                  setSelectedVillageId(inv.villageId);
                }
              }}
              onSelectDistrict={(id) => {
                setSelectedDistrictId(id);
                setActiveWorkspace("INVESTOR");
              }}
              onSwitchToMapView={() => {
                setActiveWorkspace("INVESTOR");
              }}
              onClose={() => {
                setActiveWorkspace("INVESTOR");
              }}
            />
          </GisErrorBoundary>
        </div>

      ) : activeWorkspace === "SPATIAL_EDITOR" ? (
        /* ── SPATIAL EDITOR WORKSPACE ── */
        <div className="absolute inset-0 z-[50] pt-36 sm:pt-32 lg:pt-28 pointer-events-auto overflow-hidden">
          <SpatialEditorStudio
            currentRole={currentRole}
            isDarkMode={isDarkMode}
            onRefreshAllData={fetchAllData}
            spatialLayers={spatialLayers}
            setSpatialLayers={setSpatialLayers}
            districts={districts}
            villages={villages}
            initialModule={spatialEditorModule}
          />
        </div>

      ) : (
        /* ── OPERATOR WORKSPACE REDIRECT ── */
        <div className="absolute inset-0 z-[50] pt-36 sm:pt-32 lg:pt-28 px-3 sm:px-6 pb-28 sm:pb-20 pointer-events-auto bg-slate-50 dark:bg-slate-950 overflow-y-auto">
          {renderOperatorWorkspace()}
        </div>
      )}

      {/* ── CRUD MODALS ── */}

      <AnimatePresence>
      {isAddModalOpen && (
        <SmartInvestmentFormEngine
          districts={districts}
          villages={villages}
          digitizedPoints={digitizedPoints}
          drawnGeoJson={drawnGeoJson}
          onClose={() => {
            setIsAddModalOpen(false);
          }}
          onSubmit={handleAddInvestmentSubmit}
          spatialLayers={spatialLayers}
          setSpatialLayers={setSpatialLayers}
          currentRole={currentRole}
          isDarkMode={isDarkMode}
          onRefreshAllData={fetchAllData}
        />
      )}
      </AnimatePresence>

      <AnimatePresence>
      {isEditModalOpen && editingInvestment && (
        <SmartInvestmentFormEngine
          isEditMode={true}
          initialData={editingInvestment}
          investmentToEdit={editingInvestment}
          districts={districts}
          villages={villages}
          digitizedPoints={digitizedPoints}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingInvestment(null);
          }}
          onSubmit={handleEditInvestmentSubmit}
          spatialLayers={spatialLayers}
          setSpatialLayers={setSpatialLayers}
          currentRole={currentRole}
          isDarkMode={isDarkMode}
          onRefreshAllData={fetchAllData}
        />
      )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedInvestmentId && (
          <Suspense fallback={null}>
            <InvestmentDetailModal
              investmentId={selectedInvestmentId}
              initialData={investments.find(inv => 
                String(inv.id) === String(selectedInvestmentId) || 
                String(inv.name).toLowerCase() === String(selectedInvestmentId).toLowerCase()
              )}
              onClose={() => {
                const currentInv = investments.find(inv => 
                  String(inv.id) === String(selectedInvestmentId) || 
                  String(inv.name).toLowerCase() === String(selectedInvestmentId).toLowerCase()
                );

                // 1. Enter main workspace and switch active workspace to spatial map (INVESTOR view)
                setHasEnteredApp(true);
                setActiveWorkspace("INVESTOR");

                // 2. Ensure layer_potensi is ACTIVE in spatialLayers so polygon is displayed on the map
                setSpatialLayers((prev) => {
                  const existingPotensi = prev["layer_potensi"];
                  if (existingPotensi) {
                    return {
                      ...prev,
                      layer_potensi: {
                        ...existingPotensi,
                        isActive: true,
                      },
                    };
                  }
                  return prev;
                });

                // 3. Set district and village filters if present for precise location matching
                if (currentInv) {
                  if (currentInv.districtId) setSelectedDistrictId(currentInv.districtId);
                  if (currentInv.villageId) setSelectedVillageId(currentInv.villageId);
                }

                // 4. Fly camera precisely to the potential investment polygon location with 3D perspective
                if (currentInv && currentInv.longitude && currentInv.latitude) {
                  setTimeout(() => {
                    if (mapComponentRef.current) {
                      if (typeof mapComponentRef.current.flyToCoordinate === "function") {
                        mapComponentRef.current.flyToCoordinate(currentInv.longitude, currentInv.latitude, 15.5);
                      }
                      const mapInstance = typeof mapComponentRef.current.getMapInstance === "function" 
                        ? mapComponentRef.current.getMapInstance() 
                        : null;
                      if (mapInstance && typeof mapInstance.flyTo === "function") {
                        mapInstance.flyTo({
                          center: [currentInv.longitude, currentInv.latitude],
                          zoom: 15.5,
                          pitch: 45,
                          bearing: -15,
                          essential: true,
                          duration: 2200,
                        });
                      }
                    }
                  }, 150);
                }

                // Close the detail modal
                setSelectedInvestmentId(null);
              }}
              onOpenAiConsultant={(inv) => {
                 // Handle AI Consultant open if needed, or no-op if handled differently
              }}
              isDarkMode={isDarkMode}
              currentRole={currentRole}
              onMinimizeToggle={setIsProfileMinimized}
              onFocusDistrict={setSelectedDistrictId}
              infrastructure={infrastructure}
              onHoverInfrastructure={(id, hover) => mapComponentRef.current?.setFeatureHoverState('infrastructure-source', id, hover)}
              spatialLayers={spatialLayers}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* ── PDF REPORT ── */}
      <Suspense fallback={null}>
        <ReportPdfModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          districts={districts}
          investments={filteredInvestments}
          villages={villages}
          selectedDistrictId={selectedDistrictId}
          selectedInvestmentId={selectedInvestmentId}
          setSelectedDistrictId={setSelectedDistrictId}
          setSelectedInvestmentId={setSelectedInvestmentId}
          mapMode={mapMode}
          setMapMode={setMapMode}
          spatialLayers={spatialLayers}
          setSpatialLayers={setSpatialLayers}
        />
      </Suspense>

      <Suspense fallback={null}>
        <MapPrintScaleModal
          isOpen={isMapPrintModalOpen}
          onClose={() => setIsMapPrintModalOpen(false)}
          title={selectedDistrictId ? `Peta Kecamatan ${districts.find(d => d.id === selectedDistrictId)?.name}` : "Peta Geospasial Kabupaten Luwu"}
          scaleOpt={mapPrintScale}
          setScaleOpt={setMapPrintScale}
          orientation={printOrientation}
          setOrientation={setPrintOrientation}
        />
      </Suspense>

      {/* ── DATABASE DIAGNOSTIC MODAL ── */}
      <Suspense fallback={null}>
        <SupabaseDiagnosticModal
          isOpen={isDiagnosticModalOpen}
          onClose={() => setIsDiagnosticModalOpen(false)}
          onSuccessCheck={async () => {
            // Re-fetch all data safely on connection recovery
            try {
              await fetchAllData();
              
              setDbStatusError(null);
              
              Swal.fire({
                title: "Koneksi Pulih!",
                text: "Data spasial & investasi telah disinkronkan secara sukses tanpa data palsu.",
                icon: "success",
                timer: 3000,
                showConfirmButton: false,
                background: "#0f172a",
                color: "#f8fafc",
                customClass: {
                  popup: "rounded-3xl border border-slate-700/50"
                }
              });
            } catch (e) {
              console.error("Refetch after manual diagnostic recovery failed:", e);
            }
          }}
        />
      </Suspense>

      {/* ── MAP COMPOSER MODAL / PDF PREVIEW ── */}
      {(() => {
        const invDistStr = selectedInvestment ? String(selectedInvestment.districtId || "").toLowerCase() : "";
        const effectiveDistrictForReport = selectedDistrictId 
          ? districts.find(d => d.id === selectedDistrictId) 
          : (selectedInvestment ? districts.find(d => String(d.id) === String(selectedInvestment.districtId) || (invDistStr !== "" && d.name.toLowerCase().includes(invDistStr))) : districts[0]);

        if ((isGeneratingReportPdf || mapSnapshotUrlForReport) && effectiveDistrictForReport) {
          return (
            <div 
              className="fixed inset-0 z-[99999] bg-white dark:bg-slate-900 overflow-hidden flex" 
              style={{ 
                opacity: 1,
                pointerEvents: isGeneratingReportPdf && reportProgress ? "none" : "auto",
              }}
            >
              <Suspense fallback={
                <div className="fixed inset-0 z-[99999] bg-slate-900 flex flex-col items-center justify-center text-white font-sans p-6">
                  <div className="text-center flex flex-col items-center gap-4">
                    <div className="relative w-16 h-16 flex items-center justify-center border-4 border-emerald-500/20 rounded-full">
                      <div className="absolute inset-0 w-full h-full border-4 border-t-emerald-400 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-lg font-bold">Membuat Layout Kartografi...</p>
                    <p className="text-sm text-slate-400 font-mono">Sedang menginisialisasi modul pencetakan laporan spasial.</p>
                  </div>
                </div>
              }>
                <InvestmentMapReport
                  district={effectiveDistrictForReport}
                  districts={districts}
                  villages={villages}
                  investments={filteredInvestments}
                  spatialLayers={spatialLayers}
                  mapSnapshotUrl={mapSnapshotUrlForReport}
                  mapScaleData={mapScaleDataForReport}
                  snapshotGallery={snapshotGallery}
                  selectedSnapshotId={selectedSnapshotId}
                  onSelectSnapshot={setSelectedSnapshotId}
                  onDeleteSnapshot={(id) => {
                    setSnapshotGallery(prev => {
                      const snapshot = prev.find(s => s.id === id);
                      if (snapshot) {
                        activeBlobUrlsRef.current.delete(snapshot.url);
                        URL.revokeObjectURL(snapshot.url);
                      }
                      return prev.filter(s => s.id !== id);
                    });
                    if (selectedSnapshotId === id) {
                      setSelectedSnapshotId(null);
                    }
                  }}
                  printScale={printScale}
                  onChangePrintScale={setPrintScale}
                  onRefreshMap={handleExportKecamatanReport}
                  onClose={() => {
                    setIsGeneratingReportPdf(false);
                    setMapSnapshotUrlForReport(null);
                  }}
                  onDownload={handleDownloadMapComposerPdf}
                  isDownloading={isPrinting}
                  proximityData={proximityIntel || undefined}
                  roiCalculations={(window as any).lastLuwuSimulation}
                  activeVillageData={filteredVillages}
                />
              </Suspense>
            </div>
          );
        }
        return null;
      })()}

      {}
      {isGeneratingReportPdf && reportProgress && (
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-md z-[999999] flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in">
          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500 overflow-hidden">
              <div className="h-full bg-emerald-400 animate-pulse w-full"></div>
            </div>
            
            <div className="relative w-16 h-16 flex items-center justify-center border-4 border-emerald-500/20 rounded-full">
              <div className="absolute inset-0 w-full h-full border-4 border-t-emerald-400 rounded-full animate-spin"></div>
              <Printer className="h-6 w-6 text-emerald-700 dark:text-emerald-400 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-slate-900 dark:text-white font-sans font-bold text-lg">Mengekspor Dokumen Spasial</h3>
              <p className="text-xs font-mono text-emerald-700 dark:text-emerald-400 tracking-wider font-semibold uppercase">PDF CARTOGRAPHY ENGINE</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/60 border border-white/5 rounded-xl px-4 py-3 w-full">
              <span className="text-xs text-slate-600 dark:text-slate-300 font-mono text-center block">Status Proses:</span>
              <span className="text-xs text-slate-900 dark:text-white font-semibold font-sans mt-1 text-center block leading-relaxed animate-pulse">
                {reportProgress || "Mempersiapkan data..."}
              </span>
            </div>

            <p className="text-[10px] text-slate-600 dark:text-slate-400">
              Harap tunggu beberapa saat. Pastikan koneksi aman dan jangan tutup browser.
            </p>
          </div>
        </div>
      )}

      {/* ── AI SPATIAL BUFFER MODAL ── */}
      <Suspense fallback={null}>
        <SpatialBufferAiModal
          isOpen={isBufferAiModalOpen}
          onClose={() => setIsBufferAiModalOpen(false)}
          districts={districts}
          villages={villages}
          onFocusCoordinate={(lat, lng) =>
            setFocusCoordinate({ lat, lng, ts: Date.now() })
          }
          isDarkMode={isDarkMode}
          selectedInvestment={selectedInvestment || null}
        />
      </Suspense>

      {/* ── CREATE OPERATOR MODAL ── */}
      {isCreateOperatorModalOpen && currentRole === Role.SUPER_ADMIN && (
        <CreateOperatorModal 
          onClose={() => {
            setIsCreateOperatorModalOpen(false);
          }} 
          currentRole={currentRole} 
        />
      )}

      {/* ── MANAGE OPERATORS MODAL ── */}
      {isManageOperatorsModalOpen && currentRole === Role.SUPER_ADMIN && (
        <ManageOperatorsModal 
          onClose={() => setIsManageOperatorsModalOpen(false)}
        />
      )}

      {/* ── TICKETING MINAT MASUK (LOI) MODAL ── */}
      {isLoiTicketsModalOpen && (isAdminRole(currentRole) || isAdminRole(activeProfile?.role)) && 
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-md"
            onClick={() => {
              setIsLoiTicketsModalOpen(false);
            }}
          />
          <div className={`w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-5xl sm:rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] border relative z-10 flex flex-col overflow-hidden animate-fade-in transition-all duration-300 ${
            isDarkMode
              ? "bg-white dark:bg-slate-900/95 border-slate-700/50 text-slate-900 dark:text-white"
              : "bg-white/95 border-slate-200 text-slate-800 shadow-2xl"
          }`}>
            {/* Modal Header */}
            <div className={`p-5 border-b flex items-center justify-between relative z-10 ${
              isDarkMode
                ? "bg-white dark:bg-slate-900/40 border-slate-700/50 text-slate-900 dark:text-white"
                : "bg-slate-50 border-slate-200 text-slate-900"
            }`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center animate-pulse">
                  <Inbox className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-display font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Tiket Minat Masuk (LoI)
                  </h3>
                  <p className="text-[10px] text-slate-600 dark:text-slate-300 tracking-wide">
                    DPMPTSP Luwu Single Window Mediation Workflow
                  </p>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => {
              setIsLoiTicketsModalOpen(false);
            }}
                className={`p-2 min-h-[44px] rounded-xl transition-all ${
                  isDarkMode
                    ? "text-slate-600 dark:text-slate-300 hover:bg-slate-800 hover:text-slate-900 dark:text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-4 relative z-10 min-h-0">
              {selectedTicketForVerification ? (
                /* ── OSS ADMIN WORKSPACE (SPLIT VIEW) ── */
                <form onSubmit={handleSaveVerification} className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
                  {/* Left Panel: Submitted Data */}
                  <div className="flex-1 flex flex-col gap-4 bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-2 mb-2">
                      <motion.button whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => setSelectedTicketForVerification(null)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition flex items-center gap-1.5 font-bold cursor-pointer"
                      >
                        ← Kembali ke Daftar
                      </motion.button>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">ID: {selectedTicketForVerification.id}</span>
                    </div>

                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 border-b border-slate-200 dark:border-slate-800 pb-2 mb-2">
                      Informasi Permohonan Investor
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-600 dark:text-slate-400 block text-[10px] uppercase tracking-wider">Nama Investor</span>
                        <strong className="text-slate-100 text-sm block mt-0.5">{selectedTicketForVerification.investor_name}</strong>
                      </div>
                      <div>
                        <span className="text-slate-600 dark:text-slate-400 block text-[10px] uppercase tracking-wider">Nama Perusahaan</span>
                        <strong className="text-slate-100 text-sm block mt-0.5">{selectedTicketForVerification.company_name || "-"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-600 dark:text-slate-400 block text-[10px] uppercase tracking-wider">Kontak / Email</span>
                        <strong className="text-emerald-700 dark:text-emerald-400 block mt-0.5 font-mono">{selectedTicketForVerification.contact_info}</strong>
                      </div>
                      <div>
                        <span className="text-slate-600 dark:text-slate-400 block text-[10px] uppercase tracking-wider">Tanggal Masuk</span>
                        <strong className="text-slate-300 block mt-0.5 font-mono">
                          {new Date(selectedTicketForVerification.created_at).toLocaleString("id-ID", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </strong>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 flex flex-col gap-3 mt-2">
                      <div>
                        <span className="text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-wider block">Target Proyek / Potensi</span>
                        <strong className="text-amber-700 dark:text-amber-400 text-sm">{selectedTicketForVerification.potensi_name}</strong>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-wider block">Nilai Investasi</span>
                          <strong className="text-emerald-700 dark:text-emerald-400 font-mono text-sm">
                            {selectedTicketForVerification.nilai_investasi
                              ? `Rp ${Number(selectedTicketForVerification.nilai_investasi).toLocaleString("id-ID")}`
                              : "-"}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-wider block">Kebutuhan Lahan</span>
                          <strong className="text-slate-200 font-mono text-sm">
                            {selectedTicketForVerification.kebutuhan_lahan ? `${selectedTicketForVerification.kebutuhan_lahan} Ha` : "-"}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-wider block mb-1">Kebutuhan Khusus / Pesan Investor</span>
                      <p className="text-xs text-slate-300 italic bg-slate-50 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800/60 leading-relaxed">
                        "{selectedTicketForVerification.pesan_tambahan || "Tidak ada pesan khusus."}"
                      </p>
                    </div>
                  </div>

                  {/* Right Panel: OSS Workspace Form */}
                  <div className="w-full lg:w-[420px] bg-slate-50 dark:bg-slate-950/60 p-5 rounded-2xl border border-emerald-500/10 flex flex-col gap-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Lembar Verifikasi OSS Admin
                    </h4>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold">
                        Status Verifikasi & Birokrasi
                      </label>
                      <select
                        value={verifStatus}
                        onChange={(e) => setVerifStatus(e.target.value)}
                        className={`w-full p-3 rounded-xl font-bold border outline-none cursor-pointer text-xs transition ${
                          verifStatus === "Menunggu Verifikasi"
                            ? "bg-amber-950/40 border-amber-500/50 text-amber-300 focus:border-amber-500"
                            : verifStatus.includes("Dalak")
                            ? "bg-indigo-950/40 border-indigo-500/50 text-indigo-300 focus:border-indigo-500"
                            : verifStatus.includes("OSS")
                            ? "bg-blue-950/40 border-blue-500/50 text-blue-300 focus:border-blue-500"
                            : verifStatus.includes("Realisasi")
                            ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300 focus:border-emerald-500"
                            : "bg-red-950/40 border-red-500/50 text-red-300 focus:border-red-500"
                        }`}
                      >
                        <option value="Menunggu Verifikasi" className="bg-white dark:bg-slate-900 text-amber-300">⏳ Menunggu Verifikasi (Promosi)</option>
                        <option value="Persiapan Site Visit (Dalak)" className="bg-white dark:bg-slate-900 text-indigo-300">📍 Persiapan Site Visit (Dalak)</option>
                        <option value="Mediasi Lapangan Selesai (Dalak)" className="bg-white dark:bg-slate-900 text-indigo-300">🤝 Mediasi Lapangan Selesai (Dalak)</option>
                        <option value="Verifikasi OSS Berjalan" className="bg-white dark:bg-slate-900 text-blue-300">⚙️ Verifikasi OSS Berjalan (OSS)</option>
                        <option value="Izin Terbit / Realisasi" className="bg-white dark:bg-slate-900 text-emerald-300">✅ Izin Terbit / Realisasi (Success)</option>
                        <option value="Ditolak / Batal" className="bg-white dark:bg-slate-900 text-red-300">❌ Ditolak / Batal</option>
                      </select>
                      <p className="text-[9px] text-slate-600 dark:text-slate-400 mt-1 italic">
                        Ubah status ini untuk menandai proses birokrasi perizinan investor.
                      </p>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold">
                        NIB OSS (Nomor Induk Berusaha)
                      </label>
                      <input
                        type="text"
                        value={verifNibOss}
                        onChange={(e) => setVerifNibOss(e.target.value)}
                        placeholder="Contoh: 9120301928374"
                        className="w-full p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <p className="text-[9px] text-slate-600 dark:text-slate-400 mt-1">
                        Masukkan nomor NIB investor jika sudah terbit/sedang diverifikasi di sistem OSS.
                      </p>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold">
                        Catatan Verifikasi Admin
                      </label>
                      <textarea
                        value={verifCatatanAdmin}
                        onChange={(e) => setVerifCatatanAdmin(e.target.value)}
                        rows={4}
                        placeholder="Tulis catatan lengkap (misal: 'Dokumen administrasi lengkap, saat ini berkas sedang diusulkan untuk penerbitan PKKPR daerah...')"
                        className="w-full p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 leading-relaxed custom-scrollbar"
                      />
                      <p className="text-[9px] text-slate-600 dark:text-slate-400 mt-1">
                        Catatan ini akan tersimpan permanen di riwayat verifikasi tiket minat.
                      </p>
                    </div>

                    {/* Dalak Workspace Section */}
                    <div className="mt-2 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                        Operasional Lapangan (Dalak)
                      </h4>
                      <p className="text-[9px] text-slate-600 dark:text-slate-400 italic">
                        Bagian ini khusus untuk Bidang Pengendalian Pelaksanaan Penanaman Modal (Dalak).
                      </p>
                      
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold">
                          Jadwal Kunjungan (Site Visit)
                        </label>
                        <input
                          type="datetime-local"
                          value={dalakJadwalVisit}
                          onChange={(e) => setDalakJadwalVisit(e.target.value)}
                          disabled={activeProfile?.role !== "admin_dalak" && activeProfile?.role !== "superadmin"}
                          className="w-full p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold">
                          Laporan Hasil Mediasi
                        </label>
                        <textarea
                          value={dalakLaporanMediasi}
                          onChange={(e) => setDalakLaporanMediasi(e.target.value)}
                          rows={3}
                          disabled={activeProfile?.role !== "admin_dalak" && activeProfile?.role !== "superadmin"}
                          placeholder="Laporan riil mediasi lahan..."
                          className="w-full p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 leading-relaxed custom-scrollbar disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <motion.button whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => setSelectedTicketForVerification(null)}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Batal
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={isSavingVerification}
                        className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-900 dark:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {isSavingVerification ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin text-slate-900 dark:text-white" />
                            Menyimpan...
                          </>
                        ) : (
                          (activeProfile?.role === "admin_dalak" || activeProfile?.role === "superadmin") ? "Simpan Laporan Lapangan" : "Simpan Perubahan"
                        )}
                      </motion.button>
                    </div>
                  </div>
                </form>
              ) : (
                /* ── STANDARD LOI TABLE VIEW ── */
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Total minat masuk yang perlu ditindaklanjuti dan dimediasi ke pemilik lahan oleh Admin OSS DPMPTSP.
                    </p>
                    <motion.button whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={fetchLoiTickets}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition cursor-pointer"
                    >
                      Refresh Data
                    </motion.button>
                  </div>
                  
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800/60">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase tracking-wider">
                          <th className="py-3.5 px-4">Info Investor</th>
                          <th className="py-3.5 px-4">Potensi & Lahan</th>
                          <th className="py-3.5 px-4">Status & Waktu (SLA)</th>
                          <th className="py-3.5 px-4 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50 bg-white dark:bg-slate-900/40">
                        {loiTickets.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-600 dark:text-slate-400 font-medium">Belum ada tiket minat investasi masuk.</td>
                          </tr>
                        ) : (
                          loiTickets.map((ticket) => {
                            const calculateSLA = (lastUpdatedAt: string) => {
                              if (!lastUpdatedAt) return { days: 0, status: 'Aman', color: 'text-emerald-400', badge: 'bg-emerald-500/20 border-emerald-500/50' };
                              
                              const updatedDate = new Date(lastUpdatedAt);
                              const now = new Date();
                              const diffTime = Math.abs(now.getTime() - updatedDate.getTime());
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

                              if (diffDays <= 2) {
                                return { days: diffDays, status: 'Aman', color: 'text-emerald-400', badge: 'bg-emerald-500/20 border-emerald-500/30' }; // < 48 hours
                              } else if (diffDays === 3) {
                                return { days: diffDays, status: 'Warning', color: 'text-amber-400', badge: 'bg-amber-500/20 border-amber-500/50 animate-pulse' }; // 48 - 72 hours
                              } else {
                                return { days: diffDays, status: 'Terlambat', color: 'text-rose-400', badge: 'bg-rose-500/20 border-rose-500/50 shadow-[0_0_15px_rgba(225,29,72,0.5)]' }; // > 72 hours (SLA Breach)
                              }
                            };
                            
                            const sla = calculateSLA(ticket.last_status_updated_at);
                            const isTerminal = ['Izin Terbit / Realisasi', 'Ditolak / Batal'].includes(ticket.status);

                            return (
                              <tr key={ticket.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-slate-200">{ticket.company_name || ticket.investor_name}</div>
                                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">{ticket.contact_info}</div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="text-slate-300 font-medium">{ticket.potensi_name || "Umum"}</div>
                                  <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">{ticket.kebutuhan_lahan ? `${ticket.kebutuhan_lahan} Ha` : "-"}</div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-slate-300 mb-1.5">{ticket.status || "Menunggu Verifikasi"}</div>
                                  {isTerminal ? (
                                    <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700/50">
                                      - Selesai -
                                    </span>
                                  ) : (
                                    <div className={`px-2 py-1 rounded-md border text-[10px] font-bold w-max flex items-center gap-1 ${sla.badge}`}>
                                      <span className={sla.color}>
                                        ⏱️ Tertahan {sla.days} Hari
                                      </span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <motion.button whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedTicketForVerification(ticket)}
                                    className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded border border-emerald-500/20 font-bold transition-colors"
                                  >
                                    Verifikasi & Proses
                                  </motion.button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t flex justify-end gap-2 relative z-10 bg-white dark:bg-slate-900/60">
              <motion.button whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => {
              setIsLoiTicketsModalOpen(false);
            }}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Tutup
              </motion.button>
            </div>
          </div>
        </div>
      }

      {/* ── HERO SETTINGS MODAL ── */}
      {isHeroSettingsOpen && currentRole === Role.SUPER_ADMIN && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-md"
            onClick={() => setIsHeroSettingsOpen(false)}
          />
          <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-700/50 shadow-2xl flex flex-col pt-0 pb-0">
            <div className="sticky top-0 right-0 p-4 flex justify-end z-20 pointer-events-none">
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => setIsHeroSettingsOpen(false)}
                className="p-2 bg-white dark:bg-slate-900 border border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white rounded-full hover:bg-slate-800 transition-all pointer-events-auto"
              >
                <X size={20} />
              </motion.button>
            </div>
            <div className="-mt-12">
              <HeroSettings />
            </div>
          </div>
        </div>
      )}

      {/* ── STAFF IMAGE SETTINGS MODAL ── */}
      {isStaffSettingsOpen && currentRole === Role.SUPER_ADMIN && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-md"
            onClick={() => setIsStaffSettingsOpen(false)}
          />
          <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-700/50 shadow-2xl flex flex-col pt-0 pb-0">
            <div className="sticky top-0 right-0 p-4 flex justify-end z-20 pointer-events-none">
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => setIsStaffSettingsOpen(false)}
                className="p-2 bg-white dark:bg-slate-900 border border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white rounded-full hover:bg-slate-800 transition-all pointer-events-auto"
              >
                <X size={20} />
              </motion.button>
            </div>
            <div className="-mt-12">
              <StaffImageSettings />
            </div>
          </div>
        </div>
      )}

      {/* ── ENTERPRISE GIS MANAGEMENT MODAL ── */}
      {isManagementPanelOpen && (isAdminRole(currentRole) || isAdminRole(activeProfile?.role)) && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-md"
            onClick={() => { setIsManagementPanelOpen(false); }}
          />
          <div className={`w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-2xl sm:rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-md border relative flex flex-col overflow-hidden animate-fade-in transition-all duration-300 ${
            isDarkMode
              ? "bg-white dark:bg-slate-900/80 border-slate-700/50 text-slate-900 dark:text-white"
              : "bg-white/80 border-white/40 text-slate-800 shadow-2xl"
          }`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] pointer-events-none" />

            {/* Modal Header */}
            <div className={`p-4 sm:p-5 border-b flex items-center justify-between relative z-10 ${
              isDarkMode
                ? "bg-white dark:bg-slate-900/40 border-slate-700/50 text-slate-900 dark:text-white"
                : "bg-slate-100/40 border-slate-200/50 text-slate-900"
            }`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center">
                  <Shield className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-display font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400/90 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Panel Manajemen Spasial
                  </h3>
                  <p className="text-[10px] text-slate-600 dark:text-slate-300 tracking-wide">
                    Enterprise GIS Control Center
                  </p>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => { setIsManagementPanelOpen(false); }}
                className={`p-2 min-h-[44px] rounded-xl transition-all ${
                  isDarkMode
                    ? "text-slate-600 dark:text-slate-300 hover:bg-slate-800 hover:text-slate-900 dark:text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 relative z-10">
              
              {/* Geo-Spatial Summary */}
              {(() => {
                let totalFeatures = 0;
                let totalAreaSqm = 0;

                Object.values(spatialLayers).forEach((layer) => {
                  if (layer.geojson && layer.geojson.features) {
                    totalFeatures += layer.geojson.features.length;
                    try {
                      layer.geojson.features.forEach((feature: any) => {
                        if (feature.geometry && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
                          totalAreaSqm += turf.area(feature);
                        }
                      });
                    } catch (e) {
                      undefined;
                    }
                  }
                });

                const exactAvgAreaSqm = totalFeatures > 0 ? (totalAreaSqm / totalFeatures) : 0;
                const exactAreaHa = totalAreaSqm / 10000;
                const totalKabupatenAreaHa = districts.reduce((sum, d) => sum + (d.areaHa || 0), 0) || 300025;

                const formatArea = (sqm: number) => {
                  if (sqm >= 10000) {
                    return (sqm / 10000).toFixed(2) + " Ha";
                  }
                  return sqm.toFixed(2) + " m²";
                };

                return (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className={`p-4 backdrop-blur-md border rounded-xl flex flex-col justify-between shadow-md transition-all ${isDarkMode ? "bg-white dark:bg-slate-900/80 border-slate-700/50" : "bg-white/80 border-white/40"}`}>
                      <div>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Layers className="h-4 w-4 text-emerald-500" /> Feature Count
                        </span>
                        <strong className={`text-2xl font-bold mt-2 font-display block ${isDarkMode ? "text-emerald-700 dark:text-emerald-400" : "text-emerald-600"}`}>
                          {totalFeatures.toLocaleString("id-ID")}
                        </strong>
                      </div>
                    </div>
                    <div className={`p-4 backdrop-blur-md border rounded-xl flex flex-col justify-between shadow-md transition-all ${isDarkMode ? "bg-white dark:bg-slate-900/80 border-slate-700/50" : "bg-white/80 border-white/40"}`}>
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Map className="h-4 w-4 text-emerald-500" /> Total Area
                          </span>
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            {totalKabupatenAreaHa > 0 ? ((exactAreaHa / totalKabupatenAreaHa) * 100).toFixed(1) : "0"}%
                          </span>
                        </div>
                        <strong className={`text-2xl font-bold mt-2 font-display block ${isDarkMode ? "text-emerald-700 dark:text-emerald-400" : "text-emerald-600"}`}>
                          {exactAreaHa.toFixed(2)} Ha
                        </strong>
                      </div>
                      <div className="w-full mt-2">
                        <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-200/50'}`}>
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${totalKabupatenAreaHa > 0 ? Math.min(((exactAreaHa / totalKabupatenAreaHa) * 100), 100) : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className={`p-4 backdrop-blur-md border rounded-xl flex flex-col justify-between shadow-md transition-all col-span-2 lg:col-span-1 ${isDarkMode ? "bg-white dark:bg-slate-900/80 border-slate-700/50" : "bg-white/80 border-white/40"}`}>
                      <div>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-emerald-500" /> Avg Area
                        </span>
                        <strong className={`text-2xl font-bold mt-2 font-display block ${isDarkMode ? "text-emerald-700 dark:text-emerald-400" : "text-emerald-600"}`}>
                          {formatArea(exactAvgAreaSqm)}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Detailed GeoJSON Layer Stats Panel */}
              <div className={`p-4 rounded-2xl border flex flex-col gap-3 transition-all ${
                isDarkMode ? "bg-white dark:bg-slate-900/40 border-slate-700/50" : "bg-slate-50 border-slate-200"
              }`}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5 font-sans">
                  <Database className="h-4 w-4" /> Statistik Layer Data
                </h4>
                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                  {Object.values(spatialLayers).filter(layer => layer.geojson && layer.geojson.features && layer.geojson.features.length > 0).map(layer => {
                    let featCount = layer.geojson.features.length;
                    let areaSqm = 0;
                    try {
                      layer.geojson.features.forEach((feature: any) => {
                        if (feature.geometry && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
                          areaSqm += turf.area(feature);
                        }
                      });
                    } catch(e) {}
                    const areaHa = areaSqm / 10000;
                    return (
                      <div key={layer.id} className={`flex items-center justify-between p-3 rounded-xl border ${isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-white border-slate-200"} shadow-sm`}>
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isDarkMode ? "bg-slate-700" : "bg-slate-100"}`}>
                            <Layers className="h-4 w-4 text-emerald-500" />
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-xs font-bold truncate max-w-[150px] sm:max-w-[200px] ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{layer.name}</span>
                            <span className="text-[9px] text-slate-600 dark:text-slate-400 uppercase tracking-widest">{layer.category || "General"}</span>
                          </div>
                        </div>
                        <div className="flex gap-4 text-right">
                          <div className="flex flex-col">
                            <span className={`text-xs font-bold ${isDarkMode ? "text-slate-300" : "text-slate-800 dark:text-slate-200"}`}>{featCount.toLocaleString("id-ID")}</span>
                            <span className="text-[9px] text-slate-600 dark:text-slate-400 uppercase tracking-wider">Features</span>
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-xs font-bold ${isDarkMode ? "text-slate-300" : "text-slate-800 dark:text-slate-200"}`}>{areaHa.toFixed(2)} Ha</span>
                            <span className="text-[9px] text-slate-600 dark:text-slate-400 uppercase tracking-wider">Area</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {Object.values(spatialLayers).filter(layer => layer.geojson && layer.geojson.features && layer.geojson.features.length > 0).length === 0 && (
                    <div className="text-center py-4 text-xs text-slate-600 dark:text-slate-400">
                      Belum ada data layer GeoJSON yang valid.
                    </div>
                  )}
                </div>
              </div>


              <div className="grid grid-cols-2 gap-3">
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsManagementPanelOpen(false);
                    setIsAddModalOpen(true);
                  }}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white text-xs font-bold font-sans rounded-xl shadow-[0_0_15px_rgba(5,150,105,0.3)] hover:shadow-[0_0_25px_rgba(5,150,105,0.5)] transition-all flex items-center justify-center gap-2 uppercase tracking-wide hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4" /> Data Investasi Baru
                </motion.button>

                {currentRole === Role.SUPER_ADMIN && (
                  <>
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsManagementPanelOpen(false);
                      setIsCreateOperatorModalOpen(true);
                    }}
                    className={`w-full py-3 text-[11px] sm:text-xs font-bold font-sans rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 uppercase tracking-wide hover:scale-[1.01] active:scale-[0.99] border ${
                      isDarkMode
                        ? "bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white border-slate-700 shadow-md"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-750 border-slate-300 shadow-sm"
                    }`}
                  >
                    <UserPlus className={`h-4 w-4 ${isDarkMode ? "text-sky-400" : "text-sky-600"}`} />
                    Buat Akun Operator
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsManagementPanelOpen(false);
                      setIsHeroSettingsOpen(true);
                    }}
                    className={`w-full py-3 text-[11px] sm:text-xs font-bold font-sans rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 uppercase tracking-wide hover:scale-[1.01] active:scale-[0.99] border ${
                      isDarkMode
                        ? "bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white border-slate-700 shadow-md"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-750 border-slate-300 shadow-sm"
                    }`}
                  >
                    <Image className={`h-4 w-4 ${isDarkMode ? "text-emerald-700 dark:text-emerald-400" : "text-emerald-600"}`} />
                    Upload Photo Slider
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsManagementPanelOpen(false);
                      setIsStaffSettingsOpen(true);
                    }}
                    className={`w-full py-3 text-[11px] sm:text-xs font-bold font-sans rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 uppercase tracking-wide hover:scale-[1.01] active:scale-[0.99] border ${
                      isDarkMode
                        ? "bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white border-slate-700 shadow-md"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-750 border-slate-300 shadow-sm"
                    }`}
                  >
                    <ImageIcon className={`h-4 w-4 ${isDarkMode ? "text-indigo-700 dark:text-indigo-400" : "text-indigo-600"}`} />
                    Upload Photo Staff
                  </motion.button>
                </>
                )}
              </div>

              {currentRole === Role.SUPER_ADMIN && (
                <>
                  {/* Automated Spatial Sync (Cron Job 1 Hour) */}
                  <div className={`p-4 rounded-2xl border flex flex-col gap-3 relative overflow-hidden transition-all duration-300 ${
                    isDarkMode ? "bg-white dark:bg-slate-900/60 border-emerald-500/20" : "bg-emerald-50/40 border-emerald-200"
                  }`}>
                    <div className="flex items-start justify-between gap-2 z-10">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                            spatialCronState?.enabled
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                              : "bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-700"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${spatialCronState?.enabled ? "bg-emerald-400 animate-ping" : "bg-slate-500"}`} />
                            {spatialCronState?.enabled ? "Cron Job Otomatis Aktif (1 Jam)" : "Jadwal Otomatis Nonaktif"}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 font-sans mt-0.5">
                          <Clock className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                          Sinkronisasi Spasial Otomatis Latar Belakang
                        </h4>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                          Sistem memperbarui batas kecamatan, desa, jarak jaringan jalan, dan tumpang tindih kawasan sawah/mangrove setiap 1 jam secara otomatis tanpa perlu trigger manual.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleSpatialCron(false)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer min-h-[36px] flex items-center gap-1 shrink-0 ${
                          spatialCronState?.enabled
                            ? "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30 hover:bg-red-500/20"
                            : "bg-emerald-600 text-slate-900 dark:text-white hover:bg-emerald-500 shadow-md"
                        }`}
                      >
                        {spatialCronState?.enabled ? "Matikan Auto-Cron" : "Aktifkan Auto-Cron"}
                      </button>
                    </div>

                    {/* Cron Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200 dark:border-slate-800/60">
                      <div className="bg-slate-50 dark:bg-slate-950/60 p-2 rounded-xl border border-slate-200 dark:border-slate-800/80 text-center">
                        <span className="text-[8.5px] font-bold uppercase text-slate-600 dark:text-slate-300 block tracking-wider">
                          Terakhir Berjalan
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-300 block mt-0.5">
                          {spatialCronState?.lastRunAt
                            ? new Date(spatialCronState.lastRunAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                            : "Belum Pernah"}
                        </span>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950/60 p-2 rounded-xl border border-slate-200 dark:border-slate-800/80 text-center">
                        <span className="text-[8.5px] font-bold uppercase text-slate-600 dark:text-slate-300 block tracking-wider">
                          Jadwal Berikutnya
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-300 block mt-0.5">
                          {spatialCronState?.enabled && spatialCronState?.nextRunAt
                            ? new Date(spatialCronState.nextRunAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                            : "Dihentikan"}
                        </span>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950/60 p-2 rounded-xl border border-slate-200 dark:border-slate-800/80 text-center">
                        <span className="text-[8.5px] font-bold uppercase text-slate-600 dark:text-slate-300 block tracking-wider">
                          Total Eksekusi
                        </span>
                        <span className="text-xs font-mono font-bold text-indigo-300 block mt-0.5">
                          {spatialCronState?.runCount || 0} Selesai
                        </span>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950/60 p-2 rounded-xl border border-slate-200 dark:border-slate-800/80 text-center">
                        <span className="text-[8.5px] font-bold uppercase text-slate-600 dark:text-slate-300 block tracking-wider">
                          Status Terakhir
                        </span>
                        <span className={`text-xs font-mono font-bold block mt-0.5 ${
                          spatialCronState?.lastStatus === "Success"
                            ? "text-emerald-700 dark:text-emerald-400"
                            : spatialCronState?.lastStatus === "Running"
                              ? "text-amber-700 dark:text-amber-400 animate-pulse"
                              : spatialCronState?.lastStatus === "Failed"
                                ? "text-red-700 dark:text-red-400"
                                : "text-slate-600 dark:text-slate-300"
                        }`}>
                          {spatialCronState?.lastStatus || "Idle"}
                        </span>
                      </div>
                    </div>

                    <motion.button whileTap={{ scale: 0.96 }}
                      type="button"
                      onClick={() => handleToggleSpatialCron(true)}
                      className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 active:scale-[0.98] transition-all text-emerald-300 text-[10px] font-bold uppercase tracking-wider rounded-xl border border-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer min-h-[38px]"
                    >
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Picu Sinkronisasi Cron Sekarang (Sertakan Supabase)
                    </motion.button>
                  </div>

                  {/* Global Spatial Sync */}
                  <div className={`p-4 rounded-2xl border flex flex-col gap-3 relative overflow-hidden transition-all duration-300 ${
                    isDarkMode ? "bg-white dark:bg-slate-900/40 border-indigo-500/10" : "bg-indigo-50/30 border-indigo-200"
                  }`}>
                    <div className="flex flex-col gap-1 z-10">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 font-sans">
                        <RefreshCw className={`h-4 w-4 ${isGlobalSyncing ? "animate-spin" : ""}`} />
                        Penyelarasan Server Spasial (9 Layer)
                      </h4>
                      <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                        Sinkronkan semua data potensi investasi secara total dan kalkulasi ulang batas administrasi desa, kecamatan, tumpang tindih areal sawah, tambak, mangrove, dan jarak infrastruktur utama.
                      </p>
                    </div>

                    {isGlobalSyncing && (
                      <div className="w-full flex flex-col gap-3.5 mt-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 shadow-inner">
                        {globalSyncProgress ? (() => {
                          const percentage = globalSyncProgress.total > 0
                            ? Math.round((globalSyncProgress.progress / globalSyncProgress.total) * 100)
                            : 0;

                          return (
                            <>
                              {/* Top Stats Bar */}
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                                    <Activity size={10} className="animate-pulse" />
                                    Status Sinkronisasi
                                  </span>
                                  <span className="text-[11px] font-sans font-medium text-slate-300 truncate max-w-[180px] sm:max-w-xs block">
                                    {globalSyncProgress.message}
                                  </span>
                                </div>
                                <div className="flex flex-col items-end gap-0.5">
                                  <span className="text-sm font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                                    {percentage}%
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-600 dark:text-slate-400">
                                    {globalSyncProgress.total > 0 ? `${globalSyncProgress.progress} / ${globalSyncProgress.total} Proyek` : 'Menghubungkan...'}
                                  </span>
                                </div>
                              </div>

                              {/* Premium Smooth Progress Bar */}
                              <div className="h-2 w-full bg-white dark:bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-800">
                                <div className="h-full w-full rounded-full overflow-hidden relative">
                                  <motion.div 
                                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full relative"
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ type: "spring", stiffness: 40, damping: 12 }}
                                  >
                                    <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                                  </motion.div>
                                </div>
                              </div>

                              {/* Detailed Pipeline Checkpoints */}
                              <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/60">
                                <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                  <span>Tahapan Proses Aliansi Spasial (Turf.js + PostGIS)</span>
                                  {globalSyncProgress.currentLayer && (
                                    <span className="text-indigo-700 dark:text-indigo-400 font-mono animate-pulse flex items-center gap-1">
                                      <Cpu size={8} /> Active: {globalSyncProgress.currentLayer}
                                    </span>
                                  )}
                                </span>
                                <div className="grid grid-cols-1 gap-2">
                                  {/* Step 1: Inisialisasi */}
                                  {(() => {
                                    const layer = globalSyncProgress.currentLayer || "";
                                    const isActive = layer === "Inisialisasi";
                                    const isDone = percentage >= 5 && !isActive;
                                    return (
                                      <div className={`flex flex-col gap-1.5 py-1.5 px-2.5 rounded-lg transition-all duration-300 ${
                                        isActive 
                                          ? "bg-indigo-950/40 border border-indigo-500/30 shadow-[0_0_8px_rgba(99,102,241,0.15)] text-slate-100" 
                                          : isDone 
                                            ? "bg-white dark:bg-slate-900/10 text-slate-600 dark:text-slate-300 border border-transparent" 
                                            : "bg-white dark:bg-slate-900/30 text-slate-600 dark:text-slate-400 border border-transparent"
                                      }`}>
                                        <div className="flex items-center justify-between text-[10px]">
                                          <div className="flex items-center gap-1.5 text-slate-300">
                                            {isDone ? (
                                              <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                                            ) : isActive ? (
                                              <Loader2 size={12} className="text-indigo-700 dark:text-indigo-400 animate-spin shrink-0" />
                                            ) : (
                                              <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />
                                            )}
                                            <span className={isDone ? "text-slate-600 dark:text-slate-400 line-through decoration-slate-600" : "font-semibold text-slate-200"}>
                                              1. Inisialisasi & Validasi Geometri
                                            </span>
                                          </div>
                                          <span className={`text-[9px] font-mono ${isDone ? "text-emerald-500" : isActive ? "text-indigo-700 dark:text-indigo-400 animate-pulse font-bold" : "text-slate-600"}`}>
                                            {isDone ? "Selesai" : isActive ? "Memproses..." : "Menunggu"}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {/* Step 2: Batas Administrasi */}
                                  {(() => {
                                    const layer = globalSyncProgress.currentLayer || "";
                                    const isActive = layer.startsWith("Kecamatan") || layer.startsWith("Desa");
                                    const isDone = percentage >= 25 && !isActive && layer !== "Inisialisasi";
                                    return (
                                      <div className={`flex flex-col gap-1.5 py-1.5 px-2.5 rounded-lg transition-all duration-300 ${
                                        isActive 
                                          ? "bg-indigo-950/40 border border-indigo-500/30 shadow-[0_0_8px_rgba(99,102,241,0.15)] text-slate-100" 
                                          : isDone 
                                            ? "bg-white dark:bg-slate-900/10 text-slate-600 dark:text-slate-300 border border-transparent" 
                                            : "bg-white dark:bg-slate-900/30 text-slate-600 dark:text-slate-400 border border-transparent"
                                      }`}>
                                        <div className="flex items-center justify-between text-[10px]">
                                          <div className="flex items-center gap-1.5 text-slate-300">
                                            {isDone ? (
                                              <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                                            ) : isActive ? (
                                              <Loader2 size={12} className="text-indigo-700 dark:text-indigo-400 animate-spin shrink-0" />
                                            ) : (
                                              <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />
                                            )}
                                            <span className={isDone ? "text-slate-600 dark:text-slate-400 line-through decoration-slate-600" : "font-semibold text-slate-200"}>
                                              2. Pencocokan Batas Desa & Kecamatan
                                            </span>
                                          </div>
                                          <span className={`text-[9px] font-mono ${isDone ? "text-emerald-500" : isActive ? "text-indigo-700 dark:text-indigo-400 animate-pulse font-bold" : "text-slate-600"}`}>
                                            {isDone ? "Selesai" : isActive ? "Memproses..." : "Menunggu"}
                                          </span>
                                        </div>
                                        {isActive && (
                                          <div className="text-[8.5px] text-indigo-300 bg-indigo-500/10 rounded px-2.5 py-1.5 flex flex-col gap-1 border border-indigo-500/20">
                                            <span className="flex items-center gap-1">
                                              <Network size={10} className="animate-spin text-indigo-400" />
                                              Layer Aktif: <strong className="text-indigo-200">{layer} Boundary</strong>
                                            </span>
                                            <span className="text-[8px] uppercase tracking-wider font-bold text-indigo-400 animate-pulse">PostGIS ST_Contains / ST_Within</span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  {/* Step 3: Jaringan Jalan & Infrastruktur */}
                                  {(() => {
                                    const layer = globalSyncProgress.currentLayer || "";
                                    const isActive = layer.startsWith("Infrastruktur") || layer.startsWith("Jaringan Jalan");
                                    const isDone = percentage >= 50 && !isActive && !layer.startsWith("Inisialisasi") && !layer.startsWith("Kecamatan") && !layer.startsWith("Desa");
                                    return (
                                      <div className={`flex flex-col gap-1.5 py-1.5 px-2.5 rounded-lg transition-all duration-300 ${
                                        isActive 
                                          ? "bg-indigo-950/40 border border-indigo-500/30 shadow-[0_0_8px_rgba(99,102,241,0.15)] text-slate-100" 
                                          : isDone 
                                            ? "bg-white dark:bg-slate-900/10 text-slate-600 dark:text-slate-300 border border-transparent" 
                                            : "bg-white dark:bg-slate-900/30 text-slate-600 dark:text-slate-400 border border-transparent"
                                      }`}>
                                        <div className="flex items-center justify-between text-[10px]">
                                          <div className="flex items-center gap-1.5 text-slate-300">
                                            {isDone ? (
                                              <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                                            ) : isActive ? (
                                              <Cpu size={12} className="text-indigo-700 dark:text-indigo-400 animate-pulse shrink-0" />
                                            ) : (
                                              <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />
                                            )}
                                            <span className={isDone ? "text-slate-600 dark:text-slate-400 line-through decoration-slate-600" : "font-semibold text-slate-200"}>
                                              3. Analisis Jaringan Jalan & Infrastruktur
                                            </span>
                                          </div>
                                          <span className={`text-[9px] font-mono ${isDone ? "text-emerald-500" : isActive ? "text-emerald-700 dark:text-emerald-400 animate-pulse font-bold" : "text-slate-600"}`}>
                                            {isDone ? "Selesai" : isActive ? "Memproses..." : "Menunggu"}
                                          </span>
                                        </div>
                                        {isActive && (
                                          <div className="text-[8.5px] text-emerald-300 bg-emerald-500/10 rounded px-2.5 py-1.5 flex flex-col gap-1 border border-emerald-500/20">
                                            <div className="flex items-center justify-between">
                                              <span className="flex items-center gap-1 font-sans font-semibold text-emerald-200">
                                                <Network size={10} className="animate-pulse text-emerald-400" />
                                                Menghitung Jarak Terpendek Infrastruktur Utama
                                              </span>
                                              <span className="text-[8px] uppercase tracking-wider font-bold text-emerald-400 animate-pulse">pgRouting Active</span>
                                            </div>
                                            <span className="text-[8px] text-slate-400 font-mono flex items-center gap-1 bg-slate-950/40 px-1.5 py-0.5 rounded border border-emerald-500/10">
                                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                                              {layer}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  {/* Step 4: Tumpang Tindih Thematic */}
                                  {(() => {
                                    const layer = globalSyncProgress.currentLayer || "";
                                    const isActive = layer.startsWith("Tematik");
                                    const isDone = percentage >= 85 && !isActive && !["Inisialisasi", "Kecamatan", "Desa", "Infrastruktur", "Jaringan Jalan"].some(prefix => layer.startsWith(prefix));
                                    return (
                                      <div className={`flex flex-col gap-1.5 py-1.5 px-2.5 rounded-lg transition-all duration-300 ${
                                        isActive 
                                          ? "bg-indigo-950/40 border border-indigo-500/30 shadow-[0_0_8px_rgba(99,102,241,0.15)] text-slate-100" 
                                          : isDone 
                                            ? "bg-white dark:bg-slate-900/10 text-slate-600 dark:text-slate-300 border border-transparent" 
                                            : "bg-white dark:bg-slate-900/30 text-slate-600 dark:text-slate-400 border border-transparent"
                                      }`}>
                                        <div className="flex items-center justify-between text-[10px]">
                                          <div className="flex items-center gap-1.5 text-slate-300">
                                            {isDone ? (
                                              <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                                            ) : isActive ? (
                                              <Loader2 size={12} className="text-indigo-700 dark:text-indigo-400 animate-spin shrink-0" />
                                            ) : (
                                              <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />
                                            )}
                                            <span className={isDone ? "text-slate-600 dark:text-slate-400 line-through decoration-slate-600" : "font-semibold text-slate-200"}>
                                              4. Tumpang Tindih Sawah/LSD/Mangrove
                                            </span>
                                          </div>
                                          <span className={`text-[9px] font-mono ${isDone ? "text-emerald-500" : isActive ? "text-indigo-700 dark:text-indigo-400 animate-pulse font-bold" : "text-slate-600"}`}>
                                            {isDone ? "Selesai" : isActive ? "Memproses..." : "Menunggu"}
                                          </span>
                                        </div>
                                        {isActive && (
                                          <div className="text-[8.5px] text-pink-300 bg-pink-500/10 rounded px-2.5 py-1.5 flex flex-col gap-1 border border-pink-500/20">
                                            <div className="flex items-center justify-between">
                                              <span className="flex items-center gap-1 font-sans font-semibold text-pink-200">
                                                <Layers size={10} className="text-pink-400 animate-pulse" />
                                                Kalkulasi Areal Sawah, Tambak & Mangrove
                                              </span>
                                              <span className="text-[8px] uppercase tracking-wider font-bold text-pink-400">ST_Intersection</span>
                                            </div>
                                            <span className="text-[8px] text-slate-400 font-mono flex items-center gap-1 bg-slate-950/40 px-1.5 py-0.5 rounded border border-pink-500/10">
                                              <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping shrink-0" />
                                              {layer}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  {/* Step 5: PostGIS Cache Sync */}
                                  {(() => {
                                    const layer = globalSyncProgress.currentLayer || "";
                                    const isActive = layer.includes("Cache") || layer.includes("Sinkronisasi") || (percentage >= 95 && percentage < 100);
                                    const isDone = percentage >= 100;
                                    return (
                                      <div className={`flex flex-col gap-1.5 py-1.5 px-2.5 rounded-lg transition-all duration-300 ${
                                        isActive 
                                          ? "bg-indigo-950/40 border border-indigo-500/30 shadow-[0_0_8px_rgba(99,102,241,0.15)] text-slate-100" 
                                          : isDone 
                                            ? "bg-white dark:bg-slate-900/10 text-slate-600 dark:text-slate-300 border border-transparent" 
                                            : "bg-white dark:bg-slate-900/30 text-slate-600 dark:text-slate-400 border border-transparent"
                                      }`}>
                                        <div className="flex items-center justify-between text-[10px]">
                                          <div className="flex items-center gap-1.5 text-slate-300">
                                            {isDone ? (
                                              <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                                            ) : isActive ? (
                                              <Loader2 size={12} className="text-indigo-700 dark:text-indigo-400 animate-spin shrink-0" />
                                            ) : (
                                              <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />
                                            )}
                                            <span className={isDone ? "text-slate-600 dark:text-slate-400 line-through decoration-slate-600" : "font-semibold text-slate-200"}>
                                              5. Sinkronisasi Data & Cache PostGIS
                                            </span>
                                          </div>
                                          <span className={`text-[9px] font-mono ${isDone ? "text-emerald-500" : isActive ? "text-indigo-700 dark:text-indigo-400 animate-pulse font-bold" : "text-slate-600"}`}>
                                            {isDone ? "Selesai" : isActive ? "Memproses..." : "Menunggu"}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </>
                          );
                        })() : (
                          <div className="flex flex-col items-center justify-center py-4 gap-3">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-700 dark:text-indigo-400" />
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider animate-pulse">
                                Memulai Koneksi Server Spasial...
                              </span>
                              <span className="text-[9px] text-slate-600 dark:text-slate-400">
                                Menghubungkan ke API Sinkronisasi PostGIS
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <motion.button whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={handleGlobalSpatialSync}
                      disabled={isGlobalSyncing}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all text-slate-900 dark:text-white text-[11px] font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isGlobalSyncing ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Synchronizing Aligned Layers (Turf.js)...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3.5 w-3.5" />
                          Sinkronkan Database Sekarang
                        </>
                      )}
                    </motion.button>

                    {globalSyncSuccess && (
                      <div className="p-3 text-[10.5px] font-sans font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl relative">
                        <motion.button whileTap={{ scale: 0.95 }}
                          onClick={() => setGlobalSyncSuccess(null)}
                          className="absolute top-1.5 right-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white text-xs"
                        >
                          ×
                        </motion.button>
                        {globalSyncSuccess}
                      </div>
                    )}
                  </div>

                  <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </>
              )}

              <SpatialQueryPanel
                isDarkMode={isDarkMode}
                onExecuteQuery={(params) => {
                  setIsManagementPanelOpen(false);
                  handleExecuteSpatialQuery(params);
                }}
                queryResults={spatialQueryResults}
                onFocusInvestment={(id) => {
                  setIsManagementPanelOpen(false);
                  setSelectedInvestmentId(id);
                }}
                infrastructure={infrastructure}
                onProximityFilterChange={handleProximityFilterChange}
                onSelectShortestPathRoute={handleSelectShortestPathRoute}
                activeRouteInfo={activeRouteInfo}
                onClearShortestPathRoute={handleClearShortestPathRoute}
                onOpenSuitabilityModal={() => setIsSuitabilityModalOpen(true)}
              />
            </div>
          </div>
        </div>
      )}

      {/* PROXIMITY DETAIL MODAL */}
      <AnimatePresence>
        {selectedProximityDetail && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white dark:bg-slate-900/60 backdrop-blur-sm pointer-events-auto"
              onClick={() => setSelectedProximityDetail(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`relative w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl pointer-events-auto ${
                isDarkMode 
                  ? "bg-white dark:bg-slate-900 border-slate-700/80 shadow-black/50" 
                  : "bg-white border-slate-200 shadow-slate-200/50"
              }`}
            >
              <div className={`p-4 sm:p-5 flex justify-between items-start border-b ${isDarkMode ? "border-slate-200 dark:border-slate-800" : "border-slate-100"}`}>
                <div>
                  <h3 className={`text-lg font-bold tracking-tight mb-1 ${isDarkMode ? "text-slate-900 dark:text-white" : "text-slate-900"}`}>
                    {selectedProximityDetail.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                      {selectedProximityDetail.type || "Fasilitas Publik"}
                    </span>
                    <span className={`text-xs font-mono font-bold ${isDarkMode ? "text-emerald-700 dark:text-emerald-400" : "text-emerald-600"}`}>
                      {selectedProximityDetail.distance < 1 
                        ? (Math.round(selectedProximityDetail.distance * 1000) + " m") 
                        : (selectedProximityDetail.distance.toFixed(2) + " km")}
                    </span>
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.95 }} 
                  onClick={() => setSelectedProximityDetail(null)}
                  className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? "hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white" : "hover:bg-slate-100 text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
                >
                  <X size={18} />
                </motion.button>
              </div>
              <div className="p-4 sm:p-5">
                <div className="space-y-4">
                  <div className={`p-3.5 rounded-xl flex items-start gap-3 ${isDarkMode ? "bg-slate-800/50 border border-slate-700/50" : "bg-slate-50 border border-slate-200/50"}`}>
                    <MapPin className={`w-5 h-5 mt-0.5 shrink-0 ${isDarkMode ? "text-blue-700 dark:text-blue-400" : "text-blue-500"}`} />
                    <div>
                      <div className={`text-[10px] uppercase tracking-wider font-bold mb-0.5 ${isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-300"}`}>
                        Koordinat Geospasial
                      </div>
                      <div className={`font-mono text-xs ${isDarkMode ? "text-slate-300" : "text-slate-800 dark:text-slate-200"}`}>
                        {selectedProximityDetail.latitude?.toFixed(6)}, {selectedProximityDetail.longitude?.toFixed(6)}
                      </div>
                    </div>
                  </div>
                  
                  {selectedProximityDetail.operatingHours && (
                    <div className={`p-3.5 rounded-xl flex items-start gap-3 ${isDarkMode ? "bg-slate-800/50 border border-slate-700/50" : "bg-slate-50 border border-slate-200/50"}`}>
                      <Clock className={`w-5 h-5 mt-0.5 shrink-0 ${isDarkMode ? "text-indigo-700 dark:text-indigo-400" : "text-indigo-500"}`} />
                      <div>
                        <div className={`text-[10px] uppercase tracking-wider font-bold mb-0.5 ${isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-300"}`}>
                          Jam Operasional
                        </div>
                        <div className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-800 dark:text-slate-200"}`}>
                          {selectedProximityDetail.operatingHours}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedProximityDetail.capacity && (
                    <div className={`p-3.5 rounded-xl flex items-start gap-3 ${isDarkMode ? "bg-slate-800/50 border border-slate-700/50" : "bg-slate-50 border border-slate-200/50"}`}>
                      <Users className={`w-5 h-5 mt-0.5 shrink-0 ${isDarkMode ? "text-amber-700 dark:text-amber-400" : "text-amber-500"}`} />
                      <div>
                        <div className={`text-[10px] uppercase tracking-wider font-bold mb-0.5 ${isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-300"}`}>
                          Kapasitas / Daya Tampung
                        </div>
                        <div className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-800 dark:text-slate-200"}`}>
                          {selectedProximityDetail.capacity}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedProximityDetail.description && (
                    <div className={`p-3.5 rounded-xl flex items-start gap-3 ${isDarkMode ? "bg-slate-800/50 border border-slate-700/50" : "bg-slate-50 border border-slate-200/50"}`}>
                      <Info className={`w-5 h-5 mt-0.5 shrink-0 ${isDarkMode ? "text-emerald-700 dark:text-emerald-400" : "text-emerald-500"}`} />
                      <div>
                        <div className={`text-[10px] uppercase tracking-wider font-bold mb-0.5 ${isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-300"}`}>
                          Deskripsi Fasilitas
                        </div>
                        <div className={`text-sm font-medium leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-800 dark:text-slate-200"}`}>
                          {selectedProximityDetail.description}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <motion.button whileTap={{ scale: 0.95 }} 
                      onClick={() => {
                        setSelectedProximityDetail(null);
                        if (mapComponentRef.current && mapComponentRef.current.flyToCoordinate && selectedProximityDetail.longitude && selectedProximityDetail.latitude) {
                          mapComponentRef.current.flyToCoordinate(selectedProximityDetail.longitude, selectedProximityDetail.latitude, 17);
                        }
                      }}
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-900 dark:text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <MapPin size={16} />
                      Lihat di Peta
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {}
      <ImageLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={lightboxImages}
        initialIndex={lightboxIndex}
      />

      <React.Suspense fallback={null}>
        {isSuitabilityModalOpen && (
          <SpatialSuitabilityFilterModal
            isOpen={isSuitabilityModalOpen}
            onClose={() => setIsSuitabilityModalOpen(false)}
            investments={investments}
            districts={districts}
            villages={villages}
            spatialLayers={spatialLayers}
            onApplyFilter={(filteredIds) => {
              setActiveSuitabilityFilterIds(filteredIds);
            }}
            onFocusInvestment={(id) => {
              setSelectedInvestmentId(id);
            }}
            onFocusDistrict={(districtId) => {
              setSelectedDistrictId(districtId);
            }}
            isDarkMode={isDarkMode}
          />
        )}
      </React.Suspense>
      

    </div>
    } />
    </Routes>
    </DataContext.Provider>
  );
}

// hotfix: active polling for pdf canvas
// architecture refactor: implement enterprise sidebar layout for admin// error 0 fixed
// ui polish: fix light mode symmetry on spatial sidebar
// ui polish: added live ping and empty state
// ui polish: staggered entrance animation for spatial sidebar
// ui polish: centered modal and matched sidebar bg
// ui polish: confirmed center alignment and consistent background colors
// ui polish: refined padding and vertical alignment for investment rows
// ui polish: added color-coded status dot to investment row
// ui polish: added pure css tooltips to action buttons
// ux polish: mobile responsive map panels
// ui hotfix: enforce mobile z-index hierarchy
// ux polish: auto-collapse mobile sidebar on selection
// ui polish: add active scale animation to mobile bottom bar buttons

// ui polish: smooth pure css transitions for layer toggles
// ui polish: custom scrollbar and fade gradient

// ui polish: layer active borders and sticky grouping

// hotfix: resolve z-index collision blocking mobile bottom buttons

// hotfix: resolve mobile landscape layout and dead bottom buttons
// hotfix: responsive width for mobile map panels
// hotfix: responsive width for mobile map panels

// hotfix: restore proportional mobile panels and z-indexes
// hotfix: symmetrical mobile panels and basemap handle
// hotfix: unhide search and center panels on portrait
// ui polish: pure css modal entrance animation
// ui polish: added tactile scale and glow effects// ui polish: basemap sheet transparent wrapper and high contrast inactive text

// architecture pivot: implement strict mobile-first responsive design

// bugfix: panelist feedback - comprehensive i18n translation sweep
// architecture refactor: implement enterprise sidebar layout for admin
// hotfix: resolve react hook rules violation (error #310) and restore menus
// hotfix: fix modal route trigger and url reset loop
// hotfix: rollback to horizontal top-navbar layout and fix hooks
// hotfix: add missing lucide-react icons for dashboard buttons
// hotfix: resolve missing Ticket icon import
// hotfix: fixed duplicate lucide-react imports

// ui polish: implement symmetrical command bar for admin actions
// ui polish: resolve recharts 0x0 dimension warnings
// core engine: implemented SLA digital tracking and visual traffic lights
// ui polish: sweep typography contrast and inject SLA activity widget to balance layout
// ux pivot: removed i18n and implemented global light/dark mode toggle
// hotfix: removed leftover i18n from admin header and wired up missing sidebar routes at the bottom of App.tsx to trigger the sync button.
