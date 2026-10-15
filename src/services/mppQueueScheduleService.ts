/**
 * MPP Queue Operational Schedule & Automatic Sequence Engine (WITA / UTC+8)
 * Standardized for Pemkab Luwu Mal Pelayanan Publik (MPP) Simpurusiang.
 */

import { supabase } from '../lib/supabaseClient';

export interface MppDailyScheduleItem {
  label: string;
  isOpen: boolean;
  openTime: string;  // Format HH:mm
  closeTime: string; // Format HH:mm
}

export type MppDayKey = 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu';

export interface MppHolidayItem {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  category: 'nasional' | 'cuti_bersama' | 'keagamaan';
  description: string;
  isActive: boolean;
}

export interface MppQueueScheduleConfig {
  weeklySchedule: Record<MppDayKey, MppDailyScheduleItem>;
  holidays: MppHolidayItem[];
  maxDailyQuotaPerTenant: number;
  customClosedNotice?: string;
  overrideMode: 'auto' | 'force_open' | 'force_closed';
  overrideReason?: string;
  lastResetDate?: string;
}

export interface MppQueueOperationalStatus {
  isOpen: boolean;
  canRegister: boolean;
  statusBadge: 'BUKA' | 'TUTUP' | 'LIBUR' | 'OVERRIDE';
  reason: string;
  todayScheduleDesc: string;
  nextOpenTimeDesc: string;
  overrideMode: 'auto' | 'force_open' | 'force_closed';
}

export interface WitaDateTimeInfo {
  dateStr: string;   // YYYY-MM-DD
  timeStr: string;   // HH:mm
  fullTimeStr: string; // HH:mm:ss
  dayKey: MppDayKey;
  dayName: string;
  hour: number;
  minute: number;
  second: number;
  fullFormatted: string;
  formattedFullWita: string;
}

const STORAGE_KEY = 'mpp_queue_schedule_config_v2';

export const DEFAULT_MPP_QUEUE_CONFIG: MppQueueScheduleConfig = {
  weeklySchedule: {
    senin: { label: 'Senin', isOpen: true, openTime: '07:30', closeTime: '16:00' },
    selasa: { label: 'Selasa', isOpen: true, openTime: '07:30', closeTime: '16:00' },
    rabu: { label: 'Rabu', isOpen: true, openTime: '07:30', closeTime: '16:00' },
    kamis: { label: 'Kamis', isOpen: true, openTime: '07:30', closeTime: '16:00' },
    jumat: { label: 'Jumat', isOpen: true, openTime: '07:30', closeTime: '16:30' },
    sabtu: { label: 'Sabtu', isOpen: false, openTime: '08:00', closeTime: '12:00' },
    minggu: { label: 'Minggu', isOpen: false, openTime: '08:00', closeTime: '12:00' },
  },
  holidays: [
    {
      id: 'hol-tahun-baru-2026',
      date: '2026-01-01',
      name: 'Tahun Baru Masehi',
      category: 'nasional',
      description: 'Libur Nasional',
      isActive: true,
    },
    {
      id: 'hol-idul-fitri-2026',
      date: '2026-03-20',
      name: 'Hari Raya Idul Fitri 1447 H',
      category: 'keagamaan',
      description: 'Hari Raya Keagamaan',
      isActive: true,
    },
    {
      id: 'hol-hut-ri-2026',
      date: '2026-08-17',
      name: 'Hari Kemerdekaan RI',
      category: 'nasional',
      description: 'HUT Kemerdekaan RI Ke-81',
      isActive: true,
    },
  ],
  maxDailyQuotaPerTenant: 250,
  customClosedNotice: 'Pendaftaran antrean online dibuka setiap hari kerja pukul 07:30 WITA.',
  overrideMode: 'auto',
  overrideReason: '',
  lastResetDate: new Date().toISOString().split('T')[0],
};

/**
 * Returns time & date in Central Indonesian Time (WITA, UTC+8) for Luwu / Belopa
 */
export function getWitaDateTime(date: Date = new Date()): WitaDateTimeInfo {
  // Calculate WITA (UTC+8)
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const witaTime = new Date(utc + 3600000 * 8);

  const year = witaTime.getFullYear();
  const month = String(witaTime.getMonth() + 1).padStart(2, '0');
  const day = String(witaTime.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const hour = witaTime.getHours();
  const minute = witaTime.getMinutes();
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  const dayIndex = witaTime.getDay(); // 0 is Sunday
  const dayKeys: MppDayKey[] = [
    'minggu',
    'senin',
    'selasa',
    'rabu',
    'kamis',
    'jumat',
    'sabtu',
  ];
  const dayNames = [
    'Minggu',
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
  ];

  const dayKey = dayKeys[dayIndex];
  const dayName = dayNames[dayIndex];
  const second = witaTime.getSeconds();
  const fullTimeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
  const formattedFullWita = `${dayName}, ${day} ${month} ${year} • ${fullTimeStr} WITA`;

  return {
    dateStr,
    timeStr,
    fullTimeStr,
    dayKey,
    dayName,
    hour,
    minute,
    second,
    fullFormatted: `${dayName}, ${day} ${month} ${year} • ${timeStr} WITA`,
    formattedFullWita,
  };
}

/**
 * Get cached config from local storage or default
 */
export function getLocalQueueScheduleConfig(): MppQueueScheduleConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_MPP_QUEUE_CONFIG,
        ...parsed,
        weeklySchedule: {
          ...DEFAULT_MPP_QUEUE_CONFIG.weeklySchedule,
          ...(parsed.weeklySchedule || {}),
        },
      };
    }
  } catch (e) {
    console.warn('[MPP Schedule] Failed to read local config:', e);
  }
  return DEFAULT_MPP_QUEUE_CONFIG;
}

/**
 * Fetch config from remote database or fallback to local
 */
export async function fetchQueueScheduleConfigFromRemote(): Promise<MppQueueScheduleConfig> {
  try {
    const { data, error } = await supabase
      .from('opd_settings')
      .select('setting_value')
      .eq('setting_key', 'mpp_queue_schedule_config')
      .single();

    if (!error && data?.setting_value) {
      const remoteConfig = typeof data.setting_value === 'string'
        ? JSON.parse(data.setting_value)
        : data.setting_value;

      const merged: MppQueueScheduleConfig = {
        ...DEFAULT_MPP_QUEUE_CONFIG,
        ...remoteConfig,
        weeklySchedule: {
          ...DEFAULT_MPP_QUEUE_CONFIG.weeklySchedule,
          ...(remoteConfig.weeklySchedule || {}),
        },
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {}

      return merged;
    }
  } catch (err) {
    console.warn('[MPP Schedule] Failed to fetch remote config, using local:', err);
  }

  return getLocalQueueScheduleConfig();
}

/**
 * Save schedule config to local storage and sync to Supabase
 */
export async function saveQueueScheduleConfig(
  config: MppQueueScheduleConfig
): Promise<boolean> {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

    // Dispatch custom event for real-time app update
    window.dispatchEvent(
      new CustomEvent('mpp_queue_schedule_updated', { detail: config })
    );

    // Sync to Supabase opd_settings
    await supabase
      .from('opd_settings')
      .upsert({
        setting_key: 'mpp_queue_schedule_config',
        setting_value: config,
        updated_at: new Date().toISOString(),
      });

    return true;
  } catch (err) {
    console.error('[MPP Schedule] Error saving queue schedule config:', err);
    return false;
  }
}

/**
 * Evaluate operational status based on WITA clock and schedule rules
 */
export function evaluateQueueOperationalStatus(
  inputConfig?: MppQueueScheduleConfig
): MppQueueOperationalStatus {
  const config = inputConfig || getLocalQueueScheduleConfig();
  const wita = getWitaDateTime();

  // 1. Check Admin Manual Override
  if (config.overrideMode === 'force_open') {
    return {
      isOpen: true,
      canRegister: true,
      statusBadge: 'OVERRIDE',
      reason: config.overrideReason || 'Dibuka manual oleh Administrator MPP Simpurusiang.',
      todayScheduleDesc: 'Status Override: Pelayanan Aktif (Buka Manual)',
      nextOpenTimeDesc: 'Sedang Beroperasi',
      overrideMode: 'force_open',
    };
  }

  if (config.overrideMode === 'force_closed') {
    return {
      isOpen: false,
      canRegister: false,
      statusBadge: 'OVERRIDE',
      reason: config.overrideReason || 'Pelayanan ditutup sementara oleh Administrator MPP.',
      todayScheduleDesc: 'Status Override: Pelayanan Ditutup Sementara',
      nextOpenTimeDesc: config.customClosedNotice || 'Pendaftaran antrean ditutup sementara.',
      overrideMode: 'force_closed',
    };
  }

  // 2. Check Calendar Holiday
  const todayHoliday = (config.holidays || []).find(
    (h) => h.isActive && h.date === wita.dateStr
  );

  if (todayHoliday) {
    return {
      isOpen: false,
      canRegister: false,
      statusBadge: 'LIBUR',
      reason: `Hari ini Libur Resmi: ${todayHoliday.name}`,
      todayScheduleDesc: `Libur: ${todayHoliday.name}`,
      nextOpenTimeDesc: 'Pelayanan dibuka kembali pada hari kerja berikutnya pukul 07:30 WITA.',
      overrideMode: 'auto',
    };
  }

  // 3. Check Weekly Day Schedule
  const todaySchedule = config.weeklySchedule[wita.dayKey];

  if (!todaySchedule || !todaySchedule.isOpen) {
    return {
      isOpen: false,
      canRegister: false,
      statusBadge: 'LIBUR',
      reason: `Pelayanan tutup pada hari ${wita.dayName} (Libur Akhir Pekan).`,
      todayScheduleDesc: `${wita.dayName}: Libur (Tutup)`,
      nextOpenTimeDesc: 'Pelayanan dibuka kembali hari Senin pukul 07:30 WITA.',
      overrideMode: 'auto',
    };
  }

  // 4. Compare current WITA time with opening hours
  const [openH, openM] = todaySchedule.openTime.split(':').map(Number);
  const [closeH, closeM] = todaySchedule.closeTime.split(':').map(Number);

  const currentMinutes = wita.hour * 60 + wita.minute;
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (currentMinutes < openMinutes) {
    return {
      isOpen: false,
      canRegister: false,
      statusBadge: 'TUTUP',
      reason: `Pelayanan belum dibuka. Jam operasional hari ini: ${todaySchedule.openTime} - ${todaySchedule.closeTime} WITA.`,
      todayScheduleDesc: `Jadwal Hari Ini: ${todaySchedule.openTime} - ${todaySchedule.closeTime} WITA`,
      nextOpenTimeDesc: `Dibuka pukul ${todaySchedule.openTime} WITA pagi ini.`,
      overrideMode: 'auto',
    };
  }

  if (currentMinutes >= closeMinutes) {
    return {
      isOpen: false,
      canRegister: false,
      statusBadge: 'TUTUP',
      reason: `Pelayanan telah selesai untuk hari ini (Tutup pukul ${todaySchedule.closeTime} WITA).`,
      todayScheduleDesc: `Jadwal Hari Ini: ${todaySchedule.openTime} - ${todaySchedule.closeTime} WITA`,
      nextOpenTimeDesc: 'Pelayanan dibuka kembali hari kerja berikutnya pukul 07:30 WITA.',
      overrideMode: 'auto',
    };
  }

  // Open and operational
  return {
    isOpen: true,
    canRegister: true,
    statusBadge: 'BUKA',
    reason: `Pelayanan MPP Simpurusiang sedang beroperasi (${todaySchedule.openTime} - ${todaySchedule.closeTime} WITA).`,
    todayScheduleDesc: `Jadwal Hari Ini: ${todaySchedule.openTime} - ${todaySchedule.closeTime} WITA`,
    nextOpenTimeDesc: `Pelayanan buka sampai pukul ${todaySchedule.closeTime} WITA`,
    overrideMode: 'auto',
  };
}

/**
 * Formats tenant code and sequential integer into standardized MPP ticket number
 * Example: tenantCode = "DPMPTSP", queueNumber = 1 => "DPMPTSP-001" (display: "DPMPTSP : 001")
 */
export function formatMppQueueNumber(
  tenantCode: string,
  queueNumber: number,
  isPriority: boolean = false
): {
  ticketCode: string;
  displayLabel: string;
  formattedNumber: string;
} {
  const cleanCode = (tenantCode || 'MPP').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const padded = String(Math.max(1, queueNumber)).padStart(3, '0');

  if (isPriority) {
    return {
      ticketCode: `P-${cleanCode}-${padded}`,
      displayLabel: `PRIORITAS ${cleanCode} : ${padded}`,
      formattedNumber: padded,
    };
  }

  return {
    ticketCode: `${cleanCode}-${padded}`,
    displayLabel: `${cleanCode} : ${padded}`,
    formattedNumber: padded,
  };
}

/**
 * Performs daily queue reset action
 */
export async function performDailyQueueReset(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const today = getWitaDateTime().dateStr;

    // Mark previous dates' active or waiting queues as expired
    const { error: expireError } = await supabase
      .from('mpp_queues')
      .update({ status: 'batal' })
      .lt('queue_date', today)
      .in('status', ['menunggu', 'dipanggil']);

    if (expireError) {
      console.warn('[MPP Schedule] Notice during queue reset:', expireError.message);
    }

    const config = getLocalQueueScheduleConfig();
    const updated = {
      ...config,
      lastResetDate: today,
    };
    await saveQueueScheduleConfig(updated);

    return {
      success: true,
      message: `Nomor antrean berhasil di-reset untuk tanggal ${today}. Seluruh gerai siap melayani antrean hari ini.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Gagal mereset nomor antrean.',
    };
  }
}

export default {
  getWitaDateTime,
  getLocalQueueScheduleConfig,
  fetchQueueScheduleConfigFromRemote,
  saveQueueScheduleConfig,
  evaluateQueueOperationalStatus,
  formatMppQueueNumber,
  performDailyQueueReset,
  DEFAULT_MPP_QUEUE_CONFIG,
};
