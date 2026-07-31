import React, { useMemo, useState } from "react";
import {
  X,
  MapPin,
  Plane,
  Anchor,
  Zap,
  Droplets,
  Truck,
  Building,
  CheckCircle2,
  AlertCircle,
  Navigation,
  ShieldCheck,
  Compass,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { Investment } from "../types.js";
import * as turf from "@turf/turf";
import { useTranslation } from "react-i18next";
import { calculateShortestPathGeoJSON } from "../utils/routeService.js";
import { getHydrologyByDistrictName } from "../utils/luwuHydrology.js";

interface ProximityDistanceMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedInvestment?: Investment | null;
  investments?: Investment[];
  isDark?: boolean;
  simulationContext?: any;
}

// Master Infrastructure Hub Coordinates in Luwu Regency (Synchronized with PostGIS Master GIS Database)
const LUWU_INFRASTRUCTURE_NODES = [
  {
    id: "airport_bua",
    name: "Bandara Lagaligo Bua",
    type: "Transportasi Udara",
    typeKey: "card_air_transport",
    category: "LOGISTICS_HUB",
    coordinates: [120.241323, -3.086338] as [number, number], // [lng, lat] - Synchronized with PostGIS Master DB
    icon: Plane,
    color: "emerald",
    desc: "Akses kargo udara ATR-72, penerbangan bisnis eksekutif & distribusi logistik cepat Luwu Raya",
    descKey: "node_airport_desc",
    capacity: "Landas Pacu 1.400m x 30m · Kapasitas Kargo 15 Ton/hari",
    capacityKey: "node_airport_cap",
    mstClass: "Kelas III (Maks 8 Ton)",
    mstClassKey: "node_airport_class",
  },
  {
    id: "port_belopa",
    name: "Pelabuhan Kargo Tanjung Ringgit & Belopa/Bua",
    type: "Transportasi Laut & Kargo",
    typeKey: "card_sea_transport",
    category: "LOGISTICS_HUB",
    coordinates: [120.397935, -3.386062] as [number, number], // Synchronized with PostGIS Master DB (Pelabuhan Ulo-Ulo Belopa)
    icon: Anchor,
    color: "blue",
    desc: "Dermaga ekspor kontainer komoditas kakao, rumput laut, cengkeh & hasil tambang ke Makassar/Surabaya",
    descKey: "node_port_desc",
    capacity: "Dermaga 5.000 DWT · Kedalaman Kolam 7-9 LWS",
    capacityKey: "node_port_cap",
    mstClass: "Kelas I (Maks 10 Ton MST)",
    mstClassKey: "node_port_class",
  },
  {
    id: "kib_bua",
    name: "Kawasan Industri Bua (KIB) & Zone Logistics",
    nameKey: "node_kib_title",
    type: "Kawasan Industri & Pergudangan",
    typeKey: "card_industrial_zone",
    category: "INDUSTRIAL_ZONE",
    coordinates: [120.225000, -3.080000] as [number, number], // Synchronized with PostGIS Master DB
    icon: Building,
    color: "amber",
    desc: "Pusat hilirisasi industri pengolahan, smelter, cold storage & pergudangan terpadu Luwu",
    descKey: "node_kib_desc",
    capacity: "Lahan Siap Bangun 250 Ha · Fasilitas Integrated Logistics",
    capacityKey: "node_kib_cap",
    mstClass: "Kelas I (Maks 10 Ton MST)",
    mstClassKey: "node_kib_class",
  },
  {
    id: "trans_sulawesi",
    name: "Jalur Utama Trans-Sulawesi (Poros Palopo-Belopa-Makassar)",
    nameKey: "node_road_title",
    type: "Jalan Nasional Class I",
    typeKey: "card_national_road",
    category: "ROAD_NETWORK",
    coordinates: [120.360000, -3.385000] as [number, number], // Synchronized with PostGIS Master DB
    icon: Truck,
    color: "purple",
    desc: "Arteri utama koridor ekonomi distribusi logistik darat lintas pulau Sulawesi",
    descKey: "node_road_desc",
    capacity: "Lebar Perkerasan 7m - 11m · Perkerasan Aspal Hotmix Kelas A",
    capacityKey: "node_road_cap",
    mstClass: "Kelas I (Maks 10 Ton MST)",
    mstClassKey: "node_road_class",
  },
  {
    id: "pln_substation",
    name: "Gardu Induk PLN 150kV Belopa & Bua",
    nameKey: "node_power_title",
    type: "Infrastruktur Energi Listrik",
    typeKey: "card_electricity",
    category: "UTILITY",
    coordinates: [120.358512, -3.391244] as [number, number], // Synchronized with PostGIS Master DB
    icon: Zap,
    color: "amber",
    desc: "Pasokan listrik surplus industri dari sistem interkoneksi jaringan Sulawesi Selatan & Barat",
    descKey: "node_power_desc",
    capacity: "Kapasitas Trafo 2x60 MVA · Ketersediaan Cadangan Daya >40 MW",
    capacityKey: "node_power_cap",
    mstClass: "Sistem Kelistrikan 150kV",
    mstClassKey: "node_power_class",
  },
  {
    id: "water_basin",
    name: "Sumber Air Baku DAS Suso & DAS Suli Luwu",
    nameKey: "node_water_title",
    type: "Sumber Daya Air Industri",
    typeKey: "card_water",
    category: "UTILITY",
    coordinates: [120.280000, -3.320000] as [number, number], // Synchronized with PostGIS Master DB
    icon: Droplets,
    color: "cyan",
    desc: "Debit air permukaan melimpah untuk kebutuhan utilitas pabrik pengolahan & irigasi teknis",
    descKey: "node_water_desc",
    capacity: "Debit Air Baku >1.200 Liter/detik · Kualitas Air Kelas II",
    capacityKey: "node_water_cap",
    mstClass: "DAS Prioritas Nasional",
    mstClassKey: "node_water_class",
  },
  {
    id: "bastem_hub",
    name: "Hub Agropolitan Bastem & Latimojong",
    nameKey: "node_agro_title",
    type: "Pusat Komoditas Hulu",
    typeKey: "card_upstream_commodity",
    category: "INDUSTRIAL_ZONE",
    coordinates: [120.080000, -3.320000] as [number, number], // Synchronized with PostGIS Master DB
    icon: Compass,
    color: "emerald",
    desc: "Sentra pengumpul bahan baku kopi Bastem organik, cengkeh, hortikultura & potensi mineral hulu",
    descKey: "node_agro_desc",
    capacity: "Produksi Kopi & Kakao >12.000 Ton/tahun",
    capacityKey: "node_agro_cap",
    mstClass: "Jalan Kabupaten Kelas III",
    mstClassKey: "node_agro_class",
  },
  {
    id: "gov_center",
    name: "Pusat Pemerintahan & Kantor DPMPTSP Belopa",
    nameKey: "node_gov_title",
    type: "Pusat Perizinan & Administrasi",
    typeKey: "card_admin_center",
    category: "ADMIN",
    coordinates: [120.365479, -3.394829] as [number, number], // Synchronized with PostGIS Master DB (Kantor Bupati Luwu)
    icon: Building,
    color: "rose",
    desc: "Layanan perizinan terpadu, pendampingan investasi VIP & Fast-Track KKPR OSS RBA",
    descKey: "node_gov_desc",
    capacity: "Layanan Terpadu Satu Pintu (PTSP) · Online Single Submission",
    capacityKey: "node_gov_cap",
    mstClass: "Pusat Kota Belopa",
    mstClassKey: "node_gov_class",
  },
];

export default function ProximityDistanceMatrixModal({
  isOpen,
  onClose,
  selectedInvestment,
  investments = [],
  isDark = true,
  simulationContext,
}: ProximityDistanceMatrixModalProps) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [apiSpatialData, setApiSpatialData] = useState<any>(null);

  // Active Project Selection
  const currentInv = useMemo(() => {
    return selectedInvestment || (investments.length > 0 ? investments[0] : null);
  }, [selectedInvestment, investments]);

  // Synchronize with API spatial analysis endpoint for exact PostGIS pgRouting matching
  React.useEffect(() => {
    if (!isOpen || !currentInv?.id || currentInv.id === "undefined" || currentInv.id === "null") {
      setApiSpatialData(null);
      return;
    }
    let isMounted = true;
    fetch(`/api/investments/${encodeURIComponent(currentInv.id)}/spatial-analysis`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (isMounted && data && !data.error) {
          setApiSpatialData(data);
        }
      })
      .catch(() => {
        if (isMounted) setApiSpatialData(null);
      });
    return () => {
      isMounted = false;
    };
  }, [isOpen, currentInv?.id]);

  // Project Coordinates [lng, lat]
  const projectPoint = useMemo(() => {
    if (currentInv && currentInv.longitude && currentInv.latitude) {
      return [Number(currentInv.longitude), Number(currentInv.latitude)] as [number, number];
    }
    // Default Belopa/Bua Luwu center
    return [120.3400, -3.1800] as [number, number];
  }, [currentInv]);

  // Check if project location or destination is in mountain terrain (Bastem / Latimojong / Walenrang Barat)
  const districtName = String(
    (currentInv as any)?.districtName || (currentInv as any)?.districtId || (currentInv as any)?.lokasi || (currentInv as any)?.kecamatan || ""
  ).toLowerCase();
  
  const isMountainLocation =
    districtName.includes("bastem") ||
    districtName.includes("latimojong") ||
    districtName.includes("walenrang barat");

  // Resolve precise District Hydrology & River Basin (DAS) from RPJPD Luwu 2025-2045 with fallback
  const hydrologyData = useMemo(() => {
    const rawDistrict = String(
      (currentInv as any)?.districtName ||
        (currentInv as any)?.districtId ||
        (currentInv as any)?.district ||
        (currentInv as any)?.lokasi ||
        (currentInv as any)?.kecamatan ||
        (currentInv as any)?.spatialSync?.kecamatanMatch ||
        ""
    );
    const rawPotensiName = String(
      (currentInv as any)?.name ||
        (currentInv as any)?.title ||
        (currentInv as any)?.potensi_name ||
        ""
    );
    return getHydrologyByDistrictName(rawDistrict, projectPoint[1], projectPoint[0], rawPotensiName);
  }, [currentInv, projectPoint]);

  // Calculate Real GIS Road Network Distance (Supabase PostGIS/PathFinder) & Travel Estimates
  const distanceMatrixResults = useMemo(() => {
    const projPt = turf.point(projectPoint);

    return LUWU_INFRASTRUCTURE_NODES.map((node) => {
      let activeNode = { ...node };

      if (node.id === "water_basin") {
        activeNode.coordinates = hydrologyData.intakeCoordinates;
        activeNode.name = hydrologyData.hasDirectDas
          ? `Air Baku ${hydrologyData.dasName} (${hydrologyData.riverName})`
          : `Air Baku ${hydrologyData.dasName} (${hydrologyData.riverName}) · Suplesi Kec. ${hydrologyData.neighborFallbackKecamatan}`;
        activeNode.desc = hydrologyData.hasDirectDas
          ? `Ketersediaan air baku dari ${hydrologyData.riverName} di Kec. ${hydrologyData.kecamatanName}. ${hydrologyData.usageSuitability}`
          : `Kec. ${hydrologyData.kecamatanName} menggunakan suplesi ${hydrologyData.riverName} dari kecamatan tetangga terdekat (${hydrologyData.neighborFallbackKecamatan}) berdasarkan RPJPD Luwu 2025-2045. ${hydrologyData.usageSuitability}`;
        activeNode.capacity = `Debit Air Baku: ${hydrologyData.debitCapacity}`;
        activeNode.mstClass = hydrologyData.hasDirectDas
          ? `DAS Resmi Kec. ${hydrologyData.kecamatanName}`
          : `Suplesi DAS Tetangga (${hydrologyData.neighborFallbackKecamatan})`;

        // Remove translation fallback keys so dynamic river & DAS text from RPJPD Luwu is rendered directly
        delete (activeNode as any).nameKey;
        delete (activeNode as any).descKey;
        delete (activeNode as any).capacityKey;
        delete (activeNode as any).mstClassKey;
      }

      const nodePt = turf.point(activeNode.coordinates);
      // Direct Geodesic distance in kilometers
      const distKm = turf.distance(projPt, nodePt, { units: "kilometers" });

      const isMountainNode = activeNode.id === "bastem_hub" || isMountainLocation;
      const roadWindingFactor = isMountainNode ? 1.48 : 1.25; // 1.48 for mountain curves vs 1.25 for coastal flat
      const avgTruckSpeedKmH = isMountainNode ? 32 : 52; // 32 km/h mountain speed vs 52 km/h coastal road
      const freightTariffPerKmPerTon = isMountainNode ? 3000 : 2200; // Rp/ton/km

      // Attempt Real GIS Road Network Calculation via Supabase PostGIS Layer or API sync
      let roadDistKm = distKm * roadWindingFactor;
      let routingMethod: 'NETWORK' | 'ESTIMATED' = 'ESTIMATED';

      // 1. First priority: Check exact PostGIS pgRouting value from API spatial analysis
      if (apiSpatialData?.distances) {
        const d = apiSpatialData.distances;
        if (activeNode.id === "airport_bua" && d.nearestAirport?.distanceKm) {
          roadDistKm = d.nearestAirport.distanceKm;
          routingMethod = d.nearestAirport.isNetworkRouting ? 'NETWORK' : 'ESTIMATED';
        } else if (activeNode.id === "water_basin" && d.nearestWaterSource?.distanceKm) {
          roadDistKm = d.nearestWaterSource.distanceKm;
          routingMethod = d.nearestWaterSource.isNetworkRouting ? 'NETWORK' : 'ESTIMATED';
        } else if (activeNode.id === "port_belopa" && d.nearestPort?.distanceKm) {
          roadDistKm = d.nearestPort.distanceKm;
          routingMethod = d.nearestPort.isNetworkRouting ? 'NETWORK' : 'ESTIMATED';
        } else if (activeNode.id === "pln_substation" && d.nearestPowerGrid?.distanceKm) {
          roadDistKm = d.nearestPowerGrid.distanceKm;
          routingMethod = d.nearestPowerGrid.isNetworkRouting ? 'NETWORK' : 'ESTIMATED';
        } else if (activeNode.id === "gov_center" && d.nearestGovernment?.distanceKm) {
          roadDistKm = d.nearestGovernment.distanceKm;
          routingMethod = d.nearestGovernment.isNetworkRouting ? 'NETWORK' : 'ESTIMATED';
        } else if (activeNode.id === "trans_sulawesi" && d.nearestRoad?.distanceKm) {
          roadDistKm = d.nearestRoad.distanceKm;
          routingMethod = d.nearestRoad.isNetworkRouting ? 'NETWORK' : 'ESTIMATED';
        }
      }

      // 2. Client-side PathFinder calculation fallback using identical GIS master coordinates
      if (routingMethod === 'ESTIMATED') {
        try {
          const networkRoute = calculateShortestPathGeoJSON(
            projectPoint,
            activeNode.coordinates,
            (currentInv as any)?.name || (currentInv as any)?.title || "Lokasi Proyek",
            activeNode.name
          );

          if (networkRoute && networkRoute.method === 'NETWORK' && networkRoute.distanceKm > 0) {
            roadDistKm = networkRoute.distanceKm;
            routingMethod = 'NETWORK';
          }
        } catch (e) {
          // Fallback
        }
      }

      const estMinutes = Math.round((roadDistKm / avgTruckSpeedKmH) * 60);

      // Logistical Efficiency Status for Investors
      let status = "SANGAT_DEKAT";
      let statusColor = "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
      if (roadDistKm > 40) {
        status = "TERJANGKAU";
        statusColor = "text-cyan-400 border-cyan-500/30 bg-cyan-500/10";
      } else if (roadDistKm > 20) {
        status = "CUKUP_DEKAT";
        statusColor = "text-amber-400 border-amber-500/30 bg-amber-500/10";
      }

      // Estimated Freight Transport Cost per Ton (Container 20ft / Fuso 10-Wheeler)
      const estFreightPerTon = Math.round(roadDistKm * freightTariffPerKmPerTon);

      return {
        ...activeNode,
        distKm: Number(distKm.toFixed(1)),
        roadDistKm: Number(roadDistKm.toFixed(1)),
        routingMethod,
        estMinutes,
        status,
        statusColor,
        estFreightPerTon,
        roadWindingFactor,
        avgTruckSpeedKmH,
      };
    });
  }, [projectPoint, isMountainLocation, currentInv, apiSpatialData]);

  // Filtered Results
  const filteredMatrixResults = useMemo(() => {
    if (selectedCategory === "ALL") return distanceMatrixResults;
    return distanceMatrixResults.filter((node) => node.category === selectedCategory);
  }, [distanceMatrixResults, selectedCategory]);

  // Overall Accessibility Score (0 - 100)
  const accessibilityScore = useMemo(() => {
    const avgDist =
      distanceMatrixResults.reduce((acc, r) => acc + r.roadDistKm, 0) /
      distanceMatrixResults.length;
    let score = Math.max(65, Math.min(99, Math.round(100 - avgDist * 0.72)));
    return score;
  }, [distanceMatrixResults]);

  if (!isOpen) return null;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div
      className="fixed inset-0 z-[10005] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-4xl rounded-t-3xl sm:rounded-3xl shadow-2xl border overflow-hidden my-0 sm:my-auto h-[95vh] sm:h-auto sm:max-h-[92vh] flex flex-col ${
          isDark
            ? "bg-black border-neutral-800 text-white"
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        {/* Mobile Drag Bar Indicator */}
        <div className={`w-12 h-1.5 rounded-full mx-auto mt-2 mb-1 sm:hidden shrink-0 ${isDark ? "bg-neutral-800" : "bg-slate-300"}`} />

        {/* Header Banner */}
        <div className={`relative p-3.5 sm:p-5 border-b flex items-center justify-between gap-3 shrink-0 ${
          isDark 
            ? "bg-gradient-to-r from-neutral-950 via-neutral-900 to-black border-amber-500/30" 
            : "bg-gradient-to-r from-slate-100 via-white to-slate-100 border-amber-500/30 text-slate-900"
        }`}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-3 bg-amber-500/10 rounded-2xl border border-amber-500/30 text-amber-500 shrink-0">
              <Navigation size={22} className="sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-0.5">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase border border-amber-500/30 whitespace-nowrap">
                  {t('matrix_badge_realtime', 'Perhitungan Spasial Real-Time (Turf.js)')}
                </span>
                <span className={`text-[10px] sm:text-xs whitespace-nowrap ${isDark ? "text-slate-400" : "text-slate-500"}`}>{t('matrix_network_luwu', 'Jaringan Infrastruktur Luwu')}</span>
              </div>
              <h3 className={`text-sm sm:text-base md:text-lg font-bold tracking-wide leading-snug ${isDark ? "text-white" : "text-slate-900"}`}>
                {t('matrix_title', 'Matriks Aksesibilitas Spasial & Supply Chain Luwu')}
              </h3>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className={`p-2.5 rounded-xl active:scale-95 transition-all cursor-pointer shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center border ${
              isDark 
                ? "bg-neutral-900 active:bg-neutral-800 text-slate-300 hover:text-white border-neutral-800" 
                : "bg-slate-100 active:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-200"
            }`}
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className={`p-3.5 sm:p-5 md:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 scrollbar-thin ${isDark ? "scrollbar-thumb-neutral-800 bg-black" : "scrollbar-thumb-slate-200 bg-slate-50/50"}`}>
          {/* Synchronized Simulation ROI Badge */}
          {simulationContext && (
            <div className={`p-4 rounded-2xl border shadow-lg space-y-3 ${
              isDark 
                ? "bg-gradient-to-r from-blue-950/90 via-neutral-900 to-amber-950/90 border-amber-500/30" 
                : "bg-gradient-to-r from-blue-50 via-amber-50/30 to-indigo-50 border-amber-500/40"
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500 animate-pulse shrink-0" />
                  <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-amber-300" : "text-amber-800"}`}>
                    ⚡ {t('sync_roi_general', 'TERSINKRONISASI DENGAN SIMULASI ROI')}: {simulationContext.name}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 shrink-0">
                  {t('matrix_roi_sync_badge', 'AKSESIBILITAS SUPPLY CHAIN')}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                <div className={`p-2.5 rounded-xl border text-center ${isDark ? "bg-black/80 border-neutral-800" : "bg-white border-slate-200 shadow-xs"}`}>
                  <span className={`text-[9px] block uppercase font-sans ${isDark ? "text-slate-400" : "text-slate-500"}`}>{t('simulated_capex', 'Capex Simulasi')}</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {formatRupiah(simulationContext.capex)}
                  </span>
                </div>
                <div className={`p-2.5 rounded-xl border text-center ${isDark ? "bg-black/80 border-neutral-800" : "bg-white border-slate-200 shadow-xs"}`}>
                  <span className={`text-[9px] block uppercase font-sans ${isDark ? "text-slate-400" : "text-slate-500"}`}>{t('annual_roi', 'ROI Tahunan')}</span>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{(Number(simulationContext.roi) || 0).toFixed(1)}%</span>
                </div>
                <div className={`p-2.5 rounded-xl border text-center ${isDark ? "bg-black/80 border-neutral-800" : "bg-white border-slate-200 shadow-xs"}`}>
                  <span className={`text-[9px] block uppercase font-sans ${isDark ? "text-slate-400" : "text-slate-500"}`}>IRR Proyek</span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300">{(Number(simulationContext.irr) || 0).toFixed(2)}%</span>
                </div>
                <div className={`p-2.5 rounded-xl border text-center ${isDark ? "bg-black/80 border-neutral-800" : "bg-white border-slate-200 shadow-xs"}`}>
                  <span className={`text-[9px] block uppercase font-sans ${isDark ? "text-slate-400" : "text-slate-500"}`}>{t('payback_period', 'BEP Payback')}</span>
                  <span className="text-xs font-bold text-cyan-600 dark:text-cyan-300">{(Number(simulationContext.bep) || 0).toFixed(2)} Thn</span>
                </div>
              </div>

              {/* Logistics Impact Analysis */}
              {(() => {
                const closestHub = distanceMatrixResults[0] || { name: "Bandara Lagaligo Bua / Pelabuhan Belopa", roadDistKm: 12.5, estFreightPerTon: 28000 };
                const estTonsPerYear = simulationContext.capex ? Math.max(100, Math.round(simulationContext.capex / 500000000)) : 500;
                const estAnnualFreightCost = closestHub.estFreightPerTon * estTonsPerYear;
                const opexVal = simulationContext.opex || 1;
                const freightOpexRatio = Math.min(100, ((estAnnualFreightCost / opexVal) * 100)).toFixed(1);

                return (
                  <div className={`p-3 rounded-xl border text-xs leading-relaxed font-sans ${
                    isDark ? "bg-amber-500/10 border-amber-500/20 text-amber-200/90" : "bg-amber-100/80 border-amber-300 text-amber-900"
                  }`}>
                    💡 <strong>{t('matrix_roi_analysis', 'Analisis Konektivitas Spasial pada ROI:')}</strong>{" "}
                    {t('matrix_roi_desc', {
                      distance: `${closestHub.roadDistKm.toFixed(1)} km`,
                      node: closestHub.name,
                      cost: formatRupiah(estAnnualFreightCost),
                      percent: freightOpexRatio,
                      profit: formatRupiah(simulationContext.netProfit || (simulationContext.asumsiPendapatan - simulationContext.opex)),
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Active Project Card */}
          <div className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md ${
            isDark ? "bg-neutral-900/90 border-neutral-800" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                <MapPin size={20} />
              </div>
              <div className="min-w-0">
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {t('matrix_point_title', 'TITIK PROYEK PELUANG INVESTASI')}
                </span>
                <h4 className={`text-xs sm:text-sm font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                  {(currentInv as any)?.name || (currentInv as any)?.title || "Proyek Pilihan Investor"}
                </h4>
                <span className={`text-[11px] block sm:inline ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  Kecamatan {(currentInv as any)?.districtName || (currentInv as any)?.districtId || (currentInv as any)?.lokasi || "Belopa/Bua"} (
                  {projectPoint[1].toFixed(4)}°, {projectPoint[0].toFixed(4)}°)
                </span>
              </div>
            </div>

            <div className={`w-full sm:w-auto px-4 py-2 border border-emerald-500/30 rounded-xl text-left sm:text-right shrink-0 flex sm:block items-center justify-between ${
              isDark ? "bg-black" : "bg-emerald-50/60"
            }`}>
              <span className={`text-[10px] font-bold uppercase ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {t('matrix_score', 'SKOR KONEKTIVITAS SPASIAL')}
              </span>
              <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {accessibilityScore} / 100
              </span>
            </div>
          </div>

          {/* Category Filter Bar - Touch-friendly scrollable */}
          <div className={`p-2.5 sm:p-3 rounded-2xl border flex flex-col sm:flex-row gap-2 sm:items-center ${
            isDark ? "bg-neutral-900/90 border-neutral-800" : "bg-white border-slate-200"
          }`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 px-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              {t('filter_nodes', 'FILTER SIMPUL INFRASTRUKTUR:')}
            </span>
            <div className="overflow-x-auto no-scrollbar flex items-center gap-1.5 snap-x scroll-smooth pb-0.5">
              {[
                { key: "ALL", label: `${t('filter_all', 'Semua Simpul')} (${LUWU_INFRASTRUCTURE_NODES.length})` },
                { key: "LOGISTICS_HUB", label: t('filter_port_airport', 'Pelabuhan & Bandara') },
                { key: "INDUSTRIAL_ZONE", label: t('filter_kib_industrial', 'KIB & Kawasan Industri') },
                { key: "ROAD_NETWORK", label: t('filter_trans_sulawesi', 'Jalan Trans-Sulawesi') },
                { key: "UTILITY", label: t('filter_electricity_water', 'Listrik & Air Bersih') },
                { key: "ADMIN", label: t('filter_gov_center', 'Pusat Pemerintahan') },
              ].map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3 py-2 min-h-[36px] rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer snap-start active:scale-95 shrink-0 ${
                    selectedCategory === cat.key
                      ? "bg-amber-500 text-slate-950 font-bold shadow-md"
                      : isDark 
                        ? "bg-black text-slate-300 hover:text-white border border-neutral-800" 
                        : "bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Distance Matrix Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {filteredMatrixResults.map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all space-y-3 group shadow-sm ${
                    isDark 
                      ? "bg-neutral-900/90 border-neutral-800 hover:border-amber-500/40 text-white" 
                      : "bg-white border-slate-200 hover:border-amber-500/50 text-slate-900"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0 group-hover:bg-amber-500/20 transition-colors">
                        <IconComp size={18} />
                      </div>
                      <div className="min-w-0">
                        <h5 className={`text-xs sm:text-sm font-bold leading-tight transition-colors ${isDark ? "text-white group-hover:text-amber-300" : "text-slate-900 group-hover:text-amber-700"}`}>
                          {(item as any).nameKey ? t((item as any).nameKey, item.name) : item.name}
                        </h5>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                            {t((item as any).typeKey, item.type)}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono font-semibold ${
                            isDark ? "bg-black text-slate-300 border-neutral-800" : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}>
                            {(item as any).mstClassKey ? t((item as any).mstClassKey, item.mstClass) : item.mstClass}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap shrink-0 ${item.statusColor}`}
                    >
                      {item.status === 'SANGAT_DEKAT' ? t('status_very_close', 'SANGAT DEKAT') : t('status_close', 'CUKUP / DEKAT')}
                    </span>
                  </div>

                  <p className={`text-[11px] leading-snug ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    {(item as any).descKey ? t((item as any).descKey, item.desc) : item.desc}
                  </p>

                  {/* Operational Capacity Spec */}
                  <div className={`px-2.5 py-1.5 rounded-xl border text-[10px] flex items-center justify-between ${
                    isDark ? "bg-black/80 border-neutral-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}>
                    <span className={`${isDark ? "text-slate-400" : "text-slate-500"} font-medium`}>{t('metric_operational_capacity', 'Kapasitas Operasional:')}</span>
                    <span className="font-bold text-amber-600 dark:text-amber-300 text-right truncate ml-2">
                      {(item as any).capacityKey ? t((item as any).capacityKey, item.capacity) : item.capacity}
                    </span>
                  </div>

                  <div className={`grid grid-cols-3 gap-1.5 sm:gap-2 pt-2.5 border-t text-center ${isDark ? "border-neutral-800/80" : "border-slate-200"}`}>
                    <div className={`p-2 rounded-xl border ${isDark ? "bg-black border-neutral-800/60" : "bg-slate-50 border-slate-200"}`}>
                      <span className={`text-[9px] font-bold uppercase block whitespace-nowrap ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {t('metric_travel_distance', 'JARAK TEMPUH')}
                      </span>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-300 font-mono block mt-0.5">
                        {item.roadDistKm} km
                      </span>
                      <span className={`text-[9px] block ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        {item.routingMethod === 'NETWORK' 
                          ? '🛣️ Rute GIS Supabase' 
                          : t('metric_direct_distance', { distance: `${item.distKm} km` })}
                      </span>
                    </div>

                    <div className={`p-2 rounded-xl border ${isDark ? "bg-black border-neutral-800/60" : "bg-slate-50 border-slate-200"}`}>
                      <span className={`text-[9px] font-bold uppercase block whitespace-nowrap ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {t('metric_est_trucking', 'ESTIMASI TRUCKING')}
                      </span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-300 font-mono block mt-0.5">
                        {t('metric_minutes', { minutes: item.estMinutes })}
                      </span>
                      <span className={`text-[9px] block ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        {t('metric_speed', { speed: item.avgTruckSpeedKmH })}
                      </span>
                    </div>

                    <div className={`p-2 rounded-xl border ${isDark ? "bg-black border-neutral-800/60" : "bg-slate-50 border-slate-200"}`}>
                      <span className={`text-[9px] font-bold uppercase block whitespace-nowrap ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {t('metric_cost_per_ton', 'BIAYA / TON')}
                      </span>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-300 font-mono block mt-0.5">
                        {formatRupiah(item.estFreightPerTon)}
                      </span>
                      <span className={`text-[9px] block ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        {t('metric_vehicle_type', '(Konteiner/Fuso)')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Infrastructure Advantage & Methodology Card */}
          <div className={`p-4 rounded-2xl border text-xs space-y-3 shadow-lg ${
            isDark 
              ? "bg-gradient-to-br from-black via-neutral-900 to-neutral-950 border-amber-500/30 text-slate-300" 
              : "bg-gradient-to-br from-slate-100 via-white to-slate-100 border-amber-500/30 text-slate-700"
          }`}>
            <div className={`flex items-center gap-2.5 border-b pb-2.5 ${isDark ? "border-neutral-800" : "border-slate-200"}`}>
              <Compass size={20} className="text-amber-500 shrink-0" />
              <div>
                <h5 className={`font-bold text-sm ${isDark ? "text-amber-300" : "text-amber-800"}`}>
                  {t('methodology_title', 'Prinsip Akurasi & Metodologi Kalkulasi Logistik Supply Chain')}
                </h5>
                <span className={`text-[10px] block ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {t('methodology_subtitle', 'Standar Kabupaten Luwu - Dinas Perhubungan & DPMPTSP Luwu')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] leading-relaxed">
              <div className={`space-y-1.5 p-3 rounded-xl border ${isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200"}`}>
                <strong className={`block font-semibold text-xs ${isDark ? "text-white" : "text-slate-900"}`}>
                  {t('method_1_title', '1. Pemodelan Jarak Jaringan Jalan (Road Network Distance)')}
                </strong>
                <p className={isDark ? "text-slate-300" : "text-slate-600"}>
                  {t('method_1_desc', 'Kalkulasi tidak hanya mengukur garis lurus (geodesic Turf.js), tetapi menerapkan Pengali Kelok Jalan (Road Winding Multiplier 1.25x s/d 1.48x) disesuaikan morfologi kontur dataran pantai Bua/Belopa vs perbukitan gunung Bastem/Latimojong.')}
                </p>
              </div>

              <div className={`space-y-1.5 p-3 rounded-xl border ${isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200"}`}>
                <strong className={`block font-semibold text-xs ${isDark ? "text-white" : "text-slate-900"}`}>
                  {t('method_2_title', '2. Estimasi Tarif Fleet Industri & Kecepatan')}
                </strong>
                <p className={isDark ? "text-slate-300" : "text-slate-600"}>
                  {t('method_2_desc', 'Waktu tempuh dihitung berdasarkan kecepatan rata-rata armada barang/kontainer (32 - 52 km/jam) dengan asumsi tarif dasar angkut darat Rp 2.200 - Rp 3.000 / ton / km.')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 sm:px-6 py-3.5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
          isDark ? "bg-black border-neutral-800" : "bg-slate-50 border-slate-200"
        }`}>
          <div className={`flex items-center gap-2 text-[11px] sm:text-xs text-center sm:text-left ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            <ShieldCheck size={15} className="text-amber-500 shrink-0" />
            <span>{t('footer_auto_matrix', 'Matriks Jarak Spasial Otomatis · DPMPTSP Kab. Luwu')}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-3 min-h-[44px] rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs sm:text-xs transition-all cursor-pointer shadow-md text-center flex items-center justify-center active:scale-98"
          >
            {t('btn_done_close', 'Selesai & Tutup')}
          </button>
        </div>
      </div>
    </div>
  );
}

// i18n update: translate DPMPTSP licensing center node
