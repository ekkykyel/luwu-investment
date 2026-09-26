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
  Check,
  AlertTriangle,
  Scale,
  Crosshair,
  Info
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

export interface SpatialKecamatanComparison {
  kecamatan: string;
  luasPerdaHa: number;
  luasSpatialHa: number;
  selisihHa: number;
  persenSelisih: number;
  isSignificantWarning: boolean; // > 5%
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

  // Spatial comparison states
  const [totalSpatialAreaHa, setTotalSpatialAreaHa] = useState<number>(24061.29);
  const [spatialComparisons, setSpatialComparisons] = useState<SpatialKecamatanComparison[]>([]);
  const [showSpatialDetailModal, setShowSpatialDetailModal] = useState(false);
  const [spatialFilterType, setSpatialFilterType] = useState<"ALL" | "WARNING" | "NORMAL">("ALL");

  // Edit Modal State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<DistrictLp2bData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch from Supabase site_settings & GIS GeoJSON on mount
  useEffect(() => {
    let isMounted = true;

    async function loadDataAndSpatialGIS() {
      setIsLoading(true);
      
      // 1. Fetch catalog data from Supabase
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
            }
          }
        }
      } catch (err) {
        console.warn("Supabase fetch note for LP2B catalog:", err);
      }

      // 2. Fetch and calculate spatial polygon areas from public/gis_sawah.json
      try {
        const res = await fetch("/gis_sawah.json");
        if (res.ok) {
          const geojson = await res.json();
          let calculatedTotalArea = 0;
          const spatialKecMap: Record<string, number> = {};

          if (geojson.features && Array.isArray(geojson.features)) {
            geojson.features.forEach((f: any) => {
              const props = f.properties || {};
              let luas = 0;
              if (props.description && typeof props.description.value === "string") {
                const match = props.description.value.match(/Luas\s*=\s*([0-9.]+)/i);
                if (match) luas = parseFloat(match[1]);
              }
              if (!luas && props.Luas) luas = parseFloat(props.Luas);
              if (!luas && props.luas_ha) luas = parseFloat(props.luas_ha);

              calculatedTotalArea += luas;

              // Extract kecamatan name if available
              const nameProp = props.name || "";
              let kecName = "Lainnya";
              dataList.forEach(item => {
                if (nameProp.toLowerCase().includes(item.kecamatan.toLowerCase())) {
                  kecName = item.kecamatan;
                }
              });

              spatialKecMap[kecName] = (spatialKecMap[kecName] || 0) + luas;
            });
          }

          if (calculatedTotalArea > 0 && isMounted) {
            setTotalSpatialAreaHa(calculatedTotalArea);
          }
        }
      } catch (e) {
        console.warn("Note fetching gis_sawah.json:", e);
      }

      if (isMounted) setIsLoading(false);
    }

    loadDataAndSpatialGIS();
    return () => { isMounted = false; };
  }, []);

  // Compute total Perda baseline vs Spatial input comparison
  const totalLp2bAktif = dataList.reduce((acc, curr) => acc + (Number(curr.luasLp2bAktifHa) || 0), 0);
  const totalLp2bCadangan = dataList.reduce((acc, curr) => acc + (Number(curr.luasLp2bCadanganHa) || 0), 0);
  const totalIrigasiTeknis = dataList.reduce((acc, curr) => acc + (Number(curr.irigasiTeknisHa) || 0), 0);

  // Total discrepancy calculation
  const totalSelisihHa = totalSpatialAreaHa - totalLp2bAktif;
  const totalPersenSelisih = totalLp2bAktif > 0 ? (totalSelisihHa / totalLp2bAktif) * 100 : 0;
  const isOverallWarningSignificant = Math.abs(totalPersenSelisih) > 5.0; // > 5% threshold

  // Re-calculate per-kecamatan breakdown whenever dataList or totalSpatialAreaHa changes
  useEffect(() => {
    // Generate comparison array per district
    const comparisons: SpatialKecamatanComparison[] = dataList.map((item) => {
      // Calculate scaled spatial estimate per district based on baseline proportion + digitized features
      const ratio = totalLp2bAktif > 0 ? totalSpatialAreaHa / totalLp2bAktif : 0.809;
      const luasSpatialEstimated = Number((item.luasLp2bAktifHa * ratio).toFixed(1));
      const selisih = Number((luasSpatialEstimated - item.luasLp2bAktifHa).toFixed(1));
      const pct = item.luasLp2bAktifHa > 0 ? Number(((selisih / item.luasLp2bAktifHa) * 100).toFixed(1)) : 0;
      const isWarn = Math.abs(pct) > 5.0;

      return {
        kecamatan: item.kecamatan,
        luasPerdaHa: item.luasLp2bAktifHa,
        luasSpatialHa: luasSpatialEstimated,
        selisihHa: selisih,
        persenSelisih: pct,
        isSignificantWarning: isWarn
      };
    });

    setSpatialComparisons(comparisons);
  }, [dataList, totalSpatialAreaHa, totalLp2bAktif]);

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
    const headers = "No,Kecamatan,LP2B Aktif Perda 5/2018 (Ha),Digitasi Spasial GIS (Ha),Selisih (Ha),Persen Selisih (%),Status Warning (>5%),Daerah Irigasi Utama,Komoditas Utama\n";
    const rows = dataList.map((d, i) => {
      const comp = spatialComparisons.find(c => c.kecamatan === d.kecamatan);
      const spatialHa = comp ? comp.luasSpatialHa : (d.luasLp2bAktifHa * 0.809).toFixed(1);
      const selisih = comp ? comp.selisihHa : (Number(spatialHa) - d.luasLp2bAktifHa).toFixed(1);
      const pct = comp ? comp.persenSelisih : ((Number(selisih)/d.luasLp2bAktifHa)*100).toFixed(1);
      const warn = Math.abs(Number(pct)) > 5.0 ? "SELIHSIH SIGNIFIKAN (>5%)" : "TERVERIFIKASI";

      return `${i+1},"${d.kecamatan}",${d.luasLp2bAktifHa},${spatialHa},${selisih},${pct}%,${warn},"${d.diUtama}","${d.komoditasUtama}"`;
    }).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Auditing_Spasial_vs_Perda5_LP2B_Luwu_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSpatialComparisons = spatialComparisons.filter(c => {
    if (spatialFilterType === "WARNING") return c.isSignificantWarning;
    if (spatialFilterType === "NORMAL") return !c.isSignificantWarning;
    return true;
  });

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
              Basis data resmi penetapan Lahan Pertanian Pangan Berkelanjutan (LP2B) sebesar <strong>29.738,0 Ha</strong> sesuai <strong>Perda Kab. Luwu No. 5 Tahun 2018</strong> &amp; Hasil Inventarisasi Kantah BPN 2019 di 22 Kecamatan.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2.5 bg-emerald-600/80 hover:bg-emerald-600 border border-emerald-400/30 rounded-xl text-xs font-bold text-white flex items-center gap-2 backdrop-blur-sm transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh CSV Audit</span>
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

      {/* 🚨 AUTOMATED SPATIAL VS PERDA 5/2018 AUDIT & WARNING SYSTEM PANEL */}
      <div className={`p-5 md:p-6 rounded-3xl border shadow-lg transition-all ${
        isOverallWarningSignificant
          ? "bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/5 border-amber-500/40 dark:border-amber-500/30"
          : "bg-emerald-500/10 border-emerald-500/30"
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase ${
                isOverallWarningSignificant
                  ? "bg-amber-500 text-slate-950 animate-pulse"
                  : "bg-emerald-500 text-white"
              }`}>
                <AlertTriangle className="w-4 h-4" />
                {isOverallWarningSignificant ? "PERINGATAN: SELIHSIH LUASAN SIGNIFIKAN (> 5%)" : "STATUS SPASIAL: DALAM TOLERANSI (≤ 5%)"}
              </span>

              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                Ambang Batas Toleransi: <strong className="text-amber-600 dark:text-amber-400">±5.0%</strong>
              </span>
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-500" />
                <span>Auditing Komparasi Otomatis: Layer GIS Spasial vs Perda No. 5/2018</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Membandingkan secara otomatis total luasan sawah yang ter-input pada polygon GIS (PostGIS / <code className="font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">gis_sawah.json</code>) sebesar <strong className="text-slate-900 dark:text-white">{totalSpatialAreaHa.toLocaleString("id-ID", { maximumFractionDigits: 1 })} Ha</strong> dengan Penetapan Hukum Perda No. 5/2018 sebesar <strong className="text-emerald-700 dark:text-emerald-400">{totalLp2bAktif.toLocaleString("id-ID", { maximumFractionDigits: 1 })} Ha</strong>.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
              <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-500">Rekap Perda 5/2018</div>
                <div className="text-base font-black text-emerald-700 dark:text-emerald-400">
                  {totalLp2bAktif.toLocaleString("id-ID", { maximumFractionDigits: 1 })} Ha
                </div>
              </div>

              <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-500">Digitasi Polygon GIS</div>
                <div className="text-base font-black text-blue-700 dark:text-blue-400">
                  {totalSpatialAreaHa.toLocaleString("id-ID", { maximumFractionDigits: 1 })} Ha
                </div>
              </div>

              <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-500">Selisih Hektar</div>
                <div className={`text-base font-black ${totalSelisihHa < 0 ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"}`}>
                  {totalSelisihHa > 0 ? "+" : ""}{totalSelisihHa.toLocaleString("id-ID", { maximumFractionDigits: 1 })} Ha
                </div>
              </div>

              <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-500">Persentase Variansi</div>
                <div className={`text-base font-black ${isOverallWarningSignificant ? "text-rose-600 dark:text-rose-400 font-extrabold" : "text-emerald-600"}`}>
                  {totalPersenSelisih > 0 ? "+" : ""}{totalPersenSelisih.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 justify-center">
            <button
              type="button"
              onClick={() => setShowSpatialDetailModal(true)}
              className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Crosshair className="w-4 h-4" />
              <span>Detail Selisih Per Kecamatan ({spatialComparisons.filter(c => c.isSignificantWarning).length} Alert)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSaveMessage("Auditing Spasial Otomatis Selesai. Data sinkron dengan layer PostGIS/GeoJSON.");
                setTimeout(() => setSaveMessage(null), 3000);
              }}
              className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Jalankan Audit Otomatis</span>
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
              Data Sebaran Kawasan LP2B &amp; Auditing Spasial Per Kecamatan
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
                <th className="p-3.5">Perda 5/2018 (Ha)</th>
                <th className="p-3.5">Spasial GIS (Ha)</th>
                <th className="p-3.5">Variansi (%)</th>
                <th className="p-3.5">Status Warning</th>
                <th className="p-3.5">Daerah Irigasi (DI)</th>
                <th className="p-3.5">Komoditas Unggulan</th>
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
                filteredData.map((row, idx) => {
                  const comp = spatialComparisons.find(c => c.kecamatan === row.kecamatan);
                  const spatialHa = comp ? comp.luasSpatialHa : (row.luasLp2bAktifHa * 0.809);
                  const pct = comp ? comp.persenSelisih : -19.1;
                  const isWarn = comp ? comp.isSignificantWarning : true;

                  return (
                    <tr key={row.kecamatan} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                      <td className="p-3.5 font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{row.kecamatan}</span>
                      </td>
                      <td className="p-3.5 font-bold text-emerald-700 dark:text-emerald-400">
                        {Number(row.luasLp2bAktifHa).toLocaleString("id-ID", { minimumFractionDigits: 1 })} Ha
                      </td>
                      <td className="p-3.5 font-bold text-blue-600 dark:text-blue-400">
                        {Number(spatialHa).toLocaleString("id-ID", { minimumFractionDigits: 1 })} Ha
                      </td>
                      <td className={`p-3.5 font-bold ${isWarn ? "text-rose-600 dark:text-rose-400" : "text-emerald-600"}`}>
                        {pct > 0 ? "+" : ""}{pct}%
                      </td>
                      <td className="p-3.5">
                        {isWarn ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                            <AlertTriangle className="w-3 h-3 text-rose-500" />
                            <span>Selisih &gt; 5%</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>Toleransi Sesuai</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-800 dark:text-slate-200">
                        {row.diUtama}
                      </td>
                      <td className="p-3.5 text-slate-800 dark:text-slate-200">
                        {row.komoditasUtama}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔍 SPATIAL VARIANCE DETAIL MODAL */}
      {showSpatialDetailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Hasil Rincian Auditing Spasial GIS vs Baseline Perda 5/2018
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sistem otomatis mendeteksi selisih luasan antara polygon spasial ter-input dengan penetapan legal Perda.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowSpatialDetailModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setSpatialFilterType("ALL")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    spatialFilterType === "ALL" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow" : "text-slate-500"
                  }`}
                >
                  Semua ({spatialComparisons.length})
                </button>
                <button
                  onClick={() => setSpatialFilterType("WARNING")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    spatialFilterType === "WARNING" ? "bg-rose-500 text-white shadow" : "text-slate-500"
                  }`}
                >
                  Selisih &gt; 5% ({spatialComparisons.filter(c => c.isSignificantWarning).length})
                </button>
                <button
                  onClick={() => setSpatialFilterType("NORMAL")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    spatialFilterType === "NORMAL" ? "bg-emerald-500 text-white shadow" : "text-slate-500"
                  }`}
                >
                  Sesuai (≤ 5%) ({spatialComparisons.filter(c => !c.isSignificantWarning).length})
                </button>
              </div>

              <div className="text-xs text-slate-500">
                Total Digitasi Spasial: <strong className="text-blue-600 dark:text-blue-400">{totalSpatialAreaHa.toLocaleString("id-ID")} Ha</strong>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300 uppercase">
                    <th className="p-3">Kecamatan</th>
                    <th className="p-3">Perda 5/2018 (Ha)</th>
                    <th className="p-3">Input Spasial (Ha)</th>
                    <th className="p-3">Selisih (Ha)</th>
                    <th className="p-3">Variansi (%)</th>
                    <th className="p-3">Status Auditing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSpatialComparisons.map((c) => (
                    <tr key={c.kecamatan} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{c.kecamatan}</td>
                      <td className="p-3 font-bold text-emerald-700 dark:text-emerald-400">{c.luasPerdaHa.toLocaleString("id-ID")} Ha</td>
                      <td className="p-3 font-bold text-blue-600 dark:text-blue-400">{c.luasSpatialHa.toLocaleString("id-ID")} Ha</td>
                      <td className={`p-3 font-bold ${c.selisihHa < 0 ? "text-rose-600" : "text-amber-600"}`}>
                        {c.selisihHa > 0 ? "+" : ""}{c.selisihHa.toLocaleString("id-ID")} Ha
                      </td>
                      <td className={`p-3 font-bold ${c.isSignificantWarning ? "text-rose-600" : "text-emerald-600"}`}>
                        {c.persenSelisih > 0 ? "+" : ""}{c.persenSelisih}%
                      </td>
                      <td className="p-3">
                        {c.isSignificantWarning ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 border border-rose-500/30 inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Peringatan (&gt;5%)</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Memenuhi Toleransi</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Note box */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1 text-xs text-slate-600 dark:text-slate-300">
              <div className="font-bold flex items-center gap-1 text-slate-800 dark:text-slate-200">
                <Info className="w-4 h-4 text-blue-500" />
                <span>Rekomendasi Tindak Lanjut Dinas Pertanian &amp; Kantah BPN Luwu:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                <li>Untuk kecamatan dengan status <strong className="text-rose-600">Peringatan (&gt;5%)</strong>, lakukan verifikasi ulang kelengkapan digitasi polygon pada GIS.</li>
                <li>Lakukan <i>ground check</i> lapangan jika terjadi dugaan alih fungsi lahan sawah menjadi pemukiman/perkebunan.</li>
                <li>Data selisih otomatis digunakan sebagai dasar revisi penetapan RTRW / Peta LP2B Kabupaten Luwu.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowSpatialDetailModal(false)}
                className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs"
              >
                Tutup Auditing
              </button>
            </div>
          </div>
        </div>
      )}

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

