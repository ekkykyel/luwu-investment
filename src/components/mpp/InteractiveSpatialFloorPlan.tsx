import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Layers, 
  Eye, 
  Compass, 
  Info, 
  Ticket, 
  ArrowRight, 
  Sparkles,
  Maximize2,
  X
} from 'lucide-react';

export interface MapPinZone {
  id: string;
  name: string;
  category: 'Layanan' | 'Fasilitas' | 'Prioritas' | 'Mandiri';
  x: number; // percentage from left
  y: number; // percentage from top
  floor: 1 | 2;
  description: string;
  loketCode?: string;
  agency?: string;
  color: string;
  features: string[];
}

const PIN_ZONES: MapPinZone[] = [
  // Lantai 1
  {
    id: 'pin-1',
    name: 'Hall Pelayanan Utama & Meja Informasi',
    category: 'Layanan',
    x: 50,
    y: 78,
    floor: 1,
    description: 'Pusat resepsionis informasi pelayanan, pengambilan nomor antrean, dan pendaftaran mandiri.',
    color: 'bg-emerald-500',
    features: ['Meja Duta Pelayanan', 'Kios Ambil Antrean', 'Brosur Layanan Lengkap'],
  },
  {
    id: 'pin-2',
    name: 'Klaster Gerai Disdukcapil (Loket 01-02)',
    category: 'Layanan',
    x: 25,
    y: 55,
    floor: 1,
    description: 'Perekaman KTP-el, pencetakan KIA, Kartu Keluarga, dan penerbitan Akta Kelahiran/Kematian.',
    loketCode: 'Loket 01 & 02',
    agency: 'Disdukcapil Luwu',
    color: 'bg-blue-500',
    features: ['Biometrik KTP-el', 'Fast Track Lansia', 'Pengambilan KTP Langsung Jadi'],
  },
  {
    id: 'pin-3',
    name: 'Gerai Terpadu DPMPTSP & OSS-RBA (Loket 03-04)',
    category: 'Layanan',
    x: 75,
    y: 55,
    floor: 1,
    description: 'Penerbitan NIB OSS-RBA, izin non-OSS, verifikasi kesesuaian ruang KKPPR, dan izin kesehatan.',
    loketCode: 'Loket 03 & 04',
    agency: 'DPMPTSP Kab. Luwu',
    color: 'bg-teal-500',
    features: ['Konsultasi KBLI 2020', 'Pencetakan NIB Digital', 'Pendampingan Berkas'],
  },
  {
    id: 'pin-4',
    name: 'Executive Lounge & Pojok Kopi Luwu',
    category: 'Prioritas',
    x: 82,
    y: 28,
    floor: 1,
    description: 'Ruang tunggu eksklusif investor dan pemohon prioritas dengan fasilitas sofa nyaman dan kopi gratis.',
    color: 'bg-amber-500',
    features: ['Wi-Fi Orbit Cepat', 'Charging Station', 'Kopi Arabika/Robusta Luwu'],
  },
  {
    id: 'pin-5',
    name: 'Bilik Laktasi & Arena Bermain Ramah Anak',
    category: 'Fasilitas',
    x: 18,
    y: 28,
    floor: 1,
    description: 'Ruang tertutup higienis untuk ibu menyusui dan ruang bermain anak dengan lantai matras aman.',
    color: 'bg-rose-500',
    features: ['Kulkas ASI', 'Wastafel Higienis', 'Alat Permainan Edukatif'],
  },
  {
    id: 'pin-6',
    name: 'Kios Mandiri & Scanner KTP-el',
    category: 'Mandiri',
    x: 48,
    y: 35,
    floor: 1,
    description: 'Anjungan cetak dokumen mandiri, validasi berkas mandiri, dan survei kepuasan SKM digital.',
    color: 'bg-purple-500',
    features: ['Layar Sentuh 32"', 'Thermal Printer Resi', 'Scanner e-KTP NFC'],
  },

  // Lantai 2
  {
    id: 'pin-7',
    name: 'Ruang Konsultasi Teknis & VIP Investor Desk',
    category: 'Prioritas',
    x: 50,
    y: 32,
    floor: 2,
    description: 'Ruang rapat koordinasi penanaman modal dan sidang teknis persetujuan izin bangunan gedung (PBG).',
    color: 'bg-amber-500',
    features: ['Smart TV Presentation', 'Kapasitas 15 Orang', 'Konsultasi Tim Ahli'],
  },
  {
    id: 'pin-8',
    name: 'Command Center & Monitoring Room',
    category: 'Fasilitas',
    x: 80,
    y: 45,
    floor: 2,
    description: 'Pusat pemantauan CCTV analitik AI, SLA loket, radar kepuasan SKM, dan helpdesk SP4N LAPOR.',
    color: 'bg-slate-700',
    features: ['Video Wall 9 Screen', 'Server Antrean Backup', 'Hotline Operator'],
  },
  {
    id: 'pin-9',
    name: 'Pojok Baca Digital & Ruang Edukasi',
    category: 'Fasilitas',
    x: 20,
    y: 45,
    floor: 2,
    description: 'Perpustakaan digital terintegrasi Perpustakaan Nasional dan koleksi literatur regulasi perizinan.',
    color: 'bg-cyan-500',
    features: ['Tablet e-Book', 'Meja Baca Akustik', 'Koleksi JDIH Pemkab Luwu'],
  },
];

export interface InteractiveSpatialFloorPlanProps {
  onSelectLoket?: (loketName: string) => void;
  isDark?: boolean;
}

export const InteractiveSpatialFloorPlan: React.FC<InteractiveSpatialFloorPlanProps> = ({
  onSelectLoket,
  isDark = false,
}) => {
  const [activeFloor, setActiveFloor] = useState<1 | 2>(1);
  const [selectedPin, setSelectedPin] = useState<MapPinZone | null>(null);

  const floorPins = PIN_ZONES.filter(p => p.floor === activeFloor);

  return (
    <section id="denah-interaktif" className="w-full space-y-6 scroll-mt-28">
      
      {/* Header Bar with Floor Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300/60 dark:border-blue-700/60">
            <Compass className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Navigasi Spasial Denah Interaktif</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
            Denah Ruangan & Loket Pelayanan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Klik pin-drop pada kanvas denah untuk melihat informasi fasilitas dan loket instansi secara langsung.
          </p>
        </div>

        {/* Floor Switcher Buttons */}
        <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveFloor(1);
              setSelectedPin(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFloor === 1
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Lantai 1 (Hall Utama)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveFloor(2);
              setSelectedPin(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFloor === 2
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Lantai 2 (VIP & Rapat)
          </button>
        </div>
      </div>

      {/* 2. INTERACTIVE MAP CANVAS */}
      <div className="relative w-full rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl p-4 sm:p-8 min-h-[460px] flex items-center justify-center">
        
        {/* Architectural Blueprint Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent pointer-events-none" />

        {/* Schematic Outline Building Diagram */}
        <div className="relative w-full max-w-2xl h-[360px] sm:h-[400px] border-2 border-emerald-500/30 rounded-3xl bg-slate-950/60 backdrop-blur-md p-4 flex flex-col justify-between shadow-inner">
          
          {/* Top Corridor indicator */}
          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400/60 uppercase tracking-widest px-2">
            <span>Sisi Belakang • Parkir & Taman</span>
            <span>Gedung MPP Simpurusiang • {activeFloor === 1 ? 'Lantai 1' : 'Lantai 2'}</span>
          </div>

          {/* Zones Wireframe Blocks */}
          <div className="grid grid-cols-3 gap-3 h-48 opacity-30 pointer-events-none my-auto">
            <div className="border border-dashed border-emerald-500/40 rounded-2xl p-2 flex items-end">
              <span className="text-[10px] font-mono text-emerald-400">Sayap Barat</span>
            </div>
            <div className="border border-dashed border-teal-500/40 rounded-2xl p-2 flex items-center justify-center">
              <span className="text-[10px] font-mono text-teal-400">Atrium Pusat</span>
            </div>
            <div className="border border-dashed border-emerald-500/40 rounded-2xl p-2 flex items-end justify-end">
              <span className="text-[10px] font-mono text-emerald-400">Sayap Timur</span>
            </div>
          </div>

          {/* Bottom Corridor Entrance indicator */}
          <div className="flex items-center justify-center text-[10px] font-mono text-emerald-400/80 uppercase tracking-widest pt-2 border-t border-emerald-500/20">
            ▲ Pintu Masuk Utama & Jalur Pedestrian Disabilitas ▲
          </div>

          {/* ABSOLUTE POSITIONED INTERACTIVE PIN-DROPS */}
          {floorPins.map((pin) => {
            const isSelected = selectedPin?.id === pin.id;
            return (
              <div
                key={pin.id}
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
              >
                <button
                  type="button"
                  onClick={() => setSelectedPin(pin)}
                  className={`relative flex items-center justify-center p-2 rounded-2xl transition-all cursor-pointer shadow-lg active:scale-90 ${
                    isSelected
                      ? 'scale-125 ring-4 ring-emerald-400 bg-emerald-500 text-white z-30'
                      : 'hover:scale-115 bg-white/90 text-slate-900 hover:bg-emerald-400 hover:text-white'
                  }`}
                  title={pin.name}
                  aria-label={pin.name}
                >
                  <MapPin className="w-5 h-5 fill-current" />
                  
                  {/* Pulse Beacon Effect */}
                  <span className="absolute -inset-1 rounded-2xl bg-emerald-400 opacity-30 animate-ping pointer-events-none" />
                </button>

                {/* Micro tooltip pill on hover */}
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-30 border border-slate-700 shadow-md">
                  {pin.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Detail Popover Card when Pin is Clicked */}
        <AnimatePresence>
          {selectedPin && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:w-96 p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-700 shadow-2xl z-40 text-slate-900 dark:text-white space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                    {selectedPin.category} • Lantai {selectedPin.floor}
                  </span>
                  <h4 className="text-base font-extrabold font-sans mt-1">
                    {selectedPin.name}
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPin(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {selectedPin.description}
              </p>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedPin.features.map((f, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                    ✓ {f}
                  </span>
                ))}
              </div>

              {/* Action Button */}
              {selectedPin.agency && onSelectLoket && (
                <button
                  type="button"
                  onClick={() => onSelectLoket(selectedPin.agency || selectedPin.name)}
                  className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md shadow-emerald-600/30"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Ambil Antrean di {selectedPin.loketCode || 'Loket Ini'}</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default InteractiveSpatialFloorPlan;
