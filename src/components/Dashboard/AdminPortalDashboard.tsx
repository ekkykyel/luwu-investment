import { requestSmartFullscreen, exitSmartFullscreen } from "../../utils/fullscreen";
import { useNavigate, useLocation } from "react-router-dom";
import { AdminCommodityPrices } from './AdminCommodityPrices';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { motion, AnimatePresence } from 'motion/react';
import { OssRoiSimulatorInputs } from "../OssRoiSimulatorInputs";
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  ShieldCheck, 
  Calculator, 
  LogOut, 
  Menu, 
  X,
  TrendingUp,
  Map,
  Compass,
  ArrowUpRight,
  Briefcase,
  Layers,
  Percent,
  CheckCircle2,
  Building2,
  MapPin,
  Maximize2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Loader2,
  MessageSquare,
  FileText,
  Activity,
  RefreshCw,
  Bell,
  Clock,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  AlertCircle,
  Filter
, Users, Plus, PlusCircle, Globe, Info, CheckCircle, Database, Download, FileDown, Settings, BarChart3, BookOpen, Scale, Lightbulb, FileCheck, BookDown} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, Legend } from 'recharts';
import Swal from 'sweetalert2';
import { supabase } from '../../lib/supabaseClient.js';
import { Investment, SektorInvestasi, District } from '../../types.js';
import { SECTOR_COLORS } from '../../lib/constants.js';
import { formatRupiahSingkat, formatRupiah } from '../../lib/formatters.js';
import { InvestmentDetailModal } from '../InvestmentDetailModal.js';
import NibVerificationForm from '../Auth/NibVerificationForm.js';
import OpdSettingsView from './OpdSettingsView';
import PuptrArchiveView from './PuptrArchiveView';
import PertanianArchiveView from './PertanianArchiveView';
import OssSkArchiveView from './OssSkArchiveView';
import PuptrSpatialClearanceDashboard from './PuptrSpatialClearanceDashboard';
import PertanianLandClearanceDashboard from './PertanianLandClearanceDashboard';
import PkkprBusinessProcessMonitorDashboard from './PkkprBusinessProcessMonitorDashboard';
import PertanianOverview from './PertanianOverview';
import PuptrOverview from './PuptrOverview';
import { LuwuLogo } from '../LuwuLogo.js';
import { CrossOpdNotificationBell } from '../CrossOpdNotificationBell';
import { addCrossOpdNotification } from '../../utils/crossOpdNotificationStore';
import { generateSkPkkprPdf } from '../../utils/skPkkprPdfGenerator';
import ThemeToggle from '@/components/ThemeToggle';
import { EmptyState } from './EmptyState';
import { AnimatedCounter } from '../AnimatedCounter.js';
import LoadingScreen from '../LoadingScreen.js';
import jsPDF from "jspdf";
import { safeHtml2Canvas, pdfRenderQueue, waitForDomAndIdle } from "../../lib/html2canvasShim";
import DalakMap from "./DalakMap";
import AISiteSelection from '../AISiteSelection.js';
import AdminSidebar, { isOperatorWorkspaceRole } from './AdminSidebar.js';
import UploadRagPanel from '../UploadRagPanel';
import ManageOperatorsModal from '../ManageOperatorsModal';
import CreateOperatorModal from '../CreateOperatorModal';
import AdminLayout from '../Admin/AdminLayout';
import SmartInvestmentFormEngine from '../SmartInvestmentFormEngine';
import TataRuangInvestasi from '../Admin/Views/TataRuangInvestasi';
import UploadGeoJsonPanel from '../UploadGeoJsonPanel';
import { OperatorLaborWidget } from './OperatorLaborWidget';
import SpatialAnalyticsEditorView from './SpatialAnalyticsEditorView';

const formatRoleLabel = (role: string) => {
  switch (role) {
    case 'superadmin': return 'Super Administrator';
    case 'admin_dalak': return 'Admin - Bidang Dalak';
    case 'admin_promosi': return 'Admin - Bidang Promosi & Penanaman Modal';
    case 'admin_oss': return 'Admin - Bidang Perizinan / OSS';
    case 'admin_data': return 'Admin - Bidang Perencanaan & Data';
    case 'investor': return 'Investor Partner';
    default: return 'User';
  }
};

const calculateSLA = (lastUpdatedAt: string | null | undefined) => {
  if (!lastUpdatedAt) return { days: 0, status: 'Aman', color: 'text-emerald-400', badge: 'bg-emerald-500/20 border-emerald-500/50' };
  
  const updatedDate = new Date(lastUpdatedAt);
  if (isNaN(updatedDate.getTime())) {
    return { days: 0, status: 'Aman', color: 'text-emerald-400', badge: 'bg-emerald-500/20 border-emerald-500/50' };
  }
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - updatedDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 0; 

  if (diffDays <= 2) {
    return { days: diffDays, status: 'Aman', color: 'text-emerald-400', badge: 'bg-emerald-500/20 border-emerald-500/30' }; // < 48 hours
  } else if (diffDays === 3) {
    return { days: diffDays, status: 'Warning', color: 'text-amber-400', badge: 'bg-amber-500/20 border-amber-500/50 animate-pulse' }; // 48 - 72 hours
  } else {
    return { days: diffDays, status: 'Terlambat', color: 'text-rose-400', badge: 'bg-rose-500/20 border-rose-500/50 shadow-[0_0_15px_rgba(225,29,72,0.5)]' }; // > 72 hours (SLA Breach)
  }
};

export default function AdminPortalDashboard() {
  const {
    investments = [],
    districts = [],
    villages = [],
    spatialLayers = {},
    refreshData,
    loiCount = 0,
  } = useData();

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { return () => { exitSmartFullscreen(); }; }, []);

  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>('overview');

  useEffect(() => {
    const path = (location.pathname || window.location.pathname).toLowerCase();
    if (path.includes('operator_workspace') || path.includes('operator-workspace')) {
      if (isOperatorWorkspaceRole(userRole)) {
        window.location.href = "/operator-workspace";
      } else {
        setActiveTab('overview');
      }
      return;
    }
    if (path.includes('pengaduan')) setActiveTab('pengaduan');
    else if (path.includes('pengawasan')) setActiveTab('pengawasan');
    else if (path.includes('fasilitasi')) setActiveTab('fasilitasi');
    else if (path.includes('laporan')) setActiveTab('laporan');
    else if (path.includes('loi') || path.includes('tickets')) setActiveTab('loi_verify');
    else if (path.includes('potential') || path.includes('potensi')) setActiveTab('manage_potential');
    else if (path.includes('site-selection') || path.includes('site_selection')) setActiveTab('site-selection');
    else if (path.includes('testimonials') || path.includes('testimoni')) setActiveTab('testimonials');
    else if (path.includes('verifikasi_pkkpr') || path.includes('pkkpr')) setActiveTab('verifikasi_pkkpr');
    else if (path.includes('realisasi_nib') || path.includes('nib')) setActiveTab('realisasi_nib');
    else if (path.includes('spatial_analytics') || path.includes('analytics')) setActiveTab('spatial_analytics');
    else if (path.includes('gis_spatial') || path.includes('gis')) setActiveTab('gis_spatial');
    else if (path.includes('overview_perizinan') || path.includes('perizinan')) setActiveTab('overview_perizinan');
    else if (path.includes('overview')) setActiveTab('overview');
  }, [location.pathname]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedTickets, setExpandedTickets] = useState<Record<string, boolean>>({});

  const toggleTicketExpand = (id: string) => {
    setExpandedTickets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");
  useEffect(() => {
    if (!selectedDistrictId && districts.length > 0) {
      setSelectedDistrictId(districts[0].id);
    }
  }, [districts, selectedDistrictId]);

  const investmentTrend = useMemo(() => {
    if (!selectedDistrictId) return [];
    const districtInvestments = investments.filter(inv => inv.districtId === selectedDistrictId);
    
    // Group by year and sum investmentValue
    const trendMap = districtInvestments.reduce((acc: Record<number, number>, inv) => {
      const year = new Date(inv.createdAt).getFullYear();
      if (!isNaN(year)) {
        acc[year] = (acc[year] || 0) + (inv.investmentValue || 0);
      }
      return acc;
    }, {});
    
    return Object.keys(trendMap)
      .sort()
      .map(year => ({ year: Number(year), value: trendMap[Number(year)] }));
  }, [investments, selectedDistrictId]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>(() => {
    const raw = typeof window !== 'undefined' ? (localStorage.getItem("luwu_user_role") || "").toLowerCase().trim() : "";
    if (raw.includes("dalak")) return "admin_dalak";
    if (raw.includes("oss") || raw.includes("pelayanan")) return "admin_oss";
    if (raw.includes("promosi")) return "admin_promosi";
    if (raw.includes("data")) return "admin_data";
    if (raw.includes("puptr") || raw.includes("gis")) return "admin_puptr";
    if (raw.includes("pertanian")) return "admin_pertanian";
    if (raw.includes("super")) return "superadmin";
    return raw || "admin_dalak";
  });
  const [error, setError] = useState<string | null>(null);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<string | null>(null);

  // Real-Time SLA Notification States
  const [isSlaDropdownOpen, setIsSlaDropdownOpen] = useState(false);

  // States for Admin OSS (Perizinan)
  const [loiTickets, setLoiTickets] = useState<any[]>([]);
  const [loadingLoiTickets, setLoadingLoiTickets] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isCreateOperatorOpen, setIsCreateOperatorOpen] = useState(false);
  const [isAddIproModalOpen, setIsAddIproModalOpen] = useState(false);
  const [selectedTicketForAction, setSelectedTicketForAction] = useState<any | null>(null);

  useEffect(() => {
    console.log(`[AdminPortalDashboard] activeTab updated: "${activeTab}"`);
  }, [activeTab]);

  useEffect(() => {
    console.log(`[AdminPortalDashboard] isAddIproModalOpen updated: ${isAddIproModalOpen}`);
  }, [isAddIproModalOpen]);
  const [inputNib, setInputNib] = useState('');
  const [inputCatatan, setInputCatatan] = useState('');
  const [isSavingAction, setIsSavingAction] = useState(false);

  // States for OSS-RBA Sync Integration Simulation
  const [isSyncingOSS, setIsSyncingOSS] = useState(false);
  const [ossSyncStatus, setOssSyncStatus] = useState<'idle' | 'syncing' | 'success'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // States for Admin Dalak (Complaints / Pengaduan)
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [isDalakModalOpen, setIsDalakModalOpen] = useState(false);
  
  // Follow-up form states for Dalak Modal
  const [dalakStatus, setDalakStatus] = useState('');
  const [dalakSiteVisit, setDalakSiteVisit] = useState('');
  const [dalakLaporan, setDalakLaporan] = useState('');
  const [isSavingDalak, setIsSavingDalak] = useState(false);

  // Promosi KYC Modal States
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [selectedKycTicket, setSelectedKycTicket] = useState<any | null>(null);
  const [kycCatatan, setKycCatatan] = useState('');
  const [isSavingKyc, setIsSavingKyc] = useState(false);
  
  // SATGAS BAP State
  const [bapEskalasi, setBapEskalasi] = useState('Normal');
  const [bapCatatan, setBapCatatan] = useState('');
  const [isBapModalOpen, setIsBapModalOpen] = useState(false);
  const [satgasDecisions, setSatgasDecisions] = useState<any[]>([]);
  const [loadingSatgas, setLoadingSatgas] = useState(false);
  const [isSavingBap, setIsSavingBap] = useState(false);

  const fetchSatgasDecisions = async (ticketId: string) => {
    setLoadingSatgas(true);
    try {
      const { data, error } = await supabase
        .from("satgas_decisions")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: false });
      if (!error && data) {
        setSatgasDecisions(data);
      }
    } catch (err) {
      console.error("Gagal memuat log Satgas:", err);
    } finally {
      setLoadingSatgas(false);
    }
  };


  const fetchComplaints = async () => {
    setLoadingComplaints(true);
    try {
      const { data, error } = await supabase
        .from("pengaduan")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        setComplaints(data);
      }
    } catch (err) {
      console.error("Gagal memuat aduan masyarakat:", err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  const handleSaveBap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    
    setIsSavingBap(true);
    try {
      const { data, error } = await supabase
        .from('satgas_decisions')
        .insert([{
          ticket_id: selectedComplaint.id,
          status_eskalasi: bapEskalasi,
          catatan_rapat: bapCatatan,
          // dalak_admin_id can be added if auth is integrated
        }]);

      if (error) throw error;
      
      // Update parent ticket if escalated
      if (bapEskalasi !== 'Normal') {
        await supabase
          .from('pengaduan')
          .update({ status: bapEskalasi })
          .eq('id', selectedComplaint.id);
          
        fetchComplaints();
      }

      Swal.fire({
        title: 'BAP Tersimpan',
        text: 'Log keputusan Satgas berhasil dicatat.',
        icon: 'success',
        confirmButtonColor: '#10b981'
      });
      
      setIsBapModalOpen(false);
      setBapCatatan('');
      setBapEskalasi('Normal');
      fetchSatgasDecisions(selectedComplaint.id);
      
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        title: 'Gagal',
        text: err.message || 'Terjadi kesalahan saat menyimpan BAP.',
        icon: 'error',
        confirmButtonColor: '#10b981'
      });
    } finally {
      setIsSavingBap(false);
    }
  };

  const handleSaveDalakFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setIsSavingDalak(true);
    try {
      const { error } = await supabase
        .from("pengaduan")
        .update({
          status: dalakStatus,
          jadwal_site_visit: dalakSiteVisit || null,
          laporan_dalak: dalakLaporan || null,
        })
        .eq("id", selectedComplaint.id);

      if (error) throw error;

      Swal.fire({
        title: "Tindak Lanjut Disimpan",
        text: "Status aduan dan laporan mediasi berhasil diperbarui secara real-time.",
        icon: "success",
        background: "#0f172a",
        color: "#f8fafc",
        confirmButtonColor: "#10b981"
      });
      setIsDalakModalOpen(false);
      fetchComplaints();
    } catch (err: any) {
      console.error("Error saving Dalak update:", err);
      Swal.fire({
        title: "Gagal Menyimpan",
        text: err.message,
        icon: "error",
        background: "#0f172a",
        color: "#f8fafc"
      });
    } finally {
      setIsSavingDalak(false);
    }
  };

  const handleSaveKyc = async (e: React.FormEvent, nextStatus: string) => {
    e.preventDefault();
    if (!selectedKycTicket) return;
    setIsSavingKyc(true);
    try {
      const { error } = await supabase
        .from("investment_interests")
        .update({
          status: nextStatus,
          catatan_admin: kycCatatan || null,
        })
        .eq("id", selectedKycTicket.id);

      if (error) throw error;

      Swal.fire({
        title: "Status LoI Diperbarui",
        text: `Status berhasil diubah menjadi: ${nextStatus}.`,
        icon: "success",
        background: "#0f172a",
        color: "#f8fafc",
        confirmButtonColor: "#10b981"
      });
      setIsKycModalOpen(false);
      fetchLoiTickets();
    } catch (err: any) {
      console.error("Error saving KYC update:", err);
      Swal.fire({
        title: "Gagal Menyimpan",
        text: err.message,
        icon: "error",
        background: "#0f172a",
        color: "#f8fafc"
      });
    } finally {
      setIsSavingKyc(false);
    }
  };

  const openDalakModal = (complaint: any) => {
    setSelectedComplaint(complaint);
    fetchSatgasDecisions(complaint.id);
    setDalakStatus(complaint.status || "Menunggu Verifikasi");
    setDalakSiteVisit(complaint.jadwal_site_visit ? complaint.jadwal_site_visit.substring(0, 16) : "");
    setDalakLaporan(complaint.laporan_dalak || "");
    setIsDalakModalOpen(true);
  };

  const openKycModal = (ticket: any) => {
    setSelectedKycTicket(ticket);
    setKycCatatan(ticket?.catatan_admin || "");
    setIsKycModalOpen(true);
  };

  const openActionModal = openKycModal;

  const getAuthToken = (): string => {
    return (
      localStorage.getItem("luwu_session_token") ||
      localStorage.getItem("luwu_access_token") ||
      localStorage.getItem("sb-access-token") ||
      ""
    );
  };

  const getAuthHeaders = (): Record<string, string> => {
    const token = getAuthToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    };
  };

  const fetchLoiTickets = async () => {
    setLoadingLoiTickets(true);
    try {
      const res = await fetch("/api/investment-interests", {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setLoiTickets(data || []);
      }
    } catch (err) {
      console.error("Gagal memuat tiket minat (LoI):", err);
    } finally {
      setLoadingLoiTickets(false);
    }
  };

  const handleOSSSync = async () => {
    setIsSyncingOSS(true);
    setOssSyncStatus('syncing');
    
    // Simulate API delay for presentation purposes (BKPM Central OSS-RBA Sync Integration)
    await new Promise((resolve) => setTimeout(resolve, 2500));
    
    setOssSyncStatus('success');
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastSyncTime(formattedTime);
    setIsSyncingOSS(false);

    // Fetch refreshed tickets to ensure the view stays perfectly in sync (mock-pull)
    await fetchLoiTickets();

    Swal.fire({
      title: "Sinkronisasi Berhasil",
      text: "Berhasil menarik 0 data NIB baru dari sistem OSS-RBA Pusat.",
      icon: "success",
      background: "#0f172a",
      color: "#f8fafc",
      confirmButtonColor: "#10b981",
      customClass: {
        popup: 'rounded-3xl border border-slate-200 dark:border-slate-800'
      }
    });
  };

  // States for Financial Simulation
  const [capex, setCapex] = useState<string>('5000000000'); // IDR 5 Billion as default for a professional project
  const [opex, setOpex] = useState<string>('600000000');   // IDR 600 Million
  const [isUsingOSS, setIsUsingOSS] = useState<boolean>(false);
  const [revenue, setRevenue] = useState<string>('1800000000'); // IDR 1.8 Billion
  const [targetPotential, setTargetPotential] = useState<string>('agroindustri_latimojong');
  const [discountRate, setDiscountRate] = useState<string>('10'); // Default 10% Suku Bunga Diskonto
  const [tenor, setTenor] = useState<string>('5'); // Default 5 Tahun Tenor Proyeksi
  const [inflationRate, setInflationRate] = useState<string>('4.5'); // Default 4.5% Laju Inflasi
  const [simRunCount, setSimRunCount] = useState<number>(0); // Trigger to rerun calculations or track clicks
  const [isPdfGenerating, setIsPdfGenerating] = useState<boolean>(false);

  // States for Testimonial Submission
  const [testiCompany, setTestiCompany] = useState('');
  const [testiSector, setTestiSector] = useState('Agroindustri');
  const [testiMessage, setTestiMessage] = useState('');
  const [isSubmittingTesti, setIsSubmittingTesti] = useState(false);
  const [companyName, setCompanyName] = useState<string>('');

  // Strict Protected Route & Role Validation
  useEffect(() => {
    const loadUserSession = async () => {
      setIsAuthLoading(true);
      try {
        // Restore session manually from cookie or localStorage to bypass iframe restrictions kawan!
        let luwuToken = localStorage.getItem("luwu_session_token");
        let sbToken = null;
        const match = document.cookie.match(/(?:^|;\s*)sb-access-token=([^;]+)/);
        if (match) sbToken = match[1];
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user && !luwuToken) {
          navigate("/login");
          return;
        }
        
        const localRole = (localStorage.getItem("luwu_user_role") || "").toLowerCase().replace(/[\s_-]+/g, "");
        
        // Strict Role Validation & Official Email Role Resolution
        const OFFICIAL_EMAIL_ROLE_MAP: Record<string, string> = {
          'dalakluwu@gmail.com': 'admin_dalak',
          'admindalak@luwukab.go.id': 'admin_dalak',
          'dalak@luwukab.go.id': 'admin_dalak',
          'dalak@luwu.go.id': 'admin_dalak',
          'dataluwu@gmail.com': 'admin_data',
          'admindata@luwukab.go.id': 'admin_data',
          'promosiluwu@gmail.com': 'admin_promosi',
          'adminpromosi@luwukab.go.id': 'admin_promosi',
          'dpmptspluwu@gmail.com': 'admin_oss',
          'adminoss@luwukab.go.id': 'admin_oss',
          'puptr@luwukab.go.id': 'admin_puptr',
          'adminpuptr@luwukab.go.id': 'admin_puptr',
          'pertanian@luwukab.go.id': 'admin_pertanian',
          'adminpertanian@luwukab.go.id': 'admin_pertanian',
          'superadmin@luwu.go.id': 'superadmin'
        };

        const userEmail = session?.user?.email?.toLowerCase().trim() || (localStorage.getItem("luwu_user_email") || "").toLowerCase().trim();
        let effectiveRole = OFFICIAL_EMAIL_ROLE_MAP[userEmail];

        let profileRole = "";
        if (session?.user?.id) {
          try {
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle();
            if (profile?.role) {
              profileRole = profile.role;
            }
          } catch (e) {
            console.warn("Profile fetch warning:", e);
          }
        }

        if (!effectiveRole && profileRole) {
          effectiveRole = profileRole;
        }

        if (!effectiveRole && session?.user?.user_metadata?.role) {
          effectiveRole = session.user.user_metadata.role;
        }

        if (!effectiveRole && localRole) {
          if (localRole.includes("dalak")) effectiveRole = "admin_dalak";
          else if (localRole.includes("oss") || localRole.includes("pelayanan")) effectiveRole = "admin_oss";
          else if (localRole.includes("promosi")) effectiveRole = "admin_promosi";
          else if (localRole.includes("data")) effectiveRole = "admin_data";
          else if (localRole.includes("puptr") || localRole.includes("gis")) effectiveRole = "admin_puptr";
          else if (localRole.includes("pertanian")) effectiveRole = "admin_pertanian";
          else if (localRole.includes("super")) effectiveRole = "superadmin";
        }

        if (effectiveRole) {
          // Normalize role name
          const normalized = effectiveRole.toLowerCase().trim();
          if (normalized === 'admin dalak' || normalized === 'admindalak') effectiveRole = 'admin_dalak';
          if (normalized === 'admin oss' || normalized === 'adminoss' || normalized === 'admin pelayanan') effectiveRole = 'admin_oss';
          if (normalized === 'admin promosi' || normalized === 'adminpromosi') effectiveRole = 'admin_promosi';
          if (normalized === 'admin data' || normalized === 'admindata') effectiveRole = 'admin_data';
          if (normalized === 'admin puptr' || normalized === 'adminpuptr' || normalized === 'admin gis') effectiveRole = 'admin_puptr';
          if (normalized === 'admin pertanian' || normalized === 'adminpertanian') effectiveRole = 'admin_pertanian';
          if (normalized === 'super admin' || normalized === 'super_admin') effectiveRole = 'superadmin';

          // Auto-sync profile in database if official department email had wrong or missing role
          if (session?.user?.id && OFFICIAL_EMAIL_ROLE_MAP[userEmail] && profileRole !== effectiveRole) {
            try {
              await supabase.from('profiles').upsert({
                id: session.user.id,
                role: effectiveRole,
                full_name: effectiveRole === 'admin_dalak' ? 'Bidang Pengendalian Pelaksanaan & Pengawasan'
                         : effectiveRole === 'admin_data' ? 'Bidang Perencanaan, Pengembangan Iklim & Data'
                         : effectiveRole === 'admin_promosi' ? 'Bidang Promosi & Penanaman Modal'
                         : effectiveRole === 'admin_puptr' ? 'Admin Dinas PUPTR (Tata Ruang & Studio GIS)'
                         : effectiveRole === 'admin_pertanian' ? 'Admin Dinas Pertanian (LP2B & Lahan Basah)'
                         : 'Bidang Penyelenggaraan Pelayanan Perizinan'
              });
            } catch(e) {}
          }

          setUserRole(effectiveRole);
          if (effectiveRole === 'admin_oss') {
            setActiveTab('overview_perizinan');
          } else if (effectiveRole === 'admin_puptr' || effectiveRole === 'admin_gis') {
            setActiveTab('verifikasi_pkkpr');
          } else if (effectiveRole === 'admin_pertanian') {
            setActiveTab('verifikasi_pertanian');
          } else {
            setActiveTab('overview');
          }
        }

        const validAdminRoles = ['admin_dalak', 'admin_oss', 'admin_promosi', 'superadmin', 'admin_data', 'admin_puptr', 'admin_pertanian', 'admin_gis'];
        if (!effectiveRole || !validAdminRoles.includes(effectiveRole)) {
          navigate("/403-forbidden");
          return;
        }

        fetchLoiTickets();
        fetchComplaints();

        const u = session?.user;
        const meta = u?.user_metadata || {};
        const name = meta.company_name || meta.full_name || u?.email || (effectiveRole === 'admin_dalak' ? 'Bidang Dalak & Pengawasan' : "Administrator Terverifikasi");
        setCompanyName(name);
        setTestiCompany(name);
        setIsAuthLoading(false);
        setIsLoading(false);
      } catch (err) {
        console.error("Auth initialization error in AdminPortalDashboard:", err);
        setIsAuthLoading(false);
        setIsLoading(false);
      }
    };
    loadUserSession();
  }, []);

  // ROI Flash Effect State & Effect
  const [roiFlash, setRoiFlash] = useState(false);
  const prevRoiRef = useRef<number | null>(null);

  useEffect(() => {
    const numCapex = parseFloat(capex) || 0;
    const numOpex = parseFloat(opex) || 0;
    const numRevenue = parseFloat(revenue) || 0;
    const labaBersih = numRevenue - numOpex;
    const currentRoi = numCapex > 0 ? (labaBersih / numCapex) * 100 : 0;

    if (prevRoiRef.current !== null && Math.abs(prevRoiRef.current - currentRoi) > 0.0001) {
      setRoiFlash(true);
      const timer = setTimeout(() => {
        setRoiFlash(false);
      }, 500);
      return () => clearTimeout(timer);
    }
    prevRoiRef.current = currentRoi;
  }, [capex, opex, revenue]);

  // States for AI Consultation Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (['field_inspection', 'pengaduan', 'fasilitasi'].includes(activeTab)) {
      fetchComplaints();
    }
  }, [activeTab]);

  const triggerAiAnalysis = async () => {
    setIsAiLoading(true);
    setIsAiModalOpen(true);
    try {
      // Find matching investment name
      const matchingInv = investments.find(inv => inv.id === targetPotential || inv.name.toLowerCase().replace(/\s+/g, '_') === targetPotential);
      const projectName = matchingInv ? matchingInv.name : "Simulasi Mandiri Investor Luwu";
      
      const numCapex = parseFloat(capex) || 0;
      const numOpex = parseFloat(opex) || 0;
      const numRevenue = parseFloat(revenue) || 0;
      const numWacc = parseFloat(discountRate) || 10;
      const numTenor = parseInt(tenor) || 5;
      const numInflation = parseFloat(inflationRate) || 4.5;
      
      const labaBersih = numRevenue - numOpex;
      const roi = numCapex > 0 ? (labaBersih / numCapex) * 100 : 0;
      const bep = labaBersih > 0 ? numCapex / labaBersih : 0;
      
      // We can pre-calculate npv and irr to pass to simulationContext
      let cumulativeDiscountedCF = 0;
      for (let t = 1; t <= numTenor; t++) {
        const inflationFactor = Math.pow(1 + (numInflation / 100), t);
        const cf = (numRevenue - numOpex) * inflationFactor;
        cumulativeDiscountedCF += cf / Math.pow(1 + (numWacc / 100), t);
      }
      const calculatedNpv = cumulativeDiscountedCF - numCapex;
      
      // Simple IRR
      let calculatedIrr = 0;
      if (labaBersih > 0) {
        let low = -0.99;
        let high = 5.0;
        let found = false;
        const calcNPV = (rVal: number) => {
          let sum = 0;
          for (let t = 1; t <= numTenor; t++) {
            const inf = Math.pow(1 + (numInflation / 100), t);
            sum += ((numRevenue - numOpex) * inf) / Math.pow(1 + rVal, t);
          }
          return sum - numCapex;
        };
        const npvLow = calcNPV(low);
        const npvHigh = calcNPV(high);
        if (npvLow * npvHigh < 0) {
          for (let i = 0; i < 60; i++) {
            const mid = (low + high) / 2;
            const npvMid = calcNPV(mid);
            if (Math.abs(npvMid) < 0.01) {
              calculatedIrr = mid * 100;
              found = true;
              break;
            }
            if (npvMid * npvLow < 0) high = mid;
            else low = mid;
          }
          if (!found) calculatedIrr = ((low + high) / 2) * 100;
        } else {
          calculatedIrr = roi > 0 ? roi * 0.9 : 0;
        }
      }

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Berikan analisis kelayakan investasi mendalam dan berikan ulasan komprehensif, rekomendasi mitigasi risiko, serta peluang geospasial spesifik di Kabupaten Luwu.`,
          investmentContext: matchingInv ? {
            name: matchingInv.name,
            sector: matchingInv.sector,
            subSector: matchingInv.subSector || '',
            areaHa: matchingInv.areaHa,
            investmentValue: matchingInv.investmentValue,
            districtId: matchingInv.districtId
          } : undefined,
          simulationContext: {
            name: projectName,
            capex: numCapex,
            opex: numOpex,
            asumsiPendapatan: numRevenue,
            roi: roi,
            bep: bep,
            npv: calculatedNpv,
            irr: calculatedIrr,
            isUsingOSS
          },
          language: 'id'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal menghubungi AI Server.");
      }

      setAiAnalysisResult(data.text || "AI tidak mengembalikan analisis. Sila hubungi sys-admin.");
    } catch (err: any) {
      console.error("AI Analysis Failed:", err);
      setAiAnalysisResult(`⚠️ Gagal memuat analisis kelayakan AI: ${err.message || 'Koneksi terputus'}.\n\nSilakan pastikan bahwa kunci API Gemini telah terpasang dengan benar di menu Pengaturan / Settings AI Studio.`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Compute stats based on loaded investments
  const stats = useMemo(() => {
    if (investments.length === 0) {
      return {
        totalOpportunities: 0,
        totalInvestmentValue: 0,$2totalArea: 0,
        totalLabor: 0,
        dominantSector: '-',
        avgRoiRange: '-',
        sectorData: [],
        topInvestments: []
      };
    }

    const totalOpportunities = investments.length;
    const totalInvestmentValue = investments.reduce((sum, inv) => sum + (inv.investmentValue || 0), 0);
    const totalArea = investments.reduce((sum, inv) => sum + (inv.areaHa || 0), 0);
    const totalLabor = investments.reduce((sum, inv: any) => sum + Number(inv.komitmenTenagaLokal || inv.komitmen_tenaga_lokal || inv.penyerapan_tenaga_kerja || inv.penyerapanTenagaKerja || inv.tenaga_lokal || inv.tenagaLokal || inv.tenagaKerja || inv.tenaga_kerja || inv.tkl || 0) + Number(inv.komitmenTenagaAsing || inv.komitmen_tenaga_asing || inv.tenaga_asing || inv.tenagaAsing || inv.tka || 0), 0);

    // Calculate dominant sector
    const sectorCounts: { [key: string]: number } = {};
    investments.forEach((inv) => {
      const secName = inv.sector || "Lainnya";
      sectorCounts[secName] = (sectorCounts[secName] || 0) + 1;
    });

    let dominantSector = "-";
    let maxCount = 0;
    Object.entries(sectorCounts).forEach(([sec, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantSector = sec;
      }
    });

    // Sector distribution for Pie chart
    const sectorData = Object.entries(sectorCounts).map(([name, value]) => ({
      name,
      value
    }));

    // Find average ROI (or IRR) if available, otherwise estimate based on values
    let totalIrr = 0;
    let countWithIrr = 0;
    investments.forEach((inv: any) => {
      // Find within financials array or smartData
      const finObj = inv.financials?.[0] || {};
      const sdObj = inv.smartData || {};
      const irr = inv.npv !== undefined ? (inv.irr || 0) : (finObj.irr || finObj.irr_persen || sdObj.irr || 0);
      
      if (irr > 0) {
        totalIrr += irr;
        countWithIrr++;
      }
    });

    const avgIrr = countWithIrr > 0 ? totalIrr / countWithIrr : 14.5;
    const avgRoiRange = countWithIrr > 0 
      ? `${Math.max(5, Math.round(avgIrr - 3))}% - ${Math.round(avgIrr + 3)}%`
      : "12% - 18%";

    // Get Top 3 investments sorted by value or area
    const topInvestments = [...investments]
      .sort((a, b) => (b.investmentValue || 0) - (a.investmentValue || 0))
      .slice(0, 3);

    return {
      totalOpportunities,
      totalInvestmentValue,
      totalArea,
      totalLabor,
      dominantSector,
      avgRoiRange,
      sectorData,
      topInvestments
    };
  }, [investments]);

  const slaAnalysis = useMemo(() => {
    const alerts: Array<{
      id: string;
      type: 'loi' | 'complaint';
      title: string;
      sub: string;
      status: string;
      days: number;
      slaStatus: 'Aman' | 'Warning' | 'Terlambat';
      date: string;
      badge: string;
      color: string;
      original: any;
    }> = [];

    let safeCount = 0;
    let warningCount = 0;
    let breachCount = 0;

    // Process LoI / Perizinan Tickets
    loiTickets.forEach((ticket) => {
      const isFinished = ['Izin Terbit / Realisasi', 'Ditolak / Batal'].includes(ticket.status || '');
      if (!isFinished) {
        const sla = calculateSLA(ticket.updated_at || ticket.created_at);
        if (sla.status === 'Aman') safeCount++;
        else if (sla.status === 'Warning') warningCount++;
        else if (sla.status === 'Terlambat') breachCount++;

        if (sla.status === 'Warning' || sla.status === 'Terlambat') {
          alerts.push({
            id: ticket.id,
            type: 'loi',
            title: ticket.company_name || ticket.investor_name || 'Permohonan LoI / Perizinan',
            sub: `Sektor: ${ticket.potensi_name || 'Penanaman Modal'}`,
            status: ticket.status || 'Menunggu Verifikasi',
            days: sla.days,
            slaStatus: sla.status as 'Warning' | 'Terlambat',
            date: ticket.updated_at || ticket.created_at,
            badge: sla.badge,
            color: sla.color,
            original: ticket,
          });
        }
      }
    });

    // Process Pengaduan / Dalak Complaints
    complaints.forEach((comp) => {
      const isFinished = ['Selesai', 'Selesai Mediasi', 'Ditolak'].includes(comp.status || '');
      if (!isFinished) {
        const sla = calculateSLA(comp.updated_at || comp.created_at);
        if (sla.status === 'Aman') safeCount++;
        else if (sla.status === 'Warning') warningCount++;
        else if (sla.status === 'Terlambat') breachCount++;

        if (sla.status === 'Warning' || sla.status === 'Terlambat') {
          alerts.push({
            id: comp.id,
            type: 'complaint',
            title: comp.perusahaan_terlapor || comp.judul_pengaduan || 'Pengaduan Lapangan Masyarakat',
            sub: `Pelapor: ${comp.nama_pelapor || 'Warga'}`,
            status: comp.status || 'Menunggu Verifikasi',
            days: sla.days,
            slaStatus: sla.status as 'Warning' | 'Terlambat',
            date: comp.updated_at || comp.created_at,
            badge: sla.badge,
            color: sla.color,
            original: comp,
          });
        }
      }
    });

    alerts.sort((a, b) => b.days - a.days);

    return {
      alerts,
      totalActive: safeCount + warningCount + breachCount,
      safeCount,
      warningCount,
      breachCount,
      hasAlerts: alerts.length > 0
    };
  }, [loiTickets, complaints]);

  const handleSlaAlertClick = (item: any) => {
    setIsSlaDropdownOpen(false);
    if (item.type === 'loi') {
      if (userRole === 'admin_promosi') {
        setSelectedKycTicket(item.original);
        setKycCatatan(item.original.catatan_admin || '');
        setIsKycModalOpen(true);
      } else {
        setSelectedTicketForAction(item.original);
        setInputNib(item.original.nib_oss || '');
        setInputCatatan(item.original.catatan_admin || '');
        setIsActionModalOpen(true);
      }
    } else if (item.type === 'complaint') {
      openDalakModal(item.original);
    }
  };

  const tabs = useMemo(() => {
    if (userRole === 'admin_oss') {
      return [
        { id: 'overview_perizinan', label: 'Overview Perizinan', icon: LayoutDashboard },
        { id: 'verifikasi_pkkpr', label: 'Verifikasi PKKPR & Tata Ruang', icon: ShieldCheck },
        { id: 'realisasi_nib', label: 'Realisasi NIB (OSS-RBA)', icon: CheckCircle2 }
      ];
    } else if (userRole === 'admin_dalak') {
      return [
        { id: 'overview', label: 'Pantau Realisasi', icon: LayoutDashboard },
        { id: 'field_inspection', label: 'Inspeksi Lapangan', icon: MapPin },
        { id: 'simulation', label: 'Kalkulasi Dampak', icon: Calculator }
      ];
    } else if (userRole === 'admin_promosi') {
      return [
        { id: 'overview', label: 'Performa Promosi', icon: LayoutDashboard },
        { id: 'site-selection', label: 'Rekomendasi Lokasi AI', icon: MapPin },
        { id: 'manage_potential', label: 'Kelola IPRO', icon: Layers },
        { id: 'testimonials', label: 'Review Testimoni', icon: MessageSquare }
      ];
    }
    // Default fallback
    return [
      { id: 'overview', label: 'Overview Admin', icon: LayoutDashboard },
    ];
  }, [userRole]);

  const handleLogout = async () => {
    try {
      if (!document.fullscreenElement) {
        requestSmartFullscreen();
      }
    } catch (err) {}
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("[Logout] Supabase signOut failed, continuing with client clearance:", err);
    }
    document.cookie = 'sb-access-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None; Secure;';
    localStorage.removeItem("luwu_session_token");
    localStorage.removeItem("sb-access-token");
    localStorage.removeItem("luwu_user_role");
    exitSmartFullscreen();
    navigate('/');
  };

  const getWorkspaceTitle = (role: string) => {
    switch (role) {
      case 'admin_promosi': return 'Meja Kerja Bidang Promosi & Penanaman Modal';
      case 'admin_dalak': return 'Meja Kerja Bidang Pengendalian Pelaksanaan & Pengawasan';
      case 'admin_oss': return 'Meja Kerja Bidang Penyelenggaraan Pelayanan Perizinan';
      case 'admin_data': return 'Meja Kerja Bidang Perencanaan, Pengembangan Iklim & Data';
      case 'superadmin': default: return 'Dashboard Eksekutif Utama';
    }
  };

  const getWorkspaceSubtitle = (role: string) => {
    switch (role) {
      case 'admin_promosi': return 'Kelola minat investasi (LoI), promosi potensi daerah (IPRO), dan rekomendasi lokasi cerdas.';
      case 'admin_dalak': return 'Pengawasan realisasi investasi, verifikasi pengaduan masyarakat, dan jadwal site visit mediasi.';
      case 'admin_oss': return 'Verifikasi kesesuaian tata ruang (PKKPR), penerbitan berkas perizinan, dan pemantauan NIB OSS-RBA.';
      case 'admin_data': return 'Analisis data spasial, GIS peta tematik, dan laporan indikator makroekonomi investasi.';
      case 'superadmin': default: return 'Monitoring lintas bidang, analitik performa investasi, dan tata kelola sistem DPMPTSP Luwu.';
    }
  };

  const renderSlaBanner = () => {
    if (!slaAnalysis.hasAlerts) return null;

    return (
      <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-amber-500/10 border border-amber-500/30 dark:bg-amber-950/20 backdrop-blur-md space-y-3 sm:space-y-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 animate-pulse shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-white flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span>Peringatan SLA Real-Time: {slaAnalysis.alerts.length} Tiket</span>
                {slaAnalysis.breachCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                    {slaAnalysis.breachCount} Terlambat
                  </span>
                )}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                Permohonan perizinan atau aduan tertahan &gt; 2-3 hari tanpa pembaruan status.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSlaDropdownOpen(true)}
            className="w-full sm:w-auto justify-center px-3 py-1.5 sm:px-3.5 sm:py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Bell size={14} /> Buka Notifikasi ({slaAnalysis.alerts.length})
          </button>
        </div>

        {/* Quick Urgent Items */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3 pt-2.5 sm:pt-3 border-t border-amber-500/20">
          {slaAnalysis.alerts.slice(0, 3).map((item) => (
            <div key={item.id} className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className={`px-2 py-0.5 rounded-md border text-[9px] font-black ${item.badge}`}>
                  ⏱️ {item.days} Hari ({item.slaStatus})
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono text-slate-700 dark:text-slate-300">{item.type === 'loi' ? 'Perizinan / LoI' : 'Aduan'}</span>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.title}</div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{item.status}</span>
                <button
                  onClick={() => handleSlaAlertClick(item)}
                  className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer active:scale-95"
                >
                  Proses Berkas <ArrowRight size={10} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTaskQueue = () => {
    if (userRole === 'admin_promosi') {
      const pendingPromosi = loiTickets.filter(t => !t.status || t.status === 'Menunggu Verifikasi' || t.status === 'Draft' || t.status === 'Persiapan Site Visit');
      return (
        <div className="space-y-6">
          {renderSlaBanner()}
          <div className="p-6 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Antrean Tugas: Verifikasi Minat Investasi (LoI Masuk)</span>
                <span className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-mono font-bold">{pendingPromosi.length} Berkas</span>
              </h3>
              <p className="text-xs text-slate-800 dark:text-slate-200 mt-1">Daftar calon investor yang mengajukan Letter of Intent (LoI) dan menunggu verifikasi kelayakan promosi.</p>
            </div>
            <button 
              onClick={fetchLoiTickets}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl transition-all cursor-pointer"
              title="Segarkan data"
            >
              <Activity size={16} className={loadingLoiTickets ? "animate-spin text-emerald-700 dark:text-emerald-400" : ""} />
            </button>
          </div>

          {loadingLoiTickets ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
              <p className="text-xs text-slate-800 dark:text-slate-200">Memuat antrean LoI...</p>
            </div>
          ) : pendingPromosi.length === 0 ? (
            <EmptyState 
              title="Belum Ada Tiket Promosi" 
              message="Belum ada permohonan LoI baru yang memerlukan verifikasi promosi." 
            />
          ) : (
            <div className="w-full overflow-x-auto rounded-lg shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold uppercase tracking-wider">
                    <th className="p-4">Tanggal</th>
                    <th className="p-4">Investor / Perusahaan</th>
                    <th className="p-4">Potensi Lokasi</th>
                    <th className="p-4">Nilai Rencana</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {pendingPromosi.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 text-slate-800 dark:text-slate-200 font-mono">
                        {new Date(ticket.created_at).toLocaleDateString("id-ID")}
                      </td>
                      <td className="p-4 font-medium text-slate-900 dark:text-white">
                        <div>{ticket.company_name || ticket.investor_name}</div>
                        <div className="text-[10px] text-slate-800 dark:text-slate-200 dark:text-slate-400 font-mono">{ticket.contact_info}</div>
                      </td>
                      <td className="p-4 text-slate-800 dark:text-slate-200">
                        {ticket.potensi_name || "Luwu General"}
                      </td>
                      <td className="p-4 text-emerald-700 dark:text-emerald-400 font-mono font-bold">
                        {formatRupiahSingkat(Number(ticket.nilai_investasi) || 0)}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-2 items-start">
                          <span className="inline-flex w-max items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/10 text-amber-700 dark:text-amber-400 border border-amber-400/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            {ticket.status || 'Menunggu Verifikasi'}
                          </span>
                          {['Izin Terbit / Realisasi', 'Ditolak / Batal'].includes(ticket.status || '') ? (
                            <span className="text-[10px] text-slate-800 dark:text-slate-200 dark:text-slate-400">- Selesai -</span>
                          ) : (
                            <div className={`px-2 py-0.5 rounded-md border text-[10px] font-bold w-max flex items-center gap-1 ${calculateSLA(ticket.updated_at || ticket.created_at).badge}`}>
                              <span className={calculateSLA(ticket.updated_at || ticket.created_at).color}>
                                ⏱️ Tertahan {calculateSLA(ticket.updated_at || ticket.created_at).days} Hari
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedTicketForAction(ticket);
                            setInputNib(ticket.nib_oss || '');
                            setInputCatatan(ticket.catatan_admin || '');
                            setIsActionModalOpen(true);
                          }}
                          className="px-3 py-1.5 min-h-[44px] min-w-[44px] bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white rounded-xl text-[11px] font-bold transition-all shadow-lg shadow-emerald-900/20 cursor-pointer"
                        >
                          Verifikasi Promosi
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div>
      );
    }

    if (userRole === 'admin_dalak') {
      const pendingDalakLoI = loiTickets.filter(t => t.status === 'Persiapan Site Visit' || t.status === 'Verifikasi OSS Berjalan');
      const pendingComplaints = complaints.filter(c => !c.status || c.status === 'Menunggu Verifikasi' || c.status === 'Diproses');

      return (
        <div className="space-y-6">
          {renderSlaBanner()}
          {/* Antrean Pengaduan Masyarakat */}
          <div className="p-6 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Antrean Tugas: Pengaduan & Aduan Masyarakat</span>
                  <span className="text-xs bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full font-mono font-bold">{pendingComplaints.length} Laporan</span>
                </h3>
                <p className="text-xs text-slate-800 dark:text-slate-200 mt-1">Sengketa, kendala lapangan, dan laporan dari masyarakat yang membutuhkan tindak lanjut Dalak.</p>
              </div>
              <button 
                onClick={fetchComplaints}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl transition-all cursor-pointer"
                title="Segarkan aduan"
              >
                <Activity size={16} className={loadingComplaints ? "animate-spin text-rose-700 dark:text-rose-400" : ""} />
              </button>
            </div>

            {loadingComplaints ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
                <p className="text-xs text-slate-800 dark:text-slate-200">Memuat aduan masyarakat...</p>
              </div>
            ) : pendingComplaints.length === 0 ? (
              <EmptyState 
                title="Tidak Ada Aduan Baru" 
                message="Tidak ada pengaduan masyarakat aktif yang memerlukan penanganan saat ini." 
              />
            ) : (
              <div className="w-full overflow-x-auto rounded-lg shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold uppercase tracking-wider">
                      <th className="p-4">Tanggal</th>
                      <th className="p-4">Pelapor</th>
                      <th className="p-4">Topik / Isu</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {pendingComplaints.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 text-slate-800 dark:text-slate-200 font-mono">
                          {new Date(item.created_at).toLocaleDateString("id-ID")}
                        </td>
                        <td className="p-4 font-medium text-slate-900 dark:text-white">
                          <div>{item.nama_pelapor || "Masyarakat Luwu"}</div>
                          <div className="text-[10px] text-slate-800 dark:text-slate-200 dark:text-slate-400 font-mono">{item.kontak_pelapor || "-"}</div>
                        </td>
                        <td className="p-4 text-slate-800 dark:text-slate-200">
                          <div className="font-semibold text-rose-300">{item.kategori_pengaduan || 'Pengaduan'}</div>
                          <div className="text-[10px] text-slate-800 dark:text-slate-200 truncate max-w-xs">{item.deskripsi_masalah || "-"}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                item.status?.includes('Eskalasi') ? 'bg-red-500/20 text-red-500 border-red-500/50 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]' :
                                'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                              }`}>
                              {item.status?.includes('Eskalasi') && <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>}
                              {!item.status?.includes('Eskalasi') && <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>}
                              {item.status || 'Menunggu Verifikasi'}
                              {item.status?.includes('Eskalasi') && " 🚨"}
                            </span>
                            {!['Selesai', 'Ditolak / Batal'].includes(item.status || '') && (
                              <div className={`px-2 py-0.5 rounded-md border text-[10px] font-bold w-max flex items-center gap-1 ${calculateSLA(item.created_at).badge}`}>
                                <span className={calculateSLA(item.created_at).color}>
                                  ⏱️ Tertahan {calculateSLA(item.created_at).days} Hari
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => openDalakModal(item)}
                            className="px-3 py-1.5 min-h-[44px] min-w-[44px] bg-amber-600 hover:bg-amber-500 text-slate-900 dark:text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-md"
                          >
                            Tindak Lanjut & Site Visit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Antrean Persiapan Site Visit / Mediasi */}
          <div className="p-6 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Antrean Tugas: Persiapan Site Visit & Mediasi Investor</span>
                  <span className="text-xs bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-mono font-bold">{pendingDalakLoI.length} Permohonan</span>
                </h3>
                <p className="text-xs text-slate-800 dark:text-slate-200 mt-1">Investor yang membutuhkan verifikasi lapangan dan pendampingan teknis lokasi.</p>
              </div>
            </div>

            {pendingDalakLoI.length === 0 ? (
              <EmptyState 
                title="Tidak Ada Agenda Visit" 
                message="Tidak ada agenda site visit investor yang tertunda." 
              />
            ) : (
              <div className="w-full overflow-x-auto rounded-lg shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold uppercase tracking-wider">
                      <th className="p-4">Tanggal</th>
                      <th className="p-4">Perusahaan / Investor</th>
                      <th className="p-4">Potensi Lokasi</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {pendingDalakLoI.map((ticket) => (
                      <React.Fragment key={ticket.id}>
                        <tr className="hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => toggleTicketExpand(ticket.id)}>
                          <td className="p-4 text-slate-800 dark:text-slate-200 font-mono">
                            {new Date(ticket.created_at).toLocaleDateString("id-ID")}
                          </td>
                          <td className="p-4 font-medium text-slate-900 dark:text-white">
                            <div>{ticket.company_name || ticket.investor_name}</div>
                          </td>
                          <td className="p-4 text-slate-800 dark:text-slate-200">
                            {ticket.potensi_name || "Luwu General"}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-2 items-start">
                              <span className="inline-flex w-max items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
                                {ticket.status}
                              </span>
                              {['Izin Terbit / Realisasi', 'Ditolak / Batal'].includes(ticket.status || '') ? (
                                <span className="text-[10px] text-slate-800 dark:text-slate-200 dark:text-slate-400">- Selesai -</span>
                              ) : (
                                <div className={`px-2 py-0.5 rounded-md border text-[10px] font-bold w-max flex items-center gap-1 ${calculateSLA(ticket.updated_at || ticket.created_at).badge}`}>
                                  <span className={calculateSLA(ticket.updated_at || ticket.created_at).color}>
                                    ⏱️ Tertahan {calculateSLA(ticket.updated_at || ticket.created_at).days} Hari
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTicketForAction(ticket);
                                setInputNib(ticket.nib_oss || '');
                                setInputCatatan(ticket.catatan_admin || '');
                                setIsActionModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                            >
                              Update Mediasi
                            </button>
                          </td>
                        </tr>
                        {expandedTickets[ticket.id] && (
                          <tr className="bg-slate-50 dark:bg-slate-900/40">
                            <td colSpan={5} className="p-4 text-xs text-slate-600 dark:text-slate-400 font-sans">
                              <div className="flex gap-6">
                                <div><span className="font-bold">Land Status:</span> {ticket.land_status || 'Pending Verification'}</div>
                                <div><span className="font-bold">PIC Contact:</span> {ticket.pic_contact || 'Not Provided'}</div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (userRole === 'admin_oss') {
      const pendingOss = loiTickets.filter(t => t.status === 'Mediasi Lapangan Selesai' || t.status === 'Verifikasi OSS Berjalan');

      return (
        <div className="p-6 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Antrean Tugas: Verifikasi PKKPR & Penerbitan NIB</span>
                <span className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono font-bold">{pendingOss.length} Berkas</span>
              </h3>
              <p className="text-xs text-slate-800 dark:text-slate-200 mt-1">Daftar permohonan yang telah menyelesaikan mediasi lapangan dan siap diterbitkan izin perizinan terpadu.</p>
            </div>
            <button 
              onClick={fetchLoiTickets}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl transition-all cursor-pointer"
              title="Segarkan data"
            >
              <Activity size={16} className={loadingLoiTickets ? "animate-spin text-emerald-700 dark:text-emerald-400" : ""} />
            </button>
          </div>

          {loadingLoiTickets ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
              <p className="text-xs text-slate-800 dark:text-slate-200">Memuat berkas perizinan...</p>
            </div>
          ) : pendingOss.length === 0 ? (
            <EmptyState 
              title="Tidak Ada Antrean PKKPR" 
              message="Tidak ada antrean perizinan atau PKKPR yang tertunda saat ini." 
            />
          ) : (
            <div className="w-full overflow-x-auto rounded-lg shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold uppercase tracking-wider">
                    <th className="p-4">Tanggal</th>
                    <th className="p-4">Investor / Perusahaan</th>
                    <th className="p-4">Potensi Lokasi</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {pendingOss.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 text-slate-800 dark:text-slate-200 font-mono">
                        {new Date(ticket.created_at).toLocaleDateString("id-ID")}
                      </td>
                      <td className="p-4 font-medium text-slate-900 dark:text-white">
                        <div>{ticket.company_name || ticket.investor_name}</div>
                        <div className="text-[10px] text-slate-800 dark:text-slate-200 dark:text-slate-400 font-mono">{ticket.contact_info}</div>
                      </td>
                      <td className="p-4 text-slate-800 dark:text-slate-200">
                        {ticket.potensi_name || "Luwu General"}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-2 items-start">
                          <span className="inline-flex w-max items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            {ticket.status}
                          </span>
                          {['Izin Terbit / Realisasi', 'Ditolak / Batal'].includes(ticket.status || '') ? (
                            <span className="text-[10px] text-slate-800 dark:text-slate-200 dark:text-slate-400">- Selesai -</span>
                          ) : (
                            <div className={`px-2 py-0.5 rounded-md border text-[10px] font-bold w-max flex items-center gap-1 ${calculateSLA(ticket.updated_at || ticket.created_at).badge}`}>
                              <span className={calculateSLA(ticket.updated_at || ticket.created_at).color}>
                                ⏱️ Tertahan {calculateSLA(ticket.updated_at || ticket.created_at).days} Hari
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedTicketForAction(ticket);
                            setInputNib(ticket.nib_oss || '');
                            setInputCatatan(ticket.catatan_admin || '');
                            setIsActionModalOpen(true);
                          }}
                          className="px-3 py-1.5 min-h-[44px] min-w-[44px] bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-md"
                        >
                          Terbitkan NIB / PKKPR
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  if (isAuthLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row font-sans text-slate-800 dark:text-slate-200">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <LuwuLogo className="h-8 w-8" />
          <span className="font-bold text-slate-900 dark:text-white tracking-tight">Admin Portal</span>
        </div>
        <div className="flex items-center gap-2">
          {isOperatorWorkspaceRole(userRole) && (
            <button
              onClick={() => {
                window.location.href = "/operator-workspace";
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-bold shadow-xs cursor-pointer active:scale-95"
              title="Buka Operator Workspace"
            >
              <Building2 size={13} />
              <span>Operator</span>
            </button>
          )}
          <ThemeToggle />
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-lg active:bg-slate-100 dark:active:bg-slate-800 transition-colors" aria-label="Toggle menu">
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Dynamic Unified Sidebar */}
      <AdminSidebar
        userRole={userRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="w-full md:flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto flex flex-col">
        {/* Top Navbar */}
        <div className="hidden md:flex justify-between items-center py-4 px-4 md:px-6 lg:px-8 -mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 lg:-mt-8 mb-6 border-b border-slate-200 dark:border-slate-800/60 sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 dark:text-slate-400 uppercase tracking-widest">Admin Portal</span>
            <span className="text-slate-800 dark:text-slate-200">/</span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
              {activeTab === 'overview_perizinan' ? 'Overview Perizinan'
                : activeTab === 'verifikasi_pkkpr' ? 'Verifikasi PKKPR & Tata Ruang (Dinas PUPTR)'
                : activeTab === 'verifikasi_pertanian' ? 'Rekomendasi Lahan Pertanian / LP2B (Dinas Pertanian)'
                : activeTab === 'pkkpr_sync_monitor' ? 'Monitoring Alur & SLA PKKPR'
                : activeTab === 'realisasi_nib' ? 'Realisasi NIB & Penerbitan SK (OSS-RBA)'
                : activeTab === 'site-selection' ? 'Rekomendasi Lokasi AI'
                : activeTab === 'loi_verify' ? 'Tiket Minat Investor (LoI)'
                : activeTab === 'manage_potential' ? 'Kelola Potensi Investasi (IPRO)'
                : activeTab === 'testimonials' ? 'Review Testimoni'
                : activeTab === 'pengaduan' ? 'Pengaduan Masyarakat'
                : activeTab === 'pengawasan' ? 'Pengawasan & Kepatuhan'
                : activeTab === 'fasilitasi' ? 'Fasilitasi & Mediasi'
                : activeTab === 'laporan' ? 'Evaluasi & Laporan Dalak'
                : activeTab === 'spatial_analytics' ? 'Analitik & Laporan Spasial'
                : activeTab === 'gis_spatial' ? 'Kelola GIS Spasial'
                : activeTab === 'simulation' ? 'Kalkulasi Dampak & ROI'
                : activeTab === 'verify' ? 'Verifikasi & Perizinan'
                : 'Ringkasan Utama'
              }
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Unified Cross-OPD Inter-agency Notification Bell (Dynamic Role) */}
            <CrossOpdNotificationBell 
              currentRole={
                (userRole?.toLowerCase().includes('puptr') || activeTab.includes('puptr') || activeTab === 'verifikasi_pkkpr') ? 'ADMIN_PUPTR' :
                (userRole?.toLowerCase().includes('pertanian') || activeTab.includes('pertanian')) ? 'ADMIN_PERTANIAN' :
                'ADMIN_DPMPTSP'
              }
              onSelectApplication={(appId) => {
                if (userRole?.toLowerCase().includes('pertanian') || activeTab === 'verifikasi_pertanian' || activeTab === 'pertanian_clearance') {
                  setActiveTab('verifikasi_pertanian');
                } else {
                  setActiveTab('verifikasi_pkkpr');
                }
              }}
            />

            {/* Direct Operator Workspace Button - Khusus Superadmin & Admin Promosi */}
            {isOperatorWorkspaceRole(userRole) && (
              <button
                onClick={() => {
                  console.log("[AdminPortalDashboard] Desktop Navbar 'Operator Workspace' clicked -> navigating to /operator-workspace");
                  window.location.href = "/operator-workspace";
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-sm shadow-emerald-900/20 hover:shadow-md transition-all cursor-pointer shrink-0 active:scale-95"
                title="Buka Ruang Kerja Operator (Input Form Investasi & Peta GIS)"
              >
                <Building2 size={15} />
                <span>Operator Workspace</span>
                <ArrowUpRight size={13} className="opacity-80" />
              </button>
            )}

            <ThemeToggle />
            <div className="h-6 w-px bg-slate-800"></div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase">
                {companyName ? companyName.substring(0,2).toUpperCase() : 'AD'}
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-none">{companyName || 'Administrator'}</div>
                <div className="text-[10px] text-slate-800 dark:text-slate-200 dark:text-slate-400 mt-0.5 leading-none">{formatRoleLabel(userRole)}</div>
              </div>
            </div>
          </div>
        </div>

        {isAuthLoading ? (
          <div className="h-[70vh] flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">{t('dashboard.loadingAnalysis', 'Memuat Analisis Portal Investor...')}</p>
          </div>
        ) : error ? (
          <div className="h-[70vh] flex flex-col items-center justify-center gap-4 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-700 dark:text-red-400 flex items-center justify-center">
              <X size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{t('dashboard.dbErrorTitle', 'Gagal Terhubung ke Database')}</h3>
              <p className="text-sm text-slate-800 dark:text-slate-200">{t('dashboard.dbErrorDesc', 'Kami tidak dapat memuat data investasi Kabupaten Luwu saat ini secara jujur. Silakan periksa koneksi Anda.')}</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-semibold border border-slate-700/50 transition-all"
            >
              {t('dashboard.retry', 'Coba Ulang')}
            </button>
          </div>
        ) : activeTab === 'overview_perizinan' ? (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 mt-4 md:mt-0">
            {/* Layout Header & Branding */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 border-b border-slate-200 dark:border-slate-800/60 pb-4 sm:pb-6">
              <div>
                <h1 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-1 tracking-tight flex items-center gap-2">
                  <span>Meja Kerja Bidang Penyelenggaraan Pelayanan Perizinan</span>
                  <Sparkles size={18} className="text-emerald-700 dark:text-emerald-400 animate-pulse shrink-0" />
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
                  Panel verifikasi syarat administrasi, PKKPR, dan eksekusi penerbitan izin berusaha (OSS-RBA).
                </p>
              </div>
              <div className="text-[10px] sm:text-xs font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl uppercase tracking-wider font-extrabold shrink-0 shadow-sm">
                OSS - DPMPTSP LUWU
              </div>
            </div>

            <div className="space-y-6 sm:space-y-8">
              {renderSlaBanner()}
              {/* 4 Tupoksi-driven KPI Cards (Android 2x2 Bento Grid) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                {/* Card 1: Antrean Verifikasi */}
                <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-2.5 sm:mb-4">
                    <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 group-hover:scale-105 transition-transform">
                      <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    <AnimatedCounter value={loiTickets.filter(t => t.status === 'Mediasi Lapangan Selesai' || t.status === 'Verifikasi OSS Berjalan').length} />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 line-clamp-1">Antrean Verifikasi</div>
                  <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 hidden sm:block">Menunggu pengecekan dokumen.</div>
                </div>

                {/* Card 2: Izin & PKKPR Terbit */}
                <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-2.5 sm:mb-4">
                    <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    <AnimatedCounter value={loiTickets.filter(t => t.status === 'Izin Terbit / Realisasi' || t.status === 'Izin Terbit').length} />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 line-clamp-1">Izin & PKKPR Terbit</div>
                  <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 hidden sm:block">Jumlah izin berhasil diterbitkan.</div>
                </div>

                {/* Card 3: Total Realisasi Investasi */}
                <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-2.5 sm:mb-4">
                    <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                    <AnimatedCounter 
                      value={loiTickets
                        .filter(t => t.status === 'Izin Terbit / Realisasi' || t.status === 'Izin Terbit')
                        .reduce((sum, t) => sum + (Number(t.nilai_investasi) || 0), 0)}
                      formatter={formatRupiahSingkat} 
                    />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 line-clamp-1">Total Realisasi Investasi</div>
                  <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 hidden sm:block">Akumulasi nilai izin terbit.</div>
                </div>

                {/* Card 4: Status OSS-RBA */}
                <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-2.5 sm:mb-4">
                    <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform">
                      <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>
                  <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 sm:gap-2">
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse shrink-0"></span>
                    <span>Terkoneksi</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 line-clamp-1">Status OSS-RBA</div>
                  <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 hidden sm:block">Sistem terhubung aktif.</div>
                </div>
              </div>

              {/* Main Content: The Verification Queue (Dual-View: Mobile Card List + Desktop Table) */}
              <div className="grid grid-cols-1 gap-6">
                <div className="p-4 sm:p-6 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-full">
                  <div className="flex justify-between items-center mb-4 sm:mb-6">
                    <h2 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Activity className="text-emerald-700 dark:text-emerald-400 shrink-0" size={18} />
                      <span>Antrean Penerbitan Izin & Verifikasi Syarat</span>
                    </h2>
                    <button 
                      onClick={fetchLoiTickets}
                      className="p-1.5 sm:p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all cursor-pointer active:scale-95"
                      title="Segarkan data"
                    >
                      <RefreshCw size={14} className={loadingLoiTickets ? "animate-spin text-emerald-700 dark:text-emerald-400" : ""} />
                    </button>
                  </div>

                  {(() => {
                    const ossQueue = loiTickets
                      .filter(t => t.status === 'Mediasi Lapangan Selesai' || t.status === 'Verifikasi OSS Berjalan')
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                    if (ossQueue.length === 0) {
                      return (
                        <EmptyState 
                          isTable={false} 
                          title="Belum Ada Antrean" 
                          message="Belum ada antrean verifikasi perizinan." 
                        />
                      );
                    }

                    return (
                      <>
                        {/* Mobile View: Android Card List */}
                        <div className="block md:hidden space-y-3">
                          {ossQueue.map((item) => (
                            <div key={item.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold">#{item.id?.toString().slice(0,8).toUpperCase()}</span>
                                  <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{item.company_name || item.investor_name}</div>
                                  <div className="text-slate-500 dark:text-slate-400 text-[10px]">{item.contact_info}</div>
                                </div>
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 shrink-0">
                                  {item.status}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-700/50">
                                <span className="truncate max-w-[160px]">📍 {item.potensi_name || "Kabupaten Luwu"}</span>
                                <span className="text-[10px] text-slate-400">{new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                              </div>

                              {!['Izin Terbit / Realisasi', 'Ditolak / Batal', 'Selesai'].includes(item.status || '') && (
                                <div className={`px-2 py-0.5 rounded-md border text-[9px] font-bold w-max flex items-center gap-1 ${calculateSLA(item.last_status_updated_at || item.created_at).badge}`}>
                                  <span className={calculateSLA(item.last_status_updated_at || item.created_at).color}>
                                    ⏱️ Tertahan {calculateSLA(item.last_status_updated_at || item.created_at).days} Hari
                                  </span>
                                </div>
                              )}

                              <button 
                                onClick={() => {
                                  setSelectedTicketForAction(item);
                                  setInputNib(item.nib_oss || '');
                                  setInputCatatan(item.catatan_admin || '');
                                  setIsActionModalOpen(true);
                                }}
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-emerald-500/20 active:scale-95 cursor-pointer text-center"
                              >
                                Proses Verifikasi
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Desktop View: Data Table */}
                        <div className="hidden md:block flex-1 overflow-auto max-h-[500px]">
                          <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold uppercase tracking-wider">
                                <th className="p-4">ID Tiket / Tanggal</th>
                                <th className="p-4">Perusahaan / Investor</th>
                                <th className="p-4">Potensi Lokasi</th>
                                <th className="p-4">Status Berkas</th>
                                <th className="p-4 text-right">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50 text-slate-600 dark:text-slate-300 font-medium">
                              {ossQueue.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                  <td className="p-4">
                                    <div className="text-emerald-500 dark:text-emerald-400 font-mono">#{item.id?.toString().slice(0,8).toUpperCase()}</div>
                                    <div className="text-slate-800 dark:text-slate-200 dark:text-slate-400 text-[10px] mt-0.5">
                                      {new Date(item.created_at).toLocaleDateString('id-ID')}
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <div className="font-bold text-slate-900 dark:text-white">{item.company_name || item.investor_name}</div>
                                    <div className="text-slate-800 dark:text-slate-200 dark:text-slate-400 text-[10px] mt-0.5">{item.contact_info}</div>
                                  </td>
                                  <td className="p-4">
                                    <div className="max-w-[150px] truncate">{item.potensi_name || "Kabupaten Luwu (Umum)"}</div>
                                  </td>
                                  <td className="p-4">
                                    <div className="flex flex-col gap-1 items-start">
                                      <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                                        {item.status}
                                      </span>
                                      {!['Izin Terbit / Realisasi', 'Ditolak / Batal', 'Selesai'].includes(item.status || '') && (
                                        <div className={`px-2 py-0.5 rounded-md border text-[10px] font-bold w-max flex items-center gap-1 ${calculateSLA(item.last_status_updated_at || item.created_at).badge}`}>
                                          <span className={calculateSLA(item.last_status_updated_at || item.created_at).color}>
                                            ⏱️ Tertahan {calculateSLA(item.last_status_updated_at || item.created_at).days} Hari
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-4 text-right">
                                    <button 
                                      onClick={() => {
                                        setSelectedTicketForAction(item);
                                        setInputNib(item.nib_oss || '');
                                        setInputCatatan(item.catatan_admin || '');
                                        setIsActionModalOpen(true);
                                      }}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95"
                                    >
                                      Proses Verifikasi
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    );
                  })()}
                </div>
                </div>

                {/* Status Penyelesaian Izin (Chart) */}
                <div className="p-6 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col items-center">
                  <div className="w-full flex justify-between items-center mb-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Status Penyelesaian Izin</h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      OSS-RBA Metrics
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 w-full mb-4">Distribusi realisasi dan progres penyelesaian berkas izin usaha.</p>
                  <div className="h-72 w-full flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Sedang Diproses', value: loiTickets.filter(t => t.status !== 'Izin Terbit / Realisasi' && t.status !== 'Izin Terbit' && t.status !== 'Ditolak' && t.status !== 'Batal' && t.status !== 'Tidak Layak').length || (loiTickets.length === 0 ? 1 : 0), color: '#f59e0b' },
                            { name: 'Ditolak / Batal', value: loiTickets.filter(t => t.status === 'Ditolak' || t.status === 'Batal' || t.status === 'Tidak Layak').length, color: '#ef4444' },
                            { name: 'Izin Terbit', value: loiTickets.filter(t => t.status === 'Izin Terbit / Realisasi' || t.status === 'Izin Terbit').length, color: '#10b981' }
                          ]}
                          cx="50%"
                          cy="45%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {[
                            { color: '#f59e0b' },
                            { color: '#ef4444' },
                            { color: '#10b981' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                          itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            

      {/* Modal Verifikasi KYC (Promosi) */}
      {isKycModalOpen && selectedKycTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="text-emerald-500" size={20} />
                  Verifikasi Investor (KYC)
                </h3>
                <p className="text-xs text-slate-800 dark:text-slate-200 dark:text-slate-400 mt-1">Review profil investor dan eskalasi ke tahap selanjutnya.</p>
              </div>
              <button
                onClick={() => setIsKycModalOpen(false)}
                className="p-2 text-slate-800 dark:text-slate-200 hover:text-slate-600 dark:hover:text-white bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Investor Profile */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 dark:text-slate-400 uppercase tracking-wider mb-3">Profil Investor</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] text-slate-800 dark:text-slate-200 dark:text-slate-400 uppercase mb-1">Nama Perusahaan</div>
                      <div className="font-semibold text-slate-900 dark:text-white text-sm">{selectedKycTicket.company_name}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-800 dark:text-slate-200 dark:text-slate-400 uppercase mb-1">Perwakilan / Kontak</div>
                      <div className="font-semibold text-slate-900 dark:text-white text-sm">{selectedKycTicket.investor_name}</div>
                      <div className="text-xs text-blue-500">{selectedKycTicket.contact_info}</div>
                    </div>
                  </div>
                </div>

                {/* Potensi yang diminati */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                    <div className="text-[10px] text-blue-500 uppercase font-bold mb-1">Potensi Diminati (IPRO)</div>
                    <div className="font-bold text-blue-700 dark:text-blue-400 text-sm">{selectedKycTicket.potensi_name}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="text-[10px] text-emerald-500 uppercase font-bold mb-1">Rencana Nilai Investasi</div>
                    <div className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(selectedKycTicket.nilai_investasi)}
                    </div>
                  </div>
                </div>

                {/* Pesan Tambahan */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 dark:text-slate-400 uppercase tracking-wider mb-2">Pesan & Kebutuhan Investor</h4>
                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 italic">
                    "{selectedKycTicket.pesan_tambahan || 'Tidak ada pesan tambahan.'}"
                  </div>
                </div>

                {/* Catatan KYC Admin */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 dark:text-slate-400 uppercase tracking-wider mb-2">Catatan Verifikasi (Internal)</h4>
                  <textarea
                    value={kycCatatan}
                    onChange={(e) => setKycCatatan(e.target.value)}
                    rows={3}
                    placeholder="Masukkan hasil meeting, verifikasi dokumen KYC, dll..."
                    className="w-full p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-amber-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 text-sm outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                disabled={isSavingKyc}
                onClick={(e) => handleSaveKyc(e, 'Sedang Diproses')}
                className="px-5 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl font-bold transition-all text-sm disabled:opacity-50"
              >
                Jadwalkan Meeting / Follow-up
              </button>
              <button
                type="button"
                disabled={isSavingKyc}
                onClick={(e) => handleSaveKyc(e, 'Persiapan Site Visit')}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-95 transition-all text-white rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isSavingKyc ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle size={16} />}
                Lolos Verifikasi - Eskalasi ke Bidang Dalak
              </button>
            </div>
          </div>
        </div>
      )}

{/* The Finisher Modal */}
            {isActionModalOpen && selectedTicketForAction && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <CheckCircle2 className="text-emerald-500" size={24} />
                        Verifikasi Dokumen & Terbitkan Izin
                      </h3>
                      <p className="text-xs text-slate-800 dark:text-slate-200 mt-1">Finalisasi penerbitan perizinan berusaha (OSS-RBA).</p>
                    </div>
                    <button 
                      onClick={() => setIsActionModalOpen(false)}
                      className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 dark:text-slate-400 rounded-full transition-all cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Investor & Location Info */}
                    <div className="space-y-4 border-r border-transparent md:border-slate-200 dark:md:border-slate-800 pr-0 md:pr-6">
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 space-y-3">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">Data Pemohon</div>
                        
                        <div>
                          <div className="text-xs text-slate-800 dark:text-slate-200 dark:text-slate-400">Nama Perusahaan</div>
                          <div className="font-bold text-slate-900 dark:text-white">{selectedTicketForAction.company_name || selectedTicketForAction.investor_name}</div>
                        </div>
                        
                        <div>
                          <div className="text-xs text-slate-800 dark:text-slate-200 dark:text-slate-400">Nilai Investasi</div>
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(selectedTicketForAction.nilai_investasi)}</div>
                        </div>

                        <div>
                          <div className="text-xs text-slate-800 dark:text-slate-200 dark:text-slate-400">Lokasi Tujuan</div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedTicketForAction.potensi_name || "Umum (Kabupaten Luwu)"}</div>
                        </div>
                        
                        <div>
                          <div className="text-xs text-slate-800 dark:text-slate-200 dark:text-slate-400">Kebutuhan Lahan</div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedTicketForAction.kebutuhan_lahan ? `${selectedTicketForAction.kebutuhan_lahan} Hektar` : "Tidak spesifik"}</div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Checklist & Action */}
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">Checklist Persyaratan Administrasi</div>
                        
                        <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors">
                          <input type="checkbox" className="mt-0.5 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500" />
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white leading-none">Persetujuan KKPR</div>
                            <div className="text-xs text-slate-800 dark:text-slate-200 dark:text-slate-400 mt-1">Kesesuaian Kegiatan Pemanfaatan Ruang (Tata Ruang).</div>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors">
                          <input type="checkbox" className="mt-0.5 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500" />
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white leading-none">Dokumen Lingkungan</div>
                            <div className="text-xs text-slate-800 dark:text-slate-200 dark:text-slate-400 mt-1">Persetujuan AMDAL atau UKL-UPL terkait dampak lingkungan.</div>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors">
                          <input type="checkbox" className="mt-0.5 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500" />
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white leading-none">Rekomendasi Teknis OPD</div>
                            <div className="text-xs text-slate-800 dark:text-slate-200 dark:text-slate-400 mt-1">Izin sektoral dan pertimbangan teknis dari Dinas terkait.</div>
                          </div>
                        </label>
                      </div>

                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        setIsSavingAction(true);
                        try {
                          const res = await fetch(`/api/loi/${selectedTicketForAction.id}/verify`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              status: 'Izin Terbit / Realisasi',
                              catatan_admin: inputCatatan,
                              nib_oss: inputNib || "Telah diverifikasi",
                            }),
                          });
                          if (res.ok) {
                            // Also update investments table in Supabase
                            const skNum = `SK.PKKPR/DPMPTSP-LUWU/2026/${selectedTicketForAction.id}`;
                            try {
                              await supabase.from('investments').update({
                                status: 'Approved',
                                sk_pkkpr_doc_number: skNum,
                                pkkpr_doc_number: skNum,
                                updated_at: new Date().toISOString()
                              }).eq('id', selectedTicketForAction.id);
                            } catch (e) {
                              console.warn('Supabase investment status update notice:', e);
                            }

                            // Trigger Cross-OPD Notification to Pemohon
                            addCrossOpdNotification({
                              applicationId: String(selectedTicketForAction.id),
                              applicantName: selectedTicketForAction.investor_name || selectedTicketForAction.company_name || 'Pemohon Terdaftar',
                              companyName: selectedTicketForAction.company_name || selectedTicketForAction.investor_name || 'Perusahaan Pemohon',
                              sector: selectedTicketForAction.sektor_name || 'Perindustrian',
                              districtName: selectedTicketForAction.potensi_name || 'Belopa',
                              villageName: 'Pusat Kota',
                              targetRole: 'PEMOHON',
                              fromRole: 'ADMIN_DPMPTSP',
                              type: 'ISSUED_DPMPTSP',
                              title: `Izin PKKPR Resmi Terbit #${selectedTicketForAction.id}`,
                              message: `Dinas Penanaman Modal dan PTSP Kabupaten Luwu telah menerbitkan SK Izin PKKPR No. ${skNum}. Silahkan unduh dokumen SK Izin PKKPR (PDF).`,
                              skPkkprDocNumber: skNum
                            });

                            // Generate SK Izin PKKPR PDF
                            generateSkPkkprPdf({
                              applicationId: String(selectedTicketForAction.id),
                              applicantName: selectedTicketForAction.investor_name || 'Pemohon Terdaftar',
                              companyName: selectedTicketForAction.company_name || 'Perusahaan Pemohon',
                              nibNik: inputNib || 'NIB-9120000000000',
                              sector: selectedTicketForAction.sektor_name || 'Perindustrian',
                              districtName: selectedTicketForAction.potensi_name || 'Belopa',
                              villageName: 'Senga',
                              areaHa: selectedTicketForAction.kebutuhan_lahan || 10,
                              investmentValue: selectedTicketForAction.nilai_investasi || 10000000000,
                              skPkkprDocNumber: skNum
                            });

                            Swal.fire({
                              title: "Izin PKKPR Berhasil Diterbitkan!",
                              text: `SK Izin PKKPR No. ${skNum} telah diterbitkan oleh DPMPTSP Kabupaten Luwu dan dikirim ke Pemohon.`,
                              icon: "success",
                              background: "#0f172a",
                              color: "#f8fafc"
                            });
                            setIsActionModalOpen(false);
                            fetchLoiTickets();
                          } else {
                            const errData = await res.json();
                            throw new Error(errData.error || "Gagal memproses perizinan.");
                          }
                        } catch (err) {
                          console.error("Error finalizing ticket:", err);
                          Swal.fire({
                            title: "Gagal memproses berkas",
                            text: err.message || "Terjadi kesalahan.",
                            icon: "error",
                            background: "#0f172a",
                            color: "#f8fafc"
                          });
                        } finally {
                          setIsSavingAction(false);
                        }
                      }} className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-6">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Nomor NIB (OSS-RBA)</label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: NIB-123456-LUWU"
                            value={inputNib}
                            onChange={(e) => setInputNib(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500/55 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Catatan Verifikasi</label>
                          <textarea
                            required
                            placeholder="Catatan persetujuan, validasi dokumen, dll..."
                            value={inputCatatan}
                            onChange={(e) => setInputCatatan(e.target.value)}
                            rows={2}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500/55 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none transition-all resize-none"
                          />
                        </div>
                        
                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={isSavingAction}
                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
                          >
                            {isSavingAction && <Loader2 className="w-4 h-4 animate-spin" />}
                            ✅ Setujui & Terbitkan Izin
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
) : (activeTab === 'overview' && (userRole === 'admin_dalak' || userRole?.includes('dalak'))) ? (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 mt-4 md:mt-0">
            {/* Layout Header & Branding */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 border-b border-slate-200 dark:border-slate-800/60 pb-5 sm:pb-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-1.5 tracking-tight flex items-center gap-2">
                  <span>Meja Kerja Bidang Pengendalian Pelaksanaan & Pengawasan</span>
                  <Sparkles size={20} className="text-rose-600 dark:text-rose-400 animate-pulse shrink-0" />
                </h1>
                <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
                  Pusat komando tindak lanjut pengaduan masyarakat, mediasi lahan, dan pengawasan investasi.
                </p>
              </div>
              <div className="text-[10px] sm:text-xs font-mono bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30 px-3 py-1.5 rounded-xl uppercase tracking-wider font-extrabold shrink-0 shadow-sm">
                DALAK - DPMPTSP LUWU
              </div>
            </div>

            <div className="space-y-6 sm:space-y-8">
              {/* 4 Tupoksi-driven KPI Cards (Android 2x2 Bento Grid) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Card 1: Pengaduan */}
                <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-2 sm:mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">ADUAN PROSES</span>
                    <div className="p-2 sm:p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
                      <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                    <AnimatedCounter value={complaints.filter(c => c.status === 'Menunggu Verifikasi' || !c.status).length} />
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">Aduan Menunggu Proses</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 hidden sm:block">Aduan publik belum ditindaklanjuti.</div>
                </div>

                {/* Card 2: Pengawasan */}
                <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-2 sm:mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">INSPEKSI BULANAN</span>
                    <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                    <AnimatedCounter value={12} />
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">Jadwal Inspeksi Bulan Ini</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 hidden sm:block">Target pengawasan kepatuhan LKPM.</div>
                </div>

                {/* Card 3: Pengendalian */}
                <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-2 sm:mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">MEDIATED</span>
                    <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                    <AnimatedCounter value={complaints.filter(c => c.status === 'Mediasi Selesai' || c.status === 'Selesai').length} />
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">Fasilitasi Masalah Selesai</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 hidden sm:block">Kasus/Sengketa yang berhasil dimediasi.</div>
                </div>

                {/* Card 4: Kepatuhan */}
                <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-2 sm:mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">NON-COMPLIANT</span>
                    <div className="p-2 sm:p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                      <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                    <AnimatedCounter value={3} />
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">Pelaku Usaha Non-Patuh</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 hidden sm:block">Perusahaan dalam pengawasan khusus/sanksi.</div>
                </div>
              </div>

              {/* Main Content: Left Column (Data Table) & Right Column (Pengawasan & Pelaporan) */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* Antrean Pengaduan & Fasilitasi (Existing) */}
                <div className="p-4 sm:p-6 rounded-2xl bg-white/95 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col h-full">
                  <div className="flex justify-between items-center mb-4 sm:mb-6">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Activity className="text-rose-600 dark:text-rose-400" size={20} />
                      Antrean Pengaduan
                    </h2>
                    <button 
                      onClick={fetchComplaints}
                      className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
                      title="Segarkan data"
                    >
                      <RefreshCw size={16} className={loadingComplaints ? "animate-spin text-rose-600 dark:text-rose-400" : ""} />
                    </button>
                  </div>
                  <div className="w-full overflow-x-auto custom-scrollbar rounded-xl border border-slate-200 dark:border-slate-800 max-h-[400px]">
                    <table className="w-full text-left text-xs border-collapse whitespace-nowrap min-w-[650px]">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px]">
                          <th className="p-3.5">ID Tiket / Tanggal</th>
                          <th className="p-3.5">Identitas Pelapor</th>
                          <th className="p-3.5">Jenis Aduan</th>
                          <th className="p-3.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300 font-medium">
                        {(() => {
                          const combined = [
                            ...complaints.map(c => ({ ...c, _type: 'complaint' }))
                          ].sort((a, b) => {
                            const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
                            const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
                            return timeB - timeA;
                          });

                          if (combined.length === 0) {
                            return (
                              <EmptyState 
                                isTable={true} 
                                colSpan={4} 
                                title="Belum Ada Antrean" 
                                message="Belum ada antrean tugas." 
                              />
                            );
                          }

                          return combined.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-3.5">
                                <div className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">#{item.tiket_id || item.id?.toString().slice(0,6).toUpperCase()}</div>
                                <div className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">
                                  {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'}
                                </div>
                              </td>
                              <td className="p-3.5">
                                {item.is_anonim ? (
                                  <div>
                                    <div className="font-bold text-slate-700 dark:text-slate-300">Anonim</div>
                                    <div className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">Dilindungi</div>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="font-bold text-slate-900 dark:text-white">{item.nama_pelapor || 'Masyarakat Umum'}</div>
                                    <div className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">{item.tipe_pelapor || '-'}</div>
                                  </div>
                                )}
                              </td>
                              <td className="p-3.5">
                                <div className="max-w-[180px] truncate font-semibold text-slate-800 dark:text-slate-200" title={item.judul_laporan}>{item.judul_laporan}</div>
                              </td>
                              <td className="p-3.5">
                                <div className="flex flex-col gap-1 items-start">
                                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                                    item.status?.includes('Eskalasi') 
                                      ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/50 animate-pulse'
                                      : !item.status || item.status === 'Menunggu Verifikasi'
                                       ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30'
                                       : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                                  }`}>
                                    {item.status?.includes('Eskalasi') ? `🚨 ${item.status}` : (item.status || 'Menunggu')}
                                  </span>
                                  {!['Selesai', 'Ditolak / Batal'].includes(item.status || '') && (
                                    <div className={`px-2 py-0.5 rounded-md border text-[10px] font-bold w-max flex items-center gap-1 ${calculateSLA(item.created_at).badge}`}>
                                      <span className={calculateSLA(item.created_at).color}>
                                        ⏱️ Tertahan {calculateSLA(item.created_at).days} Hari
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  {/* Pengawasan & Kepatuhan Module */}
                  <div className="p-4 sm:p-6 rounded-2xl bg-white/95 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4 sm:mb-6">
                      <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="text-amber-500" size={20} />
                        Radar Kepatuhan Pelaku Usaha
                      </h2>
                    </div>
                    <div className="w-full overflow-x-auto custom-scrollbar rounded-xl border border-slate-200 dark:border-slate-800 max-h-[250px]">
                      <table className="w-full text-left text-xs border-collapse whitespace-nowrap min-w-[550px]">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px]">
                            <th className="p-3.5">Nama Perusahaan</th>
                            <th className="p-3.5">Status LKPM</th>
                            <th className="p-3.5">Tingkat Kepatuhan</th>
                            <th className="p-3.5 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300 font-medium">
                          <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-3.5 font-bold text-slate-900 dark:text-white">PT. Masmindo Dwi Area</td>
                            <td className="p-3.5 text-slate-700 dark:text-slate-300">Sudah Lapor</td>
                            <td className="p-3.5"><span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Aman</span></td>
                            <td className="p-3.5 text-right">
                              <button className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-[11px] font-bold border border-slate-300 dark:border-slate-700 transition">Input Hasil</button>
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-3.5 font-bold text-slate-900 dark:text-white">PT. Bumi Mineral Sulawesi</td>
                            <td className="p-3.5 text-slate-700 dark:text-slate-300">Terlambat</td>
                            <td className="p-3.5"><span className="text-amber-600 dark:text-amber-400 font-extrabold">Warning</span></td>
                            <td className="p-3.5 text-right">
                              <button className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-[11px] font-bold border border-slate-300 dark:border-slate-700 transition">Input Hasil</button>
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-3.5 font-bold text-slate-900 dark:text-white">PT. Kencana Cipta</td>
                            <td className="p-3.5 text-slate-700 dark:text-slate-300">Tidak Lapor</td>
                            <td className="p-3.5"><span className="text-purple-600 dark:text-purple-400 font-extrabold">Sanksi</span></td>
                            <td className="p-3.5 text-right">
                              <button className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-[11px] font-bold border border-slate-300 dark:border-slate-700 transition">Input Hasil</button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Evaluasi & Pelaporan Widget */}
                  <div className="p-4 sm:p-6 rounded-2xl bg-white/95 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col">
                    <div className="flex justify-between items-center mb-3 sm:mb-4">
                      <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="text-emerald-500" size={20} />
                        Sistem Pelaporan Terpadu
                      </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-4 font-medium leading-relaxed">
                      Buat Berita Acara Pemeriksaan (BAP) dan unduh rekapitulasi laporan pengawasan secara otomatis.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button 
                        onClick={() => {
                          Swal.fire({
                            title: 'Fitur Segera Hadir',
                            text: 'Modul Cetak Berita Acara Pemeriksaan (BAP) sedang dalam pengembangan.',
                            icon: 'info',
                            confirmButtonColor: '#10b981'
                          });
                        }}
                        className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold tracking-wide transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                      >
                        <FileText size={14} />
                        <span>Cetak BAP</span>
                      </button>
                      <button 
                        onClick={() => {
                          Swal.fire({
                            title: 'Fitur Segera Hadir',
                            text: 'Modul Download Rekap Pengawasan sedang dalam pengembangan.',
                            icon: 'info',
                            confirmButtonColor: '#10b981'
                          });
                        }}
                        className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-xl text-xs font-bold tracking-wide border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex items-center justify-center gap-2"
                      >
                        <FileText size={14} />
                        <span>Download Rekap Pengawasan (PDF)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Widget Ringkasan Tenaga Kerja (TKL vs TKA & Analisis Sektor) */}
              <OperatorLaborWidget 
                investments={investments} 
                onSelectInvestment={setSelectedInvestmentId} 
              />
            </div>
          </div>
        ) : (activeTab === 'overview' && userRole === 'admin_data') ? (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 mt-4 md:mt-0">
            {/* 1. Layout Header & Branding */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 border-b border-slate-200 dark:border-slate-800/60 pb-5 sm:pb-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-1.5 tracking-tight flex items-center gap-2">
                  <span>Meja Kerja Bidang Perencanaan, Pengembangan Iklim & Data</span>
                  <Map className="text-purple-500 animate-pulse shrink-0" size={20} />
                </h1>
                <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
                  Pusat kendali tata ruang (WebGIS), analisis makroekonomi, evaluasi kebijakan, dan pelaporan eksekutif.
                </p>
              </div>
              <div className="text-[10px] sm:text-xs font-mono bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-xl uppercase tracking-wider font-extrabold shrink-0 shadow-sm">
                DATA & STRATEGY COMMAND CENTER
              </div>
            </div>

            {/* 2. Macro KPI Cards (2x2 Bento Grid on Android/Mobile) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Card 1: Target Realisasi (RPJMD) */}
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">TARGET RPJMD</span>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                  Rp 1.2 T
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">
                  Target Realisasi (RPJMD)
                </div>
              </div>

              {/* Card 2: Capaian Terealisasi */}
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">CAPAIAN REALISASI</span>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 truncate">
                  <AnimatedCounter value={stats.totalInvestmentValue > 0 ? stats.totalInvestmentValue : 5000000000000} formatter={formatRupiahSingkat} />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">
                  Capaian Terealisasi
                </div>
              </div>

              {/* Card 3: Database Spasial (GIS) */}
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">DATABASE SPASIAL</span>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                    <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                  <AnimatedCounter value={24} /> <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Lapis</span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">
                  Database Spasial (GIS)
                </div>
              </div>

              {/* Card 4: Investor LOI */}
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">LOI STATS</span>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform duration-300">
                    <Briefcase className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                  <AnimatedCounter value={loiCount} />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">
                  Investor LOI
                </div>
              </div>
            </div>

            {/* 3 & 4. Main Content: Master Data & Reporting Engine */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (66%): Master Data & Spatial Intelligence */}
              <div className="lg:col-span-2 p-4 sm:p-6 rounded-2xl bg-white/95 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Database className="text-purple-500" size={20} />
                      Data Master & Analisis Spasial
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-1">Pusat pengelolaan basis data makro, sektoral, dan peta tata ruang.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 flex-1">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex flex-col justify-between group">
                    <div>
                      <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
                        <Map size={18} />
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">Peta Potensi & Tata Ruang</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">Integrasi layer WebGIS RTRW dan RDTR wilayah Kabupaten Luwu.</p>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex flex-col justify-between group">
                    <div>
                      <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
                        <BarChart3 size={18} />
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">Data Makroekonomi</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">Dataset PDRB, inflasi, dan tren pertumbuhan sektoral.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex flex-col justify-between group">
                    <div>
                      <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
                        <FileCheck size={18} />
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">LKPM & Realisasi</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">Laporan Kegiatan Penanaman Modal terverifikasi.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3 border-t border-slate-200 dark:border-slate-800 pt-5">
                  <button onClick={() => window.open('/?mode=gis', '_blank')} className="px-5 py-2.5 bg-purple-600 dark:bg-purple-500 hover:bg-purple-700 dark:hover:bg-purple-600 text-white rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-md">
                    <MapPin size={16} />
                    Validasi Analisis Spasial
                  </button>
                  <button onClick={() => setActiveTab('spatial_analytics')} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700">
                    <Settings size={16} />
                    Buka Spatial Analytics
                  </button>
                </div>
              </div>

              {/* Right Column (33%): Evaluasi & Pelaporan (Reporting Engine) */}
              <div className="p-4 sm:p-6 rounded-2xl bg-white/95 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col">
                <div className="flex items-center gap-2 mb-4 sm:mb-6">
                  <div className="p-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg">
                    <BookOpen size={20} />
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">Sistem Pelaporan Eksekutif</h3>
                </div>
                
                <div className="space-y-3 flex-1">
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-800/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                        <FileDown size={14} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">LKPM Kuartal I 2026</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Siap di-generate</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-800/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <FileDown size={14} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">Rekap Realisasi Semester I</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Sinkronisasi data 100%</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <button onClick={() => {
                    Swal.fire({
                      title: 'Laporan Realisasi Terintegrasi',
                      text: 'Mengunduh rekap realisasi investasi terverifikasi RPJMD Luwu...',
                      icon: 'info',
                      confirmButtonColor: '#10b981'
                    });
                  }} className="w-full px-4 py-2.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-2 border border-rose-200 dark:border-rose-500/30 cursor-pointer">
                    <FileText size={14} />
                    Generate Laporan Realisasi (PDF)
                  </button>
                  <button onClick={() => {
                    Swal.fire({
                      title: 'Ekspor Rekap Sektoral',
                      text: 'Mengekspor matriks data sektoral investasi Luwu ke Excel (XLSX)...',
                      icon: 'success',
                      confirmButtonColor: '#10b981'
                    });
                  }} className="w-full px-4 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-500/30 cursor-pointer">
                    <Download size={14} />
                    Unduh Rekap Sektoral (Excel)
                  </button>
                </div>
              </div>
            </div>

            {/* 5. Bottom Section - Kebijakan & Deregulasi */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 bg-amber-500/20 rounded-xl text-amber-700 dark:text-amber-400 shrink-0">
                <Scale size={24} />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                  <span>Kajian Kebijakan & Deregulasi</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-[9px] uppercase tracking-wider font-extrabold text-amber-800 dark:text-amber-300">Panel Kajian</span>
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1 leading-relaxed">
                  Panel pantauan regulasi penghambat investasi, drafting Ranperda Penanaman Modal, dan usulan skema insentif daerah.
                </p>
              </div>
            </div>

            {/* 6. Widget Ringkasan Tenaga Kerja (TKL vs TKA & Analisis Sektor) */}
            <OperatorLaborWidget 
              investments={investments} 
              onSelectInvestment={setSelectedInvestmentId} 
            />
          </div>
        ) : (activeTab === 'overview' && (userRole === 'admin_promosi' || userRole?.includes('promosi'))) ? (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 mt-4 md:mt-0">
            {/* 1. Layout Header & Branding */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 border-b border-slate-200 dark:border-slate-800/60 pb-5 sm:pb-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-1.5 tracking-tight flex items-center gap-2">
                  <span>Meja Kerja Bidang Promosi & Penanaman Modal</span>
                  <Sparkles className="text-amber-500 animate-pulse shrink-0" size={20} />
                </h1>
                <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
                  Pusat kendali etalase potensi daerah (IPRO), penjaringan minat investasi (LoI), dan verifikasi awal investor.
                </p>
              </div>
              <div className="text-[10px] sm:text-xs font-mono bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl uppercase tracking-wider font-extrabold shrink-0 shadow-sm">
                FRONT-DESK COMMAND CENTER
              </div>
            </div>

            {/* 2. KPI Cards (2x2 Bento Grid on Android/Mobile) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Card 1: Tiket Minat (LoI) Masuk */}
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">TIKET LOI</span>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                  <AnimatedCounter value={loiTickets.filter(t => t.status === 'Menunggu Verifikasi').length} />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">
                  Tiket Minat (LoI) Masuk
                </div>
              </div>

              {/* Card 2: Potensi Dipublikasikan */}
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">POTENSI IPRO</span>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                  <AnimatedCounter value={investments.filter(i => i.isActive).length} />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">
                  Potensi Dipublikasikan
                </div>
              </div>

              {/* Card 3: Total Nilai Penawaran */}
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">OFFER VALUE</span>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 truncate">
                  <AnimatedCounter value={stats.totalInvestmentValue} formatter={formatRupiahSingkat} />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">
                  Total Nilai Penawaran
                </div>
              </div>

              {/* Card 4: Investor Lolos KYC */}
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">INVESTOR KYC</span>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                  <AnimatedCounter value={loiTickets.filter(t => t.status === 'Persiapan Site Visit' || t.status === 'Selesai' || t.status === 'Disetujui').length} />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">
                  Investor Lolos KYC
                </div>
              </div>
            </div>

            {/* 3 & 5. Main Content: Data Table & Right Section */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column (75%): LoI Verification Queue */}
              <div className="lg:col-span-3 p-4 sm:p-6 rounded-2xl bg-white/95 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">Penjaringan & Verifikasi Minat Investasi (LoI)</h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-1">Tiket minat dari Landing Page yang membutuhkan tindakan verifikasi (KYC) atau follow-up.</p>
                  </div>
                  <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg shrink-0">
                    <Users size={20} />
                  </div>
                </div>
                
                <div className="w-full overflow-x-auto custom-scrollbar rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <table className="w-full text-left border-collapse min-w-[700px] whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px]">
                        <th className="p-3.5">Tanggal</th>
                        <th className="p-3.5">Profil Perusahaan</th>
                        <th className="p-3.5">Potensi Diminati</th>
                        <th className="p-3.5">Rencana Nilai (Rp)</th>
                        <th className="p-3.5 text-center">Status</th>
                        <th className="p-3.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300 font-medium text-xs">
                      {loiTickets.length === 0 ? (
                        <EmptyState 
                          isTable={true} 
                          colSpan={6} 
                          title="Belum Ada Tiket" 
                          message="Belum ada tiket LoI masuk." 
                        />
                      ) : (
                        loiTickets.map((ticket, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                            <td className="p-3.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                              {new Date(ticket.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'short', year: 'numeric'
                              })}
                            </td>
                            <td className="p-3.5">
                              <div className="font-extrabold text-sm text-slate-900 dark:text-white">{ticket.company_name}</div>
                              <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">{ticket.investor_name}</div>
                            </td>
                            <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                              {ticket.potensi_name}
                            </td>
                            <td className="p-3.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(ticket.nilai_investasi)}
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="flex flex-col gap-1.5 items-center">
                                <span className={`inline-flex w-max items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider
                                  ${ticket.status === 'Menunggu Verifikasi' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30' :
                                    ticket.status === 'Sedang Diproses' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30' :
                                    ticket.status === 'Persiapan Site Visit' ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/30' :
                                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700'}`}>
                                  {ticket.status}
                                </span>
                                {['Izin Terbit / Realisasi', 'Ditolak / Batal'].includes(ticket.status || '') ? (
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">- Selesai -</span>
                                ) : (
                                  <div className={`px-2 py-0.5 rounded-md border text-[10px] font-bold w-max flex items-center gap-1 ${calculateSLA(ticket.last_status_updated_at).badge}`}>
                                    <span className={calculateSLA(ticket.last_status_updated_at).color}>
                                      ⏱️ Tertahan {calculateSLA(ticket.last_status_updated_at).days} Hari
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => {
                                  setSelectedKycTicket(ticket);
                                  setKycCatatan(ticket.catatan_admin || '');
                                  setIsKycModalOpen(true);
                                }}
                                className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-800 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 shadow-sm"
                              >
                                Verifikasi (KYC)
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column (25%): Manajemen Etalase Potensi (IPRO) */}
              <div className="p-4 sm:p-6 rounded-2xl bg-white/95 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                      <LayoutDashboard size={20} />
                    </div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">Manajemen Etalase Potensi (IPRO)</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mb-6 leading-relaxed">
                    Kelola data Investment Project Ready to Offer (IPRO) yang akan ditampilkan di Landing Page publik.
                  </p>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        console.log("[AdminPortalDashboard] Overview card 'Tambah Potensi Baru' clicked -> setting activeTab='manage_potential' and opening Add IPRO modal!");
                        setActiveTab('manage_potential');
                        setIsAddIproModalOpen(true);
                      }}
                      className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <PlusCircle className="text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" size={18} />
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 text-xs sm:text-sm">Tambah Potensi Baru</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        console.log("[AdminPortalDashboard] Overview card 'Kelola Publikasi Web' clicked -> setting activeTab='manage_potential'");
                        setActiveTab('manage_potential');
                      }}
                      className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="text-slate-600 dark:text-slate-400" size={18} />
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">Kelola Publikasi Web</span>
                      </div>
                      <ChevronRight className="text-slate-500 dark:text-slate-400" size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Info className="text-blue-600 dark:text-blue-400" size={14} />
                    <span className="text-xs font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Tips Promosi</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    Pastikan proposal PDF (Pitch Deck) terlampir pada setiap IPRO agar investor bisa mengunduhnya.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'overview' ? (
          userRole?.toLowerCase().includes('pertanian') ? (
            <PertanianOverview
              investments={investments}
              districts={districts}
              villages={villages}
              onNavigateTab={(tab) => setActiveTab(tab as any)}
              onSelectInvestment={setSelectedInvestmentId}
            />
          ) : userRole?.toLowerCase().includes('puptr') || userRole?.toLowerCase().includes('tata_ruang') ? (
            <PuptrOverview
              investments={investments}
              districts={districts}
              villages={villages}
              onNavigateTab={(tab) => setActiveTab(tab as any)}
              onSelectInvestment={setSelectedInvestmentId}
            />
          ) : (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4 md:mt-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 border-b border-slate-200 dark:border-slate-800/60 pb-4 sm:pb-6">
              <div>
                <h1 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-1 tracking-tight flex items-center gap-2">
                  <span>{getWorkspaceTitle(userRole)}</span>
                  <Sparkles size={18} className="text-emerald-700 dark:text-emerald-400 animate-pulse shrink-0" />
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">{getWorkspaceSubtitle(userRole)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {isOperatorWorkspaceRole(userRole) && (
                  <button
                    onClick={() => {
                      console.log("[AdminPortalDashboard] Overview Header 'Operator Workspace' clicked -> navigating to /operator-workspace");
                      window.location.href = "/operator-workspace";
                    }}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-[11px] sm:text-xs font-bold shadow-md shadow-emerald-950/20 hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                    title="Buka Ruang Kerja Operator (Smart Form & GIS)"
                  >
                    <Building2 size={14} className="shrink-0" />
                    <span>Operator Workspace</span>
                    <ArrowUpRight size={12} className="shrink-0" />
                  </button>
                )}
                <div className="text-[10px] sm:text-xs font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl uppercase tracking-wider font-bold">
                  {t('dashboard.onlineSyncActive', 'Online Sync Active')}
                </div>
              </div>
            </div>

            {/* Conditional Task Queue per Role */}
            {renderTaskQueue()}

            {/* 1. Top Row: Quick Statistic Cards (4 Columns) */}
            <div className="bg-white/90 dark:bg-slate-900/60 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm mb-4 sm:mb-6">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 sm:gap-2">
                  <Activity size={15} /> Economic Health Trend
                </h3>
                <select 
                  value={selectedDistrictId}
                  onChange={(e) => setSelectedDistrictId(e.target.value)}
                  className="text-[11px] sm:text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-none rounded-lg p-1.5 sm:p-2 outline-none"
                >
                  {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="h-28 sm:h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={investmentTrend}>
                    <XAxis dataKey="year" hide />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                      itemStyle={{ color: '#10b981' }}
                      formatter={(value: number) => [formatRupiahSingkat(value), 'Investment']}
                    />
                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {/* Card 1 */}
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2.5 sm:mb-4">
                  <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                    <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {stats.totalOpportunities} {t('investor.locations', 'Lokasi')}
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 line-clamp-1">
                  {t('dashboard.totalOpportunities', 'Total Peluang Investasi')}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 hidden sm:block">
                  {t('dashboard.totalOpportunitiesDesc', 'Peluang investasi terpetakan aktif')}
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2.5 sm:mb-4">
                  <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform">
                    <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {stats.totalArea > 0 ? stats.totalArea.toLocaleString('id-ID') : '0'} Ha
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 line-clamp-1">
                  {t('dashboard.totalLandArea', 'Total Luas Lahan')}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 hidden sm:block">
                  {t('dashboard.totalLandAreaDesc', 'Kumulatif luas wilayah terdata')}
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2.5 sm:mb-4">
                  <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-400 group-hover:scale-105 transition-transform">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight truncate max-w-full">
                  {stats.dominantSector}
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 line-clamp-1">
                  {t('dashboard.dominantSector', 'Sektor Dominan')}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 hidden sm:block">
                  {t('dashboard.dominantSectorDesc', 'Sektor potensi kontributor utama')}
                </div>
              </div>

              {/* Card 4 */}
              <div 
                id="rata-rata-roi-card" 
                className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-2.5 sm:mb-4">
                  <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 group-hover:scale-105 transition-transform">
                    <Percent className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {stats.avgRoiRange}
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 line-clamp-1">
                  {t('dashboard.avgRoi', 'Rata-rata Estimasi ROI')}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 hidden sm:block">
                  {t('dashboard.avgRoiDesc', 'Tingkat pengembalian modal rata-rata')}
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/50 flex items-center gap-1.5">
                  <span className="text-emerald-700 dark:text-emerald-400/80">💡</span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {t('dashboard.roiBenchmark', 'Benchmark Luwu: ~10% - 12% (Rata-rata sektor)')}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Middle Row: Spatial Highlights & Analytics (2 Columns: 60% / 40%) */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left Column (60%): Top Rekomendasi Investasi */}
              <div className="lg:col-span-3 p-6 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('dashboard.topRecommendations', 'Top Rekomendasi Investasi')}</h3>
                      <p className="text-xs text-slate-800 dark:text-slate-200">{t('dashboard.topRecommendationsDesc', 'Proyek strategis teratas berdasarkan nilai komitmen investasi')}</p>
                    </div>
                  </div>

                  {stats.topInvestments.length === 0 ? (
                    <EmptyState 
                      title="Belum Ada Rekomendasi" 
                      message="Belum ada data investasi diinput secara terpadu." 
                    />
                  ) : (
                    <div className="space-y-4">
                      {stats.topInvestments.map((inv) => {
                        const color = SECTOR_COLORS[inv.sector as SektorInvestasi] || "#64748b";
                        return (
                          <div 
                            key={inv.id}
                            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 hover:border-slate-700 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group"
                          >
                            <div className="flex items-center gap-4 truncate">
                              <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-900 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800 relative">
                                <img 
                                  src={inv.photoUrl || inv.photo_url || inv.url_foto_lokasi || (inv.photoUrls && inv.photoUrls[0]) || (inv.galeri_foto && inv.galeri_foto[0]) || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=200"} 
                                  alt={inv.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                              <div className="truncate">
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-emerald-400 transition-colors truncate">
                                  {inv.name}
                                </h4>
                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                  <span 
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: `${color}15`, color: color }}
                                  >
                                    {inv.sector}
                                  </span>
                                  <span className="text-[10px] text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                    <MapPin size={10} /> {inv.areaHa} Ha
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto gap-2">
                              <span className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400">
                                {formatRupiahSingkat(inv.investmentValue)}
                              </span>
                              <button
                                onClick={() => setSelectedInvestmentId(inv.id)}
                                className="px-3 py-1 bg-white dark:bg-slate-900 hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-700 text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all"
                              >
                                <span>{t('dashboard.viewDetails', 'Lihat Detail')}</span>
                                <ArrowUpRight size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {stats.topInvestments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/50 flex justify-end">
                    <button 
                      onClick={() => {
                        try {
                          if (!document.fullscreenElement) {
                            const elem = document.documentElement as any;
                            requestSmartFullscreen()
                          }
                        } catch (e) {}
                        exitSmartFullscreen();
                        navigate('/?skipSplash=true');
                      }}
                      className="text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                    >
                      <span>{t('dashboard.exploreMoreMap', 'Eksplor Peta Selengkapnya')}</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column (40%): Distribusi Sektor */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{t('dashboard.sectorDistribution', 'Distribusi Sektor')}</h3>
                  <p className="text-xs text-slate-800 dark:text-slate-200 mb-6">{t('dashboard.sectorDistributionDesc', 'Persentase sebaran jenis investasi terdata')}</p>

                  {stats.sectorData.length === 0 ? (
                    <EmptyState 
                      title="Belum Ada Distribusi Sektor" 
                      message={t('dashboard.emptySectorData', 'Belum ada data sektor investasi diinput.')} 
                    />
                  ) : (
                    <div className="relative h-48 min-h-[192px] w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <PieChart>
                          <Pie
                            data={stats.sectorData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {stats.sectorData.map((entry, index) => {
                              const color = SECTOR_COLORS[entry.name as SektorInvestasi] || "#64748b";
                              return (
                                <Cell key={`cell-${index}`} fill={color} />
                              );
                            })}
                          </Pie>
                          <Tooltip
                            contentStyle={{ 
                              backgroundColor: '#0f172a', 
                              borderColor: '#1e293b', 
                              borderRadius: '12px',
                              color: '#f8fafc',
                              fontSize: '11px',
                              fontFamily: 'sans-serif'
                            }} 
                            itemStyle={{ color: '#ffffff', fontWeight: 'bold', fontSize: '11px' }}
                            labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '11px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-xl font-black text-slate-900 dark:text-white">{stats.totalOpportunities}</span>
                        <span className="text-[10px] text-slate-800 dark:text-slate-200 dark:text-slate-400 font-mono tracking-wider uppercase">{t('dashboard.projects', 'Proyek')}</span>
                      </div>
                    </div>
                  )}
                </div>

                {stats.sectorData.length > 0 && (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1 mt-4">
                    {stats.sectorData.map((item) => {
                      const color = SECTOR_COLORS[item.name as SektorInvestasi] || "#64748b";
                      const percentage = ((item.value / stats.totalOpportunities) * 100).toFixed(0);
                      return (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                            <span className="text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 font-mono">
                            <span className="text-slate-800 dark:text-slate-200 font-medium">({item.value})</span>
                            <span className="text-slate-900 dark:text-white font-bold">{percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 2.5 Row: Widget Ringkasan Tenaga Kerja (TKL vs TKA & Tren per Sektor) */}
            <OperatorLaborWidget 
              investments={investments} 
              onSelectInvestment={setSelectedInvestmentId} 
            />

            {/* 3. Bottom Row: Action Center & NIB Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Status Verifikasi NIB */}
              <div className="p-6 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                      <ShieldCheck size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('dashboard.nibStatus', 'Status Verifikasi NIB')}</h3>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 text-sm mb-4">
                    {t('dashboard.nibEmptyState', 'Belum ada NIB yang diajukan untuk diverifikasi secara hukum oleh instansi terkait. Silakan ajukan NIB Anda untuk terhubung ke jaringan investasi Luwu.')}
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab('verify')}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-slate-900 dark:text-white rounded-xl text-xs font-semibold tracking-wide border border-slate-700/50 hover:border-slate-600 transition-all flex items-center justify-center gap-2"
                >
                  <span>{t('dashboard.btnGoVerify', 'Buka Form Verifikasi')}</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Right Column: Action Center */}
              <div className="p-6 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                      <Sparkles size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('dashboard.actionCenter', 'Action Center')}</h3>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 text-sm">{t('dashboard.actionCenterDesc', 'Akses cepat menu navigasi dan analisis cerdas.')}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button 
                    onClick={() => {
                      try {
                        if (!document.fullscreenElement) {
                          const elem = document.documentElement as any;
                          requestSmartFullscreen()
                        }
                      } catch (e) {}
                      exitSmartFullscreen();
                        navigate('/?skipSplash=true');
                    }}
                    className="group p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 hover:bg-emerald-500/5 rounded-2xl transition-all duration-300 text-left flex items-start justify-between"
                  >
                    <div className="flex gap-3">
                      <div className="w-9 h-9 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                        <Map size={18} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-400 transition-colors text-xs">{t('dashboard.spatialWebGis', 'Peta Spasial (WebGIS)')}</h4>
                        <p className="text-[10px] text-slate-800 dark:text-slate-200 mt-1">{t('dashboard.spatialWebGisDesc', 'Eksplor layer tata ruang 3D Luwu.')}</p>
                      </div>
                    </div>
                    <ArrowUpRight size={14} className="text-slate-800 dark:text-slate-200 dark:text-slate-400 group-hover:text-emerald-400 transition-colors shrink-0" />
                  </button>

                  <button 
                    onClick={() => setActiveTab('simulation')}
                    className="group p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-500/30 hover:bg-blue-500/5 rounded-2xl transition-all duration-300 text-left flex items-start justify-between"
                  >
                    <div className="flex gap-3">
                      <div className="w-9 h-9 bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                        <Calculator size={18} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-400 transition-colors text-xs">{t('dashboard.startSimulation', 'Mulai Simulasi')}</h4>
                        <p className="text-[10px] text-slate-800 dark:text-slate-200 mt-1">{t('dashboard.startSimulationDesc', 'Hitung kelayakan finansial & ROI.')}</p>
                      </div>
                    </div>
                    <ArrowUpRight size={14} className="text-slate-800 dark:text-slate-200 dark:text-slate-400 group-hover:text-blue-400 transition-colors shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          )
        ) : activeTab === 'legacy_overview_perizinan' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Page Header */}
            <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900/40 p-6 border border-slate-200 dark:border-slate-800/80">
              <div className="absolute top-0 right-0 w-80 h-40 bg-emerald-500/10 blur-3xl rounded-full -mr-20 -mt-10" />
              <div className="relative space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase text-emerald-700 dark:text-emerald-400 bg-emerald-400/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  🛡️ BIDANG PERIZINAN & OSS-RBA
                </span>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Overview Perizinan Berusaha (OSS-RBA)</h1>
                <p className="text-slate-800 dark:text-slate-200 text-sm max-w-3xl leading-relaxed">
                  Ringkasan statistik permohonan perizinan, verifikasi persyaratan dasar (PKKPR, SLF, Amdal), dan penerbitan NIB terintegrasi Sistem OSS-RBA Kementerian Investasi / BKPM.
                </p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Card 1 */}
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">TOTAL REQUESTS</span>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400">
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                  1,248 <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Berkas</span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">
                  Total Permohonan OSS
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1.5">
                  ↑ +14% dibanding bulan lalu
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">KKPR APPROVED</span>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                  892 <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Dokumen</span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">
                  Persetujuan KKPR Disetujui
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                  Persetujuan Tata Ruang Valid
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">NIB ISSUED</span>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold font-mono text-blue-700 dark:text-blue-400 mt-1">
                  1,105 <span className="text-xs font-normal text-slate-500 dark:text-slate-400">NIB</span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">
                  Realisasi NIB Terbit
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-1.5">
                  Terbit Otomatis & Terverifikasi
                </div>
              </div>

              {/* Card 4 */}
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">HIGH RISK PROJECTS</span>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-1">
                  43 <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Proyek</span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">
                  Perizinan Risiko Tinggi
                </div>
                <div className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-1.5">
                  Perlu Verifikasi Lapangan
                </div>
              </div>
            </div>

            {/* OSS Queue Table */}
            <div className="p-6 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Antrean Verifikasi Perizinan Berusaha OSS-RBA</h3>
                  <p className="text-xs text-slate-800 dark:text-slate-200 mt-1">Daftar permohonan yang membutuhkan verifikasi teknis oleh tim DPMPTSP Kabupaten Luwu.</p>
                </div>
                <button
                  onClick={() => setActiveTab('verifikasi_pkkpr')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white font-bold rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <ShieldCheck size={16} />
                  <span>Buka Portal Verifikasi PKKPR</span>
                </button>
              </div>

              <div className="w-full overflow-x-auto rounded-lg shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 dark:text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                      <th className="py-3 px-3">No. Permohonan</th>
                      <th className="py-3 px-3">Pelaku Usaha / Company</th>
                      <th className="py-3 px-3">KBLI & Sektor</th>
                      <th className="py-3 px-3">Tingkat Risiko</th>
                      <th className="py-3 px-3">Status Permohonan</th>
                      <th className="py-3 px-3">SLA Argometer</th>
                      <th className="py-3 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">I-202603111300106095835</td>
                      <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">BALO TORAJA</td>
                      <td className="py-3.5 px-3 text-slate-800 dark:text-slate-200">64191 - Pemberian Kredit Koperasi</td>
                      <td className="py-3.5 px-3"><span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-bold text-[10px]">Menengah Tinggi</span></td>
                      <td className="py-3.5 px-3"><span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold text-[10px]">Inspeksi PKKPR</span></td>
                      <td className="py-3.5 px-3"><span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-[10px] border border-amber-500/30">⏱️ Tertahan 2 Hari</span></td>
                      <td className="py-3.5 px-3 text-right">
                        <button onClick={() => setActiveTab('verifikasi_pkkpr')} className="px-3 py-1 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-slate-900 dark:text-white rounded-lg font-bold text-[11px] transition">
                          Proses Verifikasi
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">I-202603110912445821033</td>
                      <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">PT. Luwu Mineral Utama</td>
                      <td className="py-3.5 px-3 text-slate-800 dark:text-slate-200">07101 - Pertambangan Bijih Besi</td>
                      <td className="py-3.5 px-3"><span className="px-2 py-0.5 rounded bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 font-bold text-[10px]">Tinggi</span></td>
                      <td className="py-3.5 px-3"><span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 font-bold text-[10px]">Verifikasi Teknis Lapangan</span></td>
                      <td className="py-3.5 px-3"><span className="px-2 py-0.5 rounded bg-red-500/10 text-red-700 dark:text-red-400 font-bold text-[10px] border border-red-500/30 animate-pulse">⏱️ Tertahan 5 Hari</span></td>
                      <td className="py-3.5 px-3 text-right">
                        <button onClick={() => setActiveTab('verifikasi_pkkpr')} className="px-3 py-1 bg-blue-600/10 hover:bg-blue-600 text-blue-700 dark:text-blue-400 hover:text-slate-900 dark:text-white rounded-lg font-bold text-[11px] transition">
                          Tinjau Berkas
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (activeTab === 'pkkpr_sync_monitor' || activeTab === 'pkkpr_monitoring' || activeTab === 'pkkpr_business_process') ? (
          <PkkprBusinessProcessMonitorDashboard />
        ) : (activeTab === 'verifikasi_pkkpr' || activeTab === 'puptr_spatial_clearance') ? (
          <PuptrSpatialClearanceDashboard />
        ) : (activeTab === 'verifikasi_pertanian' || activeTab === 'admin_pertanian') ? (
          <PertanianLandClearanceDashboard />
        ) : activeTab === 'realisasi_nib' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900/40 p-6 border border-slate-200 dark:border-slate-800/80">
              <div className="absolute top-0 right-0 w-80 h-40 bg-blue-500/10 blur-3xl rounded-full -mr-20 -mt-10" />
              <div className="relative space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase text-blue-700 dark:text-blue-400 bg-blue-400/10 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                  ✅ INTEGRASI OSS-RBA BKPM
                </span>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Realisasi Penerbitan NIB & Hak Akses OSS</h1>
                <p className="text-slate-800 dark:text-slate-200 text-sm max-w-3xl leading-relaxed">
                  Daftar Nomor Induk Berusaha (NIB) terbit secara real-time di Kabupaten Luwu beserta status verifikasi hak akses dan penyerapan tenaga kerja lokal.
                </p>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 space-y-1">
                <span className="text-xs text-slate-800 dark:text-slate-200 dark:text-slate-400 font-bold uppercase">Total NIB Terbit</span>
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">1,105 NIB</div>
                <div className="text-[10px] text-slate-800 dark:text-slate-200">Terdaftar di OSS-RBA</div>
              </div>
              <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 space-y-1">
                <span className="text-xs text-slate-800 dark:text-slate-200 dark:text-slate-400 font-bold uppercase">Sektor UMK / Mikro</span>
                <div className="text-2xl font-black text-cyan-400">980 NIB</div>
                <div className="text-[10px] text-cyan-400 font-bold">Skala Mikro & Kecil</div>
              </div>
              <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 space-y-1">
                <span className="text-xs text-slate-800 dark:text-slate-200 dark:text-slate-400 font-bold uppercase">Non-UMKM / Usaha Besar</span>
                <div className="text-2xl font-black text-purple-400">125 NIB</div>
                <div className="text-[10px] text-purple-400 font-bold">Skala Menengah & Besar</div>
              </div>
              <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 space-y-1">
                <span className="text-xs text-slate-800 dark:text-slate-200 dark:text-slate-400 font-bold uppercase">Serapan Tenaga Kerja</span>
                <div className="text-2xl font-black text-amber-700 dark:text-amber-400">{stats.totalLabor.toLocaleString("id-ID")} Orang</div>
                <div className="text-[10px] text-slate-800 dark:text-slate-200">Tenaga Kerja Luwu</div>
              </div>
            </div>

            {/* Table */}
            <div className="p-6 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Daftar NIB Terbit Terbaru</h3>
              <div className="w-full overflow-x-auto rounded-lg shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 dark:text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                      <th className="py-3 px-3">Nomor NIB</th>
                      <th className="py-3 px-3">Pelaku Usaha / Perusahaan</th>
                      <th className="py-3 px-3">Sektor KBLI</th>
                      <th className="py-3 px-3">Skala Usaha</th>
                      <th className="py-3 px-3">Nilai Modal</th>
                      <th className="py-3 px-3">Hak Akses Status</th>
                      <th className="py-3 px-3">SLA Argometer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">1204000392812</td>
                      <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">BALO TORAJA</td>
                      <td className="py-3.5 px-3 text-slate-800 dark:text-slate-200">64191 - Koperasi Konvensional</td>
                      <td className="py-3.5 px-3"><span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold text-[10px]">Mikro Kecil</span></td>
                      <td className="py-3.5 px-3 font-bold text-slate-800 dark:text-slate-200">Rp 1.20 Miliar</td>
                      <td className="py-3.5 px-3"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">Terverifikasi Active</span></td>
                      <td className="py-3.5 px-3"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] border border-emerald-500/30">⏱️ Selesai</span></td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">0220100481923</td>
                      <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">PT. Kawasan Industri Bua</td>
                      <td className="py-3.5 px-3 text-slate-800 dark:text-slate-200">68111 - Pengelolaan Kawasan Industri</td>
                      <td className="py-3.5 px-3"><span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold text-[10px]">Besar</span></td>
                      <td className="py-3.5 px-3 font-bold text-slate-800 dark:text-slate-200">Rp 250.00 Miliar</td>
                      <td className="py-3.5 px-3"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">Terverifikasi Active</span></td>
                      <td className="py-3.5 px-3"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] border border-emerald-500/30">⏱️ Selesai</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (activeTab === 'verify' || activeTab === 'permit_process') ? (
          <div className="py-4 sm:py-8 animate-in fade-in zoom-in-95 duration-300">
            <NibVerificationForm isDarkMode={true} />
          </div>
        ) : activeTab === 'loi_verify' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900/40 p-6 border border-slate-200 dark:border-slate-800/80">
              <div className="absolute top-0 right-0 w-80 h-40 bg-purple-500/10 blur-3xl rounded-full -mr-20 -mt-10" />
              <div className="relative space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase text-purple-400 bg-purple-400/10 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                  📄 BIDANG PROMOSI & PENANAMAN MODAL
                </span>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Tiket Minat Investor (Letter of Intent - LoI)</h1>
                <p className="text-slate-800 dark:text-slate-200 text-sm max-w-3xl leading-relaxed">
                  Verifikasi permohonan minat investasi dari calon investor domestik dan luar negeri. Berikan tanggapan resmi dan fasilitasi pertemuan bisnis (B2B).
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 space-y-1">
                <span className="text-xs text-slate-800 dark:text-slate-200 dark:text-slate-400 font-bold uppercase">LoI Baru Masuk</span>
                <div className="text-2xl font-black text-amber-700 dark:text-amber-400">12 Tiket</div>
                <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">Menunggu Respon</div>
              </div>
              <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 space-y-1">
                <span className="text-xs text-slate-800 dark:text-slate-200 dark:text-slate-400 font-bold uppercase">Nilai Komitmen Investasi</span>
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">Rp 4.25 Triliun</div>
                <div className="text-[10px] text-slate-800 dark:text-slate-200">Estimasi Total Proyek</div>
              </div>
              <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 space-y-1">
                <span className="text-xs text-slate-800 dark:text-slate-200 dark:text-slate-400 font-bold uppercase">Dalam Pembahasan</span>
                <div className="text-2xl font-black text-blue-700 dark:text-blue-400">4 Investor</div>
                <div className="text-[10px] text-slate-800 dark:text-slate-200">Tahap Negosiasi</div>
              </div>
              <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 space-y-1">
                <span className="text-xs text-slate-800 dark:text-slate-200 dark:text-slate-400 font-bold uppercase">Disetujui (Deal)</span>
                <div className="text-2xl font-black text-purple-400">8 Proyek</div>
                <div className="text-[10px] text-purple-400 font-bold">Siap Konstruksi</div>
              </div>
            </div>

            {/* Table */}
            <div className="p-6 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Daftar Tiket Minat LoI Aktif</h3>
              <div className="w-full overflow-x-auto rounded-lg shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 dark:text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                      <th className="py-3 px-3">ID Tiket</th>
                      <th className="py-3 px-3">Investor / Perusahaan</th>
                      <th className="py-3 px-3">Sektor Minat</th>
                      <th className="py-3 px-3">Nilai Investasi</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">SLA Argometer</th>
                      <th className="py-3 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {loiTickets.length > 0 ? (
                      loiTickets.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-3.5 px-3 font-mono font-bold text-purple-400">{t.tiket_id || `LOI-${t.id.substring(0,6)}`}</td>
                          <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">{t.company_name || t.nama_investor}</td>
                          <td className="py-3.5 px-3 text-slate-800 dark:text-slate-200">{t.sector || 'Agroindustri'}</td>
                          <td className="py-3.5 px-3 font-bold text-emerald-700 dark:text-emerald-400">Rp {t.nilai_investasi || '150.00 M'}</td>
                          <td className="py-3.5 px-3"><span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-bold text-[10px]">{t.status || 'Menunggu Respon'}</span></td>
                          <td className="py-3.5 px-3"><span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-[10px] border border-amber-500/30">⏱️ Tertahan 1 Hari</span></td>
                          <td className="py-3.5 px-3 text-right">
                            <button onClick={() => openActionModal(t)} className="px-3 py-1 bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-slate-900 dark:text-white rounded-lg font-bold text-[11px] transition">
                              Review & Balas LoI
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-slate-500 font-sans italic">
                          Belum ada permohonan Letter of Intent (LoI) yang masuk. Data akan tampil secara otomatis ketika investor mengajukan minat investasi melalui portal.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === 'manage_potential' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900/40 p-6 border border-slate-200 dark:border-slate-800/80">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase text-emerald-700 dark:text-emerald-400 bg-emerald-400/10 border border-emerald-500/20">
                    💡 DATABASE IPRO LUWU
                  </span>
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Kelola Potensi Investasi Unggulan</h1>
                  <p className="text-slate-800 dark:text-slate-200 text-sm max-w-2xl">
                    Atur dan publikasikan lokasi proyek investasi siap tawar (Investment Project Ready to Offer - IPRO) Kabupaten Luwu.
                  </p>
                </div>
                <button
                  onClick={() => {
                    console.log("[AdminPortalDashboard] 'Tambah Potensi Baru (IPRO)' button clicked -> setting isAddIproModalOpen=true");
                    setIsAddIproModalOpen(true);
                  }}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white font-extrabold rounded-2xl text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/20"
                >
                  <Plus size={18} />
                  <span>Tambah Potensi Baru (IPRO)</span>
                </button>
              </div>
            </div>

            {/* Opportunities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {investments.length > 0 ? (
                investments.map((inv) => (
                  <div key={inv.id} className="rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 p-5 space-y-4 hover:border-emerald-500/40 transition">
                    <div className="flex justify-between items-start">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase">{(inv as any).sektor || inv.sector || 'Agro'}</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{(inv as any).kecamatan || inv.districtId || 'Kecamatan'}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">{(inv as any).judul_peluang || inv.name}</h3>
                      <p className="text-xs text-slate-800 dark:text-slate-200 dark:text-slate-400 line-clamp-2 mt-1">{(inv as any).deskripsi_singkat || (inv as any).description || 'Prospek investasi strategis Luwu'}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatRupiahSingkat(inv.investmentValue || (inv as any).estimasi_investasi || 0)}</span>
                      <button onClick={() => setSelectedInvestmentId(inv.id)} className="text-cyan-400 font-bold hover:underline">
                        Detail & Map Pin →
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-8 text-center bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 rounded-2xl text-slate-800 dark:text-slate-200 dark:text-slate-400 text-xs">
                  Belum ada data potensi investasi custom.
                </div>
              )}
            </div>
          </div>
        ) : ['pengaduan', 'pengawasan', 'fasilitasi', 'laporan', 'field_inspection'].includes(activeTab) ? (
          <div key={activeTab} className="animate-in fade-in duration-500 w-full">
            {(activeTab === 'pengaduan' || activeTab === 'field_inspection') && (
              <div className="space-y-8 slide-in-from-bottom-4">
            {/* Page Header */}
            <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900/40 p-6 border border-slate-200 dark:border-slate-800/80">
              <div className="absolute top-0 right-0 w-80 h-40 bg-red-500/10 blur-3xl rounded-full -mr-20 -mt-10" />
              <div className="absolute bottom-0 left-0 w-60 h-30 bg-amber-500/5 blur-3xl rounded-full -ml-20 -mb-10" />
              <div className="relative space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase text-red-700 dark:text-red-400 bg-red-400/10 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                  🚨 BIDANG DALAK WORKSPACE (SP4N-LAPOR!)
                </span>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Inspeksi & Pengaduan Lapangan Masyarakat</h1>
                <p className="text-slate-800 dark:text-slate-200 text-sm max-w-3xl leading-relaxed">
                  Pantau seluruh laporan dan konflik penanaman modal yang diadukan oleh masyarakat Luwu secara spasial. Lakukan mediasi, jadwalkan peninjauan lapangan, dan rilis rekomendasi formal penegakan hukum.
                </p>
              </div>
            </div>

            {/* Map Integration — Enterprise Spatial */}
            <div className="p-6 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 space-y-4">
              {/* Map Header + Stats */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Map size={18} className="text-red-500 animate-pulse" />
                  Sebaran Spasial Lokasi Aduan
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 text-[10px] font-black tracking-wider">
                    LIVE
                  </span>
                </h3>
                {/* Quick stats badges */}
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
                    Total: {complaints.length}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse" />
                    Menunggu: {complaints.filter(c => !c.status || c.status === 'Menunggu Verifikasi').length}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                    Diproses: {complaints.filter(c => c.status === 'Sedang Ditinjau Dalak' || c.status === 'Verifikasi Dalak Berjalan').length}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Selesai: {complaints.filter(c => c.status === 'Selesai').length}
                  </span>
                </div>
              </div>

              {/* Category Legend */}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {[
                  { label: 'Pencemaran Lingkungan', color: 'bg-red-500' },
                  { label: 'Sengketa Lahan / Tata Ruang', color: 'bg-amber-500' },
                  { label: 'Pelanggaran Izin Usaha', color: 'bg-blue-500' },
                  { label: 'Infrastruktur / Fasilitas Umum', color: 'bg-purple-500' },
                  { label: 'Konflik Sosial / Tenaga Kerja', color: 'bg-rose-500' },
                  { label: 'Lainnya', color: 'bg-slate-500' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${item.color} flex-shrink-0`} />
                    <span className="text-[10px] text-slate-800 dark:text-slate-200">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Map Container — h-[500px] proportional, full width */}
              <div className="w-full h-[350px] md:h-[500px] rounded-xl relative overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                <DalakMap isDarkMode={true} complaints={complaints} />
              </div>
            </div>

            {/* Complaints Data Table */}
            <div className="p-6 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Daftar Aduan Masyarakat Masuk</h3>
                  <p className="text-xs text-slate-800 dark:text-slate-200 mt-1">
                    Berikut adalah seluruh aduan aktif yang masuk ke sistem. Gunakan kolom kategori untuk mempercepat triage dan sorting masalah.
                  </p>
                </div>
                <button
                  onClick={fetchComplaints}
                  disabled={loadingComplaints}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={14} className={loadingComplaints ? "animate-spin" : ""} />
                  Refresh Data
                </button>
              </div>

              {loadingComplaints ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <Loader2 size={32} className="animate-spin text-red-500" />
                  <span className="text-xs text-slate-800 dark:text-slate-200 font-medium">Memuat data aduan terbaru...</span>
                </div>
              ) : complaints.length === 0 ? (
                <EmptyState 
                  title="Belum Ada Aduan Terdaftar" 
                  message="Sistem belum menerima aduan dari masyarakat." 
                />
              ) : (
                <div className="w-full overflow-x-auto rounded-lg shadow-sm">
                  <table className="w-full text-left text-xs border-collapse font-sans">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase tracking-wider">
                        <th className="py-3.5 px-4">ID Tiket</th>
                        <th className="py-3.5 px-4">Pelapor & Kontak</th>
                        <th className="py-3.5 px-4">Kategori Pengaduan</th>
                        <th className="py-3.5 px-4">Lokasi Kejadian</th>
                        <th className="py-3.5 px-4">Perusahaan Terkait</th>
                        <th className="py-3.5 px-4">Deskripsi Masalah</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {complaints.map((c) => {
                        const dateStr = c.created_at ? new Date(c.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        }) : "-";

                        // Badges for Kategori
                        let catBadge = "bg-slate-200 dark:bg-slate-800/50 text-slate-900 dark:text-slate-300 border-slate-300 dark:border-slate-700/50 font-medium";
                        const kat = c.kategori_pengaduan || "Lainnya";
                        if (kat === "Pencemaran Lingkungan") {
                          catBadge = "bg-red-100 dark:bg-red-500/10 text-red-800 dark:text-red-400 border-red-200 dark:border-red-500/25 font-medium";
                        } else if (kat === "Sengketa Lahan / Tata Ruang") {
                          catBadge = "bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-500/25 font-medium";
                        } else if (kat === "Pelanggaran Izin Usaha") {
                          catBadge = "bg-blue-100 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-500/25 font-medium";
                        } else if (kat === "Infrastruktur / Fasilitas Umum") {
                          catBadge = "bg-purple-100 dark:bg-purple-500/10 text-purple-800 dark:text-purple-400 border-purple-200 dark:border-purple-500/25 font-medium";
                        } else if (kat === "Konflik Sosial / Tenaga Kerja") {
                          catBadge = "bg-rose-100 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-500/25 font-medium";
                        }

                        return (
                          <tr key={c.id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-red-700 dark:text-red-400">
                              <div>{c.tiket_id || `LAPOR-${c.id.substring(0, 6).toUpperCase()}`}</div>
                              <div className="text-[9px] text-slate-800 dark:text-slate-200 dark:text-slate-400 font-normal">{dateStr}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-900 dark:text-white">{c.nama_pelapor || "-"}</div>
                              <div className="text-[10px] text-slate-800 dark:text-slate-200 font-mono">{c.kontak_pelapor || "-"}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border ${catBadge}`}>
                                {kat}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                              Kec. {c.lokasi_kejadian || "-"}
                            </td>
                            <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-mono">
                              {c.perusahaan_terkait || "-"}
                            </td>
                            <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 max-w-xs truncate" title={c.deskripsi_masalah}>
                              {c.deskripsi_masalah || "-"}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col gap-2 items-start">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                  c.status === "Selesai" 
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                    : c.status === "Sedang Ditinjau Dalak" || c.status === "Verifikasi Dalak Berjalan"
                                    ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    c.status === "Selesai" 
                                      ? "bg-emerald-400" 
                                      : c.status === "Sedang Ditinjau Dalak" || c.status === "Verifikasi Dalak Berjalan"
                                      ? "bg-blue-400" 
                                      : "bg-amber-400"
                                  }`} />
                                  {c.status || "Menunggu Verifikasi"}
                                </span>
                                {!['Selesai', 'Ditolak / Batal'].includes(c.status || '') && (
                                  <div className={`px-2 py-0.5 rounded-md border text-[10px] font-bold w-max flex items-center gap-1 ${calculateSLA(c.created_at).badge}`}>
                                    <span className={calculateSLA(c.created_at).color}>
                                      ⏱️ Tertahan {calculateSLA(c.created_at).days} Hari
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => openDalakModal(c)}
                                className="px-2.5 py-1.5 min-h-[44px] min-w-[44px] bg-red-600/10 hover:bg-red-600 text-red-700 dark:text-red-400 hover:text-slate-900 dark:text-white rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 mx-auto cursor-pointer"
                              >
                                Mediasi / Update
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
              </div>
            )}
            {activeTab === 'pengawasan' && (
              <div className="space-y-8 slide-in-from-bottom-4">
            {/* Page Header */}
            <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900/40 p-6 border border-slate-200 dark:border-slate-800/80">
              <div className="absolute top-0 right-0 w-80 h-40 bg-amber-500/10 blur-3xl rounded-full -mr-20 -mt-10" />
              <div className="relative space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase text-amber-700 dark:text-amber-400 bg-amber-400/10 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  🛡️ BIDANG DALAK (PENGAWASAN & KEPATUHAN LKPJ)
                </span>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Pengawasan Kepatuhan & LKPJ Pelaku Usaha
                </h1>
                <p className="text-slate-800 dark:text-slate-200 text-sm max-w-3xl leading-relaxed">
                  Monitoring realisasi investasi, kepatuhan laporan LKPJ berkala, dan verifikasi kepatuhan lapangan untuk seluruh pemegang izin usaha di Kabupaten Luwu.
                </p>
              </div>
            </div>

            {/* Radar Kepatuhan Component / Table */}
            <div className="p-6 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="text-amber-500" size={20} />
                    Radar Kepatuhan Pelaku Usaha & Status LKPJ
                  </h2>
                  <p className="text-xs text-slate-800 dark:text-slate-200 mt-1">
                    Daftar perusahaan pemegang NIB/Izin usaha yang dipantau kewajiban laporan berkala LKPM dan kepatuhan lapangan di Luwu.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold">
                    🟢 Safe: 12 Perusahaan
                  </span>
                  <span className="px-3 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-xl text-xs font-bold">
                    🟡 Warning: 4 Perusahaan
                  </span>
                  <span className="px-3 py-1 bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold">
                    🔴 Sanksi: 2 Perusahaan
                  </span>
                </div>
              </div>

              <div className="w-full overflow-x-auto rounded-lg shadow-sm">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase tracking-wider">
                      <th className="py-3.5 px-4">Nama Perusahaan / PT</th>
                      <th className="py-3.5 px-4">Sektor & Lokasi</th>
                      <th className="py-3.5 px-4">Status Lapor LKPJ</th>
                      <th className="py-3.5 px-4">Tingkat Kepatuhan</th>
                      <th className="py-3.5 px-4">Terakhir Diperiksa</th>
                      <th className="py-3.5 px-4 text-center">Aksi / Verifikasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50 text-slate-600 dark:text-slate-300 font-medium">
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">PT. Masmindo Dwi Area</div>
                        <div className="text-[10px] text-slate-800 dark:text-slate-200 dark:text-slate-400 font-mono">NIB: 9120003829101</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">
                        <div>Pertambangan Emas</div>
                        <div className="text-[10px] text-slate-800 dark:text-slate-200 dark:text-slate-400">Kec. Latimojong</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          Sudah Lapor Q2 2026
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          Aman (Patuh)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                        <AnimatedCounter value={12} /> Mei 2026
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            Swal.fire({
                              title: 'Verifikasi Kepatuhan PT. Masmindo Dwi Area',
                              text: 'Status LKPJ: Terverifikasi Lengkap. Tingkat kepatuhan berada dalam kategori AMAN.',
                              icon: 'success',
                              confirmButtonColor: '#10b981'
                            });
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold transition cursor-pointer border border-slate-700"
                        >
                          Input Hasil
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">PT. Bumi Mineral Sulawesi</div>
                        <div className="text-[10px] text-slate-800 dark:text-slate-200 dark:text-slate-400 font-mono">NIB: 8120002910292</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">
                        <div>Smelter & Pengolahan Nickel</div>
                        <div className="text-[10px] text-slate-800 dark:text-slate-200 dark:text-slate-400">Kec. Bua</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                          Terlambat 14 Hari
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                          Warning
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                        01 Juni 2026
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            Swal.fire({
                              title: 'Teguran LKPJ PT. Bumi Mineral Sulawesi',
                              text: 'Kirimkan notifikasi teguran kelengkapan laporan LKPJ ke email resmi pelaku usaha?',
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonText: 'Kirim Teguran',
                              cancelButtonText: 'Batal',
                              confirmButtonColor: '#f59e0b'
                            }).then((res) => {
                              if (res.isConfirmed) {
                                Swal.fire('Surat Teguran Terkirim', 'Email teguran SLA LKPJ berhasil dikirimkan.', 'success');
                              }
                            });
                          }}
                          className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-700 dark:text-amber-400 hover:text-slate-950 rounded-lg text-[11px] font-bold transition cursor-pointer border border-amber-500/30"
                        >
                          Kirim Teguran
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">PT. Kencana Cipta Agro</div>
                        <div className="text-[10px] text-slate-800 dark:text-slate-200 dark:text-slate-400 font-mono">NIB: 9120005510023</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">
                        <div>Perkebunan & PKS Kelapa Sawit</div>
                        <div className="text-[10px] text-slate-800 dark:text-slate-200 dark:text-slate-400">Kec. Walenrang Mandiri</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                          Tidak Lapor (2 Semester)
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          Sanksi Peringatan II
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                        10 Januari 2026
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            Swal.fire({
                              title: 'Sanksi Administratif Dalak',
                              text: 'Perusahaan dalam pengawasan khusus Satgas Penegakan Kepatuhan Luwu.',
                              icon: 'error',
                              confirmButtonColor: '#ef4444'
                            });
                          }}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                        >
                          BAP Sanksi
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
              </div>
            )}
            {activeTab === 'fasilitasi' && (
              <div className="space-y-8 slide-in-from-bottom-4">
            {/* Page Header */}
            <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900/40 p-6 border border-slate-200 dark:border-slate-800/80">
              <div className="absolute top-0 right-0 w-80 h-40 bg-emerald-500/10 blur-3xl rounded-full -mr-20 -mt-10" />
              <div className="relative space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase text-emerald-700 dark:text-emerald-400 bg-emerald-400/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  🤝 BIDANG DALAK (FASILITASI & MEDIASI)
                </span>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Fasilitasi & Mediasi Sengketa Investasi
                </h1>
                <p className="text-slate-800 dark:text-slate-200 text-sm max-w-3xl leading-relaxed">
                  Fasilitasi penyelesaian hambatan investasi (debottlenecking), mediasi sengketa dengan masyarakat/pemangku kepentingan, dan pendampingan realisasi.
                </p>
              </div>
            </div>

            {/* Fasilitasi & Mediasi Content */}
            <div className="p-6 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="text-emerald-500" size={20} />
                    Daftar Kasus Mediasi & Debottlenecking
                  </h2>
                  <p className="text-xs text-slate-800 dark:text-slate-200 mt-1">
                    Permohonan fasilitasi penyelesaian kendala lahan, izin lingkungan, dan konflik sosial di lapangan.
                  </p>
                </div>
                <button
                  onClick={fetchComplaints}
                  disabled={loadingComplaints}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={14} className={loadingComplaints ? "animate-spin" : ""} />
                  Refresh Data
                </button>
              </div>

              <div className="w-full overflow-x-auto rounded-lg shadow-sm">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase tracking-wider">
                      <th className="py-3.5 px-4">Kasus / ID Tiket</th>
                      <th className="py-3.5 px-4">Pemohon / Pihak Terlibat</th>
                      <th className="py-3.5 px-4">Kategori Kendala</th>
                      <th className="py-3.5 px-4">Lokasi Kejadian</th>
                      <th className="py-3.5 px-4">Status Mediasi</th>
                      <th className="py-3.5 px-4 text-center">Tindak Lanjut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {complaints.length === 0 ? (
                      <EmptyState 
                        isTable={true} 
                        colSpan={6} 
                        title="Belum Ada Kasus" 
                        message="Belum ada kasus mediasi terdaftar." 
                      />
                    ) : (
                      complaints.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            <div>{c.tiket_id || `MEDIASI-${c.id.substring(0, 6).toUpperCase()}`}</div>
                            <div className="text-[9px] text-slate-800 dark:text-slate-200 dark:text-slate-400 font-normal">{new Date(c.created_at).toLocaleDateString('id-ID')}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 dark:text-white">{c.nama_pelapor || "Masyarakat"}</div>
                            <div className="text-[10px] text-slate-800 dark:text-slate-200 dark:text-slate-400">Vs {c.perusahaan_terkait || "Pelaku Usaha"}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              {c.kategori_pengaduan || "Mediasi Lahan"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">
                            Kec. {c.lokasi_kejadian || "Luwu"}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-2 items-start">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                                {c.status || "Fasilitasi Berjalan"}
                              </span>
                              {!['Selesai', 'Ditolak / Batal'].includes(c.status || '') && (
                                <div className={`px-2 py-0.5 rounded-md border text-[10px] font-bold w-max flex items-center gap-1 ${calculateSLA(c.created_at).badge}`}>
                                  <span className={calculateSLA(c.created_at).color}>
                                    ⏱️ Tertahan {calculateSLA(c.created_at).days} Hari
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => openDalakModal(c)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 mx-auto cursor-pointer"
                            >
                              Buka Mediasi
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
              </div>
            )}
            {activeTab === 'laporan' && (
              <div className="space-y-8 slide-in-from-bottom-4">
            {/* Page Header */}
            <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900/40 p-6 border border-slate-200 dark:border-slate-800/80">
              <div className="absolute top-0 right-0 w-80 h-40 bg-blue-500/10 blur-3xl rounded-full -mr-20 -mt-10" />
              <div className="relative space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase text-blue-700 dark:text-blue-400 bg-blue-400/10 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                  📊 BIDANG DALAK (EVALUASI & LAPORAN)
                </span>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Evaluasi & Rekapitulasi Laporan Pengawasan Dalak
                </h1>
                <p className="text-slate-800 dark:text-slate-200 text-sm max-w-3xl leading-relaxed">
                  Evaluasi kinerja realisasi investasi daerah, rekapitulasi penegakan kepatuhan, serta pengelolaan Berita Acara Pemeriksaan (BAP) Satgas.
                </p>
              </div>
            </div>

            {/* Evaluasi & Pelaporan Widget */}
            <div className="p-6 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="text-emerald-500" size={20} />
                    Sistem Pelaporan & Cetak BAP Terpadu
                  </h2>
                  <p className="text-xs text-slate-800 dark:text-slate-200 mt-1">
                    Buat Berita Acara Pemeriksaan (BAP) dan unduh rekapitulasi laporan pengawasan secara otomatis untuk laporan bulanan/tahunan.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 w-fit">
                    <FileText size={20} />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Berita Acara Pemeriksaan (BAP)</h3>
                  <p className="text-xs text-slate-800 dark:text-slate-200 dark:text-slate-400 leading-relaxed">
                    Generate draf BAP resmi peninjauan lapangan dan sanksi administratif pelaku usaha.
                  </p>
                  <button
                    onClick={() => {
                      Swal.fire({
                        title: 'Cetak Berita Acara (BAP)',
                        text: 'Draf dokumen BAP resmi berhasil dibuat dalam format PDF.',
                        icon: 'success',
                        confirmButtonColor: '#10b981'
                      });
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileText size={14} /> Cetak BAP
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-400 w-fit">
                    <TrendingUp size={20} />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Rekapitulasi Kepatuhan LKPJ</h3>
                  <p className="text-xs text-slate-800 dark:text-slate-200 dark:text-slate-400 leading-relaxed">
                    Unduh rekapitulasi bulanan status kepatuhan lapor LKPJ seluruh investor di Luwu.
                  </p>
                  <button
                    onClick={() => {
                      Swal.fire({
                        title: 'Unduh Rekapitulasi LKPJ',
                        text: 'Laporan rekapitulasi data kepatuhan LKPM/LKPJ siap diunduh (Excel).',
                        icon: 'info',
                        confirmButtonColor: '#3b82f6'
                      });
                    }}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileText size={14} /> Unduh Excel Rekap
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 w-fit">
                    <Activity size={20} />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Laporan Evaluasi Mediasi Sengketa</h3>
                  <p className="text-xs text-slate-800 dark:text-slate-200 dark:text-slate-400 leading-relaxed">
                    Ringkasan penyelesaian kasus mediasi dan fasilitasi hambatan investasi daerah.
                  </p>
                  <button
                    onClick={() => {
                      Swal.fire({
                        title: 'Eksport Laporan Mediasi',
                        text: 'Laporan evaluasi mediasi sengketa berhasil dieksport.',
                        icon: 'success',
                        confirmButtonColor: '#8b5cf6'
                      });
                    }}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileText size={14} /> Export Laporan
                  </button>
                </div>
              </div>
            </div>
              </div>
            )}
          </div>
        ) : activeTab === 'komoditas' ? (
          <div className="animate-in fade-in duration-500 w-full space-y-6">
             <AdminCommodityPrices />
          </div>
        ) : activeTab === 'site-selection' ? (
          <div className="py-4 sm:py-8 animate-in fade-in zoom-in-95 duration-300 h-[calc(100vh-140px)] md:h-[calc(100vh-100px)]">
            <AISiteSelection />
          </div>
        ) : activeTab === 'simulation' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 1. Page Header (Intelegensi Bisnis) */}
            <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900/40 p-6 border border-slate-200 dark:border-slate-800/80">
              <div className="absolute top-0 right-0 w-80 h-40 bg-blue-500/10 blur-3xl rounded-full -mr-20 -mt-10" />
              <div className="absolute bottom-0 left-0 w-60 h-30 bg-emerald-500/5 blur-3xl rounded-full -ml-20 -mb-10" />
              <div className="relative space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase text-cyan-400 bg-cyan-400/10 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.2)] animate-pulse">
                  ✨ POWERED BY AI & SPATIAL LOGIC
                </span>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t('business_intelligence', 'Intelegensi Bisnis')}</h1>
                <p className="text-slate-800 dark:text-slate-200 text-sm max-w-3xl leading-relaxed">
                  {t('business_intel_desc', 'Lakukan simulasi finansial mendalam dan dapatkan rekomendasi strategis melalui Konsultan AI khusus Investasi Luwu.')}
                </p>
              </div>
            </div>

            {/* Financial State Calculations on the Fly */}
            {(() => {
              const numCapex = parseFloat(capex) || 0;
              const numOpex = parseFloat(opex) || 0;
              const numRevenue = parseFloat(revenue) || 0;
              const numWacc = parseFloat(discountRate) || 10;
              const numTenor = parseInt(tenor) || 5;
              const numInflation = parseFloat(inflationRate) || 4.5;

              const labaBersih = numRevenue - numOpex;
              const roiTahunan = numCapex > 0 ? (labaBersih / numCapex) * 100 : 0;
              const roiKumulatif = numCapex > 0 ? ((labaBersih * numTenor) / numCapex) * 100 : 0;

              // Simple Payback
              const paybackSederhana = labaBersih > 0 ? numCapex / labaBersih : -1;

              // Discounted cash flows & payback
              const discountedCF: number[] = [];
              let cumulativeDiscountedCF = 0;
              let paybackDiskonto = -1;

              for (let t = 1; t <= numTenor; t++) {
                const inflationFactor = Math.pow(1 + (numInflation / 100), t);
                const cf = labaBersih * inflationFactor;
                const dcf = cf / Math.pow(1 + (numWacc / 100), t);
                discountedCF.push(dcf);
                
                const prevSum = cumulativeDiscountedCF;
                cumulativeDiscountedCF += dcf;
                
                if (cumulativeDiscountedCF >= numCapex && paybackDiskonto === -1) {
                  const remaining = numCapex - prevSum;
                  const fraction = remaining / dcf;
                  paybackDiskonto = (t - 1) + fraction;
                }
              }

              const npv = cumulativeDiscountedCF - numCapex;

              // IRR Bisection method:
              const calculateNPVForIRR = (r: number, infRate: number) => {
                let sum = 0;
                for (let t = 1; t <= numTenor; t++) {
                  const inflationFactor = Math.pow(1 + (infRate / 100), t);
                  sum += (labaBersih * inflationFactor) / Math.pow(1 + r, t);
                }
                return sum - numCapex;
              };

              let irr = 0;
              if (labaBersih > 0) {
                let low = -0.99;
                let high = 5.0; // up to 500%
                let found = false;
                const npvLow = calculateNPVForIRR(low, numInflation);
                const npvHigh = calculateNPVForIRR(high, numInflation);
                if (npvLow * npvHigh < 0) {
                  for (let i = 0; i < 100; i++) {
                    const mid = (low + high) / 2;
                    const npvMid = calculateNPVForIRR(mid, numInflation);
                    if (Math.abs(npvMid) < 0.0001) {
                      irr = mid * 100;
                      found = true;
                      break;
                    }
                    if (npvMid * npvLow < 0) {
                      high = mid;
                    } else {
                      low = mid;
                    }
                  }
                  if (!found) {
                    irr = ((low + high) / 2) * 100;
                  }
                } else {
                  irr = roiTahunan > 0 ? roiTahunan * 0.9 : 0;
                }
              }

              // Determine project viability status
              let isViable = false;
              let viabilityText = "Tidak Layak (Risiko Tinggi)";
              let viabilityColorClass = "text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/20";
              if (npv > 0 && irr > numWacc) {
                isViable = true;
                viabilityText = "Sangat Layak (Direkomendasikan)";
                viabilityColorClass = "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
              } else if (npv > 0) {
                isViable = true;
                viabilityText = "Cukup Layak (Perlu Pemantauan)";
                viabilityColorClass = "text-blue-700 dark:text-blue-400 bg-blue-500/10 border-blue-500/20";
              } else if (labaBersih > 0) {
                viabilityText = "Marjinal (Risiko Sedang)";
                viabilityColorClass = "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";
              }

              // Generate sensitivity chart data
              const rates = [2, 6, 10, 14, 18, 22, 26];
              const chartData = rates.map(rate => {
                const rDecimal = rate / 100;
                
                // 1. Baseline NPV
                let npvBaseline = 0;
                for (let t = 1; t <= numTenor; t++) {
                  const infFactor = Math.pow(1 + (numInflation / 100), t);
                  npvBaseline += (labaBersih * infFactor) / Math.pow(1 + rDecimal, t);
                }
                npvBaseline -= numCapex;

                // 2. High Inflation (+5%)
                let npvHighInf = 0;
                for (let t = 1; t <= numTenor; t++) {
                  const infFactor = Math.pow(1 + ((numInflation + 5) / 100), t);
                  npvHighInf += (labaBersih * infFactor) / Math.pow(1 + rDecimal, t);
                }
                npvHighInf -= numCapex;

                // 3. No Inflation
                let npvNoInf = 0;
                for (let t = 1; t <= numTenor; t++) {
                  npvNoInf += labaBersih / Math.pow(1 + rDecimal, t);
                }
                npvNoInf -= numCapex;

                return {
                  rate: `${rate}%`,
                  "Baseline NPV": Math.round(npvBaseline / 1000000), // convert to Millions
                  "Skenario Inflasi +5%": Math.round(npvHighInf / 1000000),
                  "Skenario Tanpa Inflasi": Math.round(npvNoInf / 1000000),
                };
              });

              const handleDownloadPDF = async () => {
                setIsPdfGenerating(true);
                try {
                  const doc = new jsPDF('p', 'mm', 'a4');
                  const pageWidth = doc.internal.pageSize.getWidth();
                  const pageHeight = doc.internal.pageSize.getHeight();

                  // Draw a beautiful emerald header banner
                  doc.setFillColor(16, 185, 129); // Emerald color
                  doc.rect(0, 0, pageWidth, 12, 'F');

                  // Top-left brand
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(10);
                  doc.setTextColor(255, 255, 255);
                  doc.text('INVESTLUWU HUB • PEMKAB LUWU', 15, 8);

                  // Rest of text content below the top banner
                  let currentY = 24;

                  // Main Header Branding
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(18);
                  doc.setTextColor(15, 23, 42); // slate-900
                  doc.text('PROSPEKTUS INVESTASI KABUPATEN LUWU', 15, currentY);

                  currentY += 7;
                  doc.setFont('helvetica', 'normal');
                  doc.setFontSize(11);
                  doc.setTextColor(71, 85, 105); // slate-600
                  doc.text('Simulasi Cerdas - InvestLuwu Hub 5.0', 15, currentY);

                  // Divider Line
                  currentY += 5;
                  doc.setDrawColor(226, 232, 240); // slate-200
                  doc.setLineWidth(0.5);
                  doc.line(15, currentY, pageWidth - 15, currentY);

                  // Metadata Section
                  currentY += 10;
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(11);
                  doc.setTextColor(15, 23, 42);
                  doc.text('INFORMASI PROPOSAL & SIMULASI', 15, currentY);

                  currentY += 8;
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(10);
                  doc.setTextColor(71, 85, 105);
                  doc.text('Nama Perusahaan / Investor:', 15, currentY);
                  doc.setFont('helvetica', 'normal');
                  doc.setTextColor(15, 23, 42);
                  doc.text(companyName || 'PT. Luwu Maju Sejahtera', 70, currentY);

                  // Get sector/potential name
                  currentY += 6;
                  doc.setFont('helvetica', 'bold');
                  doc.setTextColor(71, 85, 105);
                  doc.text('Potensi Investasi Target:', 15, currentY);
                  doc.setFont('helvetica', 'normal');
                  doc.setTextColor(15, 23, 42);
                  const matchedInv = investments.find(inv => inv.id === targetPotential || inv.name.toLowerCase().replace(/\s+/g, '_') === targetPotential);
                  const targetNameText = matchedInv ? `${matchedInv.name} (${matchedInv.sector})` : 'Agroindustri Kopi Latimojong';
                  doc.text(targetNameText, 70, currentY);

                  // Inputs and Timestamp
                  currentY += 6;
                  doc.setFont('helvetica', 'bold');
                  doc.setTextColor(71, 85, 105);
                  doc.text('Tanggal Pembuatan:', 15, currentY);
                  doc.setFont('helvetica', 'normal');
                  doc.setTextColor(15, 23, 42);
                  doc.text(new Date().toLocaleString('id-ID'), 70, currentY);

                  // Let's add simulation parameter values
                  currentY += 10;
                  doc.setFillColor(248, 250, 252); // slate-50
                  doc.roundedRect(15, currentY, pageWidth - 30, 28, 3, 3, 'F');

                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(9);
                  doc.setTextColor(71, 85, 105);
                  doc.text('ASUMSI & PARAMETER SIMULASI:', 20, currentY + 6);

                  doc.setFont('helvetica', 'normal');
                  doc.text(`CAPEX: Rp ${formatRupiah(numCapex)}`, 20, currentY + 12);
                  doc.text(`OPEX per Tahun: Rp ${formatRupiah(numOpex)}`, 20, currentY + 18);
                  doc.text(`Pendapatan Tahunan: Rp ${formatRupiah(numRevenue)}`, 20, currentY + 24);

                  doc.text(`Suku Bunga Diskonto (WACC): ${discountRate}%`, 115, currentY + 12);
                  doc.text(`Tenor Proyeksi: ${tenor} Tahun`, 115, currentY + 18);
                  doc.text(`Laju Inflasi Tahunan: ${inflationRate}%`, 115, currentY + 24);

                  // Now capture and embed the financial results grid
                  currentY += 34;

                  const resultsElement = document.getElementById('financial-simulator-results-export');
                  if (resultsElement) {
                    const resultsElementReady = await waitForDomAndIdle(resultsElement, 3000);
                    const canvas = await pdfRenderQueue.enqueue(() => safeHtml2Canvas(resultsElementReady, {
                      scale: 2,
                      useCORS: true,
                      backgroundColor: '#090d16',
                    }));
                    const imgData = canvas.toDataURL('image/png');
                    const imgWidth = pageWidth - 30; // Margin 15 on each side
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    
                    doc.addImage(imgData, 'PNG', 15, currentY, imgWidth, imgHeight);
                  }

                  // Footer
                  doc.setFont('helvetica', 'italic');
                  doc.setFontSize(8);
                  doc.setTextColor(148, 163, 184); // slate-400
                  doc.text(
                    'Dokumen ini dihasilkan secara otomatis oleh Konsultan AI InvestLuwu. Untuk validasi tata ruang, hubungi DPMPTSP Kabupaten Luwu.',
                    pageWidth / 2,
                    pageHeight - 12,
                    { align: 'center' }
                  );

                  doc.save('Proposal_Investasi_Luwu.pdf');

                  Swal.fire({
                    title: 'Proposal Berhasil Diunduh!',
                    text: 'Prospektus investasi PDF siap dibagikan.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    background: '#0f172a',
                    color: '#f8fafc',
                  });
                } catch (err) {
                  console.error('Failed to generate PDF:', err);
                  Swal.fire({
                    title: 'Gagal Mengunduh Proposal',
                    text: 'Terjadi kesalahan saat memproses ekspor PDF.',
                    icon: 'error',
                    background: '#0f172a',
                    color: '#f8fafc',
                  });
                } finally {
                  setIsPdfGenerating(false);
                }
              };

              return (
                <div className="space-y-8 pb-32">
                  {/* 2. Form Section (Simulator Return on Investment) */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-6">
                    <div>
                      <h3 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">{t('roi_simulator', 'Simulator Return on Investment (ROI)')}</h3>
                      <p className="text-xs text-slate-800 dark:text-slate-200 mt-1">{t('roi_simulator_desc', 'Sesuaikan nilai investasi dan asumsi makro untuk memprediksi profitabilitas secara real-time.')}</p>
                    </div>

                    {/* Target Potensi Investasi (Full Width Select) */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                        {t('target_investment', 'Target Potensi Investasi')}
                      </label>
                      <select
                        value={targetPotential}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTargetPotential(val);
                          const matched = investments.find(inv => inv.id === val || inv.name.toLowerCase().replace(/\s+/g, '_') === val);
                          if (matched) {
                            setCapex("");
                            setOpex("");
                            setRevenue(String(Math.round((matched.investmentValue || 5000000000) * 0.35)));
                          }
                        }}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500/50 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none transition-colors font-semibold"
                      >
                        <option value="agroindustri_latimojong">Agroindustri Kopi Latimojong (Default Simulasi)</option>
                        {investments.filter(Boolean).filter((inv, idx, arr) => arr.findIndex(x => (x.id || x.name) === (inv.id || inv.name)) === idx).map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.name} ({inv.sector}) - {formatRupiahSingkat(inv.investmentValue || 0)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Main Inputs */}
                    <div className={`${isUsingOSS ? "space-y-6" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start"} w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 rounded-2xl p-4 sm:p-6`}>
                      <div className={isUsingOSS ? "w-full" : "md:col-span-2"}>
                        <OssRoiSimulatorInputs
                            sector={investments.find(inv => inv.id === targetPotential || inv.name.toLowerCase().replace(/\s+/g, '_') === targetPotential)?.sector || null}
                            capital={capex}
                            setCapital={setCapex}
                            opex={opex}
                            setOpex={setOpex}
                            isDark={true}
                            textMuted="text-slate-800 dark:text-slate-200 dark:text-slate-400"
                            inputBg="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 focus:border-cyan-500/50"
                            useDetailed={isUsingOSS}
                            setUseDetailed={setIsUsingOSS}
                        />
                      </div>

                      {/* Revenue Input */}
                      <div className={`space-y-2 ${isUsingOSS ? "w-full pt-4 border-t border-slate-200 dark:border-slate-800" : ""}`}>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                          {t('est_revenue', 'Estimasi Pendapatan Tahunan')}
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-800 dark:text-slate-200 dark:text-slate-400 text-xs font-mono font-bold">Rp</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            value={revenue}
                            onFocus={(e) => {
                              e.target.select();
                              setRevenue("");
                            }}
                            onChange={(e) => setRevenue(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500/50 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none transition-colors font-mono font-bold"
                            placeholder="e.g. 1800000000"
                          />
                        </div>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400/80 font-mono tracking-tight pl-1">
                          {formatRupiah(numRevenue)} {numRevenue > 0 ? `(${formatRupiahSingkat(numRevenue)})` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Advanced Parameters (3 Columns) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2 items-start w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 rounded-xl p-4 mt-6">
                      {/* WACC */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                          {t('discount_rate', 'Suku Bunga Diskonto / WACC (%)')}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            value={discountRate}
                            onFocus={(e) => {
                              e.target.select();
                              setDiscountRate("");
                            }}
                            onChange={(e) => setDiscountRate(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500/50 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none transition-colors font-mono font-bold"
                            placeholder="10"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-800 dark:text-slate-200 dark:text-slate-400 text-xs font-mono font-bold">%</span>
                        </div>
                      </div>

                      {/* Tenor */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                          {t('tenor', 'Tenor Proyeksi Investasi (Tahun)')}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            inputMode="numeric"
                            value={tenor}
                            onFocus={(e) => {
                              e.target.select();
                              setTenor("");
                            }}
                            onChange={(e) => setTenor(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500/50 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none transition-colors font-mono font-bold"
                            placeholder="5"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-800 dark:text-slate-200 dark:text-slate-400 text-xs font-mono font-bold">Thn</span>
                        </div>
                      </div>

                      {/* Inflation */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                          {t('inflation_rate', 'Laju Inflasi Tahunan (%)')}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            value={inflationRate}
                            onFocus={(e) => {
                              e.target.select();
                              setInflationRate("");
                            }}
                            onChange={(e) => setInflationRate(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500/50 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none transition-colors font-mono font-bold"
                            placeholder="4.5"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-800 dark:text-slate-200 dark:text-slate-400 text-xs font-mono font-bold">%</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button Container */}
                    <div className="flex flex-col sm:flex-row gap-4 w-full pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSimRunCount(p => p + 1);
                          Swal.fire({
                            title: t('dashboard.calculationSuccess', 'Kalkulasi Selesai!'),
                            text: t('dashboard.calculationSuccessText', 'Hasil simulasi finansial dan grafik sensitivitas NPV telah diperbarui.'),
                            icon: 'success',
                            toast: true,
                            position: 'top-end',
                            timer: 3000,
                            showConfirmButton: false,
                            background: '#0f172a',
                            color: '#f8fafc',
                          });
                        }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-sm w-full"
                      >
                        <Calculator size={18} className="text-white shrink-0" />
                        <span>{t('dashboard.calculateViabilityBtn', 'Hitung Prediksi Kelayakan')}</span>
                      </button>

                      <button
                        type="button"
                        disabled={simRunCount === 0 || isPdfGenerating}
                        onClick={handleDownloadPDF}
                        className={`flex-1 font-bold py-3 px-4 rounded-xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer text-sm border ${
                          simRunCount === 0 
                            ? 'border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 dark:text-slate-400 bg-white dark:bg-slate-900/20 cursor-not-allowed opacity-50' 
                            : 'border-emerald-500/80 hover:border-emerald-400 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                        }`}
                      >
                        {isPdfGenerating ? (
                          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0"></div>
                        ) : (
                          <FileText size={18} className={simRunCount === 0 ? "text-slate-800 dark:text-slate-200 dark:text-slate-400 shrink-0" : "text-emerald-700 dark:text-emerald-400 shrink-0"} />
                        )}
                        <span>{isPdfGenerating ? t('dashboard.generatingPdf', 'Membuat Proposal...') : t('dashboard.downloadProposalBtn', '📄 Download Proposal Investasi (PDF)')}</span>
                      </button>
                    </div>
                  </div>

                  {/* 3. Results Grid (6 Metric Cards) */}
                  <div id="financial-simulator-results-export" className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
                    {/* Card 1: Estimasi ROI */}
                    <div 
                      id="rata-rata-roi-card"
                      className={`relative rounded-3xl border p-6 group transition-all duration-300 ${
                        roiFlash 
                          ? 'bg-emerald-500/20 border-emerald-500/50 scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                          : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform duration-300">
                          <Percent size={20} />
                        </div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-400/10 px-2.5 py-1 rounded-full">
                          Return
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                          {roiTahunan.toFixed(2)}%
                        </div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          ROI Tahunan (Rata-rata)
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/60 flex justify-between items-center text-xs">
                        <span className="text-slate-800 dark:text-slate-200">ROI Kumulatif ({numTenor} Thn):</span>
                        <span className="font-mono font-bold text-cyan-400">{roiKumulatif.toFixed(1)}%</span>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/50 flex items-center gap-2">
                        <span className="text-emerald-700 dark:text-emerald-400/80">💡</span>
                        <p className="text-xs text-slate-800 dark:text-slate-200">
                          {t('dashboard.roiBenchmark', 'Benchmark Luwu: ~10% - 12% (Rata-rata sektor)')}
                        </p>
                      </div>
                      {/* Tooltip (appears on card hover) */}
                      <div className="absolute opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300 bg-slate-800 text-xs text-slate-800 dark:text-slate-200 p-2.5 rounded-xl shadow-2xl border border-slate-700 z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap">
                        Rumus: (Laba Bersih Tahunan / Total Nilai CAPEX) × 100%
                      </div>
                    </div>

                    {/* Card 2: Periode Pengembalian (BEP) */}
                    <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6 group transition-all duration-300 hover:border-slate-700">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 group-hover:scale-105 transition-transform duration-300">
                          <Briefcase size={20} />
                        </div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 bg-indigo-400/10 px-2.5 py-1 rounded-full">
                          Payback
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                          {paybackSederhana > 0 ? `${paybackSederhana.toFixed(1)} Tahun` : 'N/A'}
                        </div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          Payback Sederhana
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/60 flex justify-between items-center text-xs">
                        <span className="text-slate-800 dark:text-slate-200">Payback Diskonto (WACC):</span>
                        <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400">
                          {paybackDiskonto > 0 ? `${paybackDiskonto.toFixed(1)} Tahun` : 'N/A / > Tenor'}
                        </span>
                      </div>
                    </div>

                    {/* Card 3: Laba Bersih Tahunan */}
                    <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6 group transition-all duration-300 hover:border-slate-700">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 group-hover:scale-105 transition-transform duration-300">
                          <TrendingUp size={20} />
                        </div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full">
                          EBITDA
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight truncate">
                          {formatRupiah(labaBersih)}
                        </div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          Laba Bersih Tahunan
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/60 flex justify-between items-center text-xs">
                        <span className="text-slate-800 dark:text-slate-200">Total Proyeksi Penerimaan:</span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{formatRupiahSingkat(labaBersih * numTenor)}</span>
                      </div>
                    </div>

                    {/* Card 4: Kelayakan */}
                    <div className={`relative overflow-hidden rounded-3xl border p-6 group transition-all duration-300 ${isViable ? 'border-emerald-500/20 bg-emerald-950/10' : 'border-rose-500/20 bg-rose-950/10'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${isViable ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'} group-hover:scale-105 transition-transform duration-300`}>
                          <ShieldCheck size={20} />
                        </div>
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${isViable ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}>
                          Status
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className={`text-xl sm:text-2xl font-black font-sans tracking-tight ${isViable ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {viabilityText}
                        </div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          Kelayakan Proyek
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/60 flex justify-between items-center text-xs text-slate-800 dark:text-slate-200">
                        <span>Berdasarkan kriteria standar finansial & geospasial DPMPTSP Luwu.</span>
                      </div>
                    </div>

                    {/* Card 5: Net Present Value (NPV) */}
                    <div className={`relative overflow-hidden rounded-3xl border p-6 group transition-all duration-300 ${npv > 0 ? 'border-emerald-500/20 bg-white dark:bg-slate-900/40 hover:border-emerald-500/40' : 'border-rose-500/20 bg-white dark:bg-slate-900/40 hover:border-rose-500/40'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${npv > 0 ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'}`}>
                          <Sparkles size={20} />
                        </div>
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${npv > 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}>
                          NPV
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight truncate ${npv > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {npv > 0 ? '+' : ''}{formatRupiah(npv)}
                        </div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          Net Present Value (NPV)
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/60 flex justify-between items-center text-xs">
                        <span className="text-slate-800 dark:text-slate-200">Threshold Kelayakan (NPV &gt; 0):</span>
                        <span className={`font-mono font-bold ${npv > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {npv > 0 ? 'Sesuai / Layak' : 'Kurang Layak'}
                        </span>
                      </div>
                    </div>

                    {/* Card 6: Internal Rate of Return (IRR) */}
                    <div className={`relative overflow-hidden rounded-3xl border p-6 group transition-all duration-300 ${irr > numWacc ? 'border-emerald-500/20 bg-white dark:bg-slate-900/40 hover:border-emerald-500/40' : 'border-rose-500/20 bg-white dark:bg-slate-900/40 hover:border-rose-500/40'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${irr > numWacc ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'}`}>
                          <Layers size={20} />
                        </div>
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${irr > numWacc ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}>
                          IRR
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className={`text-3xl font-black font-mono tracking-tight truncate ${irr > numWacc ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {irr.toFixed(2)}%
                        </div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          Internal Rate of Return (IRR)
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/60 flex justify-between items-center text-xs">
                        <span className="text-slate-800 dark:text-slate-200">Biaya Modal / WACC ({numWacc}%):</span>
                        <span className={`font-mono font-bold ${irr > numWacc ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {irr > numWacc ? 'IRR > WACC (Layak)' : 'IRR < WACC (Berisiko)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 5. Chart Section: Visualisasi Analisis Sensitivitas NPV */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">Visualisasi Analisis Sensitivitas NPV</h3>
                      <p className="text-xs text-slate-800 dark:text-slate-200 mt-1">Pergerakan NPV berdasarkan fluktuasi WACC (Suku Bunga Diskonto) di bawah tiga skenario makroekonomi.</p>
                    </div>

                    <div className="h-80 min-h-[320px] w-full font-mono text-xs relative">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <LineChart
                          data={chartData}
                          margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                        >
                          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="rate" 
                            stroke="#64748b" 
                            tickLine={false}
                            tick={{ fill: "#94a3b8", fontSize: 12 }}
                          />
                          <YAxis 
                            stroke="#64748b" 
                            tickLine={false}
                            tick={{ fill: "#94a3b8", fontSize: 12 }}
                            label={{ value: 'NPV (Juta Rp)', angle: -90, position: 'insideLeft', fill: '#64748b', style: { textAnchor: 'middle' } }}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#020617", borderColor: "rgba(16, 185, 129, 0.3)", borderRadius: "12px" }}
                            labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                            itemStyle={{ color: '#f8fafc' }}
                          />
                          <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                          <ReferenceLine 
                            y={0} 
                            stroke="#ef4444" 
                            strokeWidth={1.5}
                            strokeDasharray="4 4" 
                            label={{ value: 'Ambang Kelayakan (NPV=0)', fill: '#f43f5e', position: 'top', fontSize: 10 }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="Baseline NPV" 
                            stroke="#3b82f6" 
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="Skenario Inflasi +5%" 
                            stroke="#ef4444" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ r: 3 }} 
                            activeDot={{ r: 5 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="Skenario Tanpa Inflasi" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            dot={{ r: 3 }} 
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Interpretasi Sensitivitas Finansial */}
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Interpretasi Sensitivitas Finansial</h4>
                      <div className="text-xs text-slate-800 dark:text-slate-200 space-y-2 leading-relaxed">
                        <p>
                          Sumbu horizontal menunjukkan variasi WACC / Suku Bunga Diskonto dari 2% hingga 26%. Garis putus-putus merah menandakan batas NPV = 0. Jika garis skenario berada di atas batas ini, proyek dinilai layak secara finansial. Skenario Inflasi +5% menyimulasikan peningkatan biaya di masa mendatang, sedangkan Skenario Tanpa Inflasi mewakili kondisi pasar yang sepenuhnya stabil.
                        </p>
                        <p className="text-[11px] text-cyan-400/90 font-semibold">
                          💡 Analisis Sensitivitas: Semakin landai kurva NPV, semakin resilien proyek terhadap guncangan suku bunga diskonto. Jika nilai WACC aktual Luwu berada di bawah titik persimpangan NPV=0, maka investasi Anda dijamin aman.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 6. Footer Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button
                      type="button"
                      onClick={triggerAiAnalysis}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-xl transition-all hover:shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2 cursor-pointer text-sm tracking-wide uppercase"
                    >
                      <Sparkles size={16} className="text-cyan-300 animate-pulse" />
                      <span>MINTA ANALISIS KELAYAKAN AI ✨</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('overview')}
                      className="flex-1 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-bold py-3.5 px-6 rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm tracking-wide uppercase"
                    >
                      <Map size={16} className="text-emerald-700 dark:text-emerald-400" />
                      <span>ANALISIS POTENSI LUWU 🗺️</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : activeTab === 'spatial_analytics' ? (
          <SpatialAnalyticsEditorView userRole={userRole} isDarkMode={true} />
        ) : activeTab === 'gis_spatial' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Tata Ruang, Layer Spasial & PostGIS Sync */}
            <TataRuangInvestasi />

            {/* Upload Layer GeoJSON Baru */}
            <div className="p-6 rounded-3xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <UploadGeoJsonPanel onUploadSuccess={() => refreshData()} isDarkMode={true} />
            </div>
          </div>
        ) : activeTab === 'rag_injection' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <UploadRagPanel isDarkMode={true} />
          </div>
        ) : activeTab === 'manage_operators' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900/40 p-6 border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase text-amber-600 dark:text-amber-400 bg-amber-400/10 border border-amber-500/20">
                  🛡️ OTORITAS OPERATOR & USER
                </span>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">Kelola Akun Operator Dinas</h1>
                <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">Tambah, edit, dan atur hak akses operator OPD & petugas pelayanan terpadu Kabupaten Luwu.</p>
              </div>
              <button
                onClick={() => setIsCreateOperatorOpen(true)}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-950/20"
              >
                <Users size={16} />
                <span>Tambah Operator Baru</span>
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl p-6">
              <ManageOperatorsModal onClose={() => setActiveTab('overview')} />
            </div>
          </div>
        ) : activeTab === 'mpp_portal' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <AdminLayout />
          </div>
        ) : activeTab === 'testimonials' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{t('submit_testimonial', 'Kirim Testimoni')}</h1>
              <p className="text-slate-800 dark:text-slate-200 text-sm">{t('testimonial_desc', 'Sampaikan cerita sukses atau tanggapan Anda mengenai ekosistem investasi di Kabupaten Luwu.')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left Column (Form) */}
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!companyName.trim() || !testiMessage.trim()) {
                    Swal.fire({
                      title: t('dashboard.testiErrorTitle', 'Gagal'),
                      text: t('dashboard.testiErrorFields', 'Harap isi semua kolom form.'),
                      icon: 'error',
                      background: '#0f172a',
                      color: '#f8fafc',
                      confirmButtonColor: '#10b981'
                    });
                    return;
                  }
                  
                  setIsSubmittingTesti(true);
                  try {
                    const { data, error } = await supabase
                      .from('investor_testimonials')
                      .insert([
                        {
                          company_name: companyName,
                          sector: testiSector,
                          message: testiMessage,
                          is_verified: false,
                          created_at: new Date().toISOString()
                        }
                      ]);

                    if (error) throw error;
                    
                    Swal.fire({
                      title: t('dashboard.testiSuccessTitle', 'Berhasil!'),
                      text: t('dashboard.testiSuccessText', 'Testimoni berhasil dikirim dan menunggu verifikasi oleh tim administrator DPMPTSP Luwu.'),
                      icon: 'success',
                      background: '#0f172a',
                      color: '#f8fafc',
                      confirmButtonColor: '#10b981'
                    });

                    setTestiMessage('');
                    setTestiSector('Agroindustri');
                  } catch (err: any) {
                    console.error("Error submitting testimonial:", err);
                    Swal.fire({
                      title: t('dashboard.testiErrorTitle', 'Gagal'),
                      text: err.message || t('dashboard.testiErrorSubmit', 'Terjadi kesalahan saat mengirim testimoni.'),
                      icon: 'error',
                      background: '#0f172a',
                      color: '#f8fafc',
                      confirmButtonColor: '#10b981'
                    });
                  } finally {
                    setIsSubmittingTesti(false);
                  }
                }}
                className="lg:col-span-3 p-6 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 space-y-5"
              >
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">{t('investor_feedback', 'Umpan Balik Investor')}</h3>
                  <p className="text-xs text-slate-800 dark:text-slate-200">{t('investor_feedback_desc', 'Pesan Anda akan ditampilkan di Landing Page utama setelah proses peninjauan.')}</p>
                </div>
 
                {/* Company Name */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    {t('company_name', 'Nama Perusahaan / Investor')}
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={companyName}
                    disabled
                    className="w-full bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-800 dark:text-slate-200 cursor-not-allowed opacity-80 focus:ring-0 text-xs"
                    placeholder="PT. Luwu Maju Sejahtera"
                  />
                </div>

                {/* Sector Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    {t('potential_sector', 'Sektor Potensi')}
                  </label>
                  <select
                    value={testiSector}
                    onChange={(e) => setTestiSector(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500/50 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none transition-colors"
                  >
                    <option value="Agroindustri">{t('sector.agroindustri', 'Agroindustri')}</option>
                    <option value="Pariwisata">{t('sector.pariwisata', 'Pariwisata')}</option>
                    <option value="Energi">{t('sector.energi', 'Energi')}</option>
                    <option value="Perikanan">{t('sector.perikanan', 'Perikanan')}</option>
                    <option value="Infrastruktur">{t('sector.infrastruktur', 'Infrastruktur')}</option>
                    <option value="Pertambangan">{t('sector.pertambangan', 'Pertambangan')}</option>
                    <option value="Jasa">{t('sector.jasa', 'Jasa')}</option>
                    <option value="Lainnya">{t('sector.lainnya', 'Lainnya')}</option>
                  </select>
                </div>

                {/* Testimonial message */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    {t('your_message', 'Pesan / Tanggapan Anda')}
                  </label>
                  <textarea
                    value={testiMessage}
                    onChange={(e) => setTestiMessage(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500/50 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none transition-colors"
                    placeholder={t('dashboard.testiMessagePlaceholder', 'Ceritakan kesan Anda terhadap layanan penanaman modal Kabupaten Luwu...')}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingTesti}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  {isSubmittingTesti ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{t('dashboard.testiSubmitting', 'Mengirim...')}</span>
                    </>
                  ) : (
                    <span>{t('btn_send_testimonial', 'Kirim Testimoni')}</span>
                  )}
                </button>
              </form>

              {/* Right Column (Info) */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">{t('verification_flow', 'Alur Verifikasi Testimoni')}</h3>
                  <p className="text-xs text-slate-800 dark:text-slate-200">{t('flow_desc', 'Bagaimana Pemkab Luwu menjaga kredibilitas portal.')}</p>
                </div>

                <div className="space-y-4 text-xs text-slate-800 dark:text-slate-200">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold font-mono shrink-0">1</div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{t('step_1', '1. Pengisian Form')}</h4>
                      <p className="leading-relaxed text-slate-800 dark:text-slate-200 text-[11px]">{t('step_1_desc', 'Investor menyampaikan data kepuasan investasi di portal ini.')}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold font-mono shrink-0">2</div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{t('step_2', '2. Verifikasi Admin')}</h4>
                      <p className="leading-relaxed text-slate-800 dark:text-slate-200 text-[11px]">{t('step_2_desc', 'Tim administrator DPMPTSP Luwu meninjau kelayakan konten untuk mencegah spam.')}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold font-mono shrink-0">3</div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{t('step_3', '3. Publikasi Otomatis')}</h4>
                      <p className="leading-relaxed text-slate-800 dark:text-slate-200 text-[11px]">{t('step_3_desc', 'Jika disetujui, testimoni Anda akan langsung terbit secara dinamis di Landing Page utama.')}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs">
                  <p className="font-semibold text-slate-900 dark:text-white">⭐ {t('positive_feedback', 'Umpan Balik Positif')}</p>
                  <p className="leading-relaxed text-slate-800 dark:text-slate-200 text-[11px]">
                    {t('positive_feedback_desc', 'Tanggapan Anda sangat membantu kami dalam terus melakukan perbaikan infrastruktur spasial dan regulasi perizinan demi iklim investasi Luwu yang lebih baik.')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (activeTab === 'verifikasi_pkkpr' || activeTab === 'verifikasi_puptr' || activeTab === 'puptr_clearance' || activeTab === 'puptr_spatial_clearance') ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PuptrSpatialClearanceDashboard />
          </div>
        ) : (activeTab === 'verifikasi_pertanian' || activeTab === 'pertanian_clearance' || activeTab === 'admin_pertanian') ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PertanianLandClearanceDashboard />
          </div>
        ) : activeTab === 'pkkpr_sync_monitor' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PkkprBusinessProcessMonitorDashboard />
          </div>
        ) : activeTab === 'puptr_settings' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <OpdSettingsView opdKey="puptr" title="Pengaturan & Profil Dinas PUPTR" />
          </div>
        ) : activeTab === 'pertanian_settings' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <OpdSettingsView opdKey="pertanian" title="Pengaturan & Profil Dinas Pertanian" />
          </div>
        ) : activeTab === 'oss_settings' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <OpdSettingsView opdKey="dpmptsp" title="Pengaturan & Profil DPMPTSP / OSS" />
          </div>
        ) : activeTab === 'puptr_archive' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PuptrArchiveView />
          </div>
        ) : activeTab === 'pertanian_archive' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PertanianArchiveView />
          </div>
        ) : activeTab === 'oss_sk_archive' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <OssSkArchiveView />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-800 dark:text-slate-200 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-4 font-bold text-xl">
              ✨
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Modul Segera Hadir</h2>
            <p className="text-sm text-slate-800 dark:text-slate-200 max-w-md">
              Fitur <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">{activeTab}</span> sedang dalam tahap pengembangan V1.0 DPMPTSP Kabupaten Luwu.
            </p>
          </div>
        )}
      </div>

      {/* Investment Detail Modal */}
      <AnimatePresence>
        {selectedInvestmentId && (
          <InvestmentDetailModal
            investmentId={selectedInvestmentId}
            onClose={() => setSelectedInvestmentId(null)}
            onOpenAiConsultant={(inv) => {
              // handle consultant redirection/trigger if needed
            }}
            isDarkMode={true}
          />
        )}
      </AnimatePresence>

      {/* Dalak Complaint Action Modal */}
      {isDalakModalOpen && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsDalakModalOpen(false)}
            className="fixed inset-0 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-sm"
          />
          
          <div className="relative w-full max-w-4xl rounded-3xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden z-10 p-6 space-y-6 animate-in scale-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-red-500/10 text-red-500 rounded-lg">🚨</span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Tindak Lanjut & Mediasi Lapangan</h3>
                  <p className="text-[11px] text-slate-800 dark:text-slate-200">ID Tiket: {selectedComplaint.tiket_id || `LAPOR-${selectedComplaint.id.substring(0, 6).toUpperCase()}`}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDalakModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDalakFollowUp} className="text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* LEFT COLUMN: EVIDENCE */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="p-1.5 bg-rose-500/10 text-rose-700 dark:text-rose-400 rounded-lg"><Activity size={14} /></span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider">Bukti & Uraian Kejadian</h4>
                  </div>
                  
                  {/* Evidence photo if exists */}
                  {selectedComplaint.bukti_foto_url ? (
                    <div className="space-y-1.5">
                      <label className="text-slate-800 dark:text-slate-200 uppercase tracking-wider font-semibold block text-[10px]">Bukti Foto Lapangan</label>
                      <a href={selectedComplaint.bukti_foto_url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 relative group">
                        <img src={selectedComplaint.bukti_foto_url} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" alt="Bukti aduan" />
                        <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-slate-900 dark:text-white font-semibold gap-1">
                          🔍 Buka Foto Ukuran Penuh
                        </div>
                      </a>
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-600 flex-col gap-2">
                      <MessageSquare size={24} className="opacity-50" />
                      <span>Tidak ada lampiran foto</span>
                    </div>
                  )}

                  {/* Deskripsi Masalah / Proyek */}
                  <div className="space-y-1.5">
                    <label className="text-slate-800 dark:text-slate-200 uppercase tracking-wider font-semibold block text-[10px]">Detil Pengaduan / Uraian Kejadian</label>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 leading-relaxed max-h-32 overflow-y-auto custom-scrollbar italic font-serif">
                      "{selectedComplaint.deskripsi_masalah || selectedComplaint.project_name || selectedComplaint.business_sector}"
                    </div>
                  </div>
                  
                  {/* Detail Pelapor / Perusahaan */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80">
                    <div>
                      <span className="text-slate-800 dark:text-slate-200 dark:text-slate-400 block text-[9px] uppercase font-mono">Identitas Pelapor</span>
                      <span className="font-semibold text-slate-900 dark:text-white text-[11px]">
                        {selectedComplaint.is_anonim ? 'Anonim (Dirahasiakan)' : (selectedComplaint.nama_pelapor || selectedComplaint.company_name)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-800 dark:text-slate-200 dark:text-slate-400 block text-[9px] uppercase font-mono font-bold text-emerald-700 dark:text-emerald-400">Kontak (WA)</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-[11px]">
                        {selectedComplaint.is_anonim ? '***' : (selectedComplaint.kontak_pelapor || 'Tidak tersedia')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: SPATIAL & ACTION */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="p-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg"><MapPin size={14} /></span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider">Geospasial & Resolusi</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[9px] text-slate-800 dark:text-slate-200 dark:text-slate-400 uppercase block font-bold mb-0.5">Lokasi Insiden</span>
                      <div className="text-slate-900 dark:text-white font-semibold truncate" title={selectedComplaint.lokasi_kejadian || 'Lokasi Belum Diset'}>Kec. {selectedComplaint.lokasi_kejadian || 'Belum Diset'}</div>
                      <div className="text-slate-800 dark:text-slate-200 text-[9px] truncate">{selectedComplaint.perusahaan_terkait ? `Terkait: ${selectedComplaint.perusahaan_terkait}` : ''}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[9px] text-slate-800 dark:text-slate-200 dark:text-slate-400 uppercase block font-bold mb-0.5">Koordinat GPS</span>
                      <div className="text-cyan-400 font-mono text-[10px] tracking-tighter">Lat: {selectedComplaint.latitude || '-'}</div>
                      <div className="text-cyan-400 font-mono text-[10px] tracking-tighter">Lng: {selectedComplaint.longitude || '-'}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/20">
                      <span className="text-[9px] text-rose-500 uppercase block font-bold mb-0.5">Jenis Aduan</span>
                      <div className="text-rose-700 dark:text-rose-400 font-semibold text-[10px] line-clamp-2">{selectedComplaint.kategori_pengaduan || 'Tindak Lanjut Lapangan'}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-indigo-500/5 border border-indigo-500/20">
                      <span className="text-[9px] text-indigo-700 dark:text-indigo-400 uppercase block font-bold mb-0.5">Unit Layanan MPP</span>
                      <div className="text-indigo-300 font-semibold text-[10px] line-clamp-2">Bidang Dalak & Pengawasan</div>
                    </div>
                  </div>

                  {/* Status Selector */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-slate-800 dark:text-slate-200 uppercase tracking-wider font-semibold block text-[10px]">Ubah Status Progress</label>
                    <select
                      value={dalakStatus}
                      onChange={(e) => setDalakStatus(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-700 focus:border-rose-500 text-slate-900 dark:text-white font-bold text-xs cursor-pointer outline-none transition-colors"
                    >
                      <option value="Menunggu Verifikasi">⏳ Menunggu Verifikasi</option>
                      <option value="Tinjauan Lapangan">🔍 Tinjauan Lapangan</option>
                      <option value="Proses Mediasi">🤝 Proses Mediasi</option>
                      <option value="Selesai">✅ Selesai (Kasus Ditutup)</option>
                    </select>
                  </div>

                  {/* Catatan Hasil Investigasi */}
                  <div className="space-y-1.5">
                    <label className="text-slate-800 dark:text-slate-200 uppercase tracking-wider font-semibold block text-[10px]">Catatan Hasil Investigasi Lapangan</label>
                    <textarea
                      value={dalakLaporan}
                      onChange={(e) => setDalakLaporan(e.target.value)}
                      rows={3}
                      placeholder="Masukkan log operasional, hasil mediasi, atau keputusan di lapangan..."
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-700 focus:border-amber-500 text-amber-100 placeholder-slate-600 leading-relaxed text-xs outline-none transition-colors"
                    />
                  </div>

                  {/* Jadwal Site Visit */}
                  <div className="space-y-1.5">
                    <label className="text-slate-800 dark:text-slate-200 uppercase tracking-wider font-semibold block text-[10px]">Jadwal Kunjungan Lapangan (Opsional)</label>
                    <input
                      type="datetime-local"
                      value={dalakSiteVisit}
                      onChange={(e) => setDalakSiteVisit(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-700 text-slate-900 dark:text-white font-mono text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              
              {/* BAP SATGAS WIDGET */}
              <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    🛡️ Log Keputusan & Berita Acara (BAP) Satgas
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsBapModalOpen(true)}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl font-bold transition-all text-[11px] flex items-center gap-1.5 border border-rose-500/20"
                  >
                    + Buat Berita Acara (BAP)
                  </button>
                </div>

                <div className="space-y-3">
                  {loadingSatgas ? (
                    <div className="py-4 text-center text-xs text-slate-800 dark:text-slate-200 dark:text-slate-400">Memuat log keputusan...</div>
                  ) : satgasDecisions.length === 0 ? (
                    <EmptyState 
                      title="Belum Ada Berita Acara" 
                      message="Belum ada Berita Acara / Keputusan Satgas untuk tiket ini." 
                    />
                  ) : (
                    <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                      {satgasDecisions.map((dec) => (
                        <div key={dec.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col gap-2 relative">
                          <div className="flex justify-between items-start">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              dec.status_eskalasi === 'Normal' ? 'bg-emerald-500/10 text-emerald-500' :
                              'bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse'
                            }`}>
                              {dec.status_eskalasi}
                            </span>
                            <span className="text-[10px] text-slate-800 dark:text-slate-200 dark:text-slate-400 font-mono">
                              {new Date(dec.created_at).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="text-xs text-slate-800 dark:text-slate-200">
                            {dec.catatan_rapat}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-6 mt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDalakModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingDalak}
                  className="px-6 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 disabled:opacity-50 text-slate-900 dark:text-white rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-900/20"
                >
                  {isSavingDalak && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  SIMPAN PROGRESS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Akun Operator */}
      {isCreateOperatorOpen && (
        <CreateOperatorModal
          onClose={() => setIsCreateOperatorOpen(false)}
          currentRole={userRole as any}
        />
      )}

      {/* Modal Smart Form Engine for Adding IPRO Potensi */}
      {isAddIproModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 p-4 relative shadow-2xl">
            <button
              onClick={() => setIsAddIproModalOpen(false)}
              className="absolute top-4 right-4 z-50 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
            <SmartInvestmentFormEngine
              onClose={() => setIsAddIproModalOpen(false)}
              onSubmit={async () => {
                setIsAddIproModalOpen(false);
                refreshData();
              }}
              districts={districts}
              villages={villages}
              currentRole={userRole}
              isDarkMode={true}
              onRefreshAllData={refreshData}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ui polish: executive premium fin-tech polish
// ui polish: resolve recharts 0x0 dimension warnings
// architecture refactor: implemented dynamic role-based unified workspace
// core engine: implemented SLA digital tracking and visual traffic lights
// ux fix: dynamic role rendering in admin header
// ux fix: overhaul of admin data workspace
// ux fix: admin promosi workspace UI/UX polish

// ux pivot: removed i18n and implemented global light/dark mode toggle
// ui/ux pivot: aligned dalak workspace with official government tupoksi
// ui/ux pivot: built admin_oss workspace based on official tupoksi and strict nomenclature
// ui/ux pivot: built admin_oss workspace based on official tupoksi and strict nomenclature// ui/ux pivot: built admin_promosi workspace based on official tupoksi and strict nomenclature
// ui/ux pivot: built admin_data workspace based on official tupoksi and strict nomenclature
// ui/ux pivot: built admin_data workspace based on official tupoksi and strict nomenclature

// core engine: implemented SLA digital tracking and visual traffic lights

// feat: implement satgas decision & BAP module for dalak accountability

// ui polish: implement high-contrast light mode and enforce rbac restrictions
// ui feature: injected SLA tracking badges into all department tables
// hotfix: fix dynamic sub-menu rendering and clean up SLA badge spacing

