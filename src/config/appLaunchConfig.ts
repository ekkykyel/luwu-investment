/**
 * Konfigurasi Status Peluncuran Resmi & Zero-Dummy State Automation
 * Sistem Pemkab Luwu (Portal MPP & InvestLuwu Hub)
 */

export const APP_LAUNCH_CONFIG = {
  // Tanggal target peluncuran resmi sistem (WITA / UTC+8)
  TARGET_LAUNCH_DATE: '2026-10-15T08:00:00+08:00',
  // Flag override manual jika diaktifkan lebih awal oleh administrator
  FORCE_LAUNCH_STATUS: false,
};

/**
 * Hook pendeteksi fase pra-peluncuran secara otomatis.
 * Banner pra-peluncuran akan otomatis tidak ditampilkan jika:
 * 1. Tanggal saat ini sudah melewati TARGET_LAUNCH_DATE, ATAU
 * 2. Sudah ada data riil yang masuk (dataCount > 0), ATAU
 * 3. FORCE_LAUNCH_STATUS bernilai true.
 */
export function isAppInPreLaunch(dataCount: number = 0): boolean {
  if (APP_LAUNCH_CONFIG.FORCE_LAUNCH_STATUS) return false;
  if (dataCount > 0) return false;

  try {
    const now = new Date();
    const target = new Date(APP_LAUNCH_CONFIG.TARGET_LAUNCH_DATE);
    return now < target;
  } catch {
    return dataCount === 0;
  }
}
