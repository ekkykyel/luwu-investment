import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  Clock,
  Calendar,
  ShieldAlert,
  Power,
  RotateCcw,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Radio,
  Building2,
  Sparkles,
  RefreshCw,
  Info,
  CalendarDays,
  FileSpreadsheet
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import {
  MppQueueScheduleConfig,
  MppHolidayItem,
  MppQueueOperationalStatus,
  DEFAULT_MPP_QUEUE_CONFIG,
  getWitaDateTime,
  getLocalQueueScheduleConfig,
  fetchQueueScheduleConfigFromRemote,
  saveQueueScheduleConfig,
  evaluateQueueOperationalStatus,
  performDailyQueueReset,
  formatMppQueueNumber
} from '../../../services/mppQueueScheduleService';

interface Props {
  isDark?: boolean;
}

export default function MppQueueScheduleAdmin({ isDark = true }: Props) {
  const [config, setConfig] = useState<MppQueueScheduleConfig>(getLocalQueueScheduleConfig());
  const [status, setStatus] = useState<MppQueueOperationalStatus>(evaluateQueueOperationalStatus(config));
  const [witaNow, setWitaNow] = useState(getWitaDateTime());
  const [activeTab, setActiveTab] = useState<'jadwal' | 'libur' | 'nomor-antrean'>('jadwal');
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [tenantStats, setTenantStats] = useState<any[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);

  // Form Hari Libur Baru
  const [newHoliday, setNewHoliday] = useState<{
    date: string;
    name: string;
    category: 'nasional' | 'cuti_bersama' | 'keagamaan';
    description: string;
  }>({
    date: getWitaDateTime().dateStr,
    name: '',
    category: 'nasional',
    description: ''
  });

  const [holidayFilter, setHolidayFilter] = useState<'all' | 'nasional' | 'cuti_bersama' | 'keagamaan'>('all');

  // 1. Live Clock Timer WITA (Berdetak setiap detik)
  useEffect(() => {
    const timer = setInterval(() => {
      const current = getWitaDateTime();
      setWitaNow(current);
      setStatus(evaluateQueueOperationalStatus(config));
    }, 1000);
    return () => clearInterval(timer);
  }, [config]);

  // 2. Fetch Initial Config dari Supabase & Listener
  useEffect(() => {
    const initConfig = async () => {
      const remote = await fetchQueueScheduleConfigFromRemote();
      setConfig(remote);
      setStatus(evaluateQueueOperationalStatus(remote));
    };
    initConfig();

    // Event listener untuk update instan antar-tab
    const handleConfigUpdate = (e: any) => {
      if (e.detail) {
        setConfig(e.detail);
        setStatus(evaluateQueueOperationalStatus(e.detail));
      }
    };
    window.addEventListener('mpp_queue_schedule_updated', handleConfigUpdate);
    return () => window.removeEventListener('mpp_queue_schedule_updated', handleConfigUpdate);
  }, []);

  // 3. Fetch Tenant Queues Live Status Hari Ini
  const loadTenantStats = async () => {
    setLoadingTenants(true);
    try {
      const today = getWitaDateTime().dateStr;
      const { data: tenants } = await supabase
        .from('mpp_tenants')
        .select('id, name, code, floor')
        .eq('is_active', true)
        .order('name');

      if (!tenants || tenants.length === 0) {
        setTenantStats([]);
        return;
      }

      // Fetch antrean hari ini
      const { data: todayQueues } = await supabase
        .from('mpp_queues')
        .select('tenant_id, queue_number, ticket_code, status')
        .eq('queue_date', today);

      const mapped = tenants.map((t) => {
        const qList = (todayQueues || []).filter((q) => q.tenant_id === t.id);
        const maxNum = qList.reduce((max, cur) => Math.max(max, Number(cur.queue_number) || 0), 0);
        const serving = qList.find((q) => q.status === 'dilayani' || q.status === 'dipanggil');
        const formattedLast = maxNum > 0 
          ? formatMppQueueNumber(t.code || 'MPP', maxNum).displayLabel 
          : `${(t.code || 'MPP').toUpperCase()} : 000`;

        return {
          id: t.id,
          name: t.name,
          code: (t.code || 'MPP').toUpperCase(),
          totalToday: qList.length,
          lastNumber: maxNum,
          lastNumberLabel: formattedLast,
          currentServing: serving ? serving.ticket_code : '-'
        };
      });

      setTenantStats(mapped);
    } catch (err) {
      console.warn('Error fetching tenant queue stats:', err);
      setTenantStats([]);
    } finally {
      setLoadingTenants(false);
    }
  };

  useEffect(() => {
    loadTenantStats();
  }, []);

  // 4. Handle Save Config
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const success = await saveQueueScheduleConfig(config);
      if (success) {
        setStatus(evaluateQueueOperationalStatus(config));
        Swal.fire({
          icon: 'success',
          title: 'Pengaturan Antrean Tersimpan',
          text: 'Jadwal operasional, hari libur, dan sistem nomor antrean telah disinkronkan ke seluruh sistem dan portal publik MPP.',
          confirmButtonColor: '#059669',
          timer: 2500
        });
      } else {
        throw new Error('Gagal menyimpan konfigurasi');
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: err?.message || 'Terjadi kesalahan sistem',
        confirmButtonColor: '#e11d48'
      });
    } finally {
      setSaving(false);
    }
  };

  // 5. Reset ke Jadwal Default Pemkab Luwu
  const handleRestoreDefaultSchedules = () => {
    Swal.fire({
      title: 'Terapkan Jadwal Resmi Pemkab Luwu?',
      html: `
        <div class="text-left text-xs text-gray-600 dark:text-gray-300 space-y-1 py-2 font-mono">
          <p>• <b>Senin - Kamis:</b> 07:30 - 16:00 WITA</p>
          <p>• <b>Jumat:</b> 07:30 - 16:30 WITA</p>
          <p>• <b>Sabtu & Minggu:</b> Libur (Tutup)</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Terapkan Jadwal Resmi',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#059669'
    }).then((result) => {
      if (result.isConfirmed) {
        const updated = {
          ...config,
          weeklySchedule: { ...DEFAULT_MPP_QUEUE_CONFIG.weeklySchedule }
        };
        setConfig(updated);
        setStatus(evaluateQueueOperationalStatus(updated));
        Swal.fire({
          icon: 'success',
          title: 'Jadwal Direset ke Standar Resmi',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  // 6. Handle Override Mode
  const handleSetOverrideMode = (mode: 'auto' | 'force_open' | 'force_closed', reasonText: string = '') => {
    const updated = {
      ...config,
      overrideMode: mode,
      overrideReason: reasonText
    };
    setConfig(updated);
    setStatus(evaluateQueueOperationalStatus(updated));
  };

  // 7. Handle Tambah Hari Libur
  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHoliday.name.trim() || !newHoliday.date) {
      Swal.fire({
        icon: 'warning',
        title: 'Data Belum Lengkap',
        text: 'Mohon isi tanggal dan nama hari libur / cuti bersama.',
        confirmButtonColor: '#d97706'
      });
      return;
    }

    const item: MppHolidayItem = {
      id: `hol-${Date.now()}`,
      date: newHoliday.date,
      name: newHoliday.name.trim(),
      category: newHoliday.category,
      description: newHoliday.description.trim(),
      isActive: true
    };

    const updated = {
      ...config,
      holidays: [item, ...config.holidays]
    };
    setConfig(updated);
    setStatus(evaluateQueueOperationalStatus(updated));
    setNewHoliday({
      date: getWitaDateTime().dateStr,
      name: '',
      category: 'nasional',
      description: ''
    });

    Swal.fire({
      icon: 'success',
      title: 'Hari Libur Ditambahkan',
      text: `Pendaftaran antrean online otomatis dinonaktifkan pada tanggal ${item.date}.`,
      timer: 2000,
      showConfirmButton: false
    });
  };

  // 8. Toggle Status Hari Libur
  const handleToggleHoliday = (id: string) => {
    const updatedHolidays = config.holidays.map((h) =>
      h.id === id ? { ...h, isActive: !h.isActive } : h
    );
    const updated = { ...config, holidays: updatedHolidays };
    setConfig(updated);
    setStatus(evaluateQueueOperationalStatus(updated));
  };

  // 9. Hapus Hari Libur
  const handleDeleteHoliday = (id: string, name: string) => {
    Swal.fire({
      title: 'Hapus Hari Libur Ini?',
      text: `Apakah Anda yakin ingin menghapus "${name}" dari kalender libur?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#e11d48'
    }).then((res) => {
      if (res.isConfirmed) {
        const updatedHolidays = config.holidays.filter((h) => h.id !== id);
        const updated = { ...config, holidays: updatedHolidays };
        setConfig(updated);
        setStatus(evaluateQueueOperationalStatus(updated));
      }
    });
  };

  // 10. Manual Reset Antrean Hari Ini
  const handleTriggerManualReset = async () => {
    const confirm = await Swal.fire({
      title: 'Reset Nomor Antrean Hari Ini?',
      html: `
        <div class="text-left text-xs text-gray-600 dark:text-gray-300 space-y-2">
          <p>Tindakan ini akan mengeset ulang antrean hari ini:</p>
          <p class="font-bold text-emerald-600 dark:text-emerald-400">• Seluruh gerai (DPMPTSP, Dukcapil, Samsat, dll.) akan memulai nomor antrean berurut baru dari <b>001</b>.</p>
          <p>• Tiket sisa dari hari sebelumnya yang belum selesai akan ditandai sebagai kedaluwarsa.</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Reset Antrean',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#059669'
    });

    if (confirm.isConfirmed) {
      setResetting(true);
      const res = await performDailyQueueReset();
      setResetting(false);

      if (res.success) {
        await loadTenantStats();
        Swal.fire({
          icon: 'success',
          title: 'Reset Antrean Berhasil',
          text: res.message,
          confirmButtonColor: '#059669'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Reset Gagal',
          text: res.message,
          confirmButtonColor: '#e11d48'
        });
      }
    }
  };

  const filteredHolidays = config.holidays.filter((h) => {
    if (holidayFilter === 'all') return true;
    return h.category === holidayFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* ── TOP HEADER & LIVE CLOCK (WITA) ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
              Sistem Operasional MPP Luwu
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300">
              Zona WITA (UTC+8)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Jadwal & Pengaturan Operasional Antrean
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Kendali otomatis jam buka-tutup pelayanan, kalender hari libur nasional & keagamaan, serta reset nomor antrean harian berurut.
          </p>
        </div>

        {/* Live Clock Card */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 dark:from-emerald-950/40 dark:to-slate-900 p-3 sm:p-4 rounded-xl border border-emerald-500/20 dark:border-emerald-500/30">
          <Clock className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-pulse shrink-0" />
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">
              Waktu Resmi MPP Luwu (WITA)
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-gray-900 dark:text-white tracking-wider">
              {witaNow.fullTimeStr} <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">WITA</span>
            </div>
            <div className="text-[11px] font-medium text-gray-600 dark:text-gray-300">
              {witaNow.formattedFullWita.split(',')[0]}
            </div>
          </div>
        </div>
      </div>

      {/* ── STATUS OPERASIONAL SAAT INI (REALTIME BANNER) ── */}
      <div className={`p-5 rounded-2xl border transition-all ${
        status.isOpen 
          ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-600/40' 
          : status.statusBadge === 'LIBUR'
            ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-600/40'
            : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-600/40'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`p-2.5 rounded-xl shrink-0 ${
              status.isOpen 
                ? 'bg-emerald-600 text-white' 
                : status.statusBadge === 'LIBUR'
                  ? 'bg-amber-600 text-white'
                  : 'bg-rose-600 text-white'
            }`}>
              {status.isOpen ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide ${
                  status.isOpen 
                    ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200' 
                    : status.statusBadge === 'LIBUR'
                      ? 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200'
                      : 'bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-200'
                }`}>
                  STATUS: {status.statusBadge}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  • {status.todayScheduleDesc}
                </span>
                {status.overrideMode !== 'auto' && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border border-blue-300">
                    OVERRIDE ADMIN
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">
                {status.reason}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {status.nextOpenTimeDesc}
              </p>
            </div>
          </div>

          {/* Quick Override Buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              onClick={() => handleSetOverrideMode('auto')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                config.overrideMode === 'auto'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Otomatis (Jadwal)</span>
            </button>

            <button
              onClick={() => handleSetOverrideMode('force_open', 'Dibuka manual oleh Admin MPP')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                config.overrideMode === 'force_open'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Paksa Buka</span>
            </button>

            <button
              onClick={() => handleSetOverrideMode('force_closed', 'Ditutup manual oleh Admin MPP (Pemeliharaan / Darurat)')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                config.overrideMode === 'force_closed'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>Tutup Sementara</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── TABS NAVIGATION ── */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('jadwal')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'jadwal'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Jadwal Buka & Tutup Harian</span>
        </button>

        <button
          onClick={() => setActiveTab('libur')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'libur'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Hari Libur Nasional & Cuti ({config.holidays.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('nomor-antrean')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'nomor-antrean'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Logika Nomor & Reset Harian</span>
        </button>
      </div>

      {/* ── TAB 1: JADWAL BUKA & TUTUP HARIAN ── */}
      {activeTab === 'jadwal' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Jadwal Pelayanan Mingguan Resmi Pemkab Luwu</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Jam pelayanan buka otomatis mulai pukul 07:30 WITA dan tutup otomatis pada pukul 16:00 WITA (Jumat: 16:30 WITA).
                </p>
              </div>

              <button
                type="button"
                onClick={handleRestoreDefaultSchedules}
                className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 text-xs font-semibold flex items-center gap-1.5 transition-all self-start cursor-pointer border border-gray-300 dark:border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Pulihkan Jadwal Resmi</span>
              </button>
            </div>

            {/* Tabel Hari & Jam Operasional */}
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-slate-800/80 text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider border-b border-gray-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Hari</th>
                    <th className="py-3 px-4">Status Layanan</th>
                    <th className="py-3 px-4">Jam Buka (WITA)</th>
                    <th className="py-3 px-4">Jam Tutup (WITA)</th>
                    <th className="py-3 px-4 text-right">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-700 dark:text-gray-200">
                  {(Object.keys(config.weeklySchedule) as (keyof MppQueueScheduleConfig['weeklySchedule'])[]).map((dayKey) => {
                    const day = config.weeklySchedule[dayKey];
                    const isToday = witaNow.dayKey === dayKey;
                    return (
                      <tr key={dayKey} className={`hover:bg-gray-50/50 dark:hover:bg-slate-800/40 ${isToday ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''}`}>
                        <td className="py-3 px-4 font-bold">
                          <div className="flex items-center gap-2">
                            <span>{day.label}</span>
                            {isToday && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-600 text-white font-mono font-bold">
                                HARI INI
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={day.isOpen}
                              onChange={(e) => {
                                const updated = {
                                  ...config,
                                  weeklySchedule: {
                                    ...config.weeklySchedule,
                                    [dayKey]: {
                                      ...day,
                                      isOpen: e.target.checked
                                    }
                                  }
                                };
                                setConfig(updated);
                              }}
                              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                            />
                            <span className={`text-xs font-semibold ${day.isOpen ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {day.isOpen ? 'Buka Pelayanan' : 'Libur (Tutup)'}
                            </span>
                          </label>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="time"
                            value={day.openTime}
                            disabled={!day.isOpen}
                            onChange={(e) => {
                              const updated = {
                                ...config,
                                weeklySchedule: {
                                  ...config.weeklySchedule,
                                  [dayKey]: {
                                    ...day,
                                    openTime: e.target.value
                                  }
                                }
                              };
                              setConfig(updated);
                            }}
                            className="p-1.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs font-bold disabled:opacity-40"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="time"
                            value={day.closeTime}
                            disabled={!day.isOpen}
                            onChange={(e) => {
                              const updated = {
                                ...config,
                                weeklySchedule: {
                                  ...config.weeklySchedule,
                                  [dayKey]: {
                                    ...day,
                                    closeTime: e.target.value
                                  }
                                }
                              };
                              setConfig(updated);
                            }}
                            className="p-1.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs font-bold disabled:opacity-40"
                          />
                        </td>
                        <td className="py-3 px-4 text-right text-gray-500 dark:text-gray-400 font-mono">
                          {day.isOpen ? `${day.openTime} - ${day.closeTime} WITA` : 'Libur Akhir Pekan'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Kuota & Pesan Penutupan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 space-y-2">
                <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                  Batas Kuota Antrean Online Maksimum Per Gerai / Hari
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={config.maxDailyQuotaPerTenant}
                    onChange={(e) => setConfig({ ...config, maxDailyQuotaPerTenant: Number(e.target.value) || 250 })}
                    className="w-32 p-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-mono text-xs font-bold"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">kuota tiket/hari per instansi</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Jika kuota tercapai, pendaftaran online untuk gerai terkait ditutup otomatis pada hari tersebut.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 space-y-2">
                <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                  Pemberitahuan Penutupan Tambahan (Ditampilkan ke Warga)
                </label>
                <input
                  type="text"
                  value={config.customClosedNotice || ''}
                  onChange={(e) => setConfig({ ...config, customClosedNotice: e.target.value })}
                  placeholder="Contoh: Pendaftaran antrean online dibuka setiap hari kerja pukul 07:30 WITA."
                  className="w-full p-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-xs"
                />
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Pesan informasi yang ramah saat warga mengakses pendaftaran di luar jam pelayanan.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: HARI LIBUR NASIONAL & CUTI BERSAMA & KEAGAMAAN ── */}
      {activeTab === 'libur' && (
        <div className="space-y-6">
          {/* Form Tambah Hari Libur */}
          <form onSubmit={handleAddHoliday} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Tambah Hari Libur Nasional / Cuti Bersama / Hari Raya</span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Admin MPP dapat menambahkan tanggal libur resmi. Pada tanggal yang terdaftar dan berstatus aktif, sistem otomatis mematikan mesin ambil antrean online.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Tanggal Libur
                </label>
                <input
                  type="date"
                  required
                  value={newHoliday.date}
                  onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Kategori
                </label>
                <select
                  value={newHoliday.category}
                  onChange={(e: any) => setNewHoliday({ ...newHoliday, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-xs font-semibold"
                >
                  <option value="nasional">Hari Libur Nasional</option>
                  <option value="cuti_bersama">Cuti Bersama</option>
                  <option value="keagamaan">Hari Raya Keagamaan</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Nama Hari Libur / Keterangan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Hari Raya Idul Fitri 1447 Hijriah"
                  value={newHoliday.name}
                  onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambahkan Hari Libur ke Kalender</span>
              </button>
            </div>
          </form>

          {/* Tabel Kalender Libur */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Daftar Hari Libur Terdaftar ({filteredHolidays.length})</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Semua tanggal di bawah ini akan mematikan formulir dan mesin pendaftaran antrean online secara otomatis.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl text-xs self-start">
                <button
                  type="button"
                  onClick={() => setHolidayFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    holidayFilter === 'all' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setHolidayFilter('nasional')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    holidayFilter === 'nasional' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  Nasional
                </button>
                <button
                  type="button"
                  onClick={() => setHolidayFilter('cuti_bersama')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    holidayFilter === 'cuti_bersama' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  Cuti Bersama
                </button>
                <button
                  type="button"
                  onClick={() => setHolidayFilter('keagamaan')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    holidayFilter === 'keagamaan' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  Keagamaan
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-slate-800/80 text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider border-b border-gray-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Nama Hari Libur</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Status Mesin Antrean</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-700 dark:text-gray-200">
                  {filteredHolidays.map((holiday) => {
                    const isTodayHoliday = holiday.date === witaNow.dateStr;
                    return (
                      <tr key={holiday.id} className={`hover:bg-gray-50/50 dark:hover:bg-slate-800/40 ${isTodayHoliday ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}`}>
                        <td className="py-3 px-4 font-mono font-bold whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>{holiday.date}</span>
                            {isTodayHoliday && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-600 text-white font-bold">
                                HARI INI
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          {holiday.name}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            holiday.category === 'nasional'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                              : holiday.category === 'cuti_bersama'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}>
                            {holiday.category === 'nasional' ? 'Nasional' : holiday.category === 'cuti_bersama' ? 'Cuti Bersama' : 'Keagamaan'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleHoliday(holiday.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              holiday.isActive
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400'
                            }`}
                          >
                            {holiday.isActive ? <Lock size={12} /> : <Unlock size={12} />}
                            <span>{holiday.isActive ? 'Pendaftaran Dimatikan' : 'Pendaftaran Aktif'}</span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteHoliday(holiday.id, holiday.name)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all cursor-pointer"
                            title="Hapus hari libur"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredHolidays.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                        Tidak ada data hari libur pada kategori ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: LOGIKA NOMOR ANTREAN & RESET HARIAN ── */}
      {activeTab === 'nomor-antrean' && (
        <div className="space-y-6">
          {/* Card Penjelasan Logika Nomor Antrean Berurut */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Logika Nomor Antrean Berurut & Waktu Berlaku Tiket
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  Berdasarkan standar operasional Mal Pelayanan Publik (MPP) Simpurusiang Pemerintah Kabupaten Luwu:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <RotateCcw className="w-4 h-4" />
                  <span>1. Reset Otomatis Pagi Hari (Pukul 07:30 WITA)</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  Setiap hari kerja pada pukul <b>07:30 WITA</b>, sistem secara otomatis mereset hitungan tiket per gerai. Antrean dimulai dari nomor berurut:
                </p>
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  • Contoh Gerai DPMPTSP : <b>DPMPTSP : 001</b> (Kode: DPMPTSP-001)<br />
                  • Contoh Gerai DISDUKCAPIL : <b>DISDUKCAPIL : 001</b><br />
                  • Contoh Antrean Prioritas : <b>PRIORITAS DPMPTSP : 001</b> (P-DPMPTSP-001)
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <Lock className="w-4 h-4" />
                  <span>2. Penutupan Otomatis Jam Pelayanan</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  Pada saat jam tutup pelayanan (<b>Pukul 16:00 WITA</b> Senin s/d Kamis, dan <b>Pukul 16:30 WITA</b> pada hari Jumat), pendaftaran antrean online DITUTUP total secara otomatis:
                </p>
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 text-xs text-gray-600 dark:text-gray-300">
                  • Mesin antrean & portal publik menampilkan informasi bahwa pendaftaran ditutup.<br />
                  • Menunggu jam pelayanan dibuka kembali pada pukul <b>07:30 WITA</b> hari kerja berikutnya.<br />
                  • Tiket yang telah diambil hanya berlaku untuk hari tanggal kunjungan tersebut.
                </div>
              </div>
            </div>

            {/* Manual Reset Button Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <span>Terakhir di-reset: </span>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                  {config.lastResetDate || 'Belum tercatat'}
                </span>
              </div>

              <button
                type="button"
                disabled={resetting}
                onClick={handleTriggerManualReset}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50 self-start sm:self-auto"
              >
                <RefreshCw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
                <span>{resetting ? 'Mereset Antrean...' : 'Jalankan Reset Antrean Hari Ini Sekarang'}</span>
              </button>
            </div>
          </div>

          {/* Monitor Nomor Antrean Live Per Gerai Hari Ini */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Monitoring Nomor Urut Antrean Per Gerai Hari Ini ({witaNow.dateStr})</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Data antrean riil dari tabel <code>mpp_queues</code> di Supabase. Nomor urut per gerai dimulai dari 001.
                </p>
              </div>

              <button
                type="button"
                onClick={loadTenantStats}
                disabled={loadingTenants}
                className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 transition-all cursor-pointer"
                title="Refresh data antrean"
              >
                <RefreshCw className={`w-4 h-4 ${loadingTenants ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tenantStats.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 space-y-2 hover:border-emerald-500/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                      {t.code}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      {t.totalToday} antrean hari ini
                    </span>
                  </div>

                  <div className="text-xs font-bold text-gray-900 dark:text-white truncate" title={t.name}>
                    {t.name}
                  </div>

                  <div className="pt-2 border-t border-gray-200/60 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 block">Nomor Terakhir:</span>
                      <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-black">
                        {t.lastNumberLabel}
                      </strong>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 block">Sedang Dilayani:</span>
                      <span className="font-mono text-gray-700 dark:text-gray-300 font-bold">
                        {t.currentServing}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {tenantStats.length === 0 && !loadingTenants && (
                <div className="col-span-full py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                  Belum ada data gerai yang terhubung atau antrean belum dimulai.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM ACTION BAR (SIMPAN PERUBAHAN) ── */}
      <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-gray-200 dark:border-slate-800 shadow-lg">
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
          <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="hidden sm:inline">Perubahan akan langsung berlaku pada mesin ambil antrean di lobby & portal web MPP.</span>
          <span className="sm:hidden">Sinkronkan ke sistem live.</span>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={handleSaveAll}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
          <span>{saving ? 'Menyimpan & Menyinkronkan...' : 'Simpan & Sinkronkan ke Portal MPP'}</span>
        </button>
      </div>
    </div>
  );
}
