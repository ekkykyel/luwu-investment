import React, { useState, useRef } from 'react';
import { 
  Printer, 
  Download, 
  Copy, 
  Check, 
  X, 
  Compass, 
  MapPin, 
  Layers, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  AlertTriangle,
  ZoomIn,
  Building,
  UserCheck
} from 'lucide-react';
import jsPDF from 'jspdf';
import { safeHtml2Canvas } from '../../lib/html2canvasShim';
import { OFFICIAL_LUWU_LOGO_URL } from '../LuwuLogo';
import * as turf from '@turf/turf';

interface BapPkkprSpatialMapExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapCanvasDataUrl: string | null;
  selectedFeature: any | null;
  activeLayerConfig: {
    id: string;
    name: string;
    category: string;
    color: string;
  };
  districtName?: string;
  villageName?: string;
  zoomLevel?: number;
  centerCoordinates?: [number, number];
}

// Convert decimal degrees to Degrees Minutes Seconds (DMS) string
function toDMS(coord: number, isLatitude: boolean): string {
  const absolute = Math.abs(coord);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(2);

  let direction = '';
  if (isLatitude) {
    direction = coord >= 0 ? 'LU' : 'LS';
  } else {
    direction = coord >= 0 ? 'BT' : 'BB';
  }

  return `${degrees}° ${String(minutes).padStart(2, '0')}' ${String(seconds).padStart(5, '0')}" ${direction}`;
}

// Calculate UTM Zone 51 South (WGS84) Easting and Northing in meters for Luwu Regency
function toUTM51S(lon: number, lat: number): { easting: number; northing: number } {
  const a = 6378137.0; // WGS84 Semi-major axis
  const f = 1 / 298.257223563; // WGS84 Flattening
  const k0 = 0.9996; // UTM scale factor
  const zone = 51;
  const lon0 = (zone * 6 - 183) * (Math.PI / 180); // Central meridian: 123° for Zone 51
  const latRad = lat * (Math.PI / 180);
  const lonRad = lon * (Math.PI / 180);
  
  const e2 = 2 * f - f * f;
  const ePrime2 = e2 / (1 - e2);
  const N = a / Math.sqrt(1 - e2 * Math.sin(latRad) * Math.sin(latRad));
  const T = Math.tan(latRad) * Math.tan(latRad);
  const C = ePrime2 * Math.cos(latRad) * Math.cos(latRad);
  const A = Math.cos(latRad) * (lonRad - lon0);
  
  const M = a * ((1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256) * latRad
    - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 * e2 * e2 / 1024) * Math.sin(2 * latRad)
    + (15 * e2 * e2 / 256 + 45 * e2 * e2 * e2 / 1024) * Math.sin(4 * latRad)
    - (35 * e2 * e2 * e2 / 3072) * Math.sin(6 * latRad));
    
  const easting = 500000 + k0 * N * (A + (1 - T + C) * Math.pow(A, 3) / 6 + (5 - 18 * T + T * T + 72 * C - 58 * ePrime2) * Math.pow(A, 5) / 120);
  let northing = k0 * (M + N * Math.tan(latRad) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4) / 24 + (61 - 58 * T + T * T + 600 * C - 330 * ePrime2) * Math.pow(A, 6) / 720));
  
  if (lat < 0) {
    northing += 10000000;
  }
  
  return {
    easting: Math.round(easting * 100) / 100,
    northing: Math.round(northing * 100) / 100
  };
}

export default function BapPkkprSpatialMapExportModal({
  isOpen,
  onClose,
  mapCanvasDataUrl,
  selectedFeature,
  activeLayerConfig,
  districtName = 'Belopa',
  villageName = 'Batu',
  zoomLevel = 15,
  centerCoordinates = [120.35, -3.35]
}: BapPkkprSpatialMapExportModalProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedCsv, setCopiedCsv] = useState(false);
  const [docNumber, setDocNumber] = useState(`BAP.PKKPR/DPUPTR-LWU/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`);
  const [applicantName, setApplicantName] = useState('PT. KARYA INVESTAMA LUWU');
  const [projectTitle, setProjectTitle] = useState(
    selectedFeature?.properties?.nama_ruas || 
    selectedFeature?.properties?.nama || 
    selectedFeature?.properties?.name || 
    'Kawasan Kegiatan Usaha & Pemanfaatan Ruang'
  );
  const [officerName, setOfficerName] = useState('Ir. H. Ikhsan Asaad, S.T., M.T.');
  const [officerNip, setOfficerNip] = useState('19780412 200312 1 004');
  const [mapScaleText, setMapScaleText] = useState('1 : 5.000');

  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Extract raw coordinates and calculate vertices
  const geom = selectedFeature?.geometry;
  let rawVertices: [number, number][] = [];
  let areaHa = 0;
  let areaM2 = 0;
  let perimeterM = 0;

  if (geom) {
    try {
      if (geom.type === 'Polygon') {
        const ring = geom.coordinates[0] || [];
        rawVertices = ring.slice(0, ring.length > 1 ? ring.length - 1 : ring.length); // Exclude duplicate closure vertex for table
        const poly = turf.polygon(geom.coordinates);
        areaM2 = turf.area(poly);
        areaHa = areaM2 / 10000;
        perimeterM = turf.length(turf.polygonToLine(poly) as any, { units: 'meters' });
      } else if (geom.type === 'MultiPolygon') {
        const firstPoly = geom.coordinates[0];
        if (firstPoly && firstPoly[0]) {
          rawVertices = firstPoly[0].slice(0, firstPoly[0].length - 1);
        }
        const multiPoly = turf.multiPolygon(geom.coordinates);
        areaM2 = turf.area(multiPoly);
        areaHa = areaM2 / 10000;
        perimeterM = turf.length(turf.polygonToLine(multiPoly) as any, { units: 'meters' });
      } else if (geom.type === 'LineString') {
        rawVertices = geom.coordinates;
        perimeterM = turf.length(turf.lineString(geom.coordinates), { units: 'meters' });
      }
    } catch (calcErr) {
      console.warn('[Spatial Metric Calc Notice]:', calcErr);
    }
  }

  // Calculate vertex list with distance to next vertex
  const vertexList = rawVertices.map((coord, index) => {
    const lon = coord[0];
    const lat = coord[1];
    const utm = toUTM51S(lon, lat);
    const dmsLon = toDMS(lon, false);
    const dmsLat = toDMS(lat, true);

    let distanceToNext = 0;
    if (index < rawVertices.length - 1) {
      const p1 = turf.point(coord);
      const p2 = turf.point(rawVertices[index + 1]);
      distanceToNext = turf.distance(p1, p2, { units: 'meters' });
    } else if (rawVertices.length > 2) {
      // distance back to P1
      const pLast = turf.point(coord);
      const pFirst = turf.point(rawVertices[0]);
      distanceToNext = turf.distance(pLast, pFirst, { units: 'meters' });
    }

    return {
      no: `P.${index + 1}`,
      lon,
      lat,
      dmsLon,
      dmsLat,
      easting: utm.easting,
      northing: utm.northing,
      distanceToNext: Math.round(distanceToNext * 100) / 100
    };
  });

  // Handle Copy CSV
  const handleCopyCsv = () => {
    const headers = "No;Bujur (Lon DD);Lintang (Lat DD);Bujur DMS;Lintang DMS;UTM 51S Easting (X);UTM 51S Northing (Y);Jarak Patok (m)\n";
    const rows = vertexList.map(v => 
      `${v.no};${v.lon.toFixed(7)};${v.lat.toFixed(7)};"${v.dmsLon}";"${v.dmsLat}";${v.easting};${v.northing};${v.distanceToNext}`
    ).join("\n");

    navigator.clipboard.writeText(headers + rows);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2500);
  };

  // Trigger Native Print with Landscape Layout
  const handlePrint = () => {
    window.print();
  };

  // Download PDF file
  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const canvas = await safeHtml2Canvas(printAreaRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`PETA_BAP_PKKPR_LUWU_${Date.now()}.pdf`);
    } catch (err) {
      console.error('Failed to generate BAP PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const currentDateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      
      {/* Modal Container */}
      <div className="bg-[#0f172a] text-slate-100 rounded-2xl border border-slate-700 shadow-2xl max-w-6xl w-full max-h-[96vh] flex flex-col overflow-hidden">
        
        {/* Modal Top Header (Interactive Controls) */}
        <div className="bg-[#1e293b] px-4 py-3 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300">
              <Printer size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Layout Peta Lampiran BAP PKKPR PUPTR
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600/50">
                  Standar ATR/BPN
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Peta Teknis Geometri, Grid Koordinat WGS84, Tabel Patok Batas & Format Pengesahan
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCsv}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Salin daftar koordinat ke format CSV/Excel"
            >
              {copiedCsv ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copiedCsv ? 'Tersalin!' : 'Salin Koordinat'}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow cursor-pointer disabled:opacity-50"
            >
              <Download size={13} />
              <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Unduh PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow cursor-pointer"
            >
              <Printer size={13} />
              <span>Cetak Peta (Print)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-3 sm:p-6 overflow-y-auto bg-slate-950/60 flex justify-center">
          
          {/* ═══════════════════════════════════════════════════════════════════
              PRINTABLE A4/A3 LANDSCAPE MAP SHEET (Standard ATR/BPN & PUPTR)
             ═══════════════════════════════════════════════════════════════════ */}
          <div 
            ref={printAreaRef}
            id="pkkpr-print-sheet"
            className="w-full max-w-[1050px] bg-white text-slate-900 font-sans p-6 rounded-lg shadow-2xl border border-slate-300 print:border-none print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none select-text"
            style={{ minHeight: '680px' }}
          >
            {/* Outer Border (Standard Map Double Margin) */}
            <div className="border-2 border-black p-3 rounded-sm flex flex-col gap-3">
              
              {/* ── 1. KOP SURAT RESMI DINAS PUPTR KABUPATEN LUWU ── */}
              <div className="flex items-center justify-between border-b-2 border-black pb-2.5">
                <div className="w-16 h-18 flex items-center justify-center shrink-0">
                  <img 
                    src={OFFICIAL_LUWU_LOGO_URL} 
                    alt="Logo Pemkab Luwu" 
                    className="w-14 h-16 object-contain"
                  />
                </div>
                <div className="flex-1 text-center px-2">
                  <h4 className="text-xs font-bold tracking-wider uppercase text-slate-800">
                    PEMERINTAH KABUPATEN LUWU
                  </h4>
                  <h2 className="text-sm sm:text-base font-extrabold uppercase text-black tracking-tight">
                    DINAS PEKERJAAN UMUM DAN TATA RUANG (PUPTR)
                  </h2>
                  <p className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider">
                    BIDANG PENATAAN RUANG DAN BANGUNAN GEDUNG
                  </p>
                  <p className="text-[9px] text-slate-600 italic">
                    Jl. Jenderal Sudirman No. 1 Kompleks Perkantoran Pemerintah Kabupaten Luwu, Belopa (91994)
                  </p>
                </div>
                <div className="w-20 text-right shrink-0 border border-slate-400 p-1 rounded bg-slate-50">
                  <span className="text-[8px] font-bold block text-slate-500">LAMPIRAN:</span>
                  <span className="text-[9px] font-extrabold block text-slate-900">BAP PKKPR</span>
                  <span className="text-[8px] text-slate-500 font-mono">PETA-01</span>
                </div>
              </div>

              {/* ── 2. JUDUL PETA & NOMOR REGISTER ── */}
              <div className="bg-slate-100 border border-slate-300 py-1.5 px-3 rounded text-center">
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight uppercase">
                  PETA LAMPIRAN BERITA ACARA KESESUAIAN KEGIATAN PEMANFAATAN RUANG (BAP-PKKPR)
                </h3>
                <div className="flex items-center justify-center gap-4 text-[10px] text-slate-700 mt-0.5 font-medium">
                  <span>No. Register: <strong className="font-mono text-slate-900">{docNumber}</strong></span>
                  <span>•</span>
                  <span>Tanggal Cetak: <strong>{currentDateStr}</strong></span>
                  <span>•</span>
                  <span>Sistem Koordinat: <strong>WGS 84 / UTM Zona 51S</strong></span>
                </div>
              </div>

              {/* ── 3. MAIN MAP WORKSPACE & RIGHT TECHNICAL SIDEBAR ── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[380px]">
                
                {/* 3.A. LEFT: MAP FRAME & GRATICULE COORDINATES (8 Columns) */}
                <div className="lg:col-span-8 flex flex-col border-2 border-black rounded-sm overflow-hidden bg-slate-900 relative">
                  
                  {/* Top Coordinate Tick Marks */}
                  <div className="bg-black text-[8px] font-mono text-slate-300 px-2 py-0.5 flex justify-between border-b border-slate-700">
                    <span>120° 15' 00" BT</span>
                    <span>120° 20' 00" BT</span>
                    <span>120° 25' 00" BT</span>
                  </div>

                  {/* Canvas Map Container */}
                  <div className="flex-1 w-full relative min-h-[320px] bg-slate-950 flex items-center justify-center overflow-hidden">
                    {mapCanvasDataUrl ? (
                      <img 
                        src={mapCanvasDataUrl} 
                        alt="Peta Spasial PUPTR Luwu" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-6 text-slate-400">
                        <Layers size={32} className="mx-auto mb-2 text-slate-500" />
                        <p className="text-xs">Mengambil snapshot bidang peta aktif...</p>
                      </div>
                    )}

                    {/* North Arrow / Arah Mata Angin Graphic */}
                    <div className="absolute top-3 right-3 bg-white/95 text-black p-1.5 rounded-lg shadow-lg border border-slate-400 flex flex-col items-center pointer-events-none z-10">
                      <Compass size={22} className="text-red-600 animate-spin-slow" />
                      <span className="text-[10px] font-black text-black leading-none">U</span>
                      <span className="text-[7px] text-slate-600 font-bold uppercase">North</span>
                    </div>

                    {/* Scale Bar Overlay */}
                    <div className="absolute bottom-3 left-3 bg-white/95 text-slate-900 px-2 py-1 rounded shadow-md border border-slate-400 z-10">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold">Skala:</span>
                        <span className="text-[9px] font-extrabold font-mono text-slate-800">{mapScaleText}</span>
                      </div>
                      <div className="w-24 h-1.5 bg-black mt-1 flex">
                        <div className="w-1/2 h-full bg-white border-r border-black"></div>
                        <div className="w-1/2 h-full bg-black"></div>
                      </div>
                      <div className="flex justify-between text-[7px] font-mono text-slate-700 mt-0.5">
                        <span>0m</span>
                        <span>250m</span>
                        <span>500m</span>
                      </div>
                    </div>

                    {/* Active Polygon Highlight Badge */}
                    <div className="absolute bottom-3 right-3 bg-purple-900/90 text-white px-2 py-1 rounded border border-purple-400/60 shadow text-[9px] flex items-center gap-1 z-10">
                      <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block animate-ping"></span>
                      <span>Bidang Poligon Terpilih</span>
                    </div>
                  </div>

                  {/* Bottom Coordinate Tick Marks */}
                  <div className="bg-black text-[8px] font-mono text-slate-300 px-2 py-0.5 flex justify-between border-t border-slate-700">
                    <span>03° 10' 00" LS</span>
                    <span>03° 15' 00" LS</span>
                    <span>03° 20' 00" LS</span>
                  </div>
                </div>

                {/* 3.B. RIGHT: TECHNICAL METADATA, LEGENDA & INSET (4 Columns) */}
                <div className="lg:col-span-4 flex flex-col justify-between gap-2 text-[10px] text-slate-800">
                  
                  {/* Objek & Lokasi */}
                  <div className="border border-slate-300 rounded p-2 bg-slate-50">
                    <h5 className="font-bold text-slate-900 text-[10px] uppercase border-b border-slate-300 pb-1 mb-1.5 flex items-center gap-1">
                      <Building size={11} className="text-purple-700" />
                      <span>IDENTITAS OBJEK TATA RUANG</span>
                    </h5>
                    <div className="space-y-1 text-[9px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Nama Kegiatan/Objek:</span>
                        <strong className="text-slate-900 truncate max-w-[150px]">{projectTitle}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pemohon/Pemrakarsa:</span>
                        <strong className="text-slate-900 truncate max-w-[150px]">{applicantName}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Kecamatan:</span>
                        <strong className="text-slate-900">{districtName}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Desa/Kelurahan:</span>
                        <strong className="text-slate-900">{villageName}</strong>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
                        <span className="text-slate-500 font-bold">Luas Bidang:</span>
                        <strong className="text-emerald-700 font-extrabold">
                          {areaHa > 0 ? `${areaHa.toFixed(3)} Ha` : '-'} 
                          <span className="text-[8px] text-slate-500 ml-1">({areaM2.toLocaleString('id-ID')} m²)</span>
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Keliling Geometri:</span>
                        <strong className="text-slate-900">{perimeterM > 0 ? `${perimeterM.toFixed(1)} meter` : '-'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Jumlah Patok Sudut:</span>
                        <strong className="text-purple-800 font-bold">{vertexList.length} Titik Patok</strong>
                      </div>
                    </div>
                  </div>

                  {/* Legenda Peta */}
                  <div className="border border-slate-300 rounded p-2 bg-slate-50">
                    <h5 className="font-bold text-slate-900 text-[10px] uppercase border-b border-slate-300 pb-1 mb-1.5 flex items-center gap-1">
                      <Layers size={11} className="text-purple-700" />
                      <span>LEGENDA & SIMBOLOGI</span>
                    </h5>
                    <div className="space-y-1 text-[8.5px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-2.5 bg-yellow-400 border border-yellow-600 rounded-xs shrink-0"></span>
                        <span className="text-slate-700 font-semibold">Bidang Plot Usaha (PKKPR Diteliti)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-2.5 bg-emerald-500 border border-emerald-700 rounded-xs shrink-0"></span>
                        <span className="text-slate-700">Lahan Pertanian Basah & LP2B Luwu</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-2.5 bg-cyan-500 border border-cyan-700 rounded-xs shrink-0"></span>
                        <span className="text-slate-700">Hutan Lindung & Mangrove Pesisir</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-1 bg-amber-500 shrink-0"></span>
                        <span className="text-slate-700">Jaringan Jalan Arteri & Kolektor Luwu</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-1 bg-sky-500 shrink-0"></span>
                        <span className="text-slate-700">Sempadan & Hidrologi Sungai</span>
                      </div>
                    </div>
                  </div>

                  {/* Peta Inset Kabupaten Luwu */}
                  <div className="border border-slate-300 rounded p-1.5 bg-slate-50 text-center">
                    <span className="text-[8px] font-bold text-slate-600 uppercase block mb-1">
                      PETA INSET KABUPATEN LUWU
                    </span>
                    <div className="h-14 bg-slate-200 border border-slate-300 rounded flex items-center justify-center relative overflow-hidden">
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                        PROVINSI SULAWESI SELATAN
                      </span>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-red-600 bg-red-500/30 rounded-xs animate-pulse"></div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* ── 4. TABEL DAFTAR KOORDINAT TITIK SUDUT / PATOK BATAS (VERTEX LIST) ── */}
              <div className="border border-slate-300 rounded p-2.5 bg-slate-50">
                <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-2">
                  <h5 className="font-bold text-slate-900 text-[10px] uppercase flex items-center gap-1">
                    <MapPin size={11} className="text-purple-700" />
                    <span>TABEL KOORDINAT TITIK SUDUT & PATOK BATAS BIDANG (WGS84 & UTM 51S)</span>
                  </h5>
                  <span className="text-[8px] text-slate-500">
                    Total: <strong>{vertexList.length}</strong> Patok Terpetakan
                  </span>
                </div>

                {vertexList.length > 0 ? (
                  <div className="overflow-x-auto max-h-[160px] print:max-h-none">
                    <table className="w-full text-left text-[8px] border-collapse">
                      <thead>
                        <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                          <th className="py-1 px-1.5 text-center w-8">No</th>
                          <th className="py-1 px-1.5">Bujur (Lon Desimal)</th>
                          <th className="py-1 px-1.5">Lintang (Lat Desimal)</th>
                          <th className="py-1 px-1.5">Koordinat DMS (BT / LS)</th>
                          <th className="py-1 px-1.5 text-right">UTM 51S X (Easting)</th>
                          <th className="py-1 px-1.5 text-right">UTM 51S Y (Northing)</th>
                          <th className="py-1 px-1.5 text-right">Jarak ke Patok (m)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-700 font-mono">
                        {vertexList.slice(0, 15).map((v, idx) => (
                          <tr key={idx} className="hover:bg-slate-100">
                            <td className="py-0.5 px-1.5 text-center font-bold text-purple-900 bg-purple-50">{v.no}</td>
                            <td className="py-0.5 px-1.5">{v.lon.toFixed(7)}°</td>
                            <td className="py-0.5 px-1.5">{v.lat.toFixed(7)}°</td>
                            <td className="py-0.5 px-1.5 font-sans">{v.dmsLon}, {v.dmsLat}</td>
                            <td className="py-0.5 px-1.5 text-right">{v.easting.toLocaleString('id-ID')} m</td>
                            <td className="py-0.5 px-1.5 text-right">{v.northing.toLocaleString('id-ID')} m</td>
                            <td className="py-0.5 px-1.5 text-right font-bold text-slate-900">{v.distanceToNext > 0 ? `${v.distanceToNext.toFixed(1)} m` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {vertexList.length > 15 && (
                      <p className="text-[7.5px] text-slate-500 italic mt-1 text-center">
                        * Menampilkan 15 dari total {vertexList.length} titik koordinat batas (salin tabel lengkap menggunakan tombol Salin Koordinat).
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[9px] text-slate-500 italic text-center py-2">
                    Belum ada poligon yang dipilih. Silakan pilih atau gambar poligon pada peta terlebih dahulu.
                  </p>
                )}
              </div>

              {/* ── 5. KOLOM PENGESAHAN & TANDA TANGAN TIM TEKNIS ── */}
              <div className="grid grid-cols-3 gap-3 border-t-2 border-black pt-3 text-[9px] text-center">
                
                {/* Pemohon */}
                <div className="flex flex-col justify-between h-24">
                  <div>
                    <span className="block text-slate-600">Pemohon / Pelaku Usaha,</span>
                    <strong className="block text-slate-900 uppercase mt-0.5 truncate">{applicantName}</strong>
                  </div>
                  <div>
                    <div className="border-b border-dotted border-black w-32 mx-auto mb-1"></div>
                    <span className="text-[8px] text-slate-500 block">Tanda Tangan & Cap Pemohon</span>
                  </div>
                </div>

                {/* Tim Teknis PUPTR */}
                <div className="flex flex-col justify-between h-24">
                  <div>
                    <span className="block text-slate-600">Petugas Pembuat Peta Spasial,</span>
                    <strong className="block text-slate-900 uppercase mt-0.5">Operator GIS Tata Ruang PUPTR</strong>
                  </div>
                  <div>
                    <div className="border-b border-dotted border-black w-32 mx-auto mb-1"></div>
                    <span className="text-[8px] text-slate-500 block">NIP. Operator Teknis Spasial</span>
                  </div>
                </div>

                {/* Mengetahui Kabid Tata Ruang */}
                <div className="flex flex-col justify-between h-24">
                  <div>
                    <span className="block text-slate-600">Mengetahui & Menyetujui:</span>
                    <span className="block font-bold text-slate-900 text-[8px] uppercase">
                      Kepala Bidang Penataan Ruang PUPTR
                    </span>
                  </div>
                  <div>
                    <strong className="block text-slate-900 underline font-bold text-[8.5px]">
                      {officerName}
                    </strong>
                    <span className="text-[8px] text-slate-600 block">NIP. {officerNip}</span>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
