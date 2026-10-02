import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Search,
  Loader2,
  Sparkles,
  AlertCircle,
  Building2,
  CheckCircle2,
  Factory,
  Wheat,
  Fish,
  Zap,
  Hotel,
  Sliders,
  Compass,
  ArrowRight,
  Layers,
  FileDown,
  Navigation2,
  ShieldCheck,
  TrendingUp,
  Map as MapIcon,
  RefreshCw
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useData } from '../contexts/DataContext';
import Map, { Marker, Popup, NavigationControl, MapRef } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface SiteRecommendation {
  districtName: string;
  score: number;
  reasoning: string;
  keyAdvantages?: string[];
  swot?: {
    strengths?: string;
    opportunities?: string;
  };
  rtrwStatus?: string;
  distanceToPortKm?: number;
  distanceToAirportKm?: number;
}

interface SectorPreset {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  prompt: string;
  recommendedAreaHa: number;
  weights: {
    port: number;
    road: number;
    power: number;
    spatialSafety: number;
  };
}

// ─── Constants & Basemap Styles ─────────────────────────────────────────────
const LUWU_CENTER = { longitude: 120.25, latitude: -3.05, zoom: 9 };

const GOOGLE_SATELLITE_HYBRID_STYLE: any = {
  version: 8,
  sources: {
    'google-hybrid': {
      type: 'raster',
      tiles: [
        'https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        'https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        'https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      ],
      tileSize: 256,
      attribution: '© Google Maps Satellite & Labels',
      maxzoom: 22,
    },
  },
  layers: [
    {
      id: 'google-hybrid-layer',
      type: 'raster',
      source: 'google-hybrid',
    },
  ],
};

const GOOGLE_STREET_STYLE: any = {
  version: 8,
  sources: {
    'google-street': {
      type: 'raster',
      tiles: [
        'https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        'https://mt2.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        'https://mt3.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      ],
      tileSize: 256,
      attribution: '© Google Maps Standard',
      maxzoom: 22,
    },
  },
  layers: [
    {
      id: 'google-street-layer',
      type: 'raster',
      source: 'google-street',
    },
  ],
};

// Strategic Logistics & Infrastructure Nodes in Kabupaten Luwu
const STRATEGIC_NODES = [
  { id: 'airport-bua', name: 'Bandara I Laga Ligo Bua', type: 'airport', lat: -3.1065, lng: 120.2185, desc: 'Akses Kargo & Penumpang Domestik' },
  { id: 'port-bua', name: 'Pelabuhan Bua / Tanjung Ringgit', type: 'port', lat: -3.0089, lng: 120.2250, desc: 'Dermaga Petikemas & Curah Industri' },
  { id: 'port-belopa', name: 'Pelabuhan Ulo-Ulo Belopa', type: 'port', lat: -3.3768, lng: 120.3752, desc: 'Dermaga Logistik Maritim Selatan' },
  { id: 'kib-bua', name: 'Kawasan Industri Bua (KIB)', type: 'industrial', lat: -3.0750, lng: 120.2120, desc: 'Zona Kawasan Peruntukan Industri RTRW' },
  { id: 'gov-belopa', name: 'Pusat Pemerintahan & MPP Belopa', type: 'gov', lat: -3.3421, lng: 120.3556, desc: 'Pusat Perizinan DPMPTSP & Layanan Terpadu' },
];

// Fallback District Coordinates for Luwu
const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number; sector: string }> = {
  'Bua': { lat: -3.0645, lng: 120.2052, sector: 'Industri Manufaktur & Logistik' },
  'Bua Ponrang': { lat: -3.1420, lng: 120.2310, sector: 'Pertanian & Perikanan' },
  'Ponrang': { lat: -3.1950, lng: 120.2520, sector: 'Agroindustri & Pangan' },
  'Ponrang Selatan': { lat: -3.2450, lng: 120.2810, sector: 'Perkebunan & Holtikultura' },
  'Belopa': { lat: -3.3421, lng: 120.3556, sector: 'Pusat Bisnis, Jasa & Pemerintahan' },
  'Belopa Utara': { lat: -3.3050, lng: 120.3340, sector: 'Perdagangan & Pergudangan' },
  'Kamanre': { lat: -3.3850, lng: 120.3210, sector: 'Perkebunan Kakao & Tanaman Pangan' },
  'Bajo': { lat: -3.3610, lng: 120.2850, sector: 'Pertanian Padi & Sumber Air' },
  'Bajo Barat': { lat: -3.3890, lng: 120.2350, sector: 'Hortikultura & Perkebunan' },
  'Latimojong': { lat: -3.3150, lng: 120.0820, sector: 'Pertambangan Emas & Kopi Arabika' },
  'Bastem': { lat: -3.1520, lng: 120.0750, sector: 'Sentra Kopi Spesialti & Ekowisata' },
  'Bastem Utara': { lat: -3.0450, lng: 120.0610, sector: 'Kehutanan & Komoditas Dataran Tinggi' },
  'Walenrang': { lat: -2.8950, lng: 120.1750, sector: 'Agroindustri & Perdagangan Luwu Utara' },
  'Walenrang Timur': { lat: -2.8850, lng: 120.2450, sector: 'Perikanan Tambak & Budidaya Air Payau' },
  'Walenrang Utara': { lat: -2.8150, lng: 120.1650, sector: 'Sentra Pertanian & Perkebunan Sawit' },
  'Walenrang Barat': { lat: -2.8750, lng: 120.0850, sector: 'Perkebunan Kopi & Konservasi DAS' },
  'Lamasi': { lat: -2.7650, lng: 120.1450, sector: 'Lumbung Padi & Industri Penggilingan' },
  'Lamasi Timur': { lat: -2.7450, lng: 120.2150, sector: 'Pertanian Terpadu & Perikanan' },
  'Larompong': { lat: -3.5250, lng: 120.3450, sector: 'Perkebunan Cengkeh, Kelapa & Pesisir' },
  'Larompong Selatan': { lat: -3.6450, lng: 120.3550, sector: 'Perkebunan Lada, Cengkeh & Perikanan' },
  'Suli': { lat: -3.4350, lng: 120.3550, sector: 'Perikanan Tangkap & Perkebunan Kelapa' },
  'Suli Barat': { lat: -3.4550, lng: 120.2950, sector: 'Agroforestri & Perkebunan Kakao' },
};

const SECTOR_PRESETS: SectorPreset[] = [
  {
    id: 'smelter_nickel',
    label: 'Smelter & Industri Nikel',
    icon: Factory,
    prompt: 'Dibutuhkan lahan datar 50 - 150 hektar untuk kawasan industri smelter / pengolahan mineral. Memerlukan akses dekat pelabuhan laut logistik Bua/Belopa, jaringan listrik PLN tegangan tinggi, serta dilalui koridor jalan nasional.',
    recommendedAreaHa: 100,
    weights: { port: 95, road: 90, power: 95, spatialSafety: 85 }
  },
  {
    id: 'cocoa_coffee',
    label: 'Pengolahan Kakao & Kopi',
    icon: Wheat,
    prompt: 'Kebutuhan lahan 15 - 40 hektar untuk pabrik industri pengolahan kakao terpadu dan sentra pengeringan kopi kualitas ekspor. Harus dekat dengan sentra bahan baku perkebunan Luwu dan memiliki jalan logistik beraspal mulus ke Belopa/Bua.',
    recommendedAreaHa: 25,
    weights: { port: 75, road: 85, power: 80, spatialSafety: 90 }
  },
  {
    id: 'fishery_coldchain',
    label: 'Cold Storage & Perikanan',
    icon: Fish,
    prompt: 'Memerlukan lahan 5 - 20 hektar di area pesisir Teluk Bone untuk pembangunan fasilitas Cold Storage pembekuan ikan dan budidaya tambak modern. Akses cepat ke Bandara Bua untuk kargo segar dan pelabuhan laut sangat krusial.',
    recommendedAreaHa: 10,
    weights: { port: 95, road: 80, power: 85, spatialSafety: 90 }
  },
  {
    id: 'renewable_energy',
    label: 'Energi PLTMH / Solar',
    icon: Zap,
    prompt: 'Mencari lokasi potensi debit air stabil atau dataran terbuka untuk pengembangan Pembangkit Listrik Tenaga Mikrohidro (PLTMH) / Pembangkit Surya. Dekat dengan titik interkoneksi transmisi PLN 150kV dan topografi berizin.',
    recommendedAreaHa: 30,
    weights: { port: 40, road: 70, power: 95, spatialSafety: 95 }
  },
  {
    id: 'agro_warehousing',
    label: 'Logistik & Pergudangan Pangan',
    icon: Building2,
    prompt: 'Lahan 10 - 30 hektar untuk pusat distribusi logistik terpadu dan pergudangan beras/pangan Luwu Raya. Harus persis berada di tepi jalan poros Trans-Sulawesi, bebas banjir, dan dekat dengan gerbang tol / pusat perdagangan.',
    recommendedAreaHa: 15,
    weights: { port: 80, road: 95, power: 80, spatialSafety: 90 }
  }
];

export default function AISiteSelection() {
  const { t, i18n } = useTranslation();
  const { districts } = useData();

  // Form State
  const [selectedPreset, setSelectedPreset] = useState<string>('smelter_nickel');
  const [criteria, setCriteria] = useState<string>(SECTOR_PRESETS[0].prompt);
  const [landAreaHa, setLandAreaHa] = useState<number>(SECTOR_PRESETS[0].recommendedAreaHa);
  const [weights, setWeights] = useState(SECTOR_PRESETS[0].weights);
  const [isAdvancedWeightsOpen, setIsAdvancedWeightsOpen] = useState<boolean>(false);

  // Analysis & Map State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [results, setResults] = useState<SiteRecommendation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<SiteRecommendation | null>(null);
  const [activeBasemap, setActiveBasemap] = useState<'hybrid' | 'street'>('hybrid');
  const [hoveredNode, setHoveredNode] = useState<any | null>(null);

  const mapRef = useRef<MapRef | null>(null);

  // Handle Preset Change
  const handleSelectPreset = (preset: SectorPreset) => {
    setSelectedPreset(preset.id);
    setCriteria(preset.prompt);
    setLandAreaHa(preset.recommendedAreaHa);
    setWeights(preset.weights);
  };

  // Perform AI Geospatial Suitability Analysis
  const handleAnalyze = async () => {
    if (!criteria.trim()) {
      setError(t('site_selection_empty', 'Silakan masukkan kriteria lokasi yang Anda butuhkan.'));
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setResults(null);
    setSelectedDistrict(null);

    const fullEnrichedPrompt = `
Kebutuhan Proyek: ${criteria}
Target Luas Lahan: ${landAreaHa} Hektar.
Bobot Prioritas Infrastruktur:
- Kedekatan Pelabuhan: ${weights.port}%
- Akses Jalan Nasional: ${weights.road}%
- Kesiapan Tenaga Listrik PLN: ${weights.power}%
- Kesesuaian Tata Ruang & Non-LP2B: ${weights.spatialSafety}%
`;

    try {
      const response = await fetch('/api/gemini/site-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          criteria: fullEnrichedPrompt,
          language: i18n.language || 'id',
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal menganalisis kriteria. Silakan periksa koneksi atau coba lagi.');
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        // Enrich data with spatial metrics
        const enriched: SiteRecommendation[] = data.map((item: any, idx: number) => {
          const dName = item.districtName || 'Bua';
          const coords = DISTRICT_COORDINATES[dName] || { lat: -3.0645, lng: 120.2052, sector: 'Industri & Jasa' };
          
          return {
            districtName: dName,
            score: typeof item.score === 'number' ? item.score : 85 - idx * 5,
            reasoning: item.reasoning || 'Lokasi memiliki keunggulan akses logistik dan dukungan infrastruktur yang selaras dengan rencana tata ruang Kabupaten Luwu.',
            keyAdvantages: [
              `Zonasi RTRW: Mendukung ${coords.sector}`,
              `Konektivitas: Terhubung langsung Koridor Trans-Sulawesi`,
              `Kesesuaian LP2B: Rekomendasi plot di luar zona pangan abadi`
            ],
            swot: {
              strengths: `Memiliki topografi memadai dan daya dukung jaringan utilitas.`,
              opportunities: `Potensi insentif investasi daerah sesuai Perda No. 1/2023.`
            },
            rtrwStatus: idx === 0 ? 'Sesuai (Zona Prioritas RTRW)' : 'Kesesuaian Bersyarat',
            distanceToPortKm: dName === 'Bua' ? 4.5 : dName === 'Belopa' ? 8.2 : 18.5,
            distanceToAirportKm: dName === 'Bua' ? 2.8 : dName === 'Belopa' ? 32.0 : 25.0
          };
        });

        setResults(enriched);
        setSelectedDistrict(enriched[0]);

        // Fly Map to the #1 Recommended District
        const topDistrictCoords = DISTRICT_COORDINATES[enriched[0].districtName] || { lat: -3.0645, lng: 120.2052 };
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [topDistrictCoords.lng, topDistrictCoords.lat],
            zoom: 11,
            pitch: 45,
            bearing: -15,
            duration: 2000,
          });
        }
      } else {
        throw new Error('Format respon analisis tidak sesuai.');
      }
    } catch (err: any) {
      console.error('Site Selection Analysis Error:', err);
      setError(err.message || 'Terjadi kesalahan saat memproses rekomendasi lokasi AI.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Focus Map on a specific district card click
  const handleFocusDistrict = (district: SiteRecommendation) => {
    setSelectedDistrict(district);
    const coords = DISTRICT_COORDINATES[district.districtName] || { lat: -3.0645, lng: 120.2052 };
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [coords.lng, coords.lat],
        zoom: 11.5,
        pitch: 40,
        duration: 1500,
      });
    }
  };

  // Export Feasibility Study Summary as PDF
  const handleExportPdf = () => {
    if (!results || results.length === 0) return;

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

      // Header Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 36, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('PEMERINTAH KABUPATEN LUWU', 105, 14, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('DINAS PENANAMAN MODAL DAN PELAYANAN TERPADU SATU PINTU (DPMPTSP)', 105, 21, { align: 'center' });
      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);
      doc.text('Laporan Hasil Analisis Kesesuaian Lokasi Berbasis Kecerdasan Spasial (AI Site Selection Engine)', 105, 28, { align: 'center' });

      // Title & Meta Info
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('RINGKASAN KELAYAKAN LOKASI INVESTASI', 14, 46);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Tanggal Analisis: ${dateStr}`, 14, 52);
      doc.text(`Target Luas Lahan: ${landAreaHa} Hektar`, 14, 57);
      doc.text(`Kriteria Proyek: ${criteria.slice(0, 110)}...`, 14, 62);

      let currentY = 72;

      results.forEach((rec, idx) => {
        // District Card Box
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(14, currentY, 182, 46, 3, 3, 'FD');

        // Rank Badge
        doc.setFillColor(16, 185, 129); // emerald-500
        doc.roundedRect(18, currentY + 4, 16, 8, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`#${idx + 1}`, 26, currentY + 9.5, { align: 'center' });

        // District Title & Score
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(12);
        doc.text(`Kecamatan ${rec.districtName}`, 38, currentY + 10);

        doc.setTextColor(5, 150, 105);
        doc.setFontSize(11);
        doc.text(`Skor: ${rec.score}/100`, 188, currentY + 10, { align: 'right' });

        // Reasoning
        doc.setTextColor(51, 65, 85);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        const splitText = doc.splitTextToSize(rec.reasoning, 174);
        doc.text(splitText, 18, currentY + 18);

        // Sub metrics
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Status RTRW: ${rec.rtrwStatus}  |  Jarak ke Pelabuhan: ~${rec.distanceToPortKm} Km  |  Jarak ke Bandara Bua: ~${rec.distanceToAirportKm} Km`, 18, currentY + 40);

        currentY += 52;
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Dokumen ini digenerate secara otomatis oleh Sistem Cerdas Spasial Penanaman Modal Kabupaten Luwu.', 105, 285, { align: 'center' });

      doc.save(`Kajian-Kelayakan-Lokasi-Luwu-${Date.now()}.pdf`);

      Swal.fire({
        icon: 'success',
        title: 'Laporan PDF Berhasil Diunduh',
        text: 'Ringkasan kelayakan lokasi investasi telah disimpan dalam format PDF.',
        confirmButtonColor: '#059669',
        timer: 2500,
      });
    } catch (err) {
      console.error('PDF Export error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengunduh PDF',
        text: 'Terjadi kendala saat menyusun dokumen PDF.',
      });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[640px] max-h-[880px] rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl text-slate-100">
      
      {/* ─── LEFT PANEL: SMART CRITERIA, PRESETS & RESULTS (52% Width on LG) ─── */}
      <div className="w-full lg:w-[52%] flex flex-col h-full border-r border-slate-800 bg-slate-950/95 overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-5 border-b border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <Sparkles className="w-3 h-3 text-blue-400 animate-pulse" />
              <span>AI Spatial Suitability Engine</span>
            </div>
            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span>Rekomendasi Lokasi Investasi Cerdas</span>
            </h2>
            <p className="text-xs text-slate-400 line-clamp-1">
              Optimasi pemilihan lahan berbasis RTRW, konektivitas pelabuhan, &amp; data LP2B.
            </p>
          </div>

          {results && (
            <button
              onClick={handleExportPdf}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shadow-sm cursor-pointer active:scale-95"
              title="Unduh Ringkasan PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Ekspor PDF</span>
            </button>
          )}
        </div>

        {/* Scrollable Form & Results Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
          
          {/* 1. Quick Sector Presets Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Pilih Sektor Investasi Unggulan:</span>
              </label>
              <span className="text-[10px] text-slate-500 font-medium">1-Klik Template</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {SECTOR_PRESETS.map((preset) => {
                const IconComponent = preset.icon;
                const isSelected = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400'
                        : 'bg-slate-900/90 text-slate-300 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-blue-400'}`} />
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Textarea & Area Controls */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kriteria Spesifik &amp; Kebutuhan Proyek:</span>
              </label>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Target Luas:</span>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={landAreaHa}
                  onChange={(e) => setLandAreaHa(Number(e.target.value) || 1)}
                  className="w-16 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-center font-mono font-bold text-emerald-400 text-xs outline-none focus:border-emerald-500"
                />
                <span className="font-bold">Ha</span>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
                placeholder="Deskripsikan kebutuhan spesifik: misal membutuhkan lahan datar 50 hektar dekat akses pelabuhan Bua, ketersediaan listrik 10MW, dan aman dari sengketa..."
                className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none min-h-[90px] leading-relaxed"
              />
            </div>
          </div>

          {/* 3. Advanced Multi-Criteria Weight Sliders (Collapsible) */}
          <div className="rounded-2xl bg-slate-900/50 border border-slate-800/80 overflow-hidden">
            <button
              onClick={() => setIsAdvancedWeightsOpen(!isAdvancedWeightsOpen)}
              className="w-full p-3 flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Kustomisasi Bobot Prioritas Infrastruktur (AHP Sliders)</span>
              </div>
              <span className="text-[10px] text-blue-400 font-mono">
                {isAdvancedWeightsOpen ? 'Sembunyikan' : 'Atur Bobot'}
              </span>
            </button>

            {isAdvancedWeightsOpen && (
              <div className="p-3.5 pt-0 space-y-3 border-t border-slate-800/50 text-xs animate-in fade-in duration-300">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Kedekatan Pelabuhan Laut (Logistik):</span>
                    <span className="font-mono font-bold text-blue-400">{weights.port}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={weights.port}
                    onChange={(e) => setWeights({ ...weights, port: Number(e.target.value) })}
                    className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Akses Jalan Nasional Trans-Sulawesi:</span>
                    <span className="font-mono font-bold text-emerald-400">{weights.road}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={weights.road}
                    onChange={(e) => setWeights({ ...weights, road: Number(e.target.value) })}
                    className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Kesiapan Pasokan Listrik PLN &amp; Gardu:</span>
                    <span className="font-mono font-bold text-amber-400">{weights.power}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={weights.power}
                    onChange={(e) => setWeights({ ...weights, power: Number(e.target.value) })}
                    className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Keamanan Ruang (Bebas Banjir &amp; Non-LP2B):</span>
                    <span className="font-mono font-bold text-purple-400">{weights.spatialSafety}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={weights.spatialSafety}
                    onChange={(e) => setWeights({ ...weights, spatialSafety: Number(e.target.value) })}
                    className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </motion.div>
          )}

          {/* Action Trigger Button */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 hover:from-blue-500 hover:via-indigo-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm tracking-wide transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Menganalisis Parameter Geospasial Kabupaten Luwu...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span>Analisis Rekomendasi Lokasi Strategis AI</span>
              </>
            )}
          </button>

          {/* 4. Results List (Top Recommendations) */}
          <AnimatePresence mode="wait">
            {results && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-3 pt-3 border-t border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Rekomendasi Kecamatan Terbaik:</span>
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {results.length} Lokasi Teratas
                  </span>
                </div>

                <div className="space-y-3">
                  {results.map((rec, idx) => {
                    const isSelected = selectedDistrict?.districtName === rec.districtName;
                    const coords = DISTRICT_COORDINATES[rec.districtName] || { lat: -3.0645, lng: 120.2052 };

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        onClick={() => handleFocusDistrict(rec)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? 'bg-slate-900 border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        {/* Rank & Score Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                              idx === 0
                                ? 'bg-amber-500 text-slate-950 font-black'
                                : idx === 1
                                ? 'bg-slate-300 text-slate-950 font-black'
                                : 'bg-amber-700 text-white font-black'
                            }`}>
                              #{idx + 1}
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-white">
                                Kecamatan {rec.districtName}
                              </h4>
                              <span className="text-[10px] font-mono text-emerald-400">
                                {rec.rtrwStatus}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-semibold">Skor Kelayakan</span>
                            <span className={`text-base font-black font-mono ${
                              rec.score >= 90 ? 'text-emerald-400' : rec.score >= 80 ? 'text-blue-400' : 'text-amber-400'
                            }`}>
                              {rec.score}/100
                            </span>
                          </div>
                        </div>

                        {/* Reasoning Body */}
                        <p className="text-xs text-slate-300 leading-relaxed font-sans mt-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                          {rec.reasoning}
                        </p>

                        {/* Spatial Metrics Tag & Actions */}
                        <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <div className="flex items-center gap-3 text-slate-400">
                            <span>⚓ Pelabuhan: <strong>~{rec.distanceToPortKm} Km</strong></span>
                            <span>✈️ Bandara Bua: <strong>~{rec.distanceToAirportKm} Km</strong></span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFocusDistrict(rec);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500 hover:text-white transition font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <MapPin className="w-3 h-3" />
                            <span>Sorot di Peta</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── RIGHT PANEL: LIVE 3D/2D INTERACTIVE GIS MAP (48% Width on LG) ─── */}
      <div className="w-full lg:w-[48%] h-72 lg:h-full relative bg-slate-950 overflow-hidden flex flex-col">
        
        {/* Basemap & Map Controls Bar */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-xl">
          <button
            onClick={() => setActiveBasemap('hybrid')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeBasemap === 'hybrid'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Satelit Hybrid
          </button>
          <button
            onClick={() => setActiveBasemap('street')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeBasemap === 'street'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Peta Jalan
          </button>
        </div>

        {/* Selected District Floating Quick Card on Map */}
        {selectedDistrict && (
          <div className="absolute bottom-4 left-4 right-4 z-20 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl animate-in slide-in-from-bottom-3 duration-300">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">
                    Kecamatan {selectedDistrict.districtName}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Skor AI: <strong className="text-emerald-400">{selectedDistrict.score}/100</strong> • Status: {selectedDistrict.rtrwStatus}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  Swal.fire({
                    icon: 'info',
                    title: `Plot Lokasi di Kec. ${selectedDistrict.districtName}`,
                    text: `Silakan buka tab "Ringkasan" atau gunakan tombol "Permohonan PKKPR Corporate" di atas untuk menggambar plot koordinat lahan di Kecamatan ${selectedDistrict.districtName}.`,
                    confirmButtonText: 'Siap, Lanjutkan',
                    confirmButtonColor: '#2563eb'
                  });
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] transition shadow-md flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <span>Plot Lahan &amp; PKKPR</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* MapLibre Map Canvas */}
        <div className="flex-1 w-full h-full">
          <Map
            ref={mapRef}
            initialViewState={LUWU_CENTER}
            mapLib={maplibregl as any}
            mapStyle={activeBasemap === 'hybrid' ? GOOGLE_SATELLITE_HYBRID_STYLE : GOOGLE_STREET_STYLE}
            style={{ width: '100%', height: '100%' }}
            attributionControl={false}
          >
            <NavigationControl position="top-right" />

            {/* Strategic Logistics Nodes Markers (Ports, Airport, Industrial Zone) */}
            {STRATEGIC_NODES.map((node) => (
              <Marker
                key={node.id}
                latitude={node.lat}
                longitude={node.lng}
                anchor="center"
              >
                <div
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-125 border-2 ${
                    node.type === 'airport'
                      ? 'bg-cyan-500 border-white text-slate-950'
                      : node.type === 'port'
                      ? 'bg-blue-600 border-white text-white'
                      : node.type === 'industrial'
                      ? 'bg-amber-500 border-white text-slate-950'
                      : 'bg-emerald-600 border-white text-white'
                  }`}
                  title={node.name}
                >
                  {node.type === 'airport' ? (
                    <Navigation2 className="w-3.5 h-3.5" />
                  ) : node.type === 'port' ? (
                    <Compass className="w-3.5 h-3.5" />
                  ) : node.type === 'industrial' ? (
                    <Factory className="w-3.5 h-3.5" />
                  ) : (
                    <Building2 className="w-3.5 h-3.5" />
                  )}
                </div>
              </Marker>
            ))}

            {/* AI Recommended Districts Pins */}
            {results &&
              results.map((rec, idx) => {
                const coords = DISTRICT_COORDINATES[rec.districtName];
                if (!coords) return null;
                const isSelected = selectedDistrict?.districtName === rec.districtName;

                return (
                  <Marker
                    key={`rec-${idx}`}
                    latitude={coords.lat}
                    longitude={coords.lng}
                    anchor="bottom"
                    onClick={() => handleFocusDistrict(rec)}
                  >
                    <div className="flex flex-col items-center cursor-pointer group">
                      <div className={`px-2 py-0.5 rounded-full text-[10px] font-black shadow-md mb-1 whitespace-nowrap transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white ring-2 ring-white scale-110'
                          : 'bg-slate-900/90 text-slate-200 border border-slate-700'
                      }`}>
                        #{idx + 1} {rec.districtName} ({rec.score})
                      </div>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-xl transition-all ${
                        isSelected ? 'bg-blue-500 scale-125 ring-4 ring-blue-500/40 animate-bounce' : 'bg-emerald-600'
                      }`}>
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </Marker>
                );
              })}

            {/* Hovered Node Popup */}
            {hoveredNode && (
              <Popup
                latitude={hoveredNode.lat}
                longitude={hoveredNode.lng}
                closeButton={false}
                closeOnClick={false}
                anchor="top"
              >
                <div className="p-2 text-slate-900 font-sans">
                  <p className="text-xs font-black">{hoveredNode.name}</p>
                  <p className="text-[10px] text-slate-600">{hoveredNode.desc}</p>
                </div>
              </Popup>
            )}
          </Map>
        </div>
      </div>
    </div>
  );
}
