/**
 * Konfigurasi & Precomputed Path Table Rute Evakuasi K3 (Lantai 1)
 * MPP Simpurusiang Kabupaten Luwu (viewBox 3646 x 2497)
 * Sesuai Doktrin Keamanan K3 Pemkab Luwu
 */

export interface EvacPoint {
  x: number;
  y: number;
}

export interface EvacDoor {
  id: string;
  doorKey: 'utara' | 'selatan' | 'utama';
  label: string;
  doorBBox: { x: number; y: number; w: number; h: number };
  route: EvacPoint[];
}

export interface EvacConfig {
  verified: boolean;
  verificationNote: string;
  assemblyPoint: {
    id: string;
    label: string;
    point: EvacPoint;
  };
  chevron: {
    spacing: number;  // 85 unit
    height: number;   // ~26 unit
    stroke: number;   // 7 unit
    band: number;     // 44 unit
    speed: number;    // 140 unit / detik
  };
  doors: Record<'utara' | 'selatan' | 'utama', EvacDoor>;
}

// Titik Kumpul Terverifikasi di Tengah Denah
export const EVAC_ASSEMBLY_POINT: EvacPoint = { x: 1922, y: 832 };

// Rute Hasil Algoritma A* Medial-Axis Data-Driven (Clearance >= 40 unit)
export const EVAC_CONFIG: EvacConfig = {
  verified: false,
  verificationNote: 'Belum diverifikasi petugas K3/damkar',
  assemblyPoint: {
    id: 'assembly-central',
    label: 'Titik Kumpul',
    point: EVAC_ASSEMBLY_POINT
  },
  chevron: {
    spacing: 85,
    height: 26,
    stroke: 7,
    band: 44,
    speed: 140
  },
  doors: {
    utara: {
      id: 'exit-utara',
      doorKey: 'utara',
      label: 'PINTU UTARA',
      doorBBox: { x: 673, y: 748, w: 90, h: 90 },
      route: [
        { x: 1922, y: 832 },
        { x: 1272, y: 793 },
        { x: 718, y: 793 }
      ]
    },
    selatan: {
      id: 'exit-selatan',
      doorKey: 'selatan',
      label: 'PINTU SELATAN',
      doorBBox: { x: 3117, y: 1098, w: 90, h: 90 },
      route: [
        { x: 1922, y: 832 },
        { x: 2616, y: 824 },
        { x: 2986, y: 824 },
        { x: 2986, y: 1143 },
        { x: 3162, y: 1143 }
      ]
    },
    utama: {
      id: 'exit-utama',
      doorKey: 'utama',
      label: 'PINTU UTAMA',
      doorBBox: { x: 1767, y: 1951, w: 314, h: 90 },
      route: [
        { x: 1922, y: 832 },
        { x: 1928, y: 1456 },
        { x: 1928, y: 1996 }
      ]
    }
  }
};

/**
 * Precomputed Polyline Lookup Table
 * Dihitung SEKALI saat modul dimuat untuk menghindari getPointAtLength() tiap rAF frame.
 */
export interface PathSample {
  distance: number;
  x: number;
  y: number;
  angleDeg: number;
}

export interface RouteGeometry {
  doorKey: 'utara' | 'selatan' | 'utama';
  d: string;
  totalLength: number;
  samples: PathSample[];
  chevronPositions: number[]; // Initial distance offsets
}

function buildRouteGeometry(doorKey: 'utara' | 'selatan' | 'utama', points: EvacPoint[]): RouteGeometry {
  let totalLength = 0;
  const segments: Array<{ x1: number; y1: number; x2: number; y2: number; len: number; angle: number; startDist: number }> = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    segments.push({
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
      len,
      angle,
      startDist: totalLength
    });
    totalLength += len;
  }

  // Precompute titik tiap 4 unit sepanjang polyline
  const samples: PathSample[] = [];
  const step = 4;
  const sampleCount = Math.floor(totalLength / step);

  for (let s = 0; s <= sampleCount; s++) {
    const targetDist = s * step;
    // Cari segmen yang menampung jarak ini
    let seg = segments[segments.length - 1];
    for (let j = 0; j < segments.length; j++) {
      if (targetDist <= segments[j].startDist + segments[j].len) {
        seg = segments[j];
        break;
      }
    }
    const segT = seg.len > 0 ? (targetDist - seg.startDist) / seg.len : 0;
    const clampedT = Math.max(0, Math.min(1, segT));
    samples.push({
      distance: targetDist,
      x: seg.x1 + (seg.x2 - seg.x1) * clampedT,
      y: seg.y1 + (seg.y2 - seg.y1) * clampedT,
      angleDeg: seg.angle
    });
  }

  // Hitung posisi awal chevron (jarak 85 unit)
  const spacing = EVAC_CONFIG.chevron.spacing;
  const chevronCount = Math.floor(totalLength / spacing);
  const chevronPositions: number[] = [];
  for (let c = 0; c < chevronCount; c++) {
    chevronPositions.push(c * spacing);
  }

  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return {
    doorKey,
    d,
    totalLength,
    samples,
    chevronPositions
  };
}

// Map geometri rute terkomputasi (HANYA SEKALI EKSEKUSI)
export const PRECOMPUTED_EVAC_ROUTES: Record<'utara' | 'selatan' | 'utama', RouteGeometry> = {
  utara: buildRouteGeometry('utara', EVAC_CONFIG.doors.utara.route),
  selatan: buildRouteGeometry('selatan', EVAC_CONFIG.doors.selatan.route),
  utama: buildRouteGeometry('utama', EVAC_CONFIG.doors.utama.route)
};

/**
 * Mengambil interpolasi posisi titik dan rotasi sudut berdasarkan jarak kumulatif
 */
export function getPointOnPrecomputedRoute(route: RouteGeometry, dist: number): PathSample {
  const normDist = ((dist % route.totalLength) + route.totalLength) % route.totalLength;
  const idx = Math.floor(normDist / 4);
  const nextIdx = Math.min(route.samples.length - 1, idx + 1);
  const baseSample = route.samples[Math.min(route.samples.length - 1, idx)];
  const nextSample = route.samples[nextIdx];
  const t = (normDist - baseSample.distance) / 4;

  return {
    distance: normDist,
    x: baseSample.x + (nextSample.x - baseSample.x) * Math.max(0, Math.min(1, t)),
    y: baseSample.y + (nextSample.y - baseSample.y) * Math.max(0, Math.min(1, t)),
    angleDeg: baseSample.angleDeg
  };
}
