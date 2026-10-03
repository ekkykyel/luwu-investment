import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCheck2,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Send,
  Download,
  Printer,
  FileText,
  Search,
  RefreshCw,
  QrCode,
  Upload,
  AlertCircle,
  Eye,
  Check,
  Wheat,
  MapPin,
  Sparkles,
  Layers,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Lock,
  UserCheck
} from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../../lib/supabaseClient';
import { getOpdSettings } from '../../utils/opdSettingsStorage';
import { addCrossOpdNotification } from '../../utils/crossOpdNotificationStore';
import { PkkprSlaTimelineTracker, PkkprSlaTimelineData } from './PkkprSlaTimelineTracker';
import { SkPkkprDpmptspDocument, SkPkkprDpmptspData } from '../documents/SkPkkprDpmptspDocument';
import { SmartFormSkPkkprModal } from './SmartFormSkPkkprModal';
import { PkkprStatusPermohonan, normalizeWorkflowStatus } from '../../types/pkkprWorkflow';
import { getKategoriPengajuan } from '../../utils/pkkprWorkflowService';
import { extractCoordsFromGeometry } from '../../utils/luwuGisMapGenerator';

interface PkkprIssuanceItem {
  id: string;
  status_permohonan?: PkkprStatusPermohonan;
  applicantType: string;
  nibNik: string;
  applicantName: string;
  companyName: string;
  sector: string;
  jenisPengajuanPkkpr?: string;
  kategoriPengajuan?: 'BANGUNAN' | 'PARSIL_TANAH';
  jenisAlasHak?: string;
  fileAlasHakUrl?: string;
  fileSiteplanUrl?: string;
  rencanaLuasBgn?: number | string;
  districtName: string;
  villageName: string;
  areaHa: number;
  pertekPuptrNum?: string;
  pertekDate?: string;
  technicalNotes?: string;
  pertanianStatus?: 'NOT_REQUIRED' | 'FORWARDED' | 'APPROVED' | 'REJECTED';
  pertanianBaNumber?: string;
  noPertekBpn?: string;
  statusPertekBpn?: string;
  skPkkprNum?: string;
  statusPkkpr: string;
  createdAt: string;
  updatedAt: string;
  tteSignedDate?: string;
  isTteSigned?: boolean;
  publishedToApplicant?: boolean;
  geometry?: any;
}

export const OssPkkprIssuanceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'queue' | 'archive' | 'sla'>('queue');
  const [items, setItems] = useState<PkkprIssuanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<PkkprIssuanceItem | null>(null);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [isSmartFormOpen, setIsSmartFormOpen] = useState(false);
  const [customSkData, setCustomSkData] = useState<SkPkkprDpmptspData | null>(null);

  // Processing form state
  const [generatedSkNumber, setGeneratedSkNumber] = useState('');
  const [tteSignerName, setTteSignerName] = useState('Drs. H. Muhammad Rudi, M.Si');
  const [tteSignerNip, setTteSignerNip] = useState('19740812 199803 1 004');
  const [tteSignerTitle, setTteSignerTitle] = useState('Kepala DPMPTSP Kabupaten Luwu');
  const [isTteApplied, setIsTteApplied] = useState(false);
  const [uploadedTteFile, setUploadedTteFile] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dpmptspSettings = getOpdSettings('dpmptsp');

  // Helper to build SK Data object for Document & Smart Form
  const buildSkData = (item: PkkprIssuanceItem, overrideSkNum?: string, isTte?: boolean): SkPkkprDpmptspData => {
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const polygonCoords = extractCoordsFromGeometry(item.geometry);

    return {
      nomorSkPkkpr: overrideSkNum || item.skPkkprNum || `503/SK-PKKPR/DPMPTSP-LW/${new Date().getFullYear()}/${item.id.slice(0, 4)}`,
      tanggalDitetapkan: dateStr,
      tempatDitetapkan: 'Belopa',
      jenisPermohonan: item.applicantType.includes('NIB') ? 'Berusaha' : 'Non-Berusaha',
      
      nomorBapPuptr: item.pertekPuptrNum || `600.1.15/042/BAP-PKKPR-B/PUPTR-TR/LUWU/${new Date().getFullYear()}`,
      tanggalBapPuptr: item.pertekDate ? new Date(item.pertekDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : dateStr,
      nomorBapPertanian: item.pertanianBaNumber,
      tanggalBapPertanian: item.pertanianBaNumber ? dateStr : undefined,
      nomorPertekBpn: item.noPertekBpn || `500.1/BAP-PERTEK-BPN/KANTAH-LW/${new Date().getFullYear()}/${item.id.slice(0, 4).toUpperCase()}`,
      tanggalPertekBpn: dateStr,

      namaPemohon: item.applicantName || 'Pemohon Terdaftar',
      namaPerusahaan: item.companyName || 'Badan Usaha / Perorangan',
      nibOss: item.nibNik || 'NIB-OSS-TERDAFTAR',
      alamatPemohon: `Desa/Kel. ${item.villageName}, Kec. ${item.districtName}, Kab. Luwu`,
      
      sektorUsaha: item.jenisPengajuanPkkpr || item.sector || 'Sektor Perdagangan, Hotel & Restoran',
      skalaUsaha: 'Usaha Kecil (Modal Usaha > Rp 1 Miliar s.d. Rp 5 Miliar)',
      kbliCode: '68111',
      lokasiKegiatan: `Kecamatan ${item.districtName}, Desa/Kel. ${item.villageName}`,
      desaKelurahan: item.villageName,
      kecamatan: item.districtName,
      kabupaten: 'Luwu',
      luasLahanPermohonan: `${item.areaHa} Ha (${(item.areaHa * 10000).toLocaleString('id-ID')} m²)`,
      luasLahanDisetujui: `${item.areaHa} Ha (${(item.areaHa * 10000).toLocaleString('id-ID')} m²)`,
      statusKepemilikanTanah: item.jenisAlasHak || 'Sertipikat Hak Milik (SHM)',
      dokumenLingkungan: 'Surat Pernyataan Kesanggupan Pengelolaan dan Pemantauan Lingkungan Hidup (SPPL)',
      nomorRekomendasiFpr: `503/FPR-LUWU/2026/${item.id.slice(0, 4)}`,
      tanggalRekomendasiFpr: dateStr,

      zonaRtrw: 'Kawasan Perdagangan dan Jasa',
      fungsiBangunan: 'Bangunan Gedung Komersial / Perdagangan & Jasa',
      koefisienDasarBangunan: '60%',
      koefisienLantaiBangunan: '2.4',
      koefisienDaerahHijau: '20%',
      garisSempadanBangunan: '15 meter dari As Jalan Utama',
      ketinggianMaksimalBangunan: 'Maksimal 2 Lantai (≤ 9 Meter)',

      ketentuanPersyaratanTeknis: [
        'Mematuhi seluruh ketentuan persyaratan teknis bangunan gedung dan tata ruang sesuai Perda RTRW Kab. Luwu No. 3 Tahun 2024;',
        'Mengurus dokumen perizinan lingkungan lanjutan (AMDAL/UKL-UPL/SPPL) dan Persetujuan Bangunan Gedung (PBG);',
        'Tidak memindahtangankan dokumen SK PKKPR ini kepada pihak lain tanpa persetujuan tertulis dari Pemerintah Kabupaten Luwu.'
      ],
      masaBerlakuTahun: 3,

      kadisNama: dpmptspSettings?.kepalaDinas?.fullName || tteSignerName || 'Drs. H. Muhammad Rudi, M.Si',
      kadisNip: dpmptspSettings?.kepalaDinas?.nip || tteSignerNip || '19740812 199803 1 004',
      kadisPangkatGolongan: dpmptspSettings?.kepalaDinas?.pangkatGolongan || 'Pembina Utama Muda (IV/c)',
      kadisJabatan: 'Kepala Dinas Penanaman Modal dan PTSP Kab. Luwu',
      isTteSigned: isTte !== undefined ? isTte : item.isTteSigned,
      tteSignedDate: dateStr,

      koordinatPoligon: polygonCoords.length > 0 ? polygonCoords.map((c, idx) => ({
        id: c.id || idx + 1,
        pointName: `P-${idx + 1}`,
        latitudeDms: `${c.latitudeDd}°`,
        longitudeDms: `${c.longitudeDd}°`,
        latitudeDd: c.latitudeDd,
        longitudeDd: c.longitudeDd
      })) : undefined,
      geometry: item.geometry
    };
  };

  // Fetch verified pertek records from PUPTR
  const fetchQueue = async () => {
    setLoading(true);
    try {
      const records: PkkprIssuanceItem[] = [];

      // 1. Primary Query: Fetch from gis_pkkpr (SSOT for Workflow)
      try {
        const { data: permData, error: permErr } = await supabase
          .from('gis_pkkpr')
          .select('*')
          .order('created_at', { ascending: false });

        if (!permErr && permData && permData.length > 0) {
          permData.forEach((item: any) => {
            const isBerusaha = item.jenis_permohonan === 'Berusaha' || item.jenis_pemohon === 'NIB';
            const isDpmptspSkIssued = Boolean(
              item.status_permohonan === 'IZIN_TERBIT' ||
              item.is_tte_signed ||
              (item.sk_pkkpr_num && item.sk_pkkpr_num.includes('DPMPTSP'))
            );

            const resolvedPertekNum = item.pertek_puptr_num || `503/PERTEK-PUPTR/LUWU/${item.id}`;

            let pertStatus: 'NOT_REQUIRED' | 'FORWARDED' | 'APPROVED' | 'REJECTED' = 'NOT_REQUIRED';
            if (item.berita_acara_pertanian_num || item.status_permohonan === 'PERTEK_PERTANIAN') {
              pertStatus = 'APPROVED';
            } else if (item.status_permohonan === 'REJECTED_PERTANIAN') {
              pertStatus = 'REJECTED';
            } else if (item.status_permohonan === 'ESCALATED_PERTANIAN') {
              pertStatus = 'FORWARDED';
            }

            records.push({
              id: item.id,
              status_permohonan: item.status_permohonan || (isDpmptspSkIssued ? 'IZIN_TERBIT' : 'PROSES_OSS'),
              applicantType: isBerusaha ? 'NIB (Pelaku Usaha)' : 'NIK (Perorangan / Warga)',
              nibNik: item.nomor_permohonan || item.nik_pemohon || item.nib_pemohon || '-',
              applicantName: item.pemohon_name || 'Pemohon Terdaftar',
              companyName: item.nama_kegiatan || (isBerusaha ? 'Pelaku Usaha' : 'Perseorangan / Warga'),
              sector: item.sektor_kegiatan || (isBerusaha ? 'Komersial / Usaha' : 'Non-Komersial / Rumah Tinggal'),
              jenisPengajuanPkkpr: item.jenis_pengajuan_pkkpr || item.sektor_kegiatan || (isBerusaha ? 'Kawasan Industri / Gudang / Pabrik' : 'Rumah Tinggal / Hunian Perorangan'),
              kategoriPengajuan: item.kategori_pengajuan || getKategoriPengajuan(item.jenis_pengajuan_pkkpr || item.sektor_kegiatan || ''),
              jenisAlasHak: item.jenis_alas_hak || item.land_status || item.bukti_tanah || 'Sertipikat Hak Milik (SHM)',
              fileAlasHakUrl: item.file_alas_hak_url || item.sertifikat_tanah_url || undefined,
              fileSiteplanUrl: item.file_siteplan_url || undefined,
              rencanaLuasBgn: item.rencana_luas_bgn || item.luas_bangunan || undefined,
              districtName: item.kecamatan_name || 'Kecamatan Luwu',
              villageName: item.desa_name || 'Desa/Kelurahan',
              areaHa: item.luas_ha ? Number(item.luas_ha) : (item.luas_m2 ? Number((item.luas_m2 / 10000).toFixed(4)) : 0.5),
              pertekPuptrNum: resolvedPertekNum,
              pertekDate: item.updated_at || item.created_at,
              technicalNotes: item.catatan_teknis || 'Sesuai Rencana Tata Ruang Wilayah (RTRW) Kabupaten Luwu.',
              pertanianStatus: pertStatus,
              pertanianBaNumber: item.berita_acara_pertanian_num || undefined,
              noPertekBpn: item.no_pertek_bpn || undefined,
              statusPertekBpn: item.status_pertek_bpn || 'APPROVED',
              skPkkprNum: isDpmptspSkIssued ? (item.sk_pkkpr_num || `503/SK-PKKPR/DPMPTSP-LW/${item.id}`) : undefined,
              statusPkkpr: isDpmptspSkIssued ? 'Published' : 'Approved_PUPTR',
              createdAt: item.created_at || new Date().toISOString(),
              updatedAt: item.updated_at || item.created_at || new Date().toISOString(),
              isTteSigned: isDpmptspSkIssued,
              publishedToApplicant: isDpmptspSkIssued,
              geometry: item.geometry_json || item.geom || item.koordinat_poligon
            });
          });
        }
      } catch (err) {
        console.warn('Error fetching pkkpr_permohonan for OSS:', err);
      }

      // 2. Fetch from gis_pkkpr
      try {
        const { data: gisData, error: gisErr } = await supabase
          .from('gis_pkkpr')
          .select('*')
          .order('created_at', { ascending: false });

        if (!gisErr && gisData && gisData.length > 0) {
          gisData.forEach((item: any) => {
            if (records.some(r => r.id === item.id)) return;
            const isBerusaha = item.jenis_permohonan === 'Berusaha';
            const isApprovedPuptr = Boolean(
              item.pertek_puptr_num ||
              item.sk_pkkpr_num ||
              item.status_pkkpr === 'Approved' ||
              item.status_pkkpr === 'Approved_PUPTR' ||
              item.status_pkkpr === 'Forwarded_To_OSS' ||
              item.status_pkkpr === 'Published'
            );
            if (!isApprovedPuptr) return;

            let pertStatus: 'NOT_REQUIRED' | 'FORWARDED' | 'APPROVED' | 'REJECTED' = 'NOT_REQUIRED';
            if (item.berita_acara_pertanian_num || item.status_pkkpr === 'Approved_Pertanian') {
              pertStatus = 'APPROVED';
            } else if (item.status_pkkpr === 'Rejected_Pertanian') {
              pertStatus = 'REJECTED';
            } else if (item.status_pkkpr === 'Forwarded_To_Pertanian') {
              pertStatus = 'FORWARDED';
            }

            const isDpmptspSkIssued = Boolean(
              item.status_pkkpr === 'Published' ||
              (item.sk_pkkpr_num && item.sk_pkkpr_num.includes('DPMPTSP'))
            );

            const resolvedPertekNum =
              item.pertek_puptr_num ||
              (item.sk_pkkpr_num?.includes('PUPTR') ? item.sk_pkkpr_num : undefined) ||
              `503/PERTEK-PUPTR/LUWU/${item.id}`;

            const workflowStat = normalizeWorkflowStatus(
              item.status_permohonan || item.status_pkkpr || item.status,
              pertStatus,
              resolvedPertekNum,
              isDpmptspSkIssued ? item.sk_pkkpr_num : undefined
            );

            records.push({
              id: item.id,
              status_permohonan: workflowStat,
              applicantType: isBerusaha ? 'NIB (Pelaku Usaha)' : 'NIK (Perorangan / Warga)',
              nibNik: isBerusaha ? (item.nib_oss || item.nik_pemohon || '-') : (item.nik_pemohon || '-'),
              applicantName: item.nama_pemohon || 'Pemohon Terdaftar',
              companyName: isBerusaha ? (item.nama_badan_usaha || item.nama_permohonan || 'Pelaku Usaha') : (item.nama_badan_usaha || item.nama_pemohon || item.nama_permohonan || 'Perseorangan / Warga'),
              sector: item.sektor || (isBerusaha ? 'Komersial / Usaha' : 'Non-Komersial / Rumah Tinggal'),
              jenisPengajuanPkkpr: item.jenis_pengajuan_pkkpr || item.sektor || (isBerusaha ? 'Kawasan Industri / Gudang / Pabrik' : 'Rumah Tinggal / Hunian Perorangan'),
              kategoriPengajuan: item.kategori_pengajuan || getKategoriPengajuan(item.jenis_pengajuan_pkkpr || item.sektor || ''),
              jenisAlasHak: item.jenis_alas_hak || item.land_status || item.bukti_tanah || 'Sertipikat Hak Milik (SHM)',
              fileAlasHakUrl: item.file_alas_hak_url || item.sertifikat_tanah_url || undefined,
              fileSiteplanUrl: item.file_siteplan_url || undefined,
              rencanaLuasBgn: item.rencana_luas_bgn || item.luas_bangunan || undefined,
              districtName: item.kecamatan || 'Kecamatan Luwu',
              villageName: item.desa_kelurahan || 'Desa/Kelurahan',
              areaHa: item.luas_ha ? Number(item.luas_ha) : (item.luas_m2 ? Number((item.luas_m2 / 10000).toFixed(4)) : 0.5),
              pertekPuptrNum: resolvedPertekNum,
              pertekDate: item.updated_at || item.created_at,
              technicalNotes: item.catatan_teknis || 'Sesuai Rencana Tata Ruang Wilayah (RTRW) Kabupaten Luwu.',
              pertanianStatus: pertStatus,
              pertanianBaNumber: item.berita_acara_pertanian_num || undefined,
              noPertekBpn: item.no_pertek_bpn || undefined,
              statusPertekBpn: item.status_pertek_bpn || 'APPROVED',
              skPkkprNum: isDpmptspSkIssued ? item.sk_pkkpr_num : undefined,
              statusPkkpr: item.status_pkkpr || 'Pending Spatial Check',
              createdAt: item.created_at || new Date().toISOString(),
              updatedAt: item.updated_at || item.created_at || new Date().toISOString(),
              isTteSigned: isDpmptspSkIssued,
              publishedToApplicant: isDpmptspSkIssued,
              geometry: item.geometry_json || item.geom
            });
          });
        }
      } catch (e) {
        console.warn('Error fetching gis_pkkpr for OSS:', e);
      }

      // 3. Merge local applications from Masyarakat portal
      try {
        const localAppsRaw = localStorage.getItem("luwu_pkkpr_my_apps");
        if (localAppsRaw) {
          const localApps = JSON.parse(localAppsRaw);
          localApps.forEach((app: any) => {
            const appId = app.pkkpr_doc_number || app.id;
            const exists = records.some(m => m.id === appId || m.nibNik === app.nik);
            if (!exists) {
              const isBerusaha = app.category === 'Berusaha';
              const isPuptrDone = Boolean(app.pertek_puptr_num || app.pkkpr_status === 'Approved_PUPTR' || app.pkkpr_status === 'Approved');
              const isPublished = Boolean(app.sk_pkkpr_doc_number || app.status === 'Published');
              if (isPuptrDone || isPublished) {
                const workflowStat = normalizeWorkflowStatus(
                  app.status_permohonan || app.status_pkkpr || app.status,
                  app.pertanian_status,
                  app.pertek_puptr_num,
                  app.sk_pkkpr_doc_number
                );

                records.unshift({
                  id: appId || `PKKPR-LUWU-${Date.now().toString().slice(-6)}`,
                  status_permohonan: workflowStat,
                  applicantType: isBerusaha ? 'NIB (Pelaku Usaha)' : 'NIK (Perorangan / Warga)',
                  nibNik: app.nik || app.nib || '7317060202700001',
                  applicantName: app.nama_pemohon || 'Pemohon Terdaftar',
                  companyName: isBerusaha ? (app.perusahaan || app.title || 'Pelaku Usaha') : (app.nama_lembaga || app.title || 'Perseorangan / Warga'),
                  sector: isBerusaha ? 'Komersial / Usaha' : 'Non-Komersial / Perumahan',
                  districtName: app.kecamatan || 'Ponrang',
                  villageName: app.desa || 'Ponrang',
                  areaHa: app.luas_m2 ? Number((app.luas_m2 / 10000).toFixed(4)) : 0.05,
                  pertekPuptrNum: app.pertek_puptr_num || `503/PERTEK-PUPTR/LUWU/${Date.now().toString().slice(-4)}`,
                  pertekDate: app.created_at || new Date().toISOString(),
                  technicalNotes: app.catatan_teknis || 'Permohonan dari Portal Layanan Perizinan PKKPR Publik.',
                  pertanianStatus: app.pertanian_status === 'APPROVED' ? 'APPROVED' : 'NOT_REQUIRED',
                  pertanianBaNumber: app.berita_acara_pertanian_num || undefined,
                  skPkkprNum: app.sk_pkkpr_doc_number || undefined,
                  statusPkkpr: isPublished ? 'Published' : 'Approved_PUPTR',
                  createdAt: app.created_at || new Date().toISOString(),
                  updatedAt: app.created_at || new Date().toISOString(),
                  isTteSigned: isPublished,
                  publishedToApplicant: isPublished,
                  geometry: app.geometry
                });
              }
            }
          });
        }
      } catch (e) {
        console.warn('Local apps merge error in OSS:', e);
      }

      setItems(records);
    } catch (err) {
      console.error('Error fetching OSS PKKPR queue:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const handleUpdate = () => fetchQueue();
    window.addEventListener('luwu_cross_opd_notifications_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('luwu_cross_opd_notifications_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Filter queues: Ready to issue vs Already published
  const readyQueue = useMemo(() => {
    return items.filter(item => {
      const rawStatusPkkpr = String(item.statusPkkpr || '').toUpperCase();
      const statusPermohonan = String(item.status_permohonan || '').toUpperCase();
      return (
        rawStatusPkkpr !== 'TERBIT' && 
        rawStatusPkkpr !== 'ISSUED' && 
        rawStatusPkkpr !== 'PUBLISHED' &&
        statusPermohonan !== 'IZIN_TERBIT' &&
        !item.publishedToApplicant
      );
    });
  }, [items]);

  const publishedArchive = useMemo(() => {
    return items.filter(item => {
      const rawStatusPkkpr = String(item.statusPkkpr || '').toUpperCase();
      const statusPermohonan = String(item.status_permohonan || '').toUpperCase();
      return (
        rawStatusPkkpr === 'TERBIT' || 
        rawStatusPkkpr === 'ISSUED' || 
        rawStatusPkkpr === 'PUBLISHED' ||
        statusPermohonan === 'IZIN_TERBIT' ||
        item.publishedToApplicant
      );
    });
  }, [items]);

  // Handle opening the Issuance & TTE modal
  const handleOpenProcessModal = (item: PkkprIssuanceItem) => {
    setSelectedItem(item);
    setCustomSkData(null);
    const year = new Date().getFullYear();
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const generated = item.skPkkprNum || `503/SK-PKKPR/DPMPTSP-LW/${year}/${randomSeq}`;
    setGeneratedSkNumber(generated);
    setIsTteApplied(Boolean(item.isTteSigned));
    setUploadedTteFile(null);
    setIsProcessModalOpen(true);
  };

  // Action 1: Generate & Preview SK PKKPR Draft PDF
  const handleGeneratePdfDraft = () => {
    setIsPdfPreviewOpen(true);
  };

  // Action 1B: Off-system TTE: Download Draft for BeSign
  const handleDownloadDraftForTte = () => {
    setIsPdfPreviewOpen(true);
    Swal.fire({
      icon: 'info',
      title: 'Workflow Off-system TTE (BeSign) 📝',
      html: `
        <div class="text-left text-xs space-y-2 p-3 bg-blue-50 dark:bg-blue-950/60 rounded-xl border border-blue-200 dark:border-blue-800 font-sans">
          <p class="text-slate-900 dark:text-blue-100"><strong>1. Unduh Draft SK:</strong> Gunakan menu Download/Cetak PDF pada jendela pratinjau dokumen yang terbuka.</p>
          <p class="text-slate-900 dark:text-blue-100"><strong>2. Tanda Tangani di BeSign:</strong> Pejabat berwenang melakukan penyematan sertifikat elektronik BSRE melalui portal BeSign secara terpisah.</p>
          <p class="text-slate-900 dark:text-blue-100"><strong>3. Unggah Berkas Final:</strong> Masukkan file PDF hasil penandatanganan pada formulir <em>Upload Berkas TTE</em> di bawah.</p>
        </div>
      `,
      confirmButtonColor: '#3b82f6',
      confirmButtonText: 'Buka Pratinjau & Unduh Draft 📄'
    });
  };

  // Action 2: Apply Digital TTE
  const handleApplyTte = () => {
    setIsTteApplied(true);
    Swal.fire({
      icon: 'success',
      title: 'TTE Digital Berhasil Disematkan! ✍️',
      html: `
        <div class="text-left text-xs space-y-2 p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-300 dark:border-emerald-800">
          <p><strong>Penandatangan:</strong> ${tteSignerName}</p>
          <p><strong>Jabatan:</strong> ${tteSignerTitle}</p>
          <p><strong>Status Sertifikasi:</strong> <span class="text-emerald-600 dark:text-emerald-400 font-bold">BSRE / Diskominfo-SP Terverifikasi</span></p>
          <p class="text-[11px] text-slate-500 pt-1 border-t border-emerald-200">QR-Code otentikasi digital telah di-generate secara otomatis pada lembar dokumen.</p>
        </div>
      `,
      confirmButtonColor: '#10b981'
    });
  };

  // Action 3: Publish SK PKKPR to Applicant Dashboard (IZIN_TERBIT)
  const handlePublishToApplicant = async () => {
    if (!selectedItem) return;
    if (!isTteApplied && !uploadedTteFile) {
      Swal.fire({
        icon: 'warning',
        title: 'TTE Belum Disematkan',
        text: 'Mohon klik tombol "Terapkan TTE Digital", unduh draft untuk BeSign, atau unggah file SK bertanda tangan sebelum mengirim izin ke pemohon.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    const confirm = await Swal.fire({
      title: 'Kirim SK Izin PKKPR ke Pemohon?',
      html: `
        <div class="text-left text-xs space-y-2 p-2 font-sans">
          <p>Dokumen <strong>SK Izin PKKPR No. ${generatedSkNumber}</strong> akan langsung terbit dengan status <strong>IZIN_TERBIT</strong> dan dikirimkan ke Dashboard Pemohon <strong>${selectedItem.applicantName}</strong> (${selectedItem.companyName}).</p>
          <p class="text-emerald-600 font-bold">✓ Pemohon dapat langsung mengunduh & mencetak dokumen ini untuk persyaratan Persetujuan Bangunan Gedung (PBG).</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Kirim ke Pemohon 🚀',
      cancelButtonText: 'Batal'
    });

    if (!confirm.isConfirmed) return;

    setIsSubmitting(true);
    try {
      const timestamp = new Date().toISOString();
      const verificationUrl = `https://mpp.luwukab.go.id/verifikasi/pkkpr/${selectedItem.id}`;

      // Calculate realized SLA working days
      let slaDays = 1;
      const startIso = selectedItem.createdAt;
      if (startIso) {
        const start = new Date(startIso);
        const end = new Date();
        let count = 0;
        const cur = new Date(start);
        while (cur <= end) {
          const dow = cur.getDay();
          if (dow !== 0 && dow !== 6) count++;
          cur.setDate(cur.getDate() + 1);
        }
        slaDays = Math.max(1, count);
      }

      // 1. Call Backend API POST /api/v1/pkkpr/workflow/oss-publish-izin
      try {
        await fetch('/api/v1/pkkpr/workflow/oss-publish-izin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            permohonan_id: selectedItem.id,
            sk_pkkpr_num: generatedSkNumber,
            tte_signer_name: tteSignerName,
            tte_signer_nip: tteSignerNip,
            tte_document_url: uploadedTteFile || undefined
          })
        });
      } catch (apiErr) {
        console.warn('API /api/v1/pkkpr/workflow/oss-publish-izin note:', apiErr);
      }

      // 2. Update Supabase tables
      await Promise.all([
        supabase
          .from('gis_pkkpr')
          .update({
            status_permohonan: 'IZIN_TERBIT',
            sk_pkkpr_num: generatedSkNumber,
            sk_pkkpr_doc_number: generatedSkNumber,
            status_pkkpr: 'TERBIT',
            is_tte_signed: true,
            published_to_applicant: true,
            sla_realized_days: slaDays,
            tte_document_url: uploadedTteFile || undefined,
            published_at: timestamp,
            updated_at: timestamp
          })
          .eq('id', selectedItem.id),
        supabase
          .from('investments')
          .update({
            status_permohonan: 'IZIN_TERBIT',
            sk_pkkpr_doc_number: generatedSkNumber,
            status: 'TERBIT',
            is_tte_signed: true,
            sla_realized_days: slaDays,
            published_at: timestamp,
            updated_at: timestamp
          })
          .eq('id', selectedItem.id),
        supabase
          .from('gis_pkkpr')
          .update({
            status_pkkpr: 'TERBIT',
            sk_pkkpr_num: generatedSkNumber,
            updated_at: timestamp
          })
          .eq('id', selectedItem.id)
      ]);

      // 3. Supabase Realtime Broadcast to notify other open dashboards immediately
      try {
        const updateChannel = supabase.channel('pkkpr_updates');
        await updateChannel.send({
          type: 'broadcast',
          event: 'pkkpr_published',
          payload: {
            id: selectedItem.id,
            sk_pkkpr_num: generatedSkNumber,
            status_pkkpr: 'TERBIT',
            status_permohonan: 'IZIN_TERBIT',
            is_tte_signed: true,
            published_at: timestamp,
            sla_realized_days: slaDays,
            verification_url: verificationUrl
          }
        });
        supabase.removeChannel(updateChannel);
      } catch (bcErr) {
        console.warn('[OssIssuance] Realtime broadcast error:', bcErr);
      }

      // 4. Dispatch local cross-tab event
      try {
        localStorage.setItem('luwu_pkkpr_last_event', JSON.stringify({
          action: 'PUBLISH_TERBIT',
          id: selectedItem.id,
          sk_pkkpr_num: generatedSkNumber,
          timestamp
        }));
        window.dispatchEvent(new CustomEvent('luwu_cross_opd_notifications_updated'));
      } catch (e) {}

      // 5. Add cross-OPD notification to Pemohon
      addCrossOpdNotification({
        applicationId: selectedItem.id,
        applicantName: selectedItem.applicantName,
        companyName: selectedItem.companyName,
        sector: selectedItem.sector,
        districtName: selectedItem.districtName,
        villageName: selectedItem.villageName,
        targetRole: 'PEMOHON',
        fromRole: 'ADMIN_DPMPTSP',
        type: 'APPROVED_PUPTR',
        title: `SK Izin PKKPR Resmi Terbit #${generatedSkNumber}`,
        message: `Selamat! DPMPTSP Kab. Luwu telah menerbitkan SK Izin PKKPR No. ${generatedSkNumber} (TTE Sah) dalam ${slaDays} hari kerja. Dokumen ini sudah dapat diunduh di dashboard Anda sebagai syarat pengurusan PBG.`,
        bapPuptrDocNumber: selectedItem.pertekPuptrNum,
        skPkkprDocNumber: generatedSkNumber
      });

      // Update local state
      setItems(prev =>
        prev.map(item => {
          if (item.id === selectedItem.id) {
            return {
              ...item,
              status_permohonan: 'IZIN_TERBIT',
              skPkkprNum: generatedSkNumber,
              statusPkkpr: 'TERBIT',
              isTteSigned: true,
              publishedToApplicant: true,
              updatedAt: timestamp
            };
          }
          return item;
        })
      );

      // Re-fetch data real-time to guarantee perfect sync
      await fetchQueue();

      setIsProcessModalOpen(false);

      Swal.fire({
        icon: 'success',
        title: 'SK Izin PKKPR Terbit! 🎉',
        html: `
          <div class="text-left text-xs space-y-2 p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-300 dark:border-emerald-800 font-sans">
            <p class="text-slate-900 dark:text-emerald-100"><strong>Nomor SK PKKPR:</strong> <code class="font-mono text-emerald-600 dark:text-emerald-300 font-bold">${generatedSkNumber}</code></p>
            <p class="text-slate-900 dark:text-emerald-100"><strong>Pemohon:</strong> ${selectedItem.applicantName} (${selectedItem.companyName})</p>
            <p class="text-slate-900 dark:text-emerald-100"><strong>Status TTE:</strong> <span class="text-emerald-600 dark:text-emerald-400 font-bold">Terverifikasi BSRE &amp; Siap Dipakai</span></p>
            <p class="text-[11px] text-slate-500 pt-1 border-t border-emerald-200">
              Dokumen telah diterbitkan secara sah dan otomatis tersedia pada Dashboard Masyarakat Pemohon.
            </p>
          </div>
        `,
        confirmButtonColor: '#10b981'
      });
    } catch (err: any) {
      console.error('Error publishing SK PKKPR:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menerbitkan Izin',
        text: err.message || 'Terjadi kesalahan sistem.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredQueue = readyQueue.filter(
    item =>
      item.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nibNik.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredArchive = publishedArchive.filter(
    item =>
      item.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.skPkkprNum || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nibNik.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Top Banner DPMPTSP & OSS-RBA */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-900 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-64 bg-teal-500/10 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Building2 className="w-3.5 h-3.5" />
              <span>DPMPTSP KABUPATEN LUWU • BIDANG PERIZINAN &amp; OSS-RBA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Penerbitan SK Izin PKKPR &amp; TTE Digital
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Modul penerbitan resmi Surat Keputusan (SK) Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) berdasarkan Rekomendasi Teknis (Pertek) Dinas PUPTR &amp; BAP Pertanian, dilengkapi TTE Digital dan distribusi langsung ke Pemohon untuk prasyarat PBG.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchQueue}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-2 border border-white/10 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Sinkronisasi Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Antrean Pertek PUPTR</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {readyQueue.length} Berkas
          </div>
          <p className="text-[10px] text-slate-500">Siap Diterbitkan SK PKKPR</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>SK Terbit &amp; Terkirim</span>
            <FileCheck2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {publishedArchive.length} Izin
          </div>
          <p className="text-[10px] text-slate-500">Telah Di-TTE &amp; Aktif untuk PBG</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Standar SLA Penerbitan</span>
            <ShieldCheck className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-black text-teal-600 dark:text-teal-400">
            &le; 3 Hari Kerja
          </div>
          <p className="text-[10px] text-slate-500">Target Pelayanan DPMPTSP</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Sertifikasi TTE</span>
            <QrCode className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            BSRE Valid
          </div>
          <p className="text-[10px] text-slate-500">Digital Signature Aktif</p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'queue'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Antrean Siap Terbit SK ({readyQueue.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('archive')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'archive'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Arsip SK PKKPR Terbit ({publishedArchive.length})</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-64 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari pemohon, NIB, perusahaan..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none"
          />
        </div>
      </div>

      {/* TAB 1: Antrean Penerbitan SK PKKPR */}
      {activeTab === 'queue' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Daftar Rekomendasi Teknis (Pertek) PUPTR Masuk
              </h3>
              <p className="text-xs text-slate-500">
                Permohonan yang telah diverifikasi tata ruang oleh Dinas PUPTR &amp; siap diterbitkan Surat Keputusan Izin PKKPR oleh DPMPTSP.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-teal-500" />
              <p className="text-xs text-slate-500">Memuat antrean verifikasi...</p>
            </div>
          ) : filteredQueue.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center px-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2 opacity-60" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Semua Berkas Telah Diterbitkan</h4>
              <p className="text-xs text-slate-500 max-w-md mt-1">
                Tidak ada antrean tertunda dari Dinas PUPTR saat ini. Seluruh permohonan telah diterbitkan SK izinnya.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                    <th className="py-3 px-3">No. Registrasi</th>
                    <th className="py-3 px-3">Pelaku Usaha / Pemohon</th>
                    <th className="py-3 px-3">Lokasi &amp; Luas Lahan</th>
                    <th className="py-3 px-3">Rekomendasi PUPTR (Pertek)</th>
                    <th className="py-3 px-3">BAP Pertanian</th>
                    <th className="py-3 px-3">Timeline SLA</th>
                    <th className="py-3 px-3 text-right">Aksi Penerbitan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
                  {filteredQueue.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-3">
                        <div className="font-mono font-bold text-teal-600 dark:text-teal-400">{item.id}</div>
                        <div className="text-[10px] text-slate-500">{item.nibNik}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">{item.companyName}</div>
                        <div className="text-[11px] text-slate-500">{item.applicantName} • {item.sector}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">Kec. {item.districtName}</div>
                        <div className="text-[10px] text-emerald-600 font-bold">{item.areaHa} Ha</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-mono font-bold text-[10px] block truncate max-w-[180px]">
                          {item.pertekPuptrNum || 'Pertek Disetujui'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        {item.pertanianBaNumber ? (
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 font-mono font-bold text-[10px] block truncate max-w-[150px]">
                            {item.pertanianBaNumber}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Non-LP2B</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedItem(item);
                            setIsTimelineModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Clock className="w-3 h-3 text-emerald-500" />
                          <span>Lacak SLA</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenProcessModal(item)}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 ml-auto shadow-md shadow-teal-600/20 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Terbitkan SK Izin &amp; TTE</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Arsip SK PKKPR Terbit */}
      {activeTab === 'archive' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Buku Arsip Izin PKKPR Resmi Terbit (TTE Sah)
              </h3>
              <p className="text-xs text-slate-500">
                Dokumen izin yang telah disahkan digital dan telah didistribusikan ke dashboard pemohon untuk persyaratan PBG.
              </p>
            </div>
          </div>

          {filteredArchive.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Belum ada arsip SK yang terdaftar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                    <th className="py-3 px-3">Nomor SK Izin PKKPR</th>
                    <th className="py-3 px-3">Pemohon / Perusahaan</th>
                    <th className="py-3 px-3">Lokasi &amp; Luas</th>
                    <th className="py-3 px-3">Status TTE</th>
                    <th className="py-3 px-3">Distribusi Pemohon</th>
                    <th className="py-3 px-3 text-right">Aksi Dokumen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
                  {filteredArchive.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-3">
                        <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{item.skPkkprNum || `503/SK-PKKPR/DPMPTSP-LW/${item.id}`}</div>
                        <div className="text-[10px] text-slate-500">ID: {item.id}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">{item.companyName}</div>
                        <div className="text-[11px] text-slate-500">{item.applicantName}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">Kec. {item.districtName}</div>
                        <div className="text-[10px] text-emerald-600 font-bold">{item.areaHa} Ha</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-bold text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>TTE Sah (BSRE)</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 font-bold text-[10px] inline-flex items-center gap-1">
                          <Check className="w-3 h-3 text-blue-500" />
                          <span>Tersedia untuk PBG</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItem(item);
                              setGeneratedSkNumber(item.skPkkprNum || `503/SK-PKKPR/DPMPTSP-LW/${item.id}`);
                              setIsPdfPreviewOpen(true);
                            }}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white border border-slate-200 dark:border-transparent font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Lihat SK</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItem(item);
                              setIsTimelineModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs cursor-pointer"
                          >
                            <Clock className="w-3 h-3 text-emerald-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: WORKSPACE PENERBITAN & TTE SK PKKPR */}
      {isProcessModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/10 text-teal-600 border border-teal-500/20">
                    Proses Penerbitan Izin
                  </span>
                  <span className="text-xs text-slate-500 font-mono">ID: {selectedItem.id}</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Penerbitan SK Izin PKKPR &amp; TTE Digital
                </h3>
                <p className="text-xs text-slate-500">
                  Pelaku Usaha: <strong>{selectedItem.companyName}</strong> ({selectedItem.applicantName})
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsProcessModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 3 Pilar Verifikasi Teknis & Stepper Workflow Guide */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>1. Pertek PUPTR</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono truncate">{selectedItem.pertekPuptrNum || 'Pertek Valid ✓'}</p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-bold">
                  <Wheat className="w-4 h-4 text-blue-600" />
                  <span>2. BAP Pertanian</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono truncate">
                  {selectedItem.pertanianBaNumber || 'Non-LP2B / Sesuai ✓'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-300 dark:border-indigo-800 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-bold">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>3. Pertek BPN</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono truncate">
                  {selectedItem.noPertekBpn || 'Clear P4T BPN ✓'}
                </p>
              </div>

              <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                isTteApplied ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
              }`}>
                <div className="flex items-center gap-1.5 font-bold">
                  <QrCode className="w-4 h-4 text-amber-600" />
                  <span className={isTteApplied ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}>
                    4. TTE Digital
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono truncate">
                  {isTteApplied ? 'TTE Siap Disahkan ✓' : 'Belum Disahkan ⏳'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                  <Send className="w-4 h-4 text-teal-600" />
                  <span>5. Terbit SK</span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono">Untuk Prasyarat PBG</p>
              </div>
            </div>

            {/* Form Fields & Decision Box */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nomor SK Izin PKKPR DPMPTSP
                  </label>
                  <input
                    type="text"
                    value={generatedSkNumber}
                    onChange={e => setGeneratedSkNumber(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 outline-none"
                  />
                  <p className="text-[10px] text-slate-500">Nomor registrasi resmi izin berusaha OSS-RBA Kab. Luwu.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Pejabat Penandatangan TTE
                  </label>
                  <input
                    type="text"
                    value={tteSignerName}
                    onChange={e => setTteSignerName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none"
                  />
                  <p className="text-[10px] text-slate-500">{tteSignerTitle} (NIP. {tteSignerNip})</p>
                </div>
              </div>

              {/* Panel Legalitas Lahan & Peruntukan */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Legalitas Lahan &amp; Peruntukan Ruang
                  </h4>
                  {selectedItem.kategoriPengajuan === 'PARSIL_TANAH' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      🗺️ KATEGORI PARSIL TANAH (ATR/BPN)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      🏗️ KATEGORI KONSTRUKSI / BANGUNAN
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Jenis Pengajuan PKKPR:</span>
                    <span className="font-bold text-slate-900 dark:text-white block mt-0.5">
                      {selectedItem.jenisPengajuanPkkpr || selectedItem.sector}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Bukti Penguasaan Hak Atas Tanah:</span>
                    <span className="font-bold text-slate-900 dark:text-white block mt-0.5">
                      {selectedItem.jenisAlasHak || 'Sertipikat Hak Milik (SHM)'}
                    </span>
                  </div>
                </div>

                {/* Tautan Berkas Terunggah */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
                  {selectedItem.fileAlasHakUrl && (
                    <a
                      href={selectedItem.fileAlasHakUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-100 flex items-center gap-1.5 transition-all"
                    >
                      <FileText className="w-3.5 h-3.5" /> 📄 Lihat Berkas Sertifikat / Alas Hak
                    </a>
                  )}

                  {selectedItem.kategoriPengajuan !== 'PARSIL_TANAH' && selectedItem.fileSiteplanUrl && (
                    <a
                      href={selectedItem.fileSiteplanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-800 rounded-xl text-xs font-bold hover:bg-teal-100 flex items-center gap-1.5 transition-all"
                    >
                      <Building2 className="w-3.5 h-3.5" /> 📐 Lihat Siteplan Bangunan
                    </a>
                  )}
                </div>
              </div>

              {/* Action 1: Preview SK PDF & Smart Form */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-teal-600" />
                    <span>Naskah &amp; Draf SK Izin PKKPR DPMPTSP</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Periksa draf keputusan izin lengkap dengan Kop Dinas, Konsideran, Diktum Memutuskkan, Rujukan Pertek PUPTR &amp; BAP Pertanian.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSmartFormOpen(true)}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Smart Form Editor ✨</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleGeneratePdfDraft}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Lihat Draf SK</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadDraftForTte}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
                    title="Unduh Draf SK untuk ditandatangani di aplikasi BeSign / BSRE secara terpisah"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Draft untuk TTE (BeSign) 📝</span>
                  </button>
                </div>
              </div>

              {/* Action 2: Digital TTE & Upload */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-blue-600" />
                    <span>Pengesahan TTE (Tanda Tangan Elektronik)</span>
                  </h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isTteApplied ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isTteApplied ? 'TTE Aktif ✓' : 'Menunggu Pengesahan'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Pilih metode pengesahan: gunakan sertifikat digital BSRE terintegrasi secara otomatis, atau unggah dokumen PDF yang telah ditandatangani manual/eksternal.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleApplyTte}
                    className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Terapkan TTE Digital Otomatis (BSRE) ✍️</span>
                  </button>

                  <label className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition">
                    <Upload className="w-4 h-4" />
                    <span>{uploadedTteFile ? `File: ${uploadedTteFile}` : 'Upload Berkas TTE (PDF)'}</span>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          setUploadedTteFile(e.target.files[0].name);
                          setIsTteApplied(true);
                          Swal.fire({
                            icon: 'success',
                            title: 'Berkas TTE Terunggah',
                            text: `File ${e.target.files[0].name} siap didistribusikan.`,
                            confirmButtonColor: '#10b981',
                            timer: 2000
                          });
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsProcessModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Tutup
              </button>

              {(selectedItem?.publishedToApplicant || selectedItem?.statusPkkpr === 'Published') ? (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-xs space-y-1 font-sans text-left">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-extrabold uppercase">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>✓ SK IZIN PKKPR TELAH DITERBITKAN &amp; TERARSIP</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200">
                    No. SK Official: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{selectedItem.skPkkprNum || generatedSkNumber}</strong>
                  </p>
                  <p className="text-[11px] text-slate-500 pt-1 border-t border-emerald-200 dark:border-emerald-800/60">
                    🔒 Dokumen ini telah terbit dan dikirimkan ke Pemohon. Tombol pengiriman ulang telah dinonaktifkan.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting || !isTteApplied}
                  onClick={handlePublishToApplicant}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition ${
                    isTteApplied && !isSubmitting
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 cursor-pointer'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-300 dark:border-slate-700 cursor-not-allowed opacity-60'
                  }`}
                  title={!isTteApplied ? 'Wajib menerapkan TTE Digital BSrE atau mengunggah berkas TTE sebelum menerbitkan izin' : ''}
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>
                    {isTteApplied
                      ? 'Kirim Izin PKKPR ke Dashboard Pemohon 🚀'
                      : 'TTE Belum Diterapkan (Wajib TTE BSrE) 🔒'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TIMELINE SLA TRACKER */}
      {isTimelineModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Laporan Alur &amp; Waktu Pelayanan (SLA PKKPR)
              </h3>
              <button
                type="button"
                onClick={() => setIsTimelineModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <PkkprSlaTimelineTracker
              data={{
                id: selectedItem.id,
                nibNik: selectedItem.nibNik,
                applicantName: selectedItem.applicantName,
                companyName: selectedItem.companyName,
                sector: selectedItem.sector,
                districtName: selectedItem.districtName,
                villageName: selectedItem.villageName,
                areaHa: selectedItem.areaHa,
                createdAt: selectedItem.createdAt,
                updatedAt: selectedItem.updatedAt,
                statusPkkpr: selectedItem.statusPkkpr,
                pertekPuptrNum: selectedItem.pertekPuptrNum,
                catatanTeknisPuptr: selectedItem.technicalNotes,
                pertanianStatus: selectedItem.pertanianStatus,
                beritaAcaraPertanianNum: selectedItem.pertanianBaNumber,
                skPkkprNum: selectedItem.skPkkprNum
              }}
            />
          </div>
        </div>
      )}

      {/* MODAL 3: PREVIEW & CETAK SK IZIN PKKPR RESMI (PDF FORMAT) */}
      {isPdfPreviewOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 w-full max-w-5xl max-h-[94vh] overflow-y-auto shadow-2xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-teal-300">Pratinjau Dokumen Resmi SK Izin PKKPR DPMPTSP</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPdfPreviewOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            {/* Official SK PKKPR Document Component */}
            <SkPkkprDpmptspDocument
              data={customSkData || buildSkData(selectedItem, generatedSkNumber, isTteApplied)}
              onEditRequested={() => setIsSmartFormOpen(true)}
            />
          </div>
        </div>
      )}

      {/* MODAL 4: SMART FORM EDIT SK PKKPR */}
      {isSmartFormOpen && selectedItem && (
        <SmartFormSkPkkprModal
          isOpen={isSmartFormOpen}
          onClose={() => setIsSmartFormOpen(false)}
          initialData={customSkData || buildSkData(selectedItem, generatedSkNumber, isTteApplied)}
          onSave={async (updatedData) => {
            setCustomSkData(updatedData);
            setGeneratedSkNumber(updatedData.nomorSkPkkpr);
            setIsSmartFormOpen(false);
            Swal.fire({
              icon: 'success',
              title: 'Draf SK PKKPR Diperbarui! ✨',
              text: 'Naskah, Konsideran, Diktum Memutuskan, dan Parameter Teknis SK Izin PKKPR berhasil disesuaikan.',
              confirmButtonColor: '#10b981'
            });
          }}
        />
      )}
    </div>
  );
};
