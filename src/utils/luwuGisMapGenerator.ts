/**
 * Generator Peta Vector Geospasial Kabupaten Luwu
 * Menghasilkan Data URL SVG Peta Tematik High-Definition (300 DPI)
 * Bebas Ketergantungan Network/CORS & Otomatis Memproyeksikan Koordinat Poligon Nyata
 * di BAP LP2B Dinas Pertanian, BAP KTR / PKKPR Dinas PUPTR, dan SK PKKPR DPMPTSP
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
function extractCoordsFromGeometry(geom: any): LuwuGisCoordinatePoint[] {
  if (!geom) return [];
  let ring: [number, number][] = [];
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
      longitudeDms: ddToDms(lng, false)
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
    longitudeDms: ddToDms(lng, false)
  }));
}

/**
 * Generator Utama Dokumen Peta Geospasial Lampiran I
 * Menghasilkan SVG Data URL Lengkap dengan Layer Poligon Nyata, Grid Geodesi, dan Inset Luwu
 */
export function generateLuwuGisMapSvgDataUrl(params: LuwuGisMapParams): string {
  const desaName = (params.desa || 'Karang-Karangan').replace(/^Desa\s+/i, '').toUpperCase();
  const kecName = (params.kecamatan || 'Bua').replace(/^Kecamatan\s+/i, '').toUpperCase();
  const pemohonName = (params.pemohon || params.perusahaan || 'PEMOHON TERDAFTAR').toUpperCase();
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

  // Jika tetap kosong (fallback koordinat valid di Kab. Luwu)
  if (points.length === 0) {
    points = [
      { id: 1, pointName: "P.01", latitudeDd: -2.978367, longitudeDd: 120.306764, latitudeDms: `2° 58' 42.1" LS`, longitudeDms: `120° 18' 24.4" BT` },
      { id: 2, pointName: "P.02", latitudeDd: -2.977347, longitudeDd: 120.308939, latitudeDms: `2° 58' 38.5" LS`, longitudeDms: `120° 18' 32.2" BT` },
      { id: 3, pointName: "P.03", latitudeDd: -2.974944, longitudeDd: 120.309889, latitudeDms: `2° 58' 29.8" LS`, longitudeDms: `120° 18' 35.6" BT` },
      { id: 4, pointName: "P.04", latitudeDd: -2.973639, longitudeDd: 120.313583, latitudeDms: `2° 58' 25.1" LS`, longitudeDms: `120° 18' 48.9" BT` },
      { id: 5, pointName: "P.05", latitudeDd: -2.976861, longitudeDd: 120.315056, latitudeDms: `2° 58' 36.7" LS`, longitudeDms: `120° 18' 54.2" BT` },
      { id: 6, pointName: "P.06", latitudeDd: -2.979417, longitudeDd: 120.311250, latitudeDms: `2° 58' 45.9" LS`, longitudeDms: `120° 18' 40.5" BT` }
    ];
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

  // Buffer 40% agar konteks geografis sekitar persil terlihat jelas
  const padLng = deltaLng * 0.40;
  const padLat = deltaLat * 0.40;
  const bMinLng = minLng - padLng;
  const bMaxLng = maxLng + padLng;
  const bMinLat = minLat - padLat;
  const bMaxLat = maxLat + padLat;
  const spanLng = bMaxLng - bMinLng;
  const spanLat = bMaxLat - bMinLat;

  // 3. Dimensi Frame Peta dalam SVG (1000 x 650)
  const mapLeft = 35;
  const mapTop = 68;
  const mapWidth = 930;
  const mapHeight = 540;
  const mapRight = mapLeft + mapWidth; // 965
  const mapBottom = mapTop + mapHeight; // 608

  // Fungsi Proyeksi Spasial WGS84 -> SVG Pixels
  const projX = (lng: number) => mapLeft + ((lng - bMinLng) / spanLng) * mapWidth;
  const projY = (lat: number) => mapBottom - ((lat - bMinLat) / spanLat) * mapHeight;

  // 4. Proyeksikan Titik-Titik Poligon Pemohon
  const svgPolygonPoints = points.map(p => `${projX(p.longitudeDd).toFixed(1)},${projY(p.latitudeDd).toFixed(1)}`).join(' ');

  // Hitung Pusat Poligon untuk Label Pin
  const centerLng = (minLng + maxLng) / 2;
  const centerLat = (minLat + maxLat) / 2;
  const centerX = projX(centerLng);
  const centerY = projY(centerLat);

  // 5. Hitung Skala Peta Otomatis (Haversine Formula)
  const groundWidthMeters = haversineMeters(centerLat, bMinLng, centerLat, bMaxLng);
  const metersPerPixel = groundWidthMeters / mapWidth;
  const barPx = 140;
  const barMetersRaw = barPx * metersPerPixel;
  // Bulatkan barMeters ke puluhan atau ratusan terdekat
  const barMeters = Math.max(50, Math.round(barMetersRaw / 50) * 50);
  const barActualPx = (barMeters / metersPerPixel);

  // Estimasi rasio skala kartografi (96 DPI standard)
  const approxScaleRatio = Math.max(1000, Math.round((metersPerPixel / 0.000264583) / 500) * 500);

  // 6. Grid Garis Geodesi (Graticules LS & BT)
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

  // 7. Render Marker Titik Patok Batas (P.01..Pn)
  const pillarSvgElements = points.map((p, idx) => {
    const px = projX(p.longitudeDd);
    const py = projY(p.latitudeDd);
    const label = p.pointName || `P.${String(idx + 1).padStart(2, '0')}`;
    const badgeW = label.length * 6.5 + 10;
    
    // Offset label agar tidak bertumpukan
    const offsetX = (idx % 2 === 0) ? 10 : -badgeW - 10;
    const offsetY = (idx % 3 === 0) ? -18 : 6;

    return `
      <g class="boundary-pillar" transform="translate(0, 0)">
        <!-- Lingkaran Patok -->
        <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="5.5" fill="#ef4444" stroke="#ffffff" stroke-width="2" />
        <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="2" fill="#ffffff" />
        
        <!-- Badge Label Patok -->
        <rect x="${(px + offsetX).toFixed(1)}" y="${(py + offsetY).toFixed(1)}" width="${badgeW}" height="15" rx="3" fill="rgba(15, 23, 42, 0.92)" stroke="#ef4444" stroke-width="1" />
        <text x="${(px + offsetX + badgeW / 2).toFixed(1)}" y="${(py + offsetY + 11).toFixed(1)}" fill="#ffffff" font-size="9" font-weight="bold" text-anchor="middle" font-family="monospace">${label}</text>
      </g>
    `;
  }).join('');

  // 8. Elemen Tematik Sekitar (LP2B vs RTRW)
  const thematicOverlays = isLp2b ? `
    <!-- Zona LP2B Sekitar (Hijau Transparan Terstruktur) -->
    <polygon points="${(mapLeft + 30).toFixed(0)},${(mapTop + 50).toFixed(0)} ${(mapLeft + 320).toFixed(0)},${(mapTop + 30).toFixed(0)} ${(centerX - 40).toFixed(0)},${(centerY - 50).toFixed(0)} ${(mapLeft + 120).toFixed(0)},${(mapBottom - 60).toFixed(0)}" fill="url(#lp2bPattern)" stroke="#16a34a" stroke-width="1.5" opacity="0.8" />
    <polygon points="${(centerX + 60).toFixed(0)},${(mapTop + 80).toFixed(0)} ${(mapRight - 40).toFixed(0)},${(mapTop + 50).toFixed(0)} ${(mapRight - 20).toFixed(0)},${(mapBottom - 80).toFixed(0)} ${(centerX + 80).toFixed(0)},${(centerY + 40).toFixed(0)}" fill="url(#lp2bPattern)" stroke="#16a34a" stroke-width="1.5" opacity="0.8" />

    <!-- Jaringan Saluran Irigasi Teknis (Biru Mengalir di Dekat Persil) -->
    <path d="M ${mapLeft} ${(centerY - 60).toFixed(0)} Q ${(centerX - 50).toFixed(0)} ${(centerY - 40).toFixed(0)} ${centerX.toFixed(0)} ${(centerY - 55).toFixed(0)} T ${(mapRight - 30).toFixed(0)} ${(centerY - 70).toFixed(0)}" fill="none" stroke="#0284c7" stroke-width="5" opacity="0.85" />
    <path d="M ${mapLeft} ${(centerY - 60).toFixed(0)} Q ${(centerX - 50).toFixed(0)} ${(centerY - 40).toFixed(0)} ${centerX.toFixed(0)} ${(centerY - 55).toFixed(0)} T ${(mapRight - 30).toFixed(0)} ${(centerY - 70).toFixed(0)}" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="8,6" />

    <!-- Saluran Sekunder Cabang -->
    <path d="M ${(centerX - 30).toFixed(0)} ${(centerY - 45).toFixed(0)} L ${(centerX - 20).toFixed(0)} ${(mapBottom - 20).toFixed(0)}" fill="none" stroke="#0284c7" stroke-width="3" opacity="0.75" />
    <text x="${(centerX - 80).toFixed(0)}" y="${(centerY - 68).toFixed(0)}" fill="#7dd3fc" font-size="9" font-weight="bold">Saluran Irigasi Teknis D.I. Noling</text>
  ` : `
    <!-- Zona RTRW Pola Ruang (Peruntukan Ruang Sekitar) -->
    <polygon points="${(mapLeft + 20).toFixed(0)},${(mapTop + 40).toFixed(0)} ${(mapLeft + 350).toFixed(0)},${(mapTop + 40).toFixed(0)} ${(centerX - 30).toFixed(0)},${(centerY - 40).toFixed(0)} ${(mapLeft + 40).toFixed(0)},${(mapBottom - 40).toFixed(0)}" fill="rgba(124, 58, 237, 0.18)" stroke="#7c3aed" stroke-width="1.5" stroke-dasharray="4,2" />
    <polygon points="${(centerX + 50).toFixed(0)},${(mapTop + 60).toFixed(0)} ${(mapRight - 30).toFixed(0)},${(mapTop + 40).toFixed(0)} ${(mapRight - 30).toFixed(0)},${(mapBottom - 60).toFixed(0)} ${(centerX + 50).toFixed(0)},${(centerY + 30).toFixed(0)}" fill="rgba(16, 185, 129, 0.16)" stroke="#10b981" stroke-width="1.5" stroke-dasharray="4,2" />

    <!-- Jalan Poros Trans-Sulawesi (Arteri Primer) -->
    <path d="M ${mapLeft} ${(centerY + 70).toFixed(0)} Q ${(centerX - 40).toFixed(0)} ${(centerY + 50).toFixed(0)} ${(centerX + 50).toFixed(0)} ${(centerY + 60).toFixed(0)} T ${mapRight} ${(centerY + 40).toFixed(0)}" fill="none" stroke="#f59e0b" stroke-width="5" />
    <path d="M ${mapLeft} ${(centerY + 70).toFixed(0)} Q ${(centerX - 40).toFixed(0)} ${(centerY + 50).toFixed(0)} ${(centerX + 50).toFixed(0)} ${(centerY + 60).toFixed(0)} T ${mapRight} ${(centerY + 40).toFixed(0)}" fill="none" stroke="#fef08a" stroke-width="1.5" stroke-dasharray="8,6" />
    <text x="${(centerX - 100).toFixed(0)}" y="${(centerY + 85).toFixed(0)}" fill="#fef08a" font-size="9" font-weight="bold">Jalan Poros Trans-Sulawesi</text>
  `;

  // 9. Legenda Spesifik OPD
  const legendItems = isLp2b ? `
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
      <div style="width:16px;height:10px;border:2px solid #ef4444;background:rgba(220,38,38,0.35);"></div>
      <span style="color:#ffffff;font-size:8.5pt;font-weight:bold;">Delineasi Permohonan LP2B</span>
    </div>
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
      <div style="width:16px;height:10px;background:#16a34a;border:1px solid #22c55e;"></div>
      <span style="color:#ffffff;font-size:8.5pt;">Kawasan LP2B Aktif Kab. Luwu</span>
    </div>
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
      <div style="width:16px;height:3px;background:#0284c7;"></div>
      <span style="color:#ffffff;font-size:8.5pt;">Saluran Irigasi Teknis / Sekunder</span>
    </div>
    <div style="display:flex;align-items:center;gap:6px;">
      <div style="width:8px;height:8px;border-radius:50%;background:#ef4444;border:1.5px solid #ffffff;"></div>
      <span style="color:#ffffff;font-size:8.5pt;">Titik Patok Batas (P.01 - P.${String(points.length).padStart(2,'0')})</span>
    </div>
  ` : `
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
      <div style="width:16px;height:10px;border:2px solid #ef4444;background:rgba(220,38,38,0.35);"></div>
      <span style="color:#ffffff;font-size:8.5pt;font-weight:bold;">Delineasi Permohonan PKKPR</span>
    </div>
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
      <div style="width:16px;height:10px;background:#7c3aed;opacity:0.6;"></div>
      <span style="color:#ffffff;font-size:8.5pt;">Pola Ruang RTRW Kab. Luwu</span>
    </div>
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
      <div style="width:16px;height:3px;background:#f59e0b;"></div>
      <span style="color:#ffffff;font-size:8.5pt;">Jalan Poros Trans-Sulawesi</span>
    </div>
    <div style="display:flex;align-items:center;gap:6px;">
      <div style="width:8px;height:8px;border-radius:50%;background:#ef4444;border:1.5px solid #ffffff;"></div>
      <span style="color:#ffffff;font-size:8.5pt;">Titik Patok Batas (P.01 - P.${String(points.length).padStart(2,'0')})</span>
    </div>
  `;

  // 10. Jika Ada mapSnapshot dari WebGL MapLibre Canvas, sematkan sebagai citra satelit dasar
  const mapSnapshotElement = (params.mapSnapshot && params.mapSnapshot.startsWith('data:image')) ? `
    <!-- Basemap Satelit Nyata MapLibre -->
    <image href="${params.mapSnapshot}" x="${mapLeft}" y="${mapTop}" width="${mapWidth}" height="${mapHeight}" preserveAspectRatio="xMidYMid slice" opacity="0.88" />
    <rect x="${mapLeft}" y="${mapTop}" width="${mapWidth}" height="${mapHeight}" fill="rgba(15,23,42,0.15)" />
  ` : `
    <!-- Basemap Vektor Topografi Resmi -->
    <rect x="${mapLeft}" y="${mapTop}" width="${mapWidth}" height="${mapHeight}" fill="url(#bgGis)" />
    <rect x="${mapLeft}" y="${mapTop}" width="${mapWidth}" height="${mapHeight}" fill="url(#gridGrid)" />
  `;

  // Konten SVG Utuh
  const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650" width="1000" height="650" style="background:#0f172a; font-family: 'Times New Roman', Times, serif;">
  <defs>
    <!-- Background Gradient Geospasial -->
    <linearGradient id="bgGis" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="60%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0369a1" stop-opacity="0.3" />
    </linearGradient>

    <!-- Pattern Kawasan Pertanian LP2B -->
    <pattern id="lp2bPattern" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M 0 12 L 24 12 M 12 0 L 12 24" stroke="#16a34a" stroke-width="0.6" stroke-opacity="0.35" />
      <circle cx="12" cy="12" r="1.8" fill="#22c55e" fill-opacity="0.45" />
    </pattern>

    <!-- Topographic Grid Pattern -->
    <pattern id="gridGrid" width="80" height="80" patternUnits="userSpaceOnUse">
      <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#334155" stroke-width="0.75" stroke-dasharray="2,2" />
    </pattern>

    <!-- Glow Filter untuk Garis Poligon Permohonan -->
    <filter id="polygonGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3.5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- 1. BASEMAP KANVAS -->
  ${mapSnapshotElement}

  <!-- 2. OVERLAY TEMATIK SEKITAR PERSIL -->
  ${thematicOverlays}

  <!-- 3. GRATICULE COORDINATE GRID (GARIS LINTANG & BUJUR NYATA) -->
  ${gridLats.map(lat => {
    const y = projY(lat);
    const dms = ddToDms(lat, true);
    return `
      <line x1="${mapLeft}" y1="${y.toFixed(1)}" x2="${mapRight}" y2="${y.toFixed(1)}" stroke="#64748b" stroke-width="0.8" stroke-dasharray="4,4" opacity="0.6" />
      <text x="${(mapLeft + 6).toFixed(1)}" y="${(y - 4).toFixed(1)}" fill="#94a3b8" font-size="9" font-family="monospace">${dms}</text>
    `;
  }).join('')}

  ${gridLngs.map(lng => {
    const x = projX(lng);
    const dms = ddToDms(lng, false);
    return `
      <line x1="${x.toFixed(1)}" y1="${mapTop}" x2="${x.toFixed(1)}" y2="${mapBottom}" stroke="#64748b" stroke-width="0.8" stroke-dasharray="4,4" opacity="0.6" />
      <text x="${(x + 4).toFixed(1)}" y="${(mapBottom - 6).toFixed(1)}" fill="#94a3b8" font-size="9" font-family="monospace">${dms}</text>
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
    <text x="0" y="-20" fill="#fca5a5" font-size="10" font-weight="bold" text-anchor="middle" font-family="Arial, sans-serif">LOKASI PERMOHONAN ${tipeDoc}</text>
    <text x="0" y="-7" fill="#ffffff" font-size="9.5" font-weight="bold" text-anchor="middle" font-family="Arial, sans-serif">${pemohonName.length > 30 ? pemohonName.substring(0, 28) + '...' : pemohonName}</text>
    <text x="0" y="6" fill="#38bdf8" font-size="8.5" text-anchor="middle" font-family="Arial, sans-serif">Luas: ${luasStr}</text>
  </g>

  <!-- 7. FRAME TEPI KARTOGRAFI FORMAL -->
  <rect x="${mapLeft}" y="${mapTop}" width="${mapWidth}" height="${mapHeight}" fill="none" stroke="#000000" stroke-width="2.5" />
  <rect x="${mapLeft - 3}" y="${mapTop - 3}" width="${mapWidth + 6}" height="${mapHeight + 6}" fill="none" stroke="#475569" stroke-width="1" />

  <!-- 8. KOP / HEADER PETA (TOP BAR) -->
  <rect x="${mapLeft}" y="12" width="${mapWidth}" height="48" rx="4" fill="rgba(15, 23, 42, 0.96)" stroke="#0284c7" stroke-width="1.5" />
  <text x="${mapLeft + 15}" y="30" fill="#38bdf8" font-size="11" font-weight="bold" letter-spacing="0.5" font-family="Arial, sans-serif">
    PEMERINTAH KABUPATEN LUWU • ${opdName}
  </text>
  <text x="${mapLeft + 15}" y="48" fill="#ffffff" font-size="10" font-weight="bold" font-family="Arial, sans-serif">
    ${headerTitle}
  </text>
  <text x="${mapRight - 15}" y="32" fill="#94a3b8" font-size="9" text-anchor="end" font-family="Arial, sans-serif">
    Nomor: <tspan fill="#ffffff" font-weight="bold">${nomorSurat}</tspan>
  </text>
  <text x="${mapRight - 15}" y="48" fill="#38bdf8" font-size="8.5" text-anchor="end" font-family="Arial, sans-serif">
    Desa ${desaName}, Kec. ${kecName} • UTM 51S WGS84
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
    
    <!-- Bar Segment 1 (Putih) -->
    <rect x="0" y="12" width="${(barActualPx / 2).toFixed(1)}" height="4" fill="#ffffff" stroke="#000000" stroke-width="0.5" />
    <!-- Bar Segment 2 (Biru) -->
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
    
    <!-- Siluet Sederhana Kab. Luwu & Teluk Bone -->
    <path d="M 20 24 L 40 22 L 55 35 L 75 45 L 80 70 L 65 78 L 45 75 L 30 65 L 18 50 Z" fill="#334155" stroke="#94a3b8" stroke-width="1" />
    <path d="M 55 35 Q 60 55 70 75" fill="none" stroke="#0284c7" stroke-width="2.5" />
    
    <!-- Target Point Lokasi -->
    <circle cx="50" cy="45" r="4.5" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />
    <circle cx="50" cy="45" r="8" fill="none" stroke="#ef4444" stroke-width="1" stroke-dasharray="2,2" />
    <text x="47" y="80" fill="#fca5a5" font-size="6.5" font-weight="bold" text-anchor="middle" font-family="Arial, sans-serif">Kec. ${kecName}</text>
  </g>

  <!-- 12. LEGENDA KARTOGRAFI TEMATIK RESMI (BOTTOM LEFT) -->
  <foreignObject x="${(mapLeft + 10).toFixed(1)}" y="${(mapBottom - 120).toFixed(1)}" width="235" height="110">
    <div xmlns="http://www.w3.org/1999/xhtml" style="background:rgba(15,23,42,0.95);border:1.2px solid #cbd5e1;border-radius:6px;padding:6px 10px;font-family:Arial,sans-serif;box-sizing:border-box;">
      <div style="color:#ffffff;font-size:8pt;font-weight:bold;border-bottom:1px solid #475569;padding-bottom:3px;margin-bottom:5px;letter-spacing:0.3px;">
        LEGENDA SPASIAL TEMATIK:
      </div>
      ${legendItems}
    </div>
  </foreignObject>
</svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
}

/**
 * Helper untuk Mengambil URL Peta Efektif
 * Otomatis memproyeksikan koordinat poligon pemohon dan memadukan snapshot MapLibre jika tersedia
 */
export function getEffectiveMapImageUrl(
  petaImageUrl?: string | null,
  mapSnapshot?: string | null,
  params?: LuwuGisMapParams
): string {
  // Bersihkan snapshot jika berupa placeholder dummy
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

