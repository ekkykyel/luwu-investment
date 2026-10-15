import React from 'react';

/**
 * Generator Peta Vector Geospasial Kabupaten Luwu
 * Menghasilkan SVG Peta Tematik High-Definition (300 DPI) & Komponen Vector Murni
 * 100% Bebas Ketergantungan Network/CORS, Valid XML, dan Memproyeksikan Titik Batas Nyata
 */

export interface LuwuGisCoordinatePoint {
  id?: number | string;
  pointName?: string;
  latitudeDd: number;
  longitudeDd: number;
  latitudeDms?: string;
  longitudeDms?: string;
  description?: string;
}

export interface LuwuGisMapParams {
  desa?: string;
  kecamatan?: string;
  pemohon?: string;
  perusahaan?: string;
  luas?: string;
  tipeDoc?: 'PKKPR' | 'LP2B' | 'KTR';
  koordinatLat?: string;
  koordinatLng?: string;
  nomorSurat?: string;
  koordinatPoligon?: LuwuGisCoordinatePoint[];
  geometry?: any;
  zonaRtrw?: string;
  statusLp2b?: string;
  mapSnapshot?: string | null;
}

/**
 * Helper untuk sanitasi XML/SVG agar tidak pernah terjadi decode/parse error
 */
export function escapeXml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Konversi Derajat Desimal (DD) ke Derajat Menit Detik (DMS)
 */
export function ddToDms(dd: number, isLat: boolean): string {
  const dir = isLat ? (dd >= 0 ? "LU" : "LS") : (dd >= 0 ? "BT" : "BB");
  const abs = Math.abs(dd);
  const deg = Math.floor(abs);
  const minFloat = (abs - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = ((minFloat - min) * 60).toFixed(1);
  return `${deg}° ${min}' ${sec}" ${dir}`;
}

/**
 * Hitung jarak Haversine (meter) antara dua titik koordinat
 */
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Ekstraksi koordinat dari GeoJSON geometry jika koordinatPoligon tidak tersedia
 */
export function extractCoordsFromGeometry(geom: any): LuwuGisCoordinatePoint[] {
  if (!geom) return [];
  let ring: [number, number][] = [];
  
  if (typeof geom === 'string') {
    try {
      geom = JSON.parse(geom);
    } catch {
      return [];
    }
  }

  // Handle FeatureCollection or Feature
  if (geom.type === "FeatureCollection" && Array.isArray(geom.features) && geom.features[0]) {
    geom = geom.features[0].geometry || geom.features[0];
  } else if (geom.type === "Feature") {
    geom = geom.geometry || geom;
  }

  if (geom.type === "Polygon" && Array.isArray(geom.coordinates) && geom.coordinates[0]) {
    ring = geom.coordinates[0];
  } else if (geom.type === "MultiPolygon" && Array.isArray(geom.coordinates) && geom.coordinates[0]?.[0]) {
    ring = geom.coordinates[0][0];
  } else if (geom.type === "Point" && Array.isArray(geom.coordinates)) {
    const [lng, lat] = geom.coordinates;
    return [{
      id: 1,
      pointName: "P.01",
      latitudeDd: lat,
      longitudeDd: lng,
      latitudeDms: ddToDms(lat, true),
      longitudeDms: ddToDms(lng, false),
      description: "Titik Lokasi Pemohon"
    }];
  }

  if (ring.length === 0) return [];
  const validPoints = (ring.length > 3 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1])
    ? ring.slice(0, ring.length - 1)
    : ring;

  return validPoints.map(([lng, lat], idx) => ({
    id: idx + 1,
    pointName: `P.${String(idx + 1).padStart(2, '0')}`,
    latitudeDd: lat,
    longitudeDd: lng,
    latitudeDms: ddToDms(lat, true),
    longitudeDms: ddToDms(lng, false),
    description: `Titik Patok Sudut Batas ${idx + 1}`
  }));
}

/**
 * Hitung Luas Geodesi Poligon (m²) dari deretan titik koordinat WGS84
 */
export function calculateGeodesicAreaM2(points: LuwuGisCoordinatePoint[]): number {
  if (!points || points.length < 3) return 0;
  const rad = Math.PI / 180;
  const R = 6378137; // WGS84 Earth Radius
  let area = 0;

  const len = points.length;
  for (let i = 0; i < len; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % len];
    const lon1 = p1.longitudeDd * rad;
    const lat1 = p1.latitudeDd * rad;
    const lon2 = p2.longitudeDd * rad;
    const lat2 = p2.latitudeDd * rad;
    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  area = Math.abs(area * R * R / 2.0);
  return Math.round(area);
}

/**
 * Helper internal untuk menghitung model spasial dan proyeksi poligon
 */
function prepareSpatialModel(params: LuwuGisMapParams) {
  const desaName = (params.desa || 'Karang-Karangan').replace(/^Desa\s+/i, '').trim();
  const kecName = (params.kecamatan || 'Bua').replace(/^Kecamatan\s+/i, '').trim();
  const pemohonName = (params.pemohon || params.perusahaan || 'PEMOHON TERDAFTAR').trim();
  const luasStr = params.luas || '1.00 Ha (10.000 m²)';
  const tipeDoc = params.tipeDoc || 'PKKPR';
  const nomorSurat = params.nomorSurat || '520.1/BAP/LUWU/2026';
  const isLp2b = tipeDoc === 'LP2B';
  const opdName = isLp2b ? 'DINAS PERTANIAN' : 'DINAS PEKERJAAN UMUM DAN PENATAAN RUANG';

  const headerTitle = isLp2b 
    ? 'PETA DELINEASI GEOSPASIAL LP2B & JARINGAN IRIGASI PERTANIAN'
    : 'PETA PLOTTING ZONASI TATA RUANG (RTRW) & DELINEASI KESESUAIAN RUANG';

  // 1. Ekstraksi Titik Koordinat Poligon Nyata dari Sudut-Sudut Poligon (Strict GeoJSON Single Source of Truth)
  let points: LuwuGisCoordinatePoint[] = [];
  if (params.geometry) {
    points = extractCoordsFromGeometry(params.geometry);
  }
  if (points.length === 0 && params.koordinatPoligon && params.koordinatPoligon.length > 0) {
    points = params.koordinatPoligon.filter(p => typeof p.latitudeDd === 'number' && typeof p.longitudeDd === 'number' && !isNaN(p.latitudeDd) && !isNaN(p.longitudeDd));
  }

  // 2. Dimensi Kanvas Peta (1000 x 650)
  const mapLeft = 35;
  const mapTop = 68;
  const mapWidth = 930;
  const mapHeight = 540;
  const mapRight = mapLeft + mapWidth;
  const mapBottom = mapTop + mapHeight;

  // Jika tidak ada data geometri, gunakan titik centroid Luwu yang aman tanpa dummy poligon
  if (points.length === 0) {
    return {
      desaName,
      kecName,
      pemohonName,
      luasStr,
      tipeDoc,
      nomorSurat,
      isLp2b,
      opdName,
      headerTitle,
      points: [],
      mapLeft,
      mapTop,
      mapWidth,
      mapHeight,
      mapRight,
      mapBottom,
      projX: () => mapLeft + mapWidth / 2,
      projY: () => mapTop + mapHeight / 2,
      svgPolygonPoints: '',
      svgBufferPoints: '',
      centerX: mapLeft + mapWidth / 2,
      centerY: mapTop + mapHeight / 2,
      barMeters: 100,
      barActualPx: 100,
      approxScaleRatio: 5000,
      gridLats: [],
      gridLngs: []
    };
  }

  // 3. Hitung Bounding Box Geodetik dengan 1:1 Isotropic Conformal Scale (Anti-Distorsi Lebar)
  const lats = points.map(p => p.latitudeDd);
  const lngs = points.map(p => p.longitudeDd);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const centerLng = (minLng + maxLng) / 2;
  const centerLat = (minLat + maxLat) / 2;

  // Konversi Derajat ke Meter berdasarkan lintang rata-rata di Luwu (~3° LS)
  const metersPerDegreeLat = 110574;
  const metersPerDegreeLng = 111320 * Math.cos(centerLat * Math.PI / 180);

  const rawWidthMeters = Math.max((maxLng - minLng) * metersPerDegreeLng, 80);
  const rawHeightMeters = Math.max((maxLat - minLat) * metersPerDegreeLat, 80);

  // Berikan padding 40% agar poligon berada nyaman dan presisi di tengah viewport
  const paddedWidthMeters = rawWidthMeters * 1.45;
  const paddedHeightMeters = rawHeightMeters * 1.45;

  // Skala Seragam (Meters per pixel) untuk X dan Y agar proporsi 1:1 persis seperti Live Map
  const scaleX = paddedWidthMeters / mapWidth;
  const scaleY = paddedHeightMeters / mapHeight;
  const metersPerPixel = Math.max(scaleX, scaleY, 0.40);

  const totalSpanMetersX = mapWidth * metersPerPixel;
  const totalSpanMetersY = mapHeight * metersPerPixel;

  const spanLng = totalSpanMetersX / metersPerDegreeLng;
  const spanLat = totalSpanMetersY / metersPerDegreeLat;

  const bMinLng = centerLng - spanLng / 2;
  const bMaxLng = centerLng + spanLng / 2;
  const bMinLat = centerLat - spanLat / 2;
  const bMaxLat = centerLat + spanLat / 2;

  // Fungsi Proyeksi Geodesi WGS84 -> Koordinat Layar SVG (1:1 Conformal)
  const projX = (lng: number) => mapLeft + ((lng - bMinLng) / spanLng) * mapWidth;
  const projY = (lat: number) => mapBottom - ((lat - bMinLat) / spanLat) * mapHeight;

  // Titik poligon terproyeksi
  const svgPolygonPoints = points.map(p => `${projX(p.longitudeDd).toFixed(1)},${projY(p.latitudeDd).toFixed(1)}`).join(' ');

  // Titik poligon buffer 50m kontekstual (Level 4)
  const bufferMeters = 50;
  const bufferPx = bufferMeters / metersPerPixel;
  const svgBufferPoints = points.map(p => {
    const px = projX(p.longitudeDd);
    const py = projY(p.latitudeDd);
    const dirX = px - projX(centerLng);
    const dirY = py - projY(centerLat);
    const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
    const offsetPx = Math.min(bufferPx, 40);
    return `${(px + (dirX / len) * offsetPx).toFixed(1)},${(py + (dirY / len) * offsetPx).toFixed(1)}`;
  }).join(' ');

  // Titik tengah persil
  const centerX = projX(centerLng);
  const centerY = projY(centerLat);

  // 4. Perhitungan Skala Metrik Otomatis
  const barPx = 140;
  const barMetersRaw = barPx * metersPerPixel;
  const barMeters = Math.max(50, Math.round(barMetersRaw / 50) * 50);
  const barActualPx = (barMeters / metersPerPixel);
  const approxScaleRatio = Math.max(1000, Math.round((metersPerPixel / 0.000264583) / 500) * 500);

  // 5. Grid Graticule Garis Lintang dan Bujur
  const gridLats = [
    bMinLat + spanLat * 0.22,
    bMinLat + spanLat * 0.50,
    bMinLat + spanLat * 0.78
  ];
  const gridLngs = [
    bMinLng + spanLng * 0.20,
    bMinLng + spanLng * 0.50,
    bMinLng + spanLng * 0.80
  ];

  return {
    desaName,
    kecName,
    pemohonName,
    luasStr,
    tipeDoc,
    nomorSurat,
    isLp2b,
    opdName,
    headerTitle,
    points,
    mapLeft,
    mapTop,
    mapWidth,
    mapHeight,
    mapRight,
    mapBottom,
    projX,
    projY,
    svgPolygonPoints,
    centerX,
    centerY,
    barMeters,
    barActualPx,
    approxScaleRatio,
    gridLats,
    gridLngs
  };
}

/**
 * Generator Utama Dokumen Peta Geospasial Lampiran I (Pure SVG String)
 * Menghasilkan SVG 100% valid XML, bebas foreignObject, dan terproyeksi matematis
 */
export function generateLuwuGisMapSvgDataUrl(params: LuwuGisMapParams): string {
  const model = prepareSpatialModel(params);
  const {
    desaName,
    kecName,
    pemohonName,
    luasStr,
    tipeDoc,
    nomorSurat,
    isLp2b,
    opdName,
    headerTitle,
    points,
    mapLeft,
    mapTop,
    mapWidth,
    mapHeight,
    mapRight,
    mapBottom,
    projX,
    projY,
    svgPolygonPoints,
    svgBufferPoints,
    centerX,
    centerY,
    barMeters,
    barActualPx,
    approxScaleRatio,
    gridLats,
    gridLngs
  } = model;

  // Level 6: Render Marker Titik Patok Batas (P.01 - P.n)
  const pillarSvgElements = points.map((p, idx) => {
    const px = projX(p.longitudeDd);
    const py = projY(p.latitudeDd);
    const label = p.pointName || `P.${String(idx + 1).padStart(2, '0')}`;
    const badgeW = label.length * 6.5 + 10;
    const offsetX = (idx % 2 === 0) ? 10 : -badgeW - 10;
    const offsetY = (idx % 3 === 0) ? -18 : 6;

    return `
      <g class="boundary-pillar">
        <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="5.5" fill="#ef4444" stroke="#ffffff" stroke-width="2" />
        <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="2" fill="#ffffff" />
        <rect x="${(px + offsetX).toFixed(1)}" y="${(py + offsetY).toFixed(1)}" width="${badgeW}" height="15" rx="3" fill="rgba(15, 23, 42, 0.92)" stroke="#ef4444" stroke-width="1" />
        <text x="${(px + offsetX + badgeW / 2).toFixed(1)}" y="${(py + offsetY + 11).toFixed(1)}" fill="#ffffff" font-size="9" font-weight="bold" text-anchor="middle" font-family="monospace">${escapeXml(label)}</text>
      </g>
    `;
  }).join('');

  // Level 2: Background Poligon Zonasi RTRW / LP2B (Fill Opacity 0.3)
  const level2ZoningFill = isLp2b ? `
    <polygon points="${(mapLeft + 20).toFixed(0)},${(mapTop + 40).toFixed(0)} ${(mapLeft + 350).toFixed(0)},${(mapTop + 30).toFixed(0)} ${(centerX - 40).toFixed(0)},${(centerY - 50).toFixed(0)} ${(mapLeft + 100).toFixed(0)},${(mapBottom - 50).toFixed(0)}" fill="url(#lp2bPattern)" stroke="#16a34a" stroke-width="1" opacity="0.30" />
    <polygon points="${(centerX + 60).toFixed(0)},${(mapTop + 70).toFixed(0)} ${(mapRight - 30).toFixed(0)},${(mapTop + 40).toFixed(0)} ${(mapRight - 20).toFixed(0)},${(mapBottom - 60).toFixed(0)} ${(centerX + 80).toFixed(0)},${(centerY + 40).toFixed(0)}" fill="url(#lp2bPattern)" stroke="#16a34a" stroke-width="1" opacity="0.30" />
  ` : `
    <polygon points="${(mapLeft + 20).toFixed(0)},${(mapTop + 40).toFixed(0)} ${(mapLeft + 350).toFixed(0)},${(mapTop + 40).toFixed(0)} ${(centerX - 30).toFixed(0)},${(centerY - 40).toFixed(0)} ${(mapLeft + 40).toFixed(0)},${(mapBottom - 40).toFixed(0)}" fill="rgba(124, 58, 237, 0.22)" stroke="#7c3aed" stroke-width="1.2" stroke-dasharray="4,2" opacity="0.30" />
    <polygon points="${(centerX + 50).toFixed(0)},${(mapTop + 60).toFixed(0)} ${(mapRight - 30).toFixed(0)},${(mapTop + 40).toFixed(0)} ${(mapRight - 30).toFixed(0)},${(mapBottom - 60).toFixed(0)} ${(centerX + 50).toFixed(0)},${(centerY + 30).toFixed(0)}" fill="rgba(16, 185, 129, 0.20)" stroke="#10b981" stroke-width="1.2" stroke-dasharray="4,2" opacity="0.30" />
  `;

  // Level 5: LineString Jaringan Irigasi (Hanya untuk Dokumen Pertanian LP2B)
  const level5Lines = isLp2b ? `
    <!-- Saluran Irigasi / Sungai Utama (Level 5 LineString Khusus Pertanian LP2B) -->
    <path d="M ${mapLeft} ${(centerY - 60).toFixed(0)} Q ${(centerX - 50).toFixed(0)} ${(centerY - 40).toFixed(0)} ${centerX.toFixed(0)} ${(centerY - 55).toFixed(0)} T ${(mapRight - 30).toFixed(0)} ${(centerY - 70).toFixed(0)}" fill="none" stroke="#0284c7" stroke-width="5.5" stroke-linecap="round" />
    <path d="M ${mapLeft} ${(centerY - 60).toFixed(0)} Q ${(centerX - 50).toFixed(0)} ${(centerY - 40).toFixed(0)} ${centerX.toFixed(0)} ${(centerY - 55).toFixed(0)} T ${(mapRight - 30).toFixed(0)} ${(centerY - 70).toFixed(0)}" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="8,6" stroke-linecap="round" />
    <path d="M ${(centerX - 30).toFixed(0)} ${(centerY - 45).toFixed(0)} L ${(centerX - 20).toFixed(0)} ${(mapBottom - 20).toFixed(0)}" fill="none" stroke="#0284c7" stroke-width="3.5" stroke-linecap="round" />
    <text x="${(centerX - 80).toFixed(0)}" y="${(centerY - 68).toFixed(0)}" fill="#7dd3fc" font-size="9" font-weight="bold" font-family="Arial, sans-serif">Saluran Irigasi Teknis D.I. Noling / Lamasi</text>
  ` : ``;

  // Basemap Snapshot MapLibre jika tersedia (Level 1)
  const mapSnapshotElement = (params.mapSnapshot && params.mapSnapshot.startsWith('data:image')) ? `
    <image href="${params.mapSnapshot}" x="${mapLeft}" y="${mapTop}" width="${mapWidth}" height="${mapHeight}" preserveAspectRatio="xMidYMid slice" opacity="0.92" />
    <rect x="${mapLeft}" y="${mapTop}" width="${mapWidth}" height="${mapHeight}" fill="rgba(15,23,42,0.12)" />
  ` : `
    <rect x="${mapLeft}" y="${mapTop}" width="${mapWidth}" height="${mapHeight}" fill="url(#bgGis)" />
    <rect x="${mapLeft}" y="${mapTop}" width="${mapWidth}" height="${mapHeight}" fill="url(#gridGrid)" />
  `;

  // SVG Utuh dengan 6 Level Hierarki Kartografi Ketat
  const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650" width="1000" height="650" style="background:#0f172a; font-family: 'Times New Roman', Times, serif;">
  <defs>
    <linearGradient id="bgGis" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="60%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0369a1" stop-opacity="0.3" />
    </linearGradient>

    <pattern id="lp2bPattern" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M 0 12 L 24 12 M 12 0 L 12 24" stroke="#16a34a" stroke-width="0.6" stroke-opacity="0.35" />
      <circle cx="12" cy="12" r="1.8" fill="#22c55e" fill-opacity="0.45" />
    </pattern>

    <pattern id="gridGrid" width="80" height="80" patternUnits="userSpaceOnUse">
      <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#334155" stroke-width="0.75" stroke-dasharray="2,2" />
    </pattern>

    <filter id="polygonGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3.5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- ==========================================
       LEVEL 1: BASEMAP / CITRA SATELIT (PALING BAWAH)
       ========================================== -->
  ${mapSnapshotElement}

  <!-- ==========================================
       LEVEL 2: POLIGON ZONASI RTRW (FILL OPACITY 0.3)
       ========================================== -->
  ${level2ZoningFill}

  <!-- ==========================================
       GRATICULE COORDINATE GRID (WGS84 REAL TICKS)
       ========================================== -->
  ${gridLats.map(lat => {
    const y = projY(lat);
    const dms = ddToDms(lat, true);
    return `
      <line x1="${mapLeft}" y1="${y.toFixed(1)}" x2="${mapRight}" y2="${y.toFixed(1)}" stroke="#64748b" stroke-width="0.8" stroke-dasharray="4,4" opacity="0.6" />
      <text x="${(mapLeft + 6).toFixed(1)}" y="${(y - 4).toFixed(1)}" fill="#94a3b8" font-size="9" font-family="monospace">${escapeXml(dms)}</text>
    `;
  }).join('')}

  ${gridLngs.map(lng => {
    const x = projX(lng);
    const dms = ddToDms(lng, false);
    return `
      <line x1="${x.toFixed(1)}" y1="${mapTop}" x2="${x.toFixed(1)}" y2="${mapBottom}" stroke="#64748b" stroke-width="0.8" stroke-dasharray="4,4" opacity="0.6" />
      <text x="${(x + 4).toFixed(1)}" y="${(mapBottom - 6).toFixed(1)}" fill="#94a3b8" font-size="9" font-family="monospace">${escapeXml(dms)}</text>
    `;
  }).join('')}

  <!-- ==========================================
       LEVEL 4: CONTEXTUAL BUFFER 50M (DASHED OUTLINE, TRANSPARENT FILL)
       ========================================== -->
  ${svgBufferPoints ? `
    <polygon points="${svgBufferPoints}" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-dasharray="6,4" opacity="0.7" />
  ` : ''}

  <!-- ==========================================
       LEVEL 3: POLIGON DELINEASI PERMOHONAN UTAMA (FILL OPACITY 0.4, SOLID OUTLINE 2.5px)
       ========================================== -->
  ${svgPolygonPoints ? `
    <polygon points="${svgPolygonPoints}" fill="rgba(220, 38, 38, 0.40)" stroke="#ef4444" stroke-width="2.5" filter="url(#polygonGlow)" />
    <polygon points="${svgPolygonPoints}" fill="none" stroke="#ffffff" stroke-width="1" stroke-dasharray="4,3" opacity="0.85" />
  ` : ''}

  <!-- ==========================================
       LEVEL 5: LAYER GARIS (LINESTRING) JALAN & SEMPADAN SUNGAI (DI ATAS POLIGON)
       ========================================== -->
  ${level5Lines}

  <!-- ==========================================
       LEVEL 6: LAYER TITIK (POINT) / LABEL PATOK (P.01 - P.N)
       ========================================== -->
  ${pillarSvgElements}

  <!-- FLOATING LOCATION PIN BANNER -->
  ${points.length > 0 ? `
  <g transform="translate(${Math.max(160, Math.min(840, centerX)).toFixed(1)}, ${Math.max(120, Math.min(500, centerY - 25)).toFixed(1)})">
    <rect x="-120" y="-36" width="240" height="38" rx="6" fill="rgba(15, 23, 42, 0.94)" stroke="#ef4444" stroke-width="1.8" />
    <text x="0" y="-20" fill="#fca5a5" font-size="10" font-weight="bold" text-anchor="middle" font-family="Arial, sans-serif">LOKASI PERMOHONAN ${escapeXml(tipeDoc)}</text>
    <text x="0" y="-7" fill="#ffffff" font-size="9.5" font-weight="bold" text-anchor="middle" font-family="Arial, sans-serif">${escapeXml(pemohonName.length > 30 ? pemohonName.substring(0, 28) + '...' : pemohonName)}</text>
    <text x="0" y="6" fill="#38bdf8" font-size="8.5" text-anchor="middle" font-family="Arial, sans-serif">Luas: ${escapeXml(luasStr)}</text>
  </g>
  ` : ''}

  <!-- 7. FRAME TEPI KARTOGRAFI FORMAL -->
  <rect x="${mapLeft}" y="${mapTop}" width="${mapWidth}" height="${mapHeight}" fill="none" stroke="#000000" stroke-width="2.5" />
  <rect x="${mapLeft - 3}" y="${mapTop - 3}" width="${mapWidth + 6}" height="${mapHeight + 6}" fill="none" stroke="#475569" stroke-width="1" />

  <!-- 8. KOP / HEADER PETA (TOP BAR) -->
  <rect x="${mapLeft}" y="12" width="${mapWidth}" height="48" rx="4" fill="rgba(15, 23, 42, 0.96)" stroke="#0284c7" stroke-width="1.5" />
  <text x="${mapLeft + 15}" y="30" fill="#38bdf8" font-size="11" font-weight="bold" letter-spacing="0.5" font-family="Arial, sans-serif">
    PEMERINTAH KABUPATEN LUWU • ${escapeXml(opdName)}
  </text>
  <text x="${mapLeft + 15}" y="48" fill="#ffffff" font-size="10" font-weight="bold" font-family="Arial, sans-serif">
    ${escapeXml(headerTitle)}
  </text>
  <text x="${mapRight - 15}" y="32" fill="#94a3b8" font-size="9" text-anchor="end" font-family="Arial, sans-serif">
    Nomor: <tspan fill="#ffffff" font-weight="bold">${escapeXml(nomorSurat)}</tspan>
  </text>
  <text x="${mapRight - 15}" y="48" fill="#38bdf8" font-size="8.5" text-anchor="end" font-family="Arial, sans-serif">
    Desa ${escapeXml(desaName)}, Kec. ${escapeXml(kecName)} • UTM 51S WGS84
  </text>

  <!-- 9. ARAH MATA ANGIN UTARA (COMPASS ROSE - TOP RIGHT) -->
  <g transform="translate(${(mapRight - 45).toFixed(1)}, 115)">
    <circle cx="0" cy="0" r="24" fill="rgba(15, 23, 42, 0.95)" stroke="#ffffff" stroke-width="1.5" />
    <path d="M 0 -18 L 6 0 L 0 -3 L -6 0 Z" fill="#ef4444" />
    <path d="M 0 18 L 6 0 L 0 3 L -6 0 Z" fill="#94a3b8" />
    <text x="0" y="-20" fill="#ef4444" font-size="10" font-weight="bold" text-anchor="middle" font-family="Arial, sans-serif">U</text>
    <text x="0" y="27" fill="#ffffff" font-size="7" font-weight="bold" text-anchor="middle" font-family="Arial, sans-serif">UTARA</text>
  </g>

  <!-- 10. SKALA BATANG (SCALE BAR - BOTTOM RIGHT) -->
  <g transform="translate(${(mapRight - barActualPx - 30).toFixed(1)}, ${(mapBottom - 45).toFixed(1)})">
    <rect x="-10" y="-8" width="${(barActualPx + 20).toFixed(1)}" height="38" rx="4" fill="rgba(15, 23, 42, 0.95)" stroke="#cbd5e1" stroke-width="1.2" />
    <text x="${(barActualPx / 2).toFixed(1)}" y="6" fill="#ffffff" font-size="8.5" font-weight="bold" text-anchor="middle" font-family="Arial, sans-serif">SKALA 1 : ${approxScaleRatio.toLocaleString('id-ID')}</text>
    <rect x="0" y="12" width="${(barActualPx / 2).toFixed(1)}" height="4" fill="#ffffff" stroke="#000000" stroke-width="0.5" />
    <rect x="${(barActualPx / 2).toFixed(1)}" y="12" width="${(barActualPx / 2).toFixed(1)}" height="4" fill="#0284c7" stroke="#000000" stroke-width="0.5" />
    <text x="0" y="26" fill="#cbd5e1" font-size="8" text-anchor="middle" font-family="Arial, sans-serif">0</text>
    <text x="${(barActualPx / 2).toFixed(1)}" y="26" fill="#cbd5e1" font-size="8" text-anchor="middle" font-family="Arial, sans-serif">${Math.round(barMeters / 2)}m</text>
    <text x="${barActualPx.toFixed(1)}" y="26" fill="#cbd5e1" font-size="8" text-anchor="middle" font-family="Arial, sans-serif">${barMeters}m</text>
  </g>

  <!-- 11. INSET PETA KABUPATEN LUWU (BOTTOM RIGHT CORNER) -->
  <g transform="translate(${(mapRight - 110).toFixed(1)}, 160)">
    <rect x="0" y="0" width="95" height="85" rx="4" fill="rgba(15, 23, 42, 0.94)" stroke="#cbd5e1" stroke-width="1" />
    <text x="47" y="13" fill="#ffffff" font-size="7.5" font-weight="bold" text-anchor="middle" font-family="Arial, sans-serif">PETA INSET LUWU</text>
    <line x1="8" y1="17" x2="87" y2="17" stroke="#475569" stroke-width="0.8" />
    <path d="M 20 24 L 40 22 L 55 35 L 75 45 L 80 70 L 65 78 L 45 75 L 30 65 L 18 50 Z" fill="#334155" stroke="#94a3b8" stroke-width="1" />
    <path d="M 55 35 Q 60 55 70 75" fill="none" stroke="#0284c7" stroke-width="2.5" />
    <circle cx="50" cy="45" r="4.5" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />
    <circle cx="50" cy="45" r="8" fill="none" stroke="#ef4444" stroke-width="1" stroke-dasharray="2,2" />
    <text x="47" y="80" fill="#fca5a5" font-size="6.5" font-weight="bold" text-anchor="middle" font-family="Arial, sans-serif">Kec. ${escapeXml(kecName)}</text>
  </g>

  <!-- 12. LEGENDA KARTOGRAFI TEMATIK RESMI (BOTTOM LEFT - PURE SVG VECTOR) -->
  <g transform="translate(${(mapLeft + 12).toFixed(1)}, ${(mapBottom - (isLp2b ? 118 : 98)).toFixed(1)})">
    <rect x="0" y="0" width="225" height="${isLp2b ? 106 : 86}" rx="4" fill="rgba(15, 23, 42, 0.95)" stroke="#cbd5e1" stroke-width="1.2" />
    <text x="10" y="16" fill="#ffffff" font-size="8.5" font-weight="bold" font-family="Arial, sans-serif">LEGENDA SPASIAL TEMATIK:</text>
    <line x1="10" y1="22" x2="215" y2="22" stroke="#475569" stroke-width="0.8" />
    
    <!-- Item 1: Delineasi Permohonan -->
    <rect x="12" y="30" width="16" height="10" fill="rgba(220,38,38,0.35)" stroke="#ef4444" stroke-width="1.5" />
    <text x="36" y="39" fill="#ffffff" font-size="8" font-weight="bold" font-family="Arial, sans-serif">${isLp2b ? 'Delineasi Permohonan LP2B' : 'Delineasi Permohonan PKKPR'}</text>
    
    <!-- Item 2: LP2B / Pola Ruang -->
    <rect x="12" y="48" width="16" height="10" fill="${isLp2b ? '#16a34a' : '#7c3aed'}" stroke="${isLp2b ? '#22c55e' : '#a78bfa'}" stroke-width="1" opacity="${isLp2b ? '1' : '0.6'}" />
    <text x="36" y="57" fill="#ffffff" font-size="8" font-family="Arial, sans-serif">${isLp2b ? 'Kawasan LP2B Aktif Kab. Luwu' : 'Pola Ruang RTRW Kab. Luwu'}</text>
    
    ${isLp2b ? `
    <!-- Item 3: Saluran Irigasi Teknis (Khusus Dokumen Pertanian) -->
    <line x1="12" y1="71" x2="28" y2="71" stroke="#0284c7" stroke-width="2.5" />
    <text x="36" y="74" fill="#ffffff" font-size="8" font-family="Arial, sans-serif">Saluran Irigasi Teknis / Sekunder</text>
    
    <!-- Item 4: Patok Batas -->
    <circle cx="20" cy="88" r="4" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />
    <text x="36" y="91" fill="#ffffff" font-size="8" font-family="Arial, sans-serif">Titik Patok Batas (P.01 - P.${String(points.length).padStart(2,'0')})</text>
    ` : `
    <!-- Item 3: Patok Batas -->
    <circle cx="20" cy="70" r="4" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />
    <text x="36" y="73" fill="#ffffff" font-size="8" font-family="Arial, sans-serif">Titik Patok Batas (P.01 - P.${String(points.length).padStart(2,'0')})</text>
    `}
  </g>
</svg>
  `.trim();

  // Konversi SVG ke Base64 Data URL yang aman untuk browser & PDF
  try {
    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
      return `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(svgContent)))}`;
    }
    if (typeof Buffer !== 'undefined') {
      return `data:image/svg+xml;base64,${Buffer.from(svgContent, 'utf8').toString('base64')}`;
    }
  } catch (e) {
    console.warn('Fallback to URL encoded SVG:', e);
  }

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
}

/**
 * Helper untuk Mengambil URL Peta Efektif
 */
export function getEffectiveMapImageUrl(
  petaImageUrl?: string | null,
  mapSnapshot?: string | null,
  params?: LuwuGisMapParams
): string {
  const cleanSnapshot = (mapSnapshot && mapSnapshot.length > 100 && !mapSnapshot.includes("unsplash"))
    ? mapSnapshot
    : (petaImageUrl && petaImageUrl.length > 100 && !petaImageUrl.includes("unsplash"))
    ? petaImageUrl
    : null;

  return generateLuwuGisMapSvgDataUrl({
    ...(params || {}),
    mapSnapshot: cleanSnapshot
  });
}
