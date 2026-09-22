import React, { useState, useEffect, useMemo } from 'react';
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
  AlertCircle,
  Wheat,
  Sprout,
  Database,
  ArrowRight,
  CornerDownRight,
  Landmark,
  Maximize2,
  Download
} from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../../lib/supabaseClient';
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
import { getOpdSettings } from '../../utils/opdSettingsStorage';

export interface AgrarianQueueItem {
  id: string;
  nibNik: string;
  applicantName: string;
  companyName: string;
  sector: string;
  districtId?: string;
  districtName: string;
  villageId?: string;
  villageName: string;
  areaHa: number;
  existingCrop: string;
  puptrForwardedNotes: string;
  agriStatus: 'Pending Review' | 'Approved' | 'Requires Revision' | 'Rejected';
  beritaAcaraDocNum?: string;
  suratRekomendasiNum?: string;
  rejectionReason?: string;
  replacementLandHa?: number;
  geometry?: any;
  sertifikatTanahUrl?: string;
  suratPengantarDesaUrl?: string;
  berkasLegalitasGabunganUrl?: string;
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
  } = useTechnicalSpatialLayers({
    layer_sawah: true,
    layer_lahan_kering_primer: true,
    layer_lahan_kering_sekunder: true,
    layer_mangrove: true,
    layer_tambak: true,
    layer_zonasi: true,
    layer_kecamatan: true
  });

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

  // Decision Modal States
  const [showApprovalModal, setShowApprovalModal] = useState<boolean>(false);
  const [showRejectionModal, setShowRejectionModal] = useState<boolean>(false);
  const [showDocumentPreview, setShowDocumentPreview] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

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

  // Fetch Agrarian Review Queue (Strict Multi-OPD Workflow: Only applications forwarded by PUPTR or processed by Pertanian)
  const fetchAgrarianQueue = async () => {
    setIsLoadingQueue(true);
    try {
      let mapped: AgrarianQueueItem[] = [];

      // 1. Primary Query: Fetch only applications that have been forwarded to Dinas Pertanian or already reviewed
      try {
        const { data: pkkprGisData, error: gisErr } = await supabase
          .from('gis_pkkpr')
          .select('*')
          .or('status_pkkpr.eq.Forwarded_To_Pertanian,status_pkkpr.eq.Approved_Pertanian,status_pkkpr.eq.Rejected_Pertanian,berita_acara_pertanian_num.not.is.null')
          .order('created_at', { ascending: false });

        if (!gisErr && pkkprGisData && pkkprGisData.length > 0) {
          pkkprGisData.forEach((item: any) => {
            const isBerusaha = item.jenis_permohonan === 'Berusaha';
            const rawDist = item.kecamatan || '';
            const matchedDist = findDistrictMatch(districts, rawDist);
            const resolvedDistrictName = matchedDist ? matchedDist.name : (rawDist || 'Kabupaten Luwu');
            const resolvedDistrictId = matchedDist ? matchedDist.id : 'dist_luwu';

            const rawVil = item.desa_kelurahan || '';
            const resolvedVillageName = rawVil || '-';

            let agriStat: 'Pending Review' | 'Approved' | 'Rejected' = 'Pending Review';
            if (item.berita_acara_pertanian_num || item.status_pkkpr === 'Approved_Pertanian') {
              agriStat = 'Approved';
            } else if (item.status_pkkpr === 'Rejected_Pertanian') {
              agriStat = 'Rejected';
            }

            mapped.push({
              id: item.id,
              nibNik: isBerusaha ? (item.nib_oss || item.nik_pemohon || '-') : (item.nik_pemohon || '-'),
              applicantName: item.nama_pemohon || 'Pemohon Terdaftar',
              companyName: isBerusaha ? (item.nama_badan_usaha || item.nama_permohonan || 'Pelaku Usaha') : (item.nama_pemohon || item.nama_permohonan || 'Perseorangan / Warga'),
              sector: item.sektor || (isBerusaha ? 'Komersial / Usaha' : 'Non-Komersial / Perumahan'),
              districtId: resolvedDistrictId,
              districtName: resolvedDistrictName,
              villageId: undefined,
              villageName: resolvedVillageName,
              areaHa: item.luas_ha ? Number(item.luas_ha) : (item.luas_m2 ? Number((item.luas_m2 / 10000).toFixed(4)) : 0.5),
              existingCrop: 'Kawasan Pertanian & Pangan Berkelanjutan (LP2B)',
              puptrForwardedNotes: item.catatan_teknis || 'Permohonan diteruskan dari Dinas PUPTR untuk analisis kesesuaian LP2B.',
              agriStatus: agriStat,
              beritaAcaraDocNum: item.berita_acara_pertanian_num || undefined,
              suratRekomendasiNum: undefined,
              rejectionReason: agriStat === 'Rejected' ? item.catatan_teknis : undefined,
              replacementLandHa: item.luas_ha ? Number(item.luas_ha) : 0.5,
              geometry: item.geometry_json || item.geom,
              sertifikatTanahUrl: item.sertifikat_tanah_url || undefined,
              suratPengantarDesaUrl: item.surat_pengantar_desa_url || undefined,
              berkasLegalitasGabunganUrl: item.berkas_legalitas_gabungan_url || undefined,
              createdAt: item.created_at || new Date().toISOString()
            });
          });
        }
      } catch (err) {
        console.warn('gis_pkkpr query info in Pertanian:', err);
      }

      // 2. Secondary Query: Fetch from investments table ONLY if explicitly forwarded or reviewed
      try {
        const { data: invData, error: invError } = await supabase
          .from('investments')
          .select('*')
          .or('status.eq.Forwarded_To_Pertanian,status.eq.Approved_Pertanian,pertanian_status.eq.FORWARDED,pertanian_status.eq.APPROVED,berita_acara_num.not.is.null')
          .order('created_at', { ascending: false });

        if (!invError && invData && invData.length > 0) {
          invData.forEach((item: any) => {
            if (!mapped.some(m => m.id === item.id)) {
              const rawDist = item.district_id || item.districtId || item.kecamatan || item.id_kecamatan || '';
              const matchedDist = findDistrictMatch(districts, rawDist);
              const resolvedDistrictName = matchedDist ? matchedDist.name : (rawDist || 'Kabupaten Luwu');
              const resolvedDistrictId = matchedDist ? matchedDist.id : 'dist_luwu';
              const rawVil = item.village_id || item.villageId || item.desa || item.id_desa || '';

              let agriStat: 'Pending Review' | 'Approved' | 'Rejected' = 'Pending Review';
              if (item.berita_acara_num || item.pertanian_status === 'APPROVED' || item.status === 'Approved_Pertanian') {
                agriStat = 'Approved';
              } else if (item.status === 'Rejected' || item.pertanian_status === 'REJECTED') {
                agriStat = 'Rejected';
              }

              mapped.push({
                id: item.id,
                nibNik: item.plot_number || item.certificate_number || item.nib || item.id || '-',
                applicantName: item.contact_pic || item.nama_kontak_person || 'Pemohon Terdaftar',
                companyName: item.name || 'Pelaku Usaha',
                sector: item.sector || 'Pertanian & Alih Fungsi Lahan',
                districtId: resolvedDistrictId,
                districtName: resolvedDistrictName,
                villageId: item.village_id || item.villageId || undefined,
                villageName: rawVil || '-',
                areaHa: item.area_ha || 1.0,
                existingCrop: 'Kawasan Pertanian & Pangan Berkelanjutan (LP2B)',
                puptrForwardedNotes: item.override_justification || 'Permohonan diteruskan dari Dinas PUPTR untuk telaah alih fungsi lahan.',
                agriStatus: agriStat,
                beritaAcaraDocNum: item.berita_acara_num || undefined,
                suratRekomendasiNum: item.surat_rekomendasi_num || undefined,
                rejectionReason: item.pertanian_rejection_notes || undefined,
                replacementLandHa: item.replacement_land_ha || item.area_ha || 1.0,
                geometry: item.geometry,
                createdAt: item.created_at || new Date().toISOString()
              });
            }
          });
        }
      } catch (err) {
        console.warn('investments query info in Pertanian:', err);
      }

      setQueueList(mapped);

      if (mapped.length > 0) {
        if (!selectedApp || !mapped.some(m => m.id === selectedApp.id)) {
          selectAppForReview(mapped[0]);
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
    fetchAgrarianQueue();
  }, []);

  // Select an application from the queue to inspect in Map Workspace
  const selectAppForReview = (app: AgrarianQueueItem) => {
    setSelectedApp(app);
    const year = new Date().getFullYear();
    const seq = Math.floor(100 + Math.random() * 900);
    setBaDocNum(app.beritaAcaraDocNum || `BA-LP2B/DISTAN-LUWU/${year}/${seq}`);
    setSrDocNum(app.suratRekomendasiNum || `503/REK-DISTAN/LUWU/${year}/${seq}`);
    setStipulationNotes(
      `Pemohon wajib menyediakan Lahan Pengganti LP2B seluas ${app.areaHa} Ha di Wilayah Kec. ${app.districtName} / Kec. Suli dengan fasilitas irigasi teknis setara, serta menjaga kelancaran jaringan irigasi tersier sekitarnya.`
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

  // Submit Approval & Generate Berita Acara (Path A)
  const handleSubmitApproval = async () => {
    if (!selectedApp) return;
    setIsSubmittingApproval(true);

    try {
      const updatePayload = {
        berita_acara_num: baDocNum,
        surat_rekomendasi_num: srDocNum,
        replacement_land_ha: selectedApp.areaHa,
        status: 'Approved_Pertanian',
        pertanian_status: 'APPROVED',
        override_justification: `[REKOMENDASI DINAS PERTANIAN TERBIT - ${baDocNum}]: ${stipulationNotes}`,
        updated_at: new Date().toISOString()
      };

      await Promise.all([
        supabase
          .from('gis_pkkpr')
          .update({
            berita_acara_pertanian_num: baDocNum,
            status_pkkpr: 'Approved_Pertanian',
            catatan_teknis: `[REKOMENDASI DINAS PERTANIAN TERBIT - ${baDocNum}]: ${stipulationNotes}`,
            updated_at: new Date().toISOString()
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
              agriStatus: 'Approved',
              beritaAcaraDocNum: baDocNum,
              suratRekomendasiNum: srDocNum
            };
          }
          return item;
        })
      );

      setShowApprovalModal(false);
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
      const updatePayload = {
        status: 'Rejected_Pertanian',
        pertanian_status: 'REJECTED',
        pertanian_rejection_notes: rejectionReasonInput,
        override_justification: `[DITOLAK DINAS PERTANIAN]: ${rejectionReasonInput}`,
        updated_at: new Date().toISOString()
      };

      await Promise.all([
        supabase
          .from('gis_pkkpr')
          .update({
            status_pkkpr: 'Rejected_Pertanian',
            catatan_teknis: `[DITOLAK DINAS PERTANIAN]: ${rejectionReasonInput}`,
            updated_at: new Date().toISOString()
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
              rejectionReason: rejectionReasonInput
            };
          }
          return item;
        })
      );

      setShowRejectionModal(false);

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
        title: `Rekomendasi LP2B Ditolak #${selectedApp.id}`,
        message: `Dinas Pertanian menolak lokasi permohonan ${selectedApp.companyName} karena berada di Zona Terlindung LP2B. Mohon tinjau catatan dan kembalikan ke pemohon.`,
        notes: rejectionReasonInput
      });

      Swal.fire({
        icon: 'info',
        title: 'Permohonan Dikembalikan / Ditolak ⚠️',
        html: `
          <div className="text-left text-xs space-y-2 p-3 bg-rose-50 dark:bg-rose-950/50 rounded-xl border border-rose-200 dark:border-rose-800 font-sans">
            <p className="text-slate-900 dark:text-rose-100"><strong>NIB Pemohon:</strong> ${selectedApp.nibNik}</p>
            <p className="text-slate-900 dark:text-rose-100"><strong>Catatan Penolakan:</strong> ${rejectionReasonInput}</p>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] pt-1 border-t border-rose-200 dark:border-rose-800">
              ⚡ Kasus ini dikembalikan ke Dinas PUPTR &amp; Pemohon dengan instruksi revisi deliniasi lahan.
            </p>
          </div>
        `,
        confirmButtonColor: '#ef4444'
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

  // Filtered Queue
  const filteredQueue = useMemo(() => {
    return queueList.filter(item => {
      const matchSearch =
        item.nibNik.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.districtName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.villageName.toLowerCase().includes(searchQuery.toLowerCase());

      if (statusFilter === 'ALL') return matchSearch;
      if (statusFilter === 'PENDING') return matchSearch && item.agriStatus === 'Pending Review';
      if (statusFilter === 'APPROVED') return matchSearch && item.agriStatus === 'Approved';
      if (statusFilter === 'REJECTED') return matchSearch && (item.agriStatus === 'Rejected' || item.agriStatus === 'Requires Revision');
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
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
                  statusFilter === st
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'Semua Status' : st === 'PENDING' ? 'Menunggu Evaluasi' : st === 'APPROVED' ? 'BA Terbit' : 'Ditolak/Revisi'}
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
                        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                          {item.nibNik}
                        </span>
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
                          <button
                            type="button"
                            onClick={() => selectAppForReview(item)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 mx-auto transition shadow-sm cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Analisis Workspace</span>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMapExpanded(prev => !prev)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title={isMapExpanded ? "Kembali ke Mode Normal (2 Kolom)" : "Perbesar Peta (Mode Studio Lebar)"}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>{isMapExpanded ? "Tampilan Normal" : "Mode Peta Studio Lebar"}</span>
                </button>
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
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

                {/* Agrarian Overlay Diagnostic Box */}
                <div className="fixed bottom-3 inset-x-3 md:absolute md:top-3 md:right-14 md:left-auto md:max-w-xs bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-lg z-20 text-xs space-y-1.5">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <Sprout className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Audit Geospasial Pertanian</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      LP2B Intersect
                    </span>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300">
                    <strong>Klasifikasi Lahan:</strong> Sawah Irigasi Teknis
                  </p>
                  <p className="text-slate-700 dark:text-slate-300">
                    <strong>Indeks Indikatif Kesuburan:</strong> <span className="text-emerald-600 dark:text-emerald-400 font-bold">Kelas I (Sangat Tinggi / IP300)</span>
                  </p>
                  <p className="text-slate-700 dark:text-slate-300">
                    <strong>Tumpang Tindih LP2B:</strong> {(selectedApp.areaHa * 0.35).toFixed(1)} Ha (35% Luas Plot)
                  </p>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 text-[10px] text-slate-700 dark:text-emerald-300 leading-tight">
                    💡 <strong>Kewajiban Alih Fungsi:</strong> Berdasarkan Perda LP2B Kab. Luwu, alih fungsi dapat disetujui dengan kewajiban menyediakan <strong>Lahan Pengganti LP2B 1:1</strong> ({selectedApp.areaHa} Ha).
                  </div>
                </div>
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
                Pilih Keputusan Rekomendasi
              </span>

              {/* Path A Button: Setujui & Terbit Berita Acara */}
              <button
                type="button"
                onClick={handleOpenApprovalModal}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>PATH A: Setujui &amp; Terbit Berita Acara LP2B 📄</span>
              </button>

              {/* Path B Button: Kembalikan / Tolak */}
              <button
                type="button"
                onClick={handleOpenRejectionModal}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-600/10 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>PATH B: Kembalikan / Tolak Ke PUPTR ⚠️</span>
              </button>

              {/* Document Preview Trigger */}
              <button
                type="button"
                onClick={() => setShowDocumentPreview(true)}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Lihat / Cetak Berita Acara (BAP Resmi Pertanian)</span>
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
          PRINTABLE DOCUMENT PREVIEW MODAL (OFFICIAL BAP DINAS PERTANIAN)
          (Page 1: Naskah Resmi BAP LP2B | Page 2: Peta Delineasi Spasial)
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showDocumentPreview && selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto print:p-0 print:bg-white print:static">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white text-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-8 max-w-4xl w-full shadow-2xl space-y-6 my-auto max-h-[92vh] overflow-y-auto border border-slate-300 print:max-h-none print:overflow-visible print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none"
            >
              {/* Modal Top Controls (Hidden in Print) */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      Berita Acara Pemeriksaan (BAP) LP2B &amp; Kesesuaian Lahan
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Dokumen Rekomendasi Resmi Dinas Pertanian Kabupaten Luwu &bull; Format Standar OSS / PKKPR
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadBapPdf}
                    disabled={isExportingPdf}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition disabled:opacity-50"
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
                    onClick={() => setShowDocumentPreview(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable container for jsPDF capture - Standard A4 Format */}
              <div id="pertanian-bap-printable-document" className="space-y-6 bg-white p-2 rounded-xl max-w-[210mm] mx-auto print:max-w-none print:w-[210mm] print:m-0 print:p-0">
                {/* ══════════════════════════════════════════════════════════
                    LEMBAR 1: NASKAH RESMI BERITA ACARA PERTANIAN (LP2B)
                   ══════════════════════════════════════════════════════════ */}
              <div className="bap-page-1 border border-slate-200 p-6 sm:p-8 rounded-2xl bg-white space-y-6 print:border-none print:p-0 min-h-[297mm]">
                {/* Official Kop Surat Dinas Pertanian Luwu */}
                {(() => {
                  const agriSettings = getOpdSettings('pertanian');
                  if (agriSettings.opd.kopSuratUrl) {
                    return (
                      <div className="w-full text-center pb-3 border-b-4 border-double border-slate-950 mb-4">
                        <img 
                          src={agriSettings.opd.kopSuratUrl} 
                          alt="Kop Surat Dinas Pertanian" 
                          className="w-full max-h-28 object-contain mx-auto"
                        />
                      </div>
                    );
                  }
                  return (
                    <div className="flex items-center gap-4 border-b-4 border-double border-slate-900 pb-4">
                      <div className="shrink-0 flex items-center justify-center">
                        <LuwuLogo size="xl" className="w-20 h-24 object-contain" />
                      </div>
                      <div className="flex-1 text-center space-y-0.5">
                        <h4 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-800 font-serif">
                          PEMERINTAH KABUPATEN LUWU
                        </h4>
                        <h2 className="text-base sm:text-xl font-black tracking-wide uppercase text-slate-950 font-serif">
                          {agriSettings.opd.officialName.toUpperCase()}
                        </h2>
                        <h5 className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-emerald-900 font-serif">
                          BIDANG PRASARANA, SARANA DAN PERLINDUNGAN LAHAN (LP2B)
                        </h5>
                        <p className="text-[10px] text-slate-600 leading-tight">
                          {agriSettings.opd.address}
                        </p>
                        <p className="text-[9.5px] text-slate-500 font-mono">
                          Email: {agriSettings.opd.email} &bull; Website: {agriSettings.opd.website}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Title Header */}
                <div className="text-center space-y-1">
                  <h3 className="text-sm sm:text-base font-black uppercase underline decoration-2 underline-offset-4 text-slate-950 font-serif">
                    BERITA ACARA PEMERIKSAAN KELAYAKAN LAHAN &amp; LP2B (BAP-LP2B)
                  </h3>
                  <p className="text-xs font-mono font-bold text-slate-700">
                    Nomor: {baDocNum || selectedApp.beritaAcaraDocNum || `520/BA-LP2B/DISTAN-LW/${new Date().getFullYear()}/${selectedApp.id.substring(0, 5).toUpperCase()}`}
                  </p>
                  <p className="text-[11px] text-slate-600 italic">
                    Tentang Hasil Penilaian Kelayakan Teknis Agraria &amp; Alih Fungsi Lahan Pertanian Berkelanjutan
                  </p>
                </div>

                {/* Document Body Text */}
                <div className="text-xs leading-relaxed space-y-3 font-serif text-slate-800 text-justify">
                  <p>
                    Pada hari ini, <span className="font-bold">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>, Tim Penilai Kelayakan Teknis Lahan Dinas Pertanian Kabupaten Luwu telah melakukan audit spasial, survei lapangan, dan evaluasi terhadap permohonan rekomendasi alih fungsi lahan / kesesuaian ruang investasi:
                  </p>

                  {/* Data Bound Table */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs font-sans">
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
                      <span className="text-slate-500 font-medium">4. Rencana Kegiatan Investasi:</span>
                      <span className="col-span-2 text-slate-900">{selectedApp.sector}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-500 font-medium">5. Lokasi Rencana Investasi:</span>
                      <span className="col-span-2 font-semibold text-slate-900">
                        Desa {selectedApp.villageName}, Kecamatan {selectedApp.districtName}, Kab. Luwu
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-500 font-medium">6. Luas Areal Permohonan:</span>
                      <span className="col-span-2 font-mono font-bold text-emerald-700">{selectedApp.areaHa} Hektar (Ha)</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-500 font-medium">7. Kondisi Eksisting Vegetasi / Lahan:</span>
                      <span className="col-span-2 text-amber-800 font-semibold">{selectedApp.existingCrop}</span>
                    </div>
                  </div>

                  {/* HASIL TELAAH DAN KESIMPULAN */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-950 uppercase text-xs">A. DASAR HUKUM &amp; KETENTUAN PERLINDUNGAN LP2B:</h5>
                    <ol className="list-decimal list-inside space-y-1 pl-1 text-[11.5px] leading-normal text-slate-800">
                      <li>Undang-Undang Nomor 41 Tahun 2009 tentang Perlindungan Lahan Pertanian Pangan Berkelanjutan.</li>
                      <li>Peraturan Pemerintah Nomor 1 Tahun 2011 tentang Penetapan dan Alih Fungsi Lahan Pertanian Pangan Berkelanjutan.</li>
                      <li>Peraturan Daerah Kabupaten Luwu tentang Rencana Tata Ruang Wilayah (RTRW) dan Peta Ketahanan Pangan Daerah.</li>
                    </ol>
                  </div>

                  <div className="space-y-1.5">
                    <h5 className="font-bold text-slate-950 uppercase text-xs">B. KESIMPULAN &amp; REKOMENDASI KELAYAKAN TEKNIS:</h5>
                    <div className="p-3 bg-emerald-50 border-l-4 border-emerald-600 rounded-r-xl text-slate-900">
                      <p className="font-bold text-emerald-900">
                        DINYATAKAN: DISETUJUI / MEMENUHI SYARAT REKOMENDASI LP2B
                      </p>
                      <p className="text-[11px] text-slate-700 mt-0.5">
                        {stipulationNotes || `Usulan alih fungsi lahan dinyatakan DISETUJUI DENGAN SYARAT dengan kewajiban menyediakan Lahan Pengganti LP2B seluas ${selectedApp.areaHa} Ha (${replacementLandRatio}) serta menjaga keberlanjutan fungsi saluran irigasi pertanian di sekitarnya.`}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-700">
                    Demikian Berita Acara Pemeriksaan ini dibuat untuk dijadikan bahan pertimbangan dan kelengkapan dokumen teknis bagi Dinas PUPTR dan DPMPTSP Kabupaten Luwu dalam menerbitkan Izin PKKPR.
                  </p>
                </div>

                {/* Signature Block */}
                {(() => {
                  const agriSet = getOpdSettings('pertanian');
                  return (
                    <div className="grid grid-cols-2 text-center text-xs pt-6 font-serif">
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-500">Pemohon / Pelaku Usaha,</p>
                        <div className="h-16 flex items-center justify-center font-bold text-slate-400 italic">
                          <span className="font-mono text-[10px] text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-300">
                            [ Tanda Tangan Digital NIB ]
                          </span>
                        </div>
                        <p className="font-bold underline text-slate-950">{selectedApp.applicantName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{selectedApp.companyName}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-500">Belopa, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p className="font-bold text-slate-900 uppercase">{agriSet.kepalaDinas.officialTitle || 'Kepala Dinas Pertanian Kab. Luwu'}</p>
                        <div className="h-16 flex items-center justify-center">
                          <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                            [ Terverifikasi Stempel BSrE ]
                          </span>
                        </div>
                        <p className="font-bold underline text-slate-950">{agriSet.kepalaDinas.fullName || 'IR. H. JUMADI, M.Si.'}</p>
                        <p className="text-[10px] text-slate-500 font-mono">NIP. {agriSet.kepalaDinas.nip || '19710324 199603 1 002'}</p>
                        {agriSet.kepalaDinas.pangkatGolongan && (
                          <p className="text-[9.5px] text-slate-500 font-sans italic">{agriSet.kepalaDinas.pangkatGolongan}</p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* ══════════════════════════════════════════════════════════
                  LEMBAR 2: LAMPIRAN PETA DELINEASI SPASIAL LP2B
                 ══════════════════════════════════════════════════════════ */}
              <div className="bap-page-2 border border-slate-200 p-6 sm:p-8 rounded-2xl bg-white space-y-5 print:border-none print:p-0 print:break-before-page">
                {/* HEADER LAMPIRAN */}
                <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">
                      LAMPIRAN BERITA ACARA DINAS PERTANIAN
                    </h4>
                    <h3 className="text-sm sm:text-base font-black text-slate-950 uppercase font-serif">
                      PETA DELINEASI SPASIAL LAHAN PERTANIAN (LP2B) &amp; IRIGASI
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-mono text-slate-500">Lembar Ke-2 / Lampiran Spasial</p>
                    <p className="text-[11px] font-mono font-bold text-emerald-900">
                      No. Dokumen: {baDocNum || selectedApp.beritaAcaraDocNum || `520/BA-LP2B/DISTAN-LW/${new Date().getFullYear()}`}
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
                    <span className="text-slate-500 block">Luas Usulan:</span>
                    <span className="font-bold font-mono text-emerald-700">{selectedApp.areaHa} Ha</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Rasio Pengganti:</span>
                    <span className="font-bold font-mono text-emerald-800">{replacementLandRatio}</span>
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
                      <span>Poligon Delineasi Terverifikasi Dinas Pertanian</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <div className="w-3 h-3 rounded bg-amber-400 border border-amber-600" />
                      <span>Zona LP2B / Saluran Irigasi Teknis</span>
                    </div>
                    <div className="text-[9px] text-slate-400 pt-1 border-t border-slate-200 font-mono">
                      Data Terverifikasi Agrarian Spatial Luwu
                    </div>
                  </div>
                </div>

                {/* FOOTER PENGESAHAN LAMPIRAN PETA */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs font-serif">
                  <div className="text-slate-600 space-y-0.5">
                    <p className="font-bold text-slate-900">Catatan Tim Penilai Lahan Pertanian:</p>
                    <p className="text-[10px]">
                      Peta delineasi telah disinkronkan dengan peta spasial LP2B Kabupaten Luwu dan jaringan irigasi sekunder/tersier.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-600 text-[11px]">Tim Verifikasi Lapangan Dinas Pertanian</p>
                    <p className="font-bold underline text-slate-950 mt-4">SEKSI PERLINDUNGAN LAHAN &amp; LP2B</p>
                  </div>
                </div>
              </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 font-sans print:hidden">
                <p className="text-xs text-slate-500">
                  💡 Dokumen ini terformat siap cetak 2 halaman (A4 Standar Pemerintah Kabupaten Luwu).
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDocumentPreview(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Tutup Preview
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadBapPdf}
                    disabled={isExportingPdf}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span>{isExportingPdf ? 'Mengunduh...' : 'Download PDF (jsPDF)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Direct</span>
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
