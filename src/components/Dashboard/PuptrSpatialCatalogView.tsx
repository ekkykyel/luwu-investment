import React, { useState } from "react";
import { 
  Compass, 
  Layers, 
  MapPin, 
  Download, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Building, 
  TrendingUp, 
  ShieldCheck, 
  Printer, 
  FileText,
  Map,
  Maximize2
} from "lucide-react";

interface SpatialZoningRule {
  kodeZona: string;
  namaZona: string;
  peruntukanUtama: string;
  kdbMaksimal: string;
  klbMaksimal: string;
  gsbMinimal: string;
  kdhMinimal: string;
  lokasiPrioritasLuwu: string;
  dasarHukum: string;
}

const KABUPATEN_LUWU_SPATIAL_RULES: SpatialZoningRule[] = [
  {
    kodeZona: "KPI",
    namaZona: "Kawasan Peruntukan Industri (KPI)",
    peruntukanUtama: "Industri Manufaktur, Smelter, Pengolahan Kakao, Logistik & Pergudangan Terpadu",
    kdbMaksimal: "Maksimal 70%",
    klbMaksimal: "2.8 (Hingga 4 Lantai Fasilitas)",
    gsbMinimal: "15 Meter dari As Jalan Arteri Primer",
    kdhMinimal: "Minimal 15% Area Terbuka Hijau Privat",
    lokasiPrioritasLuwu: "Kecamatan Bua (Kawasan Industri Bua & Sekitar Bandara Bua)",
    dasarHukum: "Perda Kab. Luwu No. 3/2024 tentang RTRW & Masterplan KI Bua"
  },
  {
    kodeZona: "PK-1",
    namaZona: "Kawasan Permukiman Perkotaan (Komersial & Residensial)",
    peruntukanUtama: "Hunian, Ruko, Pusat Perbelanjaan, Jasa Keuangan, Fasilitas Publik",
    kdbMaksimal: "Maksimal 60%",
    klbMaksimal: "2.4 (Hingga 4 Lantai)",
    gsbMinimal: "10 Meter dari As Jalan Kolektor Primer",
    kdhMinimal: "Minimal 20% Resapan Air",
    lokasiPrioritasLuwu: "Kecamatan Belopa Kota, Belopa Utara, & Poros Utama Trans Sulawesi",
    dasarHukum: "Perda Kab. Luwu No. 3/2024 tentang RTRW 2024-2044"
  },
  {
    kodeZona: "PK-2",
    namaZona: "Kawasan Permukiman Perdesaan & Agrowisata",
    peruntukanUtama: "Rumah Tinggal, UMKM Lokal, Sarana Ibadah (Gereja/Masjid), Agrowisata",
    kdbMaksimal: "Maksimal 50%",
    klbMaksimal: "1.5 (Maksimal 2-3 Lantai)",
    gsbMinimal: "7.5 Meter dari As Jalan Lingkungan",
    kdhMinimal: "Minimal 30% Pekarangan Alami",
    lokasiPrioritasLuwu: "Kecamatan Bajo, Ponrang, Suli, Lamasi, Walenrang",
    dasarHukum: "Perda RTRW Kab. Luwu 2024-2044"
  },
  {
    kodeZona: "KPL-1",
    namaZona: "Kawasan Pariwisata & Pesisir Pantai (PPI)",
    peruntukanUtama: "Fasilitas Wisata Bahari, Pelabuhan Perikanan, Pengolahan Ikan, Restoran Pesisir",
    kdbMaksimal: "Maksimal 40%",
    klbMaksimal: "1.2 (Maksimal 2 Lantai)",
    gsbMinimal: "Buffer Sempadan Pantai > 100 Meter dari Pasang Tertinggi",
    kdhMinimal: "Minimal 40% Zona Konservasi Bakau & Pasir",
    lokasiPrioritasLuwu: "Pesisir Ponrang, Ponrang Selatan, Bua, Larompong",
    dasarHukum: "Perda RTRW Luwu & Zonasi RZWP-3-K Sulsel"
  },
  {
    kodeZona: "KP-LP2B",
    namaZona: "Kawasan Tanaman Pangan (LP2B Aktif)",
    peruntukanUtama: "Sawah Beririgasi Teknis, Pengeringan Padi, Sarana Pengairan Tani",
    kdbMaksimal: "Maksimal 10% (Hanya untuk Sarana Produksi Tani)",
    klbMaksimal: "0.2",
    gsbMinimal: "Sempadan Saluran Irigasi Primer minimal 5 Meter",
    kdhMinimal: "Minimal 90% Lahan Produktif",
    lokasiPrioritasLuwu: "Hamparan Walmas (Walenrang, Lamasi) & Dataran Luwu Tengah",
    dasarHukum: "UU No. 41/2009 & Perda LP2B Luwu (Dilarang Alih Fungsi Tanpa Pengganti)"
  },
  {
    kodeZona: "KL-SS",
    namaZona: "Kawasan Lindung Sempadan Sungai & Mata Air",
    peruntukanUtama: "Konservasi Sempadan Sungai, Tanggul Pengendali Banjir, Sabuk Hijau",
    kdbMaksimal: "0% (Zona Lindung Mutlak)",
    klbMaksimal: "0",
    gsbMinimal: "50 Meter Sisi Kiri-Kanan Sungai Utama / 100 Meter dari Mata Air",
    kdhMinimal: "100% Tutupan Vegetasi Lindung",
    lokasiPrioritasLuwu: "DAS Sungai Suso, DAS Suli, DAS Bajo, DAS Lamasi, DAS Bua",
    dasarHukum: "Permen PUPR No. 28/PRT/M/2015 & Perda RTRW Luwu"
  }
];

export function PuptrSpatialCatalogView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedZona, setSelectedZona] = useState<string>("ALL");

  const filteredRules = KABUPATEN_LUWU_SPATIAL_RULES.filter(item => {
    const matchesSearch = item.namaZona.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.peruntukanUtama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.lokasiPrioritasLuwu.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZona = selectedZona === "ALL" || item.kodeZona === selectedZona;
    return matchesSearch && matchesZona;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white border border-indigo-500/30 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-60 bg-indigo-500/10 blur-3xl rounded-full -mr-20 -mt-10" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
              <Compass className="w-3.5 h-3.5" />
              <span>Dinas PUPTR • Bidang Penataan Ruang & Tata Bangunan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Katalog Pola Ruang RTRW & Standar Teknis Bangunan Dinas PUPTR
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100/80 max-w-3xl leading-relaxed">
              Panduan regulasi kesesuaian tata ruang (PKKPR), parameter intensitas ruang (KDB, KLB, GSB, KDH), sempadan sungai/pantai, serta peruntukan kawasan industri dan permukiman di Kabupaten Luwu.
            </p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white flex items-center gap-2 backdrop-blur-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Matriks Tata Ruang</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">
            <span>Perda Payung Hukum</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            Perda No. 3 / 2024
          </div>
          <p className="text-[11px] text-slate-500">RTRW Kabupaten Luwu 2024-2044</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">
            <span>Kawasan Industri Bua (KPI)</span>
            <Building className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
            1.500+ Hektar
          </div>
          <p className="text-[11px] text-slate-500">KDB 70% • Dekat Bandara Bua</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">
            <span>Buffer Sempadan Sungai</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-blue-600 dark:text-blue-400">
            50 - 100 Meter
          </div>
          <p className="text-[11px] text-slate-500">Bebas bangunan permanen</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">
            <span>Sistem Koordinat GIS</span>
            <Compass className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400">
            UTM Zone 51S
          </div>
          <p className="text-[11px] text-slate-500">Datum Geodesi WGS 1984</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari zona tata ruang, peruntukan bangunan, atau lokasi kecamatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Filter Zona:</span>
          <select
            value={selectedZona}
            onChange={(e) => setSelectedZona(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <option value="ALL">Semua Pola Ruang</option>
            <option value="KPI">Kawasan Industri (KPI)</option>
            <option value="PK-1">Permukiman Perkotaan (PK-1)</option>
            <option value="PK-2">Permukiman Perdesaan (PK-2)</option>
            <option value="KPL-1">Pariwisata & Pesisir (KPL-1)</option>
            <option value="KP-LP2B">Pertanian LP2B</option>
            <option value="KL-SS">Lindung Sempadan Sungai</option>
          </select>
        </div>
      </div>

      {/* Cards List for Spatial Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRules.map((rule) => (
          <div 
            key={rule.kodeZona}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                  {rule.kodeZona}
                </span>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1.5">
                  {rule.namaZona}
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {rule.peruntukanUtama}
            </p>

            {/* Technical Specifications Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-400 font-bold block">Koefisien Dasar Bangunan (KDB):</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{rule.kdbMaksimal}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Koefisien Lantai (KLB):</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{rule.klbMaksimal}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Garis Sempadan (GSB):</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{rule.gsbMinimal}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Ruang Terbuka Hijau (KDH):</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{rule.kdhMinimal}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 space-y-1 pt-1">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{rule.lokasiPrioritasLuwu}</span>
              </div>
              <div className="text-[10px] text-slate-400 italic">
                Dasar Rujukan: {rule.dasarHukum}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
