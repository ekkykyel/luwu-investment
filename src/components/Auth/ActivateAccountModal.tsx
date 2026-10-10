import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  KeyRound, 
  X, 
  ShieldCheck, 
  Phone, 
  CreditCard, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  RotateCw, 
  ArrowRight, 
  ArrowLeft,
  UserCheck
} from 'lucide-react';
import { sendActivationOtp, activateOldAccount } from '../../services/authService';
import { LUWU_LOGO_BASE64 } from '../../lib/logoBase64';

interface ActivateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (identifier: string) => void;
  initialIdentifier?: string;
}

export const ActivateAccountModal: React.FC<ActivateAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialIdentifier = ''
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States info & validation
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    nik?: string;
    fullName?: string;
    message: string;
  } | null>(null);

  const [maskedPhone, setMaskedPhone] = useState<string>('');
  const [maskedName, setMaskedName] = useState<string>('');
  const [devOtp, setDevOtp] = useState<string | undefined>();
  const [cooldown, setCooldown] = useState(0);

  // Sync initial identifier
  useEffect(() => {
    if (initialIdentifier && !identifier) {
      setIdentifier(initialIdentifier);
    }
  }, [initialIdentifier]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Reset modal state upon open/close
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessData(null);
      if (!initialIdentifier) {
        setStep(1);
        setOtpCode('');
        setNewPassword('');
        setConfirmPassword('');
      }
    }
  }, [isOpen, initialIdentifier]);

  if (!isOpen) return null;

  // Handle Step 1: Kirim OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId) {
      setError('Silakan masukkan NIK (16 digit) atau Nomor WhatsApp terdaftar.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await sendActivationOtp(cleanId);
      if (result.success) {
        setMaskedPhone(result.maskedPhone || 'Nomor WhatsApp Anda');
        setMaskedName(result.maskedName || 'Pemohon Terdaftar');
        setDevOtp(result.devOtp);
        setCooldown(result.cooldownSeconds || 45);
        setStep(2);
      } else {
        setError(result.message || 'Gagal menemukan akun pendaftaran lama.');
      }
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan koneksi ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Step 2: Verifikasi & Buat Kata Sandi
  const handleActivateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      setError('Silakan masukkan kode OTP WhatsApp yang valid.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok. Silakan periksa kembali.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await activateOldAccount({
        identifier: identifier.trim(),
        otpCode: cleanOtp,
        newPassword
      });

      if (result.success) {
        setSuccessData({
          nik: result.nik || identifier,
          fullName: result.fullName,
          message: result.message
        });

        // Callback setelah 1.8 detik atau saat user klik masuk
        setTimeout(() => {
          onSuccess(result.nik || identifier);
          onClose();
        }, 2200);
      } else {
        setError(result.message || 'Gagal mengaktivasi akun. Periksa kode OTP Anda.');
      }
    } catch (err: any) {
      setError(err?.message || 'Terjadi kendala saat aktivasi akun.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-base/75 backdrop-blur-md"
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white dark:bg-surface rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden z-10 font-sans"
        >
          {/* Top Accent Gradient */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-600" />

          {/* Modal Header */}
          <div className="p-5 sm:p-6 pb-4 flex items-start justify-between border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    Aktivasi Akun Pemohon
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    Migrasi Login
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Buat kata sandi untuk login NIK + Password tanpa kehilangan berkas lama
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step Progress Bar */}
          <div className="px-6 pt-4 pb-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-800'
                }`}>
                  1
                </div>
                <span className={`text-xs font-bold ${
                  step === 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
                }`}>
                  Cari Akun Lama
                </span>
              </div>
              <div className="h-0.5 w-10 bg-slate-200 dark:bg-slate-800" />
              <div className="flex-1 flex items-center gap-2 justify-end">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  2
                </div>
                <span className={`text-xs font-bold ${
                  step === 2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
                }`}>
                  Verifikasi & Sandi
                </span>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 pt-3">
            {/* SUCCESS BANNER */}
            {successData ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6 text-center space-y-4"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xl shadow-black/25">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white">
                    Akun Berhasil Diaktivasi!
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                    Halo <strong className="text-slate-900 dark:text-white">{successData.fullName || 'Pemohon'}</strong>, kata sandi baru Anda telah aktif. Anda kini dapat masuk ke portal menggunakan NIK dan kata sandi baru Anda.
                  </p>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 font-mono">
                  NIK Aktif: <strong>{successData.nik}</strong>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSuccess(successData.nik || identifier);
                    onClose();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-black/25 transition-all cursor-pointer"
                >
                  Masuk ke Portal Sekarang
                </button>
              </motion.div>
            ) : (
              <>
                {/* ERROR ALERT */}
                {error && (
                  <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400 animate-in fade-in duration-200">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                    <span className="leading-relaxed">{error}</span>
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════════════
                    STEP 1: INPUT IDENTIFIER (NIK / NO WHATSAPP)
                   ═══════════════════════════════════════════════════════════ */}
                {step === 1 && (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-300 leading-relaxed flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        Pernah mengajukan <strong>Izin PKKPR</strong> atau <strong>Kunjungan MPP</strong> dengan WhatsApp OTP? Masukkan NIK KTP atau Nomor WhatsApp Anda untuk menerima kode aktivasi kata sandi.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                        NIK (KTP) atau Nomor WhatsApp Pemohon
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          {identifier.replace(/\D/g, '').length === 16 ? (
                            <CreditCard className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <Phone className="w-5 h-5 text-emerald-500" />
                          )}
                        </div>
                        <input
                          type="text"
                          required
                          value={identifier}
                          onChange={(e) => {
                            setIdentifier(e.target.value);
                            setError(null);
                          }}
                          placeholder="Contoh: 7317xxxxxxxxxxxx atau 0812xxxxxxxx"
                          className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-base/70 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                        Sistem akan mencocokkan identitas pada pangkalan data perizinan Pemkab Luwu.
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !identifier.trim()}
                      className="w-full min-h-[44px] sm:min-h-[48px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-black/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Mencari Akun & Mengirim OTP...</span>
                        </>
                      ) : (
                        <>
                          <span>Kirim Kode OTP WhatsApp</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* ═══════════════════════════════════════════════════════════
                    STEP 2: INPUT OTP + SET PASSWORD BARU
                   ═══════════════════════════════════════════════════════════ */}
                {step === 2 && (
                  <form onSubmit={handleActivateAccount} className="space-y-3.5">
                    {/* Identitas Terdeteksi */}
                    <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {maskedName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            WhatsApp: {maskedPhone}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setStep(1);
                          setError(null);
                        }}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                      >
                        Ganti NIK
                      </button>
                    </div>

                    {/* Developer OTP Helper (jika mode sandbox) */}
                    {devOtp && (
                      <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-xl text-[11px] text-amber-900 dark:text-amber-200 font-mono flex items-center justify-between">
                        <span>Kode Verifikasi (Gateway Test): <strong>{devOtp}</strong></span>
                        <button
                          type="button"
                          onClick={() => setOtpCode(devOtp)}
                          className="px-2 py-0.5 bg-amber-200 dark:bg-amber-800 rounded font-bold text-[10px]"
                        >
                          Terapkan
                        </button>
                      </div>
                    )}

                    {/* Input OTP 6-Digit */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                          Kode OTP WhatsApp (6 Digit)
                        </label>
                        {cooldown > 0 ? (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Kirim ulang dlm {cooldown}s
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendOtp()}
                            disabled={isLoading}
                            className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCw className="w-3 h-3" />
                            <span>Kirim Ulang OTP</span>
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        required
                        value={otpCode}
                        onChange={(e) => {
                          setOtpCode(e.target.value.replace(/\D/g, ''));
                          setError(null);
                        }}
                        placeholder="••••••"
                        className="w-full tracking-widest text-center py-2.5 sm:py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-base/70 text-slate-900 dark:text-white placeholder-slate-400 text-base sm:text-lg font-mono font-black focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Input Kata Sandi Baru */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Kata Sandi Baru
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4 text-emerald-500" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimal 6 karakter"
                          className="w-full pl-10 pr-10 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-base/70 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* Input Konfirmasi Kata Sandi */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Ulangi Kata Sandi Baru
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        </div>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Ulangi kata sandi baru"
                          className={`w-full pl-10 pr-10 py-2.5 border rounded-xl bg-white dark:bg-base/70 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                            confirmPassword && confirmPassword !== newPassword
                              ? 'border-rose-400 focus:ring-rose-500'
                              : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {confirmPassword && confirmPassword === newPassword && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Kata sandi cocok
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setStep(1);
                          setError(null);
                        }}
                        className="py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Kembali</span>
                      </button>

                      <button
                        type="submit"
                        disabled={isLoading || otpCode.length < 4 || newPassword.length < 6 || newPassword !== confirmPassword}
                        className="flex-1 min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-black/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Menyimpan Kata Sandi...</span>
                          </>
                        ) : (
                          <>
                            <KeyRound className="w-4 h-4" />
                            <span>Aktivasi & Simpan Sandi</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
