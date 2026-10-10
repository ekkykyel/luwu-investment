import { CompactWeatherWidget } from "./CompactWeatherWidget";
import { WeatherWidget } from "./WeatherWidget";
import { Footer } from "./Footer";
import LanguageToggle from "./LanguageToggle";
import { LUWU_LOGO_BASE64 } from "@/lib/logoBase64.js";
import { useNavigate } from "react-router-dom";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { isMobileOrAndroidDevice, isAndroidDevice } from "../hooks/useDeviceAutomation";
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
  ChevronLeft,
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
  Pause,
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
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { Role, Investment, District, SektorInvestasi } from "../types";
import { formatRupiahSingkat, formatRupiahKompak } from "../lib/formatters";
import { OssRoiSimulatorInputs } from "./OssRoiSimulatorInputs";
import GisTransitionLoader from "./GisTransitionLoader";
import { supabase, safeFetchLayerData } from "../lib/supabaseClient";
import { PreLaunchBanner } from "./common/PreLaunchBanner";
import { TopographicContourOverlay } from "./common/TopographicContourOverlay";
import RoiAiAnalysisModal from "./RoiAiAnalysisModal";
import SpatialBufferAiModal from "./SpatialBufferAiModal";
import LuwuInvestmentAiModal from "./LuwuInvestmentAiModal";
import RtrwZoningCheckerModal from "./RtrwZoningCheckerModal";
import IncentiveCalculatorModal from "./IncentiveCalculatorModal";
import ProximityDistanceMatrixModal from "./ProximityDistanceMatrixModal";
import IproPitchDeckModal from "./IproPitchDeckModal";
import { FastTrackConsultationModal } from "./FastTrackConsultationModal";
import SmartMatrixFilterPanel, { SmartFilterState } from "./SmartMatrixFilterPanel";
import InvestmentReadinessPillars from "./InvestmentReadinessPillars";
import SpatialRdtrBanner from "./SpatialRdtrBanner";
import FinancingKpbuSection from "./FinancingKpbuSection";
import LocalPartnershipSection from "./LocalPartnershipSection";

import TickerMarquee from "./TickerMarquee";
import TestimonialSection from "./TestimonialSection";
import { AnalitikSpasialSection } from "./AnalitikSpasialSection";
import GisErrorBoundary from "./GisErrorBoundary";
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion, type Variants } from "motion/react";
import { HeroStatCounter } from "./common/HeroStatCounter";
import LazyImage from "./LazyImage";
import { getImageUrl, handleImageError } from "../utils/imageFallbacks";
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
import { center as turfCenter } from "@turf/turf";
import { useTranslation } from "react-i18next";

import { LiveMarketTicker, CommodityItem } from "./LiveMarketTicker";
import { MppVisionModal } from "./MppVisionModal";
import { TiltCard } from "./common/TiltCard";
import { SpotlightCard } from "./common/SpotlightCard";
import { MagneticButton } from "./common/MagneticButton";
import { SonarRadarPulse } from "./common/SonarRadarPulse";
import { CountUpNumber, Reveal } from "../lib/motion";

// --- Executive CountUp Animation Helper using Shared Motion System ---
function CountUp({
  end,
  suffix = "",
  delay = 0,
}: {
  end: number;
  suffix?: string;
  delay?: number;
}) {
  return <CountUpNumber end={end} suffix={suffix} delay={delay} />;
}

const AnimatedNumberValue: React.FC<{
  value: number;
  formatFn?: (val: number) => string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}> = ({
  value,
  formatFn,
  decimals = 2,
  prefix = "",
  suffix = "",
  duration = 500,
  className = "",
}) => {
  const [displayVal, setDisplayVal] = useState(value);
  const prevValRef = useRef(value);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayVal(value);
      prevValRef.current = value;
      return;
    }

    const startVal = prevValRef.current;
    const endVal = value;
    if (startVal === endVal) {
      setDisplayVal(endVal);
      return;
    }

    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = startVal + (endVal - startVal) * ease;
      setDisplayVal(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        setDisplayVal(endVal);
        prevValRef.current = endVal;
      }
    };

    animRef.current = requestAnimationFrame(step);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [value, duration]);

  const formatted = formatFn 
    ? formatFn(displayVal) 
    : `${prefix}${displayVal.toFixed(decimals)}${suffix}`;

  return <span className={className}>{formatted}</span>;
};

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

const DEFAULT_INVESTMENT_HERO_SLIDES = [
  "/placeholder-hero.jpg",
  "/placeholder.jpg",
  "/assets/images/default-hero.svg"
];

// Staggered Entrance Variants for Hero Section (High-Performance GPU-Accelerated)
const heroContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const heroFadeInUpItemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.48,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const heroTrustBadgeContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.06,
    },
  },
};

const heroTrustBadgeItemVariants: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

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
    case 'Pertanian': return { border: 'hover:border-emerald-400/60', glow: 'hover:shadow-black/25', badgeBg: 'font-semibold bg-emerald-100 dark:bg-emerald-400/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-400/30 backdrop-blur-sm shadow-sm', progress: 'bg-gradient-to-r from-emerald-400 to-teal-500' };
    case 'Pariwisata': return { border: 'hover:border-teal-400/60', glow: 'hover:shadow-black/25', badgeBg: 'font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 backdrop-blur-sm shadow-sm', progress: 'bg-gradient-to-r from-teal-500 to-emerald-500' };
    case 'Pertambangan': return { border: 'hover:border-[#C9A24B]/60', glow: 'hover:shadow-black/25', badgeBg: 'font-semibold bg-[#C9A24B]/10 text-[#A07A28] dark:text-[#C9A24B] border border-[#A07A28]/30 dark:border-[rgba(201,162,75,0.30)] backdrop-blur-sm shadow-sm', progress: 'bg-gradient-to-r from-[#0F6B4F] via-[#1F9D74] to-[#C9A24B]' };
    default: return { border: 'hover:border-emerald-400/60', glow: 'hover:shadow-black/25', badgeBg: 'font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 backdrop-blur-sm shadow-sm', progress: 'bg-gradient-to-r from-emerald-500 to-teal-500' };
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
  const shouldReduceMotion = useReducedMotion();
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
  const [heroImages, setHeroImages] = useState<string[]>(DEFAULT_INVESTMENT_HERO_SLIDES);
  const [staffImageLeft, setStaffImageLeft] = useState<string | null>(null);
  const [staffImageRight, setStaffImageRight] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Mobile Executive Live Stats Carousel State & Auto-Slide
  const statsScrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeStatIndex, setActiveStatIndex] = useState(0);
  const [isUserInteractingStats, setIsUserInteractingStats] = useState(false);
  const statsResumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToStatCard = (index: number) => {
    const container = statsScrollContainerRef.current;
    if (!container) return;
    const cards = Array.from(container.children).filter(
      (el) => el.tagName === "DIV"
    ) as HTMLElement[];
    if (cards && cards[index]) {
      const card = cards[index];
      const targetScrollLeft = card.offsetLeft - (container.clientWidth - card.clientWidth) / 2;
      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: "smooth",
      });
      setActiveStatIndex(index);
    }
  };

  const handleStatsScroll = () => {
    const container = statsScrollContainerRef.current;
    if (!container) return;
    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    const cards = Array.from(container.children).filter(
      (el) => el.tagName === "DIV"
    ) as HTMLElement[];
    let closestIndex = 0;
    let minDiff = Infinity;
    cards.forEach((card, idx) => {
      const cardCenter = card.offsetLeft + card.clientWidth / 2;
      const diff = Math.abs(containerCenter - cardCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = idx;
      }
    });
    if (closestIndex !== activeStatIndex && closestIndex >= 0 && closestIndex < 4) {
      setActiveStatIndex(closestIndex);
    }
  };

  useEffect(() => {
    if (isUserInteractingStats) return;
    const timer = setInterval(() => {
      if (typeof window !== "undefined" && window.innerWidth < 640) {
        setActiveStatIndex((prev) => {
          const next = (prev + 1) % 4;
          scrollToStatCard(next);
          return next;
        });
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [isUserInteractingStats]);

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Mobile IPRO Opportunities Slider State & Navigation
  const iproScrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIproIndex, setActiveIproIndex] = useState(0);

  const scrollToIproCard = (index: number) => {
    const container = iproScrollContainerRef.current;
    if (!container) return;
    const cards = Array.from(container.children).filter(
      (el) => el.getAttribute('data-ipro-card') === 'true' || (el as HTMLElement).classList.contains('snap-center')
    ) as HTMLElement[];
    if (cards && cards[index]) {
      const card = cards[index];
      const targetScrollLeft = card.offsetLeft - (container.clientWidth - card.clientWidth) / 2;
      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: "smooth",
      });
      setActiveIproIndex(index);
    }
  };

  const handleIproScroll = () => {
    const container = iproScrollContainerRef.current;
    if (!container) return;
    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    const cards = Array.from(container.children).filter(
      (el) => el.getAttribute('data-ipro-card') === 'true' || (el as HTMLElement).classList.contains('snap-center')
    ) as HTMLElement[];
    let closestIndex = 0;
    let minDiff = Infinity;
    cards.forEach((card, idx) => {
      const cardCenter = card.offsetLeft + card.clientWidth / 2;
      const diff = Math.abs(containerCenter - cardCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = idx;
      }
    });
    if (closestIndex !== activeIproIndex && closestIndex >= 0) {
      setActiveIproIndex(closestIndex);
    }
  };
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
             const center = turfCenter(zonasiData[0].geom);
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
    if (!isAndroidDevice()) return;

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
        let data: any[] = [];
        try {
          const res = await fetch("/api/site-settings?keys=hero_slider_images,hero_image_url,staff_image_left,staff_image_right", {
            credentials: "same-origin",
            headers: { Accept: "application/json" }
          }).catch(() => null);
          if (res && res.ok) {
            data = await res.json().catch(() => []);
          }
        } catch {}

        if (!data || data.length === 0) {
          try {
            const { data: sbData } = await supabase
              .from("site_settings")
              .select("*")
              .in("setting_key", ["hero_slider_images", "hero_image_url", "staff_image_left", "staff_image_right"]);
            if (sbData && Array.isArray(sbData)) {
              data = sbData;
            }
          } catch {}
        }

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
                const validList = parsed.filter((url: any) => typeof url === 'string' && url.trim().length > 0);
                if (validList.length >= 2) {
                  setHeroImages(validList);
                  return;
                } else if (validList.length === 1) {
                  setHeroImages([validList[0], ...DEFAULT_INVESTMENT_HERO_SLIDES.filter((u) => u !== validList[0])]);
                  return;
                }
              }
            } catch (e) {}
          }
          const singleItem = data.find(
            (d: any) => d.setting_key === "hero_image_url",
          );
          if (singleItem && singleItem.setting_value && typeof singleItem.setting_value === 'string' && singleItem.setting_value.trim().length > 0) {
            setHeroImages([singleItem.setting_value, ...DEFAULT_INVESTMENT_HERO_SLIDES.filter((u) => u !== singleItem.setting_value)]);
          } else {
            setHeroImages(DEFAULT_INVESTMENT_HERO_SLIDES);
          }
        } else {
          setHeroImages(DEFAULT_INVESTMENT_HERO_SLIDES);
        }
      } catch (err) {
        setHeroImages(DEFAULT_INVESTMENT_HERO_SLIDES);
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
      }, 3500);
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
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDarkMode);
      localStorage.setItem('luwu_theme', isDarkMode ? 'dark' : 'light');
    }
    const metaTag = document.getElementById("theme-color-meta");
    if (metaTag) {
      metaTag.setAttribute("content", isDarkMode ? "#0b0f19" : "#ffffff");
    }
  }, [isDarkMode]);

  // Tema Dinamis (Institusional Warm Navy ~210°)
  const themeBg = isDark
    ? "bg-[#0A2238] text-slate-100"
    : "bg-white text-slate-900";
  const cardBg = isDark
    ? "bg-[#0F2D4A] border-white/[0.09] shadow-none"
    : "bg-white border-slate-200/80 shadow-sm";
  const textMuted = isDark ? "text-slate-400 font-medium" : "text-slate-600 font-medium";
  const textHighlight = isDark ? "text-sky-300 font-bold" : "text-sky-700 font-bold";
  const inputBg = isDark
    ? "bg-[#143755] border-white/[0.09] text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all duration-200 font-semibold"
    : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 transition-all duration-200 font-semibold";

  const handleToggleTheme = () => {
    const nextDark = !isDark;
    setLocalIsDark(nextDark);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', nextDark);
      localStorage.setItem('luwu_theme', nextDark ? 'dark' : 'light');
    }
    if (setIsDarkMode) {
      setIsDarkMode(nextDark);
    }
  };

  // --- 1. State for ROI Calculator ---
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<string>("");
  
  // --- New Interactive Landing Page States ---
  const [activeRoadmapStep, setActiveRoadmapStep] = useState<number>(0);
  const [checkedRequirements, setCheckedRequirements] = useState<Record<string, boolean>>({});
  const toggleRequirement = (stepIdx: number, reqIdx: number) => {
    const key = `${stepIdx}-${reqIdx}`;
    setCheckedRequirements((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };
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

  // Peluang Emas Luwu - Horizontal Slider State & Helpers
  const potensiSliderRef = useRef<HTMLDivElement>(null);
  const [activePotensiIndex, setActivePotensiIndex] = useState(0);
  const [isPotensiAutoPlay, setIsPotensiAutoPlay] = useState(true);

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
    hilirisasiOnly: false,
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

      // Hilirisasi Komoditas filter (Kementerian Investasi blueprint)
      if (smartFilterState.hilirisasiOnly) {
        const textToSearch = `${i.name || ""} ${i.sector || ""} ${i.subSector || ""} ${i.description || ""} ${i.deskripsi_singkat || ""}`.toLowerCase();
        const isHilirisasi =
          textToSearch.includes("hilirisasi") ||
          textToSearch.includes("sentra") ||
          textToSearch.includes("smelter") ||
          textToSearch.includes("olahan") ||
          textToSearch.includes("pengolahan") ||
          textToSearch.includes("kakao") ||
          textToSearch.includes("kopi") ||
          textToSearch.includes("pabrik") ||
          textToSearch.includes("industri");
        if (!isHilirisasi) return false;
      }

      return true;
    });
  }, [investments, smartFilterState]);

  const sortedInvestmentsList = useMemo(() => {
    return [...filteredInvestmentsList].sort((a, b) => {
      const aAI = Number(a.smartData?.aiScore || a.smartData?.ai_score || 0);
      const bAI = Number(b.smartData?.aiScore || b.smartData?.ai_score || 0);
      if (bAI !== aAI) return bAI - aAI;
      return (b.investmentValue || 0) - (a.investmentValue || 0);
    });
  }, [filteredInvestmentsList]);

  useEffect(() => {
    if (!isPotensiAutoPlay || sortedInvestmentsList.length <= 1) return;
    const interval = setInterval(() => {
      if (!potensiSliderRef.current) return;
      const container = potensiSliderRef.current;
      const cardWidth = container.firstElementChild?.clientWidth || 360;
      const gap = 20;
      const scrollStep = cardWidth + gap;

      if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 15) {
        container.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        container.scrollBy({ left: scrollStep, behavior: "smooth" });
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [isPotensiAutoPlay, sortedInvestmentsList.length]);

  const [potensiScrollLeft, setPotensiScrollLeft] = useState(0);
  const potensiRafRef = useRef<number | null>(null);

  const handlePotensiScroll = () => {
    if (!potensiSliderRef.current) return;
    if (potensiRafRef.current !== null) return;

    potensiRafRef.current = requestAnimationFrame(() => {
      potensiRafRef.current = null;
      if (!potensiSliderRef.current) return;
      const container = potensiSliderRef.current;
      setPotensiScrollLeft(container.scrollLeft);
      const cardWidth = (container.firstElementChild?.clientWidth || 360) + 20;
      const currentIndex = Math.round(container.scrollLeft / cardWidth);
      setActivePotensiIndex(Math.max(0, Math.min(currentIndex, sortedInvestmentsList.length - 1)));
    });
  };

  const scrollToPotensiSlide = (index: number) => {
    if (!potensiSliderRef.current) return;
    const container = potensiSliderRef.current;
    const cardWidth = (container.firstElementChild?.clientWidth || 360) + 20;
    container.scrollTo({ left: index * cardWidth, behavior: "smooth" });
    setActivePotensiIndex(index);
  };

  const handleNextPotensiSlide = () => {
    if (sortedInvestmentsList.length <= 1) return;
    const nextIdx = (activePotensiIndex + 1) % sortedInvestmentsList.length;
    scrollToPotensiSlide(nextIdx);
  };

  const handlePrevPotensiSlide = () => {
    if (sortedInvestmentsList.length <= 1) return;
    const prevIdx = activePotensiIndex === 0 ? sortedInvestmentsList.length - 1 : activePotensiIndex - 1;
    scrollToPotensiSlide(prevIdx);
  };

  const topIproInvestmentsList = useMemo(() => {
    return [...filteredInvestmentsList]
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
      .slice(0, 6);
  }, [filteredInvestmentsList]);

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
      const totalInvestment = cap;

      let rev = parseFloat(annualRevenue) || 0;
      if (rev <= 0) {
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
      }

      // Calculate Net Profit (Laba Bersih)
      const netProfit = (rev || 0) - (opx || 0);

      // Calculate ROI Percentage (prevent division by zero)
      const roiPercentage = totalInvestment > 0 
        ? ((netProfit / totalInvestment) * 100) 
        : 0;

      if (totalInvestment > 0 && rev > 0) {
        const roi = roiPercentage;
        const cumulativeRoi = ((netProfit * projectionTenor) / totalInvestment) * 100;
        
        const payback = netProfit > 0 ? totalInvestment / netProfit : 999;

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
            locale: i18n.language,
            investment_amount: context.capex || (context as any).investmentValue || 0,
            sector: context.sector,
            workforce_target: Math.max(25, Math.round((context.capex || 5000000000) / 150000000)),
            location: "Kabupaten Luwu",
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
    const el = document.getElementById(id);
    if (el) {
      const navOffset = window.innerWidth < 640 ? 72 : 88;
      const targetY = el.getBoundingClientRect().top + window.scrollY - navOffset;
      window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
    }
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
      color: "text-[#A07A28] dark:text-[#C9A24B]",
      gradient: "from-[#0F6B4F] via-[#1F9D74] to-[#C9A24B]",
      shadow: "shadow-black/25",
      ambientGlow: "bg-[#C9A24B]/20",
      borderGlow: "border-[rgba(201,162,75,0.40)]",
      railColor: "via-[#C9A24B]",
      activeBg: "bg-emerald-50 dark:bg-[#0B2A20] text-emerald-800 dark:text-[#F6F1E4] border-emerald-300 dark:border-[rgba(201,162,75,0.30)]",
      dotColor: "bg-[#C9A24B]",
      badgeClass: "bg-emerald-50 dark:bg-[#0B2A20] text-emerald-800 dark:text-[#C9A24B] border-emerald-300 dark:border-[rgba(201,162,75,0.30)]",
      legalBasis: "PP No. 5 Tahun 2021 tentang Perizinan Berusaha Berbasis Risiko",
      portalUrl: "https://oss.go.id",
      portalLabel: "Portal OSS-RBA BKPM",
      authorityCode: "BKPM RI",
      tag: "Tahap 1: Legalitas Usaha"
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
      color: "text-[#0F6B4F] dark:text-[#1F9D74]",
      gradient: "from-[#0F6B4F] via-[#1F9D74] to-[#0B533D]",
      shadow: "shadow-black/25",
      ambientGlow: "bg-[#1F9D74]/20",
      borderGlow: "border-[rgba(31,157,116,0.40)]",
      railColor: "via-[#1F9D74]",
      activeBg: "bg-emerald-50 dark:bg-[#0B2A20] text-emerald-800 dark:text-[#1F9D74] border-emerald-200 dark:border-[rgba(31,157,116,0.30)]",
      dotColor: "bg-[#1F9D74]",
      badgeClass: "bg-emerald-50 dark:bg-[#0B2A20] text-emerald-800 dark:text-[#1F9D74] border-emerald-200 dark:border-[rgba(31,157,116,0.20)]",
      legalBasis: "Perda Kab. Luwu No. 1 Tahun 2024 tentang RTRW Kabupaten Luwu",
      portalUrl: "https://gistaru.atrbpn.go.id/rtronline/",
      portalLabel: "GISTARU Spasial Luwu",
      authorityCode: "PUPR & DPMPTSP",
      tag: "Tahap 2: Kesesuaian Ruang"
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
      color: "text-[#0F6B4F] dark:text-[#1F9D74]",
      gradient: "from-[#0F6B4F] via-[#1F9D74] to-[#047857]",
      shadow: "shadow-black/25",
      ambientGlow: "bg-[#1F9D74]/20",
      borderGlow: "border-[rgba(31,157,116,0.40)]",
      railColor: "via-[#1F9D74]",
      activeBg: "bg-emerald-50 dark:bg-[#0B2A20] text-emerald-800 dark:text-[#1F9D74] border-emerald-200 dark:border-[rgba(31,157,116,0.30)]",
      dotColor: "bg-[#1F9D74]",
      badgeClass: "bg-emerald-50 dark:bg-[#0B2A20] text-emerald-800 dark:text-[#1F9D74] border-emerald-200 dark:border-[rgba(31,157,116,0.20)]",
      legalBasis: "PP No. 22 Tahun 2021 tentang Perlindungan & Pengelolaan Lingkungan",
      portalUrl: "https://amdalnet.menlhk.go.id",
      portalLabel: "Portal AMDALNET KLHK",
      authorityCode: "DLH Luwu",
      tag: "Tahap 3: AMDAL & Ekologi"
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
      color: "text-[#A07A28] dark:text-[#C9A24B]",
      gradient: "from-[#0B2A20] via-[#0F6B4F] to-[#C9A24B]",
      shadow: "shadow-black/25",
      ambientGlow: "bg-[#C9A24B]/20",
      borderGlow: "border-[rgba(201,162,75,0.40)]",
      railColor: "via-[#C9A24B]",
      activeBg: "bg-emerald-50 dark:bg-[#0B2A20] text-emerald-800 dark:text-[#C9A24B] border-emerald-300 dark:border-[rgba(201,162,75,0.30)]",
      dotColor: "bg-[#C9A24B]",
      badgeClass: "bg-emerald-50 dark:bg-[#0B2A20] text-emerald-800 dark:text-[#C9A24B] border-emerald-300 dark:border-[rgba(201,162,75,0.30)]",
      legalBasis: "PP No. 16 Tahun 2021 & Retribusi PBG Pemerintah Daerah Luwu",
      portalUrl: "https://simbg.pupr.go.id",
      portalLabel: "Portal SIMBG PUPR",
      authorityCode: "PUPR Luwu",
      tag: "Tahap 4: Fisik & Konstruksi"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`min-h-screen transition-colors duration-500 font-sans ${themeBg} overflow-x-hidden selection:bg-[#C9A24B]/30 pb-36 sm:pb-28 lg:pb-16`}
    >
      <AnimatePresence>
        {showLauncher && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-base p-4 text-white font-sans cursor-pointer overflow-hidden"
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
          className={`absolute top-[40%] -right-[20%] w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-20 ${isDark ? "bg-teal-900" : "bg-teal-200"}`}
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
        className={`fixed top-0 left-0 w-full z-[100] border-b transition-colors duration-500 ease-in-out ${
          isDark 
            ? "bg-[#0A2238]/95 border-white/[0.09] shadow-[0_4px_25px_rgba(0,0,0,0.35)]" 
            : "bg-white/95 border-slate-200/90 shadow-[0_4px_30px_rgba(15,23,42,0.08)]"
        }`}
        style={{ paddingTop: 'env(safe-area-inset-top)', backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
      >
        <div className="max-w-screen-2xl mx-auto px-2.5 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-1.5 sm:gap-4">
            {/* Logo area */}
            <div
              className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0 group"
              onClick={() => scrollToSection("hero-section")}
            >
              <div className="p-1.5 sm:p-2 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-emerald-600/20 border border-emerald-500/30 shadow-inner group-hover:scale-105 transition-all duration-300">
                <img
                  src={LUWU_LOGO_BASE64}
                  alt="Logo Kabupaten Luwu"
                  className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span
                    className={`font-black text-base sm:text-xl tracking-tight whitespace-nowrap block transition-colors duration-500 ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    InvestLuwu
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-emerald-500 to-teal-400 text-white text-[10px] sm:text-xs font-black tracking-wider uppercase shadow-xs">
                    Hub
                  </span>
                </div>
                <span className="hidden sm:block text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400/90 uppercase tracking-widest leading-none mt-0.5">
                  PEMKAB LUWU
                </span>
              </div>
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
                { name: "MPP", id: "mpp-showcase-section" },
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

            {/* Actions: Language Toggle, Theme Toggle, Primary Investor Action & Subtle Admin Shield */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto">
              {/* Tombol Fullscreen Layar Penuh (Desktop & Tablet only - hidden on mobile to prevent overflow) */}
              <motion.button whileTap={{ scale: 0.95 }}
                type="button"
                onClick={isFullscreen ? handleExitFullscreen : () => handleRequestFullscreen(true)}
                className={`hidden sm:flex w-10 h-10 min-w-[40px] min-h-[40px] rounded-full items-center justify-center transition-all duration-300 hover:scale-105 shrink-0 ${
                  isFullscreen
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                    : isDark
                      ? "bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700"
                      : "bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-200"
                }`}
                title={isFullscreen ? t("nav.exitFullscreen", "Keluar dari Layar Penuh") : t("nav.fullscreen", "Mode Layar Penuh (Fullscreen)")}
                aria-label="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </motion.button>

              <LanguageToggle isDarkHeader={isDark} isCircular={true} />
              
              <motion.button whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleToggleTheme}
                className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 shrink-0 ${
                  isDark
                    ? "bg-slate-800/80 text-yellow-400 hover:text-yellow-300 hover:bg-slate-700 hover:shadow-[0_0_15px_rgba(250,204,21,0.2)]"
                    : "bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-200"
                }`}
                aria-label="Toggle Theme"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </motion.button>

              {/* Primary Public CTA: Daftar Investor */}
              <motion.button whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => {
                  handleRequestFullscreen();
                  navigate("/register?tab=investor");
                }}
                className="hidden md:flex items-center gap-2 px-5 py-2.5 min-h-[40px] rounded-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md shadow-emerald-950/20 hover:-translate-y-0.5 border border-emerald-400/40 cursor-pointer"
              >
                <UserPlus size={15} className="text-emerald-100" />
                <span>{t("nav.roleInvestor", "Daftar Investor")}</span>
              </motion.button>

              {/* Subtle Admin & Staff Access Shield Icon (Replaced loud green button) */}
              <motion.button whileTap={{ scale: 0.95 }}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRequestFullscreen();
                  navigate("/login");
                }}
                className={`hidden sm:flex items-center justify-center w-10 h-10 min-w-[40px] min-h-[40px] rounded-full border transition-all duration-300 hover:scale-105 shrink-0 ${
                  isDark 
                    ? "border-slate-700 bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700" 
                    : "border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                }`}
                title={t("nav.loginAdmin", "Akses Petugas & Admin DPMPTSP")}
                aria-label="Login Admin"
              >
                <Shield size={17} />
              </motion.button>

              <motion.button whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => onOpenDiagnostic && onOpenDiagnostic()}
                className={`hidden lg:flex items-center justify-center w-10 h-10 min-w-[40px] min-h-[40px] rounded-full border transition-all duration-300 hover:scale-105 shrink-0 relative
                  ${isDark 
                    ? "border-slate-700 bg-slate-800/80 text-emerald-400 hover:bg-slate-700 hover:text-emerald-300 shadow-black/20" 
                    : "border-slate-200 bg-slate-100 text-emerald-700 hover:bg-slate-200"}`}
                title="Diagnostik Koneksi Supabase & Solusi"
                aria-label="Diagnostik Koneksi Supabase"
              >
                <ShieldCheck size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </motion.button>

              {/* Mobile Menu Toggle (Always fully visible with zero right cut-off) */}
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`md:hidden w-10 h-10 min-w-[40px] min-h-[40px] shrink-0 flex items-center justify-center rounded-full border transition-all duration-300 hover:scale-105 ${
                  isDark
                    ? "border-slate-800 bg-surface/80 text-slate-300 hover:text-white hover:bg-slate-800"
                    : "border-slate-200 bg-white/5 text-slate-300 border border-white/10 hover:bg-slate-200"
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
                  ? "bg-base/95 border-slate-800 text-white"
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
                  { name: "MPP", id: "mpp-showcase-section" },
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
                  
                  <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-surface/50 rounded-xl border border-slate-200 dark:border-slate-800">
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

      <div className="relative z-10 pt-20 sm:pt-24 md:pt-24 lg:pt-24">
        {/* 1. HERO SECTION WITH IMMERSIVE GRAND CANVAS BACKGROUND & INTEGRATED OVERLAYS */}
        <div
          id="hero-section"
          className="scroll-mt-24 sm:scroll-mt-28 w-full max-w-6xl mx-auto pb-2 px-2 sm:px-4 relative z-10"
        >
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
          `}</style>
          {!isDark && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
              <div style={{ animation: 'aurora1 12s ease-in-out infinite' }}
                   className="absolute w-[500px] h-[500px] -top-24 -left-24 rounded-full bg-emerald-400/20 blur-[100px]" />
              <div style={{ animation: 'aurora2 15s ease-in-out infinite' }}
                   className="absolute w-[600px] h-[400px] top-12 -right-36 rounded-full bg-teal-400/15 blur-[100px]" />
              <div style={{ animation: 'aurora3 18s ease-in-out infinite' }}
                   className="absolute w-[400px] h-[400px] -bottom-24 left-1/3 rounded-full bg-cyan-400/15 blur-[100px]" />
              <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent pointer-events-none"
                   style={{ animation: 'scanline 8s linear infinite' }} />
            </div>
          )}

          {/* Subtle architectural grid */}
          <div
            className={`absolute inset-0 z-0 pointer-events-none ${
              isDark
                ? "bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_50%,#000_55%,transparent_100%)]"
                : "bg-[linear-gradient(to_right,rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_50%,#000_60%,transparent_100%)]"
            }`}
          />

          {/* ───────────────────────────────────────────────────────────────────────────── */}
          {/* GRAND IMMERSIVE SHOWCASE HERO FRAME — PITA NAVY ELEGAN NUSANTARA (#0A2238) */}
          {/* ───────────────────────────────────────────────────────────────────────────── */}
          <div className="relative w-full min-h-[550px] sm:min-h-[615px] lg:min-h-[660px] flex flex-col justify-between rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/[0.08] ring-1 ring-slate-900/[0.04] dark:ring-white/[0.04] shadow-xl dark:shadow-2xl bg-white dark:bg-[#071727] group transition-colors duration-300">
            
            {/* Ultra-Soft Inner Photo Boundary Line (Garis Batas Foto di Dalam yang Sangat Tipis & Lembut) */}
            <div className="pointer-events-none absolute inset-[3px] sm:inset-1.5 rounded-[13px] sm:rounded-[20px] border border-white/65 dark:border-white/[0.12] ring-1 ring-inset ring-white/30 dark:ring-white/[0.05] z-30" />

            {/* 1. Background Investment Photo Slideshow with Parallax & Light Sweep (Pure Full Bleed without Dark Mask) */}
            <motion.div
              style={{ y: shouldReduceMotion ? 0 : yBg }}
              className="absolute inset-0 z-0 overflow-hidden transform-gpu pointer-events-none"
            >
              {heroImages.map((imgUrl, idx) => (
                <motion.img
                  key={`${imgUrl}-${idx}`}
                  src={imgUrl}
                  alt={`Potensi Investasi Luwu Slide ${idx + 1}`}
                  initial={false}
                  animate={{
                    opacity: idx === currentSlide ? 1 : 0,
                    scale: idx === currentSlide ? 1.025 : 1.0,
                  }}
                  transition={{
                    opacity: { duration: 0.5, ease: "easeInOut" },
                    scale: { duration: 6, ease: "easeOut" }
                  }}
                  onError={(e) => {
                    const target = e.currentTarget;
                    const fallback = DEFAULT_INVESTMENT_HERO_SLIDES[idx % DEFAULT_INVESTMENT_HERO_SLIDES.length];
                    if (target.src !== fallback) {
                      target.src = fallback;
                    }
                  }}
                  style={{ willChange: 'opacity, transform' }}
                  className="absolute inset-0 w-full h-full object-cover object-[center_top] origin-top pointer-events-none filter brightness-[0.98] contrast-[1.02]"
                  loading={idx === 0 ? "eager" : "lazy"}
                />
              ))}

              {/* Exotic Light Beam Sweep Effect */}
              <motion.div
                animate={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { x: ['-100%', '200%'] }
                }
                transition={{
                  duration: 8,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 5,
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 pointer-events-none transform-gpu"
              />

              {/* Pure Luminous White Smooth Vignette & Ultra-Soft White Edge Inset Glow */}
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_62%,rgba(255,255,255,0.38)_86%,rgba(255,255,255,0.78)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_64%,rgba(255,255,255,0.22)_88%,rgba(255,255,255,0.48)_100%)] z-10 transition-colors duration-300" />
              <div className="absolute inset-0 pointer-events-none rounded-2xl sm:rounded-3xl shadow-[inset_0_0_40px_rgba(255,255,255,0.65)] dark:shadow-[inset_0_0_32px_rgba(255,255,255,0.32)] z-10 transition-shadow duration-300" />

              {/* Smooth Soft White Scrim Overlays — Gradasi Batas Putih Cerah Halus & Alami */}
              <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/45 dark:from-white/20 via-white/15 to-transparent pointer-events-none z-10" />
              <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white/55 dark:from-white/25 via-white/20 to-transparent pointer-events-none z-10" />

              {/* Focal Center Scrim for Crisp Typography Readability on Bright/Sky Photos */}
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_62%_at_50%_46%,rgba(7,23,39,0.52)_0%,rgba(7,23,39,0.22)_65%,transparent_100%)] z-10" />

              {/* Cartographic Topography Contour Overlay */}
              <TopographicContourOverlay opacity={0.12} />
            </motion.div>

            {/* 2. Hero Content Floating DIRECTLY INSIDE Photo Canvas (Parallax Lifted via yText) */}
            <motion.div
              style={{
                y: shouldReduceMotion ? 0 : yText,
                opacity: shouldReduceMotion ? 1 : opacityText,
              }}
              className="relative z-20 flex-1 flex flex-col items-center justify-between text-center px-3 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10 max-w-4xl mx-auto transform-gpu w-full h-full"
            >
              <motion.div
                variants={shouldReduceMotion ? undefined : heroContainerVariants}
                initial={shouldReduceMotion ? false : "hidden"}
                animate={shouldReduceMotion ? false : "visible"}
                className="w-full flex-1 flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4 md:space-y-5 my-auto"
              >
                {/* A. Editorial Kicker Pill (High-Contrast Glass Badge for Bright Sky Readability) */}
                <motion.div
                  variants={shouldReduceMotion ? undefined : heroFadeInUpItemVariants}
                  className="inline-flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3.5 py-1.5 rounded-2xl sm:rounded-full bg-[#0A2238]/85 dark:bg-slate-950/85 backdrop-blur-xl border border-[#D9B96E]/35 shadow-lg shadow-black/35 text-[10px] sm:text-xs font-bold tracking-[0.14em] uppercase font-sans select-none text-center max-w-[95%]"
                >
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="text-[#D9B96E] font-extrabold tracking-wider">{t('landingInvest.hero.govTitle', 'PEMERINTAH KABUPATEN LUWU')}</span>
                  </div>
                  <span aria-hidden="true" className="hidden sm:inline text-white/40">·</span>
                  <span className="text-slate-100 font-semibold tracking-wide">{t('landingInvest.hero.dpmptspTitle', 'DINAS PENANAMAN MODAL & PTSP')}</span>
                </motion.div>

                {/* B. Main Title — Luxury Typography & Gold-Emerald Radiant Gradient */}
                <motion.div
                  variants={shouldReduceMotion ? undefined : heroFadeInUpItemVariants}
                  className="space-y-1.5 sm:space-y-2 max-w-3xl w-full"
                >
                  <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.15] font-display-sora drop-shadow-[0_4px_18px_rgba(0,0,0,0.85)]">
                    <span className="block text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.75)]">
                      {t('invest.hero_title_p1', 'Pintu Gerbang')}
                    </span>
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-[#E5C77A] drop-shadow-[0_4px_14px_rgba(0,0,0,0.75)]">
                      {t('invest.hero_title_p2', 'Investasi Digital')}
                    </span>
                  </h1>
                  <p className="text-[11px] sm:text-xs md:text-sm text-white font-medium max-w-md sm:max-w-xl mx-auto text-balance leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
                    {t("hero.subtitle", "Cepat. Transparan. Terintegrasi Spasial. Akses data peluang investasi Kabupaten Luwu secara real-time dengan peta interaktif terintegrasi RTRW & OSS-RBA.")}
                  </p>
                </motion.div>

                {/* C. Primary Menu & Action Bar inside Hero Canvas */}
                <motion.div
                  variants={shouldReduceMotion ? undefined : heroFadeInUpItemVariants}
                  className="w-full max-w-2xl flex flex-col items-center gap-2 pt-0"
                >
                  {/* Two Distinct Actions (Optimized Thumb-Zone for Mobile) */}
                  <div className="w-full max-w-xl grid grid-cols-1 xs:grid-cols-2 sm:flex sm:flex-row items-center justify-center gap-2 sm:gap-2.5 pt-0">
                    {/* Primary Action Button */}
                    <MagneticButton
                      strength={0.2}
                      id="btn-hero-gis-analytics"
                      onClick={(e: any) => handleGisClick(e, "default")}
                      className="group relative flex w-full sm:w-auto items-center justify-center gap-2 px-4.5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm transition-all duration-300 cursor-pointer active:scale-95 shadow-xl shadow-emerald-950/50 border border-emerald-400/50 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-[#0A2238]"
                    >
                      <Globe className="w-4 h-4 text-emerald-100 group-hover:rotate-12 transition-transform duration-300" />
                      <span className="tracking-wide">{t('landingInvest.hero.btnExploreInvest', t('hero.btnExploreInvest', 'Jelajahi Peluang Investasi'))}</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </MagneticButton>

                    {/* Secondary Action: Cek Kesesuaian Lahan */}
                    <button
                      type="button"
                      onClick={() => setIsRtrwModalOpen(true)}
                      className="group relative flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[#0A2238]/85 hover:bg-[#0F2D4A] text-slate-100 hover:text-white font-bold text-xs sm:text-sm transition-all duration-300 cursor-pointer active:scale-95 border border-white/20 hover:border-[#D9B96E]/60 backdrop-blur-md shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-[#0A2238]"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#D9B96E] group-hover:scale-110 transition-transform duration-300" />
                      <span className="tracking-wide">{t('landingInvest.hero.btnCheckZoning', t('hero.btnCheckZoning', 'Cek Kesesuaian Lahan'))}</span>
                    </button>
                  </div>

                  {/* Strip Kepercayaan 4 Butir Resmi Pemkab Luwu with micro-stagger (Symmetric 2x2 on Mobile) */}
                  <motion.div
                    variants={shouldReduceMotion ? undefined : heroTrustBadgeContainerVariants}
                    className="grid grid-cols-2 xs:flex xs:flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-0.5 text-white text-[10px] sm:text-[11px] font-semibold w-full max-w-xl"
                  >
                    <motion.div
                      variants={shouldReduceMotion ? undefined : heroTrustBadgeItemVariants}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#0A2238]/75 border border-white/15 backdrop-blur-md shadow-sm text-center"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{t('landingInvest.hero.trustOss', 'Terintegrasi OSS-RBA')}</span>
                    </motion.div>
                    <motion.div
                      variants={shouldReduceMotion ? undefined : heroTrustBadgeItemVariants}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#0A2238]/75 border border-white/15 backdrop-blur-md shadow-sm text-center"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{t('landingInvest.hero.trustRtrw', 'Data RTRW Terverifikasi')}</span>
                    </motion.div>
                    <motion.div
                      variants={shouldReduceMotion ? undefined : heroTrustBadgeItemVariants}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#0A2238]/75 border border-white/15 backdrop-blur-md shadow-sm text-center"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{t('landingInvest.hero.trustDpmptsp', 'DPMPTSP Kab. Luwu')}</span>
                    </motion.div>
                    <motion.div
                      variants={shouldReduceMotion ? undefined : heroTrustBadgeItemVariants}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#0A2238]/75 border border-white/15 backdrop-blur-md shadow-sm text-center"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{t('landingInvest.hero.trustLegal', 'Kepastian Hukum Berusaha')}</span>
                    </motion.div>
                  </motion.div>
                </motion.div>

                {/* D. Bottom Live Telemetry Bar (Frosted Glass Pill Bar so it stays crisp above bright vignette) */}
                <motion.div
                  variants={shouldReduceMotion ? undefined : heroFadeInUpItemVariants}
                  className="w-full py-2 px-3.5 mt-auto rounded-2xl bg-[#0A2238]/80 dark:bg-slate-950/80 backdrop-blur-xl border border-white/15 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-200 text-[10px] sm:text-[11px] font-sans"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 text-slate-100 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="font-bold text-white">{t('landingInvest.hero.opportunitiesLabel', 'Peluang Investasi:')}</span>
                    <span className="text-emerald-300 font-bold">
                      {investments && investments.length > 0
                        ? t('landingInvest.hero.verifiedPotentialPoints', { count: investments.length, defaultValue: `${investments.length} Titik Potensi Terverifikasi` })
                        : t('landingInvest.hero.verifiedPotentialPointsDefault', '2 Titik Potensi Terverifikasi')}
                    </span>
                    <span aria-hidden="true" className="hidden md:inline text-white/30">·</span>
                    <span className="hidden md:inline text-slate-200">{t('landingInvest.hero.districtsAndVillages', '22 Kecamatan & 227 Desa')}</span>
                  </div>

                  <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                    {heroImages.length > 1 && (
                      <div className="flex items-center gap-1.5">
                        {heroImages.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCurrentSlide(idx)}
                            aria-label={`Lihat Slide Foto ${idx + 1}`}
                            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                              currentSlide === idx
                                ? 'w-5 bg-emerald-400'
                                : 'w-1.5 bg-white/35 hover:bg-white/65'
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-emerald-300 text-[10px] sm:text-[11px] font-bold tracking-wide uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span>{t('landingInvest.hero.verifiedSpatialSystem', 'SISTEM SPASIAL TERVERIFIKASI')}</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>

          {/* Subtle Divider */}
            <motion.div 
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
              className="w-full max-w-3xl mx-auto my-4 sm:my-8 md:my-12 relative flex items-center justify-center"
            >
              <div
                className={`absolute inset-0 h-px ${
                  isDark
                    ? "bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    : "bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"
                }`}
              />
              <div
                className={`w-3 h-3 rotate-45 border z-10 ${
                  isDark
                    ? "border-white/15 bg-[#0F2D4A]"
                    : "border-emerald-400 bg-slate-50"
                }`}
              />
            </motion.div>

            {/* Premium Bento Stats Grid — Layer 1 (#0F2D4A) Container + Layer 2 (#143755) Cards */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-4 sm:mt-10 md:mt-16 lg:mt-20 max-w-6xl mx-auto px-0 sm:px-4 w-full"
            >
              <PreLaunchBanner 
                isDark={isDark} 
                dataCount={totalInvestmentValue} 
                context="invest-luwu" 
                className="mb-3.5 sm:mb-5" 
              />
              <div
                className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3.5 md:gap-4.5 rounded-2xl sm:rounded-3xl p-2 sm:p-4 md:p-5 border transition-colors duration-300 ${
                  isDark
                    ? "bg-[#0F2D4A] border-white/[0.07] shadow-none"
                    : "glass-crystal backdrop-blur-2xl border-white/50 shadow-xl shadow-slate-200/50"
                }`}
              >
                {[
                  {
                    id: 'stat-investment',
                    label: t("stats.totalInvestment"),
                    value: totalInvestmentValue > 0 ? formatRupiah(totalInvestmentValue) : t('landing.noRecordedData', 'Belum ada data tersedia'),
                    rawValue: totalInvestmentValue || 0,
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
                    label: t("stats.investorLoi"),
                    value: loiCount || 0,
                    rawValue: loiCount || 0,
                    isCurrency: false,
                    icon: Briefcase,
                    accentTop: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500',
                    borderHover: 'hover:border-emerald-400/80 dark:hover:border-emerald-500/80',
                    glowHover: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
                    iconColor: 'text-emerald-600 dark:text-emerald-400',
                    iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
                    iconBorder: 'border border-emerald-200/80 dark:border-emerald-500/30',
                    sparkId: 'spark-teal',
                    sparkColor: '#10b981',
                    sparkPoints: '0,26 15,22 30,24 45,16 60,18 70,10 80,6',
                    lastPoint: { x: 80, y: 6 },
                  },
                  {
                    id: 'stat-opportunities',
                    label: t("stats.activeOpportunities"),
                    value: activeOpportunities || 0,
                    rawValue: activeOpportunities || 0,
                    isCurrency: false,
                    icon: Layers,
                    accentTop: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500',
                    borderHover: 'hover:border-emerald-400/80 dark:hover:border-emerald-500/80',
                    glowHover: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
                    iconColor: 'text-emerald-600 dark:text-emerald-400',
                    iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
                    iconBorder: 'border border-emerald-200/80 dark:border-emerald-500/30',
                    sparkId: 'spark-info',
                    sparkColor: '#10b981',
                    sparkPoints: '0,24 13,20 26,22 39,15 52,17 65,10 80,6',
                    lastPoint: { x: 80, y: 6 },
                  },
                  {
                    id: 'stat-pkkpr',
                    label: t("stats.pkkprIssued"),
                    value: pkkprIssuedCount || 0,
                    rawValue: pkkprIssuedCount || 0,
                    isCurrency: false,
                    icon: ShieldCheck,
                    accentTop: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500',
                    borderHover: 'hover:border-emerald-400/80 dark:hover:border-emerald-500/80',
                    glowHover: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
                    iconColor: 'text-emerald-600 dark:text-emerald-400',
                    iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
                    iconBorder: 'border border-emerald-200/80 dark:border-emerald-500/30',
                    sparkId: 'spark-success',
                    sparkColor: '#10b981',
                    sparkPoints: '0,25 15,21 30,23 45,14 60,16 75,8 80,4',
                    lastPoint: { x: 80, y: 4 },
                  },
                  {
                    id: 'stat-infra',
                    label: t("stats.mappedInfra", "Infrastruktur Pendukung"),
                    value: infrastructure?.length || 0,
                    rawValue: infrastructure?.length || 0,
                    isCurrency: false,
                    icon: Building2,
                    accentTop: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500',
                    borderHover: 'hover:border-emerald-400/80 dark:hover:border-emerald-500/80',
                    glowHover: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
                    iconColor: 'text-emerald-600 dark:text-emerald-400',
                    iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
                    iconBorder: 'border border-emerald-200/80 dark:border-emerald-500/30',
                    sparkId: 'spark-infra',
                    sparkColor: '#10b981',
                    sparkPoints: '0,26 20,26 40,20 60,16 80,10',
                    lastPoint: { x: 80, y: 10 },
                  },
                  {
                    id: 'stat-labor',
                    label: t("stats.workforceAbsorption", "Serapan Tenaga Kerja"),
                    value: totalLabor || 0,
                    rawValue: totalLabor || 0,
                    isCurrency: false,
                    icon: Users,
                    accentTop: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500',
                    borderHover: 'hover:border-emerald-400/80 dark:hover:border-emerald-500/80',
                    glowHover: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
                    iconColor: 'text-emerald-600 dark:text-emerald-400',
                    iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
                    iconBorder: 'border border-emerald-200/80 dark:border-emerald-500/30',
                    sparkId: 'spark-labor',
                    sparkColor: '#10b981',
                    sparkPoints: '0,28 16,24 32,22 48,18 64,12 80,8',
                    lastPoint: { x: 80, y: 8 },
                  },
                ].map((stat) => (
                  <div
                    key={stat.id}
                    id={stat.id}
                    className={`relative flex flex-col items-center justify-between p-2.5 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border transition-all duration-300 group overflow-hidden ${
                      isDark
                        ? "bg-[#143755] hover:bg-[#1A4366] border-white/[0.06] hover:border-white/[0.14] shadow-none"
                        : `${stat.borderHover} backdrop-blur-xl bg-white/70 hover:bg-white/90 border-white/70 shadow-[0_4px_20px_rgba(15,23,42,0.04)] hover:shadow-[0_12px_30px_rgba(15,23,42,0.1)]`
                    } hover:-translate-y-1 active:scale-[0.98] w-full min-h-[172px] sm:min-h-[192px] md:min-h-[208px]`}
                  >
                    {/* Top Edge Glowing Line (only in light mode) */}
                    {!isDark && (
                      <div className={`absolute top-0 left-0 right-0 h-[3px] ${stat.accentTop}`} />
                    )}

                    {/* Ambient Glow Aura on Card Hover (only in light mode) */}
                    {!isDark && (
                      <div className={`absolute inset-0 bg-gradient-to-b ${stat.glowHover} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
                    )}

                    {/* Elevated Icon Capsule with Subtle Status Indicator */}
                    <div
                      className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center mb-1.5 sm:mb-2 transition-transform duration-300 ${
                        isDark
                          ? "bg-[#0F2D4A] border border-white/[0.08] shadow-none"
                          : `${stat.iconBg} ${stat.iconBorder} shadow-xs group-hover:scale-105`
                      }`}
                    >
                      <stat.icon size={18} className={`${stat.iconColor} sm:w-5 sm:h-5`} />
                      <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2 items-center justify-center">
                        <span className="inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: stat.sparkColor }} />
                      </span>
                    </div>

                    {/* Prominent Value Typography with Functional Count-Up Animation */}
                    <div className="h-9 sm:h-11 flex items-center justify-center w-full px-0.5 mb-0.5">
                      {isLoading ? (
                        <div className="animate-pulse bg-slate-700/50 dark:bg-slate-800/60 rounded-xl h-7 w-28" />
                      ) : (
                        <HeroStatCounter
                          value={stat.rawValue}
                          isCurrency={stat.isCurrency}
                          duration={650}
                        />
                      )}
                    </div>

                    {/* Crisp Sub-Label (Strictly Fixed Height for Symmetry) */}
                    <div className="h-7 sm:h-8 flex items-center justify-center text-center w-full px-0.5 mb-1 sm:mb-1.5">
                      <span
                        className={`font-['Plus_Jakarta_Sans',sans-serif] text-[10px] sm:text-[11px] md:text-xs uppercase tracking-wider font-bold leading-tight line-clamp-2 ${
                          isDark ? 'text-slate-300 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900'
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
          className={`pt-12 pb-8 sm:pt-16 sm:pb-12 md:pt-20 md:pb-14 border-b relative z-20 ${isDark ? "bg-base/40 border-slate-800/80" : "bg-slate-50/60 border-slate-200/80"}`}
        >
          <div className="container max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div
              ref={statsScrollContainerRef}
              onScroll={handleStatsScroll}
              onTouchStart={() => {
                setIsUserInteractingStats(true);
                if (statsResumeTimerRef.current) clearTimeout(statsResumeTimerRef.current);
              }}
              onTouchEnd={() => {
                if (statsResumeTimerRef.current) clearTimeout(statsResumeTimerRef.current);
                statsResumeTimerRef.current = setTimeout(() => {
                  setIsUserInteractingStats(false);
                }, 4000);
              }}
              className="flex sm:grid overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pb-4 sm:pb-0 scrollbar-hide pt-2 sm:pt-4 px-2 sm:px-0 scroll-smooth"
            >
              {/* Card 1: Cakupan Wilayah Administrasi Spasial */}
              <TiltCard
                wrapperClassName="snap-center shrink-0 w-[84vw] max-w-[340px] sm:max-w-none sm:w-auto"
                scaleOnHover={1.03}
                maxTilt={10}
                glareOpacity={0.18}
                className="w-full h-full group relative pt-5 sm:pt-6 pb-5 px-4 sm:px-5 rounded-[28px] flex flex-col items-center text-center justify-between transition-all duration-300 ease-out hover:-translate-y-2 glass-crystal glass-card-interactive bg-white/75 dark:bg-surface/70 backdrop-blur-2xl shadow-[0_12px_36px_rgba(15,23,42,0.06)] dark:shadow-[0_16px_45px_rgba(0,0,0,0.55)] border border-white/70 dark:border-white/10 hover:border-emerald-500/50 dark:hover:border-emerald-400/50 hover:shadow-[0_22px_45px_rgba(16,185,129,0.18)]"
              >
                {/* Elevated Circular Icon with Accent Rail */}
                <div className="relative w-full flex items-center justify-center pt-1 mb-3.5">
                  {/* Horizontal Accent Rail */}
                  <div className="absolute inset-x-2 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/40 dark:via-emerald-400/40 to-transparent" />

                  {/* Outer Elevated Podium Ring */}
                  <div className="relative">
                    {/* Ambient Glow */}
                    <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-md transform group-hover:scale-115 transition-transform duration-300" />
                    
                    <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full ring-4 ring-white dark:ring-slate-900 shadow-xl shadow-black/25 dark:shadow-black/70 bg-gradient-to-br from-[#0F6B4F] via-[#1F9D74] to-emerald-600 flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-105">
                      {/* Inner Delicate Ring Accent */}
                      <div className="absolute inset-1.5 rounded-full border border-white/30 pointer-events-none" />
                      <Globe size={28} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" strokeWidth={2.2} />
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="w-full flex flex-col items-center">
                  <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 min-h-[34px] flex items-center justify-center leading-snug px-1 text-balance">
                    {t("stats.subDistricts", "Cakupan Kecamatan Luwu")}
                  </div>
                  <div className="text-3xl sm:text-4xl font-black tracking-tight my-2 font-mono flex items-baseline justify-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CountUp end={districts?.length || 22} suffix="" />
                    <span className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-400 font-sans">{t("stats.districtsUnit", "Kecamatan")}</span>
                  </div>
                </div>

                {/* Micro Status Chip */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 w-full flex justify-center">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/30">
                    <SonarRadarPulse color="emerald" size={8} />
                    <span>227 Desa & Kelurahan</span>
                  </span>
                </div>
              </TiltCard>

              {/* Card 2: Lahan Potensial & Komoditas Strategis */}
              <TiltCard
                wrapperClassName="snap-center shrink-0 w-[84vw] max-w-[340px] sm:max-w-none sm:w-auto"
                scaleOnHover={1.03}
                maxTilt={10}
                glareOpacity={0.18}
                className="w-full h-full group relative pt-5 sm:pt-6 pb-5 px-4 sm:px-5 rounded-[28px] flex flex-col items-center text-center justify-between transition-all duration-300 ease-out hover:-translate-y-2 glass-crystal glass-card-interactive bg-white/75 dark:bg-surface/70 backdrop-blur-2xl shadow-[0_12px_36px_rgba(15,23,42,0.06)] dark:shadow-[0_16px_45px_rgba(0,0,0,0.55)] border border-white/70 dark:border-white/10 hover:border-emerald-500/50 dark:hover:border-emerald-400/50 hover:shadow-[0_22px_45px_rgba(16,185,129,0.18)]"
              >
                {/* Elevated Circular Icon with Accent Rail */}
                <div className="relative w-full flex items-center justify-center pt-1 mb-3.5">
                  {/* Horizontal Accent Rail */}
                  <div className="absolute inset-x-2 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/40 dark:via-emerald-400/40 to-transparent" />

                  {/* Outer Elevated Podium Ring */}
                  <div className="relative">
                    {/* Ambient Glow */}
                    <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-md transform group-hover:scale-115 transition-transform duration-300" />
                    
                    <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full ring-4 ring-white dark:ring-slate-900 shadow-xl shadow-black/25 dark:shadow-black/70 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-105">
                      <div className="absolute inset-1.5 rounded-full border border-white/30 pointer-events-none" />
                      <MapPin size={28} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" strokeWidth={2.2} />
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="w-full flex flex-col items-center">
                  <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 min-h-[34px] flex items-center justify-center leading-snug px-1 text-balance">
                    {t("stats.strategicLands")}
                  </div>
                  <div className="text-3xl sm:text-4xl font-black tracking-tight my-2 font-mono flex items-baseline justify-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CountUp end={investments?.length || 0} suffix="" />
                    <span className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-400 font-sans">{t("stats.locations")}</span>
                  </div>
                </div>

                {/* Micro Status Chip */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 w-full flex justify-center">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/20">
                    <SonarRadarPulse color="emerald" size={8} />
                    <span>Siap Ditawarkan</span>
                  </span>
                </div>
              </TiltCard>

              {/* Card 3: Serapan Tenaga Kerja */}
              <TiltCard
                wrapperClassName="snap-center shrink-0 w-[84vw] max-w-[340px] sm:max-w-none sm:w-auto"
                scaleOnHover={1.03}
                maxTilt={10}
                glareOpacity={0.18}
                className="w-full h-full group relative pt-5 sm:pt-6 pb-5 px-4 sm:px-5 rounded-[28px] flex flex-col items-center text-center justify-between transition-all duration-300 ease-out hover:-translate-y-2 glass-crystal glass-card-interactive bg-white/75 dark:bg-surface/70 backdrop-blur-2xl shadow-[0_12px_36px_rgba(15,23,42,0.06)] dark:shadow-[0_16px_45px_rgba(0,0,0,0.55)] border border-white/70 dark:border-white/10 hover:border-emerald-500/50 dark:hover:border-emerald-400/50 hover:shadow-[0_22px_45px_rgba(16,185,129,0.18)]"
              >
                {/* Elevated Circular Icon with Accent Rail */}
                <div className="relative w-full flex items-center justify-center pt-1 mb-3.5">
                  {/* Horizontal Accent Rail */}
                  <div className="absolute inset-x-2 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/40 dark:via-emerald-400/40 to-transparent" />

                  {/* Outer Elevated Podium Ring */}
                  <div className="relative">
                    {/* Ambient Glow */}
                    <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-md transform group-hover:scale-115 transition-transform duration-300" />
                    
                    <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full ring-4 ring-white dark:ring-slate-900 shadow-xl shadow-black/25 dark:shadow-black/70 bg-gradient-to-br from-[#0F6B4F] via-[#1F9D74] to-[#047857] flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-105">
                      <div className="absolute inset-1.5 rounded-full border border-white/30 pointer-events-none" />
                      <Users size={28} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" strokeWidth={2.2} />
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="w-full flex flex-col items-center">
                  <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 min-h-[34px] flex items-center justify-center leading-snug px-1 text-balance">
                    {t("stats.workforceAbsorption", "Serapan Tenaga Kerja")}
                  </div>
                  <div className="text-3xl sm:text-4xl font-black tracking-tight my-2 font-mono flex items-baseline justify-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <CountUp end={totalLabor} suffix="" />
                    <span className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-400 font-sans">{t("stats.workers", "Jiwa")}</span>
                  </div>
                </div>

                {/* Micro Status Chip */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 w-full flex justify-center">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/30">
                    <SonarRadarPulse color="emerald" size={8} />
                    <span>TKL & TKA Terdata</span>
                  </span>
                </div>
              </TiltCard>

              {/* Card 4: Asisten AI DPMPTSP */}
              <TiltCard
                wrapperClassName="snap-center shrink-0 w-[84vw] max-w-[340px] sm:max-w-none sm:w-auto"
                scaleOnHover={1.03}
                maxTilt={10}
                glareOpacity={0.18}
                className="w-full h-full group relative pt-5 sm:pt-6 pb-5 px-4 sm:px-5 rounded-[28px] flex flex-col items-center text-center justify-between transition-all duration-300 ease-out hover:-translate-y-2 glass-crystal glass-card-interactive bg-white/75 dark:bg-surface/70 backdrop-blur-2xl shadow-[0_12px_36px_rgba(15,23,42,0.06)] dark:shadow-[0_16px_45px_rgba(0,0,0,0.55)] border border-white/70 dark:border-white/10 hover:border-teal-500/50 dark:hover:border-teal-400/50 hover:shadow-[0_22px_45px_rgba(13,148,136,0.18)]"
              >
                {/* Elevated Circular Icon with Accent Rail */}
                <div className="relative w-full flex items-center justify-center pt-1 mb-3.5">
                  {/* Horizontal Accent Rail */}
                  <div className="absolute inset-x-2 h-[2px] bg-gradient-to-r from-transparent via-teal-500/40 dark:via-teal-400/40 to-transparent" />

                  {/* Outer Elevated Podium Ring */}
                  <div className="relative">
                    {/* Ambient Glow */}
                    <div className="absolute inset-0 rounded-full bg-teal-500/30 blur-md transform group-hover:scale-115 transition-transform duration-300" />
                    
                    <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full ring-4 ring-white dark:ring-slate-900 shadow-xl shadow-black/25 dark:shadow-black/70 bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-700 flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-105">
                      <div className="absolute inset-1.5 rounded-full border border-white/30 pointer-events-none" />
                      <Bot size={28} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" strokeWidth={2.2} />
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="w-full flex flex-col items-center">
                  <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 min-h-[34px] flex items-center justify-center leading-snug px-1 text-balance">
                    {t("stats.aiAssistant")}
                  </div>
                  <div className="text-3xl sm:text-4xl font-black tracking-tight my-2 font-mono flex items-baseline justify-center gap-1.5 whitespace-nowrap text-teal-700 dark:text-teal-300">
                    <span className="tabular-nums">24/7</span>
                    <span className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-400 font-sans">{t("stats.active", "Aktif")}</span>
                  </div>
                </div>

                {/* Micro Status Chip */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 w-full flex justify-center">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-500/30">
                    <SonarRadarPulse color="teal" size={8} />
                    <span>Konsultasi Cerdas</span>
                  </span>
                </div>
              </TiltCard>
            </div>

            {/* Mobile Carousel Pagination & Navigation Controls */}
            <div className="flex sm:hidden items-center justify-center gap-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  const prev = (activeStatIndex - 1 + 4) % 4;
                  scrollToStatCard(prev);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 shadow-xs text-slate-600 dark:text-slate-300 active:scale-95 transition-transform cursor-pointer"
                aria-label="Slide sebelumnya"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1.5 px-1">
                {[0, 1, 2, 3].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => scrollToStatCard(idx)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      activeStatIndex === idx
                        ? "w-6 bg-blue-500 dark:bg-blue-400 shadow-xs shadow-black/25"
                        : "w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
                    }`}
                    aria-label={`Pindah ke slide ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  const next = (activeStatIndex + 1) % 4;
                  scrollToStatCard(next);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 shadow-xs text-slate-600 dark:text-slate-300 active:scale-95 transition-transform cursor-pointer"
                aria-label="Slide berikutnya"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* EKOSISTEM INVESTASI: 6 PILAR KESIAPAN DAERAH (BLUEPRINT KEMENTERIAN INVESTASI) */}
        <InvestmentReadinessPillars
          isDark={isDark}
          onOpenRtrwModal={() => setIsRtrwModalOpen(true)}
          onOpenIncentiveModal={() => setIsIncentiveModalOpen(true)}
          onOpenSpatialMap={() => navigate("/peta-spasial")}
          onScrollToPotensi={() => scrollToSection("potensi-section")}
          onScrollToRoadmap={() => scrollToSection("roadmap-section")}
          onScrollToCalculator={() => scrollToSection("ai-calculator-section")}
          onScrollToUmkm={() => scrollToSection("kemitraan-umkm-section")}
        />

        {/* 2. DAFTAR POTENSI INVESTASI - BENTO GRID */}
        <div
          id="potensi-section"
          className="scroll-mt-20 sm:scroll-mt-24 container max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 lg:py-16 min-h-[44px] border-t border-slate-200/60 dark:border-slate-800/60"
        >
          {/* Section Header with Slider Navigation Controls */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 mb-3 uppercase tracking-wider backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span>{t("sections.potensi.badge", "Peluang Siap Tawar (IPRO)")}</span>
              </div>
              <motion.h2 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 text-balance break-words"
              >
                <span className="text-slate-900 dark:text-white">
                  {t("sections.potensi.title")}
                </span>
              </motion.h2>
              <motion.div 
                initial={{ opacity: 0, scaleX: 0 }}
                whileInView={{ opacity: 1, scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="h-1 w-16 bg-emerald-600 dark:bg-emerald-500 rounded-full mb-3 ml-0 origin-left"
              />
              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className={`text-sm sm:text-base font-medium ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                {t("sections.potensi.subtitle")}
              </motion.p>
            </div>

            {/* Slider Navigation Controls Header - Unified Glass Capsule Bar */}
            <div className="flex items-center gap-3 shrink-0 self-start md:self-end">
              {sortedInvestmentsList.length > 0 && (
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/90 dark:bg-surface/90 border border-slate-200/90 dark:border-slate-800 shadow-md shadow-slate-200/50 dark:shadow-none backdrop-blur-xl">
                  <button
                    type="button"
                    onClick={handlePrevPotensiSlide}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-95 text-slate-700 dark:text-slate-200 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 cursor-pointer"
                    title="Potensi Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-800 dark:text-slate-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-mono">{activePotensiIndex + 1} / {sortedInvestmentsList.length} Potensi</span>
                    <button
                      type="button"
                      onClick={() => setIsPotensiAutoPlay(!isPotensiAutoPlay)}
                      className="ml-0.5 p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400 cursor-pointer"
                      title={isPotensiAutoPlay ? "Jeda Auto-Slider" : "Putar Auto-Slider"}
                    >
                      {isPotensiAutoPlay ? <Pause className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Play className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextPotensiSlide}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-95 text-slate-700 dark:text-slate-200 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 cursor-pointer"
                    title="Potensi Berikutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              <motion.button 
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.04 }}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate("/peta-spasial");
                }}
                className={`hidden lg:flex shrink-0 px-4 py-2 rounded-xl font-bold text-xs tracking-wider uppercase border items-center gap-1.5 transition-all duration-300 backdrop-blur-xl cursor-pointer ${
                  isDark
                    ? "bg-gradient-to-r from-emerald-900/40 via-slate-800/80 to-blue-900/40 border-emerald-500/40 text-emerald-300 hover:border-emerald-400 shadow-[0_4px_20px_rgba(16,185,129,0.2)]"
                    : "bg-gradient-to-r from-emerald-50 via-white to-blue-50 border-emerald-300 text-emerald-700 hover:border-emerald-500 shadow-md shadow-black/25"
                }`}
              >
                {t("ui.viewInteractiveMap")} <ChevronRight size={15} />
              </motion.button>
            </div>
          </div>

          {/* SPATIAL READY: PETA RDTR DIGITAL TERINTEGRASI */}
          <SpatialRdtrBanner
            isDark={isDark}
            onOpenRtrwModal={() => setIsRtrwModalOpen(true)}
            onOpenSpatialMap={() => navigate("/peta-spasial")}
          />

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
              ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900/70 to-teal-950/30 border-emerald-500/30 shadow-lg shadow-black/25' 
              : 'bg-gradient-to-r from-emerald-50/90 via-white to-teal-50/80 border-emerald-200 shadow-md shadow-black/25'
          }`}>
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-black/25 shrink-0">
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
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center justify-center gap-2 shadow-md shadow-black/25 transition-all cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Buka Kalkulator Insentif</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex gap-6 overflow-hidden">
              {[1, 2, 3].map((num) => (
                <div
                  key={num}
                  className="shrink-0 w-[88vw] xs:w-[82vw] sm:w-[380px] md:w-[400px] rounded-3xl border overflow-hidden flex flex-col h-[400px] animate-pulse bg-slate-200 dark:bg-slate-700 border-transparent"
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
          ) : sortedInvestmentsList.length > 0 ? (
            <div className="relative group/slider">
              {/* Horizontal Animated Slider Container */}
              <div
                ref={potensiSliderRef}
                onScroll={handlePotensiScroll}
                onMouseEnter={() => setIsPotensiAutoPlay(false)}
                onMouseLeave={() => setIsPotensiAutoPlay(true)}
                className="flex gap-5 sm:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {sortedInvestmentsList.map((inv, idx) => (
                  <div
                    key={inv.id}
                    className="snap-start shrink-0 w-[88vw] xs:w-[82vw] sm:w-[380px] md:w-[400px] lg:w-[420px] flex flex-col"
                  >
                    <TiltCard
                      maxTilt={5}
                      scaleOnHover={1.012}
                      glareOpacity={0.1}
                      style={{ animationDelay: `${idx * 150}ms` }}
                      className={`w-full h-full rounded-[26px] sm:rounded-[28px] border overflow-hidden flex flex-col group/card
                                  transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-900/20 glass-crystal glass-card-interactive
                                  ${isDark ? 'bg-surface/90 border-white/10 shadow-[0_18px_50px_rgba(0,0,0,0.6)]' : 'bg-white/95 border-slate-200/90 shadow-[0_16px_45px_rgba(15,23,42,0.07)]'}`}
                    >
                      {/* Header Image Section */}
                      <div className="h-60 sm:h-64 overflow-hidden relative w-full">
                        {(() => {
                          const cardWidth = 380;
                          const cardOffset = idx * (cardWidth + 24) - potensiScrollLeft;
                          const parallaxOffset = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
                            ? 0
                            : Math.max(-12, Math.min(12, (cardOffset / 1000) * 15));

                          return (
                            <LazyImage
                              src={getImageUrl(inv.photoUrl, 'facility')}
                              alt={inv.name}
                              isDark={isDark}
                              style={{ transform: `translateX(${parallaxOffset}px) scale(1.08)` }}
                              imgClassName="w-full h-full object-cover transform group-hover/card:scale-108 transition-transform duration-700 ease-out"
                            />
                          );
                        })()}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/25 pointer-events-none" />

                        {/* Top Badges Bar */}
                        <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-1.5 z-10">
                          {/* Sector Badge */}
                          <div
                            className={`px-3 py-1 rounded-xl text-[11px] font-extrabold tracking-wide uppercase backdrop-blur-md shadow-md border ${getSectorColor(inv.sector).badgeBg}`}
                          >
                            {t(getSectorI18nKey(inv.sector))}
                          </div>

                          {/* Right Badges: AI Score & Tier Badge */}
                          <div className="flex items-center gap-1.5">
                            {(inv.smartData?.aiScore || inv.smartData?.ai_score) && (
                              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-base/85 backdrop-blur-md border border-teal-400/40 text-white shadow-md shrink-0">
                                <span className="text-teal-400 text-xs">★</span>
                                <span className="text-[10px] font-black tracking-tight text-teal-300">
                                  {inv.smartData?.aiScore || inv.smartData?.ai_score}
                                </span>
                              </div>
                            )}

                            {/* Project Readiness Tier (BKPM RI Standard) */}
                            {(() => {
                              const isTier1 = (inv as any).readinessTier === 'Tier 1' || 
                                              (inv as any).readiness_tier === 'Tier 1' || 
                                              (inv as any).status_kesiapan?.toLowerCase().includes('ready') ||
                                              Boolean(inv.investmentValue && inv.investmentValue > 0 && inv.areaHa && inv.areaHa > 0 && inv.landStatus);

                              return isTier1 ? (
                                <div 
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-emerald-950/90 text-emerald-300 border border-emerald-400/60 backdrop-blur-md shadow-md"
                                  title="Ready to Offer (Tier 1): Full FS Siap, Lahan Clean & Clear, Kesesuaian RTRW Terkonfirmasi (Standar BKPM RI)"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  <span>Tier 1: Ready to Offer</span>
                                </div>
                              ) : (
                                <div 
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-sky-950/90 text-sky-300 border border-sky-400/60 backdrop-blur-md shadow-md"
                                  title="Under Development (Tier 2): Pre-FS Tersedia, Kajian Tata Ruang Sedang Difinalisasi (Standar BKPM RI)"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                                  <span>Tier 2: Under Dev</span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Bottom Photo Unified Aero-Glass Geotag Bar */}
                        <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-xs text-white z-10 pointer-events-none">
                          <div className="w-full flex items-center justify-between bg-base/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 shadow-md">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-100 min-w-0 pr-2">
                              <MapPin size={13} className="text-emerald-400 shrink-0" />
                              <span className="truncate max-w-[190px] sm:max-w-[220px]">
                                {districts.find((d) => d.id === inv.districtId)?.name || (inv as any).districtName || (inv as any).lokasi || inv.districtId || "Kabupaten Luwu"}
                              </span>
                            </div>
                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 bg-emerald-950/90 px-2 py-0.5 rounded-lg border border-emerald-500/40 flex items-center gap-1 shrink-0">
                              <ShieldCheck size={12} className="text-emerald-400" />
                              <span>GIS Valid</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Content Body */}
                      <div className="p-5 sm:p-6 flex flex-col flex-grow">
                        <div className="mb-4">
                          {(() => {
                            const descText = `${inv.name || ""} ${inv.sector || ""} ${(inv as any).subSector || ""} ${inv.description || ""} ${(inv as any).deskripsi_singkat || ""}`.toLowerCase();
                            const isHilirisasi =
                              descText.includes("hilirisasi") ||
                              descText.includes("sentra") ||
                              descText.includes("smelter") ||
                              descText.includes("olahan") ||
                              descText.includes("pengolahan") ||
                              descText.includes("kakao") ||
                              descText.includes("kopi");

                            return isHilirisasi ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/25 mb-2">
                                <Sparkles size={11} className="text-teal-500" />
                                <span>Hilirisasi Komoditas</span>
                              </div>
                            ) : null;
                          })()}
                          <h3 className="text-lg sm:text-xl font-extrabold font-sans line-clamp-2 leading-snug group-hover/card:text-emerald-600 dark:group-hover/card:text-emerald-400 transition-colors tracking-tight text-slate-900 dark:text-white">
                            {inv.name}
                          </h3>
                        </div>

                        {/* Symmetrical 3-Column Bento Metric Matrix 2.0 */}
                        {(() => {
                          const rawLabor = inv.komitmenTenagaLokal ?? inv.komitmen_tenaga_lokal ?? inv.tenagaKerja ?? inv.tenaga_kerja ?? inv.tenagaLokal ?? inv.tenaga_lokal ?? inv.tkl ?? 0;
                          const laborVal = typeof rawLabor === 'number' ? rawLabor : parseFloat(String(rawLabor).replace(/[^0-9.]/g, '')) || 0;
                          const hasLand = Boolean(inv.areaHa && inv.areaHa > 0);
                          const hasInvest = Boolean(inv.investmentValue && inv.investmentValue > 0);

                          return (
                            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mb-4.5">
                              {/* Spec 1: Luas Lahan */}
                              <div className={`p-2.5 rounded-2xl border text-center flex flex-col items-center justify-between transition-all duration-300 ${
                                isDark ? 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70 hover:border-slate-600' : 'bg-slate-50/80 border-slate-200/80 hover:bg-white hover:border-slate-300 shadow-xs'
                              }`}>
                                <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  <div className={`w-4 h-4 rounded-full bg-[#C9A24B]/10 dark:bg-[#C9A24B]/20 flex items-center justify-center shrink-0`}>
                    <MapPin size={10} className="text-[#A07A28] dark:text-[#C9A24B]" />
                  </div>
                                  <span>Lahan</span>
                                </div>
                                <span className={`text-xs sm:text-sm font-extrabold ${hasLand ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 font-medium text-[11px]'}`}>
                                  {hasLand ? `${formatAreaHa(inv.areaHa)} Ha` : "Pra-FS"}
                                </span>
                              </div>

                              {/* Spec 2: Estimasi Investasi */}
                              <div className={`p-2.5 rounded-2xl border text-center flex flex-col items-center justify-between transition-all duration-300 ${
                                isDark ? 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70 hover:border-slate-600' : 'bg-slate-50/80 border-slate-200/80 hover:bg-white hover:border-slate-300 shadow-xs'
                              }`}>
                                <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                  <div className="w-4 h-4 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 flex items-center justify-center shrink-0">
                                    <Building size={10} className="text-emerald-500" />
                                  </div>
                                  <span className="truncate max-w-[80px]" title={t("landingInvest.catalog.estimatedInvestmentValue", "Estimasi Nilai Investasi")}>{t("landingInvest.catalog.estimatedInvestmentValue", "Est. Nilai")}</span>
                                </div>
                                <span className={`text-xs sm:text-sm font-extrabold ${hasInvest ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 font-medium text-[11px]'}`}>
                                  {hasInvest ? formatRupiah(inv.investmentValue) : "Kajian FS"}
                                </span>
                              </div>

                              {/* Spec 3: Tenaga Kerja */}
                              <div className={`p-2.5 rounded-2xl border text-center flex flex-col items-center justify-between transition-all duration-300 ${
                                isDark ? 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70 hover:border-slate-600' : 'bg-slate-50/80 border-slate-200/80 hover:bg-white hover:border-slate-300 shadow-xs'
                              }`}>
                                <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                  <div className="w-4 h-4 rounded-full bg-teal-500/10 dark:bg-teal-400/10 flex items-center justify-center shrink-0">
                                    <Users size={10} className="text-teal-500" />
                                  </div>
                                  <span>SDM</span>
                                </div>
                                <span className={`text-xs sm:text-sm font-extrabold ${laborVal > 0 ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400 font-medium text-[11px]'}`}>
                                  {laborVal > 0 ? `${laborVal} Jiwa` : "Lokal / UMKM"}
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Realization & Spatial Readiness Progress Bar */}
                        {(() => {
                          const rawPct = Math.min(100, Math.round(((inv.investmentValue || 0) / 2500000000000) * 100 * Math.max(investments.length, 1)));
                          const isTier1 = (inv as any).readinessTier === 'Tier 1' || (inv as any).readiness_tier === 'Tier 1' || Boolean(inv.investmentValue && inv.areaHa);
                          const pct = typeof rawPct === 'number' && !isNaN(rawPct) && rawPct > 0 ? rawPct : (isTier1 ? 85 : 45);
                          return (
                            <div className="mb-4.5">
                              <div className="flex justify-between items-center mb-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[10px] uppercase tracking-wider font-extrabold ${textMuted}`}>
                                    Kesiapan Proyek & Realisasi
                                  </span>
                                </div>
                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">{pct}%</span>
                              </div>
                              <div className={`h-2 rounded-full overflow-hidden p-0.5 border ${isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-slate-100 border-slate-200/80'}`}>
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.35)] transition-all duration-700"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })()}

                        {/* Action Buttons Section — Streamlined 2 Primary Actions */}
                        <div className={`mt-auto pt-3.5 flex flex-col gap-2 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
                          {/* Row 1: Primary Spatial Exploration & Fast-Track Interest */}
                          <div className="grid grid-cols-2 gap-2">
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
                              className={`min-h-[42px] py-2 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.97] cursor-pointer
                                          ${isDark
                                            ? 'border-slate-700/80 bg-slate-800/70 text-slate-200 hover:border-emerald-500/50 hover:bg-slate-800 hover:text-emerald-300 shadow-sm'
                                            : 'border-slate-200/90 bg-slate-50/90 text-slate-800 hover:border-emerald-400/60 hover:bg-white hover:text-emerald-700 shadow-xs'}`}
                              title="Buka Peta Spasial GIS & Analisis Lahan"
                            >
                              <Search size={14} className="text-slate-400 group-hover/card:text-emerald-500 transition-colors" />
                              <span className="truncate">{t("landingInvest.catalog.spatialExploration", "Eksplorasi Spasial")}</span>
                            </motion.button>

                            <motion.button
                              whileTap={{ scale: 0.96 }}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                navigate("/login?role=investor");
                              }}
                              className="relative overflow-hidden min-h-[42px] py-2 px-3 rounded-xl text-xs sm:text-sm font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.97] bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-black/25 flex items-center justify-center gap-1.5 cursor-pointer group/cta"
                            >
                              <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none animate-shimmer-sweep" />
                              <span className="relative z-10">{t("landing.ajukanMinat", "Ajukan Minat")}</span>
                              <ChevronRight size={15} className="relative z-10 transition-transform group-hover/cta:translate-x-0.5" />
                            </motion.button>
                          </div>

                          {/* Row 2: Secondary Quick Links (IPRO Teaser & Konsultasi VIP) */}
                          <div className="flex items-center justify-between gap-2 pt-1 text-[11px] font-bold">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedIproForModal(inv);
                                setIsIproPitchModalOpen(true);
                              }}
                              className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              title="Lihat Dokumen IPRO & Pitch Deck Investasi"
                            >
                              <FileText size={13} className="text-emerald-600 dark:text-emerald-400" />
                              <span>Teaser IPRO</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedInvestmentForConsultation(inv);
                                setIsFastTrackConsultationOpen(true);
                              }}
                              className="flex-1 py-1.5 px-2 rounded-lg bg-[#C9A24B]/10 hover:bg-[#C9A24B]/15 text-[#A07A28] dark:text-[#C9A24B] border border-[#A07A28]/25 dark:border-[rgba(201,162,75,0.25)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              title="Jadwalkan Konsultasi VIP Fast-Track"
                            >
                              <Sparkles size={13} className="text-[#A07A28] dark:text-[#C9A24B]" />
                              <span>Konsultasi VIP</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </TiltCard>
                  </div>
                ))}
              </div>

              {/* Below Slider: Touch Swipe Indicator & Pagination Dots */}
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-surface/5 dark:bg-slate-800/40 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800">
                  <span className="inline-block animate-pulse text-emerald-500 font-bold">←</span>
                  <span>Geser horizontal untuk mengeksplorasi {sortedInvestmentsList.length} potensi</span>
                  <span className="inline-block animate-pulse text-emerald-500 font-bold">→</span>
                </div>

                {/* Pagination Dots */}
                {sortedInvestmentsList.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1.5 px-3 rounded-full bg-surface/5 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                    {sortedInvestmentsList.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => scrollToPotensiSlide(i)}
                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                          activePotensiIndex === i
                            ? "w-7 bg-emerald-500 shadow-sm shadow-black/25"
                            : "w-2 bg-slate-300 dark:bg-slate-700 hover:bg-emerald-400/50"
                        }`}
                        title={`Ke Potensi #${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
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
        <div id="analytics-section" className="scroll-mt-20 sm:scroll-mt-24 mt-4 sm:mt-8 min-h-0 h-auto">
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
          className="scroll-mt-20 sm:scroll-mt-24 container max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 md:py-14 lg:py-18"
        >
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 text-balance break-words">
              {t("sections.keuntungan.title")}
            </h2>
            <div className="h-1 w-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mb-4 mx-auto"></div>
            <p className="text-sm sm:text-base max-w-2xl mx-auto text-slate-600 dark:text-slate-300 font-medium">
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
                shadow: "shadow-black/40",
                cardHover: "hover:border-emerald-500/50 hover:shadow-[0_20px_40px_rgba(16,185,129,0.2)]",
                tag: "Konektivitas Multimoda",
                badgeBg: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20",
                dotColor: "bg-emerald-400",
              },
              {
                icon: Leaf,
                title: t("features.commodityTitle"),
                desc: t("features.commodityDesc"),
                rail: "via-teal-500",
                ambientGlow: "bg-teal-500/30",
                gradient: "from-teal-500 via-teal-600 to-emerald-600",
                shadow: "shadow-black/40",
                cardHover: "hover:border-teal-500/50 hover:shadow-[0_20px_40px_rgba(20,184,166,0.2)]",
                tag: "Hilirisasi Komoditas",
                badgeBg: "bg-teal-500/10 text-teal-800 dark:text-teal-300 border-teal-500/20",
                dotColor: "bg-teal-400",
              },
              {
                icon: ShieldCheck,
                title: t("features.bureaucracyTitle"),
                desc: t("features.bureaucracyDesc"),
                rail: "via-[#C9A24B]",
                ambientGlow: "bg-[#C9A24B]/30",
                gradient: "from-[#0F6B4F] via-[#1F9D74] to-[#C9A24B]",
                shadow: "shadow-black/40",
                cardHover: "hover:border-[#C9A24B]/50 hover:shadow-[0_20px_40px_rgba(201,162,75,0.2)]",
                tag: "Kemudahan & Kepastian Hukum",
                badgeBg: "bg-[#C9A24B]/10 text-[#A07A28] dark:text-[#C9A24B] border-[#A07A28]/30 dark:border-[rgba(201,162,75,0.30)]",
                dotColor: "bg-[#C9A24B]",
              },
            ].map((item, idx) => (
              <motion.div
                initial={isMobile ? false : { opacity: 0, y: 20 }}
                style={{ willChange: "transform, opacity" }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.05 }}
                transition={{ delay: idx * 0.15 }}
                key={idx}
                className={`group relative pt-14 sm:pt-16 pb-6 px-6 sm:px-7 rounded-[28px] flex flex-col items-center text-center justify-between transition-all duration-300 ease-out hover:-translate-y-2 bg-white/90 dark:bg-surface border border-slate-200/80 dark:border-white/10 shadow-lg shadow-slate-200/50 dark:shadow-black/20 ${item.cardHover}`}
              >
                {/* Top Subtle Accent Rail */}
                <div className={`absolute top-0 inset-x-8 h-[3px] bg-gradient-to-r from-transparent ${item.rail} to-transparent rounded-full`} />

                {/* Overlapping Circular Medallion (MPP Badung Aesthetic) */}
                <div className="absolute -top-10 sm:-top-11 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                  <div className="relative">
                    {/* Ambient Glow */}
                    <div className={`absolute inset-0 rounded-full ${item.ambientGlow} blur-md transform group-hover:scale-115 transition-transform duration-300`} />
                    
                    {/* Outer Elevated Podium Ring */}
                    <div className={`relative w-20 h-20 sm:w-22 sm:h-22 rounded-full ring-4 sm:ring-[6px] ring-white dark:ring-[#0A2238] ${item.shadow} bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-105`}>
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
                  <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300 text-center mb-5 flex-grow font-normal">
                    {item.desc}
                  </p>
                </div>

                {/* Micro Status Chip */}
                <div className="mt-auto pt-4 border-t border-slate-200/80 dark:border-white/10 w-full flex justify-center">
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
          className="scroll-mt-20 sm:scroll-mt-24 container max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 md:py-14 lg:py-18 relative min-h-[44px]"
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[20%] right-[10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/5 blur-[120px] mix-blend-screen" />
          </div>
          <div className="text-center mb-8 sm:mb-12 md:mb-16 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-amber-500/10 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-600/30 dark:border-amber-400/30 shadow-xs mb-3">
              <Building size={13} className="text-amber-700 dark:text-amber-300" />
              <span>Infrastruktur & Ekosistem</span>
            </div>
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif-display font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-2"
            >
              <span className="text-slate-900 dark:text-slate-100">
                {t("sections.infrastruktur.title")}
              </span>
            </motion.h2>
            <div className="gold-divider-diamond">
              <span className="gold-diamond-icon" />
            </div>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-sm sm:text-base max-w-2xl mx-auto text-slate-700 dark:text-slate-200 font-medium leading-relaxed"
            >
              {t("sections.infrastruktur.subtitle")}
            </motion.p>
          </div>

          {(() => {
            const baseFacilities = [
              {
                id: "airport",
                name: t("infrastructure.buaAirportTitle"),
                desc: t("infrastructure.buaAirportDesc"),
                type: "airport",
                icon: Plane,
                rail: "via-[#C9A24B]",
                ambientGlow: "bg-[#C9A24B]/30",
                gradient: "from-[#0F6B4F] via-[#1F9D74] to-[#C9A24B]",
                shadow: "shadow-black/40",
                cardHover: "hover:border-[#C9A24B]/50 hover:shadow-[0_20px_40px_rgba(201,162,75,0.2)]",
                tag: "Gerbang Udara & Kargo",
                badgeBg: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-600/30 dark:border-amber-400/30",
                dotColor: "bg-amber-500",
                longitude: facilityCoords.airport ? facilityCoords.airport[0] : 120.24132322502385,
                latitude: facilityCoords.airport ? facilityCoords.airport[1] : -3.086338491260946,
              },
              {
                id: "port",
                name: t("infrastructure.uloPortTitle"),
                desc: t("infrastructure.uloPortDesc"),
                type: "port",
                icon: Anchor,
                rail: "via-teal-500",
                ambientGlow: "bg-teal-500/30",
                gradient: "from-teal-500 via-teal-600 to-emerald-700",
                shadow: "shadow-black/40",
                cardHover: "hover:border-teal-500/50 hover:shadow-[0_20px_40px_rgba(45,212,191,0.2)]",
                tag: "Dermaga Logistik Laut",
                badgeBg: "bg-teal-500/10 text-teal-800 dark:text-teal-300 border border-teal-500/20",
                dotColor: "bg-teal-500",
                longitude: facilityCoords.port ? facilityCoords.port[0] : 120.39793462368112,
                latitude: facilityCoords.port ? facilityCoords.port[1] : -3.386061643485775,
              },
              {
                id: "industrial",
                name: t("infrastructure.kiluTitle"),
                desc: t("infrastructure.kiluDesc"),
                type: "industrial",
                icon: Building,
                rail: "via-[#C9A24B]",
                ambientGlow: "bg-[#C9A24B]/30",
                gradient: "from-[#0B2A20] via-[#0F6B4F] to-[#C9A24B]",
                shadow: "shadow-black/40",
                cardHover: "hover:border-[#C9A24B]/50 hover:shadow-[0_20px_40px_rgba(201,162,75,0.2)]",
                tag: "Kawasan Industri Terpadu",
                badgeBg: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-600/30 dark:border-amber-400/30",
                dotColor: "bg-amber-500",
                longitude: facilityCoords.industrial ? facilityCoords.industrial[0] : 120.252,
                latitude: facilityCoords.industrial ? facilityCoords.industrial[1] : -3.125,
              },
              {
                id: "mpp",
                name: t("infrastructure.mppTitle"),
                desc: t("infrastructure.mppDesc"),
                type: "mpp",
                icon: ShieldCheck,
                rail: "via-emerald-500",
                ambientGlow: "bg-emerald-500/30",
                gradient: "from-emerald-500 via-emerald-600 to-teal-700",
                shadow: "shadow-black/40",
                cardHover: "hover:border-emerald-500/50 hover:shadow-[0_20px_40px_rgba(16,185,129,0.2)]",
                tag: "Mal Pelayanan Publik",
                badgeBg: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20",
                dotColor: "bg-emerald-500",
                longitude: facilityCoords.mpp ? facilityCoords.mpp[0] : 120.36547889067685,
                latitude: facilityCoords.mpp ? facilityCoords.mpp[1] : -3.394828505594006,
              }
            ];

            const invGeom = (selectedInvestmentId && investments.find((i) => i.id === selectedInvestmentId)?.geometry) || null;
            let invCenter = null;
            if (invGeom) {
              try {
                const center = turfCenter(invGeom);
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
              <div className="w-full">
                {/* Responsive 2x2 Grid on Mobile, 4-Column on Desktop for Maximum Visual Clarity */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 sm:gap-y-14 relative z-10 pt-8 sm:pt-12">
                  {mappedFacilities.map((facility, idx) => (
                    <motion.div
                      initial={isMobile ? false : { opacity: 0, y: 20 }}
                      style={{ willChange: "transform, opacity" }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.05 }}
                      transition={{ delay: idx * 0.1 }}
                      key={idx}
                      className={`group relative pt-10 xs:pt-12 sm:pt-16 pb-4 sm:pb-6 px-3 xs:px-4 sm:px-6 rounded-2xl sm:rounded-[28px] flex flex-col items-center text-center justify-between transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-900/20 bg-white/90 dark:bg-surface border border-slate-200/80 dark:border-white/10 w-full`}
                    >
                      {/* Top Subtle Accent Rail */}
                      <div className={`absolute top-0 inset-x-5 sm:inset-x-8 h-[3px] bg-gradient-to-r from-transparent ${facility.rail} to-transparent rounded-full`} />

                      {/* Overlapping Circular Medallion */}
                      <div className="absolute -top-7 xs:-top-8 sm:-top-11 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                        <div className="relative">
                          {/* Ambient Glow */}
                          <div className={`absolute inset-0 rounded-full ${facility.ambientGlow} blur-md transform group-hover:scale-115 transition-transform duration-300`} />
                          
                          {/* Outer Elevated Podium Ring */}
                          <div className={`relative w-14 h-14 xs:w-16 xs:h-16 sm:w-22 sm:h-22 rounded-full ring-2 sm:ring-[6px] ring-white dark:ring-[#0A2238] ${facility.shadow} bg-gradient-to-br ${facility.gradient} flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-105`}>
                            {/* Inner Delicate Ring Accent */}
                            <div className="absolute inset-1 sm:inset-1.5 rounded-full border border-white/30 pointer-events-none" />
                            <facility.icon size={22} className="sm:hidden relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" strokeWidth={2.2} />
                            <facility.icon size={34} className="hidden sm:block relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" strokeWidth={2.2} />
                          </div>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="w-full flex flex-col items-center flex-grow mt-1 sm:mt-2">
                        <h3 className="text-xs xs:text-sm sm:text-xl font-extrabold mb-1.5 sm:mb-2.5 tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                          {facility.name}
                        </h3>
                        <p
                          className="text-[10px] xs:text-xs sm:text-sm leading-snug sm:leading-relaxed text-slate-600 dark:text-slate-300 text-center flex-grow mb-3 sm:mb-4 line-clamp-3 sm:line-clamp-none font-normal"
                        >
                          {facility.desc}
                        </p>
                      </div>

                      {/* Bottom Info: Distance Calculation or Status Tag */}
                      <div className="w-full mt-auto pt-2.5 sm:pt-3.5 border-t border-slate-200/80 dark:border-white/10 flex flex-col items-center gap-1.5 sm:gap-2">
                        {facility.distanceKm !== null ? (
                          <div className="w-full flex items-center justify-between text-[9px] sm:text-[10px]">
                            <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              {t("distance.estimation", "Estimasi Jarak")}
                            </span>
                            <span className="font-mono font-black px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                              {facility.distanceKm.toFixed(1)} km
                            </span>
                          </div>
                        ) : (
                          <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8.5px] xs:text-[9.5px] sm:text-[10px] font-bold uppercase tracking-tight border shadow-xs ${facility.badgeBg} truncate max-w-full`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${facility.dotColor} animate-pulse shrink-0`} />
                            <span className="truncate">{facility.tag}</span>
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* INTERACTIVE ROADMAP & LICENSING GUIDE - REIMAGINED WITH FLOATING MEDALLIONS & EXECUTIVE DOSSIER */}
        <section id="roadmap-section" className="scroll-mt-20 sm:scroll-mt-24 py-6 sm:py-10 md:py-14 lg:py-18 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0A2238] relative overflow-hidden transition-all duration-500">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />

          <div className="container max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 min-h-[44px] rounded-full text-xs font-bold uppercase tracking-wider mb-4 border backdrop-blur-md shadow-xs bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30">
                <Compass size={14} className="text-sky-600 dark:text-sky-500 animate-spin-slow" /> {t("roadmap.tag", "Alur Legalitas & Regulasi Luwu")}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3 text-balance">
                {t("roadmap.title", "Panduan Regulasi & Roadmap Perizinan")}
              </h2>
              <div className="h-1.5 w-20 bg-emerald-500 rounded-full mb-4 mx-auto" />
              <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-medium">
                {t("roadmap.subtitle", "Kemudahan berinvestasi didukung integrasi digital perizinan satu pintu Kabupaten Luwu.")}
              </p>
            </div>

            {/* TOP HORIZONTAL MILESTONE PIPELINE TRACK (Interactive on all screens) */}
            <div className="mb-10 sm:mb-12 relative">
              {/* Connecting Pipeline Rail */}
              <div className="hidden sm:block absolute top-7 inset-x-12 lg:inset-x-20 h-1 bg-slate-200 dark:bg-slate-800 rounded-full z-0">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 rounded-full transition-all duration-500"
                  style={{ width: `${(activeRoadmapStep / (stepsData.length - 1)) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 relative z-10">
                {stepsData.map((step, idx) => {
                  const isActive = activeRoadmapStep === idx;
                  const isCompleted = activeRoadmapStep > idx;
                  const stepReqs = step.requirements;
                  const stepCheckedCount = stepReqs.filter((_, i) => !!checkedRequirements[`${idx}-${i}`]).length;

                  return (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      key={idx}
                      onClick={() => setActiveRoadmapStep(idx)}
                      className={`group p-2.5 xs:p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-center flex flex-col items-center justify-between transition-all duration-300 relative ${
                        isActive
                          ? "bg-emerald-50 dark:bg-[#0B2A20] border-emerald-400 dark:border-[rgba(201,162,75,0.45)] shadow-xl ring-2 ring-emerald-500/30"
                          : "bg-white dark:bg-surface/80 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-xs"
                      }`}
                    >
                      {/* Floating Circular Medallion */}
                      <div className="relative mb-2 sm:mb-3">
                        <div className={`absolute inset-0 rounded-full ${step.ambientGlow} blur-md transition-opacity duration-300 ${isActive ? "opacity-100 scale-110" : "opacity-0 group-hover:opacity-60"}`} />
                        <div
                          className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-mono font-bold text-xs sm:text-base relative z-10 transition-all duration-300 ${
                            isActive
                              ? `bg-gradient-to-br ${step.gradient} text-white ring-2 sm:ring-4 ring-white dark:ring-[#0A2238] ${step.shadow} scale-105`
                              : isCompleted
                              ? `bg-emerald-500 text-white ring-2 ring-emerald-400`
                              : `bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 group-hover:scale-105`
                          }`}
                        >
                          <div className="absolute inset-1 rounded-full border border-white/20 pointer-events-none" />
                          {isCompleted && !isActive ? (
                            <CheckCircle2 size={16} className="sm:hidden text-white" />
                          ) : isCompleted && !isActive ? (
                            <CheckCircle2 size={20} className="hidden sm:block text-white" />
                          ) : (
                            <span className="relative z-10">{step.num}</span>
                          )}
                        </div>
                      </div>

                      {/* Title & SLA Badge */}
                      <div className="w-full flex flex-col items-center">
                        <span className="text-[11px] xs:text-xs sm:text-sm font-bold tracking-tight text-slate-800 dark:text-white line-clamp-1 mb-1 sm:mb-1.5">
                          {step.title}
                        </span>
                        <div className="flex items-center gap-1 flex-wrap justify-center">
                          <span className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold border ${
                            isActive
                              ? step.badgeClass
                              : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10"
                          }`}>
                            <Clock size={9} className="shrink-0" />
                            <span className="truncate max-w-[80px] sm:max-w-none">{step.duration}</span>
                          </span>
                          {stepCheckedCount > 0 && (
                            <span className="px-1 py-0.5 rounded-md text-[8.5px] sm:text-[9px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-600/30">
                              {stepCheckedCount}/{stepReqs.length}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Active Indicator Pulse Dot */}
                      {isActive && (
                        <span className={`absolute -bottom-1 sm:-bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${step.dotColor} ring-2 ring-white dark:ring-[#0A2238] animate-pulse`} />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* MAIN CONTENT WORKSPACE: Left Stepper Track (Desktop) + Right Executive Dossier */}
            {(() => {
              const curStep = stepsData[activeRoadmapStep];
              const curReqs = curStep.requirements;
              const checkedCount = curReqs.filter((_, i) => !!checkedRequirements[`${activeRoadmapStep}-${i}`]).length;
              const completionPercent = Math.round((checkedCount / curReqs.length) * 100);
              const isAllChecked = checkedCount === curReqs.length;

              const toggleAll = () => {
                setCheckedRequirements((prev) => {
                  const updated = { ...prev };
                  curReqs.forEach((_, i) => {
                    updated[`${activeRoadmapStep}-${i}`] = !isAllChecked;
                  });
                  return updated;
                });
              };

              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch w-full">
                  {/* Left Column: Connected Vertical Pipeline (Desktop) */}
                  <div className="hidden lg:flex lg:col-span-5 flex-col gap-3.5 relative">
                    {/* Vertical Pipeline Rail Line */}
                    <div className="absolute left-[31px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-emerald-500 via-teal-500 to-sky-500 z-0 opacity-40" />

                    {stepsData.map((step, idx) => {
                      const isActive = activeRoadmapStep === idx;
                      const isCompleted = activeRoadmapStep > idx;

                      return (
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          key={idx}
                          onClick={() => setActiveRoadmapStep(idx)}
                          className={`w-full text-left p-4 rounded-2xl border flex items-center gap-4 transition-all duration-300 relative z-10 group ${
                            isActive
                              ? `bg-white dark:bg-[#0B2A20] border-[#C9A24B]/50 dark:border-[rgba(201,162,75,0.45)] shadow-lg ${step.shadow} ring-1 ring-[#C9A24B]/30`
                              : "bg-white dark:bg-surface/80 border-slate-200/90 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#08201A] shadow-xs"
                          }`}
                        >
                          {/* Active Top Accent Rail */}
                          {isActive && (
                            <div className={`absolute top-0 inset-x-6 h-[2px] bg-gradient-to-r from-transparent ${step.railColor} to-transparent rounded-full`} />
                          )}

                          {/* Medallion Node */}
                          <div className="relative shrink-0">
                            <div className={`absolute inset-0 rounded-full ${step.ambientGlow} blur-sm transition-opacity duration-300 ${isActive ? "opacity-100 scale-110" : "opacity-0 group-hover:opacity-50"}`} />
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center font-mono font-bold text-sm relative z-10 transition-all duration-300 ${
                                isActive
                                  ? `bg-gradient-to-br ${step.gradient} text-white ring-2 ring-white dark:ring-[#0A2238] ${step.shadow} scale-105`
                                  : isCompleted
                                  ? `bg-emerald-500 text-white ring-1 ring-emerald-400`
                                  : `bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10`
                              }`}
                            >
                              {isCompleted && !isActive ? (
                                <CheckCircle2 size={18} className="text-white" />
                              ) : (
                                step.num
                              )}
                            </div>
                          </div>

                          {/* Text Body */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h4 className={`text-sm font-bold tracking-tight truncate transition-colors ${isActive ? "text-slate-900 dark:text-white" : "text-slate-800 dark:text-slate-200"}`}>
                                {step.title}
                              </h4>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 border ${
                                isActive ? step.badgeClass : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10"
                              }`}>
                                {step.duration}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 truncate font-medium">{step.agency}</p>
                          </div>

                          {/* Chevron Indicator */}
                          <ChevronRight
                            size={16}
                            className={`shrink-0 transition-transform duration-300 ${
                              isActive ? "translate-x-1 text-sky-600 dark:text-sky-400" : "text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5"
                            }`}
                          />
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Right Column: Executive Digital Dossier */}
                  <div className="lg:col-span-7 col-span-1 w-full">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeRoadmapStep}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="p-3.5 xs:p-4.5 sm:p-7 md:p-8 rounded-2xl sm:rounded-[28px] border min-h-full flex flex-col justify-between relative overflow-hidden bg-white dark:bg-surface border-slate-200/90 dark:border-white/10 shadow-lg dark:shadow-2xl dark:shadow-black/40"
                      >
                        {/* Top Accent Gradient Rail */}
                        <div className={`absolute top-0 inset-x-6 sm:inset-x-10 h-[3px] bg-gradient-to-r from-transparent ${curStep.railColor} to-transparent rounded-full`} />

                        <div>
                          {/* Dossier Header with Symmetrical Responsive Layout */}
                          <div className="pb-4 sm:pb-6 mb-4 sm:mb-6 border-b border-slate-200 dark:border-white/10 flex flex-col gap-3">
                            {/* Top Meta Bar: Badge + Authority Code + SLA Chip */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`px-2.5 py-0.5 rounded-full text-[9.5px] sm:text-[11px] font-bold uppercase tracking-wider border ${curStep.badgeClass}`}>
                                  {curStep.tag}
                                </span>
                                <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                                  {curStep.authorityCode}
                                </span>
                              </div>

                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 shadow-xs shrink-0">
                                <Clock size={13} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
                                <span>{curStep.duration}</span>
                              </span>
                            </div>

                            {/* Main Title Row with Medallion Icon */}
                            <div className="flex items-center gap-3 sm:gap-4 mt-1">
                              {/* Medallion Icon */}
                              <div className="relative shrink-0">
                                <div className={`absolute inset-0 rounded-full ${curStep.ambientGlow} blur-md`} />
                                <div className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-full ring-2 sm:ring-4 ring-white dark:ring-surface ${curStep.shadow} bg-gradient-to-br ${curStep.gradient} flex items-center justify-center text-white`}>
                                  <div className="absolute inset-1 sm:inset-1.5 rounded-full border border-white/30 pointer-events-none" />
                                  <curStep.icon size={22} className="sm:hidden drop-shadow-md" strokeWidth={2.2} />
                                  <curStep.icon size={28} className="hidden sm:block drop-shadow-md" strokeWidth={2.2} />
                                </div>
                              </div>

                              {/* Title Text */}
                              <div className="min-w-0 flex-1">
                                <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                                  {curStep.long_title}
                                </h3>
                              </div>
                            </div>
                          </div>

                          {/* Legal Basis Callout Banner */}
                          <div className="mb-4 sm:mb-6 p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-elevated border border-slate-200/90 dark:border-white/10 flex items-start gap-2.5">
                            <ShieldCheck size={16} className="text-sky-700 dark:text-sky-400 shrink-0 mt-0.5" />
                            <div className="text-[11px] sm:text-xs leading-relaxed">
                              <span className="font-extrabold text-slate-900 dark:text-white mr-1.5">
                                Landasan Hukum & Regulasi:
                              </span>
                              <span className="text-slate-700 dark:text-slate-300 font-medium">
                                {curStep.legalBasis}
                              </span>
                            </div>
                          </div>

                          {/* Fast-Track Environmental Highlight (Environment Ready - Kementerian Investasi) */}
                          {curStep.num === "03" && (
                            <div className="mb-4 sm:mb-6 p-3.5 sm:p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
                              <Leaf size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                              <div className="text-xs leading-relaxed space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide text-[10px]">
                                    Pilar 5 • Environment Ready (Fast-Track AMDALNET)
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                    SLA SPPL Instan • UKL-UPL 10 Hari
                                  </span>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs font-medium">
                                  Dinas Lingkungan Hidup Kabupaten Luwu menyediakan desk asistensi digital percepatan persetujuan lingkungan. Usaha berisiko rendah langsung terbit SPPL otomatis melalui OSS-RBA, sementara izin UKL-UPL dan AMDAL diproses transparan dengan standar baku mutu lingkungan ketat dan perlindungan kawasan resapan air Luwu.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Narrative Description */}
                          <p className="text-xs xs:text-sm sm:text-base leading-relaxed mb-4 sm:mb-6 text-slate-700 dark:text-slate-300 font-medium">
                            {curStep.desc}
                          </p>

                          {/* Interactive Requirements Checklist Workspace */}
                          <div className="p-3 xs:p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-elevated border border-slate-200/90 dark:border-white/10 mb-4 sm:mb-6">
                            {/* Checklist Header Responsive Row */}
                            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 mb-2.5">
                              <div className="flex items-center justify-between xs:justify-start gap-2 w-full xs:w-auto">
                                <h4 className="text-[11px] sm:text-xs uppercase tracking-wider font-extrabold text-slate-900 dark:text-white truncate">
                                  {t("roadmap.reqHeader", "Berkas Persyaratan Wajib:")}
                                </h4>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-mono font-bold shrink-0 ${
                                  isAllChecked
                                    ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700"
                                    : "bg-sky-50 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-700"
                                }`}>
                                  {checkedCount}/{curReqs.length} Siap ({completionPercent}%)
                                </span>
                              </div>
                              <button
                                onClick={toggleAll}
                                className="text-[10.5px] sm:text-[11px] font-bold text-sky-700 dark:text-sky-400 hover:underline cursor-pointer self-end xs:self-auto shrink-0"
                              >
                                {isAllChecked ? "Batal Semua" : "Centang Semua"}
                              </button>
                            </div>

                            {/* Progress Indicator Rail */}
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mb-3.5 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 rounded-full transition-all duration-300"
                                style={{ width: `${completionPercent}%` }}
                              />
                            </div>

                            {/* 4 Interactive Check Items */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                              {curReqs.map((chk, i) => {
                                const isChecked = !!checkedRequirements[`${activeRoadmapStep}-${i}`];

                                return (
                                  <div
                                    key={i}
                                    onClick={() => toggleRequirement(activeRoadmapStep, i)}
                                    className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl border flex items-start gap-2.5 text-xs sm:text-sm cursor-pointer transition-all duration-200 select-none ${
                                      isChecked
                                        ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200 shadow-xs"
                                        : "bg-white dark:bg-surface border-slate-200/90 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-white/20 shadow-xs"
                                    }`}
                                  >
                                    <div
                                      className={`w-4 h-4 rounded-md flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                                        isChecked
                                          ? "bg-emerald-600 dark:bg-emerald-500 text-white"
                                          : "border border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-slate-800"
                                      }`}
                                    >
                                      {isChecked && <CheckCircle2 size={12} className="text-white" />}
                                    </div>
                                    <span className="leading-snug flex-1 font-bold break-words text-[11.5px] sm:text-xs text-slate-900 dark:text-slate-100">
                                      {chk}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Direct Government Portals & VIP Consultation Footer */}
                        <div className="pt-4 sm:pt-5 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                          <div className="flex flex-col xs:flex-row items-center gap-2 w-full sm:w-auto">
                            {curStep.portalUrl && (
                              <a
                                href={curStep.portalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r ${curStep.gradient} shadow-md hover:opacity-90 transition-opacity w-full sm:w-auto min-h-[40px]`}
                              >
                                <span>{curStep.portalLabel}</span>
                                <ExternalLink size={14} />
                              </a>
                            )}
                            <a
                              href="https://wa.me/6281142011"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors w-full sm:w-auto border border-slate-200 dark:border-white/10 min-h-[40px]"
                            >
                              <MessageSquare size={14} className="text-emerald-700 dark:text-emerald-400" />
                              <span>{t("roadmap.contactMpp", "Konsultasi MPP Luwu")}</span>
                            </a>
                          </div>

                          {/* Prev / Next Step Controls */}
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                            <button
                              disabled={activeRoadmapStep === 0}
                              onClick={() => setActiveRoadmapStep((prev) => Math.max(0, prev - 1))}
                              className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors min-h-[40px] flex items-center justify-center"
                            >
                              ← Sebelumnya
                            </button>
                            <button
                              disabled={activeRoadmapStep === stepsData.length - 1}
                              onClick={() => setActiveRoadmapStep((prev) => Math.min(stepsData.length - 1, prev + 1))}
                              className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#0F6B4F] hover:bg-[#1F9D74] dark:bg-[#1F9D74] dark:hover:bg-[#0F6B4F] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[40px] flex items-center justify-center shadow-md cursor-pointer"
                            >
                              Selanjutnya →
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              );
            })()}
          </div>
        </section>

        {/* ICONIC SECTION: MAL PELAYANAN PUBLIK (MPP) SIMPURUSIANG - SOVEREIGN GLASS PAVILION */}
        <section
          id="mpp-showcase-section"
          className={`scroll-mt-20 sm:scroll-mt-24 py-10 sm:py-14 md:py-16 lg:py-20 pb-16 sm:pb-20 md:pb-24 border-y relative overflow-hidden z-10 ${
            isDark
              ? "border-emerald-500/20 bg-[#090d16]"
              : "border-slate-200/80 bg-gradient-to-b from-slate-50/80 via-white to-emerald-50/30"
          }`}
        >
          {/* Ambient Glowing Atmospheric Elements */}
          <div className="absolute top-1/4 left-1/12 w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-400/20 rounded-full blur-[130px] pointer-events-none" />
          <div className="absolute bottom-10 right-1/12 w-[600px] h-[600px] bg-sky-500/10 dark:bg-sky-400/15 rounded-full blur-[140px] pointer-events-none" />

          <div className="container max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
            {/* Top Sovereign Header Badge */}
            <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
              <span className={`inline-flex items-center gap-2 px-4 py-1.5 min-h-[44px] rounded-full text-xs font-bold uppercase tracking-wider mb-4 border backdrop-blur-md shadow-xs ${
                isDark
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                  : "bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 font-extrabold shadow-xs"
              }`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                {t("mppBanner.tag", "Pelayanan Terpadu Satu Pintu Kabupaten Luwu")}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3 text-balance">
                <span className="text-slate-900 dark:text-white">
                  {t("mppBanner.title", "Mal Pelayanan Publik (MPP) Simpurusiang")}
                </span>
              </h2>
              <div className="h-1.5 w-24 bg-emerald-600 dark:bg-emerald-500 rounded-full mb-4 mx-auto" />
              <p className={`text-sm sm:text-base leading-relaxed ${textMuted} max-w-2xl mx-auto`}>
                Pusat akselerasi perizinan investasi terpadu dan modern. Mengintegrasikan administrasi perizinan, tata ruang, dan pengawasan dalam satu atap fisik dan digital.
              </p>
            </div>

            {/* MAIN SOVEREIGN SHOWCASE CARD */}
            <motion.div
              initial={isMobile ? false : { opacity: 0, y: 20 }}
              style={{ willChange: "transform, opacity" }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.05 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="p-4 sm:p-8 lg:p-12 pb-8 sm:pb-10 rounded-[28px] sm:rounded-[32px] relative overflow-hidden transition-all duration-500 bg-white/90 dark:bg-surface/75 glass-crystal backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 shadow-2xl shadow-slate-200/50 dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] z-10"
            >
              {/* Subtle tech background line grid */}
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:32px_32px]" />

              {/* Floating Status Accent Bar */}
              <div className="absolute top-0 inset-x-12 h-[3px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent rounded-full" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
                {/* LEFT COLUMN: Strategic Value Propositions & Actions */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-5 sm:space-y-6">
                  {/* Live Operation Status Pill */}
                  <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 w-fit">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Layanan Prima Beroperasi • Senin - Jumat (08.00 - 15.30 WITA)</span>
                  </div>

                  <p className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300 font-normal">
                    {t("mppBanner.desc", "Mempercepat perizinan investasi yang komprehensif dan modern di Kabupaten Luwu. Mengintegrasikan seluruh administrasi perizinan, pengelolaan kesesuaian ruang, dan pengawasan investasi dalam satu lokasi fisik, didukung penuh oleh platform GIS digital interaktif ini.")}
                  </p>

                  {/* 3 SOVEREIGN KEY PILLARS (Optically Balanced & Symmetrical Bento Grid) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {/* Pilar 1: 21 Instansi */}
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 glass-crystal glass-card-interactive border border-slate-200/80 dark:border-white/10 flex flex-row sm:flex-col items-center sm:items-start gap-3.5 sm:gap-2 justify-between group hover:border-emerald-400 dark:hover:border-emerald-500/50 transition-all shadow-xs">
                      <div className="w-10 h-10 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center sm:mb-2 shadow-xs group-hover:scale-105 transition-transform shrink-0">
                        <Building2 size={18} />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col text-left">
                        <span className="text-xs sm:text-xs font-bold text-slate-900 dark:text-white leading-snug">
                          21 Instansi Terpadu
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-tight">
                          DPMPTSP, Pajak, BPN, Imigrasi, Samsat
                        </span>
                      </div>
                      <div className="sm:hidden w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors shrink-0">
                        <ChevronRight size={14} />
                      </div>
                    </div>

                    {/* Pilar 2: Fast-Track OSS */}
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 glass-crystal glass-card-interactive border border-slate-200/80 dark:border-white/10 flex flex-row sm:flex-col items-center sm:items-start gap-3.5 sm:gap-2 justify-between group hover:border-sky-400 dark:hover:border-sky-500/50 transition-all shadow-xs">
                      <div className="w-10 h-10 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center sm:mb-2 shadow-xs group-hover:scale-105 transition-transform shrink-0">
                        <Zap size={18} />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col text-left">
                        <span className="text-xs sm:text-xs font-bold text-slate-900 dark:text-white leading-snug">
                          Fast-Track OSS & GIS
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-tight">
                          Penerbitan NIB & Validasi Ruang Instan
                        </span>
                      </div>
                      <div className="sm:hidden w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-slate-400 group-hover:text-sky-500 transition-colors shrink-0">
                        <ChevronRight size={14} />
                      </div>
                    </div>

                    {/* Pilar 3: Klinik Investasi VIP */}
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 glass-crystal glass-card-interactive border border-slate-200/80 dark:border-white/10 flex flex-row sm:flex-col items-center sm:items-start gap-3.5 sm:gap-2 justify-between group hover:border-teal-400 dark:hover:border-teal-500/50 transition-all shadow-xs">
                      <div className="w-10 h-10 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center sm:mb-2 shadow-xs group-hover:scale-105 transition-transform shrink-0">
                        <Award size={18} />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col text-left">
                        <span className="text-xs sm:text-xs font-bold text-slate-900 dark:text-white leading-snug">
                          Klinik Investasi VIP
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-tight">
                          Konsultasi 1-on-1 & Pendampingan Lahan
                        </span>
                      </div>
                      <div className="sm:hidden w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-slate-400 group-hover:text-teal-500 transition-colors shrink-0">
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  </div>

                  {/* DUAL ACTION BUTTON BAR */}
                  <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      whileHover={{ scale: 1.01 }}
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
                      className="relative overflow-hidden py-3.5 px-6 min-h-[48px] inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-sm tracking-wide rounded-2xl border border-emerald-400/40 shadow-lg shadow-black/25 active:scale-[0.98] transition-all duration-300 cursor-pointer group"
                    >
                      {/* Subtle white-gold shimmer sweep */}
                      <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none animate-shimmer-sweep" />
                      <Building2 size={18} className="transition-transform group-hover:scale-110 relative z-10" />
                      <span className="relative z-10">Masuk Portal MPP Simpurusiang</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 relative z-10" />
                    </motion.button>

                    <a
                      href="https://wa.me/6281142011"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-3.5 px-5 min-h-[48px] inline-flex items-center justify-center gap-2 text-emerald-950 dark:text-emerald-200 bg-emerald-500/10 dark:bg-emerald-950/50 hover:bg-emerald-500/15 dark:hover:bg-emerald-900/60 font-semibold text-xs rounded-2xl border border-emerald-500/30 dark:border-emerald-500/40 shadow-xs backdrop-blur-md transition-all group"
                    >
                      <MessageSquare size={16} className="text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                      <span>Konsultasi Front Office (WhatsApp)</span>
                    </a>
                  </div>
                </div>

                {/* RIGHT COLUMN: FRONT OFFICE SHOWCASE (CLEAN OFFICER CUTOUT) */}
                <div className="lg:col-span-5 flex flex-col items-center justify-end relative w-full pt-4 lg:pt-0 self-end">
                  <div className="relative flex flex-col items-center justify-end w-full max-w-sm sm:max-w-md">

                    {/* Single Unified Floating Status Badge */}
                    <div className="w-full flex items-center justify-center mb-3 relative z-20">
                      <div className="px-4 py-1.5 rounded-full bg-white/95 dark:bg-[#0A2238]/90 text-slate-800 dark:text-slate-100 border border-emerald-500/40 dark:border-emerald-400/40 shadow-xl shadow-slate-900/10 dark:shadow-black/25 backdrop-blur-xl flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600 dark:bg-emerald-500"></span>
                        </span>
                        <span className="text-[10.5px] sm:text-xs font-bold tracking-wide text-slate-800 dark:text-slate-100 flex items-center gap-1.5 font-sans">
                          <span className="text-emerald-700 dark:text-emerald-400 font-extrabold font-mono">21 Instansi</span>
                          <span className="text-slate-400 dark:text-slate-500">•</span>
                          <span className="text-slate-700 dark:text-slate-200">Fast-Track OSS-RBA</span>
                        </span>
                      </div>
                    </div>

                    {/* Staff Photos Container with Smooth Elevation */}
                    {(() => {
                      const LOCAL_FALLBACK_OFFICER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 320' fill='none'%3E%3Crect width='240' height='320' rx='24' fill='%230f172a' fill-opacity='0.08'/%3E%3Ccircle cx='120' cy='95' r='42' fill='%2310b981' fill-opacity='0.25' stroke='%23059669' stroke-width='2'/%3E%3Cpath d='M45 280 C45 200, 80 160, 120 160 C160 160, 195 200, 195 280 Z' fill='%2310b981' fill-opacity='0.2' stroke='%23059669' stroke-width='2'/%3E%3C/svg%3E";
                      const finalLeft = staffImageLeft || LOCAL_FALLBACK_OFFICER;
                      const finalRight = staffImageRight || LOCAL_FALLBACK_OFFICER;

                      return (
                        <div className="flex items-end justify-center gap-1 sm:gap-3 w-full relative z-10 px-2">
                          {/* Petugas Front Office Kiri */}
                          <div className="relative flex-1 flex flex-col items-center justify-end group">
                            <img
                              src={finalLeft}
                              alt="Petugas Front Office DPMPTSP MPP Simpurusiang (Kiri)"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = LOCAL_FALLBACK_OFFICER;
                              }}
                              className="w-full max-h-72 sm:max-h-80 md:max-h-92 object-contain object-bottom bg-transparent transition-transform duration-500 group-hover:scale-105 drop-shadow-[0_12px_24px_rgba(0,0,0,0.25)] dark:drop-shadow-[0_14px_28px_rgba(0,0,0,0.7)]"
                            />
                          </div>

                          {/* Petugas Front Office Kanan */}
                          <div className="relative flex-1 flex flex-col items-center justify-end group">
                            <img
                              src={finalRight}
                              alt="Petugas Front Office DPMPTSP MPP Simpurusiang (Kanan)"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = LOCAL_FALLBACK_OFFICER;
                              }}
                              className="w-full max-h-72 sm:max-h-80 md:max-h-92 object-contain object-bottom bg-transparent transition-transform duration-500 group-hover:scale-105 drop-shadow-[0_12px_24px_rgba(0,0,0,0.25)] dark:drop-shadow-[0_14px_28px_rgba(0,0,0,0.7)]"
                            />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Elegant Frosted Pedestal Plinth at Base */}
                    <div className="w-full relative z-20 -mt-3 sm:-mt-4">
                      <div className="mx-auto w-[94%] sm:w-[90%] p-2 sm:p-2.5 rounded-2xl bg-white/95 dark:bg-surface/90 border border-slate-200/80 dark:border-white/15 shadow-xl shadow-slate-950/10 dark:shadow-black/40 backdrop-blur-xl flex items-center justify-between gap-2 transition-all">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                            <BadgeCheck size={14} className="sm:scale-110" />
                          </div>
                          <div className="flex flex-col min-w-0 text-left">
                            <span className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                              Front Office DPMPTSP Kab. Luwu
                            </span>
                            <span className="text-[9.5px] sm:text-[10px] text-emerald-700 dark:text-emerald-400 font-bold leading-none mt-0.5">
                              Hospitality & Layanan Terpadu
                            </span>
                          </div>
                        </div>
                        <span className="hidden xs:inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shrink-0">
                          Siap Melayani
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* QUICK STATS RIBBON AT CARD BOTTOM - Symmetrical 2x2 Bento Grid on Mobile */}
              <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
                {/* Stat 1: 21 Instansi */}
                <div className="p-3 sm:p-4 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-700/60 shadow-xs flex items-start gap-2.5 sm:gap-3 transition-all hover:border-emerald-400 dark:hover:border-emerald-500/50">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 size={18} className="sm:hidden" />
                    <Building2 size={20} className="hidden sm:block" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs xs:text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono leading-snug truncate">
                      21 Instansi
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      Pusat, Daerah & BUMN
                    </div>
                  </div>
                </div>

                {/* Stat 2: 100+ Layanan */}
                <div className="p-3 sm:p-4 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-700/60 shadow-xs flex items-start gap-2.5 sm:gap-3 transition-all hover:border-sky-400 dark:hover:border-sky-500/50">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText size={18} className="sm:hidden" />
                    <FileText size={20} className="hidden sm:block" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs xs:text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono leading-snug truncate">
                      100+ Layanan
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      Administrasi & Izin Usaha
                    </div>
                  </div>
                </div>

                {/* Stat 3: 4.85 / 5.0 */}
                <div className="p-3 sm:p-4 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-700/60 shadow-xs flex items-start gap-2.5 sm:gap-3 transition-all hover:border-teal-400 dark:hover:border-teal-500/50">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Award size={18} className="sm:hidden" />
                    <Award size={20} className="hidden sm:block" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs xs:text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono leading-snug truncate">
                      4.85 / 5.0
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      Indeks Kepuasan (IKM)
                    </div>
                  </div>
                </div>

                {/* Stat 4: Rp 0 (Nol) */}
                <div className="p-3 sm:p-4 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-700/60 shadow-xs flex items-start gap-2.5 sm:gap-3 transition-all hover:border-teal-400 dark:hover:border-teal-500/50">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck size={18} className="sm:hidden" />
                    <ShieldCheck size={20} className="hidden sm:block" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs xs:text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono leading-snug truncate">
                      Rp 0 (Nol)
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      Transparan Tanpa Pungli
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 5. SHOWCASE TEKNOLOGI AI & CALCULATOR */}
        <div
          id="ai-calculator-section"
          className={`scroll-mt-20 sm:scroll-mt-24 pt-6 pb-4 sm:pt-8 sm:pb-6 md:pt-12 md:pb-8 lg:pt-16 lg:pb-8 border-t relative ${isDark ? "border-slate-800" : "border-slate-200"}`}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none hidden dark:block">
            <div className="absolute top-[10%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-emerald-500/5 blur-[120px] mix-blend-screen" />
            <div className="absolute bottom-[20%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-blue-500/5 blur-[100px] mix-blend-screen" />
          </div>
          <div className="container max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 md:mb-16">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-amber-500/10 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-600/30 dark:border-amber-400/30 shadow-xs mb-3">
                <Sparkles size={13} className="text-amber-700 dark:text-amber-300" />
                <span>Simulasi Kelayakan & Finansial</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif-display font-semibold tracking-tight text-slate-900 dark:text-white mb-2">
                {t("sections.intel.title")}
              </h2>
              <div className="gold-divider-diamond">
                <span className="gold-diamond-icon" />
              </div>
              <p className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-200 font-medium">
                {t("sections.intel.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* KALKULATOR ROI */}
              <motion.div
                initial={isMobile ? false : { opacity: 0, y: 20 }}
                style={{ willChange: "transform, opacity" }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.05 }}
                className="lg:col-span-12 p-2 sm:p-6 md:p-8 !px-3 sm:!px-6 md:!px-8 rounded-2xl md:rounded-3xl border overflow-hidden h-full flex flex-col bg-white/95 dark:bg-surface/90 backdrop-blur-xl border-slate-200/90 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-black/60 transition-all duration-500"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center gap-3.5 md:gap-5 mb-5 md:mb-8 border-b pb-4 md:pb-6 border-slate-200/80 dark:border-white/10">
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div
                      className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl backdrop-blur-md border shadow-sm shrink-0 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 dark:border-emerald-400/40"
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
                  {roiResult && (
                    <div className={`mt-2 md:mt-0 w-full md:w-auto flex justify-center md:ml-auto items-center gap-2 px-3.5 py-1.5 min-h-[38px] rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-md border shadow-sm transition-all
                      ${!selectedInvestmentId
                        ? 'bg-sky-500/10 text-sky-700 border-sky-500/20 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-400/30'
                        : roiResult.status === 'FEASIBLE'
                          ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-400/40 shadow-xs'
                          : roiResult.status === 'NOT_FEASIBLE'
                            ? 'bg-amber-500/10 text-amber-800 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-400/30'
                            : 'bg-blue-500/10 text-blue-800 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-400/40'}`}>
                      <span className={`w-2 h-2 rounded-full shadow-sm
                        ${!selectedInvestmentId ? 'bg-sky-500 dark:bg-sky-400 animate-pulse'
                          : roiResult.status === 'FEASIBLE' ? 'bg-emerald-600 dark:bg-emerald-400 animate-pulse'
                          : roiResult.status === 'NOT_FEASIBLE' ? 'bg-amber-500 dark:bg-amber-400' : 'bg-blue-600 dark:bg-blue-400 animate-pulse'}`} />
                      {!selectedInvestmentId
                        ? t('roiSimulator.readyStatus', '⚡ Siap Simulasi • Pilih Potensi')
                        : roiResult.status === 'FEASIBLE'
                          ? t('feasible', 'Sangat Layak (Feasible)')
                          : roiResult.status === 'NOT_FEASIBLE'
                            ? t('financial.needsAdjustment', 'Perlu Penyesuaian Asumsi')
                            : t('moderate_zone', 'Zona Moderat / Cukup Layak')}
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
                        className="mt-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface/80 overflow-hidden shadow-sm"
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
                          <div className="p-1 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0">
                            {isProfileExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-700 dark:text-slate-300" />
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
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10">
                                  <div className="space-y-0.5">
                                    <div className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">{t('sector_title', 'Sektor')}</div>
                                    <div className="font-bold text-emerald-700 dark:text-emerald-400 truncate">
                                      {t(getSectorI18nKey(selectedInvObj.sector))}
                                    </div>
                                  </div>
                                  <div className="space-y-0.5">
                                    <div className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">{t('district', 'Kecamatan')}</div>
                                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                      {districts.find((d) => d.id === selectedInvObj.districtId)?.name || "-"}
                                    </div>
                                  </div>
                                  <div className="space-y-0.5">
                                    <div className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">{t('village', 'Desa/Kelurahan')}</div>
                                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                      {villages.find((v) => v.id === selectedInvObj.villageId)?.name || "-"}
                                    </div>
                                  </div>
                                  <div className="space-y-0.5">
                                    <div className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">{t('land_area', 'Luas Lahan')}</div>
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
                          {t('annual_production_volume', 'Total Volume Produksi / Tahun')}
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
                          {t('daily_production_volume', 'Volume Produksi / Hari')}
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
                          {t('active_days_per_month', 'Hari Operasional / Bulan')}
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
                          {t('monthly_production_volume', 'Total Volume Produksi / Bulan')}
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
                  <div className="md:col-span-2 border-t pt-6 border-slate-200 dark:border-white/10 mt-2">
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <h4 className="text-sm font-bold flex items-center gap-2 text-blue-700 dark:text-sky-400">
                        <TrendingUp size={16} />{t('financial.parameterTitle', 'Parameter Ekonomi & Asumsi Pasar')}
                      </h4>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
                        Sentuh preset untuk penyesuaian cepat
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      {/* WACC */}
                      <div className="p-3 sm:p-4 rounded-xl border bg-slate-50/80 dark:bg-elevated border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                              {t('financial.inputWacc', 'Suku Bunga / WACC')}
                            </label>
                            <span className="text-xs font-black text-sky-700 dark:text-sky-400 font-mono">{discountRate}%</span>
                          </div>
                          <div className="relative mb-2">
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
                              className={`w-full px-3.5 py-2.5 min-h-[42px] rounded-lg border font-bold text-sm outline-none transition-all ${inputBg}`}
                            />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                          </div>
                          {/* Tactile Preset Chips */}
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { label: "8%", val: 8 },
                              { label: "10% BI", val: 10 },
                              { label: "12%", val: 12 },
                              { label: "14%", val: 14 }
                            ].map((chip) => (
                              <button
                                key={chip.val}
                                type="button"
                                onClick={() => setDiscountRate(chip.val)}
                                className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all border ${
                                  discountRate === chip.val
                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                    : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-white/10 dark:hover:bg-slate-700"
                                }`}
                              >
                                {chip.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-2 block">{t('financial.descWacc')}</span>
                      </div>

                      {/* Tenor */}
                      <div className="p-3 sm:p-4 rounded-xl border bg-slate-50/80 dark:bg-elevated border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                              {t('financial.inputTenor', 'Tenor Proyeksi')}
                            </label>
                            <span className="text-xs font-black text-sky-700 dark:text-sky-400 font-mono">{projectionTenor} Thn</span>
                          </div>
                          <div className="relative mb-2">
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
                              className={`w-full px-3.5 py-2.5 min-h-[42px] rounded-lg border font-bold text-sm outline-none transition-all ${inputBg}`}
                            />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">Thn</span>
                          </div>
                          {/* Tactile Preset Chips */}
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { label: "3 Thn", val: 3 },
                              { label: "5 Thn", val: 5 },
                              { label: "8 Thn", val: 8 },
                              { label: "10 Thn", val: 10 },
                            ].map((chip) => (
                              <button
                                key={chip.val}
                                type="button"
                                onClick={() => setProjectionTenor(chip.val)}
                                className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all border ${
                                  projectionTenor === chip.val
                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                    : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-white/10 dark:hover:bg-slate-700"
                                }`}
                              >
                                {chip.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-2 block">{t('financial.descTenor')}</span>
                      </div>

                      {/* Inflasi */}
                      <div className="p-3 sm:p-4 rounded-xl border bg-slate-50/80 dark:bg-elevated border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                              {t('financial.inputInflation', 'Laju Inflasi')}
                            </label>
                            <span className="text-xs font-black text-sky-700 dark:text-sky-400 font-mono">{inflationRate}%</span>
                          </div>
                          <div className="relative mb-2">
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
                              className={`w-full px-3.5 py-2.5 min-h-[42px] rounded-lg border font-bold text-sm outline-none transition-all ${inputBg}`}
                            />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                          </div>
                          {/* Tactile Preset Chips */}
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { label: "2.5%", val: 2.5 },
                              { label: "4.5% Luwu", val: 4.5 },
                              { label: "6.0%", val: 6.0 },
                            ].map((chip) => (
                              <button
                                key={chip.val}
                                type="button"
                                onClick={() => setInflationRate(chip.val)}
                                className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all border ${
                                  inflationRate === chip.val
                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                    : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-white/10 dark:hover:bg-slate-700"
                                }`}
                              >
                                {chip.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-2 block">{t('financial.descInflation')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <motion.button whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => calculateROI(true)}
                  className="w-full mb-8 py-5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-base sm:text-lg tracking-wider uppercase flex items-center justify-center gap-3 transition-all duration-300 backdrop-blur-xl border border-emerald-400/40 shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.45)] cursor-pointer"
                >
                  <BarChart3 size={24} />
                  {t('financial.btnCalculate')}
                </motion.button>

                <AnimatePresence>
                  {isCalculating && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="overflow-hidden mb-6"
                    >
                      <div
                        className="p-6 rounded-2xl border bg-slate-50 dark:bg-surface/80 border-slate-200 dark:border-white/10"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
                          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
                          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse col-span-full"></div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {!isCalculating && roiResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div
                        className="p-0 sm:p-5 md:p-6 rounded-none sm:rounded-3xl border-0 sm:border bg-transparent sm:bg-slate-50/60 dark:sm:bg-surface/50 sm:border-slate-200/90 dark:sm:border-white/10 sm:backdrop-blur-xl"
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
                            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl mb-4 backdrop-blur-xl border bg-white/95 dark:bg-surface border-slate-200/90 dark:border-white/10 shadow-lg shadow-slate-200/50 dark:shadow-black/40">
                              {/* Gauge */}
                              <div className="flex items-center gap-4 sm:flex-col sm:justify-center shrink-0">
                                <div className="relative w-[96px] h-[96px] sm:w-[110px] sm:h-[110px]">
                                  <svg viewBox="0 0 110 110" className="w-full h-full">
                                    <circle cx="55" cy="55" r={R} fill="none"
                                            className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="9"/>
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
                                    <span className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: scoreColor }}>
                                      <AnimatedNumberValue value={score} decimals={0} />
                                    </span>
                                    <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-300">
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
                                <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-elevated border border-slate-200/90 dark:border-white/10 flex flex-col justify-between">
                                  <div className="text-[10px] sm:text-xs uppercase tracking-wider mb-0.5 font-bold text-slate-500 dark:text-slate-400 truncate">{t("landing.annualRoi", "ROI Tahunan")}</div>
                                  <div className="text-sm xs:text-base sm:text-lg md:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                                    <AnimatedNumberValue value={roiResult.roi} suffix="%" />
                                  </div>
                                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                                    {projectionTenor}th: <AnimatedNumberValue value={roiResult.cumulativeRoi} suffix="%" />
                                  </div>
                                </div>
                                <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-elevated border border-slate-200/90 dark:border-white/10 flex flex-col justify-between">
                                  <div className="text-[10px] sm:text-xs uppercase tracking-wider mb-0.5 font-bold text-slate-500 dark:text-slate-400 truncate">{t("landing.netProfit", "Net Profit")}</div>
                                  <div className="text-sm xs:text-base sm:text-lg md:text-xl font-black text-sky-700 dark:text-sky-400 font-mono tracking-tight whitespace-nowrap">
                                    <AnimatedNumberValue value={roiResult.netProfit} formatFn={formatRupiahKompak} />
                                  </div>
                                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">{t("landing.perYearNet", "Per tahun bersih")}</div>
                                </div>
                                <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-elevated border border-slate-200/90 dark:border-white/10 flex flex-col justify-between">
                                  <div className="text-[10px] sm:text-xs uppercase tracking-wider mb-0.5 font-bold text-slate-500 dark:text-slate-400 truncate">NPV ({discountRate}%)</div>
                                  <div className={`text-sm xs:text-base sm:text-lg md:text-xl font-black font-mono tracking-tight whitespace-nowrap ${roiResult.npv >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    <AnimatedNumberValue value={roiResult.npv} formatFn={(val) => `${val >= 0 ? '+' : ''}${formatRupiahKompak(val)}`} />
                                  </div>
                                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">Net Present Value</div>
                                </div>
                                <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-elevated border border-slate-200/90 dark:border-white/10 flex flex-col justify-between">
                                  <div className="text-[10px] sm:text-xs uppercase tracking-wider mb-0.5 font-bold text-slate-500 dark:text-slate-400 truncate">IRR</div>
                                  <div className={`text-sm xs:text-base sm:text-lg md:text-xl font-black font-mono tracking-tight ${roiResult.irr >= discountRate ? 'text-emerald-600 dark:text-emerald-400' : roiResult.irr >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    <AnimatedNumberValue value={roiResult.irr} suffix="%" />
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
                                ? "bg-emerald-50/90 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-500/30 shadow-sm dark:shadow-lg dark:shadow-black/20"
                                : "bg-amber-50/90 border-amber-200 dark:bg-amber-950/30 dark:border-amber-500/30 shadow-sm dark:shadow-lg dark:shadow-black/20"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                  {t('financial.estRoiTitle', 'Estimasi ROI')}
                                </span>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-500/20">
                                  {roiResult.roi >= 10 ? 'Menguntungkan' : 'Moderat'}
                                </span>
                              </div>
                              <div className="space-y-2 mt-3">
                                <div className="flex items-center justify-between border-b border-dashed border-slate-200 dark:border-white/10 pb-2">
                                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{t('financial.roiAnnual', 'ROI Tahunan')}</span>
                                  <span className={`font-black font-mono text-base sm:text-lg ${roiResult.roi >= 10 ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
                                    <AnimatedNumberValue value={roiResult.roi} suffix="%" />
                                  </span>
                                </div>
                                <div className="flex items-center justify-between pt-0.5">
                                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{t('financial.roiCumulativeDynamic', { years: projectionTenor })}</span>
                                  <span className="font-black font-mono text-base sm:text-lg text-emerald-700 dark:text-emerald-400">
                                    <AnimatedNumberValue value={roiResult.cumulativeRoi} suffix="%" />
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Card 2: Periode Pengembalian Modal (BEP) */}
                          <div
                            className="p-4 sm:p-5 rounded-2xl border flex flex-col justify-between backdrop-blur-md transition-all bg-white dark:bg-surface border-slate-200/90 dark:border-white/10 shadow-sm dark:shadow-lg dark:shadow-black/20"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                  {t("roiSimulator.paybackPeriod", "Periode Pengembalian Modal")} (BEP)
                                </span>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-500/20">
                                  Tenor: {projectionTenor} Thn
                                </span>
                              </div>
                              <div className="space-y-2 mt-3">
                                <div className="flex items-center justify-between border-b border-dashed border-slate-200 dark:border-white/10 pb-2">
                                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{t('financial.paybackSimple', 'Payback Sederhana')}</span>
                                  <span className="font-black font-mono text-sm sm:text-base text-[#10261E] dark:text-[#F6F1E4]">
                                    {roiResult.payback > 99 ? t('financial.statusNotRecovered', 'Belum Kembali') : `${roiResult.payback.toFixed(2)} Tahun`}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between pt-0.5">
                                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{t('financial.paybackDiscountedDynamic', { rate: discountRate })}</span>
                                  <span className={`font-black font-mono text-sm sm:text-base ${roiResult.discountedPayback <= projectionTenor ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                    {roiResult.discountedPayback > projectionTenor ? t('financial.statusNotRecovered', 'Belum Kembali') : `${roiResult.discountedPayback.toFixed(2)} Tahun`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Card 3: Status & Indeks Kelayakan */}
                          <div
                            className="p-4 sm:p-5 rounded-2xl border flex flex-col justify-between backdrop-blur-md transition-all bg-white dark:bg-surface border-slate-200/90 dark:border-white/10 shadow-sm dark:shadow-lg dark:shadow-black/20"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                  {t("roiSimulator.feasibility", "Status Kelayakan")}
                                </span>
                              </div>
                              <div className="mt-3 space-y-2.5">
                                <div
                                  className={`px-3 py-2 rounded-xl text-center font-bold text-xs sm:text-sm flex items-center justify-center gap-2 ${
                                    (roiResult.npv > 0 && roiResult.irr >= discountRate)
                                      ? "bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30"
                                      : !(roiResult.npv > 0 && roiResult.irr >= discountRate) && !(roiResult.netProfit <= 0 || roiResult.npv < 0 || roiResult.irr < 0)
                                        ? "bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-[#0B2A20] dark:text-[#C9A24B] dark:border-[rgba(201,162,75,0.30)]"
                                        : "bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30"
                                  }`}
                                >
                                  <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                                  <span>
                                    {roiResult.status === "FEASIBLE"
                                      ? t("financial.statusFeasible", "Sangat Layak & Feasible")
                                      : roiResult.status === "NOT_FEASIBLE"
                                        ? t("financial.statusNeedsAdjustment", "Perlu Penyesuaian Asumsi")
                                        : t("financial.statusModerate", "Zona Moderat / Cukup Layak")}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center font-medium">
                                  Berdasarkan tolok ukur suku bunga {discountRate}% & inflasi {inflationRate}%
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Card 4: Nilai Tambah & Imbal Hasil (NPV & IRR) */}
                          <div
                            className="p-4 sm:p-5 rounded-2xl border flex flex-col justify-between backdrop-blur-md transition-all bg-[#FAF7F0] border-[rgba(160,122,40,0.22)] dark:bg-[#0B2A20] dark:border-[rgba(201,162,75,0.30)] shadow-sm dark:shadow-lg dark:shadow-black/20"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-[#A07A28] dark:text-[#C9A24B]">
                                  {t('financial.valueReturn', 'Nilai Tambah & Return')}
                                </span>
                              </div>
                              <div className="space-y-2 mt-3">
                                <div className="flex items-center justify-between border-b border-dashed border-[rgba(160,122,40,0.20)] dark:border-[rgba(201,162,75,0.20)] pb-2">
                                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">NPV ({discountRate}%)</span>
                                  <span className={`font-black font-mono text-sm sm:text-base tracking-tight whitespace-nowrap ${roiResult.npv >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    <AnimatedNumberValue value={roiResult.npv} formatFn={(val) => `${val >= 0 ? '+' : ''}${formatRupiahKompak(val)}`} />
                                  </span>
                                </div>
                                <div className="flex items-center justify-between pt-0.5">
                                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Internal Rate (IRR)</span>
                                  <span className={`font-black font-mono text-sm sm:text-base tracking-tight ${roiResult.irr >= 10 ? "text-emerald-700 dark:text-emerald-400" : roiResult.irr >= 0 ? "text-amber-700 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}>
                                    <AnimatedNumberValue value={roiResult.irr} suffix="%" />
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Analisis Sensitivitas NPV (Lebar Penuh) */}
                          <div className="col-span-full mt-2">
                            <div
                              className="p-4 sm:p-5 rounded-2xl border backdrop-blur-xl transition-all bg-white/95 dark:bg-surface border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-sm dark:shadow-lg dark:shadow-black/20"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-4">
                                <div>
                                  <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#A07A28] dark:text-[#C9A24B] flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-[#A07A28] dark:text-[#C9A24B]" />
                                    {t('financial.sensitivityTitle', 'Uji Sensitivitas NPV')}
                                  </h4>
                                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{t('financial.sensitivitySubtitle', 'Ketahanan terhadap variasi inflasi dan biaya')}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                    Real-time ⚡
                                  </span>
                                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{t("financial.unitMillionRp", "Satuan: Juta Rp")}</span>
                                </div>
                              </div>

                              {sensitivityChartData.length > 0 && (() => {
                                // Match the data point closest to user's active discountRate
                                const targetPoint = sensitivityChartData.find(d => Math.abs(d.rateVal - discountRate) <= 1) || 
                                  sensitivityChartData[Math.floor(sensitivityChartData.length / 2)] || {};
                                const baseline = targetPoint['Baseline'] ?? (roiResult ? Math.round(roiResult.npv / 1e6) : 0);
                                const highInfl = targetPoint['Inflasi Tinggi (+5%)'] ?? baseline;
                                const noInfl   = targetPoint['Tanpa Inflasi (0%)'] ?? baseline;
                                const capMillion = (parseFloat(capital) || 0) / 1e6;
                                // Scale relative to project investment scale so normal deviations don't fill 100% of the bar width
                                const maxAbs = Math.max(Math.abs(baseline), Math.abs(highInfl), Math.abs(noInfl), capMillion * 0.4, 1);

                                const diffHigh = highInfl - baseline;
                                const diffNoInfl = noInfl - baseline;

                                const rows = [
                                  { 
                                    label: `${t("financial.baseline", "Baseline")} (${inflationRate}%)`, 
                                    value: baseline, 
                                    color: '#059669',
                                    badge: t("financial.benchmark", 'Tolok Ukur'),
                                    badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                  },
                                  { 
                                    label: t("financial.highInflation", "Inflasi tinggi (+5%)"), 
                                    value: highInfl, 
                                    color: '#e11d48',
                                    badge: `Δ ${diffHigh >= 0 ? '+' : ''}${diffHigh.toFixed(0)} Jt`,
                                    badgeColor: diffHigh >= 0 ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                                  },
                                  { 
                                    label: t("financial.noInflation", "Tanpa inflasi (0%)"), 
                                    value: noInfl, 
                                    color: '#10b981',
                                    badge: `Δ ${diffNoInfl >= 0 ? '+' : ''}${diffNoInfl.toFixed(0)} Jt`,
                                    badgeColor: diffNoInfl >= 0 ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                                  },
                                ];
                                return (
                                  <div className="flex flex-col gap-3">
                                    {/* Diverging Axis Legend */}
                                    <div className="flex items-center text-[9.5px] font-mono font-semibold text-slate-500 dark:text-slate-400 px-1">
                                      <span className="w-32 sm:w-40 shrink-0">{t("financial.scenario", "Skenario")}</span>
                                      <div className="flex-1 flex justify-between px-1">
                                        <span>{t("financial.deficit", "- Defisit")}</span>
                                        <span className="text-slate-600 dark:text-slate-300 font-bold">{t("financial.breakeven", "0 (Impas)")}</span>
                                        <span>{t("financial.surplus", "+ Surplus")}</span>
                                      </div>
                                      <span className="w-20 text-right">{t("financial.npvValue", "Nilai NPV")}</span>
                                    </div>

                                    {rows.map((row, i) => {
                                      const isPos = row.value >= 0;
                                      const magnitudePct = Math.min(100, (Math.abs(row.value) / maxAbs) * 100);

                                      return (
                                        <div key={i} className="flex items-center gap-2 sm:gap-3">
                                          <div className="w-32 sm:w-40 shrink-0 flex items-center gap-1.5 min-w-0">
                                            <span className="text-[11px] font-medium text-slate-800 dark:text-slate-300 truncate">{row.label}</span>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 hidden xs:inline-block ${row.badgeColor}`}>{row.badge}</span>
                                          </div>
                                          
                                          {/* Diverging Bar Track */}
                                          <div className="flex-1 h-3 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800/90 relative flex items-center border border-slate-200/80 dark:border-slate-700/60">
                                            {/* Center 0 Line */}
                                            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-300 dark:bg-slate-600 z-10" />

                                            {/* Left (Negative) Container */}
                                            <div className="w-1/2 h-full flex justify-end">
                                              {!isPos && (
                                                <div
                                                  className="h-full bg-rose-500 rounded-l transition-all duration-500"
                                                  style={{
                                                    width: `${magnitudePct}%`,
                                                    transitionDelay: shouldReduceMotion ? '0ms' : `${i * 60}ms`,
                                                  }}
                                                />
                                              )}
                                            </div>

                                            {/* Right (Positive) Container */}
                                            <div className="w-1/2 h-full flex justify-start">
                                              {isPos && (
                                                <div
                                                  className="h-full bg-emerald-500 rounded-r transition-all duration-500"
                                                  style={{
                                                    width: `${magnitudePct}%`,
                                                    transitionDelay: shouldReduceMotion ? '0ms' : `${i * 60}ms`,
                                                  }}
                                                />
                                              )}
                                            </div>
                                          </div>

                                          <span className={`text-[11px] font-bold font-mono w-20 text-right shrink-0 tabular-nums ${row.value >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                            {row.value >= 0 ? '+' : ''}{row.value.toLocaleString('id-ID')} Jt
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()}

                              {/* Executive Summary Briefing */}
                              <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div className="p-3 rounded-xl bg-[#FAF7F0] dark:bg-[#0B2A20] border border-[rgba(160,122,40,0.25)] dark:border-[rgba(201,162,75,0.25)] text-[11px] space-y-1">
                                  <div className="font-bold text-[#10261E] dark:text-[#F6F1E4] flex items-center gap-1.5">
                                    <span>🛡️ {t("financial.resilienceWacc", "Resiliensi Biaya Modal (WACC)")}</span>
                                  </div>
                                  <p className="text-slate-700 dark:text-slate-300 text-[10.5px] leading-relaxed">
                                    {t("financial.resilienceDesc", "Batas imbal hasil internal (IRR) proyek mencapai {irr}% vs suku bunga acuan {rate}%.")
                                      .replace('{irr}', (roiResult?.irr || 0).toFixed(1))
                                      .replace('{rate}', String(discountRate))}
                                  </p>
                                </div>
                                <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/10 text-[11px] space-y-1">
                                  <div className="font-bold text-emerald-900 dark:text-emerald-400 flex items-center gap-1.5">
                                    <span>📈 {t("financial.inflationHedging", "Ketahanan Inflasi Komoditas")}</span>
                                  </div>
                                  <p className="text-slate-700 dark:text-slate-300 text-[10.5px] leading-relaxed">
                                    {t("financial.inflationDesc", "Simulasi menguji volatilitas harga hingga {inflation}% guna memastikan kesinambungan operasional di Kab. Luwu.")
                                      .replace('{inflation}', (inflationRate + 5).toFixed(1))}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Tombol AI & Analisis Lanjutan (Mobile Optimized & Symmetrical) */}
                          <div className="col-span-full mt-4 pt-5 border-t border-slate-200 dark:border-slate-500/15 flex flex-col gap-4">
                            {/* 1. Baris Dua CTA Utama (Primary Action Row) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <motion.button whileTap={{ scale: 0.97 }}
                                whileHover={{ scale: 1.01 }}
                                onClick={() => setIsRoiAiModalOpen(true)}
                                className="w-full min-h-[50px] py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-black/25 border border-emerald-400/30"
                              >
                                <Bot className="w-5 h-5 text-emerald-200 shrink-0" />
                                <span>{t("roiSimulator.askAi", "Minta Analisis Kelayakan AI")} ✨</span>
                              </motion.button>

                              <motion.button whileTap={{ scale: 0.97 }}
                                whileHover={{ scale: 1.01 }}
                                onClick={() => {
                                  handleRequestFullscreen();
                                  navigate("/login?role=investor");
                                }}
                                className="w-full min-h-[50px] py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-slate-900/30 border border-slate-700/80 group"
                              >
                                <UserPlus className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                                <span>{t("landing.loginInvestor", "Login Investor (Fitur Lengkap)")}</span>
                              </motion.button>
                            </div>

                            {/* 2. Referensi & Peralatan Analisis Lanjutan (Unified Glass Grid) */}
                            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-surface/60 border border-slate-200 dark:border-white/10 flex flex-col gap-2.5">
                              <div className="flex items-center justify-between px-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-sans flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  Peralatan & Referensi Investasi Terpadu
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => setIsSpatialAiModalOpen(true)}
                                  className="min-h-[44px] py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 dark:bg-slate-800/90 dark:hover:bg-emerald-950/40 dark:text-slate-200 dark:hover:text-emerald-300 dark:border-white/10 dark:hover:border-emerald-500/40 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                                >
                                  <Compass size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  <span className="line-clamp-2 leading-tight text-center">{t('roiSimulator.analyzePotential', 'Analisis Spasial GIS')}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setIsIproPitchModalOpen(true)}
                                  className="min-h-[44px] py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 dark:bg-slate-800/90 dark:hover:bg-emerald-950/40 dark:text-slate-200 dark:hover:text-emerald-300 dark:border-white/10 dark:hover:border-emerald-500/40 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                                >
                                  <Building2 size={16} className="text-teal-600 dark:text-teal-400 shrink-0" />
                                  <span className="line-clamp-2 leading-tight text-center">Pitch Deck IPRO BKPM</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setIsRtrwModalOpen(true)}
                                  className="min-h-[44px] py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 dark:bg-slate-800/90 dark:hover:bg-emerald-950/40 dark:text-slate-200 dark:hover:text-emerald-300 dark:border-white/10 dark:hover:border-emerald-500/40 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                                >
                                  <ShieldCheck size={16} className="text-sky-600 dark:text-sky-400 shrink-0" />
                                  <span className="line-clamp-2 leading-tight text-center">{t('rtrwZoning.button', 'Zona Spasial RTRW')}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setIsIncentiveModalOpen(true)}
                                  className="min-h-[44px] py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 dark:bg-slate-800/90 dark:hover:bg-emerald-950/40 dark:text-slate-200 dark:hover:text-emerald-300 dark:border-white/10 dark:hover:border-emerald-500/40 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                                >
                                  <Award size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  <span className="line-clamp-2 leading-tight text-center">{t('incentiveCalculator.button', 'Insentif Fiskal Perda')}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* FINANCING READY: SKEMA PEMBIAYAAN & KPBU KABUPATEN LUWU */}
            <div className="mt-10 sm:mt-12">
              <FinancingKpbuSection
                isDark={isDark}
                onOpenIncentiveModal={() => setIsIncentiveModalOpen(true)}
                onOpenConsultation={() => setIsFastTrackConsultationOpen(true)}
              />
            </div>
          </div>
        </div>

        {/* Kisah Sukses Investor */}
        <TestimonialSection isDark={isDark} />

        {/* LOCAL ECONOMY READY: KEMITRAAN UMKM & DIREKTORI PEMASOK DAERAH */}
        <LocalPartnershipSection
          isDark={isDark}
          onOpenConsultation={() => setIsFastTrackConsultationOpen(true)}
        />

        {/* Akuntabilitas Kinerja DPMPTSP */}
        <section className={`relative py-16 sm:py-24 border-t transition-colors duration-500 ${isDark ? "bg-[#06130F] border-[rgba(201,162,75,0.25)]" : "bg-[#FAF7F0] border-[rgba(160,122,40,0.22)]"}`}>
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 relative z-10 max-w-5xl">
            <div className="text-center mb-10 sm:mb-12">
              <div className="invest-eyebrow mb-2">
                <Activity size={13} className="text-[#A07A28] dark:text-[#C9A24B]" />
                <span>{t("performance.tag", "Transparansi & Akuntabilitas Kinerja")}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-2.5 text-slate-900 dark:text-white">
                {t("performance.title", "Akuntabilitas Kinerja DPMPTSP Kabupaten Luwu")}
              </h3>
              <div className="h-1 w-20 bg-emerald-600 dark:bg-emerald-500 rounded-full mb-3 mx-auto" />
              <p className="text-xs sm:text-sm font-medium max-w-2xl mx-auto text-slate-600 dark:text-slate-300">
                {t("performance.subtitle", "Laporan transparan capaian Indeks Kepuasan Masyarakat (IKM) serta standar tingkat layanan (SLA) perizinan terpadu.")}
              </p>
            </div>
            
            <div className={`rounded-3xl border overflow-hidden backdrop-blur-md shadow-xl ${
              isDark 
                ? "bg-[#0B2A20]/90 border-[rgba(201,162,75,0.25)] shadow-black/80" 
                : "bg-white/95 border-[rgba(160,122,40,0.22)] shadow-slate-200/50"
            }`}>
              {/* Header Bar */}
              <div className={`p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b ${
                isDark ? "bg-[#08201A] border-[rgba(201,162,75,0.20)]" : "bg-[#F3EEDF]/60 border-[rgba(160,122,40,0.18)]"
              }`}>
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                    isDark ? "bg-[#0B2A20] text-[#C9A24B] border border-[rgba(201,162,75,0.30)]" : "bg-white text-[#A07A28] border border-[rgba(160,122,40,0.25)]"
                  }`}>
                    <ShieldCheck size={26} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{t("performance.title", "Indikator Utama Layanan DPMPTSP")}</h4>
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" /> TERHUBUNG POSTGIS SUPABASE
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{t("performance.subtitle", "Monitoring SLA & Kepuasan Publik Sesuai Permenpan RB")}</p>
                  </div>
                </div>

                <div className={`flex items-center gap-2 text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-xl self-start sm:self-auto shadow-xs border ${
                  isDark ? "bg-[#0B2A20] text-amber-300 border-amber-500/30" : "bg-white text-amber-800 border-amber-600/30"
                }`}>
                  <BadgeCheck size={14} className="text-amber-700 dark:text-amber-400" /> Permenpan RB Framework
                </div>
              </div>

              {/* Performance Metric Pods */}
              <div className={`divide-y ${isDark ? "divide-[rgba(201,162,75,0.15)]" : "divide-[rgba(160,122,40,0.15)]"}`}>
                {[
                  { 
                    icon: Award,
                    title: t("performance.ikmTitle", "Indeks Kepuasan Masyarakat (IKM)"), 
                    desc: t("performance.ikmDesc", "Survei Berkala Kepuasan Publik Sesuai Permenpan RB No. 14/2017"),
                    tag: "Survei Publik Active",
                    color: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
                    val: "88.54 / 100",
                    badge: "Sangat Baik (A)",
                    badgeColor: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-500/30"
                  },
                  { 
                    icon: Zap,
                    title: t("performance.slaTitle", "SLA Penerbitan NIB & Izin Usaha"), 
                    desc: t("performance.slaDesc", "Pemrosesan Izin Risiko Rendah Instan & Verifikasi Berkas Lanjutan"),
                    tag: "OSS-RBA Engine",
                    color: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                    val: "98.6% Tepat Waktu",
                    badge: "Standar Prima (SLA < 24 Jam)",
                    badgeColor: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-600/30 dark:border-amber-400/30"
                  },
                  { 
                    icon: Compass,
                    title: t("performance.spatialTitle", "Akurasi Verifikasi Tata Ruang Spasial"), 
                    desc: t("performance.spatialDesc", "Kesesuaian Plotting Koordinat Lahan dengan RTRW Kabupaten Luwu"),
                    tag: "PostGIS Precision",
                    color: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
                    val: "100% Valid Spasial",
                    badge: "Peta RTRW Presisi",
                    badgeColor: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
                  }
                ].map((item, idx) => (
                  <div key={idx} className={`p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    isDark ? "hover:bg-[#08201A]/60" : "hover:bg-[#F3EEDF]/40"
                  }`}>
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${item.color}`}>
                        <item.icon size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h5 className="font-bold text-xs sm:text-sm text-[#10261E] dark:text-[#F6F1E4]">{item.title}</h5>
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md border ${
                            isDark ? "bg-[#08201A] text-[#B9C4BC] border-[rgba(201,162,75,0.20)]" : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}>{item.tag}</span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">{item.desc}</p>
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-white/5 shrink-0">
                      <span className="text-xs sm:text-sm font-extrabold text-[#10261E] dark:text-[#F6F1E4] font-mono">{item.val}</span>
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Ekosistem DPMPTSP (Sovereign Glass Pavilion Style) */}
        <section className={`relative py-16 sm:py-24 border-t transition-colors duration-500 ${isDark ? "bg-[#08201A] border-[rgba(201,162,75,0.25)]" : "bg-[#F3EEDF]/70 border-[rgba(160,122,40,0.22)]"}`}>
          <div className="container mx-auto px-3 sm:px-6 lg:px-8 relative z-10 max-w-6xl">
            <div className="text-center mb-12 sm:mb-16">
              <div className="invest-eyebrow mb-2">
                <Layers size={13} className="text-[#A07A28] dark:text-[#C9A24B]" />
                <span>Sinergi Layanan Lintas Sektor</span>
              </div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-2.5 text-slate-900 dark:text-white">
                {t("ecosystem.title", "Ekosistem DPMPTSP Kabupaten Luwu")}
              </h3>
              <div className="h-1 w-20 bg-emerald-600 dark:bg-emerald-500 rounded-full mb-3 mx-auto" />
              <p className="text-xs sm:text-sm font-bold max-w-2xl mx-auto uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                {t("ecosystem.subtitle", "Sinergi Layanan Terpadu 4 Bidang Strategis")}
              </p>
            </div>
            
            {/* 2x2 Grid on Mobile, 4-Column on Desktop for Symmetric Perfection */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6 relative">
              {[
                { 
                  icon: Megaphone, 
                  title: t("ecosystem.promotionTitle", "Bidang Promosi"), 
                  desc: t("ecosystem.promotionDesc", "Penjaringan & Verifikasi Minat (LoI)"), 
                  color: "text-amber-700 dark:text-amber-400", 
                  bg: "bg-amber-500/10 border-amber-600/30 dark:border-amber-400/30",
                  rail: "from-[#0F6B4F] via-[#C9A24B] to-[#1F9D74]",
                  badge: "Respon Real-Time",
                  badgeColor: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-600/30 dark:border-amber-400/30"
                },
                { 
                  icon: ShieldCheck, 
                  title: t("ecosystem.dalakTitle", "Bidang Dalak"), 
                  desc: t("ecosystem.dalakDesc", "Kawal Site Visit & Mediasi Lahan"), 
                  color: "text-teal-600 dark:text-teal-300", 
                  bg: "bg-teal-500/10 border-teal-500/20",
                  rail: "from-teal-500 via-emerald-400 to-teal-600",
                  badge: "Kawal 100% On-Site",
                  badgeColor: "bg-teal-500/10 text-teal-800 dark:text-teal-300 border-teal-500/20"
                },
                { 
                  icon: Stamp, 
                  title: t("ecosystem.licensingTitle", "Bidang Perizinan"), 
                  desc: t("ecosystem.licensingDesc", "Eksekusi Legalitas & OSS-RBA"), 
                  color: "text-emerald-600 dark:text-emerald-400", 
                  bg: "bg-emerald-500/10 border-emerald-500/20",
                  rail: "from-emerald-500 via-teal-400 to-emerald-600",
                  badge: "Persetujuan Instan OSS",
                  badgeColor: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-500/20"
                },
                { 
                  icon: BarChart3, 
                  title: t("ecosystem.dataTitle", "Bidang Data"), 
                  desc: t("ecosystem.dataDesc", "Pusat Komando & Dashboard Eksekutif"), 
                  color: "text-amber-700 dark:text-amber-400", 
                  bg: "bg-amber-500/10 border-amber-600/30 dark:border-amber-400/30",
                  rail: "from-[#C9A24B] via-[#1F9D74] to-[#0F6B4F]",
                  badge: "Live Command Center",
                  badgeColor: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-600/30 dark:border-amber-400/30"
                }
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className={`group relative rounded-2xl sm:rounded-3xl border p-3 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 overflow-hidden backdrop-blur-md shadow-md ${
                    isDark 
                      ? "bg-[#0B2A20]/90 border-[rgba(201,162,75,0.25)] hover:border-[rgba(201,162,75,0.45)] shadow-black/40" 
                      : "bg-white/95 border-[rgba(160,122,40,0.22)] hover:border-[rgba(160,122,40,0.40)] shadow-slate-200/40"
                  }`}
                >
                  {/* Top Glowing Rail Accent Line */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.rail}`} />
                  
                  <div>
                    {/* Badge Pill */}
                    <div className="flex justify-between items-center mb-2 sm:mb-4 gap-1">
                      <span className={`px-1.5 py-0.5 rounded-full text-[8px] xs:text-[9px] sm:text-[10px] font-bold uppercase tracking-tight border truncate max-w-[80%] ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-mono text-slate-500 dark:text-slate-400 shrink-0">0{idx + 1}</span>
                    </div>

                    {/* Icon Header Box */}
                    <div className="flex justify-center my-1.5 sm:my-3">
                      <div className={`w-11 h-11 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center border ${item.bg} ${item.color} shadow-inner transition-transform duration-300 group-hover:scale-110`}>
                        <item.icon className="w-5.5 h-5.5 sm:w-8 sm:h-8" />
                      </div>
                    </div>

                    {/* Content Title & Subtitle */}
                    <div className="text-center mt-2 sm:mt-3">
                      <h5 className="font-bold text-[11px] xs:text-xs sm:text-base leading-tight tracking-tight mb-1.5 text-slate-900 dark:text-white">
                        {item.title}
                      </h5>
                      <p className="text-[9.5px] xs:text-[10px] sm:text-xs text-slate-600 dark:text-slate-300 leading-snug min-h-[28px] sm:min-h-[32px]">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Footer Accent */}
                  <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-[rgba(201,162,75,0.15)] dark:border-[rgba(201,162,75,0.20)] flex items-center justify-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] font-semibold text-[#A07A28] dark:text-[#C9A24B] group-hover:translate-x-0.5 transition-transform">
                    <span>Terintegrasi System</span>
                    <ChevronRight size={11} className="shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Widget Prakiraan Cuaca Wilayah Luwu (Tepat Diatas Footer) */}
        <section id="weather-section" className={`scroll-mt-20 sm:scroll-mt-24 relative py-8 sm:py-10 border-t transition-colors duration-500 ${isDark ? "bg-[#040812] border-white/10" : "bg-white border-slate-200"}`}>
          <div className="container mx-auto px-3 sm:px-6 max-w-4xl flex flex-col items-center justify-center">
            <div className="w-full max-w-2xl">
              <WeatherWidget />
            </div>
          </div>
        </section>

        {/* BURSA KOMODITAS - LIVE MARKET TICKER SECTION (Elegant Bottom Page Section) */}
        <section id="bursa-komoditas-section" className={`scroll-mt-20 sm:scroll-mt-24 relative py-6 sm:py-8 border-t transition-colors duration-500 ${isDark ? "bg-[#03060d] border-white/10" : "bg-slate-50 border-slate-200"}`}>
          <div className="container mx-auto px-3 sm:px-6 max-w-7xl">
            <div className="flex flex-col items-center mb-3">
              <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-[#00FF99] border border-emerald-500/20 text-[10px] font-bold tracking-wider uppercase font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Bursa Komoditas Kabupaten Luwu
              </div>
            </div>
            <div className={`w-full flex justify-center py-1.5 rounded-2xl border backdrop-blur-md shadow-md transition-colors duration-500 ${isDark ? "bg-surface/60 border-white/5" : "bg-white/60 border-slate-200"}`}>
              <LiveMarketTicker
                isDark={isDark}
                onSelectCommodity={handleSelectCommodityFromTicker}
                onSimulateRoi={() => scrollToSection("analytics-section")}
              />
            </div>
          </div>
        </section>

        {/* Footer Component */}
        <Footer
          isDark={isDark}
          onNavigateSection={scrollToSection}
          onNavigatePage={(path) => navigate(path)}
        />
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/85 dark:bg-[#0A2238]/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-white/[0.09] px-3 py-1.5 flex items-center justify-around shadow-2xl shadow-black/40 pb-[calc(env(safe-area-inset-bottom,0px)+6px)]">
        <button onClick={() => document.getElementById('hero-section')?.scrollIntoView({ behavior: 'smooth' })} className="flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 active:text-emerald-500 min-h-[48px] min-w-[50px] transition-colors">
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold font-sans">{t("nav.home", "Beranda")}</span>
        </button>

        <button onClick={() => document.getElementById('potensi-section')?.scrollIntoView({ behavior: 'smooth' })} className="flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 active:text-emerald-500 min-h-[48px] min-w-[50px] transition-colors">
          <Map className="w-5 h-5" />
          <span className="text-[10px] font-semibold font-sans">{t("nav.potensi", "Potensi")}</span>
        </button>

        {/* Elevated Center Action: Peta Spasial GIS (Aksi Utama Bernilai Tinggi) */}
        <div className="relative -top-4 flex flex-col items-center">
          <motion.div 
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="relative flex items-center justify-center"
          >
            <motion.button 
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={(e: any) => handleGisClick(e, "default")}
              className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-950/40 border-[3px] border-white dark:border-[#0A2238] active:brightness-110 transition-transform cursor-pointer"
              title={t("nav.gisMap", "Peta Spasial GIS")}
            >
              <Globe className="w-5 h-5 text-white" />
            </motion.button>
          </motion.div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-sans mt-1 tracking-wide">
            {t("nav.gisMap", "Peta GIS")}
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

      {/* Floating Action Navigation (Back to Top) */}
      <AnimatePresence>
        {scrollY > 500 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 15 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Kembali ke Atas"
            title="Kembali ke Atas"
            className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-50 p-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-lg shadow-emerald-900/30 transition-all rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-[#0A2238] hover:scale-110 cursor-pointer"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* GIS Spatial Engine Transition Loader */}
      <AnimatePresence>
        {isGisBooting && (
          <GisTransitionLoader onComplete={handleGisComplete} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
