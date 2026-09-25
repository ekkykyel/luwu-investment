import React, { useState } from "react";
import { 
  Wheat, 
  Sprout, 
  MapPin, 
  Layers, 
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
  PieChart,
  BarChart3,
  Calendar,
  Compass
} from "lucide-react";

interface DistrictLp2bData {
  kecamatan: string;
  luasLp2bAktifHa: number;
  luasLp2bCadanganHa: number;
  irigasiTeknisHa: number;
  irigasiSemiTeknisHa: number;
  tadahHujanHa: number;
  statusKetahanan: "Surplus Tinggi" | "Surplus Sedang" | "Kritis / Rentan";
  komoditasUtama: string;
  diUtama: string;
}

const KABUPATEN_LUWU_LP2B_DATA: DistrictLp2bData[] = [
  { kecamatan: "Bua", luasLp2bAktifHa: 2450.5, luasLp2bCadanganHa: 420.0, irigasiTeknisHa: 1980.0, irigasiSemiTeknisHa: 470.5, tadahHujanHa: 420.0, statusKetahanan: "Surplus Tinggi", komoditasUtama: "Padi Sawah, Kelapa, Jagung", diUtama: "D.I. Bua (Primer & Sekunder)" },
  { kecamatan: "Ponrang", luasLp2bAktifHa: 3120.0, luasLp2bCadanganHa: 580.0, irigasiTeknisHa: 2650.0, irigasiSemiTeknisHa: 470.0, tadahHujanHa: 580.0, statusKetahanan: "Surplus Tinggi", komoditasUtama: "Padi Sawah, Kakao, Palawija", diUtama: "D.I. Noling & D.I. Ponrang" },
  { kecamatan: "Ponrang Selatan", luasLp2bAktifHa: 1980.2, luasLp2bCadanganHa: 310.0, irigasiTeknisHa: 1620.0, irigasiSemiTeknisHa: 360.2, tadahHujanHa: 310.0, statusKetahanan: "Surplus Tinggi", komoditasUtama: "Padi Sawah, Kakao", diUtama: "D.I. Ponrang Selatan" },
  { kecamatan: "Belopa", luasLp2bAktifHa: 1420.8, luasLp2bCadanganHa: 210.5, irigasiTeknisHa: 1100.0, irigasiSemiTeknisHa: 320.8, tadahHujanHa: 210.5, statusKetahanan: "Surplus Sedang", komoditasUtama: "Padi Sawah, Hortikultura", diUtama: "D.I. Belopa Kota" },
  { kecamatan: "Belopa Utara", luasLp2bAktifHa: 1650.0, luasLp2bCadanganHa: 280.0, irigasiTeknisHa: 1350.0, irigasiSemiTeknisHa: 300.0, tadahHujanHa: 280.0, statusKetahanan: "Surplus Sedang", komoditasUtama: "Padi Sawah, Sagu, Kelapa", diUtama: "D.I. Belopa Utara" },
  { kecamatan: "Bajo", luasLp2bAktifHa: 2890.0, luasLp2bCadanganHa: 450.0, irigasiTeknisHa: 2400.0, irigasiSemiTeknisHa: 490.0, tadahHujanHa: 450.0, statusKetahanan: "Surplus Tinggi", komoditasUtama: "Padi Sawah, Kakao, Jagung", diUtama: "D.I. Bajo Terpadu" },
  { kecamatan: "Bajo Barat", luasLp2bAktifHa: 1870.4, luasLp2bCadanganHa: 390.0, irigasiTeknisHa: 1400.0, irigasiSemiTeknisHa: 470.4, tadahHujanHa: 390.0, statusKetahanan: "Surplus Sedang", komoditasUtama: "Padi Sawah, Cengkeh, Kakao", diUtama: "D.I. Sungai Bajo" },
  { kecamatan: "Kamanre", luasLp2bAktifHa: 1540.0, luasLp2bCadanganHa: 260.0, irigasiTeknisHa: 1250.0, irigasiSemiTeknisHa: 290.0, tadahHujanHa: 260.0, statusKetahanan: "Surplus Sedang", komoditasUtama: "Padi Sawah, Jeruk Keprok", diUtama: "D.I. Kamanre" },
  { kecamatan: "Suli", luasLp2bAktifHa: 2150.6, luasLp2bCadanganHa: 380.0, irigasiTeknisHa: 1750.0, irigasiSemiTeknisHa: 400.6, tadahHujanHa: 380.0, statusKetahanan: "Surplus Tinggi", komoditasUtama: "Padi Sawah, Kakao, Kelapa", diUtama: "D.I. Suli" },
  { kecamatan: "Suli Barat", luasLp2bAktifHa: 1780.0, luasLp2bCadanganHa: 340.0, irigasiTeknisHa: 1350.0, irigasiSemiTeknisHa: 430.0, tadahHujanHa: 340.0, statusKetahanan: "Surplus Sedang", komoditasUtama: "Padi Sawah, Cengkeh, Durian", diUtama: "D.I. Suli Barat" },
  { kecamatan: "Larompong", luasLp2bAktifHa: 2340.0, luasLp2bCadanganHa: 410.0, irigasiTeknisHa: 1900.0, irigasiSemiTeknisHa: 440.0, tadahHujanHa: 410.0, statusKetahanan: "Surplus Tinggi", komoditasUtama: "Padi Sawah, Cengkeh, Kakao", diUtama: "D.I. Larompong" },
  { kecamatan: "Larompong Selatan", luasLp2bAktifHa: 1920.0, luasLp2bCadanganHa: 320.0, irigasiTeknisHa: 1500.0, irigasiSemiTeknisHa: 420.0, tadahHujanHa: 320.0, statusKetahanan: "Surplus Sedang", komoditasUtama: "Padi Sawah, Kakao, Lada", diUtama: "D.I. Buntu Kamiri" },
  { kecamatan: "Walenrang", luasLp2bAktifHa: 3850.0, luasLp2bCadanganHa: 650.0, irigasiTeknisHa: 3200.0, irigasiSemiTeknisHa: 650.0, tadahHujanHa: 650.0, statusKetahanan: "Surplus Tinggi", komoditasUtama: "Padi Sawah (Lumbung Pangan Walmas)", diUtama: "D.I. Makawa & D.I. Walenrang" },
  { kecamatan: "Walenrang Timur", luasLp2bAktifHa: 2980.0, luasLp2bCadanganHa: 480.0, irigasiTeknisHa: 2500.0, irigasiSemiTeknisHa: 480.0, tadahHujanHa: 480.0, statusKetahanan: "Surplus Tinggi", komoditasUtama: "Padi Sawah, Tambak Bandeng", diUtama: "D.I. Walenrang Timur" },
  { kecamatan: "Walenrang Utara", luasLp2bAktifHa: 2650.0, luasLp2bCadanganHa: 420.0, irigasiTeknisHa: 2200.0, irigasiSemiTeknisHa: 450.0, tadahHujanHa: 420.0, statusKetahanan: "Surplus Tinggi", komoditasUtama: "Padi Sawah, Jagung, Sawit Rakyat", diUtama: "D.I. Walenrang Utara" },
  { kecamatan: "Walenrang Barat", luasLp2bAktifHa: 890.0, luasLp2bCadanganHa: 250.0, irigasiTeknisHa: 450.0, irigasiSemiTeknisHa: 440.0, tadahHujanHa: 250.0, statusKetahanan: "Surplus Sedang", komoditasUtama: "Padi Gunung, Kopi Arabika, Kakao", diUtama: "Irigasi Sederhana Pegunungan" },
  { kecamatan: "Lamasi", luasLp2bAktifHa: 3420.0, luasLp2bCadanganHa: 520.0, irigasiTeknisHa: 2950.0, irigasiSemiTeknisHa: 470.0, tadahHujanHa: 520.0, statusKetahanan: "Surplus Tinggi", komoditasUtama: "Padi Sawah, Jagung Hibrida", diUtama: "D.I. Lamasi Terpadu" },
  { kecamatan: "Lamasi Timur", luasLp2bAktifHa: 2780.0, luasLp2bCadanganHa: 430.0, irigasiTeknisHa: 2350.0, irigasiSemiTeknisHa: 430.0, tadahHujanHa: 430.0, statusKetahanan: "Surplus Tinggi", komoditasUtama: "Padi Sawah, Palawija", diUtama: "D.I. Lamasi Timur" },
  { kecamatan: "Bua Ponrang (Bupon)", luasLp2bAktifHa: 2210.0, luasLp2bCadanganHa: 390.0, irigasiTeknisHa: 1750.0, irigasiSemiTeknisHa: 460.0, tadahHujanHa: 390.0, statusKetahanan: "Surplus Tinggi", komoditasUtama: "Padi Sawah, Kakao, Cengkeh", diUtama: "D.I. Noling Hulu" },
  { kecamatan: "Latimojong", luasLp2bAktifHa: 520.0, luasLp2bCadanganHa: 190.0, irigasiTeknisHa: 150.0, irigasiSemiTeknisHa: 370.0, tadahHujanHa: 190.0, statusKetahanan: "Kritis / Rentan", komoditasUtama: "Kopi Arabika Latimojong, Cengkeh", diUtama: "Mata Air & Irigasi Gravitasi" },
  { kecamatan: "Bastem (Bassesangtempe)", luasLp2bAktifHa: 680.0, luasLp2bCadanganHa: 220.0, irigasiTeknisHa: 200.0, irigasiSemiTeknisHa: 480.0, tadahHujanHa: 220.0, statusKetahanan: "Kritis / Rentan", komoditasUtama: "Kopi Robusta & Arabika, Hortikultura", diUtama: "Irigasi Desa Pegunungan" },
  { kecamatan: "Bastem Utara", luasLp2bAktifHa: 610.0, luasLp2bCadanganHa: 210.0, irigasiTeknisHa: 180.0, irigasiSemiTeknisHa: 430.0, tadahHujanHa: 210.0, statusKetahanan: "Kritis / Rentan", komoditasUtama: "Kopi Bastem, Sayuran Dataran Tinggi", diUtama: "Irigasi Mata Air Alami" }
];

export function PertanianLp2bCatalogView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const totalLp2bAktif = KABUPATEN_LUWU_LP2B_DATA.reduce((acc, curr) => acc + curr.luasLp2bAktifHa, 0);
  const totalLp2bCadangan = KABUPATEN_LUWU_LP2B_DATA.reduce((acc, curr) => acc + curr.luasLp2bCadanganHa, 0);
  const totalIrigasiTeknis = KABUPATEN_LUWU_LP2B_DATA.reduce((acc, curr) => acc + curr.irigasiTeknisHa, 0);

  const filteredData = KABUPATEN_LUWU_LP2B_DATA.filter(item => {
    const matchesSearch = item.kecamatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.komoditasUtama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.diUtama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || item.statusKetahanan === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 p-6 md:p-8 text-white border border-emerald-500/30 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-60 bg-emerald-500/10 blur-3xl rounded-full -mr-20 -mt-10" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
              <Wheat className="w-3.5 h-3.5" />
              <span>Dinas Pertanian • Bidang Prasarana & Perlindungan Lahan (LP2B)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Katalog Lahan Pertanian LP2B & Jaringan Irigasi Kab. Luwu
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-3xl leading-relaxed">
              Basis data resmi penetapan Lahan Pertanian Pangan Berkelanjutan (LP2B), daerah irigasi teknis/semi teknis, serta audit neraca pangan di 22 Kecamatan Kabupaten Luwu.
            </p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white flex items-center gap-2 backdrop-blur-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Rekapitulasi</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">
            <span>Total LP2B Aktif Luwu</span>
            <Wheat className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
            {totalLp2bAktif.toLocaleString("id-ID", { maximumFractionDigits: 1 })} Ha
          </div>
          <p className="text-[11px] text-slate-500">Lahan sawah baku dilindungi Perda</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">
            <span>Lahan Cadangan LP2B</span>
            <Sprout className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {totalLp2bCadangan.toLocaleString("id-ID", { maximumFractionDigits: 1 })} Ha
          </div>
          <p className="text-[11px] text-slate-500">Potensi cetak sawah & kompensasi</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">
            <span>Daerah Irigasi Teknis</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {totalIrigasiTeknis.toLocaleString("id-ID", { maximumFractionDigits: 1 })} Ha
          </div>
          <p className="text-[11px] text-slate-500">D.I. Bua, Noling, Makawa, Lamasi</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">
            <span>Cakupan Kecamatan</span>
            <MapPin className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            22 Kecamatan
          </div>
          <p className="text-[11px] text-slate-500">Wilayah Selatan, Tengah, & Walmas</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama kecamatan, komoditas, atau jaringan daerah irigasi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Status Pangan:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <option value="ALL">Semua Status (22 Kec)</option>
            <option value="Surplus Tinggi">Surplus Tinggi</option>
            <option value="Surplus Sedang">Surplus Sedang</option>
            <option value="Kritis / Rentan">Kritis / Rentan Pegunungan</option>
          </select>
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Data Sebaran Kawasan LP2B & Sumber Air Irigasi Per Kecamatan
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500">
            Menampilkan {filteredData.length} dari 22 Kecamatan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3.5">No</th>
                <th className="p-3.5">Kecamatan</th>
                <th className="p-3.5">LP2B Aktif (Ha)</th>
                <th className="p-3.5">Cadangan LP2B (Ha)</th>
                <th className="p-3.5">Irigasi Teknis (Ha)</th>
                <th className="p-3.5">Daerah Irigasi (DI) Utama</th>
                <th className="p-3.5">Komoditas Unggulan</th>
                <th className="p-3.5">Status Neraca</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
              {filteredData.map((row, idx) => (
                <tr key={row.kecamatan} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                  <td className="p-3.5 font-bold text-slate-400">{idx + 1}</td>
                  <td className="p-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{row.kecamatan}</span>
                  </td>
                  <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                    {row.luasLp2bAktifHa.toLocaleString("id-ID", { minimumFractionDigits: 1 })} Ha
                  </td>
                  <td className="p-3.5 text-amber-600 dark:text-amber-400 font-bold">
                    {row.luasLp2bCadanganHa.toLocaleString("id-ID", { minimumFractionDigits: 1 })} Ha
                  </td>
                  <td className="p-3.5 text-blue-600 dark:text-blue-400 font-bold">
                    {row.irigasiTeknisHa.toLocaleString("id-ID", { minimumFractionDigits: 1 })} Ha
                  </td>
                  <td className="p-3.5 text-slate-800 dark:text-slate-200">
                    {row.diUtama}
                  </td>
                  <td className="p-3.5 text-slate-800 dark:text-slate-200">
                    {row.komoditasUtama}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      row.statusKetahanan === "Surplus Tinggi" 
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                        : row.statusKetahanan === "Surplus Sedang"
                        ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                    }`}>
                      {row.statusKetahanan}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
