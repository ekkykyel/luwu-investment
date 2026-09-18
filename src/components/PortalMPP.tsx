import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, type Variants, AnimatePresence } from 'motion/react';
import { 
  Building2, Car, Store,
  Bot, Bell, Menu, Ticket, SearchCheck, Pointer, Search, CheckSquare, 
  ChevronRight, ChevronLeft, Sparkles, Star, Laptop, Accessibility, Home, LayoutGrid, 
  Layers, HelpCircle, Armchair, Baby, Gamepad2, Moon, BookOpen, 
  HeartHandshake, CheckCircle2, Play, Apple,
  Clock, CalendarDays, Calendar, TrendingUp, BarChart3,
  MessageSquare, ShieldCheck, Headphones, ArrowRight,
  HardHat, MapPin, User, Mail, Phone, X, Check,
  Instagram, Youtube, Facebook, Music2, Heart, MessageCircle, Share2, ExternalLink,
  Send, FileText, QrCode, Printer, Copy, RotateCcw, Download, FileCheck, Clock3, AlertCircle, Loader2
, Globe, Map, Package, BadgeCheck, Lock, Unlock, Plus, Trash2, Volume2, VolumeX, Radio } from 'lucide-react';
import { WeatherWidget } from './WeatherWidget';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import { useTranslation } from 'react-i18next';
import { MppVisionModal } from './MppVisionModal';
import { AirportCallingAlertModal } from './mpp/AirportCallingAlertModal';
import { triggerFullAirportCallingAlert } from '../utils/airportAudioAlert';
import { LiveMarketTicker } from './LiveMarketTicker';
import { AuroraBackground } from './AuroraBackground';
import { SmartLiveQueue } from './mpp/SmartLiveQueue';
import { InteractiveFloorPlan } from './mpp/InteractiveFloorPlan';
import { SmartDocumentTracker } from './mpp/SmartDocumentTracker';
import { SmartRequirementAssistant } from './mpp/SmartRequirementAssistant';
import { VipInvestorConcierge } from './mpp/VipInvestorConcierge';
import { InclusivityAccessibilityBar } from './mpp/InclusivityAccessibilityBar';
import { OperationalHeatmap } from './mpp/OperationalHeatmap';
import { SkmBentoGrid } from './mpp/SkmBentoGrid';
import { MppMaklumatSlaRadar } from './mpp/MppMaklumatSlaRadar';
import { MppCitizenSurveyMenu } from './mpp/MppCitizenSurveyMenu';
import { MppVisitorAnalyticsModal } from './mpp/MppVisitorAnalyticsModal';
import { MppAgenciesCatalogModal } from './mpp/MppAgenciesCatalogModal';
import { MppServicesMatrixModal } from './mpp/MppServicesMatrixModal';
import { MppServicesWorkflowCarousel } from './mpp/MppServicesWorkflowCarousel';
import { MppNewsCatalogModal } from './mpp/MppNewsCatalogModal';
import { MppMagattiGallerySlideshow } from './mpp/MppMagattiGallerySlideshow';
import { MppNewsItem, getStoredMppNews } from '../data/mppNewsData';
import TenantDashboard from './mpp/TenantDashboard';
import { PetugasGeraiLoginModal } from './mpp/PetugasGeraiLoginModal';
import { MppAirportKioskModal } from './MppAirportKioskModal';
import { LUWU_LOGO_BASE64 } from '../lib/logoBase64';
import { supabase } from '../lib/supabaseClient';
import { 
  LOCALIZED_AGENCIES, 
  LOCALIZED_REVIEWS, 
  getLocalizedAgency, 
  getLocalizedReview, 
  getLocalizedStats 
} from '../data/mppAgenciesData';

const FALLBACK_IMAGE_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%230f172a'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2334d399' font-family='sans-serif' font-size='22' font-weight='bold'%3EMPP Simpurusiang Kab. Luwu%3C/text%3E%3C/svg%3E";

// --- Konfigurasi Fasilitas (Master-Detail View) ---
const FACILITIES_CONFIG = [
  {
    id: 'lounge',
    key: 'lounge',
    icon: Armchair,
    image: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 'laktasi',
    key: 'laktasi',
    icon: Baby,
    image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 'kids-corner',
    key: 'kids',
    icon: Gamepad2,
    image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 'galeri-umkm',
    key: 'galeri',
    icon: Store,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 'musholla',
    key: 'musholla',
    icon: Moon,
    image: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 'ekiosk',
    key: 'ekiosk',
    icon: Laptop,
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 'pojok-baca',
    key: 'baca',
    icon: BookOpen,
    image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 'disabilitas',
    key: 'disabilitas',
    icon: Accessibility,
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 'pengaduan',
    key: 'pengaduan',
    icon: HeartHandshake,
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1200',
  }
];

// --- Konfigurasi Layanan Kami (Overlapping UI Cards) ---
const SERVICES_CONFIG = [
  {
    id: 'layanan-prioritas',
    category: 'priority',
    titleKey: 'priorityTitle',
    descKey: 'priorityDesc',
    badgeKey: 'priorityBadge',
    image: 'https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&q=80&w=800',
    icon: Star,
    iconColor: 'text-amber-500 dark:text-amber-400',
    iconContainerClass: 'bg-amber-50 dark:bg-amber-900/20',
    badgeClass: 'bg-amber-100/50 text-amber-600 border-amber-200',
  },
  {
    id: 'layanan-mandiri',
    category: 'self',
    titleKey: 'selfTitle',
    descKey: 'selfDesc',
    badgeKey: 'selfBadge',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
    icon: Laptop,
    iconColor: 'text-blue-500 dark:text-blue-400',
    iconContainerClass: 'bg-blue-50 dark:bg-blue-900/20',
    badgeClass: 'bg-blue-100/50 text-blue-600 border-blue-200',
  },
  {
    id: 'layanan-disabilitas',
    category: 'disability',
    titleKey: 'disabilityTitle',
    descKey: 'disabilityDesc',
    badgeKey: 'disabilityBadge',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800',
    icon: Accessibility,
    iconColor: 'text-blue-500 dark:text-blue-400',
    iconContainerClass: 'bg-blue-50 dark:bg-blue-900/20',
    badgeClass: 'bg-blue-100/50 text-blue-600 border-blue-200',
  },
];

export interface InstansiItem {
  nama: string;
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
}

// --- Data Instansi Tergabung (19 Instansi Resmi MPP Simpurusiang - Multi-Bahasa) ---
export const dummyDataInstansi: InstansiItem[] = LOCALIZED_AGENCIES;
export const instansiTergabung = dummyDataInstansi;

// --- Data Ulasan Masyarakat (MPP Simpurusiang Kab. Luwu - Multi-Bahasa) ---
export const dummyDataUlasan = LOCALIZED_REVIEWS;
export const dataUlasan = dummyDataUlasan;

// --- Data Berita & Pengumuman (Kosong jika belum ada data dari DB) ---
export const dummyDataBerita: any[] = [];

// --- Counter Component ---
const StatCounter = ({ target, isDecimal }: { target: number, isDecimal?: boolean }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (inView) {
      let start = 0;
      const duration = 2000;
      const steps = 60;
      const increment = target / steps;
      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(start);
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [inView, target]);

  return (
    <span ref={ref}>
      {isDecimal ? count.toFixed(2) : Math.floor(count)}
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

const INITIAL_UMKM_PRODUCTS: any[] = [];

// --- Main Component ---
export default function PortalMPP() {
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

  const [selectedUMKM, setSelectedUMKM] = useState<any>(null);
  const [activeUmkmFilter, setActiveUmkmFilter] = useState<string>("Semua");
  const [umkmProducts, setUmkmProducts] = useState<any[]>(INITIAL_UMKM_PRODUCTS);

  // --- State News & Pengumuman Portal MPP ---
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [portalNews, setPortalNews] = useState<MppNewsItem[]>(() => getStoredMppNews());

  useEffect(() => {
    const handleNewsUpdate = () => {
      setPortalNews(getStoredMppNews());
    };
    handleNewsUpdate();
    window.addEventListener('mpp_news_updated', handleNewsUpdate);
    return () => window.removeEventListener('mpp_news_updated', handleNewsUpdate);
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
  const [isScrolled, setIsScrolled] = useState(false);

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
  const [activePersona, setActivePersona] = useState(() => {
    return sessionStorage.getItem("portal_persona") || "warga";
  });

  useEffect(() => {
    sessionStorage.setItem("portal_persona", activePersona);
  }, [activePersona]);

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
  } | null>(null);

  // --- State Fase 2 (Fitur 4 & Fitur 5) ---
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<'all' | 'priority' | 'self' | 'disability'>('all');
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isAgenciesCatalogOpen, setIsAgenciesCatalogOpen] = useState(false);
  const [isServicesMatrixOpen, setIsServicesMatrixOpen] = useState(false);

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

  // --- State Fase 4 (Fitur 8: Interactive Virtual Helpdesk & Fitur 9: Interactive FAQ Accordion) ---
  const [isHelpdeskModalOpen, setIsHelpdeskModalOpen] = useState(false);
  const [helpdeskForm, setHelpdeskForm] = useState({
    nama: '',
    telepon: '',
    kategori: 'Perizinan DPMPTSP',
    pesan: ''
  });
  const [isHelpdeskSubmitted, setIsHelpdeskSubmitted] = useState(false);
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // --- State Fase 5 (Fitur 10: Modal Detail Instansi, Fitur 11: Modal Booking Antrean Online & Fitur 12: Tracking Dokumen) ---
  const [selectedAgencyDetail, setSelectedAgencyDetail] = useState<InstansiItem | null>(null);
  const [isQueueBookingOpen, setIsQueueBookingOpen] = useState(false);
  const [queueForm, setQueueForm] = useState({
    nama: '',
    nik: '',
    phone: '',
    gender: 'Laki-laki' as 'Laki-laki' | 'Perempuan',
    occupation: 'Wiraswasta / Pelaku Usaha' as string,
    agency: 'DPMPTSP',
    service: 'Penerbitan Nomor Induk Berusaha (NIB) Berbasis Risiko',
    date: new Date().toISOString().split('T')[0],
    session: 'pagi' as 'pagi' | 'siang'
  });
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
  const [isCallingAlertOpen, setIsCallingAlertOpen] = useState(false);
  const [isAirportKioskOpen, setIsAirportKioskOpen] = useState(false);
  const [airportKioskInitialMode, setAirportKioskInitialMode] = useState<'citizen' | 'investor'>('citizen');
  const [liveAgencies, setLiveAgencies] = useState<InstansiItem[]>(LOCALIZED_AGENCIES);

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
            const matchedStatic = LOCALIZED_AGENCIES.find(
              a => a.nama.toLowerCase() === t.name.toLowerCase() || 
                   (t.code && a.nama.toLowerCase().includes(t.code.toLowerCase())) ||
                   (a.fullName && a.fullName.toLowerCase().includes(t.name.toLowerCase()))
            );

            const tenantServices = (services || [])
              .filter(s => s.tenant_id === t.id)
              .map(s => s.service_name);

            const finalLayananList = tenantServices.length > 0 
              ? tenantServices 
              : (matchedStatic?.layananList || [t.name]);

            if (matchedStatic) {
              return {
                ...matchedStatic,
                nama: t.name,
                loket: t.floor || matchedStatic.loket,
                deskripsi: t.description || matchedStatic.deskripsi,
                layananList: finalLayananList,
              };
            }

            return {
              nama: t.name,
              fullName: t.name,
              kategori: 'Pemerintah Daerah',
              layanan: finalLayananList[0] || 'Pelayanan Terpadu',
              logo: t.logo || '/logos/dpmptsp.png',
              loket: t.floor || 'Loket Pelayanan MPP',
              jamLayanan: 'Senin - Jumat (08:00 - 15:00 WITA)',
              deskripsi: t.description || `Pelayanan terpadu ${t.name} di Gedung MPP Simpurusiang Kab. Luwu`,
              layananList: finalLayananList,
              syaratUmum: ['KTP-el / Kartu Keluarga', 'Surat Permohonan / Berkas Terkait']
            };
          });

        setLiveAgencies(mapped);
      }
    } catch (err) {
      console.error('Error fetching live agencies from Supabase:', err);
    }
  }, []);

  useEffect(() => {
    fetchLiveAgencies();

    // Listen to real-time additions/modifications/deletions from Admin MPP Dashboard
    const syncChannel = supabase
      .channel('portal_mpp_tenants_services_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mpp_tenants' }, () => {
        fetchLiveAgencies();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mpp_services' }, () => {
        fetchLiveAgencies();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(syncChannel);
    };
  }, [fetchLiveAgencies]);

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
      // Calculate average rating based on 9 questions (each 1-4)
      const sum = surveyForm.q1 + surveyForm.q2 + surveyForm.q3 + surveyForm.q4 + surveyForm.q5 + surveyForm.q6 + surveyForm.q7 + surveyForm.q8 + surveyForm.q9;
      // Convert 1-4 scale to 1-5 scale
      const avg1to4 = sum / 9;
      const convertedRating = Math.min(5, Math.max(1, Math.round(((avg1to4 - 1) / 3) * 4 + 1))) || 5;

      // Find tenant_id if matching agency name
      let matchingTenantId: string | null = null;
      if (surveyForm.instansi) {
        const { data: tenantData } = await supabase
          .from('mpp_tenants')
          .select('id')
          .ilike('name', `%${surveyForm.instansi}%`)
          .limit(1);
        if (tenantData && tenantData.length > 0) {
          matchingTenantId = tenantData[0].id;
        }
      }

      // Resolve or create queue_id to satisfy NOT NULL foreign key constraint
      let queueId: string | null = null;
      const activeTicketCode = activeTicket?.number;
      if (activeTicketCode) {
        const { data: qData } = await supabase
          .from('mpp_queues')
          .select('id, tenant_id')
          .eq('ticket_code', activeTicketCode)
          .maybeSingle();
        if (qData) {
          queueId = qData.id;
          if (!matchingTenantId && qData.tenant_id) matchingTenantId = qData.tenant_id;
        }
      }

      if (!queueId && matchingTenantId) {
        const { data: latestQ } = await supabase
          .from('mpp_queues')
          .select('id')
          .eq('tenant_id', matchingTenantId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (latestQ) queueId = latestQ.id;
      }

      if (!queueId) {
        const today = new Date().toISOString().split('T')[0];
        const { data: anyTenant } = await supabase.from('mpp_tenants').select('id, code').limit(1).maybeSingle();
        const effectiveTenantId = matchingTenantId || anyTenant?.id;
        if (effectiveTenantId) {
          const { data: anyService } = await supabase.from('mpp_services').select('id').eq('tenant_id', effectiveTenantId).limit(1).maybeSingle();
          const { data: newQ } = await supabase.from('mpp_queues').insert({
            tenant_id: effectiveTenantId,
            service_id: anyService?.id || null,
            citizen_nik: activeTicket?.nik || '7317000000000001',
            queue_date: today,
            queue_number: 1,
            ticket_code: `SKM-${Date.now().toString().slice(-6)}`,
            status: 'selesai'
          }).select('id').maybeSingle();
          if (newQ) {
            queueId = newQ.id;
            matchingTenantId = effectiveTenantId;
          }
        }
      }

      if (queueId) {
        await supabase.from('mpp_skm').insert({
          queue_id: queueId,
          tenant_id: matchingTenantId,
          citizen_nik: activeTicket?.nik || null,
          rating: convertedRating,
          q1_persyaratan: surveyForm.q1,
          q2_prosedur: surveyForm.q2,
          q3_waktu: surveyForm.q3,
          q4_biaya: surveyForm.q4,
          q5_produk: surveyForm.q5,
          q6_kompetensi: surveyForm.q6,
          q7_perilaku: surveyForm.q7,
          q8_sarpras: surveyForm.q8,
          q9_pengaduan: surveyForm.q9,
          feedback: surveyForm.feedback || null
        });
      }
      // Setelah submit, hapus tiket karena pelayanan telah selesai seutuhnya
      sessionStorage.removeItem('mpp_active_ticket');
      localStorage.removeItem('mpp_active_ticket');
      setActiveTicket(null);
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

      // 3. Upsert Citizen (Tell Us Once Policy)
      // Menyimpan data warga dengan konsistensi field bahasa Indonesia (pekerjaan, jenis_kelamin)
      // dan field bahasa Inggris (occupation, gender)
      const cleanPhone = queueForm.phone.replace(/[^\d+]/g, '');
      const { error: cErr } = await supabase
        .from('mpp_citizens')
        .upsert({
          nik: queueForm.nik,
          full_name: queueForm.nama.trim(),
          phone_number: cleanPhone || null,
          gender: queueForm.gender,
          jenis_kelamin: queueForm.gender,
          occupation: queueForm.occupation,
          pekerjaan: queueForm.occupation,
          updated_at: new Date().toISOString()
        }, { onConflict: 'nik' });
      if (cErr) throw cErr;

      // 4. Generate Queue Number (Auto-reset daily)
      const today = queueForm.date || new Date().toISOString().split('T')[0];
      const { data: lastQueue } = await supabase
        .from('mpp_queues')
        .select('queue_number')
        .eq('tenant_id', tenantId)
        .eq('queue_date', today)
        .order('queue_number', { ascending: false })
        .limit(1);
        
      const nextNum = (lastQueue && lastQueue.length > 0) ? lastQueue[0].queue_number + 1 : 1;
      const ticketNo = `${tenantCode}-${today.replace(/-/g, '')}-${String(nextNum).padStart(3, '0')}`;

      // 5. Insert Queue (Tersinkron dengan sesi kedatangan)
      const { error: qErr } = await supabase
        .from('mpp_queues')
        .insert({
          tenant_id: tenantId,
          service_id: serviceId,
          citizen_nik: queueForm.nik,
          queue_date: today,
          queue_number: nextNum,
          ticket_code: ticketNo,
          status: 'menunggu',
          session: queueForm.session
        });
      if (qErr) throw qErr;

      // 6. Update UI & Local Storage
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
        session: queueForm.session === 'pagi' ? 'Sesi Pagi (08:00 - 11:30 WITA)' : 'Sesi Siang (13:00 - 15:00 WITA)',
        name: queueForm.nama,
        nik: queueForm.nik
      };

      setGeneratedTicket(newTicket);
      setActiveTicket(newTicket);

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
  }, []);

  // Auto-play Slider Carousel Instansi Tergabung
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
    }, 3000);

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
    if (isUlasanPaused) return;

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
  }, [isUlasanPaused]);

  const facilitiesData = (FACILITIES_CONFIG || [])?.map(fac => {
    const rawFeatures = t(`mppPortal.facilitiesData.${fac.key}.features`, { returnObjects: true });
    const features = Array.isArray(rawFeatures) ? (rawFeatures as string[]) : [];
    return {
      ...fac,
      name: t(`mppPortal.facilitiesData.${fac.key}.name`),
      shortName: t(`mppPortal.facilitiesData.${fac.key}.shortName`),
      subtitle: t(`mppPortal.facilitiesData.${fac.key}.subtitle`),
      tag: t(`mppPortal.facilitiesData.${fac.key}.tag`),
      description: t(`mppPortal.facilitiesData.${fac.key}.desc`),
      features,
    };
  }) || [];

  const activeFacility = (facilitiesData || []).find(f => f.id === activeFacilityId) || facilitiesData?.[0];

  const servicesData = (SERVICES_CONFIG || [])?.map(s => ({
    ...s,
    title: t(`mppPortal.layanan.${s.titleKey}`),
    description: t(`mppPortal.layanan.${s.descKey}`),
    badge: t(`mppPortal.layanan.${s.badgeKey}`),
  })) || [];

  const filteredServicesData = servicesData.filter(service => {
    const matchesCategory = selectedServiceCategory === 'all' || service.category === selectedServiceCategory;
    const query = serviceSearchQuery.trim().toLowerCase();
    if (!query) return matchesCategory;

    const matchesQuery = 
      service.title.toLowerCase().includes(query) ||
      service.description.toLowerCase().includes(query) ||
      service.badge.toLowerCase().includes(query);

    return matchesCategory && matchesQuery;
  });

  const statistikCards = [
    { label: t("mppPortal.statistik.dailyAvg"), value: "125", icon: Clock },
    { label: t("mppPortal.statistik.weeklyAvg"), value: "850", icon: CalendarDays },
    { label: t("mppPortal.statistik.monthlyAvg"), value: "3.5K", icon: Calendar },
    { label: t("mppPortal.statistik.yearlyAvg"), value: "42K", icon: TrendingUp },
  ];

  // 9 Unsur SKM (PermenPANRB No. 14/2017) dengan Skor Dinamis Aktual
  const skmIndicators = [
    { key: 'persyaratan', label: t("mppPortal.survey.indicators.persyaratan"), score: 91.8 },
    { key: 'prosedur', label: t("mppPortal.survey.indicators.prosedur"), score: 89.4 },
    { key: 'kecepatan', label: t("mppPortal.survey.indicators.kecepatan"), score: 88.2 },
    { key: 'biaya', label: t("mppPortal.survey.indicators.biaya"), score: 95.6 },
    { key: 'produk', label: t("mppPortal.survey.indicators.produk"), score: 92.1 },
    { key: 'kompetensi', label: t("mppPortal.survey.indicators.kompetensi"), score: 90.5 },
    { key: 'perilaku', label: t("mppPortal.survey.indicators.perilaku"), score: 93.4 },
    { key: 'sarana', label: t("mppPortal.survey.indicators.sarana"), score: 88.9 },
    { key: 'pengaduan', label: t("mppPortal.survey.indicators.pengaduan"), score: 87.2 },
  ];

  const averageSkm = (skmIndicators.reduce((acc, curr) => acc + curr.score, 0) / skmIndicators.length).toFixed(2);

  return (
    <div id="portal-top" className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans w-full overflow-x-clip relative min-h-screen">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Sora:wght@600&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Sora:wght@400;600;700;800&family=Outfit:wght@500;600;700;800&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        
        .font-sans { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }
        .font-sans { font-family: 'Sora', 'Plus Jakarta Sans', sans-serif; }
        
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
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
      
      {/* Dynamic Ambient Silk Aurora Background - Clearly visible in Light Mode & Dark Mode */}
      <div className="opacity-75 dark:opacity-100 transition-opacity duration-700 pointer-events-none">
        <AuroraBackground />
      </div>
      
      <div className="relative z-10 pb-36 md:pb-24 w-full">
        {/* Inclusivity & Accessibility Bar (Mode Ramah Disabilitas, Text-to-Speech & High Contrast) */}
        <InclusivityAccessibilityBar isDark={isDark} />

        {/* Header - Android First & Ultra Responsive */}
        <header className="bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm sticky top-0 z-30 transition-all duration-300">
          <div className={`flex justify-between items-center w-full px-2 md:px-8 lg:px-16 max-w-[1440px] mx-auto transition-all duration-300 ${isScrolled ? "py-2" : "py-2.5 sm:py-3 md:py-4"}`}>
            
            {/* Branding Logo & Title - Lambang Kabupaten Luwu & MPP Simpurusiang */}
            <div 
              className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 group cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="p-1 sm:p-2 rounded-[12px] bg-gradient-to-br from-blue-600/10 to-emerald-600/10 shrink-0 border border-blue-500/20 dark:border-emerald-500/30 group-hover:shadow-[0_0_18px_rgba(0,255,153,0.3)] group-hover:scale-105 transition-all duration-300">
                <img 
                  src={LUWU_LOGO_BASE64}
                  alt="Lambang Resmi Kabupaten Luwu" 
                  className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 object-contain drop-shadow-md" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_IMAGE_URL;
                    e.currentTarget.style.backgroundColor = '#10b981';
                  }}
                />
              </div>
              <div className="flex flex-col min-w-0 shrink">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-[15px] sm:text-base md:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans truncate">
                    MPP Simpurusiang
                  </span>
                  <span className="hidden md:inline-flex items-center gap-1 text-[9px] font-bold text-[#FFD700] bg-[#FFD700]/10 border border-[#FFD700]/30 px-1.5 sm:px-4 py-0.5 rounded uppercase tracking-wider shadow-[0_0_10px_rgba(255,215,0,0.2)]">
                    {t("mppPortal.nav.topBadge", "Layanan Unggul")}
                  </span>
                </div>
                <span className="hidden sm:block text-[10px] sm:text-xs text-emerald-700 dark:text-emerald-400 font-medium tracking-wide truncate font-sans">
                  {t("mppPortal.nav.govName")}
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <a className="text-emerald-700 dark:text-[#00FF99] border-b-2 border-emerald-600 dark:border-[#00FF99] pb-0.5 font-sans text-sm font-semibold hover:text-slate-900 dark:hover:text-white transition-colors" href="#hero">{t("mppPortal.nav.beranda")}</a>
              <a className="text-slate-600 dark:text-slate-300 font-sans text-sm font-semibold hover:text-emerald-700 dark:hover:text-[#00FF99] transition-colors" href="#layanan">{t("mppPortal.nav.layanan")}</a>
              <a className="text-slate-600 dark:text-slate-300 font-sans text-sm font-semibold hover:text-emerald-700 dark:hover:text-[#00FF99] transition-colors" href="#instansi">{t("mppPortal.nav.instansi")}</a>
              <a className="text-slate-600 dark:text-slate-300 font-sans text-sm font-semibold hover:text-emerald-700 dark:hover:text-[#00FF99] transition-colors" href="#fasilitas">{t("mppPortal.nav.fasilitas")}</a>
              <a className="text-slate-600 dark:text-slate-300 font-sans text-sm font-semibold hover:text-emerald-700 dark:hover:text-[#00FF99] transition-colors" href="#umkm">{t("mppPortal.nav.umkm", "Katalog UMKM")}</a>
              <a className="text-slate-600 dark:text-slate-300 font-sans text-sm font-semibold hover:text-emerald-700 dark:hover:text-[#00FF99] transition-colors" href="#statistik">{t("mppPortal.nav.statistik")}</a>
            </nav>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <LanguageToggle />
              <ThemeToggle />
              <button 
                type="button" 
                onClick={() => setIsAiModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-700 dark:text-[#00FF99] px-3 py-1.5 rounded-xl text-xs font-semibold font-sans transition-all active:scale-95 shadow-[0_0_12px_rgba(0,255,153,0.15)]"
                title={t("mppPortal.tooltips.openAi")}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00FF99] animate-pulse" />
                <span>{t("mppPortal.nav.asistenAi")}</span>
              </button>
              <button 
                type="button" 
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:text-white flex items-center justify-center transition-colors active:scale-95"
                title={t("mppPortal.tooltips.notifications")}
              >
                <Bell className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* --- FASE 1: STICKY ACTIVE TICKET STATUS BAR (FITUR 3) --- */}
        {activeTicket && !isTicketBarDismissed && (
          <div className={`sticky top-[58px] sm:top-[68px] z-20 w-full backdrop-blur-xl border-b text-white shadow-lg transition-all animate-fadeIn ${
            activeTicket.status === 'dipanggil'
              ? 'bg-gradient-to-r from-amber-950/95 via-slate-900/95 to-amber-950/95 border-amber-400/80 shadow-amber-500/20'
              : 'bg-emerald-950/95 dark:bg-slate-900/95 border-emerald-500/30'
          }`}>
            <div className="max-w-[1440px] mx-auto px-2 md:px-8 py-2 sm:py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-2.5 w-2.5 relative shrink-0">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-80 ${
                    activeTicket.status === 'dipanggil' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    activeTicket.status === 'dipanggil' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}></span>
                </span>
                <span className={`font-sans font-extrabold px-3 py-0.5 rounded-lg text-xs tracking-wider shrink-0 border ${
                  activeTicket.status === 'dipanggil'
                    ? 'text-amber-300 bg-amber-950/80 border-amber-400/50 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                    : 'text-[#00FF99] bg-emerald-900/60 border-emerald-500/40'
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

        {/* --- FASE 1: STICKY QUICK-NAV (FITUR 2) --- */}
        {showQuickNav && (
          <div className="sticky top-[58px] sm:top-[68px] z-30 w-full bg-white/90 dark:bg-[#001424]/90 backdrop-blur-2xl border-b border-emerald-500/20 shadow-md transition-all">
            <div className="relative max-w-[1440px] mx-auto">
              {/* Fade Gradient Masking Right */}
              <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-white dark:from-[#001424] to-transparent z-10" />
              {/* Fade Gradient Masking Left */}
              <div className="pointer-events-none absolute top-0 left-0 bottom-0 w-6 sm:w-12 bg-gradient-to-r from-white dark:from-[#001424] to-transparent z-10" />

              <div className="flex items-center overflow-x-auto snap-x snap-mandatory no-scrollbar py-2 px-4 gap-2 touch-pan-x">
                {[
                  { id: 'operasional-heatmap', label: t("mppPortal.quickNav.operational", "Jam Kunjungan & SLA"), icon: Clock },
                  { id: 'smart-live-queue', label: t("mppPortal.quickNav.liveQueue", "Radar Antrean Live"), icon: Ticket },
                  { id: 'syarat-dokumen', label: t("mppPortal.quickNav.requirements", "Cek Syarat & AI"), icon: CheckSquare },
                  { id: 'denah-interaktif', label: t("mppPortal.quickNav.floorPlan", "Denah 3D Interaktif"), icon: Layers },
                  { id: 'tracking-berkas', label: t("mppPortal.quickNav.tracking", "Lacak Berkas/Resi"), icon: SearchCheck },
                  { id: 'survey', label: t("mppPortal.quickNav.survey", "Survei SKM 9 Unsur"), icon: Star },
                  { id: 'investor-vip', label: t("mppPortal.quickNav.vipInvestor", "VIP Investor Desk"), icon: Sparkles },
                  { id: 'layanan', label: t("mppPortal.nav.layanan"), icon: LayoutGrid },
                  { id: 'instansi', label: t("mppPortal.nav.instansi"), icon: Building2 },
                  { id: 'fasilitas', label: t("mppPortal.nav.fasilitas"), icon: Armchair },
                  { id: 'umkm', label: t("mppPortal.nav.umkm", "Katalog UMKM"), icon: Store },
                  { id: 'statistik', label: t("mppPortal.nav.statistik"), icon: BarChart3 },
                ].map((item) => {
                  const isActive = activeSectionId === item.id;
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`min-h-[44px] px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold font-sans flex items-center gap-1.5 whitespace-nowrap snap-start transition-all cursor-pointer select-none ${
                        isActive
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                          : 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-[#00FF99]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="w-full max-w-[1440px] mx-auto px-2 md:px-8 lg:px-16 pt-4 pb-28 sm:pb-32 md:py-12 flex flex-col gap-0 overflow-x-clip">
          
          {/* Hero Section */}
          <section id="hero" className="flex flex-col items-center text-center relative pt-2 sm:pt-4 md:pt-8 pb-6 md:pb-12 scroll-mt-24">
            <div id="beranda" className="absolute -top-24 left-0 w-0 h-0 pointer-events-none" />
            {/* Staggered Reveal Container */}
            <motion.div 
              className="flex flex-col items-center w-full max-w-4xl"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.2,
                    delayChildren: 0.05,
                  },
                },
              }}
            >
              {/* Award Badge - Desain Premium Minimalis */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 30, scale: 0.95, filter: "blur(6px)" },
                  visible: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { type: "spring", stiffness: 90, damping: 16 } },
                }}
              >
                <span className="inline-flex items-center gap-2 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl animate-floating text-amber-600 dark:text-[#F3C01E] font-sans text-[10px] sm:text-xs font-semibold px-4 py-2 rounded-full mb-4 sm:mb-6 ring-1 ring-slate-200/50 dark:ring-white/10 border border-amber-500/25 uppercase tracking-widest shadow-[0_4px_20px_rgba(245,158,11,0.12)]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span>{t("mppPortal.hero.award")}</span>
                </span>
              </motion.div>
              
              {/* Judul: Transformasi Digital - Muncul Pertama */}
              <motion.h1 
                variants={{
                  hidden: { opacity: 0, y: 35, scale: 0.96, filter: "blur(8px)" },
                  visible: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { type: "spring", stiffness: 80, damping: 18 } },
                }}
                className="text-[clamp(2rem,calc(4.5vw_+_1.1rem),4.75rem)] font-extrabold text-center text-slate-900 dark:text-white mb-3 sm:mb-5 max-w-5xl leading-[1.08] tracking-tight font-sans text-balance"
              >
                {t("mppPortal.hero.titlePrefix")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-[#F3C01E]">{t("mppPortal.hero.titleHighlight")}</span>
              </motion.h1>
              
              {/* Sub-judul - Disusul 0.2 detik kemudian */}
              <motion.p 
                variants={{
                  hidden: { opacity: 0, y: 35, scale: 0.96, filter: "blur(8px)" },
                  visible: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { type: "spring", stiffness: 80, damping: 18 } },
                }}
                className="text-sm sm:text-base md:text-lg text-slate-500 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed mt-1 sm:mt-2 text-center font-sans px-4 mb-7 sm:mb-9 text-balance"
              >
                {t("mppPortal.hero.subtitle")}
              </motion.p>

              {/* Persona Switcher (Segmented Control) - Tampilan Premium Elegan */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 35, scale: 0.96, filter: "blur(8px)" },
                  visible: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { type: "spring", stiffness: 80, damping: 18 } },
                }}
                className="mb-10 sm:mb-12 w-full flex flex-col items-center gap-4"
              >
                <div className="rounded-full bg-slate-200/50 dark:bg-slate-900/60 p-1 flex w-fit mx-auto backdrop-blur-xl border border-slate-300/30 dark:border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]">
                  {(["warga", "investor"] as const).map((persona) => {
                    const isActive = activePersona === persona;
                    return (
                      <motion.button
                        key={persona}
                        type="button"
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setActivePersona(persona)}
                        className={`relative px-7 py-2.5 rounded-full text-xs sm:text-sm font-bold capitalize transition-colors duration-300 z-10 cursor-pointer ${isActive ? "text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="persona-active"
                            className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 shadow-[0_4px_16px_rgba(16,185,129,0.35)] rounded-full -z-10"
                            transition={{ type: "spring", stiffness: 450, damping: 32 }}
                          />
                        )}
                        {persona === "warga" ? "Masyarakat" : "Investor"}
                      </motion.button>
                    );
                  })}
                </div>
                
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
                  className="px-5 py-2 rounded-full text-xs font-bold font-sans bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-2 cursor-pointer active:scale-95 shadow-sm"
                >
                  <Building2 className="w-4 h-4" />
                  Masuk Sebagai Petugas Gerai
                </button>
              </motion.div>

              
              {/* Quick Action Bento Grid - Android First 3-Columns dengan Fast & Responsive Physics */}
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
                }}
                className="grid grid-cols-3 gap-2.5 sm:gap-6 lg:gap-8 w-full max-w-4xl"
              >
                <motion.button 
                  type="button"
                  onClick={() => setIsQueueBookingOpen(true)}
                  whileHover={{ scale: 1.035, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="w-full min-h-[48px] bg-white/75 dark:bg-[#0f172a]/50 backdrop-blur-2xl border border-slate-200/70 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.25)] rounded-2xl sm:rounded-3xl p-3 sm:p-7 md:p-8 flex flex-col items-center justify-center gap-2 sm:gap-4 group hover:border-emerald-500/90 hover:shadow-[0_20px_40px_rgba(16,185,129,0.18)] dark:hover:shadow-[0_0_35px_rgba(0,255,153,0.3)] transition-all duration-300 cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/5 group-hover:to-emerald-500/10 transition-colors pointer-events-none" />
                  <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 dark:border-emerald-400/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 group-hover:scale-110 group-hover:rotate-[-3deg] transition-transform duration-300 shadow-inner">
                    <Ticket className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 stroke-[2.2]" />
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <span className="font-sans text-[11px] sm:text-base md:text-lg font-bold text-slate-800 dark:text-white tracking-tight leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {t("mppPortal.quickActions.antrean")}
                    </span>
                    <span className="hidden sm:inline-block text-xs text-slate-500 dark:text-slate-400 leading-normal mt-1 max-w-[180px]">{t("mppPortal.quickActions.antreanDesc")}</span>
                  </div>
                </motion.button>

                <motion.button 
                  type="button"
                  onClick={() => document.getElementById('tracking-berkas')?.scrollIntoView({ behavior: 'smooth' })}
                  whileHover={{ scale: 1.035, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="w-full min-h-[48px] bg-white/75 dark:bg-[#0f172a]/50 backdrop-blur-2xl border border-slate-200/70 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.25)] rounded-2xl sm:rounded-3xl p-3 sm:p-7 md:p-8 flex flex-col items-center justify-center gap-2 sm:gap-4 group hover:border-blue-500/90 hover:shadow-[0_20px_40px_rgba(59,130,246,0.18)] dark:hover:shadow-[0_0_35px_rgba(96,165,250,0.3)] transition-all duration-300 cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-blue-500/5 group-hover:to-blue-500/10 transition-colors pointer-events-none" />
                  <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 dark:border-blue-500/20 flex items-center justify-center text-blue-700 dark:text-blue-400 group-hover:scale-110 group-hover:rotate-[-3deg] transition-transform duration-300 shadow-inner">
                    <SearchCheck className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 stroke-[2.2]" />
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <span className="font-sans text-[11px] sm:text-base md:text-lg font-bold text-slate-800 dark:text-white tracking-tight leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {t("mppPortal.quickActions.cekStatus")}
                    </span>
                    <span className="hidden sm:inline-block text-xs text-slate-500 dark:text-slate-400 leading-normal mt-1 max-w-[180px]">{t("mppPortal.quickActions.cekStatusDesc")}</span>
                  </div>
                </motion.button>

                <motion.button 
                  type="button"
                  onClick={() => {
                    setAirportKioskInitialMode('citizen');
                    setIsAirportKioskOpen(true);
                  }}
                  whileHover={{ scale: 1.035, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="w-full min-h-[48px] bg-white/75 dark:bg-[#0f172a]/50 backdrop-blur-2xl border border-slate-200/70 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.25)] rounded-2xl sm:rounded-3xl p-3 sm:p-7 md:p-8 flex flex-col items-center justify-center gap-2 sm:gap-4 group hover:border-amber-500/90 hover:shadow-[0_20px_40px_rgba(245,158,11,0.18)] dark:hover:shadow-[0_0_35px_rgba(255,215,0,0.3)] transition-all duration-300 cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-amber-500/0 to-amber-500/5 group-hover:to-amber-500/10 transition-colors pointer-events-none" />
                  <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 dark:border-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-400 group-hover:scale-110 group-hover:rotate-[-3deg] transition-transform duration-300 shadow-inner">
                    <Pointer className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 stroke-[2.2]" />
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <span className="font-sans text-[11px] sm:text-base md:text-lg font-bold text-slate-800 dark:text-white tracking-tight leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {t("mppPortal.quickActions.mandiri")}
                    </span>
                    <span className="hidden sm:inline-block text-xs text-slate-500 dark:text-slate-400 leading-normal mt-1 max-w-[180px]">{t("mppPortal.quickActions.mandiriDesc")}</span>
                  </div>
                </motion.button>
              </motion.div>

              {/* Smart Search Bar "Tabe'" - Android 48px+ Touch Target */}
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
                }}
                className="w-full max-w-3xl mt-5 sm:mt-8 px-1 sm:px-4"
              >
                <div className="relative min-h-[48px] h-12 sm:h-14 flex items-center bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] rounded-3xl p-1.5 sm:p-2 focus-within:border-emerald-500/50 focus-within:shadow-[0_0_35px_rgba(16,185,129,0.18)] transition-all">
                  <div className="pl-2 sm:pl-3 pr-1.5 sm:pr-2 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 shrink-0">
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-[#F3C01E] bg-amber-500/10 px-3 py-1 sm:px-4 sm:py-1 rounded-xl border border-amber-500/20 font-sans shadow-sm">
                      Tabe'
                    </span>
                  </div>
                  <input 
                    type="text" 
                    placeholder={t("mppPortal.search.placeholderShort") || (t("mppPortal.search.placeholder") as string)} 
                    className="w-full h-full bg-transparent border-none outline-none text-slate-800 dark:text-white text-xs sm:text-sm md:text-base placeholder-slate-400 dark:placeholder-slate-500 px-4 py-1 min-w-0 flex-1 truncate font-sans"
                  />
                  <button 
                    type="button" 
                    className="h-9 sm:h-11 min-h-[38px] sm:min-h-[44px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-semibold tracking-wide px-4.5 sm:px-7 rounded-2xl hover:brightness-105 active:scale-95 transition-all shrink-0 shadow-[0_4px_15px_rgba(16,185,129,0.25)] font-sans cursor-pointer flex items-center justify-center"
                  >
                    <span className="hidden sm:inline">{t("mppPortal.search.button")}</span>
                    <span className="sm:hidden">{t("mppPortal.search.buttonMobile")}</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </section>

          {/* Seksi Motto Pelayanan Kami */}
          <motion.section
            id="motto-pelayanan"
            initial={{ opacity: 0, y: 40, scale: 0.96, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ type: "spring", stiffness: 75, damping: 20, mass: 0.9 }}
            className="w-full max-w-5xl mx-auto  flex flex-col items-center text-center py-12 sm:py-16 md:py-24 px-2 sm:px-5 md:px-8 relative before:bg-slate-50 dark:before:bg-[#0B1120] before:border-y before:border-transparent before:absolute before:inset-0 before:w-[200vw] before:left-1/2 before:-translate-x-1/2 before:-z-10"
          >
            {/* Header Seksi */}
            <div className="w-full max-w-[96%] sm:max-w-xl mx-auto text-center px-4 flex flex-col items-center mb-8 sm:mb-12 break-words">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/25 dark:border-emerald-400/25 mb-3 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300 font-sans">
                  {t("mppPortal.motto.badge")}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white font-sans mt-1">
                {t("mppPortal.motto.title")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 dark:from-emerald-400 dark:via-teal-300 dark:to-[#00FF99]">{t("mppPortal.motto.magatti")}</span>
              </h2>
              
              {/* Motto Tagline Pill Indicators */}
              <div className="mt-3.5 mb-3 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-500/30">Murah</span>
                <span className="text-slate-300 dark:text-slate-700 font-bold">•</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/70 dark:border-teal-500/30">Gampang</span>
                <span className="text-slate-300 dark:text-slate-700 font-bold">•</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200/70 dark:border-cyan-500/30">Cepat</span>
                <span className="text-slate-300 dark:text-slate-700 font-bold">•</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-500/30">Tepat</span>
                <span className="text-slate-300 dark:text-slate-700 font-bold">•</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-500/30">Inovatif</span>
              </div>

              {/* Polished Subtle Divider */}
              <div className="flex items-center justify-center gap-2 mt-1">
                <div className="w-8 h-[2px] rounded-full bg-gradient-to-r from-transparent to-emerald-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <div className="w-8 h-[2px] rounded-full bg-gradient-to-l from-transparent to-emerald-500/40"></div>
              </div>
            </div>

            {/* Desain Gambar Terpusat (Offset Accent Card) */}
            <motion.div 
              whileHover={{ scale: 1.01 }} 
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-4xl aspect-video md:aspect-[21/9]"
            >
              {/* Elemen Latar (Aksen Bayangan) */}
              <div className="absolute inset-0 bg-emerald-500/15 dark:bg-emerald-500/20 rounded-3xl translate-x-2.5 translate-y-2.5 md:translate-x-3.5 md:translate-y-3.5"></div>

              {/* Elemen Gambar & Slideshow Utama */}
              <div className="relative z-10 w-full h-full">
                <MppMagattiGallerySlideshow isDark={isDark} />
              </div>
            </motion.div>
          </motion.section>

          {/* Seksi VIP Investor Concierge & Fast-Track Desk */}
          <div id="investor-vip">
            <VipInvestorConcierge isDark={isDark} />
          </div>

          {/* Seksi Operational Status Banner & Heatmap Jam Ramai vs Sepi */}
          <div id="operasional-heatmap" className="max-w-[1440px] mx-auto px-2 md:px-8 lg:px-16">
            <OperationalHeatmap isDark={isDark} />
          </div>

          {/* Seksi Maklumat Pelayanan & SLA Radar (UU No. 25/2009 & PermenPAN-RB) */}
          <MppMaklumatSlaRadar isDark={isDark} />

          {/* Seksi Smart Live Queue & Loket Radar */}
          <div id="smart-live-queue">
            <SmartLiveQueue 
              isDark={isDark} 
              onRegisterQueue={(agencyName) => {
                if (agencyName) {
                  // Find if there is a matching service option or just set as-is
                  setQueueForm(prev => ({ ...prev, service: agencyName }));
                }
                setIsQueueBookingOpen(true);
                const el = document.getElementById('antrean-online');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            />
          </div>

          {/* Seksi Antrean Online */}
          <motion.section
            id="antrean-online"
            initial={{ opacity: 0, y: 40, scale: 0.96, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ type: "spring", stiffness: 75, damping: 20, mass: 0.9 }}
            className="w-full max-w-6xl mx-auto  mt-12 sm:mt-16 md:mt-24 mb-8 px-2 sm:px-5 md:px-8 relative before:bg-slate-100 dark:before:bg-slate-900/50 before:border-y before:border-transparent before:absolute before:inset-0 before:w-[200vw] before:left-1/2 before:-translate-x-1/2 before:-z-10"
          >
            {/* Header Seksi Antrean Online Terpusat */}
            <div className="w-full max-w-[96%] sm:max-w-xl mx-auto text-center px-4 flex flex-col items-center mb-8 sm:mb-12 break-words">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2.5 inline-block text-center font-sans bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 rounded-full">
                {t("mppPortal.antrean.badge")}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white font-sans mt-1">
                {t("mppPortal.antrean.title")}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-[96%] mx-auto leading-relaxed mt-2.5 mb-5 text-center text-balance">
                {t("mppPortal.antrean.subtitle")}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <div className="w-10 h-[2px] rounded-full bg-gradient-to-r from-emerald-500 to-transparent"></div>
              </div>
            </div>

            <div className="flex flex-col-reverse md:grid md:grid-cols-2 gap-8 md:gap-6 lg:gap-8 items-center">
              {/* Kolom Kiri: Teks & Tombol (Tema Emerald) */}
              <div className="flex flex-col items-start text-left w-full">
                <h3 className="text-sm sm:text-base md:text-lg font-medium text-slate-900 dark:text-white mb-2 font-sans">
                  {t("mppPortal.antrean.featureTitle")}
                </h3>

                <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6 text-left">
                  {t("mppPortal.antrean.featureDesc")}
                </p>

                <div className="mb-8">
                  <button
                    onClick={() => {
                      setIsQueueBookingOpen(true);
                    }}
                    className="min-h-[48px] h-12 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white px-6 rounded-2xl text-xs sm:text-sm font-semibold tracking-wide transition-all inline-flex items-center gap-2 group shadow-lg shadow-emerald-500/25 cursor-pointer font-sans"
                  >
                    <span>{t("mppPortal.antrean.viewMore")}</span>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>

                {/* Area Unduh */}
                <div className="flex flex-col gap-3">
                  <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                    {t("mppPortal.antrean.downloadLabel")}
                  </span>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="#download-playstore"
                      onClick={(e) => e.preventDefault()}
                      className="min-h-[48px] bg-slate-900 dark:bg-slate-800/80 hover:bg-slate-800 dark:hover:bg-slate-700/80 text-white border border-slate-700/60 dark:border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3 transition-all shadow-md group"
                    >
                      <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current text-emerald-400 shrink-0" />
                      <div className="text-left flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 group-hover:text-slate-300">GET IT ON</span>
                        <span className="text-xs sm:text-sm font-semibold tracking-wide font-sans text-white">Google Play</span>
                      </div>
                    </a>

                    <a
                      href="#download-appstore"
                      onClick={(e) => e.preventDefault()}
                      className="min-h-[48px] bg-slate-900 dark:bg-slate-800/80 hover:bg-slate-800 dark:hover:bg-slate-700/80 text-white border border-slate-700/60 dark:border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3 transition-all shadow-md group"
                    >
                      <Apple className="w-5 h-5 sm:w-6 sm:h-6 fill-current text-emerald-400 shrink-0" />
                      <div className="text-left flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 group-hover:text-slate-300">Download on the</span>
                        <span className="text-xs sm:text-sm font-semibold tracking-wide font-sans text-white">App Store</span>
                      </div>
                    </a>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Mockup Smartphone */}
              <motion.div 
                whileHover={{ y: -6 }} 
                transition={{ duration: 0.2 }}
                className="relative flex justify-center w-full"
              >
                {/* Efek Pendaran Cahaya di Belakang Ponsel */}
                <div className="bg-emerald-500/20 blur-3xl w-64 h-64 rounded-full absolute z-0 pointer-events-none" />

                {/* Gambar Ponsel */}
                {!antreanImgError ? (
                  <img
                    src="/images/mockup-antrean.png"
                    alt="Aplikasi Antrean Luwu"
                    referrerPolicy="no-referrer"
                    onError={() => setAntreanImgError(true)}
                    className="relative z-10 w-64 md:w-80 drop-shadow-2xl object-contain transition-transform"
                  />
                ) : (
                  /* Fallback Mockup Smartphone Proporsional */
                  <div className="relative z-10 w-64 sm:w-72 h-[480px] sm:h-[520px] rounded-[40px] bg-slate-900 border-4 border-slate-700/80 shadow-2xl overflow-hidden flex flex-col p-4 sm:p-5">
                    {/* Notch / Speaker */}
                    <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-4 shrink-0 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                    </div>
                    {/* App Header */}
                    <div className="bg-emerald-600/20 border border-emerald-500/30 rounded-2xl p-3 mb-3 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">{t("mppPortal.antrean.mockup.mppTitle")}</div>
                      <div className="text-xs font-bold text-white">{t("mppPortal.antrean.mockup.mppRegency")}</div>
                    </div>
                    {/* Queue Ticket Card */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3 flex flex-col items-center text-center shadow-inner">
                      <div className="text-[10px] uppercase text-emerald-400 font-semibold mb-1">{t("mppPortal.antrean.mockup.ticketLabel")}</div>
                      <div className="text-3xl font-extrabold text-emerald-400 font-sans tracking-tight">A-042</div>
                      <div className="text-xs text-slate-300 mt-1 font-medium">{t("mppPortal.antrean.mockup.counterName")}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{t("mppPortal.antrean.mockup.estimation")}</div>
                    </div>
                    {/* Features List */}
                    <div className="space-y-2 flex-1 flex flex-col justify-center">
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center justify-between text-xs text-slate-200">
                        <span className="flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-emerald-400" /> {t("mppPortal.antrean.mockup.takeNumber")}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold">{t("mppPortal.antrean.mockup.onlineStatus")}</span>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center justify-between text-xs text-slate-200">
                        <span className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-emerald-400" /> {t("mppPortal.antrean.mockup.integratedAgencies")}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold">{t("mppPortal.antrean.mockup.activeStatus")}</span>
                      </div>
                    </div>
                    {/* Bottom Indicator */}
                    <div className="w-20 h-1 bg-white/20 rounded-full mx-auto mt-3 shrink-0" />
                  </div>
                )}
              </motion.div>
            </div>
          </motion.section>

          {/* Seksi Instansi Tergabung (Touch-First Native Scroll) */}
          <motion.section 
            id="instansi" 
            initial={{ opacity: 0, y: 40, scale: 0.96, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ type: "spring", stiffness: 75, damping: 20, mass: 0.9 }}
            className="w-full max-w-6xl mx-auto overflow-hidden  scroll-mt-28 pt-16 sm:pt-20 md:pt-28 pb-12 sm:pb-16 relative before:bg-slate-50 dark:before:bg-[#0B1120] before:border-y before:border-transparent before:absolute before:inset-0 before:w-[200vw] before:left-1/2 before:-translate-x-1/2 before:-z-10"
          >
            {/* Header Seksi Terpusat */}
            <div className="w-full max-w-[96%] sm:max-w-xl mx-auto text-center px-4 flex flex-col items-center mb-8 sm:mb-12 break-words">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2.5 inline-block text-center font-sans bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 rounded-full">
                {t("mppPortal.instansi.badge")}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white font-sans">
                {t("mppPortal.instansi.title")}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-[96%] mx-auto leading-relaxed mt-2.5 mb-6 text-center text-balance">
                {t("mppPortal.instansi.desc")}
              </p>
              <div className="w-12 sm:w-16 h-1 bg-emerald-500 rounded-full mx-auto mt-3 sm:mt-4 mb-2"></div>
            </div>

            {/* Kontainer Slider (Touch-First Native Snap Scroll with Peek Effect & Fade Gradient Masking) */}
            <div className="relative w-full overflow-hidden py-2">
              {/* Fade Gradient Masking on Left & Right */}
              <div className="pointer-events-none absolute top-0 left-0 bottom-0 w-8 sm:w-20 bg-gradient-to-r from-slate-50 dark:from-[#0B1120] to-transparent z-10" />
              <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-slate-50 dark:from-[#0B1120] to-transparent z-10" />

              <div 
                ref={sliderRef}
                onMouseEnter={() => setIsSliderPaused(true)}
                onMouseLeave={() => setIsSliderPaused(false)}
                onTouchStart={() => setIsSliderPaused(true)}
                onTouchEnd={() => setIsSliderPaused(false)}
                className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar touch-pan-x gap-4 md:gap-6 py-4 px-2 sm:px-6 cursor-grab active:cursor-grabbing"
              >
                {(liveAgencies || [])?.map((rawItem, index) => {
                  const item = getLocalizedAgency(rawItem, i18n.language);
                  return (
                    <motion.div
                      key={rawItem.nama || index}
                      tabIndex={0}
                      role="button"
                      whileHover={{ y: -6, scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      onClick={() => setSelectedAgencyDetail(rawItem)}
                      className="w-[85vw] sm:w-[320px] shrink-0 snap-center bg-white/85 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/70 dark:border-white/10 shadow-lg shadow-emerald-950/5 dark:shadow-emerald-950/20 rounded-3xl p-5 md:p-8 flex flex-col items-center text-center justify-between group cursor-pointer hover:border-emerald-500/80 hover:shadow-xl hover:shadow-emerald-500/15 transition-all relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/5 group-hover:to-emerald-500/10 transition-colors pointer-events-none" />
                      <div className="flex flex-col items-center text-center w-full relative z-10">
                        {/* Logo Instansi Terpusat */}
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-[-2deg] transition-transform duration-300 overflow-hidden shadow-inner">
                          <img 
                            src={item.logo} 
                            alt={item.nama}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 md:w-14 md:h-14 object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-110"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = FALLBACK_IMAGE_URL;
                              e.currentTarget.style.backgroundColor = '#10b981';
                            }}
                          />
                        </div>
                        
                        {/* Nama Instansi Terpusat */}
                        <h3 className="text-sm sm:text-base md:text-lg font-medium text-slate-900 dark:text-white mb-1.5 group-hover:text-emerald-500 transition-colors line-clamp-1 w-full font-sans text-center">
                          {item.nama}
                        </h3>
                        
                        {/* Detail Layanan Terpusat */}
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 leading-normal line-clamp-2 mb-4 w-full text-center">
                          {item.layanan}
                        </p>
                      </div>

                      <div className="w-full pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-center relative z-10">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold tracking-wide bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                          <span>{t("mppPortal.instansi.activeStatus")}</span>
                          <ChevronRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-1 group-hover:opacity-100 transition-transform" />
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Tombol Lihat Semua Instansi & Layanan Terpusat */}
            <div className="flex justify-center mt-8">
              <button 
                type="button"
                onClick={() => setIsAgenciesCatalogOpen(true)}
                className="min-h-[48px] h-12 px-8 rounded-full border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all text-xs sm:text-sm font-bold tracking-wide inline-flex items-center gap-2 shadow-md hover:shadow-emerald-500/25 cursor-pointer active:scale-95 font-['Plus_Jakarta_Sans',sans-serif]"
              >
                <Building2 className="w-4 h-4" />
                <span>{t("mppPortal.instansi.viewAllBtn")}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.section>

          {/* Stats Section */}
          <motion.section 
            initial={{ opacity: 0, y: 40, scale: 0.96, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }} 
            transition={{ duration: 0.35, ease: "easeOut" }} 
            viewport={{ once: true, amount: 0.1 }} 
            className="w-full max-w-6xl mx-auto  py-12 sm:py-16 md:py-24 px-2 sm:px-5 md:px-8"
          >
            <div className="w-full bg-white/80 dark:bg-slate-800/40 backdrop-blur-xl shadow-lg shadow-emerald-900/5 dark:shadow-emerald-900/20 border border-slate-100 dark:border-white/5 rounded-3xl p-4 sm:p-8 md:p-10 relative overflow-hidden transition-all duration-300">
              <div className="hidden dark:block absolute inset-0 bg-gradient-to-br from-emerald-950/20 to-transparent pointer-events-none"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8  relative z-10 text-center">
                <div className="flex flex-col gap-2 sm:gap-3 py-2">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-black text-emerald-500 tracking-tight dark:drop-shadow-[0_0_25px_rgba(0,255,153,0.6)]">
                    <StatCounter target={92.45} isDecimal={true} />
                  </span>
                  <span className="font-sans text-xs sm:text-sm text-slate-500 dark:text-slate-300 leading-normal uppercase tracking-wider font-semibold">
                    {t("mppPortal.stats.ikm")}
                  </span>
                </div>

                <div className="flex flex-col gap-2 sm:gap-3 border-y md:border-y-0 md:border-x border-gray-200/80 dark:border-white/10 py-6 md:py-2">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-black text-amber-500 dark:text-[#FFD700] tracking-tight dark:drop-shadow-[0_0_25px_rgba(255,215,0,0.4)]">
                    <StatCounter target={19} />
                  </span>
                  <span className="font-sans text-xs sm:text-sm text-slate-500 dark:text-slate-300 leading-normal uppercase tracking-wider font-semibold">
                    {t("mppPortal.stats.agencies")}
                  </span>
                </div>

                <div className="flex flex-col gap-2 sm:gap-3 py-2">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tight dark:drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]">
                    <StatCounter target={150} />k
                  </span>
                  <span className="font-sans text-xs sm:text-sm text-slate-500 dark:text-slate-300 leading-normal uppercase tracking-wider font-semibold">
                    {t("mppPortal.stats.visitors")}
                  </span>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Seksi Layanan Kami (Overlapping UI Cards with Quick Search & Category Filter) */}
          <motion.section 
            id="layanan"
            initial={{ opacity: 0, y: 40, scale: 0.96, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ type: "spring", stiffness: 75, damping: 20, mass: 0.9 }}
            className="w-full max-w-6xl mx-auto  scroll-mt-28 py-12 sm:py-16 md:py-24 px-2 sm:px-5 md:px-8 relative before:bg-slate-100 dark:before:bg-slate-900/50 before:border-y before:border-transparent before:absolute before:inset-0 before:w-[200vw] before:left-1/2 before:-translate-x-1/2 before:-z-10"
          >
            {/* Section Header Terpusat */}
            <div className="w-full max-w-[96%] sm:max-w-xl mx-auto text-center px-4 flex flex-col items-center mb-8 sm:mb-12 break-words">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2.5 inline-block text-center font-sans bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 rounded-full">
                {t("mppPortal.layanan.badge")}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white font-sans mt-1">
                {t("mppPortal.layanan.title")}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-[96%] mx-auto leading-relaxed mt-2.5 mb-5 text-center">
                {t("mppPortal.layanan.subtitle")}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <div className="w-10 h-[2px] rounded-full bg-gradient-to-r from-emerald-500 to-transparent"></div>
              </div>
            </div>

            {/* Fitur 4: Search & Filter Bar Mobile-First */}
            <div className="w-full max-w-3xl mx-auto mb-8 flex flex-col gap-3.5">
              {/* Input Pencarian */}
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={serviceSearchQuery}
                  onChange={(e) => setServiceSearchQuery(e.target.value)}
                  placeholder={t("mppPortal.layanan.searchPlaceholder")}
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-sans shadow-sm"
                />
                {serviceSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setServiceSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer min-h-[44px] min-w-[44px] justify-center"
                    aria-label={t("common.clearSearch", "Hapus kata kunci pencarian")}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter Chips Horizontal (Scrollable with Native Snap on Mobile) */}
              <div className="relative w-full overflow-hidden">
                <div className="flex overflow-x-auto flex-nowrap snap-x snap-mandatory gap-2.5 pb-2 scrollbar-hide [&::-webkit-scrollbar]:hidden py-1.5 touch-pan-x">
                  {[
                    { key: 'all', label: t("mppPortal.layanan.filterAll") },
                    { key: 'priority', label: t("mppPortal.layanan.filterPriority") },
                    { key: 'self', label: t("mppPortal.layanan.filterSelf") },
                    { key: 'disability', label: t("mppPortal.layanan.filterDisability") },
                  ].map((filter) => {
                    const isSelected = selectedServiceCategory === filter.key;
                    return (
                      <motion.button
                        key={filter.key}
                        type="button"
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.94 }}
                        transition={{ type: "spring", stiffness: 450, damping: 28 }}
                        onClick={() => setSelectedServiceCategory(filter.key as any)}
                        className={`min-h-[44px] px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center justify-center font-sans snap-start ${
                          isSelected
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/40'
                            : 'bg-white/80 dark:bg-slate-800/60 backdrop-blur-md text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-white/10 hover:border-emerald-500/50 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {filter.label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Grid Responsif Kartu Layanan (1 Kolom Mobile Android, 2 Kolom Tablet, 3 Kolom Desktop) */}
            {filteredServicesData.length > 0 ? (
              <motion.div 
                key={`services-grid-${selectedServiceCategory}-${serviceSearchQuery}`}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 lg:gap-8 w-full"
              >
                {filteredServicesData.map((service) => {
                  const Icon = service.icon;
                  return (
                    <motion.div
                      variants={itemVariants}
                      whileHover={{ scale: 1.025, y: -8 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 360, damping: 24 }}
                      key={service.id}
                      onClick={() => {
                        setQueueForm(prev => ({ ...prev, service: service.title }));
                        setIsQueueBookingOpen(true);
                      }}
                      className="w-full bg-gradient-to-b from-white/95 via-white/85 to-slate-50/90 dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-950/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden group shadow-xl shadow-slate-950/5 dark:shadow-emerald-950/20 hover:border-emerald-500/80 dark:hover:border-emerald-400/80 hover:shadow-2xl hover:shadow-emerald-500/20 dark:hover:shadow-[0_20px_45px_rgba(16,185,129,0.22)] transition-all duration-300 flex flex-col justify-between cursor-pointer relative"
                    >
                      {/* Subtle Ambient Gradient Highlight */}
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.04] via-transparent to-teal-500/[0.03] dark:from-emerald-400/[0.06] dark:to-transparent pointer-events-none" />

                      {/* Bagian Atas: Gambar Representatif + Ikon Overlap */}
                      <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-900">
                        <img 
                          src={service.image} 
                          alt={service.title} 
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = FALLBACK_IMAGE_URL;
                          }}
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent"></div>
                        
                        {/* Ikon Overlap dengan Rotasi Dinamis & Glassmorphism */}
                        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl absolute -bottom-3 sm:-bottom-4 left-5 sm:left-6 ${service.iconContainerClass || 'bg-white/95 dark:bg-slate-800/95'} backdrop-blur-md shadow-xl flex items-center justify-center border-2 border-white/80 dark:border-white/20 z-20 group-hover:scale-115 group-hover:rotate-[-4deg] transition-transform duration-300`}>
                          <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${service.iconColor} stroke-[2.2]`} />
                        </div>
                      </div>

                      {/* Bagian Konten & Aksi Interaktif */}
                      <div className="pt-7 sm:pt-8 p-5 sm:p-7 flex-1 flex flex-col justify-between relative z-10">
                        <div>
                          <div className="flex items-center justify-between mb-2.5">
                            <span className={`text-[10px] sm:text-[11px] font-bold tracking-wider uppercase px-3.5 py-1 rounded-full border ${service.badgeClass || 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'}`}>
                              {service.badge}
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-white mb-2 tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors font-sans text-left">
                            {service.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 leading-relaxed text-left line-clamp-3">
                            {service.description}
                          </p>
                        </div>

                        {/* Interactive Touch Target Strip for Android */}
                        <div className="w-full pt-4 mt-5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500 font-sans">
                          <span>{t("mppPortal.layanan.detailLayanan", "Akses Layanan & Antrean")}</span>
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-sm">
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              /* Honest Fallback (Zero Dummy) bila pencarian kosong */
              <div className="w-full py-12 px-4 text-center flex flex-col items-center justify-center bg-white/40 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-white/10 rounded-3xl">
                <Search className="w-10 h-10 text-slate-400 mb-3" />
                <h4 className="text-base font-bold text-slate-800 dark:text-white font-sans mb-1">
                  {t("mppPortal.layanan.noResultsTitle")}
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md">
                  {t("mppPortal.layanan.noResultsDesc")}
                </p>
                <button
                  type="button"
                  onClick={() => { setServiceSearchQuery(''); setSelectedServiceCategory('all'); }}
                  className="mt-4 px-4 py-2 min-h-[44px] rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors font-sans cursor-pointer"
                >
                  {t("mppPortal.layanan.resetFilter", "Reset Filter & Pencarian")}
                </button>
              </div>
            )}

            {/* Tombol Aksi Call to Action */}
            <div className="flex justify-center mt-8 sm:mt-10 md:mt-12">
              <button 
                type="button"
                onClick={() => setIsServicesMatrixOpen(true)}
                className="w-full sm:w-auto min-h-[48px] h-12 px-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer group font-['Plus_Jakarta_Sans',sans-serif]"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>{t("mppPortal.layanan.viewAllBtn")}</span>
                <ChevronRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.section>

          {/* Seksi AI Requirement Assistant & Smart Checklist */}
          <div id="syarat-dokumen">
            <SmartRequirementAssistant isDark={isDark} />
          </div>

          {/* Seksi Interaktif Fasilitas MPP (Master-Detail View & Mobile Drawer) */}
          <motion.section 
            id="fasilitas" 
            initial={{ opacity: 0, y: 40, scale: 0.96, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ type: "spring", stiffness: 75, damping: 20, mass: 0.9 }}
            className="w-full max-w-6xl mx-auto  flex flex-col gap-6 lg:gap-8 scroll-mt-28 py-12 sm:py-16 md:py-24 relative before:bg-slate-50 dark:before:bg-[#0B1120] before:border-y before:border-transparent before:absolute before:inset-0 before:w-[200vw] before:left-1/2 before:-translate-x-1/2 before:-z-10"
          >
            {/* Header Seksi Terpusat */}
            <div className="w-full max-w-[96%] sm:max-w-xl mx-auto text-center px-4 flex flex-col items-center mb-8 sm:mb-12 break-words">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2.5 inline-block text-center font-sans bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 rounded-full">
                {t("mppPortal.fasilitas.badge")}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white font-sans mt-1">
                {t("mppPortal.fasilitas.title")}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-[96%] mx-auto leading-relaxed mt-2.5 mb-5 text-center">
                {t("mppPortal.fasilitas.subtitle")}
              </p>
              <div className="flex items-center gap-1.5 mt-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <div className="w-10 h-[2px] rounded-full bg-gradient-to-r from-emerald-500 to-transparent"></div>
              </div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/20 mt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{facilitiesData.length} {t("mppPortal.fasilitas.activeCount")}</span>
              </div>
            </div>

            {/* Versi Mobile (Di bawah md): Ikon fasilitas horizontal scroll dengan Peek Effect (85vw/w-[280px]) & Fade Gradient Masking */}
            <div className="md:hidden relative w-full overflow-hidden py-1">
              {/* Fade Gradient Masking - Left & Right */}
              <div className="pointer-events-none absolute top-0 left-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-slate-50 dark:from-[#0B1120] to-transparent z-20" />
              <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-slate-50 dark:from-[#0B1120] to-transparent z-20" />

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
                      className={`w-[60vw] sm:w-[240px] shrink-0 snap-center min-h-[48px] px-3.5 py-2.5 rounded-2xl flex items-center gap-2.5 transition-all duration-300 backdrop-blur-xl cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500/15 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                          : 'bg-white/80 dark:bg-slate-800/40 border border-slate-100 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:border-emerald-500/40'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-amber-100/50 text-amber-600 dark:text-amber-400 border border-amber-200/50' : 'bg-slate-900/5 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <div className="font-bold text-xs sm:text-sm leading-tight text-slate-900 dark:text-white whitespace-nowrap font-sans truncate">{fac.shortName}</div>
                        <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium mt-0.5 truncate">{fac.tag}</div>
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
                        onClick={() => setActiveFacilityId(fac.id)}
                        className={`aspect-square p-4 rounded-3xl flex flex-col items-center justify-center text-center transition-all duration-300 backdrop-blur-2xl group cursor-pointer shadow-lg shadow-emerald-950/5 dark:shadow-emerald-950/20 relative overflow-hidden ${
                          isActive
                            ? 'bg-emerald-500/15 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                            : 'bg-white/85 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 transition-transform duration-300 group-hover:scale-110 shadow-inner ${
                          isActive ? 'bg-amber-100/60 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200/60' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400'
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

              {/* Sisi Kanan (Desktop Kolom 7 / Mobile Full Width): Kartu Detail Raksasa Glassmorphism */}
              <div className="col-span-12 md:col-span-7 w-full max-w-full overflow-hidden">
                <motion.div
                  key={activeFacility.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="w-full max-w-full bg-white/85 dark:bg-slate-800/50 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-5 sm:p-8 flex flex-col justify-between shadow-xl shadow-emerald-950/5 dark:shadow-emerald-950/20 relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-300"
                >
                  {/* Gambar Fasilitas */}
                  <div className="relative aspect-[16/10] sm:aspect-video md:h-72 lg:h-80 w-full overflow-hidden rounded-2xl mb-5 sm:mb-6 border border-slate-200/80 dark:border-white/10 shadow-lg bg-slate-950">
                    <img
                      src={activeFacility.image}
                      alt={activeFacility.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_IMAGE_URL;
                        e.currentTarget.style.backgroundColor = '#10b981';
                      }}
                      className="w-full h-full object-cover object-center rounded-2xl group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent pointer-events-none"></div>
                    
                    <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border border-white/20 text-[11px] sm:text-xs font-bold text-emerald-300 shadow-md font-['Plus_Jakarta_Sans',sans-serif]">
                      <activeFacility.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300 shrink-0" />
                      <span>{activeFacility.tag}</span>
                    </div>

                    <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 z-10 p-3.5 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-white/10 shadow-lg">
                      <span className="text-[10px] sm:text-xs uppercase tracking-widest text-emerald-400 font-extrabold mb-1 block font-['Plus_Jakarta_Sans',sans-serif]">
                        {activeFacility.subtitle}
                      </span>
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight font-['Plus_Jakarta_Sans',sans-serif] leading-snug">
                        {activeFacility.name}
                      </h3>
                    </div>
                  </div>

                  {/* Judul & Teks Deskripsi */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="mb-5 sm:mb-6">
                      <div className="flex items-center gap-2 mb-2 sm:mb-3">
                        <span className="text-[10px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 font-sans">
                          MPP Simpurusiang Kabupaten Luwu
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed text-left break-words">
                        {activeFacility.description}
                      </p>
                    </div>

                    {/* Spesifikasi Fasilitas */}
                    <div className="pt-4 sm:pt-5 border-t border-gray-100 dark:border-white/10">
                      <h4 className="text-[11px] sm:text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold mb-3 flex items-center gap-1.5 font-sans">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                        {t("mppPortal.fasilitas.specsTitle")}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-6 lg:gap-8">
                        {(activeFacility?.features || [])?.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 text-left font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
                            <span className="break-words">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Fitur 5: Mobile Drawer Modal untuk Detail Fasilitas */}
            {isFacilityModalOpen && (
              <div 
                className="md:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsFacilityModalOpen(false)}
              >
                <motion.div
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 100 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="w-full max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-left"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header Drawer dengan Handle & Tombol Tutup */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <activeFacility.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm text-slate-900 dark:text-white font-sans">{activeFacility.name}</h3>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">{activeFacility.tag}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsFacilityModalOpen(false)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      aria-label={t("common.close", "Tutup detail fasilitas")}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Foto Fasilitas */}
                  <div className="relative aspect-[16/10] sm:aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg bg-slate-950">
                    <img
                      src={activeFacility.image}
                      alt={activeFacility.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_IMAGE_URL;
                        e.currentTarget.style.backgroundColor = '#10b981';
                      }}
                      className="w-full h-full object-cover object-center rounded-2xl"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent pointer-events-none"></div>
                    <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-white/20 text-[10px] font-bold text-emerald-300 shadow-md font-['Plus_Jakarta_Sans',sans-serif]">
                      <activeFacility.icon className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                      <span>{activeFacility.tag}</span>
                    </div>
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 p-2.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/10 shadow-md">
                      <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block font-['Plus_Jakarta_Sans',sans-serif] truncate">
                        {activeFacility.subtitle}
                      </span>
                    </div>
                  </div>

                  {/* Deskripsi Lengkap */}
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                      {activeFacility.description}
                    </p>
                  </div>

                  {/* Kelengkapan Fitur */}
                  <div className="pt-3 border-t border-slate-100 dark:border-white/10">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5 font-sans">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      {t("mppPortal.fasilitas.specsTitle")}
                    </h4>
                    <div className="grid grid-cols-1 gap-6 lg:gap-8">
                      {(activeFacility?.features || [])?.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tombol Tutup Aksi Bawah */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setIsFacilityModalOpen(false)}
                      className="w-full min-h-[44px] py-2.5 rounded-2xl bg-emerald-500 text-white text-xs font-semibold font-sans shadow-md shadow-emerald-500/25 hover:bg-emerald-600 cursor-pointer"
                    >
                      {t("common.close") || "Tutup"}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.section>

          {/* Seksi Denah 3D & Navigasi Loket Interaktif */}
          <div id="denah-interaktif">
            <InteractiveFloorPlan isDark={isDark} />
          </div>

          {/* Seksi Katalog Kemitraan UMKM Luwu */}
          <motion.section
            id="umkm"
            initial={{ opacity: 0, y: 40, scale: 0.96, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ type: "spring", stiffness: 75, damping: 20, mass: 0.9 }}
            className="w-full max-w-6xl mx-auto flex flex-col scroll-mt-28 py-12 sm:py-16 md:py-24 px-3 sm:px-5 md:px-8 relative"
          >
            {/* Header Seksi */}
            <div className="w-full max-w-[96%] sm:max-w-xl mx-auto text-center px-4 flex flex-col items-center mb-8 sm:mb-12 break-words">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 mb-3 font-sans">
                <Store className="w-3.5 h-3.5" />
                {t("umkm_catalog", "Katalog Kemitraan UMKM Luwu")}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white font-sans">
                {t("umkm_catalog_title", "Galeri & Kemitraan UMKM Unggulan MPP")}
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-300 max-w-[96%] mx-auto leading-relaxed mt-3 mb-6 text-center">
                {t("umkm_catalog_desc", "Pusat promosi dan kemitraan produk UMKM binaan Pemkab Luwu terverifikasi legalitas NIB, Halal, dan P-IRT.")}
              </p>
              <div className="w-12 sm:w-16 h-1 bg-emerald-500 rounded-full mx-auto mt-2"></div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {['Semua', 'Kuliner', 'Kriya/Kerajinan'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveUmkmFilter(cat)}
                  className={`px-4 py-2 min-h-[40px] rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 backdrop-blur-xl border font-sans cursor-pointer ${
                    activeUmkmFilter === cat
                      ? "bg-emerald-600 text-white border-emerald-400/40 shadow-lg shadow-emerald-500/25"
                      : "bg-white/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/80"
                  }`}
                >
                  {cat === "Semua" ? (isZh ? "全部" : isEn ? "All" : "Semua") : cat === "Kuliner" ? (isZh ? "烹饪美食" : isEn ? "Culinary" : "Kuliner") : (isZh ? "手工艺品" : isEn ? "Crafts" : "Kriya/Kerajinan")}
                </button>
              ))}
            </div>

            {/* Grid Produk UMKM */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {umkmProducts.filter((p) => activeUmkmFilter === "Semua" || p.kategori === activeUmkmFilter).length === 0 ? (
                <div className="col-span-full py-12 text-center text-xs text-slate-500 font-sans italic bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                  {t("portal.noUmkmData", "Belum ada data produk UMKM binaan yang terdaftar di portal. Data akan ditampilkan secara otomatis ketika terhubung dengan database UMKM.")}
                </div>
              ) : (
                umkmProducts
                  .filter((p) => activeUmkmFilter === "Semua" || p.kategori === activeUmkmFilter)
                  .map((product) => (
                  <div
                    key={product.id}
                    className="flex flex-col group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-emerald-500/40 hover:-translate-y-1"
                  >
                    <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={product.image}
                        alt={isZh ? (product.nama_produk_zh || product.nama_produk) : isEn ? (product.nama_produk_en || product.nama_produk) : product.nama_produk}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-white rounded-full shadow-sm">
                          <BadgeCheck className="w-3 h-3" />
                          {product.status_izin}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 flex flex-col flex-grow">
                      <div className="mb-3">
                        <h4 className="text-sm font-bold font-sans text-slate-900 dark:text-white line-clamp-2 mb-1 group-hover:text-emerald-500 transition-colors">
                          {isZh ? (product.nama_produk_zh || product.nama_produk) : isEn ? (product.nama_produk_en || product.nama_produk) : product.nama_produk}
                        </h4>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {product.nama_pemilik}
                        </p>
                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400 font-sans mt-1">
                          {product.harga}
                        </p>
                      </div>

                      <div className="mt-auto grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setSelectedUMKM(product)}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 min-h-[40px] rounded-xl text-xs font-bold font-sans bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 transition-all cursor-pointer"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>{t("mppPortal.umkm.detail", "Detail")}</span>
                        </button>
                        <a
                          href={`https://wa.me/${product.no_wa}?text=Halo,%20saya%20tertarik%20dengan%20produk%20UMKM%20${encodeURIComponent(product.nama_produk)}%20di%20Portal%20MPP%20Luwu...`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 py-2 px-3 min-h-[40px] rounded-xl text-xs font-bold font-sans bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WA</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.section>

          {/* Modal Detail UMKM */}
          <AnimatePresence>
            {selectedUMKM && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
                  onClick={() => setSelectedUMKM(null)}
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 z-10"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedUMKM(null)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="relative h-56 rounded-2xl overflow-hidden mb-5 bg-slate-100 dark:bg-slate-800">
                    <img
                      src={selectedUMKM.image}
                      alt={selectedUMKM.nama_produk}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold uppercase tracking-wider bg-emerald-500 text-white rounded-full shadow-md">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        {selectedUMKM.status_izin}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg sm:text-xl font-medium font-sans text-slate-900 dark:text-white mb-1">
                    {isZh ? (selectedUMKM.nama_produk_zh || selectedUMKM.nama_produk) : isEn ? (selectedUMKM.nama_produk_en || selectedUMKM.nama_produk) : selectedUMKM.nama_produk}
                  </h3>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-sans mb-4">
                    {selectedUMKM.harga}
                  </p>

                  <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-4 mb-6">
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{t("mppPortal.umkm.owner", "Pemilik / Produsen:")}</span>
                        <span>{selectedUMKM.nama_pemilik}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{t("mppPortal.umkm.location", "Lokasi Usaha:")}</span>
                        <span>{isZh ? (selectedUMKM.alamat_zh || selectedUMKM.alamat) : isEn ? (selectedUMKM.alamat_en || selectedUMKM.alamat) : selectedUMKM.alamat}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Package className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{t("mppPortal.umkm.composition", "Komposisi / Bahan Utama:")}</span>
                        <span>{isZh ? (selectedUMKM.bahan_zh || selectedUMKM.bahan) : isEn ? (selectedUMKM.bahan_en || selectedUMKM.bahan) : selectedUMKM.bahan}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleShareUMKM(selectedUMKM)}
                      className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-sans text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>{t("mppPortal.umkm.share", "Bagikan")}</span>
                    </button>
                    <a
                      href={`https://wa.me/${selectedUMKM.no_wa}?text=Halo,%20saya%20tertarik%20dengan%20produk%20UMKM%20${encodeURIComponent(selectedUMKM.nama_produk)}%20di%20Portal%20MPP%20Luwu...`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-[2] min-h-[44px] py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-sans text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-500/25"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{t("mppPortal.umkm.contactWa", "Hubungi Pemilik (WA)")}</span>
                    </a>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Seksi Pelacakan Berkas Perizinan Real-Time (Smart Document Tracker) */}
          <div id="tracking-berkas">
            <SmartDocumentTracker isDark={isDark} />
          </div>

          {/* Seksi Statistik Pengunjung */}
          <motion.section
            id="statistik"
            initial={{ opacity: 0, y: 40, scale: 0.96, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ type: "spring", stiffness: 75, damping: 20, mass: 0.9 }}
            className="w-full max-w-6xl mx-auto  flex flex-col scroll-mt-28 py-12 sm:py-16 md:py-24 px-2 sm:px-5 md:px-8 relative before:bg-slate-100 dark:before:bg-slate-900/50 before:border-y before:border-transparent before:absolute before:inset-0 before:w-[200vw] before:left-1/2 before:-translate-x-1/2 before:-z-10"
          >
            {/* Header Seksi Terpusat */}
            <div className="w-full max-w-[96%] sm:max-w-xl mx-auto text-center px-4 flex flex-col items-center mb-8 sm:mb-12 break-words">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2.5 inline-block text-center font-sans bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 rounded-full">
                {t("mppPortal.statistik.badge")}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white font-sans">
                {t("mppPortal.statistik.title")}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-[96%] mx-auto leading-relaxed mt-2.5 mb-6 text-center">
                {t("mppPortal.statistik.subtitle")}
              </p>
              <div className="w-12 sm:w-16 h-1 bg-emerald-500 rounded-full mx-auto mt-4"></div>
            </div>

            {/* Tata Letak 4 Kartu Statistik (Overlapping Floating Icon Design dengan Premium Glass & Spring Physics) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-8 md:gap-6 lg:gap-8 max-w-6xl mx-auto mt-14 sm:mt-16 w-full">
              {(statistikCards || [])?.map((stat, idx) => {
                const IconComp = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 30, scale: 0.96, filter: "blur(6px)" }}
                    whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25, delay: idx * 0.08 }}
                    whileHover={{ y: -6, scale: 1.025 }}
                    className="w-full min-h-[185px] sm:min-h-[200px] bg-white/85 dark:bg-slate-800/50 backdrop-blur-2xl rounded-3xl shadow-xl shadow-emerald-950/5 dark:shadow-emerald-950/20 relative pt-12 pb-7 px-5 sm:px-6 text-center border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/80 hover:shadow-2xl hover:shadow-emerald-500/15 transition-all duration-300 group flex flex-col justify-between items-center"
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl" />
                    
                    {/* Ikon Melayang (Floating Absolute Center dengan Glow Effect) */}
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/20 border-4 border-white dark:border-slate-900 rounded-2xl p-3 sm:p-3.5 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 z-10">
                      <IconComp className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
                    </div>

                    {/* Isi Teks */}
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-normal font-semibold min-h-[40px] flex items-center justify-center font-sans mt-1">
                      {stat.label}
                    </div>

                    {/* Angka Warna Emerald & Gradien Mewah */}
                    <div className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 dark:from-emerald-400 dark:to-teal-300 tracking-tight mt-2 font-sans">
                      {stat.value}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Wadah Grafik (Chart Area) */}
            <div className="max-w-6xl mx-auto mt-8 sm:mt-12 w-full">
              <div className="w-full bg-white/85 dark:bg-slate-800/50 backdrop-blur-2xl rounded-3xl shadow-xl shadow-emerald-950/5 dark:shadow-emerald-950/20 p-5 sm:p-8 md:p-10 border border-slate-200/80 dark:border-white/10 flex flex-col">
                {/* Header & Filter Tab */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-base sm:text-lg md:text-xl font-medium text-slate-900 dark:text-white font-sans text-left">
                      {t("mppPortal.statistik.chartTitle")}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 mt-1 text-left">
                      {t("mppPortal.statistik.chartSubtitle")}
                    </p>
                  </div>

                  {/* Filter Tab (min 48px touch target on mobile) */}
                  <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-white/10 self-start sm:self-auto shadow-inner">
                    {(['harian', 'mingguan', 'bulanan'] as const).map((tab) => {
                      const label = tab === 'harian' ? t("mppPortal.statistik.harian") : tab === 'mingguan' ? t("mppPortal.statistik.mingguan") : t("mppPortal.statistik.bulanan");
                      const isActive = activeStatTab === tab;
                      return (
                        <motion.button
                          key={tab}
                          type="button"
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setActiveStatTab(tab)}
                          className={`min-h-[44px] px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold tracking-wide rounded-xl transition-all duration-200 cursor-pointer font-sans ${
                            isActive
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/30 font-bold'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {label}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Area Grafik Batang Vertikal h-80 */}
                <div className="relative w-full h-80 flex flex-col justify-end pt-4 pb-2">
                  {/* Garis Grid Horizontal Latar */}
                  <div className="absolute inset-x-0 inset-y-4 flex flex-col justify-between pointer-events-none opacity-20 dark:opacity-10">
                    <div className="border-b border-slate-400 dark:border-slate-500 w-full" />
                    <div className="border-b border-slate-400 dark:border-slate-500 w-full" />
                    <div className="border-b border-slate-400 dark:border-slate-500 w-full" />
                    <div className="border-b border-slate-400 dark:border-slate-500 w-full" />
                  </div>

                  {/* Batang-batang Vertikal bg-emerald-500 */}
                  <div className="flex-1 flex items-end justify-between gap-2 sm:gap-3 md:gap-4 z-10">
                    {Array.from({ length: 12 }).map((_, i) => {
                      const multiplier = activeStatTab === 'harian' ? 0.9 : activeStatTab === 'mingguan' ? 1.4 : 1.8;
                      const baseSin = Math.sin((i + 1) * 0.9) * 25 + 45;
                      const barPercent = Math.min(Math.max(baseSin * (0.6 + (i % 4) * 0.15) * (multiplier / 1.2), 22), 95);
                      const displayCount = Math.floor(barPercent * (activeStatTab === 'harian' ? 1.5 : activeStatTab === 'mingguan' ? 9 : 35));

                      return (
                        <div key={i} className="w-full relative group h-full flex flex-col justify-end items-center">
                          <motion.div
                            layout
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 rounded-t-lg transition-colors cursor-pointer shadow-sm relative"
                            style={{ height: `${barPercent}%` }}
                          >
                            {/* Tooltip on Hover */}
                            <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-800 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold px-4 py-0.5 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                              {displayCount.toLocaleString('id-ID')}
                            </div>
                          </motion.div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Label Sumbu Bawah */}
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-200 dark:border-white/10 text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
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
                className="min-h-[48px] h-12 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-full px-8 text-xs sm:text-sm font-bold tracking-wide transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 cursor-pointer font-['Plus_Jakarta_Sans',sans-serif] inline-flex items-center justify-center gap-2 active:scale-95"
              >
                <BarChart3 className="w-4 h-4 text-emerald-100" />
                <span>{t("mppPortal.statistik.fullReportBtn")}</span>
              </button>
            </div>
          </motion.section>

          {/* Seksi Survey Kepuasan Masyarakat */}
          <motion.section
            id="survey"
            initial={{ opacity: 0, y: 40, scale: 0.96, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ type: "spring", stiffness: 75, damping: 20, mass: 0.9 }}
            className="w-full max-w-6xl mx-auto  flex flex-col py-12 sm:py-16 md:py-24 px-2 sm:px-5 md:px-8 relative before:bg-slate-50 dark:before:bg-[#0B1120] before:border-y before:border-transparent before:absolute before:inset-0 before:w-[200vw] before:left-1/2 before:-translate-x-1/2 before:-z-10"
          >
            {/* Header Seksi Terpusat */}
            <div className="w-full max-w-[96%] sm:max-w-xl mx-auto text-center px-4 flex flex-col items-center mb-8 sm:mb-12 break-words">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2.5 inline-block text-center font-sans bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 rounded-full">
                {t("mppPortal.survey.badge")}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white font-sans">
                {t("mppPortal.survey.title")}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-[96%] mx-auto leading-relaxed mt-2.5 mb-6 text-center">
                {t("mppPortal.survey.subtitle")}
              </p>
              <div className="w-12 sm:w-16 h-1 bg-emerald-500 rounded-full mx-auto mt-4"></div>
            </div>

            {/* SkmBentoGrid Component */}
            <SkmBentoGrid
              skmIndicators={skmIndicators}
              averageSkm={averageSkm}
              onOpenSurveyModal={() => {
                setIsSurveySubmitted(false);
                setIsSurveyModalOpen(true);
              }}
              isDark={isDark}
            />

            {/* Fitur 6: Modal Interaktif Survey Kepuasan Masyarakat (SKM) - PermenPAN-RB No. 14/2017 */}
            {isSurveyModalOpen && (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsSurveyModalOpen(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 25, filter: "blur(6px)" }}
                  animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.94, y: 20, filter: "blur(4px)" }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl overflow-y-auto max-h-[92vh]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header Modal */}
                  <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-white/10 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-sans">
                          SKM Luwu Digital
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">PermenPAN-RB No. 14/2017</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-white font-sans mt-1.5">
                        {t("mppPortal.survey.modalTitle")}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Survei resmi 9 unsur pelayanan publik MPP Simpurusiang terintegrasi langsung ke database daerah
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSurveyModalOpen(false)}
                      className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Formulir SKM Komprehensif MppCitizenSurveyMenu */}
                  <MppCitizenSurveyMenu 
                    isDarkMode={isDark}
                    onSubmitted={() => {
                      setIsSurveySubmitted(true);
                      setTimeout(() => {
                        setIsSurveyModalOpen(false);
                      }, 1800);
                    }}
                  />
                </motion.div>
              </div>
            )}
          </motion.section>

          {/* Seksi Layanan Pengaduan */}
          <motion.section
            id="pengaduan"
            initial={{ opacity: 0, y: 40, scale: 0.96, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ type: "spring", stiffness: 75, damping: 20, mass: 0.9 }}
            className="w-full max-w-6xl mx-auto  flex flex-col scroll-mt-28 py-12 sm:py-16 md:py-24 px-2 sm:px-5 md:px-8 relative before:bg-slate-100 dark:before:bg-slate-900/50 before:border-y before:border-transparent before:absolute before:inset-0 before:w-[200vw] before:left-1/2 before:-translate-x-1/2 before:-z-10"
          >
            {/* Header Seksi Terpusat */}
            <div className="w-full max-w-[96%] sm:max-w-xl mx-auto text-center px-4 flex flex-col items-center mb-8 sm:mb-12 break-words">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2.5 inline-block text-center font-sans bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 rounded-full">
                {t("mppPortal.pengaduan.badge")}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white font-sans">
                {t("mppPortal.pengaduan.title")}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-[96%] mx-auto leading-relaxed mt-2.5 mb-6 text-center">
                {t("mppPortal.pengaduan.subtitle")}
              </p>
              <div className="w-12 sm:w-16 h-1 bg-emerald-500 rounded-full mx-auto mt-4"></div>
            </div>

            {/* Tata Letak 3 Kartu Kanal Pengaduan (Grid 3 Kolom) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto w-full">
              {/* Kartu 1 (SP4N-LAPOR!) */}
              <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.96, filter: "blur(6px)" }}
                whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ type: "spring", stiffness: 350, damping: 25, delay: 0 }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full bg-gradient-to-b from-white/95 via-white/85 to-slate-50/90 dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-950/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-xl shadow-slate-950/5 dark:shadow-emerald-950/20 p-6 sm:p-8 flex flex-col h-full hover:border-emerald-500/80 hover:shadow-2xl hover:shadow-emerald-500/15 transition-all duration-300 group relative overflow-hidden"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-[-3deg] transition-transform bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 shadow-inner">
                  <MessageSquare className="w-7 h-7 stroke-[2.2]" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-white font-sans mb-2 group-hover:text-emerald-500 transition-colors text-left">
                  {t("mppPortal.pengaduan.laporTitle")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 leading-normal mb-6 text-left">
                  {t("mppPortal.pengaduan.laporDesc")}
                </p>
                <a 
                  href="https://www.lapor.go.id" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="min-h-[48px] text-xs sm:text-sm font-semibold tracking-wide text-emerald-600 dark:text-emerald-400 mt-auto pt-4 flex items-center justify-between border-t border-slate-100 dark:border-white/10 hover:text-emerald-500 transition-colors group/link font-sans"
                >
                  <span>{t("mppPortal.pengaduan.moreDetails")}</span>
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center group-hover/link:bg-emerald-500 group-hover/link:text-white transition-all shadow-sm">
                    <ArrowRight size={15} className="transition-transform group-hover/link:translate-x-0.5" />
                  </div>
                </a>
              </motion.div>

              {/* Kartu 2 (Pengaduan Internal) */}
              <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.96, filter: "blur(6px)" }}
                whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ type: "spring", stiffness: 350, damping: 25, delay: 0.08 }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full bg-gradient-to-b from-white/95 via-white/85 to-slate-50/90 dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-950/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-xl shadow-slate-950/5 dark:shadow-emerald-950/20 p-6 sm:p-8 flex flex-col h-full hover:border-emerald-500/80 hover:shadow-2xl hover:shadow-emerald-500/15 transition-all duration-300 group relative overflow-hidden"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-[-3deg] transition-transform bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 shadow-inner">
                  <ShieldCheck className="w-7 h-7 stroke-[2.2]" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-white font-sans mb-2 group-hover:text-emerald-500 transition-colors text-left">
                  {t("mppPortal.pengaduan.internalTitle")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 leading-normal mb-6 text-left">
                  {t("mppPortal.pengaduan.internalDesc")}
                </p>
                <a 
                  href="#pengaduan-internal" 
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById('survey');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="min-h-[48px] text-xs sm:text-sm font-semibold tracking-wide text-emerald-600 dark:text-emerald-400 mt-auto pt-4 flex items-center justify-between border-t border-slate-100 dark:border-white/10 hover:text-emerald-500 transition-colors cursor-pointer group/link font-sans"
                >
                  <span>{t("mppPortal.pengaduan.moreDetails")}</span>
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center group-hover/link:bg-emerald-500 group-hover/link:text-white transition-all shadow-sm">
                    <ArrowRight size={15} className="transition-transform group-hover/link:translate-x-0.5" />
                  </div>
                </a>
              </motion.div>

              {/* Kartu 3 (Contact Center) */}
              <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.96, filter: "blur(6px)" }}
                whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ type: "spring", stiffness: 350, damping: 25, delay: 0.16 }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full bg-gradient-to-b from-white/95 via-white/85 to-slate-50/90 dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-950/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-xl shadow-slate-950/5 dark:shadow-emerald-950/20 p-6 sm:p-8 flex flex-col h-full hover:border-emerald-500/80 hover:shadow-2xl hover:shadow-emerald-500/15 transition-all duration-300 group relative overflow-hidden"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-[-3deg] transition-transform bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 shadow-inner">
                  <Headphones className="w-7 h-7 stroke-[2.2]" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-white font-sans mb-2 group-hover:text-emerald-500 transition-colors text-left">
                  {t("mppPortal.pengaduan.contactCenterTitle")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 leading-normal mb-6 text-left">
                  {t("mppPortal.pengaduan.contactCenterDesc")}
                </p>
                <button 
                  type="button"
                  onClick={() => {
                    setIsHelpdeskSubmitted(false);
                    setIsHelpdeskModalOpen(true);
                  }}
                  className="w-full min-h-[48px] text-xs sm:text-sm font-semibold tracking-wide text-emerald-600 dark:text-emerald-400 mt-auto pt-4 flex items-center justify-between border-t border-slate-100 dark:border-white/10 hover:text-emerald-500 transition-colors cursor-pointer group/link font-sans"
                >
                  <span>{t("mppPortal.pengaduan.moreDetails")}</span>
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center group-hover/link:bg-emerald-500 group-hover/link:text-white transition-all shadow-sm">
                    <ArrowRight size={15} className="transition-transform group-hover/link:translate-x-0.5" />
                  </div>
                </button>
              </motion.div>
            </div>

            {/* Banner Virtual Helpdesk (Lebar Penuh) */}
            <div className="max-w-6xl mx-auto mt-10 sm:mt-12 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 bg-white/80 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-3xl shadow-lg shadow-emerald-900/5 dark:shadow-emerald-900/20 overflow-hidden">
                {/* Kolom Kiri (Gambar Petugas MPP) */}
                <div className="w-full overflow-hidden rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none relative min-h-[300px] md:min-h-[320px] bg-emerald-500/5 dark:bg-emerald-950/20 flex items-end justify-center pt-8 px-4">
                  <img 
                    src={staffImageLeft || staffImageRight || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1200"} 
                    alt="Petugas Front Office & Asistensi MPP Simpurusiang" 
                    referrerPolicy="no-referrer" 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1200';
                    }}
                    className="max-h-72 md:max-h-80 w-auto object-contain object-bottom drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-105" 
                  />
                  <div className="absolute bottom-3 left-3 z-10 px-3 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md border border-emerald-500/30 text-[10px] font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Petugas Front Office & Asistensi MPP
                  </div>
                </div>

                {/* Kolom Kanan (Konten) */}
                <div className="p-4 sm:p-8 lg:p-12 flex flex-col justify-center">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2 block font-sans text-left">
                    {t("mppPortal.pengaduan.helpdeskBadge")}
                  </span>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-medium text-slate-900 dark:text-white mb-3 font-sans text-left">
                    {t("mppPortal.pengaduan.helpdeskTitle")}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 leading-normal mb-4 text-left">
                    {t("mppPortal.pengaduan.helpdeskDesc")}
                  </p>

                  <div className="space-y-1 mb-6">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block font-sans text-left">
                      {t("mppPortal.pengaduan.hoursLabel")}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 leading-normal block text-left">
                      {t("mppPortal.pengaduan.hoursValue")}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsHelpdeskSubmitted(false);
                        setIsHelpdeskModalOpen(true);
                      }}
                      className="min-h-[48px] bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs sm:text-sm font-semibold tracking-wide py-3.5 px-6 rounded-2xl w-fit flex items-center gap-2 cursor-pointer transition-all duration-200 shadow-lg shadow-emerald-500/25 font-sans"
                    >
                      <Headphones className="w-4 h-4" />
                      <span>{t("mppPortal.pengaduan.contactBtn")}</span>
                      <ArrowRight size={18} />
                    </button>
                    <a
                      href="https://wa.me/628114201234"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[48px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold py-3.5 px-5 rounded-2xl flex items-center gap-2 transition-colors font-sans"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-500" />
                      <span>{t("mppPortal.contact.direct")}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Seksi Alur Pelayanan (Interactive Slide & Search Component) */}
          <motion.section
            id="alur-pelayanan"
            initial={{ opacity: 0, y: 40, scale: 0.96, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ type: "spring", stiffness: 75, damping: 20, mass: 0.9 }}
            className="w-full max-w-6xl mx-auto py-12 sm:py-16 md:py-24 px-2 sm:px-5 md:px-8 relative before:bg-slate-50 dark:before:bg-[#0B1120] before:border-y before:border-transparent before:absolute before:inset-0 before:w-[200vw] before:left-1/2 before:-translate-x-1/2 before:-z-10"
          >
            {/* Header Seksi Terpusat */}
            <div className="w-full max-w-[96%] sm:max-w-xl mx-auto text-center px-4 flex flex-col items-center mb-6 sm:mb-8 break-words">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2.5 inline-block text-center font-sans bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 rounded-full">
                {t("mppPortal.alur.badge")}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white font-sans">
                {t("mppPortal.alur.title")}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-[96%] mx-auto leading-relaxed mt-2.5 mb-4 text-center">
                {t("mppPortal.alur.subtitle")}
              </p>
              <div className="w-12 sm:w-16 h-1 bg-emerald-500 rounded-full mx-auto mt-2"></div>
            </div>

            {/* Inovasi Slide Carousel & Pencarian Form Alur Pelayanan 12 Tenant MPP */}
            <MppServicesWorkflowCarousel 
              currentLang={i18n.language} 
              isDark={isDark} 
            />

            {/* Fitur 7: Modal Detail Panduan & Prosedur Alur Pelayanan */}
            {activeAlurModal && (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
                onClick={() => setActiveAlurModal(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 25, filter: "blur(6px)" }}
                  animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.94, y: 20, filter: "blur(4px)" }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-4 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
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
                        className="flex-1 min-h-[44px] py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs sm:text-sm font-semibold font-sans shadow-lg shadow-emerald-500/25 transition-all inline-flex items-center justify-center gap-1.5"
                      >
                        <span>{t("mppPortal.alur.onlinePortalBtn") || "Ambil Antrean Layanan"}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.section>

          {/* --- FASE 6: PUBLIKASI & TRANSPARANSI (BERITA & STATISTIK) --- */}
          {/* Berita & Pengumuman */}
          <motion.section
            id="publikasi-berita"
            initial={{ opacity: 0, y: 40, scale: 0.96, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ type: "spring", stiffness: 75, damping: 20, mass: 0.9 }}
            className="w-full max-w-7xl mx-auto  py-12 sm:py-16 md:py-24 px-2 sm:px-5 md:px-8 relative before:bg-slate-100 dark:before:bg-slate-900/50 before:border-y before:border-transparent before:absolute before:inset-0 before:w-[200vw] before:left-1/2 before:-translate-x-1/2 before:-z-10"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-4">
              <div>
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2.5 inline-block font-sans bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 rounded-full">
                  {t("mppPortal.news.badge", "Publikasi Resmi")}
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white font-sans">
                  {t("mppPortal.news.title", "Berita & Pengumuman")}
                </h2>
                <p className="text-base text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed mt-2">
                  {t("mppPortal.news.subtitle", "Informasi terbaru seputar layanan MPP, regulasi perizinan, dan pembaruan sistem.")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedNewsId(null);
                  setIsNewsModalOpen(true);
                }}
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors font-sans group cursor-pointer"
              >
                <span>{t("mppPortal.news.viewAll", "Lihat Semua Berita")}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            {/* Grid Berita */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {portalNews.filter(n => n.status !== 'draft').length === 0 ? (
                <div className="col-span-full py-10 text-center text-xs text-slate-500 font-sans italic bg-slate-50/50 dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800">
                  {t("portal.noNewsData", "Belum ada pengumuman atau publikasi berita terbaru di portal MPP.")}
                </div>
              ) : (
                portalNews
                  .filter(n => n.status !== 'draft')
                  .slice(0, 3)
                  .map((item) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ y: -6 }}
                      onClick={() => {
                        setSelectedNewsId(item.id);
                        setIsNewsModalOpen(true);
                      }}
                      className="bg-white/90 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-lg shadow-emerald-950/5 dark:shadow-emerald-950/20 group cursor-pointer hover:border-emerald-500/60 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        <div className="h-48 bg-slate-200 dark:bg-slate-700 relative overflow-hidden">
                          <img 
                            src={item.image} 
                            alt={item.judul}
                            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1577495508048-b635879837f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                            }}
                          />
                          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                            <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/30 font-sans shadow-sm">
                              {item.kategori}
                            </span>
                            {item.isPinned && (
                              <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold font-sans">
                                Pinned
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="p-6 space-y-2">
                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                            <span>{item.tanggal}</span>
                            <span>{item.penulis}</span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white font-sans leading-snug group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                            {isEn && item.judul_en ? item.judul_en : isZh && item.judul_zh ? item.judul_zh : item.judul}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                            {isEn && item.ringkasan_en ? item.ringkasan_en : isZh && item.ringkasan_zh ? item.ringkasan_zh : item.ringkasan}
                          </p>
                        </div>
                      </div>

                      <div className="px-6 pb-5 pt-0 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <span>Baca Selengkapnya</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </motion.div>
                  ))
              )}
            </div>

            {/* Modal Catalogue / Detail Reader Berita */}
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
          </motion.section>

          {/* Seksi Ulasan Masyarakat (Auto-Slider) */}
          <motion.section 
            id="ulasan-masyarakat"
            initial={{ opacity: 0, y: 40, scale: 0.96, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ type: "spring", stiffness: 75, damping: 20, mass: 0.9 }}
            className="relative bg-slate-900/90 overflow-hidden rounded-t-[2.5rem] md:rounded-t-[4rem] md: w-full py-12 sm:py-16 md:py-24"
          >
            {/* Latar Belakang Absolut dengan Blur & Gradien Emerald Tipis */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1556745091-1057a6d13c7a?auto=format&fit=crop&q=80&w=1200" 
                alt="Latar MPP" 
                referrerPolicy="no-referrer" 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_IMAGE_URL;
                  e.currentTarget.style.backgroundColor = '#10b981';
                }}
                className="w-full h-full object-cover blur-sm opacity-20 scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950"></div>
              <div className="absolute inset-0 bg-emerald-500/[0.04]"></div>
            </div>

            {/* Header Seksi (Terpusat) */}
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.96, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="relative z-10 max-w-4xl mx-auto px-4 text-center mb-8 sm:mb-12 flex flex-col items-center"
            >
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2.5 inline-block text-center font-sans bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1 rounded-full">
                {t("mppPortal.ulasan.badge")}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-white font-sans">
                {t("mppPortal.ulasan.title")}
              </h2>
              <p className="text-base text-slate-300 max-w-2xl mx-auto leading-relaxed mt-3 mb-6 text-center">
                {t("mppPortal.ulasan.subtitle")}
              </p>
              <div className="w-12 sm:w-16 h-1 bg-emerald-500 mx-auto mt-4 rounded-full"></div>
            </motion.div>

            {/* Kontainer Slider & Kartu (Glassmorphism with Peek Effect & Fade Gradient Masking) */}
            <div className="relative w-full overflow-hidden max-w-7xl mx-auto z-10 py-2">
              {/* Fade Gradient Masking - Smooth blend into the dark container background */}
              <div className="pointer-events-none absolute top-0 left-0 bottom-0 w-8 sm:w-20 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent z-20" />
              <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-slate-900 via-slate-900/80 to-transparent z-20" />

              <div 
                ref={ulasanSliderRef}
                onMouseEnter={() => setIsUlasanPaused(true)}
                onMouseLeave={() => setIsUlasanPaused(false)}
                onTouchStart={() => setIsUlasanPaused(true)}
                onTouchEnd={() => setIsUlasanPaused(false)}
                className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar touch-pan-x gap-4 sm:gap-6  pb-8 cursor-grab active:cursor-grabbing"
              >
                {(dummyDataUlasan || dataUlasan || [])?.map((rawItem, idx) => {
                  const item = getLocalizedReview(rawItem, i18n.language);
                  return (
                    <div 
                      key={idx}
                      className="w-[85vw] sm:w-[320px] shrink-0 snap-center bg-white/90 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-4 md:p-8 shadow-xl shadow-black/20 flex flex-col items-center text-center border border-white/20 dark:border-white/10"
                    >
                      {/* Ikon Profil */}
                      <div className="w-14 h-14 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                        <User className="w-7 h-7" />
                      </div>

                      {/* Nama */}
                      <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-4 uppercase font-sans tracking-wide">
                        {item.nama}
                      </span>

                      {/* Layanan */}
                      <span className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-semibold mb-2 block mt-1">
                        {item.layanan}
                      </span>

                      {/* Status Puas */}
                      <div className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-white font-sans flex flex-col items-center gap-1">
                        {item.status}
                        <div className="flex items-center gap-0.5 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>

                      {/* Teks Ulasan */}
                      <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed italic my-3 line-clamp-3">
                        "{item.teks}"
                      </p>

                      {/* Tanggal */}
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 mt-auto pt-2">
                        {item.tanggal}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.section>

          {/* Seksi Kontak Kami (Integrasi Maps & Info) */}
          <motion.section 
            id="kontak"
            initial={{ opacity: 0, y: 40, scale: 0.96, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ type: "spring", stiffness: 75, damping: 20, mass: 0.9 }}
            className="w-[95%] sm:w-[90%] lg:w-[85%] mx-auto scroll-mt-28 py-12 sm:py-16 md:py-24 relative before:bg-slate-50 dark:before:bg-[#0B1120] before:border-y before:border-transparent before:absolute before:inset-0 before:w-[200vw] before:left-1/2 before:-translate-x-1/2 before:-z-10"
          >
            {/* Header Seksi Terpusat */}
            <div className="w-full max-w-[96%] sm:max-w-xl mx-auto text-center px-4 flex flex-col items-center mb-8 sm:mb-12 break-words">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2.5 inline-block text-center font-sans bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 rounded-full">
                {t("mppPortal.kontak.badge")}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white font-sans">
                {t("mppPortal.kontak.title")}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-[96%] mx-auto leading-relaxed mt-2.5 mb-6 text-center">
                {t("mppPortal.kontak.subtitle")}
              </p>
              <div className="w-12 sm:w-16 h-1 bg-emerald-500 rounded-full mx-auto mt-4"></div>
            </div>

            {/* Wadah Utama (Bagi 2 Kolom di Desktop) */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 bg-white/80 dark:bg-slate-800/40 backdrop-blur-xl rounded-3xl shadow-lg shadow-emerald-900/5 dark:shadow-emerald-900/20 p-4 sm:p-8 border border-slate-100 dark:border-white/5">
              {/* Kolom Kiri (Google Maps Embed) */}
              <div className="w-full overflow-hidden rounded-t-2xl sm:rounded-t-3xl shadow-inner relative border border-slate-200/60 dark:border-white/5">
                <iframe 
                  title={t("mppPortal.kontak.mapTitle")}
                  src="https://maps.google.com/maps?q=DPMPTSP%20Kabupaten%20Luwu%20Belopa&t=&z=16&ie=UTF8&iwloc=&output=embed"
                  className="w-full h-64 sm:h-80 border-0 object-cover"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Kolom Kanan (Grid 4 Kartu Informasi - 1 kolom HP, 2 kolom SM) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                {/* Kartu 1 (Jam Pelayanan) */}
                <motion.div 
                  initial={{ opacity: 0, y: 22, scale: 0.98, filter: "blur(4px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.3, delay: 0 }}
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-6 rounded-2xl flex flex-col items-center text-center border border-slate-100 dark:border-white/10 hover:-translate-y-1 transition-transform group shadow-sm"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-4 group-hover:scale-110 transition-transform">
                    <Clock className="w-6 h-6" />
                  </div>
                  <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-2 leading-normal">
                    {t("mppPortal.kontak.hoursLabel")}
                  </span>
                  <p className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-white leading-snug font-sans">
                    {t("mppPortal.kontak.hoursValue")}
                  </p>
                </motion.div>

                {/* Kartu 2 (Alamat) */}
                <motion.div 
                  initial={{ opacity: 0, y: 22, scale: 0.98, filter: "blur(4px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.3, delay: 0.08 }}
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-6 rounded-2xl flex flex-col items-center text-center border border-slate-100 dark:border-white/10 hover:-translate-y-1 transition-transform group shadow-sm"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-4 group-hover:scale-110 transition-transform">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-2 leading-normal">
                    {t("mppPortal.kontak.addressLabel")}
                  </span>
                  <p className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-white leading-snug font-sans">
                    {t("mppPortal.kontak.addressValue")}
                  </p>
                </motion.div>

                {/* Kartu 3 (Email) */}
                <motion.div 
                  initial={{ opacity: 0, y: 22, scale: 0.98, filter: "blur(4px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.3, delay: 0.16 }}
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-6 rounded-2xl flex flex-col items-center text-center border border-slate-100 dark:border-white/10 hover:-translate-y-1 transition-transform group shadow-sm"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-4 group-hover:scale-110 transition-transform">
                    <Mail className="w-6 h-6" />
                  </div>
                  <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-2 leading-normal">
                    {t("mppPortal.kontak.emailLabel")}
                  </span>
                  <a 
                    href="mailto:dpmptspkabluwu@gmail.com"
                    className="min-h-[48px] flex items-center justify-center text-sm sm:text-base font-bold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 break-all font-sans transition-colors"
                  >
                    dpmptspkabluwu@gmail.com
                  </a>
                </motion.div>

                {/* Kartu 4 (Contact Center) */}
                <motion.div 
                  initial={{ opacity: 0, y: 22, scale: 0.98, filter: "blur(4px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.3, delay: 0.24 }}
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-6 rounded-2xl flex flex-col items-center text-center border border-slate-100 dark:border-white/10 hover:-translate-y-1 transition-transform group shadow-sm"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-4 group-hover:scale-110 transition-transform">
                    <Phone className="w-6 h-6" />
                  </div>
                  <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-2 leading-normal">
                    {t("mppPortal.kontak.centerLabel")}
                  </span>
                  <a 
                    href="tel:+628114201234"
                    className="min-h-[48px] flex items-center justify-center text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-white hover:text-emerald-500 dark:hover:text-emerald-400 font-sans transition-colors"
                  >
                    +62 811-420-1234
                  </a>
                  <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                    {t("mppPortal.kontak.centerSub")}
                  </span>
                </motion.div>
              </div>
            </div>
          </motion.section>

          {/* Seksi Sosial Media MPP Kabupaten Luwu */}
          <motion.section 
            id="sosial-media"
            initial={{ opacity: 0, y: 40, scale: 0.96, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ type: "spring", stiffness: 75, damping: 20, mass: 0.9 }}
            className="w-[95%] sm:w-[90%] lg:w-[85%] mx-auto py-12 sm:py-16 md:py-24 relative before:bg-slate-100 dark:before:bg-slate-900/50 before:border-y before:border-transparent before:absolute before:inset-0 before:w-[200vw] before:left-1/2 before:-translate-x-1/2 before:-z-10"
          >
            {/* Header Seksi Terpusat */}
            <div className="w-full max-w-[96%] sm:max-w-xl mx-auto text-center px-4 flex flex-col items-center mb-8 sm:mb-12 break-words">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2.5 inline-block text-center font-sans bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 rounded-full">
                {t("mppPortal.sosialMedia.badge")}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white font-sans">
                {t("mppPortal.sosialMedia.title")}
              </h2>
              <p className="text-base text-slate-600 dark:text-slate-300 max-w-[96%] mx-auto leading-relaxed mt-3 mb-6 text-center">
                {t("mppPortal.sosialMedia.subtitle")}
              </p>
              <div className="w-12 sm:w-16 h-1 bg-emerald-500 rounded-full mx-auto mt-4"></div>
            </div>

            {/* Tata Letak Grid (1 kolom HP, 2 kolom MD) */}
            <div className="w-full flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
              {/* Kartu 1: Instagram */}
              <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.96, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.3, delay: 0, ease: "easeOut" }}
                className="bg-white/80 dark:bg-slate-800/40 backdrop-blur-xl rounded-3xl shadow-lg shadow-emerald-900/5 dark:shadow-emerald-900/20 overflow-hidden border border-slate-100 dark:border-white/5 h-[420px] flex flex-col group hover:shadow-2xl transition-all duration-300"
              >
                {/* Header Profil */}
                <div className="px-5 py-3.5 border-b border-gray-100 dark:border-white/5 flex items-center gap-3 bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
                  <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shrink-0 shadow-sm">
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
                    <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm font-sans truncate flex items-center gap-1.5">
                      dpmptspkabluwu
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 inline" />
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {t("mppPortal.sosialMedia.igSubtitle")}
                    </span>
                  </div>
                  <a 
                    href="https://instagram.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="ml-auto min-h-[48px] text-xs sm:text-sm font-semibold tracking-wide px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white transition-all flex items-center gap-1.5 font-sans shrink-0 shadow-md shadow-emerald-500/20"
                  >
                    <span>{t("mppPortal.sosialMedia.followBtn")}</span>
                    <Instagram className="w-4 h-4" />
                  </a>
                </div>

                {/* Konten Feed Post */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                  <img 
                    src="https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&q=80&w=800" 
                    alt="Aktivitas Pelayanan Publik MPP Luwu" 
                    referrerPolicy="no-referrer" 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMAGE_URL;
                      e.currentTarget.style.backgroundColor = '#10b981';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-4.5 py-1 rounded-lg text-[10px] font-medium text-white flex items-center gap-1">
                    <Instagram className="w-3 h-3 text-pink-400" /> {t("mppPortal.sosialMedia.igTag")}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"></div>
                </div>

                {/* Info Interaksi & Cuplikan Narasi */}
                <div className="p-4 flex flex-col flex-1 justify-between bg-white dark:bg-slate-900/60">
                  <div>
                    <div className="flex items-center gap-4 text-slate-700 dark:text-slate-300 mb-1.5">
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                      <MessageCircle className="w-4 h-4" />
                      <Share2 className="w-4 h-4" />
                      <span className="text-[11px] font-bold ml-auto text-slate-500 dark:text-slate-400">
                        {t("mppPortal.sosialMedia.igLikes")}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 leading-normal line-clamp-2">
                      {t("mppPortal.sosialMedia.igDesc")}
                    </p>
                  </div>

                  {/* Tombol CTA */}
                  <a 
                    href="https://instagram.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="min-h-[48px] mt-2 pt-2 border-t border-gray-100 dark:border-white/5 text-xs sm:text-sm font-semibold tracking-wide text-emerald-600 dark:text-emerald-400 flex items-center justify-between hover:text-emerald-500 transition-colors"
                  >
                    <span>{t("mppPortal.sosialMedia.igBtn")}</span>
                    <ArrowRight size={16} />
                  </a>
                </div>
              </motion.div>

              {/* Kartu 2: YouTube */}
              <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.96, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.3, delay: 0.08, ease: "easeOut" }}
                className="bg-white/80 dark:bg-slate-800/40 backdrop-blur-xl rounded-3xl shadow-lg shadow-emerald-900/5 dark:shadow-emerald-900/20 overflow-hidden border border-slate-100 dark:border-white/5 h-[420px] flex flex-col group hover:shadow-2xl transition-all duration-300"
              >
                {/* Header Profil */}
                <div className="px-5 py-3.5 border-b border-gray-100 dark:border-white/5 flex items-center gap-3 bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-red-600/10 text-red-600 flex items-center justify-center shrink-0 border border-red-600/20 shadow-sm">
                    <Youtube className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm font-sans truncate">
                      {t("mppPortal.sosialMedia.ytTitle")}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {t("mppPortal.sosialMedia.ytSubtitle")}
                    </span>
                  </div>
                  <a 
                    href="https://youtube.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="ml-auto min-h-[48px] text-xs sm:text-sm font-semibold tracking-wide px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 text-white transition-all flex items-center gap-1.5 font-sans shrink-0 shadow-md shadow-red-600/20"
                  >
                    <span>{t("mppPortal.sosialMedia.subscribeBtn")}</span>
                    <Youtube className="w-4 h-4" />
                  </a>
                </div>

                {/* Konten Video Simulasi */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-900 shrink-0 flex items-center justify-center cursor-pointer">
                  <img 
                    src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800" 
                    alt="Video Profil Pelayanan MPP Simpurusiang" 
                    referrerPolicy="no-referrer" 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMAGE_URL;
                      e.currentTarget.style.backgroundColor = '#10b981';
                    }}
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/40 group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 ml-0.5 fill-current" />
                  </div>
                  <span className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-sm px-4 py-0.5 rounded text-[10px] font-bold text-white">
                    04:15
                  </span>
                </div>

                {/* Info Judul Video & Statistik */}
                <div className="p-4 flex flex-col flex-1 justify-between bg-white dark:bg-slate-900/60">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm font-sans line-clamp-1 leading-snug group-hover:text-emerald-500 transition-colors">
                      {t("mppPortal.sosialMedia.ytVideoTitle")}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {t("mppPortal.sosialMedia.ytVideoStats")}
                    </p>
                  </div>

                  {/* Tombol CTA */}
                  <a 
                    href="https://youtube.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="min-h-[48px] mt-2 pt-2 border-t border-gray-100 dark:border-white/5 text-xs sm:text-sm font-semibold tracking-wide text-emerald-600 dark:text-emerald-400 flex items-center justify-between hover:text-emerald-500 transition-colors"
                  >
                    <span>{t("mppPortal.sosialMedia.ytBtn")}</span>
                    <ArrowRight size={16} />
                  </a>
                </div>
              </motion.div>

              {/* Kartu 3: Facebook */}
              <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.96, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.3, delay: 0.16, ease: "easeOut" }}
                className="bg-white/80 dark:bg-slate-800/40 backdrop-blur-xl rounded-3xl shadow-lg shadow-emerald-900/5 dark:shadow-emerald-900/20 overflow-hidden border border-slate-100 dark:border-white/5 h-[420px] flex flex-col group hover:shadow-2xl transition-all duration-300"
              >
                {/* Header Profil */}
                <div className="px-5 py-3.5 border-b border-gray-100 dark:border-white/5 flex items-center gap-3 bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center shrink-0 border border-[#1877F2]/20 shadow-sm">
                    <Facebook className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm font-sans truncate">
                      {t("mppPortal.sosialMedia.fbTitle")}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {t("mppPortal.sosialMedia.fbSubtitle")}
                    </span>
                  </div>
                  <a 
                    href="https://facebook.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="ml-auto min-h-[48px] text-xs sm:text-sm font-semibold tracking-wide px-4 py-2.5 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] active:scale-95 text-white transition-all flex items-center gap-1.5 font-sans shrink-0 shadow-md shadow-blue-500/20"
                  >
                    <span>{t("mppPortal.sosialMedia.followBtn")}</span>
                    <Facebook className="w-4 h-4" />
                  </a>
                </div>

                {/* Konten Feed Post */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                  <img 
                    src="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80&w=800" 
                    alt="Sosialisasi Perizinan dan Pelayanan Terpadu Luwu" 
                    referrerPolicy="no-referrer" 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMAGE_URL;
                      e.currentTarget.style.backgroundColor = '#10b981';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-4.5 py-1 rounded-lg text-[10px] font-medium text-white flex items-center gap-1">
                    <Facebook className="w-3 h-3 text-blue-400" /> {t("mppPortal.sosialMedia.fbTag")}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"></div>
                </div>

                {/* Info Interaksi & Cuplikan Narasi */}
                <div className="p-4 flex flex-col flex-1 justify-between bg-white dark:bg-slate-900/60">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                      <span>{t("mppPortal.sosialMedia.fbStats")}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 leading-normal line-clamp-2">
                      {t("mppPortal.sosialMedia.fbDesc")}
                    </p>
                  </div>

                  {/* Tombol CTA */}
                  <a 
                    href="https://facebook.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="min-h-[48px] mt-2 pt-2 border-t border-gray-100 dark:border-white/5 text-xs sm:text-sm font-semibold tracking-wide text-emerald-600 dark:text-emerald-400 flex items-center justify-between hover:text-emerald-500 transition-colors"
                  >
                    <span>{t("mppPortal.sosialMedia.fbBtn")}</span>
                    <ArrowRight size={16} />
                  </a>
                </div>
              </motion.div>

              {/* Kartu 4: TikTok */}
              <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.96, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.3, delay: 0.24, ease: "easeOut" }}
                className="bg-white/80 dark:bg-slate-800/40 backdrop-blur-xl rounded-3xl shadow-lg shadow-emerald-900/5 dark:shadow-emerald-900/20 overflow-hidden border border-slate-100 dark:border-white/5 h-[420px] flex flex-col group hover:shadow-2xl transition-all duration-300"
              >
                {/* Header Profil */}
                <div className="px-5 py-3.5 border-b border-gray-100 dark:border-white/5 flex items-center gap-3 bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shrink-0 shadow-sm border border-slate-700/20">
                    <Music2 className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm font-sans truncate">
                      @mpp.luwu
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {t("mppPortal.sosialMedia.ttSubtitle")}
                    </span>
                  </div>
                  <a 
                    href="https://tiktok.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="ml-auto min-h-[48px] text-xs sm:text-sm font-semibold tracking-wide px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 active:scale-95 text-white transition-all flex items-center gap-1.5 font-sans shrink-0 shadow-md"
                  >
                    <span>{t("mppPortal.sosialMedia.followBtn")}</span>
                    <Music2 className="w-4 h-4" />
                  </a>
                </div>

                {/* Konten Video Feed Simulasi */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-900 shrink-0">
                  <img 
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800" 
                    alt="Edukasi Pelayanan Publik MPP Simpurusiang" 
                    referrerPolicy="no-referrer" 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMAGE_URL;
                      e.currentTarget.style.backgroundColor = '#10b981';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" 
                  />
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-4.5 py-1 rounded-lg text-[10px] font-medium text-white flex items-center gap-1">
                    <Music2 className="w-3 h-3 text-cyan-400" /> {t("mppPortal.sosialMedia.ttTag")}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3.5">
                    <span className="text-white text-xs font-bold font-sans drop-shadow-sm">
                      {t("mppPortal.sosialMedia.ttTitle")}
                    </span>
                    <span className="text-[10px] text-slate-300 mt-0.5 flex items-center gap-1">
                      <Music2 className="w-2.5 h-2.5" /> {t("mppPortal.sosialMedia.ttSound")}
                    </span>
                  </div>
                </div>

                {/* Info Interaksi */}
                <div className="p-4 flex flex-col flex-1 justify-between bg-white dark:bg-slate-900/60">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{t("mppPortal.sosialMedia.ttLikes")}</span>
                    <span>{t("mppPortal.sosialMedia.ttComments")}</span>
                    <span>{t("mppPortal.sosialMedia.ttShares")}</span>
                  </div>

                  {/* Tombol CTA */}
                  <a 
                    href="https://tiktok.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="min-h-[48px] mt-2 pt-2 border-t border-gray-100 dark:border-white/5 text-xs sm:text-sm font-semibold tracking-wide text-emerald-600 dark:text-emerald-400 flex items-center justify-between hover:text-emerald-500 transition-colors"
                  >
                    <span>{t("mppPortal.sosialMedia.ttBtn")}</span>
                    <ArrowRight size={16} />
                  </a>
                </div>
              </motion.div>
            </div>
          </motion.section>

          {/* FASE 8: Peta Spasial / WebGIS Integrasi */}
          <motion.section
            id="peta-spasial"
            initial={{ opacity: 0, y: 40, scale: 0.96, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ type: "spring", stiffness: 75, damping: 20, mass: 0.9 }}
            className="w-[95%] sm:w-[90%] lg:w-[85%] mx-auto scroll-mt-28 py-12 sm:py-16 md:py-24"
          >
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-[2.5rem] p-4 sm:p-8 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center gap-10">
              {/* Pattern Background */}
              <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(16, 185, 129, 0.4) 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
              <div className="absolute -left-20 -top-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 md:w-1/2 text-left">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 mb-4 font-sans">
                  <Globe className="w-3.5 h-3.5" />
                  {t("mppPortal.map.geospatialBadge", "Eksplorasi Geospasial")}
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-white font-sans">
                  {t("mppPortal.webgisTitle", "WebGIS & Potensi Investasi Luwu")}
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8 max-w-lg">
                  {t("mppPortal.map.geospatialDesc", "Portal MPP Simpurusiang terintegrasi langsung dengan platform spasial cerdas. Analisis potensi lahan, pantau infrastruktur, dan rancang titik lokasi bisnis Anda secara presisi dengan sistem informasi geografis kami.")}
                </p>
                <button
                  type="button"
                  onClick={() => window.location.href = '/?skipSplash=true'}
                  className="w-full flex items-center justify-between min-h-[50px] bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold font-sans shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 group"
                >
                  <Map className="w-5 h-5" />
                  <span>{t("mppPortal.map.openInteractive")}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="relative z-10 md:w-1/2 w-full mt-8 md:mt-0">
                <div className="relative w-full overflow-hidden rounded-3xl shadow-2xl border border-slate-700/50 group">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10 pointer-events-none opacity-60"></div>
                  <img 
                    src="/images/map-preview.jpg" 
                    alt="WebGIS Preview"
                    className="w-full h-[300px] sm:h-[400px] object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';
                    }}
                  />
                  {/* Floating Elements on Map Preview */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse">
                    <MapPin className="w-8 h-8 text-emerald-400" />
                  </div>
                  
                  {/* Mock UI Overlay */}
                  <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                    <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/50 text-xs font-mono text-emerald-400">
                      LAT: -2.5768 | LNG: 120.1983
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-4 z-20">
                    <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700/50 flex items-center gap-3 shadow-lg">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
                      <span className="text-xs font-semibold text-white">{t("mppPortal.status.systemActive")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Seksi Tanya Jawab (FAQ) Interaktif */}
          <motion.section
            id="faq"
            initial={{ opacity: 0, y: 40, scale: 0.96, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ type: "spring", stiffness: 75, damping: 20, mass: 0.9 }}
            className="max-w-5xl mx-auto  w-full scroll-mt-28 py-12 sm:py-16 md:py-24 px-2 sm:px-5 md:px-8"
          >
            {/* Header Seksi Terpusat */}
            <div className="w-full max-w-[96%] sm:max-w-xl mx-auto text-center px-4 flex flex-col items-center mb-8 sm:mb-12 break-words">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2.5 inline-block text-center font-sans bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 rounded-full">
                {t("mppPortal.faq.badge")}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white font-sans">
                {t("mppPortal.faq.title")}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-[96%] mx-auto leading-relaxed mt-2.5 mb-6 text-center">
                {t("mppPortal.faq.subtitle")}
              </p>
              <div className="w-12 sm:w-16 h-1 bg-emerald-500 rounded-full mx-auto mt-4"></div>
            </div>

            {/* Input Pencarian FAQ Real-time */}
            <div className="relative max-w-2xl mx-auto mb-8 w-full">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={faqSearchQuery}
                onChange={(e) => setFaqSearchQuery(e.target.value)}
                placeholder={t("mppPortal.faq.searchPlaceholder")}
                className="w-full min-h-[50px] pl-12 pr-10 py-3 rounded-2xl bg-white/90 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm transition-all"
              />
              {faqSearchQuery && (
                <button
                  type="button"
                  onClick={() => setFaqSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                  aria-label={t("common.clearSearch", "Hapus pencarian")}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Accordion List FAQ */}
            <div className="space-y-3.5 w-full">
              {(() => {
                const rawFaqItems = (t("mppPortal.faq.items", { returnObjects: true }) as Array<{ question: string; answer: string }>) || [];
                const filteredFaqs = Array.isArray(rawFaqItems) 
                  ? rawFaqItems.filter(item => 
                      !faqSearchQuery.trim() || 
                      item.question.toLowerCase().includes(faqSearchQuery.toLowerCase()) || 
                      item.answer.toLowerCase().includes(faqSearchQuery.toLowerCase())
                    )
                  : [];

                if (filteredFaqs.length === 0) {
                  return (
                    <div className="text-center py-10 bg-white/60 dark:bg-slate-800/40 rounded-3xl border border-slate-200/80 dark:border-white/5 p-6">
                      <HelpCircle className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 font-sans">
                        {t("mppPortal.faq.noResults")}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsHelpdeskSubmitted(false);
                          setIsHelpdeskModalOpen(true);
                        }}
                        className="mt-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline font-sans inline-flex items-center gap-1.5"
                      >
                        <Headphones className="w-3.5 h-3.5" />
                        <span>{t("mppPortal.faq.contactHelpdesk")}</span>
                      </button>
                    </div>
                  );
                }

                return filteredFaqs.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.25, delay: idx * 0.04 }}
                      className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full text-left min-h-[56px] p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer"
                        aria-expanded={isOpen}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold font-sans transition-colors ${
                            isOpen 
                              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25' 
                              : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            Q{idx + 1}
                          </div>
                          <span className="font-bold text-xs sm:text-sm md:text-base text-slate-900 dark:text-white font-sans leading-snug">
                            {faq.question}
                          </span>
                        </div>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-90 text-emerald-500' : ''}`}>
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </button>

                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          className="px-4 sm:px-5 pb-5 pt-1 text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed border-t border-slate-100 dark:border-white/5"
                        >
                          <div className="pl-11 pr-2">
                            <p className="bg-slate-50 dark:bg-slate-900/60 p-3.5 sm:p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                              {faq.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                });
              })()}
            </div>

            {/* Quick Banner di bawah FAQ */}
            <div className="mt-8 p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-sans">
                    {t("mppPortal.faq.contactHelpdesk")}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t("mppPortal.pengaduan.helpdeskDesc")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsHelpdeskSubmitted(false);
                  setIsHelpdeskModalOpen(true);
                }}
                className="min-h-[42px] px-5 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold font-sans shadow-md shadow-emerald-500/25 transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>{t("mppPortal.helpdesk.open")}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.section>

          {/* Widget Prakiraan Cuaca Kabupaten Luwu (Paling Bawah Di Atas Footer) */}
          <div className="w-[95%] sm:w-[90%] lg:w-[85%] max-w-4xl mx-auto my-12 flex justify-center">
            <WeatherWidget />
          </div>

          {/* BURSA KOMODITAS - LIVE MARKET TICKER SECTION (Elegant Bottom Page Section) */}
          <div className="w-[95%] sm:w-[90%] lg:w-[85%] max-w-4xl mx-auto my-8 flex flex-col items-center">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-[#00FF99] border border-emerald-500/20 text-[10px] font-bold tracking-wider uppercase font-sans mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Bursa Komoditas Luwu
            </div>
            <div className="w-full flex justify-center py-1 bg-white/50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/30 dark:border-white/5 backdrop-blur-sm shadow-xs">
              <LiveMarketTicker isDark={isDark} />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gradient-to-b from-white/90 via-slate-50/90 to-slate-100/90 dark:from-slate-950/90 dark:via-[#070D18]/90 dark:to-slate-950/95 backdrop-blur-2xl pt-8 sm:pt-14 pb-24 sm:pb-36 border-t border-slate-200/80 dark:border-white/10 shadow-2xl shadow-emerald-950/10 w-full relative overflow-hidden">
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none translate-y-1/2" />

          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.98, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }} 
            transition={{ type: "spring", stiffness: 75, damping: 20 }} 
            viewport={{ once: true, amount: 0.1 }} 
            className="w-[94%] sm:w-[90%] lg:w-[88%] max-w-7xl mx-auto relative z-10"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
              {/* Brand & Description (5 cols on desktop) */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-3.5">
                    <div className="p-2 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-blue-500/10 to-teal-500/15 border border-emerald-500/30 shadow-md shadow-emerald-500/10 shrink-0">
                      <img 
                        alt="Lambang Kabupaten Luwu" 
                        className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-sm" 
                        src={LUWU_LOGO_BASE64}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK_IMAGE_URL;
                          e.currentTarget.style.backgroundColor = '#10b981';
                        }}
                      />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight font-sans">
                          MPP Simpurusiang
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>{t("mppPortal.footer.official", "Resmi")}</span>
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {t("mppPortal.nav.govName")}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed mb-4 max-w-md">
                    {t("mppPortal.footer.desc")}
                  </p>
                </div>

                {/* Status Operasional & Info Lokasi */}
                <div className="flex flex-col gap-2.5 pt-1">
                  <div className="inline-flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-100/90 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 w-fit text-xs text-slate-700 dark:text-slate-200 font-medium shadow-xs">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span>{t("mppPortal.footer.hoursText")}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Jl. Jenderal Sudirman No. 1, Belopa</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                      <span>{t("mppPortal.footer.integratedService", "Pelayanan Publik Terintegrasi")}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Columns: Symmetrical 2-Column Grid on Mobile & Tablet (7 cols on lg) */}
              <div className="lg:col-span-7 grid grid-cols-2 gap-4 sm:gap-8 pt-2 sm:pt-0">
                {/* Kolom 1: Tautan Pintas */}
                <div className="bg-slate-50/70 dark:bg-white/[0.02] sm:bg-transparent sm:dark:bg-transparent rounded-2xl p-3.5 sm:p-0 border border-slate-200/60 dark:border-white/5 sm:border-0">
                  <div className="flex items-center gap-2 mb-3.5 pb-2 border-b border-slate-200/60 dark:border-white/10 sm:border-0 sm:pb-0">
                    <div className="w-1.5 h-4 rounded-full bg-emerald-500 shrink-0" />
                    <h4 className="font-sans text-xs sm:text-sm font-bold tracking-wider text-slate-900 dark:text-white uppercase truncate">
                      {t("mppPortal.footer.tautanPintas")}
                    </h4>
                  </div>
                  <ul className="flex flex-col gap-1.5 sm:gap-2">
                    <li>
                      <a 
                        className="group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-200" 
                        href="#hero"
                      >
                        <span className="truncate">{t("mppPortal.footer.beranda")}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-500 shrink-0" />
                      </a>
                    </li>
                    <li>
                      <a 
                        className="group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-200" 
                        href="#layanan"
                      >
                        <span className="truncate">{t("mppPortal.footer.daftarLayanan")}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-500 shrink-0" />
                      </a>
                    </li>
                    <li>
                      <a 
                        className="group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-200" 
                        href="#instansi"
                      >
                        <span className="truncate">{t("mppPortal.instansi.title")}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-500 shrink-0" />
                      </a>
                    </li>
                    <li>
                      <a 
                        className="group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-200" 
                        href="#statistik"
                      >
                        <span className="truncate">{t("mppPortal.statistik.title")}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-500 shrink-0" />
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Kolom 2: Dukungan & Bantuan */}
                <div className="bg-slate-50/70 dark:bg-white/[0.02] sm:bg-transparent sm:dark:bg-transparent rounded-2xl p-3.5 sm:p-0 border border-slate-200/60 dark:border-white/5 sm:border-0">
                  <div className="flex items-center gap-2 mb-3.5 pb-2 border-b border-slate-200/60 dark:border-white/10 sm:border-0 sm:pb-0">
                    <div className="w-1.5 h-4 rounded-full bg-teal-500 shrink-0" />
                    <h4 className="font-sans text-xs sm:text-sm font-bold tracking-wider text-slate-900 dark:text-white uppercase truncate">
                      {t("mppPortal.footer.dukungan")}
                    </h4>
                  </div>
                  <ul className="flex flex-col gap-1.5 sm:gap-2">
                    <li>
                      <a 
                        className="group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-200" 
                        href="#fasilitas"
                      >
                        <span className="truncate">{t("mppPortal.footer.informasiFasilitas")}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-500 shrink-0" />
                      </a>
                    </li>
                    <li>
                      <a 
                        className="group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-200" 
                        href="#faq"
                      >
                        <span className="truncate">{t("mppPortal.footer.tanyaJawab") || "Tanya Jawab (FAQ)"}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-500 shrink-0" />
                      </a>
                    </li>
                    <li>
                      <a 
                        className="group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-200" 
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
                        className="group w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all duration-200 cursor-pointer shadow-xs"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{t("mppPortal.footer.konsultasiAi")}</span>
                        </span>
                        <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-500 text-white dark:text-slate-950 font-sans shrink-0">
                          AI
                        </span>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Bottom Symmetrical Copyright Bar */}
            <div className="mt-10 sm:mt-12 pt-6 border-t border-slate-200/80 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
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

        {/* Desktop Floating AI Button */}
        <motion.button 
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAiModalOpen(true)}
          className="hidden md:flex fixed bottom-8 right-8 z-40 bg-gradient-to-r from-[#00FF99] to-emerald-400 text-white dark:text-[#000B14] px-5 py-3 rounded-full shadow-[0_0_30px_rgba(0,255,153,0.5)] items-center gap-3 hover:brightness-110 active:scale-95 transition-all group font-sans font-bold text-sm tracking-wide cursor-pointer"
        >
          {/* Cincin hijau / Ikon dengan Breathing Effect */}
          <motion.div 
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-8 h-8 rounded-full bg-slate-900/10 dark:bg-[#000B14]/15 ring-2 ring-emerald-400/40 flex items-center justify-center"
          >
            <Bot className="w-5 h-5 text-white dark:text-[#000B14] group-hover:rotate-12 transition-transform" />
          </motion.div>
          <span>{t("mppPortal.footer.konsultasiAi")}</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-950 animate-pulse"></span>
        </motion.button>

        {/* Android Native-Style Bottom Navigation Dock */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl border-t border-slate-200/80 dark:border-white/10 px-3 py-1.5 flex items-center justify-around shadow-2xl shadow-emerald-950/20 pb-[calc(env(safe-area-inset-bottom,0px)+6px)]">
          <a href="#hero" className="flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 active:text-emerald-500 min-h-[48px] min-w-[50px] transition-colors">
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-semibold font-sans">{t("mppPortal.nav.beranda")}</span>
          </a>

          <a href="#layanan" className="flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 active:text-emerald-500 min-h-[48px] min-w-[50px] transition-colors">
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[10px] font-semibold font-sans">{t("mppPortal.nav.layanan")}</span>
          </a>

          {/* Elevated Center Action: Asisten AI with Breathing Effect */}
          <div className="relative -top-3.5 flex flex-col items-center">
            <motion.div 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="relative flex items-center justify-center"
            >
              <div className="absolute -inset-1 rounded-full bg-emerald-400/30 blur-sm pointer-events-none" />
              <motion.button 
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => setIsAiModalOpen(true)}
                className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-tr from-[#00FF99] via-emerald-400 to-teal-300 text-white dark:text-[#000B14] flex items-center justify-center shadow-[0_0_25px_rgba(0,255,153,0.6)] border-[3px] border-white dark:border-[#000E1A] active:brightness-110 transition-transform cursor-pointer"
                title={t("mppPortal.tooltips.openAi")}
              >
                <Bot className="w-6 h-6 animate-pulse" />
              </motion.button>
            </motion.div>
            <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 font-sans mt-0.5 tracking-tight whitespace-nowrap">Asisten AI</span>
          </div>

          <a href="#instansi" className="flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 active:text-emerald-500 min-h-[48px] min-w-[50px] transition-colors">
            <Building2 className="w-5 h-5" />
            <span className="text-[10px] font-semibold font-sans">{t("mppPortal.nav.instansi")}</span>
          </a>

          <a href="#fasilitas" className="flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 active:text-emerald-500 min-h-[48px] min-w-[50px] transition-colors">
            <Armchair className="w-5 h-5" />
            <span className="text-[10px] font-semibold font-sans">{t("mppPortal.nav.fasilitas")}</span>
          </a>
        </nav>

        {/* Fitur 8: Interactive Virtual Helpdesk Modal */}
        {isHelpdeskModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsHelpdeskModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 25, filter: "blur(6px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.94, y: 20, filter: "blur(4px)" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-4 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
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
                      className="w-full sm:flex-1 min-h-[44px] px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-semibold font-sans shadow-md shadow-emerald-500/25 transition-all flex items-center justify-center gap-1.5"
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
                      className="flex-1 min-h-[44px] py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs sm:text-sm font-semibold font-sans shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
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
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedAgencyDetail(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Modal Detail Instansi */}
              <div className="flex items-start justify-between pb-4 sm:pb-5 border-b border-slate-100 dark:border-white/10 gap-3 sm:gap-4">
                <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 overflow-hidden shadow-inner p-1.5">
                    <img 
                      src={activeAgency.logo || '/logo-luwu-clean.svg'} 
                      alt={activeAgency.nama}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/logo-luwu-clean.svg';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-['Plus_Jakarta_Sans',sans-serif]">
                        {activeAgency.kategori || "Instansi Terintegrasi"}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 font-['Plus_Jakarta_Sans',sans-serif]">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        {activeAgency.loket || "Gerai MPP Simpurusiang"}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-extrabold text-slate-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif] leading-snug">
                      {activeAgency.fullName || activeAgency.nama}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedAgencyDetail(null)}
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
                  aria-label={t("common.close", "Tutup")}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Deskripsi & Jam Pelayanan */}
              <div className="mt-5 space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1 font-sans">
                    {t("agencyModal.about")}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {activeAgency.deskripsi || activeAgency.layanan}
                  </p>
                  <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    <Clock3 className="w-4 h-4" />
                    <span>{t("agencyModal.schedule")}: {activeAgency.jamLayanan || "Senin - Jumat | 08:00 - 15:00 WITA"}</span>
                  </div>
                </div>

                {/* Daftar Layanan Terintegrasi */}
                <div>
                  <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2.5 font-sans flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-500" />
                    <span>{t("agencyModal.serviceList")}</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                    {(activeAgency.layananList || [activeAgency.layanan]).map((layanan, lIdx) => (
                      <div 
                        key={lIdx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-white/5 flex items-start gap-2.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-tight">
                          {layanan}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ketentuan & Persyaratan Umum */}
                {activeAgency.syaratUmum && activeAgency.syaratUmum.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-2 font-sans flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{t("agencyModal.requirements")}</span>
                    </span>
                    <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                      {activeAgency.syaratUmum.map((syarat, sIdx) => (
                        <li key={sIdx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                          <span>{syarat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

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
                    className="w-full sm:flex-1 min-h-[48px] py-3 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs sm:text-sm font-semibold font-sans shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
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
              </div>
            </motion.div>
          </div>
          );
        })()}

        {/* --- FITUR 11: MODAL BOOKING ANTREAN ONLINE & DIGITAL E-TICKET PASS --- */}
        {isQueueBookingOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsQueueBookingOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 25, filter: "blur(6px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.94, y: 20, filter: "blur(4px)" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-4 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
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
                      <div className="absolute -left-9 -top-3 w-6 h-6 bg-white dark:bg-slate-900 rounded-full" />
                      <div className="absolute -right-9 -top-3 w-6 h-6 bg-white dark:bg-slate-900 rounded-full" />
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
                        REF#{generatedTicket.number}-{Math.floor(Date.now() / 1000).toString().slice(-4)}
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
                    <div className="w-full mt-3 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-amber-500/10 border-2 border-emerald-500/40 text-left shadow-lg shadow-emerald-500/10">
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
                        className="w-full mt-3 min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs sm:text-sm font-bold font-sans shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
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
                      {/* Opsi Pengujian / Demo Alur */}
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-slate-400">{t("bookingModal.testCallLabel", "Uji Panggilan Operator:")}</span>
                          <button
                            type="button"
                            onClick={handleSimulateOperatorCall}
                            className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            {t("bookingModal.testCallAction", "Simulasikan Bel Bandara & Panggilan")}
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-slate-400">{t("bookingModal.testCompletedLabel", "Uji Layanan Selesai:")}</span>
                          <button
                            type="button"
                            onClick={handleSimulateServiceCompleted}
                            className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            {t("bookingModal.testCompletedAction", "Simulasikan Pelayanan Selesai")}
                          </button>
                        </div>
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
                      onClick={() => window.print()}
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
                        Perhatian: Pelayanan tatap muka MPP beroperasi pada hari kerja (Senin - Jumat, 08:00 - 15:00 WITA). Kunjungan akhir pekan akan diproses pada hari kerja berikutnya.
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
                  <div className="sticky bottom-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 border-t border-slate-200/60 dark:border-slate-800/80 -mx-4 sm:-mx-8 -mb-4 sm:-mb-8 mt-5 rounded-b-3xl md:static md:bg-transparent md:border-none md:p-0 md:m-0 md:rounded-none flex items-center gap-3">
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
                      className="flex-1 min-h-[44px] py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs sm:text-sm font-semibold font-sans shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
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
              className={`fixed bottom-6 left-1/2 z-40 w-[90%] max-w-sm backdrop-blur-md text-white shadow-2xl rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between border pr-10 gap-3 sm:gap-0 transition-all ${
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
        <MppVisionModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />

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
          onClose={() => setIsServicesMatrixOpen(false)}
          onSelectRequirement={(serviceName) => {
            const el = document.getElementById('syarat-dokumen');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          isDark={isDark}
        />
      </div>
    </div>
  );
}
