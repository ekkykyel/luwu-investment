/**
 * Geometri & Pemetaan Lapisan Denah Ekspor Figma
 * Sesuai Kontrak Audit & Standar MPP Simpurusiang Kab. Luwu
 */

export interface GeraiOverlayItem {
  tag: 'g' | 'path' | 'rect' | 'circle';
  id: string;
  d?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  cx?: number;
  cy?: number;
  r?: number;
  innerHtml: string;
  childPaths?: string[]; // Array of d attributes of child paths
  childRects?: Array<{ x: number; y: number; width: number; height: number }>;
}

// ── WAYPOINTS ACUAN RUTE EVAKUASI / WAYFINDING RESMI FIGMA ──
export const WP_ENTRANCE = { x: 1928, y: 1996 };
export const WP_HUB = { x: 1922, y: 832 };

// ── ELEMEN NON-INTERAKTIF (HANYA GEOMETRI DENAH LATAR) ──
// GUDANG & DUKCAPIL_SERVER sekarang diwarnai penuh dalam kategori Fasilitas
export const NON_INTERACTIVE_SVG_IDS = new Set<string>([]);

// ── ELEMEN KHUSUS NAVIGASI / WAYPOINT (BUKAN GERAI) ──
export const WAYPOINT_SVG_IDS = new Set<string>([
  'WP_HUB',
  'WP_ENTRANCE'
]);

// ── STATUS needsReview (BENTUK TAMPIL & BISA DIKLIK, MODAL: 'Informasi layanan sedang diperbarui') ──
export const NEEDS_REVIEW_SVG_IDS = new Set<string>([
  'PT_HAS',
  'DUKCAPIL_1',
  'DUKCAPIL_2',
  'PT_NEVIS',
  'BPS',
  'CHARGING_AREA',
  'LAYANAN_BERBANTUAN',
  'DINAS_KESEHATAN'
]);

// ── PEMETAAN RESMI SVG_ID_MAP (EKSPLISIT SESUAI KONTRAK BUTIR 3) ──
export const SVG_ID_MAP: Record<string, string> = {
  // Pemetaan Pasti
  'TOILET_WANITA': 'toilet_wanita',
  'TOILET_PRIA': 'toilet_pria',
  'TIM_TEKNIS': 'ruang_tim_teknis',
  'SMOKING_AREA': 'smoking_area',
  'TANGGA_SELATAN_TIMUR': 'tangga_naik_ne',
  'RUANG_RAPAT': 'ruang_rapat',
  'TANGGA_SELATAN_BARAT': 'tangga_naik_se',
  'TANGGA_UTARA': 'tangga_naik_w',
  'DPMPTSP_2': 'DPMPTSP_N',
  'DPMPTSP_1': 'DPMPTSP_S',
  'BPD_SULSELBAR': 'SULSELBAR',
  'DEKRANASDA': 'DEKRANASDA',
  'BAPENDA': 'BAPENDA',
  'DISNAKERTANS': 'NAKERTRANS',
  'SAMSAT': 'SAMSAT',
  'DUKCAPIL_3': 'DUKCAPIL_N',
  'PDAM': 'PDAM',
  'IMIGRASI': 'IMIGRASI',
  'KPP_PRATAMA': 'KPP_PRATAMA',
  'DINAS_SOSIAL': 'DINSOS',
  'KEJAKSAAN_NEGERI': 'KEJARI',
  'BPJS_KETENAGAKERJAAN': 'BPJS_KET',
  'BPJS_KESEHATAN': 'BPJS_KES',
  'DINAS_PUPTR': 'PUPTR',
  'DINAS_KOMINFO': 'KOMINFO',
  'DINAS_PERIKANAN': 'PERIKANAN',
  'RUANG_LAKTASI': 'ruang_perawatan',
  'LAYANAN_PRIORITAS': 'layanan_disabilitas',
  'MUSHALLA': 'mushalla',
  'RUANG_BACA': 'ruang_baca',
  'FRONT_OFFICE': 'front_office',
  'M_KIOSK': 'layanan_mandiri_1',
  'POS_SECURITY': 'pos_keamanan',
  'PINTU_MASUK': 'gerbang_masuk',
  'DUKCAPIL_SERVER': 'dukcapil_server',
  'GUDANG': 'gudang',
  'GUDANG_2': 'gudang_2',

  // needsReview
  'PT_HAS': 'PT_HAS',
  'DUKCAPIL_1': 'DUKCAPIL_1',
  'DUKCAPIL_2': 'DUKCAPIL_2',
  'PT_NEVIS': 'PT_NEVIS',
  'BPS': 'BPS',

  // Baru & needsReview
  'CHARGING_AREA': 'CHARGING_AREA',
  'LAYANAN_BERBANTUAN': 'LAYANAN_BERBANTUAN',
  'DINAS_KESEHATAN': 'DINAS_KESEHATAN'
};

export const NODE_ID_TO_SVG_ID: Record<string, string> = Object.entries(
  SVG_ID_MAP
).reduce<Record<string, string>>((acc, [svgId, nodeId]) => {
  acc[nodeId] = svgId;
  return acc;
}, {});

// ── NODE TANPA GEOMETRI (DISEMBUNYIKAN: hidden = true) ──
export const HIDDEN_NODE_IDS = new Set<string>([
  'BPN',
  'TASPEN',
  'ruang_istirahat',
  'ruang_bermain_anak',
  'lobby_kiri',
  'lobby_kanan',
  'layanan_mandiri_2',
  'HAS',
  'NERVIS',
  'DUKCAPIL_W1',
  'DUKCAPIL_W2',
  'DUKCAPIL_W3'
]);

/**
 * Parser efisien satu kali untuk GERAI_OVERLAY.svg
 */
export function parseGeraiOverlay(rawSvg: string): {
  defs: string;
  items: GeraiOverlayItem[];
} {
  const defsMatch = rawSvg.match(/<defs>([\s\S]*?)<\/defs>/);
  const defs = defsMatch ? defsMatch[1].trim() : '';

  const innerMatch = rawSvg.match(/<g id="GERAI_OVERLAY">([\s\S]*?)<\/g>\s*(?:<defs>|$)/);
  const inner = innerMatch ? innerMatch[1] : '';

  const regex = /<(g|path|rect|circle)\s+id="([^"]+)"([^>]*)(?:\/>|>([\s\S]*?)<\/\1>)/g;
  const items: GeraiOverlayItem[] = [];
  let m: RegExpExecArray | null;

  while ((m = regex.exec(inner)) !== null) {
    const tag = m[1] as 'g' | 'path' | 'rect' | 'circle';
    const id = m[2];
    const rawAttrs = m[3];
    const rawInner = m[4] || '';

    const dMatch = rawAttrs.match(/\bd="([^"]+)"/);
    const xMatch = rawAttrs.match(/\bx="([^"]+)"/);
    const yMatch = rawAttrs.match(/\by="([^"]+)"/);
    const wMatch = rawAttrs.match(/\bwidth="([^"]+)"/);
    const hMatch = rawAttrs.match(/\bheight="([^"]+)"/);
    const cxMatch = rawAttrs.match(/\bcx="([^"]+)"/);
    const cyMatch = rawAttrs.match(/\bcy="([^"]+)"/);
    const rMatch = rawAttrs.match(/\br="([^"]+)"/);

    // Ekstrak childPaths dan childRects jika tag adalah grup (<g>)
    let childPaths: string[] | undefined = undefined;
    let childRects: Array<{ x: number; y: number; width: number; height: number }> | undefined = undefined;

    if (tag === 'g') {
      const pathRegex = /<path\b[^>]*\bd="([^"]+)"/g;
      let pm: RegExpExecArray | null;
      const cp: string[] = [];
      while ((pm = pathRegex.exec(rawInner)) !== null) {
        cp.push(pm[1]);
      }
      if (cp.length > 0) childPaths = cp;

      const rectRegex = /<rect\b[^>]*\bx="([^"]+)"[^>]*\by="([^"]+)"[^>]*\bwidth="([^"]+)"[^>]*\bheight="([^"]+)"/g;
      let rm: RegExpExecArray | null;
      const cr: Array<{ x: number; y: number; width: number; height: number }> = [];
      while ((rm = rectRegex.exec(rawInner)) !== null) {
        cr.push({
          x: Number(rm[1]),
          y: Number(rm[2]),
          width: Number(rm[3]),
          height: Number(rm[4])
        });
      }
      if (cr.length > 0) childRects = cr;
    }

    // Ubah fill hardcode agar bereaksi terhadap currentColor, nonaktifkan mix-blend-mode & opacity bawaan
    const innerHtml = rawInner
      .replace(/fill="black"/g, 'fill="currentColor"')
      .replace(/fill="#D9D9D9"/g, 'fill="currentColor"')
      .replace(/\bopacity="0\.4"/g, '')
      .replace(/style="[^"]*mix-blend-mode:[^"]*"/g, '');

    items.push({
      tag,
      id,
      d: dMatch ? dMatch[1] : undefined,
      x: xMatch ? Number(xMatch[1]) : undefined,
      y: yMatch ? Number(yMatch[1]) : undefined,
      width: wMatch ? Number(wMatch[1]) : undefined,
      height: hMatch ? Number(hMatch[1]) : undefined,
      cx: cxMatch ? Number(cxMatch[1]) : undefined,
      cy: cyMatch ? Number(cyMatch[1]) : undefined,
      r: rMatch ? Number(rMatch[1]) : undefined,
      innerHtml,
      childPaths,
      childRects
    });
  }

  return { defs, items };
}

export const SVG_ID_TO_NODE_ID = SVG_ID_MAP;
