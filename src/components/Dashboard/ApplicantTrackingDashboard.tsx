import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Building2, 
  MapPin, 
  FileText, 
  Download, 
  ExternalLink, 
  Shield, 
  Check, 
  ChevronRight, 
  Eye, 
  QrCode, 
  Copy, 
  RefreshCw, 
  Share2, 
  ArrowRight, 
  FileCheck2, 
  Layers, 
  Activity, 
  HelpCircle,
  FileSpreadsheet,
  Wheat,
  Scale,
  Upload,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import Swal from 'sweetalert2';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { supabase } from '../../lib/supabaseClient';
import { PkkprStatusPermohonan, WORKFLOW_STATUS_CONFIG, normalizeWorkflowStatus, PKKPRStatus, normalizePKKPRStatus } from '../../types/pkkprWorkflow';
import { generateSkPkkprPdf } from '../../utils/skPkkprPdfGenerator';
import { formatRupiah } from '../../lib/formatters';
import { OFFICIAL_LUWU_LOGO_URL } from '../LuwuLogo';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

// ─── Interfaces ─────────────────────────────────────────────────────────────
export interface PkkprApplicationRecord {
  id: string;
  nomor_permohonan: string;
  pemohon_name: string;
  pemohon_email?: string;
  pemohon_phone?: string;
  nama_kegiatan: string;
  sektor_kegiatan?: string;
  desa_name?: string;
  kecamatan_name?: string;
  status_permohonan: PkkprStatusPermohonan;
  status_pkkpr?: PKKPRStatus;
  catatan_revisi?: string | null;
  luas_m2?: number;
  luas_ha?: number;
  geom?: any;
  geometry_json?: any;
  berita_acara_pertanian_num?: string;
  surat_rekomendasi_pertanian_num?: string;
  bap_penolakan_url?: string;
  bap_pertek_url?: string;
  pertek_puptr_num?: string;
  bap_ktr_data?: any;
  sk_pkkpr_num?: string;
  tte_document_url?: string;
  is_tte_signed?: boolean;
  catatan_teknis?: string;
  override_justification?: string;
  created_at: string;
  updated_at: string;
}

export interface PkkprAuditLogItem {
  id: string;
  permohonan_id: string;
  nomor_permohonan?: string;
  old_status?: string;
  new_status: string;
  action_type: string;
  changed_by?: string;
  changed_by_user_id?: string;
  changed_by_role?: string;
  changed_by_email?: string;
  notes?: string;
  metadata?: any;
  timestamp: string;
}

interface ApplicantTrackingDashboardProps {
  initialTrackingNumber?: string;
  onNavigateToForm?: () => void;
  isEmbedded?: boolean;
}

const LUWU_CENTER: [number, number] = [120.25, -3.05];

export const ApplicantTrackingDashboard: React.FC<ApplicantTrackingDashboardProps> = ({
  initialTrackingNumber = '',
  onNavigateToForm,
  isEmbedded = false
}) => {
  // ─── States ───────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState(initialTrackingNumber);
  const [selectedApplication, setSelectedApplication] = useState<PkkprApplicationRecord | null>(null);
  const [userApplications, setUserApplications] = useState<PkkprApplicationRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<PkkprAuditLogItem[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [realtimeNotification, setRealtimeNotification] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'map' | 'documents' | 'history'>('timeline');

  // Map Container Ref
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  // QR Code Data URL State
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  // Current logged in user info
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Revision & Re-upload state
  const [isReuploadModalOpen, setIsReuploadModalOpen] = useState(false);
  const [revisiNotesInput, setRevisiNotesInput] = useState('');
  const [revisiFileName, setRevisiFileName] = useState('');
  const [revisiFileDataUrl, setRevisiFileDataUrl] = useState<string | null>(null);
  const [isSubmittingRevisi, setIsSubmittingRevisi] = useState(false);

  // ─── Initial Load & Auth Resolution ───────────────────────────────────────
  useEffect(() => {
    async function initUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser(session.user);
          fetchUserApplications(session.user.id, session.user.email);
        } else {
          // If not logged in, search by initialTrackingNumber if provided
          if (initialTrackingNumber) {
            handleSearchByQuery(initialTrackingNumber);
          }
        }
      } catch (err) {
        console.warn('[ApplicantTracking] Auth fetch note:', err);
      }
    }
    initUser();
  }, [initialTrackingNumber]);

  // ─── Fetch User Applications from Supabase (SSOT) ──────────────────────────
  const fetchUserApplications = async (userId?: string, userEmail?: string) => {
    setIsLoadingList(true);
    try {
      let query = supabase
        .from('pkkpr_permohonan')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.or(`user_id.eq.${userId},pemohon_email.eq.${userEmail || ''}`);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        const normalized = data.map((item: any) => ({
          ...item,
          status_permohonan: normalizeWorkflowStatus(
            item.status_permohonan, 
            item.pertanian_status, 
            item.pertek_puptr_num, 
            item.sk_pkkpr_num
          )
        }));
        setUserApplications(normalized);
        if (!selectedApplication) {
          setSelectedApplication(normalized[0]);
        }
      } else {
        // Fallback check on gis_pkkpr table
        const { data: gisData } = await supabase
          .from('gis_pkkpr')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (gisData && gisData.length > 0) {
          const mappedGis: PkkprApplicationRecord[] = gisData.map((g: any) => ({
            id: g.id,
            nomor_permohonan: g.nomor_registrasi || g.nomor_permohonan || `REG-${g.id?.slice(0, 8)}`,
            pemohon_name: g.nama_pemohon || g.nama || 'Pemohon InvestLuwu',
            pemohon_email: g.email,
            pemohon_phone: g.telepon || g.no_whatsapp,
            nama_kegiatan: g.nama_kegiatan || g.judul_proyek || 'Kegiatan Pemanfaatan Ruang',
            sektor_kegiatan: g.sektor || 'Industri & Investasi',
            desa_name: g.desa_kelurahan || g.desa,
            kecamatan_name: g.kecamatan,
            status_permohonan: normalizeWorkflowStatus(g.status_permohonan || g.status_pkkpr, g.pertanian_status, g.pertek_puptr_num, g.sk_pkkpr_num),
            luas_m2: g.luas_m2 || 0,
            luas_ha: g.luas_ha || 0,
            geom: g.geom || g.geometry,
            geometry_json: g.geometry_json || g.geom,
            berita_acara_pertanian_num: g.berita_acara_pertanian_num,
            surat_rekomendasi_pertanian_num: g.surat_rekomendasi_pertanian_num,
            bap_penolakan_url: g.bap_penolakan_url,
            bap_pertek_url: g.bap_pertek_url,
            pertek_puptr_num: g.pertek_puptr_num,
            sk_pkkpr_num: g.sk_pkkpr_num || g.sk_pkkpr_doc_number,
            tte_document_url: g.tte_document_url,
            is_tte_signed: Boolean(g.is_tte_signed),
            catatan_teknis: g.catatan_teknis,
            created_at: g.created_at || new Date().toISOString(),
            updated_at: g.updated_at || new Date().toISOString(),
          }));
          setUserApplications(mappedGis);
          if (!selectedApplication && mappedGis.length > 0) {
            setSelectedApplication(mappedGis[0]);
          }
        }
      }
    } catch (err) {
      console.warn('[ApplicantTracking] Fetch apps error:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  // ─── Direct Search by Registration / Number ───────────────────────────────
  const handleSearchByQuery = async (queryText: string) => {
    const cleanQ = queryText.trim();
    if (!cleanQ) return;
    setIsLoadingSearch(true);

    try {
      // 1. Check in pkkpr_permohonan
      const { data: pkkprMatches, error } = await supabase
        .from('pkkpr_permohonan')
        .select('*')
        .or(`nomor_permohonan.ilike.%${cleanQ}%,id.eq.${cleanQ.includes('-') && cleanQ.length === 36 ? cleanQ : '00000000-0000-0000-0000-000000000000'},sk_pkkpr_num.ilike.%${cleanQ}%,pemohon_email.ilike.%${cleanQ}%`)
        .limit(1);

      if (!error && pkkprMatches && pkkprMatches.length > 0) {
        const item = pkkprMatches[0];
        const normalized: PkkprApplicationRecord = {
          ...item,
          status_permohonan: normalizeWorkflowStatus(item.status_permohonan, item.pertanian_status, item.pertek_puptr_num, item.sk_pkkpr_num)
        };
        setSelectedApplication(normalized);
        return;
      }

      // 2. Fallback check in gis_pkkpr or investments
      const { data: gisMatches } = await supabase
        .from('gis_pkkpr')
        .select('*')
        .or(`nomor_registrasi.ilike.%${cleanQ}%,id.eq.${cleanQ.includes('-') && cleanQ.length === 36 ? cleanQ : '00000000-0000-0000-0000-000000000000'},sk_pkkpr_num.ilike.%${cleanQ}%,nama_pemohon.ilike.%${cleanQ}%`)
        .limit(1);

      if (gisMatches && gisMatches.length > 0) {
        const g = gisMatches[0];
        const normalized: PkkprApplicationRecord = {
          id: g.id,
          nomor_permohonan: g.nomor_registrasi || g.nomor_permohonan || `REG-${g.id?.slice(0, 8)}`,
          pemohon_name: g.nama_pemohon || g.nama || 'Pemohon',
          pemohon_email: g.email,
          pemohon_phone: g.telepon || g.no_whatsapp,
          nama_kegiatan: g.nama_kegiatan || g.judul_proyek || 'Kegiatan Pemanfaatan Ruang',
          sektor_kegiatan: g.sektor || 'Industri & Usaha',
          desa_name: g.desa_kelurahan || g.desa,
          kecamatan_name: g.kecamatan,
          status_permohonan: normalizeWorkflowStatus(g.status_permohonan || g.status_pkkpr, g.pertanian_status, g.pertek_puptr_num, g.sk_pkkpr_num),
          luas_m2: g.luas_m2 || 0,
          luas_ha: g.luas_ha || 0,
          geom: g.geom || g.geometry,
          geometry_json: g.geometry_json || g.geom,
          berita_acara_pertanian_num: g.berita_acara_pertanian_num,
          surat_rekomendasi_pertanian_num: g.surat_rekomendasi_pertanian_num,
          bap_penolakan_url: g.bap_penolakan_url,
          bap_pertek_url: g.bap_pertek_url,
          pertek_puptr_num: g.pertek_puptr_num,
          sk_pkkpr_num: g.sk_pkkpr_num || g.sk_pkkpr_doc_number,
          tte_document_url: g.tte_document_url,
          is_tte_signed: Boolean(g.is_tte_signed),
          catatan_teknis: g.catatan_teknis,
          created_at: g.created_at || new Date().toISOString(),
          updated_at: g.updated_at || new Date().toISOString(),
        };
        setSelectedApplication(normalized);
      } else {
        Swal.fire({
          icon: 'info',
          title: 'Permohonan Tidak Ditemukan',
          text: `Nomor registrasi "${cleanQ}" tidak ditemukan di pangkalan data perizinan PKKPR Kabupaten Luwu.`,
          confirmButtonColor: '#0d9488'
        });
      }
    } catch (err: any) {
      console.warn('[ApplicantTracking] Search error:', err);
    } finally {
      setIsLoadingSearch(false);
    }
  };

  // ─── Fetch Audit Logs for Selected Application ─────────────────────────────
  const fetchAuditLogs = async (appId: string) => {
    if (!appId) return;
    setIsLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('pkkpr_audit_logs')
        .select('*')
        .eq('permohonan_id', appId)
        .order('timestamp', { ascending: false });

      if (!error && data) {
        setAuditLogs(data);
      } else {
        setAuditLogs([]);
      }
    } catch (err) {
      console.warn('[ApplicantTracking] Audit log fetch note:', err);
      setAuditLogs([]);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (selectedApplication?.id) {
      fetchAuditLogs(selectedApplication.id);

      // Generate official verification QR Code
      const verificationUrl = `https://mpp.luwukab.go.id/verifikasi/pkkpr/${selectedApplication.id}`;
      QRCode.toDataURL(verificationUrl, {
        width: 160,
        margin: 1,
        color: {
          dark: '#047857',
          light: '#ffffff'
        }
      })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => console.warn('[ApplicantTracking] QR generation note:', err));
    } else {
      setQrCodeDataUrl(null);
    }
  }, [selectedApplication?.id]);

  // ─── Supabase Realtime Subscription ────────────────────────────────────────
  useEffect(() => {
    if (!selectedApplication?.id) return;

    const channelName = `pkkpr_track_${selectedApplication.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pkkpr_permohonan',
          filter: `id=eq.${selectedApplication.id}`
        },
        (payload) => {
          if (payload.new && (payload.new as any).id === selectedApplication.id) {
            const updated = payload.new as any;
            const normalizedStatus = normalizeWorkflowStatus(
              updated.status_permohonan,
              updated.pertanian_status,
              updated.pertek_puptr_num,
              updated.sk_pkkpr_num
            );
            
            setSelectedApplication(prev => prev ? {
              ...prev,
              ...updated,
              status_permohonan: normalizedStatus
            } : null);

            setRealtimeNotification(`Status permohonan baru saja diperbarui: ${normalizedStatus}`);
            setTimeout(() => setRealtimeNotification(null), 8000);

            // Re-fetch audit logs
            fetchAuditLogs(selectedApplication.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gis_pkkpr',
          filter: `id=eq.${selectedApplication.id}`
        },
        (payload) => {
          if (payload.new && (payload.new as any).id === selectedApplication.id) {
            const updated = payload.new as any;
            const normalizedStatus = normalizeWorkflowStatus(
              updated.status_pkkpr || updated.status_permohonan,
              updated.pertanian_status,
              updated.pertek_puptr_num,
              updated.sk_pkkpr_num
            );
            setSelectedApplication(prev => prev ? {
              ...prev,
              ...updated,
              status_permohonan: normalizedStatus,
              status_pkkpr: updated.status_pkkpr
            } : null);
            setRealtimeNotification(`Pembaruan dari verifikator OPD: ${updated.status_pkkpr || normalizedStatus}`);
            setTimeout(() => setRealtimeNotification(null), 8000);
            fetchAuditLogs(selectedApplication.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pkkpr_audit_logs',
          filter: `permohonan_id=eq.${selectedApplication.id}`
        },
        (payload) => {
          if (payload.new) {
            setAuditLogs(prev => [payload.new as PkkprAuditLogItem, ...prev]);
          }
        }
      )
      .on(
        'broadcast',
        { event: 'pkkpr_published' },
        (payload) => {
          if (payload.payload && payload.payload.id === selectedApplication.id) {
            const data = payload.payload;
            setSelectedApplication(prev => prev ? {
              ...prev,
              status_permohonan: 'IZIN_TERBIT',
              status_pkkpr: 'TERBIT',
              sk_pkkpr_num: data.sk_pkkpr_num,
              is_tte_signed: true,
              sla_realized_days: data.sla_realized_days,
              updated_at: data.published_at || new Date().toISOString()
            } : null);
            setRealtimeNotification(`Selamat! SK Izin PKKPR No. ${data.sk_pkkpr_num} resmi terbit dengan TTE sah.`);
            setTimeout(() => setRealtimeNotification(null), 10000);
            fetchAuditLogs(selectedApplication.id);
          }
        }
      )
      .subscribe();

    // Also listen to global broadcast channel 'pkkpr_updates'
    const broadcastChannel = supabase
      .channel('pkkpr_updates')
      .on(
        'broadcast',
        { event: 'pkkpr_published' },
        (payload) => {
          if (payload.payload && payload.payload.id === selectedApplication.id) {
            const data = payload.payload;
            setSelectedApplication(prev => prev ? {
              ...prev,
              status_permohonan: 'IZIN_TERBIT',
              status_pkkpr: 'TERBIT',
              sk_pkkpr_num: data.sk_pkkpr_num,
              is_tte_signed: true,
              sla_realized_days: data.sla_realized_days,
              updated_at: data.published_at || new Date().toISOString()
            } : null);
            setRealtimeNotification(`Selamat! SK Izin PKKPR No. ${data.sk_pkkpr_num} resmi terbit dengan TTE sah.`);
            setTimeout(() => setRealtimeNotification(null), 10000);
            fetchAuditLogs(selectedApplication.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(broadcastChannel);
    };
  }, [selectedApplication?.id]);

  // ─── Mini MapLibre Renderer ────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'map' || !mapContainerRef.current || !selectedApplication) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        preserveDrawingBuffer: true,
        style: {
          version: 8,
          sources: {
            'google-satellite': {
              type: 'raster',
              tiles: ['https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'],
              tileSize: 256,
              attribution: '© Google Satellite'
            }
          },
          layers: [
            {
              id: 'google-satellite-layer',
              type: 'raster',
              source: 'google-satellite',
              minzoom: 0,
              maxzoom: 22
            }
          ]
        },
        center: LUWU_CENTER,
        zoom: 11
      } as any);

      map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), 'top-right');

      map.on('load', () => {
        const rawGeom = selectedApplication.geometry_json || selectedApplication.geom;
        if (rawGeom) {
          let geojsonData: any = null;
          if (rawGeom.type === 'FeatureCollection') {
            geojsonData = rawGeom;
          } else if (rawGeom.type === 'Feature') {
            geojsonData = { type: 'FeatureCollection', features: [rawGeom] };
          } else if (rawGeom.type === 'Polygon' || rawGeom.type === 'MultiPolygon') {
            geojsonData = {
              type: 'FeatureCollection',
              features: [{
                type: 'Feature',
                geometry: rawGeom,
                properties: { name: selectedApplication.nama_kegiatan }
              }]
            };
          }

          if (geojsonData && geojsonData.features?.length > 0) {
            map.addSource('applicant-polygon', {
              type: 'geojson',
              data: geojsonData
            });

            // Fill Layer
            map.addLayer({
              id: 'applicant-polygon-fill',
              type: 'fill',
              source: 'applicant-polygon',
              paint: {
                'fill-color': '#0d9488',
                'fill-opacity': 0.4
              }
            });

            // Line Border
            map.addLayer({
              id: 'applicant-polygon-line',
              type: 'line',
              source: 'applicant-polygon',
              paint: {
                'line-color': '#14b8a6',
                'line-width': 3
              }
            });

            // Fit Bounds
            try {
              const bounds = new maplibregl.LngLatBounds();
              const coords = geojsonData.features[0].geometry.coordinates;
              const flattenCoords = (arr: any[]): any[] => {
                if (typeof arr[0] === 'number') return [arr];
                return arr.reduce((acc, val) => acc.concat(flattenCoords(val)), []);
              };
              flattenCoords(coords).forEach(pt => {
                if (Array.isArray(pt) && pt.length >= 2) {
                  bounds.extend(pt as [number, number]);
                }
              });
              if (!bounds.isEmpty()) {
                map.fitBounds(bounds, { padding: 40, maxZoom: 16 });
              }
            } catch (boundsErr) {
              console.warn('[MiniMap] Bounds fit error:', boundsErr);
            }
          }
        }
      });

      mapInstanceRef.current = map;
    } catch (mapErr) {
      console.warn('[MiniMap] Init error:', mapErr);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeTab, selectedApplication]);

  const isTerbit = useMemo(() => {
    if (!selectedApplication) return false;
    const appAny = selectedApplication as any;
    const status = appAny.status_permohonan;
    const rawStatusPkkpr = String(appAny.status_pkkpr || appAny.status || '').toUpperCase();
    return (
      ['TERBIT', 'ISSUED', 'PUBLISHED', 'IZIN_TERBIT', 'SELESAI', 'APPROVED_FINAL', 'APPROVED'].includes(rawStatusPkkpr) ||
      status === 'IZIN_TERBIT' ||
      selectedApplication.is_tte_signed === true ||
      Boolean(selectedApplication.sk_pkkpr_num && selectedApplication.sk_pkkpr_num.length > 3)
    );
  }, [selectedApplication]);

  const isRevision = useMemo(() => {
    if (!selectedApplication) return false;
    const appAny = selectedApplication as any;
    const status = String(appAny.status_permohonan || '').toUpperCase();
    const rawStatusPkkpr = String(appAny.status_pkkpr || appAny.status || '').toUpperCase();
    return (
      rawStatusPkkpr === 'REVISI_PEMOHON' ||
      rawStatusPkkpr === 'REQUIRES REVISION' ||
      rawStatusPkkpr === 'REVISION' ||
      status === 'REVISI_PEMOHON' ||
      Boolean(appAny.catatan_revisi)
    );
  }, [selectedApplication]);

  const handleSubmitRevisi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplication) return;
    setIsSubmittingRevisi(true);
    try {
      const timestamp = new Date().toISOString();
      const updatedNotes = `[BERKAS REVISI DIKIRIM PEMOHON - ${new Date().toLocaleDateString('id-ID')}]: ${revisiNotesInput || 'Pemohon telah mengunggah perbaikan berkas/koordinat.'}`;

      await Promise.all([
        supabase
          .from('gis_pkkpr')
          .update({
            status_pkkpr: 'VERIFIKASI_PUPTR',
            status_permohonan: 'REVIEW_PUPTR',
            catatan_revisi: null,
            catatan_teknis: updatedNotes,
            berkas_legalitas_gabungan_url: revisiFileDataUrl || (selectedApplication as any).berkas_legalitas_gabungan_url,
            updated_at: timestamp
          })
          .eq('id', selectedApplication.id),
        supabase
          .from('investments')
          .update({
            status: 'Review',
            status_permohonan: 'REVIEW_PUPTR',
            catatan_revisi: null,
            override_justification: updatedNotes,
            updated_at: timestamp
          })
          .eq('id', selectedApplication.id)
      ]);

      Swal.fire({
        icon: 'success',
        title: 'Berkas Revisi Berhasil Dikirim! 🎉',
        text: 'Dokumen perbaikan telah diteruskan kembali ke antrean verifikasi Dinas PUPTR.',
        confirmButtonColor: '#059669'
      });

      setIsReuploadModalOpen(false);
      setRevisiNotesInput('');
      setRevisiFileName('');
      setRevisiFileDataUrl(null);
      if (currentUser) {
        fetchUserApplications(currentUser.id, currentUser.email);
      }
    } catch (err: any) {
      Swal.fire('Gagal Mengirim Revisi', err?.message || 'Error', 'error');
    } finally {
      setIsSubmittingRevisi(false);
    }
  };

  // ─── Stepper Logic (5 Major Milestones) ────────────────────────────────────
  const stepperSteps = useMemo(() => {
    if (!selectedApplication) return [];

    const appAny = selectedApplication as any;
    const status = appAny.status_permohonan;
    const rawStatusPkkpr = String(appAny.status_pkkpr || appAny.status || '').toUpperCase();

    const isRejectedFinal = !isTerbit && (status === 'REJECTED_FINAL' || rawStatusPkkpr === 'REJECTED_FINAL' || rawStatusPkkpr === 'REJECTED');
    const isRejectedPertanian = !isTerbit && (status === 'REJECTED_PERTANIAN' || rawStatusPkkpr === 'REJECTED_PERTANIAN');
    const isPertanianActive = !isTerbit && (status === 'ESCALATED_PERTANIAN' || rawStatusPkkpr === 'PENDING PERTEK PERTANIAN' || rawStatusPkkpr === 'FORWARDED_TO_PERTANIAN');
    const isPertanianApproved = isTerbit || status === 'PERTEK_PERTANIAN' || rawStatusPkkpr === 'APPROVED_PERTANIAN' || Boolean(selectedApplication.berita_acara_pertanian_num);
    const isOssProcessing = !isTerbit && (status === 'PROSES_OSS' || rawStatusPkkpr === 'PROSES_OSS' || rawStatusPkkpr === 'APPROVED_PUPTR');
    const isPublished = isTerbit;

    return [
      {
        stepNumber: 1,
        title: 'Pengajuan & Audit Spasial Awal',
        opd: 'Dinas PUPTR Kab. Luwu',
        description: 'Pemeriksaan kesesuaian delineasi terhadap Rencana Tata Ruang Wilayah (RTRW) Kabupaten Luwu.',
        isCompleted: true,
        isActive: !isTerbit && status === 'REVIEW_PUPTR',
        isRejected: false,
        timestamp: selectedApplication.created_at
      },
      {
        stepNumber: 2,
        title: 'Kajian Teknis LP2B & Alih Fungsi Lahan',
        opd: 'Dinas Pertanian Kab. Luwu',
        description: isTerbit
          ? `Disetujui dengan Pemotongan Spasial / Non-LP2B${selectedApplication.berita_acara_pertanian_num ? ` (BAP No: ${selectedApplication.berita_acara_pertanian_num})` : ''}`
          : rawStatusPkkpr === 'BYPASS_PERTANIAN'
          ? 'Smart Spatial Bypass: Lahan berada di luar kawasan LP2B (Lolos Verifikasi Otomatis)'
          : isPertanianApproved
          ? `Disetujui dengan Pemotongan Spasial (BAP No: ${selectedApplication.berita_acara_pertanian_num || '-'})`
          : isRejectedPertanian
          ? 'Rekomendasi Alih Fungsi Ditolak oleh Dinas Pertanian'
          : isPertanianActive
          ? 'Sedang dalam telaah lapangan & audit lahan pertanian berkelanjutan'
          : 'Lahan tidak beririsan dengan zona LP2B (Lolos Verifikasi Otomatis)',
        isCompleted: isTerbit || rawStatusPkkpr === 'BYPASS_PERTANIAN' || isPertanianApproved || isOssProcessing || (!isPertanianActive && !isRejectedPertanian),
        isActive: !isTerbit && isPertanianActive,
        isRejected: !isTerbit && isRejectedPertanian,
        timestamp: selectedApplication.berita_acara_pertanian_num ? selectedApplication.updated_at : undefined
      },
      {
        stepNumber: 3,
        title: 'Verifikasi Akhir & Rekomendasi PUPTR',
        opd: 'Dinas PUPTR Kab. Luwu',
        description: isTerbit || selectedApplication.pertek_puptr_num
          ? `Pertek PUPTR Disahkan (No: ${selectedApplication.pertek_puptr_num || 'PERTEK-PUPTR-RESMI'})`
          : isRejectedFinal
          ? 'Permohonan Ditolak Final & Dikembalikan ke Pemohon'
          : 'Penyusunan Berita Acara Kesesuaian Tata Ruang (BAP KTR)',
        isCompleted: isTerbit || isOssProcessing || Boolean(selectedApplication.pertek_puptr_num),
        isActive: !isTerbit && (status === 'PERTEK_PERTANIAN' || status === 'REJECTED_PERTANIAN'),
        isRejected: !isTerbit && isRejectedFinal,
        timestamp: selectedApplication.pertek_puptr_num ? selectedApplication.updated_at : undefined
      },
      {
        stepNumber: 4,
        title: 'Penyematan TTE Digital Sertifikat BSrE',
        opd: 'DPMPTSP Kab. Luwu / OSS-RBA',
        description: isTerbit
          ? 'Penandatanganan elektronik (TTE BSrE) telah disematkan pada dokumen SK.'
          : 'Berkas dalam antrean penandatanganan elektronik (TTE Digital)',
        isCompleted: isTerbit || rawStatusPkkpr === 'TTE_COMPLETED',
        isActive: !isTerbit && isOssProcessing,
        isRejected: false,
        timestamp: isTerbit ? selectedApplication.updated_at : undefined
      },
      {
        stepNumber: 5,
        title: 'Izin PKKPR Resmi Terbit (Selesai)',
        opd: 'Portal Investor & OSS DPMPTSP',
        description: isTerbit
          ? 'Dokumen SK resmi telah terbit dan dapat diunduh.'
          : 'Dokumen SK resmi siap diunduh setelah seluruh tahapan selesai.',
        isCompleted: isTerbit,
        isActive: false,
        isRejected: !isTerbit && isRejectedFinal,
        timestamp: isTerbit ? selectedApplication.updated_at : undefined
      }
    ];
  }, [selectedApplication, isTerbit]);

  // ─── Document Download Handlers ───────────────────────────────────────────
  const handleDownloadOfficialSk = async () => {
    if (!selectedApplication) return;
    try {
      await generateSkPkkprPdf({
        applicationId: selectedApplication.id,
        applicantName: selectedApplication.pemohon_name,
        companyName: selectedApplication.pemohon_name,
        nibNik: selectedApplication.nomor_permohonan,
        sector: selectedApplication.sektor_kegiatan || 'Investasi',
        districtName: selectedApplication.kecamatan_name || 'Kecamatan Luwu',
        villageName: selectedApplication.desa_name || 'Desa Luwu',
        areaHa: selectedApplication.luas_ha || ((selectedApplication.luas_m2 || 0) / 10000),
        investmentValue: 5000000000,
        skPkkprDocNumber: selectedApplication.sk_pkkpr_num || `503/SK-PKKPR/DPMPTSP-LW/2026/${selectedApplication.id.slice(0, 4)}`,
        pertanianBaNumber: selectedApplication.berita_acara_pertanian_num,
        puptrPertekNumber: selectedApplication.pertek_puptr_num,
        issueDate: new Date().toLocaleDateString('id-ID')
      });
      Swal.fire({
        icon: 'success',
        title: 'Dokumen SK PKKPR Terunduh!',
        text: 'Surat Keputusan resmi DPMPTSP Kabupaten Luwu telah disimpan di perangkat Anda.',
        confirmButtonColor: '#0d9488'
      });
    } catch (err: any) {
      console.error('[DownloadSK] Error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengunduh Dokumen',
        text: err.message || 'Terjadi gangguan saat menyusun berkas PDF.',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const handleDownloadBapPertanian = () => {
    if (!selectedApplication) return;
    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.text('PEMERINTAH KABUPATEN LUWU', 105, 20, { align: 'center' });
    doc.setFontSize(16);
    doc.text('DINAS PERTANIAN', 105, 27, { align: 'center' });
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text('Jl. Jendral Sudirman Kompleks Perkantoran Pemkab Luwu, Belopa', 105, 33, { align: 'center' });
    doc.line(20, 36, 190, 36);

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('BERITA ACARA PEMERIKSAAN TEKNIS LAHAN (BAP)', 105, 48, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Nomor: ${selectedApplication.berita_acara_pertanian_num || 'BA-LP2B/DISTAN-LUWU/2026/01'}`, 105, 54, { align: 'center' });

    doc.setFont('times', 'normal');
    doc.text('Pada hari ini telah dilakukan audit kesesuaian alih fungsi lahan LP2B untuk permohonan:', 20, 68);
    doc.text(`• Nomor Registrasi  : ${selectedApplication.nomor_permohonan}`, 25, 76);
    doc.text(`• Nama Pemohon     : ${selectedApplication.pemohon_name}`, 25, 82);
    doc.text(`• Kegiatan Usaha   : ${selectedApplication.nama_kegiatan}`, 25, 88);
    doc.text(`• Lokasi Wilayah   : Desa ${selectedApplication.desa_name || '-'}, Kec. ${selectedApplication.kecamatan_name || '-'}`, 25, 94);
    doc.text(`• Luas Delineasi   : ${(selectedApplication.luas_m2 || 0).toLocaleString('id-ID')} m² (${selectedApplication.luas_ha || 0} Ha)`, 25, 100);

    doc.setFont('times', 'bold');
    doc.text('REKOMENDASI TEKNIS PERTANIAN:', 20, 114);
    doc.setFont('times', 'normal');
    doc.text('Permohonan telah melalui proses analisis spasial irisan (Spatial Difference). Delineasi disetujui', 20, 122);
    doc.text('setelah dilakukan pemotongan pada zona inti perlindungan pangan aktif.', 20, 128);

    doc.text('Ditetapkan di Belopa, Kabupaten Luwu', 120, 160);
    doc.text('Kepala Dinas Pertanian Kab. Luwu', 120, 166);
    doc.text('[TTE Tervalidasi Sistem Pemkab Luwu]', 120, 185);

    doc.save(`BAP_Pertanian_${selectedApplication.nomor_permohonan}.pdf`);
  };

  const copyTrackingLink = () => {
    if (!selectedApplication) return;
    const url = `${window.location.origin}/tracking?reg=${encodeURIComponent(selectedApplication.nomor_permohonan)}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  const statusConfig = selectedApplication ? WORKFLOW_STATUS_CONFIG[selectedApplication.status_permohonan] : null;

  return (
    <div className={`space-y-6 ${isEmbedded ? '' : 'max-w-7xl mx-auto p-4 sm:p-6 md:p-8'}`}>
      {/* ─── Realtime Notification Banner ─────────────────────────────────── */}
      <AnimatePresence>
        {realtimeNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-lg shadow-emerald-900/10 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs sm:text-sm font-bold">{realtimeNotification}</span>
            </div>
            <button
              onClick={() => setRealtimeNotification(null)}
              className="text-xs font-semibold hover:underline opacity-80 cursor-pointer"
            >
              Tutup
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Header & Hero Tracker Bar ──────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-950 p-6 sm:p-8 text-white shadow-2xl border border-teal-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Building2 className="w-3.5 h-3.5" />
              <span>SISTEM INFORMASI PERIZINAN SPASIAL TERPADU KABUPATEN LUWU</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex flex-wrap items-center gap-3">
              <span>Pelacakan Real-Time PKKPR</span>
              <span className="text-xs px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                OSS-RBA Live Sync
              </span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Pantau perjalanan berkas izin pemanfaatan ruang Anda secara transparan lintas OPD: Dinas PUPTR, Dinas Pertanian, hingga penerbitan TTE Digital di DPMPTSP.
            </p>
          </div>

          {onNavigateToForm && (
            <button
              onClick={onNavigateToForm}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-900/30 transition flex items-center gap-2 cursor-pointer self-start md:self-auto active:scale-95"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Ajukan Permohonan Baru</span>
            </button>
          )}
        </div>

        {/* Search Bar Input */}
        <div className="mt-6 pt-6 border-t border-slate-800/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearchByQuery(searchQuery);
            }}
            className="flex flex-col sm:flex-row gap-2.5 max-w-3xl"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-teal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Masukkan Nomor Registrasi (e.g. REG-2026-X992), No. SK, NIB, atau Email..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/70 border border-teal-500/30 text-xs sm:text-sm text-white placeholder:text-slate-400 outline-none focus:border-teal-400 transition font-medium backdrop-blur-md"
              />
            </div>
            <button
              type="submit"
              disabled={isLoadingSearch}
              className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 active:scale-95 whitespace-nowrap"
            >
              {isLoadingSearch ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Lacak Berkas</span>
            </button>
          </form>
        </div>
      </div>

      {/* ─── My Applications Quick Selector (If User has multiple) ──────────── */}
      {userApplications.length > 1 && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
            <span>Daftar Permohonan Terdaftar ({userApplications.length})</span>
            <span className="text-[10px] text-teal-600 dark:text-teal-400">Klik untuk mengganti berkas yang dilacak</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {userApplications.map((app) => {
              const isSelected = selectedApplication?.id === app.id;
              return (
                <button
                  key={app.id}
                  onClick={() => setSelectedApplication(app)}
                  className={`px-3 py-2 rounded-xl text-left transition border cursor-pointer whitespace-nowrap text-xs ${
                    isSelected
                      ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-950 dark:text-teal-200 font-bold shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div className="font-mono text-[10px] text-slate-500">{app.nomor_permohonan}</div>
                  <div className="truncate max-w-[200px] font-semibold">{app.nama_kegiatan}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Active Application Detail & Tracker Card ──────────────────────── */}
      {selectedApplication ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Tracking & Stepper Column (2 Columns wide) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Summary Banner */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-teal-600 dark:text-teal-400">
                      {selectedApplication.nomor_permohonan}
                    </span>
                    <button
                      onClick={copyTrackingLink}
                      className="text-slate-400 hover:text-teal-600 p-1 rounded-md transition cursor-pointer"
                      title="Salin tautan pelacakan"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
                    {selectedApplication.nama_kegiatan}
                  </h2>
                </div>

                {isTerbit ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 border border-emerald-400/50 shadow-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>✓ Izin PKKPR Resmi Terbit</span>
                    </span>
                    <span className="bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 px-2.5 py-1 rounded-full text-[11px] font-bold border border-teal-500/30 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>Selesai dalam {(selectedApplication as any).sla_realized_days || 3} Hari Kerja - Tepat Waktu</span>
                    </span>
                  </div>
                ) : statusConfig ? (
                  <div className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 self-start sm:self-auto ${statusConfig.badgeColor}`}>
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>{statusConfig.label}</span>
                  </div>
                ) : (
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">
                    {(selectedApplication as any)?.status_pkkpr || 'Antrean Penerbitan SK DPMPTSP / OSS'}
                  </span>
                )}
              </div>

              {/* Special Fast-Track Issuance & Verification Action Banner */}
              {isTerbit && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border-2 border-emerald-500/40 text-emerald-950 dark:text-emerald-100 space-y-3 shadow-lg shadow-emerald-900/5 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                          <ShieldCheck className="w-5 h-5" />
                        </span>
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">
                          SK PKKPR &amp; TTE BSrE Diterbitkan Resmi
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Dokumen legalitas SK Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang telah sah secara hukum dan dapat langsung digunakan untuk persyaratan Persetujuan Bangunan Gedung (PBG).
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={handleDownloadOfficialSk}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md hover:shadow-emerald-600/20 transition-all cursor-pointer active:scale-95"
                      >
                        <Download className="w-4 h-4" />
                        <span>Unduh SK PKKPR Resmi (PDF)</span>
                      </button>

                      <a
                        href={`/verifikasi/pkkpr/${selectedApplication.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 border border-slate-700 shadow-sm transition-all cursor-pointer active:scale-95"
                      >
                        <QrCode className="w-4 h-4 text-emerald-400" />
                        <span>Verifikasi Digital QR Code</span>
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Alert Box Kuning Jika Memerlukan Revisi Pemohon */}
              {isRevision && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600/70 shadow-md space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
                      <AlertTriangle className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">
                          PERLU PERBAIKAN / REVISI BERKAS PEMOHON
                        </h4>
                        <span className="px-2 py-0.5 text-[9px] bg-amber-200 dark:bg-amber-800 text-amber-950 dark:text-amber-100 rounded-full font-mono font-bold">
                          ACTION REQUIRED
                        </span>
                      </div>
                      <p className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed font-medium bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60">
                        <strong>Catatan Verifikator OPD:</strong>{" "}
                        {(selectedApplication as any).catatan_revisi ||
                          (selectedApplication as any).pertanian_rejection_notes ||
                          selectedApplication.catatan_teknis ||
                          "Harap lakukan perbaikan dokumen atau koordinat spasial batas lahan sesuai catatan teknis verifikator."}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-amber-200/80 dark:border-amber-800/80">
                    <span className="text-[11px] text-amber-800 dark:text-amber-300 italic">
                      💡 Berkas yang diunggah ulang akan langsung masuk kembali ke antrean verifikasi OPD.
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsReuploadModalOpen(true)}
                      className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-amber-600/20 transition-all cursor-pointer active:scale-95"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Unggah Ulang Berkas Perbaikan</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Status Explanation Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-2">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Status Terkini &amp; Catatan Teknis</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isTerbit ? (
                    <span>
                      <strong>[IZIN PKKPR DITERBITKAN]:</strong> Selamat, Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) Anda telah selesai diproses dan disahkan menggunakan TTE Digital Sertifikat BSrE. Silakan unduh dokumen SK pada tab Dokumen Resmi.
                    </span>
                  ) : (
                    selectedApplication.catatan_teknis || selectedApplication.override_justification || statusConfig?.description
                  )}
                </p>
              </div>

              {/* Navigation Tabs for Views */}
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pt-2">
                {[
                  { id: 'timeline', label: 'Linimasa Progres Stepper', icon: Clock },
                  { id: 'map', label: 'Peta Lokasi Spasial', icon: MapPin },
                  { id: 'documents', label: 'Dokumen Resmi', icon: FileText },
                  { id: 'history', label: 'Riwayat Audit Birokrasi', icon: Activity },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                        isActive
                          ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                          : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab 1: Stepper Timeline */}
              {activeTab === 'timeline' && (
                <div className="space-y-6 pt-2">
                  {stepperSteps.map((step, idx) => {
                    const isLast = idx === stepperSteps.length - 1;
                    return (
                      <div key={step.stepNumber} className="relative flex items-start gap-4">
                        {/* Vertical Connecting Line */}
                        {!isLast && (
                          <div
                            className={`absolute left-4 top-9 bottom-0 w-0.5 -ml-[1px] transition-colors ${
                              step.isCompleted ? 'bg-teal-500 dark:bg-teal-600' : 'bg-slate-200 dark:bg-slate-800'
                            }`}
                          />
                        )}

                        {/* Step Icon Node */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 z-10 transition-all ${
                            step.isRejected
                              ? 'bg-rose-500 text-white ring-4 ring-rose-500/20'
                              : step.isCompleted
                              ? 'bg-teal-600 text-white ring-4 ring-teal-500/20'
                              : step.isActive
                              ? 'bg-amber-500 text-white ring-4 ring-amber-500/20 animate-pulse'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {step.isRejected ? (
                            <XCircle className="w-4 h-4" />
                          ) : step.isCompleted ? (
                            <Check className="w-4 h-4 stroke-[3]" />
                          ) : (
                            step.stepNumber
                          )}
                        </div>

                        {/* Step Content */}
                        <div className="flex-1 pb-6 space-y-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <h4
                              className={`text-sm font-bold ${
                                step.isActive
                                  ? 'text-teal-600 dark:text-teal-400 font-extrabold'
                                  : step.isCompleted
                                  ? 'text-slate-900 dark:text-white'
                                  : 'text-slate-400'
                              }`}
                            >
                              {step.title}
                            </h4>
                            <span className="text-[10px] font-mono text-slate-400">
                              {step.opd}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {step.description}
                          </p>
                          {step.timestamp && (
                            <span className="inline-block text-[10px] text-slate-400 font-mono mt-1">
                              Waktu: {new Date(step.timestamp).toLocaleString('id-ID')}
                            </span>
                          )}

                          {step.stepNumber === 5 && step.isCompleted && (
                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={handleDownloadOfficialSk}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md hover:shadow-emerald-600/20 transition-all cursor-pointer"
                              >
                                <Download className="w-4 h-4" />
                                <span>Unduh SK PKKPR Resmi (PDF)</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab 2: Map Preview */}
              {activeTab === 'map' && (
                <div className="space-y-4 pt-2">
                  <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950">
                    <div ref={mapContainerRef} className="w-full h-full" />
                    <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white text-[10px] font-mono flex items-center gap-2 pointer-events-none">
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                      <span>Google Satellite Hybrid • Delineasi Terverifikasi</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500 font-bold">Kecamatan</div>
                      <div className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedApplication.kecamatan_name || '-'}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500 font-bold">Desa / Kelurahan</div>
                      <div className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedApplication.desa_name || '-'}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500 font-bold">Luas Bersih (m²)</div>
                      <div className="font-bold font-mono text-teal-600 dark:text-teal-400 mt-0.5">
                        {(selectedApplication.luas_m2 || 0).toLocaleString('id-ID')} m²
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500 font-bold">Luas Bersih (Ha)</div>
                      <div className="font-bold font-mono text-teal-600 dark:text-teal-400 mt-0.5">
                        {selectedApplication.luas_ha || ((selectedApplication.luas_m2 || 0) / 10000).toFixed(4)} Ha
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Official Documents */}
              {activeTab === 'documents' && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* SK PKKPR Document */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileCheck2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                          <span className="font-bold text-xs text-slate-900 dark:text-white">SK PKKPR Resmi</span>
                        </div>
                        {selectedApplication.status_permohonan === 'IZIN_TERBIT' ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            Aktif &amp; TTE Sah
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            Dalam Proses
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Surat Keputusan Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang resmi dari DPMPTSP.
                      </p>
                      <button
                        onClick={handleDownloadOfficialSk}
                        disabled={selectedApplication.status_permohonan !== 'IZIN_TERBIT'}
                        className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh SK PKKPR (PDF)</span>
                      </button>
                    </div>

                    {/* BAP Penolakan & Catatan Evaluasi Teknis (Hanya tampil saat DITOLAK / MEMERLUKAN REVISI) */}
                    {(selectedApplication.status_permohonan === 'REJECTED_PERTANIAN' ||
                      selectedApplication.status_permohonan === 'REJECTED_FINAL' ||
                      String(selectedApplication.status_permohonan || '').includes('REJECT') ||
                      String(selectedApplication.status_pkkpr || '').includes('REJECT') ||
                      String(selectedApplication.status_pkkpr || '').includes('Revision') ||
                      Boolean(selectedApplication.catatan_revisi) ||
                      Boolean(selectedApplication.catatan_teknis)) && (
                      <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                            <span className="font-bold text-xs text-rose-900 dark:text-rose-200">Catatan BAP Penolakan</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400">
                            Perlu Perbaikan
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">
                          "{selectedApplication.catatan_teknis || selectedApplication.catatan_revisi || 'Ditemukan irisan deliniasi lahan pada kawasan Perlindungan Lahan Pertanian Pangan Berkelanjutan (LP2B).'}"
                        </p>
                        <button
                          onClick={() => {
                            const isPertanian = String(selectedApplication.status_permohonan || '').includes('PERTANIAN');
                            Swal.fire({
                              icon: 'warning',
                              title: 'Ringkasan BAP Penolakan Teknis',
                              html: `
                                <div class="text-left text-xs space-y-2">
                                  <p><strong>OPD Evaluator:</strong> ${isPertanian ? 'Dinas Pertanian Kab. Luwu (Tim LP2B)' : 'Dinas PUPTR Kab. Luwu (Bidang Tata Ruang)'}</p>
                                  <p><strong>Nomor BAP:</strong> ${selectedApplication.berita_acara_pertanian_num || selectedApplication.pertek_puptr_num || 'BAP-TOLAK/LUWU/2026'}</p>
                                  <p class="p-2.5 bg-rose-100 dark:bg-rose-950 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200">
                                    <strong>Poin Alasan Penolakan:</strong><br/>
                                    "${selectedApplication.catatan_teknis || selectedApplication.catatan_revisi || 'Irisan deliniasi spasial pada Lahan Sawah Dilindungi (LP2B).'}"
                                  </p>
                                  <p class="p-2.5 bg-amber-100 dark:bg-amber-950 rounded-xl border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                                    <strong>Rekomendasi &amp; Tindak Lanjut:</strong><br/>
                                    Silakan lakukan pemotongan poligon lahan pada menu Peta Digitasi untuk mengeluarkan zona LP2B/sempadan, lalu ajukan perbaikan.
                                  </p>
                                </div>
                              `,
                              confirmButtonColor: '#e11d48',
                              confirmButtonText: 'Tutup'
                            });
                          }}
                          className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Lihat BAP Penolakan &amp; Catatan Teknis</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: Audit History */}
              {activeTab === 'history' && (
                <div className="space-y-3 pt-2">
                  {isLoadingLogs ? (
                    <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Memuat riwayat audit dari Supabase...</span>
                    </div>
                  ) : auditLogs.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Belum ada transisi status tambahan yang tercatat.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {auditLogs.map((log) => (
                        <div
                          key={log.id}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-teal-600 dark:text-teal-400">{log.action_type}</span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {new Date(log.timestamp).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="text-slate-600 dark:text-slate-300 text-[11px]">
                            {log.notes || `Status berubah dari ${log.old_status || 'AWAL'} menjadi ${log.new_status}`}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Aktor: {log.changed_by_role || log.changed_by || 'SISTEM_PEMKAB'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Info Column (1 Column wide) */}
          <div className="space-y-6">
            {/* Quick Metadata Card */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Rincian Permohonan</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500">Pemohon</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedApplication.pemohon_name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500">Sektor</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedApplication.sektor_kegiatan || 'Investasi'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500">Wilayah</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedApplication.desa_name}, {selectedApplication.kecamatan_name}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500">Luas Total</span>
                  <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                    {(selectedApplication.luas_m2 || 0).toLocaleString('id-ID')} m²
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500">Tanggal Pengajuan</span>
                  <span className="font-mono text-slate-600 dark:text-slate-400">
                    {new Date(selectedApplication.created_at).toLocaleDateString('id-ID')}
                  </span>
                </div>
                {selectedApplication.sk_pkkpr_num && (
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-500">No. SK Terbit</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                      {selectedApplication.sk_pkkpr_num}
                    </span>
                  </div>
                )}
              </div>

              {/* TTE Validity & Official Public QR Code Stamp */}
              {(isTerbit || selectedApplication.status_permohonan === 'IZIN_TERBIT' || (selectedApplication as any).status_pkkpr === 'TERBIT') && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-950 dark:text-emerald-200 text-xs space-y-3">
                  <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400">
                    <QrCode className="w-4 h-4" />
                    <span>Keabsahan Sertifikat Digital BSrE</span>
                  </div>
                  
                  {qrCodeDataUrl ? (
                    <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-slate-950 border border-emerald-500/20 shadow-xs space-y-2">
                      <img
                        src={qrCodeDataUrl}
                        alt="QR Code Verifikasi Resmi"
                        className="w-28 h-28 object-contain rounded-lg border border-slate-100 dark:border-slate-800"
                      />
                      <span className="text-[9px] font-mono text-center text-slate-500 font-bold uppercase tracking-wider">
                        Scan QR untuk Verifikasi Keaslian SK
                      </span>
                    </div>
                  ) : null}

                  <p className="text-[11px] leading-relaxed opacity-90">
                    Dokumen ini telah ditandatangani secara elektronik menggunakan sertifikat elektronik yang diterbitkan oleh Balai Sertifikasi Elektronik (BSrE) BSSN.
                  </p>

                  <a
                    href={`/verifikasi/pkkpr/${selectedApplication.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <span>Buka Portal Verifikasi Publik</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Help & Contact Support */}
            <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 space-y-3">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Pusat Bantuan &amp; Konsultasi</span>
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Butuh asistensi terkait rekomendasi teknis atau kelengkapan berkas? Kunjungi Front Office Mal Pelayanan Publik (MPP) Belopa atau hubungi layanan helpdesk OSS Kabupaten Luwu.
              </p>
              <div className="pt-2">
                <a
                  href="https://wa.me/6281234567890?text=Halo%20Admin%20InvestLuwu,%20saya%20ingin%20konsultasi%20berkas%20PKKPR"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Chat Konsultasi Helpdesk MPP</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center">
            <Search className="w-8 h-8 stroke-1" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Masukkan Nomor Registrasi Permohonan</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Gunakan kolom pencarian di atas untuk melacak status verifikasi permohonan PKKPR Anda secara real-time.
            </p>
          </div>
        </div>
      )}
      {/* Modal Re-upload Berkas Revisi */}
      {isReuploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Unggah Ulang Berkas Perbaikan</h3>
                  <p className="text-[11px] text-slate-500">Permohonan: {selectedApplication?.nomor_permohonan}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReuploadModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRevisi} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Catatan Tindak Lanjut / Perbaikan Pemohon <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={revisiNotesInput}
                  onChange={(e) => setRevisiNotesInput(e.target.value)}
                  placeholder="Jelaskan perbaikan yang telah dilakukan (contoh: Lampiran surat keterangan bebas sengketa telah diperbarui)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/30 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Unggah Dokumen Perbaikan (PDF / Dokumen)
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.kmz,.kml"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setRevisiFileName(file.name);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setRevisiFileDataUrl(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 dark:file:bg-amber-950 dark:file:text-amber-300"
                />
                {revisiFileName && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-1 font-bold">
                    ✓ File terpilih: {revisiFileName}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReuploadModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRevisi}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md hover:shadow-amber-600/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingRevisi ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <span>Kirim Berkas Perbaikan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicantTrackingDashboard;
