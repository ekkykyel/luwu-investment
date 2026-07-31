import { useNavigate } from "react-router-dom";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { isMobileOrAndroidDevice } from "../hooks/useDeviceAutomation.js";
import { requestSmartFullscreen } from "../utils/fullscreen.js";
import {
  ChevronRight,
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
  Award,
  Navigation,
  Building2,
} from "lucide-react";
import { Role, Investment, District, SektorInvestasi } from "../types.js";
import { OssRoiSimulatorInputs } from "./OssRoiSimulatorInputs.js";
import { supabase } from "../lib/supabaseClient.js";
import RoiAiAnalysisModal from "./RoiAiAnalysisModal.js";
import LuwuInvestmentAiModal from "./LuwuInvestmentAiModal.js";
import RtrwZoningCheckerModal from "./RtrwZoningCheckerModal.js";
import IncentiveCalculatorModal from "./IncentiveCalculatorModal.js";
import ProximityDistanceMatrixModal from "./ProximityDistanceMatrixModal.js";
import SmartMatrixFilterPanel, { SmartFilterState } from "./SmartMatrixFilterPanel.js";

import TickerMarquee from "./TickerMarquee.js";
import TestimonialSection from "./TestimonialSection.js";
import { AnalitikSpasialSection } from "./AnalitikSpasialSection.js";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import LazyImage from "./LazyImage.js";
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
import LanguageSwitcher from "./LanguageSwitcher.js";

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
}

const umkmData = [
  {
    id: 1,
    nama_produk: "Kopi Bisang (Kopi Arabika Latimojong)",
    nama_produk_en: "Bisang Coffee (Latimojong Arabica Coffee)",
    nama_produk_zh: "Bisang 咖啡 (Latimojong 阿拉比卡咖啡)",
    kategori: "Kuliner",
    kategori_en: "Culinary",
    kategori_zh: "烹饪美食",
    bahan: "100% Biji Kopi Arabika Pilihan dari Pegunungan Latimojong",
    bahan_en: "100% Selected Arabica Coffee Beans from Latimojong Mountains",
    bahan_zh: "100% 精选 Latimojong 高山阿拉比卡咖啡豆",
    status_izin: "BPOM RI MD 12345678",
    harga: "Rp 75.000 / 250gr",
    nama_pemilik: "Pak Budi",
    alamat: "Desa Latimojong, Kec. Bua, Kab. Luwu",
    alamat_en: "Latimojong Village, Bua District, Luwu Regency",
    alamat_zh: "鲁乌县 Bua 区 Latimojong 村",
    no_wa: "6281234567890",
    image: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: 2,
    nama_produk: "Cokelat Luwu (Olahan Kakao Suli)",
    nama_produk_en: "Luwu Chocolate (Suli Cacao Processing)",
    nama_produk_zh: "鲁乌巧克力 (Suli 可可加工)",
    kategori: "Kuliner",
    kategori_en: "Culinary",
    kategori_zh: "烹饪美食",
    bahan: "100% Kakao Asli Pilihan dari Perkebunan Suli",
    bahan_en: "100% Selected Authentic Cacao from Suli Plantations",
    bahan_zh: "100% 精选自 Suli 种植园的纯正可可",
    status_izin: "P-IRT No. 2097317010123-26",
    harga: "Rp 35.000 / 100gr",
    nama_pemilik: "Ibu Ani",
    alamat: "Kecamatan Suli, Kab. Luwu",
    alamat_en: "Suli District, Luwu Regency",
    alamat_zh: "鲁乌县 Suli 区",
    no_wa: "6281234567890",
    image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: 3,
    nama_produk: "Kerajinan Anyaman Sagu",
    nama_produk_en: "Sago Woven Crafts",
    nama_produk_zh: "西米编织工艺品",
    kategori: "Kriya/Kerajinan",
    kategori_en: "Crafts",
    kategori_zh: "手工艺品",
    bahan: "100% Anyaman Sagu Pilihan",
    bahan_en: "100% Selected Sago Woven",
    bahan_zh: "100% 精选西米编织",
    status_izin: "NIB: 1234567890123",
    harga: "Mulai Rp 150.000",
    nama_pemilik: "KUB Sejahtera",
    alamat: "Desa Pompengan, Kab. Luwu",
    alamat_en: "Pompengan Village, Luwu Regency",
    alamat_zh: "鲁乌县 Pompengan 村",
    no_wa: "6281234567890",
    image: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&q=80&w=600"
  }];

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
  investments = [],
  districts = [],
  villages = [],
  infrastructure = [],
  isDarkMode = true,
  setIsDarkMode,
  stats,
  onSelectInvestment,
  isLoading = false,
}: LandingPageProps) {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language?.startsWith("zh");
  const isEn = i18n.language?.startsWith("en");
  const [isDark, setLocalIsDark] = useState(isDarkMode);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedUMKM, setSelectedUMKM] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState("Semua");

  const handleShareUMKM = async (umkm: any) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Produk Unggulan Luwu: ${umkm.nama_produk}`,
          text: `Cek produk UMKM premium dari Kab. Luwu: ${umkm.nama_produk} seharga ${umkm.harga}.`,
          url: window.location.href,
        });
      } catch (error) {

      }
    } else {
      navigator.clipboard.writeText(`Cek produk UMKM Luwu: ${umkm.nama_produk} - Hubungi: ${umkm.no_wa}`);

    }
  };

  const [isMobile, setIsMobile] = useState(false);
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
        const { data: infraData } = await supabase.from('gis_infrastruktur').select('geom, nama_infrastruktur');
        const { data: zonasiData } = await supabase.from('gis_zonasi').select('geom, keterangan').eq('keterangan', 'Kawasan Industri');
        
        const coords: Record<string, [number, number]> = {};
        if (infraData) {
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

  const handleRequestFullscreen = () => {
    requestSmartFullscreen();
  };

  const handleLaunchApp = () => {
    // Called when the user taps after launcher ready
    handleRequestFullscreen();
    setShowLauncher(false);
  };

  const handleExitFullscreen = () => {
    if (document.exitFullscreen) {
      document
        .exitFullscreen()
        .catch((err) => undefined);
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
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
    // Auto-fullscreen ONLY for Android / Smartphone / Mobile devices.
    // Explicitly disabled on Desktop / Laptop / PC browsers to save memory and maintain desktop aspect ratios.
    if (!isMobileOrAndroidDevice()) {
      return;
    }

    // Immediate fullscreen attempt on page load
    try {
      handleRequestFullscreen();
    } catch (e) {}

    const handleInteractionFullscreen = () => {
      const lastExit = (window as any).__lastExitFullscreenTime || 0;
      if (Date.now() - lastExit < 3000) return;
      if (!document.fullscreenElement) {
        handleRequestFullscreen();
      }
    };

    window.addEventListener("click", handleInteractionFullscreen, { capture: true, passive: true });
    window.addEventListener("touchstart", handleInteractionFullscreen, { capture: true, passive: true });

    return () => {
      window.removeEventListener("click", handleInteractionFullscreen, { capture: true });
      window.removeEventListener("touchstart", handleInteractionFullscreen, { capture: true });
    };
  }, []);

  useEffect(() => {
    async function fetchHeroImages() {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("setting_value, setting_key")
          .in("setting_key", ["hero_slider_images", "hero_image_url", "staff_image_left", "staff_image_right"]);
        if (error) throw error;
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
            setHeroImages([
              "https://via.placeholder.com/1920x1080/0f172a/10b981?text=InvestLuwu+Placeholder",
            ]);
          }
        } else {
          setHeroImages([
            "https://via.placeholder.com/1920x1080/0f172a/10b981?text=InvestLuwu+Placeholder",
          ]);
        }
      } catch (err) {
        undefined;
        setHeroImages([
          "https://via.placeholder.com/1920x1080/0f172a/10b981?text=InvestLuwu+Placeholder",
        ]);
      }
    }
    fetchHeroImages();
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
    ? "bg-slate-900/50 border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.36)] hover:border-emerald-500/40 transition-all duration-300"
    : "bg-white/75 border-slate-200/80 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:border-emerald-400/50 hover:shadow-xl transition-all duration-300";
  const textMuted = isDark ? "text-slate-400" : "text-slate-600";
  const textHighlight = isDark ? "text-blue-400" : "text-blue-600";
  const inputBg = isDark
    ? "bg-slate-900/50 border-slate-800 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
    : "bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

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
      if (inv.districtName) set.add(inv.districtName);
      else if (inv.lokasi) set.add(inv.lokasi);
      else if (inv.districtId) set.add(inv.districtId);
    });
    return Array.from(set).sort();
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
        const matchLoc = (i.districtName || i.lokasi || i.districtId || "").toLowerCase().includes(q);
        if (!matchTitle && !matchSektor && !matchLoc) return false;
      }

      // Sector filter
      if (smartFilterState.selectedSector !== "SEMUA") {
        const sec = (i.sector || i.sektor || "").toLowerCase();
        if (!sec.includes(smartFilterState.selectedSector.toLowerCase())) return false;
      }

      // District filter
      if (smartFilterState.selectedDistrict !== "SEMUA") {
        const dist = (i.districtName || i.lokasi || i.districtId || "").toLowerCase();
        if (!dist.includes(smartFilterState.selectedDistrict.toLowerCase())) return false;
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
    const userPrompt = `Tolong berikan analisis kelayakan finansial dan korelasi spasial real-time untuk simulasi potensi investasi "${context.name}" kawan.`;

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
          data.text || data.reply || "Analisis spasial selesai kawan.";
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
            text: `Gagal menganalisis kawan: ${data.error || data.text || "Kesalahan Server"}`,
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "Gagal terhubung dengan server kecerdasan AI kawan.",
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
    const lang = i18n.language;
    const isZh = lang?.startsWith("zh");
    const isEn = lang?.startsWith("en");

    if (val >= 1000000000000) {
      const num = val / 1000000000000;
      const numStr = num.toFixed(1);
      const finalNum = isZh || isEn ? numStr : numStr.replace(".", ",");
      const suffix = isZh ? " 万亿" : isEn ? " Trillion" : " Triliun";
      return `Rp ${finalNum}${suffix}`;
    }
    if (val >= 1000000000) {
      const num = val / 1000000000;
      const numStr = num.toFixed(1);
      const finalNum = isZh || isEn ? numStr : numStr.replace(".", ",");
      const suffix = isZh ? " 十亿" : isEn ? " Billion" : " Miliar";
      return `Rp ${finalNum}${suffix}`;
    }
    if (val >= 1000000) {
      const num = val / 1000000;
      const numStr = num.toFixed(1);
      const finalNum = isZh || isEn ? numStr : numStr.replace(".", ",");
      const suffix = isZh ? " 百万" : isEn ? " Million" : " Juta";
      return `Rp ${finalNum}${suffix}`;
    }
    const locale = isZh ? "zh-CN" : isEn ? "en-US" : "id-ID";
    return `Rp ${val.toLocaleString(locale)}`;
  };

  // Metrics Logic
  const totalInvestmentValue = investments.reduce(
    (acc, inv) => acc + (inv.investmentValue || 0),
    0,
  );
  const activeOpportunities = investments.filter((i) => i.isActive).length;

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

  // Chart Data: Area Growth Trends (mocked progression for modern look based on real counts)
  const areaGrowthData = useMemo(() => {
    if (
      stats?.monthlyTrends &&
      Array.isArray(stats.monthlyTrends) &&
      stats.monthlyTrends.length > 0
    ) {
      return stats.monthlyTrends.map((t: any) => ({
        year: t.month,
        "Luas Lahan (Ha)":
          investments.reduce((acc, inv) => acc + (inv.areaHa || 0), 0) / 10 +
          Math.random() * 10, // Since we don't track area over time accurately yet, we bind to investments
        "Nilai Kapital": t["Akumulasi (Miliar IDR)"],
      }));
    }

    const active = investments.length > 0 ? investments.length : 12;
    return [
      {
        year: "2020",
        "Luas Lahan (Ha)": active * 110,
        "Nilai Kapital": active * 2.1,
      },
      {
        year: "2021",
        "Luas Lahan (Ha)": active * 150,
        "Nilai Kapital": active * 3.5,
      },
      {
        year: "2022",
        "Luas Lahan (Ha)": active * 210,
        "Nilai Kapital": active * 5.8,
      },
      {
        year: "2023",
        "Luas Lahan (Ha)": active * 280,
        "Nilai Kapital": active * 8.2,
      },
      {
        year: "2024",
        "Luas Lahan (Ha)": active * 340,
        "Nilai Kapital": active * 12.0,
      },
      {
        year: "Proyeksi 2025",
        "Luas Lahan (Ha)": active * 450,
        "Nilai Kapital": active * 18.5,
      },
    ];
  }, [investments, stats]);

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
      className={`min-h-screen transition-colors duration-500 font-sans ${themeBg} overflow-x-hidden selection:bg-blue-500/30`}
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
                      src="https://i.ibb.co.com/KxKKb5d8/transparant.png"
                      alt="Logo Luwu"
                      className="w-16 h-16 object-contain drop-shadow-2xl brightness-110"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tight text-white flex gap-1 justify-center relative">
                  InvestLuwu <span className="text-emerald-400">{t("landing.gateway", "Gateway")}</span>
                </h1>
                <p className="text-xs font-mono text-emerald-400/80 uppercase tracking-widest">
                  {t("footer.gov")}
                </p>
              </div>

              {/* Progress UI */}
              <div className="w-full mt-4 flex flex-col gap-4">
                {!launchReadyToEnter ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-end text-xs font-mono text-slate-400">
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
                    <div className="px-6 py-3 min-h-[44px] rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm tracking-wider uppercase animate-pulse flex items-center gap-2">
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
              <div className="absolute -bottom-32 text-[10px] sm:text-xs font-mono text-white brightness-125 uppercase tracking-widest text-center opacity-100 font-bold drop-shadow-md">
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
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
            {/* Logo area */}
            <div
              className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0 group"
              onClick={() => scrollToSection("hero-section")}
            >
              <div className="p-1.5 sm:p-2 rounded-[12px] bg-gradient-to-br from-blue-600/10 to-emerald-600/10 flex-shrink-0 border border-blue-500/10 group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
                <img
                  src="https://i.ibb.co.com/KxKKb5d8/transparant.png"
                  alt="Logo Kabupaten Luwu"
                  className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span
                className={`font-black text-lg sm:text-xl block tracking-tighter truncate transition-colors duration-500 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                InvestLuwu<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500 font-bold ml-0.5">{t("landing.hub", "Hub")}</span>
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {[
                { name: t("nav.dashboard"), id: "hero-section" },
                {
                  name: t("nav.gis"),
                  action: (e: any) => {
                    e?.preventDefault?.();
                    e?.stopPropagation?.();
                    if (onEnter) {
                      onEnter(Role.INVESTOR);
                    } else {
                      navigate("/peta-spasial");
                    }
                  },
                },
                { name: t("nav.potensi"), id: "potensi-section" },
                { name: t("nav.infrastruktur"), id: "infrastruktur-section" },
                
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
                  className={`px-4 py-2.5 min-h-[44px] rounded-full text-sm font-semibold transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5 relative group ${isDark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-blue-700"}`}
                >
                  <span className="relative z-10">{item.name}</span>
                  <div className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isDark ? "bg-white/5" : "bg-blue-50"}`} />
                </motion.button>
              ))}
            </div>

            {/* Actions: Fullscreen, Theme Toggle, Mobile Menu & Login */}
            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSwitcher isDark={isDark} />

              
              
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={handleToggleTheme}
                className={`p-2.5 rounded-full transition-all duration-300 hover:scale-110 ${
                  isDark
                    ? "bg-slate-800/80 text-yellow-400 hover:text-yellow-300 hover:shadow-[0_0_15px_rgba(250,204,21,0.2)]"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
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
                    <span>Registrasi</span>
                  </span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                  <div className="p-2 flex flex-col gap-1">
                    <div className="px-2 pt-1 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1">Registrasi Sebagai:</div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleRequestFullscreen();
                        navigate("/register?tab=investor");
                      }}
                      className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Building2 size={16} /> Investor
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleRequestFullscreen();
                        navigate("/register?tab=masyarakat");
                      }}
                      className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Users size={16} /> Masyarakat
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
                className="hidden sm:flex items-center gap-2 px-6 py-2.5 min-h-[44px] rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold transition-all duration-300 shadow-[0_4px_15px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative flex items-center gap-2">
                  <Shield className="w-4 h-4 mr-1.5" /> {t("nav.loginAdmin", "Login Admin")}
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </motion.button>

              {}
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`md:hidden w-11 h-11 flex items-center justify-center p-2 rounded-xl border transition-all ${
                  isDark
                    ? "border-slate-800 bg-slate-900/50 text-slate-300 hover:text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
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
                      e?.preventDefault?.();
                      e?.stopPropagation?.();
                      setIsMobileMenuOpen(false);
                      if (onEnter) {
                        onEnter(Role.INVESTOR);
                      } else {
                        navigate("/peta-spasial");
                      }
                    },
                  },
                  { name: t("nav.potensi"), id: "potensi-section" },
                  { name: t("nav.infrastruktur"), id: "infrastruktur-section" },
                  
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
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Registrasi Sebagai:</span>
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
                      <span>Investor</span>
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsMobileMenuOpen(false);
                        handleRequestFullscreen();
                        navigate("/register?tab=masyarakat");
                      }}
                      className="w-full flex items-center justify-center gap-2 px-5 py-2.5 min-h-[40px] rounded-lg bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-bold transition-all border border-blue-200 dark:border-blue-500/30"
                    >
                      <Users size={16} />
                      <span>Masyarakat</span>
                    </motion.button>
                  </div>


                  <motion.button whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsMobileMenuOpen(false);
                      handleRequestFullscreen();
                      navigate("/login");
                    }}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white text-sm font-bold transition-all"
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

      <div className="relative z-10 pt-4 sm:pt-6">
        {/* 1. HERO SECTION WITH IMMERSIVE BACKGROUND */}
        <div id="hero-section" className={`relative min-h-[92vh] flex items-center justify-center pt-32 pb-16 overflow-hidden ${isDark ? "bg-[#0b0f19] text-white" : "bg-slate-50 text-slate-900"}`}>
          {/* Aurora Background */}
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
                 className="absolute w-[500px] h-[500px] -top-24 -left-24 rounded-full bg-emerald-500/15 blur-[100px]" />
            <div style={{ animation: 'aurora2 15s ease-in-out infinite' }}
                 className="absolute w-[600px] h-[400px] top-12 -right-36 rounded-full bg-indigo-500/12 blur-[100px]" />
            <div style={{ animation: 'aurora3 18s ease-in-out infinite' }}
                 className="absolute w-[400px] h-[400px] -bottom-24 left-1/3 rounded-full bg-cyan-500/10 blur-[100px]" />
            <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400/15 to-transparent pointer-events-none"
                 style={{ animation: 'scanline 8s linear infinite' }} />
          </div>

          {/* Floating Info Chips */}
          <div className="absolute top-28 right-6 lg:right-12 z-20 hidden lg:flex flex-col gap-2"
               style={{ animation: 'floatUp 6s ease-in-out infinite' }}>
            {[
              { label: '24/7 AI Spatial Engine', color: 'bg-emerald-500' },
              { label: 'OSS RBA Terintegrasi', color: 'bg-indigo-500' },
              { label: 'PKKPR Real-time Sync', color: 'bg-amber-500' },
            ].map((chip, i) => (
              <div key={i} className={`flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-xl border backdrop-blur-md text-xs whitespace-nowrap ${isDark ? 'bg-white/5 border-white/10 text-white/70' : 'bg-slate-900/5 border-slate-900/10 text-slate-700'}`}>
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
                className={`absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? "opacity-40 mix-blend-luminosity" : "opacity-0"}`}
                style={{ backgroundImage: `url('${imgUrl}')` }}
              />
            ))}
          </motion.div>
          <div className={`absolute inset-0 z-10 ${isDark ? "bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(2,6,23,0.8)_70%,#020617_100%)]" : "bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.8)_70%,#ffffff_100%)]"} pointer-events-none`} />

          <div className="container max-w-7xl mx-auto px-4 lg:px-8 relative z-20">
            <motion.div className="flex flex-col items-center text-center max-w-4xl mx-auto" style={{ y: yText, opacity: opacityText }}>
              
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`inline-flex items-center gap-2 px-5 py-2 min-h-[44px] rounded-full border mb-8 text-xs font-bold tracking-widest uppercase backdrop-blur-xl ${isDark ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-emerald-300 bg-emerald-50 text-emerald-700"}`}
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
                className="text-5xl md:text-6xl lg:text-7xl font-['Playfair_Display'] font-extrabold tracking-tight mb-6 leading-tight"
              >
                <span className={`block text-lg md:text-xl font-['Plus_Jakarta_Sans'] font-medium tracking-[0.2em] uppercase mb-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {t('hero.heroTitleBrand')}
                </span>
                <span className={`transition-all duration-500 ease-in-out ${isDark ? 'text-white drop-shadow-md' : 'text-slate-900 drop-shadow-sm'}`}>
                  {t('hero.heroTitleSlogan')}
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className={`text-lg md:text-xl max-w-2xl font-light leading-relaxed mt-6 mb-10 transition-all duration-500 ease-in-out ${isDark ? "text-slate-300" : "text-slate-600"}`}
              >
                {t("hero.subtitle")}
              </motion.p>

              
            </motion.div>

            {/* Elegant Gradient Divider */}
            <motion.div 
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
              className="w-full max-w-3xl mx-auto my-12 relative flex items-center justify-center"
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
              className="mt-20 lg:mt-32 max-w-5xl mx-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 rounded-3xl p-4 md:p-8 bg-white/80 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 shadow-xl shadow-slate-200/50 dark:shadow-none">
                {[
                  {
                    label: t("stats.totalInvestment"),
                    value: formatRupiah(totalInvestmentValue),
                    icon: TrendingUp,
                    borderColor: 'border-t-emerald-500/80 shadow-[0_-2px_15px_rgba(16,185,129,0.1)]',
                    iconColor: 'text-emerald-400',
                    iconBg: 'bg-emerald-500/10',
                    sparkColor: '#10b981',
                    sparkPoints: '0,22 13,18 26,20 39,12 52,14 65,7 80,4',
                  },
                  {
                    label: t("stats.activeOpportunities"),
                    value: activeOpportunities || 0,
                    icon: Layers,
                    borderColor: 'border-t-indigo-500/80 shadow-[0_-2px_15px_rgba(99,102,241,0.1)]',
                    iconColor: 'text-indigo-400',
                    iconBg: 'bg-indigo-500/10',
                    sparkColor: '#818cf8',
                    sparkPoints: '0,24 13,20 26,22 39,15 52,17 65,10 80,6',
                  },
                  {
                    label: t("stats.subDistricts"),
                    value: districts?.length || 0,
                    icon: MapPin,
                    borderColor: 'border-t-cyan-400/60',
                    iconColor: 'text-cyan-400',
                    iconBg: 'bg-cyan-500/10',
                    sparkColor: '#22d3ee',
                    sparkPoints: '0,26 20,26 40,20 60,16 80,10',
                  },
                  {
                    label: t("stats.villages"),
                    value: villages?.length || 0,
                    icon: Globe,
                    borderColor: 'border-t-amber-500/80 shadow-[0_-2px_15px_rgba(245,158,11,0.1)]',
                    iconColor: 'text-amber-400',
                    iconBg: 'bg-amber-500/10',
                    sparkColor: '#fbbf24',
                    sparkPoints: '0,28 16,24 32,22 48,18 64,12 80,8',
                  },
                ].map((stat, idx) => (
                  <div key={idx}
                       className={`flex flex-col items-center justify-center p-4 rounded-2xl border-t-2 ${stat.borderColor}
                                   ${isDark ? 'bg-slate-900/40 hover:bg-slate-800/60' : 'bg-white/50 hover:bg-white'}
                                   transition-all duration-300 group`}>
                    <div className={`p-2 rounded-xl ${stat.iconBg} mb-2`}>
                      <stat.icon size={20} className={stat.iconColor} />
                    </div>
                    <div className="text-2xl md:text-3xl font-bold tracking-tight mb-1">{stat.value}</div>
                    <div className={`text-xs uppercase tracking-widest font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {stat.label}
                    </div>
                    {/* Sparkline mini */}
                    <svg viewBox="0 0 80 28" className="w-full h-6 opacity-60" preserveAspectRatio="none">
                      <polyline points={stat.sparkPoints} fill="none" stroke={stat.sparkColor} strokeWidth="1.5" strokeLinecap="round"/>
                      <polygon points={`${stat.sparkPoints} 80,28 0,28`} fill={stat.sparkColor} fillOpacity="0.08" stroke="none"/>
                    </svg>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* EXECUTIVE LIVE DATA COUNTER PANEL */}
        <section
          className={`py-12 border-b relative z-20 ${isDark ? "bg-slate-950/40 border-slate-800/80" : "bg-white border-slate-200/80"}`}
        >
          <div className="container mx-auto px-4 lg:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div
                className="p-6 rounded-2xl flex flex-col items-center text-center transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20 hover:border-blue-500/50 bg-white/80 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 shadow-xl shadow-slate-200/50 dark:shadow-none"
              >
                <div
                  className={`p-3 rounded-xl mb-4 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-blue-500`}
                >
                  <Building size={28} />
                </div>
                <div className="text-4xl font-medium tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                  <CountUp end={infrastructure?.length || 0} suffix="" /> {t("stats.points")}
                </div>
                <p
                  className={`text-xs font-normal tracking-wider uppercase ${textMuted}`}
                >
                  {t("stats.mappedInfra")}
                </p>
              </div>

              {/* Card 2 */}
              <div
                className="p-6 rounded-2xl flex flex-col items-center text-center transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/20 hover:border-emerald-500/50 bg-white/80 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 shadow-xl shadow-slate-200/50 dark:shadow-none"
              >
                <div
                  className={`p-3 rounded-xl mb-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 text-emerald-500`}
                >
                  <MapPin size={28} />
                </div>
                <div className="text-4xl font-medium tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                  <CountUp end={investments?.length || 0} suffix="" /> {t("stats.locations")}
                </div>
                <p
                  className={`text-xs font-normal tracking-wider uppercase ${textMuted}`}
                >
                  {t("stats.strategicLands")}
                </p>
              </div>

              {/* Card 3 */}
              <div
                className="p-6 rounded-2xl flex flex-col items-center text-center transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/20 hover:border-indigo-500/50 bg-white/80 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 shadow-xl shadow-slate-200/50 dark:shadow-none"
              >
                <div
                  className={`p-3 rounded-xl mb-4 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 text-indigo-500`}
                >
                  <Bot size={28} />
                </div>
                <div className="text-4xl font-medium tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                  24/7 Aktif
                </div>
                <p
                  className={`text-xs font-normal tracking-wider uppercase ${textMuted}`}
                >
                  {t("stats.aiAssistant")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. DAFTAR POTENSI INVESTASI - BENTO GRID */}
        <div
          id="potensi-section"
          className="container max-w-7xl mx-auto px-4 lg:px-6 py-16 min-h-[44px] lg:py-24"
        >
          <div className="flex flex-col md:flex-row items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold mb-3 tracking-tight opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                {t("sections.potensi.title")}
              </h2>
              <div className="h-1 w-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mb-6 ml-0 opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms' }}></div>
              <p className={`text-lg ${textMuted} opacity-0 animate-fade-in-up`} style={{ animationDelay: '300ms' }}>
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
          <div className="mb-8">
            <SmartMatrixFilterPanel
              filters={smartFilterState}
              onChangeFilters={setSmartFilterState}
              districtsList={uniqueDistrictsList}
              totalResults={filteredInvestmentsList.length}
              isDark={isDark}
            />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3].map((num) => (
                <div
                  key={num}
                  className={`rounded-3xl border overflow-hidden flex flex-col h-[400px] animate-pulse ${cardBg} ${isDark ? "border-slate-800" : "border-slate-200"}`}
                >
                  <div className="h-48 bg-slate-800/50 dark:bg-slate-800/40" />
                  <div className="p-6 flex flex-col flex-grow gap-4">
                    <div className="h-6 bg-slate-800/50 dark:bg-slate-800/40 rounded w-3/4" />
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-800/50 dark:bg-slate-800/40 rounded w-1/2" />
                      <div className="h-4 bg-slate-800/50 dark:bg-slate-800/40 rounded w-2/3" />
                    </div>
                    <div className="h-10 bg-slate-800/50 dark:bg-slate-800/40 rounded-xl mt-auto w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredInvestmentsList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                    className={`glass-panel rounded-[2rem] border overflow-hidden flex flex-col group
                                opacity-0 animate-fade-in-up
                                transition-all duration-300 ease-in-out hover:-translate-y-2
                                hover:shadow-2xl ${getSectorColor(inv.sector).glow}
                                hover:border-emerald-500/50
                                ${isDark ? 'bg-slate-900/40' : 'bg-white/70'}`}
                  >
                    <div className="h-56 overflow-hidden relative">
                      <LazyImage
                        src={
                          inv.photoUrl ||
                          "https://images.unsplash.com/photo-1590496794008-383c8070b257"
                        }
                        alt={inv.name}
                        isDark={isDark}
                        imgClassName="transform group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] to-transparent opacity-80 mix-blend-multiply pointer-events-none" />
                      <div className="absolute top-4 left-4">
                        <div
                          className={`px-3 py-1 min-h-[44px] rounded-full text-xs font-medium backdrop-blur-md shadow-lg ${getSectorColor(inv.sector).badgeBg}`}
                        >
                          {t(getSectorI18nKey(inv.sector))}
                        </div>
                      </div>
                      {(inv.smartData?.aiScore || inv.smartData?.ai_score) && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 min-h-[44px] rounded-full bg-black/55 backdrop-blur-md border border-white/15">
                          <span className="text-yellow-400 text-[11px]">★</span>
                          <span className="text-white text-[11px] font-medium">
                            {inv.smartData?.aiScore || inv.smartData?.ai_score}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-white/8 to-transparent
                                        -left-full group-hover:left-[200%] transition-all duration-700 ease-in-out" />
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-2xl font-sans font-bold line-clamp-2 leading-tight group-hover:text-emerald-500 transition-colors tracking-tight">
                          {inv.name}
                        </h3>
                      </div>
                      <div
                        className={`space-y-3 mb-6 ${textMuted} text-sm font-medium`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-1.5 rounded-md ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
                          >
                            <MapPin size={14} className={textHighlight} />
                          </div>
                          {inv.areaHa} {t("ui.hectares")}
                        </div>
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-1.5 rounded-md ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
                          >
                            <Building size={14} className={textHighlight} />
                          </div>
                          {t("ui.est")} {formatRupiah(inv.investmentValue)}
                        </div>
                      </div>

                      {(() => {
                        const rawPct = Math.min(100, Math.round(((inv.investmentValue || 0) / 2500000000000) * 100 * Math.max(investments.length, 1)));
                        const pct = typeof rawPct === 'number' && !isNaN(rawPct) ? rawPct : 0;
                        const { progress } = getSectorColor(inv.sector);
                        return (
                          <div className="mt-1 mb-4">
                            <div className="flex justify-between items-center mb-1">
                              <span className={`text-[10px] uppercase tracking-widest font-medium ${textMuted}`}>
                                {t("investmentProfile.targetRealisasi", "Target realisasi")}
                              </span>
                              <span className="text-[10px] font-medium text-slate-400">{pct}%</span>
                            </div>
                            <div className={`h-1 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                              <div className={`h-full rounded-full ${progress} transition-all duration-700`}
                                   style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })()}
                      <div className={`mt-auto pt-4 flex gap-2 border-t ${isDark ? 'border-slate-800/60' : 'border-slate-100'}`}>
                        <motion.button whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            undefined;
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
                          className={`group flex-1 py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.97]
                                      ${isDark
                                        ? 'border-slate-700/80 bg-slate-800/60 text-slate-200 hover:border-emerald-500/50 hover:bg-gradient-to-r hover:from-slate-800 hover:to-emerald-950/60 hover:text-emerald-400 hover:shadow-md hover:shadow-emerald-500/10'
                                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-blue-50 hover:text-emerald-700 hover:shadow-md hover:shadow-emerald-500/10'}`}
                        >
                          <Search size={14} className="group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
                          <span>{t("common.detail", "Detail")}</span>
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            navigate("/login?role=investor");
                          }}
                          className="group flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.97] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 hover:shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center gap-1.5"
                        >
                          <span>{t("landing.ajukanMinat", "Ajukan minat")}</span>
                          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
                        </motion.button>
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
                <MapPin size={32} className="text-slate-500" />
              </div>
              <p className="text-lg font-medium">
                Data potensi belum tersedia. Gunakan Dashboard Operator untuk
                menambah data spasial.
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
        <div className="mt-16 py-8">
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
          />
        </div>

        {/* 3. LITERASI & KEUNTUNGAN LUTIM */}
        <div
          id="keuntungan-section"
          className="container max-w-7xl mx-auto px-4 lg:px-6 py-16 min-h-[44px] lg:py-24"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold tracking-tight mb-3">
              {t("sections.keuntungan.title")}
            </h2>
            <div className="h-1 w-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mb-6 mx-auto"></div>
            <p className={`text-lg max-w-2xl mx-auto ${textMuted}`}>
              {t("sections.keuntungan.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: MapPin,
                title: t("features.logisticsTitle"),
                desc: t("features.logisticsDesc"),
              },
              {
                icon: Leaf,
                title: t("features.commodityTitle"),
                desc: t("features.commodityDesc"),
              },
              {
                icon: ShieldCheck,
                title: t("features.bureaucracyTitle"),
                desc: t("features.bureaucracyDesc"),
              },
            ].map((item, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                style={{ willChange: "transform, opacity" }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -50px 0px" }}
                transition={{ delay: idx * 0.15 }}
                key={idx}
                className={`relative p-8 rounded-2xl flex flex-col items-start border transition-all duration-300 ease-in-out group hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/20 hover:border-emerald-500/50 overflow-hidden ${cardBg}`}
              >
                {/* Decorative Glowing Edge on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/10 group-hover:to-blue-500/10 transition-colors duration-500 rounded-2xl pointer-events-none" />
                <div className="absolute -bottom-1 -right-1 w-24 h-24 bg-gradient-to-tl from-emerald-500/20 to-transparent blur-2xl group-hover:scale-150 transition-transform duration-700" />

                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${isDark ? "from-emerald-500/20 to-blue-500/20 border border-emerald-500/20" : "from-emerald-100 to-blue-100 border border-emerald-200"}`}
                >
                  <item.icon
                    className={`w-10 h-10 drop-shadow-sm ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                  />
                </div>
                <h3 className="text-xl font-medium mb-3 tracking-tight">
                  {item.title}
                </h3>
                <p className={`leading-relaxed ${textMuted}`}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
        {/* 4.5 FASILITAS PENUNJANG INFRASTRUKTUR */}
        <div
          id="infrastruktur-section"
          className="container max-w-7xl mx-auto px-4 lg:px-6 py-16 min-h-[44px] lg:py-24 relative"
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[20%] right-[10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/5 blur-[120px] mix-blend-screen" />
          </div>
          <div className="text-center mb-16 relative z-10">
            <span
              className={`inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-full text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-xl border opacity-0 animate-fade-in-up ${isDark ? "bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-200 border-orange-400/30 shadow-sm" : "bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-orange-700 border-orange-300 shadow-sm shadow-orange-500/10"}`}
              style={{ animationDelay: '50ms' }}
            >
              <Building size={14} /> Infrastruktur & Ekosistem
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium mb-3 opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              {t("sections.infrastruktur.title")}
            </h2>
            <div className="h-1 w-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mb-6 mx-auto opacity-0 animate-fade-in-up" style={{ animationDelay: '250ms' }}></div>
            <p className={`text-lg max-w-2xl mx-auto ${textMuted} opacity-0 animate-fade-in-up`} style={{ animationDelay: '350ms' }}>
              {t("sections.infrastruktur.subtitle")}
            </p>
          </div>

          {useMemo(() => {
                        const baseFacilities = [
              {
                name: t("infrastructure.buaAirportTitle"),
                desc: t("infrastructure.buaAirportDesc"),
                type: "airport",
                longitude: facilityCoords.airport ? facilityCoords.airport[0] : 120.24132322502385,
                latitude: facilityCoords.airport ? facilityCoords.airport[1] : -3.086338491260946,
              },
              {
                name: t("infrastructure.uloPortTitle"),
                desc: t("infrastructure.uloPortDesc"),
                type: "port",
                longitude: facilityCoords.port ? facilityCoords.port[0] : 120.39793462368112,
                latitude: facilityCoords.port ? facilityCoords.port[1] : -3.386061643485775,
              },
              {
                name: t("infrastructure.kiluTitle"),
                desc: t("infrastructure.kiluDesc"),
                type: "industrial",
                longitude: facilityCoords.industrial ? facilityCoords.industrial[0] : 120.252,
                latitude: facilityCoords.industrial ? facilityCoords.industrial[1] : -3.125,
              },
              {
                name: t("infrastructure.mppTitle"),
                desc: t("infrastructure.mppDesc"),
                type: "mpp",
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                {mappedFacilities.map((facility, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    style={{ willChange: "transform, opacity" }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "0px 0px -50px 0px" }}
                    transition={{ delay: idx * 0.1 }}
                    key={idx}
                    className={`p-6 rounded-[2rem] flex flex-col h-full border transition-all duration-500 group hover:-translate-y-2 backdrop-blur-2xl glass-panel ${isDark ? "bg-slate-900/50 border-white/10 hover:border-blue-500/40 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.3)]" : "bg-white/75 border-slate-200/80 hover:border-blue-400/50 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.2)]"}`}
                  >
                    <div
                      className={`p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-6 transition-transform group-hover:scale-110 backdrop-blur-md ${
                        facility.type === "airport"
                          ? isDark
                            ? "bg-gradient-to-br from-sky-500/20 to-blue-500/20 text-sky-300 border border-sky-400/40 shadow-[0_0_20px_rgba(56,189,248,0.2)]"
                            : "bg-gradient-to-br from-sky-100 to-blue-100 text-sky-600 border border-sky-200 shadow-sm shadow-sky-500/10"
                          : facility.type === "port"
                            ? isDark
                              ? "bg-gradient-to-br from-teal-500/20 to-emerald-500/20 text-teal-300 border border-teal-400/40 shadow-[0_0_20px_rgba(45,212,191,0.2)]"
                              : "bg-gradient-to-br from-teal-100 to-emerald-100 text-teal-600 border border-teal-200 shadow-sm shadow-teal-500/10"
                            : facility.type === "industrial"
                              ? isDark
                                ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.2)]"
                                : "bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600 border border-amber-200 shadow-sm shadow-amber-500/10"
                              : isDark
                                ? "bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-400/40 shadow-[0_0_20px_rgba(129,140,248,0.2)]"
                                : "bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 border border-indigo-200 shadow-sm shadow-indigo-500/10"
                      }`}
                    >
                      {facility.type === "port" ? (
                        <Anchor className="w-8 h-8 drop-shadow-md" />
                      ) : facility.type === "airport" ? (
                        <Plane className="w-8 h-8 drop-shadow-md" />
                      ) : facility.type === "mpp" ? (
                        <ShieldCheck className="w-8 h-8 drop-shadow-md" />
                      ) : (
                        <Building className="w-8 h-8 drop-shadow-md" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold mb-3 tracking-tight">{facility.name}</h3>
                    <p
                      className={`text-sm leading-relaxed ${textMuted} flex-grow`}
                    >
                      {facility.desc}
                    </p>
                    {facility.distanceKm !== null && (
                      <div className={`mt-5 pt-4 flex items-center justify-between border-t ${isDark ? "border-slate-800/80" : "border-slate-100"}`}>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          {t("distance.estimation", "ESTIMASI JARAK")}
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border shadow-sm ${isDark ? "bg-amber-500/20 text-amber-300 border-amber-400/30" : "bg-amber-100 text-amber-700 border-amber-200"}`}>
                            {t("distance.airEstimation", "Estimasi Udara")}
                          </span>
                        </span>
                        <span className={`font-mono font-bold px-3 py-1.5 min-h-[44px] rounded-xl flex items-center justify-center backdrop-blur-md border shadow-sm ${isDark ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                          {facility.distanceKm.toFixed(1)} km
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            );
          }, [t, selectedInvestmentId, investments, isDark, textMuted, facilityCoords])}
        </div>

        {/* INTERACTIVE ROADMAP & LICENSING GUIDE */}
        <section id="roadmap-section" className={`py-16 lg:py-24 border-t ${isDark ? "bg-[#0b0f19] border-slate-800/60" : "bg-white border-slate-200"}`}>
          <div className="container max-w-7xl mx-auto px-4 lg:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className={`inline-flex items-center gap-2 px-4 py-1.5 min-h-[44px] rounded-full text-xs font-normal uppercase tracking-wider mb-4 border ${isDark ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                <Compass size={14} className="animate-spin-slow" /> {t("roadmap.tag", "Alur Legalitas & Regulasi Luwu")}
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold tracking-tight mb-3">
                {t("roadmap.title", "Panduan Regulasi & Roadmap Perizinan")}
              </h2>
              <div className="h-1 w-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mb-6 mx-auto"></div>
              <p className={`text-base lg:text-lg ${textMuted}`}>
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
                          : "bg-slate-500/10 text-slate-400"
                      }`}>
                        {step.num}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold tracking-tight leading-normal mb-1 break-words">{step.title}</h4>
                        <p className={`text-[11px] ${textMuted} truncate`}>{step.short}</p>
                      </div>
                      <step.icon size={16} className={`shrink-0 transition-transform duration-300 ${isActive ? "scale-110 " + step.color : "text-slate-400 group-hover:scale-110"}`} />
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
                    className={`p-6 sm:p-8 rounded-[2rem] border min-h-full flex flex-col justify-between relative overflow-hidden glass-panel shadow-[0_20px_40px_-15px_rgba(16,185,129,0.1)] ${isDark ? "bg-slate-900/40 border-slate-700/50" : "bg-white/70 border-slate-200"}`}
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
                        <h4 className="text-xs sm:text-sm uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">
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
          className={`py-16 lg:py-24 border-y relative overflow-hidden z-10 ${
            isDark
              ? "border-emerald-500/20 bg-slate-900/90"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          {/* Ambient Glowing Background Elements - Enhanced brightness for dark mode */}
          <div className="absolute top-1/4 left-1/10 w-[450px] h-[450px] bg-emerald-500/15 dark:bg-emerald-400/30 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/10 w-[550px] h-[550px] bg-emerald-600/15 dark:bg-emerald-300/25 rounded-full blur-[120px] pointer-events-none" />

          <div className="container mx-auto px-4 lg:px-6">
            <motion.div
              initial={{ opacity: 0, y: 70 }}
              style={{ willChange: "transform, opacity" }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -50px 0px" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="p-6 sm:p-12 lg:p-16 rounded-3xl relative overflow-hidden transition-all duration-500 bg-white/80 dark:bg-gradient-to-r dark:from-slate-900/95 dark:via-emerald-900/70 dark:to-slate-900/95 backdrop-blur-2xl border border-white/60 dark:border-emerald-400/40 shadow-2xl dark:shadow-emerald-500/20 hover:dark:border-emerald-400/70"
            >
              {/* Subtle tech background line grid */}
              <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:32px_32px]" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center relative z-10">
                {/* LEFT COLUMN: Modern Typography & Actions */}
                <div className="lg:col-span-7 text-left flex flex-col justify-center space-y-6">
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    style={{ willChange: "transform, opacity" }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "0px 0px -50px 0px" }}
                    transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                  >
                    <div className="inline-flex items-center gap-2 px-3 py-1 min-h-[44px] rounded-full text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-400/15 border border-emerald-500/20 dark:border-emerald-400/30 mb-4 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      {t("mppBanner.tag")}
                    </div>
                    <h3 className="text-3xl sm:text-3xl sm:text-4xl lg:text-5xl font-bold tracking-wide leading-tight text-slate-900 dark:text-white mb-2">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-emerald-600 dark:from-sky-300 dark:via-emerald-300 dark:to-teal-300 font-sans drop-shadow-sm">
                        {t("mppBanner.title")}
                      </span>
                    </h3>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    style={{ willChange: "transform, opacity" }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "0px 0px -50px 0px" }}
                    transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
                    className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-200"
                  >
                    {t("mppBanner.desc")}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    style={{ willChange: "transform, opacity" }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "0px 0px -50px 0px" }}
                    transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
                    className="pt-2"
                  >
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        Swal.fire({
                          title: t('landing.mpp_swal.title', "Menuju MPP Simpurusiang"),
                          text: t('landing.mpp_swal.text', "Membuka Sistem Integrasi MPP Simpurusiang Kabupaten Luwu untuk memproses perizinan satu pintu..."),
                          icon: "info",
                          showCancelButton: true,
                          confirmButtonText: t('common.continue', "Lanjutkan"),
                          cancelButtonText: t('common.cancel', "Batal"),
                          confirmButtonColor: "#2563eb",
                        }).then((result) => {
                          if (result.isConfirmed) {
                            window.open("https://mpp.luwukab.go.id/", "_blank");
                          }
                        });
                      }}
                      className="inline-flex items-center justify-center gap-2.5 px-8 py-4 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-full backdrop-blur-xl border border-emerald-500/30 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.05] active:scale-[0.98] cursor-pointer"
                    >
                      <span>{t("mppBanner.enterBtn")}</span>
                      <ChevronRight size={16} />
                    </motion.button>
              </motion.div>
                </div>

                {}
                <div className="lg:col-span-5 flex flex-col items-center justify-center relative min-h-[260px] sm:min-h-[350px] w-full">
                  {/* Decorative glowing backdrops */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-indigo-500/15 blur-[50px] pointer-events-none animate-pulse" />

                  {/* Outer floating orbital track rings */}
                  <div className="absolute border border-indigo-500/10 dark:border-indigo-500/5 rounded-full w-[240px] h-[240px] sm:w-[320px] sm:h-[320px] animate-[spin_35s_linear_infinite] pointer-events-none" />
                  <div className="absolute border border-dashed border-emerald-500/10 dark:border-emerald-500/5 rounded-full w-[180px] h-[180px] sm:w-[240px] sm:h-[240px] animate-[spin_20s_linear_infinite_reverse] pointer-events-none" />

                  {}
                  <div className="flex flex-row justify-center items-center gap-6 sm:gap-10 relative z-10 w-full py-4 px-2">
                    {/* Left Staff Card */}
                    {staffImageLeft && (
                      <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        style={{ willChange: "transform, opacity" }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "0px 0px -50px 0px" }}
                        transition={{
                          duration: 1.2,
                          delay: 0.1,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        whileHover={{
                          scale: 1.04,
                          y: -4,
                          transition: { duration: 0.4, ease: "easeOut" },
                        }}
                        className="group relative flex flex-col items-center select-none"
                      >
                        {/* Interactive soft ambient glow */}
                        <div className="absolute -inset-2 rounded-[2rem] bg-emerald-500/10 dark:bg-emerald-400/10 opacity-0 group-hover:opacity-100 blur-xl transition duration-500 pointer-events-none" />

                        <div className="relative w-36 h-48 sm:w-48 sm:h-64 overflow-hidden rounded-[2rem] bg-transparent flex items-center justify-center transition-all duration-500">
                          <img
                            src={staffImageLeft}
                            alt="DPMPTSP Team Left"
                            className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105 filter contrast-[1.03] brightness-[1.01]"
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Right Staff Card */}
                    {staffImageRight && (
                      <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        style={{ willChange: "transform, opacity" }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "0px 0px -50px 0px" }}
                        transition={{
                          duration: 1.2,
                          delay: 0.3,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        whileHover={{
                          scale: 1.04,
                          y: -4,
                          transition: { duration: 0.4, ease: "easeOut" },
                        }}
                        className="group relative flex flex-col items-center select-none"
                      >
                        {/* Interactive soft ambient glow */}
                        <div className="absolute -inset-2 rounded-[2rem] bg-emerald-500/10 dark:bg-emerald-400/10 opacity-0 group-hover:opacity-100 blur-xl transition duration-500 pointer-events-none" />

                        <div className="relative w-36 h-48 sm:w-48 sm:h-64 overflow-hidden rounded-[2rem] bg-transparent flex items-center justify-center transition-all duration-500">
                          <img
                            src={staffImageRight}
                            alt="DPMPTSP Team Right"
                            className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105 filter contrast-[1.03] brightness-[1.01]"
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="absolute bottom-2 right-2 sm:right-4 px-3 py-1.5 min-h-[44px] rounded-2xl bg-white/75 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-[0_4px_12px_rgba(0,0,0,0.05)] backdrop-blur-md flex items-center gap-1.5 animate-[atmospheric-drift_8s_infinite_ease-in-out] pointer-events-none">
                    <Sparkles
                      size={11}
                      className="text-yellow-500 animate-spin"
                    />
                    <span className="text-[10px] font-bold font-mono tracking-wider">
                      OSS INTEGRATED
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 5. SHOWCASE TEKNOLOGI AI & CALCULATOR */}
        <div
          id="analytics-section"
          className={`pt-8 pb-4 lg:pt-24 lg:pb-12 border-t relative ${isDark ? "border-slate-800" : "border-slate-200"}`}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none hidden dark:block">
            <div className="absolute top-[10%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-indigo-500/5 blur-[120px] mix-blend-screen" />
            <div className="absolute bottom-[20%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-blue-500/5 blur-[100px] mix-blend-screen" />
          </div>
          <div className="container max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-full text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-xl border opacity-0 animate-fade-in-up ${isDark ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-200 border-indigo-400/30 shadow-sm" : "bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-700 border-indigo-300 shadow-sm shadow-indigo-500/10"}`}
                style={{ animationDelay: '50ms' }}
              >
                <Sparkles size={14} /> Powered by AI & Spatial Logic
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold tracking-tight mb-3 opacity-0 animate-fade-in-up text-slate-900 dark:text-white" style={{ animationDelay: '150ms' }}>
                {t("sections.intel.title")}
              </h2>
              <div className="h-1 w-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mb-6 mx-auto opacity-0 animate-fade-in-up" style={{ animationDelay: '250ms' }}></div>
              <p className={`text-lg leading-relaxed text-slate-600 dark:text-slate-400 opacity-0 animate-fade-in-up`} style={{ animationDelay: '350ms' }}>
                {t("sections.intel.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* KALKULATOR ROI */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                style={{ willChange: "transform, opacity" }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "0px 0px -50px 0px" }}
                className="lg:col-span-12 p-2 sm:p-6 md:p-8 !px-3 sm:!px-6 md:!px-8 rounded-2xl md:rounded-[2rem] border overflow-hidden h-full flex flex-col bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl border-slate-200 dark:border-slate-700/50 shadow-2xl shadow-slate-200/50 dark:shadow-[0_0_50px_rgba(16,185,129,0.1)] transition-all duration-500"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-5 mb-6 md:mb-8 border-b pb-5 md:pb-6 border-slate-500/20">
                  <div
                    className={`p-4 rounded-2xl backdrop-blur-md border shadow-sm ${isDark ? "bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-300 border-indigo-400/40" : "bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 border-indigo-200"}`}
                  >
                    <Calculator size={28} className="drop-shadow-sm" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight mb-1">{t("roiSimulator.title")}</h3>
                    <div className={`text-sm font-medium ${textMuted}`}>
                      {t("roiSimulator.subtitle")}
                    </div>
                  </div>
                  {roiResult && (<div className={`mt-3 md:mt-0 w-full md:w-auto flex justify-center md:ml-auto items-center gap-2 px-4 py-2 min-h-[44px] rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-md border shadow-sm
                      ${roiResult.status === 'FEASIBLE'
                        ? isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : roiResult.status === 'NOT_FEASIBLE'
                          ? isDark ? 'bg-rose-500/20 text-rose-300 border-rose-400/40' : 'bg-rose-50 text-rose-700 border-rose-300'
                          : isDark ? 'bg-amber-500/20 text-amber-300 border-amber-400/40' : 'bg-amber-50 text-amber-700 border-amber-300'}`}>
                      <span className={`w-2 h-2 rounded-full animate-pulse shadow-sm
                        ${roiResult.status === 'FEASIBLE' ? 'bg-emerald-400 shadow-emerald-400/50'
                          : roiResult.status === 'NOT_FEASIBLE' ? 'bg-rose-400 shadow-rose-400/50' : 'bg-amber-400 shadow-amber-400/50'}`} />
                      {roiResult.status === 'FEASIBLE' ? 'Sangat layak'
                        : roiResult.status === 'NOT_FEASIBLE' ? 'Tidak layak'
                        : 'Zona moderat'}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="md:col-span-2 space-y-6">
                    <label
                      className={`block text-xs font-normal uppercase tracking-wider mb-2 ${textMuted}`}
                    >
                      {t("roiSimulator.targetPotential")}
                    </label>
                    <select
                      value={selectedInvestmentId}
                      onChange={(e) => setSelectedInvestmentId(e.target.value)}
                      className={`w-full px-5 py-4 min-h-[44px] rounded-xl border font-normal outline-none transition-all appearance-none cursor-pointer ${inputBg}`}
                    >
                      <option value="">
                        {t("roiSimulator.placeholder")}
                      </option>
                      {investments.map((inv, idx) => (
                        <option key={`${inv.id}-${idx}`} value={inv.id}>
                          {inv.name} ({inv.sector})
                        </option>
                      ))}
                    </select>

                    {selectedInvObj && (
                      <div
                        className={`mt-4 rounded-xl border ${isDark ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-slate-50"} overflow-hidden`}
                      >
                        <motion.button whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() =>
                            setIsProfileExpanded(!isProfileExpanded)
                          }
                          className="w-full px-5 py-3 min-h-[44px] flex items-center justify-between hover:bg-slate-500/5 transition-colors focus:outline-none"
                        >
                          <div className="flex flex-row items-center gap-2">
                            <Info className={`w-4 h-4 ${textHighlight}`} />
                            <span className="text-sm font-medium">
                              {t('profile_location')} - {selectedInvObj.name}
                            </span>
                          </div>
                          {isProfileExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </motion.button>

                        <AnimatePresence>
                          {isProfileExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-5 pt-1 text-sm space-y-3">
                                <div className="grid grid-cols-2 gap-y-2">
                                  <div className="text-slate-500">{t('sector_title', 'Sector')}</div>
                                  <div className="font-medium text-right text-emerald-600 dark:text-emerald-400">
                                    {t(getSectorI18nKey(selectedInvObj.sector))}
                                    {selectedInvObj.subSector
                                      ? ` - ${selectedInvObj.subSector}`
                                      : ""}
                                  </div>
                                  <div className="text-slate-500">
                                    {t('district')}
                                  </div>
                                  <div className="font-medium text-right">
                                    {districts.find(
                                      (d) => d.id === selectedInvObj.districtId,
                                    )?.name || "-"}
                                  </div>
                                  <div className="text-slate-500">
                                    {t('village')}
                                  </div>
                                  <div className="font-medium text-right">
                                    {villages.find(
                                      (v) => v.id === selectedInvObj.villageId,
                                    )?.name || "-"}
                                  </div>
                                  <div className="text-slate-500">
                                    {t('land_area')}
                                  </div>
                                  <div className="font-medium text-right">
                                    {selectedInvObj.areaHa} Ha
                                  </div>
                                  {selectedInvObj.landStatus && (
                                    <>
                                      <div className="text-slate-500">
                                        {t('land_status')}
                                      </div>
                                      <div className="font-medium text-right">
                                        {selectedInvObj.landStatus}
                                      </div>
                                    </>
                                  )}
                                  <div className="text-slate-500">{t('coordinates')}</div>
                                  <div className="font-mono text-right text-xs text-sky-600 dark:text-sky-400">
                                    {selectedInvObj.latitude.toFixed(5)},{" "}
                                    {selectedInvObj.longitude.toFixed(5)}
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
                          className={`block text-xs font-normal uppercase tracking-wider mb-2 ${textMuted}`}
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
                            className={`w-full px-5 py-4 min-h-[44px] rounded-xl border font-medium outline-none transition-all ${inputBg}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          className={`block text-xs font-normal uppercase tracking-wider mb-2 ${textMuted}`}
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
                            className={`w-full px-5 py-4 min-h-[44px] rounded-xl border font-medium outline-none transition-all ${inputBg}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          className={`block text-xs font-normal uppercase tracking-wider mb-2 ${textMuted}`}
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
                            className={`w-full px-5 py-4 min-h-[44px] rounded-xl border font-medium outline-none transition-all opacity-70 cursor-not-allowed ${inputBg}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          className={`block text-xs font-normal uppercase tracking-wider mb-2 ${textMuted}`}
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
                            className={`w-full pl-14 pr-5 py-4 rounded-xl border font-medium outline-none transition-all ${inputBg}`}
                          />
                        </div>
                      </div>
                    </>
                  ) : selectedSector === SektorInvestasi.PERTANIAN ||
                    selectedSector === SektorInvestasi.KELAUTAN ? (
                    <>
                      <div>
                        <label
                          className={`block text-xs font-normal uppercase tracking-wider mb-2 ${textMuted}`}
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
                            className={`w-full px-5 py-4 min-h-[44px] rounded-xl border font-medium outline-none transition-all ${inputBg}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          className={`block text-xs font-normal uppercase tracking-wider mb-2 ${textMuted}`}
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
                            className={`w-full px-5 py-4 min-h-[44px] rounded-xl border font-medium outline-none transition-all ${inputBg}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          className={`block text-xs font-normal uppercase tracking-wider mb-2 ${textMuted}`}
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
                            className={`w-full px-5 py-4 min-h-[44px] rounded-xl border font-medium outline-none transition-all opacity-70 cursor-not-allowed ${inputBg}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          className={`block text-xs font-normal uppercase tracking-wider mb-2 ${textMuted}`}
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
                            className={`w-full pl-14 pr-5 py-4 rounded-xl border font-medium outline-none transition-all ${inputBg}`}
                          />
                        </div>
                      </div>
                    </>
                  ) : selectedSector === SektorInvestasi.PERTAMBANGAN ||
                    selectedSector === SektorInvestasi.PERDAGANGAN ? (
                    <>
                      <div>
                        <label
                          className={`block text-xs font-normal uppercase tracking-wider mb-2 ${textMuted}`}
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
                            className={`w-full px-5 py-4 min-h-[44px] rounded-xl border font-medium outline-none transition-all ${inputBg}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          className={`block text-xs font-normal uppercase tracking-wider mb-2 ${textMuted}`}
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
                            className={`w-full px-5 py-4 min-h-[44px] rounded-xl border font-medium outline-none transition-all ${inputBg}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          className={`block text-xs font-normal uppercase tracking-wider mb-2 ${textMuted}`}
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
                            className={`w-full px-5 py-4 min-h-[44px] rounded-xl border font-medium outline-none transition-all opacity-70 cursor-not-allowed ${inputBg}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          className={`block text-xs font-normal uppercase tracking-wider mb-2 ${textMuted}`}
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
                            className={`w-full pl-14 pr-5 py-4 rounded-xl border font-medium outline-none transition-all ${inputBg}`}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="md:col-span-2 space-y-6">
                        <label
                          className={`block text-xs font-normal uppercase tracking-wider mb-2 ${textMuted}`}
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
                            className={`w-full pl-14 pr-5 py-4 rounded-xl border font-medium text-lg outline-none transition-all ${inputBg}`}
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
                        <label className={`block text-xs font-normal uppercase tracking-wider mb-2 ${textMuted}`}>{t('financial.inputWacc')}</label>
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
                            className={`w-full px-5 py-4 min-h-[44px] rounded-xl border font-medium outline-none transition-all ${inputBg}`}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 block">{t('financial.descWacc')}</span>
                      </div>
                      <div>
                        <label className={`block text-xs font-normal uppercase tracking-wider mb-2 ${textMuted}`}>{t('financial.inputTenor')}</label>
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
                            className={`w-full px-5 py-4 min-h-[44px] rounded-xl border font-medium outline-none transition-all ${inputBg}`}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 block">{t('financial.descTenor')}</span>
                      </div>
                      <div>
                        <label className={`block text-xs font-normal uppercase tracking-wider mb-2 ${textMuted}`}>{t('financial.inputInflation')}</label>
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
                            className={`w-full px-5 py-4 min-h-[44px] rounded-xl border font-medium outline-none transition-all ${inputBg}`}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 block">{t('financial.descInflation')}</span>
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
                        className={`p-0 md:p-6 rounded-none md:rounded-[1.5rem] border-0 md:border bg-transparent ${isDark ? "md:bg-slate-900/40 md:border-slate-800/60 md:backdrop-blur-xl" : "md:bg-white/60 md:border-slate-200/50 md:backdrop-blur-xl md:shadow-xl md:shadow-slate-200/20"}`}
                      >
                        {(() => {
                          const baseScore = Math.min(100, Math.max(0,
                            (roiResult.npv > 0 ? 30 : 0) +
                            (roiResult.irr >= discountRate ? 30 : roiResult.irr > 0 ? 15 : 0) +
                            (roiResult.roi >= 15 ? 25 : roiResult.roi >= 8 ? 15 : 5) +
                            (roiResult.payback <= 5 ? 15 : roiResult.payback <= 8 ? 8 : 0)
                          ));
                          const score = typeof baseScore === 'number' && !isNaN(baseScore) ? baseScore : 0;
                          const R = 52;
                          const circ = 2 * Math.PI * R;
                          const rawOffset = circ - (score / 100) * circ;
                          const offset = typeof rawOffset === 'number' && !isNaN(rawOffset) ? rawOffset : circ;
                          const scoreColor = score >= 70 ? '#059669' : score >= 45 ? '#d97706' : '#e11d48';
                          return (
                            <div className={`flex items-center gap-6 p-5 rounded-2xl mb-4 backdrop-blur-xl border
                                             ${isDark ? 'bg-slate-900/40 border-slate-700/50 shadow-lg shadow-slate-900/50' : 'bg-white/80 border-slate-200 shadow-md shadow-slate-200/50'}`}>
                              {/* Gauge */}
                              <div className="relative w-[120px] h-[120px] flex-shrink-0">
                                <svg viewBox="0 0 120 120" width="120" height="120">
                                  <circle cx="60" cy="60" r={R} fill="none"
                                          stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="10"/>
                                  <circle cx="60" cy="60" r={R} fill="none"
                                          stroke={scoreColor} strokeWidth="10"
                                          strokeLinecap="round"
                                          strokeDasharray={circ}
                                          strokeDashoffset={circ}
                                          style={{
                                            transform: 'rotate(-90deg)',
                                            transformOrigin: '60px 60px',
                                            transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)',
                                            strokeDashoffset: offset,
                                          }}/>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                  <span className="text-2xl font-bold" style={{ color: scoreColor }}>{score}</span>
                                  <span className={`text-[9px] uppercase tracking-widest font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Skor
                                  </span>
                                </div>
                              </div>
                              {/* KPI ringkas di sebelah gauge */}
                              <div className="grid grid-cols-2 gap-3 flex-1">
                                <div>
                                  <div className={`text-[10px] uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t("landing.annualRoi", "ROI Tahunan")}</div>
                                  <div className="text-lg font-semibold text-emerald-500">{roiResult.roi.toFixed(1)}%</div>
                                  <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Kumulatif {projectionTenor}th: {roiResult.cumulativeRoi.toFixed(0)}%</div>
                                </div>
                                <div>
                                  <div className={`text-[10px] uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t("landing.netProfit", "Net Profit")}</div>
                                  <div className="text-lg font-semibold text-indigo-400">{formatRupiah(roiResult.netProfit)}</div>
                                  <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t("landing.perYearNet", "Per tahun bersih")}</div>
                                </div>
                                <div>
                                  <div className={`text-[10px] uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>NPV ({discountRate}%)</div>
                                  <div className={`text-lg font-semibold ${roiResult.npv >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {roiResult.npv >= 0 ? '+' : ''}{formatRupiah(roiResult.npv)}
                                  </div>
                                </div>
                                <div>
                                  <div className={`text-[10px] uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>IRR</div>
                                  <div className={`text-lg font-semibold ${roiResult.irr >= discountRate ? 'text-emerald-500' : roiResult.irr >= 0 ? 'text-amber-500' : 'text-rose-500'}`}>
                                    {roiResult.irr.toFixed(2)}%
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Baris 1: ROI (Kiri 50%) - BEP (Kanan 50%) */}
                          <div className="h-full">
                            <div
                              className={`p-4 md:p-5 rounded-2xl border-0 md:border h-full flex flex-col justify-between backdrop-blur-md transition-all duration-300 hover:shadow-lg ${
                                roiResult.roi >= 10
                                  ? isDark ? "bg-emerald-950/20 border-emerald-500/20 shadow-[0_4px_15px_rgba(16,185,129,0.05)] hover:border-emerald-500/40" : "bg-emerald-50/50 border-emerald-200 shadow-sm hover:border-emerald-300"
                                  : isDark ? "bg-amber-950/20 border-amber-500/20 shadow-[0_4px_15px_rgba(245,158,11,0.05)] hover:border-amber-500/40" : "bg-amber-50/50 border-amber-200 shadow-sm hover:border-amber-300"
                              }`}
                            >
                              <div>
                                <div
                                  className={`text-xs font-normal uppercase tracking-wider drop-shadow-md ${isDark ? "text-white" : "text-slate-950"}`}
                                >
                                  {t('financial.estRoiTitle')}
                                </div>
                                <div className="space-y-2 mt-2">
                                  <div className="flex items-center justify-between border-b border-dashed border-slate-500/20 pb-1.5">
                                    <span className="text-xs text-slate-400">{t('financial.roiAnnual')}</span>
                                    <span className={`font-semibold text-lg ${roiResult.roi >= 10 ? "text-emerald-500" : "text-amber-500"}`}>
                                      {roiResult.roi.toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400">{t('financial.roiCumulativeDynamic', { years: projectionTenor })}</span>
                                    <span className={`font-semibold text-lg ${roiResult.cumulativeRoi >= 50 ? "text-emerald-500" : "text-amber-500"}`}>
                                      {roiResult.cumulativeRoi.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="h-full">
                            <div
                              className={`p-4 md:p-5 rounded-2xl border-0 md:border h-full flex flex-col justify-between backdrop-blur-md transition-all duration-300 hover:shadow-lg ${
                                isDark
                                  ? "bg-slate-900/40 border-slate-700/50 hover:border-slate-600"
                                  : "bg-white/80 border-slate-200 shadow-sm hover:border-slate-300"
                              }`}
                            >
                              <div>
                                <div
                                  className={`text-xs font-normal uppercase tracking-wider ${isDark ? "text-white" : "text-slate-950"}`}
                                >
                                  {t("roiSimulator.paybackPeriod")} (BEP)
                                </div>
                                <div className="space-y-2 mt-2">
                                  <div className="flex items-center justify-between border-b border-dashed border-slate-500/20 pb-1.5">
                                    <span className="text-xs text-slate-400">{t('financial.paybackSimple')}</span>
                                    <span className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>
                                      {roiResult.payback > 99 ? t('financial.statusNotRecovered') : `${roiResult.payback.toFixed(2)} ${i18n.language?.startsWith("zh") ? "年" : i18n.language?.startsWith("en") ? "Years" : "Tahun"}`}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400">{t('financial.paybackDiscountedDynamic', { rate: discountRate })}</span>
                                    <span className={`font-semibold text-sm ${roiResult.discountedPayback <= projectionTenor ? "text-emerald-500 font-bold" : "text-rose-400"}`}>
                                      {roiResult.discountedPayback > projectionTenor ? t('financial.statusNotRecovered') : `${roiResult.discountedPayback.toFixed(2)} ${i18n.language?.startsWith("zh") ? "年" : i18n.language?.startsWith("en") ? "Years" : "Tahun"}`}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {}
                          <div className="h-full">
                            <div
                              className={`p-4 md:p-5 rounded-2xl border-0 md:border h-full flex flex-col justify-between backdrop-blur-md transition-all duration-300 hover:shadow-lg ${
                                isDark
                                  ? "bg-indigo-900/20 border-indigo-500/30 hover:border-indigo-500/50 shadow-[0_4px_15px_rgba(99,102,241,0.05)]"
                                  : "bg-indigo-50/80 border-indigo-200 shadow-sm hover:border-indigo-300"
                              }`}
                            >
                              <div>
                                <div
                                  className={`text-xs font-normal uppercase tracking-wider ${isDark ? "text-indigo-300 drop-shadow-md" : "text-indigo-900"}`}
                                >
                                  {t("roiSimulator.netProfit")}
                                </div>
                                <div
                                  className={`font-medium text-xl md:text-2xl xl:text-3xl tracking-tight mt-1 truncate ${isDark ? "text-indigo-400 drop-shadow-lg" : "text-indigo-700"}`}
                                >
                                  {formatRupiah(roiResult.netProfit)}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="h-full">
                            <div
                              className={`p-4 md:p-5 rounded-2xl border-0 md:border h-full flex flex-col justify-between backdrop-blur-md transition-all duration-300 hover:shadow-lg ${
                                isDark
                                  ? "bg-slate-900/40 border-slate-700/50 hover:border-slate-600"
                                  : "bg-white/80 border-slate-200 shadow-sm hover:border-slate-300"
                              }`}
                            >
                              <div>
                                <div
                                  className={`text-xs font-normal uppercase tracking-wider mb-1 ${isDark ? "text-white" : "text-slate-950"}`}
                                >
                                  {t("roiSimulator.feasibility")}
                                </div>
                                <div className="flex items-center min-h-[32px] mt-1">
                                  <span
                                    className={`text-[11px] sm:text-xs font-medium px-2.5 py-1.5 rounded-lg text-center w-full truncate ${
                                      (roiResult.npv > 0 && roiResult.irr >= discountRate)
                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                                        : !(roiResult.npv > 0 && roiResult.irr >= discountRate) && !(roiResult.netProfit <= 0 || roiResult.npv < 0 || roiResult.irr < 0)
                                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/20"
                                          : "bg-rose-500/20 text-rose-400 border border-rose-500/20"
                                    }`}
                                  >
                                    {roiResult.status === "FEASIBLE"
                                      ? t("financial.statusFeasible", "Sangat Layak & Feasible")
                                      : roiResult.status === "NOT_FEASIBLE"
                                        ? t("financial.statusNotFeasible", "Tidak Layak (Risiko Tinggi)")
                                        : t("financial.statusModerate", "Zona Moderat / Cukup Layak")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Baris 3: NPV (Kiri 50%) - IRR (Kanan 50%) */}
                          <div className="h-full">
                            <div
                              className={`p-4 md:p-5 rounded-2xl border-0 md:border h-full flex flex-col justify-between backdrop-blur-md transition-all duration-300 hover:shadow-lg ${
                                isDark
                                  ? "bg-slate-900/40 border-slate-800/80 hover:border-slate-700"
                                  : "bg-emerald-50/40 border-emerald-100 shadow-sm hover:border-emerald-200"
                              }`}
                            >
                              <div>
                                <div
                                  className={`text-xs font-medium uppercase tracking-wider ${isDark ? "text-emerald-400" : "text-emerald-700"}`}
                                >
                                  {t('financial.npvTitleDynamic', { rate: discountRate })}
                                </div>
                                <div
                                  className={`font-medium text-lg md:text-xl xl:text-2xl tracking-tight mt-1 truncate break-all ${
                                    roiResult.npv >= 0
                                      ? "text-emerald-500"
                                      : "text-rose-500"
                                  }`}
                                >
                                  {roiResult.npv >= 0 ? "+" : ""}
                                  {formatRupiah(roiResult.npv)}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="h-full">
                            <div
                              className={`p-4 md:p-5 rounded-2xl border-0 md:border h-full flex flex-col justify-between backdrop-blur-md transition-all duration-300 hover:shadow-lg ${
                                isDark
                                  ? "bg-slate-900/40 border-slate-800/80 hover:border-slate-700"
                                  : "bg-blue-50/40 border-blue-100 shadow-sm hover:border-blue-200"
                              }`}
                            >
                              <div>
                                <div
                                  className={`text-xs font-medium uppercase tracking-wider ${isDark ? "text-blue-400" : "text-blue-700"}`}
                                >
                                  {t("roiSimulator.irrSim")}
                                </div>
                                <div
                                  className={`font-medium text-lg md:text-xl xl:text-2xl tracking-tight mt-1 truncate ${
                                    roiResult.irr >= 10
                                      ? "text-emerald-500"
                                      : roiResult.irr >= 0
                                        ? "text-amber-500"
                                        : "text-red-500 font-medium"
                                  }`}
                                >
                                  {`${roiResult.irr.toFixed(2)}%`}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Analisis Sensitivitas NPV (Lebar Penuh) */}
                          <div className="col-span-full mt-4">
                            <div
                              className={`p-4 md:p-6 rounded-2xl border backdrop-blur-xl transition-all duration-300 ${
                                isDark
                                  ? "bg-slate-900/40 border-slate-700/50 hover:border-slate-600 hover:shadow-lg hover:shadow-slate-900/50"
                                  : "bg-white/80 border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/50"
                              }`}
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div>
                                  <h4 className="text-sm font-semibold uppercase tracking-wider text-indigo-500 flex items-center gap-2">
                                    <Activity className="w-4.5 h-4.5 animate-pulse text-indigo-400" />{t('financial.sensitivityTitle')}</h4>
                                  <p className="text-xs text-slate-400 mt-1">{t('financial.sensitivitySubtitle')}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    Real-time Sync ⚡
                                  </span>
                                  <span className="text-[10px] text-slate-500">{t('financial.unitMillion')}</span>
                                </div>
                              </div>

                              {}
                              {sensitivityChartData.length > 0 && (() => {
                                const baseline = sensitivityChartData[Math.floor(sensitivityChartData.length / 2)]?.['Baseline'] ?? 0;
                                const highInfl = sensitivityChartData[Math.floor(sensitivityChartData.length / 2)]?.['Inflasi Tinggi (+5%)'] ?? 0;
                                const noInfl   = sensitivityChartData[Math.floor(sensitivityChartData.length / 2)]?.['Tanpa Inflasi (0%)'] ?? 0;
                                const maxAbs = Math.max(Math.abs(baseline), Math.abs(highInfl), Math.abs(noInfl), 1);

                                const rows = [
                                  { label: `Baseline (${inflationRate}%)`, value: baseline, color: '#059669' },
                                  { label: `Inflasi tinggi (+5%)`,          value: highInfl, color: '#e11d48' },
                                  { label: `Tanpa inflasi (0%)`,            value: noInfl,   color: '#10b981' },
                                  ];
                                return (
                                  <div className="flex flex-col gap-3">
                                    {rows.map((row, i) => {
                                      const rawPct = Math.min(100, Math.abs(row.value) / maxAbs * 100);
                                      const pct = typeof rawPct === 'number' && !isNaN(rawPct) ? rawPct : 0;
                                      return (
                                        <div key={i} className="flex items-center gap-3">
                                          <span className={`text-[11px] w-36 flex-shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{row.label}</span>
                                          <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                            <div className="h-full rounded-full transition-all duration-700"
                                                 style={{ width: `${pct}%`, background: row.color, transitionDelay: `${i * 100}ms` }} />
                                          </div>
                                          <span className={`text-[11px] font-medium w-20 text-right flex-shrink-0
                                                            ${row.value >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {row.value >= 0 ? '+' : ''}{row.value.toLocaleString('id-ID')}Jt
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()}

                              {/* Keterangan Analisis */}
                              <div className="mt-4 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-[11px] md:text-xs text-slate-400 space-y-2 leading-relaxed">
                                <p className="font-medium text-indigo-400">
                                  💡 {t('financial.interpretationTitle')}
                                </p>
                                <ul className="list-disc pl-4 space-y-1">
                                  <li>
                                    <span>{t('financial.interpretationInterest')}</span></li>
                                  <li>
                                    <span>{t('financial.interpretationInflation')}</span></li>
                                </ul>
                              </div>
                            </div>
                          </div>

                          {/* Baris 4: Tombol AI & Analisis Lanjutan (Lebar Penuh) */}
                          <div className="col-span-full mt-4 border-t pt-5 border-slate-500/10 flex flex-col gap-3">
                            <div className="flex flex-col sm:flex-row gap-4">
                              <motion.button whileTap={{ scale: 0.95 }}
                                whileHover={{ scale: 1.02 }}
                                onClick={() => setIsRoiAiModalOpen(true)}
                                className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm tracking-wider uppercase transition-all duration-300 backdrop-blur-xl border border-blue-300/40 shadow-[0_8px_25px_rgba(37,99,235,0.35)] hover:shadow-[0_12px_35px_rgba(147,51,234,0.45)] flex items-center justify-center gap-2.5 group font-display cursor-pointer"
                              >
                                <Bot className="w-5 h-5 group-hover:scale-110 group-hover:animate-pulse transition-transform" />
                                <span>{t("roiSimulator.askAi")} ✨</span>
                              </motion.button>

                              <motion.button whileTap={{ scale: 0.95 }}
                                whileHover={{ scale: 1.02 }}
                                onClick={() => setIsSpatialAiModalOpen(true)}
                                className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-xs sm:text-sm tracking-wider uppercase transition-all duration-300 backdrop-blur-xl border border-cyan-300/40 shadow-[0_8px_25px_rgba(8,145,178,0.35)] hover:shadow-[0_12px_35px_rgba(16,185,129,0.45)] flex items-center justify-center gap-2.5 group font-display cursor-pointer"
                              >
                                <Compass
                                  className="w-5 h-5 group-hover:scale-110 group-hover:animate-spin transition-transform"
                                  style={{ animationDuration: "6s" }}
                                />
                                <span>{t('roiSimulator.analyzePotential')} 🗺️</span>
                              </motion.button>
                            </div>

                            {/* Triple Direct Regional Analysis Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                              <button
                                type="button"
                                onClick={() => setIsRtrwModalOpen(true)}
                                className="py-3 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                              >
                                <ShieldCheck size={16} className="text-emerald-400" />
                                <span>{t('rtrwZoning.button', 'Cek RTRW Zona Spasial')}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setIsIncentiveModalOpen(true)}
                                className="py-3 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                              >
                                <Award size={16} className="text-amber-400" />
                                <span>{t('incentiveCalculator.button', 'Kalkulator Insentif Perda')}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setIsProximityModalOpen(true)}
                                className="py-3 px-4 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                              >
                                <Navigation size={16} className="text-cyan-400" />
                                <span>{t('proximityMatrix.button', 'Matriks Supply Chain')}</span>
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
        <div className="container max-w-7xl mx-auto px-4 lg:px-6 mb-16">
          <div className="flex justify-center w-full">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                handleRequestFullscreen();
                navigate("/login?role=investor");
              }}
              className={`px-8 py-4 min-h-[44px] rounded-2xl font-bold uppercase tracking-wider border backdrop-blur-md transition-all duration-500 ease-out flex items-center justify-center gap-2.5 group bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 border-emerald-400/40`}
            >
              <UserPlus size={19} className={`transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12 text-amber-300`} />
              {t("landing.register", "Login Investor")}
            </motion.button>
          </div>
        </div>

        {/* KATALOG KEMITRAAN UMKM LUWU */}
        <section className={`py-16 border-b relative ${isDarkMode ? "bg-[#0c1120] border-slate-800/60" : "bg-white border-slate-200"}`}>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-[10%] -right-[5%] w-[40vw] h-[40vw] rounded-full bg-emerald-500/5 blur-[100px] mix-blend-screen" />
            <div className="absolute -bottom-[10%] -left-[5%] w-[40vw] h-[40vw] rounded-full bg-blue-500/5 blur-[100px] mix-blend-screen" />
          </div>
          <div className="container mx-auto px-4 lg:px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <span className={`inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-full text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-xl border opacity-0 animate-fade-in-up ${isDarkMode ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-200 border-amber-400/30 shadow-sm" : "bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700 border-amber-300 shadow-sm shadow-amber-500/10"}`} style={{ animationDelay: '50ms' }}>
                <Store size={14} /> {t("umkm_catalog")}
              </span>
              <h3 className={`text-3xl font-light tracking-tight mb-4 opacity-0 animate-fade-in-up ${isDarkMode ? "text-white" : "text-slate-900"}`} style={{ animationDelay: '150ms' }}>
                {t("umkm_catalog")}
              </h3>
              <p className={`text-sm mb-8 opacity-0 animate-fade-in-up ${isDarkMode ? "text-slate-400" : "text-slate-500"}`} style={{ animationDelay: '250ms' }}>
                {t("umkm_catalog_desc")}
              </p>
              
              {/* Category Filter Pills */}
              <div className="flex flex-wrap justify-center gap-2">
                {['Semua', 'Kuliner', 'Kriya/Kerajinan'].map(cat => (
                  <motion.button whileTap={{ scale: 0.95 }}
                    key={cat === "Semua" ? (isZh ? "全部" : isEn ? "All" : "Semua") : cat === "Kuliner" ? (isZh ? "烹饪美食" : isEn ? "Culinary" : "Kuliner") : cat === "Kriya/Kerajinan" ? (isZh ? "手工艺品" : isEn ? "Crafts" : "Kriya/Kerajinan") : cat}
                    onClick={() => setActiveFilter(cat)}
                    className={`px-5 py-2.5 min-h-[44px] rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 backdrop-blur-xl border ${
                      activeFilter === cat 
                        ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 text-white border-emerald-300/40 shadow-lg shadow-emerald-500/30" 
                        : isDarkMode
                          ? "bg-slate-900/60 text-slate-300 hover:bg-slate-800/80 border-slate-700/80 hover:border-emerald-500/40 hover:shadow-md"
                          : "bg-white/80 text-slate-600 hover:bg-slate-50 border-slate-200 hover:border-emerald-300 shadow-sm"
                    }`}
                  >
                    {cat}
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* KATALOG KEMITRAAN UMKM GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {umkmData.filter(item => activeFilter === "Semua" || item.kategori === activeFilter).map((product) => (
                <div key={product.id} className={`relative rounded-[2rem] overflow-hidden border transition-all duration-500 ease-out hover:-translate-y-2 group glass-panel ${isDarkMode ? "bg-slate-900/50 border-slate-700/50 hover:border-emerald-500/40 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.3)]" : "bg-white/75 border-slate-200/80 hover:border-emerald-400/50 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.2)] backdrop-blur-2xl"}`}>
                  <div className="relative h-64 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img src={product.image} alt={isZh ? (product.nama_produk_zh || product.nama_produk) : isEn ? (product.nama_produk_en || product.nama_produk) : product.nama_produk} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className={`absolute top-4 right-4 px-3 py-1.5 text-[10px] font-bold rounded-full uppercase tracking-wider backdrop-blur-md shadow-sm border ${isDarkMode ? "bg-emerald-500/30 text-emerald-200 border-emerald-400/40" : "bg-emerald-500/20 text-emerald-900 border-emerald-400/50"}`}>
                      {product.status_izin}
                    </div>
                  </div>
                  <div className="p-6 relative z-10">
                    <h4 className={`font-bold text-lg mb-1 line-clamp-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{isZh ? (product.nama_produk_zh || product.nama_produk) : isEn ? (product.nama_produk_en || product.nama_produk) : product.nama_produk}</h4>
                    <p className={`text-sm mb-5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{isZh ? "店主：" : isEn ? "Owner: " : "Owner: "}{product.nama_pemilik}</p>
                    
                    <div className="flex flex-col gap-3">
                      <motion.button whileTap={{ scale: 0.95 }} 
                        onClick={() => setSelectedUMKM(product)}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 backdrop-blur-xl border shadow-sm ${
                          isDarkMode 
                            ? "bg-slate-800/60 text-slate-200 border-slate-600/50 hover:bg-slate-700 hover:text-white hover:border-slate-500 hover:shadow-md" 
                            : "bg-white/80 text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 hover:shadow-md"
                        }`}
                      >
                        <Search size={16} className="group-hover:rotate-6 transition-transform duration-300" /> 
                        <span>{isZh ? "查看详情" : isEn ? "View Details" : "Lihat Detail"}</span>
                      </motion.button>
                      <a 
                        href={`https://wa.me/${product.no_wa}?text=Halo,%20saya%20melihat%20produk%20Anda%20di%20InvestLuwu%20Hub...`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 backdrop-blur-xl border shadow-sm ${
                          isDarkMode 
                            ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-400/40 hover:from-emerald-500/30 hover:to-teal-500/30 hover:border-emerald-300 hover:text-emerald-200 hover:shadow-emerald-500/20" 
                            : "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200 hover:from-emerald-100 hover:to-teal-100 hover:border-emerald-300 hover:shadow-emerald-500/10"
                        }`}
                      >
                        <MessageSquare size={16} /> {isZh ? "联系店主 (WhatsApp)" : isEn ? "Contact Owner (WA)" : "Hubungi Pemilik (WA)"}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <TestimonialSection isDark={isDarkMode} />

        {}
        <section className={`py-16 border-b ${isDark ? "bg-[#0c1120] border-slate-800/60" : "bg-slate-50 border-slate-200"}`}>
          <div className="container mx-auto px-4 lg:px-6">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className={`inline-flex items-center gap-2 px-4 py-1.5 min-h-[44px] rounded-full text-xs font-normal uppercase tracking-wider mb-4 border opacity-0 animate-fade-in-up ${isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`} style={{ animationDelay: '50ms' }}>
                <Activity size={14} className="animate-pulse" /> {t("performance.tag", "Akuntabilitas Kinerja Pemkab Luwu")}
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight mb-3 opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                {t("performance.title", "Akuntabilitas Kinerja DPMPTSP Kabupaten Luwu")}
              </h2>
              <div className="h-1 w-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mb-6 mx-auto opacity-0 animate-fade-in-up" style={{ animationDelay: '250ms' }}></div>
              <p className={`text-base lg:text-lg ${textMuted} opacity-0 animate-fade-in-up`} style={{ animationDelay: '350ms' }}>
                {t("performance.subtitle", "Laporan transparan capaian IKM serta standar tingkat layanan (SLA) perizinan terpadu.")}
              </p>
            </div>

            <div className="flex justify-center">
              {/* DPMPTSP LIVE SLA & PERFORMANCE METRICS */}
              <div className={`w-full max-w-4xl p-6 sm:p-8 rounded-[2rem] border flex flex-col justify-between relative overflow-hidden shadow-lg ${cardBg}`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-400/5 blur-3xl pointer-events-none" />

                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium tracking-tight">{t("performance.mppIndicator", "Indikator Layanan DPMPTSP")}</h3>
                      <p className={`text-xs ${textMuted}`}>{t("performance.mppIndicatorDesc", "SLA & Kepuasan Publik Real-time")}</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {[
                      {
                        title: t("performance.metrics.ikm.title", "Indeks Kepuasan Masyarakat"),
                        desc: t("performance.metrics.ikm.desc", "Survei Kepuasan Publik Sesuai Permenpan RB"),
                        value: stats?.performance?.ikm || "Belum ada data tersedia",
                        suffix: stats?.performance?.ikm ? t("performance.metrics.ikm.suffix", "/100") : "",
                        colorClass: "text-emerald-500",
                        badge: stats?.performance?.ikm ? t("performance.metrics.ikm.badge", "Sangat Baik") : "Belum ada data",
                        hasData: !!stats?.performance?.ikm
                      },
                      {
                        title: t("performance.metrics.nibSla.title", "SLA Durasi Terbit NIB Mandiri"),
                        desc: t("performance.metrics.nibSla.desc", "Pemrosesan izin risiko rendah secara instan"),
                        value: stats?.performance?.nibSla || "Belum ada data tersedia",
                        suffix: stats?.performance?.nibSla ? t("performance.metrics.nibSla.suffix", " Menit") : "",
                        colorClass: "text-blue-500",
                        badge: stats?.performance?.nibSla ? t("performance.metrics.nibSla.badge", "Otomatis") : "Belum ada data",
                        hasData: !!stats?.performance?.nibSla
                      },
                      {
                        title: t("performance.metrics.spatialAccuracy.title", "Akurasi Verifikasi Tata Ruang"),
                        desc: t("performance.metrics.spatialAccuracy.desc", "Kesesuaian plotting sistem dengan RT-RW"),
                        value: stats?.performance?.spatialAccuracy || "Belum ada data tersedia",
                        suffix: stats?.performance?.spatialAccuracy ? t("performance.metrics.spatialAccuracy.suffix", "%") : "",
                        colorClass: "text-teal-500",
                        badge: stats?.performance?.spatialAccuracy ? t("performance.metrics.spatialAccuracy.badge", "Valid") : "Belum ada data",
                        hasData: !!stats?.performance?.spatialAccuracy
                      }
                    ].map((metric, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-500/5 border border-slate-500/10 hover:border-slate-500/20 transition-all">
                        <div className="min-w-0 pr-2">
                          <p className="text-sm font-medium truncate">{metric.title}</p>
                          <p className={`text-[11px] ${textMuted} truncate`}>{metric.desc}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`font-bold tracking-tight ${metric.hasData ? "text-lg " + metric.colorClass : "text-xs font-medium text-slate-400"}`}>
                            {metric.value}
                            {metric.hasData && <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{metric.suffix}</span>}
                          </p>
                          <span className="text-[9px] font-mono uppercase bg-slate-500/10 text-slate-400 dark:text-slate-300 px-1.5 py-0.5 rounded">
                            {metric.badge}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* --- SINERGI LINTAS BIDANG ECOSYSTEM --- */}
            <div className="mt-12 relative bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none rounded-2xl p-6 md:p-8 overflow-hidden backdrop-blur-sm">
              {/* Background Glow Effect */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none"></div>
              
              <div className="text-center mb-10 relative z-10">
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t("dpmptsp_ecosystem")}</h3>
                <p className="text-emerald-400 font-medium tracking-widest uppercase text-sm mt-1">{t("dpmptsp_ecosystem")}</p>
              </div>

              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center md:items-start gap-8 md:gap-4 text-center md:text-left">
                
                {/* Animated Connecting Line (Desktop Only) */}
                <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-1 bg-slate-200 dark:bg-slate-800 rounded-full z-0 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent w-1/2 animate-[translateX_3s_linear_infinite]" 
                       style={{ animation: 'shimmer 2.5s infinite linear' }}>
                    <style>{`
                      @keyframes shimmer {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(200%); }
                      }
                    `}</style>
                  </div>
                </div>

                {/* STEP 1: PROMOSI */}
                <div className="flex flex-col items-center relative z-10 w-full md:w-1/4 group transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:cursor-pointer hover:shadow-slate-200 dark:hover:shadow-emerald-900/30 rounded-2xl py-4" title="Bidang Promosi: Memverifikasi minat awal investor (LoI) dan melakukan proses KYC.">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-cyan-500/50 flex items-center justify-center text-cyan-500 dark:text-cyan-400 shadow-sm dark:shadow-[0_0_15px_rgba(6,182,212,0.3)] group-hover:shadow-md dark:group-hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all duration-300">
                    <Megaphone className="w-7 h-7 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h4 className="text-slate-800 dark:text-white font-bold mt-4 mb-1">{t("dept_promotion")}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center px-2">{t("landing.screening", "Penjaringan & Verifikasi Minat (LoI)")}</p>
                </div>

                {/* STEP 2: DALAK */}
                <div className="flex flex-col items-center relative z-10 w-full md:w-1/4 group transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:cursor-pointer hover:shadow-slate-200 dark:hover:shadow-emerald-900/30 rounded-2xl py-4" title="Bidang Dalak: Turun ke lapangan, mengawal Site Visit, dan memediasi lahan.">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-amber-500/50 flex items-center justify-center text-amber-500 dark:text-amber-400 shadow-sm dark:shadow-[0_0_15px_rgba(245,158,11,0.3)] group-hover:shadow-md dark:group-hover:shadow-[0_0_25px_rgba(245,158,11,0.6)] transition-all duration-300">
                    <ShieldCheck className="w-7 h-7 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h4 className="text-slate-800 dark:text-white font-bold mt-4 mb-1">{t("dept_dalak")}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center px-2">{t("landing.siteVisit", "Kawal Site Visit & Mediasi Lahan")}</p>
                </div>

                {/* STEP 3: PERIZINAN */}
                <div className="flex flex-col items-center relative z-10 w-full md:w-1/4 group transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:cursor-pointer hover:shadow-slate-200 dark:hover:shadow-emerald-900/30 rounded-2xl py-4" title="Bidang Perizinan: Mengeksekusi legalitas NIB dan PKKPR di sistem OSS.">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-emerald-500/50 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:shadow-md dark:group-hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] transition-all duration-300">
                    <Stamp className="w-7 h-7 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h4 className="text-slate-800 dark:text-white font-bold mt-4 mb-1">{t("dept_licensing")}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center px-2">{t("landing.legalExecution", "Eksekusi Legalitas & OSS-RBA")}</p>
                </div>

                {/* STEP 4: DATA & PELAPORAN */}
                <div className="flex flex-col items-center relative z-10 w-full md:w-1/4 group transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:cursor-pointer hover:shadow-slate-200 dark:hover:shadow-emerald-900/30 rounded-2xl py-4" title="Bidang Data: Memonitor realisasi investasi secara Real-Time.">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-purple-500/50 flex items-center justify-center text-purple-500 dark:text-purple-400 shadow-sm dark:shadow-[0_0_15px_rgba(168,85,247,0.3)] group-hover:shadow-md dark:group-hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] transition-all duration-300">
                    <BarChart3 className="w-7 h-7 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h4 className="text-slate-800 dark:text-white font-bold mt-4 mb-1">{t("dept_data")}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center px-2">{t("landing.commandCenter", "Pusat Komando & Dashboard Eksekutif")}</p>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* FINANCIAL TICKER */}
        <TickerMarquee />

        {/* 6. FOOTER */}
        <footer
          className={`pt-8 pb-24 md:pb-8 border-t mt-auto transition-colors duration-500 ease-in-out ${isDark ? "border-slate-800 bg-slate-950/80" : "border-slate-200 bg-slate-50"}`}
        >
          <div className="container mx-auto px-4 lg:px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                <img
                  src="https://i.ibb.co.com/KxKKb5d8/transparant.png"
                  alt="Logo Kabupaten Luwu"
                  className="w-10 h-10 object-contain"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4
                    className={`font-medium text-lg leading-none ${isDark ? "text-white" : "text-slate-950"}`}
                  >
                    InvestLuwu Hub
                  </h4>
                  <span className={`text-xs ${textMuted}`}>
                    {t("footer.gov")}
                  </span>
                </div>
              </div>

              <div
                className={`text-sm ${textMuted} hidden md:flex gap-4 md:gap-8`}
              >
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => scrollToSection("hero-section")}
                  className="hover:text-blue-500 transition-colors"
                >
                  {t("footer.home")}
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => scrollToSection("potensi-section")}
                  className="hover:text-blue-500 transition-colors"
                >
                  {t("footer.regionalPotential")}
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => scrollToSection("infrastruktur-section")}
                  className="hover:text-blue-500 transition-colors"
                >
                  {t("footer.infrastructure")}
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onEnter) {
                      onEnter(Role.INVESTOR);
                    } else {
                      navigate("/peta-spasial");
                    }
                  }}
                  className="hover:text-blue-500 transition-colors font-medium text-blue-500"
                >
                  {t("footer.interactiveDashboard")}
                </motion.button>
              </div>
            </div>

            <div
              className={`mt-6 pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] md:text-xs transition-colors duration-500 ease-in-out ${isDark ? "border-slate-800/60" : "border-slate-200"}`}
            >
              <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide text-center md:text-left leading-relaxed">
                &copy; {new Date().getFullYear()} {t("footer.gov")}. {t("footer.rights")}
              </p>
              <div className="flex gap-4">
                <span className="text-slate-400 dark:text-slate-500 font-mono tracking-wider">
                  Versi 2.0.1 (Precision Engine)
                </span>
              </div>
            </div>
          </div>
        </footer>

        {/* BOTTOM NAVIGATION BAR (MOBILE ONLY) */}
        <div 
          className="flex md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-t border-slate-200/60 dark:border-slate-800/60 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] transition-all duration-300"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex justify-around items-center w-full h-[72px] px-3">
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => scrollToSection("hero-section")}
              className={`flex-1 flex flex-col items-center justify-center h-full py-2 transition-all active:scale-90 ${
                isHomeActive
                  ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              <div className={`p-1 px-3 rounded-full transition-all ${isHomeActive ? "bg-emerald-500/10 dark:bg-emerald-400/10" : "hover:bg-slate-100 dark:hover:bg-slate-800/50"}`}>
                <Home size={22} className="mb-0.5" />
              </div>
              <span className="text-[10px] font-normal tracking-tight mt-0.5">
                {t("footer.home")}
              </span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onEnter) {
                  onEnter(Role.INVESTOR);
                } else {
                  navigate("/peta-spasial");
                }
              }}
              className="flex-1 flex flex-col items-center justify-center h-full py-2 transition-all active:scale-90 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <div className="p-1 px-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all">
                <Globe size={22} className="mb-0.5 animate-spin-slow" />
              </div>
              <span className="text-[10px] font-normal tracking-tight mt-0.5">
                Peta GIS
              </span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => scrollToSection("analytics-section")}
              className={`flex-1 flex flex-col items-center justify-center h-full py-2 transition-all active:scale-90 ${
                isSimulatorActive
                  ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              <div className={`p-1 px-3 rounded-full transition-all ${isSimulatorActive ? "bg-emerald-500/10 dark:bg-emerald-400/10" : "hover:bg-slate-100 dark:hover:bg-slate-800/50"}`}>
                <Activity size={22} className="mb-0.5" />
              </div>
              <span className="text-[10px] font-normal tracking-tight mt-0.5">
                Simulator
              </span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => scrollToSection("ai-assistant")}
              className={`flex-1 flex flex-col items-center justify-center h-full py-2 transition-all active:scale-90 ${
                isAiActive
                  ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              <div className={`p-1 px-3 rounded-full transition-all ${isAiActive ? "bg-emerald-500/10 dark:bg-emerald-400/10" : "hover:bg-slate-100 dark:hover:bg-slate-800/50"}`}>
                <Sparkles size={22} className={`mb-0.5 ${isAiActive ? "text-emerald-600 dark:text-emerald-400" : "text-emerald-500 dark:text-emerald-400"}`} />
              </div>
              <span className="text-[10px] font-normal tracking-tight mt-0.5">
                Tanya AI
              </span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Scroll to Top/Bottom Buttons */}
      <AnimatePresence>
        {scrollY > 300 && (
          <motion.button whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className={`fixed z-50 right-6 ${isMobile ? "bottom-24" : "bottom-8"} p-3 rounded-full shadow-lg transition-all duration-300 ${isDark ? "bg-slate-800 text-white hover:bg-emerald-500" : "bg-white text-slate-800 hover:bg-emerald-100 hover:text-emerald-700 border border-slate-200"}`}
            aria-label="Scroll to top"
          >
            <ArrowUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {scrollY > 50 && maxScroll > 0 && scrollY < maxScroll - 300 && (
          <motion.button whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            onClick={() =>
              window.scrollTo({
                top: document.body.scrollHeight,
                behavior: "smooth",
              })
            }
            className={`fixed z-50 right-6 ${isMobile ? "bottom-[140px]" : "bottom-[88px]"} p-3 rounded-full shadow-lg transition-all duration-300 ${isDark ? "bg-slate-800 text-white hover:bg-emerald-500" : "bg-white text-slate-800 hover:bg-emerald-100 hover:text-emerald-700 border border-slate-200"}`}
            aria-label="Scroll to bottom"
          >
            <ArrowDown size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {isRoiAiModalOpen &&
        (() => {
          const simCtx = getSimulationContext();
          return (
            <RoiAiAnalysisModal
              isOpen={isRoiAiModalOpen}
              onClose={() => setIsRoiAiModalOpen(false)}
              investmentName={simCtx.name}
              sector={simCtx.sector}
              capex={simCtx.capex}
              revenue={simCtx.asumsiPendapatan}
              opex={simCtx.opex}
              paybackPeriod={simCtx.bep}
              irr={simCtx.irr}
              npv={simCtx.npv}
              discountRate={discountRate}
              roi={simCtx.roi}
              isDarkMode={isDark}
              isUsingOSS={isUsingOSS}
            />
          );
        })()}

      <LuwuInvestmentAiModal
        isOpen={isSpatialAiModalOpen}
        onClose={() => setIsSpatialAiModalOpen(false)}
        isDarkMode={isDark}
        selectedInvestment={selectedInvObj}
      />

      {/* ADVANCED SPATIAL & INCENTIVE MODALS FOR LANDING PAGE */}
      <RtrwZoningCheckerModal
        isOpen={isRtrwModalOpen}
        onClose={() => setIsRtrwModalOpen(false)}
        selectedInvestment={selectedInvObj}
        investments={investments}
        isDark={isDark}
        simulationContext={getSimulationContext()}
      />

      <IncentiveCalculatorModal
        isOpen={isIncentiveModalOpen}
        onClose={() => setIsIncentiveModalOpen(false)}
        selectedInvestment={selectedInvObj}
        isDark={isDark}
        simulationContext={getSimulationContext()}
      />

      <ProximityDistanceMatrixModal
        isOpen={isProximityModalOpen}
        onClose={() => setIsProximityModalOpen(false)}
        selectedInvestment={selectedInvObj}
        investments={investments}
        isDark={isDark}
        simulationContext={getSimulationContext()}
      />

      <AnimatePresence>
        {selectedUMKM && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSelectedUMKM(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl relative ${isDark ? "bg-slate-900 border border-slate-800" : "bg-white"}`}
            >
              <motion.button whileTap={{ scale: 0.95 }} 
                onClick={() => setSelectedUMKM(null)}
                className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-colors ${isDark ? "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white" : "bg-white/80 text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
              >
                <X size={20} />
              </motion.button>
              
              <div className="relative h-64 sm:h-80 w-full bg-slate-100 dark:bg-slate-800">
                <img src={selectedUMKM.image} alt={isZh ? (selectedUMKM.nama_produk_zh || selectedUMKM.nama_produk) : isEn ? (selectedUMKM.nama_produk_en || selectedUMKM.nama_produk) : selectedUMKM.nama_produk} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                  <div className={`px-3 py-1.5 min-h-[44px] text-xs font-bold rounded uppercase tracking-wider backdrop-blur-sm border ${isDark ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                    {isZh ? selectedUMKM.kategori_zh : isEn ? selectedUMKM.kategori_en : selectedUMKM.kategori}
                  </div>
                </div>
              </div>
              
              <div className="p-6 sm:p-8">
                <h3 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>{isZh ? (selectedUMKM.nama_produk_zh || selectedUMKM.nama_produk) : isEn ? (selectedUMKM.nama_produk_en || selectedUMKM.nama_produk) : selectedUMKM.nama_produk}</h3>
                
                <div className="flex items-center gap-3 mb-6">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded uppercase tracking-wider border ${isDark ? "bg-blue-500/10 text-blue-400 border-blue-500/30" : "bg-blue-50 text-blue-600 border-blue-200"}`}>
                    {selectedUMKM.status_izin}
                  </span>
                </div>
                
                <div className={`text-2xl font-black mb-8 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                  {selectedUMKM.harga}
                </div>
                
                <div className="space-y-4 mb-8">
                  {selectedUMKM.kategori === 'Kuliner' && selectedUMKM.bahan && (
                    <div className="flex gap-3">
                      <div className={`p-2 rounded-lg h-fit ${isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-600"}`}>
                        <Leaf size={18} />
                      </div>
                      <div>
                        <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{isZh ? "配料/材料" : isEn ? "Ingredients/Materials" : "Bahan"}</p>
                        <p className={`text-sm sm:text-base ${isDark ? "text-slate-300" : "text-slate-700"}`}>{isZh ? selectedUMKM.bahan_zh : isEn ? selectedUMKM.bahan_en : selectedUMKM.bahan}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <div className={`p-2 rounded-lg h-fit ${isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                      <Store size={18} />
                    </div>
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{isZh ? "店主" : isEn ? "Owner" : "Pemilik"}</p>
                      <p className={`text-sm sm:text-base ${isDark ? "text-slate-300" : "text-slate-700"}`}>{selectedUMKM.nama_pemilik}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className={`p-2 rounded-lg h-fit ${isDark ? "bg-rose-500/10 text-rose-400" : "bg-rose-50 text-rose-600"}`}>
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{isZh ? "地址" : isEn ? "Address" : "Alamat"}</p>
                      <p className={`text-sm sm:text-base ${isDark ? "text-slate-300" : "text-slate-700"}`}>{isZh ? selectedUMKM.alamat_zh : isEn ? selectedUMKM.alamat_en : selectedUMKM.alamat}</p>
                    </div>
                  </div>
                </div>
                
                <div className={`flex flex-col sm:flex-row gap-3 pt-6 border-t ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                  <motion.button whileTap={{ scale: 0.95 }} 
                    onClick={() => handleShareUMKM(selectedUMKM)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 sm:py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 border ${isDark ? "bg-slate-800 text-white border-slate-700 hover:bg-slate-700" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}
                  >
                    <Share2 size={18} /> {isZh ? "分享" : isEn ? "Share" : "Bagikan"}
                  </motion.button>
                  <a 
                    href={`https://wa.me/${selectedUMKM.no_wa}?text=Halo,%20saya%20melihat%20produk%20Anda%20di%20InvestLuwu%20Hub...`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-[2] flex items-center justify-center gap-2 py-3 sm:py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20"
                  >
                    <MessageSquare size={18} /> {isZh ? "联系店主 (WhatsApp)" : isEn ? "Contact Owner (WA)" : "Hubungi Pemilik (WA)"}
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Mobile Android Native Navigation Dock */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 220, damping: 25 }}
        className={`md:hidden fixed bottom-3 left-2.5 right-2.5 z-40 rounded-2xl border backdrop-blur-2xl shadow-2xl p-1.5 flex items-center justify-between gap-1 ${
          isDark
            ? "bg-slate-950/90 border-slate-800/90 text-slate-300 shadow-black/80"
            : "bg-white/95 border-slate-200/90 text-slate-700 shadow-slate-900/15"
        }`}
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
      >
        <motion.button whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => scrollToSection("hero-section")}
          className="flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all active:scale-90 text-blue-500"
        >
          <Home size={19} className="mb-0.5 drop-shadow-sm" />
          <span className="truncate">{t("landing.home", "Beranda")}</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }}
          type="button"
          onClick={(e) => {
            e?.preventDefault?.();
            if (onEnter) {
              onEnter(Role.INVESTOR);
            } else {
              navigate("/peta-spasial");
            }
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all active:scale-90 ${
            isDark ? "text-slate-300 hover:text-emerald-400" : "text-slate-700 hover:text-emerald-600"
          }`}
        >
          <Compass size={19} className="mb-0.5 text-emerald-500" />
          <span className="truncate">{t("landing.gisMap", "Peta GIS")}</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => scrollToSection("potensi-section")}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all active:scale-90 ${
            isDark ? "text-slate-300 hover:text-amber-400" : "text-slate-700 hover:text-amber-600"
          }`}
        >
          <TrendingUp size={19} className="mb-0.5 text-amber-500" />
          <span className="truncate">{t("landing.potential", "Potensi")}</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => { handleRequestFullscreen(); navigate("/login?role=investor"); }}
          className="flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] font-black text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 shadow-md shadow-emerald-500/30 active:scale-90 border border-emerald-300/40"
        >
          <UserPlus size={19} className="mb-0.5 text-amber-300" />
          <span className="truncate">{t("landing.investor", "Investor")}</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => { handleRequestFullscreen(); navigate("/login"); }}
          className="flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] font-black text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-md shadow-blue-500/30 active:scale-90 border border-blue-300/40"
        >
          <Zap size={19} className="mb-0.5 text-yellow-300" />
          <span className="truncate">{t("landing.login", "Masuk")}</span>
        </motion.button>
              </motion.div>
                </div>
  );
}

// trigger sync for realtime hero stats
// ui update: labor absorption metrics dashboard
// ui update: add PMA/PMDN chart
// ui update: add animated dpmptsp ecosystem pipeline
// ui update: add empty UMKM Catalog section
// ui update: i18n applied
// ui cleanup: removed Prosedur & Layanan Spasial section

// ui polish: fix dashboard layout collision and chart visuals

// ui polish: fix dashboard layout collision and chart visuals

// hotfix: force dashboard visuals and z-index

// architecture pivot: implement strict mobile-first responsive design

// ui polish: inject bright glassmorphism aesthetics

// ui polish: implement clean boardroom light mode

// ui polish: execute final visual fine-tuning

// ui polish: implement clean boardroom light mode for mpp banner

// ui reorder: move analytics chart up for strategic hook

// ui polish: fix mpp banner dark mode consistency

// ui polish: brighten mpp banner background in dark mode with glassmorphism emerald theme

// ui polish: remove photo frame in mpp banner for seamless background integration

// ux polish: rename dashboard button to login admin for clear rbac entry

// ui polish: update registrasi button to a dropdown with role choices
