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
  if (points.length < 2) {
    return {
      doorKey,
      d: '',
      totalLength: 0,
      samples: [],
      chevronPositions: []
    };
  }

  // 1. Fillet corners to produce smooth, natural transitions at turns
  interface PathSection {
    type: 'line';
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    len: number;
    angle: number;
  }
  interface ArcSection {
    type: 'curve';
    p0: { x: number; y: number };
    cp: { x: number; y: number };
    p1: { x: number; y: number };
    approxLen: number;
  }
  type Section = PathSection | ArcSection;

  const sections: Section[] = [];
  const svgCommands: string[] = [`M ${points[0].x} ${points[0].y}`];
  let currentPt = { x: points[0].x, y: points[0].y };

  for (let i = 1; i < points.length; i++) {
    const isCorner = i < points.length - 1;
    const prevPt = points[i - 1];
    const currPt = points[i];
    const nextPt = isCorner ? points[i + 1] : null;

    if (!isCorner || !nextPt) {
      // Final linear segment
      const dx = currPt.x - currentPt.x;
      const dy = currPt.y - currentPt.y;
      const len = Math.hypot(dx, dy);
      if (len > 0.01) {
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        sections.push({
          type: 'line',
          x1: currentPt.x,
          y1: currentPt.y,
          x2: currPt.x,
          y2: currPt.y,
          len,
          angle
        });
        svgCommands.push(`L ${currPt.x} ${currPt.y}`);
      }
      currentPt = currPt;
      continue;
    }

    // Corner at currPt between prevPt and nextPt
    const dxIn = currPt.x - prevPt.x;
    const dyIn = currPt.y - prevPt.y;
    const lenIn = Math.hypot(dxIn, dyIn);
    const uInX = dxIn / (lenIn || 1);
    const uInY = dyIn / (lenIn || 1);

    const dxOut = nextPt.x - currPt.x;
    const dyOut = nextPt.y - currPt.y;
    const lenOut = Math.hypot(dxOut, dyOut);
    const uOutX = dxOut / (lenOut || 1);
    const uOutY = dyOut / (lenOut || 1);

    // Angle change calculation
    const angleChange = Math.abs((Math.atan2(dyOut, dxOut) - Math.atan2(dyIn, dxIn)) * 180 / Math.PI);
    const normalizedAngleChange = angleChange > 180 ? 360 - angleChange : angleChange;
    const canFillet = normalizedAngleChange > 5 && lenIn > 20 && lenOut > 20;

    if (!canFillet) {
      const dx = currPt.x - currentPt.x;
      const dy = currPt.y - currentPt.y;
      const len = Math.hypot(dx, dy);
      if (len > 0.01) {
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        sections.push({
          type: 'line',
          x1: currentPt.x,
          y1: currentPt.y,
          x2: currPt.x,
          y2: currPt.y,
          len,
          angle
        });
        svgCommands.push(`L ${currPt.x} ${currPt.y}`);
      }
      currentPt = currPt;
    } else {
      // Fillet radius ~ 42 units for smooth, natural hallway curves
      const maxFillet = Math.min(42, lenIn * 0.42, lenOut * 0.42);
      const startFillet = {
        x: currPt.x - uInX * maxFillet,
        y: currPt.y - uInY * maxFillet
      };
      const endFillet = {
        x: currPt.x + uOutX * maxFillet,
        y: currPt.y + uOutY * maxFillet
      };

      // 1. Line to start of fillet
      const dxLine = startFillet.x - currentPt.x;
      const dyLine = startFillet.y - currentPt.y;
      const lenLine = Math.hypot(dxLine, dyLine);
      if (lenLine > 0.01) {
        const angle = (Math.atan2(dyLine, dxLine) * 180) / Math.PI;
        sections.push({
          type: 'line',
          x1: currentPt.x,
          y1: currentPt.y,
          x2: startFillet.x,
          y2: startFillet.y,
          len: lenLine,
          angle
        });
        svgCommands.push(`L ${startFillet.x.toFixed(1)} ${startFillet.y.toFixed(1)}`);
      }

      // 2. Quadratic curve through corner
      const chordLen = Math.hypot(endFillet.x - startFillet.x, endFillet.y - startFillet.y);
      const polyLen = Math.hypot(currPt.x - startFillet.x, currPt.y - startFillet.y) + Math.hypot(endFillet.x - currPt.x, endFillet.y - currPt.y);
      const approxCurveLen = (2 * chordLen + polyLen) / 3;

      sections.push({
        type: 'curve',
        p0: startFillet,
        cp: currPt,
        p1: endFillet,
        approxLen: approxCurveLen
      });
      svgCommands.push(`Q ${currPt.x.toFixed(1)} ${currPt.y.toFixed(1)} ${endFillet.x.toFixed(1)} ${endFillet.y.toFixed(1)}`);
      currentPt = endFillet;
    }
  }

  // 2. Sample densely along sections with continuous position and derivative angle
  interface DensePoint {
    x: number;
    y: number;
    angleDeg: number;
    stepLen: number;
  }
  const densePoints: DensePoint[] = [];

  for (const sec of sections) {
    if (sec.type === 'line') {
      const numSteps = Math.max(1, Math.ceil(sec.len / 2));
      for (let s = 0; s < numSteps; s++) {
        const t = s / numSteps;
        const nextT = (s + 1) / numSteps;
        densePoints.push({
          x: sec.x1 + (sec.x2 - sec.x1) * t,
          y: sec.y1 + (sec.y2 - sec.y1) * t,
          angleDeg: sec.angle,
          stepLen: sec.len * (nextT - t)
        });
      }
    } else {
      // Quadratic bezier curve sampling with exact derivative angle
      const numSteps = Math.max(16, Math.ceil(sec.approxLen / 2));
      for (let s = 0; s < numSteps; s++) {
        const t = s / numSteps;
        const oneMinusT = 1 - t;
        const x = oneMinusT * oneMinusT * sec.p0.x + 2 * oneMinusT * t * sec.cp.x + t * t * sec.p1.x;
        const y = oneMinusT * oneMinusT * sec.p0.y + 2 * oneMinusT * t * sec.cp.y + t * t * sec.p1.y;
        const dx = 2 * oneMinusT * (sec.cp.x - sec.p0.x) + 2 * t * (sec.p1.x - sec.cp.x);
        const dy = 2 * oneMinusT * (sec.cp.y - sec.p0.y) + 2 * t * (sec.p1.y - sec.cp.y);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

        const nextT = (s + 1) / numSteps;
        const nextOneMinusT = 1 - nextT;
        const nextX = nextOneMinusT * nextOneMinusT * sec.p0.x + 2 * nextOneMinusT * nextT * sec.cp.x + nextT * nextT * sec.p1.x;
        const nextY = nextOneMinusT * nextOneMinusT * sec.p0.y + 2 * nextOneMinusT * nextT * sec.cp.y + nextT * nextT * sec.p1.y;

        densePoints.push({
          x,
          y,
          angleDeg: angle,
          stepLen: Math.hypot(nextX - x, nextY - y)
        });
      }
    }
  }

  // 3. Resample into equidistant PathSample array (step = 4 units)
  let totalLength = 0;
  for (const dp of densePoints) {
    totalLength += dp.stepLen;
  }

  const step = 4;
  const sampleCount = Math.max(1, Math.floor(totalLength / step));
  const samples: PathSample[] = [];

  let denseIdx = 0;
  let denseDistSoFar = 0;

  for (let s = 0; s <= sampleCount; s++) {
    const targetDist = s * step;
    while (denseIdx < densePoints.length - 1 && denseDistSoFar + densePoints[denseIdx].stepLen < targetDist) {
      denseDistSoFar += densePoints[denseIdx].stepLen;
      denseIdx++;
    }
    const dp = densePoints[denseIdx] || densePoints[densePoints.length - 1];
    samples.push({
      distance: targetDist,
      x: dp.x,
      y: dp.y,
      angleDeg: ((dp.angleDeg % 360) + 360) % 360
    });
  }

  // Hitung posisi awal chevron (jarak ~85 unit)
  const spacing = EVAC_CONFIG.chevron.spacing;
  const chevronCount = Math.floor(totalLength / spacing);
  const chevronPositions: number[] = [];
  for (let c = 0; c < chevronCount; c++) {
    chevronPositions.push(c * spacing);
  }

  const d = svgCommands.join(' ');

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
 * Menggunakan interpolasi busur sudut terpendek (shortest-arc slerp) untuk kelancaran rotasi chevron
 */
export function getPointOnPrecomputedRoute(route: RouteGeometry, dist: number): PathSample {
  if (!route.samples || route.samples.length === 0) {
    return { distance: 0, x: 0, y: 0, angleDeg: 0 };
  }
  const normDist = ((dist % route.totalLength) + route.totalLength) % route.totalLength;
  const step = 4;
  const idx = Math.floor(normDist / step);
  const nextIdx = Math.min(route.samples.length - 1, idx + 1);
  const baseSample = route.samples[Math.min(route.samples.length - 1, idx)];
  const nextSample = route.samples[nextIdx];
  const t = Math.max(0, Math.min(1, (normDist - baseSample.distance) / step));

  // Angular difference with shortest arc handling to prevent abrupt angle snapping
  let dAngle = nextSample.angleDeg - baseSample.angleDeg;
  while (dAngle > 180) dAngle -= 360;
  while (dAngle < -180) dAngle += 360;
  const interpolatedAngle = baseSample.angleDeg + dAngle * t;

  return {
    distance: normDist,
    x: baseSample.x + (nextSample.x - baseSample.x) * t,
    y: baseSample.y + (nextSample.y - baseSample.y) * t,
    angleDeg: ((interpolatedAngle % 360) + 360) % 360
  };
}
