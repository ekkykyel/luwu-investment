import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Car,
  MapPin,
  Clock,
  CheckCircle2,
  Zap,
  Wifi,
  WifiOff,
  ArrowRight,
  ChevronRight,
  MessageCircle,
  Ticket,
  RefreshCw,
  AlertCircle,
  Calendar,
  Building2
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import {
  fetchMppMobileSchedules,
  type MppMobileSchedule
} from './MppMobileScheduleAdminManager';

export interface ExpressAgencyOption {
  agencyName: string;
  serviceName: string;
  loketLabel: string;
}

interface MppBestPracticesAdoptionProps {
  isDark?: boolean;
  isLiteMode?: boolean;
  onToggleLiteMode?: () => void;
  activeTicketNumber?: string | null;
  expressAgencies?: ExpressAgencyOption[];
  onOpenQueueModal?: (serviceName?: string, agencyName?: string) => void;
}

function sanitizeWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return '628114200999';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('62')) return digits;
  return `62${digits}`;
}

export const MppBestPracticesAdoption: React.FC<MppBestPracticesAdoptionProps> = ({
  isDark = true,
  isLiteMode: controlledLiteMode,
  onToggleLiteMode,
  activeTicketNumber,
  expressAgencies,
  onOpenQueueModal
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'keliling' | 'drivethru' | 'akses_cepat'>('keliling');

  // State jadwal riil dari Supabase mpp_mobile_schedules (Doktrin Zero Dummy & Honest Fallback)
  const [schedules, setSchedules] = useState<MppMobileSchedule[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState<boolean>(true);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);

  // State kontak WhatsApp resmi dari tabel Supabase mpp_contacts
  const [officialWaDisplay, setOfficialWaDisplay] = useState<string>('+62 811-4200-999');
  const [officialWaDigits, setOfficialWaDigits] = useState<string>('628114200999');
  const [waTopic, setWaTopic] = useState<'drivethru' | 'antrean' | 'syarat'>('drivethru');
  const [ticketOrNikRef, setTicketOrNikRef] = useState<string>(activeTicketNumber || '');

  // Fallback internal Lite Mode jika tidak dikontrol dari parent
  const [internalLiteMode, setInternalLiteMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('mpp_lite_mode') === 'true' || document.body.classList.contains('mpp-lite-mode');
  });

  const isLiteActive = controlledLiteMode !== undefined ? controlledLiteMode : internalLiteMode;

  useEffect(() => {
    if (activeTicketNumber && !ticketOrNikRef) {
      setTicketOrNikRef(activeTicketNumber);
    }
  }, [activeTicketNumber, ticketOrNikRef]);

  const loadMobileSchedules = useCallback(async () => {
    setIsLoadingSchedules(true);
    setScheduleError(null);
    const res = await fetchMppMobileSchedules(false);
    setSchedules(res.data);
    if (res.data.length > 0) {
      setSelectedScheduleId(prev =>
        prev && res.data.some(s => s.id === prev) ? prev : res.data[0].id
      );
    } else {
      setSelectedScheduleId(null);
    }
    if (res.error) {
      setScheduleError(res.error);
    }
    setIsLoadingSchedules(false);
  }, []);

  const loadOfficialContacts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('mpp_contacts')
        .select('*')
        .eq('is_active', true);

      if (!error && Array.isArray(data) && data.length > 0) {
        const waRow = data.find(
          (c: any) =>
            String(c.channel_name || '').toLowerCase().includes('whatsapp') ||
            String(c.channel_name || '').toLowerCase().includes('wa') ||
            String(c.value || '').trim().startsWith('+62') ||
            String(c.value || '').trim().startsWith('08')
        );
        if (waRow && waRow.value) {
          setOfficialWaDisplay(String(waRow.value).trim());
          setOfficialWaDigits(sanitizeWhatsAppNumber(String(waRow.value)));
        }
      }
    } catch {
      // Gunakan kontak default resmi MPP jika jaringan melambat
    }
  }, []);

  useEffect(() => {
    loadMobileSchedules();
    loadOfficialContacts();

    const handleScheduleRefresh = () => {
      loadMobileSchedules();
    };
    window.addEventListener('mpp-mobile-schedules-updated', handleScheduleRefresh);

    const channel = supabase
      .channel('public-mpp-mobile-schedules')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mpp_mobile_schedules' },
        () => {
          loadMobileSchedules();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('mpp-mobile-schedules-updated', handleScheduleRefresh);
      supabase.removeChannel(channel);
    };
  }, [loadMobileSchedules, loadOfficialContacts]);

  const handleToggleLite = () => {
    if (onToggleLiteMode) {
      onToggleLiteMode();
      return;
    }
    const next = !internalLiteMode;
    setInternalLiteMode(next);
    if (next) {
      document.body.classList.add('mpp-lite-mode');
      localStorage.setItem('mpp_lite_mode', 'true');
    } else {
      document.body.classList.remove('mpp-lite-mode');
      localStorage.setItem('mpp_lite_mode', 'false');
    }
  };

  const buildOfficialWhatsAppUrl = () => {
    const refPart = ticketOrNikRef.trim() ? ` (Ref: ${ticketOrNikRef.trim()})` : '';
    const messageMap: Record<'drivethru' | 'antrean' | 'syarat', string> = {
      drivethru: `${t('mppPortal.bestPractices.driveThru.msgDriveThru', 'Halo Petugas Front Office MPP Simpurusiang Luwu, saya ingin mengonfirmasi kesiapan pengambilan berkas di Loket Drive-Thru Belopa')}${refPart}.`,
      antrean: `${t('mppPortal.bestPractices.driveThru.msgAntrean', 'Halo Petugas Front Office MPP Simpurusiang Luwu, saya ingin menanyakan status antrean loket hari ini')}${refPart}.`,
      syarat: `${t('mppPortal.bestPractices.driveThru.msgSyarat', 'Halo Petugas Front Office MPP Simpurusiang Luwu, saya membutuhkan bantuan pengecekan kelengkapan dokumen persyaratan layanan')}${refPart}.`
    };
    return `https://wa.me/${officialWaDigits}?text=${encodeURIComponent(messageMap[waTopic])}`;
  };

  const selectedSchedule = schedules.find(s => s.id === selectedScheduleId) || schedules[0] || null;

  const priorityShortcuts: ExpressAgencyOption[] =
    expressAgencies && expressAgencies.length > 0
      ? expressAgencies.slice(0, 4)
      : [
          {
            agencyName: 'Dinas Kependudukan dan Pencatatan Sipil',
            serviceName: 'Perekaman & Cetak KTP-el / Kartu Keluarga',
            loketLabel: 'Gerai Dukcapil'
          },
          {
            agencyName: 'DPMPTSP Kabupaten Luwu',
            serviceName: 'Penerbitan NIB & Perizinan Berusaha OSS',
            loketLabel: 'Gerai DPMPTSP'
          },
          {
            agencyName: 'Badan Pendapatan Daerah',
            serviceName: 'Layanan Pajak Daerah & PBB-P2',
            loketLabel: 'Gerai Bapenda'
          },
          {
            agencyName: 'BPJS Kesehatan',
            serviceName: 'Pendaftaran & Perubahan Data Peserta JKN',
            loketLabel: 'Gerai BPJS'
          }
        ];

  return (
    <section
      id="layanan-jangkauan"
      className="w-full max-w-7xl mx-auto py-8 sm:py-12 px-2.5 sm:px-6 lg:px-8 scroll-mt-36"
    >
      <div className="max-w-2xl mx-auto text-center mb-6 sm:mb-8 space-y-2">
        <div className="inline-flex items-center justify-center gap-2 text-[11px] sm:text-xs font-bold tracking-[0.14em] uppercase text-[#0F6B4F] dark:text-[#6EE7B7]">
          <span aria-hidden="true" className="w-1.5 h-1.5 rotate-45 bg-[#C9A24B]" />
          <span>{t('mppPortal.bestPractices.eyebrow', 'Jangkauan Wilayah · Layanan Cepat · Akses Ringan')}</span>
          <span aria-hidden="true" className="w-1.5 h-1.5 rotate-45 bg-[#C9A24B]" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight text-balance">
          {t('mppPortal.bestPractices.title', 'Layanan Keliling Kecamatan, Drive-Thru & Akses Cepat Warga')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {t('mppPortal.bestPractices.subtitle', 'Kemudahan layanan jemput bola bagi warga di luar Belopa, pengambilan dokumen cepat tanpa turun kendaraan, serta pintasan antrean resmi.')}
        </p>
      </div>

      {/* Segmented Control — Warm Alabaster & Nocturnal Slate */}
      <div className="flex justify-center mb-6">
        <div
          role="tablist"
          aria-label="Kategori Layanan Kemudahan Warga"
          className={`inline-flex items-center gap-1.5 p-1.5 rounded-2xl border overflow-x-auto max-w-full no-scrollbar ${
            isDark
              ? 'bg-[#0B2035] border-white/[0.08]'
              : 'bg-[#EFECE3] border-[#DFD8C8]'
          }`}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'keliling'}
            onClick={() => setActiveTab('keliling')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'keliling'
                ? 'bg-[#0F6B4F] dark:bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4 shrink-0" />
            <span>{t('mppPortal.bestPractices.tabKeliling', 'Jadwal Keliling Kecamatan')}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'drivethru'}
            onClick={() => setActiveTab('drivethru')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'drivethru'
                ? 'bg-[#0F6B4F] dark:bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Car className="w-4 h-4 shrink-0" />
            <span>{t('mppPortal.bestPractices.tabDriveThru', 'Loket Drive-Thru & Kontak FO')}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'akses_cepat'}
            onClick={() => setActiveTab('akses_cepat')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'akses_cepat'
                ? 'bg-[#0F6B4F] dark:bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 shrink-0" />
            <span>{t('mppPortal.bestPractices.tabAksesCepat', 'Pintasan Gerai & Mode Hemat Kuota')}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: JADWAL LAYANAN KELILING (REAL SUPABASE mpp_mobile_schedules + HONEST FALLBACK) */}
      {activeTab === 'keliling' && (
        <div
          className={`p-5 sm:p-6 rounded-2xl sm:rounded-3xl border space-y-5 ${
            isDark
              ? 'bg-[#0C2135] border-white/[0.09] text-slate-100'
              : 'bg-white border-[#E5DFD3] text-slate-900 shadow-[0_6px_22px_-10px_rgba(24,24,27,0.06)]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EFEAE0] dark:border-white/[0.08]">
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                {t('mppPortal.bestPractices.keliling.title', 'Jadwal Mobil Pelayanan Keliling & Hub Kecamatan')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {t('mppPortal.bestPractices.keliling.subtitle', 'Data jadwal ditarik langsung dari basis data operasional MPP Kabupaten Luwu.')}
              </p>
            </div>
            <button
              type="button"
              onClick={loadMobileSchedules}
              className={`self-start sm:self-auto min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-[#132E48] border-white/10 text-slate-200 hover:bg-[#193B5C]'
                  : 'bg-[#FAF8F3] border-[#DFD8CA] text-slate-700 hover:bg-[#F2EFE7]'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#0F6B4F] dark:text-emerald-400 ${isLoadingSchedules ? 'animate-spin' : ''}`} />
              <span>{t('mppPortal.bestPractices.keliling.refreshBtn', 'Perbarui Jadwal')}</span>
            </button>
          </div>

          {scheduleError && (
            <div className="p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{t('mppPortal.bestPractices.keliling.errorPrefix', 'Gagal terhubung ke database jadwal layanan keliling:')} {scheduleError}</span>
            </div>
          )}

          {isLoadingSchedules ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              {t('mppPortal.bestPractices.keliling.loading', 'Memuat jadwal resmi kunjungan kecamatan dari database...')}
            </div>
          ) : schedules.length === 0 ? (
            <div
              className={`p-5 sm:p-6 rounded-2xl border flex flex-col lg:flex-row items-center justify-between gap-5 text-center lg:text-left ${
                isDark
                  ? 'bg-[#132E48]/60 border-white/[0.08]'
                  : 'bg-[#FAF8F3] border-[#E5DFD3]'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4 max-w-2xl">
                <div className="w-11 h-11 rounded-xl bg-[#C9A24B]/15 text-[#855A14] dark:text-[#E2C475] flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {t('mppPortal.bestPractices.keliling.emptyTitle', 'Belum Ada Jadwal Layanan Keliling Aktif Periode Ini')}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {t('mppPortal.bestPractices.keliling.emptyDesc', 'Admin MPP belum menerbitkan jadwal kunjungan mobil layanan keliling terbaru. Anda tetap dapat mendaftar antrean online di Gedung MPP Simpurusiang Belopa atau menanyakan jadwal berikutnya ke Front Office.')}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenQueueModal?.()}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-[#0F6B4F] hover:bg-[#0B543E] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Ticket className="w-4 h-4" />
                  <span>{t('mppPortal.bestPractices.keliling.queueBtnMpp', 'Ambil Antrean Gedung MPP')}</span>
                </button>
                <a
                  href={`https://wa.me/${officialWaDigits}?text=${encodeURIComponent(
                    t('mppPortal.bestPractices.driveThru.msgAntrean', 'Halo Petugas Front Office MPP Simpurusiang Luwu, mohon informasi jadwal Mobil Pelayanan Keliling kecamatan terdekat berikutnya. Terima kasih.')
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                    isDark
                      ? 'bg-[#0C2135] border-white/10 text-slate-200 hover:bg-[#153452]'
                      : 'bg-white border-[#DFD8CA] text-slate-700 hover:bg-[#F2EFE7]'
                  }`}
                >
                  <MessageCircle className="w-4 h-4 text-[#0F6B4F] dark:text-emerald-400" />
                  <span>{t('mppPortal.bestPractices.keliling.askWaFo', 'Tanya Jadwal via WA FO')}</span>
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schedules.map((item) => {
                  const isSelected = selectedSchedule?.id === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setSelectedScheduleId(item.id)}
                      className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10'
                          : isDark
                            ? 'bg-slate-900/50 border-white/10 hover:border-white/20'
                            : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                          {t('mppPortal.bestPractices.keliling.districtPrefix', 'Kecamatan')} {item.kecamatan} · {item.hari_operasional}
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.lokasi}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.jam_operasional}</span>
                          <span>·</span>
                          <span className="font-mono tabular-nums">{t('mppPortal.bestPractices.keliling.quotaPrefix', 'Kuota')} {item.kuota_harian}</span>
                        </div>
                      </div>

                      {Array.isArray(item.layanan_tersedia) && item.layanan_tersedia.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/70 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {item.layanan_tersedia.join(' · ')}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedSchedule && (
                <div
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDark
                      ? 'bg-slate-900/80 border-emerald-500/30'
                      : 'bg-emerald-50/60 border-emerald-200'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {t('mppPortal.bestPractices.keliling.selectedQueueTitle', 'Daftar Antrean Kunjungan Kecamatan')} {selectedSchedule.kecamatan}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      {selectedSchedule.lokasi} · {selectedSchedule.hari_operasional} ({selectedSchedule.jam_operasional})
                      {selectedSchedule.catatan_warga ? ` · ${selectedSchedule.catatan_warga}` : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenQueueModal?.(
                        selectedSchedule.layanan_tersedia?.[0] || `Layanan Keliling Kec. ${selectedSchedule.kecamatan}`,
                        `Layanan Keliling - Kec. ${selectedSchedule.kecamatan}`
                      )
                    }
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>{t('mppPortal.bestPractices.keliling.takeQueueThisLocation', 'Ambil Antrean Lokasi Ini')}</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 2: LOKET DRIVE-THRU & KONFIRMASI WHATSAPP RESMI FO (ZERO PLACEBO) */}
      {activeTab === 'drivethru' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card 1: Panduan Loket Drive-Thru Belopa */}
          <div
            className={`p-5 sm:p-6 rounded-3xl border flex flex-col justify-between space-y-5 ${
              isDark
                ? 'bg-[#0F2942] border-white/10 text-slate-100'
                : 'bg-white border-slate-200/90 text-slate-900 shadow-xs'
            }`}
          >
            <div className="space-y-3">
              <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                {t('mppPortal.bestPractices.driveThru.badge', 'Pengambilan Berkas Siap Serah · Kompleks Perkantoran Belopa')}
              </div>
              <h3 className="text-lg font-bold">
                {t('mppPortal.bestPractices.driveThru.title', 'Loket Drive-Thru Dokumen Selesai')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('mppPortal.bestPractices.driveThru.desc', 'Pemohon yang status berkasnya pada menu Lacak Berkas telah dinyatakan selesai (KTP-el, KIA, atau SK Izin Usaha cetak) dapat mengambil dokumen di jalur timur Gedung MPP Simpurusiang tanpa perlu mengantre ulang di dalam lobi.')}
              </p>

              <div className="space-y-2 pt-1 text-xs text-slate-700 dark:text-slate-200">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{t('mppPortal.bestPractices.driveThru.p1', 'Siapkan KTP asli pemohon dan bukti QR tiket atau nomor resi permohonan.')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{t('mppPortal.bestPractices.driveThru.p2', 'Jam layanan pengambilan: Senin–Jumat pukul 08.00–15.30 WITA.')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{t('mppPortal.bestPractices.driveThru.p3', 'Pastikan status dokumen sudah Siap Diambil melalui pelacak resi atau konfirmasi WA FO di samping.')}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t('mppPortal.bestPractices.driveThru.address', 'Jl. Simpurusiang, Senga, Kec. Belopa')}
              </span>
              <a
                href="#tracking-berkas"
                className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition hover:opacity-90 inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>{t('mppPortal.bestPractices.driveThru.checkStatusBtn', 'Cek Status Berkas')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Card 2: Konfirmasi Langsung ke WhatsApp Resmi Front Office (Real Click-to-WA, Zero Fake Bot) */}
          <div
            className={`p-5 sm:p-6 rounded-3xl border flex flex-col justify-between space-y-5 ${
              isDark
                ? 'bg-[#0F2942] border-white/10 text-slate-100'
                : 'bg-white border-slate-200/90 text-slate-900 shadow-xs'
            }`}
          >
            <div className="space-y-3">
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {t('mppPortal.bestPractices.driveThru.waBadge', 'Kontak Resmi Terverifikasi')} · {officialWaDisplay}
              </div>
              <h3 className="text-lg font-bold">
                {t('mppPortal.bestPractices.driveThru.waTitle', 'Konfirmasi Cepat via WhatsApp Front Office')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('mppPortal.bestPractices.driveThru.waDesc', 'Terhubung langsung ke percakapan WhatsApp petugas Front Office MPP Simpurusiang (bukan simulasi bot otomatis) untuk memastikan berkas siap diambil atau menanyakan antrean loket.')}
              </p>

              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('mppPortal.bestPractices.driveThru.topicLabel', 'Keperluan Konfirmasi')}
                  </label>
                  <select
                    value={waTopic}
                    onChange={(e) => setWaTopic(e.target.value as 'drivethru' | 'antrean' | 'syarat')}
                    className={`w-full min-h-[44px] px-3 py-2 rounded-xl border text-xs font-medium ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="drivethru">{t('mppPortal.bestPractices.driveThru.topicDriveThru', 'Konfirmasi Pengambilan Berkas Drive-Thru')}</option>
                    <option value="antrean">{t('mppPortal.bestPractices.driveThru.topicAntrean', 'Cek Status Panggilan Antrean Loket')}</option>
                    <option value="syarat">{t('mppPortal.bestPractices.driveThru.topicSyarat', 'Tanya Kelengkapan Dokumen Persyaratan')}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('mppPortal.bestPractices.driveThru.refLabel', 'Nomor Tiket / Resi Berkas (Opsional)')}
                  </label>
                  <input
                    type="text"
                    value={ticketOrNikRef}
                    onChange={(e) => setTicketOrNikRef(e.target.value)}
                    placeholder={t('mppPortal.bestPractices.driveThru.refPlaceholder', 'Contoh: A-012 atau nomor resi permohonan')}
                    className={`w-full min-h-[44px] px-3 py-2 rounded-xl border text-xs font-mono ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t('mppPortal.bestPractices.driveThru.hours', 'Jam respons petugas: hari kerja 07.30–16.00 WITA')}
              </span>
              <a
                href={buildOfficialWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{t('mppPortal.bestPractices.driveThru.sendWaBtn', 'Kirim WhatsApp ke FO')}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PINTASAN ANTREAN NYATA (mpp_queues) & MODE HEMAT KUOTA (REAL CSS LITE MODE) */}
      {activeTab === 'akses_cepat' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card 1: Pintasan Gerai Prioritas -> Membuka Formulir Antrean Resmi mpp_queues */}
          <div
            className={`p-5 sm:p-6 rounded-3xl border flex flex-col justify-between space-y-5 ${
              isDark
                ? 'bg-[#0F2942] border-white/10 text-slate-100'
                : 'bg-white border-slate-200/90 text-slate-900 shadow-xs'
            }`}
          >
            <div className="space-y-3">
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {t('mppPortal.bestPractices.fastAccess.connectedBadge', 'Terhubung Langsung ke Database Antrean Loket')}
              </div>
              <h3 className="text-lg font-bold">
                {t('mppPortal.bestPractices.fastAccess.title', 'Pintasan Ambil Antrean Gerai Utama')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('mppPortal.bestPractices.fastAccess.desc', 'Pilih gerai yang paling sering dikunjungi untuk langsung membuka formulir tiket antrean resmi dengan instansi yang sudah terisi otomatis, lengkap dengan struk QR Code cetak.')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {priorityShortcuts.map((item, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => onOpenQueueModal?.(item.serviceName, item.agencyName)}
                    className={`min-h-[56px] p-3 rounded-2xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                      isDark
                        ? 'bg-slate-900/70 border-white/10 hover:border-emerald-500/50'
                        : 'bg-slate-50 border-slate-200 hover:border-emerald-500'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                        {item.loketLabel}
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.serviceName}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t('mppPortal.bestPractices.fastAccess.footerNotice', 'Tiket tersimpan ke antrean aktif hari ini')}
              </span>
              <button
                type="button"
                onClick={() => onOpenQueueModal?.()}
                className="min-h-[40px] text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{t('mppPortal.bestPractices.fastAccess.allAgenciesBtn', 'Pilih Semua Instansi')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Mode Hemat Kuota & Perangkat Ringan (Real CSS & State Persistence) */}
          <div
            className={`p-5 sm:p-6 rounded-3xl border flex flex-col justify-between space-y-5 ${
              isDark
                ? 'bg-[#0F2942] border-white/10 text-slate-100'
                : 'bg-white border-slate-200/90 text-slate-900 shadow-xs'
            }`}
          >
            <div className="space-y-3">
              <div className="text-xs font-semibold text-sky-700 dark:text-sky-400">
                {t('mppPortal.bestPractices.fastAccess.liteBadge', 'Optimasi Ponsel Android & Jaringan Pedesaan')}
              </div>
              <h3 className="text-lg font-bold">
                {t('mppPortal.bestPractices.fastAccess.liteTitle', 'Mode Tampilan Ringan (Hemat Kuota & Baterai)')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('mppPortal.bestPractices.fastAccess.liteDesc', 'Menonaktifkan efek kabur latar (backdrop blur), bayangan berat, serta transisi animasi sehingga navigasi tetap responsif pada ponsel RAM rendah maupun sinyal 3G di wilayah pegunungan Luwu.')}
              </p>

              <div
                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                  isDark
                    ? 'bg-slate-900/70 border-white/10'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    {isLiteActive ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {isLiteActive ? t('mppPortal.bestPractices.fastAccess.liteActive', 'Mode Ringan Sedang Aktif') : t('mppPortal.bestPractices.fastAccess.standardActive', 'Mode Visual Standar Aktif')}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {isLiteActive
                        ? t('mppPortal.bestPractices.fastAccess.liteDescActive', 'Efek grafis berat dan animasi telah dimatikan')
                        : t('mppPortal.bestPractices.fastAccess.standardDescActive', 'Seluruh transisi visual interaktif ditampilkan')}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleLite}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                    isLiteActive
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isLiteActive ? t('mppPortal.bestPractices.fastAccess.btnBackToStandard', 'Kembali ke Standar') : t('mppPortal.bestPractices.fastAccess.btnEnableLite', 'Aktifkan Mode Ringan')}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/80 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
              {t('mppPortal.bestPractices.fastAccess.settingsPersistNotice', 'Pengaturan tersimpan otomatis pada peramban perangkat Anda dan juga tersedia pada bilah atas halaman.')}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default MppBestPracticesAdoption;
