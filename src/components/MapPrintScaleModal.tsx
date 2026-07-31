import { motion } from "motion/react";
import React, { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import { safeHtml2Canvas, pdfRenderQueue, waitForDomAndIdle } from "../lib/html2canvasShim.js";
import { X, Download, Map as MapIcon, Loader2, RefreshCw, Layout, FileText } from "lucide-react";
import { LuwuLogo } from "./LuwuLogo.js";

interface MapPrintScaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  scaleOpt?: number;
  setScaleOpt?: (scale: number) => void;
  orientation?: "portrait" | "landscape";
  setOrientation?: (orientation: "portrait" | "landscape") => void;
}

export function calculateZoomForScale(scale: number, lat: number = -3.00, dpi: number = 300) {
  // MapLibre uses EPSG:3857 (Web Mercator)
  const R = 6378137; // Earth's radius in meters
  // Pixels per meter on paper at target DPI
  const pixelsPerMeter = dpi / 0.0254; // 1 inch = 0.0254 meters
  // Real ground meters per pixel on the map canvas
  const metersPerPixelAtTargetScale = scale / pixelsPerMeter;
  // Calculate zoom level using Web Mercator math
  const zoom = Math.log2((2 * Math.PI * R * Math.cos(lat * Math.PI / 180)) / (256 * metersPerPixelAtTargetScale));
  return zoom;
}

export function calculateZoomForCanvasWidth(scale: number, canvasWidth: number, orientation: "portrait" | "landscape" = "landscape", lat: number = -3.00) {
  const R = 6378137; // Earth's radius in meters
  // Total map box width on paper in meters:
  // In portrait: 189.9118 mm = 0.1899118 meters
  // In landscape: 278.8 mm = 0.2788 meters (margins considered)
  const mapBoxWidthPaperMeters = orientation === "portrait" ? 0.1899118 : 0.2788;
  const totalGroundMeters = mapBoxWidthPaperMeters * scale;
  const metersPerPixel = totalGroundMeters / canvasWidth;
  const zoom = Math.log2((2 * Math.PI * R * Math.cos(lat * Math.PI / 180)) / (256 * metersPerPixel));
  return zoom;
}

export default function MapPrintScaleModal({ 
  isOpen, 
  onClose, 
  title = "Peta Cetak",
  scaleOpt: parentScaleOpt,
  setScaleOpt: parentSetScaleOpt,
  orientation: parentOrientation,
  setOrientation: parentSetOrientation
}: MapPrintScaleModalProps) {
  const [localScaleOpt, localSetScaleOpt] = useState<number>(25000);
  const [localOrientation, localSetOrientation] = useState<"portrait" | "landscape">("landscape");

  // Sync state between parent (lifted) or local fallback
  const scaleOpt = parentScaleOpt !== undefined ? parentScaleOpt : localScaleOpt;
  const setScaleOpt = parentSetScaleOpt !== undefined ? parentSetScaleOpt : localSetScaleOpt;
  const orientation = parentOrientation !== undefined ? parentOrientation : localOrientation;
  const setOrientation = parentSetOrientation !== undefined ? parentSetOrientation : localSetOrientation;

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

  const [isCapturing, setIsCapturing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [containerWidth, setContainerWidth] = useState(576);
  const printLayoutRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => {
      if (wrapperRef.current) {
        setContainerWidth(wrapperRef.current.clientWidth);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    const timer = setTimeout(handleResize, 150);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, [isOpen, orientation]);

  const captureMap = async () => {
    setIsCapturing(true);
    try {
      const map = (window as any).globalLuwuMapInstance;
      let snapDataUrl = "";
      if (map) {
        const canvas = map.getCanvas();
        const screenCanvasWidth = map.getContainer()?.clientWidth || canvas?.clientWidth || (canvas?.width ? canvas.width / (window.devicePixelRatio || 1) : 800);
        
        // Enforce computed scale zoom level dynamically depending on selected orientation
        const targetZoom = calculateZoomForCanvasWidth(scaleOpt, screenCanvasWidth, orientation, -3.00);
        map.jumpTo({ zoom: targetZoom });

        // Trigger repaint and wait for idle/frame to ensure WebGL buffer readiness
        await new Promise<void>(resolve => {
          let resolved = false;
          const doCapture = () => {
            if (resolved) return;
            resolved = true;
            try {
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
                  snapDataUrl = temp.toDataURL("image/jpeg", 0.95);
                } else {
                  snapDataUrl = mCanvas.toDataURL("image/png");
                }
              }
            } catch (e) {
              try {
                snapDataUrl = map.getCanvas().toDataURL("image/png");
              } catch (e2) {
                undefined;
              }
            }
            resolve();
          };
          map.once("idle", doCapture);
          map.triggerRepaint();
          setTimeout(doCapture, 1200);
        });
      }

      if (!snapDataUrl || snapDataUrl === "data:," || snapDataUrl.length < 50) {
        const mapEl = document.getElementById("map-parent-container") || document.getElementById("map-canvas") || document.querySelector(".maplibregl-map");
        if (mapEl) {
          try {
            const tempCanvas = await pdfRenderQueue.enqueue(() => safeHtml2Canvas(mapEl as HTMLElement, {
              useCORS: true,
              allowTaint: true,
              logging: false,
              backgroundColor: "#020617"
            }));
            snapDataUrl = tempCanvas.toDataURL("image/jpeg", 0.95);
          } catch (e) {
            undefined;
          }
        }
      }

      if (snapDataUrl && snapDataUrl !== "data:," && snapDataUrl.length >= 50) {
        updateMapSnapshotUrl(snapDataUrl);
      }
    } catch (err) {
      console.error("Failed to capture map:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      captureMap();
    } else {
      updateMapSnapshotUrl(null);
    }
  }, [isOpen, scaleOpt, orientation]);

  const handleDownloadPdf = async () => {
    if (!printLayoutRef.current) return;
    setIsGeneratingPdf(true);
    
    try {
      // Wait 250ms to ensure React updates DOM with transform: scale(1)
      await new Promise(r => setTimeout(r, 250));
      await (document as any).fonts?.ready;

      const targetWidth = orientation === "portrait" ? 794 : 1123;
      const targetHeight = orientation === "portrait" ? 1123 : 794;

      // Render unscaled layout at scale: 2.5 for crisp 300 DPI PDF output
      const elementReady = await waitForDomAndIdle(printLayoutRef.current, 5000);
      const canvas = await pdfRenderQueue.enqueue(() => safeHtml2Canvas(elementReady, {
        scale: 2.5, 
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: targetWidth,
        height: targetHeight,
        windowWidth: targetWidth,
        windowHeight: targetHeight,
        onclone: (_clonedDoc: Document, clonedEl: HTMLElement) => {
          clonedEl.style.transform = "none";
          clonedEl.style.position = "static";
        }
      }));

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      
      // Dynamic orientation configuration for jsPDF
      const pdf = new jsPDF(orientation === "portrait" ? "p" : "l", "mm", "a4");
      const pdfWidth = orientation === "portrait" ? 210 : 297;
      const pdfHeight = orientation === "portrait" ? 297 : 210;

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
      pdf.save(`Peta_Luwu_1_${scaleOpt}_${orientation}.pdf`);

    } catch (error) {
      console.error("PDF generation failed:", error);

    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Dynamic scale bar calculations
  let groundDistanceMeters = 1000;
  let labelUnit = "km";
  let labelMax = "1";
  let labelMid = "0.5";

  if (scaleOpt <= 10000) {
    groundDistanceMeters = 500;
    labelUnit = "m";
    labelMax = "500";
    labelMid = "250";
  } else if (scaleOpt <= 25000) {
    groundDistanceMeters = 1000;
    labelUnit = "km";
    labelMax = "1";
    labelMid = "0.5";
  } else if (scaleOpt <= 50000) {
    groundDistanceMeters = 2000;
    labelUnit = "km";
    labelMax = "2";
    labelMid = "1";
  } else {
    groundDistanceMeters = 5000;
    labelUnit = "km";
    labelMax = "5";
    labelMid = "2.5";
  }

  // Calculate the scale bar percentage width relative to the paper map container
  const mapBoxWidthMm = orientation === "portrait" ? 189.9118 : 278.8;
  const scaleBarWidthMm = (groundDistanceMeters * 1000) / scaleOpt;
  const scaleBarWidthPercent = (scaleBarWidthMm / mapBoxWidthMm) * 100;

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.95, opacity: 0, y: 10 }} 
        transition={{ type: "spring", stiffness: 300, damping: 30 }} 
        className="bg-slate-100 rounded-3xl w-full max-w-5xl max-h-[95vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col lg:flex-row"
      >
        
        {/* LEFT/TOP: Controls Panel */}
        <div className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col p-6 shrink-0 z-10 shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-extrabold font-sans text-slate-800 flex items-center gap-2">
              <MapIcon className="h-5 w-5 text-emerald-600" />
              Cetak Peta A4
            </h2>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col gap-5">
            {/* 1. Orientation Selector */}
            <div>
              <label className="text-[10px] font-bold font-mono tracking-widest uppercase text-slate-500 mb-2 block">
                Orientasi Kertas A4
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setOrientation("landscape")}
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    orientation === "landscape" 
                      ? "bg-white text-emerald-700 shadow-sm" 
                      : "text-slate-600 hover:text-slate-950"
                  }`}
                >
                  <Layout className="h-3.5 w-3.5 rotate-90" />
                  Landscape
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation("portrait")}
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    orientation === "portrait" 
                      ? "bg-white text-emerald-700 shadow-sm" 
                      : "text-slate-600 hover:text-slate-950"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Portrait
                </button>
              </div>
            </div>

            {/* 2. Scale Selector */}
            <div>
              <label className="text-[10px] font-bold font-mono tracking-widest uppercase text-slate-500 mb-2 block">
                Skala Peta (Akurat)
              </label>
              <select 
                value={scaleOpt}
                onChange={(e) => setScaleOpt(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value={10000}>1 : 10,000</option>
                <option value={25000}>1 : 25,000</option>
                <option value={50000}>1 : 50,000</option>
                <option value={100000}>1 : 100,000</option>
              </select>
              <p className="text-[9px] text-slate-400 mt-1.5 leading-relaxed italic">
                * Zoom level diselaraskan otomatis dengan DPI 300 fisik cetak.
              </p>
            </div>

            {/* 3. Manual Refresh Button */}
            <button
              onClick={captureMap}
              disabled={isCapturing}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isCapturing ? 'animate-spin' : ''}`} />
              Segarkan Snapshot
            </button>
          </div>

          <div className="mt-auto pt-6 border-t border-slate-100">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf || !mapSnapshotUrl}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-[0_4px_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer disabled:opacity-50 uppercase tracking-wider"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengolah berkas...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Cetak PDF (300 DPI)
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT/BOTTOM: Beautiful PDF Preview area with realistic paper bounds */}
        <div className="flex-1 bg-slate-800 p-4 lg:p-8 overflow-auto flex items-center justify-center container-preview">
          
          {/* Responsive Paper Wrapper with adaptive aspect ratio */}
          <div 
            ref={wrapperRef}
            className="w-full shrink-0 shadow-2xl relative bg-white mx-auto pointer-events-none select-none overflow-hidden border border-slate-700" 
            style={{ 
              maxWidth: orientation === "portrait" ? "420px" : "640px",
              height: orientation === "portrait" 
                ? `${containerWidth * (1123 / 794)}px` 
                : `${containerWidth * (794 / 1123)}px` 
            }}
          >
               
            {/* The high-DPI hidden layout to be snapshotted by html2canvas */}
            <div 
              ref={printLayoutRef}
              className="absolute top-0 left-0 bg-white flex flex-col overflow-hidden"
              style={{
                boxSizing: "border-box",
                width: orientation === "portrait" ? "794px" : "1123px",
                height: orientation === "portrait" ? "1123px" : "794px",
                padding: "24px",
                border: "4px solid #0f172a",
                transform: isGeneratingPdf ? "scale(1)" : `scale(${orientation === "portrait" ? containerWidth / 794 : containerWidth / 1123})`,
                transformOrigin: "top left",
              }}
            >
              {/* Official Luwu Government Kop / Header */}
              <div className="flex items-center gap-4 border-b-[3px] border-slate-900 pb-2 mb-3 shrink-0">
                <img src="https://i.ibb.co.com/KxKKb5d8/transparant.png" alt="Logo Luwu" className="h-10 w-10 object-contain" crossOrigin="anonymous" />
                <div className="flex-1 text-center font-serif">
                  <h2 className="text-[10px] font-bold tracking-wider uppercase text-slate-950 leading-tight">Pemerintah Kabupaten Luwu</h2>
                  <h1 className="text-xs font-extrabold tracking-widest uppercase text-slate-950 leading-tight mt-0.5">Peta Spasial Integratif</h1>
                </div>
                <div className="h-10 w-16 border border-slate-900 flex flex-col items-center justify-center font-mono text-[7px] font-extrabold leading-tight">
                  <span>SKALA</span>
                  <span className="text-[9px] text-emerald-800">1:{scaleOpt.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Title Area */}
              <div className="text-center mb-2.5 shrink-0">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 font-sans">{title}</h3>
              </div>

              {/* Main Map Box */}
              <div className="flex-1 border border-slate-800 bg-slate-50 relative overflow-hidden flex items-center justify-center">
                {isCapturing ? (
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                    <span className="text-[9px] font-mono font-bold">Sinkronisasi Frame...</span>
                  </div>
                ) : mapSnapshotUrl ? (
                  <img src={mapSnapshotUrl} alt="Map Capture" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[9px] text-slate-400 font-mono">Belum ada tangkapan peta</span>
                )}
                
                {/* Visual Scale Bar */}
                <div 
                  className="absolute bottom-3 left-3 bg-white/95 border border-slate-900 p-1.5 flex flex-col pointer-events-none z-10" 
                  style={{ width: `${Math.max(25, Math.min(65, scaleBarWidthPercent))}%` }}
                >
                  <div className="flex justify-between text-[7px] font-bold text-slate-900 leading-none mb-1 px-0.5">
                    <span>0</span>
                    <span>{labelMid}</span>
                    <span>{labelMax} {labelUnit}</span>
                  </div>
                  <div className="h-2 w-full bg-white border border-slate-900 flex relative">
                    <div className="w-1/4 h-full bg-slate-900 border-r border-slate-900"></div>
                    <div className="w-1/4 h-full bg-white border-r border-slate-900"></div>
                    <div className="w-1/4 h-full bg-slate-900 border-r border-slate-900"></div>
                    <div className="w-1/4 h-full bg-white"></div>
                  </div>
                  <span className="text-[7px] font-extrabold text-slate-900 text-center mt-0.5 uppercase tracking-wider">
                    SKALA 1 : {scaleOpt.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Legend & Meta Information block */}
              <div className="h-20 shrink-0 border-t border-slate-400 mt-2.5 pt-2 flex gap-4">
                <div className="flex-1 border-r border-slate-300 pr-4">
                  <h4 className="text-[8px] font-extrabold uppercase font-sans mb-1 text-slate-900">Legenda Tematik</h4>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 border border-rose-600 bg-rose-500/20 rounded-sm"></div>
                      <span className="text-[7px] font-mono text-slate-700">Batas Administrasi</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 border border-blue-600 bg-blue-500/20 rounded-sm"></div>
                      <span className="text-[7px] font-mono text-slate-700">Area Pesisir & Laut</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-0.5 w-3 bg-orange-500"></div>
                      <span className="text-[7px] font-mono text-slate-700">Jaringan Jalan Raya</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 border border-emerald-600 bg-emerald-500/20 rounded-sm"></div>
                      <span className="text-[7px] font-mono text-slate-700">Tutupan Lahan Hijau</span>
                    </div>
                  </div>
                </div>
                <div className="w-44 flex flex-col justify-end text-[6px] font-mono text-right text-slate-500 leading-tight">
                  <p>Sumber Data:</p>
                  <p className="font-bold text-slate-800 text-[7px]">SIMPURISIANG GIS LUWU</p>
                  <p>Koordinat: WGS 1984 (EPSG:4326)</p>
                  <p>Tanggal: {new Date().toLocaleDateString("id-ID")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </motion.div>
    </motion.div>
  );
}
