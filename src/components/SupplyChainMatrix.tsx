import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { motion } from "motion/react";
import { MapPin, Truck, HelpCircle, Activity, Info, Anchor, Navigation } from "lucide-react";
import { Investment, SektorInvestasi } from "../types";
import { formatRupiahSingkat, formatNumber } from "../lib/formatters";
import * as turf from "@turf/turf";

interface SupplyChainMatrixProps {
  investments: Investment[];
  infrastructure?: any[];
  isDarkMode?: boolean;
}

interface InfraNode {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
}

// Actual real infrastructure of Kabupaten Luwu (for fallback if empty or loading)
const REAL_LUWU_INFRASTRUCTURE: InfraNode[] = [
  {
    id: "infra-bandara-bua",
    name: "Bandara Udara I Lagaligo Bua",
    type: "Bandara / Udara",
    latitude: -2.9308,
    longitude: 120.4078,
  },
  {
    id: "infra-pelabuhan-bua",
    name: "Kawasan Pelabuhan Laut Bua / Tanjung Ringgit",
    type: "Pelabuhan / Laut",
    latitude: -2.9925,
    longitude: 120.2104,
  },
  {
    id: "infra-terminal-belopa",
    name: "Terminal Regional Belopa",
    type: "Terminal Darat",
    latitude: -3.3444,
    longitude: 120.2792,
  },
  {
    id: "infra-trans-sulawesi",
    name: "Koridor Jalur Lintas Sulawesi (Belopa)",
    type: "Jalan Nasional",
    latitude: -3.3411,
    longitude: 120.2815,
  },
  {
    id: "infra-ikm-kakao",
    name: "Sentra IKM Pengolahan Kakao Karang-karangan",
    type: "Sentra Logistik",
    latitude: -3.0083,
    longitude: 120.3792,
  }
];

export default function SupplyChainMatrix({
  investments = [],
  infrastructure = [],
  isDarkMode = true,
}: SupplyChainMatrixProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 450 });
  const [hoveredNode, setHoveredNode] = useState<{ id: string; type: "sector" | "infra" | "link" } | null>(null);
  const [activeLinkId, setActiveLinkId] = useState<string | null>(null);

  // Measure container dimensions responsively
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        // Keep a neat aspect ratio, min height 450px
        setDimensions({
          width: Math.max(width, 350),
          height: 450,
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Consolidate infrastructure to use passed-in prop or fallback to real Luwu assets
  const finalInfraList = useMemo(() => {
    if (Array.isArray(infrastructure) && infrastructure.length > 0) {
      // Validate that items have latitude and longitude
      const validInfra = infrastructure.filter(inf => inf && inf.latitude && inf.longitude);
      if (validInfra.length > 0) {
        return validInfra.map(inf => ({
          id: inf.id || `infra-${Math.random().toString(36).substring(2, 9)}`,
          name: inf.name || "Infrastruktur Umum",
          type: inf.type || "Konektivitas",
          latitude: Number(inf.latitude),
          longitude: Number(inf.longitude),
        }));
      }
    }
    return REAL_LUWU_INFRASTRUCTURE;
  }, [infrastructure]);

  // Compute Supply Chain Linkages between investments and nearest infrastructure
  const supplyChainData = useMemo(() => {
    const validInvestments = (Array.isArray(investments) ? investments : []).filter(
      (inv) => inv && inv.latitude && inv.longitude
    );

    if (validInvestments.length === 0 || finalInfraList.length === 0) {
      return { nodes: [], links: [] };
    }

    // Group links
    const links: any[] = [];
    const sectorStats: Record<string, { value: number; projects: number }> = {};

    validInvestments.forEach((inv) => {
      try {
        const invPoint = turf.point([Number(inv.longitude), Number(inv.latitude)]);
        
        // Find nearest infrastructure hub
        let minDistance = Infinity;
        let nearestInfra: any = null;

        finalInfraList.forEach((infra) => {
          try {
            const infraPoint = turf.point([infra.longitude, infra.latitude]);
            const dist = turf.distance(invPoint, infraPoint, { units: "kilometers" });
            if (dist < minDistance) {
              minDistance = dist;
              nearestInfra = infra;
            }
          } catch (e) {
            // Keep looping
          }
        });

        if (nearestInfra) {
          const value = Number(inv.investmentValue) || 10_000_000_000; // fallback default
          const valMiliar = value / 1_000_000_000;
          
          links.push({
            id: `link-${inv.id}-${nearestInfra.id}`,
            sourceId: inv.sector || "Lainnya",
            targetId: nearestInfra.id,
            projectName: inv.name,
            sector: inv.sector,
            distanceKm: minDistance,
            investmentValue: value,
            valMiliar: valMiliar,
            areaHa: Number(inv.areaHa) || 0,
            location: inv.locationName || "Kabupaten Luwu",
          });

          // Aggregate sector stats
          const sector = inv.sector || "Lainnya";
          if (!sectorStats[sector]) {
            sectorStats[sector] = { value: 0, projects: 0 };
          }
          sectorStats[sector].value += value;
          sectorStats[sector].projects += 1;
        }
      } catch (err) {
        // Safe check
      }
    });

    // Left Nodes: Sektor
    const leftNodes = Object.keys(sectorStats).map((sector) => ({
      id: sector,
      name: sector,
      type: "sector",
      totalValue: sectorStats[sector].value,
      projectCount: sectorStats[sector].projects,
    })).sort((a, b) => b.totalValue - a.totalValue);

    // Right Nodes: Infra Hubs (only include hubs that actually have incoming links to prevent layout clutter)
    const activeInfraIds = new Set(links.map((l) => l.targetId));
    const rightNodes = finalInfraList
      .filter((infra) => activeInfraIds.has(infra.id))
      .map((infra) => {
        const connectedValue = links
          .filter((l) => l.targetId === infra.id)
          .reduce((sum, curr) => sum + curr.investmentValue, 0);

        const connectedProjects = links
          .filter((l) => l.targetId === infra.id)
          .length;

        return {
          id: infra.id,
          name: infra.name,
          type: "infra",
          infraType: infra.type,
          totalValue: connectedValue,
          projectCount: connectedProjects,
        };
      }).sort((a, b) => b.totalValue - a.totalValue);

    return { leftNodes, rightNodes, links };
  }, [investments, finalInfraList]);

  // Render SVG D3 logic whenever dimensions or supplyChainData change
  useEffect(() => {
    if (!svgRef.current || supplyChainData.leftNodes.length === 0) return;

    const { leftNodes, rightNodes, links } = supplyChainData;
    const { width, height } = dimensions;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // clear prior layout to render clean slate

    const margin = { top: 30, right: 220, bottom: 30, left: 220 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Y positioning scales for left and right nodes
    const yScaleLeft = d3.scalePoint()
      .domain(leftNodes.map(d => d.id))
      .range([0, chartHeight]);

    const yScaleRight = d3.scalePoint()
      .domain(rightNodes.map(d => d.id))
      .range([0, chartHeight]);

    // Color mapper for investment sectors
    const getSectorColor = (sector: string) => {
      switch (sector) {
        case SektorInvestasi.PERTANIAN: return "#10b981"; // Emerald
        case SektorInvestasi.KELAUTAN: return "#06b6d4"; // Cyan
        case SektorInvestasi.PERTAMBANGAN: return "#f59e0b"; // Amber
        case SektorInvestasi.PARIWISATA: return "#ec4899"; // Pink
        case SektorInvestasi.PERDAGANGAN: return "#3b82f6"; // Blue
        default: return "#8b5cf6"; // Purple
      }
    };

    // Calculate maximum values for scale widths
    const maxVal = d3.max(links, (d) => d.valMiliar) || 1;
    const linkWidthScale = d3.scaleLinear()
      .domain([0, maxVal])
      .range([1.5, 12]); // link thickness between 1.5px and 12px

    // --- DRAW LINKS (BEZIER ALIGNMENT) ---
    const drawBezierLink = (d: any) => {
      const sourceY = yScaleLeft(d.sourceId) || 0;
      const targetY = yScaleRight(d.targetId) || 0;
      const sourceX = 0;
      const targetX = chartWidth;

      const path = d3.path();
      path.moveTo(sourceX, sourceY);
      // Beautiful horizontal bezier curvature handle calculation
      path.bezierCurveTo(chartWidth / 2, sourceY, chartWidth / 2, targetY, targetX, targetY);
      return path.toString();
    };

    // Render flow lines
    const linkPaths = g.selectAll(".supply-link")
      .data(links)
      .enter()
      .append("path")
      .attr("class", "supply-link")
      .attr("d", drawBezierLink)
      .attr("fill", "none")
      .attr("stroke", d => getSectorColor(d.sourceId))
      .attr("stroke-width", d => linkWidthScale(d.valMiliar))
      .attr("stroke-opacity", 0.18)
      .style("cursor", "pointer")
      .style("transition", "stroke-opacity 0.2s ease, stroke-width 0.2s ease")
      .on("mouseover", function (event, d) {
        d3.select(this)
          .attr("stroke-opacity", 0.85)
          .attr("stroke-width", linkWidthScale(d.valMiliar) + 2.5);

        // Notify client state for detail cards
        setActiveLinkId(d.id);
        setHoveredNode({ id: d.id, type: "link" });
      })
      .on("mouseout", function (event, d) {
        d3.select(this)
          .attr("stroke-opacity", 0.18)
          .attr("stroke-width", linkWidthScale(d.valMiliar));

        setActiveLinkId(null);
        setHoveredNode(null);
      });

    // --- DRAW LEFT SECTOR NODES ---
    const leftNodeGroups = g.selectAll(".left-node")
      .data(leftNodes)
      .enter()
      .append("g")
      .attr("class", "left-node")
      .attr("transform", d => `translate(0, ${yScaleLeft(d.id)})`)
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        setHoveredNode({ id: d.id, type: "sector" });
        // Highlight corresponding flow paths
        linkPaths.attr("stroke-opacity", l => l.sourceId === d.id ? 0.85 : 0.04);
      })
      .on("mouseout", () => {
        setHoveredNode(null);
        linkPaths.attr("stroke-opacity", 0.18);
      });

    // Anchor Circle for Sector Nodes
    leftNodeGroups.append("circle")
      .attr("r", 7)
      .attr("fill", d => getSectorColor(d.id))
      .attr("stroke", isDarkMode ? "#020617" : "#ffffff")
      .attr("stroke-width", 2);

    // Text Label for Sector Nodes
    leftNodeGroups.append("text")
      .attr("x", -15)
      .attr("y", 4)
      .attr("text-anchor", "end")
      .attr("fill", isDarkMode ? "#f1f5f9" : "#0f172a")
      .style("font-size", "11px")
      .style("font-weight", "bold")
      .text(d => d.name);

    // Subtext for sector value info
    leftNodeGroups.append("text")
      .attr("x", -15)
      .attr("y", 16)
      .attr("text-anchor", "end")
      .attr("fill", isDarkMode ? "#64748b" : "#64748b")
      .style("font-size", "9px")
      .style("font-family", "monospace")
      .text(d => `${d.projectCount} Potensi • ${formatRupiahSingkat(d.totalValue)}`);


    // --- DRAW RIGHT INFRASTRUCTURE HUB NODES ---
    const rightNodeGroups = g.selectAll(".right-node")
      .data(rightNodes)
      .enter()
      .append("g")
      .attr("class", "right-node")
      .attr("transform", d => `translate(${chartWidth}, ${yScaleRight(d.id)})`)
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        setHoveredNode({ id: d.id, type: "infra" });
        // Highlight corresponding incoming flow paths
        linkPaths.attr("stroke-opacity", l => l.targetId === d.id ? 0.85 : 0.04);
      })
      .on("mouseout", () => {
        setHoveredNode(null);
        linkPaths.attr("stroke-opacity", 0.18);
      });

    // Anchor Circle for Infra Nodes
    rightNodeGroups.append("circle")
      .attr("r", 7)
      .attr("fill", isDarkMode ? "#0ea5e9" : "#0284c7")
      .attr("stroke", isDarkMode ? "#020617" : "#ffffff")
      .attr("stroke-width", 2);

    // Text Label for Infra Nodes (Luwu hub name)
    rightNodeGroups.append("text")
      .attr("x", 15)
      .attr("y", 4)
      .attr("text-anchor", "start")
      .attr("fill", isDarkMode ? "#f1f5f9" : "#0f172a")
      .style("font-size", "11px")
      .style("font-weight", "bold")
      .text(d => d.name.length > 25 ? `${d.name.substring(0, 24)}...` : d.name);

    // Subtext for Infra types / capacity load
    rightNodeGroups.append("text")
      .attr("x", 15)
      .attr("y", 16)
      .attr("text-anchor", "start")
      .attr("fill", "#0284c7")
      .style("font-size", "9px")
      .style("font-weight", "600")
      .text(d => `${d.infraType} • Menyerap ${formatRupiahSingkat(d.totalValue)}`);

  }, [supplyChainData, dimensions, isDarkMode]);

  // Retrieve active details of hover state link
  const activeLinkDetail = useMemo(() => {
    if (!activeLinkId) return null;
    return supplyChainData.links.find(l => l.id === activeLinkId) || null;
  }, [activeLinkId, supplyChainData]);

  // Retrieve details of hovered sector
  const activeSectorDetail = useMemo(() => {
    if (!hoveredNode || hoveredNode.type !== "sector") return null;
    return supplyChainData.leftNodes.find(n => n.id === hoveredNode.id) || null;
  }, [hoveredNode, supplyChainData]);

  // Retrieve details of hovered infra hub
  const activeInfraDetail = useMemo(() => {
    if (!hoveredNode || hoveredNode.type !== "infra") return null;
    return supplyChainData.rightNodes.find(n => n.id === hoveredNode.id) || null;
  }, [hoveredNode, supplyChainData]);

  // Safe check if no data is found (Honest Fallback)
  if (supplyChainData.leftNodes.length === 0) {
    return (
      <div className={`p-6 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} flex flex-col items-center justify-center min-h-[300px] gap-3`}>
        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400">
          <Truck className="w-8 h-8 animate-pulse" />
        </div>
        <h4 className="font-bold text-sm tracking-wide">Matriks Rantai Pasok Belum Memiliki Hubungan</h4>
        <p className="text-xs text-slate-500 max-w-sm text-center">
          Tambahkan koordinat geografis nyata di tabel investasi untuk melihat visualisasi jaringan logistik ke infrastruktur terdekat Luwu.
        </p>
      </div>
    );
  }

  return (
    <div className={`p-4 sm:p-6 lg:p-7 rounded-2xl border ${
      isDarkMode ? "bg-slate-900/90 border-slate-800 shadow-xl" : "bg-white border-slate-200 shadow-md"
    } flex flex-col gap-4 group transition-all duration-300 ease-in-out`}>
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className={`text-sm md:text-base font-bold flex items-center gap-2.5 tracking-wide ${
            isDarkMode ? "text-slate-50" : "text-slate-900"
          }`}>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
              <Truck className="w-4 h-4 md:w-5 md:h-5" />
            </span>
            Matriks Konektivitas Rantai Pasok Spasial (D3 Network Matrix)
          </h3>
          <p className="text-[11px] md:text-xs text-slate-500 font-medium mt-1 leading-relaxed">
            Menghubungkan komoditas sektor investasi dengan gerbang distribusi logistik terdekat (Pelabuhan, Bandara, Terminal, Jalan Nasional) di Kabupaten Luwu.
          </p>
        </div>
        <span className="px-3 py-1 text-[10px] md:text-xs font-mono font-bold rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 self-start sm:self-auto">
          D3.js Interactive Flow
        </span>
      </div>

      {/* Visual Canvas */}
      <div ref={containerRef} className="relative w-full overflow-hidden flex items-center justify-center bg-slate-950/20 dark:bg-slate-950/40 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="mx-auto block"
        />

        {/* Dynamic Interactive HUD inside canvas */}
        <div className="absolute bottom-3 left-3 right-3 pointer-events-none flex flex-wrap gap-2 justify-between items-center text-[10px] font-medium text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Sektor Potensi</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500" /> Infrastruktur Hub</span>
          </div>
          <span className="hidden sm:inline italic">Sentuh / Arahkan kursor ke jalur untuk melihat info detail distribusi logistik.</span>
        </div>
      </div>

      {/* Real-time Logistics Analysis HUD */}
      <div className={`min-h-[75px] p-4 rounded-xl border ${
        isDarkMode ? "bg-slate-950/80 border-slate-800" : "bg-slate-50 border-slate-200"
      } transition-all duration-300`}>
        {activeLinkDetail ? (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="md:col-span-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">PROYEK ASAL LOGISTIK</span>
              <strong className="text-slate-900 dark:text-slate-100 truncate block text-sm leading-tight">{activeLinkDetail.projectName}</strong>
              <span className="text-[10px] text-emerald-500 font-bold block mt-0.5">Sektor {activeLinkDetail.sector} • {activeLinkDetail.location}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">EFISIENSI LINTASAN</span>
              <strong className="text-amber-500 dark:text-amber-400 font-mono text-sm leading-tight block">
                {formatNumber(activeLinkDetail.distanceKm)} Km
              </strong>
              <span className="text-[10px] text-slate-500 block mt-0.5">Estimasi Tempuh: {Math.max(Math.round(activeLinkDetail.distanceKm * 1.5), 10)} menit</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">NILAI POTENSI DISTRIBUSI</span>
              <strong className="text-emerald-500 font-mono text-sm leading-tight block">
                {formatRupiahSingkat(activeLinkDetail.investmentValue)}
              </strong>
              <span className="text-[10px] text-slate-500 block mt-0.5">Kebutuhan Lahan: {activeLinkDetail.areaHa} Ha</span>
            </div>
          </motion.div>
        ) : activeSectorDetail ? (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <Activity className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">KATEGORI SEKTOR LOGISTIK AKTIF</span>
              <strong>Sektor {activeSectorDetail.name}</strong> • Membawa total potensi kapital senilai <strong className="text-emerald-500">{formatRupiahSingkat(activeSectorDetail.totalValue)}</strong> melintasi {activeSectorDetail.projectCount} jalur logistik yang terpetakan ke gerbang infrastruktur terdekat.
            </div>
          </motion.div>
        ) : activeInfraDetail ? (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <Anchor className="w-5 h-5 text-sky-500 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">HUB INFRASTRUKTUR PENERIMA LOGISTIK</span>
              <strong>{activeInfraDetail.name}</strong> • Bertanggung jawab menyerap distribusi logistik bernilai komitmen <strong className="text-emerald-500">{formatRupiahSingkat(activeInfraDetail.totalValue)}</strong> dari {activeInfraDetail.projectCount} lokasi potensi investasi utama.
            </div>
          </motion.div>
        ) : (
          <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 italic">
            <Info className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Matriks Rantai Pasok siap dianalisis. Arahkan kursor atau sentuh elemen visual untuk memetakan jalur distribusi logistik Kabupaten Luwu.</span>
          </div>
        )}
      </div>
    </div>
  );
}
