import { FALLBACK_HERO_IMAGE, FALLBACK_FACILITY_IMAGE, FALLBACK_NEWS_IMAGE, FALLBACK_AGENCY_IMAGE, FALLBACK_GENERIC_IMAGE, handleImageError, getSafeImageUrl } from "../utils/imageFallbacks";
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, type Variants, AnimatePresence, useReducedMotion } from 'motion/react';
import { 
  Building2, Car, Store,
  Bot, Bell, Menu, Ticket, SearchCheck, Pointer, Search, CheckSquare, 
  ChevronRight, ChevronLeft, Sparkles, Star, Laptop, Accessibility, Home, LayoutGrid, 
  Layers, HelpCircle, Armchair, Baby, Gamepad2, Moon, BookOpen, 
  HeartHandshake, CheckCircle2, Play, Pause, Apple,
  Clock, CalendarDays, Calendar, TrendingUp, BarChart3,
  MessageSquare, ShieldCheck, Headphones, ArrowRight, ArrowUpRight,
  HardHat, MapPin, User, Mail, Phone, X, Check, Briefcase,
  Instagram, Youtube, Facebook, Music2, Heart, MessageCircle, Share2, ExternalLink,
  Send, FileText, QrCode, Printer, Copy, RotateCcw, Download, FileCheck, Clock3, AlertCircle, Loader2
, Globe, Map, Package, BadgeCheck, Lock, Unlock, Plus, Trash2, Volume2, VolumeX, Radio, Info, Mic, Maximize2, ZoomIn, Eye, EyeOff, BellRing, Zap, WifiOff, Newspaper } from 'lucide-react';
import { CountUpNumber } from './common/CountUpNumber';
import { useCountUp } from '../hooks/useCountUp';
import { WeatherWidget } from './WeatherWidget';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import { useTranslation } from 'react-i18next';
import { lazyWithRetry } from '../utils/lazyWithRetry';
const MppVisionModal = lazyWithRetry(() => import('./MppVisionModal').then(m => ({ default: m.MppVisionModal })));
const AirportCallingAlertModal = lazyWithRetry(() => import('./mpp/AirportCallingAlertModal').then(m => ({ default: m.AirportCallingAlertModal })));
import { triggerFullAirportCallingAlert } from '../utils/airportAudioAlert';
import { printMppQueueTicket } from '../utils/mppTicketPrinter';
import { LiveMarketTicker } from './LiveMarketTicker';
import { SmartLiveQueue } from './mpp/SmartLiveQueue';
import type { SelectedFloorItem } from './mpp/InteractiveFloorPlan';

const LazyInteractiveFloorPlan = lazyWithRetry(() =>
  import('./mpp/InteractiveFloorPlan').then(m => ({ default: m.InteractiveFloorPlan }))
);
import { SmartServiceFinder } from './mpp/SmartServiceFinder';
import { SmartDocumentTracker } from './mpp/SmartDocumentTracker';
import { SmartRequirementAssistant } from './mpp/SmartRequirementAssistant';
import { VipInvestorConcierge } from './mpp/VipInvestorConcierge';
import { InclusivityAccessibilityBar } from './mpp/InclusivityAccessibilityBar';
import { OperationalHeatmap } from './mpp/OperationalHeatmap';
import { SkmBentoGrid } from './mpp/SkmBentoGrid';
import { MppMaklumatSlaRadar } from './mpp/MppMaklumatSlaRadar';
import { MppCitizenSurveyMenu } from './mpp/MppCitizenSurveyMenu';
const MppVisitorAnalyticsModal = lazyWithRetry(() => import('./mpp/MppVisitorAnalyticsModal').then(m => ({ default: m.MppVisitorAnalyticsModal })));
const MppAgenciesCatalogModal = lazyWithRetry(() => import('./mpp/MppAgenciesCatalogModal').then(m => ({ default: m.MppAgenciesCatalogModal })));
const MppServicesMatrixModal = lazyWithRetry(() => import('./mpp/MppServicesMatrixModal').then(m => ({ default: m.MppServicesMatrixModal })));
import type { ServiceDetailItem } from './mpp/MppServiceDetailModal';
const MppServiceDetailModal = lazyWithRetry(() => import('./mpp/MppServiceDetailModal').then(m => ({ default: m.MppServiceDetailModal })));
import { MppServicesWorkflowCarousel } from './mpp/MppServicesWorkflowCarousel';
import { FlowchartLevelLayanan } from './mpp/FlowchartLevelLayanan';
import { AlurPelayananDiagram } from './mpp/AlurPelayananDiagram';
const MppNewsCatalogModal = lazyWithRetry(() => import('./mpp/MppNewsCatalogModal').then(m => ({ default: m.MppNewsCatalogModal })));
import { MppMagattiGallerySlideshow } from './mpp/MppMagattiGallerySlideshow';
import { AntiCorruptionBanner } from './mpp/AntiCorruptionBanner';
import { OnlineQueueOnboardingSection } from './mpp/OnlineQueueOnboardingSection';
import { MppBestPracticesAdoption } from './mpp/MppBestPracticesAdoption';
import { WaveSectionDivider } from './common/WaveSectionDivider';
import { InstansiTergabungSection } from './mpp/InstansiTergabungSection';
import { AgencyLogo } from './common/AgencyLogo';
import { ResponsiveOfficerPicture } from './common/ResponsiveOfficerPicture';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { AnimatedSectionHeader } from './common/AnimatedSectionHeader';
import { TiltCard } from './common/TiltCard';
import { SpotlightCard } from './common/SpotlightCard';
import { SuperHeroSearch } from './mpp/SuperHeroSearch';
const GRPArchitectureModal = lazyWithRetry(() => import('./mpp/GRPArchitectureModal').then(m => ({ default: m.GRPArchitectureModal })));
import { BentoLiveQueueRadar } from './mpp/BentoLiveQueueRadar';
import { InteractiveRequirementStepper } from './mpp/InteractiveRequirementStepper';
import { CekPersyaratanLayananPilot } from './mpp/CekPersyaratanLayananPilot';
import { GlobalHelpdeskFab } from './mpp/GlobalHelpdeskFab';
import { FaqAccordion } from './mpp/FaqAccordion';
import { MagneticButton } from './common/MagneticButton';
import { SonarRadarPulse } from './common/SonarRadarPulse';
import { Badge, type BadgeTone } from './common/Badge';
import { MPP_TYPOGRAPHY, MPP_CARD_SURFACE } from './common/MppCard';
import { MppNewsItem, getStoredMppNews, syncMppNewsWithServer } from '../data/mppNewsData';
import { 
  MppSocialMediaSettings, 
  getStoredMppSocialMedia, 
  DEFAULT_MPP_SOCIAL_MEDIA, 
  SOCIAL_MEDIA_UPDATE_EVENT, 
  SOCIAL_MEDIA_STORAGE_KEY 
} from '../data/mppSocialMediaData';
const TenantDashboard = lazyWithRetry(() => import('./mpp/TenantDashboard'));
const PetugasGeraiLoginModal = lazyWithRetry(() => import('./mpp/PetugasGeraiLoginModal').then(m => ({ default: m.PetugasGeraiLoginModal })));
const FoOfficerLoginModal = lazyWithRetry(() => import('./mpp/FoOfficerLoginModal').then(m => ({ default: m.FoOfficerLoginModal })));
const MppAirportKioskModal = lazyWithRetry(() => import('./MppAirportKioskModal').then(m => ({ default: m.MppAirportKioskModal })));
const MppCommandPalette = lazyWithRetry(() => import('./mpp/MppCommandPalette').then(m => ({ default: m.MppCommandPalette })));
import type { PkkprRecommendationData } from './mpp/PkkprTechnicalRecommendationModal';
const PkkprTechnicalRecommendationModal = lazyWithRetry(() => import('./mpp/PkkprTechnicalRecommendationModal').then(m => ({ default: m.PkkprTechnicalRecommendationModal })));
import { useGlobalFullscreenBackHandler } from '../hooks/useModalFullscreenLifecycle';
import { useDeviceAutomation } from '../hooks/useDeviceAutomation';
import { ensureFullscreen } from '../utils/fullscreen';
import { LUWU_LOGO_BASE64 } from '../lib/logoBase64';
import { supabase } from '../lib/supabaseClient';
import { submitMppSurvey } from '../services/mppFeedbackService';
import { 
  LOCALIZED_AGENCIES, 
  LOCALIZED_REVIEWS, 
  getLocalizedAgency, 
  getLocalizedReview, 
  getLocalizedStats 
} from '../data/mppAgenciesData';
import {
  mergeFacilitiesWithDb,
  syncOrSeedMppFacilitiesToSupabase,
  DEFAULT_OFFICIAL_MPP_FACILITIES
} from '../data/mppFacilitiesData';
import { getImageUrl, getAgencyLogoScaleClass } from '../utils/imageFallbacks';

const FALLBACK_IMAGE_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%230f172a'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2334d399' font-family='sans-serif' font-size='22' font-weight='bold'%3EMPP Simpurusiang Kab. Luwu%3C/text%3E%3C/svg%3E";

// --- Konfigurasi Fasilitas (Master-Detail View) ---
const FACILITIES_CONFIG = [
  {
    id: 'lounge',
    key: 'lounge',
    icon: Armchair,
    image: '/assets/images/default-facility.svg',
  },
  {
    id: 'laktasi',
    key: 'laktasi',
    icon: Baby,
    image: '/assets/images/default-facility.svg',
  },
  {
    id: 'kids-corner',
    key: 'kids',
    icon: Gamepad2,
    image: '/assets/images/default-facility.svg',
  },
  {
    id: 'galeri-umkm',
    key: 'galeri',
    icon: Store,
    image: '/assets/images/default-facility.svg',
  },
  {
    id: 'musholla',
    key: 'musholla',
    icon: Moon,
    image: '/assets/images/default-facility.svg',
  },
  {
    id: 'ekiosk',
    key: 'ekiosk',
    icon: Laptop,
    image: '/assets/images/default-facility.svg',
  },
  {
    id: 'pojok-baca',
    key: 'baca',
    icon: BookOpen,
    image: '/assets/images/default-facility.svg',
  },
  {
    id: 'disabilitas',
    key: 'disabilitas',
    icon: Accessibility,
    image: '/assets/images/default-facility.svg',
  },
  {
    id: 'pengaduan',
    key: 'pengaduan',
    icon: HeartHandshake,
    image: '/assets/images/default-facility.svg',
  }
];

export interface InstansiItem {
  nama: string;
  namaSingkat?: string;
  namaResmi?: string;
  nama_en?: string;
  nama_zh?: string;
  fullName: string;
  fullName_en?: string;
  fullName_zh?: string;
  kategori: string;
  kategori_en?: string;
  kategori_zh?: string;
  layanan: string;
  layanan_en?: string;
  layanan_zh?: string;
  logo: string;
  loket: string;
  loket_en?: string;
  loket_zh?: string;
  jamLayanan: string;
  jamLayanan_en?: string;
  jamLayanan_zh?: string;
  deskripsi: string;
  deskripsi_en?: string;
  deskripsi_zh?: string;
  layananList: string[];
  layananList_en?: string[];
  layananList_zh?: string[];
  syaratUmum: string[];
  syaratUmum_en?: string[];
  syaratUmum_zh?: string[];
  servicesData?: Array<{
    id: string;
    name: string;
    requirements?: string | null;
    estimated_time_minutes?: number;
    photo_url?: string | null;
  }>;
}

// --- Data Instansi Tergabung (19 Instansi Resmi MPP Simpurusiang - Multi-Bahasa) ---
export const dummyDataInstansi: InstansiItem[] = LOCALIZED_AGENCIES;
export const instansiTergabung = dummyDataInstansi;

// --- Data Ulasan Masyarakat (Single Source of Truth: Supabase mpp_skm & investor_testimonials) ---
export const dummyDataUlasan: any[] = [];
export const dataUlasan: any[] = [];

// --- Data Berita & Pengumuman (Kosong jika belum ada data dari DB) ---
export const dummyDataBerita: any[] = [];

// --- Counter Component (Shared easeOutExpo Hook matching InvestLuwu Hub) ---
const StatCounter = ({ target, isDecimal, duration = 1200 }: { target: number; isDecimal?: boolean; duration?: number }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const { value } = useCountUp({
    end: target,
    duration,
    decimals: isDecimal ? 2 : 0,
    enabled: inView,
  });

  return (
    <span ref={ref}>
      {isDecimal ? value.toFixed(2) : Math.round(value).toLocaleString("id-ID")}
    </span>
  );
};

// --- Varian Animasi Global (Fast & GPU-Accelerated) ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 35, scale: 0.96, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 85, damping: 18, mass: 0.9 }
  }
};

const INITIAL_UMKM_PRODUCTS: any[] = [
  {
    id: "umkm-1",
    nama_produk: "Kopi Arabika Specialty Latimojong",
    nama_produk_en: "Latimojong Specialty Arabica Coffee",
    nama_produk_zh: "Latimojong 精品阿拉比卡咖啡",
    nama_pemilik: "ASHAR (Kelompok Tani Kopi Latimojong)",
    kategori: "Kuliner",
    harga: "Rp 45.000 / 250gr",
    no_wa: "6282194883391",
    status_izin: "Terdaftar NIB",
    sertifikasi: "Halal & P-IRT Verified",
    alamat: "Kecamatan Latimojong, Kab. Luwu (Elevasi 1.400 mdpl)",
    alamat_en: "Latimojong District, Luwu Regency (1,400m elevation)",
    alamat_zh: "Latimojong 镇，Luwu 县（海拔 1,400 米）",
    bahan: "100% Biji Kopi Arabika Organik Choice Red Cherry",
    bahan_en: "100% Organic Specialty Arabica Coffee Beans (Choice Red Cherry)",
    bahan_zh: "100% 有机阿拉比卡咖啡豆 (精选红樱桃)",
    image: "/assets/images/default-facility.svg",
    deskripsi: "Kopi Arabika Single Origin Pegunungan Latimojong yang dipanen pada ketinggian 1.400 mdpl dengan cupping score specialty grade (>84) beraroma floral & fruity khas Luwu."
  },
  {
    id: "umkm-2",
    nama_produk: "Cokelat Gourmet Premium Kakao Luwu",
    nama_produk_en: "Luwu Premium Gourmet Cocoa Chocolate",
    nama_produk_zh: "Luwu 高级美食可可巧克力",
    nama_pemilik: "Rosdiana (Koperasi Kakao Bajo Luwu)",
    kategori: "Kuliner",
    harga: "Rp 35.000 / Bar (80gr)",
    no_wa: "6282194883391",
    status_izin: "Terdaftar NIB",
    sertifikasi: "Sertifikat Halal Kemenag",
    alamat: "Kecamatan Bajo, Kab. Luwu",
    alamat_en: "Bajo District, Luwu Regency",
    alamat_zh: "Bajo 镇，Luwu 县",
    bahan: "70% Dark Chocolate Biji Kakao Terfermentasi Murni & Gula Aren Organik",
    bahan_en: "70% Dark Chocolate Pure Fermented Cocoa Beans & Organic Palm Sugar",
    bahan_zh: "70% 黑巧克力纯发酵可可豆和有机棕榈糖",
    image: "/assets/images/default-facility.svg",
    deskripsi: "Olahan cokelat premium bean-to-bar berbahan dasar biji kakao unggulan terfermentasi hasil binaan Dinas Pertanian & Perkebunan Kab. Luwu."
  },
  {
    id: "umkm-3",
    nama_produk: "Kain Tenun Ikat Traditional Luwu",
    nama_produk_en: "Luwu Traditional Handwoven Ikat Cloth",
    nama_produk_zh: "Luwu 传统手工织布",
    nama_pemilik: "Sanggar Binaan Dekranasda Kabupaten Luwu",
    kategori: "Kriya/Kerajinan",
    harga: "Rp 450.000 / Lembar",
    no_wa: "6282194883391",
    status_izin: "Terdaftar NIB",
    sertifikasi: "Hak Cipta Motif Tradisional",
    alamat: "Gedung Dekranasda Belopa, Kab. Luwu",
    alamat_en: "Dekranasda Building Belopa, Luwu Regency",
    alamat_zh: "Belopa Dekranasda 大楼，Luwu 县",
    bahan: "Benang Sutra Asli dengan Pewarna Alam Akar Mengkudu & Kayu Sepang",
    bahan_en: "Natural Silk Yarn with Organic Plant Dyes",
    bahan_zh: "天然丝线与有机植物染料",
    image: "/assets/images/default-facility.svg",
    deskripsi: "Kain tenun buatan tangan pengerajin lokal bermotif khas Kerajaan Luwu yang anggun, cocok untuk cinderamata eksekutif dan busana kemitraan resmi."
  }
];

// --- Main Component ---
export default function PortalMPP() {
  const { isAndroid } = useDeviceAutomation();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isZh = i18n.language?.startsWith("zh");
  const isEn = i18n.language?.startsWith("en");

  const [isDark, setIsDark] = useState(() => typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Dynamic SEO & Title Management for /mpp
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prevTitle = document.title;
    document.title = "Portal MPP Simpurusiang - Mal Pelayanan Publik Kabupaten Luwu";
    
    const metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc ? metaDesc.getAttribute('content') : null;
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Portal Pelayanan Publik Terpadu Satu Pintu Kabupaten Luwu. Akses 20 instansi terpadu, antrean online, konsultasi perizinan, dan dokumen kependudukan di Belopa.');
    }

    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDesc) {
        metaDesc.setAttribute('content', prevDesc);
      }
    };
  }, []);

  const [selectedUMKM, setSelectedUMKM] = useState<any>(null);
  const [activeUmkmFilter, setActiveUmkmFilter] = useState<string>("Semua");
  const [umkmProducts, setUmkmProducts] = useState<any[]>(INITIAL_UMKM_PRODUCTS);
  const [currentUmkmIndex, setCurrentUmkmIndex] = useState(0);
  const [isUmkmAutoPlay, setIsUmkmAutoPlay] = useState(true);
  const [isUmkmHovered, setIsUmkmHovered] = useState(false);

  // Two-way interactive floor plan & smart finder synchronization
  const [selectedFloorItem, setSelectedFloorItem] = useState<SelectedFloorItem | null>(null);
  const [forceLoadFloorPlan, setForceLoadFloorPlan] = useState<boolean>(false);
  const floorPlanSectionRef = useRef<HTMLDivElement>(null);
  const isFloorPlanInView = useInView(floorPlanSectionRef, { once: true, margin: '600px 0px 600px 0px' });

  // Mode Tampilan Ringan (Hemat Kuota, RAM & GPU) - Fungsional Riil via CSS body.mpp-lite-mode
  const [isLiteMode, setIsLiteMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('mpp_lite_mode');
    if (saved !== null) return saved === 'true';
    const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
    return Boolean(conn?.saveData);
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('mpp-lite-mode', isLiteMode);
    try {
      localStorage.setItem('mpp_lite_mode', String(isLiteMode));
    } catch {
      // ignore storage quota errors
    }
    return () => {
      document.body.classList.remove('mpp-lite-mode');
    };
  }, [isLiteMode]);

  const toggleLiteMode = useCallback(() => {
    setIsLiteMode((prev) => !prev);
  }, []);

  // State Progressive Disclosure Hubs untuk menyederhanakan hierarki vertikal halaman utama
  const [guideHubTab, setGuideHubTab] = useState<'denah' | 'alur' | 'fasilitas' | 'faq'>('denah');
  const [transparencyHubTab, setTransparencyHubTab] = useState<'skm' | 'statistik' | 'berita' | 'kemitraan'>('skm');
  const [showSocialMediaFeed, setShowSocialMediaFeed] = useState<boolean>(false);

  // Router navigasi pintar lintas seksi & tab Progressive Disclosure
  const navigateToMppSection = useCallback((rawId: string) => {
    const cleanId = rawId.replace(/^#/, '').trim();
    if (!cleanId || cleanId === 'hero' || cleanId === 'beranda') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    let requiresDelayedScroll = false;
    let fallbackHubId: string | null = null;

    if (cleanId === 'denah-interaktif') {
      setGuideHubTab('denah');
      setForceLoadFloorPlan(true);
      requiresDelayedScroll = true;
      fallbackHubId = 'panduan-gedung-hub';
    } else if (['alur-pelayanan', 'operasional-heatmap', 'peta-jam-ramai', 'maklumat-pelayanan-sla'].includes(cleanId)) {
      setGuideHubTab('alur');
      requiresDelayedScroll = true;
      fallbackHubId = 'panduan-gedung-hub';
    } else if (['fasilitas', 'motto-pelayanan'].includes(cleanId)) {
      setGuideHubTab('fasilitas');
      requiresDelayedScroll = true;
      fallbackHubId = 'panduan-gedung-hub';
    } else if (cleanId === 'faq') {
      setGuideHubTab('faq');
      requiresDelayedScroll = true;
      fallbackHubId = 'panduan-gedung-hub';
    } else if (['survey', 'ulasan-masyarakat'].includes(cleanId)) {
      setTransparencyHubTab('skm');
      requiresDelayedScroll = true;
      fallbackHubId = 'transparansi-publik-hub';
    } else if (cleanId === 'statistik') {
      setTransparencyHubTab('statistik');
      requiresDelayedScroll = true;
      fallbackHubId = 'transparansi-publik-hub';
    } else if (cleanId === 'publikasi-berita') {
      setTransparencyHubTab('berita');
      requiresDelayedScroll = true;
      fallbackHubId = 'transparansi-publik-hub';
    } else if (['umkm', 'investor-vip'].includes(cleanId)) {
      setTransparencyHubTab('kemitraan');
      requiresDelayedScroll = true;
      fallbackHubId = 'transparansi-publik-hub';
    } else if (cleanId === 'sosial-media') {
      setShowSocialMediaFeed(true);
      requiresDelayedScroll = true;
    }

    const scrollTarget = () => {
      const targetEl = document.getElementById(cleanId) || (fallbackHubId ? document.getElementById(fallbackHubId) : null);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    if (requiresDelayedScroll) {
      window.setTimeout(scrollTarget, 95);
    } else {
      scrollTarget();
    }
  }, []);

  // Animations & Viewport Scroll-Trigger Refs (Reduced-Motion compliant)
  const shouldReduceMotion = useReducedMotion();
  const umkmSectionRef = useRef<HTMLDivElement>(null);
  const isUmkmInView = useInView(umkmSectionRef, { once: true, amount: 0.15 });
  const chartSectionRef = useRef<HTMLDivElement>(null);
  const isChartInView = useInView(chartSectionRef, { once: true, amount: 0.2 });

  const handleSelectServiceFromTop = useCallback((tenantCodeOrId: string) => {
    setGuideHubTab('denah');
    setForceLoadFloorPlan(true);
    setSelectedFloorItem({
      id: tenantCodeOrId,
      code: tenantCodeOrId,
      name: tenantCodeOrId,
      type: 'tenant',
      status: 'open',
      services: [],
      activeRequests: []
    });

    window.setTimeout(() => {
      if (floorPlanSectionRef.current) {
        floorPlanSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        document.getElementById('denah-interaktif')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 95);
  }, []);

  const filteredUmkmProducts = useMemo(() => {
    return umkmProducts.filter((p) => activeUmkmFilter === "Semua" || p.kategori === activeUmkmFilter);
  }, [umkmProducts, activeUmkmFilter]);

  // Reset index slider saat filter kategori berubah
  useEffect(() => {
    setCurrentUmkmIndex(0);
  }, [activeUmkmFilter]);

  // Timer rotasi otomatis slider UMKM (durasi 4.5 detik)
  useEffect(() => {
    if (!isUmkmAutoPlay || isUmkmHovered || filteredUmkmProducts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentUmkmIndex((prev) => (prev + 1) % filteredUmkmProducts.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isUmkmAutoPlay, isUmkmHovered, filteredUmkmProducts.length]);

  const handlePrevUmkm = useCallback(() => {
    setCurrentUmkmIndex((prev) => (prev === 0 ? Math.max(0, filteredUmkmProducts.length - 1) : prev - 1));
  }, [filteredUmkmProducts.length]);

  const handleNextUmkm = useCallback(() => {
    setCurrentUmkmIndex((prev) => (prev + 1) % filteredUmkmProducts.length);
  }, [filteredUmkmProducts.length]);

  // --- Database Sync State: Fasilitas, UMKM, Alur, Kontak & Profil dari Supabase & API ---
  const [dbFacilities, setDbFacilities] = useState<any[]>([]);
  const [dbQuotaRestricted, setDbQuotaRestricted] = useState<boolean>(false);
  const [mppFlowSteps, setMppFlowSteps] = useState<any[]>([]);
  const [liveContacts, setLiveContacts] = useState({
    phone: "+62 811-4200-999",
    email: "dpmptspkabluwu@gmail.com",
    address: "Jl. Simpurusiang No. 45, Belopa, Kab. Luwu",
    hours: "Senin - Kamis: 07:30 - 16:00 WITA | Jumat: 07:30 - 16:30 WITA",
    maps_embed_url: "https://maps.google.com/maps?q=DPMPTSP%20Kabupaten%20Luwu%20Belopa&t=&z=16&ie=UTF8&iwloc=&output=embed"
  });

  const officialWaHref = useMemo(() => {
    const rawDigits = (liveContacts.phone || '').replace(/[^0-9]/g, '');
    const waNumber = !rawDigits
      ? '628114200999'
      : rawDigits.startsWith('0')
      ? `62${rawDigits.slice(1)}`
      : rawDigits.startsWith('62')
      ? rawDigits
      : `62${rawDigits}`;
    const defaultText = encodeURIComponent(
      'Halo Petugas Front Office MPP Simpurusiang Kab. Luwu, saya membutuhkan bantuan informasi layanan perizinan/non-perizinan.'
    );
    return `https://wa.me/${waNumber}?text=${defaultText}`;
  }, [liveContacts.phone]);

  // Status jam layanan riil berdasarkan zona waktu WITA (Asia/Makassar, UTC+8)
  const witaOperationalSummary = useMemo(() => {
    try {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Makassar',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(new Date());
      const weekday = parts.find((p) => p.type === 'weekday')?.value || 'Mon';
      const hour = Number(parts.find((p) => p.type === 'hour')?.value || '8');
      const minute = Number(parts.find((p) => p.type === 'minute')?.value || '0');
      const totalMins = hour * 60 + minute;
      const isMonThu = ['Mon', 'Tue', 'Wed', 'Thu'].includes(weekday);
      const isFri = weekday === 'Fri';
      const isOpen =
        (isMonThu && totalMins >= 450 && totalMins <= 960) ||
        (isFri && totalMins >= 450 && totalMins <= 990);
      return {
        isOpen,
        scheduleText: isOpen
          ? isFri
            ? 'Loket Buka Hari Ini · 07.30–16.30 WITA'
            : 'Loket Buka Hari Ini · 07.30–16.00 WITA'
          : 'Portal Digital 24 Jam · Loket Senin–Jumat 07.30 WITA',
      };
    } catch {
      return {
        isOpen: true,
        scheduleText: 'Senin–Kamis 07.30–16.00 WITA · Jumat 07.30–16.30 WITA',
      };
    }
  }, []);

  const [portalProfile, setPortalProfile] = useState<any>(null);
  const [portalFloorPlan, setPortalFloorPlan] = useState<{ title?: string; photo?: string; desc?: string } | null>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem("mpp_portal_floorplan") : null;
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);

  // --- State News & Pengumuman Portal MPP ---
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [portalNews, setPortalNews] = useState<MppNewsItem[]>(() => getStoredMppNews());

  // --- State Sosial Media Resmi MPP ---
  const [socialMediaData, setSocialMediaData] = useState<MppSocialMediaSettings>(() => getStoredMppSocialMedia());

  useEffect(() => {
    const handleSocialMediaUpdate = () => {
      setSocialMediaData(getStoredMppSocialMedia());
    };
    handleSocialMediaUpdate();

    const handleSocialStorage = (e: StorageEvent) => {
      if (e.key === SOCIAL_MEDIA_STORAGE_KEY) {
        handleSocialMediaUpdate();
      }
    };

    window.addEventListener(SOCIAL_MEDIA_UPDATE_EVENT, handleSocialMediaUpdate);
    window.addEventListener('storage', handleSocialStorage);
    return () => {
      window.removeEventListener(SOCIAL_MEDIA_UPDATE_EVENT, handleSocialMediaUpdate);
      window.removeEventListener('storage', handleSocialStorage);
    };
  }, []);

  useEffect(() => {
    const handleNewsUpdate = () => {
      setPortalNews(getStoredMppNews());
    };
    handleNewsUpdate();

    // Sync with server asynchronously so that newly created news in admin displays on all devices (including mobile Android)
    syncMppNewsWithServer().then(res => {
      if (res && res.length > 0) {
        setPortalNews(res);
      }
    });

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mpp_news_data_v1' || e.key === 'mpp_portal_news') {
        handleNewsUpdate();
      }
    };

    window.addEventListener('mpp_news_updated', handleNewsUpdate);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('mpp_news_updated', handleNewsUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleShareUMKM = async (umkm: any) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Produk Unggulan Luwu: ${umkm.nama_produk}`,
          text: `Cek produk UMKM premium dari Kab. Luwu: ${umkm.nama_produk} seharga ${umkm.harga}.`,
          url: window.location.href,
        });
      } catch (error) {}
    } else {
      navigator.clipboard.writeText(`Cek produk UMKM Luwu: ${umkm.nama_produk} - Hubungi: ${umkm.no_wa}`).catch(() => {});
    }
  };

  // Pastikan halaman Portal MPP selalu tampil dari posisi paling atas (Beranda / Hero)
  useEffect(() => {
    // 1. Nonaktifkan scroll restoration otomatis milik browser agar posisi scroll halaman sebelumnya tidak diterapkan
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const resetToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;

      const topTarget = document.getElementById('portal-top') || document.getElementById('hero') || document.getElementById('beranda');
      if (topTarget) {
        topTarget.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    };

    // Eksekusi segera
    resetToTop();

    // Eksekusi berulang dengan interval mikro untuk mengantisipasi layout shift & reflow render komponen
    const rafId = requestAnimationFrame(resetToTop);
    const t1 = setTimeout(resetToTop, 20);
    const t2 = setTimeout(resetToTop, 80);
    const t3 = setTimeout(resetToTop, 200);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiModalQuery, setAiModalQuery] = useState<string | undefined>(undefined);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showAccessibilityCoachMark, setShowAccessibilityCoachMark] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem('mpp_accessibility_coachmark_seen');
      if (!seen) {
        setShowAccessibilityCoachMark(true);
      }
    }
  }, []);

  const dismissAccessibilityCoachMark = useCallback(() => {
    setShowAccessibilityCoachMark(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mpp_accessibility_coachmark_seen', 'true');
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const [mottoImgError, setMottoImgError] = useState(false);
  const [antreanImgError, setAntreanImgError] = useState(false);
  const [staffImageLeft, setStaffImageLeft] = useState<string | null>(null);
  const [staffImageRight, setStaffImageRight] = useState<string | null>(null);
  const [activeFacilityId, setActiveFacilityId] = useState<string>('lounge');
  const [activeStatTab, setActiveStatTab] = useState<'harian' | 'mingguan' | 'bulanan'>('harian');

  useEffect(() => {
    async function fetchStaffSettings() {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("setting_value, setting_key")
          .in("setting_key", ["staff_image_left", "staff_image_right"]);
        if (error) return;
        if (data && data.length > 0) {
          const left = data.find((d: any) => d.setting_key === "staff_image_left");
          const right = data.find((d: any) => d.setting_key === "staff_image_right");
          if (left?.setting_value) setStaffImageLeft(left.setting_value);
          if (right?.setting_value) setStaffImageRight(right.setting_value);
        }
      } catch (err) {
        console.error("Error fetching staff settings:", err);
      }
    }
    fetchStaffSettings();

    const handleStaffUpdate = () => {
      fetchStaffSettings();
    };

    window.addEventListener('staff_settings_updated', handleStaffUpdate);
    return () => {
      window.removeEventListener('staff_settings_updated', handleStaffUpdate);
    };
  }, []);

  // --- State Fase 1 (Fitur 2 & Fitur 3) ---
  const [showQuickNav, setShowQuickNav] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string>('layanan');
  const [isTicketBarDismissed, setIsTicketBarDismissed] = useState(false);
  const [isBottomTicketDismissed, setIsBottomTicketDismissed] = useState(false);
  const [activePersona, setActivePersona] = useState<'warga' | 'investor' | 'semua'>(() => {
    const saved = sessionStorage.getItem("portal_persona");
    return (saved === "warga" || saved === "investor" || saved === "semua") ? (saved as 'warga' | 'investor' | 'semua') : "warga";
  });

  useEffect(() => {
    sessionStorage.setItem("portal_persona", activePersona);
    if (activePersona === 'investor') {
      setTransparencyHubTab('kemitraan');
    }
  }, [activePersona]);

  // State & Listener Universal Command Palette (Ctrl + K / Cmd + K)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandPaletteInitialQuery, setCommandPaletteInitialQuery] = useState('');

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Pastikan tidak terpukul saat mengetik dalam input form/textarea kecuali kombinasi khusus
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const [activeTicket, setActiveTicket] = useState<{
    number: string;
    counter: string;
    estimation: string;
    status: string;
    agency?: string;
    service?: string;
    date?: string;
    session?: string;
    name?: string;
    nik?: string;
    phone?: string;
  } | null>(null);

  // --- State Fase 2 (Fitur 4 & Fitur 5) ---
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
  const [isFacilityLightboxOpen, setIsFacilityLightboxOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isAgenciesCatalogOpen, setIsAgenciesCatalogOpen] = useState(false);
  const [isServicesMatrixOpen, setIsServicesMatrixOpen] = useState(false);
  const [servicesMatrixInitialCategory, setServicesMatrixInitialCategory] = useState<string>('all');
  const [servicesMatrixInitialSearch, setServicesMatrixInitialSearch] = useState<string>('');
  const [activeRequirementService, setActiveRequirementService] = useState<string>('KTP_DUKCAPIL');

  // --- State Fase 3 (Fitur 6: Modal Survey SKM & Fitur 7: Modal Alur Pelayanan) ---
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [surveyForm, setSurveyForm] = useState({
    instansi: 'DPMPTSP',
    q1: 0,
    q2: 0,
    q3: 0,
    q4: 0,
    q5: 0,
    q6: 0,
    q7: 0,
    q8: 0,
    q9: 0,
    feedback: ''
  });
  const [isSurveySubmitted, setIsSurveySubmitted] = useState(false);
  const [activeAlurModal, setActiveAlurModal] = useState<'pbg' | 'mpp' | 'pkkpr' | null>(null);
  const [isPkkprModalOpen, setIsPkkprModalOpen] = useState(false);
  const [pkkprInitialData, setPkkprInitialData] = useState<Partial<PkkprRecommendationData> | undefined>(undefined);

  // --- State Fase 4 (Fitur 8: Interactive Virtual Helpdesk & Fitur 9: Interactive FAQ Accordion) ---
  const [isHelpdeskModalOpen, setIsHelpdeskModalOpen] = useState(false);
  const [helpdeskForm, setHelpdeskForm] = useState({
    nama: '',
    telepon: '',
    kategori: 'Perizinan DPMPTSP',
    pesan: ''
  });
  const [isHelpdeskSubmitted, setIsHelpdeskSubmitted] = useState(false);

  // --- State Fase 5 (Fitur 10: Modal Detail Instansi, Fitur 11: Modal Booking Antrean Online & Fitur 12: Tracking Dokumen) ---
  const [selectedAgencyDetail, setSelectedAgencyDetail] = useState<InstansiItem | null>(null);
  const [selectedServiceDetail, setSelectedServiceDetail] = useState<ServiceDetailItem | null>(null);
  const [isQueueBookingOpen, setIsQueueBookingOpen] = useState(false);
  const [queueForm, setQueueForm] = useState({
    nama: '',
    nik: '',
    phone: '',
    password: '',
    gender: 'Laki-laki' as 'Laki-laki' | 'Perempuan',
    occupation: 'Wiraswasta / Pelaku Usaha' as string,
    agency: 'DPMPTSP',
    service: 'Penerbitan Nomor Induk Berusaha (NIB) Berbasis Risiko',
    date: new Date().toISOString().split('T')[0],
    session: 'pagi' as 'pagi' | 'siang'
  });
  const [showQueuePassword, setShowQueuePassword] = useState(false);
  const [queueFormErrors, setQueueFormErrors] = useState<{
    nama?: string;
    nik?: string;
    phone?: string;
    date?: string;
  }>({});
  const [queueFormTouched, setQueueFormTouched] = useState<{
    nama?: boolean;
    nik?: boolean;
    phone?: boolean;
    date?: boolean;
  }>({});
  const [isLookingUpNik, setIsLookingUpNik] = useState(false);
  const [nikLookupNotice, setNikLookupNotice] = useState<string | null>(null);
  const [isCitizenRegistered, setIsCitizenRegistered] = useState(false);

  // Helper validasi format NIK & Nomor HP
  const isNikFormatValid = (val: string) => /^\d{16}$/.test(val);
  const isPhoneFormatValid = (val: string) => {
    const clean = val.replace(/[^\d+]/g, '');
    const norm = clean.startsWith('+62') ? '0' + clean.slice(3) : clean.startsWith('62') ? '0' + clean.slice(2) : clean;
    return /^08[1-9][0-9]{7,11}$/.test(norm);
  };
  const isNameFormatValid = (val: string) => val.trim().length >= 3;

  const isWeekendSelected = useMemo(() => {
    if (!queueForm.date) return false;
    const d = new Date(queueForm.date + 'T00:00:00');
    const day = d.getDay();
    return day === 0 || day === 6;
  }, [queueForm.date]);

  const [isQueueSubmitted, setIsQueueSubmitted] = useState(false);
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingErrorMessage, setBookingErrorMessage] = useState<string | null>(null);
  const [generatedTicket, setGeneratedTicket] = useState<{
    number: string;
    counter: string;
    estimation: string;
    status: string;
    agency?: string;
    service?: string;
    date?: string;
    session?: string;
    name?: string;
    nik?: string;
  } | null>(null);
  const [isTicketCopied, setIsTicketCopied] = useState(false);
  const [isTenantDashboardOpen, setIsTenantDashboardOpen] = useState(false);
  const [isOperatorLoginOpen, setIsOperatorLoginOpen] = useState(false);
  const [isFoLoginModalOpen, setIsFoLoginModalOpen] = useState(false);

  const handleFoAccess = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const foSessionStr = localStorage.getItem('mpp_fo_officer_session');
    if (foSessionStr) {
      try {
        const parsed = JSON.parse(foSessionStr);
        if (parsed && parsed.officerName) {
          navigate('/fo/dashboard');
          return;
        }
      } catch (err) {}
    }
    setIsFoLoginModalOpen(true);
  };
  const [isCallingAlertOpen, setIsCallingAlertOpen] = useState(false);
  const [isAirportKioskOpen, setIsAirportKioskOpen] = useState(false);
  const [airportKioskInitialMode, setAirportKioskInitialMode] = useState<'citizen' | 'investor'>('citizen');
  const [liveAgencies, setLiveAgencies] = useState<InstansiItem[]>(LOCALIZED_AGENCIES);
  const [isGrpModalOpen, setIsGrpModalOpen] = useState(false);

  const expressAgencyShortcuts = useMemo(() => {
    const preferredKeywords = ['dukcapil', 'dpmptsp', 'samsat', 'bapenda', 'bpjs', 'pajak', 'imigrasi', 'polres'];
    const sorted = [...liveAgencies].sort((a, b) => {
      const aName = `${a.nama} ${a.fullName}`.toLowerCase();
      const bName = `${b.nama} ${b.fullName}`.toLowerCase();
      const aIdx = preferredKeywords.findIndex((kw) => aName.includes(kw));
      const bIdx = preferredKeywords.findIndex((kw) => bName.includes(kw));
      const aRank = aIdx === -1 ? 999 : aIdx;
      const bRank = bIdx === -1 ? 999 : bIdx;
      return aRank - bRank;
    });
    return sorted.slice(0, 4).map((ag) => ({
      agencyName: ag.namaSingkat || ag.nama,
      serviceName: ag.servicesData?.[0]?.name || ag.layananList?.[0] || ag.layanan || `Layanan ${ag.nama}`,
      loketLabel: ag.loket || 'Gerai Terpadu MPP',
    }));
  }, [liveAgencies]);

  // --- Android Hardware Back Button & Persistent Fullscreen Lifecycle Handler ---
  const isAnyModalOpen = Boolean(
    isNewsModalOpen ||
    isSurveyModalOpen ||
    activeAlurModal !== null ||
    isPkkprModalOpen ||
    isHelpdeskModalOpen ||
    selectedAgencyDetail !== null ||
    selectedServiceDetail !== null ||
    isQueueBookingOpen ||
    isCallingAlertOpen ||
    isAiModalOpen ||
    isAirportKioskOpen ||
    isOperatorLoginOpen ||
    isFoLoginModalOpen ||
    isTenantDashboardOpen ||
    isAnalyticsModalOpen ||
    isAgenciesCatalogOpen ||
    isServicesMatrixOpen ||
    isCommandPaletteOpen ||
    isGrpModalOpen ||
    isFacilityLightboxOpen
  );

  const closeActiveModal = useCallback(() => {
    setIsNewsModalOpen(false);
    setIsSurveyModalOpen(false);
    setActiveAlurModal(null);
    setIsPkkprModalOpen(false);
    setIsHelpdeskModalOpen(false);
    setSelectedAgencyDetail(null);
    setSelectedServiceDetail(null);
    setIsQueueBookingOpen(false);
    setIsCallingAlertOpen(false);
    setIsAiModalOpen(false);
    setIsAirportKioskOpen(false);
    setIsOperatorLoginOpen(false);
    setIsFoLoginModalOpen(false);
    setIsTenantDashboardOpen(false);
    setIsAnalyticsModalOpen(false);
    setIsAgenciesCatalogOpen(false);
    setIsServicesMatrixOpen(false);
    setIsCommandPaletteOpen(false);
    setIsGrpModalOpen(false);
    setIsFacilityLightboxOpen(false);
    setTimeout(() => {
      ensureFullscreen();
    }, 150);
  }, []);

  useGlobalFullscreenBackHandler(isAnyModalOpen, closeActiveModal);

  // --- State Dinamis Supabase untuk SKM, Antrean & Ulasan (Doktrin Zero Dummy) ---
  const [skmTotalRespondents, setSkmTotalRespondents] = useState<number>(0);
  const [skmScoreAverage, setSkmScoreAverage] = useState<string>("0.00");
  const [skmScores, setSkmScores] = useState({
    persyaratan: 0,
    prosedur: 0,
    kecepatan: 0,
    biaya: 0,
    produk: 0,
    kompetensi: 0,
    perilaku: 0,
    sarana: 0,
    pengaduan: 0,
  });
  const [skmHighlights, setSkmHighlights] = useState({
    biaya: 0,
    perilaku: 0,
    produk: 0,
  });

  const [communityReviews, setCommunityReviews] = useState<any[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState<boolean>(true);

  const [queueMetrics, setQueueMetrics] = useState({
    totalVisitors: 0,
    dailyAvg: 0,
    weeklyAvg: 0,
    monthlyAvg: 0,
    yearlyTotal: 0,
    hourlyDistribution: [0, 0, 0, 0, 0],
    dailyDistribution: [0, 0, 0, 0, 0],
    monthlyDistribution: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  });

  // Sinkronisasi Data SKM & Ulasan Masyarakat dari Supabase
  const fetchSkmData = useCallback(async () => {
    try {
      const { data: skmList, error } = await supabase
        .from('mpp_skm')
        .select('*, tenant:mpp_tenants(name, code), citizen:mpp_citizens(full_name, occupation)')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(skmList)) {
        const count = skmList.length;
        setSkmTotalRespondents(count);

        if (count > 0) {
          const sumQ1 = skmList.reduce((acc, c) => acc + (Number(c.q1_persyaratan) || 0), 0);
          const sumQ2 = skmList.reduce((acc, c) => acc + (Number(c.q2_prosedur) || 0), 0);
          const sumQ3 = skmList.reduce((acc, c) => acc + (Number(c.q3_waktu) || 0), 0);
          const sumQ4 = skmList.reduce((acc, c) => acc + (Number(c.q4_biaya) || 0), 0);
          const sumQ5 = skmList.reduce((acc, c) => acc + (Number(c.q5_produk) || 0), 0);
          const sumQ6 = skmList.reduce((acc, c) => acc + (Number(c.q6_kompetensi) || 0), 0);
          const sumQ7 = skmList.reduce((acc, c) => acc + (Number(c.q7_perilaku) || 0), 0);
          const sumQ8 = skmList.reduce((acc, c) => acc + (Number(c.q8_sarpras) || 0), 0);
          const sumQ9 = skmList.reduce((acc, c) => acc + (Number(c.q9_pengaduan) || 0), 0);

          const calcScore = (sum: number) => Number(((sum / (count * 4)) * 100).toFixed(1));

          const scores = {
            persyaratan: calcScore(sumQ1),
            prosedur: calcScore(sumQ2),
            kecepatan: calcScore(sumQ3),
            biaya: calcScore(sumQ4),
            produk: calcScore(sumQ5),
            kompetensi: calcScore(sumQ6),
            perilaku: calcScore(sumQ7),
            sarana: calcScore(sumQ8),
            pengaduan: calcScore(sumQ9),
          };
          setSkmScores(scores);

          const avgTotal = (
            (scores.persyaratan + scores.prosedur + scores.kecepatan +
             scores.biaya + scores.produk + scores.kompetensi +
             scores.perilaku + scores.sarana + scores.pengaduan) / 9
          ).toFixed(2);
          setSkmScoreAverage(avgTotal);

          setSkmHighlights({
            biaya: scores.biaya,
            perilaku: scores.perilaku,
            produk: scores.produk,
          });
        } else {
          setSkmScoreAverage("0.00");
          setSkmScores({
            persyaratan: 0, prosedur: 0, kecepatan: 0, biaya: 0,
            produk: 0, kompetensi: 0, perilaku: 0, sarana: 0, pengaduan: 0
          });
          setSkmHighlights({ biaya: 0, perilaku: 0, produk: 0 });
        }

        // Reviews dari feedback SKM & investor_testimonials
        const feedbackReviews = skmList
          .filter(item => item.feedback && String(item.feedback).trim().length > 0)
          .map((item, idx) => ({
            id: item.id || `skm-${idx}`,
            nama: item.citizen?.full_name || (item.citizen_nik ? `Pemohon (${String(item.citizen_nik).slice(0, 4)}...${String(item.citizen_nik).slice(-4)})` : 'Masyarakat Pemohon'),
            layanan: item.tenant?.name ? (item.tenant.name.startsWith('Dinas') || item.tenant.name.startsWith('DPMPTSP') || item.tenant.name.startsWith('Badan') ? item.tenant.name : `Gerai ${item.tenant.name}`) : 'Pelayanan Terpadu MPP',
            rating: item.rating || 5,
            status: (item.rating || 5) >= 4 ? 'Sangat Puas' : 'Puas',
            teks: item.feedback,
            tanggal: item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Terbaru'
          }));

        // Coba juga ambil dari investor_testimonials jika ada
        const { data: testimonials } = await supabase
          .from('investor_testimonials')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        const mappedTestimonials = (testimonials || []).map((t: any) => ({
          id: t.id,
          nama: t.name || t.investor_name || 'Investor / Pemohon',
          layanan: t.company || t.sector || 'Layanan Penanaman Modal & Perizinan',
          rating: t.rating || 5,
          status: (t.rating || 5) >= 4 ? 'Sangat Puas' : 'Puas',
          teks: t.content || t.testimonial || '',
          tanggal: t.created_at ? new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Terbaru'
        }));

        const allReviews = [...feedbackReviews, ...mappedTestimonials];
        const uniqueReviews = allReviews.filter((item, index, self) =>
          index === self.findIndex((r) => 
            (r.teks || '').trim().toLowerCase() === (item.teks || '').trim().toLowerCase()
          )
        );
        setCommunityReviews(uniqueReviews);
        setIsReviewsLoading(false);
      }
    } catch (err) {
      console.warn('Error fetching SKM and reviews from Supabase:', err);
      setIsReviewsLoading(false);
    }
  }, []);

  // Sinkronisasi Metrik & Distribusi Antrean Pengunjung dari Supabase mpp_queues
  const fetchQueueStats = useCallback(async () => {
    try {
      const { data: queues, error } = await supabase
        .from('mpp_queues')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(queues)) {
        const total = queues.length;
        
        // Grouping by unique days for daily average
        const uniqueDays = new Set(queues.map(q => q.queue_date || (q.created_at ? q.created_at.split('T')[0] : ''))).size || 1;
        const dailyAvg = total > 0 ? Math.max(Math.round(total / Math.max(uniqueDays, 1)), 1) : 0;
        const weeklyAvg = total > 0 ? Math.max(Math.round(dailyAvg * 5), 1) : 0;
        const monthlyAvg = total > 0 ? Math.max(Math.round(dailyAvg * 22), 1) : 0;
        // Estimasi tahunan proporsional berbasis rata-rata bulanan atau total aktual
        const yearlyTotal = total > 0 ? Math.max(total, monthlyAvg * 12) : 0;

        // Distribusi Jam (08:00, 10:00, 12:00, 14:00, 15:30)
        const hourly = [0, 0, 0, 0, 0];
        // Distribusi Hari (Sen, Sel, Rab, Kam, Jum)
        const daily = [0, 0, 0, 0, 0];
        // Distribusi Bulan (Jan - Des)
        const monthly = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        queues.forEach(q => {
          const dateStr = q.queue_date || (q.created_at ? q.created_at.split('T')[0] : '');
          if (dateStr) {
            const d = new Date(dateStr + 'T00:00:00');
            const dayIdx = d.getDay(); // 0: Sun, 1: Mon, ... 5: Fri, 6: Sat
            if (dayIdx >= 1 && dayIdx <= 5) {
              daily[dayIdx - 1] += 1;
            }
            const mIdx = d.getMonth(); // 0: Jan
            if (mIdx >= 0 && mIdx < 12) {
              monthly[mIdx] += 1;
            }
          }

          // Hourly distribution dari session atau created_at
          if (q.session === 'pagi') {
            hourly[0] += 1;
            hourly[1] += 1;
          } else if (q.session === 'siang') {
            hourly[3] += 1;
            hourly[4] += 1;
          } else if (q.created_at) {
            const h = new Date(q.created_at).getHours();
            if (h < 10) hourly[0] += 1;
            else if (h < 12) hourly[1] += 1;
            else if (h < 13) hourly[2] += 1;
            else if (h < 15) hourly[3] += 1;
            else hourly[4] += 1;
          } else {
            hourly[0] += 1;
          }
        });

        setQueueMetrics({
          totalVisitors: total,
          dailyAvg,
          weeklyAvg,
          monthlyAvg,
          yearlyTotal,
          hourlyDistribution: hourly,
          dailyDistribution: daily,
          monthlyDistribution: monthly,
        });
      }
    } catch (err) {
      console.warn('Error fetching queue stats from Supabase:', err);
    }
  }, []);

  // Sinkronisasi Presisi Tiga Arah: Admin MPP <-> Supabase DB <-> Portal MPP Warga
  const fetchLiveAgencies = useCallback(async () => {
    try {
      const { data: tenants, error: tErr } = await supabase
        .from('mpp_tenants')
        .select('*')
        .order('name');

      const { data: services, error: sErr } = await supabase
        .from('mpp_services')
        .select('*')
        .order('service_name');

      if (!tErr && tenants && tenants.length > 0) {
        const mapped: InstansiItem[] = tenants
          .filter(t => t.is_active !== false)
          .map(t => {
            const cleanLogo = getImageUrl(t.logo, 'agency');
            const matchedStatic = LOCALIZED_AGENCIES.find(
              a => a.nama.toLowerCase() === t.name.toLowerCase() || 
                   (t.code && a.nama.toLowerCase().includes(t.code.toLowerCase())) ||
                   (a.fullName && a.fullName.toLowerCase().includes(t.name.toLowerCase()))
            );

            const customServices = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem("mpp_portal_custom_services") || "[]") : [];
            const tenantServicesFull = (services || [])
              .filter(s => s.tenant_id === t.id)
              .map(s => {
                const customMatch = customServices.find((cs: any) => cs.service_name === s.service_name);
                const rawPhoto = (s as any).photo_url || customMatch?.photo_url;
                return {
                  id: s.id,
                  name: s.service_name || s.name,
                  requirements: s.requirements,
                  estimated_time_minutes: s.estimated_time_minutes,
                  photo_url: rawPhoto ? getImageUrl(rawPhoto, 'facility') : null
                };
              });

            const tenantServices = tenantServicesFull.map(s => s.name);

            // Filter out generic boilerplate services duplicated during database seeding
            const isGenericBoilerplate = tenantServices.length > 0 && 
              tenantServices.every(s => ['konsultasi layanan', 'penerbitan dokumen', 'verifikasi berkas', 'pengaduan layanan', 'pelayanan umum'].includes(s.toLowerCase().trim()));

            const finalLayananList = (tenantServices.length > 0 && !isGenericBoilerplate)
              ? tenantServices 
              : (matchedStatic?.layananList || (tenantServices.length > 0 ? tenantServices : [t.name]));

            // Sanitize raw description from database (strip 'test', 'null', or empty)
            const rawDesc = (t.description || '').trim();
            const isJunkDesc = !rawDesc || rawDesc.toLowerCase() === 'test' || rawDesc.toLowerCase() === 'null' || rawDesc.length < 10;
            const validDesc = isJunkDesc ? (matchedStatic?.deskripsi || `Pusat pelayanan terpadu ${t.name} di Gedung MPP Simpurusiang Kab. Luwu`) : rawDesc;

            if (matchedStatic) {
              return {
                ...matchedStatic,
                nama: t.name,
                logo: cleanLogo || matchedStatic.logo || '/assets/images/default-agency.svg',
                loket: t.floor || matchedStatic.loket,
                deskripsi: validDesc,
                layananList: finalLayananList,
                servicesData: tenantServicesFull,
              };
            }

            return {
              nama: t.name,
              fullName: t.name,
              kategori: 'Pemerintah Daerah',
              layanan: finalLayananList[0] || 'Pelayanan Terpadu',
              logo: cleanLogo || '/assets/images/default-agency.svg',
              loket: t.floor || 'Loket Pelayanan MPP',
              jamLayanan: 'Senin - Kamis (07:30 - 16:00) | Jumat (07:30 - 16:30 WITA)',
              deskripsi: validDesc,
              layananList: finalLayananList,
              servicesData: tenantServicesFull,
              syaratUmum: ['KTP-el / Kartu Keluarga', 'Surat Permohonan / Berkas Terkait']
            };
          });

        setLiveAgencies(mapped);
      }
    } catch (err: any) {
      const msg = String(err?.message || '');
      const isQuotaError = msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('restricted') || msg.toLowerCase().includes('egress') || msg.toLowerCase().includes('violation');
      if (isQuotaError) {
        setDbQuotaRestricted(true);
      }
      console.warn('Note fetching live agencies from Supabase:', err);
    }
  }, []);

  const fetchLiveFacilities = useCallback(async () => {
    // 1. Instant local state from localStorage if available
    try {
      const saved = localStorage.getItem("mpp_portal_facilities");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDbFacilities(parsed.map((f: any) => ({
            id: f.id,
            name: f.name,
            floor: f.floor,
            description: f.desc || f.description,
            image_url: f.photo || f.image_url
          })));
        }
      }
    } catch (e) {}

    // 2. Fetch from /api/mpp/facilities (reliable server-side proxy bypassing RLS)
    try {
      const res = await fetch('/api/mpp/facilities');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setDbFacilities(json.data);
          return;
        }
      }
    } catch (e) {}

    // 3. Fallback to direct Supabase query
    try {
      const { data, error } = await supabase
        .from('mpp_facilities')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        const isRlsError = error.code === '42501' || error.message?.toLowerCase().includes('permission denied') || error.message?.toLowerCase().includes('row-level security');
        const isQuotaError = error.message?.toLowerCase().includes('quota') || error.message?.toLowerCase().includes('restricted') || error.message?.toLowerCase().includes('egress') || error.message?.toLowerCase().includes('violation');
        if (isQuotaError) {
          setDbQuotaRestricted(true);
        }
        console.warn('[PortalMPP] Note fetching live facilities from Supabase:', {
          code: error.code,
          message: error.message,
          hint: error.hint,
          details: error.details,
          isRlsBlocked: isRlsError,
        });
        return;
      }

      if (data && data.length > 0) {
        setDbFacilities(data);
      }
    } catch (err: any) {
      console.warn("[PortalMPP] Unexpected exception loading mpp_facilities:", err);
    }
  }, []);

  const fetchLiveUmkm = useCallback(async () => {
    // 1. Instant local state from localStorage for zero latency
    try {
      const saved = localStorage.getItem("mpp_portal_umkm");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUmkmProducts(parsed.map((u: any) => ({
            id: String(u.id),
            nama_produk: u.name || u.nama_produk,
            nama_pemilik: u.owner || u.owner_name || u.nama_pemilik || "Pelaku UMKM Luwu",
            kategori: u.category || u.kategori || "Kuliner",
            harga: u.harga || "Produk Kemitraan MPP",
            no_wa: (u.wa || u.whatsapp || u.no_wa || "628").replace(/\D/g, "").replace(/^0/, "62"),
            status_izin: "Terdaftar NIB",
            image: getImageUrl(u.photo || u.image_url || u.image, 'umkm'),
            deskripsi: u.deskripsi || `Kemitraan UMKM binaan MPP Simpurusiang oleh ${u.owner || u.owner_name || 'Pelaku Usaha'}.`
          })));
        }
      }
    } catch (e) {}

    // 2. Fresh query from Supabase mpp_umkm
    try {
      const { data, error } = await supabase
        .from('mpp_umkm')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const mapped = data.map((u: any) => ({
          id: String(u.id),
          nama_produk: u.name,
          nama_pemilik: u.owner_name || "Pelaku UMKM Luwu",
          kategori: u.category || "Kuliner",
          harga: "Produk Kemitraan MPP",
          no_wa: (u.whatsapp || "628").replace(/\D/g, "").replace(/^0/, "62"),
          status_izin: "Terdaftar NIB",
          image: getImageUrl(u.image_url, 'umkm'),
          deskripsi: `Kemitraan UMKM binaan MPP Simpurusiang oleh ${u.owner_name || 'Pelaku Usaha'}.`
        }));
        setUmkmProducts(mapped);
        localStorage.setItem("mpp_portal_umkm", JSON.stringify(mapped));
      }
    } catch (err) {
      console.warn("Notice loading mpp_umkm:", err);
    }
  }, []);

  const fetchLiveFlow = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('mpp_flow')
        .select('*')
        .order('step_number', { ascending: true });
      if (!error && data && data.length > 0) {
        setMppFlowSteps(data);
      }
    } catch (err) {
      console.warn("Notice loading mpp_flow:", err);
    }
  }, []);

  const fetchLiveContacts = useCallback(async () => {
    try {
      const { data } = await supabase.from('mpp_contacts').select('*');
      if (data && data.length > 0) {
        const wa = data.find((c: any) => c.channel_name?.toLowerCase().includes("whatsapp") || c.channel_name?.toLowerCase().includes("wa") || c.channel_name?.toLowerCase().includes("helpdesk"));
        const phone = data.find((c: any) => c.channel_name?.toLowerCase().includes("telepon") || c.channel_name?.toLowerCase().includes("phone"));
        const email = data.find((c: any) => c.channel_name?.toLowerCase().includes("email"));
        setLiveContacts(prev => ({
          ...prev,
          phone: wa?.value || phone?.value || prev.phone,
          email: email?.value || prev.email
        }));
      }
    } catch (err) {
      console.warn("Notice loading mpp_contacts:", err);
    }

    try {
      // Check local storage first for zero-latency load
      const localP = localStorage.getItem("mpp_portal_profile");
      if (localP) {
        try {
          const parsedLocal = JSON.parse(localP);
          if (parsedLocal) setPortalProfile(parsedLocal);
        } catch (e) {}
      }

      const localF = localStorage.getItem("mpp_portal_floorplan");
      if (localF) {
        try {
          const parsedLocalF = JSON.parse(localF);
          if (parsedLocalF) setPortalFloorPlan(parsedLocalF);
        } catch (e) {}
      }

      const res = await fetch('/api/site-settings?keys=mpp_portal_profile,mpp_portal_floorplan');
      if (res.ok) {
        const json = await res.json();
        let rawVal = null;
        let rawFloor = null;
        if (Array.isArray(json)) {
          const item = json.find((i: any) => i.setting_key === 'mpp_portal_profile');
          rawVal = item?.setting_value;
          const floorItem = json.find((i: any) => i.setting_key === 'mpp_portal_floorplan');
          rawFloor = floorItem?.setting_value;
        } else if (json && typeof json === 'object') {
          rawVal = json.mpp_portal_profile;
          rawFloor = json.mpp_portal_floorplan;
        }
        if (rawVal) {
          const prof = typeof rawVal === 'string' ? JSON.parse(rawVal) : rawVal;
          setPortalProfile(prof);
          localStorage.setItem("mpp_portal_profile", JSON.stringify(prof));
        }
        if (rawFloor) {
          const fPlan = typeof rawFloor === 'string' ? JSON.parse(rawFloor) : rawFloor;
          setPortalFloorPlan(fPlan);
          localStorage.setItem("mpp_portal_floorplan", JSON.stringify(fPlan));
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchLiveAgencies();
    fetchSkmData();
    fetchQueueStats();
    fetchLiveFacilities();
    fetchLiveUmkm();
    fetchLiveFlow();
    fetchLiveContacts();

    // Listen to real-time additions/modifications/deletions from Admin MPP & Public Submissions across all tables
    const syncChannel = supabase
      .channel('portal_mpp_full_live_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mpp_tenants' }, () => {
        fetchLiveAgencies();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mpp_services' }, () => {
        fetchLiveAgencies();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mpp_facilities' }, () => {
        fetchLiveFacilities();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mpp_umkm' }, () => {
        fetchLiveUmkm();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mpp_flow' }, () => {
        fetchLiveFlow();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mpp_contacts' }, () => {
        fetchLiveContacts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mpp_skm' }, () => {
        fetchSkmData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mpp_queues' }, () => {
        fetchQueueStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, () => {
        syncMppNewsWithServer().then(res => {
          if (res && res.length > 0) setPortalNews(res);
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mpp_articles' }, () => {
        syncMppNewsWithServer().then(res => {
          if (res && res.length > 0) setPortalNews(res);
        });
      })
      .subscribe();

    const handleFacUpdate = () => {
      fetchLiveFacilities();
    };

    const handleProfileUpdate = (e: any) => {
      if (e?.detail) setPortalProfile(e?.detail);
    };

    const handleTenantsUpdate = () => {
      fetchLiveAgencies();
    };

    const handleServicesUpdate = () => {
      fetchLiveAgencies();
    };

    const handleUmkmUpdate = () => {
      fetchLiveUmkm();
    };

    const handleFloorPlanUpdate = (e: any) => {
      if (e?.detail) setPortalFloorPlan(e.detail);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mpp_portal_facilities') {
        fetchLiveFacilities();
      } else if (e.key === 'mpp_portal_umkm') {
        fetchLiveUmkm();
      } else if (e.key === 'mpp_portal_custom_services') {
        fetchLiveAgencies();
      } else if (e.key === 'mpp_portal_floorplan' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed) setPortalFloorPlan(parsed);
        } catch {}
      } else if (e.key === 'mpp_portal_profile' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed) setPortalProfile(parsed);
        } catch (err) {}
      }
    };

    window.addEventListener('mpp_facilities_updated', handleFacUpdate);
    window.addEventListener('mpp_portal_profile_updated', handleProfileUpdate);
    window.addEventListener('mpp_tenants_updated', handleTenantsUpdate);
    window.addEventListener('mpp_services_updated', handleServicesUpdate);
    window.addEventListener('mpp_umkm_updated', handleUmkmUpdate);
    window.addEventListener('mpp_floorplan_updated', handleFloorPlanUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      supabase.removeChannel(syncChannel);
      window.removeEventListener('mpp_facilities_updated', handleFacUpdate);
      window.removeEventListener('mpp_portal_profile_updated', handleProfileUpdate);
      window.removeEventListener('mpp_tenants_updated', handleTenantsUpdate);
      window.removeEventListener('mpp_services_updated', handleServicesUpdate);
      window.removeEventListener('mpp_umkm_updated', handleUmkmUpdate);
      window.removeEventListener('mpp_floorplan_updated', handleFloorPlanUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchLiveAgencies, fetchSkmData, fetchQueueStats, fetchLiveFacilities, fetchLiveUmkm, fetchLiveFlow, fetchLiveContacts]);

  // Helper untuk melakukan submit Survei SKM
  const handleSurveySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi 9 indikator tidak boleh 0
    if (
      surveyForm.q1 === 0 || surveyForm.q2 === 0 || surveyForm.q3 === 0 || 
      surveyForm.q4 === 0 || surveyForm.q5 === 0 || surveyForm.q6 === 0 || 
      surveyForm.q7 === 0 || surveyForm.q8 === 0 || surveyForm.q9 === 0
    ) {
      alert("Mohon lengkapi penilaian untuk seluruh 9 unsur pelayanan.");
      return;
    }

    try {
      await submitMppSurvey({
        nama: activeTicket?.name || 'Masyarakat Luwu',
        user_type: 'masyarakat',
        instansi: surveyForm.instansi || 'DPMPTSP Kabupaten Luwu',
        layanan: (surveyForm as any).layanan || 'Pelayanan Terpadu Satu Pintu',
        citizen_nik: activeTicket?.nik || undefined,
        citizen_phone: activeTicket?.phone || undefined,
        q1_persyaratan: surveyForm.q1,
        q2_prosedur: surveyForm.q2,
        q3_waktu: surveyForm.q3,
        q4_biaya: surveyForm.q4,
        q5_produk: surveyForm.q5,
        q6_kompetensi: surveyForm.q6,
        q7_perilaku: surveyForm.q7,
        q8_sarpras: surveyForm.q8,
        q9_pengaduan: surveyForm.q9,
        feedback: surveyForm.feedback || ''
      });

      // Setelah submit, hapus tiket karena pelayanan telah selesai seutuhnya
      sessionStorage.removeItem('mpp_active_ticket');
      localStorage.removeItem('mpp_active_ticket');
      setActiveTicket(null);
      await fetchSkmData();
    } catch (error) {
      console.error('Gagal menyimpan SKM:', error);
    }
    setIsSurveySubmitted(true);
  };

  // Helper untuk melakukan booking antrean online digital (Terintegrasi Supabase)
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingErrorMessage(null);

    // Tandai semua field telah diperiksa
    setQueueFormTouched({ nama: true, nik: true, phone: true, date: true });

    // Validasi menyeluruh semua field
    const errors: { nama?: string; nik?: string; phone?: string; date?: string } = {};
    if (!isNameFormatValid(queueForm.nama)) {
      errors.nama = 'Nama lengkap minimal 3 karakter sesuai KTP';
    }
    if (!isNikFormatValid(queueForm.nik)) {
      errors.nik = 'NIK harus tepat 16 digit angka';
    }
    if (!isPhoneFormatValid(queueForm.phone)) {
      errors.phone = 'Nomor WhatsApp/HP harus diawali 08 atau 628 (10-14 digit)';
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (!queueForm.date || queueForm.date < todayStr) {
      errors.date = 'Tanggal kunjungan tidak boleh di masa lalu';
    }

    if (Object.keys(errors).length > 0) {
      setQueueFormErrors(errors);
      setBookingErrorMessage('Mohon lengkapi dan periksa kembali format isian data yang belum valid.');
      return;
    }

    setIsBookingSubmitting(true);
    
    try {
      // 1. Get or Create Tenant di DB
      let tenantId: string | null = null;
      let tenantCode = 'MPP';
      const { data: existingTenant } = await supabase
        .from('mpp_tenants')
        .select('id, code, name')
        .eq('name', queueForm.agency)
        .maybeSingle();
        
      if (existingTenant) {
        tenantId = existingTenant.id;
        tenantCode = existingTenant.code;
      } else {
        const { data: matchedTenant } = await supabase
          .from('mpp_tenants')
          .select('id, code, name')
          .ilike('name', `%${queueForm.agency}%`)
          .limit(1)
          .maybeSingle();

        if (matchedTenant) {
          tenantId = matchedTenant.id;
          tenantCode = matchedTenant.code;
        } else {
          const newCode = (queueForm.agency.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8) || 'MPP').toUpperCase();
          const { data: newTenant, error: tErr } = await supabase
            .from('mpp_tenants')
            .insert({ name: queueForm.agency, code: newCode })
            .select('id, code')
            .single();
          if (tErr) throw tErr;
          tenantId = newTenant.id;
          tenantCode = newTenant.code;
        }
      }

      // 2. Get or Create Service
      let serviceId: string | null = null;
      const { data: existingService } = await supabase
        .from('mpp_services')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('service_name', queueForm.service)
        .maybeSingle();
        
      if (existingService) {
        serviceId = existingService.id;
      } else {
        const { data: matchedService } = await supabase
          .from('mpp_services')
          .select('id')
          .eq('tenant_id', tenantId)
          .ilike('service_name', `%${queueForm.service.substring(0, 15)}%`)
          .limit(1)
          .maybeSingle();

        if (matchedService) {
          serviceId = matchedService.id;
        } else {
          const { data: newService, error: sErr } = await supabase
            .from('mpp_services')
            .insert({ 
              tenant_id: tenantId, 
              service_name: queueForm.service,
              is_long_process: false 
            })
            .select('id')
            .single();
          if (sErr) throw sErr;
          serviceId = newService.id;
        }
      }

      // 3. Upsert Citizen & Issue Queue Ticket dengan Database Locking dan Validasi WITA
      const cleanPhone = queueForm.phone.replace(/[^\d+]/g, '');
      const today = queueForm.date || new Date().toISOString().split('T')[0];

      const queueRes = await fetch('/api/mpp/register-citizen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          service_id: serviceId,
          agency_name: queueForm.agency,
          service_name: queueForm.service,
          nik: queueForm.nik,
          citizen_nik: queueForm.nik,
          nama_lengkap: queueForm.nama.trim(),
          citizen_name: queueForm.nama.trim(),
          no_hp: cleanPhone || null,
          citizen_phone: cleanPhone || null,
          password: queueForm.password ? queueForm.password.trim() : undefined,
          jenis_kelamin: queueForm.gender,
          citizen_gender: queueForm.gender,
          pekerjaan: queueForm.occupation,
          citizen_occupation: queueForm.occupation,
          queue_date: today,
          session: queueForm.session,
          is_priority: false
        })
      });

      const queueResData = await queueRes.json();
      if (!queueRes.ok || !queueResData.success) {
        throw new Error(queueResData.message || 'Gagal menerbitkan nomor antrean.');
      }

      const issuedQueue = queueResData.queue || queueResData.data?.queue || queueResData.ticket || queueResData;
      const ticketNo = issuedQueue.ticket_code;

      // 4. Update UI, Session & Local Storage
      const targetAgency = liveAgencies.find(a => a.nama === queueForm.agency);
      const counterName = targetAgency?.loket || 'Loket Pelayanan MPP';
      const estTime = queueForm.session === 'pagi' ? '09:15 - 10:00 WITA' : '13:45 - 14:30 WITA';

      const newTicket = {
        number: ticketNo,
        counter: counterName,
        estimation: estTime,
        status: 'Terdaftar - Menunggu Dipanggil',
        agency: queueForm.agency,
        service: queueForm.service,
        date: today,
        session: queueForm.session === 'pagi' ? 'Sesi Pagi (07:30 - 12:00 WITA)' : 'Sesi Siang (13:00 - 16:00 WITA)',
        name: queueForm.nama,
        nik: queueForm.nik
      };

      setGeneratedTicket(newTicket);
      setActiveTicket(newTicket);

      // Session Hydration across activeUserId, citizenNik, citizenName
      const verifiedNik = queueForm.nik;
      const verifiedName = queueForm.nama.trim();
      sessionStorage.setItem('activeUserId', `cit-${verifiedNik}`);
      sessionStorage.setItem('citizenNik', verifiedNik);
      sessionStorage.setItem('citizenName', verifiedName);
      sessionStorage.setItem('luwu_user_role', 'citizen');
      localStorage.setItem('luwu_user_role', 'masyarakat');
      localStorage.setItem('luwu_user_nik', verifiedNik);
      localStorage.setItem('luwu_user_name', verifiedName);

      const ticketStr = JSON.stringify(newTicket);
      sessionStorage.setItem('mpp_active_ticket', ticketStr);
      localStorage.setItem('mpp_active_ticket', ticketStr);

      setIsQueueSubmitted(true);

    } catch (error: any) {
      console.error('Error submitting queue registration to Supabase:', error);
      setBookingErrorMessage(
        error?.message 
          ? `Gagal menyimpan antrean ke database: ${error.message}` 
          : 'Gagal terhubung ke database. Silakan periksa koneksi dan coba lagi.'
      );
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  // Inisialisasi pengecekan tiket aktif dari sessionStorage / localStorage
  useEffect(() => {
    try {
      const savedTicket = sessionStorage.getItem('mpp_active_ticket') || localStorage.getItem('mpp_active_ticket');
      if (savedTicket) {
        const parsed = JSON.parse(savedTicket);
        setActiveTicket(parsed);
        setGeneratedTicket(parsed);
      }
    } catch {
      // Abaikan bila format rusak
    }
  }, []);

  // Listener untuk membuka modal Rekomendasi Teknis PKKPR Dinas PUPTR
  useEffect(() => {
    const handleOpenPkkpr = (e: Event) => {
      const customEv = e as CustomEvent<Partial<PkkprRecommendationData> | undefined>;
      if (customEv.detail) {
        setPkkprInitialData(customEv.detail);
      }
      setIsPkkprModalOpen(true);
    };

    window.addEventListener('open-pkkpr-recommendation', handleOpenPkkpr);
    return () => window.removeEventListener('open-pkkpr-recommendation', handleOpenPkkpr);
  }, []);

  // Listener untuk membuka MppVisionModal (Asisten Digital Ta') dengan query opsional
  useEffect(() => {
    const handleOpenAiModal = (e: Event) => {
      const customEv = e as CustomEvent<string | undefined>;
      if (customEv.detail) {
        setAiModalQuery(customEv.detail);
      } else {
        setAiModalQuery(undefined);
      }
      setIsAiModalOpen(true);
    };

    window.addEventListener('open-mpp-ai-modal', handleOpenAiModal);
    return () => window.removeEventListener('open-mpp-ai-modal', handleOpenAiModal);
  }, []);

  // Listener untuk membuka GRPArchitectureModal (Inspektur Arsitektur GRP & SPBE)
  useEffect(() => {
    const handleOpenGrp = () => setIsGrpModalOpen(true);
    window.addEventListener('open-grp-architecture-modal', handleOpenGrp);
    return () => window.removeEventListener('open-grp-architecture-modal', handleOpenGrp);
  }, []);

  // Realtime Listener untuk status antrean (jika tiket aktif)
  useEffect(() => {
    if (!activeTicket || !activeTicket.number) return;

    const channel = supabase.channel(`queue_${activeTicket.number}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mpp_queues',
          filter: `ticket_code=eq.${activeTicket.number}`
        },
        (payload) => {
          const newStatus = payload.new.status;
          
          setActiveTicket(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              status: newStatus
            };
          });

          // Panggilan ke Loket oleh Operator Gerai (Bel Bandara, Getar HP, Layar Menyala)
          if (newStatus === 'dipanggil') {
            setIsCallingAlertOpen(true);
            triggerFullAirportCallingAlert(
              activeTicket.number, 
              `Loket ${activeTicket.counter || '01'}`
            );
            
            const updatedTicket = { ...activeTicket, status: 'dipanggil' };
            setGeneratedTicket(updatedTicket);
            sessionStorage.setItem('mpp_active_ticket', JSON.stringify(updatedTicket));
            localStorage.setItem('mpp_active_ticket', JSON.stringify(updatedTicket));
          } else if (newStatus === 'selesai_langsung') {
            setIsCallingAlertOpen(false);
            setIsSurveyModalOpen(true);
            setSurveyForm(prev => ({ ...prev, instansi: activeTicket.agency || 'DPMPTSP' }));
            
            // Simpan status selesai_langsung ke storage (jaga-jaga reload)
            const updatedTicket = { ...activeTicket, status: 'selesai_langsung' };
            setGeneratedTicket(updatedTicket);
            sessionStorage.setItem('mpp_active_ticket', JSON.stringify(updatedTicket));
            localStorage.setItem('mpp_active_ticket', JSON.stringify(updatedTicket));
          } else if (newStatus === 'masuk_tracking') {
            setIsCallingAlertOpen(false);
            // Arahkan otomatis ke tracking form (bisa via state atau scroll)
            document.getElementById('tracking-berkas')?.scrollIntoView({ behavior: 'smooth' });
            // Hapus tiket aktif karena masuk E-Lacak
            sessionStorage.removeItem('mpp_active_ticket');
            localStorage.removeItem('mpp_active_ticket');
            setActiveTicket(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTicket?.number, activeTicket?.counter, activeTicket?.agency]);

  // Simulasi panggilan operator loket (Bel Bandara, Getar Ponsel, & Layar Menyala Otomatis)
  const handleSimulateOperatorCall = () => {
    const current = generatedTicket || activeTicket;
    if (!current) return;
    const updated = { ...current, status: 'dipanggil' };
    setGeneratedTicket(updated);
    setActiveTicket(updated);
    sessionStorage.setItem('mpp_active_ticket', JSON.stringify(updated));
    localStorage.setItem('mpp_active_ticket', JSON.stringify(updated));
    setIsCallingAlertOpen(true);
  };

  // Simulasi layanan selesai (Demo/Testing SKM)
  const handleSimulateServiceCompleted = () => {
    const current = generatedTicket || activeTicket;
    if (!current) return;
    const updated = { ...current, status: 'selesai_langsung' };
    setGeneratedTicket(updated);
    setActiveTicket(updated);
    sessionStorage.setItem('mpp_active_ticket', JSON.stringify(updated));
    localStorage.setItem('mpp_active_ticket', JSON.stringify(updated));
  };

  // Batalkan nomor antrean aktif
  const handleCancelActiveTicket = () => {
    sessionStorage.removeItem('mpp_active_ticket');
    localStorage.removeItem('mpp_active_ticket');
    setActiveTicket(null);
    setGeneratedTicket(null);
    setIsQueueSubmitted(false);
  };

  // IntersectionObserver untuk memunculkan Sticky Quick-Nav saat Hero keluar dari viewport
  useEffect(() => {
    const heroEl = document.getElementById('hero');
    if (!heroEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Jika hero tidak terlihat (scrolled past), aktifkan sticky quick-nav
        setShowQuickNav(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(heroEl);
    return () => observer.disconnect();
  }, []);

  // IntersectionObserver untuk Scroll-Spy aktif pada section IDs
  useEffect(() => {
    const sectionIds = ['layanan', 'instansi', 'fasilitas', 'umkm', 'statistik', 'pengaduan', 'kontak', 'faq'];
    const elements = sectionIds.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSectionId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0,
      }
    );

    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [guideHubTab, transparencyHubTab, showSocialMediaFeed]);

  // Auto-play Slider Carousel Instansi Tergabung (Durasi 5 Detik)
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isSliderPaused, setIsSliderPaused] = useState(false);

  useEffect(() => {
    if (isSliderPaused) return;

    const interval = setInterval(() => {
      if (sliderRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 20) {
          sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          sliderRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isSliderPaused]);

  const handleSlidePrev = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const handleSlideNext = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      if (scrollLeft + clientWidth >= scrollWidth - 20) {
        sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        sliderRef.current.scrollBy({ left: 300, behavior: 'smooth' });
      }
    }
  };

  // Auto-play Slider Carousel Ulasan Masyarakat
  const ulasanSliderRef = useRef<HTMLDivElement>(null);
  const [isUlasanPaused, setIsUlasanPaused] = useState(false);

  useEffect(() => {
    if (isUlasanPaused || shouldReduceMotion) return;

    const interval = setInterval(() => {
      if (ulasanSliderRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = ulasanSliderRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 20) {
          ulasanSliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          ulasanSliderRef.current.scrollBy({ left: 350, behavior: 'smooth' });
        }
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [isUlasanPaused, shouldReduceMotion]);

  const facilitiesData = useMemo(() => {
    return mergeFacilitiesWithDb(dbFacilities, t);
  }, [dbFacilities, t]);

  const activeFacility = (facilitiesData || []).find(f => f.id === activeFacilityId) || facilitiesData?.[0];

  const formatMetricVal = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString('id-ID');
  };

  const statistikCards = [
    { label: t("mppPortal.statistik.dailyAvg"), value: formatMetricVal(queueMetrics.dailyAvg), numValue: queueMetrics.dailyAvg, icon: Clock },
    { label: t("mppPortal.statistik.weeklyAvg"), value: formatMetricVal(queueMetrics.weeklyAvg), numValue: queueMetrics.weeklyAvg, icon: CalendarDays },
    { label: t("mppPortal.statistik.monthlyAvg"), value: formatMetricVal(queueMetrics.monthlyAvg), numValue: queueMetrics.monthlyAvg, icon: Calendar },
    { label: t("mppPortal.statistik.yearlyAvg"), value: formatMetricVal(queueMetrics.yearlyTotal), numValue: queueMetrics.yearlyTotal, icon: TrendingUp },
  ];

  // 9 Unsur SKM (PermenPANRB No. 14/2017) Terkoneksi Database Supabase mpp_skm
  const skmIndicators = [
    { key: 'persyaratan', label: t("mppPortal.survey.indicators.persyaratan"), score: skmScores.persyaratan },
    { key: 'prosedur', label: t("mppPortal.survey.indicators.prosedur"), score: skmScores.prosedur },
    { key: 'kecepatan', label: t("mppPortal.survey.indicators.kecepatan"), score: skmScores.kecepatan },
    { key: 'biaya', label: t("mppPortal.survey.indicators.biaya"), score: skmScores.biaya },
    { key: 'produk', label: t("mppPortal.survey.indicators.produk"), score: skmScores.produk },
    { key: 'kompetensi', label: t("mppPortal.survey.indicators.kompetensi"), score: skmScores.kompetensi },
    { key: 'perilaku', label: t("mppPortal.survey.indicators.perilaku"), score: skmScores.perilaku },
    { key: 'sarana', label: t("mppPortal.survey.indicators.sarana"), score: skmScores.sarana },
    { key: 'pengaduan', label: t("mppPortal.survey.indicators.pengaduan"), score: skmScores.pengaduan },
  ];

  const averageSkm = skmScoreAverage;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      id="portal-top"
      className="bg-[#FAF8F3] dark:bg-[#061320] text-slate-900 dark:text-[#E6ECF2] font-sans w-full overflow-x-clip relative min-h-screen transition-colors duration-300"
    >
      {/* 1. ACCESSIBLE SKIP TO MAIN CONTENT LINK (WCAG AAA) */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-[#0F6B4F] focus:text-white focus:rounded-xl focus:shadow-2xl focus:font-bold focus:ring-2 focus:ring-[#C9A24B] focus:outline-none transition-all"
      >
        Lewati ke Konten Utama
      </a>
      <style>{`
        .font-sans { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }
        .font-editorial { font-family: 'Fraunces', 'Playfair Display', Georgia, serif; }
        
        @keyframes floating {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
            100% { transform: translateY(0px); }
        }
        .animate-floating { animation: floating 6s ease-in-out infinite; }
        .animate-floating-delayed { animation: floating 6s ease-in-out 3s infinite; }

        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
      
      <div className={`portal-mpp-root ${isAndroid ? 'is-android android-active' : ''} relative z-10 pb-36 md:pb-24 w-full`}>
        {/* Quota restriction status / Database connection alert banner */}
        {dbQuotaRestricted && (
          <div className="bg-amber-600 dark:bg-amber-700/90 text-white px-4 py-2.5 text-center text-xs font-bold font-sans flex items-center justify-center gap-2 border-b border-amber-500 shadow-sm relative z-50">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-200" />
            <span>Database Cloud MPP Simpurusiang sedang membatasi kuota egress bulanan (Koneksi Terputus). Beberapa fitur beralih ke mode offline lokal secara otomatis.</span>
          </div>
        )}

        {/* Inclusivity & Accessibility Bar (Mode Ramah Disabilitas, Text-to-Speech & High Contrast) */}
        <InclusivityAccessibilityBar isDark={isDark} hideFloatingFab={true} />

        {/* UNIFIED STICKY NAVBAR (ELEGAN NUSANTARA ALABASTER & IMPERIAL SLATE) */}
        <div className="sticky top-0 z-40 w-full border-b transition-colors bg-[#FAF8F3]/95 dark:bg-[#071728]/95 backdrop-blur-xl border-[#E5DFD3] dark:border-white/[0.08] shadow-[0_2px_16px_-6px_rgba(24,24,27,0.06)] dark:shadow-none">
          {/* Royal Luwu Gold-Emerald Crown Hairline */}
          <div aria-hidden="true" className="w-full h-[2px] bg-gradient-to-r from-[#0F6B4F] via-[#C9A24B] to-[#0F6B4F] opacity-85" />
          {/* Header - Android First & Ultra Responsive */}
          <header className="w-full">
          <div className={`flex justify-between items-center w-full px-3 sm:px-4 md:px-8 lg:px-14 max-w-[1440px] mx-auto transition-all duration-300 ${isScrolled ? "py-1.5 sm:py-2" : "py-2 sm:py-2.5 md:py-3"}`}>
            
            {/* Branding Logo & Title - Lambang Kabupaten Luwu & MPP Simpurusiang */}
            <div 
              className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 group cursor-pointer select-none"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="w-9 h-9 xs:w-10 xs:h-10 sm:w-11 sm:h-11 rounded-full sm:rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-300 bg-white dark:bg-white/[0.05] border-[#DFD6C5] dark:border-[#C9A24B]/25 shadow-2xs group-hover:scale-105">
                <img 
                  src={LUWU_LOGO_BASE64}
                  alt="Lambang Resmi Kabupaten Luwu" 
                  className="w-5.5 h-5.5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 object-contain drop-shadow-xs" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_IMAGE_URL;
                    e.currentTarget.style.backgroundColor = '#10b981';
                  }}
                />
              </div>
              <div className="flex flex-col shrink min-w-0">
                <span className="text-[15px] xs:text-base sm:text-lg md:text-[19px] font-extrabold text-slate-900 dark:text-slate-50 tracking-tight leading-tight font-sans whitespace-nowrap truncate">
                  MPP Simpurusiang
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold tracking-wide whitespace-nowrap font-sans text-[#855A14] dark:text-[#E2C475] truncate">
                  {t("mppPortal.nav.govName", "Pemerintah Kabupaten Luwu")}
                </span>
              </div>
            </div>

            {/* Desktop Navigation - Dynamic Scroll-Spy Active Underline */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8 mx-auto font-sans">
              {[
                {
                  id: 'hero',
                  label: t("mppPortal.nav.beranda"),
                  isActive: !showQuickNav,
                },
                {
                  id: 'layanan',
                  label: t("mppPortal.nav.layanan"),
                  isActive: showQuickNav && !['instansi', 'fasilitas', 'umkm', 'statistik'].includes(activeSectionId),
                },
                {
                  id: 'instansi',
                  label: t("mppPortal.nav.instansi"),
                  isActive: showQuickNav && activeSectionId === 'instansi',
                },
                {
                  id: 'fasilitas',
                  label: t("mppPortal.nav.fasilitas"),
                  isActive: showQuickNav && activeSectionId === 'fasilitas',
                },
                {
                  id: 'profil',
                  label: "Profil & Maklumat",
                  route: '/mpp/tentang',
                  isActive: false,
                },
                {
                  id: 'umkm',
                  label: t("mppPortal.nav.umkm", "Katalog UMKM"),
                  isActive: showQuickNav && activeSectionId === 'umkm',
                },
                {
                  id: 'statistik',
                  label: t("mppPortal.nav.statistik"),
                  isActive: showQuickNav && activeSectionId === 'statistik',
                },
              ].map((navItem) => (
                <a
                  key={navItem.id}
                  href={(navItem as any).route || `#${navItem.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    if ((navItem as any).route) {
                      navigate((navItem as any).route);
                    } else {
                      navigateToMppSection(navItem.id);
                    }
                  }}
                  className={`pb-0.5 font-sans text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap border-b-2 ${
                    navItem.isActive
                      ? 'text-emerald-700 dark:text-emerald-400 border-emerald-600 dark:border-emerald-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 border-transparent font-semibold hover:text-emerald-700 dark:hover:text-emerald-400'
                  }`}
                >
                  {navItem.label}
                </a>
              ))}
            </nav>

            {/* Header Right Actions - Unified Circular Geometry Across Search, ID, Theme, Lite Mode & Accessibility */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCommandPaletteOpen(true)}
                aria-label="Cari layanan, izin, atau instansi (Ctrl+K)"
                title="Cari Cepat Layanan & Instansi (Ctrl+K)"
                className="flex w-9 h-9 xs:w-10 xs:h-10 min-w-[36px] min-h-[36px] xs:min-w-[40px] xs:min-h-[40px] rounded-full bg-slate-100/90 dark:bg-white/[0.06] hover:bg-slate-200/80 dark:hover:bg-white/[0.12] border border-slate-200/90 dark:border-white/[0.12] text-slate-700 dark:text-slate-200 hover:text-[#0F6B4F] dark:hover:text-emerald-400 items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <Search className="w-[16px] h-[16px] sm:w-[17px] sm:h-[17px]" />
              </button>
              <div className="shrink-0 relative">
                <LanguageToggle isCircular={true} />
              </div>
              <div className="shrink-0 relative">
                <ThemeToggle isCircular={true} />
              </div>

              {/* 1-Tap Mode Tampilan Ringan (Hemat Kuota & Baterai untuk Jaringan Pelosok) */}
              <div className="relative group shrink-0">
                <button
                  type="button"
                  onClick={toggleLiteMode}
                  aria-pressed={isLiteMode}
                  aria-label={isLiteMode ? "Matikan Mode Tampilan Ringan" : "Aktifkan Mode Tampilan Ringan (Hemat Kuota)"}
                  className={`flex w-9 h-9 xs:w-10 xs:h-10 min-w-[36px] min-h-[36px] xs:min-w-[40px] xs:min-h-[40px] rounded-full border items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 ${
                    isLiteMode
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-slate-100/90 dark:bg-white/[0.06] hover:bg-slate-200/80 dark:hover:bg-white/[0.12] border-slate-200/90 dark:border-white/[0.12] text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {isLiteMode ? (
                    <WifiOff className="w-[16px] h-[16px] sm:w-[17px] sm:h-[17px]" />
                  ) : (
                    <Zap className="w-[16px] h-[16px] sm:w-[17px] sm:h-[17px] text-amber-600 dark:text-amber-400" />
                  )}
                </button>
                <div className="hidden sm:block pointer-events-none absolute top-full right-0 sm:left-1/2 sm:-translate-x-1/2 mt-2 px-2.5 py-1 bg-surface/90 dark:bg-slate-800/95 text-white text-[11px] font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg z-50">
                  {isLiteMode ? 'Mode Ringan Aktif (Hemat Kuota & Baterai)' : 'Mode Ringan (Hemat Kuota & Baterai)'}
                </div>
              </div>

              {/* Ramah Inklusif & Disabilitas Utility Button (Harmonized Circular Control) */}
              <div className="relative group shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    dismissAccessibilityCoachMark();
                    window.dispatchEvent(new CustomEvent('toggle-mpp-accessibility'));
                  }}
                  className="flex w-9 h-9 xs:w-10 xs:h-10 min-w-[36px] min-h-[36px] xs:min-w-[40px] xs:min-h-[40px] rounded-full bg-slate-100/90 dark:bg-white/[0.06] hover:bg-slate-200/80 dark:hover:bg-white/[0.12] border border-slate-200/90 dark:border-white/[0.12] text-emerald-700 dark:text-emerald-400 items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
                  aria-label="Layanan Ramah Inklusif & Disabilitas"
                >
                  <Accessibility className="w-[17px] h-[17px] sm:w-[18px] sm:h-[18px] text-emerald-700 dark:text-emerald-400" />
                </button>

                {/* Desktop Micro-Tooltip */}
                <div className="hidden sm:block pointer-events-none absolute top-full right-0 sm:left-1/2 sm:-translate-x-1/2 mt-2 px-2.5 py-1 bg-surface/90 dark:bg-slate-800/95 text-white text-[11px] font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg z-50">
                  Mode Aksesibilitas & Pembaca Suara
                </div>

                {/* Mobile One-Time Coach-Mark Badge */}
                {showAccessibilityCoachMark && (
                  <div className="sm:hidden absolute top-full right-0 mt-2 px-2.5 py-1.5 bg-slate-900 dark:bg-emerald-700 text-white text-[10px] font-semibold rounded-xl shadow-lg z-50 flex items-center gap-1.5 whitespace-nowrap">
                    <span>Mode Aksesibilitas</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissAccessibilityCoachMark();
                      }}
                      className="p-0.5 rounded-full hover:bg-white/15 text-white cursor-pointer"
                      aria-label="Tutup petunjuk aksesibilitas"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <button 
                type="button" 
                onClick={() => {
                  setIsQueueSubmitted(false);
                  setIsQueueBookingOpen(true);
                }}
                className="hidden sm:flex items-center gap-2 h-10 bg-[#0F6B4F] hover:bg-[#0B533D] dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 px-4 rounded-full text-xs font-bold font-sans shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                title="Daftar & Ambil Nomor Antrean Loket MPP"
              >
                <Ticket className="w-3.5 h-3.5 shrink-0" />
                <span>{t("mppPortal.quickActions.antrean", "Ambil Antrean")}</span>
              </button>
            </div>
          </div>
        </header>

        {/* --- FASE 1: ACTIVE TICKET STATUS BAR (FITUR 3) --- */}
        {activeTicket && !isTicketBarDismissed && (
          <div className={`w-full border-t text-white shadow-md transition-all animate-fadeIn ${
            activeTicket.status === 'dipanggil'
              ? 'bg-gradient-to-r from-amber-950/95 via-slate-900/95 to-amber-950/95 border-amber-400/80 shadow-amber-500/20'
              : 'bg-emerald-950/95 dark:bg-surface/95 border-emerald-500/30'
          }`}>
            <div className="max-w-[1440px] mx-auto px-2 md:px-8 py-2 sm:py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-2.5 w-2.5 relative shrink-0">
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    activeTicket.status === 'dipanggil' ? 'bg-amber-400 ring-2 ring-amber-400/30' : 'bg-emerald-400 ring-2 ring-emerald-400/30'
                  }`}></span>
                </span>
                <span className={`font-sans font-extrabold px-3 py-0.5 rounded-lg text-xs tracking-wider shrink-0 border ${
                  activeTicket.status === 'dipanggil'
                    ? 'text-amber-300 bg-amber-950/80 border-amber-400/50 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                    : 'text-emerald-300 bg-emerald-950/80 border-emerald-500/40'
                }`}>
                  {activeTicket.number}
                </span>
                <span className="font-semibold text-slate-100 truncate">
                  {activeTicket.status === 'dipanggil' ? (
                    <span className="text-amber-300 font-bold animate-pulse flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5" /> {t("mppPortal.status.beingCalledAt", "SEDANG DIPANGGIL DI LOKET {{counter}}", { counter: activeTicket.counter })}
                    </span>
                  ) : (
                    activeTicket.counter
                  )}
                </span>
                <span className="hidden sm:inline-block text-emerald-300/80 text-xs">
                  • Est: {activeTicket.estimation}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {activeTicket.status === 'dipanggil' ? (
                  <button
                    type="button"
                    onClick={() => setIsCallingAlertOpen(true)}
                    className="min-h-[44px] sm:min-h-[36px] px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black font-sans text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/30 animate-pulse active:scale-95"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{t("mppPortal.status.calledOpenScreen", "DIPANGGIL! Buka Layar")}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setGeneratedTicket(activeTicket);
                      setIsQueueSubmitted(true);
                      setIsQueueBookingOpen(true);
                    }}
                    className="min-h-[44px] sm:min-h-[36px] px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-sans text-xs transition-colors flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
                  >
                    {t("mppPortal.status.openTicket", "Buka Tiket")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsTicketBarDismissed(true)}
                  aria-label={t("mppPortal.notification.closeAria", "Tutup notifikasi tiket")}
                  className="min-h-[44px] sm:min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-800/50 hover:bg-slate-700/80 text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors active:scale-95 cursor-pointer border border-white/10"
                >
                  <span className="text-xs font-medium hidden sm:inline-block">{t("common.hide", "Sembunyikan")}</span>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- FASE 1: MOBILE/TABLET QUICK-NAV (HIDDEN ON DESKTOP TO PREVENT DOUBLE STICKY HEADER) --- */}
        {showQuickNav && (
          <div className="lg:hidden w-full border-t border-[#E5DFD3] dark:border-white/[0.07] bg-[#FAF8F3]/95 dark:bg-[#071728]/95 backdrop-blur-xl transition-all">
            <div className="relative max-w-[1440px] mx-auto">
              <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-8 sm:w-14 bg-gradient-to-l from-[#FAF8F3] dark:from-[#071728] to-transparent z-10" />
              <div className="pointer-events-none absolute top-0 left-0 bottom-0 w-6 sm:w-10 bg-gradient-to-r from-[#FAF8F3] dark:from-[#071728] to-transparent z-10" />

              <div className="flex items-center overflow-x-auto snap-x snap-mandatory no-scrollbar py-1.5 px-4 gap-1.5 touch-pan-x">
                <button
                  type="button"
                  onClick={() => setIsCommandPaletteOpen(true)}
                  className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold font-sans flex items-center gap-1.5 whitespace-nowrap snap-start transition-all cursor-pointer select-none bg-[#0F6B4F]/10 dark:bg-emerald-500/15 text-[#0F6B4F] dark:text-emerald-300 border border-[#0F6B4F]/25 dark:border-emerald-500/35 hover:bg-[#0F6B4F] hover:text-white shrink-0 active:scale-95"
                  title="Buka Pencarian Cepat Instansi, Izin, atau Fitur"
                >
                  <Search className="w-3.5 h-3.5 shrink-0" />
                  <span>Cari</span>
                </button>

                {(
                  activePersona === 'investor'
                    ? [
                        { id: 'investor-vip', label: "Desk VIP Investor", icon: Sparkles },
                        { id: 'peta-spasial', label: "Peta Spasial RDTR", icon: MapPin },
                        { id: 'syarat-dokumen', label: "Syarat Izin & OSS", icon: CheckSquare },
                        { id: 'tracking-berkas', label: "Lacak Izin Usaha", icon: SearchCheck },
                        { id: 'denah-interaktif', label: "Denah Lounge & Gerai", icon: Layers },
                        { id: 'statistik', label: "Statistik Kinerja", icon: BarChart3 },
                      ]
                    : [
                        { id: 'syarat-dokumen', label: "Cek Syarat Berkas", icon: CheckSquare },
                        { id: 'smart-live-queue', label: "Radar Antrean Live", icon: Ticket },
                        { id: 'tracking-berkas', label: "Lacak Resi Berkas", icon: SearchCheck },
                        { id: 'instansi', label: `${liveAgencies.length} Instansi`, icon: Building2 },
                        { id: 'denah-interaktif', label: "Denah Gedung", icon: Layers },
                        { id: 'alur-pelayanan', label: "Alur & Jam Ramai", icon: FileCheck },
                        { id: 'fasilitas', label: "Fasilitas Gedung", icon: Armchair },
                        { id: 'survey', label: "Survei SKM", icon: Star },
                      ]
                ).map((item) => {
                  const isActive = activeSectionId === item.id;
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        navigateToMppSection(item.id);
                      }}
                      className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold font-sans flex items-center gap-1.5 whitespace-nowrap snap-start transition-all cursor-pointer select-none shrink-0 ${
                        isActive
                          ? 'bg-[#0F6B4F] dark:bg-emerald-500 text-white dark:text-slate-950 font-bold shadow-xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#0F6B4F] dark:hover:text-emerald-300'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

        {/* Main Content Area */}
        <main id="main-content" tabIndex={-1} className="w-full max-w-[1440px] mx-auto px-0 pt-0.5 sm:pt-3 pb-4 sm:pb-6 md:pb-8 flex flex-col gap-0 overflow-x-clip outline-none">
          
          {/* Hero Section (Harmonized Nusantara Alabaster vs Nocturnal Imperial Slate) */}
          <section
            id="hero"
            className="relative w-full px-0 pt-0 sm:pt-2 pb-8 sm:pb-11 flex flex-col items-center text-center scroll-mt-36 sm:scroll-mt-40 before:absolute before:inset-0 before:w-[200vw] before:left-1/2 before:-translate-x-1/2 before:-z-20 before:transition-colors before:bg-[#FAF8F3] dark:before:bg-[#061320]"
          >
            {/* Ambient Celestial Glow (Desktop Dark Mode Depth) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[520px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/[0.10] via-teal-500/[0.04] to-transparent blur-3xl -z-10"
            />

            <div id="beranda" className="absolute -top-24 left-0 w-0 h-0 pointer-events-none" />

            {/* Desktop Super-App Prominent Hero Search Bar */}
            <SuperHeroSearch
              bannerUrl={portalProfile?.banner_url}
              activePersona={activePersona}
              previewMode="after"
              isDark={isDark}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              onOpenVoiceAssistant={() => window.dispatchEvent(new CustomEvent('open-mpp-voice-assistant'))}
              onSelectChip={(chipId) => {
                if (chipId === 'antrean') {
                  setIsQueueBookingOpen(true);
                } else {
                  setIsCommandPaletteOpen(true);
                }
              }}
              onSearchSubmit={(q) => {
                setCommandPaletteInitialQuery(q);
                setIsCommandPaletteOpen(true);
              }}
            />

            {/* Quick Action Ribbon - Aligned max-w-7xl with Split-Editorial Hero */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
              }}
              className="grid grid-cols-3 gap-1.5 sm:gap-4 w-full max-w-7xl mx-auto px-1 sm:px-6 lg:px-8 mt-2 sm:mt-3 mb-4 sm:mb-7"
            >
              {(activePersona === 'investor'
                ? [
                    {
                      id: 'vip-desk',
                      icon: Briefcase,
                      title: t("mppPortal.quickActions.vipDesk", "Eksekutif Desk Investasi"),
                      mobileTitle: t("mppPortal.quickActions.vipDeskShort", "Desk VIP"),
                      desc: t("mppPortal.quickActions.vipDeskDesc", "Liaison Officer & Fasilitasi"),
                      mobileDesc: t("mppPortal.quickActions.vipDeskDescShort", "Fasilitasi VIP"),
                      onClick: () => navigateToMppSection('investor-vip'),
                    },
                    {
                      id: 'peta-rdtr',
                      icon: MapPin,
                      title: t("mppPortal.quickActions.petaSpasial", "Peta Spasial RDTR"),
                      mobileTitle: t("mppPortal.quickActions.petaSpasialShort", "Peta RDTR"),
                      desc: t("mppPortal.quickActions.petaSpasialDesc", "WebGIS Zonasi & Potensi"),
                      mobileDesc: t("mppPortal.quickActions.petaSpasialDescShort", "WebGIS Zonasi"),
                      onClick: () => navigateToMppSection('peta-spasial'),
                    },
                    {
                      id: 'izin-oss',
                      icon: FileCheck,
                      title: t("mppPortal.quickActions.izinOss", "Izin Usaha OSS"),
                      mobileTitle: t("mppPortal.quickActions.izinOssShort", "Izin OSS"),
                      desc: t("mppPortal.quickActions.izinOssDesc", "Syarat NIB, PBG & SLF"),
                      mobileDesc: t("mppPortal.quickActions.izinOssDescShort", "Syarat NIB & PBG"),
                      onClick: () => navigateToMppSection('syarat-dokumen'),
                    },
                  ]
                : [
                    {
                      id: 'antrean',
                      icon: Ticket,
                      title: t("mppPortal.quickActions.antrean", "Antrean Online"),
                      mobileTitle: t("mppPortal.quickActions.antreanShort", "Antrean"),
                      desc: t("mppPortal.quickActions.antreanDesc", "Ambil Kuota Tiket Loket"),
                      mobileDesc: t("mppPortal.quickActions.antreanDescShort", "Ambil Tiket"),
                      onClick: () => {
                        setIsQueueSubmitted(false);
                        setIsQueueBookingOpen(true);
                      },
                    },
                    {
                      id: 'cek-syarat',
                      icon: CheckSquare,
                      title: t("mppPortal.quickActions.cekSyarat", "Cek Syarat Berkas"),
                      mobileTitle: t("mppPortal.quickActions.cekSyaratShort", "Syarat Berkas"),
                      desc: `Panduan ${liveAgencies.length} Gerai Instansi`,
                      mobileDesc: `${liveAgencies.length} Instansi`,
                      onClick: () => navigateToMppSection('layanan'),
                    },
                    {
                      id: 'cek-status',
                      icon: SearchCheck,
                      title: t("mppPortal.quickActions.cekStatus", "Lacak Berkas & Aduan"),
                      mobileTitle: t("mppPortal.quickActions.cekStatusShort", "Lacak Berkas"),
                      desc: t("mppPortal.quickActions.cekStatusDesc", "Cek Resi Izin Real-Time"),
                      mobileDesc: t("mppPortal.quickActions.cekStatusDescShort", "Cek Resi"),
                      onClick: () => navigateToMppSection('tracking-berkas'),
                    },
                  ]
              ).map((action, idx) => {
                const ActionIcon = action.icon;
                const isPrimaryCard = idx === 0;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={action.onClick}
                    className={`w-full min-h-[72px] sm:h-[90px] p-1 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl border active:scale-[0.98] transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between sm:gap-4 group cursor-pointer text-left ${
                      isPrimaryCard
                        ? 'bg-white dark:bg-[#0D243B] hover:bg-[#FCFBF7] dark:hover:bg-[#133250] border-[#D6C6A5] dark:border-[#C9A24B]/30 hover:border-[#0F6B4F]/50 dark:hover:border-emerald-400/45 shadow-[0_10px_28px_-10px_rgba(133,90,20,0.14)] dark:shadow-[inset_0_1px_0_rgba(226,196,117,0.10),0_14px_30px_-12px_rgba(0,0,0,0.6)]'
                        : 'bg-white dark:bg-[#0B1F33] hover:bg-[#FCFBF7] dark:hover:bg-[#112C47] border-[#E4DDD0] dark:border-white/[0.09] hover:border-[#0F6B4F]/40 dark:hover:border-emerald-400/35 shadow-[0_8px_24px_-12px_rgba(24,24,27,0.08)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_28px_-12px_rgba(0,0,0,0.55)]'
                    }`}
                  >
                    <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start mb-2 sm:mb-0">
                      <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl border flex items-center justify-center transition-colors shrink-0 ${
                        isPrimaryCard
                          ? 'bg-[#0F6B4F] dark:bg-emerald-500 text-white dark:text-slate-950 border-[#0F6B4F] dark:border-emerald-400'
                          : 'bg-[#F5F2EA] dark:bg-[#13314E] text-[#0F6B4F] dark:text-emerald-400 border-[#E2DACB] dark:border-white/[0.08] group-hover:bg-[#0F6B4F] dark:group-hover:bg-emerald-500 group-hover:text-white dark:group-hover:text-slate-950'
                      }`}>
                        <ActionIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <ArrowUpRight className="sm:hidden w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-[#0F6B4F] dark:group-hover:text-emerald-400 transition-colors shrink-0" />
                    </div>

                    <div className="min-w-0 flex-1 w-full">
                      <span className="sm:hidden block font-sans text-xs font-extrabold text-slate-900 dark:text-slate-50 tracking-tight leading-tight truncate group-hover:text-[#0F6B4F] dark:group-hover:text-emerald-400 transition-colors">
                        {action.mobileTitle}
                      </span>
                      <span className="hidden sm:block font-sans text-sm font-extrabold text-slate-900 dark:text-slate-50 tracking-tight leading-snug truncate group-hover:text-[#0F6B4F] dark:group-hover:text-emerald-400 transition-colors">
                        {action.title}
                      </span>
                      <span className="sm:hidden block text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                        {action.mobileDesc}
                      </span>
                      <span className="hidden sm:block text-xs text-slate-600 dark:text-slate-300/90 font-medium truncate mt-0.5">
                        {action.desc}
                      </span>
                    </div>

                    <div className="hidden sm:flex w-8 h-8 rounded-full bg-[#F5F2EA] dark:bg-white/[0.05] group-hover:bg-[#0F6B4F]/15 dark:group-hover:bg-emerald-400/15 items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-[#0F6B4F] dark:group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all shrink-0">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </motion.div>

            {/* Unboxed Institutional Operational Strip (Zero-Pill Civic Trust Telemetry) */}
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-300/90 border-y border-[#E6DFD2] dark:border-white/[0.07] py-2.5">
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100">
                <Clock className="w-3.5 h-3.5 text-[#0F6B4F] dark:text-emerald-400 shrink-0" />
                <span>{witaOperationalSummary.scheduleText}</span>
              </span>
              <span aria-hidden="true" className="text-[#C9A24B]">·</span>
              <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                {liveAgencies.length} Instansi Terpadu
              </span>
              {Number(skmScoreAverage) > 0 && (
                <>
                  <span aria-hidden="true" className="text-[#C9A24B]">·</span>
                  <span className="font-mono tabular-nums font-semibold text-[#0F6B4F] dark:text-emerald-300">
                    IKM {Number(skmScoreAverage).toFixed(2)}
                  </span>
                </>
              )}
              <span aria-hidden="true" className="hidden sm:inline text-[#C9A24B]">·</span>
              <span className="hidden sm:inline text-[#855A14] dark:text-[#E2C475] font-semibold">
                Maklumat Pelayanan Transparan &amp; Bebas Pungli
              </span>
            </div>

              {/* Persona Switcher — Tailored Warm Alabaster & Imperial Slate Segmented Control */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
                }}
                className="w-full flex flex-col items-center gap-2.5 px-3"
              >
                <div className="rounded-2xl p-1.5 flex items-center justify-center gap-1.5 border bg-[#EFECE3] dark:bg-[#0A1D30] border-[#DFD8C8] dark:border-white/[0.14] shadow-xs dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] max-w-full overflow-x-auto no-scrollbar">
                  {[
                    { id: "warga", label: t("mppPortal.persona.warga", "Masyarakat"), icon: User },
                    { id: "investor", label: t("mppPortal.persona.investor", "Investor & Bisnis"), icon: Briefcase },
                    { id: "semua", label: t("mppPortal.persona.semua", "Semua Layanan"), icon: Globe },
                  ].map((p) => {
                    const isActive = activePersona === p.id;
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setActivePersona(p.id as 'warga' | 'investor' | 'semua')}
                        className={`relative min-h-[40px] sm:min-h-[42px] px-4 sm:px-5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
                          isActive
                            ? 'bg-white dark:bg-gradient-to-r dark:from-emerald-600 dark:to-teal-600 text-slate-900 dark:text-white border border-[#DFD8C8] dark:border-emerald-400/40 font-bold shadow-xs dark:shadow-[0_4px_16px_rgba(16,185,129,0.3)]'
                            : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#0F6B4F] dark:text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Unboxed Quiet Context Line */}
                <div className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-medium text-center max-w-xl">
                  {activePersona === 'warga' && (
                    <span>{t('access.sub_info', 'Antrean langsung, persyaratan berkas kependudukan & gerai instansi layanan publik.')}</span>
                  )}
                  {activePersona === 'investor' && (
                    <span>{t('mppPortal.personaDesc.investor', 'Eksekutif Desk Investasi, konsultasi tata ruang, peta spasial RDTR, & perizinan OSS-RBA.')}</span>
                  )}
                  {activePersona === 'semua' && (
                    <span>{t('mppPortal.personaDesc.semua', 'Seluruh modul layanan masyarakat, investasi, fasilitasi bisnis & regulasi daerah.')}</span>
                  )}
                </div>

                {/* Kios Mandiri, Berita & Akses Petugas */}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-xs text-slate-500 dark:text-slate-400">
                  <button
                    type="button"
                    onClick={() => {
                      setAirportKioskInitialMode('citizen');
                      setIsAirportKioskOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 font-medium hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    <Pointer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{t("mppPortal.quickActions.mandiri", "Kios Mandiri 24 Jam")}</span>
                  </button>
                  <span className="hidden sm:inline text-slate-300 dark:text-slate-700">·</span>
                  <a
                    href="#publikasi-berita"
                    onClick={(e) => {
                      e.preventDefault();
                      navigateToMppSection('publikasi-berita');
                    }}
                    className="inline-flex items-center gap-1.5 font-medium hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400" />
                    <span>{t("mppPortal.hero.videoTour", "Berita & Profil MPP")}</span>
                  </a>
                  <span className="hidden sm:inline text-slate-300 dark:text-slate-700">·</span>
                  <button
                    type="button"
                    onClick={handleFoAccess}
                    className="inline-flex items-center gap-1.5 hover:text-rose-600 dark:hover:text-rose-400 font-medium transition-colors cursor-pointer"
                  >
                    <BellRing className="w-3.5 h-3.5 text-rose-500" />
                    <span>Command Center FO</span>
                  </button>
                  <span className="hidden sm:inline text-slate-300 dark:text-slate-700">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      const sessionStr = localStorage.getItem('mpp_tenant_operator_session');
                      if (sessionStr) {
                        try {
                          const sess = JSON.parse(sessionStr);
                          if (sess && sess.tenantId) {
                            setIsTenantDashboardOpen(true);
                            return;
                          }
                        } catch (e) {}
                      }
                      setIsOperatorLoginOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t("mppPortal.hero.officerPortal", "Portal Petugas Gerai")}</span>
                  </button>
                </div>
              </motion.div>
          </section>

          {/* ===================================================================== */}
          {/* ZONA LAYANAN INTI WARGA (PRIORITAS UTAMA: SYARAT, ANTREAN, LACAK RESI) */}
          {/* ===================================================================== */}
          <section id="layanan" className="w-full scroll-mt-36 sm:scroll-mt-40">
            <div id="syarat-dokumen" className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 scroll-mt-36 sm:scroll-mt-40">
              <CekPersyaratanLayananPilot 
                initialServiceId={activeRequirementService}
                onOpenQueueBooking={(serviceName, agencyName) => {
                  if (serviceName || agencyName) {
                    setQueueForm(prev => ({
                      ...prev,
                      service: serviceName || prev.service,
                      agency: agencyName || prev.agency
                    }));
                  }
                  setIsQueueSubmitted(false);
                  setIsQueueBookingOpen(true);
                }}
                isDark={isDark}
              />

              {/* Tombol Aksi Buka Seluruh Matriks Layanan MPP */}
              <div className="flex justify-center mt-8 sm:mt-10">
                <MagneticButton 
                  strength={0.25}
                  onClick={() => setIsServicesMatrixOpen(true)}
                  className="w-full sm:w-auto min-h-[48px] h-12 px-7 rounded-xl bg-[#0F6B4F] hover:bg-[#0B543E] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm tracking-wide shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer group font-sans active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-[#F5DFA0]" />
                  <span>{`Buka Matriks Lengkap Seluruh Layanan (${liveAgencies.length} Instansi)`}</span>
                  <ChevronRight className="w-4 h-4 text-emerald-100 group-hover:translate-x-1 transition-transform" />
                </MagneticButton>
              </div>
            </div>
          </section>

          {/* Panduan & Pengambilan Tiket Antrean Online */}
          <OnlineQueueOnboardingSection
            isDark={isDark}
            agencyCount={liveAgencies.length}
            onOpenBooking={() => {
              setIsQueueSubmitted(false);
              setIsQueueBookingOpen(true);
            }}
          />

          {/* Radar Antrean Live & Status Loket Real-Time */}
          <div id="smart-live-queue" className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 scroll-mt-36 sm:scroll-mt-40">
            <BentoLiveQueueRadar 
              isDark={isDark} 
              totalAgencies={liveAgencies.length}
              onRegisterQueue={(agencyName) => {
                if (agencyName) {
                  setQueueForm(prev => ({ ...prev, service: agencyName }));
                }
                setIsQueueSubmitted(false);
                setIsQueueBookingOpen(true);
              }}
            />
          </div>

          {/* Pelacakan Resi & Dokumen Layanan Terpadu (Diprioritaskan di Zona Inti Warga) */}
          <div id="tracking-berkas" className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-8 sm:py-12 scroll-mt-36 sm:scroll-mt-40">
            <SmartDocumentTracker isDark={isDark} />
          </div>

          {/* Layanan Inklusif Terhubung Database: Jadwal MPP Keliling, Drive-Thru & Akses Cepat Riil */}
          <MppBestPracticesAdoption
            isDark={isDark}
            isLiteMode={isLiteMode}
            onToggleLiteMode={toggleLiteMode}
            activeTicketNumber={activeTicket?.number || generatedTicket?.number || null}
            expressAgencies={expressAgencyShortcuts}
            onOpenQueueModal={(serviceName, agencyName) => {
              if (serviceName || agencyName) {
                setQueueForm(prev => ({
                  ...prev,
                  service: serviceName || prev.service,
                  agency: agencyName || prev.agency
                }));
              }
              setIsQueueSubmitted(false);
              setIsQueueBookingOpen(true);
            }}
          />

          {/* Direktori Instansi Tergabung */}
          <InstansiTergabungSection
            tenants={liveAgencies}
            onSelectTenant={(agency) => setSelectedAgencyDetail(agency)}
            onViewAll={() => setIsAgenciesCatalogOpen(true)}
          />

          {/* --- PROGRESSIVE DISCLOSURE HUB 1: PANDUAN GEDUNG, ALUR, FASILITAS & FAQ --- */}
          <div id="panduan-gedung-hub" className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-2 scroll-mt-36 sm:scroll-mt-40">
            <div className="flex flex-col items-center text-center mb-5 sm:mb-6">
              <span className={`${MPP_TYPOGRAPHY.eyebrow} mb-1.5`}>
                Panduan Kunjungan Fisik &amp; Prosedur
              </span>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans text-balance">
                Denah Gedung, Alur Layanan &amp;{" "}
                <span className="font-serif-display italic font-semibold text-[#0F6B4F] dark:text-[#6EE7B7]">
                  Fasilitas Publik
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300/90 max-w-2xl mt-1.5 leading-relaxed">
                Pilih panduan di bawah ini sesuai kebutuhan kunjungan Anda tanpa harus menggulir seluruh halaman.
              </p>
              <div className="gold-divider-diamond" aria-hidden="true">
                <span className="gold-diamond-icon" />
              </div>
            </div>

            <div className="flex items-center justify-start sm:justify-center overflow-x-auto no-scrollbar gap-1.5 p-1.5 rounded-2xl bg-[#EFECE3] dark:bg-[#0B2035] border border-[#DFD8C8] dark:border-white/[0.08] max-w-4xl mx-auto">
              {[
                { id: 'denah' as const, label: 'Denah Gedung', icon: Layers },
                { id: 'alur' as const, label: 'Alur, Jam Ramai & SLA', icon: FileCheck },
                { id: 'fasilitas' as const, label: 'Fasilitas & Galeri Gedung', icon: Armchair },
                { id: 'faq' as const, label: 'Tanya Jawab (FAQ)', icon: HelpCircle },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = guideHubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setGuideHubTab(tab.id);
                      if (tab.id === 'denah') setForceLoadFloorPlan(true);
                    }}
                    className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-sans flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-[#0F6B4F] dark:bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <TabIcon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seksi Motto Pelayanan Kami (Ditampilkan pada Tab Fasilitas & Galeri Gedung) */}
          {guideHubTab === 'fasilitas' && (
          <motion.section
            id="motto-pelayanan"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-6xl mx-auto flex flex-col items-center text-center py-10 sm:py-14 md:py-20 px-2.5 sm:px-6 lg:px-8 relative"
          >
            <div className="w-full max-w-2xl mx-auto text-center px-4 flex flex-col items-center mb-8 sm:mb-10 break-words">
              <div className={`${MPP_TYPOGRAPHY.eyebrow} mb-2`}>
                {t("mppPortal.motto.badge")}
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white font-sans mt-0.5 text-balance">
                {t("mppPortal.motto.title")}{" "}
                <span className="font-serif-display italic font-semibold text-[#0F6B4F] dark:text-[#E2C475]">
                  {t("mppPortal.motto.magatti")}
                </span>
              </h2>
              
              {/* Motto Tagline - Clean Typographic Sequence (Zero-Pill) */}
              <div className="mt-3 mb-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                <span className="text-slate-900 dark:text-slate-100 font-semibold">Murah</span>
                <span aria-hidden="true" className="text-[#C9A24B]">·</span>
                <span className="text-slate-900 dark:text-slate-100 font-semibold">Gampang</span>
                <span aria-hidden="true" className="text-[#C9A24B]">·</span>
                <span className="text-slate-900 dark:text-slate-100 font-semibold">Cepat</span>
                <span aria-hidden="true" className="text-[#C9A24B]">·</span>
                <span className="text-slate-900 dark:text-slate-100 font-semibold">Tepat</span>
                <span aria-hidden="true" className="text-[#C9A24B]">·</span>
                <span className="text-slate-900 dark:text-slate-100 font-semibold">Inovatif</span>
              </div>

              <div className="gold-divider-diamond" aria-hidden="true">
                <span className="gold-diamond-icon" />
              </div>
            </div>

            {/* Desain Card Galeri Gedung & Ruang MPP Simpurusiang (Bersih Tanpa Pendaran Neon Berlebihan) */}
            <div className="relative w-full max-w-5xl lg:max-w-6xl mx-auto px-0 sm:px-2">
              <div className="relative z-10 w-full">
                <MppMagattiGallerySlideshow isDark={isDark} />
              </div>
            </div>
          </motion.section>
          )}

          {/* Seksi Alur Pelayanan (Interactive Slide & Search Component) */}
          {guideHubTab === 'alur' && (
          <motion.section
            id="alur-pelayanan"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-6xl mx-auto py-10 sm:py-14 md:py-20 px-2.5 sm:px-6 lg:px-8 relative"
          >
            {/* Header Seksi Terpusat (Zero-Pill Eyebrow) */}
            <div className="w-full max-w-2xl mx-auto text-center px-4 flex flex-col items-center mb-5 sm:mb-8 space-y-2">
              <span className={MPP_TYPOGRAPHY.eyebrow}>
                {t("sections.workflow_badge", t("mppPortal.alur.badge", "Panduan Prosedur"))}
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans text-center">
                {t("sections.workflow_title", "Alur Pelayanan Layanan Terpadu")}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto text-center leading-relaxed">
                {t("sections.workflow_subtitle", t("mppPortal.alur.subtitle", "Berikut adalah alur pelayanan standar terpadu di MPP Simpurusiang Kabupaten Luwu."))}
              </p>
            </div>

            {/* Step Diagram Alur Pelayanan Terpadu 1 -> 2 -> 3 -> 4 (Sequential Reveal + SVG Line Draw) */}
            <AlurPelayananDiagram isDark={isDark} />

            {/* Inovasi Slide Carousel & Pencarian Form Alur Pelayanan 12 Tenant MPP */}
            <MppServicesWorkflowCarousel 
              currentLang={i18n.language} 
              isDark={isDark} 
            />
          </motion.section>
          )}

            {/* Fitur 7: Modal Detail Panduan & Prosedur Alur Pelayanan */}
            {activeAlurModal && (
              <div 
                className="fixed inset-0 z-50 flex flex-col items-center justify-center p-3 sm:p-6 bg-surface/60 backdrop-blur-sm overflow-hidden font-sans"
                onClick={() => setActiveAlurModal(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 25, filter: "blur(6px)" }}
                  animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.94, y: 20, filter: "blur(4px)" }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="w-full max-w-xl bg-white dark:bg-surface border border-slate-200 dark:border-white/10 rounded-3xl p-5 sm:p-8 shadow-2xl overflow-y-auto max-h-[85vh] flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header Modal Alur */}
                  <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shrink-0">
                        {activeAlurModal === 'pbg' ? (
                          <HardHat className="w-6 h-6" />
                        ) : activeAlurModal === 'mpp' ? (
                          <Building2 className="w-6 h-6" />
                        ) : (
                          <MapPin className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-sans">
                          {t("mppPortal.alur.modalTitle")}
                        </span>
                        <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-white font-sans">
                          {activeAlurModal === 'pbg' 
                            ? t("mppPortal.alur.pbgTitle") 
                            : activeAlurModal === 'mpp' 
                            ? t("mppPortal.alur.mppTitle") 
                            : t("mppPortal.alur.pkkprTitle")}
                        </h3>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveAlurModal(null)}
                      className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Konten Deskripsi & Langkah-Langkah */}
                  <div className="mt-5 space-y-5">
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                      {activeAlurModal === 'pbg' 
                        ? t("mppPortal.alur.pbg.desc") 
                        : activeAlurModal === 'mpp' 
                        ? t("mppPortal.alur.mpp.desc") 
                        : t("mppPortal.alur.pkkpr.desc")}
                    </p>

                    {/* Timeline Tahapan Alur */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3 flex items-center gap-1.5 font-sans">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                        Tahapan Prosedur ({activeAlurModal.toUpperCase()})
                      </h4>
                      <div className="space-y-2.5">
                        {((activeAlurModal === 'pbg' 
                          ? (t("mppPortal.alur.pbg.steps", { returnObjects: true }) as string[]) 
                          : activeAlurModal === 'mpp' 
                          ? (t("mppPortal.alur.mpp.steps", { returnObjects: true }) as string[]) 
                          : (t("mppPortal.alur.pkkpr.steps", { returnObjects: true }) as string[])) || []).map((stepText, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-white/5">
                            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 font-sans">
                              {idx + 1}
                            </span>
                            <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                              {stepText}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Info Tambahan: Estimasi Waktu & Berkas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 pt-2">
                      <div className="p-3 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block font-sans mb-1">
                          ⏱️ {t("mppPortal.alur.estTime")}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {activeAlurModal === 'pbg' 
                            ? t("mppPortal.alur.pbg.time") 
                            : activeAlurModal === 'mpp' 
                            ? t("mppPortal.alur.mpp.time") 
                            : t("mppPortal.alur.pkkpr.time")}
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-sky-500/5 dark:bg-sky-500/10 border border-sky-500/20">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 block font-sans mb-1">
                          📄 {t("mppPortal.alur.reqDocs")}
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {((activeAlurModal === 'pbg' 
                            ? (t("mppPortal.alur.pbg.docs", { returnObjects: true }) as string[]) 
                            : activeAlurModal === 'mpp' 
                            ? (t("mppPortal.alur.mpp.docs", { returnObjects: true }) as string[]) 
                            : (t("mppPortal.alur.pkkpr.docs", { returnObjects: true }) as string[])) || []).map((doc, dIdx) => (
                            <span key={dIdx} className="text-[10px] bg-white dark:bg-slate-800 px-4 py-0.5 rounded-md border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">
                              {doc}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Tombol Aksi Bawah */}
                    <div className="pt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveAlurModal(null)}
                        className="flex-1 min-h-[44px] py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold font-sans hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        {t("common.close") || "Tutup"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveAlurModal(null);
                          const el = document.getElementById('layanan');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="flex-1 min-h-[44px] py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs sm:text-sm font-semibold font-sans shadow-lg shadow-black/25 transition-all inline-flex items-center justify-center gap-1.5"
                      >
                        <span>{t("mppPortal.alur.onlinePortalBtn") || "Ambil Antrean Layanan"}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

          {/* Navigasi Denah Interaktif (Tab Denah 3D Gedung — Langsung tanpa pengulangan judul bertumpuk) */}
          {guideHubTab === 'denah' && (
          <div id="denah-interaktif" className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-8 sm:pb-14 scroll-mt-36 sm:scroll-mt-40">
            <div ref={floorPlanSectionRef} className="w-full scroll-mt-36 sm:scroll-mt-40">
              {(isFloorPlanInView || forceLoadFloorPlan || guideHubTab === 'denah' || Boolean(selectedFloorItem)) ? (
                <React.Suspense
                  fallback={
                    <div className="w-full h-[480px] sm:h-[620px] rounded-3xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-3 animate-pulse">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Memuat Denah Digital MPP Luwu...</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Mengoptimalkan akselerasi grafis...</p>
                    </div>
                  }
                >
                  <LazyInteractiveFloorPlan 
                    isDark={isDark} 
                    selectedId={selectedFloorItem?.id || selectedFloorItem?.code}
                    onSelectElement={(item) => {
                      setSelectedFloorItem(item);
                    }}
                    onOpenQueueBooking={(serviceName) => {
                      if (serviceName) setQueueForm(prev => ({ ...prev, service: serviceName }));
                      setIsQueueSubmitted(false);
                      setIsQueueBookingOpen(true);
                    }}
                  />
                </React.Suspense>
              ) : (
                <div className="w-full h-[480px] sm:h-[620px] rounded-3xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 flex items-center justify-center text-slate-400 mb-3">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Denah Interaktif MPP Luwu</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Akan dimuat otomatis saat mendekati tampilan</p>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Seksi Operational Status Banner, Heatmap Jam Ramai & SLA Radar (Tab Alur, Jam Ramai & SLA) */}
          {guideHubTab === 'alur' && (
            <>
              <div id="operasional-heatmap" className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 scroll-mt-36 sm:scroll-mt-40">
                <div id="peta-jam-ramai" className="scroll-mt-36 sm:scroll-mt-40">
                  <OperationalHeatmap isDark={isDark} />
                </div>
              </div>

              <MppMaklumatSlaRadar isDark={isDark} />
            </>
          )}

          {/* Seksi Pertanyaan Sering Diajukan (FAQ) Interaktif (Tab FAQ) */}
          {guideHubTab === 'faq' && (
            <div id="faq" className="w-full max-w-6xl mx-auto py-10 sm:py-16 md:py-20 px-2.5 sm:px-6 lg:px-8 font-sans scroll-mt-36 sm:scroll-mt-40">
              <FaqAccordion isDark={isDark} />
            </div>
          )}

          {/* Seksi Interaktif Fasilitas MPP (Master-Detail View & Mobile Drawer - Tab Fasilitas) */}
          {guideHubTab === 'fasilitas' && (
          <motion.section 
            id="fasilitas" 
            initial={{ opacity: 0, y: 40, scale: 0.96, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ type: "spring", stiffness: 75, damping: 20, mass: 0.9 }}
            className="w-full max-w-7xl mx-auto flex flex-col gap-6 lg:gap-8 scroll-mt-36 sm:scroll-mt-40 py-10 sm:py-16 md:py-24 px-2.5 sm:px-6 lg:px-8 relative before:bg-slate-50 dark:before:bg-[#0A2238] before:border-y before:border-transparent before:absolute before:inset-0 before:w-[200vw] before:left-1/2 before:-translate-x-1/2 before:-z-10"
          >
            {/* Header Seksi Terpusat — Standardized Zero-Pill Eyebrow + Typography */}
            <div className="w-full max-w-2xl mx-auto text-center px-4 flex flex-col items-center mb-8 sm:mb-12 break-words space-y-2">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex justify-center mb-1"
              >
                <span className={MPP_TYPOGRAPHY.eyebrow}>
                  {t('facilities.badge', 'SARANA & PRASARANA')}
                </span>
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`${MPP_TYPOGRAPHY.sectionTitle} text-center`}
              >
                {t('facilities.title', 'Fasilitas Publik Layanan Terpadu')}
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className={`${MPP_TYPOGRAPHY.sectionSubtitle} max-w-2xl mx-auto text-center`}
              >
                {t('facilities.subtitle', 'Ruang tunggu ramah anak, laktasi, aksesibilitas disabilitas, dan ketersediaan pojok baca digital di MPP Simpurusiang.')}
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="pt-2"
              >
                <Badge variant="status" tone="primary" pulse>
                  {facilitiesData.length} {t("mppPortal.fasilitas.activeCount")}
                </Badge>
              </motion.div>
            </div>

            {/* Versi Mobile (Di bawah md): Ikon fasilitas horizontal scroll dengan Peek Effect (85vw/w-[280px]) & Fade Gradient Masking */}
            <div className="md:hidden relative w-full overflow-hidden py-1">
              {/* Fade Gradient Masking - Left & Right */}
              <div className="pointer-events-none absolute top-0 left-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-slate-50 dark:from-[#0A2238] to-transparent z-20" />
              <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-slate-50 dark:from-[#0A2238] to-transparent z-20" />

              <motion.div 
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                className="overflow-x-auto snap-x snap-mandatory no-scrollbar flex gap-2.5 pb-2 px-4 touch-pan-x"
              >
                {(facilitiesData || [])?.map((fac) => {
                  const Icon = fac.icon;
                  const isActive = fac.id === activeFacilityId;
                  return (
                    <motion.button
                      variants={itemVariants}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      key={fac.id}
                      type="button"
                      onClick={() => {
                        setActiveFacilityId(fac.id);
                        setIsFacilityModalOpen(true);
                      }}
                      className={`w-auto min-w-[150px] max-w-[220px] shrink-0 snap-center min-h-[48px] px-3.5 py-2.5 rounded-2xl flex items-center gap-2.5 transition-all duration-300 backdrop-blur-xl cursor-pointer active:scale-95 ${
                        isActive
                          ? 'bg-emerald-500/15 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                          : 'bg-white/80 dark:bg-slate-800/40 border border-slate-100 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:border-emerald-500/40'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' : 'bg-surface/5 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <div className="font-bold text-xs sm:text-sm leading-tight text-slate-900 dark:text-white font-sans line-clamp-1">{fac.shortName}</div>
                        <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 line-clamp-1">{fac.tag}</div>
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            </div>

            {/* Layout Grid: Desktop Belah Layar (md:grid md:grid-cols-12 md:gap-6 lg:gap-8) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start w-full px-2 sm:px-5 md:px-8">
              {/* Sisi Kiri (Desktop Kolom 5): Grid 3 Kolom Tombol Ikon Kotak */}
              <div className="hidden md:block md:col-span-5">
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.1 }}
                  className="grid grid-cols-3 gap-6 lg:gap-8 sticky top-24"
                >
                  {(facilitiesData || [])?.map((fac) => {
                    const Icon = fac.icon;
                    const isActive = fac.id === activeFacilityId;
                    return (
                      <motion.button
                        variants={itemVariants}
                        whileHover={{ scale: 1.04, y: -3 }}
                        whileTap={{ scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        key={fac.id}
                        type="button"
                        onClick={() => {
                          setActiveFacilityId(fac.id);
                          setIsFacilityModalOpen(true);
                        }}
                        className={`aspect-square p-4 rounded-3xl flex flex-col items-center justify-center text-center transition-all duration-300 backdrop-blur-2xl group cursor-pointer shadow-lg shadow-black/25 dark:shadow-black/25 relative overflow-hidden ${
                          isActive
                            ? 'bg-emerald-500/15 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                            : 'bg-white/85 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-emerald-500/50 hover:shadow-xl hover:shadow-black/25'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 transition-transform duration-300 group-hover:scale-110 shadow-inner ${
                          isActive ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-400'
                        }`}>
                          <Icon className="w-5 h-5 stroke-[2.2]" />
                        </div>
                        <span className={`font-bold text-xs sm:text-sm leading-snug line-clamp-1 font-sans ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:text-white'}`}>
                          {fac.shortName}
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-medium">
                          {fac.tag}
                        </span>
                      </motion.button>
                    );
                  })}
                </motion.div>
              </div>

              {/* Sisi Kanan (Desktop Kolom 7 / Mobile Full Width): Kartu Detail Full-Bleed Modern */}
              <div className="col-span-12 md:col-span-7 w-full max-w-full">
                <motion.div
                  key={activeFacility.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className={`w-full ${MPP_CARD_SURFACE.layer1} ${MPP_CARD_SURFACE.radiusMain} overflow-hidden flex flex-col justify-between group hover:border-emerald-500/40 dark:hover:border-white/[0.14] active:scale-[0.98] transition-all duration-300`}
                >
                  {/* Foto Full-Bleed (Menempel Sisi Kiri, Atas, Kanan Card) */}
                  <div 
                    onClick={() => setIsFacilityLightboxOpen(true)}
                    className="relative w-full h-64 sm:h-72 md:h-80 lg:h-96 overflow-hidden bg-base cursor-pointer group/img"
                    title="Klik untuk melihat foto fasilitas dalam ukuran penuh"
                  >
                    <img
                      src={getImageUrl(activeFacility.image, 'facility')}
                      alt={activeFacility.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => handleImageError(e, 'facility')}
                      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />
                    
                    {/* Badge Tag Top Left — Standardized <Badge variant="overlay"> */}
                    <div className="absolute top-3 left-3">
                      <Badge variant="overlay" icon={<activeFacility.icon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}>
                        {activeFacility.tag}
                      </Badge>
                    </div>

                    {/* Button Foto Penuh Top Right */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFacilityLightboxOpen(true);
                      }}
                      className="absolute top-3 right-3 bg-base/75 backdrop-blur-md text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-900 transition cursor-pointer active:scale-95 border border-white/15 shadow-sm"
                      aria-label="Lihat foto fasilitas ukuran penuh"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Foto Penuh</span>
                    </button>

                    {/* Title Overlay Bottom Left / Right */}
                    <div className="absolute bottom-3 left-3 right-3 bg-base/75 backdrop-blur-md text-white p-2.5 rounded-xl border border-white/15">
                      <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{activeFacility.subtitle}</span>
                      </p>
                    </div>
                  </div>

                  {/* Konten Teks & Informasi di Bawah Foto — Standardized Padding (p-5 sm:p-6) & Typography */}
                  <div className={`${MPP_CARD_SURFACE.paddingLg} space-y-3 flex-1 flex flex-col justify-between`}>
                    <div>
                      <div className="mb-2">
                        <Badge variant="category" tone="primary">
                          MPP Simpurusiang Kab. Luwu
                        </Badge>
                      </div>
                      
                      <h3 className={MPP_TYPOGRAPHY.cardTitle}>
                        {activeFacility.name}
                      </h3>

                      <p className={`${MPP_TYPOGRAPHY.cardBody} mt-2`}>
                        {activeFacility.description}
                      </p>
                    </div>

                    {/* Kelengkapan & Sarana Pendukung */}
                    <div className="pt-3 border-t border-slate-200/80 dark:border-white/[0.07]">
                      <h4 className="text-xs uppercase tracking-widest text-slate-700 dark:text-slate-300 font-bold mb-2.5 flex items-center gap-1.5 font-sans">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        {t("mppPortal.fasilitas.specsTitle")}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(activeFacility?.features || [])?.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 text-left font-medium">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className="break-words">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.section>
          )}

            {/* Fitur 5: Modal Detail Fasilitas Publik (Full-Bleed 16:9 Header & max-w-3xl) */}
            {isFacilityModalOpen && (
              <div 
                className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-surface/60 backdrop-blur-sm overflow-y-auto font-sans"
                onClick={() => setIsFacilityModalOpen(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                  className="w-full max-w-3xl mx-auto my-auto max-h-[92dvh] sm:max-h-[88vh] bg-white dark:bg-surface rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Foto Full-Bleed Header (Ditinggikan untuk Tampilan Android & Mobile Responsif) */}
                  <div 
                    onClick={() => setIsFacilityLightboxOpen(true)}
                    className="relative w-full overflow-hidden rounded-t-2xl sm:rounded-t-3xl h-72 xs:h-80 sm:h-88 md:h-96 bg-base cursor-pointer group/modalimg shrink-0"
                    title="Klik untuk melihat foto fasilitas dalam ukuran penuh"
                  >
                    <img
                      src={getImageUrl(activeFacility.image, 'facility')}
                      alt={activeFacility.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => handleImageError(e, 'facility')}
                      className="w-full h-full object-cover object-center group-hover/modalimg:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/30 pointer-events-none" />
                    
                    {/* Badge Kategori Top Left */}
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md text-emerald-300 text-xs font-black shadow-lg border border-white/20">
                      <activeFacility.icon className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                      <span>{activeFacility.tag}</span>
                    </div>

                    {/* Tombol Perbesar Foto Top Right & Tombol Close (X) */}
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsFacilityLightboxOpen(true);
                        }}
                        className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md text-white text-xs font-bold shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all border border-slate-700/80"
                        aria-label="Lihat foto fasilitas ukuran penuh"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Foto Penuh</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsFacilityModalOpen(false);
                        }}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900/90 hover:bg-rose-600 text-white shadow-lg cursor-pointer active:scale-95 transition-all border border-slate-700/80"
                        aria-label={t("common.close", "Tutup")}
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>

                    {/* Tag Lokasi Overlay Bottom Left / Right */}
                    <div className="absolute bottom-3 left-3 right-3 z-10 bg-slate-950/85 backdrop-blur-md text-white p-3 rounded-2xl border border-white/20 shadow-lg">
                      <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{activeFacility.subtitle}</span>
                      </p>
                    </div>
                  </div>

                  {/* Konten Teks & Informasi di Bawah Foto (Baru Diberi Padding) */}
                  <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                    <div>
                      <span className="inline-block px-3 py-1 bg-emerald-500/15 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-black rounded-xl border border-emerald-500/30 tracking-wide uppercase mb-2 font-mono shadow-2xs">
                        MPP Simpurusiang Kab. Luwu
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                        {activeFacility.name}
                      </h3>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mt-2.5 font-medium">
                        {activeFacility.description}
                      </p>
                    </div>

                    {/* Kelengkapan Standar & Sarana */}
                    <div className="pt-3.5 border-t border-slate-200 dark:border-slate-800">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        {t("mppPortal.fasilitas.specsTitle")}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {(activeFacility?.features || [])?.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 bg-slate-100/90 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 font-semibold shadow-2xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="font-semibold leading-snug">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer Action Button */}
                  <div className="p-3.5 sm:p-4 bg-slate-100/90 dark:bg-surface/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFacilityModalOpen(false);
                      }}
                      className="w-full sm:w-auto min-w-[150px] py-3 px-6 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black rounded-2xl transition-all text-center text-xs sm:text-sm shadow-md shadow-emerald-950/20 cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                    >
                      <span>Tutup Detail Fasilitas</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Modal Lightbox Foto Ukuran Penuh (Full-Screen Photo Inspector) */}
            {isFacilityLightboxOpen && (
              <div 
                className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-md"
                onClick={() => setIsFacilityLightboxOpen(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="relative max-w-4xl w-full max-h-[92vh] flex flex-col bg-slate-900 rounded-3xl overflow-hidden border border-white/15 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Top Bar Lightbox */}
                  <div className="px-4 py-3 bg-base/80 border-b border-white/10 flex items-center justify-between gap-3 z-10">
                    <div className="flex items-center gap-2 min-w-0">
                      <activeFacility.icon className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate font-sans">{activeFacility.name}</h4>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{activeFacility.subtitle}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsFacilityLightboxOpen(false)}
                      className="min-h-[44px] min-w-[44px] px-3 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-1 text-xs font-medium cursor-pointer active:scale-95 transition-all"
                      aria-label="Tutup foto penuh"
                    >
                      <X className="w-5 h-5" />
                      <span className="hidden sm:inline">Tutup</span>
                    </button>
                  </div>

                  {/* Foto Utama Penuh */}
                  <div className="relative flex-1 min-h-[280px] sm:min-h-[420px] max-h-[70vh] bg-black flex items-center justify-center p-1 sm:p-2 overflow-hidden">
                    <img
                      src={getImageUrl(activeFacility.image, 'facility')}
                      alt={activeFacility.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => handleImageError(e, 'facility')}
                      className="w-full h-full max-h-[68vh] object-contain rounded-xl"
                    />
                  </div>

                  {/* Bottom Caption Bar */}
                  <div className="px-4 py-3 bg-base/90 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                    <span className="text-[11px] font-mono text-emerald-400">
                      {activeFacility.tag} • MPP Simpurusiang Kab. Luwu
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsFacilityLightboxOpen(false)}
                      className="text-xs text-emerald-400 hover:underline font-semibold"
                    >
                      Kembali ke Detail Fasilitas
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

          {/* Ringkasan 3 Indikator Kinerja Utama Real-Time (Tabular Numerals & Royal Luwu Hairline) */}
          <motion.section 
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.35, ease: "easeOut" }} 
            viewport={{ once: true, amount: 0.1 }} 
            className="w-full max-w-6xl mx-auto pt-8 sm:pt-12 pb-4 sm:pb-6 px-2.5 sm:px-6 lg:px-8"
          >
            <SpotlightCard 
              spotlightColor={isDark ? "rgba(201, 162, 75, 0.14)" : "rgba(15, 107, 79, 0.08)"}
              className="w-full bg-white dark:bg-[#0B2035] shadow-[0_14px_34px_-14px_rgba(24,24,27,0.08)] dark:shadow-[0_18px_42px_-16px_rgba(0,0,0,0.55)] border border-[#E2DACB] dark:border-[#C9A24B]/22 rounded-3xl p-4 sm:p-6 md:p-8 relative overflow-hidden transition-all duration-300"
            >
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A24B]/70 to-transparent" />
              <div className="grid grid-cols-3 gap-1.5 sm:gap-6 lg:gap-8 relative z-10 text-center items-center">
                <div className="flex flex-col items-center justify-center gap-1 sm:gap-2 py-1.5">
                  <span className="text-2xl xs:text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-[#0F6B4F] dark:text-emerald-300 tracking-tight">
                    <StatCounter target={Number(skmScoreAverage) || 0} isDecimal={true} />
                  </span>
                  <span className="font-sans text-[10px] xs:text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 leading-tight uppercase tracking-wider font-bold line-clamp-2">
                    {t("mppPortal.stats.ikm")}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center gap-1 sm:gap-2 border-x border-[#E5DFD3] dark:border-white/10 py-1.5 px-1">
                  <span className="text-2xl xs:text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-[#855A14] dark:text-[#E2C475] tracking-tight">
                    <StatCounter target={liveAgencies.length} />
                  </span>
                  <span className="font-sans text-[10px] xs:text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 leading-tight uppercase tracking-wider font-bold line-clamp-2">
                    {t("mppPortal.stats.agencies")}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center gap-1 sm:gap-2 py-1.5">
                  <span className="text-2xl xs:text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-sky-300 tracking-tight">
                    <StatCounter target={queueMetrics.totalVisitors} />
                  </span>
                  <span className="font-sans text-[10px] xs:text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 leading-tight uppercase tracking-wider font-bold line-clamp-2">
                    {t("mppPortal.stats.visitors")}
                  </span>
                </div>
              </div>
            </SpotlightCard>
          </motion.section>

          {/* --- PROGRESSIVE DISCLOSURE HUB 2: TRANSPARANSI PUBLIK, STATISTIK, BERITA & KEMITRAAN --- */}
          <div id="transparansi-publik-hub" className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-2 scroll-mt-36 sm:scroll-mt-40">
            <div className="flex flex-col items-center text-center mb-5 sm:mb-6">
              <span className={`${MPP_TYPOGRAPHY.eyebrow} mb-1.5`}>
                Akuntabilitas &amp; Informasi Publik
              </span>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans text-balance">
                Transparansi Kinerja, Berita &amp;{" "}
                <span className="font-serif-display italic font-semibold text-[#0F6B4F] dark:text-[#E2C475]">
                  Kemitraan Daerah
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300/90 max-w-2xl mt-1.5 leading-relaxed">
                Pilih kategori informasi di bawah ini agar halaman tetap ringkas, cepat dimuat, dan fokus pada kebutuhan Anda.
              </p>
              <div className="gold-divider-diamond" aria-hidden="true">
                <span className="gold-diamond-icon" />
              </div>
            </div>

            <div className="flex items-center justify-start sm:justify-center overflow-x-auto no-scrollbar gap-1.5 p-1.5 rounded-2xl bg-[#EFECE3] dark:bg-[#0B2035] border border-[#DFD8C8] dark:border-white/[0.08] max-w-4xl mx-auto">
              {[
                { id: 'skm' as const, label: 'Survei SKM & Ulasan', icon: Star },
                { id: 'statistik' as const, label: 'Statistik Kunjungan', icon: BarChart3 },
                { id: 'berita' as const, label: 'Berita & Pengumuman', icon: Newspaper },
                { id: 'kemitraan' as const, label: 'Desk Investor & UMKM', icon: Briefcase },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = transparencyHubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTransparencyHubTab(tab.id)}
                    className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-sans flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-[#0F6B4F] dark:bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <TabIcon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {transparencyHubTab === 'kemitraan' && (
            <>
              <div id="investor-vip" className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 scroll-mt-36 sm:scroll-mt-40">
                <VipInvestorConcierge isDark={isDark} />
              </div>

          {/* Seksi Katalog Kemitraan UMKM Luwu */}
          <motion.section
            id="umkm"
            initial={{ opacity: 0, y: 40, scale: 0.96, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ type: "spring", stiffness: 75, damping: 20, mass: 0.9 }}
            className="w-full max-w-6xl mx-auto flex flex-col scroll-mt-36 sm:scroll-mt-40 py-10 sm:py-14 px-2.5 sm:px-6 lg:px-8 relative"
          >
            {/* Header Seksi — Standardized Zero-Pill Eyebrow + Typography */}
            <div className="w-full max-w-2xl mx-auto text-center px-4 flex flex-col items-center mb-6 sm:mb-10 space-y-2">
              <span className={`${MPP_TYPOGRAPHY.eyebrow} inline-flex items-center gap-1.5`}>
                <Store className="w-3.5 h-3.5 shrink-0" />
                {t("umkm_catalog", "Katalog Kemitraan UMKM")}
              </span>
              <h2 className={`${MPP_TYPOGRAPHY.sectionTitle} text-center`}>
                Galeri & Kemitraan{" "}
                <span className="text-emerald-700 dark:text-emerald-400">
                  UMKM Unggulan
                </span>
              </h2>
              <p className={`${MPP_TYPOGRAPHY.sectionSubtitle} max-w-2xl mx-auto text-center`}>
                {t("umkm_catalog_desc", "Pusat promosi dan kemitraan produk UMKM binaan Pemkab Luwu terverifikasi legalitas NIB, Halal, dan P-IRT.")}
              </p>
            </div>

            {/* Filter Pills with smooth horizontal scrolling & 44px touch targets */}
            <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-3 mb-6 sm:mb-8 scrollbar-none snap-x px-2">
              {['Semua', 'Kuliner', 'Kriya/Kerajinan'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveUmkmFilter(cat)}
                  className={`px-4 py-2.5 min-h-[44px] rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 backdrop-blur-xl border font-sans cursor-pointer whitespace-nowrap snap-center active:scale-95 shrink-0 ${
                    activeUmkmFilter === cat
                      ? "bg-emerald-600 text-white border-emerald-400/40 shadow-lg shadow-black/25 ring-2 ring-emerald-500/20"
                      : "bg-white/80 dark:bg-surface/60 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/80"
                  }`}
                >
                  {cat === "Semua" ? (isZh ? "全部" : isEn ? "All" : "Semua") : cat === "Kuliner" ? (isZh ? "烹饪美食" : isEn ? "Culinary" : "Kuliner") : (isZh ? "手工艺品" : isEn ? "Crafts" : "Kriya/Kerajinan")}
                </button>
              ))}
            </div>

            {/* Strip 4 Produk Unggulan UMKM — Clean Responsive 4-Column Grid */}
            <div className="w-full">
              {filteredUmkmProducts.length === 0 ? (
                <div className="w-full py-12 text-center text-xs text-slate-500 font-sans italic bg-slate-50/50 dark:bg-surface/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                  {t("portal.noUmkmData", "Belum ada data produk UMKM binaan yang terdaftar di portal. Data akan ditampilkan secara otomatis ketika terhubung dengan database UMKM.")}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {filteredUmkmProducts.slice(0, 4).map((product, idx) => (
                    <motion.div
                      key={product.id || idx}
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.1 }}
                      transition={{ duration: 0.4, delay: idx * 0.08 }}
                      className={`flex flex-col group ${MPP_CARD_SURFACE.radiusMain} ${MPP_CARD_SURFACE.layer1} border transition-all duration-300 overflow-hidden cursor-pointer relative hover:border-emerald-500/40 dark:hover:border-white/[0.14] hover:-translate-y-1 shadow-sm`}
                      onClick={() => setSelectedUMKM(product)}
                    >
                      {/* Foto Produk dengan 1 Badge Tunggal di Kiri Atas */}
                      <div className="relative h-52 sm:h-56 overflow-hidden bg-base">
                        <img
                          src={getImageUrl(product.image, 'umkm')}
                          alt={product.nama_produk}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          referrerPolicy="no-referrer"
                          onError={(e) => handleImageError(e, 'umkm')}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />
                        
                        {/* 1 Badge Tunggal Per Kartu */}
                        <div className="absolute top-3 left-3 z-10">
                          <Badge variant="overlay">
                            {product.kategori || "UMKM Binaan"}
                          </Badge>
                        </div>

                        {/* Label Harga di Bawah Foto */}
                        <div className="absolute bottom-2.5 left-3 z-10">
                          <span className="text-xs font-mono font-extrabold text-emerald-300 bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/10">
                            {product.harga}
                          </span>
                        </div>
                      </div>

                      {/* Info Produk */}
                      <div className="p-4 flex flex-col flex-grow text-left">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {product.nama_produk}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2">
                          <User className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{product.nama_pemilik}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                          {product.deskripsi || "Produk kemitraan binaan resmi Pemkab Luwu."}
                        </p>

                        {/* Tombol Aksi Bawah */}
                        <div className="mt-auto grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUMKM(product);
                            }}
                            className="flex items-center justify-center gap-1 py-2 px-2.5 min-h-[40px] rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 transition-all cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
                          >
                            <Search className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </button>
                          <a
                            href={`https://wa.me/${product.no_wa}?text=Halo,%20saya%20tertarik%20dengan%20produk%20UMKM%20${encodeURIComponent(product.nama_produk)}%20di%20Portal%20MPP%20Luwu...`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-center gap-1 py-2 px-2.5 min-h-[40px] rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Pesan WA</span>
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Tautan ke Katalog UMKM Lengkap */}
              <div className="flex justify-center mt-8">
                <MagneticButton
                  onClick={() => {
                    setActiveUmkmFilter("Semua");
                    if (filteredUmkmProducts.length > 0) setSelectedUMKM(filteredUmkmProducts[0]);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 text-xs font-bold transition-all shadow-sm border border-slate-200/80 dark:border-white/10"
                >
                  <Store className="w-4 h-4 text-emerald-500" />
                  <span>Lihat Semua Produk di Galeri UMKM Luwu</span>
                  <ChevronRight className="w-4 h-4" />
                </MagneticButton>
              </div>
            </div>
          </motion.section>
            </>
          )}

          {/* Modal Detail UMKM */}
          <AnimatePresence>
            {selectedUMKM && (
              <div 
                className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 bg-surface/60 backdrop-blur-sm overflow-y-auto font-sans"
                onClick={() => setSelectedUMKM(null)}
              >
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 30, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  className="relative w-full max-w-md bg-white dark:bg-surface rounded-2xl md:rounded-3xl flex flex-col overflow-hidden shadow-xl transition-all border border-slate-200/80 dark:border-slate-800 max-h-[90dvh] md:max-h-[85dvh]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Hero Image Full-Bleed & Overlay Controls */}
                  <div className="relative w-full h-64 sm:h-72 shrink-0 bg-base overflow-hidden">
                    {/* Floating Close Button (X) */}
                    <button
                      type="button"
                      onClick={() => setSelectedUMKM(null)}
                      className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center bg-surface/60 text-white hover:bg-slate-900 rounded-full backdrop-blur-md transition-all cursor-pointer"
                      aria-label="Tutup detail produk"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    {/* Product Image */}
                    <img
                      src={getImageUrl(selectedUMKM.image, 'umkm')}
                      alt={selectedUMKM.nama_produk}
                      referrerPolicy="no-referrer"
                      onError={(e) => handleImageError(e, 'umkm')}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/30 pointer-events-none" />

                    {/* Floating Badges (Kiri Bawah Gambar) */}
                    <div className="absolute bottom-3 left-3 z-10 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 font-mono">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      <span>{selectedUMKM.status_izin || "NIB Terdaftar / Kemitraan MPP"}</span>
                    </div>
                  </div>

                  {/* Scrollable Content & Data Fallback */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 text-slate-900 dark:text-slate-100 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                    <div>
                      <span className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider font-mono">
                        {selectedUMKM.kategori || selectedUMKM.category || "PRODUK KEMITRAAN UMKM"}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight font-sans text-slate-900 dark:text-white mt-1 leading-snug">
                        {isZh ? (selectedUMKM.nama_produk_zh || selectedUMKM.nama_produk) : isEn ? (selectedUMKM.nama_produk_en || selectedUMKM.nama_produk) : selectedUMKM.nama_produk}
                      </h3>
                      {selectedUMKM.harga && (
                        <div className="mt-2 text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          {selectedUMKM.harga}
                        </div>
                      )}
                    </div>

                    {/* Kartu Informasi Detail (Mini Cards) */}
                    <div className="grid grid-cols-1 gap-2.5 pt-2">
                      {/* Pemilik / Produsen */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">{t("mppPortal.umkm.owner", "Pemilik / Produsen")}</span>
                          <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white break-words">{selectedUMKM.nama_pemilik || "Pelaku Usaha Luwu"}</span>
                        </div>
                      </div>

                      {/* Lokasi Usaha */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">{t("mppPortal.umkm.location", "Lokasi Usaha")}</span>
                          <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white break-words">
                            {(isZh ? (selectedUMKM.alamat_zh || selectedUMKM.alamat) : isEn ? (selectedUMKM.alamat_en || selectedUMKM.alamat) : selectedUMKM.alamat) || "Kabupaten Luwu"}
                          </span>
                        </div>
                      </div>

                      {/* Komposisi / Bahan Utama */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Package className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">{t("mppPortal.umkm.composition", "Komposisi / Bahan Utama")}</span>
                          <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white break-words">
                            {(isZh ? (selectedUMKM.bahan_zh || selectedUMKM.bahan) : isEn ? (selectedUMKM.bahan_en || selectedUMKM.bahan) : selectedUMKM.bahan) || "Olahan Pangan Lokal Standar Olahan MPP"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sticky Action Footer */}
                  <div className="sticky bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-surface/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center gap-3 shrink-0 z-20">
                    <button
                      type="button"
                      onClick={() => handleShareUMKM(selectedUMKM)}
                      className="w-1/3 py-3 border border-slate-300 dark:border-slate-700 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs sm:text-sm text-slate-800 dark:text-slate-200 cursor-pointer active:scale-95"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>{t("mppPortal.umkm.share", "Bagikan")}</span>
                    </button>
                    <a
                      href={`https://wa.me/${selectedUMKM.no_wa || "62811420123"}?text=Halo,%20saya%20tertarik%20dengan%20produk%20UMKM%20${encodeURIComponent(selectedUMKM.nama_produk || "Luwu")}%20di%20Portal%20MPP%20Luwu...`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-2/3 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all text-xs sm:text-sm cursor-pointer active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{t("mppPortal.umkm.contactWa", "Hubungi Pemilik (WA)")}</span>
                    </a>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Seksi Statistik Pengunjung */}
          {transparencyHubTab === 'statistik' && (
          <motion.section
            id="statistik"
            initial={{ opacity: 0, y: 40, scale: 0.96, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ type: "spring", stiffness: 75, damping: 20, mass: 0.9 }}
            className="w-full max-w-6xl mx-auto flex flex-col scroll-mt-36 sm:scroll-mt-40 py-10 sm:py-14 px-2.5 sm:px-6 lg:px-8 relative before:bg-slate-100 dark:before:bg-[#0F2D4A] before:border-y before:border-transparent before:absolute before:inset-0 before:w-[200vw] before:left-1/2 before:-translate-x-1/2 before:-z-10"
          >
            {/* Header Seksi Terpusat — Standardized Zero-Pill Eyebrow + Typography */}
            <div className="w-full max-w-2xl mx-auto text-center px-4 flex flex-col items-center mb-6 sm:mb-10 break-words">
              <span className={`${MPP_TYPOGRAPHY.eyebrow} mb-2 inline-block text-center`}>
                {t("mppPortal.statistik.badge")}
              </span>
              <h2 className={MPP_TYPOGRAPHY.sectionTitle}>
                {t("mppPortal.statistik.title")}
              </h2>
              <p className={`${MPP_TYPOGRAPHY.sectionSubtitle} max-w-2xl mx-auto mt-1.5 mb-3 text-center`}>
                {t("mppPortal.statistik.subtitle")}
              </p>
            </div>

            {queueMetrics.totalVisitors === 0 ? (
              <div className="w-full max-w-xl mx-auto my-8 p-8 rounded-3xl text-center bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
                <BarChart3 className="w-10 h-10 text-emerald-500/70 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 font-sans">
                  Data tampil setelah peluncuran
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                  Metrik volume antrean dan distribusi jam operasional akan terisi otomatis secara real-time dari sistem antrean loket MPP Simpurusiang.
                </p>
              </div>
            ) : (
              <>
                {/* Tata Letak 4 Kartu Statistik — Standardized Small Card (rounded-2xl, Layer 1 #0F2D4A) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 max-w-6xl mx-auto mt-8 sm:mt-12 w-full">
              {(statistikCards || [])?.map((stat, idx) => {
                const IconComp = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25, delay: idx * 0.05 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className={`w-full min-h-[115px] sm:min-h-[160px] ${MPP_CARD_SURFACE.layer1} ${MPP_CARD_SURFACE.radiusMain} relative pt-7 sm:pt-10 pb-4 sm:pb-5 px-4 text-center hover:border-emerald-500/40 dark:hover:border-white/[0.14] transition-all duration-300 group flex flex-col justify-between items-center`}
                  >
                    {/* Ikon Melayang — Layer 2 (#143755) */}
                    <div className="absolute -top-4 sm:-top-6 left-1/2 -translate-x-1/2 bg-emerald-50 dark:bg-[#143755] text-emerald-600 dark:text-emerald-400 shadow-sm border-2 sm:border-4 border-white dark:border-[#0A2238] rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 z-10">
                      <IconComp className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2.2]" />
                    </div>

                    {/* Isi Teks */}
                    <div className="text-xs text-slate-600 dark:text-slate-300 leading-tight font-medium min-h-[28px] sm:min-h-[34px] flex items-center justify-center font-sans mt-0.5 line-clamp-2">
                      {stat.label}
                    </div>

                    {/* Angka Warna Emerald & Font Monospace Tegas */}
                    <div className="text-2xl sm:text-3xl md:text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight mt-1">
                      {typeof stat.numValue === 'number' ? (
                        <CountUpNumber end={stat.numValue} formatter={formatMetricVal} />
                      ) : (
                        stat.value
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Wadah Grafik (Chart Area) — Standardized Main Card (rounded-2xl, p-5 sm:p-6, Layer 1 #0F2D4A) */}
            <div className="max-w-6xl mx-auto mt-6 sm:mt-10 w-full">
              <div className={`w-full ${MPP_CARD_SURFACE.layer1} ${MPP_CARD_SURFACE.radiusMain} ${MPP_CARD_SURFACE.paddingLg} flex flex-col`}>
                {/* Header & Filter Tab */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
                  <div>
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-white font-sans text-left">
                      {t("mppPortal.statistik.chartTitle")}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 text-left font-normal">
                      {t("mppPortal.statistik.chartSubtitle")}
                    </p>
                  </div>

                  {/* Filter Tab (min 44px touch target on mobile) */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200/80 dark:border-white/10 self-start sm:self-auto shadow-inner">
                    {(['harian', 'mingguan', 'bulanan'] as const).map((tab) => {
                      const label = tab === 'harian' ? t("mppPortal.statistik.harian") : tab === 'mingguan' ? t("mppPortal.statistik.mingguan") : t("mppPortal.statistik.bulanan");
                      const isActive = activeStatTab === tab;
                      return (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setActiveStatTab(tab)}
                          className={`min-h-[44px] px-3.5 sm:px-5 py-2 text-xs font-bold tracking-wide rounded-lg transition-all duration-200 cursor-pointer font-sans active:scale-95 ${
                            isActive
                              ? 'bg-emerald-600 text-white shadow-md shadow-black/25'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Area Grafik Batang Vertikal h-64 sm:h-80 */}
                <div ref={chartSectionRef} className="relative w-full h-64 sm:h-80 flex flex-col justify-end pt-4 pb-2">
                  {/* Garis Grid Horizontal Latar */}
                  <div className="absolute inset-x-0 inset-y-4 flex flex-col justify-between pointer-events-none opacity-10">
                    <div className="border-b border-slate-500 w-full" />
                    <div className="border-b border-slate-500 w-full" />
                    <div className="border-b border-slate-500 w-full" />
                    <div className="border-b border-slate-500 w-full" />
                  </div>

                  {/* Batang-batang Vertikal Terkoneksi Real-Time mpp_queues */}
                  <div className="flex-1 flex items-end justify-between gap-2 sm:gap-3 md:gap-4 z-10">
                    {(() => {
                      const currentData = activeStatTab === 'harian'
                        ? queueMetrics.hourlyDistribution
                        : activeStatTab === 'mingguan'
                        ? queueMetrics.dailyDistribution
                        : queueMetrics.monthlyDistribution;
                      
                      const maxVal = Math.max(...currentData, 1);

                      return currentData.map((count, i) => {
                        const barPercent = count > 0 ? Math.min(Math.max((count / maxVal) * 88, 14), 95) : 4;

                        return (
                          <div key={i} className="w-full relative group h-full flex flex-col justify-end items-center">
                            <motion.div
                              initial={false}
                              animate={{ scaleY: 1, opacity: 1 }}
                              className={`w-full rounded-t-lg transition-colors cursor-pointer shadow-sm relative ${
                                count > 0
                                  ? 'bg-emerald-500 hover:bg-emerald-400'
                                  : 'bg-slate-300 dark:bg-slate-700/80 hover:bg-slate-400 dark:hover:bg-slate-600'
                              }`}
                              style={{ height: `${barPercent}%`, minHeight: '8px', transformOrigin: 'bottom' }}
                            >
                              {/* Tooltip on Hover */}
                              <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold px-3 py-0.5 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                                {count.toLocaleString('id-ID')} {t("mppPortal.stats.queueUnit", "Antrean")}
                              </div>
                            </motion.div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Label Sumbu Bawah */}
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-200/80 dark:border-white/10 text-[10px] sm:text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
                    {activeStatTab === 'harian' ? (
                      <>
                        <span>08:00</span>
                        <span>10:00</span>
                        <span>12:00</span>
                        <span>14:00</span>
                        <span>15:30</span>
                      </>
                    ) : activeStatTab === 'mingguan' ? (
                      <>
                        <span>{t("mppPortal.stats.time.mon")}</span>
                        <span>{t("mppPortal.stats.time.tue")}</span>
                        <span>{t("mppPortal.stats.time.wed")}</span>
                        <span>{t("mppPortal.stats.time.thu")}</span>
                        <span>{t("mppPortal.stats.time.fri")}</span>
                      </>
                    ) : (
                      <>
                        <span>{t("mppPortal.stats.time.jan")}</span>
                        <span>{t("mppPortal.stats.time.mar")}</span>
                        <span>{t("mppPortal.stats.time.may")}</span>
                        <span>{t("mppPortal.stats.time.jul")}</span>
                        <span>{t("mppPortal.stats.time.sep")}</span>
                        <span>{t("mppPortal.stats.time.dec")}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tombol Aksi Bawah */}
            <div className="flex justify-center mt-8 md:mt-10">
              <button
                type="button"
                onClick={() => setIsAnalyticsModalOpen(true)}
                className="min-h-[48px] h-12 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-full px-8 text-xs sm:text-sm font-bold tracking-wide transition-all shadow-lg shadow-black/25 hover:shadow-black/25 cursor-pointer font-sans inline-flex items-center justify-center gap-2 active:scale-95"
              >
                <BarChart3 className="w-4 h-4 text-emerald-100" />
                <span>{t("mppPortal.statistik.fullReportBtn")}</span>
              </button>
            </div>
              </>
            )}
          </motion.section>
          )}

          {/* Seksi Survey Kepuasan Masyarakat & Ulasan Warga */}
          {transparencyHubTab === 'skm' && (
            <>
              <motion.section
                id="survey"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.35 }}
                className="w-full max-w-7xl mx-auto flex flex-col scroll-mt-36 sm:scroll-mt-40 pt-4 sm:pt-6 pb-8 sm:pb-12 px-2.5 sm:px-6 lg:px-8 relative"
              >
                <SkmBentoGrid
                  skmIndicators={skmIndicators}
                  averageSkm={averageSkm}
                  totalRespondents={skmTotalRespondents}
                  highlights={skmHighlights}
                  predikat={skmTotalRespondents > 0 ? (Number(averageSkm) >= 88.31 ? 'Sangat Baik (A)' : Number(averageSkm) >= 76.61 ? 'Baik (B)' : Number(averageSkm) >= 65 ? 'Kurang Baik (C)' : 'Tidak Baik (D)') : 'Belum Ada Responden'}
                  onOpenSurveyModal={() => {
                    setIsSurveySubmitted(false);
                    setIsSurveyModalOpen(true);
                  }}
                  isDark={isDark}
                />
              </motion.section>

              <motion.section 
                id="ulasan-masyarakat"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.35 }}
                className={`relative overflow-hidden w-full py-10 sm:py-14 px-2.5 sm:px-6 lg:px-8 transition-colors duration-300 border-y ${
                  isDark ? 'bg-[#081A2C] border-white/[0.07] text-white' : 'bg-[#F4F0E6] border-[#E5DFD3] text-slate-900'
                }`}
              >
                <div className="relative z-10 max-w-2xl mx-auto px-4 text-center mb-6 sm:mb-8 flex flex-col items-center space-y-2">
                  <span className={`${MPP_TYPOGRAPHY.eyebrow} inline-flex items-center gap-2`}>
                    <span aria-hidden="true" className="w-1.5 h-1.5 rotate-45 bg-[#C9A24B]" />
                    <span>{t("sections.review_badge", t("mppPortal.ulasan.badge", "Testimoni Warga"))}</span>
                    <span aria-hidden="true" className="w-1.5 h-1.5 rotate-45 bg-[#C9A24B]" />
                  </span>
                  <h2 className={`${MPP_TYPOGRAPHY.sectionTitle} text-center`}>
                    {t("sections.review_title", "Ulasan Masyarakat MPP Simpurusiang")}
                  </h2>
                  <p className={`${MPP_TYPOGRAPHY.sectionSubtitle} max-w-2xl mx-auto text-center`}>
                    {t("sections.review_subtitle", t("mppPortal.ulasan.subtitle", "Pengalaman langsung dan ulasan jujur masyarakat terhadap pelayanan di MPP Simpurusiang Kabupaten Luwu."))}
                  </p>
                </div>

                <div className="relative w-full max-w-7xl mx-auto z-10 py-1">
                  {isReviewsLoading ? (
                    <div className="w-full py-10 flex flex-col items-center justify-center text-center">
                      <div className="w-7 h-7 border-2 border-[#0F6B4F] border-t-transparent rounded-full animate-spin mb-2.5" />
                      <span className={`text-xs font-sans ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t("mppPortal.ulasan.loading", "Memuat ulasan masyarakat terverifikasi...")}</span>
                    </div>
                  ) : communityReviews.length === 0 ? (
                    <div className={`w-full max-w-xl mx-auto py-8 sm:py-10 px-4 sm:px-6 rounded-2xl sm:rounded-3xl border text-center flex flex-col items-center transition-all ${
                      isDark ? 'bg-[#0C2135] border-white/10 text-white' : 'bg-white border-[#E5DFD3] text-slate-900 shadow-xs'
                    }`}>
                      <div className="w-11 h-11 rounded-full bg-[#0F6B4F]/10 text-[#0F6B4F] dark:text-emerald-400 flex items-center justify-center mb-2.5">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <h4 className={`text-sm sm:text-base font-bold font-sans mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {t("mppPortal.ulasan.emptyTitle", "Belum Ada Ulasan Masuk")}
                      </h4>
                      <p className={`text-xs font-normal max-w-md leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                        {t("mppPortal.ulasan.emptyDesc", "Ulasan dan aspirasi masyarakat akan ditampilkan secara otomatis setelah warga mengisi survei kepuasan layanan di loket MPP Simpurusiang.")}
                      </p>
                    </div>
                  ) : communityReviews.length === 1 ? (
                    /* Featured Editorial Testimonial Card when exactly 1 verified review exists (Zero empty space imbalance) */
                    <div className="w-full max-w-2xl mx-auto">
                      {communityReviews.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className={`${MPP_CARD_SURFACE.default} p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden`}
                        >
                          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A24B] to-transparent" />
                          <div className="flex items-center gap-1 mb-3">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < (item.rating || 5)
                                    ? 'fill-[#C9A24B] text-[#C9A24B]'
                                    : 'text-slate-300 dark:text-slate-600'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-base sm:text-lg font-serif-display italic text-slate-800 dark:text-slate-100 leading-relaxed max-w-xl my-2">
                            “{item.teks}”
                          </p>
                          <div className="mt-4 pt-4 border-t border-[#E5DFD3] dark:border-white/[0.08] flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs">
                            <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                              {item.nama}
                            </span>
                            <span aria-hidden="true" className="text-[#C9A24B]">·</span>
                            <span className="font-semibold text-[#0F6B4F] dark:text-emerald-400">
                              {item.layanan}
                            </span>
                            {item.tanggal && (
                              <>
                                <span aria-hidden="true" className="text-slate-400">·</span>
                                <span className="text-slate-500 dark:text-slate-400">{item.tanggal}</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div 
                      ref={ulasanSliderRef}
                      onMouseEnter={() => setIsUlasanPaused(true)}
                      onMouseLeave={() => setIsUlasanPaused(false)}
                      onTouchStart={() => setIsUlasanPaused(true)}
                      onTouchEnd={() => setIsUlasanPaused(false)}
                      className={
                        communityReviews.length === 2
                          ? "grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto"
                          : "flex overflow-x-auto snap-x snap-mandatory no-scrollbar touch-pan-x gap-4 sm:gap-5 pb-4 cursor-grab active:cursor-grabbing"
                      }
                    >
                      {communityReviews.map((item, idx) => (
                        <div 
                          key={item.id || idx}
                          className={`${
                            communityReviews.length === 2 ? 'w-full' : 'w-[85vw] sm:w-[340px] shrink-0 snap-center'
                          } ${MPP_CARD_SURFACE.default} p-5 sm:p-6 flex flex-col justify-between items-center text-center relative overflow-hidden`}
                        >
                          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A24B]/70 to-transparent" />
                          <div className="flex items-center gap-0.5 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-3.5 h-3.5 ${
                                  i < (item.rating || 5)
                                    ? 'fill-[#C9A24B] text-[#C9A24B]'
                                    : 'text-slate-300 dark:text-slate-600'
                                }`} 
                              />
                            ))}
                          </div>
                          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed italic my-2.5 line-clamp-3">
                            “{item.teks}”
                          </p>
                          <div className="pt-3 mt-auto border-t border-[#EFEAE0] dark:border-white/[0.06] w-full">
                            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase font-sans tracking-wide block">
                              {item.nama}
                            </span>
                            <span className="text-[11px] text-[#0F6B4F] dark:text-emerald-400 font-semibold block mt-0.5">
                              {item.layanan} {item.tanggal ? `· ${item.tanggal}` : ''}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.section>
            </>
          )}

          {/* Berita & Pengumuman Resmi */}
          {transparencyHubTab === 'berita' && (
            <motion.section
              id="publikasi-berita"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-7xl mx-auto py-8 sm:py-14 px-2.5 sm:px-6 lg:px-8 relative before:bg-slate-100 dark:before:bg-[#0F2D4A] before:border-y before:border-transparent before:absolute before:inset-0 before:w-[200vw] before:left-1/2 before:-translate-x-1/2 before:-z-10"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-8 gap-3">
                <div className="space-y-2">
                  <span className={`${MPP_TYPOGRAPHY.eyebrow} inline-block`}>
                    {t("sections.news_badge", t("mppPortal.news.badge", "Publikasi Resmi"))}
                  </span>
                  <h2 className={MPP_TYPOGRAPHY.sectionTitle}>
                    {t("sections.news_title", "Berita & Pengumuman Terbaru")}
                  </h2>
                  <p className={`${MPP_TYPOGRAPHY.sectionSubtitle} max-w-2xl`}>
                    {t("sections.news_subtitle", t("mppPortal.news.subtitle", "Panduan pelayanan terbaru, regulasi kebijakan, dan pengumuman pembaruan sistem MPP Luwu."))}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNewsId(null);
                    setIsNewsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 min-h-[44px] text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors font-sans group cursor-pointer w-fit"
                >
                  <span>{t("mppPortal.news.viewAll", "Lihat Semua Berita")}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {portalNews.filter(n => n.status !== 'draft').length === 0 ? (
                  <div className={`col-span-full py-8 text-center text-xs text-slate-500 font-sans italic ${MPP_CARD_SURFACE.layer1} ${MPP_CARD_SURFACE.radiusMain}`}>
                    {t("portal.noNewsData", "Belum ada pengumuman atau publikasi berita terbaru di portal MPP.")}
                  </div>
                ) : (
                  portalNews
                    .filter(n => n.status !== 'draft')
                    .slice(0, 3)
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedNewsId(item.id);
                          setIsNewsModalOpen(true);
                        }}
                        className={`${MPP_CARD_SURFACE.layer1} ${MPP_CARD_SURFACE.radiusMain} overflow-hidden group cursor-pointer hover:border-emerald-500/40 dark:hover:border-white/[0.14] transition-all duration-300 flex flex-col justify-between active:scale-[0.99] relative`}
                      >
                        <div>
                          <div className="h-44 sm:h-48 bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                            <img 
                              src={getImageUrl(item.image, 'news')} 
                              alt={item.judul}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => handleImageError(e, 'news')}
                            />
                            <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                              <Badge variant="overlay">{item.kategori}</Badge>
                              {item.isPinned && (
                                <Badge variant="category" tone="primary">
                                  {isEn ? 'PINNED' : isZh ? '置顶' : 'UTAMA'}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className={`${MPP_CARD_SURFACE.paddingLg} space-y-2`}>
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                              <span>{item.tanggal}</span>
                              <span className="truncate max-w-[120px] text-right">{item.penulis}</span>
                            </div>
                            <h3 className={`${MPP_TYPOGRAPHY.cardTitle} group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2`}>
                              {isEn && item.judul_en ? item.judul_en : isZh && item.judul_zh ? item.judul_zh : item.judul}
                            </h3>
                            <p className={`${MPP_TYPOGRAPHY.cardBody} line-clamp-3`}>
                              {isEn && item.ringkasan_en ? item.ringkasan_en : isZh && item.ringkasan_zh ? item.ringkasan_zh : item.ringkasan}
                            </p>
                          </div>
                        </div>

                        <div className="px-5 sm:px-6 pb-5 pt-0 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 min-h-[36px]">
                          <span>{isEn ? 'Read More' : isZh ? '阅读全文' : t('mppPortal.news.readMore', 'Baca Selengkapnya')}</span>
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    ))
                )}
              </div>
            </motion.section>
          )}

          {/* Modal Catalogue / Detail Reader Berita (Tetap terpasang di luar tab) */}
          <MppNewsCatalogModal
            isOpen={isNewsModalOpen}
            onClose={() => {
              setIsNewsModalOpen(false);
              setSelectedNewsId(null);
            }}
            currentLang={i18n.language}
            isDark={isDark}
            selectedNewsId={selectedNewsId}
          />

          {/* Seksi Layanan Pengaduan */}
          <motion.section
            id="pengaduan"
            initial={{ opacity: 0, y: 40, scale: 0.96, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ type: "spring", stiffness: 75, damping: 20, mass: 0.9 }}
            className="w-full max-w-6xl mx-auto flex flex-col scroll-mt-36 sm:scroll-mt-40 py-10 sm:py-16 md:py-24 px-2.5 sm:px-6 lg:px-8 relative before:bg-slate-100 dark:before:bg-[#0F2D4A] before:border-y before:border-transparent before:absolute before:inset-0 before:w-[200vw] before:left-1/2 before:-translate-x-1/2 before:-z-10"
          >
            {/* Header Seksi Terpusat — Standardized Zero-Pill Eyebrow + Typography */}
            <div className="w-full max-w-2xl mx-auto text-center px-4 flex flex-col items-center mb-6 sm:mb-10 space-y-2">
              <span className={MPP_TYPOGRAPHY.eyebrow}>
                {t("sections.complaint_badge", t("mppPortal.pengaduan.badge", "Pengaduan & Aspirasi"))}
              </span>
              <h2 className={`${MPP_TYPOGRAPHY.sectionTitle} text-center`}>
                {t("sections.complaint_title", "Kanal Pengaduan Layanan Publik")}
              </h2>
              <p className={`${MPP_TYPOGRAPHY.sectionSubtitle} max-w-2xl mx-auto text-center`}>
                {t("sections.complaint_subtitle", t("mppPortal.pengaduan.subtitle", "Membuka saluran pengawasan masyarakat untuk terus meningkatkan efektivitas pelayanan publik MPP Simpurusiang Kabupaten Luwu."))}
              </p>
            </div>

            {/* Tata Letak 3 Kartu Kanal Pengaduan (Grid 3 Kolom — Harmonized Elegan Nusantara) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto w-full">
              {/* Kartu 1 (SP4N-LAPOR!) */}
              <div className={`${MPP_CARD_SURFACE.default} p-5 sm:p-6 flex flex-col justify-between h-full hover:border-[#0F6B4F]/50 transition-all duration-300 group relative overflow-hidden`}>
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A24B]/70 to-transparent" />
                <div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-[#FAF8F3] dark:bg-[#132E48] text-[#855A14] dark:text-[#E2C475] border border-[#E5DFD3] dark:border-white/[0.08]">
                    <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-sans mb-1.5 group-hover:text-[#0F6B4F] dark:group-hover:text-emerald-400 transition-colors text-left">
                    {t("mppPortal.pengaduan.laporTitle")}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4 text-left font-normal">
                    {t("mppPortal.pengaduan.laporDesc")}
                  </p>
                </div>
                <a 
                  href="https://www.lapor.go.id" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="min-h-[44px] text-xs sm:text-sm font-bold text-[#0F6B4F] dark:text-emerald-400 mt-auto pt-3 flex items-center justify-between border-t border-[#EFEAE0] dark:border-white/[0.08] hover:opacity-90 transition-colors group/link font-sans"
                >
                  <span>{t("mppPortal.pengaduan.moreDetails")}</span>
                  <ArrowRight size={15} className="transition-transform group-hover/link:translate-x-1" />
                </a>
              </div>

              {/* Kartu 2 (Pengaduan Internal) */}
              <div className={`${MPP_CARD_SURFACE.default} p-5 sm:p-6 flex flex-col justify-between h-full hover:border-[#0F6B4F]/50 transition-all duration-300 group relative overflow-hidden`}>
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#0F6B4F]/70 to-transparent" />
                <div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-[#FAF8F3] dark:bg-[#132E48] text-[#0F6B4F] dark:text-emerald-400 border border-[#E5DFD3] dark:border-white/[0.08]">
                    <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-sans mb-1.5 group-hover:text-[#0F6B4F] dark:group-hover:text-emerald-400 transition-colors text-left">
                    {t("mppPortal.pengaduan.internalTitle")}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4 text-left font-normal">
                    {t("mppPortal.pengaduan.internalDesc")}
                  </p>
                </div>
                <a 
                  href="#pengaduan-internal" 
                  onClick={(e) => {
                    e.preventDefault();
                    navigateToMppSection('survey');
                  }}
                  className="min-h-[44px] text-xs sm:text-sm font-bold text-[#0F6B4F] dark:text-emerald-400 mt-auto pt-3 flex items-center justify-between border-t border-[#EFEAE0] dark:border-white/[0.08] hover:opacity-90 transition-colors cursor-pointer group/link font-sans"
                >
                  <span>{t("mppPortal.pengaduan.moreDetails")}</span>
                  <ArrowRight size={15} className="transition-transform group-hover/link:translate-x-1" />
                </a>
              </div>

              {/* Kartu 3 (Contact Center) */}
              <div className={`${MPP_CARD_SURFACE.default} p-5 sm:p-6 flex flex-col justify-between h-full hover:border-[#0F6B4F]/50 transition-all duration-300 group relative overflow-hidden`}>
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A24B]/70 to-transparent" />
                <div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-[#FAF8F3] dark:bg-[#132E48] text-[#0F6B4F] dark:text-emerald-400 border border-[#E5DFD3] dark:border-white/[0.08]">
                    <Headphones className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-sans mb-1.5 group-hover:text-[#0F6B4F] dark:group-hover:text-emerald-400 transition-colors text-left">
                    {t("mppPortal.pengaduan.contactCenterTitle")}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4 text-left font-normal">
                    {t("mppPortal.pengaduan.contactCenterDesc")}
                  </p>
                </div>
                <a 
                  href="#virtual-helpdesk-banner" 
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('virtual-helpdesk-banner')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full min-h-[44px] text-xs sm:text-sm font-bold text-[#0F6B4F] dark:text-emerald-400 mt-auto pt-3 flex items-center justify-between border-t border-[#EFEAE0] dark:border-white/[0.08] hover:opacity-90 transition-colors cursor-pointer group/link font-sans"
                >
                  <span>{t("mppPortal.pengaduan.moreDetails", "Konsultasi Virtual Helpdesk")}</span>
                  <ArrowRight size={15} className="transition-transform group-hover/link:translate-x-1" />
                </a>
              </div>
            </div>

            {/* Banner Virtual Helpdesk (Authentic Architectural Backdrop When No Custom Staff Photo Uploaded) */}
            <motion.div 
              id="virtual-helpdesk-banner"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="max-w-6xl mx-auto mt-8 sm:mt-10 w-full"
            >
              <div className={`grid grid-cols-1 md:grid-cols-12 ${MPP_CARD_SURFACE.default} overflow-hidden`}>
                {/* Kolom Kiri (5 cols): Kedua Foto Petugas MPP Simpurusiang */}
                <div className="md:col-span-5 w-full relative min-h-[260px] sm:min-h-[300px] md:min-h-full overflow-hidden bg-gradient-to-b from-[#0F6B4F]/15 via-[#0A2236] to-[#071624] flex items-end justify-center pt-6 px-3">
                  <div className="flex items-end justify-center gap-1.5 sm:gap-2.5 w-full max-w-sm relative z-10 pb-1">
                    <div className="relative flex-1 flex flex-col items-center justify-end group">
                      <ResponsiveOfficerPicture
                        officerKey="officer-left"
                        customSrc={staffImageLeft && !staffImageLeft.includes('unsplash.com') ? staffImageLeft : null}
                        alt="Petugas Virtual Helpdesk MPP Simpurusiang (Kiri)"
                        className="max-h-60 sm:max-h-64 md:max-h-72 w-auto object-contain object-bottom drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="relative flex-1 flex flex-col items-center justify-end group">
                      <ResponsiveOfficerPicture
                        officerKey="officer-right"
                        customSrc={staffImageRight && !staffImageRight.includes('unsplash.com') ? staffImageRight : null}
                        alt="Petugas Virtual Helpdesk MPP Simpurusiang (Kanan)"
                        className="max-h-60 sm:max-h-64 md:max-h-72 w-auto object-contain object-bottom drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between gap-2 text-xs font-bold text-white drop-shadow-md bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Headphones className="w-4 h-4 text-[#E2C475] shrink-0" />
                      <span className="truncate">Front Office &amp; Virtual Helpdesk MPP</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 shrink-0">
                      Siap Melayani
                    </span>
                  </div>
                </div>

                {/* Kolom Kanan (7 cols): Konten & Aksi */}
                <div className="md:col-span-7 p-5 sm:p-7 lg:p-9 flex flex-col justify-center">
                  <span className={`${MPP_TYPOGRAPHY.eyebrow} mb-1.5 block text-left`}>
                    {t("mppPortal.pengaduan.helpdeskBadge")}
                  </span>
                  <h3 className={`text-lg sm:text-xl md:text-2xl font-bold mb-2 font-sans text-left leading-snug ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {t("mppPortal.pengaduan.helpdeskTitle")}
                  </h3>
                  <p className={`text-xs sm:text-sm leading-relaxed mb-4 text-left font-normal ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {t("mppPortal.pengaduan.helpdeskDesc")}
                  </p>

                  <div className={`space-y-0.5 mb-5 p-3 rounded-xl border ${
                    isDark ? 'bg-[#132E48] border-white/[0.08] text-slate-200' : 'bg-[#FAF8F3] border-[#E5DFD3] text-slate-800'
                  }`}>
                    <span className={`text-xs font-bold block font-sans text-left ${
                      isDark ? 'text-[#E2C475]' : 'text-slate-900'
                    }`}>
                      {t("mppPortal.pengaduan.hoursLabel")}
                    </span>
                    <span className={`text-xs font-mono block text-left ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      {t("mppPortal.pengaduan.hoursValue")}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsHelpdeskSubmitted(false);
                        setIsHelpdeskModalOpen(true);
                      }}
                      className="min-h-[46px] bg-[#0F6B4F] hover:bg-[#0B543E] dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-98 text-white text-xs sm:text-sm font-bold py-3 px-5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 shadow-xs font-sans"
                    >
                      <Headphones className="w-4 h-4 shrink-0" />
                      <span>{t("mppPortal.pengaduan.contactBtn")}</span>
                      <ArrowRight size={15} className="shrink-0" />
                    </button>
                    <a
                      href={officialWaHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`min-h-[46px] text-xs sm:text-sm font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors font-sans active:scale-98 border ${
                        isDark 
                          ? 'bg-[#132E48] hover:bg-[#193B5C] text-slate-200 border-white/[0.10]' 
                          : 'bg-[#FAF8F3] hover:bg-[#EFECE3] text-slate-800 border-[#DFD8CA]'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4 text-[#0F6B4F] dark:text-emerald-400 shrink-0" />
                      <span>{t("mppPortal.contact.direct")}</span>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.section>

          {/* Seksi Kontak Kami (Integrasi Maps & Info) */}
          <motion.section 
            id="kontak"
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-6xl mx-auto scroll-mt-36 sm:scroll-mt-40 py-10 sm:py-16 md:py-24 px-2.5 sm:px-6 lg:px-8 relative before:bg-slate-50 dark:before:bg-[#0A2238] before:border-y before:border-transparent before:absolute before:inset-0 before:w-[200vw] before:left-1/2 before:-translate-x-1/2 before:-z-10 font-sans"
          >
            {/* Header Seksi Terpusat — Standardized Zero-Pill Eyebrow + Typography */}
            <div className="w-full max-w-2xl mx-auto text-center px-4 flex flex-col items-center mb-6 sm:mb-10 break-words">
              <span className={`${MPP_TYPOGRAPHY.eyebrow} mb-2 inline-block text-center`}>
                {t("mppPortal.kontak.badge")}
              </span>
              <h2 className={`${MPP_TYPOGRAPHY.sectionTitle} mt-1`}>
                {t("mppPortal.kontak.title")}
              </h2>
              <p className={`${MPP_TYPOGRAPHY.sectionSubtitle} max-w-2xl mx-auto mt-1.5 mb-3 text-center`}>
                {t("mppPortal.kontak.subtitle")}
              </p>
            </div>

            {/* Wadah Utama (Bagi 2 Kolom di Desktop) — Standardized Main Card (rounded-2xl, p-5 sm:p-6, Layer 1 #0F2D4A) */}
            <div className={`w-full grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 ${MPP_CARD_SURFACE.layer1} ${MPP_CARD_SURFACE.radiusMain} ${MPP_CARD_SURFACE.paddingLg}`}>
              {/* Kolom Kiri (Google Maps Embed) */}
              <div className={`w-full overflow-hidden ${MPP_CARD_SURFACE.radiusMain} relative border border-slate-200/80 dark:border-white/[0.07] min-h-[220px]`}>
                <iframe 
                  title={t("mppPortal.kontak.mapTitle")}
                  src="https://maps.google.com/maps?q=DPMPTSP%20Kabupaten%20Luwu%20Belopa&t=&z=16&ie=UTF8&iwloc=&output=embed"
                  className="w-full h-56 sm:h-72 lg:h-full min-h-[220px] sm:min-h-[280px] border-0 object-cover"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Kolom Kanan (Grid 4 Kartu Informasi - Standardized Small Card p-4, rounded-2xl, Layer 2 #143755) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                {/* Kartu 1 (Jam Pelayanan) */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.25, delay: 0 }}
                  className={`${MPP_CARD_SURFACE.layer2} ${MPP_CARD_SURFACE.paddingSm} ${MPP_CARD_SURFACE.radiusMain} flex flex-col justify-between items-center text-center relative overflow-hidden group`}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-2.5">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 mb-1">
                    {t("mppPortal.kontak.hoursLabel")}
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-50 leading-snug font-mono">
                    {t("mppPortal.kontak.hoursValue")}
                  </p>
                </motion.div>

                {/* Kartu 2 (Alamat) */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.25, delay: 0.05 }}
                  className={`${MPP_CARD_SURFACE.layer2} ${MPP_CARD_SURFACE.paddingSm} ${MPP_CARD_SURFACE.radiusMain} flex flex-col justify-between items-center text-center relative overflow-hidden group`}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-2.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 mb-1">
                    {t("mppPortal.kontak.addressLabel")}
                  </span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 leading-snug">
                    {t("mppPortal.kontak.addressValue")}
                  </p>
                </motion.div>

                {/* Kartu 3 (Email) */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.25, delay: 0.1 }}
                  className={`${MPP_CARD_SURFACE.layer2} ${MPP_CARD_SURFACE.paddingSm} ${MPP_CARD_SURFACE.radiusMain} flex flex-col justify-between items-center text-center relative overflow-hidden group`}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-2.5">
                    <Mail className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 mb-1">
                    {t("mppPortal.kontak.emailLabel")}
                  </span>
                  <a 
                    href={`mailto:${liveContacts.email}`}
                    className="min-h-[44px] flex items-center justify-center text-xs sm:text-sm font-mono font-bold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 break-all transition-colors active:scale-95"
                  >
                    {liveContacts.email}
                  </a>
                </motion.div>

                {/* Kartu 4 (Contact Center) */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.25, delay: 0.15 }}
                  className={`${MPP_CARD_SURFACE.layer2} ${MPP_CARD_SURFACE.paddingSm} ${MPP_CARD_SURFACE.radiusMain} flex flex-col justify-between items-center text-center relative overflow-hidden group`}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-2.5">
                    <Phone className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 mb-1">
                    {t("mppPortal.kontak.centerLabel")}
                  </span>
                  <a 
                    href={`tel:${liveContacts.phone.replace(/[^+0-9]/g, '')}`}
                    className="min-h-[44px] flex items-center justify-center text-sm font-mono font-bold text-slate-900 dark:text-slate-50 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors active:scale-95"
                  >
                    {liveContacts.phone}
                  </a>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t("mppPortal.kontak.centerSub")}
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Tombol On-Demand Feed Sosial Media Resmi (Progressive Disclosure Hemat Kuota) */}
            {((socialMediaData.instagram?.isActive !== false) || 
              (socialMediaData.youtube?.isActive !== false) || 
              (socialMediaData.facebook?.isActive !== false) || 
              (socialMediaData.tiktok?.isActive !== false)) && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowSocialMediaFeed(prev => !prev)}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-emerald-500/15 border border-slate-200/80 dark:border-white/[0.10] text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold font-sans flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Instagram className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {showSocialMediaFeed
                      ? 'Sembunyikan Feed Media Sosial Resmi'
                      : 'Tampilkan Feed Media Sosial Resmi (Instagram, YouTube, FB, TikTok)'}
                  </span>
                </button>
              </div>
            )}
          </motion.section>

          {/* Seksi Sosial Media MPP Kabupaten Luwu (On-Demand Progressive Disclosure) */}
          {showSocialMediaFeed && ((socialMediaData.instagram?.isActive !== false) || 
            (socialMediaData.youtube?.isActive !== false) || 
            (socialMediaData.facebook?.isActive !== false) || 
            (socialMediaData.tiktok?.isActive !== false)) && (
          <motion.section 
            id="sosial-media"
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-6xl mx-auto py-10 sm:py-16 md:py-24 px-2.5 sm:px-6 lg:px-8 relative before:bg-slate-100 dark:before:bg-[#0F2D4A] before:border-y before:border-transparent before:absolute before:inset-0 before:w-[200vw] before:left-1/2 before:-translate-x-1/2 before:-z-10 font-sans"
          >
            {/* Header Seksi Terpusat — Standardized Zero-Pill Eyebrow + Typography */}
            <div className="w-full max-w-2xl mx-auto text-center px-4 flex flex-col items-center mb-6 sm:mb-10 break-words">
              <motion.span 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className={`${MPP_TYPOGRAPHY.eyebrow} mb-2 inline-block text-center`}
              >
                {t("mppPortal.sosialMedia.badge")}
              </motion.span>
              <motion.h2 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`${MPP_TYPOGRAPHY.sectionTitle} mt-1`}
              >
                {t("mppPortal.sosialMedia.title")}
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className={`${MPP_TYPOGRAPHY.sectionSubtitle} max-w-2xl mx-auto mt-1.5 mb-3 text-center`}
              >
                {t("mppPortal.sosialMedia.subtitle")}
              </motion.p>
            </div>

            {/* Tata Letak Grid (1 kolom HP, 2 kolom MD) */}
            <div className="w-full flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-6">
              {/* Kartu 1: Instagram */}
              {socialMediaData.instagram?.isActive !== false && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.25, delay: 0, ease: "easeOut" }}
                className={`backdrop-blur-xl rounded-3xl overflow-hidden border min-h-[480px] sm:min-h-[520px] flex flex-col justify-between group hover:shadow-xl hover:border-emerald-500/50 active:scale-[0.98] transition-all duration-300 relative ${
                  isDark ? 'bg-surface/95 border-slate-800 shadow-lg shadow-black/40 text-white' : 'bg-white border-slate-200/80 shadow-md text-slate-900'
                }`}
              >
                {/* Top Accent Glowing Rail */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 z-10" />

                {/* Header Profil */}
                <div className={`px-4 sm:px-5 py-3 border-b flex items-center gap-2.5 shrink-0 ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50/70 border-gray-100'
                }`}>
                  <div className="w-9 h-9 rounded-full p-[2px] bg-emerald-600 dark:bg-emerald-500 shrink-0 shadow-sm">
                    <img 
                      src={LUWU_LOGO_BASE64} 
                      alt="Logo MPP Kabupaten Luwu" 
                      referrerPolicy="no-referrer" 
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_IMAGE_URL;
                        e.currentTarget.style.backgroundColor = '#10b981';
                      }}
                      className="w-full h-full rounded-full bg-white p-0.5 object-contain" 
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs sm:text-sm font-sans truncate flex items-center gap-1">
                      {socialMediaData.instagram.handle.replace(/^@/, '')}
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 inline" />
                    </span>
                    <span className={`text-[10px] sm:text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {t("mppPortal.sosialMedia.igSubtitle")}
                    </span>
                  </div>
                  <a 
                    href={socialMediaData.instagram.profileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="ml-auto min-h-[44px] text-xs font-bold px-3.5 sm:px-4 py-2 rounded-xl sm:rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    <span>{t("mppPortal.sosialMedia.followBtn")}</span>
                    <Instagram className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Konten Feed Post */}
                <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-slate-900 shrink-0">
                  <img 
                    src={socialMediaData.instagram.postImage || "/assets/images/default-facility.svg"} 
                    alt="Aktivitas Pelayanan Publik MPP Luwu" 
                    referrerPolicy="no-referrer" 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMAGE_URL;
                      e.currentTarget.style.backgroundColor = '#10b981';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md px-3 py-0.5 rounded-lg text-[10px] font-mono font-medium text-white flex items-center gap-1">
                    <Instagram className="w-3 h-3 text-pink-400" /> {socialMediaData.instagram.tag || t("mppPortal.sosialMedia.igTag")}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent pointer-events-none"></div>
                </div>

                {/* Info Interaksi & Cuplikan Narasi */}
                <div className={`p-3.5 sm:p-4 flex flex-col flex-1 justify-between ${
                  isDark ? 'bg-surface/95 text-slate-100' : 'bg-white text-slate-800'
                }`}>
                  <div>
                    <div className="flex items-center gap-3.5 mb-1.5">
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                      <MessageCircle className="w-4 h-4" />
                      <Share2 className="w-4 h-4" />
                      <span className={`text-[10px] sm:text-[11px] font-mono font-bold ml-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {socialMediaData.instagram.stats || t("mppPortal.sosialMedia.igLikes")}
                      </span>
                    </div>
                    <p className={`text-xs leading-normal line-clamp-2 font-normal ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {socialMediaData.instagram.caption || t("mppPortal.sosialMedia.igDesc")}
                    </p>
                  </div>

                  {/* Tombol CTA */}
                  <a 
                    href={socialMediaData.instagram.profileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={`min-h-[44px] mt-2 pt-2 border-t text-xs font-bold text-emerald-500 dark:text-emerald-400 flex items-center justify-between hover:text-emerald-400 transition-colors active:scale-98 ${
                      isDark ? 'border-slate-800' : 'border-gray-100'
                    }`}
                  >
                    <span>{t("mppPortal.sosialMedia.igBtn")}</span>
                    <ArrowRight size={15} />
                  </a>
                </div>
              </motion.div>
              )}

              {/* Kartu 2: YouTube */}
              {socialMediaData.youtube?.isActive !== false && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.25, delay: 0.05, ease: "easeOut" }}
                className={`backdrop-blur-xl rounded-3xl overflow-hidden border min-h-[480px] sm:min-h-[520px] flex flex-col justify-between group hover:shadow-xl hover:border-emerald-500/50 active:scale-[0.98] transition-all duration-300 relative ${
                  isDark ? 'bg-surface/95 border-slate-800 shadow-lg shadow-black/40 text-white' : 'bg-white border-slate-200/80 shadow-md text-slate-900'
                }`}
              >
                {/* Top Accent Glowing Rail */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 z-10" />

                {/* Header Profil */}
                <div className={`px-4 sm:px-5 py-3 border-b flex items-center gap-2.5 shrink-0 ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50/70 border-gray-100'
                }`}>
                  <div className="w-9 h-9 rounded-full bg-red-600/10 text-red-600 flex items-center justify-center shrink-0 border border-red-600/20 shadow-sm">
                    <Youtube className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs sm:text-sm font-sans truncate">
                      {socialMediaData.youtube.channelName || t("mppPortal.sosialMedia.ytTitle")}
                    </span>
                    <span className={`text-[10px] sm:text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {t("mppPortal.sosialMedia.ytSubtitle")}
                    </span>
                  </div>
                  <a 
                    href={socialMediaData.youtube.channelUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="ml-auto min-h-[44px] text-xs font-bold px-3.5 sm:px-4 py-2 rounded-xl sm:rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 text-white transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    <span>{t("mppPortal.sosialMedia.subscribeBtn")}</span>
                    <Youtube className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Konten Video Simulasi */}
                <a 
                  href={socialMediaData.youtube.videoUrl || socialMediaData.youtube.channelUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="relative h-56 sm:h-64 w-full overflow-hidden bg-slate-900 shrink-0 flex items-center justify-center cursor-pointer block"
                >
                  <img 
                    src={socialMediaData.youtube.videoThumbnail || "/assets/images/default-facility.svg"} 
                    alt={socialMediaData.youtube.videoTitle || "Video Profil Pelayanan MPP Simpurusiang"} 
                    referrerPolicy="no-referrer" 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMAGE_URL;
                      e.currentTarget.style.backgroundColor = '#10b981';
                    }}
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent pointer-events-none" />
                  <div className="absolute flex items-center justify-center">
                    <span className="absolute -inset-3 rounded-full animate-pulse-border bg-red-600/40 pointer-events-none" />
                    <div className="relative w-11 h-11 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/40 group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 ml-0.5 fill-current" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-2.5 py-0.5 rounded text-[10px] font-mono font-bold text-white">
                    {socialMediaData.youtube.duration || "04:15"}
                  </span>
                </a>

                {/* Info Judul Video & Statistik */}
                <div className={`p-3.5 sm:p-4 flex flex-col flex-1 justify-between ${
                  isDark ? 'bg-surface/95 text-slate-100' : 'bg-white text-slate-800'
                }`}>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm font-sans line-clamp-1 leading-snug group-hover:text-emerald-500 transition-colors">
                      {socialMediaData.youtube.videoTitle || t("mppPortal.sosialMedia.ytVideoTitle")}
                    </h4>
                    <p className={`text-[10px] sm:text-[11px] font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {socialMediaData.youtube.stats || t("mppPortal.sosialMedia.ytVideoStats")}
                    </p>
                  </div>

                  {/* Tombol CTA */}
                  <a 
                    href={socialMediaData.youtube.videoUrl || socialMediaData.youtube.channelUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={`min-h-[44px] mt-2 pt-2 border-t text-xs font-bold text-emerald-500 dark:text-emerald-400 flex items-center justify-between hover:text-emerald-400 transition-colors active:scale-98 ${
                      isDark ? 'border-slate-800' : 'border-gray-100'
                    }`}
                  >
                    <span>{t("mppPortal.sosialMedia.ytBtn")}</span>
                    <ArrowRight size={15} />
                  </a>
                </div>
              </motion.div>
              )}

              {/* Kartu 3: Facebook */}
              {socialMediaData.facebook?.isActive !== false && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.25, delay: 0.1, ease: "easeOut" }}
                className={`backdrop-blur-xl rounded-3xl overflow-hidden border min-h-[480px] sm:min-h-[520px] flex flex-col justify-between group hover:shadow-xl hover:border-emerald-500/50 active:scale-[0.98] transition-all duration-300 relative ${
                  isDark ? 'bg-surface/95 border-slate-800 shadow-lg shadow-black/40 text-white' : 'bg-white border-slate-200/80 shadow-md text-slate-900'
                }`}
              >
                {/* Top Accent Glowing Rail */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 z-10" />

                {/* Header Profil */}
                <div className={`px-4 sm:px-5 py-3 border-b flex items-center gap-2.5 shrink-0 ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50/70 border-gray-100'
                }`}>
                  <div className="w-9 h-9 rounded-full bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center shrink-0 border border-[#1877F2]/20 shadow-sm">
                    <Facebook className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs sm:text-sm font-sans truncate">
                      {socialMediaData.facebook.pageName || t("mppPortal.sosialMedia.fbTitle")}
                    </span>
                    <span className={`text-[10px] sm:text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {t("mppPortal.sosialMedia.fbSubtitle")}
                    </span>
                  </div>
                  <a 
                    href={socialMediaData.facebook.pageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="ml-auto min-h-[44px] text-xs font-bold px-3.5 sm:px-4 py-2 rounded-xl sm:rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] active:scale-95 text-white transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    <span>{t("mppPortal.sosialMedia.followBtn")}</span>
                    <Facebook className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Konten Feed Post */}
                <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-slate-900 shrink-0">
                  <img 
                    src={socialMediaData.facebook.postImage || "/assets/images/default-facility.svg"} 
                    alt="Sosialisasi Perizinan dan Pelayanan Terpadu Luwu" 
                    referrerPolicy="no-referrer" 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMAGE_URL;
                      e.currentTarget.style.backgroundColor = '#10b981';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md px-3 py-0.5 rounded-lg text-[10px] font-mono font-medium text-white flex items-center gap-1">
                    <Facebook className="w-3 h-3 text-blue-400" /> {socialMediaData.facebook.tag || t("mppPortal.sosialMedia.fbTag")}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent pointer-events-none"></div>
                </div>

                {/* Info Interaksi & Cuplikan Narasi */}
                <div className={`p-3.5 sm:p-4 flex flex-col flex-1 justify-between ${
                  isDark ? 'bg-surface/95 text-slate-100' : 'bg-white text-slate-800'
                }`}>
                  <div>
                    <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono font-medium mb-1.5">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{socialMediaData.facebook.stats || t("mppPortal.sosialMedia.fbStats")}</span>
                    </div>
                    <p className={`text-xs leading-normal line-clamp-2 font-normal ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {socialMediaData.facebook.caption || t("mppPortal.sosialMedia.fbDesc")}
                    </p>
                  </div>

                  {/* Tombol CTA */}
                  <a 
                    href={socialMediaData.facebook.pageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={`min-h-[44px] mt-2 pt-2 border-t text-xs font-bold text-emerald-500 dark:text-emerald-400 flex items-center justify-between hover:text-emerald-400 transition-colors active:scale-98 ${
                      isDark ? 'border-slate-800' : 'border-gray-100'
                    }`}
                  >
                    <span>{t("mppPortal.sosialMedia.fbBtn")}</span>
                    <ArrowRight size={15} />
                  </a>
                </div>
              </motion.div>
              )}

              {/* Kartu 4: TikTok */}
              {socialMediaData.tiktok?.isActive !== false && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.25, delay: 0.15, ease: "easeOut" }}
                className={`backdrop-blur-xl rounded-3xl overflow-hidden border min-h-[480px] sm:min-h-[520px] flex flex-col justify-between group hover:shadow-xl hover:border-emerald-500/50 active:scale-[0.98] transition-all duration-300 relative ${
                  isDark ? 'bg-surface/95 border-slate-800 shadow-lg shadow-black/40 text-white' : 'bg-white border-slate-200/80 shadow-md text-slate-900'
                }`}
              >
                {/* Top Accent Glowing Rail */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 z-10" />

                {/* Header Profil */}
                <div className={`px-4 sm:px-5 py-3 border-b flex items-center gap-2.5 shrink-0 ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50/70 border-gray-100'
                }`}>
                  <div className="w-9 h-9 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shrink-0 shadow-sm border border-slate-700/20">
                    <Music2 className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs sm:text-sm font-sans truncate">
                      {socialMediaData.tiktok.handle}
                    </span>
                    <span className={`text-[10px] sm:text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {t("mppPortal.sosialMedia.ttSubtitle")}
                    </span>
                  </div>
                  <a 
                    href={socialMediaData.tiktok.profileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="ml-auto min-h-[44px] text-xs font-bold px-3.5 sm:px-4 py-2 rounded-xl sm:rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 active:scale-95 text-white transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    <span>{t("mppPortal.sosialMedia.followBtn")}</span>
                    <Music2 className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Konten Video Feed Simulasi */}
                <a 
                  href={socialMediaData.tiktok.profileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="relative h-56 sm:h-64 w-full overflow-hidden bg-slate-900 shrink-0 block"
                >
                  <img 
                    src={socialMediaData.tiktok.videoThumbnail || "/assets/images/default-facility.svg"} 
                    alt="Edukasi Pelayanan Publik MPP Simpurusiang" 
                    referrerPolicy="no-referrer" 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMAGE_URL;
                      e.currentTarget.style.backgroundColor = '#10b981';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" 
                  />
                  <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md px-3 py-0.5 rounded-lg text-[10px] font-mono font-medium text-white flex items-center gap-1">
                    <Music2 className="w-3 h-3 text-cyan-400" /> {socialMediaData.tiktok.tag || t("mppPortal.sosialMedia.ttTag")}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-3">
                    <span className="text-white text-xs font-bold font-sans drop-shadow-sm line-clamp-1">
                      {socialMediaData.tiktok.caption || t("mppPortal.sosialMedia.ttTitle")}
                    </span>
                    <span className="text-[10px] text-slate-300 mt-0.5 flex items-center gap-1 font-mono">
                      <Music2 className="w-2.5 h-2.5" /> {t("mppPortal.sosialMedia.ttSound")}
                    </span>
                  </div>
                </a>

                {/* Info Interaksi */}
                <div className={`p-3.5 sm:p-4 flex flex-col flex-1 justify-between ${
                  isDark ? 'bg-surface/95 text-slate-100' : 'bg-white text-slate-800'
                }`}>
                  <div className={`flex items-center justify-between text-[10px] sm:text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span>{socialMediaData.tiktok.stats || t("mppPortal.sosialMedia.ttLikes")}</span>
                    <span>{t("mppPortal.sosialMedia.ttComments")}</span>
                    <span>{t("mppPortal.sosialMedia.ttShares")}</span>
                  </div>

                  {/* Tombol CTA */}
                  <a 
                    href={socialMediaData.tiktok.profileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={`min-h-[44px] mt-2 pt-2 border-t text-xs font-bold text-emerald-500 dark:text-emerald-400 flex items-center justify-between hover:text-emerald-400 transition-colors active:scale-98 ${
                      isDark ? 'border-slate-800' : 'border-gray-100'
                    }`}
                  >
                    <span>{t("mppPortal.sosialMedia.ttBtn")}</span>
                    <ArrowRight size={15} />
                  </a>
                </div>
              </motion.div>
              )}
            </div>
          </motion.section>
          )}
          {/* FASE 8: Peta Spasial / WebGIS Integrasi (Authentic High-Res Luwu Landscape Preview) */}
          <motion.section
            id="peta-spasial"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-6xl mx-auto scroll-mt-36 sm:scroll-mt-40 py-10 sm:py-14 md:py-18 px-2.5 sm:px-6 lg:px-8 font-sans"
          >
            <div className={`${MPP_CARD_SURFACE.default} p-5 sm:p-8 md:p-9 relative overflow-hidden flex flex-col md:flex-row items-center gap-6 sm:gap-10`}>
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A24B]/70 to-transparent" />
              
              <div className="relative z-10 md:w-1/2 text-left space-y-3">
                <span className={`${MPP_TYPOGRAPHY.eyebrow} inline-flex items-center gap-2`}>
                  <span aria-hidden="true" className="w-1.5 h-1.5 rotate-45 bg-[#C9A24B]" />
                  <span>{t("mppPortal.map.geospatialBadge", "Eksplorasi Geospasial")}</span>
                </span>
                <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {t("mppPortal.webgisTitle", "WebGIS & Potensi Investasi Luwu")}
                </h2>
                <p className={`text-xs sm:text-sm leading-relaxed pb-2 max-w-lg ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {t("mppPortal.map.geospatialDesc", "Portal MPP Simpurusiang terintegrasi langsung dengan platform spasial resmi Kabupaten Luwu. Analisis tata ruang, pantau infrastruktur, dan pelajari titik lokasi usaha secara presisi.")}
                </p>
                <button
                  type="button"
                  onClick={() => window.location.href = '/?skipSplash=true'}
                  className="w-full sm:w-auto inline-flex items-center justify-center min-h-[48px] bg-[#0F6B4F] hover:bg-[#0B543E] dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-98 text-white px-6 py-3 rounded-xl font-bold shadow-xs transition-all group gap-2 cursor-pointer"
                >
                  <Map className="w-4 h-4 shrink-0" />
                  <span className="text-xs sm:text-sm">{t("mppPortal.map.openInteractive")}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
                </button>
              </div>

              <div className="relative z-10 md:w-1/2 w-full">
                <div className="relative w-full aspect-[16/10] overflow-hidden rounded-2xl border border-[#D8CEBC] dark:border-white/15 shadow-md group bg-[#0A2236]">
                  <img 
                    src="/assets/images/hero-investasi-luwu-1280.webp" 
                    alt="Peta Spasial & Lanskap Investasi Kabupaten Luwu"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/assets/images/hero-mpp-simpurusiang-1280.webp';
                    }}
                  />
                  {/* Subtle Cartographic Coordinate Grid Overlay */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none opacity-25"
                    style={{
                      backgroundImage:
                        'linear-gradient(to right, rgba(255,255,255,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.22) 1px, transparent 1px)',
                      backgroundSize: '40px 40px',
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#061826]/85 via-transparent to-transparent pointer-events-none" />
                  
                  <div className="absolute bottom-3 left-3.5 right-3.5 z-20 flex items-center justify-between gap-2 text-white">
                    <span className="text-[11px] font-mono text-white/95 drop-shadow-xs">
                      -3.3765, 120.3621 · Belopa, Kab. Luwu
                    </span>
                    <span className="text-[11px] font-semibold text-[#F5DFA0] drop-shadow-xs">
                      PostGIS Terintegrasi
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        </main>

        {/* Footer */}
        <footer className="bg-[#F4F0E6] dark:bg-[#05101C] pt-10 sm:pt-14 pb-24 sm:pb-32 border-t border-[#E2DACB] dark:border-white/10 w-full relative overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.35 }} 
            viewport={{ once: true, amount: 0.1 }} 
            className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
              {/* Brand & Description (5 cols on desktop) */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-3.5">
                    <div className="p-2 rounded-2xl bg-white dark:bg-[#0C2135] border border-[#E2DACB] dark:border-white/10 shadow-2xs shrink-0">
                      <img 
                        alt="Lambang Kabupaten Luwu" 
                        className="w-8 h-8 sm:w-9 sm:h-9 object-contain" 
                        src={LUWU_LOGO_BASE64}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK_IMAGE_URL;
                        }}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight font-sans">
                        MPP Simpurusiang
                      </span>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {t("mppPortal.nav.govName")}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed mb-4 max-w-md">
                    {t("mppPortal.footer.desc")}
                  </p>
                </div>

                {/* Unboxed Institutional Operational & Official Address Metadata */}
                <div className="flex flex-col gap-2 pt-2 border-t border-[#E2DACB] dark:border-white/[0.08] text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
                    <Clock className="w-3.5 h-3.5 text-[#0F6B4F] dark:text-emerald-400 shrink-0" />
                    <span>{t("mppPortal.footer.hoursText")}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#855A14] dark:text-[#E2C475] shrink-0 mt-0.5" />
                    <span>{portalProfile?.address || 'Jl. Simpurusiang No. 45, Senga, Kec. Belopa, Kab. Luwu, Sulawesi Selatan 91994'}</span>
                  </div>
                </div>
              </div>

              {/* Navigation Columns: 3-Column Grid on Tablet/Desktop (7 cols on lg) */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 pt-2 sm:pt-0">
                {/* Kolom 1: Tautan Pintas */}
                <div className="bg-slate-50/70 dark:bg-white/[0.02] sm:bg-transparent sm:dark:bg-transparent rounded-2xl p-4 sm:p-0 border border-slate-200/60 dark:border-white/5 sm:border-0">
                  <div className="flex items-center gap-2 mb-3.5 pb-2 border-b border-slate-200/60 dark:border-white/10 sm:border-0 sm:pb-0">
                    <div className="w-1.5 h-4 rounded-full bg-emerald-500 shrink-0" />
                    <h4 className="font-sans text-xs sm:text-sm font-bold tracking-wider text-slate-900 dark:text-white uppercase truncate">
                      {t("mppPortal.footer.tautanPintas")}
                    </h4>
                  </div>
                  <ul className="flex flex-col gap-1 sm:gap-1.5">
                    <li>
                      <a 
                        className="group flex items-center justify-between px-3 py-2.5 rounded-xl min-h-[44px] text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-98 transition-all duration-200 cursor-pointer" 
                        href="#hero"
                        onClick={(e) => {
                          e.preventDefault();
                          navigateToMppSection('hero');
                        }}
                      >
                        <span className="truncate">{t("mppPortal.footer.beranda")}</span>
                        <ChevronRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-500 shrink-0" />
                      </a>
                    </li>
                    <li>
                      <a 
                        className="group flex items-center justify-between px-3 py-2.5 rounded-xl min-h-[44px] text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-98 transition-all duration-200 cursor-pointer" 
                        href="#layanan"
                        onClick={(e) => {
                          e.preventDefault();
                          navigateToMppSection('layanan');
                        }}
                      >
                        <span className="truncate">{t("mppPortal.footer.daftarLayanan")}</span>
                        <ChevronRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-500 shrink-0" />
                      </a>
                    </li>
                    <li>
                      <a 
                        className="group flex items-center justify-between px-3 py-2.5 rounded-xl min-h-[44px] text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-98 transition-all duration-200 cursor-pointer" 
                        href="#instansi"
                        onClick={(e) => {
                          e.preventDefault();
                          navigateToMppSection('instansi');
                        }}
                      >
                        <span className="truncate">{t("mppPortal.instansi.title")}</span>
                        <ChevronRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-500 shrink-0" />
                      </a>
                    </li>
                    <li>
                      <a 
                        className="group flex items-center justify-between px-3 py-2.5 rounded-xl min-h-[44px] text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-98 transition-all duration-200 cursor-pointer" 
                        href="/mpp/tentang"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate('/mpp/tentang');
                        }}
                      >
                        <span className="truncate">Tentang &amp; Visi Misi</span>
                        <ChevronRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-500 shrink-0" />
                      </a>
                    </li>
                    <li>
                      <a 
                        className="group flex items-center justify-between px-3 py-2.5 rounded-xl min-h-[44px] text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-98 transition-all duration-200 cursor-pointer" 
                        href="/mpp/maklumat-pelayanan"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate('/mpp/maklumat-pelayanan');
                        }}
                      >
                        <span className="truncate">Maklumat Pelayanan &amp; SLA</span>
                        <ChevronRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-500 shrink-0" />
                      </a>
                    </li>
                    <li>
                      <a 
                        className="group flex items-center justify-between px-3 py-2.5 rounded-xl min-h-[44px] text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-98 transition-all duration-200 cursor-pointer" 
                        href="#statistik"
                        onClick={(e) => {
                          e.preventDefault();
                          navigateToMppSection('statistik');
                        }}
                      >
                        <span className="truncate">{t("mppPortal.statistik.title")}</span>
                        <ChevronRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-500 shrink-0" />
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Kolom 2: Sistem Terkait */}
                <div className="bg-slate-50/70 dark:bg-white/[0.02] sm:bg-transparent sm:dark:bg-transparent rounded-2xl p-4 sm:p-0 border border-slate-200/60 dark:border-white/5 sm:border-0">
                  <div className="flex items-center gap-2 mb-3.5 pb-2 border-b border-slate-200/60 dark:border-white/10 sm:border-0 sm:pb-0">
                    <div className="w-1.5 h-4 rounded-full bg-blue-500 shrink-0" />
                    <h4 className="font-sans text-xs sm:text-sm font-bold tracking-wider text-slate-900 dark:text-white uppercase truncate">
                      Sistem Terkait
                    </h4>
                  </div>
                  <ul className="flex flex-col gap-1 sm:gap-1.5">
                    <li>
                      <a 
                        className="group flex items-center justify-between px-3 py-2.5 rounded-xl min-h-[44px] text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 active:scale-98 transition-all duration-200" 
                        href="https://luwukab.go.id/"
                        target="_blank"
                        rel="noreferrer"
                        title="Website Resmi Pemerintah Kabupaten Luwu"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                          <span className="truncate">Website Pemkab Luwu</span>
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                      </a>
                    </li>
                    <li>
                      <a 
                        className="group flex items-center justify-between px-3 py-2.5 rounded-xl min-h-[44px] text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 active:scale-98 transition-all duration-200" 
                        href="https://oss.go.id"
                        target="_blank"
                        rel="noreferrer"
                        title="Online Single Submission (OSS RBA) BKPM RI"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                          <span className="truncate">OSS RBA</span>
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                      </a>
                    </li>
                    <li>
                      <a 
                        className="group flex items-center justify-between px-3 py-2.5 rounded-xl min-h-[44px] text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 active:scale-98 transition-all duration-200" 
                        href="https://simbg.pu.go.id"
                        target="_blank"
                        rel="noreferrer"
                        title="Sistem Informasi Manajemen Bangunan Gedung (SIMBG)"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                          <span className="truncate">SIMBG</span>
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                      </a>
                    </li>
                    <li>
                      <a 
                        className="group flex items-center justify-between px-3 py-2.5 rounded-xl min-h-[44px] text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 active:scale-98 transition-all duration-200" 
                        href="https://sicantik.layanan.go.id"
                        target="_blank"
                        rel="noreferrer"
                        title="SiCantik Cloud - Aplikasi Cerdas Layanan Perizinan Terpadu"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                          <span className="truncate">Sicantikcloud</span>
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                      </a>
                    </li>
                    <li>
                      <a 
                        className="group flex items-center justify-between px-3 py-2.5 rounded-xl min-h-[44px] text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 active:scale-98 transition-all duration-200" 
                        href="https://www.lapor.go.id"
                        target="_blank"
                        rel="noreferrer"
                        title="SP4N-LAPOR! - Sistem Pengelolaan Pengaduan Pelayanan Publik Nasional"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                          <span className="truncate">SP4N-LAPOR</span>
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Kolom 3: Dukungan & Bantuan */}
                <div className="bg-slate-50/70 dark:bg-white/[0.02] sm:bg-transparent sm:dark:bg-transparent rounded-2xl p-4 sm:p-0 border border-slate-200/60 dark:border-white/5 sm:border-0">
                  <div className="flex items-center gap-2 mb-3.5 pb-2 border-b border-slate-200/60 dark:border-white/10 sm:border-0 sm:pb-0">
                    <div className="w-1.5 h-4 rounded-full bg-teal-500 shrink-0" />
                    <h4 className="font-sans text-xs sm:text-sm font-bold tracking-wider text-slate-900 dark:text-white uppercase truncate">
                      {t("mppPortal.footer.dukungan")}
                    </h4>
                  </div>
                  <ul className="flex flex-col gap-1 sm:gap-1.5">
                    <li>
                      <a 
                        className="group flex items-center justify-between px-3 py-2.5 rounded-xl min-h-[44px] text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-98 transition-all duration-200 cursor-pointer" 
                        href="#fasilitas"
                        onClick={(e) => {
                          e.preventDefault();
                          navigateToMppSection('fasilitas');
                        }}
                      >
                        <span className="truncate">{t("mppPortal.footer.informasiFasilitas")}</span>
                        <ChevronRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-500 shrink-0" />
                      </a>
                    </li>
                    <li>
                      <a 
                        className="group flex items-center justify-between px-3 py-2.5 rounded-xl min-h-[44px] text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-98 transition-all duration-200 cursor-pointer" 
                        href="#faq"
                        onClick={(e) => {
                          e.preventDefault();
                          navigateToMppSection('faq');
                        }}
                      >
                        <span className="truncate">{t("mppPortal.footer.tanyaJawab") || "Tanya Jawab (FAQ)"}</span>
                        <ChevronRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-500 shrink-0" />
                      </a>
                    </li>
                    <li>
                      <a 
                        className="group flex items-center justify-between px-3 py-2.5 rounded-xl min-h-[44px] text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-98 transition-all duration-200" 
                        href="https://luwu-investment.vercel.app/peta-spasial" 
                        target="_blank" 
                        rel="noreferrer"
                      >
                        <span className="truncate">{t("mppPortal.footer.webgis")}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition-colors shrink-0" />
                      </a>
                    </li>
                    <li>
                      <button 
                        type="button"
                        onClick={() => setIsAiModalOpen(true)} 
                        className="group w-full flex items-center justify-between px-3 py-2.5 rounded-xl min-h-[44px] text-xs sm:text-sm font-semibold text-[#0F6B4F] dark:text-emerald-300 bg-white dark:bg-[#0C2135] border border-[#DFD8CA] dark:border-white/10 hover:border-[#0F6B4F]/50 transition-all duration-200 cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Headphones className="w-4 h-4 text-[#0F6B4F] dark:text-emerald-400 shrink-0" />
                          <span>Konsultasi Asisten MPP</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#0F6B4F] dark:text-emerald-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Bottom Symmetrical Copyright Bar */}
            <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2 text-center md:text-left">
                <span>© {new Date().getFullYear()} MPP Simpurusiang Kabupaten Luwu.</span>
                <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
                <span className="hidden sm:inline">{t("mppPortal.footer.integratedServiceDot", "Pelayanan Publik Terintegrasi.")}</span>
              </div>
              <div className="flex items-center gap-2 text-center md:text-right font-medium text-slate-600 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t("mppPortal.footer.agencyText")}</span>
              </div>
            </div>
          </motion.div>
        </footer>

        {/* Android Native-Style Bottom Navigation Bar (Single Active Focus & Zero Truncation) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#081A2C]/95 backdrop-blur-xl border-t border-slate-200/85 dark:border-white/[0.08] px-1 pt-1.5 grid grid-cols-5 items-center shadow-[0_-4px_20px_rgba(15,23,42,0.05)] dark:shadow-[0_-8px_28px_rgba(0,0,0,0.6)] pb-[calc(env(safe-area-inset-bottom,0px)+8px)]">
          <button 
            type="button"
            onClick={() => navigateToMppSection('hero')}
            className="flex flex-col items-center justify-center gap-1 min-h-[46px] py-0.5 transition-colors cursor-pointer"
          >
            <span
              className={`h-7 px-3 rounded-full flex items-center justify-center transition-all ${
                !showQuickNav
                  ? 'bg-emerald-500/12 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Home className="w-[18px] h-[18px]" />
            </span>
            <span
              className={`mobile-dock-label font-sans whitespace-nowrap ${
                !showQuickNav
                  ? 'font-bold text-emerald-700 dark:text-emerald-400'
                  : 'font-medium text-slate-600 dark:text-slate-400'
              }`}
            >
              {t("mppPortal.nav.beranda")}
            </span>
          </button>

          <button 
            type="button"
            onClick={() => navigateToMppSection('layanan')}
            className="flex flex-col items-center justify-center gap-1 min-h-[46px] py-0.5 transition-colors cursor-pointer"
          >
            <span
              className={`h-7 px-3 rounded-full flex items-center justify-center transition-all ${
                showQuickNav && !['instansi', 'fasilitas'].includes(activeSectionId)
                  ? 'bg-emerald-500/12 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <LayoutGrid className="w-[18px] h-[18px]" />
            </span>
            <span
              className={`mobile-dock-label font-sans whitespace-nowrap ${
                showQuickNav && !['instansi', 'fasilitas'].includes(activeSectionId)
                  ? 'font-bold text-emerald-700 dark:text-emerald-400'
                  : 'font-medium text-slate-600 dark:text-slate-400'
              }`}
            >
              {t("mppPortal.nav.layanan")}
            </span>
          </button>

          {/* Integrated Baseline-Aligned Center Action: Neutral Glass Pill (No Dual-Green Focus Clash) */}
          <button 
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-mpp-voice-assistant'));
            }}
            className="flex flex-col items-center justify-center gap-1 min-h-[46px] py-0.5 transition-transform active:scale-95 cursor-pointer group"
            title="Asisten MPP - Tanya Suara Layanan & Persyaratan"
            aria-label="Asisten MPP Tanya Suara"
          >
            <span className="h-7 w-10 rounded-full bg-slate-100 dark:bg-white/[0.07] group-hover:bg-emerald-500/15 dark:group-hover:bg-emerald-400/20 border border-slate-200/90 dark:border-white/[0.12] flex items-center justify-center text-slate-700 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
              <Mic className="w-4 h-4" />
            </span>
            <span className="mobile-dock-label font-medium text-slate-600 dark:text-slate-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 font-sans whitespace-nowrap">
              {t("mppPortal.nav.asistenShort", "Asisten")}
            </span>
          </button>

          <button 
            type="button"
            onClick={() => navigateToMppSection('instansi')}
            className="flex flex-col items-center justify-center gap-1 min-h-[46px] py-0.5 transition-colors cursor-pointer"
          >
            <span
              className={`h-7 px-3 rounded-full flex items-center justify-center transition-all ${
                showQuickNav && activeSectionId === 'instansi'
                  ? 'bg-emerald-500/12 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Building2 className="w-[18px] h-[18px]" />
            </span>
            <span
              className={`mobile-dock-label font-sans whitespace-nowrap ${
                showQuickNav && activeSectionId === 'instansi'
                  ? 'font-bold text-emerald-700 dark:text-emerald-400'
                  : 'font-medium text-slate-600 dark:text-slate-400'
              }`}
            >
              {t("mppPortal.nav.instansi")}
            </span>
          </button>

          <button 
            type="button"
            onClick={() => navigateToMppSection('fasilitas')}
            className="flex flex-col items-center justify-center gap-1 min-h-[46px] py-0.5 transition-colors cursor-pointer"
          >
            <span
              className={`h-7 px-3 rounded-full flex items-center justify-center transition-all ${
                showQuickNav && activeSectionId === 'fasilitas'
                  ? 'bg-emerald-500/12 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Armchair className="w-[18px] h-[18px]" />
            </span>
            <span
              className={`mobile-dock-label font-sans whitespace-nowrap ${
                showQuickNav && activeSectionId === 'fasilitas'
                  ? 'font-bold text-emerald-700 dark:text-emerald-400'
                  : 'font-medium text-slate-600 dark:text-slate-400'
              }`}
            >
              {t("mppPortal.nav.fasilitas")}
            </span>
          </button>
        </nav>

        {/* Fitur 8: Interactive Virtual Helpdesk Modal */}
        {isHelpdeskModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 bg-surface/60 backdrop-blur-sm overflow-y-auto font-sans"
            onClick={() => setIsHelpdeskModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 25, filter: "blur(6px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.94, y: 20, filter: "blur(4px)" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full max-w-lg my-auto max-h-[85vh] sm:max-h-[88vh] bg-white dark:bg-surface border border-slate-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl overflow-y-auto flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Modal */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-4.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-sans">
                      Helpdesk MPP
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Online Fast Response
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-sans mt-1.5">
                    {t("mppPortal.helpdeskModal.title")}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t("mppPortal.helpdeskModal.subtitle")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHelpdeskModalOpen(false)}
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  aria-label={t("common.close", "Tutup")}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Konten Form / Sukses */}
              {isHelpdeskSubmitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-8 text-center flex flex-col items-center"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white font-sans">
                    {t("mppPortal.helpdeskModal.successTitle")}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-sm">
                    {t("mppPortal.helpdeskModal.successDesc")}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-6 w-full">
                    <button
                      type="button"
                      onClick={() => setIsHelpdeskModalOpen(false)}
                      className="w-full sm:flex-1 min-h-[44px] px-6 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold font-sans hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                      {t("common.close") || "Selesai"}
                    </button>
                    <a
                      href={`https://wa.me/628114201234?text=${encodeURIComponent(`Halo Petugas Helpdesk MPP Simpurusiang, nama saya ${helpdeskForm.nama || 'Warga'}, topik: ${helpdeskForm.kategori}. Pesan: ${helpdeskForm.pesan}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:flex-1 min-h-[44px] px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-semibold font-sans shadow-md shadow-black/25 transition-all flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{t("mppPortal.contact.chatWhatsapp")}</span>
                    </a>
                  </div>
                </motion.div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setIsHelpdeskSubmitted(true);
                  }}
                  className="mt-5 space-y-4"
                >
                  {/* Nama */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 font-sans">
                      {t("mppPortal.helpdeskModal.nameLabel")}
                    </label>
                    <input
                      type="text"
                      required
                      value={helpdeskForm.nama}
                      onChange={(e) => setHelpdeskForm(prev => ({ ...prev, nama: e.target.value }))}
                      placeholder={t("mppPortal.helpdeskModal.namePlaceholder")}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Telepon / WhatsApp */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 font-sans">
                      {t("mppPortal.helpdeskModal.phoneLabel")}
                    </label>
                    <input
                      type="tel"
                      required
                      value={helpdeskForm.telepon}
                      onChange={(e) => setHelpdeskForm(prev => ({ ...prev, telepon: e.target.value }))}
                      placeholder={t("mppPortal.helpdeskModal.phonePlaceholder")}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Topik Layanan */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 font-sans">
                      {t("mppPortal.helpdeskModal.topicLabel")}
                    </label>
                    <select
                      value={helpdeskForm.kategori}
                      onChange={(e) => setHelpdeskForm(prev => ({ ...prev, kategori: e.target.value }))}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="Perizinan DPMPTSP">{t("mppPortal.helpdesk.topics.dpmptsp")}</option>
                      <option value="PBG & Tata Ruang">{t("mppPortal.helpdesk.topics.pbg")}</option>
                      <option value="Kependudukan Dukcapil">{t("mppPortal.helpdesk.topics.disdukcapil")}</option>
                      <option value="Pajak Daerah Bapenda">{t("mppPortal.helpdesk.topics.bapenda")}</option>
                      <option value="SAMSAT & Kepolisian">{t("mppPortal.helpdesk.topics.samsat")}</option>
                      <option value="Lainnya">{t("mppPortal.helpdesk.topics.other")}</option>
                    </select>
                  </div>

                  {/* Rincian Pesan */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 font-sans">
                      {t("mppPortal.helpdeskModal.msgLabel")}
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={helpdeskForm.pesan}
                      onChange={(e) => setHelpdeskForm(prev => ({ ...prev, pesan: e.target.value }))}
                      placeholder={t("mppPortal.helpdeskModal.msgPlaceholder")}
                      className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Tombol Aksi */}
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsHelpdeskModalOpen(false)}
                      className="flex-1 min-h-[44px] py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-semibold font-sans hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      {t("common.close") || "Batal"}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 min-h-[44px] py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs sm:text-sm font-semibold font-sans shadow-lg shadow-black/25 transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>{t("mppPortal.helpdeskModal.sendBtn")}</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}

        {/* --- FITUR 10: MODAL DETAIL DIREKTORI INSTANSI --- */}
        {selectedAgencyDetail && (() => {
          const activeAgency = getLocalizedAgency(selectedAgencyDetail, i18n.language);
          return (
          <div 
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 bg-surface/60 backdrop-blur-sm overflow-y-auto font-sans"
            onClick={() => setSelectedAgencyDetail(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full max-w-2xl bg-white dark:bg-surface border border-slate-200 dark:border-white/10 rounded-2xl md:rounded-3xl p-4 sm:p-6 shadow-xl overflow-y-auto text-slate-900 dark:text-white font-sans flex flex-col max-h-[90dvh] md:max-h-[85dvh]"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const fullCategory = activeAgency.kategori || "Instansi Terpadu";
                let shortCategory = fullCategory;
                const catLower = fullCategory.toLowerCase();
                if (catLower.includes("daerah") || catLower.includes("opd")) {
                  shortCategory = "Pemerintah Daerah";
                } else if (catLower.includes("vertikal") || catLower.includes("kementerian") || catLower.includes("lembaga")) {
                  shortCategory = "Kementerian / Lembaga";
                } else if (catLower.includes("bumn") || catLower.includes("bumd") || catLower.includes("bank")) {
                  shortCategory = "BUMN / BUMD";
                } else if (catLower.includes("polisi") || catLower.includes("hukum") || catLower.includes("kejaksaan")) {
                  shortCategory = "Kepolisian & Hukum";
                }

                const namaResmi = activeAgency.namaResmi || activeAgency.fullName || activeAgency.nama;

                return (
                  <>
                    {/* Header Modal Detail Instansi: Grid [Logo 72px | 1fr | Tombol Tutup 44px] */}
                    <div className="grid grid-cols-[72px_1fr_44px] gap-x-3.5 sm:gap-x-4 gap-y-1.5 pb-4 border-b border-slate-100 dark:border-white/10 items-start">
                      {/* Kolom 1: Logo 72px mencakup 2 baris */}
                      <div className="col-start-1 row-start-1 row-span-2">
                        <AgencyLogo 
                          name={namaResmi} 
                          logo={activeAgency.logo} 
                          size="modal" 
                          rounded="xl"
                        />
                      </div>

                      {/* Kolom 2 Baris 1: Badge Kategori (rounded-md, 11px, nowrap) + Chip Lantai */}
                      <div className="col-start-2 row-start-1 flex flex-wrap items-center gap-2 min-w-0 pr-1">
                        <span 
                          title={fullCategory}
                          className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 whitespace-nowrap cursor-default"
                        >
                          {shortCategory}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 whitespace-nowrap">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          {activeAgency.loket || "Lantai 1"}
                        </span>
                      </div>

                      {/* Kolom 3 Baris 1: Tombol Tutup 44px (touch target >= 44px, tidak menimpa judul) */}
                      <div className="col-start-3 row-start-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedAgencyDetail(null)}
                          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          aria-label={t("common.close", "Tutup")}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Kolom 2-3 Baris 2: Judul Memanjang ke Tepi Kanan di Bawah Tombol Tutup */}
                      <div className="col-start-2 col-span-2 row-start-2 min-w-0 pt-0.5">
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-3">
                          {namaResmi}
                        </h3>
                      </div>
                    </div>

                    {/* Deskripsi & Jam Pelayanan */}
                    <div className="mt-4 space-y-3.5">
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                          {t("agencyModal.about", "Tentang Instansi")}
                        </span>
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {activeAgency.deskripsi && activeAgency.deskripsi !== "test" ? activeAgency.deskripsi : activeAgency.layanan}
                        </p>
                        
                        {/* Format Jam Layanan Standar E1 */}
                        <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-white/5 flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <Clock3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">Jam Layanan: </span>
                            <span>{activeAgency.jamLayanan || "Senin–Kamis 07.30–16.00 · Jumat 07.30–16.30 WITA"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Daftar Layanan Terintegrasi (Jarak Antar-Butir gap-2 / 8px Seragam) */}
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-emerald-500" />
                          <span>{t("agencyModal.serviceList", "Daftar Layanan")}</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(activeAgency.layananList || [activeAgency.layanan]).map((layanan, lIdx) => (
                            <div 
                              key={lIdx}
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-white/5 flex items-start gap-2"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-tight">
                                {layanan}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Ketentuan & Persyaratan Umum */}
                      {activeAgency.syaratUmum && activeAgency.syaratUmum.length > 0 && (
                        <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-sky-950/30 border border-blue-200 dark:border-sky-800/50">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-sky-400 block mb-1.5 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{t("agencyModal.requirements", "Persyaratan Umum")}</span>
                          </span>
                          <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                            {activeAgency.syaratUmum.map((syarat, sIdx) => (
                              <li key={sIdx} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-sky-400 shrink-0"></span>
                                <span>{syarat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

                {/* Tombol Aksi Bawah */}
                <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const agencyName = selectedAgencyDetail.nama;
                      const defaultService = selectedAgencyDetail.layananList?.[0] || selectedAgencyDetail.layanan;
                      setQueueForm(prev => ({
                        ...prev,
                        agency: agencyName,
                        service: defaultService
                      }));
                      setIsQueueSubmitted(false);
                      setSelectedAgencyDetail(null);
                      setIsQueueBookingOpen(true);
                    }}
                    className="w-full sm:flex-1 min-h-[48px] py-3 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs sm:text-sm font-semibold font-sans shadow-lg shadow-black/25 transition-all flex items-center justify-center gap-2"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>{t("agencyModal.bookQueueBtn")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHelpdeskForm(prev => ({
                        ...prev,
                        kategori: selectedAgencyDetail.nama
                      }));
                      setIsHelpdeskSubmitted(false);
                      setSelectedAgencyDetail(null);
                      setIsHelpdeskModalOpen(true);
                    }}
                    className="w-full sm:flex-1 min-h-[48px] py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold font-sans transition-all flex items-center justify-center gap-2"
                  >
                    <Headphones className="w-4 h-4 text-emerald-500" />
                    <span>{t("agencyModal.helpdeskBtn")}</span>
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}

        {/* --- FITUR 11: MODAL BOOKING ANTREAN ONLINE & DIGITAL E-TICKET PASS --- */}
        {isQueueBookingOpen && (
          <div 
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-3 sm:p-6 bg-surface/60 backdrop-blur-sm overflow-hidden font-sans"
            onClick={() => setIsQueueBookingOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 25, filter: "blur(6px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.94, y: 20, filter: "blur(4px)" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full max-w-lg max-h-[85vh] bg-white dark:bg-surface border border-slate-200 dark:border-white/10 rounded-3xl p-5 sm:p-8 shadow-2xl overflow-y-auto flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Modal */}
              <div className="pb-4 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-4.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-sans">
                        {t("bookingModal.badge", "Antrean Digital MPP")}
                      </span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Ticket className="w-3.5 h-3.5" />
                        {t("bookingModal.quotaAvailable", "Kuota Tersedia")}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-white font-sans mt-1.5">
                      {isQueueSubmitted && generatedTicket ? t("bookingModal.ticketDigitalTitle", "Tiket Digital & Evaluasi Layanan") : t("bookingModal.title")}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {isQueueSubmitted && generatedTicket 
                        ? t("bookingModal.ticketDigitalSubtitle", "E-Pass resmi antrean MPP Luwu & portal Survei Kepuasan Masyarakat") 
                        : t("bookingModal.subtitle")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsQueueBookingOpen(false)}
                    className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    aria-label={t("common.close", "Tutup")}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Tab Switcher jika tiket sudah ada */}
                {activeTicket && (
                  <div className="flex items-center gap-1.5 mt-3 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        setGeneratedTicket(activeTicket);
                        setIsQueueSubmitted(true);
                      }}
                      className={`flex-1 min-h-[36px] py-1.5 px-3 rounded-lg text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isQueueSubmitted 
                          ? 'bg-emerald-600 text-white shadow-sm' 
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>{t("bookingModal.tabActiveTicket", "E-Pass Tiket Aktif")}</span>
                      {activeTicket.number && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 font-mono">
                          {activeTicket.number}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsQueueSubmitted(false)}
                      className={`flex-1 min-h-[36px] py-1.5 px-3 rounded-lg text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        !isQueueSubmitted 
                          ? 'bg-emerald-600 text-white shadow-sm' 
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t("bookingModal.tabNewQueue", "Ambil Antrean Baru")}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Konten: Form Booking atau Tiket Terbit */}
              {isQueueSubmitted && generatedTicket ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-4 flex flex-col items-center"
                >
                  {/* Digital E-Ticket Card Layout */}
                  <div className="w-full bg-gradient-to-b from-emerald-600 to-emerald-800 text-white rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
                    {/* Pattern background */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between border-b border-white/20 pb-3 mb-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-200">
                          {t("bookingModal.ticketCardTitle")}
                        </span>
                        <div className="text-xs font-bold text-white">{t("mppPortal.general.mppLuwu")}</div>
                      </div>
                      <span className="px-4 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider text-white">
                        {t("bookingModal.officialPass", "E-Pass Resmi")}
                      </span>
                    </div>

                    <div className="text-center py-2">
                      <span className="text-xs text-emerald-200 uppercase tracking-wider font-semibold">
                        {t("bookingModal.ticketNumberLabel")}
                      </span>
                      <div className="text-4xl sm:text-5xl font-black font-sans tracking-tight text-white my-1 drop-shadow-md">
                        {generatedTicket.number}
                      </div>
                      <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-bold text-emerald-100 backdrop-blur-sm mt-1">
                        {generatedTicket.counter}
                      </span>
                    </div>

                    {/* Dashed divider */}
                    <div className="border-t border-dashed border-white/30 my-4 relative">
                      <div className="absolute -left-9 -top-3 w-6 h-6 bg-white dark:bg-surface rounded-full" />
                      <div className="absolute -right-9 -top-3 w-6 h-6 bg-white dark:bg-surface rounded-full" />
                    </div>

                    {/* Metadata Tiket */}
                    <div className="space-y-2 text-xs text-emerald-100">
                      <div className="flex justify-between">
                        <span className="text-emerald-200">{t("bookingModal.applicantName")}:</span>
                        <span className="font-bold text-white">{generatedTicket.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-200">{t("bookingModal.agencyLabel")}:</span>
                        <span className="font-bold text-white">{generatedTicket.agency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-200">{t("bookingModal.serviceLabel")}:</span>
                        <span className="font-bold text-white text-right max-w-[200px] truncate">{generatedTicket.service}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-200">{t("bookingModal.dateLabel")}:</span>
                        <span className="font-bold text-white">{generatedTicket.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-200">{t("bookingModal.estArrival")}:</span>
                        <span className="font-bold text-white">{generatedTicket.estimation}</span>
                      </div>
                    </div>

                    {/* Barcode / QR Simulation */}
                    <div className="mt-5 pt-3 border-t border-white/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-8 h-8 text-white" />
                        <div className="text-[10px] text-emerald-200 leading-tight">
                          {t("mppPortal.bookingModal.showToReceptionist", t("bookingModal.showToReceptionist", "Tunjukkan tiket ini ke petugas resepsionis"))}
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-200 font-mono">
                        REF#{generatedTicket.number}-{(generatedTicket.date || '').replace(/-/g, '').slice(-4) || 'LUWU'}
                      </span>
                    </div>
                  </div>

                  {/* Status Pelayanan Real-time */}
                  <div className={`mt-4 p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 w-full transition-all ${
                    (generatedTicket.status === 'selesai_langsung' || generatedTicket.status === 'selesai')
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                      : generatedTicket.status === 'dipanggil'
                      ? 'bg-amber-500/15 border-2 border-amber-400 text-amber-900 dark:text-amber-200 shadow-lg shadow-amber-500/20'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-500/30 text-amber-800 dark:text-amber-200'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          (generatedTicket.status === 'selesai_langsung' || generatedTicket.status === 'selesai')
                            ? 'bg-emerald-400'
                            : 'bg-amber-400'
                        }`} />
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                          (generatedTicket.status === 'selesai_langsung' || generatedTicket.status === 'selesai')
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`} />
                      </span>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">{t("bookingModal.queueStatusLabel", "Status Antrean:")}</span>
                        <span className="font-bold font-sans">
                          {(generatedTicket.status === 'selesai_langsung' || generatedTicket.status === 'selesai')
                            ? t("bookingModal.statusCompleted", "✅ Pelayanan Selesai")
                            : generatedTicket.status === 'dipanggil'
                            ? t("bookingModal.statusCalled", "🔊 Sedang Dipanggil di Loket!")
                            : generatedTicket.status === 'dilayani'
                            ? t("bookingModal.statusBeingServed", "💼 Sedang Dilayani Petugas")
                            : t("bookingModal.statusWaiting", "⏳ Menunggu Panggilan di Loket")}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/70 dark:bg-black/30 border border-current/10">
                      {generatedTicket.status === 'dipanggil' ? t("bookingModal.badgeCalled", "DIPANGGIL") : (generatedTicket.status === 'selesai_langsung' || generatedTicket.status === 'selesai') ? t("bookingModal.badgeDone", "Selesai") : t("bookingModal.badgeActive", "Aktif")}
                    </span>
                  </div>

                  {/* Banner Panggilan Operator Aktif */}
                  {generatedTicket.status === 'dipanggil' && (
                    <div className="w-full mt-3 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-emerald-500/20 border-2 border-amber-400 text-left shadow-xl shadow-amber-500/20 animate-pulse">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-black text-xs sm:text-sm font-sans">
                          <Volume2 className="w-5 h-5 text-amber-500 animate-bounce" />
                          <span>{t("bookingModal.callInProgressTitle", "PANGGILAN LOKET SEDANG BERLANGSUNG!")}</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950 uppercase font-mono">
                          {t("mppPortal.general.counterShort", "Loket")} {generatedTicket.counter}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed">
                        {t("bookingModal.callInProgressDesc", "Petugas gerai {{agency}} sedang memanggil nomor antrean Anda. Segera menuju Loket {{counter}}.", { agency: generatedTicket.agency, counter: generatedTicket.counter })}
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsCallingAlertOpen(true)}
                        className="w-full mt-3 min-h-[44px] py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm font-sans shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                      >
                        <Radio className="w-4 h-4" />
                        <span>{t("bookingModal.openCallingScreenBtn", "Buka Layar Panggilan Penuh (Bel Bandara & Getar)")}</span>
                      </button>
                    </div>
                  )}

                  {/* Section Menu Survei Kepuasan Masyarakat (SKM PermenPAN-RB No. 14 Tahun 2017) */}
                  {(generatedTicket.status === 'selesai_langsung' || generatedTicket.status === 'selesai') ? (
                    <div className="w-full mt-3 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-emerald-500/5 border-2 border-emerald-500/40 text-left shadow-lg shadow-black/25">
                      <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-xs sm:text-sm font-sans">
                        <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 animate-spin" />
                        <span>{t("bookingModal.skmActiveTitle", "Pelayanan Selesai — Survei SKM Aktif")}</span>
                        <span className="ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-sm">
                          {t("bookingModal.readyToRate", "Siap Dinilai")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed">
                        {t("bookingModal.skmActiveDesc", "Layanan Anda di {{agency}} telah selesai. Sesuai Permen PAN-RB No. 14/2017, silakan isi 9 indikator survei kepuasan masyarakat untuk evaluasi berkala mutu MPP Simpurusiang Belopa.", { agency: generatedTicket.agency })}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsQueueBookingOpen(false);
                          setSurveyForm(prev => ({ ...prev, instansi: generatedTicket.agency || 'DPMPTSP' }));
                          setIsSurveyModalOpen(true);
                        }}
                        className="w-full mt-3 min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs sm:text-sm font-bold font-sans shadow-lg shadow-black/25 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                      >
                        <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                        <span>{t("bookingModal.fillSurveyBtn", "Isi Survei Kepuasan (9 Unsur SKM) Sekarang")}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full mt-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-left">
                      <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm font-sans">
                        <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>{t("bookingModal.skmLockedTitle", "Survei Kepuasan Masyarakat (SKM)")}</span>
                        <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {t("bookingModal.locked", "Terkunci")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                        {t("bookingModal.skmLockedDesc", "Sesuai regulasi Permen PAN-RB No. 14 Tahun 2017, formulir survei evaluasi mutu pelayanan hanya akan aktif setelah Anda selesai mendapatkan pelayanan dari petugas di loket.")}
                      </p>
                      <button
                        type="button"
                        disabled
                        className="w-full mt-3 min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-200 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-semibold font-sans cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Lock className="w-4 h-4" />
                        <span>{t("bookingModal.surveyWaitingBtn", "Survei Terkunci (Menunggu Layanan Selesai)")}</span>
                      </button>
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-white/10 flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        <Radio className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>
                          Status panggilan loket dan pembukaan survei SKM tersinkronisasi otomatis secara real-time saat petugas gerai melayani nomor tiket Anda.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Feedback Bar Tiket Disematkan */}
                  <div className="mt-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 w-full">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{t("bookingModal.pinnedNotice")}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 w-full">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(generatedTicket.number);
                        setIsTicketCopied(true);
                        setTimeout(() => setIsTicketCopied(false), 2000);
                      }}
                      className="min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold font-sans transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isTicketCopied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-500" />
                          <span>{t("mppPortal.general.copied")}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>{t("bookingModal.copyCodeBtn")}</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => printMppQueueTicket(generatedTicket)}
                      className="min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold font-sans transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>{t("bookingModal.printTicketBtn")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsQueueSubmitted(false)}
                      className="min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold font-sans transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t("bookingModal.tabNewQueue", "Ambil Antrean Baru")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelActiveTicket}
                      className="min-h-[42px] px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold font-sans transition-all flex items-center justify-center gap-2 cursor-pointer border border-rose-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{t("bookingModal.cancelQueueBtn", "Batalkan Antrean")}</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="mt-5 space-y-3.5">
                  {/* Banner Notifikasi Tell Us Once jika NIK terverifikasi */}
                  {nikLookupNotice && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-200 font-medium"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{nikLookupNotice}</span>
                    </motion.div>
                  )}

                  {/* Nama */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans">
                        {t("bookingModal.fullNameLabel")} <span className="text-rose-500">*</span>
                      </label>
                      {isNameFormatValid(queueForm.nama) && (
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Valid
                        </span>
                      )}
                    </div>
                     <input
                      type="text"
                      required
                      value={queueForm.nama}
                      disabled={isCitizenRegistered}
                      onChange={(e) => {
                        const val = e.target.value;
                        setQueueForm(prev => ({ ...prev, nama: val }));
                        setQueueFormTouched(prev => ({ ...prev, nama: true }));
                        if (!val.trim()) {
                          setQueueFormErrors(prev => ({ ...prev, nama: 'Nama lengkap wajib diisi sesuai KTP' }));
                        } else if (val.trim().length < 3) {
                          setQueueFormErrors(prev => ({ ...prev, nama: 'Nama minimal 3 karakter huruf' }));
                        } else {
                          setQueueFormErrors(prev => ({ ...prev, nama: undefined }));
                        }
                      }}
                      onBlur={() => setQueueFormTouched(prev => ({ ...prev, nama: true }))}
                      placeholder={t("bookingModal.fullNamePlaceholder")}
                      className={`w-full min-h-[44px] px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${
                        isCitizenRegistered ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 cursor-not-allowed border-dashed' : ''
                      } ${
                        queueFormTouched.nama && queueFormErrors.nama
                          ? 'border-rose-400 dark:border-rose-600 focus:ring-2 focus:ring-rose-500'
                          : isNameFormatValid(queueForm.nama)
                          ? 'border-emerald-400 dark:border-emerald-600 focus:ring-2 focus:ring-emerald-500'
                          : 'border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-emerald-500'
                      }`}
                    />
                    {queueFormTouched.nama && queueFormErrors.nama && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3 h-3 shrink-0" /> {queueFormErrors.nama}
                      </p>
                    )}
                  </div>

                  {/* NIK & Telepon Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* NIK (16 Digit) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans">
                          {t("bookingModal.nikLabel")} <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex items-center gap-1.5">
                          {isLookingUpNik ? (
                            <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                              <Loader2 className="w-2.5 h-2.5 animate-spin" /> Cek DB...
                            </span>
                          ) : isNikFormatValid(queueForm.nik) ? (
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" /> 16 Digit
                            </span>
                          ) : (
                            <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded ${
                              queueForm.nik.length > 0 ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300' : 'text-slate-400'
                            }`}>
                              {queueForm.nik.length}/16
                            </span>
                          )}
                        </div>
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        maxLength={16}
                        value={queueForm.nik}
                        onChange={async (e) => {
                          const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
                          setQueueForm(prev => ({ ...prev, nik: raw }));
                          setQueueFormTouched(prev => ({ ...prev, nik: true }));
                          setIsCitizenRegistered(false);

                          if (raw.length === 0) {
                            setQueueFormErrors(prev => ({ ...prev, nik: 'NIK wajib diisi' }));
                          } else if (raw.length < 16) {
                            setQueueFormErrors(prev => ({ ...prev, nik: `NIK harus 16 digit angka (${raw.length}/16)` }));
                          } else {
                            setQueueFormErrors(prev => ({ ...prev, nik: undefined }));

                            // Auto lookup ke tabel mpp_citizens (Tell Us Once)
                            setIsLookingUpNik(true);
                            try {
                              const { data: citizenData } = await supabase
                                .from('mpp_citizens')
                                .select('*')
                                .eq('nik', raw)
                                .maybeSingle();

                              if (citizenData) {
                                setIsCitizenRegistered(true);
                                setQueueForm(prev => ({
                                  ...prev,
                                  nama: citizenData.full_name || prev.nama,
                                  phone: citizenData.phone_number || prev.phone,
                                  gender: (citizenData.jenis_kelamin || citizenData.gender || prev.gender) as 'Laki-laki' | 'Perempuan',
                                  occupation: citizenData.pekerjaan || citizenData.occupation || prev.occupation
                                }));
                                setNikLookupNotice(`Data warga terdeteksi: ${citizenData.full_name} (${citizenData.pekerjaan || citizenData.occupation || 'Warga'})`);
                                setTimeout(() => setNikLookupNotice(null), 6000);
                              }
                            } catch (err) {
                              console.error('Gagal lookup NIK warga:', err);
                            } finally {
                              setIsLookingUpNik(false);
                            }
                          }
                        }}
                        onBlur={() => setQueueFormTouched(prev => ({ ...prev, nik: true }))}
                        placeholder={t("mppPortal.placeholders.nik")}
                        className={`w-full min-h-[44px] px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border text-xs sm:text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${
                          queueFormTouched.nik && queueFormErrors.nik
                            ? 'border-rose-400 dark:border-rose-600 focus:ring-2 focus:ring-rose-500'
                            : isNikFormatValid(queueForm.nik)
                            ? 'border-emerald-400 dark:border-emerald-600 focus:ring-2 focus:ring-emerald-500'
                            : 'border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-emerald-500'
                        }`}
                      />
                      {queueFormTouched.nik && queueFormErrors.nik ? (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3 h-3 shrink-0" /> {queueFormErrors.nik}
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                          {queueForm.nik.startsWith('7317') ? '📍 Wilayah Kab. Luwu (7317)' : '16 digit angka KTP-el'}
                        </p>
                      )}
                    </div>

                    {/* WhatsApp / Telepon */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans">
                          {t("bookingModal.phoneLabel")} <span className="text-rose-500">*</span>
                        </label>
                        {isPhoneFormatValid(queueForm.phone) && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> WA Valid
                          </span>
                        )}
                      </div>
                      <input
                        type="tel"
                        inputMode="tel"
                        required
                        value={queueForm.phone}
                        disabled={isCitizenRegistered}
                        onChange={(e) => {
                          let val = e.target.value.replace(/[^\d+]/g, '');
                          if (val.indexOf('+') > 0) val = val.replace(/\+/g, '');
                          setQueueForm(prev => ({ ...prev, phone: val }));
                          setQueueFormTouched(prev => ({ ...prev, phone: true }));

                          if (!val.trim()) {
                            setQueueFormErrors(prev => ({ ...prev, phone: 'Nomor WhatsApp/HP wajib diisi' }));
                          } else if (!isPhoneFormatValid(val)) {
                            setQueueFormErrors(prev => ({ ...prev, phone: 'Format salah: gunakan awalan 08 atau 628 (10-14 digit)' }));
                          } else {
                            setQueueFormErrors(prev => ({ ...prev, phone: undefined }));
                          }
                        }}
                        onBlur={() => setQueueFormTouched(prev => ({ ...prev, phone: true }))}
                        placeholder={t("mppPortal.placeholders.phone")}
                        className={`w-full min-h-[44px] px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border text-xs sm:text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${
                          isCitizenRegistered ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 cursor-not-allowed border-dashed' : ''
                        } ${
                          queueFormTouched.phone && queueFormErrors.phone
                            ? 'border-rose-400 dark:border-rose-600 focus:ring-2 focus:ring-rose-500'
                            : isPhoneFormatValid(queueForm.phone)
                            ? 'border-emerald-400 dark:border-emerald-600 focus:ring-2 focus:ring-emerald-500'
                            : 'border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-emerald-500'
                        }`}
                      />
                      {queueFormTouched.phone && queueFormErrors.phone ? (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3 h-3 shrink-0" /> {queueFormErrors.phone}
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                          {t("bookingModal.phonePlaceholderDesc", "Contoh: 081234567890 (Aktif untuk notifikasi panggilan)")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* BUAT KATA SANDI (UNTUK LOGIN BERIKUTNYA) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans">
                        BUAT KATA SANDI (UNTUK LOGIN BERIKUTNYA)
                      </label>
                      <span className="text-[10px] text-slate-400 font-medium">Opsional / Rekomendasi</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showQueuePassword ? "text" : "password"}
                        value={queueForm.password}
                        onChange={(e) => setQueueForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Minimal 6 karakter (Opsional / Rekomendasi)"
                        className="w-full min-h-[44px] px-3.5 py-2 pr-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowQueuePassword(!showQueuePassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        {showQueuePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      Kata sandi ini digunakan jika Anda ingin masuk tanpa kode OTP WA di kunjungan berikutnya.
                    </p>
                  </div>

                  {/* Jenis Kelamin & Pekerjaan Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 font-sans">
                        {t("bookingModal.genderLabel", "Jenis Kelamin")} <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={queueForm.gender}
                        onChange={(e) => setQueueForm(prev => ({ ...prev, gender: e.target.value as 'Laki-laki' | 'Perempuan' }))}
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                      >
                        <option value="Laki-laki">{t("bookingModal.genderMale", "Laki-laki")}</option>
                        <option value="Perempuan">{t("bookingModal.genderFemale", "Perempuan")}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 font-sans">
                        {t("bookingModal.occupationLabel", "Pekerjaan")} <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={queueForm.occupation}
                        onChange={(e) => setQueueForm(prev => ({ ...prev, occupation: e.target.value }))}
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                      >
                        <option value="PNS / TNI / POLRI">{t("bookingModal.occupations.pns", "PNS / TNI / POLRI")}</option>
                        <option value="Pegawai BUMN / Swasta">{t("bookingModal.occupations.bumnSwasta", "Pegawai BUMN / Swasta")}</option>
                        <option value="Wiraswasta / Pelaku Usaha">{t("bookingModal.occupations.wiraswasta", "Wiraswasta / Pelaku Usaha")}</option>
                        <option value="Petani / Pekebun / Nelayan">{t("bookingModal.occupations.petani", "Petani / Pekebun / Nelayan")}</option>
                        <option value="Pelajar / Mahasiswa">{t("bookingModal.occupations.pelajar", "Pelajar / Mahasiswa")}</option>
                        <option value="Tenaga Medis / Kesehatan">{t("bookingModal.occupations.medis", "Tenaga Medis / Kesehatan")}</option>
                        <option value="Guru / Dosen / Pendidik">{t("bookingModal.occupations.guru", "Guru / Dosen / Pendidik")}</option>
                        <option value="Ibu Rumah Tangga">{t("bookingModal.occupations.irt", "Ibu Rumah Tangga")}</option>
                        <option value="Lainnya / Belum Bekerja">{t("bookingModal.occupations.lainnya", "Lainnya / Belum Bekerja")}</option>
                      </select>
                    </div>
                  </div>

                  {/* Instansi Tujuan */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 font-sans">
                      {t("bookingModal.selectAgencyLabel")} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={queueForm.agency}
                      onChange={(e) => {
                        const newAgency = e.target.value;
                        const match = liveAgencies.find(a => a.nama === newAgency);
                        setQueueForm(prev => ({
                          ...prev,
                          agency: newAgency,
                          service: match?.layananList?.[0] || match?.layanan || t("bookingModal.integratedServiceFallback", "Pelayanan Terpadu")
                        }));
                      }}
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                    >
                      {liveAgencies.map((item, idx) => {
                        const loc = getLocalizedAgency(item, i18n.language);
                        return (
                          <option key={idx} value={item.nama}>
                            {loc.nama} — {loc.kategori} ({loc.loket})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Layanan Spesifik */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 font-sans">
                      {t("bookingModal.serviceTypeLabel")} <span className="text-rose-500">*</span>
                    </label>
                    {(() => {
                      const currentInstansi = liveAgencies.find(a => a.nama === queueForm.agency);
                      const locCurrent = currentInstansi ? getLocalizedAgency(currentInstansi, i18n.language) : null;
                      const services = locCurrent?.layananList || [locCurrent?.layanan || t("bookingModal.integratedServiceFallback", "Pelayanan Terpadu")];
                      return (
                        <select
                          value={queueForm.service}
                          onChange={(e) => setQueueForm(prev => ({ ...prev, service: e.target.value }))}
                          className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                        >
                          {services.map((svc, sIdx) => (
                            <option key={sIdx} value={svc}>
                              {svc}
                            </option>
                          ))}
                        </select>
                      );
                    })()}
                  </div>

                  {/* Tanggal & Sesi Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans">
                          {t("bookingModal.visitDateLabel")} <span className="text-rose-500">*</span>
                        </label>
                      </div>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={queueForm.date}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQueueForm(prev => ({ ...prev, date: val }));
                          setQueueFormTouched(prev => ({ ...prev, date: true }));
                          const today = new Date().toISOString().split('T')[0];
                          if (!val || val < today) {
                            setQueueFormErrors(prev => ({ ...prev, date: 'Tanggal tidak boleh di masa lalu' }));
                          } else {
                            setQueueFormErrors(prev => ({ ...prev, date: undefined }));
                          }
                        }}
                        onBlur={() => setQueueFormTouched(prev => ({ ...prev, date: true }))}
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 font-sans">
                        {t("bookingModal.sessionLabel")} <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setQueueForm(prev => ({ ...prev, session: 'pagi' }))}
                          className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-semibold font-sans transition-all border cursor-pointer ${
                            queueForm.session === 'pagi'
                              ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:bg-slate-100'
                          }`}
                        >
                          {t("bookingModal.sessionMorningShort", "Pagi (08:00)")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setQueueForm(prev => ({ ...prev, session: 'siang' }))}
                          className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-semibold font-sans transition-all border cursor-pointer ${
                            queueForm.session === 'siang'
                              ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:bg-slate-100'
                          }`}
                        >
                          {t("bookingModal.sessionAfternoonShort", "Siang (13:00)")}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Peringatan Akhir Pekan */}
                  {isWeekendSelected && (
                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        {t("bookingModal.weekendNotice", "Perhatian: Pelayanan tatap muka MPP beroperasi pada hari kerja (Senin - Kamis 07:30 - 16:00 WITA, Jumat 07:30 - 16:30 WITA). Kunjungan akhir pekan akan diproses pada hari kerja berikutnya.")}
                      </span>
                    </div>
                  )}

                  {/* Pesan Error jika DB bermasalah (Honest Fallback) */}
                  {bookingErrorMessage && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{bookingErrorMessage}</span>
                    </div>
                  )}

                  {/* Tombol Konfirmasi (Sticky Bottom on Mobile, Flowing on Desktop) */}
                  <div className="sticky bottom-0 z-10 bg-white/95 dark:bg-surface/95 backdrop-blur-md p-4 border-t border-slate-200/60 dark:border-slate-800/80 -mx-4 sm:-mx-8 -mb-4 sm:-mb-8 mt-5 rounded-b-3xl md:static md:bg-transparent md:border-none md:p-0 md:m-0 md:rounded-none flex items-center gap-3">
                    <button
                      type="button"
                      disabled={isBookingSubmitting}
                      onClick={() => setIsQueueBookingOpen(false)}
                      className="flex-1 min-h-[44px] py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-semibold font-sans hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                      {t("common.close") || "Batal"}
                    </button>
                    <button
                      type="submit"
                      disabled={isBookingSubmitting}
                      className="flex-1 min-h-[44px] py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs sm:text-sm font-semibold font-sans shadow-lg shadow-black/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isBookingSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Menyimpan ke Database...</span>
                        </>
                      ) : (
                        <>
                          <Ticket className="w-4 h-4" />
                          <span>{t("bookingModal.submitBtn")}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}

        
        {/* Sticky Ticket Widget */}
        <AnimatePresence>
          {activeTicket && activePersona === "warga" && !isBottomTicketDismissed && (
            <motion.div
              initial={{ opacity: 0, y: 50, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 50, x: "-50%" }}
              className={`fixed bottom-[calc(env(safe-area-inset-bottom,0px)+72px)] md:bottom-6 left-1/2 z-40 w-[90%] max-w-sm backdrop-blur-md text-white shadow-2xl rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between border pr-10 gap-3 sm:gap-0 transition-all ${
                activeTicket.status === 'dipanggil'
                  ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 border-amber-300 ring-4 ring-amber-400/80 shadow-[0_0_35px_rgba(245,158,11,0.6)] animate-pulse'
                  : activeTicket.status === 'selesai_langsung'
                  ? 'bg-amber-500/90 border-white/20'
                  : 'bg-emerald-600/90 border-white/20'
              }`}
            >
              {/* Tombol Tutup */}
              <button 
                onClick={() => setIsBottomTicketDismissed(true)}
                className="absolute right-2 top-2 p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                aria-label={t("mppPortal.notification.closeAria", "Tutup antrean")}
              >
                <X className="w-4 h-4 text-white" />
              </button>
              
              <div 
                onClick={() => {
                  if (activeTicket.status === 'dipanggil') {
                    setIsCallingAlertOpen(true);
                  } else {
                    setGeneratedTicket(activeTicket);
                    setIsQueueSubmitted(true);
                    setIsQueueBookingOpen(true);
                  }
                }}
                className="flex items-center gap-3 cursor-pointer group"
                title={activeTicket.status === 'dipanggil' ? 'Klik untuk membuka Layar Panggilan Bandara' : 'Klik untuk membuka E-Pass Tiket & Menu SKM'}
              >
                <div className="bg-white/20 p-2.5 rounded-xl border border-white/30 shrink-0 group-hover:scale-105 transition-transform">
                  {activeTicket.status === 'dipanggil' ? (
                    <Volume2 className="w-6 h-6 text-white animate-bounce" />
                  ) : (
                    <Ticket className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${
                    activeTicket.status === 'dipanggil'
                      ? 'text-amber-100 font-bold'
                      : activeTicket.status === 'selesai_langsung'
                      ? 'text-amber-100'
                      : 'text-emerald-100'
                  }`}>
                    {activeTicket.status === 'dipanggil'
                      ? '🔊 PANGGILAN LOKET!'
                      : activeTicket.status === 'selesai_langsung'
                      ? 'Tiket Selesai • Buka E-Pass'
                      : t("mppPortal.status.activeQueue")}
                  </p>
                  <p className="text-lg sm:text-xl font-black font-sans leading-none mt-0.5 group-hover:underline">{activeTicket.number}</p>
                </div>
              </div>

              {activeTicket.status === 'dipanggil' ? (
                <button
                  type="button"
                  onClick={() => setIsCallingAlertOpen(true)}
                  className="bg-white text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-lg hover:bg-amber-50 transition-all cursor-pointer flex items-center gap-1.5 animate-bounce"
                >
                  <Volume2 className="w-4 h-4 text-amber-600" />
                  <span>DIPANGGIL!</span>
                </button>
              ) : activeTicket.status === 'selesai_langsung' ? (
                <button
                  onClick={() => {
                    setIsSurveyModalOpen(true);
                    setSurveyForm(prev => ({ ...prev, instansi: activeTicket.agency || 'DPMPTSP' }));
                  }}
                  className="bg-white text-amber-600 text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:bg-amber-50 transition-colors cursor-pointer animate-pulse"
                >
                  ⭐ Isi Survei SKM
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setGeneratedTicket(activeTicket);
                    setIsQueueSubmitted(true);
                    setIsQueueBookingOpen(true);
                  }}
                  className="text-right cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <p className="text-[10px] sm:text-xs text-emerald-100 font-medium">{t("mppPortal.agencyModal.counterLabel", "Loket")} {activeTicket.counter}</p>
                  <div className="inline-flex items-center gap-1.5 mt-0.5 bg-white/20 px-3 sm:px-4 py-0.5 rounded-full border border-white/20 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                    <p className="text-xs font-bold text-white">{activeTicket.estimation}</p>
                  </div>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <React.Suspense fallback={null}>
        {/* Airport Calling Alert Modal (Layar Panggilan Bandara & Bell Pemohon) */}
        <AirportCallingAlertModal
          isOpen={isCallingAlertOpen}
          onClose={() => setIsCallingAlertOpen(false)}
          ticketNumber={activeTicket?.number || generatedTicket?.number || 'A-001'}
          counterName={activeTicket?.counter ? `Loket ${activeTicket.counter}` : generatedTicket?.counter ? `Loket ${generatedTicket.counter}` : 'Loket 01'}
          agencyName={activeTicket?.agency || generatedTicket?.agency || 'DPMPTSP Kab. Luwu'}
          serviceName={activeTicket?.service || generatedTicket?.service || 'Pelayanan Terpadu MPP'}
          applicantName={activeTicket?.name || generatedTicket?.name || queueForm.nama || 'Pemohon'}
          onConfirmAttendance={() => {
            setIsCallingAlertOpen(false);
            const current = activeTicket || generatedTicket;
            if (current) {
              const updated = { ...current, status: 'dilayani' };
              setActiveTicket(updated);
              setGeneratedTicket(updated);
              sessionStorage.setItem('mpp_active_ticket', JSON.stringify(updated));
              localStorage.setItem('mpp_active_ticket', JSON.stringify(updated));
            }
          }}
        />

        {/* AI Modal */}
        <MppVisionModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} initialQuery={aiModalQuery} />

        {/* Airport Self-Service Kiosk Modal */}
        <MppAirportKioskModal
          isOpen={isAirportKioskOpen}
          onClose={() => setIsAirportKioskOpen(false)}
          initialMode={airportKioskInitialMode}
        />

        {/* Operator Login Modal */}
        <PetugasGeraiLoginModal
          isOpen={isOperatorLoginOpen}
          onClose={() => setIsOperatorLoginOpen(false)}
          onSuccess={() => {
            setIsOperatorLoginOpen(false);
            setIsTenantDashboardOpen(true);
          }}
          isDarkMode={isDark}
        />

        {/* FO Officer Login Modal (Command Center Front Office) */}
        <FoOfficerLoginModal
          isOpen={isFoLoginModalOpen}
          onClose={() => setIsFoLoginModalOpen(false)}
          onSuccess={() => {
            setIsFoLoginModalOpen(false);
            navigate('/fo/dashboard');
          }}
          isDarkMode={isDark}
        />

        {/* Tenant Dashboard (Gerai MPP) Modal */}
        {isTenantDashboardOpen && (
          <TenantDashboard 
            isDarkMode={isDark} 
            onClose={() => setIsTenantDashboardOpen(false)} 
          />
        )}

        {/* Modal Analitik & Laporan Kinerja Pengunjung MPP */}
        <MppVisitorAnalyticsModal
          isOpen={isAnalyticsModalOpen}
          onClose={() => setIsAnalyticsModalOpen(false)}
          isDark={isDark}
        />

        {/* Modal Katalog & Direktori Instansi Tergabung */}
        <MppAgenciesCatalogModal
          isOpen={isAgenciesCatalogOpen}
          onClose={() => setIsAgenciesCatalogOpen(false)}
          agencies={liveAgencies}
          onSelectAgency={(agency) => {
            setSelectedAgencyDetail(agency);
          }}
          isDark={isDark}
        />

        {/* Modal Smart Matrix & Finder Layanan Publik 360° */}
        <MppServicesMatrixModal
          isOpen={isServicesMatrixOpen}
          initialCategory={servicesMatrixInitialCategory}
          initialSearch={servicesMatrixInitialSearch}
          onClose={() => {
            setIsServicesMatrixOpen(false);
            setServicesMatrixInitialCategory('all');
            setServicesMatrixInitialSearch('');
          }}
          onSelectRequirement={(serviceName) => {
            setIsServicesMatrixOpen(false);
            const sLower = (serviceName || '').toLowerCase();
            let sKey = 'NIB_OSS';
            if (sLower.includes('ktp') || sLower.includes('dukcapil') || sLower.includes('kk')) sKey = 'KTP_DUKCAPIL';
            else if (sLower.includes('pkkpr') || sLower.includes('tata ruang')) sKey = 'GIS_PKKPR';
            else if (sLower.includes('pbg') || sLower.includes('bangunan') || sLower.includes('imb')) sKey = 'PBG_BANGUNAN';
            else if (sLower.includes('paspor') || sLower.includes('imigrasi')) sKey = 'PASPOR_IMIGRASI';
            else if (sLower.includes('skck') || sLower.includes('polres')) sKey = 'SKCK_POLRES';
            
            setActiveRequirementService(sKey);
            window.dispatchEvent(new CustomEvent('select-mpp-requirement-service', { detail: { service: sKey } }));
            setTimeout(() => {
              const el = document.getElementById('syarat-dokumen');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 150);
          }}
          isDark={isDark}
        />

        {/* Modal Spesifikasi Lengkap & Dokumentasi Layanan (Service Showcase Modal) */}
        <MppServiceDetailModal
          isOpen={!!selectedServiceDetail}
          service={selectedServiceDetail}
          onClose={() => setSelectedServiceDetail(null)}
          onBookQueue={(serviceTitle) => {
            setSelectedServiceDetail(null);
            setQueueForm(prev => ({ ...prev, service: serviceTitle }));
            setIsQueueBookingOpen(true);
          }}
          isDark={isDark}
        />

        {/* Fitur 6: Modal Interaktif Survey Kepuasan Masyarakat (SKM) - PermenPAN-RB No. 14/2017 */}
        <AnimatePresence>
          {isSurveyModalOpen && (
            <div 
              className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 lg:p-6 bg-surface/60 backdrop-blur-sm overflow-y-auto font-sans"
              onClick={() => setIsSurveyModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 20 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-[97vw] 2xl:max-w-7xl bg-white dark:bg-surface rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94dvh] md:max-h-[90dvh] text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800"
              >
                {/* Header Modal */}
                <div className="shrink-0 flex items-start justify-between px-4 sm:px-8 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-surface/95 backdrop-blur-md">
                  <div>
                    <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold rounded-full font-mono">
                      SKM PermenPAN-RB 14/2017
                    </span>
                    <h3 className="text-lg sm:text-2xl font-extrabold tracking-tight mt-1 text-slate-900 dark:text-white font-sans">
                      {t("mppPortal.survey.modalTitle")}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSurveyModalOpen(false)}
                    className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0 ml-2"
                    aria-label="Tutup survei SKM"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Formulir SKM Komprehensif MppCitizenSurveyMenu */}
                <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 md:p-8 w-full scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                  <MppCitizenSurveyMenu 
                    isInModal={true}
                    isDarkMode={isDark}
                    defaultName={activeTicket?.name || generatedTicket?.name || ''}
                    defaultNik={activeTicket?.nik || ''}
                    defaultPhone={activeTicket?.phone || ''}
                    defaultAgency={activeTicket?.agency || generatedTicket?.agency || surveyForm.instansi || ''}
                    onSubmitted={() => {
                      setIsSurveySubmitted(true);
                      setTimeout(() => {
                        setIsSurveyModalOpen(false);
                      }, 1800);
                    }}
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Universal GovTech Command Palette (Ctrl + K) - Inovasi GovTech 3 */}
        <MppCommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => {
            setIsCommandPaletteOpen(false);
            setCommandPaletteInitialQuery('');
          }}
          initialQuery={commandPaletteInitialQuery}
          isDark={isDark}
          activePersona={activePersona}
          onSelectPersona={(persona) => setActivePersona(persona)}
          onOpenQueueBooking={(serviceName, agencyName) => {
            if (serviceName || agencyName) {
              setQueueForm(prev => ({
                ...prev,
                service: serviceName || prev.service,
                agency: agencyName || prev.agency
              }));
            }
            setIsQueueBookingOpen(true);
          }}
          onOpenRequirements={(serviceKey) => {
            if (serviceKey) {
              setActiveRequirementService(serviceKey);
              window.dispatchEvent(new CustomEvent('select-mpp-requirement-service', { detail: { service: serviceKey } }));
            }
            navigateToMppSection('syarat-dokumen');
          }}
          onOpenVoiceAssistant={() => {
            window.dispatchEvent(new CustomEvent('open-mpp-voice-assistant'));
          }}
          onOpenAgenciesCatalog={() => setIsAgenciesCatalogOpen(true)}
          onOpenServicesCatalog={(category, searchQuery) => {
            setServicesMatrixInitialCategory(category || 'all');
            setServicesMatrixInitialSearch(searchQuery || '');
            setIsServicesMatrixOpen(true);
          }}
        />

        {/* Modal Rekomendasi Teknis PKKPR Dinas PUPTR / Berita Acara Forum Penataan Ruang */}
        <PkkprTechnicalRecommendationModal
          isOpen={isPkkprModalOpen}
          onClose={() => {
            setIsPkkprModalOpen(false);
            setPkkprInitialData(undefined);
          }}
          isDark={isDark}
          initialData={pkkprInitialData}
        />

        {/* Modal Inspektur Arsitektur GRP & SPBE */}
        <GRPArchitectureModal
          isOpen={isGrpModalOpen}
          onClose={() => setIsGrpModalOpen(false)}
          isDarkMode={isDark}
        />
        </React.Suspense>

        {/* Material Design 3 Desktop Super-App Global Helpdesk Floating Action Button */}
        <GlobalHelpdeskFab
          onOpenQueueBooking={() => setIsQueueBookingOpen(true)}
          onOpenAiAssistant={() => setIsAiModalOpen(true)}
          onOpenVoiceAssistant={() => window.dispatchEvent(new CustomEvent('open-mpp-voice-assistant'))}
        />
      </div>
    </motion.div>
  );
}
