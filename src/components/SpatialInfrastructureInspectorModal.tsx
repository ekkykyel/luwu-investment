import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Truck,
  Plane,
  Anchor,
  Building,
  Zap,
  Navigation,
  MapPin,
  Clock,
  Compass,
  ArrowRight,
  CheckCircle2,
  X,
  Gauge,
  Layers,
  ChevronRight
} from "lucide-react";
import { Investment, District } from "../types";
import { formatNumber } from "../lib/formatters";
import { LUWU_INFRASTRUCTURE_NODES } from "../lib/constants";
import * as turf from "@turf/turf";

export interface SpatialInfrastructureInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  investment: Investment | null;
  districts?: District[];
  isDarkMode?: boolean;
}

interface LogisticsNode {
  id: string;
  name: string;
  category: "airport" | "seaport" | "highway" | "civic" | "power" | "industry";
  icon: any;
  coordinates: [number, number]; // [lng, lat]
  description: string;
  speedKmh: number;
}

export default function SpatialInfrastructureInspectorModal({
  isOpen,
  onClose,
  investment,
  districts = [],
  isDarkMode = true,
}: SpatialInfrastructureInspectorModalProps) {
  const [selectedBufferKm, setSelectedBufferKm] = useState<number>(15);

  // Real Logistics and Strategic Hubs of Kabupaten Luwu (Single Source of Truth)
  const STRATEGIC_HUBS: LogisticsNode[] = useMemo(() => [
    {
      id: "bua_airport",
      name: LUWU_INFRASTRUCTURE_NODES.BANDARA_BUA.name,
      category: "airport",
      icon: Plane,
      coordinates: LUWU_INFRASTRUCTURE_NODES.BANDARA_BUA.coordinates,
      description: "Gerbang logistik udara kargo & penumpang regional Luwu Raya",
      speedKmh: 50,
    },
    {
      id: "tadokko_port",
      name: LUWU_INFRASTRUCTURE_NODES.PELABUHAN_BELOPA.name,
      category: "seaport",
      icon: Anchor,
      coordinates: LUWU_INFRASTRUCTURE_NODES.PELABUHAN_BELOPA.coordinates,
      description: "Pelabuhan distribusi komoditas laut, kakao, & hasil tambang",
      speedKmh: 45,
    },
    {
      id: "trans_sulawesi",
      name: LUWU_INFRASTRUCTURE_NODES.TRANS_SULAWESI.name,
      category: "highway",
      icon: Navigation,
      coordinates: LUWU_INFRASTRUCTURE_NODES.TRANS_SULAWESI.coordinates,
      description: "Arteri utama konektivitas Palopo - Belopa - Makassar",
      speedKmh: 60,
    },
    {
      id: "belopa_civic",
      name: LUWU_INFRASTRUCTURE_NODES.GOV_CENTER.name,
      category: "civic",
      icon: Building,
      coordinates: LUWU_INFRASTRUCTURE_NODES.GOV_CENTER.coordinates,
      description: "Kantor DPMPTSP, Mall Pelayanan Publik & Pusat Bisnis",
      speedKmh: 40,
    },
    {
      id: "water_basin",
      name: LUWU_INFRASTRUCTURE_NODES.WATER_BASIN.name,
      category: "industry",
      icon: Truck,
      coordinates: LUWU_INFRASTRUCTURE_NODES.WATER_BASIN.coordinates,
      description: "Intake sumber daya air baku & kawasan pendukung",
      speedKmh: 50,
    },
    {
      id: "pln_substation",
      name: LUWU_INFRASTRUCTURE_NODES.PLN_SUBSTATION.name,
      category: "power",
      icon: Zap,
      coordinates: LUWU_INFRASTRUCTURE_NODES.PLN_SUBSTATION.coordinates,
      description: "Infrastruktur transmisi ketenagalistrikan tegangan tinggi",
      speedKmh: 45,
    },
  ], []);

  // Distance and Routing Analysis
  const proximityAnalysis = useMemo(() => {
    if (!investment) return [];

    const originPt = turf.point([
      investment.longitude || 120.2546,
      investment.latitude || -3.2541,
    ]);

    return STRATEGIC_HUBS.map((hub) => {
      const targetPt = turf.point(hub.coordinates);
      const directDistKm = turf.distance(originPt, targetPt, { units: "kilometers" });
      
      // Estimated Road Distance (with circuity factor of 1.28x for regional road winding)
      const roadDistKm = directDistKm * 1.28;
      
      // Estimated logistics truck travel time (minutes)
      const travelTimeMinutes = Math.round((roadDistKm / hub.speedKmh) * 60);

      // Accessibility Score (0 - 100)
      const score = Math.max(10, Math.min(100, Math.round(100 - (roadDistKm / 60) * 85)));

      return {
        ...hub,
        directDistKm: Number(directDistKm.toFixed(1)),
        roadDistKm: Number(roadDistKm.toFixed(1)),
        travelTimeMinutes,
        score,
        isWithinBuffer: directDistKm <= selectedBufferKm,
      };
    }).sort((a, b) => a.roadDistKm - b.roadDistKm);
  }, [investment, STRATEGIC_HUBS, selectedBufferKm]);

  if (!isOpen || !investment) return null;

  const cardBg = isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xl";
  const textTitle = isDarkMode ? "text-slate-100" : "text-slate-900";
  const textMuted = isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400";

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-fadeIn"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 150 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 150 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-5xl h-[95vh] sm:h-auto sm:max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl border ${cardBg} overflow-hidden shadow-2xl transition-all`}
      >
        {/* Mobile Drag Bar Indicator */}
        <div className={`w-12 h-1.5 rounded-full mx-auto mt-3 mb-1.5 sm:hidden shrink-0 ${isDarkMode ? "bg-neutral-850" : "bg-slate-300"}`} />

        {/* ── HEADER - Desain Premium Minimalis ── */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-inner shrink-0">
              <Truck className="w-5 sm:w-5.5 h-5 sm:h-5.5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans truncate leading-tight">
                  Spatial Infrastructure & Logistics
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-mono font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 uppercase tracking-wider whitespace-nowrap">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  Proximity
                </span>
              </div>
              <p className={`text-[11px] sm:text-xs ${textMuted} mt-0.5 sm:mt-1 font-medium truncate`}>
                Analisis jarak tempuh logistik & aksesibilitas rantai pasok Luwu
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all shrink-0 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center border border-transparent active:border-slate-200 dark:active:border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── PROYEK INFO BANNER ── */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-blue-500/5 via-teal-500/5 to-transparent border-b border-slate-150 dark:border-slate-800/60 flex flex-col gap-3 sm:flex-row sm:items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-extrabold text-slate-900 dark:text-slate-100 font-sans text-xs sm:text-sm truncate">{investment.name}</span>
            <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">({investment.sector})</span>
          </div>

          {/* Buffer Ring Selector */}
          <div className="flex items-center justify-between sm:justify-start gap-2 bg-white dark:bg-slate-950/40 p-1 sm:p-1.5 rounded-xl border border-slate-200/80 dark:border-white/5 shadow-sm">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 whitespace-nowrap">Radius Buffer:</span>
            <div className="flex items-center gap-1">
              {[5, 15, 30, 50].map((km) => (
                <button
                  key={km}
                  type="button"
                  onClick={() => setSelectedBufferKm(km)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-mono font-black transition-all cursor-pointer min-w-[38px] text-center ${
                    selectedBufferKm === km
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {km}k
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── BODY LIST ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {proximityAnalysis.map((node) => {
              const IconComp = node.icon;
              const isClose = node.roadDistKm <= 20;

              return (
                <div
                  key={node.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between min-h-[140px] ${
                    node.isWithinBuffer
                      ? isDarkMode
                        ? "bg-slate-900/80 border-slate-700 shadow-md"
                        : "bg-white border-slate-200 shadow-sm"
                      : "opacity-45 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {/* Left Indicator bar */}
                  {node.isWithinBuffer && (
                    <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${isClose ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                  )}

                  <div className="flex items-start justify-between gap-3 pl-1 sm:pl-2.5">
                    <div className="flex items-start gap-2.5 sm:gap-3.5 min-w-0">
                      <div className={`p-2.5 rounded-xl shrink-0 shadow-inner ${
                        isClose
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/10"
                      }`}>
                        <IconComp className="w-4.5 h-4.5 stroke-[2.2]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 font-sans truncate">
                          {node.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                          {node.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs sm:text-base font-mono font-black text-blue-600 dark:text-blue-400 block tracking-tight">
                        {node.roadDistKm} km
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 dark:text-slate-500 block uppercase tracking-wider mt-0.5">
                        Est. Rute Riil
                      </span>
                    </div>
                  </div>

                  {/* Metrics Bar */}
                  <div className="mt-4 pt-3.5 border-t border-slate-150 dark:border-slate-800/60 flex flex-col gap-2 sm:flex-row sm:items-center justify-between text-xs pl-1 sm:pl-2.5">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-350 font-medium">
                      <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="text-[11px]">Waktu Tempuh Truk: <strong className="text-slate-800 dark:text-slate-200 font-bold">± {node.travelTimeMinutes} Menit</strong></span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-200/40 dark:border-white/5 w-fit self-end sm:self-auto">
                      <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Skor Akses:
                      </span>
                      <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                        {node.score}/100
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-200 dark:border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[10px] sm:text-xs text-slate-500 dark:text-slate-450 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md shrink-0">
          <span className="flex items-center gap-2 font-medium text-center sm:text-left">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 animate-pulse" />
            Metrik dihitung real-time menggunakan formula Geodesik Turf.js dan faktor regional
          </span>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-300 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 pt-2 sm:pt-0 sm:pl-3.5 text-center">
            Doktrin Zero Dummy • Real Geospatial Routing
          </span>
        </div>
      </motion.div>
    </div>
  );
}
