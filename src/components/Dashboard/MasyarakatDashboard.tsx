import { LUWU_LOGO_BASE64 } from "@/lib/logoBase64.js";
import { requestSmartFullscreen, exitSmartFullscreen } from "../../utils/fullscreen";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { booleanPointInPolygon, point, area as turfArea } from '@turf/turf';
import { 
  X, Send, MapPin, Building2, Phone, User, AlertCircle, Camera, 
  Upload, LogOut, RefreshCw, CheckCircle2, Shield, ShieldCheck, FileText, 
  Loader2, AlertOctagon, HelpCircle, Check, Eye, ChevronRight, Info,
  Sun, Moon, Star, Filter, Image as ImageIcon, Briefcase, Home, Plus,
  Clock, Sparkles, Lock, FileCode, UploadCloud, Globe, CreditCard,
  FileCheck, Trash2, Paperclip
} from "lucide-react";
import Swal from "sweetalert2";
import { supabase, safeFetchLayerData } from "../../lib/supabaseClient";
import { District } from "../../types";
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

interface MasyarakatDashboardProps {
  isDarkMode: boolean;
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
  isDarkMode,
  activeProfile,
  districts = [],
  onToggleTheme,
}: MasyarakatDashboardProps) {
  const navigate = useNavigate();
  useEffect(() => { return () => { exitSmartFullscreen(); }; }, []);

  // Helper to extract phone / whatsapp number from various profile structures
  const extractPhone = useCallback((p: any) => {
    if (!p) return "";
    return (
      p.no_whatsapp ||
      p.whatsapp ||
      p.phone ||
      p.telepon ||
      p.no_hp ||
      p.no_telepon ||
      p.contact_info ||
      p.contact ||
      p.user_metadata?.no_whatsapp ||
      p.user_metadata?.whatsapp ||
      p.user_metadata?.phone ||
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

  const resolveCleanCitizenName = (raw?: string | null, fallbackNik?: string) => {
    if (raw && !isAdministrativeTitle(raw)) {
      return raw;
    }
    if (typeof window !== "undefined") {
      try {
        const targetNik = fallbackNik || localStorage.getItem("luwu_user_nik") || "";
        if (targetNik) {
          const nName = localStorage.getItem(`mpp_citizen_name_${targetNik}`);
          if (nName && !isAdministrativeTitle(nName)) {
            return nName;
          }
        }

        const rawCit = localStorage.getItem("luwu_citizen_data");
        if (rawCit) {
          const parsed = JSON.parse(rawCit);
          if (parsed?.full_name && !isAdministrativeTitle(parsed.full_name)) {
            return parsed.full_name;
          }
        }

        const uName = localStorage.getItem("luwu_user_name");
        if (uName && !isAdministrativeTitle(uName)) {
          return uName;
        }
      } catch (e) {}
    }
    return "";
  };

  // Form states
  const [nama, setNama] = useState(() => {
    return resolveCleanCitizenName(activeProfile?.full_name, activeProfile?.nik);
  });
  const [kontak, setKontak] = useState(() => {
    const p = extractPhone(activeProfile);
    if (p) return p;
    return typeof window !== "undefined" ? localStorage.getItem("luwu_user_phone") || "" : "";
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
    return activeProfile?.nik || (typeof window !== "undefined" ? localStorage.getItem("luwu_user_nik") || "" : "");
  });
  const [isAnonymous, setIsAnonymous] = useState(false);

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

  // Document Upload States (Sertifikat, Surat Pengantar Desa, Surat Bebas Sengketa)
  const [fileSertifikat, setFileSertifikat] = useState<File | null>(null);
  const [sertifikatDataUrl, setSertifikatDataUrl] = useState<string | null>(null);
  const [sertifikatFileName, setSertifikatFileName] = useState("");

  const [fileSuratPengantarDesa, setFileSuratPengantarDesa] = useState<File | null>(null);
  const [suratPengantarDataUrl, setSuratPengantarDataUrl] = useState<string | null>(null);
  const [suratPengantarFileName, setSuratPengantarFileName] = useState("");

  const [fileSuratBebasSengketa, setFileSuratBebasSengketa] = useState<File | null>(null);
  const [suratBebasSengketaDataUrl, setSuratBebasSengketaDataUrl] = useState<string | null>(null);
  const [suratBebasSengketaFileName, setSuratBebasSengketaFileName] = useState("");

  const [mergedPdfResult, setMergedPdfResult] = useState<{ dataUrl: string; blob: Blob } | null>(null);
  const [isMergingPdf, setIsMergingPdf] = useState(false);

  const sertifikatInputRef = useRef<HTMLInputElement>(null);
  const suratPengantarInputRef = useRef<HTMLInputElement>(null);
  const suratBebasSengketaInputRef = useRef<HTMLInputElement>(null);

  // Cascading Desa & Polygon Focus States
  const [pkkprDesaList, setPkkprDesaList] = useState<any[]>([]);
  const [loadingPkkprDesa, setLoadingPkkprDesa] = useState(false);
  const [pkkprSelectedKecId, setPkkprSelectedKecId] = useState("");
  const [pkkprSelectedDesaId, setPkkprSelectedDesaId] = useState("");
  const [pkkprSelectedDesaGeom, setPkkprSelectedDesaGeom] = useState<any>(null);

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

  // Hydrate user profile from activeProfile & Supabase session + public.profiles table
  const fetchAndHydrateMasyarakatProfile = async () => {
    try {
      // 1. Restore session manually from cookie or localStorage to bypass iframe / container restrictions
      let sbToken = null;
      const match = document.cookie.match(/(?:^|;\s*)sb-access-token=([^;]+)/);
      if (match) sbToken = match[1];
      if (!sbToken) sbToken = localStorage.getItem("luwu_session_token");

      let user: any = null;
      if (sbToken) {
        try {
          const userRes = await supabase.auth.getUser();
          user = userRes?.data?.user || null;
        } catch (authErr) {
          // silent token error
        }
      }
      const effectiveEmail = user?.email || activeProfile?.email || localStorage.getItem("luwu_user_email") || "";
      const effectiveId = user?.id || activeProfile?.id || "";

      let prof: any = null;

      // Step 1: Detect potential NIK from stored session or email
      const cleanNikFromEmail = (effectiveEmail.includes("@warga.luwukab.go.id") || !effectiveEmail.includes("@"))
        ? effectiveEmail.split("@")[0].trim()
        : "";
      const storedNik = (typeof window !== "undefined" ? localStorage.getItem("luwu_user_nik") : "") || "";
      const potentialNik = (/^\d{16}$/.test(storedNik) ? storedNik : "") || activeProfile?.nik || (/^\d{16}$/.test(cleanNikFromEmail) ? cleanNikFromEmail : "");

      // Step 2: Query mpp_citizens FIRST if NIK is available (Single Source of Truth for Citizen/MPP Data)
      if (potentialNik && /^\d{16}$/.test(potentialNik)) {
        try {
          const { data: citizenData } = await supabase
            .from("mpp_citizens")
            .select("nik, full_name, phone_number, gender, jenis_kelamin, occupation, pekerjaan, kecamatan, desa, address")
            .eq("nik", potentialNik)
            .maybeSingle();

          if (citizenData && citizenData.full_name) {
            prof = {
              id: `citizen-${citizenData.nik}`,
              nik: citizenData.nik,
              full_name: citizenData.full_name,
              role: "masyarakat",
              kecamatan: citizenData.kecamatan,
              desa: citizenData.desa,
              no_whatsapp: citizenData.phone_number,
              phone: citizenData.phone_number,
              address: citizenData.address
            };
          }
        } catch (e) {}

        // Query gis_pkkpr if still not found in mpp_citizens
        if (!prof) {
          try {
            const { data: pkkprCitizen } = await supabase
              .from("gis_pkkpr")
              .select("nik_pemohon, nama_pemohon, no_whatsapp, kecamatan, desa_kelurahan")
              .eq("nik_pemohon", potentialNik)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (pkkprCitizen && pkkprCitizen.nama_pemohon && !isAdministrativeTitle(pkkprCitizen.nama_pemohon)) {
              prof = {
                id: `citizen-${pkkprCitizen.nik_pemohon}`,
                nik: pkkprCitizen.nik_pemohon,
                full_name: pkkprCitizen.nama_pemohon,
                role: "masyarakat",
                kecamatan: pkkprCitizen.kecamatan,
                desa: pkkprCitizen.desa_kelurahan,
                no_whatsapp: pkkprCitizen.no_whatsapp,
                phone: pkkprCitizen.no_whatsapp
              };
            }
          } catch (e) {}
        }
      }

      // Step 3: Query profiles table if not resolved yet
      if (!prof && effectiveId && effectiveId !== "offline-user") {
        try {
          const res = await fetch(`/api/profiles?id=${encodeURIComponent(effectiveId)}`, { credentials: 'same-origin' });
          if (res.ok) {
            const resJson = await res.json();
            if (resJson.data && !isAdministrativeTitle(resJson.data.full_name)) prof = resJson.data;
          }
        } catch (e) {}

        if (!prof) {
          try {
            const { data } = await supabase
              .from("profiles")
              .select("id, email, full_name, company_name, role, nik, kecamatan, desa")
              .eq("id", effectiveId)
              .maybeSingle();
            if (data && !isAdministrativeTitle(data.full_name)) prof = data;
          } catch (e) {}
        }
      }

      // Step 4: Query profiles by Email or NIK
      if (!prof && effectiveEmail) {
        try {
          const res = await fetch(`/api/profiles?email=${encodeURIComponent(effectiveEmail)}`, { credentials: 'same-origin' });
          if (res.ok) {
            const resJson = await res.json();
            if (resJson.data && !isAdministrativeTitle(resJson.data.full_name)) prof = resJson.data;
          }
        } catch (e) {}

        if (!prof) {
          try {
            const { data } = await supabase
              .from("profiles")
              .select("id, email, full_name, company_name, role, nik, kecamatan, desa")
              .eq("email", effectiveEmail)
              .maybeSingle();
            if (data && !isAdministrativeTitle(data.full_name)) prof = data;
          } catch (e) {}
        }
      }

      if (!prof && potentialNik && /^\d{16}$/.test(potentialNik)) {
        try {
          const { data } = await supabase
            .from("profiles")
            .select("id, email, full_name, company_name, role, nik, kecamatan, desa")
            .eq("nik", potentialNik)
            .maybeSingle();
          if (data && !isAdministrativeTitle(data.full_name)) prof = data;
        } catch (e) {}
      }

      // Step 5: Fallback from localStorage luwu_citizen_data
      if (!prof && typeof window !== "undefined") {
        try {
          const rawCit = localStorage.getItem("luwu_citizen_data");
          if (rawCit) {
            const cit = JSON.parse(rawCit);
            if (cit && cit.full_name && !isAdministrativeTitle(cit.full_name)) {
              prof = {
                id: `citizen-${cit.nik || 'local'}`,
                nik: cit.nik || storedNik,
                full_name: cit.full_name,
                role: "masyarakat",
                kecamatan: cit.kecamatan,
                desa: cit.desa,
                no_whatsapp: cit.phone_number || cit.whatsapp,
                phone: cit.phone_number || cit.whatsapp
              };
            }
          }
        } catch (e) {}
      }

      const meta = user?.user_metadata || {};

      // Resolve NIK
      let resolvedNik = prof?.nik || prof?.no_ktp || prof?.no_nik || meta.nik || meta.no_ktp || activeProfile?.nik || activeProfile?.no_ktp || "";
      if (!resolvedNik || !/^\d{16}$/.test(resolvedNik)) {
        if (/^\d{16}$/.test(cleanNikFromEmail)) {
          resolvedNik = cleanNikFromEmail;
        } else if (/^\d{16}$/.test(storedNik)) {
          resolvedNik = storedNik;
        }
      }

      // Resolve Full Name
      let rawNama = prof?.full_name || prof?.nama || prof?.nama_lengkap || prof?.nama_pemohon || meta.full_name || meta.nama || meta.nama_lengkap || activeProfile?.full_name || activeProfile?.nama || "";
      let resolvedNama = resolveCleanCitizenName(rawNama, resolvedNik);

      // Resolve NIB & Company
      let resolvedNib = prof?.nib || prof?.no_nib || prof?.nib_oss || meta.nib || meta.no_nib || activeProfile?.nib || activeProfile?.no_nib || "";
      let resolvedPerusahaan = prof?.company_name || prof?.perusahaan || prof?.nama_perusahaan || prof?.nama_badan_usaha || meta.company_name || meta.perusahaan || meta.nama_perusahaan || activeProfile?.company_name || activeProfile?.perusahaan || "";

      // Resolve Location & Contact
      let rawKec = prof?.kecamatan || meta.kecamatan || activeProfile?.kecamatan || "";
      let resolvedKec = normalizeKecamatanName(rawKec, kecamatanList, districts);
      let resolvedDesa = prof?.desa || meta.desa || activeProfile?.desa || "";
      let resolvedWa = prof?.no_whatsapp || prof?.phone || prof?.no_hp || meta.no_whatsapp || meta.phone || activeProfile?.phone || activeProfile?.no_whatsapp || "";

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
    if (hasHydratedRef.current && hydratedProfile) return;
    fetchAndHydrateMasyarakatProfile().then(() => {
      hasHydratedRef.current = true;
    });
  }, [activeProfile?.email, activeProfile?.nik, kecamatanList?.length, districts?.length]);

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

  // Fetch User's PKKPR Applications from Supabase & Local Cache
  const fetchMyPkkprApplications = useCallback(async () => {
    setLoadingPkkprApps(true);
    try {
      const stored = localStorage.getItem("luwu_pkkpr_my_apps");
      let localApps: any[] = [];
      if (stored) {
        try { localApps = JSON.parse(stored); } catch (e) {}
      } else {
        // Default seed society submission (PKKPR-LUWU-321183) for instant verification
        const defaultApp = {
          id: "PKKPR-LUWU-321183",
          pkkpr_doc_number: "PKKPR-LUWU-321183",
          category: "Non-Berusaha",
          title: "Permohonan PKKPR Rumah Tinggal / Fasos",
          nama_pemohon: "Masyarakat",
          nik: "7317060202700001",
          no_whatsapp: "081234567890",
          kecamatan: "Ponrang",
          desa: "Ponrang",
          luas_m2: 500,
          geometry: {
            type: "FeatureCollection",
            features: [{
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: [[[120.28, -3.18], [120.29, -3.18], [120.29, -3.19], [120.28, -3.19], [120.28, -3.18]]]
              },
              properties: {}
            }]
          },
          status: "PENDING",
          pkkpr_status: "Menunggu Verifikasi Spasial PUPTR",
          created_at: new Date().toISOString()
        };
        localStorage.setItem("luwu_pkkpr_my_apps", JSON.stringify([defaultApp]));
        localApps = [defaultApp];
      }

      let user: any = null;
      try {
        const userRes = await supabase.auth.getUser();
        user = userRes?.data?.user || null;
      } catch (e) {}
      let remoteApps: any[] = [];
      if (user) {
        const { data, error } = await supabase
          .from("investments")
          .select("*")
          .or(`created_by.eq.${user.id},user_id.eq.${user.id}`);
        if (!error && data) {
          remoteApps = data;
        }
      }

      const mergedMap = new Map();
      [...localApps, ...remoteApps].forEach((app) => {
        const key = app.id || app.pkkpr_doc_number || app.title || app.created_at;
        if (key && !mergedMap.has(key)) {
          mergedMap.set(key, app);
        }
      });

      setMyPkkprApplications(Array.from(mergedMap.values()));
    } catch (err) {
      console.warn("Error fetching PKKPR apps:", err);
    } finally {
      setLoadingPkkprApps(false);
    }
  }, []);

  useEffect(() => {
    fetchMyPkkprApplications();
  }, [fetchMyPkkprApplications]);

  const openSpatialPkkprForm = async (category: "Berusaha" | "Non-Berusaha") => {
    setPkkprCategory(category);
    setPkkprTitle(category === "Berusaha" ? "Permohonan PKKPR Usaha/Komersial" : "Permohonan PKKPR Rumah Tinggal / Fasos");
    
    // Auto-Hydrate Profile dynamically from public.profiles
    const freshProf = await fetchAndHydrateMasyarakatProfile();
    const hNib = freshProf?.nib || hydratedProfile.nib || activeProfile?.nib || pkkprNib || "";
    const hPerusahaan = freshProf?.perusahaan || hydratedProfile.perusahaan || activeProfile?.perusahaan || pkkprPerusahaan || "";
    const rawKecVal = freshProf?.kecamatan || hydratedProfile.kecamatan || kecamatan || activeProfile?.kecamatan || "";
    const hKec = normalizeKecamatanName(rawKecVal, kecamatanList, districts);
    const hDesa = freshProf?.desa || hydratedProfile.desa || desa || activeProfile?.desa || "";
    
    const hNama = freshProf?.nama || hydratedProfile.nama || activeProfile?.full_name || nama || "";
    const hNik = freshProf?.nik || hydratedProfile.nik || activeProfile?.nik || userNik || "";

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

  const handleSertifikatUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      Swal.fire("Ukuran File Terlalu Besar", "Maksimal ukuran file Sertifikat adalah 15MB.", "warning");
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
    if (file.size > 15 * 1024 * 1024) {
      Swal.fire("Ukuran File Terlalu Besar", "Maksimal ukuran file Surat Pengantar adalah 15MB.", "warning");
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

  const handleSuratBebasSengketaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      Swal.fire("Ukuran File Terlalu Besar", "Maksimal ukuran file Surat Bebas Sengketa adalah 15MB.", "warning");
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
      let user: any = null;
      try {
        const userRes = await supabase.auth.getUser();
        user = userRes?.data?.user || null;
      } catch (e) {}

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
      const [sertifikatTanahStorageUrl, suratPengantarDesaStorageUrl, berkasLegalitasGabunganStorageUrl] = await Promise.all([
        uploadPkkprDocumentToStorage(fileSertifikat || sertifikatDataUrl, sertifikatFileName || 'sertifikat_tanah.pdf', 'sertifikat'),
        uploadPkkprDocumentToStorage(fileSuratPengantarDesa || suratPengantarDataUrl, suratPengantarFileName || 'surat_pengantar_desa.pdf', 'surat_pengantar'),
        uploadPkkprDocumentToStorage(finalMergedPdfBlob || finalMergedPdfDataUrl, `Berkas_Gabungan_PKKPR_${docNumber}.pdf`, 'berkas_gabungan')
      ]);

      const finalSertifikatUrl = sertifikatTanahStorageUrl || sertifikatDataUrl || null;
      const finalSuratPengantarUrl = suratPengantarDesaStorageUrl || suratPengantarDataUrl || null;
      const finalBerkasGabunganUrl = berkasLegalitasGabunganStorageUrl || finalMergedPdfDataUrl || null;

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
        surat_pengantar_desa_url: finalSuratPengantarUrl,
        berkas_legalitas_gabungan_url: finalBerkasGabunganUrl,
        sertifikat_file_name: sertifikatFileName || null,
        surat_pengantar_file_name: suratPengantarFileName || null,
        status: "PENDING",
        pkkpr_status: "Menunggu Verifikasi Spasial PUPTR",
        created_at: new Date().toISOString(),
        user_id: user?.id || null,
        created_by: user?.id || null,
      };

      try {
        // 1. Insert into gis_pkkpr table (Primary PostGIS Spatial Table)
        await supabase.from("gis_pkkpr").insert({
          id: docNumber,
          jenis_permohonan: pkkprCategory, // 'Berusaha' | 'Non-Berusaha'
          nama_permohonan: pkkprTitle || (pkkprCategory === "Berusaha" ? "Permohonan PKKPR Usaha/Komersial" : "Permohonan PKKPR Rumah Tinggal / Fasos"),
          nib_oss: pkkprCategory === "Berusaha" ? (pkkprNib || null) : null,
          nama_badan_usaha: pkkprCategory === "Berusaha" ? (pkkprPerusahaan || null) : null,
          nama_pemohon: finalNama,
          nik_pemohon: finalNik,
          no_whatsapp: kontak || null,
          sektor: pkkprCategory === "Berusaha" ? "Komersial / Usaha" : "Non-Komersial / Perumahan",
          kecamatan: pkkprKecamatan,
          desa_kelurahan: pkkprDesa,
          luas_m2: pkkprLuasM2 || 500,
          luas_ha: pkkprLuasM2 ? Number((pkkprLuasM2 / 10000).toFixed(4)) : 0.05,
          geom: null,
          geometry_json: pkkprGeometry,
          nama_berkas_kmz: "Batas_Poligon_Lokasi.kmz",
          berkas_kmz_url: null,
          status_pkkpr: "Pending Spatial Check",
          pertek_puptr_num: null,
          berita_acara_pertanian_num: null,
          sk_pkkpr_num: null,
          catatan_teknis: "Dalam proses analisis spasial tata ruang PUPTR.",
          user_id: user?.id || null,
          created_by: user?.id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sertifikat_tanah_url: finalSertifikatUrl,
          surat_pengantar_desa_url: finalSuratPengantarUrl,
          berkas_legalitas_gabungan_url: finalBerkasGabunganUrl
        });

        // 2. Insert into investments table (Secondary Fallback Table)
        await supabase.from("investments").insert({
          id: docNumber,
          title: `[PKKPR ${pkkprCategory}] ${pkkprTitle}`,
          name: pkkprCategory === "Berusaha" ? (pkkprPerusahaan || pkkprTitle) : (pkkprTitle || "Permohonan PKKPR Rumah Tinggal / Fasos"),
          category: pkkprCategory === "Berusaha" ? "Komersial / Usaha" : "Non-Komersial / Perseorangan",
          perusahaan: pkkprCategory === "Berusaha" ? pkkprPerusahaan || "Pelaku Usaha" : "Perseorangan",
          contact_pic: finalNama,
          nama_kontak_person: finalNama,
          plot_number: finalNik,
          sector: pkkprCategory === "Berusaha" ? "Komersial / Usaha" : "Non-Komersial / Perumahan",
          kecamatan: pkkprKecamatan,
          district_id: pkkprKecamatan,
          desa: pkkprDesa,
          village_id: pkkprDesa,
          area_ha: pkkprLuasM2 ? Number((pkkprLuasM2 / 10000).toFixed(2)) : 0.05,
          proposal_file_name: "Batas_Poligon_Lokasi.kmz",
          geometry: pkkprGeometry,
          status: "Pending Spatial Check",
          pkkpr_doc_number: null,
          user_id: user?.id || null,
          created_by: user?.id || null,
          created_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn("Supabase insert warning:", err);
      }

      const existing = JSON.parse(localStorage.getItem("luwu_pkkpr_my_apps") || "[]");
      const updated = [newPkkprApp, ...existing];
      localStorage.setItem("luwu_pkkpr_my_apps", JSON.stringify(updated));

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

      setMyPkkprApplications(updated);
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
          <div class="text-left space-y-2 text-sm">
            <p><strong>Nomor Berkas:</strong> <span class="font-mono text-emerald-600 font-bold">${docNumber}</span></p>
            <p><strong>Jalur Permohonan:</strong> PKKPR ${pkkprCategory}</p>
            <p><strong>Status:</strong> <span class="text-amber-600 font-bold">Menunggu Verifikasi Spasial PUPTR</span></p>
            <p class="text-xs text-gray-500 mt-2">Permohonan Anda telah masuk ke dalam antrean verifikasi Dinas PUPTR & Dinas Pertanian Kabupaten Luwu.</p>
          </div>
        `,
        icon: "success",
        confirmButtonText: "Selesai",
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
            const { data: prof } = await supabase.from("profiles").select("nik").eq("id", user.id).maybeSingle();
            if (prof?.nik) {
              setUserNik((prev) => prev || prof.nik);
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
          .select("id, name, sector, kecamatan, desa")
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

  // Load complaints for this user
  const fetchMyComplaints = useCallback(async () => {
    if (!activeProfile?.id || activeProfile.id === "offline-user") return;
    setLoadingComplaints(true);
    try {
      const { data, error } = await supabase
        .from("pengaduan")
        .select("*")
        .eq("pelapor_id", activeProfile.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setComplaints(data);
      } else {
        const { data: allData, error: allErr } = await supabase
          .from("pengaduan")
          .select("*")
          .order("created_at", { ascending: false });

        if (!allErr && allData) {
          const myComplaints = allData.filter((item: any) =>
            String(item.pelapor_id) === String(activeProfile.id) ||
            (activeProfile.email && String(item.kontak_pelapor || "").toLowerCase().includes(activeProfile.email.toLowerCase())) ||
            (activeProfile.full_name && String(item.nama_pelapor || "").toLowerCase().includes(activeProfile.full_name.toLowerCase()))
          );
          setComplaints(myComplaints);
        } else {
          setComplaints([]);
        }
      }
    } catch (err: any) {
      console.error("Gagal memuat daftar pengaduan:", err);
      setComplaints([]);
    } finally {
      setLoadingComplaints(false);
    }
  }, [activeProfile?.id, activeProfile?.email, activeProfile?.full_name]);

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

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"} font-sans pb-12 transition-all duration-300`}>
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-10 w-[400px] h-[400px] bg-red-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className={`sticky top-0 z-40 border-b ${isDarkMode ? "bg-slate-900/85 border-slate-800" : "bg-white/85 border-slate-200"} backdrop-blur-md transition-colors`}>
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
              onClick={() => {
                if (onToggleTheme) {
                  onToggleTheme();
                } else {
                  const isDark = document.documentElement.classList.contains("dark");
                  if (isDark) {
                    document.documentElement.classList.remove("dark");
                  } else {
                    document.documentElement.classList.add("dark");
                  }
                }
              }}
              title={isDarkMode ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
              aria-label="Toggle Theme"
              className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                isDarkMode
                  ? "bg-slate-800/80 hover:bg-slate-700 text-amber-700 dark:text-amber-400 border-slate-700/60 shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-indigo-600 border-slate-200/80 shadow-sm"
              }`}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-700 dark:text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
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
        <div className={`p-2 rounded-2xl border backdrop-blur-xl grid grid-cols-2 lg:grid-cols-4 gap-2.5 shadow-xl ${
          isDarkMode ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200"
        }`}>
          {/* Option 1: Pengajuan Izin PKKPR */}
          <button
            type="button"
            onClick={() => setMainArea("pkkpr")}
            className={`py-3 px-2.5 sm:px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-start gap-2.5 cursor-pointer min-h-[54px] ${
              mainArea === "pkkpr"
                ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/40"
                : isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800/60" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
                : isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800/60" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
                : isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800/60" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
                : isDarkMode ? "text-slate-400 hover:text-white hover:bg-slate-800/60" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
        <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm backdrop-blur-md transition-all ${
          isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
        }`}>
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
          <div className={`p-4 sm:p-8 rounded-3xl border relative overflow-hidden backdrop-blur-md ${
            isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-3">
                <ShieldCheck className="w-4 h-4" />
                <span>Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) Kabupaten Luwu</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
                Pusat Permohonan Izin PKKPR Spasial
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Silakan pilih jalur perizinan sesuai dengan klasifikasi pemanfaatan ruang dan status badan usaha/perseorangan Anda.
                Sistem akan memvalidasi tumpang tindih spasial terhadap RTRW, RDTR, dan zona lindung secara otomatis.
              </p>
            </div>
          </div>

          {/* DUAL-PATHWAY PERMITTING MENU */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Card A: PKKPR Berusaha */}
            <div className={`rounded-3xl border p-4 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden ${
              isDarkMode
                ? "bg-gradient-to-b from-slate-900 to-slate-950 border-emerald-500/30 hover:border-emerald-500/60 shadow-emerald-950/20"
                : "bg-white border-emerald-200 hover:border-emerald-400 shadow-lg shadow-emerald-900/5"
            }`}>
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
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Kegiatan Komersial & Usaha
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                    PKKPR Berusaha
                  </h3>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-medium">
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
            <div className={`rounded-3xl border p-4 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden ${
              isDarkMode
                ? "bg-gradient-to-b from-slate-900 to-slate-950 border-indigo-500/30 hover:border-indigo-500/60 shadow-indigo-950/20"
                : "bg-white border-indigo-200 hover:border-indigo-400 shadow-lg shadow-indigo-900/5"
            }`}>
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
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Non-Komersial / Perseorangan
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                    PKKPR Non-Berusaha
                  </h3>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-medium">
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
                    className={`p-5 rounded-2xl border transition-all ${
                      isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 text-[10px] font-mono font-extrabold rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {app.pkkpr_doc_number || "PKKPR-LUWU"}
                      </span>
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                        app.category === "Berusaha" ? "bg-emerald-500/10 text-emerald-500" : "bg-indigo-500/10 text-indigo-500"
                      }`}>
                        {app.category || "PKKPR"}
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-2 mb-2">
                      {app.title || app.judul || "Permohonan PKKPR Spasial"}
                    </h4>
                    <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 mb-4 font-medium">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Kec. {app.kecamatan || app.district_name || "-"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{app.created_at ? new Date(app.created_at).toLocaleDateString("id-ID") : "-"}</span>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                        {app.pkkpr_status || app.status || "Menunggu Verifikasi PUPTR"}
                      </span>
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
                    placeholder={pkkprCategory === "Berusaha" ? "Contoh: Pembangunan Toko Modern & Gudang Semen" : "Contoh: Pembangunan Rumah Tinggal Keluarga"}
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white focus:border-emerald-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500"
                    }`}
                  />
                </div>

                {/* Conditional Fields for PKKPR Berusaha (Auto-Hydrated & Locked) */}
                {pkkprCategory === "Berusaha" && (
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
                            <span className="block font-black text-sm">Buka Peta Digitasi Spasial Lahan</span>
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
                              Format: PDF, JPG, PNG (Max 15MB)
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
                              Format: PDF, JPG, PNG (Max 15MB)
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
                  </div>

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
    </div>
  );
}

// legal fix: replace SP4N-LAPOR trademark with local branding Lapor Luwu
// ux polish: add explicit live camera and gallery split buttons for evidence upload
// bugfix: resolve mobile keyboard overlap on textarea and fix broken header logo
// bugfix: fix logo path in masyarakat dashboard
// branding hotfix: applied transparant.png to PWA manifest and UI components
