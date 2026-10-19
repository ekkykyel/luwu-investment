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
  Sun,
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
  Footprints,
  Lock
} from 'lucide-react';
import FloatingFloorPlanLegend, { 
  MppSectorFilter, 
  isNodeInSector, 
  SECTOR_ACCENT_COLORS 
} from './FloatingFloorPlanLegend';

// ── FIGMA EXPORT ASSETS & OVERLAY GEOMETRY (ASET BER-HASH & OPTIMAL) ──
import denahWallLightUrl from './assets/floorplan/DENAH_WALL_LIGHT.svg';
import denahWallDarkUrl from './assets/floorplan/DENAH_WALL_DARK.svg';
import geraiOverlayRaw from './assets/floorplan/GERAI_OVERLAY.svg?raw';
import {
  GeraiOverlayItem,
  parseGeraiOverlay,
  WP_ENTRANCE,
  WP_HUB,
  SVG_ID_MAP,
  NODE_ID_TO_SVG_ID,
  NON_INTERACTIVE_SVG_IDS,
  WAYPOINT_SVG_IDS,
  NEEDS_REVIEW_SVG_IDS,
  HIDDEN_NODE_IDS
} from './assets/floorplan/overlayData';
import {
  STAIR_CONFIGS,
  STAIR_SVG_IDS,
  computeStairUPath
} from './assets/floorplan/stairConfig';
import {
  MPP_CATEGORIES,
  SVG_ID_TO_CATEGORY,
  THIN_CONTOUR_PATH_MAP,
  MppCategoryKey
} from './assets/floorplan/categoryConfig';
import { ISLAND_CONTOUR_HULL_MAP } from './assets/floorplan/islandHullPaths';

// ── K3 MODE EVAKUASI TOGGLE (SEMBUNYIKAN DARI UI, KODE DIPERTAHANKAN) ──
const ENABLE_EMERGENCY_MODE = false;

// ── PARSE ASSETS & BBOX SEKALIGUS DI TINGKAT MODUL (0 RUNTIME REFLOW) ──
const { defs: GERAI_DEFS, items: GERAI_ITEMS } = parseGeraiOverlay(geraiOverlayRaw);

const OVERLAY_BBOXES: Record<string, { x: number; y: number; w: number; h: number; cx: number; cy: number }> = (() => {
  const map: Record<string, { x: number; y: number; w: number; h: number; cx: number; cy: number }> = {};
  GERAI_ITEMS.forEach(it => {
    if (it.bbox) map[it.id] = it.bbox;
  });
  return map;
})();

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
  x?: number;
  y?: number;
  w?: number;
  h?: number;
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

/**
 * Terjemahkan nama zona denah ke Bahasa Indonesia standar tanpa jargon teknis
 */
export function translateZoneToId(zone: string): string {
  if (!zone) return '';
  const z = zone.trim();
  if (z === 'Central Atrium' || z.toLowerCase().includes('atrium')) return 'Atrium Pusat';
  if (z === 'Entrance Flow (Selasar Masuk)' || z.toLowerCase().includes('entrance') || z.toLowerCase().includes('selasar')) return 'Selasar Masuk';
  if (z === 'East Wing (Sayap Timur)' || z.toLowerCase().includes('east wing') || z.toLowerCase().includes('timur')) return 'Sayap Timur';
  if (z === 'West Wing (Sayap Barat)' || z.toLowerCase().includes('west wing') || z.toLowerCase().includes('barat')) return 'Sayap Barat';
  if (z === 'North Wing (Sayap Utara)' || z.toLowerCase().includes('north wing') || z.toLowerCase().includes('utara')) return 'Sayap Utara';
  if (z === 'South Wing (Sayap Selatan)' || z.toLowerCase().includes('south wing') || z.toLowerCase().includes('selatan')) return 'Sayap Selatan';
  return z;
}

export interface FloorNode {
  svgId?: string;
  hidden?: boolean;
  needsReview?: boolean;
  id: string;
  name: string;
  subName?: string;
  category: 'counter' | 'facility' | 'disability' | 'area_terbatas';
  floorLevel?: string;
  roomType?: 'public' | 'area_terbatas';
  zone: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
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
  {
    "id": "gerbang_masuk",
    "name": "PINTU MASUK",
    "subName": "Akses Utama & Scan Barcode",
    "category": "facility",
    "zone": "Entrance Flow (Selasar Masuk)",
    "x": 605,
    "y": 775,
    "w": 100,
    "h": 60,
    "rx": 8,
    "accent": "#10b981",
    "status": "open",
    "services": [
      "Pintu Masuk Otomatis Sensor",
      "Pemeriksaan Suhu & Disinfeksi",
      "Ramp Landai Kursi Roda"
    ],
    "isDisabilityFriendly": true,
    "operatingHours": "07:30 - 16:00 WITA",
    "wayfindingTips": "Pintu gerbang kaca utama menghadap pelataran parkir MPP.",
    "svgId": "PINTU_MASUK"
  },
  {
    "id": "pos_keamanan",
    "name": "POS JAGA",
    "subName": "Petugas Keamanan Satpol PP",
    "category": "facility",
    "zone": "Entrance Flow (Selasar Masuk)",
    "x": 530,
    "y": 760,
    "w": 60,
    "h": 65,
    "rx": 6,
    "accent": "#0891b2",
    "status": "open",
    "services": [
      "Pemeriksaan Keamanan Awal",
      "Pemberian Kartu Visitor/Tamu",
      "Informasi Parkir & Penitipan Barang"
    ],
    "operatingHours": "07:00 - 17:00 WITA",
    "wayfindingTips": "Tepat di sisi barat pintu masuk utama.",
    "svgId": "POS_SECURITY"
  },
  {
    "id": "layanan_mandiri_1",
    "name": "E-KIOSK 1",
    "subName": "Tiket Antrean Mandiri",
    "category": "facility",
    "zone": "Entrance Flow (Selasar Masuk)",
    "x": 535,
    "y": 625,
    "w": 65,
    "h": 44,
    "rx": 8,
    "accent": "#3b82f6",
    "status": "open",
    "services": [
      "Pengambilan Nomor Antrean Berbasis NIK",
      "Pengecekan Kuota Layanan",
      "Cetak Tiket QR Code"
    ],
    "isDisabilityFriendly": true,
    "operatingHours": "07:30 - 15:30 WITA",
    "wayfindingTips": "Setelah pintu kaca masuk, berada di sayap kiri koridor selasar.",
    "svgId": "M_KIOSK"
  },
  {
    "id": "layanan_mandiri_2",
    "name": "E-KIOSK 2",
    "subName": "Tiket Antrean Mandiri",
    "category": "facility",
    "zone": "Entrance Flow (Selasar Masuk)",
    "x": 670,
    "y": 625,
    "w": 65,
    "h": 44,
    "rx": 8,
    "accent": "#3b82f6",
    "status": "open",
    "services": [
      "Pengambilan Nomor Antrean Berbasis NIK",
      "Pengecekan Kuota Layanan",
      "Cetak Tiket QR Code"
    ],
    "isDisabilityFriendly": true,
    "operatingHours": "07:30 - 15:30 WITA",
    "wayfindingTips": "Setelah pintu kaca masuk, berada di sayap kanan koridor selasar.",
    "svgId": "layanan_mandiri_2"
  },
  {
    "id": "front_office",
    "name": "FRONT OFFICE",
    "subName": "Resepsionis & Concierge Sentral",
    "category": "facility",
    "zone": "Entrance Flow (Selasar Masuk)",
    "x": 545,
    "y": 535,
    "w": 180,
    "h": 54,
    "rx": 12,
    "accent": "#6366f1",
    "status": "open",
    "services": [
      "Konsultasi Awal Berkas Layanan",
      "Pemberian Kursi Roda Gratis",
      "Panduan Loket & Pengaduan Cepat",
      "Pemandu Bahasa Isyarat"
    ],
    "deskType": "counter",
    "isDisabilityFriendly": true,
    "operatingHours": "07:30 - 16:00 WITA",
    "wayfindingTips": "Tepat lurus di hadapan pengunjung setelah melewati E-Kiosk.",
    "svgId": "FRONT_OFFICE"
  },
  {
    "id": "IMIGRASI",
    "name": "KANTOR IMIGRASI",
    "subName": "Paspor RI & Dokumen Keimigrasian",
    "category": "counter",
    "zone": "Central Atrium",
    "x": 485,
    "y": 210,
    "w": 85,
    "h": 52,
    "rx": 8,
    "accent": "#06b6d4",
    "status": "open",
    "services": [
      "Permohonan Paspor Baru / Penggantian",
      "Wawancara & Biometrik Paspor Elektronik",
      "Pengambilan Buku Paspor Terbit"
    ],
    "deskType": "booth",
    "isDisabilityFriendly": true,
    "operatingHours": "08:00 - 15:30 WITA",
    "wayfindingTips": "Lingkar Atrium Sisi Barat Laut (Utara).",
    "svgId": "IMIGRASI"
  },
  {
    "id": "KPP_PRATAMA",
    "name": "KPP PRATAMA",
    "subName": "Pelayanan Pajak Pratama Palopo/Luwu",
    "category": "counter",
    "zone": "Central Atrium",
    "x": 590,
    "y": 205,
    "w": 90,
    "h": 52,
    "rx": 8,
    "accent": "#f59e0b",
    "status": "open",
    "services": [
      "Pembuatan / Validasi NPWP Pribadi & Badan",
      "Asistensi Lapor SPT Tahunan Elektronik (E-Filing)",
      "Konsultasi E-Biling & Insentif Pajak"
    ],
    "deskType": "booth",
    "isDisabilityFriendly": true,
    "operatingHours": "08:00 - 15:30 WITA",
    "wayfindingTips": "Lingkar Atrium Sisi Utara Tengah.",
    "svgId": "KPP_PRATAMA"
  },
  {
    "id": "DINSOS",
    "name": "DINAS SOSIAL",
    "subName": "Bansos, DTKS & Rekomendasi Jamkesda",
    "category": "counter",
    "zone": "Central Atrium",
    "x": 700,
    "y": 210,
    "w": 85,
    "h": 52,
    "rx": 8,
    "accent": "#10b981",
    "status": "open",
    "services": [
      "Cek Kepesertaan DTKS Kemensos",
      "Rekomendasi Bantuan BPJS PBI Pemda",
      "Pemberian Alat Bantu Disabilitas"
    ],
    "deskType": "booth",
    "isDisabilityFriendly": true,
    "operatingHours": "08:00 - 15:30 WITA",
    "wayfindingTips": "Lingkar Atrium Sisi Timur Laut (Utara).",
    "svgId": "DINAS_SOSIAL"
  },
  {
    "id": "KEJARI",
    "name": "KEJAKSAAN NEGERI",
    "subName": "Pos Hukum & Pembayaran Denda Tilang",
    "category": "counter",
    "zone": "Central Atrium",
    "x": 810,
    "y": 255,
    "w": 78,
    "h": 50,
    "rx": 8,
    "accent": "#ef4444",
    "status": "open",
    "services": [
      "Konsultasi Hukum Gratis (Datun)",
      "Pengambilan Barang Bukti & Tilang",
      "Layanan Pos Keadilan Restoratif"
    ],
    "deskType": "booth",
    "operatingHours": "08:30 - 15:00 WITA",
    "wayfindingTips": "Lingkar Atrium Sisi Timur Bagian Atas.",
    "svgId": "KEJAKSAAN_NEGERI"
  },
  {
    "id": "HAS",
    "name": "KEMENAG / HALAL",
    "subName": "Sertifikasi Halal & Informasi Haji",
    "category": "counter",
    "zone": "Central Atrium",
    "x": 835,
    "y": 320,
    "w": 78,
    "h": 50,
    "rx": 8,
    "accent": "#10b981",
    "status": "open",
    "services": [
      "Pendaftaran Sertifikasi Halal Gratis (SEHATI)",
      "Konsultasi Porsi Antrean Haji & Umrah",
      "Rekomendasi Bimas Islam"
    ],
    "deskType": "booth",
    "operatingHours": "08:00 - 15:30 WITA",
    "wayfindingTips": "Lingkar Atrium Sisi Timur Bagian Tengah.",
    "svgId": "HAS"
  },
  {
    "id": "BPJS_KET",
    "name": "BPJS KETENAGAKERJAAN",
    "subName": "Jamsostek Perlindungan Pekerja",
    "category": "counter",
    "zone": "Central Atrium",
    "x": 835,
    "y": 385,
    "w": 78,
    "h": 50,
    "rx": 8,
    "accent": "#10b981",
    "status": "open",
    "services": [
      "Klaim Saldo JHT (Jaminan Hari Tua)",
      "Pendaftaran Peserta BPU (Bukan Penerima Upah)",
      "Informasi Program Beasiswa Pekerja"
    ],
    "deskType": "booth",
    "isDisabilityFriendly": true,
    "operatingHours": "08:00 - 15:30 WITA",
    "wayfindingTips": "Lingkar Atrium Sisi Timur Bagian Bawah.",
    "svgId": "BPJS_KETENAGAKERJAAN"
  },
  {
    "id": "BPJS_KES",
    "name": "BPJS KESEHATAN",
    "subName": "JKN-KIS Pelayanan Kesehatan",
    "category": "counter",
    "zone": "Central Atrium",
    "x": 810,
    "y": 450,
    "w": 78,
    "h": 50,
    "rx": 8,
    "accent": "#0284c7",
    "status": "busy",
    "services": [
      "Pendaftaran Peserta Baru JKN-KIS",
      "Perubahan Data & Faskes Tingkat 1",
      "Reaktivasi Kartu KIS PBI / Mandiri"
    ],
    "deskType": "booth",
    "isDisabilityFriendly": true,
    "operatingHours": "08:00 - 15:30 WITA",
    "wayfindingTips": "Lingkar Atrium Sisi Tenggara (Selatan).",
    "svgId": "BPJS_KESEHATAN"
  },
  {
    "id": "PERIKANAN",
    "name": "DINAS PERIKANAN",
    "subName": "Izin Usaha Tambak & Kapal Nelayan",
    "category": "counter",
    "zone": "Central Atrium",
    "x": 700,
    "y": 465,
    "w": 85,
    "h": 52,
    "rx": 8,
    "accent": "#0284c7",
    "status": "open",
    "services": [
      "Rekomendasi BBM Subsidi Nelayan",
      "Surat Tanda Bukti Pendaftaran Kapal (BKP)",
      "Izin Budidaya Perikanan & Rumput Laut"
    ],
    "deskType": "booth",
    "operatingHours": "08:00 - 15:30 WITA",
    "wayfindingTips": "Lingkar Atrium Sisi Selatan Timur.",
    "svgId": "DINAS_PERIKANAN"
  },
  {
    "id": "KOMINFO",
    "name": "DINAS KOMINFO",
    "subName": "Layanan SPBE & Sertifikat Elektronik",
    "category": "counter",
    "zone": "Central Atrium",
    "x": 590,
    "y": 470,
    "w": 90,
    "h": 52,
    "rx": 8,
    "accent": "#06b6d4",
    "status": "open",
    "services": [
      "Penerbitan TTE (Tanda Tangan Elektronik)",
      "Aduan Publik SP4N LAPOR!",
      "Verifikasi Domain & Akses Internet Desa"
    ],
    "deskType": "booth",
    "operatingHours": "08:00 - 15:30 WITA",
    "wayfindingTips": "Lingkar Atrium Sisi Selatan Tengah (Menghadap Front Office).",
    "svgId": "DINAS_KOMINFO"
  },
  {
    "id": "PUPTR",
    "name": "DINAS PUPTR",
    "subName": "Tata Ruang, RDTR & Rekomtek Bangunan",
    "category": "counter",
    "zone": "Central Atrium",
    "x": 485,
    "y": 465,
    "w": 85,
    "h": 52,
    "rx": 8,
    "accent": "#eab308",
    "status": "open",
    "services": [
      "Konsultasi PKKPR / KRK Tata Ruang",
      "Rekomtek Persetujuan Bangunan Gedung (PBG)",
      "Sertifikat Laik Fungsi (SLF) Gedung"
    ],
    "deskType": "booth",
    "operatingHours": "08:00 - 15:30 WITA",
    "wayfindingTips": "Lingkar Atrium Sisi Barat Daya (Selatan).",
    "svgId": "DINAS_PUPTR"
  },
  {
    "id": "PDAM",
    "name": "PDAM TIRTA LUWU",
    "subName": "Sambungan Baru & Pembayaran Air",
    "category": "counter",
    "zone": "Central Atrium",
    "x": 380,
    "y": 450,
    "w": 78,
    "h": 50,
    "rx": 8,
    "accent": "#3b82f6",
    "status": "open",
    "services": [
      "Pendaftaran Sambungan Rumah Baru",
      "Pembayaran Rekening Tagihan Air Bersih",
      "Pengaduan Kebocoran Pipa & Tera Meteran"
    ],
    "deskType": "booth",
    "operatingHours": "08:00 - 15:30 WITA",
    "wayfindingTips": "Lingkar Atrium Sisi Barat Daya.",
    "svgId": "PDAM"
  },
  {
    "id": "TASPEN",
    "name": "PT TASPEN (PERSERO)",
    "subName": "Tabungan & Asuransi Pensiun ASN",
    "category": "counter",
    "zone": "Central Atrium",
    "x": 355,
    "y": 385,
    "w": 78,
    "h": 50,
    "rx": 8,
    "accent": "#8b5cf6",
    "status": "open",
    "services": [
      "Klaim Hak Tabungan Hari Tua ASN",
      "Otentikasi Pensiun Digital Melalui Smartphone",
      "Klaim Jaminan Kematian & Kecelakaan Kerja"
    ],
    "deskType": "booth",
    "isDisabilityFriendly": true,
    "operatingHours": "08:00 - 15:30 WITA",
    "wayfindingTips": "Lingkar Atrium Sisi Barat Bagian Bawah.",
    "svgId": "TASPEN"
  },
  {
    "id": "NERVIS",
    "name": "NERVIS & BPS",
    "subName": "Statistik & Pelayanan Tenaga Kerja",
    "category": "counter",
    "zone": "Central Atrium",
    "x": 355,
    "y": 320,
    "w": 78,
    "h": 50,
    "rx": 8,
    "accent": "#d97706",
    "status": "open",
    "services": [
      "Permintaan Data Statistik Luwu",
      "Konsultasi Metadata Sektoral",
      "Pelayanan Terpadu BPS"
    ],
    "deskType": "booth",
    "operatingHours": "08:00 - 15:30 WITA",
    "wayfindingTips": "Lingkar Atrium Sisi Barat Bagian Tengah.",
    "svgId": "NERVIS"
  },
  {
    "id": "BPN",
    "name": "KANTOR PERTANAHAN (BPN)",
    "subName": "Peralihan Hak, Sertipikat & Roya",
    "category": "counter",
    "zone": "Central Atrium",
    "x": 380,
    "y": 255,
    "w": 78,
    "h": 50,
    "rx": 8,
    "accent": "#d97706",
    "status": "open",
    "services": [
      "Pengecekan Sertipikat Hak Milik (SHM)",
      "Pencoretan Hak Tanggungan (Roya Elektronik)",
      "Surat Keterangan Pendaftaran Tanah (SKPT)"
    ],
    "deskType": "booth",
    "isDisabilityFriendly": true,
    "operatingHours": "08:00 - 15:30 WITA",
    "wayfindingTips": "Lingkar Atrium Sisi Barat Laut.",
    "svgId": "BPN"
  },
  {
    "id": "DUKCAPIL_N",
    "name": "DUKCAPIL (CETAK)",
    "subName": "Loket Cetak Cepat KTP & KIA",
    "category": "counter",
    "zone": "West Wing (Sayap Barat)",
    "x": 281,
    "y": 80,
    "w": 92,
    "h": 82,
    "rx": 8,
    "accent": "#10b981",
    "status": "open",
    "services": [
      "Pencetakan KTP-el Rusak / Hilang",
      "Cetak Kartu Identitas Anak (KIA)",
      "Aktivasi Identitas Kependudukan Digital (IKD)"
    ],
    "deskType": "booth",
    "isDisabilityFriendly": true,
    "operatingHours": "07:30 - 16:00 WITA",
    "wayfindingTips": "Sayap Barat bagian utara, sejajar dengan toilet pria.",
    "svgId": "DUKCAPIL_3"
  },
  {
    "id": "DUKCAPIL_W1",
    "name": "DUKCAPIL (KTP-EL)",
    "subName": "Perekaman Biometrik & Foto KTP",
    "category": "counter",
    "zone": "West Wing (Sayap Barat)",
    "x": 70,
    "y": 268,
    "w": 105,
    "h": 85,
    "rx": 8,
    "accent": "#10b981",
    "status": "open",
    "services": [
      "Perekaman Sidik Jari & Iris Mata KTP Pemula",
      "Pengambilan Foto Digital KTP",
      "Pembaruan Data NIK Nasional"
    ],
    "deskType": "booth",
    "isDisabilityFriendly": true,
    "operatingHours": "07:30 - 16:00 WITA",
    "wayfindingTips": "Sayap Barat luar, dekat toilet wanita.",
    "svgId": "DUKCAPIL_W1"
  },
  {
    "id": "DUKCAPIL_W2",
    "name": "DUKCAPIL (KK & PINDAH)",
    "subName": "Kartu Keluarga & Surat Mutasi",
    "category": "counter",
    "zone": "West Wing (Sayap Barat)",
    "x": 183,
    "y": 268,
    "w": 105,
    "h": 85,
    "rx": 8,
    "accent": "#10b981",
    "status": "open",
    "services": [
      "Penerbitan Kartu Keluarga Barcode",
      "Surat Keterangan Pindah WNI (SKPWNI)",
      "Konsolidasi NIK Bermasalah / BPJS"
    ],
    "deskType": "booth",
    "isDisabilityFriendly": true,
    "operatingHours": "07:30 - 16:00 WITA",
    "wayfindingTips": "Sayap Barat dalam, bersebelahan dengan DUKCAPIL W1.",
    "svgId": "DUKCAPIL_W2"
  },
  {
    "id": "DUKCAPIL_W3",
    "name": "DUKCAPIL (AKTA CAPIL)",
    "subName": "Akta Kelahiran, Kematian & Kawin",
    "category": "counter",
    "zone": "West Wing (Sayap Barat)",
    "x": 183,
    "y": 393,
    "w": 105,
    "h": 74,
    "rx": 8,
    "accent": "#10b981",
    "status": "open",
    "services": [
      "Penerbitan Akta Kelahiran Anak Baru",
      "Penerbitan Akta Kematian",
      "Pencatatan Perkawinan Non-Muslim"
    ],
    "deskType": "booth",
    "isDisabilityFriendly": true,
    "operatingHours": "07:30 - 16:00 WITA",
    "wayfindingTips": "Sayap Barat dalam, di atas Ruang Laktasi.",
    "svgId": "DUKCAPIL_W3"
  },
  {
    "id": "layanan_disabilitas",
    "name": "LAYANAN DISABILITAS",
    "subName": "Jalur Fast-Track & Ramah Inklusif",
    "category": "disability",
    "zone": "West Wing (Sayap Barat)",
    "x": 70,
    "y": 475,
    "w": 105,
    "h": 75,
    "rx": 8,
    "accent": "#06b6d4",
    "status": "open",
    "services": [
      "Pendamping Khusus Bahasa Isyarat",
      "Kiosk Layar Rendah (Tinggi Meja 75 cm)",
      "Peminjaman Kursi Roda Elektrik / Manual",
      "Prioritas Bebas Antrean Reguler"
    ],
    "deskType": "counter",
    "isDisabilityFriendly": true,
    "operatingHours": "07:30 - 16:00 WITA",
    "wayfindingTips": "Sayap Barat, dekat pintu mushalla dan jalur kuning pemandu lantai.",
    "svgId": "LAYANAN_PRIORITAS"
  },
  {
    "id": "ruang_perawatan",
    "name": "RUANG LAKTASI",
    "subName": "Pojok Laktasi & Ibu Menyusui",
    "category": "facility",
    "zone": "West Wing (Sayap Barat)",
    "x": 183,
    "y": 475,
    "w": 105,
    "h": 75,
    "rx": 8,
    "accent": "#ec4899",
    "status": "open",
    "services": [
      "Bilik Privat Menyusui Higienis",
      "Kulkas Penyimpan ASI & Sterilizer Botol",
      "Sofa Ergonomis & Wastafel Hangat",
      "Popok Bayi Darurat Gratis"
    ],
    "operatingHours": "07:30 - 16:00 WITA",
    "wayfindingTips": "Sayap Barat, tepat di sebelah Layanan Disabilitas.",
    "svgId": "RUANG_LAKTASI"
  },
  {
    "id": "toilet_wanita",
    "name": "TOILET WANITA",
    "subName": "Sanitasi & Toilet Difabel",
    "category": "facility",
    "zone": "West Wing (Sayap Barat)",
    "x": 70,
    "y": 175,
    "w": 105,
    "h": 85,
    "rx": 8,
    "accent": "#0891b2",
    "status": "open",
    "services": [
      "Kloset Duduk Ramah Disabilitas",
      "Pegangan Handrail Pengaman",
      "Wastafel Otomatis & Cermin"
    ],
    "isDisabilityFriendly": true,
    "operatingHours": "07:00 - 17:00 WITA",
    "wayfindingTips": "Sayap Barat sudut barat laut.",
    "svgId": "TOILET_WANITA"
  },
  {
    "id": "ruang_istirahat",
    "name": "RUANG ISTIRAHAT",
    "subName": "Locker & Istirahat Petugas",
    "category": "facility",
    "zone": "West Wing (Sayap Barat)",
    "x": 183,
    "y": 175,
    "w": 105,
    "h": 85,
    "rx": 8,
    "accent": "#475569",
    "status": "open",
    "services": [
      "Area Transit Petugas Front Office",
      "Locker Pribadi Pegawai",
      "Dispenser Air Minum"
    ],
    "operatingHours": "07:00 - 17:00 WITA",
    "wayfindingTips": "Sayap Barat bersebelahan dengan toilet wanita.",
    "svgId": "ruang_istirahat"
  },
  {
    "id": "mushalla",
    "name": "MUSHALLA",
    "subName": "Sarana Ibadah Representatif",
    "category": "facility",
    "zone": "West Wing (Sayap Barat)",
    "x": 183,
    "y": 563,
    "w": 95,
    "h": 82,
    "rx": 8,
    "accent": "#10b981",
    "status": "open",
    "services": [
      "Tempat Wudhu Pria & Wanita Terpisah",
      "Mukena, Sarung & Sajadah Bersih",
      "Ruang Sholat Berpenyejuk Udara (AC)"
    ],
    "isDisabilityFriendly": true,
    "operatingHours": "07:00 - 18:00 WITA",
    "wayfindingTips": "Sayap Barat Daya, dekat Pojok Baca.",
    "svgId": "MUSHALLA"
  },
  {
    "id": "ruang_baca",
    "name": "POJOK BACA",
    "subName": "Perpustakaan & Literasi Digital",
    "category": "facility",
    "zone": "West Wing (Sayap Barat)",
    "x": 286,
    "y": 563,
    "w": 95,
    "h": 82,
    "rx": 8,
    "accent": "#06b6d4",
    "status": "open",
    "services": [
      "Koleksi Buku Regulasi & Ensiklopedia",
      "Akses Tablet E-Book Perpustakaan Daerah",
      "Stasiun Pengisian Daya Gawai Gratis"
    ],
    "deskType": "counter",
    "operatingHours": "08:00 - 16:00 WITA",
    "wayfindingTips": "Sayap Barat Daya, dekat Lobby Tunggu Barat.",
    "svgId": "RUANG_BACA"
  },
  {
    "id": "toilet_pria",
    "name": "TOILET PRIA",
    "subName": "Sanitasi & Urinoir",
    "category": "facility",
    "zone": "North Wing (Sayap Utara)",
    "x": 183,
    "y": 80,
    "w": 92,
    "h": 82,
    "rx": 8,
    "accent": "#0891b2",
    "status": "open",
    "services": [
      "Urinoir Otomatis",
      "Kloset Duduk & Handrail Difabel",
      "Wastafel Bersih"
    ],
    "isDisabilityFriendly": true,
    "operatingHours": "07:00 - 17:00 WITA",
    "wayfindingTips": "Sayap Utara sudut barat laut.",
    "svgId": "TOILET_PRIA"
  },
  {
    "id": "DPMPTSP_N",
    "name": "DPMPTSP (OSS-RBA)",
    "subName": "Perizinan Berusaha & NIB Mandiri",
    "category": "counter",
    "zone": "East Wing (Sayap Timur)",
    "x": 975,
    "y": 245,
    "w": 110,
    "h": 95,
    "rx": 8,
    "accent": "#059669",
    "status": "open",
    "services": [
      "Penerbitan Nomor Induk Berusaha (NIB OSS)",
      "Persetujuan Kesesuaian Ruang (PKKPR Mandiri)",
      "Bimbingan Perizinan Sektor Pertanian & UMKM"
    ],
    "deskType": "booth",
    "isDisabilityFriendly": true,
    "operatingHours": "08:00 - 16:00 WITA",
    "wayfindingTips": "Sayap Timur bagian tengah, di samping Ruang Rapat.",
    "svgId": "DPMPTSP_2"
  },
  {
    "id": "DPMPTSP_S",
    "name": "DPMPTSP (INVESTASI)",
    "subName": "Katalog IPRO & Liaison Officer VIP",
    "category": "counter",
    "zone": "East Wing (Sayap Timur)",
    "x": 975,
    "y": 415,
    "w": 110,
    "h": 95,
    "rx": 8,
    "accent": "#059669",
    "status": "open",
    "services": [
      "Konsultasi Investasi Korporasi / UMKM",
      "Penyusunan Kemitraan Lokal & Insentif Pajak",
      "Fasilitasi Kendala Usaha (Debottlenecking)"
    ],
    "deskType": "booth",
    "isDisabilityFriendly": true,
    "operatingHours": "08:00 - 16:00 WITA",
    "wayfindingTips": "Sayap Timur bagian bawah, dekat Ruang Bermain Anak.",
    "svgId": "DPMPTSP_1"
  },
  {
    "id": "ruang_tim_teknis",
    "name": "RUANG TIM TEKNIS",
    "subName": "Verifikasi Lintas OPD & Sidang Teknis",
    "category": "facility",
    "zone": "East Wing (Sayap Timur)",
    "x": 873,
    "y": 80,
    "w": 198,
    "h": 82,
    "rx": 8,
    "accent": "#6366f1",
    "status": "open",
    "services": [
      "10 Workstation Lintas OPD Bersama",
      "Pemeriksaan Gambar Arsitektur PBG",
      "Sidang Pertimbangan Dokumen Lingkungan (AMDAL/UKL-UPL)"
    ],
    "deskType": "workstation",
    "operatingHours": "08:00 - 16:00 WITA",
    "wayfindingTips": "Sayap Timur bagian utara atas.",
    "svgId": "TIM_TEKNIS"
  },
  {
    "id": "ruang_rapat",
    "name": "RUANG RAPAT KOORDINASI",
    "subName": "Executive Boardroom VIP",
    "category": "facility",
    "zone": "East Wing (Sayap Timur)",
    "x": 1093,
    "y": 250,
    "w": 98,
    "h": 265,
    "rx": 8,
    "accent": "#6366f1",
    "status": "open",
    "services": [
      "Ruang Sidang Koordinasi Investasi",
      "Proyektor & Smart TV Video Conference",
      "Kapasitas 25 Orang Tamu Dinas"
    ],
    "deskType": "conference",
    "operatingHours": "Sesuai Jadwal Reservasi",
    "wayfindingTips": "Sayap Timur terluar, memanjang vertikal.",
    "svgId": "RUANG_RAPAT"
  },
  {
    "id": "smoking_area",
    "name": "SMOKING AREA",
    "subName": "Area Terbuka / Balkon Khusus",
    "category": "facility",
    "zone": "East Wing (Sayap Timur)",
    "x": 1077,
    "y": 80,
    "w": 115,
    "h": 82,
    "rx": 8,
    "accent": "#0891b2",
    "status": "open",
    "services": [
      "Area Merokok Khusus Terbuka",
      "Ventilasi Alami Sirkulasi Udara",
      "Asbak Pemadam Puntung Rokok"
    ],
    "operatingHours": "07:00 - 17:00 WITA",
    "wayfindingTips": "Sayap Timur sudut timur laut luar.",
    "svgId": "SMOKING_AREA"
  },
  {
    "id": "ruang_bermain_anak",
    "name": "RUANG BERMAIN ANAK",
    "subName": "Kids Play Corner Edukatif",
    "category": "facility",
    "zone": "East Wing (Sayap Timur)",
    "x": 888,
    "y": 563,
    "w": 190,
    "h": 82,
    "rx": 8,
    "accent": "#f59e0b",
    "status": "open",
    "services": [
      "Mainan Lunak Berstandar SNI",
      "Lantai Matras Busa Aman Anti-Benturan",
      "Pojok Gambar Mewarnai & Buku Dongeng"
    ],
    "operatingHours": "07:30 - 16:00 WITA",
    "wayfindingTips": "Sayap Timur bagian selatan, bersebelahan dengan Lobby Timur.",
    "svgId": "ruang_bermain_anak"
  },
  {
    "id": "SAMSAT",
    "name": "SAMSAT WILAYAH LUWU",
    "subName": "Pajak Kendaraan Bermotor & STNK",
    "category": "counter",
    "zone": "North Wing (Sayap Utara)",
    "x": 379,
    "y": 80,
    "w": 92,
    "h": 82,
    "rx": 8,
    "accent": "#8b5cf6",
    "status": "busy",
    "services": [
      "Pengesahan STNK 1 Tahunan",
      "Pembayaran PKB & SWDKLLJ Kendaraan",
      "Cek Blokir Kendaraan"
    ],
    "deskType": "booth",
    "operatingHours": "08:00 - 15:00 WITA",
    "wayfindingTips": "Sayap Utara sebelah DUKCAPIL Cetak.",
    "svgId": "SAMSAT"
  },
  {
    "id": "NAKERTRANS",
    "name": "DISNAKERTRANS",
    "subName": "Kartu Kuning AK-1 & Transmigrasi",
    "category": "counter",
    "zone": "North Wing (Sayap Utara)",
    "x": 477,
    "y": 80,
    "w": 92,
    "h": 82,
    "rx": 8,
    "accent": "#06b6d4",
    "status": "open",
    "services": [
      "Penerbitan Kartu Pencari Kerja AK-1",
      "Informasi Lowongan Kerja Perusahaan Lokal",
      "Pendaftaran Program Pelatihan Kerja BLK"
    ],
    "deskType": "booth",
    "operatingHours": "08:00 - 15:30 WITA",
    "wayfindingTips": "Sayap Utara sebelah SAMSAT.",
    "svgId": "DISNAKERTANS"
  },
  {
    "id": "BAPENDA",
    "name": "BAPENDA LUWU",
    "subName": "PBB-P2, BPHTB & Pajak Daerah",
    "category": "counter",
    "zone": "North Wing (Sayap Utara)",
    "x": 575,
    "y": 80,
    "w": 92,
    "h": 82,
    "rx": 8,
    "accent": "#f59e0b",
    "status": "open",
    "services": [
      "Cetak SPPT PBB-P2 & Pemutakhiran Objek",
      "Validasi Bea Perolehan Hak Tanah (BPHTB)",
      "Surat Bebas Pajak Daerah"
    ],
    "deskType": "booth",
    "operatingHours": "08:00 - 15:30 WITA",
    "wayfindingTips": "Sayap Utara tengah.",
    "svgId": "BAPENDA"
  },
  {
    "id": "DEKRANASDA",
    "name": "DEKRANASDA & UMKM",
    "subName": "Galeri Produk Unggulan Luwu",
    "category": "facility",
    "zone": "North Wing (Sayap Utara)",
    "x": 673,
    "y": 80,
    "w": 92,
    "h": 82,
    "rx": 8,
    "accent": "#ec4899",
    "status": "open",
    "services": [
      "Showcase Produk Kopi & Cokelat Luwu",
      "Kerajinan Tangan Tenun Tradisional",
      "Konsultasi Sertifikasi & Kemasan Produk"
    ],
    "deskType": "counter",
    "operatingHours": "08:00 - 16:00 WITA",
    "wayfindingTips": "Sayap Utara tengah, bersebelahan dengan Bank Sulselbar.",
    "svgId": "DEKRANASDA"
  },
  {
    "id": "SULSELBAR",
    "name": "BANK SULSELBAR",
    "subName": "Teller Kasda & Transaksi Perbankan",
    "category": "counter",
    "zone": "North Wing (Sayap Utara)",
    "x": 771,
    "y": 80,
    "w": 96,
    "h": 82,
    "rx": 8,
    "accent": "#3b82f6",
    "status": "open",
    "services": [
      "Pembayaran Retribusi & Pajak Daerah",
      "Layanan Teller Tunai & Non-Tunai",
      "Pembukaan Rekening ASN & Umum"
    ],
    "deskType": "teller",
    "operatingHours": "08:00 - 15:00 WITA",
    "wayfindingTips": "Sayap Utara sebelah barat Ruang Tim Teknis.",
    "svgId": "BPD_SULSELBAR"
  },
  {
    "id": "tangga_naik_w",
    "name": "TANGGA UTARA",
    "subName": "Akses Lantai 2 Sayap Utara",
    "category": "facility",
    "zone": "North Wing (Sayap Utara)",
    "x": 70,
    "y": 393,
    "w": 105,
    "h": 74,
    "rx": 8,
    "accent": "#475569",
    "status": "open",
    "services": [
      "Akses Tangga Lantai 2",
      "Handrail Stainless Steel",
      "Step Nosing Anti-Slip"
    ],
    "isDisabilityFriendly": false,
    "operatingHours": "07:00 - 17:00 WITA",
    "wayfindingTips": "Di bawah DUKCAPIL KTP-el (Sayap Utara).",
    "svgId": "TANGGA_UTARA"
  },
  {
    "id": "tangga_naik_ne",
    "name": "TANGGA SELATAN",
    "subName": "Akses Lantai 2 Sayap Selatan",
    "category": "facility",
    "zone": "South Wing (Sayap Selatan)",
    "x": 1110,
    "y": 170,
    "w": 82,
    "h": 65,
    "rx": 6,
    "accent": "#475569",
    "status": "open",
    "services": [
      "Akses Tangga Lantai 2",
      "Dekat Smoking Area",
      "Penerangan Sensor Gerak"
    ],
    "isDisabilityFriendly": false,
    "operatingHours": "07:00 - 17:00 WITA",
    "wayfindingTips": "Di samping Smoking Area (Sayap Selatan).",
    "svgId": "TANGGA_SELATAN_TIMUR"
  },
  {
    "id": "tangga_naik_se",
    "name": "TANGGA SELATAN",
    "subName": "Akses Lantai 2 Sayap Selatan",
    "category": "facility",
    "zone": "South Wing (Sayap Selatan)",
    "x": 1110,
    "y": 525,
    "w": 82,
    "h": 65,
    "rx": 6,
    "accent": "#475569",
    "status": "open",
    "services": [
      "Akses Tangga VIP",
      "Handrail Pengaman",
      "Akses Ruang Rapat"
    ],
    "isDisabilityFriendly": false,
    "operatingHours": "07:00 - 17:00 WITA",
    "wayfindingTips": "Di bawah Ruang Rapat (Sayap Selatan).",
    "svgId": "TANGGA_SELATAN_BARAT"
  },
  {
    "id": "lobby_kiri",
    "name": "LOBBY UTARA",
    "subName": "Ruang Tunggu Pemohon Utara",
    "category": "facility",
    "zone": "North Wing (Sayap Utara)",
    "x": 375,
    "y": 565,
    "w": 120,
    "h": 65,
    "rx": 10,
    "accent": "#475569",
    "status": "open",
    "services": [
      "Kursi Tunggu Pemohon Layanan",
      "Display TV Informasi Antrean",
      "Charging Station Gratis"
    ],
    "isDisabilityFriendly": true,
    "operatingHours": "07:30 - 16:00 WITA",
    "wayfindingTips": "Di sebelah kiri E-KIOSK 1 (Sayap Utara).",
    "svgId": "lobby_kiri"
  },
  {
    "id": "lobby_kanan",
    "name": "LOBBY SELATAN",
    "subName": "Ruang Tunggu Pemohon Selatan",
    "category": "facility",
    "zone": "South Wing (Sayap Selatan)",
    "x": 775,
    "y": 565,
    "w": 120,
    "h": 65,
    "rx": 10,
    "accent": "#475569",
    "status": "open",
    "services": [
      "Kursi Tunggu Pemohon Layanan",
      "Display TV Informasi Antrean",
      "Charging Station Gratis"
    ],
    "isDisabilityFriendly": true,
    "operatingHours": "07:30 - 16:00 WITA",
    "wayfindingTips": "Di sebelah kanan E-KIOSK 2 (Sayap Selatan).",
    "svgId": "lobby_kanan"
  },
  {
    "id": "PT_HAS",
    "svgId": "PT_HAS",
    "name": "PT. HAS (Halal Assurance System)",
    "subName": "Layanan Sertifikasi Halal & Penjamin Mutu Produk",
    "category": "counter",
    "zone": "West Wing (Sayap Barat)",
    "accent": "#0284c7",
    "status": "open",
    "services": [],
    "needsReview": true
  },
  {
    "id": "DUKCAPIL_1",
    "svgId": "DUKCAPIL_1",
    "name": "DUKCAPIL Loket 1",
    "subName": "Layanan Administrasi Kependudukan",
    "category": "counter",
    "zone": "North Wing (Sayap Utara)",
    "accent": "#0284c7",
    "status": "open",
    "services": [],
    "needsReview": true
  },
  {
    "id": "DUKCAPIL_2",
    "svgId": "DUKCAPIL_2",
    "name": "DUKCAPIL Loket 2",
    "subName": "Layanan Administrasi Kependudukan",
    "category": "counter",
    "zone": "North Wing (Sayap Utara)",
    "accent": "#0284c7",
    "status": "open",
    "services": [],
    "needsReview": true
  },
  {
    "id": "PT_NEVIS",
    "svgId": "PT_NEVIS",
    "name": "PT. Nevis",
    "subName": "Layanan Mitra & Jasa Konsultasi",
    "category": "counter",
    "zone": "West Wing (Sayap Barat)",
    "accent": "#0284c7",
    "status": "open",
    "services": [],
    "needsReview": true
  },
  {
    "id": "BPS",
    "svgId": "BPS",
    "name": "Badan Pusat Statistik (BPS)",
    "subName": "Pelayanan Statistik Terpadu (PST)",
    "category": "counter",
    "zone": "West Wing (Sayap Barat)",
    "accent": "#0284c7",
    "status": "open",
    "services": [],
    "needsReview": true
  },
  {
    "id": "CHARGING_AREA",
    "svgId": "CHARGING_AREA",
    "name": "Charging Area",
    "subName": "Fasilitas Pengisian Daya Gawai Pengunjung",
    "category": "facility",
    "zone": "Central Atrium",
    "accent": "#10b981",
    "status": "open",
    "services": [],
    "needsReview": true
  },
  {
    "id": "LAYANAN_BERBANTUAN",
    "svgId": "LAYANAN_BERBANTUAN",
    "name": "Layanan Berbantuan",
    "subName": "Pendampingan Khusus & Konsultasi Mandiri Terpandu",
    "category": "facility",
    "zone": "Entrance Flow (Selasar Masuk)",
    "accent": "#6366f1",
    "status": "open",
    "services": [],
    "needsReview": true
  },
  {
    "id": "DINAS_KESEHATAN",
    "svgId": "DINAS_KESEHATAN",
    "name": "Dinas Kesehatan",
    "subName": "Rekomendasi Izin Praktik & Sarana Tenaga Medis",
    "category": "counter",
    "zone": "West Wing (Sayap Barat)",
    "accent": "#0284c7",
    "status": "open",
    "services": [],
    "needsReview": true
  },
  {
    "id": "gudang",
    "svgId": "GUDANG",
    "name": "Gudang",
    "subName": "Gudang Penyimpanan Logistik (Lantai 1)",
    "category": "area_terbatas",
    "floorLevel": "Lantai 1",
    "roomType": "area_terbatas",
    "zone": "South Wing (Sayap Selatan)",
    "accent": "#f97316",
    "status": "closed",
    "services": [],
    "isDisabilityFriendly": false,
    "operatingHours": "Akses Khusus Petugas",
    "wayfindingTips": "Sayap Selatan samping Tangga Selatan Timur."
  },
  {
    "id": "dukcapil_server",
    "svgId": "DUKCAPIL_SERVER",
    "name": "Ruang Server",
    "subName": "Ruang Server Jaringan & Database SIAK (Lantai 1)",
    "category": "area_terbatas",
    "floorLevel": "Lantai 1",
    "roomType": "area_terbatas",
    "zone": "North Wing (Sayap Utara)",
    "accent": "#f97316",
    "status": "closed",
    "services": [],
    "isDisabilityFriendly": false,
    "operatingHours": "24 Jam Operasional (Khusus Operator)",
    "wayfindingTips": "Sayap Utara samping Tangga Utara."
  },
  {
    "id": "gudang_2",
    "svgId": "GUDANG_2",
    "name": "Gudang (Usulan)",
    "subName": "Ruang Gudang Sayap Selatan-Barat (Lantai 1 - Menunggu Konfirmasi)",
    "category": "area_terbatas",
    "floorLevel": "Lantai 1",
    "roomType": "area_terbatas",
    "zone": "South Wing (Sayap Selatan)",
    "accent": "#f97316",
    "status": "closed",
    "services": [],
    "isDisabilityFriendly": false,
    "operatingHours": "Akses Khusus Petugas",
    "wayfindingTips": "Sayap Selatan samping Tangga Selatan Barat."
  }
];


function InteractiveFloorPlanComponent({ 
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
  const [zoomLevel, setZoomLevel] = useState<number>(1.05);
  const [viewMode, setViewMode] = useState<'map' | 'list'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return 'list';
    }
    return 'map';
  });
  const [isWayfindingActive, setIsWayfindingActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [localIsDark, setLocalIsDark] = useState<boolean | null>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  // Ref untuk root section dan tombol fullscreen untuk kembalikan fokus
  const sectionRef = useRef<HTMLDivElement>(null);
  const fullscreenBtnRef = useRef<HTMLButtonElement>(null);

  // Deteksi pointer coarse (layar sentuh mobile) untuk sembunyikan badge F & tooltip
  const [isPointerCoarse, setIsPointerCoarse] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(pointer: coarse)');
    const handler = (e: MediaQueryListEvent) => setIsPointerCoarse(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Ref untuk container chip tab
  const chipsContainerRef = useRef<HTMLDivElement>(null);

  // Mobile screen detection for cropped building viewBox (memenuhi lebar layar)
  const [isMobileScreen, setIsMobileScreen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 640 : false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync or override local theme state
  const effectiveIsDark = localIsDark !== null ? localIsDark : isDark;

  // Auto-scroll chip aktif ke tengah
  useEffect(() => {
    if (!chipsContainerRef.current) return;
    const activeBtn = chipsContainerRef.current.querySelector<HTMLElement>('[data-active="true"]');
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeFilter, activeSector]);

  // Debug overlay detection (?debug=route)
  const isDebugRoute = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('debug') === 'route';
  }, []);

  // Fullscreen Pan & Pinch Gesture States (Ref + rAF: 0 React re-renders during motion)
  const [fullscreenScale, setFullscreenScale] = useState(1);
  const [fullscreenPosition, setFullscreenPosition] = useState({ x: 0, y: 0 });
  const [isGestureActive, setIsGestureActive] = useState(false);

  const transformTargetRef = useRef<HTMLDivElement | null>(null);
  const gestureStateRef = useRef({ x: 0, y: 0, scale: 1 });
  const isDraggingRef = useRef(false);
  const startPanRef = useRef({ x: 0, y: 0 });
  const lastTouchDistanceRef = useRef<number | null>(null);
  const rafGestureRef = useRef<number | null>(null);
  const timerIdsRef = useRef<number[]>([]);

  // Device tier & reduced motion detection
  const isLowEndDevice = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    const nav = navigator as any;
    const lowMem = nav.deviceMemory && nav.deviceMemory <= 4;
    const lowCores = nav.hardwareConcurrency && nav.hardwareConcurrency <= 4;
    const saveData = nav.connection && nav.connection.saveData === true;
    return Boolean(lowMem || lowCores || saveData);
  }, []);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const safeSetTimeout = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timerIdsRef.current.push(id);
    return id;
  }, []);

  // Bersihkan semua timer aktif saat unmount (mencegah memory leak)
  useEffect(() => {
    return () => {
      timerIdsRef.current.forEach(id => clearTimeout(id));
      if (rafGestureRef.current !== null) cancelAnimationFrame(rafGestureRef.current);
    };
  }, []);

  // Update transform style langsung via rAF (60-120fps direct hardware composition)
  const scheduleTransformUpdate = useCallback(() => {
    if (rafGestureRef.current !== null) return;
    rafGestureRef.current = requestAnimationFrame(() => {
      if (transformTargetRef.current) {
        const { x, y, scale } = gestureStateRef.current;
        transformTargetRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
      }
      rafGestureRef.current = null;
    });
  }, []);

  // Sync zoom states when isFullscreen changes
  useEffect(() => {
    gestureStateRef.current = { x: 0, y: 0, scale: 1 };
    setFullscreenScale(1);
    setFullscreenPosition({ x: 0, y: 0 });
    if (transformTargetRef.current) {
      transformTargetRef.current.style.transform = '';
    }
  }, [isFullscreen]);

  // Stair style variants (Varian A vs Varian B per user directive)
  const [stairVariant, setStairVariant] = useState<'A' | 'B'>('A');

  const stairColors = useMemo(() => {
    if (stairVariant === 'B') {
      return {
        body: effectiveIsDark ? '#1E3A5F' : '#EEF2F7',
        tread: effectiveIsDark ? '#334155' : '#ffffff',
        stroke: '#64748b',
        chevron: effectiveIsDark ? '#cbd5e1' : '#475569',
        dotStroke: effectiveIsDark ? '#1E3A5F' : '#EEF2F7'
      };
    }
    // Varian A (Default: Mengikuti token tema denah arsitektur)
    return {
      body: effectiveIsDark ? 'var(--fp-stair-body, #1e293b)' : 'var(--fp-stair-body, #ffffff)',
      tread: effectiveIsDark ? 'var(--fp-stair-tread, #334155)' : 'var(--fp-stair-tread, #94a3b8)',
      stroke: 'var(--fp-stair-stroke, #64748b)',
      chevron: effectiveIsDark ? 'var(--fp-stair-chevron, #94a3b8)' : 'var(--fp-stair-chevron, #475569)',
      dotStroke: effectiveIsDark ? 'var(--fp-stair-body, #1e293b)' : 'var(--fp-stair-body, #ffffff)'
    };
  }, [stairVariant, effectiveIsDark]);

  const handleFullscreenMouseDown = (e: React.MouseEvent) => {
    if (!isFullscreen) return;
    e.preventDefault();
    isDraggingRef.current = true;
    setIsGestureActive(true);
    startPanRef.current = {
      x: e.clientX - gestureStateRef.current.x,
      y: e.clientY - gestureStateRef.current.y
    };
  };

  const handleFullscreenMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !isFullscreen) return;
    const newX = e.clientX - startPanRef.current.x;
    const newY = e.clientY - startPanRef.current.y;
    
    const currentScale = gestureStateRef.current.scale;
    const limitX = Math.max(0, 800 * (currentScale - 1));
    const limitY = Math.max(0, 500 * (currentScale - 1));
    const clampedX = Math.max(-limitX, Math.min(limitX, newX));
    const clampedY = Math.max(-limitY, Math.min(limitY, newY));

    gestureStateRef.current.x = clampedX;
    gestureStateRef.current.y = clampedY;
    scheduleTransformUpdate();
  };

  const handleFullscreenMouseUpOrLeave = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsGestureActive(false);
      setFullscreenPosition({ x: gestureStateRef.current.x, y: gestureStateRef.current.y });
    }
  };

  const handleFullscreenTouchStart = (e: React.TouchEvent) => {
    if (!isFullscreen) return;

    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      setIsGestureActive(true);
      const touch = e.touches[0];
      startPanRef.current = {
        x: touch.clientX - gestureStateRef.current.x,
        y: touch.clientY - gestureStateRef.current.y
      };
      lastTouchDistanceRef.current = null;
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      setIsGestureActive(true);
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

      const currentScale = gestureStateRef.current.scale;
      const limitX = Math.max(0, 800 * (currentScale - 1));
      const limitY = Math.max(0, 500 * (currentScale - 1));
      const clampedX = Math.max(-limitX, Math.min(limitX, newX));
      const clampedY = Math.max(-limitY, Math.min(limitY, newY));

      gestureStateRef.current.x = clampedX;
      gestureStateRef.current.y = clampedY;
      scheduleTransformUpdate();
    } else if (e.touches.length === 2 && lastTouchDistanceRef.current !== null) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      
      const factor = distance / lastTouchDistanceRef.current;
      const nextScale = Math.max(0.8, Math.min(5, gestureStateRef.current.scale * factor));
      gestureStateRef.current.scale = nextScale;
      lastTouchDistanceRef.current = distance;
      scheduleTransformUpdate();
    }
  };

  const handleFullscreenTouchEnd = () => {
    isDraggingRef.current = false;
    lastTouchDistanceRef.current = null;
    setIsGestureActive(false);
    setFullscreenPosition({ x: gestureStateRef.current.x, y: gestureStateRef.current.y });
    setFullscreenScale(gestureStateRef.current.scale);
  };

  const handleFullscreenWheel = (e: React.WheelEvent) => {
    if (!isFullscreen) return;
    const zoomFactor = 0.12;
    const direction = e.deltaY < 0 ? 1 : -1;
    const nextScale = Math.max(0.8, Math.min(5, gestureStateRef.current.scale + direction * zoomFactor));
    gestureStateRef.current.scale = nextScale;
    scheduleTransformUpdate();
    setFullscreenScale(nextScale);
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
          e.preventDefault();
          setIsFullscreen(false);
          setSelectedNode(null);
          safeSetTimeout(() => {
            fullscreenBtnRef.current?.focus();
          }, 50);
        }
      } else if ((e.key === 'f' || e.key === 'F') && !isInputActive && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Aktif HANYA bila fokus berada di dalam section peta atau saat sedang fullscreen
        const isFocusInsideSection = sectionRef.current && (
          sectionRef.current.contains(activeElement) || activeElement === sectionRef.current
        );
        if (isFullscreen || isFocusInsideSection) {
          e.preventDefault();
          setIsFullscreen(prev => {
            const next = !prev;
            if (!next) {
              safeSetTimeout(() => {
                fullscreenBtnRef.current?.focus();
              }, 50);
            }
            return next;
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, safeSetTimeout]);

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
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Precomputed BBoxes dari modul (0 DOM reflow, 0 delay hydration)
  const nodeBBoxes = OVERLAY_BBOXES;

  // Single Source of Truth: Compute --px = viewBoxWidth / (lebar tampil svg dalam px CSS * zoom)
  const [pxScale, setPxScale] = useState<number>(() => {
    return isMobileScreen ? 2560 / (360 * 0.94) : 3646 / 1200;
  });

  const rafPxRef = useRef<number | null>(null);

  const updatePx = useCallback(() => {
    if (rafPxRef.current) {
      cancelAnimationFrame(rafPxRef.current);
    }
    rafPxRef.current = requestAnimationFrame(() => {
      if (!svgRef.current) return;
      const vbWidth = isMobileScreen ? 2560 : 3646;
      const currentZoom = isFullscreen ? fullscreenScale : zoomLevel;
      const rect = svgRef.current.getBoundingClientRect();
      const effectiveWidth = (rect && rect.width > 0)
        ? rect.width
        : ((svgRef.current.clientWidth || 360) * (currentZoom || 1));

      const computedPx = vbWidth / Math.max(1, effectiveWidth);
      svgRef.current.style.setProperty('--px', computedPx.toFixed(6));
      setPxScale(computedPx);
      rafPxRef.current = null;
    });
  }, [isMobileScreen, isFullscreen, fullscreenScale, zoomLevel]);

  // Observer kontainer stabil (hanya dibind 1x pada mount, tidak re-bind saat zoom)
  useEffect(() => {
    updatePx();
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      const ro = new ResizeObserver(() => {
        updatePx();
      });
      ro.observe(containerRef.current);

      const handleVisibilityChange = () => {
        if (document.hidden) {
          if (rafPxRef.current) cancelAnimationFrame(rafPxRef.current);
        } else {
          updatePx();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        ro.disconnect();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (rafPxRef.current) cancelAnimationFrame(rafPxRef.current);
      };
    }
    return () => {
      if (rafPxRef.current) cancelAnimationFrame(rafPxRef.current);
    };
  }, [updatePx]);

  // Active selected booth ID (for Spotlight & Dimming Focus Mode)
  const selectedBoothId = selectedNode?.id || selectedId || null;

  // Animated Wayfinding Route Generator (Pintu Masuk -> Atrium Sentral -> Selected Booth)
  // Lookup map untuk node aktif
  const activeNodesMap = useMemo(() => {
    const map: Record<string, FloorNode> = {};
    FLOOR_NODES.forEach(n => {
      if (!n.hidden) {
        map[n.id] = n;
        if (n.svgId) map[n.svgId] = n;
      }
    });
    return map;
  }, []);

  // ── AUDIT & DEV GUARD OVERLAY RENDERING (SOP-D FIX 1.2) ──
  const isDebugOverlay = typeof window !== 'undefined' && window.location.search.includes('debug=overlay');

  const { renderedOverlayCount, expectedOverlayCount, missingOverlayIds } = useMemo(() => {
    const expected = GERAI_ITEMS.filter(
      item => !STAIR_SVG_IDS.has(item.id) && !WAYPOINT_SVG_IDS.has(item.id)
    );
    const rendered = expected.filter(item => {
      const nodeId = SVG_ID_MAP[item.id] || item.id;
      return !!activeNodesMap[nodeId];
    });
    const renderedIds = new Set(rendered.map(item => item.id));
    const missing = expected.filter(item => !renderedIds.has(item.id)).map(item => item.id);
    return {
      renderedOverlayCount: rendered.length,
      expectedOverlayCount: expected.length,
      missingOverlayIds: missing
    };
  }, [activeNodesMap]);

  useEffect(() => {
    if (renderedOverlayCount < expectedOverlayCount) {
      console.warn(
        `[InteractiveFloorPlan] Overlay Guard: ${expectedOverlayCount - renderedOverlayCount} ID interaktif hilang dari rendering!`,
        {
          expected: expectedOverlayCount,
          rendered: renderedOverlayCount,
          missingIds: missingOverlayIds
        }
      );
    }
  }, [renderedOverlayCount, expectedOverlayCount, missingOverlayIds]);

  const selectedSvgId = selectedNode ? (NODE_ID_TO_SVG_ID[selectedNode.id] || selectedNode.svgId || selectedNode.id) : null;

  const wayfindingRoute = useMemo(() => {
    if (!selectedNode) return null;
    const currentSvgId = NODE_ID_TO_SVG_ID[selectedNode.id] || selectedNode.svgId || selectedNode.id;
    const bbox = currentSvgId ? nodeBBoxes[currentSvgId] : null;

    const targetX = bbox ? bbox.cx : WP_HUB.x;
    const targetY = bbox ? bbox.cy : WP_HUB.y;
    const entranceX = WP_ENTRANCE.x;
    const entranceY = WP_ENTRANCE.y;

    // Case 1: Entrance Selasar Nodes
    if (selectedNode.zone === 'Entrance Flow (Selasar Masuk)' || targetY >= 1600) {
      if (selectedNode.id === 'gerbang_masuk' || selectedNode.id === 'pos_keamanan') {
        return {
          path: `M ${entranceX} ${entranceY} L ${targetX} ${targetY}`,
          targetX,
          targetY,
          hasAtriumHub: false
        };
      }
      return {
        path: `M ${entranceX} ${entranceY} L 1928 1750 L ${targetX} ${targetY}`,
        targetX,
        targetY,
        hasAtriumHub: false
      };
    }

    // Case 2: Deep Building Nodes via Central Atrium Spine
    const mainSpine = `M ${entranceX} ${entranceY} L 1928 1500 L 1925 1100 L ${WP_HUB.x} ${WP_HUB.y}`;
    let connectionPath = '';

    if (targetX <= 1500) {
      // West Wing
      connectionPath = ` C 1600 832, 1300 832, 1100 832 C 900 832, ${targetX} 650, ${targetX} ${targetY}`;
    } else if (targetX >= 2300) {
      // East Wing
      connectionPath = ` C 2200 832, 2500 832, 2700 832 C 2900 832, ${targetX} 650, ${targetX} ${targetY}`;
    } else if (targetY < 600) {
      // North Wing Central
      connectionPath = ` C ${WP_HUB.x} 650, ${targetX} 500, ${targetX} ${targetY}`;
    } else {
      // Central Atrium vicinity
      connectionPath = ` C ${WP_HUB.x} 880, ${targetX} 860, ${targetX} ${targetY}`;
    }

    return {
      path: `${mainSpine}${connectionPath}`,
      targetX,
      targetY,
      hasAtriumHub: true
    };
  }, [selectedNode, nodeBBoxes]);

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
      if (node.hidden) return false;
      // Search query filter has highest precedence if typed
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = node.name.toLowerCase().includes(query);
        const matchSub = (node.subName || '').toLowerCase().includes(query);
        const matchZone = node.zone.toLowerCase().includes(query) || translateZoneToId(node.zone).toLowerCase().includes(query);
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
        node.zone.toLowerCase().includes(q) ||
        translateZoneToId(node.zone).toLowerCase().includes(q)
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
    setZoomLevel(1.05);
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

  const handleCenterMap = () => {
    setZoomLevel(1.05);
    setFullscreenScale(1);
    setFullscreenPosition({ x: 0, y: 0 });
    setSelectedNode(null);
    setHoveredNodeId(null);
  };

  const handleSelectNode = useCallback((node: FloorNode) => {
    setSelectedNode(node);
    if (node.category === 'area_terbatas') {
      setIsWayfindingActive(false);
    } else {
      setIsWayfindingActive(true);
    }
    setIsDetailModalOpen(true);
    if (onSelectElement) {
      const isFacility = node.category === 'facility';
      const isStaffArea = node.category === 'area_terbatas';
      const facilityInfo = FACILITY_DETAILS[node.id];
      const selectedItem: SelectedFloorItem = {
        id: node.id,
        code: node.id,
        name: isFacility && facilityInfo ? facilityInfo.name : node.name,
        subName: node.subName,
        type: isStaffArea ? ('staff_area' as any) : isFacility ? 'facility' : 'tenant',
        category: node.category,
        zone: translateZoneToId(node.zone),
        status: node.status === 'open' ? 'open' : 'busy',
        services: isFacility && facilityInfo ? facilityInfo.amenities : node.services,
        description: isFacility && facilityInfo 
          ? facilityInfo.description 
          : `${node.name} - ${node.subName || ''}. Lokasi: ${translateZoneToId(node.zone)}`,
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
  }, [onSelectElement]);

  // Delegated Event Handlers untuk seluruh gerai (1 listener di root, bukan 117 per-path)
  const handleDelegatedClick = useCallback((e: React.MouseEvent<SVGGElement>) => {
    const target = (e.target as Element).closest('[data-overlay-id]');
    if (!target) return;
    const overlayId = target.getAttribute('data-overlay-id');
    if (!overlayId) return;
    const nodeId = SVG_ID_MAP[overlayId] || overlayId;
    const node = activeNodesMap[nodeId];
    if (node) {
      handleSelectNode(node);
    }
  }, [activeNodesMap, handleSelectNode]);

  const handleDelegatedPointerOver = useCallback((e: React.PointerEvent<SVGGElement>) => {
    if (isPointerCoarse) return; // Abaikan hover pada layar sentuh
    const target = (e.target as Element).closest('[data-overlay-id]');
    if (!target) return;
    const overlayId = target.getAttribute('data-overlay-id');
    if (!overlayId) return;
    const nodeId = SVG_ID_MAP[overlayId] || overlayId;
    const node = activeNodesMap[nodeId];
    if (node && hoveredNodeId !== node.id) {
      setHoveredNodeId(node.id);
    }
  }, [isPointerCoarse, activeNodesMap, hoveredNodeId]);

  const handleDelegatedPointerOut = useCallback((e: React.PointerEvent<SVGGElement>) => {
    if (isPointerCoarse) return;
    const related = (e.relatedTarget as Element)?.closest?.('[data-overlay-id]');
    if (!related) {
      setHoveredNodeId(null);
    }
  }, [isPointerCoarse]);

  return (
    <div 
      ref={sectionRef}
      tabIndex={-1}
      className={`fp-root outline-none ${isFullscreen 
        ? "fixed inset-0 z-[9999] p-0 flex flex-col justify-center items-center overflow-hidden select-none"
        : `w-full max-w-full rounded-3xl border transition-all duration-300 overflow-hidden shadow-sm flex flex-col ${
            effectiveIsDark ? 'bg-surface/95 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-900'
          } ${className}`
      }`}
      style={{
        backgroundColor: 'var(--fp-bg)'
      }}>

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
            <button
              type="button"
              onClick={handleCenterMap}
              title="Pusatkan Peta (Kembalikan ke posisi awal)"
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>
          </div>
        </div>
      </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 2. FILTER CHIPS (TOP BAR CATEGORIES)                              */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {!isFullscreen && (
        <div className="relative border-b overflow-hidden">
          <div 
            ref={chipsContainerRef}
            className={`px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar scroll-smooth ${
              isDark ? 'border-slate-800/80 bg-base/60' : 'border-slate-100 bg-slate-50/70'
            }`}
          >
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
                    data-active={isSelected ? "true" : "false"}
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
          {/* Subtle Right Fade Gradient */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-100/90 dark:from-slate-900/90 to-transparent sm:hidden" />
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
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 font-sans">
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
                      <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 font-sans">
                        {translateZoneToId(node.zone)}
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
              ? "relative w-full h-full max-w-full max-h-full overflow-hidden flex items-center justify-center p-0 m-0 touch-pan-x touch-pan-y"
              : "relative w-full max-w-full overflow-hidden flex flex-col items-center justify-center p-1 sm:p-2 lg:p-3 touch-pan-x touch-pan-y"
            }
            style={isFullscreen ? { height: '100dvh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--fp-bg)' } : undefined}
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
          {ENABLE_EMERGENCY_MODE && isEmergencyMode && (
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

          {/* Top Theater Mode Presentation Header Unified Bar */}
          {isFullscreen && (
            <div className="absolute top-3 sm:top-4 inset-x-3 sm:inset-x-4 z-50 flex items-center justify-between gap-2 pointer-events-auto select-none">
              {/* Left: Badge Mode Presentasi with Tooltip */}
              <div 
                className={`flex items-center gap-2 min-w-0 px-3 py-2 sm:px-4 sm:py-2 rounded-2xl backdrop-blur-md border select-none ${
                  effectiveIsDark
                    ? 'bg-slate-900/95 text-white border-emerald-500/60 shadow-2xl'
                    : 'bg-white/85 text-slate-800 border-slate-200 shadow-[0_2px_8px_rgba(15,23,42,0.10)]'
                }`}
                title="Mode Presentasi Juri (Theater Fullscreen) • Tekan [F] atau [ESC]"
              >
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-xs font-black font-sans tracking-wide truncate">
                  Mode Presentasi
                </span>
                <span className={`hidden md:inline text-[10px] font-mono px-2 py-0.5 rounded-md border shrink-0 ${
                  effectiveIsDark
                    ? 'bg-slate-800 text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  [F] • [ESC]
                </span>
              </div>

              {/* Right: Actions Cluster (Stair Variant Toggle, Theme Toggle & Keluar) with >= 44px touch targets on mobile */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Stair Variant Toggle */}
                <button
                  type="button"
                  onClick={() => setStairVariant(prev => prev === 'A' ? 'B' : 'A')}
                  className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center gap-1 px-3 py-2 rounded-2xl border transition-all cursor-pointer active:scale-95 text-xs font-black ${
                    effectiveIsDark
                      ? 'bg-slate-900/95 text-slate-200 border-slate-700 hover:bg-slate-800 shadow-2xl'
                      : 'bg-white/85 text-slate-800 border-slate-200 hover:bg-slate-100 shadow-[0_2px_8px_rgba(15,23,42,0.10)]'
                  }`}
                  title={`Gaya Tangga: Varian ${stairVariant} (Klik untuk berganti ke Varian ${stairVariant === 'A' ? 'B' : 'A'})`}
                >
                  <span className="text-[10px] font-mono text-emerald-500">Tangga:</span>
                  <span>Varian {stairVariant}</span>
                </button>

                {/* Theme Toggle Button in Fullscreen */}
                <button
                  type="button"
                  onClick={() => setLocalIsDark(!effectiveIsDark)}
                  className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl border transition-all cursor-pointer active:scale-95 text-xs font-black ${
                    effectiveIsDark
                      ? 'bg-slate-900/95 text-amber-300 border-slate-700 hover:bg-slate-800 shadow-2xl'
                      : 'bg-white/85 text-slate-800 border-slate-200 hover:bg-slate-100 shadow-[0_2px_8px_rgba(15,23,42,0.10)]'
                  }`}
                  title={effectiveIsDark ? 'Beralih ke Tema Terang' : 'Beralih ke Tema Gelap'}
                  aria-label={effectiveIsDark ? 'Beralih ke Tema Terang' : 'Beralih ke Tema Gelap'}
                >
                  {effectiveIsDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
                  <span className="hidden sm:inline">{effectiveIsDark ? 'Terang' : 'Gelap'}</span>
                </button>

                {/* Exit Fullscreen Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNode(null);
                    setIsFullscreen(false);
                    setTimeout(() => fullscreenBtnRef.current?.focus(), 50);
                  }}
                  className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-2xl border transition-all cursor-pointer active:scale-95 text-xs font-black ${
                    effectiveIsDark
                      ? 'bg-slate-900/95 hover:bg-rose-600 text-slate-100 hover:text-white border-slate-700 hover:border-rose-500 shadow-2xl'
                      : 'bg-white/85 hover:bg-rose-50 text-slate-800 hover:text-rose-700 border-slate-200 hover:border-rose-300 shadow-[0_2px_8px_rgba(15,23,42,0.10)]'
                  }`}
                  title="Tutup Mode Layar Lebar (Esc)"
                  aria-label="Keluar Mode Layar Lebar"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Keluar</span>
                  <span className={`hidden sm:[@media(pointer:fine)]:inline text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    effectiveIsDark ? 'bg-black/40 text-rose-200' : 'bg-slate-100 text-slate-600'
                  }`}>ESC</span>
                </button>
              </div>
            </div>
          )}

          {/* Small floating Zoom controls on bottom-right of the fullscreen map */}
          {isFullscreen && (
            <div className={`absolute bottom-4 right-4 z-50 flex items-center gap-1 p-1 rounded-2xl backdrop-blur-md select-none pointer-events-auto border ${
              effectiveIsDark
                ? 'bg-slate-900/95 text-white border-slate-700 shadow-2xl'
                : 'bg-white/85 text-slate-800 border-slate-200 shadow-[0_2px_8px_rgba(15,23,42,0.10)]'
            }`}>
              <button
                type="button"
                onClick={() => setFullscreenScale(prev => Math.min(5, prev + 0.3))}
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors cursor-pointer active:scale-90 ${
                  effectiveIsDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Perbesar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setFullscreenScale(prev => Math.max(0.8, prev - 0.3))}
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors cursor-pointer active:scale-90 ${
                  effectiveIsDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Perkecil"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetAll}
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors cursor-pointer active:scale-90 ${
                  effectiveIsDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Reset Tampilan & Filter"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Bottom-left in Fullscreen: Filter & Legenda so user can filter in theater mode */}
          {isFullscreen && (
            <div className="absolute bottom-4 left-4 z-50 pointer-events-auto select-none">
              <FloatingFloorPlanLegend
                activeSector={activeSector}
                onSelectSector={handleSectorFilterChange}
                isDark={isDark}
                position="toolbar"
                totalMatchingCount={matchingSectorCount}
                isOpenControlled={isLegendOpen}
                onToggleControlled={setIsLegendOpen}
              />
            </div>
          )}

          {/* Floating Kiosk Quick-Access Overlay on Map Canvas */}
          {!isFullscreen && (
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-40 pointer-events-auto flex items-center gap-2 max-w-[calc(100%-1.5rem)] sm:max-w-none justify-end">
              {/* Tombol Pusatkan Peta Cepat */}
              <button
                type="button"
                onClick={handleCenterMap}
                className="h-9 px-3 flex items-center gap-1.5 rounded-2xl backdrop-blur-md bg-slate-900/90 text-white border border-slate-700/80 shadow-2xl hover:border-emerald-500/80 hover:bg-slate-800 transition-all cursor-pointer active:scale-95 text-xs font-bold select-none"
                title="Pusatkan Peta (Kembalikan ke posisi awal)"
                aria-label="Pusatkan Peta"
              >
                <Compass className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Pusatkan Peta</span>
              </button>

              {/* Floating Emergency Button (Guarded by ENABLE_EMERGENCY_MODE) */}
              {ENABLE_EMERGENCY_MODE && (
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
              )}
            </div>
          )}

          {/* Subtle Ambient Radial Grid Pattern */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: `radial-gradient(var(--fp-grid, ${effectiveIsDark ? '#10b981' : '#94a3b8'}) 1px, transparent 1px)`,
              backgroundSize: '24px 24px'
            }}
          />

          {/* Banner Dev Debug Overlay (?debug=overlay) */}
          {isDebugOverlay && missingOverlayIds.length > 0 && (
            <div className="absolute top-3 left-3 z-50 bg-rose-600/90 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg backdrop-blur pointer-events-none">
              ⚠️ Debug Overlay: {expectedOverlayCount - renderedOverlayCount} ID interaktif hilang ({missingOverlayIds.join(', ')})
            </div>
          )}

          {/* Custom Interactive Transform Wrapper with Centered Origin (Ref + rAF Hardware Acceleration) */}
          <div 
            ref={transformTargetRef}
            className={isFullscreen 
              ? "w-full h-full flex items-center justify-center mx-auto my-auto select-none overflow-hidden touch-none cursor-grab active:cursor-grabbing" 
              : "relative w-full h-full max-w-full flex items-center justify-center mx-auto my-auto transition-transform duration-300 overflow-hidden"
            }
            style={isFullscreen 
              ? { 
                  transform: `translate3d(${fullscreenPosition.x}px, ${fullscreenPosition.y}px, 0) scale(${fullscreenScale})`,
                  transformOrigin: 'center center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                  willChange: isGestureActive ? 'transform' : 'auto'
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
              ref={svgRef}
              viewBox={isMobileScreen ? "640 40 2560 2010" : "0 0 3646 2497"}
              preserveAspectRatio="xMidYMid meet"
              className={isFullscreen 
                ? "w-auto h-auto max-w-[94vw] max-h-[86vh] object-contain block mx-auto my-auto select-none pointer-events-auto"
                : "w-full h-full max-w-full max-h-[80vh] xl:max-h-[85vh] 2xl:max-h-[88vh] object-contain block mx-auto my-auto select-none pointer-events-auto"
              }
              style={{
                ['--px' as any]: pxScale.toFixed(6),
                textRendering: 'optimizeLegibility',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                shapeRendering: isGestureActive ? 'optimizeSpeed' : 'geometricPrecision'
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
                  .animate-dash {
                    stroke-dasharray: 10 6;
                    animation: flowRoute 1.2s linear infinite;
                  }
                `}</style>

                {/* Stair ClipPaths for procedural tread clipping */}
                {STAIR_CONFIGS.map((stair) => (
                  <clipPath key={`clip-${stair.id}`} id={`clip-${stair.id}`}>
                    <path d={stair.d} />
                  </clipPath>
                ))}

                {/* Diagonal hatch pattern for Area Staf (Staff Only / Restricted) */}
                <pattern
                  id="fp-pattern-area-staf"
                  width="12"
                  height="12"
                  patternTransform="rotate(45 0 0)"
                  patternUnits="userSpaceOnUse"
                >
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="12"
                    stroke={effectiveIsDark ? "#94a3b8" : "#475569"}
                    strokeWidth="1.2"
                    strokeOpacity={effectiveIsDark ? "0.40" : "0.35"}
                  />
                </pattern>
              </defs>

              {/* ── 1. AUTHENTIC ARCHITECTURAL BASELINE: Static Wall Image (Hashed asset, Browser Raster Cache, 0 VDOM nodes) ── */}
              <image
                href={effectiveIsDark ? denahWallDarkUrl : denahWallLightUrl}
                x="0"
                y="0"
                width="3646"
                height="2497"
                preserveAspectRatio="xMidYMid meet"
                className="pointer-events-none"
              />

              {/* ── 2. DYNAMIC WAYFINDING PATH FROM ENTRANCE TO TARGET (BLUE DASHED, HIDDEN IN EMERGENCY) ── */}
              {selectedNode && wayfindingRoute && !isEmergencyMode && (
                <g id="wayfinding-route-layer" pointerEvents="none">
                  {/* Outer subtle glow */}
                  <path
                    d={wayfindingRoute.path}
                    fill="none"
                    stroke={isDark ? '#0284c7' : '#bae6fd'}
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.45"
                  />
                  {/* Dashed active wayfinding route (Blue #0284c7; static on low-end device to save battery/GPU) */}
                  <path
                    d={wayfindingRoute.path}
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="10 8"
                    className={isLowEndDevice || prefersReducedMotion ? "" : "animate-dash"}
                  />
                  {/* Starting point (Entrance) */}
                  <circle cx={WP_ENTRANCE.x} cy={WP_ENTRANCE.y} r="14" fill="#0284c7" stroke="#ffffff" strokeWidth="4" />
                  <circle cx={WP_ENTRANCE.x} cy={WP_ENTRANCE.y} r="6" fill="#ffffff" />
                </g>
              )}

              {/* ── 2.5 PROCEDURAL STAIRS (TANGGA_UTARA, TANGGA_SELATAN_TIMUR, TANGGA_SELATAN_BARAT) ── */}
              <g className="fp-stair-treads" aria-hidden="true">
                {STAIR_CONFIGS.map((stair) => {
                  const clipId = `clip-${stair.id}`;
                  const effectiveScale = isFullscreen ? fullscreenScale : zoomLevel;
                  const showFineDetails = effectiveScale >= 1.08;

                  // Hitung garis horizontal tapak tiap 14 unit (treadSpacing = 14)
                  const treadSpacing = 14;
                  const treadLines: Array<{ key: string; x1: number; x2: number; y: number }> = [];

                  if (showFineDetails) {
                    const addArmTreads = (arm: typeof stair.leftArm, prefix: string) => {
                      const yStart = Math.min(arm.yOpen, arm.yLanding);
                      const yEnd = Math.max(arm.yOpen, arm.yLanding);
                      for (let y = yStart + treadSpacing; y < yEnd; y += treadSpacing) {
                        treadLines.push({
                          key: `${prefix}-${y}`,
                          x1: arm.xMin,
                          x2: arm.xMax,
                          y: Math.round(y)
                        });
                      }
                    };

                    addArmTreads(stair.leftArm, `${stair.id}-left`);
                    addArmTreads(stair.rightArm, `${stair.id}-right`);
                  }

                  return (
                    <g key={stair.id} id={`procedural-${stair.id}`} pointerEvents="none">
                      <title>Tangga</title>
                      {/* Badan Tangga dengan Token Varian A / B */}
                      <path
                        d={stair.d}
                        fill={stairColors.body}
                        stroke={stairColors.stroke}
                        strokeWidth="calc(var(--px, 1) * 1.0)"
                        shapeRendering="geometricPrecision"
                      />

                      {/* Tapak Anak Tangga (Treads - LOD: tampil saat zoom cukup) */}
                      <g clipPath={`url(#${clipId})`}>
                        {showFineDetails && treadLines.map((line) => (
                          <line
                            key={line.key}
                            x1={line.x1}
                            y1={line.y}
                            x2={line.x2}
                            y2={line.y}
                            stroke={stairColors.tread}
                            strokeWidth="calc(var(--px, 1) * 1.0)"
                            shapeRendering="geometricPrecision"
                          />
                        ))}

                        {/* Garis batas pembatas tengah (Handrail / Railing luar - LOD) */}
                        {showFineDetails && (
                          <>
                            <line
                              x1={stair.leftArm.xMin}
                              y1={Math.min(stair.leftArm.yOpen, stair.leftArm.yLanding)}
                              x2={stair.leftArm.xMin}
                              y2={Math.max(stair.leftArm.yOpen, stair.leftArm.yLanding)}
                              stroke={stairColors.stroke}
                              strokeWidth="calc(var(--px, 1) * 1.0)"
                              shapeRendering="geometricPrecision"
                            />
                            <line
                              x1={stair.rightArm.xMax}
                              y1={Math.min(stair.rightArm.yOpen, stair.rightArm.yLanding)}
                              x2={stair.rightArm.xMax}
                              y2={Math.max(stair.rightArm.yOpen, stair.rightArm.yLanding)}
                              stroke={stairColors.stroke}
                              strokeWidth="calc(var(--px, 1) * 1.0)"
                              shapeRendering="geometricPrecision"
                            />
                          </>
                        )}

                        {/* Garis batas pembatas tengah (Handrail / Railing luar) */}
                        <line
                          x1={stair.leftArm.xMin}
                          y1={Math.min(stair.leftArm.yOpen, stair.leftArm.yLanding)}
                          x2={stair.leftArm.xMin}
                          y2={Math.max(stair.leftArm.yOpen, stair.leftArm.yLanding)}
                          stroke={stairColors.stroke}
                          strokeWidth="calc(var(--px, 1) * 1.0)"
                          shapeRendering="geometricPrecision"
                        />
                        <line
                          x1={stair.rightArm.xMax}
                          y1={Math.min(stair.rightArm.yOpen, stair.rightArm.yLanding)}
                          x2={stair.rightArm.xMax}
                          y2={Math.max(stair.rightArm.yOpen, stair.rightArm.yLanding)}
                          stroke={stairColors.stroke}
                          strokeWidth="calc(var(--px, 1) * 1.0)"
                          shapeRendering="geometricPrecision"
                        />

                        {/* U-Shaped Climbing Path (Directive 3 & Perbaikan D) - Disembunyikan saat mode darurat K3 */}
                        {!isEmergencyMode && (() => {
                          const uPath = computeStairUPath(stair);
                          const isZoomedIn = (isFullscreen ? fullscreenScale : zoomLevel) > 1.3;
                          return (
                            <g className="fp-stair-upath">
                              {/* Titik awal bulat kecil */}
                              <circle
                                cx={uPath.startDot.cx}
                                cy={uPath.startDot.cy}
                                r={uPath.startDot.r}
                                fill={stairColors.chevron}
                                stroke={stairColors.dotStroke}
                                strokeWidth="calc(var(--px, 1) * 1.0)"
                                shapeRendering="geometricPrecision"
                              />
                              {/* Garis U-Path kontras tajam (Target 1.5 px) */}
                              <path
                                d={uPath.pathD}
                                fill="none"
                                stroke={stairColors.chevron}
                                strokeWidth="calc(var(--px, 1) * 1.5)"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                shapeRendering="geometricPrecision"
                              />
                              {/* Ujung panah statis terbaca 1x zoom */}
                              <path
                                d={uPath.arrowHeadD}
                                fill="none"
                                stroke={stairColors.chevron}
                                strokeWidth="calc(var(--px, 1) * 1.5)"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                shapeRendering="geometricPrecision"
                              />
                              {/* Label Arah Tangga Terkonfigurasi (default: 'Ke Lantai 2') */}
                              <text
                                x={uPath.labelPos.x}
                                y={uPath.labelPos.y}
                                textAnchor="middle"
                                fontSize={isZoomedIn ? "9" : "8"}
                                fontWeight="800"
                                fill={stairColors.chevron}
                                letterSpacing="0.8"
                              >
                                {stair.directionLabel || 'Ke Lantai 2'}
                              </text>
                            </g>
                          );
                        })()}
                      </g>

                      {/* Debug Overlay bila ?debug=route aktif */}
                      {isDebugRoute && (
                        <g className="fp-stair-debug" opacity={0.7}>
                          {/* Bounding Box */}
                          <rect
                            x={stair.bbox.xMin}
                            y={stair.bbox.yMin}
                            width={stair.bbox.xMax - stair.bbox.xMin}
                            height={stair.bbox.yMax - stair.bbox.yMin}
                            fill="none"
                            stroke="#ec4899"
                            strokeWidth="1.5"
                            strokeDasharray="4 4"
                          />
                          {/* Celah Tengah Tangga (Center Gap ±3 unit) */}
                          <rect
                            x={stair.centerGap.xMin}
                            y={stair.centerGap.yMin}
                            width={stair.centerGap.xMax - stair.centerGap.xMin}
                            height={stair.centerGap.yMax - stair.centerGap.yMin}
                            fill="rgba(244, 63, 94, 0.4)"
                            stroke="#f43f5e"
                            strokeWidth="1"
                          />
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>

              {/* ── 3. GERAI & BOOTH OVERLAY LAYER FROM FIGMA (DELEGATED EVENTS & LOD OPTIMIZED) ── */}
              <g 
                id="gerai-overlay-layer"
                className="fp-overlay"
                onClick={handleDelegatedClick}
                onPointerOver={handleDelegatedPointerOver}
                onPointerOut={handleDelegatedPointerOut}
              >
                {GERAI_ITEMS.map((item) => {
                  // Tangga sudah dirender secara prosedural di atas, lewati dari layer item standar
                  if (STAIR_SVG_IDS.has(item.id)) {
                    return null;
                  }

                  // Non-interactive items (GUDANG, DUKCAPIL_SERVER) sekarang masuk kategori fasilitas dan diwarnai penuh
                  if (NON_INTERACTIVE_SVG_IDS.has(item.id)) {
                    // fall through to professional rendering
                  }

                  // Waypoints
                  if (WAYPOINT_SVG_IDS.has(item.id)) {
                    return null;
                  }

                  const nodeId = SVG_ID_MAP[item.id] || item.id;
                  const node = activeNodesMap[nodeId];
                  if (!node) return null;

                  const isSelected = selectedNode?.id === node.id;
                  const isHovered = hoveredNodeId === node.id;
                  const isMatching = isNodeMatching(node);

                  const catKey = SVG_ID_TO_CATEGORY[item.id] || 'fasilitas';
                  const catMeta = MPP_CATEGORIES[catKey] || MPP_CATEGORIES.fasilitas;
                  const categoryColorVar = catMeta.tokenVar;

                  // Opacity padat & kontras tanpa filter GPU berat
                  const nodeOpacity = !isMatching ? 0.22 : (isSelected || isHovered) ? 1.0 : 0.88;

                  // Check if item has thin contour paths
                  const thinIndices = THIN_CONTOUR_PATH_MAP[item.id];

                  // Target stroke calculations per spec:
                  const currentZoom = isFullscreen ? fullscreenScale : zoomLevel;
                  const showFineDetails = currentZoom >= 1.08;
                  const contourTargetPx = Math.min(3.0, Math.max(1.5, 1.5 + 0.4 * Math.log2(Math.max(0.1, currentZoom))));
                  const contourStrokeWidth = `calc(var(--px, 1) * ${contourTargetPx.toFixed(3)})`;

                  const isProminentBooth = item.id === 'DUKCAPIL_1' || item.id === 'DPMPTSP_1';
                  const isLargeFacility = item.id === 'MUSHALLA' || item.id === 'RUANG_RAPAT' || item.id === 'TIM_TEKNIS';
                  const isFacility = catKey === 'fasilitas' || NON_INTERACTIVE_SVG_IDS.has(item.id);
                  const isGudangItem = item.id === 'GUDANG' || item.id === 'GUDANG_2';

                  // Garis tepi tegas: saat terpilih dibuat tebal kontras (2.2px) tanpa drop-shadow filter GPU
                  const itemStrokeWidth = isSelected
                    ? `calc(var(--px, 1) * 2.2)`
                    : isProminentBooth
                    ? `calc(var(--px, 1) * ${contourTargetPx.toFixed(3)})`
                    : isFacility || isGudangItem
                    ? `calc(var(--px, 1) * 1.5)`
                    : `calc(var(--px, 1) * 1.25)`;
                  const tableChairStrokeWidth = `calc(var(--px, 1) * 1.25)`;

                  // Opacity per specification
                  const boothFillOpacity = isGudangItem
                    ? (effectiveIsDark ? "0.18" : "0.14")
                    : isLargeFacility
                    ? (effectiveIsDark ? "0.28" : "0.24")
                    : isFacility
                    ? (effectiveIsDark ? "0.34" : "0.30")
                    : (effectiveIsDark ? "0.40" : "0.55");
                  const detailFillOpacity = isGudangItem
                    ? (effectiveIsDark ? "0.18" : "0.14")
                    : (effectiveIsDark ? "0.40" : "0.55");

                  return (
                    <g
                      key={item.id}
                      id={item.id}
                      data-overlay-id={item.id}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectNode(node);
                        }
                      }}
                      style={{
                        cursor: 'pointer',
                        color: categoryColorVar || 'var(--fp-agency-color, #7dd3fc)',
                        opacity: nodeOpacity ?? 1,
                        transition: 'opacity 0.15s ease'
                      }}
                    >
                      {item.d ? (
                        <path
                          d={item.d}
                          fill="currentColor"
                          fillOpacity={boothFillOpacity}
                          stroke="currentColor"
                          strokeWidth={itemStrokeWidth}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          shapeRendering="geometricPrecision"
                        />
                      ) : item.x !== undefined && item.y !== undefined && item.width !== undefined && item.height !== undefined ? (
                        <rect
                          x={item.x}
                          y={item.y}
                          width={item.width}
                          height={item.height}
                          fill="currentColor"
                          fillOpacity={boothFillOpacity}
                          stroke="currentColor"
                          strokeWidth={itemStrokeWidth}
                          shapeRendering="geometricPrecision"
                        />
                      ) : item.childPaths && item.childPaths.length > 0 ? (
                        <>
                          {/* LAPISAN 1 (BAWAH): KONTUR TIPIS, PULAU TENGAH CONCAVE HULL & TINT DUKCAPIL_1/DPMPTSP_1 */}
                          {item.childPaths.map((dVal, pIdx) => {
                            const isThin = thinIndices && thinIndices.includes(pIdx);
                            if (!isThin) return null;
                            const hullD = ISLAND_CONTOUR_HULL_MAP[item.id]?.[pIdx];

                            return (
                              <React.Fragment key={`contour-wrap-${pIdx}`}>
                                {/* 1A. Concave Hull Fill Layer untuk Pulau Tengah (fill-opacity 0.40 gelap / 0.45 terang) */}
                                {hullD && (
                                  <path
                                    d={hullD}
                                    fill="currentColor"
                                    fillOpacity={effectiveIsDark ? "0.40" : "0.45"}
                                    stroke="none"
                                  />
                                )}
                                {/* 1B. Tint tipis sebagai layer terpisah untuk DUKCAPIL_1 dan DPMPTSP_1 (fill-opacity 0.12 warna kategori) */}
                                {isProminentBooth && (
                                  <path
                                    d={dVal}
                                    fill="currentColor"
                                    fillOpacity="0.12"
                                    stroke="none"
                                  />
                                )}
                                {/* 1C. Garis Kontur Asli (Tanpa ubah geometri, clamp 1.5 - 3.0 px layar) */}
                                <path
                                  d={dVal}
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={contourStrokeWidth}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  shapeRendering="geometricPrecision"
                                />
                              </React.Fragment>
                            );
                          })}

                          {/* LAPISAN 2 (ATAS KONTUR): KURSI & MEJA ISI BIASA & PITA PADAT DUKCAPIL_2/DPMPTSP_2 (LOD) */}
                          {item.childPaths.map((dVal, pIdx) => {
                            const isThin = thinIndices && thinIndices.includes(pIdx);
                            if (isThin) return null;

                            // Pita padat DUKCAPIL_2 dan DPMPTSP_2: selalu tampil
                            const isPitaPadat = (item.id === 'DUKCAPIL_2' || item.id === 'DPMPTSP_2') && pIdx === 0;

                            // LOD: Sembunyikan detail kursi/meja halus saat zoom jauh
                            if (!showFineDetails && !isPitaPadat) return null;

                            const pathFillOpacity = isPitaPadat ? "0.20" : detailFillOpacity;
                            const pathStrokeWidth = isPitaPadat ? `calc(var(--px, 1) * 1.5)` : tableChairStrokeWidth;

                            return (
                              <path
                                key={`chair-path-${pIdx}`}
                                d={dVal}
                                fill="currentColor"
                                fillOpacity={pathFillOpacity}
                                stroke="currentColor"
                                strokeWidth={pathStrokeWidth}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                shapeRendering="geometricPrecision"
                              />
                            );
                          })}
                        </>
                      ) : !item.childRects || item.childRects.length === 0 ? (
                        <g dangerouslySetInnerHTML={{ __html: item.innerHtml }} />
                      ) : null}
                      {/* LAPISAN 3 (TERATAS): RECT KURSI / DETAIL / GUDANG (LOD: sembunyikan kursi saat zoom jauh) */}
                      {item.childRects && item.childRects.map((rObj, rIdx) => {
                        if (!showFineDetails && !isGudangItem) return null;
                        return (
                          <rect
                            key={`rect-${rIdx}`}
                            x={rObj.x}
                            y={rObj.y}
                            width={rObj.width}
                            height={rObj.height}
                            fill="currentColor"
                            fillOpacity={isGudangItem ? (effectiveIsDark ? "0.18" : "0.14") : detailFillOpacity}
                            stroke="currentColor"
                            strokeWidth={isGudangItem ? `calc(var(--px, 1) * 1.5)` : tableChairStrokeWidth}
                            strokeDasharray={isGudangItem ? "5 3" : undefined}
                            shapeRendering="geometricPrecision"
                          />
                        );
                      })}
                    </g>
                  );
                })}
              </g>

              {/* ── 3.5 FACILITY LINE ICONS (IKON KECIL BERGAYA GARIS IKUT WARNA FASILITAS) ── */}
              <g id="facility-line-icons" aria-hidden="true" pointerEvents="none">
                {/* Mushalla (Kubah & Bulan Sabit) */}
                <g id="icon-mushalla" transform="translate(1019, 1519)" opacity={0.88}>
                  <path
                    d="M -16 12 C -16 -4, 16 -4, 16 12 Z M -18 12 L 18 12"
                    fill="none"
                    stroke="var(--fp-cat-fasilitas, #0891b2)"
                    strokeWidth="calc(var(--px, 1) * 1.5)"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 0 -4 L 0 -10 M -3 -13 C -1 -17, 4 -17, 6 -13 C 3 -13, 1 -11, 1 -8"
                    fill="none"
                    stroke="var(--fp-cat-fasilitas, #0891b2)"
                    strokeWidth="calc(var(--px, 1) * 1.3)"
                    strokeLinecap="round"
                  />
                </g>

                {/* Ruang Laktasi (Ibu & Anak / Simbol Kasih Ibu) */}
                <g id="icon-ruang-laktasi" transform="translate(1096, 1192)" opacity={0.88}>
                  <path
                    d="M -8 -4 L -8 14 C -8 18, 8 18, 8 14 L 8 -4 Z M -11 -4 L 11 -4 M -6 -4 L -6 -8 L 6 -8 L 6 -4 M -3 -8 L -3 -12 C -3 -14, 3 -14, 3 -12 L 3 -8"
                    fill="none"
                    stroke="var(--fp-cat-fasilitas, #0891b2)"
                    strokeWidth="calc(var(--px, 1) * 1.5)"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>

                {/* Pos Security (Perisai Jaga K3) */}
                <g id="icon-pos-security" transform="translate(1731, 1891)" opacity={0.88}>
                  <path
                    d="M 0 -14 L 12 -9 C 12 4, 8 14, 0 18 C -8 14, -12 4, -12 -9 Z M 0 -8 L 0 12"
                    fill="none"
                    stroke="var(--fp-cat-fasilitas, #0891b2)"
                    strokeWidth="calc(var(--px, 1) * 1.5)"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>

                {/* Gudang (Kotak Geometris 3D Wireframe Cerah) */}
                <g id="icon-gudang" transform="translate(2983, 422)" opacity={0.92}>
                  <path
                    d="M 0 -12 L 12 -5 L 12 9 L 0 16 L -12 9 L -12 -5 Z M 0 -12 L 0 16 M -12 -5 L 0 2 L 12 -5"
                    fill="none"
                    stroke="var(--fp-cat-area-terbatas, #f97316)"
                    strokeWidth="calc(var(--px, 1) * 1.5)"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>

                {/* Dukcapil Server (Rak Server Stack Cerah) */}
                <g id="icon-dukcapil-server" transform="translate(866, 1070)" opacity={0.92}>
                  <rect x="-10" y="-14" width="20" height="7" rx="1.5" fill="none" stroke="var(--fp-cat-area-terbatas, #f97316)" strokeWidth="calc(var(--px, 1) * 1.3)" />
                  <rect x="-10" y="-4" width="20" height="7" rx="1.5" fill="none" stroke="var(--fp-cat-area-terbatas, #f97316)" strokeWidth="calc(var(--px, 1) * 1.3)" />
                  <rect x="-10" y="6" width="20" height="7" rx="1.5" fill="none" stroke="var(--fp-cat-area-terbatas, #f97316)" strokeWidth="calc(var(--px, 1) * 1.3)" />
                </g>

                {/* Toilet Wanita & Pria */}
                <g id="icon-toilet-wanita" transform="translate(244, 705)" opacity={0.88}>
                  <circle cx="0" cy="-10" r="3" fill="none" stroke="var(--fp-cat-fasilitas, #0891b2)" strokeWidth="calc(var(--px, 1) * 1.3)" />
                  <path d="M -6 6 L -3 -5 L 3 -5 L 6 6 Z M -2 6 L -2 14 M 2 6 L 2 14" fill="none" stroke="var(--fp-cat-fasilitas, #0891b2)" strokeWidth="calc(var(--px, 1) * 1.3)" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </g>

              {/* ── 4. RUNTIME CENTROID TARGET BEACON & LABELS ── */}
              {selectedNode && selectedSvgId && nodeBBoxes[selectedSvgId] && (() => {
                const selectedCatKey = SVG_ID_TO_CATEGORY[selectedSvgId] || 'fasilitas';
                const selectedCatMeta = MPP_CATEGORIES[selectedCatKey] || MPP_CATEGORIES.fasilitas;
                const beaconColor = selectedCatMeta.tokenVar;

                return (
                  <g
                    id="selected-target-beacon"
                    transform={`translate(${nodeBBoxes[selectedSvgId].cx}, ${nodeBBoxes[selectedSvgId].cy})`}
                    pointerEvents="none"
                  >
                    {/* Ripple dinamis mengikuti warna kategori; reduced-motion = halo statis */}
                    <circle
                      cx={0}
                      cy={0}
                      r={24}
                      fill={beaconColor}
                      opacity={0.3}
                      className="motion-safe:animate-ping motion-reduce:hidden"
                    />
                    {/* Halo statis untuk prefers-reduced-motion */}
                    <circle
                      cx={0}
                      cy={0}
                      r={26}
                      fill="none"
                      stroke={beaconColor}
                      strokeWidth={3}
                      opacity={0.4}
                      className="motion-reduce:block motion-safe:hidden"
                    />
                    <circle cx={0} cy={0} r={14} fill={beaconColor} stroke="#ffffff" strokeWidth={3} />
                    <circle cx={0} cy={0} r={5} fill="#ffffff" />

                    {/* Target Pill Badge */}
                    <g transform="translate(0, -32)">
                      <rect
                        x={-90}
                        y={-14}
                        width={180}
                        height={28}
                        rx={14}
                        fill="#0f172a"
                        stroke={beaconColor}
                        strokeWidth={2}
                        filter="drop-shadow(0 4px 10px rgba(0,0,0,0.5))"
                      />
                      <text
                        x={0}
                        y={4}
                        fill="#ffffff"
                        fontSize={11}
                        fontWeight="bold"
                        textAnchor="middle"
                        className="select-none font-sans"
                      >
                        {selectedNode.name.length > 22 ? selectedNode.name.slice(0, 21) + '…' : selectedNode.name}
                      </text>
                    </g>
                  </g>
                );
              })()}

              {/* ── 5. EMERGENCY EVACUATION (PRESERVED CODE, GUARDED BY ENABLE_EMERGENCY_MODE) ── */}
              {ENABLE_EMERGENCY_MODE && isEmergencyMode && (
                <g id="emergency-evacuation-layer" className="transition-opacity duration-500 ease-in-out pointer-events-none">
                  {/* Rute Jalur Evakuasi */}
                  <g id="evacuation-routes-spine">
                    <path
                      d="M 1928 1996 L 1928 1750 L 1922 832"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth={6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="animate-dash"
                    />
                  </g>
                  {/* Titik Kumpul */}
                  <g transform={`translate(${WP_HUB.x}, ${WP_HUB.y})`} className="assembly-point-bounce">
                    <circle cx={0} cy={0} r={36} fill="#22c55e" opacity={0.25} className="animate-ping" />
                    <rect x={-24} y={-24} width={48} height={48} rx={8} fill="#15803d" stroke="#ffffff" strokeWidth={2.5} />
                    <text x={0} y={35} fill="#ffffff" fontSize={10} fontWeight="900" textAnchor="middle">
                      ★ TITIK KUMPUL K3 ★
                    </text>
                  </g>
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* MAP-TOOLBAR STATIS (BUKAN fixed/sticky) TEPAT DI BAWAH KANVAS (12px) */}
        {/* ───────────────────────────────────────────────────────────── */}
        {!isFullscreen && (
          <div className="map-toolbar w-full flex items-center justify-between gap-2 h-12 min-h-[48px] mt-3 px-0.5 relative z-30 select-none">
            {/* Kiri: Filter & Legenda */}
            <div className="relative">
              <FloatingFloorPlanLegend
                activeSector={activeSector}
                onSelectSector={handleSectorFilterChange}
                isDark={effectiveIsDark}
                position="toolbar"
                totalMatchingCount={matchingSectorCount}
                isOpenControlled={isLegendOpen}
                onToggleControlled={setIsLegendOpen}
              />
            </div>

            {/* Kanan: Stair Variant Toggle & Lihat Layar Lebar */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setStairVariant(prev => prev === 'A' ? 'B' : 'A')}
                className={`h-12 min-h-[48px] px-3.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                  effectiveIsDark
                    ? 'bg-slate-900/95 text-slate-200 border-slate-700 hover:bg-slate-800 shadow-md'
                    : 'bg-white/85 text-slate-800 border-slate-200 hover:bg-slate-100 shadow-[0_2px_8px_rgba(15,23,42,0.10)]'
                }`}
                title={`Gaya Tangga: Varian ${stairVariant} (Klik untuk berganti ke Varian ${stairVariant === 'A' ? 'B' : 'A'})`}
                aria-label="Ganti Varian Tangga"
              >
                <span className="text-[10px] font-mono text-emerald-500 font-bold">Tangga:</span>
                <span>Varian {stairVariant}</span>
              </button>

              <button
                ref={fullscreenBtnRef}
                type="button"
                onClick={() => setIsFullscreen(true)}
                className="h-12 min-h-[48px] w-12 sm:w-auto p-0 sm:px-4 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md border border-emerald-400/80 transition-all cursor-pointer active:scale-95 group shrink-0"
                title={isPointerCoarse ? "Lihat Layar Lebar (Landscape)" : "Lihat Layar Lebar (Landscape) • Pintasan: F"}
                aria-label="Lihat Layar Lebar (Landscape)"
              >
                <Maximize2 className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">Lihat Layar Lebar (Landscape)</span>
                {!isPointerCoarse && (
                  <span className="hidden sm:[@media(pointer:fine)]:inline-flex text-[10px] font-mono bg-black/40 px-2 py-0.5 rounded text-emerald-200">
                    F
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
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
                  {selectedNode.needsReview ? (
                    <div className="py-8 px-4 text-center space-y-3">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 mb-1">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <h4 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                        Informasi layanan sedang diperbarui
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        Data operasional dan katalog layanan untuk gerai/fasilitas ini sedang dalam tahap sinkronisasi dengan instansi terkait.
                      </p>
                    </div>
                  ) : (
                    <>
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
                    </>
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

export const InteractiveFloorPlan = React.memo(InteractiveFloorPlanComponent);
export const MppFloorPlan = InteractiveFloorPlan;
export default InteractiveFloorPlan;
