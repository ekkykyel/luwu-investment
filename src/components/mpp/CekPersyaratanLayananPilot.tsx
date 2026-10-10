import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  CheckCircle2, 
  Circle, 
  Download, 
  Clock, 
  Building2, 
  Ticket, 
  HelpCircle, 
  ChevronRight,
  Share2,
  FileText,
  BadgeCheck,
  Check,
  ArrowRight,
  Mic
} from 'lucide-react';

export interface ServiceDocItem {
  id: string;
  name: string;
  desc?: string;
  required: boolean;
  templateName?: string;
}

export interface ServiceRequirementItem {
  id: string;
  code: string;
  title: string;
  category: string;
  agency: string;
  loket: string;
  officialCost: string;
  processingTime: string;
  popular?: boolean;
  documents: ServiceDocItem[];
  tips?: string[];
  aiQuestions?: string[];
}

export const PILOT_SERVICE_REQUIREMENTS: ServiceRequirementItem[] = [
  {
    id: 'req-nib',
    code: 'NIB_OSS',
    title: 'Penerbitan NIB Izin Usaha (OSS-RBA)',
    category: 'Perizinan Usaha',
    agency: 'Dinas PMPTSP Kabupaten Luwu',
    loket: 'Loket 04 - 06',
    officialCost: 'Gratis (Rp 0)',
    processingTime: '15 - 30 Menit (Terbit Instan)',
    popular: true,
    documents: [
      { id: 'nib-1', name: 'KTP Elektronik (NIK Pemohon/Pelaku Usaha)', desc: 'Scan asli atau e-KTP fisik yang masih berlaku', required: true },
      { id: 'nib-2', name: 'Nomor Pokok Wajib Pajak (NPWP Valid)', desc: 'NPWP pribadi atau NPWP badan terdaftar di DJP', required: true },
      { id: 'nib-3', name: 'Nomor WhatsApp & Email Aktif', desc: 'Untuk pengiriman OTP dan tautan unduh sertifikat NIB', required: true },
      { id: 'nib-4', name: 'Titik Koordinat & Rencana Lokasi Usaha', desc: 'Alamat lengkap beserta titik koordinat peta untuk integrasi PKKPR', required: true },
      { id: 'nib-5', name: 'Akta Pendirian & SK Kemenkumham (Khusus PT/CV/Koperasi)', desc: 'Hanya jika badan usaha berbadan hukum, tidak diperlukan untuk perorangan/UMKM', required: false, templateName: 'Format_Surat_Keterangan_Usaha.pdf' },
    ],
    tips: [
      'Pelaku UMKM mikro/kecil dapat terbit instan tanpa biaya retribusi',
      'Loket 04 menyediakan pendampingan mandiri pengisian sistem OSS-RBA'
    ],
    aiQuestions: [
      'Apakah usaha kuliner rumahan wajib mencantumkan izin edar BPOM?',
      'Berapa modal awal minimum untuk penerbitan NIB perorangan?',
      'Bagaimana cara migrasi dari SIUP manual lama ke NIB OSS?'
    ]
  },
  {
    id: 'req-ktp',
    code: 'KTP_DUKCAPIL',
    title: 'Perekaman & Cetak KTP-el / Kartu Keluarga',
    category: 'Kependudukan & Catatan Sipil',
    agency: 'Dinas Kependudukan & Catatan Sipil',
    loket: 'Loket 01 - 03',
    officialCost: 'Gratis (Rp 0)',
    processingTime: '15 - 20 Menit',
    popular: true,
    documents: [
      { id: 'ktp-1', name: 'Kartu Keluarga (KK) Asli atau Salinan Terbaru', desc: 'Tercantum NIK pemohon dan ber-barcode resmi Ditjen Dukcapil', required: true },
      { id: 'ktp-2', name: 'Berusia Minimal 17 Tahun atau Sudah Menikah', desc: 'Syarat mutlak perekaman biometrik retina & sidik jari', required: true },
      { id: 'ktp-3', name: 'Surat Keterangan Kehilangan Kepolisian (Khusus KTP Hilang)', desc: 'Diterbitkan Polsek/Polres Luwu jika fisik kartu hilang', required: false },
      { id: 'ktp-4', name: 'Fisik KTP-el Lama yang Rusak (Khusus Penggantian Rusak)', desc: 'Wajib diserahkan ke loket untuk dimusnahkan dan diganti baru', required: false },
    ],
    tips: [
      'Gunakan pakaian rapi berkerah saat perekaman foto biometrik',
      'Pencetakan ulang KTP rusak dapat selesai di hari yang sama'
    ],
    aiQuestions: [
      'Apakah anak usia 16 tahun 11 bulan bisa rekam foto lebih awal?',
      'Bagaimana prosedur update data jika nama di ijazah berbeda dengan KTP?'
    ]
  },
  {
    id: 'req-pbg',
    code: 'PBG_BANGUNAN',
    title: 'Persetujuan Bangunan Gedung (PBG) & SLF',
    category: 'Tata Ruang & Bangunan',
    agency: 'Dinas PUPR & DPMPTSP Luwu',
    loket: 'Loket 05',
    officialCost: 'Sesuai Retribusi Daerah (Simulasi Online)',
    processingTime: '3 - 7 Hari Kerja',
    popular: true,
    documents: [
      { id: 'pbg-1', name: 'KTP Pemohon & Bukti Kepemilikan Tanah (SHM/HGB)', desc: 'Sertipikat hak atas tanah yang sah dan tidak dalam sengketa hukum', required: true },
      { id: 'pbg-2', name: 'Konfirmasi Kesesuaian Tata Ruang (PKKPR/KRK)', desc: 'Rekomendasi kesesuaian peruntukan ruang dari Dinas PUPR', required: true },
      { id: 'pbg-3', name: 'Gambar Rencana Teknis Bangunan (Arsitektur & Struktur)', desc: 'Dibuat oleh perencana bersertifikat keahlian konstruksi (SKA/STRA)', required: true },
      { id: 'pbg-4', name: 'Dokumen Lingkungan (SPPL / UKL-UPL)', desc: 'Sesuai skala luasan dan dampak lingkungan operasional bangunan', required: false, templateName: 'Formulir_Komitmen_SPPL.pdf' },
    ],
    tips: [
      'Klinik Konsultasi Tata Ruang MPP siap memverifikasi pra-syarat gambar arsitektur',
      'Pengajuan dilakukan melalui portal nasional SIMBG dengan bantuan front office'
    ],
    aiQuestions: [
      'Apakah renovasi rumah tinggal 1 lantai wajib memiliki PBG?',
      'Bagaimana cara menghitung estimasi retribusi PBG untuk ruko usaha?'
    ]
  },
  {
    id: 'req-paspor',
    code: 'PASPOR_IMIGRASI',
    title: 'Permohonan Paspor Baru & Penggantian',
    category: 'Keimigrasian',
    agency: 'Unit Layanan Paspor (ULP) Imigrasi',
    loket: 'Loket 14 - 15',
    officialCost: 'Rp 350.000 (Reguler) / Rp 650.000 (Elektronik)',
    processingTime: '3 Hari Kerja Pasca Foto',
    popular: true,
    documents: [
      { id: 'psp-1', name: 'e-KTP Asli dan Salinan', desc: 'Identitas kependudukan WNI yang aktif', required: true },
      { id: 'psp-2', name: 'Kartu Keluarga (KK) Asli dan Salinan', desc: 'Kartu keluarga terbaru dengan barcode Dukcapil', required: true },
      { id: 'psp-3', name: 'Akta Kelahiran / Ijazah Terakhir / Buku Nikah', desc: 'Dokumen yang memuat nama, tempat tanggal lahir, dan nama orang tua', required: true },
      { id: 'psp-4', name: 'Paspor Lama Asli (Khusus Penggantian Habis Berlaku)', desc: 'Wajib dibawa untuk perpanjangan masa berlaku', required: false },
    ],
    tips: [
      'Disarankan booking nomor antrean M-Paspor terlebih dahulu',
      'Pembayaran dilakukan via teller bank atau kanal digital PNBP'
    ],
    aiQuestions: [
      'Apa perbedaan paspor biasa 48 halaman dan e-paspor polikarbonat?',
      'Bagaimana syarat pembuatan paspor umrah untuk anak di bawah umur?'
    ]
  },
  {
    id: 'req-skck',
    code: 'SKCK_POLRES',
    title: 'Penerbitan SKCK Baru & Perpanjangan',
    category: 'Kepolisian (Polres Luwu)',
    agency: 'Polres Luwu (Pelayanan Terpadu)',
    loket: 'Loket 12',
    officialCost: 'Rp 30.000 (Tarif Resmi PNBP)',
    processingTime: '10 - 15 Menit',
    popular: false,
    documents: [
      { id: 'skck-1', name: 'Fotokopi KTP domisili Kabupaten Luwu', desc: 'Identitas diri pemohon yang masih berlaku', required: true },
      { id: 'skck-2', name: 'Fotokopi Kartu Keluarga (KK)', desc: 'Data keluarga pemohon', required: true },
      { id: 'skck-3', name: 'Fotokopi Akta Lahir / Kenal Lahir', desc: 'Pencocokan data kelahiran pemohon', required: true },
      { id: 'skck-4', name: 'Pasfoto Berwarna 4x6 (3 Lembar, Latar Merah)', desc: 'Foto formal pakaian rapi dan sopan', required: true },
      { id: 'skck-5', name: 'Rumus Sidik Jari dari Unit Inafis', desc: 'Dilayani langsung di loket Inafis MPP Simpurusiang', required: false },
    ],
    tips: [
      'Perekaman rumus sidik jari dapat dilakukan langsung di loket Polres MPP',
      'Biaya PNBP disetor langsung melalui kode billing Simponi resmi'
    ],
    aiQuestions: [
      'Apakah bisa perpanjang SKCK yang masa berlakunya sudah lewat 1 tahun?',
      'Apakah SKCK dari Polsek berlaku untuk melamar CPNS pusat?'
    ]
  },
  {
    id: 'req-samsat',
    code: 'SAMSAT_PAJAK',
    title: 'Pajak Kendaraan Tahunan & 5 Tahunan',
    category: 'Pendapatan Daerah (Bapenda Sulsel)',
    agency: 'UPT Pendapatan Wilayah Luwu (Samsat)',
    loket: 'Loket 10 - 11',
    officialCost: 'Sesuai Lembar Ketetapan Pajak Daerah (PKB)',
    processingTime: '10 - 20 Menit',
    popular: false,
    documents: [
      { id: 'sam-1', name: 'STNK Asli Kendaraan Bermotor', desc: 'Surat Tanda Nomor Kendaraan yang masih berlaku', required: true },
      { id: 'sam-2', name: 'e-KTP Asli Pemilik Sesuai Nama di STNK', desc: 'Untuk validasi data wajib pajak daerah', required: true },
      { id: 'sam-3', name: 'BPKB Asli & Cek Fisik (Khusus Pajak 5 Tahunan/Ganti Plat)', desc: 'Cek fisik nomor rangka dan mesin dilakukan di pos samsat', required: false },
    ],
    tips: [
      'Layanan Samsat Drive-Thru & Loket MPP terintegrasi online se-Sulawesi Selatan',
      'Pembayaran non-tunai tersedia via EDC Bank Sulselbar & QRIS'
    ],
    aiQuestions: [
      'Berapa denda keterlambatan jika telat bayar pajak motor 2 bulan?',
      'Bisakah bayar pajak tahunan jika BPKB masih berada di leasing?'
    ]
  }
];

export interface CekPersyaratanLayananPilotProps {
  initialServiceId?: string;
  onOpenQueueBooking?: (serviceName: string, agencyName: string) => void;
  isDark?: boolean;
  className?: string;
}

export const CekPersyaratanLayananPilot: React.FC<CekPersyaratanLayananPilotProps> = ({
  initialServiceId,
  onOpenQueueBooking,
  isDark = false,
  className = ''
}) => {
  const { t } = useTranslation();

  // Selected Service
  const [selectedServiceId, setSelectedServiceId] = useState<string>(() => {
    if (initialServiceId) {
      const matched = PILOT_SERVICE_REQUIREMENTS.find(s => s.id === initialServiceId || s.code === initialServiceId);
      if (matched) return matched.id;
    }
    return PILOT_SERVICE_REQUIREMENTS[0].id;
  });

  // Sync initialServiceId when prop changes
  React.useEffect(() => {
    if (initialServiceId) {
      const matched = PILOT_SERVICE_REQUIREMENTS.find(s => s.id === initialServiceId || s.code === initialServiceId);
      if (matched) setSelectedServiceId(matched.id);
    }
  }, [initialServiceId]);

  // Search filter query
  const [searchQuery, setSearchQuery] = useState('');

  // Checklist checked states: record of docId -> boolean
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});

  // Active service object
  const activeService = useMemo(() => {
    return PILOT_SERVICE_REQUIREMENTS.find(s => s.id === selectedServiceId) || PILOT_SERVICE_REQUIREMENTS[0];
  }, [selectedServiceId]);

  // Filtered services for dropdown or search
  const filteredServices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return PILOT_SERVICE_REQUIREMENTS;
    return PILOT_SERVICE_REQUIREMENTS.filter(s => 
      s.title.toLowerCase().includes(q) || 
      s.agency.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.documents.some(d => d.name.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Checklist statistics for active service
  const stats = useMemo(() => {
    const docs = activeService.documents;
    const totalCount = docs.length;
    const requiredDocs = docs.filter(d => d.required);
    const requiredCount = requiredDocs.length;
    
    let completedCount = 0;
    let requiredCompletedCount = 0;

    docs.forEach(d => {
      if (checkedDocs[d.id]) {
        completedCount++;
        if (d.required) requiredCompletedCount++;
      }
    });

    const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const isReadyForBooking = requiredCount > 0 ? requiredCompletedCount === requiredCount : completedCount === totalCount;

    return {
      totalCount,
      completedCount,
      requiredCount,
      requiredCompletedCount,
      percent,
      isReadyForBooking
    };
  }, [activeService, checkedDocs]);

  // Toggle single document check
  const toggleCheck = useCallback((docId: string) => {
    setCheckedDocs(prev => ({
      ...prev,
      [docId]: !prev[docId]
    }));
  }, []);

  // Check all / reset
  const handleCheckAll = useCallback(() => {
    const updates: Record<string, boolean> = {};
    activeService.documents.forEach(d => {
      updates[d.id] = true;
    });
    setCheckedDocs(prev => ({ ...prev, ...updates }));
  }, [activeService]);

  const handleResetCheck = useCallback(() => {
    const updates: Record<string, boolean> = {};
    activeService.documents.forEach(d => {
      updates[d.id] = false;
    });
    setCheckedDocs(prev => ({ ...prev, ...updates }));
  }, [activeService]);

  // Send checklist to WhatsApp
  const handleSendToWhatsApp = useCallback(() => {
    const docs = activeService.documents;
    const readyItems = docs.filter(d => checkedDocs[d.id]).map(d => `✅ ${d.name}`);
    const pendingItems = docs.filter(d => !checkedDocs[d.id]).map(d => `⏳ ${d.name} (${d.required ? 'Wajib' : 'Opsional'})`);

    const message = [
      `*PANDUAN SYARAT LAYANAN MPP SIMPURUSIANG*`,
      `*Layanan:* ${activeService.title}`,
      `*Instansi:* ${activeService.agency} (${activeService.loket})`,
      `*Biaya:* ${activeService.officialCost}`,
      `*Estimasi:* ${activeService.processingTime}`,
      ``,
      `*Status Kesiapan:* ${stats.completedCount} dari ${stats.totalCount} berkas siap (${stats.percent}%)`,
      ``,
      readyItems.length > 0 ? `*Sudah Siap:*\n${readyItems.join('\n')}\n` : '',
      pendingItems.length > 0 ? `*Belum Siap:*\n${pendingItems.join('\n')}\n` : '',
      `_Tercatat otomatis melalui Portal MPP Digital Kabupaten Luwu_`,
      `https://mpp.luwukab.go.id/#syarat-dokumen`
    ].filter(Boolean).join('\n');

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }, [activeService, checkedDocs, stats]);

  // Trigger Queue Booking
  const handleBookQueue = useCallback(() => {
    if (onOpenQueueBooking) {
      onOpenQueueBooking(activeService.title, activeService.agency);
    } else {
      const el = document.getElementById('antrean-online') || document.getElementById('smart-live-queue');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeService, onOpenQueueBooking]);

  // Handle Document Template Download
  const handleDownloadTemplate = useCallback((filename: string, serviceTitle: string) => {
    const content = `======================================================================
PEMERINTAH KABUPATEN LUWU
DINAS PENANAMAN MODAL DAN PELAYANAN TERPADU SATU PINTU (DPMPTSP)
MAL PELAYANAN PUBLIK (MPP) SIMPURUSIANG
Jl. Jenderal Sudirman, Kompleks Perkantoran Pemerintah Kabupaten Luwu
======================================================================

BLANGKO / FORMAT RESMI PERSYARATAN LAYANAN
Layanan   : ${serviceTitle}
Dokumen   : ${filename}
Status    : Draf Resmi Terverifikasi Sistem MPP Kabupaten Luwu
Tahun     : 2026

PETUNJUK PENGISIAN:
1. Isi identitas pemohon sesuai data e-KTP dan KK yang valid.
2. Lampirkan dokumen persyaratan pendukung yang telah dicentang pada portal.
3. Bawa berkas fisik dan softcopy saat verifikasi di loket MPP Simpurusiang.
4. Pelayanan bebas biaya pungutan liar (Gratis / sesuai tarif resmi PNBP/Perda).

Diterbitkan secara digital oleh Portal MPP Simpurusiang Kab. Luwu.
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.pdf') ? filename.replace('.pdf', '.txt') : filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // Compute available templates for download
  const availableTemplates = useMemo(() => {
    const list: Array<{ title: string; filename: string; format: string; size: string }> = [];
    
    // Add specific templates from service documents if any
    activeService.documents.forEach(doc => {
      if (doc.templateName) {
        list.push({
          title: `Formulir ${doc.name}`,
          filename: doc.templateName,
          format: 'Format Draf Resmi',
          size: 'Unduhan Cepat'
        });
      }
    });

    // Add standard universal forms for MPP Luwu
    list.push({
      title: 'Surat Permohonan Layanan Standar Pemkab Luwu',
      filename: `Surat_Permohonan_${activeService.code || 'Layanan'}.txt`,
      format: 'Format Draf Resmi',
      size: 'Unduhan Cepat'
    });
    list.push({
      title: 'Surat Pernyataan Keabsahan & Kebenaran Dokumen',
      filename: `Surat_Pernyataan_Keabsahan_Dokumen_${activeService.code || 'Layanan'}.txt`,
      format: 'Format Draf Resmi',
      size: 'Unduhan Cepat'
    });

    return list;
  }, [activeService]);

  return (
    <section 
      id="cek-persyaratan-pilot" 
      aria-label="Cek Persyaratan Layanan"
      className={`w-full font-sans transition-colors duration-200 ${className}`}
    >
      <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        {/* ========================================================================= */}
        {/* 1. SECTION HEADER (Standar Desain Bersih & Zero-Pill)                     */}
        {/* ========================================================================= */}
        <div className="text-center max-w-3xl mx-auto px-4 space-y-2.5">
          <span className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-700 dark:bg-emerald-400 animate-pulse" />
            Panduan Mandiri Sebelum Datang
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Cek Persyaratan Layanan
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
            Pilih layanan, centang dokumen yang Anda miliki, dan pastikan berkas lengkap sebelum mengambil nomor antrean.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 2. PENCARIAN & CHIP LAYANAN POPULER                                       */}
        {/* ========================================================================= */}
        <div className="w-full max-w-4xl mx-auto space-y-3 px-2 sm:px-0">
          {/* Search Box */}
          <div className="relative w-full">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama layanan, instansi, atau dokumen (contoh: NIB, KTP, PBG, Paspor)..."
              className="w-full pl-12 pr-4 py-3 sm:py-3.5 text-sm rounded-2xl border bg-white dark:bg-[#0F2D4A] border-slate-200 dark:border-white/[0.09] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all shadow-xs"
            />
          </div>

          {/* Popular Filter Chips (Segmented Buttons) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0 hidden sm:inline">
              Layanan Populer:
            </span>
            {PILOT_SERVICE_REQUIREMENTS.map((srv) => {
              const isSelected = srv.id === selectedServiceId;
              return (
                <button
                  key={srv.id}
                  type="button"
                  onClick={() => {
                    setSelectedServiceId(srv.id);
                    setSearchQuery('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-all cursor-pointer border active:scale-95 ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-white dark:bg-[#0F2D4A] text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-[#143755]'
                  }`}
                >
                  {srv.title.split('(')[0].trim()}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. MAIN WORKSPACE: 2-COLUMN LAYOUT DESKTOP, STACKED MOBILE (375px/1280px) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* ── LEFT / MAIN PANEL: CHECKLIST BERKAS (Col 7 / 12) ── */}
          <div className="lg:col-span-7 space-y-5">
            <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-7 border bg-white dark:bg-[#0F2D4A] border-slate-200/90 dark:border-white/[0.09] shadow-sm space-y-6">
              
              {/* Header Layanan Aktif */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-white/[0.08]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{activeService.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeService.agency}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">
                    {activeService.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <button 
                    type="button"
                    onClick={handleCheckAll}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                  >
                    Centang Semua
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <button 
                    type="button"
                    onClick={handleResetCheck}
                    className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:underline px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Progress Bar Kesiapan */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-[#143755] border border-slate-200/60 dark:border-white/[0.06]">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-slate-300">
                    Progres Kesiapan: <strong className="text-emerald-600 dark:text-emerald-400">{stats.completedCount} dari {stats.totalCount} siap</strong>
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {stats.percent}%
                  </span>
                </div>
                
                {/* Bar */}
                <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${stats.percent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                  <span>Wajib: {stats.requiredCompletedCount}/{stats.requiredCount} berkas</span>
                  {stats.isReadyForBooking ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Siap dilayani di loket
                    </span>
                  ) : (
                    <span>Lengkapi berkas bertanda titik emerald</span>
                  )}
                </div>
              </div>

              {/* Checklist Items */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-1">
                  Daftar Berkas Persyaratan:
                </div>

                {activeService.documents.map((doc, idx) => {
                  const isChecked = !!checkedDocs[doc.id];
                  return (
                    <div
                      key={doc.id}
                      onClick={() => toggleCheck(doc.id)}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                        isChecked
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-500/30 dark:border-emerald-500/30'
                          : 'bg-white dark:bg-[#0A2238]/60 border-slate-200/80 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.14]'
                      }`}
                    >
                      {/* Checkbox Icon */}
                      <button 
                        type="button"
                        aria-label={isChecked ? `Uncheck ${doc.name}` : `Check ${doc.name}`}
                        className="mt-0.5 shrink-0 focus:outline-none"
                      >
                        {isChecked ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                        )}
                      </button>

                      {/* Content */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={`text-sm font-semibold transition-colors ${
                            isChecked 
                              ? 'text-emerald-900 dark:text-emerald-200 line-through opacity-80' 
                              : 'text-slate-900 dark:text-white'
                          }`}>
                            {doc.name}
                          </span>

                          {/* REFINED ZERO-PILL BADGE: Neutral Emerald Dot for Wajib, Gray for Opsional */}
                          {doc.required ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              Wajib
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 shrink-0" />
                              Opsional
                            </span>
                          )}
                        </div>

                        {doc.desc && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {doc.desc}
                          </p>
                        )}

                        {doc.templateName && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => handleDownloadTemplate(doc.templateName!, activeService.title)}
                              className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 shrink-0" /> Unduh Draf / Template ({doc.templateName})
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tips & Petunjuk Tambahan */}
              {activeService.tips && activeService.tips.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#143755]/60 border border-slate-200/60 dark:border-white/[0.06] space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <BadgeCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    Catatan Pelayanan Petugas:
                  </div>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-slate-500 dark:text-slate-400">
                    {activeService.tips.map((tip, tIdx) => (
                      <li key={tIdx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT PANEL: RINGKASAN LAYANAN, AKSI TIKET & ASISTEN AI (Col 5 / 12) ── */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
            
            {/* Card Ringkasan Biaya, Waktu, Loket & Tindakan */}
            <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 border bg-white dark:bg-[#0F2D4A] border-slate-200/90 dark:border-white/[0.09] shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.08]">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Ringkasan Layanan
                </h4>
                <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  {activeService.loket}
                </span>
              </div>

              {/* Data Grid: Biaya, Waktu, Loket */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#143755] border border-slate-200/60 dark:border-white/[0.06] space-y-1">
                  <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Estimasi Waktu
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    {activeService.processingTime}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#143755] border border-slate-200/60 dark:border-white/[0.06] space-y-1">
                  <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> Biaya Resmi
                  </div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                    {activeService.officialCost}
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS (Ambil Antrean + Kirim WA) */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleBookQueue}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98 ${
                    stats.isReadyForBooking
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                      : 'bg-emerald-700/80 hover:bg-emerald-600 text-white'
                  }`}
                >
                  <Ticket className="w-4 h-4 shrink-0" />
                  <span>Ambil Antrean Sekarang</span>
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={handleSendToWhatsApp}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-xs border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#143755] hover:bg-slate-100 dark:hover:bg-[#184266] text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Kirim Checklist ke WhatsApp</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                Checklist otomatis disimpan di perangkat Anda agar tidak hilang saat tiba di gedung MPP.
              </p>
            </div>

            {/* ========================================================================= */}
            {/* PUSAT UNDUHAN BLANGKO RESMI & PANDUAN PROSEDUR LOKET                     */}
            {/* ========================================================================= */}
            <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 border bg-white dark:bg-[#0F2D4A] border-slate-200/90 dark:border-white/[0.09] shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Format Blangko & Panduan Berkas
                  </h4>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  Resmi Pemkab Luwu
                </span>
              </div>

              {/* Daftar Blangko Formulir yang Siap Diunduh */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Template Formulir Layanan:
                </div>
                
                {availableTemplates.map((tpl, tIdx) => (
                  <div 
                    key={tIdx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#143755] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between gap-3 hover:border-emerald-500/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {tpl.title}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{tpl.format}</span>
                        <span>•</span>
                        <span>{tpl.size}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate(tpl.filename, activeService.title)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Tahapan Alur Layanan di Loket Fisik */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] space-y-2">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Alur 3 Langkah di Gedung MPP:
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50/70 dark:bg-[#143755]/50">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-tight">
                      <strong>Validasi Front Office:</strong> Tunjukkan checklist ini kepada petugas resepsionis di lantai 1 untuk verifikasi kelengkapan awal.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50/70 dark:bg-[#143755]/50">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-tight">
                      <strong>Pelayanan di {activeService.loket}:</strong> Petugas {activeService.agency} memproses berkas Anda tanpa calo dan bebas biaya liar.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50/70 dark:bg-[#143755]/50">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-tight">
                      <strong>Penerbitan & SK:</strong> Dokumen fisik diserahkan atau diterbitkan digital dalam estimasi {activeService.processingTime}.
                    </p>
                  </div>
                </div>
              </div>

              {/* Seamless Action: Buka Asisten MPP Interaktif */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-sky-500/10 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-[#143755] border border-emerald-500/20 dark:border-emerald-400/20 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        Butuh Panduan Interaktif Lengkap?
                      </h5>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight">
                        Tanyakan via suara atau konsultasi mendalam di Asisten MPP
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('open-mpp-voice-assistant'));
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-98"
                  >
                    <span>Buka Asisten MPP Resmi</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
export default CekPersyaratanLayananPilot;
