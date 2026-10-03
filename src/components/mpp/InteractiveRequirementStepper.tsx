import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckSquare, 
  Square, 
  ChevronRight, 
  ChevronLeft, 
  FileCheck2, 
  Sparkles, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle,
  ExternalLink,
  Building2,
  MapPin,
  Ticket,
  FileText,
  BadgeCheck,
  UserCheck,
  Compass,
  Layers,
  ArrowRight
} from 'lucide-react';

export interface StepItem {
  id: string;
  label: string;
  desc: string;
  required: boolean;
  checked: boolean;
}

export interface RequirementStage {
  id: number;
  title: string;
  badge: string;
  description: string;
  items: StepItem[];
}

export type RequirementServiceKey = 
  | 'KTP_DUKCAPIL' 
  | 'GIS_PKKPR' 
  | 'NIB_OSS' 
  | 'PBG_BANGUNAN' 
  | 'PASPOR_IMIGRASI' 
  | 'SKCK_POLRES';

export interface ServiceRequirementConfig {
  key: RequirementServiceKey;
  label: string;
  categoryBadge: string;
  title: string;
  description: string;
  agency: string;
  loket: string;
  actionCta: {
    label: string;
    icon: React.ElementType;
    actionType: 'queue' | 'external' | 'gis';
    targetUrl?: string;
  };
  stages: RequirementStage[];
}

export const SERVICE_REQUIREMENT_CONFIGS: Record<RequirementServiceKey, ServiceRequirementConfig> = {
  KTP_DUKCAPIL: {
    key: 'KTP_DUKCAPIL',
    label: 'KTP-el & Dukcapil',
    categoryBadge: 'Administrasi Kependudukan',
    title: 'Panduan Syarat Perekaman & Cetak KTP-el / IKD',
    description: 'Persyaratan resmi Disdukcapil Kab. Luwu untuk penerbitan KTP-el pemula, penggantian rusak/hilang, dan aktivasi Identitas Kependudukan Digital (IKD).',
    agency: 'Dinas Kependudukan & Pencatatan Sipil (Disdukcapil)',
    loket: 'Gerai 01 • Loket 01 - 03',
    actionCta: {
      label: 'Ambil Antrean Layanan Dukcapil',
      icon: Ticket,
      actionType: 'queue'
    },
    stages: [
      {
        id: 1,
        title: 'Berkas Dokumen Pemohon',
        badge: 'Tahap 1 dari 3',
        description: 'Kelengkapan identitas kependudukan dasar yang wajib disiapkan sebelum verifikasi loket.',
        items: [
          {
            id: 'ktp-1-1',
            label: 'Kartu Keluarga (KK) Asli / Digital',
            desc: 'Scan atau cetak fisik KK terbaru ber-barcode resmi Ditjen Dukcapil Kemendagri tanpa legalisir basah',
            required: true,
            checked: false
          },
          {
            id: 'ktp-1-2',
            label: 'Surat Kehilangan dari Kepolisian (Jika KTP Hilang) / KTP Rusak',
            desc: 'Bawa fisik KTP lama jika rusak untuk ditukar, atau Surat Tanda Lapor Kehilangan (STLK) Polsek/Polres jika hilang',
            required: true,
            checked: false
          },
          {
            id: 'ktp-1-3',
            label: 'Pasfoto terbaru (jika ada perubahan data)',
            desc: 'Pasfoto formal ukuran 3x4 atau 4x6 latar belakang biru/merah (khusus jika ada penyesuaian data perkawinan/pendidikan)',
            required: false,
            checked: false
          },
          {
            id: 'ktp-1-4',
            label: 'Nomor WhatsApp Aktif',
            desc: 'Nomor kontak pemohon aktif untuk konfirmasi tiket antrean, barcode panggilan loket, dan info kesiapan blangko KTP',
            required: true,
            checked: false
          }
        ]
      },
      {
        id: 2,
        title: 'Perekaman Biometrik & Validasi NIK',
        badge: 'Tahap 2 dari 3',
        description: 'Pengambilan data biometrik di bilik foto Disdukcapil gerai 01 MPP Simpurusiang.',
        items: [
          {
            id: 'ktp-2-1',
            label: 'Perekaman Sidik Jari (10 Jari)',
            desc: 'Verifikasi biometrik sidik jari untuk validasi keaslian data dan pencegahan duplikasi NIK nasional',
            required: true,
            checked: false
          },
          {
            id: 'ktp-2-2',
            label: 'Pemindaian Retina Mata (Iris Scan)',
            desc: 'Pemindaian optik iris mata wajib bagi pemohon KTP-el pemula (usia genap 17 tahun)',
            required: true,
            checked: false
          },
          {
            id: 'ktp-2-3',
            label: 'Foto Wajah Digital Terintegrasi',
            desc: 'Pengambilan foto digital resolusi tinggi langsung di studio photo booth gerai MPP',
            required: true,
            checked: false
          }
        ]
      },
      {
        id: 3,
        title: 'Pencetakan Fisik & Aktivasi IKD',
        badge: 'Tahap 3 dari 3',
        description: 'Pencetakan blangko KTP-el chip nasional dan aktivasi aplikasi IKD di smartphone.',
        items: [
          {
            id: 'ktp-3-1',
            label: 'Verifikasi Final Biodata KTP-el',
            desc: 'Pengecekan kesesuaian penulisan nama lengkap, tanggal lahir, dan alamat domisili di layar monitor loket',
            required: true,
            checked: false
          },
          {
            id: 'ktp-3-2',
            label: 'Aktivasi Aplikasi IKD (Identitas Kependudukan Digital)',
            desc: 'Scan QR Code aktivasi IKD oleh petugas Dukcapil ke smartphone pemohon untuk KTP digital di genggaman',
            required: true,
            checked: false
          },
          {
            id: 'ktp-3-3',
            label: 'Tanda Terima Pengambilan Fisik KTP-el',
            desc: 'Penyerahan fisik KTP-el asli ber-chip elektronik siap pakai tanpa dipungut biaya apapun (Gratis Rp 0,-)',
            required: true,
            checked: false
          }
        ]
      }
    ]
  },

  GIS_PKKPR: {
    key: 'GIS_PKKPR',
    label: 'PKKPR Tata Ruang',
    categoryBadge: 'Penataan Ruang & Zonasi',
    title: 'Panduan Syarat Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR)',
    description: 'Standar kesesuaian tata ruang RTRW Kabupaten Luwu No. 3 Tahun 2024 dan BAP Rekomendasi Teknis Dinas PUPTR.',
    agency: 'Dinas PUPTR & Forum Penataan Ruang (FPR)',
    loket: 'Gerai 02 • Loket 04 - 05',
    actionCta: {
      label: 'Cek Zonasi di WebGIS Luwu',
      icon: Compass,
      actionType: 'gis',
      targetUrl: '/peta'
    },
    stages: [
      {
        id: 1,
        title: 'Informasi Lahan & Legalitas Dasar',
        badge: 'Tahap 1 dari 3',
        description: 'Kelengkapan bukti penguasaan lahan dan koordinat lokasi kegiatan pemanfaatan ruang.',
        items: [
          {
            id: 'pkkpr-1-1',
            label: 'Bukti Hak Atas Tanah / Sertipikat SHM/HGB',
            desc: 'Scan sertipikat tanah asli dari Kantor Pertanahan ATR/BPN atau bukti penguasaan fisik tanah yang sah',
            required: true,
            checked: false
          },
          {
            id: 'pkkpr-1-2',
            label: 'KTP Pemohon / Penanggung Jawab Usaha',
            desc: 'Identitas pemohon perorangan atau pimpinan badan hukum pemrakarsa pemanfaatan ruang',
            required: true,
            checked: false
          },
          {
            id: 'pkkpr-1-3',
            label: 'Titik Koordinat Poligon Geospasial Lahan',
            desc: 'Batas poligon koordinat lahan format GeoJSON, KMZ, atau Shapefile (WGS 84 / UTM 51S)',
            required: true,
            checked: false
          },
          {
            id: 'pkkpr-1-4',
            label: 'Rencana Tata Letak Bangunan & Luasan Lahan',
            desc: 'Site plan sederhana rencana pemanfaatan lahan dan perkiraan luas lantai bangunan terbangun',
            required: false,
            checked: false
          }
        ]
      },
      {
        id: 2,
        title: 'Analisis Spasial & Rekomendasi PUPTR',
        badge: 'Tahap 2 dari 3',
        description: 'Pemeriksaan otomatis tumpang tindih kawasan lindung LP2B dan pola ruang RTRW.',
        items: [
          {
            id: 'pkkpr-2-1',
            label: 'Pengecekan Kawasan Lindung LP2B & Lahan Basah',
            desc: 'Analisis spasial bebas irigasi teknis sawah abadi dan sempadan sungai/pantai',
            required: true,
            checked: false
          },
          {
            id: 'pkkpr-2-2',
            label: 'Verifikasi Pola Ruang & Intensitas Pemanfaatan (KDB/KLB)',
            desc: 'Penyesuaian koefisien dasar bangunan terhadap zonasi pola ruang Perda RTRW Luwu',
            required: true,
            checked: false
          },
          {
            id: 'pkkpr-2-3',
            label: 'Berita Acara Pemeriksaan Teknis Lapangan (BAP)',
            desc: 'Verifikasi faktual kondisi fisik tanah oleh petugas surveyor Tata Ruang Dinas PUPTR',
            required: true,
            checked: false
          }
        ]
      },
      {
        id: 3,
        title: 'Penerbitan SK PKKPR Ber-QR Code TTE',
        badge: 'Tahap 3 dari 3',
        description: 'Pengesahan dokumen resmi oleh Kepala Dinas untuk persyaratan PBG dan izin berusaha.',
        items: [
          {
            id: 'pkkpr-3-1',
            label: 'Rekomendasi Forum Penataan Ruang (FPR)',
            desc: 'Keputusan sidang pleno FPR untuk permohonan berskala menengah dan non-berusaha strategis',
            required: true,
            checked: false
          },
          {
            id: 'pkkpr-3-2',
            label: 'Penerbitan SK PKKPR Sah Bertanda Tangan Elektronik',
            desc: 'Dokumen SK resmi terbit dengan enkripsi BSrE BSSN dan siap diunduh di dashboard pemohon',
            required: true,
            checked: false
          }
        ]
      }
    ]
  },

  NIB_OSS: {
    key: 'NIB_OSS',
    label: 'Izin Usaha NIB OSS',
    categoryBadge: 'Penanaman Modal & Perizinan Usaha',
    title: 'Panduan Syarat Izin NIB OSS-RBA',
    description: 'Persyaratan legalitas usaha resmi berbasis risiko Kementerian Investasi/BKPM RI melalui sistem OSS satu pintu.',
    agency: 'DPMPTSP Kab. Luwu (Klinik OSS-RBA)',
    loket: 'Gerai 02 • Loket 06 - 08',
    actionCta: {
      label: 'Buka Portal OSS-RBA',
      icon: ExternalLink,
      actionType: 'external',
      targetUrl: 'https://oss.go.id'
    },
    stages: [
      {
        id: 1,
        title: 'Data Pemohon & Legalitas Awal',
        badge: 'Tahap 1 dari 4',
        description: 'Dokumen identitas dasar pemilik usaha perseorangan atau badan hukum.',
        items: [
          { id: '1-1', label: 'KTP-el Pemilik / Direktur Utama', desc: 'Scan e-KTP jelas tanpa crop sudut dokumen', required: true, checked: false },
          { id: '1-2', label: 'NPWP Aktif (Pribadi / Badan Usaha)', desc: 'Validasi status KSWP DJP Online aktif', required: true, checked: false },
          { id: '1-3', label: 'Nomor WhatsApp & Email Perusahaan', desc: 'Digunakan untuk verifikasi OTP akun OSS-RBA', required: true, checked: false },
          { id: '1-4', label: 'Akta Pendirian & SK Kemenkumham (Khusus PT/CV)', desc: 'Opsional untuk usaha perseorangan mikro', required: false, checked: false },
        ],
      },
      {
        id: 2,
        title: 'Penentuan KBLI & Tingkat Risiko',
        badge: 'Tahap 2 dari 4',
        description: 'Klasifikasi Baku Lapangan Usaha Indonesia (KBLI 2020) sesuai skala investasi.',
        items: [
          { id: '2-1', label: 'Pemilihan 5 Digit Kode KBLI 2020', desc: 'Konsultasi gratis tersedia di gerai DPMPTSP Loket 03', required: true, checked: false },
          { id: '2-2', label: 'Estimasi Modal Usaha & Luas Lahan', desc: 'Menentukan kategori UMK (<5M) atau Non-UMK (>5M)', required: true, checked: false },
          { id: '2-3', label: 'Pernyataan Mandiri K3L & Standar Usaha', desc: 'Pakta integritas kepatuhan regulasi teknis daerah', required: true, checked: false },
        ],
      },
      {
        id: 3,
        title: 'Tata Ruang (KKPPR) & Lingkungan',
        badge: 'Tahap 3 dari 4',
        description: 'Kesesuaian tata ruang RTRW Kabupaten Luwu dan komitmen perlindungan lingkungan.',
        items: [
          { id: '3-1', label: 'Konfirmasi Poligon Koordinat Geospasial', desc: 'Titik koordinat poligon lokasi usaha di peta GIS Luwu', required: true, checked: false },
          { id: '3-2', label: 'Pernyataan Mandiri SPPL Lingkungan Hidup', desc: 'Untuk kegiatan usaha risiko rendah & menengah rendah', required: true, checked: false },
          { id: '3-3', label: 'Persetujuan Teknis Dinas Terkait (Jika Ada)', desc: 'Rekomendasi teknis khusus komoditas tertentu', required: false, checked: false },
        ],
      },
      {
        id: 4,
        title: 'Penerbitan NIB & Sertifikat Standar',
        badge: 'Tahap 4 dari 4',
        description: 'Pencetakan NIB digital ber-QR Code resmi Kementerian Investasi/BKPM RI.',
        items: [
          { id: '4-1', label: 'Review Draft Dokumen NIB Elektronik', desc: 'Pengecekan kesesuaian data sebelum enkripsi BSrE', required: true, checked: false },
          { id: '4-2', label: 'Unduh Dokumen NIB dengan QR Code TTE', desc: 'Dapat dicetak mandiri di Anjungan Mandiri Kiosk MPP', required: true, checked: false },
        ],
      },
    ]
  },

  PBG_BANGUNAN: {
    key: 'PBG_BANGUNAN',
    label: 'PBG & Bangunan',
    categoryBadge: 'Persetujuan Bangunan Gedung',
    title: 'Panduan Syarat Persetujuan Bangunan Gedung (PBG & SLF)',
    description: 'Standar perizinan konstruksi pengganti IMB melalui portal SIMBG terintegrasi Dinas PUTR & DPMPTSP Luwu.',
    agency: 'Dinas PUTR & Tim Penilai Ahli (TPA)',
    loket: 'Gerai 02 • Loket 05',
    actionCta: {
      label: 'Buka Portal SIMBG PUPR',
      icon: ExternalLink,
      actionType: 'external',
      targetUrl: 'https://simbg.pu.go.id'
    },
    stages: [
      {
        id: 1,
        title: 'Dokumen Administrasi Pemohon',
        badge: 'Tahap 1 dari 3',
        description: 'Berkas kepemilikan tanah dan legalitas identitas pemilik gedung.',
        items: [
          { id: 'pbg-1-1', label: 'KTP-el Pemilik Bangunan Gedung', desc: 'Identitas pemohon perorangan atau penanggung jawab badan usaha', required: true, checked: false },
          { id: 'pbg-1-2', label: 'Sertipikat Kepemilikan Tanah / Bukti Perjanjian Sewa', desc: 'Sertipikat hak milik/hak guna bangunan yang sah dari ATR/BPN', required: true, checked: false },
          { id: 'pbg-1-3', label: 'Dokumen SK PKKPR / KRK Tata Ruang', desc: 'Kesesuaian tata ruang resmi dari Dinas PUPTR Luwu', required: true, checked: false },
          { id: 'pbg-1-4', label: 'Nomor WhatsApp & Email Pemilik Bangunan', desc: 'Untuk sinkronisasi akun SIMBG dan jadwal sidang teknis', required: true, checked: false },
        ]
      },
      {
        id: 2,
        title: 'Gambar Rencana Teknis Arsitektur & Struktur',
        badge: 'Tahap 2 dari 3',
        description: 'Desain teknis gedung yang telah diverifikasi oleh perencana bersertifikat.',
        items: [
          { id: 'pbg-2-1', label: 'Gambar Arsitektur & Denah Bangunan (Skala 1:100)', desc: 'Tampak depan, samping, denah lantai, dan potongan konstruksi', required: true, checked: false },
          { id: 'pbg-2-2', label: 'Perhitungan Konstruksi & Struktur Bangunan', desc: 'Perhitungan daya dukung tanah dan struktur beton/baja tahan gempa', required: true, checked: false },
          { id: 'pbg-2-3', label: 'Gambar Rencana Utilitas (MEP & Sanitasi)', desc: 'Skema instalasi listrik, plumbing air bersih, dan pengolahan limbah', required: true, checked: false },
        ]
      },
      {
        id: 3,
        title: 'Sidang TPA/TPT & Penerbitan PBG',
        badge: 'Tahap 3 dari 3',
        description: 'Pemeriksaan teknis bersama dan penetapan retribusi resmi daerah.',
        items: [
          { id: 'pbg-3-1', label: 'Rekomendasi Tim Penilai Ahli (TPA/TPT)', desc: 'Pernyataan pemenuhan standar teknis keselamatan bangunan gedung', required: true, checked: false },
          { id: 'pbg-3-2', label: 'Surat Ketetapan Retribusi Daerah (SKRD) PBG', desc: 'Pembayaran retribusi resmi melalui Bank Sulselbar / Kas Daerah', required: true, checked: false },
          { id: 'pbg-3-3', label: 'Penerbitan SK PBG & Lampiran Standar Teknis', desc: 'Dokumen PBG resmi terbit ber-QR code BSrE untuk memulai konstruksi', required: true, checked: false },
        ]
      }
    ]
  },

  PASPOR_IMIGRASI: {
    key: 'PASPOR_IMIGRASI',
    label: 'Paspor Imigrasi',
    categoryBadge: 'Keimigrasian & Perjalanan',
    title: 'Panduan Syarat Paspor RI Baru & Penggantian',
    description: 'Standar persyaratan dokumen paspor biasa dan elektronik di loket perwakilan Kantor Imigrasi MPP Simpurusiang.',
    agency: 'Kantor Imigrasi (Gerai Imigrasi MPP)',
    loket: 'Gerai 07 • Loket 14',
    actionCta: {
      label: 'Ambil Antrean Layanan Paspor',
      icon: Ticket,
      actionType: 'queue'
    },
    stages: [
      {
        id: 1,
        title: 'Berkas Identitas Wajib Asli',
        badge: 'Tahap 1 dari 3',
        description: 'Dokumen pokok yang harus dibawa fisik asli dan fotokopi A4 tanpa dipotong.',
        items: [
          { id: 'psp-1-1', label: 'KTP-el Asli & Fotokopi A4', desc: 'KTP-el pemohon asli yang masih berlaku', required: true, checked: false },
          { id: 'psp-1-2', label: 'Kartu Keluarga (KK) Asli & Fotokopi A4', desc: 'Kartu keluarga terbaru ber-barcode Dukcapil', required: true, checked: false },
          { id: 'psp-1-3', label: 'Akta Kelahiran / Buku Nikah / Ijazah Terakhir', desc: 'Pilih salah satu dokumen yang memuat nama, tanggal lahir, dan nama orang tua', required: true, checked: false },
          { id: 'psp-1-4', label: 'Paspor Lama Asli (Khusus Penggantian)', desc: 'Wajib dibawa bagi pemohon penggantian paspor yang habis masa berlaku', required: false, checked: false },
        ]
      },
      {
        id: 2,
        title: 'Verifikasi Berkas & Wawancara Biometrik',
        badge: 'Tahap 2 dari 3',
        description: 'Sesi wawancara keimigrasian, foto digital, dan pengambilan sidik jari biometrik.',
        items: [
          { id: 'psp-2-1', label: 'Bukti Pendaftaran Aplikasi M-Paspor', desc: 'Tunjukkan barcode antrean M-Paspor ke petugas loket Imigrasi', required: true, checked: false },
          { id: 'psp-2-2', label: 'Sesi Wawancara Keimigrasian & Pengambilan Foto', desc: 'Wawancara maksud tujuan perjalanan dan foto digital latar putih', required: true, checked: false },
          { id: 'psp-2-3', label: 'Pembayaran Kode Billing PNBP Paspor', desc: 'Pembayaran biaya paspor via Bank, Kantor Pos, atau M-Banking', required: true, checked: false },
        ]
      },
      {
        id: 3,
        title: 'Penerimaan Dokumen Paspor',
        badge: 'Tahap 3 dari 3',
        description: 'Pengambilan paspor fisik setelah selesai proses pencetakan oleh Imigrasi.',
        items: [
          { id: 'psp-3-1', label: 'Tanda Terima Permohonan Paspor', desc: 'Simpan bukti pengambilan yang diserahkan petugas setelah wawancara', required: true, checked: false },
          { id: 'psp-3-2', label: 'Pengambilan Fisik Paspor di Gerai MPP Luwu', desc: 'Paspor siap diambil dalam 3-4 hari kerja tanpa perlu ke luar kota', required: true, checked: false },
        ]
      }
    ]
  },

  SKCK_POLRES: {
    key: 'SKCK_POLRES',
    label: 'SKCK Kepolisian',
    categoryBadge: 'Kepolisian & Rekam Jejak',
    title: 'Panduan Syarat Penerbitan SKCK Baru & Perpanjangan',
    description: 'Surat Keterangan Catatan Kepolisian Sentra Layanan Polres Luwu di MPP untuk melamar kerja, BUMN, dan CPNS.',
    agency: 'Polres Luwu (Sentra SKCK)',
    loket: 'Gerai 08 • Loket 15',
    actionCta: {
      label: 'Ambil Antrean Layanan SKCK',
      icon: Ticket,
      actionType: 'queue'
    },
    stages: [
      {
        id: 1,
        title: 'Dokumen Persyaratan Pemohon',
        badge: 'Tahap 1 dari 2',
        description: 'Persyaratan berkas foto dan identitas diri yang diserahkan ke loket kepolisian.',
        items: [
          { id: 'skck-1-1', label: 'Fotokopi KTP-el & Kartu Keluarga (KK)', desc: '1 lembar fotokopi KTP dan KK yang berdomisili di Kabupaten Luwu', required: true, checked: false },
          { id: 'skck-1-2', label: 'Fotokopi Akta Kelahiran / Surat Kenal Lahir', desc: 'Sebagai bukti pencocokan data identitas nama lengkap dan orang tua', required: true, checked: false },
          { id: 'skck-1-3', label: 'Pasfoto 4x6 Latar Belakang Merah (6 Lembar)', desc: 'Foto formal pakaian sopan berkerah dengan latar belakang merah polos', required: true, checked: false },
          { id: 'skck-1-4', label: 'Rumus Sidik Jari (Dari Satreskrim)', desc: 'Perekaman rumus sidik jari gratis tersedia di sentra loket Polres di MPP', required: true, checked: false },
          { id: 'skck-1-5', label: 'SKCK Lama Asli (Khusus Perpanjangan)', desc: 'Wajib dilampirkan jika melakukan perpanjangan masa berlaku SKCK', required: false, checked: false },
        ]
      },
      {
        id: 2,
        title: 'Pencetakan & Legalisir SKCK',
        badge: 'Tahap 2 dari 2',
        description: 'Pengisian daftar pertanyaan catatan kepolisian dan penerbitan lembar resmi.',
        items: [
          { id: 'skck-2-1', label: 'Pengisian Formulir Riwayat Hidup / Rekam Jejak', desc: 'Isi formulir riwayat pendidikan, keluarga, dan perkara pidana di loket', required: true, checked: false },
          { id: 'skck-2-2', label: 'Pembayaran Tarif PNBP Resmi Rp 30.000,-', desc: 'Tarif resmi sesuai PP No. 76 Tahun 2020 melalui loket kas Bank Sulselbar / QRIS', required: true, checked: false },
          { id: 'skck-2-3', label: 'Pencetakan Lembar SKCK & Legalisir Dokumen', desc: 'Pencetakan lembar SKCK asli ber-barcode dan legalisir stempel kepolisian', required: true, checked: false },
        ]
      }
    ]
  }
};

export function resolveServiceKey(input?: string): RequirementServiceKey {
  if (!input) return 'KTP_DUKCAPIL';
  const q = String(input).toUpperCase().trim();
  if (q.includes('KTP') || q.includes('DUKCAPIL') || q.includes('KK') || q.includes('KEPENDUDUKAN') || q.includes('IKD') || q.includes('AKTA') || q.includes('NIK')) {
    return 'KTP_DUKCAPIL';
  }
  if (q.includes('PKKPR') || q.includes('TATA RUANG') || q.includes('RUANG') || q.includes('RDTR') || q.includes('RTRW') || q.includes('ZONASI') || q.includes('LAHAN') || q.includes('GIS')) {
    return 'GIS_PKKPR';
  }
  if (q.includes('PBG') || q.includes('IMB') || q.includes('BANGUNAN') || q.includes('GEDUNG') || q.includes('SLF')) {
    return 'PBG_BANGUNAN';
  }
  if (q.includes('PASPOR') || q.includes('PASSPORT') || q.includes('IMIGRASI') || q.includes('VISA')) {
    return 'PASPOR_IMIGRASI';
  }
  if (q.includes('SKCK') || q.includes('POLRES') || q.includes('POLISI') || q.includes('KEHILANGAN')) {
    return 'SKCK_POLRES';
  }
  if (q.includes('NIB') || q.includes('OSS') || q.includes('INVESTASI') || q.includes('USAHA') || q.includes('KBLI') || q.includes('IZIN')) {
    return 'NIB_OSS';
  }
  return 'KTP_DUKCAPIL';
}

export interface InteractiveRequirementStepperProps {
  initialService?: RequirementServiceKey | string;
  onOpenQueueBooking?: (serviceName?: string, agencyName?: string) => void;
  isDark?: boolean;
}

export const InteractiveRequirementStepper: React.FC<InteractiveRequirementStepperProps> = ({
  initialService = 'KTP_DUKCAPIL',
  onOpenQueueBooking,
  isDark = false
}) => {
  const [activeServiceKey, setActiveServiceKey] = useState<RequirementServiceKey>(() => resolveServiceKey(initialService));
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  
  // Store user-toggled checks per service key
  const [serviceStagesState, setServiceStagesState] = useState<Record<RequirementServiceKey, RequirementStage[]>>(() => {
    const initialMap: any = {};
    (Object.keys(SERVICE_REQUIREMENT_CONFIGS) as RequirementServiceKey[]).forEach(k => {
      initialMap[k] = JSON.parse(JSON.stringify(SERVICE_REQUIREMENT_CONFIGS[k].stages));
    });
    return initialMap;
  });

  // Sync when initialService prop changes
  useEffect(() => {
    if (initialService) {
      const resolved = resolveServiceKey(initialService);
      setActiveServiceKey(resolved);
      setCurrentStageIndex(0);
    }
  }, [initialService]);

  // Global event listener for context switching (e.g. from GlobalSearchModal / MppCommandPalette)
  useEffect(() => {
    const handleServiceSelectEvent = (e: any) => {
      const target = e.detail?.service;
      if (target) {
        const resolved = resolveServiceKey(target);
        setActiveServiceKey(resolved);
        setCurrentStageIndex(0);
      }
    };

    window.addEventListener('select-mpp-requirement-service', handleServiceSelectEvent);
    return () => {
      window.removeEventListener('select-mpp-requirement-service', handleServiceSelectEvent);
    };
  }, []);

  const activeConfig = SERVICE_REQUIREMENT_CONFIGS[activeServiceKey] || SERVICE_REQUIREMENT_CONFIGS.KTP_DUKCAPIL;
  const currentStages = serviceStagesState[activeServiceKey] || activeConfig.stages;
  const currentStage = currentStages[currentStageIndex] || currentStages[0];

  // Toggle item check
  const toggleItem = (itemId: string) => {
    setServiceStagesState(prevMap => {
      const stagesForActive = prevMap[activeServiceKey] || activeConfig.stages;
      const updated = stagesForActive.map((stage, sIdx) => {
        if (sIdx !== currentStageIndex) return stage;
        return {
          ...stage,
          items: stage.items.map(it => it.id === itemId ? { ...it, checked: !it.checked } : it),
        };
      });
      return {
        ...prevMap,
        [activeServiceKey]: updated
      };
    });
  };

  // Switch active service tab
  const handleSelectService = (key: RequirementServiceKey) => {
    setActiveServiceKey(key);
    setCurrentStageIndex(0);
  };

  // Calculate overall progress across all stages of active service
  const allItems = currentStages.flatMap(s => s.items);
  const checkedCount = allItems.filter(it => it.checked).length;
  const progressPercent = allItems.length > 0 ? Math.round((checkedCount / allItems.length) * 100) : 0;

  // Handle CTA Click
  const handleCtaClick = () => {
    const cta = activeConfig.actionCta;
    if (cta.actionType === 'queue') {
      if (onOpenQueueBooking) {
        onOpenQueueBooking(activeConfig.title, activeConfig.agency);
      } else {
        const el = document.getElementById('antrean-online');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        else window.dispatchEvent(new CustomEvent('open-mpp-queue-modal', { detail: { service: activeConfig.title } }));
      }
    } else if (cta.actionType === 'gis') {
      const el = document.getElementById('peta-spasial');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else window.location.href = cta.targetUrl || '/peta';
    } else if (cta.targetUrl) {
      window.open(cta.targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const SERVICE_KEYS: RequirementServiceKey[] = [
    'KTP_DUKCAPIL',
    'GIS_PKKPR',
    'NIB_OSS',
    'PBG_BANGUNAN',
    'PASPOR_IMIGRASI',
    'SKCK_POLRES'
  ];

  return (
    <section id="syarat-dokumen" className="w-full space-y-6 scroll-mt-28 font-sans">
      
      {/* 1. DYNAMIC CATEGORY TABS / CONTEXT SWITCHER BAR */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-300/60 dark:border-teal-700/60">
            <FileCheck2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Interactive Dynamic Checklist Stepper</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
            Pilih jenis layanan untuk menyesuaikan dokumen persyaratan
          </span>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
          {SERVICE_KEYS.map((sKey) => {
            const cfg = SERVICE_REQUIREMENT_CONFIGS[sKey];
            const isActive = sKey === activeServiceKey;
            return (
              <button
                key={sKey}
                type="button"
                onClick={() => handleSelectService(sKey)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-sm border border-emerald-500/30 ring-1 ring-emerald-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-900/50'
                }`}
              >
                <span className="truncate">{cfg.label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. DYNAMIC HEADER WITH ACTIVE TITLE & OVERALL PROGRESS */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/50">
              {activeConfig.categoryBadge}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{activeConfig.agency}</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{activeConfig.loket}</span>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-sans">
            {activeConfig.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-3xl text-justify leading-relaxed">
            {activeConfig.description}
          </p>
        </div>

        {/* Global Progress Bar Pill */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs shrink-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono font-black text-sm flex items-center justify-center">
            {progressPercent}%
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-900 dark:text-white">Kelengkapan Berkas</div>
            <div className="text-[11px] text-slate-400 font-medium">{checkedCount} dari {allItems.length} berkas siap</div>
          </div>
        </div>
      </div>

      {/* 3. PROGRESSIVE STEPPER NAV TABS */}
      <div className={`grid gap-2 ${
        currentStages.length === 2 
          ? 'grid-cols-2' 
          : currentStages.length === 3 
          ? 'grid-cols-1 sm:grid-cols-3' 
          : 'grid-cols-2 md:grid-cols-4'
      }`}>
        {currentStages.map((stage, idx) => {
          const isActive = idx === currentStageIndex;
          const isDone = stage.items.length > 0 && stage.items.every(it => it.checked);
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => setCurrentStageIndex(idx)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                  : isDone
                  ? 'bg-white dark:bg-slate-900 border-emerald-500/30 text-emerald-600'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-500 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                  Langkah 0{idx + 1}
                </span>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                )}
              </div>
              <div className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-1 font-sans">
                {stage.title}
              </div>
            </button>
          );
        })}
      </div>

      {/* 4. ACTIVE STEP CHECKLIST CARD */}
      <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
        
        {/* Step Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {currentStage.badge}
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-sans">
              {currentStage.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {currentStage.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">
              {currentStage.items.filter(it => it.checked).length} / {currentStage.items.length} Selesai
            </span>
          </div>
        </div>

        {/* Interactive Checkbox Items */}
        <div className="space-y-3">
          {currentStage.items.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                item.checked
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/50 shadow-2xs'
                  : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <button
                type="button"
                className="mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0"
              >
                {item.checked ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs sm:text-sm font-bold font-sans ${
                    item.checked ? 'text-emerald-950 dark:text-emerald-200 line-through opacity-80' : 'text-slate-900 dark:text-white'
                  }`}>
                    {item.label}
                  </span>
                  {item.required ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
                      Wajib
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      Opsional
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed text-justify">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Stepper Footer Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setCurrentStageIndex(prev => Math.max(0, prev - 1))}
            disabled={currentStageIndex === 0}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Tahap Sebelumnya</span>
          </button>

          <div className="flex items-center gap-2.5">
            {currentStageIndex < currentStages.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStageIndex(prev => Math.min(currentStages.length - 1, prev + 1))}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/25 transition-all cursor-pointer active:scale-95"
              >
                <span>Lanjut Langkah Berikutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCtaClick}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
              >
                <span>{activeConfig.actionCta.label}</span>
                {React.createElement(activeConfig.actionCta.icon, { className: 'w-4 h-4' })}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveRequirementStepper;
