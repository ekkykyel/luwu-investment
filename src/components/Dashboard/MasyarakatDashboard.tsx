import { LUWU_LOGO_BASE64 } from "@/lib/logoBase64.js";
import { requestSmartFullscreen, exitSmartFullscreen } from "../../utils/fullscreen";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { booleanPointInPolygon, point, area as turfArea, center as turfCenter, feature as turfFeature, bbox as turfBbox } from '@turf/turf';
import { 
  X, Send, MapPin, Building2, Phone, User, AlertCircle, Camera, 
  Upload, LogOut, RefreshCw, CheckCircle2, Shield, ShieldCheck, FileText, 
  Loader2, AlertOctagon, HelpCircle, Check, Eye, ChevronRight, Info,
  Sun, Moon, Star, Filter, Image as ImageIcon, Briefcase, Home, Plus,
  Clock, Sparkles, Lock, FileCode, UploadCloud, Globe, CreditCard,
  FileCheck, Trash2, Paperclip, Layers, AlertTriangle, ShieldAlert, Download,
  Ticket
} from "lucide-react";
import MppQueueRegistrationModal from "../MppQueueRegistrationModal";
import Swal from "sweetalert2";
import { supabase, safeFetchLayerData } from "../../lib/supabaseClient";
import { District, PKKPRStatus } from "../../types";
import { checkLp2bIntersection, ensureLuwuLngLatOrder, sanitizeSupabasePayload } from "../../utils/lp2bSpatialService";
import SimplePolygonDrawer from "../SimplePolygonDrawer";
import { parseKmlKmzFile } from "../../utils/kmlKmzParser";
import { detectAdministrativeLocation, cleanKecamatanName, cleanDesaName, SpatialOverlapResult } from "../../utils/spatialLookup";
import { addCrossOpdNotification } from "../../utils/crossOpdNotificationStore";
import { MppCitizenSurveyMenu } from "../mpp/MppCitizenSurveyMenu";
import { MppCitizenTestimonialMenu } from "../mpp/MppCitizenTestimonialMenu";
import { MppOtpVerificationGuard } from "../mpp/MppOtpVerificationGuard";
import { getKecamatanLabel, getDesaLabel, getKecamatanId, getDesaId } from "../../utils/gisHelpers";
import { isSameDistrict, normalizeDistrictName } from "../../utils/geoUtils";
import { generateMergedPkkprPdf, readFileAsDataUrl, uploadPkkprDocumentToStorage } from "../../utils/pkkprDocumentMerger";
import { generateSkPkkprPdf } from "../../utils/skPkkprPdfGenerator";
import { getKategoriPengajuan, PKKPR_JENIS_PENGAJUAN_OPTIONS } from "../../utils/pkkprWorkflowService";
import { BapKtrPuptrDocument, convertAppToBapKtrData } from "../documents/BapKtrPuptrDocument";
import { BapLp2bPertanianDocument, convertAppToBapLp2bData } from "../documents/BapLp2bPertanianDocument";

interface MasyarakatDashboardProps {
  isDarkMode?: boolean;
  activeProfile: any;
  districts?: District[];
  onToggleTheme?: () => void;
}


const KECAMATAN_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Larompong": { lat: -3.42, lng: 120.35 },
  "Larompong Selatan": { lat: -3.48, lng: 120.33 },
  "Suli": { lat: -3.28, lng: 120.30 },
  "Suli Barat": { lat: -3.28, lng: 120.25 },
  "Belopa": { lat: -3.33, lng: 120.35 },
  "Belopa Utara": { lat: -3.30, lng: 120.33 },
  "Kamanre": { lat: -3.27, lng: 120.32 },
  "Bajo": { lat: -3.33, lng: 120.27 },
  "Bajo Barat": { lat: -3.33, lng: 120.24 },
  "Bastem": { lat: -3.15, lng: 120.10 },
  "Basse Sangtempe": { lat: -3.15, lng: 120.10 },
  "Bastem Utara": { lat: -3.10, lng: 120.08 },
  "Basse Sangtempe Utara": { lat: -3.10, lng: 120.08 },
  "Latimojong": { lat: -3.30, lng: 120.15 },
  "Bua": { lat: -3.09, lng: 120.22 },
  "Ponrang": { lat: -3.18, lng: 120.28 },
  "Ponrang Selatan": { lat: -3.23, lng: 120.28 },
  "Bupon": { lat: -3.19, lng: 120.25 },
  "Walenrang": { lat: -2.97, lng: 120.18 },
  "Walenrang Timur": { lat: -2.96, lng: 120.22 },
  "Walenrang Utara": { lat: -2.93, lng: 120.19 },
  "Walenrang Barat": { lat: -2.98, lng: 120.12 },
  "Lamasi": { lat: -2.91, lng: 120.17 },
  "Lamasi Timur": { lat: -2.89, lng: 120.22 }
};

// Removed isWithinLuwu for strict Turf.js point-in-polygon geofencing

export default function MasyarakatDashboard({
  isDarkMode: propIsDarkMode,
  activeProfile,
  districts = [],
  onToggleTheme,
}: MasyarakatDashboardProps) {
  const navigate = useNavigate();
  useEffect(() => { return () => { exitSmartFullscreen(); }; }, []);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("luwu_theme");
      if (stored === "dark") return true;
      if (stored === "light") return false;
      return document.documentElement.classList.contains("dark");
    }
    return typeof propIsDarkMode === "boolean" ? propIsDarkMode : false;
  });

  useEffect(() => {
    if (typeof propIsDarkMode === "boolean") {
      setIsDarkMode(propIsDarkMode);
    }
  }, [propIsDarkMode]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (isDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [isDarkMode]);

  const handleToggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (typeof window !== "undefined") {
      localStorage.setItem("luwu_theme", nextDark ? "dark" : "light");
      if (nextDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    if (onToggleTheme) {
      onToggleTheme();
    }
  };

  // Helper to extract phone / whatsapp number from various profile structures
  const extractPhone = useCallback((p: any) => {
    if (!p) return "";
    return (
      p.phone_number ||
      p.phone ||
      p.no_whatsapp ||
      p.whatsapp ||
      p.telepon ||
      p.no_hp ||
      p.no_telepon ||
      p.contact_info ||
      p.contact ||
      p.user_metadata?.phone_number ||
      p.user_metadata?.phone ||
      p.user_metadata?.no_whatsapp ||
      p.user_metadata?.whatsapp ||
      p.user_metadata?.telepon ||
      p.user_metadata?.no_hp ||
      p.user_metadata?.no_telepon ||
      ""
    );
  }, []);

  const normalizeKecamatanName = useCallback((rawKec: any, list: any[] = [], dists: any[] = []): string => {
    if (!rawKec) return "";
    const rawStr = String(rawKec).trim();
    const rawClean = rawStr.replace(/^kec\.?\s*/i, "").replace(/^kecamatan\s*/i, "").trim().toLowerCase();

    // 1. Search in kecamatanList by id
    const matchById = list.find((k) => String(k.id) === rawStr) || dists?.find((d) => String(d.id) === rawStr);
    if (matchById) {
      const kName = matchById.name || matchById.kecamatan || matchById.nama_kecamatan;
      return String(kName).replace(/^kec\.?\s*/i, "").replace(/^kecamatan\s*/i, "").trim();
    }

    // 2. Search in kecamatanList / districts by clean name
    const matchByName = list.find((k) => {
      const kName = (k.name || k.kecamatan || k.nama_kecamatan || "").replace(/^kec\.?\s*/i, "").replace(/^kecamatan\s*/i, "").trim().toLowerCase();
      return kName === rawClean || kName.includes(rawClean) || rawClean.includes(kName);
    }) || dists?.find((d) => {
      const dName = (d.name || d.kecamatan || "").replace(/^kec\.?\s*/i, "").replace(/^kecamatan\s*/i, "").trim().toLowerCase();
      return dName === rawClean || dName.includes(rawClean) || rawClean.includes(dName);
    });

    if (matchByName) {
      const kName = matchByName.name || matchByName.kecamatan || matchByName.nama_kecamatan;
      return String(kName).replace(/^kec\.?\s*/i, "").replace(/^kecamatan\s*/i, "").trim();
    }

    return rawStr.replace(/^kec\.?\s*/i, "").replace(/^kecamatan\s*/i, "").trim();
  }, []);

  // Helper to check for administrative, generic, or mismatched placeholder titles
  const isAdministrativeTitle = (title?: string | null) => {
    if (!title) return true;
    const lower = title.toLowerCase().trim();
    return (
      lower.includes('admin') ||
      lower.includes('dinas') ||
      lower.includes('puptr') ||
      lower.includes('pertanian') ||
      lower.includes('lp2b') ||
      lower.includes('dalak') ||
      lower.includes('promosi') ||
      lower.includes('oss') ||
      lower.includes('mpp') ||
      lower.includes('superadmin') ||
      lower.includes('bidang') ||
      lower.includes('operator') ||
      lower.includes('investor') ||
      lower.includes('terverifikasi') ||
      lower.includes('terdaftar') ||
      [
        "masyarakat",
        "masyarakat publik",
        "masyarakat luwu",
        "offline-user",
        "masyarakat pemohon",
        "warga",
        "pemohon"
      ].includes(lower)
    );
  };

  const resolveCleanCitizenName = (raw?: string | null) => {
    if (raw && !isAdministrativeTitle(raw)) {
      return raw;
    }
    return "";
  };

  // Form states
  const [nama, setNama] = useState(() => {
    return resolveCleanCitizenName(activeProfile?.full_name);
  });
  const [kontak, setKontak] = useState(() => {
    return extractPhone(activeProfile) || "";
  });
  const [kecamatan, setKecamatan] = useState(activeProfile?.kecamatan || "");
  const [desa, setDesa] = useState(activeProfile?.desa || "");
  const [lokasi, setLokasi] = useState("");
  const [perusahaan, setPerusahaan] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [userNik, setUserNik] = useState<string>(() => {
    return activeProfile?.nik || "";
  });
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isDownloadingSkId, setIsDownloadingSkId] = useState<string | null>(null);

  const handleDownloadSkPkkprMasyarakat = async (app: any) => {
    try {
      const appId = String(app.id || 'current');
      setIsDownloadingSkId(appId);

      // If user uploaded a direct SK file or backend generated a direct URL:
      if (app.file_sk_url || app.sk_url || app.fileSkUrl || app.tte_document_url) {
        const fileUrl = app.file_sk_url || app.sk_url || app.fileSkUrl || app.tte_document_url;
        const link = document.createElement('a');
        link.href = fileUrl;
        const rawNum = app.pkkpr_doc_number || app.sk_pkkpr_num || app.id || 'BERKAS';
        link.download = `SK_PKKPR_${String(rawNum).replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        Swal.fire({
          icon: "success",
          title: "File SK PKKPR Berhasil Diunduh!",
          text: `Dokumen Surat Keputusan Persetujuan PKKPR No. ${app.pkkpr_doc_number || app.sk_pkkpr_num || app.id} berhasil diunduh ke perangkat Anda.`,
          confirmButtonColor: "#10b981",
          timer: 3000
        });
        return;
      }

      // Generate client-side official high-res PDF with Kop Surat Pemkab Luwu, TTE BSrE, & QR Code
      await generateSkPkkprPdf({
        applicationId: String(app.id || 'PKKPR-' + Date.now()),
        applicantName: app.nama_pemohon || app.pemohon_name || app.nama || nama || 'Masyarakat Pemohon',
        companyName: app.nama_perusahaan || app.perusahaan || app.nama_pemohon || 'Perorangan / Mandiri',
        nibNik: app.nik || userNik || app.nib || app.nomor_registrasi || app.nomor_permohonan || '7317000000000001',
        sector: app.sektor || app.sektor_kegiatan || 'Non-Berusaha / Mandiri',
        districtName: app.kecamatan || app.kecamatan_name || 'Kecamatan Luwu',
        villageName: app.desa || app.desa_name || 'Desa Luwu',
        areaHa: Number(app.luas_ha || ((app.luas_m2 || 0) / 10000) || 0.1),
        investmentValue: Number(app.nilai_investasi || 0),
        skPkkprDocNumber: app.pkkpr_doc_number || app.sk_pkkpr_num || `503/SK-PKKPR/DPMPTSP-LW/2026/${String(app.id || '001').slice(-4)}`,
        pertanianBaNumber: app.pertanian_ba_num || app.berita_acara_pertanian_num,
        puptrPertekNumber: app.pertek_puptr_num || app.puptr_pertek_num,
        issueDate: app.updated_at ? new Date(app.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : undefined
      });

      Swal.fire({
        icon: "success",
        title: "File SK PKKPR Berhasil Diunduh!",
        text: `Dokumen resmi Surat Keputusan Persetujuan PKKPR (PDF) berhasil di-generate dan disimpan ke perangkat Anda.`,
        confirmButtonColor: "#10b981",
        timer: 3500
      });
    } catch (err) {
      console.error("Gagal mengunduh SK PKKPR:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal Mengunduh Dokumen",
        text: "Terjadi kendala saat merender berkas PDF SK PKKPR. Silakan coba kembali.",
        confirmButtonColor: "#ef4444"
      });
    } finally {
      setIsDownloadingSkId(null);
    }
  };

  const [kecamatanList, setKecamatanList] = useState<any[]>([]);
  const [desaList, setDesaList] = useState<any[]>([]);
  const [loadingKecamatan, setLoadingKecamatan] = useState(true);
  const [loadingDesa, setLoadingDesa] = useState(false);
  const [selectedKecamatanId, setSelectedKecamatanId] = useState("");
  const [selectedKecamatanPolygon, setSelectedKecamatanPolygon] = useState<any>(null);

  useEffect(() => {
    const fetchKecamatan = async () => {
      setLoadingKecamatan(true);
      try {
        const data = await safeFetchLayerData('gis_kecamatan');
        if (data) {
          const dataArray = (data && data.type === 'FeatureCollection') ? data.features : (Array.isArray(data) ? data : []);
          const processedData = dataArray.map((f: any) => {
            const p = f.properties || f;
            const rawKec = p.kecamatan || p.KECAMATAN || p.nama_kecamatan || p.name || "";
            const cleanKec = String(rawKec).replace(/^kec\.?\s*/i, "").replace(/^kecamatan\s*/i, "").trim();
            const kId = String(p.id !== undefined && p.id !== null ? p.id : (p.id_kecamatan || p.ID_KEC || p.districtId || cleanKec));
            return {
              ...p,
              id: kId,
              name: cleanKec,
              kecamatan: cleanKec,
              nama_kecamatan: cleanKec,
              geom: f.geometry || f.geom,
              geojson: f.geometry || f.geom || f
            };
          });
          const sorted = [...processedData].sort((a: any, b: any) => {
            const nameA = a.kecamatan || a.nama_kecamatan || a.name || "";
            const nameB = b.kecamatan || b.nama_kecamatan || b.name || "";
            return nameA.localeCompare(nameB);
          });
          setKecamatanList(sorted);
          setLoadingKecamatan(false);
          return;
        }
      } catch {
        // Safe static fallback
      }

      // Safe static local JSON file fallback
      try {
        const res = await fetch('/gis_kecamatan.json', { credentials: 'same-origin' });
        if (res.ok) {
          const type = res.headers.get('content-type');
          if (type && !type.includes('application/json')) throw new Error('Not JSON');
          const staticData = await res.json();
          const features = staticData.features || [];
          const processed = features.map((f: any) => {
            const p = f.properties || f;
            const rawKec = p.kecamatan || p.KECAMATAN || p.nama_kecamatan || p.name || "";
            const cleanKec = String(rawKec).replace(/^kec\.?\s*/i, "").replace(/^kecamatan\s*/i, "").trim();
            const kId = String(p.id !== undefined && p.id !== null ? p.id : (p.id_kecamatan || p.ID_KEC || p.districtId || p.OBJECTID || f.id || cleanKec));
            return {
              ...p,
              id: kId,
              name: cleanKec,
              kecamatan: cleanKec,
              nama_kecamatan: cleanKec,
              geom: f.geometry,
              geojson: f.geometry
            };
          });
          const sorted = [...processed].sort((a: any, b: any) => {
            const nameA = a.kecamatan || a.nama_kecamatan || a.name || "";
            const nameB = b.kecamatan || b.nama_kecamatan || b.name || "";
            return nameA.localeCompare(nameB);
          });
          setKecamatanList(sorted);
        }
      } catch {
        // Quiet catch
      } finally {
        setLoadingKecamatan(false);
      }
    };
    fetchKecamatan();
  }, []);

  useEffect(() => {
    if (!selectedKecamatanId) {
      setDesaList([]);
      return;
    }
    const fetchDesa = async () => {
      setLoadingDesa(true);
      try {
        const selKecObj = kecamatanList.find(k => String(k.id) === String(selectedKecamatanId) || (k.name || "").toLowerCase() === String(selectedKecamatanId).toLowerCase());
        const selKecName = (selKecObj?.name || selKecObj?.kecamatan || "").replace(/^kec\.?\s*/i, "").replace(/^kecamatan\s*/i, "").trim().toLowerCase();

        const data = await safeFetchLayerData('gis_desa');
        if (data) {
          const dataArray = (data && data.type === 'FeatureCollection') ? data.features : (Array.isArray(data) ? data : []);
          const processedData = dataArray.map((f: any) => {
            const p = f.properties || f;
            const vName = p.nama_desa || p.Nama_Desa || p.DESA || p.desa || p.name || p.NAME || "";
            const kId = String(p.id_kecamatan !== undefined && p.id_kecamatan !== null ? p.id_kecamatan : (p.districtId || p.district_id || p.kecamatan_id || ""));
            const kName = p.kecamatan || p.KECAMATAN || p.districtName || "";
            return {
              ...p,
              id: String(p.id || p.ID_DESA || f.id || vName),
              name: vName,
              desa: vName,
              nama_desa: vName,
              districtId: kId,
              id_kecamatan: kId,
              districtName: kName,
              geom: f.geometry || f.geom,
              geojson: f.geometry || f.geom || f
            };
          });
          const filtered = processedData.filter((v: any) => {
            const vKecId = String(v.id_kecamatan || v.districtId || "");
            const vKecName = String(v.districtName || v.kecamatan || "");
            return (
              (selectedKecamatanId && vKecId === String(selectedKecamatanId)) ||
              (selKecObj && vKecId === String(selKecObj.id)) ||
              (selectedKecamatanId && isSameDistrict(vKecName, selectedKecamatanId)) ||
              (selKecObj && isSameDistrict(vKecName, selKecObj.name || selKecObj.kecamatan))
            );
          });
          filtered.sort((a: any, b: any) => {
            const nameA = a.desa || a.nama_desa || a.name || "";
            const nameB = b.desa || b.nama_desa || b.name || "";
            return nameA.localeCompare(nameB);
          });
          setDesaList(filtered);
          setLoadingDesa(false);
          return;
        }
      } catch (err) {
        console.warn("Direct Supabase RPC for villages failed, trying static fallback", err);
      }

      // Safe static local JSON file fallback
      try {
        const res = await fetch('/gis_desa.json', { credentials: 'same-origin' });
        if (res.ok) {
          const type = res.headers.get('content-type');
          if (type && !type.includes('application/json')) throw new Error('Not JSON');
          const staticData = await res.json();
          const features = staticData.features || [];
          const selKecObj = kecamatanList.find(k => String(k.id) === String(selectedKecamatanId) || isSameDistrict(k.name, selectedKecamatanId));
          const selKecName = selKecObj?.name || selKecObj?.kecamatan || selectedKecamatanId || "";

          const processed = features.map((f: any) => {
            const p = f.properties || f;
            const vName = p.DESA || p.desa || p.nama_desa || p.name || p.NAME || "";
            const kId = String(p.id_kecamatan !== undefined && p.id_kecamatan !== null ? p.id_kecamatan : (p.KECAMATAN_ID || p.district_id || p.districtId || ""));
            const kName = p.KECAMATAN || p.kecamatan || p.districtName || "";
            return {
              ...p,
              id: String(p.id || p.ID_DESA || f.id || vName),
              districtId: kId,
              id_kecamatan: kId,
              districtName: kName,
              name: vName,
              desa: vName,
              nama_desa: vName,
              geom: f.geometry,
              geojson: f.geometry
            };
          });
          const filtered = processed.filter((v: any) => {
            const vKecId = String(v.id_kecamatan || v.districtId || "");
            const vKecName = String(v.districtName || v.kecamatan || v.KECAMATAN || "");
            return (
              (selectedKecamatanId && vKecId === String(selectedKecamatanId)) ||
              (selKecObj && vKecId === String(selKecObj.id)) ||
              (selKecName && isSameDistrict(vKecName, selKecName))
            );
          });
          filtered.sort((a: any, b: any) => {
            const nameA = a.desa || a.nama_desa || a.name || "";
            const nameB = b.desa || b.nama_desa || b.name || "";
            return nameA.localeCompare(nameB);
          });
          setDesaList(filtered);
        }
      } catch (e) {
        console.error("Gagal memuat desa dari fallback statis", e);
      } finally {
        setLoadingDesa(false);
      }
    };
    fetchDesa();
  }, [selectedKecamatanId, kecamatanList]);

  useEffect(() => {
    if (kecamatanList.length > 0 && kecamatan && !selectedKecamatanId) {
      const match = kecamatanList.find(k => 
         String(k.id) === String(kecamatan) || 
         (k.kecamatan || k.nama_kecamatan || k.name || "").toLowerCase() === String(kecamatan).toLowerCase()
      );
      if (match) {
         setSelectedKecamatanId(match.id);
         let finalGeom = match.geojson || match.geom || match.geometry || null; if(typeof finalGeom === "string") { try { finalGeom = JSON.parse(finalGeom); } catch(e){} } setSelectedKecamatanPolygon(finalGeom);
         const actualName = match.kecamatan || match.nama_kecamatan || match.name;
         if (actualName && kecamatan !== actualName) {
           setKecamatan(actualName);
         }
      }
    }
  }, [kecamatanList, kecamatan, selectedKecamatanId]);

  useEffect(() => {
    if (desaList.length > 0 && desa) {
      const match = desaList.find(d => String(d.id) === String(desa));
      if (match) {
        const actualName = match.desa || match.nama_desa || match.name;
        if (actualName && desa !== actualName) {
          setDesa(actualName);
        }
      }
    }
  }, [desaList, desa]);

  useEffect(() => {
    if (!coords && (kecamatan || activeProfile?.kecamatan || lokasi)) {
      const targetText = (kecamatan || activeProfile?.kecamatan || lokasi || "").replace(/^kec\.?\s*/i, "").replace(/^kecamatan\s*/i, "").trim();
      let fallLat = -3.333;
      let fallLng = 120.355;
      for (const key of Object.keys(KECAMATAN_COORDINATES)) {
        if (targetText.toLowerCase() === key.toLowerCase()) {
          fallLat = KECAMATAN_COORDINATES[key].lat;
          fallLng = KECAMATAN_COORDINATES[key].lng;
          break;
        }
      }
      setCoords({ lat: fallLat, lng: fallLng });
    }
  }, [kecamatan, activeProfile?.kecamatan, lokasi]);


  // Aduan category options
  const PENYELENGGARA_ADUAN_OPTIONS = [
    "Penundaan berlarut",
    "Penyimpangan prosedur",
    "Ada permintaan Imbalan",
    "Penyalahgunaan wewenang",
    "Tindakan diskriminatif",
  ];

  const INVESTOR_ADUAN_OPTIONS = [
    "Pencemaran dan Kerusakan Lingkungan",
    "Pelanggaran Hak Sosial dan Ketenagakerjaan",
    "Legalitas dan Perizinan Usaha",
    "Gangguan Ketertiban Umum",
  ];

  // Options for PermenPANRB No. 62/2018 Classifications
  const ASPIRASI_TOPIK_OPTIONS = [
    "Peningkatan Kualitas Pelayanan MPP Simpurusiang",
    "Kemudahan Berusaha & Insentif Investasi Daerah",
    "Penataan Ruang, RTRW, & Konservasi Lingkungan",
    "Pembangunan Infrastruktur & Fasilitas Publik",
    "Lain-lain / Usulan Inovasi Pelayanan",
  ];

  const INFORMASI_KATEGORI_OPTIONS = [
    "Persyaratan & Alur Perizinan Usaha (OSS-RBA)",
    "Pola Ruang & Kesesuaian Tata Ruang (RTRW / KKPR)",
    "Prosedur, Potensi & Insentif Investasi Luwu",
    "Jadwal & Standar Layanan MPP Simpurusiang",
    "Persyaratan Sertifikasi Halal & Standar Teknis",
  ];

  const [targetAduan, setTargetAduan] = useState<string>("Penyelenggara Perizinan (DPMPTSP Kab. Luwu)");
  const [jenisAduan, setJenisAduan] = useState<string>("Penundaan berlarut");
  const [unitMpp, setUnitMpp] = useState<string>("");
  const [tipeLaporan, setTipeLaporan] = useState<"Pengaduan" | "Aspirasi" | "Permintaan Informasi">("Pengaduan");

  const handleSelectTipeLaporan = (tipe: "Pengaduan" | "Aspirasi" | "Permintaan Informasi") => {
    setTipeLaporan(tipe);
    if (tipe === "Pengaduan") {
      setTargetAduan("Penyelenggara Perizinan (DPMPTSP Kab. Luwu)");
      setJenisAduan(PENYELENGGARA_ADUAN_OPTIONS[0]);
    } else if (tipe === "Aspirasi") {
      setTargetAduan("Aspirasi / Masukan Pembangunan");
      setJenisAduan(ASPIRASI_TOPIK_OPTIONS[0]);
    } else if (tipe === "Permintaan Informasi") {
      setTargetAduan("Layanan Informasi Publik DPMPTSP");
      setJenisAduan(INFORMASI_KATEGORI_OPTIONS[0]);
    }
  };

  // Top-Level Primary Navigation: PKKPR vs Kanal Pengaduan vs Survey SKM vs Testimoni Pengguna
  const [mainArea, setMainArea] = useState<"pkkpr" | "pengaduan" | "survey_skm" | "testimoni">(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const tab = p.get("tab") || p.get("menu");
      if (tab === "survey_skm" || tab === "skm" || tab === "survey") return "survey_skm";
      if (tab === "pengaduan" || tab === "lapor" || tab === "aduan") return "pengaduan";
      if (tab === "testimoni" || tab === "ulasan") return "testimoni";
      if (tab === "pkkpr") return "pkkpr";
    }
    return "pkkpr";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const syncFromUrl = () => {
        const p = new URLSearchParams(window.location.search);
        const tab = p.get("tab") || p.get("menu");
        if (tab === "survey_skm" || tab === "skm" || tab === "survey") setMainArea("survey_skm");
        else if (tab === "pengaduan" || tab === "lapor" || tab === "aduan") setMainArea("pengaduan");
        else if (tab === "testimoni" || tab === "ulasan") setMainArea("testimoni");
        else if (tab === "pkkpr") setMainArea("pkkpr");
      };
      syncFromUrl();
      window.addEventListener("popstate", syncFromUrl);
      return () => window.removeEventListener("popstate", syncFromUrl);
    }
  }, []);

  // Spatial PKKPR Permitting Modal & Form States
  const [isPkkprModalOpen, setIsPkkprModalOpen] = useState(false);
  const [pkkprCategory, setPkkprCategory] = useState<"Berusaha" | "Non-Berusaha">("Berusaha");
  const [pkkprTitle, setPkkprTitle] = useState("");
  const [pkkprNib, setPkkprNib] = useState("");
  const [pkkprPerusahaan, setPkkprPerusahaan] = useState("");
  const [pkkprKecamatan, setPkkprKecamatan] = useState("");
  const [pkkprDesa, setPkkprDesa] = useState("");
  const [pkkprLuasM2, setPkkprLuasM2] = useState<number>(0);
  const [pkkprGeometry, setPkkprGeometry] = useState<any>(null);
  const [pkkprEsgAnalysis, setPkkprEsgAnalysis] = useState<any>(null);
  const [isSubmittingPkkpr, setIsSubmittingPkkpr] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Extended Form States for Berusaha vs Non-Berusaha
  const [pkkprJenisPengajuan, setPkkprJenisPengajuan] = useState("Rumah Tinggal / Hunian Perorangan");
  const [pkkprFungsiBangunan, setPkkprFungsiBangunan] = useState("Pembangunan Rumah Pribadi/Keluarga");
  const [pkkprNamaLembaga, setPkkprNamaLembaga] = useState("");
  const [pkkprLuasBangunan, setPkkprLuasBangunan] = useState<number | string>(480);
  const [pkkprBuktiTanahJenis, setPkkprBuktiTanahJenis] = useState("Sertipikat Hak Milik (SHM)");
  const [pkkprBuktiTanahNomor, setPkkprBuktiTanahNomor] = useState("00214/Latimojong");
  const [pkkprKbli, setPkkprKbli] = useState("10732");

  const pkkprKategoriPengajuan = getKategoriPengajuan(pkkprJenisPengajuan);

  // BAP Document Preview Modal State
  const [isBapDocumentModalOpen, setIsBapDocumentModalOpen] = useState(false);
  const [selectedBapPreviewApp, setSelectedBapPreviewApp] = useState<any>(null);
  const [isPertanianBapModalOpen, setIsPertanianBapModalOpen] = useState(false);
  const [selectedPertanianBapApp, setSelectedPertanianBapApp] = useState<any>(null);

  // Conditional BAP Rejection Modal State
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [selectedRejectionApp, setSelectedRejectionApp] = useState<any>(null);

  // Document Upload States (Sertifikat, Siteplan, Surat Pengantar Desa, Surat Bebas Sengketa)
  const [fileSertifikat, setFileSertifikat] = useState<File | null>(null);
  const [sertifikatDataUrl, setSertifikatDataUrl] = useState<string | null>(null);
  const [sertifikatFileName, setSertifikatFileName] = useState("");

  const [fileSiteplan, setFileSiteplan] = useState<File | null>(null);
  const [siteplanDataUrl, setSiteplanDataUrl] = useState<string | null>(null);
  const [siteplanFileName, setSiteplanFileName] = useState("");

  const [fileSuratPengantarDesa, setFileSuratPengantarDesa] = useState<File | null>(null);
  const [suratPengantarDataUrl, setSuratPengantarDataUrl] = useState<string | null>(null);
  const [suratPengantarFileName, setSuratPengantarFileName] = useState("");

  const [fileSuratBebasSengketa, setFileSuratBebasSengketa] = useState<File | null>(null);
  const [suratBebasSengketaDataUrl, setSuratBebasSengketaDataUrl] = useState<string | null>(null);
  const [suratBebasSengketaFileName, setSuratBebasSengketaFileName] = useState("");

  const [mergedPdfResult, setMergedPdfResult] = useState<{ dataUrl: string; blob: Blob } | null>(null);
  const [isMergingPdf, setIsMergingPdf] = useState(false);

  const sertifikatInputRef = useRef<HTMLInputElement>(null);
  const siteplanInputRef = useRef<HTMLInputElement>(null);
  const suratPengantarInputRef = useRef<HTMLInputElement>(null);
  const suratBebasSengketaInputRef = useRef<HTMLInputElement>(null);

  // Cascading Desa & Polygon Focus States
  const [pkkprDesaList, setPkkprDesaList] = useState<any[]>([]);
  const [loadingPkkprDesa, setLoadingPkkprDesa] = useState(false);
  const [pkkprSelectedKecId, setPkkprSelectedKecId] = useState("");
  const [pkkprSelectedDesaId, setPkkprSelectedDesaId] = useState("");
  const [pkkprSelectedDesaGeom, setPkkprSelectedDesaGeom] = useState<any>(null);

  const villageBbox = useMemo(() => {
    if (pkkprSelectedDesaGeom) {
      try {
        const feat = pkkprSelectedDesaGeom.type === 'Feature'
          ? pkkprSelectedDesaGeom
          : turfFeature(pkkprSelectedDesaGeom.geometry || pkkprSelectedDesaGeom.geom || pkkprSelectedDesaGeom);
        const box = turfBbox(feat);
        if (box && box.length === 4 && !box.some(isNaN) && box[0] >= 118 && box[2] <= 122 && box[1] >= -5 && box[3] <= -1) {
          return box as [number, number, number, number];
        }
      } catch (e) {}
    }
    return undefined;
  }, [pkkprSelectedDesaGeom]);

  const villageCoords = useMemo(() => {
    if (pkkprSelectedDesaGeom) {
      try {
        const feat = pkkprSelectedDesaGeom.type === 'Feature'
          ? pkkprSelectedDesaGeom
          : turfFeature(pkkprSelectedDesaGeom.geometry || pkkprSelectedDesaGeom.geom || pkkprSelectedDesaGeom);
        const centerPt = turfCenter(feat);
        if (centerPt && centerPt.geometry && centerPt.geometry.coordinates) {
          const [lng, lat] = centerPt.geometry.coordinates;
          if (typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat) && lng >= 118 && lng <= 122 && lat >= -5 && lat <= -1) {
            return [lng, lat] as [number, number];
          }
        }
      } catch (e) {
        console.warn("Gagal menghitung villageCoords:", e);
      }
    }
    return undefined;
  }, [pkkprSelectedDesaGeom]);

  const districtBbox = useMemo(() => {
    if (pkkprKecamatan) {
      const matchKec = kecamatanList.find((k) => isSameDistrict(k.name || k.kecamatan || k.nama_kecamatan || "", pkkprKecamatan)) ||
                       districts?.find((d) => isSameDistrict(d.name || "", pkkprKecamatan));
      if (matchKec && (matchKec.geom || matchKec.geometry || matchKec.geojson)) {
        try {
          const g = matchKec.geom || matchKec.geometry || matchKec.geojson;
          const feat = g.type === 'Feature' ? g : turfFeature(g.geometry || g);
          const box = turfBbox(feat);
          if (box && box.length === 4 && !box.some(isNaN) && box[0] >= 118 && box[2] <= 122 && box[1] >= -5 && box[3] <= -1) {
            return box as [number, number, number, number];
          }
        } catch (e) {}
      }
    }
    return undefined;
  }, [pkkprKecamatan, kecamatanList, districts]);

  const districtCoords = useMemo(() => {
    if (pkkprKecamatan) {
      const matchKec = kecamatanList.find((k) => isSameDistrict(k.name || k.kecamatan || k.nama_kecamatan || "", pkkprKecamatan)) ||
                       districts?.find((d) => isSameDistrict(d.name || "", pkkprKecamatan));
      if (matchKec && (matchKec.geom || matchKec.geometry || matchKec.geojson)) {
        try {
          const g = matchKec.geom || matchKec.geometry || matchKec.geojson;
          const feat = g.type === 'Feature' ? g : turfFeature(g.geometry || g);
          const centerPt = turfCenter(feat);
          if (centerPt && centerPt.geometry && centerPt.geometry.coordinates) {
            const [lng, lat] = centerPt.geometry.coordinates;
            if (typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat) && lng >= 118 && lng <= 122 && lat >= -5 && lat <= -1) {
              return [lng, lat] as [number, number];
            }
          }
        } catch (e) {
          console.warn("Gagal menghitung districtCoords:", e);
        }
      }
    }
    return undefined;
  }, [pkkprKecamatan, kecamatanList, districts]);

  const drawerFocusTarget = useMemo(() => ({
    districtName: pkkprKecamatan,
    districtId: pkkprSelectedKecId,
    districtCoords,
    districtBbox,
    villageName: pkkprDesa,
    villageId: pkkprSelectedDesaId,
    villageCoords,
    villageBbox,
    villageGeojson: pkkprSelectedDesaGeom
  }), [pkkprKecamatan, pkkprSelectedKecId, districtCoords, districtBbox, pkkprDesa, pkkprSelectedDesaId, villageCoords, villageBbox, pkkprSelectedDesaGeom]);

  // Spatial Read-Only Lock State for KML/KMZ Auto-Detection
  const [isPkkprLocationLocked, setIsPkkprLocationLocked] = useState(false);
  const [pkkprSpatialOverlapInfo, setPkkprSpatialOverlapInfo] = useState<{
    topMatch?: SpatialOverlapResult;
    overlapPercentage?: number;
    message?: string;
    multiOverlapList?: SpatialOverlapResult[];
    isOutOfLuwu?: boolean;
    source?: string;
  } | null>(null);

  // Auto-detect Kecamatan & Desa whenever spatial geometry is uploaded or digitized
  useEffect(() => {
    if (!pkkprGeometry) return;
    const runSpatialDetection = async () => {
      try {
        const detection = await detectAdministrativeLocation(pkkprGeometry, kecamatanList, districts);
        if (detection.success && detection.kecamatanName) {
          setPkkprKecamatan(detection.kecamatanName);
          if (detection.desaName) {
            setPkkprDesa(detection.desaName);
          }
          setIsPkkprLocationLocked(true);
          setPkkprSpatialOverlapInfo({
            topMatch: {
              nama_kecamatan: detection.kecamatanName,
              nama_desa: detection.desaName,
              persentase_overlap: detection.overlapPercentage || 100
            },
            overlapPercentage: detection.overlapPercentage || 100,
            message: detection.message,
            multiOverlapList: detection.multiOverlapList || [],
            source: detection.source
          });
        } else if (!detection.success && detection.source === 'postgis_rpc') {
          setPkkprSpatialOverlapInfo({
            isOutOfLuwu: true,
            message: detection.message,
            overlapPercentage: 0,
            multiOverlapList: []
          });
        }
      } catch (err) {
        console.warn("Gagal deteksi lokasi spasial otomatis:", err);
      }
    };
    runSpatialDetection();
  }, [pkkprGeometry, kecamatanList, districts]);

  // Dual-Mode Spatial Geometry Input States (Manual vs KMZ Upload)
  const [spatialInputMode, setSpatialInputMode] = useState<"manual" | "kmz">("manual");
  const [isParsingKmz, setIsParsingKmz] = useState(false);
  const [pkkprKmzFileInfo, setPkkprKmzFileInfo] = useState<{
    fileName: string;
    totalAreaHa: number;
    placemarkCount: number;
  } | null>(null);
  const kmzFileInputRef = React.useRef<HTMLInputElement>(null);

  // Auto-Hydrated Profile Cache from Supabase
  const [hydratedProfile, setHydratedProfile] = useState<{
    nama: string;
    nik: string;
    nib: string;
    perusahaan: string;
    kecamatan?: string;
    desa?: string;
    no_whatsapp?: string;
  }>({
    nama: "",
    nik: "",
    nib: "",
    perusahaan: "",
    kecamatan: "",
    desa: "",
    no_whatsapp: ""
  });

  const [pkkprNamaPemohon, setPkkprNamaPemohon] = useState("");
  const [pkkprNikPemohon, setPkkprNikPemohon] = useState("");

  // ─── AUTHENTICATION STATE & SESSION HYDRATION ───
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [authCheckError, setAuthCheckError] = useState<any>(null);
  const [profileFetchError, setProfileFetchError] = useState<string | null>(null);
  const [isServerError, setIsServerError] = useState<boolean>(false);

  // Helper to extract active citizen NIK from storage or profile props
  const getActiveCitizenNik = useCallback(() => {
    if (activeProfile?.nik && /^\d{16}$/.test(String(activeProfile.nik))) {
      return String(activeProfile.nik);
    }
    if (typeof window !== "undefined") {
      const candidates = [
        localStorage.getItem("mpp_verified_nik"),
        localStorage.getItem("luwu_user_nik"),
        sessionStorage.getItem("mpp_verified_nik"),
        sessionStorage.getItem("luwu_user_nik")
      ];
      for (const c of candidates) {
        if (c && /^\d{16}$/.test(c)) return c;
      }
    }
    return "";
  }, [activeProfile?.nik]);

  // Initialize and verify authentication state gracefully on mount (Anti Ghost-Session)
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data: { user }, error: userErr } = await supabase.auth.getUser();
        
        if (userErr || !user) {
          if (isMounted) {
            setCurrentUser(null);
            setIsAuthLoading(false);
            navigate('/login', { replace: true });
          }
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();

        if (isMounted) {
          setCurrentUser(user);
          setCurrentSession(session);
          setIsAuthLoading(false);
        }
      } catch (err) {
        console.warn("[MasyarakatDashboard] Auth check error:", err);
        if (isMounted) {
          setAuthCheckError(err);
          setIsAuthLoading(false);
          navigate('/login', { replace: true });
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isMounted) {
        if (session?.user) {
          setCurrentUser(session.user);
          setCurrentSession(session);
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setCurrentSession(null);
          navigate('/login', { replace: true });
        }
        setIsAuthLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Safe navigation guard: check active user state instead of forcing localStorage
  useEffect(() => {
    if (isAuthLoading) return;

    if (!currentUser) {
      navigate('/login', { replace: true });
    }
  }, [isAuthLoading, currentUser, navigate]);

  // Hydrate user profile directly from Supabase session & public.profiles table (Decoupled from Auth Kickout)
  const fetchAndHydrateMasyarakatProfile = async () => {
    try {
      setProfileFetchError(null);
      let user = currentUser;
      if (!user) {
        const { data: userData } = await supabase.auth.getUser();
        user = userData?.user || null;
      }

      if (!user) {
        return null;
      }

      let prof: any = null;
      const effectiveEmail = user.email || "";
      const effectiveId = user.id;
      const isValidUuid = (id?: string) => Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

      // Step 1: Query public.profiles strictly by valid UUID user.id (decoupled error handling)
      if (isValidUuid(effectiveId)) {
        try {
          const { data: profileData, error: pErr } = await supabase
            .from("profiles")
            .select("id, email, full_name, company_name, role, nik, kecamatan, desa, phone_number")
            .eq("id", effectiveId)
            .maybeSingle();

          if (pErr) {
            console.warn("[MasyarakatDashboard] Non-fatal error querying profiles by ID:", pErr.message);
          } else if (profileData && !isAdministrativeTitle(profileData.full_name)) {
            prof = profileData;
          }
        } catch (e) {
          console.warn("[MasyarakatDashboard] Non-fatal catch querying profiles by ID:", e);
        }
      }

      // Step 2: Query by email if not resolved
      if (!prof && effectiveEmail) {
        try {
          const { data: profileByEmail, error: emErr } = await supabase
            .from("profiles")
            .select("id, email, full_name, company_name, role, nik, kecamatan, desa, phone_number")
            .eq("email", effectiveEmail)
            .maybeSingle();

          if (emErr) {
            console.warn("[MasyarakatDashboard] Non-fatal error querying profiles by email:", emErr.message);
          } else if (profileByEmail && !isAdministrativeTitle(profileByEmail.full_name)) {
            prof = profileByEmail;
          }
        } catch (e) {
          console.warn("[MasyarakatDashboard] Non-fatal catch querying profiles by email:", e);
        }
      }

      const meta = user.user_metadata || {};

      // Step 3: Check mpp_citizens if NIK is in metadata or profile
      const candidateNik = prof?.nik || meta.nik || meta.no_ktp || "";
      if (candidateNik && /^\d{16}$/.test(candidateNik)) {
        try {
          const { data: citizenData } = await supabase
            .from("mpp_citizens")
            .select("nik, full_name, phone_number, gender, jenis_kelamin, occupation, pekerjaan, address")
            .eq("nik", candidateNik)
            .maybeSingle();

          if (citizenData && citizenData.full_name) {
            prof = {
              ...(prof || {}),
              id: prof?.id || effectiveId,
              nik: citizenData.nik,
              full_name: prof?.full_name || citizenData.full_name,
              role: prof?.role || "masyarakat",
              kecamatan: prof?.kecamatan || (citizenData as any).kecamatan,
              desa: prof?.desa || (citizenData as any).desa,
              phone_number: citizenData.phone_number || prof?.phone_number,
              phone: citizenData.phone_number || prof?.phone_number,
              no_whatsapp: citizenData.phone_number || prof?.phone_number,
              address: citizenData.address
            };
          }
        } catch (e) {}
      }

      const userRole = prof?.role || meta.role || activeProfile?.role;
      if (userRole === 'investor') {
        if (typeof window !== "undefined") {
          window.location.replace("/investor-dashboard");
        }
        return null;
      }
      if (userRole && (userRole.startsWith('admin_') || userRole === 'superadmin')) {
        if (typeof window !== "undefined") {
          window.location.replace("/dashboard");
        }
        return null;
      }

      // Resolve NIK
      let resolvedNik = prof?.nik || prof?.no_ktp || prof?.no_nik || meta.nik || meta.no_ktp || activeProfile?.nik || activeProfile?.no_ktp || "";
      if (!resolvedNik || !/^\d{16}$/.test(resolvedNik)) {
        const cleanNikFromEmail = (effectiveEmail.includes("@warga.luwukab.go.id") || !effectiveEmail.includes("@"))
          ? effectiveEmail.split("@")[0].trim()
          : "";
        if (/^\d{16}$/.test(cleanNikFromEmail)) {
          resolvedNik = cleanNikFromEmail;
        }
      }

      // Resolve Full Name
      let rawNama = prof?.full_name || prof?.nama || prof?.nama_lengkap || prof?.nama_pemohon || meta.full_name || meta.nama || meta.nama_lengkap || activeProfile?.full_name || activeProfile?.nama || "";
      let resolvedNama = resolveCleanCitizenName(rawNama);

      // Resolve NIB & Company
      let resolvedNib = prof?.nib || prof?.no_nib || prof?.nib_oss || meta.nib || meta.no_nib || activeProfile?.nib || activeProfile?.no_nib || "";
      let resolvedPerusahaan = prof?.company_name || prof?.perusahaan || prof?.nama_perusahaan || prof?.nama_badan_usaha || meta.company_name || meta.perusahaan || meta.nama_perusahaan || activeProfile?.company_name || activeProfile?.perusahaan || "";

      // Resolve Location & Contact (Standardized phone_number fallback)
      let rawKec = prof?.kecamatan || meta.kecamatan || activeProfile?.kecamatan || "";
      let resolvedKec = normalizeKecamatanName(rawKec, kecamatanList, districts);
      let resolvedDesa = prof?.desa || meta.desa || activeProfile?.desa || "";
      let resolvedWa = prof?.phone_number || prof?.phone || prof?.no_whatsapp || prof?.no_hp || meta.phone_number || meta.phone || meta.no_whatsapp || activeProfile?.phone_number || activeProfile?.phone || activeProfile?.no_whatsapp || "";

      const updated = {
        nama: resolvedNama,
        nik: /^\d{16}$/.test(resolvedNik) ? resolvedNik : "",
        nib: resolvedNib,
        perusahaan: resolvedPerusahaan,
        kecamatan: resolvedKec,
        desa: resolvedDesa,
        no_whatsapp: resolvedWa
      };

      setHydratedProfile(updated);

      if (resolvedNama) {
        setNama(resolvedNama);
        setPkkprNamaPemohon(resolvedNama);
      }
      if (resolvedNik && /^\d{16}$/.test(resolvedNik)) {
        setUserNik(resolvedNik);
        setPkkprNikPemohon(resolvedNik);
      }
      if (resolvedNib) setPkkprNib(resolvedNib);
      if (resolvedPerusahaan) setPkkprPerusahaan(resolvedPerusahaan);
      if (resolvedKec) {
        setKecamatan(resolvedKec);
        setPkkprKecamatan(resolvedKec);
      }
      if (resolvedDesa) {
        setDesa(resolvedDesa);
        setPkkprDesa(resolvedDesa);
      }
      if (resolvedWa) {
        setKontak(resolvedWa);
      }

      return updated;
    } catch (err) {
      console.warn("Gagal auto-hydrate profil masyarakat:", err);
    }
    return null;
  };

  const hasHydratedRef = React.useRef(false);
  useEffect(() => {
    if (isAuthLoading || !currentUser) return;
    if (hasHydratedRef.current && hydratedProfile) return;
    fetchAndHydrateMasyarakatProfile().then(() => {
      hasHydratedRef.current = true;
    });
  }, [isAuthLoading, currentUser?.id, activeProfile?.email, activeProfile?.nik, kecamatanList?.length, districts?.length]);

  // Cascading Relational Dropdown: Fetch villages from gis_desa based on chosen Kecamatan
  useEffect(() => {
    if (!pkkprKecamatan) {
      setPkkprDesaList([]);
      setPkkprSelectedKecId("");
      return;
    }

    const cleanKecTarget = String(pkkprKecamatan).replace(/^kec\.?\s*/i, "").replace(/^kecamatan\s*/i, "").trim().toLowerCase();

    // Match Kecamatan ID and object from kecamatanList or districts
    const matchKec = kecamatanList.find((k) => {
      const kName = k.name || k.kecamatan || k.nama_kecamatan || "";
      return String(k.id) === String(pkkprKecamatan) || isSameDistrict(kName, pkkprKecamatan);
    }) || districts?.find((d) => {
      const dName = d.name || "";
      return String(d.id) === String(pkkprKecamatan) || isSameDistrict(dName, pkkprKecamatan);
    });

    const kecId = matchKec?.id !== undefined && matchKec?.id !== null ? String(matchKec.id) : String(pkkprKecamatan);
    setPkkprSelectedKecId(kecId);

    const fetchDesaForPkkpr = async () => {
      setLoadingPkkprDesa(true);
      try {
        let loadedVillages: any[] = [];

        // 1. Query gis_desa table (PostGIS)
        try {
          const data = await safeFetchLayerData('gis_desa');
          if (data) {
            const dataArray = (data && data.type === 'FeatureCollection') ? data.features : (Array.isArray(data) ? data : []);
            const processedData = dataArray.map((f: any) => {
              const props = f.properties || f;
              const vName = props.nama_desa || props.Nama_Desa || props.DESA || props.desa || props.name || props.NAME || "";
              const kName = props.kecamatan || props.KECAMATAN || props.districtName || "";
              const kId = String(props.id_kecamatan !== undefined && props.id_kecamatan !== null ? props.id_kecamatan : (props.districtId || props.district_id || props.kecamatan_id || props.KECAMATAN_ID || ""));
              return {
                ...props,
                id: String(props.id || props.ID_DESA || f.id || vName),
                name: vName,
                desa: vName,
                nama_desa: vName,
                id_kecamatan: kId,
                districtId: kId,
                districtName: kName,
                kecamatan: kName,
                geom: f.geometry || f.geom,
                geojson: f.geometry || f.geom || f
              };
            });

            const dbFiltered = processedData.filter((v: any) => {
              const vKecId = String(v.id_kecamatan || v.districtId || "");
              const vKecName = String(v.districtName || v.kecamatan || v.KECAMATAN || "");
              return (
                (kecId && vKecId === kecId) ||
                isSameDistrict(vKecName, pkkprKecamatan)
              );
            });

            if (dbFiltered.length > 0) {
              loadedVillages = dbFiltered;
            }
          }
        } catch (errDb) {
          console.warn("DB safeFetchLayerData gis_desa error:", errDb);
        }

        // 2. Fallback to static public gis_desa.json
        if (loadedVillages.length === 0) {
          const resStatic = await fetch("/gis_desa.json", { credentials: 'same-origin' });
          if (resStatic.ok) {
            const staticGis = await resStatic.json();
            if (staticGis.features) {
              const matches = staticGis.features.filter((f: any) => {
                const fKecId = String(f.properties?.id_kecamatan !== undefined && f.properties?.id_kecamatan !== null ? f.properties.id_kecamatan : (f.properties?.KECAMATAN_ID || f.properties?.district_id || f.properties?.districtId || ""));
                const kName = String(f.properties?.KECAMATAN || f.properties?.kecamatan || f.properties?.districtName || "");
                return (
                  (kecId && fKecId === kecId) ||
                  isSameDistrict(kName, pkkprKecamatan)
                );
              }).map((f: any) => {
                const props = f.properties || {};
                const vName = props.DESA || props.nama_desa || props.desa || props.name || props.NAME || "";
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
              });
              loadedVillages = matches;
            }
          }
        }

        loadedVillages.sort((a: any, b: any) => (a.name || a.desa || "").localeCompare(b.name || b.desa || ""));
        setPkkprDesaList(loadedVillages);

        // AUTO-MATCH & PRESERVE pkkprDesa if it matches a village in this kecamatan
        if (pkkprDesa && loadedVillages.length > 0) {
          const cleanDesaTarget = String(pkkprDesa).replace(/^desa\s*/i, "").replace(/^kel\.?\s*/i, "").trim().toLowerCase();
          const matchDesa = loadedVillages.find((v: any) => {
            const vClean = String(v.desa || v.name || v.nama_desa || "").replace(/^desa\s*/i, "").replace(/^kel\.?\s*/i, "").trim().toLowerCase();
            return vClean === cleanDesaTarget || String(v.id) === String(pkkprDesa);
          });

          if (matchDesa) {
            const resolvedDesaName = matchDesa.desa || matchDesa.name || matchDesa.nama_desa || pkkprDesa;
            setPkkprDesa(resolvedDesaName);
            setPkkprSelectedDesaId(String(matchDesa.id || matchDesa.name));
            setPkkprSelectedDesaGeom(matchDesa.geom || matchDesa.geojson?.geometry || matchDesa.geojson);
          } else {
            setPkkprDesa("");
            setPkkprSelectedDesaId("");
            setPkkprSelectedDesaGeom(null);
          }
        }
      } catch (e) {
        console.warn("Gagal memuat desa cascading untuk PKKPR:", e);
      } finally {
        setLoadingPkkprDesa(false);
      }
    };

    fetchDesaForPkkpr();
  }, [pkkprKecamatan, kecamatanList, districts]);

  // Update selected desa geometry & ID when pkkprDesa changes
  useEffect(() => {
    if (!pkkprDesa || pkkprDesaList.length === 0) {
      setPkkprSelectedDesaGeom(null);
      setPkkprSelectedDesaId("");
      return;
    }
    const cleanTarget = String(pkkprDesa).replace(/^desa\s*/i, "").replace(/^kel\.?\s*/i, "").trim().toLowerCase();
    const match = pkkprDesaList.find((d) => {
      const dClean = String(d.desa || d.nama_desa || d.name || "").replace(/^desa\s*/i, "").replace(/^kel\.?\s*/i, "").trim().toLowerCase();
      return String(d.id) === String(pkkprDesa) || dClean === cleanTarget;
    });
    if (match) {
      setPkkprSelectedDesaId(String(match.id || match.name || ""));
      setPkkprSelectedDesaGeom(match.geom || match.geometry || match);
    }
  }, [pkkprDesa, pkkprDesaList]);

  // Dual-Mode KMZ Upload Handler
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

      // TASK 2: Direct Supabase PostGIS RPC detect_wilayah_overlap
      let detectedKec = "";
      let detectedDesa = "";
      let overlapPct = 100;
      let multiMatches: SpatialOverlapResult[] = [];
      let isOutOfLuwu = false;

      try {
        const { data, error } = await supabase.rpc('detect_wilayah_overlap', {
          user_geojson: geom // Must be valid GeoJSON geometry JSON object
        });

        if (error) {
          console.error('[Spatial Auto-Detect] Error executing RPC:', error.message);
          // Graceful fallback to client-side detection utility
          const detection = await detectAdministrativeLocation(geom, kecamatanList, districts);
          if (detection.success) {
            detectedKec = detection.kecamatanName;
            detectedDesa = detection.desaName;
            overlapPct = detection.overlapPercentage || 100;
            multiMatches = detection.multiOverlapList || [];
            if (detectedKec) setPkkprKecamatan(detectedKec);
            if (detectedDesa) setPkkprDesa(detectedDesa);
            setIsPkkprLocationLocked(true);
            setPkkprSpatialOverlapInfo({
              topMatch: {
                nama_kecamatan: detectedKec,
                nama_desa: detectedDesa,
                persentase_overlap: overlapPct
              },
              overlapPercentage: overlapPct,
              message: detection.message,
              multiOverlapList: multiMatches,
              source: detection.source
            });
          }
        } else if (Array.isArray(data)) {
          if (data.length === 0) {
            isOutOfLuwu = true;
            setIsPkkprLocationLocked(false);
            setPkkprSpatialOverlapInfo({
              isOutOfLuwu: true,
              message: "Lokasi polygon KML berada di luar cakupan wilayah administrative Kabupaten Luwu.",
              overlapPercentage: 0,
              multiOverlapList: []
            });
            Swal.fire({
              icon: "warning",
              title: "Di Luar Batas Administratif",
              text: "Lokasi polygon KML berada di luar cakupan wilayah administrative Kabupaten Luwu.",
              confirmButtonColor: "#f59e0b"
            });
          } else {
            // Top match with highest percentage overlap
            const topMatch = data[0];
            console.log('[Spatial Auto-Detect] Match found:', topMatch);
            multiMatches = data;

            detectedKec = cleanKecamatanName(topMatch.nama_kecamatan || topMatch.kecamatan || String(topMatch.kecamatan_id || ""));
            detectedDesa = cleanDesaName(topMatch.nama_desa || topMatch.desa || String(topMatch.desa_id || ""));
            overlapPct = Number(topMatch.persentase_overlap !== undefined ? topMatch.persentase_overlap : 100);

            // 1. Auto-fill form fields for Kecamatan & Desa
            if (detectedKec) setPkkprKecamatan(detectedKec);
            if (detectedDesa) setPkkprDesa(detectedDesa);
            setIsPkkprLocationLocked(true);

            // 2. Show UI feedback / badge / toast notification
            let feedbackMsg = `Terdeteksi otomatis di Desa ${detectedDesa}, Kec. ${detectedKec} (Overlap: ${overlapPct.toFixed(1)}%)`;
            if (data.length > 1) {
              const secondaryDesas = data.slice(1).map((d: any) => `${cleanDesaName(d.nama_desa || d.desa)} (${Number(d.persentase_overlap || 0).toFixed(1)}%)`).join(', ');
              console.info(`[Spatial Auto-Detect] Polygon melintasi ${data.length} desa: Utama di Desa ${detectedDesa} (${overlapPct.toFixed(1)}%), sekunder di ${secondaryDesas}`);
              feedbackMsg += `. Melintasi ${data.length} desa (Batas sekunder: ${secondaryDesas})`;
            }

            setPkkprSpatialOverlapInfo({
              topMatch,
              overlapPercentage: overlapPct,
              message: feedbackMsg,
              multiOverlapList: data,
              source: 'postgis_rpc'
            });
          }
        }
      } catch (detErr) {
        console.warn("[Spatial Auto-Detect] Exception during RPC overlap detection:", detErr);
      }

      let areaSqM = 0;
      if (result.totalAreaHa && result.totalAreaHa > 0) {
        areaSqM = Math.round(result.totalAreaHa * 10000);
      } else {
        try {
          const feature = { type: "Feature" as const, properties: {}, geometry: geom };
          areaSqM = Math.round(turfArea(feature as any));
        } catch {
          areaSqM = 1000;
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
            <p><strong>Berkas:</strong> <span class="font-mono text-emerald-600 font-bold">${result.fileName}</span></p>
            <p><strong>Luas Lahan:</strong> <span class="font-mono text-emerald-600 font-bold">${(areaSqM / 10000).toFixed(2)} Ha</span> (${areaSqM.toLocaleString()} m²)</p>
            <p><strong>Fitur Spasial:</strong> ${result.placemarkCount} Poligon Google Earth</p>
            ${detectedKec ? `<p class="pt-1.5 border-t border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">🔒 Lokasi Terkunci: Kec. ${detectedKec}${detectedDesa ? `, Desa ${detectedDesa}` : ''}</p>` : ''}
          </div>
        `,
        confirmButtonColor: "#10b981",
        timer: 3500
      });
    } catch (err: any) {
      console.error("Gagal membaca file KMZ/KML:", err);
      Swal.fire("Gagal Mengekstrak Spasial", err.message || "Gagal memproses file .KMZ/.KML.", "error");
    } finally {
      setIsParsingKmz(false);
      if (e.target) e.target.value = "";
    }
  };

  // User's Submitted PKKPR Applications
  const [myPkkprApplications, setMyPkkprApplications] = useState<any[]>([]);
  const [loadingPkkprApps, setLoadingPkkprApps] = useState(false);

  // Fetch User's PKKPR Applications strictly from Supabase gis_pkkpr (Zero Dummy & RLS Protected)
  const fetchMyPkkprApplications = useCallback(async () => {
    setLoadingPkkprApps(true);
    try {
      const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
      const currentCitizenNik = getActiveCitizenNik() || hydratedProfile.nik || (typeof window !== 'undefined' ? (sessionStorage.getItem('citizen_nik') || localStorage.getItem('citizen_nik') || localStorage.getItem('mpp_verified_nik')) : null);

      if (!user && !currentCitizenNik) {
        setMyPkkprApplications([]);
        return;
      }

      const isUuid = (val: string | null | undefined): boolean => {
        if (!val) return false;
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
      };

      // Query gis_pkkpr strictly for this authenticated citizen or OTP-verified citizen
      let query = supabase.from("gis_pkkpr").select("*");
      
      const filters: string[] = [];
      if (user?.id) {
        filters.push(`user_id.eq.${user.id}`);
        filters.push(`applicant_id.eq.${user.id}`);
      }
      if (currentCitizenNik) {
        filters.push(`nik_pemohon.eq.${currentCitizenNik}`);
        filters.push(`user_id.eq.cit-${currentCitizenNik}`);
        filters.push(`applicant_nik.eq.${currentCitizenNik}`);
        filters.push(`applicant_id.eq.cit-${currentCitizenNik}`);
      }

      if (filters.length > 0) {
        query = query.or(filters.join(","));
      }

      const { data: pkkprRows, error: pkkprErr } = await query.order("created_at", { ascending: false });

      if (pkkprErr) {
        console.warn("Notice querying gis_pkkpr:", pkkprErr);
      }

      const formattedApps = (pkkprRows || []).map((app: any) => ({
        ...app,
        category: app.kategori_pkkpr || (app.nama_badan_usaha ? "Berusaha" : "Non-Berusaha"),
        title: app.judul_kegiatan || app.nama_kegiatan || app.nama_permohonan || app.nama_badan_usaha || "Pengajuan PKKPR",
        status: app.status_pkkpr || "Pending Spatial Check",
        kecamatan: app.kecamatan,
        desa: app.desa_kelurahan || app.desa
      }));

      setMyPkkprApplications(formattedApps);
    } catch (err) {
      console.warn("Error fetching PKKPR apps:", err);
      setMyPkkprApplications([]);
    } finally {
      setLoadingPkkprApps(false);
    }
  }, [getActiveCitizenNik, hydratedProfile.nik]);

  useEffect(() => {
    fetchMyPkkprApplications();

    const channel = supabase
      .channel('masyarakat_pkkpr_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gis_pkkpr' },
        (payload) => {
          console.log('[MasyarakatDashboard] Realtime PKKPR change:', payload.eventType);
          fetchMyPkkprApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMyPkkprApplications]);

  const openSpatialPkkprForm = async (category: "Berusaha" | "Non-Berusaha") => {
    setPkkprCategory(category);
    
    // Auto-Hydrate Profile dynamically from public.profiles
    const freshProf = await fetchAndHydrateMasyarakatProfile();
    const hNib = freshProf?.nib || hydratedProfile.nib || activeProfile?.nib || pkkprNib || "";
    const hPerusahaan = freshProf?.perusahaan || hydratedProfile.perusahaan || activeProfile?.perusahaan || pkkprPerusahaan || "";
    const rawKecVal = freshProf?.kecamatan || hydratedProfile.kecamatan || kecamatan || activeProfile?.kecamatan || "";
    const hKec = normalizeKecamatanName(rawKecVal, kecamatanList, districts);
    const hDesa = freshProf?.desa || hydratedProfile.desa || desa || activeProfile?.desa || "";
    
    const hNama = freshProf?.nama || hydratedProfile.nama || activeProfile?.full_name || nama || "";
    const hNik = freshProf?.nik || hydratedProfile.nik || activeProfile?.nik || userNik || "";

    if (category === "Non-Berusaha") {
      setPkkprTitle("Pembangunan Rumah Pribadi/Keluarga");
      setPkkprJenisPengajuan("Rumah Tinggal / Hunian Perorangan");
      setPkkprFungsiBangunan("Pembangunan Rumah Pribadi/Keluarga");
      setPkkprNamaLembaga("");
      setPkkprLuasBangunan(120);
      setPkkprBuktiTanahJenis("Sertipikat Hak Milik (SHM)");
      setPkkprBuktiTanahNomor("00214/Latimojong");
    } else {
      setPkkprTitle("Industri Pengolahan Kakao Terpadu & Pergudangan Modern");
      setPkkprFungsiBangunan("Industri Pengolahan & Pergudangan Modern");
      setPkkprNamaLembaga(hPerusahaan || "PT. LUWU AGRO INDUSTRI NUSANTARA");
      setPkkprKbli("10732");
      setPkkprLuasBangunan(12500);
      setPkkprBuktiTanahJenis("Sertipikat Hak Milik (SHM) / HGB");
      setPkkprBuktiTanahNomor("00412/Karang-Karangan");
    }

    if (hNama && !["masyarakat", "masyarakat publik", "offline-user", "masyarakat pemohon"].includes(hNama.toLowerCase())) {
      setPkkprNamaPemohon(hNama);
    } else {
      setPkkprNamaPemohon(nama && !["masyarakat", "masyarakat publik"].includes(nama.toLowerCase()) ? nama : "");
    }

    if (hNik && /^\d{16}$/.test(hNik)) {
      setPkkprNikPemohon(hNik);
    } else {
      setPkkprNikPemohon(userNik && /^\d{16}$/.test(userNik) ? userNik : "");
    }

    setPkkprNib(hNib);
    setPkkprPerusahaan(hPerusahaan);

    if (hKec) setPkkprKecamatan(hKec);
    if (hDesa) setPkkprDesa(hDesa);

    setPkkprGeometry(null);
    setPkkprEsgAnalysis(null);
    setPkkprKmzFileInfo(null);
    setSpatialInputMode("manual");
    
    // Reset document states
    setFileSertifikat(null);
    setSertifikatDataUrl(null);
    setSertifikatFileName("");
    setFileSuratPengantarDesa(null);
    setSuratPengantarDataUrl(null);
    setSuratPengantarFileName("");
    setFileSuratBebasSengketa(null);
    setSuratBebasSengketaDataUrl(null);
    setSuratBebasSengketaFileName("");
    setMergedPdfResult(null);
    
    setIsPkkprModalOpen(true);
  };

  const validatePkkprFile = (file: File, docLabel: string): boolean => {
    if (!file) return false;
    
    // 1. Strict File Size Validation (Max 5 MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      Swal.fire({
        icon: "warning",
        title: "Ukuran Berkas Terlalu Besar",
        text: `Ukuran berkas ${file.name || docLabel} terlalu besar (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maksimal 5 MB. Silakan kompres berkas PDF/Gambar Anda sebelum diunggah.`,
        confirmButtonColor: "#f59e0b"
      });
      return false;
    }

    // 2. Allowed MIME Types (PDF, JPG, JPEG, PNG)
    const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    const fileType = file.type?.toLowerCase() || "";
    const fileName = file.name?.toLowerCase() || "";
    const isValid = allowedMimeTypes.includes(fileType) ||
      fileName.endsWith(".pdf") ||
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg") ||
      fileName.endsWith(".png");

    if (!isValid) {
      Swal.fire({
        icon: "warning",
        title: "Format Berkas Tidak Didukung",
        text: `Format berkas ${file.name || docLabel} tidak didukung. Silakan gunakan format PDF, JPG, atau PNG.`,
        confirmButtonColor: "#f59e0b"
      });
      return false;
    }

    return true;
  };

  const handleSertifikatUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validatePkkprFile(file, "Sertifikat Hak Atas Tanah")) {
      e.target.value = "";
      return;
    }
    try {
      setFileSertifikat(file);
      setSertifikatFileName(file.name);
      const dataUrl = await readFileAsDataUrl(file);
      setSertifikatDataUrl(dataUrl);
    } catch (err) {
      Swal.fire("Gagal Membaca File", "Terjadi kesalahan saat mengunggah file sertifikat.", "error");
    }
  };

  const handleSuratPengantarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validatePkkprFile(file, "Surat Pengantar Desa / Kelurahan")) {
      e.target.value = "";
      return;
    }
    try {
      setFileSuratPengantarDesa(file);
      setSuratPengantarFileName(file.name);
      const dataUrl = await readFileAsDataUrl(file);
      setSuratPengantarDataUrl(dataUrl);
    } catch (err) {
      Swal.fire("Gagal Membaca File", "Terjadi kesalahan saat mengunggah file surat pengantar.", "error");
    }
  };

  const handleSiteplanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validatePkkprFile(file, "Siteplan / Denah Rencana Bangunan")) {
      e.target.value = "";
      return;
    }
    try {
      setFileSiteplan(file);
      setSiteplanFileName(file.name);
      const dataUrl = await readFileAsDataUrl(file);
      setSiteplanDataUrl(dataUrl);
    } catch (err) {
      Swal.fire("Gagal Membaca File", "Terjadi kesalahan saat mengunggah file siteplan.", "error");
    }
  };

  const handleSuratBebasSengketaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validatePkkprFile(file, "Surat Bebas Sengketa")) {
      e.target.value = "";
      return;
    }
    try {
      setFileSuratBebasSengketa(file);
      setSuratBebasSengketaFileName(file.name);
      const dataUrl = await readFileAsDataUrl(file);
      setSuratBebasSengketaDataUrl(dataUrl);
    } catch (err) {
      Swal.fire("Gagal Membaca File", "Terjadi kesalahan saat mengunggah file surat bebas sengketa.", "error");
    }
  };

  const handleGenerateMergedPdf = async () => {
    if (!sertifikatDataUrl && !suratPengantarDataUrl) {
      Swal.fire({
        icon: "warning",
        title: "Dokumen Belum Lengkap",
        text: "Silakan unggah minimal salah satu berkas (Sertifikat Hak Tanah atau Surat Pengantar Desa) sebelum menggabungkan PDF.",
      });
      return;
    }

    const isVerifiedNama = !!hydratedProfile.nama && !["masyarakat", "masyarakat publik", "offline-user", "masyarakat pemohon"].includes(hydratedProfile.nama.toLowerCase());
    const isVerifiedNik = /^\d{16}$/.test(hydratedProfile.nik);
    const finalNama = isVerifiedNama ? hydratedProfile.nama : pkkprNamaPemohon.trim();
    const finalNik = isVerifiedNik ? hydratedProfile.nik : pkkprNikPemohon.trim();

    setIsMergingPdf(true);
    try {
      const result = await generateMergedPkkprPdf({
        title: pkkprTitle || "Permohonan PKKPR",
        category: pkkprCategory,
        namaPemohon: finalNama,
        nikPemohon: finalNik,
        kecamatan: pkkprKecamatan || "Belopa",
        desa: pkkprDesa || "Tanamanai",
        luasM2: pkkprLuasM2 || 1000,
        sertifikatDataUrl,
        sertifikatFileName,
        suratPengantarDataUrl,
        suratPengantarFileName,
        suratBebasSengketaDataUrl,
        suratBebasSengketaFileName
      });
      setMergedPdfResult(result);
      Swal.fire({
        icon: "success",
        title: "Dokumen Berhasil Digabung!",
        text: `Berkas PKKPR 1 File PDF berhasil di-generate (${(result.blob.size / 1024).toFixed(1)} KB). Siap dikirim bersama permohonan Anda.`,
        confirmButtonColor: "#059669"
      });
    } catch (err) {
      console.error("PDF Merge error:", err);
      Swal.fire("Gagal Menggabungkan PDF", "Terjadi kendala saat menyusun berkas gabungan PDF.", "error");
    } finally {
      setIsMergingPdf(false);
    }
  };

  const handleSubmitPkkpr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkkprTitle.trim()) {
      Swal.fire("Data Belum Lengkap", "Silakan isi nama/judul kegiatan permohonan PKKPR Anda.", "warning");
      return;
    }

    const isVerifiedNama = !!hydratedProfile.nama && !["masyarakat", "masyarakat publik", "offline-user", "masyarakat pemohon"].includes(hydratedProfile.nama.toLowerCase());
    const isVerifiedNik = /^\d{16}$/.test(hydratedProfile.nik);

    const finalNama = isVerifiedNama ? hydratedProfile.nama : pkkprNamaPemohon.trim();
    const finalNik = isVerifiedNik ? hydratedProfile.nik : pkkprNikPemohon.trim();

    if (!finalNama || ["masyarakat", "masyarakat publik"].includes(finalNama.toLowerCase())) {
      Swal.fire("Data Pemohon Belum Lengkap", "Silakan masukkan nama lengkap pemohon sesuai KTP.", "warning");
      return;
    }

    if (!/^\d{16}$/.test(finalNik)) {
      Swal.fire("NIK Pemohon Belum Valid", "Silakan masukkan 16 digit NIK KTP pemohon yang valid.", "warning");
      return;
    }

    if (!pkkprKecamatan) {
      Swal.fire("Data Belum Lengkap", "Silakan pilih lokasi Kecamatan.", "warning");
      return;
    }
    if (!pkkprGeometry) {
      Swal.fire("Geometri Spasial Kosong", "Silakan digitasi polygon batas lahan pada peta terlebih dahulu.", "warning");
      return;
    }

    setIsSubmittingPkkpr(true);
    try {
      const docNumber = `PKKPR-LUWU-${Date.now().toString().slice(-6)}`;
      // 1. Hybrid Session Validation: Support both Supabase Auth & OTP Citizen NIK Session
      const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
      const currentCitizenNik = finalNik || hydratedProfile.nik || getActiveCitizenNik() || (typeof window !== 'undefined' ? (sessionStorage.getItem('citizen_nik') || localStorage.getItem('citizen_nik') || localStorage.getItem('mpp_verified_nik')) : null);
      const currentUserId = user?.id || (currentCitizenNik ? `cit-${currentCitizenNik}` : null);

      if (!user && !currentCitizenNik) {
        Swal.fire({
          icon: "warning",
          title: "Sesi Login Diperlukan",
          text: "Sesi login Anda tidak aktif. Silakan masuk atau lengkapi identitas NIK terlebih dahulu untuk mengajukan permohonan PKKPR.",
          confirmButtonColor: "#10b981"
        });
        return;
      }

      // Auto-generate merged PDF if not generated manually yet
      let finalMergedPdfDataUrl = mergedPdfResult?.dataUrl || null;
      let finalMergedPdfBlob = mergedPdfResult?.blob || null;
      if (!finalMergedPdfDataUrl) {
        try {
          const generated = await generateMergedPkkprPdf({
            title: pkkprTitle || "Permohonan PKKPR",
            category: pkkprCategory,
            namaPemohon: finalNama,
            nikPemohon: finalNik,
            kecamatan: pkkprKecamatan,
            desa: pkkprDesa,
            luasM2: pkkprLuasM2 || 1000,
            sertifikatDataUrl,
            sertifikatFileName,
            suratPengantarDataUrl,
            suratPengantarFileName,
            suratBebasSengketaDataUrl,
            suratBebasSengketaFileName
          });
          finalMergedPdfDataUrl = generated.dataUrl;
          finalMergedPdfBlob = generated.blob;
        } catch (pdfErr) {
          console.warn("Auto merge PDF generation warning:", pdfErr);
        }
      }

      // Upload documents to Supabase Storage bucket ('pkkpr_documents' or 'investments' fallback)
      let sertifikatTanahStorageUrl: string | null = null;
      let siteplanStorageUrl: string | null = null;
      let suratPengantarDesaStorageUrl: string | null = null;
      let berkasLegalitasGabunganStorageUrl: string | null = null;

      try {
        [sertifikatTanahStorageUrl, siteplanStorageUrl, suratPengantarDesaStorageUrl, berkasLegalitasGabunganStorageUrl] = await Promise.all([
          uploadPkkprDocumentToStorage(fileSertifikat || sertifikatDataUrl, sertifikatFileName || 'sertifikat_tanah.pdf', 'sertifikat'),
          (pkkprKategoriPengajuan === 'BANGUNAN' && (fileSiteplan || siteplanDataUrl))
            ? uploadPkkprDocumentToStorage(fileSiteplan || siteplanDataUrl, siteplanFileName || 'siteplan_bangunan.pdf', 'siteplan')
            : Promise.resolve(null),
          uploadPkkprDocumentToStorage(fileSuratPengantarDesa || suratPengantarDataUrl, suratPengantarFileName || 'surat_pengantar_desa.pdf', 'surat_pengantar'),
          uploadPkkprDocumentToStorage(finalMergedPdfBlob || finalMergedPdfDataUrl, `Berkas_Gabungan_PKKPR_${docNumber}.pdf`, 'berkas_gabungan')
        ]);
      } catch (uploadErr: any) {
        console.error("[Storage Upload Error]:", uploadErr);
        setIsSubmittingPkkpr(false);
        const errMsg = uploadErr?.message || "";
        const isSizeErr = errMsg.includes("terlalu besar") || errMsg.includes("5 MB");
        Swal.fire({
          icon: isSizeErr ? "warning" : "error",
          title: isSizeErr ? "Ukuran Berkas Terlalu Besar" : "Gagal Mengunggah Berkas",
          text: isSizeErr
            ? errMsg
            : "Gagal mengunggah berkas karena koneksi terputus. Periksa koneksi internet Anda atau coba kompres ukuran berkas.",
          confirmButtonColor: "#ef4444"
        });
        return;
      }

      const finalSertifikatUrl = sertifikatTanahStorageUrl || sertifikatDataUrl || null;
      const finalSiteplanUrl = siteplanStorageUrl || siteplanDataUrl || null;
      const finalSuratPengantarUrl = suratPengantarDesaStorageUrl || suratPengantarDataUrl || null;
      const finalBerkasGabunganUrl = berkasLegalitasGabunganStorageUrl || finalMergedPdfDataUrl || null;

      const isUuid = (val: string | null | undefined): boolean => {
        if (!val) return false;
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
      };
      const validUserId = (user?.id && isUuid(user.id)) ? user.id : (finalNik ? `cit-${finalNik}` : null);

      const newPkkprApp = {
        id: `pkkpr_${Date.now()}`,
        pkkpr_doc_number: docNumber,
        category: pkkprCategory,
        title: pkkprTitle,
        nama_pemohon: finalNama,
        nik: finalNik,
        nib: pkkprCategory === "Berusaha" ? pkkprNib : null,
        perusahaan: pkkprCategory === "Berusaha" ? pkkprPerusahaan : null,
        no_whatsapp: kontak,
        kecamatan: pkkprKecamatan,
        desa: pkkprDesa,
        luas_m2: pkkprLuasM2,
        geometry: pkkprGeometry,
        esg_analysis: pkkprEsgAnalysis,
        berkas_gabungan_pdf: finalBerkasGabunganUrl,
        sertifikat_tanah_url: finalSertifikatUrl,
        file_siteplan_url: pkkprKategoriPengajuan === 'BANGUNAN' ? finalSiteplanUrl : null,
        surat_pengantar_desa_url: finalSuratPengantarUrl,
        berkas_legalitas_gabungan_url: finalBerkasGabunganUrl,
        sertifikat_file_name: sertifikatFileName || null,
        surat_pengantar_file_name: suratPengantarFileName || null,
        status: "PENDING",
        pkkpr_status: "Menunggu Verifikasi Spasial PUPTR",
        created_at: new Date().toISOString(),
        user_id: validUserId,
        created_by: validUserId,
      };

      const normalizedGeom = ensureLuwuLngLatOrder(pkkprGeometry);
      const virtualTicket = `V-PKKPR-${Date.now()}`;

      // Step 1: Auto-register Citizen to MPP Database
      try {
        const citizenPayload = sanitizeSupabasePayload({
          nik: finalNik,
          nama: finalNama || 'Pemohon Online',
          no_hp: kontak || '-',
          source: 'ONLINE_GUEST',
          last_active: new Date().toISOString()
        });
        const { error: citizenErr } = await supabase
          .from('mpp_citizens')
          .upsert(citizenPayload, { onConflict: 'nik' });
        if (citizenErr) console.warn('[Guest Mode] mpp_citizens upsert note:', citizenErr);
      } catch (cErr) {
        console.warn('[Guest Mode] mpp_citizens exception:', cErr);
      }

      // Step 2: Create Virtual Queue Ticket for MPP Front Office & PUPTR Dispatch (Strict Error Checked)
      const queuePayload = sanitizeSupabasePayload({
        id: docNumber,
        ticket_code: virtualTicket,
        instansi_code: 'PUPTR',
        target_department: 'PUPTR',
        user_id: validUserId,
        citizen_nik: finalNik,
        nik_pemohon: finalNik,
        nama_pemohon: finalNama || 'Pemohon Online',
        service_type: 'PKKPR',
        service_name: `Izin PKKPR Tata Ruang (${pkkprCategory})`,
        status: 'WAITING_PUPTR_VERIFICATION',
        category: pkkprCategory,
        source: 'ONLINE',
        geometry_json: normalizedGeom,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const { error: queueErr } = await supabase
        .from('mpp_queues')
        .insert([queuePayload]);

      if (queueErr) {
        throw new Error(`Gagal menyimpan tiket antrean ke database (mpp_queues): ${queueErr.message}`);
      }

      // Step 3: Insert Spatial & Legal Details into gis_pkkpr (Primary PostGIS Table)
      const isIntersectLP2B = await checkLp2bIntersection(normalizedGeom);
      const initialStatusPkkpr: PKKPRStatus = isIntersectLP2B ? 'VERIFIKASI_PERTANIAN' : 'BYPASS_PERTANIAN';

      const formattedCatatanTeknis = [
        `[Tiket Virtual FO: ${virtualTicket}]`,
        `[Kategori: ${pkkprKategoriPengajuan === 'BANGUNAN' ? 'Konstruksi Bangunan Fisik' : 'Parsil Tanah Murni / ATR-BPN'}]`,
        `[Jenis Pengajuan: ${pkkprJenisPengajuan}]`,
        pkkprFungsiBangunan ? `[Fungsi: ${pkkprFungsiBangunan}]` : (pkkprCategory === "Berusaha" ? `[Fungsi: Komersial / Usaha ${pkkprKbli || ''}]` : ''),
        pkkprBuktiTanahJenis ? `[Penguasaan Tanah: ${pkkprBuktiTanahJenis}${pkkprBuktiTanahNomor ? ` No. ${pkkprBuktiTanahNomor}` : ''}]` : '',
        pkkprKategoriPengajuan === 'BANGUNAN' && pkkprLuasBangunan ? `[Rencana Luas Bangunan: ${pkkprLuasBangunan} m²]` : '',
        `[Alamat Pemohon: ${(hydratedProfile as any).address || (pkkprDesa && pkkprKecamatan ? `Desa ${pkkprDesa}, Kec. ${pkkprKecamatan}, Kab. Luwu` : 'Kabupaten Luwu')}]`,
        `[Lokasi Dimohon: Desa ${pkkprDesa}, Kec. ${pkkprKecamatan}, Kab. Luwu]`,
        isIntersectLP2B ? '[Kajian LP2B: Beririsan Kawasan LP2B - Memerlukan Verifikasi Dinas Pertanian]' : '[Smart Spatial Bypass: Bebas LP2B - Langsung Menuju Verifikasi PUPTR]',
        "Dalam proses analisis spasial tata ruang PUPTR."
      ].filter(Boolean).join(" ");

      const gisPayload = sanitizeSupabasePayload({
        id: docNumber,
        nomor_tiket: virtualTicket,
        jenis_permohonan: pkkprCategory, // 'Berusaha' | 'Non-Berusaha'
        nama_permohonan: pkkprTitle || (pkkprCategory === "Berusaha" ? "Permohonan PKKPR Usaha/Komersial" : "Permohonan PKKPR Rumah Tinggal / Fasos"),
        nib_oss: pkkprCategory === "Berusaha" ? (pkkprNib || null) : null,
        nama_badan_usaha: pkkprCategory === "Berusaha" ? (pkkprPerusahaan || null) : (pkkprNamaLembaga || null),
        nama_pemohon: finalNama,
        nik_pemohon: finalNik,
        applicant_nik: finalNik,
        applicant_id: validUserId,
        no_whatsapp: kontak || null,
        sektor: pkkprCategory === "Berusaha" ? "Komersial / Usaha" : "Non-Komersial / Perumahan",
        jenis_pengajuan_pkkpr: pkkprJenisPengajuan,
        kategori_pengajuan: pkkprKategoriPengajuan,
        file_siteplan_url: pkkprKategoriPengajuan === 'BANGUNAN' ? (finalSiteplanUrl || null) : null,
        rencana_luas_bgn: pkkprKategoriPengajuan === 'BANGUNAN' ? (Number(pkkprLuasBangunan) || null) : null,
        luas_bangunan: pkkprKategoriPengajuan === 'BANGUNAN' ? (Number(pkkprLuasBangunan) || null) : null,
        kecamatan: pkkprKecamatan,
        desa_kelurahan: pkkprDesa,
        luas_m2: pkkprLuasM2 || 500,
        luas_ha: pkkprLuasM2 ? Number((pkkprLuasM2 / 10000).toFixed(4)) : 0.05,
        geom: null,
        geometry_json: normalizedGeom,
        nama_berkas_kmz: "Batas_Poligon_Lokasi.kmz",
        berkas_kmz_url: null,
        status_pkkpr: initialStatusPkkpr,
        status_permohonan: 'REVIEW_PUPTR',
        tahap_proses: 'TAHAP 1: VERIFIKASI BERKAS & TATA RUANG (PUPTR)',
        pertek_puptr_num: null,
        berita_acara_pertanian_num: null,
        sk_pkkpr_num: null,
        catatan_teknis: formattedCatatanTeknis,
        jenis_alas_hak: pkkprBuktiTanahJenis || "Sertipikat Hak Milik (SHM)",
        file_alas_hak_url: finalSertifikatUrl || null,
        bukti_tanah: `${pkkprBuktiTanahJenis}${pkkprBuktiTanahNomor ? ` (No. ${pkkprBuktiTanahNomor})` : ''}`,
        user_id: validUserId,
        created_by: validUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sertifikat_tanah_url: finalSertifikatUrl,
        surat_pengantar_desa_url: finalSuratPengantarUrl,
        berkas_legalitas_gabungan_url: finalBerkasGabunganUrl
      });

      const { error: gisErr } = await supabase
        .from("gis_pkkpr")
        .insert([gisPayload]);

      if (gisErr) {
        throw new Error(`Gagal menyimpan data spasial PKKPR ke database (gis_pkkpr): ${gisErr.message}`);
      }

      // Step 4: Insert into investments table (Secondary Fallback Table)
      try {
        const invPayload = sanitizeSupabasePayload({
          id: docNumber,
          pkkpr_doc_number: virtualTicket,
          title: `[PKKPR ${pkkprCategory}] ${pkkprTitle}`,
          name: pkkprCategory === "Berusaha" ? (pkkprPerusahaan || pkkprTitle) : (pkkprTitle || "Permohonan PKKPR Rumah Tinggal / Fasos"),
          category: pkkprCategory === "Berusaha" ? "Komersial / Usaha" : "Non-Komersial / Perseorangan",
          perusahaan: pkkprCategory === "Berusaha" ? (pkkprPerusahaan || "Pelaku Usaha") : (pkkprNamaLembaga || "Perseorangan"),
          contact_pic: finalNama,
          nama_kontak_person: finalNama,
          plot_number: finalNik,
          sector: pkkprCategory === "Berusaha" ? "Komersial / Usaha" : "Non-Komersial / Perumahan",
          jenis_pengajuan_pkkpr: pkkprJenisPengajuan,
          kategori_pengajuan: pkkprKategoriPengajuan,
          file_siteplan_url: pkkprKategoriPengajuan === 'BANGUNAN' ? (finalSiteplanUrl || null) : null,
          rencana_luas_bgn: pkkprKategoriPengajuan === 'BANGUNAN' ? (Number(pkkprLuasBangunan) || null) : null,
          kecamatan: pkkprKecamatan,
          district_id: pkkprKecamatan,
          desa: pkkprDesa,
          village_id: pkkprDesa,
          area_ha: pkkprLuasM2 ? Number((pkkprLuasM2 / 10000).toFixed(4)) : 0.05,
          proposal_file_name: "Batas_Poligon_Lokasi.kmz",
          geometry: normalizedGeom,
          status: "Pending Spatial Check",
          land_status: pkkprBuktiTanahJenis || "Sertipikat Hak Milik (SHM)",
          certificate_number: pkkprBuktiTanahNomor || `SHM-${docNumber}`,
          description: formattedCatatanTeknis,
          user_id: validUserId,
          created_by: validUserId,
          created_at: new Date().toISOString()
        });
        await supabase.from("investments").insert([invPayload]);
      } catch (invErr) {
        console.warn("Secondary investments table note:", invErr);
      }

      // Immediate Realtime Refresh for Citizen History
      await fetchMyPkkprApplications();
      setActiveTab("history");

      // Trigger Cross-OPD Notification to Admin Dinas PUPTR
      addCrossOpdNotification({
        applicationId: docNumber,
        applicantName: finalNama,
        companyName: pkkprCategory === "Berusaha" ? (pkkprPerusahaan || "Pelaku Usaha") : (pkkprTitle || "Permohonan PKKPR Perseorangan"),
        sector: pkkprCategory === "Berusaha" ? "Komersial / Usaha" : "Non-Komersial / Perumahan",
        districtName: pkkprKecamatan,
        villageName: pkkprDesa,
        targetRole: 'ADMIN_PUPTR',
        fromRole: 'PEMOHON',
        type: 'NEW_SUBMISSION',
        title: `Permohonan PKKPR ${pkkprCategory} Baru #${docNumber}`,
        message: `Permohonan PKKPR ${pkkprCategory} Baru dari ${finalNama} (NIK: ${finalNik}) di Desa ${pkkprDesa}, Kec. ${pkkprKecamatan} membutuhkan verifikasi spasial PUPTR.`
      });

      setIsPkkprModalOpen(false);

      // Reset form
      setPkkprTitle("");
      setPkkprNib("");
      setPkkprPerusahaan("");
      setPkkprGeometry(null);
      setPkkprEsgAnalysis(null);

      Swal.fire({
        title: "Permohonan PKKPR Terkirim!",
        html: `
          <div class="text-left space-y-3 text-sm">
            <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-lg dark:bg-emerald-950 dark:border-emerald-800">
              <p class="text-xs text-emerald-800 dark:text-emerald-300 font-semibold uppercase tracking-wider">Nomor Tiket Antrean Virtual FO</p>
              <p class="text-lg font-mono text-emerald-700 dark:text-emerald-400 font-extrabold">${virtualTicket}</p>
            </div>
            <p><strong>Nomor Berkas:</strong> <span class="font-mono text-gray-800 dark:text-gray-200 font-bold">${docNumber}</span></p>
            <p><strong>NIK Pemohon:</strong> <span class="font-mono text-gray-800 dark:text-gray-200 font-bold">${finalNik}</span></p>
            <p><strong>Status:</strong> <span class="text-amber-600 font-bold">Menunggu Verifikasi Front Office / PUPTR</span></p>
            <div class="p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 font-medium dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300">
              📌 <strong>Petunjuk Pemohon:</strong> Simpan Nomor Tiket ini. Gunakan NIK (<strong>${finalNik}</strong>) dan Nomor Tiket (<strong>${virtualTicket}</strong>) untuk mengecek status permohonan dan mengunduh SK Izin PKKPR Anda.
            </div>
          </div>
        `,
        icon: "success",
        confirmButtonText: "Selesai & Simpan Tiket",
        confirmButtonColor: "#10b981",
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire("Gagal Mengirim", err.message || "Terjadi kesalahan saat mengirim permohonan.", "error");
    } finally {
      setIsSubmittingPkkpr(false);
    }
  };

  // Mobile & Navigation Tab state
  const [activeTab, setActiveTab] = useState<"form" | "history" | "sla_info">("form");

  // SKM (Survei Kepuasan Masyarakat) Ratings local state
  const [skmRatings, setSkmRatings] = useState<Record<string, number>>({});
  const [userFeedback, setUserFeedback] = useState<Record<string, string>>({});

  // Registered companies state
  const [companyList, setCompanyList] = useState<string[]>([]);
  const [rawCompanies, setRawCompanies] = useState<{name: string, kec: string, desa: string}[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState<boolean>(false);
  const [isManualCompanyInput, setIsManualCompanyInput] = useState<boolean>(false);

  useEffect(() => {
    if (activeProfile) {
      if (activeProfile.full_name) setNama(activeProfile.full_name);
      const phone = extractPhone(activeProfile);
      if (phone) setKontak(phone);
      if (activeProfile.kecamatan) setKecamatan(activeProfile.kecamatan);
      if (activeProfile.desa) setDesa(activeProfile.desa);
      if (activeProfile.nik) setUserNik(activeProfile.nik);
    }
    // Direct check on supabase auth session user metadata if activeProfile is delayed or incomplete
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const uPhone = extractPhone(user) || extractPhone(user.user_metadata);
        if (uPhone) {
          setKontak((prev) => prev || uPhone);
        }
        if (user.user_metadata?.full_name) {
          setNama((prev) => prev || user.user_metadata.full_name);
        }
        const uNik = user.user_metadata?.nik || user.user_metadata?.no_ktp;
        if (uNik) {
          setUserNik((prev) => prev || uNik);
        } else {
          try {
            const isValidUuid = (id?: string) => Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
            if (user?.id && isValidUuid(user.id)) {
              const { data: prof } = await supabase.from("profiles").select("nik").eq("id", user.id).maybeSingle();
              if (prof?.nik) {
                setUserNik((prev) => prev || prof.nik);
              }
            }
          } catch (e) {}
        }
      }
    }).catch(() => {});
  }, [activeProfile, extractPhone]);

    // Fetch raw registered investors / companies ONCE on mount
  const fetchRawCompanies = useCallback(async () => {
    setLoadingCompanies(true);
    const rawList: {name: string, kec: string, desa: string}[] = [];

    try {
      // 1. Fetch directly from Supabase 'investments' table safely as per USER REQUEST
      try {
        const { data: invData } = await supabase
          .from("investments")
          .select("id, name, sector, kecamatan")
          .limit(200);
        if (invData) {
          invData.forEach((inv: any) => {
            const invKec = (inv.kecamatan || "").toString().toLowerCase();
            const invDesa = (inv.desa || "").toString().toLowerCase();
            const compName = inv.name;
            if (compName && compName.trim()) {
               rawList.push({ name: compName.trim(), kec: invKec, desa: invDesa });
            }
          });
        }
      } catch (e) {
        // quiet catch
      }

      // 3. Fetch from 'profiles' table safely
      try {
        const { data: profData } = await supabase
          .from("profiles")
          .select("id, role, company_name, full_name, kecamatan, desa")
          .limit(200);
        if (profData) {
          profData.forEach((p: any) => {
            if (p.role === "investor" || p.role === "perusahaan") {
              const pKec = (p.kecamatan || "").toString().toLowerCase();
              const cName = p.company_name || p.full_name;
              const pDesa = (p.desa || "").toString().toLowerCase();
              if (cName && cName.trim()) {
                 rawList.push({ name: cName.trim(), kec: pKec, desa: pDesa });
              }
            }
          });
        }
      } catch (e) {
        // ignore
      }

      // 4. Fetch from 'investment_interests' table via Express proxy API
      try {
        const res = await fetch("/api/investment-interests", { credentials: "same-origin" });
        if (res.ok) {
          const loiData = await res.json();
          if (Array.isArray(loiData)) {
            loiData.forEach((loi: any) => {
              if (loi.company_name && loi.company_name.trim() && loi.company_name !== "-") {
                const pot = (loi.potensi_name || "").toLowerCase();
                rawList.push({ name: loi.company_name.trim(), kec: pot, desa: "" });
              }
            });
          }
        }
      } catch (e) {
        // ignore
      }

      setRawCompanies(rawList);
    } catch (err) {
      console.error("Error fetching raw companies:", err);
      setRawCompanies([]);
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  useEffect(() => {
    fetchRawCompanies();
  }, [fetchRawCompanies]);

  // Client-side filtering to avoid network spam on dropdown changes
  useEffect(() => {
    const targetKec = (kecamatan || lokasi || activeProfile?.kecamatan || "").replace(/^kec\.?\s*/i, "").replace(/^kecamatan\s*/i, "").trim().toLowerCase();
    const targetDesa = (desa || activeProfile?.desa || "").replace(/^(desa|kel\.?|kelurahan)\s*/i, "").trim().toLowerCase();
    
    const foundCompanies = new Set<string>();
    
    rawCompanies.forEach((comp) => {
      let kecMatches = false;
      let desaMatches = false;

      // check kecamatan
      if (!targetKec || isSameDistrict(comp.kec, targetKec)) {
        kecMatches = true;
      }
      
      // check desa
      if (!targetDesa || comp.desa.includes(targetDesa) || targetDesa.includes(comp.desa)) {
        desaMatches = true;
      }
      
      if (kecMatches && (desaMatches || !targetDesa)) {
        foundCompanies.add(comp.name);
      }
    });
    
    const uniqueList = Array.from(foundCompanies).filter(Boolean);
    setCompanyList(uniqueList);
  }, [rawCompanies, kecamatan, desa, lokasi, activeProfile]);

  // Tracking table states
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);

  // Load complaints for this user (Supports VARCHAR pelapor_id: UUID, raw NIK, or cit-NIK)
  const fetchMyComplaints = useCallback(async () => {
    const rawId = activeProfile?.id || currentUser?.id || "";
    const rawNik = userNik || activeProfile?.nik || "";
    if (!rawId && !rawNik) {
      setComplaints([]);
      setLoadingComplaints(false);
      return;
    }

    setLoadingComplaints(true);
    try {
      const idCandidates = new Set<string>();
      if (rawId && rawId !== "offline-user") idCandidates.add(String(rawId));
      if (rawNik && /^\d{16}$/.test(rawNik)) {
        idCandidates.add(rawNik);
        idCandidates.add(`cit-${rawNik}`);
        idCandidates.add(`citizen-${rawNik}`);
      }
      if (currentUser?.id) idCandidates.add(String(currentUser.id));

      const candidateList = Array.from(idCandidates);
      
      let query = supabase.from("pengaduan").select("*");
      if (candidateList.length === 1) {
        query = query.eq("pelapor_id", candidateList[0]);
      } else if (candidateList.length > 1) {
        query = query.in("pelapor_id", candidateList);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        setComplaints(data);
      } else {
        if (error) {
          console.warn("[MasyarakatDashboard] Non-fatal pengaduan fetch note:", error.message);
        }
        setComplaints([]);
      }
    } catch (err: any) {
      console.warn("[MasyarakatDashboard] Non-fatal catch loading pengaduan:", err);
      setComplaints([]);
    } finally {
      setLoadingComplaints(false);
    }
  }, [activeProfile?.id, activeProfile?.nik, currentUser?.id, userNik]);

  useEffect(() => {
    fetchMyComplaints();
  }, [fetchMyComplaints]);

  // Handle auto geotagging
  const handleGetLocation = (isManual = true) => {
    setIsGettingLocation(true);
    if (!navigator.geolocation) {
      if (isManual) {
        Swal.fire({
          title: "Tidak Didukung",
          text: "Browser Anda tidak mendukung Geolocation.",
          icon: "error"
        });
      }
      setIsGettingLocation(false);
      return;
    }

    const fallbackToKecamatan = (reason?: string) => {
      let fallLat = -3.333; // Default Belopa
      let fallLng = 120.355;
      
      const targetText = (kecamatan || activeProfile?.kecamatan || lokasi || "").replace(/^kec\.?\s*/i, "").replace(/^kecamatan\s*/i, "").trim();
      
      for (const key of Object.keys(KECAMATAN_COORDINATES)) {
        if (targetText.toLowerCase() === key.toLowerCase()) {
          fallLat = KECAMATAN_COORDINATES[key].lat;
          fallLng = KECAMATAN_COORDINATES[key].lng;
          break;
        }
      }
      
      setCoords({ lat: fallLat, lng: fallLng });
      setIsGettingLocation(false);
      if (isManual) {
        Swal.fire({
          title: "Lokasi Diperkirakan",
          text: reason ? `${reason}. Menggunakan pusat koordinat Kecamatan ${targetText || "Luwu"} sebagai referensi.` : `Menggunakan pusat koordinat Kecamatan ${targetText || "Luwu"} sebagai referensi lokasi.`,
          icon: "info",
          toast: true,
          position: "top-end",
          timer: 4000,
          showConfirmButton: false,
          background: isDarkMode ? "#0f172a" : "#ffffff",
          color: isDarkMode ? "#f8fafc" : "#0f172a"
        });
      }
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        
        if (selectedKecamatanPolygon) {
          try {
            const userPoint = point([longitude, latitude]);
            const isInside = booleanPointInPolygon(userPoint, selectedKecamatanPolygon);
            if (!isInside) {
              setIsGettingLocation(false);
              Swal.fire({
                title: "Lokasi Tidak Valid",
                text: "Koordinat Anda berada di luar wilayah Kecamatan yang dipilih!",
                icon: "error",
                background: isDarkMode ? "#0f172a" : "#ffffff",
                color: isDarkMode ? "#f8fafc" : "#0f172a"
              });
              return;
            }
          } catch (e) {
            console.warn("Geofence validation error:", e);
          }
        }

        setCoords({ lat: latitude, lng: longitude });
        setIsGettingLocation(false);
        if (isManual) {
          Swal.fire({
            title: "Lokasi Terdeteksi",
            text: `Koordinat GPS berhasil dikunci: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            icon: "success",
            toast: true,
            position: "top-end",
            timer: 3000,
            showConfirmButton: false,
            background: isDarkMode ? "#0f172a" : "#ffffff",
            color: isDarkMode ? "#f8fafc" : "#0f172a"
          });
        }
      },
      (err: GeolocationPositionError) => {
        const errorReason = err.code === 1 
          ? "Izin GPS tidak diberikan" 
          : err.code === 2 
          ? "Sinyal GPS tidak tersedia" 
          : "Waktu pencarian GPS habis";
        console.warn(`[Geolocation] ${errorReason} (${err.message || "Code: " + err.code})`);
        fallbackToKecamatan(errorReason);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Keluar Sistem?",
      text: "Anda akan keluar dari Portal Pengaduan Masyarakat.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Keluar",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
      background: isDarkMode ? "#0f172a" : "#ffffff",
      color: isDarkMode ? "#f8fafc" : "#0f172a"
    });

    if (result.isConfirmed) {
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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalNama = nama || activeProfile?.full_name || "Masyarakat";
    const finalKontak = kontak.trim() || extractPhone(activeProfile) || "-";
    const finalLokasi = (kecamatan || activeProfile?.kecamatan) && (desa || activeProfile?.desa)
      ? `Kec. ${kecamatan || activeProfile?.kecamatan}, Desa/Kel. ${desa || activeProfile?.desa}`
      : ((kecamatan || activeProfile?.kecamatan) ? `Kec. ${kecamatan || activeProfile?.kecamatan}` : (lokasi.trim() || "Kabupaten Luwu"));

    if (!deskripsi.trim()) {
      Swal.fire({ title: "Gagal", text: "Uraian laporan pengaduan wajib diisi.", icon: "error", confirmButtonColor: "#3b82f6" });
      return;
    }

    if (coords && selectedKecamatanPolygon) {
      try {
        const userPoint = point([coords.lng, coords.lat]);
        const isInside = booleanPointInPolygon(userPoint, selectedKecamatanPolygon);
        if (!isInside) {
          Swal.fire({
            title: "Lokasi Tidak Valid",
            text: "Koordinat Anda berada di luar wilayah Kecamatan yang dipilih!",
            icon: "error",
            background: isDarkMode ? "#0f172a" : "#ffffff",
            color: isDarkMode ? "#f8fafc" : "#0f172a"
          });
          return;
        }
      } catch (e) {
        console.error("Geofence validation error on submit", e);
      }
    }

    setIsSubmitting(true);
    try {
      let bukti_foto_url = null;
      if (file) {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${activeProfile?.id || 'guest'}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        let isUploaded = false;

        try {
          const { error: uploadError } = await supabase.storage
            .from("pengaduan_evidence")
            .upload(fileName, file, { upsert: true });

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from("pengaduan_evidence")
              .getPublicUrl(fileName);
            if (publicUrlData?.publicUrl) {
              bukti_foto_url = publicUrlData.publicUrl;
              isUploaded = true;
            }
          }
        } catch (e) {
          console.warn("Upload to pengaduan_evidence bucket failed:", e);
        }

        if (!isUploaded) {
          try {
            const { error: fallbackErr } = await supabase.storage
              .from("investments")
              .upload(fileName, file, { upsert: true });

            if (!fallbackErr) {
              const { data: publicUrlData } = supabase.storage
                .from("investments")
                .getPublicUrl(fileName);
              if (publicUrlData?.publicUrl) {
                bukti_foto_url = publicUrlData.publicUrl;
                isUploaded = true;
              }
            }
          } catch (e) {
            console.warn("Upload to investments bucket failed:", e);
          }
        }

        if (!isUploaded) {
          bukti_foto_url = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string) || '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
          });
        }
      }

      const currentYear = new Date().getFullYear();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const tiketId = `LAPOR-${currentYear}-${randomSuffix}`;

      const targetName = targetAduan.includes("Penyelenggara")
        ? unitMpp
        : perusahaan;

      const fullPayload: any = {
        tipe_pelapor: "masyarakat",
        nama_pelapor: isAnonymous ? `${finalNama} (Anonim)` : finalNama,
        kontak_pelapor: finalKontak,
        lokasi_kejadian: finalLokasi,
        perusahaan_terkait: targetName.trim() || null,
        target_aduan: targetAduan,
        jenis_aduan: jenisAduan,
        kategori_pengaduan: targetAduan.includes("Penyelenggara") && unitMpp ? `[${tipeLaporan}] ${targetAduan} - ${jenisAduan} (${unitMpp})` : `[${tipeLaporan}] ${targetAduan} - ${jenisAduan}`,
        deskripsi_masalah: `[Klasifikasi: ${tipeLaporan}]\n[Diadukan Ke: ${targetAduan}]\n${targetAduan.includes("Penyelenggara") && unitMpp ? `[Unit Layanan MPP: ${unitMpp}]\n` : ''}[Jenis Aduan: ${jenisAduan}]\n[Anonim: ${isAnonymous ? 'Ya (Whistleblower)' : 'Tidak'}]\n\n${deskripsi}`,
        status: "Menunggu Verifikasi",
        latitude: coords?.lat || null,
        longitude: coords?.lng || null,
        bukti_foto_url,
        pelapor_id: activeProfile?.id || null,
        tiket_id: tiketId,
        is_anonymous: isAnonymous,
      };

      const { error: err1 } = await supabase.from("pengaduan").insert(fullPayload);
      if (err1) {
        delete fullPayload.target_aduan;
        delete fullPayload.jenis_aduan;
        delete fullPayload.is_anonymous;
        const { error: err2 } = await supabase.from("pengaduan").insert(fullPayload);
        if (err2) throw err2;
      }

      await Swal.fire({
        title: "Laporan Terkirim!",
        html: `Laporan Anda berhasil didaftarkan dengan ID Tiket:<br/><strong class="text-emerald-500 font-mono text-lg">${tiketId}</strong><br/><br/>DPMPTSP Luwu akan segera memverifikasi laporan Anda.`,
        icon: "success",
        confirmButtonColor: "#10b981",
        background: isDarkMode ? "#0f172a" : "#ffffff",
        color: isDarkMode ? "#f8fafc" : "#0f172a"
      });

      // Reset form fields
      setLokasi("");
      setPerusahaan("");
      setUnitMpp("");
      setDeskripsi("");
      setFile(null);
      setActiveTab("history");
      fetchMyComplaints();
    } catch (err: any) {
      console.error(err);
      Swal.fire({ title: "Gagal Mengirim", text: err.message, icon: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── AUTHENTICATION LOADING SCREEN GUARD ───
  if (isAuthLoading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${isDarkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"}`}>
        <div className="w-14 h-14 relative flex items-center justify-center mb-4">
          <div className="w-14 h-14 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
        </div>
        <p className="text-base font-semibold tracking-wide animate-pulse">
          Memverifikasi Sesi Layanan Warga...
        </p>
        <p className="text-slate-400 text-xs mt-1">
          Pemerintah Kabupaten Luwu - Portal Layanan Masyarakat
        </p>
      </div>
    );
  }

  // If auth finished and user is not authenticated, render null while navigate('/login') triggers
  const hasActiveSession = Boolean(currentUser || getActiveCitizenNik() || activeProfile?.nik || isServerError);
  if (!hasActiveSession) {
    return null;
  }

  return (
    <div className={`min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 ${isDarkMode ? "dark" : ""} font-sans pb-12`}>
      {/* Server Connectivity Alert Banner */}
      {isServerError && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-center text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center justify-center gap-2 relative z-50">
          <span>⚠️ Koneksi ke server utama terhambat. Sesi dan data lokal Anda tetap aman.</span>
          <button 
            onClick={() => window.location.reload()} 
            className="underline font-bold hover:text-amber-700 dark:hover:text-amber-300 ml-1 cursor-pointer"
          >
            Muat Ulang Halaman
          </button>
        </div>
      )}

      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-10 w-[400px] h-[400px] bg-red-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2.5">
          {/* Brand Left */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            {/* Logo Luwu */}
            <div className="w-12 h-14 md:w-14 md:h-16 flex items-center justify-center shrink-0">
              <img 
                src={LUWU_LOGO_BASE64} 
                alt="Logo Pemkab Luwu" 
                className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="min-w-0 flex flex-col justify-center">
              {/* Badges - Removed duplicate MPP SIMPURUSIANG badge */}
              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20 rounded font-mono tracking-tight leading-none">
                  LAPOR LUWU!
                </span>
                <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded font-mono tracking-tight leading-none">
                  TERVERIFIKASI
                </span>
              </div>

              {/* Title: Android-friendly font, NOT bold, proportional size */}
              <h1 className="text-xs sm:text-base md:text-lg font-medium text-slate-800 dark:text-slate-100 font-sans tracking-normal truncate">
                {mainArea === "pkkpr"
                  ? "Portal Layanan Perizinan PKKPR & Publik"
                  : mainArea === "pengaduan"
                  ? "Kanal Pengaduan Masyarakat"
                  : mainArea === "survey_skm"
                  ? "Survei Kepuasan Masyarakat (SKM)"
                  : "Testimoni Pengguna & Ulasan Warga"}
              </h1>

              {/* Subtitle */}
              <h2 className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 leading-tight truncate">
                MPP Simpurusiang Kabupaten Luwu
              </h2>

              <p className="hidden md:block text-[10px] text-slate-600 dark:text-slate-400 font-medium truncate">
                Sistem Pengawasan Terpadu Tata Ruang, Perizinan Spasial, dan Pelayanan Publik
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={handleToggleTheme}
              title={isDarkMode ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
              aria-label="Toggle Theme"
              className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                isDarkMode
                  ? "bg-slate-800/80 hover:bg-slate-700 text-amber-400 border-slate-700/60 shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-indigo-600 border-slate-200/80 shadow-sm"
              }`}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* User Profile Card */}
            <div className={`hidden sm:flex flex-col text-right ${isDarkMode ? "text-slate-300" : "text-slate-800 dark:text-slate-200"}`}>
              <span className="text-[10px] font-bold font-mono text-emerald-500 uppercase leading-none">MASYARAKAT</span>
              <span className="text-xs sm:text-sm font-semibold truncate max-w-[120px] lg:max-w-[180px]">
                {nama || "Warga Terdaftar"}
              </span>
              <span className="text-[9px] text-slate-600 dark:text-slate-400 font-mono">NIK: {userNik || "..."}</span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl text-xs font-semibold border border-rose-500/20 transition-all cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* PRIMARY NAVIGATION SPLIT: PKKPR vs Pengaduan vs Survey SKM vs Testimoni */}
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-6 relative z-10">
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl backdrop-blur-xl grid grid-cols-2 lg:grid-cols-4 gap-2.5 shadow-xl">
          {/* Option 1: Pengajuan Izin PKKPR */}
          <button
            type="button"
            onClick={() => setMainArea("pkkpr")}
            className={`py-3 px-2.5 sm:px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-start gap-2.5 cursor-pointer min-h-[54px] ${
              mainArea === "pkkpr"
                ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/40"
                : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-300" />
            <div className="flex flex-col items-start text-left leading-tight min-w-0">
              <span className="font-bold text-xs sm:text-sm truncate">Izin PKKPR</span>
              <span className="text-xs opacity-80 font-normal hidden sm:inline truncate">Tata Ruang & Berusaha</span>
            </div>
            <span className="hidden xl:inline-block px-1.5 py-0.5 text-[8px] font-mono uppercase rounded-full bg-white/20 text-white ml-auto">
              UTAMA
            </span>
          </button>

          {/* Option 2: Kanal Pengaduan */}
          <button
            type="button"
            onClick={() => setMainArea("pengaduan")}
            className={`py-3 px-2.5 sm:px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-start gap-2.5 cursor-pointer min-h-[54px] ${
              mainArea === "pengaduan"
                ? "bg-gradient-to-r from-red-600 via-amber-600 to-orange-600 text-white shadow-lg shadow-red-500/25 ring-2 ring-red-400/40"
                : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <FileText className="w-5 h-5 shrink-0 text-amber-300" />
            <div className="flex flex-col items-start text-left leading-tight min-w-0">
              <span className="font-bold text-xs sm:text-sm truncate">Pengaduan</span>
              <span className="text-xs opacity-80 font-normal hidden sm:inline truncate">Aspirasi & Keluhan</span>
            </div>
            {complaints.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-mono font-bold rounded-full bg-white/20 text-white ml-auto">
                {complaints.length}
              </span>
            )}
          </button>

          {/* Option 3: Menu Survey Kepuasan Masyarakat (SKM) */}
          <button
            type="button"
            onClick={() => setMainArea("survey_skm")}
            className={`py-3 px-2.5 sm:px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-start gap-2.5 cursor-pointer min-h-[54px] ${
              mainArea === "survey_skm"
                ? "bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 text-white shadow-lg shadow-teal-500/25 ring-2 ring-teal-400/40"
                : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <Star className="w-5 h-5 shrink-0 text-amber-300 fill-amber-300/40" />
            <div className="flex flex-col items-start text-left leading-tight min-w-0">
              <span className="font-bold text-xs sm:text-sm truncate">Survei SKM</span>
              <span className="text-xs opacity-80 font-normal hidden sm:inline truncate">Kepuasan Pelayanan</span>
            </div>
            <span className="hidden xl:inline-block px-1.5 py-0.5 text-[8px] font-mono uppercase rounded-full bg-white/20 text-white ml-auto">
              IKM
            </span>
          </button>

          {/* Option 4: Menu Testimoni Pengguna */}
          <button
            type="button"
            onClick={() => setMainArea("testimoni")}
            className={`py-3 px-2.5 sm:px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-start gap-2.5 cursor-pointer min-h-[54px] ${
              mainArea === "testimoni"
                ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-400/40"
                : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <Sparkles className="w-5 h-5 shrink-0 text-cyan-300" />
            <div className="flex flex-col items-start text-left leading-tight min-w-0">
              <span className="font-bold text-xs sm:text-sm truncate">Testimoni Pengguna</span>
              <span className="text-xs opacity-80 font-normal hidden sm:inline truncate">Portal MPP Luwu</span>
            </div>
            <span className="hidden xl:inline-block px-1.5 py-0.5 text-[8px] font-mono uppercase rounded-full bg-white/20 text-white ml-auto">
              LIVE
            </span>
          </button>
        </div>
      </div>

      {/* PROFILE BANNER (AUTO-SYNC DARI REGISTRASI) */}
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 mt-6 relative z-10">
        <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm backdrop-blur-md transition-all">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-inner shrink-0">
              {(activeProfile?.full_name || hydratedProfile.nama || "M")[0].toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {activeProfile?.full_name || hydratedProfile.nama || "Masyarakat Publik"}
                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-mono">
                  TERVERIFIKASI
                </span>
              </h3>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /> NIK: {userNik || hydratedProfile.nik || "Tidak ada NIK"}</span>
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> WA: {kontak || extractPhone(activeProfile) || hydratedProfile.no_whatsapp || "Tidak ada Nomor"}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:pl-4 md:border-l border-slate-200 dark:border-slate-800">
            <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="text-left text-xs">
              <div className="font-semibold text-slate-900 dark:text-white">Lokasi Pendaftaran</div>
              <div className="text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                {kecamatan || hydratedProfile.kecamatan || activeProfile?.kecamatan 
                  ? `Kec. ${kecamatan || hydratedProfile.kecamatan || activeProfile?.kecamatan}, Desa ${desa || hydratedProfile.desa || activeProfile?.desa}`
                  : "Belum melengkapi domisili"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: PERMITTING ENGINE (PKKPR DUAL-PATHWAY MENU) */}
      {mainArea === "pkkpr" && (
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 mt-6 relative z-10 space-y-8 animate-in fade-in duration-300">
          {/* Header Banner */}
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm p-6 rounded-2xl relative overflow-hidden backdrop-blur-md">
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-3">
                <ShieldCheck className="w-4 h-4" />
                <span>Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) Kabupaten Luwu</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
                Pusat Permohonan Izin PKKPR Spasial
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Silakan pilih jalur perizinan sesuai dengan klasifikasi pemanfaatan ruang dan status badan usaha/perseorangan Anda.
                Sistem akan memvalidasi tumpang tindih spasial terhadap RTRW, RDTR, dan zona lindung secara otomatis.
              </p>
            </div>
          </div>

          {/* DUAL-PATHWAY PERMITTING MENU */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Card A: PKKPR Berusaha */}
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-md hover:border-blue-500 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Building2 className="w-7 h-7" />
                  </div>
                  <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono">
                    OSS-RBA NASIONAL
                  </span>
                </div>

                <div className="mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Kegiatan Komersial & Usaha
                  </span>
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight mt-1">
                    PKKPR Berusaha
                  </h3>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed font-medium">
                  Digunakan oleh pelaku usaha/investor untuk kegiatan komersial penghasil keuntungan seperti pabrik, toko, atau hotel. Terintegrasi sistem OSS nasional.
                </p>

                {/* Feature Checklist */}
                <div className="space-y-2.5 mb-8 border-t border-b border-slate-200 dark:border-slate-800 py-4">
                  <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Wajib NIB 13-Digit (OSS-RBA) & Profil Usaha</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Penilaian Zona Industri, Perdagangan & Jasa Komersial</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Validasi Geometri Spasial Terhadap RDTR/RTRW Perda Luwu No 06/2011</span>
                  </div>
                </div>
              </div>

              {/* Action Button A */}
              <button
                type="button"
                onClick={() => openSpatialPkkprForm('Berusaha')}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/30 active:scale-[0.98] transition-all cursor-pointer group"
              >
                <ShieldCheck className="w-5 h-5 text-emerald-200" />
                <span>Ajukan Izin Sekarang</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Card B: PKKPR Non-Berusaha */}
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-md hover:border-blue-500 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Home className="w-7 h-7" />
                  </div>
                  <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 font-mono">
                    PEMKAB LUWU
                  </span>
                </div>

                <div className="mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Non-Komersial / Perseorangan
                  </span>
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight mt-1">
                    PKKPR Non-Berusaha
                  </h3>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed font-medium">
                  Digunakan untuk pembuatan/perubahan hak atas tanah yang tidak bertujuan mencari keuntungan, seperti pembangunan rumah tinggal pribadi, tempat ibadah, atau fasilitas sosial/pemerintah.
                </p>

                {/* Feature Checklist */}
                <div className="space-y-2.5 mb-8 border-t border-b border-slate-200 dark:border-slate-800 py-4">
                  <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>Sertifikasi NIK 16-Digit (KTP Pemohon Perseorangan)</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>Pemeriksaan Sempadan Sungai, Sawah LP2B & Lahan Basah</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>Penerbitan Surat Keterangan Kesesuaian Tata Ruang PUPTR Luwu</span>
                  </div>
                </div>
              </div>

              {/* Action Button B */}
              <button
                type="button"
                onClick={() => openSpatialPkkprForm('Non-Berusaha')}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-600 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/30 active:scale-[0.98] transition-all cursor-pointer group"
              >
                <ShieldCheck className="w-5 h-5 text-indigo-200" />
                <span>Ajukan Izin Sekarang</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* MY SUBMITTED PKKPR PERMITS SECTION */}
          <div className={`p-4 sm:p-8 rounded-3xl border transition-all duration-300 ${
            isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-emerald-500" />
                  <span>Riwayat Permohonan Izin PKKPR Saya</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Daftar berkas perizinan PKKPR yang pernah diajukan ke Dinas PUPTR Kabupaten Luwu.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchMyPkkprApplications}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingPkkprApps ? "animate-spin" : ""}`} />
                <span>Segarkan Data</span>
              </button>
            </div>

            {loadingPkkprApps ? (
              <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                <p className="text-xs text-slate-600 dark:text-slate-400">Memuat berkas perizinan PKKPR Anda...</p>
              </div>
            ) : myPkkprApplications.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center px-4">
                <ShieldCheck className="w-12 h-12 text-slate-600 dark:text-slate-400 mb-3 opacity-60" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Belum Ada Permohonan PKKPR</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md leading-relaxed mb-6">
                  Anda belum memiliki permohonan PKKPR aktif. Silakan pilih salah satu jalur di atas ('PKKPR Berusaha' atau 'PKKPR Non-Berusaha') untuk mengajukan perizinan spasial baru.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myPkkprApplications.map((app) => (
                    <div
                    key={app.id || app.pkkpr_doc_number}
                    className={`p-5 rounded-3xl border transition-all shadow-sm ${
                      isDarkMode ? "bg-slate-950/80 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 text-[10px] font-mono font-extrabold rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {app.pkkpr_doc_number || "PKKPR-LUWU"}
                      </span>
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                        app.category === "Berusaha" ? "bg-emerald-500/10 text-emerald-500" : "bg-indigo-500/10 text-indigo-500"
                      }`}>
                        {app.category || "PKKPR Non-Berusaha"}
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-2 mb-2">
                      {app.title || app.judul || "Permohonan PKKPR Spasial"}
                    </h4>

                    <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 mb-4 font-medium">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Kec. {app.kecamatan || app.district_name || "-"}, Desa {app.desa || app.village_name || "-"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Diajukan: {app.created_at ? new Date(app.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) : "-"}</span>
                      </div>
                    </div>

                    {/* VISUAL PROGRESS BAR & TOOLTIPS */}
                    {(() => {
                      const isStep1Done = true;
                      const isStep2Done = app.pertanian_status === 'APPROVED' || app.status_pkkpr === 'Approved_Pertanian' || Boolean(app.berita_acara_pertanian_num) || app.status === 'Approved' || app.status === 'Published';
                      const isStep3Done = app.status === 'Approved' || app.status === 'Approved_PUPTR' || app.status === 'Published' || Boolean(app.pkkpr_doc_number && app.pkkpr_doc_number.includes('/'));
                      const isStep4Done = app.status === 'Published' || Boolean(app.sk_pkkpr_doc_number);
                      const progressPercent = isStep4Done ? 100 : isStep3Done ? 75 : isStep2Done ? 50 : 25;

                      return (
                        <div className="my-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-2.5">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-slate-700 dark:text-slate-300">Progress Permohonan:</span>
                            <span className="text-emerald-700 dark:text-emerald-400 font-mono font-black">{progressPercent}% Selesai</span>
                          </div>

                          {/* Progress Track Line */}
                          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-700 rounded-full"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>

                          {/* 4 Step Badges with Tooltips */}
                          <div className="grid grid-cols-4 gap-1.5 pt-1 text-[9px] font-bold text-center">
                            {/* Step 1 */}
                            <div className="group relative">
                              <div className={`p-1.5 rounded-lg border flex flex-col items-center gap-0.5 cursor-help ${
                                isStep1Done ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                              }`}>
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span className="truncate w-full">1. Berkas</span>
                              </div>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-44 p-2 bg-slate-950 text-white rounded-lg shadow-xl border border-slate-800 text-[10px] text-left opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-20">
                                <strong className="text-emerald-400 block">Tahap 1: Berkas &amp; Plot</strong>
                                Pengajuan dokumen tanah &amp; gambar poligon lahan selesai diverifikasi.
                              </div>
                            </div>

                            {/* Step 2 */}
                            <div className="group relative">
                              <div className={`p-1.5 rounded-lg border flex flex-col items-center gap-0.5 cursor-help ${
                                isStep2Done ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                              }`}>
                                {isStep2Done ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Clock className="w-3 h-3 text-amber-500 animate-pulse" />}
                                <span className="truncate w-full">2. LP2B</span>
                              </div>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-48 p-2 bg-slate-950 text-white rounded-lg shadow-xl border border-slate-800 text-[10px] text-left opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-20">
                                <strong className="text-amber-400 block">Tahap 2: Dinas Pertanian</strong>
                                Verifikasi perlindungan sawah abadi LP2B dan penerbitan BAP Pertanian.
                              </div>
                            </div>

                            {/* Step 3 */}
                            <div className="group relative">
                              <div className={`p-1.5 rounded-lg border flex flex-col items-center gap-0.5 cursor-help ${
                                isStep3Done ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : isStep2Done ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-60'
                              }`}>
                                {isStep3Done ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : isStep2Done ? <Clock className="w-3 h-3 text-amber-500 animate-pulse" /> : <Lock className="w-3 h-3 text-slate-400" />}
                                <span className="truncate w-full">3. PUPTR</span>
                              </div>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-48 p-2 bg-slate-950 text-white rounded-lg shadow-xl border border-slate-800 text-[10px] text-left opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-20">
                                <strong className="text-blue-400 block">Tahap 3: Dinas PUPTR</strong>
                                Kajian teknis tata ruang RTRW, sempadan jalan/sungai &amp; persetujuan Pertek.
                              </div>
                            </div>

                            {/* Step 4 */}
                            <div className="group relative">
                              <div className={`p-1.5 rounded-lg border flex flex-col items-center gap-0.5 cursor-help ${
                                isStep4Done ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30' : isStep3Done ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-60'
                              }`}>
                                {isStep4Done ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : isStep3Done ? <Clock className="w-3 h-3 text-blue-500 animate-pulse" /> : <Lock className="w-3 h-3 text-slate-400" />}
                                <span className="truncate w-full">4. Terbit</span>
                              </div>
                              <div className="absolute bottom-full right-0 mb-1.5 w-48 p-2 bg-slate-950 text-white rounded-lg shadow-xl border border-slate-800 text-[10px] text-left opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-20">
                                <strong className="text-emerald-400 block">Tahap 4: SK DPMPTSP</strong>
                                Penerbitan Surat Keputusan PKKPR resmi bertanda tangan elektronik (TTE).
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                      {/* Technical Notes & Conditional BAP Penolakan Button */}
                      {(app.status_pkkpr === 'Requires Revision' || app.status === 'Requires Revision' || app.status === 'REJECTED' || app.pertanian_status === 'REJECTED' || app.pertanian_rejection_notes) && (
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-300">
                            <span className="flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                              <span>Catatan Evaluasi / Penolakan Teknis:</span>
                            </span>
                            {(app.berita_acara_pertanian_num || app.pertek_puptr_num) && (
                              <span className="font-mono text-[10px] bg-rose-200/60 dark:bg-rose-900/60 px-1.5 py-0.5 rounded">
                                BAP No. {app.berita_acara_pertanian_num || app.pertek_puptr_num}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-700 dark:text-slate-300 italic">
                            "{app.catatan_teknis || app.pertanian_rejection_notes || 'Permohonan memerlukan perbaikan deliniasi spasial atau kelengkapan berkas.'}"
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRejectionApp(app);
                              setIsRejectionModalOpen(true);
                            }}
                            className="mt-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Lihat BAP Penolakan &amp; Rekomendasi</span>
                          </button>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          app.status_pkkpr === 'Requires Revision' || app.status === 'Requires Revision'
                            ? 'text-rose-700 dark:text-rose-300 bg-rose-500/10 border border-rose-500/30'
                            : 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20'
                        }`}>
                          {app.pkkpr_status || app.status || "Menunggu Verifikasi PUPTR"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {app.berkas_gabungan_pdf && (
                            <a
                              href={app.berkas_gabungan_pdf}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>PDF Berkas</span>
                            </a>
                          )}

                          {/* Tombol Unduh SK PKKPR Resmi (Hanya tampil saat status TERBIT / 100% / APPROVED) */}
                          {(app.status === 'APPROVED' || app.status === 'IZIN_TERBIT' || app.status_permohonan === 'IZIN_TERBIT' || app.pkkpr_status?.includes('Terbit') || app.pkkpr_status?.includes('APPROVED') || app.progress === 100) && (
                            <button
                              type="button"
                              disabled={isDownloadingSkId === String(app.id || 'current')}
                              onClick={() => handleDownloadSkPkkprMasyarakat(app)}
                              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-700/60 text-white transition-all flex items-center gap-1 shadow-sm cursor-pointer disabled:cursor-not-allowed active:scale-95"
                              title="Unduh berkas resmi Surat Keputusan (SK) PKKPR format PDF"
                            >
                              {isDownloadingSkId === String(app.id || 'current') ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                              <span>{isDownloadingSkId === String(app.id || 'current') ? 'Mengunduh...' : 'Unduh SK PKKPR'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: EXISTING KANAL PENGADUAN UI */}
      {mainArea === "pengaduan" && (
        <>
          {/* ANDROID-FIRST NAVIGATION TAB BAR FOR COMPLAINTS */}
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-6 relative z-10">
            <div className={`p-1.5 rounded-2xl border backdrop-blur-md flex items-center justify-between gap-1 shadow-md ${
              isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
            }`}>
              <button
                type="button"
                onClick={() => setActiveTab("form")}
                className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[48px] ${
                  activeTab === "form"
                    ? "bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg shadow-red-500/20"
                    : isDarkMode ? "text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-800/50" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Buat Laporan Baru</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[48px] ${
                  activeTab === "history"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                    : isDarkMode ? "text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-800/50" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Riwayat Aduan Saya</span>
                {complaints.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
                    activeTab === "history" ? "bg-white/20 text-white" : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                  }`}>
                    {complaints.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("sla_info")}
                className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[48px] ${
                  activeTab === "sla_info"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20"
                    : isDarkMode ? "text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-800/50" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Standar SLA & SOP</span>
                <span className="sm:hidden">SLA Ombudsman</span>
              </button>
            </div>
          </div>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 mt-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Grievance Form (lg:col-span-6) */}
        <div className={`lg:col-span-6 flex-col gap-6 ${activeTab === "form" ? "flex" : "hidden lg:flex"}`}>
          <div className={`p-4 sm:p-6 pb-32 md:pb-6 rounded-3xl border backdrop-blur-md transition-all duration-300 ${
            isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <div className="flex items-center gap-2 mb-4">
              {tipeLaporan === "Pengaduan" ? (
                <FileText className="w-5 h-5 text-red-500" />
              ) : tipeLaporan === "Aspirasi" ? (
                <AlertOctagon className="w-5 h-5 text-blue-500" />
              ) : (
                <HelpCircle className="w-5 h-5 text-emerald-500" />
              )}
              <h2 className={`text-xl md:text-2xl font-bold font-display ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                {tipeLaporan === "Pengaduan"
                  ? "Formulir Pengaduan Spasial & Perizinan"
                  : tipeLaporan === "Aspirasi"
                  ? "Formulir Aspirasi & Masukan Masyarakat"
                  : "Formulir Permintaan Informasi Publik"}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tipe Klasifikasi Laporan (PermenPANRB No. 62/2018 Standard) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-base font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Tipe Klasifikasi Laporan
                  </label>
                  <span className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">
                    PermenPANRB No. 62/2018
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "Pengaduan", label: "Pengaduan", color: "red" },
                    { id: "Aspirasi", label: "Aspirasi", color: "blue" },
                    { id: "Permintaan Informasi", label: "Informasi", color: "emerald" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectTipeLaporan(item.id as any)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[56px] ${
                        tipeLaporan === item.id
                          ? item.color === "red"
                            ? "bg-red-500/15 border-red-500/40 text-red-500 dark:text-red-400 shadow-sm font-bold"
                            : item.color === "blue"
                            ? "bg-blue-500/15 border-blue-500/40 text-blue-500 dark:text-blue-400 shadow-sm font-bold"
                            : "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold"
                          : isDarkMode
                          ? "bg-slate-950/60 border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-700"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-base font-bold leading-none">{item.label}</span>
                      
                    </button>
                  ))}
                </div>
              </div>

              <div className={`text-base leading-relaxed p-4 rounded-2xl border ${
                isDarkMode ? "bg-slate-800/50 border-slate-700 text-slate-300" : "bg-slate-100 border-slate-300 text-slate-800 dark:text-slate-200"
              }`}>
                Laporan Anda dijamin kerahasiaannya dan diikat secara hukum menggunakan identitas NIK Anda (<span className="font-mono font-bold text-emerald-500">{userNik || "..."}</span>) untuk mencegah laporan palsu/spam.
              </div>

              {/* Nama Pelapor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-base font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Nama Lengkap (Sesuai KTP)
                  </label>
                  <span className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700 dark:text-emerald-400" /> Terverifikasi KTP
                  </span>
                </div>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Nama Lengkap (Sesuai KTP)"
                    className={`w-full pl-10 pr-4 py-4.5 rounded-xl border text-base font-semibold transition-all ${
                      isDarkMode
                        ? "bg-slate-900/90 border-slate-800 text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    }`}
                  />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="anonToggle"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer"
                  />
                  <label htmlFor="anonToggle" className={`text-base cursor-pointer ${isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600"}`}>
                    Sembunyikan nama saya dari publik (Anonim) - <span className="text-emerald-500 dark:text-emerald-400 font-medium">Identitas tetap dijamin aman oleh sistem Inspektorat.</span>
                  </label>
                </div>
              </div>

              {/* Kontak Pelapor (Nomor WhatsApp) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-base font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Nomor WhatsApp Pelapor
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const phone = extractPhone(activeProfile);
                      if (phone) {
                        setKontak(phone);
                      } else {
                        supabase.auth.getUser().then(({ data: { user } }) => {
                          if (user) {
                            const uPhone = extractPhone(user) || extractPhone(user.user_metadata);
                            if (uPhone) setKontak(uPhone);
                          }
                        });
                      }
                    }}
                    className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Shield className="w-3 h-3 text-emerald-700 dark:text-emerald-400" /> Auto-fill Registrasi
                  </button>
                </div>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  <input
                    type="text"
                    value={kontak}
                    onChange={(e) => setKontak(e.target.value)}
                    placeholder="Ketik nomor WhatsApp aktif (contoh: 08123456789)..."
                    className={`w-full pl-10 pr-4 py-4.5 rounded-xl border text-base font-mono font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isDarkMode
                        ? "bg-slate-950 border-slate-800 text-emerald-700 dark:text-emerald-400 focus:border-emerald-500"
                        : "bg-slate-50 border-slate-200 text-emerald-700 focus:border-emerald-500 focus:bg-white"
                    }`}
                  />
                </div>
              </div>

              {/* Wilayah & Geotag Spasial */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-base font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Lokasi & Koordinat Spasial (Geotag)
                  </label>
                  <span className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-blue-700 dark:text-blue-400" /> Auto-fill Wilayah
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Dropdowns for Kecamatan & Desa */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Kecamatan Dropdown */}
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <select
                        required
                        disabled={loadingKecamatan || !!activeProfile?.kecamatan}
                        value={selectedKecamatanId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedKecamatanId(val);
                          const kObj = kecamatanList.find(k => String(k.id) === String(val));
                          const kName = kObj?.kecamatan || kObj?.nama_kecamatan || kObj?.name || val;
                          let finalGeomObj = kObj?.geojson || kObj?.geom || kObj?.geometry || null; if(typeof finalGeomObj === "string") { try { finalGeomObj = JSON.parse(finalGeomObj); } catch(e){} } setSelectedKecamatanPolygon(finalGeomObj);
                          setKecamatan(kName);
                          setLokasi(kName);
                          setDesa("");
                        }}
                        className={`w-full pl-10 pr-10 py-4.5 rounded-xl border text-base font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${
                          isDarkMode
                            ? "bg-slate-950 border-slate-800 text-white focus:border-blue-500 disabled:opacity-50"
                            : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white disabled:opacity-50"
                        }`}
                      >
                        <option value="" disabled>
                          {loadingKecamatan ? "Memuat Kecamatan..." : "-- Pilih Kecamatan Kejadian --"}
                        </option>
                        {kecamatanList.map((d) => (
                          <option key={d.id} value={d.id}>Kecamatan {d.kecamatan || d.nama_kecamatan || d.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 dark:text-slate-400">
                        {loadingKecamatan ? <Loader2 className="w-4 h-4 animate-spin" /> : "▼"}
                      </div>
                    </div>

                    {/* Desa Dropdown */}
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <select
                        required
                        disabled={loadingDesa || !selectedKecamatanId || !!activeProfile?.desa}
                        value={desa}
                        onChange={(e) => {
                          setDesa(e.target.value);
                        }}
                        className={`w-full pl-10 pr-10 py-4.5 rounded-xl border text-base font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${
                          isDarkMode
                            ? "bg-slate-950 border-slate-800 text-white focus:border-blue-500 disabled:opacity-50"
                            : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white disabled:opacity-50"
                        }`}
                      >
                        <option value="" disabled>
                          {loadingDesa ? "Memuat Desa..." : "-- Pilih Desa / Kelurahan --"}
                        </option>
                        {desaList.map((d) => (
                          <option key={d.id} value={d.desa || d.nama_desa || d.name}>{d.desa || d.nama_desa || d.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 dark:text-slate-400">
                        {loadingDesa ? <Loader2 className="w-4 h-4 animate-spin" /> : "▼"}
                      </div>
                    </div>
                  </div>

                  {/* Geotag Button & GPS Coordinates badge */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleGetLocation(true)}
                      disabled={isGettingLocation}
                      className={`flex-1 py-2 px-3 border rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                        isDarkMode 
                          ? "bg-slate-950/80 border-slate-800 hover:bg-slate-800 text-slate-300" 
                          : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {isGettingLocation ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                      <span>{coords ? "Dapatkan Ulang GPS" : "Dapatkan GPS Otomatis"}</span>
                    </button>

                    <div className={`px-3 py-2 rounded-xl border text-sm font-mono flex items-center gap-1.5 ${
                      coords ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${coords ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                      {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "GPS tidak terkunci"}
                    </div>
                  </div>
                </div>
              </div>

              {/* DYNAMIC FIELD SECTION ACCORDING TO PERMENPANRB CLASSIFICATION */}
              {tipeLaporan === "Pengaduan" ? (
                <div className="space-y-5 pt-1">
                  <label className="block text-base font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-500" />
                    Detail Laporan Pengaduan
                  </label>

                  {/* Pilihan 1: Pihak Diadukan */}
                  <div>
                    <span className="block text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      1. Pihak Yang Diadukan
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTargetAduan("Penyelenggara Perizinan (DPMPTSP Kab. Luwu)");
                          setJenisAduan(PENYELENGGARA_ADUAN_OPTIONS[0]);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                          targetAduan === "Penyelenggara Perizinan (DPMPTSP Kab. Luwu)"
                            ? "bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-400 ring-1 ring-blue-500"
                            : isDarkMode
                            ? "bg-slate-950/60 border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-700"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                          targetAduan === "Penyelenggara Perizinan (DPMPTSP Kab. Luwu)"
                            ? "border-blue-500 bg-blue-500"
                            : "border-slate-500"
                        }`}>
                          {targetAduan === "Penyelenggara Perizinan (DPMPTSP Kab. Luwu)" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <div>
                          <div className={`text-base font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                            Penyelenggara Perizinan
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                            DPMPTSP Kab. Luwu
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTargetAduan("Investor/Perusahaan");
                          setJenisAduan(INVESTOR_ADUAN_OPTIONS[0]);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                          targetAduan === "Investor/Perusahaan"
                            ? "bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500"
                            : isDarkMode
                            ? "bg-slate-950/60 border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-700"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                          targetAduan === "Investor/Perusahaan"
                            ? "border-amber-500 bg-amber-500"
                            : "border-slate-500"
                        }`}>
                          {targetAduan === "Investor/Perusahaan" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <div>
                          <div className={`text-base font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                            Investor / Perusahaan
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                            Pelanggaran Kegiatan Usaha
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Pilihan 2: Jenis Aduan */}
                  <div>
                    <span className="block text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      2. Jenis Aduan / Pelanggaran
                    </span>
                    <div className="relative">
                      <AlertCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 dark:text-slate-400 pointer-events-none" />
                      <select
                        value={jenisAduan}
                        onChange={(e) => setJenisAduan(e.target.value)}
                        className={`w-full pl-10 pr-10 py-4.5 rounded-xl border text-base transition-all focus:outline-none focus:ring-2 appearance-none cursor-pointer ${
                          targetAduan === "Investor/Perusahaan"
                            ? "focus:ring-amber-500"
                            : "focus:ring-blue-500"
                        } ${
                          isDarkMode
                            ? "bg-slate-950 border-slate-800 text-white"
                            : "bg-slate-50 border-slate-200 text-slate-900"
                        }`}
                      >
                        {(targetAduan === "Penyelenggara Perizinan (DPMPTSP Kab. Luwu)"
                          ? PENYELENGGARA_ADUAN_OPTIONS
                          : INVESTOR_ADUAN_OPTIONS
                        ).map((opt, idx) => (
                          <option key={opt} value={opt}>
                            {idx + 1}. {opt}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 dark:text-slate-400 text-base">
                        ▼
                      </div>
                    </div>
                  </div>
                </div>
              ) : tipeLaporan === "Aspirasi" ? (
                <div className="space-y-5 pt-1">
                  <label className="block text-base font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <AlertOctagon className="w-3.5 h-3.5 text-blue-500" />
                    Topik & Sektor Aspirasi
                  </label>
                  <div className="relative">
                    <AlertOctagon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 pointer-events-none" />
                    <select
                      value={jenisAduan}
                      onChange={(e) => setJenisAduan(e.target.value)}
                      className={`w-full pl-10 pr-10 py-4.5 rounded-xl border text-base transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer ${
                        isDarkMode
                          ? "bg-slate-950 border-slate-800 text-white"
                          : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    >
                      {ASPIRASI_TOPIK_OPTIONS.map((opt, idx) => (
                        <option key={opt} value={opt}>
                          {idx + 1}. {opt}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 dark:text-slate-400 text-base">
                      ▼
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 pt-1">
                  <label className="block text-base font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
                    Kategori Informasi Yang Dibutuhkan
                  </label>
                  <div className="relative">
                    <HelpCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
                    <select
                      value={jenisAduan}
                      onChange={(e) => setJenisAduan(e.target.value)}
                      className={`w-full pl-10 pr-10 py-4.5 rounded-xl border text-base transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer ${
                        isDarkMode
                          ? "bg-slate-950 border-slate-800 text-white"
                          : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    >
                      {INFORMASI_KATEGORI_OPTIONS.map((opt, idx) => (
                        <option key={opt} value={opt}>
                          {idx + 1}. {opt}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 dark:text-slate-400 text-base">
                      ▼
                    </div>
                  </div>
                </div>
              )}

              {/* Bukti Foto / Dokumen Pendukung */}
              <div className="animate-fade-in-up">
                <label className="block text-base font-semibold uppercase tracking-wider mb-2 text-slate-600 dark:text-slate-400">
                  {tipeLaporan === "Pengaduan" ? "Bukti Foto Lapangan / Dokumen Pendukung" : "Lampiran Dokumen / Konsep Gagasan (Opsional)"}
                </label>
                
                <div className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all ${
                  isDarkMode 
                    ? "border-slate-800 bg-slate-950/50 hover:border-emerald-500/50" 
                    : "border-slate-300 bg-slate-50 hover:border-emerald-500/50"
                }`}>
                  {file ? (
                    <div className="flex flex-col items-center gap-2">
                      {file.type.startsWith("image/") && (
                        <div className="w-full h-48 bg-slate-900/80 rounded-xl flex items-center justify-center overflow-hidden mb-1 border border-slate-700/50 p-1">
                          <img src={URL.createObjectURL(file)} alt="Preview" className="object-contain h-full max-w-full rounded-lg" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-emerald-500 font-medium text-base bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 max-w-full truncate">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setFile(null)}
                        className="text-base text-rose-500 hover:text-rose-400 font-bold mt-1 cursor-pointer transition-colors"
                      >
                        Hapus Foto & Ganti
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-center items-center gap-3 mb-2.5">
                        {/* OPTION 1: LIVE CAMERA */}
                        <label className={`flex flex-col items-center justify-center w-28 sm:w-32 h-22 rounded-xl cursor-pointer transition-all border group p-2 ${
                          isDarkMode 
                            ? "bg-slate-900 hover:bg-slate-800 border-slate-800 hover:border-emerald-500/50" 
                            : "bg-white hover:bg-slate-100 border-slate-200 hover:border-emerald-500/50 shadow-sm"
                        }`}>
                          <Camera className="w-6 h-6 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                          <span className={`text-sm font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>Buka Kamera</span>
                          <span className="text-sm text-slate-600 dark:text-slate-400">Foto Langsung</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment"
                            className="hidden" 
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                          />
                        </label>

                        {/* OPTION 2: GALLERY */}
                        <label className={`flex flex-col items-center justify-center w-28 sm:w-32 h-22 rounded-xl cursor-pointer transition-all border group p-2 ${
                          isDarkMode 
                            ? "bg-slate-900 hover:bg-slate-800 border-slate-800 hover:border-blue-500/50" 
                            : "bg-white hover:bg-slate-100 border-slate-200 hover:border-blue-500/50 shadow-sm"
                        }`}>
                          <ImageIcon className="w-6 h-6 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                          <span className={`text-sm font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>Pilih Galeri</span>
                          <span className="text-sm text-slate-600 dark:text-slate-400">Foto / File PDF</span>
                          <input 
                            type="file" 
                            accept="image/*,.pdf" 
                            className="hidden" 
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Maksimal ukuran file 5MB. Gunakan kamera untuk bukti Real-Time.</p>
                    </>
                  )}
                </div>
              </div>

              {/* CONDITIONAL TARGET FIELD (ONLY FOR PENGADUAN) */}
              {tipeLaporan === "Pengaduan" && (
                <>
                  {targetAduan.includes("Penyelenggara") ? (
                    <div className="animate-fade-in-up">
                      <label className="block text-base font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                        Unit Layanan MPP Simpurusiang
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 dark:text-slate-400 pointer-events-none z-10" />
                        <select
                          value={unitMpp}
                          onChange={(e) => setUnitMpp(e.target.value)}
                          className={`w-full pl-10 pr-10 py-4.5 rounded-xl border text-base transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer ${
                            isDarkMode
                              ? "bg-slate-950 border-slate-800 text-white"
                              : "bg-slate-50 border-slate-200 text-slate-900"
                          }`}
                        >
                          <option value="" disabled>-- Pilih Unit Layanan --</option>
                          <option value="Front Office">1. Front Office</option>
                          <option value="Bagian Pengawasan">2. Bagian Pengawasan</option>
                          <option value="Gerai Layanan MPP">3. Gerai Layanan MPP</option>
                          <option value="Lain-lain">4. Lain-lain</option>
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 dark:text-slate-400 text-base">
                          ▼
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-fade-in-up">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-base font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                          Nama Perusahaan Terkait (Opsional)
                        </label>
                        {loadingCompanies ? (
                          <span className="text-xs text-blue-700 dark:text-blue-400 font-mono animate-pulse flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin text-blue-700 dark:text-blue-400" /> Memuat data...
                          </span>
                        ) : companyList.length > 0 ? (
                          <span className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-blue-700 dark:text-blue-400" /> {companyList.length} Terdaftar
                          </span>
                        ) : (
                          <span className="text-xs bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                            <Info className="w-3 h-3 text-slate-600 dark:text-slate-400" /> 0 Terdaftar
                          </span>
                        )}
                      </div>

                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 dark:text-slate-400 z-10" />

                        {isManualCompanyInput ? (
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              value={perusahaan}
                              onChange={(e) => setPerusahaan(e.target.value)}
                              placeholder="Ketik nama perusahaan terkait..."
                              className={`w-full pl-10 pr-24 py-4.5 rounded-xl border text-base transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                isDarkMode
                                  ? "bg-slate-950 border-slate-800 text-white focus:border-blue-500"
                                  : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setIsManualCompanyInput(false);
                                setPerusahaan("");
                              }}
                              className="absolute right-2 text-base text-blue-700 dark:text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 px-2 py-1 rounded-lg transition-colors font-medium cursor-pointer"
                            >
                              Pilih Daftar
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            <select
                              value={perusahaan}
                              onChange={(e) => {
                                if (e.target.value === "__MANUAL__") {
                                  setIsManualCompanyInput(true);
                                  setPerusahaan("");
                                } else {
                                  setPerusahaan(e.target.value);
                                }
                              }}
                              className={`w-full pl-10 pr-10 py-4.5 rounded-xl border text-base transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer ${
                                isDarkMode
                                  ? "bg-slate-950 border-slate-800 text-white focus:border-blue-500"
                                  : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white"
                              }`}
                            >
                              {companyList.length === 0 ? (
                                <option value="">Belum ada data Investor/Perusahaan.</option>
                              ) : (
                                <>
                                  <option value="">-- Pilih Investor / Perusahaan Terdaftar ({companyList.length}) --</option>
                                  {companyList.map((comp) => (
                                    <option key={comp} value={comp}>
                                      {comp}
                                    </option>
                                  ))}
                                </>
                              )}
                              <option value="__MANUAL__">+ Ketik Manual Nama Perusahaan Lainnya...</option>
                            </select>
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 dark:text-slate-400 text-base">
                              ▼
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Deskripsi Masalah / Aspirasi / Pertanyaan */}
              <div>
                <label className="block text-base font-semibold uppercase tracking-wider mb-2 text-slate-600 dark:text-slate-400">
                  {tipeLaporan === "Pengaduan"
                    ? "Uraian Kejadian / Detil Pengaduan"
                    : tipeLaporan === "Aspirasi"
                    ? "Uraian Aspirasi & Gagasan Masukan"
                    : "Detail Pertanyaan / Informasi Yang Dibutuhkan"}
                </label>
                <textarea
                  required
                  rows={6}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  onFocus={(e) => {
                    setTimeout(() => {
                      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                  }}
                  placeholder={
                    tipeLaporan === "Pengaduan"
                      ? "Uraikan laporan pengaduan secara objektif, kronologi kejadian, dan dampak yang ditimbulkan..."
                      : tipeLaporan === "Aspirasi"
                      ? "Tuliskan saran, masukan, atau gagasan inovasi Anda untuk kemajuan pelayanan publik, iklim investasi, dan tata ruang di Kabupaten Luwu..."
                      : "Uraikan secara jelas pertanyaan atau permohonan informasi perizinan, tata ruang RTRW, atau prosedur yang ingin Anda dapatkan..."
                  }
                  className={`w-full p-4 rounded-xl border text-base transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isDarkMode
                      ? "bg-slate-950 border-slate-800 text-white focus:border-emerald-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white"
                  }`}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 px-4 mt-2 rounded-xl text-white font-bold text-base tracking-widest uppercase transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                  tipeLaporan === "Pengaduan"
                    ? "bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 shadow-red-500/20"
                    : tipeLaporan === "Aspirasi"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>MENGIRIM LAPORAN...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      {tipeLaporan === "Pengaduan"
                        ? "Kirim Pengaduan Resmi"
                        : tipeLaporan === "Aspirasi"
                        ? "Kirim Aspirasi Masyarakat"
                        : "Ajukan Permintaan Informasi"}
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Tracking Table & SOP (lg:col-span-6) */}
        <div className={`lg:col-span-6 flex-col gap-6 ${activeTab !== "form" ? "flex" : "hidden lg:flex"}`}>
          <div className={`p-4 sm:p-6 rounded-3xl border backdrop-blur-md transition-all duration-300 ${
            isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xl md:text-2xl font-bold font-display">Status Pemantauan Aduan Anda</h2>
              </div>

              <button
                onClick={fetchMyComplaints}
                className={`p-2 rounded-xl border transition-all active:scale-95 flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer ${
                  isDarkMode ? "bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800" : "bg-slate-100 border-slate-200 text-slate-800 dark:text-slate-200 hover:bg-slate-200"
                }`}
                title="Muat Ulang Riwayat"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Segarkan</span>
              </button>
            </div>

            {loadingComplaints ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                <p className="text-xs text-slate-600 dark:text-slate-400">Menghubungkan ke pusat data aduan...</p>
              </div>
            ) : complaints.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-24 px-4">
                <AlertOctagon className="w-12 h-12 text-slate-600 dark:text-slate-400 mb-4 stroke-1 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Belum Ada Pengaduan</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs leading-relaxed">
                  Semua aduan resmi yang Anda kirim akan otomatis tercantum di sini lengkap dengan status verifikasi terbaru.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800/10">
                <table className="w-full text-left text-xs">
                  <thead className={`${isDarkMode ? "bg-slate-950 text-slate-600 dark:text-slate-400" : "bg-slate-50 text-slate-600"} uppercase font-mono font-bold tracking-wider border-b border-slate-800/10`}>
                    <tr>
                      <th className="p-4">ID Tiket</th>
                      <th className="p-4">Tanggal</th>
                      <th className="p-4">Kecamatan</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/10">
                    {complaints.map((c) => {
                      const dateStr = c.created_at ? new Date(c.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      }) : "-";
                      
                      return (
                        <tr key={c.id} className={`transition-all hover:bg-slate-500/5`}>
                          <td className="p-4 font-mono font-bold text-red-700 dark:text-red-400">{c.tiket_id || `LAPOR-${c.id.substring(0,6).toUpperCase()}`}</td>
                          <td className="p-4 text-slate-600 dark:text-slate-400 font-mono">{dateStr}</td>
                          <td className="p-4 font-semibold text-xs sm:text-sm">{c.lokasi_kejadian || "-"}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-extrabold tracking-wider uppercase border block text-center ${
                              c.status === "Selesai" 
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                : c.status === "Sedang Ditinjau Dalak" || c.status === "Verifikasi Dalak Berjalan"
                                ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                                : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                            }`}>
                              {c.status || "Menunggu Verifikasi"}
                            </span>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 text-center font-bold font-mono uppercase tracking-tight">SLA: Maks. 3x24 Jam</p>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => setSelectedComplaint(c)}
                              className="p-1.5 bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-700 dark:text-blue-400 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center"
                              title="Detail Laporan"
                            >
                              <Eye className="w-4 h-4" />
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

          {/* SOP Card to balance vertical symmetry */}
          <div className={`rounded-xl p-6 border transition-all duration-300 ${
            isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <h3 className={`text-sm font-bold flex items-center gap-2 mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              <ShieldCheck className="w-5 h-5 text-emerald-500"/>
              Alur Tindak Lanjut Pengaduan
            </h3>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 dark:before:via-slate-700 before:to-transparent">
              {/* Step 1 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-emerald-500 bg-white dark:bg-slate-900 text-emerald-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_10px_rgba(16,185,129,0.4)] z-10"></div>
                <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <p className={`text-xs font-bold mb-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>1. Verifikasi (1x24 Jam)</p>
                  <p className={`text-[10px] ${isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600"}`}>Tim Admin DPMPTSP & Inspektorat mengecek keabsahan KTP, Foto, dan Titik Koordinat GPS.</p>
                </div>
              </div>
              {/* Step 2 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"></div>
                <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <p className={`text-xs font-bold mb-1 ${isDarkMode ? "text-slate-300" : "text-slate-800 dark:text-slate-200"}`}>2. Tindak Lanjut Lapangan</p>
                  <p className={`text-[10px] ${isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600"}`}>Satgas Dalak diturunkan ke titik koordinat laporan untuk mediasi atau investigasi.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
        </>
      )}

      {/* SECTION 3: MENU SURVEY KEPUASAN MASYARAKAT (SKM) */}
      {mainArea === "survey_skm" && (
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 mt-6 relative z-10 animate-in fade-in duration-300">
          <MppCitizenSurveyMenu
            userType="masyarakat"
            isLoggedIn={true}
            defaultNik={userNik || activeProfile?.nik || ""}
            defaultPhone={kontak || extractPhone(activeProfile)}
            defaultName={nama || ""}
            isDarkMode={isDarkMode}
          />
        </div>
      )}

      {/* SECTION 4: MENU TESTIMONI PENGGUNA */}
      {mainArea === "testimoni" && (
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 mt-6 relative z-10 animate-in fade-in duration-300">
          <MppCitizenTestimonialMenu
            userType="masyarakat"
            defaultName={nama || ""}
            isDarkMode={isDarkMode}
          />
        </div>
      )}

      {/* Detail Modal Pop-up (Interactive Single-view Detail Pane) */}
      <AnimatePresence>
        {selectedComplaint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedComplaint(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className={`relative w-full max-w-2xl rounded-3xl border overflow-hidden z-10 transition-all duration-300 ${
                isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-950"
              }`}
            >
              {/* Header */}
              <div className="relative p-6 border-b border-slate-500/10 flex items-center justify-between bg-gradient-to-r from-red-500/5 to-amber-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/20 text-red-700 dark:text-red-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-red-500 tracking-wider">LAPOR LUWU! TICKET</span>
                    <h3 className={`text-xl md:text-2xl font-bold font-display tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      Detail Tiket {selectedComplaint.tiket_id || `LAPOR-${selectedComplaint.id.substring(0,6).toUpperCase()}`}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="p-1.5 rounded-full hover:bg-slate-500/10 text-slate-600 dark:text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-600 dark:text-slate-400 font-mono block mb-1">Status Verifikasi</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border tracking-wider ${
                      selectedComplaint.status === "Selesai" 
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                        : selectedComplaint.status === "Sedang Ditinjau Dalak" || selectedComplaint.status === "Verifikasi Dalak Berjalan"
                        ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                    }`}>
                      {selectedComplaint.status || "Menunggu Verifikasi"}
                    </span>
                  </div>

                  <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-600 dark:text-slate-400 font-mono block mb-1">Tanggal Aduan</span>
                    <span className="text-xs font-semibold">
                      {selectedComplaint.created_at ? new Date(selectedComplaint.created_at).toLocaleDateString("id-ID", {
                        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                      }) : "-"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs uppercase font-mono font-bold text-slate-600 dark:text-slate-400 tracking-wider">Lokasi Kejadian</h4>
                    <p className="text-sm font-semibold">{selectedComplaint.lokasi_kejadian || "Kecamatan -"}</p>
                    {selectedComplaint.latitude && selectedComplaint.longitude && (
                      <p className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 mt-1">📍 GPS: {selectedComplaint.latitude.toFixed(6)}, {selectedComplaint.longitude.toFixed(6)}</p>
                    )}
                  </div>

                  {selectedComplaint.perusahaan_terkait && (
                    <div>
                      <h4 className="text-xs uppercase font-mono font-bold text-slate-600 dark:text-slate-400 tracking-wider">Perusahaan Terkait</h4>
                      <p className="text-sm font-semibold">{selectedComplaint.perusahaan_terkait}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs uppercase font-mono font-bold text-slate-600 dark:text-slate-400 tracking-wider">Uraian / Deskripsi Aduan</h4>
                    <p className={`text-xs leading-relaxed p-4 rounded-2xl border mt-1.5 whitespace-pre-wrap ${
                      isDarkMode ? "bg-slate-950/80 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}>
                      {selectedComplaint.deskripsi_masalah}
                    </p>
                  </div>

                  {/* Bukti Foto */}
                  {selectedComplaint.bukti_foto_url && (
                    <div>
                      <h4 className="text-xs uppercase font-mono font-bold text-slate-600 dark:text-slate-400 tracking-wider mb-2">Foto Bukti Lapangan</h4>
                      <div className="relative rounded-2xl overflow-hidden border border-slate-800/20 max-h-64">
                        <img 
                          src={selectedComplaint.bukti_foto_url} 
                          alt="Bukti Foto Lapangan" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  )}

                  {/* Feedback / Tindak Lanjut dari Administrator */}
                  <div className={`p-4 rounded-2xl border ${
                    selectedComplaint.status === "Selesai" 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" 
                      : "bg-slate-950/50 border-slate-800 text-slate-600 dark:text-slate-400"
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 shrink-0 text-amber-500" />
                      <span className="text-xs uppercase font-mono font-bold tracking-wider">Tanggapan / Tindak Lanjut Bidang Dalak</span>
                    </div>
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">
                      {selectedComplaint.catatan_admin || selectedComplaint.laporan_dalak || "Belum ada catatan mediasi / tindak lanjut dari Dinas Penanaman Modal. Petugas Dalak akan memperbarui detail ini setelah verifikasi lapangan."}
                    </p>
                  </div>

                  {/* SURVEI KEPUASAN MASYARAKAT (SKM) - OMBUDSMAN RI STANDARD */}
                  {selectedComplaint.status === "Selesai" && (
                    <div className={`p-4 rounded-2xl border ${
                      isDarkMode ? "bg-amber-500/10 border-amber-500/20 text-amber-200" : "bg-amber-50 border-amber-200 text-amber-900"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                          <Star className="w-4 h-4 text-amber-700 dark:text-amber-400 fill-amber-400" />
                          Survei Kepuasan Pelayanan (SKM)
                        </span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
                          Ombudsman RI
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                        Bagaimana tingkat kepuasan Anda terhadap kecepatan dan penyelesaian pengaduan ini oleh DPMPTSP Kabupaten Luwu?
                      </p>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => {
                              setSkmRatings((prev) => ({ ...prev, [selectedComplaint.id]: star }));
                              Swal.fire({
                                toast: true,
                                position: "top-end",
                                icon: "success",
                                title: `Terima kasih! Penilaian ${star} Bintang Tersimpan.`,
                                showConfirmButton: false,
                                timer: 2000,
                                background: isDarkMode ? "#0f172a" : "#ffffff",
                                color: isDarkMode ? "#f8fafc" : "#0f172a"
                              });
                            }}
                            className="p-1 cursor-pointer transition-transform hover:scale-125"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                (skmRatings[selectedComplaint.id] || 5) >= star
                                  ? "text-amber-700 dark:text-amber-400 fill-amber-400"
                                  : "text-slate-600"
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400 ml-2 font-mono">
                          {skmRatings[selectedComplaint.id] || 5} / 5 Bintang
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-500/10 flex justify-end">
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
                    isDarkMode ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                  }`}
                >
                  Tutup Detail
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SPATIAL PKKPR PERMIT APPLICATION MODAL */}
      <AnimatePresence>
        {isPkkprModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPkkprModalOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className={`relative w-full max-w-3xl rounded-3xl border overflow-hidden z-10 my-auto shadow-2xl transition-all duration-300 ${
                isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-950"
              }`}
            >
              {/* Modal Header */}
              <div className={`p-6 border-b flex items-center justify-between ${
                pkkprCategory === "Berusaha"
                  ? "bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-transparent border-emerald-500/20"
                  : "bg-gradient-to-r from-indigo-600/10 via-blue-600/10 to-transparent border-indigo-500/20"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${
                    pkkprCategory === "Berusaha"
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                  }`}>
                    {pkkprCategory === "Berusaha" ? <Building2 className="w-6 h-6" /> : <Home className="w-6 h-6" />}
                  </div>
                  <div>
                    <span className={`text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded ${
                      pkkprCategory === "Berusaha" ? "bg-emerald-500/20 text-emerald-500" : "bg-indigo-500/20 text-indigo-500"
                    }`}>
                      FORMULIR PKKPR {pkkprCategory.toUpperCase()}
                    </span>
                    <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white mt-0.5">
                      Pengajuan Spasial Kesesuaian Tata Ruang
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPkkprModalOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-500/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleSubmitPkkpr} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto custom-scrollbar">
                {/* Information Banner */}
                <div className="p-4 rounded-2xl bg-slate-500/5 border border-slate-500/10 flex items-start gap-3">
                  <Info className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Setiap pengajuan perizinan PKKPR memerlukan digitasi batas poligon lahan pada peta spasial. Sistem akan memeriksa kawasan LP2B, sempadan sungai, dan pola ruang RTRW Perda Luwu No 06/2011.
                  </p>
                </div>

                {/* Field 1: Judul Permohonan */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Nama / Judul Rencana Permohonan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={pkkprTitle}
                    onChange={(e) => setPkkprTitle(e.target.value)}
                    placeholder={pkkprCategory === "Berusaha" ? "Contoh: Industri Pengolahan Kakao Terpadu & Pergudangan Modern" : "Contoh: Pembangunan Gereja Toraja Jemaat Belopa"}
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white focus:border-emerald-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500"
                    }`}
                  />
                </div>

                {/* Dropdown Jenis & Kategori Pengajuan PKKPR */}
                <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-emerald-500" /> Jenis & Kategori Pengajuan PKKPR <span className="text-rose-500">*</span>
                    </label>
                    {pkkprKategoriPengajuan === 'BANGUNAN' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        🏗️ KATEGORI BANGUNAN / FISIK
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                        🗺️ KATEGORI PARSIL TANAH (ATR/BPN)
                      </span>
                    )}
                  </div>
                  <select
                    required
                    disabled={pkkprCategory === "Non-Berusaha"}
                    value={pkkprCategory === "Non-Berusaha" ? "Rumah Tinggal / Hunian Perorangan" : pkkprJenisPengajuan}
                    onChange={(e) => setPkkprJenisPengajuan(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                      pkkprCategory === "Non-Berusaha"
                        ? "bg-slate-100 dark:bg-slate-900 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 cursor-not-allowed opacity-90"
                        : isDarkMode ? "bg-slate-950 border-slate-800 text-white focus:border-emerald-500" : "bg-white border-slate-200 text-slate-900 focus:border-emerald-500"
                    }`}
                  >
                    {pkkprCategory === "Non-Berusaha" ? (
                      <option value="Rumah Tinggal / Hunian Perorangan">Rumah Tinggal / Hunian Perorangan (Terkunci Non-Berusaha)</option>
                    ) : (
                      <>
                        <optgroup label="A. Kategori Konstruksi / Bangunan Fisik (Wajib Siteplan & Luas Bangunan)">
                          <option value="Rumah Tinggal / Hunian Perorangan">Rumah Tinggal / Hunian Perorangan</option>
                          <option value="Rumah Toko (Ruko) / Tempat Usaha & Hunian">Rumah Toko (Ruko) / Tempat Usaha & Hunian</option>
                          <option value="Tempat Usaha / Kios / Toko / Kantor / Perdagangan Jasa">Tempat Usaha / Kios / Toko / Kantor / Perdagangan Jasa</option>
                          <option value="Kawasan Industri / Gudang / Pabrik">Kawasan Industri / Gudang / Pabrik</option>
                          <option value="Fasilitas Sosial / Fasilitas Umum / Tempat Ibadah">Fasilitas Sosial / Fasilitas Umum / Tempat Ibadah</option>
                        </optgroup>
                        <optgroup label="B. Kategori Parsil Tanah Murni (Tanpa Bangunan / Sertifikasi ATR-BPN)">
                          <option value="Parsil Lahan untuk Pengajuan Sertipikat / Pemecahan Lahan (ATR/BPN)">Parsil Lahan untuk Pengajuan Sertipikat / Pemecahan Lahan (ATR/BPN)</option>
                          <option value="Parsil Lahan Kegiatan Usaha / Perkebunan / Non-Komersial Bangunan">Parsil Lahan Kegiatan Usaha / Perkebunan / Non-Komersial Bangunan</option>
                          <option value="Lainnya / Pemecahan Parsil Lahan">Lainnya / Pemecahan Parsil Lahan</option>
                        </optgroup>
                      </>
                    )}
                  </select>
                </div>

                {/* Conditional Fields for PKKPR Non-Berusaha (Tempat Ibadah / Rumah / Fasos) */}
                {pkkprCategory === "Non-Berusaha" && (
                  <div className="space-y-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
                    <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-extrabold text-xs">
                      <Home className="w-4 h-4" />
                      <span>Rincian Kegiatan Non-Berusaha (Sosial / Keagamaan / Perorangan)</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                          Fungsi Bangunan / Jenis Kegiatan <span className="text-rose-500">*</span>
                        </label>
                        <select
                          required
                          value={pkkprFungsiBangunan}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPkkprFungsiBangunan(val);
                            if (val.includes("Rumah")) {
                              setPkkprTitle("Pembangunan Rumah Pribadi/Keluarga");
                              setPkkprNamaLembaga("");
                            } else if (val.includes("Gereja")) {
                              setPkkprTitle("Pembangunan Gereja Toraja Jemaat Belopa");
                              setPkkprNamaLembaga("Panitia Pembangunan Gereja Toraja Jemaat Belopa");
                            } else if (val.includes("Masjid")) {
                              setPkkprTitle("Pembangunan Masjid Jami' Al-Ikhlas");
                              setPkkprNamaLembaga("Panitia Pembangunan Masjid Jami'");
                            }
                          }}
                          className={`w-full px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                            isDarkMode ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" : "bg-white border-slate-200 text-slate-900 focus:border-indigo-500"
                          }`}
                        >
                          <option value="Pembangunan Rumah Pribadi/Keluarga">Pembangunan Rumah Pribadi/Keluarga</option>
                          <option value="Sarana Peribadatan / Rumah Ibadah (Gereja)">Sarana Peribadatan / Rumah Ibadah (Gereja)</option>
                          <option value="Sarana Peribadatan / Rumah Ibadah (Masjid / Musholla)">Sarana Peribadatan / Rumah Ibadah (Masjid / Musholla)</option>
                          <option value="Fasilitas Sosial / Yayasan / Lembaga Keagamaan">Fasilitas Sosial / Yayasan / Lembaga Keagamaan</option>
                          <option value="Fasilitas Umum & Sarana Lingkungan Masyarakat">Fasilitas Umum & Sarana Lingkungan Masyarakat</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                          Nama Lembaga / Panitia Pembangunan / Komite <span className="text-slate-400 font-normal">(Opsional)</span>
                        </label>
                        <input
                          type="text"
                          value={pkkprNamaLembaga}
                          onChange={(e) => setPkkprNamaLembaga(e.target.value)}
                          placeholder="Kosongkan jika permohonan rumah tinggal perorangan"
                          className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                            isDarkMode ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" : "bg-white border-slate-200 text-slate-900 focus:border-indigo-500"
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                          Rencana Luas Lantai Bangunan (m²) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={pkkprLuasBangunan}
                          onChange={(e) => setPkkprLuasBangunan(e.target.value)}
                          placeholder="Contoh: 480"
                          className={`w-full px-4 py-3 rounded-xl border text-sm font-mono font-bold transition-all ${
                            isDarkMode ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" : "bg-white border-slate-200 text-slate-900 focus:border-indigo-500"
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                          Bukti Penguasaan Hak Atas Tanah (Jenis Alas Hak) <span className="text-rose-500">*</span>
                        </label>
                        <select
                          required
                          value={pkkprBuktiTanahJenis}
                          onChange={(e) => setPkkprBuktiTanahJenis(e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                            isDarkMode ? "bg-slate-950 border-slate-800 text-white focus:border-indigo-500" : "bg-white border-slate-200 text-slate-900 focus:border-indigo-500"
                          }`}
                        >
                          <option value="Sertipikat Hak Milik (SHM)">Sertipikat Hak Milik (SHM)</option>
                          <option value="Sertipikat Hak Guna Bangunan (HGB)">Sertipikat Hak Guna Bangunan (HGB)</option>
                          <option value="Sertipikat Hak Guna Usaha (HGU)">Sertipikat Hak Guna Usaha (HGU)</option>
                          <option value="Sertipikat Hak Pakai (HP)">Sertipikat Hak Pakai (HP)</option>
                          <option value="Akta Jual Beli (AJB) / Surat Keterangan Tanah (SKT)">Akta Jual Beli (AJB) / Surat Keterangan Tanah (SKT)</option>
                          <option value="Perjanjian Sewa / Kerja Sama">Perjanjian Sewa / Kerja Sama</option>
                          <option value="Lainnya / Surat Keterangan Desa">Lainnya / Surat Keterangan Desa</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conditional Fields for PKKPR Berusaha (Auto-Hydrated & Locked) */}
                {pkkprCategory === "Berusaha" && (
                  <div className="space-y-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs">
                      <Building2 className="w-4 h-4" />
                      <span>Rincian Usaha Komersial (Integrasi OSS-RBA & KBLI)</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            NIB (13 Digit OSS) <span className="text-rose-500">*</span>
                          </label>
                          {hydratedProfile.nib && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <Lock className="w-3 h-3" /> OSS Terverifikasi
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          required
                          readOnly={!!hydratedProfile.nib}
                          maxLength={13}
                          value={pkkprNib}
                          onChange={(e) => setPkkprNib(e.target.value.replace(/\D/g, ''))}
                          placeholder="Contoh: 1234567890123"
                          className={`w-full px-4 py-3 rounded-xl border text-sm font-mono font-bold transition-all ${
                            hydratedProfile.nib
                              ? "bg-slate-100 dark:bg-slate-950/80 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 cursor-not-allowed opacity-90"
                              : isDarkMode ? "bg-slate-950 border-slate-800 text-white focus:border-emerald-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500"
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Nama Badan Usaha / PT / CV <span className="text-rose-500">*</span>
                          </label>
                          {hydratedProfile.perusahaan && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <Lock className="w-3 h-3" /> Terkunci Profil
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          required
                          readOnly={!!hydratedProfile.perusahaan}
                          value={pkkprPerusahaan}
                          onChange={(e) => setPkkprPerusahaan(e.target.value)}
                          placeholder="Contoh: PT Luwu Sawit Mandiri"
                          className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                            hydratedProfile.perusahaan
                              ? "bg-slate-100 dark:bg-slate-950/80 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 cursor-not-allowed opacity-90"
                              : isDarkMode ? "bg-slate-950 border-slate-800 text-white focus:border-emerald-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500"
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                          Kode KBLI (OSS-RBA 5 Digit) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={pkkprKbli}
                          onChange={(e) => setPkkprKbli(e.target.value)}
                          placeholder="Contoh: 10732 (Industri Pengolahan)"
                          className={`w-full px-4 py-3 rounded-xl border text-sm font-mono font-bold transition-all ${
                            isDarkMode ? "bg-slate-950 border-slate-800 text-white focus:border-emerald-500" : "bg-white border-slate-200 text-slate-900 focus:border-emerald-500"
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                          Bukti Penguasaan Hak Atas Tanah (Jenis Alas Hak) <span className="text-rose-500">*</span>
                        </label>
                        <select
                          required
                          value={pkkprBuktiTanahJenis}
                          onChange={(e) => setPkkprBuktiTanahJenis(e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                            isDarkMode ? "bg-slate-950 border-slate-800 text-white focus:border-emerald-500" : "bg-white border-slate-200 text-slate-900 focus:border-emerald-500"
                          }`}
                        >
                          <option value="Sertipikat Hak Milik (SHM)">Sertipikat Hak Milik (SHM)</option>
                          <option value="Sertipikat Hak Guna Bangunan (HGB)">Sertipikat Hak Guna Bangunan (HGB)</option>
                          <option value="Sertipikat Hak Guna Usaha (HGU)">Sertipikat Hak Guna Usaha (HGU)</option>
                          <option value="Sertipikat Hak Pakai (HP)">Sertipikat Hak Pakai (HP)</option>
                          <option value="Akta Jual Beli (AJB) / Surat Keterangan Tanah (SKT)">Akta Jual Beli (AJB) / Surat Keterangan Tanah (SKT)</option>
                          <option value="Perjanjian Sewa / Kerja Sama">Perjanjian Sewa / Kerja Sama</option>
                          <option value="Lainnya / Surat Keterangan Desa">Lainnya / Surat Keterangan Desa</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Field 2: Identitas Pemohon (Auto-Hydrated or Interactive Input) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Nama Pemohon (Sesuai KTP) <span className="text-rose-500">*</span>
                      </label>
                      {hydratedProfile.nama && !["masyarakat", "masyarakat publik", "offline-user", "masyarakat pemohon"].includes(hydratedProfile.nama.toLowerCase()) ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <Lock className="w-3 h-3" /> Supabase Profile
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-extrabold font-mono bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <User className="w-3 h-3" /> Sesuai KTP
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      readOnly={!!hydratedProfile.nama && !["masyarakat", "masyarakat publik", "offline-user", "masyarakat pemohon"].includes(hydratedProfile.nama.toLowerCase())}
                      disabled={!!hydratedProfile.nama && !["masyarakat", "masyarakat publik", "offline-user", "masyarakat pemohon"].includes(hydratedProfile.nama.toLowerCase())}
                      value={
                        hydratedProfile.nama && !["masyarakat", "masyarakat publik", "offline-user", "masyarakat pemohon"].includes(hydratedProfile.nama.toLowerCase())
                          ? hydratedProfile.nama
                          : pkkprNamaPemohon
                      }
                      onChange={(e) => setPkkprNamaPemohon(e.target.value)}
                      placeholder="Masukkan Nama Lengkap Sesuai KTP"
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                        hydratedProfile.nama && !["masyarakat", "masyarakat publik", "offline-user", "masyarakat pemohon"].includes(hydratedProfile.nama.toLowerCase())
                          ? "bg-slate-100 dark:bg-slate-950/80 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 cursor-not-allowed opacity-90"
                          : isDarkMode ? "bg-slate-950 border-slate-800 text-white focus:border-emerald-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        NIK Pemohon (16-Digit) <span className="text-rose-500">*</span>
                      </label>
                      {/^\d{16}$/.test(hydratedProfile.nik) ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <Lock className="w-3 h-3" /> KTP Terverifikasi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-extrabold font-mono bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <User className="w-3 h-3" /> Input 16-Digit NIK
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      readOnly={/^\d{16}$/.test(hydratedProfile.nik)}
                      disabled={/^\d{16}$/.test(hydratedProfile.nik)}
                      maxLength={16}
                      value={/^\d{16}$/.test(hydratedProfile.nik) ? hydratedProfile.nik : pkkprNikPemohon}
                      onChange={(e) => setPkkprNikPemohon(e.target.value.replace(/\D/g, ''))}
                      placeholder="Masukkan 16 Digit NIK KTP Anda"
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-mono font-bold transition-all ${
                        /^\d{16}$/.test(hydratedProfile.nik)
                          ? "bg-slate-100 dark:bg-slate-950/80 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 cursor-not-allowed opacity-90"
                          : isDarkMode ? "bg-slate-950 border-slate-800 text-white focus:border-emerald-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500"
                      }`}
                    />
                  </div>
                </div>

                {/* Field 3: Cascading Location Selection (Kecamatan -> Desa gis_desa) */}
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
                        const newKec = e.target.value;
                        setPkkprKecamatan(newKec);
                      }}
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                        isPkkprLocationLocked
                          ? "bg-slate-100 dark:bg-slate-950/80 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 cursor-not-allowed opacity-90 font-bold"
                          : isDarkMode ? "bg-slate-950 border-slate-800 text-white focus:border-emerald-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500"
                      }`}
                    >
                      <option value="">-- Pilih Kecamatan --</option>
                      {districts && districts.length > 0 ? (
                        districts.map((d) => {
                          const rawLabel = getKecamatanLabel(d);
                          const cleanName = rawLabel.replace(/^kec\.?\s*/i, "").replace(/^kecamatan\s*/i, "").trim();
                          const optId = getKecamatanId(d) || cleanName;
                          return (
                            <option key={optId} value={cleanName}>
                              Kecamatan {cleanName}
                            </option>
                          );
                        })
                      ) : (
                        kecamatanList.map((k) => {
                          const rawLabel = getKecamatanLabel(k);
                          const cleanName = rawLabel.replace(/^kec\.?\s*/i, "").replace(/^kecamatan\s*/i, "").trim();
                          const optId = getKecamatanId(k) || cleanName;
                          return (
                            <option key={optId} value={cleanName}>
                              Kecamatan {cleanName}
                            </option>
                          );
                        })
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
                          const vName = e.target.value;
                          setPkkprDesa(vName);
                          const matched = pkkprDesaList.find((v) => getDesaLabel(v) === vName || getDesaId(v) === vName);
                          if (matched) {
                            setPkkprSelectedDesaId(getDesaId(matched) || vName);
                            setPkkprSelectedDesaGeom(matched.geom || matched.geojson?.geometry || matched.geojson);
                          }
                        }}
                        className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                          isPkkprLocationLocked
                            ? "bg-slate-100 dark:bg-slate-950/80 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 cursor-not-allowed opacity-90 font-bold"
                            : isDarkMode ? "bg-slate-950 border-slate-800 text-white focus:border-emerald-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500"
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
                        className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all disabled:opacity-60 ${
                          isPkkprLocationLocked
                            ? "bg-slate-100 dark:bg-slate-950/80 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 cursor-not-allowed opacity-90 font-bold"
                            : isDarkMode ? "bg-slate-950 border-slate-800 text-white focus:border-emerald-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500"
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

                {/* Field 4: Dual-Mode Spatial Input (Manual Digitization vs KMZ/KML Upload) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Input Geometri Spasial Lahan <span className="text-rose-500">*</span>
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
                                GEOMETRI DIGITASI PETA TERSIMPAN
                              </span>
                              <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">
                                Estimasi Luas: <strong className="text-emerald-600 font-mono">{(pkkprLuasM2 / 10000).toFixed(2)} Ha</strong> ({pkkprLuasM2.toLocaleString()} m²)
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (!pkkprKecamatan) {
                                Swal.fire({
                                  icon: "warning",
                                  title: "Kecamatan Belum Dipilih",
                                  text: "Harap pilih Kecamatan lokasi lahan terlebih dahulu.",
                                  toast: true,
                                  position: "top-end",
                                  showConfirmButton: false,
                                  timer: 3500
                                });
                                return;
                              }
                              if (!pkkprDesa) {
                                Swal.fire({
                                  icon: "warning",
                                  title: "Desa / Kelurahan Belum Dipilih",
                                  text: "Harap pilih Desa / Kelurahan lokasi lahan terlebih dahulu.",
                                  toast: true,
                                  position: "top-end",
                                  showConfirmButton: false,
                                  timer: 3500
                                });
                                return;
                              }
                              setIsDrawerOpen(true);
                            }}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                          >
                            Ubah Polygon
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={!pkkprKecamatan || !pkkprDesa}
                          onClick={() => {
                            if (!pkkprKecamatan) {
                              Swal.fire({
                                icon: "warning",
                                title: "Kecamatan Belum Dipilih",
                                text: "Harap pilih Kecamatan lokasi lahan terlebih dahulu.",
                                toast: true,
                                position: "top-end",
                                showConfirmButton: false,
                                timer: 3500
                              });
                              return;
                            }
                            if (!pkkprDesa) {
                              Swal.fire({
                                icon: "warning",
                                title: "Desa / Kelurahan Belum Dipilih",
                                text: "Harap pilih Desa / Kelurahan lokasi lahan terlebih dahulu.",
                                toast: true,
                                position: "top-end",
                                showConfirmButton: false,
                                timer: 3500
                              });
                              return;
                            }
                            setIsDrawerOpen(true);
                          }}
                          className={`w-full py-5 px-4 rounded-2xl border-2 border-dashed font-extrabold text-sm flex items-center justify-center gap-3 transition-all shadow-md group ${
                            !pkkprKecamatan || !pkkprDesa
                              ? "opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                              : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 border-emerald-500/50 hover:border-emerald-500 text-slate-800 dark:text-slate-100 cursor-pointer"
                          }`}
                        >
                          <div className={`p-2.5 rounded-xl transition-transform ${
                            !pkkprKecamatan || !pkkprDesa 
                              ? "bg-slate-200 dark:bg-slate-700 text-slate-400" 
                              : "bg-emerald-500/20 text-emerald-500 group-hover:scale-110"
                          }`}>
                            <MapPin className="w-6 h-6" />
                          </div>
                          <div className="text-left">
                            <span className="block font-black text-sm">Buka Peta Digitasi Spasial Lahan</span>
                            <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              {pkkprDesa 
                                ? `Wilayah Terpilih: Desa ${pkkprDesa}, Kec. ${pkkprKecamatan}` 
                                : pkkprKecamatan 
                                ? `Pilih Desa/Kelurahan untuk Mengaktifkan Peta (Kec. ${pkkprKecamatan})` 
                                : "Pilih Kecamatan & Desa terlebih dahulu untuk membuka peta spasial."}
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
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-300 dark:border-transparent rounded-xl text-xs font-bold transition-all cursor-pointer"
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
                                  Klik untuk Unggah Berkas .KMZ atau .KML Google Earth
                                </span>
                                <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                  Sistem akan secara otomatis mengekstrak koordinat poligon spasial dan menghitung luas lahan
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* PostGIS Overlap Detection Feedback Badge */}
                      {pkkprSpatialOverlapInfo && (
                        <div className={`p-3.5 rounded-2xl border text-xs transition-all animate-in fade-in duration-300 ${
                          pkkprSpatialOverlapInfo.isOutOfLuwu
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400"
                            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                        }`}>
                          <div className="flex items-start gap-2.5">
                            {pkkprSpatialOverlapInfo.isOutOfLuwu ? (
                              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            ) : (
                              <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold uppercase font-mono tracking-wide text-[11px] flex items-center gap-1">
                                  {pkkprSpatialOverlapInfo.isOutOfLuwu ? "Peringatan Batas Wilayah" : "Deteksi Spasial PostGIS Supabase"}
                                </span>
                                {!pkkprSpatialOverlapInfo.isOutOfLuwu && pkkprSpatialOverlapInfo.overlapPercentage !== undefined && (
                                  <span className="font-mono font-bold bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                                    Overlap: {pkkprSpatialOverlapInfo.overlapPercentage.toFixed(1)}%
                                  </span>
                                )}
                              </div>
                              <p className="font-medium text-[11px] leading-relaxed">
                                {pkkprSpatialOverlapInfo.message}
                              </p>
                              {pkkprSpatialOverlapInfo.multiOverlapList && pkkprSpatialOverlapInfo.multiOverlapList.length > 1 && (
                                <div className="pt-1.5 mt-1 border-t border-emerald-500/20 text-[10px] space-y-0.5 font-mono">
                                  <span className="text-slate-600 dark:text-slate-400 font-bold block">Detail Distribusi Wilayah:</span>
                                  {pkkprSpatialOverlapInfo.multiOverlapList.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                                      <span>• Desa {cleanDesaName(item.nama_desa || item.desa)}, Kec. {cleanKecamatanName(item.nama_kecamatan || item.kecamatan)}</span>
                                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{Number(item.persentase_overlap || 0).toFixed(1)}%</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Field 5: Dokumen Hak Tanah & Legalitas Desa (Penggabungan Otomatis 1 File PDF) */}
                <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-emerald-500" /> Dokumen Legalitas Lahan & Surat Pengantar Desa <span className="text-rose-500">*</span>
                      </label>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Unggah Sertifikat Lahan & Surat Pengantar Desa. Sistem akan menggabungkannya dengan Surat Keterangan Bebas Sengketa menjadi <strong>1 File PDF Berkas PKKPR</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Box 1: Upload Sertifikat Hak Atas Tanah */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                      sertifikatDataUrl
                        ? "bg-emerald-500/5 border-emerald-500/30"
                        : isDarkMode ? "bg-slate-950/60 border-slate-800 hover:border-slate-700" : "bg-slate-50 border-slate-200 hover:border-slate-300"
                    }`}>
                      <input
                        ref={sertifikatInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleSertifikatUpload}
                        className="hidden"
                      />
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-xl shrink-0 ${
                            sertifikatDataUrl ? "bg-emerald-500/20 text-emerald-500" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                          }`}>
                            <FileCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white block">
                              1. Sertifikat Hak Atas Tanah <span className="text-rose-500">*</span>
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                              Format: PDF, JPG, PNG (Max 5MB)
                            </span>
                            {sertifikatFileName && (
                              <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 block mt-1 truncate max-w-[180px]">
                                ✓ {sertifikatFileName}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => sertifikatInputRef.current?.click()}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            sertifikatDataUrl
                              ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                              : "bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                          }`}
                        >
                          {sertifikatDataUrl ? "Ganti File" : "Unggah File"}
                        </button>
                      </div>
                    </div>

                    {/* Box 2: Upload Surat Pengantar Desa/Kelurahan */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                      suratPengantarDataUrl
                        ? "bg-emerald-500/5 border-emerald-500/30"
                        : isDarkMode ? "bg-slate-950/60 border-slate-800 hover:border-slate-700" : "bg-slate-50 border-slate-200 hover:border-slate-300"
                    }`}>
                      <input
                        ref={suratPengantarInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleSuratPengantarUpload}
                        className="hidden"
                      />
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-xl shrink-0 ${
                            suratPengantarDataUrl ? "bg-emerald-500/20 text-emerald-500" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                          }`}>
                            <FileCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white block">
                              2. Surat Pengantar Desa / Kelurahan <span className="text-rose-500">*</span>
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                              Format: PDF, JPG, PNG (Max 5MB)
                            </span>
                            {suratPengantarFileName && (
                              <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 block mt-1 truncate max-w-[180px]">
                                ✓ {suratPengantarFileName}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => suratPengantarInputRef.current?.click()}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            suratPengantarDataUrl
                              ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                              : "bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                          }`}
                        >
                          {suratPengantarDataUrl ? "Ganti File" : "Unggah File"}
                        </button>
                      </div>
                    </div>

                    {/* Box 3: Siteplan Bangunan (Hanya untuk Kategori BANGUNAN) */}
                    {pkkprKategoriPengajuan === 'BANGUNAN' && (
                      <div className={`p-4 rounded-2xl border transition-all md:col-span-2 ${
                        siteplanDataUrl
                          ? "bg-emerald-500/5 border-emerald-500/30"
                          : isDarkMode ? "bg-slate-950/60 border-slate-800 hover:border-slate-700" : "bg-slate-50 border-slate-200 hover:border-slate-300"
                      }`}>
                        <input
                          ref={siteplanInputRef}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleSiteplanUpload}
                          className="hidden"
                        />
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={`p-2.5 rounded-xl shrink-0 ${
                              siteplanDataUrl ? "bg-emerald-500/20 text-emerald-500" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                            }`}>
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                                3. Peta Lokasi / Siteplan / Denah Rencana Bangunan <span className="text-rose-500">*</span>
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                                Format: PDF, JPG, PNG (Max 5MB). Diperlukan untuk verifikasi KDB, KLB, dan sempadan jalan oleh tim teknis PUPTR.
                              </span>
                              {siteplanFileName && (
                                <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 block mt-1 truncate max-w-[280px]">
                                  ✓ {siteplanFileName}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => siteplanInputRef.current?.click()}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                              siteplanDataUrl
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                                : "bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                            }`}
                          >
                            {siteplanDataUrl ? "Ganti Siteplan" : "Unggah Siteplan"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dynamic Technical Notice */}
                  {pkkprKategoriPengajuan === 'BANGUNAN' ? (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200 text-xs space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        Verifikasi Teknis Konstruksi Bangunan (Dinas PUPTR Kab. Luwu)
                      </p>
                      <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                        Tim teknis akan memeriksa kesesuaian Koefisien Dasar Bangunan (KDB), Koefisien Lantai Bangunan (KLB), Garis Sempadan Bangunan/Jalan/Sungai, serta Koefisien Daerah Hijau (KDH) berdasarkan siteplan yang Anda lampirkan.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-950 dark:text-blue-200 text-xs space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                        <Layers className="w-4 h-4 text-blue-500 shrink-0" />
                        Pengajuan Parsil Lahan / Sertifikasi ATR-BPN (Tanpa Bangunan)
                      </p>
                      <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                        Pengajuan ini tidak memerlukan siteplan bangunan. Penilaian teknis difokuskan pada validitas geometri persil lahan, overlay LP2B Pertanian, dan keabsahan sertifikat/alas hak.
                      </p>
                    </div>
                  )}

                  {/* Dokumen 3 (Auto-Generated Surat Keterangan Bebas Sengketa) & Penggabungan PDF */}
                  <div className={`p-4 rounded-2xl border transition-all ${
                    mergedPdfResult 
                      ? "bg-emerald-500/10 border-emerald-500/40" 
                      : isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-500 shrink-0">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white block">
                            3. Surat Pernyataan Penguasaan Fisik & Bebas Sengketa (Auto-Format)
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                            Format standar hukum terbitan Pemerintah Kab. Luwu digenerate otomatis ke dalam berkas gabungan.
                          </span>
                          {mergedPdfResult && (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mt-1">
                              ✓ Berkas 1 File PDF Tergabung Siap Kirim ({(mergedPdfResult.blob.size / 1024).toFixed(1)} KB)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        {mergedPdfResult && (
                          <a
                            href={mergedPdfResult.dataUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" /> Pratinjau PDF
                          </a>
                        )}
                        <button
                          type="button"
                          disabled={isMergingPdf || (!sertifikatDataUrl && !suratPengantarDataUrl)}
                          onClick={handleGenerateMergedPdf}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all flex items-center gap-2 shadow-sm"
                        >
                          {isMergingPdf ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menggabungkan...
                            </>
                          ) : (
                            <>
                              <Paperclip className="w-3.5 h-3.5" /> {mergedPdfResult ? "Re-generate PDF" : "Gabungkan 1 File PDF"}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Action Buttons */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPkkprModalOpen(false)}
                    className="px-5 py-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                  >
                    Batal
                  </button>

                    <button
                      type="submit"
                      disabled={isSubmittingPkkpr}
                      className="px-6 py-3 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2"
                    >
                      {isSubmittingPkkpr ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Mengirim Berkas PKKPR...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Kirim Permohonan PKKPR {pkkprCategory}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN MAP POLYGON DRAWER OVERLAY */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col p-2 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden flex-1 flex flex-col border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="p-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-sm sm:text-base block">
                    Digitasi Spasial Batas Lahan PKKPR {pkkprCategory}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    Kabupaten Luwu - Peta Citra Satelit Google & GIS
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 relative">
              <SimplePolygonDrawer
                isDarkMode={isDarkMode}
                onCancel={() => setIsDrawerOpen(false)}
                selectedKecId={pkkprSelectedKecId}
                selectedDesaId={pkkprSelectedDesaId}
                kecamatanName={pkkprKecamatan}
                desaName={pkkprDesa}
                selectedDesaBoundary={pkkprSelectedDesaGeom}
                selectedDesaName={pkkprDesa}
                focusTarget={drawerFocusTarget}
                initialGeometry={pkkprGeometry}
                onSave={(geom, esg) => {
                  setPkkprGeometry(geom);
                  setPkkprEsgAnalysis(esg);
                  if (geom && geom.geometry && geom.geometry.coordinates) {
                    try {
                      const areaVal = turfArea(geom);
                      setPkkprLuasM2(Math.round(areaVal));
                    } catch (e) {
                      setPkkprLuasM2(1000);
                    }
                  } else {
                    setPkkprLuasM2(1000);
                  }
                  setIsDrawerOpen(false);
                  Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "success",
                    title: "Geometri Batas Lahan Berhasil Disimpan!",
                    showConfirmButton: false,
                    timer: 2000,
                  });
                }}
              />
            </div>
          </div>
        </div>
      )}
      {/* MODAL PRATINJAU NASKAH RESMI BAP-PKKPR DINAS PUPTR KABUPATEN LUWU */}
      {isBapDocumentModalOpen && selectedBapPreviewApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex flex-col p-2 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl max-w-5xl mx-auto w-full border border-slate-200 dark:border-slate-700 my-auto flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-sm sm:text-base block">
                    Naskah Resmi BAP-PKKPR Dinas PUPTR Kabupaten Luwu
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {selectedBapPreviewApp.category === "Non-Berusaha" || selectedBapPreviewApp.jenis_permohonan === "Non-Berusaha"
                      ? "Format Non-Berusaha (Sarana Peribadatan Gereja / Masjid / Sosial / Rumah Tinggal)"
                      : "Format Berusaha (Komersial / OSS-RBA Terintegrasi)"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBapDocumentModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[85vh] overflow-y-auto custom-scrollbar p-2 sm:p-4 bg-[#f1f5f9]">
              <BapKtrPuptrDocument
                initialData={convertAppToBapKtrData(selectedBapPreviewApp)}
                onClose={() => setIsBapDocumentModalOpen(false)}
                showEditorToolbar={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRATINJAU NASKAH RESMI BAP PENOLAKAN / PERSETUJUAN LP2B DINAS PERTANIAN */}
      {isPertanianBapModalOpen && selectedPertanianBapApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex flex-col p-2 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl max-w-5xl mx-auto w-full border border-slate-200 dark:border-slate-700 my-auto flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${selectedPertanianBapApp.pertanian_status === 'REJECTED' || selectedPertanianBapApp.status_pkkpr === 'Requires Revision' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-sm sm:text-base block">
                    {selectedPertanianBapApp.pertanian_status === 'REJECTED' || selectedPertanianBapApp.status_pkkpr === 'Requires Revision'
                      ? 'Naskah Resmi BAP Penolakan Rekomendasi LP2B Dinas Pertanian'
                      : 'Naskah Resmi BAP Rekomendasi LP2B Dinas Pertanian'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Nomor Dokumen: {selectedPertanianBapApp.berita_acara_pertanian_num || selectedPertanianBapApp.pertanian_ba_num || '521/043/BAP-TOLAK-LP2B/DISTAN-LW/2026'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPertanianBapModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[85vh] overflow-y-auto custom-scrollbar p-2 sm:p-4 bg-[#f1f5f9]">
              <BapLp2bPertanianDocument
                initialData={convertAppToBapLp2bData(selectedPertanianBapApp)}
                onClose={() => setIsPertanianBapModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL BAP PENOLAKAN & REKOMENDASI TEKNIS (CONDITIONAL FOR APPLICANTS) */}
      {isRejectionModalOpen && selectedRejectionApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex flex-col p-2 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl max-w-2xl mx-auto w-full border border-rose-500/40 my-auto flex flex-col">
            {/* Header */}
            <div className="p-4 bg-rose-950 text-white flex items-center justify-between border-b border-rose-900">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                  <AlertOctagon className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-extrabold text-sm sm:text-base block text-rose-200">
                    Ringkasan Berita Acara (BAP) Penolakan &amp; Catatan Teknis
                  </span>
                  <span className="text-[11px] text-rose-300/80 font-mono">
                    Pemerintah Kabupaten Luwu - Dinas PUPTR &amp; Dinas Pertanian
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRejectionModalOpen(false)}
                className="p-2 rounded-xl bg-rose-900/50 hover:bg-rose-900 text-rose-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar text-slate-800 dark:text-slate-100">
              {/* Identitas Permohonan */}
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-slate-500 dark:text-slate-400">Nomor Registrasi:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">{selectedRejectionApp.id || selectedRejectionApp.nomor_permohonan}</span>
                </div>
                <div className="flex justify-between items-center font-bold">
                  <span className="text-slate-500 dark:text-slate-400">Pemohon / Lembaga:</span>
                  <span>{selectedRejectionApp.nama_pemohon || selectedRejectionApp.nama_lembaga || selectedRejectionApp.perusahaan || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Lokasi Lahan:</span>
                  <span className="font-semibold">Desa {selectedRejectionApp.desa || '-'}, Kec. {selectedRejectionApp.kecamatan || '-'}</span>
                </div>
              </div>

              {/* Status & OPD Penerbit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                  <span className="block text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 mb-1">OPD Penerbit Evaluasi</span>
                  <span className="font-extrabold block">
                    {selectedRejectionApp.pertanian_status === 'REJECTED' || selectedRejectionApp.pertanian_rejection_notes
                      ? "Dinas Pertanian Kab. Luwu (Tim LP2B)"
                      : "Dinas PUPTR Kab. Luwu (Bidang Tata Ruang)"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Nomor &amp; Tgl BAP Penolakan</span>
                  <span className="font-mono font-bold block">
                    {selectedRejectionApp.berita_acara_pertanian_num || selectedRejectionApp.pertek_puptr_num || "BAP-TOLAK/LUWU/2026"}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(selectedRejectionApp.updated_at || selectedRejectionApp.created_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Poin Pelanggaran Spasial */}
              <div className="p-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 space-y-2">
                <h4 className="text-xs font-black uppercase text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Poin Evaluasi &amp; Alasan Penolakan Spasial:</span>
                </h4>
                <p className="text-xs font-semibold leading-relaxed text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 p-3 rounded-xl border border-rose-300 dark:border-rose-800/60">
                  "{selectedRejectionApp.catatan_teknis || selectedRejectionApp.pertanian_rejection_notes || selectedRejectionApp.catatan_revisi || 'Ditemukan irisan deliniasi lahan pada kawasan Perlindungan Lahan Pertanian Pangan Berkelanjutan (LP2B) / Kawasan Hutan Lindung tanpa kelengkapan syarat perizinan alih fungsi.'}"
                </p>
              </div>

              {/* Rekomendasi & Tindak Lanjut */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <h4 className="text-xs font-bold uppercase text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-500" />
                  <span>Rekomendasi &amp; Tindak Lanjut Bagi Pemohon:</span>
                </h4>
                <ul className="text-xs space-y-1.5 list-disc list-inside font-medium text-slate-700 dark:text-slate-300">
                  <li>Lakukan pemotongan (*deliniasi*) poligon spasial lahan untuk mengeluarkan titik yang beririsan dengan kawasan LP2B / sempadan.</li>
                  <li>Unggah kembali berkas perbaikan peta spasial melalui menu **Buka Peta Digitasi**.</li>
                  <li>Hubungi Layanan Helpdesk Dinas PUPTR / Dinas Pertanian jika memerlukan pendampingan teknis.</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setSelectedPertanianBapApp(selectedRejectionApp);
                  setIsPertanianBapModalOpen(true);
                  setIsRejectionModalOpen(false);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Lihat Naskah BAP Lengkap</span>
              </button>
              <button
                type="button"
                onClick={() => setIsRejectionModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer shadow-md"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// legal fix: replace SP4N-LAPOR trademark with local branding Lapor Luwu
// ux polish: add explicit live camera and gallery split buttons for evidence upload
// bugfix: resolve mobile keyboard overlap on textarea and fix broken header logo
// bugfix: fix logo path in masyarakat dashboard
// branding hotfix: applied transparant.png to PWA manifest and UI components
