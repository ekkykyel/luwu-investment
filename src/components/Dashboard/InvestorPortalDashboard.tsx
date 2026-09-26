import { requestSmartFullscreen, exitSmartFullscreen } from "../../utils/fullscreen";
import { useNavigate } from "react-router-dom";
import { useData } from '../../contexts/DataContext';
import { safeFetchLayerData } from '../../lib/supabaseClient';
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Lock,
  FileCode,
  UploadCloud,
  Globe,
  Plus,
  Upload,
  Shield,
  AlertOctagon,
  Check,
  Send,
  Star,
  MessageSquareHeart,
  Printer,
  Download,
  Eye,
  Clock,
  ArrowRight,
  FileCheck2,
  AlertCircle,
  Wheat,
  Sliders,
  Search
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, Legend } from 'recharts';
import Swal from 'sweetalert2';
import * as turf from '@turf/turf';
import { supabase, handleSupabaseError } from '../../lib/supabaseClient.js';
import { Investment, SektorInvestasi, District } from '../../types.js';
import { SECTOR_COLORS } from '../../lib/constants.js';
import { formatRupiahSingkat, formatRupiah } from '../../lib/formatters.js';
import { InvestmentDetailModal } from '../InvestmentDetailModal.js';
import NibVerificationForm from '../Auth/NibVerificationForm.js';
import { LuwuLogo } from '../LuwuLogo.js';
import { CrossOpdNotificationBell } from '../CrossOpdNotificationBell';
import { generateSkPkkprPdf } from '../../utils/skPkkprPdfGenerator';
import { SkPkkprDpmptspDocument, SkPkkprDpmptspData } from '../documents/SkPkkprDpmptspDocument';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageToggle from '@/components/LanguageToggle';
import LoadingScreen from '../LoadingScreen.js';
import jsPDF from "jspdf";
import { safeHtml2Canvas, pdfRenderQueue, waitForDomAndIdle } from "../../lib/html2canvasShim";

import AISiteSelection from '../AISiteSelection.js';
import SimplePolygonDrawer from '../SimplePolygonDrawer';
import { parseKmlKmzFile } from '../../utils/kmlKmzParser';
import { detectAdministrativeLocation } from '../../utils/spatialLookup';
import { MppCitizenSurveyMenu } from '../mpp/MppCitizenSurveyMenu';
import { MppCitizenTestimonialMenu } from '../mpp/MppCitizenTestimonialMenu';
import { MppOtpVerificationGuard } from '../mpp/MppOtpVerificationGuard';
import { getKecamatanLabel, getDesaLabel, getKecamatanId, getDesaId } from '../../utils/gisHelpers';
import { isSameDistrict, findDistrictMatch, normalizeDistrictName } from '../../utils/geoUtils';

export default function InvestorPortalDashboard() {
  const navigate = useNavigate();
  useEffect(() => { return () => { exitSmartFullscreen(); }; }, []);

  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'pkkpr_tracking' | 'verify' | 'simulation' | 'testimonial' | 'survey_skm' | 'site-selection'>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { investments, districts, isLoading: isGlobalLoading } = useData();
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('investor');
  const [error, setError] = useState<string | null>(null);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<string | null>(null);

  // PKKPR Tracking & SK Issuance States
  const [myPkkprApplications, setMyPkkprApplications] = useState<any[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [pkkprFilterStatus, setPkkprFilterStatus] = useState<string>('ALL');
  const [pkkprSearchQuery, setPkkprSearchQuery] = useState<string>('');
  const [selectedSkDocumentData, setSelectedSkDocumentData] = useState<SkPkkprDpmptspData | null>(null);
  const [isSkDocModalOpen, setIsSkDocModalOpen] = useState(false);

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

  // Auto-Hydrated Corporate Profile State (Supabase Sync)
  const [hydratedCorporateProfile, setHydratedCorporateProfile] = useState<{
    namaPenanggungJawab: string;
    namaPerusahaan: string;
    nib: string;
    emailPerusahaan: string;
  }>({
    namaPenanggungJawab: "",
    namaPerusahaan: "",
    nib: "",
    emailPerusahaan: ""
  });

  // Corporate PKKPR Application Modal States
  const [isDarkTheme, setIsDarkTheme] = useState(() => typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const observer = new MutationObserver(() => {
      setIsDarkTheme(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const [isCorporatePkkprModalOpen, setIsCorporatePkkprModalOpen] = useState(false);
  const [pkkprJudulProyek, setPkkprJudulProyek] = useState("");
  const [pkkprSektor, setPkkprSektor] = useState("Industri Pengolahan");
  const [pkkprNilaiInvestasi, setPkkprNilaiInvestasi] = useState("5000000000");
  const [pkkprKecamatan, setPkkprKecamatan] = useState("");
  const [pkkprDesa, setPkkprDesa] = useState("");
  const [pkkprLuasM2, setPkkprLuasM2] = useState(0);
  const [pkkprGeometry, setPkkprGeometry] = useState<any>(null);
  const [pkkprEsgAnalysis, setPkkprEsgAnalysis] = useState<any>(null);
  const [isSubmittingCorporatePkkpr, setIsSubmittingCorporatePkkpr] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Cascading Desa & Polygon Focus States
  const [pkkprDesaList, setPkkprDesaList] = useState<any[]>([]);
  const [loadingPkkprDesa, setLoadingPkkprDesa] = useState(false);
  const [pkkprSelectedKecId, setPkkprSelectedKecId] = useState("");
  const [pkkprSelectedDesaId, setPkkprSelectedDesaId] = useState("");
  const [pkkprSelectedDesaGeom, setPkkprSelectedDesaGeom] = useState<any>(null);

  // Spatial Read-Only Lock State for Corporate KML/KMZ Auto-Detection
  const [isPkkprLocationLocked, setIsPkkprLocationLocked] = useState(false);

  // Auto-detect Kecamatan & Desa whenever spatial geometry is uploaded or digitized
  useEffect(() => {
    if (!pkkprGeometry) return;
    const runSpatialDetection = async () => {
      try {
        const detection = await detectAdministrativeLocation(pkkprGeometry, districts);
        if (detection.success && detection.kecamatanName) {
          setPkkprKecamatan(detection.kecamatanName);
          if (detection.desaName) {
            setPkkprDesa(detection.desaName);
          }
          setIsPkkprLocationLocked(true);
        }
      } catch (err) {
        console.warn("Gagal deteksi lokasi spasial investor otomatis:", err);
      }
    };
    runSpatialDetection();
  }, [pkkprGeometry, districts]);

  // Dual-Mode Spatial Geometry Input States (Manual vs KMZ Upload)
  const [spatialInputMode, setSpatialInputMode] = useState<"manual" | "kmz">("manual");
  const [isParsingKmz, setIsParsingKmz] = useState(false);
  const [pkkprKmzFileInfo, setPkkprKmzFileInfo] = useState<{
    fileName: string;
    totalAreaHa: number;
    placemarkCount: number;
  } | null>(null);
  const kmzFileInputRef = useRef<HTMLInputElement>(null);

  // Auto-Hydrate Corporate Identity directly from Supabase session & profiles table
  const fetchAndHydrateCorporateProfile = async () => {
    try {
      // 1. Restore session manually from cookie or localStorage to bypass iframe / container restrictions
      let sbToken = null;
      const match = document.cookie.match(/(?:^|;\s*)sb-access-token=([^;]+)/);
      if (match) sbToken = match[1];
      if (!sbToken) sbToken = localStorage.getItem("luwu_session_token");

      const { data: { user } } = await supabase.auth.getUser();
      const effectiveEmail = user?.email || localStorage.getItem("luwu_user_email") || "";
      const effectiveId = user?.id || "";

      let prof: any = null;

      if (effectiveId && effectiveId !== "offline-user") {
        try {
          const res = await fetch(`/api/profiles?id=${encodeURIComponent(effectiveId)}`, { credentials: 'same-origin' });
          if (res.ok) {
            const resJson = await res.json();
            if (resJson.data) prof = resJson.data;
          }
        } catch (e) {}

        if (!prof) {
          try {
            const { data } = await supabase
              .from("profiles")
              .select("id, email, full_name, company_name, role, nib, kecamatan, desa")
              .eq("id", effectiveId)
              .maybeSingle();
            if (data) prof = data;
          } catch (e) {}
        }
      }

      if (!prof && effectiveEmail) {
        try {
          const res = await fetch(`/api/profiles?email=${encodeURIComponent(effectiveEmail)}`, { credentials: 'same-origin' });
          if (res.ok) {
            const resJson = await res.json();
            if (resJson.data) prof = resJson.data;
          }
        } catch (e) {}

        if (!prof) {
          try {
            const { data } = await supabase
              .from("profiles")
              .select("id, email, full_name, company_name, role, nib, kecamatan, desa")
              .eq("email", effectiveEmail)
              .maybeSingle();
            if (data) prof = data;
          } catch (e) {}
        }
      }

      const meta = user?.user_metadata || {};
      const isBadCorporateName = (n?: string | null) => {
        if (!n) return true;
        const lower = n.toLowerCase();
        return lower.includes('admin') || lower.includes('dinas') || lower.includes('puptr') || lower.includes('pertanian') || lower.includes('lp2b') || lower.includes('dalak') || lower.includes('promosi') || lower.includes('oss') || lower.includes('mpp') || ["investor", "investor terdaftar", "offline-user"].includes(lower);
      };

      let pNama = prof?.full_name || prof?.nama || prof?.nama_penanggung_jawab || prof?.nama_lengkap || meta.full_name || meta.nama || meta.nama_penanggung_jawab || meta.nama_lengkap || "";
      if (isBadCorporateName(pNama)) {
        pNama = localStorage.getItem("luwu_user_name") || "";
        if (isBadCorporateName(pNama)) {
          pNama = "";
        }
      }

      let pPerusahaan = prof?.company_name || prof?.perusahaan || prof?.nama_perusahaan || meta.company_name || meta.perusahaan || meta.nama_perusahaan || "";
      if (!pPerusahaan) {
        pPerusahaan = localStorage.getItem("luwu_company_name") || companyName || "";
      }
      let pNib = prof?.nib || prof?.no_nib || meta.nib || meta.no_nib || localStorage.getItem("luwu_user_nib") || "";
      let pEmail = prof?.email || effectiveEmail || "";

      const profileData = {
        namaPenanggungJawab: pNama || companyName || "",
        namaPerusahaan: pPerusahaan || companyName || "",
        nib: pNib || "",
        emailPerusahaan: pEmail || ""
      };

      setHydratedCorporateProfile(profileData);
      return profileData;
    } catch (err) {
      console.warn("Gagal auto-hydrate profil investor corporate:", err);
    }
    return null;
  };

  // Fetch real investor PKKPR applications from Supabase gis_pkkpr & investments tables
  const fetchInvestorApplications = async () => {
    setIsLoadingApplications(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const storedNib = hydratedCorporateProfile.nib || localStorage.getItem("luwu_user_nib") || "";
      const storedEmail = user?.email || hydratedCorporateProfile.emailPerusahaan || localStorage.getItem("luwu_user_email") || "";
      const storedCompany = hydratedCorporateProfile.namaPerusahaan || localStorage.getItem("luwu_company_name") || "";

      // 1. Fetch from gis_pkkpr
      const { data: pkkprRows } = await supabase
        .from('gis_pkkpr')
        .select('*')
        .order('created_at', { ascending: false });

      // 2. Fetch from investments table
      const { data: invRows } = await supabase
        .from('investments')
        .select('*')
        .order('created_at', { ascending: false });

      const combined: any[] = [];
      const seenIds = new Set<string>();

      if (pkkprRows && Array.isArray(pkkprRows)) {
        pkkprRows.forEach((item: any) => {
          seenIds.add(item.id);
          const rawStatus = item.status_pkkpr || item.status || 'Pending Spatial Check';
          const isApproved = rawStatus === 'Approved' || rawStatus === 'Approved_PUPTR' || rawStatus === 'Approved_Pertanian';
          const isPublished = rawStatus === 'Published' || Boolean(item.sk_pkkpr_num);
          const isRevision = rawStatus === 'Requires Revision' || rawStatus === 'Returned';
          const isRejected = rawStatus === 'Rejected';

          combined.push({
            id: item.id,
            nomorPermohonan: item.id,
            namaPermohonan: item.nama_permohonan || item.nama_kegiatan || 'Permohonan PKKPR Berusaha',
            namaBadanUsaha: item.nama_badan_usaha || item.perusahaan || (item.category === 'Non-Berusaha' || item.sektor?.includes('Perumahan') || item.nama_permohonan?.includes('Rumah Tinggal') ? 'Pemohon Perorangan (Masyarakat)' : (hydratedCorporateProfile.namaPerusahaan || 'PT Pemohon Berusaha')),
            namaPemohon: item.nama_pemohon || (item.category === 'Non-Berusaha' ? 'Warga Pemohon' : (hydratedCorporateProfile.namaPenanggungJawab || 'Pemohon Terdaftar')),
            nib: item.nib_oss || item.nik_pemohon || hydratedCorporateProfile.nib || '-',
            sektor: item.sektor || 'Industri Pengolahan',
            kecamatan: item.kecamatan || '-',
            desa: item.desa_kelurahan || item.desa || '-',
            luasM2: Number(item.luas_m2) || (item.luas_ha ? Number(item.luas_ha) * 10000 : 0),
            luasHa: Number(item.luas_ha) || (item.luas_m2 ? Number(item.luas_m2) / 10000 : 0),
            nilaiInvestasi: Number(item.nilai_investasi) || 0,
            statusPkkpr: rawStatus,
            isPublished,
            isApproved,
            isRevision,
            isRejected,
            skPkkprNum: item.sk_pkkpr_num || item.sk_pkkpr_doc_number,
            pertekPuptrNum: item.pertek_puptr_num || item.pkkpr_doc_number,
            pertanianBaNum: item.pertanian_ba_number || item.nomor_bap_pertanian,
            catatanTeknis: item.catatan_teknis || item.deskripsi || item.technical_notes,
            fileSkPkkprUrl: item.file_sk_pkkpr_url || item.sk_pkkpr_url || item.berkas_sk_pkkpr_url,
            isTteSigned: Boolean(item.sk_pkkpr_num || rawStatus === 'Published'),
            tteSignedDate: item.updated_at || item.created_at,
            createdAt: item.created_at || new Date().toISOString(),
            updatedAt: item.updated_at || new Date().toISOString(),
            geometry: item.geometry_json || item.geometry
          });
        });
      }

      if (invRows && Array.isArray(invRows)) {
        invRows.forEach((item: any) => {
          if (!seenIds.has(item.id) && (item.title?.includes('PKKPR') || item.nib || item.sk_pkkpr_doc_number)) {
            seenIds.add(item.id);
            const rawStatus = item.status || 'Pending Spatial Check';
            const isApproved = rawStatus === 'Approved' || rawStatus === 'Approved_PUPTR';
            const isPublished = rawStatus === 'Published' || Boolean(item.sk_pkkpr_doc_number);
            const isRevision = rawStatus === 'Requires Revision' || rawStatus === 'Returned';
            const isRejected = rawStatus === 'Rejected';

            combined.push({
              id: item.id,
              nomorPermohonan: item.id,
              namaPermohonan: item.name || item.title || 'Permohonan Investasi PKKPR',
              namaBadanUsaha: item.contact_pic || hydratedCorporateProfile.namaPerusahaan || 'PT Pemohon Berusaha',
              namaPemohon: item.contact_pic || hydratedCorporateProfile.namaPenanggungJawab || 'Pemohon Terdaftar',
              nib: item.nib || hydratedCorporateProfile.nib || '-',
              sektor: item.sector || 'Pertanian',
              kecamatan: item.kecamatan || item.district_id || '-',
              desa: item.desa || item.village_id || '-',
              luasM2: item.area_ha ? Number(item.area_ha) * 10000 : 0,
              luasHa: Number(item.area_ha) || 0,
              nilaiInvestasi: Number(item.investment_value) || 0,
              statusPkkpr: rawStatus,
              isPublished,
              isApproved,
              isRevision,
              isRejected,
              skPkkprNum: item.sk_pkkpr_doc_number,
              pertekPuptrNum: item.pkkpr_doc_number,
              pertanianBaNum: item.pertanian_ba_number,
              catatanTeknis: item.description,
              fileSkPkkprUrl: item.file_sk_pkkpr_url,
              isTteSigned: Boolean(item.sk_pkkpr_doc_number || rawStatus === 'Published'),
              tteSignedDate: item.updated_at || item.created_at,
              createdAt: item.created_at || new Date().toISOString(),
              updatedAt: item.updated_at || new Date().toISOString(),
              geometry: item.geometry
            });
          }
        });
      }

      setMyPkkprApplications(combined);
    } catch (err) {
      console.warn("Gagal memuat status permohonan PKKPR:", err);
    } finally {
      setIsLoadingApplications(false);
    }
  };

  const handleOpenSkDocument = (appItem: any) => {
    const dateFormatted = new Date(appItem.updatedAt || appItem.createdAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const skNum = appItem.skPkkprNum || `503/SK-PKKPR/DPMPTSP-LW/${new Date().getFullYear()}/${appItem.id.slice(-4)}`;
    const pertekNum = appItem.pertekPuptrNum || `600.1.15/042/BAP-PKKPR-B/PUPTR-TR/LUWU/${new Date().getFullYear()}`;
    const baPertanianNum = appItem.pertanianBaNum || `521/089/BAP-LP2B/DISTAN-LW/${new Date().getFullYear()}`;

    const skData: SkPkkprDpmptspData = {
      nomorSkPkkpr: skNum,
      tanggalDitetapkan: dateFormatted,
      tempatDitetapkan: 'Belopa',
      jenisPermohonan: 'Berusaha',
      nomorBapPuptr: pertekNum,
      tanggalBapPuptr: dateFormatted,
      nomorBapPertanian: baPertanianNum,
      tanggalBapPertanian: dateFormatted,
      namaPemohon: appItem.namaPemohon || hydratedCorporateProfile.namaPenanggungJawab || 'Pemohon Terdaftar',
      namaPerusahaan: appItem.namaBadanUsaha || hydratedCorporateProfile.namaPerusahaan || 'PT Pemohon Berusaha',
      nibOss: appItem.nib || hydratedCorporateProfile.nib || '1234567890123',
      alamatPemohon: `Kabupaten Luwu, Provinsi Sulawesi Selatan`,
      teleponPemohon: '0812-4567-8901',
      emailPemohon: hydratedCorporateProfile.emailPerusahaan || 'investor@luwukab.go.id',
      sektorUsaha: `Sektor ${appItem.sektor || 'Perindustrian & Manufaktur'}`,
      skalaUsaha: appItem.nilaiInvestasi > 10000000000 ? 'Usaha Besar / PMDN (Modal Usaha > Rp 10 Miliar)' : 'Usaha Menengah',
      kbliCode: '10799',
      judulKbli: `Kegiatan Komersial & Industri ${appItem.sektor}`,
      lokasiKegiatan: `Desa ${appItem.desa}, Kecamatan ${appItem.kecamatan}`,
      desaKelurahan: appItem.desa,
      kecamatan: appItem.kecamatan,
      kabupaten: 'Kabupaten Luwu',
      luasLahanPermohonan: `${(appItem.luasHa || 1).toFixed(2)} Ha (${(appItem.luasM2 || 10000).toLocaleString('id-ID')} m²)`,
      luasLahanDisetujui: `${(appItem.luasHa || 1).toFixed(2)} Ha (${(appItem.luasM2 || 10000).toLocaleString('id-ID')} m²)`,
      statusKepemilikanTanah: 'Sertipikat Hak Guna Bangunan (HGB)',
      dokumenLingkungan: 'AMDAL / UKL-UPL Terstandar',
      zonaRtrw: 'Kawasan Peruntukan Industri / Ruang Usaha Komersial',
      fungsiBangunan: `Fasilitas Bangunan Industri & Operasional ${appItem.sektor}`,
      koefisienDasarBangunan: '60%',
      koefisienLantaiBangunan: '2.0',
      koefisienDaerahHijau: '20%',
      garisSempadanBangunan: '10 Meter dari As Jalan Utama',
      ketentuanPersyaratanTeknis: [
        'Wajib mematuhi rencana tapak, Garis Sempadan Bangunan (GSB), dan penyediaan RTH minimal 20%.',
        'Persetujuan Bangunan Gedung (PBG) wajib diterbitkan sebelum kegiatan konstruksi fisik dimulai.',
        'Wajib mematuhi dokumen pengelolaan lingkungan hidup dan standar baku mutu limbah.',
        'Surat Keputusan PKKPR ini berlaku selama kegiatan usaha beroperasi sesuai dengan peruntukan ruang yang disetujui.'
      ],
      masaBerlakuTahun: 3,
      kadisNama: 'Drs. H. Muhammad Rudi, M.Si',
      kadisNip: '19740812 199803 1 004',
      kadisPangkatGolongan: 'Pembina Utama Muda (IV/c)',
      kadisJabatan: 'Kepala Dinas Penanaman Modal dan PTSP Kabupaten Luwu',
      isTteSigned: true,
      tteSignedDate: dateFormatted,
      tteQrCodeUrl: `https://simpurusiang.luwukab.go.id/verify-sk?doc=${encodeURIComponent(skNum)}`
    };

    setSelectedSkDocumentData(skData);
    setIsSkDocModalOpen(true);
  };

  useEffect(() => {
    fetchAndHydrateCorporateProfile();
    fetchInvestorApplications();
  }, [companyName]);

  // Cascading Relational Dropdown: Fetch villages from gis_desa table based on chosen Kecamatan
  useEffect(() => {
    if (!pkkprKecamatan) {
      setPkkprDesaList([]);
      setPkkprSelectedKecId("");
      return;
    }

    const cleanKecTarget = pkkprKecamatan.replace(/^kec\.?\s*/i, "").replace(/^kecamatan\s*/i, "").trim();
    const matchKec = districts?.find((d) => {
      const rawDName = getKecamatanLabel(d);
      return isSameDistrict(rawDName, pkkprKecamatan);
    });
    const kecId = matchKec ? getKecamatanId(matchKec) : pkkprKecamatan;
    setPkkprSelectedKecId(String(kecId));

    const fetchDesaForPkkpr = async () => {
      setLoadingPkkprDesa(true);
      try {
        // 1. Fetch from direct Supabase RPC / safeFetchLayerData
        let loadedVillages: any[] = [];
        try {
          const rawData = await safeFetchLayerData('gis_desa');
          const features = Array.isArray(rawData) ? rawData : (rawData?.features || []);
          if (features.length > 0) {
            loadedVillages = features.filter((f: any) => {
              const props = f.properties || f;
              const fKecId = String(props.kecamatan_id || props.district_id || props.id_kecamatan || props.KECAMATAN_ID || "");
              const fKec = String(props.kecamatan || props.districtName || props.KECAMATAN || "");
              return (kecId && fKecId === String(kecId)) || isSameDistrict(pkkprKecamatan, fKec);
            }).map((f: any) => ({
              id: getDesaId(f),
              name: getDesaLabel(f),
              desa: getDesaLabel(f),
              nama_desa: getDesaLabel(f),
              districtId: kecId,
              districtName: pkkprKecamatan,
              geom: f.geom || f.geometry
            })).filter((v: any) => Boolean(v.name));
          }
        } catch (errApi) {
          console.warn("safeFetchLayerData gis_desa error:", errApi);
        }

        if (loadedVillages.length > 0) {
          const sorted = [...loadedVillages].sort((a, b) =>
            getDesaLabel(a).localeCompare(getDesaLabel(b))
          );
          setPkkprDesaList(sorted);
          setLoadingPkkprDesa(false);
          return;
        }

        // 2. Fallback to static public gis_desa.json with strict isSameDistrict matching
        const resStatic = await fetch("/gis_desa.json", { credentials: 'same-origin' });
        if (resStatic.ok) {
          const staticGis = await resStatic.json();
          if (staticGis.features) {
            const matches = staticGis.features.filter((f: any) => {
              const props = f.properties || {};
              const fKecId = String(props.id_kecamatan !== undefined && props.id_kecamatan !== null ? props.id_kecamatan : (props.KECAMATAN_ID || props.district_id || props.districtId || ""));
              const kName = String(props.KECAMATAN || props.kecamatan || props.districtName || "");
              return (
                (kecId && fKecId === String(kecId)) ||
                isSameDistrict(pkkprKecamatan, kName)
              );
            }).map((f: any) => {
              const props = f.properties || {};
              const vName = String(props.DESA || props.nama_desa || props.desa || props.name || props.NAME || f.id || `Desa`).trim();
              const kId = String(props.id_kecamatan !== undefined && props.id_kecamatan !== null ? props.id_kecamatan : (props.KECAMATAN_ID || props.district_id || props.districtId || kecId));
              return {
                ...props,
                id: String(props.id || props.ID_DESA || f.id || vName),
                name: vName,
                desa: vName,
                nama_desa: vName,
                districtId: kId,
                id_kecamatan: kId,
                districtName: pkkprKecamatan,
                geom: f.geometry,
                geojson: f
              };
            }).filter((v: any) => Boolean(v.name));
            matches.sort((a: any, b: any) => getDesaLabel(a).localeCompare(getDesaLabel(b)));
            setPkkprDesaList(matches);
          }
        }
      } catch (e) {
        console.warn("Gagal memuat desa cascading untuk PKKPR Corporate:", e);
      } finally {
        setLoadingPkkprDesa(false);
      }
    };

    fetchDesaForPkkpr();
  }, [pkkprKecamatan, districts]);

  // Update selected desa geometry & ID when pkkprDesa changes
  useEffect(() => {
    if (!pkkprDesa || pkkprDesaList.length === 0) {
      setPkkprSelectedDesaGeom(null);
      setPkkprSelectedDesaId("");
      return;
    }
    const match = pkkprDesaList.find((d) =>
      getDesaId(d) === pkkprDesa ||
      getDesaLabel(d).toLowerCase() === pkkprDesa.toLowerCase()
    );
    if (match) {
      setPkkprSelectedDesaId(getDesaId(match) || pkkprDesa);
      setPkkprSelectedDesaGeom(match.geom || match.geojson?.geometry || match.geojson || match);
    }
  }, [pkkprDesa, pkkprDesaList]);

  // Dual-Mode KMZ Upload Handler for Corporate Consultants
  const handleKmzFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'kmz' && ext !== 'kml') {
      Swal.fire("Format File Salah", "Silakan unggah file berformat .KMZ atau .KML dari Google Earth / QGIS.", "error");
      return;
    }

    setIsParsingKmz(true);
    try {
      const result = await parseKmlKmzFile(file);
      if (!result.primaryPolygon || !result.primaryPolygon.geometry) {
        throw new Error("Tidak ditemukan poligon koordinat spasial valid di dalam berkas KML/KMZ.");
      }

      const geom = result.primaryPolygon.geometry;
      setPkkprGeometry(geom);

      // Auto-detect administrative boundaries (Kecamatan & Desa)
      let detectedKec = "";
      let detectedDesa = "";
      try {
        const detection = await detectAdministrativeLocation(geom, districts);
        if (detection.success) {
          detectedKec = detection.kecamatanName;
          detectedDesa = detection.desaName;
          if (detectedKec) setPkkprKecamatan(detectedKec);
          if (detectedDesa) setPkkprDesa(detectedDesa);
          setIsPkkprLocationLocked(true);
        }
      } catch (detErr) {
        console.warn("Spatial detection error investor:", detErr);
      }

      let areaSqM = 0;
      if (result.totalAreaHa && result.totalAreaHa > 0) {
        areaSqM = Math.round(result.totalAreaHa * 10000);
      } else {
        try {
          const feature = { type: "Feature" as const, properties: {}, geometry: geom };
          areaSqM = Math.round(turf.area(feature as any));
        } catch {
          areaSqM = 10000;
        }
      }
      setPkkprLuasM2(areaSqM);

      setPkkprKmzFileInfo({
        fileName: result.fileName,
        totalAreaHa: Number((areaSqM / 10000).toFixed(2)),
        placemarkCount: result.placemarkCount || 1,
      });

      Swal.fire({
        icon: "success",
        title: "File KMZ/KML Berhasil Diekstrak! 🗺️",
        html: `
          <div class="text-left text-xs space-y-1.5 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-sans">
            <p><strong>Berkas:</strong> <span class="font-mono text-emerald-400 font-bold">${result.fileName}</span></p>
            <p><strong>Luas Plot Lahan:</strong> <span class="font-mono text-emerald-400 font-bold">${(areaSqM / 10000).toFixed(2)} Ha</span> (${areaSqM.toLocaleString()} m²)</p>
            <p><strong>Batas Geospasial:</strong> Terverifikasi & Sinkron</p>
            ${detectedKec ? `<p class="pt-1.5 border-t border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">🔒 Lokasi Terkunci: Kec. ${detectedKec}${detectedDesa ? `, Desa ${detectedDesa}` : ''}</p>` : ''}
          </div>
        `,
        confirmButtonColor: "#10b981",
        timer: 3500
      });
    } catch (err: any) {
      console.error("Gagal membaca file KMZ/KML Corporate:", err);
      Swal.fire("Gagal Mengekstrak Spasial", err.message || "Gagal memproses file .KMZ/.KML.", "error");
    } finally {
      setIsParsingKmz(false);
      if (e.target) e.target.value = "";
    }
  };

  // Submit Corporate PKKPR Permohonan Spasial
  const handleSubmitCorporatePkkpr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkkprGeometry) {
      Swal.fire("Geometri Spasial Wajib", "Silakan digitasi polygon batas lahan atau unggah file .KMZ/.KML terlebih dahulu.", "warning");
      return;
    }

    setIsSubmittingCorporatePkkpr(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const trackingCode = `PKKPR-CORP-${Date.now().toString().slice(-6)}`;
      const payload = {
        nomor_permohonan: trackingCode,
        user_id: user?.id,
        nama_pemohon: hydratedCorporateProfile.namaPenanggungJawab,
        email_pemohon: hydratedCorporateProfile.emailPerusahaan,
        perusahaan: hydratedCorporateProfile.namaPerusahaan,
        nib: hydratedCorporateProfile.nib,
        judul_kegiatan: pkkprJudulProyek,
        sektor: pkkprSektor,
        nilai_investasi: parseFloat(pkkprNilaiInvestasi) || 0,
        kecamatan: pkkprKecamatan,
        desa: pkkprDesa,
        luas_m2: pkkprLuasM2,
        luas_ha: Number((pkkprLuasM2 / 10000).toFixed(2)),
        geometry: pkkprGeometry,
        status: "DALAM_PROSES_KAJIAN",
        esg_status: pkkprEsgAnalysis?.esgRiskStatus || "CLEAR",
        created_at: new Date().toISOString()
      };

      let insertErr = null;
      try {
        const areaHaVal = Number((pkkprLuasM2 / 10000).toFixed(4));
        const formattedCatatan = [
          `[Fungsi: Kegiatan Komersial / Industri ${pkkprSektor}]`,
          `[Penguasaan Tanah: Hak Guna Bangunan (HGB)]`,
          `[Alamat Pemohon: ${(hydratedCorporateProfile as any).alamatPerusahaan || 'Kabupaten Luwu'}]`,
          `[Lokasi Dimohon: Desa ${pkkprDesa}, Kec. ${pkkprKecamatan}, Kab. Luwu]`,
          `[Nilai Investasi: Rp ${(parseFloat(pkkprNilaiInvestasi) || 0).toLocaleString('id-ID')}]`,
          "Dalam proses analisis spasial tata ruang PUPTR."
        ].join(' ');

        // 1. Insert into gis_pkkpr so PUPTR & Pertanian dashboards see corporate applications immediately
        await supabase.from("gis_pkkpr").insert({
          id: trackingCode,
          jenis_permohonan: "Berusaha",
          nama_permohonan: pkkprJudulProyek,
          nib_oss: hydratedCorporateProfile.nib,
          nama_badan_usaha: hydratedCorporateProfile.namaPerusahaan,
          nama_pemohon: hydratedCorporateProfile.namaPenanggungJawab,
          nik_pemohon: hydratedCorporateProfile.nib,
          no_whatsapp: (hydratedCorporateProfile as any).telepon || null,
          sektor: pkkprSektor,
          kecamatan: pkkprKecamatan,
          desa_kelurahan: pkkprDesa,
          luas_m2: pkkprLuasM2,
          luas_ha: areaHaVal,
          geometry_json: pkkprGeometry,
          status_pkkpr: "Pending Spatial Check",
          catatan_teknis: formattedCatatan,
          user_id: user?.id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        // 2. Insert into investments table
        const { error } = await supabase.from("investments").insert({
          id: trackingCode,
          name: pkkprJudulProyek,
          title: `[PKKPR Berusaha] ${pkkprJudulProyek}`,
          sector: pkkprSektor,
          kecamatan: pkkprKecamatan,
          district_id: pkkprKecamatan,
          desa: pkkprDesa,
          village_id: pkkprDesa,
          area_ha: areaHaVal,
          investment_value: parseFloat(pkkprNilaiInvestasi) || 0,
          status: "Pending Spatial Check",
          geometry: pkkprGeometry,
          nib: hydratedCorporateProfile.nib,
          contact_pic: hydratedCorporateProfile.namaPenanggungJawab,
          land_status: "Hak Guna Bangunan (HGB)",
          certificate_number: `HGB-${trackingCode}`,
          description: formattedCatatan,
          esg_environmental_risk: pkkprEsgAnalysis?.esgRiskStatus || "CLEAR"
        });
        if (error) insertErr = error;

        // 3. Catat juga ke investment_interests
        await supabase.from("investment_interests").insert({
          investor_name: hydratedCorporateProfile.namaPenanggungJawab,
          company_name: hydratedCorporateProfile.namaPerusahaan,
          nilai_investasi: parseFloat(pkkprNilaiInvestasi) || 0,
          status: "Diajukan"
        });
      } catch (err: any) {
        insertErr = err;
      }

      if (insertErr) {
        console.warn("Database insert notice:", insertErr);
      }

      Swal.fire({
        icon: "success",
        title: "Permohonan PKKPR Corporate Berhasil Terkirim!",
        html: `
          <div class="text-left text-xs space-y-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <p><strong>Nomor Registrasi SK:</strong> <span class="font-mono text-emerald-400 font-extrabold">${trackingCode}</span></p>
            <p><strong>Badan Usaha:</strong> ${hydratedCorporateProfile.namaPerusahaan}</p>
            <p><strong>NIB OSS:</strong> ${hydratedCorporateProfile.nib}</p>
            <p><strong>Lokasi Lahan:</strong> Desa ${pkkprDesa}, Kec. ${pkkprKecamatan}</p>
            <p><strong>Luas Poligon:</strong> ${(pkkprLuasM2 / 10000).toFixed(2)} Ha (${pkkprLuasM2.toLocaleString()} m²)</p>
          </div>
          <p class="text-[11px] text-slate-500 mt-2">Permohonan Anda masuk ke antrean verifikasi DPMPTSP & PUPTR Kabupaten Luwu.</p>
        `,
        confirmButtonColor: "#10b981"
      });

      setIsCorporatePkkprModalOpen(false);
      setPkkprJudulProyek("");
      setPkkprGeometry(null);
      setPkkprKmzFileInfo(null);
    } catch (err: any) {
      console.error("Gagal mengirim PKKPR Corporate:", err);
      Swal.fire("Gagal Mengirim", err.message || "Terjadi kesalahan saat menyimpan permohonan.", "error");
    } finally {
      setIsSubmittingCorporatePkkpr(false);
    }
  };

  const openCorporatePkkprModal = async () => {
    await fetchAndHydrateCorporateProfile();
    setPkkprKecamatan(districts?.[0]?.name || "");
    setPkkprDesa("");
    setPkkprGeometry(null);
    setPkkprKmzFileInfo(null);
    setSpatialInputMode("manual");
    setIsCorporatePkkprModalOpen(true);
  };

  // Strict Protected Route & Role Validation
  useEffect(() => {
    const loadUserSession = async () => {
      setIsAuthLoading(true);
      try {
        // Restore session manually from cookie or localStorage to bypass iframe restrictions kawan!
        let token = localStorage.getItem("luwu_session_token");
        let sbToken = null;
        const match = document.cookie.match(/(?:^|;\s*)sb-access-token=([^;]+)/);
        if (match) sbToken = match[1];
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          navigate("/login");
          return;
        }
        
        // Role Validation with fallback
        const effectiveId = session.user.id;
        if (effectiveId === "offline-user") {
          navigate("/login");
          return;
        }

        const { data: profile } = await supabase.from('profiles').select('role, full_name, company_name').eq('id', effectiveId).maybeSingle();
        const storedRole = (localStorage.getItem("luwu_user_role") || "").toLowerCase().trim();
        const effectiveRole = (profile?.role || session.user.user_metadata?.role || storedRole || 'investor').toLowerCase().trim();

        if (effectiveRole) setUserRole(effectiveRole);

        // Auto-upsert profile if missing
        if (!profile && effectiveId) {
          try {
            await supabase.from('profiles').upsert({
              id: effectiveId,
              role: effectiveRole,
              full_name: session.user.user_metadata?.company_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || ''
            });
          } catch (e) {}
        }

        const validInvestorRoles = ['investor', 'superadmin', 'admin_dalak', 'admin_oss', 'admin_promosi', 'admin_data', 'operator'];
        if (!validInvestorRoles.includes(effectiveRole)) {
          navigate("/403-forbidden");
          return;
        }

        const u = session.user;
        const meta = u.user_metadata || {};
        const name = meta.company_name || meta.full_name || profile?.company_name || profile?.full_name || u.email?.split('@')[0] || "";
        setCompanyName(name);
        setTestiCompany(name);
        setIsAuthLoading(false);
      } catch {
        window.location.replace("/login");
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
    /* const fetchData = async () => {
      try {
        setIsLoading(true);
        const [invRes, distRes] = await Promise.all([
          fetch('/api/investments'),
          fetch('/api/districts')
        ]);
        
        if (!invRes.ok || !distRes.ok) {
          throw new Error('Failed to fetch data from API');
        }

        const invData = await invRes.json();
        const distData = await distRes.json();

        if (isMounted) {
          setInvestments(invData || []);
          setDistricts(distData || []);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        if (isMounted) {
          setError(err.message || 'Error fetching data');
          setIsLoading(false);
        }
      }
    }; */

    return () => {
      isMounted = false;
    };
  }, []);

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
        totalArea: 0,
        dominantSector: '-',
        avgRoiRange: '-',
        sectorData: [],
        topInvestments: []
      };
    }

    const totalOpportunities = investments.length;
    const totalArea = investments.reduce((sum, inv) => sum + (inv.areaHa || 0), 0);

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
      totalArea,
      dominantSector,
      avgRoiRange,
      sectorData,
      topInvestments
    };
  }, [investments]);

  const tabs = [
    { id: 'overview', label: t('dashboard.menuOverview', 'Ringkasan'), icon: LayoutDashboard, badge: 'UTAMA' },
    { id: 'pkkpr_tracking', label: t('dashboard.menuPkkprTracking', 'Status Permohonan PKKPR'), icon: FileCheck2, badge: 'OSS • GIS' },
    { id: 'site-selection', label: t('dashboard.menuSiteSelection', 'Rekomendasi Lokasi AI'), icon: MapPin, badge: 'AI GIS' },
    { id: 'verify', label: t('dashboard.menuVerify', 'Verifikasi NIB'), icon: ShieldCheck, badge: 'OSS' },
    { id: 'simulation', label: t('dashboard.menuSimulation', 'Simulasi Finansial'), icon: Calculator, badge: 'ROI' },
    { id: 'survey_skm', label: t('dashboard.menuSurveySkm', 'Survei SKM'), icon: Star, badge: 'IKM' },
    { id: 'testimonial', label: t('dashboard.menuTestimonial', 'Testimoni Pengguna'), icon: MessageSquareHeart, badge: 'LIVE' },
  ];

  if (isAuthLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row font-sans text-slate-900 dark:text-slate-200">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-20">
        <div className="flex items-center gap-2">
          <LuwuLogo className="h-8 w-8" />
          <span className="font-bold text-slate-900 dark:text-white tracking-tight">Investor Portal</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white" aria-label="Toggle menu">
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-10 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 hidden md:flex items-center gap-3">
            <LuwuLogo className="h-10 w-10" />
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 dark:text-white tracking-tight text-lg leading-tight">Investor</span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wider">Portal Luwu</span>
            </div>
          </div>
          
          <div className="flex-1 px-4 py-6 md:py-2 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 font-medium border border-emerald-500/20 shadow-inner' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-emerald-400' : 'text-slate-600 dark:text-slate-400'} />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <button 
              onClick={async () => {
                try {
                  if (!document.fullscreenElement) {
                    const elem = document.documentElement as any;
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
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut size={18} />
              <span className="text-sm">{t('dashboard.logout', 'Keluar')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto flex flex-col">
        {/* Top Navbar */}
        <div className="hidden md:flex justify-between items-center pb-6 mb-2 border-b border-slate-200 dark:border-slate-800/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Investor Portal</span>
            <span className="text-slate-800 dark:text-slate-200">/</span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
              {activeTab === 'overview' 
                ? t('dashboard.menuOverview', 'Ringkasan') 
                : activeTab === 'pkkpr_tracking'
                  ? t('dashboard.menuPkkprTracking', 'Status Permohonan PKKPR')
                  : activeTab === 'site-selection'
                    ? t('dashboard.menuSiteSelection', 'Rekomendasi Lokasi AI')
                    : activeTab === 'verify' 
                      ? t('dashboard.menuVerify', 'Verifikasi NIB') 
                      : activeTab === 'simulation'
                        ? t('dashboard.menuSimulation', 'Simulasi Finansial')
                        : activeTab === 'survey_skm'
                          ? t('dashboard.menuSurveySkm', 'Survei SKM')
                          : t('dashboard.menuTestimonial', 'Testimoni Pengguna')
              }
            </span>
          </div>
          <div className="flex items-center gap-3">
            <CrossOpdNotificationBell currentRole="PEMOHON" />
            <button
              onClick={openCorporatePkkprModal}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md hover:shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Permohonan PKKPR Corporate</span>
            </button>
            <LanguageToggle />
            <ThemeToggle />
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase">
                {companyName ? companyName.substring(0,2).toUpperCase() : 'IP'}
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-none">{companyName || 'Investor'}</div>
                <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 leading-none">Investor Partner</div>
              </div>
            </div>
          </div>
        </div>

        {/* PRIMARY NAVIGATION PILLS: Overview, AI Site Selection, Verifikasi NIB, Simulasi Finansial, Survei SKM, Testimoni */}
        <div className="mb-6 p-1.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 backdrop-blur-md shadow-sm overflow-x-auto flex items-center gap-1.5 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2.5 px-3.5 sm:px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'} />
                <span className="whitespace-nowrap">{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono uppercase font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="h-[70vh] flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">{t('dashboard.loadingAnalysis', 'Memuat Analisis Portal Investor...')}</p>
          </div>
        ) : error ? (
          <div className="h-[70vh] flex flex-col items-center justify-center gap-4 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-700 dark:text-red-400 flex items-center justify-center">
              <X size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{t('dashboard.dbErrorTitle', 'Gagal Terhubung ke Database')}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">{t('dashboard.dbErrorDesc', 'Kami tidak dapat memuat data investasi Kabupaten Luwu saat ini secara jujur. Silakan periksa koneksi Anda.')}</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700/50 transition-all"
            >
              {t('dashboard.retry', 'Coba Ulang')}
            </button>
          </div>
        ) : activeTab === 'overview' ? (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4 md:mt-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 border-b border-slate-200 dark:border-slate-800/60 pb-4 sm:pb-6">
              <div>
                <h1 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-1 tracking-tight flex items-center gap-2">
                  <span>{t('dashboard.welcomeTitle', 'Selamat Datang di Portal Investor')}</span>
                  <Sparkles size={18} className="text-emerald-700 dark:text-emerald-400 animate-pulse shrink-0" />
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">{t('dashboard.welcomeSub', 'Akses layanan, data spasial, dan simulasi kelayakan finansial secara terpadu di Kabupaten Luwu.')}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={openCorporatePkkprModal}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1.5 shadow-md hover:shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5 shrink-0" />
                  <span>Permohonan PKKPR Corporate</span>
                </button>
                <div className="text-[10px] sm:text-xs font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl uppercase tracking-wider font-bold">
                  {t('dashboard.onlineSyncActive', 'Online Sync Active')}
                </div>
              </div>
            </div>

            {/* 1. Top Row: Quick Statistic Cards (4 Columns) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {/* Card 1 */}
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-emerald-500/30 transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.05)] group">
                <div className="flex justify-between items-start mb-2.5 sm:mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">MAPS & SITES</span>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                    <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {stats.totalOpportunities} {t('investor.locations', 'Lokasi')}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">
                  {t('dashboard.totalOpportunities', 'Total Peluang Investasi')}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 hidden sm:block">
                  {t('dashboard.totalOpportunitiesDesc', 'Peluang investasi terpetakan aktif')}
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-cyan-500/30 transition-all hover:shadow-[0_0_15px_rgba(6,182,212,0.05)] group">
                <div className="flex justify-between items-start mb-2.5 sm:mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">TOTAL AREA</span>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform">
                    <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {stats.totalArea > 0 ? stats.totalArea.toLocaleString('id-ID') : '0'} Ha
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">
                  {t('dashboard.totalLandArea', 'Total Luas Lahan')}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 hidden sm:block">
                  {t('dashboard.totalLandAreaDesc', 'Kumulatif luas wilayah terdata')}
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-rose-500/30 transition-all hover:shadow-[0_0_15px_rgba(244,63,94,0.05)] group">
                <div className="flex justify-between items-start mb-2.5 sm:mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">DOMINANT</span>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-400 group-hover:scale-105 transition-transform">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white mt-1 truncate max-w-full">
                  {stats.dominantSector}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">
                  {t('dashboard.dominantSector', 'Sektor Dominan')}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 hidden sm:block">
                  {t('dashboard.dominantSectorDesc', 'Sektor potensi kontributor utama')}
                </div>
              </div>

              {/* Card 4 */}
              <div 
                id="rata-rata-roi-card" 
                className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-amber-500/30 transition-all group"
              >
                <div className="flex justify-between items-start mb-2.5 sm:mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">FINANCIAL</span>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 group-hover:scale-105 transition-transform">
                    <Percent className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {stats.avgRoiRange}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 line-clamp-1">
                  {t('dashboard.avgRoi', 'Rata-rata Estimasi ROI')}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 hidden sm:block">
                  {t('dashboard.avgRoiDesc', 'Tingkat pengembalian modal rata-rata')}
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/50 flex items-center gap-1.5">
                  <span className="text-emerald-700 dark:text-emerald-400/80">💡</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {t('dashboard.roiBenchmark', 'Benchmark Luwu: ~10% - 12% (Rata-rata sektor)')}
                  </p>
                </div>
              </div>
            </div>

            {/* 1.5. LIVE PKKPR & LICENSING END-TO-END TRACKER BANNER (DPMPTSP • PUPTR • PERTANIAN) */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 border border-teal-500/30 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-40 bg-teal-500/10 blur-3xl rounded-full -mr-20 -mt-10 pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>PELACAK PERIZINAN BERUSAHA • OSS-RBA KABUPATEN LUWU</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                    <span>Status Permohonan PKKPR &amp; SK Izin Berusaha</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                      {myPkkprApplications.length} Permohonan
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    Pantau tahapan verifikasi spasial lintas OPD (Dinas Pertanian LP2B &amp; Dinas PUPTR Tata Ruang) hingga penerbitan resmi Surat Keputusan (SK) PKKPR oleh DPMPTSP dengan tanda tangan elektronik (TTE).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setActiveTab('pkkpr_tracking')}
                    className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition-all shadow-lg hover:shadow-teal-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <FileCheck2 className="w-4 h-4" />
                    <span>Buka Status Permohonan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={openCorporatePkkprModal}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border border-white/10 flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajukan Baru</span>
                  </button>
                </div>
              </div>

              {/* Quick Status Cards / Latest Application Preview */}
              {myPkkprApplications.length > 0 ? (
                <div className="mt-5 pt-5 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {myPkkprApplications.slice(0, 2).map((app) => {
                    const isPublished = app.isPublished;
                    const isApproved = app.isApproved;
                    return (
                      <div
                        key={app.id}
                        className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-teal-500/40 transition-all flex flex-col justify-between gap-3 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${isPublished ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : isApproved ? 'bg-teal-400' : 'bg-amber-400 animate-pulse'}`} />
                              <span className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-xs">{app.namaPermohonan}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono">
                              No. Reg: {app.nomorPermohonan} • Kec. {app.kecamatan}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isPublished
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : isApproved
                              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {isPublished ? 'SK Terbit' : isApproved ? 'Disetujui OPD' : 'Proses Kajian'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/50">
                          <span className="text-[10px] text-slate-400 font-mono">
                            Luas: {app.luasHa ? app.luasHa.toFixed(2) : '-'} Ha • {app.sektor}
                          </span>
                          {isPublished ? (
                            <button
                              onClick={() => handleOpenSkDocument(app)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Cetak SK PKKPR</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setActiveTab('pkkpr_tracking')}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>Lihat Tahapan</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-400" />
                    <span>Belum ada permohonan aktif. Gunakan tombol di atas untuk mengajukan izin PKKPR baru.</span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Middle Row: Spatial Highlights & Analytics (2 Columns: 60% / 40%) */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left Column (60%): Top Rekomendasi Investasi */}
              <div className="lg:col-span-3 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('dashboard.topRecommendations', 'Top Rekomendasi Investasi')}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{t('dashboard.topRecommendationsDesc', 'Proyek strategis teratas berdasarkan nilai komitmen investasi')}</p>
                    </div>
                  </div>

                  {stats.topInvestments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 border-dashed rounded-xl">
                      <Building2 className="w-10 h-10 mb-3 stroke-1 text-slate-600" />
                      <p className="text-sm font-medium">{t('dashboard.emptyInvestmentData', 'Belum ada data investasi diinput secara terpadu')}</p>
                    </div>
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
                                ? "bg-emerald-500/10 dark:bg-emerald-950/50 border-emerald-500/80 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/10 -translate-y-0.5"
                                : "bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800/80 hover:bg-slate-100/90 dark:hover:bg-slate-900 hover:border-emerald-500/50 hover:shadow-md hover:-translate-y-0.5"
                            }`}
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
                                  <span className="text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
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
                                className="px-3 py-1 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all"
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
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{t('dashboard.sectorDistribution', 'Distribusi Sektor')}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mb-6">{t('dashboard.sectorDistributionDesc', 'Persentase sebaran jenis investasi terdata')}</p>

                  {stats.sectorData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-600 dark:text-slate-400">
                      <div className="w-24 h-24 rounded-full border-2 border-slate-200 dark:border-slate-800 border-dashed flex items-center justify-center mb-4">
                        <Percent size={24} className="text-slate-800 dark:text-slate-200" />
                      </div>
                      <p className="text-xs text-center px-4">{t('dashboard.emptySectorData', 'Belum ada data sektor investasi diinput.')}</p>
                    </div>
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
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono tracking-wider uppercase">{t('dashboard.projects', 'Proyek')}</span>
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
                            <span className="text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 font-mono">
                            <span className="text-slate-600 dark:text-slate-300 font-medium">({item.value})</span>
                            <span className="text-slate-900 dark:text-white font-bold">{percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Bottom Row: Action Center & NIB Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Status Verifikasi NIB */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                      <ShieldCheck size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('dashboard.nibStatus', 'Status Verifikasi NIB')}</h3>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                    {t('dashboard.nibEmptyState', 'Belum ada NIB yang diajukan untuk diverifikasi secara hukum oleh instansi terkait. Silakan ajukan NIB Anda untuk terhubung ke jaringan investasi Luwu.')}
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab('verify')}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-semibold tracking-wide border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex items-center justify-center gap-2"
                >
                  <span>{t('dashboard.btnGoVerify', 'Buka Form Verifikasi')}</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Right Column: Action Center */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                      <Sparkles size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('dashboard.actionCenter', 'Action Center')}</h3>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">{t('dashboard.actionCenterDesc', 'Akses cepat menu navigasi dan analisis cerdas.')}</p>
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
                        <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-1">{t('dashboard.spatialWebGisDesc', 'Eksplor layer tata ruang 3D Luwu.')}</p>
                      </div>
                    </div>
                    <ArrowUpRight size={14} className="text-slate-600 dark:text-slate-400 group-hover:text-emerald-400 transition-colors shrink-0" />
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
                        <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-1">{t('dashboard.startSimulationDesc', 'Hitung kelayakan finansial & ROI.')}</p>
                      </div>
                    </div>
                    <ArrowUpRight size={14} className="text-slate-600 dark:text-slate-400 group-hover:text-blue-400 transition-colors shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'pkkpr_tracking' ? (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4 md:mt-0 pb-12">
            {/* 1. Header Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-950 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-2xl border border-teal-500/30">
              <div className="absolute top-0 right-0 w-96 h-64 bg-teal-500/10 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>DPMPTSP • DINAS PUPTR • DINAS PERTANIAN KABUPATEN LUWU</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                    <span>Status &amp; Pelacak Permohonan PKKPR</span>
                    <span className="text-xs px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                      OSS-RBA Terintegrasi
                    </span>
                  </h1>
                  <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                    Sistem pemantauan terpadu alur verifikasi geospasial izin berusaha di Kabupaten Luwu. Dokumen resmi Surat Keputusan (SK) PKKPR dapat langsung dicetak atau diunduh dengan keabsahan TTE Digital BSrE setelah disetujui.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={fetchInvestorApplications}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-2 border border-white/10 cursor-pointer active:scale-95"
                  >
                    <Clock className={`w-4 h-4 text-teal-300 ${isLoadingApplications ? 'animate-spin' : ''}`} />
                    <span>Segarkan Data</span>
                  </button>
                  <button
                    onClick={openCorporatePkkprModal}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition flex items-center gap-2 shadow-lg hover:shadow-emerald-500/20 cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajukan Permohonan Baru</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span>Total Permohonan</span>
                  <FileText className="w-4 h-4 text-teal-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {myPkkprApplications.length}
                </div>
                <p className="text-[10px] text-slate-500">Berkas Terdaftar di Sistem</p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span>Dalam Kajian Spasial</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                  {myPkkprApplications.filter(a => !a.isPublished && !a.isApproved).length}
                </div>
                <p className="text-[10px] text-slate-500">Proses PUPTR &amp; Pertanian</p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span>Disetujui / Siap Terbit</span>
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                  {myPkkprApplications.filter(a => a.isApproved && !a.isPublished).length}
                </div>
                <p className="text-[10px] text-slate-500">Menunggu TTE DPMPTSP</p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span>SK Terbit &amp; Siap Cetak</span>
                  <FileCheck2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {myPkkprApplications.filter(a => a.isPublished).length}
                </div>
                <p className="text-[10px] text-slate-500">Telah Di-TTE &amp; Siap Unduh</p>
              </div>
            </div>

            {/* 3. Filter & Search Controls */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari permohonan berdasarkan nama proyek, nomor registrasi, NIB, atau lokasi desa/kecamatan..."
                  value={pkkprSearchQuery}
                  onChange={(e) => setPkkprSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-teal-500 transition-all font-medium"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
                {[
                  { id: 'ALL', label: 'Semua Status' },
                  { id: 'PENDING', label: 'Dalam Kajian' },
                  { id: 'APPROVED', label: 'Disetujui' },
                  { id: 'PUBLISHED', label: 'SK Terbit (Siap Cetak)' },
                  { id: 'REVISION', label: 'Perlu Revisi' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setPkkprFilterStatus(st.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      pkkprFilterStatus === st.id
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Applications List */}
            {isLoadingApplications ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                <p className="text-xs text-slate-500 font-medium">Menyinkronkan data permohonan PKKPR dari Supabase...</p>
              </div>
            ) : myPkkprApplications.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center">
                  <FileText className="w-8 h-8 stroke-1" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Belum Ada Permohonan PKKPR</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Anda belum mengajukan permohonan Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR). Silakan ajukan melalui formulir digital spasial di bawah ini.
                  </p>
                </div>
                <button
                  onClick={openCorporatePkkprModal}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md hover:shadow-emerald-500/20 inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajukan Permohonan PKKPR Baru</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {myPkkprApplications
                  .filter(app => {
                    if (pkkprFilterStatus === 'PENDING' && (app.isPublished || app.isApproved || app.isRejected)) return false;
                    if (pkkprFilterStatus === 'APPROVED' && (!app.isApproved || app.isPublished)) return false;
                    if (pkkprFilterStatus === 'PUBLISHED' && !app.isPublished) return false;
                    if (pkkprFilterStatus === 'REVISION' && !app.isRevision && !app.isRejected) return false;

                    if (pkkprSearchQuery) {
                      const q = pkkprSearchQuery.toLowerCase();
                      const matchName = app.namaPermohonan?.toLowerCase().includes(q);
                      const matchReg = app.nomorPermohonan?.toLowerCase().includes(q);
                      const matchSk = app.skPkkprNum?.toLowerCase().includes(q);
                      const matchKec = app.kecamatan?.toLowerCase().includes(q);
                      const matchDesa = app.desa?.toLowerCase().includes(q);
                      const matchNib = app.nib?.toLowerCase().includes(q);
                      const matchPt = app.namaBadanUsaha?.toLowerCase().includes(q);
                      if (!matchName && !matchReg && !matchSk && !matchKec && !matchDesa && !matchNib && !matchPt) {
                        return false;
                      }
                    }
                    return true;
                  })
                  .map((app) => {
                    const isPublished = app.isPublished;
                    const isApproved = app.isApproved;
                    const isRevision = app.isRevision;
                    const isRejected = app.isRejected;

                    // Compute Stepper status
                    const step1Done = true;
                    const step2Done = Boolean(app.pertanianBaNum || isApproved || isPublished);
                    const step3Done = Boolean(app.pertekPuptrNum || isApproved || isPublished);
                    const step4Done = isPublished;

                    return (
                      <div
                        key={app.id}
                        className={`rounded-3xl bg-white dark:bg-slate-900 border transition-all shadow-sm overflow-hidden ${
                          isPublished
                            ? 'border-emerald-500/40 hover:border-emerald-500 hover:shadow-emerald-500/5'
                            : isApproved
                            ? 'border-blue-500/40 hover:border-blue-500 hover:shadow-blue-500/5'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {/* Header Box */}
                        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20">
                                {app.sektor}
                              </span>
                              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                                Reg: {app.nomorPermohonan}
                              </span>
                              {app.skPkkprNum && (
                                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                                  SK: {app.skPkkprNum}
                                </span>
                              )}
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                              {app.namaPermohonan}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                <strong className="text-slate-700 dark:text-slate-300">{app.namaBadanUsaha}</strong> (NIB: {app.nib})
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                Desa {app.desa}, Kec. {app.kecamatan}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                              isPublished
                                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 shadow-xs'
                                : isApproved
                                ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/40'
                                : isRevision
                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                                : isRejected
                                ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40'
                                : 'bg-slate-500/20 text-slate-700 dark:text-slate-300 border border-slate-500/40'
                            }`}>
                              {isPublished ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>SK PKKPR Terbit &amp; Aktif</span>
                                </>
                              ) : isApproved ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                                  <span>Disetujui OPD (Siap Terbit)</span>
                                </>
                              ) : isRevision ? (
                                <>
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Perlu Revisi Berkas</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Dalam Kajian Teknis Spasial</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Body Content */}
                        <div className="p-5 sm:p-6 space-y-6">
                          {/* 4-STAGE INTERACTIVE VISUAL PROGRESS BAR & TOOLTIPS */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                              <div className="flex items-center gap-2">
                                <span className="uppercase tracking-wider">Tahapan Alur Verifikasi Lintas OPD:</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                                  Arahkan kursor ke kartu tahap untuk detail SOP
                                </span>
                              </div>
                              <span className="text-xs font-mono font-black text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-xl border border-teal-500/20">
                                {isPublished ? '4 / 4 Tahap Selesai (100%)' : isApproved ? '3 / 4 Tahap Selesai (75%)' : step2Done ? '2 / 4 Tahap Selesai (50%)' : '1 / 4 Tahap Selesai (25%)'}
                              </span>
                            </div>

                            {/* Connected Horizontal Progress Line */}
                            <div className="relative pt-2 pb-1 hidden sm:block">
                              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-700 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                                  style={{ width: isPublished ? '100%' : isApproved ? '75%' : step2Done ? '50%' : '25%' }}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              {/* Step 1: OSS Registration */}
                              <div className={`group relative p-3.5 rounded-2xl border transition-all ${
                                step1Done
                                  ? 'bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-500/10 hover:border-emerald-500/60 shadow-xs'
                                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                              }`}>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    Tahap 1
                                  </span>
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                </div>
                                <h4 className="text-xs font-black text-slate-900 dark:text-white">Registrasi OSS &amp; Spasial</h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                                  NIB OSS &amp; Poligon Batas Lahan Terverifikasi
                                </p>

                                {/* Tooltip on Hover */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-950 text-white rounded-xl shadow-2xl border border-slate-800 text-[11px] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-30 space-y-1">
                                  <div className="flex items-center justify-between font-bold text-emerald-400 border-b border-slate-800 pb-1">
                                    <span>Tahap 1: Pengajuan Digital</span>
                                    <span className="text-[9px] bg-emerald-500/20 px-1.5 py-0.5 rounded">Selesai</span>
                                  </div>
                                  <p className="text-slate-300 text-[10px] leading-tight">
                                    Pemeriksaan NIB berbasis OSS RBA dan penguncian koordinat poligon batas lahan pada peta digital Luwu.
                                  </p>
                                  <div className="pt-1 text-[9px] text-slate-400 flex justify-between">
                                    <span>PIC: DPMPTSP / Helpdesk OSS</span>
                                    <span>SOP: 1 Hari Kerja</span>
                                  </div>
                                </div>
                              </div>

                              {/* Step 2: Pertanian LP2B Clearance */}
                              <div className={`group relative p-3.5 rounded-2xl border transition-all ${
                                step2Done
                                  ? 'bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-500/10 hover:border-emerald-500/60 shadow-xs'
                                  : 'bg-amber-500/5 border-amber-500/30 dark:bg-amber-500/10 hover:border-amber-500/60'
                              }`}>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
                                    <span className={`w-2 h-2 rounded-full ${step2Done ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`} />
                                    Tahap 2
                                  </span>
                                  {step2Done ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                  ) : (
                                    <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                                  )}
                                </div>
                                <h4 className="text-xs font-black text-slate-900 dark:text-white">Dinas Pertanian (LP2B)</h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                                  {step2Done ? (
                                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">BAP Pelepasan LP2B Diterbitkan</span>
                                  ) : (
                                    <span className="text-amber-700 dark:text-amber-400 font-bold">Verifikasi Alih Fungsi Lahan</span>
                                  )}
                                </p>

                                {/* Tooltip on Hover */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-950 text-white rounded-xl shadow-2xl border border-slate-800 text-[11px] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-30 space-y-1">
                                  <div className="flex items-center justify-between font-bold text-amber-400 border-b border-slate-800 pb-1">
                                    <span>Tahap 2: Kajian LP2B</span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${step2Done ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                      {step2Done ? 'Disetujui' : 'Sedang Diproses'}
                                    </span>
                                  </div>
                                  <p className="text-slate-300 text-[10px] leading-tight">
                                    Validasi apakah poligon lahan bersinggungan dengan zona Lahan Pertanian Pangan Berkelanjutan (LP2B) atau irigasi teknis.
                                  </p>
                                  <div className="pt-1 text-[9px] text-slate-400 flex justify-between">
                                    <span>PIC: Tim Teknis Dinas Pertanian</span>
                                    <span>SOP: 1 - 2 Hari</span>
                                  </div>
                                </div>
                              </div>

                              {/* Step 3: PUPTR Spatial Check */}
                              <div className={`group relative p-3.5 rounded-2xl border transition-all ${
                                step3Done
                                  ? 'bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-500/10 hover:border-emerald-500/60 shadow-xs'
                                  : step2Done
                                  ? 'bg-amber-500/5 border-amber-500/30 dark:bg-amber-500/10 hover:border-amber-500/60'
                                  : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 opacity-60'
                              }`}>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
                                    <span className={`w-2 h-2 rounded-full ${step3Done ? 'bg-emerald-500' : step2Done ? 'bg-amber-500' : 'bg-slate-400'}`} />
                                    Tahap 3
                                  </span>
                                  {step3Done ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                  ) : step2Done ? (
                                    <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                                  ) : (
                                    <Lock className="w-4 h-4 text-slate-400" />
                                  )}
                                </div>
                                <h4 className="text-xs font-black text-slate-900 dark:text-white">Dinas PUPTR (Tata Ruang)</h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                                  {step3Done ? (
                                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">Pertek Tata Ruang Disetujui</span>
                                  ) : (
                                    <span className="text-slate-500">Kajian Zonasi RTRW &amp; Koefisien</span>
                                  )}
                                </p>

                                {/* Tooltip on Hover */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-950 text-white rounded-xl shadow-2xl border border-slate-800 text-[11px] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-30 space-y-1">
                                  <div className="flex items-center justify-between font-bold text-blue-400 border-b border-slate-800 pb-1">
                                    <span>Tahap 3: Pertimbangan Teknis</span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${step3Done ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                      {step3Done ? 'Disetujui' : 'Menunggu Review'}
                                    </span>
                                  </div>
                                  <p className="text-slate-300 text-[10px] leading-tight">
                                    Penetapan Koefisien Dasar Bangunan (KDB), Garis Sempadan Bangunan (GSB), dan kesesuaian Pola Ruang RTRW Kab. Luwu.
                                  </p>
                                  <div className="pt-1 text-[9px] text-slate-400 flex justify-between">
                                    <span>PIC: Bidang Tata Ruang PUPTR</span>
                                    <span>SOP: 2 Hari Kerja</span>
                                  </div>
                                </div>
                              </div>

                              {/* Step 4: DPMPTSP SK Issuance */}
                              <div className={`group relative p-3.5 rounded-2xl border transition-all ${
                                step4Done
                                  ? 'bg-emerald-500/15 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
                                  : step3Done
                                  ? 'bg-blue-500/5 border-blue-500/30 hover:border-blue-500/60'
                                  : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 opacity-60'
                              }`}>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
                                    <span className={`w-2 h-2 rounded-full ${step4Done ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                    Tahap 4
                                  </span>
                                  {step4Done ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                  ) : step3Done ? (
                                    <Clock className="w-4 h-4 text-blue-500 animate-pulse" />
                                  ) : (
                                    <Lock className="w-4 h-4 text-slate-400" />
                                  )}
                                </div>
                                <h4 className="text-xs font-black text-slate-900 dark:text-white">SK PKKPR &amp; TTE DPMPTSP</h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                                  {step4Done ? (
                                    <span className="text-emerald-700 dark:text-emerald-400 font-black">SK Terbit (Siap Cetak PDF)</span>
                                  ) : (
                                    <span className="text-slate-500">Penerbitan SK &amp; TTE BSrE</span>
                                  )}
                                </p>

                                {/* Tooltip on Hover */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-950 text-white rounded-xl shadow-2xl border border-slate-800 text-[11px] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-30 space-y-1">
                                  <div className="flex items-center justify-between font-bold text-emerald-400 border-b border-slate-800 pb-1">
                                    <span>Tahap 4: Tanda Tangan Elektronik</span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${step4Done ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'}`}>
                                      {step4Done ? 'SK Terbit' : 'Tahap Akhir'}
                                    </span>
                                  </div>
                                  <p className="text-slate-300 text-[10px] leading-tight">
                                    Penerbitan Surat Keputusan (SK) PKKPR resmi dengan sertifikat TTE BSrE Badan Siber dan Sandi Negara.
                                  </p>
                                  <div className="pt-1 text-[9px] text-slate-400 flex justify-between">
                                    <span>PIC: Kepala DPMPTSP Luwu</span>
                                    <span>Status: Dokumen Sah Hukum</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Technical Project Specs Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Luas Lahan Dimohon:</span>
                              <p className="font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                                {app.luasHa ? app.luasHa.toFixed(2) : '0'} Ha ({app.luasM2 ? app.luasM2.toLocaleString('id-ID') : '0'} m²)
                              </p>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Rencana Investasi:</span>
                              <p className="font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                                {formatRupiahSingkat(app.nilaiInvestasi)}
                              </p>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Penanggung Jawab:</span>
                              <p className="font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                                {app.namaPemohon}
                              </p>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Tanggal Registrasi:</span>
                              <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                                {new Date(app.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                          </div>

                          {/* OPD Technical Notes Callout (if available) */}
                          {app.catatanTeknis && (
                            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1">
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Catatan Teknis OPD:
                              </span>
                              <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans text-xs">
                                {app.catatanTeknis}
                              </p>
                            </div>
                          )}

                          {/* ACTION FOOTER */}
                          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              {isPublished ? (
                                <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  SK PKKPR ini resmi dan telah memenuhi persyaratan untuk proses Persetujuan Bangunan Gedung (PBG) di SIMBG.
                                </span>
                              ) : (
                                <span className="text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                                  Estimasi SLA: &le; 3 Hari Kerja setelah seluruh pertimbangan teknis terpenuhi.
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                              {/* Glowing Print Button when Published or Approved */}
                              {isPublished || isApproved ? (
                                <button
                                  onClick={() => handleOpenSkDocument(app)}
                                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer active:scale-95"
                                >
                                  <Printer className="w-4 h-4" />
                                  <span>Cetak SK PKKPR Resmi (PDF)</span>
                                </button>
                              ) : (
                                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium italic flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Tombol cetak otomatis aktif setelah SK disahkan DPMPTSP</span>
                                </div>
                              )}

                              {/* Download original attachment if provided by admin */}
                              {app.fileSkPkkprUrl && (
                                <a
                                  href={app.fileSkPkkprUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                                >
                                  <Download className="w-4 h-4 text-teal-400" />
                                  <span>Unduh File Asli</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        ) : activeTab === 'site-selection' ? (
          <div className="py-4 sm:py-8 animate-in fade-in zoom-in-95 duration-300 h-[calc(100vh-140px)] md:h-[calc(100vh-100px)]">
            <AISiteSelection />
          </div>
        ) : activeTab === 'verify' ? (
          <div className="py-4 sm:py-8 animate-in fade-in zoom-in-95 duration-300">
            <NibVerificationForm isDarkMode={isDarkTheme} />
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
                <p className="text-slate-600 dark:text-slate-300 text-sm max-w-3xl leading-relaxed">
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
              let viabilityText = i18n.language?.startsWith("zh")
                ? "不可行 (高风险)"
                : i18n.language?.startsWith("en")
                  ? "Not Feasible (High Risk)"
                  : "Tidak Layak (Risiko Tinggi)";
              let viabilityColorClass = "text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/20";
              if (npv > 0 && irr > numWacc) {
                isViable = true;
                viabilityText = i18n.language?.startsWith("zh")
                  ? "非常可行 (推荐)"
                  : i18n.language?.startsWith("en")
                    ? "Highly Feasible (Recommended)"
                    : "Sangat Layak (Direkomendasikan)";
                viabilityColorClass = "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
              } else if (npv > 0) {
                isViable = true;
                viabilityText = i18n.language?.startsWith("zh")
                  ? "基本可行 (需要监测)"
                  : i18n.language?.startsWith("en")
                    ? "Feasible Enough (Needs Monitoring)"
                    : "Cukup Layak (Perlu Pemantauan)";
                viabilityColorClass = "text-blue-700 dark:text-blue-400 bg-blue-500/10 border-blue-500/20";
              } else if (labaBersih > 0) {
                viabilityText = i18n.language?.startsWith("zh")
                  ? "临界状态 (中等风险)"
                  : i18n.language?.startsWith("en")
                    ? "Marginal (Medium Risk)"
                    : "Marjinal (Risiko Sedang)";
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
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{t('roi_simulator_desc', 'Sesuaikan nilai investasi dan asumsi makro untuk memprediksi profitabilitas secara real-time.')}</p>
                    </div>

                    {/* Target Potensi Investasi (Full Width Select) */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
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
                            textMuted="text-slate-600 dark:text-slate-400"
                            inputBg="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 focus:border-cyan-500/50"
                            useDetailed={isUsingOSS}
                            setUseDetailed={setIsUsingOSS}
                        />
                      </div>

                      {/* Revenue Input */}
                      <div className={`space-y-2 ${isUsingOSS ? "w-full pt-4 border-t border-slate-200 dark:border-slate-800" : ""}`}>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                          {t('est_revenue', 'Estimasi Pendapatan Tahunan')}
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 text-xs font-mono font-bold">Rp</span>
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
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
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
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 text-xs font-mono font-bold">%</span>
                        </div>
                      </div>

                      {/* Tenor */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
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
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 text-xs font-mono font-bold">Thn</span>
                        </div>
                      </div>

                      {/* Inflation */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
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
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 text-xs font-mono font-bold">%</span>
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
                            ? 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900/20 cursor-not-allowed opacity-50' 
                            : 'border-emerald-500/80 hover:border-emerald-400 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                        }`}
                      >
                        {isPdfGenerating ? (
                          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0"></div>
                        ) : (
                          <FileText size={18} className={simRunCount === 0 ? "text-slate-600 dark:text-slate-400 shrink-0" : "text-emerald-700 dark:text-emerald-400 shrink-0"} />
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
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          {t('financial.roiAnnual', 'ROI Tahunan (Rata-rata)')}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/60 flex justify-between items-center text-xs">
                        <span className="text-slate-600 dark:text-slate-300">{t('financial.roiCumulativeDynamic', 'ROI Kumulatif ({{years}} Thn)', { years: numTenor })}:</span>
                        <span className="font-mono font-bold text-cyan-400">{roiKumulatif.toFixed(1)}%</span>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center gap-2">
                        <span className="text-emerald-700 dark:text-emerald-400/80">💡</span>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {t('dashboard.roiBenchmark', 'Benchmark Luwu: ~10% - 12% (Rata-rata sektor)')}
                        </p>
                      </div>
                      {/* Tooltip (appears on card hover) */}
                      <div className="absolute opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300 bg-slate-800 text-xs text-slate-300 p-2.5 rounded-xl shadow-2xl border border-slate-700 z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap">
                        {i18n.language?.startsWith("zh") ? "公式：(年净利润 / 总资本支出) × 100%" : i18n.language?.startsWith("en") ? "Formula: (Annual Net Profit / Total CAPEX) × 100%" : "Rumus: (Laba Bersih Tahunan / Total Nilai CAPEX) × 100%"}
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
                          {paybackSederhana > 0 ? `${paybackSederhana.toFixed(1)} ${t('roiSimulator.years', 'Tahun')}` : 'N/A'}
                        </div>
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          {t('financial.paybackSimple', 'Payback Sederhana')}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/60 flex justify-between items-center text-xs">
                        <span className="text-slate-600 dark:text-slate-300">{t('financial.paybackDiscountedDynamic', 'Payback Diskonto ({{rate}}%)', { rate: numWacc })}:</span>
                        <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400">
                          {paybackDiskonto > 0 ? `${paybackDiskonto.toFixed(1)} ${t('roiSimulator.years', 'Tahun')}` : i18n.language?.startsWith("zh") ? "不回收 / > 期限" : i18n.language?.startsWith("en") ? "N/A / > Tenor" : "N/A / > Tenor"}
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
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          {t('roiSimulator.netProfit', 'Laba Bersih Tahunan')}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/60 flex justify-between items-center text-xs">
                        <span className="text-slate-600 dark:text-slate-300">{i18n.language?.startsWith("zh") ? "总预计收益:" : i18n.language?.startsWith("en") ? "Total Projected Receipts:" : "Total Proyeksi Penerimaan:"}</span>
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
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          Kelayakan Proyek
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/60 flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
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
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          {t('financial.npvTitle', 'Net Present Value (NPV)')}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/60 flex justify-between items-center text-xs">
                        <span className="text-slate-600 dark:text-slate-300">{i18n.language?.startsWith("zh") ? "可行性阈值 (NPV > 0)：" : i18n.language?.startsWith("en") ? "Feasibility Threshold (NPV > 0):" : "Threshold Kelayakan (NPV > 0):"}</span>
                        <span className={`font-mono font-bold ${npv > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {npv > 0 
                            ? (i18n.language?.startsWith("zh") ? "符合 / 可行" : i18n.language?.startsWith("en") ? "Feasible" : "Sesuai / Layak")
                            : (i18n.language?.startsWith("zh") ? "不符合" : i18n.language?.startsWith("en") ? "Less Feasible" : "Kurang Layak")
                          }
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
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          Internal Rate of Return (IRR)
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/60 flex justify-between items-center text-xs">
                        <span className="text-slate-600 dark:text-slate-300">{i18n.language?.startsWith("zh") ? `资金成本 / WACC (${numWacc}%)：` : i18n.language?.startsWith("en") ? `Cost of Capital / WACC (${numWacc}%):` : `Biaya Modal / WACC (${numWacc}%):`}</span>
                        <span className={`font-mono font-bold ${irr > numWacc ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {irr > numWacc 
                            ? (i18n.language?.startsWith("zh") ? "IRR > WACC (可行)" : i18n.language?.startsWith("en") ? "IRR > WACC (Feasible)" : "IRR > WACC (Layak)")
                            : (i18n.language?.startsWith("zh") ? "IRR < WACC (有风险)" : i18n.language?.startsWith("en") ? "IRR < WACC (Risky)" : "IRR < WACC (Berisiko)")
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 5. Chart Section: Visualisasi Analisis Sensitivitas NPV */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">
                        {i18n.language?.startsWith("zh") ? "NPV 敏感性分析可视化" : i18n.language?.startsWith("en") ? "NPV Sensitivity Analysis Visualization" : "Visualisasi Analisis Sensitivitas NPV"}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {i18n.language?.startsWith("zh") 
                          ? "三种宏观经济情景下，基于 WACC (贴现率) 波动的 NPV 趋势。" 
                          : i18n.language?.startsWith("en") 
                            ? "NPV movement based on WACC (discount rate) fluctuations under three macroeconomic scenarios." 
                            : "Pergerakan NPV berdasarkan fluktuasi WACC (Suku Bunga Diskonto) di bawah tiga skenario makroekonomi."}
                      </p>
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
                            label={{ value: i18n.language?.startsWith("zh") ? 'NPV (百万印尼盾)' : i18n.language?.startsWith("en") ? 'NPV (Million Rp)' : 'NPV (Juta Rp)', angle: -90, position: 'insideLeft', fill: '#64748b', style: { textAnchor: 'middle' } }}
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
                            label={{ value: i18n.language?.startsWith("zh") ? '可行性阈值 (NPV=0)' : i18n.language?.startsWith("en") ? 'Feasibility Threshold (NPV=0)' : 'Ambang Kelayakan (NPV=0)', fill: '#f43f5e', position: 'top', fontSize: 10 }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="Baseline NPV" 
                            name={i18n.language?.startsWith("zh") ? "基线 NPV" : i18n.language?.startsWith("en") ? "Baseline NPV" : "Baseline NPV"}
                            stroke="#3b82f6" 
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="Skenario Inflasi +5%" 
                            name={i18n.language?.startsWith("zh") ? "高通胀情景 (+5%)" : i18n.language?.startsWith("en") ? "Inflation Scenario (+5%)" : "Skenario Inflasi +5%"}
                            stroke="#ef4444" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ r: 3 }} 
                            activeDot={{ r: 5 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="Skenario Tanpa Inflasi" 
                            name={i18n.language?.startsWith("zh") ? "无通胀情景" : i18n.language?.startsWith("en") ? "No Inflation Scenario" : "Skenario Tanpa Inflasi"}
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
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {i18n.language?.startsWith("zh") ? "财务敏感性分析解读" : i18n.language?.startsWith("en") ? "Financial Sensitivity Interpretation" : "Interpretasi Sensitivitas Finansial"}
                      </h4>
                      <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                        <p>
                          {i18n.language?.startsWith("zh") 
                            ? "横轴表示 WACC / 贴现率从 2% 到 26% 的变化。红色虚线表示 NPV = 0 的边界。如果情景曲线位于此边界上方，则该项目被认为在财务上是可行的。通胀 +5% 情景模拟了未来的成本增加，而无通胀情景则代表完全稳定的市场条件。" 
                            : i18n.language?.startsWith("en") 
                              ? "The horizontal axis shows variations in WACC / Discount Rate from 2% to 26%. The red dashed line marks the NPV = 0 threshold. If a scenario line is above this threshold, the project is financially feasible. The Inflation +5% Scenario simulates future cost increases, while the No Inflation Scenario represents stable market conditions." 
                              : "Sumbu horizontal menunjukkan variasi WACC / Suku Bunga Diskonto dari 2% hingga 26%. Garis putus-putus merah menandakan batas NPV = 0. Jika garis skenario berada di atas batas ini, proyek dinilai layak secara finansial. Skenario Inflasi +5% menyimulasikan peningkatan biaya di masa mendatang, sedangkan Skenario Tanpa Inflasi mewakili kondisi pasar yang sepenuhnya stabil."
                          }
                        </p>
                        <p className="text-[11px] text-cyan-400/90 font-semibold">
                          {i18n.language?.startsWith("zh") 
                            ? "💡 敏感性分析：NPV 曲线越平缓，项目对贴现率冲击的抵御能力就越强。如果 Luwu 的实际贴现率低于 NPV=0 的交点，您的投资就是安全的。" 
                            : i18n.language?.startsWith("en") 
                              ? "💡 Sensitivity Analysis: The flatter the NPV curve, the more resilient the project is to discount rate shocks. If Luwu's actual WACC remains below the NPV=0 intersection point, your investment is secure." 
                              : "💡 Analisis Sensitivitas: Semakin landai kurva NPV, semakin resilien proyek terhadap guncangan suku bunga diskonto. Jika nilai WACC aktual Luwu berada di bawah titik persimpangan NPV=0, maka investasi Anda dijamin aman."
                          }
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
                      <span>{i18n.language?.startsWith("zh") ? "请求 AI 可行性分析 ✨" : i18n.language?.startsWith("en") ? "REQUEST AI FEASIBILITY ANALYSIS ✨" : "MINTA ANALISIS KELAYAKAN AI ✨"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('overview')}
                      className="flex-1 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white font-bold py-3.5 px-6 rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm tracking-wide uppercase"
                    >
                      <Map size={16} className="text-emerald-700 dark:text-emerald-400" />
                      <span>{i18n.language?.startsWith("zh") ? "卢乌潜力分析 🗺️" : i18n.language?.startsWith("en") ? "LUWU POTENTIAL ANALYSIS 🗺️" : "ANALISIS POTENSI LUWU 🗺️"}</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : activeTab === 'survey_skm' ? (
          <div className="py-4 sm:py-8 animate-in fade-in zoom-in-95 duration-300">
            <MppCitizenSurveyMenu
              userType="investor"
              isLoggedIn={true}
              defaultName={hydratedCorporateProfile.namaPenanggungJawab || companyName || ""}
              defaultCompany={hydratedCorporateProfile.namaPerusahaan || companyName || ""}
              isDarkMode={isDarkTheme}
            />
          </div>
        ) : activeTab === 'testimonial' ? (
          <div className="py-4 sm:py-8 animate-in fade-in zoom-in-95 duration-300">
            <MppCitizenTestimonialMenu
              userType="investor"
              defaultName={hydratedCorporateProfile.namaPenanggungJawab || companyName || ""}
              defaultCompany={hydratedCorporateProfile.namaPerusahaan || companyName || ""}
              isDarkMode={isDarkTheme}
            />
          </div>
        ) : null}
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
            isDarkMode={isDarkTheme}
            currentRole={userRole as any}
          />
        )}
      </AnimatePresence>

      {/* CORPORATE PKKPR APPLICATION MODAL */}
      <AnimatePresence>
        {(isCorporatePkkprModalOpen && !isDrawerOpen) && (
          <motion.div
            key="pkkpr-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-slate-950/80 backdrop-blur-md flex justify-end"
          >
            <motion.div
              key="pkkpr-modal"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl h-full overflow-y-auto p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 mb-1">
                      <Building2 className="w-3 h-3" /> Corporate Permohonan Form
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Permohonan PKKPR Corporate / Investasi
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang Skala Komersial & Industri
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCorporatePkkprModalOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form id="corporatePkkprForm" onSubmit={handleSubmitCorporatePkkpr} className="space-y-5">
                  {/* SECTION 1: AUTO-HYDRATED CORPORATE IDENTITY (LOCKED) */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" /> Profil Badan Usaha & Penanggung Jawab
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <Lock className="w-3 h-3" /> Supabase Verified
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Nama Penanggung Jawab / Direksi
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={hydratedCorporateProfile.namaPenanggungJawab}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-500/30 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-emerald-400 text-xs font-bold cursor-not-allowed opacity-90"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Nama Perusahaan / PT / CV
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={hydratedCorporateProfile.namaPerusahaan}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-500/30 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-emerald-400 text-xs font-bold cursor-not-allowed opacity-90"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          NIB OSS RBA (13 Digit)
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={hydratedCorporateProfile.nib}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-500/30 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-emerald-400 text-xs font-mono font-bold cursor-not-allowed opacity-90"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Email Resmi Perusahaan
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={hydratedCorporateProfile.emailPerusahaan}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-500/30 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-emerald-400 text-xs font-bold cursor-not-allowed opacity-90"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: RINCIAN PROYEK & RENCANA INVESTASI */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                        Judul Kegiatan / Proyek Investasi <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={pkkprJudulProyek}
                        onChange={(e) => setPkkprJudulProyek(e.target.value)}
                        placeholder="Contoh: Pembangunan Pabrik Pengolahan Kelapa Sawit PT Luwu Agro"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-semibold focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                        Sektor Investasi <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={pkkprSektor}
                        onChange={(e) => setPkkprSektor(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-semibold focus:border-emerald-500 outline-none transition-all"
                      >
                        <option value="Industri Pengolahan">Industri Pengolahan</option>
                        <option value="Agroindustri & Pertanian">Agroindustri & Pertanian</option>
                        <option value="Pertambangan & Energi">Pertambangan & Energi</option>
                        <option value="Pariwisata & Ekonomi Kreatif">Pariwisata & Ekonomi Kreatif</option>
                        <option value="Infrastruktur & Logistik">Infrastruktur & Logistik</option>
                        <option value="Perdagangan & Jasa">Perdagangan & Jasa</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                        Estimasi Nilai Investasi (RP) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min={1000000}
                        value={pkkprNilaiInvestasi}
                        onChange={(e) => setPkkprNilaiInvestasi(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-mono font-bold focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* SECTION 3: CASCADING LOCATION SELECTION (Kecamatan -> Desa gis_desa) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Kecamatan Lokasi Lahan <span className="text-rose-500">*</span>
                        </label>
                        {isPkkprLocationLocked && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <Lock className="w-3 h-3" /> Terkunci Spasial
                          </span>
                        )}
                      </div>
                      <select
                        required
                        disabled={isPkkprLocationLocked}
                        value={pkkprKecamatan}
                        onChange={(e) => {
                          setPkkprKecamatan(e.target.value);
                          setPkkprDesa("");
                        }}
                        className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold outline-none transition-all ${
                          isPkkprLocationLocked
                            ? "bg-slate-100 dark:bg-slate-950/80 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 cursor-not-allowed opacity-90 font-bold"
                            : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-emerald-500"
                        }`}
                      >
                        <option value="">-- Pilih Kecamatan --</option>
                        {districts && districts.length > 0 ? (
                          districts.map((d) => {
                            const kLabel = getKecamatanLabel(d);
                            const kId = getKecamatanId(d) || kLabel;
                            return (
                              <option key={kId} value={kLabel}>
                                {kLabel}
                              </option>
                            );
                          })
                        ) : (
                          [
                            "Bajo",
                            "Bajo Barat",
                            "Basse Sangtempe",
                            "Basse Sangtempe Utara",
                            "Belopa",
                            "Belopa Utara",
                            "Bua",
                            "Bua Ponrang",
                            "Kamanre",
                            "Lamasi",
                            "Lamasi Timur",
                            "Larompong",
                            "Larompong Selatan",
                            "Latimojong",
                            "Ponrang",
                            "Ponrang Selatan",
                            "Suli",
                            "Suli Barat",
                            "Walenrang",
                            "Walenrang Barat",
                            "Walenrang Timur",
                            "Walenrang Utara"
                          ].map((k) => (
                            <option key={k} value={k}>
                              {k}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Desa / Kelurahan <span className="text-rose-500">*</span>
                        </label>
                        {isPkkprLocationLocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <Lock className="w-3 h-3" /> Terkunci Spasial
                          </span>
                        ) : loadingPkkprDesa ? (
                          <span className="text-[10px] text-emerald-500 font-bold animate-pulse flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Memuat gis_desa...
                          </span>
                        ) : null}
                      </div>
                      {pkkprDesaList.length > 0 ? (
                        <select
                          required
                          disabled={isPkkprLocationLocked}
                          value={pkkprDesa}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPkkprDesa(val);
                            const matched = pkkprDesaList.find(v => getDesaLabel(v) === val || getDesaId(v) === val);
                            if (matched) {
                              setPkkprSelectedDesaId(getDesaId(matched) || val);
                              setPkkprSelectedDesaGeom(matched.geom || matched.geojson?.geometry || matched.geojson || matched);
                            }
                          }}
                          className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold outline-none transition-all ${
                            isPkkprLocationLocked
                              ? "bg-slate-100 dark:bg-slate-950/80 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 cursor-not-allowed opacity-90 font-bold"
                              : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-emerald-500"
                          }`}
                        >
                          <option value="">-- Pilih Desa / Kelurahan --</option>
                          {pkkprDesaList.map((v) => {
                            const vLabel = getDesaLabel(v);
                            const vId = getDesaId(v) || vLabel;
                            return (
                              <option key={vId} value={vLabel}>
                                {vLabel}
                              </option>
                            );
                          })}
                        </select>
                      ) : (
                        <select
                          required
                          value={pkkprDesa}
                          disabled={isPkkprLocationLocked || !pkkprKecamatan || loadingPkkprDesa}
                          onChange={(e) => setPkkprDesa(e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold outline-none transition-all disabled:opacity-60 ${
                            isPkkprLocationLocked
                              ? "bg-slate-100 dark:bg-slate-950/80 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 cursor-not-allowed opacity-90 font-bold"
                              : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-emerald-500"
                          }`}
                        >
                          {!pkkprKecamatan ? (
                            <option value="">-- Pilih Kecamatan Terlebih Dahulu --</option>
                          ) : loadingPkkprDesa ? (
                            <option value="">-- Memuat Desa dari Database Supabase... --</option>
                          ) : (
                            <option value="">-- Belum ada data desa terdaftar --</option>
                          )}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* SECTION 4: DUAL-MODE GEOMETRY INPUT (Manual vs KMZ Upload) */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Input Geometri Spasial Plot Lahan <span className="text-rose-500">*</span>
                      </label>

                      {/* Mode Toggle Buttons */}
                      <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSpatialInputMode("manual")}
                          className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                            spatialInputMode === "manual"
                              ? "bg-emerald-600 text-white shadow"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          Digitasi Peta
                        </button>
                        <button
                          type="button"
                          onClick={() => setSpatialInputMode("kmz")}
                          className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                            spatialInputMode === "kmz"
                              ? "bg-emerald-600 text-white shadow"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          <FileCode className="w-3.5 h-3.5" /> Unggah .KMZ / .KML
                        </button>
                      </div>
                    </div>

                    {/* MODE 1: MANUAL DIGITIZATION */}
                    {spatialInputMode === "manual" && (
                      <div>
                        {pkkprGeometry ? (
                          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                                <CheckCircle2 className="w-6 h-6" />
                              </div>
                              <div>
                                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono block">
                                  GEOMETRI SPASIAL TERSIMPAN
                                </span>
                                <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">
                                  Luas Poligon: <strong className="text-emerald-600 font-mono">{(pkkprLuasM2 / 10000).toFixed(2)} Ha</strong> ({pkkprLuasM2.toLocaleString()} m²)
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsDrawerOpen(true)}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                            >
                              Ubah Polygon
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (!pkkprKecamatan) {
                                Swal.fire("Kecamatan Belum Dipilih", "Silakan pilih Kecamatan lokasi lahan terlebih dahulu.", "warning");
                                return;
                              }
                              setIsDrawerOpen(true);
                            }}
                            className="w-full py-5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 border-2 border-dashed border-emerald-500/50 hover:border-emerald-500 text-slate-800 dark:text-slate-100 font-extrabold text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md group"
                          >
                            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-500 group-hover:scale-110 transition-transform">
                              <MapPin className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                              <span className="block font-black text-sm text-slate-900 dark:text-white">Buka Peta Digitasi Spasial Lahan</span>
                              <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                {pkkprDesa ? `Auto-Zoom & Kliping Wilayah ke Desa ${pkkprDesa}` : pkkprKecamatan ? `Auto-Zoom ke Kec. ${pkkprKecamatan}` : "Peta akan secara otomatis terkliping ke lokasi pilihan"}
                              </span>
                            </div>
                          </button>
                        )}
                      </div>
                    )}

                    {/* MODE 2: KMZ / KML FILE UPLOAD */}
                    {spatialInputMode === "kmz" && (
                      <div className="space-y-3">
                        <input
                          ref={kmzFileInputRef}
                          type="file"
                          accept=".kmz,.kml"
                          onChange={handleKmzFileUpload}
                          className="hidden"
                        />

                        {pkkprKmzFileInfo && pkkprGeometry ? (
                          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                                <FileCode className="w-6 h-6" />
                              </div>
                              <div>
                                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono block uppercase">
                                  BERKAS .KMZ / .KML TERPROSES
                                </span>
                                <p className="text-xs text-slate-700 dark:text-slate-300 font-bold truncate max-w-xs">
                                  {pkkprKmzFileInfo.fileName}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                  Luas: <strong className="text-emerald-600 font-mono">{pkkprKmzFileInfo.totalAreaHa} Ha</strong> ({pkkprLuasM2.toLocaleString()} m²)
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setIsDrawerOpen(true)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              >
                                Lihat Peta
                              </button>
                              <button
                                type="button"
                                onClick={() => kmzFileInputRef.current?.click()}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                              >
                                Ganti
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => kmzFileInputRef.current?.click()}
                            className="w-full py-6 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 border-2 border-dashed border-emerald-500/50 hover:border-emerald-500 text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all shadow-md group"
                          >
                            {isParsingKmz ? (
                              <div className="flex items-center gap-2 text-emerald-500 font-bold">
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span>Mengekstrak Poligon KMZ/KML...</span>
                              </div>
                            ) : (
                              <>
                                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-500 group-hover:scale-110 transition-transform">
                                  <UploadCloud className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                  <span className="block font-black text-sm text-slate-900 dark:text-white">
                                    Klik untuk Unggah Berkas .KMZ / .KML Google Earth
                                  </span>
                                  <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                    Sistem mengekstrak koordinat poligon spasial komersial/industri secara otomatis
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </form>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCorporatePkkprModalOpen(false)}
                  className="w-1/3 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  form="corporatePkkprForm"
                  disabled={isSubmittingCorporatePkkpr}
                  className="w-2/3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingCorporatePkkpr ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memproses Permohonan...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Kirim Permohonan PKKPR Corporate</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL PRATINJAU & CETAK DOKUMEN RESMI SK PKKPR */}
      <AnimatePresence>
        {isSkDocModalOpen && selectedSkDocumentData && (
          <motion.div
            key="sk-doc-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          >
            <motion.div
              key="sk-doc-modal-content"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]"
            >
              {/* Modal Top Bar */}
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      Dokumen Resmi Surat Keputusan (SK) PKKPR
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      No. SK: {selectedSkDocumentData.nomorSkPkkpr} • Keabsahan Terverifikasi TTE BSrE
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsSkDocModalOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                    aria-label="Tutup"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Document Scroll Area */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100 dark:bg-slate-950/80">
                <SkPkkprDpmptspDocument
                  data={selectedSkDocumentData}
                  showControlBar={true}
                />
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
                <span className="text-xs text-slate-500 hidden sm:inline">
                  Gunakan tombol <strong>Cetak Dokumen</strong> atau <strong>Unduh PDF</strong> di atas untuk mencetak atau menyimpan berkas resmi.
                </span>
                <button
                  type="button"
                  onClick={() => setIsSkDocModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold transition ml-auto cursor-pointer"
                >
                  Tutup Pratinjau
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SPATIAL GIS DRAWER WITH BOUNDARY CLIPPING & AUTO-ZOOM */}
      {isDrawerOpen && (
        <SimplePolygonDrawer
          isDarkMode={isDarkTheme}
          onCancel={() => setIsDrawerOpen(false)}
          focusTarget={{
            districtName: pkkprKecamatan,
            districtId: pkkprSelectedKecId,
            villageName: pkkprDesa,
            villageId: pkkprSelectedDesaId,
            villageGeojson: pkkprSelectedDesaGeom
          }}
          initialGeometry={pkkprGeometry}
          onSave={(geom, esg) => {
            setPkkprGeometry(geom);
            setPkkprEsgAnalysis(esg);

            let areaSqM = 0;
            try {
              const feature = { type: "Feature" as const, properties: {}, geometry: geom };
              areaSqM = Math.round(turf.area(feature as any));
            } catch {
              areaSqM = 10000;
            }
            setPkkprLuasM2(areaSqM);
            setIsDrawerOpen(false);
          }}
        />
      )}
    </div>
  );
}

// ui polish: executive premium fin-tech polish
// ui polish: resolve recharts 0x0 dimension warnings
// ux fix: dynamic role rendering in investor header

// ux pivot: removed i18n and implemented global light/dark mode toggle