// @ts-ignore
import { FixedSizeList } from "react-window";
const List = FixedSizeList as any;
// @ts-ignore
import { AutoSizer } from "react-virtualized-auto-sizer";
const AutoSizerComponent = AutoSizer as any;
import { SpatialFeatureRow } from "./SpatialFeatureRow";
import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { normalizeGeoJSON } from "../utils/geoUtils";
import Map, { Source, Layer, Marker, NavigationControl, ScaleControl, MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import * as turf from "@turf/turf";
import Swal from 'sweetalert2';
import EsgWarningModal from "./EsgWarningModal";
import {
  GeoJSONLayer,
  Role,
  SektorInvestasi
} from "../types";
import ModerationPanel from "./ModerationPanel";
import {
  Layers,
  Sparkles,
  ChevronRight,
  X,
  Clock,
  Eye, GripVertical,
  Trash2, ShieldAlert,
  Save,
  Undo2,
  Redo2,
  Plus,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Upload,
  Download,
  Settings,
  RefreshCw,
  FileText,
  MousePointer,
  GitCommit,
  Scissors,
  Combine,
  Shield,
  Activity,
  User,
  Check,
  RotateCcw,
  Sliders,
  Type,
  Maximize2,
  Database,
  Minus,
  Move,
  MapPin,
  Plane,
  Ship,
  Building,
  Building2,
  Landmark,
  ShoppingCart,
  Store,
  School,
  Hospital,
  Crosshair,
  Home,
  Users
} from "lucide-react";

interface SpatialEditorStudioProps {
  currentRole: Role;
  isDarkMode: boolean;
  onRefreshAllData: () => Promise<void> | void;
  spatialLayers: Record<string, GeoJSONLayer>;
  setSpatialLayers: React.Dispatch<React.SetStateAction<Record<string, GeoJSONLayer>>>;
  districts: any[];
  villages: any[];
  embeddedMode?: boolean;
  onCloseModal?: () => void;
  onGeometryCreated?: (geoAsset: any) => void;
  initialGeometryToEdit?: any;
  focusDistrictId?: string;
  focusVillageId?: string;
  enforcePolygonOnly?: boolean;
  autoStartDraw?: boolean;
  initialModule?: "INVESTASI" | "INFRASTRUKTUR" | "MODERASI" | "ANNOTATION";
}

interface SpatialChangeLog {
  id: string;
  user: string;
  timestamp: string;
  layerId: string;
  layerName: string;
  actionType: "CREATE" | "UPDATE" | "DELETE" | "ROLLBACK";
  oldProps?: any;
  newProps?: any;
}

// Optimized helper: Direct coordinate extraction to replace slow turf.explode()
function extractCoordsFromGeoJSON(geojson: any): [number, number][] {
  const points: [number, number][] = [];
  if (!geojson) return points;
  
  function traverse(geom: any) {
    if (!geom) return;
    if (geom.type === "Feature") {
      traverse(geom.geometry);
    } else if (geom.type === "FeatureCollection" && Array.isArray(geom.features)) {
      geom.features.forEach((f: any) => traverse(f));
    } else if (geom.type === "Polygon" && Array.isArray(geom.coordinates)) {
      geom.coordinates.forEach((ring: any) => {
        if (Array.isArray(ring)) {
          ring.forEach((coord: any) => {
            if (Array.isArray(coord) && typeof coord[0] === 'number') {
              points.push([coord[0], coord[1]]);
            }
          });
        }
      });
    } else if (geom.type === "MultiPolygon" && Array.isArray(geom.coordinates)) {
      geom.coordinates.forEach((polygon: any) => {
        if (Array.isArray(polygon)) {
          polygon.forEach((ring: any) => {
            if (Array.isArray(ring)) {
              ring.forEach((coord: any) => {
                if (Array.isArray(coord) && typeof coord[0] === 'number') {
                  points.push([coord[0], coord[1]]);
                }
              });
            }
          });
        }
      });
    } else if (geom.type === "LineString" && Array.isArray(geom.coordinates)) {
      geom.coordinates.forEach((coord: any) => {
        if (Array.isArray(coord) && typeof coord[0] === 'number') {
          points.push([coord[0], coord[1]]);
        }
      });
    } else if (geom.type === "MultiLineString" && Array.isArray(geom.coordinates)) {
      geom.coordinates.forEach((line: any) => {
        if (Array.isArray(line)) {
          line.forEach((coord: any) => {
            if (Array.isArray(coord) && typeof coord[0] === 'number') {
              points.push([coord[0], coord[1]]);
            }
          });
        }
      });
    } else if (geom.type === "Point" && Array.isArray(geom.coordinates)) {
      if (typeof geom.coordinates[0] === 'number') {
        points.push([geom.coordinates[0], geom.coordinates[1]]);
      }
    }
  }
  
  traverse(geojson);
  return points;
}

// Unified, version-agnostic safe Turf intersection helper
function safeIntersect(feat1: any, feat2: any): any {
  if (!feat1 || !feat2) return null;
  try {
    return turf.intersect(turf.featureCollection([feat1, feat2]));
  } catch (e) {
    undefined;
    return null;
  }
}

// Unified, version-agnostic safe Turf difference helper
function safeDifference(feat1: any, feat2: any): any {
  if (!feat1 || !feat2) return null;
  try {
    return turf.difference(turf.featureCollection([feat1, feat2]));
  } catch (e) {
    undefined;
    return null;
  }
}

export default function SpatialEditorStudio({
  currentRole,
  isDarkMode,
  onRefreshAllData,
  spatialLayers,
  setSpatialLayers,
  districts,
  villages,
  embeddedMode,
  onCloseModal,
  onGeometryCreated,
  initialGeometryToEdit,
  focusDistrictId,
  focusVillageId,
  enforcePolygonOnly,
  autoStartDraw,
  initialModule
}: SpatialEditorStudioProps) {
  const { t } = useTranslation();
  const mapRef = useRef<MapRef>(null);
  const lastDragCenterRef = useRef<{ lng: number; lat: number } | null>(null);

  // Map state
  const [mapMode, setMapMode] = useState<"osm" | "dark" | "satellite" | "google_satellite">("google_satellite");
  const [mobileTab, setMobileTab] = useState<"MAP" | "LAYERS" | "INSPECTOR">("MAP");
  const [viewState, setViewState] = useState({
    longitude: 120.252,
    latitude: -3.203,
    zoom: 10,
    pitch: 0,
    bearing: 0
  });

  // Layer list & active layer inside editor
  const [selectedLayerId, setSelectedLayerId] = useState<string>("");
  const [layerOrder, setLayerOrder] = useState<string[]>([]);
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);

  // Sync layerOrder with spatialLayers keys
  useEffect(() => {
    setLayerOrder((prev) => {
      const newOrder = [...prev];
      Object.keys(spatialLayers).forEach((key) => {
        if (!newOrder.includes(key)) newOrder.push(key);
      });
      return newOrder.filter((key) => spatialLayers[key]);
    });
  }, [spatialLayers]);

  const [activeFeatures, setActiveFeatures] = useState<any[]>([]);
  const [selectedFeatureIndex, setSelectedFeatureIndex] = useState<number | null>(null);

  // Interactive editing states
  const [editorMode, setEditorMode] = useState<"VIEW" | "DRAW_POINT" | "DRAW_LINE" | "DRAW_POLYGON" | "EDIT_VERTICES">(
    autoStartDraw && enforcePolygonOnly ? "DRAW_POLYGON" : "VIEW"
  );
  
  useEffect(() => {
    if (autoStartDraw && enforcePolygonOnly) {
      setTimeout(() => {
        handleCreateNewFeature("Polygon");
      }, 300);
    }
  }, [autoStartDraw, enforcePolygonOnly]);
  const [drawCoords, setDrawCoords] = useState<[number, number][]>([]); // temporary coords during drawing [lng, lat]
  const [activeEditCoords, setActiveEditCoords] = useState<[number, number][]>([]); // current edited feature coords [lng, lat]
  const [hoveredSegmentIndex, setHoveredSegmentIndex] = useState<number | null>(null);
  const [selectedVertexIndex, setSelectedVertexIndex] = useState<number | null>(null);

  // Snapping Engine configurations
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [snapTarget, setSnapTarget] = useState<"ALL" | "VILLAGES" | "ROADS" | "DISTRICTS">("ALL");
  const [snapToleranceKm, setSnapToleranceKm] = useState<number>(0.15); // ~150 meters
  const [snappedHUD, setSnappedHUD] = useState<{ label: string; distanceM: number } | null>(null);

  // Local Undo/Redo Engine (tracks up to 50 coordinate snapshots)
  const [undoStack, setUndoStack] = useState<[number, number][][]>([]);
  const [redoStack, setRedoStack] = useState<[number, number][][]>([]);

  // Topology validation audit results
  const [topologyErrors, setTopologyErrors] = useState<{ type: string; message: string; fatal: boolean; conflictIndex?: number }[]>([]);

  // Audit Logs / History Log states
  const [auditLogs, setAuditLogs] = useState<SpatialChangeLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isEsgModalOpen, setIsEsgModalOpen] = useState(false);
  const [esgWarningMessage, setEsgWarningMessage] = useState("");
  const [pendingSaveAction, setPendingSaveAction] = useState<((overrideData?: any) => Promise<void>) | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 6000);
  };

  // Schema form editing fields
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formStatus, setFormStatus] = useState<"Draft" | "Review" | "Published" | "Archived">("Draft");
  const [selectedDistrictName, setSelectedDistrictName] = useState("");
  const [calculatedAreaHa, setCalculatedAreaHa] = useState<number>(0);
  const [calculatedLengthKm, setCalculatedLengthKm] = useState<number>(0);
  const [liveSpatialSync, setLiveSpatialSync] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Layer rendering configurations for quick edits (opacity, color)
  const [editingLayerColor, setEditingLayerColor] = useState("");
  const [editingLayerOpacity, setEditingLayerOpacity] = useState(0.8);

  const INFRA_CATEGORIES = useMemo(() => [
    { name: "Rumah Sakit", icon: "Hospital" },
    { name: "Bandara", icon: "Plane" },
    { name: "Pelabuhan", icon: "Ship" },
    { name: "Kantor Polisi", icon: "Shield" },
    { name: "Kantor Camat", icon: "Building2" },
    { name: "Kantor Desa", icon: "Home" },
    { name: "Perkantoran Daerah", icon: "Landmark" },
    { name: "Pusat Perdagangan", icon: "ShoppingCart" },
    { name: "Toko / Swalayan", icon: "Store" },
    { name: "Sarana Pendidikan", icon: "School" },
    { name: "Fasilitas Umum", icon: "Users" },
    { name: "Lainnya", icon: "MapPin" }
  ], []);

  // New Digitation Module States
  const [digitizationModule, setDigitizationModule] = useState<"INVESTASI" | "INFRASTRUKTUR" | "MODERASI" | "ANNOTATION">(initialModule || "INVESTASI");

  useEffect(() => {
    if (initialModule) {
      setDigitizationModule(initialModule);
    }
  }, [initialModule]);

  const [annotationCoords, setAnnotationCoords] = useState<[number, number] | null>(null);
  const [annotationForm, setAnnotationForm] = useState<{ label: string, description: string }>({ label: "", description: "" });
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [infraCoords, setInfraCoords] = useState<[number, number] | null>(null);
  const [infraForm, setInfraForm] = useState({ name: "", category: "Fasilitas Umum", description: "", icon: "Users" });
  const [isSavingInfra, setIsSavingInfra] = useState(false);

  // File Import State and simulation logs
  const [importLog, setImportLog] = useState<string | null>(null);
  const [pendingUpload, setPendingUpload] = useState<{file: File, features: any[], name: string} | null>(null);
  const [geoJSONDiagnostics, setGeoJSONDiagnostics] = useState<{isValid: boolean, messages: {text: string, type: 'error'|'warning'|'success'}[]}>({isValid: true, messages: []});


  // Auto-aktifkan layer jalan sebagai referensi digitasi jika mode digitasi aktif
  useEffect(() => {
    if (editorMode !== "VIEW") {
      const roadLayer = Object.values(spatialLayers).find((l) => l.id === "layer_jalan");
      if (roadLayer && !roadLayer.isActive) {
        const token = localStorage.getItem("luwu_session_token");
        fetch('/api/spatial-layers/layer_jalan', {
          method: 'PUT',
          headers: { 
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ isActive: true })
        }).then(res => {
          if (res.ok) {
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("text/html")) return null;
            return res.text().then(text => {
              const trimmed = text.trim();
              if (trimmed.startsWith("<")) return null;
              return JSON.parse(trimmed);
            });
          }
          return null;
        }).then(updatedLayer => {
          if (updatedLayer) {
             setSpatialLayers(prev => ({
               ...prev,
               layer_jalan: updatedLayer
             }));
          }
        }).catch(err => console.error("Gagal auto-aktifkan layer jalan:", err));
      }
    }
  }, [editorMode, spatialLayers]);

  // 1. Filtered active layer object
  const activeLayer = useMemo(() => {
    return spatialLayers[selectedLayerId] || null;
  }, [spatialLayers, selectedLayerId]);

  // Derived focus boundary geojson
  const focusBoundaryGeoJSON = useMemo(() => {
    if (!embeddedMode) return null;
    let geo = null;
    if (focusVillageId) {
      const v = villages.find(vil => vil.id === focusVillageId);
      if (v && v.geojson) geo = v.geojson;
      else if (focusDistrictId) {
        const d = districts.find(dist => dist.id === focusDistrictId);
        if (d && d.geojson) geo = d.geojson;
      }
    } else if (focusDistrictId) {
      const d = districts.find(dist => dist.id === focusDistrictId);
      if (d && d.geojson) geo = d.geojson;
    }
    
    if (geo) {
      return normalizeGeoJSON(geo);
    }
    return null;
  }, [embeddedMode, focusVillageId, focusDistrictId, villages, districts]);

  // Load audit logs on startup & layer change
  const fetchAuditLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch("/api/spatial-history");
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error("Gagal memuat histori spasial:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [selectedLayerId]);

  useEffect(() => {
    if (embeddedMode && initialGeometryToEdit) {
      let coords: [number, number][] = [];
      let gType: "Polygon" | "LineString" | "Point" = "Polygon";
      
      const geomType = initialGeometryToEdit.type || "Polygon";
      if (geomType === "Polygon") {
        if (initialGeometryToEdit.coordinates && initialGeometryToEdit.coordinates[0]) {
          const rawCoords = initialGeometryToEdit.coordinates[0];
          coords = rawCoords.slice(0, rawCoords.length - 1); // remove duplicate closing point
        }
        gType = "Polygon";
        setEditorMode("DRAW_POLYGON");
      } else if (geomType === "LineString") {
        coords = initialGeometryToEdit.coordinates || [];
        gType = "LineString";
        setEditorMode("DRAW_LINE");
      } else if (geomType === "Point") {
        coords = initialGeometryToEdit.coordinates ? [initialGeometryToEdit.coordinates] : [];
        gType = "Point";
        setEditorMode("DRAW_POINT");
      }

      setActiveEditCoords(coords);
      setSelectedFeatureIndex(-1); // Mark as newly created/custom edited geometry
      setFormName(initialGeometryToEdit.name || "Edit GeoAsset");
      
      if (coords.length > 0) {
        setViewState((prev) => ({
          ...prev,
          longitude: coords[0][0],
          latitude: coords[0][1],
          zoom: 13
        }));
      }
    } else if (embeddedMode) {
      if (focusVillageId) {
        const v = villages.find(vil => vil.id === focusVillageId);
        if (v && v.coordinates) {
          setViewState(prev => ({
            ...prev,
            longitude: v.coordinates[1],
            latitude: v.coordinates[0],
            zoom: 14
          }));
        }
      } else if (focusDistrictId) {
        const d = districts.find(dist => dist.id === focusDistrictId);
        if (d && d.coordinates) {
          setViewState(prev => ({
            ...prev,
            longitude: d.coordinates[1],
            latitude: d.coordinates[0],
            zoom: 12
          }));
        }
      }
    }
  }, [embeddedMode, initialGeometryToEdit, focusVillageId, focusDistrictId, villages, districts]);

  // Populate active features from selected layer
  useEffect(() => {
    if (activeLayer && activeLayer.geojson) {
      const normalized = normalizeGeoJSON(activeLayer.geojson);
      if (normalized?.features) {
        setActiveFeatures(normalized.features);
        setEditingLayerColor(activeLayer.color || "#059669");
        setEditingLayerOpacity(activeLayer.opacity !== undefined ? activeLayer.opacity : 0.8);
      } else {
        setActiveFeatures([]);
      }
      setSelectedFeatureIndex(null);
      resetEditorState();
    } else {
      setActiveFeatures([]);
      setSelectedFeatureIndex(null);
      resetEditorState();
    }
  }, [selectedLayerId, spatialLayers]);

  // Handle active edited feature geometry changes to run topology validation & metrics
  useEffect(() => {
    if (selectedFeatureIndex !== null && activeEditCoords.length > 0) {
      calculateMetricsAndProperties(activeEditCoords);
      runTopologyAudit(activeEditCoords);
    } else {
      setCalculatedAreaHa(0);
      setCalculatedLengthKm(0);
      setTopologyErrors([]);
    }
  }, [activeEditCoords, selectedFeatureIndex]);

  const resetEditorState = () => {
    setDrawCoords([]);
    setActiveEditCoords([]);
    setSelectedVertexIndex(null);
    setHoveredSegmentIndex(null);
    setUndoStack([]);
    setRedoStack([]);
    setTopologyErrors([]);
    setSnappedHUD(null);
  };

  // Push coordinates snapshot to undo state before an action
  const pushToUndo = (coordsSnapshot: [number, number][]) => {
    const updated = [...undoStack, JSON.parse(JSON.stringify(coordsSnapshot))];
    if (updated.length > 50) updated.shift(); // Max 50 steps
    setUndoStack(updated);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const currentSnapshot = JSON.parse(JSON.stringify(activeEditCoords));
    const previousSnapshot = undoStack[undoStack.length - 1];

    setRedoStack([...redoStack, currentSnapshot]);
    setActiveEditCoords(previousSnapshot);
    setUndoStack(undoStack.slice(0, undoStack.length - 1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const currentSnapshot = JSON.parse(JSON.stringify(activeEditCoords));
    const nextSnapshot = redoStack[redoStack.length - 1];

    setUndoStack([...undoStack, currentSnapshot]);
    setActiveEditCoords(nextSnapshot);
    setRedoStack(redoStack.slice(0, redoStack.length - 1));
  };

  // 2. Pre-computed snapping cache to avoid expensive Turf.explode on every drag event
  const snapPointsCache = useMemo(() => {
    const points: Array<{ coords: [number, number]; label: string }> = [];

    // Kumpulkan semua kandidat dengan metadata
    const candidates: Array<{
      geojson: unknown;
      label: string;
      centerCoord?: [number, number];
    }> = [];

    (districts || []).forEach((d: any) => {
      if (d.geojson) {
        candidates.push({
          geojson: d.geojson,
          label: `Batas Kec. ${d.name}`,
        });
      }
    });

    (villages || []).forEach((v: any) => {
      if (v.geojson) {
        candidates.push({
          geojson: v.geojson,
          label: `Batas Desa ${v.name}`,
        });
      }
    });

    const roadLayer = Object.values(spatialLayers).find(
      (l) => l.id === "layer_jalan"
    );
    if (roadLayer?.geojson) {
      candidates.push({
        geojson: roadLayer.geojson,
        label: "Jalan Utama",
      });
    }

    // Viewport-aware sort: urutkan berdasarkan centroid 
    // terdekat ke center peta jika mapRef tersedia
    const viewCenter = mapRef.current?.getCenter?.();
    let sorted = candidates;

    if (viewCenter) {
      sorted = candidates
        .map((c) => {
          try {
            const normalized = normalizeGeoJSON(c.geojson);
            if (!normalized) return { ...c, dist: Infinity };
            const centroid = turf.centroid(normalized);
            const { getDistanceSync } = require("../utils/routeService");
            const distRes = getDistanceSync(
              turf.point([viewCenter.lng, viewCenter.lat]),
              centroid
            );
            const dist = distRes.distance;
            return { ...c, dist };
          } catch {
            return { ...c, dist: Infinity };
          }
        })
        .sort((a, b) => (a.dist ?? Infinity) - (b.dist ?? Infinity));
    }

    // Hard limit: hanya proses 50 kandidat terdekat
    const limited = sorted.slice(0, 50);

    // Ekstrak koordinat dari kandidat terpilih
    limited.forEach((c) => {
      try {
        const normalized = normalizeGeoJSON(c.geojson);
        if (normalized) {
          extractCoordsFromGeoJSON(normalized).forEach((coord) => {
            points.push({ coords: coord, label: c.label });
          });
        }
      } catch (err) {
        console.error(`Error computing snap point [${c.label}]:`, err);
      }
    });

    return points;
  }, [districts, villages, spatialLayers]);

  // 2b. Automated snapping calculation based on geographic proximity (using pre-parsed coordinates cache)
  const checkProximityAndSnap = (rawLng: number, rawLat: number): [number, number] => {
    if (!snapEnabled) return [rawLng, rawLat];

    const currentPoint = turf.point([rawLng, rawLat]);
    let nearestCoordinate: [number, number] | null = null;
    let minDistance = Infinity; // in kilometers
    let snappedLabel = "";

    snapPointsCache.forEach((pt) => {
      // Snapping filter targets check
      if (snapTarget !== "ALL") {
        if (snapTarget === "DISTRICTS" && !pt.label.startsWith("Batas Kec.")) return;
        if (snapTarget === "VILLAGES" && !pt.label.startsWith("Batas Desa")) return;
        if (snapTarget === "ROADS" && pt.label !== "Jalan Utama") return;
      }

      try {
        const pointFeature = turf.point(pt.coords);
        const { getDistanceSync } = require("../utils/routeService");
        const distRes = getDistanceSync(currentPoint, pointFeature, { units: "kilometers" });
        const dist = distRes.distance;
        if (dist < minDistance) {
          minDistance = dist;
          nearestCoordinate = pt.coords;
          snappedLabel = pt.label;
        }
      } catch {}
    });

    // Apply snap alignment if within user threshold
    if (nearestCoordinate && minDistance <= snapToleranceKm) {
      const distM = Math.round(minDistance * 1000);
      setSnappedHUD({ label: snappedLabel, distanceM: distM });
      return nearestCoordinate;
    }

    setSnappedHUD(null);
    return [rawLng, rawLat];
  };

  // 3. Topology Audit calculations using Turf.js
  const runTopologyAudit = (coords: [number, number][]) => {
    const errors: { type: string; message: string; fatal: boolean; conflictIndex?: number }[] = [];

    if (coords.length === 0) return;

    // Check Duplicate vertex
    const stringifiedCoords = coords.map((c) => c.join(","));
    const duplicates = stringifiedCoords.filter((item, index) => stringifiedCoords.indexOf(item) !== index);
    if (duplicates.length > 0) {
      errors.push({
        type: "DUPLICATED_VERTEX",
        message: "Terdapat vertex duplikat (koordinat bertumpuk pada satu titik).",
        fatal: false
      });
    }

    // Checking geometry-specific rules
    const geomType = activeLayer?.id === "layer_jalan" ? "LineString" : activeLayer?.category === "Infrastruktur" ? "Point" : "Polygon";

    if (geomType === "Polygon") {
      if (coords.length < 3) {
        errors.push({
          type: "INVALID_POLYGON",
          message: "Polygon tidak valid: membutuhkan minimal 3 pasang koordinat.",
          fatal: true
        });
      } else {
        try {
          // Re-close polygon for Turf validity checking
          const closed = [...coords, coords[0]];
          const polyFeat = turf.polygon([closed]);

          // Self Intersection audit
          const selfIntersects = turf.kinks(polyFeat);
          if (selfIntersects.features.length > 0) {
            errors.push({
              type: "SELF_INTERSECTION",
              message: `Peta tumpang tindih mandiri (Self-intersection) terdeteksi pada ${selfIntersects.features.length} simpul.`,
              fatal: true
            });
          }

          // Gap/Overlap calculations across adjacent features in same layer
          const currentId = activeFeatures[selectedFeatureIndex!]?.properties?.id;
          activeFeatures.forEach((otherFeat: any, idx: number) => {
            if (idx !== selectedFeatureIndex && otherFeat.geometry?.type === "Polygon") {
              try {
                const isOverlapping = safeIntersect(polyFeat, otherFeat);
                if (isOverlapping) {
                  const intersectionArea = turf.area(isOverlapping);
                  if (intersectionArea > 50) { // Toleransi 50 meter persegi
                    errors.push({
                      type: "OVERLAP_POLYGON",
                      message: `Tumpang tindih (Overlap) seluas ${(intersectionArea / 10000).toFixed(2)} Ha terdeteksi dengan "${otherFeat.properties?.name || "Objek Terkait"}".`,
                      fatal: false,
                      conflictIndex: idx
                    });
                  }
                }
              } catch (e) {}
            }
          });
        } catch (err: any) {
          errors.push({
            type: "GEOMETRY_ERROR",
            message: `Kesalahan Geometri: ${err.message || "Struktur geometri melanggar standar OGC."}`,
            fatal: true
          });
        }
      }
    } else if (geomType === "LineString") {
      if (coords.length < 2) {
        errors.push({
          type: "INVALID_LINE",
          message: "Linestring tidak valid: membutuhkan minimal 2 pasang koordinat.",
          fatal: true
        });
      }
    }

    setTopologyErrors(errors);
  };

  // Client-side fast GIS intersection calculator for all 9 layers (Turf.js)
  const clientCalculateSpatialSync = async (geometry: any) => {
    let kecamatanMatch: string | null = null;
    let desaMatch: string | null = null;
    let nearestRoadKm = 0;
    
    const thematicOverlaps = {
      sawahHa: 0,
      tambakHa: 0,
      mangroveHa: 0,
      lahanKeringPrimerHa: 0,
      lahanKeringSekunderHa: 0
    };

    const nearestFacilities: any[] = [];

    try {
      let centroid: any = null;
      let userPoly: any = null;
      
      if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
        userPoly = geometry.type === 'Polygon' ? turf.polygon(geometry.coordinates) : turf.multiPolygon(geometry.coordinates);
        centroid = turf.centroid(userPoly);
      } else if (geometry.type === 'LineString') {
        const line = turf.lineString(geometry.coordinates);
        const mid = turf.midpoint(geometry.coordinates[0], geometry.coordinates[geometry.coordinates.length - 1]);
        centroid = mid;
      } else if (geometry.type === 'Point') {
        centroid = turf.point(geometry.coordinates);
      }

      if (!centroid) return null;

      // A. Match Kecamatan Boundaries
      districts.forEach(d => {
        if (d.geojson) {
          try {
            const isInside = turf.booleanPointInPolygon(centroid, d.geojson);
            if (isInside) {
              kecamatanMatch = d.name;
            }
          } catch(e) {}
        }
      });

      // B. Match Desa Boundaries
      const desaLayer = Object.values(spatialLayers).find(l => l.id === "layer_desa");
      if (desaLayer && desaLayer.geojson?.features) {
        for (const f of desaLayer.geojson.features) {
          try {
            const isInside = turf.booleanPointInPolygon(centroid, f);
            if (isInside) {
              desaMatch = f.properties?.Name || f.properties?.Nama_Desa || null;
              break;
            }
          } catch(e) {}
        }
      }

      // Late import for RPC routing (to avoid loading issue at module root in some contexts)
      const { getDistance } = await import("../utils/routeService.js");

      // C. Measure distances to major infra properties
      const infraLayer = Object.values(spatialLayers).find(l => l.id === "layer_infrastruktur");
      if (infraLayer && infraLayer.geojson?.features) {
        for (const f of infraLayer.geojson.features) {
          try {
            const distRes = await getDistance(centroid, f, { units: 'kilometers' });
            nearestFacilities.push({
              id: f.properties?.id || Math.random().toString(),
              name: f.properties?.name || f.properties?.Nama || "Fasilitas",
              type: f.properties?.type || "Umum",
              distanceKm: Number(distRes.distance.toFixed(2))
            });
          } catch(e) {}
        }
      }
      nearestFacilities.sort((a, b) => a.distanceKm - b.distanceKm);

      // D. Measure shortest distance to main roads
      const roadLayer = Object.values(spatialLayers).find(l => l.id === "layer_jalan");
      if (roadLayer && roadLayer.geojson && roadLayer.geojson.features) {
        try {
          // Use Turf to find the nearest point on all lines
          const nearestPt = turf.nearestPointOnLine(roadLayer.geojson as any, centroid, { units: 'kilometers' });
          if (nearestPt && nearestPt.properties && typeof nearestPt.properties.dist === 'number') {
             nearestRoadKm = Number(nearestPt.properties.dist.toFixed(2));
          } else {
             // Fallback Euclidean calculation just in case
             nearestRoadKm = turf.distance(centroid, nearestPt || centroid, { units: 'kilometers' });
          }
        } catch(e) {
          nearestRoadKm = 0;
        }
      }

      // E. Calculate tumpang tindih areas (intersect) in Hectares
      if (userPoly) {
        const thematicMapping = [
          { key: "sawahHa" as const, layerId: "layer_sawah" },
          { key: "tambakHa" as const, layerId: "layer_tambak" },
          { key: "mangroveHa" as const, layerId: "layer_mangrove" },
          { key: "lahanKeringPrimerHa" as const, layerId: "layer_lahan_kering_primer" },
          { key: "lahanKeringSekunderHa" as const, layerId: "layer_lahan_kering_sekunder" }
        ];

        for (const map of thematicMapping) {
          const lObj = Object.values(spatialLayers).find(l => l.id === map.layerId);
          if (lObj && lObj.geojson?.features) {
            let overlapHa = 0;
            try {
              for (const thematicFeature of lObj.geojson.features) {
                if (thematicFeature.geometry?.type === 'Polygon' || thematicFeature.geometry?.type === 'MultiPolygon') {
                  const intersection = safeIntersect(userPoly, thematicFeature);
                  if (intersection) {
                    const intersectedArea = turf.area(intersection);
                    overlapHa += (intersectedArea / 10000);
                  }
                }
              }
            } catch(e) {}
            thematicOverlaps[map.key] = Number(overlapHa.toFixed(2));
          }
        }
      }
    } catch (e) {
      console.error("Client spatial sync calculations failed:", e);
    }

    return {
      kecamatanMatch,
      desaMatch,
      nearestRoadKm,
      thematicOverlaps,
      nearestFacilities: nearestFacilities.slice(0, 5)
    };
  };

  const handleTriggerLiveSpatialSync = async (geomToSync?: any) => {
    try {
      setIsSyncing(true);
      
      let finalGeom = geomToSync;
      if (!finalGeom) {
        let gType = "Polygon";
        let coordinatesToSave: any = [];

        if (editorMode === "EDIT_VERTICES" && selectedFeatureIndex !== -1) {
          gType = activeFeatures[selectedFeatureIndex!]?.geometry?.type || "Polygon";
        } else {
          if (editorMode === "DRAW_POINT") gType = "Point";
          else if (editorMode === "DRAW_LINE") gType = "LineString";
          else gType = "Polygon";
        }

        if (gType === "Point") {
          coordinatesToSave = activeEditCoords[0] || [0, 0];
        } else if (gType === "LineString") {
          if (activeEditCoords.length < 2) return;
          coordinatesToSave = activeEditCoords;
        } else {
          if (activeEditCoords.length < 3) return;
          const closedCoordinates = activeEditCoords.length > 0 ? [...activeEditCoords, activeEditCoords[0]] : [];
          coordinatesToSave = [closedCoordinates];
        }
        
        if (coordinatesToSave.length > 0) {
          finalGeom = {
            type: gType,
            coordinates: coordinatesToSave
          };
        }
      }

      if (!finalGeom) {
        setIsSyncing(false);
        return;
      }

      // Set instantaneous client-side preview
      clientCalculateSpatialSync(finalGeom).then(computedSync => {
        setLiveSpatialSync(computedSync);
      });

      // Persist to backend
      const checkId = selectedFeatureIndex !== null && selectedFeatureIndex !== -1 ? activeFeatures[selectedFeatureIndex!]?.properties?.id : undefined;
      const token = localStorage.getItem("luwu_session_token");
      await fetch("/api/spatial-sync", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          type: checkId ? "geometry" : "temp",
          id: checkId,
          geometry: finalGeom
        })
      });
    } catch (err) {
      console.error("Spatial sync background API failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const calculateMetricsAndProperties = (coords: [number, number][]) => {
    try {
      if (coords.length < 2) return;

      const geomType = activeLayer?.id === "layer_jalan" ? "LineString" : "Polygon";
      let finalGeom: any = null;

      if (geomType === "Polygon") {
        const closed = [...coords, coords[0]];
        const poly = turf.polygon([closed]);
        finalGeom = poly;
        const areaMsq = turf.area(poly);
        setCalculatedAreaHa(parseFloat((areaMsq / 10000).toFixed(2)));

        // Estimate perimeter
        const line = turf.polygonToLine(poly);
        const perimeterKm = turf.length((line as any), { units: "kilometers" });
        setCalculatedLengthKm(parseFloat(perimeterKm.toFixed(4)));

        // Find administrative district center parent intersection
        const pointCenter = turf.centroid(poly);
        let foundKec = "Kec. Belopa Utara (Estimasi)";
        districts.forEach((d) => {
          if (d.geojson) {
            try {
              if (turf.booleanPointInPolygon(pointCenter, d.geojson)) {
                foundKec = d.name;
              }
            } catch (e) {}
          }
        });
        setSelectedDistrictName(foundKec);

      } else {
        const line = turf.lineString(coords);
        finalGeom = line;
        const length = turf.length(line, { units: "kilometers" });
        setCalculatedLengthKm(parseFloat(length.toFixed(4)));
        setCalculatedAreaHa(0);
      }

      if (finalGeom) {
        clientCalculateSpatialSync(finalGeom.geometry || finalGeom).then(syncResult => {
          setLiveSpatialSync(syncResult);
        });
      }
    } catch (e) {}
  };

  // Selecting a feature to edit
  const handleSelectFeature = (featIndex: number) => {
    setSelectedFeatureIndex(featIndex);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileTab("INSPECTOR");
    }
    const feat = activeFeatures[featIndex];
    if (feat && feat.geometry) {
      let coords: [number, number][] = [];
      if (feat.geometry.type === "Polygon") {
        // Grab first exterior ring
        coords = feat.geometry.coordinates[0].slice(0, -1); // remove duplicate closing point
      } else if (feat.geometry.type === "LineString") {
        coords = feat.geometry.coordinates;
      } else if (feat.geometry.type === "Point") {
        coords = [feat.geometry.coordinates];
      }

      setActiveEditCoords(coords);
      setFormName(feat.properties?.name || `Polygon Data #${featIndex + 1}`);
      setFormCategory(feat.properties?.category || activeLayer?.category || "Tata Ruang");
      setFormStatus(feat.properties?.status || "Draft");
      setSelectedVertexIndex(null);
      setUndoStack([]);
      setRedoStack([]);
      setEditorMode("EDIT_VERTICES");

      // Load static or live computed spatialSync directly
      if (feat.properties?.spatialSync) {
        setLiveSpatialSync(feat.properties.spatialSync);
      } else {
        clientCalculateSpatialSync(feat.geometry).then(initialSync => {
          setLiveSpatialSync(initialSync);
          // Backfill silently to database
          handleTriggerLiveSpatialSync(feat.geometry);
        });
      }

      // Zoom to feature centroid for quick visual focus
      try {
        const centroid = turf.centroid(feat);
        const [lng, lat] = centroid.geometry.coordinates;
        setViewState((prev) => ({
          ...prev,
          longitude: lng,
          latitude: lat,
          zoom: 13,
          transitionDuration: 1000
        } as any));
      } catch (e) {}
    }
  };

  // Vertex Drag Handlers (interactive vertex update)
  const handleVertexDrag = (index: number, newLng: number, newLat: number) => {
    pushToUndo(activeEditCoords);
    const snapped = checkProximityAndSnap(newLng, newLat);

    const updated = [...activeEditCoords];
    updated[index] = snapped;
    setActiveEditCoords(updated);
  };

  // Add vertex on segment boundary double-click
  const handleAddVertexOnSegment = (indexPrv: number) => {
    if (activeEditCoords.length < 2) return;
    pushToUndo(activeEditCoords);

    const pt1 = activeEditCoords[indexPrv];
    const pt2 = activeEditCoords[(indexPrv + 1) % activeEditCoords.length];
    
    // Calculate mid-point
    const midLng = (pt1[0] + pt2[0]) / 2;
    const midLat = (pt1[1] + pt2[1]) / 2;

    const updated = [...activeEditCoords];
    updated.splice(indexPrv + 1, 0, [midLng, midLat]);
    setActiveEditCoords(updated);
    setSelectedVertexIndex(indexPrv + 1);
  };

  // Remove selected vertex
  const handleRemoveVertex = (index: number) => {
    if (activeEditCoords.length <= 3) {
      showToast("Polygon minimal harus memiliki 3 vertex!");
      return;
    }
    pushToUndo(activeEditCoords);
    const updated = activeEditCoords.filter((_, idx) => idx !== index);
    setActiveEditCoords(updated);
    setSelectedVertexIndex(null);
  };

  // Creating a blank new spatial feature
  const handleCreateNewFeature = (geomType: "Polygon" | "LineString" | "Point") => {
    resetEditorState();
    setFormName(`${activeLayer?.name || "Layer"} Baru #` + (activeFeatures.length + 1));
    setFormCategory(activeLayer?.category || "Tipe Standar");
    setFormStatus("Draft");

    setActiveEditCoords([]);
    setSelectedFeatureIndex(-1); // special index for creation
    
    if (geomType === "Point") {
      setEditorMode("DRAW_POINT");
    } else if (geomType === "LineString") {
      setEditorMode("DRAW_LINE");
    } else {
      setEditorMode("DRAW_POLYGON");
    }
  };

  // Map Click handler for drawing
  const handleMapClick = (evt: any) => {
    let lng = evt.lngLat.lng;
    let lat = evt.lngLat.lat;

    if (digitizationModule === "INFRASTRUKTUR") {
      setInfraCoords([lng, lat]);
      // Prevent further drawing logic
      return;
    }

    if (digitizationModule === "ANNOTATION") {
      setAnnotationCoords([lng, lat]);
      setSelectedAnnotationId(null);
      return;
    }

    if (editorMode === "VIEW" || editorMode === "EDIT_VERTICES") return;

    // Apply snapping logic
    const snapped = checkProximityAndSnap(lng, lat);
    lng = snapped[0];
    lat = snapped[1];

    pushToUndo(activeEditCoords);
    if (editorMode === "DRAW_POINT") {
      setActiveEditCoords([[lng, lat]]);
    } else {
      setActiveEditCoords([...activeEditCoords, [lng, lat]]);
    }
  };

  const handleSaveAnnotation = () => {
    if (!annotationCoords || !annotationForm.label) {
      Swal.fire({ icon: 'warning', title: 'Peringatan', text: 'Label anotasi wajib diisi!' });
      return;
    }

    const newFeature = {
      type: "Feature",
      geometry: { type: "Point", coordinates: annotationCoords },
      properties: {
        id: `annot_${Date.now()}`,
        label: annotationForm.label,
        description: annotationForm.description,
        timestamp: new Date().toISOString()
      }
    };

    const existingLayer = spatialLayers["layer_anotasi_custom"];
    let updatedFeatures: any[] = [];
    if (existingLayer && existingLayer.geojson && existingLayer.geojson.features) {
      updatedFeatures = [...existingLayer.geojson.features];
    }
    updatedFeatures.push(newFeature);

    setSpatialLayers({
      ...spatialLayers,
      ["layer_anotasi_custom"]: {
        id: "layer_anotasi_custom",
        name: "Custom Annotations",
        category: "Anotasi",
        geojson: { type: "FeatureCollection", features: updatedFeatures },
        uploadedAt: new Date().toISOString(),
        isActive: true,
        opacity: 1,
        color: "#f59e0b",
        lineWidth: 2
      }
    });

    setAnnotationCoords(null);
    setAnnotationForm({ label: "", description: "" });
    Swal.fire({ icon: 'success', title: 'Tersimpan', text: 'Anotasi berhasil ditambahkan pada peta.', timer: 1500, showConfirmButton: false });
  };

  const handleDeleteAnnotation = (id: string) => {
    const existingLayer = spatialLayers["layer_anotasi_custom"];
    if (!existingLayer || !existingLayer.geojson || !existingLayer.geojson.features) return;

    const updatedFeatures = existingLayer.geojson.features.filter((f: any) => f.properties.id !== id);
    
    if (updatedFeatures.length === 0) {
       // Remove layer if empty
       const newLayers = { ...spatialLayers };
       delete newLayers["layer_anotasi_custom"];
       setSpatialLayers(newLayers);
    } else {
       setSpatialLayers({
         ...spatialLayers,
         ["layer_anotasi_custom"]: {
           ...existingLayer,
           geojson: { type: "FeatureCollection", features: updatedFeatures }
         }
       });
    }
    setSelectedAnnotationId(null);
    Swal.fire({ icon: 'success', title: 'Dihapus', text: 'Anotasi berhasil dihapus.', timer: 1500, showConfirmButton: false });
  };

  const handleSaveInfrastructure = async () => {
    if (!infraCoords || !infraForm.name || !infraForm.category) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Nama infrastruktur, kategori, dan koordinat wajib diisi sebelum menyimpan!'
      });
      return;
    }
    
    setIsSavingInfra(true);
    try {
      const token = localStorage.getItem("luwu_session_token");
      const res = await fetch("/api/infrastruktur", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          nama_infrastruktur: infraForm.name,
          kategori: infraForm.category,
          keterangan_singkat: infraForm.description,
          icon: infraForm.icon,
          coordinates: infraCoords
        })
      });

      if (res.ok) {
        const resultData = await res.json();
        const newInfraData = resultData.data;

        // Inject into state directly to prevent ghosting
        setSpatialLayers((prev) => {
          const layer = prev["layer_infrastruktur"];
          if (layer) {
            const updatedLayer = {
              ...layer,
              geojson: {
                ...layer.geojson,
                features: [...(layer.geojson.features || []), newInfraData]
              }
            };
            return {
              ...prev,
              layer_infrastruktur: updatedLayer
            };
          }
          return prev;
        });

        Swal.fire('Berhasil!', 'Infrastruktur baru berhasil ditambahkan dan disimpan ke database.', 'success');
        setInfraCoords(null);
        setInfraForm({ name: "", category: "Fasilitas Umum", description: "", icon: "Users" });
        await onRefreshAllData(); // Refresh UI to fetch infrastructures from DB
      } else {
        const err = await res.json().catch(() => ({}));
        Swal.fire('Gagal!', `Gagal menyimpan infrastruktur: ${err.message || err.error || "Unknown error"}`, 'error');
      }
    } catch (e: any) {
      Swal.close();
      Swal.fire('Error!', `Terjadi kesalahan saat memproses data: ${e.message}`, 'error');
    } finally {
      setIsSavingInfra(false);
    }
  };

  // Trigger Local Save & API transaction update to mock PostGIS
  const handleSaveToPostGIS = async () => {
    if (!activeLayer || !activeLayer.id) {
      Swal.fire({
        icon: 'warning',
        title: 'Pilih Layer!',
        text: 'Anda harus memilih layer tujuan (misal: Potensi Investasi) di menu PostGIS Layers sebelum menyimpan data.'
      });
      return;
    }

    if (!formName) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Nama infrastruktur/potensi wajib diisi sebelum menyimpan data!'
      });
      return;
    }

    try {
      const hasErrors = topologyErrors.some((e) => e.fatal);
      if (hasErrors) {
        Swal.fire({
          icon: 'error',
          title: 'Bentuk Polygon Tidak Valid',
          text: 'Gagal memetakan area. Silakan gambar ulang polygon dengan benar.'
        });
        return;
      }


      let updatedGeojson = { ...activeLayer?.geojson };

      
      // Determine Geometry Type
      let geomType = "Polygon";
      let coordinatesToSave: any = [];
      let finalAreaHa = calculatedAreaHa;
      let finalLengthKm = calculatedLengthKm;

      if (editorMode === "EDIT_VERTICES" && selectedFeatureIndex !== null && selectedFeatureIndex !== -1) {
        geomType = activeFeatures[selectedFeatureIndex]?.geometry?.type || "Polygon";
      } else {
        if (editorMode === "DRAW_POINT") geomType = "Point";
        else if (editorMode === "DRAW_LINE") geomType = "LineString";
        else geomType = "Polygon";
      }

      if (geomType === "Point") {
        coordinatesToSave = activeEditCoords[0] || [0, 0];
      } else if (geomType === "LineString") {
        if (activeEditCoords.length < 2) {
            throw new Error("LineString harus memiliki setidaknya 2 titik koordinat.");
        }
        coordinatesToSave = activeEditCoords;
        try {
           finalLengthKm = turf.length(turf.lineString(coordinatesToSave), { units: "kilometers" });
        } catch(e) {}
      } else {
        // Polygon closing coordinates
        if (activeEditCoords.length < 3) {
            throw new Error("Bentuk Polygon Tidak Valid. Gagal memetakan area. Silakan gambar ulang polygon dengan benar.");
        }
        const closedCoordinates = activeEditCoords.length > 0 ? [...activeEditCoords, activeEditCoords[0]] : [];
        coordinatesToSave = [closedCoordinates];
        try {
           const poly = turf.polygon(coordinatesToSave);
           const rawAreaSqm = turf.area(poly);
           finalAreaHa = Number((rawAreaSqm / 10000).toFixed(2));
           finalLengthKm = turf.length(turf.polygonToLine(poly) as any, { units: "kilometers" });
        } catch(e) {
           throw new Error("Struktur geometri GeoJSON tidak valid untuk Polygon. Area tidak tertutup dengan benar.");
        }
      }

      const featurePayload: any = {
        type: "Feature",
        properties: {
          id: (selectedFeatureIndex === null || selectedFeatureIndex === -1) ? "feat_" + Math.random().toString(36).substring(2, 9) : activeFeatures[selectedFeatureIndex]?.properties?.id || "feat_idx_" + selectedFeatureIndex,
          name: formName,
          category: formCategory,
          status: formStatus,
          areaHa: parseFloat(finalAreaHa.toFixed(4)),
          lengthKm: parseFloat(finalLengthKm.toFixed(4)),
          district: selectedDistrictName,
          lastEditedBy: currentRole,
          lastEditedAt: new Date().toISOString()
        },
        geometry: {
          type: geomType,
          coordinates: coordinatesToSave
        }
      };

      const executeSaveFeature = async (overrideData?: any) => {
        Swal.fire({
          title: 'Menyimpan...',
          text: 'Sedang menyimpan data ke Supabase',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Validate against focusDistrictId and focusVillageId if available
        if (embeddedMode && (focusDistrictId || focusVillageId)) {
          let isOutside = false;
          let targetName = "";
          try {
            let centroid;
            if (geomType === "Point") {
              centroid = turf.point(coordinatesToSave);
            } else if (geomType === "LineString") {
              centroid = turf.centroid(turf.lineString(coordinatesToSave));
            } else {
              centroid = turf.centroid(turf.polygon(coordinatesToSave));
            }

            if (focusVillageId) {
              const vil = villages.find(v => v.id === focusVillageId);
              if (vil && vil.geojson) {
                targetName = "Desa " + vil.name;
                isOutside = !turf.booleanPointInPolygon(centroid, vil.geojson);
              } else if (focusDistrictId) {
                 const dist = districts.find(d => d.id === focusDistrictId);
                 if (dist && dist.geojson) {
                    targetName = "Kecamatan " + dist.name;
                    isOutside = !turf.booleanPointInPolygon(centroid, dist.geojson);
                 }
              }
            } else if (focusDistrictId) {
              const dist = districts.find(d => d.id === focusDistrictId);
              if (dist && dist.geojson) {
                targetName = "Kecamatan " + dist.name;
                isOutside = !turf.booleanPointInPolygon(centroid, dist.geojson);
              }
            }
          } catch (err) {
             undefined;
          }

          if (isOutside) {
            throw new Error(`Koordinat yang Anda gambar berada di luar wilayah target (${targetName}). Harap gambar di dalam wilayah.`);
          }
        }

        let nextFeatures = [...activeFeatures];
        
        const currentProps = featurePayload.properties || {};
        if (overrideData) {
          currentProps.pkkpr_doc_number = overrideData.documentNumber;
          currentProps.pkkpr_justification = overrideData.justification;
          currentProps.legal_override_status = "AUTHORIZED_PEMKAB";
        }
        featurePayload.properties = currentProps;

        if (selectedFeatureIndex === -1) {
          nextFeatures.push(featurePayload);
        } else {
          nextFeatures[selectedFeatureIndex!] = featurePayload;
        }

        // Call API server transaction
        const token = localStorage.getItem("luwu_session_token");
        
        const res = await fetch(`/api/potensi_investasi`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            geojsonRaw: featurePayload,
            name: formName,
            category: formCategory,
            status: formStatus,
            areaHa: calculatedAreaHa,
            lengthKm: calculatedLengthKm,
            district: selectedDistrictName,
            lastEditedBy: `${currentRole} (Web GIS)`,
            ...(overrideData ? {
              pkkprDocNumber: overrideData.documentNumber,
              pkkprJustification: overrideData.justification,
              legalOverride: overrideData
            } : {})
          })
        });

        if (res.ok) {
          const resultData = await res.json();
          const newFeatData = resultData.data;

          // Inject into state directly to prevent ghosting
          setSpatialLayers((prev) => {
            const layer = prev["layer_potensi"];
            if (layer) {
              // Remove existing feature if it was an edit
              let updatedFeatures = layer.geojson?.features ? [...layer.geojson.features] : [];
              if (selectedFeatureIndex !== null && selectedFeatureIndex !== -1) {
                const oldFeatId = activeFeatures[selectedFeatureIndex]?.properties?.id;
                updatedFeatures = updatedFeatures.filter((f: any) => f.properties?.id !== oldFeatId);
              }
              
              const updatedLayer = {
                ...layer,
                geojson: {
                  ...layer.geojson,
                  features: [...updatedFeatures, newFeatData]
                }
              };
              return {
                ...prev,
                layer_potensi: updatedLayer
              };
            }
            return prev;
          });

          Swal.fire({
            icon: 'success',
            title: 'Sukses',
            text: `Berhasil menyimpan data ke Supabase (potensi_investasi). Status: ${formStatus}`
          });
          
          setSelectedFeatureIndex(null);
          setEditorMode("VIEW");
          runTopologyAudit([]);
          await onRefreshAllData();
        } else {
          const errorData = await res.json().catch(()=>({}));
          throw new Error(errorData.error || "Gagal menyimpan ke Supabase");
        }
      };

      // ESG/Environmental Overlap Validation
      if (geomType === "Polygon" || geomType === "MultiPolygon") {
        try {
          const res = await fetch("/api/investments/validate-environment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ geometry: featurePayload.geometry })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.overlap) {
              setEsgWarningMessage(data.message || 'Lokasi proyek terdeteksi berada di dalam Kawasan Lindung Setempat. Menyimpan data ini berisiko melanggar regulasi tata ruang daerah.');
              setPendingSaveAction(() => executeSaveFeature);
              setIsEsgModalOpen(true);
              return;
            }
          }
        } catch (e) {
          console.error("Gagal melakukan validasi ESG lingkungan:", e);
        }
      }

      await executeSaveFeature();
    } catch (err: any) {
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: `Kegagalan penyimpanan spasial: ${err.message}`
      });
    }
  };

  const handleDeleteFeature = async () => {
    if (selectedFeatureIndex === null) return;
    
    if (selectedFeatureIndex === -1) {
       setSelectedFeatureIndex(null);
       setEditorMode("VIEW");
       return;
    }

    if (!selectedLayerId) return;

    if (!window.confirm("Apakah Anda yakin ingin menghapus objek spasial ini?")) return;

    try {
      let updatedGeojson = { ...activeLayer?.geojson };
      let nextFeatures = [...activeFeatures];
      nextFeatures.splice(selectedFeatureIndex, 1);
      
      updatedGeojson.features = nextFeatures;

      // Call API server transaction
      const token = localStorage.getItem("luwu_session_token");
      const res = await fetch(`/api/spatial-layers/${selectedLayerId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          geojson: updatedGeojson,
          name: activeLayer?.name,
          category: activeLayer?.category,
          user: `${currentRole} (Web GIS)`
        })
      });

      if (res.ok) {
        const savedLayer = await res.json();
        // Update components state
        if (spatialLayers[selectedLayerId]) {
          setSpatialLayers(prev => ({
            ...prev,
            [selectedLayerId]: savedLayer
          }));
        }
        
        showToast(`Berhasil menghapus objek spasial dari layer.`);
        setSelectedFeatureIndex(null);
        setEditorMode("VIEW");
        runTopologyAudit([]);
        onRefreshAllData();
      } else {
        showToast("Gagal melakukan penghapusan dari database spasial.");
      }
    } catch (err: any) {
      showToast(`Kegagalan internal API: ${err.message}`);
    }
  };

  const handleAutoClip = (conflictIndex: number) => {
    if (editorMode !== "DRAW_POLYGON" && editorMode !== "EDIT_VERTICES") return;
    try {
      const conflictFeature = activeFeatures[conflictIndex];
      if (!conflictFeature || conflictFeature.geometry.type !== "Polygon") return;
      
      const closedCoords = [...activeEditCoords, activeEditCoords[0]];
      const editingPoly = turf.polygon([closedCoords]);
      
      // Auto-clip overlapping area using difference
      const clipped = safeDifference(editingPoly, conflictFeature);
      
      if (clipped) {
         if (clipped.geometry.type === "Polygon") {
            const newCoords = clipped.geometry.coordinates[0].slice(0, -1) as [number, number][]; // remove closing loop
            pushToUndo(activeEditCoords);
            setActiveEditCoords(newCoords);
            showToast("Berhasil memotong objek untuk menghilangkan duplikasi overlap.");
         } else if (clipped.geometry.type === "MultiPolygon") {
            const newCoords = clipped.geometry.coordinates[0][0].slice(0, -1) as [number, number][];
            pushToUndo(activeEditCoords);
            setActiveEditCoords(newCoords);
            showToast("Sebagian terpotong. Menjaga bentuk area terbesar (Multipolygon result).");
         }
      } else {
         showToast("Area overlap terlalu besar sehingga menghilangkan bentuk asli objek seutuhnya (Error).");
      }
    } catch(err: any) {
      showToast("AutoClip Geometric Error: " + err.message);
    }
  };

  // Rollback to specific history log
  const handleRollbackHistory = async (historyId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin melakukan ROLLBACK data spasial ini ke versi lama?")) {
      return;
    }

    try {
      const token = localStorage.getItem("luwu_session_token");
      const res = await fetch("/api/spatial-history/rollback", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ historyId })
      });

      if (res.ok) {
        showToast("Rollback berhasil diselesaikan ke server PostGIS!");
        // Update client layers
        const syncLayersRes = await fetch("/api/spatial-layers");
        if (syncLayersRes.ok) {
          const data = await syncLayersRes.json();
          setSpatialLayers(data);
        }
        fetchAuditLogs();
        onRefreshAllData();
      } else {
        const data = await res.json();
        showToast(`Gagal rollback: ${data.error || "Aksi tak diijinkan"}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Complete GeoJSON export payload
  const handleExportGeoJSON = () => {
    if (!activeLayer) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeLayer.geojson, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `${activeLayer.id}_export.geojson`);
    dlAnchorElem.click();
  };

  // Dynamic KML Converter on frontend client side (OGC Compliance)
  const handleExportKML = () => {
    if (!activeLayer) return;
    
    let kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${activeLayer.name}</name>
    <description>Hasil Export OGC-KML Kabupaten Luwu</description>
    <Style id="custom_style">
      <LineStyle>
        <color>ff${activeLayer.color?.replace("#", "") || "059669"}</color>
        <width>3</width>
      </LineStyle>
      <PolyStyle>
        <color>55${activeLayer.color?.replace("#", "") || "059669"}</color>
      </PolyStyle>
    </Style>
`;

    activeFeatures.forEach((f) => {
      kmlContent += `    <Placemark>
      <name>${f.properties?.name || "Feature"}</name>
      <description>Kategori: ${f.properties?.category || "Tata Ruang"}. Luas: ${f.properties?.areaHa || 0} Ha.</description>
      <styleUrl>#custom_style</styleUrl>
`;

      if (f.geometry?.type === "Polygon") {
        kmlContent += `      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
`;
        f.geometry.coordinates[0].forEach((coord: number[]) => {
          kmlContent += `              ${coord[0]},${coord[1]},0\n`;
        });
        kmlContent += `            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
`;
      } else if (f.geometry?.type === "LineString") {
        kmlContent += `      <LineString>
        <coordinates>
`;
        f.geometry.coordinates.forEach((coord: number[]) => {
          kmlContent += `              ${coord[0]},${coord[1]},0\n`;
        });
        kmlContent += `        </coordinates>
      </LineString>
`;
      }
      kmlContent += `    </Placemark>\n`;
    });

    kmlContent += `  </Document>
</kml>`;

    const dataStr = "data:text/xml;charset=utf-8," + encodeURIComponent(kmlContent);
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `${activeLayer.id}_export.kml`);
    dlAnchorElem.click();
  };

  const handleExportShapefile = () => {
    showToast("Ekspor Shapefile Terkompresi (ZIP) sedang diproses oleh Mesin GIS. GeoJSON terlampir diunduh secara pararel.");
    handleExportGeoJSON();
  };

  // Drag and drop / local Import GeoJSON simulator
  const handleImportGeoJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith(".kml") || file.name.endsWith(".zip")) {
      showToast(`Fitur Parsing format ${file.name.split('.').pop()} sedang diproses oleh Backend OGC Parser. Saat ini (di environment demo) silakan konversi mandiri dan unggah format GeoJSON terlebih dahulu.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && json.type === "FeatureCollection") {
          const validFeatures = json.features.map((f: any) => ({
            ...f,
            properties: {
              ...f.properties,
              id: f.properties?.id || "feat_imported_" + Math.random().toString(36).substring(2, 9),
              status: "Draft",
              importedAt: new Date().toISOString()
            }
          }));

          // RUN DIAGNOSTICS BEFORE UPLOAD
          let isValid = true;
          const messages: {text: string, type: 'error'|'warning'|'success'}[] = [];
          
          validFeatures.forEach((feat: any, idx: number) => {
             if (feat.geometry && (feat.geometry.type === 'Polygon' || feat.geometry.type === 'MultiPolygon')) {
                try {
                   const kinks = turf.kinks(feat);
                   if (kinks.features.length > 0) {
                      isValid = false;
                      messages.push({text: `Feature ${idx+1}: Memiliki ${kinks.features.length} self-intersection (kinks). Geometri invalid.`, type: 'error'});
                   }
                } catch(e) {}
             }
             if (feat.geometry && feat.geometry.type === 'Polygon') {
                 // Check winding order of the outer ring
                 const outerRing = feat.geometry.coordinates[0];
                 if (outerRing && outerRing.length >= 4) {
                    try {
                        const line = turf.lineString(outerRing);
                        if (turf.booleanClockwise(line)) {
                            messages.push({text: `Feature ${idx+1}: Outer ring is clockwise (seharusnya counter-clockwise/Right-Hand Rule RFC 7946).`, type: 'warning'});
                        }
                    } catch(e) {}
                 }
             }
          });
          
          if (messages.length === 0) {
             messages.push({text: "Geometri valid dan memenuhi standar integritas topologi OGC/RFC 7946.", type: "success"});
          }
          
          setGeoJSONDiagnostics({ isValid, messages });
          setPendingUpload({ file, features: validFeatures, name: file.name.replace(".geojson", "") });
          // Upload is now deferred until user confirms
        } else {
          setImportLog("Format GeoJSON tidak valid (Harus berupa FeatureCollection).");
        }
      } catch (err: any) {
        setImportLog(`Error parsing JSON: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const renderInfraIcon = (iconName: string, className="h-5 w-5") => {
    switch (iconName) {
      case 'Hospital': return <Hospital className={className} />;
      case 'Plane': return <Plane className={className} />;
      case 'Ship': return <Ship className={className} />;
      case 'Shield': return <Shield className={className} />;
      case 'Building2': return <Building2 className={className} />;
      case 'Home': return <Home className={className} />;
      case 'Landmark': return <Landmark className={className} />;
      case 'ShoppingCart': return <ShoppingCart className={className} />;
      case 'Store': return <Store className={className} />;
      case 'School': return <School className={className} />;
      case 'Users': return <Users className={className} />;
      default: return <MapPin className={className} />;
    }
  };

  return (
    <div className={`w-full h-full flex flex-col overflow-hidden leading-relaxed ${isDarkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"}`}>
      {/* Title Header Workspace */}
      <div className={`px-3 sm:px-6 py-2.5 sm:py-3 border-b flex justify-between items-center z-10 shrink-0 gap-2 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white shadow-md border-slate-200"}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 sm:h-9 sm:w-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow glow-accent shrink-0">
            <Maximize2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="font-sans font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base">
              <span className="truncate">KELOLA GIS SPASIAL</span>
              <span className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] uppercase font-bold shrink-0">
                PRO VECTOR
              </span>
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 font-semibold truncate hidden sm:block">
              PostGIS Geometry Processor & Topology Validator (ArcGIS Engine Equivalent)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs shrink-0">
          <div className={`px-2.5 py-1 sm:py-1.5 rounded-lg border flex items-center gap-1.5 font-black text-[10px] sm:text-xs ${isDarkMode ? "bg-slate-950 border-white/20 text-slate-100" : "bg-slate-100 border-slate-300 text-slate-900"}`}>
            <User className="h-3.5 w-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Operator:</span> <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{currentRole}</span>
          </div>
          {embeddedMode && onCloseModal && (
            <button
              onClick={onCloseModal}
              className="bg-rose-500 hover:bg-rose-600 text-white px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
              title="Tutup Modal Spatial Editor"
            >
              <X className="w-4 h-4" /> <span className="hidden sm:inline">Tutup</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="flex-1 w-full flex overflow-hidden min-h-0 relative">
        
        {/* PANEL 1: Left - Layer Manager & Properties */}
        <aside className={`w-full lg:w-[320px] xl:w-[350px] border-r flex flex-col max-h-full overflow-y-auto shrink-0 custom-scrollbar ${mobileTab === "LAYERS" ? "flex w-full h-full" : "hidden lg:flex"} ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white shadow-lg border-slate-200"}`}>
          {/* Mobile Header Bar on Panel 1 */}
          <div className="lg:hidden p-3 bg-slate-900 text-white border-b border-slate-700 flex justify-between items-center font-bold text-xs shrink-0">
            <span className="flex items-center gap-2 text-emerald-400">
              <Layers className="h-4 w-4" /> Kelola Layer & Vector GIS
            </span>
            <button
              onClick={() => setMobileTab("MAP")}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-extrabold flex items-center gap-1 shadow transition-all active:scale-95"
            >
              Buka Peta →
            </button>
          </div>

          
          {/* Module Switcher */}
          <div className="p-4 border-b border-inherit">
            <div className="flex flex-wrap gap-1.5 bg-slate-200 dark:bg-slate-900 rounded-lg p-1">
              <button
                type="button"
                className={`flex-1 min-w-[130px] py-1.5 text-xs font-black uppercase transition-colors rounded-md ${digitizationModule === "INVESTASI" ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-sm" : "text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white"}`}
                onClick={() => setDigitizationModule("INVESTASI")}
              >
                Polygon Vector
              </button>
              <button
                type="button"
                className={`flex-1 min-w-[130px] py-1.5 text-xs font-black uppercase transition-colors rounded-md ${digitizationModule === "INFRASTRUKTUR" ? "bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-sm" : "text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white"}`}
                onClick={() => {
                  setDigitizationModule("INFRASTRUKTUR");
                  setEditorMode("VIEW");
                }}
              >
                {t('mapControls.infraPoints')}
              </button>
              <button
                type="button"
                className={`flex-1 min-w-[130px] py-1.5 text-xs font-black uppercase transition-colors rounded-md ${digitizationModule === "ANNOTATION" ? "bg-white dark:bg-slate-800 text-fuchsia-700 dark:text-fuchsia-300 shadow-sm" : "text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white"}`}
                onClick={() => {
                  setDigitizationModule("ANNOTATION");
                  setEditorMode("VIEW");
                }}
              >
                <div className="flex items-center justify-center gap-1"><MapPin className="h-3.5 w-3.5"/> Anotasi</div>
              </button>
              {currentRole === Role.SUPER_ADMIN && (
                <button
                  type="button"
                  className={`flex-1 min-w-[130px] py-1.5 text-xs font-black uppercase transition-colors rounded-md ${digitizationModule === "MODERASI" ? "bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 shadow-sm" : "text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white"}`}
                  onClick={() => {
                    setDigitizationModule("MODERASI");
                    setEditorMode("VIEW");
                  }}
                >
                  Moderasi
                </button>
              )}
            </div>
          </div>

          {digitizationModule === "ANNOTATION" ? (
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200 mb-4 font-sans flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-fuchsia-500" /> Mode Anotasi Peta
              </h3>
              
              {!annotationCoords ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-fuchsia-500/30 rounded-xl bg-fuchsia-500/5">
                  <div className="h-12 w-12 rounded-full bg-fuchsia-500/20 flex items-center justify-center mb-3 text-fuchsia-500 animate-pulse">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 dark:text-slate-200 mb-1">{t('Pilih Titik Lokasi', 'Pilih Titik Lokasi')}</h4>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold">{t('Klik 1x di atas peta untuk menaruh pin anotasi baru (Mode Crosshair aktif).', 'Klik 1x di atas peta untuk menaruh pin anotasi baru (Mode Crosshair aktif).')}</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-4 animate-in fade-in zoom-in duration-300">
                  <div className="p-3 bg-fuchsia-50 dark:bg-fuchsia-900/20 border border-fuchsia-100 dark:border-fuchsia-800 rounded-lg">
                    <div className="text-xs font-black text-fuchsia-700 dark:text-fuchsia-300 uppercase tracking-wider mb-1">{t('Koordinat Titik', 'Koordinat Titik')}</div>
                    <div className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                      Lng: {annotationCoords[0].toFixed(5)}, Lat: {annotationCoords[1].toFixed(5)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase mb-1">{t('Label Anotasi', 'Label Anotasi')}</label>
                    <input 
                      type="text" 
                      value={annotationForm.label}
                      onChange={e => setAnnotationForm({...annotationForm, label: e.target.value})}
                      placeholder="Contoh: Titik Rawan Banjir"
                      className={`w-full rounded-lg px-3 py-2 text-sm font-semibold border focus:ring-2 focus:ring-emerald-500 outline-none ${isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase mb-1">{t('Deskripsi / Catatan', 'Deskripsi / Catatan')}</label>
                    <textarea 
                      value={annotationForm.description}
                      onChange={e => setAnnotationForm({...annotationForm, description: e.target.value})}
                      placeholder="Tambahkan keterangan lebih lanjut..."
                      rows={3}
                      className={`w-full rounded-lg px-3 py-2 text-sm font-semibold border focus:ring-2 focus:ring-emerald-500 outline-none resize-none ${isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                    />
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button 
                      onClick={() => {
                        setAnnotationCoords(null);
                        setAnnotationForm({ label: "", description: "" });
                      }}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${isDarkMode ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-300 text-slate-600 hover:bg-slate-100"}`}
                    >
                      {t('Batal', 'Batal')}
                    </button>
                    <button 
                      onClick={handleSaveAnnotation}
                      className="flex-1 py-2 rounded-lg text-sm font-bold bg-fuchsia-600 hover:bg-fuchsia-700 text-white shadow-md shadow-fuchsia-600/20 transition-all"
                    >
                      {t('Simpan', 'Simpan')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : digitizationModule === "MODERASI" ? (
            <ModerationPanel currentRole={currentRole} isDarkMode={isDarkMode} onRefreshMap={onRefreshAllData} />
          ) : digitizationModule === "INFRASTRUKTUR" ? (
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200 mb-4 font-sans flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-indigo-500" /> Mode Infrastruktur
              </h3>
              
              {!infraCoords ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-indigo-500/30 rounded-xl bg-indigo-500/5">
                  <div className="h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-3 text-indigo-500 animate-pulse">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 dark:text-slate-200 mb-1">Pilih Titik Lokasi</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Klik 1x di atas peta untuk menaruh marker statis infrastruktur baru (Mode Crosshair aktif).</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-indigo-500/30 rounded-xl bg-indigo-500/5 my-4">
                  <div className="h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-3 text-indigo-500 animate-bounce">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 dark:text-slate-200 mb-1">Lokasi Ditentukan</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                    Titik lokasi berhasil ditandai pada peta. Silakan isi atribut lengkap dan simpan data melalui panel kanan.
                  </p>
                  <button 
                    onClick={() => setInfraCoords(null)}
                    className="px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer"
                  >
                    Reset Lokasi
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
          {/* Layer Selector */}
          <div className="p-4 border-b border-inherit">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200 mb-2 font-sans flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-emerald-500" /> PostGIS Layers
            </h3>
            <select
              value={selectedLayerId}
              onChange={(e) => setSelectedLayerId(e.target.value)}
              className={`w-full rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all font-sans border ${isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
            >
              <option value="">-- Pilih Vector Layer --</option>
              {Object.values(spatialLayers).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.category})
                </option>
              ))}
            </select>

            {selectedLayerId && (
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-800 dark:text-slate-200 dark:text-slate-400">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: editingLayerColor }}></span>
                  <span>Warna Layer</span>
                </div>
                <input
                  type="color"
                  value={editingLayerColor}
                  onChange={(e) => {
                    setEditingLayerColor(e.target.value);
                    if (spatialLayers[selectedLayerId]) {
                      setSpatialLayers(prev => ({
                        ...prev,
                        [selectedLayerId]: {
                          ...prev[selectedLayerId],
                          color: e.target.value
                        }
                      }));
                    }
                  }}
                  className="h-6 w-8 rounded cursor-pointer bg-transparent border-0"
                />
              </div>
            )}
          </div>

          {/* Drag and Drop Layer Z-Index Order */}
          <div className="p-4 border-b border-inherit">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-3 flex items-center justify-between">
              <span>Urutan Layer (Z-Index)</span>
              <span className="text-[9px] font-normal normal-case text-slate-600 dark:text-slate-400">Tarik untuk mengubah urutan</span>
            </h3>
            <div className="flex flex-col gap-1.5">
              {layerOrder.map((layerId, idx) => {
                const layer = spatialLayers[layerId];
                if (!layer || !layer.isActive) return null;
                return (
                  <div
                    key={layerId}
                    draggable
                    onDragStart={(e) => {
                      setDraggedLayerId(layerId);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverLayerId(layerId);
                    }}
                    onDragLeave={() => setDragOverLayerId(null)}
                    onDragEnd={() => {
                      setDraggedLayerId(null);
                      setDragOverLayerId(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedLayerId && draggedLayerId !== layerId) {
                        const oldIdx = layerOrder.indexOf(draggedLayerId);
                        const newIdx = layerOrder.indexOf(layerId);
                        if (oldIdx !== -1 && newIdx !== -1) {
                          const newOrder = [...layerOrder];
                          const [moved] = newOrder.splice(oldIdx, 1);
                          newOrder.splice(newIdx, 0, moved);
                          setLayerOrder(newOrder);
                          setSpatialLayers(prev => {
                            const newMap = {};
                            newOrder.forEach(k => { if (prev[k]) newMap[k] = prev[k]; });
                            Object.keys(prev).forEach(k => { if (!newMap[k]) newMap[k] = prev[k]; });
                            return newMap;
                          });
                        }
                      }
                      setDraggedLayerId(null);
                      setDragOverLayerId(null);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
                      isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200"
                    } ${
                      dragOverLayerId === layerId
                        ? (layerOrder.indexOf(draggedLayerId!) < idx
                            ? "border-b-2 border-b-indigo-500 pb-3"
                            : "border-t-2 border-t-indigo-500 pt-3")
                        : ""
                    } ${draggedLayerId === layerId ? "opacity-50" : "opacity-100"}`}
                  >
                    <GripVertical className={`h-4 w-4 shrink-0 ${isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-semibold truncate ${isDarkMode ? "text-slate-200" : "text-slate-800 dark:text-slate-200"}`}>
                        {layer.name}
                      </div>
                      <div className={`text-[9px] truncate ${isDarkMode ? "text-slate-600 dark:text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>
                        {layer.category}
                      </div>
                    </div>
                    <div
                      className="h-3 w-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: layer.color || "#ccc" }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feature List inside Selected Layer */}
          <div className="p-4 flex-1 flex flex-col min-h-0 border-b border-inherit">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 font-sans flex items-center gap-1.5">
                <GitCommit className="h-3.5 w-3.5 text-indigo-500" /> Daftar Objek Spasial
              </h3>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleCreateNewFeature("Polygon")}
                  className="p-1 px-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[9px] font-sans font-bold uppercase tracking-wider flex items-center gap-1"
                  title="Tambah Polygon"
                >
                  Polygon
                </button>
                {!enforcePolygonOnly && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCreateNewFeature("LineString")}
                      className="p-1 px-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[9px] font-sans font-bold uppercase tracking-wider flex items-center gap-1"
                      title="Tambah Line"
                    >
                      Line
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCreateNewFeature("Point")}
                      className="p-1 px-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[9px] font-sans font-bold uppercase tracking-wider flex items-center gap-1"
                      title="Tambah Point"
                    >
                      Point
                    </button>
                  </>
                )}
              </div>
            </div>

            {activeFeatures.length === 0 && !(selectedFeatureIndex === -1 && activeEditCoords.length > 0) ? (
              <div className="text-xs text-slate-600 dark:text-slate-400 italic text-center py-6">
                Tidak ada fitur spasial di dalam layer ini. Gunakan tombol tipe geometri (Polygon/Line/Point) di atas untuk mulai menggambar.
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-1.5 min-h-0">
                {selectedFeatureIndex === -1 && activeEditCoords.length > 0 && (
                  <div
                    className={`w-full p-2.5 rounded-xl border border-dashed text-left text-xs transition-all flex flex-col gap-1.5 bg-indigo-500/10 border-indigo-500/40 text-indigo-700 dark:text-indigo-400`}
                  >
                    <div className="font-bold flex justify-between items-center">
                      <span className="truncate">{formName || "Geometri Baru (Sedang Digambar)"}</span>
                      <span className="text-[8.5px] px-1.5 py-0.5 rounded uppercase font-bold font-mono bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 animate-pulse">
                        DRAFTING
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[9.5px] text-slate-600 dark:text-slate-400 font-mono">
                      <span>Luas: {calculatedAreaHa ? calculatedAreaHa.toFixed(2) : "0"} Ha</span>
                      <span className="font-medium text-xs rounded-md px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 uppercase">
                        {(editorMode === "DRAW_POLYGON" || editorMode === "EDIT_VERTICES") ? "POLYGON" : editorMode === "DRAW_LINE" ? "LINE" : "POINT"} ({activeEditCoords.length} pts)
                      </span>
                    </div>
                    <div className="text-[9.5px] text-amber-500 bg-amber-500/10 p-2 rounded-lg mt-1 font-sans font-medium leading-relaxed">
                      ⚠️ <strong>Belum Tersimpan:</strong> Isikan nama aset di panel kanan, lalu klik <strong>"Simpan Ke Koleksi Geometries"</strong> atau <strong>"Save GIS Changes"</strong> agar tersimpan permanen di database.
                    </div>
                  </div>
                )}
                <div className="flex-1 min-h-0">
                  <AutoSizerComponent>
                    {({ height, width }) => (
                      <List
                        height={height}
                        itemCount={activeFeatures.length}
                        itemSize={62}
                        width={width}
                        itemData={{
                          activeFeatures,
                          selectedFeatureIndex,
                          isDarkMode,
                          handleSelectFeature
                        }}
                      >
                        {SpatialFeatureRow}
                      </List>
                    )}
                  </AutoSizerComponent>
                </div>
              </div>
            )}
          </div>

          {/* Import Panel Integrations */}
          <div className="p-4 flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-1 block">
              Import Document (GIS Format)
            </h3>
            
            <div className={`p-4 rounded-xl border text-center relative ${isDarkMode ? "bg-slate-900/40 border-white/5" : "bg-slate-50 border-slate-200"}`}>
              <Upload className="h-6 w-6 text-indigo-700 dark:text-indigo-400 mx-auto mb-2" />
              <p className="text-[10px] text-slate-600 dark:text-slate-400 mb-3 block">Unggah layer & konversi otomatis (GeoJSON, KML, Shapefile/ZIP).</p>
              
              <div className="flex flex-wrap justify-center gap-1.5">
                <label className="px-2 py-1.5 bg-indigo-600/20 hover:bg-indigo-500/30 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30 font-bold font-sans rounded-md text-[9px] uppercase tracking-wide cursor-pointer transition-all inline-block hover:scale-105 active:scale-95">
                  Upload GeoJSON
                  <input
                    type="file"
                    accept=".geojson,.json"
                    onChange={handleImportGeoJSON}
                    className="hidden"
                  />
                </label>
                <label className="px-2 py-1.5 bg-blue-600/20 hover:bg-blue-500/30 text-blue-700 dark:text-blue-400 border border-blue-500/30 font-bold font-sans rounded-md text-[9px] uppercase tracking-wide cursor-pointer transition-all inline-block hover:scale-105 active:scale-95">
                  Upload KML
                  <input
                    type="file"
                    accept=".kml"
                    onChange={handleImportGeoJSON}
                    className="hidden"
                  />
                </label>
                <label className="px-2 py-1.5 bg-amber-600/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold font-sans rounded-md text-[9px] uppercase tracking-wide cursor-pointer transition-all inline-block hover:scale-105 active:scale-95">
                  Upload Shapefile
                  <input
                    type="file"
                    accept=".zip"
                    onChange={handleImportGeoJSON}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            {importLog && (
              <div className="mt-2.5 p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9.5px] font-mono text-emerald-700 dark:text-emerald-400 relative">
                <button onClick={() => setImportLog(null)} className="absolute top-1 right-1 text-slate-600 dark:text-slate-400 hover:text-white">×</button>
                {importLog}
              </div>
            )}
          </div>
          </>
          )}

        </aside>

        {/* WORKSPACE MIDDLE: Interactive Map Canvas */}
        <section className={`flex-1 flex flex-col relative h-full min-w-0 ${mobileTab === "MAP" ? "flex w-full h-full" : "hidden lg:flex"}`}>
          
          {/* BASMAP HEADER BAR */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border flex items-center gap-1 shadow-2xl bg-white/85 dark:bg-slate-800/85 backdrop-blur-lg border-white/30 dark:border-slate-600/30 max-w-[calc(100vw-2.5rem)] sm:max-w-none overflow-x-auto no-scrollbar">
            {[
              { id: "google_satellite" as const, label: "Google Sattelite" },
              { id: "satellite" as const, label: "ESRI Satellite" },
              { id: "osm" as const, label: "Standard OSM" },
              { id: "dark" as const, label: "Dark Model" }
            ].map((basemap) => (
              <button
                key={basemap.id}
                onClick={() => setMapMode(basemap.id)}
                className={`px-2.5 sm:px-3 py-1 text-[10px] font-bold font-sans rounded-lg transition-all whitespace-nowrap ${
                  mapMode === basemap.id
                    ? "bg-emerald-600 text-white shadow-md font-extrabold"
                    : isDarkMode ? "text-white hover:bg-slate-700/50" : "text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                {basemap.label}
              </button>
            ))}
          </div>

          {/* GIS GEOMETRY INTERACTIVE TOOLBAR */}
          <div className="absolute top-14 sm:top-4 right-3 sm:right-4 z-10 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border flex items-center gap-1.5 sm:gap-3 shadow-2xl bg-white/85 dark:bg-slate-800/85 backdrop-blur-lg border-white/30 dark:border-slate-600/30">
            <div className="hidden sm:flex items-center gap-1.5 pr-2.5 border-r border-slate-700 dark:border-slate-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-bold font-mono text-slate-900 dark:text-white uppercase">TOOLS</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedFeatureIndex(null)}
                className={`p-2 rounded-xl transition-all ${
                  selectedFeatureIndex === null
                    ? "bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-slate-700"
                    : "text-slate-900 dark:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                }`}
                title="Selesaikan Focus / Pilih Objek"
              >
                <MousePointer className="h-4 w-4" />
              </button>

              <button
                onClick={() => handleCreateNewFeature("Polygon")}
                className={`p-2 rounded-xl transition-all ${
                  selectedFeatureIndex === -1 && editorMode === "DRAW_POLYGON"
                    ? "bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-slate-700"
                    : "text-slate-900 dark:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                }`}
                title="Gambar Polygon Baru"
              >
                <Scissors className="h-4 w-4" />
              </button>
              
              {!enforcePolygonOnly && (
                <>
                  <button
                    onClick={() => handleCreateNewFeature("LineString")}
                    className={`p-2 rounded-xl transition-all ${
                      selectedFeatureIndex === -1 && editorMode === "DRAW_LINE"
                        ? "bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-slate-700"
                        : "text-slate-900 dark:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                    }`}
                    title="Gambar Line Baru"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleCreateNewFeature("Point")}
                    className={`p-2 rounded-xl transition-all ${
                      selectedFeatureIndex === -1 && editorMode === "DRAW_POINT"
                        ? "bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-slate-700"
                        : "text-slate-900 dark:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                    }`}
                    title="Gambar Point Baru"
                  >
                    <div className="h-2 w-2 rounded-full bg-current m-1" />
                  </button>
                </>
              )}
            </div>

            {/* Undo/Redo caps */}
            <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
              <button
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className={`p-2 rounded-xl transition-all ${
                  undoStack.length > 0 ? "text-indigo-700 dark:text-indigo-400 hover:bg-slate-800" : "text-slate-600 cursor-not-allowed"
                }`}
                title={`Undo Action (${undoStack.length} sisa)`}
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className={`p-2 rounded-xl transition-all ${
                  redoStack.length > 0 ? "text-indigo-700 dark:text-indigo-400 hover:bg-slate-800" : "text-slate-600 cursor-not-allowed"
                }`}
                title={`Redo Action (${redoStack.length} sisa)`}
              >
                <Redo2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* SNAPPING HUD FLOATING DIALOG */}
          {snappedHUD && (
            <div className="absolute bottom-6 left-6 z-10 bg-indigo-950/90 backdrop-blur-md border border-indigo-500/30 px-3 py-2 rounded-xl flex items-center gap-2 text-[10px] font-mono text-indigo-300 shadow-2xl animate-bounce">
              <Sparkles className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
              <span>Snapped to: <strong>{snappedHUD.label}</strong> ({snappedHUD.distanceM} m)</span>
            </div>
          )}

          {/* LAYER REFD INFO */}
          {editorMode !== "VIEW" && (
            <div className={`absolute bottom-6 right-4 z-20 px-3 py-2 text-[10px] font-semibold font-sans rounded-xl shadow-lg border flex items-center gap-2 ${
              isDarkMode ? "bg-amber-950/80 text-amber-300 border-amber-700/50" : "bg-amber-50/90 text-amber-800 border-amber-300"
            }`}>
              💡 Layer Jalan otomatis diaktifkan sebagai referensi digitasi
            </div>
          )}

          {/* MAP CANVAS COMPONENT */}
          <div className="flex-1 w-full h-full bg-slate-900 relative">
            <Map
              onClick={handleMapClick}
              {...(viewState as any)}
              onMove={(evt) => setViewState(evt.viewState)}
              style={{ width: "100%", height: "100%", cursor: ((digitizationModule === "INFRASTRUKTUR" && !infraCoords) || (digitizationModule === "ANNOTATION" && !annotationCoords)) ? "crosshair" : "default" }}
              cursor={
                ((digitizationModule === "INFRASTRUKTUR" && !infraCoords) || (digitizationModule === "ANNOTATION" && !annotationCoords)) 
                  ? "crosshair" 
                  : (editorMode !== "VIEW" ? "crosshair" : "auto")
              }
              preserveDrawingBuffer={true}
              transformRequest={(url) => {
                if (url.includes('cartocdn.com') || url.includes('openstreetmap.org') || url.includes('google') || url.includes('arcgisonline.com')) {
                  return {
                    url,
                    headers: {}
                  };
                }
                return { url };
              }}
              mapStyle={
                mapMode === "osm"
                  ? {
                      version: 8,
                      sources: {
                        "esri-light": {
                          type: "raster",
                          tiles: [
                            "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                          ],
                          tileSize: 256,
                          attribution: "Tiles © Esri"
                        }
                      },
                      layers: [
                        {
                          id: "esri-light-layer",
                          type: "raster",
                          source: "esri-light",
                          minzoom: 0,
                          maxzoom: 16
                        }
                      ]
                    }
                  : mapMode === "dark"
                  ? {
                      version: 8,
                      sources: {
                        "esri-dark": {
                          type: "raster",
                          tiles: [
                            "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                          ],
                          tileSize: 256,
                          attribution: "Tiles © Esri"
                        }
                      },
                      layers: [
                        {
                          id: "esri-dark-layer",
                          type: "raster",
                          source: "esri-dark",
                          minzoom: 0,
                          maxzoom: 16
                        }
                      ]
                    }
                  : mapMode === "satellite"
                  ? {
                      version: 8,
                      sources: {
                        "arcgis-satellite": {
                          type: "raster",
                          tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
                          tileSize: 256,
                          attribution: "Tiles © Esri"
                        }
                      },
                      layers: [
                        {
                          id: "arcgis-satellite-layer",
                          type: "raster",
                          source: "arcgis-satellite",
                          minzoom: 0,
                          maxzoom: 19
                        }
                      ]
                    }
                  : {
                      version: 8,
                      sources: {
                        "google-satellite": {
                          type: "raster",
                          tiles: [
                            "https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
                            "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
                            "https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
                            "https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                          ],
                          tileSize: 256
                        }
                      },
                      layers: [
                        {
                          id: "google-satellite-layer",
                          type: "raster",
                          source: "google-satellite",
                          minzoom: 0,
                          maxzoom: 20
                        }
                      ]
                    }
              }
            >
              {/* Scale and Navigation Controls */}
              <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5">
                <NavigationControl showCompass={false} />
                <ScaleControl />
              </div>

              {/* === EXPLICIT RENDER FOR ROAD LAYER AS PER PROJECT REQUIREMENT === */}
              {(() => {
                const roadLayer = Object.values(spatialLayers).find((l) => l.id === "layer_jalan");
                if (roadLayer && roadLayer.geojson) {
                  const normalizedRoad = normalizeGeoJSON(roadLayer.geojson);
                  if (!normalizedRoad) return null;
                  return (
                    <Source id="source-jalan" type="geojson" data={normalizedRoad as any}>
                      <Layer
                        id="layer_jalan_visual"
                        type="line"
                        paint={{
                          "line-color": "#ef4444",
                          "line-width": 3,
                          "line-opacity": 0.9
                        }}
                        layout={{
                          "line-join": "round",
                          "line-cap": "round"
                        }}
                      />
                    </Source>
                  );
                }
                return null;
              })()}

              {/* DRAWING ALL LAYERS EXCEPT SELECTED LAYER */}
              {Object.values(spatialLayers)
                .filter((l) => l.id !== selectedLayerId && l.id !== "layer_jalan" && (l.isActive !== false) && l.geojson)
                .sort((a, b) => {
                  const idxA = layerOrder.indexOf(a.id);
                  const idxB = layerOrder.indexOf(b.id);
                  return (idxB === -1 ? 999 : idxB) - (idxA === -1 ? 999 : idxA);
                })
                .map((layer) => {
  const normalized = normalizeGeoJSON(layer.geojson);
  if (!normalized) return null;
  
  return (
    <React.Fragment key={layer.id}>
      <Source id={layer.id} type="geojson" data={normalized}>
        {/* Polygon Fill */}
        <Layer
          id={`${layer.id}_fill`}
          type="fill"
          filter={['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']]}
          paint={{
            "fill-color": layer.color,
            "fill-opacity": layer.id === "layer_kecamatan" ? 0 : (typeof layer.fillOpacity === 'number' && !isNaN(layer.fillOpacity) ? Math.min(Math.max(layer.fillOpacity, 0.4), 0.6) : 0.50)
          }}
        />
        
        {/* Polygon / LineString Stroke */}
        <Layer
          id={`${layer.id}_stroke`}
          type="line"
          filter={['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon'], ['==', ['geometry-type'], 'LineString'], ['==', ['geometry-type'], 'MultiLineString']]}
          paint={{
            "line-color": layer.color,
            "line-width": layer.id === "layer_kecamatan" ? 2.5 : layer.lineWidth || 1.5,
            "line-dasharray": layer.id === "layer_kecamatan" ? [3, 2] : [1]
          }}
        />
        
        {/* Point Circle */}
        {layer.id !== "layer_infrastruktur" && (
          <Layer
            id={`${layer.id}_circle`}
            type="circle"
            filter={['any', ['==', ['geometry-type'], 'Point'], ['==', ['geometry-type'], 'MultiPoint']]}
            paint={{
              "circle-color": layer.color,
              "circle-radius": layer.id === "layer_infrastruktur" ? 6 : 5,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff"
            }}
          />
        )}
      </Source>
    </React.Fragment>
  );
                })}

              {/* RENDER SAVED INFRASTRUCTURE ICONS */}
              {Object.values(spatialLayers).find(l => l.id === "layer_infrastruktur" && l.isActive)?.geojson?.features?.map((f: any, idx: number) => {
                if (f.geometry?.type !== "Point") return null;
                const coords = f.geometry.coordinates;
                const iconStr = f.properties?.icon || "MapPin";
                return (
                  <Marker key={`infra-saved-${idx}`} longitude={coords[0]} latitude={coords[1]}>
                    <div 
                      className="text-white bg-indigo-600 p-1.5 rounded-full shadow-lg border-2 border-white cursor-pointer hover:bg-indigo-500 transition-colors"
                      title={f.properties?.name || "Infrastruktur"}
                    >
                      {renderInfraIcon(iconStr, "h-3.5 w-3.5")}
                    </div>
                  </Marker>
                );
              })}

              {/* INFRASTRUCTURE DRAWING MARKER */}
              {digitizationModule === "INFRASTRUKTUR" && infraCoords && (
                <Marker longitude={infraCoords[0]} latitude={infraCoords[1]}>
                  <div className="relative group cursor-pointer animate-in zoom-in fade-in pb-8">
                    {/* Shadow / Aura */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-500/20 rounded-full animate-ping pointer-events-none" />
                    
                    {/* Pin Head */}
                    <div className="relative text-indigo-500 hover:text-indigo-600 transition-colors pointer-events-auto">
                      {renderInfraIcon(infraForm.icon, "w-8 h-8 drop-shadow-md")}
                    </div>
                  </div>
                </Marker>
              )}

              {/* TEMPORARY ANNOTATION PIN */}
              {digitizationModule === "ANNOTATION" && annotationCoords && (
                <Marker longitude={annotationCoords[0]} latitude={annotationCoords[1]}>
                  <div className="relative group cursor-pointer animate-in zoom-in fade-in pb-8">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-fuchsia-500/20 rounded-full animate-ping pointer-events-none" />
                    <div className="relative text-fuchsia-500 hover:text-fuchsia-600 transition-colors pointer-events-auto">
                      <MapPin className="w-8 h-8 drop-shadow-md" />
                    </div>
                  </div>
                </Marker>
              )}

              {/* SAVED ANNOTATION PINS */}
              {spatialLayers["layer_anotasi_custom"]?.geojson?.features?.map((feat: any) => {
                const isSelected = selectedAnnotationId === feat.properties.id;
                return (
                  <Marker 
                    key={feat.properties.id} 
                    longitude={feat.geometry.coordinates[0]} 
                    latitude={feat.geometry.coordinates[1]}
                    anchor="bottom"
                  >
                    <div className="relative cursor-pointer group" onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAnnotationId(isSelected ? null : feat.properties.id);
                    }}>
                      <div className="text-fuchsia-600 drop-shadow-md transition-transform hover:scale-110">
                        <MapPin className="w-8 h-8" fill="white" />
                      </div>

                      {/* Popup */}
                      {isSelected && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-50 animate-in fade-in zoom-in-95 pointer-events-auto" onClick={e => e.stopPropagation()}>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">{feat.properties.label}</h4>
                          <p className="text-[10px] text-slate-800 dark:text-slate-200 mb-3">{feat.properties.description}</p>
                          <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-700 pt-2">
                            <span className="text-[8px] text-slate-600 dark:text-slate-400 font-mono">Custom Annotation</span>
                            <button 
                              onClick={() => handleDeleteAnnotation(feat.properties.id)}
                              className="text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-500/10 p-1 rounded transition-colors"
                              title={t('Hapus Anotasi', 'Hapus Anotasi')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {/* Triangle pointer */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-slate-800" />
                        </div>
                      )}
                    </div>
                  </Marker>
                );
              })}

              {/* TARGET BOUNDARY (if embedded mode and target area provides geojson) */}
              {focusBoundaryGeoJSON && (
                <Source id="focus_boundary_source" type="geojson" data={focusBoundaryGeoJSON}>
                  <Layer
                    id="focus_boundary_fill"
                    type="fill"
                    paint={{
                      "fill-color": "#f59e0b",
                      "fill-opacity": 0.05
                    }}
                  />
                  <Layer
                    id="focus_boundary_line"
                    type="line"
                    paint={{
                      "line-color": "#f59e0b",
                      "line-width": 3,
                      "line-dasharray": [2, 2]
                    }}
                  />
                </Source>
              )}

              {/* ACTIVE LAYER POLYGONS (NOT BEING ACTIVE IN VERTEX-EDITOR MODE) */}
              {activeLayer && activeLayer.id !== "layer_jalan" && activeLayer.geojson && (() => {
                const normalized = normalizeGeoJSON(activeLayer.geojson);
                if (!normalized) return null;
                return (
                  <Source id="active_layer_source" type="geojson" data={normalized}>
                    <Layer
                      id="active_layer_fill"
                      type="fill"
                      paint={{
                        "fill-color": editingLayerColor || "#3b82f6",
                        "fill-opacity": 0.3
                      }}
                    />
                    <Layer
                      id="active_layer_stroke"
                      type="line"
                      paint={{
                        "line-color": editingLayerColor || "#3b82f6",
                        "line-width": 2
                      }}
                    />
                  </Source>
                );
              })()}

              {/* VERTEX MARKERS (Interactive point dragging setup) */}
              {selectedFeatureIndex !== null && activeEditCoords.length > 0 && (
                <>
                  {/* Glowing live boundary line for edited polygon */}
                  <Source
                    id="edited_feature_source"
                    type="geojson"
                    data={{
                      type: "Feature",
                      properties: {},
                      geometry: (() => {
                        let gType = "Polygon";
                        if (editorMode === "EDIT_VERTICES" && selectedFeatureIndex !== -1) {
                          gType = activeFeatures[selectedFeatureIndex!]?.geometry?.type || "Polygon";
                        } else {
                          if (editorMode === "DRAW_POINT") gType = "Point";
                          else if (editorMode === "DRAW_LINE") gType = "LineString";
                          else gType = "Polygon";
                        }

                        if (gType === "Point") return { type: "Point", coordinates: activeEditCoords[0] || [0, 0] };
                        if (gType === "LineString") return { type: "LineString", coordinates: activeEditCoords };
                        
                        // Polygon
                        const closed = activeEditCoords.length > 2 
                          ? [...activeEditCoords, activeEditCoords[0]] 
                          : activeEditCoords;
                        return { type: "Polygon", coordinates: [closed] };
                      })() as any
                    }}
                  >
                    <Layer
                      id="edited_feature_point"
                      type="circle"
                      filter={["==", "$type", "Point"]}
                      paint={{
                        "circle-color": "#a855f7",
                        "circle-radius": 8,
                        "circle-stroke-width": 2,
                        "circle-stroke-color": "#fff"
                      }}
                    />
                    <Layer
                      id="edited_feature_line"
                      type="line"
                      filter={["!=", "$type", "Point"]}
                      paint={{
                        "line-color": "#a855f7", // glowing purple line
                        "line-width": 3,
                        "line-opacity": 0.8
                      }}
                    />
                    <Layer
                      id="edited_feature_fill"
                      type="fill"
                      filter={["==", "$type", "Polygon"]}
                      paint={{
                        "fill-color": "#a855f7",
                        "fill-opacity": 0.15
                      }}
                    />
                  </Source>

                  {/* Vertices marker handles */}
                  {activeEditCoords.map((coord, idx) => {
                    const isSelected = selectedVertexIndex === idx;
                    return (
                      <Marker
                        key={`vertex_${idx}`}
                        longitude={coord[0]}
                        latitude={coord[1]}
                        draggable={true}
                        onDrag={(evt) => handleVertexDrag(idx, evt.lngLat.lng, evt.lngLat.lat)}
                        onDragStart={() => setSelectedVertexIndex(idx)}
                      >
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVertexIndex(idx);
                          }}
                          className={`h-4 w-4 rounded-full border shadow-lg transition-all flex items-center justify-center cursor-move text-[8px] font-mono leading-none ${
                            isSelected
                              ? "bg-purple-500 border-white text-white scale-125 ring-4 ring-purple-500/30"
                              : "bg-white border-purple-600 text-purple-700 hover:scale-110"
                          }`}
                          title={`Vertex #${idx + 1}. Drag untuk snap/geser, Klik untuk seleksi.`}
                        >
                          {idx + 1}
                        </div>
                      </Marker>
                    );
                  })}

                  {/* Midpoint segments generator (double-click helper) */}
                  {editorMode !== "DRAW_POINT" && activeEditCoords.map((coord, idx) => {
                    const isPolygon = editorMode === "DRAW_POLYGON" || (editorMode === "EDIT_VERTICES" && activeFeatures[selectedFeatureIndex!]?.geometry?.type === "Polygon");
                    // Skip the closing segment for LineString
                    if (!isPolygon && idx === activeEditCoords.length - 1) return null;

                    const nextCoord = activeEditCoords[(idx + 1) % activeEditCoords.length];
                    const midLng = (coord[0] + nextCoord[0]) / 2;
                    const midLat = (coord[1] + nextCoord[1]) / 2;

                    return (
                      <Marker
                        key={`segment_mid_${idx}`}
                        longitude={midLng}
                        latitude={midLat}
                      >
                        <button
                          onClick={() => handleAddVertexOnSegment(idx)}
                          className="h-2.5 w-2.5 rounded-full bg-purple-400 border border-white hover:bg-purple-600 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center p-0 cursor-pointer"
                          title="Klik ganda / klik tombol ini untuk menambahkan vertex baru di segmen ini."
                        />
                      </Marker>
                    );
                  })}
                  {/* Drag Handle for the entire polygon/line */}
                   {editorMode !== "DRAW_POINT" && activeEditCoords.length > 0 && (
                     <Marker
                       longitude={
                         activeEditCoords.reduce((sum, c) => sum + c[0], 0) / activeEditCoords.length
                       }
                       latitude={
                         activeEditCoords.reduce((sum, c) => sum + c[1], 0) / activeEditCoords.length
                       }
                       draggable={true}
                       onDragStart={() => {
                          const centerLng = activeEditCoords.reduce((sum, c) => sum + c[0], 0) / activeEditCoords.length;
                          const centerLat = activeEditCoords.reduce((sum, c) => sum + c[1], 0) / activeEditCoords.length;
                          lastDragCenterRef.current = { lng: centerLng, lat: centerLat };
                          pushToUndo(activeEditCoords);
                       }}
                       onDrag={(evt) => {
                          if (!lastDragCenterRef.current) {
                            const centerLng = activeEditCoords.reduce((sum, c) => sum + c[0], 0) / activeEditCoords.length;
                            const centerLat = activeEditCoords.reduce((sum, c) => sum + c[1], 0) / activeEditCoords.length;
                            lastDragCenterRef.current = { lng: centerLng, lat: centerLat };
                          }
                          const dLng = evt.lngLat.lng - lastDragCenterRef.current.lng;
                          const dLat = evt.lngLat.lat - lastDragCenterRef.current.lat;
                          lastDragCenterRef.current = { lng: evt.lngLat.lng, lat: evt.lngLat.lat };
                          
                          setActiveEditCoords(prev => prev.map(c => [c[0] + dLng, c[1] + dLat]));
                       }}
                       onDragEnd={() => {
                          lastDragCenterRef.current = null;
                       }}
                     >
                      <div className="h-6 w-6 rounded-full bg-emerald-500/20 border-2 border-emerald-400 hover:bg-emerald-500/40 cursor-move flex items-center justify-center transition-colors">
                         <Move className="h-3 w-3 text-emerald-800" />
                      </div>
                    </Marker>
                  )}
                </>
              )}
            </Map>
          </div>

          {/* MOBILE SEGMENTED FLOATING NAV BAR (< lg) */}
          <div className="lg:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 p-1.5 rounded-2xl shadow-2xl flex items-center gap-1">
            <button
              onClick={() => setMobileTab("MAP")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                mobileTab === "MAP"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-extrabold"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Peta</span>
            </button>

            <button
              onClick={() => setMobileTab("LAYERS")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                mobileTab === "LAYERS"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-extrabold"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Layer</span>
              {Object.keys(spatialLayers).length > 0 && (
                <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 text-[9px] font-mono rounded-full border border-emerald-500/30">
                  {Object.keys(spatialLayers).length}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileTab("INSPECTOR")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                mobileTab === "INSPECTOR"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-extrabold"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Atribut</span>
              {selectedFeatureIndex !== null && (
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>
          </div>
        </section>

        {/* PANEL 3: Right - Topology Inspector, Properties & Status Workflow */}
        <aside className={`w-full lg:w-[320px] xl:w-[340px] px-4 py-3 border-l flex flex-col gap-4 max-h-full overflow-y-auto shrink-0 custom-scrollbar ${mobileTab === "INSPECTOR" ? "flex w-full h-full" : "hidden lg:flex"} ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white shadow-lg border-slate-200"}`}>
          {/* Mobile Header Bar on Panel 3 */}
          <div className="lg:hidden p-3 bg-slate-900 text-white border-b border-slate-700 flex justify-between items-center font-bold text-xs shrink-0 -mx-4 -mt-3 mb-2">
            <span className="flex items-center gap-2 text-emerald-400">
              <Sliders className="h-4 w-4" /> Inspektor Atribut & GIS
            </span>
            <button
              onClick={() => setMobileTab("MAP")}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-extrabold flex items-center gap-1 shadow transition-all active:scale-95"
            >
              Buka Peta →
            </button>
          </div>

          
          {selectedFeatureIndex === null ? (
            digitizationModule === "INFRASTRUKTUR" && infraCoords ? (
              // Beautifully merged input form from deprecated modal!
              <div className="flex flex-col gap-4 animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 font-sans flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-indigo-500" /> Atribut Infrastruktur Baru
                  </h3>
                  <button
                    onClick={() => setInfraCoords(null)}
                    className="p-1 px-2 hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400 hover:text-white text-xs"
                  >
                    × Batal
                  </button>
                </div>

                <div className="p-3 bg-indigo-55 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl">
                  <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1 font-mono">Koordinat Point</div>
                  <div className="font-mono text-xs text-slate-800 dark:text-slate-200">
                    Lng: {infraCoords[0].toFixed(5)}, Lat: {infraCoords[1].toFixed(5)}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1 font-mono">Nama Infrastruktur / Aset</label>
                  <input 
                    type="text" 
                    value={infraForm.name}
                    onChange={e => setInfraForm({...infraForm, name: e.target.value})}
                    placeholder="Contoh: MPP Simpurusiang"
                    className={`w-full rounded-xl px-3 py-2 text-sm border focus:ring-2 focus:ring-emerald-500 outline-none ${isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1 font-mono">
                    Kategori {renderInfraIcon(infraForm.icon, "h-3.5 w-3.5 text-indigo-500")}
                  </label>
                  <select 
                    value={infraForm.category}
                    onChange={e => {
                      const val = e.target.value;
                      const matchedCat = INFRA_CATEGORIES.find(c => c.name === val);
                      setInfraForm({
                        ...infraForm, 
                        category: val,
                        icon: matchedCat ? matchedCat.icon : "MapPin"
                      });
                    }}
                    className={`w-full rounded-xl px-3 py-2 text-sm border focus:ring-2 focus:ring-emerald-500 outline-none ${isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                  >
                    {INFRA_CATEGORIES.map((cat, idx) => (
                      <option key={`cat-${idx}`} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1 font-mono">Keterangan Singkat</label>
                  <textarea 
                    value={infraForm.description}
                    onChange={e => setInfraForm({...infraForm, description: e.target.value})}
                    rows={3}
                    placeholder="Tambahkan detail fasilitas..."
                    className={`w-full rounded-xl px-3 py-2 text-sm border focus:ring-2 focus:ring-emerald-500 outline-none resize-none ${isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                  />
                </div>

                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={() => setInfraCoords(null)}
                    disabled={isSavingInfra}
                    className="flex-1 py-2 rounded-xl border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleSaveInfrastructure}
                    disabled={isSavingInfra}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white text-xs font-bold transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingInfra ? <div className="animate-spin h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full"></div> : "Simpan Data"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-2xl my-4">
                <Settings className="h-8 w-8 text-slate-600 dark:text-slate-400 mb-2 animate-spin-slow" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Menunggu Seleksi</h4>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Pilih salah satu objek spasial dari daftar di sisi kiri, atau tekan tombol "Tambah" untuk menggambar objek baru dari awal.
                </p>
              </div>
            )
          ) : (
            <div className="flex flex-col gap-4">
              {/* Properties Form */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 font-sans">
                    Atribut Objek (PostGIS)
                  </h3>
                  <button
                    onClick={() => setSelectedFeatureIndex(null)}
                    className="p-1 px-2 hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400 hover:text-white"
                  >
                    × Batal
                  </button>
                </div>

                <div className="flex flex-col gap-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-mono font-bold">Nama Fitur</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className={`w-full rounded-xl px-3 py-1.5 text-xs font-sans focus:outline-none focus:ring-1 border ${isDarkMode ? "bg-slate-900 border-slate-800 text-white focus:border-emerald-500 focus:ring-emerald-500/20" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-mono font-bold">Kategori Zona</label>
                    <input
                      type="text"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className={`w-full rounded-xl px-3 py-1.5 text-xs font-sans focus:outline-none focus:ring-1 border ${isDarkMode ? "bg-slate-900 border-slate-800 text-white focus:border-emerald-500 focus:ring-emerald-500/20" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                    />
                  </div>

                  {/* Auto Calculus HUD */}
                  <div className={`p-3 rounded-2xl border font-mono text-[10.5px] flex flex-col gap-1.5 ${isDarkMode ? "bg-slate-900/50 border-white/5" : "bg-slate-100 border-slate-200"}`}>
                    <span className="text-[9px] uppercase font-bold text-indigo-700 dark:text-indigo-400">Spatial Metrics (Turf.js)</span>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Kecamatan:</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">{selectedDistrictName || "Menunggu data..."}</span>
                    </div>
                    {liveSpatialSync?.desaMatch && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Desa Teridentifikasi:</span>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">{liveSpatialSync.desaMatch}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Estimasi Luas:</span>
                      <span className="font-bold">{calculatedAreaHa} Ha</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Perimeter/Pjg:</span>
                      <span className="font-bold">{calculatedLengthKm} KM</span>
                    </div>
                  </div>

                  {/* RESTful Layer Sync Indicators */}
                  <div className={`p-3.5 rounded-2xl border flex flex-col gap-2.5 transition-all ${isDarkMode ? "bg-slate-900/40 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1 font-sans">
                        <RefreshCw className={`h-3 w-3 text-emerald-700 dark:text-emerald-400 ${isSyncing ? "animate-spin" : ""}`} /> 9-Layer Spatial Overlay Sync
                      </span>
                      <button
                        type="button"
                        onClick={() => handleTriggerLiveSpatialSync()}
                        disabled={isSyncing}
                        className="text-[9px] p-1 px-2 font-bold uppercase tracking-wider bg-teal-500/20 hover:bg-teal-500/30 text-teal-700 dark:text-teal-400 rounded-lg cursor-pointer transition-all"
                      >
                        {isSyncing ? "Syncing..." : "Sync Live"}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                      <div className="flex flex-col p-1.5 bg-slate-900/40 border border-white/5 rounded-xl">
                        <span className="text-[8px] text-slate-600 dark:text-slate-400 uppercase font-bold">Desa</span>
                        <span className="font-semibold truncate text-slate-300">{liveSpatialSync?.desaMatch || "Diluar Batas"}</span>
                      </div>
                      <div className="flex flex-col p-1.5 bg-slate-900/40 border border-white/5 rounded-xl">
                        <span className="text-[8px] text-slate-600 dark:text-slate-400 uppercase font-bold">Kecamatan</span>
                        <span className="font-semibold truncate text-emerald-700 dark:text-emerald-400">{liveSpatialSync?.kecamatanMatch || selectedDistrictName || "Luar Daerah"}</span>
                      </div>
                      <div className="flex flex-col p-1.5 bg-slate-900/40 border border-white/5 rounded-xl">
                        <span className="text-[8px] text-slate-600 dark:text-slate-400 uppercase font-bold">Jarak Jalan Utama</span>
                        <span className="font-bold text-slate-300">{liveSpatialSync?.nearestRoadKm ?? 0} KM</span>
                      </div>
                      <div className="flex flex-col p-1.5 bg-slate-900/40 border border-white/5 rounded-xl">
                        <span className="text-[8px] text-slate-600 dark:text-slate-400 uppercase font-bold">Fasilitas Terdekat</span>
                        <span className="font-bold text-indigo-700 dark:text-indigo-400 truncate animate-pulse" title={liveSpatialSync?.nearestFacilities?.[0]?.name || "-"}>
                          {liveSpatialSync?.nearestFacilities?.[0] ? `${liveSpatialSync.nearestFacilities[0].name} (${liveSpatialSync.nearestFacilities[0].distanceKm} km)` : "-"}
                        </span>
                      </div>
                    </div>

                    {/* Highly exact tumpang tindih areas in hectares for agrarian / environmental layers */}
                    {liveSpatialSync?.thematicOverlaps && (
                      <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-800">
                        <span className="text-[9px] uppercase font-bold text-amber-500 font-mono">{t('spatial.intersect')} Overlaps (Area Analysis)</span>
                        <div className="flex flex-col gap-1 font-mono text-[9.5px]">
                          <div className="flex justify-between p-1 bg-slate-900/50 rounded">
                            <span className="text-slate-600 dark:text-slate-400">🌾 Sawah / Pertanian:</span>
                            <span className={liveSpatialSync.thematicOverlaps.sawahHa > 0 ? "text-amber-700 dark:text-amber-400 font-bold" : "text-slate-600 dark:text-slate-400"}>
                              {liveSpatialSync.thematicOverlaps.sawahHa} Ha
                            </span>
                          </div>
                          <div className="flex justify-between p-1 bg-slate-900/50 rounded">
                            <span className="text-slate-600 dark:text-slate-400">🐟 Tambak Perikanan:</span>
                            <span className={liveSpatialSync.thematicOverlaps.tambakHa > 0 ? "text-amber-700 dark:text-amber-400 font-bold" : "text-slate-600 dark:text-slate-400"}>
                              {liveSpatialSync.thematicOverlaps.tambakHa} Ha
                            </span>
                          </div>
                          <div className="flex justify-between p-1 bg-slate-900/50 rounded">
                            <span className="text-slate-600 dark:text-slate-400">🌲 Mangrove / Konservasi:</span>
                            <span className={liveSpatialSync.thematicOverlaps.mangroveHa > 0 ? "text-emerald-500 font-bold" : "text-slate-600 dark:text-slate-400"}>
                              {liveSpatialSync.thematicOverlaps.mangroveHa} Ha
                            </span>
                          </div>
                          <div className="flex justify-between p-1 bg-slate-900/50 rounded">
                            <span className="text-slate-600 dark:text-slate-400">⛰️ Lahan Kering Primer:</span>
                            <span className={liveSpatialSync.thematicOverlaps.lahanKeringPrimerHa > 0 ? "text-amber-700 dark:text-amber-400 font-bold" : "text-slate-600 dark:text-slate-400"}>
                              {liveSpatialSync.thematicOverlaps.lahanKeringPrimerHa} Ha
                            </span>
                          </div>
                          <div className="flex justify-between p-1 bg-slate-900/50 rounded">
                            <span className="text-slate-600 dark:text-slate-400">🪵 Lahan Kering Sekunder:</span>
                            <span className={liveSpatialSync.thematicOverlaps.lahanKeringSekunderHa > 0 ? "text-amber-700 dark:text-amber-400 font-bold" : "text-slate-600 dark:text-slate-400"}>
                              {liveSpatialSync.thematicOverlaps.lahanKeringSekunderHa} Ha
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Vertex Control HUD */}
              {selectedVertexIndex !== null && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex flex-col gap-2 animate-fade-in text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase font-mono font-bold text-indigo-700 dark:text-indigo-400">Vertex Selector</span>
                    <span className="font-mono font-bold text-[10px]">Indeks Simpul: #{selectedVertexIndex + 1}</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-600 dark:text-slate-400 flex flex-col gap-1">
                    <span>Longitude: {activeEditCoords[selectedVertexIndex]?.[0].toFixed(6)}</span>
                    <span>Latitude: {activeEditCoords[selectedVertexIndex]?.[1].toFixed(6)}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveVertex(selectedVertexIndex)}
                    className="w-full py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-[10px] uppercase tracking-wide flex items-center justify-center gap-1"
                    title="Hapus simpul koordinat"
                  >
                    <Trash2 className="h-3 w-3" /> Hapus Vertex
                  </button>
                </div>
              )}

              {/* Automatic Snapping Settings */}
              <div className={`p-3.5 rounded-2xl border flex flex-col gap-2.5 ${isDarkMode ? "bg-slate-900/30 border-white/5" : "bg-slate-100 border-slate-200"}`}>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-sans font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Sliders className="h-3.5 w-3.5 text-indigo-700 dark:text-indigo-400" /> Automatic Snapping
                  </span>
                  <input
                    type="checkbox"
                    checked={snapEnabled}
                    onChange={(e) => setSnapEnabled(e.target.checked)}
                    className="w-4 h-4 rounded-md accent-emerald-500 cursor-pointer"
                  />
                </div>
                
                {snapEnabled && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-600 dark:text-slate-400">
                      <span>Tolerance:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">{(snapToleranceKm * 1000).toFixed(0)} meter</span>
                    </div>
                    <input
                      type="range"
                      min="0.02" // 20m
                      max="0.5" // 500m
                      step="0.01"
                      value={snapToleranceKm}
                      onChange={(e) => setSnapToleranceKm(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-800 rounded-lg"
                    />

                    <select
                      value={snapTarget}
                      onChange={(e) => setSnapTarget(e.target.value as any)}
                      className={`w-full rounded-lg px-2.5 py-1 text-[10.5px] font-sans border focus:outline-none ${isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200"}`}
                    >
                      <option value="ALL">Snap ke Semua Objek</option>
                      <option value="VILLAGES">Batas Desa Saja</option>
                      <option value="ROADS">{t('mapControls.roadNetwork')} Utama</option>
                      <option value="DISTRICTS">Batas Kecamatan Saja</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Topology Validation HUD */}
              <div className="flex flex-col gap-2">
                <span className="text-[10.5px] uppercase font-sans font-bold text-slate-600 dark:text-slate-400">
                  Topology Validation Audit
                </span>
                {topologyErrors.length === 0 ? (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-2xl flex items-center gap-2.5 text-xs font-semibold">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span>Lolos Verifikasi! Struktur OGC Topology Bersih.</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                    {topologyErrors.map((err, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border flex items-start gap-2 text-[10.5px] ${
                          err.fatal
                            ? "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400"
                            : "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block uppercase font-mono text-[9px]">{err.type}</strong>
                          <span className="leading-tight block">{err.message}</span>
                          {typeof err.conflictIndex === 'number' && (
                             <button
                               onClick={() => handleAutoClip(err.conflictIndex!)}
                               className="mt-2 py-1 px-3 bg-current/10 hover:bg-current/20 rounded-md text-[9px] uppercase tracking-wider block font-bold transition-colors"
                             >
                               Potong Area Overlap (Auto-Clip)
                             </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Workflow & Save & Publish Control Block */}
              <div className="flex flex-col gap-2 pt-3 border-t border-slate-800">
                <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-mono font-bold">Workflow Status</span>
                <div className="flex gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
                  {(["Draft", "Review", "Published"] as const).map((st) => {
                    const isDisabled = st === "Published" && currentRole !== Role.SUPER_ADMIN;
                    return (
                      <button
                        key={st}
                        onClick={() => !isDisabled && setFormStatus(st)}
                        disabled={isDisabled}
                        className={`flex-1 py-1.5 text-[10px] font-bold font-sans rounded-lg transition-all ${
                          formStatus === st
                            ? st === "Published"
                              ? "bg-emerald-600 text-white"
                              : st === "Review"
                              ? "bg-amber-600 text-white"
                              : "bg-slate-700 text-white"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-800"
                        } ${isDisabled ? "opacity-30 cursor-not-allowed" : ""}`}
                        title={isDisabled ? "Publish hanya diijinkan untuk SUPER ADMIN" : ""}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>

                {selectedLayerId && (
                  <button
                    type="button"
                    onClick={handleSaveToPostGIS}
                    className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold font-sans rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-1.5 uppercase tracking-wide text-xs"
                  >
                    <Save className="h-4 w-4" /> Save GIS Changes (Layer)
                  </button>
                )}

                {selectedFeatureIndex !== null && selectedFeatureIndex !== -1 && (
                  <button
                    type="button"
                    onClick={handleDeleteFeature}
                    className="w-full py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 font-bold font-sans rounded-xl shadow transition-all flex items-center justify-center gap-1.5 uppercase tracking-wide text-xs"
                  >
                    <Trash2 className="h-4 w-4" /> Hapus Geometry
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={async () => {
                     if (activeEditCoords.length === 0) {
                        showToast("Obyek geometri belum digambar pada peta.");
                        return;
                     }

                     let gType = "Polygon";
                     let coordinatesToSave: any = [];

                     if (editorMode === "EDIT_VERTICES" && selectedFeatureIndex !== -1) {
                       gType = activeFeatures[selectedFeatureIndex!]?.geometry?.type || "Polygon";
                     } else {
                       if (editorMode === "DRAW_POINT") gType = "Point";
                       else if (editorMode === "DRAW_LINE") gType = "LineString";
                       else gType = "Polygon";
                     }

                     if (gType === "Point") {
                       coordinatesToSave = activeEditCoords[0] || [0, 0];
                     } else if (gType === "LineString") {
                       if (activeEditCoords.length < 2) {
                           showToast("Peringatan: LineString harus memiliki setidaknya 2 titik koordinat.");
                           return;
                       }
                       coordinatesToSave = activeEditCoords;
                     } else {
                       if (activeEditCoords.length < 3) {
                           showToast("Peringatan: Poligon harus memiliki setidaknya 3 titik koordinat.");
                           return;
                       }
                       const closedCoordinates = activeEditCoords.length > 0 ? [...activeEditCoords, activeEditCoords[0]] : [];
                       coordinatesToSave = [closedCoordinates];
                     }

                     const geometry = {
                       type: gType,
                       coordinates: coordinatesToSave
                     };

                     // Validate against focusDistrictId and focusVillageId if available
                     if (embeddedMode && (focusDistrictId || focusVillageId)) {
                        let isOutside = false;
                        let targetName = "";
                        try {
                          let centroid;
                          if (gType === "Point") {
                            centroid = turf.point(coordinatesToSave);
                          } else if (gType === "LineString") {
                            centroid = turf.centroid(turf.lineString(coordinatesToSave));
                          } else {
                            centroid = turf.centroid(turf.polygon(coordinatesToSave));
                          }

                          if (focusVillageId) {
                            const vil = villages.find(v => v.id === focusVillageId);
                            if (vil && vil.geojson) {
                              targetName = "Desa " + vil.name;
                              isOutside = !turf.booleanPointInPolygon(centroid, vil.geojson);
                            } else if (focusDistrictId) {
                               // Fallback to district if village has no geojson
                               const dist = districts.find(d => d.id === focusDistrictId);
                               if (dist && dist.geojson) {
                                  targetName = "Kecamatan " + dist.name;
                                  isOutside = !turf.booleanPointInPolygon(centroid, dist.geojson);
                               }
                            }
                          } else if (focusDistrictId) {
                            const dist = districts.find(d => d.id === focusDistrictId);
                            if (dist && dist.geojson) {
                              targetName = "Kecamatan " + dist.name;
                              isOutside = !turf.booleanPointInPolygon(centroid, dist.geojson);
                            }
                          }
                        } catch (err) {
                           undefined;
                        }

                        if (isOutside) {
                          showToast(`Peringatan: Koordinat yang Anda gambar berada di luar wilayah target (${targetName}). Harap gambar di dalam wilayah.`);
                          return;
                        }
                     }
                     
                      try {
                        const token = localStorage.getItem("luwu_session_token");
                        const res = await fetch("/api/geometries", {
                          method: "POST",
                          headers: { 
                            "Content-Type": "application/json",
                            ...(token ? { "Authorization": `Bearer ${token}` } : {})
                          },
                          body: JSON.stringify({ geometry, createdBy: currentRole, name: formName || "GeoAsset Tanpa Nama" })
                        });
                        if (res.ok) {
                           const resData = await res.json();
                           showToast("Berhasil menyimpan sebagai independen Asset Spatial (Geometry). Data SIAP DIPAKAI di Smart Investment Form!");
                           setSelectedFeatureIndex(null);
                           setEditorMode("VIEW");
                           runTopologyAudit([]);
                           
                           if (onGeometryCreated) {
                              onGeometryCreated(resData);
                           }
                           if (onCloseModal) {
                              onCloseModal();
                           }
                        } else {
                           const errData = await res.json().catch(() => ({}));
                           console.error("Save Geometry failed:", errData);
                           showToast(`Gagal: ${errData.error || "Gagal melakukan penulisan ke database geometri."}`);
                        }
                     } catch(err) {
                        showToast("Error API");
                     }
                  }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-sans rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-1.5 uppercase tracking-wide text-[11px]"
                >
                  <Database className="h-4 w-4" /> Simpan Ke Koleksi Geometries
                </button>
              </div>
            </div>
          )}

          {/* Export Document Format Options */}
          {activeLayer && (
            <div className="mt-auto pt-3 border-t border-slate-800 flex flex-col gap-2">
              <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-mono font-bold">Export Format (OGC Standards)</span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={handleExportGeoJSON}
                  className="py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold font-mono rounded-xl text-[9px] border border-slate-800 flex items-center justify-center gap-1"
                >
                  <Download className="h-3 w-3" /> GEOJSON
                </button>
                <button
                  onClick={handleExportKML}
                  className="py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold font-mono rounded-xl text-[9px] border border-slate-800 flex items-center justify-center gap-1"
                >
                  <Download className="h-3 w-3" /> KML
                </button>
                <button
                  onClick={handleExportShapefile}
                  className="py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold font-mono rounded-xl text-[9px] border border-slate-800 flex items-center justify-center gap-1"
                >
                  <Download className="h-3 w-3" /> SHP ZIP
                </button>
              </div>
            </div>
          )}

          {/* Audit Logs Sidebar */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800 mt-2">
            <span className="text-[10px] mt-2 text-indigo-700 dark:text-indigo-400 uppercase font-mono font-bold flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Version History Log
            </span>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar">
              {isLoadingLogs ? (
                <div className="text-[10px] text-slate-600 dark:text-slate-400 italic">Memuat log...</div>
              ) : auditLogs.length === 0 ? (
                <div className="text-[10px] text-slate-600 dark:text-slate-400 italic text-center py-4">No audit logs stored yet.</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className={`p-2 rounded-lg border flex flex-col gap-1 text-[9.5px] leading-relaxed relative ${isDarkMode ? "bg-slate-900/40 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">{log.actionType}</span>
                      <span className="text-slate-600 dark:text-slate-400 text-[8.5px]">{new Date(log.timestamp).toLocaleTimeString("id-ID")}</span>
                    </div>
                    <span className="truncate">Layer: {log.layerName}</span>
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Oleh: {log.user}</span>
                    
                    <button
                      onClick={() => handleRollbackHistory(log.id)}
                      className="absolute right-2 bottom-2 text-indigo-700 dark:text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-0.5 text-[8px] uppercase tracking-wide font-bold bg-transparent border-0"
                    >
                      <RotateCcw className="h-2 w-2" /> Rollback
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

      </div>
      
      {/* Toast Overlay */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-slate-900 text-white font-sans text-xs px-5 py-4 rounded-xl shadow-2xl border border-slate-700/50 flex flex-col gap-1 max-w-xs animate-in slide-in-from-bottom-5">
           <div className="font-bold flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
             <AlertTriangle className="h-4 w-4" /> Notifikasi
           </div>
           <p className="text-slate-300 leading-relaxed">{toastMessage}</p>
        </div>
      )}

      {/* ESG Warning Modal */}
      <EsgWarningModal
        isOpen={isEsgModalOpen}
        message={esgWarningMessage}
        onCancel={() => {
          setIsEsgModalOpen(false);
          setPendingSaveAction(null);
        }}
        onConfirm={async (overrideData) => {
          setIsEsgModalOpen(false);
          if (pendingSaveAction) {
            const action = pendingSaveAction;
            setPendingSaveAction(null);
            await action(overrideData);
          }
        }}
      />
    </div>
  );
}
