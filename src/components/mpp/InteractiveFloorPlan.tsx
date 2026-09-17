import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Layers, Building2, Armchair, Baby, 
  Store, Moon, Laptop, BookOpen, HeartHandshake, 
  ChevronRight, Compass, Sparkles, CheckCircle2, Clock, 
  ArrowUpRight, Accessibility, Search, Navigation, 
  Footprints, Shield, Info, MapPin, X
} from 'lucide-react';

export interface RoomZone {
  id: string;
  floor: 1 | 2;
  name: string;
  category: 'Loket Layanan' | 'Fasilitas Ramah' | 'Investor VIP' | 'Fasilitas Umum' | 'Konsultasi';
  description: string;
  icon: any;
  color: string;
  coordinates: { x: number; y: number; w: number; h: number };
  hours: string;
  services: string[];
  capacity: string;
  image: string;
  deskHeight: string;
  wheelchairAccessible: boolean;
  wayfindingRoute: string[];
}

const ZONES_DATA: RoomZone[] = [
  // --- LANTAI 1 (PELAYANAN PUBLIK TERPADU & INKLUSIF) ---
  {
    id: 'l1-frontoffice',
    floor: 1,
    name: 'Front Office, Meja Resepsionis & E-Kiosk Antrean',
    category: 'Fasilitas Umum',
    description: 'Pusat registrasi kedatangan, pengambilan tiket antrean digital layar sentuh dengan tinggi ergonomis, dan informasi awal pelayanan terpadu.',
    icon: Laptop,
    color: 'from-blue-500 to-indigo-600',
    coordinates: { x: 10, y: 15, w: 25, h: 30 },
    hours: '08:00 - 16:00 WITA',
    services: ['Check-in Tiket Digital', 'Informasi Syarat Berkas', 'Asistensi Pengisian Formulir Mandiri', 'Penyediaan Kursi Roda Gratis'],
    capacity: '15 Pemohon',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
    deskHeight: 'Meja Rendah 75 cm (Ramah Kursi Roda)',
    wheelchairAccessible: true,
    wayfindingRoute: [
      'Titik Awal: Gerbang Pintu Masuk Utama MPP Simpurusiang',
      'Masuk melewati pintu kaca sensor otomatis dan jalur ramp landai kemiringan 6%',
      'E-Kiosk Antrean dan Meja Resepsionis berada tepat 5 meter lurus di depan pintu masuk'
    ]
  },
  {
    id: 'l1-kependudukan',
    floor: 1,
    name: 'Klaster Kependudukan & Catatan Sipil (Disdukcapil)',
    category: 'Loket Layanan',
    description: 'Loket terpadu Disdukcapil Luwu untuk perekaman & cetak KTP-el, Kartu Keluarga, KIA, Akta Kelahiran, dan Surat Pindah.',
    icon: Building2,
    color: 'from-emerald-500 to-teal-600',
    coordinates: { x: 40, y: 15, w: 30, h: 30 },
    hours: '08:00 - 15:30 WITA',
    services: ['Perekaman & Cetak KTP-el Cepat', 'Kartu Identitas Anak (KIA)', 'Akta Kelahiran & Kematian', 'Aktivasi Identitas Kependudukan Digital (IKD)'],
    capacity: '20 Pemohon',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
    deskHeight: 'Loket 01 Khusus Meja Rendah 75 cm (Prioritas Lansia & Difabel)',
    wheelchairAccessible: true,
    wayfindingRoute: [
      'Dari Front Office, ikuti garis kuning pemandu (guiding block) lurus sejauh 12 meter',
      'Belok kanan di sayap Timur Lantai 1',
      'Loket 01-04 Disdukcapil berada di sebelah kanan berdampingan dengan bilik foto KTP'
    ]
  },
  {
    id: 'l1-pajak-bank',
    floor: 1,
    name: 'Klaster Pendapatan Daerah (Bapenda) & Bank Sulselbar',
    category: 'Loket Layanan',
    description: 'Layanan pembayaran pajak daerah (PBB-P2, BPHTB, Retribusi) serta counter kas teller perbankan resmi tanpa antre luar gedung.',
    icon: Store,
    color: 'from-amber-500 to-orange-600',
    coordinates: { x: 75, y: 15, w: 20, h: 30 },
    hours: '08:00 - 15:00 WITA',
    services: ['Pembayaran PBB & Validasi BPHTB', 'Loket Kas Teller Bank Sulselbar', 'Konsultasi Pajak Daerah & Usaha', 'Mesin ATM Tarik Tunai'],
    capacity: '12 Pemohon',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800',
    deskHeight: 'Meja Kas Rendah & Jalur Antrean Kursi Roda',
    wheelchairAccessible: true,
    wayfindingRoute: [
      'Dari Front Office, belok kiri menyusuri koridor Barat Lantai 1 sejauh 15 meter',
      'Counter Kas Bank Sulselbar dan Loket Pajak Bapenda berada di ujung lorong sebelah kiri',
      'Tersedia mesin ATM dan loket teller ramah disabilitas'
    ]
  },
  {
    id: 'l1-laktasi-kids',
    floor: 1,
    name: 'Ruang Laktasi & Arena Edukasi Bermain Anak',
    category: 'Fasilitas Ramah',
    description: 'Fasilitas ramah ibu dan anak yang bersih, higienis, ber-AC sejuk, dilengkapi sofa laktasi privat, wastafel sterilizer, dan mainan edukatif SNI.',
    icon: Baby,
    color: 'from-rose-500 to-pink-600',
    coordinates: { x: 10, y: 55, w: 25, h: 35 },
    hours: '08:00 - 16:30 WITA',
    services: ['Sofa Laktasi Privat Bersih', 'Sterilizer Botol Susu & Wastafel Air Hangat', 'Mini Playground & Buku Cerita Anak', 'Kulkas Penyimpan ASI'],
    capacity: '10 Anak & Ibu',
    image: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=800',
    deskHeight: 'Pintu Lebar 90 cm Bebas Hambatan (Stroller Friendly)',
    wheelchairAccessible: true,
    wayfindingRoute: [
      'Dari Front Office, berjalan ke arah koridor Selatan menuju ruang tunggu utama',
      'Pintu Ruang Laktasi berada di sebelah kiri sebelum akses toilet umum',
      'Pintu geser otomatis dengan tombol pembuka ramah anak'
    ]
  },
  {
    id: 'l1-lounge-baca',
    floor: 1,
    name: 'Executive Waiting Lounge & Pojok Baca Digital',
    category: 'Fasilitas Umum',
    description: 'Ruang tunggu berkarpet dan sofa empuk dengan koneksi Wi-Fi kencang, charging station gratis, tablet e-library, dan air minum higienis gratis.',
    icon: BookOpen,
    color: 'from-purple-500 to-violet-600',
    coordinates: { x: 40, y: 55, w: 55, h: 35 },
    hours: '08:00 - 16:30 WITA',
    services: ['High-speed Wi-Fi 100 Mbps', 'Digital Library Tablet Screen & Buku Cetak', 'Free Water & Coffee Station', 'Layar FIDS Panggilan Antrean'],
    capacity: '50 Pemohon',
    image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=800',
    deskHeight: 'Area Parkir Khusus Kursi Roda dengan Stop Kontak Pengisian Daya',
    wheelchairAccessible: true,
    wayfindingRoute: [
      'Berada persis di tengah atrium gedung Lantai 1',
      'Dikelilingi layar monitor LED pemanggilan antrean dari segala sudut pandang'
    ]
  },
  {
    id: 'l1-toilet-difabel',
    floor: 1,
    name: 'Toilet Aksesibel & Ramp Difabel Utama',
    category: 'Fasilitas Ramah',
    description: 'Toilet standar aksesibilitas permen PUPR dengan pintu geser 90 cm, pegangan rambat (grab bar), tombol darurat SOS, dan wastafel rendah.',
    icon: Accessibility,
    color: 'from-teal-600 to-emerald-700',
    coordinates: { x: 75, y: 55, w: 20, h: 35 },
    hours: 'Buka Sepanjang Jam Operasional',
    services: ['Pintu Geser Lebar 100 cm', 'Pegangan Rambat Stainless Steel Kokoh', 'Tombol Alarm Darurat SOS ke Petugas', 'Lantai Anti-Selip'],
    capacity: '1 Pemohon + 1 Pendamping',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800',
    deskHeight: 'Ketinggian Kloset 45-50 cm Sesuai Standar Kursi Roda',
    wheelchairAccessible: true,
    wayfindingRoute: [
      'Dari koridor Timur Lantai 1, ikuti rambu piktogram disabilitas internasional',
      'Terletak di sebelah kanan koridor sebelum akses lift gedung'
    ]
  },

  // --- LANTAI 2 (INVESTASI, PERIZINAN BERUSAHA & KONSULTASI VIP) ---
  {
    id: 'l2-investor-lounge',
    floor: 2,
    name: 'VIP Investor Lounge & Fast-Track Desk',
    category: 'Investor VIP',
    description: 'Ruang khusus konsultasi investor terpadu dengan asistensi personal DPMPTSP, integrasi GIS Spasial peta investasi Luwu, dan insentif daerah.',
    icon: Armchair,
    color: 'from-emerald-500 to-cyan-600',
    coordinates: { x: 10, y: 15, w: 40, h: 35 },
    hours: '08:30 - 16:00 WITA',
    services: ['Konsultasi One-on-One Tim Teknis Terpadu', 'Simulasi ROI & GIS RTRW Luwu', 'Asistensi OSS-RBA & PKKPR', 'Hospitality Jamuan Kopi Toraja-Luwu'],
    capacity: '15 Investor VIP',
    image: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=800',
    deskHeight: 'Meja Rapat Ergonomis & Akses Pintu Lebar',
    wheelchairAccessible: true,
    wayfindingRoute: [
      'Gunakan Lift Aksesibel di sisi Tenggara Lantai 1 menuju Lantai 2',
      'Keluar dari lift, belok kanan 8 meter melewati koridor VIP berkarpet',
      'Ruang VIP Investor Lounge berada di pintu kaca berpintu ganda sebelah kanan'
    ]
  },
  {
    id: 'l2-perizinan-oss',
    floor: 2,
    name: 'Klaster Perizinan Berusaha (OSS) & Sektoral PUPTR',
    category: 'Loket Layanan',
    description: 'Pusat perizinan PBG, Lingkungan Hidup, Izin Usaha Perdagangan, Kesehatan, serta verifikasi rekomendasi teknis OPD lintas instansi.',
    icon: Building2,
    color: 'from-blue-500 to-teal-600',
    coordinates: { x: 55, y: 15, w: 40, h: 35 },
    hours: '08:00 - 15:30 WITA',
    services: ['Persetujuan Bangunan Gedung (PBG SIMBG)', 'Penerbitan NIB Usaha Menengah-Besar', 'Izin Operasional Apotek / Klinik', 'Verifikasi Dokumen Lingkungan (AMDAL/UKL-UPL)'],
    capacity: '25 Pemohon',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
    deskHeight: 'Loket Meja Konsultasi Semi-Private',
    wheelchairAccessible: true,
    wayfindingRoute: [
      'Gunakan Lift Gedung menuju Lantai 2',
      'Keluar lift, ikuti lorong utama ke arah Utara sejauh 15 meter',
      'Klaster Perizinan OSS & PBG berada di ruangan aula kaca berlampu terang'
    ]
  },
  {
    id: 'l2-ruang-mediasi',
    floor: 2,
    name: 'Ruang Mediasi & Konsultasi Hukum Kejaksaan',
    category: 'Konsultasi',
    description: 'Ruang rapat kedap suara untuk penyelesaian sengketa perizinan, konsultasi hukum gratis Kejaksaan Negeri Luwu, dan pengaduan SP4N-LAPOR.',
    icon: HeartHandshake,
    color: 'from-slate-600 to-slate-800',
    coordinates: { x: 10, y: 55, w: 35, h: 35 },
    hours: '09:00 - 15:00 WITA',
    services: ['Klinik Hukum Gratis Datun Kejaksaan Negeri', 'Mediasi Masalah Lahan & Perizinan', 'Kanal Tatap Muka Pengaduan SP4N-LAPOR', 'Konsultasi Bantuan Hukum Difabel'],
    capacity: '12 Orang',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800',
    deskHeight: 'Ruangan Akustik Kedap Suara Bebas Hambatan',
    wheelchairAccessible: true,
    wayfindingRoute: [
      'Naik ke Lantai 2 menggunakan Lift Difabel',
      'Belok kiri menuju koridor Barat Lantai 2 sejauh 10 meter',
      'Ruang Mediasi berada di pintu kedap suara berlabel "Klinik Hukum Terpadu"'
    ]
  },
  {
    id: 'l2-musholla-vip',
    floor: 2,
    name: 'Musholla Al-Mabrur & Tempat Wudhu Duduk',
    category: 'Fasilitas Umum',
    description: 'Sarana ibadah yang luas, bersih, dan sejuk dengan pendingin AC, mukena/sarung bersih, dan tempat wudhu khusus duduk untuk lansia dan difabel.',
    icon: Moon,
    color: 'from-teal-600 to-emerald-700',
    coordinates: { x: 50, y: 55, w: 45, h: 35 },
    hours: 'Buka Sepanjang Jam Operasional',
    services: ['Mukena & Sajadah Bersih Terawat', 'Pendingin Ruangan (AC) Dingin', 'Tempat Wudhu Duduk Khusus Disabilitas / Lansia', 'Kamera CCTV Keamanan'],
    capacity: '30 Jamaah',
    image: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80&w=800',
    deskHeight: 'Lantai Rata Dilengkapi Kursi Sholat Khusus',
    wheelchairAccessible: true,
    wayfindingRoute: [
      'Dari Lantai 2, ikuti penunjuk arah kubah hijau ke koridor Timur',
      'Terletak di ujung koridor timur berdampingan dengan balkon sejuk gedung'
    ]
  }
];

export function InteractiveFloorPlan({ isDark = false }: { isDark?: boolean }) {
  const { t } = useTranslation();
  const [activeFloor, setActiveFloor] = useState<1 | 2>(1);
  const [selectedZone, setSelectedZone] = useState<RoomZone | null>(ZONES_DATA[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isWheelchairFilterActive, setIsWheelchairFilterActive] = useState<boolean>(false);

  // Filtered zones based on floor, search query, and accessibility mode
  const currentFloorZones = ZONES_DATA.filter(z => {
    if (z.floor !== activeFloor) return false;
    if (isWheelchairFilterActive && !z.wheelchairAccessible) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      z.name.toLowerCase().includes(q) ||
      z.description.toLowerCase().includes(q) ||
      z.services.some(s => s.toLowerCase().includes(q)) ||
      z.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full space-y-6">
      {/* Header & Wayfinding Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-medium tracking-tight font-sans text-slate-900 dark:text-white flex items-center gap-2">
              <Navigation className="w-5 h-5 text-emerald-500" />
              <span>{t("mppPortal.interactiveFloorPlan.title", "Digital Wayfinding & Denah Interaktif MPP")}</span>
            </h3>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
              RAMAH DISABILITAS
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Peta denah navigasi Lantai 1 & Lantai 2 dengan penunjuk arah ramah kursi roda dan rute loket terpadu
          </p>
        </div>

        {/* Floor Switcher & Accessibility Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Wheelchair Accessibility Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsWheelchairFilterActive(!isWheelchairFilterActive)}
            className={`min-h-[40px] px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              isWheelchairFilterActive
                ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/40'
                : isDark
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Sorot Fasilitas & Rute Khusus Kursi Roda"
          >
            <Accessibility className="w-4 h-4 text-blue-400" />
            <span>{isWheelchairFilterActive ? 'Mode Difabel Aktif' : 'Rute Kursi Roda'}</span>
          </button>

          {/* Floor Tabs */}
          <div className={`flex items-center p-1 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => {
                setActiveFloor(1);
                const first = ZONES_DATA.find(z => z.floor === 1);
                if (first) setSelectedZone(first);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFloor === 1
                  ? 'bg-emerald-600 text-white shadow-md'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Lantai 1</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveFloor(2);
                const first = ZONES_DATA.find(z => z.floor === 2);
                if (first) setSelectedZone(first);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFloor === 2
                  ? 'bg-emerald-600 text-white shadow-md'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Lantai 2</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Search & Filter Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari loket atau fasilitas di denah (Contoh: Disdukcapil, Laktasi, Pajak, Musholla, Kursi Roda)..."
          className="w-full pl-10 pr-9 py-2.5 rounded-2xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-sans"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Floor Plan Layout & Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left/Center: Visual Interactive Grid (7 Cols) */}
        <div className={`lg:col-span-7 p-4 sm:p-6 rounded-3xl border relative min-h-[420px] flex flex-col justify-between overflow-hidden ${
          isDark 
            ? 'bg-slate-950/80 border-slate-800 shadow-xl' 
            : 'bg-gradient-to-br from-slate-50 to-white border-slate-200 shadow-xl shadow-slate-200/50'
        }`}>
          {/* Blueprint Grid Texture */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="relative z-10 flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-500 animate-spin" style={{ animationDuration: '12s' }} />
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 font-mono">
                GEDUNG MPP SIMPURUSIANG • LANTAI {activeFloor}
              </span>
            </div>

            {isWheelchairFilterActive && (
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Accessibility className="w-3.5 h-3.5" />
                <span>Menampilkan Akses Kursi Roda</span>
              </span>
            )}
          </div>

          {/* Interactive Zone Blocks Grid */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 my-auto">
            {currentFloorZones.map((zone) => {
              const isSelected = selectedZone?.id === zone.id;
              const IconComp = zone.icon;
              return (
                <motion.button
                  key={zone.id}
                  type="button"
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedZone(zone)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/15 ring-2 ring-emerald-500/40'
                      : isDark
                        ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${zone.color} text-white shadow-sm`}>
                      <IconComp className="w-4 h-4" />
                    </div>

                    <div className="flex items-center gap-1">
                      {zone.wheelchairAccessible && (
                        <span className="p-1 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20" title="Akses Kursi Roda">
                          <Accessibility className="w-3 h-3" />
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected 
                          ? 'bg-emerald-600 text-white' 
                          : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {zone.category}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1 font-sans">
                      {zone.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                      {zone.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-emerald-500" /> {zone.hours.split(' ')[0]}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                      <span>Rute Petunjuk</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="relative z-10 text-center text-[10px] text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2">
            <Footprints className="w-3.5 h-3.5 text-amber-500" />
            <span>Guiding Block (ubin pemandu kuning) terpasang di seluruh koridor untuk penyandang tunanetra.</span>
          </div>
        </div>

        {/* Right: Selected Zone Detail & Step-by-Step Wayfinding (5 Cols) */}
        <div className="lg:col-span-5">
          <AnimatePresence mode="wait">
            {selectedZone && (
              <motion.div
                key={selectedZone.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`p-5 sm:p-6 rounded-3xl border h-full flex flex-col justify-between ${
                  isDark 
                    ? 'bg-slate-900/90 border-emerald-500/20 shadow-xl' 
                    : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'
                }`}
              >
                <div>
                  {/* Photo Preview */}
                  <div className="relative h-40 sm:h-44 rounded-2xl overflow-hidden mb-4 border border-slate-200/50 dark:border-slate-700">
                    <img 
                      src={selectedZone.image} 
                      alt={selectedZone.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                      <span className="text-xs font-bold bg-emerald-600 px-2.5 py-1 rounded-lg">
                        Lantai {selectedZone.floor}
                      </span>
                      <span className="text-xs font-semibold bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg font-mono">
                        Kapasitas: {selectedZone.capacity}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1 font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    {selectedZone.category}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold font-sans text-slate-900 dark:text-white">
                    {selectedZone.name}
                  </h3>

                  {/* Accessibility Badge Tag */}
                  <div className="mt-2 p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-[11px] flex items-center gap-2">
                    <Accessibility className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>{selectedZone.deskHeight}</span>
                  </div>

                  {/* Step-by-Step Wayfinding Guidance */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 font-mono">
                      <Navigation className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Panduan Langkah Rute (Wayfinding):</span>
                    </h5>
                    <div className="space-y-1.5">
                      {selectedZone.wayfindingRoute.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-snug">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Facilities / Services */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 font-mono">
                      Layanan & Fasilitas:
                    </h5>
                    <div className="space-y-1">
                      {selectedZone.services.map((srv, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{srv}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <div className="flex-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="block font-semibold text-slate-700 dark:text-slate-300">Jam Layanan:</span>
                    {selectedZone.hours}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById('smart-live-queue')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Ambil Antrean Loket</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
