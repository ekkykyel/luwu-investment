import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Lock,
  User,
  Clock,
  Building2,
  Volume2,
  VolumeX,
  FileWarning,
  Loader2
} from 'lucide-react';
import { MppReprimand } from '../../types/mpp';
import { mppService } from '../../services/mppService';

interface MppReprimandHardStopModalProps {
  reprimand: MppReprimand | null;
  tenantName: string;
  onAcknowledged: (updated: MppReprimand) => void;
}

export const MppReprimandHardStopModal: React.FC<MppReprimandHardStopModalProps> = ({
  reprimand,
  tenantName,
  onAcknowledged
}) => {
  const [officerName, setOfficerName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play attention-grabbing alert chime when modal opens
  const playAlertChime = () => {
    if (isAudioMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // 3-tone urgent warning chord
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.35);
      });
    } catch {
      // Audio playback silently ignored if blocked
    }
  };

  useEffect(() => {
    if (reprimand && reprimand.status === 'sent') {
      playAlertChime();
      const interval = setInterval(playAlertChime, 8000);
      return () => clearInterval(interval);
    }
  }, [reprimand, isAudioMuted]);

  if (!reprimand || reprimand.status !== 'sent') {
    return null;
  }

  const handleAcknowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerName.trim()) {
      setErrorMsg('Wajib mengetikkan nama lengkap petugas penerima teguran.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const result = await mppService.acknowledgeReprimand(reprimand.id, officerName.trim());
      if (result.success && result.data) {
        onAcknowledged(result.data);
      } else if (result.success) {
        onAcknowledged({
          ...reprimand,
          status: 'read',
          read_by_name: officerName.trim(),
          read_at: new Date().toISOString()
        });
      } else {
        setErrorMsg(result.error || 'Gagal memproses konfirmasi.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal terhubung ke database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-rose-950/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 select-none"
    >
      <div className="relative w-full max-w-xl bg-slate-950 border-2 border-rose-600 rounded-3xl shadow-[0_0_80px_rgba(225,29,72,0.5)] overflow-hidden flex flex-col">
        {/* Top Warning Banner with Pulsing Siren Animation */}
        <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-rose-700 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0 animate-bounce">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/30 border border-white/20">
                Peringatan Resmi Disiplin Pelayanan
              </span>
              <h2 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                e-TEGURAN KEPALA DPMPTSP
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className="p-2 rounded-xl bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
            title={isAudioMuted ? 'Nyalakan Suara Alarm' : 'Matikan Suara Alarm'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Target Gerai & Timestamp Bar */}
          <div className="flex flex-col gap-2 p-3 rounded-2xl bg-rose-950/40 border border-rose-900/60 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-rose-400" />
                <span className="text-slate-300">Target Loket/Gerai:</span>
                <strong className="text-white font-bold">
                  {tenantName}{reprimand.target_counter_name ? ` - ${reprimand.target_counter_name}` : ''}
                </strong>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5 text-rose-400" />
                <span>{new Date(reprimand.created_at).toLocaleString('id-ID')}</span>
              </div>
            </div>
            {reprimand.target_officer_name && (
              <div className="flex items-center gap-2 text-rose-300 border-t border-rose-900/30 pt-1.5 mt-0.5">
                <User className="w-3.5 h-3.5 text-rose-400" />
                <span>Ditujukan Spesifik Ke: <strong className="text-white">{reprimand.target_officer_name}</strong></span>
              </div>
            )}
          </div>

          {/* Quick Reasons Chips */}
          {reprimand.quick_reasons && reprimand.quick_reasons.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider block">
                Poin Pelanggaran / Catatan Evaluasi:
              </span>
              <div className="flex flex-wrap gap-2">
                {reprimand.quick_reasons.map((reason, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-200 border border-rose-500/40 flex items-center gap-1.5 shadow-sm"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>{reason}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Comments Box */}
          {reprimand.comments && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Uraian Teguran Khusus dari Pimpinan:
              </span>
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-200 text-xs leading-relaxed font-sans italic">
                "{reprimand.comments}"
              </div>
            </div>
          )}

          {/* Institutional Compliance Notice */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              Layar dasbor Anda sedang dikunci sementara (<strong>Hard-Stop Safety</strong>). Untuk melanjutkan operasional antrean dan pelayanan masyarakat di gerai ini, Anda diwajibkan mengonfirmasi tanda terima teguran di bawah ini.
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <FileWarning className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Wajib Acknowledgment */}
          <form onSubmit={handleAcknowledge} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-white mb-1.5">
                Ketik Nama Anda <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  placeholder="Nama Lengkap Petugas Gerai yang Bertugas"
                  className="w-full pl-9 pr-4 py-3 bg-slate-900 border-2 border-rose-500/60 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/30 transition-all font-medium"
                />
                <User className="w-4 h-4 text-rose-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !officerName.trim()}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:from-rose-500 hover:to-rose-500 active:scale-[0.99] transition-all shadow-xl shadow-rose-950/60 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Konfirmasi Penerimaan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Saya Mengerti & Akan Menindaklanjuti</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
