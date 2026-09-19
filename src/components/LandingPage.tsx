import { CompactWeatherWidget } from "./CompactWeatherWidget";
import { WeatherWidget } from "./WeatherWidget";
import { LUWU_LOGO_BASE64 } from "@/lib/logoBase64.js";
import { useNavigate } from "react-router-dom";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { isMobileOrAndroidDevice } from "../hooks/useDeviceAutomation";
import { requestSmartFullscreen } from "../utils/fullscreen";

const HERO_PLACEHOLDER_SVG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <rect width="1920" height="1080" fill="#0f172a"/>
  <text x="960" y="520" font-family="system-ui,sans-serif" font-size="48"
        fill="#10b981" text-anchor="middle">InvestLuwu Hub</text>
  <text x="960" y="590" font-family="system-ui,sans-serif" font-size="24"
        fill="#64748b" text-anchor="middle">Portal Investasi Kabupaten Luwu</text>
</svg>
`)}`;
import {
  ChevronRight,
  ArrowRight,
  Globe,
  Shield,
  Zap,
  Bot,
  BarChart3,
  Sun,
  Moon,
  Send,
  Calculator,
  Loader2,
  MapPin,
  DollarSign,
  Building,
  TrendingUp,
  Layers,
  Activity,
  Sparkles,
  PieChart as PieChartIcon,
  Menu,
  X,
  Anchor,
  Target,
  Plane,
  Home,
  MessageSquare,
  ArrowUp,
  ArrowDown,
  Maximize2,
  Minimize2,
  Smartphone,
  Cpu,
  Play,
  Download,
  ChevronDown,
  ChevronUp,
  Info,
  Compass,
  ShieldCheck,
  Leaf,
  Clock,
  UserPlus,
  Megaphone,
  AlertCircle,
  Stamp,
  Store,
  Share2,
  Search,
  Users,
  Briefcase,
  Award,
  Navigation,
  Building2,
  MessageCircle,
  BadgeCheck,
  Package,
  FileText,
  Map,
  HardDrive,
  BarChart2,
} from "lucide-react";
import { Role, Investment, District, SektorInvestasi } from "../types";
import { formatRupiahSingkat } from "../lib/formatters";
import { OssRoiSimulatorInputs } from "./OssRoiSimulatorInputs";
import GisTransitionLoader from "./GisTransitionLoader";
import { supabase, safeFetchLayerData } from "../lib/supabaseClient";
import RoiAiAnalysisModal from "./RoiAiAnalysisModal";
import SpatialBufferAiModal from "./SpatialBufferAiModal";
import LuwuInvestmentAiModal from "./LuwuInvestmentAiModal";
import RtrwZoningCheckerModal from "./RtrwZoningCheckerModal";
import IncentiveCalculatorModal from "./IncentiveCalculatorModal";
import ProximityDistanceMatrixModal from "./ProximityDistanceMatrixModal";
import IproPitchDeckModal from "./IproPitchDeckModal";
import { FastTrackConsultationModal } from "./FastTrackConsultationModal";
import SmartMatrixFilterPanel, { SmartFilterState } from "./SmartMatrixFilterPanel";

import TickerMarquee from "./TickerMarquee";
import TestimonialSection from "./TestimonialSection";
import { AnalitikSpasialSection } from "./AnalitikSpasialSection";
import GisErrorBoundary from "./GisErrorBoundary";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import LazyImage from "./LazyImage";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ReferenceLine,
} from "recharts";
import Swal from "sweetalert2";
import * as turf from "@turf/turf";
import { useTranslation } from "react-i18next";
import LanguageToggle from '@/components/LanguageToggle';
import { LiveMarketTicker, CommodityItem } from "./LiveMarketTicker";
import { MppVisionModal } from "./MppVisionModal";

// --- Executive CountUp Animation Helper ---
function CountUp({
  end,
  suffix = "",
  delay = 0,
}: {
  end: number;
  suffix?: string;
  delay?: number;
}) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let timer: any;
    const run = () => {
      const duration = 1500; // ms
      const frameRate = 1000 / 60;
      const totalFrames = Math.round(duration / frameRate);
      let frame = 0;
      timer = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        const easeProgress = progress * (2 - progress); // Ease out quad
        setCount(Math.floor(easeProgress * end));
        if (frame === totalFrames) {
          setCount(end);
          clearInterval(timer);
        }
      }, frameRate);
    };
    const startTimeout = setTimeout(run, delay);
    return () => {
      clearTimeout(startTimeout);
      clearInterval(timer);
    };
  }, [end, delay]);
  return (
    <span>
      {count}
      {suffix}
    </span>
  );
}

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getSectorI18nKey(sector: string) {
  switch (sector) {
    case "Kelautan dan Perikanan": return "sector.marine";
    case "Pertanian": return "sector.agriculture";
    case "Pertambangan": return "sector.mining";
    case "Perindustrian": return "sector.industry";
    case "Pariwisata": return "sector.tourism";
    default: return sector;
  }
}

export interface LandingPageProps {
  onEnter: (role?: Role) => void;
  investments?: Investment[];
  districts?: District[];
  villages?: any[];
  infrastructure?: any[];
  onSelectDistrict?: (id: string) => void;
  onSelectInvestment?: (id: string) => void;
  onEnterWithWorkspace?: (
    role: Role,
    workspace: "INVESTOR" | "OPERATOR" | "SPATIAL_EDITOR",
  ) => void;
  isDarkMode?: boolean;
  setIsDarkMode?: (val: boolean) => void;
  stats?: any;
  isLoading?: boolean;
  onOpenDiagnostic?: () => void;
  loiCount?: number;
}

function getSectorColor(sector: string) {
  switch (sector) {
    case 'Kelautan dan Perikanan': return { border: 'hover:border-sky-400/60', glow: 'hover:shadow-sky-500/25', badgeBg: 'font-semibold bg-sky-100 dark:bg-sky-400/20 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-400/30 backdrop-blur-sm shadow-sm', progress: 'bg-gradient-to-r from-sky-400 to-blue-500' };
    case 'Pertanian': return { border: 'hover:border-emerald-400/60', glow: 'hover:shadow-emerald-500/25', badgeBg: 'font-semibold bg-emerald-100 dark:bg-emerald-400/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-400/30 backdrop-blur-sm shadow-sm', progress: 'bg-gradient-to-r from-emerald-400 to-teal-500' };
    case 'Pariwisata': return { border: 'hover:border-amber-400/60', glow: 'hover:shadow-amber-500/25', badgeBg: 'font-semibold bg-amber-100 dark:bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-400/30 backdrop-blur-sm shadow-sm', progress: 'bg-gradient-to-r from-amber-400 to-orange-500' };
    case 'Pertambangan': return { border: 'hover:border-purple-400/60', glow: 'hover:shadow-purple-500/25', badgeBg: 'font-semibold bg-purple-100 dark:bg-purple-400/20 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-400/30 backdrop-blur-sm shadow-sm', progress: 'bg-gradient-to-r from-purple-400 to-indigo-500' };
    default: return { border: 'hover:border-indigo-400/60', glow: 'hover:shadow-indigo-500/25', badgeBg: 'font-semibold bg-emerald-100 dark:bg-emerald-400/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-400/30 backdrop-blur-sm shadow-sm', progress: 'bg-gradient-to-r from-indigo-400 to-violet-500' };
  }
}

export default function LandingPage({
  onEnter,
  onEnterWithWorkspace,
  investments = [],
  districts = [],
  villages = [],
  infrastructure = [],
  isDarkMode = true,
  setIsDarkMode,
  stats,
  onSelectInvestment,
  isLoading = false,
  onOpenDiagnostic,
  loiCount = 0,
}: LandingPageProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isZh = i18n.language?.startsWith("zh");
  const isEn = i18n.language?.startsWith("en");
  const [isDark, setLocalIsDark] = useState(isDarkMode);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? (window.innerWidth < 768 || isMobileOrAndroidDevice()) : false);

  const formatAreaHa = (area: number | string | undefined | null): string => {
    if (area === undefined || area === null || area === '') return '-';
    const num = typeof area === 'number' ? area : parseFloat(String(area));
    if (isNaN(num)) return String(area);
    return num.toLocaleString('id-ID', { maximumFractionDigits: 2 });
  };
  const [scrollY, setScrollY] = useState(0);
  const { scrollY: framerScrollY } = useScroll();
  const yBg = useTransform(framerScrollY, [0, 1000], [0, 400]);
  const yText = useTransform(framerScrollY, [0, 1000], [0, 200]);
  const opacityText = useTransform(framerScrollY, [0, 800], [1, 0]);
  const [maxScroll, setMaxScroll] = useState(0);
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [staffImageLeft, setStaffImageLeft] = useState<string | null>(null);
  const [staffImageRight, setStaffImageRight] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const hasTriggeredInitialFullscreen = useRef(false);
  const [facilityCoords, setFacilityCoords] = useState<{ airport?: number[], port?: number[], mpp?: number[], industrial?: number[] }>({});

  useEffect(() => {
    async function fetchFacilities() {
      try {
        const rawInfra = await safeFetchLayerData('gis_infrastruktur');
        const infraData: any[] = Array.isArray(rawInfra) ? rawInfra : [];
        const rawZonasi = await safeFetchLayerData('gis_zonasi');
        const zonasiArray = (rawZonasi && rawZonasi.type === 'FeatureCollection') ? rawZonasi.features : rawZonasi;
        const zonasiData = zonasiArray ? zonasiArray.map((f: any) => ({ geom: f.geometry, keterangan: f.properties?.keterangan })).filter((f: any) => f.keterangan === 'Kawasan Industri') : null;
        
        const coords: Record<string, [number, number]> = {};
        if (infraData && infraData.length > 0) {
          const airport = infraData.find(d => d.nama_infrastruktur && d.nama_infrastruktur.toLowerCase().includes('bandara'));
          if (airport && airport.geom && airport.geom.coordinates) coords.airport = [airport.geom.coordinates[0], airport.geom.coordinates[1]];
          
          const port = infraData.find(d => d.nama_infrastruktur && d.nama_infrastruktur.toLowerCase().includes('pelabuhan'));
          if (port && port.geom && port.geom.coordinates) coords.port = [port.geom.coordinates[0], port.geom.coordinates[1]];
          
          const mpp = infraData.find(d => d.nama_infrastruktur && d.nama_infrastruktur.toLowerCase().includes('bupati'));
          if (mpp && mpp.geom && mpp.geom.coordinates) coords.mpp = [mpp.geom.coordinates[0], mpp.geom.coordinates[1]];
        }
        
        if (zonasiData && zonasiData.length > 0 && zonasiData[0].geom) {
          try {
             const center = turf.center(zonasiData[0].geom);
             coords.industrial = [center.geometry.coordinates[0], center.geometry.coordinates[1]];
          } catch(e) {}
        }
        setFacilityCoords(coords);
      } catch (err) {}
    }
    fetchFacilities();
  }, []);

  const [showLauncher, setShowLauncher] = useState(false);
  const [isSimulatingLaunch, setIsSimulatingLaunch] = useState(false);
  const [launchProgress, setLaunchProgress] = useState(100);
  const [launchStatusText, setLaunchStatusText] = useState(
    "launcher.statusReady",
  );
  const [launchReadyToEnter, setLaunchReadyToEnter] = useState(true);

  const handleRequestFullscreen = (force: boolean = false) => {
    requestSmartFullscreen(force);
  };

  const handleLaunchApp = () => {
    // Called when the user taps after launcher ready
    handleRequestFullscreen(true);
    setShowLauncher(false);
  };

  const handleExitFullscreen = () => {
    (window as any).__lastExitFullscreenTime = Date.now();
    if (document.exitFullscreen) {
      document
        .exitFullscreen()
        .catch((err) => undefined);
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
    setIsFullscreen(false);
  };

  useEffect(() => {
    // Sync fullscreen state if triggered by deliberate user action or PWA mode
    const onFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    document.addEventListener("mozfullscreenchange", onFullscreenChange);
    document.addEventListener("MSFullscreenChange", onFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        onFullscreenChange,
      );
      document.removeEventListener("mozfullscreenchange", onFullscreenChange);
      document.removeEventListener("MSFullscreenChange", onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    // Auto-fullscreen KHUSUS untuk Android / Smartphone saat tampil di Halaman Landing Page
    // Menjadikan pengalaman aplikasi Smart Investment Luwu menyerupai aplikasi Android asli (Immersive Fullscreen)
    if (!isMobileOrAndroidDevice()) return;

    // Upaya langsung saat halaman dimuat
    try {
      requestSmartFullscreen();
    } catch (e) {}

    const handleAndroidInteractionFullscreen = () => {
      const lastExit = (window as any).__lastExitFullscreenTime || 0;
      // Jika pengguna baru saja keluar dari fullscreen dalam 4 detik terakhir, jangan paksa kembali
      if (Date.now() - lastExit < 4000) return;

      const isCurrentFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      if (!isCurrentFs) {
        requestSmartFullscreen();
      }
    };

    window.addEventListener("click", handleAndroidInteractionFullscreen, { capture: true, passive: true });
    window.addEventListener("touchstart", handleAndroidInteractionFullscreen, { capture: true, passive: true });
    window.addEventListener("touchend", handleAndroidInteractionFullscreen, { capture: true, passive: true });

    return () => {
      window.removeEventListener("click", handleAndroidInteractionFullscreen, { capture: true });
      window.removeEventListener("touchstart", handleAndroidInteractionFullscreen, { capture: true });
      window.removeEventListener("touchend", handleAndroidInteractionFullscreen, { capture: true });
    };
  }, []);

  useEffect(() => {
    async function fetchHeroImages() {
      try {
        const res = await fetch("/api/site-settings?keys=hero_slider_images,hero_image_url,staff_image_left,staff_image_right", {
          credentials: "same-origin",
          headers: { Accept: "application/json" }
        });
        const data = res.ok ? await res.json() : [];
        if (data && data.length > 0) {
          const leftItem = data.find(
            (d: any) => d.setting_key === "staff_image_left",
          );
          if (leftItem && leftItem.setting_value) {
            setStaffImageLeft(leftItem.setting_value);
          }
          const rightItem = data.find(
            (d: any) => d.setting_key === "staff_image_right",
          );
          if (rightItem && rightItem.setting_value) {
            setStaffImageRight(rightItem.setting_value);
          }

          const sliderItem = data.find(
            (d: any) => d.setting_key === "hero_slider_images",
          );
          if (sliderItem && sliderItem.setting_value) {
            try {
              const parsed = JSON.parse(sliderItem.setting_value);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setHeroImages(parsed);
                return;
              }
            } catch (e) {}
          }
          const singleItem = data.find(
            (d: any) => d.setting_key === "hero_image_url",
          );
          if (singleItem && singleItem.setting_value) {
            setHeroImages([singleItem.setting_value]);
          } else {
            setHeroImages([HERO_PLACEHOLDER_SVG]);
          }
        } else {
          setHeroImages([HERO_PLACEHOLDER_SVG]);
        }
      } catch (err) {
        undefined;
        setHeroImages([HERO_PLACEHOLDER_SVG]);
      }
    }
    fetchHeroImages();

    const handleStaffUpdate = () => {
      fetchHeroImages();
    };

    window.addEventListener('staff_settings_updated', handleStaffUpdate);
    return () => {
      window.removeEventListener('staff_settings_updated', handleStaffUpdate);
    };
  }, []);

  useEffect(() => {
    if (heroImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % heroImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [heroImages.length]);

  const [activeSection, setActiveSection] = useState<string>("hero-section");

  useEffect(() => {
    let ticking = false;

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          setScrollY(currentY);

          // Calculate active section safely in throttled RAF frame
          const sections = ["hero-section", "analytics-section", "ai-assistant"];
          let minDiff = Infinity;
          let bestSection = "hero-section";
          for (const sectionId of sections) {
            const el = document.getElementById(sectionId);
            if (el) {
              const rect = el.getBoundingClientRect();
              const diff = Math.abs(rect.top);
              if (diff < minDiff) {
                minDiff = diff;
                bestSection = sectionId;
              }
            }
          }
          setActiveSection((prev) => (prev !== bestSection ? bestSection : prev));

          ticking = false;
        });
        ticking = true;
      }
    };

    handleResize();
    handleScroll();
    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    setLocalIsDark(isDarkMode);
    const metaTag = document.getElementById("theme-color-meta");
    if (metaTag) {
      metaTag.setAttribute("content", isDarkMode ? "#0b0f19" : "#ffffff");
    }
  }, [isDarkMode]);

  // Tema Dinamis
  const themeBg = isDark
    ? "bg-[#0B0F19] text-white"
    : "bg-white text-slate-900";
  const cardBg = isDark
    ? "bg-slate-800/50 border-slate-700/60 backdrop-blur-xl"
    : "bg-white border-slate-200/80 shadow-sm";
  const textMuted = isDark ? "text-slate-400 font-medium" : "text-slate-600 font-medium";
  const textHighlight = isDark ? "text-blue-300 font-bold" : "text-blue-700 font-bold";
  const inputBg = isDark
    ? "bg-slate-900/60 border-slate-600/60 text-white placeholder:text-slate-500 focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/30 font-semibold"
    : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 font-semibold";

  const handleToggleTheme = () => {
    const nextDark = !isDark;
    setLocalIsDark(nextDark);
    if (setIsDarkMode) {
      setIsDarkMode(nextDark);
    }
  };

  // --- 1. State for ROI Calculator ---
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<string>("");
  
  // --- New Interactive Landing Page States ---
  const [activeRoadmapStep, setActiveRoadmapStep] = useState<number>(0);
  const [calcSector, setCalcSector] = useState<string>("kakao");
  const [calcCapital, setCalcCapital] = useState<number>(5000000000); // 5 Milyar
  const [calcArea, setCalcArea] = useState<number>(5); // 5 Ha

  const [isProfileExpanded, setIsProfileExpanded] = useState<boolean>(false);

  const [capital, setCapital] = useState<string>("5000000000"); // 5 Milyar Default
  const [opex, setOpex] = useState<string>("400000000");
  const [isUsingOSS, setIsUsingOSS] = useState<boolean>(false);
  const [annualRevenue, setAnnualRevenue] = useState<string>("1500000000");
  const [marketScope, setMarketScope] = useState<string>(
    "Nasional / Antar Pulau",
  );
  const [isCalculating, setIsCalculating] = useState(false);

  // Dynamic sector fields
  const [ticketPrice, setTicketPrice] = useState<string>("25000");
  const [visitorsPerDay, setVisitorsPerDay] = useState<string>("150");
  const [activeDaysPerWeek, setActiveDaysPerWeek] = useState<string>("7");

  const [baseYield, setBaseYield] = useState<string>("5000"); // Perkiraan Hasil/Panen/Kg
  const [pricePerUnit, setPricePerUnit] = useState<string>("25000");
  const [harvestsPerYear, setHarvestsPerYear] = useState<string>("3");

  const [volumePerDay, setVolumePerDay] = useState<string>("10");
  const [activeDaysPerMonth, setActiveDaysPerMonth] = useState<string>("20");
  const [marginPerUnit, setMarginPerUnit] = useState<string>("500000");
  const [priceLabel, setPriceLabel] = useState<string>("Harga / Satuan");

  // Economic analysis parameters (dynamic based on sector, customizable by user)
  const [discountRate, setDiscountRate] = useState<number>(10);
  const [projectionTenor, setProjectionTenor] = useState<number>(5);
  const [inflationRate, setInflationRate] = useState<number>(4.5);

  const [roiResult, setRoiResult] = useState<{
    roi: number;
    cumulativeRoi: number;
    payback: number;
    discountedPayback: number;
    netProfit: number;
    status: string;
    riskStatus: string;
    npv: number;
    irr: number;
  } | null>(null);

  const [isRoiAiModalOpen, setIsRoiAiModalOpen] = useState(false);
  const [isSpatialAiModalOpen, setIsSpatialAiModalOpen] = useState(false);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);

  // Advanced Luwu Regional Investment Features Modals
  const [isRtrwModalOpen, setIsRtrwModalOpen] = useState(false);
  const [isIncentiveModalOpen, setIsIncentiveModalOpen] = useState(false);
  const [isProximityModalOpen, setIsProximityModalOpen] = useState(false);
  const [isIproPitchModalOpen, setIsIproPitchModalOpen] = useState(false);
  const [selectedIproForModal, setSelectedIproForModal] = useState<Investment | null>(null);
  const [isFastTrackConsultationOpen, setIsFastTrackConsultationOpen] = useState(false);
  const [selectedInvestmentForConsultation, setSelectedInvestmentForConsultation] = useState<Investment | null>(null);
  const [isMppModalOpen, setIsMppModalOpen] = useState(false);

  // GIS Booting State
  const [isGisBooting, setIsGisBooting] = useState(false);
  const [gisBootTarget, setGisBootTarget] = useState<"workspace" | "default">("default");

  const handleGisClick = (e: React.MouseEvent, target: "workspace" | "default" = "workspace") => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    handleRequestFullscreen();
    setGisBootTarget(target);
    setIsGisBooting(true);
  };

  const handleGisComplete = () => {
    setIsGisBooting(false);
    if (gisBootTarget === "workspace" && onEnterWithWorkspace) {
      onEnterWithWorkspace(Role.INVESTOR, "SPATIAL_EDITOR");
    } else if (onEnterWithWorkspace) {
      onEnterWithWorkspace(Role.INVESTOR, "INVESTOR");
    } else if (onEnter) {
      onEnter(Role.INVESTOR);
    }
    navigate("/peta-spasial");
  };

  // Smart Matrix Catalogue Filter State
  const [smartFilterState, setSmartFilterState] = useState<SmartFilterState>({
    searchTerm: "",
    selectedSector: "SEMUA",
    selectedDistrict: "SEMUA",
    minRoi: 0,
    rtrwStatus: "SEMUA",
    incentiveEligibleOnly: false,
    cleanAndClearOnly: false,
  });

  const uniqueDistrictsList = useMemo(() => {
    const set = new Set<string>();
    investments.forEach((inv: any) => {
      let d = inv.districtName || inv.lokasi || inv.districtId;
      if (d && typeof d === 'string') {
        d = d.replace(/kecamatan\s+/i, "").replace(/kec\.\s*/i, "").trim();
        // capitalize
        d = d.toLowerCase().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        set.add(d);
      }
    });
    return Array.from(set).sort();
  }, [investments]);

  const uniqueInvestmentsList = useMemo(() => {
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    const result: Investment[] = [];
    investments.forEach((inv) => {
      if (!inv) return;
      const idKey = String(inv.id || "");
      const nameKey = (inv.name || "").trim().toLowerCase();
      if ((idKey && seenIds.has(idKey)) || (nameKey && seenNames.has(nameKey))) {
        return;
      }
      if (idKey) seenIds.add(idKey);
      if (nameKey) seenNames.add(nameKey);
      result.push(inv);
    });
    return result;
  }, [investments]);

  const filteredInvestmentsList = useMemo(() => {
    return investments.filter((item) => {
      const i = item as any;
      if (!i.isActive) return false;

      // Search term filter
      if (smartFilterState.searchTerm.trim() !== "") {
        const q = smartFilterState.searchTerm.toLowerCase();
        const matchTitle = (i.name || i.title || "").toLowerCase().includes(q);
        const matchSektor = (i.sector || i.sektor || "").toLowerCase().includes(q);
        const matchLoc = String(i.districtName || i.lokasi || i.districtId || "").toLowerCase().includes(q);
        if (!matchTitle && !matchSektor && !matchLoc) return false;
      }

      // Sector filter
      if (smartFilterState.selectedSector !== "SEMUA") {
        const sec = String(i.sector || i.sektor || "").toLowerCase();
        if (!sec.includes(smartFilterState.selectedSector.toLowerCase())) return false;
      }

      // District filter
      if (smartFilterState.selectedDistrict !== "SEMUA") {
        let dist = String(i.districtName || i.lokasi || i.districtId || "").toLowerCase().trim();
        dist = dist.replace(/kecamatan\s+/i, "").replace(/kec\.\s*/i, "").trim();
        let targetDist = smartFilterState.selectedDistrict.toLowerCase().trim();
        targetDist = targetDist.replace(/kecamatan\s+/i, "").replace(/kec\.\s*/i, "").trim();
        
        if (dist !== targetDist) return false;
      }

      // Clean and Clear filter
      if (smartFilterState.cleanAndClearOnly) {
        if (i.landStatus !== "Clean & Clear" && i.readinessStatus !== "Fs Ready" && i.landStatus !== "Sertifikat Hak Milik") return false;
      }

      return true;
    });
  }, [investments, smartFilterState]);

  const sensitivityChartData = useMemo(() => {
    const cap = parseFloat(capital) || 0;
    const opx = parseFloat(opex) || 0;
    let rev = parseFloat(annualRevenue) || 0;

    const selectedInv = investments.find(
      (inv) => inv.id === selectedInvestmentId,
    );
    const sector = selectedInv?.sector || "";
    if (sector === SektorInvestasi.PARIWISATA) {
      const autoVisitorsPerWeek =
        (parseFloat(visitorsPerDay) || 0) *
        (parseFloat(activeDaysPerWeek) || 0);
      rev = (parseFloat(ticketPrice) || 0) * autoVisitorsPerWeek * 52;
    } else if (
      sector === SektorInvestasi.PERTANIAN ||
      sector === SektorInvestasi.KELAUTAN
    ) {
      const autoYield =
        (parseFloat(baseYield) || 0) * (parseFloat(harvestsPerYear) || 0);
      rev = autoYield * (parseFloat(pricePerUnit) || 0);
    } else if (
      sector === SektorInvestasi.PERTAMBANGAN ||
      sector === SektorInvestasi.PERDAGANGAN
    ) {
      const autoVolumePerMonth =
        (parseFloat(volumePerDay) || 0) *
        (parseFloat(activeDaysPerMonth) || 0);
      rev = autoVolumePerMonth * (parseFloat(marginPerUnit) || 0) * 12;
    }

    if (cap <= 0 || rev <= 0) return [];

    const data = [];
    // Generate data points for discount rates from 2% to 26%
    for (let r = 2; r <= 26; r += 2) {
      const rateVal = r / 100;

      // 1. Baseline scenario with current inflationRate
      let npvNormal = -cap;
      for (let t = 1; t <= projectionTenor; t++) {
        const rev_t = rev * Math.pow(1 + 0.02, t - 1);
        const opex_t = opx * Math.pow(1 + inflationRate / 100, t - 1);
        const netProfit_t = rev_t - opex_t;
        npvNormal += netProfit_t / Math.pow(1 + rateVal, t);
      }

      // 2. High inflation scenario (inflation rate increased by 5% points)
      const highInflation = inflationRate + 5;
      let npvHigh = -cap;
      for (let t = 1; t <= projectionTenor; t++) {
        const rev_t = rev * Math.pow(1 + 0.02, t - 1);
        const opex_t = opx * Math.pow(1 + highInflation / 100, t - 1);
        const netProfit_t = rev_t - opex_t;
        npvHigh += netProfit_t / Math.pow(1 + rateVal, t);
      }

      // 3. Stable scenario (0% inflation - optimal cost control)
      let npvStable = -cap;
      for (let t = 1; t <= projectionTenor; t++) {
        const rev_t = rev * Math.pow(1 + 0.02, t - 1);
        const opex_t = opx * Math.pow(1 + 0 / 100, t - 1);
        const netProfit_t = rev_t - opex_t;
        npvStable += netProfit_t / Math.pow(1 + rateVal, t);
      }

      data.push({
        rateLabel: `${r}%`,
        rateVal: r,
        "Baseline": Math.round(npvNormal / 1e6), // in Millions of Rupiah for clean y-axis
        "Inflasi Tinggi (+5%)": Math.round(npvHigh / 1e6),
        "Tanpa Inflasi (0%)": Math.round(npvStable / 1e6),
      });
    }

    return data;
  }, [capital, opex, annualRevenue, projectionTenor, inflationRate, selectedInvestmentId, investments]);

  const getSimulationContext = () => {
    const selectedInv = investments.find(
      (inv) => inv.id === selectedInvestmentId,
    );
    const sector = selectedInv?.sector || "";

    const cap = parseFloat(capital) || 0;
    const opx = parseFloat(opex) || 0;

    let rev = parseFloat(annualRevenue) || 0;
    if (sector === SektorInvestasi.PARIWISATA) {
      const autoVisitorsPerWeek =
        (parseFloat(visitorsPerDay) || 0) *
        (parseFloat(activeDaysPerWeek) || 0);
      rev = (parseFloat(ticketPrice) || 0) * autoVisitorsPerWeek * 52;
    } else if (
      sector === SektorInvestasi.PERTANIAN ||
      sector === SektorInvestasi.KELAUTAN
    ) {
      const autoYield =
        (parseFloat(baseYield) || 0) * (parseFloat(harvestsPerYear) || 0);
      rev = autoYield * (parseFloat(pricePerUnit) || 0);
    } else if (
      sector === SektorInvestasi.PERTAMBANGAN ||
      sector === SektorInvestasi.PERDAGANGAN
    ) {
      const autoVolumePerMonth =
        (parseFloat(volumePerDay) || 0) * (parseFloat(activeDaysPerMonth) || 0);
      rev = autoVolumePerMonth * (parseFloat(marginPerUnit) || 0) * 12;
    }

    const roi = roiResult?.roi ?? 0;
    const cumulativeRoi = roiResult?.cumulativeRoi ?? 0;
    const bep = roiResult?.payback ?? 0;
    const discountedPayback = roiResult?.discountedPayback ?? 0;
    const npv = roiResult?.npv ?? 0;
    const irr = roiResult?.irr ?? 0;

    return {
      name: selectedInv?.name || "Sektor Potensi Umum",
      sector: sector,
      capex: cap,
      opex: opx,
      asumsiPendapatan: rev,
      roi: roi,
      cumulativeRoi: cumulativeRoi,
      bep: bep,
      discountedPayback: discountedPayback,
      npv: npv,
      irr: irr,
      isUsingOSS: isUsingOSS,
    };
  };

  const formatInputAmount = (value: string) => {
    if (!value) return "";
    const num = parseInt(value, 10);
    if (isNaN(num)) return "";
    return num.toLocaleString("id-ID");
  };

  const handleNumericInput = (
    val: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    const rawValue = val.replace(/\D/g, "");
    setter(rawValue);
  };

  const calculateROI = (showLoading = false) => {
    const runCalculation = () => {
      const selectedInv = investments.find(
        (inv) => inv.id === selectedInvestmentId,
      );
      const sector = selectedInv?.sector || "";

      const cap = parseFloat(capital) || 0;
      const opx = parseFloat(opex) || 0;

      let rev = parseFloat(annualRevenue) || 0;
      if (sector === SektorInvestasi.PARIWISATA) {
        const autoVisitorsPerWeek =
          (parseFloat(visitorsPerDay) || 0) *
          (parseFloat(activeDaysPerWeek) || 0);
        rev = (parseFloat(ticketPrice) || 0) * autoVisitorsPerWeek * 52;
      } else if (
        sector === SektorInvestasi.PERTANIAN ||
        sector === SektorInvestasi.KELAUTAN
      ) {
        const autoYield =
          (parseFloat(baseYield) || 0) * (parseFloat(harvestsPerYear) || 0);
        rev = autoYield * (parseFloat(pricePerUnit) || 0);
      } else if (
        sector === SektorInvestasi.PERTAMBANGAN ||
        sector === SektorInvestasi.PERDAGANGAN
      ) {
        const autoVolumePerMonth =
          (parseFloat(volumePerDay) || 0) *
          (parseFloat(activeDaysPerMonth) || 0);
        rev = autoVolumePerMonth * (parseFloat(marginPerUnit) || 0) * 12;
      }

      if (cap > 0 && rev > 0) {
        const netProfit = rev - opx;
        const roi = (netProfit / cap) * 100;
        const cumulativeRoi = ((netProfit * projectionTenor) / cap) * 100;
        
        const payback = netProfit > 0 ? cap / netProfit : 999;

        // Calculate Discounted Payback Period (DPB) using time value of money and inflation
        let discountedPayback = 999;
        let accumulatedDCF = 0;
        const rateVal = discountRate / 100;
        let isPaidBack = false;

        for (let t = 1; t <= projectionTenor; t++) {
          const rev_t = rev * Math.pow(1 + 0.02, t - 1);
          const opex_t = opx * Math.pow(1 + inflationRate / 100, t - 1);
          const netProfit_t = rev_t - opex_t;
          
          const dcf = netProfit_t / Math.pow(1 + rateVal, t);
          accumulatedDCF += dcf;
          if (accumulatedDCF >= cap && !isPaidBack) {
            const prevAccum = accumulatedDCF - dcf;
            const needed = cap - prevAccum;
            discountedPayback = (t - 1) + (needed / dcf);
            isPaidBack = true;
          }
        }

        let riskPoints = 0;
        if (payback > 0 && payback <= 3) riskPoints += 1;
        else if (payback <= 5) riskPoints += 2;
        else riskPoints += 3;

        if (marketScope === "Lokal") riskPoints += 1;
        else if (marketScope === "Nasional / Antar Pulau") riskPoints += 2;
        else riskPoints += 3;

        let riskStatus = "Resiko Tinggi";
        if (riskPoints <= 2) riskStatus = "Resiko Rendah";
        else if (riskPoints <= 4) riskStatus = "Resiko Menengah";

        // Calculate NPV (dynamic rate, dynamic inflation, and dynamic projection tenor)
        let npv = -cap;
        for (let t = 1; t <= projectionTenor; t++) {
          const rev_t = rev * Math.pow(1 + 0.02, t - 1);
          const opex_t = opx * Math.pow(1 + inflationRate / 100, t - 1);
          const netProfit_t = rev_t - opex_t;
          npv += netProfit_t / Math.pow(1 + rateVal, t);
        }

        // Calculate IRR using robust discount search for dynamic tenor and dynamic inflation
        let irr = 0;
        if (netProfit > 0) {
          let low = -0.99;
          let high = 10.0; // limit search at max 1000%
          let bisectionIrr = 0;
          for (let i = 0; i < 100; i++) {
            bisectionIrr = (low + high) / 2;
            let computedNpv = -cap;
            for (let t = 1; t <= projectionTenor; t++) {
              const rev_t = rev * Math.pow(1 + 0.02, t - 1);
              const opex_t = opx * Math.pow(1 + inflationRate / 100, t - 1);
              const netProfit_t = rev_t - opex_t;
              computedNpv += netProfit_t / Math.pow(1 + bisectionIrr, t);
            }
            if (Math.abs(computedNpv) < 1e-4) break;
            if (computedNpv > 0) low = bisectionIrr;
            else high = bisectionIrr;
          }
          irr = bisectionIrr * 100;
        }

        let status = "NOT_FEASIBLE";
        if (netProfit <= 0 || npv < 0 || irr < 0) {
          status = "NOT_FEASIBLE";
        } else if (npv > 0 && irr >= discountRate) {
          status = "FEASIBLE";
        } else {
          status = "MODERATE";
        }

        const calculationResult = {
          roi,
          cumulativeRoi,
          payback,
          discountedPayback,
          netProfit,
          status,
          riskStatus,
          npv,
          irr,
          capex: parseFloat(capital) || 0,
          opex: parseFloat(opex) || 0,
        };
        setRoiResult(calculationResult);
        (window as any).lastLuwuSimulation = calculationResult;
      } else {
        setRoiResult(null);
      }
    };

    if (showLoading) {
      setIsCalculating(true);
      setTimeout(() => {
        runCalculation();
        setIsCalculating(false);
      }, 600);
    } else {
      runCalculation();
    }
  };

  const handleTriggerAiAnalysis = async () => {
    if (isAiTyping) return;

    const context = getSimulationContext();
    const userPrompt = `Tolong berikan analisis kelayakan finansial dan korelasi spasial real-time untuk simulasi potensi investasi "${context.name}".`;

    setMessages((prev) => [...prev, { role: "user", text: userPrompt }]);
    setIsAiTyping(true);

    try {
      const formattedHistory = messages.map((m) => {
        const textVal =
          typeof m.text === "string" ? m.text.trim() : String(m.text || "");
        return {
          role: m.role || "user",
          parts: [{ text: textVal || " " }],
        };
      });

      const res = await fetch(
        "/api/gemini/chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userPrompt,
            history: formattedHistory,
            investmentContext: selectedInvObj || null,
            simulationContext: {
              ...context,
              isUsingOSS
            },
            language: i18n.language,
          }),
        },
      );

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = { text: "Terjadi kesalahan pada respon server." };
      }

      if (res.ok) {
        const fullReply =
          data.text || data.reply || "Analisis spasial selesai.";
        let currentText = "";
        const words = fullReply.split(" ");
        let i = 0;

        setMessages((prev) => [...prev, { role: "model", text: "" }]);

        const intervalId = setInterval(() => {
          if (i < words.length) {
            currentText += (i === 0 ? "" : " ") + words[i];
            setMessages((prev) => {
              const updated = [...prev];
              if (updated.length > 0) {
                updated[updated.length - 1] = {
                  role: "model",
                  text: currentText,
                };
              }
              return updated;
            });
            i++;
          } else {
            clearInterval(intervalId);
          }
        }, 15); // faster word typing (15ms) for a very fluid and engaging response
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            text: `Gagal menganalisis, Bapak/Ibu: ${data.error || data.text || "Kesalahan Server"}`,
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "Gagal terhubung dengan server kecerdasan AI, Bapak/Ibu.",
        },
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  useEffect(() => {
    if (selectedInvestmentId) {
      const selectedInv = investments.find(
        (inv) => inv.id === selectedInvestmentId,
      );
      if (selectedInv) {
        setCapital(""); // Dikongsongkan agar investor bisa input manual
        setOpex("");    // Dikongsongkan agar investor bisa input manual
        
        // Dynamic sector-specific financial parameters (Standard economic risk pricing)
        let dRate = 10;
        let dTenor = 5;
        const sec = selectedInv.sector;
        if (sec === SektorInvestasi.PERTANIAN) {
          dRate = 12; // Higher climate, crop disease, and commodity risk
          dTenor = 8; // Longer development and planting lifecycle
        } else if (sec === SektorInvestasi.KELAUTAN) {
          dRate = 11; // Weather fluctuation & supply chain risks
          dTenor = 5; // Standard equipment amortization
        } else if (sec === SektorInvestasi.PERTAMBANGAN) {
          dRate = 14; // Capital intensive, heavy environmental & regulatory risk
          dTenor = 10; // Long-term extraction concessions
        } else if (sec === SektorInvestasi.PARIWISATA) {
          dRate = 11; // Seasonal dependency and infrastructure development risk
          dTenor = 7; // Medium-long-term payback
        } else if (sec === SektorInvestasi.PERDAGANGAN) {
          dRate = 9; // Lower barrier to entry, fast cash flow cycle
          dTenor = 5;
        }
        setDiscountRate(dRate);
        setProjectionTenor(dTenor);
      }
    }
  }, [selectedInvestmentId, investments]);

  useEffect(() => {
    calculateROI(false);
  }, [capital, opex, annualRevenue, discountRate, projectionTenor, inflationRate, selectedInvestmentId]);

  // --- 2. State for AI Q&A Consultant ---
  const [messages, setMessages] = useState<
    { role: "user" | "model"; text: string }[]
  >([
    {
      role: "model",
      text: "Halo! Saya Asisten Investasi Luwu. Saya siap membantu Anda menganalisis kelayakan lokasi, rincian komoditas, regulasi PKKPR, dan potensi tata ruang Kabupaten Luwu. Silakan ajukan pertanyaan Anda!",
    },
  ]);
  const [aiInput, setAiInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const selectedInvObj = investments.find(
    (inv) => inv.id === selectedInvestmentId,
  );
  const selectedSector = selectedInvObj?.sector || "";

  const MARKET_PRICES: Record<string, { price: number; label: string }> = {
    kakao: { price: 100000, label: "Harga / Kg (Kakao)" },
    rumput_laut: { price: 15000, label: "Harga / Kg (Rumput Laut)" },
    tuna: { price: 60000, label: "Harga / Kg (Ikan Tuna)" },
    bandeng: { price: 25000, label: "Harga / Kg (Ikan Bandeng)" },
    udang: { price: 80000, label: "Harga / Kg (Udang)" },
    pariwisata: { price: 10000, label: "Harga Tiket Masuk" },
    perdagangan: { price: 10000, label: "Harga Rata-Rata Produk" },
    default: { price: 0, label: "Harga / Satuan" }
  };


  useEffect(() => {
    let key = 'default';
    if (selectedSector === SektorInvestasi.PARIWISATA) {
      key = 'pariwisata';
    } else if (selectedSector === SektorInvestasi.PERDAGANGAN) {
      key = 'perdagangan';
    } else if (selectedInvObj?.subSector) {
      const sub = selectedInvObj.subSector.toLowerCase();
      if (sub.includes('kakao')) key = 'kakao';
      else if (sub.includes('rumput laut')) key = 'rumput_laut';
      else if (sub.includes('tuna')) key = 'tuna';
      else if (sub.includes('bandeng')) key = 'bandeng';
      else if (sub.includes('udang')) key = 'udang';
    }
    const { price, label } = MARKET_PRICES[key] || MARKET_PRICES.default;
    
    if (label !== "Harga / Satuan") {
      setPriceLabel(label);
    } else {
      setPriceLabel(`Harga / Kg (${selectedInvObj?.subSector || "Komoditas"})`);
    }
    
    if (price > 0) {
      if (selectedSector === SektorInvestasi.PARIWISATA) {
        setTicketPrice(price.toString());
      } else if (selectedSector === SektorInvestasi.PERTANIAN || selectedSector === SektorInvestasi.KELAUTAN) {
        setPricePerUnit(price.toString());
      } else if (selectedSector === SektorInvestasi.PERDAGANGAN || selectedSector === SektorInvestasi.PERTAMBANGAN) {
        setMarginPerUnit(price.toString());
      }
    }
  }, [selectedSector, selectedInvObj?.subSector]);

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || isAiTyping) return;

    const userMessage = aiInput;
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setAiInput("");
    setIsAiTyping(true);

    try {
      const formattedHistory = messages.map((m) => {
        const textVal =
          typeof m.text === "string" ? m.text.trim() : String(m.text || "");
        return {
          role: m.role || "user",
          parts: [{ text: textVal || " " }],
        };
      });

      const res = await fetch(
        "/api/gemini/chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessage,
            history: formattedHistory,
            investmentContext: null,
            language: i18n.language,
          }),
        },
      );
      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = { text: "Terjadi kesalahan pada respon server." };
      }

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "model", text: data.text || data.reply || "No response" },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            text: `Maaf, terjadi kesalahan: ${data.error || data.text || "Unknown Error"}`,
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "Koneksi ke server AI terputus. Coba lagi nanti.",
        },
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isAiTyping]);

  const formatRupiah = (val: number) => {
    return formatRupiahSingkat(val);
  };

  // Metrics Logic
  const totalInvestmentValue = investments.reduce(
    (acc, inv) => acc + (inv.investmentValue || 0),
    0,
  );
  const activeOpportunities = investments.filter((i) => i.isActive).length;
  
  const pkkprIssuedCount = useMemo(() => {
    if (!investments || investments.length === 0) return 0;
    return investments.filter((item: any) => {
      const hasDocNum = Boolean(
        item.pkkpr_doc_number || 
        item.sk_pkkpr_doc_number || 
        item.pkkprDocNumber || 
        item.skPkkprDocNumber ||
        item.override_document_ref ||
        item.overrideDocumentRef
      );
      const isApproved = 
        item.pkkprStatus === 'Approved' || 
        item.pkkpr_status === 'Approved' ||
        item.status === 'Approved' ||
        item.status === 'Published';
      return hasDocNum || isApproved;
    }).length;
  }, [investments]);

  const totalLabor = useMemo(() => {
    if (stats?.totalLabor !== undefined && stats?.totalLabor !== null && Number(stats.totalLabor) > 0) {
      return Number(stats.totalLabor);
    }
    return (investments || []).reduce((sum: number, inv: any) => {
      const rawVal = inv.komitmenTenagaLokal ?? inv.komitmen_tenaga_lokal ?? inv.penyerapan_tenaga_kerja ?? inv.penyerapanTenagaKerja ?? inv.tenagaKerja ?? inv.tenaga_kerja ?? inv.tenagaLokal ?? inv.tenaga_lokal ?? inv.tkl ?? 0;
      const num = typeof rawVal === "number" ? rawVal : parseFloat(String(rawVal).replace(/[^0-9.]/g, "")) || 0;
      const rawForeign = inv.komitmenTenagaAsing ?? inv.komitmen_tenaga_asing ?? inv.tenagaAsing ?? inv.tenaga_asing ?? inv.tka ?? 0;
      const numForeign = typeof rawForeign === "number" ? rawForeign : parseFloat(String(rawForeign).replace(/[^0-9.]/g, "")) || 0;
      return sum + num + numForeign;
    }, 0);
  }, [stats?.totalLabor, investments]);

  const {
    pmdnPercentage,
    pmaPercentage,
    hasPerformanceData,
    spatialDistributionText,
    totalInvestmentText,
    achievementPercentageText,
    achievementRatio,
  } = useMemo(() => {
    const totalVal = investments.reduce((acc, inv) => acc + (inv.investmentValue || 0), 0);
    const targetVal = 2500000000000; // Rp 2.5 Triliun

    const hasInvs = investments && investments.length > 0 && totalVal > 0;
    const hasDists = districts && districts.length > 0;

    let pmdnVal = 0;
    let pmaVal = 0;

    if (hasInvs) {
      investments.forEach((inv) => {
        const val = inv.investmentValue || 0;
        const target = (
          inv.smartData?.targetInvestor ||
          inv.smartData?.target_investor ||
          (inv as any).targetInvestor ||
          "PMDN"
        ).toLowerCase();
        
        if (target.includes("pma") || target.includes("asing") || target.includes("foreign")) {
          pmaVal += val;
        } else {
          pmdnVal += val;
        }
      });
    }

    const pmdnPercent = hasInvs ? ((pmdnVal / totalVal) * 100).toFixed(1) + "%" : "Belum ada data tersedia";
    const pmaPercent = hasInvs ? ((pmaVal / totalVal) * 100).toFixed(1) + "%" : "Belum ada data tersedia";
    const achievementPercent = hasInvs ? ((totalVal / targetVal) * 100).toFixed(1) + "%" : "Belum ada data tersedia";
    const ratio = hasInvs ? Math.min(100, (totalVal / targetVal) * 100) : 0;

    const spatialText = hasDists
      ? (i18n.language?.startsWith("zh") 
          ? `${districts.length} 个区` 
          : i18n.language?.startsWith("en") 
            ? `${districts.length} Sub-districts` 
            : `${districts.length} Kecamatan`)
      : "Belum ada data tersedia";

    return {
      pmdnPercentage: pmdnPercent,
      pmaPercentage: pmaPercent,
      hasPerformanceData: hasInvs,
      spatialDistributionText: spatialText,
      totalInvestmentText: hasInvs ? formatRupiah(totalVal) : "Belum ada data tersedia",
      achievementPercentageText: achievementPercent,
      achievementRatio: ratio,
    };
  }, [investments, districts, i18n.language]);

  // Chart Data: Sector breakdown
  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#6366f1",
    "#ec4899",
    "#8b5cf6",
  ];
    const sectorData = useMemo(() => {
    const counts: Record<string, number> = {};
    investments.forEach((inv) => {
      counts[inv.sector] =
        (counts[inv.sector] || 0) + (inv.investmentValue || 0);
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0);
  }, [investments]);

  // Chart Data: Top Kecamatan by Area
  const districtData = useMemo(() => {
    const counts: Record<string, number> = {};
    investments.forEach((inv) => {
      const dMatch = districts.find((d) => d.id === inv.districtId);
      const locName = dMatch ? dMatch.name : inv.districtId || "Luwu";
      counts[locName] = (counts[locName] || 0) + (inv.areaHa || 0);
    });
    return Object.entries(counts)
      .map(([name, Area]) => ({
        name: name.length > 20 ? name.substring(0, 20) + "..." : name,
        Area,
      }))
      .sort((a, b) => b.Area - a.Area)
      .slice(0, 5); // top 5
  }, [investments, districts]);

  // Chart Data: Commodity by District (Stacked)
  const commodityByDistrictData = useMemo(() => {
    const dataMap: Record<string, any> = {};
    const sectorsSet = new Set<string>();

    investments.forEach((inv) => {
      const dMatch = districts.find((d) => d.id === inv.districtId);
      const locName = dMatch ? dMatch.name : inv.districtId || "Luwu";

      const sector = inv.sector || "Lainnya";
      sectorsSet.add(sector);

      if (!dataMap[locName]) {
        dataMap[locName] = {
          name:
            locName.length > 12 ? locName.substring(0, 12) + "..." : locName,
          total: 0,
        };
      }

      dataMap[locName][sector] =
        (dataMap[locName][sector] || 0) + (inv.investmentValue || 0);
      dataMap[locName].total += inv.investmentValue || 0;
    });

    return {
      data: Object.values(dataMap)
        .sort((a, b) => b.total - a.total)
        .slice(0, 7), // Top 7
      sectors: Array.from(sectorsSet),
    };
  }, [investments, districts]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSelectCommodityFromTicker = (commodity: CommodityItem) => {
    // 1. Scroll smoothly to the ROI Simulator (analytics-section)
    scrollToSection("analytics-section");

    // 2. Identify potential investment or sector matching the commodity
    const norm = (commodity.label || "").toUpperCase();
    let matchedSector = SektorInvestasi.PERTANIAN;
    if (
      norm.includes("RUMPUT LAUT") ||
      norm.includes("NILA") ||
      norm.includes("SEAWEED") ||
      norm.includes("TILAPIA")
    ) {
      matchedSector = SektorInvestasi.KELAUTAN;
    } else if (
      norm.includes("NIKEL") ||
      norm.includes("EMAS") ||
      norm.includes("GOLD") ||
      norm.includes("NICKEL")
    ) {
      matchedSector = SektorInvestasi.PERTAMBANGAN;
    }

    // Try finding an investment matching the commodity name or sector
    const matchInv = investments.find((inv) => {
      const invName = (inv.name || "").toUpperCase();
      if (norm.includes("KAKAO") && invName.includes("KAKAO")) return true;
      if (norm.includes("KOPI") && invName.includes("KOPI")) return true;
      if (norm.includes("SAWIT") && invName.includes("SAWIT")) return true;
      if (
        norm.includes("RUMPUT LAUT") &&
        (invName.includes("RUMPUT LAUT") || invName.includes("RUMPUT"))
      )
        return true;
      if (norm.includes("CENGKEH") && invName.includes("CENGKEH")) return true;
      if (
        norm.includes("PADI") &&
        (invName.includes("PADI") || invName.includes("BERAS"))
      )
        return true;
      if (norm.includes("JAGUNG") && invName.includes("JAGUNG")) return true;
      if (norm.includes("EMAS") && invName.includes("EMAS")) return true;
      if (norm.includes("NIKEL") && invName.includes("NIKEL")) return true;
      return false;
    }) || investments.find((inv) => inv.sector === matchedSector);

    if (matchInv) {
      setSelectedInvestmentId(matchInv.id);
    }

    // Update commodity price
    if (commodity.price > 0) {
      setPricePerUnit(Math.round(commodity.price).toString());
      setMarginPerUnit(Math.round(commodity.price).toString());
    }

    setTimeout(() => {
      calculateROI(false);
    }, 150);
  };

  const isHomeActive = activeSection === "hero-section";
  const isSimulatorActive = activeSection === "analytics-section";
  const isAiActive = activeSection === "ai-assistant";

  const stepsData = [
    {
      num: "01",
      title: t("roadmap.steps.0.title", "Pembuatan NIB Mandiri"),
      short: t("roadmap.steps.0.short", "Akses Instan OSS RBA Pusat"),
      long_title: t("roadmap.steps.0.long_title", "Kualifikasi NIB Mandiri (Nomor Induk Berusaha)"),
      agency: t("roadmap.steps.0.agency", "OSS RBA BKPM Nasional"),
      duration: t("roadmap.steps.0.duration", "Instan (< 1 Hari)"),
      desc: t("roadmap.steps.0.desc", "NIB merupakan identitas pelaku usaha sekaligus legalitas utama untuk memulai kegiatan bisnis. Proses pengurusan dilakukan secara daring penuh melalui sistem OSS-RBA. Bagi pelaku usaha mikro dan kecil (UMK) risiko rendah, NIB sekaligus berlaku sebagai Perizinan Tunggal."),
      requirements: [
        t("roadmap.steps.0.requirements.0", "KTP Pendiri / Paspor (Asing)"),
        t("roadmap.steps.0.requirements.1", "NPWP Perusahaan / Badan Usaha"),
        t("roadmap.steps.0.requirements.2", "Akta Pendirian (PT, CV, atau Koperasi)"),
        t("roadmap.steps.0.requirements.3", "Rencana Anggaran Modal Kerja")
      ],
      icon: Shield,
      color: "text-blue-500"
    },
    {
      num: "02",
      title: t("roadmap.steps.1.title", "Persetujuan PKKPR"),
      short: t("roadmap.steps.1.short", "Validasi Kesesuaian Tata Ruang"),
      long_title: t("roadmap.steps.1.long_title", "Validasi PKKPR Spasial Terpadu Luwu"),
      agency: t("roadmap.steps.1.agency", "Dinas PUPR & DPMPTSP Luwu"),
      duration: t("roadmap.steps.1.duration", "3 - 5 Hari Kerja"),
      desc: t("roadmap.steps.1.desc", "Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) adalah dasar perizinan lokasi. Sistem InvestLuwu melakukan sinkronisasi instan koordinat plot lahan Anda dengan Rencana Tata Ruang Wilayah (RTRW) kabupaten, menjamin kepastian hukum pemanfaatan ruang bebas sengketa."),
      requirements: [
        t("roadmap.steps.1.requirements.0", "Koordinat Geospasial Lahan (Polygon)"),
        t("roadmap.steps.1.requirements.1", "Proposal Teknis Penggunaan Lahan"),
        t("roadmap.steps.1.requirements.2", "Bukti Kepemilikan Lahan yang Sah"),
        t("roadmap.steps.1.requirements.3", "Dokumen NIB yang Telah Terbit")
      ],
      icon: Layers,
      color: "text-emerald-500"
    },
    {
      num: "03",
      title: t("roadmap.steps.2.title", "Persetujuan Lingkungan"),
      short: t("roadmap.steps.2.short", "Kajian AMDAL / UKL-UPL Hijau"),
      long_title: t("roadmap.steps.2.long_title", "Sertifikasi Lingkungan (AMDAL & UKL-UPL)"),
      agency: t("roadmap.steps.2.agency", "Dinas Lingkungan Hidup Luwu"),
      duration: t("roadmap.steps.2.duration", "10 - 15 Hari Kerja"),
      desc: t("roadmap.steps.2.desc", "Kewajiban dokumen lingkungan disesuaikan berdasarkan skala usaha dan potensi dampak lingkungan hidup. Tim teknis Dinas Lingkungan Hidup Kab. Luwu menyediakan asistensi digital penuh melalui AMDALNET untuk memangkas birokrasi penyusunan dokumen secara transparan."),
      requirements: [
        t("roadmap.steps.2.requirements.0", "NIB & Formulir PKKPR Terbit"),
        t("roadmap.steps.2.requirements.1", "Desain Layout Operasional Industri"),
        t("roadmap.steps.2.requirements.2", "Pernyataan Kesanggupan Pengelolaan"),
        t("roadmap.steps.2.requirements.3", "Dokumen Kajian Teknis Limbah Cair")
      ],
      icon: Leaf,
      color: "text-teal-500"
    },
    {
      num: "04",
      title: t("roadmap.steps.3.title", "Persetujuan Bangunan Gedung (PBG)"),
      short: t("roadmap.steps.3.short", "Izin Konstruksi & Bangunan Fisik"),
      long_title: t("roadmap.steps.3.long_title", "Persetujuan Bangunan Gedung (PBG & SLF)"),
      agency: t("roadmap.steps.3.agency", "Dinas PUPR & Tata Ruang Luwu"),
      duration: t("roadmap.steps.3.duration", "7 - 10 Hari Kerja"),
      desc: t("roadmap.steps.3.desc", "Persetujuan Bangunan Gedung (PBG) menggantikan Izin Mendirikan Bangunan (IMB). Izin ini diterbitkan untuk memastikan konstruksi fisik gedung memenuhi standar keselamatan teknis, dilanjutkan dengan Sertifikat Laik Fungsi (SLF) pasca-konstruksi."),
      requirements: [
        t("roadmap.steps.3.requirements.0", "Gambar Teknis Detail Arsitektur Gedung"),
        t("roadmap.steps.3.requirements.1", "Perhitungan Struktur Beton & Baja"),
        t("roadmap.steps.3.requirements.2", "Hasil Tes Penyelidikan Tanah (Sondir)"),
        t("roadmap.steps.3.requirements.3", "Persetujuan Lingkungan Terbit")
      ],
      icon: Building,
      color: "text-indigo-500"
    }
  ];

  return (
    <div
      className={`min-h-screen transition-colors duration-500 font-sans ${themeBg} overflow-x-hidden selection:bg-blue-500/30 pb-36 sm:pb-28 lg:pb-16`}
    >
      <AnimatePresence>
        {showLauncher && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950 p-4 text-white font-sans cursor-pointer overflow-hidden"
            style={{
              background:
                "radial-gradient(circle at center, #020617 0%, #000000 100%)",
            }}
            onClick={() => {
              if (launchReadyToEnter) {
                handleLaunchApp();
              }
            }}
          >
            {/* Ambient Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-35" />
            <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse" />
            <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-[130px] animate-pulse" />

            <div className="relative max-w-sm w-full flex flex-col items-center text-center gap-10">
              {/* Main Branding Logo */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-full blur-xl opacity-60 animate-pulse" />
                <div className="relative w-32 h-32 rounded-full bg-gradient-to-b from-slate-800 to-slate-950 border-4 border-slate-700 p-1 flex items-center justify-center shadow-2xl">
                  <div className="w-full h-full rounded-full bg-slate-900 border border-slate-800 flex flex-col items-center justify-center overflow-hidden">
                    <img
                      src={LUWU_LOGO_BASE64}
                      alt="Logo Luwu"
                      className="w-16 h-16 object-contain drop-shadow-2xl brightness-110"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-white flex gap-1 justify-center relative">
                  InvestLuwu <span className="text-emerald-700 dark:text-emerald-400">{t("landing.gateway", "Gateway")}</span>
                </h1>
                <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400/80 uppercase tracking-[0.08em]">
                  {t("footer.gov")}
                </p>
              </div>

              {/* Progress UI */}
              <div className="w-full mt-4 flex flex-col gap-4">
                {!launchReadyToEnter ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-end text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                      <span className="truncate">{t(launchStatusText)}</span>
                      <span>{launchProgress}%</span>
                    </div>
                    {/* Modern thin progress bar */}
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-400"
                        animate={{ width: `${launchProgress}%` }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="px-6 py-3 min-h-[44px] rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold text-sm tracking-[0.08em] uppercase animate-pulse flex items-center gap-2">
                      {isMobile ? (
                        <Maximize2 className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      {isMobile
                        ? t("launcher.tapToStart", "Ketuk Layar Untuk Memulai")
                        : t("launcher.enterSystem", "Masuk Ke Sistem")}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* System Info */}
              <div className="absolute -bottom-32 text-[11px] sm:text-xs font-mono text-white brightness-125 uppercase tracking-[0.08em] text-center opacity-100 font-bold drop-shadow-md">
                {t("launcher.tagline", "AYO BERINVESTASI DI KABUPATEN LUWU")}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full blur-[120px] opacity-30 ${isDark ? "bg-blue-900" : "bg-blue-200"}`}
        />
        <div
          className={`absolute top-[40%] -right-[20%] w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-20 ${isDark ? "bg-indigo-900" : "bg-indigo-200"}`}
        />
        <div
          className={`absolute -bottom-[20%] left-[20%] w-[80vw] h-[80vw] rounded-full blur-[150px] opacity-20 ${isDark ? "bg-cyan-900" : "bg-cyan-200"}`}
        />
      </div>

      

      {/* TOP NAVIGATION BAR */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className={`fixed top-0 left-0 w-full z-[100] border-b shadow-sm transition-colors duration-500 ease-in-out ${isDark ? "bg-slate-950/70 border-white/5 shadow-black/20" : "bg-white/80 border-slate-200/50 shadow-slate-200/30"}`}
        style={{ paddingTop: 'env(safe-area-inset-top)', backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
      >
        <div className="max-w-screen-2xl mx-auto px-2.5 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-1.5 sm:gap-4">
            {/* Logo area */}
            <div
              className="flex items-center gap-1.5 sm:gap-3 cursor-pointer shrink-0 group"
              onClick={() => scrollToSection("hero-section")}
            >
              <div className="p-1 sm:p-2 rounded-[12px] bg-gradient-to-br from-blue-600/10 to-emerald-600/10 shrink-0 border border-blue-500/10 group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
                <img
                  src={LUWU_LOGO_BASE64}
                  alt="Logo Kabupaten Luwu"
                  className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span
                className={`font-extrabold text-sm sm:text-xl tracking-tight whitespace-nowrap block transition-colors duration-500 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                InvestLuwu<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500 font-extrabold ml-0.5">{t("landing.hub", "Hub")}</span>
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {[
                { name: t("nav.dashboard"), id: "hero-section" },
                {
                  name: t("nav.gis"),
                  action: (e: any) => {
                    handleGisClick(e, "default");
                  },
                },
                { name: t("nav.potensi"), id: "potensi-section" },
                {
                  name: "MPP",
                  action: (e: any) => {
                    e?.preventDefault?.();
                    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
                      window.history.scrollRestoration = 'manual';
                    }
                    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                    if (document.documentElement) document.documentElement.scrollTop = 0;
                    if (document.body) document.body.scrollTop = 0;
                    handleRequestFullscreen();
                    navigate("/mpp");
                  },
                },
                {
                  name: t("nav.pengaduan"),
                  action: (e: any) => {
                    e?.preventDefault?.();
                    handleRequestFullscreen();
                    navigate("/login?role=masyarakat");
                  }
                },
              ].map((item) => (
                <motion.button whileTap={{ scale: 0.95 }}
                  type="button"
                  key={item.name}
                  onClick={(e) => {
                    if (item.action) {
                      item.action(e);
                    } else if (item.id) {
                      scrollToSection(item.id);
                    }
                  }}
                  className={`px-4 py-2.5 min-h-[44px] rounded-full text-sm font-bold transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5 relative group ${isDark ? "text-slate-100 hover:text-white" : "text-slate-900 hover:text-blue-700"}`}
                >
                  <span className="relative z-10">{item.name}</span>
                  <div className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isDark ? "bg-white/10" : "bg-blue-50"}`} />
                </motion.button>
              ))}
            </div>

            {/* Actions: Fullscreen, Language Toggle, Data-Sync Audit, Theme Toggle, Mobile Menu & Login */}
            <div className="flex items-center gap-1 sm:gap-2.5 shrink-0 ml-auto">
              {/* Tombol Fullscreen Layar Penuh Android / Desktop */}
              <motion.button whileTap={{ scale: 0.95 }}
                type="button"
                onClick={isFullscreen ? handleExitFullscreen : () => handleRequestFullscreen(true)}
                className={`p-2 sm:p-2.5 rounded-full transition-all duration-300 hover:scale-110 shrink-0 ${
                  isFullscreen
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                    : isDark
                      ? "bg-slate-800/80 text-slate-300 hover:text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                title={isFullscreen ? t("nav.exitFullscreen", "Keluar dari Layar Penuh") : t("nav.fullscreen", "Mode Layar Penuh (Fullscreen)")}
                aria-label="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </motion.button>

              <LanguageToggle isDarkHeader={isDark} />
              
              
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={handleToggleTheme}
                className={`p-2 sm:p-2.5 rounded-full transition-all duration-300 hover:scale-110 shrink-0 ${
                  isDark
                    ? "bg-slate-800/80 text-yellow-700 dark:text-yellow-400 hover:text-yellow-300 hover:shadow-[0_0_15px_rgba(250,204,21,0.2)]"
                    : "bg-slate-100 text-slate-800 dark:text-slate-200 hover:bg-slate-200"
                }`}
                aria-label="Toggle Theme"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </motion.button>

              
              {/* Dropdown Desktop: Registrasi */}
              <div className="relative group hidden md:block">
                <button
                  type="button"
                  className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 via-cyan-500 to-indigo-600 bg-[length:200%_auto] hover:bg-right text-white text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 relative overflow-hidden border border-emerald-300/40"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative flex items-center gap-1.5">
                    <UserPlus size={15} className="text-amber-300 group-hover:scale-110 transition-transform" />
                    <span>{t("nav.register", "Registrasi")}</span>
                  </span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-300 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                  <div className="p-2 flex flex-col gap-1">
                    <div className="px-2 pt-1 pb-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 mb-1">{t("nav.registerAs", "Registrasi Sebagai:")}</div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleRequestFullscreen();
                        navigate("/register?tab=investor");
                      }}
                      className="w-full text-left px-3 py-2 text-sm font-bold text-slate-900 dark:text-slate-100 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Building2 size={16} /> {t("nav.roleInvestor", "Investor")}
                    </button>
                  </div>
                </div>
              </div>


              <motion.button whileTap={{ scale: 0.95 }}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRequestFullscreen();
                  navigate("/login");
                }}
                className="hidden sm:flex items-center gap-2 px-6 py-2.5 min-h-[44px] rounded-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white text-sm font-bold transition-all duration-300 shadow-[0_4px_15px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative flex items-center gap-2">
                  <Shield className="w-4 h-4 mr-1.5" /> {t("nav.loginAdmin", "Login Admin")}
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </motion.button>

              <motion.button whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => onOpenDiagnostic && onOpenDiagnostic()}
                className={`hidden sm:flex items-center justify-center p-2 w-10 h-10 sm:w-11 sm:h-11 min-h-[40px] sm:min-h-[44px] rounded-full border transition-all duration-300 shadow-sm hover:-translate-y-0.5 relative overflow-hidden group shrink-0
                  ${isDark 
                    ? "border-slate-700 bg-slate-800/80 text-emerald-400 hover:bg-slate-700 hover:text-emerald-300 shadow-black/20" 
                    : "border-slate-200 bg-white text-emerald-600 hover:bg-slate-50 hover:text-emerald-700"}`}
                title="Diagnostik Koneksi Supabase & Solusi"
                aria-label="Diagnostik Koneksi Supabase"
              >
                <ShieldCheck size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </motion.button>

              {/* Mobile Menu Toggle */}
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`md:hidden w-10 h-10 sm:w-11 sm:h-11 shrink-0 flex items-center justify-center p-2 rounded-xl border transition-all ${
                  isDark
                    ? "border-slate-800 bg-slate-900/50 text-slate-300 hover:text-white"
                    : "border-slate-200 bg-white text-slate-800 dark:text-slate-200 hover:bg-slate-100"
                }`}
                aria-label="Toggle Mobile Menu"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className={`md:hidden border-t overflow-hidden ${
                isDark
                  ? "bg-slate-950/95 border-slate-800 text-white"
                  : "bg-white/95 border-slate-200 text-slate-900"
              }`}
            >
              <div className="px-4 pt-2 pb-5 space-y-2">
                {[
                  { name: t("nav.dashboard"), id: "hero-section" },
                  {
                    name: t("nav.gis"),
                    action: (e: any) => {
                      setIsMobileMenuOpen(false);
                      handleGisClick(e, "default");
                    },
                  },
                  { name: t("nav.potensi"), id: "potensi-section" },
                  {
                    name: "MPP",
                    action: (e: any) => {
                      setIsMobileMenuOpen(false);
                      e?.preventDefault?.();
                      if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
                        window.history.scrollRestoration = 'manual';
                      }
                      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                      if (document.documentElement) document.documentElement.scrollTop = 0;
                      if (document.body) document.body.scrollTop = 0;
                      handleRequestFullscreen();
                      navigate("/mpp");
                    },
                  },
                  {
                    name: t("nav.pengaduanMasyarakat"),
                    action: (e: any) => {
                      e?.preventDefault?.();
                      handleRequestFullscreen();
                      navigate("/login?role=masyarakat");
                    }
                  },
                ].map((item) => (
                  <motion.button whileTap={{ scale: 0.95 }}
                    type="button"
                    key={item.name}
                    onClick={(e) => {
                      setIsMobileMenuOpen(false);
                      if (item.action) {
                        item.action(e);
                      } else if (item.id) {
                        scrollToSection(item.id);
                      }
                    }}
                    className={`w-full text-left px-4 py-3 min-h-[44px] rounded-xl text-base font-medium transition-all ${
                      isDark
                        ? "text-white hover:bg-slate-800"
                        : "text-slate-950 font-medium drop-shadow-sm hover:bg-slate-100 hover:text-blue-700"
                    }`}
                  >
                    {item.name}
                  </motion.button>
                ))}
                <div className="pt-3 pb-1 border-t border-slate-500/10 flex flex-col gap-2.5">
                  
                  <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">{t("nav.registerAs", "Registrasi Sebagai:")}</span>
                    <motion.button whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsMobileMenuOpen(false);
                        handleRequestFullscreen();
                        navigate("/register?tab=investor");
                      }}
                      className="w-full flex items-center justify-center gap-2 px-5 py-2.5 min-h-[40px] rounded-lg bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold transition-all border border-emerald-200 dark:border-emerald-500/30"
                    >
                      <Building2 size={16} />
                      <span>{t("nav.roleInvestor", "Investor")}</span>
                    </motion.button>
                  </div>

                  {/* Android / Smartphone Native Fullscreen Toggle */}
                  <motion.button whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsMobileMenuOpen(false);
                      if (isFullscreen) {
                        handleExitFullscreen();
                      } else {
                        handleRequestFullscreen(true);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 min-h-[44px] rounded-xl text-sm font-bold transition-all border ${
                      isFullscreen
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : "bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200/70"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {isFullscreen ? <Minimize2 size={17} className="text-emerald-500" /> : <Maximize2 size={17} className="text-emerald-500" />}
                      <span>{isFullscreen ? t("nav.exitFullscreen", "Keluar dari Layar Penuh") : t("nav.fullscreenApp", "Mode Aplikasi Layar Penuh (Fullscreen)")}</span>
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                      Android
                    </span>
                  </motion.button>

                  <motion.button whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenDiagnostic && onOpenDiagnostic();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 text-sm font-bold transition-all border border-slate-200 dark:border-slate-700"
                  >
                    <ShieldCheck size={16} />
                    <span>{t("nav.diagnostic", "Diagnostik Koneksi & Solusi")}</span>
                  </motion.button>

                  <motion.button whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsMobileMenuOpen(false);
                      handleRequestFullscreen();
                      navigate("/login");
                    }}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 active:scale-98 text-white text-sm font-bold transition-all"
                  >
                    <span className="flex items-center"><Shield className="w-4 h-4 mr-1.5" /> {t("nav.loginAdmin", "Login Admin")}</span>
                    <ChevronRight size={18} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.nav>

      <div className="relative z-10 pt-0">
        {/* 1. HERO SECTION WITH IMMERSIVE BACKGROUND */}
        <div id="hero-section" className={`relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-16 overflow-hidden ${isDark ? "bg-[#0b0f19] text-white" : "bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900"}`}>
          <style>{`
            @keyframes aurora1 {
              0%, 100% { transform: translate(0, 0) scale(1); }
              33% { transform: translate(40px, -30px) scale(1.1); }
              66% { transform: translate(-20px, 20px) scale(0.95); }
            }
            @keyframes aurora2 {
              0%, 100% { transform: translate(0, 0) scale(1); }
              33% { transform: translate(-50px, 20px) scale(1.08); }
              66% { transform: translate(30px, -40px) scale(1.05); }
            }
            @keyframes aurora3 {
              0%, 100% { transform: translate(0, 0) scale(1); }
              50% { transform: translate(20px, 30px) scale(1.12); }
            }
            @keyframes scanline {
              0% { top: -4px; }
              100% { top: calc(100% + 4px); }
            }
            @keyframes floatUp {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-6px); }
            }
          `}</style>
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div style={{ animation: 'aurora1 12s ease-in-out infinite' }}
                 className={`absolute w-[500px] h-[500px] -top-24 -left-24 rounded-full ${isDark ? "bg-emerald-500/15" : "bg-emerald-400/20"} blur-[100px]`} />
            <div style={{ animation: 'aurora2 15s ease-in-out infinite' }}
                 className={`absolute w-[600px] h-[400px] top-12 -right-36 rounded-full ${isDark ? "bg-indigo-500/12" : "bg-blue-400/15"} blur-[100px]`} />
            <div style={{ animation: 'aurora3 18s ease-in-out infinite' }}
                 className={`absolute w-[400px] h-[400px] -bottom-24 left-1/3 rounded-full ${isDark ? "bg-cyan-500/10" : "bg-cyan-400/15"} blur-[100px]`} />
            <div className={`absolute left-0 right-0 h-0.5 ${isDark ? "bg-gradient-to-r from-transparent via-emerald-400/15 to-transparent" : "bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"} pointer-events-none`}
                 style={{ animation: 'scanline 8s linear infinite' }} />
          </div>

          {/* Floating Info Chips */}
          <div className="absolute top-20 lg:top-24 right-6 lg:right-12 z-20 hidden lg:flex flex-col gap-2"
               style={{ animation: 'floatUp 6s ease-in-out infinite' }}>
            {[
              { label: '24/7 AI Spatial Engine', color: 'bg-emerald-500' },
              { label: t('hero.chipOss', 'OSS RBA Terintegrasi'), color: 'bg-indigo-500' },
              { label: t('hero.chipPkkpr', 'PKKPR Real-time Sync'), color: 'bg-amber-500' },
            ].map((chip, i) => (
              <div key={i} className={`flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-xl border backdrop-blur-md text-xs whitespace-nowrap ${isDark ? 'bg-white/5 border-white/10 text-white/90' : 'bg-white/80 border-slate-200 text-slate-800 shadow-sm'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${chip.color} animate-pulse`} />
                {chip.label}
              </div>
            ))}
          </div>

          {/* Immersive background glowing effect */}
          <div className="hero-glow-bg" />
          
          {/* Cyber grid */}
          <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none" />

          {/* Background Image Carousel (Faded) */}
          <motion.div className="absolute inset-0 z-0 transition-all duration-1000" style={{ y: yBg }}>
            {heroImages.map((imgUrl, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? (isDark ? "opacity-35 mix-blend-luminosity" : "opacity-15") : "opacity-0"}`}
                style={{ backgroundImage: `url('${imgUrl}')` }}
              />
            ))}
          </motion.div>
          <div className={`absolute inset-0 z-[1] ${isDark
            ? 'bg-gradient-to-b from-[#0b0f19]/85 via-[#0b0f19]/70 to-[#0b0f19]/95'
            : 'bg-gradient-to-b from-white/90 via-slate-50/80 to-slate-100/95'
          } pointer-events-none`} />

          <div className="container max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 relative z-20">
            <motion.div className="flex flex-col items-center text-center max-w-4xl mx-auto" style={{ y: yText, opacity: opacityText }}>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`inline-flex items-center gap-2 px-5 py-2 min-h-[44px] rounded-full border mb-4 text-xs font-bold tracking-widest uppercase backdrop-blur-xl ${isDark ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "border-emerald-300 bg-white/95 shadow-sm text-emerald-700"}`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                LIVE SPATIAL ENGINE
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                className="text-[2.75rem] sm:text-6xl md:text-7xl font-black tracking-tighter leading-[1.05] text-slate-900 dark:text-white mt-1 mb-6 px-2 w-full max-w-[95%] mx-auto break-words text-center text-balance"
              >
                <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] text-emerald-600 block mb-2 uppercase">
                  {t('hero.heroTitleBrand')}
                </span>
                <span className="transition-all duration-500 ease-in-out block">
                  {t('hero.heroTitleSlogan')}
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300 max-w-[96%] mx-auto mt-4 mb-6 transition-all duration-500 ease-in-out text-balance"
              >
                {t("hero.subtitle")}
              </motion.p>

               {/* HERO CTA BUTTONS */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4 z-20 relative w-full px-4 sm:px-0"
              >
                {/* Primary CTA: GIS Analytics */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                  type="button"
                  id="btn-hero-gis-analytics"
                  onClick={(e) => handleGisClick(e, "default")}
                  className="group relative flex w-full sm:w-auto items-center justify-center gap-3 px-8 py-4 min-h-[52px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(99,102,241,0.6)] transition-all duration-300 border border-emerald-300/40 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out pointer-events-none" />
                  <span className="relative flex items-center gap-2.5">
                    <Globe className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform duration-300" />
                    <span>{t('hero.btnGisAnalytics', 'GIS Analytics')}</span>
                    <span className="hidden sm:inline-block px-2.5 py-0.5 text-[11px] uppercase font-bold tracking-wider bg-white/20 text-emerald-100 rounded-full border border-white/30 ml-1">
                      {t('hero.btnGisAnalyticsBadge', 'Peta Spasial')}
                    </span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </motion.button>

                {/* Secondary CTA: Eksplorasi Potensi */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  type="button"
                  id="btn-hero-eksplorasi-potensi"
                  onClick={() => scrollToSection("potensi-section")}
                  className={`flex w-full sm:w-auto justify-center items-center gap-2 px-7 py-4 min-h-[52px] rounded-2xl font-bold text-base transition-all duration-300 border backdrop-blur-xl ${
                    isDark
                      ? "bg-slate-900/60 border-slate-700/80 text-slate-200 hover:bg-slate-800/80 hover:text-white hover:border-emerald-500/50 shadow-lg"
                      : "bg-white/80 border-slate-200 text-slate-800 dark:text-slate-200 hover:bg-slate-100 hover:text-emerald-700 hover:border-emerald-300 shadow-md"
                  }`}
                >
                  <Building2 className="w-5 h-5 text-emerald-500" />
                  <span>{t('hero.btnExplorePotential', 'Eksplorasi Potensi')}</span>
                </motion.button>
              </motion.div>
            </motion.div>

            {/* Elegant Gradient Divider */}
            <motion.div 
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
              className="w-full max-w-3xl mx-auto my-8 md:my-12 relative flex items-center justify-center"
            >
              <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
              <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent blur-[2px]" />
              <div className={`w-3 h-3 rotate-45 border ${isDark ? 'border-emerald-500/50 bg-[#0b0f19]' : 'border-emerald-400 bg-slate-50'} z-10`} />
            </motion.div>

            {/* Premium Bento Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-8 sm:mt-16 lg:mt-24 max-w-6xl mx-auto px-0 sm:px-4 w-full"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3.5 md:gap-4.5 rounded-2xl sm:rounded-3xl p-1.5 sm:p-4 md:p-5 bg-slate-100/60 sm:bg-slate-100/70 dark:bg-slate-900/40 sm:dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/70 dark:border-slate-800/70 shadow-xs sm:shadow-[0_10px_35px_-10px_rgba(0,0,0,0.06)] sm:dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
                {[
                  {
                    id: 'stat-investment',
                    label: t("stats.totalInvestment"),
                    value: totalInvestmentValue > 0 ? formatRupiah(totalInvestmentValue) : "Data Menyusul",
                    isCurrency: true,
                    icon: TrendingUp,
                    accentTop: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500',
                    borderHover: 'hover:border-emerald-400/80 dark:hover:border-emerald-500/80',
                    glowHover: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
                    iconColor: 'text-emerald-600 dark:text-emerald-400',
                    iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
                    iconBorder: 'border border-emerald-200/80 dark:border-emerald-500/30',
                    sparkId: 'spark-emerald',
                    sparkColor: '#10b981',
                    sparkPoints: '0,22 13,18 26,20 39,12 52,14 65,7 80,4',
                    lastPoint: { x: 80, y: 4 },
                  },
                  {
                    id: 'stat-loi',
                    label: "Investor LOI",
                    value: loiCount || 0,
                    isCurrency: false,
                    icon: Briefcase,
                    accentTop: 'bg-gradient-to-r from-teal-500 via-cyan-400 to-teal-500',
                    borderHover: 'hover:border-teal-400/80 dark:hover:border-teal-500/80',
                    glowHover: 'from-teal-500/10 via-teal-500/5 to-transparent',
                    iconColor: 'text-teal-600 dark:text-teal-400',
                    iconBg: 'bg-teal-50 dark:bg-teal-950/50',
                    iconBorder: 'border border-teal-200/80 dark:border-teal-500/30',
                    sparkId: 'spark-teal',
                    sparkColor: '#14b8a6',
                    sparkPoints: '0,26 15,22 30,24 45,16 60,18 70,10 80,6',
                    lastPoint: { x: 80, y: 6 },
                  },
                  {
                    id: 'stat-opportunities',
                    label: t("stats.activeOpportunities"),
                    value: activeOpportunities || 0,
                    isCurrency: false,
                    icon: Layers,
                    accentTop: 'bg-gradient-to-r from-indigo-500 via-blue-400 to-indigo-500',
                    borderHover: 'hover:border-indigo-400/80 dark:hover:border-indigo-500/80',
                    glowHover: 'from-indigo-500/10 via-indigo-500/5 to-transparent',
                    iconColor: 'text-indigo-600 dark:text-indigo-400',
                    iconBg: 'bg-indigo-50 dark:bg-indigo-950/50',
                    iconBorder: 'border border-indigo-200/80 dark:border-indigo-500/30',
                    sparkId: 'spark-indigo',
                    sparkColor: '#6366f1',
                    sparkPoints: '0,24 13,20 26,22 39,15 52,17 65,10 80,6',
                    lastPoint: { x: 80, y: 6 },
                  },
                  {
                    id: 'stat-pkkpr',
                    label: "PKKPR Terbit",
                    value: pkkprIssuedCount || 0,
                    isCurrency: false,
                    icon: ShieldCheck,
                    accentTop: 'bg-gradient-to-r from-purple-500 via-fuchsia-400 to-purple-500',
                    borderHover: 'hover:border-purple-400/80 dark:hover:border-purple-500/80',
                    glowHover: 'from-purple-500/10 via-purple-500/5 to-transparent',
                    iconColor: 'text-purple-600 dark:text-purple-400',
                    iconBg: 'bg-purple-50 dark:bg-purple-950/50',
                    iconBorder: 'border border-purple-200/80 dark:border-purple-500/30',
                    sparkId: 'spark-purple',
                    sparkColor: '#a855f7',
                    sparkPoints: '0,25 15,21 30,23 45,14 60,16 75,8 80,4',
                    lastPoint: { x: 80, y: 4 },
                  },
                  {
                    id: 'stat-districts',
                    label: t("stats.subDistricts"),
                    value: districts?.length || 0,
                    isCurrency: false,
                    icon: MapPin,
                    accentTop: 'bg-gradient-to-r from-cyan-500 via-sky-400 to-cyan-500',
                    borderHover: 'hover:border-cyan-400/80 dark:hover:border-cyan-500/80',
                    glowHover: 'from-cyan-500/10 via-cyan-500/5 to-transparent',
                    iconColor: 'text-cyan-600 dark:text-cyan-400',
                    iconBg: 'bg-cyan-50 dark:bg-cyan-950/50',
                    iconBorder: 'border border-cyan-200/80 dark:border-cyan-500/30',
                    sparkId: 'spark-cyan',
                    sparkColor: '#06b6d4',
                    sparkPoints: '0,26 20,26 40,20 60,16 80,10',
                    lastPoint: { x: 80, y: 10 },
                  },
                  {
                    id: 'stat-villages',
                    label: t("stats.villages"),
                    value: villages?.length || 0,
                    isCurrency: false,
                    icon: Globe,
                    accentTop: 'bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500',
                    borderHover: 'hover:border-amber-400/80 dark:hover:border-amber-500/80',
                    glowHover: 'from-amber-500/10 via-amber-500/5 to-transparent',
                    iconColor: 'text-amber-600 dark:text-amber-400',
                    iconBg: 'bg-amber-50 dark:bg-amber-950/50',
                    iconBorder: 'border border-amber-200/80 dark:border-amber-500/30',
                    sparkId: 'spark-amber',
                    sparkColor: '#f59e0b',
                    sparkPoints: '0,28 16,24 32,22 48,18 64,12 80,8',
                    lastPoint: { x: 80, y: 8 },
                  },
                ].map((stat) => (
                  <div
                    key={stat.id}
                    id={stat.id}
                    className={`relative flex flex-col items-center justify-between p-2.5 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border transition-all duration-300 group overflow-hidden ${stat.borderHover} ${
                      isDark
                        ? 'bg-slate-900/90 hover:bg-slate-850 border-slate-800/90 shadow-[0_4px_16px_rgba(0,0,0,0.35)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
                        : 'bg-white/95 hover:bg-white border-slate-200/90 shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:shadow-[0_10px_25px_rgba(15,23,42,0.08)]'
                    } hover:-translate-y-1 active:scale-[0.98] w-full min-h-[172px] sm:min-h-[192px] md:min-h-[208px]`}
                  >
                    {/* Top Edge Glowing Line */}
                    <div className={`absolute top-0 left-0 right-0 h-[3px] ${stat.accentTop}`} />

                    {/* Ambient Glow Aura on Card Hover */}
                    <div className={`absolute inset-0 bg-gradient-to-b ${stat.glowHover} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

                    {/* Elevated Icon Capsule with Live Indicator */}
                    <div className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl ${stat.iconBg} ${stat.iconBorder} flex items-center justify-center mb-1.5 sm:mb-2 shadow-xs group-hover:scale-105 transition-transform duration-300`}>
                      <stat.icon size={18} className={`${stat.iconColor} sm:w-5 sm:h-5`} />
                      <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 bg-current" style={{ color: stat.sparkColor }} />
                        <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: stat.sparkColor }} />
                      </span>
                    </div>

                    {/* Prominent Value Typography (Harmonious Height & Optical Centering) */}
                    <div className="h-9 sm:h-11 flex items-center justify-center w-full px-0.5 mb-0.5">
                      {stat.isCurrency && typeof stat.value === 'string' && stat.value.startsWith('Rp ') ? (
                        (() => {
                          const parts = stat.value.split(' ');
                          const prefix = parts[0] || 'Rp';
                          const num = parts[1] || '0';
                          const unit = parts.slice(2).join(' ') || '';
                          return (
                            <div className="flex items-baseline justify-center gap-1 w-full truncate font-['Plus_Jakarta_Sans',sans-serif]">
                              <span className="text-[11px] sm:text-xs font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                                {prefix}
                              </span>
                              <span className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                                {num}
                              </span>
                              {unit && (
                                <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 tracking-normal">
                                  {unit}
                                </span>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <span
                          className="font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-2xl sm:text-3xl md:text-4xl tracking-tight text-slate-900 dark:text-white tabular-nums text-center truncate max-w-full"
                          title={String(stat.value)}
                        >
                          {stat.value}
                        </span>
                      )}
                    </div>

                    {/* Crisp Sub-Label (Strictly Fixed Height for Symmetry) */}
                    <div className="h-7 sm:h-8 flex items-center justify-center text-center w-full px-0.5 mb-1 sm:mb-1.5">
                      <span
                        className={`font-['Plus_Jakarta_Sans',sans-serif] text-[10px] sm:text-[11px] md:text-xs uppercase tracking-wider font-bold leading-tight line-clamp-2 ${
                          isDark ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-500 group-hover:text-slate-800'
                        } transition-colors`}
                      >
                        {stat.label}
                      </span>
                    </div>

                    {/* Refined Sparkline Visualizer with Gradient & Live Dot */}
                    <div className="w-full relative mt-auto pt-1 h-6 sm:h-7 flex items-end">
                      <svg viewBox="0 0 80 28" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id={stat.sparkId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={stat.sparkColor} stopOpacity={isDark ? "0.4" : "0.22"} />
                            <stop offset="100%" stopColor={stat.sparkColor} stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Area Gradient Fill */}
                        <polygon points={`${stat.sparkPoints} 80,28 0,28`} fill={`url(#${stat.sparkId})`} stroke="none" />
                        {/* Crisp Line */}
                        <polyline points={stat.sparkPoints} fill="none" stroke={stat.sparkColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Live Pulsing Dot */}
                        <circle cx={stat.lastPoint.x} cy={stat.lastPoint.y} r="2.5" fill={stat.sparkColor} className="animate-pulse" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Wave divider — transisi hero ke konten */}
        <div className={`relative z-10 -mt-1 ${isDark ? 'text-[#0B0F19]' : 'text-slate-50'}`}>
          <svg viewBox="0 0 1440 48" className="w-full block" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M0,48 C240,0 480,32 720,16 C960,0 1200,32 1440,48 L1440,48 L0,48 Z"
              fill="currentColor"
            />
          </svg>
        </div>
        
        {/* EXECUTIVE LIVE DATA COUNTER PANEL */}
        <section
          className={`pt-16 pb-12 sm:pt-20 sm:pb-14 border-b relative z-20 ${isDark ? "bg-slate-950/40 border-slate-800/80" : "bg-slate-50/60 border-slate-200/80"}`}
        >
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-14 sm:gap-y-14 sm:gap-x-6 lg:gap-6">
              {/* Card 1: Infrastruktur Pendukung Terpetakan */}
              <div
                className="group relative pt-13 sm:pt-15 pb-5 px-4 sm:px-5 rounded-[28px] flex flex-col items-center text-center justify-between transition-all duration-300 ease-out hover:-translate-y-2 bg-white dark:bg-slate-900/95 shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/40 dark:hover:border-blue-500/40 hover:shadow-[0_20px_40px_rgba(59,130,246,0.14)]"
              >
                {/* Top Subtle Accent Rail */}
                <div className="absolute top-0 inset-x-8 h-[3px] bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full" />

                {/* Overlapping Circular Medallion (Enlarged MPP Badung Aesthetic) */}
                <div className="absolute -top-10 sm:-top-11 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                  <div className="relative">
                    {/* Ambient Glow */}
                    <div className="absolute inset-0 rounded-full bg-blue-500/30 blur-md transform group-hover:scale-115 transition-transform duration-300" />
                    
                    {/* Outer Elevated Podium Ring */}
                    <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-full ring-4 sm:ring-[6px] ring-white dark:ring-slate-900 shadow-xl shadow-blue-500/15 dark:shadow-black/70 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-105">
                      {/* Inner Delicate Ring Accent */}
                      <div className="absolute inset-1.5 rounded-full border border-white/30 pointer-events-none" />
                      <Building size={34} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" strokeWidth={2.2} />
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="w-full flex flex-col items-center mt-1">
                  <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 min-h-[32px] flex items-center justify-center leading-snug px-1 text-balance">
                    {t("stats.mappedInfra")}
                  </div>
                  <div className="text-3xl sm:text-4xl font-black tracking-tight my-2 font-mono flex items-baseline justify-center gap-1.5 text-blue-600 dark:text-blue-400">
                    <CountUp end={infrastructure?.length || 0} suffix="" />
                    <span className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-400 font-sans">{t("stats.points")}</span>
                  </div>
                </div>

                {/* Micro Status Chip */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 w-full flex justify-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    GIS Terpetakan
                  </span>
                </div>
              </div>

              {/* Card 2: Lahan Potensial & Komoditas Strategis */}
              <div
                className="group relative pt-13 sm:pt-15 pb-5 px-4 sm:px-5 rounded-[28px] flex flex-col items-center text-center justify-between transition-all duration-300 ease-out hover:-translate-y-2 bg-white dark:bg-slate-900/95 shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 hover:shadow-[0_20px_40px_rgba(16,185,129,0.14)]"
              >
                {/* Top Subtle Accent Rail */}
                <div className="absolute top-0 inset-x-8 h-[3px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent rounded-full" />

                {/* Overlapping Circular Medallion */}
                <div className="absolute -top-10 sm:-top-11 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                  <div className="relative">
                    {/* Ambient Glow */}
                    <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-md transform group-hover:scale-115 transition-transform duration-300" />
                    
                    {/* Outer Elevated Podium Ring */}
                    <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-full ring-4 sm:ring-[6px] ring-white dark:ring-slate-900 shadow-xl shadow-emerald-500/15 dark:shadow-black/70 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-105">
                      <div className="absolute inset-1.5 rounded-full border border-white/30 pointer-events-none" />
                      <MapPin size={34} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" strokeWidth={2.2} />
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="w-full flex flex-col items-center mt-1">
                  <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 min-h-[32px] flex items-center justify-center leading-snug px-1 text-balance">
                    {t("stats.strategicLands")}
                  </div>
                  <div className="text-3xl sm:text-4xl font-black tracking-tight my-2 font-mono flex items-baseline justify-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CountUp end={investments?.length || 0} suffix="" />
                    <span className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-400 font-sans">{t("stats.locations")}</span>
                  </div>
                </div>

                {/* Micro Status Chip */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 w-full flex justify-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Siap Ditawarkan
                  </span>
                </div>
              </div>

              {/* Card 3: Serapan Tenaga Kerja */}
              <div
                className="group relative pt-13 sm:pt-15 pb-5 px-4 sm:px-5 rounded-[28px] flex flex-col items-center text-center justify-between transition-all duration-300 ease-out hover:-translate-y-2 bg-white dark:bg-slate-900/95 shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-slate-200/90 dark:border-slate-800 hover:border-amber-500/40 dark:hover:border-amber-500/40 hover:shadow-[0_20px_40px_rgba(245,158,11,0.14)]"
              >
                {/* Top Subtle Accent Rail */}
                <div className="absolute top-0 inset-x-8 h-[3px] bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full" />

                {/* Overlapping Circular Medallion */}
                <div className="absolute -top-10 sm:-top-11 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                  <div className="relative">
                    {/* Ambient Glow */}
                    <div className="absolute inset-0 rounded-full bg-amber-500/30 blur-md transform group-hover:scale-115 transition-transform duration-300" />
                    
                    {/* Outer Elevated Podium Ring */}
                    <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-full ring-4 sm:ring-[6px] ring-white dark:ring-slate-900 shadow-xl shadow-amber-500/15 dark:shadow-black/70 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-105">
                      <div className="absolute inset-1.5 rounded-full border border-white/30 pointer-events-none" />
                      <Users size={34} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" strokeWidth={2.2} />
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="w-full flex flex-col items-center mt-1">
                  <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 min-h-[32px] flex items-center justify-center leading-snug px-1 text-balance">
                    {t("stats.workforceAbsorption", "Serapan Tenaga Kerja")}
                  </div>
                  <div className="text-3xl sm:text-4xl font-black tracking-tight my-2 font-mono flex items-baseline justify-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <CountUp end={totalLabor} suffix="" />
                    <span className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-400 font-sans">{t("stats.workers", "Jiwa")}</span>
                  </div>
                </div>

                {/* Micro Status Chip */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 w-full flex justify-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    TKL & TKA Terdata
                  </span>
                </div>
              </div>

              {/* Card 4: Asisten AI DPMPTSP */}
              <div
                className="group relative pt-13 sm:pt-15 pb-5 px-4 sm:px-5 rounded-[28px] flex flex-col items-center text-center justify-between transition-all duration-300 ease-out hover:-translate-y-2 bg-white dark:bg-slate-900/95 shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-slate-200/90 dark:border-slate-800 hover:border-purple-500/40 dark:hover:border-purple-500/40 hover:shadow-[0_20px_40px_rgba(168,85,247,0.14)]"
              >
                {/* Top Subtle Accent Rail */}
                <div className="absolute top-0 inset-x-8 h-[3px] bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full" />

                {/* Overlapping Circular Medallion */}
                <div className="absolute -top-10 sm:-top-11 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                  <div className="relative">
                    {/* Ambient Glow */}
                    <div className="absolute inset-0 rounded-full bg-purple-500/30 blur-md transform group-hover:scale-115 transition-transform duration-300" />
                    
                    {/* Outer Elevated Podium Ring */}
                    <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-full ring-4 sm:ring-[6px] ring-white dark:ring-slate-900 shadow-xl shadow-purple-500/15 dark:shadow-black/70 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-105">
                      <div className="absolute inset-1.5 rounded-full border border-white/30 pointer-events-none" />
                      <Bot size={34} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" strokeWidth={2.2} />
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="w-full flex flex-col items-center mt-1">
                  <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 min-h-[32px] flex items-center justify-center leading-snug px-1 text-balance">
                    {t("stats.aiAssistant")}
                  </div>
                  <div className="text-3xl sm:text-4xl font-black tracking-tight my-2 font-mono flex items-baseline justify-center gap-1.5 text-purple-600 dark:text-purple-400">
                    <span>{t("stats.twentyFourSevenActive", "24/7")}</span>
                    <span className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-400 font-sans">{t("stats.active", "Aktif")}</span>
                  </div>
                </div>

                {/* Micro Status Chip */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 w-full flex justify-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                    Konsultasi Cerdas
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. DAFTAR POTENSI INVESTASI - BENTO GRID */}
        <div
          id="potensi-section"
          className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16 min-h-[44px]"
        >
          <div className="flex flex-col md:flex-row items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 text-balance break-words animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                {t("sections.potensi.title")}
              </h2>
              <div className="h-1 w-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mb-4 ml-0 animate-fade-in-up" style={{ animationDelay: '200ms' }}></div>
              <p className={`text-sm sm:text-base ${textMuted} animate-fade-in-up`} style={{ animationDelay: '300ms' }}>
                {t("sections.potensi.subtitle")}
              </p>
            </div>
            <motion.button whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.04 }}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate("/peta-spasial");
              }}
              className={`shrink-0 px-6 py-3 min-h-[44px] rounded-full font-bold text-xs sm:text-sm tracking-wider uppercase border flex items-center gap-2 transition-all duration-300 backdrop-blur-xl ${
                isDark
                  ? "bg-gradient-to-r from-emerald-900/40 via-slate-800/80 to-blue-900/40 border-emerald-500/40 text-emerald-300 hover:border-emerald-400 shadow-[0_4px_20px_rgba(16,185,129,0.2)]"
                  : "bg-gradient-to-r from-emerald-50 via-white to-blue-50 border-emerald-300 text-emerald-700 hover:border-emerald-500 shadow-md shadow-emerald-500/10"
              }`}
            >
              {t("ui.viewInteractiveMap")} <ChevronRight size={16} />
            </motion.button>
          </div>

          {/* SMART MATRIX FILTER PANEL */}
          <div className="mb-6">
            <SmartMatrixFilterPanel
              filters={smartFilterState}
              onChangeFilters={setSmartFilterState}
              districtsList={uniqueDistrictsList}
              totalResults={filteredInvestmentsList.length}
              isDark={isDark}
            />
          </div>

          {/* SMART FISCAL & INCENTIVE ESTIMATOR (Inovasi Khusus Investor) */}
          <div className={`p-4 sm:p-5 rounded-2xl border mb-8 backdrop-blur-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all ${
            isDark 
              ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900/70 to-amber-950/30 border-emerald-500/30 shadow-lg shadow-emerald-950/20' 
              : 'bg-gradient-to-r from-emerald-50/90 via-white to-amber-50/80 border-emerald-200 shadow-md shadow-emerald-500/5'
          }`}>
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 shrink-0">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold font-sans text-slate-900 dark:text-white">
                    Smart Fiscal Estimator: Kalkulator Insentif Daerah & ROI
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                    Perda Luwu & PP 24/2019
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 max-w-2xl">
                  Simulasikan pembebasan retribusi PBG, pengurangan PBB-P2 konstruksi, fasilitasi penyediaan lahan, serta percepatan perizinan OSS-RBA.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsIncentiveModalOpen(true);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 transition-all cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Buka Kalkulator Insentif</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3].map((num) => (
                <div
                  key={num}
                  className={`rounded-3xl border overflow-hidden flex flex-col h-[400px] animate-pulse bg-slate-200 dark:bg-slate-700 border-transparent`}
                >
                  <div className="h-48 bg-slate-300 dark:bg-slate-600" />
                  <div className="p-6 flex flex-col flex-grow gap-4">
                    <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded w-3/4" />
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-1/2" />
                      <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-2/3" />
                    </div>
                    <div className="h-10 bg-slate-300 dark:bg-slate-600 rounded-xl mt-auto w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredInvestmentsList.length > 0 ? (
            <div className={`w-full grid gap-6 sm:gap-8 ${filteredInvestmentsList.length === 1 ? 'grid-cols-1 max-w-xl sm:max-w-2xl lg:max-w-3xl mx-auto' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
              {[...filteredInvestmentsList]
                .sort((a, b) => {
                  const aAI = Number(
                    a.smartData?.aiScore || a.smartData?.ai_score || 0,
                  );
                  const bAI = Number(
                    b.smartData?.aiScore || b.smartData?.ai_score || 0,
                  );
                  if (bAI !== aAI) return bAI - aAI;
                  return (b.investmentValue || 0) - (a.investmentValue || 0);
                })
                .slice(0, 6)
                .map((inv, idx) => (
                  <div
                    key={inv.id}
                    style={{ animationDelay: `${idx * 150}ms` }}
                    className={`w-full rounded-[26px] sm:rounded-[28px] border overflow-hidden flex flex-col group
                                opacity-0 animate-fade-in-up
                                transition-all duration-300 ease-out hover:-translate-y-2
                                hover:shadow-2xl ${getSectorColor(inv.sector).glow}
                                hover:border-emerald-500/50
                                ${isDark ? 'bg-slate-900/95 border-slate-800 shadow-[0_12px_36px_rgba(0,0,0,0.35)]' : 'bg-white border-slate-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.06)]'}`}
                  >
                    {/* Header Image Section */}
                    <div className="h-60 sm:h-64 overflow-hidden relative w-full">
                      <LazyImage
                        src={
                          inv.photoUrl ||
                          "https://images.unsplash.com/photo-1590496794008-383c8070b257"
                        }
                        alt={inv.name}
                        isDark={isDark}
                        imgClassName="w-full h-full object-cover transform group-hover:scale-108 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent pointer-events-none" />

                      {/* Top Badges */}
                      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-start justify-between gap-2 z-10">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-md ${getSectorColor(inv.sector).badgeBg}`}
                          >
                            {t(getSectorI18nKey(inv.sector))}
                          </div>

                          {/* BADGE PROJECT READINESS TIER (BKPM RI Standard) */}
                          {(() => {
                            const isTier1 = (inv as any).readinessTier === 'Tier 1' || 
                                            (inv as any).readiness_tier === 'Tier 1' || 
                                            (inv as any).status_kesiapan?.toLowerCase().includes('ready') ||
                                            Boolean(inv.investmentValue && inv.investmentValue > 0 && inv.areaHa && inv.areaHa > 0 && inv.landStatus);

                            return isTier1 ? (
                              <div 
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/85 text-emerald-300 border border-emerald-400/50 backdrop-blur-md shadow-md"
                                title="Ready to Offer (Tier 1): Full FS Siap, Lahan Clean & Clear, Kesesuaian RTRW Terkonfirmasi (Standar BKPM RI)"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span>Tier 1: Ready to Offer</span>
                              </div>
                            ) : (
                              <div 
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950/85 text-amber-300 border border-amber-400/50 backdrop-blur-md shadow-md"
                                title="Under Development (Tier 2): Pre-FS Tersedia, Kajian Tata Ruang Sedang Difinalisasi (Standar BKPM RI)"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                <span>Tier 2: Under Development</span>
                              </div>
                            );
                          })()}
                        </div>

                        {(inv.smartData?.aiScore || inv.smartData?.ai_score) && (
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/75 backdrop-blur-md border border-white/20 text-white shadow-md shrink-0">
                            <span className="text-amber-400 text-xs">★</span>
                            <span className="text-[11px] font-bold tracking-tight">
                              {inv.smartData?.aiScore || inv.smartData?.ai_score} <span className="text-white/60 font-normal">AI Score</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Photo Geotag Info */}
                      <div className="absolute bottom-3 inset-x-3.5 flex items-center justify-between text-xs text-white/95 z-10 pointer-events-none">
                        <div className="flex items-center gap-1.5 font-medium bg-slate-950/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                          <MapPin size={12} className="text-emerald-400 shrink-0" />
                          <span className="truncate max-w-[180px] sm:max-w-[220px]">
                            {districts.find((d) => d.id === inv.districtId)?.name || (inv as any).districtName || (inv as any).lokasi || inv.districtId || "Kabupaten Luwu"}
                          </span>
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 backdrop-blur-md px-2 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1">
                          <ShieldCheck size={12} className="text-emerald-400" />
                          <span>GIS Clean & Clear</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div className="p-5 sm:p-6 flex flex-col flex-grow">
                      <div className="mb-4">
                        <h3 className="text-lg sm:text-xl font-bold font-sans line-clamp-2 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors tracking-tight text-slate-900 dark:text-white">
                          {inv.name}
                        </h3>
                      </div>

                      {/* Symmetrical 3-Column Bento Metric Matrix */}
                      {(() => {
                        const rawLabor = inv.komitmenTenagaLokal ?? inv.komitmen_tenaga_lokal ?? inv.tenagaKerja ?? inv.tenaga_kerja ?? inv.tenagaLokal ?? inv.tenaga_lokal ?? inv.tkl ?? 0;
                        const laborVal = typeof rawLabor === 'number' ? rawLabor : parseFloat(String(rawLabor).replace(/[^0-9.]/g, '')) || 0;

                        return (
                          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
                            {/* Spec 1: Luas Lahan */}
                            <div className={`p-2.5 rounded-2xl border text-center flex flex-col items-center justify-center transition-colors ${
                              isDark ? 'bg-slate-800/60 border-slate-700/60 group-hover:border-slate-700' : 'bg-slate-50 border-slate-200/80 group-hover:border-slate-300'
                            }`}>
                              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Luas Lahan
                              </span>
                              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center justify-center gap-1">
                                <MapPin size={12} className="text-blue-500 shrink-0" />
                                <span>{formatAreaHa(inv.areaHa)} Ha</span>
                              </span>
                            </div>

                            {/* Spec 2: Estimasi Investasi */}
                            <div className={`p-2.5 rounded-2xl border text-center flex flex-col items-center justify-center transition-colors ${
                              isDark ? 'bg-slate-800/60 border-slate-700/60 group-hover:border-slate-700' : 'bg-slate-50 border-slate-200/80 group-hover:border-slate-300'
                            }`}>
                              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Est. Investasi
                              </span>
                              <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                                <Building size={12} className="shrink-0" />
                                <span>{formatRupiah(inv.investmentValue)}</span>
                              </span>
                            </div>

                            {/* Spec 3: Tenaga Kerja */}
                            <div className={`p-2.5 rounded-2xl border text-center flex flex-col items-center justify-center transition-colors ${
                              isDark ? 'bg-slate-800/60 border-slate-700/60 group-hover:border-slate-700' : 'bg-slate-50 border-slate-200/80 group-hover:border-slate-300'
                            }`}>
                              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Tenaga Kerja
                              </span>
                              <span className="text-xs sm:text-sm font-black text-teal-600 dark:text-teal-400 flex items-center justify-center gap-1">
                                <Users size={12} className="shrink-0" />
                                <span>{laborVal > 0 ? `${laborVal} Jiwa` : '-'}</span>
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Realization Progress Bar */}
                      {(() => {
                        const rawPct = Math.min(100, Math.round(((inv.investmentValue || 0) / 2500000000000) * 100 * Math.max(investments.length, 1)));
                        const pct = typeof rawPct === 'number' && !isNaN(rawPct) ? rawPct : 0;
                        const { progress } = getSectorColor(inv.sector);
                        return (
                          <div className="mb-5">
                            <div className="flex justify-between items-center mb-1.5">
                              <span className={`text-[10px] uppercase tracking-widest font-bold ${textMuted}`}>
                                {t("investmentProfile.targetRealisasi", "Target Realisasi")}
                              </span>
                              <span className="text-xs font-black text-slate-800 dark:text-slate-200">{pct}%</span>
                            </div>
                            <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                              <div
                                className={`h-full rounded-full ${progress} transition-all duration-700`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Action Buttons Section */}
                      <div className={`mt-auto pt-4 flex flex-col gap-2.5 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
                        {/* Row 1: Primary Actions */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <motion.button
                            whileTap={{ scale: 0.96 }}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (onSelectInvestment) {
                                onSelectInvestment(inv.id);
                              } else {
                                window.history.pushState({}, "", `/peta-spasial?id=${inv.id}`);
                                if (onEnter) {
                                  onEnter(Role.INVESTOR);
                                } else {
                                  navigate(`/peta-spasial?id=${inv.id}`);
                                }
                              }
                            }}
                            className={`min-h-[44px] py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.97]
                                        ${isDark
                                          ? 'border-slate-700/80 bg-slate-800/80 text-slate-200 hover:border-emerald-500/50 hover:bg-slate-800 hover:text-emerald-400 shadow-sm'
                                          : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-emerald-300 hover:bg-white hover:text-emerald-700 shadow-sm'}`}
                          >
                            <Search size={14} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                            <span>{t("common.detail", "Detail")}</span>
                          </motion.button>

                          <motion.button
                            whileTap={{ scale: 0.96 }}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              navigate("/login?role=investor");
                            }}
                            className="min-h-[44px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.97] bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5"
                          >
                            <span>{t("landing.ajukanMinat", "Ajukan Minat")}</span>
                            <ChevronRight size={15} />
                          </motion.button>
                        </div>

                        {/* Row 2: Inovasi Khusus Investor (IPRO PDF & Konsultasi VIP) */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedIproForModal(inv);
                              setIsIproPitchModalOpen(true);
                            }}
                            className="min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs group/btn"
                            title="Unduh Executive Summary Resmi IPRO (PDF Standar BKPM RI)"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover/btn:scale-110 transition-transform shrink-0" />
                            <span className="truncate">Teaser IPRO (PDF)</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedInvestmentForConsultation(inv);
                              setIsFastTrackConsultationOpen(true);
                            }}
                            className="min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300/80 dark:border-amber-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs group/btn"
                            title="Jadwalkan Konsultasi VIP DPMPTSP Kabupaten Luwu (Online/Offline)"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 group-hover/btn:scale-110 transition-transform shrink-0" />
                            <span className="truncate">Konsultasi VIP</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div
              className={`p-12 rounded-3xl border text-center ${cardBg} ${textMuted}`}
            >
              <div className="inline-flex p-4 rounded-full bg-slate-800/50 mb-4">
                <MapPin size={32} className="font-medium text-slate-700 dark:text-slate-300" />
              </div>
              <p className="text-lg font-medium">
                {t("sections.potensi.emptyState", "Data potensi belum tersedia. Gunakan Dashboard Operator untuk menambah data spasial.")}
              </p>
            </div>
          )}

          {/* CTA PELAJARI POTENSI */}
          <div className="mt-12 flex justify-center w-full">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                document.getElementById("analytics-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`px-8 py-4 min-h-[44px] rounded-2xl font-bold uppercase tracking-wider border backdrop-blur-md transition-all duration-500 ease-out flex items-center justify-center gap-2.5 group bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] hover:-translate-y-0.5 border-emerald-400/40`}
            >
              <Activity size={19} className={`transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12 ${isDark ? "text-emerald-100" : "text-emerald-100"}`} />
              PELAJARI POTENSI
            </motion.button>
          </div>
        </div>

        {/* PERTUMBUHAN & KOMPOSISI INVESTASI (ANALYTICS CHART) - MOVED UP FOR STRATEGIC HOOK */}
        <div id="analytics-section" className="mt-4 sm:mt-8 min-h-0 h-auto">
          <GisErrorBoundary componentName="Analisis Komposisi Spasial">
            <AnalitikSpasialSection
              isDark={isDark}
              totalInvestmentValue={totalInvestmentValue}
              sectorData={sectorData}
              COLORS={COLORS}
              districtData={districtData}
              commodityByDistrictData={commodityByDistrictData}
              spatialDistributionText={spatialDistributionText}
              formatRupiah={formatRupiah}
              cardBg={cardBg}
              textMuted={textMuted}
              investments={investments}
            />
          </GisErrorBoundary>
        </div>

        {/* 3. LITERASI & KEUNTUNGAN LUTIM */}
        <div
          id="keuntungan-section"
          className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20"
        >
          <div className="text-center mb-14 sm:mb-20">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 text-balance break-words">
              {t("sections.keuntungan.title")}
            </h2>
            <div className="h-1 w-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mb-4 mx-auto"></div>
            <p className={`text-sm sm:text-base max-w-2xl mx-auto ${textMuted}`}>
              {t("sections.keuntungan.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-14 md:gap-y-8 md:gap-x-6 lg:gap-x-8">
            {[
              {
                icon: MapPin,
                title: t("features.logisticsTitle"),
                desc: t("features.logisticsDesc"),
                rail: "via-emerald-500",
                ambientGlow: "bg-emerald-500/30",
                gradient: "from-emerald-500 via-emerald-600 to-teal-700",
                shadow: "shadow-emerald-500/15 dark:shadow-black/70",
                cardHover: "hover:border-emerald-500/40 hover:shadow-[0_20px_40px_rgba(16,185,129,0.14)]",
                tag: "Konektivitas Multimoda",
                badgeBg: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-500/20",
                dotColor: "bg-emerald-500",
              },
              {
                icon: Leaf,
                title: t("features.commodityTitle"),
                desc: t("features.commodityDesc"),
                rail: "via-amber-500",
                ambientGlow: "bg-amber-500/30",
                gradient: "from-amber-500 via-amber-600 to-orange-600",
                shadow: "shadow-amber-500/15 dark:shadow-black/70",
                cardHover: "hover:border-amber-500/40 hover:shadow-[0_20px_40px_rgba(245,158,11,0.14)]",
                tag: "Hilirisasi Komoditas",
                badgeBg: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-500/20",
                dotColor: "bg-amber-500",
              },
              {
                icon: ShieldCheck,
                title: t("features.bureaucracyTitle"),
                desc: t("features.bureaucracyDesc"),
                rail: "via-blue-500",
                ambientGlow: "bg-blue-500/30",
                gradient: "from-blue-500 via-indigo-600 to-violet-700",
                shadow: "shadow-blue-500/15 dark:shadow-black/70",
                cardHover: "hover:border-blue-500/40 hover:shadow-[0_20px_40px_rgba(59,130,246,0.14)]",
                tag: "Kemudahan & Kepastian Hukum",
                badgeBg: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-500/20",
                dotColor: "bg-blue-500",
              },
            ].map((item, idx) => (
              <motion.div
                initial={isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                style={{ willChange: "transform, opacity" }}
                whileInView={isMobile ? undefined : { opacity: 1, y: 0 }}
                viewport={isMobile ? undefined : { once: true, amount: 0.05 }}
                transition={{ delay: idx * 0.15 }}
                key={idx}
                className={`group relative pt-14 sm:pt-16 pb-6 px-6 sm:px-7 rounded-[28px] flex flex-col items-center text-center justify-between transition-all duration-300 ease-out hover:-translate-y-2 bg-white dark:bg-slate-900/95 shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-slate-200/90 dark:border-slate-800 ${item.cardHover}`}
              >
                {/* Top Subtle Accent Rail */}
                <div className={`absolute top-0 inset-x-8 h-[3px] bg-gradient-to-r from-transparent ${item.rail} to-transparent rounded-full`} />

                {/* Overlapping Circular Medallion (MPP Badung Aesthetic) */}
                <div className="absolute -top-10 sm:-top-11 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                  <div className="relative">
                    {/* Ambient Glow */}
                    <div className={`absolute inset-0 rounded-full ${item.ambientGlow} blur-md transform group-hover:scale-115 transition-transform duration-300`} />
                    
                    {/* Outer Elevated Podium Ring */}
                    <div className={`relative w-20 h-20 sm:w-22 sm:h-22 rounded-full ring-4 sm:ring-[6px] ring-white dark:ring-slate-900 ${item.shadow} bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-105`}>
                      {/* Inner Delicate Ring Accent */}
                      <div className="absolute inset-1.5 rounded-full border border-white/30 pointer-events-none" />
                      <item.icon size={34} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" strokeWidth={2.2} />
                    </div>
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="w-full flex flex-col items-center flex-grow mt-1">
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-3 text-center group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className={`text-sm sm:text-base leading-relaxed ${textMuted} text-center mb-5 flex-grow`}>
                    {item.desc}
                  </p>
                </div>

                {/* Micro Status Chip */}
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/80 w-full flex justify-center">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border shadow-xs ${item.badgeBg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${item.dotColor} animate-pulse`} />
                    {item.tag}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 4.5 FASILITAS PENUNJANG INFRASTRUKTUR */}
        <div
          id="infrastruktur-section"
          className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20 relative min-h-[44px]"
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[20%] right-[10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/5 blur-[120px] mix-blend-screen" />
          </div>
          <div className="text-center mb-14 sm:mb-20 relative z-10">
            <span
              className={`inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-full text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-xl border animate-fade-in-up ${isDark ? "bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-200 border-orange-400/30 shadow-sm" : "bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-orange-700 border-orange-300 shadow-sm shadow-orange-500/10"}`}
              style={{ animationDelay: '50ms' }}
            >
              <Building size={14} /> Infrastruktur & Ekosistem
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              {t("sections.infrastruktur.title")}
            </h2>
            <div className="h-1 w-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mb-4 mx-auto animate-fade-in-up" style={{ animationDelay: '250ms' }}></div>
            <p className={`text-sm sm:text-base max-w-2xl mx-auto ${textMuted} animate-fade-in-up`} style={{ animationDelay: '350ms' }}>
              {t("sections.infrastruktur.subtitle")}
            </p>
          </div>

          {(() => {
            const baseFacilities = [
              {
                name: t("infrastructure.buaAirportTitle"),
                desc: t("infrastructure.buaAirportDesc"),
                type: "airport",
                icon: Plane,
                rail: "via-sky-500",
                ambientGlow: "bg-sky-500/30",
                gradient: "from-sky-500 via-blue-600 to-indigo-700",
                shadow: "shadow-sky-500/15 dark:shadow-black/70",
                cardHover: "hover:border-sky-500/40 hover:shadow-[0_20px_40px_rgba(56,189,248,0.14)]",
                tag: "Gerbang Udara & Kargo",
                badgeBg: "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-500/20",
                dotColor: "bg-sky-500",
                longitude: facilityCoords.airport ? facilityCoords.airport[0] : 120.24132322502385,
                latitude: facilityCoords.airport ? facilityCoords.airport[1] : -3.086338491260946,
              },
              {
                name: t("infrastructure.uloPortTitle"),
                desc: t("infrastructure.uloPortDesc"),
                type: "port",
                icon: Anchor,
                rail: "via-teal-500",
                ambientGlow: "bg-teal-500/30",
                gradient: "from-teal-500 via-teal-600 to-emerald-700",
                shadow: "shadow-teal-500/15 dark:shadow-black/70",
                cardHover: "hover:border-teal-500/40 hover:shadow-[0_20px_40px_rgba(45,212,191,0.14)]",
                tag: "Dermaga Logistik Laut",
                badgeBg: "bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-200/80 dark:border-teal-500/20",
                dotColor: "bg-teal-500",
                longitude: facilityCoords.port ? facilityCoords.port[0] : 120.39793462368112,
                latitude: facilityCoords.port ? facilityCoords.port[1] : -3.386061643485775,
              },
              {
                name: t("infrastructure.kiluTitle"),
                desc: t("infrastructure.kiluDesc"),
                type: "industrial",
                icon: Building,
                rail: "via-amber-500",
                ambientGlow: "bg-amber-500/30",
                gradient: "from-amber-500 via-amber-600 to-orange-700",
                shadow: "shadow-amber-500/15 dark:shadow-black/70",
                cardHover: "hover:border-amber-500/40 hover:shadow-[0_20px_40px_rgba(245,158,11,0.14)]",
                tag: "Kawasan Industri Terpadu",
                badgeBg: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-500/20",
                dotColor: "bg-amber-500",
                longitude: facilityCoords.industrial ? facilityCoords.industrial[0] : 120.252,
                latitude: facilityCoords.industrial ? facilityCoords.industrial[1] : -3.125,
              },
              {
                name: t("infrastructure.mppTitle"),
                desc: t("infrastructure.mppDesc"),
                type: "mpp",
                icon: ShieldCheck,
                rail: "via-indigo-500",
                ambientGlow: "bg-indigo-500/30",
                gradient: "from-indigo-500 via-purple-600 to-violet-700",
                shadow: "shadow-indigo-500/15 dark:shadow-black/70",
                cardHover: "hover:border-indigo-500/40 hover:shadow-[0_20px_40px_rgba(99,102,241,0.14)]",
                tag: "Mal Pelayanan Publik",
                badgeBg: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-500/20",
                dotColor: "bg-indigo-500",
                longitude: facilityCoords.mpp ? facilityCoords.mpp[0] : 120.36547889067685,
                latitude: facilityCoords.mpp ? facilityCoords.mpp[1] : -3.394828505594006,
              }
            ];
            const invGeom = (selectedInvestmentId && investments.find((i) => i.id === selectedInvestmentId)?.geometry) || null;
            let invCenter = null;
            if (invGeom) {
              try {
                const center = turf.center(invGeom);
                invCenter = [center.geometry.coordinates[0], center.geometry.coordinates[1]];
              } catch (e) {}
            }

            const mappedFacilities = baseFacilities.map(f => {
              let dist = null;
              if (invCenter) {
                dist = calculateHaversineDistance(invCenter[1], invCenter[0], f.latitude, f.longitude);
              }
              return { ...f, distanceKm: dist };
            });

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-14 sm:gap-y-14 sm:gap-x-6 lg:gap-6 relative z-10">
                {mappedFacilities.map((facility, idx) => (
                  <motion.div
                    initial={isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    style={{ willChange: "transform, opacity" }}
                    whileInView={isMobile ? undefined : { opacity: 1, y: 0 }}
                    viewport={isMobile ? undefined : { once: true, amount: 0.05 }}
                    transition={{ delay: idx * 0.1 }}
                    key={idx}
                    className={`group relative pt-14 sm:pt-16 pb-6 px-5 sm:px-6 rounded-[28px] flex flex-col items-center text-center justify-between transition-all duration-300 ease-out hover:-translate-y-2 bg-white dark:bg-slate-900/95 shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-slate-200/90 dark:border-slate-800 ${facility.cardHover}`}
                  >
                    {/* Top Subtle Accent Rail */}
                    <div className={`absolute top-0 inset-x-8 h-[3px] bg-gradient-to-r from-transparent ${facility.rail} to-transparent rounded-full`} />

                    {/* Overlapping Circular Medallion (MPP Badung Aesthetic) */}
                    <div className="absolute -top-10 sm:-top-11 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                      <div className="relative">
                        {/* Ambient Glow */}
                        <div className={`absolute inset-0 rounded-full ${facility.ambientGlow} blur-md transform group-hover:scale-115 transition-transform duration-300`} />
                        
                        {/* Outer Elevated Podium Ring */}
                        <div className={`relative w-20 h-20 sm:w-22 sm:h-22 rounded-full ring-4 sm:ring-[6px] ring-white dark:ring-slate-900 ${facility.shadow} bg-gradient-to-br ${facility.gradient} flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-105`}>
                          {/* Inner Delicate Ring Accent */}
                          <div className="absolute inset-1.5 rounded-full border border-white/30 pointer-events-none" />
                          <facility.icon size={34} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" strokeWidth={2.2} />
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="w-full flex flex-col items-center flex-grow mt-1">
                      <h3 className="text-lg sm:text-xl font-bold mb-2.5 tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {facility.name}
                      </h3>
                      <p
                        className={`text-xs sm:text-sm leading-relaxed ${textMuted} text-center flex-grow mb-4`}
                      >
                        {facility.desc}
                      </p>
                    </div>

                    {/* Bottom Info: Distance Calculation or Status Tag */}
                    <div className="w-full mt-auto pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col items-center gap-2">
                      {facility.distanceKm !== null ? (
                        <div className="w-full flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {t("distance.estimation", "Estimasi Jarak")}
                          </span>
                          <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/20">
                            {facility.distanceKm.toFixed(1)} km
                          </span>
                        </div>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-xs ${facility.badgeBg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${facility.dotColor} animate-pulse`} />
                          {facility.tag}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* INTERACTIVE ROADMAP & LICENSING GUIDE */}
        <section id="roadmap-section" className={`py-8 md:py-12 lg:py-16 border-t ${isDark ? "bg-[#0b0f19] border-slate-800/60" : "bg-white border-slate-200"}`}>
          <div className="container max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className={`inline-flex items-center gap-2 px-4 py-1.5 min-h-[44px] rounded-full text-xs font-bold uppercase tracking-wider mb-4 border ${isDark ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                <Compass size={14} className="animate-spin-slow" /> {t("roadmap.tag", "Alur Legalitas & Regulasi Luwu")}
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                {t("roadmap.title", "Panduan Regulasi & Roadmap Perizinan")}
              </h2>
              <div className="h-1 w-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mb-4 mx-auto"></div>
              <p className={`text-sm sm:text-base ${textMuted}`}>
                {t("roadmap.subtitle", "Kemudahan berinvestasi didukung integrasi digital perizinan satu pintu Kabupaten Luwu.")}
              </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch w-full">
              {/* Stepper Buttons (Left Column) */}
              <div className="w-full lg:w-5/12 flex flex-col gap-3 sm:gap-4 shrink-0">
                {stepsData.map((step, idx) => {
                  const isActive = activeRoadmapStep === idx;
                  return (
                    <motion.button whileTap={{ scale: 0.95 }}
                      key={idx}
                      onClick={() => setActiveRoadmapStep(idx)}
                      className={`w-full text-left p-3 sm:p-4 rounded-xl border flex items-center gap-3 sm:gap-4 transition-all duration-300 relative overflow-hidden group ${
                        isActive
                          ? isDark
                            ? "bg-slate-900 border-blue-500/50 shadow-lg shadow-blue-500/5"
                            : "bg-blue-50/50 border-blue-500/40 shadow-md"
                          : isDark
                          ? "bg-slate-950/40 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-800"
                          : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-teal-500" />
                      )}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-sm shrink-0 ${
                        isActive 
                          ? "bg-blue-500/10 text-blue-500 dark:text-blue-400"
                          : "bg-slate-500/10 font-medium text-slate-700 dark:text-slate-300"
                      }`}>
                        {step.num}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold tracking-tight leading-normal mb-1 break-words">{step.title}</h4>
                        <p className={`text-[11px] ${textMuted} truncate`}>{step.short}</p>
                      </div>
                      <step.icon size={16} className={`shrink-0 transition-transform duration-300 ${isActive ? "scale-110 " + step.color : "font-medium text-slate-700 dark:text-slate-300 group-hover:scale-110"}`} />
                    </motion.button>
                  );
                })}
              </div>

              {/* Step Details Render Card (Right Column) */}
              <div className="w-full lg:w-7/12">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeRoadmapStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className={`p-6 sm:p-8 rounded-xl border min-h-full flex flex-col justify-between relative overflow-hidden glass-panel shadow-[0_20px_40px_-15px_rgba(16,185,129,0.1)] ${isDark ? "bg-slate-800 border-slate-700 shadow-none" : "bg-white border-slate-100 shadow-lg"}`}
                  >
                    <div>
                      {/* Step Header */}
                      <div className="flex flex-col gap-4 mb-5 pb-5 border-b border-slate-500/10">
                        <div className="flex items-start gap-3 sm:gap-4">
                          <span className="text-3xl sm:text-4xl font-black text-blue-500/30 dark:text-blue-400/20 shrink-0 mt-0.5">
                            {stepsData[activeRoadmapStep].num}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base sm:text-xl font-bold tracking-tight mb-2 break-words leading-snug">
                              {stepsData[activeRoadmapStep].long_title}
                            </h3>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                              <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-semibold break-words">
                                {stepsData[activeRoadmapStep].agency}
                              </p>
                              <span className="hidden sm:block text-slate-300 dark:text-slate-600/50 text-xs">•</span>
                              <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full w-fit shrink-0">
                                <Clock size={12} />
                                {stepsData[activeRoadmapStep].duration}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Detail Description */}
                      <p className={`text-sm sm:text-base leading-relaxed mb-8 ${textMuted}`}>
                        {stepsData[activeRoadmapStep].desc}
                      </p>

                      {/* Checklists */}
                      <div className="space-y-4 mb-6">
                        <h4 className="text-xs sm:text-sm uppercase tracking-widest font-bold text-slate-600 dark:text-slate-300">
                          {t("roadmap.reqHeader", "Berkas Persyaratan Wajib:")}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {stepsData[activeRoadmapStep].requirements.map((chk, i) => (
                            <div key={i} className="flex items-start gap-3 text-xs sm:text-sm">
                              <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-500 mt-0.5 shrink-0 flex-none">
                                <ShieldCheck size={14} />
                              </div>
                              <span className={`${textMuted} leading-relaxed flex-1 break-words`}>{chk}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-500/10 flex items-center justify-between gap-4">
                      <div className="text-xs leading-relaxed">
                        <span className={textMuted}>{t("roadmap.helpText", "Butuh bantuan pengurusan?")}</span>
                        <a href="https://wa.me/6281142011" target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-500 hover:underline font-semibold inline-flex items-center">
                          {t("roadmap.contactMpp", "Hubungi MPP Luwu")}
                        </a>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        {}
        <section
          className={`py-8 md:py-12 lg:py-16 border-y relative overflow-hidden z-10 ${
            isDark
              ? "border-emerald-500/20 bg-slate-900/90"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          {/* Ambient Glowing Background Elements - Enhanced brightness for dark mode */}
          <div className="absolute top-1/4 left-1/10 w-[450px] h-[450px] bg-emerald-500/15 dark:bg-emerald-400/30 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/10 w-[550px] h-[550px] bg-emerald-600/15 dark:bg-emerald-300/25 rounded-full blur-[120px] pointer-events-none" />

          <div className="container mx-auto px-2 sm:px-4 lg:px-6">
            <motion.div
              initial={isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              style={{ willChange: "transform, opacity" }}
              whileInView={isMobile ? undefined : { opacity: 1, y: 0 }}
              viewport={isMobile ? undefined : { once: true, amount: 0.05 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="pt-24 sm:pt-28 pb-8 px-6 sm:px-12 lg:p-16 rounded-3xl relative overflow-hidden transition-all duration-500 bg-white/80 dark:bg-gradient-to-r dark:from-slate-900/95 dark:via-emerald-900/70 dark:to-slate-900/95 backdrop-blur-2xl border border-white/60 dark:border-emerald-400/40 shadow-2xl dark:shadow-emerald-500/20 hover:dark:border-emerald-400/70 z-10"
            >
              {/* Subtle tech background line grid */}
              <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:32px_32px]" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center relative z-10">
                {/* LEFT COLUMN: Modern Typography & Actions */}
                <div className="lg:col-span-7 text-left flex flex-col justify-center space-y-5">
                  <motion.div
                    initial={isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                    style={{ willChange: "transform, opacity" }}
                    whileInView={isMobile ? undefined : { opacity: 1, y: 0 }}
                    viewport={isMobile ? undefined : { once: true, amount: 0.05 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                  >
                    <div className="inline-flex items-center gap-2 px-3 py-1 min-h-[44px] rounded-full text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-400/15 border border-emerald-500/20 dark:border-emerald-400/30 mb-3 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      {t("mppBanner.tag")}
                    </div>
                    <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white mb-2 text-balance">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-emerald-600 dark:from-sky-300 dark:via-emerald-300 dark:to-teal-300 font-sans drop-shadow-sm">
                        {t("mppBanner.title")}
                      </span>
                    </h3>
                  </motion.div>

                  <motion.p
                    initial={isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                    style={{ willChange: "transform, opacity" }}
                    whileInView={isMobile ? undefined : { opacity: 1, y: 0 }}
                    viewport={isMobile ? undefined : { once: true, amount: 0.05 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300 font-normal"
                  >
                    {t("mppBanner.desc")}
                  </motion.p>

                  <motion.div
                    initial={isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                    style={{ willChange: "transform, opacity" }}
                    whileInView={isMobile ? undefined : { opacity: 1, y: 0 }}
                    viewport={isMobile ? undefined : { once: true, amount: 0.05 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                    className="pt-2"
                  >
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
                          window.history.scrollRestoration = 'manual';
                        }
                        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                        if (document.documentElement) document.documentElement.scrollTop = 0;
                        if (document.body) document.body.scrollTop = 0;
                        requestSmartFullscreen();
                        navigate("/mpp");
                      }}
                      className="py-3.5 sm:py-4 w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm uppercase tracking-wider rounded-2xl backdrop-blur-xl border border-emerald-500/30 shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all duration-300 cursor-pointer"
                    >
                      <span>{t("mppBanner.enterBtn")}</span>
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </motion.button>
                  </motion.div>
                </div>

                {/* RIGHT COLUMN: Foto Petugas Front Office MPP Simpurusiang (Background Transparan & Tanpa Frame Pembungkus) */}
                <div className="lg:col-span-5 flex flex-col items-center justify-end relative w-full pt-4 lg:pt-0 self-end">
                  <div className="relative flex flex-col items-center justify-end w-full max-w-sm sm:max-w-md">
                    {/* Ambient Glow effect behind cutouts - clean in dark & light theme */}
                    <div className="absolute bottom-0 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-400/15 rounded-full blur-3xl pointer-events-none -z-10" />

                    {staffImageLeft && staffImageRight ? (
                      <div className="flex items-end justify-center gap-3 sm:gap-6 w-full relative">
                        {/* Petugas Kiri - Transparan & Bebas Frame */}
                        <div className="relative flex-1 flex flex-col items-center justify-end group">
                          <img
                            src={staffImageLeft}
                            alt="Petugas Front Office MPP Simpurusiang (Kiri)"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800";
                            }}
                            className="w-full max-h-72 sm:max-h-80 md:max-h-96 object-contain object-bottom bg-transparent transition-transform duration-500 group-hover:scale-105 drop-shadow-[0_10px_20px_rgba(0,0,0,0.2)] dark:drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]"
                          />
                          <div className="mt-2 text-center">
                            <span className="inline-block text-[11px] font-semibold text-slate-800 dark:text-slate-100 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200 dark:border-white/10 shadow-sm">
                              {t("mppBanner.frontOfficeStaff", "Petugas Front Office")}
                            </span>
                          </div>
                        </div>

                        {/* Petugas Kanan - Transparan & Bebas Frame */}
                        <div className="relative flex-1 flex flex-col items-center justify-end group">
                          <img
                            src={staffImageRight}
                            alt="Petugas Front Office MPP Simpurusiang (Kanan)"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800";
                            }}
                            className="w-full max-h-72 sm:max-h-80 md:max-h-96 object-contain object-bottom bg-transparent transition-transform duration-500 group-hover:scale-105 drop-shadow-[0_10px_20px_rgba(0,0,0,0.2)] dark:drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]"
                          />
                          <div className="mt-2 text-center">
                            <span className="inline-block text-[11px] font-semibold text-slate-800 dark:text-slate-100 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200 dark:border-white/10 shadow-sm">
                              {t("mppBanner.integratedServices", "Layanan Terpadu")}
                            </span>
                          </div>
                        </div>

                        {/* Floating OSS INTEGRATED Badge */}
                        <div className="absolute -top-3 right-0 sm:right-2 px-3.5 py-1.5 min-h-[36px] rounded-full bg-slate-900/90 dark:bg-slate-900/95 border border-emerald-500/40 shadow-xl backdrop-blur-md flex items-center gap-1.5 z-30">
                          <Sparkles size={12} className="text-yellow-400 animate-spin" />
                          <span className="text-[10px] font-extrabold font-mono tracking-wider text-emerald-400">
                            OSS INTEGRATED
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full flex flex-col items-center justify-end group">
                        <img
                          src={staffImageLeft || staffImageRight || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800"}
                          alt="DPMPTSP MPP Simpurusiang - Petugas Front Office"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800";
                          }}
                          className="w-full max-h-72 sm:max-h-80 md:max-h-96 object-contain object-bottom bg-transparent transition-transform duration-500 group-hover:scale-105 drop-shadow-[0_12px_24px_rgba(0,0,0,0.2)] dark:drop-shadow-[0_14px_28px_rgba(0,0,0,0.6)]"
                        />

                        {/* Badges without enclosing frame */}
                        <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
                          <div className="px-3 py-1 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-emerald-500/30 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 shadow-sm flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {t("mppBanner.mppFrontOfficeOfficer", "Petugas Front Office MPP Simpurusiang")}
                          </div>
                          <div className="px-3.5 py-1 min-h-[32px] rounded-full bg-slate-900/90 text-white border border-emerald-500/40 shadow-sm backdrop-blur-md flex items-center gap-1.5">
                            <Sparkles size={11} className="text-yellow-400 animate-spin" />
                            <span className="text-[10px] font-extrabold font-mono tracking-wider text-emerald-400">
                              OSS INTEGRATED
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 5. SHOWCASE TEKNOLOGI AI & CALCULATOR */}
        <div
          id="analytics-section"
          className={`pt-8 pb-4 lg:pt-16 lg:pb-8 border-t relative ${isDark ? "border-slate-800" : "border-slate-200"}`}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none hidden dark:block">
            <div className="absolute top-[10%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-indigo-500/5 blur-[120px] mix-blend-screen" />
            <div className="absolute bottom-[20%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-blue-500/5 blur-[100px] mix-blend-screen" />
          </div>
          <div className="container max-w-7xl mx-auto px-2 sm:px-2 sm:px-4 lg:px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-full text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-xl border animate-fade-in-up ${isDark ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-200 border-indigo-400/30 shadow-sm" : "bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-700 border-indigo-300 shadow-sm shadow-indigo-500/10"}`}
                style={{ animationDelay: '50ms' }}
              >
                <Sparkles size={14} /> Powered by AI & Spatial Logic
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                {t("sections.intel.title")}
              </h2>
              <div className="h-1 w-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mb-4 mx-auto animate-fade-in-up" style={{ animationDelay: '250ms' }}></div>
              <p className={`text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 animate-fade-in-up`} style={{ animationDelay: '350ms' }}>
                {t("sections.intel.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* KALKULATOR ROI */}
              <motion.div
                initial={isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                style={{ willChange: "transform, opacity" }}
                whileInView={isMobile ? undefined : { opacity: 1, y: 0 }}
                viewport={isMobile ? undefined : { once: true, amount: 0.05 }}
                className="lg:col-span-12 p-2 sm:p-6 md:p-8 !px-3 sm:!px-6 md:!px-8 rounded-2xl md:rounded-xl border overflow-hidden h-full flex flex-col bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl border-slate-200 dark:border-slate-700/50 shadow-2xl shadow-slate-200/50 dark:shadow-[0_0_50px_rgba(16,185,129,0.1)] transition-all duration-500"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center gap-3.5 md:gap-5 mb-5 md:mb-8 border-b pb-4 md:pb-6 border-slate-500/20">
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div
                      className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl backdrop-blur-md border shadow-sm shrink-0 ${isDark ? "bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-300 border-indigo-400/40" : "bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 border-indigo-200"}`}
                    >
                      <Calculator className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-sm" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-0.5 font-sans leading-snug">{t("roiSimulator.title")}</h3>
                      <div className={`text-xs sm:text-sm font-medium ${textMuted}`}>
                        {t("roiSimulator.subtitle")}
                      </div>
                    </div>
                  </div>
                  {roiResult && (<div className={`mt-2 md:mt-0 w-full md:w-auto flex justify-center md:ml-auto items-center gap-2 px-3.5 py-1.5 min-h-[38px] rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-md border shadow-sm
                      ${roiResult.status === 'FEASIBLE'
                        ? isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : roiResult.status === 'NOT_FEASIBLE'
                          ? isDark ? 'bg-rose-500/20 text-rose-300 border-rose-400/40' : 'bg-rose-50 text-rose-700 border-rose-300'
                          : isDark ? 'bg-amber-500/20 text-amber-300 border-amber-400/40' : 'bg-amber-50 text-amber-700 border-amber-300'}`}>
                      <span className={`w-2 h-2 rounded-full animate-pulse shadow-sm
                        ${roiResult.status === 'FEASIBLE' ? 'bg-emerald-400 shadow-emerald-400/50'
                          : roiResult.status === 'NOT_FEASIBLE' ? 'bg-rose-400 shadow-rose-400/50' : 'bg-amber-400 shadow-amber-400/50'}`} />
                      {roiResult.status === 'FEASIBLE' ? t('feasible', 'Sangat Layak')
                        : roiResult.status === 'NOT_FEASIBLE' ? t('not_feasible', 'Tidak Layak')
                        : t('moderate_zone', 'Zona Moderat')}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                  <div className="md:col-span-2 space-y-4">
                    <label
                      className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${textMuted}`}
                    >
                      {t("roiSimulator.targetPotential")}
                    </label>
                    <div className="relative">
                      <select
                        value={selectedInvestmentId}
                        onChange={(e) => setSelectedInvestmentId(e.target.value)}
                        className={`w-full px-4 sm:px-5 py-3.5 sm:py-4 min-h-[48px] rounded-2xl border font-semibold text-xs sm:text-sm outline-none transition-all appearance-none cursor-pointer focus:ring-4 focus:ring-emerald-500/20 ${inputBg}`}
                      >
                        <option value="">
                          {t("roiSimulator.placeholder")}
                        </option>
                        {(smartFilterState.selectedSector && smartFilterState.selectedSector !== "SEMUA"
                          ? uniqueInvestmentsList.filter(inv => inv.sector && inv.sector.toLowerCase() === smartFilterState.selectedSector.toLowerCase())
                          : uniqueInvestmentsList
                        ).map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.name} • {inv.sector}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown className="w-5 h-5" />
                      </div>
                    </div>

                    {selectedInvObj && (
                      <div
                        className={`mt-3 rounded-2xl border ${isDark ? "border-slate-800 bg-slate-900/60" : "border-slate-200/90 bg-slate-50/80"} overflow-hidden shadow-sm`}
                      >
                        <motion.button whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() =>
                            setIsProfileExpanded(!isProfileExpanded)
                          }
                          className="w-full px-4 sm:px-5 py-3 min-h-[44px] flex items-center justify-between hover:bg-slate-500/5 transition-colors focus:outline-none"
                        >
                          <div className="flex flex-row items-center gap-2 min-w-0 pr-2">
                            <div className="p-1.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-400/10 shrink-0">
                              <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                              {t('profile_location')} - {selectedInvObj.name}
                            </span>
                          </div>
                          <div className="p-1 rounded-full bg-slate-200/50 dark:bg-slate-800 shrink-0">
                            {isProfileExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                            )}
                          </div>
                        </motion.button>

                        <AnimatePresence>
                          {isProfileExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 pt-1 text-xs">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                                  <div className="space-y-0.5">
                                    <div className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">{t('sector_title', 'Sektor')}</div>
                                    <div className="font-bold text-emerald-600 dark:text-emerald-400 truncate">
                                      {t(getSectorI18nKey(selectedInvObj.sector))}
                                    </div>
                                  </div>
                                  <div className="space-y-0.5">
                                    <div className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">{t('district', 'Kecamatan')}</div>
                                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                      {districts.find((d) => d.id === selectedInvObj.districtId)?.name || "-"}
                                    </div>
                                  </div>
                                  <div className="space-y-0.5">
                                    <div className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">{t('village', 'Desa/Kelurahan')}</div>
                                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                      {villages.find((v) => v.id === selectedInvObj.villageId)?.name || "-"}
                                    </div>
                                  </div>
                                  <div className="space-y-0.5">
                                    <div className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">{t('land_area', 'Luas Lahan')}</div>
                                    <div className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                                      {formatAreaHa(selectedInvObj.areaHa)} Ha
                                    </div>
                                  </div>
                                  <div className="space-y-0.5">
                                    <div className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">{t('land_status', 'Status Lahan')}</div>
                                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                      {selectedInvObj.landStatus || "Clear & Clean"}
                                    </div>
                                  </div>
                                  <div className="space-y-0.5">
                                    <div className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">{t('coordinates', 'Koordinat')}</div>
                                    <div className="font-mono text-[10px] font-bold text-sky-600 dark:text-sky-400 truncate">
                                      {selectedInvObj.latitude.toFixed(4)}, {selectedInvObj.longitude.toFixed(4)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2 space-y-6">
                    <OssRoiSimulatorInputs
                      sector={selectedSector === "" ? null : selectedSector}
                      capital={capital}
                      setCapital={setCapital}
                      opex={opex}
                      setOpex={setOpex}
                      isDark={isDark}
                      textMuted={textMuted}
                      inputBg={inputBg}
                      useDetailed={isUsingOSS}
                      setUseDetailed={setIsUsingOSS}
                    />
                  </div>

                  {selectedSector === SektorInvestasi.PARIWISATA ? (
                    <>
                      <div>
                        <label
                          className={`block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                        >
                          {t('est_visitors_per_day')}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatInputAmount(visitorsPerDay)}
                            onFocus={(e) => {
                              e.target.select();
                              setVisitorsPerDay("");
                            }}
                            onChange={(e) =>
                              handleNumericInput(
                                e.target.value,
                                setVisitorsPerDay,
                              )
                            }
                            className={`w-full px-5 py-4 min-h-[44px] rounded-xl border font-bold text-sm sm:text-base outline-none transition-all ${inputBg}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          className={`block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                        >
                          {t('operational_days_per_week')}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatInputAmount(activeDaysPerWeek)}
                            onFocus={(e) => {
                              e.target.select();
                              setActiveDaysPerWeek("");
                            }}
                            onChange={(e) =>
                              handleNumericInput(
                                e.target.value,
                                setActiveDaysPerWeek,
                              )
                            }
                            className={`w-full px-5 py-4 min-h-[44px] rounded-xl border font-bold text-sm sm:text-base outline-none transition-all ${inputBg}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          className={`block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                        >
                          {t('visitors_per_week')}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            disabled
                            value={formatInputAmount(
                              (
                                (parseFloat(visitorsPerDay) || 0) *
                                (parseFloat(activeDaysPerWeek) || 0)
                              ).toString(),
                            )}
                            className={`w-full px-5 py-4 min-h-[44px] rounded-xl border font-bold text-sm sm:text-base outline-none transition-all opacity-70 cursor-not-allowed ${inputBg}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          className={`block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                        >
                          {t('ticket_price')}
                        </label>
                        <div className="relative">
                          <span
                            className={`absolute left-5 top-1/2 -translate-y-1/2 font-normal ${textMuted}`}
                          >
                            Rp
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatInputAmount(ticketPrice)}
                            onFocus={(e) => {
                              e.target.select();
                              setTicketPrice("");
                            }}
                            onChange={(e) =>
                              handleNumericInput(e.target.value, setTicketPrice)
                            }
                            className={`w-full pl-14 pr-5 py-4 min-h-[44px] rounded-xl border font-bold text-sm sm:text-base outline-none transition-all ${inputBg}`}
                          />
                        </div>
                      </div>
                    </>
                  ) : selectedSector === SektorInvestasi.PERTANIAN ||
                    selectedSector === SektorInvestasi.KELAUTAN ? (
                    <>
                      <div>
                        <label
                          className={`block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                        >
                          {t('yield_per_hectare')}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatInputAmount(baseYield)}
                            onFocus={(e) => {
                              e.target.select();
                              setBaseYield("");
                            }}
                            onChange={(e) =>
                              handleNumericInput(e.target.value, setBaseYield)
                            }
                            className={`w-full px-5 py-4 min-h-[44px] rounded-xl border font-bold text-sm sm:text-base outline-none transition-all ${inputBg}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          className={`block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                        >
                          {t('harvest_cycles_per_year')}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatInputAmount(harvestsPerYear)}
                            onFocus={(e) => {
                              e.target.select();
                              setHarvestsPerYear("");
                            }}
                            onChange={(e) =>
                              handleNumericInput(
                                e.target.value,
                                setHarvestsPerYear,
                              )
                            }
                            className={`w-full px-5 py-4 min-h-[44px] rounded-xl border font-bold text-sm sm:text-base outline-none transition-all ${inputBg}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          className={`block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                        >
                          {t('production_volume')}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            disabled
                            value={formatInputAmount(
                              (
                                (parseFloat(baseYield) || 0) *
                                (parseFloat(harvestsPerYear) || 0)
                              ).toString(),
                            )}
                            className={`w-full px-5 py-4 min-h-[44px] rounded-xl border font-bold text-sm sm:text-base outline-none transition-all opacity-70 cursor-not-allowed ${inputBg}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          className={`block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                        >
                          {t('commodity_price')}
                        </label>
                        <div className="relative">
                          <span
                            className={`absolute left-5 top-1/2 -translate-y-1/2 font-normal ${textMuted}`}
                          >
                            Rp
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatInputAmount(pricePerUnit)}
                            onFocus={(e) => {
                              e.target.select();
                              setPricePerUnit("");
                            }}
                            onChange={(e) =>
                              handleNumericInput(
                                e.target.value,
                                setPricePerUnit,
                              )
                            }
                            className={`w-full pl-14 pr-5 py-4 min-h-[44px] rounded-xl border font-bold text-sm sm:text-base outline-none transition-all ${inputBg}`}
                          />
                        </div>
                      </div>
                    </>
                  ) : selectedSector === SektorInvestasi.PERTAMBANGAN ||
                    selectedSector === SektorInvestasi.PERDAGANGAN ? (
                    <>
                      <div>
                        <label
                          className={`block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                        >
                          {t('production_volume')}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatInputAmount(volumePerDay)}
                            onFocus={(e) => {
                              e.target.select();
                              setVolumePerDay("");
                            }}
                            onChange={(e) =>
                              handleNumericInput(
                                e.target.value,
                                setVolumePerDay,
                              )
                            }
                            className={`w-full px-5 py-4 min-h-[44px] rounded-xl border font-bold text-sm sm:text-base outline-none transition-all ${inputBg}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          className={`block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                        >
                          {t('cultivation_cycle')}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatInputAmount(activeDaysPerMonth)}
                            onFocus={(e) => {
                              e.target.select();
                              setActiveDaysPerMonth("");
                            }}
                            onChange={(e) =>
                              handleNumericInput(
                                e.target.value,
                                setActiveDaysPerMonth,
                              )
                            }
                            className={`w-full px-5 py-4 min-h-[44px] rounded-xl border font-bold text-sm sm:text-base outline-none transition-all ${inputBg}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          className={`block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                        >
                          {t('production_volume')}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            disabled
                            value={formatInputAmount(
                              (
                                (parseFloat(volumePerDay) || 0) *
                                (parseFloat(activeDaysPerMonth) || 0)
                              ).toString(),
                            )}
                            className={`w-full px-5 py-4 min-h-[44px] rounded-xl border font-bold text-sm sm:text-base outline-none transition-all opacity-70 cursor-not-allowed ${inputBg}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          className={`block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                        >
                          {t('selling_price')}
                        </label>
                        <div className="relative">
                          <span
                            className={`absolute left-5 top-1/2 -translate-y-1/2 font-normal ${textMuted}`}
                          >
                            Rp
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatInputAmount(marginPerUnit)}
                            onFocus={(e) => {
                              e.target.select();
                              setMarginPerUnit("");
                            }}
                            onChange={(e) =>
                              handleNumericInput(
                                e.target.value,
                                setMarginPerUnit,
                              )
                            }
                            className={`w-full pl-14 pr-5 py-4 min-h-[44px] rounded-xl border font-bold text-sm sm:text-base outline-none transition-all ${inputBg}`}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="md:col-span-2 space-y-6">
                        <label
                          className={`block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                        >
                          {t("roiSimulator.estRevenue")}
                        </label>
                        <div className="relative">
                          <span
                            className={`absolute left-5 top-1/2 -translate-y-1/2 font-normal ${textMuted}`}
                          >
                            Rp
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatInputAmount(annualRevenue)}
                            onFocus={(e) => {
                              e.target.select();
                              setAnnualRevenue("");
                            }}
                            onChange={(e) =>
                              handleNumericInput(
                                e.target.value,
                                setAnnualRevenue,
                              )
                            }
                            className={`w-full pl-14 pr-5 py-4 min-h-[44px] rounded-xl border font-bold text-base sm:text-lg outline-none transition-all ${inputBg}`}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* PARAMETER EKONOMI INVESTASI */}
                  <div className="md:col-span-2 border-t pt-6 border-slate-500/10 mt-2">
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2 text-indigo-500">
                      <TrendingUp size={16} />{t('financial.parameterTitle')}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className={`block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>{t('financial.inputWacc')}</label>
                        <div className="relative">
                          <input
                            type="number"
                            inputMode="decimal"
                            min="1"
                            max="50"
                            value={discountRate}
                            onFocus={(e) => {
                              e.target.select();
                              setDiscountRate("" as any);
                            }}
                            onChange={(e) => setDiscountRate(Math.max(1, parseInt(e.target.value) || 0))}
                            className={`w-full px-5 py-4 min-h-[44px] rounded-xl border font-bold text-sm sm:text-base outline-none transition-all ${inputBg}`}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mt-1 block">{t('financial.descWacc')}</span>
                      </div>
                      <div>
                        <label className={`block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>{t('financial.inputTenor')}</label>
                        <div className="relative">
                          <input
                            type="number"
                            inputMode="numeric"
                            min="1"
                            max="30"
                            value={projectionTenor}
                            onFocus={(e) => {
                              e.target.select();
                              setProjectionTenor("" as any);
                            }}
                            onChange={(e) => setProjectionTenor(Math.max(1, parseInt(e.target.value) || 0))}
                            className={`w-full px-5 py-4 min-h-[44px] rounded-xl border font-bold text-sm sm:text-base outline-none transition-all ${inputBg}`}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mt-1 block">{t('financial.descTenor')}</span>
                      </div>
                      <div>
                        <label className={`block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>{t('financial.inputInflation')}</label>
                        <div className="relative">
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            min="0"
                            max="30"
                            value={inflationRate}
                            onFocus={(e) => {
                              e.target.select();
                              setInflationRate("" as any);
                            }}
                            onChange={(e) => setInflationRate(Math.max(0, parseFloat(e.target.value) || 0))}
                            className={`w-full px-5 py-4 min-h-[44px] rounded-xl border font-bold text-sm sm:text-base outline-none transition-all ${inputBg}`}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mt-1 block">{t('financial.descInflation')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <motion.button whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => calculateROI(true)}
                  className="w-full mb-8 py-5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-bold text-base sm:text-lg tracking-wider uppercase flex items-center justify-center gap-3 transition-all duration-300 backdrop-blur-xl border border-indigo-300/40 shadow-[0_10px_30px_rgba(99,102,241,0.35)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.45)] cursor-pointer"
                >
                  <BarChart3 size={24} />
                  {t('financial.btnCalculate')}
                </motion.button>

                <AnimatePresence>
                  {isCalculating && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div
                        className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"></div>
                          <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"></div>
                          <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse col-span-full"></div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {!isCalculating && roiResult && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div
                        className={`p-0 sm:p-5 md:p-6 rounded-none sm:rounded-3xl border-0 sm:border bg-transparent ${isDark ? "sm:bg-slate-900/50 sm:border-slate-800/80 sm:backdrop-blur-xl" : "sm:bg-white/70 sm:border-slate-200/70 sm:backdrop-blur-xl sm:shadow-xl sm:shadow-slate-200/30"}`}
                      >
                        {(() => {
                          const baseScore = Math.min(100, Math.max(0,
                            (roiResult.npv > 0 ? 30 : 0) +
                            (roiResult.irr >= discountRate ? 30 : roiResult.irr > 0 ? 15 : 0) +
                            (roiResult.roi >= 15 ? 25 : roiResult.roi >= 8 ? 15 : 5) +
                            (roiResult.payback <= 5 ? 15 : roiResult.payback <= 8 ? 8 : 0)
                          ));
                          const score = typeof baseScore === 'number' && !isNaN(baseScore) ? baseScore : 0;
                          const R = 46;
                          const circ = 2 * Math.PI * R;
                          const rawOffset = circ - (score / 100) * circ;
                          const offset = typeof rawOffset === 'number' && !isNaN(rawOffset) ? rawOffset : circ;
                          const scoreColor = score >= 70 ? '#059669' : score >= 45 ? '#d97706' : '#e11d48';
                          return (
                            <div className={`flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl mb-4 backdrop-blur-xl border
                                             ${isDark ? 'bg-slate-900/60 border-slate-700/60 shadow-lg shadow-slate-950/40' : 'bg-white/90 border-slate-200 shadow-md shadow-slate-200/50'}`}>
                              {/* Gauge */}
                              <div className="flex items-center gap-4 sm:flex-col sm:justify-center shrink-0">
                                <div className="relative w-[96px] h-[96px] sm:w-[110px] sm:h-[110px]">
                                  <svg viewBox="0 0 110 110" className="w-full h-full">
                                    <circle cx="55" cy="55" r={R} fill="none"
                                            stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="9"/>
                                    <circle cx="55" cy="55" r={R} fill="none"
                                            stroke={scoreColor} strokeWidth="9"
                                            strokeLinecap="round"
                                            strokeDasharray={circ}
                                            strokeDashoffset={circ}
                                            style={{
                                              transform: 'rotate(-90deg)',
                                              transformOrigin: '55px 55px',
                                              transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)',
                                              strokeDashoffset: offset,
                                            }}/>
                                  </svg>
                                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <span className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: scoreColor }}>{score}</span>
                                    <span className={`text-[9px] sm:text-[10px] uppercase tracking-widest font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                      Skor
                                    </span>
                                  </div>
                                </div>
                                <div className="sm:hidden flex flex-col justify-center">
                                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{t("roiSimulator.feasibilityIndex", "Indeks Kelayakan")}</div>
                                  <div className="text-[11px] font-semibold" style={{ color: scoreColor }}>
                                    {score >= 70 ? t("roiSimulator.highlyRecommended", "Sangat Direkomendasikan") : score >= 45 ? t("roiSimulator.moderatelyFeasible", "Cukup Layak") : t("roiSimulator.mitigationRequired", "Risiko Perlu Mitigasi")}
                                  </div>
                                </div>
                              </div>

                              {/* KPI ringkas di sebelah gauge */}
                              <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full flex-1">
                                <div className="p-2.5 sm:p-3 rounded-xl bg-slate-500/5 dark:bg-slate-800/40 border border-slate-500/10">
                                  <div className="text-[10px] sm:text-xs uppercase tracking-wider mb-0.5 font-bold text-slate-500 dark:text-slate-400 truncate">{t("landing.annualRoi", "ROI Tahunan")}</div>
                                  <div className="text-base sm:text-lg md:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{roiResult.roi.toFixed(1)}%</div>
                                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">{projectionTenor}th: {roiResult.cumulativeRoi.toFixed(0)}%</div>
                                </div>
                                <div className="p-2.5 sm:p-3 rounded-xl bg-slate-500/5 dark:bg-slate-800/40 border border-slate-500/10">
                                  <div className="text-[10px] sm:text-xs uppercase tracking-wider mb-0.5 font-bold text-slate-500 dark:text-slate-400 truncate">{t("landing.netProfit", "Net Profit")}</div>
                                  <div className="text-base sm:text-lg md:text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono truncate">{formatRupiah(roiResult.netProfit)}</div>
                                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">{t("landing.perYearNet", "Per tahun bersih")}</div>
                                </div>
                                <div className="p-2.5 sm:p-3 rounded-xl bg-slate-500/5 dark:bg-slate-800/40 border border-slate-500/10">
                                  <div className="text-[10px] sm:text-xs uppercase tracking-wider mb-0.5 font-bold text-slate-500 dark:text-slate-400 truncate">NPV ({discountRate}%)</div>
                                  <div className={`text-base sm:text-lg md:text-xl font-black font-mono truncate ${roiResult.npv >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {roiResult.npv >= 0 ? '+' : ''}{formatRupiah(roiResult.npv)}
                                  </div>
                                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">Net Present Value</div>
                                </div>
                                <div className="p-2.5 sm:p-3 rounded-xl bg-slate-500/5 dark:bg-slate-800/40 border border-slate-500/10">
                                  <div className="text-[10px] sm:text-xs uppercase tracking-wider mb-0.5 font-bold text-slate-500 dark:text-slate-400 truncate">IRR</div>
                                  <div className={`text-base sm:text-lg md:text-xl font-black font-mono ${roiResult.irr >= discountRate ? 'text-emerald-600 dark:text-emerald-400' : roiResult.irr >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {roiResult.irr.toFixed(2)}%
                                  </div>
                                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">Target WACC: {discountRate}%</div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Executive 4-Card Bento Matrix (Zero Redundancy, Mobile-First) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                          {/* Card 1: Estimasi ROI (Tahunan & Kumulatif) */}
                          <div
                            className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between backdrop-blur-md transition-all ${
                              roiResult.roi >= 10
                                ? isDark ? "bg-emerald-950/20 border-emerald-500/30" : "bg-emerald-50/60 border-emerald-200/80"
                                : isDark ? "bg-amber-950/20 border-amber-500/30" : "bg-amber-50/60 border-amber-200/80"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                                  {t('financial.estRoiTitle', 'Estimasi ROI')}
                                </span>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  {roiResult.roi >= 10 ? 'Menguntungkan' : 'Moderat'}
                                </span>
                              </div>
                              <div className="space-y-2 mt-3">
                                <div className="flex items-center justify-between border-b border-dashed border-slate-500/20 pb-2">
                                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{t('financial.roiAnnual', 'ROI Tahunan')}</span>
                                  <span className={`font-black font-mono text-base sm:text-lg ${roiResult.roi >= 10 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                                    {roiResult.roi.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex items-center justify-between pt-0.5">
                                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{t('financial.roiCumulativeDynamic', { years: projectionTenor })}</span>
                                  <span className="font-black font-mono text-base sm:text-lg text-emerald-600 dark:text-emerald-400">
                                    {roiResult.cumulativeRoi.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Card 2: Periode Pengembalian Modal (BEP) */}
                          <div
                            className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between backdrop-blur-md transition-all ${
                              isDark
                                ? "bg-slate-900/40 border-slate-700/50"
                                : "bg-white/80 border-slate-200/90 shadow-sm"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                                  {t("roiSimulator.paybackPeriod", "Periode Pengembalian Modal")} (BEP)
                                </span>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                  Tenor: {projectionTenor} Thn
                                </span>
                              </div>
                              <div className="space-y-2 mt-3">
                                <div className="flex items-center justify-between border-b border-dashed border-slate-500/20 pb-2">
                                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{t('financial.paybackSimple', 'Payback Sederhana')}</span>
                                  <span className="font-black font-mono text-sm sm:text-base text-slate-800 dark:text-slate-100">
                                    {roiResult.payback > 99 ? t('financial.statusNotRecovered', 'Belum Kembali') : `${roiResult.payback.toFixed(2)} Tahun`}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between pt-0.5">
                                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{t('financial.paybackDiscountedDynamic', { rate: discountRate })}</span>
                                  <span className={`font-black font-mono text-sm sm:text-base ${roiResult.discountedPayback <= projectionTenor ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                    {roiResult.discountedPayback > projectionTenor ? t('financial.statusNotRecovered', 'Belum Kembali') : `${roiResult.discountedPayback.toFixed(2)} Tahun`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Card 3: Status & Indeks Kelayakan */}
                          <div
                            className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between backdrop-blur-md transition-all ${
                              isDark
                                ? "bg-slate-900/40 border-slate-700/50"
                                : "bg-white/80 border-slate-200/90 shadow-sm"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                                  {t("roiSimulator.feasibility", "Status Kelayakan")}
                                </span>
                              </div>
                              <div className="mt-3 space-y-2.5">
                                <div
                                  className={`px-3 py-2 rounded-xl text-center font-bold text-xs sm:text-sm flex items-center justify-center gap-2 ${
                                    (roiResult.npv > 0 && roiResult.irr >= discountRate)
                                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                                      : !(roiResult.npv > 0 && roiResult.irr >= discountRate) && !(roiResult.netProfit <= 0 || roiResult.npv < 0 || roiResult.irr < 0)
                                        ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30"
                                        : "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30"
                                  }`}
                                >
                                  <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                                  <span>
                                    {roiResult.status === "FEASIBLE"
                                      ? t("financial.statusFeasible", "Sangat Layak & Feasible")
                                      : roiResult.status === "NOT_FEASIBLE"
                                        ? t("financial.statusNotFeasible", "Tidak Layak (Risiko Tinggi)")
                                        : t("financial.statusModerate", "Zona Moderat / Cukup Layak")}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center font-medium">
                                  Berdasarkan tolok ukur suku bunga & inflasi regional
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Card 4: Nilai Tambah & Imbal Hasil (NPV & IRR) */}
                          <div
                            className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between backdrop-blur-md transition-all ${
                              isDark
                                ? "bg-indigo-950/20 border-indigo-500/30"
                                : "bg-indigo-50/60 border-indigo-200/80 shadow-sm"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-indigo-300" : "text-indigo-900"}`}>
                                  {t('financial.valueReturn', 'Nilai Tambah & Return')}
                                </span>
                              </div>
                              <div className="space-y-2 mt-3">
                                <div className="flex items-center justify-between border-b border-dashed border-indigo-500/20 pb-2">
                                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">NPV ({discountRate}%)</span>
                                  <span className={`font-black font-mono text-sm sm:text-base truncate ${roiResult.npv >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {roiResult.npv >= 0 ? "+" : ""}{formatRupiah(roiResult.npv)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between pt-0.5">
                                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Internal Rate (IRR)</span>
                                  <span className={`font-black font-mono text-sm sm:text-base ${roiResult.irr >= 10 ? "text-emerald-600 dark:text-emerald-400" : roiResult.irr >= 0 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}>
                                    {roiResult.irr.toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Analisis Sensitivitas NPV (Lebar Penuh) */}
                          <div className="col-span-full mt-2">
                            <div
                              className={`p-4 sm:p-5 rounded-2xl border backdrop-blur-xl transition-all ${
                                isDark
                                  ? "bg-slate-900/40 border-slate-700/50 hover:border-slate-600"
                                  : "bg-white/80 border-slate-200/90 shadow-sm hover:border-slate-300"
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-4">
                                <div>
                                  <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    {t('financial.sensitivityTitle', 'Uji Sensitivitas NPV')}
                                  </h4>
                                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{t('financial.sensitivitySubtitle', 'Ketahanan terhadap variasi inflasi dan biaya')}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    Real-time ⚡
                                  </span>
                                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{t("financial.unitMillionRp", "Satuan: Juta Rp")}</span>
                                </div>
                              </div>

                              {sensitivityChartData.length > 0 && (() => {
                                const baseline = sensitivityChartData[Math.floor(sensitivityChartData.length / 2)]?.['Baseline'] ?? 0;
                                const highInfl = sensitivityChartData[Math.floor(sensitivityChartData.length / 2)]?.['Inflasi Tinggi (+5%)'] ?? 0;
                                const noInfl   = sensitivityChartData[Math.floor(sensitivityChartData.length / 2)]?.['Tanpa Inflasi (0%)'] ?? 0;
                                const maxAbs = Math.max(Math.abs(baseline), Math.abs(highInfl), Math.abs(noInfl), 1);

                                const rows = [
                                  { label: `${t("financial.baseline", "Baseline")} (${inflationRate}%)`, value: baseline, color: '#059669' },
                                  { label: t("financial.highInflation", "Inflasi tinggi (+5%)"),          value: highInfl, color: '#e11d48' },
                                  { label: t("financial.noInflation", "Tanpa inflasi (0%)"),            value: noInfl,   color: '#10b981' },
                                ];
                                return (
                                  <div className="flex flex-col gap-2.5">
                                    {rows.map((row, i) => {
                                      const rawPct = Math.min(100, Math.abs(row.value) / maxAbs * 100);
                                      const pct = typeof rawPct === 'number' && !isNaN(rawPct) ? rawPct : 0;
                                      return (
                                        <div key={i} className="flex items-center gap-2 sm:gap-3">
                                          <span className="text-[11px] font-medium w-28 sm:w-36 shrink-0 text-slate-700 dark:text-slate-300 truncate">{row.label}</span>
                                          <div className="flex-1 h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                                            <div className="h-full rounded-full transition-all duration-700"
                                                 style={{ width: `${pct}%`, background: row.color, transitionDelay: `${i * 100}ms` }} />
                                          </div>
                                          <span className={`text-[11px] font-bold font-mono w-20 text-right shrink-0 ${row.value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                            {row.value >= 0 ? '+' : ''}{row.value.toLocaleString('id-ID')}Jt
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()}

                              {/* Keterangan Analisis */}
                              <div className="mt-3.5 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
                                <p className="font-bold text-indigo-600 dark:text-indigo-400">
                                  💡 {t('financial.interpretationTitle', 'Interpretasi Sensitivitas Finansial')}
                                </p>
                                <ul className="list-disc pl-4 space-y-1 text-[10.5px]">
                                  <li><span>{t('financial.interpretationInterest')}</span></li>
                                  <li><span>{t('financial.interpretationInflation')}</span></li>
                                </ul>
                              </div>
                            </div>
                          </div>

                          {/* Tombol AI & Analisis Lanjutan (Mobile Optimized) */}
                          <div className="col-span-full mt-3 pt-4 border-t border-slate-500/10 flex flex-col gap-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <motion.button whileTap={{ scale: 0.97 }}
                                whileHover={{ scale: 1.01 }}
                                onClick={() => setIsRoiAiModalOpen(true)}
                                className="w-full min-h-[48px] py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
                              >
                                <Bot className="w-4.5 h-4.5" />
                                <span>{t("roiSimulator.askAi", "Tanya AI Strategis")} ✨</span>
                              </motion.button>

                              <motion.button whileTap={{ scale: 0.97 }}
                                whileHover={{ scale: 1.01 }}
                                onClick={() => setIsSpatialAiModalOpen(true)}
                                className="w-full min-h-[48px] py-3.5 px-5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs sm:text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-teal-600/20"
                              >
                                <Compass className="w-4.5 h-4.5" />
                                <span>{t('roiSimulator.analyzePotential', 'Analisis Spasial GIS')} 🗺️</span>
                              </motion.button>
                            </div>

                            {/* Regional Analysis Action Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                              <button
                                type="button"
                                onClick={() => setIsIproPitchModalOpen(true)}
                                className="min-h-[44px] py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-900/20 transition flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30"
                              >
                                <Building2 size={16} className="text-emerald-200 shrink-0" />
                                <span className="truncate">Pitch Deck IPRO BKPM</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setIsRtrwModalOpen(true)}
                                className="min-h-[44px] py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span className="truncate">{t('rtrwZoning.button', 'Zona Spasial RTRW')}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setIsIncentiveModalOpen(true)}
                                className="min-h-[44px] py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <Award size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                                <span className="truncate">{t('incentiveCalculator.button', 'Insentif Perda')}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setIsProximityModalOpen(true)}
                                className="min-h-[44px] py-2.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <Navigation size={16} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                                <span className="truncate">{t('proximityMatrix.button', 'Supply Chain')}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>


        
                        {/* CTA LOGIN INVESTOR POST ROI SIMULATOR */}
        <div className="container max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 mb-16">
          <div className="flex justify-center w-full">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                handleRequestFullscreen();
                navigate("/login?role=investor");
              }}
              className="px-8 py-4 min-h-[44px] rounded-2xl font-bold uppercase tracking-wider border backdrop-blur-md transition-all duration-500 ease-out flex items-center justify-center gap-2.5 group bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 border-emerald-400/40"
            >
              <UserPlus size={19} className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12 text-amber-300" />
              <span>{t("landing.loginInvestor", "Login Investor")}</span>
            </motion.button>
          </div>
        </div>

        {/* Kisah Sukses Investor */}
        <TestimonialSection isDark={isDark} />

        {/* Akuntabilitas Kinerja */}
        <section className={`relative py-16 sm:py-24 border-t ${isDark ? "bg-[#050A14] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
          <div className="container mx-auto px-2 sm:px-4 lg:px-6 relative z-10 max-w-4xl">
            <div className="text-center mb-10">
              <span className={`inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-full text-xs font-bold uppercase tracking-wider mb-4 border ${isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                <Activity size={14} /> {t("performance.tag", "Akuntabilitas Kinerja Pemkab Luwu")}
              </span>
              <h3 className={`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>
                {t("performance.title", "Akuntabilitas Kinerja DPMPTSP Kabupaten Luwu")}
              </h3>
              <p className={`text-xs sm:text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {t("performance.subtitle", "Laporan transparan capaian IKM serta standar tingkat layanan (SLA) perizinan terpadu.")}
              </p>
            </div>
            
            <div className={`rounded-3xl border overflow-hidden ${isDark ? "bg-slate-900/50 border-slate-700/60" : "bg-white border-slate-200 shadow-sm"}`}>
              <div className="p-6 sm:p-8 flex items-center gap-4 border-b border-slate-200 dark:border-slate-700/60">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h4 className={`text-lg sm:text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{t("performance.title", "Indikator Layanan DPMPTSP")}</h4>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{t("performance.subtitle", "SLA & Kepuasan Publik Real-time")}</p>
                </div>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {[
                  { title: t("performance.ikmTitle", "Indeks Kepuasan Masyarakat"), desc: t("performance.ikmDesc", "Survei Kepuasan Publik Sesuai Permenpan RB") },
                  { title: t("performance.slaTitle", "SLA Penerbitan NIB/Izin"), desc: t("performance.slaDesc", "Pemrosesan izin risiko rendah secara instan") },
                  { title: t("performance.spatialTitle", "Akurasi Verifikasi Tata Ruang"), desc: t("performance.spatialDesc", "Kesesuaian plotting sistem dengan RT-RW") }
                ].map((item, idx) => (
                  <div key={idx} className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20">
                    <div>
                      <h5 className={`font-bold text-sm sm:text-base mb-1 ${isDark ? "text-slate-200" : "text-slate-800"}`}>{item.title}</h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                    </div>
                    <div className="flex flex-col items-start sm:items-end gap-2">
                      <span className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">{t("performance.noDataAvailable", "Belum ada data tersedia")}</span>
                      <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${isDark ? "bg-slate-800 text-slate-400 border border-slate-700" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>{t("performance.noDataBadge", "Belum Ada Data")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Ekosistem DPMPTSP */}
        <section className={`relative py-16 sm:py-24 ${isDark ? "bg-slate-950" : "bg-white"}`}>
          <div className="container mx-auto px-2 sm:px-4 lg:px-6 relative z-10 max-w-6xl">
            <div className="text-center mb-16">
              <h3 className={`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>
                {t("ecosystem.title", "Ekosistem DPMPTSP")}
              </h3>
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                {t("ecosystem.subtitle", "Sinergi Layanan Terpadu 4 Bidang Strategis")}
              </p>
            </div>
            
            <div className="relative">
              {/* Connecting Line */}
              <div className="hidden md:block absolute top-10 left-[12%] right-[12%] h-[2px] bg-slate-200 dark:bg-slate-800 z-0" />
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                {[
                  { icon: Megaphone, title: t("ecosystem.promotionTitle", "Bidang Promosi"), desc: t("ecosystem.promotionDesc", "Penjaringan & Verifikasi Minat (LoI)"), color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20" },
                  { icon: ShieldCheck, title: t("ecosystem.dalakTitle", "Bidang Dalak"), desc: t("ecosystem.dalakDesc", "Kawal Site Visit & Mediasi Lahan"), color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20" },
                  { icon: Stamp, title: t("ecosystem.licensingTitle", "Bidang Perizinan"), desc: t("ecosystem.licensingDesc", "Eksekusi Legalitas & OSS-RBA"), color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20" },
                  { icon: BarChart3, title: t("ecosystem.dataTitle", "Bidang Data"), desc: t("ecosystem.dataDesc", "Pusat Komando & Dashboard Eksekutif"), color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20" }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center group">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-lg ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"} relative z-10`}>
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${item.bg} ${item.color}`}>
                        <item.icon size={24} />
                      </div>
                    </div>
                    <h5 className={`font-bold text-sm sm:text-base mb-1.5 ${isDark ? "text-slate-200" : "text-slate-800"}`}>{item.title}</h5>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Widget Prakiraan Cuaca Wilayah Luwu (Tepat Diatas Footer) */}
        <section id="weather-section" className={`relative py-8 sm:py-10 border-t ${isDark ? "bg-[#070c17] border-slate-800/80" : "bg-slate-50/70 border-slate-200/80"}`}>
          <div className="container mx-auto px-3 sm:px-6 max-w-4xl flex flex-col items-center justify-center">
            <div className="w-full max-w-2xl">
              <WeatherWidget />
            </div>
          </div>
        </section>

        {/* BURSA KOMODITAS - LIVE MARKET TICKER SECTION (Elegant Bottom Page Section) */}
        <section id="bursa-komoditas-section" className={`relative py-6 border-t ${isDark ? "bg-[#060a13] border-slate-800/80" : "bg-slate-100/50 border-slate-200/80"}`}>
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex flex-col items-center mb-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-[#00FF99] border border-emerald-500/20 text-[10px] font-bold tracking-wider uppercase font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Bursa Komoditas Luwu
              </div>
            </div>
            <div className="w-full flex justify-center py-1 bg-white/50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/30 dark:border-white/5 backdrop-blur-sm shadow-xs">
              <LiveMarketTicker
                isDark={isDark}
                onSelectCommodity={handleSelectCommodityFromTicker}
                onSimulateRoi={() => scrollToSection("analytics-section")}
              />
            </div>
          </div>
        </section>

        {/* Footer Minimalis */}
        <footer className={`relative border-t pt-6 pb-20 sm:pt-10 sm:pb-12 ${isDark ? "bg-[#050A14] border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="container mx-auto px-2 sm:px-4 lg:px-6 relative">
            {/* Scroll to Top Button */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={`absolute right-4 sm:right-6 lg:right-8 -top-14 w-10 h-10 rounded-full flex items-center justify-center shadow-lg border transition-all hover:-translate-y-1 ${isDark ? "bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700 hover:border-emerald-500/50" : "bg-white border-slate-200 text-emerald-600 hover:bg-emerald-50"}`}
              aria-label={t("footer.backToTop", "Kembali ke atas")}
            >
              <ArrowUp className="w-5 h-5" />
            </button>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-4 sm:mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <img src={LUWU_LOGO_BASE64} alt="Logo Resmi Kabupaten Luwu" className="w-6 h-6 object-contain" />
                </div>
                <div>
                  <h3 className={`font-bold text-lg leading-tight tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>InvestLuwu Hub</h3>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{t("footer.pemkabLuwu", "Pemerintah Kabupaten Luwu")}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                {[
                  { name: t('nav.home', 'Beranda'), icon: Home, action: () => scrollToSection("hero-section") },
                  { name: t('nav.potensiRegional', 'Potensi Regional'), icon: Map, action: () => scrollToSection("potensi-section") },
                  { 
                    name: 'Portal MPP', 
                    icon: Building2, 
                    action: () => {
                      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                      navigate("/mpp");
                    } 
                  },
                  { name: t('nav.interactiveDashboard', 'Dashboard Interaktif'), icon: BarChart2, action: () => scrollToSection("hero-section") }
                ].map((link) => {
                  const IconComponent = link.icon;
                  return (
                    <button 
                      key={link.name} 
                      onClick={link.action}
                      className={`flex items-center gap-1.5 text-[11px] font-semibold hover:text-emerald-500 transition-colors cursor-pointer ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                      {link.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="pt-4 sm:pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 text-[10px] font-medium text-slate-500">
              <p>{t("footer.copyright", "© 2026 Pemerintah Kabupaten Luwu. Hak Cipta Dilindungi Undang-Undang.")}</p>
              <p className="font-mono">{t("footer.version", "Versi 2.0.1 (Precision Engine)")}</p>
            </div>
          </div>
        </footer>
      </div>

      {/* AI Feasibility & Spatial Buffer Modals */}
      <AnimatePresence>
        {isRoiAiModalOpen && (() => {
          const simContext = getSimulationContext();
          return (
            <RoiAiAnalysisModal
              isOpen={isRoiAiModalOpen}
              onClose={() => setIsRoiAiModalOpen(false)}
              investmentName={simContext.name}
              sector={simContext.sector}
              capex={simContext.capex}
              revenue={simContext.asumsiPendapatan}
              opex={simContext.opex}
              paybackPeriod={simContext.bep}
              irr={simContext.irr}
              npv={simContext.npv}
              discountRate={discountRate}
              isDarkMode={isDark}
              isUsingOSS={simContext.isUsingOSS}
            />
          );
        })()}
      </AnimatePresence>

      <AnimatePresence>
        {isSpatialAiModalOpen && (
          <SpatialBufferAiModal
            isOpen={isSpatialAiModalOpen}
            onClose={() => setIsSpatialAiModalOpen(false)}
            districts={districts}
            villages={villages}
            onFocusCoordinate={(lat, lng) => {
              setIsSpatialAiModalOpen(false);
              if ((window as any).globalLuwuMapInstance) {
                (window as any).globalLuwuMapInstance.flyTo({
                  center: [lng, lat],
                  zoom: 13,
                  essential: true
                });
              }
            }}
            isDarkMode={isDark}
            selectedInvestment={investments.find(inv => inv.id === selectedInvestmentId) || null}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isRtrwModalOpen && (
          <RtrwZoningCheckerModal
            isOpen={isRtrwModalOpen}
            onClose={() => setIsRtrwModalOpen(false)}
            selectedInvestment={investments.find(inv => inv.id === selectedInvestmentId) || null}
            investments={investments}
            isDark={isDark}
            simulationContext={getSimulationContext()}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isIncentiveModalOpen && (
          <IncentiveCalculatorModal
            isOpen={isIncentiveModalOpen}
            onClose={() => setIsIncentiveModalOpen(false)}
            selectedInvestment={investments.find(inv => inv.id === selectedInvestmentId) || null}
            isDark={isDark}
            simulationContext={getSimulationContext()}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProximityModalOpen && (
          <ProximityDistanceMatrixModal
            isOpen={isProximityModalOpen}
            onClose={() => setIsProximityModalOpen(false)}
            selectedInvestment={investments.find(inv => inv.id === selectedInvestmentId) || null}
            investments={investments}
            isDark={isDark}
            simulationContext={getSimulationContext()}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isIproPitchModalOpen && (
          <IproPitchDeckModal
            isOpen={isIproPitchModalOpen}
            onClose={() => {
              setIsIproPitchModalOpen(false);
              setSelectedIproForModal(null);
            }}
            investment={(() => {
              if (selectedIproForModal) return selectedIproForModal;
              const selectedInv = investments.find(inv => inv.id === selectedInvestmentId);
              const simCtx = getSimulationContext();
              if (selectedInv) return selectedInv;
              if (simCtx) {
                return {
                  id: "SIM-POTENSI-LUWU",
                  name: `Proyek Potensi Investasi Sektor ${simCtx.sector || 'Unggulan'}`,
                  sector: simCtx.sector || "PERTANIAN",
                  districtId: "Belopa",
                  investmentValue: simCtx.capex || 10000000000,
                  landStatus: "HGU / Hak Pakai Pemkab Luwu",
                  areaHa: 15,
                  polaRuang: "Kawasan Peruntukan Industri / Agropolitan RTRW",
                  suitabilityScore: 94.5,
                  latitude: -3.27301,
                  longitude: 120.26564,
                  financials: [{
                    capex: simCtx.capex || 10000000000,
                    opex: simCtx.opex || 1200000000,
                    revenue_projection: simCtx.asumsiPendapatan || 3500000000,
                    net_profit: (simCtx.asumsiPendapatan || 3500000000) - (simCtx.opex || 1200000000),
                    irr: simCtx.irr || 18.5,
                    payback_period: simCtx.bep || 3.8,
                    npv: simCtx.npv || 6500000000,
                    roi: simCtx.roi || 23.0
                  }]
                } as any;
              }
              return investments[0] || null;
            })()}
            district={districts.find(d => d.id === ((selectedIproForModal || investments.find(inv => inv.id === selectedInvestmentId))?.districtId)) || null}
            isDarkMode={isDark}
          />
        )}
      </AnimatePresence>

      {/* FAST-TRACK INVESTOR CONSULTATION MODAL (DPMPTSP KABUPATEN LUWU) */}
      <AnimatePresence>
        {isFastTrackConsultationOpen && (
          <FastTrackConsultationModal
            isOpen={isFastTrackConsultationOpen}
            onClose={() => {
              setIsFastTrackConsultationOpen(false);
              setSelectedInvestmentForConsultation(null);
            }}
            selectedInvestment={selectedInvestmentForConsultation}
            isDarkMode={isDark}
          />
        )}
      </AnimatePresence>


      {/* Android Native-Style Bottom Navigation Dock for Landing Page */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl border-t border-slate-200/80 dark:border-white/10 px-3 py-1.5 flex items-center justify-around shadow-2xl shadow-emerald-950/20 pb-[calc(env(safe-area-inset-bottom,0px)+6px)]">
        <button onClick={() => document.getElementById('hero-section')?.scrollIntoView({ behavior: 'smooth' })} className="flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 active:text-emerald-500 min-h-[48px] min-w-[50px] transition-colors">
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold font-sans">{t("nav.home", "Beranda")}</span>
        </button>

        <button onClick={() => document.getElementById('potensi-section')?.scrollIntoView({ behavior: 'smooth' })} className="flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 active:text-emerald-500 min-h-[48px] min-w-[50px] transition-colors">
          <Map className="w-5 h-5" />
          <span className="text-[10px] font-semibold font-sans">{t("nav.potensi", "Potensi")}</span>
        </button>

        {/* Elevated Center Action: Scroll To Top */}
        <div className="relative -top-4 flex flex-col items-center">
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="relative flex items-center justify-center"
          >
            <div className="absolute -inset-1 rounded-full bg-emerald-400/30 blur-sm pointer-events-none" />
            <motion.button 
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-tr from-[#00FF99] via-emerald-400 to-teal-300 text-white dark:text-[#000B14] flex items-center justify-center shadow-[0_0_25px_rgba(0,255,153,0.6)] border-[3px] border-white dark:border-[#000E1A] active:brightness-110 transition-transform cursor-pointer"
              title={t("footer.backToTop", "Ke Atas")}
            >
              <ArrowUp className="w-6 h-6" />
            </motion.button>
          </motion.div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-sans mt-1 tracking-wide">
            {t("nav.top", "Top")}
          </span>
        </div>

        <button onClick={() => document.getElementById('infrastruktur-section')?.scrollIntoView({ behavior: 'smooth' })} className="flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 active:text-emerald-500 min-h-[48px] min-w-[50px] transition-colors">
          <HardDrive className="w-5 h-5" />
          <span className="text-[10px] font-semibold font-sans">{t("nav.infras", "Infras")}</span>
        </button>

        <button onClick={() => document.getElementById('analytics-section')?.scrollIntoView({ behavior: 'smooth' })} className="flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 active:text-emerald-500 min-h-[48px] min-w-[50px] transition-colors">
          <BarChart2 className="w-5 h-5" />
          <span className="text-[10px] font-semibold font-sans">{t("nav.data", "Data")}</span>
        </button>
      </nav>

      {/* GIS Spatial Engine Transition Loader */}
      <AnimatePresence>
        {isGisBooting && (
          <GisTransitionLoader onComplete={handleGisComplete} />
        )}
      </AnimatePresence>
    </div>
  );
}
