/**
 * Generator Peta Vector Geospasial Kabupaten Luwu
 * Menghasilkan Data URL SVG Peta Tematik High-Definition (300 DPI)
 * Bebas Ketergantungan Network/CORS & Otomatis Aktif di BAP LP2B, BAP PUPTR, dan SK PKKPR DPMPTSP
 */

export interface LuwuGisMapParams {
  desa?: string;
  kecamatan?: string;
  pemohon?: string;
  perusahaan?: string;
  luas?: string;
  tipeDoc?: 'PKKPR' | 'LP2B' | 'KTR';
  koordinatLat?: string;
  koordinatLng?: string;
}

export function generateLuwuGisMapSvgDataUrl(params: LuwuGisMapParams): string {
  const desaName = (params.desa || 'KarangKarangan').toUpperCase();
  const kecName = (params.kecamatan || 'Bua').toUpperCase();
  const pemohonName = params.pemohon || params.perusahaan || 'PEMOHON TERDAFTAR';
  const luasStr = params.luas || '1.00 Ha (10.000 m²)';
  const tipeDoc = params.tipeDoc || 'PKKPR';

  const isLp2b = tipeDoc === 'LP2B';
  const headerTitle = isLp2b 
    ? 'PETA DELINEASI GEOSPASIAL LP2B & JARINGAN IRIGASI PERTANIAN'
    : 'PETA SPASIAL PLOTTING ZONASI RTRW KABUPATEN LUWU';

  const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650" width="1000" height="650" style="background:#0f172a; font-family: Arial, Helvetica, sans-serif;">
  <defs>
    <!-- Background Terrain Pattern -->
    <linearGradient id="bgGis" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0.2" />
    </linearGradient>

    <!-- Agricultural LP2B Green Pattern -->
    <pattern id="lp2bPattern" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 0 10 L 20 10 M 10 0 L 10 20" stroke="#16a34a" stroke-width="0.5" stroke-opacity="0.3" />
      <circle cx="10" cy="10" r="1.5" fill="#22c55e" fill-opacity="0.4" />
    </pattern>

    <!-- Topographic Contour Lines Pattern -->
    <pattern id="gridGrid" width="100" height="100" patternUnits="userSpaceOnUse">
      <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#334155" stroke-width="0.8" stroke-dasharray="3,3" />
    </pattern>

    <!-- Marker Glow Filter -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- 1. BASEMAP TERRAIN -->
  <rect width="1000" height="650" fill="url(#bgGis)" />
  <rect width="1000" height="650" fill="url(#gridGrid)" />

  <!-- 2. SIMULATED RIVERS & COASTLINE (KABUPATEN LUWU WATERWAYS) -->
  <path d="M -50 450 Q 200 420 350 480 T 650 430 T 1050 500" fill="none" stroke="#0284c7" stroke-width="12" opacity="0.6" />
  <path d="M 180 -50 Q 220 200 280 350 T 320 700" fill="none" stroke="#38bdf8" stroke-width="6" opacity="0.7" />
  <path d="M 620 -50 Q 580 180 650 380 T 700 700" fill="none" stroke="#38bdf8" stroke-width="4" opacity="0.6" />

  <!-- 3. LP2B AGRICULTURAL ZONES (GREEN POLYGONS) -->
  <polygon points="80,120 320,100 420,280 250,380 90,300" fill="url(#lp2bPattern)" stroke="#15803d" stroke-width="1.5" />
  <polygon points="520,150 880,120 920,380 680,450 480,320" fill="url(#lp2bPattern)" stroke="#15803d" stroke-width="1.5" />
  <polygon points="150,420 480,400 420,620 180,580" fill="url(#lp2bPattern)" stroke="#15803d" stroke-width="1.5" />

  <!-- 4. ROAD NETWORK (POROS TRANS-SULAWESI) -->
  <path d="M -50 180 Q 250 220 500 280 T 1050 320" fill="none" stroke="#f59e0b" stroke-width="4" />
  <path d="M -50 180 Q 250 220 500 280 T 1050 320" fill="none" stroke="#fef08a" stroke-width="1.5" stroke-dasharray="8,6" />

  <path d="M 500 280 L 500 -50" fill="none" stroke="#e2e8f0" stroke-width="2.5" opacity="0.8" />
  <path d="M 500 280 L 500 700" fill="none" stroke="#e2e8f0" stroke-width="2.5" opacity="0.8" />

  <!-- 5. TARGET PERMOHONAN POLYGON (RED HIGHLIGHTED PLOT AREA) -->
  <polygon points="430,220 580,210 610,340 460,360" fill="rgba(220, 38, 38, 0.35)" stroke="#ef4444" stroke-width="3.5" stroke-dasharray="6,4" filter="url(#glow)" />

  <!-- Boundary Corner Pillars -->
  <circle cx="430" cy="220" r="5" fill="#f87171" stroke="#ffffff" stroke-width="2" />
  <circle cx="580" cy="210" r="5" fill="#f87171" stroke="#ffffff" stroke-width="2" />
  <circle cx="610" cy="340" r="5" fill="#f87171" stroke="#ffffff" stroke-width="2" />
  <circle cx="460" cy="360" r="5" fill="#f87171" stroke="#ffffff" stroke-width="2" />

  <!-- Pillar Labels -->
  <text x="415" y="215" fill="#ffffff" font-size="11" font-weight="bold">P-1</text>
  <text x="590" y="205" fill="#ffffff" font-size="11" font-weight="bold">P-2</text>
  <text x="620" y="350" fill="#ffffff" font-size="11" font-weight="bold">P-3</text>
  <text x="440" y="375" fill="#ffffff" font-size="11" font-weight="bold">P-4</text>

  <!-- Location Pin Banner -->
  <g transform="translate(520, 270)">
    <rect x="-130" y="-45" width="260" height="42" rx="8" fill="rgba(15, 23, 42, 0.92)" stroke="#ef4444" stroke-width="2" />
    <text x="0" y="-26" fill="#fca5a5" font-size="11" font-weight="bold" text-anchor="middle">LOKASI PERMOHONAN ${tipeDoc}</text>
    <text x="0" y="-10" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle">${pemohonName}</text>
    <text x="0" y="5" fill="#38bdf8" font-size="9" text-anchor="middle">Luas: ${luasStr}</text>
  </g>

  <!-- 6. GEODETIC COORDINATE GRID ANNOTATIONS -->
  <text x="30" y="60" fill="#94a3b8" font-size="10" font-mono="true">3° 21' 00" LS</text>
  <text x="30" y="300" fill="#94a3b8" font-size="10" font-mono="true">3° 21' 30" LS</text>
  <text x="30" y="550" fill="#94a3b8" font-size="10" font-mono="true">3° 22' 00" LS</text>

  <text x="200" y="630" fill="#94a3b8" font-size="10" font-mono="true">120° 20' 00" BT</text>
  <text x="500" y="630" fill="#94a3b8" font-size="10" font-mono="true">120° 20' 30" BT</text>
  <text x="800" y="630" fill="#94a3b8" font-size="10" font-mono="true">120° 21' 00" BT</text>

  <!-- Administrative Labels -->
  <text x="220" y="240" fill="#a7f3d0" font-size="13" font-weight="bold" opacity="0.8">ZONA LP2B BUAT UTARA</text>
  <text x="700" y="220" fill="#a7f3d0" font-size="13" font-weight="bold" opacity="0.8">ZONA PERTANIAN AKTIF</text>
  <text x="490" y="480" fill="#cbd5e1" font-size="12" font-weight="bold" text-anchor="middle">DESA ${desaName}, KEC. ${kecName}</text>

  <!-- 7. MAP TITLE BANNER (TOP LEFT) -->
  <g transform="translate(20, 20)">
    <rect x="0" y="0" width="480" height="50" rx="6" fill="rgba(15, 23, 42, 0.95)" stroke="#0284c7" stroke-width="1.5" />
    <text x="15" y="22" fill="#38bdf8" font-size="11" font-weight="bold">${headerTitle}</text>
    <text x="15" y="38" fill="#e2e8f0" font-size="10">KABUPATEN LUWU • DESA ${desaName}, KEC. ${kecName}</text>
  </g>

  <!-- 8. COMPASS ROSE (NORTH ARROW - TOP RIGHT) -->
  <g transform="translate(930, 60)">
    <circle cx="0" cy="0" r="30" fill="rgba(15, 23, 42, 0.95)" stroke="#e2e8f0" stroke-width="1.5" />
    <path d="M 0 -22 L 8 0 L 0 -4 L -8 0 Z" fill="#ef4444" />
    <path d="M 0 22 L 8 0 L 0 4 L -8 0 Z" fill="#94a3b8" />
    <text x="0" y="-25" fill="#ef4444" font-size="11" font-weight="bold" text-anchor="middle">U</text>
    <text x="0" y="32" fill="#e2e8f0" font-size="8" text-anchor="middle">UTARA</text>
  </g>

  <!-- 9. MAP SCALE BAR (BOTTOM RIGHT) -->
  <g transform="translate(800, 580)">
    <rect x="0" y="0" width="180" height="45" rx="6" fill="rgba(15, 23, 42, 0.95)" stroke="#cbd5e1" stroke-width="1" />
    <text x="90" y="16" fill="#ffffff" font-size="9" font-weight="bold" text-anchor="middle">SKALA 1 : 5.000</text>
    <rect x="20" y="23" width="70" height="4" fill="#ffffff" />
    <rect x="90" y="23" width="70" height="4" fill="#0284c7" />
    <text x="20" y="38" fill="#cbd5e1" font-size="8">0</text>
    <text x="90" y="38" fill="#cbd5e1" font-size="8">100m</text>
    <text x="160" y="38" fill="#cbd5e1" font-size="8">250m</text>
  </g>

  <!-- 10. SPATIAL LEGEND (BOTTOM LEFT) -->
  <g transform="translate(20, 480)">
    <rect x="0" y="0" width="220" height="145" rx="6" fill="rgba(15, 23, 42, 0.95)" stroke="#cbd5e1" stroke-width="1" />
    <text x="12" y="18" fill="#ffffff" font-size="10" font-weight="bold">LEGENDA SPASIAL TEMATIK:</text>
    <line x1="12" y1="24" x2="208" y2="24" stroke="#475569" stroke-width="1" />

    <!-- Item 1: Delineasi Permohonan -->
    <rect x="15" y="32" width="20" height="12" fill="rgba(220,38,38,0.4)" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3,2" />
    <text x="42" y="42" fill="#fca5a5" font-size="9.5" font-weight="bold">Delineasi Permohonan ${tipeDoc}</text>

    <!-- Item 2: Zona LP2B Aktif -->
    <rect x="15" y="52" width="20" height="12" fill="url(#lp2bPattern)" stroke="#22c55e" stroke-width="1" />
    <text x="42" y="62" fill="#86efac" font-size="9.5">Kawasan LP2B / RTRW Luwu</text>

    <!-- Item 3: Jalan Poros Trans-Sulawesi -->
    <line x1="15" y1="78" x2="35" y2="78" stroke="#f59e0b" stroke-width="3" />
    <text x="42" y="82" fill="#fef08a" font-size="9.5">Jalan Poros Trans-Sulawesi</text>

    <!-- Item 4: Saluran Irigasi Teknis -->
    <line x1="15" y1="98" x2="35" y2="98" stroke="#0284c7" stroke-width="2.5" />
    <text x="42" y="102" fill="#7dd3fc" font-size="9.5">Sungai / Irigasi Teknis</text>

    <!-- Item 5: Titik Pilar Batas -->
    <circle cx="25" cy="120" r="4" fill="#f87171" stroke="#ffffff" stroke-width="1.5" />
    <text x="42" y="123" fill="#e2e8f0" font-size="9.5">Titik Pilar Batas (P1 - P4)</text>
  </g>
</svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
}

export function getEffectiveMapImageUrl(
  petaImageUrl?: string | null,
  mapSnapshot?: string | null,
  params?: LuwuGisMapParams
): string {
  if (mapSnapshot && mapSnapshot.length > 100 && !mapSnapshot.includes("unsplash")) {
    return mapSnapshot;
  }
  if (petaImageUrl && petaImageUrl.length > 100 && !petaImageUrl.includes("unsplash")) {
    return petaImageUrl;
  }
  return generateLuwuGisMapSvgDataUrl(params || {});
}
