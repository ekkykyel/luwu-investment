import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { 
  Building2, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  RotateCw,
  MapPin, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Navigation, 
  Accessibility, 
  Maximize2,
  Minimize2, 
  Ticket, 
  ArrowRight,
  Armchair,
  Layers,
  ChevronRight,
  Baby,
  Moon,
  BookOpen,
  HeartHandshake,
  Shield,
  HelpCircle,
  Eye,
  SlidersHorizontal,
  Compass,
  Users,
  ShieldCheck
} from 'lucide-react';

export type FloorCategory = 'all' | 'counter' | 'facility' | 'disability';

export interface FloorNode {
  id: string;
  name: string;
  subName?: string;
  category: 'counter' | 'facility' | 'disability';
  zone: 'West Wing (Sayap Barat)' | 'East Wing (Sayap Timur)' | 'Central Atrium' | 'Entrance Flow (Selasar Masuk)' | 'North Wing (Sayap Utara)';
  x: number;
  y: number;
  w: number;
  h: number;
  rx?: number;
  accent: string;
  status: 'open' | 'busy' | 'closed';
  services: string[];
  deskType?: 'booth' | 'teller' | 'counter' | 'conference' | 'workstation';
  isDisabilityFriendly?: boolean;
  operatingHours?: string;
  wayfindingTips?: string;
}

export interface FacilityDetailInfo {
  id: string;
  name: string;
  description: string;
  capacity?: string;
  amenities: string[];
  isAccessibleDisability: boolean;
  status: 'available' | 'maintenance' | 'in_use';
}

export const FACILITY_DETAILS: Record<string, FacilityDetailInfo> = {
  'ruang_perawatan': {
    id: 'ruang_perawatan',
    name: 'Pojok Laktasi & Ibu Menyusui',
    description: 'Ruang privat yang higienis, tenang, dan nyaman khusus bagi ibu menyusui dan memerah ASI.',
    capacity: '3 - 4 Ibu & Bayi',
    amenities: [
      'Sofa Menyusui Ergonomis & Tirai Privasi',
      'Air Purifier HEPA & AC Central Sejuk',
      'Kulkas Khusus Penyimpanan ASI Perah',
      'Sterilizer & Pemanas Botol Susu Elektrik',
      'Wastafel Cuci Tangan & Sabun Antiseptik',
      'Meja Ganti Popok Bayi (Diaper Table Lembut)',
      'Stop Kontak & Fast Charging Station'
    ],
    isAccessibleDisability: true,
    status: 'available'
  },
  'ruang_laktasi': {
    id: 'ruang_laktasi',
    name: 'Pojok Laktasi & Ibu Menyusui',
    description: 'Ruang privat yang higienis, tenang, dan nyaman khusus bagi ibu menyusui dan memerah ASI.',
    capacity: '3 - 4 Ibu & Bayi',
    amenities: [
      'Sofa Menyusui Ergonomis & Tirai Privasi',
      'Air Purifier HEPA & AC Central Sejuk',
      'Kulkas Khusus Penyimpanan ASI Perah',
      'Sterilizer & Pemanas Botol Susu Elektrik',
      'Wastafel Cuci Tangan & Sabun Antiseptik',
      'Meja Ganti Popok Bayi (Diaper Table Lembut)',
      'Stop Kontak & Fast Charging Station'
    ],
    isAccessibleDisability: true,
    status: 'available'
  },
  'layanan_disabilitas': {
    id: 'layanan_disabilitas',
    name: 'Layanan Inklusif & Jalur Ramah Disabilitas',
    description: 'Pos fasilitasi dan pendampingan terpadu bagi penyandang disabilitas, lansia, dan kelompok rentan.',
    capacity: '5 - 8 Pemohon Prioritas',
    amenities: [
      'Kursi Roda & Tongkat Ketiak Standar Medis',
      'Jalur Pemandu Tactile (Guiding Blocks Kuning)',
      'Loket Pelayanan Rendah (Wheelchair Height)',
      'Petugas Pendamping Bahasa Isyarat',
      'Earphone & Perangkat Bantu Dengar Audio',
      'Formulir Huruf Braille & Dokumen Khusus',
      'Jalur Evakuasi Landai (Ramp Anti-Slip)'
    ],
    isAccessibleDisability: true,
    status: 'available'
  },
  'ruang_bermain_anak': {
    id: 'ruang_bermain_anak',
    name: 'Ruang Bermain Anak (Kids Play Corner)',
    description: 'Area bermain edukatif yang aman dan ramah anak untuk kenyamanan keluarga pemohon layanan.',
    capacity: '10 - 15 Anak',
    amenities: [
      'Matras Lembut Anti-Benturan (Soft Play Floor)',
      'Mainan Edukatif Bersertifikat SNI',
      'Buku Cerita Bergambar & Meja Mewarnai',
      'Smart TV Edukasi & Kartun Ramah Anak',
      'Dispenser Air Minum Higienis',
      'CCTV Pemantau Keamanan 24 Jam',
      'Pendingin Udara AC & Filter Udara Sehat'
    ],
    isAccessibleDisability: true,
    status: 'available'
  },
  'mushalla': {
    id: 'mushalla',
    name: 'Mushalla Al-Ikhlas MPP Simpurusiang',
    description: 'Sarana ibadah yang bersih, tenang, dan representatif bagi pengunjung maupun petugas MPP.',
    capacity: '25 - 30 Jamaah',
    amenities: [
      'Tempat Wudhu Pria & Wanita Terpisah',
      'Karpet Sajadah Tebal & Harum',
      'Mukena, Sarung & Al-Quran Bersih',
      'Pendingin Ruangan AC Split',
      'Penunjuk Arah Kiblat Presisi',
      'Rak Sepatu & Sandal Khusus Wudhu',
      'Sound System Azan & Panggilan Sholat'
    ],
    isAccessibleDisability: true,
    status: 'available'
  },
  'ruang_baca': {
    id: 'ruang_baca',
    name: 'Pojok Baca Digital & Ruang Literasi',
    description: 'Fasilitas membaca dan penelusuran referensi digital persembahan Dinas Perpustakaan & Kearsipan Luwu.',
    capacity: '8 - 12 Pengunjung',
    amenities: [
      'Tablet & PC Akses E-Perpusnas / E-Luwu',
      'Koleksi Buku Fisik, Jurnal & Majalah Terbaru',
      'Sofa Baca Nyaman & Meja Diskusi Literasi',
      'Free High-Speed Wi-Fi Pemkab Luwu',
      'Stop Kontak Charging di Setiap Meja',
      'Pencahayaan Hangat (Warm White) Ramah Mata'
    ],
    isAccessibleDisability: true,
    status: 'available'
  },
  'toilet_pria': {
    id: 'toilet_pria',
    name: 'Toilet Pria & Sanitasi Bersih',
    description: 'Fasilitas sanitasi toilet pria standar modern dengan sirkulasi udara bersih dan higienis.',
    capacity: '4 Bilik + 4 Urinoir Otomatis',
    amenities: [
      'Bilik Kloset Duduk & Jongkok Higienis',
      'Urinoir Sensor Flush Otomatis',
      'Wastafel Cermin & Dispenser Sabun Sensor',
      'Hand Dryer Pengering Tangan Cepat',
      'Exhaust Fan & Pewangi Ruangan Otomatis',
      'Tempat Sampah Tertutup Sensor'
    ],
    isAccessibleDisability: false,
    status: 'available'
  },
  'toilet_wanita': {
    id: 'toilet_wanita',
    name: 'Toilet Wanita & Sanitasi Inklusif',
    description: 'Fasilitas sanitasi toilet wanita bersih, higienis, dan dilengkapi bilik khusus ramah difabel.',
    capacity: '6 Bilik Sanitasi',
    amenities: [
      'Bilik Khusus Difabel (Handrail Besi & Pintu Geser Lebar)',
      'Kloset Duduk Higienis Standar Inklusif',
      'Wastafel Rias Cermin LED & Sabun Antiseptik',
      'Tempat Pembuangan Khusus Sanitasi Wanita',
      'Hand Dryer & Hand Towel',
      'Tombol Darurat (Emergency Call Button) di Bilik Difabel'
    ],
    isAccessibleDisability: true,
    status: 'available'
  },
  'smoking_area': {
    id: 'smoking_area',
    name: 'Smoking Area (Area Merokok Terbuka)',
    description: 'Area terbuka dengan sirkulasi alami terpisah dari gedung utama agar tidak mencemari ruang pelayanan publik.',
    capacity: '10 - 15 Orang',
    amenities: [
      'Asbak Berdiri Khusus (Standing Ashtray Safety)',
      'Kanopi Peneduh Panas & Hujan',
      'Bangku Kayu Taman Tahan Cuaca',
      'Tanaman Hias Penyerap Polusi Udara',
      'Tempat Sampah Pilah Puntung Rokok'
    ],
    isAccessibleDisability: true,
    status: 'available'
  },
  'ruang_istirahat': {
    id: 'ruang_istirahat',
    name: 'Ruang Istirahat & Locker Petugas',
    description: 'Fasilitas rehat internal bagi petugas loket dan front office untuk menjaga kualitas prima pelayanan.',
    capacity: '12 Petugas',
    amenities: [
      'Locker Kunci Pribadi Petugas Loket',
      'Sofa Rehat Nyaman & Dispenser Air Minum',
      'Kotak P3K & Perlengkapan Medis Darurat',
      'Microwave & Kulkas Mini Petugas',
      'Meja Santap Petugas Terpisah'
    ],
    isAccessibleDisability: true,
    status: 'available'
  },
  'ruang_tim_teknis': {
    id: 'ruang_tim_teknis',
    name: 'Ruang Tim Teknis Lintas OPD Terpadu',
    description: 'Workstation 10 Komputer koordinasi teknis verifikasi dokumen PKKPR, PBG, Andalalin, dan Amdal.',
    capacity: '15 - 20 Tim Teknis',
    amenities: [
      '10 Unit PC Workstation High-Spec Multi-Screen',
      'Jaringan Intranet Dedicated Fiber Optic Pemda',
      'Printer & Scanner Dokumen Plotter A3/A4',
      'Meja Diskusi Pleno Teknis Perizinan',
      'Smart Interactive Board Presentasi Peta CAD/GIS',
      'AC Central Sejuk & Ergonomic Chairs'
    ],
    isAccessibleDisability: true,
    status: 'available'
  },
  'ruang_rapat': {
    id: 'ruang_rapat',
    name: 'Ruang Rapat Utama & Ekspose Investasi',
    description: 'Ruang konferensi representatif untuk rapat koordinasi instansi, evaluasi SLA, dan ekspose investor VIP.',
    capacity: '20 - 30 Orang',
    amenities: [
      'Meja Rapat Konferensi Kayu Solid Oval',
      'Smart LED TV 85-Inch 4K & Video Conference System',
      'Mikrofon Delegasi Audio Conference System',
      'Podium Presentasi & Laser Pointer Wireless',
      'Koneksi HDMI & Screen Casting Terintegrasi',
      'Kursi Rapat Eksekutif Ergonomis'
    ],
    isAccessibleDisability: true,
    status: 'available'
  },
  'dekranasda': {
    id: 'dekranasda',
    name: 'Dekranasda & Galeri Produk Unggulan Luwu',
    description: 'Galeri pameran dan promosi produk kerajinan tenun, kriya, kuliner, dan kopi khas Kabupaten Luwu.',
    capacity: '15 - 20 Pengunjung',
    amenities: [
      'Etalase Display Produk Tenun & Kriya Berlampu LED',
      'Katalog Digital Produk UMKM & Transaksi QRIS',
      'Sample Kopi Khas Luwu (Latimojong & Bastem)',
      'Brosur & Informasi Kemitraan Usaha Daerah',
      'Meja Kasir Terpadu Bank Sulselbar'
    ],
    isAccessibleDisability: true,
    status: 'available'
  },
  'front_office': {
    id: 'front_office',
    name: 'Front Office Concierge & Resepsionis Sentral',
    description: 'Pusat penerimaan tamu, bantuan informasi awal, verifikasi berkas cepat, dan pemandu alur MPP Simpurusiang.',
    capacity: 'Meja Layanan 4 Petugas Sentral',
    amenities: [
      'Petugas Front Office & Concierge Ramah Profesional',
      'Buku Tamu Digital & Scanner Barcode',
      'Papan Informasi Alur Layanan 19 Instansi Terpadu',
      'Helpdesk Pengaduan & Asistensi SP4N LAPOR',
      'Kamera CCTV Sentral & Intercom Panggilan'
    ],
    isAccessibleDisability: true,
    status: 'available'
  },
  'layanan_mandiri_1': {
    id: 'layanan_mandiri_1',
    name: 'E-Kiosk 1 (Tiket Antrean & Layanan Mandiri)',
    description: 'Mesin self-service touch-screen untuk pengambilan nomor tiket antrean berbasis NIK dan cetak QR Code.',
    capacity: '1 Unit Kios Mandiri',
    amenities: [
      'Layar Sentuh Interaktif 24-Inch Full HD',
      'Thermal Printer Tiket Antrean Cepat',
      'Barcode Scanner & E-KTP Card Reader',
      'Petugas Pendamping Khusus E-Kiosk',
      'Instruksi Audio Panduan Pengambilan Antrean'
    ],
    isAccessibleDisability: true,
    status: 'available'
  },
  'layanan_mandiri_2': {
    id: 'layanan_mandiri_2',
    name: 'E-Kiosk 2 (Tiket Antrean & Layanan Mandiri)',
    description: 'Mesin self-service touch-screen untuk pengambilan nomor tiket antrean berbasis NIK dan cetak QR Code.',
    capacity: '1 Unit Kios Mandiri',
    amenities: [
      'Layar Sentuh Interaktif 24-Inch Full HD',
      'Thermal Printer Tiket Antrean Cepat',
      'Barcode Scanner & E-KTP Card Reader',
      'Petugas Pendamping Khusus E-Kiosk',
      'Instruksi Audio Panduan Pengambilan Antrean'
    ],
    isAccessibleDisability: true,
    status: 'available'
  },
  'pos_keamanan': {
    id: 'pos_keamanan',
    name: 'Pos Penjagaan & Pemeriksaan Awal',
    description: 'Pos keamanan Satpol PP dan sekuriti untuk pemeriksaan awal, penitipan barang, dan ketertiban gedung.',
    capacity: '2 - 3 Petugas Keamanan',
    amenities: [
      'Metal Detector & Walkthrough Gate Sensor',
      'Monitor CCTV 16 Channel Realtime Gedung',
      'Kotak P3K Medis Darurat',
      'Alat Pemadam Api Ringan (APAR)',
      'Buku Log Tamu Khusus & Penitipan Barang'
    ],
    isAccessibleDisability: true,
    status: 'available'
  },
  'gerbang_masuk': {
    id: 'gerbang_masuk',
    name: 'Pintu Gerbang Masuk Utama',
    description: 'Akses masuk utama gedung MPP Simpurusiang dengan pintu kaca otomatis sensor dan ramp landai difabel.',
    capacity: 'Sirkulasi Pengunjung Bebas',
    amenities: [
      'Pintu Kaca Otomatis Sensor Gerak',
      'Ramp Landai Standar Kursi Roda Difabel',
      'Guiding Block Tactile Tunanetra',
      'Karpet Debu Sanitasi & Disinfeksi'
    ],
    isAccessibleDisability: true,
    status: 'available'
  }
};

export interface SelectedFloorItem {
  id: string;
  code?: string;
  name: string;
  subName?: string;
  type: 'tenant' | 'facility' | 'zone';
  category?: 'counter' | 'facility' | 'disability' | string;
  zone?: string;
  status: 'open' | 'busy' | 'closed' | 'active' | 'standby' | 'alert' | 'responding';
  services: string[];
  description?: string;
  capacity?: string;
  amenities?: string[];
  isAccessibleDisability?: boolean;
  facilityStatus?: 'available' | 'maintenance' | 'in_use';
  operatingHours?: string;
  wayfindingTips?: string;
  isDisabilityFriendly?: boolean;
  activeRequests?: any[];
}

export interface InteractiveFloorPlanProps {
  isDark?: boolean;
  onOpenQueueBooking?: (serviceName?: string) => void;
  className?: string;
  selectedId?: string | null;
  onSelectElement?: (item: SelectedFloorItem) => void;
  floor?: 1 | 2;
  onFloorChange?: (floor: 1 | 2) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// SPATIAL NODES MASTER DATA - MPP SIMPURUSIANG KABUPATEN LUWU
// ─────────────────────────────────────────────────────────────────────────────
const FLOOR_NODES: FloorNode[] = [
  // ── 1. ENTRANCE FLOW (BOTTOM SELASAR) ──
  {
    id: 'gerbang_masuk',
    name: 'PINTU MASUK',
    subName: 'Akses Utama & Scan Barcode',
    category: 'facility',
    zone: 'Entrance Flow (Selasar Masuk)',
    x: 570,
    y: 720,
    w: 100,
    h: 60,
    rx: 8,
    accent: '#10b981',
    status: 'open',
    services: ['Pintu Masuk Otomatis Sensor', 'Pemeriksaan Suhu & Disinfeksi', 'Ramp Landai Kursi Roda'],
    isDisabilityFriendly: true,
    operatingHours: '07:30 - 16:00 WITA',
    wayfindingTips: 'Pintu gerbang kaca utama menghadap pelataran parkir MPP.'
  },
  {
    id: 'pos_keamanan',
    name: 'POS JAGA',
    subName: 'Petugas Keamanan Satpol PP',
    category: 'facility',
    zone: 'Entrance Flow (Selasar Masuk)',
    x: 495,
    y: 705,
    w: 60,
    h: 65,
    rx: 6,
    accent: '#64748b',
    status: 'open',
    services: ['Pemeriksaan Keamanan Awal', 'Pemberian Kartu Visitor/Tamu', 'Informasi Parkir & Penitipan Barang'],
    operatingHours: '07:00 - 17:00 WITA',
    wayfindingTips: 'Tepat di sisi barat pintu masuk utama.'
  },
  {
    id: 'layanan_mandiri_1',
    name: 'E-KIOSK 1',
    subName: 'Tiket Antrean Mandiri',
    category: 'facility',
    zone: 'Entrance Flow (Selasar Masuk)',
    x: 500,
    y: 555,
    w: 65,
    h: 42,
    rx: 6,
    accent: '#3b82f6',
    status: 'open',
    services: ['Pengambilan Nomor Antrean Berbasis NIK', 'Pengecekan Kuota Layanan', 'Cetak Tiket QR Code'],
    isDisabilityFriendly: true,
    operatingHours: '07:30 - 15:30 WITA',
    wayfindingTips: 'Setelah pintu kaca masuk, berada di sayap kiri koridor selasar.'
  },
  {
    id: 'layanan_mandiri_2',
    name: 'E-KIOSK 2',
    subName: 'Tiket Antrean Mandiri',
    category: 'facility',
    zone: 'Entrance Flow (Selasar Masuk)',
    x: 635,
    y: 555,
    w: 65,
    h: 42,
    rx: 6,
    accent: '#3b82f6',
    status: 'open',
    services: ['Pengambilan Nomor Antrean Berbasis NIK', 'Pengecekan Kuota Layanan', 'Cetak Tiket QR Code'],
    isDisabilityFriendly: true,
    operatingHours: '07:30 - 15:30 WITA',
    wayfindingTips: 'Setelah pintu kaca masuk, berada di sayap kanan koridor selasar.'
  },
  {
    id: 'front_office',
    name: 'FRONT OFFICE',
    subName: 'Resepsionis & Concierge Sentral',
    category: 'facility',
    zone: 'Entrance Flow (Selasar Masuk)',
    x: 505,
    y: 485,
    w: 190,
    h: 60,
    rx: 14,
    accent: '#6366f1',
    status: 'open',
    services: ['Konsultasi Awal Berkas Layanan', 'Pemberian Kursi Roda Gratis', 'Panduan Loket & Pengaduan Cepat', 'Pemandu Bahasa Isyarat'],
    deskType: 'counter',
    isDisabilityFriendly: true,
    operatingHours: '07:30 - 16:00 WITA',
    wayfindingTips: 'Tepat lurus di hadapan pengunjung setelah melewati E-Kiosk.'
  },

  // ── 2. CENTRAL ATRIUM RING (OVAL LAYOUT) ──
  {
    id: 'IMIGRASI',
    name: 'KANTOR IMIGRASI',
    subName: 'Paspor RI & Dokumen Keimigrasian',
    category: 'counter',
    zone: 'Central Atrium',
    x: 450,
    y: 155,
    w: 85,
    h: 52,
    rx: 8,
    accent: '#06b6d4',
    status: 'open',
    services: ['Permohonan Paspor Baru / Penggantian', 'Wawancara & Biometrik Paspor Elektronik', 'Pengambilan Buku Paspor Terbit'],
    deskType: 'booth',
    isDisabilityFriendly: true,
    operatingHours: '08:00 - 15:30 WITA',
    wayfindingTips: 'Lingkar Atrium Sisi Barat Laut (Utara).'
  },
  {
    id: 'KPP_PRATAMA',
    name: 'KPP PRATAMA',
    subName: 'Pelayanan Pajak Pratama Palopo/Luwu',
    category: 'counter',
    zone: 'Central Atrium',
    x: 555,
    y: 150,
    w: 90,
    h: 52,
    rx: 8,
    accent: '#f59e0b',
    status: 'open',
    services: ['Pembuatan / Validasi NPWP Pribadi & Badan', 'Asistensi Lapor SPT Tahunan Elektronik (E-Filing)', 'Konsultasi E-Biling & Insentif Pajak'],
    deskType: 'booth',
    isDisabilityFriendly: true,
    operatingHours: '08:00 - 15:30 WITA',
    wayfindingTips: 'Lingkar Atrium Sisi Utara Tengah.'
  },
  {
    id: 'DINSOS',
    name: 'DINAS SOSIAL',
    subName: 'Bansos, DTKS & Rekomendasi Jamkesda',
    category: 'counter',
    zone: 'Central Atrium',
    x: 665,
    y: 155,
    w: 85,
    h: 52,
    rx: 8,
    accent: '#10b981',
    status: 'open',
    services: ['Cek Kepesertaan DTKS Kemensos', 'Rekomendasi Bantuan BPJS PBI Pemda', 'Pemberian Alat Bantu Disabilitas'],
    deskType: 'booth',
    isDisabilityFriendly: true,
    operatingHours: '08:00 - 15:30 WITA',
    wayfindingTips: 'Lingkar Atrium Sisi Timur Laut (Utara).'
  },
  {
    id: 'KEJARI',
    name: 'KEJAKSAAN NEGERI',
    subName: 'Pos Hukum & Pembayaran Denda Tilang',
    category: 'counter',
    zone: 'Central Atrium',
    x: 775,
    y: 200,
    w: 78,
    h: 50,
    rx: 8,
    accent: '#ef4444',
    status: 'open',
    services: ['Konsultasi Hukum Gratis (Datun)', 'Pengambilan Barang Bukti & Tilang', 'Layanan Pos Keadilan Restoratif'],
    deskType: 'booth',
    operatingHours: '08:30 - 15:00 WITA',
    wayfindingTips: 'Lingkar Atrium Sisi Timur Bagian Atas.'
  },
  {
    id: 'HAS',
    name: 'KEMENAG / HALAL',
    subName: 'Sertifikasi Halal & Informasi Haji',
    category: 'counter',
    zone: 'Central Atrium',
    x: 800,
    y: 265,
    w: 78,
    h: 50,
    rx: 8,
    accent: '#10b981',
    status: 'open',
    services: ['Pendaftaran Sertifikasi Halal Gratis (SEHATI)', 'Konsultasi Porsi Antrean Haji & Umrah', 'Rekomendasi Bimas Islam'],
    deskType: 'booth',
    operatingHours: '08:00 - 15:30 WITA',
    wayfindingTips: 'Lingkar Atrium Sisi Timur Bagian Tengah.'
  },
  {
    id: 'BPJS_KET',
    name: 'BPJS KETENAGAKERJAAN',
    subName: 'Jamsostek Perlindungan Pekerja',
    category: 'counter',
    zone: 'Central Atrium',
    x: 800,
    y: 330,
    w: 78,
    h: 50,
    rx: 8,
    accent: '#10b981',
    status: 'open',
    services: ['Klaim Saldo JHT (Jaminan Hari Tua)', 'Pendaftaran Peserta BPU (Bukan Penerima Upah)', 'Informasi Program Beasiswa Pekerja'],
    deskType: 'booth',
    isDisabilityFriendly: true,
    operatingHours: '08:00 - 15:30 WITA',
    wayfindingTips: 'Lingkar Atrium Sisi Timur Bagian Bawah.'
  },
  {
    id: 'BPJS_KES',
    name: 'BPJS KESEHATAN',
    subName: 'JKN-KIS Pelayanan Kesehatan',
    category: 'counter',
    zone: 'Central Atrium',
    x: 775,
    y: 395,
    w: 78,
    h: 50,
    rx: 8,
    accent: '#0284c7',
    status: 'busy',
    services: ['Pendaftaran Peserta Baru JKN-KIS', 'Perubahan Data & Faskes Tingkat 1', 'Reaktivasi Kartu KIS PBI / Mandiri'],
    deskType: 'booth',
    isDisabilityFriendly: true,
    operatingHours: '08:00 - 15:30 WITA',
    wayfindingTips: 'Lingkar Atrium Sisi Tenggara (Selatan).'
  },
  {
    id: 'PERIKANAN',
    name: 'DINAS PERIKANAN',
    subName: 'Izin Usaha Tambak & Kapal Nelayan',
    category: 'counter',
    zone: 'Central Atrium',
    x: 665,
    y: 410,
    w: 85,
    h: 52,
    rx: 8,
    accent: '#0284c7',
    status: 'open',
    services: ['Rekomendasi BBM Subsidi Nelayan', 'Surat Tanda Bukti Pendaftaran Kapal (BKP)', 'Izin Budidaya Perikanan & Rumput Laut'],
    deskType: 'booth',
    operatingHours: '08:00 - 15:30 WITA',
    wayfindingTips: 'Lingkar Atrium Sisi Selatan Timur.'
  },
  {
    id: 'KOMINFO',
    name: 'DINAS KOMINFO',
    subName: 'Layanan SPBE & Sertifikat Elektronik',
    category: 'counter',
    zone: 'Central Atrium',
    x: 555,
    y: 415,
    w: 90,
    h: 52,
    rx: 8,
    accent: '#06b6d4',
    status: 'open',
    services: ['Penerbitan TTE (Tanda Tangan Elektronik)', 'Aduan Publik SP4N LAPOR!', 'Verifikasi Domain & Akses Internet Desa'],
    deskType: 'booth',
    operatingHours: '08:00 - 15:30 WITA',
    wayfindingTips: 'Lingkar Atrium Sisi Selatan Tengah (Menghadap Front Office).'
  },
  {
    id: 'PUPTR',
    name: 'DINAS PUPTR',
    subName: 'Tata Ruang, RDTR & Rekomtek Bangunan',
    category: 'counter',
    zone: 'Central Atrium',
    x: 450,
    y: 410,
    w: 85,
    h: 52,
    rx: 8,
    accent: '#eab308',
    status: 'open',
    services: ['Konsultasi PKKPR / KRK Tata Ruang', 'Rekomtek Persetujuan Bangunan Gedung (PBG)', 'Sertifikat Laik Fungsi (SLF) Gedung'],
    deskType: 'booth',
    operatingHours: '08:00 - 15:30 WITA',
    wayfindingTips: 'Lingkar Atrium Sisi Barat Daya (Selatan).'
  },
  {
    id: 'PDAM',
    name: 'PDAM TIRTA LUWU',
    subName: 'Sambungan Baru & Pembayaran Air',
    category: 'counter',
    zone: 'Central Atrium',
    x: 345,
    y: 395,
    w: 78,
    h: 50,
    rx: 8,
    accent: '#3b82f6',
    status: 'open',
    services: ['Pendaftaran Sambungan Rumah Baru', 'Pembayaran Rekening Tagihan Air Bersih', 'Pengaduan Kebocoran Pipa & Tera Meteran'],
    deskType: 'booth',
    operatingHours: '08:00 - 15:30 WITA',
    wayfindingTips: 'Lingkar Atrium Sisi Barat Daya.'
  },
  {
    id: 'TASPEN',
    name: 'PT TASPEN (PERSERO)',
    subName: 'Tabungan & Asuransi Pensiun ASN',
    category: 'counter',
    zone: 'Central Atrium',
    x: 320,
    y: 330,
    w: 78,
    h: 50,
    rx: 8,
    accent: '#8b5cf6',
    status: 'open',
    services: ['Klaim Hak Tabungan Hari Tua ASN', 'Otentikasi Pensiun Digital Melalui Smartphone', 'Klaim Jaminan Kematian & Kecelakaan Kerja'],
    deskType: 'booth',
    isDisabilityFriendly: true,
    operatingHours: '08:00 - 15:30 WITA',
    wayfindingTips: 'Lingkar Atrium Sisi Barat Bagian Bawah.'
  },
  {
    id: 'NERVIS',
    name: 'NERVIS & BPS',
    subName: 'Statistik & Pelayanan Tenaga Kerja',
    category: 'counter',
    zone: 'Central Atrium',
    x: 320,
    y: 265,
    w: 78,
    h: 50,
    rx: 8,
    accent: '#64748b',
    status: 'open',
    services: ['Permintaan Data Statistik Luwu', 'Konsultasi Metadata Sektoral', 'Pelayanan Terpadu BPS'],
    deskType: 'booth',
    operatingHours: '08:00 - 15:30 WITA',
    wayfindingTips: 'Lingkar Atrium Sisi Barat Bagian Tengah.'
  },
  {
    id: 'BPN',
    name: 'KANTOR PERTANAHAN (BPN)',
    subName: 'Peralihan Hak, Sertipikat & Roya',
    category: 'counter',
    zone: 'Central Atrium',
    x: 345,
    y: 200,
    w: 78,
    h: 50,
    rx: 8,
    accent: '#d97706',
    status: 'open',
    services: ['Pengecekan Sertipikat Hak Milik (SHM)', 'Pencoretan Hak Tanggungan (Roya Elektronik)', 'Surat Keterangan Pendaftaran Tanah (SKPT)'],
    deskType: 'booth',
    isDisabilityFriendly: true,
    operatingHours: '08:00 - 15:30 WITA',
    wayfindingTips: 'Lingkar Atrium Sisi Barat Laut.'
  },

  // ── 3. WEST WING (LEFT: DUKCAPIL & FASILITAS INKLUSIF) ──
  {
    id: 'DUKCAPIL_N',
    name: 'DUKCAPIL (CETAK)',
    subName: 'Loket Cetak Cepat KTP & KIA',
    category: 'counter',
    zone: 'West Wing (Sayap Barat)',
    x: 246,
    y: 25,
    w: 92,
    h: 82,
    rx: 8,
    accent: '#10b981',
    status: 'open',
    services: ['Pencetakan KTP-el Rusak / Hilang', 'Cetak Kartu Identitas Anak (KIA)', 'Aktivasi Identitas Kependudukan Digital (IKD)'],
    deskType: 'booth',
    isDisabilityFriendly: true,
    operatingHours: '07:30 - 16:00 WITA',
    wayfindingTips: 'Sayap Barat bagian utara, sejajar dengan toilet pria.'
  },
  {
    id: 'DUKCAPIL_W1',
    name: 'DUKCAPIL (KTP-EL)',
    subName: 'Perekaman Biometrik & Foto KTP',
    category: 'counter',
    zone: 'West Wing (Sayap Barat)',
    x: 35,
    y: 213,
    w: 105,
    h: 85,
    rx: 8,
    accent: '#10b981',
    status: 'open',
    services: ['Perekaman Sidik Jari & Iris Mata KTP Pemula', 'Pengambilan Foto Digital KTP', 'Pembaruan Data NIK Nasional'],
    deskType: 'booth',
    isDisabilityFriendly: true,
    operatingHours: '07:30 - 16:00 WITA',
    wayfindingTips: 'Sayap Barat luar, dekat toilet wanita.'
  },
  {
    id: 'DUKCAPIL_W2',
    name: 'DUKCAPIL (KK & PINDAH)',
    subName: 'Kartu Keluarga & Surat Mutasi',
    category: 'counter',
    zone: 'West Wing (Sayap Barat)',
    x: 148,
    y: 213,
    w: 105,
    h: 85,
    rx: 8,
    accent: '#10b981',
    status: 'open',
    services: ['Penerbitan Kartu Keluarga Barcode', 'Surat Keterangan Pindah WNI (SKPWNI)', 'Konsolidasi NIK Bermasalah / BPJS'],
    deskType: 'booth',
    isDisabilityFriendly: true,
    operatingHours: '07:30 - 16:00 WITA',
    wayfindingTips: 'Sayap Barat dalam, bersebelahan dengan DUKCAPIL W1.'
  },
  {
    id: 'DUKCAPIL_W3',
    name: 'DUKCAPIL (AKTA CAPIL)',
    subName: 'Akta Kelahiran, Kematian & Kawin',
    category: 'counter',
    zone: 'West Wing (Sayap Barat)',
    x: 148,
    y: 338,
    w: 105,
    h: 74,
    rx: 8,
    accent: '#10b981',
    status: 'open',
    services: ['Penerbitan Akta Kelahiran Anak Baru', 'Penerbitan Akta Kematian', 'Pencatatan Perkawinan Non-Muslim'],
    deskType: 'booth',
    isDisabilityFriendly: true,
    operatingHours: '07:30 - 16:00 WITA',
    wayfindingTips: 'Sayap Barat dalam, di atas Ruang Laktasi.'
  },
  {
    id: 'layanan_disabilitas',
    name: 'LAYANAN DISABILITAS',
    subName: 'Jalur Fast-Track & Ramah Inklusif',
    category: 'disability',
    zone: 'West Wing (Sayap Barat)',
    x: 35,
    y: 420,
    w: 105,
    h: 75,
    rx: 8,
    accent: '#06b6d4',
    status: 'open',
    services: ['Pendamping Khusus Bahasa Isyarat', 'Kiosk Layar Rendah (Tinggi Meja 75 cm)', 'Peminjaman Kursi Roda Elektrik / Manual', 'Prioritas Bebas Antrean Reguler'],
    deskType: 'counter',
    isDisabilityFriendly: true,
    operatingHours: '07:30 - 16:00 WITA',
    wayfindingTips: 'Sayap Barat, dekat pintu mushalla dan jalur kuning pemandu lantai.'
  },
  {
    id: 'ruang_perawatan',
    name: 'RUANG LAKTASI',
    subName: 'Pojok Laktasi & Ibu Menyusui',
    category: 'facility',
    zone: 'West Wing (Sayap Barat)',
    x: 148,
    y: 420,
    w: 105,
    h: 75,
    rx: 8,
    accent: '#ec4899',
    status: 'open',
    services: ['Bilik Privat Menyusui Higienis', 'Kulkas Penyimpan ASI & Sterilizer Botol', 'Sofa Ergonomis & Wastafel Hangat', 'Popok Bayi Darurat Gratis'],
    operatingHours: '07:30 - 16:00 WITA',
    wayfindingTips: 'Sayap Barat, tepat di sebelah Layanan Disabilitas.'
  },
  {
    id: 'toilet_wanita',
    name: 'TOILET WANITA',
    subName: 'Sanitasi & Toilet Difabel',
    category: 'facility',
    zone: 'West Wing (Sayap Barat)',
    x: 35,
    y: 120,
    w: 105,
    h: 85,
    rx: 8,
    accent: '#64748b',
    status: 'open',
    services: ['Kloset Duduk Ramah Disabilitas', 'Pegangan Handrail Pengaman', 'Wastafel Otomatis & Cermin'],
    isDisabilityFriendly: true,
    operatingHours: '07:00 - 17:00 WITA',
    wayfindingTips: 'Sayap Barat sudut barat laut.'
  },
  {
    id: 'ruang_istirahat',
    name: 'RUANG ISTIRAHAT',
    subName: 'Locker & Istirahat Petugas',
    category: 'facility',
    zone: 'West Wing (Sayap Barat)',
    x: 148,
    y: 120,
    w: 105,
    h: 85,
    rx: 8,
    accent: '#475569',
    status: 'open',
    services: ['Area Transit Petugas Front Office', 'Locker Pribadi Pegawai', 'Dispenser Air Minum'],
    operatingHours: '07:00 - 17:00 WITA',
    wayfindingTips: 'Sayap Barat bersebelahan dengan toilet wanita.'
  },
  {
    id: 'mushalla',
    name: 'MUSHALLA',
    subName: 'Sarana Ibadah Representatif',
    category: 'facility',
    zone: 'West Wing (Sayap Barat)',
    x: 148,
    y: 508,
    w: 95,
    h: 82,
    rx: 8,
    accent: '#10b981',
    status: 'open',
    services: ['Tempat Wudhu Pria & Wanita Terpisah', 'Mukena, Sarung & Sajadah Bersih', 'Ruang Sholat Berpenyejuk Udara (AC)'],
    isDisabilityFriendly: true,
    operatingHours: '07:00 - 18:00 WITA',
    wayfindingTips: 'Sayap Barat Daya, dekat Pojok Baca.'
  },
  {
    id: 'ruang_baca',
    name: 'POJOK BACA',
    subName: 'Perpustakaan & Literasi Digital',
    category: 'facility',
    zone: 'West Wing (Sayap Barat)',
    x: 251,
    y: 508,
    w: 95,
    h: 82,
    rx: 8,
    accent: '#06b6d4',
    status: 'open',
    services: ['Koleksi Buku Regulasi & Ensiklopedia', 'Akses Tablet E-Book Perpustakaan Daerah', 'Stasiun Pengisian Daya Gawai Gratis'],
    deskType: 'counter',
    operatingHours: '08:00 - 16:00 WITA',
    wayfindingTips: 'Sayap Barat Daya, dekat Lobby Tunggu Barat.'
  },
  {
    id: 'toilet_pria',
    name: 'TOILET PRIA',
    subName: 'Sanitasi & Urinoir',
    category: 'facility',
    zone: 'North Wing (Sayap Utara)',
    x: 148,
    y: 25,
    w: 92,
    h: 82,
    rx: 8,
    accent: '#64748b',
    status: 'open',
    services: ['Urinoir Otomatis', 'Kloset Duduk & Handrail Difabel', 'Wastafel Bersih'],
    isDisabilityFriendly: true,
    operatingHours: '07:00 - 17:00 WITA',
    wayfindingTips: 'Sayap Utara sudut barat laut.'
  },

  // ── 4. EAST WING (RIGHT: DPMPTSP, BISNIS & RAPAT) ──
  {
    id: 'DPMPTSP_N',
    name: 'DPMPTSP (OSS-RBA)',
    subName: 'Perizinan Berusaha & NIB Mandiri',
    category: 'counter',
    zone: 'East Wing (Sayap Timur)',
    x: 940,
    y: 190,
    w: 110,
    h: 95,
    rx: 8,
    accent: '#059669',
    status: 'open',
    services: ['Penerbitan Nomor Induk Berusaha (NIB OSS)', 'Persetujuan Kesesuaian Ruang (PKKPR Mandiri)', 'Bimbingan Perizinan Sektor Pertanian & UMKM'],
    deskType: 'booth',
    isDisabilityFriendly: true,
    operatingHours: '08:00 - 16:00 WITA',
    wayfindingTips: 'Sayap Timur bagian tengah, di samping Ruang Rapat.'
  },
  {
    id: 'DPMPTSP_S',
    name: 'DPMPTSP (INVESTASI)',
    subName: 'Katalog IPRO & Liaison Officer VIP',
    category: 'counter',
    zone: 'East Wing (Sayap Timur)',
    x: 940,
    y: 360,
    w: 110,
    h: 95,
    rx: 8,
    accent: '#059669',
    status: 'open',
    services: ['Konsultasi Investasi Korporasi / UMKM', 'Penyusunan Kemitraan Lokal & Insentif Pajak', 'Fasilitasi Kendala Usaha (Debottlenecking)'],
    deskType: 'booth',
    isDisabilityFriendly: true,
    operatingHours: '08:00 - 16:00 WITA',
    wayfindingTips: 'Sayap Timur bagian bawah, dekat Ruang Bermain Anak.'
  },
  {
    id: 'ruang_tim_teknis',
    name: 'RUANG TIM TEKNIS',
    subName: 'Verifikasi Lintas OPD & Sidang Teknis',
    category: 'facility',
    zone: 'East Wing (Sayap Timur)',
    x: 838,
    y: 25,
    w: 198,
    h: 82,
    rx: 8,
    accent: '#6366f1',
    status: 'open',
    services: ['10 Workstation Lintas OPD Bersama', 'Pemeriksaan Gambar Arsitektur PBG', 'Sidang Pertimbangan Dokumen Lingkungan (AMDAL/UKL-UPL)'],
    deskType: 'workstation',
    operatingHours: '08:00 - 16:00 WITA',
    wayfindingTips: 'Sayap Timur bagian utara atas.'
  },
  {
    id: 'ruang_rapat',
    name: 'RUANG RAPAT KOORDINASI',
    subName: 'Executive Boardroom VIP',
    category: 'facility',
    zone: 'East Wing (Sayap Timur)',
    x: 1058,
    y: 195,
    w: 98,
    h: 265,
    rx: 8,
    accent: '#6366f1',
    status: 'open',
    services: ['Ruang Sidang Koordinasi Investasi', 'Proyektor & Smart TV Video Conference', 'Kapasitas 25 Orang Tamu Dinas'],
    deskType: 'conference',
    operatingHours: 'Sesuai Jadwal Reservasi',
    wayfindingTips: 'Sayap Timur terluar, memanjang vertikal.'
  },
  {
    id: 'smoking_area',
    name: 'SMOKING AREA',
    subName: 'Area Terbuka / Balkon Khusus',
    category: 'facility',
    zone: 'East Wing (Sayap Timur)',
    x: 1042,
    y: 25,
    w: 115,
    h: 82,
    rx: 8,
    accent: '#64748b',
    status: 'open',
    services: ['Area Merokok Khusus Terbuka', 'Ventilasi Alami Sirkulasi Udara', 'Asbak Pemadam Puntung Rokok'],
    operatingHours: '07:00 - 17:00 WITA',
    wayfindingTips: 'Sayap Timur sudut timur laut luar.'
  },
  {
    id: 'ruang_bermain_anak',
    name: 'RUANG BERMAIN ANAK',
    subName: 'Kids Play Corner Edukatif',
    category: 'facility',
    zone: 'East Wing (Sayap Timur)',
    x: 853,
    y: 508,
    w: 190,
    h: 82,
    rx: 8,
    accent: '#f59e0b',
    status: 'open',
    services: ['Mainan Lunak Berstandar SNI', 'Lantai Matras Busa Aman Anti-Benturan', 'Pojok Gambar Mewarnai & Buku Dongeng'],
    operatingHours: '07:30 - 16:00 WITA',
    wayfindingTips: 'Sayap Timur bagian selatan, bersebelahan dengan Lobby Timur.'
  },
  {
    id: 'SAMSAT',
    name: 'SAMSAT WILAYAH LUWU',
    subName: 'Pajak Kendaraan Bermotor & STNK',
    category: 'counter',
    zone: 'North Wing (Sayap Utara)',
    x: 344,
    y: 25,
    w: 92,
    h: 82,
    rx: 8,
    accent: '#8b5cf6',
    status: 'busy',
    services: ['Pengesahan STNK 1 Tahunan', 'Pembayaran PKB & SWDKLLJ Kendaraan', 'Cek Blokir Kendaraan'],
    deskType: 'booth',
    operatingHours: '08:00 - 15:00 WITA',
    wayfindingTips: 'Sayap Utara sebelah DUKCAPIL Cetak.'
  },
  {
    id: 'NAKERTRANS',
    name: 'DISNAKERTRANS',
    subName: 'Kartu Kuning AK-1 & Transmigrasi',
    category: 'counter',
    zone: 'North Wing (Sayap Utara)',
    x: 442,
    y: 25,
    w: 92,
    h: 82,
    rx: 8,
    accent: '#06b6d4',
    status: 'open',
    services: ['Penerbitan Kartu Pencari Kerja AK-1', 'Informasi Lowongan Kerja Perusahaan Lokal', 'Pendaftaran Program Pelatihan Kerja BLK'],
    deskType: 'booth',
    operatingHours: '08:00 - 15:30 WITA',
    wayfindingTips: 'Sayap Utara sebelah SAMSAT.'
  },
  {
    id: 'BAPENDA',
    name: 'BAPENDA LUWU',
    subName: 'PBB-P2, BPHTB & Pajak Daerah',
    category: 'counter',
    zone: 'North Wing (Sayap Utara)',
    x: 540,
    y: 25,
    w: 92,
    h: 82,
    rx: 8,
    accent: '#f59e0b',
    status: 'open',
    services: ['Cetak SPPT PBB-P2 & Pemutakhiran Objek', 'Validasi Bea Perolehan Hak Tanah (BPHTB)', 'Surat Bebas Pajak Daerah'],
    deskType: 'booth',
    operatingHours: '08:00 - 15:30 WITA',
    wayfindingTips: 'Sayap Utara tengah.'
  },
  {
    id: 'DEKRANASDA',
    name: 'DEKRANASDA & UMKM',
    subName: 'Galeri Produk Unggulan Luwu',
    category: 'facility',
    zone: 'North Wing (Sayap Utara)',
    x: 638,
    y: 25,
    w: 92,
    h: 82,
    rx: 8,
    accent: '#ec4899',
    status: 'open',
    services: ['Showcase Produk Kopi & Cokelat Luwu', 'Kerajinan Tangan Tenun Tradisional', 'Konsultasi Sertifikasi & Kemasan Produk'],
    deskType: 'counter',
    operatingHours: '08:00 - 16:00 WITA',
    wayfindingTips: 'Sayap Utara tengah, bersebelahan dengan Bank Sulselbar.'
  },
  {
    id: 'SULSELBAR',
    name: 'BANK SULSELBAR',
    subName: 'Teller Kasda & Transaksi Perbankan',
    category: 'counter',
    zone: 'North Wing (Sayap Utara)',
    x: 736,
    y: 25,
    w: 96,
    h: 82,
    rx: 8,
    accent: '#3b82f6',
    status: 'open',
    services: ['Pembayaran Retribusi & Pajak Daerah', 'Layanan Teller Tunai & Non-Tunai', 'Pembukaan Rekening ASN & Umum'],
    deskType: 'teller',
    operatingHours: '08:00 - 15:00 WITA',
    wayfindingTips: 'Sayap Utara sebelah barat Ruang Tim Teknis.'
  },

  // ── 5. TRANSITION ZONES, LOBBIES & STAIR ACCESS ──
  {
    id: 'tangga_naik_w',
    name: 'TANGGA BARAT',
    subName: 'Akses Lantai 2 Sayap Barat',
    category: 'facility',
    zone: 'West Wing (Sayap Barat)',
    x: 35,
    y: 338,
    w: 105,
    h: 74,
    rx: 8,
    accent: '#475569',
    status: 'open',
    services: ['Akses Tangga Lantai 2', 'Handrail Stainless Steel', 'Step Nosing Anti-Slip'],
    isDisabilityFriendly: false,
    operatingHours: '07:00 - 17:00 WITA',
    wayfindingTips: 'Di bawah DUKCAPIL KTP-el.'
  },
  {
    id: 'tangga_naik_ne',
    name: 'TANGGA UTARA',
    subName: 'Akses Lantai 2 Sayap Utara',
    category: 'facility',
    zone: 'North Wing (Sayap Utara)',
    x: 1075,
    y: 115,
    w: 82,
    h: 65,
    rx: 6,
    accent: '#475569',
    status: 'open',
    services: ['Akses Tangga Lantai 2', 'Dekat Smoking Area', 'Penerangan Sensor Gerak'],
    isDisabilityFriendly: false,
    operatingHours: '07:00 - 17:00 WITA',
    wayfindingTips: 'Di samping Smoking Area.'
  },
  {
    id: 'tangga_naik_se',
    name: 'TANGGA TIMUR',
    subName: 'Akses Lantai 2 Sayap Timur',
    category: 'facility',
    zone: 'East Wing (Sayap Timur)',
    x: 1075,
    y: 470,
    w: 82,
    h: 65,
    rx: 6,
    accent: '#475569',
    status: 'open',
    services: ['Akses Tangga VIP', 'Handrail Pengaman', 'Akses Ruang Rapat'],
    isDisabilityFriendly: false,
    operatingHours: '07:00 - 17:00 WITA',
    wayfindingTips: 'Di bawah Ruang Rapat.'
  },
  {
    id: 'lobby_kiri',
    name: 'LOBBY BARAT',
    subName: 'Ruang Tunggu Pemohon Barat',
    category: 'facility',
    zone: 'West Wing (Sayap Barat)',
    x: 354,
    y: 520,
    w: 115,
    h: 70,
    rx: 8,
    accent: '#475569',
    status: 'open',
    services: ['Kursi Tunggu Pemohon Layanan', 'Display TV Informasi Antrean', 'Charging Station Gratis'],
    isDisabilityFriendly: true,
    operatingHours: '07:30 - 16:00 WITA',
    wayfindingTips: 'Di sebelah kiri E-KIOSK 1.'
  },
  {
    id: 'lobby_kanan',
    name: 'LOBBY TIMUR',
    subName: 'Ruang Tunggu Pemohon Timur',
    category: 'facility',
    zone: 'East Wing (Sayap Timur)',
    x: 730,
    y: 520,
    w: 115,
    h: 70,
    rx: 8,
    accent: '#475569',
    status: 'open',
    services: ['Kursi Tunggu Pemohon Layanan', 'Display TV Informasi Antrean', 'Charging Station Gratis'],
    isDisabilityFriendly: true,
    operatingHours: '07:30 - 16:00 WITA',
    wayfindingTips: 'Di sebelah kanan E-KIOSK 2.'
  }
];

export function InteractiveFloorPlan({ 
  isDark = false, 
  onOpenQueueBooking,
  className = '',
  selectedId,
  onSelectElement,
  floor = 1,
  onFloorChange
}: InteractiveFloorPlanProps) {
  // State management
  const [activeFilter, setActiveFilter] = useState<FloorCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<FloorNode | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [isWayfindingActive, setIsWayfindingActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Lock scroll when fullscreen mode is active
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // Sync external selectedId with internal selectedNode
  useEffect(() => {
    if (!selectedId) {
      return;
    }
    const cleanId = selectedId.trim().toLowerCase();
    const matched = FLOOR_NODES.find(n => 
      n.id.toLowerCase() === cleanId || 
      n.name.toLowerCase() === cleanId ||
      (n.subName && n.subName.toLowerCase().includes(cleanId)) ||
      (cleanId === 'dukcapil' && n.id.startsWith('DUKCAPIL')) ||
      (cleanId === 'dpmptsp' && n.id.startsWith('DPMPTSP')) ||
      (cleanId === 'bpjs' && n.id.startsWith('BPJS'))
    );
    if (matched) {
      setSelectedNode(matched);
      setIsWayfindingActive(true);
    }
  }, [selectedId]);

  // SVG Pan & Zoom reference
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter chips list
  const filterChips: { id: FloorCategory; label: string; icon: any }[] = [
    { id: 'all', label: 'Semua', icon: Layers },
    { id: 'counter', label: 'Loket Pelayanan', icon: Building2 },
    { id: 'facility', label: 'Fasilitas Publik', icon: Armchair },
    { id: 'disability', label: 'Ramah Disabilitas', icon: Accessibility }
  ];

  // Filtered nodes logic
  const filteredNodes = useMemo(() => {
    return FLOOR_NODES.filter(node => {
      // Category filter
      if (activeFilter === 'counter' && node.category !== 'counter') return false;
      if (activeFilter === 'facility' && node.category !== 'facility') return false;
      if (activeFilter === 'disability' && !node.isDisabilityFriendly) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = node.name.toLowerCase().includes(query);
        const matchSub = (node.subName || '').toLowerCase().includes(query);
        const matchZone = node.zone.toLowerCase().includes(query);
        const matchServices = node.services.some(s => s.toLowerCase().includes(query));
        return matchName || matchSub || matchZone || matchServices;
      }

      return true;
    });
  }, [activeFilter, searchQuery]);

  // Determine if a node matches the current filter (for dimming non-matching ones)
  const isNodeMatching = useCallback((node: FloorNode) => {
    if (activeFilter === 'counter') return node.category === 'counter';
    if (activeFilter === 'facility') return node.category === 'facility';
    if (activeFilter === 'disability') return !!node.isDisabilityFriendly;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        node.name.toLowerCase().includes(q) ||
        (node.subName || '').toLowerCase().includes(q) ||
        node.services.some(s => s.toLowerCase().includes(q))
      );
    }
    return true;
  }, [activeFilter, searchQuery]);

  // Zoom controls
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 2.2));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.7));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setSelectedNode(null);
    setIsWayfindingActive(false);
  };

  const handleSelectNode = (node: FloorNode) => {
    setSelectedNode(node);
    if (onSelectElement) {
      const isFacility = node.category === 'facility';
      const facilityInfo = FACILITY_DETAILS[node.id];
      const selectedItem: SelectedFloorItem = {
        id: node.id,
        code: node.id,
        name: isFacility && facilityInfo ? facilityInfo.name : node.name,
        subName: node.subName,
        type: isFacility ? 'facility' : 'tenant',
        category: node.category,
        zone: node.zone,
        status: node.status === 'open' ? 'open' : 'busy',
        services: isFacility && facilityInfo ? facilityInfo.amenities : node.services,
        description: isFacility && facilityInfo 
          ? facilityInfo.description 
          : `${node.name} - ${node.subName || ''}. Lokasi: ${node.zone}`,
        capacity: facilityInfo?.capacity,
        amenities: facilityInfo?.amenities,
        isAccessibleDisability: facilityInfo?.isAccessibleDisability ?? node.isDisabilityFriendly,
        facilityStatus: facilityInfo?.status ?? 'available',
        operatingHours: node.operatingHours,
        wayfindingTips: node.wayfindingTips,
        isDisabilityFriendly: node.isDisabilityFriendly
      };
      onSelectElement(selectedItem);
    }
  };

  return (
    <div className={isFullscreen 
      ? "fixed inset-0 z-[9999] bg-slate-950 text-slate-100 p-0 flex flex-col justify-center items-center overflow-hidden select-none"
      : `w-full rounded-3xl border transition-all duration-300 overflow-hidden shadow-sm flex flex-col ${
          isDark ? 'bg-slate-900/95 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-900'
        } ${className}`
    }>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 1. TOP BAR: TITLE, FILTER CHIPS, SEARCH & ZOOM CONTROLS           */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {!isFullscreen && (
        <div className={`p-4 sm:p-5 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
          isDark ? 'border-slate-800/80 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'
        }`}>
        
        {/* Left: Section Title & Live Badge */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60 mb-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Denah Interaktif Front Office</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight font-sans">
            Denah Ruangan & Loket Pelayanan
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Eksplorasi tata letak 32 gerai instansi terpadu, fasilitas publik, dan alur sirkulasi ramah disabilitas.
          </p>
        </div>

        {/* Right Action Cluster: Search bar, View toggle, Zoom Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Bar ('Cari gerai/fasilitas...') */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari gerai/fasilitas..."
              className={`w-full pl-9 pr-8 py-2 text-xs rounded-2xl border outline-none transition-all ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-600 shadow-2xs'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* View Toggle (Map vs List for mobile comfort) */}
          <div className="flex items-center p-1 rounded-2xl border bg-slate-100 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80">
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'map'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Peta Denah
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Daftar ({filteredNodes.length})
            </button>
          </div>

          {/* Zoom In / Out / Reset Controls */}
          <div className="hidden sm:flex items-center gap-1 p-1 rounded-2xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xs">
            <button
              type="button"
              onClick={handleZoomIn}
              title="Perbesar Denah"
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              title="Perkecil Denah"
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset Tampilan"
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Fullscreen Maximize Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
            title="Tampilkan Denah Layar Lebar (Landscape)"
          >
            <Maximize2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Ketuk Layar Lebar</span>
          </button>
        </div>
      </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 2. FILTER CHIPS (TOP BAR CATEGORIES)                              */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {!isFullscreen && (
        <div className={`px-4 sm:px-6 py-2.5 border-b flex items-center justify-between gap-3 overflow-x-auto no-scrollbar ${
          isDark ? 'border-slate-800/80 bg-slate-950/60' : 'border-slate-100 bg-slate-50/70'
        }`}>
          <div className="flex items-center gap-2">
            {filterChips.map(chip => {
              const Icon = chip.icon;
              const isSelected = activeFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setActiveFilter(chip.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>

          {/* Legend status markers */}
          <div className="hidden md:flex items-center gap-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Buka / Melayani</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Ramai</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span>Tutup</span>
            </span>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 3. INTERACTIVE SPATIAL CANVAS / SVG MAP VIEW                       */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {viewMode === 'map' ? (
        <div 
          ref={containerRef}
          className={isFullscreen
            ? "relative w-full h-full overflow-hidden flex flex-col items-center justify-center p-0 touch-pan-x touch-pan-y bg-slate-950"
            : "relative w-full overflow-hidden flex flex-col items-center justify-center p-2 sm:p-4 touch-pan-x touch-pan-y"
          }
          style={isFullscreen ? { height: '100dvh', width: '100vw' } : { minHeight: '620px', maxHeight: '780px' }}
        >
          <TransformWrapper
            disabled={!isFullscreen}
            minScale={0.8}
            maxScale={5}
            initialScale={1}
            limitToBounds={true}
            centerOnInit={true}
            doubleClick={{ disabled: false }}
            wheel={{ step: 0.1 }}
            panning={{ velocityDisabled: false }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                {/* Small floating Close button on top-right of the fullscreen map */}
                {isFullscreen && (
                  <div className="absolute top-4 right-4 z-50">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedNode(null);
                        setIsFullscreen(false);
                      }}
                      className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-900/90 dark:bg-slate-900/90 hover:bg-rose-600 text-slate-200 hover:text-white shadow-xl border border-slate-700 hover:border-rose-500 transition-all cursor-pointer active:scale-95"
                      title="Tutup Layar Lebar"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {/* Small floating Zoom controls on bottom-right of the fullscreen map */}
                {isFullscreen && (
                  <div className="absolute bottom-4 right-4 z-50 flex items-center gap-1 p-1 rounded-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-md select-none">
                    <button
                      type="button"
                      onClick={() => zoomIn(0.25)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-300 transition-colors cursor-pointer active:scale-90"
                      title="Perbesar"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => zoomOut(0.25)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-300 transition-colors cursor-pointer active:scale-90"
                      title="Perkecil"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => resetTransform()}
                      className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-300 transition-colors cursor-pointer active:scale-90"
                      title="Reset"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Floating Kiosk Quick-Access Overlay on Map Canvas */}
                {!isFullscreen && (
                  <div className="absolute top-4 right-4 z-30">
                    <button
                      type="button"
                      onClick={() => setIsFullscreen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-700 text-white text-xs font-bold shadow-lg hover:bg-emerald-600 hover:border-emerald-500 transition-all cursor-pointer active:scale-95 group"
                    >
                      <Maximize2 className="w-4 h-4 text-emerald-400 group-hover:text-white transition-colors" />
                      <span>Ketuk Layar Lebar (Landscape)</span>
                    </button>
                  </div>
                )}

                {/* Subtle Ambient Radial Grid Pattern */}
                <div 
                  className="absolute inset-0 pointer-events-none opacity-40"
                  style={{
                    backgroundImage: `radial-gradient(${isDark ? '#10b981' : '#94a3b8'} 1px, transparent 1px)`,
                    backgroundSize: '24px 24px'
                  }}
                />

                <TransformComponent
                  wrapperClass={isFullscreen ? "w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center" : "w-full h-full flex items-center justify-center"}
                  contentClass="w-full h-full flex items-center justify-center"
                  wrapperStyle={{ width: "100%", height: "100%" }}
                  contentStyle={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}
                >
                  {/* Interactive Transform Wrapper */}
                  <div 
                    className={isFullscreen 
                      ? "w-full h-full flex items-center justify-center" 
                      : "relative w-full h-full flex items-center justify-center transition-transform duration-300"
                    }
                    style={isFullscreen ? {} : { transform: `scale(${zoomLevel})` }}
                  >
                    <svg
                      viewBox="0 0 1200 800"
                      preserveAspectRatio="xMidYMid meet"
                      className={isFullscreen 
                        ? "w-full h-full max-h-screen object-contain block select-none drop-shadow-md"
                        : "w-full h-auto max-h-[640px] block select-none drop-shadow-md"
                      }
                    >
              <defs>
                {/* Glow Filter for Active / Hovered Nodes */}
                <filter id="mpp-active-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#10b981" floodOpacity="0.8" />
                </filter>
                <filter id="mpp-disability-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#06b6d4" floodOpacity="0.8" />
                </filter>
              </defs>

              {/* 1. Master Building Outline & Outer Wall Footprint */}
              <rect
                x="20"
                y="15"
                width="1160"
                height="590"
                rx="20"
                fill={isDark ? "#090e1a" : "#f8fafc"}
                stroke={isDark ? "#1e293b" : "#cbd5e1"}
                strokeWidth="3"
              />
              {/* Entrance Porch Protrusion */}
              <rect
                x="480"
                y="605"
                width="240"
                height="180"
                rx="14"
                fill={isDark ? "#090e1a" : "#f8fafc"}
                stroke={isDark ? "#1e293b" : "#cbd5e1"}
                strokeWidth="3"
              />
              <rect x="482" y="600" width="236" height="15" fill={isDark ? "#090e1a" : "#f8fafc"} />

              {/* Exterior Architectural Pillars (West & East) */}
              {[140, 270, 400, 530].map((y, idx) => (
                <g key={`ext-col-w-${idx}`} opacity="0.8">
                  <rect x="4" y={y - 7} width="13" height="13" rx="2" fill={isDark ? "#0f172a" : "#f1f5f9"} stroke={isDark ? "#475569" : "#64748b"} strokeWidth="1.2" />
                  <rect x="7" y={y - 4} width="7" height="7" fill="none" stroke="#06b6d4" strokeWidth="0.8" />
                </g>
              ))}
              {[140, 270, 400, 530].map((y, idx) => (
                <g key={`ext-col-e-${idx}`} opacity="0.8">
                  <rect x="1183" y={y - 7} width="13" height="13" rx="2" fill={isDark ? "#0f172a" : "#f1f5f9"} stroke={isDark ? "#475569" : "#64748b"} strokeWidth="1.2" />
                  <rect x="1186" y={y - 4} width="7" height="7" fill="none" stroke="#06b6d4" strokeWidth="0.8" />
                </g>
              ))}

              {/* Structural Building Columns */}
              {[
                { x: 25, y: 20 }, { x: 260, y: 20 }, { x: 600, y: 20 }, { x: 940, y: 20 }, { x: 1175, y: 20 },
                { x: 25, y: 310 }, { x: 1175, y: 310 },
                { x: 25, y: 600 }, { x: 475, y: 600 }, { x: 725, y: 600 }, { x: 1175, y: 600 },
                { x: 475, y: 780 }, { x: 725, y: 780 }
              ].map((col, idx) => (
                <g key={`bldg-col-${idx}`} opacity="0.55" pointerEvents="none">
                  <rect x={col.x - 5} y={col.y - 5} width="10" height="10" rx="1.5" fill={isDark ? "#1e293b" : "#e2e8f0"} stroke={isDark ? "#475569" : "#94a3b8"} strokeWidth="1" />
                </g>
              ))}

              {/* 2. Circulation Wayfinding & Entrance Flow */}
              {/* Main Pedestrian Entry Guide Line (Pintu Masuk -> Pos Jaga -> E-Kiosk -> Front Office) */}
              <path
                d="M 620 770 L 620 600 L 600 550 L 600 485"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray="5 4"
                strokeLinecap="round"
                className="animate-pulse"
                opacity="0.9"
              />

              {/* Yellow Braille / Blind Tactile Line from Pintu Masuk to Front Office */}
              <path
                d="M 600 765 L 600 550"
                stroke="#eab308"
                strokeWidth="3.5"
                strokeDasharray="4 4"
                strokeLinecap="round"
                opacity="0.9"
              />
              {/* Tactile line branching to West Wing & Atrium */}
              <path
                d="M 600 550 C 600 480, 180 480, 180 340"
                fill="none"
                stroke={isWayfindingActive ? "#10b981" : isDark ? "#334155" : "#cbd5e1"}
                strokeWidth={isWayfindingActive ? "3" : "2"}
                strokeDasharray="5 4"
                strokeLinecap="round"
                className={isWayfindingActive ? "animate-pulse" : ""}
              />
              <path
                d="M 600 550 C 600 480, 1020 480, 1020 340"
                fill="none"
                stroke={isWayfindingActive ? "#10b981" : isDark ? "#334155" : "#cbd5e1"}
                strokeWidth={isWayfindingActive ? "3" : "2"}
                strokeDasharray="5 4"
                strokeLinecap="round"
                className={isWayfindingActive ? "animate-pulse" : ""}
              />

              {/* Outer Smooth Contour Loop Around Wings */}
              <path
                d="M 280 200 C 400 130, 800 130, 920 200 C 990 250, 990 380, 920 425 C 800 495, 400 495, 280 425 C 210 380, 210 250, 280 200 Z"
                fill="none"
                stroke={isDark ? "#1e293b" : "#cbd5e1"}
                strokeWidth="24"
                strokeLinecap="round"
                opacity={isDark ? "0.3" : "0.45"}
                pointerEvents="none"
              />

              {/* 3. Central Atrium Oval Island Floor Base */}
              <ellipse
                cx="600"
                cy="305"
                rx="275"
                ry="165"
                fill={isDark ? "#0d1527" : "#edf2f7"}
                stroke={isDark ? "#1e293b" : "#cbd5e1"}
                strokeWidth="2"
                strokeDasharray="6 4"
              />

              {/* Dual Concentric Teardrop Motif & Atrium Label */}
              <g pointerEvents="none" opacity={isDark ? "0.85" : "0.9"}>
                {/* West Concentric Teardrop */}
                <path
                  d="M 585 305 C 530 260, 485 270, 485 305 C 485 340, 530 350, 585 305 Z"
                  fill={isDark ? "#0284c7" : "#38bdf8"}
                  fillOpacity="0.2"
                  stroke={isDark ? "#38bdf8" : "#0284c7"}
                  strokeWidth="1.2"
                />
                {/* East Concentric Teardrop */}
                <path
                  d="M 615 305 C 670 260, 715 270, 715 305 C 715 340, 670 350, 615 305 Z"
                  fill={isDark ? "#f59e0b" : "#fbbf24"}
                  fillOpacity="0.2"
                  stroke={isDark ? "#f59e0b" : "#d97706"}
                  strokeWidth="1.2"
                />
                {/* Central Emblem Text */}
                <text x="600" y="298" fill={isDark ? "#34d399" : "#059669"} fontSize="8.5" fontWeight="900" textAnchor="middle" letterSpacing="1.2">
                  ATRIUM SENTRAL
                </text>
                <text x="600" y="312" fill={isDark ? "#94a3b8" : "#475569"} fontSize="7" fontWeight="700" textAnchor="middle">
                  SIMPURUSIANG
                </text>
              </g>

              {/* Central Waiting Chairs Clusters in open atrium */}
              <g opacity={isDark ? "0.45" : "0.6"} pointerEvents="none">
                {[
                  { cx: 505, cy: 260 }, { cx: 525, cy: 260 }, { cx: 505, cy: 278 }, { cx: 525, cy: 278 },
                  { cx: 675, cy: 260 }, { cx: 695, cy: 260 }, { cx: 675, cy: 278 }, { cx: 695, cy: 278 },
                  { cx: 505, cy: 345 }, { cx: 525, cy: 345 }, { cx: 505, cy: 363 }, { cx: 525, cy: 363 },
                  { cx: 675, cy: 345 }, { cx: 695, cy: 345 }, { cx: 675, cy: 363 }, { cx: 695, cy: 363 }
                ].map((chair, i) => (
                  <circle key={`c-${i}`} cx={chair.cx} cy={chair.cy} r="4" fill="#64748b" />
                ))}
              </g>

              {/* 4. RENDER INTERACTIVE NODES (ROOMS, COUNTERS & FACILITIES) */}
              {FLOOR_NODES.map(node => {
                const isSelected = selectedNode?.id === node.id;
                const isHovered = hoveredNodeId === node.id;
                const isMatching = isNodeMatching(node);

                // Dim non-matching nodes
                const nodeOpacity = isMatching ? 1 : 0.22;

                // Color calculation
                let fill = isDark ? '#111827' : '#ffffff';
                let stroke = node.accent;
                let strokeW = 1.8;

                if (isSelected) {
                  fill = isDark ? '#1e293b' : '#ecfdf5';
                  stroke = '#10b981';
                  strokeW = 3;
                } else if (isHovered) {
                  fill = isDark ? '#1f293d' : '#f0fdf4';
                  strokeW = 2.4;
                }

                const centerX = node.x + node.w / 2;
                const centerY = node.y + node.h / 2;

                return (
                  <g
                    key={node.id}
                    id={node.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectNode(node)}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    opacity={nodeOpacity}
                    className="cursor-pointer transition-all duration-200 group"
                  >
                    {/* Node Card Box */}
                    <rect
                      x={node.x}
                      y={node.y}
                      width={node.w}
                      height={node.h}
                      rx={node.rx || 8}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={strokeW}
                      filter={isSelected ? 'url(#mpp-active-glow)' : undefined}
                      className="group-hover:filter group-hover:drop-shadow-md transition-all"
                    />

                    {/* CAD Micro Furniture Visual Cues */}
                    {/* A. 10 Workstations in Ruang Tim Teknis */}
                    {node.deskType === 'workstation' && (
                      <g opacity="0.65" pointerEvents="none">
                        <rect x={node.x + 10} y={node.y + 14} width={node.w - 20} height={12} rx="2" fill={isDark ? "#1e293b" : "#e2e8f0"} stroke="#475569" strokeWidth="0.8" />
                        <rect x={node.x + 10} y={node.y + 54} width={node.w - 20} height={12} rx="2" fill={isDark ? "#1e293b" : "#e2e8f0"} stroke="#475569" strokeWidth="0.8" />
                        {[0.12, 0.3, 0.5, 0.7, 0.88].map((r, i) => (
                          <React.Fragment key={i}>
                            <rect x={node.x + 10 + (node.w - 20) * r - 5} y={node.y + 16} width="10" height="3" rx="1" fill="#38bdf8" />
                            <circle cx={node.x + 10 + (node.w - 20) * r} cy={node.y + 8} r="2.5" fill="#64748b" />
                            <rect x={node.x + 10 + (node.w - 20) * r - 5} y={node.y + 59} width="10" height="3" rx="1" fill="#38bdf8" />
                            <circle cx={node.x + 10 + (node.w - 20) * r} cy={node.y + 72} r="2.5" fill="#64748b" />
                          </React.Fragment>
                        ))}
                      </g>
                    )}

                    {/* B. Long Boardroom Conference Table in Ruang Rapat */}
                    {node.deskType === 'conference' && (
                      <g opacity="0.7" pointerEvents="none">
                        <rect
                          x={node.x + 16}
                          y={node.y + 25}
                          width={node.w - 32}
                          height={node.h - 50}
                          rx="14"
                          fill={isDark ? "#1e293b" : "#e2e8f0"}
                          stroke={isDark ? "#475569" : "#94a3b8"}
                          strokeWidth="1.2"
                        />
                        {[0.18, 0.34, 0.5, 0.66, 0.82].map((ratio, idx) => (
                          <React.Fragment key={idx}>
                            <circle cx={node.x + 8} cy={node.y + (node.h - 50) * ratio + 25} r="3" fill="#64748b" />
                            <circle cx={node.x + node.w - 8} cy={node.y + (node.h - 50) * ratio + 25} r="3" fill="#64748b" />
                          </React.Fragment>
                        ))}
                        <circle cx={centerX} cy={node.y + 14} r="3" fill="#64748b" />
                        <circle cx={centerX} cy={node.y + node.h - 14} r="3" fill="#64748b" />
                      </g>
                    )}

                    {/* C. Service Booth Counter Curves */}
                    {node.deskType === 'booth' && (
                      <g opacity="0.55" pointerEvents="none">
                        <path
                          d={`M ${node.x + 8} ${node.y + node.h - 10} Q ${centerX} ${node.y + node.h - 18} ${node.x + node.w - 8} ${node.y + node.h - 10}`}
                          fill="none"
                          stroke={isDark ? "#475569" : "#94a3b8"}
                          strokeWidth="1.5"
                        />
                        <circle cx={centerX} cy={node.y + 12} r="2.5" fill="#64748b" />
                        <circle cx={centerX - 10} cy={node.y + node.h - 5} r="2" fill="#94a3b8" />
                        <circle cx={centerX + 10} cy={node.y + node.h - 5} r="2" fill="#94a3b8" />
                      </g>
                    )}

                    {/* D. Teller Partition in Bank */}
                    {node.deskType === 'teller' && (
                      <g opacity="0.6" pointerEvents="none">
                        <line x1={node.x + 8} y1={centerY + 6} x2={node.x + node.w - 8} y2={centerY + 6} stroke="#3b82f6" strokeWidth="1.2" strokeDasharray="3 3" />
                        <circle cx={centerX - 14} cy={centerY - 8} r="2.5" fill="#60a5fa" />
                        <circle cx={centerX + 14} cy={centerY - 8} r="2.5" fill="#60a5fa" />
                        <circle cx={centerX - 14} cy={centerY + 16} r="2" fill="#64748b" />
                        <circle cx={centerX + 14} cy={centerY + 16} r="2" fill="#64748b" />
                      </g>
                    )}

                    {/* E. Straight Counter */}
                    {node.deskType === 'counter' && (
                      <g opacity="0.6" pointerEvents="none">
                        <rect x={node.x + 12} y={centerY + 4} width={node.w - 24} height={5} rx="1.5" fill={isDark ? "#1e293b" : "#e2e8f0"} stroke="#475569" strokeWidth="0.8" />
                        <circle cx={centerX} cy={centerY - 8} r="2.5" fill="#94a3b8" />
                        <circle cx={centerX} cy={centerY + 16} r="2" fill="#64748b" />
                      </g>
                    )}

                    {/* Status Pip (Top Right) */}
                    <circle
                      cx={node.x + node.w - 9}
                      cy={node.y + 9}
                      r="3.5"
                      fill={node.status === 'open' ? '#10b981' : node.status === 'busy' ? '#f59e0b' : '#94a3b8'}
                    />

                    {/* Disability Badge Icon if friendly */}
                    {node.isDisabilityFriendly && (
                      <circle
                        cx={node.x + 9}
                        cy={node.y + 9}
                        r="3.5"
                        fill="#06b6d4"
                      />
                    )}

                    {/* Node Text: Primary Label */}
                    <text
                      x={centerX}
                      y={node.subName ? centerY - 2 : centerY + 3}
                      fill={isDark ? '#f8fafc' : '#0f172a'}
                      fontSize={node.w < 70 ? '6.5' : node.w < 90 ? '7.5' : '8.5'}
                      fontWeight="800"
                      textAnchor="middle"
                      className="select-none pointer-events-none font-sans"
                    >
                      {node.name}
                    </text>

                    {/* Node Text: Sub-label */}
                    {node.subName && (
                      <text
                        x={centerX}
                        y={centerY + 9}
                        fill={isDark ? '#94a3b8' : '#64748b'}
                        fontSize={node.w < 70 ? '5.5' : '6.5'}
                        fontWeight="600"
                        textAnchor="middle"
                        className="select-none pointer-events-none font-sans"
                      >
                        {node.subName.length > 20 ? `${node.subName.slice(0, 18)}...` : node.subName}
                      </text>
                    )}
                  </g>
                );
              })}
                    </svg>
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>

          {/* Floating Instructions Pill */}
          {!isFullscreen && (
            <div className="absolute bottom-3 left-4 pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-md backdrop-blur-md">
                <Compass className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                <span>Ketuk ruangan / loket untuk detail layanan & antrean</span>
              </span>
            </div>
          )}
        </div>
      ) : (
        /* ───────────────────────────────────────────────────────────────── */
        /* 3B. ALTERNATIVE RESPONSIVE LIST VIEW (OPTIMIZED FOR MOBILE / SEARCH) */
        /* ───────────────────────────────────────────────────────────────── */
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[600px] overflow-y-auto">
          {filteredNodes.map(node => (
            <div
              key={node.id}
              onClick={() => handleSelectNode(node)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer hover:border-emerald-500/50 hover:shadow-md flex flex-col justify-between ${
                isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200/80 shadow-2xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {node.zone}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    node.status === 'open' 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{node.status === 'open' ? 'Buka' : 'Ramai'}</span>
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                  {node.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {node.subName}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {node.services.length} Layanan
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span>Lihat Detail</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 4. FLOATING DETAIL CARD / MODAL POPOVER                             */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedNode && (() => {
          const isFacility = selectedNode.category === 'facility';
          const facilityInfo = FACILITY_DETAILS[selectedNode.id];
          const displayName = isFacility && facilityInfo ? facilityInfo.name : selectedNode.name;
          const displayDesc = isFacility && facilityInfo ? facilityInfo.description : selectedNode.subName;
          const displayAmenities = isFacility && facilityInfo ? facilityInfo.amenities : selectedNode.services;
          const isAccessible = (isFacility && facilityInfo ? facilityInfo.isAccessibleDisability : selectedNode.isDisabilityFriendly);

          return (
            <div className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.96 }}
                transition={{ duration: 0.22 }}
                className={`w-full max-w-3xl mx-auto p-4 sm:p-6 rounded-2xl border shadow-2xl overflow-hidden relative flex flex-col justify-between max-h-[90vh] overflow-y-auto ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                {/* Card Header with Distinct Type Badges */}
                <div className="flex items-start justify-between gap-3 border-b pb-3.5 border-slate-100 dark:border-slate-800">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      {/* Element Type Badge */}
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        isFacility
                          ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {isFacility ? 'Fasilitas Publik' : 'Gerai Pelayanan'}
                      </span>

                      {/* Zone Badge */}
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {selectedNode.zone}
                      </span>

                      {/* Accessibility Badge */}
                      {isAccessible && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                          <Accessibility className="w-3 h-3 text-cyan-500" />
                          <span>Ramah Disabilitas</span>
                        </span>
                      )}

                      {/* Capacity Badge for Facilities */}
                      {isFacility && facilityInfo?.capacity && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          <Users className="w-3 h-3 text-indigo-400" />
                          <span>{facilityInfo.capacity}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg sm:text-xl font-black tracking-tight leading-tight">
                      {displayName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {displayDesc}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedNode(null)}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition-colors shrink-0"
                    aria-label="Tutup detail"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Card Body: Conditional Separation */}
                <div className="py-4 space-y-4">
                  {/* Status Bar */}
                  <div className="flex flex-wrap items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className={`w-4 h-4 ${isFacility ? 'text-teal-500' : 'text-emerald-500'}`} />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {selectedNode.operatingHours || (isFacility ? '07:30 - 16:00 WITA' : '08:00 - 15:30 WITA')}
                      </span>
                    </div>

                    {isFacility ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                        <span className="w-2 h-2 rounded-full bg-teal-500" />
                        <span>Tersedia / Siap Digunakan</span>
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                          Estimasi: <strong className="text-slate-700 dark:text-slate-200">± 5-10 Menit</strong>
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                          selectedNode.status === 'open'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        }`}>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>{selectedNode.status === 'open' ? 'Normal / Buka' : 'Ramai'}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Section A: IF FACILITY -> Show Amenities & Equipment */}
                  {isFacility ? (
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                        <span>Kelengkapan & Sarana Fasilitas</span>
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {displayAmenities.map((amenity, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-750 text-xs font-medium text-slate-700 dark:text-slate-200"
                          >
                            <CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0 mt-0.5" />
                            <span className="leading-snug">{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Section B: IF TENANT -> Show List of Official Services */
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Daftar Layanan Dokumen & Perizinan</span>
                      </h5>
                      <div className="space-y-1.5">
                        {selectedNode.services.map((srv, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{srv}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Wayfinding tip */}
                  {selectedNode.wayfindingTips && (
                    <div className={`p-3 rounded-2xl border text-xs flex items-start gap-2 ${
                      isFacility
                        ? 'bg-teal-50/50 dark:bg-teal-950/30 border-teal-200/60 dark:border-teal-800/60'
                        : 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/60'
                    }`}>
                      <Navigation className={`w-4 h-4 shrink-0 mt-0.5 ${isFacility ? 'text-teal-600 dark:text-teal-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                      <div className="text-slate-600 dark:text-slate-300">
                        <strong className={isFacility ? 'text-teal-700 dark:text-teal-300' : 'text-emerald-700 dark:text-emerald-300'}>
                          Panduan Arah: 
                        </strong>{' '}
                        {selectedNode.wayfindingTips}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer: Conditional Action Buttons */}
                <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsWayfindingActive(prev => !prev)}
                    className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Navigation className={`w-3.5 h-3.5 ${isFacility ? 'text-teal-500' : 'text-emerald-500'}`} />
                    <span>{isWayfindingActive ? 'Sembunyikan Jalur' : 'Petunjuk Arah'}</span>
                  </button>

                  {isFacility ? (
                    /* IF FACILITY: Single Close / Acknowledged Action (NO QUEUE BUTTON) */
                    <button
                      type="button"
                      onClick={() => setSelectedNode(null)}
                      className="px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Tutup Informasi</span>
                    </button>
                  ) : (
                    /* IF TENANT: Prominent "Ambil Antrean" Button */
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedNode(null);
                        onOpenQueueBooking?.(selectedNode.name);
                      }}
                      className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>Ambil Antrean Online</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}

export const MppFloorPlan = InteractiveFloorPlan;
export default InteractiveFloorPlan;
