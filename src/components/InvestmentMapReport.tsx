import { LUWU_LOGO_BASE64 } from "@/lib/logoBase64.js";
import React, { useState, useEffect } from "react";
import * as turf from "@turf/turf";
import { useTranslation } from "react-i18next";
import { District, Investment, Village, SektorInvestasi, GeoJSONLayer } from "../types";
import { formatRupiah, formatNumber, formatRupiahSingkat } from "../lib/formatters";
import { SECTOR_COLORS } from "../lib/constants";
import { LuwuLogo } from "./LuwuLogo";
import { Compass, Shield, Printer, CheckSquare, Award, Clock, ZoomIn, ZoomOut, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { MapSnapshot } from "../types";

interface InvestmentMapReportProps {
  district: District;
  districts: District[];
  villages: Village[];
  investments: Investment[];
  mapSnapshotUrl: string | null;
  mapScaleData?: { widthInPx: number; text: string; mapCanvasWidthPx: number; mapCanvasHeightPx: number } | null;
  spatialLayers?: Record<string, GeoJSONLayer>;
  printScale?: string;
  onChangePrintScale?: (scale: string) => void;
  onRefreshMap?: () => void;
  onClose?: () => void;
  onDownload?: () => void;
  isDownloading?: boolean;
  snapshotGallery?: MapSnapshot[];
  selectedSnapshotId?: string | null;
  onSelectSnapshot?: (id: string) => void;
  onDeleteSnapshot?: (id: string) => void;
  proximityData?: any[];
  roiCalculations?: any;
  activeVillageData?: any[];
}

// DMS converter helper for formal cartography coordinates
function toDMS(val: number, isLng: boolean): string {
  const absolute = Math.abs(val);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
  const direction = isLng ? (val >= 0 ? "BT" : "BB") : (val >= 0 ? "LU" : "LS");
  return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
}

export default function InvestmentMapReport({
  district,
  districts,
  villages,
  investments,
  mapSnapshotUrl,
  mapScaleData,
  spatialLayers = {},
  printScale,
  onChangePrintScale,
  onRefreshMap,
  onClose,
  onDownload,
  isDownloading,
  snapshotGallery = [],
  selectedSnapshotId,
  onSelectSnapshot,
  onDeleteSnapshot,
  proximityData,
  roiCalculations,
  activeVillageData
}: InvestmentMapReportProps) {
  const { t } = useTranslation();

  if (!district) {
    return (
      <div className="fixed inset-0 z-[99999] bg-slate-900 flex items-center justify-center text-white font-sans p-6">
        <div className="text-center">
          <p className="text-lg font-bold mb-2">Memuat Laporan...</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Silakan tunggu, sistem sedang mempersiapkan data.</p>
        </div>
      </div>
    );
  }

  // Aggregate Data for Summary Stats (Page 3)
  const sectorStats = React.useMemo(() => {
    const stats: Record<string, { value: number; color: string }> = {};
    investments.forEach(inv => {
      if (!stats[inv.sector]) {
        // Find a default color or generate one if SECTOR_COLORS doesn't exist here
        stats[inv.sector] = { value: 0, color: '#334155' };
        
        // Some simple color mappings
        if (inv.sector.toLowerCase().includes('agro')) stats[inv.sector].color = '#059669'; // Emerald
        else if (inv.sector.toLowerCase().includes('pari')) stats[inv.sector].color = '#0284c7'; // Sky
        else if (inv.sector.toLowerCase().includes('ikan') || inv.sector.toLowerCase().includes('laut')) stats[inv.sector].color = '#2563eb'; // Blue
        else if (inv.sector.toLowerCase().includes('tambang')) stats[inv.sector].color = '#ca8a04'; // Yellow
        else if (inv.sector.toLowerCase().includes('infra')) stats[inv.sector].color = '#475569'; // Slate
      }
      stats[inv.sector].value += inv.investmentValue;
    });
    return Object.keys(stats).map(name => ({ name, ...stats[name] }));
  }, [investments]);

  const villageStats = React.useMemo(() => {
    const stats: Record<string, number> = {};
    investments.forEach(inv => {
      let vName = 'Belum Dipetakan';
      const matched = villages.find(v => v.id === inv.villageId || v.name === inv.villageId);
      if (matched) {
        vName = matched.name;
      } else if (inv.villageId && inv.villageId !== "desa-default") {
        vName = inv.villageId;
      }
      if (!stats[vName]) stats[vName] = 0;
      stats[vName] += inv.investmentValue;
    });
    return Object.keys(stats)
      .map(name => ({ name, value: stats[name] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 villages
  }, [investments, villages]);
  const effectiveSnapshotUrl = snapshotGallery.find(s => s.id === selectedSnapshotId)?.url || mapSnapshotUrl;
  const [previewZoom, setPreviewZoom] = useState(1);

  // Auto-scale for mobile on mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1200) {
      // Calculate responsive scale to fit the 1240px container, with small padding
      const scale = (window.innerWidth - 32) / 1240;
      setPreviewZoom(scale > 0.1 ? scale : 0.1);
    }
  }, []);

  // Filter investments and villages specifically belonging to this district
  const districtInvestments = investments.filter((i) => i.districtId === district.id);
  const districtVillages = villages.filter((v) => v.districtId === district.id);

  // Financial aggregate calculation for specific district (Kalkulator ROI)
  const totalInvestmentValue = districtInvestments.reduce((sum, item) => sum + item.investmentValue, 0);
  const totalAreaHa = districtInvestments.reduce((sum, item) => sum + item.areaHa, 0);

  // Estimasi Finansial Kumulatif Kecamatan
  const totalCapex = totalInvestmentValue * 0.85; // Capex assumption 85%
  const totalOpex = totalInvestmentValue * 0.08;  // Opex annual assumption 8%
  const avgNpv = totalInvestmentValue * 1.34;      // NPV project multiplier
  const avgIrr = 18.5;                             // Average IRR percentage
  const avgPayback = 4.2;                          // Average payback in years

  let lng1 = 120.1;
  let lng2 = 120.2;
  let lng3 = 120.3;
  let lat1 = -3.1;
  let lat2 = -3.0;
  let lat3 = -2.9;

  try {
    if (district.geojson) {
      const activeGeoJson = typeof district.geojson === 'string' ? JSON.parse(district.geojson) : district.geojson;
      const bbox = turf.bbox(activeGeoJson);
      
      const minLng = bbox[0];
      const minLat = bbox[1];
      const maxLng = bbox[2];
      const maxLat = bbox[3];
      
      // Calculate 3 points across the bounding box
      lng1 = minLng + (maxLng - minLng) * 0.2;
      lng2 = minLng + (maxLng - minLng) * 0.5;
      lng3 = minLng + (maxLng - minLng) * 0.8;
      
      lat1 = minLat + (maxLat - minLat) * 0.2;
      lat2 = minLat + (maxLat - minLat) * 0.5;
      lat3 = minLat + (maxLat - minLat) * 0.8;
    }
  } catch (e) {
    undefined;
  }

  // Specific graticule line offsets for coordinates grid mapping (A4 margin styling)
  const xGrids = [
    { offset: "20%", label: toDMS(lng1, true), val: lng1 },
    { offset: "50%", label: toDMS(lng2, true), val: lng2 },
    { offset: "80%", label: toDMS(lng3, true), val: lng3 }
  ];

  const yGrids = [
    { offset: "80%", label: toDMS(lat1, false), val: lat1 }, // Bottom
    { offset: "50%", label: toDMS(lat2, false), val: lat2 }, // Middle
    { offset: "20%", label: toDMS(lat3, false), val: lat3 }  // Top
  ];

  // Proximity Calculation Helpers
  const getLogisticsForPoint = (lat: number, lng: number) => {
    const latDiffPort = Math.abs(lat - (-3.3860616));
    const lngDiffPort = Math.abs(lng - 120.3979346);
    const distToPort = Math.sqrt(latDiffPort * latDiffPort + lngDiffPort * lngDiffPort) * 111;

    const latDiffAirport = Math.abs(lat - (-3.0863384));
    const lngDiffAirport = Math.abs(lng - 120.2413232);
    const distToAirport = Math.sqrt(latDiffAirport * latDiffAirport + lngDiffAirport * lngDiffAirport) * 111;

    const distToNationalRoad = Math.abs(lng - 120.322) * 111;

    return {
      distToPort: parseFloat(distToPort.toFixed(1)),
      distToAirport: parseFloat(distToAirport.toFixed(1)),
      distToRoad: parseFloat(distToNationalRoad.toFixed(1))
    };
  };

  // 1. Try to fetch from proximityData prop if available
  let propPortDist: number | null = null;
  let propRoadDist: number | null = null;

  if (proximityData && proximityData.length > 0) {
    const portItem = proximityData.find(p => 
      (p.type || "").toLowerCase().includes("port") || 
      (p.type || "").toLowerCase().includes("pelabuhan") ||
      (p.name || "").toLowerCase().includes("pelabuhan")
    );
    if (portItem && typeof portItem.distance === "number") {
      propPortDist = portItem.distance;
    }

    const roadItem = proximityData.find(p => 
      (p.type || "").toLowerCase().includes("road") || 
      (p.type || "").toLowerCase().includes("jalan") ||
      (p.name || "").toLowerCase().includes("jalan")
    );
    if (roadItem && typeof roadItem.distance === "number") {
      propRoadDist = roadItem.distance;
    }
  }

  // 2. Resolve final averages
  const avgPortDist = propPortDist !== null 
    ? propPortDist.toFixed(1)
    : districtInvestments.length > 0 
      ? (districtInvestments.reduce((sum, i) => {
          const sync = i.spatialSync || (i as any).spatial_sync;
          return sum + (sync?.distToPortKm ?? sync?.nearestPortKm ?? getLogisticsForPoint(i.latitude, i.longitude).distToPort);
        }, 0) / districtInvestments.length).toFixed(1)
      : getLogisticsForPoint(district.coordinates?.[0] || -3.0, district.coordinates?.[1] || 120.2).distToPort.toFixed(1);

  const avgRoadDist = propRoadDist !== null
    ? propRoadDist.toFixed(1)
    : districtInvestments.length > 0
      ? (districtInvestments.reduce((sum, i) => {
          const sync = i.spatialSync || (i as any).spatial_sync;
          return sum + (sync?.distToRoadKm ?? sync?.nearestRoadKm ?? getLogisticsForPoint(i.latitude, i.longitude).distToRoad);
        }, 0) / districtInvestments.length).toFixed(1)
      : getLogisticsForPoint(district.coordinates?.[0] || -3.0, district.coordinates?.[1] || 120.2).distToRoad.toFixed(1);

  // National flag or Luwu crest placeholder
  const renderCrest = (isMainKop = false) => (
    <div className={`relative ${isMainKop ? 'w-10 h-10' : 'w-7 h-7'} flex items-center justify-center shrink-0`}>
      <img src={LUWU_LOGO_BASE64} style={{ width: isMainKop ? "40px" : "28px", height: isMainKop ? "40px" : "28px" }} className="object-contain" alt="Logo Luwu" />
    </div>
  );

  return (
    <div 
      className="bg-slate-900/90 p-2 sm:p-6 overflow-auto w-full h-[100vh] flex flex-col justify-start items-center relative"
      style={{ display: "flex" }}
      id="investment-report-outer-wrapper"
    >
      {/* Mobile-Friendly Zoom Controls Overlay */}
      <div className="sticky top-4 z-[300] bg-slate-800/80 backdrop-blur-md border border-slate-600 rounded-full px-4 py-2 flex items-center justify-center gap-4 mb-4 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
        <span className="text-slate-300 text-xs font-bold font-mono">ZOOM: {Math.round(previewZoom * 100)}%</span>
        <div className="flex items-center gap-1">
          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); setPreviewZoom(z => Math.max(0.1, z - 0.1)); }}
            className="p-2 rounded-full hover:bg-slate-700 active:bg-slate-600 text-slate-300 transition-colors"
          >
            <ZoomOut size={16} />
          </button>
          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); setPreviewZoom(z => Math.min(2.5, z + 0.1)); }}
            className="p-2 rounded-full hover:bg-slate-700 active:bg-slate-600 text-slate-300 transition-colors"
          >
            <ZoomIn size={16} />
          </button>
        </div>
      </div>

      <div 
        className="flex flex-col items-center gap-8 origin-top"
        style={{ 
          transform: isDownloading ? 'scale(1)' : `scale(${previewZoom})`, 
          transition: isDownloading ? 'none' : 'transform 200ms ease-out',
          paddingBottom: '150px' 
        }}
      >
        <div className="bg-emerald-50 border gap-6 border-emerald-200 rounded-2xl p-4 w-[1171px] max-w-[1171px] text-xs text-emerald-800 flex justify-between items-center shadow-2xl">
          <div className="flex gap-4 items-center">
            <div className="bg-emerald-100 p-3 flex rounded-xl border border-emerald-300">
            <Printer className="h-6 w-6 text-emerald-700" />
          </div>
          <div>
            <span className="font-bold text-sm text-emerald-900 tracking-wide">MAP COMPOSER: PREVIEW KARTOGRAFI PDF</span>
            <p className="mt-0.5 max-w-xl text-[#064e3b]">Kanvas di bawah ini merepresentasikan layout final A4 Landscape persis seperti yang akan dicetak. Anda sedang berada dalam mode Print Layout Spasial interaktif.</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {printScale && onChangePrintScale && onRefreshMap && (
            <div className="flex items-center gap-2 mr-2 border-r border-emerald-200 pr-4">
              <label className="text-[10px] font-bold text-emerald-900">Skala Peta (PDF):</label>
              <select
                value={printScale}
                onChange={(e) => {
                  onChangePrintScale(e.target.value);
                  setTimeout(() => {
                    onRefreshMap();
                  }, 100);
                }}
                className="bg-white border border-emerald-300 text-emerald-900 text-xs rounded-lg px-2 py-1.5 outline-none font-sans cursor-pointer focus:ring-2 focus:ring-emerald-500/50 min-w-[150px]"
              >
                <option value="auto">Otomatis Terpusat</option>
                <option value="50000">1 : 50.000</option>
                <option value="100000">1 : 100.000</option>
                <option value="150000">1 : 150.000</option>
                <option value="250000">1 : 250.000</option>
                <option value="500000">1 : 500.000</option>
                <option value="1250000">1 : 1.250.000</option>
                <option value="1500000">1 : 1.500.000</option>
              </select>
            </div>
          )}
          {onClose && (
            <button 
              onClick={onClose}
              className="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-xl text-slate-800 font-bold transition flex items-center gap-2 border border-slate-300"
            >
              Tutup Preview
            </button>
          )}
          {onDownload && (
             <button 
               onClick={onDownload}
               disabled={isDownloading || !effectiveSnapshotUrl}
               className="bg-[#059669] hover:bg-emerald-500 disabled:opacity-50 px-6 py-2 rounded-xl text-white font-bold transition flex items-center gap-2 border border-emerald-500 shadow shadow-emerald-600 focus:ring-4 focus:ring-emerald-500/20 active:scale-95"
             >
               {isDownloading ? "Menyusun Berkas PDF..." : "Unduh PDF Dokumen (A4 Landscape)"}
             </button>
          )}
        </div>
      </div>

      {snapshotGallery.length > 0 && (
        <div className="w-full max-w-[1240px] mb-4 bg-white/80 backdrop-blur border border-emerald-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-900 font-sans flex items-center gap-2">
              <Compass className="h-4 w-4 text-emerald-600" />
              {t('Gallery Snapshot Peta', 'Galeri Snapshot Peta')}
            </h3>
            <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
              {snapshotGallery.length}/8 Maksimal
            </span>
          </div>
          <div className="flex overflow-x-auto gap-4 snap-x pb-2">
            <AnimatePresence>
              {snapshotGallery.map((snap) => {
                const isSelected = selectedSnapshotId === snap.id;
                return (
                  <motion.div
                    key={snap.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`relative snap-center shrink-0 rounded-xl overflow-hidden cursor-pointer transition-all border-2 ${
                      isSelected ? 'border-emerald-500 shadow-md shadow-emerald-500/20 ring-4 ring-emerald-500/10' : 'border-slate-200 hover:border-emerald-300 hover:shadow-sm'
                    }`}
                    style={{ width: "200px", height: "120px" }}
                    onClick={() => onSelectSnapshot?.(snap.id)}
                  >
                    <img src={snap.url} alt="Snapshot" className="w-full h-full object-cover" />
                    
                    {isSelected && (
                      <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow">
                        {t('Terpilih', 'Terpilih')}
                      </div>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSnapshot?.(snap.id);
                      }}
                      className="absolute top-2 right-2 bg-slate-900/60 hover:bg-red-500/90 text-white p-1.5 rounded-lg backdrop-blur transition-colors"
                      title={t('Hapus Snapshot', 'Hapus Snapshot')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6">
                      <div className="text-[9px] text-white font-mono opacity-80">
                        {new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
      
      <div id="print-map-container" className="flex flex-col gap-8 bg-slate-200 p-8 pt-4 select-none rounded-[32px] shadow-2xl border border-white max-w-[1240px]" style={{ width: "1235px" }}>
        
        {/* =========================================================================
            PETA HALAMAN 1: LAYOUT KARTOGRAFI UTAMA (75% MAP - 25% VERTICAL PANEL)
            ========================================================================= */}
        <div 
          id="print-page-1"
          className="bg-white border-2 border-black p-4 flex flex-col justify-between" 
          style={{ width: "1123px", height: "794px", boxSizing: "border-box", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
        >
          {/* Main Printable Grid */}
          <div className="flex h-[710px] w-full border-2 border-black relative" style={{ boxSizing: "border-box" }}>
            
            {/* KOLOM KIRI (FLEX-1): KANVAS PETA UTAMA DENGAN GRID KOORDINAT */}
            <div className="flex-1 h-full relative overflow-hidden bg-white flex flex-col items-center justify-center border-r-2 border-black">
              {effectiveSnapshotUrl ? (
                <img 
                  src={effectiveSnapshotUrl} 
                  className="w-full h-full object-contain" 
                  alt={`Peta Wilayah Kecamatan ${district.name}`}
                  onError={(e) => {
                    console.warn("Map snapshot onError fired, fallbacking to mapSnapshotUrl...");
                    if (mapSnapshotUrl && e.currentTarget.src !== mapSnapshotUrl) {
                      e.currentTarget.src = mapSnapshotUrl;
                    }
                  }}
                />
              ) : (
                <div className="text-slate-600 dark:text-slate-400 text-xs font-mono flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  Menyegarkan Kanvas Peta (Mohon Tunggu)...
                </div>
              )}

              {/* GRID / GRATICULE KOORDINAT MERENCANAKAN DETAIL FORMAL */}
              <div className="absolute inset-5 pointer-events-none border-2 border-slate-900 box-border">
                {/* Vertical Graticules Line */}
                {xGrids.map((g, idx) => (
                  <div key={`x-${idx}`} className="absolute top-0 bottom-0 border-l border-solid border-slate-400/40 flex flex-col justify-between" style={{ left: g.offset }}>
                    {/* Top coordinate tag */}
                    <span className="text-[8px] font-mono bg-white px-1.5 py-0.5 text-black font-bold -translate-y-[calc(100%+2px)] -translate-x-1/2 border border-black/80 rounded-sm drop-shadow-sm mt-[2px]">
                      {g.label}
                    </span>
                    {/* Bottom coordinate tag */}
                    <span className="text-[8px] font-mono bg-white px-1.5 py-0.5 text-black font-bold translate-y-[calc(100%+2px)] -translate-x-1/2 border border-black/80 rounded-sm drop-shadow-sm mb-[2px]">
                      {g.label}
                    </span>
                  </div>
                ))}

                {/* Horizontal Graticules Line */}
                {yGrids.map((g, idx) => (
                  <div key={`y-${idx}`} className="absolute left-0 right-0 border-t border-solid border-slate-400/40 flex justify-between items-center" style={{ top: g.offset }}>
                    {/* Left coordinate tag */}
                    <span className="text-[8px] font-mono bg-white px-1.5 py-0.5 text-black font-bold -translate-x-[calc(100%+2px)] -translate-y-1/2 border border-black/80 rounded-sm drop-shadow-sm ml-[2px]">
                      {g.label}
                    </span>
                    {/* Right coordinate tag */}
                    <span className="text-[8px] font-mono bg-white px-1.5 py-0.5 text-black font-bold translate-x-[calc(100%+2px)] -translate-y-1/2 border border-black/80 rounded-sm drop-shadow-sm mr-[2px]">
                      {g.label}
                    </span>
                  </div>
                ))}

                {/* Dynamic scale representation displayed within map canvas */}
                <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1.5 border border-black rounded shadow-md flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[8px] font-mono font-bold text-black uppercase tracking-wider">Tepi Koordinat Utama</span>
                    <span className="text-[7px] font-mono text-slate-550">WGS 84 / Geographic Coordinates</span>
                  </div>
                </div>
              </div>
            </div>

            {/* KOLOM KANAN (180px): PANEL INFORMASI KARTOGRAFI VERTIKAL */}
            <div className="w-[180px] min-w-[180px] max-w-[180px] h-full flex flex-col justify-between bg-white pl-2 pr-2 pt-2 pb-2 overflow-hidden" style={{ boxSizing: "border-box" }}>
              
              <div className="space-y-1 flex-1 flex flex-col min-h-0">
                {/* 1. KOP DINAS */}
                <div className="flex items-center gap-1.5 border-b-2 border-black pb-1.5 flex-shrink-0">
                  <div className="flex-shrink-0">
                    {renderCrest()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[7.5px] font-black font-sans text-[#000000] leading-tight text-center uppercase tracking-wider">
                      Pemerintah Kabupaten Luwu
                    </span>
                    <span className="text-[6px] font-black text-[#1f2937] leading-tight text-center uppercase">
                      Dinas PMPTSP
                    </span>
                    <span className="text-[5px] text-[#1f2937] font-mono font-bold leading-none text-center">
                      Jl. Jenderal Sudirman No. 1, Belopa
                    </span>
                  </div>
                </div>

                {/* 2. JUDUL PETA */}
                <div className="border-b border-black pb-1 text-center flex-shrink-0">
                  <h4 className="text-[10px] font-black tracking-wide uppercase text-[#000000] leading-tight">
                    Peta Potensi Investasi
                  </h4>
                  <h3 className="text-[11px] font-black tracking-widest uppercase text-[#064e3b] leading-tight font-bold">
                    Kecamatan {district.name}
                  </h3>
                  <span className="text-[6px] font-mono font-bold text-[#1f2937] block uppercase mt-0.5">
                    Kabupaten Luwu, Sulawesi Selatan
                  </span>
                </div>

                {/* 3. LEGENDA DINAMIS */}
                <div className="border-b border-black pb-1 flex-1 flex flex-col min-h-0 overflow-visible">
                  <span className="text-[8px] font-mono font-black uppercase tracking-widest text-[#000000] block mb-1 flex-shrink-0">
                    Legenda Spasial
                  </span>
                  <div className="space-y-0.5 text-[#000000] text-[8px] font-sans flex-1 overflow-visible">
                    <span className="text-[7.5px] font-black text-[#000000] font-mono block mb-1">Sektor Potensi Investasi</span>
                    <div className="flex flex-col gap-1 mb-2">
                      {Object.values(SektorInvestasi).map((sect) => (
                        <div key={sect} className="flex items-start gap-1.5 pl-1 mb-2">
                          <div 
                            className="w-3 h-2 rounded border border-black/40 flex-shrink-0 mt-0.5" 
                            style={{ backgroundColor: SECTOR_COLORS[sect] || "#3b4155" }}
                          />
                          <span className="text-[#000000] font-bold text-[9px] leading-tight whitespace-normal break-words">Potensi Sektor {sect}</span>
                        </div>
                      ))}
                    </div>

                    {/* Spatial GIS Overlay Active Layers Legend */}
                    <div className="border-t border-black/20 mt-1 pt-1.5 space-y-1">
                      <span className="text-[7.5px] font-black text-[#000000] font-mono block mb-1">Overlay Potensi Investasi</span>
                      
                      <div className="flex flex-col gap-2">
                        {Object.values(spatialLayers).filter(l => l.isActive).map(layer => {
                          const isLine = layer.id === "layer_jalan" || (layer.geojson && (
                            (layer.geojson.type === "LineString" || layer.geojson.type === "MultiLineString") || 
                            (layer.geojson.type === "FeatureCollection" && layer.geojson.features?.[0]?.geometry?.type?.includes("LineString")) ||
                            (layer.geojson.type === "Feature" && layer.geojson.geometry?.type?.includes("LineString"))
                          ));
                          return (
                            <div key={layer.id} className="flex items-start gap-1.5 pl-1 mb-2">
                              {isLine ? (
                                <div className="w-2.5 h-[1.5px] mt-1.5 flex-shrink-0 animate-pulse" style={{ backgroundColor: layer.color || "#000000" }} />
                              ) : (
                                <div className="w-2.5 h-1.5 mt-0.5 rounded-sm border border-black/40 flex-shrink-0" style={{ backgroundColor: layer.color || "#000000" }} />
                              )}
                              <span className="text-[#000000] font-bold text-[9px] leading-tight whitespace-normal break-words">{layer.name}</span>
                            </div>
                          );
                        })}
                        
                        {/* Always visible administrative boundaries of the focal district map area */}
                        <div className="flex items-start gap-1.5 pl-1 mb-2">
                          <div className="w-2.5 h-[1px] mt-1.5 border-t-2 border-solid flex-shrink-0" style={{ borderColor: "#1D4ED8" }} />
                          <span className="text-[#000000] font-bold text-[9px] leading-tight whitespace-normal break-words">Batas Administrasi Kecamatan</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* CSS Bar Chart for Sectors */}
                    {investments.length > 0 && (
                      <div className="mt-1 pt-1 border-t border-black/20 flex-shrink-0">
                        <span className="text-[6.5px] font-black text-[#1f2937] font-mono block mb-0.5 uppercase text-center">Distribusi Sektor</span>
                        <div className="flex h-[28px] items-end gap-0.5 w-full justify-between mt-0.5 px-0.5">
                          {Object.values(SektorInvestasi).map(sect => {
                            const count = investments.filter(i => i.sector === sect).length;
                            const maxCount = Math.max(1, ...Object.values(SektorInvestasi).map(s => investments.filter(i => i.sector === s).length));
                            const height = maxCount === 0 ? 0 : (count / maxCount) * 100;
                            if (maxCount === 0) return null;
                            
                            return (
                              <div key={sect} className="flex-1 flex flex-col justify-end items-center gap-[1px] group">
                                <span className="text-[4px] font-bold text-[#000000] leading-none mb-[1px]">{count}</span>
                                <div className="w-full rounded-t-[1px] border border-black/40 border-b-0" style={{ height: `${height}%`, backgroundColor: SECTOR_COLORS[sect] || "#9ca3af" }}></div>
                                <span style={{fontSize: '4px'}} className="font-extrabold text-[#000000] uppercase leading-none truncate w-[130%] text-center -translate-x-[15%]">{sect.substring(0,3)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-1 flex flex-col gap-1 flex-shrink-0">
                {/* 4. ORNAMEN KARTOGRAFI (North Arrow & Scale Line) */}
                <div className="border-b border-black pb-1 flex items-center justify-between">
                  <div className="flex flex-col items-center gap-0.5 w-1/2 border-r border-black/20 pr-1">
                    <span className="text-[5px] font-mono text-[#1f2937] uppercase tracking-widest block font-black">
                      Arah Utara
                    </span>
                    <div className="relative w-6 h-6 flex items-center justify-center border border-black/30 rounded-full bg-slate-50">
                      <Compass className="w-4 h-4 text-black" />
                      <span className="absolute top-[1px] text-[5px] font-black text-red-700 -translate-y-1 font-mono">U</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 w-1/2 pl-2">
                    <span className="text-[6px] font-mono text-[#1f2937] uppercase tracking-widest block font-black">
                      Skala Cetak
                    </span>
                    <span className="text-[7.5px] font-black text-[#000000] font-mono leading-none">
                      {printScale && printScale !== 'auto' ? `Skala 1 : ${parseInt(printScale).toLocaleString('id-ID')}` : (mapScaleData ? "Skala Batang Peta" : "Skala 1 : 150.000")}
                    </span>
                    {/* Scale bar graphic */}
                    <div className="flex flex-col gap-0.5 mt-0.5 w-full">
                      {mapScaleData ? (
                        <>
                          <div className="flex justify-between text-[6px] font-mono font-black leading-none text-[#1f2937]">
                             <span>0</span>
                             <span>{mapScaleData.text.replace(/km|m/i, "").trim()}</span>
                          </div>
                          <div 
                            className="flex items-center h-[5px] border-x-[1.5px] border-b-[1.5px] border-black bg-white/90"
                            style={{
                               width: `${Math.max(Math.min(mapScaleData.widthInPx * Math.max(939 / mapScaleData.mapCanvasWidthPx, 706 / mapScaleData.mapCanvasHeightPx), 80), 30)}px`
                            }}
                          >
                            <div className="w-1/2 h-full bg-black border-r border-black"></div>
                            <div className="w-1/2 h-full bg-white"></div>
                          </div>
                          <div className="text-[5px] font-mono font-bold leading-none text-[#1f2937] text-right mt-0.5">
                            {mapScaleData.text.includes("km") ? "Kilometer" : "Meter"}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between text-[5px] font-mono font-black leading-none text-[#1f2937] px-0.5">
                             <span>0</span>
                             <span>2.5</span>
                             <span>5 KM</span>
                          </div>
                          <div className="flex items-center h-[5px] w-full border-x-[1.5px] border-b-[1.5px] border-black bg-white/90 shadow-sm relative">
                            {/* tick marks */}
                            <div className="absolute inset-y-0 left-1/4 border-r border-black"></div>
                            <div className="absolute inset-y-0 left-1/2 border-r border-black"></div>
                            <div className="absolute inset-y-0 left-3/4 border-r border-black"></div>
                            
                            <div className="w-1/4 h-full bg-black"></div>
                            <div className="w-1/4 h-full bg-white"></div>
                            <div className="w-1/4 h-full bg-black"></div>
                            <div className="w-1/4 h-full bg-white"></div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 5. PENGESAHAN DOKUMEN / TANDA TANGAN */}
                <div className="text-center">
                  <span className="text-[5.5px] text-[#1f2937] uppercase font-mono font-bold block leading-none">
                    Cetak Validitas Spasial Nasional - DPMPTSP
                  </span>
                  <span className="text-[6px] font-black text-[#000000] block mt-0.5 leading-none">
                    Belopa, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                  <span className="text-[6.5px] text-[#000000] font-black block leading-none mt-0.5">
                    Kepala Dinas DPMPTSP Kab. Luwu
                  </span>
                  
                  <div className="h-8 my-0.5 justify-center flex items-center relative">
                    {/* Decorative verified stamp */}
                    <div className="absolute right-2 border-2 border-emerald-700/65 text-emerald-800 font-mono text-[6px] border-double rounded py-0.5 px-1 font-black transform rotate-12 select-none pointer-events-none leading-none tracking-tighter">
                      DPMPTSP LUWU
                      <br />
                      VERIFIED GIS
                    </div>
                    <div className="w-16 h-px border-b border-dashed border-black/30"></div>
                  </div>
                  
                  <span className="text-[6.5px] font-black text-[#000000] block underline leading-none">
                    KASNAR, SE
                  </span>
                  <span className="text-[5px] text-[#000000] font-mono font-bold block leading-none mt-0.5">
                    NIP. 19700405 200212 1 007
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Footer margin display */}
          <div className="flex justify-between items-center text-[7.5px] font-mono text-[#1f2937] mt-2.5 px-1 font-bold">
            <span className="font-extrabold text-[#000000]">SMART INVESTASI GIS PLATFORM — KABUPATEN LUWU 2026</span>
            <div className="flex gap-4">
              <span>Projection: UTM Zone 50S (WGS84)</span>
              <span>Halaman 1 dari 2 (Peta Kartografis)</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            HALAMAN 2: LAPORAN DATA ANALISIS POTENSI, INFRASTRUKTUR & ROI CALCULATOR
            ========================================================================= */}
        <div 
          id="print-page-2"
          className="bg-white border-2 border-black p-6 flex flex-col justify-between" 
          style={{ width: "1123px", height: "794px", boxSizing: "border-box", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
        >
          {/* Header Kop Resmi (Full Width) */}
          <div className="flex items-center gap-4 border-b-4 border-black pb-3 mb-4">
            <div className="flex-shrink-0">
              {renderCrest(true)}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-black font-sans text-[#000000] leading-tight uppercase tracking-wider">
                Pemerintah Kabupaten Luwu
              </span>
              <span className="text-xs font-black text-[#1f2937] leading-tight uppercase tracking-wide">
                Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu (DPMPTSP)
              </span>
              <span className="text-[9px] text-[#1f2937] font-mono font-bold leading-none">
                Pusat Perkantoran Pemerintah Kabupaten Luwu, Jl. Jenderal Sudirman No. 1, Belopa, Sulawesi Selatan
              </span>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center mb-4">
            <h3 className="text-sm font-black tracking-wider uppercase text-black leading-tight">
              Laporan Analisis Investasi Spasial & Kelayakan Finansial Regional
            </h3>
            <h4 className="text-xs font-extrabold tracking-widest uppercase text-emerald-800 leading-tight">
              Wilayah Administrasi Kecamatan {district.name}
            </h4>
            <div className="w-24 h-0.5 bg-emerald-600 mx-auto mt-1.5 rounded"></div>
          </div>

          {/* Body Content 2-Column */}
          <div className="grid grid-cols-2 gap-6 flex-grow overflow-visible">
            
            {/* COLUMN LEFT: ADMINISTRASI, POTENSI DESA, & TATA RUANG (FASE-2A) */}
            <div className="space-y-4 pr-3 border-r border-slate-250 flex flex-col justify-between">
              <div>
                <h5 className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1 mb-2.5 flex items-center gap-1.5">
                  <CheckSquare className="h-3 w-3 text-emerald-700" />
                  1. Profil Wilayah & Potensi Lahan Sektoral
                </h5>
                <p className="text-[9.5px] text-[#1f2937] leading-relaxed font-sans font-medium mb-3 text-justify">
                  Kecamatan <strong>{district.name}</strong> memiliki luas wilayah administratif tercatat sekitar <strong>{formatNumber(district.areaHa)} Ha</strong> dengan jumlah <strong>{districtVillages.length || district.villageCount} desa/kelurahan</strong> terverifikasi. Sektor unggulan utama di wilayah ini meliputi: <span className="font-bold text-[#000000]">{(district.primarySectors || []).join(", ")}</span>.
                </p>

                {/* Sub-table: Desa & Potensi Status (Fase-2A) */}
                <span className="text-[8px] font-mono font-black text-[#000000] uppercase tracking-widest block mb-1">
                  Distribusi Potensi Investasi Desa Teraktif
                </span>
                <div className="border border-slate-200 rounded-xl shadow-sm">
                  <table className="w-full text-[8.5px] text-left font-sans">
                    <thead className="bg-slate-100 text-[#000000] font-black uppercase text-[7px] border-b border-black font-mono">
                      <tr>
                        <th className="p-2">Nama Desa / Kel.</th>
                        <th className="p-2">Luas Wilayah</th>
                        <th className="p-2">Status Tata Ruang (RTRW)</th>
                        <th className="p-2">Komoditas Pokok / Potensi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/10 text-[#000000] bg-white">
                      {(() => {
                        const finalVillages = (activeVillageData && activeVillageData.length > 0) 
                          ? activeVillageData 
                          : districtVillages;
                        
                        if (finalVillages.length === 0) {
                          return (
                            <tr>
                              <td colSpan={4} className="p-4 text-center text-slate-600 dark:text-slate-400 font-mono italic">
                                Belum ada titik investasi spesifik terpilih
                              </td>
                            </tr>
                          );
                        }

                        return finalVillages.slice(0, 5).map((v, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-extrabold text-[#000000]">{v.name}</td>
                            <td className="p-2 font-mono font-bold">{formatNumber(v.areaHa)} Ha</td>
                            <td className="p-2">
                              <span className="bg-emerald-50 text-emerald-900 px-1.5 py-0.5 rounded-full border border-emerald-250 font-black text-[7.5px]">
                                {v.zoneStatus || "Kawasan Budidaya"}
                              </span>
                            </td>
                            <td className="p-2 text-[#1f2937] font-black truncate max-w-[120px]">
                              {v.investmentPotential || ((v.commodities && v.commodities.length > 0) ? v.commodities.join(", ") : "-")}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Legalitas RTRW / RDTR Status */}
              <div className="bg-slate-50 border border-black/20 rounded-lg p-2.5 text-[8.5px] text-[#000000] space-y-1 font-bold">
                <span className="font-black text-[#000000] uppercase font-mono text-[7.5px] tracking-wider block">
                  Status Keselarasan Tata Ruang Kabupaten Luwu
                </span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                    <span>Zona Industri (RTRW): <strong className="text-emerald-900">SESUAI (Aman)</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                    <span>Kesesuaian RDTR: <strong className="text-emerald-900">PRODUKTIF</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-600"></div>
                    <span>Sempadan LSD: <strong className="text-amber-900 font-bold">DIPROTEKSI (Sawah)</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                    <span>Kondisi Lingkungan: <strong className="text-emerald-900">LAYAK AMDAL</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN RIGHT: INTEGRATIVE LOGISTICS AND FINANCIALS (FASE-2A / 2B) */}
            <div className="space-y-4 pl-3 flex flex-col justify-between">
              <div>
                <h5 className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1 mb-2.5 flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-emerald-700" />
                  2. Analisis Kesiapan Logistik & Kalkulator ROI Investasi
                </h5>

                {/* Sub-table: Jarak Infrastruktur Logistik */}
                <span className="text-[8px] font-mono font-black text-[#000000] uppercase tracking-widest block mb-1">
                  Kesiapan Jaringan Logistik & Aksesibilitas
                </span>
                <div className="grid grid-cols-3 gap-2 mb-3.5">
                  <div className="bg-slate-50 border border-black/10 rounded-xl p-2 text-center text-[#000000] font-bold">
                    <span className="text-[7px] text-[#1f2937] uppercase font-black tracking-wider block font-mono">Jarak ke Pelabuhan</span>
                    <strong className="text-xs text-[#000000] font-mono block mt-1">{avgPortDist} km</strong>
                    <span className="text-[6.5px] text-emerald-900 font-bold block uppercase font-sans">Lagaligo / Bua Port</span>
                  </div>
                  <div className="bg-slate-50 border border-black/10 rounded-xl p-2 text-center text-[#000000] font-bold">
                    <span className="text-[7px] text-[#1f2937] uppercase font-black tracking-wider block font-mono">Jalan Nasional</span>
                    <strong className="text-xs text-[#000000] font-mono block mt-1">{avgRoadDist} km</strong>
                    <span className="text-[6.5px] text-emerald-900 font-bold block uppercase font-sans">Arteri Trans-Luwu</span>
                  </div>
                  <div className="bg-slate-50 border border-black/10 rounded-xl p-2 text-center text-[#000000] font-bold">
                    <span className="text-[7px] text-[#1f2937] uppercase font-black tracking-wider block font-mono">Skor Infrastruktur</span>
                    <strong className="text-xs text-emerald-900 font-mono block mt-1">{district.infrastructureScore}/10</strong>
                    <span className="text-[6.5px] text-emerald-900 font-bold block uppercase font-sans">Kriteria DPMPTSP</span>
                  </div>
                </div>

                {/* ROI Kumulatif Calculator (Fase-2A) */}
                <span className="text-[8px] font-mono font-black text-[#000000] uppercase tracking-widest block mb-1">
                  Kalkulator ROI & Evaluasi Finansial Kumulatif
                </span>
                <div className="border border-black/20 rounded-xl shadow-sm bg-white text-[8.5px]">
                  <table className="w-full text-left font-sans">
                    <thead className="bg-slate-100 font-mono text-[7px] uppercase font-black text-black border-b border-black/30">
                      <tr>
                        <th className="p-2">Metrik Keuangan Regional</th>
                        <th className="p-2">Estimasi Nilai</th>
                        <th className="p-2">Ambang Batas Kelayakan</th>
                        <th className="p-2">Evaluasi Hasil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/10 font-sans text-[#000000]">
                      {(() => {
                        let finalRoi = roiCalculations;
                        if (!finalRoi && totalInvestmentValue > 0) {
                          finalRoi = {
                            capex: totalCapex,
                            opex: totalOpex,
                            npv: avgNpv,
                            irr: avgIrr,
                            payback: avgPayback
                          };
                        }
                        
                        if (!finalRoi) {
                          return (
                            <tr>
                              <td colSpan={4} className="p-4 text-center font-bold text-slate-600 dark:text-slate-400 italic">
                                Simulasi finansial belum dijalankan
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <>
                            <tr>
                              <td className="p-2 font-bold text-black">Total Nilai Investasi (CAPEX)</td>
                              <td className="p-2 font-mono text-black font-black">{formatRupiah(finalRoi.capex || finalRoi.capital || 0)}</td>
                              <td className="p-2 font-mono text-[#1f2937] font-bold">&gt; Rp 10 Miliar</td>
                              <td className="p-2">
                                <span className="bg-emerald-100 text-emerald-950 font-black px-1 rounded text-[7.5px] border border-emerald-500">
                                  {(finalRoi.capex || finalRoi.capital || 0) >= 10e9 ? "SANGAT TINGGI" : "STANDAR"}
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td className="p-2 font-bold text-black">Kalkulasi OPEX Tahunan</td>
                              <td className="p-2 font-mono text-black font-black">{formatRupiah(finalRoi.opex || 0)} / Thn</td>
                              <td className="p-2 font-mono text-[#1f2937] font-bold">-</td>
                              <td className="p-2 text-[#1f2937] font-bold">Biaya Utilitas & Operasional</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-bold text-black">Proyeksi NPV (10 Tahun @ 12%)</td>
                              <td className="p-2 font-mono text-emerald-900 font-black">{formatRupiah(finalRoi.npv || 0)}</td>
                              <td className="p-2 font-mono text-[#1f2937] font-bold">&gt; Rp 0 (Positif)</td>
                              <td className="p-2">
                                <span className="text-emerald-900 font-extrabold text-[7.5px]">
                                  {(finalRoi.npv || 0) > 0 ? "SANGAT LAYAK" : "TIDAK LAYAK"}
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td className="p-2 font-bold text-black">Internal Rate of Return (IRR)</td>
                              <td className="p-2 font-mono text-emerald-900 font-black">
                                {typeof finalRoi.irr === "number" ? finalRoi.irr.toFixed(1) : "0"}%
                              </td>
                              <td className="p-2 font-mono text-[#1f2937] font-bold">&gt; 10.0% (Suku Bunga)</td>
                              <td className="p-2">
                                <span className="bg-emerald-100 text-emerald-950 font-black px-1 rounded text-[7.5px] border border-emerald-500">
                                  {(finalRoi.irr || 0) >= 10 ? "OPTIMAL" : "RENDAH"}
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td className="p-2 font-bold text-black">Payback Period Efektif (BEP)</td>
                              <td className="p-2 font-mono text-black font-black">
                                {typeof finalRoi.payback === "number" ? finalRoi.payback.toFixed(1) : typeof finalRoi.bep === "number" ? finalRoi.bep.toFixed(1) : "0"} Tahun
                              </td>
                              <td className="p-2 font-mono text-[#1f2937] font-bold">&lt; 7.0 Tahun</td>
                              <td className="p-2">
                                <span className="text-emerald-900 font-black text-[7.5px]">
                                  {(finalRoi.payback || finalRoi.bep || 0) <= 7 ? "PENGEMBALIAN CEPAT" : "PENGEMBALIAN LAMBAT"}
                                </span>
                              </td>
                            </tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Catatan Dinas */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-2.5 text-[8.5px] text-black font-sans italic font-medium">
                * Keterangan Dinas Pembina: Evaluasi ROI menggunakan parameter biaya infrastruktur regional trans-Luwu per 2026. Data komitmen investasi didasarkan pada permohonan PKPM terdaftar di DPMPTSP Kabupaten Luwu.
              </div>
            </div>

          </div>

          {/* Validation signatures and seal at bottom of page 2 */}
          <div className="border-t border-black pt-3 flex justify-between items-end mt-4">
            <div className="flex items-center gap-2">
              <Award className="h-6 w-6 text-emerald-800" />
              <div className="flex flex-col text-left">
                <span className="text-[7px] font-black text-[#1f2937] font-mono uppercase tracking-widest leading-none">
                  Sistem Informasi Spasial Luwu
                </span>
                <span className="text-[8px] font-black text-[#000000] leading-tight">
                  Dokumen ini SAH sebagai Laporan Kinerja Spasial Investasi Regional
                </span>
              </div>
            </div>

            <div className="text-center w-64 pr-2" style={{ boxSizing: "border-box" }}>
              <span className="text-[7px] text-[#1f2937] leading-none font-black block">
                Disahkan & Disetujui Secara Digital oleh
              </span>
              <span className="text-[8.5px] font-black text-[#000000] block mt-0.5">
                Kepala Dinas DPMPTSP Kab. Luwu
              </span>
              <div className="h-8 my-1 flex items-center justify-center font-mono text-[7px] text-emerald-900 uppercase tracking-widest border border-dashed border-emerald-500 rounded font-black bg-emerald-50">
                STAMP DPMPTSP DIGITAL
              </div>
              <span className="text-[8px] font-bold text-black block underline">
                KASNAR, SE
              </span>
              <span className="text-[6.5px] text-[#1f2937] block font-mono font-bold">
                NIP. 19700405 200212 1 007
              </span>
            </div>
          </div>

                    {/* Footer of page 2 */}
          <div className="flex justify-between items-center text-[7.5px] font-mono text-[#000000] pt-2 border-t border-black font-semibold">
            <span>KEPUTUSAN KEPALA DPMPTSP KABUPATEN LUWU NOMOR: 188.4/122/DPMPTSP/2026</span>
            <span>Halaman 2 dari 3 (Laporan Analitik Potensi & Kelayakan ROI)</span>
          </div>
        </div>

        {/* =========================================================================
            PETA HALAMAN 3: STATISTIK & GRAFIK (SUMMARY STATS)
            ========================================================================= */}
        <div 
          id="print-page-3"
          className="bg-white border-2 border-black p-6 flex flex-col justify-start" 
          style={{ width: "1123px", height: "794px", boxSizing: "border-box", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
        >
          {/* Header Kop Resmi */}
          <div className="flex items-center gap-4 border-b-4 border-black pb-3 mb-6">
            <div className="flex-shrink-0">
              {renderCrest(true)}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-black font-sans text-[#000000] leading-tight uppercase tracking-wider">
                Pemerintah Kabupaten Luwu
              </span>
              <span className="text-xs font-black text-[#1f2937] leading-tight uppercase tracking-wide">
                Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu (DPMPTSP)
              </span>
              <span className="text-[9px] text-[#1f2937] font-mono font-bold leading-none">
                {t('Laporan Statistik', 'Laporan Statistik Distribusi Investasi Daerah')}
              </span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h3 className="text-sm font-black tracking-wider uppercase text-black leading-tight">
              {t('Statistik & Distribusi Sektoral', 'Statistik & Distribusi Sektoral')}
            </h3>
            <h4 className="text-xs font-extrabold tracking-widest uppercase text-emerald-800 leading-tight">
              {t('Wilayah Kajian', 'Wilayah Kajian')}: {district.name}
            </h4>
            <div className="w-24 h-0.5 bg-emerald-600 mx-auto mt-2 rounded"></div>
          </div>

          <div className="flex flex-col gap-6 flex-grow">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center shadow-sm">
                 <div className="text-emerald-900 font-black text-lg">{formatRupiahSingkat(totalInvestmentValue)}</div>
                 <div className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider mt-1">Total Nilai Investasi</div>
              </div>
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-center shadow-sm">
                 <div className="text-sky-900 font-black text-lg">{districtInvestments.length} Proyek</div>
                 <div className="text-[9px] font-bold text-sky-700 uppercase tracking-wider mt-1">Titik Terpetakan</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center shadow-sm">
                 <div className="text-amber-900 font-black text-lg">{sectorStats.length} Sektor</div>
                 <div className="text-[9px] font-bold text-amber-700 uppercase tracking-wider mt-1">Keragaman Sektoral</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 flex-grow">
              {/* Chart 1: Sector Distribution (Pie Chart) */}
              <div className="flex flex-col border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                <h5 className="text-[10px] font-black text-slate-800 mb-2 text-center uppercase tracking-widest border-b border-slate-100 pb-2">
                  Komposisi Sektoral
                </h5>
                <div className="flex-1 w-full flex items-center justify-center h-[260px] min-h-[260px]">
                  {Array.isArray(sectorStats) && sectorStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie
                          data={sectorStats}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="45%"
                          outerRadius={85}
                          innerRadius={50}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                          isAnimationActive={false}
                          stroke="none"
                        >
                          {sectorStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value: any) => formatRupiahSingkat(Number(value))} />
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-xs text-slate-400 font-medium">Data sektor belum tersedia</div>
                  )}
                </div>
              </div>

              {/* Chart 2: Village Distribution (Bar Chart) */}
              <div className="flex flex-col border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                <h5 className="text-[10px] font-black text-slate-800 mb-2 text-center uppercase tracking-widest border-b border-slate-100 pb-2">
                  Sebaran Nilai per Desa
                </h5>
                <div className="flex-1 w-full h-[260px] min-h-[260px]">
                  {Array.isArray(villageStats) && villageStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart
                        data={villageStats}
                        margin={{ top: 20, right: 10, left: -5, bottom: 45 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 8, fill: '#64748b', fontWeight: 'bold' }} 
                          interval={0}
                          angle={-35}
                          textAnchor="end"
                          tickLine={false}
                          axisLine={{ stroke: '#cbd5e1' }}
                        />
                        <YAxis 
                          tick={{ fontSize: 8, fill: '#64748b', fontWeight: 'bold' }}
                          tickFormatter={(value) => `Rp${(value / 1000000000).toFixed(0)}M`}
                          tickLine={false}
                          axisLine={{ stroke: '#cbd5e1' }}
                          width={45}
                        />
                        <RechartsTooltip 
                          formatter={(value: any) => formatRupiahSingkat(Number(value))}
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: 'bold' }}
                        />
                        <Bar dataKey="value" fill="#059669" radius={[4, 4, 0, 0]} isAnimationActive={false} name={t("Nilai Investasi", "Nilai Investasi")} maxBarSize={45}>
                           {villageStats.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#059669" : "#0284c7"} />
                           ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-xs text-slate-400 font-medium flex items-center justify-center h-full">Data desa belum tersedia</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer of page 3 */}
          <div className="mt-6 flex justify-between items-center text-[7.5px] font-mono text-[#000000] pt-2 border-t border-black font-semibold">
            <span>KEPUTUSAN KEPALA DPMPTSP KABUPATEN LUWU NOMOR: 188.4/122/DPMPTSP/2026</span>
            <span>Halaman 3 dari 3 (Laporan Statistik & Grafik Sektoral)</span>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

// hotfix: dynamic data binding for pdf composer
// ui polish: resolve recharts 0x0 dimension warnings
