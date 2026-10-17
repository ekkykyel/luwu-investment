/**
 * MPP Category Types, Mapping, and Thin Contour Definition
 * Sesuai Audit E1 dan Spesifikasi E2
 */

export type MppCategoryKey =
  | 'kependudukan_sipil'
  | 'perizinan_investasi'
  | 'keuangan_pajak'
  | 'ketenagakerjaan_jamsos'
  | 'kesehatan_sosial'
  | 'utilitas_lainnya'
  | 'hukum'
  | 'layanan_khusus'
  | 'fasilitas';

export interface MppCategoryMeta {
  key: MppCategoryKey;
  label: string;
  tokenVar: string;
}

export const MPP_CATEGORIES: Record<MppCategoryKey, MppCategoryMeta> = {
  kependudukan_sipil: {
    key: 'kependudukan_sipil',
    label: 'Kependudukan & Sipil',
    tokenVar: 'var(--fp-cat-kependudukan)'
  },
  perizinan_investasi: {
    key: 'perizinan_investasi',
    label: 'Perizinan & Investasi',
    tokenVar: 'var(--fp-cat-perizinan)'
  },
  keuangan_pajak: {
    key: 'keuangan_pajak',
    label: 'Keuangan & Pajak',
    tokenVar: 'var(--fp-cat-keuangan)'
  },
  ketenagakerjaan_jamsos: {
    key: 'ketenagakerjaan_jamsos',
    label: 'Ketenagakerjaan & Jamsos',
    tokenVar: 'var(--fp-cat-ketenagakerjaan)'
  },
  kesehatan_sosial: {
    key: 'kesehatan_sosial',
    label: 'Kesehatan & Sosial',
    tokenVar: 'var(--fp-cat-kesehatan)'
  },
  utilitas_lainnya: {
    key: 'utilitas_lainnya',
    label: 'Utilitas & Lainnya',
    tokenVar: 'var(--fp-cat-utilitas)'
  },
  hukum: {
    key: 'hukum',
    label: 'Hukum',
    tokenVar: 'var(--fp-cat-hukum)'
  },
  layanan_khusus: {
    key: 'layanan_khusus',
    label: 'Layanan Khusus',
    tokenVar: 'var(--fp-cat-khusus)'
  },
  fasilitas: {
    key: 'fasilitas',
    label: 'Fasilitas Umum',
    tokenVar: 'var(--fp-cat-fasilitas)'
  }
};

/**
 * Pemetaan setiap SVG Item ID ke Kategori Layanan
 */
export const SVG_ID_TO_CATEGORY: Record<string, MppCategoryKey> = {
  // Kependudukan & Sipil
  DUKCAPIL_1: 'kependudukan_sipil',
  DUKCAPIL_2: 'kependudukan_sipil',
  DUKCAPIL_3: 'kependudukan_sipil',
  IMIGRASI: 'kependudukan_sipil',

  // Perizinan & Investasi
  DPMPTSP_1: 'perizinan_investasi',
  DPMPTSP_2: 'perizinan_investasi',

  // Keuangan & Pajak
  BAPENDA: 'keuangan_pajak',
  KPP_PRATAMA: 'keuangan_pajak',
  BPD_SULSELBAR: 'keuangan_pajak',
  SAMSAT: 'keuangan_pajak',

  // Ketenagakerjaan & Jamsos
  DISNAKERTANS: 'ketenagakerjaan_jamsos',
  BPJS_KETENAGAKERJAAN: 'ketenagakerjaan_jamsos',
  BPJS_KESEHATAN: 'ketenagakerjaan_jamsos',

  // Kesehatan & Sosial
  DINAS_KESEHATAN: 'kesehatan_sosial',
  DINAS_SOSIAL: 'kesehatan_sosial',

  // Utilitas & Instansi Khusus (Diwarnai Biru Cerah & Kuning Cerah, Anti Abu-abu)
  PDAM: 'kependudukan_sipil',    // Biru Cerah (Sky Blue)
  PT_NEVIS: 'kependudukan_sipil', // Biru Cerah (Sky Blue)
  PT_HAS: 'utilitas_lainnya',     // Kuning Cerah (Amber Gold)
  BPS: 'utilitas_lainnya',        // Kuning Cerah (Amber Gold)
  DINAS_PUPTR: 'utilitas_lainnya', // Kuning Cerah (Amber Gold)
  DINAS_KOMINFO: 'kependudukan_sipil', // Biru Cerah (Sky Blue)
  DINAS_PERIKANAN: 'kependudukan_sipil', // Biru Cerah (Sky Blue)
  DEKRANASDA: 'utilitas_lainnya',  // Kuning Cerah (Amber Gold)

  // Hukum
  KEJAKSAAN_NEGERI: 'hukum',

  // Layanan Khusus
  LAYANAN_PRIORITAS: 'layanan_khusus',
  LAYANAN_BERBANTUAN: 'layanan_khusus',
  FRONT_OFFICE: 'layanan_khusus',
  M_KIOSK: 'layanan_khusus',

  // Fasilitas
  TOILET_WANITA: 'fasilitas',
  TOILET_PRIA: 'fasilitas',
  RUANG_LAKTASI: 'fasilitas',
  RUANG_BACA: 'fasilitas',
  CHARGING_AREA: 'fasilitas',
  RUANG_RAPAT: 'fasilitas',
  TIM_TEKNIS: 'fasilitas',
  SMOKING_AREA: 'fasilitas',
  MUSHALLA: 'fasilitas',
  POS_SECURITY: 'fasilitas',
  GUDANG: 'fasilitas',
  DUKCAPIL_SERVER: 'fasilitas',
  PINTU_MASUK: 'fasilitas',
  TANGGA_UTARA: 'fasilitas',
  TANGGA_SELATAN_TIMUR: 'fasilitas',
  TANGGA_SELATAN_BARAT: 'fasilitas'
};

/**
 * 19 Path Kontur Tipis yang Diverifikasi Matematis
 * Indeks path (0-based) di dalam grup SVG
 */
export const THIN_CONTOUR_PATH_MAP: Record<string, number[]> = {
  DPMPTSP_1: [0],
  DUKCAPIL_1: [0, 5, 18],
  DINAS_KESEHATAN: [0, 1],
  PT_NEVIS: [0, 2],
  BPS: [0],
  IMIGRASI: [0, 1],
  KPP_PRATAMA: [1, 2],
  DINAS_SOSIAL: [0],
  KEJAKSAAN_NEGERI: [0],
  PT_HAS: [0, 1],
  BPJS_KETENAGAKERJAAN: [0],
  DINAS_KOMINFO: [0]
};
