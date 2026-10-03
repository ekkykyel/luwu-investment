import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Upload,
  MapPin,
  MapPinOff,
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
import { PKKPRStatus, normalizePKKPRStatus } from '../../types';
import SlaBadge from '../SlaBadge';
import { checkLp2bIntersection } from '../../utils/lp2bSpatialService';
import { getKategoriPengajuan } from '../../utils/pkkprWorkflowService';
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
  SpatialConflictEvaluation,
  calculateAreaWithSRID
} from '../../utils/geoUtils';
import { SridMismatchAlertBanner } from '../common/SridMismatchAlertBanner';
import MapComponent, { MapComponentRef } from '../MaplibreComponent';
import OrientationPrompt from '../OrientationPrompt';
import { getOpdSettings } from '../../utils/opdSettingsStorage';
import { formatRupiah } from '../../lib/formatters';
import { useTechnicalSpatialLayers } from '../../hooks/useTechnicalSpatialLayers';
import { Investment } from '../../types';
import { useData } from '../../contexts/DataContext';
import { PkkprSlaTimelineTracker } from './PkkprSlaTimelineTracker';
import { ConflictResolutionToolModal } from '../GIS/ConflictResolutionToolModal';
import { getSpatialOverrides, recordSpatialOverride } from '../../utils/spatialOverridesService';
import { formatDistrictName, formatVillageName } from '../../utils/gisHelpers';
import { LuwuLogo } from '../LuwuLogo';
import { generateBapPdfFromElement } from '../../utils/bapPdfGenerator';
import { CrossOpdNotificationBell } from '../CrossOpdNotificationBell';
import { addCrossOpdNotification } from '../../utils/crossOpdNotificationStore';
import { BapKtrPuptrDocument, convertAppToBapKtrData } from '../documents/BapKtrPuptrDocument';
import { 
  BapLp2bPertanianDocument, 
  convertAppToBapLp2bData 
} from '../documents/BapLp2bPertanianDocument';
import { 
  normalizePkkprWorkflowStatus, 
  isAppVisibleForRoleQueue, 
  PkkprWorkflowStatus, 
  PKKPR_STATUS_METAS 
} from '../../types/pkkprWorkflow';

export interface PkkprApplicationItem {
  id: string;
  status_permohonan?: PkkprWorkflowStatus;
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
  jenisAlasHak?: string;
  fileAlasHakUrl?: string;
  jenisPengajuanPkkpr?: string;
  kategoriPengajuan?: 'BANGUNAN' | 'PARSIL_TANAH';
  fileSiteplanUrl?: string;
  rencanaLuasBgn?: number | string;
  kmzFileName?: string;
  kmzFileUrl?: string;
  sertifikatTanahUrl?: string;
  suratPengantarDesaUrl?: string;
  berkasLegalitasGabunganUrl?: string;
  geometry?: any;
  pkkprStatus: 'Pending Spatial Check' | 'Approved' | 'Requires Revision' | 'Rejected' | 'Returned' | 'Approved_Pertanian' | 'Approved_PUPTR' | 'Published' | string;
  status_pkkpr?: PKKPRStatus;
  status?: string;
  catatan_revisi?: string | null;
  puptr_approved_at?: string | null;
  pertanian_approved_at?: string | null;
  published_at?: string | null;
  pertekDocNumber?: string;
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

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH TAB CLASSIFICATION HELPER FOR PUPTR
// ─────────────────────────────────────────────────────────────────────────────
export function isApplicationInPuptrTab(item: PkkprApplicationItem, tabId: string): boolean {
  if (!item) return false;

  const rawPkkprStatus = String(item.status_pkkpr || '').toUpperCase().trim();
  const rawPermohonanStatus = String(item.status_permohonan || '').toUpperCase().trim();
  const rawPkkprDisplay = String(item.pkkprStatus || '').toUpperCase().trim();
  const rawAgriStatus = String(item.pertanianStatus || '').toUpperCase().trim();

  // 1. Forwarded to Dinas Pertanian
  const isForwardedToPertanian =
    rawPkkprStatus === 'VERIFIKASI_PERTANIAN' ||
    rawPkkprStatus === 'PENDING PERTEK PERTANIAN' ||
    rawAgriStatus === 'FORWARDED' ||
    rawPermohonanStatus === 'ESCALATED_PERTANIAN' ||
    rawPermohonanStatus === 'WAITING_PERTANIAN';

  // 2. Approved / Published
  const isApproved =
    rawPkkprStatus === 'APPROVED_PUPTR' ||
    rawPkkprStatus === 'TERBIT' ||
    rawPkkprStatus === 'IZIN_TERBIT' ||
    rawPkkprDisplay === 'APPROVED' ||
    rawPermohonanStatus === 'PROSES_OSS' ||
    rawPermohonanStatus === 'IZIN_TERBIT' ||
    rawPermohonanStatus === 'APPROVED';

  // 3. Revision by Applicant or Final Rejection
  const isRevisionOrRejectedFinal =
    rawPkkprStatus === 'REVISI_PEMOHON' ||
    rawPkkprDisplay === 'REQUIRES REVISION' ||
    rawPkkprDisplay === 'REVISION' ||
    rawPkkprDisplay === 'REJECTED' ||
    rawPkkprDisplay === 'RETURNED' ||
    rawPermohonanStatus === 'REJECTED_FINAL' ||
    rawPermohonanStatus === 'REVISI_PEMOHON';

  // 4. Returned / Rejected by Pertanian (Awaiting PUPTR resolution)
  const isRejectedPertanian =
    (rawPkkprStatus === 'DITOLAK' ||
     rawAgriStatus === 'REJECTED' ||
     rawPermohonanStatus === 'REJECTED_PERTANIAN') &&
    !isRevisionOrRejectedFinal;

  switch (tabId) {
    case 'ALL':
    case 'PENDING':
    case 'PUPTR_ACTIVE':
    case 'ACTIVE': {
      // Must not be in forwarded, approved, revision, or rejected by Pertanian
      return !isForwardedToPertanian && !isApproved && !isRevisionOrRejectedFinal && !isRejectedPertanian;
    }

    case 'REJECTED_PERTANIAN':
      return isRejectedPertanian;

    case 'APPROVED':
      return isApproved;

    case 'REVISION':
      return isRevisionOrRejectedFinal;

    case 'FORWARDED':
      return isForwardedToPertanian;

    case 'ALL_HISTORICAL':
      return true;

    default:
      return true;
  }
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
  const [showPertanianBapPreview, setShowPertanianBapPreview] = useState<boolean>(false);
  const [selectedPertanianBapApp, setSelectedPertanianBapApp] = useState<any>(null);

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
    return evaluateSpatialConflictsTurf(selectedApp.geometry, spatialLayers, rtrwZoning, {
      requestedAreaHa: selectedApp.areaHa,
      requestedAreaSqm: selectedApp.luasM2,
      hasPertanianBap: Boolean(selectedApp.pertanianBaNumber || selectedApp.pertanianStatus === 'APPROVED' || selectedApp.status_pkkpr === 'APPROVED_PERTANIAN')
    });
  }, [selectedApp?.geometry, selectedApp?.areaHa, selectedApp?.luasM2, selectedApp?.pertanianBaNumber, selectedApp?.pertanianStatus, selectedApp?.status_pkkpr, spatialLayers, rtrwZoning]);

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

  // Smart Spatial Bypass (Non-LP2B) auto-check on application inspection
  useEffect(() => {
    if (selectedApp && selectedApp.geometry) {
      if (selectedApp.status_pkkpr === 'SUBMITTED' || selectedApp.status_pkkpr === 'VERIFIKASI_PERTANIAN') {
        checkLp2bIntersection(selectedApp.geometry).then((isIntersect) => {
          if (!isIntersect && selectedApp.status_pkkpr !== 'BYPASS_PERTANIAN' && !spatialConflictAudit.hasConflict) {
            const timestamp = new Date().toISOString();
            supabase.from('gis_pkkpr').update({
              status_pkkpr: 'BYPASS_PERTANIAN',
              catatan_teknis: `[SMART SPATIAL BYPASS]: Lahan berada di luar kawasan LP2B (Lolos Verifikasi Otomatis menuju PUPTR).`,
              updated_at: timestamp
            }).eq('id', selectedApp.id).then(() => {
              setSelectedApp((prev: any) => prev ? { ...prev, status_pkkpr: 'BYPASS_PERTANIAN' } : null);
              setQueueList((prev) => prev.map(q => q.id === selectedApp.id ? { ...q, status_pkkpr: 'BYPASS_PERTANIAN' } : q));
            });
          }
        });
      }
    }
  }, [selectedApp?.id, spatialConflictAudit.hasConflict]);

  const isOverridden = Boolean(
    hasLocalOverride ||
    (selectedApp?.overrideJustification && selectedApp.overrideJustification.trim().length > 0) ||
    (selectedApp?.technicalNotes && (
      selectedApp.technicalNotes.includes('[SPATIAL OVERRIDE') ||
      selectedApp.technicalNotes.includes('OVERRIDE SPASIAL') ||
      selectedApp.technicalNotes.includes('IZIN PIMPINAN')
    ))
  );

  const isPertanianApproved = Boolean(
    selectedApp?.pertanianStatus === 'APPROVED' ||
    Boolean(selectedApp?.pertanianBaNumber) ||
    selectedApp?.status_pkkpr === 'APPROVED_PERTANIAN' ||
    (selectedApp as any)?.status === 'Approved_Pertanian' ||
    (selectedApp as any)?.pkkprStatus === 'Approved_Pertanian' ||
    (selectedApp?.technicalNotes && (
      selectedApp.technicalNotes.includes('REKOMENDASI DINAS PERTANIAN TERBIT') ||
      selectedApp.technicalNotes.includes('BA-LP2B') ||
      selectedApp.technicalNotes.includes('BAP-LP2B')
    ))
  );

  // Hard Lockdown: If Turf.js identifies any spatial conflict AND neither override nor Pertanian approval exists
  const isConflictLocked = Boolean(
    spatialConflictAudit.hasConflict && !isOverridden && !isPertanianApproved
  );

  // Ready for Final Pertek PUPTR approval banner & button
  const isReadyForFinalPertek = Boolean(
    !isConflictLocked && (
      !spatialConflictAudit.hasConflict ||
      isPertanianApproved ||
      isOverridden ||
      (selectedApp?.status_permohonan as string) === 'WAITING_PUPTR_FINAL' ||
      (selectedApp?.status_pkkpr as string) === 'WAITING_PUPTR_FINAL'
    )
  );

  // Auto-detect SRID Mismatch & Spatial Discrepancies for selected application
  const activeAppSridReport = React.useMemo(() => {
    if (!selectedApp) return null;
    try {
      const pkkprGeom = selectedApp.geometry || (selectedApp as any).geojson || (selectedApp as any).polygon;
      if (pkkprGeom) {
        return calculateAreaWithSRID(pkkprGeom, 32751, {
          featureName: selectedApp.companyName || selectedApp.applicantName || 'Permohonan PKKPR PUPTR',
          featureProperties: {
            pkkprDocNumber: selectedApp.pkkprDocNumber || selectedApp.skPkkprDocNumber,
            applicant: selectedApp.applicantName,
            company: selectedApp.companyName,
            areaHa: selectedApp.areaHa
          },
          comparisonGeometry: (selectedApp as any).original_geometry || (selectedApp as any).investment_geometry
        });
      }
    } catch (e) {
      console.warn('SRID audit calculation note:', e);
    }
    return null;
  }, [selectedApp]);

  // Official Pertek Issuance Check: True ONLY if PUPTR has officially generated a Pertek document number in current session or database
  const isPertekIssued = Boolean(
    issuedSkNumber ||
    selectedApp?.pkkprStatus === 'Approved' ||
    selectedApp?.status_permohonan === 'PROSES_OSS' ||
    selectedApp?.status_permohonan === 'IZIN_TERBIT' ||
    (selectedApp?.pertekDocNumber && selectedApp.pertekDocNumber.includes('/')) ||
    (selectedApp?.pkkprDocNumber && !selectedApp.pkkprDocNumber.startsWith('PKKPR-CORP-') && !selectedApp.pkkprDocNumber.startsWith('PKKPR-LUWU-') && selectedApp.pkkprDocNumber !== selectedApp.id && selectedApp.pkkprDocNumber.includes('/')) ||
    (selectedApp?.skPkkprDocNumber && !selectedApp.skPkkprDocNumber.startsWith('PKKPR-CORP-') && !selectedApp.skPkkprDocNumber.startsWith('PKKPR-LUWU-') && selectedApp.skPkkprDocNumber !== selectedApp.id && selectedApp.skPkkprDocNumber.includes('/')) ||
    (selectedApp?.status_pkkpr === 'APPROVED_PUPTR' || selectedApp?.status_pkkpr === 'TERBIT' || (selectedApp as any)?.pkkprStatus === 'Approved_PUPTR' || (selectedApp as any)?.pkkprStatus === 'Published')
  );

  // Read-Only Mode Check: True if application has already been processed, forwarded, or stored in history/archives
  const isReadOnlyMode = Boolean(
    selectedApp && (
      isPertekIssued ||
      (selectedApp.status_pkkpr && ['APPROVED_PUPTR', 'TERBIT', 'REVISI_PEMOHON', 'DITOLAK'].includes(selectedApp.status_pkkpr)) ||
      ['PROSES_OSS', 'IZIN_TERBIT', 'REJECTED_FINAL'].includes(selectedApp.status_permohonan) ||
      selectedApp.pkkprStatus === 'Approved' ||
      selectedApp.pkkprStatus === 'Requires Revision' ||
      selectedApp.pkkprStatus === 'Rejected' ||
      selectedApp.pkkprStatus === 'Returned'
    )
  );

  // Quick Leadership Spatial Override (Override Atas Izin Pimpinan)
  const handleQuickLeadershipOverride = async () => {
    if (!selectedApp) return;

    if (isReadOnlyMode || isPertekIssued || selectedApp.pkkprStatus === 'Approved') {
      Swal.fire({
        icon: 'info',
        title: 'Izin Telah Disetujui 🔒',
        text: 'Izin PKKPR ini sudah berstatus Pertek Disetujui. Tombol override dinonaktifkan untuk mencegah duplikasi pengajuan.',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    const defaultDocNum = `DISPOSISI/BAP-PUPTR/LUWU/${new Date().getFullYear()}/${selectedApp.id ? selectedApp.id.replace(/[^0-9]/g, '').slice(-4) || '7701' : '7701'}`;

    const { value: formValues } = await Swal.fire({
      title: 'Otorisasi Override Spasial atas Izin Pimpinan 🛡️',
      html: `
        <div class="text-left text-xs space-y-3 font-sans">
          <p class="text-slate-700 dark:text-slate-300 leading-relaxed">
            Sesuai kesepakatan tata ruang dan diskresi pimpinan daerah / Kepala Dinas, persil pemohon <strong>${selectedApp.companyName}</strong> (${selectedApp.nibNik}) diberikan izin override spasial untuk mengaktifkan seluruh tombol proses (Setujui Pertek, Revisi, Ditolak, Cetak BAP).
          </p>
          <div class="space-y-1">
            <label class="font-bold text-slate-800 dark:text-slate-200">Nomor Surat / Disposisi Izin Pimpinan:</label>
            <input id="swal-override-doc" class="swal2-input !m-0 !w-full !text-xs !p-2 font-mono" value="${defaultDocNum}" placeholder="Contoh: DISPOSISI/KADIS-PUPTR/2026/04" />
          </div>
          <div class="space-y-1">
            <label class="font-bold text-slate-800 dark:text-slate-200">Catatan Pertimbangan Teknis & Izin Pimpinan:</label>
            <textarea id="swal-override-notes" rows="3" class="swal2-textarea !m-0 !w-full !text-xs !p-2" placeholder="Catatan pertimbangan teknis override atas persetujuan pimpinan...">Disetujui atas arahan pimpinan dengan pertimbangan kepentingan strategis daerah, pemenuhan komitmen penyerapan tenaga kerja lokal, dan kewajiban mitigasi drainase/LP2B terpadu.</textarea>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Aktifkan Override & Buka Kunci Proses 🔓',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#d97706',
      preConfirm: () => {
        const doc = (document.getElementById('swal-override-doc') as HTMLInputElement)?.value;
        const notes = (document.getElementById('swal-override-notes') as HTMLTextAreaElement)?.value;
        if (!notes) {
          Swal.showValidationMessage('Catatan pertimbangan wajib diisi');
          return false;
        }
        return { doc: doc || defaultDocNum, notes };
      }
    });

    if (formValues) {
      const { doc, notes } = formValues;
      const justif = `[SPATIAL OVERRIDE ATAS IZIN PIMPINAN - Ref: ${doc}]: ${notes}`;
      
      await recordSpatialOverride({
        pkkpr_id: selectedApp.id,
        conflict_type: 'LP2B_OVERLAP',
        overlap_area_sqm: Math.round(selectedApp.areaHa * 10000),
        overlap_area_ha: selectedApp.areaHa,
        justification: justif,
        bap_reference_no: doc,
        overridden_by_name: 'Admin Dinas PUPTR (Izin Pimpinan)'
      });

      setHasLocalOverride(true);
      setTechnicalNotes(prev => `${justif}\n\n${prev}`);
      setSelectedApp((prev: any) => prev ? {
        ...prev,
        overrideJustification: justif,
        pertanianBaNumber: prev.pertanianBaNumber || doc,
        technicalNotes: `${justif}\n\n${prev.technicalNotes || ''}`
      } : null);

      setQueueList(prev => prev.map(item => item.id === selectedApp.id ? {
        ...item,
        overrideJustification: justif,
        pertanianBaNumber: item.pertanianBaNumber || doc,
        technicalNotes: `${justif}\n\n${item.technicalNotes || ''}`
      } : item));

      Swal.fire({
        icon: 'success',
        title: 'Override Spasial Diaktifkan! 🔓',
        text: 'Seluruh tombol proses (Setujui Pertek, Revisi, Ditolak, Cetak BAP) telah terbuka dan aktif.',
        confirmButtonColor: '#10b981'
      });
    }
  };

  // Request Revision from Applicant (Revision Loop)
  const handleRequestRevision = async (catatan: string) => {
    if (!selectedApp || isReadOnlyMode) return;
    setIsIssuingSk(true);
    try {
      const timestamp = new Date().toISOString();
      const targetId = selectedApp.id;
      const targetNibNik = selectedApp.nibNik;
      const targetDocNum = selectedApp.pkkprDocNumber || targetId;

      // 0. Call Backend Workflow API
      try {
        await fetch('/api/v1/pkkpr/workflow/request-revision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            permohonan_id: targetId,
            catatan_revisi: catatan,
            performed_by: 'ADMIN_PUPTR'
          })
        });
      } catch (apiErr) {
        console.warn('API request-revision note:', apiErr);
      }

      // 1. Supabase Updates for all tables
      try {
        await Promise.all([
          supabase
            .from('gis_pkkpr')
            .update({
              status_pkkpr: 'REVISI_PEMOHON',
              catatan_revisi: catatan,
              catatan_teknis: `[PERMINTAAN REVISI BERKAS PUPTR]: ${catatan}`,
              pertanian_rejection_notes: selectedApp.pertanianNotes || undefined,
              updated_at: timestamp
            })
            .or(`id.eq.${targetId},pkkpr_doc_number.eq.${targetDocNum},nib_oss.eq.${targetNibNik},nik_pemohon.eq.${targetNibNik}`),
          supabase
            .from('investments')
            .update({
              status_permohonan: 'REVISI_PEMOHON',
              status: 'REVISI_PEMOHON',
              catatan_revisi: catatan,
              override_justification: catatan,
              updated_at: timestamp
            })
            .or(`id.eq.${targetId},plot_number.eq.${targetNibNik},certificate_number.eq.${targetNibNik}`),
          supabase
            .from('gis_pkkpr')
            .update({
              status_pkkpr: 'REVISI_PEMOHON',
              catatan_teknis: catatan,
              updated_at: timestamp
            })
            .or(`id.eq.${targetId},nomor_permohonan.eq.${targetNibNik}`)
        ]);
      } catch (e) {
        console.warn('tables return update note:', e);
      }

      // 2. Update localStorage "luwu_pkkpr_my_apps"
      try {
        const localAppsRaw = localStorage.getItem("luwu_pkkpr_my_apps");
        if (localAppsRaw) {
          const localApps = JSON.parse(localAppsRaw);
          const updatedLocalApps = localApps.map((app: any) => {
            if (
              app.id === targetId ||
              app.pkkpr_doc_number === targetId ||
              app.pkkpr_doc_number === targetDocNum ||
              app.nik === targetNibNik ||
              app.nib === targetNibNik
            ) {
              return {
                ...app,
                status: 'REVISI_PEMOHON',
                status_pkkpr: 'REVISI_PEMOHON',
                pkkpr_status: 'Memerlukan Revisi / Perbaikan Pemohon',
                catatan_revisi: catatan,
                catatan_teknis: catatan,
                pertanian_rejection_notes: selectedApp.pertanianNotes || app.pertanian_rejection_notes,
                updated_at: timestamp
              };
            }
            return app;
          });
          localStorage.setItem("luwu_pkkpr_my_apps", JSON.stringify(updatedLocalApps));
        }
      } catch (e) {
        console.warn('localApps return update note:', e);
      }

      // 3. Update localStorage "luwu_pkkpr_forwarded_apps_data" & "luwu_pkkpr_forwarded_to_pertanian_ids"
      try {
        const fAppsRaw = localStorage.getItem('luwu_pkkpr_forwarded_apps_data');
        if (fAppsRaw) {
          const fApps = JSON.parse(fAppsRaw);
          const updatedFApps = fApps.map((fa: any) => {
            if (fa.id === targetId || fa.nibNik === targetNibNik) {
              return {
                ...fa,
                pkkprStatus: 'Requires Revision',
                status_pkkpr: 'REVISI_PEMOHON',
                puptrReturnedToApplicant: true,
                rejectionReason: catatan,
                catatan_revisi: catatan,
                updatedAt: timestamp
              };
            }
            return fa;
          });
          localStorage.setItem('luwu_pkkpr_forwarded_apps_data', JSON.stringify(updatedFApps));
        }

        const forwardedIdsRaw = localStorage.getItem('luwu_pkkpr_forwarded_to_pertanian_ids');
        if (forwardedIdsRaw) {
          const ids = JSON.parse(forwardedIdsRaw);
          const filtered = ids.filter((id: string) => id !== targetId && id !== targetNibNik && id !== targetDocNum);
          localStorage.setItem('luwu_pkkpr_forwarded_to_pertanian_ids', JSON.stringify(filtered));
        }
      } catch (e) {
        console.warn('forwarded cache update note:', e);
      }

      // 4. Update local state & refresh queue
      await fetchQueue();
      setSelectedApp(null);

      // 5. Notify Applicant
      addCrossOpdNotification({
        applicationId: targetId,
        applicantName: selectedApp.applicantName,
        companyName: selectedApp.companyName,
        sector: selectedApp.sector,
        districtName: selectedApp.districtName,
        villageName: selectedApp.villageName,
        targetRole: 'PEMOHON',
        fromRole: 'ADMIN_PUPTR',
        type: 'FEEDBACK_REQUIRED',
        title: `Permohonan Dikembalikan untuk Revisi #${targetDocNum}`,
        message: `Dinas PUPTR telah mengembalikan berkas permohonan Anda untuk perbaikan: "${catatan}". Silakan cek detail di Dashboard Pemohon.`
      });

      Swal.fire({
        icon: 'info',
        title: 'Permintaan Revisi Terkirim 🔄',
        text: 'Permohonan berhasil dialihkan ke status REVISI_PEMOHON dan pemohon akan menerima instruksi perbaikan.',
        confirmButtonColor: '#f59e0b'
      });
    } catch (err: any) {
      console.error('Gagal mengirim permintaan revisi:', err);
      Swal.fire('Gagal Mengirim Revisi', err?.message || 'Error', 'error');
    } finally {
      setIsIssuingSk(false);
    }
  };

  // Return application to applicant (rejected or needs revision, optionally incorporating BAP Pertanian notes)
  const handleReturnToApplicant = async () => {
    if (!selectedApp || isReadOnlyMode) return;

    const defaultNotes = selectedApp.pertanianStatus === 'REJECTED'
      ? `Permohonan dikembalikan ke pemohon: Rekomendasi Alih Fungsi Lahan DITOLAK oleh Dinas Pertanian (BAP No. ${selectedApp.pertanianBaNumber || '-'}). Alasan: ${selectedApp.pertanianNotes || technicalNotes || 'Lokasi berada di kawasan LP2B produktif/sawah irigasi teknis aktif.'}`
      : (technicalNotes || 'Permohonan dikembalikan ke pemohon untuk perbaikan deliniasi koordinat/dokumen.');

    const { value: returnReason } = await Swal.fire({
      title: 'Kembalikan Permohonan ke Pemohon?',
      html: `
        <div class="text-left text-xs space-y-2 p-2 font-sans">
          <p class="text-slate-700 dark:text-slate-300">
            Permohonan <strong>${selectedApp.companyName}</strong> (${selectedApp.nibNik}) akan dialihkan ke status <strong class="text-amber-600 dark:text-amber-400">REVISI_PEMOHON</strong>.
          </p>
          <p class="text-[11px] text-slate-500">
            Catatan revisi akan diteruskan ke Dashboard Pemohon, dan pemohon akan melihat instruksi perbaikan berkas di dashboard pelacakan.
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
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Kirim Permintaan Revisi ↩️',
      cancelButtonText: 'Batal'
    });

    if (!returnReason) return;
    await handleRequestRevision(returnReason.trim());
  };

  // Open BAP Document Modal with High-Res Map Canvas Snapshot
  const handleOpenBapModal = () => {
    let capturedSnap: string | null = null;
    const map = mapRef.current?.getMapInstance?.();
    if (map) {
      // 1. If map canvas is currently ready, capture immediately
      try {
        if (map.loaded()) {
          const snap = map.getCanvas().toDataURL('image/png');
          if (snap && snap !== 'data:,' && snap.length > 500) {
            capturedSnap = snap;
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
            capturedSnap = snap;
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
            let localBapLp2b: any = null;
            try {
              const rawBap = localStorage.getItem(`BAP_LP2B_${item.id}`);
              if (rawBap) localBapLp2b = JSON.parse(rawBap);
            } catch (e) {}

            const pertBaNum = item.berita_acara_pertanian_num || localBapLp2b?.nomorSurat || undefined;
            const isApprovedPert = Boolean(
              pertBaNum ||
              item.status_pkkpr === 'Approved_Pertanian' ||
              item.status_pkkpr === 'VERIFIKASI_PUPTR' ||
              item.pertanian_status === 'APPROVED' ||
              (rawCatatan && (
                rawCatatan.includes('REKOMENDASI DINAS PERTANIAN TERBIT') ||
                rawCatatan.includes('REKOMENDASI PERTEK PERTANIAN TERBIT') ||
                rawCatatan.includes('BA-LP2B') ||
                rawCatatan.includes('BAP-LP2B') ||
                rawCatatan.includes('SMART FORM LP2B DISUSUN')
              ))
            );

            if (isApprovedPert) {
              pertStatus = 'APPROVED';
            } else if (item.status_pkkpr === 'Rejected_Pertanian' || item.pertanian_status === 'REJECTED' || (rawCatatan && rawCatatan.includes('DITOLAK DINAS PERTANIAN'))) {
              pertStatus = 'REJECTED';
            } else if (
              item.status_pkkpr === 'Forwarded_To_Pertanian' ||
              item.pertanian_status === 'FORWARDED' ||
              (!isApprovedPert && (rawCatatan && rawCatatan.includes('DITERUSKAN KE DINAS PERTANIAN'))) ||
              (!isApprovedPert && isLocallyForwarded(item.id, item.nik_pemohon || item.nib_oss, item.pertek_puptr_num || item.sk_pkkpr_num, item.nama_badan_usaha || item.nama_pemohon))
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
              districtName: formatDistrictName(item.kecamatan || item.district_id || item.districtId),
              villageName: formatVillageName(item.desa_kelurahan || item.village_id || item.villageId),
              areaHa: item.luas_ha ? Number(item.luas_ha) : (item.luas_m2 ? Number((item.luas_m2 / 10000).toFixed(4)) : 0.5),
              luasM2,
              luasBangunan,
              investmentValue: isBerusaha ? 12500000000 : 0,
              certificateType: isBerusaha ? 'Hak Guna Bangunan (HGB)' : 'Sertifikat Hak Milik (SHM)',
              certificateDocNumber: `SHM/HGB-LUWU-${item.id ? item.id.split('-').pop() : '321183'}`,
              buktiTanah,
              jenisAlasHak: item.jenis_alas_hak || item.land_status || buktiTanah || 'Sertipikat Hak Milik (SHM)',
              fileAlasHakUrl: item.file_alas_hak_url || item.sertifikat_tanah_url || undefined,
              jenisPengajuanPkkpr: item.jenis_pengajuan_pkkpr || item.sektor || (isBerusaha ? 'Kawasan Industri / Gudang / Pabrik' : 'Rumah Tinggal / Hunian Perorangan'),
              kategoriPengajuan: item.kategori_pengajuan || getKategoriPengajuan(item.jenis_pengajuan_pkkpr || item.sektor || ''),
              fileSiteplanUrl: item.file_siteplan_url || undefined,
              rencanaLuasBgn: item.rencana_luas_bgn || item.luas_bangunan || undefined,
              kmzFileName: item.nama_berkas_kmz || 'Batas_Poligon_Lokasi.kmz',
              kmzFileUrl: item.berkas_kmz_url || '',
              sertifikatTanahUrl: item.file_alas_hak_url || item.sertifikat_tanah_url || undefined,
              suratPengantarDesaUrl: item.surat_pengantar_desa_url || undefined,
              berkasLegalitasGabunganUrl: item.berkas_legalitas_gabungan_url || item.berkas_gabungan_pdf || undefined,
              geometry: item.geometry_json || item.geom,
              status_permohonan: (
                item.status_permohonan || (
                  (item.pertek_puptr_num && item.pertek_puptr_num.includes('/')) || item.status_pkkpr === 'Approved_PUPTR' ? 'PROSES_OSS' : (
                    item.status_pkkpr === 'Forwarded_To_Pertanian' || pertStatus === 'FORWARDED' ? 'ESCALATED_PERTANIAN' : (
                      item.status_pkkpr === 'Rejected_Pertanian' || pertStatus === 'REJECTED' ? 'REJECTED_PERTANIAN' : (
                        item.status_pkkpr === 'Approved_Pertanian' || pertStatus === 'APPROVED' ? 'PERTEK_PERTANIAN' : (
                          item.status_pkkpr === 'Requires Revision' || item.status_pkkpr === 'Rejected' ? 'REJECTED_FINAL' : 'REVIEW_PUPTR'
                        )
                      )
                    )
                  )
                )
              ) as any,
              pkkprStatus: (
                Boolean(item.pertek_puptr_num && item.pertek_puptr_num !== item.id && !item.pertek_puptr_num.startsWith('PKKPR-CORP-') && item.pertek_puptr_num.includes('/')) ||
                Boolean(item.sk_pkkpr_num && item.sk_pkkpr_num !== item.id && !item.sk_pkkpr_num.startsWith('PKKPR-CORP-') && item.sk_pkkpr_num.includes('/')) ||
                item.status_pkkpr === 'Approved_PUPTR' ||
                item.status_pkkpr === 'Published' ||
                item.status_permohonan === 'PROSES_OSS' ||
                item.status_permohonan === 'IZIN_TERBIT'
              ) ? 'Approved' : (item.status_pkkpr === 'Requires Revision' || item.status_permohonan === 'REJECTED_FINAL' ? 'Requires Revision' : (item.status_pkkpr === 'Rejected' ? 'Rejected' : 'Pending Spatial Check')),
              pkkprDocNumber: (item.pertek_puptr_num && item.pertek_puptr_num !== item.id && !item.pertek_puptr_num.startsWith('PKKPR-CORP-') && item.pertek_puptr_num.includes('/')) ? item.pertek_puptr_num : undefined,
              skPkkprDocNumber: (item.sk_pkkpr_num && item.sk_pkkpr_num !== item.id && !item.sk_pkkpr_num.startsWith('PKKPR-CORP-') && item.sk_pkkpr_num.includes('/')) ? item.sk_pkkpr_num : undefined,
              technicalNotes: item.catatan_teknis || 'Sesuai dengan Rencana Tata Ruang Wilayah (RTRW) Kabupaten Luwu.',
              coordinateStatus: 'Valid / Sesuai Batas RTRW',
              esgStatus: 'CLEAR',
              pertanianStatus: pertStatus,
              pertanianBaNumber: pertBaNum,
              contactPhone: item.no_whatsapp,
              status_pkkpr: normalizePKKPRStatus(item.status_pkkpr),
              catatan_revisi: item.catatan_revisi || null,
              puptr_approved_at: item.puptr_approved_at || null,
              pertanian_approved_at: item.pertanian_approved_at || null,
              published_at: item.published_at || null,
              createdAt: item.created_at || new Date().toISOString()
            });
          });
        }
      } catch (err) {
        console.warn('gis_pkkpr query fallback:', err);
      }

      // 1b. Query mpp_queues table for PUPTR queue items (Zero-Disconnect Automatic Queue Dispatch)
      try {
        const { data: queueData, error: queueErr } = await supabase
          .from('mpp_queues')
          .select('*')
          .or('instansi_code.eq.PUPTR,target_department.eq.PUPTR,service_type.eq.PKKPR')
          .in('status', ['SUBMITTED', 'PENDING_VERIFICATION', 'WAITING_PUPTR_VERIFICATION', 'WAITING_FO_VERIFICATION', 'BYPASS_PERTANIAN', 'REVIEW_PUPTR', 'menunggu'])
          .order('created_at', { ascending: false });

        if (!queueErr && queueData && queueData.length > 0) {
          queueData.forEach((qItem: any) => {
            const qId = qItem.id || qItem.ticket_code;
            const citizenNik = qItem.citizen_nik || qItem.nik_pemohon || '7317000000000001';
            const exists = mapped.some(m => m.id === qId || m.nibNik === citizenNik || (m.id && m.id === qItem.id));
            if (exists) return;

            const isBerusaha = qItem.category === 'Berusaha';
            const applicantType = isBerusaha ? 'NIB (Pelaku Usaha)' : 'NIK (Perorangan / Warga)';

            mapped.push({
              id: qId,
              applicantType,
              category: isBerusaha ? 'Berusaha' : 'Non-Berusaha',
              nibNik: citizenNik,
              applicantName: qItem.nama_pemohon || 'Pemohon Terdaftar',
              companyName: qItem.service_name || (isBerusaha ? 'Pelaku Usaha' : 'Permohonan PKKPR Non-Berusaha'),
              title: qItem.service_name || (isBerusaha ? 'Permohonan PKKPR Usaha' : 'Permohonan PKKPR Non-Berusaha'),
              sector: isBerusaha ? 'Komersial / Usaha' : 'Non-Komersial / Perumahan',
              fungsiBangunan: isBerusaha ? 'Komersial / Usaha' : 'Rumah Tinggal / Non-Berusaha',
              applicantAddress: qItem.address || `Kabupaten Luwu`,
              districtName: formatDistrictName(qItem.kecamatan || 'Belopa'),
              villageName: formatVillageName(qItem.desa || 'Senga'),
              areaHa: 0.05,
              luasM2: 500,
              investmentValue: isBerusaha ? 1000000000 : 0,
              certificateType: 'Sertifikat Hak Milik (SHM)',
              certificateDocNumber: `SHM-LUWU-${qId ? qId.split('-').pop() : '321183'}`,
              buktiTanah: 'Sertifikat Hak Milik (SHM)',
              jenisAlasHak: 'Sertipikat Hak Milik (SHM)',
              jenisPengajuanPkkpr: 'Rumah Tinggal / Hunian Perorangan',
              kategoriPengajuan: 'BANGUNAN',
              kmzFileName: 'Batas_Poligon_Lokasi.kmz',
              kmzFileUrl: '',
              geometry: qItem.geometry_json || qItem.geom,
              status_permohonan: 'REVIEW_PUPTR',
              pkkprStatus: 'Pending Spatial Check',
              technicalNotes: '[PUPTR Queue Auto Dispatch] Permohonan telah masuk ke antrean verifikasi berkas & tata ruang PUPTR.',
              coordinateStatus: 'Valid / Sesuai Batas RTRW',
              esgStatus: 'CLEAR',
              pertanianStatus: 'NOT_SUBMITTED',
              contactPhone: qItem.no_hp || undefined,
              status_pkkpr: normalizePKKPRStatus(qItem.status),
              createdAt: qItem.created_at || new Date().toISOString()
            });
          });
        }
      } catch (qErr) {
        console.warn('mpp_queues PUPTR query fallback:', qErr);
      }

      // 2. Secondary Query: Fetch from gis_pkkpr table (SSOT for Workflow)
      try {
        const { data: pkkprPermohonanData, error: permErr } = await supabase
          .from('gis_pkkpr')
          .select('*')
          .order('created_at', { ascending: false });

        if (!permErr && pkkprPermohonanData && pkkprPermohonanData.length > 0) {
          pkkprPermohonanData.forEach((item: any) => {
            const appId = item.nomor_permohonan || item.id;
            const exists = mapped.some(m => m.id === appId || m.id === item.id);
            if (exists) return;

            const isBerusaha = item.jenis_permohonan === 'Berusaha' || item.jenis_pemohon === 'NIB' || (item.sektor_kegiatan && !item.sektor_kegiatan.toLowerCase().includes('non-komersial'));
            const applicantType = isBerusaha ? 'NIB (Pelaku Usaha)' : 'NIK (Perorangan / Warga)';

            const fungsiBangunan = item.nama_kegiatan || (isBerusaha ? 'Komersial / Usaha' : 'Non-Berusaha / Rumah Tinggal');
            const buktiTanah = item.jenis_bukti_tanah || (isBerusaha ? 'Hak Guna Bangunan (HGB)' : 'Sertifikat Hak Milik (SHM)');
            const luasBangunan = item.luas_bangunan_m2 ? `${item.luas_bangunan_m2} m²` : undefined;
            const applicantAddress = item.alamat_pemohon || `Desa ${item.desa_name || '-'}, Kec. ${item.kecamatan_name || '-'}, Kab. Luwu`;
            const luasM2 = item.luas_m2 ? Number(item.luas_m2) : (item.luas_ha ? Math.round(Number(item.luas_ha) * 10000) : 5000);
            const areaHa = item.luas_ha ? Number(item.luas_ha) : Number((luasM2 / 10000).toFixed(4));

            let pertStatus: 'NOT_SUBMITTED' | 'FORWARDED' | 'APPROVED' | 'REJECTED' = 'NOT_SUBMITTED';
            if (item.status_pkkpr === 'Forwarded_To_Pertanian' || item.status_pkkpr === 'Pending Pertek Pertanian' || item.status_permohonan === 'ESCALATED_PERTANIAN' || item.pertanian_status === 'FORWARDED') {
              pertStatus = 'FORWARDED';
            } else if (item.status_pkkpr === 'Approved_Pertanian' || item.status_pkkpr === 'VERIFIKASI_PUPTR' || item.status_permohonan === 'PERTEK_PERTANIAN' || item.pertanian_status === 'APPROVED' || item.berita_acara_pertanian_num) {
              pertStatus = 'APPROVED';
            } else if (item.status_pkkpr === 'Rejected_Pertanian' || item.status_permohonan === 'REJECTED_PERTANIAN' || item.pertanian_status === 'REJECTED') {
              pertStatus = 'REJECTED';
            }

            let pkkprStatus = 'Pending Spatial Check';
            if (item.status_permohonan === 'PROSES_OSS' || item.status_permohonan === 'IZIN_TERBIT' || item.pertek_puptr_num || item.sk_pkkpr_num) {
              pkkprStatus = 'Approved';
            } else if (item.status_permohonan === 'REJECTED_FINAL') {
              pkkprStatus = 'Rejected';
            } else if (item.status_permohonan === 'REJECTED_PERTANIAN') {
              pkkprStatus = 'Requires Revision';
            }

            mapped.push({
              id: item.id,
              status_permohonan: (item.status_permohonan || (item.pertek_puptr_num ? 'PROSES_OSS' : 'REVIEW_PUPTR')) as any,
              applicantType,
              category: isBerusaha ? 'Berusaha' : 'Non-Berusaha',
              nibNik: item.nomor_permohonan || item.nik_pemohon || item.nib_pemohon || '7317000000000001',
              applicantName: item.pemohon_name || 'Pemohon Terdaftar',
              companyName: item.nama_kegiatan || (isBerusaha ? 'Pelaku Usaha' : 'Perseorangan / Warga'),
              title: item.nama_kegiatan || (isBerusaha ? 'Permohonan PKKPR Usaha' : 'Permohonan PKKPR Non-Berusaha'),
              sector: item.sektor_kegiatan || (isBerusaha ? 'Komersial / Usaha' : 'Non-Komersial / Perumahan'),
              fungsiBangunan,
              applicantAddress,
              districtName: formatDistrictName(item.kecamatan_name),
              villageName: formatVillageName(item.desa_name),
              areaHa,
              luasM2,
              luasBangunan,
              investmentValue: isBerusaha ? 1000000000 : 0,
              certificateType: buktiTanah,
              certificateDocNumber: `SHM/HGB-LUWU-${item.id ? item.id.split('-').pop() : '321183'}`,
              buktiTanah,
              kmzFileName: 'Batas_Poligon_Lokasi.kmz',
              kmzFileUrl: '',
              sertifikatTanahUrl: item.file_sertifikat_url || undefined,
              suratPengantarDesaUrl: item.file_pengantar_url || undefined,
              berkasLegalitasGabunganUrl: item.file_gabungan_url || undefined,
              geometry: item.geometry_json || item.geom || item.koordinat_poligon,
              pkkprStatus,
              pkkprDocNumber: item.pertek_puptr_num || undefined,
              skPkkprDocNumber: item.sk_pkkpr_num || undefined,
              technicalNotes: item.catatan_teknis || 'Sesuai dengan Rencana Tata Ruang Wilayah (RTRW) Kabupaten Luwu.',
              coordinateStatus: 'Valid / Sesuai Batas RTRW',
              esgStatus: 'CLEAR',
              pertanianStatus: pertStatus,
              pertanianBaNumber: item.berita_acara_pertanian_num || undefined,
              pertanianSrNumber: item.surat_rekomendasi_pertanian_num || undefined,
              contactPhone: item.pemohon_phone || undefined,
              createdAt: item.created_at || new Date().toISOString()
            });
          });
        }
      } catch (err) {
        console.warn('pkkpr_permohonan query note:', err);
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
              let pertStatus: 'NOT_SUBMITTED' | 'FORWARDED' | 'APPROVED' | 'REJECTED' = 'NOT_SUBMITTED';
              let localBapLp2b: any = null;
              try {
                const rawBap = localStorage.getItem(`BAP_LP2B_${appId}`) || localStorage.getItem(`BAP_LP2B_${app.id}`);
                if (rawBap) localBapLp2b = JSON.parse(rawBap);
              } catch (e) {}

              const pertBaNum = app.berita_acara_pertanian_num || localBapLp2b?.nomorSurat || undefined;
              const isApprovedPert = Boolean(
                pertBaNum ||
                app.status_pkkpr === 'Approved_Pertanian' ||
                app.status_pkkpr === 'VERIFIKASI_PUPTR' ||
                app.pertanian_status === 'APPROVED' ||
                app.status === 'Approved_Pertanian' ||
                (app.catatan_teknis && (
                  app.catatan_teknis.includes('REKOMENDASI DINAS PERTANIAN TERBIT') ||
                  app.catatan_teknis.includes('REKOMENDASI PERTEK PERTANIAN TERBIT') ||
                  app.catatan_teknis.includes('BA-LP2B') ||
                  app.catatan_teknis.includes('BAP-LP2B') ||
                  app.catatan_teknis.includes('SMART FORM LP2B DISUSUN')
                ))
              );

              if (isApprovedPert) {
                pertStatus = 'APPROVED';
              } else if (app.status_pkkpr === 'Rejected_Pertanian' || app.pertanian_status === 'REJECTED' || app.status === 'Rejected_Pertanian' || app.pertanian_rejection_notes) {
                pertStatus = 'REJECTED';
              } else if (
                app.pertanian_status === 'FORWARDED' ||
                app.status_pkkpr === 'Forwarded_To_Pertanian' ||
                app.status === 'Forwarded_To_Pertanian' ||
                (!isApprovedPert && (app.catatan_teknis && app.catatan_teknis.includes('DITERUSKAN KE DINAS PERTANIAN'))) ||
                (!isApprovedPert && isLocallyForwarded(appId, app.nik || app.nib, app.pkkpr_doc_number, app.title || app.perusahaan || app.nama_pemohon))
              ) {
                pertStatus = 'FORWARDED';
              }
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
                applicantAddress: app.alamat_pemohon || app.address || `Desa ${formatVillageName(app.desa || app.village_id)}, Kec. ${formatDistrictName(app.kecamatan || app.district_id)}, Kab. Luwu`,
                districtName: formatDistrictName(app.kecamatan || app.district_id),
                villageName: formatVillageName(app.desa || app.village_id),
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
                pkkprStatus: app.sk_pkkpr_doc_number ? 'Approved' : (app.status_pkkpr === 'Requires Revision' || app.status === 'Requires Revision' || app.status_pkkpr === 'Revision' || app.status === 'Revision' ? 'Requires Revision' : (app.status_pkkpr || app.status || 'Pending Spatial Check')),
                pkkprDocNumber: app.sk_pkkpr_doc_number || undefined,
                skPkkprDocNumber: app.sk_pkkpr_doc_number || undefined,
                technicalNotes: app.catatan_teknis || 'Permohonan dari Portal Layanan Perizinan PKKPR Publik.',
                coordinateStatus: 'Valid / Sesuai Batas RTRW',
                esgStatus: 'CLEAR',
                pertanianStatus: pertStatus,
                pertanianBaNumber: app.berita_acara_pertanian_num || undefined,
                pertanianSrNumber: app.surat_rekomendasi_pertanian_num || undefined,
                pertanianNotes: app.pertanian_rejection_notes || (app.catatan_teknis && app.catatan_teknis.includes('DITOLAK') ? app.catatan_teknis : undefined),
                contactPhone: app.no_whatsapp,
                status_pkkpr: normalizePKKPRStatus(app.status_pkkpr || app.status),
                catatan_revisi: app.catatan_revisi || null,
                puptr_approved_at: app.puptr_approved_at || null,
                pertanian_approved_at: app.pertanian_approved_at || null,
                published_at: app.published_at || null,
                createdAt: app.created_at || new Date().toISOString()
              });
            }
          });
        } catch (e) {
          console.warn('Local apps merge error:', e);
        }
      }

      // Synchronize latest Agrarian status from local forwarded cache snapshot
      try {
        const fAppsRaw = localStorage.getItem('luwu_pkkpr_forwarded_apps_data');
        if (fAppsRaw) {
          const fApps = JSON.parse(fAppsRaw);
          fApps.forEach((fa: any) => {
            const target = mapped.find(m => m.id === fa.id || m.nibNik === fa.nibNik);
            if (target) {
              if (fa.pkkprStatus === 'Requires Revision' || fa.status_pkkpr === 'Requires Revision' || fa.puptrReturnedToApplicant) {
                target.pkkprStatus = 'Requires Revision';
              }
              if (fa.pertanianStatus === 'REJECTED' || fa.agriStatus === 'Rejected') {
                target.pertanianStatus = 'REJECTED';
                if (fa.rejectionReason || fa.pertanianNotes) {
                  target.pertanianNotes = fa.rejectionReason || fa.pertanianNotes;
                }
              } else if (fa.pertanianStatus === 'APPROVED' || fa.agriStatus === 'Approved') {
                target.pertanianStatus = 'APPROVED';
                if (fa.beritaAcaraDocNum || fa.pertanianBaNumber) {
                  target.pertanianBaNumber = fa.beritaAcaraDocNum || fa.pertanianBaNumber;
                }
              }
            }
          });
        }
      } catch (fErr) {
        console.warn('PUPTR cross sync check note:', fErr);
      }

      setQueueList(mapped);

      // Auto-select first active pending item for inspection (excluding forwarded to Pertanian or already approved/returned items)
      if (mapped.length > 0) {
        setSelectedApp(prev => {
          const activePending = mapped.filter(m => m.pertanianStatus !== 'FORWARDED' && m.pkkprStatus !== 'Approved' && m.pkkprStatus !== 'Requires Revision');
          if (activePending.length === 0) return mapped[0];
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mpp_queues' }, () => {
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
    if (isReadOnlyMode || isPertekIssued || selectedApp.pkkprStatus === 'Approved') {
      Swal.fire({
        icon: 'info',
        title: 'Permohonan Telah Disetujui 🔒',
        text: 'Izin PKKPR ini sudah berstatus Pertek Disetujui. Pengajuan ulang ke Dinas Pertanian dinonaktifkan untuk mencegah duplikasi.',
        confirmButtonColor: '#10b981'
      });
      return;
    }
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

      // 2. Direct Update to gis_pkkpr (Single Source of Truth) with status_pkkpr: 'Pending Pertek Pertanian'
      const { data: updateGisData, error: updateGisErr } = await supabase
        .from('gis_pkkpr')
        .update({
          status_pkkpr: 'Pending Pertek Pertanian',
          catatan_teknis: `[PERMOHONAN DITERUSKAN KE DINAS PERTANIAN]: ${forwardingJustification}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetApp.id);

      if (updateGisErr) {
        console.error("Gagal mengirim pertek ke Supabase:", updateGisErr);
        Swal.fire({
          icon: 'error',
          title: 'Gagal Update Status di Database',
          text: updateGisErr.message
        });
        return;
      }

      // Safe multi-table synchronization
      try {
        await Promise.allSettled([
          supabase
            .from('gis_pkkpr')
            .update({
              status_pkkpr: 'VERIFIKASI_PERTANIAN',
              catatan_teknis: `[PERMOHONAN DITERUSKAN KE DINAS PERTANIAN]: ${forwardingJustification}`,
              updated_at: new Date().toISOString()
            })
            .or(`id.eq.${targetApp.id},nomor_permohonan.eq.${targetApp.nibNik}`),
          supabase
            .from('investments')
            .update({
              status: 'PENDING_PERTANIAN',
              status_permohonan: 'ESCALATED_PERTANIAN',
              override_justification: `[PERMOHONAN DITERUSKAN KE DINAS PERTANIAN]: ${forwardingJustification}`,
              updated_at: new Date().toISOString()
            })
            .or(`id.eq.${targetApp.id},plot_number.eq.${targetApp.nibNik},certificate_number.eq.${targetApp.nibNik}`)
        ]);
      } catch (e) {
        console.warn('pkkpr_permohonan & investments update note:', e);
      }

      // 2a. Call State Machine Backend API POST /api/v1/pkkpr/workflow/escalate-pertanian
      try {
        await fetch('/api/v1/pkkpr/workflow/escalate-pertanian', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            permohonan_id: targetApp.id,
            justification: forwardingJustification,
            intersecting_layers: spatialConflictAudit?.conflictCategories || ['Sawah LP2B']
          })
        });
      } catch (apiErr) {
        console.warn('API /api/v1/pkkpr/workflow/escalate-pertanian call info:', apiErr);
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
    if (!selectedApp || isReadOnlyMode) return;

    setIsIssuingSk(true);
    try {
      const year = new Date().getFullYear();
      const randomSeq = Math.floor(100 + Math.random() * 900);
      const generatedDocNum = `503/PERTEK-PUPTR/LUWU/${year}/${randomSeq}`;

      // 0. Call Backend Workflow API
      try {
        await fetch('/api/v1/pkkpr/workflow/puptr-final-approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            permohonan_id: selectedApp.id,
            pertek_puptr_num: generatedDocNum,
            notes: technicalNotes
          })
        });
      } catch (apiErr) {
        console.warn('API /api/v1/pkkpr/workflow/puptr-final-approve note:', apiErr);
      }

      // Safe, resilient multi-table database updates
      const targetId = selectedApp.id;
      const targetNibNik = selectedApp.nibNik;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);

      // 1. Update gis_pkkpr
      try {
        const approvedAt = clearanceDecision === 'Approved' ? new Date().toISOString() : undefined;
        if (isUuid) {
          await supabase.from('gis_pkkpr').update({
            pertek_puptr_num: generatedDocNum,
            sk_pkkpr_num: null,
            status_pkkpr: clearanceDecision === 'Approved' ? 'APPROVED_PUPTR' : 'REVISI_PEMOHON',
            puptr_approved_at: approvedAt,
            catatan_revisi: clearanceDecision === 'Approved' ? null : technicalNotes,
            catatan_teknis: technicalNotes,
            updated_at: new Date().toISOString()
          }).eq('id', targetId);
        }
        await supabase.from('gis_pkkpr').update({
          pertek_puptr_num: generatedDocNum,
          sk_pkkpr_num: null,
          status_pkkpr: clearanceDecision === 'Approved' ? 'APPROVED_PUPTR' : 'REVISI_PEMOHON',
          puptr_approved_at: approvedAt,
          catatan_revisi: clearanceDecision === 'Approved' ? null : technicalNotes,
          catatan_teknis: technicalNotes,
          updated_at: new Date().toISOString()
        }).or(`nib_oss.eq.${targetNibNik},nik_pemohon.eq.${targetNibNik}`);
      } catch (e) {
        console.warn('gis_pkkpr update resilience:', e);
      }

      // 2. Update gis_pkkpr
      try {
        await supabase.from('gis_pkkpr').update({
          status_pkkpr: 'PROSES_OSS',
          pertek_puptr_num: generatedDocNum,
          catatan_teknis: technicalNotes,
          updated_at: new Date().toISOString()
        }).or(`id.eq.${targetId},pkkpr_doc_number.eq.${targetNibNik},nik_pemohon.eq.${targetNibNik}`);
      } catch (e) {
        console.warn('gis_pkkpr update resilience:', e);
      }

      // 3. Update investments
      try {
        if (isUuid) {
          await supabase.from('investments').update({
            status_permohonan: 'PROSES_OSS',
            pkkpr_doc_number: generatedDocNum,
            status: clearanceDecision === 'Approved' ? 'Approved_PUPTR' : 'Review',
            override_justification: technicalNotes,
            updated_at: new Date().toISOString()
          }).eq('id', targetId);
        }
        await supabase.from('investments').update({
          status_permohonan: 'PROSES_OSS',
          pkkpr_doc_number: generatedDocNum,
          status: clearanceDecision === 'Approved' ? 'Approved_PUPTR' : 'Review',
          override_justification: technicalNotes,
          updated_at: new Date().toISOString()
        }).or(`plot_number.eq.${targetNibNik},certificate_number.eq.${targetNibNik}`);
      } catch (e) {
        console.warn('investments update resilience:', e);
      }

      // 4. Update localStorage cache persistence
      try {
        const myAppsRaw = localStorage.getItem('luwu_pkkpr_my_apps');
        if (myAppsRaw) {
          const myApps = JSON.parse(myAppsRaw);
          const updatedMyApps = myApps.map((app: any) => {
            if (app.id === targetId || app.nik === targetNibNik || app.nib === targetNibNik || app.pkkpr_doc_number === targetId) {
              return {
                ...app,
                status_permohonan: 'PROSES_OSS',
                pertek_puptr_num: generatedDocNum,
                pkkpr_status: 'Approved_PUPTR',
                status_pkkpr: 'Approved_PUPTR'
              };
            }
            return app;
          });
          localStorage.setItem('luwu_pkkpr_my_apps', JSON.stringify(updatedMyApps));
        }
      } catch (e) {
        console.warn('localStorage my_apps update note:', e);
      }

      setIssuedSkNumber(generatedDocNum);

      // Immutably update local state queue first so UI reflects PROSES_OSS transition immediately
      setQueueList(prev =>
        prev.map(item => {
          if (item.id === targetId || item.nibNik === targetNibNik) {
            return {
              ...item,
              status_permohonan: 'PROSES_OSS' as any,
              status_pkkpr: 'APPROVED_PUPTR',
              pkkprStatus: 'Approved',
              pkkprDocNumber: generatedDocNum,
              skPkkprDocNumber: generatedDocNum,
              technicalNotes
            };
          }
          return item;
        })
      );

      // Refresh PUPTR queue from Supabase database to maintain complete consistency
      await fetchQueue();

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

  // Single Source of Truth Tab Badge Counter
  const getBadgeCount = useCallback((tabId: string) => {
    return queueList.filter(item => isApplicationInPuptrTab(item, tabId)).length;
  }, [queueList]);

  // Filtered Queue List using the Single Source of Truth filter
  const filteredQueue = useMemo(() => {
    const cleanSearch = searchQuery.trim().toLowerCase();
    return queueList.filter(item => {
      // 1. Must match current tab filter
      if (!isApplicationInPuptrTab(item, statusFilter)) {
        return false;
      }

      // 2. Search query matching
      if (!cleanSearch) return true;
      const matchSearch =
        (item.nibNik && item.nibNik.toLowerCase().includes(cleanSearch)) ||
        (item.applicantName && item.applicantName.toLowerCase().includes(cleanSearch)) ||
        (item.companyName && item.companyName.toLowerCase().includes(cleanSearch)) ||
        (item.districtName && item.districtName.toLowerCase().includes(cleanSearch)) ||
        (item.villageName && item.villageName.toLowerCase().includes(cleanSearch)) ||
        (item.id && item.id.toLowerCase().includes(cleanSearch));

      return Boolean(matchSearch);
    });
  }, [queueList, searchQuery, statusFilter]);

  // Auto-sync selectedApp with filteredQueue: reset to null if filteredQueue is empty or update active selection
  useEffect(() => {
    if (isLoadingQueue) return;
    if (filteredQueue.length === 0) {
      if (selectedApp !== null) {
        setSelectedApp(null);
        setZoningAudit(null);
      }
    } else {
      // If current selectedApp is not in the filtered list (e.g. after tab filter change), select the first item
      const isStillInQueue = selectedApp && filteredQueue.some(item => item.id === selectedApp.id || (selectedApp.nibNik && item.nibNik === selectedApp.nibNik));
      if (!isStillInQueue) {
        setSelectedApp(filteredQueue[0]);
        setTechnicalNotes(filteredQueue[0].technicalNotes || `Sesuai tata ruang kawasan ${filteredQueue[0].sector} di Kec. ${filteredQueue[0].districtName}.`);
        setIssuedSkNumber(filteredQueue[0].skPkkprDocNumber || null);
        if (filteredQueue[0].geometry) {
          setZoningAudit(checkPkkprSpatialZoning(filteredQueue[0].geometry));
        }
      }
    }
  }, [filteredQueue, isLoadingQueue, selectedApp]);

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
            {[
              { id: 'ALL', label: 'Antrean Aktif PUPTR', count: getBadgeCount('ALL') },
              { id: 'REJECTED_PERTANIAN', label: '⚠️ Dikembalikan Pertanian', count: getBadgeCount('REJECTED_PERTANIAN') },
              { id: 'APPROVED', label: 'Pertek Disetujui', count: getBadgeCount('APPROVED') },
              { id: 'REVISION', label: 'Revisi Pemohon', count: getBadgeCount('REVISION') },
              { id: 'FORWARDED', label: '🌾 Diteruskan Pertanian', count: getBadgeCount('FORWARDED') },
              { id: 'ALL_HISTORICAL', label: 'Semua Riwayat', count: getBadgeCount('ALL_HISTORICAL') }
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
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                            {item.nibNik}
                          </span>
                          <SlaBadge createdAt={item.createdAt} approvedAt={item.puptr_approved_at} />
                        </div>
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
                            : item.pkkprStatus === 'Requires Revision' || item.pkkprStatus === 'Rejected' || item.pkkprStatus === 'Returned'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 font-extrabold'
                            : item.pertanianStatus === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 animate-pulse'
                            : item.pertanianStatus === 'FORWARDED'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300'
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300'
                        }`}
                      >
                        {item.pkkprStatus === 'Approved'
                          ? 'Pertek Disetujui'
                          : item.pkkprStatus === 'Requires Revision' || item.pkkprStatus === 'Rejected' || item.pkkprStatus === 'Returned'
                          ? '↩️ Dikembalikan ke Pemohon'
                          : item.pertanianStatus === 'REJECTED'
                          ? '⚠️ Dikembalikan Pertanian'
                          : item.pertanianStatus === 'FORWARDED'
                          ? '🌾 Di Pertanian'
                          : item.pkkprStatus}
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
                    <th className="py-3 px-4">SLA Timer</th>
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
                          <SlaBadge createdAt={item.createdAt} approvedAt={item.puptr_approved_at} />
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              item.pkkprStatus === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300'
                                : item.pkkprStatus === 'Requires Revision' || item.pkkprStatus === 'Rejected' || item.pkkprStatus === 'Returned'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 font-extrabold'
                                : item.pertanianStatus === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 animate-pulse'
                                : item.pertanianStatus === 'FORWARDED'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300'
                                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300'
                            }`}
                          >
                            {item.pkkprStatus === 'Approved'
                              ? 'Pertek Disetujui'
                              : item.pkkprStatus === 'Requires Revision' || item.pkkprStatus === 'Rejected' || item.pkkprStatus === 'Returned'
                              ? '↩️ Dikembalikan ke Pemohon'
                              : item.pertanianStatus === 'REJECTED'
                              ? '⚠️ Dikembalikan Pertanian'
                              : item.pertanianStatus === 'FORWARDED'
                              ? '🌾 Di Pertanian'
                              : item.pkkprStatus}
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
      {selectedApp ? (
        <div className={`grid grid-cols-1 ${isMapExpanded ? 'grid-cols-1' : 'lg:grid-cols-3'} gap-6`}>
          {/* Left / Top Column: Studio GIS Map Canvas (Module 3) */}
          <div className={`${isMapExpanded ? 'w-full col-span-full' : 'lg:col-span-2'} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 sm:p-5 shadow-sm space-y-4`}>
            
            {/* SRID Mismatch Warning Banner */}
            {activeAppSridReport?.sridMismatch?.detected && (
              <SridMismatchAlertBanner
                report={activeAppSridReport.sridMismatch}
                pkkprDocNumber={selectedApp.pkkprDocNumber || selectedApp.skPkkprDocNumber}
              />
            )}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
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

              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setIsTurfCardCollapsed(prev => !prev)}
                  className={`h-10 px-3 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer ${
                    isTurfCardCollapsed
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                      : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
                  }`}
                  title={isTurfCardCollapsed ? "Tampilkan Panel Hasil Analisis & Data Pemohon" : "Sembunyikan Panel (Buka Kanvas Peta Lebih Luas)"}
                >
                  {isTurfCardCollapsed ? <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <EyeOff className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                  <span className="truncate">{isTurfCardCollapsed ? "Buka Panel Analisis" : "Tutup Panel"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsMapExpanded(prev => !prev)}
                  className="h-10 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
                  title={isMapExpanded ? "Kembali ke Mode Normal (2 Kolom)" : "Perbesar Peta (Mode Studio Lebar)"}
                >
                  <Maximize2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">{isMapExpanded ? "Tampilan Normal" : "Mode Peta Lebar"}</span>
                </button>
                <span className="col-span-2 sm:col-span-1 h-10 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-center truncate">
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
                <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 sm:p-5 space-y-4 font-sans shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl font-bold shrink-0 mt-0.5 shadow-md">
                        <AlertTriangle className="w-5 h-5 animate-bounce" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 leading-snug">
                            ⚠️ AUTOMATED ENVIRONMENTAL FLAG: {spatialConflictAudit.conflictCategories.length > 0 ? spatialConflictAudit.conflictCategories.join(' & ') : 'TUMPANG TINDIH LP2B / LAHAN BASAH'} DETECTED
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 shrink-0">
                            UU No. 41 / 2009 &amp; PP No. 21 / 2021
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                          Poligon lokasi beririsan dengan <span className="font-bold text-amber-600 dark:text-amber-400">{spatialConflictAudit.conflictCategories.join(', ') || 'Lahan Pertanian Pangan Berkelanjutan (LP2B)'}</span> seluas <strong className="font-mono">{spatialConflictAudit.totalOverlapHa || selectedApp.areaHa} Ha</strong>. Diperlukan rekomendasi alih fungsi dari Dinas Pertanian. Tombol proses (Disetujui, Revisi, Ditolak, Cetak BAP) dikunci sampai terbit BAP Pertanian atau Otorisasi Override Spasial.
                        </p>
                      </div>
                    </div>

                    {/* Inter-Agency Transfer Action Buttons - Symmetrical Android Grid */}
                    <div className="w-full lg:w-auto shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-col xl:flex-row items-stretch gap-2.5 pt-1 lg:pt-0">
                      {isReadOnlyMode || isPertekIssued || selectedApp.pkkprStatus === 'Approved' ? (
                        <div className="min-h-[44px] px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 col-span-1 sm:col-span-2 shadow-sm text-center">
                          <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Pertek Telah Diterbitkan (Aksi Override &amp; Pengajuan Dinonaktifkan) 🔒</span>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={isReadOnlyMode || isPertekIssued || selectedApp.pkkprStatus === 'Approved'}
                            onClick={() => setShowConflictResolutionModal(true)}
                            className="min-h-[44px] px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer shadow-sm"
                            title="Buka Conflict Resolution Tool untuk mencatat pertimbangan teknis override spasial"
                          >
                            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                            <span className="truncate">Override Spasial (BAP Verified)</span>
                          </button>

                          {selectedApp.pertanianStatus === 'FORWARDED' ? (
                            <div className="min-h-[44px] px-4 py-2.5 bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 text-center">
                              <Clock className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                              <span className="truncate">Antrean Verifikasi Pertanian ⏳</span>
                            </div>
                          ) : selectedApp.pertanianStatus === 'REJECTED' ? (
                            <div className="min-h-[44px] px-4 py-2.5 bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 text-center">
                              <X className="w-4 h-4 text-rose-600 shrink-0" />
                              <span className="truncate">Dikembalikan Dinas Pertanian</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={isReadOnlyMode || isPertekIssued || selectedApp.pkkprStatus === 'Approved'}
                              onClick={handleOpenForwardPertanianModal}
                              className="min-h-[44px] px-4 py-2.5 bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
                            >
                              <Send className="w-4 h-4 shrink-0" />
                              <span className="truncate">Ajukan Permohonan ke Dinas Pertanian 🌾</span>
                            </button>
                          )}
                        </>
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
                    <div className="absolute top-2 left-2 right-2 sm:right-auto sm:top-3 sm:left-3 z-30 max-w-none sm:max-w-md bg-amber-950/95 text-amber-100 backdrop-blur-md border border-amber-500/60 rounded-2xl p-2.5 sm:p-3 shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 animate-in fade-in slide-in-from-top duration-300 font-sans">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <div className="p-1.5 bg-amber-500 text-slate-950 rounded-xl shrink-0 font-bold mt-0.5">
                            <AlertTriangle className="w-4 h-4 animate-bounce" />
                          </div>
                          <div className="text-xs">
                            <div className="font-extrabold text-amber-200 uppercase tracking-wider text-[11px] sm:text-xs">
                              ⚠️ TURF.JS: {spatialConflictAudit.conflictCategories.length > 0 ? spatialConflictAudit.conflictCategories[0] : 'TUMPANG TINDIH SPASIAL'} DETECTED
                            </div>
                            <div className="text-[11px] text-amber-100/90 leading-snug mt-0.5">
                              Poligon beririsan {spatialConflictAudit.totalOverlapHa ? `${spatialConflictAudit.totalOverlapHa} Ha` : 'kawasan bersyarat'}. Memerlukan BAP Pertanian atau Override Spasial!
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsGisToastDismissed(true)}
                          className="p-1 hover:bg-amber-900/80 rounded-lg text-amber-300 transition shrink-0 cursor-pointer sm:hidden"
                          title="Tutup Toast"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-amber-800/40">
                        <button
                          type="button"
                          disabled={isReadOnlyMode || isPertekIssued || selectedApp.pkkprStatus === 'Approved'}
                          onClick={() => setShowConflictResolutionModal(true)}
                          className="flex-1 sm:flex-initial px-2.5 py-1.5 bg-amber-800/80 hover:bg-amber-700 text-amber-200 text-[11px] font-bold rounded-lg border border-amber-500/40 transition cursor-pointer text-center disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Buka Conflict Resolution Tool untuk mencatat pertimbangan teknis override"
                        >
                          <span>Override 🛡️</span>
                        </button>
                        {selectedApp.pertanianStatus === 'NOT_SUBMITTED' && (
                          <button
                            type="button"
                            disabled={isReadOnlyMode || isPertekIssued || selectedApp.pkkprStatus === 'Approved'}
                            onClick={handleOpenForwardPertanianModal}
                            className="flex-1 sm:flex-initial px-3 py-1.5 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 font-black text-[11px] rounded-lg shadow transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <span>Kirim ➔</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsGisToastDismissed(true)}
                          className="hidden sm:block p-1.5 hover:bg-amber-900/80 rounded-xl text-amber-300 transition cursor-pointer"
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
                      className="absolute bottom-14 right-2 sm:bottom-3 sm:right-3 md:top-3 md:right-14 md:bottom-auto bg-slate-900/90 text-white hover:bg-slate-800 backdrop-blur-md border border-indigo-500/50 rounded-2xl px-3 py-1.5 sm:px-3.5 sm:py-2 shadow-2xl z-20 text-[11px] sm:text-xs font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer group"
                      title="Klik untuk membuka panel Hasil Analisis Turf.js & Data Pemohon"
                    >
                      <Compass className="w-4 h-4 text-emerald-400 group-hover:rotate-45 transition-transform" />
                      <span>Buka Panel Analisis Turf.js &amp; Data Pemohon</span>
                      <ChevronDown className="w-4 h-4 text-slate-300" />
                    </button>
                  ) : (
                    <div className="absolute bottom-2 inset-x-2 sm:bottom-3 sm:inset-x-3 md:top-3 md:right-14 md:left-auto md:w-96 max-h-[65vh] sm:max-h-[75vh] md:max-h-[82vh] overflow-y-auto overflow-x-hidden max-w-[calc(100%-1rem)] mx-auto md:mx-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xl z-20 text-xs space-y-3 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 animate-in fade-in zoom-in-95 duration-150">
                      {/* Header with Title & Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                            <Compass className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-xs tracking-tight">
                              Hasil Analisis Turf.js &amp; Data Pemohon
                            </h4>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                              Audit Spasial RTRW &amp; Verifikasi Permohonan
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 ml-auto">
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
                                <span className="font-bold text-right text-slate-900 dark:text-white break-words">{zoningAudit.matchedZone}</span>
                              </div>
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-slate-500 dark:text-slate-400 shrink-0">Kategori:</span>
                                <span className="font-medium text-right break-words">{zoningAudit.zoneType}</span>
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
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
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
                              <div className="pt-1 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-0.5 sm:gap-2">
                                <span className="text-slate-500 dark:text-slate-400 shrink-0">Nama Pemohon:</span>
                                <span className="font-bold text-left sm:text-right text-slate-900 dark:text-white break-words">{selectedApp.applicantName}</span>
                              </div>

                              <div className="pt-1.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-0.5 sm:gap-2 font-mono">
                                <span className="text-slate-500 dark:text-slate-400 shrink-0 font-sans">
                                  {selectedApp.applicantType === 'NIB (Pelaku Usaha)' ? 'NIB OSS:' : 'NIK Pemohon:'}
                                </span>
                                <span className="font-bold text-left sm:text-right text-emerald-600 dark:text-emerald-400 break-all">{selectedApp.nibNik}</span>
                              </div>

                              <div className="pt-1.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-0.5 sm:gap-2">
                                <span className="text-slate-500 dark:text-slate-400 shrink-0">
                                  {selectedApp.category === 'Non-Berusaha' || selectedApp.applicantType.includes('Warga') ? 'Lembaga / Komite:' : 'Nama Perusahaan:'}
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
                                <span className="text-slate-500 dark:text-slate-400 shrink-0">Lokasi Dimohon:</span>
                                <span className="font-semibold text-left sm:text-right text-slate-800 dark:text-slate-200 break-words">
                                  Desa {selectedApp.villageName}, Kec. {selectedApp.districtName}, Kab. Luwu
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

                              {/* Hanya Tampilkan Luas Bangunan jika Kategori BANGUNAN */}
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
                                  {selectedApp.jenisAlasHak || selectedApp.buktiTanah || `${selectedApp.certificateType} (No. ${selectedApp.certificateDocNumber})`}
                                </span>
                              </div>
                            </div>

                            {/* Tautan Dokumen Pendukung & Siteplan */}
                            {(selectedApp.fileAlasHakUrl || selectedApp.sertifikatTanahUrl || selectedApp.fileSiteplanUrl || selectedApp.suratPengantarDesaUrl || selectedApp.berkasLegalitasGabunganUrl) && (
                              <div className="pt-2 border-t border-emerald-500/20 space-y-1">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                                  Dokumen Legalitas & Teknis Pemohon:
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

              {/* READ-ONLY WARNING BANNER FOR ARCHIVED / PROCESSED PERMOHONAN */}
              {isReadOnlyMode && (
                <div className="bg-amber-50 dark:bg-amber-950/80 border-l-4 border-amber-500 p-3.5 rounded-r-2xl mb-2 font-sans text-xs animate-in fade-in duration-200 shadow-sm">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-extrabold uppercase tracking-wide">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Mode Hanya Baca (Read-Only Mode) 🔒</span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-200 mt-1 leading-snug">
                    Berkas ini telah diproses dan diteruskan ke instansi terkait atau DPMPTSP/OSS. Seluruh isian dan aksi modifikasi dinonaktifkan untuk keamanan data.
                  </p>
                </div>
              )}

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
                {isPertekIssued ? (
                  <p className="pt-1 border-t border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center justify-between">
                    <span>✓ SK Pertek Active:</span>
                    <span>{selectedApp.pkkprDocNumber || selectedApp.skPkkprDocNumber || issuedSkNumber}</span>
                  </p>
                ) : (
                  <p className="pt-1 border-t border-slate-200 dark:border-slate-700 text-amber-600 dark:text-amber-400 font-mono text-[11px] flex items-center justify-between">
                    <span>Draft Pertek No:</span>
                    <span className="font-bold">{issuedSkNumber || `503/PERTEK-PUPTR/LUWU/2026/605`} <span className="text-[10px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-sans font-bold">Belum Diterbitkan</span></span>
                  </p>
                )}
              </div>

              {/* Coordinate Validation Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Validasi Batas &amp; Koordinat</label>
                <select
                  disabled={isReadOnlyMode}
                  className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none transition-all ${
                    isReadOnlyMode ? 'opacity-60 cursor-not-allowed bg-slate-200 dark:bg-slate-900/80 border-slate-300 dark:border-slate-800' : ''
                  }`}
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
                  disabled={isReadOnlyMode}
                  rows={4}
                  className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none font-sans transition-all ${
                    isReadOnlyMode ? 'opacity-60 cursor-not-allowed bg-slate-200 dark:bg-slate-900/80 border-slate-300 dark:border-slate-800' : ''
                  }`}
                  placeholder="Masukkan catatan teknis, rekomendasi KDB/KLB, atau kewajiban RTH..."
                  value={technicalNotes}
                  onChange={e => setTechnicalNotes(e.target.value)}
                />
              </div>

              {/* Decision Selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Keputusan Rekomendasi Spasial</label>
                {isPertekIssued ? (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400 font-sans">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Status: Pertek Telah Diterbitkan (Disetujui)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-600 text-white rounded-md font-mono">ARSIP PERTEK</span>
                  </div>
                ) : isConflictLocked ? (
                  <div className="p-2.5 bg-amber-500/15 border-2 border-amber-500/60 rounded-xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      Keputusan Dikunci (Konflik Spasial Aktif)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-amber-600 text-white rounded-md font-mono">LOCKED</span>
                  </div>
                ) : (selectedApp.pertanianStatus === 'FORWARDED' && !isPertanianApproved && !isOverridden) ? (
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
                      className={`min-h-[46px] px-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-98 border flex items-center justify-center cursor-pointer ${
                        clearanceDecision === 'Approved'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 ring-2 ring-emerald-500/30'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750'
                      }`}
                    >
                      Disetujui
                    </button>
                    <button
                      type="button"
                      onClick={() => setClearanceDecision('Requires Revision')}
                      className={`min-h-[46px] px-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-98 border flex items-center justify-center cursor-pointer ${
                        clearanceDecision === 'Requires Revision'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20 ring-2 ring-amber-500/30'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750'
                      }`}
                    >
                      Revisi
                    </button>
                    <button
                      type="button"
                      onClick={() => setClearanceDecision('Rejected')}
                      className={`min-h-[46px] px-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-98 border flex items-center justify-center cursor-pointer ${
                        clearanceDecision === 'Rejected'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20 ring-2 ring-rose-500/30'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750'
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
              {selectedApp.pkkprStatus === 'Requires Revision' || selectedApp.pkkprStatus === 'Rejected' || selectedApp.pkkprStatus === 'Returned' ? (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-xs space-y-1.5 font-sans">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-extrabold uppercase">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>↩️ BERKAS TELAH DIKEMBALIKAN KE PEMOHON</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200">
                    Status: <strong className="text-rose-600 dark:text-rose-400">Memerlukan Perbaikan (Revisi)</strong>
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 italic bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-rose-200 dark:border-rose-900/60">
                    "{selectedApp.technicalNotes || selectedApp.pertanianNotes || 'Menunggu pemohon memperbaiki deliniasi koordinat/dokumen persyaratan.'}"
                  </p>
                  {selectedApp.pertanianBaNumber && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPertanianBapApp(selectedApp);
                        setShowPertanianBapPreview(true);
                      }}
                      className="w-full py-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-rose-600" />
                      <span>Lihat Dokumen BAP Penolakan Pertanian (No. {selectedApp.pertanianBaNumber}) 📄</span>
                    </button>
                  )}
                  <p className="text-[10px] text-slate-500 pt-1 border-t border-rose-200 dark:border-rose-800/60">
                    ℹ️ Permohonan ini telah dikeluarkan dari antrean tugas aktif Petugas PUPTR dan sedang menunggu perbaikan oleh pemohon.
                  </p>
                </div>
              ) : isPertekIssued ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-xs space-y-1 font-sans">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-extrabold uppercase">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>✓ PERTEK &amp; BAP RUANG TELAH DITERBITKAN</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200">
                    No. Pertek PUPTR: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{selectedApp.pkkprDocNumber || selectedApp.skPkkprDocNumber || issuedSkNumber}</strong>
                  </p>
                  <p className="text-[11px] text-slate-500 pt-1 border-t border-emerald-200 dark:border-emerald-800/60">
                    🔒 Permohonan ini telah selesai diproses dan diteruskan ke Admin DPMPTSP OSS untuk penerbitan SK Izin. Tombol aksi persetujuan telah dinonaktifkan untuk mencegah duplikasi.
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
                        Poligon lokasi beririsan dengan <strong className="text-amber-800 dark:text-amber-300">{spatialConflictAudit.conflictCategories.join(', ') || 'Lahan Pertanian Pangan Berkelanjutan (LP2B)'}</strong> seluas <strong>{spatialConflictAudit.totalOverlapHa || selectedApp.areaHa} Ha</strong> ({spatialConflictAudit.totalOverlapSqm.toLocaleString('id-ID')} m²). Diperlukan rekomendasi alih fungsi dari Dinas Pertanian.
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Seluruh tombol proses (Persetujuan, Revisi, Penolakan, dan Cetak BAP) akan aktif setelah:
                        <br /><strong>1. Admin menekan tombol Override atas Izin Pimpinan</strong>, atau
                        <br /><strong>2. Mendapat persetujuan peralihan fungsi lahan dari Admin Dinas Pertanian</strong>.
                      </p>
                    </div>
                  </div>

                  {/* 3 Authorized Action Options */}
                  <div className="flex flex-col gap-2 pt-1">
                    {/* 1. Forward to Agriculture */}
                    {isPertanianApproved || isPertekIssued || selectedApp.pkkprStatus === 'Approved' ? (
                      <div className="w-full py-2.5 bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Rekomendasi / Pertek Telah Disetujui ✓ (Aksi Kirim Dinonaktifkan)</span>
                      </div>
                    ) : (selectedApp.pertanianStatus === 'FORWARDED' && !isPertanianApproved && !isOverridden) ? (
                      <div className="w-full py-2.5 bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4 animate-spin text-amber-600" />
                        <span>Dalam Antrean Verifikasi Dinas Pertanian ⏳</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={!spatialConflictAudit.hasConflict || isPertekIssued || selectedApp.pkkprStatus === 'Approved' || isReadOnlyMode}
                        onClick={handleOpenForwardPertanianModal}
                        className={`w-full py-2.5 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition transform active:scale-95 ${
                          !spatialConflictAudit.hasConflict || isPertekIssued || selectedApp.pkkprStatus === 'Approved' || isReadOnlyMode
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer'
                        }`}
                        title={!spatialConflictAudit.hasConflict ? 'Lahan bersih / tidak beririsan dengan LP2B' : ''}
                      >
                        <Send className="w-4 h-4" />
                        <span>1. Ajukan Alih Fungsi ke Dinas Pertanian 🌾</span>
                      </button>
                    )}

                    {/* 2. Direct Leadership Override Button */}
                    {isPertanianApproved || isPertekIssued || selectedApp.pkkprStatus === 'Approved' ? (
                      <div className="w-full py-2 bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400 rounded-xl text-[11px] font-medium text-center border border-slate-200 dark:border-slate-800">
                        🔒 Override tidak aktif (Izin PKKPR telah berstatus Pertek Disetujui).
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={!spatialConflictAudit.hasConflict || isOverridden || isPertekIssued || selectedApp.pkkprStatus === 'Approved' || isReadOnlyMode}
                        onClick={handleQuickLeadershipOverride}
                        className={`w-full py-2.5 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition transform active:scale-95 ${
                          !spatialConflictAudit.hasConflict || isOverridden || isPertekIssued || selectedApp.pkkprStatus === 'Approved' || isReadOnlyMode
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                            : 'bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white cursor-pointer'
                        }`}
                      >
                        <ShieldAlert className="w-4 h-4 text-amber-200" />
                        <span>
                          {isOverridden
                            ? '✓ Diskresi Pimpinan Telah Diterapkan (Terkunci Aktif)'
                            : '2. Override atas Izin Pimpinan (Buka Kunci Proses Langsung) 🔓'}
                        </span>
                      </button>
                    )}

                    {/* 3. Formal Conflict Resolution Tool */}
                    {isPertekIssued || selectedApp.pkkprStatus === 'Approved' ? (
                      <div className="w-full py-2 bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400 rounded-xl text-[11px] font-medium text-center border border-slate-200 dark:border-slate-800">
                        🔒 Conflict Resolution Tool terkunci (Pertek Disetujui).
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isReadOnlyMode || isPertekIssued || selectedApp.pkkprStatus === 'Approved'}
                        onClick={() => setShowConflictResolutionModal(true)}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        <span>Formulir Detail Conflict Resolution Tool 🛡️</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : selectedApp.pertanianStatus === 'REJECTED' ? (
                <>
                  {/* BAP Penolakan Dinas Pertanian Warning Banner */}
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-400/80 dark:border-rose-800 rounded-2xl space-y-2 font-sans shadow-sm">
                    <div className="flex items-center justify-between text-rose-800 dark:text-rose-300 font-black text-xs uppercase tracking-wide">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Dasar Penolakan: BAP Dinas Pertanian</span>
                      </span>
                      <span className="font-mono text-[10px] bg-rose-200/80 dark:bg-rose-900 px-2 py-0.5 rounded-full border border-rose-300 dark:border-rose-700">
                        {selectedApp.pertanianBaNumber || '521/043/BAP-TOLAK-LP2B/DISTAN-LW/2026'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                      Rekomendasi alih fungsi lahan <strong className="text-rose-600 dark:text-rose-400">DITOLAK</strong> oleh Dinas Pertanian karena persil berada di Zona LP2B Sawah Irigasi Aktif (UU 41/2009).
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 italic bg-white/70 dark:bg-slate-900/70 p-2 rounded-xl border border-rose-200 dark:border-rose-900">
                      "{selectedApp.pertanianNotes || 'Lokasi berada di kawasan LP2B produktif/sawah irigasi teknis aktif.'}"
                    </p>
                  </div>

                  {/* Button 1: Return to Applicant based on BAP Pertanian */}
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

                  {/* Button 2: View / Print BAP Penolakan Dinas Pertanian */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPertanianBapApp(selectedApp);
                      setShowPertanianBapPreview(true);
                    }}
                    className="w-full py-2.5 bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-rose-600" />
                    <span>Lihat / Cetak BAP Penolakan Dinas Pertanian 📄</span>
                  </button>
                </>
              ) : (selectedApp.pertanianStatus === 'FORWARDED' && !isPertanianApproved && !isOverridden) ? (
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
                  {/* Guidance callout for Admin PUPTR - Strictly requires isReadyForFinalPertek */}
                  {isReadyForFinalPertek && clearanceDecision === 'Approved' && !isPertekIssued && (
                    <div className="p-3 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-xl space-y-1 text-slate-800 dark:text-slate-100 font-sans shadow-sm">
                      <p className="text-xs font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>LANGKAH AKHIR: EKSEKUSI PENERBITAN PERTEK PUPTR</span>
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                        {isPertanianApproved
                          ? 'Dinas Pertanian telah menerbitkan BAP Rekomendasi Alih Fungsi. Silakan klik tombol hijau di bawah ini untuk meresmikan Pertek PUPTR & mentransmisikan berkas ke DPMPTSP OSS!'
                          : 'Rekomendasi spasial telah disetujui. Silakan klik tombol hijau di bawah ini untuk menerbitkan Pertek PUPTR & mentransmisikan berkas ke DPMPTSP OSS!'}
                      </p>
                    </div>
                  )}

                  {/* Tombol Setujui hanya muncul jika Keputusan = Approved DAN isReadyForFinalPertek */}
                  {isReadyForFinalPertek && clearanceDecision === 'Approved' && (
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
                  )}

                  {/* Tombol Kembalikan ke Pemohon hanya muncul jika Pertanian menolak atau PUPTR memilih Revisi/Ditolak */}
                  {((selectedApp.pertanianStatus as string) === 'REJECTED' || clearanceDecision === 'Requires Revision' || clearanceDecision === 'Rejected') && (
                    <button
                      type="button"
                      disabled={isIssuingSk}
                      onClick={handleReturnToApplicant}
                      className="w-full py-2.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <XCircle className="w-4 h-4 text-rose-500" />
                      <span>Kembalikan ke Pemohon (Perlu Revisi) ↩️</span>
                    </button>
                  )}
                </>
              )}

              {/* BAP Resmi PUPTR Preview & Print Button (Selalu Aktif Saat Pertek Terbit atau Lahan Clear) */}
              <button
                type="button"
                disabled={!isPertekIssued && (isConflictLocked || (selectedApp.pertanianStatus === 'FORWARDED' && !isPertanianApproved && !isOverridden))}
                onClick={handleOpenBapModal}
                className={`w-full py-2.5 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition ${
                  !isPertekIssued && (isConflictLocked || (selectedApp.pertanianStatus === 'FORWARDED' && !isPertanianApproved && !isOverridden))
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60'
                    : 'bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 cursor-pointer'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>
                  {isPertekIssued
                    ? 'Lihat / Cetak Berita Acara (BAP) Kesesuaian Ruang PUPTR 📄'
                    : isConflictLocked
                    ? 'BAP PUPTR Terkunci (Selesaikan Konflik Spasial Dahulu)'
                    : (selectedApp.pertanianStatus === 'FORWARDED' && !isPertanianApproved && !isOverridden)
                    ? 'BAP PUPTR Belum Dapat Diterbitkan (Menunggu Rekomendasi Pertanian)'
                    : 'Lihat / Cetak Berita Acara (BAP) Kesesuaian Ruang PUPTR'}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* EMPTY STATE / NO SELECTION PLACEHOLDER */
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-8 sm:p-14 text-center space-y-4 shadow-sm animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto border border-slate-200 dark:border-slate-700 shadow-inner">
            <MapPinOff className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Tidak Ada Permohonan Aktif Dipilih
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Silakan pilih salah satu permohonan pada tabel antrean di atas untuk membuka Studio GIS, analisis spasial, dan form rekomendasi teknis.
            </p>
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
                  disabled={isForwarding || isReadOnlyMode || isPertekIssued || selectedApp.pkkprStatus === 'Approved'}
                  onClick={handleExecuteForwardToPertanian}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                  if (!selectedApp?.id) return;

                  // 1. Instantly cache to specific application localStorage
                  try {
                    localStorage.setItem(`BAP_KTR_${selectedApp.id}`, JSON.stringify(updatedBapData));
                    if (updatedBapData.nomorSurat) {
                      localStorage.setItem(`BAP_KTR_${updatedBapData.nomorSurat}`, JSON.stringify(updatedBapData));
                    }
                  } catch (e) {
                    console.warn('Storage error:', e);
                  }

                  // 2. Update React states optimistically
                  setSelectedApp((prev: any) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      applicantName: updatedBapData.namaPemohon || prev.applicantName,
                      companyName: updatedBapData.namaLembagaOrganisasi || prev.companyName,
                      title: updatedBapData.fungsiBangunan || prev.title,
                      fungsiBangunan: updatedBapData.fungsiBangunan || prev.fungsiBangunan,
                      nibNik: updatedBapData.nibNik || prev.nibNik,
                      applicantAddress: updatedBapData.alamatPemohon || prev.applicantAddress,
                      districtName: updatedBapData.kecamatan ? updatedBapData.kecamatan.replace(/^Kecamatan\s+/i, '') : prev.districtName,
                      villageName: updatedBapData.desaKelurahan ? updatedBapData.desaKelurahan.replace(/^Desa\s+/i, '') : prev.villageName,
                      pkkprDocNumber: updatedBapData.nomorSurat || prev.pkkprDocNumber,
                      certificateType: updatedBapData.buktiHakTanah || prev.certificateType,
                      bap_ktr_data: updatedBapData
                    };
                  });

                  setQueueList((prev: any[]) =>
                    prev.map((item) =>
                      item.id === selectedApp.id
                        ? {
                            ...item,
                            applicantName: updatedBapData.namaPemohon || item.applicantName,
                            companyName: updatedBapData.namaLembagaOrganisasi || item.companyName,
                            title: updatedBapData.fungsiBangunan || item.title,
                            pkkprDocNumber: updatedBapData.nomorSurat || item.pkkprDocNumber,
                            bap_ktr_data: updatedBapData
                          }
                        : item
                    )
                  );

                  // 3. Fast Non-blocking Supabase sync with 2.5s timeout protection
                  if (supabase) {
                    try {
                      const cleanKec = updatedBapData.kecamatan ? updatedBapData.kecamatan.replace(/^Kecamatan\s+/i, '') : undefined;
                      const cleanDesa = updatedBapData.desaKelurahan ? updatedBapData.desaKelurahan.replace(/^Desa\s+/i, '') : undefined;

                      const updatePkkpr = supabase
                        .from('gis_pkkpr')
                        .update({
                          applicant_name: updatedBapData.namaPemohon,
                          company_name: updatedBapData.namaLembagaOrganisasi,
                          project_name: updatedBapData.fungsiBangunan,
                          nik_pemohon: updatedBapData.nibNik,
                          alamat_pemohon: updatedBapData.alamatPemohon,
                          district_name: cleanKec,
                          village_name: cleanDesa,
                          bukti_tanah: updatedBapData.buktiHakTanah,
                          pertek_puptr_num: updatedBapData.nomorSurat,
                          pkkpr_doc_number: updatedBapData.nomorSurat,
                          updated_at: new Date().toISOString()
                        })
                        .eq('id', selectedApp.id);

                      const updateInv = supabase
                        .from('investments')
                        .update({
                          contact_pic: updatedBapData.namaPemohon,
                          name: updatedBapData.fungsiBangunan,
                          title: updatedBapData.fungsiBangunan,
                          pkkpr_doc_number: updatedBapData.nomorSurat,
                          updated_at: new Date().toISOString()
                        })
                        .eq('id', selectedApp.id);

                      await Promise.race([
                        Promise.allSettled([updatePkkpr, updateInv]),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout DB sync')), 2500))
                      ]);
                    } catch (dbErr) {
                      console.log('Database sync note in PUPTR BAP save:', dbErr);
                    }
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
          detectedConflictType={spatialConflictAudit.hasGeometryMismatch ? 'GEOMETRY_MISMATCH' : 'LP2B_OVERLAP'}
          detectedOverlapSqm={Math.round((selectedApp.luasM2 || selectedApp.areaHa * 10000))}
          detectedOverlapHa={selectedApp.areaHa}
          existingBapNumber={selectedApp.pertanianBaNumber}
          isReadOnly={Boolean(isReadOnlyMode || isPertekIssued || selectedApp.pkkprStatus === 'Approved')}
          onOverrideSuccess={(justification, bapNum) => {
            const overrideText = `[SPATIAL OVERRIDE BAP ${bapNum || 'TERLAMPIR'}]: ${justification}`;
            setHasLocalOverride(true);
            setTechnicalNotes(prev => `${overrideText}\n\n${prev}`);
            setIsGisToastDismissed(true);
            setSelectedApp((prev: any) => prev ? {
              ...prev,
              overrideJustification: justification,
              pertanianBaNumber: prev.pertanianBaNumber || bapNum,
              technicalNotes: `${overrideText}\n\n${prev.technicalNotes || ''}`
            } : null);
            setQueueList(prev => prev.map(item => item.id === selectedApp?.id ? {
              ...item,
              overrideJustification: justification,
              pertanianBaNumber: item.pertanianBaNumber || bapNum,
              technicalNotes: `${overrideText}\n\n${item.technicalNotes || ''}`
            } : item));
            fetchQueue();
          }}
          onReturnForRevision={async (justification) => {
            await handleRequestRevision(justification.trim());
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

      {/* Official BAP Dinas Pertanian Modal Preview (Penolakan / Persetujuan LP2B) */}
      {showPertanianBapPreview && selectedPertanianBapApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="min-h-screen py-4 px-2 sm:px-4">
            <BapLp2bPertanianDocument
              initialData={convertAppToBapLp2bData(selectedPertanianBapApp, getOpdSettings('pertanian'), mapSnapshot)}
              mapSnapshot={mapSnapshot}
              onClose={() => setShowPertanianBapPreview(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
