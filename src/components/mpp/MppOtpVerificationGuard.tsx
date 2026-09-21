import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Phone, 
  CreditCard, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sparkles,
  Lock,
  UserCheck,
  Star,
  MessageSquareHeart,
  Smartphone
} from 'lucide-react';

interface MppOtpVerificationGuardProps {
  isDarkMode?: boolean;
  userType: 'masyarakat' | 'investor';
  defaultNik?: string;
  defaultPhone?: string;
  defaultName?: string;
  featureTitle: string;
  featureSubtitle?: string;
  isLoggedIn?: boolean;
  skipOtp?: boolean;
  children: React.ReactNode;
  onVerified?: (nik: string, phone: string) => void;
}

export const MppOtpVerificationGuard: React.FC<MppOtpVerificationGuardProps> = ({
  isDarkMode = false,
  userType,
  defaultNik = '',
  defaultPhone = '',
  defaultName = '',
  featureTitle,
  featureSubtitle,
  isLoggedIn = false,
  skipOtp = false,
  children,
  onVerified
}) => {
  const [nik, setNik] = useState(defaultNik || '');
  const [phone, setPhone] = useState(defaultPhone || '');
  const [name, setName] = useState(defaultName || '');
  const [otpCode, setOtpCode] = useState('');
  
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isVerified, setIsVerified] = useState(isLoggedIn || skipOtp);

  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Check initial verification status on mount or when defaultNik changes
  useEffect(() => {
    const fallbackNik = typeof window !== 'undefined' ? localStorage.getItem('luwu_user_nik') || '' : '';
    const cleanNik = (defaultNik || nik || fallbackNik).trim();
    if (/^\d{16}$/.test(cleanNik)) {
      if (!nik) setNik(cleanNik);
      const stored = localStorage.getItem(`mpp_verified_otp_${cleanNik}`);
      if (stored === 'true') {
        setIsVerified(true);
        const storedPhone = localStorage.getItem(`mpp_verified_otp_phone_${cleanNik}`) || (typeof window !== 'undefined' ? localStorage.getItem('luwu_user_phone') || '' : '');
        if (storedPhone && !phone) setPhone(storedPhone);
        const storedName = localStorage.getItem(`mpp_citizen_name_${cleanNik}`) || (typeof window !== 'undefined' ? localStorage.getItem('luwu_user_name') || '' : '');
        if (storedName && !name) setName(storedName);
        if (onVerified) {
          onVerified(cleanNik, storedPhone || '');
        }
      }
    }
  }, [defaultNik, nik, phone, name, onVerified]);

  // Handle cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(c => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Request WhatsApp OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanNik = nik.replace(/\D/g, '');
    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanNik.length !== 16) {
      setErrorMessage('Nomor Induk Kependudukan (NIK) harus tepat 16 digit angka sesuai e-KTP.');
      return;
    }

    if (cleanPhone.length < 10) {
      setErrorMessage('Masukkan nomor WhatsApp aktif pemohon yang valid (min. 10 digit).');
      return;
    }

    setIsSendingOtp(true);

    try {
      // First try standard registered endpoint
      let res = await fetch('/api/kiosk/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nik: cleanNik })
      });
      let data = await res.json();

      // If citizen is not found or has no phone stored, call send-otp-new
      if (!res.ok || !data.registered) {
        res = await fetch('/api/kiosk/send-otp-new', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nik: cleanNik,
            phone: cleanPhone,
            fullName: name.trim() || (userType === 'investor' ? 'Investor Luwu' : 'Warga Luwu'),
            userType
          })
        });
        data = await res.json();
      }

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengirimkan kode OTP ke WhatsApp.');
      }

      setIsOtpSent(true);
      setCooldown(data.cooldownSeconds || 45);
      setSuccessMessage(`Kode OTP 4-digit telah dikirimkan ke WhatsApp nomor ${cleanPhone.slice(0, 4)}****${cleanPhone.slice(-3)}.`);
      
      if (data.devOtp) {
        setDevOtpHint(data.devOtp);
      }
    } catch (err: any) {
      console.error('Error sending WhatsApp OTP:', err);
      setErrorMessage(err?.message || 'Gangguan pengiriman OTP WhatsApp. Periksa koneksi atau nomor telepon.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify WhatsApp OTP
  const handleVerifyOtp = async (codeToVerify?: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanNik = nik.replace(/\D/g, '');
    const cleanOtp = (codeToVerify || otpCode).trim();

    if (cleanOtp.length !== 4) {
      setErrorMessage('Masukkan 4 digit kode OTP yang diterima.');
      return;
    }

    setIsVerifyingOtp(true);

    try {
      const res = await fetch('/api/kiosk/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nik: cleanNik,
          otp: cleanOtp,
          citizenData: {
            full_name: name.trim() || (userType === 'investor' ? 'Investor Luwu' : 'Warga Pemohon'),
            phone_number: phone.trim()
          }
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Kode OTP tidak valid atau telah kadaluarsa.');
      }

      // Verification Success!
      setIsVerified(true);
      localStorage.setItem(`mpp_verified_otp_${cleanNik}`, 'true');
      localStorage.setItem(`mpp_verified_otp_phone_${cleanNik}`, phone);
      setSuccessMessage('Verifikasi NIK dan WhatsApp OTP Berhasil! Akses telah terbuka.');

      if (onVerified) {
        onVerified(cleanNik, phone);
      }
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      setErrorMessage(err?.message || 'Kode OTP salah atau telah kadaluarsa. Silakan periksa kembali.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // If already verified, render children with top verified banner
  if (isVerified) {
    return (
      <div className="space-y-4">
        {/* Verified Status Banner */}
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
          isDarkMode 
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
            : 'bg-emerald-50 border-emerald-300 text-emerald-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs sm:text-sm">Identitas Terverifikasi Resmi</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                  OTP WA AKTIF
                </span>
              </div>
              <div className="text-[11px] opacity-85 mt-0.5 flex flex-wrap items-center gap-x-2">
                <span>NIK: <strong className="font-mono">{nik ? `${nik.slice(0, 6)}******${nik.slice(-4)}` : 'Terdaftar'}</strong></span>
                {phone && <span>• WA: <strong className="font-mono">{phone.slice(0, 4)}****{phone.slice(-3)}</strong></span>}
                <span>• Status: <strong>PermenPAN-RB Verified</strong></span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const cleanNik = nik.replace(/\D/g, '');
              localStorage.removeItem(`mpp_verified_otp_${cleanNik}`);
              setIsVerified(false);
              setIsOtpSent(false);
              setOtpCode('');
            }}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline shrink-0 text-left sm:text-right"
          >
            Verifikasi Ulang / Ganti Identitas
          </button>
        </div>

        {/* The Guarded Children (Survey or Testimonial) */}
        <div>
          {children}
        </div>
      </div>
    );
  }

  // Not verified yet: render Android-first OTP Verification Guard Card
  return (
    <div className="w-full max-w-2xl mx-auto my-4 animate-in fade-in duration-300">
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl ${
        isDarkMode 
          ? 'bg-slate-900/90 border-slate-800 text-white backdrop-blur-xl' 
          : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
      }`}>
        
        {/* Header Guard Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            Verifikasi Wajib Pemohon (PermenPAN-RB)
          </span>
          <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
            <Smartphone className="w-3.5 h-3.5" /> Android First
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
          Verifikasi NIK & OTP WhatsApp
        </h3>
        
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
          {featureSubtitle || `Untuk menjaga integritas, transparansi pelayanan publik, dan mencegah data ulasan fiktif, fitur ${featureTitle} hanya dapat diakses oleh pemohon (${userType === 'investor' ? 'investor' : 'masyarakat'}) yang telah terverifikasi melalui 16-Digit NIK dan OTP WhatsApp aktif.`}
        </p>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Success Notification */}
        {successMessage && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-bold leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Dev OTP Fast Helper */}
        {devOtpHint && (
          <div className="mt-4 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between gap-3 text-xs text-indigo-600 dark:text-indigo-400">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Kode OTP Testing: <strong className="font-mono text-sm tracking-widest">{devOtpHint}</strong></span>
            </div>
            <button
              type="button"
              onClick={() => {
                setOtpCode(devOtpHint);
                handleVerifyOtp(devOtpHint);
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              Isi & Verifikasi Instan
            </button>
          </div>
        )}

        {/* Form Inputs */}
        <div className="mt-6 space-y-4">
          {/* 1. NIK 16-Digit */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Nomor Induk Kependudukan (NIK 16-Digit) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <CreditCard className="w-4 h-4" />
              </div>
              <input
                type="text"
                maxLength={16}
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                placeholder="7317xxxxxxxxxxxx"
                className={`w-full min-h-[48px] pl-10 pr-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-mono tracking-wide border outline-none transition-all ${
                  isDarkMode 
                    ? 'bg-slate-800/80 border-slate-700 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Harus 16 digit angka sesuai KTP Anda.
            </span>
          </div>

          {/* 2. Nama Lengkap */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Nama Lengkap Pemohon
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Andi Tenri / PT. Mitra Luwu"
              className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm border outline-none transition-all ${
                isDarkMode 
                  ? 'bg-slate-800/80 border-slate-700 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
              }`}
            />
          </div>

          {/* 3. Nomor WhatsApp Aktif */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="0812xxxxxxxx"
                className={`w-full min-h-[48px] pl-10 pr-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-mono border outline-none transition-all ${
                  isDarkMode 
                    ? 'bg-slate-800/80 border-slate-700 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Kode OTP 4-digit akan dikirimkan langsung ke nomor WhatsApp ini.
            </span>
          </div>

          {/* Action: Send OTP Button */}
          {!isOtpSent ? (
            <button
              type="button"
              onClick={() => handleSendOtp()}
              disabled={isSendingOtp || nik.length !== 16 || phone.length < 10}
              className="w-full min-h-[50px] mt-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSendingOtp ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Mengirim Kode OTP WhatsApp...</span>
                </div>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Kirim Kode OTP WhatsApp</span>
                </>
              )}
            </button>
          ) : (
            /* OTP Verification Box */
            <div className="mt-6 pt-5 border-t border-inherit space-y-4 animate-in fade-in">
              <div className="text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                  Masukkan 4-Digit Kode OTP
                </span>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  Periksa pesan masuk WhatsApp pada nomor {phone}
                </span>
              </div>

              <div className="flex justify-center">
                <input
                  type="text"
                  maxLength={4}
                  value={otpCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setOtpCode(val);
                    if (val.length === 4) {
                      handleVerifyOtp(val);
                    }
                  }}
                  placeholder="••••"
                  autoFocus
                  className={`w-48 text-center text-3xl font-mono font-black tracking-widest py-3 rounded-2xl border-2 outline-none transition-all ${
                    isDarkMode 
                      ? 'bg-slate-800 border-emerald-500/60 text-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20' 
                      : 'bg-slate-50 border-emerald-500 text-slate-900 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20'
                  }`}
                />
              </div>

              {/* Verify OTP Button */}
              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                disabled={isVerifyingOtp || otpCode.length !== 4}
                className="w-full min-h-[50px] py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isVerifyingOtp ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Kode OTP...</span>
                  </div>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verifikasi & Akses {featureTitle}</span>
                  </>
                )}
              </button>

              {/* Resend OTP */}
              <div className="text-center pt-2">
                {cooldown > 0 ? (
                  <span className="text-xs text-slate-400">
                    Kirim ulang OTP dalam <strong className="font-mono text-emerald-500">{cooldown} detik</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={isSendingOtp}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Kirim Ulang Kode OTP WhatsApp
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MppOtpVerificationGuard;
