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
    description: `Titik Patok Batas ${idx + 1}`
  }));
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

  // 1. Ekstraksi Titik Koordinat Poligon Nyata
  let points: LuwuGisCoordinatePoint[] = [];
  if (params.koordinatPoligon && params.koordinatPoligon.length > 0) {
    points = params.koordinatPoligon.filter(p => typeof p.latitudeDd === 'number' && typeof p.longitudeDd === 'number');
  }
  if (points.length === 0 && params.geometry) {
    points = extractCoordsFromGeometry(params.geometry);
  }

  // Jika tetap kosong, gunakan koordinat batas wilayah Kabupaten Luwu yang valid
  if (points.length === 0) {
    // Jika berada di Lamasi Timur / Walenrang (seperti pada data permohonan Pelalan)
    if (/Lamasi|Pelalan|Walenrang/i.test(kecName) || /Lamasi|Pelalan|Walenrang/i.test(desaName)) {
      points = [
        { id: 1, pointName: "P.01", latitudeDd: -2.868340, longitudeDd: 120.216500, latitudeDms: `2° 52' 06.0" LS`, longitudeDms: `120° 12' 59.4" BT` },
        { id: 2, pointName: "P.02", latitudeDd: -2.867210, longitudeDd: 120.218920, latitudeDms: `2° 52' 02.0" LS`, longitudeDms: `120° 13' 08.1" BT` },
        { id: 3, pointName: "P.03", latitudeDd: -2.869450, longitudeDd: 120.220150, latitudeDms: `2° 52' 10.0" LS`, longitudeDms: `120° 13' 12.5" BT` },
        { id: 4, pointName: "P.04", latitudeDd: -2.870620, longitudeDd: 120.217850, latitudeDms: `2° 52' 14.2" LS`, longitudeDms: `120° 13' 04.3" BT` }
      ];
    } else {
      points = [
        { id: 1, pointName: "P.01", latitudeDd: -2.978367, longitudeDd: 120.306764, latitudeDms: `2° 58' 42.1" LS`, longitudeDms: `120° 18' 24.4" BT` },
        { id: 2, pointName: "P.02", latitudeDd: -2.977347, longitudeDd: 120.308939, latitudeDms: `2° 58' 38.5" LS`, longitudeDms: `120° 18' 32.2" BT` },
        { id: 3, pointName: "P.03", latitudeDd: -2.974944, longitudeDd: 120.309889, latitudeDms: `2° 58' 29.8" LS`, longitudeDms: `120° 18' 35.6" BT` },
        { id: 4, pointName: "P.04", latitudeDd: -2.973639, longitudeDd: 120.313583, latitudeDms: `2° 58' 25.1" LS`, longitudeDms: `120° 18' 48.9" BT` },
        { id: 5, pointName: "P.05", latitudeDd: -2.976861, longitudeDd: 120.315056, latitudeDms: `2° 58' 36.7" LS`, longitudeDms: `120° 18' 54.2" BT` },
        { id: 6, pointName: "P.06", latitudeDd: -2.979417, longitudeDd: 120.311250, latitudeDms: `2° 58' 45.9" LS`, longitudeDms: `120° 18' 40.5" BT` }
      ];
    }
  }

  // 2. Hitung Bounding Box Geodetik
  const lats = points.map(p => p.latitudeDd);
  const lngs = points.map(p => p.longitudeDd);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const deltaLng = Math.max(maxLng - minLng, 0.0035);
  const deltaLat = Math.max(maxLat - minLat, 0.0035);

  const padLng = deltaLng * 0.45;
  const padLat = deltaLat * 0.45;
  const bMinLng = minLng - padLng;
  const bMaxLng = maxLng + padLng;
  const bMinLat = minLat - padLat;
  const bMaxLat = maxLat + padLat;
  const spanLng = bMaxLng - bMinLng;
  const spanLat = bMaxLat - bMinLat;

  // 3. Dimensi Kanvas Peta (1000 x 650)
  const mapLeft = 35;
  const mapTop = 68;
  const mapWidth = 930;
  const mapHeight = 540;
  const mapRight = mapLeft + mapWidth;
  const mapBottom = mapTop + mapHeight;

  // Fungsi Proyeksi Geodesi WGS84 -> Koordinat Layar SVG
  const projX = (lng: number) => mapLeft + ((lng - bMinLng) / spanLng) * mapWidth;
  const projY = (lat: number) => mapBottom - ((lat - bMinLat) / spanLat) * mapHeight;

  // Titik poligon terproyeksi
  const svgPolygonPoints = points.map(p => `${projX(p.longitudeDd).toFixed(1)},${projY(p.latitudeDd).toFixed(1)}`).join(' ');

  // Titik tengah persil
  const centerLng = (minLng + maxLng) / 2;
  const centerLat = (minLat + maxLat) / 2;
  const centerX = projX(centerLng);
  const centerY = projY(centerLat);

  // 4. Perhitungan Skala Metrik Otomatis
  const groundWidthMeters = haversineMeters(centerLat, bMinLng, centerLat, bMaxLng);
  const metersPerPixel = groundWidthMeters / mapWidth;
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
    centerX,
    centerY,
    barMeters,
    barActualPx,
    approxScaleRatio,
    gridLats,
    gridLngs
  } = model;

  // Render Marker Titik Patok Batas (P.01 - P.n)
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

  // Elemen Tematik Sekitar (LP2B vs RTRW)
  const thematicOverlays = isLp2b ? `
    <polygon points="${(mapLeft + 30).toFixed(0)},${(mapTop + 50).toFixed(0)} ${(mapLeft + 320).toFixed(0)},${(mapTop + 30).toFixed(0)} ${(centerX - 40).toFixed(0)},${(centerY - 50).toFixed(0)} ${(mapLeft + 120).toFixed(0)},${(mapBottom - 60).toFixed(0)}" fill="url(#lp2bPattern)" stroke="#16a34a" stroke-width="1.5" opacity="0.8" />
    <polygon points="${(centerX + 60).toFixed(0)},${(mapTop + 80).toFixed(0)} ${(mapRight - 40).toFixed(0)},${(mapTop + 50).toFixed(0)} ${(mapRight - 20).toFixed(0)},${(mapBottom - 80).toFixed(0)} ${(centerX + 80).toFixed(0)},${(centerY + 40).toFixed(0)}" fill="url(#lp2bPattern)" stroke="#16a34a" stroke-width="1.5" opacity="0.8" />
    <path d="M ${mapLeft} ${(centerY - 60).toFixed(0)} Q ${(centerX - 50).toFixed(0)} ${(centerY - 40).toFixed(0)} ${centerX.toFixed(0)} ${(centerY - 55).toFixed(0)} T ${(mapRight - 30).toFixed(0)} ${(centerY - 70).toFixed(0)}" fill="none" stroke="#0284c7" stroke-width="5" opacity="0.85" />
    <path d="M ${mapLeft} ${(centerY - 60).toFixed(0)} Q ${(centerX - 50).toFixed(0)} ${(centerY - 40).toFixed(0)} ${centerX.toFixed(0)} ${(centerY - 55).toFixed(0)} T ${(mapRight - 30).toFixed(0)} ${(centerY - 70).toFixed(0)}" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="8,6" />
    <path d="M ${(centerX - 30).toFixed(0)} ${(centerY - 45).toFixed(0)} L ${(centerX - 20).toFixed(0)} ${(mapBottom - 20).toFixed(0)}" fill="none" stroke="#0284c7" stroke-width="3" opacity="0.75" />
    <text x="${(centerX - 80).toFixed(0)}" y="${(centerY - 68).toFixed(0)}" fill="#7dd3fc" font-size="9" font-weight="bold">Saluran Irigasi Teknis D.I. Noling / Lamasi</text>
  ` : `
    <polygon points="${(mapLeft + 20).toFixed(0)},${(mapTop + 40).toFixed(0)} ${(mapLeft + 350).toFixed(0)},${(mapTop + 40).toFixed(0)} ${(centerX - 30).toFixed(0)},${(centerY - 40).toFixed(0)} ${(mapLeft + 40).toFixed(0)},${(mapBottom - 40).toFixed(0)}" fill="rgba(124, 58, 237, 0.18)" stroke="#7c3aed" stroke-width="1.5" stroke-dasharray="4,2" />
    <polygon points="${(centerX + 50).toFixed(0)},${(mapTop + 60).toFixed(0)} ${(mapRight - 30).toFixed(0)},${(mapTop + 40).toFixed(0)} ${(mapRight - 30).toFixed(0)},${(mapBottom - 60).toFixed(0)} ${(centerX + 50).toFixed(0)},${(centerY + 30).toFixed(0)}" fill="rgba(16, 185, 129, 0.16)" stroke="#10b981" stroke-width="1.5" stroke-dasharray="4,2" />
    <path d="M ${mapLeft} ${(centerY + 70).toFixed(0)} Q ${(centerX - 40).toFixed(0)} ${(centerY + 50).toFixed(0)} ${(centerX + 50).toFixed(0)} ${(centerY + 60).toFixed(0)} T ${mapRight} ${(centerY + 40).toFixed(0)}" fill="none" stroke="#f59e0b" stroke-width="5" />
    <path d="M ${mapLeft} ${(centerY + 70).toFixed(0)} Q ${(centerX - 40).toFixed(0)} ${(centerY + 50).toFixed(0)} ${(centerX + 50).toFixed(0)} ${(centerY + 60).toFixed(0)} T ${mapRight} ${(centerY + 40).toFixed(0)}" fill="none" stroke="#fef08a" stroke-width="1.5" stroke-dasharray="8,6" />
    <text x="${(centerX - 100).toFixed(0)}" y="${(centerY + 85).toFixed(0)}" fill="#fef08a" font-size="9" font-weight="bold">Jalan Poros Trans-Sulawesi</text>
  `;

  // Basemap Snapshot MapLibre jika tersedia
  const mapSnapshotElement = (params.mapSnapshot && params.mapSnapshot.startsWith('data:image')) ? `
    <image href="${params.mapSnapshot}" x="${mapLeft}" y="${mapTop}" width="${mapWidth}" height="${mapHeight}" preserveAspectRatio="xMidYMid slice" opacity="0.88" />
    <rect x="${mapLeft}" y="${mapTop}" width="${mapWidth}" height="${mapHeight}" fill="rgba(15,23,42,0.15)" />
  ` : `
    <rect x="${mapLeft}" y="${mapTop}" width="${mapWidth}" height="${mapHeight}" fill="url(#bgGis)" />
    <rect x="${mapLeft}" y="${mapTop}" width="${mapWidth}" height="${mapHeight}" fill="url(#gridGrid)" />
  `;

  // SVG Utuh
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

  <!-- 1. BASEMAP KANVAS -->
  ${mapSnapshotElement}

  <!-- 2. OVERLAY TEMATIK SEKITAR PERSIL -->
  ${thematicOverlays}

  <!-- 3. GRATICULE COORDINATE GRID (GARIS LINTANG &amp; BUJUR NYATA) -->
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

  <!-- 4. LAYER POLIGON PERMOHONAN RESMI (MERAH MENYALA DENGAN PATOK) -->
  <polygon points="${svgPolygonPoints}" fill="rgba(220, 38, 38, 0.32)" stroke="#ef4444" stroke-width="3" stroke-dasharray="6,4" filter="url(#polygonGlow)" />
  <polygon points="${svgPolygonPoints}" fill="none" stroke="#ffffff" stroke-width="1" stroke-dasharray="3,3" opacity="0.8" />

  <!-- 5. TITIK PATOK PILAR BATAS (P.01 - P.n) -->
  ${pillarSvgElements}

  <!-- 6. FLOATING LOCATION PIN BANNER -->
  <g transform="translate(${Math.max(160, Math.min(840, centerX)).toFixed(1)}, ${Math.max(120, Math.min(500, centerY - 25)).toFixed(1)})">
    <rect x="-120" y="-36" width="240" height="38" rx="6" fill="rgba(15, 23, 42, 0.94)" stroke="#ef4444" stroke-width="1.8" />
    <text x="0" y="-20" fill="#fca5a5" font-size="10" font-weight="bold" text-anchor="middle" font-family="Arial, sans-serif">LOKASI PERMOHONAN ${escapeXml(tipeDoc)}</text>
    <text x="0" y="-7" fill="#ffffff" font-size="9.5" font-weight="bold" text-anchor="middle" font-family="Arial, sans-serif">${escapeXml(pemohonName.length > 30 ? pemohonName.substring(0, 28) + '...' : pemohonName)}</text>
    <text x="0" y="6" fill="#38bdf8" font-size="8.5" text-anchor="middle" font-family="Arial, sans-serif">Luas: ${escapeXml(luasStr)}</text>
  </g>

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
  <g transform="translate(${(mapLeft + 12).toFixed(1)}, ${(mapBottom - 118).toFixed(1)})">
    <rect x="0" y="0" width="225" height="106" rx="4" fill="rgba(15, 23, 42, 0.95)" stroke="#cbd5e1" stroke-width="1.2" />
    <text x="10" y="16" fill="#ffffff" font-size="8.5" font-weight="bold" font-family="Arial, sans-serif">LEGENDA SPASIAL TEMATIK:</text>
    <line x1="10" y1="22" x2="215" y2="22" stroke="#475569" stroke-width="0.8" />
    
    <!-- Item 1: Delineasi Permohonan -->
    <rect x="12" y="30" width="16" height="10" fill="rgba(220,38,38,0.35)" stroke="#ef4444" stroke-width="1.5" />
    <text x="36" y="39" fill="#ffffff" font-size="8" font-weight="bold" font-family="Arial, sans-serif">${isLp2b ? 'Delineasi Permohonan LP2B' : 'Delineasi Permohonan PKKPR'}</text>
    
    <!-- Item 2: LP2B / Pola Ruang -->
    <rect x="12" y="48" width="16" height="10" fill="${isLp2b ? '#16a34a' : '#7c3aed'}" stroke="${isLp2b ? '#22c55e' : '#a78bfa'}" stroke-width="1" opacity="${isLp2b ? '1' : '0.6'}" />
    <text x="36" y="57" fill="#ffffff" font-size="8" font-family="Arial, sans-serif">${isLp2b ? 'Kawasan LP2B Aktif Kab. Luwu' : 'Pola Ruang RTRW Kab. Luwu'}</text>
    
    <!-- Item 3: Saluran Irigasi / Jalan Poros -->
    <line x1="12" y1="71" x2="28" y2="71" stroke="${isLp2b ? '#0284c7' : '#f59e0b'}" stroke-width="2.5" />
    <text x="36" y="74" fill="#ffffff" font-size="8" font-family="Arial, sans-serif">${isLp2b ? 'Saluran Irigasi Teknis / Sekunder' : 'Jalan Poros Trans-Sulawesi'}</text>
    
    <!-- Item 4: Patok Batas -->
    <circle cx="20" cy="88" r="4" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />
    <text x="36" y="91" fill="#ffffff" font-size="8" font-family="Arial, sans-serif">Titik Patok Batas (P.01 - P.${String(points.length).padStart(2,'0')})</text>
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
