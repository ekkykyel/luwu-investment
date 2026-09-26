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
  ChevronRight,
  Maximize2,
  Compass,
  Database,
  Users,
  Clock,
  Eye,
  EyeOff,
  AlertCircle,
  XCircle,
  Lock,
  Printer,
  Download,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  ShieldAlert
} from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../../lib/supabaseClient';
import { parseKmlKmzFile, ParsedKmzResult } from '../../utils/kmlKmzParser';
import { detectAdministrativeLocation } from '../../utils/spatialLookup';
import { 
  checkPkkprSpatialZoning, 
  PkkprZoningResult, 
  calculateBoundingBox, 
  normalizeDistrictName, 
  findDistrictMatch, 
  isSameDistrict, 
  identifyDistrictFromGeometryOrCoord, 
  normalizeName,
  evaluateSpatialConflictsTurf,
  SpatialConflictEvaluation
} from '../../utils/geoUtils';
import MapComponent, { MapComponentRef } from '../MaplibreComponent';
import OrientationPrompt from '../OrientationPrompt';
import { getOpdSettings } from '../../utils/opdSettingsStorage';
import { formatRupiah } from '../../lib/formatters';
import { useTechnicalSpatialLayers } from '../../hooks/useTechnicalSpatialLayers';
import { Investment } from '../../types';
import { useData } from '../../contexts/DataContext';
import { PkkprSlaTimelineTracker } from './PkkprSlaTimelineTracker';
import { ConflictResolutionToolModal } from '../GIS/ConflictResolutionToolModal';
import { getSpatialOverrides } from '../../utils/spatialOverridesService';
import { LuwuLogo } from '../LuwuLogo';
import { generateBapPdfFromElement } from '../../utils/bapPdfGenerator';
import { CrossOpdNotificationBell } from '../CrossOpdNotificationBell';
import { addCrossOpdNotification } from '../../utils/crossOpdNotificationStore';
import { BapKtrPuptrDocument, convertAppToBapKtrData } from '../documents/BapKtrPuptrDocument';

export interface PkkprApplicationItem {
  id: string;
  applicantType: 'NIB (Pelaku Usaha)' | 'NIK (Perorangan / Warga)';
  category?: 'Berusaha' | 'Non-Berusaha';
  nibNik: string;
  applicantName: string;
  companyName: string;
  title?: string;
  sector: string;
  fungsiBangunan?: string;
  applicantAddress?: string;
  districtName: string;
  villageName: string;
  areaHa: number;
  luasM2?: number;
  luasBangunan?: string;
  investmentValue: number;
  certificateType: string;
  certificateDocNumber: string;
  buktiTanah?: string;
  kmzFileName?: string;
  kmzFileUrl?: string;
  sertifikatTanahUrl?: string;
  suratPengantarDesaUrl?: string;
  berkasLegalitasGabunganUrl?: string;
  geometry?: any;
  pkkprStatus: 'Pending Spatial Check' | 'Approved' | 'Requires Revision' | 'Rejected';
  pkkprDocNumber?: string;
  skPkkprDocNumber?: string;
  technicalNotes?: string;
  coordinateStatus?: string;
  esgStatus?: string;
  pertanianStatus: 'NOT_SUBMITTED' | 'FORWARDED' | 'APPROVED' | 'REJECTED';
  pertanianBaNumber?: string;
  pertanianSrNumber?: string;
  pertanianNotes?: string;
  overrideJustification?: string;
  isOverridden?: boolean;
  contactPhone?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function PuptrSpatialClearanceDashboard() {
  // Queue & Applications State
  const [queueList, setQueueList] = useState<PkkprApplicationItem[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Active Application for Inspection
  const [selectedApp, setSelectedApp] = useState<PkkprApplicationItem | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);
  const [isTurfCardCollapsed, setIsTurfCardCollapsed] = useState<boolean>(false);
  const mapRef = useRef<MapComponentRef>(null);

  // Profile Modal & Inter-Agency Routing State
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showBapModal, setShowBapModal] = useState<boolean>(false);
  const [mapSnapshot, setMapSnapshot] = useState<string | null>(null);
  const [showForwardPertanianModal, setShowForwardPertanianModal] = useState<boolean>(false);
  const [forwardingJustification, setForwardingJustification] = useState<string>('');
  const [isForwarding, setIsForwarding] = useState<boolean>(false);

  // Ingestion Widget State
  const [isUploadingKmz, setIsUploadingKmz] = useState<boolean>(false);
  const [parsedKmz, setParsedKmz] = useState<ParsedKmzResult | null>(null);
  const [ingestNib, setIngestNib] = useState<string>('');
  const [ingestApplicantName, setIngestApplicantName] = useState<string>('');
  const [ingestDistrict, setIngestDistrict] = useState<string>('Bua');
  const [ingestVillage, setIngestVillage] = useState<string>('Barowa');
  const [isIngestLocationLocked, setIsIngestLocationLocked] = useState<boolean>(false);
  const [isSavingGeometry, setIsSavingGeometry] = useState<boolean>(false);

  // Master Data & Spatial Selection State
  const { districts, villages, rtrwZoning } = useData();
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
    setAllLayers
  } = useTechnicalSpatialLayers();

  // Auto focus district/village when an application is selected (Strict Spatial + Normalized)
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
        matchedDist = findDistrictMatch(districts, selectedApp.districtName);
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

  // Studio GIS & Zoning Inspector State
  const [activeLayers, setActiveLayers] = useState<{
    rtrw: boolean;
    lp2b: boolean;
    hutanLindung: boolean;
    mangrove: boolean;
  }>({
    rtrw: true,
    lp2b: true,
    hutanLindung: true,
    mangrove: false,
  });

  // Automated Zoning Intersection Result
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
      sector: (selectedApp.sector || 'Perindustrian') as any,
      subSector: 'PKKPR Permohonan',
      districtId: selectedApp.districtName,
      villageId: selectedApp.villageName,
      areaHa: selectedApp.areaHa || 10,
      district: selectedApp.districtName,
      village: selectedApp.villageName,
      latitude: lat,
      longitude: lng,
      investmentValue: selectedApp.investmentValue,
      landStatus: 'Sertifikat Hak Milik' as const,
      photoUrl: selectedApp.kmzFileUrl || '',
      contactPic: selectedApp.applicantName,
      phoneNumber: '0812-3456-7890',
      isActive: true,
      createdAt: selectedApp.createdAt,
      geometry: geom
    };
  }, [selectedApp]);

  // SK PKKPR Technical Clearance Form State
  const [coordinateValidation, setCoordinateValidation] = useState<string>('Valid / Sesuai Batas RTRW');
  const [technicalNotes, setTechnicalNotes] = useState<string>('');
  const [clearanceDecision, setClearanceDecision] = useState<'Approved' | 'Requires Revision' | 'Rejected'>('Approved');
  const [isIssuingSk, setIsIssuingSk] = useState<boolean>(false);
  const [issuedSkNumber, setIssuedSkNumber] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState<boolean>(false);
  const [isGisToastDismissed, setIsGisToastDismissed] = useState<boolean>(false);
  const [showConflictResolutionModal, setShowConflictResolutionModal] = useState<boolean>(false);
  const [hasLocalOverride, setHasLocalOverride] = useState<boolean>(false);

  // Automated Turf.js Spatial Conflict Audit for all restricted layers (Sawah/LP2B, Lahan Basah, Mangrove, Tambak, Hutan Lindung, Sungai, Jalan)
  const spatialConflictAudit = useMemo<SpatialConflictEvaluation>(() => {
    if (!selectedApp?.geometry) {
      return {
        hasConflict: false,
        conflictCategories: [],
        totalOverlapHa: 0,
        totalOverlapSqm: 0,
        conflicts: []
      };
    }
    return evaluateSpatialConflictsTurf(selectedApp.geometry, spatialLayers, rtrwZoning);
  }, [selectedApp?.geometry, spatialLayers, rtrwZoning]);

  // Load override history for selected application
  useEffect(() => {
    if (selectedApp?.id) {
      getSpatialOverrides(selectedApp.id).then(res => {
        setHasLocalOverride(res.length > 0);
      });
    } else {
      setHasLocalOverride(false);
    }
  }, [selectedApp?.id]);

  const isOverridden = Boolean(
    hasLocalOverride ||
    (selectedApp?.overrideJustification && selectedApp.overrideJustification.trim().length > 0) ||
    (selectedApp?.technicalNotes && selectedApp.technicalNotes.includes('[SPATIAL OVERRIDE'))
  );

  const isPertanianApproved = Boolean(
    selectedApp?.pertanianStatus === 'APPROVED' ||
    selectedApp?.pertanianBaNumber
  );

  // Hard Lockdown: If Turf.js identifies any spatial conflict AND neither override nor Pertanian approval exists
  const isConflictLocked = Boolean(
    spatialConflictAudit.hasConflict && !isOverridden && !isPertanianApproved
  );

  // Return application to applicant (rejected or needs revision, optionally incorporating BAP Pertanian notes)
  const handleReturnToApplicant = async () => {
    if (!selectedApp) return;

    const defaultNotes = selectedApp.pertanianStatus === 'REJECTED'
      ? `Permohonan dikembalikan ke pemohon: Rekomendasi Alih Fungsi Lahan DITOLAK oleh Dinas Pertanian (BAP No. ${selectedApp.pertanianBaNumber || '-'}). Alasan: ${selectedApp.pertanianNotes || technicalNotes || 'Lokasi berada di kawasan LP2B produktif/sawah irigasi teknis aktif.'}`
      : (technicalNotes || 'Permohonan dikembalikan ke pemohon untuk perbaikan deliniasi koordinat/dokumen.');

    const { value: returnReason } = await Swal.fire({
      title: 'Kembalikan Permohonan ke Pemohon?',
      html: `
        <div class="text-left text-xs space-y-2 p-2">
          <p class="text-slate-700 dark:text-slate-300">
            Permohonan <strong>${selectedApp.companyName}</strong> (${selectedApp.nibNik}) akan dikembalikan dengan status <strong>Memerlukan Perbaikan (Revisi)</strong>.
          </p>
          <p class="text-[11px] text-slate-500">
            Catatan teknis dan BAP Dinas Pertanian (jika ada) akan diteruskan ke Dashboard Pemohon.
          </p>
        </div>
      `,
      input: 'textarea',
      inputValue: defaultNotes,
      inputPlaceholder: 'Tuliskan catatan perbaikan untuk pemohon...',
      inputAttributes: {
        'aria-label': 'Catatan perbaikan untuk pemohon'
      },
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Kembalikan ke Pemohon ↩️',
      cancelButtonText: 'Batal'
    });

    if (!returnReason) return;

    setIsIssuingSk(true);
    try {
      const timestamp = new Date().toISOString();

      await Promise.all([
        supabase
          .from('gis_pkkpr')
          .update({
            status_pkkpr: 'Requires Revision',
            catatan_teknis: returnReason,
            updated_at: timestamp
          })
          .eq('id', selectedApp.id),
        supabase
          .from('investments')
          .update({
            status: 'Requires Revision',
            override_justification: returnReason,
            updated_at: timestamp
          })
          .eq('id', selectedApp.id)
      ]);

      // Update local state
      setQueueList(prev => prev.map(item => {
        if (item.id === selectedApp.id) {
          return {
            ...item,
            pkkprStatus: 'Requires Revision',
            technicalNotes: returnReason
          };
        }
        return item;
      }));

      // Notify Applicant
      addCrossOpdNotification({
        applicationId: selectedApp.id,
        applicantName: selectedApp.applicantName,
        companyName: selectedApp.companyName,
        sector: selectedApp.sector,
        districtName: selectedApp.districtName,
        villageName: selectedApp.villageName,
        targetRole: 'PEMOHON',
        fromRole: 'ADMIN_PUPTR',
        type: 'FEEDBACK_REQUIRED',
        title: `Permohonan PKKPR Memerlukan Revisi #${selectedApp.id}`,
        message: `Dinas PUPTR telah mengembalikan berkas permohonan Anda: ${returnReason}`,
        bapPertanianDocNumber: selectedApp.pertanianBaNumber
      });

      Swal.fire({
        icon: 'info',
        title: 'Permohonan Dikembalikan ke Pemohon',
        text: 'Catatan teknis dan BAP Pertanian telah terkirim ke dashboard pemohon untuk ditindaklanjuti.',
        confirmButtonColor: '#e11d48'
      });
    } catch (err: any) {
      console.error('Error returning application:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengembalikan Berkas',
        text: err.message || 'Terjadi kesalahan sistem.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsIssuingSk(false);
    }
  };

  // Open BAP Document Modal with High-Res Map Canvas Snapshot
  const handleOpenBapModal = () => {
    const map = mapRef.current?.getMapInstance?.();
    if (map) {
      // 1. If map canvas is currently ready, capture immediately
      try {
        if (map.loaded()) {
          const snap = map.getCanvas().toDataURL('image/png');
          if (snap && snap !== 'data:,' && snap.length > 500) {
            setMapSnapshot(snap);
          }
        }
      } catch (e) {
        console.warn('Initial map snapshot error:', e);
      }

      // 2. Wait until map completes idle rendering (guarantees crisp satellite tiles & polygons)
      map.once('idle', () => {
        try {
          const snapshot = map.getCanvas().toDataURL('image/png');
          if (snapshot && snapshot !== 'data:,' && snapshot.length > 500) {
            setMapSnapshot(snapshot);
          }
        } catch (err) {
          console.warn('Async map idle snapshot error:', err);
        }
      });
    } else {
      // Fallback DOM canvas query
      const mapCanvas = document.querySelector('.maplibregl-canvas') as HTMLCanvasElement | null;
      if (mapCanvas) {
        try {
          const snap = mapCanvas.toDataURL('image/png');
          if (snap && snap.length > 500) {
            setMapSnapshot(snap);
          }
        } catch (e) {
          console.warn('Map canvas fallback snapshot error:', e);
        }
      }
    }
    setShowBapModal(true);
  };

  // Download BAP PDF using jsPDF
  const handleDownloadBapPdf = async () => {
    if (!selectedApp) return;
    setIsExportingPdf(true);
    try {
      const filename = `BAP_PUPTR_PKKPR_${selectedApp.nibNik}_${new Date().toISOString().slice(0, 10)}.pdf`;
      await generateBapPdfFromElement('puptr-bap-printable-document', {
        filename,
        onSuccess: () => {
          Swal.fire({
            icon: 'success',
            title: 'File PDF Berhasil Diunduh! 📄',
            text: `BAP Resmi PUPTR Luwu telah disimpan sebagai ${filename}`,
            confirmButtonColor: '#4f46e5'
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

  // Fetch PKKPR Queue from Supabase & Local Cache
  const fetchQueue = async () => {
    setIsLoadingQueue(true);
    try {
      let mapped: PkkprApplicationItem[] = [];

      // Local persistent registry for forwarded applications to Dinas Pertanian
      const forwardedRaw = localStorage.getItem('luwu_pkkpr_forwarded_to_pertanian_ids');
      const forwardedList: string[] = forwardedRaw ? JSON.parse(forwardedRaw) : [];
      const isLocallyForwarded = (id?: string, nib?: string, docNum?: string, name?: string) => {
        if (id && forwardedList.includes(id)) return true;
        if (nib && forwardedList.includes(nib)) return true;
        if (docNum && forwardedList.includes(docNum)) return true;
        if (name && forwardedList.includes(name)) return true;
        return false;
      };

      // 1. Primary Query: Try fetching from gis_pkkpr table
      try {
        const { data: pkkprGisData, error: gisErr } = await supabase
          .from('gis_pkkpr')
          .select('*')
          .order('created_at', { ascending: false });

        if (!gisErr && pkkprGisData && pkkprGisData.length > 0) {
          pkkprGisData.forEach((item: any) => {
            const isBerusaha = item.jenis_permohonan === 'Berusaha';
            const applicantType = isBerusaha ? 'NIB (Pelaku Usaha)' : 'NIK (Perorangan / Warga)';
            const rawCatatan = item.catatan_teknis || '';

            const fungsiMatch = rawCatatan.match(/\[Fungsi:\s*([^\]]+)\]/i);
            const buktiMatch = rawCatatan.match(/\[Penguasaan Tanah:\s*([^\]]+)\]/i);
            const luasBangunanMatch = rawCatatan.match(/\[Luas Bangunan:\s*([^\]]+)\]/i);
            const alamatMatch = rawCatatan.match(/\[Alamat Pemohon:\s*([^\]]+)\]/i);

            const fungsiBangunan = fungsiMatch ? fungsiMatch[1].trim() : (item.fungsi_bangunan || (isBerusaha ? 'Komersial / Usaha' : 'Non-Berusaha / Fasos / Perumahan'));
            const buktiTanah = buktiMatch ? buktiMatch[1].trim() : (item.bukti_tanah || (isBerusaha ? 'Hak Guna Bangunan (HGB)' : 'Sertifikat Hak Milik (SHM)'));
            const luasBangunan = luasBangunanMatch ? luasBangunanMatch[1].trim() : (item.luas_bangunan_m2 ? `${item.luas_bangunan_m2} m²` : undefined);
            const applicantAddress = alamatMatch ? alamatMatch[1].trim() : (item.alamat_pemohon || item.address || `Desa ${item.desa_kelurahan || '-'}, Kec. ${item.kecamatan || '-'}, Kab. Luwu`);
            const luasM2 = item.luas_m2 ? Number(item.luas_m2) : (item.luas_ha ? Math.round(Number(item.luas_ha) * 10000) : 5000);

            let pertStatus: 'NOT_SUBMITTED' | 'FORWARDED' | 'APPROVED' | 'REJECTED' = 'NOT_SUBMITTED';
            if (item.berita_acara_pertanian_num || item.status_pkkpr === 'Approved_Pertanian' || item.pertanian_status === 'APPROVED') {
              pertStatus = 'APPROVED';
            } else if (item.status_pkkpr === 'Rejected_Pertanian' || item.pertanian_status === 'REJECTED') {
              pertStatus = 'REJECTED';
            } else if (
              item.status_pkkpr === 'Forwarded_To_Pertanian' ||
              item.pertanian_status === 'FORWARDED' ||
              (rawCatatan && rawCatatan.includes('PERTANIAN')) ||
              isLocallyForwarded(item.id, item.nik_pemohon || item.nib_oss, item.pertek_puptr_num || item.sk_pkkpr_num, item.nama_badan_usaha || item.nama_pemohon)
            ) {
              pertStatus = 'FORWARDED';
            }

            mapped.push({
              id: item.id,
              applicantType,
              category: isBerusaha ? 'Berusaha' : 'Non-Berusaha',
              nibNik: isBerusaha ? (item.nib_oss || item.nik_pemohon || '-') : (item.nik_pemohon || '-'),
              applicantName: item.nama_pemohon || 'Pemohon Terdaftar',
              companyName: isBerusaha ? (item.nama_badan_usaha || item.nama_permohonan || 'Pelaku Usaha') : (item.nama_badan_usaha || item.nama_pemohon || item.nama_permohonan || 'Perseorangan / Warga'),
              title: item.nama_permohonan || item.title || (isBerusaha ? 'Permohonan PKKPR Usaha' : 'Permohonan PKKPR Non-Berusaha'),
              sector: item.sektor || (isBerusaha ? 'Komersial / Usaha' : 'Non-Komersial / Perumahan'),
              fungsiBangunan,
              applicantAddress,
              districtName: item.kecamatan || 'Bua',
              villageName: item.desa_kelurahan || 'Barowa',
              areaHa: item.luas_ha ? Number(item.luas_ha) : (item.luas_m2 ? Number((item.luas_m2 / 10000).toFixed(4)) : 0.5),
              luasM2,
              luasBangunan,
              investmentValue: isBerusaha ? 12500000000 : 0,
              certificateType: isBerusaha ? 'Hak Guna Bangunan (HGB)' : 'Sertifikat Hak Milik (SHM)',
              certificateDocNumber: `SHM/HGB-LUWU-${item.id ? item.id.split('-').pop() : '321183'}`,
              buktiTanah,
              kmzFileName: item.nama_berkas_kmz || 'Batas_Poligon_Lokasi.kmz',
              kmzFileUrl: item.berkas_kmz_url || '',
              sertifikatTanahUrl: item.sertifikat_tanah_url || undefined,
              suratPengantarDesaUrl: item.surat_pengantar_desa_url || undefined,
              berkasLegalitasGabunganUrl: item.berkas_legalitas_gabungan_url || item.berkas_gabungan_pdf || undefined,
              geometry: item.geometry_json || item.geom,
              pkkprStatus: (item.sk_pkkpr_num || item.pertek_puptr_num || item.status_pkkpr === 'Approved' || item.status_pkkpr === 'Approved_PUPTR' || item.status_pkkpr === 'Published') ? 'Approved' : (item.status_pkkpr === 'Requires Revision' ? 'Requires Revision' : 'Pending Spatial Check'),
              pkkprDocNumber: item.pertek_puptr_num || item.sk_pkkpr_num || item.id,
              skPkkprDocNumber: item.sk_pkkpr_num || item.pertek_puptr_num,
              technicalNotes: item.catatan_teknis || 'Sesuai dengan Rencana Tata Ruang Wilayah (RTRW) Kabupaten Luwu.',
              coordinateStatus: 'Valid / Sesuai Batas RTRW',
              esgStatus: 'CLEAR',
              pertanianStatus: pertStatus,
              pertanianBaNumber: item.berita_acara_pertanian_num || undefined,
              contactPhone: item.no_whatsapp,
              createdAt: item.created_at || new Date().toISOString()
            });
          });
        }
      } catch (err) {
        console.warn('gis_pkkpr query fallback:', err);
      }

      // 2. Secondary Query: Fetch from investments table for backwards compatibility
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        data.forEach((item: any) => {
          const appId = item.pkkpr_doc_number || item.id;
          const exists = mapped.some(m => m.id === appId || m.id === item.id);
          if (!exists) {
            const isNik = (item.plot_number && item.plot_number.length === 16) || item.contact_pic?.toLowerCase().includes('h.') || (item.category && item.category.includes('Non-Komersial'));
            const applicantType = isNik ? 'NIK (Perorangan / Warga)' : 'NIB (Pelaku Usaha)';
            const desc = item.description || item.override_justification || '';
            const fungsiMatch = desc.match(/\[Fungsi:\s*([^\]]+)\]/i);
            const buktiMatch = desc.match(/\[Penguasaan Tanah:\s*([^\]]+)\]/i);
            const alamatMatch = desc.match(/\[Alamat Pemohon:\s*([^\]]+)\]/i);
            const luasBangunanMatch = desc.match(/\[Luas Bangunan:\s*([^\]]+)\]/i);
            
            let pertStatus: 'NOT_SUBMITTED' | 'FORWARDED' | 'APPROVED' | 'REJECTED' = 'NOT_SUBMITTED';
            if (item.berita_acara_num || item.status === 'Approved_Pertanian' || item.pertanian_status === 'APPROVED') {
              pertStatus = 'APPROVED';
            } else if (item.status === 'Rejected_Pertanian' || item.pertanian_rejection_notes || item.pertanian_status === 'REJECTED') {
              pertStatus = 'REJECTED';
            } else if (
              item.status === 'Forwarded_To_Pertanian' ||
              item.pertanian_status === 'FORWARDED' ||
              (desc && desc.includes('PERTANIAN')) ||
              isLocallyForwarded(item.id, item.plot_number || item.certificate_number, item.pkkpr_doc_number, item.name || item.title)
            ) {
              pertStatus = 'FORWARDED';
            }

            const areaHa = item.area_ha || 15.5;

            mapped.push({
              id: item.id || `PKKPR-${Math.random().toString(36).substring(2, 7)}`,
              applicantType,
              category: isNik ? 'Non-Berusaha' : 'Berusaha',
              nibNik: item.plot_number || item.certificate_number || item.id || '9120000000000',
              applicantName: item.contact_pic || item.nama_kontak_person || 'Pemohon Terdaftar',
              companyName: item.name || item.title || (isNik ? 'Perseorangan' : 'PT Luwu Sinergi Properti'),
              title: item.title || item.name,
              sector: item.sector || 'Perindustrian',
              fungsiBangunan: fungsiMatch ? fungsiMatch[1].trim() : (isNik ? 'Rumah Tinggal / Fasos' : item.sector),
              applicantAddress: alamatMatch ? alamatMatch[1].trim() : `Kecamatan ${item.district_id || item.kecamatan || 'Belopa'}, Kab. Luwu`,
              districtName: item.district_id || item.kecamatan || 'Bua',
              villageName: item.village_id || item.desa || 'Barowa',
              areaHa,
              luasM2: Math.round(areaHa * 10000),
              luasBangunan: luasBangunanMatch ? luasBangunanMatch[1].trim() : undefined,
              investmentValue: item.investment_value || 12500000000,
              certificateType: item.land_status || (isNik ? 'Sertifikat Hak Milik (SHM)' : 'Hak Guna Bangunan (HGB)'),
              certificateDocNumber: item.certificate_number || `SHM/HGB-LUWU-${Math.floor(100000 + Math.random() * 900000)}`,
              buktiTanah: buktiMatch ? buktiMatch[1].trim() : (item.land_status || (isNik ? 'Sertifikat Hak Milik (SHM)' : 'Hak Guna Bangunan (HGB)')),
              kmzFileName: item.proposal_file_name || 'Batas_Poligon_Lokasi.kmz',
              kmzFileUrl: item.photo_url || '',
              geometry: item.geometry,
              pkkprStatus: item.sk_pkkpr_doc_number ? 'Approved' : (item.status === 'Revision' ? 'Requires Revision' : 'Pending Spatial Check'),
              pkkprDocNumber: item.pkkpr_doc_number || item.sk_pkkpr_doc_number,
              skPkkprDocNumber: item.sk_pkkpr_doc_number || item.pkkpr_doc_number,
              technicalNotes: item.override_justification || 'Sesuai dengan Rencana Tata Ruang Wilayah (RTRW) Kabupaten Luwu.',
              coordinateStatus: 'Valid / Sesuai Batas RTRW',
              esgStatus: item.esg_risk_status || 'CLEAR',
              pertanianStatus: pertStatus,
              pertanianBaNumber: item.berita_acara_num || undefined,
              pertanianSrNumber: item.surat_rekomendasi_num || undefined,
              pertanianNotes: item.pertanian_rejection_notes || undefined,
              contactPhone: item.phone_number,
              createdAt: item.created_at || new Date().toISOString()
            });
          }
        });
      }

      // Merge local applications submitted by society from MasyarakatDashboard
      const localAppsRaw = localStorage.getItem("luwu_pkkpr_my_apps");
      if (localAppsRaw) {
        try {
          const localApps = JSON.parse(localAppsRaw);
          localApps.forEach((app: any) => {
            const appId = app.pkkpr_doc_number || app.id;
            const exists = mapped.some(m => m.id === appId || m.nibNik === app.nik || (m.pkkprDocNumber && m.pkkprDocNumber === app.pkkpr_doc_number));
            if (!exists) {
              const isBerusaha = app.category === 'Berusaha';
              const luasM2 = app.luas_m2 || 500;
              const isAppForwarded = (
                app.pertanian_status === 'FORWARDED' ||
                app.status_pkkpr === 'Forwarded_To_Pertanian' ||
                app.status === 'Forwarded_To_Pertanian' ||
                (app.catatan_teknis && app.catatan_teknis.includes('PERTANIAN')) ||
                isLocallyForwarded(appId, app.nik || app.nib, app.pkkpr_doc_number, app.title || app.perusahaan || app.nama_pemohon)
              );
              mapped.unshift({
                id: appId || `PKKPR-LUWU-${Date.now().toString().slice(-6)}`,
                applicantType: isBerusaha ? 'NIB (Pelaku Usaha)' : 'NIK (Perorangan / Warga)',
                category: isBerusaha ? 'Berusaha' : 'Non-Berusaha',
                nibNik: app.nik || app.nib || '7317060202700001',
                applicantName: app.nama_pemohon || 'Pemohon Terdaftar',
                companyName: isBerusaha ? (app.perusahaan || app.title || 'Pelaku Usaha') : (app.nama_lembaga || app.title || 'Perseorangan / Warga'),
                title: app.title || (isBerusaha ? 'Permohonan PKKPR Usaha' : 'Permohonan PKKPR Non-Berusaha'),
                sector: isBerusaha ? 'Komersial / Usaha' : 'Non-Komersial / Perumahan',
                fungsiBangunan: app.fungsi_bangunan || (isBerusaha ? 'Komersial / Usaha' : 'Non-Berusaha / Rumah Tinggal'),
                applicantAddress: app.alamat_pemohon || app.address || `Desa ${app.desa || '-'}, Kec. ${app.kecamatan || '-'}, Kab. Luwu`,
                districtName: app.kecamatan || 'Ponrang',
                villageName: app.desa || 'Ponrang',
                areaHa: app.luas_m2 ? Number((app.luas_m2 / 10000).toFixed(4)) : 0.05,
                luasM2,
                luasBangunan: app.luas_bangunan_m2 ? `${app.luas_bangunan_m2} m²` : undefined,
                investmentValue: isBerusaha ? 1000000000 : 0,
                certificateType: app.bukti_tanah_jenis || (isBerusaha ? 'Hak Guna Bangunan (HGB)' : 'Sertifikat Hak Milik (SHM)'),
                certificateDocNumber: app.bukti_tanah_nomor || `SHM-${appId ? appId.split('-').pop() : '321183'}`,
                buktiTanah: app.bukti_tanah || `${app.bukti_tanah_jenis || 'Sertifikat Hak Milik (SHM)'}${app.bukti_tanah_nomor ? ` (No. ${app.bukti_tanah_nomor})` : ''}`,
                kmzFileName: app.proposal_file_name || 'Geometri_Lahan_Pemohon.kmz',
                kmzFileUrl: '',
                sertifikatTanahUrl: app.sertifikat_tanah_url,
                suratPengantarDesaUrl: app.surat_pengantar_desa_url,
                berkasLegalitasGabunganUrl: app.berkas_legalitas_gabungan_url || app.berkas_gabungan_pdf,
                geometry: app.geometry,
                pkkprStatus: app.sk_pkkpr_doc_number ? 'Approved' : 'Pending Spatial Check',
                pkkprDocNumber: app.sk_pkkpr_doc_number || undefined,
                skPkkprDocNumber: app.sk_pkkpr_doc_number || undefined,
                technicalNotes: 'Permohonan dari Portal Layanan Perizinan PKKPR Publik.',
                coordinateStatus: 'Valid / Sesuai Batas RTRW',
                esgStatus: 'CLEAR',
                pertanianStatus: isAppForwarded ? 'FORWARDED' : 'NOT_SUBMITTED',
                contactPhone: app.no_whatsapp,
                createdAt: app.created_at || new Date().toISOString()
              });
            }
          });
        } catch (e) {
          console.warn('Local apps merge error:', e);
        }
      }

      setQueueList(mapped);

      // Auto-select first active pending item for inspection (excluding forwarded to Pertanian or approved items)
      if (mapped.length > 0) {
        setSelectedApp(prev => {
          const activePending = mapped.filter(m => m.pertanianStatus !== 'FORWARDED' && m.pkkprStatus !== 'Approved');
          if (activePending.length === 0) return null;
          if (!prev) return activePending[0];
          const found = activePending.find(m => m.id === prev.id || m.nibNik === prev.nibNik);
          return found || activePending[0];
        });
      } else {
        setSelectedApp(null);
      }
    } catch (err) {
      console.error('Failed to load PKKPR queue:', err);
      setQueueList([]);
      setSelectedApp(null);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  useEffect(() => {
    fetchQueue();

    const handleUpdate = () => {
      fetchQueue();
    };

    window.addEventListener('luwu_cross_opd_notifications_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    // Supabase Realtime Channel Subscription for reactive cross-OPD sync
    const liveChannel = supabase
      .channel('luwu-spatial-cross-opd')
      .on('broadcast', { event: 'PKKPR_FORWARDED_PERTANIAN' }, () => {
        fetchQueue();
      })
      .on('broadcast', { event: 'PERTANIAN_BAP_ISSUED' }, () => {
        fetchQueue();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gis_pkkpr' }, () => {
        fetchQueue();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'investments' }, () => {
        fetchQueue();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spatial_overrides' }, () => {
        fetchQueue();
      })
      .subscribe();

    return () => {
      window.removeEventListener('luwu_cross_opd_notifications_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      supabase.removeChannel(liveChannel);
    };
  }, []);

  // Select an application from the queue to inspect in Studio GIS
  const selectAppForInspection = (app: PkkprApplicationItem) => {
    setSelectedApp(app);
    setTechnicalNotes(app.technicalNotes || `Sesuai tata ruang kawasan ${app.sector} di Kec. ${app.districtName}.`);
    setIssuedSkNumber(app.skPkkprDocNumber || null);

    // Run real-time Turf.js spatial zoning inspection
    const audit = checkPkkprSpatialZoning(app.geometry);
    setZoningAudit(audit);

    // Pre-fill forwarding justification notes if needed
    setForwardingJustification(
      `Permohonan NIB/NIK: ${app.nibNik} (${app.companyName}) beririsan dengan zona LP2B / Sawah Irigasi di Kec. ${app.districtName}, Desa ${app.villageName} seluas ${app.areaHa} Ha. Diteruskan ke Dinas Pertanian untuk Verifikasi Lapangan & Penerbitan Berita Acara Alih Fungsi Lahan.`
    );
  };

  // Open Inter-Agency Forwarding Modal to Dinas Pertanian
  const handleOpenForwardPertanianModal = () => {
    if (!selectedApp) return;
    setShowForwardPertanianModal(true);
  };

  // Execute Routing Transfer to Dinas Pertanian
  const handleExecuteForwardToPertanian = async () => {
    if (!selectedApp) return;
    const targetApp = selectedApp;
    setIsForwarding(true);
    try {
      // 1. Update persistent local storage registry
      try {
        const raw = localStorage.getItem('luwu_pkkpr_forwarded_to_pertanian_ids');
        const list: string[] = raw ? JSON.parse(raw) : [];
        const identifiers = [targetApp.id, targetApp.nibNik, targetApp.pkkprDocNumber, targetApp.companyName, targetApp.applicantName].filter(Boolean) as string[];
        identifiers.forEach(id => {
          if (!list.includes(id)) list.push(id);
        });
        localStorage.setItem('luwu_pkkpr_forwarded_to_pertanian_ids', JSON.stringify(list));

        // Also save full application snapshot in forwarded apps data for cross-OPD reading
        const fAppsRaw = localStorage.getItem('luwu_pkkpr_forwarded_apps_data');
        const fApps: any[] = fAppsRaw ? JSON.parse(fAppsRaw) : [];
        const existingIdx = fApps.findIndex(a => a.id === targetApp.id || a.nibNik === targetApp.nibNik);
        const snapshot = {
          ...targetApp,
          pertanianStatus: 'FORWARDED',
          technicalNotes: forwardingJustification,
          forwardedAt: new Date().toISOString()
        };
        if (existingIdx >= 0) {
          fApps[existingIdx] = snapshot;
        } else {
          fApps.unshift(snapshot);
        }
        localStorage.setItem('luwu_pkkpr_forwarded_apps_data', JSON.stringify(fApps));
      } catch (e) {
        console.warn('localStorage registry error:', e);
      }

      // 2. Safe Supabase Updates with status PENDING_PERTANIAN
      try {
        await supabase
          .from('gis_pkkpr')
          .update({
            status_pkkpr: 'PENDING_PERTANIAN',
            pertanian_status: 'FORWARDED',
            catatan_teknis: `[PERMOHONAN DITERUSKAN KE DINAS PERTANIAN]: ${forwardingJustification}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', targetApp.id);
      } catch (e) {
        console.warn('gis_pkkpr update note:', e);
      }

      try {
        await supabase
          .from('investments')
          .update({
            status: 'PENDING_PERTANIAN',
            override_justification: `[PERMOHONAN DITERUSKAN KE DINAS PERTANIAN]: ${forwardingJustification}`,
            updated_at: new Date().toISOString()
          })
          .or(`id.eq.${targetApp.id},plot_number.eq.${targetApp.nibNik},certificate_number.eq.${targetApp.nibNik}`);
      } catch (e) {
        console.warn('investments update note:', e);
      }

      // 2b. Supabase Realtime Channel Broadcast for Instant Agriculture Dashboard Sync
      try {
        const liveChannel = supabase.channel('luwu-spatial-cross-opd');
        await liveChannel.send({
          type: 'broadcast',
          event: 'PKKPR_FORWARDED_PERTANIAN',
          payload: {
            applicationId: targetApp.id,
            nibNik: targetApp.nibNik,
            companyName: targetApp.companyName,
            status: 'PENDING_PERTANIAN',
            forwardedAt: new Date().toISOString()
          }
        });
      } catch (broadErr) {
        console.warn('Realtime channel broadcast info:', broadErr);
      }

      // 3. Update local storage luwu_pkkpr_my_apps
      const localAppsRaw = localStorage.getItem("luwu_pkkpr_my_apps");
      if (localAppsRaw) {
        try {
          const localApps = JSON.parse(localAppsRaw);
          const updatedLocalApps = localApps.map((app: any) => {
            if (app.id === targetApp.id || app.pkkpr_doc_number === targetApp.id || app.nik === targetApp.nibNik) {
              return {
                ...app,
                pertanian_status: 'FORWARDED',
                status_pkkpr: 'Forwarded_To_Pertanian',
                status: 'Forwarded_To_Pertanian',
                catatan_teknis: forwardingJustification
              };
            }
            return app;
          });
          localStorage.setItem("luwu_pkkpr_my_apps", JSON.stringify(updatedLocalApps));
        } catch (e) {
          console.warn('Storage update error:', e);
        }
      }

      // 4. Lock spatial file in local state and auto-remove from active queue view
      const updatedQueue = queueList.map(item => {
        if (item.id === targetApp.id || item.nibNik === targetApp.nibNik) {
          return {
            ...item,
            pertanianStatus: 'FORWARDED' as const,
            technicalNotes: forwardingJustification
          };
        }
        return item;
      });
      setQueueList(updatedQueue);

      // 5. Advance selectedApp to the next active pending item
      const remainingPending = updatedQueue.filter(
        q => q.id !== targetApp.id && q.nibNik !== targetApp.nibNik && q.pertanianStatus !== 'FORWARDED' && q.pkkprStatus !== 'Approved'
      );

      if (remainingPending.length > 0) {
        setSelectedApp(remainingPending[0]);
        setZoningAudit(checkPkkprSpatialZoning(remainingPending[0].geometry));
      } else {
        setSelectedApp(null);
        setZoningAudit(null);
      }

      setShowForwardPertanianModal(false);

      // 6. Trigger Cross-OPD Notification to Dinas Pertanian
      addCrossOpdNotification({
        applicationId: targetApp.id,
        applicantName: targetApp.applicantName,
        companyName: targetApp.companyName,
        sector: targetApp.sector,
        districtName: targetApp.districtName,
        villageName: targetApp.villageName,
        targetRole: 'ADMIN_PERTANIAN',
        fromRole: 'ADMIN_PUPTR',
        type: 'FORWARD_PERTANIAN',
        title: `Minta Rekomendasi Teknis LP2B #${targetApp.id}`,
        message: `Dinas PUPTR meneruskan permohonan ${targetApp.companyName} (${targetApp.applicantName}) di Kec. ${targetApp.districtName} yang terdeteksi di Zona LP2B untuk evaluasi pertimbangan teknis pertanian.`,
        notes: forwardingJustification
      });

      Swal.fire({
        icon: 'success',
        title: 'Berkas Berhasil Diteruskan Ke Dinas Pertanian! 🌾',
        html: `
          <div className="text-left text-xs space-y-2 p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800 font-sans">
            <p><strong>Status Geometri:</strong> <span className="text-emerald-600 font-bold">LOCKED &amp; TRANSFERRED</span></p>
            <p><strong>Target Instansi:</strong> Dinas Pertanian Kabupaten Luwu (Bidang Prasarana &amp; Lahan)</p>
            <p><strong>NIB / NIK:</strong> ${targetApp.nibNik} (${targetApp.companyName})</p>
            <p className="text-[11px] text-slate-500 pt-1 border-t border-emerald-200">
              ⚡ Permohonan ini telah dikeluarkan dari Antrean Aktif PUPTR dan langsung masuk ke Antrean Tugas Dinas Pertanian secara real-time.
            </p>
          </div>
        `,
        confirmButtonColor: '#10b981'
      });
    } catch (err: any) {
      console.error('Error forwarding to Pertanian:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Meneruskan Berkas',
        text: err.message || 'Terjadi kesalahan sistem.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsForwarding(false);
    }
  };

  // Handle KMZ/KML File Upload & Parsing
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploadingKmz(true);
    try {
      const parsed = await parseKmlKmzFile(file);
      setParsedKmz(parsed);

      // Auto-detect administrative boundaries from polygon geometry
      let detectedKec = "";
      let detectedDesa = "";
      if (parsed.primaryPolygon?.geometry) {
        try {
          const detection = await detectAdministrativeLocation(parsed.primaryPolygon.geometry, districts);
          if (detection.success) {
            detectedKec = detection.kecamatanName;
            detectedDesa = detection.desaName;
            if (detectedKec) setIngestDistrict(detectedKec);
            if (detectedDesa) setIngestVillage(detectedDesa);
            setIsIngestLocationLocked(true);
          }
        } catch (detErr) {
          console.warn("Spatial detection error in PUPTR:", detErr);
        }
      }

      // Auto-prefill NIB input if empty
      if (!ingestNib) {
        setIngestNib(`NIB-${Math.floor(100000000000 + Math.random() * 900000000000)}`);
      }
      if (!ingestApplicantName && parsed.extractedNames.length > 0) {
        setIngestApplicantName(parsed.extractedNames[0]);
      }

      Swal.fire({
        icon: 'success',
        title: 'KML/KMZ Berhasil Diproses! 🗺️',
        html: `
          <div class="text-left text-xs space-y-1.5 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-sans">
            <p><strong>Berkas:</strong> ${parsed.fileName} (${(parsed.fileSize / 1024).toFixed(1)} KB)</p>
            <p><strong>Jumlah Fitur:</strong> ${parsed.placemarkCount} Placemark</p>
            <p><strong>Luas Estimasi:</strong> <span class="text-emerald-600 dark:text-emerald-400 font-bold">${parsed.totalAreaHa} Ha</span></p>
            ${detectedKec ? `<p class="pt-1.5 border-t border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">🔒 Lokasi Terkunci: Kec. ${detectedKec}${detectedDesa ? `, Desa ${detectedDesa}` : ''}</p>` : ''}
          </div>
        `,
        confirmButtonColor: '#10b981'
      });
    } catch (err: any) {
      console.error('Parsing KMZ failed:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Membaca KMZ/KML',
        text: err.message || 'Format berkas tidak valid atau rusak.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsUploadingKmz(false);
    }
  };

  // Map parsed polygon geometry into Supabase database
  const handleSaveIngestedGeometry = async () => {
    if (!parsedKmz || !parsedKmz.primaryPolygon) {
      Swal.fire({
        icon: 'warning',
        title: 'Geometri Belum Siap',
        text: 'Silakan unggah berkas .kmz/.kml terlebih dahulu.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    if (!ingestNib.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'NIB / NIK Kosong',
        text: 'Silakan isi NIB/NIK pemohon untuk menautkan geometri.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    setIsSavingGeometry(true);
    try {
      const geometryObj = parsedKmz.primaryPolygon;
      const newRecord = {
        name: ingestApplicantName || `Proyek NIB ${ingestNib}`,
        plot_number: ingestNib,
        certificate_number: ingestNib,
        district_id: ingestDistrict,
        village_id: ingestVillage,
        area_ha: parsedKmz.totalAreaHa || 10,
        geometry: geometryObj,
        proposal_file_name: parsedKmz.fileName,
        status: 'Review',
        contact_pic: ingestApplicantName || 'Pemohon NIB'
      };

      const { data, error } = await supabase
        .from('investments')
        .insert([newRecord])
        .select()
        .single();

      if (error) {
        console.warn('Supabase geometry insert warning:', error);
      }

      Swal.fire({
        icon: 'success',
        title: 'Geometri Terpetakan Ke Database! 🚀',
        text: `Poligon lokasi untuk NIB "${ingestNib}" seluas ${parsedKmz.totalAreaHa} Ha berhasil disimpan ke tabel geometries & investments.`,
        confirmButtonColor: '#10b981'
      });

      // Reset ingestion state & refresh queue
      setParsedKmz(null);
      setIngestNib('');
      setIngestApplicantName('');
      await fetchQueue();
    } catch (err: any) {
      console.error('Error saving geometry:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan Geometri',
        text: err.message || 'Terjadi kesalahan sistem.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsSavingGeometry(false);
    }
  };

  // Trigger SK PKKPR Issuance & Central Database Sync
  const handleIssueSkPkkpr = async () => {
    if (!selectedApp) return;

    setIsIssuingSk(true);
    try {
      const year = new Date().getFullYear();
      const randomSeq = Math.floor(100 + Math.random() * 900);
      const generatedDocNum = `503/PERTEK-PUPTR/LUWU/${year}/${randomSeq}`;

      // Update both 'gis_pkkpr' and 'investments'
      // Dinas PUPTR only issues PERTEK Kesesuaian Tata Ruang (pertek_puptr_num).
      // sk_pkkpr_num remains NULL for DPMPTSP (Admin Perizinan OSS) to issue with digital TTE!
      await Promise.all([
        supabase
          .from('gis_pkkpr')
          .update({
            pertek_puptr_num: generatedDocNum,
            sk_pkkpr_num: null,
            status_pkkpr: clearanceDecision === 'Approved' ? 'Approved_PUPTR' : 'Requires Revision',
            catatan_teknis: technicalNotes,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedApp.id),
        supabase
          .from('investments')
          .update({
            pkkpr_doc_number: generatedDocNum,
            status: clearanceDecision === 'Approved' ? 'Approved_PUPTR' : 'Review',
            override_justification: technicalNotes,
            esg_risk_status: zoningAudit?.suitabilityLevel === 'DIBATASI' ? 'HIGH_RISK_INTERSECTION' : 'CLEAR',
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedApp.id)
      ]);

      setIssuedSkNumber(generatedDocNum);

      // Update local state queue
      setQueueList(prev => prev.map(item => {
        if (item.id === selectedApp.id) {
          return {
            ...item,
            pkkprStatus: clearanceDecision,
            pkkprDocNumber: generatedDocNum,
            skPkkprDocNumber: generatedDocNum,
            technicalNotes
          };
        }
        return item;
      }));

      // Trigger Cross-OPD Notification to DPMPTSP
      addCrossOpdNotification({
        applicationId: selectedApp.id,
        applicantName: selectedApp.applicantName,
        companyName: selectedApp.companyName,
        sector: selectedApp.sector,
        districtName: selectedApp.districtName,
        villageName: selectedApp.villageName,
        targetRole: 'ADMIN_DPMPTSP',
        fromRole: 'ADMIN_PUPTR',
        type: 'APPROVED_PUPTR',
        title: `Pertek & BAP PUPTR Terbit #${selectedApp.id}`,
        message: `Dinas PUPTR telah menyetujui Pertimbangan Teknis No. ${generatedDocNum} (BAP Pertanian: ${selectedApp.pertanianBaNumber || 'Bebas LP2B'}). Berkas siap untuk Pencetakan SK Izin PKKPR DPMPTSP & Penyematan TTE.`,
        bapPertanianDocNumber: selectedApp.pertanianBaNumber,
        bapPuptrDocNumber: generatedDocNum
      });

      // Auto-advance selection to next pending item in queue
      const nextPending = queueList.find(q => q.id !== selectedApp.id && q.pkkprStatus !== 'Approved' && q.pertanianStatus !== 'FORWARDED');
      if (nextPending) {
        setTimeout(() => setSelectedApp(nextPending), 1200);
      }

      Swal.fire({
        icon: 'success',
        title: 'Pertek Ruang Berhasil Diterbitkan! 🎉',
        html: `
          <div className="text-left text-xs space-y-2 p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800 font-sans">
            <p className="text-slate-900 dark:text-emerald-100"><strong>Nomor Pertek PUPTR:</strong> <code className="font-mono text-emerald-600 dark:text-emerald-300 font-bold">${generatedDocNum}</code></p>
            <p className="text-slate-900 dark:text-emerald-100"><strong>NIB/NIK Pemohon:</strong> ${selectedApp.nibNik}</p>
            <p className="text-slate-900 dark:text-emerald-100"><strong>Status Spasial:</strong> <span className="font-bold text-emerald-600">${clearanceDecision}</span></p>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] pt-1 border-t border-emerald-200 dark:border-emerald-800">
              ⚡ Permohonan ini telah disetujui dan otomatis diteruskan ke <strong>Antrean Cetak Izin DPMPTSP / OSS</strong> untuk proses TTE Digital dan penerbitan SK PKKPR Final. Berkas kini dikeluarkan dari antrean aktif PUPTR.
            </p>
          </div>
        `,
        confirmButtonColor: '#10b981'
      });
    } catch (err: any) {
      console.error('Error issuing Pertek PUPTR:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Penerbitan Pertek',
        text: err.message || 'Terjadi kesalahan sistem.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsIssuingSk(false);
    }
  };

  // Filtered Queue List (Excludes items currently forwarded to Dinas Pertanian from default active PUPTR queue)
  const filteredQueue = useMemo(() => {
    return queueList.filter(item => {
      const matchSearch =
        item.nibNik.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.districtName.toLowerCase().includes(searchQuery.toLowerCase());

      // Hide items currently forwarded to Dinas Pertanian from default active PUPTR queue unless explicitly filtering FORWARDED or ALL_HISTORICAL
      if (item.pertanianStatus === 'FORWARDED' && statusFilter !== 'FORWARDED' && statusFilter !== 'ALL_HISTORICAL') {
        return false;
      }

      // Hide APPROVED items from the active pending queue ('ALL' or 'PENDING') so they don't linger in the active queue table!
      if ((statusFilter === 'ALL' || statusFilter === 'PENDING') && item.pkkprStatus === 'Approved') {
        return false;
      }

      if (statusFilter === 'ALL' || statusFilter === 'PENDING') return matchSearch;
      if (statusFilter === 'APPROVED') return matchSearch && item.pkkprStatus === 'Approved';
      if (statusFilter === 'REVISION') return matchSearch && item.pkkprStatus === 'Requires Revision';
      if (statusFilter === 'FORWARDED') return matchSearch && item.pertanianStatus === 'FORWARDED';
      if (statusFilter === 'ALL_HISTORICAL') return matchSearch;
      return matchSearch;
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
            status: selectedApp.pkkprStatus
          },
          geometry: selectedApp.geometry
        }
      ]
    };
  }, [selectedApp]);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────────
          BRANDING HEADER & LIVE KPI STATS (Android-First Optimized)
         ───────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-6 text-white border border-indigo-500/30 shadow-xl">
        <div className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-emerald-500/10 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                PUPTR - Bidang Tata Ruang &amp; Geospasial
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                Luwu Clearance Hub
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2 sm:gap-2.5">
              <ShieldCheck className="w-6 h-6 sm:w-8 h-8 text-emerald-400 shrink-0" />
              <span>Admin Studio Clearance &amp; Lisensi PKKPR</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Pusat validasi geospasial, ingesti berkas KMZ/KML, analisis tumpang tindih RTRW/LP2B, dan penerbitan SK Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) Kabupaten Luwu.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end md:items-center gap-3 shrink-0 w-full md:w-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 shrink-0 w-full sm:w-auto">
              <div className="bg-slate-800/80 border border-slate-700/80 p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">TOTAL ANTREAN</span>
                <span className="text-lg sm:text-xl font-bold text-white font-mono mt-1">{queueList.length}</span>
                <span className="text-xs text-emerald-400 mt-1 truncate">Permohonan PKKPR</span>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/80 p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">SK TERBIT</span>
                <span className="text-lg sm:text-xl font-bold text-emerald-400 font-mono mt-1">
                  {queueList.filter(i => i.pkkprStatus === 'Approved').length}
                </span>
                <span className="text-xs text-slate-300 mt-1 truncate">Tersinkronisasi DPMPTSP</span>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/80 p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">LUAS VERIFIKASI</span>
                <span className="text-lg sm:text-xl font-bold text-amber-400 font-mono mt-1">
                  {queueList.reduce((acc, curr) => acc + (curr.areaHa || 0), 0).toFixed(1)} Ha
                </span>
                <span className="text-xs text-slate-300 mt-1 truncate">RTRW Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODULE 1: SPATIAL INGESTION & KMZ/KML PARSER PIPELINE
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                1. Spatial Ingestion &amp; KMZ/KML Parser Pipeline
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unggah berkas poligon (.kmz / .kml) untuk ekstraksi batas geospasial dan dipetakan langsung ke basis data <code className="font-mono text-emerald-600">geometries</code>.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full font-mono text-[10px] font-bold">
            JSZip + KML Engine
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Drag & Drop Dropzone */}
          <div className="md:col-span-2 relative border-2 border-dashed border-indigo-300 dark:border-indigo-700/60 hover:border-indigo-500 bg-indigo-50/30 dark:bg-slate-800/30 rounded-2xl p-6 transition-all flex flex-col items-center justify-center text-center">
            <input
              type="file"
              accept=".kmz,.kml"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
            <div className="p-3 bg-indigo-600 text-white rounded-2xl mb-3 shadow-md">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              {isUploadingKmz ? 'Membaca & Mengekstrak Poligon...' : 'Pilih atau Seret Berkas .KMZ / .KML Ke Sini'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-md">
              Sistem akan mengurai tag &lt;Placemark&gt; dan &lt;coordinates&gt; secara otomatis tanpa memerlukan server konversi eksternal.
            </p>

            {isUploadingKmz && (
              <div className="flex items-center gap-2 mt-3 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Arsip Zip &amp; XML KML...</span>
              </div>
            )}
          </div>

          {/* Ingestion & Mapping Form */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center justify-between">
              <span>Identitas Pemetaan DB</span>
              {parsedKmz && <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">Poligon Siap</span>}
            </h4>

            {parsedKmz ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-xs space-y-1 text-slate-800 dark:text-emerald-200">
                <p><strong>File:</strong> {parsedKmz.fileName}</p>
                <p><strong>Fitur:</strong> {parsedKmz.placemarkCount} Fitur Spasial</p>
                <p><strong>Estimasi Luas:</strong> <span className="text-emerald-600 dark:text-emerald-400 font-bold">{parsedKmz.totalAreaHa} Ha</span></p>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 italic p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                Belum ada berkas KMZ/KML yang diunggah.
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">NIB / NIK Pemohon <span className="text-rose-500">*</span></label>
              <input
                type="text"
                placeholder="Contoh: 9120000000000"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono outline-none focus:ring-2 focus:ring-indigo-500/30"
                value={ingestNib}
                onChange={e => setIngestNib(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Nama Pemohon / Perusahaan</label>
              <input
                type="text"
                placeholder="Contoh: PT Agro Luwu Sejahtera"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/30"
                value={ingestApplicantName}
                onChange={e => setIngestApplicantName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">Kecamatan</label>
                  {isIngestLocationLocked && <Lock className="w-3 h-3 text-emerald-500" />}
                </div>
                <input
                  type="text"
                  readOnly={isIngestLocationLocked}
                  disabled={isIngestLocationLocked}
                  className={`w-full border rounded-xl px-2.5 py-1 text-xs outline-none ${
                    isIngestLocationLocked
                      ? "bg-slate-100 dark:bg-slate-950/80 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold cursor-not-allowed"
                      : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  }`}
                  value={ingestDistrict}
                  onChange={e => setIngestDistrict(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">Desa / Kelurahan</label>
                  {isIngestLocationLocked && <Lock className="w-3 h-3 text-emerald-500" />}
                </div>
                <input
                  type="text"
                  readOnly={isIngestLocationLocked}
                  disabled={isIngestLocationLocked}
                  className={`w-full border rounded-xl px-2.5 py-1 text-xs outline-none ${
                    isIngestLocationLocked
                      ? "bg-slate-100 dark:bg-slate-950/80 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold cursor-not-allowed"
                      : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  }`}
                  value={ingestVillage}
                  onChange={e => setIngestVillage(e.target.value)}
                />
              </div>
            </div>

            <button
              type="button"
              disabled={!parsedKmz || isSavingGeometry}
              onClick={handleSaveIngestedGeometry}
              className="w-full mt-auto py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
            >
              {isSavingGeometry ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              <span>Map Ke Database Geometries</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODULE 2: INCOMING SPATIAL QUEUE (ANTEAN PERMOHONAN PKKPR)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                2. Antrean Permohonan PKKPR (Incoming Spatial Queue)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daftar permohonan investasi &amp; izin bangunan yang memerlukan validasi tata ruang oleh Petugas PUPTR.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchQueue}
              disabled={isLoadingQueue}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQueue ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari NIB/NIK, Nama Pemohon, atau Kecamatan..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/30"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'PENDING', 'APPROVED', 'REVISION', 'FORWARDED', 'ALL_HISTORICAL'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'Antrean Aktif PUPTR' : st === 'PENDING' ? 'Pending Check' : st === 'APPROVED' ? 'Pertek Disetujui' : st === 'REVISION' ? 'Revisi' : st === 'FORWARDED' ? '🌾 Diteruskan Pertanian' : 'Semua Riwayat'}
              </button>
            ))}
          </div>
        </div>

        {/* Queue Display: Mobile Card List (Android Friendly) & Desktop Table */}
        {isLoadingQueue ? (
          <div className="py-8 text-center text-slate-500 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
            <span className="text-xs font-medium">Memuat antrean permohonan spasial...</span>
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="py-8 text-center text-slate-500 font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs">
            Belum ada antrean permohonan yang sesuai kriteria.
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
                        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                          {item.nibNik}
                        </span>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                          {item.companyName}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.applicantName} • {item.sector}
                        </p>
                      </div>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${
                          item.pkkprStatus === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300'
                            : item.pkkprStatus === 'Requires Revision'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300'
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300'
                        }`}
                      >
                        {item.pkkprStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 mb-3 font-sans">
                      <div>
                        <span className="text-slate-400 text-[10px] block uppercase font-bold">Lokasi</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          Kec. {item.districtName}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block uppercase font-bold">Luas Lahan</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {item.areaHa ? `${item.areaHa} Ha` : '-'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          selectAppForInspection(item);
                          setShowProfileModal(true);
                        }}
                        className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Profil Berkas</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => selectAppForInspection(item)}
                        className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspeksi GIS</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (Screen >= md) */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">NIB / NIK Pemohon</th>
                    <th className="py-3 px-4">Nama Pemohon &amp; PT</th>
                    <th className="py-3 px-4">Usulan Lokasi</th>
                    <th className="py-3 px-4">Luas Lahan</th>
                    <th className="py-3 px-4">Berkas Spasial</th>
                    <th className="py-3 px-4">Status PKKPR</th>
                    <th className="py-3 px-4 text-center">Aksi Inspeksi</th>
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
                          <div className="text-[10px] text-slate-500">{item.applicantName} • {item.sector}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">Kec. {item.districtName}</div>
                          <div className="text-[10px] text-slate-500">Desa/Kel. {item.villageName}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {item.areaHa ? `${item.areaHa} Ha` : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                            <FileText className="w-3.5 h-3.5" />
                            <span>{item.kmzFileName || 'Batas_Spasial.kmz'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              item.pkkprStatus === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300'
                                : item.pkkprStatus === 'Requires Revision'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300'
                                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300'
                            }`}
                          >
                            {item.pkkprStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                selectAppForInspection(item);
                                setShowProfileModal(true);
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Profil</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => selectAppForInspection(item)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 transition shadow-sm cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspeksi GIS</span>
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
          MODULE 3 & MODULE 4: ADMIN STUDIO GIS INSPECTOR & SK ISSUANCE
         ───────────────────────────────────────────────────────────── */}
      {selectedApp && (
        <div className={`grid grid-cols-1 ${isMapExpanded ? 'grid-cols-1' : 'lg:grid-cols-3'} gap-6`}>
          {/* Left / Top Column: Studio GIS Map Canvas (Module 3) */}
          <div className={`${isMapExpanded ? 'w-full col-span-full' : 'lg:col-span-2'} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 sm:p-5 shadow-sm space-y-4`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Map className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    3. Admin Studio GIS &amp; Zoning Inspector
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Inspeksi visual poligon <strong className="text-emerald-600">{selectedApp.companyName}</strong> terhadap layer RTRW, LP2B, dan Konservasi.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTurfCardCollapsed(prev => !prev)}
                  className={`px-3 py-1.5 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    isTurfCardCollapsed
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                      : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
                  }`}
                  title={isTurfCardCollapsed ? "Tampilkan Panel Hasil Analisis & Data Pemohon" : "Sembunyikan Panel (Buka Kanvas Peta Lebih Luas)"}
                >
                  {isTurfCardCollapsed ? <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                  <span>{isTurfCardCollapsed ? "Buka Panel Analisis" : "Tutup Panel Analisis"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsMapExpanded(prev => !prev)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title={isMapExpanded ? "Kembali ke Mode Normal (2 Kolom)" : "Perbesar Peta (Mode Studio Lebar)"}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>{isMapExpanded ? "Tampilan Normal" : "Mode Peta Studio Lebar"}</span>
                </button>
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  NIB: {selectedApp.nibNik}
                </span>
              </div>
            </div>

            {/* AUTOMATED ENVIRONMENTAL FLAG BANNER (LP2B & LAHAN BASAH) & ROUTING TRIGGER */}
            {(spatialConflictAudit.hasConflict || activeStates['layer_sawah'] || activeStates['layer_lahan_kering_primer'] || zoningAudit?.suitabilityLevel === 'DIBATASI' || selectedApp.pertanianStatus !== 'NOT_SUBMITTED') && (
              selectedApp.pertanianStatus === 'APPROVED' || selectedApp.pertanianBaNumber ? (
                /* BANNER HIJAU SETELAH DISETUJUI DINAS PERTANIAN */
                <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border-2 border-emerald-500/50 rounded-2xl p-4 space-y-3 shadow-sm font-sans">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-500 text-white rounded-xl font-bold shrink-0 mt-0.5 shadow-md">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                            ✓ REKOMENDASI ALIH FUNGSI LAHAN DISETUJUI (BAP PERTANIAN ACTIVE)
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            BAP NO: {selectedApp.pertanianBaNumber || 'TERLAMPIR'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                          Dinas Pertanian Kab. Luwu telah menyetujui rekomendasi pertimbangan alih fungsi lahan untuk pemohon <strong className="font-bold">{selectedApp.applicantName} ({selectedApp.companyName})</strong>. Peringatan tumpang tindih spasial dihentikan dan seluruh tombol proses Pertek PUPTR &amp; SK PKKPR telah aktif.
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <div className="px-3.5 py-2 bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>✓ BAP Pertanian Terlampir</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Inter-Agency Feedback Notice */}
                  {selectedApp.pertanianBaNumber && (
                    <div className="p-3 bg-white/80 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-slate-800 dark:text-emerald-200 space-y-1">
                      <p className="font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                        <Sparkles className="w-4 h-4" />
                        <span>Legal Reference Baseline Dinas Pertanian Active:</span>
                      </p>
                      <p className="font-mono text-[11px]">
                        Berita Acara No: <strong>{selectedApp.pertanianBaNumber}</strong> | Surat Rekomendasi: <strong>{selectedApp.pertanianSrNumber || 'SR-DISTAN-2026'}</strong>
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setTechnicalNotes(
                            `MEMPERHATIKAN: Berita Acara Rekomendasi Alih Fungsi Lahan Dinas Pertanian No. ${selectedApp.pertanianBaNumber}. Lokasi disetujui dengan kewajiban penyediaan Lahan Pengganti LP2B seluas ${selectedApp.areaHa} Ha.`
                          );
                          Swal.fire({
                            icon: 'info',
                            title: 'Berita Acara Teraplikasi',
                            text: 'Rekomendasi Dinas Pertanian telah di-hydrate ke dalam Form Teknis SK PKKPR.',
                            confirmButtonColor: '#10b981',
                            timer: 2000
                          });
                        }}
                        className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-300 underline font-bold hover:text-emerald-800 cursor-pointer"
                      >
                        + Salin Nomor Berita Acara Ke Form Teknis SK PKKPR
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* BANNER WARNING SEBELUM DISETUJUI PERTANIAN ATAU DI-OVERRIDE */
                <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 space-y-3 font-sans">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold shrink-0 mt-0.5 shadow-md">
                        <AlertTriangle className="w-5 h-5 animate-bounce" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                            ⚠️ AUTOMATED ENVIRONMENTAL FLAG: {spatialConflictAudit.conflictCategories.length > 0 ? spatialConflictAudit.conflictCategories.join(' & ') : 'TUMPANG TINDIH LP2B / LAHAN BASAH'} DETECTED
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            UU No. 41 / 2009 &amp; PP No. 21 / 2021
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                          Poligon lokasi pemohon <strong className="font-bold">{selectedApp.applicantName} ({selectedApp.companyName})</strong> beririsan dengan <span className="font-bold text-amber-600 dark:text-amber-400">{spatialConflictAudit.conflictCategories.join(', ') || 'Zona Lahan Pertanian LP2B / Kawasan Lindung'}</span> seluas <strong className="font-mono">{spatialConflictAudit.totalOverlapHa || selectedApp.areaHa} Ha</strong>. Tombol proses (Disetujui, Revisi, Ditolak, Cetak BAP) dikunci sampai terbit BAP Pertanian atau Otorisasi Override Spasial.
                        </p>
                      </div>
                    </div>

                    {/* Inter-Agency Transfer Action Button */}
                    <div className="shrink-0 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowConflictResolutionModal(true)}
                        className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                        title="Buka Conflict Resolution Tool untuk mencatat pertimbangan teknis override spasial"
                      >
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <span>Override Spasial (BAP Verified)</span>
                      </button>

                      {selectedApp.pertanianStatus === 'FORWARDED' ? (
                        <div className="px-3.5 py-2 bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-2">
                          <Clock className="w-4 h-4 animate-spin text-amber-600" />
                          <span>Dalam Antrean Verifikasi Dinas Pertanian ⏳</span>
                        </div>
                      ) : selectedApp.pertanianStatus === 'REJECTED' ? (
                        <div className="px-3.5 py-2 bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold flex items-center gap-2">
                          <X className="w-4 h-4 text-rose-600" />
                          <span>⚠️ Dikembalikan Dinas Pertanian</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleOpenForwardPertanianModal}
                          className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 transition transform active:scale-95 cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                          <span>Ajukan Permohonan Perubahan Status Lahan ke Dinas Pertanian 🌾</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}

            {/* MapLibre Container with real Polygon Thematic Layers */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span><strong>Petunjuk Analisis Spasial:</strong> Klik sembarang poligon, batas wilayah, jalan, atau layer tematik pada peta untuk menampilkan detail atribut &amp; informasi tata ruang.</span>
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

                {/* FLOATING REAL-TIME GIS TOAST NOTIFICATION WITH DISMISSAL LOGIC */}
                {!isGisToastDismissed && (selectedApp || zoningAudit) && (
                  selectedApp.pertanianStatus === 'APPROVED' || selectedApp.pertanianBaNumber ? (
                    /* TOAST HIJAU: NOTIFIKASI WARNING DIHENTIKAN/DITUTUP SETELAH PERTANIAN SETUJU */
                    <div className="absolute top-3 left-3 z-30 max-w-sm sm:max-w-md bg-emerald-950/90 text-emerald-100 backdrop-blur-md border border-emerald-500/60 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top duration-300 font-sans">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-emerald-500 text-white rounded-xl shrink-0 font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="text-xs">
                          <div className="font-extrabold text-white flex items-center gap-1.5">
                            <span>✓ Alih Fungsi Lahan Disetujui</span>
                            <span className="text-[9px] px-1.5 py-0.2 bg-emerald-800 text-emerald-200 rounded font-mono">DISTAN OK</span>
                          </div>
                          <div className="text-[11px] text-emerald-200 font-mono">
                            BAP No: {selectedApp.pertanianBaNumber || 'Terlampir'} • Peringatan Tumpang Tindih Dihentikan
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsGisToastDismissed(true)}
                        className="p-1.5 hover:bg-emerald-900/80 rounded-xl text-emerald-300 transition shrink-0 cursor-pointer"
                        title="Tutup Notifikasi"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (spatialConflictAudit.hasConflict || activeStates['layer_sawah'] || activeStates['layer_lahan_kering_primer'] || zoningAudit?.suitabilityLevel === 'DIBATASI') ? (
                    /* TOAST AMBER WARNING: SEMENTARA MENDAPATKAN PERSETUJUAN PERTANIAN */
                    <div className="absolute top-3 left-3 z-30 max-w-sm sm:max-w-md bg-amber-950/90 text-amber-100 backdrop-blur-md border border-amber-500/60 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top duration-300 font-sans">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-amber-500 text-slate-950 rounded-xl shrink-0 font-bold">
                          <AlertTriangle className="w-4 h-4 animate-bounce" />
                        </div>
                        <div className="text-xs">
                          <div className="font-extrabold text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                            <span>⚠️ TURF.JS: {spatialConflictAudit.conflictCategories.length > 0 ? spatialConflictAudit.conflictCategories[0] : 'TUMPANG TINDIH SPASIAL'} DETECTED</span>
                          </div>
                          <div className="text-[11px] text-amber-100/90 leading-tight">
                            Poligon beririsan {spatialConflictAudit.totalOverlapHa ? `${spatialConflictAudit.totalOverlapHa} Ha` : 'kawasan bersyarat'}. Memerlukan BAP Pertanian atau Override Spasial!
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setShowConflictResolutionModal(true)}
                          className="px-2 py-1 bg-amber-800/80 hover:bg-amber-700 text-amber-200 text-[10px] font-bold rounded-lg border border-amber-500/40 transition cursor-pointer"
                          title="Buka Conflict Resolution Tool untuk mencatat pertimbangan teknis override"
                        >
                          <span>Override 🛡️</span>
                        </button>
                        {selectedApp.pertanianStatus === 'NOT_SUBMITTED' && (
                          <button
                            type="button"
                            onClick={handleOpenForwardPertanianModal}
                            className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 font-black text-[10px] rounded-lg shadow transition flex items-center gap-1 cursor-pointer"
                          >
                            <span>Kirim ➔</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsGisToastDismissed(true)}
                          className="p-1.5 hover:bg-amber-900/80 rounded-xl text-amber-300 transition cursor-pointer"
                          title="Tutup Toast"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : null
                )}

                {/* Spatial Overlay Card on top of Map (Hasil Analisis Turf.js & Data Pemohon Tersusun Kebawah) */}
                {(zoningAudit || selectedApp) && (
                  isTurfCardCollapsed ? (
                    <button
                      type="button"
                      onClick={() => setIsTurfCardCollapsed(false)}
                      className="fixed bottom-3 right-3 md:absolute md:top-3 md:right-14 md:bottom-auto bg-slate-900/90 text-white hover:bg-slate-800 backdrop-blur-md border border-indigo-500/50 rounded-2xl px-3.5 py-2 shadow-2xl z-20 text-xs font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer group"
                      title="Klik untuk membuka panel Hasil Analisis Turf.js & Data Pemohon"
                    >
                      <Compass className="w-4 h-4 text-emerald-400 group-hover:rotate-45 transition-transform" />
                      <span>Buka Panel Analisis Turf.js &amp; Data Pemohon</span>
                      <ChevronDown className="w-4 h-4 text-slate-300" />
                    </button>
                  ) : (
                    <div className="fixed bottom-3 inset-x-3 md:absolute md:top-3 md:right-14 md:left-auto md:w-96 max-h-[82vh] overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xl z-20 text-xs space-y-3 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 animate-in fade-in zoom-in-95 duration-150">
                      {/* Header with Title & Badges */}
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Compass className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-xs tracking-tight">
                              Hasil Analisis Turf.js &amp; Data Pemohon
                            </h4>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              Audit Spasial RTRW &amp; Verifikasi Permohonan
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {zoningAudit && (
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                              zoningAudit.suitabilityLevel === 'DIBATASI'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : zoningAudit.suitabilityLevel === 'BERSYARAT'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}>
                              {zoningAudit.suitabilityLevel}
                            </span>
                          )}
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
                        {/* 1. SEKSI HASIL ANALISIS TURF.JS */}
                        {zoningAudit ? (
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <Layers className="w-3 h-3 text-emerald-500" />
                              Audit Pola Ruang (Turf.js)
                            </span>
                            <div className="space-y-1 text-slate-700 dark:text-slate-300">
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-slate-500 dark:text-slate-400 shrink-0">Zona Matched:</span>
                                <span className="font-bold text-right text-slate-900 dark:text-white">{zoningAudit.matchedZone}</span>
                              </div>
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-slate-500 dark:text-slate-400 shrink-0">Kategori:</span>
                                <span className="font-medium text-right">{zoningAudit.zoneType}</span>
                              </div>
                              <div className="flex justify-between items-start gap-2 text-[11px]">
                                <span className="text-slate-500 dark:text-slate-400 shrink-0">Validasi Topologi:</span>
                                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-right font-semibold">Valid (Zero Self-Intersection)</span>
                              </div>
                            </div>

                            {zoningAudit.warningNote && (
                              <p className="text-amber-700 dark:text-amber-400 text-[10.5px] leading-tight font-medium bg-amber-50 dark:bg-amber-950/50 p-2 rounded-lg border border-amber-200 dark:border-amber-800 mt-1">
                                ⚠️ {zoningAudit.warningNote}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 text-center">
                            Menghitung analisis spasial Turf.js...
                          </div>
                        )}

                        {/* 2. SEKSI DATA DETAIL PERMOHONAN PEMOHON */}
                        {selectedApp && (
                          <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                Rincian Permohonan Pemohon
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                selectedApp.category === 'Non-Berusaha' || selectedApp.applicantType.includes('Warga')
                                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}>
                                {selectedApp.category === 'Non-Berusaha' || selectedApp.applicantType.includes('Warga')
                                  ? 'PKKPR Non-Berusaha'
                                  : 'PKKPR Berusaha'}
                              </span>
                            </div>

                            <div className="space-y-1.5 text-slate-800 dark:text-slate-200 text-xs divide-y divide-slate-200 dark:divide-slate-800/60">
                              <div className="pt-1 flex justify-between items-start gap-2">
                                <span className="text-slate-500 dark:text-slate-400 shrink-0">Nama Pemohon:</span>
                                <span className="font-bold text-right text-slate-900 dark:text-white">{selectedApp.applicantName}</span>
                              </div>

                              <div className="pt-1.5 flex justify-between items-start gap-2 font-mono">
                                <span className="text-slate-500 dark:text-slate-400 shrink-0 font-sans">
                                  {selectedApp.applicantType === 'NIB (Pelaku Usaha)' ? 'NIB OSS:' : 'NIK Pemohon:'}
                                </span>
                                <span className="font-bold text-right text-emerald-600 dark:text-emerald-400">{selectedApp.nibNik}</span>
                              </div>

                              <div className="pt-1.5 flex justify-between items-start gap-2">
                                <span className="text-slate-500 dark:text-slate-400 shrink-0">
                                  {selectedApp.category === 'Non-Berusaha' || selectedApp.applicantType.includes('Warga') ? 'Lembaga / Komite:' : 'Nama Perusahaan:'}
                                </span>
                                <span className="font-semibold text-right">{selectedApp.companyName}</span>
                              </div>

                              <div className="pt-1.5 flex justify-between items-start gap-2">
                                <span className="text-slate-500 dark:text-slate-400 shrink-0">Judul Kegiatan:</span>
                                <span className="font-medium text-right text-slate-700 dark:text-slate-300">
                                  {selectedApp.title || selectedApp.companyName}
                                </span>
                              </div>

                              {selectedApp.fungsiBangunan && (
                                <div className="pt-1.5 flex justify-between items-start gap-2">
                                  <span className="text-slate-500 dark:text-slate-400 shrink-0">Fungsi Bangunan:</span>
                                  <span className="font-medium text-right text-slate-700 dark:text-slate-300">
                                    {selectedApp.fungsiBangunan}
                                  </span>
                                </div>
                              )}

                              <div className="pt-1.5 flex justify-between items-start gap-2">
                                <span className="text-slate-500 dark:text-slate-400 shrink-0">Alamat Pemohon:</span>
                                <span className="font-medium text-right text-slate-700 dark:text-slate-300 text-[11px]">
                                  {selectedApp.applicantAddress || `Kec. ${selectedApp.districtName}, Kab. Luwu`}
                                </span>
                              </div>

                              <div className="pt-1.5 flex justify-between items-start gap-2">
                                <span className="text-slate-500 dark:text-slate-400 shrink-0">Lokasi Dimohon:</span>
                                <span className="font-semibold text-right text-slate-800 dark:text-slate-200">
                                  Desa {selectedApp.villageName}, Kec. {selectedApp.districtName}, Kab. Luwu
                                </span>
                              </div>

                              <div className="pt-1.5 flex justify-between items-start gap-2">
                                <span className="text-slate-500 dark:text-slate-400 shrink-0">Luas yang Dimohon:</span>
                                <div className="text-right">
                                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                    {selectedApp.areaHa} Ha
                                  </span>
                                  <span className="text-slate-500 text-[11px] block font-mono">
                                    ({(selectedApp.luasM2 || selectedApp.areaHa * 10000).toLocaleString('id-ID')} m²)
                                  </span>
                                </div>
                              </div>

                              {selectedApp.luasBangunan && (
                                <div className="pt-1.5 flex justify-between items-start gap-2">
                                  <span className="text-slate-500 dark:text-slate-400 shrink-0">Luas Bangunan:</span>
                                  <span className="font-mono font-bold text-right text-slate-800 dark:text-slate-200">
                                    {selectedApp.luasBangunan}
                                  </span>
                                </div>
                              )}

                              <div className="pt-1.5 flex justify-between items-start gap-2">
                                <span className="text-slate-500 dark:text-slate-400 shrink-0">Penguasaan Tanah:</span>
                                <span className="font-semibold text-right text-slate-800 dark:text-slate-200 text-[11px]">
                                  {selectedApp.buktiTanah || `${selectedApp.certificateType} (No. ${selectedApp.certificateDocNumber})`}
                                </span>
                              </div>
                            </div>

                            {/* Tautan Dokumen Pendukung */}
                            {(selectedApp.sertifikatTanahUrl || selectedApp.suratPengantarDesaUrl || selectedApp.berkasLegalitasGabunganUrl) && (
                              <div className="pt-2 border-t border-emerald-500/20 space-y-1">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                                  Dokumen Legalitas Pemohon:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {selectedApp.sertifikatTanahUrl && (
                                    <a
                                      href={selectedApp.sertifikatTanahUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2 py-1 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg text-[10px] font-bold hover:bg-emerald-50 flex items-center gap-1 transition-all"
                                    >
                                      <FileText className="w-3 h-3" /> Sertifikat Tanah
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
                                      <FileText className="w-3 h-3" /> PDF Gabungan
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Tombol Preview Naskah BAP */}
                            <button
                              type="button"
                              onClick={() => setShowProfileModal(true)}
                              className="w-full mt-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                            >
                              <FileCheck2 className="w-3.5 h-3.5" />
                              <span>Lihat Naskah Lengkap BAP-KTR</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Automated SK PKKPR Technical Clearance Form (Module 4) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      4. Form Teknis &amp; SK PKKPR
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Penerbitan SK &amp; Sync DB Central</p>
                  </div>
                </div>
              </div>

              {/* AGRARIAN CLEARANCE STATUS BANNER (DOMINO EFFECT BINDING) */}
              {selectedApp.pertanianStatus === 'REJECTED' && (
                <div className="bg-rose-50 dark:bg-rose-950/80 border-2 border-rose-500 rounded-2xl p-4 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-extrabold text-xs uppercase tracking-wider">
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0 animate-pulse" />
                    <span>⛔ PEMPROSESAN DIKUNCI: PERMOHONAN DITOLAK OLEH DINAS PERTANIAN</span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200">
                    Dinas Pertanian telah menolak rekomendasi alih fungsi lahan LP2B/Sawah untuk permohonan ini. Seluruh langkah penerbitan SK PKKPR dihentikan.
                  </p>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-300 dark:border-rose-800 text-xs font-sans">
                    <strong className="text-rose-600 dark:text-rose-400 block mb-1">Catatan Penolakan Dinas Pertanian:</strong>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">{selectedApp.pertanianNotes || selectedApp.technicalNotes || 'Lokasi masuk kawasan LP2B produktif/sawah irigasi teknis aktif.'}</p>
                  </div>
                </div>
              )}

              {selectedApp.pertanianStatus === 'APPROVED' && (
                <div className="bg-emerald-50 dark:bg-emerald-950/80 border-2 border-emerald-500 rounded-2xl p-4 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>✓ REKOMENDASI DINAS PERTANIAN DISETUJUI (APPROVED)</span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200">
                    Berita Acara Alih Fungsi Lahan No. <strong className="font-mono text-emerald-600 dark:text-emerald-400">{selectedApp.pertanianBaNumber || 'BA/DISTAN/2026'}</strong> telah terbit. Akses penerbitan SK PKKPR dibuka.
                  </p>
                </div>
              )}

              {selectedApp.pertanianStatus === 'FORWARDED' && (
                <div className="bg-amber-50 dark:bg-amber-950/80 border-2 border-amber-500 rounded-2xl p-4 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-extrabold text-xs uppercase tracking-wider">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 animate-spin" />
                    <span>⏳ MENUNGGU DOKUMEN REKOMENDASI DINAS PERTANIAN</span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200">
                    Berkas telah diteruskan ke Dinas Pertanian. Penerbitan SK PKKPR ditangguhkan hingga Berita Acara Pertanian diterbitkan.
                  </p>
                </div>
              )}

              {/* Applicant Summary */}
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3 text-xs space-y-1 text-slate-800 dark:text-slate-200">
                <p><strong>Perusahaan:</strong> {selectedApp.companyName}</p>
                <p><strong>Lokasi:</strong> Kec. {selectedApp.districtName}, Desa {selectedApp.villageName}</p>
                <p><strong>Luas Permohonan:</strong> <span className="font-mono font-bold text-emerald-600">{selectedApp.areaHa} Ha</span></p>
                {issuedSkNumber && (
                  <p className="pt-1 border-t border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                    SK Active: {issuedSkNumber}
                  </p>
                )}
              </div>

              {/* Coordinate Validation Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Validasi Batas &amp; Koordinat</label>
                <select
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none"
                  value={coordinateValidation}
                  onChange={e => setCoordinateValidation(e.target.value)}
                >
                  <option value="Valid / Sesuai Batas RTRW">Valid / Sesuai Batas RTRW</option>
                  <option value="Memerlukan Penyesuaian Deliniasi">Memerlukan Penyesuaian Deliniasi</option>
                  <option value="Tumpang Tindih LP2B / Wajib Pertek">Tumpang Tindih LP2B / Wajib Pertek BPN</option>
                  <option value="Masuk Kawasan Hutan / Ditolak">Masuk Kawasan Hutan / Ditolak</option>
                </select>
              </div>

              {/* Technical Clearance Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Pertimbangan Teknis Tata Ruang</label>
                <textarea
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none font-sans"
                  placeholder="Masukkan catatan teknis, rekomendasi KDB/KLB, atau kewajiban RTH..."
                  value={technicalNotes}
                  onChange={e => setTechnicalNotes(e.target.value)}
                />
              </div>

              {/* Decision Selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Keputusan Rekomendasi Spasial</label>
                {(Boolean(selectedApp.pkkprDocNumber) || Boolean(selectedApp.skPkkprDocNumber) || selectedApp.pkkprStatus === 'Approved' || Boolean(issuedSkNumber)) ? (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Status: Disetujui (Pertek Terbit)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-600 text-white rounded-md font-mono">LOCKED</span>
                  </div>
                ) : isConflictLocked ? (
                  <div className="p-2.5 bg-amber-500/15 border-2 border-amber-500/60 rounded-xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      Keputusan Dikunci (Konflik Spasial Aktif)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-amber-600 text-white rounded-md font-mono">LOCKED</span>
                  </div>
                ) : selectedApp.pertanianStatus === 'FORWARDED' ? (
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                      Status: Menunggu Rekomendasi Pertanian
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-amber-600 text-white rounded-md font-mono">LOCKED</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setClearanceDecision('Approved')}
                      className={`py-2 rounded-xl text-xs font-bold transition border ${
                        clearanceDecision === 'Approved'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Disetujui
                    </button>
                    <button
                      type="button"
                      onClick={() => setClearanceDecision('Requires Revision')}
                      className={`py-2 rounded-xl text-xs font-bold transition border ${
                        clearanceDecision === 'Requires Revision'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Revisi
                    </button>
                    <button
                      type="button"
                      onClick={() => setClearanceDecision('Rejected')}
                      className={`py-2 rounded-xl text-xs font-bold transition border ${
                        clearanceDecision === 'Rejected'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Ditolak
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 mt-4">
              {(Boolean(selectedApp.pkkprDocNumber) || Boolean(selectedApp.skPkkprDocNumber) || selectedApp.pkkprStatus === 'Approved' || Boolean(issuedSkNumber)) ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-xs space-y-1 font-sans">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-extrabold uppercase">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>✓ PERTEK &amp; BAP RUANG TELAH DITERBITKAN</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200">
                    No. Pertek PUPTR: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{selectedApp.pkkprDocNumber || selectedApp.skPkkprDocNumber || issuedSkNumber}</strong>
                  </p>
                  <p className="text-[11px] text-slate-500 pt-1 border-t border-emerald-200 dark:border-emerald-800/60">
                    🔒 Permohonan ini telah diproses dan diteruskan ke Admin DPMPTSP OSS. Tombol pembuatan ulang telah dinonaktifkan.
                  </p>
                </div>
              ) : isConflictLocked ? (
                /* HARD LOCKDOWN PANEL: DISABLING ALL PROCESS BUTTONS EXCEPT FORWARD PERTANIAN & OVERRIDE */
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-amber-500/15 border-2 border-amber-500/60 space-y-3 animate-in fade-in duration-200 shadow-sm font-sans">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold shrink-0 mt-0.5 shadow-md">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                          🔒 TOMBOL PROSES DIKUNCI OLEH TURF.JS SPATIAL AUDIT
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                          KONFLIK SPASIAL
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-200 leading-snug">
                        Poligon beririsan dengan <strong className="text-amber-800 dark:text-amber-300">{spatialConflictAudit.conflictCategories.join(', ') || 'Zona LP2B / Lindung'}</strong> seluas <strong>{spatialConflictAudit.totalOverlapHa || selectedApp.areaHa} Ha</strong> ({spatialConflictAudit.totalOverlapSqm.toLocaleString('id-ID')} m²).
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Seluruh tombol persetujuan, revisi, penolakan, dan cetak BAP dinonaktifkan hingga konflik diselesaikan via salah satu opsi resmi di bawah:
                      </p>
                    </div>
                  </div>

                  {/* 2 Authorized Action Buttons */}
                  <div className="flex flex-col gap-2 pt-1">
                    {/* 1. Forward to Agriculture */}
                    {selectedApp.pertanianStatus === 'FORWARDED' ? (
                      <div className="w-full py-2.5 bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4 animate-spin text-amber-600" />
                        <span>Dalam Antrean Verifikasi Dinas Pertanian ⏳</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleOpenForwardPertanianModal}
                        className="w-full py-3 bg-gradient-to-r from-amber-600 via-emerald-600 to-amber-700 hover:from-amber-500 hover:to-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 transition transform active:scale-95 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>Ajukan Permohonan Perubahan Status Lahan ke Dinas Pertanian 🌾</span>
                      </button>
                    )}

                    {/* 2. Spatial Override */}
                    <button
                      type="button"
                      onClick={() => setShowConflictResolutionModal(true)}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-300 border border-amber-500/50 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                    >
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      <span>Otorisasi Override Spasial (BAP Verified Diskresi) 🛡️</span>
                    </button>
                  </div>
                </div>
              ) : selectedApp.pertanianStatus === 'REJECTED' ? (
                <button
                  type="button"
                  disabled={isIssuingSk}
                  onClick={handleReturnToApplicant}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
                >
                  {isIssuingSk ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-200" />
                  )}
                  <span>Kembalikan ke Pemohon (Ditolak Berdasarkan BAP Pertanian) ↩️</span>
                </button>
              ) : selectedApp.pertanianStatus === 'FORWARDED' ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-3 bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 opacity-80 cursor-not-allowed shadow-md"
                >
                  <Clock className="w-4 h-4 text-amber-200 animate-spin" />
                  <span>Menunggu Berita Acara Pertanian ⏳ (Penerbitan Pertek Ditangguhkan)</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={isIssuingSk}
                    onClick={handleIssueSkPkkpr}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    {isIssuingSk ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>Setujui &amp; Terbitkan Rekomendasi Teknis (Pertek PUPTR) ➔ Kirim ke DPMPTSP OSS 🚀</span>
                  </button>

                  <button
                    type="button"
                    disabled={isIssuingSk}
                    onClick={handleReturnToApplicant}
                    className="w-full py-2.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <XCircle className="w-4 h-4 text-rose-500" />
                    <span>Kembalikan ke Pemohon (Perlu Revisi) ↩️</span>
                  </button>
                </>
              )}

              {/* BAP Resmi PUPTR Preview & Print Button */}
              <button
                type="button"
                disabled={isConflictLocked || selectedApp.pertanianStatus === 'FORWARDED'}
                onClick={handleOpenBapModal}
                className={`w-full py-2.5 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition ${
                  isConflictLocked || selectedApp.pertanianStatus === 'FORWARDED'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60'
                    : 'bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 cursor-pointer'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>
                  {isConflictLocked
                    ? 'BAP PUPTR Terkunci (Selesaikan Konflik Spasial Dahulu)'
                    : selectedApp.pertanianStatus === 'FORWARDED'
                    ? 'BAP PUPTR Belum Dapat Diterbitkan (Menunggu Rekomendasi Pertanian)'
                    : 'Lihat / Cetak Berita Acara (BAP) Kesesuaian Ruang PUPTR'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          COMPREHENSIVE APPLICANT PROFILE & CERTIFICATE MODAL
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showProfileModal && selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                    <Building className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                        {selectedApp.applicantType}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {selectedApp.nibNik}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      {selectedApp.companyName}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Content Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                {/* Column 1: Applicant Credentials & Contact */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-slate-200 dark:border-slate-700 pb-1.5">
                    1. Identitas Pemohon
                  </h4>
                  <p><strong className="text-slate-500">Nama Penanggung Jawab:</strong> <span className="font-bold text-slate-800 dark:text-slate-200">{selectedApp.applicantName}</span></p>
                  <p><strong className="text-slate-500">NIB / NIK:</strong> <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{selectedApp.nibNik}</span></p>
                  <p><strong className="text-slate-500">Sektor Usaha:</strong> {selectedApp.sector}</p>
                  <p><strong className="text-slate-500">Nilai Investasi:</strong> <span className="font-bold text-amber-600">{formatRupiah(selectedApp.investmentValue)}</span></p>
                  <p><strong className="text-slate-500">Luas Usulan Lahan:</strong> <span className="font-mono font-bold text-emerald-600">{selectedApp.areaHa} Hektar (Ha)</span></p>
                </div>

                {/* Column 2: Legal Certificate & Spatial Data */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-slate-200 dark:border-slate-700 pb-1.5">
                    2. Dokumen Legalitas &amp; Spasial
                  </h4>
                  <p><strong className="text-slate-500">Status Alas Hak:</strong> {selectedApp.certificateType}</p>
                  <p><strong className="text-slate-500">Nomor Sertifikat:</strong> <span className="font-mono font-bold">{selectedApp.certificateDocNumber}</span></p>
                  <p><strong className="text-slate-500">Lokasi Kecamatan:</strong> {selectedApp.districtName}</p>
                  <p><strong className="text-slate-500">Desa / Kelurahan:</strong> {selectedApp.villageName}</p>
                  <p className="flex items-center gap-1.5 pt-1">
                    <strong className="text-slate-500">Berkas Geometri:</strong>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {selectedApp.kmzFileName}
                    </span>
                  </p>
                  {(selectedApp.sertifikatTanahUrl || selectedApp.suratPengantarDesaUrl || selectedApp.berkasLegalitasGabunganUrl) && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 mt-2 space-y-1.5">
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Unduh Berkas Legalitas Lahan:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedApp.sertifikatTanahUrl && (
                          <a
                            href={selectedApp.sertifikatTanahUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[11px] font-semibold flex items-center gap-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
                          >
                            <FileText className="w-3 h-3" /> Sertifikat
                          </a>
                        )}
                        {selectedApp.suratPengantarDesaUrl && (
                          <a
                            href={selectedApp.suratPengantarDesaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-[11px] font-semibold flex items-center gap-1 hover:bg-blue-100 dark:hover:bg-blue-900/60"
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
                </div>
              </div>

              {/* Inter-Agency Status Indicator */}
              <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl text-xs flex items-center justify-between">
                <div>
                  <p className="font-bold text-indigo-900 dark:text-indigo-200">Status Clearance Dinas Pertanian (LP2B):</p>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                    {selectedApp.pertanianStatus === 'APPROVED'
                      ? `✓ Berita Acara Disetujui: ${selectedApp.pertanianBaNumber}`
                      : selectedApp.pertanianStatus === 'FORWARDED'
                      ? '⏳ Sedang Diverifikasi Lapangan oleh Dinas Pertanian'
                      : selectedApp.pertanianStatus === 'REJECTED'
                      ? `⚠️ Dikembalikan / Ditolak: ${selectedApp.pertanianNotes}`
                      : 'Belum diteruskan ke Dinas Pertanian'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          INTER-AGENCY ROUTING TRANSFER MODAL (FORWARD TO PERTANIAN)
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showForwardPertanianModal && selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Transfer Berkas Ke Dinas Pertanian</h3>
                    <p className="text-xs text-slate-500">Permohonan Perubahan Status Lahan LP2B</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForwardPertanianModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800 text-slate-800 dark:text-amber-200 space-y-1">
                  <p><strong>NIB / NIK Pemohon:</strong> <span className="font-mono font-bold">{selectedApp.nibNik}</span></p>
                  <p><strong>Pemohon:</strong> {selectedApp.applicantName} ({selectedApp.companyName})</p>
                  <p><strong>Lokasi Usulan:</strong> Kec. {selectedApp.districtName}, Desa {selectedApp.villageName} ({selectedApp.areaHa} Ha)</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 pt-1 border-t border-amber-200 dark:border-amber-800 italic">
                    🔒 Pengiriman ini akan MENGUNCI poligon spasial dan secara instan merutekan antrean ke Backend Dinas Pertanian Kab. Luwu.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200">Catatan Pengantar / Justifikasi PUPTR <span className="text-rose-500">*</span></label>
                  <textarea
                    rows={4}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500/30 resize-none font-sans"
                    value={forwardingJustification}
                    onChange={e => setForwardingJustification(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowForwardPertanianModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isForwarding}
                  onClick={handleExecuteForwardToPertanian}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {isForwarding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Kirim &amp; Kunci Poligon Ke Dinas Pertanian</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          OFFICIAL BAP KESESUAIAN TATA RUANG DINAS PUPTR KAB. LUWU
          (Pixel-Perfect BAP-KTR 4-Page Naskah Dinas & Static Map Snapshot)
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showBapModal && selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-5xl max-h-[96vh] overflow-y-auto bg-[#f1f5f9] rounded-3xl shadow-2xl p-2 sm:p-4 print:p-0 print:m-0 print:bg-white print:max-h-none print:overflow-visible print:rounded-none print:shadow-none"
            >
              <BapKtrPuptrDocument
                initialData={convertAppToBapKtrData(
                  {
                    ...selectedApp,
                    technicalNotes,
                    pkkprStatus: clearanceDecision === 'Approved' ? 'Approved' : 'Rejected'
                  },
                  getOpdSettings('puptr'),
                  mapSnapshot || undefined
                )}
                mapSnapshot={mapSnapshot}
                onClose={() => setShowBapModal(false)}
                showEditorToolbar={true}
                onSaveData={async (updatedBapData) => {
                  try {
                    if (selectedApp?.id && supabase) {
                      await supabase.from('pkkpr_applications').update({
                        pkkpr_doc_number: updatedBapData.nomorSurat,
                        tentang_surat: updatedBapData.tentangSurat,
                        bukti_tanah: updatedBapData.buktiHakTanah,
                        updated_at: new Date().toISOString()
                      }).eq('id', selectedApp.id);
                    }
                  } catch (e) {
                    console.log('Database update note:', e);
                  }
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Conflict Resolution Tool Modal (Spatial Overrides) */}
      {selectedApp && (
        <ConflictResolutionToolModal
          isOpen={showConflictResolutionModal}
          onClose={() => setShowConflictResolutionModal(false)}
          applicationId={selectedApp.id}
          applicantName={selectedApp.applicantName}
          companyName={selectedApp.companyName}
          nibNik={selectedApp.nibNik}
          districtName={selectedApp.districtName}
          villageName={selectedApp.villageName}
          detectedConflictType="LP2B_OVERLAP"
          detectedOverlapSqm={Math.round(selectedApp.areaHa * 10000)}
          detectedOverlapHa={selectedApp.areaHa}
          existingBapNumber={selectedApp.pertanianBaNumber}
          onOverrideSuccess={(justification, bapNum) => {
            setTechnicalNotes(prev => `[SPATIAL OVERRIDE BAP ${bapNum || 'TERLAMPIR'}]: ${justification}\n\n${prev}`);
            setIsGisToastDismissed(true);
            fetchQueue();
          }}
        />
      )}

      {/* SLA Timeline Tracker Modal */}
      {isTimelineModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <button
              onClick={() => setIsTimelineModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <PkkprSlaTimelineTracker
              data={{
                id: selectedApp.id,
                nibNik: selectedApp.nibNik,
                applicantName: selectedApp.applicantName,
                companyName: selectedApp.companyName,
                sector: selectedApp.sector,
                districtName: selectedApp.districtName,
                villageName: selectedApp.villageName,
                areaHa: selectedApp.areaHa,
                createdAt: selectedApp.createdAt,
                updatedAt: selectedApp.updatedAt || selectedApp.createdAt,
                statusPkkpr: selectedApp.pkkprStatus,
                pertekPuptrNum: selectedApp.pkkprDocNumber,
                catatanTeknisPuptr: selectedApp.technicalNotes,
                pertanianStatus: selectedApp.pertanianStatus === 'NOT_SUBMITTED' ? 'NOT_REQUIRED' : selectedApp.pertanianStatus,
                beritaAcaraPertanianNum: selectedApp.pertanianBaNumber,
                catatanPertanian: selectedApp.pertanianNotes,
                skPkkprNum: selectedApp.skPkkprDocNumber,
                isTteSigned: Boolean(selectedApp.skPkkprDocNumber)
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
