import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layers, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Building2, 
  Laptop, 
  Store, 
  Moon, 
  BookOpen, 
  Baby, 
  Gamepad2, 
  Accessibility, 
  HeartHandshake, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  X, 
  HelpCircle,
  BellRing,
  Info,
  ShieldCheck,
  Footprints,
  Radio,
  Sparkles
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { MPPTenant, MppFoRequest } from '../../types/mpp';

/**
 * Mapping Mismatch Fasilitas & Ruangan MPP Simpurusiang:
 * Menjembatani ID ringkas snake_case pada elemen SVG dengan nama panjang resmi di tabel mpp_facilities database Supabase.
 */
export const facilityMap: Record<string, string> = {
  "mushalla": "Musholla & Sarana Ibadah Representatif",
  "ruang_baca": "Pojok Baca Digital & Ruang Literasi",
  "ruang_perawatan": "Pojok Laktasi & Ibu Menyusui",
  "ruang_laktasi": "Pojok Laktasi & Ibu Menyusui",
  "ruang_bermain_anak": "Kids Play Corner (Area Ramah Anak)",
  "layanan_disabilitas": "Fasilitas Ramah Disabilitas & Jalur Prioritas",
  "hall_umkm": "Galeri Promosi UMKM & Produk Unggulan Luwu",
  "dekranasda": "Dekranasda & Galeri UMKM Luwu",
  "layanan_mandiri_1": "E-Kiosk Antrean & Layanan Mandiri Digital",
  "layanan_mandiri_2": "E-Kiosk Antrean & Layanan Mandiri Digital",
  "front_office": "Front Office Concierge & Resepsionis Sentral",
  "front_office_1": "Front Office Concierge & Helpdesk Terpadu",
  "front_office_2": "Front Office Concierge & Helpdesk Terpadu",
  "ruang_tim_teknis": "Ruang Tim Teknis Lintas OPD Terpadu",
  "ruang_rapat": "Ruang Rapat Utama & Koordinasi Investasi",
  "smoking_area": "Smoking Area (Area Merokok Terbuka)",
  "toilet_pria": "Toilet Pria",
  "toilet_wanita": "Toilet Wanita",
  "ruang_istirahat": "Ruang Istirahat Petugas",
  "lobby_kiri": "Lobby Tunggu Pemohon (Sayap Barat)",
  "lobby_kanan": "Lobby Tunggu Pemohon (Sayap Timur)",
  "gerbang_masuk": "Gerbang Masuk Utama & Pos Penjagaan",
  "pos_keamanan": "Pos Penjagaan & Pemeriksaan Awal",
  "tangga_naik_w": "Tangga Akses Sayap Barat",
  "tangga_naik_ne": "Tangga Akses Sayap Utara",
  "tangga_naik_se": "Tangga Akses Sayap Timur"
};

/**
 * Mapping Alias ID Gerai Tenant SVG ke Kode Tenant Resmi di Database mpp_tenants
 */
export const TENANT_ALIASES: Record<string, string> = {
  'DUKCAPIL_N': 'DISDUKCAPIL',
  'DUKCAPIL_W1': 'DISDUKCAPIL',
  'DUKCAPIL_W2': 'DISDUKCAPIL',
  'DUKCAPIL_W3': 'DISDUKCAPIL',
  'DPMPTSP_N': 'DPMPTSP',
  'DPMPTSP_S': 'DPMPTSP',
  'BPJS_KET': 'BPJS-TK',
  'BPJS_KES': 'BPJS-KES',
  'KPP_PRATAMA': 'KPP-PRATAMA',
  'BANK_SULSELBAR': 'SULSELBAR',
  'SULSELBA': 'SULSELBAR',
  'KAJARI': 'KEJARI',
};

export interface MppDbFacility {
  id: string;
  name: string;
  description?: string;
  floor?: string;
  category?: string;
  image?: string;
  features?: string[];
  is_active?: boolean;
}

export type FloorPlanElementStatus = 'alert' | 'responding' | 'active' | 'standby';

export interface SelectedFloorItem {
  id: string;
  type: 'tenant' | 'facility' | 'zone';
  name: string;
  code: string;
  floor?: string | number;
  status: FloorPlanElementStatus;
  description?: string;
  activeRequests: MppFoRequest[];
  dbRecord?: MPPTenant | MppDbFacility | null;
}

interface MppFloorPlanProps {
  /** Raw SVG string if provided externally (e.g. from CAD or raw SVG code) */
  rawSvgContent?: string;
  /** Optional custom viewBox for dynamic framing (default: "0 0 1200 800") */
  viewBox?: string;
  /** Optional floor prop for backward compatibility */
  floor?: 1 | 2;
  /** Optional floor change callback for backward compatibility */
  onFloorChange?: (floor: 1 | 2) => void;
  /** Callback when user clicks a tenant or facility in the floor plan */
  onSelectElement?: (item: SelectedFloorItem) => void;
  /** Currently selected element ID */
  selectedId?: string | null;
  /** External FO requests passed from Command Center */
  externalRequests?: MppFoRequest[];
  /** Fullscreen state toggle */
  isDark?: boolean;
}

export function MppFloorPlan({
  rawSvgContent,
  viewBox = "0 0 1200 800",
  onSelectElement,
  selectedId: controlledSelectedId,
  externalRequests,
  isDark = true
}: MppFloorPlanProps) {
  // Selection & Hover State
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const selectedId = controlledSelectedId !== undefined ? controlledSelectedId : internalSelectedId;
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Zoom & Pan State
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const rawSvgContainerRef = useRef<HTMLDivElement>(null);

  // Database States (Honest Fallback: initial empty arrays)
  const [tenants, setTenants] = useState<MPPTenant[]>([]);
  const [facilities, setFacilities] = useState<MppDbFacility[]>([]);
  const [foRequests, setFoRequests] = useState<MppFoRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Merge requests (prefer externalRequests if supplied from parent command center)
  const activeRequests = useMemo(() => {
    return externalRequests && externalRequests.length > 0 ? externalRequests : foRequests;
  }, [externalRequests, foRequests]);

  // 1. Fetch Realtime Tenants from Supabase
  const loadTenants = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('mpp_tenants')
        .select('*')
        .order('code', { ascending: true });

      if (error) {
        console.warn('[MppFloorPlan] Failed to load mpp_tenants:', error.message);
        setTenants([]);
      } else {
        setTenants(data || []);
      }
    } catch (err: any) {
      console.warn('[MppFloorPlan] Exception loading tenants:', err);
      setTenants([]);
    }
  }, []);

  // 2. Fetch Realtime Facilities from Supabase
  const loadFacilities = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('mpp_facilities')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.warn('[MppFloorPlan] Failed to load mpp_facilities:', error.message);
        setFacilities([]);
      } else {
        setFacilities(data || []);
      }
    } catch (err: any) {
      console.warn('[MppFloorPlan] Exception loading facilities:', err);
      setFacilities([]);
    }
  }, []);

  // 3. Fetch Realtime FO Help Requests from Supabase
  const loadFoRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('mpp_fo_requests')
        .select('*')
        .in('status', ['pending', 'responding'])
        .order('requested_at', { ascending: false });

      if (error) {
        console.warn('[MppFloorPlan] Failed to load mpp_fo_requests:', error.message);
        setFoRequests([]);
      } else {
        setFoRequests(data || []);
      }
    } catch (err: any) {
      console.warn('[MppFloorPlan] Exception loading FO requests:', err);
      setFoRequests([]);
    }
  }, []);

  // Initial Load & Realtime Subscriptions
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([loadTenants(), loadFacilities(), loadFoRequests()]).finally(() => {
      if (isMounted) setIsLoading(false);
    });

    // Realtime channel for live tenant updates
    const tenantsChannel = supabase
      .channel('mpp-floor-plan-tenants')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mpp_tenants' }, () => {
        loadTenants();
      })
      .subscribe();

    // Realtime channel for live facilities updates
    const facilitiesChannel = supabase
      .channel('mpp-floor-plan-facilities')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mpp_facilities' }, () => {
        loadFacilities();
      })
      .subscribe();

    // Realtime channel for front office help calls (alarm triggering)
    const foChannel = supabase
      .channel('mpp-floor-plan-fo-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mpp_fo_requests' }, () => {
        loadFoRequests();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(tenantsChannel);
      supabase.removeChannel(facilitiesChannel);
      supabase.removeChannel(foChannel);
    };
  }, [loadTenants, loadFacilities, loadFoRequests]);

  // Status computation for an SVG element ID
  const computeElementStatus = useCallback((svgId: string): {
    status: FloorPlanElementStatus;
    activeRequests: MppFoRequest[];
    name: string;
    type: 'tenant' | 'facility' | 'zone';
    code: string;
    floor: number;
    description?: string;
    dbRecord: MPPTenant | MppDbFacility | null;
  } => {
    const cleanId = svgId.trim();
    const upperId = cleanId.toUpperCase();
    const resolvedTenantCode = (TENANT_ALIASES[upperId] || upperId).toUpperCase();
    const lowerId = cleanId.toLowerCase();

    // 1. Check if it matches a Tenant (code or id or alias)
    const matchedTenant = tenants.find(
      (t) => (t.code && (t.code.toUpperCase() === resolvedTenantCode || t.code.toUpperCase() === upperId)) || (t.id && t.id === cleanId)
    );

    // 2. Check if it matches a Facility via facilityMap
    const mappedFacilityName = facilityMap[lowerId] || facilityMap[cleanId];
    const matchedFacility = mappedFacilityName
      ? facilities.find((f) => f.name && f.name.toLowerCase().includes(mappedFacilityName.toLowerCase()))
      : facilities.find((f) => f.id === cleanId || f.name.toLowerCase().includes(lowerId));

    let type: 'tenant' | 'facility' | 'zone' = 'zone';
    let name = cleanId;
    let code = resolvedTenantCode;
    let floor = 1;
    let dbRecord: MPPTenant | MppDbFacility | null = null;
    let fallbackDesc = 'Fasilitas Layanan Publik MPP Simpurusiang';

    if (matchedTenant) {
      type = 'tenant';
      name = matchedTenant.name;
      code = matchedTenant.code || upperId;
      floor = 1;
      dbRecord = matchedTenant;
    } else if (matchedFacility) {
      type = 'facility';
      name = matchedFacility.name;
      code = cleanId;
      floor = 1;
      dbRecord = matchedFacility;
    } else if (mappedFacilityName) {
      type = 'facility';
      name = mappedFacilityName;
      code = cleanId;
      floor = 1;
    } else {
      // Known Blueprint Non-DB Zones
      const blueprintZones: Record<string, { name: string; type: 'tenant' | 'facility' | 'zone'; desc: string }> = {
        'IMIGRASI': { name: 'Kantor Imigrasi (Layanan Paspor)', type: 'tenant', desc: 'Pelayanan Paspor Baru, Penggantian & Izin Tinggal Keimigrasian' },
        'KPP_PRATAMA': { name: 'KPP Pratama Palopo', type: 'tenant', desc: 'Pelayanan NPWP, Konsultasi Pajak, Pelaporan SPT & Validasi NIK' },
        'DINSOS': { name: 'Dinas Sosial Kabupaten Luwu', type: 'tenant', desc: 'Verifikasi DTKS, Bantuan Sosial, Kartu Luwu Sehat & Advokasi' },
        'NAKERTRANS': { name: 'Dinas Tenaga Kerja & Transmigrasi', type: 'tenant', desc: 'Penerbitan Kartu Kuning (AK-1), Info Loker & Konsultasi HI' },
        'DEKRANASDA': { name: 'Dekranasda & Galeri Produk UMKM', type: 'facility', desc: 'Pameran Produk Kerajinan Lokal, Tenun Luwu & Kopi Khas' },
        'KOMINFO': { name: 'Dinas Komunikasi & Informatika', type: 'tenant', desc: 'Layanan SPBE, Sertifikat Elektronik TTE, Domain & Aduan SP4N' },
        'PERIKANAN': { name: 'Dinas Perikanan Kabupaten Luwu', type: 'tenant', desc: 'Rekomendasi BBM Nelayan, Tanda Daftar Kapal Perikanan & Budidaya' },
        'NERVIS': { name: 'Nervis Mitra Pelayanan', type: 'tenant', desc: 'Layanan Asistensi Dokumen & Ketenagakerjaan Terpadu' },
        'HAS': { name: 'HAS Pelayanan Halal & Sertifikasi', type: 'tenant', desc: 'Konsultasi Sertifikasi Halal Gratis (SEHATI) & Bimbingan Pelaku Usaha' },
        'ruang_tim_teknis': { name: 'Ruang Tim Teknis Lintas OPD', type: 'facility', desc: 'Workstation 10 Komputer Koordinasi Teknis Verifikasi Dokumen Perizinan' },
        'ruang_rapat': { name: 'Ruang Rapat Koordinasi & Investasi', type: 'facility', desc: 'Ruang Konferensi Rapat Koordinasi Tim Teknis & Ekspose Investor VIP' },
        'smoking_area': { name: 'Smoking Area (Area Merokok)', type: 'facility', desc: 'Area Terbuka Khusus Pengunjung & Petugas' },
        'toilet_pria': { name: 'Toilet Pria & Sanitasi', type: 'facility', desc: 'Fasilitas Sanitasi Pria Bersih dan Representatif' },
        'toilet_wanita': { name: 'Toilet Wanita & Sanitasi', type: 'facility', desc: 'Fasilitas Sanitasi Wanita Bersih dan Representatif' },
        'ruang_istirahat': { name: 'Ruang Istirahat Petugas', type: 'facility', desc: 'Ruang Rehat & Locker Petugas Front Office dan Gerai' },
        'gerbang_masuk': { name: 'Gerbang Masuk Utama & Pos Penjagaan', type: 'facility', desc: 'Akses Masuk Utama Gedung MPP Simpurusiang & Pemeriksaan Awal' }
      };

      if (blueprintZones[cleanId] || blueprintZones[upperId]) {
        const item = blueprintZones[cleanId] || blueprintZones[upperId];
        name = item.name;
        type = item.type;
        fallbackDesc = item.desc;
      }
    }

    // Match FO requests for alarms
    const matchingRequests = activeRequests.filter((req) => {
      const src = (req.source_name || '').toLowerCase();
      const codeMatches = code && src.includes(code.toLowerCase());
      const nameMatches = name && src.includes(name.toLowerCase());
      const idMatches = src.includes(lowerId);
      return codeMatches || nameMatches || idMatches;
    });

    let status: FloorPlanElementStatus = 'active';
    if (matchingRequests.some((r) => r.status === 'pending')) {
      status = 'alert';
    } else if (matchingRequests.some((r) => r.status === 'responding')) {
      status = 'responding';
    } else if (matchedTenant && matchedTenant.is_active === false) {
      status = 'standby';
    }

    return {
      status,
      activeRequests: matchingRequests,
      name,
      type,
      code,
      floor,
      description: dbRecord?.description || fallbackDesc,
      dbRecord
    };
  }, [tenants, facilities, activeRequests]);

  // Click handler on floor item
  const handleItemClick = (svgId: string) => {
    setInternalSelectedId(svgId);
    const computed = computeElementStatus(svgId);
    const selectedItem: SelectedFloorItem = {
      id: svgId,
      type: computed.type,
      name: computed.name,
      code: computed.code,
      floor: computed.floor,
      status: computed.status,
      description: computed.dbRecord?.description || (computed.type === 'tenant' ? 'Gerai Pelayanan Resmi' : 'Fasilitas Pendukung MPP'),
      activeRequests: computed.activeRequests,
      dbRecord: computed.dbRecord
    };
    if (onSelectElement) {
      onSelectElement(selectedItem);
    }
  };

  // Hover handlers
  const handleMouseEnter = (e: React.MouseEvent, svgId: string) => {
    setHoveredId(svgId);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current && hoveredId) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredId(null);
    setTooltipPos(null);
  };

  // Zoom & Pan Handlers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3.0));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking on empty background or middle click/alt
    if (e.button === 0 && (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true);
      startPanRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    }
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - startPanRef.current.x,
        y: e.clientY - startPanRef.current.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Direct Raw SVG Injection Post-Processor (when rawSvgContent is passed)
  useEffect(() => {
    if (!rawSvgContent || !rawSvgContainerRef.current) return;

    const container = rawSvgContainerRef.current;
    container.innerHTML = rawSvgContent;

    const svgElement = container.querySelector('svg');
    if (!svgElement) return;

    svgElement.setAttribute('width', '100%');
    svgElement.setAttribute('height', '100%');
    svgElement.classList.add('w-full', 'h-full', 'select-none');

    // Attach dynamic listeners and styles to all elements with IDs
    const elementsWithId = svgElement.querySelectorAll('[id]');
    elementsWithId.forEach((el) => {
      const id = el.getAttribute('id');
      if (!id) return;

      const computed = computeElementStatus(id);

      // Add interactivity cursor
      (el as HTMLElement).style.cursor = 'pointer';
      (el as HTMLElement).style.transition = 'all 0.2s ease-in-out';

      // Dynamic stroke & fill styling based on status
      if (computed.status === 'alert') {
        el.setAttribute('stroke', '#ef4444');
        el.setAttribute('stroke-width', '2.5');
        el.classList.add('animate-pulse');
      } else if (computed.status === 'responding') {
        el.setAttribute('stroke', '#f59e0b');
        el.setAttribute('stroke-width', '2');
      } else if (computed.status === 'active') {
        el.setAttribute('stroke', '#10b981');
      }

      // Event listeners
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        handleItemClick(id);
      });

      el.addEventListener('mouseenter', (ev) => {
        handleMouseEnter(ev as any, id);
      });

      el.addEventListener('mouseleave', () => {
        handleMouseLeave();
      });
    });
  }, [rawSvgContent, computeElementStatus]);

  // Selected Item details for drawer/inspect
  const selectedInfo = useMemo(() => {
    if (!selectedId) return null;
    const computed = computeElementStatus(selectedId);
    return {
      id: selectedId,
      ...computed
    };
  }, [selectedId, computeElementStatus]);

  // Hovered Item details
  const hoveredInfo = useMemo(() => {
    if (!hoveredId) return null;
    return computeElementStatus(hoveredId);
  }, [hoveredId, computeElementStatus]);

  // Helper to render architectural CAD-style room box with furniture and interactive handlers
  const renderRoomBox = (cfg: {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    rx?: number;
    label: string;
    subLabel?: string;
    accent?: string;
    deskType?: 'booth' | 'teller' | 'counter' | 'conference' | 'workstation';
  }) => {
    const elem = computeElementStatus(cfg.id);
    const isSelected = selectedId === cfg.id || (elem.code && selectedId === elem.code);
    const isHovered = hoveredId === cfg.id;
    const isAlert = elem.status === 'alert';
    const isResponding = elem.status === 'responding';
    const isStandby = elem.status === 'standby';

    let fillColor = isDark ? '#0c1322' : '#ffffff';
    let strokeColor = cfg.accent || (isDark ? '#334155' : '#cbd5e1');
    let strokeWidth = '1.8';
    let filter: string | undefined = undefined;

    if (isAlert) {
      fillColor = isDark ? '#450a0a' : '#fee2e2';
      strokeColor = isDark ? '#ef4444' : '#dc2626';
      strokeWidth = '2.5';
      filter = isDark ? 'url(#alert-glow)' : 'url(#alert-glow-light)';
    } else if (isResponding) {
      fillColor = isDark ? '#451a03' : '#fef3c7';
      strokeColor = isDark ? '#f59e0b' : '#d97706';
      strokeWidth = '2.2';
      filter = isDark ? 'url(#responding-glow)' : undefined;
    } else if (isSelected) {
      fillColor = isDark ? '#1e1b4b' : '#e0e7ff';
      strokeColor = isDark ? '#818cf8' : '#4338ca';
      strokeWidth = '2.8';
      filter = isDark ? 'url(#selection-glow)' : 'url(#selection-glow-light)';
    } else if (isHovered) {
      fillColor = isDark ? '#1e293b' : '#f1f5f9';
      strokeColor = isDark ? '#94a3b8' : '#475569';
      strokeWidth = '2';
    } else if (isStandby) {
      fillColor = isDark ? '#080d1a' : '#f8fafc';
      strokeColor = isDark ? '#1e293b' : '#e2e8f0';
    }

    const midX = cfg.x + cfg.w / 2;
    const midY = cfg.y + cfg.h / 2;
    return (
      <g
        id={cfg.id}
        key={cfg.id}
        onClick={() => handleItemClick(cfg.id)}
        onMouseEnter={(e) => handleMouseEnter(e, cfg.id)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="cursor-pointer transition-all duration-150 group"
      >
        {/* Main Room Boundary */}
        <rect
          x={cfg.x}
          y={cfg.y}
          width={cfg.w}
          height={cfg.h}
          rx={cfg.rx || 8}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          filter={filter}
        />

        {/* CAD Furniture: Desks & Seating */}
        {cfg.deskType === 'conference' && (
          <g opacity="0.75" pointerEvents="none">
            {/* Long Boardroom Table */}
            <rect
              x={cfg.x + 16}
              y={cfg.y + 25}
              width={cfg.w - 32}
              height={cfg.h - 50}
              rx="12"
              fill={isDark ? '#1e293b' : '#e2e8f0'}
              stroke={isDark ? '#475569' : '#94a3b8'}
              strokeWidth="1.2"
            />
            {/* Chairs Along Sides */}
            {[0.2, 0.35, 0.5, 0.65, 0.8].map((ratio, idx) => (
              <React.Fragment key={idx}>
                <circle cx={cfg.x + 8} cy={cfg.y + (cfg.h - 50) * ratio + 25} r="3.5" fill="#64748b" />
                <circle cx={cfg.x + cfg.w - 8} cy={cfg.y + (cfg.h - 50) * ratio + 25} r="3.5" fill="#64748b" />
              </React.Fragment>
            ))}
            {/* End Chairs */}
            <circle cx={midX} cy={cfg.y + 14} r="3.5" fill="#64748b" />
            <circle cx={midX} cy={cfg.y + cfg.h - 14} r="3.5" fill="#64748b" />
          </g>
        )}

        {cfg.deskType === 'workstation' && (
          <g opacity="0.6" pointerEvents="none">
            {/* Double Row Computer Desks */}
            <rect x={cfg.x + 12} y={cfg.y + 16} width={cfg.w - 24} height={14} rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            <rect x={cfg.x + 12} y={cfg.y + 46} width={cfg.w - 24} height={14} rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            {/* 5 Workstations top, 5 bottom */}
            {[0.12, 0.3, 0.5, 0.7, 0.88].map((ratio, idx) => (
              <React.Fragment key={idx}>
                <rect x={cfg.x + 12 + (cfg.w - 24) * ratio - 6} y={cfg.y + 18} width="12" height="3" rx="1" fill="#38bdf8" />
                <circle cx={cfg.x + 12 + (cfg.w - 24) * ratio} cy={cfg.y + 8} r="2.5" fill="#64748b" />
                <rect x={cfg.x + 12 + (cfg.w - 24) * ratio - 6} y={cfg.y + 53} width="12" height="3" rx="1" fill="#38bdf8" />
                <circle cx={cfg.x + 12 + (cfg.w - 24) * ratio} cy={cfg.y + 66} r="2.5" fill="#64748b" />
              </React.Fragment>
            ))}
          </g>
        )}

        {cfg.deskType === 'booth' && (
          <g opacity="0.65" pointerEvents="none">
            {/* Service counter curve */}
            <path
              d={`M ${cfg.x + 10} ${cfg.y + cfg.h - 14} Q ${midX} ${cfg.y + cfg.h - 24} ${cfg.x + cfg.w - 10} ${cfg.y + cfg.h - 14}`}
              fill="none"
              stroke="#475569"
              strokeWidth="2.5"
            />
            {/* Officer Chair */}
            <circle cx={midX} cy={cfg.y + 16} r="3" fill="#94a3b8" />
            {/* Customer Chairs */}
            <circle cx={midX - 14} cy={cfg.y + cfg.h - 8} r="2.5" fill="#64748b" />
            <circle cx={midX + 14} cy={cfg.y + cfg.h - 8} r="2.5" fill="#64748b" />
          </g>
        )}

        {cfg.deskType === 'teller' && (
          <g opacity="0.65" pointerEvents="none">
            <line x1={cfg.x + 8} y1={midY + 6} x2={cfg.x + cfg.w - 8} y2={midY + 6} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 3" />
            <circle cx={midX - 15} cy={midY - 8} r="3" fill="#60a5fa" />
            <circle cx={midX + 15} cy={midY - 8} r="3" fill="#60a5fa" />
            <circle cx={midX - 15} cy={midY + 18} r="2.5" fill="#64748b" />
            <circle cx={midX + 15} cy={midY + 18} r="2.5" fill="#64748b" />
          </g>
        )}

        {cfg.deskType === 'counter' && (
          <g opacity="0.65" pointerEvents="none">
            <rect x={cfg.x + 8} y={midY + 4} width={cfg.w - 16} height={6} rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            <circle cx={midX} cy={midY - 8} r="3" fill="#94a3b8" />
            <circle cx={midX} cy={midY + 18} r="2.5" fill="#64748b" />
          </g>
        )}

        {/* Status Alert Pulsing Beacon */}
        {isAlert && (
          <g>
            <circle cx={cfg.x + cfg.w - 10} cy={cfg.y + 10} r="6" fill="#ef4444" opacity="0.4" className="animate-ping" />
            <circle cx={cfg.x + cfg.w - 10} cy={cfg.y + 10} r="4" fill="#ef4444" />
          </g>
        )}

        {isResponding && (
          <circle cx={cfg.x + cfg.w - 10} cy={cfg.y + 10} r="4" fill="#f59e0b" />
        )}

        {/* Room Labels with WCAG AA High-Contrast Font Colors */}
        <text
          x={midX}
          y={cfg.subLabel ? midY - 2 : midY + 4}
          fill={
            isSelected
              ? (isDark ? '#c7d2fe' : '#1e1b4b')
              : isAlert
              ? (isDark ? '#fca5a5' : '#991b1b')
              : isResponding
              ? (isDark ? '#fde68a' : '#92400e')
              : (isDark ? '#f8fafc' : '#0f172a') // Pure Slate-900 in light mode for maximum legibility!
          }
          fontSize={cfg.w < 75 ? '9.5' : cfg.w < 105 ? '10.5' : '11.5'}
          fontWeight="800"
          textAnchor="middle"
          letterSpacing="0.2"
        >
          {cfg.label}
        </text>

        {cfg.subLabel && (
          <text
            x={midX}
            y={midY + 11}
            fill={
              isSelected
                ? (isDark ? '#a5b4fc' : '#3730a3')
                : isAlert
                ? (isDark ? '#f87171' : '#b91c1c')
                : isResponding
                ? (isDark ? '#fbbf24' : '#b45309')
                : (isDark ? '#94a3b8' : '#334155') // Slate-700 in light mode
            }
            fontSize={cfg.w < 75 ? '7.5' : '8.5'}
            fontWeight="600"
            textAnchor="middle"
          >
            {cfg.subLabel}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className={`flex flex-col h-full rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'} overflow-hidden shadow-xl`}>
      {/* 1. Header Toolbar */}
      <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-slate-50'} flex flex-wrap items-center justify-between gap-3`}>
        {/* Left: Title & Live indicator */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-bold tracking-tight">Denah Interaktif MPP Simpurusiang</h2>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE SUPABASE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sinkronisasi Gerai & Fasilitas Publik Terintegrasi
            </p>
          </div>
        </div>

        {/* Center: Single Floor Indicator Badge */}
        <div className={`hidden sm:flex items-center gap-2 ${isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-white border-slate-300 text-slate-700 shadow-sm'} border px-3 py-1.5 rounded-xl text-xs`}>
          <Building2 className="w-3.5 h-3.5 text-emerald-500" />
          <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Denah Fasilitas Pendukung</span>
          <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>•</span>
          <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Seluruh Pelayanan Publik Terpadu</span>
        </div>

        {/* Right: Search & Zoom Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Search Filter */}
          <div className="relative">
            <Search className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari gerai/fasilitas..."
              className={`w-36 md:w-48 pl-8 pr-3 py-1.5 text-xs rounded-xl border ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600 shadow-sm'
              } outline-none transition-all font-medium`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={`absolute right-2 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Zoom Buttons */}
          <div className={`flex items-center ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-300 shadow-sm'} border rounded-xl p-0.5`}>
            <button
              type="button"
              onClick={handleZoomIn}
              title="Perbesar"
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              title="Perkecil"
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetView}
              title="Reset Tampilan"
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Map Legend Status Bar */}
      <div className={`px-4 py-2 border-b ${isDark ? 'border-slate-800/80 bg-slate-950/80' : 'border-slate-200 bg-slate-100'} flex flex-wrap items-center justify-between gap-3 text-xs`}>
        <div className="flex items-center gap-4">
          <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Status:</span>
          
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Bantuan Aktif (Alert)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Ditanggapi (Responding)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Normal / Buka</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${isDark ? 'bg-slate-600' : 'bg-slate-400'}`}></span>
            <span className={isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}>Tutup / Standby</span>
          </div>
        </div>

        <div className={`text-[11px] font-mono flex items-center gap-1.5 font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
          <Sparkles className="w-3.5 h-3.5" />
          <span>Zoom: {Math.round(zoomLevel * 100)}%</span>
        </div>
      </div>

      {/* 3. Main Floor Plan Canvas */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleContainerMouseMove}
        onMouseUp={handleMouseUp}
        className={`relative flex-1 w-full overflow-hidden cursor-crosshair select-none flex flex-col items-center justify-center p-1 sm:p-2 transition-colors duration-200 ${
          isDark ? 'bg-slate-950' : 'bg-slate-100/90'
        }`}
        style={{ minHeight: '560px' }}
      >
        {/* Background Grid Lines */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(${isDark ? '#4f46e5' : '#94a3b8'} 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
            opacity: isDark ? 0.15 : 0.35
          }}
        />

        {/* Content Wrapper with Zoom and Pan Transformations */}
        <div
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.15s ease-out'
          }}
          className={`relative w-full h-full flex-1 rounded-2xl border shadow-xl p-0.5 sm:p-1 flex items-center justify-center overflow-hidden transition-colors duration-200 ${
            isDark
              ? 'bg-slate-900/95 border-slate-800 shadow-slate-950/80'
              : 'bg-white border-slate-300 shadow-slate-200/80'
          }`}
        >
          {/* If rawSvgContent is provided, render injected raw SVG container */}
          {rawSvgContent ? (
            <div 
              ref={rawSvgContainerRef} 
              className="w-full h-full flex items-center justify-center"
            />
          ) : (
            /* Built-in High-Precision Vector SVG Floor Plan - Mengikuti Arsitektur Asli CAD MPP Simpurusiang (Widened 1200x800) */
            <svg
              viewBox={viewBox}
              preserveAspectRatio="xMidYMid meet"
              className="w-full h-full max-h-full block select-none pointer-events-auto"
              xmlns="http://www.w3.org/2009/svg"
            >
              <defs>
                {/* Neon Glow Filters for Dark Mode */}
                <filter id="alert-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#ef4444" floodOpacity="0.9" />
                </filter>
                <filter id="alert-glow-light" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#dc2626" floodOpacity="0.4" />
                </filter>
                <filter id="responding-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#f59e0b" floodOpacity="0.75" />
                </filter>
                <filter id="selection-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor="#6366f1" floodOpacity="0.9" />
                </filter>
                <filter id="selection-glow-light" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#4338ca" floodOpacity="0.35" />
                </filter>

                {/* Floor Tile Grid Pattern */}
                <pattern id="cad-grid" x="0" y="0" width="25" height="25" patternUnits="userSpaceOnUse">
                  <path d="M 25 0 L 0 0 0 25" fill="none" stroke={isDark ? "#1e293b" : "#cbd5e1"} strokeWidth="0.5" opacity={isDark ? "0.35" : "0.5"} />
                </pattern>
              </defs>

              {/* 1. Base Building Footprint & Floor Tile Fill */}
              {/* Main Building Body */}
              <rect
                x="20"
                y="15"
                width="1160"
                height="590"
                rx="16"
                fill={isDark ? "#070b14" : "#f8fafc"}
                stroke={isDark ? "#1e293b" : "#94a3b8"}
                strokeWidth="3"
              />
              {/* Entrance Gate Protrusion (Front Porch / Selasar Masuk) */}
              <rect
                x="480"
                y="605"
                width="240"
                height="180"
                rx="12"
                fill={isDark ? "#070b14" : "#f8fafc"}
                stroke={isDark ? "#1e293b" : "#94a3b8"}
                strokeWidth="3"
              />
              {/* Seamless joint mask */}
              <rect x="482" y="600" width="236" height="15" fill={isDark ? "#070b14" : "#f8fafc"} />

              {/* Subtle Floor Tile Pattern inside Building */}
              <rect x="25" y="20" width="1150" height="580" fill="url(#cad-grid)" />
              <rect x="485" y="610" width="230" height="170" fill="url(#cad-grid)" />

              {/* 2. Circulation Corridors & Wayfinding Tactile Paths (Garis Alur Sirkulasi Organik) */}
              {/* Outer Smooth Contour Loop */}
              <path
                d="M 280 200 C 400 130, 800 130, 920 200 C 990 250, 990 380, 920 425 C 800 495, 400 495, 280 425 C 210 380, 210 250, 280 200 Z"
                fill="none"
                stroke={isDark ? "#1e293b" : "#cbd5e1"}
                strokeWidth="26"
                strokeLinecap="round"
                opacity={isDark ? "0.35" : "0.5"}
              />
              {/* Wayfinding Tactile Guide Line (Alur Pemandu Difabel / Garis Jalur Kuning) */}
              <path
                d="M 600 765 L 600 560"
                stroke={isDark ? "#eab308" : "#ca8a04"}
                strokeWidth="3"
                strokeDasharray="4 4"
                opacity="0.85"
              />
              {/* Guide Lines Radiating to Main Wings */}
              <path
                d="M 600 560 C 600 505, 280 505, 280 370"
                fill="none"
                stroke={isDark ? "#334155" : "#94a3b8"}
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <path
                d="M 600 560 C 600 505, 920 505, 920 370"
                fill="none"
                stroke={isDark ? "#334155" : "#94a3b8"}
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* 3. Outer Structural Columns & Exterior Pillars (Mengikuti CAD Asli) */}
              {/* 4 Pilar Eksterior Sisi Barat */}
              {[140, 270, 400, 530].map((y, idx) => (
                <g key={`ext-col-w-${idx}`} opacity="0.8">
                  <rect x="3" y={y - 7} width="14" height="14" fill={isDark ? "#0f172a" : "#f1f5f9"} stroke={isDark ? "#475569" : "#64748b"} strokeWidth="1.2" />
                  <rect x="6" y={y - 4} width="8" height="8" fill="none" stroke={isDark ? "#38bdf8" : "#0284c7"} strokeWidth="0.8" />
                </g>
              ))}

              {/* 4 Pilar Eksterior Sisi Timur */}
              {[140, 270, 400, 530].map((y, idx) => (
                <g key={`ext-col-e-${idx}`} opacity="0.8">
                  <rect x="1183" y={y - 7} width="14" height="14" fill={isDark ? "#0f172a" : "#f1f5f9"} stroke={isDark ? "#475569" : "#64748b"} strokeWidth="1.2" />
                  <rect x="1186" y={y - 4} width="8" height="8" fill="none" stroke={isDark ? "#38bdf8" : "#0284c7"} strokeWidth="0.8" />
                </g>
              ))}

              {/* Kolom Struktur Bangunan Utama */}
              {[
                { x: 25, y: 20 }, { x: 260, y: 20 }, { x: 600, y: 20 }, { x: 940, y: 20 }, { x: 1175, y: 20 },
                { x: 25, y: 310 }, { x: 1175, y: 310 },
                { x: 25, y: 600 }, { x: 475, y: 600 }, { x: 725, y: 600 }, { x: 1175, y: 600 },
                { x: 475, y: 780 }, { x: 725, y: 780 }
              ].map((col, idx) => (
                <g key={`col-${idx}`} opacity="0.6">
                  <rect x={col.x - 6} y={col.y - 6} width="12" height="12" fill={isDark ? "#1e293b" : "#e2e8f0"} stroke={isDark ? "#475569" : "#94a3b8"} strokeWidth="1" />
                  <line x1={col.x - 6} y1={col.y - 6} x2={col.x + 6} y2={col.y + 6} stroke={isDark ? "#475569" : "#94a3b8"} strokeWidth="0.8" />
                  <line x1={col.x + 6} y1={col.y - 6} x2={col.x - 6} y2={col.y + 6} stroke={isDark ? "#475569" : "#94a3b8"} strokeWidth="0.8" />
                </g>
              ))}

              {/* ======================================================== */}
              {/* DENAH UTAMA FASILITAS PENDUKUNG: ARSITEKTUR ASLI MPP SIMPURUSIANG   */}
              {/* ======================================================== */}
              <g id="lantai_1_layout">
                
                {/* 4. Ruangan Sayap Utara (North Wing Rooms) */}
                {renderRoomBox({ id: 'toilet_pria', x: 148, y: 25, w: 92, h: 82, rx: 8, label: 'TOILET PRIA', subLabel: 'Sanitasi Pria', accent: '#64748b' })}
                {renderRoomBox({ id: 'DUKCAPIL_N', x: 246, y: 25, w: 92, h: 82, rx: 8, label: 'DUKCAPIL', subLabel: 'Loket Cetak', accent: '#10b981', deskType: 'booth' })}
                {renderRoomBox({ id: 'SAMSAT', x: 344, y: 25, w: 92, h: 82, rx: 8, label: 'SAMSAT', subLabel: 'PKB & STNK', accent: '#8b5cf6', deskType: 'booth' })}
                {renderRoomBox({ id: 'NAKERTRANS', x: 442, y: 25, w: 92, h: 82, rx: 8, label: 'NAKERTRANS', subLabel: 'Kartu AK-1', accent: '#06b6d4', deskType: 'booth' })}
                {renderRoomBox({ id: 'BAPENDA', x: 540, y: 25, w: 92, h: 82, rx: 8, label: 'BAPENDA', subLabel: 'PBB & Pajak', accent: '#f59e0b', deskType: 'booth' })}
                {renderRoomBox({ id: 'DEKRANASDA', x: 638, y: 25, w: 92, h: 82, rx: 8, label: 'DEKRANASDA', subLabel: 'Galeri UMKM', accent: '#ec4899', deskType: 'counter' })}
                {renderRoomBox({ id: 'SULSELBAR', x: 736, y: 25, w: 96, h: 82, rx: 8, label: 'SULSELBAR', subLabel: 'Kas Pemda', accent: '#3b82f6', deskType: 'teller' })}
                {renderRoomBox({ id: 'ruang_tim_teknis', x: 838, y: 25, w: 198, h: 82, rx: 8, label: 'Ruang Tim Teknis', subLabel: '10 Workstation OPD', accent: '#6366f1', deskType: 'workstation' })}
                {renderRoomBox({ id: 'smoking_area', x: 1042, y: 25, w: 115, h: 82, rx: 8, label: 'Smoking Area', subLabel: 'Area Terbuka', accent: '#64748b' })}
                {renderRoomBox({ id: 'tangga_naik_ne', x: 1075, y: 115, w: 82, h: 65, rx: 6, label: 'Tangga', subLabel: 'Akses Utara', accent: '#475569' })}

                {/* 5. Ruangan Sayap Barat (West Wing Rooms - Inklusi & Kependudukan - Jarak Lega & Proporsional) */}
                {renderRoomBox({ id: 'toilet_wanita', x: 35, y: 120, w: 105, h: 85, rx: 8, label: 'TOILET WANITA', subLabel: 'Sanitasi Wanita', accent: '#64748b' })}
                {renderRoomBox({ id: 'ruang_istirahat', x: 148, y: 120, w: 105, h: 85, rx: 8, label: 'RUANG ISTIRAHAT', subLabel: 'Locker Petugas', accent: '#475569' })}
                {renderRoomBox({ id: 'DUKCAPIL_W1', x: 35, y: 213, w: 105, h: 85, rx: 8, label: 'DUKCAPIL', subLabel: 'KTP-el & NIK', accent: '#10b981', deskType: 'booth' })}
                {renderRoomBox({ id: 'DUKCAPIL_W2', x: 148, y: 213, w: 105, h: 85, rx: 8, label: 'DUKCAPIL', subLabel: 'Kartu Keluarga', accent: '#10b981', deskType: 'booth' })}
                {renderRoomBox({ id: 'tangga_naik_w', x: 35, y: 338, w: 105, h: 74, rx: 8, label: 'Tangga Naik', subLabel: 'Akses Barat', accent: '#475569' })}
                {renderRoomBox({ id: 'DUKCAPIL_W3', x: 148, y: 338, w: 105, h: 74, rx: 8, label: 'DUKCAPIL', subLabel: 'Akta Kelahiran', accent: '#10b981', deskType: 'booth' })}
                {renderRoomBox({ id: 'layanan_disabilitas', x: 35, y: 420, w: 105, h: 75, rx: 8, label: 'Layanan Disabilitas', subLabel: 'Jalur Inklusif', accent: '#06b6d4', deskType: 'counter' })}
                {renderRoomBox({ id: 'ruang_perawatan', x: 148, y: 420, w: 105, h: 75, rx: 8, label: 'Ruang Laktasi', subLabel: 'Ibu Menyusui', accent: '#ec4899' })}

                {/* 6. Ruangan Sayap Timur (East Wing Rooms - DPMPTSP & Boardroom) */}
                {renderRoomBox({ id: 'DPMPTSP_N', x: 940, y: 190, w: 110, h: 95, rx: 8, label: 'DPMPTSP', subLabel: 'NIB & OSS RBA', accent: '#059669', deskType: 'booth' })}
                {renderRoomBox({ id: 'ruang_rapat', x: 1058, y: 195, w: 98, h: 265, rx: 8, label: 'Ruang Rapat', subLabel: 'Rapat Koordinasi', accent: '#6366f1', deskType: 'conference' })}
                {renderRoomBox({ id: 'DPMPTSP_S', x: 940, y: 360, w: 110, h: 95, rx: 8, label: 'DPMPTSP', subLabel: 'Investasi Luwu', accent: '#059669', deskType: 'booth' })}
                {renderRoomBox({ id: 'tangga_naik_se', x: 1075, y: 470, w: 82, h: 65, rx: 6, label: 'Tangga', subLabel: 'Akses Timur', accent: '#475569' })}

                {/* 7. Ruangan Sayap Selatan (South Wing Rooms) */}
                {renderRoomBox({ id: 'mushalla', x: 148, y: 508, w: 95, h: 82, rx: 8, label: 'MUSHALLA', subLabel: 'Sarana Ibadah', accent: '#10b981' })}
                {renderRoomBox({ id: 'ruang_baca', x: 251, y: 508, w: 95, h: 82, rx: 8, label: 'Pojok Baca', subLabel: 'Literasi Digital', accent: '#06b6d4', deskType: 'counter' })}
                {renderRoomBox({ id: 'lobby_kiri', x: 354, y: 520, w: 115, h: 70, rx: 8, label: 'Lobby Barat', subLabel: 'Ruang Tunggu', accent: '#475569' })}
                {renderRoomBox({ id: 'lobby_kanan', x: 730, y: 520, w: 115, h: 70, rx: 8, label: 'Lobby Timur', subLabel: 'Ruang Tunggu', accent: '#475569' })}
                {renderRoomBox({ id: 'ruang_bermain_anak', x: 853, y: 508, w: 190, h: 82, rx: 8, label: 'Ruang Bermain Anak', subLabel: 'Kids Play Corner', accent: '#f59e0b' })}

                {/* 8. Front Office Concierge, E-Kiosk & Entrance Gates */}
                {renderRoomBox({
                  id: 'front_office',
                  x: 505,
                  y: 485,
                  w: 190,
                  h: 60,
                  rx: 14,
                  label: 'FRONT OFFICE',
                  subLabel: 'Resepsionis & Concierge',
                  accent: '#6366f1',
                  deskType: 'counter'
                })}

                {renderRoomBox({
                  id: 'layanan_mandiri_1',
                  x: 500,
                  y: 555,
                  w: 65,
                  h: 42,
                  rx: 6,
                  label: 'E-KIOSK 1',
                  subLabel: 'Tiket Antrean',
                  accent: '#3b82f6'
                })}

                {renderRoomBox({
                  id: 'layanan_mandiri_2',
                  x: 635,
                  y: 555,
                  w: 65,
                  h: 42,
                  rx: 6,
                  label: 'E-KIOSK 2',
                  subLabel: 'Tiket Antrean',
                  accent: '#3b82f6'
                })}

                {/* Selasar Pintu Masuk / Entrance Porch */}
                {renderRoomBox({
                  id: 'pos_keamanan',
                  x: 495,
                  y: 705,
                  w: 60,
                  h: 65,
                  rx: 6,
                  label: 'POS JAGA',
                  subLabel: 'Security',
                  accent: '#475569'
                })}

                {renderRoomBox({
                  id: 'gerbang_masuk',
                  x: 570,
                  y: 720,
                  w: 100,
                  h: 60,
                  rx: 6,
                  label: 'PINTU MASUK',
                  subLabel: 'Akses Utama',
                  accent: '#10b981'
                })}

                {/* 9. Atrium Tengah - Pulau Pelayanan Sentral Simpurusiang */}
                {/* Outer Decorative Island Atrium Base */}
                <ellipse
                  cx="600"
                  cy="305"
                  rx="275"
                  ry="165"
                  fill={isDark ? "#0b1322" : "#f1f5f9"}
                  stroke={isDark ? "#1e293b" : "#cbd5e1"}
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />

                {/* Central Simpurusiang Dual Concentric Teardrop Motif (Sesuai Denah CAD Asli) */}
                <g opacity={isDark ? "0.75" : "0.9"} pointerEvents="none">
                  {/* Western Concentric Teardrop (Melingkar di Barat, Meruncing ke Timur) */}
                  {[
                    { r: 42, tip: 588, strokeW: 1.5, opacity: 0.9 },
                    { r: 32, tip: 576, strokeW: 1.2, opacity: 0.7 },
                    { r: 22, tip: 564, strokeW: 1.0, opacity: 0.5 },
                    { r: 12, tip: 550, strokeW: 0.8, opacity: 0.35 }
                  ].map((ring, idx) => (
                    <path
                      key={`teardrop-w-${idx}`}
                      d={`M ${ring.tip} 305 C ${520 + ring.r * 0.7} ${305 - ring.r * 1.3}, ${520 - ring.r} ${305 - ring.r}, ${520 - ring.r} 305 C ${520 - ring.r} ${305 + ring.r}, ${520 + ring.r * 0.7} ${305 + ring.r * 1.3}, ${ring.tip} 305 Z`}
                      fill={idx === 3 ? (isDark ? "#0284c7" : "#38bdf8") : "none"}
                      fillOpacity={idx === 3 ? "0.25" : "0"}
                      stroke={isDark ? "#38bdf8" : "#0284c7"}
                      strokeWidth={ring.strokeW}
                      strokeOpacity={ring.opacity}
                    />
                  ))}

                  {/* Eastern Concentric Teardrop (Melingkar di Timur, Meruncing ke Barat) */}
                  {[
                    { r: 42, tip: 612, strokeW: 1.5, opacity: 0.9 },
                    { r: 32, tip: 624, strokeW: 1.2, opacity: 0.7 },
                    { r: 22, tip: 636, strokeW: 1.0, opacity: 0.5 },
                    { r: 12, tip: 650, strokeW: 0.8, opacity: 0.35 }
                  ].map((ring, idx) => (
                    <path
                      key={`teardrop-e-${idx}`}
                      d={`M ${ring.tip} 305 C ${680 - ring.r * 0.7} ${305 - ring.r * 1.3}, ${680 + ring.r} ${305 - ring.r}, ${680 + ring.r} 305 C ${680 + ring.r} ${305 + ring.r}, ${680 - ring.r * 0.7} ${305 + ring.r * 1.3}, ${ring.tip} 305 Z`}
                      fill={idx === 3 ? (isDark ? "#f59e0b" : "#fbbf24") : "none"}
                      fillOpacity={idx === 3 ? "0.25" : "0"}
                      stroke={isDark ? "#f59e0b" : "#d97706"}
                      strokeWidth={ring.strokeW}
                      strokeOpacity={ring.opacity}
                    />
                  ))}

                  {/* Central Simpurusiang Axis Label */}
                  <text x="600" y="298" fill={isDark ? "#a5b4fc" : "#1e3a8a"} fontSize="8" fontWeight="800" textAnchor="middle" letterSpacing="1">
                    SIMPURUSIANG
                  </text>
                  <text x="600" y="312" fill={isDark ? "#94a3b8" : "#475569"} fontSize="6.5" fontWeight="600" textAnchor="middle">
                    ATRIUM SENTRAL
                  </text>
                </g>

                {/* Central Curved Island Booths */}
                {/* Busur Selatan (South Arc): PUPTR, KOMINFO, PERIKANAN */}
                {renderRoomBox({ id: 'PUPTR', x: 450, y: 410, w: 85, h: 52, rx: 8, label: 'PUPTR', subLabel: 'Tata Ruang', accent: '#eab308', deskType: 'booth' })}
                {renderRoomBox({ id: 'KOMINFO', x: 555, y: 415, w: 90, h: 52, rx: 8, label: 'KOMINFO', subLabel: 'SPBE & TIK', accent: '#06b6d4', deskType: 'booth' })}
                {renderRoomBox({ id: 'PERIKANAN', x: 665, y: 410, w: 85, h: 52, rx: 8, label: 'PERIKANAN', subLabel: 'Kelautan', accent: '#0284c7', deskType: 'booth' })}

                {/* Busur Barat (West Arc): BPN, NERVIS, TASPEN, PDAM */}
                {renderRoomBox({ id: 'BPN', x: 345, y: 200, w: 78, h: 50, rx: 8, label: 'BPN', subLabel: 'Sertifikat', accent: '#d97706', deskType: 'booth' })}
                {renderRoomBox({ id: 'NERVIS', x: 320, y: 265, w: 78, h: 50, rx: 8, label: 'NERVIS', subLabel: 'Ketenagakerjaan', accent: '#64748b', deskType: 'booth' })}
                {renderRoomBox({ id: 'TASPEN', x: 320, y: 330, w: 78, h: 50, rx: 8, label: 'TASPEN', subLabel: 'Pensiun ASN', accent: '#8b5cf6', deskType: 'booth' })}
                {renderRoomBox({ id: 'PDAM', x: 345, y: 395, w: 78, h: 50, rx: 8, label: 'PDAM', subLabel: 'Tirta Luwu', accent: '#3b82f6', deskType: 'booth' })}

                {/* Busur Utara (North Arc): IMIGRASI, KPP_PRATAMA, DINSOS */}
                {renderRoomBox({ id: 'IMIGRASI', x: 450, y: 155, w: 85, h: 52, rx: 8, label: 'IMIGRASI', subLabel: 'Paspor RI', accent: '#06b6d4', deskType: 'booth' })}
                {renderRoomBox({ id: 'KPP_PRATAMA', x: 555, y: 150, w: 90, h: 52, rx: 8, label: 'KPP PRATAMA', subLabel: 'Pajak Palopo', accent: '#f59e0b', deskType: 'booth' })}
                {renderRoomBox({ id: 'DINSOS', x: 665, y: 155, w: 85, h: 52, rx: 8, label: 'DINSOS', subLabel: 'Bansos & DTKS', accent: '#10b981', deskType: 'booth' })}

                {/* Busur Timur (East Arc): KEJARI, HAS, BPJS_KET, BPJS_KES */}
                {renderRoomBox({ id: 'KEJARI', x: 775, y: 200, w: 78, h: 50, rx: 8, label: 'KEJARI', subLabel: 'Pos Hukum', accent: '#ef4444', deskType: 'booth' })}
                {renderRoomBox({ id: 'HAS', x: 800, y: 265, w: 78, h: 50, rx: 8, label: 'HAS', subLabel: 'Sertifikasi Halal', accent: '#10b981', deskType: 'booth' })}
                {renderRoomBox({ id: 'BPJS_KET', x: 800, y: 330, w: 78, h: 50, rx: 8, label: 'BPJS-TK', subLabel: 'Ketenagakerjaan', accent: '#10b981', deskType: 'booth' })}
                {renderRoomBox({ id: 'BPJS_KES', x: 775, y: 395, w: 78, h: 50, rx: 8, label: 'BPJS-KES', subLabel: 'JKN-KIS', accent: '#0284c7', deskType: 'booth' })}

                {/* 10. Center Waiting Lounge / Display Kursi Tunggu */}
                <g opacity={isDark ? "0.5" : "0.75"} pointerEvents="none">
                  {/* Clusters of Seating Circles in the open atrium area */}
                  {[
                    { cx: 500, cy: 260 }, { cx: 525, cy: 260 }, { cx: 500, cy: 278 }, { cx: 525, cy: 278 },
                    { cx: 675, cy: 260 }, { cx: 700, cy: 260 }, { cx: 675, cy: 278 }, { cx: 700, cy: 278 },
                    { cx: 500, cy: 345 }, { cx: 525, cy: 345 }, { cx: 500, cy: 363 }, { cx: 525, cy: 363 },
                    { cx: 675, cy: 345 }, { cx: 700, cy: 345 }, { cx: 675, cy: 363 }, { cx: 700, cy: 363 }
                  ].map((chair, i) => (
                    <circle key={`chair-${i}`} cx={chair.cx} cy={chair.cy} r="4.5" fill={isDark ? "#334155" : "#cbd5e1"} stroke={isDark ? "#475569" : "#94a3b8"} strokeWidth="1" />
                  ))}
                </g>
              </g>
              </svg>
            )}

            {/* Floating Hover Tooltip */}
            {tooltipPos && hoveredInfo && (
              <div
                style={{
                  left: `${Math.min(tooltipPos.x + 16, 750)}px`,
                  top: `${Math.max(tooltipPos.y - 80, 16)}px`
                }}
                className={`absolute z-50 pointer-events-none ${
                  isDark
                    ? 'bg-slate-900/95 border-slate-700 text-slate-100 shadow-slate-950/90'
                    : 'bg-white/95 border-slate-300 text-slate-900 shadow-xl'
                } border px-3.5 py-2.5 rounded-xl shadow-2xl backdrop-blur-md transition-all duration-75 flex flex-col gap-1 min-w-[210px]`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-bold text-xs truncate max-w-[150px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {hoveredInfo.name}
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700 font-bold border border-slate-200'}`}>
                    {hoveredInfo.code}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className={isDark ? 'text-slate-400 capitalize' : 'text-slate-600 font-medium capitalize'}>
                    {hoveredInfo.type === 'tenant' ? 'Gerai Pelayanan' : 'Fasilitas Terpadu'}
                  </span>
                  <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>•</span>
                  <span className={
                    hoveredInfo.status === 'alert'
                      ? (isDark ? 'text-rose-400 font-bold animate-pulse' : 'text-rose-600 font-bold animate-pulse')
                      : hoveredInfo.status === 'responding'
                      ? (isDark ? 'text-amber-400 font-bold' : 'text-amber-600 font-bold')
                      : (isDark ? 'text-emerald-400 font-bold' : 'text-emerald-600 font-bold')
                  }>
                    {hoveredInfo.status === 'alert' ? 'BANTUAN DIPERLUKAN' : hoveredInfo.status === 'responding' ? 'SEDANG DITANGGAPI' : 'STANDBY'}
                  </span>
                </div>
                {hoveredInfo.activeRequests.length > 0 && (
                  <div className={`text-[10px] font-mono flex items-center gap-1 mt-0.5 font-bold ${isDark ? 'text-rose-300' : 'text-rose-600'}`}>
                    <BellRing className="w-3 h-3" />
                    <span>{hoveredInfo.activeRequests.length} Panggilan Aktif</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Wayfinding Helper Note - Static Bar outside Transform Container */}
        <div className={`px-4 py-2 border-t w-full shrink-0 ${isDark ? 'border-slate-800 bg-slate-900/70 text-slate-400' : 'border-slate-200 bg-white/90 text-slate-600'} flex items-center justify-between text-xs`}>
          <span className="flex items-center gap-1.5 text-[11px] font-medium">
            <Footprints className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Arahkan kursor atau klik gerai/fasilitas untuk melihat detail operasional</span>
          </span>
          <span className={`font-mono text-[11px] hidden sm:inline ${isDark ? 'text-indigo-400' : 'text-indigo-600 font-bold'}`}>
            Denah Arsitektur MPP Simpurusiang • Kabupaten Luwu
          </span>
        </div>

        {/* 4. Bottom Inspection Drawer / Selected Element Panel */}
        <AnimatePresence>
          {selectedInfo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`border-t ${isDark ? 'border-slate-800 bg-slate-900/95 text-slate-100' : 'border-slate-200 bg-white text-slate-900 shadow-md'} p-4 flex flex-wrap items-center justify-between gap-4`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl border ${
                  selectedInfo.status === 'alert'
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-500 animate-pulse'
                    : selectedInfo.status === 'responding'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-500'
                    : isDark ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                }`}>
                  {selectedInfo.type === 'tenant' ? <Building2 className="w-6 h-6" /> : <Laptop className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedInfo.name}</h3>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700 font-bold border border-slate-200'}`}>
                      ID: {selectedInfo.id}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${isDark ? 'bg-indigo-950 text-indigo-300 border-indigo-800' : 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold'}`}>
                      Denah Utama (Fasilitas Pendukung)
                    </span>
                  </div>
                  <p className={`text-xs mt-1 max-w-xl line-clamp-1 ${isDark ? 'text-slate-300' : 'text-slate-600 font-medium'}`}>
                    {selectedInfo.description || (selectedInfo.type === 'tenant' ? 'Gerai Resmi Pelayanan Terpadu' : 'Fasilitas Layanan Publik')}
                  </p>
                </div>
              </div>

            {/* Status & Actions */}
            <div className="flex items-center gap-3">
              {selectedInfo.activeRequests.length > 0 ? (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                  isDark ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-700'
                }`}>
                  <BellRing className="w-4 h-4 animate-bounce" />
                  <span>{selectedInfo.activeRequests.length} Permintaan Bantuan</span>
                </div>
              ) : (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                  isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                }`}>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Kondisi Normal</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setInternalSelectedId(null)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
