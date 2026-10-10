import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
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
  ShieldCheck,
  ShieldAlert,
  Siren,
  AlertTriangle,
  Flame,
  Footprints
} from 'lucide-react';
import FloatingFloorPlanLegend, { 
  MppSectorFilter, 
  isNodeInSector, 
  SECTOR_ACCENT_COLORS 
} from './FloatingFloorPlanLegend';

export type FloorCategory = 'all' | 'counter' | 'facility' | 'disability';

// ── TIPE & HELPER STATUS ANTREAN LOKET (FIX 1B) ──
export type QueueStatus = 'buka' | 'ramai' | 'tutup' | 'unknown';

export function getStatusConfig(status: QueueStatus) {
  switch (status) {
    case 'buka':   return { dot: 'bg-emerald-400', label: 'Buka',  ring: 'ring-emerald-400/20' };
    case 'ramai':  return { dot: 'bg-amber-400',   label: 'Ramai', ring: 'ring-amber-400/20'   };
    case 'tutup':  return { dot: 'bg-red-400',     label: 'Tutup', ring: 'ring-red-400/20'     };
    default:       return { dot: 'bg-slate-400',   label: '—',     ring: 'ring-slate-400/10'   };
  }
}

export const StatusPill = ({ status }: { status: QueueStatus }) => {
  const cfg = getStatusConfig(status);
  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-1
      rounded-full text-[11px] font-medium border
      ${status === 'buka'
        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
        : status === 'ramai'
          ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
          : 'bg-red-500/15 text-red-400 border-red-500/25'
      }
    `}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot}
                        ${status === 'buka' ? 'animate-pulse' : ''}`} />
      {cfg.label}
    </span>
  );
};

// ── ZONA WARNA BACKGROUND DENAH (FIX 1A) ──
export interface FloorZone {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rx: number;
  style: {
    fill: string;
    stroke: string;
    strokeWidth: number;
    strokeDasharray?: string;
  };
  labelColor: string;
  labelX: number;
  labelY: number;
}

export const FLOOR_ZONES: FloorZone[] = [
  {
    id: 'zona-loket-utama',
    label: 'Area Loket Utama',
    x: 425,
    y: 195,
    w: 420,
    h: 330,
    rx: 24,
    style: {
      fill: 'rgba(16, 185, 129, 0.04)',
      stroke: 'rgba(16, 185, 129, 0.16)',
      strokeWidth: 1.5,
      strokeDasharray: '6 4'
    },
    labelColor: 'rgba(16, 185, 129, 0.45)',
    labelX: 442,
    labelY: 215
  },
  {
    id: 'zona-fasilitas-publik-west',
    label: 'Fasilitas Publik & Inklusi',
    x: 30,
    y: 35,
    w: 390,
    h: 635,
    rx: 16,
    style: {
      fill: 'rgba(59, 130, 246, 0.04)',
      stroke: 'rgba(59, 130, 246, 0.12)',
      strokeWidth: 1.5,
      strokeDasharray: '6 4'
    },
    labelColor: 'rgba(59, 130, 246, 0.4)',
    labelX: 45,
    labelY: 55
  },
  {
    id: 'zona-fasilitas-publik-east',
    label: 'Fasilitas Layanan Terpadu',
    x: 850,
    y: 35,
    w: 380,
    h: 635,
    rx: 16,
    style: {
      fill: 'rgba(59, 130, 246, 0.04)',
      stroke: 'rgba(59, 130, 246, 0.12)',
      strokeWidth: 1.5,
      strokeDasharray: '6 4'
    },
    labelColor: 'rgba(59, 130, 246, 0.4)',
    labelX: 865,
    labelY: 55
  },
  {
    id: 'zona-lobby',
    label: 'Lobby & Area Tunggu',
    x: 360,
    y: 535,
    w: 550,
    h: 325,
    rx: 20,
    style: {
      fill: 'rgba(245, 158, 11, 0.04)',
      stroke: 'rgba(245, 158, 11, 0.12)',
      strokeWidth: 1.5,
      strokeDasharray: '6 4'
    },
    labelColor: 'rgba(245, 158, 11, 0.45)',
    labelX: 375,
    labelY: 555
  }
];

export interface FloorNode {
  id: string;
  name: string;
  subName?: string;
  category: 'counter' | 'facility' | 'disability';
  zone: 'West Wing (Sayap Barat)' | 'East Wing (Sayap Timur)' | 'Central Atrium' | 'Entrance Flow (Selasar Masuk)' | 'North Wing (Sayap Utara)' | 'South Wing (Sayap Selatan)';
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
    x: 605,
    y: 775,
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
    x: 530,
    y: 760,
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
    x: 535,
    y: 625,
    w: 65,
    h: 44,
    rx: 8,
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
    x: 670,
    y: 625,
    w: 65,
    h: 44,
    rx: 8,
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
    x: 545,
    y: 535,
    w: 180,
    h: 54,
    rx: 12,
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
    x: 485,
    y: 210,
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
    x: 590,
    y: 205,
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
    x: 700,
    y: 210,
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
    x: 810,
    y: 255,
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
    x: 835,
    y: 320,
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
    x: 835,
    y: 385,
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
    x: 810,
    y: 450,
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
    x: 700,
    y: 465,
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
    x: 590,
    y: 470,
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
    x: 485,
    y: 465,
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
    x: 380,
    y: 450,
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
    x: 355,
    y: 385,
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
    x: 355,
    y: 320,
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
    x: 380,
    y: 255,
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
    x: 281,
    y: 80,
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
    x: 70,
    y: 268,
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
    x: 183,
    y: 268,
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
    x: 183,
    y: 393,
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
    x: 70,
    y: 475,
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
    x: 183,
    y: 475,
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
    x: 70,
    y: 175,
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
    x: 183,
    y: 175,
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
    x: 183,
    y: 563,
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
    x: 286,
    y: 563,
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
    x: 183,
    y: 80,
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
    x: 975,
    y: 245,
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
    x: 975,
    y: 415,
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
    x: 873,
    y: 80,
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
    x: 1093,
    y: 250,
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
    x: 1077,
    y: 80,
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
    x: 888,
    y: 563,
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
    x: 379,
    y: 80,
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
    x: 477,
    y: 80,
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
    x: 575,
    y: 80,
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
    x: 673,
    y: 80,
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
    x: 771,
    y: 80,
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
    name: 'TANGGA UTARA',
    subName: 'Akses Lantai 2 Sayap Utara',
    category: 'facility',
    zone: 'North Wing (Sayap Utara)',
    x: 70,
    y: 393,
    w: 105,
    h: 74,
    rx: 8,
    accent: '#475569',
    status: 'open',
    services: ['Akses Tangga Lantai 2', 'Handrail Stainless Steel', 'Step Nosing Anti-Slip'],
    isDisabilityFriendly: false,
    operatingHours: '07:00 - 17:00 WITA',
    wayfindingTips: 'Di bawah DUKCAPIL KTP-el (Sayap Utara).'
  },
  {
    id: 'tangga_naik_ne',
    name: 'TANGGA SELATAN',
    subName: 'Akses Lantai 2 Sayap Selatan',
    category: 'facility',
    zone: 'South Wing (Sayap Selatan)',
    x: 1110,
    y: 170,
    w: 82,
    h: 65,
    rx: 6,
    accent: '#475569',
    status: 'open',
    services: ['Akses Tangga Lantai 2', 'Dekat Smoking Area', 'Penerangan Sensor Gerak'],
    isDisabilityFriendly: false,
    operatingHours: '07:00 - 17:00 WITA',
    wayfindingTips: 'Di samping Smoking Area (Sayap Selatan).'
  },
  {
    id: 'tangga_naik_se',
    name: 'TANGGA SELATAN',
    subName: 'Akses Lantai 2 Sayap Selatan',
    category: 'facility',
    zone: 'South Wing (Sayap Selatan)',
    x: 1110,
    y: 525,
    w: 82,
    h: 65,
    rx: 6,
    accent: '#475569',
    status: 'open',
    services: ['Akses Tangga VIP', 'Handrail Pengaman', 'Akses Ruang Rapat'],
    isDisabilityFriendly: false,
    operatingHours: '07:00 - 17:00 WITA',
    wayfindingTips: 'Di bawah Ruang Rapat (Sayap Selatan).'
  },
  {
    id: 'lobby_kiri',
    name: 'LOBBY UTARA',
    subName: 'Ruang Tunggu Pemohon Utara',
    category: 'facility',
    zone: 'North Wing (Sayap Utara)',
    x: 375,
    y: 565,
    w: 120,
    h: 65,
    rx: 10,
    accent: '#475569',
    status: 'open',
    services: ['Kursi Tunggu Pemohon Layanan', 'Display TV Informasi Antrean', 'Charging Station Gratis'],
    isDisabilityFriendly: true,
    operatingHours: '07:30 - 16:00 WITA',
    wayfindingTips: 'Di sebelah kiri E-KIOSK 1 (Sayap Utara).'
  },
  {
    id: 'lobby_kanan',
    name: 'LOBBY SELATAN',
    subName: 'Ruang Tunggu Pemohon Selatan',
    category: 'facility',
    zone: 'South Wing (Sayap Selatan)',
    x: 775,
    y: 565,
    w: 120,
    h: 65,
    rx: 10,
    accent: '#475569',
    status: 'open',
    services: ['Kursi Tunggu Pemohon Layanan', 'Display TV Informasi Antrean', 'Charging Station Gratis'],
    isDisabilityFriendly: true,
    operatingHours: '07:30 - 16:00 WITA',
    wayfindingTips: 'Di sebelah kanan E-KIOSK 2 (Sayap Selatan).'
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
  const { t } = useTranslation();
  // State management
  const [activeFilter, setActiveFilter] = useState<FloorCategory>('all');
  const [activeSector, setActiveSector] = useState<MppSectorFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<FloorNode | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'map' | 'list'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return 'list';
    }
    return 'map';
  });
  const [isWayfindingActive, setIsWayfindingActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);

  // Fullscreen Pan & Pinch Gesture States (Custom ultra-smooth 0-dependency implementation)
  const [fullscreenScale, setFullscreenScale] = useState(1);
  const [fullscreenPosition, setFullscreenPosition] = useState({ x: 0, y: 0 });

  const isDraggingRef = useRef(false);
  const startPanRef = useRef({ x: 0, y: 0 });
  const lastTouchDistanceRef = useRef<number | null>(null);

  // Sync zoom states when isFullscreen changes
  useEffect(() => {
    setFullscreenScale(1);
    setFullscreenPosition({ x: 0, y: 0 });
  }, [isFullscreen]);

  const handleFullscreenMouseDown = (e: React.MouseEvent) => {
    if (!isFullscreen) return;
    e.preventDefault();
    isDraggingRef.current = true;
    startPanRef.current = {
      x: e.clientX - fullscreenPosition.x,
      y: e.clientY - fullscreenPosition.y
    };
  };

  const handleFullscreenMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !isFullscreen) return;
    const newX = e.clientX - startPanRef.current.x;
    const newY = e.clientY - startPanRef.current.y;
    
    // Limits / Boundaries relative to scale
    const limitX = Math.max(0, 800 * (fullscreenScale - 1));
    const limitY = Math.max(0, 500 * (fullscreenScale - 1));
    const clampedX = Math.max(-limitX, Math.min(limitX, newX));
    const clampedY = Math.max(-limitY, Math.min(limitY, newY));

    setFullscreenPosition({ x: clampedX, y: clampedY });
  };

  const handleFullscreenMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  const handleFullscreenTouchStart = (e: React.TouchEvent) => {
    if (!isFullscreen) return;

    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      const touch = e.touches[0];
      startPanRef.current = {
        x: touch.clientX - fullscreenPosition.x,
        y: touch.clientY - fullscreenPosition.y
      };
      lastTouchDistanceRef.current = null;
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false; // Disable dragging when pinching
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      lastTouchDistanceRef.current = distance;
    }
  };

  const handleFullscreenTouchMove = (e: React.TouchEvent) => {
    if (!isFullscreen) return;

    if (e.touches.length === 1 && isDraggingRef.current) {
      const touch = e.touches[0];
      const newX = touch.clientX - startPanRef.current.x;
      const newY = touch.clientY - startPanRef.current.y;

      const limitX = Math.max(0, 800 * (fullscreenScale - 1));
      const limitY = Math.max(0, 500 * (fullscreenScale - 1));
      const clampedX = Math.max(-limitX, Math.min(limitX, newX));
      const clampedY = Math.max(-limitY, Math.min(limitY, newY));

      setFullscreenPosition({ x: clampedX, y: clampedY });
    } else if (e.touches.length === 2 && lastTouchDistanceRef.current !== null) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      
      const factor = distance / lastTouchDistanceRef.current;
      setFullscreenScale(prev => {
        const nextScale = Math.max(0.8, Math.min(5, prev * factor));
        return nextScale;
      });
      lastTouchDistanceRef.current = distance;
    }
  };

  const handleFullscreenTouchEnd = () => {
    isDraggingRef.current = false;
    lastTouchDistanceRef.current = null;
  };

  const handleFullscreenWheel = (e: React.WheelEvent) => {
    if (!isFullscreen) return;
    const zoomFactor = 0.12;
    const direction = e.deltaY < 0 ? 1 : -1;
    setFullscreenScale(prev => {
      const nextScale = Math.max(0.8, Math.min(5, prev + direction * zoomFactor));
      return nextScale;
    });
  };

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

  // Keyboard Presentation Shortcuts ('F' to toggle theater mode, 'Esc' to exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputActive = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        activeElement.tagName === 'SELECT' ||
        (activeElement as HTMLElement).isContentEditable
      );

      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
          setSelectedNode(null);
        }
      } else if ((e.key === 'f' || e.key === 'F') && !isInputActive && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsFullscreen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
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
      setIsDetailModalOpen(true);
    }
  }, [selectedId]);

  // SVG Pan & Zoom reference
  const containerRef = useRef<HTMLDivElement>(null);

  // Active selected booth ID (for Spotlight & Dimming Focus Mode)
  const selectedBoothId = selectedNode?.id || selectedId || null;

  // Animated Wayfinding Route Generator (Pintu Masuk -> Atrium Sentral -> Selected Booth)
  const wayfindingRoute = useMemo(() => {
    if (!selectedNode) return null;
    const targetX = selectedNode.x + selectedNode.w / 2;
    const targetY = selectedNode.y + selectedNode.h / 2;
    const entranceX = 635;
    const entranceY = 795;

    // Case 1: Entrance Selasar Nodes
    if (selectedNode.zone === 'Entrance Flow (Selasar Masuk)' || selectedNode.y >= 595) {
      if (selectedNode.id === 'gerbang_masuk' || selectedNode.id === 'pos_keamanan') {
        return {
          path: `M ${entranceX} ${entranceY} L ${targetX} ${targetY}`,
          targetX,
          targetY,
          hasAtriumHub: false
        };
      }
      return {
        path: `M ${entranceX} ${entranceY} L 635 675 L ${targetX} ${targetY}`,
        targetX,
        targetY,
        hasAtriumHub: false
      };
    }

    // Case 2: Deep Building Nodes
    // Continuous flowing spine: Pintu Masuk -> Entrance Selasar -> Front Office -> Atrium Sentral Hub
    const mainSpine = `M ${entranceX} ${entranceY} L 635 655 L 635 575 C 635 495, 635 395, 635 360`;

    let connectionPath = '';
    if (targetX <= 475) {
      // West Wing corridor
      if (targetY < 285) {
        connectionPath = ` C 535 360, 415 360, 395 360 C 355 360, ${targetX} 295, ${targetX} ${targetY}`;
      } else if (targetY > 435) {
        connectionPath = ` C 535 360, 415 360, 395 360 C 355 360, ${targetX} 415, ${targetX} ${targetY}`;
      } else {
        connectionPath = ` C 535 360, 455 360, 395 360 C 355 360, ${targetX + 25} ${targetY}, ${targetX} ${targetY}`;
      }
    } else if (targetX >= 795) {
      // East Wing corridor
      if (targetY < 285) {
        connectionPath = ` C 735 360, 855 360, 875 360 C 915 360, ${targetX} 295, ${targetX} ${targetY}`;
      } else if (targetY > 435) {
        connectionPath = ` C 735 360, 855 360, 875 360 C 915 360, ${targetX} 415, ${targetX} ${targetY}`;
      } else {
        connectionPath = ` C 735 360, 815 360, 875 360 C 915 360, ${targetX - 25} ${targetY}, ${targetX} ${targetY}`;
      }
    } else if (targetY < 315) {
      // North Wing Central
      connectionPath = ` C 635 295, ${targetX} 265, ${targetX} ${targetY}`;
    } else {
      // Central Atrium vicinity
      connectionPath = ` C 635 375, ${targetX} 370, ${targetX} ${targetY}`;
    }

    return {
      path: `${mainSpine}${connectionPath}`,
      targetX,
      targetY,
      hasAtriumHub: true
    };
  }, [selectedNode]);

  // Sort nodes so the selected booth renders on the top visual z-layer (SVG painter's rule)
  const sortedFloorNodes = useMemo(() => {
    if (!selectedBoothId) return FLOOR_NODES;
    return [...FLOOR_NODES].sort((a, b) => {
      if (a.id === selectedBoothId) return 1;
      if (b.id === selectedBoothId) return -1;
      return 0;
    });
  }, [selectedBoothId]);

  // Filter chips list
  const filterChips: { id: FloorCategory; label: string; icon: any }[] = [
    { id: 'all', label: 'Semua', icon: Layers },
    { id: 'counter', label: 'Loket Pelayanan', icon: Building2 },
    { id: 'facility', label: 'Fasilitas Publik', icon: Armchair },
    { id: 'disability', label: 'Ramah Disabilitas', icon: Accessibility }
  ];

  // Active filter flag
  const isAnyFilterActive = activeFilter !== 'all' || activeSector !== 'all' || searchQuery.trim().length > 0;

  // Filtered nodes logic
  const filteredNodes = useMemo(() => {
    return FLOOR_NODES.filter(node => {
      // Search query filter has highest precedence if typed
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = node.name.toLowerCase().includes(query);
        const matchSub = (node.subName || '').toLowerCase().includes(query);
        const matchZone = node.zone.toLowerCase().includes(query);
        const matchServices = node.services.some(s => s.toLowerCase().includes(query));
        if (!matchName && !matchSub && !matchZone && !matchServices) return false;
      }

      // Sector filter
      if (activeSector !== 'all') {
        return isNodeInSector(node.id, node.name, node.category, activeSector);
      }

      // Category filter
      if (activeFilter === 'counter') return node.category === 'counter';
      if (activeFilter === 'facility') return node.category === 'facility';
      if (activeFilter === 'disability') return !!node.isDisabilityFriendly;

      return true;
    });
  }, [activeSector, activeFilter, searchQuery]);

  // Determine if a node matches the current filter (for high-contrast highlight & dimming)
  const isNodeMatching = useCallback((node: FloorNode) => {
    if (!isAnyFilterActive) return true;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSearch = (
        node.name.toLowerCase().includes(q) ||
        (node.subName || '').toLowerCase().includes(q) ||
        node.services.some(s => s.toLowerCase().includes(q)) ||
        node.zone.toLowerCase().includes(q)
      );
      if (!matchSearch) return false;
    }

    // Sector filter
    if (activeSector !== 'all') {
      return isNodeInSector(node.id, node.name, node.category, activeSector);
    }

    // Category filter
    if (activeFilter === 'counter') return node.category === 'counter';
    if (activeFilter === 'facility') return node.category === 'facility';
    if (activeFilter === 'disability') return !!node.isDisabilityFriendly;

    return true;
  }, [isAnyFilterActive, activeSector, activeFilter, searchQuery]);

  // Top Filter Click Handler with Synchronized Sector Reset/Binding
  const handleTopFilterClick = (filterId: FloorCategory) => {
    setActiveFilter(filterId);
    if (filterId === 'all') {
      setActiveSector('all');
      setSearchQuery('');
      setSelectedNode(null);
      setIsWayfindingActive(false);
      setIsDetailModalOpen(false);
      if (onSelectElement) {
        onSelectElement(null as any);
      }
    } else if (filterId === 'counter') {
      if (activeSector === 'fasilitas_inklusif') {
        setActiveSector('all');
      }
    } else if (filterId === 'facility') {
      setActiveSector('fasilitas_inklusif');
    } else if (filterId === 'disability') {
      setActiveSector('all');
    }
    // If selected node does not match new filter, clear selection smoothly
    if (selectedNode) {
      if (filterId === 'counter' && selectedNode.category !== 'counter') {
        setSelectedNode(null);
        if (onSelectElement) onSelectElement(null as any);
      }
      if (filterId === 'facility' && selectedNode.category !== 'facility') {
        setSelectedNode(null);
        if (onSelectElement) onSelectElement(null as any);
      }
      if (filterId === 'disability' && !selectedNode.isDisabilityFriendly) {
        setSelectedNode(null);
        if (onSelectElement) onSelectElement(null as any);
      }
    }
  };

  // Sector Filter Change Handler with Mutual Category Synchronization
  const handleSectorFilterChange = (sec: MppSectorFilter) => {
    setActiveSector(sec);
    if (sec === 'all') {
      setActiveFilter('all');
      setSearchQuery('');
      setSelectedNode(null);
      setIsWayfindingActive(false);
      setIsDetailModalOpen(false);
      if (onSelectElement) {
        onSelectElement(null as any);
      }
    } else if (sec === 'fasilitas_inklusif') {
      setActiveFilter('facility');
    } else {
      // For specific counter sectors (kependudukan, perizinan, perpajakan, bpjs, perbankan)
      if (activeFilter === 'facility' || activeFilter === 'disability') {
        setActiveFilter('all');
      }
    }
    if (selectedNode && sec !== 'all' && !isNodeInSector(selectedNode.id, selectedNode.name, selectedNode.category, sec)) {
      setSelectedNode(null);
      if (onSelectElement) onSelectElement(null as any);
    }
  };

  // Matching sector count for legend overlay
  const matchingSectorCount = useMemo(() => {
    if (activeSector === 'all') return filteredNodes.length;
    return filteredNodes.length;
  }, [activeSector, filteredNodes.length]);

  // Zoom and Total Reset controls
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 2.2));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.7));
  const handleResetAll = () => {
    setZoomLevel(1);
    setFullscreenScale(1);
    setFullscreenPosition({ x: 0, y: 0 });
    setSelectedNode(null);
    setIsWayfindingActive(false);
    setIsDetailModalOpen(false);
    setActiveFilter('all');
    setActiveSector('all');
    setSearchQuery('');
    if (onSelectElement) {
      onSelectElement(null as any);
    }
  };

  const handleSelectNode = (node: FloorNode) => {
    setSelectedNode(node);
    setIsWayfindingActive(true);
    setIsDetailModalOpen(true);
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
      ? "fixed inset-0 z-[9999] bg-[#0A2238] text-slate-100 p-0 flex flex-col justify-center items-center overflow-hidden select-none"
      : `w-full max-w-full rounded-3xl border transition-all duration-300 overflow-hidden shadow-sm flex flex-col ${
          isDark ? 'bg-surface/95 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-900'
        } ${className}`
    }>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 1. TOP BAR: TITLE, FILTER CHIPS, SEARCH & ZOOM CONTROLS           */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {!isFullscreen && (
        <div className={`p-4 sm:p-5 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
          isDark ? 'border-slate-800/80 bg-surface/50' : 'border-slate-100 bg-slate-50/50'
        }`}>
        
        {/* Left: Section Title & Live Badge */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60 mb-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t('floorplan.badge', 'DENAH INTERAKTIF FRONT OFFICE')}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight font-sans">
            {t('floorplan.title', 'Denah Ruangan & Loket Pelayanan')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('floorplan.subtitle', 'Peta tata letak lantai 1 2D interaktif fasilitas publik, gerai layanan, dan area tunggu MPP.')}
          </p>
        </div>

        {/* Right Action Cluster: Search bar, View toggle, Zoom Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 max-w-full justify-start lg:justify-end">
          {/* Search Bar ('Cari gerai/fasilitas...') */}
          <div className="relative w-full sm:w-auto min-w-[180px] sm:min-w-[220px] max-w-xs">
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

          {/* View Toggle (Mobile only: Daftar as default vs Peta Denah) */}
          <div className="lg:hidden flex items-center p-1 rounded-2xl border bg-slate-100 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-surface text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Daftar ({filteredNodes.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'map'
                  ? 'bg-white dark:bg-surface text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Denah
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
              onClick={handleResetAll}
              title="Reset Tampilan & Filter"
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Fullscreen Maximize Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
            title="Tampilkan Denah Layar Lebar / Mode Presentasi (Shortcut: Tekan F)"
          >
            <Maximize2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Ketuk Layar Lebar</span>
            <span className="hidden lg:inline text-[10px] font-mono opacity-80 bg-emerald-200/50 dark:bg-emerald-900/50 px-1 py-0.2 rounded">F</span>
          </button>
        </div>
      </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 2. FILTER CHIPS (TOP BAR CATEGORIES)                              */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {!isFullscreen && (
        <div className={`px-4 sm:px-6 py-2.5 border-b flex items-center justify-between gap-3 overflow-x-auto no-scrollbar ${
          isDark ? 'border-slate-800/80 bg-base/60' : 'border-slate-100 bg-slate-50/70'
        }`}>
          <div className="flex items-center gap-2 shrink-0">
            {filterChips.map(chip => {
              const Icon = chip.icon;
              const isSelected = activeFilter === chip.id && activeSector === (chip.id === 'facility' ? 'fasilitas_inklusif' : 'all');
              
              const chipCount = 
                chip.id === 'all' ? FLOOR_NODES.length :
                chip.id === 'counter' ? FLOOR_NODES.filter(n => n.category === 'counter').length :
                chip.id === 'facility' ? FLOOR_NODES.filter(n => n.category === 'facility').length :
                FLOOR_NODES.filter(n => n.isDisabilityFriendly).length;

              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => handleTopFilterClick(chip.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md shadow-black/25'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{chip.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                    isSelected ? 'bg-emerald-700/80 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>
                    {chipCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Legend status */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Buka</span>
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
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 3. WORKSPACE CONTAINER (DESKTOP: SPLIT VIEW | FULLSCREEN: CENTERED) */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className={
        isFullscreen
          ? "w-full h-full flex-1 flex items-center justify-center p-0 m-0 overflow-hidden"
          : "w-full flex flex-col lg:flex-row lg:items-start gap-5 p-2 sm:p-4"
      }>
        {/* LEFT DIRECTORY PANEL (Desktop: Always on left | Mobile: visible when viewMode === 'list' | Hidden in Fullscreen Mode for Perfect Centering) */}
        <div className={
          isFullscreen
            ? "hidden"
            : `w-full lg:w-[320px] xl:w-[360px] shrink-0 flex flex-col gap-2.5 ${
                viewMode === 'list' ? 'block' : 'hidden lg:flex'
              }`
        }>
          <div className="flex items-center justify-between px-2 pt-1 pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
              Daftar Loket ({filteredNodes.length})
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              Klik untuk sorot rute
            </span>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[640px] lg:max-h-[780px] overflow-y-auto pr-1.5 scrollbar-thin">
            {filteredNodes.map(node => {
              const isSelected = selectedNode?.id === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => {
                    handleSelectNode(node);
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      setViewMode('map');
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/30 shadow-md'
                      : isDark
                      ? 'bg-slate-800/60 border-slate-700/80 hover:border-emerald-500/40 hover:bg-slate-800/90'
                      : 'bg-white border-slate-200/90 hover:border-emerald-500/40 hover:bg-slate-50 shadow-2xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                        {node.zone}
                      </span>
                      <StatusPill status={node.status === 'open' ? 'buka' : node.status === 'busy' ? 'ramai' : 'tutup'} />
                    </div>
                    <h4 className={`text-sm font-bold leading-snug ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                      {node.name}
                    </h4>
                    {node.subName && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 leading-relaxed">
                        {node.subName}
                      </p>
                    )}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {node.services.length} Layanan
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span>Rute Loket</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT SPATIAL MAP CANVAS (Desktop: Always on right / Fully Centered in Fullscreen) */}
        <div className={
          isFullscreen
            ? "w-full h-full flex-1 flex items-center justify-center p-0 m-0 overflow-hidden"
            : `flex-1 min-w-0 w-full ${viewMode === 'map' ? 'block' : 'hidden lg:block'}`
        }>
          <div 
            ref={containerRef}
            className={isFullscreen
              ? "relative w-full h-full max-w-full max-h-full overflow-hidden flex items-center justify-center p-0 m-0 touch-pan-x touch-pan-y bg-[#0A2238]"
              : "relative w-full max-w-full overflow-hidden flex flex-col items-center justify-center p-1 sm:p-2 lg:p-3 xl:p-4 touch-pan-x touch-pan-y min-h-[580px] sm:min-h-[660px] lg:h-[82vh] xl:h-[86vh] 2xl:h-[89vh] lg:max-h-[1150px]"
            }
            style={isFullscreen ? { height: '100dvh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center' } : undefined}
          >
            {/* Active Filter Live Status Toast Banner on Map Canvas */}
            {isAnyFilterActive && !isEmergencyMode && (
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-surface/95 dark:bg-surface/95 text-white backdrop-blur-md border border-emerald-500/60 shadow-xl text-xs select-none animate-in fade-in slide-in-from-top-2 duration-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-emerald-400">
                    {filteredNodes.length} Lokasi Terfilter:
                  </span>
                  <span className="text-slate-200 truncate max-w-[140px] sm:max-w-[220px]">
                    {activeSector !== 'all' 
                      ? `Sektor ${activeSector.replace('_', ' ').toUpperCase()}` 
                      : activeFilter !== 'all' 
                      ? filterChips.find(c => c.id === activeFilter)?.label 
                      : `"${searchQuery}"`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="ml-1 px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white text-[10px] font-bold border border-slate-700 hover:border-rose-500 transition-colors cursor-pointer"
                  title="Tampilkan Semua Loket & Fasilitas"
                >
                  ✕ Reset
                </button>
              </div>
            )}

          {/* Emergency Evacuation Mode Active Banner */}
          {isEmergencyMode && (
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-rose-950/95 text-white backdrop-blur-md border-2 border-rose-500 shadow-2xl text-xs select-none animate-bounce duration-1000">
              <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse shrink-0" />
              <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                <span className="font-black text-rose-300 uppercase tracking-wide">
                  🚨 MODE SIMULASI EVAKUASI K3 AKTIF
                </span>
                <span className="text-slate-200 text-[11px] hidden md:inline">
                  • Ikuti garis hijau neon menuju 3 Tangga/Pintu Keluar
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEmergencyMode(false)}
                className="ml-2 px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black transition-colors cursor-pointer"
                title="Tutup Mode Evakuasi"
              >
                Matikan
              </button>
            </div>
          )}

          {/* Top Theater Mode Presentation Header Banner */}
          {isFullscreen && (
            <div className="absolute top-4 left-4 z-50 flex items-center gap-3 pointer-events-auto">
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/95 text-white backdrop-blur-md border border-emerald-500/60 shadow-2xl">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-black font-sans tracking-wide">MODE PRESENTASI JURI (THEATER FULLSCREEN)</span>
                <span className="hidden sm:inline text-[10px] bg-slate-800 text-emerald-300 font-mono px-2 py-0.5 rounded-md border border-emerald-500/30">
                  [F] Fullscreen • [ESC] Tutup
                </span>
              </div>
            </div>
          )}

          {/* Floating Close button & Theater control on top-right */}
          {isFullscreen && (
            <div className="absolute top-4 right-4 z-50 flex items-center gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={() => {
                  setSelectedNode(null);
                  setIsFullscreen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/95 hover:bg-rose-600 text-slate-100 hover:text-white shadow-2xl border border-slate-700 hover:border-rose-500 transition-all cursor-pointer active:scale-95 text-xs font-black"
                title="Tutup Mode Layar Lebar (Esc)"
              >
                <X className="w-4 h-4" />
                <span>Keluar (Esc)</span>
              </button>
            </div>
          )}

          {/* Small floating Zoom controls on bottom-right of the fullscreen map */}
          {isFullscreen && (
            <div className="absolute bottom-4 right-4 z-50 flex items-center gap-1 p-1 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl select-none text-white pointer-events-auto">
              <button
                type="button"
                onClick={() => setFullscreenScale(prev => Math.min(5, prev + 0.3))}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer active:scale-90"
                title="Perbesar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setFullscreenScale(prev => Math.max(0.8, prev - 0.3))}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer active:scale-90"
                title="Perkecil"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetAll}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer active:scale-90"
                title="Reset Tampilan & Filter"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Floating Kiosk Quick-Access Overlay on Map Canvas */}
          {!isFullscreen && (
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-40 pointer-events-auto flex items-center gap-2 max-w-[calc(100%-1.5rem)] sm:max-w-none justify-end">
              {/* Floating Emergency Button */}
              <button
                type="button"
                onClick={() => setIsEmergencyMode(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl text-xs font-black shadow-2xl transition-all cursor-pointer active:scale-95 shrink-0 ${
                  isEmergencyMode
                    ? 'bg-rose-600 hover:bg-rose-500 text-white border-2 border-rose-300 animate-pulse ring-4 ring-rose-500/30'
                    : 'bg-surface/95 dark:bg-slate-800/95 backdrop-blur-md border border-rose-500/50 text-rose-400 hover:bg-rose-600 hover:text-white'
                }`}
                title="Simulasi Rute Evakuasi & Titik Kumpul Darurat K3"
              >
                <ShieldAlert className={`w-4 h-4 ${isEmergencyMode ? 'animate-bounce' : 'text-rose-400'}`} />
                <span className="hidden sm:inline">{isEmergencyMode ? 'Evakuasi ON' : 'Mode Evakuasi K3'}</span>
              </button>

              {/* Floating Fullscreen Button */}
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                className="flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-2xl border-2 border-emerald-300/80 transition-all cursor-pointer active:scale-95 group ring-4 ring-emerald-500/20 shrink-0"
                title="Tampilkan Denah Layar Lebar / Mode Presentasi Juri (Shortcut: Tekan F)"
              >
                <Maximize2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Lihat Layar Lebar (Landscape)</span>
                <span className="sm:hidden">Layar Lebar</span>
                <span className="hidden lg:inline text-[10px] font-mono bg-black/40 px-2 py-0.5 rounded text-emerald-200">F</span>
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

          {/* Custom Interactive Transform Wrapper with Centered Origin */}
          <div 
            className={isFullscreen 
              ? "w-full h-full flex items-center justify-center mx-auto my-auto select-none overflow-hidden touch-none cursor-grab active:cursor-grabbing" 
              : "relative w-full h-full max-w-full flex items-center justify-center mx-auto my-auto transition-transform duration-300 overflow-hidden"
            }
            style={isFullscreen 
              ? { 
                  transform: `translate(${fullscreenPosition.x}px, ${fullscreenPosition.y}px) scale(${fullscreenScale})`,
                  transformOrigin: 'center center',
                  transition: isDraggingRef.current ? 'none' : 'transform 0.15s ease-out',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%'
                } 
              : { 
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center center'
                }
            }
            onMouseDown={isFullscreen ? handleFullscreenMouseDown : undefined}
            onMouseMove={isFullscreen ? handleFullscreenMouseMove : undefined}
            onMouseUp={isFullscreen ? handleFullscreenMouseUpOrLeave : undefined}
            onMouseLeave={isFullscreen ? handleFullscreenMouseUpOrLeave : undefined}
            onTouchStart={isFullscreen ? handleFullscreenTouchStart : undefined}
            onTouchMove={isFullscreen ? handleFullscreenTouchMove : undefined}
            onTouchEnd={isFullscreen ? handleFullscreenTouchEnd : undefined}
            onWheel={isFullscreen ? handleFullscreenWheel : undefined}
          >
            <svg
              viewBox="-10 5 1282 875"
              preserveAspectRatio="xMidYMid meet"
              className={isFullscreen 
                ? "w-auto h-auto max-w-[94vw] max-h-[86vh] object-contain block mx-auto my-auto select-none drop-shadow-2xl pointer-events-auto"
                : "w-full h-full max-w-full max-h-[80vh] xl:max-h-[85vh] 2xl:max-h-[88vh] object-contain block mx-auto my-auto select-none drop-shadow-md pointer-events-auto"
              }
              style={{
                textRendering: 'optimizeLegibility',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                shapeRendering: 'geometricPrecision'
              }}
            >
              <defs>
                <style>{`
                  text {
                    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    text-rendering: optimizeLegibility;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                  }
                  @keyframes flowRoute {
                    from { stroke-dashoffset: 40; }
                    to { stroke-dashoffset: 0; }
                  }
                  .active-route-path {
                    stroke: #10b981;
                    stroke-width: 3px;
                    stroke-dasharray: 8, 8;
                    animation: flowRoute 1s linear infinite;
                  }
                  .active-route-halo {
                    stroke: #10b981;
                    stroke-width: 7px;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                    opacity: 0.15;
                  }
                  @keyframes flowEvacuation {
                    from { stroke-dashoffset: 48; }
                    to { stroke-dashoffset: 0; }
                  }
                  .evac-path-active {
                    stroke: #22c55e;
                    stroke-width: 5px;
                    stroke-dasharray: 12, 6;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                    animation: flowEvacuation 0.8s linear infinite;
                    filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.95));
                  }
                  .evac-path-halo {
                    stroke: #16a34a;
                    stroke-width: 14px;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                    opacity: 0.35;
                    filter: blur(3px);
                  }
                  @keyframes assemblyPulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.06); }
                    100% { transform: scale(1); }
                  }
                  .assembly-point-bounce {
                    animation: assemblyPulse 2s ease-in-out infinite;
                  }
                  @keyframes beaconPulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                    70% { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                  }
                  @keyframes beaconPulseAmber {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
                    70% { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
                  }
                  @keyframes beaconPulseRed {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                  }
                  .status-beacon-green { animation: beaconPulse 2s infinite; }
                  .status-beacon-amber { animation: beaconPulseAmber 1.5s infinite; }
                  .status-beacon-red { animation: beaconPulseRed 1s infinite; }
                `}</style>
                {/* Evacuation Arrow Markers */}
                <marker id="evac-arrow-head" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#22c55e" />
                </marker>
                <marker id="evac-arrow-pulse" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#16a34a" />
                </marker>
                {/* Clean Filters without Neon Glow */}
                <filter id="mpp-active-glow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000000" floodOpacity="0.3" />
                </filter>
                <filter id="mpp-disability-glow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000000" floodOpacity="0.3" />
                </filter>
                <filter id="mpp-focus-glow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000000" floodOpacity="0.3" />
                </filter>
              </defs>

              {/* 1. Master Building Outline & Outer Wall Footprint (Expanded & Balanced) */}
              <rect
                x="20"
                y="25"
                width="1222"
                height="665"
                rx="18"
                fill={isDark ? "#0A2238" : "#f8fafc"}
                stroke={isDark ? "rgba(255, 255, 255, 0.2)" : "#cbd5e1"}
                strokeWidth="2.5"
                className="cursor-pointer"
                onClick={() => {
                  setSelectedNode(null);
                  setIsWayfindingActive(false);
                  setIsDetailModalOpen(false);
                }}
              />
              {/* Entrance Porch Protrusion (South Corridor) */}
              <path
                d="M 545 690 L 545 860 Q 545 870 555 870 L 715 870 Q 725 870 725 860 L 725 690 Z"
                fill={isDark ? "#0A2238" : "#f8fafc"}
                stroke={isDark ? "rgba(255, 255, 255, 0.2)" : "#cbd5e1"}
                strokeWidth="2.5"
              />
              <line x1="547" y1="690" x2="723" y2="690" stroke={isDark ? "#0A2238" : "#f8fafc"} strokeWidth="5" />

              {/* ── FIX 1A: LAYER ZONA WARNA BACKGROUND DENAH (Render SEBELUM semua loket card) ── */}
              <g id="floor-zones-background-layer" pointerEvents="none">
                {FLOOR_ZONES.map(zone => (
                  <g key={zone.id}>
                    <rect
                      x={zone.x}
                      y={zone.y}
                      width={zone.w}
                      height={zone.h}
                      rx={zone.rx}
                      fill={zone.style.fill}
                      stroke={zone.style.stroke}
                      strokeWidth={zone.style.strokeWidth}
                      strokeDasharray={zone.style.strokeDasharray}
                    />
                    <text
                      x={zone.labelX}
                      y={zone.labelY}
                      fill={zone.labelColor}
                      fontSize="9.5"
                      fontWeight="800"
                      letterSpacing="0.8"
                      className="uppercase font-sans select-none tracking-widest"
                    >
                      {zone.label}
                    </text>
                  </g>
                ))}
              </g>

              {/* Exterior Detached Pillars on Far Left (4 Square Pillars as in Blueprint) */}
              {[235, 330, 425, 520].map((y, idx) => (
                <g key={`ext-pillar-${idx}`}>
                  <rect x="4" y={y - 8} width="12" height="16" rx="2" fill={isDark ? "#1e293b" : "#f1f5f9"} stroke={isDark ? "#64748b" : "#475569"} strokeWidth="1.2" />
                  <rect x="6" y={y - 5} width="8" height="10" fill="none" stroke="#10b981" strokeWidth="0.8" />
                  <line x1="10" y1={y - 5} x2="10" y2={y + 5} stroke="#10b981" strokeWidth="0.8" />
                  <line x1="6" y1={y} x2="14" y2={y} stroke="#10b981" strokeWidth="0.8" />
                </g>
              ))}

              {/* Perimeter Architectural Columns with 4-Petal Cross Capitals (Sesuai Denah CAD Asli) */}
              {[
                // North wall columns (y: 25)
                { x: 20, y: 25 }, { x: 100, y: 25 }, { x: 190, y: 25 }, { x: 345, y: 25 }, { x: 455, y: 25 }, { x: 540, y: 25 }, { x: 635, y: 25 }, { x: 730, y: 25 }, { x: 815, y: 25 }, { x: 925, y: 25 }, { x: 1080, y: 25 }, { x: 1242, y: 25 },
                // South wall columns (y: 690)
                { x: 20, y: 690 }, { x: 100, y: 690 }, { x: 190, y: 690 }, { x: 275, y: 690 }, { x: 360, y: 690 }, { x: 545, y: 690 }, { x: 725, y: 690 }, { x: 810, y: 690 }, { x: 895, y: 690 }, { x: 980, y: 690 }, { x: 1080, y: 690 }, { x: 1242, y: 690 },
                // Entrance corridor columns
                { x: 545, y: 775 }, { x: 725, y: 775 }, { x: 545, y: 860 }, { x: 725, y: 860 }
              ].map((col, idx) => (
                <g key={`cad-pillar-${idx}`} pointerEvents="none">
                  <rect x={col.x - 7} y={col.y - 7} width="14" height="14" rx="2" fill={isDark ? "#1e293b" : "#e2e8f0"} stroke={isDark ? "#475569" : "#64748b"} strokeWidth="1.2" />
                  {/* Internal Floral / Cross Hatching */}
                  <line x1={col.x - 4} y1={col.y - 4} x2={col.x + 4} y2={col.y + 4} stroke={isDark ? "#38bdf8" : "#0284c7"} strokeWidth="0.8" />
                  <line x1={col.x + 4} y1={col.y - 4} x2={col.x - 4} y2={col.y + 4} stroke={isDark ? "#38bdf8" : "#0284c7"} strokeWidth="0.8" />
                </g>
              ))}

              {/* Architectural Stairwells with Parallel Tread Lines */}
              {/* 1. North-East Stairwell */}
              <g id="stairwell-ne" pointerEvents="none" opacity="0.8">
                <rect x="1090" y="170" width="75" height="55" fill={isDark ? "#1e293b" : "#f1f5f9"} stroke={isDark ? "#475569" : "#94a3b8"} strokeWidth="1.5" />
                {[177, 184, 191, 198, 205, 212, 219].map((sy, i) => (
                  <line key={`st-ne-${i}`} x1="1090" y1={sy} x2="1165" y2={sy} stroke={isDark ? "#64748b" : "#94a3b8"} strokeWidth="0.8" />
                ))}
                <path d="M 1127 175 L 1127 220 L 1123 213" fill="none" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" />
              </g>
              {/* 2. South-East Stairwell */}
              <g id="stairwell-se" pointerEvents="none" opacity="0.8">
                <rect x="1090" y="520" width="75" height="55" fill={isDark ? "#1e293b" : "#f1f5f9"} stroke={isDark ? "#475569" : "#94a3b8"} strokeWidth="1.5" />
                {[527, 534, 541, 548, 555, 562, 569].map((sy, i) => (
                  <line key={`st-se-${i}`} x1="1090" y1={sy} x2="1165" y2={sy} stroke={isDark ? "#64748b" : "#94a3b8"} strokeWidth="0.8" />
                ))}
                <path d="M 1127 570 L 1127 525 L 1123 532" fill="none" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" />
              </g>
              {/* 3. Mid-West Stairwell */}
              <g id="stairwell-w" pointerEvents="none" opacity="0.8">
                <rect x="105" y="360" width="75" height="55" fill={isDark ? "#1e293b" : "#f1f5f9"} stroke={isDark ? "#475569" : "#94a3b8"} strokeWidth="1.5" />
                {[367, 374, 381, 388, 395, 402, 409].map((sy, i) => (
                  <line key={`st-w-${i}`} x1="105" y1={sy} x2="180" y2={sy} stroke={isDark ? "#64748b" : "#94a3b8"} strokeWidth="0.8" />
                ))}
                <path d="M 142 410 L 142 365 L 138 372" fill="none" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" />
              </g>

              {/* 2. Organic Sinuous Circulation Pathways (Traced Exactly from Denah Asli) */}
              {/* West S-Curve Promenade */}
              <path
                d="M 280 150 C 280 230, 365 250, 365 350 C 365 450, 280 470, 280 575"
                fill="none"
                stroke={isDark ? "#1e293b" : "#e2e8f0"}
                strokeWidth="14"
                strokeLinecap="round"
                opacity="0.6"
              />
              <path
                d="M 280 150 C 280 230, 365 250, 365 350 C 365 450, 280 470, 280 575"
                fill="none"
                stroke={isDark ? "#334155" : "#cbd5e1"}
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* East S-Curve Promenade */}
              <path
                d="M 990 150 C 990 230, 905 250, 905 350 C 905 450, 990 470, 990 575"
                fill="none"
                stroke={isDark ? "#1e293b" : "#e2e8f0"}
                strokeWidth="14"
                strokeLinecap="round"
                opacity="0.6"
              />
              <path
                d="M 990 150 C 990 230, 905 250, 905 350 C 905 450, 990 470, 990 575"
                fill="none"
                stroke={isDark ? "#334155" : "#cbd5e1"}
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* South Entrance Y-Spine Bifurcation */}
              <g pointerEvents="none">
                <path
                  d="M 635 820 L 635 680 C 635 615, 555 590, 510 545"
                  fill="none"
                  stroke={isDark ? "#334155" : "#cbd5e1"}
                  strokeWidth="2"
                  strokeDasharray="5 4"
                />
                <path
                  d="M 635 680 C 635 615, 715 590, 760 545"
                  fill="none"
                  stroke={isDark ? "#334155" : "#cbd5e1"}
                  strokeWidth="2"
                  strokeDasharray="5 4"
                />
                {/* Tactile Blind Guiding Block */}
                <path
                  d="M 625 820 L 625 675 L 625 595"
                  fill="none"
                  stroke="#eab308"
                  strokeWidth="3"
                  strokeDasharray="4 4"
                  opacity="0.8"
                />
              </g>

              {/* 3. Central Rotunda & Dual Horizontal Teardrops (Simpurusiang Real Blueprint Core) */}
              {/* Outer Circular Boundary */}
              <ellipse
                cx="635"
                cy="370"
                rx="235"
                ry="165"
                fill={isDark ? "#081021" : "#f1f5f9"}
                stroke={isDark ? "#1e293b" : "#cbd5e1"}
                strokeWidth="2"
                strokeDasharray="6 4"
              />

              {/* Hourglass Inter-Teardrop Crossing Lines */}
              <path
                d="M 575 285 C 615 325, 655 325, 695 285"
                fill="none"
                stroke={isDark ? "#1e293b" : "#cbd5e1"}
                strokeWidth="1.5"
              />
              <path
                d="M 575 455 C 615 415, 655 415, 695 455"
                fill="none"
                stroke={isDark ? "#1e293b" : "#cbd5e1"}
                strokeWidth="1.5"
              />

              {/* WEST TEARDROP (`#teardrop-west` - Horizontal, Tip Facing East) */}
              <g id="teardrop-west" pointerEvents="none">
                {/* 4 Concentric Topographic Contours as in the CAD drawing */}
                {[
                  { tipX: 615, r: 42, sw: 1.8, stroke: "#06b6d4", opacity: 0.9 },
                  { tipX: 601, r: 32, sw: 1.4, stroke: "#06b6d4", opacity: 0.7 },
                  { tipX: 587, r: 22, sw: 1.1, stroke: "#38bdf8", opacity: 0.55 },
                  { tipX: 573, r: 12, sw: 0.9, stroke: "#38bdf8", opacity: 0.4 }
                ].map((ring, idx) => (
                  <path
                    key={`td-w-${idx}`}
                    d={`M ${ring.tipX} 370 C 565 ${370 - ring.r * 1.3}, ${495 - ring.r} ${370 - ring.r}, ${495 - ring.r} 370 C ${495 - ring.r} ${370 + ring.r}, 565 ${370 + ring.r * 1.3}, ${ring.tipX} 370 Z`}
                    fill={idx === 3 ? (isDark ? "#0284c7" : "#bae6fd") : "none"}
                    fillOpacity={idx === 3 ? "0.2" : "0"}
                    stroke={ring.stroke}
                    strokeWidth={ring.sw}
                    strokeOpacity={ring.opacity}
                  />
                ))}
                <circle cx="490" cy="370" r="5" fill="#06b6d4" className="animate-pulse" />
              </g>

              {/* EAST TEARDROP (`#teardrop-east` - Horizontal, Tip Facing West) */}
              <g id="teardrop-east" pointerEvents="none">
                {/* 4 Concentric Topographic Contours as in the CAD drawing */}
                {[
                  { tipX: 655, r: 42, sw: 1.8, stroke: "#f59e0b", opacity: 0.9 },
                  { tipX: 669, r: 32, sw: 1.4, stroke: "#f59e0b", opacity: 0.7 },
                  { tipX: 683, r: 22, sw: 1.1, stroke: "#fbbf24", opacity: 0.55 },
                  { tipX: 697, r: 12, sw: 0.9, stroke: "#fbbf24", opacity: 0.4 }
                ].map((ring, idx) => (
                  <path
                    key={`td-e-${idx}`}
                    d={`M ${ring.tipX} 370 C 705 ${370 - ring.r * 1.3}, ${775 + ring.r} ${370 - ring.r}, ${775 + ring.r} 370 C ${775 + ring.r} ${370 + ring.r}, 705 ${370 + ring.r * 1.3}, ${ring.tipX} 370 Z`}
                    fill={idx === 3 ? (isDark ? "#d97706" : "#fde68a") : "none"}
                    fillOpacity={idx === 3 ? "0.2" : "0"}
                    stroke={ring.stroke}
                    strokeWidth={ring.sw}
                    strokeOpacity={ring.opacity}
                  />
                ))}
                <circle cx="780" cy="370" r="5" fill="#f59e0b" className="animate-pulse" />
              </g>

              {/* Central Meridian Data Sync Core (Between the Teardrop Tips - Subtle Core) */}
              <g id="central-meridian-sync" pointerEvents="none" opacity={isDark ? "0.45" : "0.35"}>
                <circle cx="635" cy="370" r="18" fill="none" stroke="#10b981" strokeWidth="1.5" opacity="0.6">
                  <animate attributeName="r" values="16;45" dur="3.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0" dur="3.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="635" cy="370" r="10" fill={isDark ? "#064e3b" : "#d1fae5"} stroke="#10b981" strokeWidth="1.2" opacity="0.7" />
                <circle cx="635" cy="370" r="4.5" fill="#10b981" className="animate-pulse" />
                <circle cx="635" cy="370" r="2" fill="#ffffff" />
              </g>

              {/* 4. THE 4 CURVED ISLAND COUNTERS (Inner Ring Radial Desks from Blueprint) */}
              {/* A. North Arc Counter (3 Booths: Imigrasi, KPP Pratama, Dinsos) */}
              <g id="cad-north-arc" pointerEvents="none">
                <path
                  d="M 490 255 A 240 160 0 0 1 780 255 L 765 290 A 190 120 0 0 0 505 290 Z"
                  fill="none"
                  stroke={isDark ? "#475569" : "#94a3b8"}
                  strokeWidth="1.2"
                />
                {/* Partition Dividers */}
                <line x1="585" y1="240" x2="592" y2="278" stroke={isDark ? "#475569" : "#94a3b8"} strokeWidth="1.2" />
                <line x1="685" y1="240" x2="678" y2="278" stroke={isDark ? "#475569" : "#94a3b8"} strokeWidth="1.2" />
                {/* Organic curved desks & chairs */}
                {[
                  { cx: 540, cy: 270 },
                  { cx: 635, cy: 260 },
                  { cx: 730, cy: 270 }
                ].map((d, i) => (
                  <React.Fragment key={`north-desk-${i}`}>
                    <ellipse cx={d.cx} cy={d.cy} rx="16" ry="8" fill={isDark ? "#1e293b" : "#e2e8f0"} stroke={isDark ? "#64748b" : "#94a3b8"} strokeWidth="0.9" />
                    <circle cx={d.cx} cy={d.cy - 7} r="3" fill="#64748b" />
                    <circle cx={d.cx} cy={d.cy + 9} r="2.5" fill="#94a3b8" />
                  </React.Fragment>
                ))}
              </g>

              {/* B. South Arc Counter (3 Booths: PUPTR, Kominfo, Perikanan) */}
              <g id="cad-south-arc" pointerEvents="none">
                <path
                  d="M 490 485 A 240 160 0 0 0 780 485 L 765 450 A 190 120 0 0 1 505 450 Z"
                  fill="none"
                  stroke={isDark ? "#475569" : "#94a3b8"}
                  strokeWidth="1.2"
                />
                {/* Partition Dividers */}
                <line x1="585" y1="500" x2="592" y2="462" stroke={isDark ? "#475569" : "#94a3b8"} strokeWidth="1.2" />
                <line x1="685" y1="500" x2="678" y2="462" stroke={isDark ? "#475569" : "#94a3b8"} strokeWidth="1.2" />
                {/* Organic curved desks & chairs */}
                {[
                  { cx: 540, cy: 470 },
                  { cx: 635, cy: 480 },
                  { cx: 730, cy: 470 }
                ].map((d, i) => (
                  <React.Fragment key={`south-desk-${i}`}>
                    <ellipse cx={d.cx} cy={d.cy} rx="16" ry="8" fill={isDark ? "#1e293b" : "#e2e8f0"} stroke={isDark ? "#64748b" : "#94a3b8"} strokeWidth="0.9" />
                    <circle cx={d.cx} cy={d.cy + 7} r="3" fill="#64748b" />
                    <circle cx={d.cx} cy={d.cy - 9} r="2.5" fill="#94a3b8" />
                  </React.Fragment>
                ))}
              </g>

              {/* Front Office Reception Counter (Sitting behind Front Office Node) */}
              <g id="cad-front-office-counter" pointerEvents="none" opacity="0.6">
                <path
                  d="M 570 525 Q 635 536 700 525"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="600" cy="518" r="2.5" fill="#6366f1" />
                <circle cx="635" cy="520" r="2.5" fill="#6366f1" />
                <circle cx="670" cy="518" r="2.5" fill="#6366f1" />
              </g>

              {/* C. West Crescent Arc Counter (4 Booths: BPN, Nervis, Taspen, PDAM) */}
              <g id="cad-west-arc" pointerEvents="none">
                <path
                  d="M 440 265 A 180 140 0 0 0 440 475 L 410 445 A 210 160 0 0 1 410 295 Z"
                  fill="none"
                  stroke={isDark ? "#475569" : "#94a3b8"}
                  strokeWidth="1.2"
                />
                {[
                  { cx: 415, cy: 300 },
                  { cx: 395, cy: 350 },
                  { cx: 395, cy: 390 },
                  { cx: 415, cy: 440 }
                ].map((d, i) => (
                  <React.Fragment key={`west-desk-${i}`}>
                    <ellipse cx={d.cx} cy={d.cy} rx="8" ry="14" fill={isDark ? "#1e293b" : "#e2e8f0"} stroke={isDark ? "#64748b" : "#94a3b8"} strokeWidth="0.9" />
                    <circle cx={d.cx - 8} cy={d.cy} r="3" fill="#64748b" />
                    <circle cx={d.cx + 9} cy={d.cy} r="2.5" fill="#94a3b8" />
                  </React.Fragment>
                ))}
              </g>

              {/* D. East Crescent Arc Counter (4 Booths: Kejari, HAS/Halal, BPJS Ketenagakerjaan, BPJS Kesehatan) */}
              <g id="cad-east-arc" pointerEvents="none">
                <path
                  d="M 830 265 A 180 140 0 0 1 830 475 L 860 445 A 210 160 0 0 0 860 295 Z"
                  fill="none"
                  stroke={isDark ? "#475569" : "#94a3b8"}
                  strokeWidth="1.2"
                />
                {[
                  { cx: 855, cy: 300 },
                  { cx: 875, cy: 350 },
                  { cx: 875, cy: 390 },
                  { cx: 855, cy: 440 }
                ].map((d, i) => (
                  <React.Fragment key={`east-desk-${i}`}>
                    <ellipse cx={d.cx} cy={d.cy} rx="8" ry="14" fill={isDark ? "#1e293b" : "#e2e8f0"} stroke={isDark ? "#64748b" : "#94a3b8"} strokeWidth="0.9" />
                    <circle cx={d.cx + 8} cy={d.cy} r="3" fill="#64748b" />
                    <circle cx={d.cx - 9} cy={d.cy} r="2.5" fill="#94a3b8" />
                  </React.Fragment>
                ))}
              </g>

              {/* 5. CAD WING SPECIAL FURNITURE (Boardroom Table, Alcove Desks & Workstations) */}
              {/* East Wing Boardroom: Long Conference Table with 10 Chairs */}
              <g id="cad-boardroom-table" pointerEvents="none">
                <rect x="1090" y="280" width="40" height="150" rx="18" fill={isDark ? "#1e293b" : "#e2e8f0"} stroke={isDark ? "#475569" : "#94a3b8"} strokeWidth="1.5" />
                {[293, 323, 353, 383, 413].map((cy, i) => (
                  <React.Fragment key={`conf-chair-${i}`}>
                    <circle cx="1082" cy={cy} r="3.2" fill="#64748b" />
                    <circle cx="1138" cy={cy} r="3.2" fill="#64748b" />
                  </React.Fragment>
                ))}
              </g>

              {/* West Wing Curved Consultation Desks inside Wavy Alcoves */}
              <g id="cad-west-alcove-desks" pointerEvents="none">
                {/* Upper Alcove */}
                <path d="M 220 245 Q 240 265 220 285" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                <circle cx="212" cy="255" r="2.5" fill="#10b981" />
                <circle cx="212" cy="275" r="2.5" fill="#10b981" />
                <circle cx="231" cy="265" r="2.5" fill="#94a3b8" />
                {/* Lower Alcove */}
                <path d="M 220 445 Q 240 465 220 485" fill="none" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" />
                <circle cx="212" cy="455" r="2.5" fill="#06b6d4" />
                <circle cx="212" cy="475" r="2.5" fill="#06b6d4" />
                <circle cx="231" cy="465" r="2.5" fill="#94a3b8" />
              </g>

              {/* East Wing Curved Consultation Desks inside Wavy Alcoves */}
              <g id="cad-east-alcove-desks" pointerEvents="none">
                {/* Upper Alcove */}
                <path d="M 1010 245 Q 990 265 1010 285" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" />
                <circle cx="1018" cy="255" r="2.5" fill="#059669" />
                <circle cx="1018" cy="275" r="2.5" fill="#059669" />
                <circle cx="999" cy="265" r="2.5" fill="#94a3b8" />
                {/* Lower Alcove */}
                <path d="M 1010 445 Q 990 465 1010 485" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" />
                <circle cx="1018" cy="455" r="2.5" fill="#059669" />
                <circle cx="1018" cy="475" r="2.5" fill="#059669" />
                <circle cx="999" cy="465" r="2.5" fill="#94a3b8" />
              </g>

              {/* 6. ANIMATED WAYFINDING ROUTE (Pintu Masuk -> Atrium Sentral -> Booth) */}
              {selectedNode && wayfindingRoute && (
                <g id="animated-wayfinding-layer" pointerEvents="none">
                  {/* Outer Glowing Halo with Sector Accent Support */}
                  <path
                    d={wayfindingRoute.path}
                    fill="none"
                    className="active-route-halo"
                    style={activeSector !== 'all' ? { stroke: SECTOR_ACCENT_COLORS[activeSector] } : undefined}
                  />
                  {/* Flowing Emerald / Sector Path */}
                  <path
                    d={wayfindingRoute.path}
                    fill="none"
                    className="active-route-path"
                    style={activeSector !== 'all' ? { stroke: SECTOR_ACCENT_COLORS[activeSector], filter: `drop-shadow(0 0 6px ${SECTOR_ACCENT_COLORS[activeSector]})` } : undefined}
                  />

                  {/* Start Point Beacon at Pintu Masuk */}
                  <g>
                    <circle cx="635" cy="795" r="12" fill="#10b981" opacity="0.4" className="animate-ping" style={{ transformOrigin: '635px 795px' }} />
                    <circle cx="635" cy="795" r="6" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                    <rect x="570" y="811" width="130" height="18" rx="9" fill={isDark ? "#064e3b" : "#d1fae5"} stroke="#10b981" strokeWidth="1.2" />
                    <text x="635" y="823" fill="#10b981" fontSize="7.5" fontWeight="900" textAnchor="middle" letterSpacing="0.6" className="font-mono">
                      START: PINTU MASUK
                    </text>
                  </g>

                  {/* Waypoint Indicator at Atrium Sentral Hub */}
                  {wayfindingRoute.hasAtriumHub && (
                    <g>
                      <circle cx="635" cy="360" r="14" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" className="animate-spin" style={{ transformOrigin: '635px 360px', animationDuration: '6s' }} />
                      <circle cx="635" cy="360" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.2" />
                    </g>
                  )}

                  {/* Destination Target Beacon at Selected Booth */}
                  <g>
                    <circle
                      cx={wayfindingRoute.targetX}
                      cy={wayfindingRoute.targetY}
                      r="18"
                      fill="#10b981"
                      opacity="0.35"
                      className="animate-ping"
                      style={{ transformOrigin: `${wayfindingRoute.targetX}px ${wayfindingRoute.targetY}px`, animationDuration: '1.8s' }}
                    />
                    <circle cx={wayfindingRoute.targetX} cy={wayfindingRoute.targetY} r="8" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
                    <circle cx={wayfindingRoute.targetX} cy={wayfindingRoute.targetY} r="3.5" fill="#ffffff" />
                    {/* Floating Destination Badge */}
                    <rect
                      x={wayfindingRoute.targetX - 55}
                      y={selectedNode.y > 90 ? selectedNode.y - 24 : selectedNode.y + selectedNode.h + 8}
                      width="110"
                      height="19"
                      rx="9.5"
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="1"
                    />
                    <text
                      x={wayfindingRoute.targetX}
                      y={selectedNode.y > 90 ? selectedNode.y - 11 : selectedNode.y + selectedNode.h + 21}
                      fill="#ffffff"
                      fontSize="8"
                      fontWeight="900"
                      textAnchor="middle"
                      letterSpacing="0.4"
                      className="font-sans select-none"
                    >
                      TUJUAN: {selectedNode.name.length > 12 ? `${selectedNode.name.slice(0, 11)}...` : selectedNode.name}
                    </text>
                  </g>
                </g>
              )}

              {/* 5. RENDER INTERACTIVE NODES (ROOMS, COUNTERS & FACILITIES) */}
              {sortedFloorNodes.map(node => {
                const isSelected = selectedBoothId === node.id;
                const isHovered = hoveredNodeId === node.id;
                const isMatching = isNodeMatching(node);
                const hasActiveSelection = !!selectedBoothId;

                // Sector filter active status
                const isSectorActive = activeSector !== 'all';
                const sectorAccent = SECTOR_ACCENT_COLORS[activeSector] || '#10b981';

                // Interactivity & State Binding:
                // When any filter is active:
                // - Matching booths get full opacity-100, active sector stroke, and glowing drop-shadow.
                // - Non-matching booths get deep dimming (opacity-12) and grayscale.
                let nodeOpacity = isMatching ? 1 : 0.12;
                let nodeFilter: string | undefined = undefined;
                let nodeClass = "cursor-pointer transition-all duration-300";

                if (isMatching) {
                  if (activeFilter === 'disability') {
                    nodeFilter = "drop-shadow(0 0 12px rgba(6, 182, 212, 0.95))";
                    nodeClass = "cursor-pointer transition-all duration-200 scale-[1.02] z-20 group";
                  } else if (isSectorActive) {
                    nodeFilter = `drop-shadow(0 0 12px ${sectorAccent})`;
                    nodeClass = "cursor-pointer transition-all duration-200 scale-[1.02] z-20 group";
                  } else if (activeFilter === 'facility') {
                    nodeFilter = "drop-shadow(0 0 10px rgba(236, 72, 153, 0.85))";
                    nodeClass = "cursor-pointer transition-all duration-200 scale-[1.02] z-20 group";
                  } else if (activeFilter === 'counter') {
                    nodeFilter = "drop-shadow(0 0 10px rgba(16, 185, 129, 0.85))";
                    nodeClass = "cursor-pointer transition-all duration-200 scale-[1.02] z-20 group";
                  } else {
                    nodeClass = "cursor-pointer transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.02] group";
                  }
                } else {
                  nodeFilter = "grayscale(100%) blur(0.4px)";
                  nodeClass = "cursor-pointer transition-all duration-300 opacity-15 grayscale blur-[0.4px] hover:opacity-50 hover:grayscale-0 hover:blur-none group";
                }

                // Spotlight & Dimming Focus Mode (when a booth is clicked/selected):
                if (hasActiveSelection) {
                  if (isSelected) {
                    nodeOpacity = 1;
                    nodeFilter = "drop-shadow(0 0 16px rgba(16, 185, 129, 0.9))";
                    nodeClass = "cursor-pointer transition-all duration-300 scale-105 z-30 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] hover:-translate-y-1 hover:scale-[1.07] group";
                  } else {
                    nodeOpacity = 0.3;
                    nodeFilter = "blur(1px)";
                    nodeClass = "cursor-pointer transition-all duration-300 opacity-30 blur-[1px] hover:opacity-75 hover:blur-none group";
                  }
                }

                // Color calculation
                let fill = isDark ? '#111827' : '#ffffff';
                let stroke = node.accent;
                let strokeW = 1.8;

                if (activeFilter === 'disability' && isMatching) {
                  stroke = '#06b6d4';
                  strokeW = 2.8;
                } else if (isSectorActive && isMatching) {
                  stroke = sectorAccent;
                  strokeW = 3;
                } else if (activeFilter === 'facility' && isMatching) {
                  stroke = '#ec4899';
                  strokeW = 2.8;
                } else if (activeFilter === 'counter' && isMatching) {
                  stroke = '#10b981';
                  strokeW = 2.6;
                }

                if (isSelected) {
                  fill = isDark ? '#1e293b' : '#ecfdf5';
                  stroke = '#10b981';
                  strokeW = 3.2;
                } else if (isHovered && isMatching) {
                  fill = isDark ? '#1f293d' : '#f0fdf4';
                  strokeW = 2.8;
                }

                const centerX = node.x + node.w / 2;
                const centerY = node.y + node.h / 2;

                const beaconX = node.x + node.w - 10;
                const beaconY = node.y + 10;

                return (
                  <g
                    key={node.id}
                    id={node.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectNode(node)}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    style={{
                      transformOrigin: `${centerX}px ${centerY}px`,
                      opacity: nodeOpacity,
                      filter: nodeFilter,
                      transform: isSelected ? 'scale(1.05)' : undefined
                    }}
                    className={nodeClass}
                  >
                    {/* Animated Pulsing Halo Ring for Active Matching Nodes */}
                    {isAnyFilterActive && isMatching && !isSelected && (
                      <rect
                        x={node.x - 3}
                        y={node.y - 3}
                        width={node.w + 6}
                        height={node.h + 6}
                        rx={(node.rx || 8) + 3}
                        fill="none"
                        stroke={stroke}
                        strokeWidth="2"
                        strokeDasharray="6 4"
                        className="animate-pulse"
                        opacity="0.85"
                      />
                    )}

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
                      filter={isSelected ? 'url(#mpp-focus-glow)' : undefined}
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

                    {/* Real-time Queue Status Beacon & Pill (Visible from 2m on Kiosk TV) */}
                    <g pointerEvents="none">
                      {/* Animated Expanding Pulse Ripple */}
                      <circle
                        cx={beaconX}
                        cy={beaconY}
                        r="4"
                        fill="none"
                        stroke={node.status === 'open' ? '#10b981' : node.status === 'busy' ? '#f59e0b' : '#ef4444'}
                        strokeWidth="1.2"
                        opacity="0.8"
                      >
                        <animate
                          attributeName="r"
                          values="3.5;8.5;3.5"
                          dur={node.status === 'closed' ? '1s' : node.status === 'busy' ? '1.5s' : '2s'}
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.8;0;0.8"
                          dur={node.status === 'closed' ? '1s' : node.status === 'busy' ? '1.5s' : '2s'}
                          repeatCount="indefinite"
                        />
                      </circle>

                      {/* Solid Base Core Dot */}
                      <circle
                        cx={beaconX}
                        cy={beaconY}
                        r="3.5"
                        fill={node.status === 'open' ? '#10b981' : node.status === 'busy' ? '#f59e0b' : '#ef4444'}
                      />

                      {/* Prominent High-Visibility Status Pill for Kiosk Display */}
                      <foreignObject
                        x={node.x + node.w - 50}
                        y={node.y + 3}
                        width="46"
                        height="18"
                        className="overflow-visible pointer-events-none select-none"
                      >
                        <div className={`inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold border leading-none shadow-xs backdrop-blur-xs ${
                          node.status === 'open'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                            : node.status === 'busy'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            node.status === 'open'
                              ? 'bg-emerald-400 animate-pulse'
                              : node.status === 'busy'
                              ? 'bg-amber-400'
                              : 'bg-rose-400'
                          }`} />
                          <span>{node.status === 'open' ? 'Buka' : node.status === 'busy' ? 'Ramai' : 'Tutup'}</span>
                        </div>
                      </foreignObject>
                    </g>

                    {/* Disability Badge Icon if friendly */}
                    {node.isDisabilityFriendly && (
                      <circle
                        cx={node.x + 9}
                        cy={node.y + 9}
                        r="3.5"
                        fill="#06b6d4"
                      />
                    )}

                    {/* Node Text: Primary Label with Adaptive Hierarchy */}
                    <text
                      x={centerX}
                      y={node.subName ? centerY - 3 : centerY + 4}
                      fill={isDark ? '#f8fafc' : '#0f172a'}
                      fontSize={node.name.length > 18 ? (node.w < 75 ? '7.5' : '8.5') : (node.w < 75 ? '8.5' : node.w < 95 ? '9.5' : '10.5')}
                      fontWeight={node.category === 'counter' ? '900' : '800'}
                      textAnchor="middle"
                      className="select-none pointer-events-none font-sans"
                    >
                      {node.name}
                    </text>

                    {/* Node Text: Sub-label with Controlled Truncation */}
                    {node.subName && (
                      <text
                        x={centerX}
                        y={centerY + 9}
                        fill={isDark ? '#94a3b8' : '#334155'}
                        fontSize={node.w < 75 ? '7' : '8'}
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

              {/* 6. EMERGENCY EVACUATION & ASSEMBLY POINT (ISO 7010) OVERLAY LAYER */}
              {isEmergencyMode && (
                <g id="emergency-evacuation-layer" className="transition-opacity duration-500 ease-in-out pointer-events-none">
                  {/* Subtle Dark Hazard Backdrop Filter to emphasize neon green paths */}
                  <rect
                    x="20"
                    y="25"
                    width="1222"
                    height="665"
                    rx="18"
                    fill="#050a0e"
                    opacity="0.55"
                  />
                  <path
                    d="M 545 690 L 545 860 Q 545 870 555 870 L 715 870 Q 725 870 725 860 L 725 690 Z"
                    fill="#050a0e"
                    opacity="0.55"
                  />

                  {/* ── ROUTE 1: JALUR EVAKUASI BARAT (Dukcapil/Disnakertrans -> Tangga Barat) ── */}
                  <g id="evac-route-west">
                    {/* Outer Glowing Halo */}
                    <path
                      d="M 420 360 L 235 360 L 235 430 L 140 430"
                      fill="none"
                      className="evac-path-halo"
                    />
                    {/* Animated Neon Green Dashed Path */}
                    <path
                      d="M 420 360 L 235 360 L 235 430 L 140 430"
                      fill="none"
                      className="evac-path-active"
                      markerEnd="url(#evac-arrow-head)"
                    />
                    {/* Direction Guide Pill */}
                    <g transform="translate(265, 342)">
                      <rect x="0" y="0" width="95" height="17" rx="8.5" fill="#15803d" stroke="#22c55e" strokeWidth="1" />
                      <text x="47.5" y="11.5" fill="#ffffff" fontSize="7.5" fontWeight="900" textAnchor="middle" letterSpacing="0.4" className="font-sans select-none">
                        ◀ JALUR BARAT
                      </text>
                    </g>
                  </g>

                  {/* ── ROUTE 2: JALUR EVAKUASI TIMUR (DPMPTSP -> Melingkar Rapat -> Tangga Timur) ── */}
                  <g id="evac-route-east">
                    {/* Outer Glowing Halo */}
                    <path
                      d="M 850 360 L 1030 360 L 1030 557 L 1120 557"
                      fill="none"
                      className="evac-path-halo"
                    />
                    {/* Animated Neon Green Dashed Path */}
                    <path
                      d="M 850 360 L 1030 360 L 1030 557 L 1120 557"
                      fill="none"
                      className="evac-path-active"
                      markerEnd="url(#evac-arrow-head)"
                    />
                    {/* Direction Guide Pill */}
                    <g transform="translate(890, 342)">
                      <rect x="0" y="0" width="95" height="17" rx="8.5" fill="#15803d" stroke="#22c55e" strokeWidth="1" />
                      <text x="47.5" y="11.5" fill="#ffffff" fontSize="7.5" fontWeight="900" textAnchor="middle" letterSpacing="0.4" className="font-sans select-none">
                        JALUR TIMUR ▶
                      </text>
                    </g>
                  </g>

                  {/* ── ROUTE 3: JALUR EVAKUASI UTAMA SELATAN (Atrium Sentral & Front Office -> Pintu Masuk Utama) ── */}
                  <g id="evac-route-south">
                    {/* Outer Glowing Halo */}
                    <path
                      d="M 635 390 L 635 815"
                      fill="none"
                      className="evac-path-halo"
                    />
                    {/* Animated Neon Green Dashed Path */}
                    <path
                      d="M 635 390 L 635 815"
                      fill="none"
                      className="evac-path-active"
                      markerEnd="url(#evac-arrow-head)"
                    />
                    {/* Direction Guide Pill */}
                    <g transform="translate(575, 680)">
                      <rect x="0" y="0" width="120" height="19" rx="9.5" fill="#15803d" stroke="#22c55e" strokeWidth="1.2" />
                      <text x="60" y="13" fill="#ffffff" fontSize="8" fontWeight="900" textAnchor="middle" letterSpacing="0.5" className="font-sans select-none">
                        ▼ EVAKUASI UTAMA
                      </text>
                    </g>
                  </g>

                  {/* ── TITIK KUMPUL (ASSEMBLY POINT - ISO 7010 E007) AT ATRIUM TENGAH ── */}
                  <g transform="translate(635, 360)" className="assembly-point-bounce" style={{ transformOrigin: '635px 360px' }}>
                    {/* Pulsing Ripple Rings */}
                    <circle cx="0" cy="0" r="46" fill="#22c55e" opacity="0.2" className="animate-ping" style={{ transformOrigin: '0px 0px', animationDuration: '2.5s' }} />
                    <circle cx="0" cy="0" r="32" fill="#16a34a" opacity="0.35" />
                    
                    {/* ISO 7010 Green Safety Square */}
                    <rect x="-26" y="-26" width="52" height="52" rx="8" fill="#15803d" stroke="#ffffff" strokeWidth="2.5" />
                    
                    {/* ISO 7010 Inward 4 Corner Arrows */}
                    {/* Top-Left Arrow */}
                    <path d="M -19 -19 L -11 -11 M -11 -11 L -17 -11 M -11 -11 L -11 -17" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    {/* Top-Right Arrow */}
                    <path d="M 19 -19 L 11 -11 M 11 -11 L 17 -11 M 11 -11 L 11 -17" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    {/* Bottom-Left Arrow */}
                    <path d="M -19 19 L -11 11 M -11 11 L -17 11 M -11 11 L -11 17" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    {/* Bottom-Right Arrow */}
                    <path d="M 19 19 L 11 11 M 11 11 L 17 11 M 11 11 L 11 17" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    
                    {/* Center People Silhouette (3 Family / Staff Figures) */}
                    <circle cx="0" cy="-4" r="2.6" fill="#ffffff" />
                    <path d="M -4 5 Q 0 0.5 4 5 Z" fill="#ffffff" />
                    <circle cx="-6" cy="-0.5" r="2" fill="#ffffff" />
                    <path d="M -9 7 Q -6 3.5 -3 7 Z" fill="#ffffff" />
                    <circle cx="6" cy="-0.5" r="2" fill="#ffffff" />
                    <path d="M 3 7 Q 6 3.5 9 7 Z" fill="#ffffff" />

                    {/* Prominent Assembly Point Text Pill Badge */}
                    <rect x="-75" y="30" width="150" height="22" rx="11" fill="#15803d" stroke="#ffffff" strokeWidth="1.5" filter="drop-shadow(0 3px 8px rgba(0,0,0,0.5))" />
                    <text x="0" y="44.5" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle" letterSpacing="0.6" className="font-sans select-none">
                      ★ TITIK KUMPUL K3 ★
                    </text>
                  </g>

                  {/* ── EXIT BADGE 1: TANGGA BARAT (ISO 7010 EMERGENCY EXIT / RUNNING MAN) ── */}
                  <g transform="translate(100, 430)">
                    <circle cx="0" cy="0" r="26" fill="#22c55e" opacity="0.25" className="animate-ping" style={{ transformOrigin: '0px 0px' }} />
                    {/* Green Emergency Box */}
                    <rect x="-32" y="-18" width="64" height="36" rx="6" fill="#15803d" stroke="#ffffff" strokeWidth="2" />
                    {/* Running Man Silhouette & Exit Door */}
                    <rect x="-26" y="-12" width="13" height="24" fill="#ffffff" rx="1" />
                    <rect x="-24" y="-10" width="9" height="20" fill="#15803d" rx="0.5" />
                    {/* Running Man body */}
                    <circle cx="-3" cy="-7" r="2.5" fill="#ffffff" />
                    <path d="M -6 -2 L -2 -2 L 2 3 L 6 2 M -2 -2 L -4 6 L -8 11 M 0 3 L 3 9" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    {/* Arrow Left */}
                    <path d="M 22 0 L 11 0 M 16 -5 L 11 0 L 16 5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    
                    {/* Label Badge below */}
                    <rect x="-60" y="22" width="120" height="19" rx="9.5" fill="#15803d" stroke="#ffffff" strokeWidth="1.2" />
                    <text x="0" y="34.5" fill="#ffffff" fontSize="7.5" fontWeight="900" textAnchor="middle" letterSpacing="0.4" className="font-sans select-none">
                      PINTU DARURAT BARAT
                    </text>
                  </g>

                  {/* ── EXIT BADGE 2: TANGGA TIMUR (ISO 7010 EMERGENCY EXIT / RUNNING MAN) ── */}
                  <g transform="translate(1145, 557)">
                    <circle cx="0" cy="0" r="26" fill="#22c55e" opacity="0.25" className="animate-ping" style={{ transformOrigin: '0px 0px' }} />
                    {/* Green Emergency Box */}
                    <rect x="-32" y="-18" width="64" height="36" rx="6" fill="#15803d" stroke="#ffffff" strokeWidth="2" />
                    {/* Running Man Silhouette & Exit Door */}
                    <rect x="13" y="-12" width="13" height="24" fill="#ffffff" rx="1" />
                    <rect x="15" y="-10" width="9" height="20" fill="#15803d" rx="0.5" />
                    {/* Running Man body */}
                    <circle cx="-5" cy="-7" r="2.5" fill="#ffffff" />
                    <path d="M -8 -2 L -4 -2 L 0 3 L 4 2 M -4 -2 L -6 6 L -10 11 M -2 3 L 1 9" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    {/* Arrow Right */}
                    <path d="M -22 0 L -11 0 M -16 -5 L -11 0 L -16 5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    
                    {/* Label Badge below */}
                    <rect x="-60" y="22" width="120" height="19" rx="9.5" fill="#15803d" stroke="#ffffff" strokeWidth="1.2" />
                    <text x="0" y="34.5" fill="#ffffff" fontSize="7.5" fontWeight="900" textAnchor="middle" letterSpacing="0.4" className="font-sans select-none">
                      PINTU DARURAT TIMUR
                    </text>
                  </g>

                  {/* ── EXIT BADGE 3: PINTU UTAMA / POS JAGA (ISO 7010 MAIN EXIT / RUNNING MAN) ── */}
                  <g transform="translate(635, 835)">
                    <circle cx="0" cy="0" r="28" fill="#22c55e" opacity="0.25" className="animate-ping" style={{ transformOrigin: '0px 0px' }} />
                    {/* Green Emergency Box */}
                    <rect x="-46" y="-18" width="92" height="36" rx="6" fill="#15803d" stroke="#ffffff" strokeWidth="2" />
                    {/* Running Man and Down Arrow */}
                    <circle cx="-18" cy="-7" r="2.5" fill="#ffffff" />
                    <path d="M -21 -2 L -17 -2 L -13 3 L -9 2 M -17 -2 L -19 6 L -23 11 M -15 3 L -12 9" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    {/* Downward Arrow */}
                    <path d="M 14 -10 L 14 6 M 7 -1 L 14 6 L 21 -1" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    {/* Label Badge */}
                    <text x="-2" y="4" fill="#ffffff" fontSize="8.5" fontWeight="900" textAnchor="middle" letterSpacing="0.4" className="font-sans select-none">
                      KELUAR
                    </text>

                    {/* Label Badge below */}
                    <rect x="-70" y="22" width="140" height="19" rx="9.5" fill="#15803d" stroke="#ffffff" strokeWidth="1.2" />
                    <text x="0" y="34.5" fill="#ffffff" fontSize="7.5" fontWeight="900" textAnchor="middle" letterSpacing="0.5" className="font-sans select-none">
                      PINTU KELUAR UTAMA MPP
                    </text>
                  </g>
                </g>
              )}
            </svg>
                  </div>

          {/* Floating Interactive Legend & Sector Filter Overlay */}
          <FloatingFloorPlanLegend
            activeSector={activeSector}
            onSelectSector={handleSectorFilterChange}
            isDark={isDark}
            position="bottom-left"
            totalMatchingCount={matchingSectorCount}
          />
          </div>
        </div>
      </div>

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
            <div className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-base/70 backdrop-blur-xs">
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
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          <Users className="w-3 h-3 text-blue-400" />
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
                            className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200"
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
                      className="px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-black/25 transition-all flex items-center gap-1.5"
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
                      className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-black/25 transition-all flex items-center gap-1.5"
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
