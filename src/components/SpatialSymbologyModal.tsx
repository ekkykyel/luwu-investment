import React, { useState, useMemo } from "react";
import { 
  Palette, Layers, X, Search, Info, ShieldAlert, CheckCircle2, 
  MapPin, Sliders, ExternalLink, Filter, ChevronRight, Eye, 
  TreePine, Building, Factory, Fish, Tractor, AlertTriangle, 
  Droplets, Mountain, Compass, Sparkles, Navigation
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GeoJSONLayer, SektorInvestasi } from "../types";
import { LuwuLogo } from "./LuwuLogo";

export interface SymbologyItem {
  id: string;
  name: string;
  category: string;
  layerId: string;
  color: string;
  strokeColor?: string;
  fillOpacity?: number;
  strokeWidth?: number;
  lineDashArray?: string;
  geometryType: "polygon" | "line" | "point";
  description: string;
  regulationNote?: string;
  icon?: string;
}

// Master GIS Symbology Specifications directly matching MaplibreComponent & RTRW Luwu
export const MASTER_SYMBOLOGY_DEFINITIONS: SymbologyItem[] = [
  // 1. Pola Ruang & RTRW Zonasi
  {
    id: "zonasi_hutan_lindung",
    name: "Kawasan Hutan Lindung (HL)",
    category: "Pola Ruang RTRW",
    layerId: "layer_zonasi",
    color: "#14532d",
    strokeColor: "#064e3b",
    fillOpacity: 0.65,
    strokeWidth: 2,
    geometryType: "polygon",
    description: "Kawasan hutan yang memiliki fungsi pokok sebagai perlindungan sistem penyangga kehidupan, tata air, dan pencegah erosi.",
    regulationNote: "Zona Terlarang untuk izin industri ekstraktif dan alih fungsi lahan."
  },
  {
    id: "zonasi_hutan_produksi",
    name: "Kawasan Hutan Produksi (HP)",
    category: "Pola Ruang RTRW",
    layerId: "layer_zonasi",
    color: "#16a34a",
    strokeColor: "#14532d",
    fillOpacity: 0.6,
    strokeWidth: 2,
    geometryType: "polygon",
    description: "Kawasan hutan yang mempunyai fungsi pokok memproduksi hasil hutan kayu dan bukan kayu.",
    regulationNote: "Diperkenankan pemanfaatan hasil hutan non-kayu dan izin konsesi resmi."
  },
  {
    id: "zonasi_hutan_produksi_terbatas",
    name: "Hutan Produksi Terbatas (HPT)",
    category: "Pola Ruang RTRW",
    layerId: "layer_zonasi",
    color: "#22c55e",
    strokeColor: "#15803d",
    fillOpacity: 0.6,
    strokeWidth: 2,
    geometryType: "polygon",
    description: "Hutan produksi dengan eksploitasi terbatas guna mempertahankan fungsi konservasi tanah dan kelerengan.",
    regulationNote: "Dibatasi pada komoditas agroforestri tertentu."
  },
  {
    id: "zonasi_lindung_setempat",
    name: "Kawasan Lindung Setempat",
    category: "Pola Ruang RTRW",
    layerId: "layer_zonasi",
    color: "#059669",
    strokeColor: "#047857",
    fillOpacity: 0.6,
    strokeWidth: 2,
    geometryType: "polygon",
    description: "Sempadan sungai, sempadan danau, kawasan sekitar mata air, dan sempadan pantai perlindungan erosi.",
    regulationNote: "Zona bebas bangunan permanen dalam radius sempadan teknis."
  },
  {
    id: "zonasi_pertanian_lahan_basah",
    name: "Pertanian Lahan Basah (Sawah)",
    category: "Pola Ruang RTRW",
    layerId: "layer_zonasi",
    color: "#a3e635",
    strokeColor: "#4d7c0f",
    fillOpacity: 0.6,
    strokeWidth: 2,
    geometryType: "polygon",
    description: "Lahan pertanian beririgasi teknis/setengah teknis untuk ketahanan pangan pokok daerah (LP2B).",
    regulationNote: "Dilindungi oleh Perda LP2B, dilarang alih fungsi tanpa persetujuan khusus."
  },
  {
    id: "zonasi_pertanian_lahan_kering",
    name: "Pertanian Lahan Kering & Perkebunan",
    category: "Pola Ruang RTRW",
    layerId: "layer_zonasi",
    color: "#d97706",
    strokeColor: "#9a3412",
    fillOpacity: 0.6,
    strokeWidth: 2,
    geometryType: "polygon",
    description: "Zona budidaya perkebunan kakao, cengkeh, kopi, kelapa sawit, dan tanaman palawija.",
    regulationNote: "Kawasan prioritas investasi hilirisasi agribisnis dan pengolahan hasil perkebunan."
  },
  {
    id: "zonasi_kawasan_industri",
    name: "Kawasan Peruntukan Industri (KPI)",
    category: "Pola Ruang RTRW",
    layerId: "layer_zonasi",
    color: "#64748b",
    strokeColor: "#475569",
    fillOpacity: 0.6,
    strokeWidth: 2,
    geometryType: "polygon",
    description: "Wilayah yang dialokasikan khusus untuk pemusatan fasilitas kegiatan industri manufaktur dan pergudangan.",
    regulationNote: "Zona utama izin industri skala besar dan menengah dengan AMDAL lengkap."
  },
  {
    id: "zonasi_pemukiman_perkotaan",
    name: "Pemukiman Perkotaan",
    category: "Pola Ruang RTRW",
    layerId: "layer_zonasi",
    color: "#eab308",
    strokeColor: "#854d0e",
    fillOpacity: 0.6,
    strokeWidth: 2,
    geometryType: "polygon",
    description: "Kawasan perumahan dengan kepadatan menengah-tinggi yang dilengkapi fasilitas perkotaan.",
    regulationNote: "Sesuai untuk investasi sektor jasa, perdagangan, dan properti komersial."
  },
  {
    id: "zonasi_pemukiman_pedesaan",
    name: "Pemukiman Pedesaan",
    category: "Pola Ruang RTRW",
    layerId: "layer_zonasi",
    color: "#fde047",
    strokeColor: "#a16207",
    fillOpacity: 0.6,
    strokeWidth: 2,
    geometryType: "polygon",
    description: "Kawasan perumahan dan permukiman warga berbasis perdesaan dan agraris.",
    regulationNote: "Prioritas UMKM, sentra kerajinan, dan fasilitas pemberdayaan warga."
  },
  {
    id: "zonasi_perikanan",
    name: "Kawasan Perikanan & Tambak",
    category: "Pola Ruang RTRW",
    layerId: "layer_zonasi",
    color: "#0ea5e9",
    strokeColor: "#0369a1",
    fillOpacity: 0.6,
    strokeWidth: 2,
    geometryType: "polygon",
    description: "Wilayah perairan darat dan pesisir untuk tambak udang, bandeng, dan budidaya air payau.",
    regulationNote: "Zona prioritas investasi perikanan modern dan industri pengolahan pakan."
  },

  // 2. Layer Tematik Sektoral Khusus
  {
    id: "tematik_sawah",
    name: "Sebaran Pertanian Sawah",
    category: "Tematik Sektoral",
    layerId: "layer_sawah",
    color: "#22c55e",
    strokeColor: "#15803d",
    fillOpacity: 0.55,
    strokeWidth: 2,
    geometryType: "polygon",
    description: "Hamparan sawah produktif irigasi dan tadah hujan terpetakan dari citra satelit.",
    regulationNote: "Indikator ketahanan pangan Luwu."
  },
  {
    id: "tematik_tambak",
    name: "Sebaran Perikanan Tambak",
    category: "Tematik Sektoral",
    layerId: "layer_tambak",
    color: "#0ea5e9",
    strokeColor: "#0284c7",
    fillOpacity: 0.55,
    strokeWidth: 2,
    geometryType: "polygon",
    description: "Petak budidaya tambak pesisir aktif di sepanjang garis pantai Teluk Bone.",
    regulationNote: "Sentra budidaya udang vaname dan ikan bandeng unggulan."
  },
  {
    id: "tematik_mangrove",
    name: "Sabuk Hijau Mangrove Pesisir",
    category: "Tematik Sektoral",
    layerId: "layer_mangrove",
    color: "#0d9488",
    strokeColor: "#115e59",
    fillOpacity: 0.6,
    strokeWidth: 2,
    geometryType: "polygon",
    description: "Ekosistem hutan bakau alami untuk mitigasi bencana abrasi dan zona pemijahan biota laut.",
    regulationNote: "Kawasan konservasi mutlak dilindungi."
  },
  {
    id: "tematik_lahan_kering_sekunder",
    name: "Lahan Kering Sekunder",
    category: "Tematik Sektoral",
    layerId: "layer_lahan_kering_sekunder",
    color: "#f59e0b",
    strokeColor: "#d97706",
    fillOpacity: 0.55,
    strokeWidth: 2,
    geometryType: "polygon",
    description: "Lahan non-irigasi berupa tegalan, kebun campuran, dan semak belukar.",
    regulationNote: "Potensial untuk perluasan komoditas hortikultura dan peternakan."
  },
  {
    id: "tematik_lahan_kering_primer",
    name: "Lahan Kering Primer",
    category: "Tematik Sektoral",
    layerId: "layer_lahan_kering_primer",
    color: "#b45309",
    strokeColor: "#78350f",
    fillOpacity: 0.6,
    strokeWidth: 2,
    geometryType: "polygon",
    description: "Vegetasi tutupan lahan alami dataran tinggi pegunungan Latimojong dan sekitarnya.",
    regulationNote: "Zona tangkapan air hulu DAS utama Luwu."
  },

  // 3. Mitigasi Kebencanaan & Kesesuaian Lahan
  {
    id: "bencana_banjir",
    name: "Zona Risiko Banjir",
    category: "Mitigasi Bencana",
    layerId: "layer_flood_risk",
    color: "#3b82f6",
    strokeColor: "#1d4ed8",
    fillOpacity: 0.55,
    strokeWidth: 2.5,
    lineDashArray: "4 2",
    geometryType: "polygon",
    description: "Wilayah dataran aluvial dan bantaran sungai yang rentan terhadap genangan air saat curah hujan tinggi.",
    regulationNote: "Wajib kajian hidrologi dan peninggian struktur elevasi bangunan bagi calon investor."
  },
  {
    id: "bencana_longsor",
    name: "Zona Risiko Tanah Longsor",
    category: "Mitigasi Bencana",
    layerId: "layer_landslide_risk",
    color: "#ef4444",
    strokeColor: "#b91c1c",
    fillOpacity: 0.55,
    strokeWidth: 2.5,
    lineDashArray: "3 3",
    geometryType: "polygon",
    description: "Kawasan lereng pegunungan curam dengan kestabilan lereng rendah dan rekahan batuan.",
    regulationNote: "Pembangunan struktur berat dibatasi ketat guna mencegah korban bencana."
  },
  {
    id: "kesesuaian_lahan",
    name: "Kesesuaian Lahan Komoditas",
    category: "Mitigasi Bencana",
    layerId: "layer_historical_suitability",
    color: "#f97316",
    strokeColor: "#c2410c",
    fillOpacity: 0.5,
    strokeWidth: 2,
    geometryType: "polygon",
    description: "Poligon hasil analisis agroklimat, tekstur tanah, dan kelerengan untuk optimalisasi hasil panen.",
    regulationNote: "Rekomendasi saintifik bagi investor perkebunan kakao, cengkeh, dan kopi."
  },

  // 4. Transportasi & Infrastruktur
  {
    id: "infrastruktur_jalan",
    name: "Jaringan Jalan Utama",
    category: "Infrastruktur & Akses",
    layerId: "layer_jalan",
    color: "#eab308",
    strokeColor: "#ca8a04",
    strokeWidth: 3.5,
    geometryType: "line",
    description: "Ruas jalan nasional (Trans-Sulawesi), jalan provinsi, dan jalan arteri penggerak logistik daerah.",
    regulationNote: "Koridor utama mobilitas bahan baku dan distribusi komoditas ke pelabuhan/bandara."
  },
  {
    id: "infrastruktur_titik",
    name: "Fasilitas Publik & Simpul Logistik",
    category: "Infrastruktur & Akses",
    layerId: "layer_infrastruktur",
    color: "#10b981",
    strokeColor: "#ffffff",
    geometryType: "point",
    icon: "pin",
    description: "Sebaran simpul strategis: Pelabuhan Belopa/Tadette, Bandara I Laga Ligo Bua, Rumah Sakit, dan Pusat Pemerintahan.",
    regulationNote: "Fasilitas pendukung kemudahan berusaha dan operasional bisnis."
  },

  // 5. Batas Administrasi
  {
    id: "batas_kecamatan",
    name: "Batas Wilayah Kecamatan",
    category: "Batas Administrasi",
    layerId: "layer_kecamatan",
    color: "#10b981",
    strokeColor: "#059669",
    strokeWidth: 2.5,
    lineDashArray: "4 2",
    geometryType: "line",
    description: "Batas yurisdiksi resmi 22 kecamatan di seluruh wilayah Kabupaten Luwu.",
    regulationNote: "Rujukan wilayah administratif perizinan dasar."
  },
  {
    id: "batas_desa",
    name: "Batas Wilayah Desa / Kelurahan",
    category: "Batas Administrasi",
    layerId: "layer_desa",
    color: "#06b6d4",
    strokeColor: "#0891b2",
    strokeWidth: 1.8,
    lineDashArray: "2 2",
    geometryType: "line",
    description: "Batas administratif 227 desa dan kelurahan di Kabupaten Luwu.",
    regulationNote: "Rujukan kepemilikan persil tanah desa dan pemberdayaan masyarakat lokal."
  },

  // 6. Sektor Potensi Investasi
  {
    id: "sektor_kelautan",
    name: "Sektor Kelautan & Perikanan",
    category: "Sektor Investasi",
    layerId: "layer_potensi",
    color: "#3b82f6",
    strokeColor: "#1d4ed8",
    geometryType: "point",
    icon: "fish",
    description: "Potensi budidaya rumput laut, perikanan tangkap, cold storage, dan pengolahan hasil laut.",
    regulationNote: "Dukungan akses langsung ke perairan Teluk Bone."
  },
  {
    id: "sektor_pertanian",
    name: "Sektor Pertanian & Perkebunan",
    category: "Sektor Investasi",
    layerId: "layer_potensi",
    color: "#10b981",
    strokeColor: "#047857",
    geometryType: "point",
    icon: "tractor",
    description: "Peluang investasi pengolahan kakao bean-to-bar, kopi specialty, cengkeh, dan modern farming.",
    regulationNote: "Luwu merupakan salah satu lumbung kakao dan padi terbesar di Sulsel."
  },
  {
    id: "sektor_pertambangan",
    name: "Sektor Pertambangan & Mineral",
    category: "Sektor Investasi",
    layerId: "layer_potensi",
    color: "#f59e0b",
    strokeColor: "#b45309",
    geometryType: "point",
    icon: "pickaxe",
    description: "Potensi bahan galian mineral industri, kuari batu, dan hilirisasi logam.",
    regulationNote: "Wajib mengantongi Izin Usaha Pertambangan (IUP) dan jaminan reklamasi pascatambang."
  },
  {
    id: "sektor_perindustrian",
    name: "Sektor Industri & Perdagangan",
    category: "Sektor Investasi",
    layerId: "layer_potensi",
    color: "#8b5cf6",
    strokeColor: "#6d28d9",
    geometryType: "point",
    icon: "factory",
    description: "Fasilitas pergudangan, logistik terpadu, dan industri pengolahan manufaktur ramah lingkungan.",
    regulationNote: "Kesesuaian penuh di zona Kawasan Peruntukan Industri (KPI)."
  },
  {
    id: "sektor_pariwisata",
    name: "Sektor Pariwisata & Ekonomi Kreatif",
    category: "Sektor Investasi",
    layerId: "layer_potensi",
    color: "#ec4899",
    strokeColor: "#be185d",
    geometryType: "point",
    icon: "tent",
    description: "Destinasi wisata alam pegunungan Latimojong, agrowisata kopi, dan ekowisata bahari pesisir.",
    regulationNote: "Pemberian insentif investasi bagi pengembangan pariwisata berkelanjutan."
  }
];

interface SpatialSymbologyModalProps {
  isOpen: boolean;
  onClose: () => void;
  spatialLayers: GeoJSONLayer[];
  isDarkMode?: boolean;
}

export const SpatialSymbologyModal: React.FC<SpatialSymbologyModalProps> = ({
  isOpen,
  onClose,
  spatialLayers,
  isDarkMode = true
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [filterActiveOnly, setFilterActiveOnly] = useState<boolean>(false);

  // Set of layerIds currently active on the map
  const activeLayerIds = useMemo(() => {
    const active = new Set<string>();
    // If spatialLayers is provided, check .isActive
    spatialLayers.forEach(l => {
      if (l.isActive) active.add(l.id);
    });
    // layer_kecamatan is active by default if not set to false
    const kec = spatialLayers.find(l => l.id === "layer_kecamatan");
    if (!kec || kec.isActive !== false) {
      active.add("layer_kecamatan");
    }
    // layer_jalan is active by default
    const jalan = spatialLayers.find(l => l.id === "layer_jalan");
    if (!jalan || jalan.isActive !== false) {
      active.add("layer_jalan");
    }
    return active;
  }, [spatialLayers]);

  // Categories available
  const categories = useMemo(() => {
    const cats = Array.from(new Set(MASTER_SYMBOLOGY_DEFINITIONS.map(item => item.category)));
    return ["all", ...cats];
  }, []);

  // Filtered symbology items
  const filteredItems = useMemo(() => {
    return MASTER_SYMBOLOGY_DEFINITIONS.filter(item => {
      const isItemActive = activeLayerIds.has(item.layerId);
      
      // Filter active only
      if (filterActiveOnly && !isItemActive) return false;

      // Category filter
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.color.toLowerCase().includes(q) ||
          (item.regulationNote && item.regulationNote.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [searchQuery, selectedCategory, filterActiveOnly, activeLayerIds]);

  // Count active items
  const activeCount = useMemo(() => {
    return MASTER_SYMBOLOGY_DEFINITIONS.filter(item => activeLayerIds.has(item.layerId)).length;
  }, [activeLayerIds]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-slate-950/70 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="symbology-modal-title"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl border overflow-hidden ${
          isDarkMode
            ? "bg-slate-900/95 border-slate-700/80 text-white shadow-black/80"
            : "bg-white/95 border-slate-200 text-slate-900 shadow-2xl shadow-slate-900/10"
        }`}
      >
        {/* Header */}
        <div className={`p-4 sm:p-6 border-b flex items-center justify-between shrink-0 ${
          isDarkMode ? "border-slate-800 bg-slate-950/50" : "border-slate-200 bg-slate-50/80"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border shadow-inner ${
              isDarkMode 
                ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-400" 
                : "bg-indigo-50 border-indigo-200 text-indigo-600"
            }`}>
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="symbology-modal-title" className="text-base sm:text-lg font-black tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
                  Panduan Kode Warna & Simbologi Spasial (GIS)
                </h2>
                <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full border ${
                  isDarkMode
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                    : "bg-emerald-50 border-emerald-300 text-emerald-700"
                }`}>
                  {activeCount} Simbol Aktif
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                Rujukan resmi interpretasi visual layer tematik RTRW & investasi Kabupaten Luwu
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-2xl border transition-all active:scale-95 cursor-pointer ${
              isDarkMode
                ? "bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-300"
            }`}
            title="Tutup panduan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filter Section */}
        <div className={`p-4 border-b flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 ${
          isDarkMode ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-slate-100/50"
        }`}>
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isDarkMode ? "text-slate-500" : "text-slate-400"
            }`} />
            <input
              type="text"
              placeholder="Cari simbol, kode warna HEX (#...), atau kata kunci (contoh: hutan, sawah, banjir)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 text-xs rounded-xl border focus:outline-none transition-all ${
                isDarkMode
                  ? "bg-slate-950/80 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500"
                  : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500 shadow-xs"
              }`}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Active Toggle Button */}
          <button
            type="button"
            onClick={() => setFilterActiveOnly(!filterActiveOnly)}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer select-none whitespace-nowrap ${
              filterActiveOnly
                ? "bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/20"
                : isDarkMode
                ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Hanya Layer Aktif</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
              filterActiveOnly ? "bg-emerald-700 text-emerald-100" : isDarkMode ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"
            }`}>
              {activeCount}
            </span>
          </button>
        </div>

        {/* Category Pills Slider */}
        <div className={`px-4 py-2.5 border-b overflow-x-auto custom-scrollbar flex items-center gap-1.5 shrink-0 ${
          isDarkMode ? "border-slate-800/80 bg-slate-950/30" : "border-slate-200 bg-white"
        }`}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const label = cat === "all" ? "Semua Kategori" : cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border ${
                  isSelected
                    ? isDarkMode
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                      : "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : isDarkMode
                    ? "bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white hover:bg-slate-800"
                    : "bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-200"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Symbology List / Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-3.5">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className={`p-4 rounded-full mb-3 border ${
                isDarkMode ? "bg-slate-800 border-slate-700 text-slate-500" : "bg-slate-100 border-slate-200 text-slate-400"
              }`}>
                <Search className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-slate-300">Tidak ada simbol yang cocok</h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                {filterActiveOnly 
                  ? "Tidak ada layer aktif yang cocok dengan kriteria pencarian. Coba matikan filter 'Hanya Layer Aktif'." 
                  : "Silakan periksa ejaan kata kunci pencarian Anda."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredItems.map((item) => {
                const isActive = activeLayerIds.has(item.layerId);

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isActive
                        ? isDarkMode
                          ? "bg-slate-800/80 border-slate-700 shadow-md ring-1 ring-emerald-500/30"
                          : "bg-white border-slate-200 shadow-md ring-1 ring-emerald-500/20"
                        : isDarkMode
                        ? "bg-slate-900/40 border-slate-800/60 opacity-80 hover:opacity-100"
                        : "bg-slate-50 border-slate-200/80 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <div>
                      {/* Top Header Row */}
                      <div className="flex items-start justify-between gap-2.5 mb-2">
                        <div className="flex items-center gap-3">
                          {/* Visual Swatch Preview */}
                          <div className="shrink-0 flex items-center justify-center">
                            {item.geometryType === "polygon" && (
                              <div
                                className="w-9 h-9 rounded-xl shadow-md flex items-center justify-center border-2 transition-transform hover:scale-105"
                                style={{
                                  backgroundColor: item.color,
                                  borderColor: item.strokeColor || "#ffffff",
                                  opacity: item.fillOpacity ? Math.max(item.fillOpacity, 0.7) : 0.8
                                }}
                              >
                                <span className="text-[10px] font-mono font-bold text-white drop-shadow">
                                  HEX
                                </span>
                              </div>
                            )}
                            {item.geometryType === "line" && (
                              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center p-1.5 ${
                                isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
                              }`}>
                                <svg width="28" height="12" className="overflow-visible">
                                  <line
                                    x1="0"
                                    y1="6"
                                    x2="28"
                                    y2="6"
                                    stroke={item.color}
                                    strokeWidth={item.strokeWidth || 3}
                                    strokeDasharray={item.lineDashArray || "none"}
                                    strokeLinecap="round"
                                  />
                                </svg>
                              </div>
                            )}
                            {item.geometryType === "point" && (
                              <div
                                className="w-9 h-9 rounded-xl shadow-md flex items-center justify-center border-2"
                                style={{
                                  backgroundColor: `${item.color}25`,
                                  borderColor: item.color
                                }}
                              >
                                <div
                                  className="w-4 h-4 rounded-full shadow-sm"
                                  style={{ backgroundColor: item.color }}
                                />
                              </div>
                            )}
                          </div>

                          {/* Name & Category */}
                          <div>
                            <h3 className={`text-xs sm:text-sm font-bold leading-tight ${
                              isDarkMode ? "text-white" : "text-slate-900"
                            }`}>
                              {item.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] font-mono font-bold uppercase ${
                                isDarkMode ? "text-indigo-400" : "text-indigo-600"
                              }`}>
                                {item.category}
                              </span>
                              <span className="text-[10px] text-slate-500">•</span>
                              <span className="text-[10px] font-mono text-slate-400 font-semibold">
                                {item.color}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-md border shrink-0 ${
                          isActive
                            ? isDarkMode
                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                              : "bg-emerald-100 border-emerald-300 text-emerald-700"
                            : isDarkMode
                            ? "bg-slate-800 border-slate-700 text-slate-500"
                            : "bg-slate-200 border-slate-300 text-slate-500"
                        }`}>
                          {isActive ? "AKTIF" : "NONAKTIF"}
                        </span>
                      </div>

                      {/* Description */}
                      <p className={`text-[11px] leading-relaxed mt-2 ${
                        isDarkMode ? "text-slate-300" : "text-slate-600"
                      }`}>
                        {item.description}
                      </p>
                    </div>

                    {/* Legal/Regulation Note */}
                    {item.regulationNote && (
                      <div className={`mt-2.5 pt-2 border-t flex items-start gap-1.5 text-[10px] ${
                        isDarkMode
                          ? "border-slate-800 text-amber-300/90"
                          : "border-slate-200 text-amber-800"
                      }`}>
                        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                        <span className="leading-snug font-medium">
                          <strong>Ketentuan:</strong> {item.regulationNote}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`p-4 sm:p-5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
          isDarkMode ? "border-slate-800 bg-slate-950/60 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-600"
        }`}>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-sans">
              Standar Simbologi Spasial Pemkab Luwu • RTRW 2020–2040
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                isDarkMode
                  ? "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                  : "bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 shadow-xs"
              }`}
            >
              Tutup Panduan
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SpatialSymbologyModal;
