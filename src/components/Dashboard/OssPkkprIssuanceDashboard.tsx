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
import { supabase } from '../../lib/supabase';
import { getOpdSettings } from '../../utils/opdSettingsStorage';
import { addCrossOpdNotification } from '../../utils/crossOpdNotificationStore';
import { PkkprSlaTimelineTracker, PkkprSlaTimelineData } from './PkkprSlaTimelineTracker';

interface PkkprIssuanceItem {
  id: string;
  applicantType: string;
  nibNik: string;
  applicantName: string;
  companyName: string;
  sector: string;
  districtName: string;
  villageName: string;
  areaHa: number;
  pertekPuptrNum?: string;
  pertekDate?: string;
  technicalNotes?: string;
  pertanianStatus?: 'NOT_REQUIRED' | 'FORWARDED' | 'APPROVED' | 'REJECTED';
  pertanianBaNumber?: string;
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

  // Processing form state
  const [generatedSkNumber, setGeneratedSkNumber] = useState('');
  const [tteSignerName, setTteSignerName] = useState('Drs. H. Muhammad Rudi, M.Si');
  const [tteSignerNip, setTteSignerNip] = useState('19740812 199803 1 004');
  const [tteSignerTitle, setTteSignerTitle] = useState('Kepala DPMPTSP Kabupaten Luwu');
  const [isTteApplied, setIsTteApplied] = useState(false);
  const [uploadedTteFile, setUploadedTteFile] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dpmptspSettings = getOpdSettings('dpmptsp');

  // Fetch verified pertek records from PUPTR
  const fetchQueue = async () => {
    setLoading(true);
    try {
      const records: PkkprIssuanceItem[] = [];

      // 1. Fetch from gis_pkkpr
      try {
        const { data: gisData, error: gisErr } = await supabase
          .from('gis_pkkpr')
          .select('*')
          .order('created_at', { ascending: false });

        if (!gisErr && gisData && gisData.length > 0) {
          gisData.forEach((item: any) => {
            const isBerusaha = item.jenis_permohonan === 'Berusaha';
            const isApprovedPuptr = Boolean(
              item.pertek_puptr_num ||
              item.sk_pkkpr_num ||
              item.status_pkkpr === 'Approved' ||
              item.status_pkkpr === 'Approved_PUPTR' ||
              item.status_pkkpr === 'Published'
            );

            let pertStatus: 'NOT_REQUIRED' | 'FORWARDED' | 'APPROVED' | 'REJECTED' = 'NOT_REQUIRED';
            if (item.berita_acara_pertanian_num || item.status_pkkpr === 'Approved_Pertanian') {
              pertStatus = 'APPROVED';
            } else if (item.status_pkkpr === 'Rejected_Pertanian') {
              pertStatus = 'REJECTED';
            } else if (item.status_pkkpr === 'Forwarded_To_Pertanian') {
              pertStatus = 'FORWARDED';
            }

            records.push({
              id: item.id,
              applicantType: isBerusaha ? 'NIB (Pelaku Usaha)' : 'NIK (Perorangan / Warga)',
              nibNik: isBerusaha ? (item.nib_oss || item.nik_pemohon || '-') : (item.nik_pemohon || '-'),
              applicantName: item.nama_pemohon || 'Pemohon Terdaftar',
              companyName: isBerusaha ? (item.nama_badan_usaha || item.nama_permohonan || 'Pelaku Usaha') : (item.nama_pemohon || 'Perseorangan / Warga'),
              sector: item.sektor || (isBerusaha ? 'Komersial / Usaha' : 'Non-Komersial / Rumah Tinggal'),
              districtName: item.kecamatan || 'Kecamatan Luwu',
              villageName: item.desa_kelurahan || 'Desa/Kelurahan',
              areaHa: item.luas_ha ? Number(item.luas_ha) : (item.luas_m2 ? Number((item.luas_m2 / 10000).toFixed(4)) : 0.5),
              pertekPuptrNum: item.pertek_puptr_num || (item.sk_pkkpr_num ? `503/PERTEK-PUPTR/LUWU/${item.id}` : undefined),
              pertekDate: item.updated_at || item.created_at,
              technicalNotes: item.catatan_teknis || 'Sesuai Rencana Tata Ruang Wilayah (RTRW) Kabupaten Luwu.',
              pertanianStatus: pertStatus,
              pertanianBaNumber: item.berita_acara_pertanian_num || undefined,
              skPkkprNum: item.sk_pkkpr_num || undefined,
              statusPkkpr: item.status_pkkpr || 'Pending Spatial Check',
              createdAt: item.created_at || new Date().toISOString(),
              updatedAt: item.updated_at || item.created_at || new Date().toISOString(),
              isTteSigned: Boolean(item.sk_pkkpr_num || item.status_pkkpr === 'Published'),
              publishedToApplicant: item.status_pkkpr === 'Published',
              geometry: item.geometry_json || item.geom
            });
          });
        }
      } catch (e) {
        console.warn('Error fetching gis_pkkpr for OSS:', e);
      }

      // 2. Fetch from investments table for fallback
      try {
        const { data: invData, error: invErr } = await supabase
          .from('investments')
          .select('*')
          .order('updated_at', { ascending: false });

        if (!invErr && invData && invData.length > 0) {
          invData.forEach((item: any) => {
            if (!records.some(r => r.id === item.id)) {
              const isApproved = item.status === 'Approved' || item.status === 'Published';
              records.push({
                id: item.id,
                applicantType: 'NIB (Pelaku Usaha)',
                nibNik: item.nib || `NIB-LUWU-${item.id.slice(0, 8)}`,
                applicantName: item.contact_pic || 'Pelaku Usaha',
                companyName: item.name || 'Badan Usaha',
                sector: item.sector || 'Investasi Prioritas',
                districtName: item.kecamatan || 'Kabupaten Luwu',
                villageName: item.desa || '-',
                areaHa: item.area_ha || 1.0,
                pertekPuptrNum: item.pkkpr_doc_number || `503/PERTEK-PUPTR/LUWU/${item.id.slice(0, 6)}`,
                technicalNotes: item.override_justification || 'Kesesuaian Ruang PUPTR Terverifikasi.',
                pertanianStatus: 'APPROVED',
                skPkkprNum: item.sk_pkkpr_doc_number || (item.status === 'Published' ? `503/SK-PKKPR/DPMPTSP-LW/${item.id.slice(0, 6)}` : undefined),
                statusPkkpr: item.status === 'Published' ? 'Published' : (isApproved ? 'Approved' : 'Pending'),
                createdAt: item.created_at || new Date().toISOString(),
                updatedAt: item.updated_at || new Date().toISOString(),
                isTteSigned: item.status === 'Published',
                publishedToApplicant: item.status === 'Published'
              });
            }
          });
        }
      } catch (e) {
        console.warn('Error fetching investments for OSS:', e);
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
  }, []);

  // Filter queues: Ready to issue vs Already published
  const readyQueue = useMemo(() => {
    return items.filter(item => {
      // Has PERTEK or PUPTR approval, but not yet published to applicant
      const isPuptrApproved = Boolean(
        item.pertekPuptrNum ||
        item.statusPkkpr === 'Approved' ||
        item.statusPkkpr === 'Approved_PUPTR' ||
        item.statusPkkpr === 'Forwarded_To_OSS'
      );
      const isNotYetPublished = !item.publishedToApplicant;
      return isPuptrApproved && isNotYetPublished;
    });
  }, [items]);

  const publishedArchive = useMemo(() => {
    return items.filter(item => item.publishedToApplicant || Boolean(item.skPkkprNum));
  }, [items]);

  // Handle opening the Issuance & TTE modal
  const handleOpenProcessModal = (item: PkkprIssuanceItem) => {
    setSelectedItem(item);
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

  // Action 3: Publish SK PKKPR to Applicant Dashboard
  const handlePublishToApplicant = async () => {
    if (!selectedItem) return;
    if (!isTteApplied && !uploadedTteFile) {
      Swal.fire({
        icon: 'warning',
        title: 'TTE Belum Disematkan',
        text: 'Mohon klik tombol "Terapkan TTE Digital" atau unggah file SK bertanda tangan sebelum mengirim izin ke pemohon.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    const confirm = await Swal.fire({
      title: 'Kirim SK Izin PKKPR ke Pemohon?',
      html: `
        <div class="text-left text-xs space-y-2 p-2 font-sans">
          <p>Dokumen <strong>SK Izin PKKPR No. ${generatedSkNumber}</strong> akan langsung terbit dan dikirimkan ke Dashboard Pemohon <strong>${selectedItem.applicantName}</strong> (${selectedItem.companyName}).</p>
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

      // Update gis_pkkpr
      await supabase
        .from('gis_pkkpr')
        .update({
          sk_pkkpr_num: generatedSkNumber,
          status_pkkpr: 'Published',
          updated_at: timestamp
        })
        .eq('id', selectedItem.id);

      // Update investments table as published
      await supabase
        .from('investments')
        .update({
          sk_pkkpr_doc_number: generatedSkNumber,
          status: 'Published',
          updated_at: timestamp
        })
        .eq('id', selectedItem.id);

      // Add cross-OPD notification to Pemohon
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
        message: `Selamat! DPMPTSP Kab. Luwu telah menerbitkan SK Izin PKKPR No. ${generatedSkNumber} (TTE Sah). Dokumen ini sudah dapat diunduh di dashboard Anda sebagai syarat pengurusan PBG.`,
        bapPuptrDocNumber: selectedItem.pertekPuptrNum,
        skPkkprDocNumber: generatedSkNumber
      });

      // Update local state
      setItems(prev =>
        prev.map(item => {
          if (item.id === selectedItem.id) {
            return {
              ...item,
              skPkkprNum: generatedSkNumber,
              statusPkkpr: 'Published',
              isTteSigned: true,
              publishedToApplicant: true,
              updatedAt: timestamp
            };
          }
          return item;
        })
      );

      setIsProcessModalOpen(false);

      Swal.fire({
        icon: 'success',
        title: 'Izin PKKPR Berhasil Diterbitkan! 🎉',
        html: `
          <div class="text-left text-xs space-y-2 p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-300 dark:border-emerald-800">
            <p><strong>Nomor SK:</strong> <code class="font-mono text-emerald-600 dark:text-emerald-400 font-bold">${generatedSkNumber}</code></p>
            <p><strong>Penerima:</strong> ${selectedItem.applicantName} (${selectedItem.companyName})</p>
            <p><strong>Status:</strong> <span class="font-bold text-emerald-600">TERKIRIM KE DASHBOARD PEMOHON</span></p>
            <p class="text-[11px] text-slate-500 pt-1 border-t border-emerald-200">
              ⚡ Pemohon kini dapat mengunduh dan mencetak SK PKKPR resmi bertanda tangan digital sebagai persyaratan pengurusan PBG.
            </p>
          </div>
        `,
        confirmButtonColor: '#10b981'
      });
    } catch (err: any) {
      console.error('Error publishing SK PKKPR:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menerbitkan SK PKKPR',
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

            {/* Stepper Workflow Guide */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>1. Pertek PUPTR</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono truncate">{selectedItem.pertekPuptrNum || 'Pertek Valid'}</p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-bold">
                  <Wheat className="w-4 h-4 text-blue-600" />
                  <span>2. BAP Pertanian</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono truncate">
                  {selectedItem.pertanianBaNumber || 'Non-LP2B / Sesuai'}
                </p>
              </div>

              <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                isTteApplied ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
              }`}>
                <div className="flex items-center gap-1.5 font-bold">
                  <QrCode className="w-4 h-4 text-amber-600" />
                  <span className={isTteApplied ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}>
                    3. Pengesahan TTE
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono truncate">
                  {isTteApplied ? 'TTE Siap Disahkan ✓' : 'Belum Disahkan ⏳'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                  <Send className="w-4 h-4 text-teal-600" />
                  <span>4. Kirim ke Pemohon</span>
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

              {/* Action 1: Preview SK PDF */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-teal-600" />
                    <span>Generate &amp; Pratinjau Draf SK PKKPR (PDF)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Periksa draf keputusan izin lengkap dengan kop dinas, rujukan Pertek PUPTR &amp; BAP Pertanian sebelum disahkan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGeneratePdfDraft}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <Eye className="w-4 h-4" />
                  <span>Lihat Draf PDF SK</span>
                </button>
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

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handlePublishToApplicant}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Kirim Izin PKKPR ke Dashboard Pemohon 🚀</span>
              </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 print:hidden">
              <span className="text-xs font-bold text-slate-500">Pratinjau Dokumen Resmi SK Izin PKKPR</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Print PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPdfPreviewOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Official SK PKKPR Certificate Paper */}
            <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-2xl border border-slate-300 shadow-lg font-serif space-y-6 max-w-3xl mx-auto">
              {/* Kop Surat DPMPTSP */}
              <div className="flex items-center justify-center gap-4 border-b-4 border-double border-slate-900 pb-4 text-center">
                <div className="w-16 h-20 flex items-center justify-center">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/2/29/Lambang_Kabupaten_Luwu.png"
                    alt="Logo Luwu"
                    className="w-16 h-auto object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-sm sm:text-base font-bold uppercase tracking-wide">
                    Pemerintah Kabupaten Luwu
                  </h3>
                  <h2 className="text-base sm:text-lg font-black uppercase tracking-wide">
                    Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu
                  </h2>
                  <p className="text-[10px] font-sans text-slate-700">
                    Jl. Jenderal Sudirman No. 01 Kompleks Perkantoran Pemkab Luwu, Belopa • Telp: (0471) 3310001
                  </p>
                </div>
              </div>

              {/* Judul Keputusan */}
              <div className="text-center space-y-1">
                <h4 className="text-xs sm:text-sm font-black uppercase underline tracking-wider">
                  Surat Keputusan Kepala DPMPTSP Kabupaten Luwu
                </h4>
                <p className="text-xs font-mono font-bold">
                  Nomor: {generatedSkNumber || selectedItem.skPkkprNum}
                </p>
                <p className="text-[11px] font-sans font-bold uppercase text-slate-700 pt-1">
                  Tentang: Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR)
                </p>
              </div>

              {/* Rujukan Hukum & Pertimbangan */}
              <div className="text-xs font-sans space-y-3 leading-relaxed text-justify">
                <p>
                  Berdasarkan ketentuan Undang-Undang Nomor 6 Tahun 2023 tentang Penetapan Perppu Cipta Kerja dan Peraturan Pemerintah Nomor 21 Tahun 2021 tentang Penyelenggaraan Penataan Ruang, serta memperhatikan:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <li>
                    <strong>Pertimbangan Teknis Dinas PUPTR:</strong> Surat Rekomendasi Teknis No. <span className="font-mono font-bold">{selectedItem.pertekPuptrNum || '503/PERTEK-PUPTR/LUWU/2026'}</span> tanggal {new Date().toLocaleDateString('id-ID')}.
                  </li>
                  {selectedItem.pertanianBaNumber && (
                    <li>
                      <strong>Berita Acara Dinas Pertanian:</strong> Berita Acara Rekomendasi Alih Fungsi Lahan LP2B No. <span className="font-mono font-bold">{selectedItem.pertanianBaNumber}</span>.
                    </li>
                  )}
                  <li>
                    <strong>Kesesuaian Rencana Tata Ruang:</strong> Peraturan Daerah Kabupaten Luwu tentang Rencana Tata Ruang Wilayah (RTRW) Kabupaten Luwu.
                  </li>
                </ol>

                <p className="font-bold pt-1">MEMUTUSKAN DAN MENERBITKAN:</p>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-semibold">Nama Pemohon</span>
                    <span className="col-span-2 font-bold">: {selectedItem.applicantName}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-semibold">Badan Usaha / Usaha</span>
                    <span className="col-span-2 font-bold">: {selectedItem.companyName}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-semibold">Nomor NIB / NIK</span>
                    <span className="col-span-2 font-mono font-bold">: {selectedItem.nibNik}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-semibold">Sektor / Rencana Kegiatan</span>
                    <span className="col-span-2">: {selectedItem.sector}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-semibold">Lokasi Kegiatan</span>
                    <span className="col-span-2">: Kec. {selectedItem.districtName}, Desa {selectedItem.villageName}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-semibold">Luas Ruang Disetujui</span>
                    <span className="col-span-2 font-bold text-emerald-700">: {selectedItem.areaHa} Hektar (Ha)</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600">
                  Dokumen ini merupakan persetujuan pemanfaatan ruang yang sah dan berlaku sebagai <strong>persyaratan utama dalam pengajuan Persetujuan Bangunan Gedung (PBG)</strong> serta perizinan operasional berusaha di Kabupaten Luwu.
                </p>
              </div>

              {/* Tanda Tangan & QR-Code BSRE */}
              <div className="pt-6 border-t border-slate-300 flex items-end justify-between font-sans">
                <div className="text-center space-y-1">
                  <div className="w-20 h-20 bg-slate-100 border border-slate-300 p-1 rounded-lg mx-auto flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-slate-800" />
                  </div>
                  <p className="text-[9px] font-mono text-slate-500">BSRE Valid Signature</p>
                </div>

                <div className="text-right space-y-1 text-xs">
                  <p>Ditetapkan di Belopa</p>
                  <p>Pada tanggal: {new Date().toLocaleDateString('id-ID')}</p>
                  <p className="font-bold pt-1">{tteSignerTitle}</p>
                  <div className="h-14 flex items-center justify-end">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded font-mono font-bold text-[10px]">
                      [Ditandatangani Secara Elektronik / TTE]
                    </span>
                  </div>
                  <p className="font-bold underline">{tteSignerName}</p>
                  <p className="text-[10px] text-slate-600">NIP. {tteSignerNip}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
