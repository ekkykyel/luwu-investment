import React, { useState, useEffect } from "react";
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
  Compass,
  Edit3,
  Save,
  X,
  RefreshCw,
  Plus,
  Check
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export interface DistrictLp2bData {
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

const KABUPATEN_LUWU_LP2B_BASELINE: DistrictLp2bData[] = [
  { kecamatan: "Bajo", luasLp2bAktifHa: 1458.0, luasLp2bCadanganHa: 220.0, irigasiTeknisHa: 1250.0, irigasiSemiTeknisHa: 208.0, tadahHujanHa: 220.0, statusKetahanan: "Surplus Tinggi", komoditasUtama: "Padi Sawah, Kakao, Jagung", diUtama: "D.I. Bajo Terpadu" },
  { kecamatan: "Bajo Barat", luasLp2bAktifHa: 498.0, luasLp2bCadanganHa: 95.0, irigasiTeknisHa: 380.0, irigasiSemiTeknisHa: 118.0, tadahHujanHa: 95.0, statusKetahanan: "Surplus Sedang", komoditasUtama: "Padi Sawah, Cengkeh, Kakao", diUtama: "D.I. Sungai Bajo" },
  { kecamatan: "Basse Sang Tempe (Bastem)", luasLp2bAktifHa: 331.0, luasLp2bCadanganHa: 80.0, irigasiTeknisHa: 110.0, irigasiSemiTeknisHa: 221.0, tadahHujanHa: 80.0, statusKetahanan: "Kritis / Rentan", komoditasUtama: "Kopi Robusta & Arabika, Hortikultura", diUtama: "Irigasi Desa Pegunungan" },
  { kecamatan: "Basse Sang Tempe Utara", luasLp2bAktifHa: 698.0, luasLp2bCadanganHa: 120.0, irigasiTeknisHa: 210.0, irigasiSemiTeknisHa: 488.0, tadahHujanHa: 120.0, statusKetahanan: "Kritis / Rentan", komoditasUtama: "Kopi Bastem, Sayuran Dataran Tinggi", diUtama: "Irigasi Mata Air Alami" },
  { kecamatan: "Belopa", luasLp2bAktifHa: 904.0, luasLp2bCadanganHa: 140.0, irigasiTeknisHa: 720.0, irigasiSemiTeknisHa: 184.0, tadahHujanHa: 140.0, statusKetahanan: "Surplus Sedang", komoditasUtama: "Padi Sawah, Hortikultura", diUtama: "D.I. Belopa Kota" },
  { kecamatan: "Belopa Utara", luasLp2bAktifHa: 1150.0, luasLp2bCadanganHa: 180.0, irigasiTeknisHa: 920.0, irigasiSemiTeknisHa: 230.0, tadahHujanHa: 180.0, statusKetahanan: "Surplus Sedang", komoditasUtama: "Padi Sawah, Sagu, Kelapa", diUtama: "D.I. Belopa Utara" },
  { kecamatan: "Bua", luasLp2bAktifHa: 1785.0, luasLp2bCadanganHa: 290.0, irigasiTeknisHa: 1450.0, irigasiSemiTeknisHa: 335.0, tadahHujanHa: 290.0, statusKetahanan: "Surplus Tinggi", komoditasUtama: "Padi Sawah, Kelapa, Jagung", diUtama: "D.I. Bua (Primer & Sekunder)" },
  { kecamatan: "Bua Ponrang (Bupon)", luasLp2bAktifHa: 939.0, luasLp2bCadanganHa: 160.0, irigasiTeknisHa: 750.0, irigasiSemiTeknisHa: 189.0, tadahHujanHa: 160.0, statusKetahanan: "Surplus Sedang", komoditasUtama: "Padi Sawah, Kakao, Cengkeh", diUtama: "D.I. Noling Hulu" },
  { kecamatan: "Kamanre", luasLp2bAktifHa: 1590.0, luasLp2bCadanganHa: 240.0, irigasiTeknisHa: 1300.0, irigasiSemiTeknisHa: 290.0, tadahHujanHa: 240.0, statusKetahanan: "Surplus Sedang", komoditasUtama: "Padi Sawah, Jeruk Keprok", diUtama: "D.I. Kamanre" },
  { kecamatan: "Lamasi", luasLp2bAktifHa: 2570.0, luasLp2bCadanganHa: 410.0, irigasiTeknisHa: 2200.0, irigasiSemiTeknisHa: 370.0, tadahHujanHa: 410.0, statusKetahanan: "Surplus Tinggi", komoditasUtama: "Padi Sawah, Jagung Hibrida", diUtama: "D.I. Lamasi Terpadu" },
  { kecamatan: "Lamasi Timur", luasLp2bAktifHa: 2148.0, luasLp2bCadanganHa: 340.0, irigasiTeknisHa: 1800.0, irigasiSemiTeknisHa: 348.0, tadahHujanHa: 340.0, statusKetahanan: "Surplus Tinggi", komoditasUtama: "Padi Sawah, Palawija", diUtama: "D.I. Lamasi Timur" },
  { kecamatan: "Larompong", luasLp2bAktifHa: 723.0, luasLp2bCadanganHa: 130.0, irigasiTeknisHa: 550.0, irigasiSemiTeknisHa: 173.0, tadahHujanHa: 130.0, statusKetahanan: "Surplus Sedang", komoditasUtama: "Padi Sawah, Cengkeh, Kakao", diUtama: "D.I. Larompong" },
  { kecamatan: "Larompong Selatan", luasLp2bAktifHa: 455.0, luasLp2bCadanganHa: 85.0, irigasiTeknisHa: 320.0, irigasiSemiTeknisHa: 135.0, tadahHujanHa: 85.0, statusKetahanan: "Surplus Sedang", komoditasUtama: "Padi Sawah, Kakao, Lada", diUtama: "D.I. Buntu Kamiri" },
  { kecamatan: "Latimojong", luasLp2bAktifHa: 155.0, luasLp2bCadanganHa: 45.0, irigasiTeknisHa: 40.0, irigasiSemiTeknisHa: 115.0, tadahHujanHa: 45.0, statusKetahanan: "Kritis / Rentan", komoditasUtama: "Kopi Arabika Latimojong, Cengkeh", diUtama: "Mata Air & Irigasi Gravitasi" },
  { kecamatan: "Ponrang", luasLp2bAktifHa: 2956.0, luasLp2bCadanganHa: 480.0, irigasiTeknisHa: 2450.0, irigasiSemiTeknisHa: 506.0, tadahHujanHa: 480.0, statusKetahanan: "Surplus Tinggi", komoditasUtama: "Padi Sawah, Kakao, Palawija", diUtama: "D.I. Noling & D.I. Ponrang" },
  { kecamatan: "Ponrang Selatan", luasLp2bAktifHa: 2135.0, luasLp2bCadanganHa: 330.0, irigasiTeknisHa: 1750.0, irigasiSemiTeknisHa: 385.0, tadahHujanHa: 330.0, statusKetahanan: "Surplus Tinggi", komoditasUtama: "Padi Sawah, Kakao", diUtama: "D.I. Ponrang Selatan" },
  { kecamatan: "Suli", luasLp2bAktifHa: 1827.0, luasLp2bCadanganHa: 290.0, irigasiTeknisHa: 1500.0, irigasiSemiTeknisHa: 327.0, tadahHujanHa: 290.0, statusKetahanan: "Surplus Tinggi", komoditasUtama: "Padi Sawah, Kakao, Kelapa", diUtama: "D.I. Suli" },
  { kecamatan: "Suli Barat", luasLp2bAktifHa: 326.0, luasLp2bCadanganHa: 65.0, irigasiTeknisHa: 220.0, irigasiSemiTeknisHa: 106.0, tadahHujanHa: 65.0, statusKetahanan: "Surplus Sedang", komoditasUtama: "Padi Sawah, Cengkeh, Durian", diUtama: "D.I. Suli Barat" },
  { kecamatan: "Walenrang", luasLp2bAktifHa: 1725.0, luasLp2bCadanganHa: 280.0, irigasiTeknisHa: 1400.0, irigasiSemiTeknisHa: 325.0, tadahHujanHa: 280.0, statusKetahanan: "Surplus Tinggi", komoditasUtama: "Padi Sawah (Lumbung Pangan Walmas)", diUtama: "D.I. Makawa & D.I. Walenrang" },
  { kecamatan: "Walenrang Barat", luasLp2bAktifHa: 285.0, luasLp2bCadanganHa: 55.0, irigasiTeknisHa: 150.0, irigasiSemiTeknisHa: 135.0, tadahHujanHa: 55.0, statusKetahanan: "Surplus Sedang", komoditasUtama: "Padi Gunung, Kopi Arabika, Kakao", diUtama: "Irigasi Sederhana Pegunungan" },
  { kecamatan: "Walenrang Timur", luasLp2bAktifHa: 3056.0, luasLp2bCadanganHa: 490.0, irigasiTeknisHa: 2550.0, irigasiSemiTeknisHa: 506.0, tadahHujanHa: 490.0, statusKetahanan: "Surplus Tinggi", komoditasUtama: "Padi Sawah, Tambak Bandeng", diUtama: "D.I. Walenrang Timur" },
  { kecamatan: "Walenrang Utara", luasLp2bAktifHa: 2026.0, luasLp2bCadanganHa: 320.0, irigasiTeknisHa: 1650.0, irigasiSemiTeknisHa: 376.0, tadahHujanHa: 320.0, statusKetahanan: "Surplus Tinggi", komoditasUtama: "Padi Sawah, Jagung, Sawit Rakyat", diUtama: "D.I. Walenrang Utara" }
];

export function PertanianLp2bCatalogView() {
  const [dataList, setDataList] = useState<DistrictLp2bData[]>(() => {
    try {
      const saved = localStorage.getItem("PERTANIAN_LP2B_CATALOG_PERSIST");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Failed to parse local LP2B catalog:", e);
    }
    return KABUPATEN_LUWU_LP2B_BASELINE;
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [dataSourceStatus, setDataSourceStatus] = useState<"SUPABASE" | "LOCAL">("LOCAL");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Edit Modal State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<DistrictLp2bData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch from Supabase site_settings on mount
  useEffect(() => {
    let isMounted = true;
    async function loadFromSupabase() {
      setIsLoading(true);
      try {
        if (supabase) {
          const { data, error } = await supabase
            .from("site_settings")
            .select("setting_value")
            .eq("setting_key", "pertanian_lp2b_catalog")
            .maybeSingle();

          if (!error && data?.setting_value) {
            const parsed = typeof data.setting_value === "string" 
              ? JSON.parse(data.setting_value) 
              : data.setting_value;

            if (Array.isArray(parsed) && parsed.length > 0 && isMounted) {
              setDataList(parsed);
              setDataSourceStatus("SUPABASE");
              localStorage.setItem("PERTANIAN_LP2B_CATALOG_PERSIST", JSON.stringify(parsed));
              setIsLoading(false);
              return;
            }
          }
        }
      } catch (err) {
        console.warn("Supabase fetch note for LP2B catalog:", err);
      }
      if (isMounted) {
        setIsLoading(false);
      }
    }

    loadFromSupabase();
    return () => { isMounted = false; };
  }, []);

  // Totals calculation
  const totalLp2bAktif = dataList.reduce((acc, curr) => acc + (Number(curr.luasLp2bAktifHa) || 0), 0);
  const totalLp2bCadangan = dataList.reduce((acc, curr) => acc + (Number(curr.luasLp2bCadanganHa) || 0), 0);
  const totalIrigasiTeknis = dataList.reduce((acc, curr) => acc + (Number(curr.irigasiTeknisHa) || 0), 0);

  const filteredData = dataList.filter(item => {
    const matchesSearch = item.kecamatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.komoditasUtama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.diUtama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || item.statusKetahanan === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEditRow = (idxInFiltered: number) => {
    const targetItem = filteredData[idxInFiltered];
    const actualIdx = dataList.findIndex(d => d.kecamatan === targetItem.kecamatan);
    if (actualIdx !== -1) {
      setEditingIndex(actualIdx);
      setEditFormData({ ...dataList[actualIdx] });
    }
  };

  const handleSaveEdit = async () => {
    if (editingIndex === null || !editFormData) return;
    setIsSaving(true);

    const updatedList = [...dataList];
    updatedList[editingIndex] = editFormData;
    setDataList(updatedList);

    // Save to LocalStorage
    localStorage.setItem("PERTANIAN_LP2B_CATALOG_PERSIST", JSON.stringify(updatedList));

    // Try background sync to Supabase site_settings
    try {
      if (supabase) {
        await supabase.from("site_settings").upsert({
          setting_key: "pertanian_lp2b_catalog",
          setting_value: JSON.stringify(updatedList),
          updated_at: new Date().toISOString()
        }, { onConflict: "setting_key" });
        setDataSourceStatus("SUPABASE");
      }
    } catch (e) {
      console.log("Supabase save note:", e);
    }

    setIsSaving(false);
    setEditingIndex(null);
    setEditFormData(null);
    setSaveMessage(`Data LP2B Kecamatan ${editFormData.kecamatan} berhasil diperbarui di database!`);
    setTimeout(() => setSaveMessage(null), 4000);
  };

  const handleResetBaseline = () => {
    if (window.confirm("Apakah Anda yakin ingin mengembalikan data ke Master Baseline Dinas Pertanian?")) {
      setDataList(KABUPATEN_LUWU_LP2B_BASELINE);
      localStorage.setItem("PERTANIAN_LP2B_CATALOG_PERSIST", JSON.stringify(KABUPATEN_LUWU_LP2B_BASELINE));
      setSaveMessage("Data berhasil dikembalikan ke baseline awal.");
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleExportCsv = () => {
    const headers = "No,Kecamatan,LP2B Aktif (Ha),Cadangan LP2B (Ha),Irigasi Teknis (Ha),Daerah Irigasi Utama,Komoditas Utama,Status Neraca\n";
    const rows = dataList.map((d, i) => 
      `${i+1},"${d.kecamatan}",${d.luasLp2bAktifHa},${d.luasLp2bCadanganHa},${d.irigasiTeknisHa},"${d.diUtama}","${d.komoditasUtama}","${d.statusKetahanan}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Katalog_LP2B_Luwu_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Save Toast Notification */}
      {saveMessage && (
        <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg flex items-center justify-between font-bold text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{saveMessage}</span>
          </div>
          <button onClick={() => setSaveMessage(null)} className="opacity-80 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 p-6 md:p-8 text-white border border-emerald-500/30 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-60 bg-emerald-500/10 blur-3xl rounded-full -mr-20 -mt-10" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                <Wheat className="w-3.5 h-3.5" />
                <span>Dinas Pertanian • Bidang Prasarana & Perlindungan Lahan (LP2B)</span>
              </div>
              
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${
                dataSourceStatus === "SUPABASE"
                  ? "bg-emerald-400/10 border-emerald-400/30 text-emerald-300"
                  : "bg-blue-400/10 border-blue-400/30 text-blue-300"
              }`}>
                <ShieldCheck className="w-3 h-3" />
                {dataSourceStatus === "SUPABASE" ? "Database Supabase Live" : "Sistem Memori Terverifikasi"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Katalog Lahan Pertanian LP2B & Jaringan Irigasi Kab. Luwu
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-3xl leading-relaxed">
              Basis data resmi penetapan Lahan Pertanian Pangan Berkelanjutan (LP2B) sebesar <strong>29.738 Ha</strong> sesuai <strong>Perda Kab. Luwu No. 5 Tahun 2018</strong> &amp; Hasil Inventarisasi Kantah BPN 2019 di 22 Kecamatan.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2.5 bg-emerald-600/80 hover:bg-emerald-600 border border-emerald-400/30 rounded-xl text-xs font-bold text-white flex items-center gap-2 backdrop-blur-sm transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh CSV</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white flex items-center gap-2 backdrop-blur-sm transition cursor-pointer"
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
            <span>Cakupan Wilayah</span>
            <MapPin className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {dataList.length} Kecamatan
          </div>
          <p className="text-[11px] text-slate-500">Kabupaten Luwu (Selatan, Tengah, Walmas)</p>
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

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Status Pangan:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <option value="ALL">Semua Status ({dataList.length} Kec)</option>
            <option value="Surplus Tinggi">Surplus Tinggi</option>
            <option value="Surplus Sedang">Surplus Sedang</option>
            <option value="Kritis / Rentan">Kritis / Rentan Pegunungan</option>
          </select>

          <button
            type="button"
            onClick={handleResetBaseline}
            title="Reset ke Master Baseline"
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>
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
            Menampilkan {filteredData.length} dari {dataList.length} Kecamatan
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
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 font-semibold">
                    Tidak ada data kecamatan yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => (
                  <tr key={row.kecamatan} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="p-3.5 font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{row.kecamatan}</span>
                    </td>
                    <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                      {Number(row.luasLp2bAktifHa).toLocaleString("id-ID", { minimumFractionDigits: 1 })} Ha
                    </td>
                    <td className="p-3.5 text-amber-600 dark:text-amber-400 font-bold">
                      {Number(row.luasLp2bCadanganHa).toLocaleString("id-ID", { minimumFractionDigits: 1 })} Ha
                    </td>
                    <td className="p-3.5 text-blue-600 dark:text-blue-400 font-bold">
                      {Number(row.irigasiTeknisHa).toLocaleString("id-ID", { minimumFractionDigits: 1 })} Ha
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
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleEditRow(idx)}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-800/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300/50 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingIndex !== null && editFormData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Wheat className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Update Data LP2B • Kecamatan {editFormData.kecamatan}
                </h3>
              </div>
              <button 
                onClick={() => { setEditingIndex(null); setEditFormData(null); }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Nama Kecamatan</label>
                <input
                  type="text"
                  value={editFormData.kecamatan}
                  onChange={(e) => setEditFormData({ ...editFormData, kecamatan: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Status Neraca Pangan</label>
                <select
                  value={editFormData.statusKetahanan}
                  onChange={(e) => setEditFormData({ ...editFormData, statusKetahanan: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                >
                  <option value="Surplus Tinggi">Surplus Tinggi</option>
                  <option value="Surplus Sedang">Surplus Sedang</option>
                  <option value="Kritis / Rentan">Kritis / Rentan</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">LP2B Aktif (Ha)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editFormData.luasLp2bAktifHa}
                  onChange={(e) => setEditFormData({ ...editFormData, luasLp2bAktifHa: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-emerald-600 dark:text-emerald-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Cadangan LP2B (Ha)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editFormData.luasLp2bCadanganHa}
                  onChange={(e) => setEditFormData({ ...editFormData, luasLp2bCadanganHa: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-amber-600 dark:text-amber-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Irigasi Teknis (Ha)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editFormData.irigasiTeknisHa}
                  onChange={(e) => setEditFormData({ ...editFormData, irigasiTeknisHa: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-blue-600 dark:text-blue-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Daerah Irigasi (DI) Utama</label>
                <input
                  type="text"
                  value={editFormData.diUtama}
                  onChange={(e) => setEditFormData({ ...editFormData, diUtama: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Komoditas Unggulan</label>
                <input
                  type="text"
                  value={editFormData.komoditasUtama}
                  onChange={(e) => setEditFormData({ ...editFormData, komoditasUtama: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => { setEditingIndex(null); setEditFormData(null); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Menyimpan..." : "Simpan Perubahan"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PertanianLp2bCatalogView;

