/**
 * MPP Queue Schedule & Operational Service
 * Pemerintah Kabupaten Luwu - Mal Pelayanan Publik (MPP) Simpurusiang
 * 
 * Zona Waktu: Waktu Indonesia Tengah (WITA, UTC+8)
 * Jadwal Buka Pelayanan Resmi:
 * - Senin: 07:30 - 16:00 WITA
 * - Selasa: 07:30 - 16:00 WITA
 * - Rabu: 07:30 - 16:00 WITA
 * - Kamis: 07:30 - 16:00 WITA
 * - Jumat: 07:30 - 16:30 WITA
 * - Sabtu & Minggu: Libur (Tutup)
 * 
 * Fitur:
 * 1. Evaluasi Status Buka/Tutup Antrean Otomatis berbasis WITA
 * 2. Penutupan otomatis pada Hari Libur Nasional, Cuti Bersama & Hari Raya Keagamaan
 * 3. Logika Nomor Antrean Berurut per Gerai (Contoh: DPMPTSP : 001 / DPMPTSP-001)
 * 4. Reset Otomatis Pagi Hari pada Pukul 07:30 WITA (Mulai dari 001)
 * 5. Penutupan Pendaftaran Online pada Jam Tutup (16:00 / 16:30 WITA)
 * 6. Sinkronisasi Real-time antara Dashboard Admin MPP & Portal MPP Publik
 */

import { supabase } from '../lib/supabaseClient';

export interface DaySchedule {
  isOpen: boolean;
  openTime: string;  // "07:30"
  closeTime: string; // "16:00" atau "16:30"
  label: string;
}

export interface MppHolidayItem {
  id: string;
  date: string; // YYYY-MM-DD
  name: string; // misal "Hari Raya Idul Fitri 1447 H"
  category: 'nasional' | 'cuti_bersama' | 'keagamaan';
  description?: string;
  isActive: boolean;
}

export interface MppQueueScheduleConfig {
  weeklySchedule: {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
  };
  overrideMode: 'auto' | 'force_open' | 'force_closed';
  overrideReason?: string;
  maxDailyQuotaPerTenant: number;
  holidays: MppHolidayItem[];
  customClosedNotice?: string;
  autoResetDaily: boolean;
  lastResetDate?: string;
  updatedAt?: string;
}

export interface MppQueueOperationalStatus {
  isOpen: boolean;
  canRegister: boolean;
  statusBadge: 'BUKA' | 'TUTUP' | 'LIBUR' | 'OVERRIDE_BUKA' | 'OVERRIDE_TUTUP';
  badgeColor: 'emerald' | 'rose' | 'amber' | 'blue';
  reason: string;
  currentWitaTime: string;
  currentWitaDate: string;
  dayName: string;
  todayScheduleDesc: string;
  nextOpenTimeDesc: string;
  isHoliday: boolean;
  holidayDetails?: MppHolidayItem;
  overrideMode: 'auto' | 'force_open' | 'force_closed';
  quotaRemainingPercentage?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT CONFIGURATION SESUAI REGULASI PEMKAB LUWU
// ─────────────────────────────────────────────────────────────────────────────
export const DEFAULT_MPP_QUEUE_CONFIG: MppQueueScheduleConfig = {
  weeklySchedule: {
    monday:    { isOpen: true,  openTime: "07:30", closeTime: "16:00", label: "Senin" },
    tuesday:   { isOpen: true,  openTime: "07:30", closeTime: "16:00", label: "Selasa" },
    wednesday: { isOpen: true,  openTime: "07:30", closeTime: "16:00", label: "Rabu" },
    thursday:  { isOpen: true,  openTime: "07:30", closeTime: "16:00", label: "Kamis" },
    friday:    { isOpen: true,  openTime: "07:30", closeTime: "16:30", label: "Jumat" },
    saturday:  { isOpen: false, openTime: "00:00", closeTime: "00:00", label: "Sabtu" },
    sunday:    { isOpen: false, openTime: "00:00", closeTime: "00:00", label: "Minggu" }
  },
  overrideMode: 'auto',
  overrideReason: '',
  maxDailyQuotaPerTenant: 250,
  autoResetDaily: true,
  customClosedNotice: 'Pendaftaran antrean online dibuka setiap hari kerja pukul 07:30 WITA.',
  holidays: [
    // Hari Libur Nasional & Hari Raya Keagamaan Resmi Indonesia (2026/2027)
    { id: 'hol-1',  date: '2026-01-01', name: 'Tahun Baru 2026 Masehi', category: 'nasional', isActive: true },
    { id: 'hol-2',  date: '2026-01-28', name: 'Isra Mi\'raj Nabi Muhammad SAW', category: 'keagamaan', isActive: true },
    { id: 'hol-3',  date: '2026-02-17', name: 'Tahun Baru Imlek 2577 Kongzili', category: 'keagamaan', isActive: true },
    { id: 'hol-4',  date: '2026-03-20', name: 'Hari Suci Nyepi (Tahun Baru Saka 1948)', category: 'keagamaan', isActive: true },
    { id: 'hol-5',  date: '2026-03-21', name: 'Hari Raya Idul Fitri 1447 Hijriah (Hari 1)', category: 'keagamaan', isActive: true },
    { id: 'hol-6',  date: '2026-03-22', name: 'Hari Raya Idul Fitri 1447 Hijriah (Hari 2)', category: 'keagamaan', isActive: true },
    { id: 'hol-7',  date: '2026-03-23', name: 'Cuti Bersama Hari Raya Idul Fitri 1447 H', category: 'cuti_bersama', isActive: true },
    { id: 'hol-8',  date: '2026-03-24', name: 'Cuti Bersama Hari Raya Idul Fitri 1447 H', category: 'cuti_bersama', isActive: true },
    { id: 'hol-9',  date: '2026-04-03', name: 'Wafat Yesus Kristus (Jumat Agung)', category: 'keagamaan', isActive: true },
    { id: 'hol-10', date: '2026-05-01', name: 'Hari Buruh Internasional', category: 'nasional', isActive: true },
    { id: 'hol-11', date: '2026-05-14', name: 'Kenaikan Yesus Kristus', category: 'keagamaan', isActive: true },
    { id: 'hol-12', date: '2026-05-28', name: 'Hari Raya Idul Adha 1447 Hijriah', category: 'keagamaan', isActive: true },
    { id: 'hol-13', date: '2026-06-01', name: 'Hari Lahir Pancasila', category: 'nasional', isActive: true },
    { id: 'hol-14', date: '2026-06-16', name: 'Tahun Baru Islam 1448 Hijriah', category: 'keagamaan', isActive: true },
    { id: 'hol-15', date: '2026-08-17', name: 'Hari Kemerdekaan Republik Indonesia ke-81', category: 'nasional', isActive: true },
    { id: 'hol-16', date: '2026-08-25', name: 'Maulid Nabi Muhammad SAW', category: 'keagamaan', isActive: true },
    { id: 'hol-17', date: '2026-12-25', name: 'Hari Raya Natal', category: 'keagamaan', isActive: true },
    { id: 'hol-18', date: '2026-12-26', name: 'Cuti Bersama Hari Raya Natal', category: 'cuti_bersama', isActive: true }
  ]
};

const STORAGE_KEY = 'mpp_queue_schedule_config';
const SETTING_KEY_SUPABASE = 'mpp_queue_schedule_config';

// ─────────────────────────────────────────────────────────────────────────────
// TIMEZONE WITA (UTC+8) HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────
export function getWitaDateTime(customDate?: Date) {
  const d = customDate || new Date();

  // Ambil date string YYYY-MM-DD zona waktu Asia/Makassar
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);

  // Ambil time string HH:mm:ss zona waktu Asia/Makassar
  const timeStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Makassar',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(d);

  const [hStr, mStr, sStr] = timeStr.split(':');
  const hours = parseInt(hStr || '0', 10);
  const minutes = parseInt(mStr || '0', 10);
  const seconds = parseInt(sStr || '0', 10);
  const timeDecimal = hours + minutes / 60;

  // Weekday zona WITA (0 = Minggu, 1 = Senin, ..., 5 = Jumat, 6 = Sabtu)
  const weekdayStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Makassar',
    weekday: 'short'
  }).format(d);

  const dayMap: Record<string, { key: keyof MppQueueScheduleConfig['weeklySchedule']; name: string; index: number }> = {
    'Mon': { key: 'monday', name: 'Senin', index: 1 },
    'Tue': { key: 'tuesday', name: 'Selasa', index: 2 },
    'Wed': { key: 'wednesday', name: 'Rabu', index: 3 },
    'Thu': { key: 'thursday', name: 'Kamis', index: 4 },
    'Fri': { key: 'friday', name: 'Jumat', index: 5 },
    'Sat': { key: 'saturday', name: 'Sabtu', index: 6 },
    'Sun': { key: 'sunday', name: 'Minggu', index: 0 }
  };

  const dayMeta = dayMap[weekdayStr] || { key: 'monday', name: 'Senin', index: 1 };

  const idFormatted = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Makassar',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(d);

  return {
    dateStr,
    timeStr: `${hStr}:${mStr}`,
    fullTimeStr: timeStr,
    hours,
    minutes,
    seconds,
    timeDecimal,
    dayKey: dayMeta.key,
    dayName: dayMeta.name,
    dayIndex: dayMeta.index,
    isWeekend: dayMeta.index === 0 || dayMeta.index === 6,
    isFriday: dayMeta.index === 5,
    formattedFullWita: `${idFormatted}, ${hStr}:${mStr} WITA`
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG PERSISTENCE & SYNC (LOCALSTORAGE + SUPABASE SITE_SETTINGS)
// ─────────────────────────────────────────────────────────────────────────────
export function getLocalQueueScheduleConfig(): MppQueueScheduleConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with defaults to ensure all fields exist
      return {
        ...DEFAULT_MPP_QUEUE_CONFIG,
        ...parsed,
        weeklySchedule: {
          ...DEFAULT_MPP_QUEUE_CONFIG.weeklySchedule,
          ...(parsed.weeklySchedule || {})
        },
        holidays: Array.isArray(parsed.holidays) && parsed.holidays.length > 0 
          ? parsed.holidays 
          : DEFAULT_MPP_QUEUE_CONFIG.holidays
      };
    }
  } catch (err) {
    console.warn('[QueueSchedule] Error loading config from localStorage:', err);
  }
  return DEFAULT_MPP_QUEUE_CONFIG;
}

export async function fetchQueueScheduleConfigFromRemote(): Promise<MppQueueScheduleConfig> {
  const localConfig = getLocalQueueScheduleConfig();
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_value, updated_at')
      .eq('setting_key', SETTING_KEY_SUPABASE)
      .maybeSingle();

    if (!error && data && data.setting_value) {
      let parsed = null;
      if (typeof data.setting_value === 'string') {
        try { parsed = JSON.parse(data.setting_value); } catch { /* ignore */ }
      } else if (typeof data.setting_value === 'object') {
        parsed = data.setting_value;
      }

      if (parsed) {
        const merged: MppQueueScheduleConfig = {
          ...DEFAULT_MPP_QUEUE_CONFIG,
          ...parsed,
          weeklySchedule: {
            ...DEFAULT_MPP_QUEUE_CONFIG.weeklySchedule,
            ...(parsed.weeklySchedule || {})
          },
          holidays: Array.isArray(parsed.holidays) && parsed.holidays.length > 0 
            ? parsed.holidays 
            : DEFAULT_MPP_QUEUE_CONFIG.holidays,
          updatedAt: data.updated_at
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
    }
  } catch (err) {
    console.warn('[QueueSchedule] Remote config fetch exception:', err);
  }
  return localConfig;
}

export async function saveQueueScheduleConfig(config: MppQueueScheduleConfig): Promise<boolean> {
  try {
    const nowIso = new Date().toISOString();
    const payload = {
      ...config,
      updatedAt: nowIso
    };

    // 1. Local caching
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

    // 2. Broadcast immediately to current window & tabs
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mpp_queue_schedule_updated', { detail: payload }));
    }

    // 3. Remote sync to Supabase site_settings
    const { error } = await supabase
      .from('site_settings')
      .upsert({
        setting_key: SETTING_KEY_SUPABASE,
        setting_value: JSON.stringify(payload),
        updated_at: nowIso
      }, { onConflict: 'setting_key' });

    if (error) {
      console.warn('[QueueSchedule] Remote save warning:', error);
      // Non-fatal if Supabase table has issues, local storage works
    }

    return true;
  } catch (err) {
    console.error('[QueueSchedule] Save exception:', err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OPERATIONAL STATUS EVALUATOR
// ─────────────────────────────────────────────────────────────────────────────
export function evaluateQueueOperationalStatus(
  customConfig?: MppQueueScheduleConfig,
  customDate?: Date
): MppQueueOperationalStatus {
  const config = customConfig || getLocalQueueScheduleConfig();
  const wita = getWitaDateTime(customDate);

  // 1. OVERRIDE CEK (Emergency manual actions by Admin)
  if (config.overrideMode === 'force_open') {
    return {
      isOpen: true,
      canRegister: true,
      statusBadge: 'OVERRIDE_BUKA',
      badgeColor: 'blue',
      reason: config.overrideReason || 'Layanan dibuka manual oleh Admin MPP (Override Mode Buka).',
      currentWitaTime: wita.timeStr,
      currentWitaDate: wita.dateStr,
      dayName: wita.dayName,
      todayScheduleDesc: 'Override Manual Pengelola MPP',
      nextOpenTimeDesc: 'Sedang Aktif Terbuka',
      isHoliday: false,
      overrideMode: 'force_open'
    };
  }

  if (config.overrideMode === 'force_closed') {
    return {
      isOpen: false,
      canRegister: false,
      statusBadge: 'OVERRIDE_TUTUP',
      badgeColor: 'rose',
      reason: config.overrideReason || 'Mesin dan pendaftaran antrean online ditutup sementara oleh Admin MPP (Pemeliharaan / Penutupan Darurat).',
      currentWitaTime: wita.timeStr,
      currentWitaDate: wita.dateStr,
      dayName: wita.dayName,
      todayScheduleDesc: 'Ditutup Manual oleh Pengelola MPP',
      nextOpenTimeDesc: 'Menunggu Pengaktifan Kembali oleh Admin',
      isHoliday: false,
      overrideMode: 'force_closed'
    };
  }

  // 2. CEK HARI LIBUR NASIONAL / CUTI BERSAMA / HARI RAYA KEAGAMAAN
  const activeHoliday = config.holidays.find(
    h => h.isActive && h.date === wita.dateStr
  );

  if (activeHoliday) {
    const categoryLabel = activeHoliday.category === 'cuti_bersama' 
      ? 'Cuti Bersama' 
      : activeHoliday.category === 'keagamaan' 
        ? 'Hari Raya Keagamaan' 
        : 'Hari Libur Nasional';

    return {
      isOpen: false,
      canRegister: false,
      statusBadge: 'LIBUR',
      badgeColor: 'amber',
      reason: `Pendaftaran antrean ditutup: ${categoryLabel} - ${activeHoliday.name}. Mesin registrasi antrean dinonaktifkan hari ini.`,
      currentWitaTime: wita.timeStr,
      currentWitaDate: wita.dateStr,
      dayName: wita.dayName,
      todayScheduleDesc: `Libur: ${activeHoliday.name}`,
      nextOpenTimeDesc: 'Buka kembali pada hari kerja berikutnya pukul 07:30 WITA',
      isHoliday: true,
      holidayDetails: activeHoliday,
      overrideMode: 'auto'
    };
  }

  // 3. CEK JADWAL MINGGUAN (Senin - Minggu)
  const todaySchedule = config.weeklySchedule[wita.dayKey];

  if (!todaySchedule || !todaySchedule.isOpen) {
    // Weekend (Sabtu atau Minggu) atau hari yang dinonaktifkan
    return {
      isOpen: false,
      canRegister: false,
      statusBadge: 'TUTUP',
      badgeColor: 'rose',
      reason: `MPP Simpurusiang tidak beroperasi pada hari ${wita.dayName} (Libur Akhir Pekan). Layanan dibuka setiap hari kerja Senin s/d Jumat.`,
      currentWitaTime: wita.timeStr,
      currentWitaDate: wita.dateStr,
      dayName: wita.dayName,
      todayScheduleDesc: `${wita.dayName}: Libur Operasional`,
      nextOpenTimeDesc: 'Buka kembali hari Senin pukul 07:30 WITA',
      isHoliday: false,
      overrideMode: 'auto'
    };
  }

  // 4. CEK JAM OPERASIONAL HARI KERJA BERJALAN
  // Parse openTime & closeTime
  const [openH, openM] = todaySchedule.openTime.split(':').map(Number);
  const [closeH, closeM] = todaySchedule.closeTime.split(':').map(Number);
  const openDecimal = openH + (openM || 0) / 60;
  const closeDecimal = closeH + (closeM || 0) / 60;

  const scheduleLabel = `${wita.dayName}: ${todaySchedule.openTime} - ${todaySchedule.closeTime} WITA`;

  // Sebelum Jam Buka (Sebelum 07:30 WITA)
  if (wita.timeDecimal < openDecimal) {
    return {
      isOpen: false,
      canRegister: false,
      statusBadge: 'TUTUP',
      badgeColor: 'amber',
      reason: `Pendaftaran antrean online belum dibuka. Jam pelayanan dibuka pukul ${todaySchedule.openTime} WITA. Silakan bersiap-siap.`,
      currentWitaTime: wita.timeStr,
      currentWitaDate: wita.dateStr,
      dayName: wita.dayName,
      todayScheduleDesc: scheduleLabel,
      nextOpenTimeDesc: `Buka hari ini pukul ${todaySchedule.openTime} WITA`,
      isHoliday: false,
      overrideMode: 'auto'
    };
  }

  // Setelah Jam Tutup (Setelah 16:00 WITA Senin-Kamis atau 16:30 WITA Jumat)
  if (wita.timeDecimal >= closeDecimal) {
    const nextDayDesc = wita.dayKey === 'friday' 
      ? 'Buka kembali hari Senin pukul 07:30 WITA' 
      : 'Buka kembali besok pukul 07:30 WITA';

    return {
      isOpen: false,
      canRegister: false,
      statusBadge: 'TUTUP',
      badgeColor: 'rose',
      reason: `Jam pelayanan antrean hari ini telah ditutup pada pukul ${todaySchedule.closeTime} WITA. Pendaftaran online ditutup hingga jam pelayanan berikutnya dibuka.`,
      currentWitaTime: wita.timeStr,
      currentWitaDate: wita.dateStr,
      dayName: wita.dayName,
      todayScheduleDesc: scheduleLabel,
      nextOpenTimeDesc: nextDayDesc,
      isHoliday: false,
      overrideMode: 'auto'
    };
  }

  // DI DALAM JAM PELAYANAN AKTIF (07:30 s/d Jam Tutup)
  return {
    isOpen: true,
    canRegister: true,
    statusBadge: 'BUKA',
    badgeColor: 'emerald',
    reason: `Layanan Antrean Online Sedang Aktif & Terbuka (${scheduleLabel}). Silakan ambil tiket antrean Anda.`,
    currentWitaTime: wita.timeStr,
    currentWitaDate: wita.dateStr,
    dayName: wita.dayName,
    todayScheduleDesc: scheduleLabel,
    nextOpenTimeDesc: `Pelayanan ditutup hari ini pukul ${todaySchedule.closeTime} WITA`,
    isHoliday: false,
    overrideMode: 'auto'
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// QUEUE NUMBERING ENGINE (FORMAT BERURUT PER GERAI: DPMPTSP : 001)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format nomor antrean standar pemerintahan Kabupaten Luwu
 * Format kode mesin/database: "DPMPTSP-001"
 * Format tampilan label resmi: "DPMPTSP : 001"
 * Prioritas (Lansia/Disabilitas/Ibu Hamil): "P-DPMPTSP-001" (Label: "PRIORITAS DPMPTSP : 001")
 */
export function formatMppQueueNumber(
  tenantCode: string,
  queueNumber: number,
  isPriority: boolean = false
): {
  ticketCode: string;
  displayLabel: string;
  paddedNum: string;
} {
  const cleanCode = (tenantCode || 'MPP').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const paddedNum = String(Math.max(1, queueNumber)).padStart(3, '0');

  const ticketCode = isPriority 
    ? `P-${cleanCode}-${paddedNum}` 
    : `${cleanCode}-${paddedNum}`;

  const displayLabel = isPriority 
    ? `PRIORITAS ${cleanCode} : ${paddedNum}` 
    : `${cleanCode} : ${paddedNum}`;

  return {
    ticketCode,
    displayLabel,
    paddedNum
  };
}

/**
 * Mengambil nomor antrean berikutnya dari database Supabase untuk gerai tertentu pada hari ini
 * Pada pagi hari pukul 07:30 WITA saat pergantian hari, jika belum ada antrean hari ini,
 * nomor otomatis dimulai dari 1 ("001").
 */
export async function getNextMppQueueSequence(
  tenantId: string,
  tenantCode: string,
  queueDateWita?: string,
  isPriority: boolean = false
): Promise<{
  nextNumber: number;
  ticketCode: string;
  displayLabel: string;
  paddedNum: string;
}> {
  const wita = getWitaDateTime();
  const targetDate = queueDateWita || wita.dateStr;

  try {
    const { data, error } = await supabase
      .from('mpp_queues')
      .select('queue_number')
      .eq('tenant_id', tenantId)
      .eq('queue_date', targetDate)
      .order('queue_number', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (!error && data && data.length > 0 && data[0].queue_number) {
      nextNumber = Number(data[0].queue_number) + 1;
    }

    const formatted = formatMppQueueNumber(tenantCode, nextNumber, isPriority);

    return {
      nextNumber,
      ...formatted
    };
  } catch (err) {
    console.warn('[QueueNumbering] Fallback to sequence 1:', err);
    const formatted = formatMppQueueNumber(tenantCode, 1, isPriority);
    return {
      nextNumber: 1,
      ...formatted
    };
  }
}

/**
 * Reset Antrean Harian & Penutupan Otomatis Antrean Kemarin
 * Menandai tiket sisa hari sebelumnya yang belum dipanggil menjadi 'selesai' / 'batal',
 * dan memperbarui status reset hari ini.
 */
export async function performDailyQueueReset(): Promise<{ success: boolean; message: string; expiredCount: number }> {
  const wita = getWitaDateTime();
  try {
    // 1. Cari antrean dari tanggal sebelum hari ini yang masih menggantung
    const { data: pendingOldQueues, error: fetchErr } = await supabase
      .from('mpp_queues')
      .select('id')
      .lt('queue_date', wita.dateStr)
      .in('status', ['menunggu', 'dipanggil']);

    let expiredCount = 0;
    if (!fetchErr && pendingOldQueues && pendingOldQueues.length > 0) {
      expiredCount = pendingOldQueues.length;
      const ids = pendingOldQueues.map(q => q.id);
      await supabase
        .from('mpp_queues')
        .update({
          status: 'selesai',
          updated_at: new Date().toISOString()
        })
        .in('id', ids);
    }

    // 2. Simpan tanggal last reset pada config
    const currentConfig = getLocalQueueScheduleConfig();
    currentConfig.lastResetDate = `${wita.formattedFullWita}`;
    await saveQueueScheduleConfig(currentConfig);

    return {
      success: true,
      message: `Reset harian berhasil dilakukan pada ${wita.formattedFullWita}. Nomor antrean hari ini dimulai dari urutan 001 per gerai. (${expiredCount} antrean kemarin otomatis diselesaikan).`,
      expiredCount
    };
  } catch (err: any) {
    console.error('[DailyReset] Exception during daily queue reset:', err);
    return {
      success: false,
      message: `Gagal melakukan reset antrean: ${err?.message || 'Kesalahan sistem'}`,
      expiredCount: 0
    };
  }
}
