import { requestSmartFullscreen, exitSmartFullscreen } from "../../utils/fullscreen";
import { useNavigate, useLocation } from "react-router-dom";
import { AdminCommodityPrices } from './AdminCommodityPrices';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { motion, AnimatePresence } from 'motion/react';
import { OssRoiSimulatorInputs } from "../OssRoiSimulatorInputs";
import { useTranslation } from 'react-i18next';
import { generateHeuristicRoiAnalysis, formatHeuristicRoiMarkdown } from '../../hooks/useRoiCalculation';
import { getImageUrl, handleImageError } from '../../utils/imageFallbacks';
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
  Zap,
  Filter
, Users, Plus, PlusCircle, Globe, Info, CheckCircle, Database, Download, FileDown, Settings, BarChart3, BookOpen, Scale, Lightbulb, FileCheck, BookDown, Printer, Coins} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, Legend } from 'recharts';
import Swal from 'sweetalert2';
import { supabase } from '../../lib/supabaseClient';
import { Investment, SektorInvestasi, District } from '../../types.js';
import { SECTOR_COLORS } from '../../lib/constants.js';
import { formatRupiahSingkat, formatRupiah } from '../../lib/formatters.js';
import { InvestmentDetailModal } from '../InvestmentDetailModal.js';
import NibVerificationForm from '../Auth/NibVerificationForm.js';
import OpdSettingsView from './OpdSettingsView';
import PuptrArchiveView from './PuptrArchiveView';
import PertanianArchiveView from './PertanianArchiveView';
import OssSkArchiveView from './OssSkArchiveView';
import { OssPkkprIssuanceDashboard } from './OssPkkprIssuanceDashboard';
import PuptrSpatialClearanceDashboard from './PuptrSpatialClearanceDashboard';
import PertanianLandClearanceDashboard from './PertanianLandClearanceDashboard';
import AtrBpnLandClearanceDashboard from './AtrBpnLandClearanceDashboard';
import PkkprBusinessProcessMonitorDashboard from './PkkprBusinessProcessMonitorDashboard';
import InvestorPipelineWorkflowView from './InvestorPipelineWorkflowView';
import PertanianOverview from './PertanianOverview';
import { PertanianLp2bCatalogView } from './PertanianLp2bCatalogView';
import { PuptrSpatialCatalogView } from './PuptrSpatialCatalogView';
import PuptrOverview from './PuptrOverview';
import { LuwuLogo } from '../LuwuLogo.js';
import { CrossOpdNotificationBell } from '../CrossOpdNotificationBell';
import { addCrossOpdNotification } from '../../utils/crossOpdNotificationStore';
import { generateSkPkkprPdf } from '../../utils/skPkkprPdfGenerator';
import { PKKPRStatus, normalizePKKPRStatus } from '../../types/pkkprWorkflow';
import { checkLp2bIntersection } from '../../utils/lp2bSpatialService';
import ThemeToggle from '@/components/ThemeToggle';
import { EmptyState } from './EmptyState';
import { AnimatedCounter } from '../AnimatedCounter.js';
import LoadingScreen from '../LoadingScreen.js';
import jsPDF from "jspdf";
import { safeHtml2Canvas, pdfRenderQueue, waitForDomAndIdle } from "../../lib/html2canvasShim";
import { LUWU_LOGO_BASE64 } from "../../lib/logoBase64";
import { exportInvestmentProfileFromRecord, generateExecutivePortfolioPdf } from "../../services/PdfExportService";
import DalakMap from "./DalakMap";
import DalakWorkspaceView from "./DalakWorkspaceView";
import AISiteSelection from '../AISiteSelection.js';
import AdminSidebar, { isOperatorWorkspaceRole, getRoleShortBadge, getActiveMenuLabel } from './AdminSidebar.js';
import AdminMobileBottomNav from './AdminMobileBottomNav';
import UploadRagPanel from '../UploadRagPanel';
import ManageOperatorsModal from '../ManageOperatorsModal';
import CreateOperatorModal from '../CreateOperatorModal';
import FourBidangSyncWorkflowModal from './FourBidangSyncWorkflowModal';
import EstafetHandoverModal from './EstafetHandoverModal';
import EstafetProgressBanner from './EstafetProgressBanner';
import AdminLayout from '../Admin/AdminLayout';
import AdminUserManagement from '../Admin/Views/AdminUserManagement';
import { GRPArchitectureModal } from '../mpp/GRPArchitectureModal';
import { AdminKpbuManager } from './AdminKpbuManager';
import SmartInvestmentFormEngine from '../SmartInvestmentFormEngine';
import TataRuangInvestasi from '../Admin/Views/TataRuangInvestasi';
import UploadGeoJsonPanel from '../UploadGeoJsonPanel';
import { OperatorLaborWidget } from './OperatorLaborWidget';
import SpatialAnalyticsEditorView from './SpatialAnalyticsEditorView';
import PuptrSpatialEditorDashboard from './PuptrSpatialEditorDashboard';

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

interface AdminPortalDashboardProps {
  defaultTab?: string;
}

export default function AdminPortalDashboard({ defaultTab }: AdminPortalDashboardProps = {}) {
  const {
    investments = [],
    districts = [],
    villages = [],
    spatialLayers = {},
    setSpatialLayers = () => {},
    refreshData,
    loiCount = 0,
  } = useData();

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { return () => { exitSmartFullscreen(); }; }, []);

  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>(defaultTab || 'overview');

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
    const searchParams = new URLSearchParams(location.search || window.location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
      return;
    }

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
    else if (path.includes('verifikasi_pkkpr') || path.includes('puptr')) setActiveTab('verifikasi_pkkpr');
    else if (path.includes('verifikasi_pertanian') || path.includes('pertanian')) setActiveTab('verifikasi_pertanian');
    else if (path.includes('realisasi_nib') || path.includes('nib')) setActiveTab('realisasi_nib');
    else if (path.includes('spatial_editor') || path.includes('puptr_spatial_editor') || path.includes('spatial-editor') || path.includes('editor')) setActiveTab('puptr_spatial_editor');
    else if (path.includes('spatial_analytics') || path.includes('analytics')) setActiveTab('spatial_analytics');
    else if (path.includes('gis_spatial') || path.includes('gis')) setActiveTab('gis_spatial');
    else if (path.includes('overview_perizinan') || path.includes('perizinan')) setActiveTab('overview_perizinan');
    else if (path.includes('overview')) setActiveTab('overview');
  }, [location.pathname, location.search]);
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

  // Promosi KYC & Estafet Handover Modal States
  const [isSyncWorkflowModalOpen, setIsSyncWorkflowModalOpen] = useState(false);
  const [isEstafetModalOpen, setIsEstafetModalOpen] = useState(false);
  const [selectedEstafetTicket, setSelectedEstafetTicket] = useState<any | null>(null);
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

      if (error) {
        const errMsg = String(error.message || "").toLowerCase();
        const isSchemaMissingCol =
          error.code === "PGRST204" ||
          errMsg.includes("schema cache") ||
          errMsg.includes("jadwal_site_visit") ||
          errMsg.includes("laporan_dalak");

        if (!isSchemaMissingCol) throw error;

        const { error: statusOnlyErr } = await supabase
          .from("pengaduan")
          .update({ status: dalakStatus })
          .eq("id", selectedComplaint.id);

        if (statusOnlyErr) throw statusOnlyErr;

        const { data: existingSetting } = await supabase
          .from("site_settings")
          .select("setting_value")
          .eq("setting_key", "dalak_complaint_followups")
          .maybeSingle();

        let existingMap: Record<string, any> = {};
        if (existingSetting?.setting_value) {
          let parsed = existingSetting.setting_value;
          if (typeof parsed === "string") {
            try { parsed = JSON.parse(parsed); } catch {}
          }
          if (parsed && typeof parsed === "object") {
            existingMap = parsed;
          }
        }

        existingMap[String(selectedComplaint.id)] = {
          jadwal_site_visit: dalakSiteVisit || null,
          laporan_dalak: dalakLaporan || null,
          updated_at: new Date().toISOString(),
        };

        await supabase.from("site_settings").upsert(
          {
            setting_key: "dalak_complaint_followups",
            setting_value: existingMap,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "setting_key" }
        );
      }

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

  const handleEscalateLoiToPkkpr = async (ticket: any) => {
    if (!ticket) return;

    const investorName = ticket.company_name || ticket.nama_investor || ticket.investor_name || "Calon Investor";
    const potensiName = ticket.potensi_name || ticket.project_name || ticket.nama_proyek || "Potensi Investasi Unggulan Luwu";

    const confirmRes = await Swal.fire({
      title: "Ajukan Izin PKKPR Clean & Clear?",
      html: `
        <div class="text-left text-xs space-y-2">
          <p>Sistem Bidang Promosi akan mendaftarkan permohonan <strong>PKKPR Berusaha (Clean & Clear)</strong> secara resmi ke Tim Teknis Dinas PUPTR & Dinas Pertanian atas nama investor:</p>
          <div class="p-3 bg-slate-800 rounded-xl border border-slate-700 font-mono text-[11px] text-emerald-400">
            <div>🏢 Investor: <strong>${investorName}</strong></div>
            <div>💡 Potensi IPRO: <strong>${potensiName}</strong></div>
            <div>💰 Nilai Komitmen: <strong>Rp ${ticket.nilai_investasi ? (typeof ticket.nilai_investasi === 'number' ? ticket.nilai_investasi.toLocaleString('id-ID') : ticket.nilai_investasi) : '-'}</strong></div>
          </div>
          <p class="text-amber-300">Data spasial lokasi dan profil proyek akan diteruskan langsung ke antrean verifikasi tata ruang & LP2B.</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Ajukan PKKPR Sekarang",
      cancelButtonText: "Batal",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#64748b",
      background: "#0f172a",
      color: "#f8fafc"
    });

    if (!confirmRes.isConfirmed) return;

    setIsSavingKyc(true);
    try {
      // 1. Cari data potensi investasi terkait jika ada
      let matchedPotensi: any = null;
      if (ticket.investment_id) {
        const { data: potData } = await supabase
          .from("investments")
          .select("*")
          .eq("id", ticket.investment_id)
          .maybeSingle();
        matchedPotensi = potData;
      }

      if (!matchedPotensi && ticket.potensi_name) {
        const { data: potData } = await supabase
          .from("investments")
          .select("*")
          .ilike("name", `%${ticket.potensi_name}%`)
          .maybeSingle();
        matchedPotensi = potData;
      }

      const trackingCode = `PKKPR-LOI-${Date.now().toString().slice(-6)}`;
      const potGeom = matchedPotensi?.geometry || matchedPotensi?.geom || null;
      const isIntersectLP2B = potGeom ? await checkLp2bIntersection(potGeom) : false;
      const initialStatusPkkpr: PKKPRStatus = isIntersectLP2B ? 'VERIFIKASI_PERTANIAN' : 'BYPASS_PERTANIAN';
      const nowIso = new Date().toISOString();
      const pemohonName = ticket.investor_name || ticket.nama_investor || ticket.contact_person || investorName;
      const kecamatanVal = matchedPotensi?.districtId || matchedPotensi?.kecamatan || "Belopa";
      const desaVal = matchedPotensi?.villageId || matchedPotensi?.desa || "-";
      const luasHaVal = matchedPotensi?.areaHa ? Number(matchedPotensi.areaHa) : 5;
      const luasM2Val = luasHaVal * 10000;
      const iproRefTag = matchedPotensi?.id ? ` [Ref IPRO: ${matchedPotensi.id}]` : "";
      const catatanTeknisVal = `[No. Reg: ${trackingCode}]${iproRefTag} Fasilitasi Minat Investor (LoI #${ticket.tiket_id || ticket.id}) oleh Bidang Promosi DPMPTSP. Investor: ${investorName}. Potensi: ${potensiName}. ${isIntersectLP2B ? '[Beririsan LP2B - Eskalasi ke Pertanian]' : '[Smart Spatial Bypass: Bebas LP2B - Verifikasi PUPTR]'}`;

      const coreGisPkkprPayload: Record<string, any> = {
        id: trackingCode,
        jenis_permohonan: "Berusaha",
        nama_permohonan: `[Fasilitasi LoI] ${potensiName}`,
        nib_oss: ticket.nib || ticket.nib_oss || trackingCode,
        nama_badan_usaha: investorName,
        nama_pemohon: pemohonName,
        nik_pemohon: ticket.nik || "-",
        no_whatsapp: ticket.phone || ticket.whatsapp || ticket.no_hp || null,
        sektor: ticket.sector || ticket.sektor || matchedPotensi?.sector || "Agroindustri",
        kecamatan: kecamatanVal,
        desa_kelurahan: desaVal,
        luas_m2: luasM2Val,
        luas_ha: luasHaVal,
        geometry_json: potGeom,
        status_pkkpr: initialStatusPkkpr,
        catatan_teknis: catatanTeknisVal,
        created_at: nowIso,
        updated_at: nowIso
      };

      const extendedGisPayload: Record<string, any> = {
        ...coreGisPkkprPayload,
        nomor_permohonan: trackingCode,
        status_permohonan: isIntersectLP2B ? "ESCALATED_PERTANIAN" : "REVIEW_PUPTR",
        ...(kycCatatan ? { catatan_revisi: kycCatatan } : {})
      };

      // Masukkan ke pkkpr_permohonan (otomatis terekspos penuh di view gis_pkkpr & memicu trg_sync_pkkpr_geometry)
      let { data: pkkprInsert, error: pkkprErr } = await supabase
        .from("pkkpr_permohonan")
        .insert(extendedGisPayload)
        .select()
        .single();

      if (pkkprErr) {
        const retryRes = await supabase
          .from("pkkpr_permohonan")
          .insert(coreGisPkkprPayload)
          .select()
          .single();
        pkkprInsert = retryRes.data;
        pkkprErr = retryRes.error;
      }

      if (pkkprErr) {
        throw new Error(`Gagal mendaftarkan permohonan PKKPR: ${pkkprErr.message}`);
      }

      // Update status tiket LoI di investment_interests
      const { error: loiErr } = await supabase
        .from("investment_interests")
        .update({
          status: "PKKPR Diajukan ke PUPTR & Pertanian",
          catatan_admin: `PKKPR Clean & Clear telah didaftarkan (#${trackingCode}) untuk proses verifikasi tata ruang. ${kycCatatan || ''}`.trim()
        })
        .eq("id", ticket.id);

      if (loiErr) console.warn("Update LOI warning:", loiErr);

      // Notifikasi Cross-OPD ke PUPTR & Pertanian
      try {
        addCrossOpdNotification({
          fromRole: "ADMIN_DPMPTSP",
          targetRole: "ADMIN_PUPTR",
          type: "NEW_SUBMISSION",
          title: `Fasilitasi LoI: Pengajuan PKKPR ${investorName}`,
          message: `Bidang Promosi mengajukan telaah tata ruang Clean & Clear untuk potensi ${potensiName} yang diminati investor ${investorName}.`,
          applicationId: pkkprInsert?.id || trackingCode,
          applicantName: investorName || 'Pemohon LOI',
          companyName: investorName || 'Badan Usaha LOI',
          sector: 'Fasilitasi LOI',
          districtName: 'Kabupaten Luwu',
          villageName: 'Luwu'
        });
      } catch (e) {
        console.warn("Notification send warning:", e);
      }

      Swal.fire({
        title: "Izin PKKPR Berhasil Diajukan!",
        html: `
          <div class="text-left text-xs space-y-2">
            <p>Permohonan izin PKKPR Clean & Clear telah berhasil diterbitkan dan masuk ke antrean verifikasi:</p>
            <div class="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-emerald-300 font-mono">
              <div>📄 No. Registrasi: <strong>${trackingCode}</strong></div>
              <div>🏛️ Antrean Teknis: <strong>Dinas PUPTR (Tata Ruang) & Dinas Pertanian (LP2B)</strong></div>
              <div>⚡ Status: <strong>VERIFIKASI_PUPTR</strong></div>
            </div>
            <p class="text-slate-300">Tim teknis OPD terkait telah menerima notifikasi permohonan prioritas ini.</p>
          </div>
        `,
        icon: "success",
        background: "#0f172a",
        color: "#f8fafc",
        confirmButtonColor: "#10b981"
      });

      setIsKycModalOpen(false);
      fetchLoiTickets();
      if (refreshData) refreshData();
    } catch (err: any) {
      console.error("Gagal mengajukan PKKPR dari LoI:", err);
      Swal.fire({
        title: "Gagal Mengajukan PKKPR",
        text: err.message || "Terjadi kesalahan sistem saat mendaftarkan izin.",
        icon: "error",
        background: "#0f172a",
        color: "#f8fafc"
      });
    } finally {
      setIsSavingKyc(false);
    }
  };

  const handleProactivePkkprForPotensi = async (inv: any) => {
    if (!inv) return;
    const potName = (inv as any).judul_peluang || inv.name || "Potensi Investasi";

    const confirmRes = await Swal.fire({
      title: "Sertifikasi Clean & Clear (PKKPR IPRO)?",
      html: `
        <div class="text-left text-xs space-y-2">
          <p>Daftarkan telaah tata ruang dan status kesesuaian lahan secara proaktif untuk potensi ini ke Dinas PUPTR & Dinas Pertanian:</p>
          <div class="p-3 bg-slate-800 rounded-xl border border-slate-700 font-mono text-[11px] text-emerald-400">
            <div>💡 Nama Potensi: <strong>${potName}</strong></div>
            <div>📍 Lokasi: <strong>Kec. ${(inv as any).kecamatan || inv.districtId || '-'}</strong></div>
            <div>📐 Luas: <strong>${(inv as any).luas_lahan_ha || inv.areaHa || 0} Ha</strong></div>
          </div>
          <p class="text-amber-300">Hasil telaah akan menjadi dokumen kesiapan investasi Clean & Clear resmi Pemkab Luwu.</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Ajukan Telaah Clean & Clear",
      cancelButtonText: "Batal",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#64748b",
      background: "#0f172a",
      color: "#f8fafc"
    });

    if (!confirmRes.isConfirmed) return;

    try {
      const trackingCode = `PKKPR-IPRO-${Date.now().toString().slice(-6)}`;
      const potGeom = (inv as any)?.geometry || (inv as any)?.geom || null;
      const isIntersectLP2B = potGeom ? await checkLp2bIntersection(potGeom) : false;
      const initialStatusPkkpr: PKKPRStatus = isIntersectLP2B ? 'VERIFIKASI_PERTANIAN' : 'BYPASS_PERTANIAN';
      const nowIso = new Date().toISOString();
      const kecamatanVal = (inv as any).kecamatan || inv.districtId || "Belopa";
      const desaVal = (inv as any).desa || inv.villageId || "-";
      const luasHaVal = Number((inv as any).luas_lahan_ha || inv.areaHa || 5);
      const luasM2Val = luasHaVal * 10000;
      const catatanTeknisVal = `[No. Reg: ${trackingCode}] [Ref IPRO: ${inv.id}] Pengajuan Proaktif Sertifikasi Lahan Clean & Clear oleh Bidang Promosi Penanaman Modal untuk IPRO: ${potName}. ${isIntersectLP2B ? '[Beririsan LP2B - Eskalasi ke Pertanian]' : '[Smart Spatial Bypass: Bebas LP2B - Verifikasi PUPTR]'}`;

      const coreIproPayload: Record<string, any> = {
        id: trackingCode,
        jenis_permohonan: "Berusaha",
        nama_permohonan: `[Sertifikasi IPRO] ${potName}`,
        nib_oss: trackingCode,
        nama_badan_usaha: "Pemerintah Kabupaten Luwu",
        nama_pemohon: "Pemerintah Kabupaten Luwu (DPMPTSP - Bidang Promosi)",
        nik_pemohon: "-",
        sektor: (inv as any).sektor || inv.sector || "Agroindustri",
        kecamatan: kecamatanVal,
        desa_kelurahan: desaVal,
        luas_m2: luasM2Val,
        luas_ha: luasHaVal,
        geometry_json: potGeom,
        status_pkkpr: initialStatusPkkpr,
        catatan_teknis: catatanTeknisVal,
        created_at: nowIso,
        updated_at: nowIso
      };

      const extendedIproPayload: Record<string, any> = {
        ...coreIproPayload,
        nomor_permohonan: trackingCode,
        status_permohonan: isIntersectLP2B ? "ESCALATED_PERTANIAN" : "REVIEW_PUPTR"
      };

      let { data: pkkprInsert, error: pkkprErr } = await supabase
        .from("pkkpr_permohonan")
        .insert(extendedIproPayload)
        .select()
        .single();

      if (pkkprErr) {
        const retryRes = await supabase
          .from("pkkpr_permohonan")
          .insert(coreIproPayload)
          .select()
          .single();
        pkkprInsert = retryRes.data;
        pkkprErr = retryRes.error;
      }

      if (pkkprErr) throw pkkprErr;

      // Cross-OPD notification
      try {
        addCrossOpdNotification({
          fromRole: "ADMIN_DPMPTSP",
          targetRole: "ADMIN_PUPTR",
          type: "NEW_SUBMISSION",
          title: `Sertifikasi IPRO: ${potName}`,
          message: `Bidang Promosi mengajukan telaah Clean & Clear untuk Potensi Unggulan Daerah: ${potName}.`,
          applicationId: pkkprInsert?.id || trackingCode,
          applicantName: 'Bidang Promosi DPMPTSP',
          companyName: 'Pemkab Luwu',
          sector: 'Sertifikasi IPRO',
          districtName: 'Kabupaten Luwu',
          villageName: 'Luwu'
        });
      } catch (e) {
        console.warn("Notification send warning:", e);
      }

      Swal.fire({
        title: "Pengajuan Telaah Berhasil!",
        text: `Potensi ${potName} telah didaftarkan ke antrean Dinas PUPTR & Pertanian (#${trackingCode}).`,
        icon: "success",
        background: "#0f172a",
        color: "#f8fafc",
        confirmButtonColor: "#10b981"
      });

      refreshData();
    } catch (err: any) {
      console.error("Gagal mendaftarkan PKKPR IPRO:", err);
      Swal.fire({
        title: "Gagal Mengajukan",
        text: err.message || "Terjadi kesalahan saat mendaftarkan izin.",
        icon: "error",
        background: "#0f172a",
        color: "#f8fafc"
      });
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
  const [targetPotential, setTargetPotential] = useState<string>('simulasi_umum_luwu');
  const [discountRate, setDiscountRate] = useState<string>('10'); // Default 10% Suku Bunga Diskonto
  const [tenor, setTenor] = useState<string>('5'); // Default 5 Tahun Tenor Proyeksi
  const [inflationRate, setInflationRate] = useState<string>('4.5'); // Default 4.5% Laju Inflasi
  const [simRunCount, setSimRunCount] = useState<number>(0); // Trigger to rerun calculations or track clicks
  const [isPdfGenerating, setIsPdfGenerating] = useState<boolean>(false);
  const [exportingProfileId, setExportingProfileId] = useState<string | null>(null);
  const [isGeneratingExecPdf, setIsGeneratingExecPdf] = useState<boolean>(false);

  // States for Testimonial Submission
  const [testiCompany, setTestiCompany] = useState('');
  const [testiSector, setTestiSector] = useState('Agroindustri');
  const [testiMessage, setTestiMessage] = useState('');
  const [isSubmittingTesti, setIsSubmittingTesti] = useState(false);
  const [companyName, setCompanyName] = useState<string>('');

  // Quick 1-Tap Branded A4 PDF Export Handler Across Promosi, Data, & OSS Dashboards
  const handleQuickExportProfilePdf = async (recordOrTicket: any, bidangLabel: string) => {
    if (!recordOrTicket || exportingProfileId) return;
    const keyId = String(recordOrTicket.id || recordOrTicket.tiket_id || recordOrTicket.nib_number || 'item');
    setExportingProfileId(keyId);
    try {
      // Check if recordOrTicket is already a full Investment or if it matches an Investment in Supabase
      const targetPotensiName = String(recordOrTicket.potensi_name || '').trim().toLowerCase();
      const matchedInv =
        investments.find(
          (inv: any) =>
            String(inv.id) === String(recordOrTicket.id) ||
            (recordOrTicket.investment_id && String(inv.id) === String(recordOrTicket.investment_id)) ||
            (recordOrTicket.potensi_id && String(inv.id) === String(recordOrTicket.potensi_id)) ||
            (targetPotensiName &&
              targetPotensiName !== 'kabupaten luwu' &&
              String(inv.name || inv.judul_peluang || '').trim().toLowerCase() === targetPotensiName)
        ) || null;

      const rawTicketValue = Number(
        String(
          recordOrTicket.investmentValue ??
            recordOrTicket.investment_value ??
            recordOrTicket.nilai_investasi ??
            recordOrTicket.estimasi_investasi ??
            0
        ).replace(/[^0-9.-]+/g, '')
      ) || 0;

      const resolvedRecord = matchedInv
        ? {
            ...matchedInv,
            investmentValue: matchedInv.investmentValue || rawTicketValue || undefined,
            contactPic:
              recordOrTicket.company_name ||
              recordOrTicket.investor_name ||
              matchedInv.contactPic ||
              'DPMPTSP Kabupaten Luwu',
          }
        : {
            ...recordOrTicket,
            id: keyId,
            name:
              recordOrTicket.name ||
              recordOrTicket.judul_peluang ||
              recordOrTicket.potensi_name ||
              recordOrTicket.company_name ||
              recordOrTicket.investor_name ||
              'Profil Proyek Investasi',
            sector:
              recordOrTicket.sector ||
              recordOrTicket.sektor ||
              'Penanaman Modal Daerah',
            kecamatan:
              recordOrTicket.kecamatan ||
              recordOrTicket.districtId ||
              'Kabupaten Luwu',
            investmentValue: rawTicketValue > 0 ? rawTicketValue : undefined,
            status:
              recordOrTicket.nib_number
                ? `NIB Terbit: ${recordOrTicket.nib_number}`
                : recordOrTicket.status || 'Dalam Proses Pelayanan DPMPTSP',
            contactPic:
              recordOrTicket.company_name ||
              recordOrTicket.investor_name ||
              'DPMPTSP Kabupaten Luwu',
            phoneNumber: recordOrTicket.contact_info || '(0471) 321001',
          };

      await exportInvestmentProfileFromRecord(resolvedRecord, {
        issuerBidang: bidangLabel,
      });
    } catch (err) {
      console.error('[AdminPortalDashboard] Gagal ekspor PDF profil:', err);
      Swal.fire({
        title: 'Gagal Mengekspor PDF',
        text: 'Terjadi kendala saat menyusun laporan PDF profil investasi.',
        icon: 'error',
        confirmButtonColor: '#10b981',
      });
    } finally {
      setExportingProfileId(null);
    }
  };

  const handleExportExecutiveReportPdf = async (bidangLabel: string, reportTitle: string) => {
    if (isGeneratingExecPdf) return;
    setIsGeneratingExecPdf(true);
    try {
      await generateExecutivePortfolioPdf(investments || [], {
        issuerBidang: bidangLabel,
        reportTitle,
      });
    } catch (err) {
      console.error('[AdminPortalDashboard] Gagal ekspor laporan eksekutif PDF:', err);
      Swal.fire({
        title: 'Gagal Mengekspor Laporan PDF',
        text: 'Terjadi kendala saat membuat laporan eksekutif format PDF.',
        icon: 'error',
        confirmButtonColor: '#10b981',
      });
    } finally {
      setIsGeneratingExecPdf(false);
    }
  };

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
          'adminmpp@luwukab.go.id': 'admin_mpp',
          'mppluwu@gmail.com': 'admin_mpp',
          'mpp@luwukab.go.id': 'admin_mpp',
          'nilambintangselatan@gmail.com': 'admin_mpp',
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
          else if (localRole.includes("mpp")) effectiveRole = "admin_mpp";
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
          if (normalized === 'admin mpp' || normalized === 'adminmpp' || normalized === 'operator mpp') effectiveRole = 'admin_mpp';
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
                         : effectiveRole === 'admin_mpp' ? 'Admin MPP (Pengelola Mal Pelayanan Publik)'
                         : 'Bidang Penyelenggaraan Pelayanan Perizinan'
              });
            } catch(e) {}
          }

          setUserRole(effectiveRole);
          if (effectiveRole === 'admin_mpp' || effectiveRole === 'operator_mpp') {
            navigate('/admin/beranda', { replace: true });
            return;
          } else if (effectiveRole === 'admin_oss') {
            setActiveTab('overview_perizinan');
          } else if (effectiveRole === 'admin_puptr' || effectiveRole === 'admin_gis') {
            setActiveTab('verifikasi_pkkpr');
          } else if (effectiveRole === 'admin_pertanian') {
            setActiveTab('verifikasi_pertanian');
          } else {
            setActiveTab('overview');
          }
        }

        const validAdminRoles = ['admin_dalak', 'admin_oss', 'admin_promosi', 'superadmin', 'admin_data', 'admin_puptr', 'admin_pertanian', 'admin_gis', 'admin_mpp', 'operator_mpp'];
        if (!effectiveRole || !validAdminRoles.includes(effectiveRole)) {
          navigate("/403-forbidden");
          return;
        }

        if (effectiveRole === 'admin_mpp' || effectiveRole === 'operator_mpp') {
          navigate('/admin/beranda', { replace: true });
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

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 18000);

        const response = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            message: `Berikan Analisis Kelayakan Finansial & Spasial Terpadu Komprehensif (Executive Feasibility Dossier) untuk proyek "${projectName}" (Sektor: ${matchingInv?.sector || 'Sektor Unggulan Daerah'}).
Ulas secara mendalam:
1. Executive Summary & Skor Kelayakan Finansial (skala 1-100)
2. Bedah Metrik Finansial & Simulasi Arus Kas 5 Tahun (CAPEX, OPEX, Revenue, Net Profit, ROI, Payback/BEP, IRR vs Suku Bunga Acuan, NPV, Profitability Index)
3. Uji Ketahanan Sensitivitas Inflasi (+5%) dan Risiko Biaya Modal
4. Keselarasan Spasial RTRW Perda No. 06/2011, Aksesibilitas Logistik Jalan Trans Sulawesi / Pelabuhan Tanjung Ringgit / Bandara Bua, dan Jaminan Pasokan Air Baku DAS RPJPD 2025-2045
5. Insentif Daerah Pemkab Luwu (Potongan sewa lahan/retribusi hingga 35% untuk penyerapan tenaga kerja lokal min 60%)
6. Rekomendasi Aksi & Next Steps bagi Investor.`,
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
              sector: matchingInv?.sector || 'Sektor Unggulan Daerah',
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
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.text && data.text.trim().length > 50) {
            setAiAnalysisResult(data.text);
            return;
          }
        }
      } catch (err: any) {
        console.warn("AI Server timed out or unavailable, activating Heuristic Fallback Analysis:", err);
      }

      // Graceful Fallback Analysis (Anti-Fail)
      const fallback = generateHeuristicRoiAnalysis({
        nilaiInvestasi: numCapex,
        sektor: matchingInv?.sector || 'Sektor Unggulan Daerah',
        luasLahan: 10,
        capex: numCapex,
        opex: numOpex,
        revenue: numRevenue
      });
      setAiAnalysisResult(formatHeuristicRoiMarkdown(fallback, {
        capex: numCapex,
        opex: numOpex,
        revenue: numRevenue,
        roi,
        projectName,
        sector: matchingInv?.sector || 'Sektor Unggulan Daerah'
      }));
    } finally {
      setIsAiLoading(false);
    }
  };

  // Compute stats based on loaded investments
  const stats = useMemo(() => {
    if (investments.length === 0) {
      return {
        totalOpportunities: 0,
        totalInvestmentValue: 0,
        totalArea: 0,
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
            <div key={item.id} className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-surface/80 border border-slate-200 dark:border-slate-800 space-y-1.5">
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
          <div className="p-6 rounded-2xl bg-white/90 dark:bg-surface/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 space-y-4">
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
            <>
              {/* Mobile Android Tap Cards */}
              <div className="md:hidden space-y-3">
                {pendingPromosi.map((ticket) => (
                  <div key={ticket.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          {new Date(ticket.created_at).toLocaleDateString("id-ID")}
                        </div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white truncate mt-0.5">
                          {ticket.company_name || ticket.investor_name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                          {ticket.contact_info || '-'}
                        </div>
                      </div>
                      <span className="text-xs font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                        {formatRupiahSingkat(Number(ticket.nilai_investasi) || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200/80 dark:border-slate-700/50">
                      <span className="truncate">{ticket.potensi_name || "Kabupaten Luwu"}</span>
                      <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 shrink-0">
                        {ticket.status || 'Menunggu Verifikasi'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTicketForAction(ticket);
                        setInputNib(ticket.nib_oss || '');
                        setInputCatatan(ticket.catatan_admin || '');
                        setIsActionModalOpen(true);
                      }}
                      className="w-full min-h-[44px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-[0.98]"
                    >
                      Verifikasi Promosi
                    </button>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block w-full overflow-x-auto rounded-lg shadow-sm">
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
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                    {pendingPromosi.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 text-slate-800 dark:text-slate-200 font-mono tabular-nums">
                          {new Date(ticket.created_at).toLocaleDateString("id-ID")}
                        </td>
                        <td className="p-4 font-medium text-slate-900 dark:text-white">
                          <div>{ticket.company_name || ticket.investor_name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{ticket.contact_info}</div>
                        </td>
                        <td className="p-4 text-slate-800 dark:text-slate-200">
                          {ticket.potensi_name || "Kabupaten Luwu"}
                        </td>
                        <td className="p-4 text-emerald-700 dark:text-emerald-400 font-mono tabular-nums font-bold">
                          {formatRupiahSingkat(Number(ticket.nilai_investasi) || 0)}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1.5 items-start">
                            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                              {ticket.status || 'Menunggu Verifikasi'}
                            </span>
                            {['Izin Terbit / Realisasi', 'Ditolak / Batal'].includes(ticket.status || '') ? (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">- Selesai -</span>
                            ) : (
                              <span className={`text-[10px] font-mono tabular-nums font-bold ${calculateSLA(ticket.updated_at || ticket.created_at).color}`}>
                                Tertahan {calculateSLA(ticket.updated_at || ticket.created_at).days} Hari
                              </span>
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
                            className="px-3.5 py-2 min-h-[40px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold transition-all shadow-sm cursor-pointer"
                          >
                            Verifikasi Promosi
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
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
          <div className="p-4 sm:p-6 rounded-2xl bg-white/90 dark:bg-surface/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-sm space-y-4">
            <div className="flex justify-between items-center gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                  <span>Antrean Tugas: Pengaduan Masyarakat</span>
                  <span className="text-xs text-rose-700 dark:text-rose-400 font-mono tabular-nums font-bold">· {pendingComplaints.length} Laporan</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Sengketa, kendala lapangan, dan laporan dari masyarakat yang membutuhkan tindak lanjut Dalak.</p>
              </div>
              <button 
                onClick={fetchComplaints}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer shrink-0"
                title="Segarkan aduan"
              >
                <Activity size={16} className={loadingComplaints ? "animate-spin text-rose-700 dark:text-rose-400" : ""} />
              </button>
            </div>

            {loadingComplaints ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
                <p className="text-xs text-slate-600 dark:text-slate-300">Memuat aduan masyarakat...</p>
              </div>
            ) : pendingComplaints.length === 0 ? (
              <EmptyState 
                title="Tidak Ada Aduan Baru" 
                message="Tidak ada pengaduan masyarakat aktif yang memerlukan penanganan saat ini." 
              />
            ) : (
              <>
                <div className="md:hidden space-y-3">
                  {pendingComplaints.map((item) => (
                    <div key={item.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                            {new Date(item.created_at).toLocaleDateString("id-ID")}
                          </div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white truncate mt-0.5">
                            {item.nama_pelapor || "Masyarakat Luwu"}
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 shrink-0">
                          {item.status || 'Menunggu Verifikasi'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
                        <span className="font-bold">{item.kategori_pengaduan || 'Pengaduan'}:</span> {item.deskripsi_masalah || "-"}
                      </div>
                      <button
                        onClick={() => openDalakModal(item)}
                        className="w-full min-h-[44px] px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                      >
                        Tindak Lanjut & Site Visit
                      </button>
                    </div>
                  ))}
                </div>

                <div className="hidden md:block w-full overflow-x-auto rounded-lg shadow-sm">
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
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                      {pendingComplaints.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="p-4 text-slate-800 dark:text-slate-200 font-mono tabular-nums">
                            {new Date(item.created_at).toLocaleDateString("id-ID")}
                          </td>
                          <td className="p-4 font-medium text-slate-900 dark:text-white">
                            <div>{item.nama_pelapor || "Masyarakat Luwu"}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{item.kontak_pelapor || "-"}</div>
                          </td>
                          <td className="p-4 text-slate-800 dark:text-slate-200">
                            <div className="font-semibold text-rose-700 dark:text-rose-300">{item.kategori_pengaduan || 'Pengaduan'}</div>
                            <div className="text-[10px] text-slate-600 dark:text-slate-300 truncate max-w-xs">{item.deskripsi_masalah || "-"}</div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1 items-start">
                              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400">
                                {item.status || 'Menunggu Verifikasi'}
                              </span>
                              {!['Selesai', 'Ditolak / Batal'].includes(item.status || '') && (
                                <span className={`text-[10px] font-mono tabular-nums font-bold ${calculateSLA(item.created_at).color}`}>
                                  Tertahan {calculateSLA(item.created_at).days} Hari
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => openDalakModal(item)}
                              className="px-3.5 py-2 min-h-[40px] bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-sm"
                            >
                              Tindak Lanjut & Site Visit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Antrean Persiapan Site Visit / Mediasi */}
          <div className="p-4 sm:p-6 rounded-2xl bg-white/90 dark:bg-surface/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-sm space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                <span>Antrean Tugas: Persiapan Site Visit & Mediasi</span>
                <span className="text-xs text-indigo-700 dark:text-indigo-400 font-mono tabular-nums font-bold">· {pendingDalakLoI.length} Permohonan</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Investor yang membutuhkan verifikasi lapangan dan pendampingan teknis lokasi.</p>
            </div>

            {pendingDalakLoI.length === 0 ? (
              <EmptyState 
                title="Tidak Ada Agenda Visit" 
                message="Tidak ada agenda site visit investor yang tertunda." 
              />
            ) : (
              <>
                <div className="md:hidden space-y-3">
                  {pendingDalakLoI.map((ticket) => (
                    <div key={ticket.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                            {new Date(ticket.created_at).toLocaleDateString("id-ID")}
                          </div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white truncate mt-0.5">
                            {ticket.company_name || ticket.investor_name}
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 shrink-0">
                          {ticket.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 truncate">
                        Lokasi: {ticket.potensi_name || "Kabupaten Luwu"}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedTicketForAction(ticket);
                          setInputNib(ticket.nib_oss || '');
                          setInputCatatan(ticket.catatan_admin || '');
                          setIsActionModalOpen(true);
                        }}
                        className="w-full min-h-[44px] px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-[0.98]"
                      >
                        Update Mediasi
                      </button>
                    </div>
                  ))}
                </div>

                <div className="hidden md:block w-full overflow-x-auto rounded-lg shadow-sm">
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
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                      {pendingDalakLoI.map((ticket) => (
                        <React.Fragment key={ticket.id}>
                          <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => toggleTicketExpand(ticket.id)}>
                            <td className="p-4 text-slate-800 dark:text-slate-200 font-mono tabular-nums">
                              {new Date(ticket.created_at).toLocaleDateString("id-ID")}
                            </td>
                            <td className="p-4 font-medium text-slate-900 dark:text-white">
                              <div>{ticket.company_name || ticket.investor_name}</div>
                            </td>
                            <td className="p-4 text-slate-800 dark:text-slate-200">
                              {ticket.potensi_name || "Kabupaten Luwu"}
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col gap-1 items-start">
                                <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400">
                                  {ticket.status}
                                </span>
                                {['Izin Terbit / Realisasi', 'Ditolak / Batal'].includes(ticket.status || '') ? (
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400">- Selesai -</span>
                                ) : (
                                  <span className={`text-[10px] font-mono tabular-nums font-bold ${calculateSLA(ticket.updated_at || ticket.created_at).color}`}>
                                    Tertahan {calculateSLA(ticket.updated_at || ticket.created_at).days} Hari
                                  </span>
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
                                className="px-3.5 py-2 min-h-[40px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                              >
                                Update Mediasi
                              </button>
                            </td>
                          </tr>
                          {expandedTickets[ticket.id] && (
                            <tr className="bg-slate-50 dark:bg-surface/40">
                              <td colSpan={5} className="p-4 text-xs text-slate-600 dark:text-slate-400 font-sans">
                                <div className="flex gap-6">
                                  <div><span className="font-bold">Status Lahan:</span> {ticket.land_status || 'Menunggu Verifikasi'}</div>
                                  <div><span className="font-bold">Kontak PIC:</span> {ticket.pic_contact || 'Belum Tersedia'}</div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    if (userRole === 'admin_oss') {
      const pendingOss = loiTickets.filter(t => t.status === 'Mediasi Lapangan Selesai' || t.status === 'Verifikasi OSS Berjalan');

      return (
        <div className="p-4 sm:p-6 rounded-2xl bg-white/90 dark:bg-surface/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-sm space-y-4">
          <div className="flex justify-between items-center gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                <span>Antrean Tugas: Verifikasi PKKPR & Penerbitan NIB</span>
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-mono tabular-nums font-bold">· {pendingOss.length} Berkas</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Daftar permohonan yang telah menyelesaikan mediasi lapangan dan siap diterbitkan izin perizinan terpadu.</p>
            </div>
            <button 
              onClick={fetchLoiTickets}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer shrink-0"
              title="Segarkan data"
            >
              <Activity size={16} className={loadingLoiTickets ? "animate-spin text-emerald-700 dark:text-emerald-400" : ""} />
            </button>
          </div>

          {loadingLoiTickets ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
              <p className="text-xs text-slate-600 dark:text-slate-300">Memuat berkas perizinan...</p>
            </div>
          ) : pendingOss.length === 0 ? (
            <EmptyState 
              title="Tidak Ada Antrean PKKPR" 
              message="Tidak ada antrean perizinan atau PKKPR yang tertunda saat ini." 
            />
          ) : (
            <>
              <div className="md:hidden space-y-3">
                {pendingOss.map((ticket) => (
                  <div key={ticket.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          {new Date(ticket.created_at).toLocaleDateString("id-ID")}
                        </div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white truncate mt-0.5">
                          {ticket.company_name || ticket.investor_name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                          {ticket.contact_info || '-'}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                        {ticket.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 truncate">
                      Lokasi: {ticket.potensi_name || "Kabupaten Luwu"}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTicketForAction(ticket);
                        setInputNib(ticket.nib_oss || '');
                        setInputCatatan(ticket.catatan_admin || '');
                        setIsActionModalOpen(true);
                      }}
                      className="w-full min-h-[44px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                    >
                      Terbitkan NIB / PKKPR
                    </button>
                  </div>
                ))}
              </div>

              <div className="hidden md:block w-full overflow-x-auto rounded-lg shadow-sm">
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
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                    {pendingOss.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 text-slate-800 dark:text-slate-200 font-mono tabular-nums">
                          {new Date(ticket.created_at).toLocaleDateString("id-ID")}
                        </td>
                        <td className="p-4 font-medium text-slate-900 dark:text-white">
                          <div>{ticket.company_name || ticket.investor_name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{ticket.contact_info}</div>
                        </td>
                        <td className="p-4 text-slate-800 dark:text-slate-200">
                          {ticket.potensi_name || "Kabupaten Luwu"}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                              {ticket.status}
                            </span>
                            {['Izin Terbit / Realisasi', 'Ditolak / Batal'].includes(ticket.status || '') ? (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">- Selesai -</span>
                            ) : (
                              <span className={`text-[10px] font-mono tabular-nums font-bold ${calculateSLA(ticket.updated_at || ticket.created_at).color}`}>
                                Tertahan {calculateSLA(ticket.updated_at || ticket.created_at).days} Hari
                              </span>
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
                            className="px-3.5 py-2 min-h-[40px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-sm"
                          >
                            Terbitkan NIB / PKKPR
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
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
    <div className="min-h-screen bg-slate-50 dark:bg-base flex flex-col md:flex-row font-sans text-slate-800 dark:text-slate-200">
      {/* Compact Contextual Android Top App Bar (56px) */}
      <div className="md:hidden flex items-center justify-between h-14 px-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-surface/95 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-2.5 min-w-0">
          <LuwuLogo className="h-7 w-7 shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 leading-none truncate">
              {getRoleShortBadge(userRole)}
            </div>
            <div className="text-xs font-extrabold text-slate-900 dark:text-white tracking-tight truncate max-w-[155px] sm:max-w-[240px] mt-0.5">
              {getActiveMenuLabel(activeTab, userRole)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <CrossOpdNotificationBell 
            currentRole={
              (userRole?.toLowerCase().includes('puptr') || activeTab.includes('puptr') || activeTab === 'verifikasi_pkkpr') ? 'ADMIN_PUPTR' :
              (userRole?.toLowerCase().includes('pertanian') || activeTab.includes('pertanian')) ? 'ADMIN_PERTANIAN' :
              'ADMIN_DPMPTSP'
            }
            onSelectApplication={() => {
              if (userRole?.toLowerCase().includes('pertanian') || activeTab === 'verifikasi_pertanian' || activeTab === 'pertanian_clearance') {
                setActiveTab('verifikasi_pertanian');
              } else {
                setActiveTab('verifikasi_pkkpr');
              }
            }}
          />
          <ThemeToggle />
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-xl active:bg-slate-100 dark:active:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Buka menu navigasi"
          >
            {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
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
      <div className="w-full md:flex-1 px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-24 md:pb-8 overflow-y-auto flex flex-col min-w-0">
        {/* Top Navbar */}
        <div className="hidden md:flex justify-between items-center py-4 px-4 md:px-6 lg:px-8 -mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 lg:-mt-8 mb-6 border-b border-slate-200 dark:border-slate-800/60 sticky top-0 z-20 bg-white/80 dark:bg-surface/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 dark:text-slate-400 uppercase tracking-widest">Admin Portal</span>
            <span className="text-slate-800 dark:text-slate-200">/</span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
              {activeTab === 'overview_perizinan' ? 'Overview Perizinan'
                : activeTab === 'oss_pkkpr_issuance' ? 'Penerbitan & Pencetakan SK PKKPR (DPMPTSP/OSS)'
                : activeTab === 'verifikasi_pkkpr' ? 'Verifikasi PKKPR & Tata Ruang (Dinas PUPTR)'
                : activeTab === 'puptr_spatial_catalog' ? 'Katalog Pola Ruang RTRW & RDTR (Dinas PUPTR)'
                : activeTab === 'verifikasi_pertanian' ? 'Rekomendasi Lahan Pertanian / LP2B (Dinas Pertanian)'
                : activeTab === 'pertanian_lp2b_catalog' ? 'Katalog Lahan Pertanian LP2B & Irigasi (Dinas Pertanian)'
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
                : activeTab === 'puptr_spatial_editor' || activeTab === 'spatial_editor' ? 'Editor Spasial Tata Ruang (PUPTR & PostGIS)'
                : activeTab === 'gis_spatial' ? 'Kelola GIS Spasial'
                : activeTab === 'manage_kpbu' ? 'Proyek KPBU & Insentif (Bidang Perencanaan & Data)'
                : activeTab === 'simulation' ? 'Kalkulasi Dampak & ROI'
                : activeTab === 'verify' ? 'Verifikasi & Perizinan'
                : 'Ringkasan Utama'
              }
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Synchronized 4-Bidang Workflow Matrix Modal Trigger */}
            <button
              onClick={() => setIsSyncWorkflowModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 border border-emerald-400/30 active:scale-95"
              title="Lihat Blueprint & Timeline Sinkronisasi 4 Bidang DPMPTSP"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Blueprint 4 Bidang</span>
            </button>

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
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-sm shadow-black/25 hover:shadow-md transition-all cursor-pointer shrink-0 active:scale-95"
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
        ) : (
          <div className="space-y-6">
            {/* Top Visual Estafet Progress Banner Across 4 Bidang */}
            <EstafetProgressBanner 
              tickets={loiTickets}
              userRole={userRole || 'admin_promosi'}
              defaultCollapsedOnMobile={activeTab !== 'overview' && activeTab !== 'overview_perizinan'}
              onOpenEstafetModal={(ticket) => {
                setSelectedEstafetTicket(ticket);
                setIsEstafetModalOpen(true);
              }}
              onOpenBlueprintModal={() => setIsSyncWorkflowModalOpen(true)}
            />

            {activeTab === 'overview_perizinan' ? (
              <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 mt-2 md:mt-0">
            {/* Layout Header & Branding */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 border-b border-slate-200 dark:border-slate-800/60 pb-4 sm:pb-6">
              <div>
                <h1 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-1 tracking-tight flex items-center gap-2">
                  <span>Meja Kerja Bidang Penyelenggaraan Pelayanan Perizinan</span>
                  <ShieldCheck size={18} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
                  Panel verifikasi syarat administrasi, PKKPR, dan eksekusi penerbitan izin berusaha (OSS-RBA).
                </p>
              </div>
              <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold shrink-0">
                OSS-RBA · DPMPTSP LUWU
              </div>
            </div>

            <div className="space-y-6 sm:space-y-8">
              {renderSlaBanner()}
              {/* 4 Tupoksi-driven KPI Cards (Android 2x2 Bento Grid) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                {/* Card 1: Antrean Verifikasi */}
                <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-surface/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
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
                <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-surface/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
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
                <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-surface/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
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
                <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-surface/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-2.5 sm:mb-4">
                    <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform">
                      <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>
                  <div className="text-lg sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight flex items-center gap-1.5 sm:gap-2">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    <span>Terkoneksi</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 line-clamp-1">Status OSS-RBA</div>
                  <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 hidden sm:block">Sistem terhubung aktif.</div>
                </div>
              </div>

              {/* Meja Kerja Khusus Pencetakan & Penerbitan SK PKKPR Final (Pertek PUPTR & BAP Pertanian) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-teal-900/90 via-slate-900/95 to-emerald-950/90 border border-teal-500/30 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400">
                      <Printer size={16} />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-400 font-mono">
                      Layanan Cetak SK PKKPR DPMPTSP & TTE BSRE
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Antrean Penerbitan &amp; Pencetakan SK Izin PKKPR
                  </h3>
                  <p className="text-xs text-slate-300 max-w-xl">
                    Permohonan PKKPR yang telah disetujui Pertek Ruang oleh Dinas PUPTR dan BAP oleh Dinas Pertanian langsung masuk ke meja kerja ini untuk penyematan TTE Digital dan pencetakan SK PKKPR Final.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('oss_pkkpr_issuance')}
                  className="w-full md:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
                >
                  <Printer size={15} />
                  <span>Buka Antrean Cetak PKKPR</span>
                  <ChevronRight size={15} />
                </button>
              </div>

              {/* Main Content: The Verification Queue (Dual-View: Mobile Card List + Desktop Table) */}
              <div className="grid grid-cols-1 gap-6">
                <div className="p-4 sm:p-6 rounded-2xl bg-white/90 dark:bg-surface/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-full">
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
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400 shrink-0">
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

                              <div className="grid grid-cols-2 gap-2">
                                <button 
                                  onClick={() => {
                                    setSelectedTicketForAction(item);
                                    setInputNib(item.nib_oss || '');
                                    setInputCatatan(item.catatan_admin || '');
                                    setIsActionModalOpen(true);
                                  }}
                                  className="min-h-[44px] py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-[0.98] cursor-pointer text-center"
                                >
                                  Proses Verifikasi
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickExportProfilePdf(item, 'Bidang Pelayanan Perizinan / OSS')}
                                  disabled={exportingProfileId === String(item.id)}
                                  className="min-h-[44px] py-2.5 px-3 bg-white dark:bg-slate-800 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white border border-emerald-500/25 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                                >
                                  {exportingProfileId === String(item.id) ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <Download size={14} />
                                  )}
                                  <span>PDF Profil</span>
                                </button>
                              </div>
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
                                    <div className="inline-flex items-center justify-end gap-1.5">
                                      <button 
                                        onClick={() => {
                                          setSelectedTicketForAction(item);
                                          setInputNib(item.nib_oss || '');
                                          setInputCatatan(item.catatan_admin || '');
                                          setIsActionModalOpen(true);
                                        }}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition-all shadow-md shadow-black/25 cursor-pointer active:scale-95"
                                      >
                                        Proses Verifikasi
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleQuickExportProfilePdf(item, 'Bidang Pelayanan Perizinan / OSS')}
                                        disabled={exportingProfileId === String(item.id)}
                                        title="Unduh Laporan PDF Profil Investasi (Kop Pemkab Luwu)"
                                        className="px-2.5 py-1.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white border border-emerald-500/20 rounded-lg text-[10px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer disabled:opacity-60"
                                      >
                                        {exportingProfileId === String(item.id) ? (
                                          <Loader2 size={12} className="animate-spin" />
                                        ) : (
                                          <Download size={12} />
                                        )}
                                        <span>PDF</span>
                                      </button>
                                    </div>
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
                <div className="p-6 rounded-2xl bg-white/90 dark:bg-surface/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col items-center">
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
            

      {/* Modal Verifikasi KYC (Promosi) - Android Bottom Sheet */}
      {isKycModalOpen && selectedKycTicket && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-surface border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[92dvh] overflow-hidden shadow-2xl flex flex-col">
            <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />
            <div className="px-4 py-3.5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/90 dark:bg-base/60 shrink-0">
              <div className="min-w-0 pr-2">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="text-emerald-500 shrink-0" size={20} />
                  <span className="truncate">Verifikasi Investor (KYC)</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Review profil investor dan eskalasi ke tahap selanjutnya.</p>
              </div>
              <button
                onClick={() => setIsKycModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all shrink-0 cursor-pointer"
                aria-label="Tutup modal"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-5">
              {/* Investor Profile */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">Profil Investor</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase mb-0.5">Nama Perusahaan</div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{selectedKycTicket.company_name || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase mb-0.5">Perwakilan / Kontak</div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{selectedKycTicket.investor_name || '-'}</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-mono break-all">{selectedKycTicket.contact_info || '-'}</div>
                  </div>
                </div>
              </div>

              {/* Potensi yang diminati */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold mb-1">Potensi Diminati (IPRO)</div>
                  <div className="font-bold text-blue-700 dark:text-blue-300 text-sm">{selectedKycTicket.potensi_name || 'Kabupaten Luwu'}</div>
                </div>
                <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold mb-1">Rencana Nilai Investasi</div>
                  <div className="font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 text-sm">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(selectedKycTicket.nilai_investasi) || 0)}
                  </div>
                </div>
              </div>

              {/* Pesan Tambahan */}
              <div>
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Pesan & Kebutuhan Investor</h4>
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-100 dark:bg-base border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 italic">
                  "{selectedKycTicket.pesan_tambahan || 'Tidak ada pesan tambahan.'}"
                </div>
              </div>

              {/* Catatan KYC Admin */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">Catatan Verifikasi (Internal)</label>
                <textarea
                  value={kycCatatan}
                  onChange={(e) => setKycCatatan(e.target.value)}
                  rows={3}
                  placeholder="Masukkan hasil meeting, verifikasi dokumen KYC, dll..."
                  className="w-full p-3 rounded-xl border bg-white text-slate-900 border-slate-300 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white dark:border-slate-600 dark:placeholder-slate-400 text-base sm:text-sm outline-none transition-colors"
                />
              </div>
            </div>

            <div className="px-4 pt-3.5 pb-[calc(env(safe-area-inset-bottom,0px)+14px)] sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-base/80 flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-between items-stretch sm:items-center shrink-0">
              <button
                type="button"
                disabled={isSavingKyc}
                onClick={() => handleEscalateLoiToPkkpr(selectedKycTicket)}
                className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl font-extrabold transition-all text-xs flex items-center justify-center gap-2 shadow-md border border-emerald-400/30 active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck size={16} className="text-amber-300 shrink-0" />
                <span>Ajukan PKKPR Clean & Clear</span>
              </button>
              <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={isSavingKyc}
                  onClick={(e) => handleSaveKyc(e, 'Sedang Diproses')}
                  className="min-h-[44px] px-3.5 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-xl font-bold transition-all text-xs disabled:opacity-50 cursor-pointer"
                >
                  Follow-up Meeting
                </button>
                <button
                  type="button"
                  disabled={isSavingKyc}
                  onClick={(e) => handleSaveKyc(e, 'Persiapan Site Visit')}
                  className="min-h-[44px] px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 border border-slate-700 cursor-pointer"
                >
                  {isSavingKyc ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle size={15} />}
                  <span>Eskalasi Dalak</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* The Finisher Modal - Android Bottom Sheet */}
      {isActionModalOpen && selectedTicketForAction && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-surface border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-4xl max-h-[92dvh] overflow-hidden shadow-2xl flex flex-col">
            <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />
            <div className="px-4 py-3.5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white/95 dark:bg-surface/95 backdrop-blur-md shrink-0">
              <div className="min-w-0 pr-2">
                <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-500 shrink-0" size={22} />
                  <span className="truncate">Verifikasi Dokumen & Terbitkan Izin</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Finalisasi penerbitan perizinan berusaha (OSS-RBA).</p>
              </div>
              <button 
                onClick={() => setIsActionModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer shrink-0"
                aria-label="Tutup modal"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] sm:pb-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {/* Left Column: Investor & Location Info */}
              <div className="space-y-4 border-r border-transparent md:border-slate-200 dark:md:border-slate-800 pr-0 md:pr-6">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 space-y-3">
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Data Pemohon</div>
                  
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Nama Perusahaan</div>
                    <div className="font-bold text-slate-900 dark:text-white">{selectedTicketForAction.company_name || selectedTicketForAction.investor_name}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Nilai Investasi</div>
                    <div className="font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">{formatRupiah(Number(selectedTicketForAction.nilai_investasi) || 0)}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Lokasi Tujuan</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedTicketForAction.potensi_name || "Kabupaten Luwu"}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Kebutuhan Lahan</div>
                    <div className="font-semibold font-mono tabular-nums text-slate-800 dark:text-slate-200">{selectedTicketForAction.kebutuhan_lahan ? `${selectedTicketForAction.kebutuhan_lahan} Hektar` : "Belum ditentukan"}</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Checklist & Action */}
              <div className="space-y-5">
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Checklist Persyaratan Administrasi</div>
                  
                  <label className="flex items-start gap-3 p-3.5 min-h-[48px] rounded-xl border border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors">
                    <input type="checkbox" className="mt-0.5 w-5 h-5 rounded text-emerald-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 focus:ring-emerald-500 shrink-0" />
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Persetujuan KKPR</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Kesesuaian Kegiatan Pemanfaatan Ruang (Tata Ruang).</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3.5 min-h-[48px] rounded-xl border border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors">
                    <input type="checkbox" className="mt-0.5 w-5 h-5 rounded text-emerald-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 focus:ring-emerald-500 shrink-0" />
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Dokumen Lingkungan</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Persetujuan AMDAL atau UKL-UPL terkait dampak lingkungan.</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3.5 min-h-[48px] rounded-xl border border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors">
                    <input type="checkbox" className="mt-0.5 w-5 h-5 rounded text-emerald-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 focus:ring-emerald-500 shrink-0" />
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Rekomendasi Teknis OPD</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Izin sektoral dan pertimbangan teknis dari Dinas terkait.</div>
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

                      generateSkPkkprPdf({
                        applicationId: String(selectedTicketForAction.id),
                        applicantName: selectedTicketForAction.investor_name || 'Pemohon Terdaftar',
                        companyName: selectedTicketForAction.company_name || 'Perusahaan Pemohon',
                        nibNik: inputNib || '-',
                        sector: selectedTicketForAction.sektor_name || 'Penanaman Modal',
                        districtName: selectedTicketForAction.potensi_name || 'Belopa',
                        villageName: '-',
                        areaHa: Number(selectedTicketForAction.kebutuhan_lahan) || 0,
                        investmentValue: Number(selectedTicketForAction.nilai_investasi) || 0,
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
                  } catch (err: any) {
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
                }} className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-5">
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 block">Nomor NIB (OSS-RBA)</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: NIB-123456-LUWU"
                      value={inputNib}
                      onChange={(e) => setInputNib(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border bg-white text-slate-900 border-slate-300 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white dark:border-slate-600 dark:placeholder-slate-400 outline-none text-base sm:text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 block">Catatan Verifikasi</label>
                    <textarea
                      required
                      placeholder="Catatan persetujuan, validasi dokumen, dll..."
                      value={inputCatatan}
                      onChange={(e) => setInputCatatan(e.target.value)}
                      rows={2}
                      className="w-full p-3 rounded-xl border bg-white text-slate-900 border-slate-300 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white dark:border-slate-600 dark:placeholder-slate-400 outline-none text-base sm:text-xs resize-none font-sans"
                    />
                  </div>
                  
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingAction}
                      className="w-full min-h-[48px] py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.98]"
                    >
                      {isSavingAction && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>Setujui & Terbitkan Izin</span>
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
          <DalakWorkspaceView activeTab={activeTab} setActiveTab={setActiveTab} investments={investments} districts={districts} onSelectInvestment={setSelectedInvestmentId} />
        ) : (activeTab === 'overview' && userRole === 'admin_data') ? (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 mt-2 md:mt-0">
            {/* 1. Layout Header & Branding */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 border-b border-slate-200 dark:border-slate-800/60 pb-5 sm:pb-6">
              <div>
                <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mb-1.5 tracking-tight flex items-center gap-2">
                  <span>Meja Kerja Bidang Perencanaan, Pengembangan Iklim & Data</span>
                  <Map className="text-purple-500 shrink-0" size={20} />
                </h1>
                <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
                  Pusat kendali tata ruang (WebGIS), analisis makroekonomi, evaluasi kebijakan, dan pelaporan eksekutif.
                </p>
              </div>
              <div className="text-[11px] font-mono text-purple-700 dark:text-purple-300 font-bold shrink-0">
                PERENCANAAN · DATA & GIS
              </div>
            </div>

            {/* 2. Macro KPI Cards (2x2 Bento Grid on Android/Mobile) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Card 1: Target Realisasi (RPJMD) */}
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-surface/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">TARGET RPJMD</span>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                  Rp 1.2 T
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">
                  Target Realisasi (RPJMD)
                </div>
              </div>

              {/* Card 2: Capaian Terealisasi */}
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-surface/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">CAPAIAN REALISASI</span>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1 truncate">
                  <AnimatedCounter value={stats.totalInvestmentValue} formatter={formatRupiahSingkat} />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">
                  Potensi & Capaian Terdata
                </div>
              </div>

              {/* Card 3: Database Spasial (GIS) */}
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-surface/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">DATABASE SPASIAL</span>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                    <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                  <AnimatedCounter value={Object.keys(spatialLayers || {}).length || 24} /> <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Lapis</span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">
                  Database Spasial (GIS)
                </div>
              </div>

              {/* Card 4: Investor LOI */}
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-surface/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">LOI STATS</span>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform duration-300">
                    <Briefcase className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
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
              <div className="lg:col-span-2 p-4 sm:p-6 rounded-2xl bg-white/95 dark:bg-surface/70 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Database className="text-purple-500 shrink-0" size={20} />
                      <span>Data Master & Analisis Spasial</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-1">Pusat pengelolaan basis data makro, sektoral, dan peta tata ruang.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 flex-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('gis_spatial')}
                    className="p-4 text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
                        <Map size={18} />
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">Peta Potensi & Tata Ruang</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">Integrasi layer WebGIS RTRW dan RDTR wilayah Kabupaten Luwu.</p>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setActiveTab('manage_kpbu')}
                    className="p-4 text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
                        <Coins size={18} />
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">Proyek KPBU & Insentif</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">Kelola pipeline proyek pembiayaan kreatif dan paket insentif pajak.</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('spatial_analytics')}
                    className="p-4 text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
                        <BarChart3 size={18} />
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">Data Makroekonomi</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">Dataset PDRB, inflasi, dan tren pertumbuhan sektoral.</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('simulation')}
                    className="p-4 text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
                        <FileCheck size={18} />
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">LKPM & Simulasi ROI</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">Simulasi kelayakan finansial & proyeksi realisasi modal.</p>
                    </div>
                  </button>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3 border-t border-slate-200 dark:border-slate-800 pt-5">
                  <button
                    onClick={() => navigate('/?mode=gis')}
                    className="min-h-[44px] px-5 py-2.5 bg-purple-600 dark:bg-purple-500 hover:bg-purple-700 dark:hover:bg-purple-600 text-white rounded-xl font-bold transition-all text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-[0.98]"
                  >
                    <MapPin size={16} />
                    <span>Validasi Analisis Spasial</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('spatial_analytics')}
                    className="min-h-[44px] px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-200 rounded-xl font-bold transition-all text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 cursor-pointer active:scale-[0.98]"
                  >
                    <Settings size={16} />
                    <span>Buka Spatial Analytics</span>
                  </button>
                </div>
              </div>

              {/* Right Column (33%): Evaluasi & Pelaporan (Reporting Engine) */}
              <div className="p-4 sm:p-6 rounded-2xl bg-white/95 dark:bg-surface/70 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col">
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
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Sinkronisasi database aktif</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-2.5">
                  <button
                    type="button"
                    disabled={isGeneratingExecPdf}
                    onClick={() =>
                      handleExportExecutiveReportPdf(
                        'Bidang Perencanaan & Pengembangan Iklim Penanaman Modal',
                        'LAPORAN EKSEKUTIF REALISASI & PETA POTENSI INVESTASI KABUPATEN LUWU'
                      )
                    }
                    className="w-full min-h-[44px] px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-[0.98]"
                  >
                    {isGeneratingExecPdf ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                    <span>{isGeneratingExecPdf ? 'Menyusun Laporan PDF...' : 'Unduh Laporan Realisasi (PDF)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const headers = ['No,Nama Proyek,Sektor,Kecamatan,Luas Lahan (Ha),Nilai Investasi (Rp),Status'];
                      const rows = (investments || []).map((inv: any, idx: number) => {
                        const val = Number(inv.investmentValue ?? inv.nilai_investasi ?? 0) || 0;
                        const area = Number(inv.areaHa ?? inv.luas_lahan ?? 0) || 0;
                        const cleanName = String(inv.name || inv.judul_peluang || 'Proyek').replace(/"/g, '""');
                        const cleanSec = String(inv.sector || inv.sektor || '-').replace(/"/g, '""');
                        const cleanDist = String(inv.kecamatan || inv.districtId || 'Kabupaten Luwu').replace(/"/g, '""');
                        const cleanStatus = String(inv.status || 'Aktif').replace(/"/g, '""');
                        return `${idx + 1},"${cleanName}","${cleanSec}","${cleanDist}",${area},${val},"${cleanStatus}"`;
                      });
                      const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement('a');
                      link.setAttribute('href', encodedUri);
                      link.setAttribute('download', `Rekap_Sektoral_Investasi_Luwu_${new Date().toISOString().split('T')[0]}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="w-full min-h-[44px] px-4 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-500/30 cursor-pointer active:scale-[0.98]"
                  >
                    <Download size={14} />
                    <span>Unduh Rekap Sektoral (CSV)</span>
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
                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">· Panel Kajian</span>
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
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 mt-2 md:mt-0">
            {/* 1. Layout Header & Branding */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 border-b border-slate-200 dark:border-slate-800/60 pb-5 sm:pb-6">
              <div>
                <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mb-1.5 tracking-tight flex items-center gap-2">
                  <span>Meja Kerja Bidang Promosi & Penanaman Modal</span>
                  <TrendingUp className="text-amber-500 shrink-0" size={20} />
                </h1>
                <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
                  Pusat kendali etalase potensi daerah (IPRO), penjaringan minat investasi (LoI), dan verifikasi awal investor.
                </p>
              </div>
              <div className="text-[11px] font-mono text-amber-700 dark:text-amber-300 font-bold shrink-0">
                PROMOSI · IPRO & LOI
              </div>
            </div>

            {/* 2. KPI Cards (2x2 Bento Grid on Android/Mobile) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Card 1: Tiket Minat (LoI) Masuk */}
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-surface/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">TIKET LOI</span>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                  <AnimatedCounter value={loiTickets.filter(t => t.status === 'Menunggu Verifikasi').length} />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">
                  Tiket Minat (LoI) Masuk
                </div>
              </div>

              {/* Card 2: Potensi Dipublikasikan */}
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-surface/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">POTENSI IPRO</span>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                  <AnimatedCounter value={investments.filter(i => i.isActive).length} />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">
                  Potensi Dipublikasikan
                </div>
              </div>

              {/* Card 3: Total Nilai Penawaran */}
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-surface/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">OFFER VALUE</span>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1 truncate">
                  <AnimatedCounter value={stats.totalInvestmentValue} formatter={formatRupiahSingkat} />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">
                  Total Nilai Penawaran
                </div>
              </div>

              {/* Card 4: Investor Lolos KYC */}
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-surface/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">INVESTOR KYC</span>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                  <AnimatedCounter value={loiTickets.filter(t => t.status === 'Persiapan Site Visit' || t.status === 'Selesai' || t.status === 'Disetujui').length} />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">
                  Investor Lolos KYC
                </div>
              </div>
            </div>

            {/* 3 & 5. Main Content: Dual-View Data Cards/Table & Right Section */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column (75%): LoI Verification Queue */}
              <div className="lg:col-span-3 p-4 sm:p-6 rounded-2xl bg-white/95 dark:bg-surface/70 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col">
                <div className="flex justify-between items-center mb-4 sm:mb-6 gap-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">Penjaringan & Verifikasi Minat Investasi (LoI)</h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-1">Tiket minat dari Landing Page yang membutuhkan tindakan verifikasi (KYC) atau estafet bidang.</p>
                  </div>
                  <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg shrink-0">
                    <Users size={20} />
                  </div>
                </div>
                
                {loiTickets.length === 0 ? (
                  <EmptyState 
                    isTable={false} 
                    title="Belum Ada Tiket" 
                    message="Belum ada tiket minat investasi (LoI) yang masuk." 
                  />
                ) : (
                  <>
                    {/* Mobile Android Tap Cards */}
                    <div className="md:hidden space-y-3">
                      {loiTickets.map((ticket, idx) => (
                        <div key={ticket.id || idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                                {new Date(ticket.created_at).toLocaleDateString('id-ID', {
                                  day: 'numeric', month: 'short', year: 'numeric'
                                })}
                              </div>
                              <div className="font-extrabold text-sm text-slate-900 dark:text-white truncate mt-0.5">
                                {ticket.company_name || ticket.investor_name}
                              </div>
                              <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                {ticket.investor_name}
                              </div>
                            </div>
                            <span className="text-xs font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                              {formatRupiahSingkat(Number(ticket.nilai_investasi) || 0)}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-2 border-t border-slate-200 dark:border-slate-700/50">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                              {ticket.potensi_name || 'Potensi Kabupaten Luwu'}
                            </span>
                            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                              {ticket.status || 'Menunggu Verifikasi'}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-1">
                            <button
                              onClick={() => {
                                setSelectedKycTicket(ticket);
                                setKycCatatan(ticket.catatan_admin || '');
                                setIsKycModalOpen(true);
                              }}
                              className="min-h-[44px] px-2.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs transition-colors cursor-pointer active:scale-[0.98]"
                            >
                              KYC
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickExportProfilePdf(ticket, 'Bidang Promosi & Penanaman Modal')}
                              disabled={exportingProfileId === String(ticket.id)}
                              className="min-h-[44px] px-2.5 py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white border border-emerald-500/20 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
                            >
                              {exportingProfileId === String(ticket.id) ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Download size={13} />
                              )}
                              <span>PDF</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedEstafetTicket(ticket);
                                setIsEstafetModalOpen(true);
                              }}
                              className="min-h-[44px] px-2.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-[0.98]"
                            >
                              <span>Estafet</span>
                              <ArrowRight size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block w-full overflow-x-auto custom-scrollbar rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <table className="w-full text-left border-collapse min-w-[700px] whitespace-nowrap">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-base text-slate-800 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px]">
                            <th className="p-3.5">Tanggal</th>
                            <th className="p-3.5">Profil Perusahaan</th>
                            <th className="p-3.5">Potensi Diminati</th>
                            <th className="p-3.5">Rencana Nilai (Rp)</th>
                            <th className="p-3.5 text-center">Status</th>
                            <th className="p-3.5 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300 font-medium text-xs">
                          {loiTickets.map((ticket, idx) => (
                            <tr key={ticket.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                              <td className="p-3.5 text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums">
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
                              <td className="p-3.5 text-xs font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(ticket.nilai_investasi) || 0)}
                              </td>
                              <td className="p-3.5 text-center">
                                <div className="flex flex-col gap-1 items-center">
                                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                                    {ticket.status}
                                  </span>
                                  {['Izin Terbit / Realisasi', 'Ditolak / Batal'].includes(ticket.status || '') ? (
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">- Selesai -</span>
                                  ) : (
                                    <span className={`text-[10px] font-mono tabular-nums font-bold ${calculateSLA(ticket.last_status_updated_at || ticket.created_at).color}`}>
                                      Tertahan {calculateSLA(ticket.last_status_updated_at || ticket.created_at).days} Hari
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleQuickExportProfilePdf(ticket, 'Bidang Promosi & Penanaman Modal')}
                                    disabled={exportingProfileId === String(ticket.id)}
                                    title="Unduh Laporan PDF Profil Investasi (Kop Pemkab Luwu)"
                                    className="px-2.5 py-1.5 min-h-[38px] bg-emerald-600/10 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white transition-colors text-xs font-bold rounded-lg border border-emerald-500/20 inline-flex items-center gap-1 cursor-pointer disabled:opacity-60"
                                  >
                                    {exportingProfileId === String(ticket.id) ? (
                                      <Loader2 size={13} className="animate-spin" />
                                    ) : (
                                      <Download size={13} />
                                    )}
                                    <span>PDF</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedKycTicket(ticket);
                                      setKycCatatan(ticket.catatan_admin || '');
                                      setIsKycModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 min-h-[38px] bg-slate-100 dark:bg-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-800 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 shadow-xs cursor-pointer"
                                  >
                                    Verifikasi (KYC)
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedEstafetTicket(ticket);
                                      setIsEstafetModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 min-h-[38px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                                    title="Estafetkan Pendampingan ke Bidang Selanjutnya"
                                  >
                                    <span>Estafetkan</span>
                                    <ArrowRight size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {/* Right Column (25%): Manajemen Etalase Potensi (IPRO) */}
              <div className="p-4 sm:p-6 rounded-2xl bg-white/95 dark:bg-surface/70 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between">
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
                        setActiveTab('manage_potential');
                        setIsAddIproModalOpen(true);
                      }}
                      className="w-full min-h-[48px] flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group cursor-pointer active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <PlusCircle className="text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" size={18} />
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 text-xs sm:text-sm">Tambah Potensi Baru</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        setActiveTab('manage_potential');
                      }}
                      className="w-full min-h-[48px] flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800 active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="text-slate-600 dark:text-slate-400" size={18} />
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">Kelola Publikasi Web</span>
                      </div>
                      <ChevronRight className="text-slate-500 dark:text-slate-400" size={16} />
                    </button>

                    <button
                      type="button"
                      disabled={isGeneratingExecPdf}
                      onClick={() =>
                        handleExportExecutiveReportPdf(
                          'Bidang Promosi & Penanaman Modal',
                          'KATALOG RESMI PROYEK INVESTASI SIAP TAWAR (IPRO) KABUPATEN LUWU'
                        )
                      }
                      className="w-full min-h-[48px] flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white transition-colors cursor-pointer shadow-sm active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        {isGeneratingExecPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                        <span className="font-extrabold text-xs sm:text-sm">
                          {isGeneratingExecPdf ? 'Menyusun PDF...' : 'Unduh Katalog IPRO (PDF)'}
                        </span>
                      </div>
                      <FileText size={16} />
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
                  <Sparkles size={18} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">{getWorkspaceSubtitle(userRole)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {isOperatorWorkspaceRole(userRole) && (
                  <button
                    onClick={() => {
                      window.location.href = "/operator-workspace";
                    }}
                    className="min-h-[44px] sm:min-h-[38px] flex-1 sm:flex-initial justify-center flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-black/25 hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                    title="Buka Ruang Kerja Operator (Smart Form & GIS)"
                  >
                    <Building2 size={14} className="shrink-0" />
                    <span>Operator Workspace</span>
                    <ArrowUpRight size={12} className="shrink-0" />
                  </button>
                )}
                <div className="text-[11px] sm:text-xs font-mono text-emerald-700 dark:text-emerald-400 font-semibold px-1 py-1">
                  {t('dashboard.onlineSyncActive', 'Online Sync Active')}
                </div>
              </div>
            </div>

            {/* Conditional Task Queue per Role */}
            {renderTaskQueue()}

            {/* 1. Top Row: Quick Statistic Cards (4 Columns) */}
            <div className="bg-white/90 dark:bg-surface/60 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 mb-3 sm:mb-4">
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 sm:gap-2">
                  <Activity size={15} /> Economic Health Trend
                </h3>
                <select 
                  value={selectedDistrictId}
                  onChange={(e) => setSelectedDistrictId(e.target.value)}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px] text-base sm:text-xs font-medium bg-white text-gray-900 border border-gray-300 dark:bg-slate-800 dark:text-white dark:border-slate-600 rounded-xl px-3 py-2 outline-none"
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
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-surface/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
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
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-surface/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
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
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-surface/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
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
                className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-surface/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group"
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
              <div className="lg:col-span-3 p-6 rounded-2xl bg-white/90 dark:bg-surface/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
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
                        const isSelected = selectedInvestmentId === inv.id;
                        return (
                          <div 
                            key={inv.id}
                            onClick={() => setSelectedInvestmentId(isSelected ? null : inv.id)}
                            className={`p-4 rounded-xl transition-all duration-300 ease-out cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group border ${
                              isSelected
                                ? "bg-emerald-500/10 dark:bg-emerald-950/50 border-emerald-500/80 ring-2 ring-emerald-500/20 shadow-lg shadow-black/25 -translate-y-0.5"
                                : "bg-slate-50 dark:bg-base/80 border-slate-200 dark:border-slate-800/80 hover:bg-slate-100/90 dark:hover:bg-slate-900 hover:border-emerald-500/50 hover:shadow-md hover:-translate-y-0.5"
                            }`}
                          >
                            <div className="flex items-center gap-4 truncate">
                              <div className="w-12 h-12 rounded-lg bg-white dark:bg-surface overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800 relative">
                                <img 
                                  src={getImageUrl(inv.photoUrl || inv.photo_url || inv.url_foto_lokasi || (inv.photoUrls && inv.photoUrls[0]) || (inv.galeri_foto && inv.galeri_foto[0]), 'facility')} 
                                  alt={inv.name}
                                  referrerPolicy="no-referrer"
                                  onError={(e) => handleImageError(e, 'facility')}
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
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickExportProfilePdf(inv, formatRoleLabel(userRole));
                                  }}
                                  disabled={exportingProfileId === String(inv.id)}
                                  title="Unduh Laporan PDF Profil Investasi (Kop Pemkab Luwu)"
                                  className="min-h-[36px] px-2.5 py-1 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white border border-emerald-500/20 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-60"
                                >
                                  {exportingProfileId === String(inv.id) ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <Download size={12} />
                                  )}
                                  <span>PDF</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedInvestmentId(inv.id);
                                  }}
                                  className="min-h-[36px] px-3 py-1 bg-white dark:bg-surface hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-700 text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                >
                                  <span>{t('dashboard.viewDetails', 'Lihat Detail')}</span>
                                  <ArrowUpRight size={12} />
                                </button>
                              </div>
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
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white/90 dark:bg-surface/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
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
              <div className="p-6 rounded-2xl bg-white/90 dark:bg-surface/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
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
              <div className="p-6 rounded-2xl bg-white/90 dark:bg-surface/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
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
                    className="group p-4 bg-slate-50 dark:bg-base border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 hover:bg-emerald-500/5 rounded-2xl transition-all duration-300 text-left flex items-start justify-between"
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
                    className="group p-4 bg-slate-50 dark:bg-base border border-slate-200 dark:border-slate-800 hover:border-blue-500/30 hover:bg-blue-500/5 rounded-2xl transition-all duration-300 text-left flex items-start justify-between"
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
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Page Header */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-surface/40 p-4 sm:p-6 border border-slate-200 dark:border-slate-800/80">
              <div className="relative space-y-2">
                <p className="text-[11px] font-bold tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
                  Bidang Perizinan &amp; OSS-RBA
                </p>
                <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Overview Perizinan Berusaha (OSS-RBA)</h1>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
                  Ringkasan statistik permohonan perizinan, verifikasi persyaratan dasar (PKKPR, SLF, Amdal), dan penerbitan NIB terintegrasi Sistem OSS-RBA Kementerian Investasi / BKPM.
                </p>
              </div>
            </div>

            {/* Quick Stats Grid (Zero-Dummy Live Data) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-surface/80 border border-slate-200/80 dark:border-white/10 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">Total Permohonan</span>
                  <div className="p-2 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400">
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                  {loiTickets.length} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Berkas</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-1">
                  Antrean Terdata Aktif
                </div>
              </div>

              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-surface/80 border border-slate-200/80 dark:border-white/10 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">KKPR Valid</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-1">
                  {loiTickets.filter(tk => tk.status === 'Mediasi Lapangan Selesai' || tk.status === 'Izin Terbit / Realisasi').length} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Dokumen</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-1">
                  Persetujuan Tata Ruang
                </div>
              </div>

              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-surface/80 border border-slate-200/80 dark:border-white/10 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">NIB Terbit</span>
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-blue-700 dark:text-blue-400 mt-1">
                  {loiTickets.filter(tk => Boolean(tk.nib_number) || tk.status === 'Izin Terbit / Realisasi').length} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">NIB</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-1">
                  Terverifikasi OSS-RBA
                </div>
              </div>

              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-surface/80 border border-slate-200/80 dark:border-white/10 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">Verifikasi Berjalan</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-amber-700 dark:text-amber-400 mt-1">
                  {loiTickets.filter(tk => tk.status === 'Verifikasi OSS Berjalan' || tk.status === 'Menunggu Verifikasi').length} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Proyek</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-1">
                  Dalam Telaah Teknis
                </div>
              </div>
            </div>

            {/* OSS Queue Dual-View */}
            <div className="p-4 sm:p-6 rounded-2xl bg-white/90 dark:bg-surface/60 border border-slate-200/60 dark:border-white/5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Antrean Verifikasi Perizinan Berusaha OSS-RBA</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Daftar permohonan riil yang membutuhkan verifikasi teknis oleh tim DPMPTSP Kabupaten Luwu.</p>
                </div>
                <button
                  onClick={() => setActiveTab('oss_pkkpr_issuance')}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-[38px] justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <ShieldCheck size={16} />
                  <span>Buka Penerbitan SK PKKPR</span>
                </button>
              </div>

              {loiTickets.length === 0 ? (
                <EmptyState
                  title="Belum Ada Antrean Permohonan OSS"
                  message="Data permohonan perizinan berusaha dari database akan tampil secara otomatis di halaman ini."
                />
              ) : (
                <>
                  {/* Android Tap Cards (md:hidden) */}
                  <div className="md:hidden space-y-3">
                    {loiTickets.map((tk) => {
                      const sla = calculateSLA(tk.updated_at || tk.created_at);
                      return (
                        <div key={tk.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">
                                {tk.tiket_id || `OSS-${String(tk.id).substring(0, 8).toUpperCase()}`}
                              </span>
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate mt-0.5">
                                {tk.company_name || tk.investor_name || tk.nama_investor || 'Pemohon Investasi'}
                              </h4>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                              {sla.badge}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-1.5">
                            <span>{tk.sector || tk.potensi_name || 'Sektor Usaha'}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">{tk.status || 'Menunggu Verifikasi'}</span>
                          </div>
                          <button
                            onClick={() => openActionModal(tk)}
                            className="w-full min-h-[44px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                          >
                            <ShieldCheck size={15} />
                            <span>Proses Verifikasi</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table (hidden md:block) */}
                  <div className="hidden md:block w-full overflow-x-auto rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                          <th className="py-3 px-3">No. Permohonan</th>
                          <th className="py-3 px-3">Pelaku Usaha</th>
                          <th className="py-3 px-3">Sektor / Proyek</th>
                          <th className="py-3 px-3">Status Permohonan</th>
                          <th className="py-3 px-3">SLA Argometer</th>
                          <th className="py-3 px-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
                        {loiTickets.map((tk) => {
                          const sla = calculateSLA(tk.updated_at || tk.created_at);
                          return (
                            <tr key={tk.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                              <td className="py-3.5 px-3 font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                                {tk.tiket_id || `OSS-${String(tk.id).substring(0, 8).toUpperCase()}`}
                              </td>
                              <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">
                                {tk.company_name || tk.investor_name || tk.nama_investor || 'Pemohon Investasi'}
                              </td>
                              <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300">
                                {tk.sector || tk.potensi_name || '-'}
                              </td>
                              <td className="py-3.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                {tk.status || 'Menunggu Verifikasi'}
                              </td>
                              <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                                {sla.badge}
                              </td>
                              <td className="py-3.5 px-3 text-right">
                                <button
                                  onClick={() => openActionModal(tk)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] transition cursor-pointer"
                                >
                                  Proses Verifikasi
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : activeTab === 'investor_pipeline' ? (
          <InvestorPipelineWorkflowView />
        ) : (activeTab === 'oss_pkkpr_issuance' || activeTab === 'penerbitan_sk_pkkpr' || activeTab === 'cetak_pkkpr') ? (
          <OssPkkprIssuanceDashboard />
        ) : (activeTab === 'pkkpr_sync_monitor' || activeTab === 'pkkpr_monitoring' || activeTab === 'pkkpr_business_process') ? (
          <PkkprBusinessProcessMonitorDashboard />
        ) : (activeTab === 'verifikasi_pkkpr' || activeTab === 'puptr_spatial_clearance') ? (
          <PuptrSpatialClearanceDashboard />
        ) : activeTab === 'puptr_spatial_catalog' ? (
          <PuptrSpatialCatalogView />
        ) : (activeTab === 'verifikasi_pertanian' || activeTab === 'admin_pertanian') ? (
          <PertanianLandClearanceDashboard />
        ) : activeTab === 'pertanian_lp2b_catalog' ? (
          <PertanianLp2bCatalogView />
        ) : activeTab === 'realisasi_nib' ? (
          (() => {
            const nibIssuedTickets = loiTickets.filter(tk => Boolean(tk.nib_number) || tk.status === 'Izin Terbit / Realisasi');
            const umkCount = nibIssuedTickets.filter(tk => (Number(tk.investment_value || tk.nilai_investasi) || 0) <= 5000000000).length;
            const nonUmkCount = Math.max(0, nibIssuedTickets.length - umkCount);

            return (
              <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-surface/40 p-4 sm:p-6 border border-slate-200 dark:border-slate-800/80">
                  <div className="relative space-y-2">
                    <p className="text-[11px] font-bold tracking-wider uppercase text-blue-700 dark:text-blue-400">
                      Integrasi OSS-RBA BKPM
                    </p>
                    <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Realisasi Penerbitan NIB &amp; Hak Akses OSS</h1>
                    <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
                      Daftar Nomor Induk Berusaha (NIB) terbit secara real-time di Kabupaten Luwu beserta status verifikasi hak akses dan penyerapan tenaga kerja lokal.
                    </p>
                  </div>
                </div>

                {/* Metrics (Live Database Zero-Dummy) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-3.5 sm:p-5 rounded-2xl bg-white/90 dark:bg-surface/60 border border-slate-200/60 dark:border-white/5 shadow-sm space-y-1">
                    <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Total NIB Terbit</span>
                    <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-emerald-700 dark:text-emerald-400">{nibIssuedTickets.length} NIB</div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-300">Terverifikasi di Database</div>
                  </div>
                  <div className="p-3.5 sm:p-5 rounded-2xl bg-white/90 dark:bg-surface/60 border border-slate-200/60 dark:border-white/5 shadow-sm space-y-1">
                    <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Sektor UMK / Mikro</span>
                    <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-cyan-600 dark:text-cyan-400">{umkCount} NIB</div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-300">Modal &le; Rp 5 Miliar</div>
                  </div>
                  <div className="p-3.5 sm:p-5 rounded-2xl bg-white/90 dark:bg-surface/60 border border-slate-200/60 dark:border-white/5 shadow-sm space-y-1">
                    <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Non-UMKM / Besar</span>
                    <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-purple-600 dark:text-purple-400">{nonUmkCount} NIB</div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-300">Modal &gt; Rp 5 Miliar</div>
                  </div>
                  <div className="p-3.5 sm:p-5 rounded-2xl bg-white/90 dark:bg-surface/60 border border-slate-200/60 dark:border-white/5 shadow-sm space-y-1">
                    <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Serapan Tenaga Kerja</span>
                    <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-amber-700 dark:text-amber-400">{stats.totalLabor.toLocaleString("id-ID")} Orang</div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-300">Tenaga Kerja Terdata</div>
                  </div>
                </div>

                {/* Dual-View List/Table */}
                <div className="p-4 sm:p-6 rounded-2xl bg-white/90 dark:bg-surface/60 border border-slate-200/60 dark:border-white/5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Daftar NIB Terbit Terverifikasi</h3>
                    <button
                      onClick={handleOSSSync}
                      disabled={isSyncingOSS}
                      className="w-full sm:w-auto min-h-[44px] sm:min-h-[38px] justify-center px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                    >
                      <RefreshCw size={14} className={isSyncingOSS ? 'animate-spin' : ''} />
                      <span>{isSyncingOSS ? 'Sinkronisasi OSS...' : 'Sinkronisasi Data OSS'}</span>
                    </button>
                  </div>

                  {nibIssuedTickets.length === 0 ? (
                    <EmptyState
                      title="Belum Ada Realisasi NIB Terbit"
                      message="Belum ada data NIB terbit yang tercatat di database. Gunakan panel verifikasi perizinan untuk mencatatkan nomor NIB resmi pelaku usaha."
                    />
                  ) : (
                    <>
                      {/* Android Tap Cards (md:hidden) */}
                      <div className="md:hidden space-y-3">
                        {nibIssuedTickets.map((tk) => {
                          const modalVal = Number(tk.investment_value || tk.nilai_investasi) || 0;
                          return (
                            <div key={tk.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <span className="font-mono tabular-nums text-xs font-bold text-emerald-700 dark:text-emerald-400 block">
                                    NIB: {tk.nib_number || '-'}
                                  </span>
                                  <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate mt-0.5">
                                    {tk.company_name || tk.investor_name || tk.nama_investor || 'Pelaku Usaha'}
                                  </h4>
                                </div>
                                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                                  Aktif
                                </span>
                              </div>
                              <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-1.5">
                                <span>{tk.sector || tk.potensi_name || 'Sektor Usaha'}</span>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                                  {modalVal > 0 ? formatRupiahSingkat(modalVal) : 'Belum Diinput'}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => openActionModal(tk)}
                                  className="min-h-[44px] px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <span>Rincian NIB</span>
                                  <ChevronRight size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickExportProfilePdf(tk, 'Bidang Pelayanan Perizinan / OSS')}
                                  disabled={exportingProfileId === String(tk.id)}
                                  className="min-h-[44px] px-3 py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white border border-emerald-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                                >
                                  {exportingProfileId === String(tk.id) ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <Download size={14} />
                                  )}
                                  <span>PDF Profil</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Desktop Table (hidden md:block) */}
                      <div className="hidden md:block w-full overflow-x-auto rounded-lg">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                              <th className="py-3 px-3">Nomor NIB</th>
                              <th className="py-3 px-3">Pelaku Usaha / Perusahaan</th>
                              <th className="py-3 px-3">Sektor / Proyek</th>
                              <th className="py-3 px-3">Skala Usaha</th>
                              <th className="py-3 px-3 text-right">Nilai Modal</th>
                              <th className="py-3 px-3">Status</th>
                              <th className="py-3 px-3 text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {nibIssuedTickets.map((tk) => {
                              const modalVal = Number(tk.investment_value || tk.nilai_investasi) || 0;
                              const isUmk = modalVal <= 5000000000;
                              return (
                                <tr key={tk.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                  <td className="py-3.5 px-3 font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">{tk.nib_number || '-'}</td>
                                  <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">{tk.company_name || tk.investor_name || tk.nama_investor || '-'}</td>
                                  <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300">{tk.sector || tk.potensi_name || '-'}</td>
                                  <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300 font-semibold">{isUmk ? 'Mikro & Kecil' : 'Menengah & Besar'}</td>
                                  <td className="py-3.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                                    {modalVal > 0 ? formatRupiahSingkat(modalVal) : '-'}
                                  </td>
                                  <td className="py-3.5 px-3 font-semibold text-emerald-700 dark:text-emerald-400">Terverifikasi</td>
                                  <td className="py-3.5 px-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleQuickExportProfilePdf(tk, 'Bidang Pelayanan Perizinan / OSS')}
                                      disabled={exportingProfileId === String(tk.id)}
                                      className="px-2.5 py-1.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white border border-emerald-500/20 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer disabled:opacity-60"
                                    >
                                      {exportingProfileId === String(tk.id) ? (
                                        <Loader2 size={12} className="animate-spin" />
                                      ) : (
                                        <Download size={12} />
                                      )}
                                      <span>PDF Profil</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })()
        ) : (activeTab === 'verify' || activeTab === 'permit_process') ? (
          <div className="py-4 sm:py-8 animate-in fade-in zoom-in-95 duration-300">
            <NibVerificationForm isDarkMode={true} />
          </div>
        ) : activeTab === 'loi_verify' ? (
          (() => {
            const waitingCount = loiTickets.filter(tk => !tk.status || tk.status === 'Menunggu Verifikasi' || tk.status === 'Menunggu Respon').length;
            const discussionCount = loiTickets.filter(tk => tk.status && !['Menunggu Verifikasi', 'Menunggu Respon', 'Izin Terbit / Realisasi', 'Ditolak / Batal'].includes(tk.status)).length;
            const dealCount = loiTickets.filter(tk => tk.status === 'Izin Terbit / Realisasi').length;
            const totalCommitment = loiTickets.reduce((sum, tk) => {
              const raw = Number(String(tk.investment_value || tk.nilai_investasi || 0).replace(/[^0-9.-]+/g, ''));
              return sum + (isNaN(raw) ? 0 : raw);
            }, 0);

            return (
              <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-surface/40 p-4 sm:p-6 border border-slate-200 dark:border-slate-800/80">
                  <div className="relative space-y-2">
                    <p className="text-[11px] font-bold tracking-wider uppercase text-purple-600 dark:text-purple-400">
                      Bidang Promosi &amp; Penanaman Modal
                    </p>
                    <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Tiket Minat Investor (Letter of Intent - LoI)</h1>
                    <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
                      Verifikasi permohonan minat investasi dari calon investor domestik dan luar negeri. Berikan tanggapan resmi dan fasilitasi pertemuan bisnis (B2B).
                    </p>
                  </div>
                </div>

                {/* Live Stats (Zero-Dummy) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-3.5 sm:p-5 rounded-2xl bg-white/90 dark:bg-surface/60 border border-slate-200/60 dark:border-white/5 shadow-sm space-y-1">
                    <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">LoI Baru Masuk</span>
                    <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-amber-700 dark:text-amber-400">{waitingCount} Tiket</div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-300">Menunggu Respon</div>
                  </div>
                  <div className="p-3.5 sm:p-5 rounded-2xl bg-white/90 dark:bg-surface/60 border border-slate-200/60 dark:border-white/5 shadow-sm space-y-1">
                    <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Nilai Komitmen</span>
                    <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-emerald-700 dark:text-emerald-400 truncate">
                      {totalCommitment > 0 ? formatRupiahSingkat(totalCommitment) : 'Rp 0'}
                    </div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-300">Total Akumulasi LoI</div>
                  </div>
                  <div className="p-3.5 sm:p-5 rounded-2xl bg-white/90 dark:bg-surface/60 border border-slate-200/60 dark:border-white/5 shadow-sm space-y-1">
                    <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Dalam Pembahasan</span>
                    <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-blue-700 dark:text-blue-400">{discussionCount} Investor</div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-300">Tahap Fasilitasi / Estafet</div>
                  </div>
                  <div className="p-3.5 sm:p-5 rounded-2xl bg-white/90 dark:bg-surface/60 border border-slate-200/60 dark:border-white/5 shadow-sm space-y-1">
                    <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Realisasi Terbit</span>
                    <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-purple-600 dark:text-purple-400">{dealCount} Proyek</div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-300">Selesai Perizinan</div>
                  </div>
                </div>

                {/* Dual-View LoI Queue */}
                <div className="p-4 sm:p-6 rounded-2xl bg-white/90 dark:bg-surface/60 border border-slate-200/60 dark:border-white/5 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Daftar Tiket Minat LoI Aktif</h3>

                  {loiTickets.length === 0 ? (
                    <EmptyState
                      title="Belum Ada Tiket LoI Masuk"
                      message="Data akan tampil secara otomatis ketika investor mengajukan minat investasi (Letter of Intent) melalui portal publik."
                    />
                  ) : (
                    <>
                      {/* Android Tap Cards (md:hidden) */}
                      <div className="md:hidden space-y-3">
                        {loiTickets.map((tk) => {
                          const sla = calculateSLA(tk.updated_at || tk.created_at);
                          const rawVal = Number(String(tk.investment_value || tk.nilai_investasi || 0).replace(/[^0-9.-]+/g, ''));
                          return (
                            <div key={tk.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <span className="font-mono tabular-nums text-[11px] font-bold text-purple-600 dark:text-purple-400 block">
                                    {tk.tiket_id || `LOI-${String(tk.id).substring(0, 6).toUpperCase()}`}
                                  </span>
                                  <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate mt-0.5">
                                    {tk.company_name || tk.nama_investor || tk.investor_name || 'Investor'}
                                  </h4>
                                </div>
                                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 shrink-0">
                                  {sla.badge}
                                </span>
                              </div>
                              <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-1.5">
                                <span>{tk.sector || tk.potensi_name || 'Belum Ditentukan'}</span>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                                  {rawVal > 0 ? formatRupiahSingkat(rawVal) : (tk.nilai_investasi ? `Rp ${tk.nilai_investasi}` : 'Belum Diinput')}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="font-semibold text-amber-700 dark:text-amber-400">{tk.status || 'Menunggu Respon'}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleQuickExportProfilePdf(tk, 'Bidang Promosi & Penanaman Modal')}
                                  disabled={exportingProfileId === String(tk.id)}
                                  className="min-h-[44px] px-2.5 py-2 bg-white dark:bg-slate-800 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white border border-emerald-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer disabled:opacity-60"
                                >
                                  {exportingProfileId === String(tk.id) ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <Download size={13} />
                                  )}
                                  <span>PDF</span>
                                </button>
                                <button
                                  onClick={() => handleEscalateLoiToPkkpr(tk)}
                                  className="min-h-[44px] px-2.5 py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white border border-emerald-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                                >
                                  <ShieldCheck size={13} />
                                  <span>PKKPR</span>
                                </button>
                                <button
                                  onClick={() => openActionModal(tk)}
                                  className="min-h-[44px] px-2.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                                >
                                  <span>Review</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Desktop Table (hidden md:block) */}
                      <div className="hidden md:block w-full overflow-x-auto rounded-lg">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                              <th className="py-3 px-3">ID Tiket</th>
                              <th className="py-3 px-3">Investor / Perusahaan</th>
                              <th className="py-3 px-3">Sektor Minat</th>
                              <th className="py-3 px-3 text-right">Nilai Investasi</th>
                              <th className="py-3 px-3">Status</th>
                              <th className="py-3 px-3">SLA Argometer</th>
                              <th className="py-3 px-3 text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {loiTickets.map((tk) => {
                              const sla = calculateSLA(tk.updated_at || tk.created_at);
                              const rawVal = Number(String(tk.investment_value || tk.nilai_investasi || 0).replace(/[^0-9.-]+/g, ''));
                              return (
                                <tr key={tk.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                  <td className="py-3.5 px-3 font-mono tabular-nums font-bold text-purple-600 dark:text-purple-400">
                                    {tk.tiket_id || `LOI-${String(tk.id).substring(0, 6).toUpperCase()}`}
                                  </td>
                                  <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">
                                    {tk.company_name || tk.nama_investor || tk.investor_name || '-'}
                                  </td>
                                  <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300">
                                    {tk.sector || tk.potensi_name || '-'}
                                  </td>
                                  <td className="py-3.5 px-3 text-right font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                                    {rawVal > 0 ? formatRupiahSingkat(rawVal) : (tk.nilai_investasi ? `Rp ${tk.nilai_investasi}` : '-')}
                                  </td>
                                  <td className="py-3.5 px-3 font-semibold text-amber-700 dark:text-amber-400">
                                    {tk.status || 'Menunggu Respon'}
                                  </td>
                                  <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                                    {sla.badge}
                                  </td>
                                  <td className="py-3.5 px-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleQuickExportProfilePdf(tk, 'Bidang Promosi & Penanaman Modal')}
                                        disabled={exportingProfileId === String(tk.id)}
                                        title="Unduh Laporan PDF Profil Investasi (Kop Pemkab Luwu)"
                                        className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white rounded-lg font-bold text-[11px] border border-emerald-500/20 transition inline-flex items-center gap-1 cursor-pointer disabled:opacity-60"
                                      >
                                        {exportingProfileId === String(tk.id) ? (
                                          <Loader2 size={12} className="animate-spin" />
                                        ) : (
                                          <Download size={12} />
                                        )}
                                        <span>PDF</span>
                                      </button>
                                      <button
                                        onClick={() => handleEscalateLoiToPkkpr(tk)}
                                        className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-700 dark:text-emerald-400 hover:text-white rounded-lg font-bold text-[11px] border border-emerald-500/20 transition flex items-center gap-1 cursor-pointer"
                                        title="Fasilitasi & Daftarkan Izin PKKPR Clean & Clear untuk Investor Ini"
                                      >
                                        <ShieldCheck size={12} />
                                        <span>Ajukan PKKPR</span>
                                      </button>
                                      <button
                                        onClick={() => openActionModal(tk)}
                                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-[11px] transition cursor-pointer"
                                      >
                                        Review &amp; Balas LoI
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })()
        ) : activeTab === 'manage_potential' ? (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-surface/40 p-4 sm:p-6 border border-slate-200 dark:border-slate-800/80">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
                    Database IPRO Kabupaten Luwu
                  </p>
                  <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Kelola Potensi Investasi Unggulan</h1>
                  <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm max-w-2xl">
                    Atur dan publikasikan lokasi proyek investasi siap tawar (Investment Project Ready to Offer - IPRO) Kabupaten Luwu.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsAddIproModalOpen(true);
                  }}
                  className="w-full sm:w-auto min-h-[44px] justify-center px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl text-xs transition flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Plus size={18} />
                  <span>Tambah Potensi Baru (IPRO)</span>
                </button>
              </div>
            </div>

            {/* Opportunities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {investments.length > 0 ? (
                investments.map((inv) => (
                  <div key={inv.id} className="rounded-2xl bg-white/90 dark:bg-surface/60 border border-slate-200/60 dark:border-white/5 shadow-sm p-4 sm:p-5 space-y-4 hover:border-emerald-500/40 transition flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">{(inv as any).sektor || inv.sector || 'Sektor'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium truncate">{(inv as any).kecamatan || inv.districtId || 'Kabupaten Luwu'}</span>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">{(inv as any).judul_peluang || inv.name}</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-1">{(inv as any).deskripsi_singkat || (inv as any).description || 'Prospek investasi strategis Kabupaten Luwu'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">{formatRupiahSingkat(inv.investmentValue || (inv as any).estimasi_investasi || 0)}</span>
                        <button
                          onClick={() => setSelectedInvestmentId(inv.id)}
                          className="min-h-[40px] px-2.5 text-cyan-600 dark:text-cyan-400 font-bold hover:underline cursor-pointer flex items-center"
                        >
                          Detail &amp; Peta →
                        </button>
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuickExportProfilePdf(inv, 'Bidang Promosi & Penanaman Modal')}
                          disabled={exportingProfileId === String(inv.id)}
                          className="min-h-[40px] px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 text-slate-800 dark:text-slate-200 hover:text-white rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
                          title="Unduh Laporan PDF Profil Investasi berlogo Pemkab Luwu"
                        >
                          {exportingProfileId === String(inv.id) ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Download size={13} />
                          )}
                          <span>PDF Profil</span>
                        </button>
                        <button
                          onClick={() => handleProactivePkkprForPotensi(inv)}
                          className="min-h-[40px] px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                          title="Daftarkan telaah tata ruang & LP2B secara proaktif untuk potensi ini"
                        >
                          <ShieldCheck size={13} className="text-amber-300 shrink-0" />
                          <span>Sertifikasi Clean &amp; Clear</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full">
                  <EmptyState
                    title="Belum Ada Data Potensi IPRO"
                    message="Belum ada data potensi investasi yang dipublikasikan. Klik tombol Tambah Potensi Baru untuk menambahkan IPRO."
                  />
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'manage_kpbu' ? (
          <AdminKpbuManager isDark={isDark} />
        ) : ['pengaduan', 'pengawasan', 'fasilitasi', 'laporan', 'field_inspection'].includes(activeTab) ? (
          <DalakWorkspaceView activeTab={activeTab} setActiveTab={setActiveTab} investments={investments} districts={districts} onSelectInvestment={setSelectedInvestmentId} />
        ) : activeTab === 'komoditas' ? (
          <div className="animate-in fade-in duration-500 w-full space-y-6">
             <AdminCommodityPrices />
          </div>
        ) : activeTab === 'site-selection' ? (
          <div className="py-4 sm:py-8 animate-in fade-in zoom-in-95 duration-300 h-[calc(100vh-140px)] md:h-[calc(100vh-100px)]">
            <AISiteSelection />
          </div>
        ) : activeTab === 'simulation' ? (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 1. Page Header (Intelegensi Bisnis) */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-surface/40 p-4 sm:p-6 border border-slate-200 dark:border-slate-800/80">
              <div className="relative space-y-2">
                <p className="text-[11px] font-bold tracking-wider uppercase text-cyan-600 dark:text-cyan-400">
                  Simulasi Kelayakan Finansial &amp; Spasial
                </p>
                <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t('business_intelligence', 'Intelegensi Bisnis')}</h1>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
                  {t('business_intel_desc', 'Lakukan simulasi finansial mendalam dan dapatkan proyeksi kelayakan investasi Kabupaten Luwu secara real-time.')}
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

                  // Official Pemkab Luwu & DPMPTSP Kop Surat Header
                  try {
                    doc.addImage(LUWU_LOGO_BASE64, 'PNG', 15, 10, 18, 18);
                  } catch (logoErr) {
                    console.warn('[Simulator PDF] Logo embed warning:', logoErr);
                  }

                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(11);
                  doc.setTextColor(15, 23, 42);
                  doc.text('PEMERINTAH KABUPATEN LUWU', (pageWidth + 18) / 2, 14, { align: 'center' });

                  doc.setFontSize(12);
                  doc.text('DINAS PENANAMAN MODAL DAN PELAYANAN TERPADU SATU PINTU', (pageWidth + 18) / 2, 20, { align: 'center' });

                  doc.setFont('helvetica', 'normal');
                  doc.setFontSize(8);
                  doc.setTextColor(71, 85, 105);
                  doc.text(
                    'Jl. Jenderal Sudirman No. 1 Kompleks Perkantoran Pemkab Luwu, Belopa 91994 • dpmptsp@luwukab.go.id',
                    (pageWidth + 18) / 2,
                    25,
                    { align: 'center' }
                  );

                  // Double official Kop line
                  doc.setDrawColor(15, 23, 42);
                  doc.setLineWidth(0.8);
                  doc.line(15, 31, pageWidth - 15, 31);
                  doc.setLineWidth(0.25);
                  doc.line(15, 32.2, pageWidth - 15, 32.2);

                  let currentY = 41;

                  // Document Title
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(13);
                  doc.setTextColor(15, 23, 42);
                  doc.text('PROSPEKTUS & SIMULASI KELAYAKAN FINANSIAL INVESTASI', pageWidth / 2, currentY, { align: 'center' });

                  currentY += 5;
                  doc.setFont('helvetica', 'normal');
                  doc.setFontSize(9);
                  doc.setTextColor(5, 150, 105);
                  doc.text(`Unit Penerbit: ${formatRoleLabel(userRole)}`, pageWidth / 2, currentY, { align: 'center' });

                  // Metadata Section
                  currentY += 9;
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(10);
                  doc.setTextColor(15, 23, 42);
                  doc.text('INFORMASI PROPOSAL & SIMULASI', 15, currentY);

                  currentY += 6.5;
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(9.5);
                  doc.setTextColor(71, 85, 105);
                  doc.text('Instansi / Pelaku Usaha:', 15, currentY);
                  doc.setFont('helvetica', 'normal');
                  doc.setTextColor(15, 23, 42);
                  doc.text(companyName.trim() || 'Simulasi Internal DPMPTSP Kab. Luwu', 70, currentY);

                  currentY += 5.5;
                  doc.setFont('helvetica', 'bold');
                  doc.setTextColor(71, 85, 105);
                  doc.text('Potensi Investasi Target:', 15, currentY);
                  doc.setFont('helvetica', 'normal');
                  doc.setTextColor(15, 23, 42);
                  const matchedInv = investments.find(inv => inv.id === targetPotential || inv.name.toLowerCase().replace(/\s+/g, '_') === targetPotential);
                  const targetNameText = matchedInv ? `${matchedInv.name} (${matchedInv.sector})` : 'Simulasi Potensi Investasi Kabupaten Luwu';
                  doc.text(targetNameText.slice(0, 65), 70, currentY);

                  currentY += 5.5;
                  doc.setFont('helvetica', 'bold');
                  doc.setTextColor(71, 85, 105);
                  doc.text('Tanggal Penerbitan:', 15, currentY);
                  doc.setFont('helvetica', 'normal');
                  doc.setTextColor(15, 23, 42);
                  doc.text(`Belopa, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 70, currentY);

                  // Simulation parameter values box
                  currentY += 8;
                  doc.setFillColor(248, 250, 252);
                  doc.setDrawColor(203, 213, 225);
                  doc.roundedRect(15, currentY, pageWidth - 30, 26, 2.5, 2.5, 'FD');

                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(8.5);
                  doc.setTextColor(15, 23, 42);
                  doc.text('ASUMSI & PARAMETER SIMULASI FINANSIAL:', 20, currentY + 6);

                  doc.setFont('helvetica', 'normal');
                  doc.setTextColor(51, 65, 85);
                  doc.text(`CAPEX: Rp ${formatRupiah(numCapex)}`, 20, currentY + 12);
                  doc.text(`OPEX per Tahun: Rp ${formatRupiah(numOpex)}`, 20, currentY + 17.5);
                  doc.text(`Pendapatan Tahunan: Rp ${formatRupiah(numRevenue)}`, 20, currentY + 23);

                  doc.text(`Suku Bunga Diskonto (WACC): ${discountRate}%`, 115, currentY + 12);
                  doc.text(`Tenor Proyeksi: ${tenor} Tahun`, 115, currentY + 17.5);
                  doc.text(`Laju Inflasi Tahunan: ${inflationRate}%`, 115, currentY + 23);

                  // Capture and embed the financial results grid
                  currentY += 32;

                  const resultsElement = document.getElementById('financial-simulator-results-export');
                  if (resultsElement) {
                    const resultsElementReady = await waitForDomAndIdle(resultsElement, 3000);
                    const canvas = await pdfRenderQueue.enqueue(() => safeHtml2Canvas(resultsElementReady, {
                      scale: 2,
                      useCORS: true,
                      backgroundColor: '#090d16',
                    }));
                    const imgData = canvas.toDataURL('image/png');
                    const imgWidth = pageWidth - 30;
                    const maxImgHeight = pageHeight - currentY - 20;
                    const rawImgHeight = (canvas.height * imgWidth) / canvas.width;
                    const finalHeight = Math.min(rawImgHeight, maxImgHeight);
                    
                    doc.addImage(imgData, 'PNG', 15, currentY, imgWidth, finalHeight);
                  }

                  // Official Footer
                  doc.setDrawColor(203, 213, 225);
                  doc.setLineWidth(0.3);
                  doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
                  doc.setFont('helvetica', 'italic');
                  doc.setFontSize(7.5);
                  doc.setTextColor(100, 116, 139);
                  doc.text(
                    'Dokumen resmi diterbitkan melalui Sistem Informasi Geospasial & Pelayanan Investasi DPMPTSP Kabupaten Luwu.',
                    pageWidth / 2,
                    pageHeight - 10,
                    { align: 'center' }
                  );

                  doc.save('Simulasi_Kelayakan_Investasi_Kab_Luwu.pdf');

                  Swal.fire({
                    title: 'Proposal Berhasil Diunduh!',
                    text: 'Dokumen simulasi PDF berlogo resmi Pemkab Luwu siap dibagikan.',
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
                <div className="space-y-6 sm:space-y-8 pb-12 sm:pb-24">
                  {/* 2. Form Section (Simulator Return on Investment) */}
                  <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-surface/50 border border-slate-200 dark:border-slate-800 space-y-5 sm:space-y-6">
                    <div>
                      <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">{t('roi_simulator', 'Simulator Return on Investment (ROI)')}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{t('roi_simulator_desc', 'Sesuaikan nilai investasi dan asumsi makro untuk memprediksi profitabilitas secara real-time.')}</p>
                    </div>

                    {/* Target Potensi Investasi (Full Width Select) */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
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
                        className="w-full min-h-[48px] px-4 py-3 bg-white text-gray-900 border border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white dark:border-slate-600 rounded-xl text-base sm:text-sm outline-none transition-colors font-semibold"
                      >
                        <option value="simulasi_umum_luwu">Simulasi Potensi Investasi Kabupaten Luwu (Default)</option>
                        {investments.filter(Boolean).filter((inv, idx, arr) => arr.findIndex(x => (x.id || x.name) === (inv.id || inv.name)) === idx).map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.name} ({inv.sector}) - {formatRupiahSingkat(inv.investmentValue || 0)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Main Inputs */}
                    <div className={`${isUsingOSS ? "space-y-5" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-start"} w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface/40 rounded-2xl p-4 sm:p-6`}>
                      <div className={isUsingOSS ? "w-full" : "md:col-span-2"}>
                        <OssRoiSimulatorInputs
                            sector={investments.find(inv => inv.id === targetPotential || inv.name.toLowerCase().replace(/\s+/g, '_') === targetPotential)?.sector || null}
                            capital={capex}
                            setCapital={setCapex}
                            opex={opex}
                            setOpex={setOpex}
                            isDark={true}
                            textMuted="text-slate-600 dark:text-slate-300"
                            inputBg="bg-slate-50 dark:bg-base text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 focus:border-cyan-500/50"
                            useDetailed={isUsingOSS}
                            setUseDetailed={setIsUsingOSS}
                        />
                      </div>

                      {/* Revenue Input */}
                      <div className={`space-y-2 ${isUsingOSS ? "w-full pt-4 border-t border-slate-200 dark:border-slate-800" : ""}`}>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                          {t('est_revenue', 'Estimasi Pendapatan Tahunan')}
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 text-xs font-mono font-bold">Rp</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            value={revenue}
                            onFocus={(e) => {
                              e.target.select();
                              setRevenue("");
                            }}
                            onChange={(e) => setRevenue(e.target.value)}
                            className="w-full min-h-[48px] pl-10 pr-4 py-3 bg-slate-50 dark:bg-base border border-slate-200 dark:border-slate-800 focus:border-cyan-500/50 rounded-xl text-slate-900 dark:text-white text-base sm:text-sm focus:outline-none transition-colors font-mono tabular-nums font-bold"
                            placeholder="1800000000"
                          />
                        </div>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono tabular-nums tracking-tight pl-1">
                          {formatRupiah(numRevenue)} {numRevenue > 0 ? `(${formatRupiahSingkat(numRevenue)})` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Advanced Parameters (3 Columns) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 items-start w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface/40 rounded-2xl p-4 sm:p-5">
                      {/* WACC */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
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
                            className="w-full min-h-[48px] px-4 py-3 bg-slate-50 dark:bg-base border border-slate-200 dark:border-slate-800 focus:border-cyan-500/50 rounded-xl text-slate-900 dark:text-white text-base sm:text-sm focus:outline-none transition-colors font-mono tabular-nums font-bold"
                            placeholder="10"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 text-xs font-mono font-bold">%</span>
                        </div>
                      </div>

                      {/* Tenor */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
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
                            className="w-full min-h-[48px] px-4 py-3 bg-slate-50 dark:bg-base border border-slate-200 dark:border-slate-800 focus:border-cyan-500/50 rounded-xl text-slate-900 dark:text-white text-base sm:text-sm focus:outline-none transition-colors font-mono tabular-nums font-bold"
                            placeholder="5"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 text-xs font-mono font-bold">Thn</span>
                        </div>
                      </div>

                      {/* Inflation */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
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
                            className="w-full min-h-[48px] px-4 py-3 bg-slate-50 dark:bg-base border border-slate-200 dark:border-slate-800 focus:border-cyan-500/50 rounded-xl text-slate-900 dark:text-white text-base sm:text-sm focus:outline-none transition-colors font-mono tabular-nums font-bold"
                            placeholder="4.5"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 text-xs font-mono font-bold">%</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button Container */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full pt-2">
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
                        className="flex-1 min-h-[48px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer text-sm w-full"
                      >
                        <Calculator size={18} className="text-white shrink-0" />
                        <span>{t('dashboard.calculateViabilityBtn', 'Hitung Prediksi Kelayakan')}</span>
                      </button>

                      <button
                        type="button"
                        disabled={simRunCount === 0 || isPdfGenerating}
                        onClick={handleDownloadPDF}
                        className={`flex-1 min-h-[48px] font-bold py-3 px-4 rounded-xl transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer text-sm border ${
                          simRunCount === 0 
                            ? 'border-slate-200 dark:border-slate-800 text-slate-400 bg-white dark:bg-surface/20 cursor-not-allowed opacity-60' 
                            : 'border-emerald-500/80 hover:border-emerald-400 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                        }`}
                      >
                        {isPdfGenerating ? (
                          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0"></div>
                        ) : (
                          <FileText size={18} className={simRunCount === 0 ? "text-slate-400 shrink-0" : "text-emerald-700 dark:text-emerald-400 shrink-0"} />
                        )}
                        <span>{isPdfGenerating ? t('dashboard.generatingPdf', 'Membuat Proposal...') : t('dashboard.downloadProposalBtn', 'Unduh Proposal Investasi (PDF)')}</span>
                      </button>
                    </div>
                  </div>

                  {/* 3. Results Grid (6 Metric Cards) */}
                  <div id="financial-simulator-results-export" className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-base p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
                    {/* Card 1: Estimasi ROI */}
                    <div 
                      id="rata-rata-roi-card"
                      className={`relative rounded-3xl border p-6 group transition-all duration-300 ${
                        roiFlash 
                          ? 'bg-emerald-500/20 border-emerald-500/50 scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                          : 'bg-white dark:bg-surface/40 border-slate-200 dark:border-slate-800 hover:border-slate-700'
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
                    <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface/40 p-6 group transition-all duration-300 hover:border-slate-700">
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
                    <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface/40 p-6 group transition-all duration-300 hover:border-slate-700">
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
                    <div className={`relative overflow-hidden rounded-3xl border p-6 group transition-all duration-300 ${npv > 0 ? 'border-emerald-500/20 bg-white dark:bg-surface/40 hover:border-emerald-500/40' : 'border-rose-500/20 bg-white dark:bg-surface/40 hover:border-rose-500/40'}`}>
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
                    <div className={`relative overflow-hidden rounded-3xl border p-6 group transition-all duration-300 ${irr > numWacc ? 'border-emerald-500/20 bg-white dark:bg-surface/40 hover:border-emerald-500/40' : 'border-rose-500/20 bg-white dark:bg-surface/40 hover:border-rose-500/40'}`}>
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
                  <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-surface/50 border border-slate-200 dark:border-slate-800 space-y-6">
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
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-base/40 border border-slate-200 dark:border-slate-800 space-y-3">
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
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                    <button
                      type="button"
                      onClick={triggerAiAnalysis}
                      className="flex-1 min-h-[48px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                    >
                      <Sparkles size={16} className="text-cyan-200 shrink-0" />
                      <span>Minta Analisis Kelayakan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('overview')}
                      className="flex-1 min-h-[48px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold py-3.5 px-6 rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm"
                    >
                      <Map size={16} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
                      <span>Kembali ke Ringkasan Potensi</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (activeTab === 'puptr_spatial_editor' || activeTab === 'spatial_editor') ? (
          <PuptrSpatialEditorDashboard
            currentRole={userRole as any}
            isDarkMode={true}
            onRefreshAllData={refreshData}
            spatialLayers={spatialLayers}
            setSpatialLayers={setSpatialLayers}
            districts={districts}
            villages={villages}
          />
        ) : activeTab === 'spatial_analytics' ? (
          <SpatialAnalyticsEditorView userRole={userRole} isDarkMode={true} />
        ) : activeTab === 'gis_spatial' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Tata Ruang, Layer Spasial & PostGIS Sync */}
            <TataRuangInvestasi />

            {/* Upload Layer GeoJSON Baru */}
            <div className="p-6 rounded-3xl bg-white/90 dark:bg-surface/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <UploadGeoJsonPanel onUploadSuccess={() => refreshData()} isDarkMode={true} />
            </div>
          </div>
        ) : activeTab === 'rag_injection' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <UploadRagPanel isDarkMode={true} />
          </div>
        ) : activeTab === 'manage_operators' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-surface/40 p-4 sm:p-6 border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-[11px] font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400">
                  Otoritas Operator &amp; User
                </p>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">Kelola Akun Operator Dinas</h1>
                <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">Tambah, edit, dan atur hak akses operator OPD &amp; petugas pelayanan terpadu Kabupaten Luwu.</p>
              </div>
              <button
                onClick={() => setIsCreateOperatorOpen(true)}
                className="w-full sm:w-auto min-h-[44px] justify-center px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Users size={16} />
                <span>Tambah Operator Baru</span>
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-surface/60 p-4 sm:p-6">
              <ManageOperatorsModal onClose={() => setActiveTab('overview')} />
            </div>
          </div>
        ) : activeTab === 'grp_architecture' ? (
          <GRPArchitectureModal isOpen={true} onClose={() => setActiveTab('overview')} isDarkMode={true} />
        ) : (activeTab === 'manage_users' || activeTab === 'citizen_management' || activeTab === 'helpdesk_users' || activeTab === 'user_management') ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <AdminUserManagement isDarkMode={true} />
          </div>
        ) : activeTab === 'mpp_portal' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <AdminLayout />
          </div>
        ) : activeTab === 'testimonials' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">{t('submit_testimonial', 'Kirim Testimoni')}</h1>
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">{t('testimonial_desc', 'Sampaikan cerita sukses atau tanggapan Anda mengenai ekosistem investasi di Kabupaten Luwu.')}</p>
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
                    const { error } = await supabase
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
                className="lg:col-span-3 p-4 sm:p-6 rounded-2xl bg-white/90 dark:bg-surface/60 border border-slate-200/60 dark:border-white/5 shadow-sm space-y-5"
              >
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">{t('investor_feedback', 'Umpan Balik Investor')}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{t('investor_feedback_desc', 'Pesan Anda akan ditampilkan di Landing Page utama setelah proses peninjauan.')}</p>
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
                    className="w-full min-h-[48px] bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-700 dark:text-slate-300 cursor-not-allowed opacity-80 focus:ring-0 text-base sm:text-sm"
                    placeholder="Nama Instansi / Investor"
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
                    className="w-full min-h-[48px] px-4 py-2.5 bg-white text-gray-900 border border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white dark:border-slate-600 rounded-xl text-base sm:text-sm outline-none transition-colors"
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
                    className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white dark:border-slate-600 rounded-xl text-base sm:text-sm outline-none transition-colors"
                    placeholder={t('dashboard.testiMessagePlaceholder', 'Ceritakan kesan Anda terhadap layanan penanaman modal Kabupaten Luwu...')}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingTesti}
                  className="w-full min-h-[48px] py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
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
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white/90 dark:bg-surface/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 space-y-6">
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

                <div className="p-4 bg-slate-50 dark:bg-base border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs">
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
        ) : (activeTab === 'verifikasi_bpn' || activeTab === 'bpn_clearance' || activeTab === 'admin_bpn' || activeTab === 'kantah_bpn') ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <AtrBpnLandClearanceDashboard />
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

      {/* Dalak Complaint Action Bottom-Sheet Modal */}
      {isDalakModalOpen && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            onClick={() => setIsDalakModalOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <form
            onSubmit={handleSaveDalakFollowUp}
            className="relative w-full max-w-4xl max-h-[92dvh] rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10 flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
          >
            {/* Mobile Drag Handle */}
            <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

            {/* Sticky Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">Tindak Lanjut &amp; Mediasi Lapangan</h3>
                  <p className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 truncate">
                    ID Tiket: {selectedComplaint.tiket_id || `LAPOR-${String(selectedComplaint.id).substring(0, 6).toUpperCase()}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDalakModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                {/* LEFT COLUMN: EVIDENCE */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="p-1.5 bg-rose-500/10 text-rose-700 dark:text-rose-400 rounded-lg"><Activity size={14} /></span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider">Bukti &amp; Uraian Kejadian</h4>
                  </div>

                  {selectedComplaint.bukti_foto_url ? (
                    <div className="space-y-1.5">
                      <label className="text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold block text-[10px]">Bukti Foto Lapangan</label>
                      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                        <img
                          src={selectedComplaint.bukti_foto_url}
                          referrerPolicy="no-referrer"
                          className="w-full h-44 object-cover"
                          alt="Bukti aduan lapangan"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-36 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-500 flex-col gap-2">
                      <MessageSquare size={22} className="opacity-50" />
                      <span>Tidak ada lampiran foto</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold block text-[10px]">Detil Pengaduan / Uraian Kejadian</label>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 leading-relaxed max-h-32 overflow-y-auto">
                      &ldquo;{selectedComplaint.deskripsi_masalah || selectedComplaint.project_name || selectedComplaint.business_sector || '-'}&rdquo;
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-mono">Identitas Pelapor</span>
                      <span className="font-semibold text-slate-900 dark:text-white text-xs">
                        {selectedComplaint.is_anonim ? 'Anonim (Dirahasiakan)' : (selectedComplaint.nama_pelapor || selectedComplaint.company_name || '-')}
                      </span>
                    </div>
                    <div>
                      <span className="text-emerald-700 dark:text-emerald-400 block text-[10px] uppercase font-mono font-bold">Kontak (WA)</span>
                      <span className="font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400 text-xs">
                        {selectedComplaint.is_anonim ? '***' : (selectedComplaint.kontak_pelapor || 'Tidak tersedia')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: SPATIAL & ACTION */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="p-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg"><MapPin size={14} /></span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider">Geospasial &amp; Resolusi</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block font-bold mb-0.5">Lokasi Insiden</span>
                      <div className="text-slate-900 dark:text-white font-semibold truncate">Kec. {selectedComplaint.lokasi_kejadian || 'Belum Diset'}</div>
                      {selectedComplaint.perusahaan_terkait && (
                        <div className="text-slate-600 dark:text-slate-300 text-[10px] truncate mt-0.5">Terkait: {selectedComplaint.perusahaan_terkait}</div>
                      )}
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block font-bold mb-0.5">Koordinat GPS</span>
                      <div className="text-cyan-600 dark:text-cyan-400 font-mono tabular-nums text-[11px]">Lat: {selectedComplaint.latitude || '-'}</div>
                      <div className="text-cyan-600 dark:text-cyan-400 font-mono tabular-nums text-[11px]">Lng: {selectedComplaint.longitude || '-'}</div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Ubah Status Progress</label>
                    <select
                      value={dalakStatus}
                      onChange={(e) => setDalakStatus(e.target.value)}
                      className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border bg-white text-gray-900 border-gray-300 focus:border-emerald-500 dark:bg-slate-800 dark:text-white dark:border-slate-700 font-bold text-base sm:text-xs cursor-pointer outline-none transition-colors"
                    >
                      <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                      <option value="Tinjauan Lapangan">Tinjauan Lapangan</option>
                      <option value="Proses Mediasi">Proses Mediasi</option>
                      <option value="Selesai">Selesai (Kasus Ditutup)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Catatan Hasil Investigasi Lapangan</label>
                    <textarea
                      value={dalakLaporan}
                      onChange={(e) => setDalakLaporan(e.target.value)}
                      rows={3}
                      placeholder="Masukkan log operasional, hasil mediasi, atau keputusan di lapangan..."
                      className="w-full p-3.5 rounded-xl border bg-white text-gray-900 border-gray-300 focus:border-emerald-500 dark:bg-slate-800 dark:text-white dark:border-slate-700 leading-relaxed text-base sm:text-xs outline-none transition-colors font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Jadwal Kunjungan Lapangan (Opsional)</label>
                    <input
                      type="datetime-local"
                      value={dalakSiteVisit}
                      onChange={(e) => setDalakSiteVisit(e.target.value)}
                      className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border bg-white text-gray-900 border-gray-300 focus:border-emerald-500 dark:bg-slate-800 dark:text-white dark:border-slate-700 font-mono text-base sm:text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* BAP SATGAS WIDGET */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    Log Keputusan &amp; Berita Acara (BAP) Satgas
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsBapModalOpen(true)}
                    className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px] justify-center px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 border border-rose-500/20 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Buat Berita Acara (BAP)</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {loadingSatgas ? (
                    <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">Memuat log keputusan...</div>
                  ) : satgasDecisions.length === 0 ? (
                    <EmptyState
                      title="Belum Ada Berita Acara"
                      message="Belum ada Berita Acara / Keputusan Satgas untuk tiket ini."
                    />
                  ) : (
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {satgasDecisions.map((dec) => (
                        <div key={dec.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col gap-1.5">
                          <div className="flex justify-between items-center gap-2">
                            <span className={`text-[11px] font-bold uppercase tracking-wider ${
                              dec.status_eskalasi === 'Normal' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            }`}>
                              {dec.status_eskalasi}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                              {new Date(dec.created_at).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            {dec.catatan_rapat}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Bottom Footer */}
            <div className="flex gap-3 justify-end px-4 sm:px-6 py-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))] sm:pb-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <button
                type="button"
                onClick={() => setIsDalakModalOpen(false)}
                className="min-h-[48px] px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSavingDalak}
                className="flex-1 sm:flex-initial min-h-[48px] justify-center px-6 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                {isSavingDalak && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Simpan Progress</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BAP Satgas Creation Bottom-Sheet Modal */}
      {isBapModalOpen && selectedComplaint && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div onClick={() => setIsBapModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <form
            onSubmit={handleSaveBap}
            className="relative w-full max-w-lg max-h-[90dvh] rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10 flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
          >
            <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Buat Berita Acara (BAP) Satgas</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Catat hasil keputusan rapat tim Satgas Percepatan Investasi</p>
              </div>
              <button
                type="button"
                onClick={() => setIsBapModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Status Eskalasi Keputusan</label>
                <select
                  value={bapEskalasi}
                  onChange={(e) => setBapEskalasi(e.target.value)}
                  className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border bg-white text-gray-900 border-gray-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 text-base sm:text-xs font-semibold outline-none"
                >
                  <option value="Normal">Normal (Penyelesaian Internal Bidang)</option>
                  <option value="Eskalasi Lintas OPD">Eskalasi Lintas OPD Teknis</option>
                  <option value="Rapat Satgas Bupati">Eskalasi Rapat Khusus Satgas Daerah</option>
                  <option value="Selesai">Selesai &amp; Ditutup</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Risalah &amp; Catatan Keputusan Rapat</label>
                <textarea
                  value={bapCatatan}
                  onChange={(e) => setBapCatatan(e.target.value)}
                  rows={4}
                  required
                  placeholder="Tuliskan poin kesepakatan, rekomendasi teknis, dan tenggat tindak lanjut..."
                  className="w-full p-3.5 rounded-xl border bg-white text-gray-900 border-gray-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 text-base sm:text-xs outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end px-4 sm:px-6 py-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))] sm:pb-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <button
                type="button"
                onClick={() => setIsBapModalOpen(false)}
                className="min-h-[48px] px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSavingBap}
                className="flex-1 sm:flex-initial min-h-[48px] justify-center px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                {isSavingBap && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Simpan Berita Acara</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SLA Notifications Bottom-Sheet Modal */}
      {isSlaDropdownOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div onClick={() => setIsSlaDropdownOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg max-h-[88dvh] rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10 flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Pemantauan Argometer SLA</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Daftar berkas yang mendekati atau melewati batas waktu layanan</p>
              </div>
              <button
                type="button"
                onClick={() => setIsSlaDropdownOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {slaAnalysis.alerts.length === 0 ? (
                <EmptyState
                  title="Seluruh SLA Berjalan Aman"
                  message="Tidak ada tiket permohonan atau pengaduan yang melampaui ambang waktu layanan."
                />
              ) : (
                slaAnalysis.alerts.map((alert) => (
                  <button
                    key={`${alert.type}-${alert.id}`}
                    type="button"
                    onClick={() => {
                      setIsSlaDropdownOpen(false);
                      if (alert.type === 'complaint') {
                        openDalakModal(alert.original);
                      } else {
                        openActionModal(alert.original);
                      }
                    }}
                    className="w-full text-left p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 space-y-1.5 transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">{alert.title}</span>
                      <span className="font-mono tabular-nums text-[11px] font-bold text-amber-600 dark:text-amber-400 shrink-0">{alert.badge}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{alert.sub} · {alert.status}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Viability Analysis Bottom-Sheet Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div onClick={() => setIsAiModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl max-h-[90dvh] rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10 flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Kajian Kelayakan Finansial &amp; Spasial</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Ringkasan analisis kelayakan investasi Kabupaten Luwu</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {isAiLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-600 dark:text-slate-300">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
                  <p className="text-xs sm:text-sm font-semibold">Menyusun kajian kelayakan finansial &amp; kesesuaian ruang...</p>
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  {aiAnalysisResult || 'Belum ada hasil kajian.'}
                </div>
              )}
            </div>
            <div className="flex justify-end px-4 sm:px-6 py-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))] sm:pb-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                Tutup Kajian
              </button>
            </div>
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4">
          <div className="w-full max-w-6xl max-h-[94dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-slate-900 border border-slate-800 p-3 sm:p-4 relative shadow-2xl">
            <div className="w-10 h-1.5 bg-slate-700 rounded-full mx-auto mb-2 sm:hidden" />
            <button
              onClick={() => setIsAddIproModalOpen(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 min-h-[44px] min-w-[44px] flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-colors cursor-pointer"
              aria-label="Tutup Form IPRO"
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

      {/* Four Bidang Synchronized Workflow & Timeline Modal */}
      <FourBidangSyncWorkflowModal 
        isOpen={isSyncWorkflowModalOpen} 
        onClose={() => setIsSyncWorkflowModalOpen(false)} 
        userRole={userRole || 'admin_promosi'}
      />

      {/* Estafet Handover Lintas Bidang Modal */}
      <EstafetHandoverModal
        isOpen={isEstafetModalOpen}
        onClose={() => setIsEstafetModalOpen(false)}
        ticket={selectedEstafetTicket}
        currentRole={userRole || 'admin_promosi'}
        onSuccess={() => {
          refreshData();
        }}
      />

      {/* Fixed Role-Aware Android Bottom Navigation Bar */}
      <AdminMobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        badges={{
          loi_verify: loiTickets.filter(tk => tk.status === 'Menunggu Verifikasi').length,
          overview_perizinan: loiTickets.filter(tk => tk.status === 'Mediasi Lapangan Selesai' || tk.status === 'Verifikasi OSS Berjalan').length,
          pengaduan: complaints.filter(c => !c.status || c.status === 'Menunggu Verifikasi' || c.status === 'Diproses').length,
        }}
      />
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

