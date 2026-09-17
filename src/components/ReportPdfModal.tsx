import { LUWU_LOGO_BASE64 } from "@/lib/logoBase64.js";
import { motion } from "motion/react";
import React, { useState, useRef, useEffect } from "react";
import * as turf from "@turf/turf";
import { District, Investment, SektorInvestasi, Village } from "../types";
import { formatRupiah, formatNumber, formatRupiahSingkat } from "../lib/formatters";
import { SECTOR_COLORS } from "../lib/constants";
import { LuwuLogo } from "./LuwuLogo";
import { 
  X, Download, FileText, BarChart2, ShieldAlert, MapPin, 
  Award, RefreshCw, Layers, Compass, Loader2, Phone, User, DollarSign, Map, ZoomIn, ZoomOut
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, PieChart, Pie, Cell, LineChart, Line 
} from "recharts";
import jsPDF from "jspdf";
import { safeHtml2Canvas, pdfRenderQueue, waitForDomAndIdle } from "../lib/html2canvasShim";

interface ReportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  districts: District[];
  investments: Investment[];
  villages: Village[];
  selectedDistrictId: string | null;
  selectedInvestmentId: string | null;
  setSelectedDistrictId?: (id: string | null) => void;
  setSelectedInvestmentId?: (id: string | null) => void;
  mapMode?: "osm" | "dark" | "satellite" | "light" | "google_street" | "google_satellite";
  setMapMode?: (mode: "osm" | "dark" | "satellite" | "light" | "google_street" | "google_satellite") => void;
  spatialLayers?: Record<string, any>;
  setSpatialLayers?: any;
}

export default function ReportPdfModal({
  isOpen,
  onClose,
  districts,
  investments,
  villages,
  selectedDistrictId,
  selectedInvestmentId,
  setSelectedDistrictId,
  setSelectedInvestmentId,
  mapMode,
  setMapMode,
  spatialLayers,
  setSpatialLayers
}: ReportPdfModalProps) {
  // Navigation trigger inside the report
  const [reportType, setReportType] = useState<"district" | "investment">(
    selectedInvestmentId ? "investment" : "district"
  );
  
  // Scoped selections
  const [activeDistrictId, setActiveDistrictId] = useState<string>(
    selectedDistrictId || (districts[0]?.id || "")
  );
  const [activeInvestmentId, setActiveInvestmentId] = useState<string>(
    selectedInvestmentId || (investments[0]?.id || "")
  );

  // Active items mapping
  const currentDistrict = districts.find(d => d.id === activeDistrictId) || districts[0];
  const currentInvestment = investments.find(i => i.id === activeInvestmentId) || investments[0];

  const [previewZoom, setPreviewZoom] = useState(1);

  // Auto-scale for mobile on mount
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1100) {
      // Calculate responsive scale to fit the max-w-5xl (1024px) container
      const scale = (window.innerWidth - 32) / 1024;
      setPreviewZoom(scale > 0.1 ? scale : 0.1);
    }
  }, []);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [pdfQuality, setPdfQuality] = useState<"digital" | "print">("digital");
  const [showTimeoutWarning, setShowTimeoutWarning] = useState<boolean>(false);
  const [mapSnapshotUrl, setMapSnapshotUrl] = useState<string | null>(null);
  const createdBlobUrlsRef = useRef<Set<string>>(new Set());

  const updateMapSnapshotUrl = (url: string | null) => {
    setMapSnapshotUrl(url);
  };

  useEffect(() => {
    if (!isOpen) {
      createdBlobUrlsRef.current.forEach(u => URL.revokeObjectURL(u));
      createdBlobUrlsRef.current.clear();
      setMapSnapshotUrl(null);
    }
    return () => {
      createdBlobUrlsRef.current.forEach(u => URL.revokeObjectURL(u));
      createdBlobUrlsRef.current.clear();
    };
  }, [isOpen]);

  const [spatialAnalysisData, setSpatialAnalysisData] = useState<any>(null);

  useEffect(() => {
    if (reportType === "investment" && currentInvestment) {
      setSpatialAnalysisData(null);
      fetch(`/api/investments/${encodeURIComponent(currentInvestment.id)}/spatial-analysis`)
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => setSpatialAnalysisData(data))
        .catch(err => console.error("Failed to fetch spatial analysis", err));
    }
  }, [currentInvestment?.id, reportType]);
  const [isCapturingMap, setIsCapturingMap] = useState(false);
  const reportContainerRef = useRef<HTMLDivElement>(null);
  const investmentTitleRef = useRef<HTMLHeadingElement>(null);
  
  // Auto-scale investment title if it exceeds bounds (prevent overlap/overflow on print or mobile views)
  React.useEffect(() => {
    if (reportType === "investment" && currentInvestment && investmentTitleRef.current) {
      const el = investmentTitleRef.current;
      el.style.fontSize = "18px"; // Reset to base (text-lg)
      el.style.whiteSpace = "nowrap"; // Force single lined checking
      
      const rescale = () => {
        let currentSize = 18;
        while (el.scrollWidth > el.clientWidth && currentSize > 9) {
          currentSize -= 0.5;
          el.style.fontSize = `${currentSize}px`;
        }
        el.style.whiteSpace = "normal"; // Restore wrapping to preserve snug behavior if it's still large
      };
      
      setTimeout(rescale, 50);
    }
  }, [reportType, currentInvestment?.name, isOpen]);

  // Take a high-resolution snapshot of the background map component
  const captureMap = async (isDownload = false) => {
    setIsCapturingMap(true);
    setShowTimeoutWarning(false); // Reset warning banner
    updateMapSnapshotUrl(null); // Clear previous to show loading state

    const targetScale = isDownload 
      ? (pdfQuality === "print" ? 3.125 : 2.0)
      : 1.5; // Optimized lightweight 1.5x for interactive preview memory-saving

    let imgData = "";

    try {
      // 1. KUNCI BINGKAI KAMERA INSTAN (FITBOUNDS)
      if ((window as any).globalLuwuMapInstance) {
        let activeGeoJson = null;
        if (activeDistrictId) {
          activeGeoJson = districts.find(d => d.id === activeDistrictId)?.geojson;
        } else if (districts.length > 0) {
          activeGeoJson = districts[0].geojson;
        }
        if (activeGeoJson) {
          try {
            const bbox = turf.bbox(activeGeoJson);
            (window as any).globalLuwuMapInstance.fitBounds(
              [
                [bbox[0], bbox[1]],
                [bbox[2], bbox[3]]
              ],
              {
                padding: 60,
                animate: false
              }
            );
          } catch(e) {
            undefined;
          }
        }

        // Wait for MapLibre map to be idle / fully loaded instead of a rigid sleep timer kawan!
        const map = (window as any).globalLuwuMapInstance;
        await new Promise<void>((resolve) => {
          let resolved = false;
          let intervalId: any = null;
          
          const done = (isTimeout = false) => {
            if (resolved) return;
            resolved = true;
            if (intervalId) clearInterval(intervalId);
            map.off('idle', onIdleEvent);
            if (isTimeout) {
              setShowTimeoutWarning(true);
            }
            resolve();
          };

          const onIdleEvent = () => {
            done(false);
          };
          
          map.on('idle', onIdleEvent);

          // Active polling check for areTilesLoaded to guarantee all tiles are fully painted
          let checks = 0;
          const maxChecks = 8; // Reduced from 80 (8.0s) to 8 (0.8s) for ultra fast rendering kawan!
          intervalId = setInterval(() => {
            checks++;
            if (map.areTilesLoaded()) {
              done(false);
            } else if (checks >= maxChecks) {
              done(true); // timed out!
            }
          }, 100);
        });
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Attempt native WebGL getCanvas toDataURL first (always works perfectly with preserveDrawingBuffer=true)
      if ((window as any).globalLuwuMapInstance) {
        const map = (window as any).globalLuwuMapInstance;
        try {
          map.triggerRepaint();
          const mCanvas = map.getCanvas();
          if (mCanvas) {
            const temp = document.createElement("canvas");
            temp.width = mCanvas.width;
            temp.height = mCanvas.height;
            const ctx = temp.getContext("2d");
            if (ctx) {
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, temp.width, temp.height);
              ctx.drawImage(mCanvas, 0, 0);
              imgData = temp.toDataURL("image/jpeg", 0.92);
            } else {
              imgData = mCanvas.toDataURL("image/png");
            }
          }
        } catch (e) {
          undefined;
        }
      }

      // Active polling to wait for the canvas element to be available (bulletproof)
      const waitForCanvas = async () => {
        if ((window as any).globalLuwuMapInstance) {
          try {
            const canvas = (window as any).globalLuwuMapInstance.getCanvas();
            if (canvas) return canvas as HTMLCanvasElement;
          } catch (e) {
            undefined;
          }
        }
        for (let i = 0; i < 30; i++) { // 3 seconds max
          const canvas = document.querySelector('.maplibregl-canvas, .mapboxgl-canvas, #map-parent-container canvas, canvas');
          if (canvas) return canvas as HTMLCanvasElement;
          await new Promise(res => setTimeout(res, 100));
        }
        return null;
      };

      const mapCanvasElement = await waitForCanvas();
      if (!imgData && mapCanvasElement) {
        try {
          imgData = mapCanvasElement.toDataURL("image/jpeg", 0.92);
        } catch (e) {
          undefined;
        }
      }
      
      const mapCanvasWrapper = document.getElementById("map-canvas") || document.querySelector(".maplibregl-map") || document.getElementById("map-parent-container");
      
      // Fallback to html2canvas if still empty (rare)
      if (!imgData && mapCanvasWrapper) {
        try {
          // Capture the whole map container including WebGL canvas and HTML marker overlays
          const mCanvas = await pdfRenderQueue.enqueue(() => safeHtml2Canvas(mapCanvasWrapper as HTMLElement, {
            scale: targetScale, // Use optimized adaptive scale setting
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: "#ffffff",
            ignoreElements: (el: any) => {
              // Ignore map interactive UI controls (buttons, compass, zoom sliders)
              return el?.classList?.contains("maplibregl-ctrl-group") ||
                     el?.classList?.contains("maplibregl-ctrl-top-right") ||
                     el?.classList?.contains("maplibregl-ctrl-top-left") ||
                     el?.closest(".maplibregl-ctrl-top-right") ||
                     el?.closest(".maplibregl-ctrl-top-left");
            }
          }));
        if (mCanvas.width > 0 && mCanvas.height > 0) {
          imgData = mCanvas.toDataURL("image/png");
        }
        } catch (captureErr) {
          undefined;
        }
      }

      if (imgData && imgData !== "data:,") {
        updateMapSnapshotUrl(imgData);
      } else {
        // Fallback to safeHtml2Canvas in case map is not yet fully loaded/initialized 
        const mapElement = document.getElementById("map-canvas") || document.querySelector(".maplibregl-canvas-container") || document.getElementById("map-parent-container") || document.querySelector(".maplibregl-map");
        if (mapElement) {
          await (document as any).fonts?.ready;
          const canvas = await pdfRenderQueue.enqueue(() => safeHtml2Canvas(mapElement as HTMLElement, {
            scale: targetScale, // Use optimized adaptive scale setting
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: null,
          }));
          
          if (canvas.width > 0 && canvas.height > 0) {
            const imgDataFallback = canvas.toDataURL("image/jpeg", 0.95);
            if (imgDataFallback !== "data:,") {
              imgData = imgDataFallback;
              updateMapSnapshotUrl(imgDataFallback);
            }
          }
        }
      }
    } catch (err) {
      console.error("Gagal menangkap snapshot peta spasial:", err);
    } finally {
      setIsCapturingMap(false);
    }
    return imgData;
  };

  // Sync internal selections with external state when open
  React.useEffect(() => {
    if (!isOpen) return;

    if (reportType === "district") {
      if (setSelectedDistrictId && activeDistrictId !== selectedDistrictId) {
        setSelectedDistrictId(activeDistrictId);
      }
    } else {
      if (setSelectedInvestmentId && activeInvestmentId !== selectedInvestmentId) {
        setSelectedInvestmentId(activeInvestmentId);
      }
    }

    // Schedule capturing snapshot of map
    const captureTimer = setTimeout(() => {
      captureMap();
    }, 1200);

    return () => clearTimeout(captureTimer);
  }, [activeDistrictId, activeInvestmentId, reportType, isOpen, setSelectedDistrictId, selectedDistrictId, setSelectedInvestmentId, selectedInvestmentId]);

  // Synchronize internal selection state if modified from parent props
  React.useEffect(() => {
    if (selectedDistrictId) {
      setActiveDistrictId(selectedDistrictId);
    }
  }, [selectedDistrictId]);

  React.useEffect(() => {
    if (selectedInvestmentId) {
      setActiveInvestmentId(selectedInvestmentId);
      setReportType("investment");
    }
  }, [selectedInvestmentId]);

  if (!isOpen) return null;

  // Calculate stats for selected district
  const districtInvestments = investments.filter(i => i.districtId === activeDistrictId);
  const districtTotalInvestmentValue = districtInvestments.reduce((sum, item) => sum + item.investmentValue, 0);
  const districtTotalArea = districtInvestments.reduce((sum, item) => sum + item.areaHa, 0);

  // Recharts Data preparation: Investment Sector Distribution within this district
  const districtSectorData = Object.values(SektorInvestasi).map(sector => {
    const sum = districtInvestments
      .filter(item => item.sector === sector)
      .reduce((s, item) => s + item.investmentValue, 0);
    return { 
      name: sector, 
      value: sum // Raw value for proper formatting
    };
  }).filter(item => item.value > 0);

  // If no sector investments at all, populate zero-placeholder for safe Recharts rendering
  const isSectorDataEmpty = districtSectorData.length === 0;

  // Detailed District list comparative dataset
  const districtComparisonData = districts.map(d => {
    const totalVal = investments
      .filter(i => i.districtId === d.id)
      .reduce((s, item) => s + item.investmentValue, 0);
    return {
      name: d.name,
      value: Math.round(totalVal / 1e9), // Billions
      infra: d.infrastructureScore
    };
  }).sort((a, b) => b.value - a.value).slice(0, 5);

  // Calculate logistics proximity proxy (synthesized or loaded from investment nodes)
  // Distance to Ports & road estimation fallback based on geography
  const getLogisticsProximity = (inv: Investment) => {
    if (spatialAnalysisData && spatialAnalysisData.distances) {
      return {
        distToAirportKm: parseFloat(Number(spatialAnalysisData.distances.nearestAirport?.distanceKm || 0).toFixed(1)),
        distToPortKm: parseFloat(Number(spatialAnalysisData.distances.nearestPort?.distanceKm || 0).toFixed(1)),
        distToRoadKm: parseFloat(Number(spatialAnalysisData.distances.nearestRoad?.distanceKm || 0).toFixed(1)),
        isPgRouting: spatialAnalysisData.distances.nearestAirport?.isNetworkRouting || false,
        source: "PgRouting API"
      };
    }

    const gisData = inv.smartData?.gis_potensi_investasi?.[0];
    const pgRouting = inv.smartData?.pgrouting_distance || gisData?.pgrouting_distance || (inv as any).pgrouting_distance;
    
    if (pgRouting !== undefined && pgRouting !== null) {
      return {
        distToAirportKm: parseFloat(Number(pgRouting).toFixed(1)),
        distToPortKm: parseFloat(Number(pgRouting).toFixed(1)),
        distToRoadKm: Number(gisData?.jarak_bandara || (inv as any).roadDistance || 0.15),
        isPgRouting: true,
        source: "Database Cache"
      };
    }

    if (gisData && (gisData.jarak_pelabuhan !== undefined || gisData.jarak_bandara !== undefined)) {
      return {
        distToAirportKm: gisData.jarak_bandara || 0,
        distToPortKm: gisData.jarak_pelabuhan || 0,
        distToRoadKm: Number((inv as any).roadDistance || gisData.jarak_jalan || 0.15),
        isPgRouting: false,
        source: "GIS Legacy"
      };
    }

    // Exact Turf.js Geodesic Fallback
    const invPt = turf.point([inv.longitude || 120.36, inv.latitude || -3.38]);
    const distToPort = turf.distance(invPt, turf.point([120.3979346, -3.3860616]), { units: 'kilometers' });
    const distToAirport = turf.distance(invPt, turf.point([120.2413232, -3.0863384]), { units: 'kilometers' });
    
    const roadLine = turf.lineString([
      [120.3015, -3.5488],
      [120.3294, -3.4025],
      [120.3582, -3.1111],
      [120.2285, -2.9324]
    ]);
    const nearestRoadPt = turf.nearestPointOnLine(roadLine, invPt);
    const distToNationalRoad = turf.distance(invPt, nearestRoadPt, { units: 'kilometers' });
    
    return {
      distToAirportKm: parseFloat(distToAirport.toFixed(1)),
      distToPortKm: parseFloat(distToPort.toFixed(1)),
      distToRoadKm: parseFloat(distToNationalRoad.toFixed(1)),
      isPgRouting: false,
      source: "Turf.js Geodesic"
    };
  };

  const currentInvestmentLogistics = currentInvestment ? getLogisticsProximity(currentInvestment) : { distToAirportKm: 0, distToPortKm: 0, distToRoadKm: 0, isPgRouting: false, source: "" };
  // Comparison for selected investment within its sector
  const sameSectorInvestments = investments.filter(i => i.sector === currentInvestment?.sector);
  const averageValueInSector = sameSectorInvestments.length > 0
    ? sameSectorInvestments.reduce((sum, i) => sum + i.investmentValue, 0) / sameSectorInvestments.length
    : 0;

  const handleDownloadPdf = async () => {
    if (!reportContainerRef.current) return;
    setIsGenerating(true);
    setGenerationStep("Merekam peta resolusi tinggi (just-in-time)...");

    try {
      // Just-in-time capture map at full print-ready high resolution!
      await captureMap(true);
      // Brief sleep tick to let React render state commit and browser paint the updated map URL
      await new Promise(resolve => setTimeout(resolve, 300));

      setGenerationStep("Menyiapkan lembar dokumen A4 resmi...");
      // Force scroll layout reset to guarantee top starting position
      const element = await waitForDomAndIdle(reportContainerRef.current, 5000);
      
      const scaleValue = pdfQuality === "print" ? 3.125 : 2.0;
      const dpiText = pdfQuality === "print" ? "302 DPI" : "193 DPI";
      setGenerationStep(`Merender peta spasial & bagan finansial (${dpiText}, Scale ${scaleValue}x)...`);
      await (document as any).fonts?.ready;
      const canvas = await pdfRenderQueue.enqueue(() => safeHtml2Canvas(element, {
        scale: scaleValue, // Choose adaptive scale based on chosen print/digital quality setting
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 800, // Enforce standard width to prevent horizontal scroll bugs
      }));

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error("Canvas render failed with 0 width/height.");
      }

      setGenerationStep("Mengekstrak buffer citra dokumen...");
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      if (!imgData || imgData === 'data:,' || imgData.length < 50) {
        throw new Error("Canvas toDataURL returned invalid data.");
      }

      setGenerationStep("Menyusun penomoran & tata letak halaman PDF...");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add First Page
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pdfHeight;

      // Dynamic vertical pagination for multi-page document spans
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= pdfHeight;
      }

      setGenerationStep("Menyimpan berkas PDF resmi...");
      const filename = reportType === "district"
        ? `Laporan_Investasi_Kecamatan_${(currentDistrict?.name || "Kecamatan").replace(/\s+/g, "_")}.pdf`
        : `Peluang_Investasi_Proyek_${(currentInvestment?.name || "Proyek").replace(/\s+/g, "_")}.pdf`;

      pdf.save(filename);
    } catch (err) {
      console.error("Gagal melahirkan file PDF spasial resmi:", err);
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
      // Revert map snapshot back to lightweight preview scale (1.5x) to save browser memory
      setTimeout(() => {
        captureMap(false);
      }, 500);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4 relative">
      {isGenerating && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-[99999] flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 text-emerald-400 animate-spin" />
            <h3 className="text-white font-bold text-lg">Menghasilkan Laporan PDF</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{generationStep || "Menyiapkan data..."}</p>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-emerald-500 h-full transition-all duration-500" 
                style={{ 
                  width: generationStep.includes("Menyiapkan") ? "20%" : 
                         generationStep.includes("Merender") ? "60%" : 
                         generationStep.includes("Mengekstrak") ? "80%" : "95%" 
                }}
              />
            </div>
          </div>
        </div>
      )}
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="bg-slate-100 rounded-3xl w-full max-w-5xl h-[95vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* 1. TOP WINDOW BAR */}
        <div className="bg-slate-950 text-white px-6 py-4 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            <div>
              <h3 className="text-xs font-mono font-bold tracking-widest text-emerald-700 dark:text-emerald-400">PDF GENERATOR ENGINE</h3>
              <span className="text-sm font-display font-bold">Laporan Kinerja Spasial & Investasi Luwu</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-white rounded-xl transition-all h-8 w-8 flex items-center justify-center cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* WARN BANNER FOR TIMEOUT (SLOW CONNECTION) */}
        {showTimeoutWarning && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-amber-750 dark:text-amber-400">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-500 animate-pulse" />
              <p className="text-xs font-semibold leading-normal">
                Koneksi lambat terdeteksi. Beberapa detail atau citra satelit peta mungkin belum terunduh sempurna. Disarankan menutup modal lalu memuat ulang jika hasil cetak kurang memuaskan.
              </p>
            </div>
            <button 
              onClick={() => setShowTimeoutWarning(false)}
              className="text-amber-700 dark:text-amber-400 hover:text-amber-950 font-bold text-xs"
            >
              Tutup
            </button>
          </div>
        )}

        {/* 2. TAB CONTROL AND SELECTION MENU */}
        <div className="bg-white p-4 border-b border-slate-200 flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-center justify-between shadow-sm">
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => setReportType("district")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                reportType === "district" 
                  ? "bg-slate-950 text-white shadow-md shadow-slate-950/10" 
                  : "bg-slate-100 text-slate-650 hover:bg-slate-200"
              }`}
            >
              <Layers className="h-4 w-4" />
              Laporan GIS Kecamatan
            </button>
            <button
              onClick={() => setReportType("investment")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                reportType === "investment" 
                  ? "bg-slate-950 text-white shadow-md shadow-slate-950/10" 
                  : "bg-slate-100 text-slate-650 hover:bg-slate-200"
              }`}
            >
              <FileText className="h-4 w-4" />
              Laporan Profil Investasi
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-start sm:justify-end">
            {reportType === "district" ? (
              <div className="flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200">
                <span className="font-semibold text-slate-600 dark:text-slate-400 font-mono text-[10px] hidden sm:inline">PILIH KECAMATAN:</span>
                <select
                  value={activeDistrictId}
                  onChange={(e) => setActiveDistrictId(e.target.value)}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  {districts.map((d, idx) => (
                    <option key={`${d.id}-${idx}`} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200">
                <span className="font-semibold text-slate-600 dark:text-slate-400 font-mono text-[10px] hidden sm:inline">PILIH PROYEK:</span>
                <select
                  value={activeInvestmentId}
                  onChange={(e) => setActiveInvestmentId(e.target.value)}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 max-w-[250px] focus:outline-none truncate"
                >
                  {investments.map((i, idx) => (
                    <option key={`${i.id}-${idx}`} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* BASEMAP AND RBI TOGGLES FOR PDF */}
            <div className="flex items-center gap-2 sm:border-l sm:border-slate-300 sm:pl-3">
              <span className="font-semibold text-slate-600 dark:text-slate-400 font-mono text-[10px] hidden sm:inline">BASEMAP:</span>
              <select
                value={mapMode}
                onChange={(e) => setMapMode && setMapMode(e.target.value as any)}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-slate-800 focus:outline-none"
              >
                <option value="osm">Light Map</option>
                <option value="google_satellite">Google Maps</option>
                <option value="satellite">Satellite</option>
                <option value="dark">Dark Engine</option>
              </select>

              {spatialLayers && Object.values(spatialLayers).some((l: any) => l.id === "layer_rbi") && (
                <label className="flex items-center gap-1.5 cursor-pointer ml-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={Object.values(spatialLayers).find((l: any) => l.id === "layer_rbi")?.isActive || false}
                    onChange={() => {
                      if (setSpatialLayers) {
                        setSpatialLayers((prev: Record<string, any>) => {
                          if (prev["layer_rbi"]) {
                            return { ...prev, "layer_rbi": { ...prev["layer_rbi"], isActive: !prev["layer_rbi"].isActive } };
                          }
                          return prev;
                        });
                      }
                    }}
                    className="rounded-sm accent-emerald-600 w-3 h-3"
                  />
                  <span className="whitespace-nowrap">Peta RBI</span>
                </label>
              )}
            </div>

            {/* QUALITY SELECTOR FOR PRINT */}
            <div className="flex items-center gap-2 sm:border-l sm:border-slate-300 sm:pl-3">
              <span className="font-semibold text-slate-600 dark:text-slate-400 font-mono text-[10px] hidden sm:inline">RESOLUSI:</span>
              <select
                value={pdfQuality}
                onChange={(e) => setPdfQuality(e.target.value as "digital" | "print")}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-slate-850 focus:outline-none"
                title="Pilih kualitas resolusi cetak PDF"
              >
                <option value="digital">Digital (193 DPI)</option>
                <option value="print">Cetak Fisik (302 DPI)</option>
              </select>
            </div>

            {isCapturingMap ? (
              <span className="flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-200/70 px-3 py-1.5 rounded-xl font-mono whitespace-nowrap">
                <Loader2 className="h-3 w-3 animate-spin text-amber-600" />
                Merekam...
              </span>
            ) : (
              <button
                type="button"
                onClick={() => captureMap(false)}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer whitespace-nowrap"
                title="Ambil snapshot peta versi terkini"
              >
                <RefreshCw className="h-3 w-3 text-slate-550" />
                Refresh Peta
              </button>
            )}

            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold tracking-wide rounded-xl shadow-lg shadow-emerald-650/10 disabled:opacity-50 cursor-pointer transition-all whitespace-nowrap w-full sm:w-auto justify-center mt-2 sm:mt-0"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengkompilasi PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Unduh PDF Resmi
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3. REPORT RENDERING WRAPPER (A4 Sized paper scale) */}
        <div className="flex-1 overflow-auto bg-slate-200/50 relative">
          {/* Mobile-Friendly Zoom Controls Overlay */}
          <div className="sticky top-4 z-[300] mx-auto w-max bg-slate-800/80 backdrop-blur-md border border-slate-600 rounded-full px-4 py-2 flex items-center justify-center gap-4 mb-4 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
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
            className="p-2 sm:p-8 flex justify-center w-full transition-transform duration-200 ease-out origin-top" 
            style={{ 
              transform: isGenerating ? 'scale(1)' : `scale(${previewZoom})`, 
              paddingBottom: '150px' 
            }}
          >
            {/* A4 Page layout target */}
            <div 
              id="officials-pdf-paper-target"
              ref={reportContainerRef}
              className="w-[794px] min-h-[1123px] bg-white text-slate-800 p-8 sm:p-12 shadow-2xl border border-slate-300 overflow-hidden shrink-0 mx-auto rounded-none font-sans relative flex flex-col gap-6"
              style={{
                boxSizing: "border-box",
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              }}
            >
            {/* OFFICIAL GOVERNMENT KOP SURAT HEADER */}
            <div className="border-b-4 border-double border-slate-900 pb-4 flex items-center justify-between gap-4">
              <div className="flex items-center justify-center shrink-0">
                <img src={LUWU_LOGO_BASE64} style={{ width: "40px", height: "40px" }} className="w-10 h-10 object-contain" alt="Logo Luwu" />
              </div>
              <div className="flex-1 text-center font-serif">
                <h2 className="text-sm font-bold tracking-wide uppercase text-slate-950">PEMERINTAH KABUPATEN LUWU</h2>
                <h1 className="text-lg font-extrabold tracking-normal uppercase text-slate-900">DINAS PENANAMAN MODAL DAN PELAYANAN TERPADU SATU PINTU</h1>
                <h3 className="text-[15px] font-bold tracking-normal uppercase text-slate-900">DIRECTORI SMART INVESTASI</h3>
                <p className="text-[9px] font-sans text-slate-600 dark:text-slate-400 italic mt-1 font-medium">
                  Jl. Jenderal Sudirman No. 1, Kota Belopa | Pos 91971 | dpmptsp@luwukab.go.id
                </p>
              </div>
              <div className="h-16 w-16 bg-white border-2 border-slate-900 rounded-lg flex items-center justify-center font-mono font-bold text-center text-[10px] uppercase text-slate-800 leading-none p-1 shrink-0">
                GIS<br />LUWU<br />HUB
              </div>
            </div>

            {/* DOCUMENT METADATA INFO */}
            <div className="flex justify-between items-center text-[11px] font-mono border-b border-slate-200 pb-2">
              <div>Nomor Arsip: <span className="font-bold text-slate-950">DPMPTSP/GIS/LPT/2026-X8</span></div>
              <div>Tanggal Terbit: <span className="font-bold text-slate-950">28 Mei 2026 11:51 UTC</span></div>
            </div>

            {/* A. DISTRICT / KECAMATAN OFFICIALS REPORT */}
            {reportType === "district" && currentDistrict && (
              <div className="flex flex-col gap-6 flex-1">
                {/* Section Header */}
                <div className="text-center">
                  <h4 className="text-xs font-mono font-bold tracking-widest text-emerald-600">LAPORAN SPASIAL WILAYAH</h4>
                  <h2 className="text-xl font-sans font-bold text-slate-900 mt-1 uppercase">Kecamatan {currentDistrict.name}</h2>
                  <div className="h-0.5 w-16 bg-emerald-600 mx-auto mt-2"></div>
                </div>

                {/* Introductory Narration */}
                <p className="text-xs text-slate-600 leading-relaxed font-sans text-justify first-letter:text-2xl first-letter:font-bold first-letter:text-emerald-600">
                  Kabupaten Luwu mendominasi simpul koridor ekonomi di pantai timur Sulawesi Selatan. Laporan ini memberikan analisis integratif khusus untuk wilayah Kecamatan <span className="font-semibold text-slate-900">{currentDistrict.name}</span>, menyangkut kesesuaian lahan, kesiapan infrastruktur logistik trans-Luwu, dan persebaran investasi rill terdaftar.
                </p>

                {/* Key statistics grid (4 Columns) */}
                <div className="grid grid-cols-4 gap-4 bg-slate-50 border border-slate-200/80 p-4 rounded-xl shadow-sm">
                  <div className="flex flex-col gap-1.5 border-r border-slate-200 pr-2">
                    <span className="text-[9px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider font-mono">Luas Wilayah</span>
                    <span className="text-sm font-extrabold font-mono text-slate-900">{formatNumber(currentDistrict.areaHa)} <span className="text-[10px] font-medium font-sans">Ha</span></span>
                    <span className="text-[9px] text-slate-600 dark:text-slate-400 leading-tight">Total Area Kecamatan</span>
                  </div>
                  <div className="flex flex-col gap-1.5 border-r border-slate-200 px-2">
                    <span className="text-[9px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider font-mono">Kerapatan Penduduk</span>
                    <span className="text-sm font-extrabold font-mono text-slate-900">{currentDistrict.density} <span className="text-[10px] font-medium font-sans">jiwa/km²</span></span>
                    <span className="text-[9px] text-slate-600 dark:text-slate-400 leading-tight">Populasi: {formatNumber(currentDistrict.population)}</span>
                  </div>
                  <div className="flex flex-col gap-1.5 border-r border-slate-200 px-2">
                    <span className="text-[9px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider font-mono">Nilai Investasi</span>
                    <span className="text-sm font-extrabold font-mono text-emerald-600">{formatRupiah(districtTotalInvestmentValue)}</span>
                    <span className="text-[9px] text-slate-600 dark:text-slate-400 leading-tight">{districtInvestments.length} Proyek Aktif Terdaftar</span>
                  </div>
                  <div className="flex flex-col gap-1.5 pl-2">
                    <span className="text-[9px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider font-mono">Skor Infrastruktur</span>
                    <span className="text-sm font-extrabold font-mono text-indigo-600">{currentDistrict.infrastructureScore} <span className="text-[10px] font-medium font-sans">/ 10</span></span>
                    <span className="text-[9px] text-slate-600 dark:text-slate-400 leading-tight">Kelayakan logistik</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-2">
                  {/* Left Column: Recharts Chart */}
                  <div className="border border-slate-200/80 p-4 rounded-xl flex flex-col gap-3">
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider font-mono block">Distribusi Sektor Masuk (Miliar IDR)</span>
                    
                    {isSectorDataEmpty ? (
                      <div className="h-48 flex items-center justify-center border border-dashed border-slate-200 rounded-lg text-xs italic text-slate-600 dark:text-slate-400 p-4 text-center">
                        Belum ada investasi terdaftar di sektor apapun dalam unit tata ruang kecamatan ini.
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-48 w-full select-none">
                        <PieChart width={280} height={190}>
                          <Pie
                            data={districtSectorData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={65}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {districtSectorData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={SECTOR_COLORS[entry.name as SektorInvestasi] || "#8d99ae"} 
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: any) => [formatRupiahSingkat(v), "Nilai"]} />
                        </PieChart>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-1.5 border-t border-slate-100 pt-2 text-[10px]">
                      {districtSectorData.map((item, idx) => (
                        <div key={`${item.name}-${idx}`} className="flex items-center gap-1 text-slate-600">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: SECTOR_COLORS[item.name as SektorInvestasi] }}></span>
                          <span className="truncate capitalize">{item.name}:</span>
                          <span className="font-bold font-mono ml-auto">{formatRupiahSingkat(item.value as number)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Comparative Chart */}
                  <div className="border border-slate-200/80 p-4 rounded-xl flex flex-col gap-3">
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider font-mono block">Komparasi Nilai Investasi Antar Kecamatan (Miliar)</span>
                    <div className="h-48 w-full flex items-center justify-center select-none">
                      <BarChart width={290} height={180} data={districtComparisonData} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={8} tickLine={false} stroke="#94a3b8" />
                        <YAxis fontSize={8} tickLine={false} stroke="#94a3b8" />
                        <Tooltip />
                        <Bar dataKey="value" fill="#6366f1">
                          {districtComparisonData.map((entry, idx) => (
                            <Cell key={`bar-${idx}`} fill={entry.name === currentDistrict.name ? "#10b981" : "#6366f1"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </div>
                    <p className="text-[9px] text-slate-600 dark:text-slate-400 leading-normal italic text-center">
                      * Warna hijau mengindikasikan peringkat Kecamatan {currentDistrict.name} dalam skala regional.
                    </p>
                  </div>
                </div>

                {/* Section Content: Map & Vector layout (2 Columns side-by-side) */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Left Column: Map Snapshot */}
                  <div className="border border-slate-200/80 p-3 rounded-xl flex flex-col gap-2 bg-slate-50 relative overflow-hidden">
                    <span className="text-[9px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider font-mono block">Citra Navigasi Kartografis Map</span>
                    <div className="h-32 border border-slate-200 rounded-lg bg-white overflow-hidden relative flex items-center justify-center">
                      {mapSnapshotUrl ? (
                        <img 
                          src={mapSnapshotUrl} 
                          alt="Peta Spasial" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4 text-center text-[10px] text-slate-600 dark:text-slate-400">
                          <Loader2 className="h-4 w-4 animate-spin text-emerald-500 mb-1" />
                          <span>Merekam citra satelit rill...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Blueprint schematic */}
                  <div className="border border-slate-200/80 p-3 rounded-xl flex flex-col gap-2 bg-slate-50 relative overflow-hidden">
                    <span className="text-[9px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider font-mono block">Blueprint Teknis Wilayah</span>
                    <div className="h-32 border border-slate-200 rounded-lg bg-white relative flex items-center justify-center p-2 select-none">
                      <svg viewBox="0 0 400 110" className="w-full h-full text-slate-600 dark:text-slate-400 opacity-85">
                        <line x1="20" y1="55" x2="380" y2="55" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="1" />
                        <line x1="200" y1="10" x2="200" y2="100" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="1" />
                        <circle cx="200" cy="55" r="40" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2 2" />
                        <circle cx="200" cy="55" r="15" fill="none" stroke="#cbd5e1" strokeWidth="1" />
                        <circle cx="200" cy="55" r="2" fill="#ef4444" />
                        <polygon points="170,35 240,30 250,75 190,85 150,65" fill="rgba(16, 185, 129, 0.08)" stroke="#10b981" strokeWidth="1.5" />
                        <circle cx="170" cy="35" r="3.5" fill="#06b6d4" />
                        <circle cx="240" cy="30" r="3.5" fill="#f59e0b" />
                        <circle cx="190" cy="85" r="3.5" fill="#f43f5e" />
                        <text x="202" y="52" fontSize="7" fontFamily="monospace" fill="#ef4444">CENTER [{currentDistrict?.coordinates ? `${(Number(currentDistrict.coordinates[0]) || 0).toFixed(3)}°, ${(Number(currentDistrict.coordinates[1]) || 0).toFixed(3)}°` : '-3.273°, 120.265°'}]</text>
                        <text x="5" y="15" fontSize="6.5" fontFamily="monospace" fill="#64748b">SKALA SPASIAL: 1 : 125,000</text>
                        <text x="5" y="25" fontSize="6.5" fontFamily="monospace" fill="#64748b">REKAYASA SPASIAL: TURF.JS ENGINE</text>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Proyek list in district */}
                <div className="flex flex-col gap-2 mt-auto">
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider font-mono block">Daftar Proyek Investasi Terdaftar di Wilayah Ini ({districtInvestments.length})</span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-[10px] border-collapse bg-white">
                      <thead>
                        <tr className="bg-slate-900 text-white font-mono uppercase text-[8.5px]">
                          <th className="p-2 border-b border-slate-800">Nama Proyek</th>
                          <th className="p-2 border-b border-slate-800">Sektor</th>
                          <th className="p-2 border-b border-slate-800">Luas Kerja</th>
                          <th className="p-2 border-b border-slate-800">Peluang Investasi</th>
                          <th className="p-2 border-b border-slate-800">Narahubung PIC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {districtInvestments.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-4 text-center italic text-slate-600 dark:text-slate-400 bg-slate-50/50">
                              Tidak ada potensi investasi terdaftar di kecamatan ini.
                            </td>
                          </tr>
                        ) : (
                          districtInvestments.slice(0, 5).map((inv, idx) => (
                            <tr key={`${inv.id}-${idx}`} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"}>
                              <td className="p-2 font-semibold text-slate-900 truncate max-w-[150px]">{inv.name}</td>
                              <td className="p-2 font-mono capitalize">{inv.sector}</td>
                              <td className="p-2 font-mono">{inv.areaHa} Ha</td>
                              <td className="p-2 font-bold text-emerald-600 font-mono">{formatRupiah(inv.investmentValue)}</td>
                              <td className="p-2 text-slate-600 dark:text-slate-400 font-mono truncate max-w-[120px]">{inv.contactPic} ({inv.phoneNumber})</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer validation stamp */}
                <div className="border-t border-slate-100 pt-6 flex justify-between items-end mt-auto text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                  <div>
                    <p>DINAS PENANAMAN MODAL DAN PTSP KAB. LUWU</p>
                    <p className="text-[8px]">Dokumen Otentik Terverifikasi Sistem Informasi Geografis Terpadu</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <div className="h-10 w-10 border border-slate-200/80 bg-slate-50 rounded flex items-center justify-center text-[7px] text-center font-bold p-1 border-emerald-500/30 text-emerald-600">
                      APPROVED GIS
                    </div>
                    <span>DPMPTSP-LUWU-SIG</span>
                  </div>
                </div>
              </div>
            )}

            {/* B. INVESTMENT / PROYEK OFFICIALS REPORT */}
            {reportType === "investment" && currentInvestment && (
              <div className="flex flex-col gap-6 flex-1">
                {/* Section Header */}
                <div className="text-center">
                  <h4 className="text-xs font-mono font-bold tracking-widest text-emerald-600 font-sans">ARSIP PENDAFTARAN INVESTASI RILL</h4>
                  <span className="bg-indigo-100 text-indigo-700 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 mt-2 inline-block rounded-md">
                    Sektor {currentInvestment.sector}
                  </span>
                  <h2 ref={investmentTitleRef} className="text-lg font-sans font-extrabold text-slate-900 mt-1 uppercase max-w-lg mx-auto leading-snug">{currentInvestment.name}</h2>
                  <div className="h-0.5 w-16 bg-emerald-650 mx-auto mt-2"></div>
                </div>

                {/* Investment Meta Main Info Block */}
                <div className="bg-slate-950 text-white p-5 rounded-2xl shadow-xl flex gap-6 relative overflow-hidden items-center border border-slate-800">
                  <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
                  
                  {/* Visual Layout Map Image fallback */}
                  <img
                    src={currentInvestment.photoUrl || "https://images.unsplash.com/photo-1590496794008-383c8070b257"}
                    referrerPolicy="no-referrer"
                    alt={currentInvestment.name}
                    className="w-28 h-20 rounded-xl object-cover shrink-0 border border-slate-850 bg-slate-900"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = "https://images.unsplash.com/photo-1590496794008-383c8070b257";
                    }}
                  />

                  <div className="flex-1 flex flex-col gap-1 hover:brightness-110 transition-all font-sans">
                    <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider font-mono">Peluang Nilai Pembiayaan</span>
                    <h3 className="text-lg font-extrabold font-mono text-white leading-none">{formatRupiah(currentInvestment.investmentValue)}</h3>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono mt-1 leading-relaxed">
                      Kebutuhan Lahan Kerja: <span className="text-amber-700 dark:text-amber-400 font-bold">{isNaN(Number(currentInvestment.areaHa)) ? currentInvestment.areaHa : Number(currentInvestment.areaHa).toFixed(2)} Hektar</span> dengan sertifikasi <span className="font-semibold text-white">{currentInvestment.landStatus}</span>.
                    </p>
                  </div>
                </div>

                {/* Details list grid structure */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column: Geographical Details */}
                  <div className="border border-slate-200/80 p-4 rounded-xl flex flex-col gap-3">
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider font-mono block">Letak Koordinat & Administrasi Wilayah</span>
                    
                    <div className="flex flex-col gap-2 text-[10.5px]">
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-550 font-sans">Kecamatan:</span>
                        <span className="font-semibold text-slate-900 font-mono">
                          {districts.find(d => d.id === currentInvestment.districtId)?.name || 'Kecamatan Luwu'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-550 font-sans">Desa / Kelurahan:</span>
                        <span className="font-semibold text-slate-900 font-mono">
                          {villages.find(v => v.id === currentInvestment.villageId)?.name || 'Belum Terpetakan'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-550 font-sans">Latitude (Garis Lintang):</span>
                        <span className="font-bold text-slate-900 font-mono">{(Number(currentInvestment?.latitude) || 0).toFixed(6)}° S</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-550 font-sans">Longitude (Garisbujur):</span>
                        <span className="font-bold text-slate-900 font-mono">{(Number(currentInvestment?.longitude) || 0).toFixed(6)}° E</span>
                      </div>
                    </div>

                    {/* Integrated Logistics indicators */}
                    <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-lg flex flex-col gap-1.5">
                      <span className="text-[9px] text-indigo-700 font-bold uppercase tracking-wider font-mono block">Analisis Logistik Terakreditasi {(currentInvestmentLogistics as any)?.isPgRouting ? '(PgRouting Akurat)' : '(Estimasi Euclidean)'}</span>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-slate-600 dark:text-slate-400 block text-[8.5px] uppercase font-mono leading-none">Ke Bandara Bua</span>
                          <span className="font-bold font-mono text-indigo-700">{(currentInvestmentLogistics as any)?.distToAirportKm ?? 0} KM</span>
                        </div>
                        <div>
                          <span className="text-slate-600 dark:text-slate-400 block text-[8.5px] uppercase font-mono leading-none">Ke Pelabuhan Ulo-Ulo</span>
                          <span className="font-bold font-mono text-indigo-700">{currentInvestmentLogistics?.distToPortKm ?? 0} KM</span>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-slate-200">
                          <span className="text-slate-600 dark:text-slate-400 block text-[8.5px] uppercase font-mono leading-none">Akses Arterial Nasional</span>
                          <span className="font-bold font-mono text-indigo-700">{currentInvestmentLogistics?.distToRoadKm ?? 0} KM</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Comparison with sector average */}
                  <div className="border border-slate-200/80 p-4 rounded-xl flex flex-col gap-3">
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider font-mono block">Proporsi Valuasi Terhadap Rata-Rata Sektor</span>
                    
                    <div className="h-32 w-full flex items-center justify-center select-none mt-2">
                      <BarChart width={290} height={140} data={[
                        { name: "Proyek Ini", value: Math.round((currentInvestment?.investmentValue || 0) / 1e9) },
                        { name: `Rata-rata ${currentInvestment?.sector || 'Sektor'}`, value: Math.round((averageValueInSector || 0) / 1e9) }
                      ]} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={9} tickLine={false} stroke="#94a3b8" />
                        <YAxis fontSize={9} tickLine={false} stroke="#94a3b8" />
                        <Tooltip />
                        <Bar dataKey="value" fill="#f59e0b">
                          <Cell fill="#ef4444" />
                          <Cell fill="#64748b" />
                        </Bar>
                      </BarChart>
                    </div>

                    <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-normal text-justify">
                      Proyek ini memiliki nilai taksiran investasi sebesar <span className="font-semibold text-slate-900">{formatRupiah(currentInvestment?.investmentValue || 0)}</span>, dibandingkan dengan angka mean sektoral regional yang berada di tingkat <span className="font-semibold text-slate-900">{formatRupiah(averageValueInSector || 0)}</span>.
                    </p>
                    
                    {currentInvestment?.smartData?.financials?.[0] && (
                      <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-lg flex flex-col gap-1.5 mt-2">
                        <span className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider font-mono block">Kelayakan Finansial (ROI) - Database</span>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <span className="text-slate-600 dark:text-slate-400 block text-[8.5px] uppercase font-mono leading-none">Proyeksi ROI</span>
                            <span className="font-bold font-mono text-emerald-700">{currentInvestment.smartData.financials[0].roi || 0}%</span>
                          </div>
                          <div>
                            <span className="text-slate-600 dark:text-slate-400 block text-[8.5px] uppercase font-mono leading-none">NPV Estimasi</span>
                            <span className="font-bold font-mono text-emerald-700">
                              Rp {(((currentInvestment.smartData.financials[0].npv || currentInvestment.smartData.financials[0].npv_estimasi || 0) / 1e9)).toFixed(1)} Miliar
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-600 dark:text-slate-400 block text-[8.5px] uppercase font-mono leading-none">IRR</span>
                            <span className="font-bold font-mono text-emerald-700">{currentInvestment.smartData.financials[0].irr || 0}%</span>
                          </div>
                          <div>
                            <span className="text-slate-600 dark:text-slate-400 block text-[8.5px] uppercase font-mono leading-none">Payback Period</span>
                            <span className="font-bold font-mono text-emerald-700">{currentInvestment.smartData.financials[0].payback_period || 0} Tahun</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Spatial Blueprint of single coordinate Node (2 Columns side-by-side) */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Left Column: Map Snapshot */}
                  <div className="border border-slate-200/80 p-3 rounded-xl flex flex-col gap-2 bg-slate-50 relative overflow-hidden">
                    <span className="text-[9px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider font-mono block">Plot Lokasi Geografis rill</span>
                    <div className="h-32 border border-slate-200 rounded-lg bg-white overflow-hidden relative flex items-center justify-center">
                      {mapSnapshotUrl ? (
                        <img 
                          src={mapSnapshotUrl} 
                          alt="Peta Proyek" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4 text-center text-[10px] text-slate-600 dark:text-slate-400">
                          <Loader2 className="h-4 w-4 animate-spin text-emerald-500 mb-1" />
                          <span>Merekam titik letak proyek...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Blueprint schematic */}
                  <div className="border border-slate-200/80 p-3 rounded-xl flex flex-col gap-2 bg-slate-50 relative overflow-hidden">
                    <span className="text-[9px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider font-mono block">Situs Plot Spasial Node</span>
                    <div className="h-32 border border-slate-200 rounded-lg bg-white relative flex items-center justify-center p-2 select-none font-sans">
                      <svg viewBox="0 0 400 110" className="w-full h-full text-slate-600 dark:text-slate-400 opacity-85">
                        <line x1="200" y1="10" x2="200" y2="100" stroke="#6366f1" strokeOpacity="0.3" strokeWidth="1" />
                        <line x1="10" y1="55" x2="390" y2="55" stroke="#6366f1" strokeOpacity="0.3" strokeWidth="1" />
                        <circle cx="200" cy="55" r="30" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                        <circle cx="200" cy="55" r="10" fill="rgba(99, 102, 241, 0.05)" stroke="#6366f1" strokeWidth="1.5" />
                        
                        {/* Location node label and pin */}
                        <path d="M200,43 C194,43 190,47 190,53 C190,59 200,67 200,67 C200,67 210,59 210,53 C210,47 206,43 200,43 Z" fill="#ef4444" />
                        <circle cx="200" cy="51" r="3" fill="#ffffff" />

                        <text x="215" y="52" fontSize="8" fontFamily="monospace" fill="#ef4444" fontWeight="bold">TARGET AREA ID: [{currentInvestment?.id || '-'}]</text>
                        <text x="215" y="63" fontSize="7" fontFamily="sans-serif" fill="#1e293b">{String(currentInvestment?.name || 'PROYEK').toUpperCase()}</text>
                        
                        <text x="5" y="15" fontSize="6.5" fontFamily="monospace" fill="#64748b">LINTANG LUAT: {(Number(currentInvestment?.latitude) || 0).toFixed(5)}° S</text>
                        <text x="5" y="25" fontSize="6.5" fontFamily="monospace" fill="#64748b">BUJUR TIMUR: {(Number(currentInvestment?.longitude) || 0).toFixed(5)}° E</text>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Government Official Official Contact details information */}
                <div className="bg-emerald-50/50 border border-emerald-500/20 p-5 rounded-xl flex flex-col gap-2">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider font-mono block">Narahubung & Pemerintah Daerah Pembina</span>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider font-mono">Dinas Penanggungjawab / Kepala PIC</span>
                        <span className="font-semibold text-slate-800 font-sans">{currentInvestment.contactPic}</span>
                        <span className="text-[9px] text-slate-600 dark:text-slate-400">DPMPTSP Bidang Hubungan Luar & CSR</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider font-mono">Telepon Direktori</span>
                        <span className="font-bold text-slate-800 font-mono">{currentInvestment.phoneNumber}</span>
                        <span className="text-[9px] text-indigo-600 underline cursor-pointer font-sans">Hubungi Layanan Terpadu Satu Pintu</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer validation stamp */}
                <div className="border-t border-slate-100 pt-6 flex justify-between items-end mt-auto text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                  <div>
                    <p>DINAS PENANAMAN MODAL DAN PTSP KAB. LUWU</p>
                    <p className="text-[8px]">Halaman ini dikeluarkan sebagai bagian dari Izin Spasial Pendahuluan (ISP)</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <div className="h-10 w-10 border border-slate-200 bg-slate-50 rounded flex items-center justify-center text-[7px] text-center font-bold p-1 border-emerald-500/30 text-emerald-650">
                      OFFICIAL PORTAL
                    </div>
                    <span>DPMPTSP-INVESTASI-LUWU</span>
                  </div>
                </div>
              </div>
            )}
            
          </div>
          </div>

        </div>

      </motion.div>
    </motion.div>
  );
}

// hotfix: active polling for pdf canvas