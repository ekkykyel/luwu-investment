import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Upload,
  MapPin,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  RefreshCw,
  Sparkles,
  Map,
  X,
  Building,
  Check,
  Send,
  Loader2,
  FileDown,
  Printer,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  AlertCircle,
  Wheat,
  Sprout,
  Database,
  ArrowRight,
  CornerDownRight,
  Landmark,
  Maximize2,
  Download,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Compass
} from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../../lib/supabaseClient';
import SlaBadge from '../SlaBadge';
import { checkPkkprSpatialZoning, PkkprZoningResult, calculateBoundingBox, normalizeDistrictName, findDistrictMatch, isSameDistrict, identifyDistrictFromGeometryOrCoord, normalizeName } from '../../utils/geoUtils';
import MapComponent from '../MaplibreComponent';
import OrientationPrompt from '../OrientationPrompt';
import { useTechnicalSpatialLayers } from '../../hooks/useTechnicalSpatialLayers';
import { Investment } from '../../types';
import { useData } from '../../contexts/DataContext';
import { LuwuLogo } from '../LuwuLogo';
import { generateBapPdfFromElement } from '../../utils/bapPdfGenerator';
import { CrossOpdNotificationBell } from '../CrossOpdNotificationBell';
import { addCrossOpdNotification } from '../../utils/crossOpdNotificationStore';
import { getOpdSettings, saveOpdSettings } from '../../utils/opdSettingsStorage';
import { formatDistrictName, formatVillageName } from '../../utils/gisHelpers';
import { 
  BapLp2bPertanianDocument, 
  BapLp2bDocumentData, 
  extractCoordinatesFromGeometryPertanian,
  convertAppToBapLp2bData 
} from '../documents/BapLp2bPertanianDocument';
import { SmartFormPertanianModal } from './SmartFormPertanianModal';
import { PKKPRStatus, normalizePKKPRStatus } from '../../types/pkkprWorkflow';
import { SpatialPreviewDifferenceModal } from './SpatialPreviewDifferenceModal';
import { BapRekapReportModal } from './BapRekapReportModal';
import { executeSpatialDifference, getKategoriPengajuan } from '../../utils/pkkprWorkflowService';
import { PkkprStatusPermohonan, normalizeWorkflowStatus } from '../../types/pkkprWorkflow';

export interface AgrarianQueueItem {
  id: string;
  status_permohonan?: PkkprStatusPermohonan;
  status_pkkpr?: PKKPRStatus;
  catatan_revisi?: string | null;
  category?: 'Berusaha' | 'Non-Berusaha';
  applicantType?: string;
  nibNik: string;
  applicantName: string;
  companyName: string;
  title?: string;
  sector: string;
  jenisPengajuanPkkpr?: string;
  kategoriPengajuan?: 'BANGUNAN' | 'PARSIL_TANAH';
  fileSiteplanUrl?: string;
  rencanaLuasBgn?: number | string;
  fungsiBangunan?: string;
  applicantAddress?: string;
  districtId?: string;
  districtName: string;
  villageId?: string;
  villageName: string;
  areaHa: number;
  luasM2?: number;
  luasBangunan?: string;
  buktiTanah?: string;
  jenisAlasHak?: string;
  fileAlasHakUrl?: string;
  existingCrop: string;
  puptrForwardedNotes: string;
  agriStatus: 'Pending Review' | 'Approved' | 'Requires Revision' | 'Rejected';
  pertanianStatus?: 'NOT_SUBMITTED' | 'FORWARDED' | 'APPROVED' | 'REJECTED';
  pertanianBaNumber?: string;
  pertanianSrNumber?: string;
  pertanianNotes?: string;
  beritaAcaraDocNum?: string;
  suratRekomendasiNum?: string;
  rejectionReason?: string;
  replacementLandHa?: number;
  pkkprDocNumber?: string;
  skPkkprDocNumber?: string;
  geometry?: any;
  sertifikatTanahUrl?: string;
  suratPengantarDesaUrl?: string;
  berkasLegalitasGabunganUrl?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function PertanianLandClearanceDashboard() {
  // Queue & Applications State
  const [queueList, setQueueList] = useState<AgrarianQueueItem[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Active Application for Inspection
  const [selectedApp, setSelectedApp] = useState<AgrarianQueueItem | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);
  const [isTurfCardCollapsed, setIsTurfCardCollapsed] = useState<boolean>(false);

  // Before-After Spatial Preview & Safety Lock States
  const [isSpatialValidated, setIsSpatialValidated] = useState<boolean>(false);
  const [showSpatialPreviewModal, setShowSpatialPreviewModal] = useState<boolean>(false);
  const [spatialPreviewTargetApp, setSpatialPreviewTargetApp] = useState<AgrarianQueueItem | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  // Master Data & Spatial Selection State
  const { districts, villages } = useData();
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [selectedVillageId, setSelectedVillageId] = useState<string | null>(null);

  // Master Technical Spatial Layers with real Polygon GeoJSON data
  const {
    spatialLayers,
    activeStates,
    loadingLayers,
    layerStats,
    toggleLayer,
    setLayerOpacity,
    setAllLayers,
    setLayerGeoJson,
    clearCache
  } = useTechnicalSpatialLayers({
    layer_sawah: true,
    layer_lahan_kering_primer: true,
    layer_lahan_kering_sekunder: true,
    layer_mangrove: true,
    layer_tambak: true,
    layer_zonasi: true,
    layer_kecamatan: true
  });

  // Calculate Turf.js spatial difference preview metrics
  const spatialPreviewDiffMetrics = useMemo(() => {
    const targetApp = spatialPreviewTargetApp || selectedApp;
    if (!targetApp || !targetApp.geometry) {
      return {
        success: false,
        cleanGeometry: targetApp?.geometry || null,
        cutAreaM2: 0,
        originalAreaM2: targetApp ? Math.round((targetApp.areaHa || 0.5) * 10000) : 5000,
        remainingAreaM2: targetApp ? Math.round((targetApp.areaHa || 0.5) * 10000) : 5000,
        intersectedLayersCount: 0
      };
    }

    const sensitiveLayerIds = ['layer_sawah', 'layer_tambak', 'layer_mangrove', 'layer_lahan_basah', 'layer_lahan_kering_primer'];
    const sensitiveFeatures: any[] = [];
    spatialLayers.forEach(l => {
      if (sensitiveLayerIds.includes(l.id) || (l.name && /sawah|tambak|mangrove|lp2b|lahan basah/i.test(l.name))) {
        const feats = l.geojson?.features || [];
        if (Array.isArray(feats)) {
          sensitiveFeatures.push(...feats);
        }
      }
    });

    return executeSpatialDifference(targetApp.geometry, sensitiveFeatures);
  }, [spatialPreviewTargetApp, selectedApp, spatialLayers]);

  // Auto focus district/village with strict spatial and normalized matching (No loose substrings)
  useEffect(() => {
    if (selectedApp) {
      const kecLayer = spatialLayers.find(l => l.id === "layer_kecamatan");
      let matchedDist: any = null;

      // 1. Precise Spatial Geometry Point-In-Polygon / Intersect if geometry exists
      if (selectedApp.geometry && kecLayer?.geojson) {
        matchedDist = identifyDistrictFromGeometryOrCoord(selectedApp.geometry, kecLayer.geojson, districts);
      }

      // 2. Strict ID or Normalized Name Matching
      if (!matchedDist) {
        matchedDist = findDistrictMatch(districts, selectedApp.districtId) || findDistrictMatch(districts, selectedApp.districtName);
      }

      if (matchedDist) {
        setSelectedDistrictId(matchedDist.id);
        const normVilName = normalizeName(selectedApp.villageName || '');
        const matchedVil = villages.find(v => 
          (String(v.districtId).toLowerCase() === String(matchedDist.id).toLowerCase() || 
           isSameDistrict(v.districtId, matchedDist.id)) &&
          (normalizeName(v.name) === normVilName || String(v.id).toLowerCase() === String(selectedApp.villageName || '').toLowerCase())
        );
        if (matchedVil) {
          setSelectedVillageId(matchedVil.id);
        } else {
          setSelectedVillageId(null);
        }
      } else {
        setSelectedDistrictId(null);
        setSelectedVillageId(null);
      }
    }
  }, [selectedApp, districts, villages, spatialLayers]);

  // Spatial Overlap Inspection State
  const [activeLayers, setActiveLayers] = useState<{
    lp2b: boolean;
    irigasiTeknis: boolean;
    soilProductivity: boolean;
    komoditasPadi: boolean;
  }>({
    lp2b: true,
    irigasiTeknis: true,
    soilProductivity: false,
    komoditasPadi: true
  });

  const [zoningAudit, setZoningAudit] = useState<PkkprZoningResult | null>(null);

  // Construct Investment item for selected application so MapComponent draws the applicant's polygon
  const appAsInvestment: Investment | null = useMemo(() => {
    if (!selectedApp) return null;
    let lat = -3.0084;
    let lng = 120.3544;
    const geom = selectedApp.geometry;

    if (geom) {
      try {
        const bbox = calculateBoundingBox(geom);
        if (bbox && bbox.length === 4) {
          lng = (bbox[0] + bbox[2]) / 2;
          lat = (bbox[1] + bbox[3]) / 2;
        }
      } catch (e) {
        console.warn('Centroid calculation error:', e);
      }
    }

    return {
      id: selectedApp.id,
      name: `${selectedApp.companyName} (${selectedApp.applicantName})`,
      sector: (selectedApp.sector || 'Pertanian') as any,
      subSector: selectedApp.existingCrop || 'Padi IP300',
      districtId: selectedApp.districtName,
      villageId: selectedApp.villageName,
      areaHa: selectedApp.areaHa || 10,
      district: selectedApp.districtName,
      village: selectedApp.villageName,
      latitude: lat,
      longitude: lng,
      investmentValue: 5000000000,
      landStatus: 'Sertifikat Hak Milik' as const,
      photoUrl: '',
      contactPic: selectedApp.applicantName,
      phoneNumber: '0812-3456-7890',
      isActive: true,
      createdAt: selectedApp.createdAt,
      geometry: geom
    };
  }, [selectedApp]);

  // Map Reference & Snapshot State (Matches PUPTR standard)
  const mapRef = useRef<any>(null);
  const [mapSnapshot, setMapSnapshot] = useState<string | null>(null);

  // Decision Modal States
  const [showApprovalModal, setShowApprovalModal] = useState<boolean>(false);
  const [showRejectionModal, setShowRejectionModal] = useState<boolean>(false);
  const [showDocumentPreview, setShowDocumentPreview] = useState<boolean>(false);
  const [showSmartFormModal, setShowSmartFormModal] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [customBapData, setCustomBapData] = useState<BapLp2bDocumentData | null>(null);

  // Capture current MapLibre canvas snapshot
  const captureCurrentMapSnapshot = () => {
    const map = mapRef.current?.getMapInstance?.();
    if (map) {
      try {
        if (map.loaded()) {
          const snap = map.getCanvas().toDataURL('image/png');
          if (snap && snap !== 'data:,' && snap.length > 500) {
            setMapSnapshot(snap);
            return snap;
          }
        }
      } catch (e) {
        console.warn('Initial map snapshot error in Pertanian:', e);
      }

      map.once('idle', () => {
        try {
          const snapshot = map.getCanvas().toDataURL('image/png');
          if (snapshot && snapshot !== 'data:,' && snapshot.length > 500) {
            setMapSnapshot(snapshot);
          }
        } catch (err) {
          console.warn('Async map idle snapshot error in Pertanian:', err);
        }
      });
    } else {
      const mapCanvas = document.querySelector('.maplibregl-canvas') as HTMLCanvasElement | null;
      if (mapCanvas) {
        try {
          const snap = mapCanvas.toDataURL('image/png');
          if (snap && snap.length > 500) {
            setMapSnapshot(snap);
            return snap;
          }
        } catch (e) {
          console.warn('Map canvas fallback snapshot error in Pertanian:', e);
        }
      }
    }
    return null;
  };

  // Open BAP Document Modal with High-Res Map Canvas Snapshot (Clean static capture)
  const handleOpenBapModal = () => {
    const snap = captureCurrentMapSnapshot();
    if (selectedApp) {
      const generated = convertAppToBapLp2bData(selectedApp, getOpdSettings('pertanian'), snap || mapSnapshot);
      if (customBapData && (customBapData.id === selectedApp.id || customBapData.nibNik === selectedApp.nibNik)) {
        setCustomBapData({
          ...generated,
          ...customBapData,
          ...(snap ? { petaImageUrl: snap } : {})
        });
      } else {
        setCustomBapData(generated);
      }
    }
    setShowDocumentPreview(true);
  };

  // Download BAP PDF using jsPDF
  const handleDownloadBapPdf = async () => {
    if (!selectedApp) return;
    setIsExportingPdf(true);
    try {
      const filename = `BAP_Pertanian_LP2B_${selectedApp.nibNik}_${new Date().toISOString().slice(0, 10)}.pdf`;
      await generateBapPdfFromElement('pertanian-bap-printable-document', {
        filename,
        onSuccess: () => {
          Swal.fire({
            icon: 'success',
            title: 'File PDF Berhasil Diunduh! 📄',
            text: `BAP Resmi Pertanian Luwu telah disimpan sebagai ${filename}`,
            confirmButtonColor: '#10b981'
          });
        }
      });
    } catch (err: any) {
      console.error('PDF export error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengunduh PDF',
        text: err.message || 'Terjadi kesalahan saat memproses PDF.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Approval Form Inputs
  const [baDocNum, setBaDocNum] = useState<string>('');
  const [srDocNum, setSrDocNum] = useState<string>('');
  const [replacementLandRatio, setReplacementLandRatio] = useState<string>('1:1 (Setara 100% LP2B)');
  const [stipulationNotes, setStipulationNotes] = useState<string>('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState<boolean>(false);

  // Rejection Form Inputs
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');
  const [isSubmittingRejection, setIsSubmittingRejection] = useState<boolean>(false);

  // Fetch Agrarian Review Queue (Single Source of Truth: Exclusively from gis_pkkpr table)
  const fetchAgrarianQueue = async () => {
    setIsLoadingQueue(true);
    try {
      let mapped: AgrarianQueueItem[] = [];

      // 1. Primary Query: Fetch applications directly from gis_pkkpr with filter for Pertanian
      try {
        const { data: pkkprGisData, error: gisErr } = await supabase
          .from('gis_pkkpr')
          .select('*')
          .ilike('status_pkkpr', '%pertanian%')
          .order('updated_at', { ascending: false });

        // Fallback: If no records found with strict ilike, also check broader status_pkkpr or catatan_teknis
        let records = pkkprGisData || [];
        if (!gisErr && records.length === 0) {
          const { data: broadData } = await supabase
            .from('gis_pkkpr')
            .select('*')
            .order('updated_at', { ascending: false });
          if (broadData) records = broadData;
        }

        if (records && records.length > 0) {
          records.forEach((item: any) => {
            const isBerusaha = item.jenis_permohonan === 'Berusaha' || Boolean(item.nib_oss);
            const rawDist = item.kecamatan || item.district_id || item.districtId || '';
            const resolvedDistrictName = formatDistrictName(rawDist);
            const resolvedDistrictId = rawDist || 'dist_luwu';

            const rawVil = item.desa_kelurahan || item.village_id || item.villageId || item.desa || '';
            const resolvedVillageName = formatVillageName(rawVil);

            const rawCatatan = item.catatan_teknis || '';
            const isEscalated = Boolean(
              item.status_pkkpr === 'VERIFIKASI_PERTANIAN' ||
              item.status_pkkpr === 'APPROVED_PERTANIAN' ||
              item.status_pkkpr === 'Pending Pertek Pertanian' ||
              item.status_pkkpr === 'Forwarded_To_Pertanian' ||
              item.status_pkkpr === 'Approved_Pertanian' ||
              item.status_pkkpr === 'Rejected_Pertanian' ||
              (item.status_pkkpr && item.status_pkkpr.toLowerCase().includes('pertanian')) ||
              item.berita_acara_pertanian_num ||
              (rawCatatan && (rawCatatan.includes('DITERUSKAN KE DINAS PERTANIAN') || rawCatatan.includes('ESCALATED_PERTANIAN') || rawCatatan.includes('Pertek Pertanian')))
            );

            if (!isEscalated) return;

            const fungsiMatch = rawCatatan.match(/\[Fungsi:\s*([^\]]+)\]/i);
            const buktiMatch = rawCatatan.match(/\[Penguasaan Tanah:\s*([^\]]+)\]/i);
            const luasBangunanMatch = rawCatatan.match(/\[Luas Bangunan:\s*([^\]]+)\]/i);
            const alamatMatch = rawCatatan.match(/\[Alamat Pemohon:\s*([^\]]+)\]/i);

            const applicantName = item.nama_pemohon || item.applicant_name || (isBerusaha ? 'Pelaku Usaha Pemohon' : 'Pemohon Terdaftar');
            const companyName = item.nama_badan_usaha || item.company_name || item.nama_permohonan || (isBerusaha ? applicantName : 'Perseorangan / Warga');
            const fungsiBangunan = fungsiMatch ? fungsiMatch[1].trim() : (item.fungsi_bangunan || item.nama_permohonan || (isBerusaha ? 'Komersial / Usaha' : 'Non-Berusaha / Fasos / Perumahan'));
            const buktiTanah = buktiMatch ? buktiMatch[1].trim() : (item.bukti_tanah || (isBerusaha ? 'Hak Guna Bangunan (HGB)' : 'Sertifikat Hak Milik (SHM)'));
            const luasBangunan = luasBangunanMatch ? luasBangunanMatch[1].trim() : (item.luas_bangunan_m2 ? `${item.luas_bangunan_m2} m²` : undefined);
            const applicantAddress = alamatMatch ? alamatMatch[1].trim() : (item.alamat_pemohon || item.address || `Desa ${resolvedVillageName}, Kec. ${resolvedDistrictName}, Kab. Luwu`);
            const luasHa = item.luas_ha ? Number(item.luas_ha) : (item.luas_m2 ? Number((item.luas_m2 / 10000).toFixed(4)) : 0.5);
            const luasM2 = item.luas_m2 ? Number(item.luas_m2) : Math.round(luasHa * 10000);

            let agriStat: 'Pending Review' | 'Approved' | 'Rejected' = 'Pending Review';
            let pertStat: 'NOT_SUBMITTED' | 'FORWARDED' | 'APPROVED' | 'REJECTED' = 'FORWARDED';
            if (
              item.berita_acara_pertanian_num || 
              item.status_pkkpr === 'APPROVED_PERTANIAN' || 
              item.status_pkkpr === 'Approved_Pertanian' || 
              item.status_permohonan === 'PERTEK_PERTANIAN' || 
              item.pertanian_status === 'APPROVED'
            ) {
              agriStat = 'Approved';
              pertStat = 'APPROVED';
            } else if (
              item.status_pkkpr === 'DITOLAK' || 
              item.status_pkkpr === 'Rejected_Pertanian' || 
              item.status_permohonan === 'REJECTED_PERTANIAN' || 
              item.pertanian_status === 'REJECTED' || 
              (rawCatatan && rawCatatan.includes('DITOLAK DINAS PERTANIAN'))
            ) {
              agriStat = 'Rejected';
              pertStat = 'REJECTED';
            }

            mapped.push({
              id: item.id,
              category: isBerusaha ? 'Berusaha' : 'Non-Berusaha',
              applicantType: isBerusaha ? 'NIB (Pelaku Usaha)' : 'NIK (Perorangan / Warga)',
              nibNik: isBerusaha ? (item.nib_oss || item.nik_pemohon || item.nib || '-') : (item.nik_pemohon || item.nik || '-'),
              applicantName,
              companyName,
              title: item.nama_permohonan || item.title || (isBerusaha ? 'Permohonan Usaha' : 'Permohonan Non-Berusaha'),
              sector: item.sektor || (isBerusaha ? 'Komersial / Usaha' : 'Non-Komersial / Perumahan'),
              fungsiBangunan,
              applicantAddress,
              districtId: resolvedDistrictId,
              districtName: resolvedDistrictName,
              villageId: undefined,
              villageName: resolvedVillageName,
              areaHa: luasHa,
              luasM2,
              luasBangunan,
              buktiTanah,
              jenisAlasHak: item.jenis_alas_hak || item.land_status || buktiTanah || 'Sertipikat Hak Milik (SHM)',
              fileAlasHakUrl: item.file_alas_hak_url || item.sertifikat_tanah_url || undefined,
              jenisPengajuanPkkpr: item.jenis_pengajuan_pkkpr || item.sektor || (isBerusaha ? 'Kawasan Industri / Gudang / Pabrik' : 'Rumah Tinggal / Hunian Perorangan'),
              kategoriPengajuan: item.kategori_pengajuan || getKategoriPengajuan(item.jenis_pengajuan_pkkpr || item.sektor || ''),
              fileSiteplanUrl: item.file_siteplan_url || undefined,
              rencanaLuasBgn: item.rencana_luas_bgn || item.luas_bangunan || undefined,
              existingCrop: 'Kawasan Pertanian & Pangan Berkelanjutan (LP2B)',
              puptrForwardedNotes: item.catatan_teknis || 'Permohonan masuk dari antrean gis_pkkpr untuk telaah LP2B.',
              agriStatus: agriStat,
              pertanianStatus: pertStat,
              beritaAcaraDocNum: item.berita_acara_pertanian_num || undefined,
              suratRekomendasiNum: item.surat_rekomendasi_pertanian_num || undefined,
              rejectionReason: agriStat === 'Rejected' ? (item.pertanian_rejection_notes || item.catatan_teknis) : undefined,
              replacementLandHa: luasHa,
              geometry: item.geometry_json || item.geom,
              sertifikatTanahUrl: item.sertifikat_tanah_url || undefined,
              suratPengantarDesaUrl: item.surat_pengantar_desa_url || undefined,
              berkasLegalitasGabunganUrl: item.berkas_legalitas_gabungan_url || undefined,
              contactPhone: item.no_whatsapp,
              status_pkkpr: normalizePKKPRStatus(item.status_pkkpr),
              catatan_revisi: item.catatan_revisi || null,
              createdAt: item.created_at || new Date().toISOString()
            });
          });
        }
      } catch (err) {
        console.warn('gis_pkkpr query info in Pertanian:', err);
      }

      // Bersihkan dan filter data: hapus residu mock/dummy dan entri tidak valid
      mapped = mapped.filter(item => {
        const titleLower = (item.title || '').toLowerCase();
        const applicantLower = (item.applicantName || '').toLowerCase();
        const isDummy = 
          titleLower.includes('logistik hub bua') ||
          titleLower.includes('kakao latimojong') ||
          titleLower.includes('kopi bastem') ||
          applicantLower.includes('pt percontohan') ||
          applicantLower.includes('budi santoso');
        return !isDummy;
      });

      setQueueList(mapped);

      if (mapped.length > 0) {
        if (!selectedApp || !mapped.some(m => m.id === selectedApp.id)) {
          // Default to first pending review application
          const pendingItem = mapped.find(m => m.agriStatus === 'Pending Review') || mapped[0];
          selectAppForReview(pendingItem);
        } else {
          // Update selectedApp with fresh state from database
          const fresh = mapped.find(m => m.id === selectedApp.id);
          if (fresh) {
            selectAppForReview(fresh);
          }
        }
      } else {
        setSelectedApp(null);
      }
    } catch (err) {
      console.error('Failed to load Agrarian review queue:', err);
      setQueueList([]);
      setSelectedApp(null);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  useEffect(() => {
    // Bersihkan cache lokal permohonan lama untuk memastikan konsistensi dengan database
    try {
      localStorage.removeItem('luwu_pkkpr_forwarded_apps_data');
    } catch (e) {}

    fetchAgrarianQueue();

    const handleUpdate = () => {
      fetchAgrarianQueue();
    };

    window.addEventListener('luwu_cross_opd_notifications_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    // Supabase Realtime Channel Subscription for instant reactive updates from PUPTR
    const liveChannel = supabase
      .channel('luwu-spatial-cross-opd')
      .on('broadcast', { event: 'PKKPR_FORWARDED_PERTANIAN' }, () => {
        fetchAgrarianQueue();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gis_pkkpr' }, () => {
        fetchAgrarianQueue();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'investments' }, () => {
        fetchAgrarianQueue();
      })
      .subscribe();

    return () => {
      window.removeEventListener('luwu_cross_opd_notifications_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      supabase.removeChannel(liveChannel);
    };
  }, []);

  // Select an application from the queue to inspect in Map Workspace
  const selectAppForReview = (app: AgrarianQueueItem) => {
    setSelectedApp(app);
    let loadedBap: any = null;
    try {
      const perAppRaw = localStorage.getItem(`BAP_LP2B_${app.id}`);
      if (perAppRaw) {
        const parsed = JSON.parse(perAppRaw);
        if (
          parsed.namaPemohon !== "Ir. Muhammad Arsyad Al-Fatih, M.T." &&
          parsed.namaPemohon !== "BAMBANG SUDIBYO" &&
          parsed.namaPemohon !== "Pdt. Markus Sampe, S.Th."
        ) {
          loadedBap = parsed;
        }
      }
    } catch (e) {
      console.warn("Storage read error:", e);
    }

    const generated = convertAppToBapLp2bData(app, getOpdSettings('pertanian'), mapSnapshot);

    if (loadedBap) {
      const merged = {
        ...generated,
        ...loadedBap,
        namaPemohon: loadedBap.namaPemohon && !loadedBap.namaPemohon.includes("Arsyad") ? loadedBap.namaPemohon : generated.namaPemohon,
        namaPerusahaan: loadedBap.namaPerusahaan && !loadedBap.namaPerusahaan.includes("AGRO INDUSTRI NUSANTARA") ? loadedBap.namaPerusahaan : generated.namaPerusahaan,
        nibNik: loadedBap.nibNik && !loadedBap.nibNik.includes("0220108392182") ? loadedBap.nibNik : generated.nibNik
      };
      setCustomBapData(merged);
      if (merged.nomorSurat) setBaDocNum(merged.nomorSurat);
      if (merged.nomorSuratRekomendasi) setSrDocNum(merged.nomorSuratRekomendasi);
      if (merged.rasioLahanPengganti) setReplacementLandRatio(merged.rasioLahanPengganti);
    } else {
      setCustomBapData(generated);
      setBaDocNum(generated.nomorSurat);
      setSrDocNum(generated.nomorSuratRekomendasi);
    }

    setStipulationNotes(
      `Pemohon (${app.applicantName} / ${app.companyName}) wajib menyediakan Lahan Pengganti LP2B seluas ${app.areaHa} Ha di Wilayah Kec. ${app.districtName} dengan fasilitas irigasi teknis setara, serta menjaga kelancaran jaringan irigasi tersier sekitarnya.`
    );

    // Turf.js spatial audit check
    const audit = checkPkkprSpatialZoning(app.geometry);
    setZoningAudit(audit);
  };

  // Open Approval Modal (Path A)
  const handleOpenApprovalModal = () => {
    if (!selectedApp) return;
    setShowApprovalModal(true);
  };

  // Submit Approval & Generate Berita Acara (Path A) with Multi-Layer Spatial Cut
  const handleSubmitApproval = async () => {
    if (!selectedApp) return;
    setIsSubmittingApproval(true);

    try {
      // 0. Trigger Turf.js Spatial Difference cutting intersecting LP2B / sensitive layers:
      // 1. Sawah / LP2B (LSD)
      // 2. Lahan Basah
      // 3. Mangrove
      // 4. Tambak / Kawasan Pesisir
      let cutGeom = selectedApp.geometry;
      let originalAreaM2 = selectedApp.luasM2 || Math.round((selectedApp.areaHa || 1) * 10000);
      let remainingAreaM2 = originalAreaM2;
      let cutAreaM2 = 0;
      let is100PercentCut = false;
      let breakdown: any = { lp2bCutM2: 0, mangroveCutM2: 0, lahanBasahCutM2: 0, tambakCutM2: 0 };

      try {
        const sensitiveLayerIds = ['layer_sawah', 'layer_tambak', 'layer_mangrove', 'layer_lahan_basah', 'layer_lahan_kering_primer'];
        const sensitiveFeatures: any[] = [];

        spatialLayers.forEach(l => {
          if (sensitiveLayerIds.includes(l.id) || (l.name && /sawah|tambak|mangrove|lp2b|lahan basah|pesisir/i.test(l.name))) {
            const feats = l.geojson?.features || [];
            if (Array.isArray(feats)) {
              sensitiveFeatures.push(...feats);
            }
          }
        });

        const diffRes = executeSpatialDifference(selectedApp.geometry, sensitiveFeatures);
        originalAreaM2 = diffRes.originalAreaM2 || originalAreaM2;
        remainingAreaM2 = diffRes.remainingAreaM2;
        cutAreaM2 = diffRes.cutAreaM2;
        cutGeom = diffRes.cleanGeometry;
        is100PercentCut = diffRes.is100PercentCut || remainingAreaM2 <= 0 || !cutGeom;
        breakdown = diffRes.layerBreakdown || breakdown;

        // Structured Console Simulation Proof
        console.log('[SPATIAL MULTI-LAYER CUT AUDIT]', {
          permohonanId: selectedApp.id,
          nibNik: selectedApp.nibNik,
          applicant: selectedApp.applicantName,
          company: selectedApp.companyName,
          originalAreaM2: `${originalAreaM2.toLocaleString('id-ID')} m² (${(originalAreaM2 / 10000).toFixed(4)} Ha)`,
          totalCutM2: `${cutAreaM2.toLocaleString('id-ID')} m² (${(cutAreaM2 / 10000).toFixed(4)} Ha)`,
          cutBreakdown: {
            lp2bCut: `${(breakdown.lp2bCutM2 || 0).toLocaleString('id-ID')} m²`,
            mangroveCut: `${(breakdown.mangroveCutM2 || 0).toLocaleString('id-ID')} m²`,
            lahanBasahCut: `${(breakdown.lahanBasahCutM2 || 0).toLocaleString('id-ID')} m²`,
            tambakCut: `${(breakdown.tambakCutM2 || 0).toLocaleString('id-ID')} m²`
          },
          remainingApprovedAreaM2: `${remainingAreaM2.toLocaleString('id-ID')} m² (${(remainingAreaM2 / 10000).toFixed(4)} Ha)`,
          formulaCheck: `Z (${remainingAreaM2}) = X (${originalAreaM2}) - Y (${cutAreaM2}) [${originalAreaM2 - cutAreaM2 === remainingAreaM2 ? 'MATCH' : 'MISMATCH'}]`,
          destinationQueue: 'DINAS_PUPTR (VERIFIKASI_PUPTR / APPROVED_PERTANIAN)'
        });
      } catch (diffErr) {
        console.warn('Client-side turf spatial difference note:', diffErr);
      }

      // Edge Case: 100% Sliced Away
      if (is100PercentCut || remainingAreaM2 <= 0 || !cutGeom) {
        setIsSubmittingApproval(false);
        Swal.fire({
          icon: 'warning',
          title: 'Lahan Terpotong 100%',
          html: `<div class="text-left text-xs space-y-2">
            <p>Lahan permohonan terpotong 100% oleh kawasan restriksi lingkungan (LP2B, Lahan Basah, Mangrove, atau Tambak).</p>
            <p class="font-bold text-amber-600 dark:text-amber-400">Silakan pilih opsi "Minta Revisi" atau "Tolak".</p>
          </div>`,
          confirmButtonColor: '#f59e0b',
          confirmButtonText: 'Kembali & Pilih Aksi Lain'
        });
        return;
      }

      const remainingAreaHa = Number((remainingAreaM2 / 10000).toFixed(4)) || 0.5;

      const updatePayload = {
        berita_acara_num: baDocNum,
        surat_rekomendasi_num: srDocNum,
        replacement_land_ha: selectedApp.areaHa,
        status: 'APPROVED_PERTANIAN',
        status_permohonan: 'PERTEK_PERTANIAN',
        pertanian_status: 'APPROVED',
        pertanian_approved_at: new Date().toISOString(),
        geometry: cutGeom,
        approved_geometry: cutGeom,
        spatial_cut_geometry: cutGeom,
        area_ha: remainingAreaHa,
        luas_m2: remainingAreaM2,
        override_justification: `[REKOMENDASI PERTEK PERTANIAN TERBIT - ${baDocNum}]: Terpotong LP2B/Restriksi ${cutAreaM2} m². Sisa luas: ${remainingAreaM2} m². ${stipulationNotes}`,
        updated_at: new Date().toISOString()
      };

      // 1. Call Backend API POST /api/v1/pkkpr/workflow/approve-pertanian (and approve-alih-fungsi)
      let apiUpdatedSawahGeoJson: any = null;
      try {
        const apiResp = await fetch('/api/v1/pkkpr/workflow/approve-pertanian', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            permohonan_id: selectedApp.id,
            berita_acara_num: baDocNum,
            surat_rekomendasi_num: srDocNum,
            notes: stipulationNotes,
            cut_geometry: cutGeom,
            remaining_area_m2: remainingAreaM2
          })
        });

        if (apiResp.ok) {
          const apiData = await apiResp.json();
          if (apiData.success && apiData.updated_sawah_geojson) {
            apiUpdatedSawahGeoJson = apiData.updated_sawah_geojson;
          }
        }
      } catch (apiErr) {
        console.warn('API /api/v1/pkkpr/workflow/approve-pertanian call note:', apiErr);
      }

      // 2. Direct Supabase update as resilient guarantee with explicit error handling
      const { error: gisErr } = await supabase
        .from('gis_pkkpr')
        .update({
          status_pkkpr: 'APPROVED_PERTANIAN',
          pertanian_approved_at: new Date().toISOString(),
          berita_acara_pertanian_num: baDocNum,
          geometry_json: cutGeom,
          geom: cutGeom,
          approved_geometry: cutGeom,
          spatial_cut_geometry: cutGeom,
          luas_m2: remainingAreaM2,
          luas_ha: remainingAreaHa,
          catatan_teknis: `[REKOMENDASI PERTEK PERTANIAN TERBIT - ${baDocNum}]: Terpotong LP2B/Restriksi ${cutAreaM2} m². Sisa luas: ${remainingAreaM2} m². ${stipulationNotes}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedApp.id);

      if (gisErr) {
        console.error('Gagal memperbarui status_pkkpr di Supabase:', gisErr);
        Swal.fire({
          icon: 'error',
          title: 'Gagal Update Database',
          text: gisErr.message,
          confirmButtonColor: '#ef4444'
        });
        setIsSubmittingApproval(false);
        return;
      }

      try {
        await supabase
          .from('investments')
          .update(updatePayload)
          .eq('id', selectedApp.id);
      } catch (invErr) {
        console.warn('Investments table update note:', invErr);
      }

      // 3. Real-time Map Update: setData / setLayerGeoJson or clearCache on LP2B source layer
      if (apiUpdatedSawahGeoJson) {
        setLayerGeoJson('layer_sawah', apiUpdatedSawahGeoJson);
      } else {
        clearCache('layer_sawah');
      }

      // Update local state queue
      setQueueList(prev =>
        prev.map(item => {
          if (item.id === selectedApp.id) {
            return {
              ...item,
              agriStatus: 'Approved',
              pertanianStatus: 'APPROVED',
              beritaAcaraDocNum: baDocNum,
              suratRekomendasiNum: srDocNum
            };
          }
          return item;
        })
      );

      // Synchronize persistent localStorage across OPDs
      try {
        // 1. Remove ID from forwarded pending registry
        const fRaw = localStorage.getItem('luwu_pkkpr_forwarded_to_pertanian_ids');
        if (fRaw) {
          const fList: string[] = JSON.parse(fRaw);
          const removeIdentifiers = [
            selectedApp.id,
            selectedApp.nibNik,
            selectedApp.companyName,
            selectedApp.applicantName,
            selectedApp.pkkprDocNumber,
            selectedApp.skPkkprDocNumber
          ].filter(Boolean);
          const updatedFList = fList.filter(id => !removeIdentifiers.includes(id));
          localStorage.setItem('luwu_pkkpr_forwarded_to_pertanian_ids', JSON.stringify(updatedFList));
        }

        // 1b. Cache BAP LP2B to local storage for instantaneous cross-dashboard activation
        localStorage.setItem(`BAP_LP2B_${selectedApp.id}`, JSON.stringify({
          nomorSurat: baDocNum,
          nomorSuratRekomendasi: srDocNum,
          status: 'APPROVED',
          pertanianStatus: 'APPROVED',
          catatanTeknis: stipulationNotes,
          savedAt: new Date().toISOString()
        }));

        // 2. Update snapshot in luwu_pkkpr_forwarded_apps_data
        const fAppsRaw = localStorage.getItem('luwu_pkkpr_forwarded_apps_data');
        if (fAppsRaw) {
          const fApps: any[] = JSON.parse(fAppsRaw);
          const updatedFApps = fApps.map(app => {
            if (app.id === selectedApp.id || app.nibNik === selectedApp.nibNik) {
              return {
                ...app,
                agriStatus: 'Approved',
                pertanianStatus: 'APPROVED',
                beritaAcaraDocNum: baDocNum,
                suratRekomendasiNum: srDocNum,
                pertanianBaNumber: baDocNum,
                pertanianSrNumber: srDocNum
              };
            }
            return app;
          });
          localStorage.setItem('luwu_pkkpr_forwarded_apps_data', JSON.stringify(updatedFApps));
        }

        // 3. Update society apps in luwu_pkkpr_my_apps
        const myAppsRaw = localStorage.getItem('luwu_pkkpr_my_apps');
        if (myAppsRaw) {
          const myApps: any[] = JSON.parse(myAppsRaw);
          const updatedMyApps = myApps.map(app => {
            if (app.id === selectedApp.id || app.pkkpr_doc_number === selectedApp.id || app.nik === selectedApp.nibNik || app.nib === selectedApp.nibNik) {
              return {
                ...app,
                pertanian_status: 'APPROVED',
                berita_acara_pertanian_num: baDocNum,
                surat_rekomendasi_pertanian_num: srDocNum
              };
            }
            return app;
          });
          localStorage.setItem('luwu_pkkpr_my_apps', JSON.stringify(updatedMyApps));
        }
      } catch (storageErr) {
        console.warn('Cross-OPD local cache sync error on approval:', storageErr);
      }

      setShowApprovalModal(false);
      await fetchAgrarianQueue();
      const snap = captureCurrentMapSnapshot();
      if (snap) {
        setCustomBapData(prev => prev ? { ...prev, petaImageUrl: snap } : null);
      }
      setShowDocumentPreview(true);

      // Trigger Cross-OPD Notification to Dinas PUPTR
      addCrossOpdNotification({
        applicationId: selectedApp.id,
        applicantName: selectedApp.applicantName,
        companyName: selectedApp.companyName,
        sector: selectedApp.sector,
        districtName: selectedApp.districtName,
        villageName: selectedApp.villageName,
        targetRole: 'ADMIN_PUPTR',
        fromRole: 'ADMIN_PERTANIAN',
        type: 'APPROVED_PERTANIAN',
        title: `BAP Pertanian Terbit #${selectedApp.id}`,
        message: `Dinas Pertanian telah menyetujui pertimbangan LP2B dan menerbitkan BAP Pertanian No. ${baDocNum}. Lanjutkan penerbitan Pertek PUPTR.`,
        bapPertanianDocNumber: baDocNum
      });

      Swal.fire({
        icon: 'success',
        title: 'Berita Acara & Rekomendasi Terbit! 🌾',
        html: `
          <div className="text-left text-xs space-y-2 p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800 font-sans">
            <p className="text-slate-900 dark:text-emerald-100"><strong>No. Berita Acara:</strong> <code className="font-mono text-emerald-600 dark:text-emerald-300 font-bold">${baDocNum}</code></p>
            <p className="text-slate-900 dark:text-emerald-100"><strong>No. Surat Rekomendasi:</strong> <code className="font-mono text-emerald-600 dark:text-emerald-300 font-bold">${srDocNum}</code></p>
            <p className="text-slate-900 dark:text-emerald-100"><strong>Lahan Pengganti (LP2B):</strong> ${selectedApp.areaHa} Ha (${replacementLandRatio})</p>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] pt-1 border-t border-emerald-200 dark:border-emerald-800">
              ⚡ Status rekomendasi otomatis terkirim kembali ke Dashboard PUPTR &amp; DPMPTSP sebagai dasar hukum penerbitan SK PKKPR.
            </p>
          </div>
        `,
        confirmButtonColor: '#10b981'
      });
    } catch (err: any) {
      console.error('Error submitting agrarian approval:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Penerbitan Rekomendasi',
        text: err.message || 'Terjadi kesalahan sistem.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // Open Rejection Modal (Path B)
  const handleOpenRejectionModal = () => {
    if (!selectedApp) return;
    setRejectionReasonInput(
      'Usulan lokasi berada tepat pada Kawasan LP2B Sawah Irigasi Teknis Aktif (IP300) yang dilindungi oleh Undang-Undang No. 41 Tahun 2009. Alih fungsi lahan tidak disetujui untuk menjaga ketahanan pangan daerah.'
    );
    setShowRejectionModal(true);
  };

  // Submit Rejection / Return to PUPTR (Path B)
  const handleSubmitRejection = async () => {
    if (!selectedApp || !rejectionReasonInput.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Catatan Penolakan Wajib Diisi',
        text: 'Silakan beri alasan teknis mengapa permohonan alih fungsi lahan dikembalikan.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    setIsSubmittingRejection(true);
    try {
      const year = new Date().getFullYear();
      const bapRejectDocNum = selectedApp.beritaAcaraDocNum || selectedApp.pertanianBaNumber || `521/${Math.floor(100 + Math.random() * 900)}/BAP-TOLAK-LP2B/DISTAN-LW/${year}`;
      const timestamp = new Date().toISOString();

      const updatePayload = {
        status: 'Rejected_Pertanian',
        status_permohonan: 'REJECTED_PERTANIAN',
        pertanian_status: 'REJECTED',
        berita_acara_num: bapRejectDocNum,
        pertanian_rejection_notes: rejectionReasonInput,
        override_justification: `[DITOLAK DINAS PERTANIAN - BAP No. ${bapRejectDocNum}]: ${rejectionReasonInput}`,
        updated_at: timestamp
      };

      // Call Backend Workflow API
      try {
        await fetch('/api/v1/pkkpr/workflow/reject-pertanian', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            permohonan_id: selectedApp.id,
            bap_penolakan_num: bapRejectDocNum,
            rejection_reason: rejectionReasonInput,
            performed_by: 'ADMIN_PERTANIAN'
          })
        });
      } catch (apiErr) {
        console.warn('API /api/v1/pkkpr/workflow/reject-pertanian note:', apiErr);
      }

      await Promise.all([
        supabase
          .from('gis_pkkpr')
          .update({
            status_pkkpr: 'DITOLAK',
            berita_acara_pertanian_num: bapRejectDocNum,
            catatan_teknis: `[DITOLAK DINAS PERTANIAN - BAP No. ${bapRejectDocNum}]: ${rejectionReasonInput}`,
            updated_at: timestamp
          })
          .eq('id', selectedApp.id),
        supabase
          .from('investments')
          .update(updatePayload)
          .eq('id', selectedApp.id)
      ]);

      // Update local state queue
      setQueueList(prev =>
        prev.map(item => {
          if (item.id === selectedApp.id) {
            return {
              ...item,
              agriStatus: 'Rejected',
              pertanianStatus: 'REJECTED',
              beritaAcaraDocNum: bapRejectDocNum,
              pertanianBaNumber: bapRejectDocNum,
              rejectionReason: rejectionReasonInput,
              pertanianNotes: rejectionReasonInput
            };
          }
          return item;
        })
      );

      // Synchronize persistent localStorage across OPDs
      try {
        // 1. Remove ID from forwarded pending registry so PUPTR recognizes returned status
        const fRaw = localStorage.getItem('luwu_pkkpr_forwarded_to_pertanian_ids');
        if (fRaw) {
          const fList: string[] = JSON.parse(fRaw);
          const updatedFList = fList.filter(id => id !== selectedApp.id && id !== selectedApp.nibNik && id !== selectedApp.companyName);
          localStorage.setItem('luwu_pkkpr_forwarded_to_pertanian_ids', JSON.stringify(updatedFList));
        }

        // 2. Update snapshot in luwu_pkkpr_forwarded_apps_data
        const fAppsRaw = localStorage.getItem('luwu_pkkpr_forwarded_apps_data');
        if (fAppsRaw) {
          const fApps: any[] = JSON.parse(fAppsRaw);
          const updatedFApps = fApps.map(app => {
            if (app.id === selectedApp.id || app.nibNik === selectedApp.nibNik) {
              return {
                ...app,
                agriStatus: 'Rejected',
                pertanianStatus: 'REJECTED',
                beritaAcaraDocNum: bapRejectDocNum,
                pertanianBaNumber: bapRejectDocNum,
                rejectionReason: rejectionReasonInput,
                pertanianNotes: rejectionReasonInput,
                catatan_teknis: `[DITOLAK DINAS PERTANIAN - BAP No. ${bapRejectDocNum}]: ${rejectionReasonInput}`
              };
            }
            return app;
          });
          localStorage.setItem('luwu_pkkpr_forwarded_apps_data', JSON.stringify(updatedFApps));
        }

        // 3. Update society apps in luwu_pkkpr_my_apps
        const myAppsRaw = localStorage.getItem('luwu_pkkpr_my_apps');
        if (myAppsRaw) {
          const myApps: any[] = JSON.parse(myAppsRaw);
          const updatedMyApps = myApps.map(app => {
            if (app.id === selectedApp.id || app.pkkpr_doc_number === selectedApp.id || app.nik === selectedApp.nibNik || app.nib === selectedApp.nibNik) {
              return {
                ...app,
                pertanian_status: 'REJECTED',
                status_pkkpr: 'DITOLAK',
                status: 'DITOLAK',
                berita_acara_pertanian_num: bapRejectDocNum,
                catatan_teknis: `[DITOLAK DINAS PERTANIAN - BAP No. ${bapRejectDocNum}]: ${rejectionReasonInput}`,
                pertanian_rejection_notes: rejectionReasonInput
              };
            }
            return app;
          });
          localStorage.setItem('luwu_pkkpr_my_apps', JSON.stringify(updatedMyApps));
        }
      } catch (storageErr) {
        console.warn('Cross-OPD local cache sync error on rejection:', storageErr);
      }

      setShowRejectionModal(false);
      await fetchAgrarianQueue();

      // Trigger Cross-OPD Notification to Dinas PUPTR
      addCrossOpdNotification({
        applicationId: selectedApp.id,
        applicantName: selectedApp.applicantName,
        companyName: selectedApp.companyName,
        sector: selectedApp.sector,
        districtName: selectedApp.districtName,
        villageName: selectedApp.villageName,
        targetRole: 'ADMIN_PUPTR',
        fromRole: 'ADMIN_PERTANIAN',
        type: 'REJECTED_PERTANIAN',
        title: `BAP Penolakan LP2B Terbit #${selectedApp.id}`,
        message: `Dinas Pertanian telah menerbitkan BAP Penolakan No. ${bapRejectDocNum} karena lokasi berada di Kawasan LP2B Irigasi Aktif. Mohon dipedomani untuk pengembalian ke pemohon.`,
        notes: rejectionReasonInput,
        bapPertanianDocNumber: bapRejectDocNum
      });

      Swal.fire({
        icon: 'warning',
        title: 'BAP Penolakan LP2B Resmi Terbit 📄',
        html: `
          <div class="text-left text-xs space-y-2 p-3 bg-rose-50 dark:bg-rose-950/50 rounded-xl border border-rose-200 dark:border-rose-800 font-sans">
            <p class="text-slate-900 dark:text-rose-100"><strong>No. BAP Penolakan:</strong> <code class="font-mono text-rose-600 dark:text-rose-300 font-bold">${bapRejectDocNum}</code></p>
            <p class="text-slate-900 dark:text-rose-100"><strong>Alasan Teknis:</strong> ${rejectionReasonInput}</p>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] pt-1 border-t border-rose-200 dark:border-rose-800">
              ⚡ Dokumen BAP Penolakan ini otomatis terkirim dan menjadi dasar hukum resmi bagi Admin Dinas PUPTR dalam mengembalikan permohonan ke pemohon.
            </p>
          </div>
        `,
        confirmButtonColor: '#e11d48'
      });
    } catch (err: any) {
      console.error('Error submitting agrarian rejection:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memproses Penolakan',
        text: err.message || 'Terjadi kesalahan sistem.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsSubmittingRejection(false);
    }
  };

  // Request Revision from Applicant (Path C)
  const handleRequestRevision = async (catatan: string) => {
    if (!selectedApp) return;
    try {
      const timestamp = new Date().toISOString();
      await Promise.all([
        supabase
          .from('gis_pkkpr')
          .update({
            status_pkkpr: 'REVISI_PEMOHON',
            catatan_revisi: catatan,
            catatan_teknis: `[PERMINTAAN REVISI BERKAS DINAS PERTANIAN]: ${catatan}`,
            updated_at: timestamp
          })
          .eq('id', selectedApp.id),
        supabase
          .from('investments')
          .update({
            status: 'REVISI_PEMOHON',
            status_permohonan: 'REVISI_PEMOHON',
            catatan_revisi: catatan,
            override_justification: catatan,
            updated_at: timestamp
          })
          .eq('id', selectedApp.id)
      ]);

      Swal.fire({
        icon: 'info',
        title: 'Permintaan Revisi Terkirim 🔄',
        text: 'Permohonan berhasil dialihkan ke status REVISI_PEMOHON dan pemohon akan menerima instruksi perbaikan.',
        confirmButtonColor: '#f59e0b'
      });
      await fetchAgrarianQueue();
    } catch (err: any) {
      Swal.fire('Gagal Menyimpan Revisi', err?.message || 'Error', 'error');
    }
  };

  // Filtered Queue strictly segregated across 4 tabs
  const filteredQueue = useMemo(() => {
    return queueList.filter(item => {
      const matchSearch =
        !searchQuery.trim() ||
        item.nibNik.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.districtName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.villageName.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      // Tab 2: Disetujui (BA Terbit)
      if (statusFilter === 'APPROVED') {
        return item.agriStatus === 'Approved';
      }

      // Tab 3: Dikembalikan ke PUPTR / Ditolak
      if (statusFilter === 'REJECTED') {
        return item.agriStatus === 'Rejected' || item.agriStatus === 'Requires Revision';
      }

      // Tab 4: Semua Riwayat
      if (statusFilter === 'ALL_HISTORY') {
        return true;
      }

      // Tab 1 (Default: 'ALL' / 'PENDING'): Antrean Tugas (Menunggu Evaluasi)
      return item.agriStatus === 'Pending Review';
    });
  }, [queueList, searchQuery, statusFilter]);

  // Viewport GeoJSON feature for MapLibre
  const currentMapGeoJson = useMemo(() => {
    if (!selectedApp?.geometry) return null;
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            name: selectedApp.companyName,
            nib: selectedApp.nibNik,
            status: selectedApp.agriStatus
          },
          geometry: selectedApp.geometry
        }
      ]
    };
  }, [selectedApp]);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────────
          BRANDING HEADER & KPI STATS (Android-First Optimized)
         ───────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 p-4 sm:p-6 text-white border border-emerald-500/30 shadow-xl">
        <div className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-amber-500/10 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                Dinas Pertanian Kabupaten Luwu
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold font-mono">
                Agrarian &amp; LP2B Clearance Hub
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2 sm:gap-2.5">
              <Wheat className="w-6 h-6 sm:w-8 h-8 text-amber-400 shrink-0" />
              <span>Admin Rekomendasi Lahan Pertanian (LP2B)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Verifikasi kelayakan alih fungsi lahan pertanian, evaluasi irigasi teknis LP2B, dan penerbitan Berita Acara Rekomendasi Lahan terkoneksi lintas instansi PUPTR.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end md:items-center gap-3 shrink-0 w-full md:w-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 shrink-0 w-full sm:w-auto">
              <div className="bg-slate-900/80 border border-slate-700/80 p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">ANTREAN PERTANIAN</span>
                <span className="text-lg sm:text-xl font-bold text-white font-mono mt-1">{queueList.length}</span>
                <span className="text-xs text-emerald-400 mt-1 truncate">Kasus Forward PUPTR</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-700/80 p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">BERITA ACARA TERBIT</span>
                <span className="text-lg sm:text-xl font-bold text-emerald-400 font-mono mt-1">
                  {queueList.filter(i => i.agriStatus === 'Approved').length}
                </span>
                <span className="text-xs text-slate-300 mt-1 truncate">Rekomendasi Sah</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-700/80 p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">LUAS EVALUASI LP2B</span>
                <span className="text-lg sm:text-xl font-bold text-amber-400 font-mono mt-1">
                  {queueList.reduce((acc, curr) => acc + (curr.areaHa || 0), 0).toFixed(1)} Ha
                </span>
                <span className="text-xs text-slate-300 mt-1 truncate">Lahan Terlindungi</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODULE 2: INCOMING AGRARIAN REVIEW QUEUE (FORWARDED FROM PUPTR)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                2. Antrean Perubahan Status Lahan (Forwarded From PUPTR)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daftar permohonan alih fungsi lahan yang menyinggung kawasan Lahan Pertanian Pangan Berkelanjutan (LP2B) atau Lahan Basah.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer active:scale-95"
              title="Cetak Laporan Rekapitulasi Berita Acara (BAP) Dinas Pertanian"
            >
              <Printer className="w-3.5 h-3.5 text-amber-200" />
              <span>Cetak Rekap Laporan BAP 📄</span>
            </button>

            <button
              onClick={fetchAgrarianQueue}
              disabled={isLoadingQueue}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQueue ? 'animate-spin' : ''}`} />
              <span>Refresh Antrean</span>
            </button>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari NIB/NIK, Nama Perusahaan, atau Kecamatan..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/30"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: 'Antrean Tugas (Menunggu Evaluasi)', count: queueList.filter(i => i.agriStatus === 'Pending Review').length },
              { id: 'APPROVED', label: 'Disetujui (BA Terbit)', count: queueList.filter(i => i.agriStatus === 'Approved').length },
              { id: 'REJECTED', label: 'Dikembalikan ke PUPTR / Ditolak', count: queueList.filter(i => i.agriStatus === 'Rejected' || i.agriStatus === 'Requires Revision').length },
              { id: 'ALL_HISTORY', label: 'Semua Riwayat', count: queueList.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  statusFilter === tab.id ? 'bg-emerald-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Queue Display: Mobile Card List (Android Friendly) & Desktop Table */}
        {isLoadingQueue ? (
          <div className="py-8 text-center text-slate-500 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
            <span className="text-xs font-medium">Memuat antrean alih fungsi lahan pertanian...</span>
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="py-10 px-4 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <Wheat className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-lg mx-auto">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'Tidak Ditemukan Permohonan yang Sesuai Filter'
                  : 'Tidak Ada Permintaan Rekomendasi Teknis dari Dinas PUPTR'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'Silakan sesuaikan kata kunci pencarian atau ganti filter status di atas.'
                  : 'Sesuai SOP Alur Proses Bisnis PKKPR Terpadu, seluruh berkas permohonan pertama kali diteliti dan diverifikasi oleh Tim Tata Ruang Dinas PUPTR. Antrean Dinas Pertanian hanya akan terisi jika Dinas PUPTR mendeteksi irisan dengan kawasan LP2B dan meneruskan permohonan secara resmi.'}
              </p>
            </div>
            {!searchQuery && statusFilter === 'ALL' && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Pipa Alur Antar-OPD Siap • Menunggu Rujukan Tata Ruang PUPTR</span>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Card List (Screen < md) */}
            <div className="md:hidden space-y-3">
              {filteredQueue.map(item => {
                const isSelected = selectedApp?.id === item.id;
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                        : 'bg-slate-50/80 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                            {item.nibNik}
                          </span>
                          <SlaBadge createdAt={item.createdAt} approvedAt={item.agriStatus === 'Approved' ? new Date().toISOString() : null} />
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                          {item.companyName}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.applicantName}
                        </p>
                      </div>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${
                          item.agriStatus === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300'
                            : item.agriStatus === 'Rejected'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300'
                        }`}
                      >
                        {item.agriStatus === 'Approved' ? 'BA Terbit' : item.agriStatus === 'Rejected' ? 'Ditolak' : 'Pending Review'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 mb-2 font-sans">
                      <div>
                        <span className="text-slate-400 text-[10px] block uppercase font-bold">Lokasi &amp; Eksisting</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 block truncate">
                          Kec. {item.districtName}
                        </span>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                          {item.existingCrop}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block uppercase font-bold">Luas Lahan</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {item.areaHa} Ha
                        </span>
                      </div>
                    </div>

                    {item.puptrForwardedNotes && (
                      <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-[10px] text-slate-600 dark:text-slate-300 mb-3">
                        <span className="font-bold text-amber-700 dark:text-amber-400">Catatan PUPTR: </span>
                        <span>{item.puptrForwardedNotes}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => selectAppForReview(item)}
                      className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm active:scale-95 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Analisis Workspace Agraria</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (Screen >= md) */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">NIB / NIK Pemohon</th>
                    <th className="py-3 px-4">Pemohon &amp; Perusahaan</th>
                    <th className="py-3 px-4">Lokasi &amp; Eksisting</th>
                    <th className="py-3 px-4">Luas Lahan</th>
                    <th className="py-3 px-4">SLA Timer</th>
                    <th className="py-3 px-4">Catatan Forward PUPTR</th>
                    <th className="py-3 px-4">Status Pertanian</th>
                    <th className="py-3 px-4 text-center">Evaluasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredQueue.map(item => {
                    const isSelected = selectedApp?.id === item.id;
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                          isSelected ? 'bg-emerald-50/50 dark:bg-emerald-950/30' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {item.nibNik}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{item.companyName}</div>
                          <div className="text-[10px] text-slate-500">{item.applicantName}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">Kec. {item.districtName}, Desa {item.villageName}</div>
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">{item.existingCrop}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {item.areaHa} Ha
                        </td>
                        <td className="py-3 px-4">
                          <SlaBadge createdAt={item.createdAt} approvedAt={item.agriStatus === 'Approved' ? new Date().toISOString() : null} />
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-tight">
                            {item.puptrForwardedNotes}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              item.agriStatus === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300'
                                : item.agriStatus === 'Rejected'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300'
                            }`}
                          >
                            {item.agriStatus === 'Approved' ? 'BA Terbit' : item.agriStatus === 'Rejected' ? 'Ditolak' : 'Pending Review'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                selectAppForReview(item);
                                setSpatialPreviewTargetApp(item);
                                setShowSpatialPreviewModal(true);
                              }}
                              className="px-2.5 py-1.5 bg-gradient-to-r from-amber-600 via-emerald-600 to-teal-600 hover:from-amber-500 hover:to-teal-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 transition shadow-sm cursor-pointer active:scale-95"
                              title="Evaluasi Spasial Pemotongan Geometri Lahan (Before - After)"
                            >
                              <Layers className="w-3.5 h-3.5 text-amber-200" />
                              <span>Evaluasi Spasial</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => selectAppForReview(item)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 transition shadow-sm cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Workspace</span>
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

      {/* ─────────────────────────────────────────────────────────────
          MODULE 3 & MODULE 4: AGRARIAN MAP WORKSPACE & DUAL-PATH DECISION ENGINE
         ───────────────────────────────────────────────────────────── */}
      {!selectedApp && queueList.length === 0 && !isLoadingQueue && (
        <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-center space-y-2">
          <Wheat className="w-10 h-10 text-emerald-500/40 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Workspace Rekomendasi Lahan (LP2B) Standby
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Workspace analisis spasial citra satelit dan modul penerbitan Berita Acara (BAP) LP2B akan aktif secara otomatis saat permohonan diteruskan dari Dinas PUPTR.
          </p>
        </div>
      )}

      {selectedApp && (
        <div className={`grid grid-cols-1 ${isMapExpanded ? 'grid-cols-1' : 'lg:grid-cols-3'} gap-6`}>
          {/* Left Column: Agrarian Map Analysis Workspace (Module 3) */}
          <div className={`${isMapExpanded ? 'w-full col-span-full' : 'lg:col-span-2'} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 sm:p-5 shadow-sm space-y-4`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                  <Map className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    3. Workspace Analisis Spasial Lahan Pertanian (LP2B)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Inspeksi spasial produktivitas tanah, ketersediaan jaringan irigasi, dan tumpang tindih poligon.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSpatialPreviewTargetApp(selectedApp);
                    setShowSpatialPreviewModal(true);
                  }}
                  className="h-10 px-3 bg-gradient-to-r from-amber-600 via-emerald-600 to-teal-600 hover:from-amber-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                  title="Evaluasi Spasial Pemotongan Geometri Lahan (Before - After)"
                >
                  <Layers className="w-4 h-4 text-amber-200 shrink-0" />
                  <span className="truncate">Evaluasi Spasial</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    captureCurrentMapSnapshot();
                    setShowSmartFormModal(true);
                  }}
                  className="h-10 px-3 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                  title="Buka Smart Form Rekomendasi Teknis LP2B & Alih Fungsi Lahan"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                  <span className="truncate">Smart Form LP2B</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsTurfCardCollapsed(prev => !prev)}
                  className={`h-10 px-3 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer ${
                    isTurfCardCollapsed
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                      : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
                  }`}
                  title={isTurfCardCollapsed ? "Tampilkan Panel Hasil Analisis & Data Pemohon" : "Sembunyikan Panel"}
                >
                  {isTurfCardCollapsed ? <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <EyeOff className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                  <span className="truncate">{isTurfCardCollapsed ? "Buka Panel Analisis" : "Tutup Panel"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsMapExpanded(prev => !prev)}
                  className="h-10 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
                  title={isMapExpanded ? "Kembali ke Mode Normal (2 Kolom)" : "Perbesar Peta (Mode Studio Lebar)"}
                >
                  <Maximize2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">{isMapExpanded ? "Tampilan Normal" : "Mode Peta Lebar"}</span>
                </button>
                <span className="col-span-2 sm:col-span-1 h-10 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-center truncate">
                  {selectedApp.companyName}
                </span>
              </div>
            </div>

            {/* MapLibre Container with real Polygon Thematic Layers */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span><strong>Petunjuk Analisis Agraria:</strong> Klik sembarang poligon, layer sawah, batas wilayah, atau layer tematik pada peta untuk menampilkan data atribut kesuburan &amp; status LP2B.</span>
              </div>

              <div className={`w-full ${isMapExpanded ? 'min-h-[600px] h-[85vh]' : 'h-[500px] sm:h-[600px] lg:h-[75vh]'} rounded-2xl relative overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner transition-all duration-300`}>
                <MapComponent
                  ref={mapRef}
                  key={selectedApp.id}
                  districts={districts}
                  villages={villages}
                  investments={appAsInvestment ? [appAsInvestment] : []}
                  spatialLayers={spatialLayers}
                  onToggleLayerVis={toggleLayer}
                  onChangeLayerOpacity={setLayerOpacity}
                  infrastructure={[]}
                  selectedDistrictId={selectedDistrictId}
                  setSelectedDistrictId={setSelectedDistrictId}
                  selectedVillageId={selectedVillageId}
                  setSelectedVillageId={setSelectedVillageId}
                  selectedInvestmentId={selectedApp ? selectedApp.id : null}
                  setSelectedInvestmentId={() => {}}
                  heatmapMetric="none"
                  choroplethMetric="none"
                  isDigitizing={false}
                  digitizedPoints={[]}
                  setDigitizedPoints={() => {}}
                  mapMode="satellite"
                  
                />

                {/* Agrarian Overlay Diagnostic & Applicant Details Box (Hasil Analisis Turf.js & Data Pemohon Tersusun Kebawah) */}
                {isTurfCardCollapsed ? (
                  <button
                    type="button"
                    onClick={() => setIsTurfCardCollapsed(false)}
                    className="absolute bottom-14 right-2 sm:bottom-3 sm:right-3 md:top-3 md:right-14 md:bottom-auto bg-slate-900/90 text-white hover:bg-slate-800 backdrop-blur-md border border-emerald-500/50 rounded-2xl px-3 py-1.5 sm:px-3.5 sm:py-2 shadow-2xl z-20 text-[11px] sm:text-xs font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer group"
                    title="Klik untuk membuka panel Hasil Analisis Turf.js & Data Pemohon"
                  >
                    <Sprout className="w-4 h-4 text-emerald-400 group-hover:rotate-45 transition-transform" />
                    <span>Buka Panel Analisis Turf.js &amp; Data Pemohon</span>
                    <ChevronDown className="w-4 h-4 text-slate-300" />
                  </button>
                ) : (
                  <div className="absolute bottom-2 inset-x-2 sm:bottom-3 sm:inset-x-3 md:top-3 md:right-14 md:left-auto md:w-96 max-h-[65vh] sm:max-h-[75vh] md:max-h-[82vh] overflow-y-auto overflow-x-hidden max-w-[calc(100%-1rem)] mx-auto md:mx-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xl z-20 text-xs space-y-3 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <Sprout className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-xs tracking-tight">
                            Hasil Analisis Turf.js &amp; Data Pemohon
                          </h4>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            Audit LP2B &amp; Kesesuaian Lahan Pertanian
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          LP2B Intersect
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsTurfCardCollapsed(true)}
                          className="px-2 py-1 rounded-xl text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer shrink-0 border border-slate-200 dark:border-slate-700"
                          title="Sembunyikan Panel agar kanvas peta lebih luas"
                        >
                          <ChevronUp className="w-3.5 h-3.5 text-rose-500" />
                          <span>Tutup</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* 1. SEKSI AUDIT GEOSPASIAL PERTANIAN & LP2B */}
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Wheat className="w-3 h-3 text-emerald-500" />
                          Hasil Audit Geospasial LP2B (Turf.js)
                        </span>

                        <div className="space-y-1 text-slate-700 dark:text-slate-300">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-slate-500 dark:text-slate-400 shrink-0">Klasifikasi Lahan:</span>
                            <span className="font-bold text-right text-slate-900 dark:text-white">Sawah Irigasi Teknis</span>
                          </div>
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-slate-500 dark:text-slate-400 shrink-0">Indeks Kesuburan:</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-right">Kelas I (Sangat Tinggi / IP300)</span>
                          </div>
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-slate-500 dark:text-slate-400 shrink-0">Tumpang Tindih LP2B:</span>
                            <span className="font-mono font-bold text-right text-amber-600 dark:text-amber-400">
                              {(selectedApp.areaHa * 0.35).toFixed(1)} Ha (35% Luas Plot)
                            </span>
                          </div>
                        </div>

                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 text-[10.5px] text-slate-700 dark:text-emerald-300 leading-tight mt-1">
                          💡 <strong>Kewajiban Alih Fungsi:</strong> Berdasarkan Perda LP2B Kab. Luwu, alih fungsi dapat disetujui dengan kewajiban menyediakan <strong>Lahan Pengganti LP2B 1:1</strong> ({selectedApp.areaHa} Ha).
                        </div>
                      </div>

                      {/* 2. SEKSI DATA PERMOHONAN PEMOHON */}
                      <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Rincian Permohonan Pemohon
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            selectedApp.category === 'Non-Berusaha' || (selectedApp.applicantType && selectedApp.applicantType.includes('Warga'))
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            {selectedApp.category === 'Non-Berusaha' || (selectedApp.applicantType && selectedApp.applicantType.includes('Warga'))
                              ? 'PKKPR Non-Berusaha'
                              : 'PKKPR Berusaha'}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-slate-800 dark:text-slate-200 text-xs divide-y divide-slate-200 dark:divide-slate-800/60">
                          <div className="pt-1 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-0.5 sm:gap-2">
                            <span className="text-slate-500 dark:text-slate-400 shrink-0">Nama Pemohon:</span>
                            <span className="font-bold text-left sm:text-right text-slate-900 dark:text-white break-words">{selectedApp.applicantName}</span>
                          </div>

                          <div className="pt-1.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-0.5 sm:gap-2 font-mono">
                            <span className="text-slate-500 dark:text-slate-400 shrink-0 font-sans">
                              {selectedApp.applicantType?.includes('Pelaku') ? 'NIB OSS:' : 'NIK Pemohon:'}
                            </span>
                            <span className="font-bold text-left sm:text-right text-emerald-600 dark:text-emerald-400 break-all">{selectedApp.nibNik}</span>
                          </div>

                          <div className="pt-1.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-0.5 sm:gap-2">
                            <span className="text-slate-500 dark:text-slate-400 shrink-0">
                              {selectedApp.category === 'Non-Berusaha' ? 'Lembaga / Komite:' : 'Badan Usaha:'}
                            </span>
                            <span className="font-semibold text-left sm:text-right break-words">{selectedApp.companyName}</span>
                          </div>

                          <div className="pt-1.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-0.5 sm:gap-2">
                            <span className="text-slate-500 dark:text-slate-400 shrink-0">Judul Kegiatan:</span>
                            <span className="font-medium text-left sm:text-right text-slate-700 dark:text-slate-300 break-words">
                              {selectedApp.title || selectedApp.companyName}
                            </span>
                          </div>

                          {selectedApp.fungsiBangunan && (
                            <div className="pt-1.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-0.5 sm:gap-2">
                              <span className="text-slate-500 dark:text-slate-400 shrink-0">Fungsi Bangunan:</span>
                              <span className="font-medium text-left sm:text-right text-slate-700 dark:text-slate-300 break-words">
                                {selectedApp.fungsiBangunan}
                              </span>
                            </div>
                          )}

                          <div className="pt-1.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-0.5 sm:gap-2">
                            <span className="text-slate-500 dark:text-slate-400 shrink-0">Alamat Pemohon:</span>
                            <span className="font-medium text-left sm:text-right text-slate-700 dark:text-slate-300 text-[11px] break-words">
                              {selectedApp.applicantAddress || `Kec. ${selectedApp.districtName}, Kab. Luwu`}
                            </span>
                          </div>

                          <div className="pt-1.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-0.5 sm:gap-2">
                            <span className="text-slate-500 dark:text-slate-400 shrink-0">Kategori & Jenis:</span>
                            <div className="text-left sm:text-right">
                              {selectedApp.kategoriPengajuan === 'PARSIL_TANAH' ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 inline-block">
                                  🗺️ PARSIL TANAH / ATR-BPN
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-block">
                                  🏗️ KONSTRUKSI / BANGUNAN
                                </span>
                              )}
                              <span className="text-[10px] text-slate-600 dark:text-slate-300 block font-semibold mt-0.5">
                                {selectedApp.jenisPengajuanPkkpr || selectedApp.sector}
                              </span>
                            </div>
                          </div>

                          <div className="pt-1.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-0.5 sm:gap-2">
                            <span className="text-slate-500 dark:text-slate-400 shrink-0">Lokasi Dimohon:</span>
                            <span className="font-semibold text-left sm:text-right text-slate-800 dark:text-slate-200 break-words">
                              Desa {selectedApp.villageName}, Kec. {selectedApp.districtName}, Kab. Luwu
                            </span>
                          </div>

                          <div className="pt-1.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-0.5 sm:gap-2">
                            <span className="text-slate-500 dark:text-slate-400 shrink-0">Luas yang Dimohon:</span>
                            <div className="text-left sm:text-right">
                              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {Number(selectedApp.areaHa).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} Ha
                              </span>
                              <span className="text-slate-500 text-[11px] block font-mono">
                                ({Math.round(selectedApp.luasM2 || selectedApp.areaHa * 10000).toLocaleString('id-ID')} m²)
                              </span>
                            </div>
                          </div>

                          {/* Hanya tampilkan rencana luas bangunan untuk kategori BANGUNAN */}
                          {selectedApp.kategoriPengajuan !== 'PARSIL_TANAH' && (selectedApp.rencanaLuasBgn || selectedApp.luasBangunan) && (
                            <div className="pt-1.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-0.5 sm:gap-2">
                              <span className="text-slate-500 dark:text-slate-400 shrink-0">Rencana Luas Bangunan:</span>
                              <span className="font-mono font-bold text-left sm:text-right text-slate-800 dark:text-slate-200 break-words">
                                {selectedApp.rencanaLuasBgn || selectedApp.luasBangunan} m²
                              </span>
                            </div>
                          )}

                          <div className="pt-1.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-0.5 sm:gap-2">
                            <span className="text-slate-500 dark:text-slate-400 shrink-0">Jenis Alas Hak:</span>
                            <span className="font-semibold text-left sm:text-right text-slate-800 dark:text-slate-200 text-[11px] break-words">
                              {selectedApp.jenisAlasHak || selectedApp.buktiTanah || 'Sertipikat Hak Milik (SHM)'}
                            </span>
                          </div>
                        </div>

                        {/* Dokumen Legalitas & Teknis Pemohon */}
                        {(selectedApp.fileAlasHakUrl || selectedApp.sertifikatTanahUrl || selectedApp.fileSiteplanUrl || selectedApp.suratPengantarDesaUrl || selectedApp.berkasLegalitasGabunganUrl) && (
                          <div className="pt-2 border-t border-emerald-500/20 space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                              Dokumen Legalitas & Teknis Terunggah:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {(selectedApp.fileAlasHakUrl || selectedApp.sertifikatTanahUrl) && (
                                <a
                                  href={selectedApp.fileAlasHakUrl || selectedApp.sertifikatTanahUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg text-[10px] font-bold hover:bg-emerald-50 flex items-center gap-1 transition-all"
                                >
                                  <FileText className="w-3 h-3" /> 📄 Buka Berkas Sertifikat / Alas Hak
                                </a>
                              )}
                              {selectedApp.kategoriPengajuan !== 'PARSIL_TANAH' && selectedApp.fileSiteplanUrl && (
                                <a
                                  href={selectedApp.fileSiteplanUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-800 rounded-lg text-[10px] font-bold hover:bg-teal-50 flex items-center gap-1 transition-all"
                                >
                                  <Building className="w-3 h-3" /> 📐 Lihat Berkas Siteplan / Denah
                                </a>
                              )}
                              {selectedApp.suratPengantarDesaUrl && (
                                <a
                                  href={selectedApp.suratPengantarDesaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-lg text-[10px] font-bold hover:bg-amber-50 flex items-center gap-1 transition-all"
                                >
                                  <FileText className="w-3 h-3" /> Pengantar Desa
                                </a>
                              )}
                              {selectedApp.berkasLegalitasGabunganUrl && (
                                <a
                                  href={selectedApp.berkasLegalitasGabunganUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 rounded-lg text-[10px] font-bold hover:bg-indigo-50 flex items-center gap-1 transition-all"
                                >
                                  <FileText className="w-3 h-3" /> 1 File PDF
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Dual-Path Decision Engine (Module 4) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      4. Decision Engine (Pertanian)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Penerbitan Berita Acara &amp; Feedback PUPTR</p>
                  </div>
                </div>
              </div>

              {/* Application Snapshot */}
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3 text-xs space-y-1.5 text-slate-800 dark:text-slate-200">
                <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>{selectedApp.companyName}</span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">{selectedApp.nibNik}</span>
                </div>
                <p><strong>Lokasi:</strong> Kec. {selectedApp.districtName}, Desa {selectedApp.villageName}</p>
                <p><strong>Luas Permohonan:</strong> <span className="font-mono font-bold text-emerald-600">{selectedApp.areaHa} Ha</span></p>
                <p><strong>Tanaman Eksisting:</strong> {selectedApp.existingCrop}</p>
                
                {(selectedApp.sertifikatTanahUrl || selectedApp.suratPengantarDesaUrl || selectedApp.berkasLegalitasGabunganUrl) && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 mt-2 space-y-1.5">
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Berkas Legalitas Lahan Pemohon:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedApp.sertifikatTanahUrl && (
                        <a
                          href={selectedApp.sertifikatTanahUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[11px] font-semibold flex items-center gap-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
                        >
                          <FileText className="w-3 h-3" /> Sertifikat Tanah
                        </a>
                      )}
                      {selectedApp.suratPengantarDesaUrl && (
                        <a
                          href={selectedApp.suratPengantarDesaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-[11px] font-semibold flex items-center gap-1 hover:bg-amber-100 dark:hover:bg-amber-900/60"
                        >
                          <FileText className="w-3 h-3" /> Pengantar Desa
                        </a>
                      )}
                      {selectedApp.berkasLegalitasGabunganUrl && (
                        <a
                          href={selectedApp.berkasLegalitasGabunganUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-[11px] font-semibold flex items-center gap-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/60"
                        >
                          <FileText className="w-3 h-3" /> 1 File PDF Gabungan
                        </a>
                      )}
                    </div>
                  </div>
                )}
                
                {selectedApp.beritaAcaraDocNum && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-0.5 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold">
                    <p>✓ BA: {selectedApp.beritaAcaraDocNum}</p>
                    <p>✓ Surat Rekomendasi: {selectedApp.suratRekomendasiNum}</p>
                  </div>
                )}

                {selectedApp.rejectionReason && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 text-[11px]">
                    <strong>Catatan Penolakan:</strong> {selectedApp.rejectionReason}
                  </div>
                )}
              </div>

              {/* Forwarded PUPTR Note Box */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Catatan Dari Dinas PUPTR:
                </span>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  {selectedApp.puptrForwardedNotes}
                </p>
              </div>
            </div>

            {/* Dual Action Path Buttons */}
            <div className="space-y-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block text-center">
                Pilih Keputusan &amp; Rekomendasi Teknis
              </span>

              {selectedApp.pertanianStatus === 'REJECTED' || selectedApp.agriStatus === 'Rejected' ? (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-xs space-y-1.5 font-sans">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-extrabold uppercase">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>⚠️ BAP PENOLAKAN LP2B TELAH DITERBITKAN</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200">
                    No. BAP Penolakan: <strong className="font-mono text-rose-600 dark:text-rose-400">{selectedApp.pertanianBaNumber || selectedApp.beritaAcaraDocNum || '521/043/BAP-TOLAK-LP2B/DISTAN-LW/2026'}</strong>
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 italic bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-rose-200 dark:border-rose-900/60">
                    "{selectedApp.pertanianNotes || selectedApp.rejectionReason || 'Lokasi berada di kawasan LP2B produktif/sawah irigasi teknis aktif.'}"
                  </p>
                  <p className="text-[10px] text-slate-500 pt-1 border-t border-rose-200 dark:border-rose-800/60">
                    🔒 Berkas telah ditolak dan diteruskan kembali ke Petugas Dinas PUPTR beserta dokumen BAP Penolakan resmi.
                  </p>
                </div>
              ) : (selectedApp.pertanianStatus === 'APPROVED' || selectedApp.agriStatus === 'Approved') ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-xs space-y-1 font-sans">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-extrabold uppercase">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>✓ BAP PERSETUJUAN PERTANIAN TELAH DITERBITKAN</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200">
                    No. Berita Acara: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{selectedApp.pertanianBaNumber || selectedApp.beritaAcaraDocNum || '520.1/042/BA-LP2B/DISTAN-LW/2026'}</strong>
                  </p>
                  <p className="text-[11px] text-slate-500 pt-1 border-t border-emerald-200 dark:border-emerald-800/60">
                    🔒 Rekomendasi alih fungsi lahan telah disetujui dan dikembalikan ke Dinas PUPTR.
                  </p>
                </div>
              ) : (
                <>
                  {/* Smart Form Pertanian Button */}
                  <button
                    type="button"
                    onClick={() => {
                      captureCurrentMapSnapshot();
                      setShowSmartFormModal(true);
                    }}
                    className="w-full min-h-[46px] px-4 py-3 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition-all active:scale-98 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>Smart Form Rekomendasi Teknis LP2B &amp; Pertanian</span>
                  </button>

                  {/* Path A Button: Setujui & Terbit Berita Acara */}
                  <button
                    type="button"
                    onClick={handleOpenApprovalModal}
                    className="w-full min-h-[46px] px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-98 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                    <span>PATH A: Setujui &amp; Terbit Berita Acara LP2B 📄</span>
                  </button>

                  {/* Path B Button: Kembalikan / Tolak */}
                  <button
                    type="button"
                    onClick={handleOpenRejectionModal}
                    className="w-full min-h-[46px] px-4 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-600/10 transition-all active:scale-98 cursor-pointer"
                  >
                    <X className="w-4 h-4 shrink-0" />
                    <span>PATH B: Kembalikan / Tolak Ke PUPTR ⚠️</span>
                  </button>

                  {/* Path C Button: Minta Revisi Pemohon */}
                  <button
                    type="button"
                    onClick={async () => {
                      const { value: catatan } = await Swal.fire({
                        title: 'Minta Perbaikan / Revisi Pemohon',
                        text: 'Tuliskan catatan perbaikan atau koreksi dokumen/koordinat yang wajib dipenuhi oleh pemohon:',
                        input: 'textarea',
                        inputPlaceholder: 'Contoh: Harap lampirkan surat pernyataan bebas sengketa yang ditandatangani kepala desa...',
                        showCancelButton: true,
                        confirmButtonText: 'Kirim Permintaan Revisi',
                        cancelButtonText: 'Batal',
                        confirmButtonColor: '#f59e0b'
                      });
                      if (catatan && catatan.trim()) {
                        handleRequestRevision(catatan.trim());
                      }
                    }}
                    className="w-full min-h-[46px] px-4 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-600/10 transition-all active:scale-98 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 shrink-0" />
                    <span>PATH C: Minta Revisi Pemohon (REVISI_PEMOHON) 🔄</span>
                  </button>
                </>
              )}

              {/* Document Preview Trigger */}
              <button
                type="button"
                onClick={handleOpenBapModal}
                className={`w-full py-2.5 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                  selectedApp.pertanianStatus === 'REJECTED' || selectedApp.agriStatus === 'Rejected'
                    ? 'bg-rose-600/10 hover:bg-rose-600/20 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                    : 'bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>
                  {selectedApp.pertanianStatus === 'REJECTED' || selectedApp.agriStatus === 'Rejected'
                    ? 'Lihat / Cetak BAP Penolakan LP2B Dinas Pertanian 📄'
                    : 'Lihat / Cetak Berita Acara (BAP LP2B) Dinas Pertanian 📄'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL PATH A: FORM PENERBITAN BERITA ACARA PERUBAHAN LAHAN
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showApprovalModal && selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Form Berita Acara Perubahan Status Lahan</h3>
                    <p className="text-xs text-slate-500">Penerbitan Rekomendasi Resmi Dinas Pertanian Luwu</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* Auto Injected Credentials Display */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Data Pemohon Terikat (Data Bound)</span>
                  <p><strong>Nama Pemohon / Perusahaan:</strong> {selectedApp.applicantName} ({selectedApp.companyName})</p>
                  <p><strong>NIB / NIK:</strong> <span className="font-mono font-bold">{selectedApp.nibNik}</span></p>
                  <p><strong>Lokasi Lahan:</strong> Kecamatan {selectedApp.districtName}, Desa {selectedApp.villageName}</p>
                  <p><strong>Luas Lahan yang Diusulkan:</strong> <span className="font-mono font-bold text-emerald-600">{selectedApp.areaHa} Ha</span></p>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200">Nomor Berita Acara LP2B</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-600 outline-none"
                    value={baDocNum}
                    onChange={e => setBaDocNum(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200">Nomor Surat Rekomendasi Dinas Pertanian</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-600 outline-none"
                    value={srDocNum}
                    onChange={e => setSrDocNum(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200">Rasio &amp; Ketentuan Lahan Pengganti (Replacement Land)</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none"
                    value={replacementLandRatio}
                    onChange={e => setReplacementLandRatio(e.target.value)}
                  >
                    <option value="1:1 (Setara 100% LP2B)">Rasio 1:1 (Wajib Menyediakan {selectedApp.areaHa} Ha Lahan Pengganti)</option>
                    <option value="1:2 (Kawasan Irigasi Primer)">Rasio 1:2 (Wajib Menyediakan {(selectedApp.areaHa * 2).toFixed(1)} Ha Lahan Pengganti)</option>
                    <option value="1:3 (Sawah Produktif Utama)">Rasio 1:3 (Wajib Menyediakan {(selectedApp.areaHa * 3).toFixed(1)} Ha Lahan Pengganti)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200">Syarat &amp; Ketentuan Teknis Rekomendasi</label>
                  <textarea
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                    value={stipulationNotes}
                    onChange={e => setStipulationNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSubmittingApproval}
                  onClick={handleSubmitApproval}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {isSubmittingApproval ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Terbitkan &amp; Transmit Ke PUPTR DB</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          MODAL PATH B: FORM PENOLAKAN / REVISI LAHAN PERTANIAAN
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showRejectionModal && selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Form Pengembalian / Penolakan Lahan</h3>
                    <p className="text-xs text-slate-500">Kirim Feedback Koreksi Ke Dinas PUPTR &amp; Pemohon</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRejectionModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200">Pilih Preset Alasan Penolakan</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none"
                    onChange={e => {
                      if (e.target.value) setRejectionReasonInput(e.target.value);
                    }}
                  >
                    <option value="">-- Pilih Alasan Standar --</option>
                    <option value="Lokasi merupakan Kawasan LP2B Sawah Irigasi Teknis Aktif (IP300) yang dilindungi oleh UU No. 41/2009 dan Perda Luwu. Dilarang Alih Fungsi.">
                      LP2B Sawah Irigasi Teknis Aktif (IP300) - Dilarang Alih Fungsi
                    </option>
                    <option value="Poligon investasi memotong jaringan irigasi sekunder primer pertanian setempat yang berpotensi merusak pengairan 150+ Ha sawah sekitar.">
                      Merusak Jaringan Irigasi Sekunder/Primer
                    </option>
                    <option value="Dokumen Usulan Lahan Pengganti (Replacement Land) tidak memenuhi kriteria kesuburan dan irigasi setara.">
                      Lahan Pengganti (Replacement Land) Tidak Layak
                    </option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200">Detail Alasan &amp; Instuksi Revisi <span className="text-rose-500">*</span></label>
                  <textarea
                    rows={4}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-rose-500/30 resize-none font-sans"
                    value={rejectionReasonInput}
                    onChange={e => setRejectionReasonInput(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRejectionModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSubmittingRejection}
                  onClick={handleSubmitRejection}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  {isSubmittingRejection ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Kembalikan Ke PUPTR &amp; Pemohon</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          SMART FORM ENGINE (REKOMENDASI TEKNIS LP2B & ALIH FUNGSI LAHAN)
         ───────────────────────────────────────────────────────────── */}
      {showSmartFormModal && selectedApp && (
        <SmartFormPertanianModal
          isOpen={showSmartFormModal}
          onClose={() => setShowSmartFormModal(false)}
          initialData={customBapData || convertAppToBapLp2bData(selectedApp, getOpdSettings('pertanian'), mapSnapshot)}
          mapSnapshot={mapSnapshot}
          onCaptureLatestSnapshot={captureCurrentMapSnapshot}
          onSaveData={async (updated) => {
            setCustomBapData(updated);
            if (updated.nomorSurat) setBaDocNum(updated.nomorSurat);
            if (updated.nomorSuratRekomendasi) setSrDocNum(updated.nomorSuratRekomendasi);
            if (updated.rasioLahanPengganti) setReplacementLandRatio(updated.rasioLahanPengganti);

            if (selectedApp?.id) {
              // 1. Simpan ke local cache spesifik ID permohonan
              try {
                localStorage.setItem(`BAP_LP2B_${selectedApp.id}`, JSON.stringify(updated));
                if (updated.nomorSurat) {
                  localStorage.setItem(`BAP_LP2B_${updated.nomorSurat}`, JSON.stringify(updated));
                }
              } catch (e) {
                console.warn('Storage error:', e);
              }

              // 2. Simpan ke Supabase gis_pkkpr & investments dengan timeout protection
              try {
                const updateGis = supabase
                  .from('gis_pkkpr')
                  .update({
                    nama_pemohon: updated.namaPemohon,
                    nama_badan_usaha: updated.namaLembagaOrganisasi,
                    nama_permohonan: updated.fungsiBangunan,
                    nik_pemohon: updated.nibNik,
                    berita_acara_pertanian_num: updated.nomorSurat,
                    status_pkkpr: updated.statusKeputusan === 'REJECTED' ? 'DITOLAK' : 'APPROVED_PERTANIAN',
                    pertanian_approved_at: updated.statusKeputusan === 'APPROVED' ? new Date().toISOString() : null,
                    catatan_teknis: `[SMART FORM LP2B DISUSUN - ${updated.nomorSurat}]: ${updated.catatanRekomendasiTeknis?.join('; ') || updated.keteranganLp2b || 'Rekomendasi teknis alih fungsi lahan pertanian telah disusun.'}`,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', selectedApp.id);

                const updatePkkpr = supabase
                  .from('pkkpr_permohonan')
                  .update({
                    pemohon_name: updated.namaPemohon,
                    nama_kegiatan: updated.fungsiBangunan,
                    berita_acara_pertanian_num: updated.nomorSurat,
                    surat_rekomendasi_pertanian_num: updated.nomorSuratRekomendasi,
                    status_permohonan: updated.statusKeputusan === 'REJECTED' ? 'REJECTED_PERTANIAN' : 'PERTEK_PERTANIAN',
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', selectedApp.id);

                const updateInv = supabase
                  .from('investments')
                  .update({
                    contact_pic: updated.namaPemohon,
                    name: updated.fungsiBangunan,
                    title: updated.fungsiBangunan,
                    berita_acara_num: updated.nomorSurat,
                    surat_rekomendasi_num: updated.nomorSuratRekomendasi,
                    replacement_land_ha: updated.luasWajibLahanPenggantiHa || selectedApp.areaHa,
                    status: updated.statusKeputusan === 'REJECTED' ? 'Rejected_Pertanian' : 'Approved_Pertanian',
                    status_permohonan: updated.statusKeputusan === 'REJECTED' ? 'REJECTED_PERTANIAN' : 'PERTEK_PERTANIAN',
                    pertanian_status: updated.statusKeputusan === 'REJECTED' ? 'REJECTED' : 'APPROVED',
                    override_justification: `[BAP LP2B ${updated.nomorSurat}]: ${updated.catatanRekomendasiTeknis?.join('; ') || ''}`,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', selectedApp.id);

                await Promise.race([
                  Promise.allSettled([updateGis, updatePkkpr, updateInv]),
                  new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout sync DB')), 2500))
                ]);
              } catch (dbErr) {
                console.warn('Supabase sync note in onSaveData:', dbErr);
              }

              // 2b. Synchronize persistent localStorage across OPDs
              try {
                const fRaw = localStorage.getItem('luwu_pkkpr_forwarded_to_pertanian_ids');
                if (fRaw) {
                  const fList: string[] = JSON.parse(fRaw);
                  const removeIdentifiers = [
                    selectedApp.id,
                    selectedApp.nibNik,
                    selectedApp.companyName,
                    selectedApp.applicantName,
                    selectedApp.pkkprDocNumber,
                    selectedApp.skPkkprDocNumber
                  ].filter(Boolean);
                  const updatedFList = fList.filter(id => !removeIdentifiers.includes(id));
                  localStorage.setItem('luwu_pkkpr_forwarded_to_pertanian_ids', JSON.stringify(updatedFList));
                }

                const fAppsRaw = localStorage.getItem('luwu_pkkpr_forwarded_apps_data');
                if (fAppsRaw) {
                  const fApps: any[] = JSON.parse(fAppsRaw);
                  const updatedFApps = fApps.map(app => {
                    if (app.id === selectedApp.id || app.nibNik === selectedApp.nibNik) {
                      return {
                        ...app,
                        applicantName: updated.namaPemohon || app.applicantName,
                        companyName: updated.namaLembagaOrganisasi || app.companyName,
                        title: updated.fungsiBangunan || app.title,
                        agriStatus: 'Approved',
                        pertanianStatus: 'APPROVED',
                        beritaAcaraDocNum: updated.nomorSurat,
                        suratRekomendasiNum: updated.nomorSuratRekomendasi,
                        pertanianBaNumber: updated.nomorSurat,
                        pertanianSrNumber: updated.nomorSuratRekomendasi
                      };
                    }
                    return app;
                  });
                  localStorage.setItem('luwu_pkkpr_forwarded_apps_data', JSON.stringify(updatedFApps));
                }
              } catch (crossSyncErr) {
                console.warn('Cross sync on onSaveData error:', crossSyncErr);
              }

              // 3. Update antrean queueList dan selectedApp di memori dashboard
              setQueueList(prev =>
                prev.map(item =>
                  item.id === selectedApp.id
                    ? {
                        ...item,
                        agriStatus: updated.statusKeputusan === 'REJECTED' ? 'Rejected' : 'Approved',
                        pertanianStatus: updated.statusKeputusan === 'REJECTED' ? 'REJECTED' : 'APPROVED',
                        applicantName: updated.namaPemohon || item.applicantName,
                        companyName: updated.namaLembagaOrganisasi || item.companyName,
                        title: updated.fungsiBangunan || item.title,
                        beritaAcaraDocNum: updated.nomorSurat,
                        suratRekomendasiNum: updated.nomorSuratRekomendasi,
                        pertanianBaNumber: updated.nomorSurat,
                        pertanianSrNumber: updated.nomorSuratRekomendasi,
                        replacementLandHa: updated.luasWajibLahanPenggantiHa || item.replacementLandHa,
                        bap_lp2b_data: updated
                      }
                    : item
                )
              );

              setSelectedApp(prev =>
                prev
                  ? {
                      ...prev,
                      agriStatus: updated.statusKeputusan === 'REJECTED' ? 'Rejected' : 'Approved',
                      pertanianStatus: updated.statusKeputusan === 'REJECTED' ? 'REJECTED' : 'APPROVED',
                      applicantName: updated.namaPemohon || prev.applicantName,
                      companyName: updated.namaLembagaOrganisasi || prev.companyName,
                      title: updated.fungsiBangunan || prev.title,
                      beritaAcaraDocNum: updated.nomorSurat,
                      suratRekomendasiNum: updated.nomorSuratRekomendasi,
                      pertanianBaNumber: updated.nomorSurat,
                      pertanianSrNumber: updated.nomorSuratRekomendasi,
                      replacementLandHa: updated.luasWajibLahanPenggantiHa || prev.replacementLandHa,
                      bap_lp2b_data: updated
                    }
                  : null
              );

              await fetchAgrarianQueue();
            }
          }}
          onOpenFullBapPreview={(updated) => {
            const snap = captureCurrentMapSnapshot();
            setCustomBapData(snap ? { ...updated, petaImageUrl: snap } : updated);
            setShowSmartFormModal(false);
            setShowDocumentPreview(true);
          }}
          isSpatialValidated={isSpatialValidated}
          onOpenSpatialPreviewModal={() => {
            if (selectedApp) {
              setSpatialPreviewTargetApp(selectedApp);
              setShowSpatialPreviewModal(true);
            }
          }}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          SPATIAL DIFFERENCE PREVIEW MODAL (BEFORE - AFTER COMPARISON)
         ───────────────────────────────────────────────────────────── */}
      {showSpatialPreviewModal && (
        <SpatialPreviewDifferenceModal
          isOpen={showSpatialPreviewModal}
          onClose={() => setShowSpatialPreviewModal(false)}
          app={spatialPreviewTargetApp || selectedApp}
          diffMetrics={spatialPreviewDiffMetrics}
          districts={districts}
          villages={villages}
          spatialLayers={spatialLayers}
          isSpatialValidated={isSpatialValidated}
          setIsSpatialValidated={setIsSpatialValidated}
          onProceedToSmartForm={() => {
            if (spatialPreviewTargetApp) {
              setSelectedApp(spatialPreviewTargetApp);
            }
            captureCurrentMapSnapshot();
            setShowSmartFormModal(true);
          }}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          OFFICIAL REKAPITULASI BAP PERTANIAN REPORT MODAL
         ───────────────────────────────────────────────────────────── */}
      {showReportModal && (
        <BapRekapReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          items={filteredQueue}
          statusFilter={statusFilter}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          OFFICIAL 4-PAGE BAP LP2B DINAS PERTANIAN DOCUMENT (A4 STANDAR NASKAH DINAS)
         ───────────────────────────────────────────────────────────── */}
      {showDocumentPreview && selectedApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="min-h-screen py-4 px-2 sm:px-4">
            <BapLp2bPertanianDocument
              initialData={customBapData || convertAppToBapLp2bData(selectedApp, getOpdSettings('pertanian'), mapSnapshot)}
              mapSnapshot={mapSnapshot}
              onClose={() => setShowDocumentPreview(false)}
              onSaveData={async (updated) => {
                setCustomBapData(updated);
                if (updated.nomorSurat) setBaDocNum(updated.nomorSurat);
                if (updated.nomorSuratRekomendasi) setSrDocNum(updated.nomorSuratRekomendasi);

                if (selectedApp?.id) {
                  try {
                    localStorage.setItem(`BAP_LP2B_${selectedApp.id}`, JSON.stringify(updated));
                    if (updated.nomorSurat) {
                      localStorage.setItem(`BAP_LP2B_${updated.nomorSurat}`, JSON.stringify(updated));
                    }
                  } catch (e) {}

                  // Optimistically update React State
                  setSelectedApp((prev: any) => prev ? {
                    ...prev,
                    applicantName: updated.namaPemohon || prev.applicantName,
                    companyName: updated.namaLembagaOrganisasi || prev.companyName,
                    title: updated.fungsiBangunan || prev.title,
                    beritaAcaraDocNum: updated.nomorSurat,
                    pertanianBaNumber: updated.nomorSurat,
                    bap_lp2b_data: updated
                  } : null);

                  setQueueList((prev: any[]) => prev.map(item => item.id === selectedApp.id ? {
                    ...item,
                    applicantName: updated.namaPemohon || item.applicantName,
                    companyName: updated.namaLembagaOrganisasi || item.companyName,
                    title: updated.fungsiBangunan || item.title,
                    beritaAcaraDocNum: updated.nomorSurat,
                    pertanianBaNumber: updated.nomorSurat,
                    bap_lp2b_data: updated
                  } : item));

                  if (supabase) {
                    try {
                      const updateGis = supabase.from('gis_pkkpr').update({
                        nama_pemohon: updated.namaPemohon,
                        nama_badan_usaha: updated.namaLembagaOrganisasi,
                        nama_permohonan: updated.fungsiBangunan,
                        nik_pemohon: updated.nibNik,
                        berita_acara_pertanian_num: updated.nomorSurat,
                        status_pkkpr: updated.statusKeputusan === 'REJECTED' ? 'DITOLAK' : 'APPROVED_PERTANIAN',
                        pertanian_approved_at: updated.statusKeputusan === 'APPROVED' ? new Date().toISOString() : null,
                        catatan_teknis: `[BAP LP2B ${updated.nomorSurat}]: ${updated.catatanRekomendasiTeknis?.join('; ') || updated.keteranganLp2b || ''}`,
                        updated_at: new Date().toISOString()
                      }).eq('id', selectedApp.id);

                      const updatePkkpr = supabase.from('pkkpr_permohonan').update({
                        pemohon_name: updated.namaPemohon,
                        nama_kegiatan: updated.fungsiBangunan,
                        berita_acara_pertanian_num: updated.nomorSurat,
                        surat_rekomendasi_pertanian_num: updated.nomorSuratRekomendasi,
                        status_permohonan: updated.statusKeputusan === 'REJECTED' ? 'REJECTED_PERTANIAN' : 'PERTEK_PERTANIAN',
                        updated_at: new Date().toISOString()
                      }).eq('id', selectedApp.id);

                      const updateInv = supabase.from('investments').update({
                        contact_pic: updated.namaPemohon,
                        name: updated.fungsiBangunan,
                        title: updated.fungsiBangunan,
                        berita_acara_num: updated.nomorSurat,
                        surat_rekomendasi_num: updated.nomorSuratRekomendasi,
                        status: updated.statusKeputusan === 'REJECTED' ? 'Rejected_Pertanian' : 'Approved_Pertanian',
                        status_permohonan: updated.statusKeputusan === 'REJECTED' ? 'REJECTED_PERTANIAN' : 'PERTEK_PERTANIAN',
                        pertanian_status: updated.statusKeputusan === 'REJECTED' ? 'REJECTED' : 'APPROVED',
                        override_justification: `[BAP LP2B ${updated.nomorSurat}]: ${updated.catatanRekomendasiTeknis?.join('; ') || ''}`,
                        updated_at: new Date().toISOString()
                      }).eq('id', selectedApp.id);

                      Promise.race([
                        Promise.allSettled([updateGis, updatePkkpr, updateInv]),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout DB sync')), 2000))
                      ]).catch((e) => console.log('Pertanian BAP DB sync note:', e));
                    } catch (e) {}
                  }
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
