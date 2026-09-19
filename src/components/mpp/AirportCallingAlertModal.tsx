import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, CheckCircle, Bell, ArrowRight, Sparkles, MapPin, Radio, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { playAirportChime, speakCallingAnnouncement, triggerVibration, requestScreenWakeLock } from '../../utils/airportAudioAlert';

interface AirportCallingAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketNumber: string;
  counterName: string;
  agencyName?: string;
  serviceName?: string;
  applicantName?: string;
  onConfirmAttendance?: () => void;
}

export const AirportCallingAlertModal: React.FC<AirportCallingAlertModalProps> = ({
  isOpen,
  onClose,
  ticketNumber,
  counterName,
  agencyName = 'DPMPTSP',
  serviceName = 'Pelayanan MPP Simpurusiang',
  applicantName,
  onConfirmAttendance,
}) => {
  const { t } = useTranslation();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  // Play audio and trigger wake/vibrate when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let wakeLockSentinel: WakeLockSentinel | null = null;

    const startAlert = async () => {
      // 1. Keep screen awake
      wakeLockSentinel = await requestScreenWakeLock();

      // 2. Trigger vibration sequence
      triggerVibration();

      // 3. Play chime + speech
      setIsPlayingAudio(true);
      try {
        await playAirportChime();
        await speakCallingAnnouncement(ticketNumber, counterName);
      } finally {
        setIsPlayingAudio(false);
      }
    };

    startAlert();

    return () => {
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen, ticketNumber, counterName]);

  const handleReplayAudio = async () => {
    triggerVibration();
    setIsPlayingAudio(true);
    try {
      await playAirportChime();
      await speakCallingAnnouncement(ticketNumber, counterName);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const handleStopAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
      } catch {
        // Ignore
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop dengan efek pulsating lighting / radar menyala */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl"
        />

        {/* Dynamic Light Beam / Airport Strobe Light Effect */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[600px] sm:h-[900px] bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-amber-500/30 via-emerald-500/10 to-transparent animate-pulse" />
        </div>

        {/* Modal Card - Menyerupai Flight Information Display System (FIDS) & Layar Panggilan Bandara */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative z-10 w-full max-w-lg bg-slate-900 border-2 border-amber-400/80 rounded-3xl p-5 sm:p-7 shadow-[0_0_50px_rgba(245,158,11,0.4)] text-white overflow-hidden"
        >
          {/* Header Marquee / Strobe Bar */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-400 animate-[shimmer_2s_infinite]" />

          {/* Top Status Header */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
              </span>
              <span className="px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] sm:text-xs font-black uppercase tracking-widest font-mono">
                {t("mppPortal.airportCalling.modalTitle", "PANGGILAN LOKET AKTIF")}
              </span>
            </div>

            {/* Sound Wave Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/10">
              <Radio className={`w-3.5 h-3.5 ${isPlayingAudio ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
              <span className="text-[10px] font-bold text-slate-300 font-mono">
                {isPlayingAudio ? (t("mppPortal.airportCalling.audioActive", "BEL & SUARA AKTIF")) : (t("mppPortal.airportCalling.audioReady", "BANDARA AUDIO READY"))}
              </span>
              {isPlayingAudio && (
                <div className="flex items-end gap-0.5 h-3 ml-1">
                  <span className="w-1 bg-amber-400 animate-[bounce_0.6s_infinite] h-2 rounded-full" />
                  <span className="w-1 bg-amber-400 animate-[bounce_0.8s_infinite] h-3 rounded-full" />
                  <span className="w-1 bg-amber-400 animate-[bounce_0.5s_infinite] h-1.5 rounded-full" />
                </div>
              )}
            </div>
          </div>

          {/* Main Display Body */}
          <div className="py-5 text-center">
            <div className="inline-flex items-center gap-1.5 text-xs text-amber-300/90 font-bold uppercase tracking-wider mb-1 font-mono">
              <Bell className="w-4 h-4 animate-bounce text-amber-400" />
              <span>{t("mppPortal.airportCalling.subtitle", "Harap Segera Menuju Loket Pelayanan")}</span>
            </div>

            {/* Giant Calling Number */}
            <div className="my-2 py-3 px-4 rounded-2xl bg-gradient-to-b from-amber-500/20 to-slate-950/80 border border-amber-400/40 shadow-inner">
              <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold block">
                {t("mppPortal.airportCalling.ticketLabel", "Nomor Antrean Anda")}
              </span>
              <div className="text-4xl sm:text-6xl font-black font-sans tracking-tight text-white drop-shadow-[0_0_20px_rgba(245,158,11,0.6)] my-1">
                {ticketNumber}
              </div>
              {applicantName && (
                <p className="text-xs text-emerald-300 font-medium">
                  {t("mppPortal.airportCalling.applicantLabel", "Atas Nama:")} <strong className="text-white">{applicantName}</strong>
                </p>
              )}
            </div>

            {/* Counter Destination Callout */}
            <div className="mt-4 p-4 rounded-2xl bg-emerald-500/15 border-2 border-emerald-400/60 flex items-center justify-between text-left gap-3 shadow-lg shadow-emerald-500/10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black font-sans text-lg shrink-0 shadow-md">
                  <MapPin className="w-6 h-6 text-slate-950" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-300 block">
                    {t("mppPortal.airportCalling.agencyLabel", "Tujuan Pelayanan:")}
                  </span>
                  <div className="text-base sm:text-lg font-black text-white font-sans">
                    {counterName}
                  </div>
                  <div className="text-xs text-emerald-200/80 truncate max-w-[240px]">
                    {agencyName} • {serviceName}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold">
                  {t("mppPortal.airportCalling.counterOpen", "LOKET BUKA")}
                </span>
              </div>
            </div>

            {/* Alert info banner (Vibration & Display Active) */}
            <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-300 bg-white/5 py-2 px-3 rounded-xl border border-white/5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{t("mppPortal.airportCalling.chimeInfo", "Bel bandara berbunyi • Getar ponsel aktif • Layar siaga otomatis")}</span>
            </div>

            {/* Notifikasi Browser (Optional helper) */}
            {notificationPermission !== 'granted' && (
              <div className="mt-2 flex items-center justify-between bg-blue-500/10 border border-blue-500/20 p-2 rounded-xl text-[11px] text-blue-200">
                <span>{t("mppPortal.airportCalling.notifPrompt", "Aktifkan notifikasi browser agar tetap berbunyi saat layar terkunci")}</span>
                <button
                  type="button"
                  onClick={requestNotificationPermission}
                  className="px-2.5 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold text-[10px] shrink-0 ml-2"
                >
                  {t("mppPortal.airportCalling.allowNotif", "Izinkan")}
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                handleStopAudio();
                if (onConfirmAttendance) {
                  onConfirmAttendance();
                }
                onClose();
              }}
              className="w-full min-h-[48px] py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 hover:from-amber-600 hover:to-teal-600 text-slate-950 text-sm font-black font-sans shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <CheckCircle className="w-5 h-5 text-slate-950" />
              <span>{t("mppPortal.airportCalling.headingBtn", "SAYA SEGERA MENUJU LOKET")}</span>
              <ArrowRight className="w-5 h-5 text-slate-950" />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={isPlayingAudio ? handleStopAudio : handleReplayAudio}
                className="flex-1 min-h-[42px] py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-white/10"
              >
                {isPlayingAudio ? (
                  <>
                    <VolumeX className="w-4 h-4 text-rose-400" />
                    <span>{t("mppPortal.airportCalling.stopSound", "Hentikan Suara")}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-amber-400" />
                    <span>{t("mppPortal.airportCalling.replayChime", "Bunyikan Bel Bandara Lagi")}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  handleStopAudio();
                  onClose();
                }}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold font-sans transition-colors cursor-pointer"
              >
                {t("mppPortal.airportCalling.close", "Tutup")}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
