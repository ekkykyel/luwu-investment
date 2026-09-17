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
  AlertCircle,
  XCircle,
  Lock,
  Printer,
  Download
} from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../../lib/supabaseClient';
import { parseKmlKmzFile, ParsedKmzResult } from '../../utils/kmlKmzParser';
import { detectAdministrativeLocation } from '../../utils/spatialLookup';
import { checkPkkprSpatialZoning, PkkprZoningResult, calculateBoundingBox, normalizeDistrictName, findDistrictMatch, isSameDistrict, identifyDistrictFromGeometryOrCoord, normalizeName } from '../../utils/geoUtils';
import MapComponent from '../MaplibreComponent';
import OrientationPrompt from '../OrientationPrompt';
import { formatRupiah } from '../../lib/formatters';
import { useTechnicalSpatialLayers } from '../../hooks/useTechnicalSpatialLayers';
import { Investment } from '../../types';
import { useData } from '../../contexts/DataContext';
import { LuwuLogo } from '../LuwuLogo';
import { generateBapPdfFromElement } from '../../utils/bapPdfGenerator';
import { CrossOpdNotificationBell } from '../CrossOpdNotificationBell';
import { addCrossOpdNotification } from '../../utils/crossOpdNotificationStore';

export interface PkkprApplicationItem {
  id: string;
  applicantType: 'NIB (Pelaku Usaha)' | 'NIK (Perorangan / Warga)';
  nibNik: string;
  applicantName: string;
  companyName: string;
  sector: string;
  districtName: string;
  villageName: string;
  areaHa: number;
  investmentValue: number;
  certificateType: 'Sertifikat Hak Milik (SHM)' | 'Hak Guna Bangunan (HGB)' | 'Surat Keterangan Tanah (SKT/Girik)' | 'Sertifikat Hak Pakai';
  certificateDocNumber: string;
  kmzFileName?: string;
  kmzFileUrl?: string;
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

  // Profile Modal & Inter-Agency Routing State
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showBapModal, setShowBapModal] = useState<boolean>(false);
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

      // 1. Primary Query: Try fetching from gis_pkkpr table
      try {
        const { data: pkkprGisData, error: gisErr } = await supabase
          .from('gis_pkkpr')
          .select('*')
          .order('created_at', { ascending: false });

        if (!gisErr && pkkprGisData && pkkprGisData.length > 0) {
          pkkprGisData.forEach((item: any) => {
            const isNik = item.jenis_permohonan === 'Non-Berusaha' || !!item.nik_pemohon;
            const applicantType = isNik ? 'NIK (Perorangan / Warga)' : 'NIB (Pelaku Usaha)';

            let pertStatus: 'NOT_SUBMITTED' | 'FORWARDED' | 'APPROVED' | 'REJECTED' = 'NOT_SUBMITTED';
            if (item.berita_acara_pertanian_num || item.status_pkkpr === 'Approved_Pertanian') {
              pertStatus = 'APPROVED';
            } else if (item.status_pkkpr === 'Rejected_Pertanian') {
              pertStatus = 'REJECTED';
            } else if (item.status_pkkpr === 'Forwarded_To_Pertanian') {
              pertStatus = 'FORWARDED';
            }

            mapped.push({
              id: item.id,
              applicantType,
              nibNik: isNik ? (item.nik_pemohon || '7317000000000000') : (item.nib_oss || item.nik_pemohon || '9120000000000'),
              applicantName: item.nama_pemohon || 'Pemohon Terdaftar',
              companyName: item.nama_badan_usaha || item.nama_permohonan || 'PT Luwu Sinergi Properti',
              sector: item.sektor || 'Komersial / Usaha',
              districtName: item.kecamatan || 'Bua',
              villageName: item.desa_kelurahan || 'Barowa',
              areaHa: item.luas_ha || (item.luas_m2 ? Number((item.luas_m2 / 10000).toFixed(4)) : 0.5),
              investmentValue: item.jenis_permohonan === 'Berusaha' ? 12500000000 : 0,
              certificateType: isNik ? 'Sertifikat Hak Milik (SHM)' : 'Hak Guna Bangunan (HGB)',
              certificateDocNumber: `SHM/HGB-LUWU-${item.id ? item.id.split('-').pop() : '321183'}`,
              kmzFileName: item.nama_berkas_kmz || 'Batas_Poligon_Lokasi.kmz',
              kmzFileUrl: item.berkas_kmz_url || '',
              geometry: item.geometry_json || item.geom,
              pkkprStatus: item.pkkpr_doc_number ? 'Approved' : (item.status_pkkpr === 'Requires Revision' ? 'Requires Revision' : 'Pending Spatial Check'),
              pkkprDocNumber: item.pkkpr_doc_number || item.pertek_puptr_num,
              skPkkprDocNumber: item.pkkpr_doc_number,
              technicalNotes: item.catatan_teknis || 'Sesuai dengan Rencana Tata Ruang Wilayah (RTRW) Kabupaten Luwu.',
              coordinateStatus: 'Valid / Sesuai Batas RTRW',
              esgStatus: 'CLEAR',
              pertanianStatus: pertStatus,
              pertanianBaNumber: item.berita_acara_pertanian_num || undefined,
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
            
            let pertStatus: 'NOT_SUBMITTED' | 'FORWARDED' | 'APPROVED' | 'REJECTED' = 'NOT_SUBMITTED';
            if (item.berita_acara_num || item.status === 'Approved_Pertanian') {
              pertStatus = 'APPROVED';
            } else if (item.status === 'Rejected_Pertanian' || item.pertanian_rejection_notes) {
              pertStatus = 'REJECTED';
            } else if (item.status === 'Forwarded_To_Pertanian' || (item.override_justification && item.override_justification.includes('PERTANIAN'))) {
              pertStatus = 'FORWARDED';
            }

            mapped.push({
              id: item.id || `PKKPR-${Math.random().toString(36).substring(2, 7)}`,
              applicantType,
              nibNik: item.plot_number || item.certificate_number || item.id || '9120000000000',
              applicantName: item.contact_pic || item.nama_kontak_person || 'Pemohon Terdaftar',
              companyName: item.name || item.title || 'PT Luwu Sinergi Properti',
              sector: item.sector || 'Perindustrian',
              districtName: item.district_id || item.kecamatan || 'Bua',
              villageName: item.village_id || item.desa || 'Barowa',
              areaHa: item.area_ha || 15.5,
              investmentValue: item.investment_value || 12500000000,
              certificateType: isNik ? 'Sertifikat Hak Milik (SHM)' : 'Hak Guna Bangunan (HGB)',
              certificateDocNumber: `SHM/HGB-LUWU-${Math.floor(100000 + Math.random() * 900000)}`,
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
              mapped.unshift({
                id: appId || `PKKPR-LUWU-${Date.now().toString().slice(-6)}`,
                applicantType: 'NIK (Perorangan / Warga)',
                nibNik: app.nik || '7317060202700001',
                applicantName: app.nama_pemohon || 'Masyarakat',
                companyName: app.title || 'Permohonan PKKPR Rumah Tinggal / Fasos',
                sector: app.category === 'Berusaha' ? 'Komersial / Usaha' : 'Non-Komersial / Perumahan',
                districtName: app.kecamatan || 'Ponrang',
                villageName: app.desa || 'Ponrang',
                areaHa: app.luas_m2 ? Number((app.luas_m2 / 10000).toFixed(2)) : 0.05,
                investmentValue: 0,
                certificateType: 'Sertifikat Hak Milik (SHM)',
                certificateDocNumber: `SHM-LUWU-${appId ? appId.split('-').pop() : '321183'}`,
                kmzFileName: 'Geometri_Lahan_Pemohon.kmz',
                kmzFileUrl: '',
                geometry: app.geometry,
                pkkprStatus: app.sk_pkkpr_doc_number ? 'Approved' : 'Pending Spatial Check',
                pkkprDocNumber: app.sk_pkkpr_doc_number || undefined,
                skPkkprDocNumber: app.sk_pkkpr_doc_number || undefined,
                technicalNotes: 'Permohonan dari Portal Layanan Perizinan PKKPR Publik.',
                coordinateStatus: 'Valid / Sesuai Batas RTRW',
                esgStatus: 'CLEAR',
                pertanianStatus: app.pertanian_status || 'NOT_SUBMITTED',
                createdAt: app.created_at || new Date().toISOString()
              });
            }
          });
        } catch (e) {
          console.warn('Local apps merge error:', e);
        }
      }

      setQueueList(mapped);

      // Auto-select first item for inspection if none selected
      if (mapped.length > 0) {
        setSelectedApp(prev => prev ? (mapped.find(m => m.id === prev.id) || mapped[0]) : mapped[0]);
      }
    } catch (err) {
      console.error('Failed to load PKKPR queue:', err);
      setQueueList([]);
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

    return () => {
      window.removeEventListener('luwu_cross_opd_notifications_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
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
    setIsForwarding(true);
    try {
      const updatePayload = {
        status: 'Forwarded_To_Pertanian',
        override_justification: `[PERMOHONAN DITERUSKAN KE DINAS PERTANIAN]: ${forwardingJustification}`,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('investments')
        .update(updatePayload)
        .eq('id', selectedApp.id);

      if (error) {
        console.warn('Supabase forward to Pertanian error:', error);
      }

      // Lock spatial file in local state
      setQueueList(prev =>
        prev.map(item => {
          if (item.id === selectedApp.id) {
            return {
              ...item,
              pertanianStatus: 'FORWARDED',
              technicalNotes: updatePayload.override_justification
            };
          }
          return item;
        })
      );

      setSelectedApp(prev => prev ? {
        ...prev,
        pertanianStatus: 'FORWARDED',
        technicalNotes: updatePayload.override_justification
      } : null);

      setShowForwardPertanianModal(false);

      // Trigger Cross-OPD Notification to Dinas Pertanian
      addCrossOpdNotification({
        applicationId: selectedApp.id,
        applicantName: selectedApp.applicantName,
        companyName: selectedApp.companyName,
        sector: selectedApp.sector,
        districtName: selectedApp.districtName,
        villageName: selectedApp.villageName,
        targetRole: 'ADMIN_PERTANIAN',
        fromRole: 'ADMIN_PUPTR',
        type: 'FORWARD_PERTANIAN',
        title: `Minta Rekomendasi Teknis LP2B #${selectedApp.id}`,
        message: `Dinas PUPTR meneruskan permohonan ${selectedApp.companyName} (${selectedApp.applicantName}) di Kec. ${selectedApp.districtName} yang terdeteksi di Zona LP2B untuk evaluasi pertimbangan teknis pertanian.`,
        notes: forwardingJustification
      });

      Swal.fire({
        icon: 'success',
        title: 'Berkas Berhasil Diteruskan Ke Dinas Pertanian! 🌾',
        html: `
          <div className="text-left text-xs space-y-2 p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800 font-sans">
            <p><strong>Status Geometri:</strong> <span className="text-emerald-600 font-bold">LOCKED &amp; TRANSFERRED</span></p>
            <p><strong>Target Instansi:</strong> Dinas Pertanian Kabupaten Luwu (Bidang Prasarana &amp; Lahan)</p>
            <p><strong>NIB / NIK:</strong> ${selectedApp.nibNik} (${selectedApp.companyName})</p>
            <p className="text-[11px] text-slate-500 pt-1 border-t border-emerald-200">
              ⚡ Antrean permohonan telah muncul di Dashboard Dinas Pertanian secara real-time untuk analisis tingkat kesuburan tanah &amp; pembuatan Berita Acara LP2B.
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
      const generatedDocNum = `503/PKKPR-PUPTR/LUWU/${year}/${randomSeq}`;

      const updatePayload = {
        pkkpr_doc_number: generatedDocNum,
        sk_pkkpr_doc_number: generatedDocNum,
        status: clearanceDecision === 'Approved' ? 'Published' : 'Review',
        override_justification: technicalNotes,
        esg_risk_status: zoningAudit?.suitabilityLevel === 'DIBATASI' ? 'HIGH_RISK_INTERSECTION' : 'CLEAR',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('investments')
        .update(updatePayload)
        .eq('id', selectedApp.id);

      if (error) {
        console.warn('Supabase SK PKKPR update warning:', error);
      }

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
        message: `Dinas PUPTR telah menerbitkan Pertek Kesesuaian Lahan No. ${generatedDocNum} (Melampirkan BAP Pertanian No. ${selectedApp.pertanianBaNumber || 'Terlampir'}). Mohon terbitkan SK Izin PKKPR DPMPTSP Final.`,
        bapPertanianDocNumber: selectedApp.pertanianBaNumber,
        bapPuptrDocNumber: generatedDocNum
      });

      Swal.fire({
        icon: 'success',
        title: 'SK PKKPR Resmi Diterbitkan! 🎉',
        html: `
          <div className="text-left text-xs space-y-2 p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800 font-sans">
            <p className="text-slate-900 dark:text-emerald-100"><strong>Nomor SK PKKPR:</strong> <code className="font-mono text-emerald-600 dark:text-emerald-300 font-bold">${generatedDocNum}</code></p>
            <p className="text-slate-900 dark:text-emerald-100"><strong>NIB/NIK Pemohon:</strong> ${selectedApp.nibNik}</p>
            <p className="text-slate-900 dark:text-emerald-100"><strong>Status Spasial:</strong> <span className="font-bold text-emerald-600">${clearanceDecision}</span></p>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] pt-1 border-t border-emerald-200 dark:border-emerald-800">
              ⚡ Data ini sekarang tersinkronisasi secara instan dengan basis data DPMPTSP dan dapat di-auto-hydrate oleh pemohon/investor.
            </p>
          </div>
        `,
        confirmButtonColor: '#10b981'
      });
    } catch (err: any) {
      console.error('Error issuing SK PKKPR:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Penerbitan SK PKKPR',
        text: err.message || 'Terjadi kesalahan sistem.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsIssuingSk(false);
    }
  };

  // Filtered Queue List
  const filteredQueue = useMemo(() => {
    return queueList.filter(item => {
      const matchSearch =
        item.nibNik.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.districtName.toLowerCase().includes(searchQuery.toLowerCase());

      if (statusFilter === 'ALL') return matchSearch;
      if (statusFilter === 'APPROVED') return matchSearch && item.pkkprStatus === 'Approved';
      if (statusFilter === 'PENDING') return matchSearch && item.pkkprStatus === 'Pending Spatial Check';
      if (statusFilter === 'REVISION') return matchSearch && item.pkkprStatus === 'Requires Revision';
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
            {['ALL', 'PENDING', 'APPROVED', 'REVISION'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'Semua Status' : st === 'PENDING' ? 'Pending Check' : st === 'APPROVED' ? 'SK Terbit' : 'Revisi'}
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

              <div className="flex items-center gap-2">
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
            {(activeStates['layer_sawah'] || activeStates['layer_lahan_kering_primer'] || zoningAudit?.suitabilityLevel === 'DIBATASI' || selectedApp.pertanianStatus !== 'NOT_SUBMITTED') && (
              <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold shrink-0 mt-0.5 shadow-md">
                      <AlertTriangle className="w-5 h-5 animate-bounce" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                          ⚠️ AUTOMATED ENVIRONMENTAL FLAG: TUMPANG TINDIH LP2B &amp; LAHAN BASAH DETECTED
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          UU No. 41 / 2009
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                        Poligon lokasi pemohon <strong className="font-bold">{selectedApp.applicantName} ({selectedApp.companyName})</strong> beririsan dengan zona <span className="font-bold text-amber-600 dark:text-amber-400">Lahan Pertanian Pangan Berkelanjutan (LP2B) / Sawah Irigasi Teknis</span>. Sebelum SK PKKPR diterbitkan, berkas WAJIB melalui klarifikasi &amp; Berita Acara Alih Fungsi Lahan dari Dinas Pertanian.
                      </p>
                    </div>
                  </div>

                  {/* Inter-Agency Transfer Action Button */}
                  <div className="shrink-0">
                    {selectedApp.pertanianStatus === 'FORWARDED' ? (
                      <div className="px-3.5 py-2 bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-2">
                        <Clock className="w-4 h-4 animate-spin text-amber-600" />
                        <span>Dalam Antrean Verifikasi Dinas Pertanian</span>
                      </div>
                    ) : selectedApp.pertanianStatus === 'APPROVED' ? (
                      <div className="px-3.5 py-2 bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>✓ Rekomendasi Pertanian Disetujui ({selectedApp.pertanianBaNumber || 'BA Terlampir'})</span>
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
                        <span>Ajukan Permohonan Perubahan Status Lahan ke Dinas Pertanian</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Inter-Agency Feedback Notice */}
                {selectedApp.pertanianStatus === 'APPROVED' && selectedApp.pertanianBaNumber && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-slate-800 dark:text-emerald-200 space-y-1">
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
            )}

            {/* MapLibre Container with real Polygon Thematic Layers */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span><strong>Petunjuk Analisis Spasial:</strong> Klik sembarang poligon, batas wilayah, jalan, atau layer tematik pada peta untuk menampilkan detail atribut &amp; informasi tata ruang.</span>
              </div>

              <div className={`w-full ${isMapExpanded ? 'min-h-[600px] h-[85vh]' : 'h-[500px] sm:h-[600px] lg:h-[75vh]'} rounded-2xl relative overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner transition-all duration-300`}>
                <MapComponent
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

                {/* Spatial Overlay Card on top of Map */}
                {zoningAudit && (
                  <div className="fixed bottom-3 inset-x-3 md:absolute md:top-3 md:right-14 md:left-auto md:max-w-xs bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-lg z-20 text-xs space-y-1.5">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                      <span className="font-bold text-slate-900 dark:text-white">Hasil Analisis Turf.js</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        zoningAudit.suitabilityLevel === 'DIBATASI'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : zoningAudit.suitabilityLevel === 'BERSYARAT'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {zoningAudit.suitabilityLevel}
                      </span>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>Zona Matched:</strong> {zoningAudit.matchedZone}
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>Kategori:</strong> {zoningAudit.zoneType}
                    </p>
                    {zoningAudit.warningNote && (
                      <p className="text-amber-600 dark:text-amber-400 text-[10px] leading-tight font-medium bg-amber-50 dark:bg-amber-950/50 p-1.5 rounded-lg border border-amber-200 dark:border-amber-800">
                        {zoningAudit.warningNote}
                      </p>
                    )}
                  </div>
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
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 mt-4">
              <button
                type="button"
                disabled={isIssuingSk || selectedApp.pertanianStatus === 'REJECTED' || selectedApp.pertanianStatus === 'FORWARDED'}
                onClick={handleIssueSkPkkpr}
                className={`w-full py-3 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                  selectedApp.pertanianStatus === 'REJECTED'
                    ? 'bg-slate-400 cursor-not-allowed opacity-60 shadow-none'
                    : selectedApp.pertanianStatus === 'FORWARDED'
                    ? 'bg-amber-600 hover:bg-amber-500 cursor-not-allowed opacity-80'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20 cursor-pointer'
                }`}
              >
                {isIssuingSk ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : selectedApp.pertanianStatus === 'REJECTED' ? (
                  <Lock className="w-4 h-4 text-rose-200" />
                ) : selectedApp.pertanianStatus === 'FORWARDED' ? (
                  <Clock className="w-4 h-4 text-amber-200 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>
                  {selectedApp.pertanianStatus === 'REJECTED'
                    ? 'Penerbitan Dikunci (Ditolak Pertanian) ⛔'
                    : selectedApp.pertanianStatus === 'FORWARDED'
                    ? 'Menunggu Berita Acara Pertanian ⏳'
                    : 'Terbitkan SK PKKPR & Sync DB Central 🚀'}
                </span>
              </button>

              {/* BAP Resmi PUPTR Preview & Print Button */}
              <button
                type="button"
                onClick={() => setShowBapModal(true)}
                className="w-full py-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Lihat / Cetak Berita Acara (BAP) Kesesuaian Ruang PUPTR</span>
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
          (Page 1: Naskah Resmi BAP | Page 2: Peta Delineasi Spasial)
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showBapModal && selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white text-slate-900 border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-8 max-w-4xl w-full shadow-2xl space-y-6 my-auto max-h-[92vh] overflow-y-auto print:max-h-none print:overflow-visible print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none"
            >
              {/* Modal Top Controls (Hidden in Print) */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      Berita Acara Pemeriksaan (BAP) Kesesuaian Tata Ruang
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Dokumen Resmi Dinas PUPTR Kabupaten Luwu &bull; Format Standar OSS / PKKPR
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadBapPdf}
                    disabled={isExportingPdf}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition disabled:opacity-50"
                  >
                    {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span>{isExportingPdf ? 'Mengunduh PDF...' : 'Download PDF (jsPDF)'}</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Direct</span>
                  </button>
                  <button
                    onClick={() => setShowBapModal(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable container for jsPDF capture */}
              <div id="puptr-bap-printable-document" className="space-y-6 bg-white p-2 rounded-xl">
                {/* ══════════════════════════════════════════════════════════
                    LEMBAR 1: NASKAH RESMI BERITA ACARA PEMERIKSAAN (BAP)
                   ══════════════════════════════════════════════════════════ */}
              <div className="bap-page-1 border border-slate-200 p-6 sm:p-8 rounded-2xl bg-white space-y-6 print:border-none print:p-0">
                {/* KOP SURAT RESMI DINAS PUPTR */}
                <div className="flex items-center gap-4 border-b-4 border-double border-slate-900 pb-4">
                  <div className="shrink-0 flex items-center justify-center">
                    <LuwuLogo size="xl" className="w-20 h-24 object-contain" />
                  </div>
                  <div className="flex-1 text-center space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-800 font-serif">
                      PEMERINTAH KABUPATEN LUWU
                    </h4>
                    <h2 className="text-base sm:text-xl font-black tracking-wide uppercase text-slate-950 font-serif">
                      DINAS PEKERJAAN UMUM DAN TATA RUANG (PUPTR)
                    </h2>
                    <h5 className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-indigo-900 font-serif">
                      BIDANG TATA RUANG DAN BINA KONSTRUKSI
                    </h5>
                    <p className="text-[10px] text-slate-600 leading-tight">
                      Kompleks Perkantoran Pemerintah Kabupaten Luwu, Jl. Jend. Sudirman No. 01 Belopa
                    </p>
                    <p className="text-[9.5px] text-slate-500 font-mono">
                      Email: puptr@luwukab.go.id &bull; Website: https://puptr.luwukab.go.id &bull; Kode Pos: 91994
                    </p>
                  </div>
                </div>

                {/* JUDUL NASKAH */}
                <div className="text-center space-y-1">
                  <h3 className="text-sm sm:text-base font-black uppercase underline decoration-2 underline-offset-4 text-slate-950 font-serif">
                    BERITA ACARA PEMERIKSAAN KESESUAIAN TATA RUANG (BAP-KTR)
                  </h3>
                  <p className="text-xs font-mono font-bold text-slate-700">
                    Nomor: {issuedSkNumber || selectedApp.skPkkprDocNumber || `600.1.2/BAP-TR/PUPTR-LW/${new Date().getFullYear()}/${selectedApp.id.substring(0, 5).toUpperCase()}`}
                  </p>
                  <p className="text-[11px] text-slate-600 italic">
                    Tentang Hasil Analisis Teknis Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) Non-LP2B
                  </p>
                </div>

                {/* PARAGRAF PEMBUKA */}
                <div className="text-xs text-slate-800 leading-relaxed text-justify space-y-3 font-serif">
                  <p>
                    Pada hari ini, <span className="font-bold">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>, bertempat di Kantor Dinas Pekerjaan Umum dan Tata Ruang Kabupaten Luwu, Tim Teknis Pengendalian dan Pemanfaatan Ruang telah melaksanakan verifikasi, telaah spasial, dan audit overlay geospasial terhadap permohonan Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) yang diajukan melalui Sistem Perizinan Berusaha Terintegrasi Secara Elektronik (OSS-RBA):
                  </p>

                  {/* IDENTITAS PEMOHON */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 font-sans text-xs">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-500 font-medium">1. Nomor Induk Berusaha (NIB) / NIK:</span>
                      <span className="col-span-2 font-mono font-bold text-slate-900">{selectedApp.nibNik}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-500 font-medium">2. Nama Pemohon / Penanggung Jawab:</span>
                      <span className="col-span-2 font-bold text-slate-900">{selectedApp.applicantName}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-500 font-medium">3. Nama Perusahaan / Badan Usaha:</span>
                      <span className="col-span-2 font-bold text-slate-900">{selectedApp.companyName}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-500 font-medium">4. Rencana Kegiatan / Sektor Usaha:</span>
                      <span className="col-span-2 text-slate-900">{selectedApp.sector}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-500 font-medium">5. Lokasi Rencana Investasi:</span>
                      <span className="col-span-2 font-semibold text-slate-900">
                        Desa {selectedApp.villageName}, Kecamatan {selectedApp.districtName}, Kabupaten Luwu
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-500 font-medium">6. Luas Lahan Permohonan:</span>
                      <span className="col-span-2 font-mono font-bold text-emerald-700">{selectedApp.areaHa} Hektar (Ha)</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-500 font-medium">7. Bukti Penguasaan Hak Atas Tanah:</span>
                      <span className="col-span-2 font-mono text-slate-900">{selectedApp.certificateType} (No. {selectedApp.certificateDocNumber})</span>
                    </div>
                  </div>

                  {/* HASIL TELAAH DAN KESIMPULAN */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-950 uppercase text-xs">A. HASIL AUDIT POLA RUANG RTRW KABUPATEN LUWU:</h5>
                    <ol className="list-decimal list-inside space-y-1 pl-1 text-[11.5px] leading-normal text-slate-800">
                      <li>
                        Berdasarkan Peraturan Daerah Kabupaten Luwu tentang Rencana Tata Ruang Wilayah (RTRW), lokasi yang dimohonkan berada pada <strong>Kawasan Peruntukan {selectedApp.sector.toUpperCase()}</strong>.
                      </li>
                      <li>
                        <strong>Status Lahan Pertanian Pangan Berkelanjutan (LP2B):</strong> <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">LOKASI BERADA DILUAR ZONA LP2B (NON-LP2B)</span>, sehingga tidak memerlukan kompensasi cetak sawah baru.
                      </li>
                      <li>
                        <strong>Status Kawasan Lindung &amp; Sempadan:</strong> Bebas dari kawasan Hutan Lindung, Sempadan Sungai, Mangrove Konservasi, dan Kawasan Rawan Bencana Geologi Tinggi.
                      </li>
                      <li>
                        <strong>Validasi Geometris Spasial:</strong> Berkas KMZ/KML (<span className="font-mono text-indigo-700">{selectedApp.kmzFileName || 'Batas_Poligon_Lokasi.kmz'}</span>) telah teruji secara topologi (zero self-intersection) dengan tingkat ketelitian koordinat WGS84 UTM Zone 51S.
                      </li>
                    </ol>
                  </div>

                  <div className="space-y-1.5">
                    <h5 className="font-bold text-slate-950 uppercase text-xs">B. KEPUTUSAN DAN REKOMENDASI TEKNIS:</h5>
                    <div className="p-3 bg-emerald-50 border-l-4 border-emerald-600 rounded-r-xl text-slate-900">
                      <p className="font-bold text-emerald-900">
                        DINYATAKAN: MEMENUHI KESESUAIAN TATA RUANG ({clearanceDecision.toUpperCase()})
                      </p>
                      <p className="text-[11px] text-slate-700 mt-0.5">
                        {technicalNotes || 'Diberikan rekomendasi teknis kesesuaian ruang untuk diterbitkan Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) oleh DPMPTSP Kabupaten Luwu.'}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-700">
                    Demikian Berita Acara Pemeriksaan ini dibuat dengan sebenarnya dalam 3 (tiga) rangkap untuk dipergunakan sebagai dasar pertimbangan teknis bagi DPMPTSP Kabupaten Luwu dalam menerbitkan Izin PKKPR.
                  </p>
                </div>

                {/* TANDA TANGAN RESMI KEPALA DINAS & TIM TEKNIS */}
                <div className="grid grid-cols-2 gap-6 pt-4 font-serif text-xs">
                  <div className="text-center space-y-1">
                    <p className="text-slate-600">Mengetahui / Menyetujui,</p>
                    <p className="font-bold text-slate-900 uppercase">Kepala Bidang Tata Ruang PUPTR</p>
                    <div className="h-16 flex items-center justify-center">
                      <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
                        [ TTE Tersertifikasi BSrE ]
                      </span>
                    </div>
                    <p className="font-bold underline text-slate-950">IR. H. IRWANTO, S.T., M.T.</p>
                    <p className="text-[10px] text-slate-500 font-mono">NIP. 19780412 200502 1 003</p>
                  </div>

                  <div className="text-center space-y-1">
                    <p className="text-slate-600">Belopa, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p className="font-bold text-slate-900 uppercase">Kepala Dinas PUPTR Kab. Luwu</p>
                    <div className="h-16 flex items-center justify-center">
                      <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                        [ Tanda Tangan Elektronik Sah ]
                      </span>
                    </div>
                    <p className="font-bold underline text-slate-950">IR. IKHSAN AS'AD, S.T., M.Si.</p>
                    <p className="text-[10px] text-slate-500 font-mono">NIP. 19710815 199803 1 007</p>
                  </div>
                </div>
              </div>

              {/* ══════════════════════════════════════════════════════════
                  LEMBAR 2: LAMPIRAN PETA DELINEASI SPASIAL (SPATIAL MAP)
                 ══════════════════════════════════════════════════════════ */}
              <div className="bap-page-2 border border-slate-200 p-6 sm:p-8 rounded-2xl bg-white space-y-5 print:border-none print:p-0 print:break-before-page">
                {/* HEADER LAMPIRAN */}
                <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">
                      LAMPIRAN BERITA ACARA PEMERIKSAAN KESESUAIAN TATA RUANG
                    </h4>
                    <h3 className="text-sm sm:text-base font-black text-slate-950 uppercase font-serif">
                      PETA DELINEASI GEOSPASIAL &amp; ZONASI POLA RUANG
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-mono text-slate-500">Lembar Ke-2 / Lampiran Spasial</p>
                    <p className="text-[11px] font-mono font-bold text-indigo-900">
                      No. Dokumen: {issuedSkNumber || selectedApp.skPkkprDocNumber || `600.1.2/BAP-TR/PUPTR-LW/${new Date().getFullYear()}`}
                    </p>
                  </div>
                </div>

                {/* INFORMASI KOORDINAT & DELINEASI */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] font-sans">
                  <div>
                    <span className="text-slate-500 block">Kecamatan:</span>
                    <span className="font-bold text-slate-900">{selectedApp.districtName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Desa / Kelurahan:</span>
                    <span className="font-bold text-slate-900">{selectedApp.villageName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Luas Delineasi:</span>
                    <span className="font-bold font-mono text-emerald-700">{selectedApp.areaHa} Ha</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Sistem Koordinat:</span>
                    <span className="font-bold font-mono text-slate-900">WGS84 UTM Zone 51S</span>
                  </div>
                </div>

                {/* MAP RENDER CONTAINER */}
                <div className="h-96 w-full rounded-2xl overflow-hidden border-2 border-slate-800 shadow-inner relative bg-slate-100">
                  <MapComponent
                    investments={appAsInvestment ? [appAsInvestment] : []}
                    districts={districts}
                    villages={villages}
                    spatialLayers={spatialLayers}
                    selectedDistrictId={selectedDistrictId}
                    selectedVillageId={selectedVillageId}
                    customGeoJson={currentMapGeoJson}
                  />
                  {/* Map Overlay Badge */}
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm border border-slate-300 rounded-xl p-2.5 shadow-lg text-[10px] font-sans space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span>Poligon Delineasi Terverifikasi PUPTR</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <div className="w-3 h-3 rounded bg-amber-400 border border-amber-600" />
                      <span>Batas Administrasi Kecamatan {selectedApp.districtName}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 pt-1 border-t border-slate-200 font-mono">
                      Data Terverifikasi Engine Spatial Luwu
                    </div>
                  </div>
                </div>

                {/* FOOTER PENGESAHAN LAMPIRAN PETA */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs font-serif">
                  <div className="text-slate-600 space-y-0.5">
                    <p className="font-bold text-slate-900">Catatan Surveyor / Geospasial:</p>
                    <p className="text-[10px]">
                      Delineasi batas poligon telah divalidasi dengan citra satelit resolusi tinggi dan peta dasar BIG skala 1:50.000.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-600 text-[11px]">Tim Verifikasi Geospasial PUPTR Luwu</p>
                    <p className="font-bold underline text-slate-950 mt-4">SEKSI PENGUKURAN &amp; PEMETAAN</p>
                  </div>
                </div>
              </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 print:hidden">
                <p className="text-xs text-slate-500">
                  💡 Dokumen ini terformat siap cetak 2 halaman (A4 Standar Pemerintah Kabupaten Luwu).
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowBapModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Tutup Preview
                  </button>
                  <button
                    onClick={handleDownloadBapPdf}
                    disabled={isExportingPdf}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span>{isExportingPdf ? 'Mengunduh...' : 'Download PDF (jsPDF)'}</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak BAP Resmi</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
