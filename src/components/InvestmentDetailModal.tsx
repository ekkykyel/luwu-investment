import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import RoiAiAnalysisModal from "./RoiAiAnalysisModal";
import { ROICalculator } from "./ROICalculator";
import RtrwZoningCheckerModal from "./RtrwZoningCheckerModal";
import IncentiveCalculatorModal from "./IncentiveCalculatorModal";
import ProximityDistanceMatrixModal from "./ProximityDistanceMatrixModal";
import IproPitchDeckModal from "./IproPitchDeckModal";
import SpatialInfrastructureInspectorModal from "./SpatialInfrastructureInspectorModal";
import EsgRiskDueDiligenceModal from "./EsgRiskDueDiligenceModal";
import AutoTranslatedText from "./AutoTranslatedText";
import { ProgressiveImage } from "./ProgressiveImage";
import { generateInvestmentResumePdf, captureActiveMapSnapshot } from "../services/PdfExportService";
import { checkPkkprSpatialZoning, checkPkkprSuitabilityAsync, PkkprZoningResult, getPbgRequirements, PbgGatewayInfo, calculateDistanceKm } from "../utils/geoUtils";
import { LUWU_INFRASTRUCTURE_NODES, calculateHaversineDistanceKm } from "../lib/constants";
import {
  X,
  Map as MapIcon,
  Link as LinkIcon,
  Download,
  Navigation,
  Building,
  Zap,
  Target,
  Sparkles,
  Phone,
  Mail,
  Award,
  Calendar,
  Activity,
  Database,
  CheckCircle,
  Calculator,
  Percent,
  TrendingUp,
  DollarSign,
  Clock,
  HelpCircle,
  FileText,
  User,
  ExternalLink,
  Handshake,
  Lock,
  Wifi,
  Droplet,
  Info,
  ShieldCheck,
  Check,
  Briefcase,
  Layers,
  MapPin,
  Pencil,
  Minimize2,
  Maximize2,
  Loader2,
  Cross,
  Flame,
  GraduationCap,
  Anchor,
  Plane,
  Shield,
  Building2,
  ChevronDown,
  ChevronUp,
  HeartPulse,
  Compass,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  FileCheck,
  HardHat,
  CheckSquare,
  Square,
  ArrowUpRight
} from "lucide-react";
import Swal from "sweetalert2";
import * as turf from "@turf/turf";
import { motion, AnimatePresence } from "motion/react";

import { Role } from "../types";
import { supabase } from "../lib/supabaseClient";

const formatCurrencyInput = (value: string) => {
  if (!value) return "";
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";
  const num = Number(digits);
  return "Rp " + new Intl.NumberFormat("id-ID").format(num);
};

const parseCurrencyInput = (value: string) => {
  return value.replace(/\D/g, "");
};

const formatLandArea = (val: any) => {
  if (val === undefined || val === null || val === "") return "";
  const num = parseFloat(String(val).replace(",", "."));
  if (isNaN(num)) return "";
  return num.toFixed(2);
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


interface InvestmentDetailModalProps {
  investmentId: string;
  onClose: () => void;
  onOpenAiConsultant: (inv: any) => void;
  isDarkMode?: boolean;
  currentRole?: Role;
  onEdit?: () => void;
  onMinimizeToggle?: (isMinimized: boolean) => void;
  initialData?: any;
  onFocusDistrict?: (districtId: string) => void;
  infrastructure?: any[];
  onHoverInfrastructure?: (id: string, hover: boolean) => void;
  zoningLayers?: any;
  spatialLayers?: Record<string, any>;
}

export function InvestmentDetailModal({
  investmentId,
  onClose,
  onOpenAiConsultant,
  isDarkMode = false,
  currentRole,
  onEdit,
  onMinimizeToggle,
  initialData,
  onFocusDistrict,
  infrastructure = [],
  onHoverInfrastructure,
  zoningLayers,
  spatialLayers,
}: InvestmentDetailModalProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [contractStatus, setContractStatus] = useState<"none" | "pending" | "active">("none");
  const [profileData, setProfileData] = useState<any>(initialData || null);
  const [spatialData, setSpatialData] = useState<any>(null);
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(!initialData);
  const [loadingSpatial, setLoadingSpatial] = useState(true);
  const [spatialError, setSpatialError] = useState(false);
  const [pkkprStatus, setPkkprStatus] = useState<PkkprZoningResult | null>(null);
  const [loadingPkkpr, setLoadingPkkpr] = useState<boolean>(true);

  // Sync initialData changes directly to state instantly
  useEffect(() => {
    if (initialData) {
      setProfileData(initialData);
      setLoadingProfile(false);
    }
  }, [initialData, investmentId]);

  // Tab control
  const [activeTab, setActiveTab] = useState<"profile" | "simulator">(
    "profile",
  );

  const [isRoiAiModalOpen, setIsRoiAiModalOpen] = useState(false);

  // Photo Slider state
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);

  // Sandbox user-controlled options the simulator dynamically recalculates on the fly
  const [asumsiPendapatan, setAsumsiPendapatan] = useState<number>(0);
  const [sukuBunga, setSukuBunga] = useState<number>(10);
  const [tenorWaktu, setTenorWaktu] = useState<number>(5);
  const [activeScenario, setActiveScenario] = useState<"base" | "bear" | "bull">("base");

  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Advanced Luwu Investment Features Modals
  const [isRtrwModalOpen, setIsRtrwModalOpen] = useState(false);
  const [isIncentiveModalOpen, setIsIncentiveModalOpen] = useState(false);
  const [isProximityModalOpen, setIsProximityModalOpen] = useState(false);

  // Letter of Intent (LoI) modal states
  const [isLoiModalOpen, setIsLoiModalOpen] = useState(false);
  const [loiInvestorName, setLoiInvestorName] = useState("");
  const [loiCompanyName, setLoiCompanyName] = useState("");
  const [loiContactInfo, setLoiContactInfo] = useState("");
  const [loiInvestmentValue, setLoiInvestmentValue] = useState("");
  const [loiLandNeeded, setLoiLandNeeded] = useState("");
  const [loiNibOss, setLoiNibOss] = useState("");
  const [loiMessage, setLoiMessage] = useState("");
  const [isSubmittingLoi, setIsSubmittingLoi] = useState(false);
  const [isLoiFieldsLocked, setIsLoiFieldsLocked] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showIproPitchDeck, setShowIproPitchDeck] = useState(false);
  const [showLogisticsInspector, setShowLogisticsInspector] = useState(false);
  const [showEsgShield, setShowEsgShield] = useState(false);

  // PBG Licensing Gateway state
  const [pbgCategoryFilter, setPbgCategoryFilter] = useState<string>("ALL");
  const [checkedPbgDocs, setCheckedPbgDocs] = useState<Record<string, boolean>>({});

  const pbgInfo: PbgGatewayInfo = useMemo(() => {
    return getPbgRequirements(pkkprStatus);
  }, [pkkprStatus]);

  const pbgCategories = useMemo(() => {
    const cats = Array.from(new Set(pbgInfo.documents.map((d) => d.category)));
    return ["ALL", ...cats];
  }, [pbgInfo]);

  const filteredPbgDocs = useMemo(() => {
    if (pbgCategoryFilter === "ALL") return pbgInfo.documents;
    return pbgInfo.documents.filter((d) => d.category === pbgCategoryFilter);
  }, [pbgInfo, pbgCategoryFilter]);

  const togglePbgDoc = (docId: string) => {
    setCheckedPbgDocs((prev) => ({
      ...prev,
      [docId]: !prev[docId],
    }));
  };

  const pbgPreparedCount = useMemo(() => {
    return pbgInfo.documents.filter((d) => checkedPbgDocs[d.id]).length;
  }, [pbgInfo, checkedPbgDocs]);

  const pbgProgressPercent = useMemo(() => {
    if (pbgInfo.documents.length === 0) return 0;
    return Math.round((pbgPreparedCount / pbgInfo.documents.length) * 100);
  }, [pbgPreparedCount, pbgInfo]);

  const handleAjukanPbg = () => {
    const invName = profileData?.name || geo?.nama_potensi || "Proyek Investasi Daerah";
    const locName = `${getActualVillageName()}, Kec. ${getActualDistrictName()}`;
    const kdb = pkkprStatus?.kdb || "-";
    const klb = pkkprStatus?.klb || "-";
    const kdh = pkkprStatus?.kdh || "-";
    const zone = pkkprStatus?.matchedZone || "-";

    Swal.fire({
      title: `<div style="font-size: 16px; font-weight: 800; color: #0f172a; display: flex; align-items: center; justify-content: center; gap: 8px;">
        <span style="background: #ecfdf5; color: #059669; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 800;">SIMBG PUPR</span>
        Gateway Perizinan PBG Kab. Luwu
      </div>`,
      html: `
        <div style="text-align: left; font-size: 12px; color: #334155; line-height: 1.5;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; margin-bottom: 12px;">
            <div style="font-weight: 700; color: #0f172a; font-size: 13px; margin-bottom: 4px;">${invName}</div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">📍 ${locName}</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; padding-top: 6px; border-top: 1px dashed #cbd5e1;">
              <div><strong>Zona Pola Ruang:</strong><br/><span style="color: #047857; font-weight: 600;">${zone}</span></div>
              <div><strong>Batas Intensitas:</strong><br/>KDB ${kdb} | KLB ${klb} | KDH ${kdh}</div>
            </div>
          </div>

          <div style="font-weight: 700; color: #0f172a; margin-bottom: 6px; font-size: 12px;">
            Alur Pengajuan Persetujuan Bangunan Gedung (PBG):
          </div>
          <ol style="margin: 0; padding-left: 18px; font-size: 11px; color: #475569; display: flex; flex-direction: column; gap: 4px;">
            <li><strong>Registrasi Pemohon:</strong> Masuk ke portal resmi SIMBG (<strong>simbg.pu.go.id</strong>) menggunakan akun terintegrasi OSS-RBA.</li>
            <li><strong>Input Data Teknis:</strong> Masukkan nomor registrasi PKKPR dan unggah gambar rencana arsitektur, perhitungan struktur beton/baja, serta utilitas MEP.</li>
            <li><strong>Sidang Konsultasi TPT / TPA:</strong> Tim Penilai Teknis / Tim Profesi Ahli Dinas PUPR Kab. Luwu akan memverifikasi kesesuaian gambar terhadap KDB/KLB.</li>
            <li><strong>Penerbitan SK PBG & SLF:</strong> DPMPTSP Kab. Luwu menerbitkan surat persetujuan dan penetapan retribusi PBG resmi.</li>
          </ol>

          <div style="margin-top: 12px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 8px 10px; font-size: 11px; color: #065f46;">
            💡 <strong>Kesiapan Dokumen:</strong> Anda telah menandai <strong>${pbgPreparedCount} dari ${pbgInfo.documents.length}</strong> dokumen teknis (${pbgProgressPercent}% siap).
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Buka Portal SIMBG (simbg.pu.go.id) ↗",
      cancelButtonText: "Tutup Panduan",
      confirmButtonColor: "#d97706",
      cancelButtonColor: "#64748b",
      customClass: {
        popup: "rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        window.open("https://simbg.pu.go.id", "_blank", "noopener,noreferrer");
      }
    });
  };

  const handleGeneratePdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);

    try {
      // 1. Prepare distances list from calculated spatialData / proximityIntel / direct spatial calculation
      let distancesList: any[] = [];
      if (proximityIntel && proximityIntel.length > 0) {
        distancesList = proximityIntel.map((item: any) => ({
          name: item.name || "Fasilitas",
          distanceKm: typeof item.distance === "number" ? item.distance : parseFloat(item.distance || "0"),
          type: item.type || "Infrastruktur",
          isNetworkRouting: item.isNetworkRouting,
        })).filter((d: any) => d.distanceKm > 0);
      }

      if (distancesList.length === 0 && spatialData?.distances) {
        const rawDist = spatialData.distances;
        const pLat = Number(profileData?.latitude || geo?.latitude || 0);
        const pLng = Number(profileData?.longitude || geo?.longitude || 0);
        const invLoc = (pLat !== 0 && pLng !== 0) ? { latitude: pLat, longitude: pLng } : null;

        distancesList = [
          rawDist.nearestRoad && {
            name: rawDist.nearestRoad.name || "Jaringan Jalan Utama",
            distanceKm: rawDist.nearestRoad.distanceKm ?? (invLoc ? calculateDistanceKm(invLoc, LUWU_INFRASTRUCTURE_NODES.TRANS_SULAWESI) : 0),
            type: "Jaringan Jalan Nasional/Provinsi",
            isNetworkRouting: rawDist.nearestRoad.isNetworkRouting,
          },
          rawDist.nearestPort && {
            name: rawDist.nearestPort.name || "Pelabuhan Logistik Utama",
            distanceKm: rawDist.nearestPort.distanceKm ?? (invLoc ? calculateDistanceKm(invLoc, LUWU_INFRASTRUCTURE_NODES.PELABUHAN_BELOPA) : 0),
            type: "Pelabuhan Logistik & Kargo",
            isNetworkRouting: rawDist.nearestPort.isNetworkRouting,
          },
          rawDist.nearestAirport && {
            name: rawDist.nearestAirport.name || "Bandar Udara Regional",
            distanceKm: rawDist.nearestAirport.distanceKm ?? (invLoc ? calculateDistanceKm(invLoc, LUWU_INFRASTRUCTURE_NODES.BANDARA_BUA) : 0),
            type: "Bandar Udara Regional",
            isNetworkRouting: rawDist.nearestAirport.isNetworkRouting,
          },
          rawDist.nearestPowerGrid && {
            name: rawDist.nearestPowerGrid.name || "Gardu Induk Listrik PLN",
            distanceKm: rawDist.nearestPowerGrid.distanceKm ?? (invLoc ? calculateDistanceKm(invLoc, LUWU_INFRASTRUCTURE_NODES.PLN_SUBSTATION) : 0),
            type: "Infrastruktur Energi Listrik",
            isNetworkRouting: rawDist.nearestPowerGrid.isNetworkRouting,
          },
          rawDist.nearestWater && {
            name: rawDist.nearestWater.name || "Sumber Air Baku Utama",
            distanceKm: rawDist.nearestWater.distanceKm ?? (invLoc ? calculateDistanceKm(invLoc, LUWU_INFRASTRUCTURE_NODES.WATER_BASIN) : 0),
            type: "Infrastruktur Sumber Daya Air",
            isNetworkRouting: false,
          },
          rawDist.nearestTelco && {
            name: rawDist.nearestTelco.name || "Infrastruktur Telekomunikasi (4G/5G)",
            distanceKm: rawDist.nearestTelco.distanceKm ?? (invLoc ? calculateDistanceKm(invLoc, LUWU_INFRASTRUCTURE_NODES.GOV_CENTER) : 0),
            type: "Infrastruktur Telekomunikasi",
            isNetworkRouting: rawDist.nearestTelco.isNetworkRouting,
          },
        ].filter(Boolean);
      }

      // If still empty, calculate geodesic distance from coordinates to authentic Luwu hub coordinates
      if (distancesList.length === 0) {
        const pLat = Number(profileData?.latitude || geo?.latitude || -3.27301);
        const pLng = Number(profileData?.longitude || geo?.longitude || 120.26564);

        distancesList = [
          {
            name: LUWU_INFRASTRUCTURE_NODES.TRANS_SULAWESI.name,
            distanceKm: calculateHaversineDistanceKm(pLat, pLng, LUWU_INFRASTRUCTURE_NODES.TRANS_SULAWESI.lat, LUWU_INFRASTRUCTURE_NODES.TRANS_SULAWESI.lng),
            type: LUWU_INFRASTRUCTURE_NODES.TRANS_SULAWESI.type,
            isNetworkRouting: true,
          },
          {
            name: LUWU_INFRASTRUCTURE_NODES.PELABUHAN_BELOPA.name,
            distanceKm: calculateHaversineDistanceKm(pLat, pLng, LUWU_INFRASTRUCTURE_NODES.PELABUHAN_BELOPA.lat, LUWU_INFRASTRUCTURE_NODES.PELABUHAN_BELOPA.lng),
            type: LUWU_INFRASTRUCTURE_NODES.PELABUHAN_BELOPA.type,
            isNetworkRouting: true,
          },
          {
            name: LUWU_INFRASTRUCTURE_NODES.BANDARA_BUA.name,
            distanceKm: calculateHaversineDistanceKm(pLat, pLng, LUWU_INFRASTRUCTURE_NODES.BANDARA_BUA.lat, LUWU_INFRASTRUCTURE_NODES.BANDARA_BUA.lng),
            type: LUWU_INFRASTRUCTURE_NODES.BANDARA_BUA.type,
            isNetworkRouting: true,
          },
          {
            name: LUWU_INFRASTRUCTURE_NODES.PLN_SUBSTATION.name,
            distanceKm: calculateHaversineDistanceKm(pLat, pLng, LUWU_INFRASTRUCTURE_NODES.PLN_SUBSTATION.lat, LUWU_INFRASTRUCTURE_NODES.PLN_SUBSTATION.lng),
            type: LUWU_INFRASTRUCTURE_NODES.PLN_SUBSTATION.type,
            isNetworkRouting: true,
          },
          {
            name: LUWU_INFRASTRUCTURE_NODES.WATER_BASIN.name,
            distanceKm: calculateHaversineDistanceKm(pLat, pLng, LUWU_INFRASTRUCTURE_NODES.WATER_BASIN.lat, LUWU_INFRASTRUCTURE_NODES.WATER_BASIN.lng),
            type: LUWU_INFRASTRUCTURE_NODES.WATER_BASIN.type,
            isNetworkRouting: false,
          },
          {
            name: LUWU_INFRASTRUCTURE_NODES.GOV_CENTER.name,
            distanceKm: calculateHaversineDistanceKm(pLat, pLng, LUWU_INFRASTRUCTURE_NODES.GOV_CENTER.lat, LUWU_INFRASTRUCTURE_NODES.GOV_CENTER.lng),
            type: LUWU_INFRASTRUCTURE_NODES.GOV_CENTER.type,
            isNetworkRouting: true,
          },
        ];
      }

      // Guarantee authentic PKKPR & PBG status
      let activePkkpr = pkkprStatus;
      if (!activePkkpr || activePkkpr.matchedZone === "-" || activePkkpr.suitabilityLabel === "-") {
        const rawGeom = spatialData?.geometry || geo?.geometry || profileData?.geometry || {
          type: "Point",
          coordinates: [
            Number(profileData?.longitude || geo?.longitude || 120.26564),
            Number(profileData?.latitude || geo?.latitude || -3.27301)
          ]
        };
        activePkkpr = checkPkkprSpatialZoning(rawGeom);
      }

      let activePbg = pbgInfo;
      if (!activePbg || !activePbg.documents || activePbg.documents.length === 0) {
        activePbg = getPbgRequirements(activePkkpr);
      }

      // 2. Capture map snapshot
      const mapSnapshot = await captureActiveMapSnapshot();

      // 3. Trigger PDF Generator
      await generateInvestmentResumePdf({
        investment: {
          id: investmentId || profileData?.id || "INV-001",
          name: profileData?.name || geo?.nama_potensi || "Sentra Industri & Perkebunan Kakao Noling",
          sector: profileData?.sector || geo?.sektor_utama || "Pertanian & Perkebunan",
          subSector: geo?.sub_sektor || profileData?.subSector || "Hilirisasi Komoditas Kakao",
          district: getActualDistrictName(),
          village: getActualVillageName(),
          areaHa: calculatedAreaHa,
          perimeterKm: calculatedPerimeterKm,
          investmentValue: profileData?.investmentValue || geo?.estimasi_nilai || capex,
          status: normalizedStatus,
          description: profileData?.description || geo?.deskripsi,
          latitude: profileData?.latitude || geo?.latitude || spatialData?.centroid?.lat,
          longitude: profileData?.longitude || geo?.longitude || spatialData?.centroid?.lng,
          contactPic: profileData?.contactPerson || geo?.kontak_person || "-",
          phoneNumber: profileData?.contactPhone || geo?.nomor_telepon || "-",
          email: profileData?.contactEmail || "-",
          tenorYears: tenorWaktu,
          roiPercent: roi,
          npvValue: npv,
          irrPercent: irr,
          bepYears: bep,
          capex: capex,
          opex: opex,
        },
        spatialDistances: distancesList,
        pkkprStatus: activePkkpr,
        pbgInfo: activePbg,
        mapSnapshotBase64: mapSnapshot,
        tteData: {
          approverName: "KASNAR, SE., M.Si",
          approverTitle: "Kepala Dinas Penanaman Modal & Pelayanan Terpadu Satu Pintu",
          approverNip: "19700405 200212 1 007",
          verificationNumber: `DPMPTSP-LUWU/PELAYANAN/${new Date().getFullYear()}/${(investmentId || "001").substring(0, 8).toUpperCase()}`,
          issuedDate: new Date().toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
        },
      });

      Swal.fire({
        icon: "success",
        title: "Resume PDF Berhasil Diterbitkan",
        text: "Dokumen formal resume potensi & kelayakan spasial telah diunduh dengan standar pelayanan resmi.",
        confirmButtonColor: "#059669",
        timer: 3000,
      });
    } catch (err: any) {
      console.error("Gagal mencetak resume PDF:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal Mencetak Resume PDF",
        text: err?.message || "Terjadi kendala saat merender dokumen PDF resmi.",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  useEffect(() => {
    if (isLoiModalOpen) {
      const loadLoiSession = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const u = session.user;
            
            // Try fetching from profiles table first
            let profileName = "";
            let profileRole = "";
            try {
               const { data: profile } = await supabase.from('profiles').select('*').eq('id', u.id).single();
               if (profile) {
                 profileName = profile.full_name || "";
                 profileRole = profile.role || "";
               }
            } catch (e) {
               undefined;
            }

            const meta = u.user_metadata || {};
            const fullNameVal = profileName || meta.company_name || meta.full_name || u.email || "";
            const companyVal = meta.company_name || meta.company || "";
            const contactVal = u.email || meta.phone || meta.contact || "";

            setLoiInvestorName(fullNameVal);
            setLoiCompanyName(companyVal);
            setLoiContactInfo(contactVal);
            setIsLoiFieldsLocked(true);
          } else {
            setIsLoiFieldsLocked(false);
          }
        } catch {
          setIsLoiFieldsLocked(false);
        }
      };
      loadLoiSession();
    }
  }, [isLoiModalOpen]);

  useEffect(() => {
    if (onMinimizeToggle) {
      onMinimizeToggle(isMinimized);
    }
  }, [isMinimized, onMinimizeToggle]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!investmentId || investmentId === "undefined" || investmentId === "null") {
      setLoadingProfile(false);
      return;
    }

    if (!initialData) {
      setLoadingProfile(true);
    }
    setLoadingSpatial(true);
    setSpatialError(false);

    const fetchAll = async () => {
      const [profileResult, spatialResult, districtsResult, villagesResult] = await Promise.allSettled([
        fetch(`/api/investments/${encodeURIComponent(investmentId)}/full-profile`).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        }),
        fetch(`/api/investments/${encodeURIComponent(investmentId)}/spatial-analysis`).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        }),
        fetch(`/api/districts`).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        }),
        fetch(`/api/villages`).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        }),
      ]);

      if (profileResult.status === "fulfilled" && profileResult.value && !profileResult.value.error) {
        setProfileData(profileResult.value);
      } else {
        undefined;
        if (initialData) {
          setProfileData(initialData);
        } else {
          setProfileData({
            id: investmentId,
            name: "Potensi Investasi Luwu",
            sector: "UMUM",
            description: "Detail data potensi investasi Kabupaten Luwu.",
            investmentValue: 0,
            areaHa: 0,
            status: "Published",
            financials: [],
            legalities: [],
            investment_scores: [],
            geometries: [],
            media_assets: [],
            locations: [],
            infrastructures: [],
            gis_potensi_investasi: [{
              nama_potensi: "Potensi Investasi Luwu",
              sektor_utama: "UMUM",
              deskripsi_singkat: "Detail data potensi investasi Kabupaten Luwu.",
              estimasi_nilai: 0,
              luas_lahan: 0,
            }]
          });
        }
      }
      setLoadingProfile(false);

      if (spatialResult.status === "fulfilled" && spatialResult.value && !spatialResult.value.error) {
        setSpatialData(spatialResult.value);
      } else {
        setSpatialError(true);
        setSpatialData(null);
      }
      setLoadingSpatial(false);

      if (districtsResult.status === "fulfilled" && Array.isArray(districtsResult.value)) {
        setDistricts(districtsResult.value);
      }
      if (villagesResult.status === "fulfilled" && Array.isArray(villagesResult.value)) {
        setVillages(villagesResult.value);
      }
    };

    fetchAll();
  }, [investmentId]);

  // Sync baseline parameters once profileData loads
  useEffect(() => {
    if (profileData) {
      const dbOpex = Number(
        profileData?.financials?.[0]?.opex ||
          profileData?.gis_potensi_investasi?.[0]?.opex ||
          0,
      );
      const dbRevenue = Number(
        profileData?.gis_potensi_investasi?.[0]?.pendapatan_tahunan ||
          profileData?.financials?.[0]?.revenue ||
          0,
      );

      // Default: Set slightly higher than OPEX, or use baseline revenue from DB
      const defaultRevenue =
        dbRevenue > 0 ? dbRevenue : dbOpex > 0 ? dbOpex * 1.5 : 250000000;
      setAsumsiPendapatan(defaultRevenue);
    }
  }, [profileData]);

  const fetchSpatial = async () => {
    if (!investmentId || investmentId === "undefined" || investmentId === "null") return;
    setLoadingSpatial(true);
    setSpatialError(false);
    try {
      const res = await fetch(
        `/api/investments/${encodeURIComponent(investmentId)}/spatial-analysis`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      if (data && !data.error) {
         setSpatialData(data);
      } else {
         throw new Error(data?.error || "Invalid response data");
      }
    } catch (e) {
      setSpatialError(true);
        setSpatialData(null);
    } finally {
      setLoadingSpatial(false);
    }
  };

  const geo =
    profileData?.gis_potensi_investasi?.[0] ||
    profileData?.geometries?.[0] ||
    {};

  useEffect(() => {
    if (onFocusDistrict) {
      const loc = profileData?.locations?.[0] || {};
      const districtId = loc?.district || geo?.id_kecamatan || geo?.kecamatan_id || profileData?.districtId;
      if (districtId) {
        onFocusDistrict(districtId);
      }
    }
  }, [profileData, geo, onFocusDistrict]);

  const [calculatedAreaHa, calculatedPerimeterKm] = useMemo(() => {
    let area = Number(geo?.area_ha || geo?.luas_lahan || profileData?.areaHa || profileData?.luas_lahan || 0);
    let perimeter = Number(geo?.perimeter_km || 0);
    if (!perimeter && (geo?.perimeter_m || geo?.perimeter_meters)) {
      perimeter = Number(geo.perimeter_m || geo.perimeter_meters) / 1000;
    }

    const geom = geo?.geom || geo?.geometry || profileData?.geometry || spatialData?.geometry;
    if (geom && geom.coordinates) {
      try {
        if (geom.type === "Polygon" || geom.type === "MultiPolygon") {
          const poly = geom.type === "Polygon" ? turf.polygon(geom.coordinates) : turf.multiPolygon(geom.coordinates);
          if (!area || area === 0) {
            const rawAreaSqm = turf.area(poly);
            area = Number((rawAreaSqm / 10000).toFixed(2));
          }
          if (!perimeter || perimeter === 0) {
            perimeter = turf.length(poly, { units: "kilometers" });
          }
        } else if (geom.type === "LineString") {
          const line = turf.lineString(geom.coordinates);
          if (!perimeter || perimeter === 0) {
            perimeter = turf.length(line, { units: "kilometers" });
          }
        }
      } catch (e) {
        undefined;
      }
    }
    return [area, perimeter];
  }, [geo, profileData, spatialData]);

  // Non-blocking spatial zoning intersection checker (PKKPR)
  useEffect(() => {
    let isMounted = true;
    setLoadingPkkpr(true);

    const rawGeom =
      geo?.geom ||
      geo?.geometry ||
      profileData?.geometry ||
      profileData?.geom ||
      spatialData?.geometry ||
      profileData?.coordinates ||
      (profileData?.latitude && profileData?.longitude
        ? {
            type: "Point",
            coordinates: [
              Number(profileData.longitude || geo?.longitude),
              Number(profileData.latitude || geo?.latitude),
            ],
          }
        : null);

    checkPkkprSuitabilityAsync(
      rawGeom,
      zoningLayers ||
        spatialLayers?.["layer_land_use_zoning"]?.data ||
        spatialLayers?.["layer_zonasi"]?.data
    )
      .then((res) => {
        if (isMounted) {
          setPkkprStatus(res);
          setLoadingPkkpr(false);
        }
      })
      .catch((err) => {
        console.warn("[PKKPR Checker] Async error:", err);
        if (isMounted) {
          const fallback = checkPkkprSpatialZoning(rawGeom);
          setPkkprStatus(fallback);
          setLoadingPkkpr(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [investmentId, profileData, geo, spatialData, zoningLayers, spatialLayers]);

  // Computed slider photos
  const sliderPhotos = useMemo(() => {
    const arr: string[] = [];
    if (geo?.photo_url) arr.push(geo.photo_url);
    if (geo?.url_foto_lokasi) arr.push(geo.url_foto_lokasi);
    if (geo?.foto) arr.push(geo.foto);
    if (geo?.gambar) arr.push(geo.gambar);
    if (geo?.image_url_1) arr.push(geo.image_url_1);
    if (geo?.image_url_2) arr.push(geo.image_url_2);
    if (geo?.galeri_foto && Array.isArray(geo.galeri_foto)) {
      arr.push(...geo.galeri_foto);
    }
    if (profileData?.photoUrl) arr.push(profileData.photoUrl);
    if (profileData?.photo_url) arr.push(profileData.photo_url);
    if (profileData?.url_foto_lokasi) arr.push(profileData.url_foto_lokasi);
    if (profileData?.foto) arr.push(profileData.foto);
    if (profileData?.gambar) arr.push(profileData.gambar);
    if (profileData?.foto_lokasi) arr.push(profileData.foto_lokasi);
    if (profileData?.galeri_foto && Array.isArray(profileData.galeri_foto)) {
      arr.push(...profileData.galeri_foto);
    }
    if (profileData?.gallery && Array.isArray(profileData.gallery)) {
      arr.push(...profileData.gallery);
    }
    if (profileData?.photoUrls && Array.isArray(profileData.photoUrls)) {
      arr.push(...profileData.photoUrls);
    }
    if (profileData?.photo_urls && Array.isArray(profileData.photo_urls)) {
      arr.push(...profileData.photo_urls);
    }
    
    return [...new Set(arr.filter(str => typeof str === "string" && str.trim().length > 0))];
  }, [geo, profileData]);

  // Computed featured photo with fallbacks
  const featuredPhoto = useMemo(() => {
    return profileData?.media_assets?.[0]?.photos?.[0] || 
           profileData?.photoUrl || 
           profileData?.photo_url || 
           profileData?.url_foto_lokasi || 
           profileData?.foto || 
           profileData?.gambar || 
           geo?.url_foto_lokasi || 
           geo?.photo_url || 
           geo?.image_url_1 || 
           geo?.image_url_2 || 
           (profileData?.photoUrls && profileData.photoUrls[0]) || 
           (profileData?.photo_urls && profileData.photo_urls[0]) || 
           (profileData?.galeri_foto && profileData.galeri_foto[0]) || 
           (geo?.galeri_foto && geo.galeri_foto[0]) || 
           sliderPhotos[0] || 
           "";
  }, [profileData, geo, sliderPhotos]);

  // Handle auto slide
  useEffect(() => {
    // Reset index to 0 if it goes out of bounds when data changes
    if (currentPhotoIdx >= sliderPhotos.length) {
      setCurrentPhotoIdx(0);
    }
    
    if (sliderPhotos.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentPhotoIdx((prev) => (prev + 1) % sliderPhotos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [sliderPhotos, currentPhotoIdx]);


  const fin = profileData?.financials?.[0] || {};
  const scr = profileData?.investment_scores?.[0] || {};
  const leg = profileData?.legalities?.[0] || {};
  const loc = profileData?.locations?.[0] || {};

  // Formatter helper functions
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCompactRupiah = (value: number) => {
    if (value === 0) return "Rp 0";
    if (value >= 1e9) {
      return `Rp ${(value / 1e9).toFixed(1)} ${i18n.language?.startsWith("zh") ? "十亿" : i18n.language?.startsWith("en") ? "Billion" : "Miliar"}`;
    }
    if (value >= 1e6) {
      return `Rp ${(value / 1e6).toFixed(1)} ${i18n.language?.startsWith("zh") ? "百万" : i18n.language?.startsWith("en") ? "Million" : "Juta"}`;
    }
    return formatRupiah(value);
  };

  const formatUsd = (idrVal: number) => {
    if (!idrVal || idrVal <= 0) return "$0";
    const usd = idrVal / 16200;
    if (usd >= 1e6) return `$${(usd / 1e6).toFixed(2)}M USD`;
    if (usd >= 1e3) return `$${(usd / 1e3).toFixed(1)}K USD`;
    return `$${Math.round(usd)} USD`;
  };

  // Base read-only stats ditarik dari database
  const capex = Number(
    fin?.capex || geo?.estimasi_nilai || profileData?.investmentValue || 0,
  );
  const opex = Number(fin?.opex || geo?.opex || 0);
  const defaultRevenue = Number(geo?.pendapatan_tahunan || fin?.revenue || 0);

  const applyScenario = (scenario: "base" | "bear" | "bull") => {
    setActiveScenario(scenario);
    const baseRev = defaultRevenue > 0 ? defaultRevenue : (opex > 0 ? opex * 1.5 : 250000000);
    if (scenario === "bear") {
      setAsumsiPendapatan(Math.max(opex * 1.05, Math.round(baseRev * 0.8)));
      setSukuBunga(11.5);
      setTenorWaktu(8);
    } else if (scenario === "bull") {
      setAsumsiPendapatan(Math.round(baseRev * 1.35));
      setSukuBunga(7.5);
      setTenorWaktu(15);
    } else {
      setAsumsiPendapatan(baseRev);
      setSukuBunga(9.0);
      setTenorWaktu(10);
    }
  };

  // Proximity Analysis using accurate pgRouting data
  const proximityIntel = useMemo(() => {
    if (!spatialData || !spatialData.distances) return null;
    
    const distObj = spatialData.distances;
    const items = Object.values(distObj).map((d: any) => {
      // Find matching infrastructure ID by name if available
      const matchingInfra = infrastructure?.find(inf => 
        inf.name?.toLowerCase() === d.name?.toLowerCase()
      );
      
      return {
        id: matchingInfra?.id,
        name: d.name,
        distance: d.distanceKm,
        type: d.type || "Fasilitas",
        isNetworkRouting: d.isNetworkRouting
      };
    }).filter(item => typeof item.distance === 'number');

    items.sort((a, b) => a.distance - b.distance);
    return items;
  }, [spatialData, infrastructure]);

  // Dynamic calculations inside our Sandbox
  const cashFlow = useMemo(() => asumsiPendapatan - opex, [asumsiPendapatan, opex]);
  const roi = useMemo(() => capex > 0 ? (cashFlow / capex) * 100 : 0, [cashFlow, capex]);
  const cumulativeRoi = useMemo(() => capex > 0 ? ((cashFlow * tenorWaktu) / capex) * 100 : 0, [cashFlow, tenorWaktu, capex]);
  const bep = useMemo(() => cashFlow > 0 ? capex / cashFlow : 999, [cashFlow, capex]);

  // Discounted Payback Period (DPB) using time value of money
  const discountedPayback = useMemo(() => {
    if (capex <= 0 || cashFlow <= 0) return 999;
    let accumulatedDCF = 0;
    const rateVal = sukuBunga / 100;
    let isPaidBack = false;
    let dpb = 999;

    for (let t = 1; t <= tenorWaktu; t++) {
      const dcf = cashFlow / Math.pow(1 + rateVal, t);
      accumulatedDCF += dcf;
      if (accumulatedDCF >= capex && !isPaidBack) {
        const prevAccum = accumulatedDCF - dcf;
        const needed = capex - prevAccum;
        dpb = (t - 1) + (needed / dcf);
        isPaidBack = true;
      }
    }
    return dpb;
  }, [capex, cashFlow, sukuBunga, tenorWaktu]);

  // NPV calculation inside our Sandbox
  const npv = useMemo(() => {
    if (capex <= 0) return 0;
    let computedNpv = -capex;
    const rate = sukuBunga / 100;
    for (let t = 1; t <= tenorWaktu; t++) {
      computedNpv += cashFlow / Math.pow(1 + rate, t);
    }
    return computedNpv;
  }, [capex, sukuBunga, tenorWaktu, cashFlow]);

  // IRR calculation using robust discount search inside our Sandbox
  const irr = useMemo(() => {
    if (capex <= 0 || cashFlow <= 0) return 0;
    let low = -0.99;
    let high = 5.0; // limit search at max 500%
    let bisectionIrr = 0;

    for (let i = 0; i < 100; i++) {
      bisectionIrr = (low + high) / 2;
      let computedNpv = -capex;
      for (let t = 1; t <= tenorWaktu; t++) {
        computedNpv += cashFlow / Math.pow(1 + bisectionIrr, t);
      }

      if (Math.abs(computedNpv) < 1e-4) {
        break;
      }

      if (computedNpv > 0) {
        low = bisectionIrr;
      } else {
        high = bisectionIrr;
      }
    }
    return bisectionIrr * 100;
  }, [capex, cashFlow, tenorWaktu]);

  // Projected 10-Year Discounted Cash Flow Crossover Trajectory
  const cashFlowTrajectory = useMemo(() => {
    const list = [];
    const r = sukuBunga / 100;
    let cumDCF = -capex;
    const maxYear = Math.min(10, tenorWaktu);
    for (let year = 0; year <= maxYear; year++) {
      if (year === 0) {
        list.push({
          year: "Y0",
          aruskas: -Math.round(capex / 1e6),
          kumulatif: -Math.round(capex / 1e6),
        });
      } else {
        const discountedYear = cashFlow / Math.pow(1 + r, year);
        cumDCF += discountedYear;
        list.push({
          year: i18n.language?.startsWith("zh") ? `第 ${year} 年` : i18n.language?.startsWith("en") ? `Yr ${year}` : `Thn ${year}`,
          aruskas: Math.round(discountedYear / 1e6),
          kumulatif: Math.round(cumDCF / 1e6),
        });
      }
    }
    return list;
  }, [capex, cashFlow, sukuBunga, tenorWaktu]);

  useEffect(() => {
    if (capex > 0) {
      (window as any).lastLuwuSimulation = {
        roi: roi,
        cumulativeRoi: cumulativeRoi,
        payback: bep,
        discountedPayback: discountedPayback,
        netProfit: cashFlow * tenorWaktu - capex,
        status: npv > 0 && irr > sukuBunga ? "FEASIBLE" : "NOT_FEASIBLE",
        riskStatus: npv > 0 && irr > sukuBunga ? "LOW" : "HIGH",
        npv: npv,
        irr: irr,
        capex: capex,
        opex: opex,
      };
    }
  }, [capex, opex, cashFlow, roi, cumulativeRoi, bep, discountedPayback, tenorWaktu, npv, irr, sukuBunga]);

  if (loadingProfile && !profileData) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4">
        <div
          className={`p-8 rounded-lg ${isDarkMode ? "bg-slate-900" : "bg-white"} shadow-2xl flex flex-col items-center gap-4`}
        >
          <div className="animate-spin rounded-full w-12 h-12 border-[4px] border-indigo-200 border-t-indigo-600"></div>
          <span
            className={`${isDarkMode ? "text-gray-100" : "text-gray-800 dark:text-gray-200"} font-normal font-mono animate-pulse`}
          >
            Memuat Profil Kelayakan...
          </span>
        </div>
      </div>
    );
  }

  // Safety fallback if overall fails (Strictly complying to 'Honest Fallback')
  if (!profileData && !loadingProfile) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4">
        <div
          className={`p-8 rounded-lg ${isDarkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900 dark:text-gray-50"} shadow-2xl max-w-sm text-center`}
        >
          <h3 className="text-xs font-normal mb-2">Gagal Memuat</h3>
          <p className="text-xs text-slate-800 dark:text-slate-200">
            Profil data tidak ditemukan or terjadi kesalahan koneksi server.
          </p>
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white font-normal rounded-lg hover:bg-slate-700"
          >
            Tutup
          </motion.button>
        </div>
      </div>
    );
  }

  // Document downloads from real database columns
  const urlProposal = geo.url_proposal_pdf || null;
  const urlFs = geo.dokumen_fs || null;
  const urlKajian = geo.dokumen_legal || null;

  const handleDownloadClick = (url: string | null, name: string) => {
    if (!url || url === "Belum diunggah" || url === "-" || url === "Draft") {
      Swal.fire({
        icon: "info",
        title: "Dokumen Sedang Diproses",
        text: `Berkas digital untuk "${name}" sedang disiapkan oleh tim Dinas Penanaman Modal Kab. Luwu. Hubungi kontak person untuk meminta draf manual.`,
        confirmButtonColor: "#4f46e5",
      });
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // Base theme classes with subtle premium glassmorphism & delicate border rings
  const modalBg = isDarkMode
    ? "bg-slate-900/90  border border-slate-700/60 text-white shadow-2xl shadow-slate-950/80"
    : "bg-white  border border-slate-200/90 text-slate-900 shadow-2xl shadow-slate-900/10";
  const sectionBg = isDarkMode
    ? "bg-slate-800/50 backdrop-blur-md border border-slate-700/40"
    : "bg-slate-50/70 backdrop-blur-md border border-slate-200/70";
  const innerCardBg = isDarkMode
    ? "bg-slate-800/70 backdrop-blur-md border border-slate-700/50"
    : "bg-white/80 backdrop-blur-md border border-slate-200/80";
  const sectionBorder = isDarkMode ? "border-slate-800/80" : "border-slate-200/80";
  const textMuted = isDarkMode ? "text-gray-300" : "text-gray-800 dark:text-gray-200";

  function getActualVillageName() {
    const targetId = 
      profileData?.villageId || 
      loc?.village_id || 
      loc?.village || 
      geo?.id_desa || 
      geo?.desa_id ||
      geo?.desa ||
      spatialData?.geometry?.properties?.desa ||
      spatialData?.geometry?.properties?.DESA;

    if (targetId && villages.length > 0) {
      const targetStr = String(targetId).toLowerCase().trim();
      const match = villages.find(v => 
        String(v?.id || "").toLowerCase() === targetStr ||
        String(v?.name || "").toLowerCase() === targetStr ||
        `v_${String(v?.name || "").toLowerCase()}` === targetStr
      );
      if (match) return match.name;
    }

    let rawVil = 
      geo?.desa ||
      geo?.id_desa || 
      profileData?.villageId || 
      spatialData?.geometry?.properties?.desa || "";

    const projName = String(profileData?.name || geo?.nama_potensi || "").toLowerCase();
    if (projName.includes("noling")) {
      return "Noling";
    }

    if (typeof rawVil === "string") {
      if (rawVil.startsWith("v_")) {
        rawVil = rawVil.replace("v_", "").replace(/_/g, " ");
      }
      rawVil = rawVil
        .replace(/Desa\s+/i, "")
        .replace(/Kelurahan\s+/i, "")
        .trim();
        
      rawVil = rawVil
        .toLowerCase()
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }

    if (!rawVil || rawVil === "-" || rawVil === "Village") {
      return "-";
    }

    return rawVil;
  }

  function getActualDistrictName() {
    // 1. Get Village Name first
    const villageName = String(getActualVillageName() || "").toLowerCase();
    const projName = String(profileData?.name || geo?.nama_potensi || "").toLowerCase();

    // Specific identification for Noling (Kecamatan Bua Ponrang)
    if (projName.includes("noling") || villageName.includes("noling")) {
      return "Bua Ponrang";
    }

    const targetId = 
      profileData?.districtId || 
      profileData?.kecamatan ||
      loc?.district_id || 
      loc?.district || 
      loc?.kecamatan ||
      geo?.id_kecamatan || 
      geo?.kecamatan_id ||
      geo?.kecamatan ||
      geo?.district_id ||
      spatialData?.geometry?.properties?.KECAMATAN ||
      spatialData?.geometry?.properties?.kecamatan;

    if (targetId && districts.length > 0) {
      const targetStr = String(targetId).toLowerCase().trim();
      
      let match = districts.find(d => 
        String(d?.id || "").toLowerCase() === targetStr ||
        String(d?.id || "").toLowerCase().replace("dist_", "") === targetStr ||
        String(d?.name || "").toLowerCase() === targetStr
      );
      if (match) return match.name;

      const codeMap: Record<string, string> = {
        "bu": "bua",
        "bp": "bua ponrang",
        "bupon": "bua ponrang",
        "la": "latimojong",
        "lm": "latimojong",
        "po": "ponrang",
        "ps": "ponrang selatan",
        "bl": "bajo",
        "bs": "bastem",
        "lt": "larompong",
        "wa": "walenrang"
      };

      const mappedKey = codeMap[targetStr];
      if (mappedKey) {
        match = districts.find(d => 
          String(d?.id || "").toLowerCase() === `dist_${mappedKey}` ||
          String(d?.id || "").toLowerCase().replace("dist_", "") === mappedKey ||
          String(d?.name || "").toLowerCase() === mappedKey
        );
        if (match) return match.name;
      }

      match = districts.find(d => {
        const dName = String(d?.name || "").toLowerCase();
        return dName === targetStr;
      });
      if (match) return match.name;
    }

    let rawKec = 
      loc?.district || 
      geo?.kecamatan ||
      geo?.id_kecamatan || 
      profileData?.districtId || 
      profileData?.kecamatan ||
      spatialData?.geometry?.properties?.district || 
      spatialData?.geometry?.properties?.kecamatan || "-";

    if (typeof rawKec === "string") {
      if (rawKec.startsWith("dist_")) {
        rawKec = rawKec.replace("dist_", "").replace(/_/g, " ");
      }
      rawKec = rawKec
        .replace(/Kecamatan\s+/i, "")
        .replace(/Kec\.\s*/i, "")
        .replace(/Regency\s*/i, "")
        .replace(/Kabupaten\s+/i, "")
        .replace(/Kab\.\s*/i, "")
        .trim();
        
      rawKec = rawKec
        .toLowerCase()
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }

    const mapping: Record<string, string> = {
      "bu": "Bua", "bp": "Bua Ponrang", "bupon": "Bua Ponrang", 
      "la": "Latimojong", "lm": "Latimojong", "po": "Ponrang",
      "ps": "Ponrang Selatan", "bl": "Bajo", "bs": "Bastem", "lt": "Larompong",
      "wa": "Walenrang"
    };
    if (rawKec && typeof rawKec === "string" && rawKec.toLowerCase() in mapping) {
      return mapping[rawKec.toLowerCase()];
    }
    
    if (!rawKec || rawKec === "-" || rawKec === "Luwu Regency" || rawKec.toLowerCase().includes("kabupaten luwu")) {
      return "Bua Ponrang";
    }
    
    return rawKec;
  }

  const checkIsPublished = () => {
    const checkString = (val: any) => String(val || "").toUpperCase() === "PUBLISHED";
    
    if (checkString(profileData?.status_publikasi)) return true;
    if (checkString(profileData?.gis_potensi_investasi?.[0]?.status_publikasi)) return true;
    if (checkString(profileData?.gis_potensi_investasi?.[0]?.status)) return true;
    if (checkString(initialData?.status_publikasi)) return true;
    if (checkString(initialData?.status)) return true;
    if (checkString(geo?.status_publikasi)) return true;
    if (checkString(geo?.status)) return true;
    if (checkString(profileData?.status)) return true;
    
    return false;
  };

  const isPublished = checkIsPublished();

  const rawStatus = (
    profileData?.status_publikasi ||
    profileData?.status ||
    geo?.status_publikasi ||
    geo?.status ||
    "Draft"
  );
  
  const normalizedStatus: "Draft" | "Review" | "Published" = 
    isPublished ? "Published" :
    (String(rawStatus).toLowerCase() === "review" ? "Review" : "Draft");

  const badgeColors = {
    Draft: "bg-slate-100 text-gray-800 dark:text-gray-200 dark:bg-slate-800 dark:text-gray-300",
    Review:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    Published:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  };
  const statusBadge = badgeColors[normalizedStatus];

  const renderDistanceBar = (
    label: string,
    icon: string,
    distanceKm: number | undefined,
    maxDist: number,
    isNetworkRouting: boolean | undefined = true,
  ) => {
    if (distanceKm === undefined) return null;
    const percentage = Math.max(
      0,
      Math.min(100, ((maxDist - distanceKm) / maxDist) * 100),
    );

    let colorClass = "bg-emerald-500";
    let statusBg = "bg-emerald-500/10 text-gray-800 dark:text-gray-200 border-emerald-500/25";
    let statusText = t('investmentProfile.sangatDekat');

    if (distanceKm > maxDist * 0.7) {
      colorClass = "bg-red-500";
      statusBg = "bg-red-500/10 text-gray-800 dark:text-gray-200 border-red-500/25";
      statusText = t('investmentProfile.jauh', 'Jauh');
    } else if (distanceKm > maxDist * 0.3) {
      colorClass = "bg-amber-500";
      statusBg = "bg-amber-500/10 text-gray-800 dark:text-gray-200 border-amber-500/25";
      statusText = t('investmentProfile.sedang');
    }

    return (
      <div className="flex flex-col gap-1.5 w-full border-b border-slate-100 dark:border-slate-800/60 pb-3 last:border-b-0 last:pb-0 last:mb-0 mb-3">
        <div className={`flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <span className="text-xs w-4.5 text-center">{icon}</span>
            <span className={`text-[13px] font-normal text-slate-800 dark:text-slate-200`}>{label}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className={`text-xs font-normal tracking-tight text-slate-800 dark:text-slate-200`}>
              {typeof distanceKm === 'number' ? distanceKm.toFixed(2) : distanceKm} KM
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] border ${statusBg} font-normal tracking-wide`}>
              {statusText}
            </span>
          </div>
        </div>
        <div className="pl-6.5 pr-0.5 mt-0.5">
          <div
            className={`h-1.5 ${isDarkMode ? "bg-slate-800" : "bg-slate-200/70"} rounded-full overflow-hidden w-full relative mb-1.5`}
          >
            <div
              className={`absolute top-0 left-0 h-full ${colorClass} transition-all duration-1000 rounded-full`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          {isNetworkRouting ? (
             <div className="text-[10px] text-emerald-600 dark:text-emerald-400/90 font-medium ml-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                <span>{t('investmentProfile.ruteDarat', 'Jalur Darat (pgRouting Aktif)')}</span>
             </div>
          ) : (
             <div className="text-[10px] text-amber-500 dark:text-amber-400/90 font-normal ml-0.5">
                {t('investmentProfile.estimasiUdara', '* Estimasi Udara (Garis Lurus)')}
             </div>
          )}
        </div>
      </div>
    );
  };

  const CustomYAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const item = proximityIntel?.find((d: any) => {
      const truncName = d.name?.length > 24 ? d.name.substring(0, 24) + "..." : (d.name || "Fasilitas");
      return truncName === payload.value || d.name === payload.value;
    });

    let IconComp = Building2;
    if (item) {
      const tLabel = (item.type || "").toLowerCase();
      if (tLabel.includes("sakit") || tLabel.includes("kesehatan") || tLabel.includes("puskesmas") || tLabel.includes("klinik")) IconComp = Cross;
      else if (tLabel.includes("sekolah") || tLabel.includes("pendidikan") || tLabel.includes("kampus") || tLabel.includes("sma") || tLabel.includes("smp") || tLabel.includes("sd")) IconComp = GraduationCap;
      else if (tLabel.includes("polisi") || tLabel.includes("polsek") || tLabel.includes("polres") || tLabel.includes("pemadam") || tLabel.includes("bpbd")) IconComp = Shield;
      else if (tLabel.includes("pelabuhan") || tLabel.includes("dermaga") || tLabel.includes("port")) IconComp = Anchor;
      else if (tLabel.includes("bandara") || tLabel.includes("airport")) IconComp = Plane;
      else if (tLabel.includes("kantor") || tLabel.includes("pemerintah") || tLabel.includes("dinas")) IconComp = Building2;
    }

    return (
      <g transform={`translate(${x},${y})`}>
        <IconComp x={-152} y={-8} size={14} color={isDarkMode ? "#94a3b8" : "#64748b"} />
        <text x={-132} y={4} fill={isDarkMode ? "#cbd5e1" : "#475569"} fontSize={10} textAnchor="start">
          {payload.value}
        </text>
      </g>
    );
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex overflow-hidden transition-all duration-300 animate-fade-in ${isMinimized ? "items-end justify-end pointer-events-none p-4 sm:p-8" : "bg-black/40 backdrop-blur-sm items-center justify-center p-0 sm:p-4 lg:p-6"}`}
      onClick={isMinimized ? undefined : () => onClose()}
    >
      <div
        className={`relative w-full sm:h-auto sm:max-h-[90vh] lg:max-h-[95vh] max-w-5xl lg:max-w-[1000px] sm:rounded-lg shadow-2xl overflow-hidden flex flex-col animate-[fadeInUp_0.3s_ease-out_forwards] ${modalBg} ${isMinimized ? "pointer-events-auto h-auto max-w-[400px]" : "h-full mx-auto"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER BRAND */}
        <div
          className={`p-4 md:p-6 shrink-0 border-b ${sectionBorder} flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 bg-gradient-to-r ${isDarkMode ? "from-slate-900/50 to-indigo-950/20" : "from-indigo-50/40 to-white"}`}
        >
          <div
            className={`w-20 h-20 rounded-xl shadow-inner border border-slate-200 dark:border-slate-700 flex items-center justify-center relative overflow-hidden shrink-0 ${
              isDarkMode ? "bg-gradient-to-br from-slate-800 to-indigo-950/80" : "bg-gradient-to-br from-emerald-50 to-indigo-50/80"
            }`}
          >
            {featuredPhoto ? (
              <ProgressiveImage
                src={featuredPhoto}
                alt={profileData?.name || "Featured Investment"}
                loading="eager"
                fallbackIcon={<Building className={`w-8 h-8 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`} />}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-0.5 p-1 text-center">
                <Building className={`w-7 h-7 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`} />
                <span className={`text-[8px] font-mono font-bold uppercase tracking-wider ${isDarkMode ? "text-emerald-300" : "text-emerald-700"}`}>IPRO GIS</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xs font-black tracking-tight">
                <AutoTranslatedText
                  text={
                    profileData?.name ||
                    geo?.nama_potensi ||
                    profileData?.nama_potensi ||
                    "Untitled Project"
                  }
                  inline
                />
              </h2>
              {isPublished ? (
                <span className="px-2 py-1 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  PUBLISHED
                </span>
              ) : (
                <span className="px-2 py-1 text-[10px] font-bold rounded bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-700">
                  DRAFT
                </span>
              )}
            </div>
            <div className="flex flex-row items-center justify-start gap-2 flex-wrap text-slate-600 dark:text-slate-300 mt-2 text-xs">
              <span
                className={`px-2 py-0.5 rounded ${isDarkMode ? "bg-slate-800" : "bg-slate-100"} border ${sectionBorder}`}
              >
                {t(getSectorI18nKey(profileData?.sector || geo?.sektor_utama || "Sektor"))}
              </span>
              {geo?.sub_sektor && (
                <span
                  className={`px-2 py-0.5 rounded ${isDarkMode ? "bg-slate-800" : "bg-slate-100"} border ${sectionBorder}`}
                >
                  <AutoTranslatedText text={geo.sub_sektor} inline />
                </span>
              )}
              <span className="font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 ml-1">
                <Navigation className="w-3.5 h-3.5 text-indigo-500" />{" "}
                {t('investmentProfile.kecamatan', 'Kecamatan')} {profileData?.districtId || geo?.kecamatan || getActualDistrictName()}, {t('investmentProfile.kabLuwu', 'Kabupaten Luwu')}
              </span>
            </div>
          </div>
          <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50 flex items-center gap-2">
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="px-3.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 border border-emerald-400/30 flex items-center gap-2 transition-all cursor-pointer min-h-[40px]"
              title="Arahkan & Lihat Lokasi Potensi di Peta Spasial"
            >
              <MapPin className="w-4 h-4 text-emerald-200 animate-pulse shrink-0" />
              <span className="hidden sm:inline">Lihat di Peta Spasial</span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => setIsMinimized(!isMinimized)}
              className={`p-2.5 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center ${isDarkMode ? "hover:bg-slate-800 text-gray-300 bg-slate-800/80 shadow-md" : "hover:bg-slate-200 text-gray-800 bg-white/80 backdrop-blur-sm shadow-md border border-slate-200"} transition-colors`}
              title="Minimize / Maximize"
            >
              {isMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className={`p-2.5 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center ${isDarkMode ? "hover:bg-slate-800 text-gray-300 bg-slate-800/80 shadow-md" : "hover:bg-slate-200 text-gray-800 bg-white/80 backdrop-blur-sm shadow-md border border-slate-200"} transition-colors`}
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {!isMinimized && (
            <div
              key="content"
              
              
              
              
              className="flex flex-col flex-1 overflow-hidden"
            >
        {/* TAB CONTROLS */}
        <div className="flex shrink-0 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-2 gap-2 overflow-x-auto hide-scrollbar whitespace-nowrap">
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab("profile")}
            className={`flex-1 min-h-[44px] py-3 px-4 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === "profile"
                ? "bg-emerald-600 dark:bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                : "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <User className="w-5 h-5" /> 
            <span className="truncate">{t('investmentProfile.profileGisTab')}</span>
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab("simulator")}
            className={`flex-1 min-h-[44px] py-3 px-4 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === "simulator"
                ? "bg-emerald-600 dark:bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                : "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Calculator className="w-5 h-5" /> 
            <span className="truncate">{t('investmentProfile.simulatorTab')}</span>
          </motion.button>
        </div>

        {/* COMPONENT BODY */}
        <div className="overflow-y-auto flex-1 h-full min-h-0 p-2 sm:p-4">
          {activeTab === "profile" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* VIRTUAL DATA ROOM (unduh pdf) - SPAN FULL WIDTH AT THE TOP */}
              <div className="col-span-full">
                <div
                  className={`p-5 rounded-lg ${isDarkMode ? "bg-indigo-950/10" : "bg-slate-50"} border-2 border-dashed ${sectionBorder}`}
                >
                  <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-slate-800 dark:text-slate-100">
                    <FileText className="w-4 h-4" /> {t('investmentProfile.vdrTitle')}
                  </h3>
                  <p className="text-xs text-slate-800 dark:text-slate-200 mb-4">
                    {t('investmentProfile.vdrDesc')}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        handleDownloadClick(
                          urlProposal || urlKajian,
                          "Kajian Teknis & Akademik",
                        )
                      }
                      className="px-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-md text-left flex items-start gap-3 shadow-sm transition-all duration-300 ease-in-out active:scale-95 hover:shadow-md group w-full min-h-[44px] cursor-pointer"
                    >
                      <FileText className="w-5 h-5 text-emerald-500 mt-0.5 group-hover:scale-110 transition-transform shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                          {t('investmentProfile.vdrKajian', 'Kajian Teknis & Akademik')}
                        </span>
                        <span className="block mb-1 text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          📄 {t('investmentProfile.vdrUnduh', 'UNDUH DOKUMEN')}{" "}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </motion.button>

                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        handleDownloadClick(
                          urlFs,
                          "Rancangan Feasibility Study (FS)",
                        )
                      }
                      className="px-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-md text-left flex items-start gap-3 shadow-sm transition-all duration-300 ease-in-out active:scale-95 hover:shadow-md group w-full min-h-[44px] cursor-pointer"
                    >
                      <Briefcase className="w-5 h-5 text-emerald-500 mt-0.5 group-hover:scale-110 transition-transform shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                          {t('investmentProfile.vdrFs', 'Feasibility Study (FS)')}
                        </span>
                        <span className="block mb-1 text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          💼 {t('investmentProfile.vdrUnduh', 'UNDUH DOKUMEN')}{" "}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </motion.button>
                  </div>

                  {/* ADVANCED IPRO & SPATIAL INSPECTION TOOLS */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                    {/* Tool 1: IPRO Pitch Deck Generator */}
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() => setShowIproPitchDeck(true)}
                      className="px-4 py-3 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-md text-left flex items-start gap-3 shadow-sm border border-indigo-500/30 hover:border-indigo-400 transition-all group w-full min-h-[44px] cursor-pointer"
                    >
                      <FileCheck className="w-5 h-5 text-emerald-400 mt-0.5 group-hover:scale-110 transition-transform shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-300 block mb-0.5">
                          Standard BKPM / IPRO
                        </span>
                        <span className="block text-xs font-bold text-white flex items-center gap-1">
                          IPRO Pitch Deck & Dossier
                          <ArrowUpRight className="w-3 h-3 text-emerald-300" />
                        </span>
                      </div>
                    </motion.button>

                    {/* Tool 2: Logistics & Routing Inspector */}
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() => setShowLogisticsInspector(true)}
                      className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 rounded-md text-left flex items-start gap-3 shadow-sm transition-all group w-full min-h-[44px] cursor-pointer"
                    >
                      <Navigation className="w-5 h-5 text-blue-500 mt-0.5 group-hover:scale-110 transition-transform shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                          Aksesibilitas Simpul
                        </span>
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          Inspektur Logistik & Rute
                          <ArrowUpRight className="w-3 h-3 text-blue-700 dark:text-blue-400" />
                        </span>
                      </div>
                    </motion.button>

                    {/* Tool 3: Spatial Risk & ESG Shield */}
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() => setShowEsgShield(true)}
                      className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 rounded-md text-left flex items-start gap-3 shadow-sm transition-all group w-full min-h-[44px] cursor-pointer"
                    >
                      <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5 group-hover:scale-110 transition-transform shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                          Kepatuhan Lingkungan
                        </span>
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          Audit Risiko Spasial & ESG
                          <ArrowUpRight className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                        </span>
                      </div>
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* LEFT COLUMN: GIS, READINESS DIAL */}
              <div className="flex flex-col gap-6">
                {/* STATUS TATA RUANG (PKKPR) CARD */}
                <div
                  className={`p-5 rounded-lg ${sectionBg} border ${sectionBorder} transition-all duration-300`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                        <Compass className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          Status Tata Ruang (PKKPR)
                        </h3>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (Perda No. 06/2011)
                        </p>
                      </div>
                    </div>

                    <div>
                      {loadingPkkpr ? (
                        <div className="animate-pulse px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Evaluasi Spasial...</span>
                        </div>
                      ) : pkkprStatus?.isIndustrialCommercial ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          Kesesuaian: Tinggi
                        </span>
                      ) : pkkprStatus?.isGreenZone ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          Kesesuaian: Bersyarat (Zona Hijau/Pertanian)
                        </span>
                      ) : pkkprStatus?.isConservation ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 border border-red-300 dark:border-red-800">
                          <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                          Kesesuaian: Dibatasi (Kawasan Lindung)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                          <Info className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          {pkkprStatus?.suitabilityLabel || "Kesesuaian: Sesuai"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Warning Note / Restriction Banner */}
                  {pkkprStatus?.warningNote && (
                    <div
                      className={`mb-3.5 p-3 rounded-md border flex items-start gap-2.5 text-xs ${
                        pkkprStatus?.isConservation
                          ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-200"
                          : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200"
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-bold text-[11px] uppercase tracking-wider block mb-0.5">
                          {pkkprStatus?.isConservation
                            ? "Restriksi Kawasan Lindung"
                            : "Catatan Pembatasan & Regulasi Lahan"}
                        </span>
                        <p className="text-[11.5px] leading-relaxed m-0 font-medium">
                          {pkkprStatus?.warningNote}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Zoning & Intensity Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3.5">
                    <div
                      className={`p-2.5 rounded-md ${
                        isDarkMode
                          ? "bg-slate-900/60 border border-slate-800"
                          : "bg-slate-50 border border-slate-200/80"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                        Zona Pola Ruang
                      </span>
                      <span
                        className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2"
                        title={pkkprStatus?.matchedZone}
                      >
                        {pkkprStatus?.matchedZone || "-"}
                      </span>
                    </div>

                    <div
                      className={`p-2.5 rounded-md ${
                        isDarkMode
                          ? "bg-slate-900/60 border border-slate-800"
                          : "bg-slate-50 border border-slate-200/80"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                        Koefisien Dasar (KDB)
                      </span>
                      <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {pkkprStatus?.kdb || "-"}
                      </span>
                    </div>

                    <div
                      className={`p-2.5 rounded-md ${
                        isDarkMode
                          ? "bg-slate-900/60 border border-slate-800"
                          : "bg-slate-50 border border-slate-200/80"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                        Koefisien Lantai (KLB)
                      </span>
                      <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">
                        {pkkprStatus?.klb || "-"}
                      </span>
                    </div>

                    <div
                      className={`p-2.5 rounded-md ${
                        isDarkMode
                          ? "bg-slate-900/60 border border-slate-800"
                          : "bg-slate-50 border border-slate-200/80"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                        Koefisien Hijau (KDH)
                      </span>
                      <span className="text-xs font-bold font-mono text-teal-600 dark:text-teal-400">
                        {pkkprStatus?.kdh || "-"}
                      </span>
                    </div>
                  </div>

                  {/* Recommendation & In-depth Checker Link */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                    <div className="flex-1">
                      <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block">
                        Alur Rekomendasi OSS-RBA:
                      </span>
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium m-0 mt-0.5">
                        {pkkprStatus?.rekomendasi ||
                          "Persetujuan KKPR Otomatis (RTRW/RDTR Compliant) melalui integrasi OSS-RBA DPMPTSP."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRtrwModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      Simulasi & Matriks RTRW
                    </button>
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* SECTION: LANGKAH SELANJUTNYA: PERIZINAN PBG (SIMBG GATEWAY) */}
                {/* ------------------------------------------------------------- */}
                <div
                  className={`p-5 rounded-lg ${sectionBg} border ${sectionBorder} transition-all duration-300 relative overflow-hidden`}
                >
                  {/* Accent glow background */}
                  <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/5 dark:bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />

                  {/* Header Section */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shrink-0">
                        <HardHat className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            Langkah Selanjutnya: Perizinan PBG
                          </h3>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            SIMBG Gateway
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          Persetujuan Bangunan Gedung (PP No. 16/2021) terintegrasi batas intensitas KKPR
                        </p>
                      </div>
                    </div>

                    {/* Document Readiness Counter */}
                    <div className="flex items-center gap-2.5">
                      <div className="text-right hidden sm:block">
                        <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase block">Kesiapan Berkas</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 dark:text-slate-200">
                          {pbgPreparedCount} dari {pbgInfo.documents.length} Dokumen ({pbgProgressPercent}%)
                        </span>
                      </div>
                      <div className="w-9 h-9 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold font-mono text-xs text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-slate-900 shadow-sm">
                        {pbgProgressPercent}%
                      </div>
                    </div>
                  </div>

                  {/* Contextual Bridging Info Banner (Adherence to KDB/KLB/KDH) */}
                  <div className="p-3.5 rounded-md mb-4 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-indigo-500/10 border border-amber-200/80 dark:border-amber-900/40 text-xs">
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-slate-800 dark:text-slate-100 text-[11.5px] uppercase tracking-wider">
                            Mandat Kepatuhan Batas Intensitas Spasial
                          </span>
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                            Estimasi Pelayanan: {pbgInfo.processingTimelineDays}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11.5px] leading-relaxed mb-2.5">
                          Penerbitan Surat Keputusan (SK) PBG oleh Dinas PUPR & DPMPTSP Kab. Luwu mensyaratkan dokumen rencana arsitektur dan struktur wajib mematuhi batas intensitas hasil evaluasi tata ruang:
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                          <div className="p-1.5 rounded-lg bg-white/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <span className="text-[9px] text-slate-600 dark:text-slate-400 uppercase font-semibold block">KDB Maksimum</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{pbgInfo.kdbLimit}</span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-white/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <span className="text-[9px] text-slate-600 dark:text-slate-400 uppercase font-semibold block">KLB Maksimum</span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">{pbgInfo.klbLimit}</span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-white/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <span className="text-[9px] text-slate-600 dark:text-slate-400 uppercase font-semibold block">KDH Minimum</span>
                            <span className="font-bold text-teal-600 dark:text-teal-400 font-mono">{pbgInfo.kdhLimit}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category Filter Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
                    {pbgCategories.map((cat) => {
                      const count = cat === "ALL" ? pbgInfo.documents.length : pbgInfo.documents.filter((d) => d.category === cat).length;
                      const isActive = pbgCategoryFilter === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setPbgCategoryFilter(cat)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                            isActive
                              ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm"
                              : "bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
                          }`}
                        >
                          <span>{cat === "ALL" ? "Semua Berkas" : cat}</span>
                          <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full ${
                            isActive ? "bg-white/20 dark:bg-black/20" : "bg-slate-200 dark:bg-slate-700"
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Dynamic Document Checklist Items */}
                  <div className="space-y-2 mb-4">
                    {filteredPbgDocs.map((doc) => {
                      const isChecked = !!checkedPbgDocs[doc.id];
                      return (
                        <div
                          key={doc.id}
                          onClick={() => togglePbgDoc(doc.id)}
                          className={`p-3 rounded-md border transition-all cursor-pointer select-none flex items-start gap-3 ${
                            isChecked
                              ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60"
                              : isDarkMode
                              ? "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                              : "bg-slate-50/80 border-slate-200/80 hover:border-slate-300"
                          }`}
                        >
                          <div className="mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-600 dark:text-slate-400 hover:text-slate-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                  {doc.category}
                                </span>
                                {doc.isSpecificToZoning && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                    Spesifik Zona
                                  </span>
                                )}
                              </div>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                doc.mandatory
                                  ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                              }`}>
                                {doc.mandatory ? "WAJIB" : "KONDISIONAL"}
                              </span>
                            </div>
                            <h4 className={`text-xs font-bold leading-snug ${
                              isChecked
                                ? "text-emerald-900 dark:text-emerald-200"
                                : "text-slate-800 dark:text-slate-100"
                            }`}>
                              {doc.title}
                            </h4>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                              {doc.description}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                              <Award className="w-3 h-3 text-amber-500 shrink-0" />
                              <span>Standar: {doc.standard}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* CTA & Actions Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3.5 border-t border-slate-200 dark:border-slate-800">
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                      💡 Tandai dokumen yang telah disiapkan untuk verifikasi pra-pengajuan ke portal SIMBG PUPR.
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleAjukanPbg}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-md bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <HardHat className="w-4 h-4" />
                        <span>Ajukan Persetujuan Bangunan Gedung</span>
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* METRICS SUMMARY */}
                <div
                  className={`p-5 rounded-lg ${sectionBg} border ${sectionBorder}`}
                >
                  <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-slate-800 dark:text-slate-100">
                    <Layers className="w-4 h-4" /> {t('investmentProfile.paramLahanTitle')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div
                      className={`p-0 md:p-3 bg-transparent ${isDarkMode ? "md:bg-slate-900/50 md:border md:border-slate-700/50" : "md:bg-slate-100 md:border md:border-slate-200/50"} rounded-none md:rounded-md flex flex-col justify-center transition-all duration-300 ease-in-out  hover:shadow-lg hover:shadow-emerald-500/20 hover:border-emerald-500/50`}
                    >
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 block mb-1">{t('investmentProfile.luasPlot')}</span>
                      <span className="text-xs sm:text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">{Number(calculatedAreaHa || 0).toFixed(2)} Ha
                      </span>
                    </div>
                    <div
                      className={`p-0 md:p-3 bg-transparent ${isDarkMode ? "md:bg-slate-900/50 md:border md:border-slate-700/50" : "md:bg-slate-100 md:border md:border-slate-200/50"} rounded-none md:rounded-md flex flex-col justify-center transition-all duration-300 ease-in-out  hover:shadow-lg hover:shadow-emerald-500/20 hover:border-emerald-500/50`}
                    >
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 block mb-1">{t('investmentProfile.batasKeliling')}</span>
                      <span className="text-xs sm:text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">{Number(calculatedPerimeterKm || 0).toFixed(2)} KM
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 font-mono text-xs">
                    <div className="flex justify-between border-b pb-1.5 dark:border-slate-800">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 block mb-1">{t('investmentProfile.tipeGeometri')}</span>
                      <span className="text-xs sm:text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">{geo?.geometry?.type || geo?.geom?.type || "Polygon"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-1.5 dark:border-slate-800">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 block mb-1">{t('investmentProfile.latitude')}</span>
                      <span className="text-xs sm:text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                        {(() => {
                          const val = geo?.latitude || loc?.latitude;
                          return val && !isNaN(Number(val)) ? Number(val).toFixed(6) : (val || "-");
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 block mb-1">{t('investmentProfile.longitude')}</span>
                      <span className="text-xs sm:text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                        {(() => {
                          const val = geo?.longitude || loc?.longitude;
                          return val && !isNaN(Number(val)) ? Number(val).toFixed(6) : (val || "-");
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RELATIVE DISTANCE TO INFRASTRUCTURE */}
                <div
                  className={`p-5 rounded-lg ${sectionBg} border ${sectionBorder}`}
                >
                  <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-slate-800 dark:text-slate-100">
                    <TrendingUp className="w-4 h-4" /> {t('investmentProfile.proksimitasTitle')}
                  </h3>
                  <p className="text-xs text-slate-800 dark:text-slate-200">
                    ℹ️ {t('investmentProfile.proksimitasDesc')}
                  </p>
                  {loadingSpatial ? (
                    <div className="flex flex-col gap-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="animate-pulse flex items-center gap-2"
                        >
                          <div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-800 flex-1 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : spatialError ? (
                    <div className="p-4 rounded-md text-center">
                      <Zap className="w-8 h-8 mx-auto text-amber-500 opacity-60 mb-2" />
                      <p className="text-xs text-slate-800 dark:text-slate-200">
                        {t('investmentProfile.spatialError', 'Kalkulasi proksimitas tidak tersedia atau koordinat belum sinkron.')}
                      </p>
                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={fetchSpatial}
                        className="mt-2 text-xs font-normal text-indigo-500"
                      >
                        {t('investmentProfile.refreshSpatial', 'Picu Analisis Spasial 🔄')}
                      </motion.button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {renderDistanceBar(
                        t('investmentProfile.aksesJalan'),
                        "🛣️",
                        spatialData?.distances?.nearestRoad?.distanceKm,
                        20,
                        spatialData?.distances?.nearestRoad?.isNetworkRouting,
                      )}
                      {renderDistanceBar(
                        t('investmentProfile.pelabuhan'),
                        "⚓",
                        spatialData?.distances?.nearestPort?.distanceKm,
                        50,
                        spatialData?.distances?.nearestPort?.isNetworkRouting,
                      )}
                      {renderDistanceBar(
                        t('investmentProfile.bandara'),
                        "✈️",
                        spatialData?.distances?.nearestAirport?.distanceKm,
                        45,
                        spatialData?.distances?.nearestAirport?.isNetworkRouting,
                      )}
                      {renderDistanceBar(
                        t('investmentProfile.garduPln', 'Gardu PLN 150kV (Jalur Darat)'),
                        "⚡",
                        spatialData?.distances?.nearestPowerGrid?.distanceKm,
                        30,
                        spatialData?.distances?.nearestPowerGrid?.isNetworkRouting,
                      )}
                      {renderDistanceBar(
                        t('investmentProfile.menaraTelko', 'Menara Telko (Jalur Darat)'),
                        "📡",
                        spatialData?.distances?.nearestTelco?.distanceKm,
                        20,
                        spatialData?.distances?.nearestTelco?.isNetworkRouting,
                      )}

                      <div className="mt-2 p-3 rounded-md bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 block mb-1">{t('investmentProfile.skorAksesibilitas')}</span>
                        <span className="text-xs sm:text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                          {spatialData?.accessibilityScore}/100 ({t('investmentProfile.mudahDiakses')} 🟢)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI READINESS SCORE */}
                <div
                  className={`p-5 rounded-lg bg-gradient-to-br ${isDarkMode ? "from-indigo-950/20 to-purple-950/40 border border-indigo-900/60" : "from-indigo-50 to-purple-50 border border-indigo-100"} flex flex-col justify-between`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 block mb-1"><Sparkles className="w-4 h-4 animate-bounce" /> {t('investmentProfile.aiReadinessTitle')}</span>
                    <span className="text-xs sm:text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                      {geo?.ai_score || profileData?.aiScore || 85}
                      <span className="text-xs sm:text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">/100
                      </span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
                      style={{
                        width: `${geo?.ai_score || profileData?.aiScore || 85}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200">
                    {geo?.ai_narasi ||
                      profileData?.ai_narasi ||
                      t('investmentProfile.aiReadinessDesc')}
                  </p>
                </div>
              </div>

              {/* RIGHT COLUMN: SPECS, UTILITIES, REAL CONTACTS, PHOTO SLIDER */}
              <div className="flex flex-col gap-6">
                {/* FISIK & UTILITAS */}
                <div
                  className={`p-5 rounded-lg ${sectionBg} border ${sectionBorder}`}
                >
                  <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-slate-800 dark:text-slate-100">
                    <CheckCircle className="w-4 h-4" /> {t('investmentProfile.fisikUtilitasTitle')}
                  </h3>

                  {/* Parameter Fisik */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 pb-4 border-b border-dashed border-slate-200 dark:border-slate-800">
                    <div className="p-3 bg-slate-50/50 dark:bg-zinc-800/40 rounded-md flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        {t('investmentProfile.kondisiTopografi')}{" "}
                      </span>
                      <span className="text-xs sm:text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                        {" "}
                        <AutoTranslatedText text={geo.kondisi_topografi || "Datar (Topografi Prima)"} inline />
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50/50 dark:bg-zinc-800/40 rounded-md flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        {t('investmentProfile.aksesLahan')}{" "}
                      </span>
                      <span className="text-xs sm:text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0"></span>
                        {" "}
                        <AutoTranslatedText text={geo.akses_jalan_terdekat || "Jalan Kabupaten"} inline />
                      </span>
                    </div>
                  </div>

                  {/* Utilitas Badge */}
                  <div className="flex flex-col gap-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> {t('investmentProfile.pasokanListrik')}</span>
                      <span className="text-xs sm:text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                        <AutoTranslatedText text={geo.pasokan_listrik || "Tersedia Jaringan PLN"} inline />
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2"><Droplet className="w-4 h-4 text-blue-500" /> {t('investmentProfile.sumberAir')}</span>
                      <span className="text-xs sm:text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                        <AutoTranslatedText text={geo.sumber_air_bersih || "PDAM / Air Tanah Bersih"} inline />
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2"><Wifi className="w-4 h-4 text-indigo-500" /> {t('investmentProfile.jaringanTelko')}</span>
                      <span className="text-xs sm:text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                        <AutoTranslatedText text={geo.jaringan_telekomunikasi || "Fiber Optic / Sinyal 4G Kuat"} inline />
                      </span>
                    </div>
                  </div>
                </div>

                {/* SKEMA INVESTASI & PIC CONTACTS */}
                <div
                  className={`p-5 rounded-lg ${sectionBg} border ${sectionBorder}`}
                >
                  <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-slate-800 dark:text-slate-100">
                    <Briefcase className="w-4 h-4" /> {t('investmentProfile.kriteriaBisnisTitle')}
                  </h3>

                  {/* Parameter Bisnis */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-slate-50/50 dark:bg-zinc-800/40 rounded-md flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        {t('investmentProfile.skemaKemitraan')}{" "}
                      </span>
                      <span className="text-xs sm:text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                        {" "}
                        <AutoTranslatedText text={geo.skema_kemitraan || "Joint Venture / Kemitraan Swasta"} inline />
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50/50 dark:bg-zinc-800/40 rounded-md flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        {t('investmentProfile.targetInvestor')}{" "}
                      </span>
                      <span className="text-xs sm:text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                        {" "}
                        <AutoTranslatedText text={geo.target_investor || "PMDN / PMA Global"} inline />
                      </span>
                    </div>
                  </div>

                  {/* HIGHLY VISIBLE PRIMARY CALL TO ACTION BUTTON FOR LOI */}
                  <div className="mb-4">
                    <motion.button whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={async () => {
                        // Security Gatekeeper Check: Ensure user is authenticated
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session || !session.user) {
                          Swal.fire({
                            title: t('investmentProfile.authRequiredTitle', 'Akses Investor Diperlukan'),
                            text: t(
                              'investmentProfile.authRequiredMessage',
                              'Silakan Login atau Registrasi sebagai Investor untuk mengajukan Letter of Intent (LoI).'
                            ),
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonText: t('investmentProfile.loginNow', 'Login / Registrasi Investor'),
                            cancelButtonText: t('investmentProfile.cancel', 'Batal'),
                            background: isDarkMode ? '#0f172a' : '#ffffff',
                            color: isDarkMode ? '#f8fafc' : '#0f172a',
                            confirmButtonColor: '#10b981',
                          }).then((result) => {
                            if (result.isConfirmed) {
                              if (onClose) onClose();
                              try {
                                navigate('/login?role=investor');
                              } catch (e) {
                                window.location.href = '/login?role=investor';
                              }
                            }
                          });
                          return;
                        }

                        // Authenticated user: Populate verified user profile metadata & lock inputs
                        const u = session.user;
                        let profileName = "";
                        let profileCompany = "";
                        try {
                          const { data: profile } = await supabase.from('profiles').select('*').eq('id', u.id).single();
                          if (profile) {
                            profileName = profile.full_name || profile.nama_lengkap || "";
                            profileCompany = profile.company_name || profile.perusahaan || "";
                          }
                        } catch (e) {}

                        const meta = u.user_metadata || {};
                        const fullNameVal = profileName || meta.full_name || meta.company_name || u.email || "";
                        const companyVal = profileCompany || meta.company_name || meta.company || meta.perusahaan || "";
                        const contactVal = meta.no_whatsapp || meta.whatsapp || meta.phone || u.email || "";

                        setLoiInvestorName(fullNameVal);
                        setLoiCompanyName(companyVal);
                        setLoiContactInfo(contactVal);
                        setIsLoiFieldsLocked(true);

                        const rawInvestment = profileData?.investment_value || geo?.nilai_investasi || "";
                        setLoiInvestmentValue(rawInvestment ? String(rawInvestment).replace(/\D/g, "") : "");
                        setLoiLandNeeded(formatLandArea(profileData?.land_area || geo?.luas_lahan || ""));
                        setLoiMessage("");
                        setIsLoiModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-md text-xs sm:text-sm min-h-[44px] transition-all shadow-sm hover:shadow-md transform active:scale-95 cursor-pointer"
                    >
                      <Handshake size={18} className="shrink-0" />
                      <span>{t('investmentProfile.btnSubmitLoi', 'Ajukan Minat Investasi (LoI)')}</span>
                    </motion.button>
                  </div>

                  {/* PIC Card */}
                  <div
                    className={`p-4 rounded-md border border-dashed ${isDarkMode ? "border-slate-700 bg-slate-900/40" : "border-slate-200 bg-white"} flex flex-col gap-3.5`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center justify-center text-slate-600 dark:text-slate-400">
                        <User className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100">
                          <AutoTranslatedText
                            text={
                              geo.nama_kontak_person ||
                              profileData?.contact_pic ||
                              "Dinas Penanaman Modal Luwu"
                            }
                            inline
                          />
                        </h4>
                        <p className="text-xs text-slate-800 dark:text-slate-200">
                          <AutoTranslatedText text={geo.jabatan_kontak || "PIC Hubungan Investor"} inline />
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800">
                      <div className="flex flex-col gap-2.5 text-xs">
                        <span className="font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                          {t('investmentProfile.verifikasiWilayahLahan', 'Verifikasi Wilayah Lahan (SOP Single Window)')}
                        </span>
                        <div className="flex items-start gap-2 bg-slate-50/50 dark:bg-slate-900 p-3 rounded-md border border-slate-100 dark:border-slate-800/80">
                          <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {t('investmentProfile.desa', 'Desa')} {getActualVillageName()}, {t('investmentProfile.kecamatan', 'Kecamatan')} {getActualDistrictName()}
                            </span>
                            <span className="text-[11px] text-slate-600 dark:text-slate-300">
                              {t('investmentProfile.kabupatenLuwuSulsel', 'Kabupaten Luwu, Sulawesi Selatan')}
                            </span>
                          </div>
                        </div>
                        <div className="text-[11px] leading-relaxed text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 p-3 rounded-md flex items-start gap-2.5">
                          <Handshake size={15} className="shrink-0 text-indigo-500 dark:text-indigo-400 mt-0.5" />
                          <span dangerouslySetInnerHTML={{ __html: t('investmentProfile.sopMediasiSingleWindowText', 'Sesuai dengan SOP mediasi <strong>Single Window DPMPTSP Luwu</strong>, investor dilarang menghubungi pemilik lahan secara langsung. Hubungi tim verifikator kami melalui formulir minat <strong>LoI di atas</strong> untuk proses mediasi resmi.') }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AUTO-PHOTO SLIDER SECTION WITH LAZY LOADING & PROGRESSIVE PLACEHOLDER */}
                <div className={`rounded-lg overflow-hidden relative shadow-sm border ${isDarkMode ? "border-slate-700 bg-slate-900/50" : "border-slate-200 bg-slate-100"} w-full min-h-[250px] sm:min-h-[300px] aspect-video shrink-0 z-10 group flex flex-col justify-center items-center`}>
                  {sliderPhotos.length > 0 ? (
                    <>
                      {sliderPhotos.map((photoUrl, idx) => {
                        const safeIdx = currentPhotoIdx >= sliderPhotos.length ? 0 : currentPhotoIdx;
                        const isCurrent = idx === safeIdx;
                        const isAdjacent = Math.abs(idx - safeIdx) <= 1 || (safeIdx === 0 && idx === sliderPhotos.length - 1) || (safeIdx === sliderPhotos.length - 1 && idx === 0);

                        return (
                          <div
                            key={idx}
                            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isCurrent ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}
                          >
                            {(isCurrent || isAdjacent) && (
                              <ProgressiveImage
                                src={photoUrl}
                                alt={`Investment Photo ${idx + 1}`}
                                loading={isCurrent ? "eager" : "lazy"}
                                containerClassName="w-full h-full relative overflow-hidden"
                                className="w-full h-full object-cover"
                                fallbackIcon={<Layers className="w-8 h-8 text-slate-600 dark:text-slate-400 opacity-60" />}
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none z-10"></div>
                            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-20">
                              <span className="text-white font-normal text-xs drop-shadow-md bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm shadow-md border border-white/20">
                                {t('investmentProfile.visualisasiProyek')}
                              </span>
                              {sliderPhotos.length > 1 && (
                                <div className="flex gap-1.5 bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm border border-white/20">
                                  {sliderPhotos.map((_, dotIdx) => (
                                    <span
                                      key={dotIdx}
                                      className={`block h-1.5 rounded-full transition-all duration-300 ${dotIdx === safeIdx ? "bg-white w-4" : "bg-white/40 w-1.5"}`}
                                    ></span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-600 dark:text-slate-400">
                      <Layers className="w-12 h-12 mb-3 opacity-50" />
                      <span className="text-xs font-normal">{t('investmentProfile.noPhotosAvailable', 'Tidak Ada Foto Tersedia')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ANALISIS JARAK FASILITAS / PROXIMITY - SPAN FULL WIDTH AT THE BOTTOM */}
              <div className="col-span-full">
                <div className={`p-5 rounded-lg ${sectionBg} border ${sectionBorder}`}>
                  <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-slate-800 dark:text-slate-100">
                    <Navigation className="w-4 h-4 text-emerald-500" /> {t('investmentProfile.analisisJarakFasilitas', 'Analisis Jarak Fasilitas')}
                  </h3>
                  <div className="flex flex-col gap-5">
                    {(!proximityIntel || proximityIntel.length === 0) ? (
                      <div className="text-xs text-slate-600 dark:text-slate-400 italic p-3 text-center bg-slate-50 dark:bg-slate-800/50 rounded-md">
                        {t('investmentProfile.dataFasilitasTidakTersedia', 'Data fasilitas tidak tersedia')}
                      </div>
                    ) : (
                      <>
                        <div className="w-full h-64 min-h-[250px] p-4 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-100 dark:border-slate-800">
                          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <BarChart 
                             layout="vertical" 
                              data={proximityIntel.map((inf: any) => ({ 
                                name: inf.name?.length > 24 ? inf.name.substring(0, 24) + "..." : (inf.name || "Fasilitas"), 
                                distance: Number(inf.distance.toFixed(1)), 
                                exactDistance: inf.distance,
                                fullName: inf.name, 
                                type: inf.type 
                              }))} 
                              margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                              <XAxis type="number" unit="km" stroke={isDarkMode ? "#64748b" : "#94a3b8"} fontSize={10} />
                              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#475569' }} />
                              <Tooltip 
                                cursor={{fill: isDarkMode ? "#334155" : "#f1f5f9"}}
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    const exact = data.exactDistance || data.distance;
                                    const distLabel = exact < 1 ? `${Math.round(exact * 1000)} m` : `${exact.toFixed(1)} km`;
                                    
                                    const typeStr = data.type ? `${data.type.charAt(0).toUpperCase() + data.type.slice(1)}: ` : "";
                                    
                                    return (
                                      <div style={{ backgroundColor: isDarkMode ? "#0f172a" : "#ffffff", borderColor: isDarkMode ? "#334155" : "#e2e8f0", color: isDarkMode ? "#f8fafc" : "#0f172a" }} className="px-3 py-2 border rounded-lg shadow-xl text-xs font-medium max-w-[300px]">
                                        {typeStr}{data.fullName || data.name} - <span className="text-emerald-500 font-bold">{distLabel}</span>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar dataKey="distance" fill="#10b981" radius={[0, 4, 4, 0]}>
                                {proximityIntel.map((entry: any, index: number) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={isDarkMode ? "#34d399" : "#10b981"} 
                                    onMouseEnter={() => {
                                      if (entry.id && onHoverInfrastructure) onHoverInfrastructure(entry.id, true);
                                    }}
                                    onMouseLeave={() => {
                                      if (entry.id && onHoverInfrastructure) onHoverInfrastructure(entry.id, false);
                                    }}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div 
                         
                          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                        >
                          {(isExpanded ? proximityIntel : proximityIntel.slice(0, 8)).map((inf: any, idx: number) => {
                            const distLabel = inf.distance < 1 ? (Math.round(inf.distance * 1000) + " m") : (inf.distance.toFixed(1) + " km");
                            
                            let FacilityIcon = MapPin;
                            let iconColorClass = "text-emerald-500 dark:text-emerald-400";
                            const tLabel = (inf.type || "").toLowerCase();
                            
                            if (tLabel.includes("rumah sakit") || tLabel.includes("kesehatan") || tLabel.includes("puskesmas") || tLabel.includes("klinik")) {
                              FacilityIcon = HeartPulse;
                              iconColorClass = "text-red-500 dark:text-red-400";
                            } else if (tLabel.includes("sekolah") || tLabel.includes("pendidikan") || tLabel.includes("kampus") || tLabel.includes("sma") || tLabel.includes("smp") || tLabel.includes("sd")) {
                              FacilityIcon = GraduationCap;
                              iconColorClass = "text-blue-500 dark:text-blue-400";
                            } else if (tLabel.includes("polisi") || tLabel.includes("polsek") || tLabel.includes("polres") || tLabel.includes("pemadam") || tLabel.includes("bpbd")) {
                              FacilityIcon = Shield;
                              iconColorClass = "text-orange-500 dark:text-orange-400";
                            } else if (tLabel.includes("pelabuhan") || tLabel.includes("dermaga") || tLabel.includes("port")) {
                              FacilityIcon = Anchor;
                              iconColorClass = "text-indigo-500 dark:text-indigo-400";
                            } else if (tLabel.includes("bandara") || tLabel.includes("airport") || tLabel.includes("terminal")) {
                              FacilityIcon = Plane;
                              iconColorClass = "text-purple-500 dark:text-purple-400";
                            } else if (tLabel.includes("kantor") || tLabel.includes("pemerintah") || tLabel.includes("dinas")) {
                              FacilityIcon = Building2;
                              iconColorClass = "text-slate-600 dark:text-slate-300";
                            }

                            return (
                              <div 
                               
                                key={idx} 
                                className="flex justify-between items-center p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-md border border-slate-100 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-300 ease-in-out  hover:shadow-lg hover:shadow-emerald-500/20 hover:border-emerald-500/50 cursor-default"
                                onMouseEnter={() => {
                                  if (inf.id && onHoverInfrastructure) onHoverInfrastructure(inf.id, true);
                                }}
                                onMouseLeave={() => {
                                  if (inf.id && onHoverInfrastructure) onHoverInfrastructure(inf.id, false);
                                }}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 shrink-0 ${iconColorClass}`}>
                                    <FacilityIcon className="w-4 h-4" />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate pr-1" title={inf.name}>{inf.name || "Fasilitas"}</span>
                                    <span className="text-[9px] text-slate-600 dark:text-slate-400 uppercase tracking-wider truncate">{inf.type || "Fasilitas Publik"}</span>
                                  </div>
                                </div>
                                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/30 px-2 py-1 rounded shrink-0">
                                  {distLabel}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {proximityIntel.length > 8 && (
                          <div className="flex justify-center mt-3">
                            <motion.button whileTap={{ scale: 0.95 }}
                              onClick={() => setIsExpanded(!isExpanded)}
                              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-md transition-all shadow-sm cursor-pointer"
                            >
                              {isExpanded ? (
                                <>
                                  {t('investmentProfile.lebihSedikit', 'Lebih Sedikit')} <ChevronUp className="w-3.5 h-3.5 text-emerald-500" />
                                </>
                              ) : (
                                <>
                                  {t('investmentProfile.tampilkanSemuaFasilitas', 'Tampilkan Semua Fasilitas ({{count}})', { count: proximityIntel.length })} <ChevronDown className="w-3.5 h-3.5 text-emerald-500" />
                                </>
                              )}
                            </motion.button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "simulator" && (
            <div className="flex flex-col gap-6 p-4 md:p-6 pb-20 sm:pb-6">
              {/* TOP BANNER & SCENARIO CONTROLLER */}
              <div className={`p-4 md:p-5 rounded-lg border ${isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-gradient-to-r from-emerald-50/80 via-indigo-50/50 to-purple-50/50 border-emerald-100"} flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm`}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {i18n.language?.startsWith("zh") ? "财务可行性分析模型 (UNIDO / IFC 标准)" : i18n.language?.startsWith("en") ? "Financial Feasibility Analysis Model (UNIDO / IFC Standard)" : "Model Analisis Kelayakan Finansial (UNIDO / IFC Standard)"}
                      </h3>
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        Discounted Cash Flow (DCF)
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      {i18n.language?.startsWith("zh") ? "基于 Luwu 县政府基准参数的净现金流、IRR、NPV 和投资回收期的动态模拟。" : i18n.language?.startsWith("en") ? "Dynamic simulation of net cash flow, IRR, NPV, and payback period based on Luwu Regency baseline parameters." : "Simulasi dinamis arus kas neto, IRR, NPV, dan payback period berdasarkan parameter baseline Pemkab Luwu."}
                    </p>
                  </div>
                </div>

                {/* SCENARIO PRESETS */}
                <div className="flex items-center gap-1.5 p-1 rounded-md bg-slate-200/50 dark:bg-slate-800/80 border border-slate-300/50 dark:border-slate-700/50 shrink-0">
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => applyScenario("bear")}
                    className={`min-h-[44px] py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      activeScenario === "bear"
                        ? "bg-rose-500 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {i18n.language?.startsWith("zh") ? "保守 (看跌)" : i18n.language?.startsWith("en") ? "Conservative (Bear)" : "Konservatif (Bear)"}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => applyScenario("base")}
                    className={`min-h-[44px] py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      activeScenario === "base"
                        ? "bg-emerald-600 dark:bg-emerald-500 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {i18n.language?.startsWith("zh") ? "基本情况 (政府)" : i18n.language?.startsWith("en") ? "Base Case (Gov)" : "Base Case (Pemkab)"}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => applyScenario("bull")}
                    className={`min-h-[44px] py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      activeScenario === "bull"
                        ? "bg-emerald-600 dark:bg-emerald-500 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {i18n.language?.startsWith("zh") ? "激进 (看涨)" : i18n.language?.startsWith("en") ? "Aggressive (Bull)" : "Agresif (Bull)"}
                  </motion.button>
                </div>
              </div>

              {/* TWO COLUMN GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
                {/* LEFT: BASELINE DATA & SANDBOX CONTROLS */}
                <div className="col-span-1 lg:col-span-5 flex flex-col gap-5">
                  {/* DATA BAKU PEMKAB */}
                  <div className={`p-5 rounded-lg ${sectionBg} border ${sectionBorder}`}>
                    <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-3.5 text-slate-800 dark:text-slate-200 dark:text-slate-200">
                      <Database className="w-4 h-4 text-emerald-500" /> {t('investmentProfile.simDataBaku')}
                    </h3>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 p-3 rounded-md">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 block mb-1">{t('investmentProfile.capexValue')}</span>
                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 block">{formatCompactRupiah(capex)}</span>
                        <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 block mt-0.5">{formatUsd(capex)}</span>
                      </div>
                      <div className="border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 p-3 rounded-md">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 block mb-1">{t('investmentProfile.opexEst')}</span>
                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 block">{formatCompactRupiah(opex)}</span>
                        <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 block mt-0.5">{formatUsd(opex)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 font-mono text-xs">
                      <div className="flex justify-between border-b pb-1.5 dark:border-slate-800">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">{t('investmentProfile.legalStatus')}</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          <AutoTranslatedText
                            text={leg.ownership_status || profileData?.landStatus || "Sertifikat"}
                            inline
                          />
                        </span>
                      </div>
                      <div className="flex justify-between border-b pb-1.5 dark:border-slate-800">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">{t('investmentProfile.targetRoi')}</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{geo?.roi_estimasi || fin?.roi || 12.5}% / {t('investmentProfile.thn', 'Thn')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">{t('investmentProfile.mainSector')}</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {t(getSectorI18nKey(profileData?.sector || geo?.sektor_utama || "Sektor"))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* THE SANDBOX DYNAMIC CONTROLS */}
                  <div className={`p-5 rounded-lg ${sectionBg} border ${sectionBorder} flex flex-col gap-5`}>
                    <div className="border-b pb-3 border-slate-200/60 dark:border-slate-800">
                      <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-800 dark:text-slate-100">
                        <Calculator className="w-4 h-4 text-indigo-500" /> {t('investmentProfile.sandboxTitle')}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {t('investmentProfile.sandboxDesc')}
                      </p>
                    </div>

                    {/* Asumsi Pendapatan */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {t('investmentProfile.grossRev')}
                        </label>
                        <div className="text-right">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">{formatCompactRupiah(asumsiPendapatan)}/{t('investmentProfile.tahun', 'Thn')}</span>
                          <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 block">{formatUsd(asumsiPendapatan)}</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={opex * 0.1 || 10000000}
                        max={capex * 0.4 || 2000000000}
                        step={Math.max(1000000, capex * 0.005)}
                        value={asumsiPendapatan || 10000000}
                        onChange={(e) => setAsumsiPendapatan(Number(e.target.value))}
                        className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none"
                      />
                      <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                        <span>Min: {formatCompactRupiah(opex * 0.1 || 10000000)}</span>
                        <span>Max: {formatCompactRupiah(capex * 0.4 || 2000000000)}</span>
                      </div>
                    </div>

                    {/* Suku Bunga Discount */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {t('investmentProfile.interestRate')} (WACC / Discount Rate)
                        </label>
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{sukuBunga}%</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={30}
                        step={0.5}
                        value={sukuBunga}
                        onChange={(e) => setSukuBunga(Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none"
                      />
                      <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                        <span>Min: 1.0%</span>
                        <span>BI / IFC Avg: 8.5%</span>
                        <span>Max: 30.0%</span>
                      </div>
                    </div>

                    {/* Tenor Umur Proyek */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {t('investmentProfile.tenor')} (Project Horizon)
                        </label>
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{tenorWaktu} {t('investmentProfile.tahun', 'Tahun')}</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={25}
                        step={1}
                        value={tenorWaktu}
                        onChange={(e) => setTenorWaktu(Number(e.target.value))}
                        className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none"
                      />
                      <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                        <span>Min: 1 {i18n.language?.startsWith("zh") ? "年" : i18n.language?.startsWith("en") ? "Yr" : "Thn"}</span>
                        <span>Standard: 10 {i18n.language?.startsWith("zh") ? "年" : i18n.language?.startsWith("en") ? "Yr" : "Thn"}</span>
                        <span>Max: 25 {i18n.language?.startsWith("zh") ? "年" : i18n.language?.startsWith("en") ? "Yr" : "Thn"}</span>
                      </div>
                    </div>

                    {/* FITUR UNGGULAN SPASIAL & INSENTIF DILINTASI PERDA LUWU */}
                    <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-col gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        {t('rtrwZoning.integratedTitle', 'Matriks & Analisis Terpadu Luwu:')}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setIsRtrwModalOpen(true)}
                          className="p-2.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ShieldCheck size={14} />
                          <span>{t('rtrwZoning.shortButton', 'Kesesuaian RTRW')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsIncentiveModalOpen(true)}
                          className="p-2.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Award size={14} />
                          <span>{t('incentiveCalculator.shortButton', 'Insentif Perda')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsProximityModalOpen(true)}
                          className="p-2.5 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Navigation size={14} />
                          <span>{t('proximityMatrix.shortButton', 'Supply Chain')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT: REAL-TIME EXECUTIVE CALCULATION DISPLAY */}
                <div className="col-span-1 lg:col-span-7 flex flex-col gap-5">
                  <div className={`p-5 md:p-6 rounded-lg border ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200/80"} shadow-sm flex flex-col gap-5`}>
                    
                    {/* EXECUTIVE FEASIBILITY HEADLINE BADGE */}
                    <div className={`p-4 rounded-md border flex items-center justify-between gap-4 ${
                      cashFlow <= 0 || npv < 0 || irr < sukuBunga
                        ? isDarkMode ? "bg-rose-950/30 border-rose-800/40 text-rose-300" : "bg-rose-50 border-rose-200 text-rose-800"
                        : npv > 0 && irr > sukuBunga + 5
                          ? isDarkMode ? "bg-emerald-950/30 border-emerald-800/40 text-emerald-300" : "bg-emerald-50 border-emerald-200 text-emerald-900"
                          : isDarkMode ? "bg-amber-950/30 border-amber-800/40 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-900"
                    }`}>
                      <div className="flex items-center gap-3">
                        {cashFlow <= 0 || npv < 0 || irr < sukuBunga ? (
                          <div className="p-2.5 rounded-md bg-rose-500/20 text-rose-500 shrink-0">
                            <HelpCircle className="w-6 h-6" />
                          </div>
                        ) : npv > 0 && irr > sukuBunga + 5 ? (
                          <div className="p-2.5 rounded-md bg-emerald-500/20 text-emerald-500 shrink-0">
                            <ShieldCheck className="w-6 h-6" />
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-md bg-amber-500/20 text-amber-500 shrink-0">
                            <Info className="w-6 h-6" />
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 block">Status Kelayakan Regional</span>
                          <h4 className="text-sm font-extrabold uppercase tracking-wide">
                            {cashFlow <= 0 || npv < 0 || irr < sukuBunga
                              ? "HIGH RISK / UNFEASIBLE (RESTRUCTURE REQUIRED)"
                              : npv > 0 && irr > sukuBunga + 5
                                ? "BANKABLE & HIGHLY FEASIBLE (SANGAT PROSPEKTIF)"
                                : "MODERATE FEASIBILITY (PERLU KAJIAN TINGKAT DUA)"}
                          </h4>
                        </div>
                      </div>
                      <div className="text-right shrink-0 hidden sm:block">
                        <span className="text-[10px] uppercase font-mono text-slate-600 dark:text-slate-400 block">Hurdle Rate Spread</span>
                        <span className={`text-xs font-bold font-mono ${irr >= sukuBunga ? "text-emerald-500" : "text-rose-500"}`}>
                          {(irr - sukuBunga) >= 0 ? `+${(irr - sukuBunga).toFixed(2)}%` : `${(irr - sukuBunga).toFixed(2)}%`}
                        </span>
                      </div>
                    </div>

                    {/* METRIC GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* IRR CARD */}
                      <div className={`p-4 rounded-md border transition-all duration-300 hover:shadow-md flex flex-col justify-between ${
                        irr > sukuBunga
                          ? isDarkMode ? "border-emerald-500/30 bg-emerald-950/10" : "border-emerald-200 bg-emerald-50/30"
                          : isDarkMode ? "border-rose-500/30 bg-rose-950/10" : "border-rose-200 bg-rose-50/30"
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 block">{t('investmentProfile.irrTitle', 'Internal Rate of Return')}</span>
                            <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">Vs Hurdle Rate ({sukuBunga}%)</span>
                          </div>
                          <TrendingUp className={`w-4 h-4 shrink-0 ${irr > sukuBunga ? "text-emerald-500" : "text-rose-500"}`} />
                        </div>
                        <div className="mt-2">
                          <div className="flex items-baseline justify-between mb-1">
                            <span className="text-lg font-black text-slate-800 dark:text-slate-100 font-mono">{irr.toFixed(2)}%</span>
                            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">IRR Tahunan</span>
                          </div>
                          {/* Progress bar comparing IRR to Discount Rate */}
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${irr > sukuBunga ? "bg-emerald-500" : "bg-rose-500"}`}
                              style={{ width: `${Math.min(100, (irr / Math.max(1, sukuBunga * 2)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* NPV CARD */}
                      <div className={`p-4 rounded-md border transition-all duration-300 hover:shadow-md flex flex-col justify-between ${
                        npv > 0
                          ? isDarkMode ? "border-emerald-500/30 bg-emerald-950/10" : "border-emerald-200 bg-emerald-50/30"
                          : isDarkMode ? "border-rose-500/30 bg-rose-950/10" : "border-rose-200 bg-rose-50/30"
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 block">{t('investmentProfile.npvTitle', 'Net Present Value')}</span>
                            <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">{formatUsd(npv)}</span>
                          </div>
                          <DollarSign className={`w-4 h-4 shrink-0 ${npv > 0 ? "text-emerald-500" : "text-rose-500"}`} />
                        </div>
                        <div className="mt-2">
                          <span className="text-lg font-black text-slate-800 dark:text-slate-100 font-mono block truncate">
                            {npv >= 0 ? "+" : ""}{formatRupiah(npv)}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mt-0.5">
                            {i18n.language?.startsWith("zh") ? `净现值 (${tenorWaktu} 年)` : i18n.language?.startsWith("en") ? `Net Present Value (${tenorWaktu} Yr)` : `Nilai Bersih Diskonto (${tenorWaktu} Thn)`}
                          </span>
                        </div>
                      </div>

                      {/* PAYBACK PERIOD CARD */}
                      <div className={`p-4 rounded-md border transition-all duration-300 hover:shadow-md flex flex-col justify-between ${
                        bep > 0 && bep <= 5
                          ? isDarkMode ? "border-emerald-500/30 bg-emerald-950/10" : "border-emerald-200 bg-emerald-50/30"
                          : isDarkMode ? "border-amber-500/30 bg-amber-950/10" : "border-amber-200 bg-amber-50/30"
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 block">{t('investmentProfile.paybackTitle', 'Payback Period')}</span>
                          <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                        </div>
                        <div className="space-y-1 mt-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600 dark:text-slate-400">Simple Payback:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                              {cashFlow <= 0 || bep > 99 ? "N/A" : `${bep.toFixed(1)} ${i18n.language?.startsWith("zh") ? "年" : i18n.language?.startsWith("en") ? "Yr" : "Thn"}`}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs border-t pt-1 border-slate-200/50 dark:border-slate-800">
                            <span className="text-slate-600 dark:text-slate-400">Discounted Payback:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                              {discountedPayback > tenorWaktu ? (i18n.language?.startsWith("zh") ? "超出期限" : "Exceeds Horizon") : `${discountedPayback.toFixed(1)} ${i18n.language?.startsWith("zh") ? "年" : i18n.language?.startsWith("en") ? "Yr" : "Thn"}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ANNUAL NET CASH FLOW CARD */}
                      <div className={`p-4 rounded-md border transition-all duration-300 hover:shadow-md flex flex-col justify-between ${
                        cashFlow > 0
                          ? isDarkMode ? "border-emerald-500/30 bg-emerald-950/10" : "border-emerald-200 bg-emerald-50/30"
                          : isDarkMode ? "border-rose-500/30 bg-rose-950/10" : "border-rose-200 bg-rose-50/30"
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 block">
                              {i18n.language?.startsWith("zh") ? "年净现金流" : i18n.language?.startsWith("en") ? "Annual Net Cash Flow" : "Arus Kas Neto Tahunan"}
                            </span>
                            <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">{formatUsd(cashFlow)}/{i18n.language?.startsWith("zh") ? "年" : i18n.language?.startsWith("en") ? "Yr" : "Thn"}</span>
                          </div>
                          <Percent className={`w-4 h-4 shrink-0 ${cashFlow > 0 ? "text-emerald-500" : "text-rose-500"}`} />
                        </div>
                        <div className="mt-2">
                          <span className="text-lg font-black text-slate-800 dark:text-slate-100 font-mono block truncate">
                            {formatRupiah(cashFlow)}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mt-0.5">
                            {i18n.language?.startsWith("zh") ? "净利润率" : i18n.language?.startsWith("en") ? "Net Margin" : "Margin Neto"}: {((cashFlow / (asumsiPendapatan || 1)) * 100).toFixed(1)}% | ROI: {roi.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* AI CONSULTANT CTA BUTTON */}
                    <div className="col-span-full pt-1">
                      <motion.button whileTap={{ scale: 0.95 }}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-md shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2.5 group cursor-pointer"
                        onClick={() => {
                          setIsRoiAiModalOpen(true);
                        }}
                      >
                        <Sparkles className="w-4 h-4 group-hover:scale-125 group-hover:rotate-12 transition-all" />
                        {t('investmentProfile.requestAi', 'Minta AI Analisa Finansial Spasial ✨')}
                      </motion.button>
                    </div>

                    {/* MICRO DECISION EXPLANATION BADGE */}
                    <div className={`p-3.5 rounded-md border text-[11px] leading-relaxed font-normal ${
                      cashFlow <= 0 || npv < 0 || irr < sukuBunga
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-500 dark:text-rose-400"
                        : npv > 0 && irr > sukuBunga + 5
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                          : "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300"
                    }`}>
                      {cashFlow <= 0 || npv < 0 || irr < sukuBunga ? (
                        <span>
                          {t('investmentProfile.aiWarningHighRisk', { npv: formatRupiah(npv), irr: irr.toFixed(2) })}
                        </span>
                      ) : npv > 0 && irr > sukuBunga + 5 ? (
                        <span>
                          {t('investmentProfile.aiFeasible', { irr: irr.toFixed(2), sukuBunga })}
                        </span>
                      ) : (
                        <span>
                          {t('investmentProfile.aiModerate', { irr: irr.toFixed(2), sukuBunga })}
                        </span>
                      )}
                    </div>

                    {/* VISUAL CASHFLOW TRAJECTORY CHART */}
                    <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-emerald-500" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 dark:text-slate-200">
                            {i18n.language?.startsWith("zh") ? "累计现金流预测 (DCF 交叉范围)" : i18n.language?.startsWith("en") ? "Accumulated Cash Flow Projection (DCF Crossover Horizon)" : "Proyeksi Akumulasi Arus Kas (DCF Crossover Horizon)"}
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">
                          {i18n.language?.startsWith("zh") ? "面值: 百万印尼盾" : i18n.language?.startsWith("en") ? "Nominal: Million IDR" : "Nominal: Juta Rp"}
                        </span>
                      </div>
                      
                      <div className="h-40 w-full pt-1">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                          <BarChart data={cashFlowTrajectory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                            <XAxis
                              dataKey="year"
                              tick={{ fontSize: 10, fill: isDarkMode ? "#94a3b8" : "#64748b" }}
                              axisLine={{ stroke: isDarkMode ? "#475569" : "#cbd5e1" }}
                            />
                            <YAxis
                              tick={{ fontSize: 10, fill: isDarkMode ? "#94a3b8" : "#64748b" }}
                              axisLine={{ stroke: isDarkMode ? "#475569" : "#cbd5e1" }}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className={`p-2.5 rounded-md border text-xs shadow-lg ${
                                      isDarkMode ? "bg-slate-900 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                                    }`}>
                                      <p className="font-bold text-xs border-b pb-1 mb-1 border-slate-200 dark:border-slate-800">{data.year}</p>
                                      <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                                        {i18n.language?.startsWith("zh") ? `年度 DCF: Rp ${data.aruskas.toLocaleString("id-ID")} 百万` : i18n.language?.startsWith("en") ? `Annual DCF: Rp ${data.aruskas.toLocaleString("id-ID")} Million` : `DCF Tahunan: Rp ${data.aruskas.toLocaleString("id-ID")} Juta`}
                                      </p>
                                      <p className={`text-[11px] font-mono font-bold ${data.kumulatif >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                        {i18n.language?.startsWith("zh") ? `累计 DCF: Rp ${data.kumulatif.toLocaleString("id-ID")} 百万` : i18n.language?.startsWith("en") ? `Cumulative DCF: Rp ${data.kumulatif.toLocaleString("id-ID")} Million` : `Kumulatif DCF: Rp ${data.kumulatif.toLocaleString("id-ID")} Juta`}
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="kumulatif" radius={[4, 4, 0, 0]}>
                              {cashFlowTrajectory.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.kumulatif >= 0 ? "#10b981" : "#f43f5e"}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-600 dark:text-slate-400 mt-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
                          <span>{i18n.language?.startsWith("zh") ? "初始投资 (负现金流)" : i18n.language?.startsWith("en") ? "Initial Investment (Negative Net Cash Outflow)" : "Investasi Awal (Negative Net Cash Outflow)"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                          <span>{i18n.language?.startsWith("zh") ? "累计正 DCF (投资回收后)" : i18n.language?.startsWith("en") ? "Cumulative Positive DCF (Post-Payback)" : "Kumulatif DCF Positif (Post-Payback)"}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
              <ROICalculator isDarkMode={isDarkMode} />
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div
          className={`p-4 shrink-0 border-t ${sectionBorder} flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-start gap-3 ${isDarkMode ? "bg-slate-900" : "bg-white"}`}
        >
          <div className="flex gap-2 items-center flex-wrap">
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className={`w-full sm:w-auto px-5 py-3 sm:py-2 flex justify-center font-normal text-xs uppercase tracking-wider rounded-lg border ${isDarkMode ? "border-slate-800 hover:bg-slate-800 text-gray-100" : "border-slate-200 hover:bg-slate-50 text-gray-800 dark:text-gray-200"}`}
            >
              {t('investmentProfile.kembali')} &times;
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={handleGeneratePdf}
              disabled={isGeneratingPdf}
              className="w-full sm:w-auto px-4 py-3 sm:py-2 flex justify-center items-center gap-2 font-bold text-xs uppercase tracking-wider rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm border border-emerald-500 disabled:opacity-60 transition-all cursor-pointer"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Menerbitkan PDF...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Cetak Resume (PDF)</span>
                </>
              )}
            </motion.button>
            {(currentRole === Role.SUPER_ADMIN || currentRole === Role.OPERATOR) && onEdit && (
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onClose();
                  onEdit();
                }}
                className={`w-full sm:w-auto px-5 py-3 sm:py-2 flex justify-center items-center gap-2 font-normal text-xs uppercase tracking-wider rounded-lg border border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all`}
              >
                <Pencil className="w-4 h-4 shrink-0" /> {t('investmentProfile.editData', 'Edit Data')}
              </motion.button>
            )}
          </div>
        </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {isRoiAiModalOpen && (
        <RoiAiAnalysisModal
          isOpen={isRoiAiModalOpen}
          onClose={() => setIsRoiAiModalOpen(false)}
          investmentName={profileData?.name || geo?.nama_potensi || "Potensi Investasi"}
          sector={profileData?.sector || geo?.sektor_utama || "Sektor"}
          capex={capex}
          revenue={asumsiPendapatan}
          opex={opex}
          paybackPeriod={bep}
          irr={irr}
          npv={npv}
          discountRate={sukuBunga}
          isDarkMode={isDarkMode}
        />
      )}

      {isLoiModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div
            
            
            
            className={`w-full max-w-lg rounded-lg border p-6 shadow-2xl relative overflow-hidden ${
              isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4 mb-4 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Handshake className="text-emerald-500" size={24} />
                <h3 className="font-bold text-lg">{t('investmentProfile.loiTitle', 'Formulir Minat Investasi (LoI)')}</h3>
              </div>
              <motion.button whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setIsLoiModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 dark:hover:text-slate-300"
              >
                <X size={20} />
              </motion.button>
            </div>

            {/* Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!loiInvestorName.trim()) {
                  Swal.fire({
                    title: t('investmentProfile.errorTitle', 'Kesalahan'),
                    text: t('investmentProfile.errorNameRequired', 'Nama investor harus diisi.'),
                    icon: "error",
                    background: isDarkMode ? "#0f172a" : "#ffffff",
                    color: isDarkMode ? "#f8fafc" : "#0f172a"
                  });
                  return;
                }
                if (!loiContactInfo.trim()) {
                  Swal.fire({
                    title: t('investmentProfile.errorTitle', 'Kesalahan'),
                    text: t('investmentProfile.errorContactRequired', 'Informasi kontak (No. WA/Email) harus diisi.'),
                    icon: "error",
                    background: isDarkMode ? "#0f172a" : "#ffffff",
                    color: isDarkMode ? "#f8fafc" : "#0f172a"
                  });
                  return;
                }

                setIsSubmittingLoi(true);
                try {
                  const targetPotName = profileData?.name || geo?.nama_potensi || geo?.title || "Potensi Investasi";
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session?.user) {
                    Swal.fire({
                      title: t('investmentProfile.authRequiredTitle', 'Akses Investor Diperlukan'),
                      text: t('investmentProfile.authRequiredMessage', 'Silakan Login atau Registrasi sebagai Investor untuk mengajukan Letter of Intent (LoI).'),
                      icon: "warning",
                      background: isDarkMode ? "#0f172a" : "#ffffff",
                      color: isDarkMode ? "#f8fafc" : "#0f172a"
                    });
                    setIsLoiModalOpen(false);
                    try {
                      navigate('/login?role=investor');
                    } catch (e) {
                      window.location.href = '/login?role=investor';
                    }
                    return;
                  }

                  const token = session.access_token || "";
                  const userNik = session.user.user_metadata?.nik || "";
                  const investorId = session.user.id;

                  const response = await fetch("/api/investment-interests", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      ...(token ? { "Authorization": `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({
                      investor_id: investorId, // Strictly attached from auth session
                      investor_name: loiInvestorName,
                      company_name: loiCompanyName,
                      contact_info: loiContactInfo,
                      potensi_name: targetPotName,
                      nilai_investasi: loiInvestmentValue,
                      kebutuhan_lahan: loiLandNeeded,
                      pesan_tambahan: loiMessage,
                      nik: userNik,
                      nib_oss: loiNibOss || ""
                    })
                  });

                  const resData = await response.json();
                  if (!response.ok) {
                    throw new Error(resData.error || t('investmentProfile.errorGeneric', 'Gagal mengirim formulir.'));
                  }

                  setIsLoiModalOpen(false);
                  Swal.fire({
                    title: t('investmentProfile.submitSuccessTitle', 'LoI Terkirim!'),
                    text: t('investmentProfile.submitSuccessDesc', 'Minat investasi Anda telah diterima. Tim DPMPTSP Luwu akan segera menghubungi Anda.'),
                    icon: "success",
                    background: isDarkMode ? "#0f172a" : "#ffffff",
                    color: isDarkMode ? "#f8fafc" : "#0f172a"
                  });
                } catch (error: any) {
                  console.error("LoI submit error:", error);
                  Swal.fire({
                    title: t('investmentProfile.submitErrorTitle', 'Gagal Mengirim LoI'),
                    text: error.message || t('investmentProfile.errorConnection', 'Terjadi kesalahan koneksi.'),
                    icon: "error",
                    background: isDarkMode ? "#0f172a" : "#ffffff",
                    color: isDarkMode ? "#f8fafc" : "#0f172a"
                  });
                } finally {
                  setIsSubmittingLoi(false);
                }
              }}
              className="space-y-4 text-xs sm:text-sm"
            >
              {/* Target Potensi */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400 uppercase tracking-wide">{t('investmentProfile.targetPotTitle', 'Target Potensi Investasi')}</label>
                <input
                  type="text"
                  disabled
                  value={profileData?.name || geo?.nama_potensi || geo?.title || "Potensi Investasi"}
                  className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 cursor-not-allowed"
                />
              </div>

              {/* Nama Lengkap & Perusahaan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center justify-between">
                    <span>{t('investmentProfile.investorName', 'Nama Investor (Lengkap) *')}</span>
                    {isLoiFieldsLocked && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
                        <ShieldCheck size={12} /> Terverifikasi
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isLoiFieldsLocked}
                    readOnly={isLoiFieldsLocked}
                    placeholder={t('investmentProfile.placeholderName', 'Contoh: Yusuf Kalla')}
                    value={loiInvestorName}
                    onChange={(e) => setLoiInvestorName(e.target.value)}
                    className={`w-full p-2.5 rounded-lg border focus:ring-2 focus:ring-emerald-500 outline-none transition font-medium ${
                      isLoiFieldsLocked
                        ? "bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 cursor-not-allowed select-none"
                        : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center justify-between">
                    <span>{t('investmentProfile.companyName', 'Nama Perusahaan / Institusi')}</span>
                    {isLoiFieldsLocked && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-300 font-extrabold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        <Lock size={10} /> Terkunci
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    disabled={isLoiFieldsLocked}
                    readOnly={isLoiFieldsLocked}
                    placeholder={t('investmentProfile.placeholderCompany', 'Contoh: Kalla Group')}
                    value={loiCompanyName}
                    onChange={(e) => setLoiCompanyName(e.target.value)}
                    className={`w-full p-2.5 rounded-lg border focus:ring-2 focus:ring-emerald-500 outline-none transition font-medium ${
                      isLoiFieldsLocked
                        ? "bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 cursor-not-allowed select-none"
                        : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                    }`}
                  />
                </div>
              </div>

              {/* Kontak */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  {t('investmentProfile.contactLabel', 'Kontak WA / Email *')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('investmentProfile.placeholderContact', 'Contoh: +628123456789 atau email@kallagroup.co.id')}
                  value={loiContactInfo}
                  onChange={(e) => setLoiContactInfo(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition font-medium"
                />
              </div>

              {/* Nilai Investasi & Kebutuhan Lahan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400 uppercase tracking-wide">{t('investmentProfile.investmentValueLabel', 'Rencana Nilai Investasi (Rp)')}</label>
                  <input
                    type="text"
                    placeholder="Contoh: Rp 100.000.000"
                    value={formatCurrencyInput(loiInvestmentValue)}
                    onChange={(e) => setLoiInvestmentValue(parseCurrencyInput(e.target.value))}
                    className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400 uppercase tracking-wide">{t('investmentProfile.landNeededLabel', 'Kebutuhan Lahan (Hektar)')}</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Contoh: 2.5"
                    value={loiLandNeeded}
                    onChange={(e) => setLoiLandNeeded(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Pesan Tambahan */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400 uppercase tracking-wide">{t('investmentProfile.messageLabel', 'Pesan untuk DPMPTSP Luwu')}</label>
                <textarea
                  rows={3}
                  placeholder={t('investmentProfile.placeholderMessage', 'Deskripsikan kebutuhan khusus, utilitas infrastruktur, atau pertanyaan Anda.')}
                  value={loiMessage}
                  onChange={(e) => setLoiMessage(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <motion.button whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setIsLoiModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-medium transition cursor-pointer"
                >
                  {t('investmentProfile.btnCancel', 'Batal')}
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={isSubmittingLoi}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingLoi ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      {t('investmentProfile.btnSubmitting', 'Mengirim...')}
                    </>
                  ) : (
                    t('investmentProfile.btnSubmit', 'Kirim Letter of Intent')
                  )}
                </motion.button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADVANCED SPATIAL & INCENTIVE MODALS */}
      <div onClick={(e) => e.stopPropagation()}>
        <RtrwZoningCheckerModal
          isOpen={isRtrwModalOpen}
          onClose={() => setIsRtrwModalOpen(false)}
          selectedInvestment={profileData as any}
          isDark={isDarkMode}
          simulationContext={
            profileData
              ? {
                  name: profileData?.title || profileData?.name || geo?.nama_potensi || "Potensi Investasi Luwu",
                  sector: profileData?.sector || geo?.sektor_utama || "Agro & Industri",
                  capex: capex,
                  opex: opex,
                  asumsiPendapatan: asumsiPendapatan,
                  netProfit: Math.max(0, asumsiPendapatan - opex),
                  roi: Number(roi) || 0,
                  bep: Number(bep) || 0,
                  npv: Number(npv) || 0,
                  irr: Number(irr) || 0,
                  status: npv > 0 && irr > sukuBunga ? "FEASIBLE" : "NOT_FEASIBLE",
                  selectedInvObj: profileData,
                }
              : null
          }
        />

        <IncentiveCalculatorModal
          isOpen={isIncentiveModalOpen}
          onClose={() => setIsIncentiveModalOpen(false)}
          selectedInvestment={profileData as any}
          isDark={isDarkMode}
          simulationContext={
            profileData
              ? {
                  name: profileData?.title || profileData?.name || geo?.nama_potensi || "Potensi Investasi Luwu",
                  sector: profileData?.sector || geo?.sektor_utama || "Agro & Industri",
                  capex: capex,
                  opex: opex,
                  asumsiPendapatan: asumsiPendapatan,
                  netProfit: Math.max(0, asumsiPendapatan - opex),
                  roi: Number(roi) || 0,
                  bep: Number(bep) || 0,
                  npv: Number(npv) || 0,
                  irr: Number(irr) || 0,
                  status: npv > 0 && irr > sukuBunga ? "FEASIBLE" : "NOT_FEASIBLE",
                  selectedInvObj: profileData,
                }
              : null
          }
        />

        <ProximityDistanceMatrixModal
          isOpen={isProximityModalOpen}
          onClose={() => setIsProximityModalOpen(false)}
          selectedInvestment={profileData as any}
          isDark={isDarkMode}
          simulationContext={
            profileData
              ? {
                  name: profileData?.title || profileData?.name || geo?.nama_potensi || "Potensi Investasi Luwu",
                  sector: profileData?.sector || geo?.sektor_utama || "Agro & Industri",
                  capex: capex,
                  opex: opex,
                  asumsiPendapatan: asumsiPendapatan,
                  netProfit: Math.max(0, asumsiPendapatan - opex),
                  roi: Number(roi) || 0,
                  bep: Number(bep) || 0,
                  npv: Number(npv) || 0,
                  irr: Number(irr) || 0,
                  status: npv > 0 && irr > sukuBunga ? "FEASIBLE" : "NOT_FEASIBLE",
                  selectedInvObj: profileData,
                }
              : null
          }
        />

        {/* 1. IPRO Digital Dossier & Pitch Deck Modal */}
        <IproPitchDeckModal
          isOpen={showIproPitchDeck}
          onClose={() => setShowIproPitchDeck(false)}
          investment={profileData as any}
          district={districts.find((d: any) => d.id === profileData?.districtId) || null}
          isDarkMode={isDarkMode}
        />

        {/* 2. Real-Time Spatial Infrastructure & Logistics Inspector Modal */}
        <SpatialInfrastructureInspectorModal
          isOpen={showLogisticsInspector}
          onClose={() => setShowLogisticsInspector(false)}
          investment={profileData as any}
          districts={districts}
          isDarkMode={isDarkMode}
        />

        {/* 3. Automated Spatial ESG Risk & Environmental Audit Modal */}
        <EsgRiskDueDiligenceModal
          isOpen={showEsgShield}
          onClose={() => setShowEsgShield(false)}
          investment={profileData as any}
          district={districts.find((d: any) => d.id === profileData?.districtId) || null}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
}

export default InvestmentDetailModal;
// ui polish: centered modal and matched backgrounds
// ui polish: resolve recharts 0x0 dimension warnings
// security refactor: enforced auth gate for LoI submission and auto-filled form
