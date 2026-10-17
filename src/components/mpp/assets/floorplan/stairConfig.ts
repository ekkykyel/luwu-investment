/**
 * Konfigurasi Geometri Prosedural Tangga MPP Simpurusiang Kab. Luwu
 * Koordinat diverifikasi presisi terhadap path SVG GERAI_OVERLAY.svg
 */

export interface StairArm {
  xMin: number;
  xMax: number;
  yOpen: number; // Ujung terbuka tempat mulai melangkah (ujung NAIK)
  yLanding: number; // Batas menuju bordes
}

export interface StairConfigItem {
  id: string; // SVG ID: TANGGA_UTARA | TANGGA_SELATAN_TIMUR | TANGGA_SELATAN_BARAT
  label: string;
  x0: number; // Sudut atas-kiri tangga
  y0: number;
  w: number;
  h: number;
  entry: 'kiri' | 'kanan'; // Arah masuk konfigurasi (Directive 3)
  landingPosition: 'top' | 'bottom';
  leftArm: StairArm;
  rightArm: StairArm;
  landing: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  };
  openEndDirection: 'up' | 'down'; // 'up' = yOpen < yLanding, 'down' = yOpen > yLanding
  d: string; // Geometri path SVG asli untuk clipPath
  centerGap: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  };
  bbox: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  };
}

/**
 * Menghitung jalur naik berbentuk U dengan garis tipis netral slate (Directive 3)
 * - Bordes di bawah: masuk bentangan KANAN (x0+107) dari atas, turun ke bordes, belok ke KIRI (x0+35), naik (panah ATAS)
 * - Bordes di atas: masuk bentangan KIRI dari bawah, naik ke bordes, belok ke KANAN, turun (panah BAWAH)
 * - Arah masuk (kiri|kanan) bersifat terkonfigurasi
 */
export function computeStairUPath(stair: StairConfigItem): {
  startDot: { cx: number; cy: number; r: number };
  pathD: string;
  arrowHeadD: string;
  labelPos: { x: number; y: number };
} {
  const isBottomLanding = stair.landingPosition === 'bottom';
  const enterRight = stair.entry === 'kanan';

  const xLeft = stair.x0 + 35;
  const xRight = stair.x0 + 107;
  const xIn = enterRight ? xRight : xLeft;
  const xOut = enterRight ? xLeft : xRight;

  if (isBottomLanding) {
    const yStart = stair.y0 + 14;
    const yLanding = stair.y0 + 190;
    const yEnd = stair.y0 + 20;

    return {
      startDot: { cx: xIn, cy: yStart, r: 2.5 },
      pathD: `M ${xIn} ${yStart} L ${xIn} ${yLanding} L ${xOut} ${yLanding} L ${xOut} ${yEnd}`,
      arrowHeadD: `M ${xOut - 5} ${yEnd + 10} L ${xOut} ${yEnd} L ${xOut + 5} ${yEnd + 10}`,
      labelPos: { x: xOut, y: yEnd + 26 }
    };
  } else {
    // Bordes di atas (SELATAN_TIMUR)
    const yStart = stair.y0 + stair.h - 14;
    const yLanding = stair.y0 + 45.5;
    const yEnd = stair.y0 + stair.h - 20;

    return {
      startDot: { cx: xIn, cy: yStart, r: 2.5 },
      pathD: `M ${xIn} ${yStart} L ${xIn} ${yLanding} L ${xOut} ${yLanding} L ${xOut} ${yEnd}`,
      arrowHeadD: `M ${xOut - 5} ${yEnd - 10} L ${xOut} ${yEnd} L ${xOut + 5} ${yEnd - 10}`,
      labelPos: { x: xOut, y: yEnd - 24 }
    };
  }
}

export const STAIR_CONFIGS: StairConfigItem[] = [
  {
    id: 'TANGGA_UTARA',
    label: 'Tangga Akses Sayap Utara',
    x0: 682,
    y0: 948,
    w: 143,
    h: 236,
    entry: 'kanan',
    landingPosition: 'bottom',
    leftArm: {
      xMin: 682,
      xMax: 751,
      yOpen: 948,
      yLanding: 1092
    },
    rightArm: {
      xMin: 754,
      xMax: 825,
      yOpen: 948,
      yLanding: 1092
    },
    landing: {
      xMin: 682,
      xMax: 825,
      yMin: 1092,
      yMax: 1184
    },
    openEndDirection: 'up',
    d: 'M752.472 1092.42C753.79 1092.42 753.971 1083.73 753.971 1020.21V948H789.457H824.943V1065.84V1183.68H753.471H682V1070.36V957.026H716.486H750.972V1024.72C750.972 1084.23 751.153 1092.42 752.472 1092.42Z',
    centerGap: {
      xMin: 750.97,
      xMax: 753.97,
      yMin: 948,
      yMax: 1092.42
    },
    bbox: {
      xMin: 682,
      xMax: 824.94,
      yMin: 948,
      yMax: 1183.68
    }
  },
  {
    id: 'TANGGA_SELATAN_TIMUR',
    label: 'Tangga Akses Sayap Selatan (Timur)',
    x0: 3022,
    y0: 268,
    w: 143,
    h: 236,
    entry: 'kanan', // Masuk bentangan KANAN dari bawah, naik ke bordes, belok ke KIRI (posisi panah & teks NAIK berada di lengan KIRI)
    landingPosition: 'top',
    leftArm: {
      xMin: 3022,
      xMax: 3091,
      yOpen: 504,
      yLanding: 359
    },
    rightArm: {
      xMin: 3094,
      xMax: 3165,
      yOpen: 504,
      yLanding: 359
    },
    landing: {
      xMin: 3022,
      xMax: 3165,
      yMin: 268,
      yMax: 359
    },
    openEndDirection: 'down',
    d: 'M3022 503.684V385.842V268H3093.47H3164.94V385.842V503.684H3129.46H3093.97V431.474C3093.97 367.957 3093.79 359.265 3092.47 359.265C3091.15 359.265 3090.97 367.957 3090.97 431.474V503.684H3056.49H3022Z',
    centerGap: {
      xMin: 3090.97,
      xMax: 3093.97,
      yMin: 359.26,
      yMax: 503.68
    },
    bbox: {
      xMin: 3022,
      xMax: 3164.94,
      yMin: 268,
      yMax: 503.68
    }
  },
  {
    id: 'TANGGA_SELATAN_BARAT',
    label: 'Tangga Akses Sayap Selatan (Barat)',
    x0: 3022,
    y0: 1175,
    w: 143,
    h: 236,
    entry: 'kanan', // Masuk bentangan KANAN dari atas, turun ke bordes, belok kiri, naik (panah ATAS)
    landingPosition: 'bottom',
    leftArm: {
      xMin: 3022,
      xMax: 3091,
      yOpen: 1175,
      yLanding: 1319
    },
    rightArm: {
      xMin: 3094,
      xMax: 3165,
      yOpen: 1175,
      yLanding: 1319
    },
    landing: {
      xMin: 3022,
      xMax: 3165,
      yMin: 1319,
      yMax: 1411
    },
    openEndDirection: 'up',
    d: 'M3092.47 1319.42C3093.79 1319.42 3093.97 1310.73 3093.97 1247.21V1175H3129.46H3164.94V1292.84V1410.68H3093.47H3022V1297.36V1184.03H3056.49H3090.97V1251.72C3090.97 1311.23 3091.15 1319.42 3092.47 1319.42Z',
    centerGap: {
      xMin: 3090.97,
      xMax: 3093.97,
      yMin: 1175,
      yMax: 1319.42
    },
    bbox: {
      xMin: 3022,
      xMax: 3164.94,
      yMin: 1175,
      yMax: 1410.68
    }
  }
];

export const STAIR_SVG_IDS = new Set<string>([
  'TANGGA_UTARA',
  'TANGGA_SELATAN_TIMUR',
  'TANGGA_SELATAN_BARAT'
]);
