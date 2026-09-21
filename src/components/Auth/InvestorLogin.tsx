import { LUWU_LOGO_BASE64 } from "@/lib/logoBase64";
import { requestSmartFullscreen } from "../../utils/fullscreen";
import { useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Building2, 
  Mail, 
  Lock, 
  LogIn, 
  ChevronRight, 
  AlertCircle, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  CreditCard, 
  Users, 
  Shield, 
  UserCheck, 
  Phone, 
  KeyRound, 
  RotateCw, 
  CheckCircle2, 
  Check, 
  Loader2, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useProfile } from '../../hooks/useProfile';

export default function InvestorLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { setProfile: setActiveProfile } = useProfile();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Category: 'masyarakat' | 'investor' | 'admin'
  const [mainRoleCategory, setMainRoleCategory] = useState<'masyarakat' | 'investor' | 'admin'>(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    if (roleParam === 'masyarakat') return 'masyarakat';
    if (roleParam === 'investor') return 'investor';
    return 'masyarakat'; // Default friendly citizen portal
  });

  const [adminSpecificRole, setAdminSpecificRole] = useState<'admin_puptr' | 'admin_pertanian' | 'admin_dalak' | 'admin_data' | 'admin_promosi' | 'admin_oss' | 'admin_mpp'>('admin_puptr');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // ─── Masyarakat OTP Specific States ───
  const [otpNik, setOtpNik] = useState('');
  const [otpPhone, setOtpPhone] = useState('');
  const [otpFullName, setOtpFullName] = useState('');
  const [isSearchingCitizen, setIsSearchingCitizen] = useState(false);
  const [citizenFound, setCitizenFound] = useState<any>(null);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [demoOtpPreview, setDemoOtpPreview] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Countdown timer effect
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Auto-set role from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    if (roleParam === 'masyarakat') {
      setMainRoleCategory('masyarakat');
      setIdentifier('');
    } else if (roleParam === 'investor') {
      setMainRoleCategory('investor');
      setIdentifier('');
    } else if (roleParam && (roleParam.startsWith('admin_') || roleParam === 'puptr' || roleParam === 'pertanian')) {
      setMainRoleCategory('admin');
      if (roleParam === 'puptr' || roleParam === 'admin_puptr') setAdminSpecificRole('admin_puptr');
      else if (roleParam === 'pertanian' || roleParam === 'admin_pertanian') setAdminSpecificRole('admin_pertanian');
      else setAdminSpecificRole(roleParam as any);
      setIdentifier('');
    }
  }, [location.search]);

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const OFFICIAL_EMAIL_ROLE_MAP: Record<string, string> = {
    'puptr@luwukab.go.id': 'admin_puptr',
    'adminpuptr@luwukab.go.id': 'admin_puptr',
    'pertanian@luwukab.go.id': 'admin_pertanian',
    'adminpertanian@luwukab.go.id': 'admin_pertanian',
    'dalakluwu@gmail.com': 'admin_dalak',
    'dataluwu@gmail.com': 'admin_data',
    'promosiluwu@gmail.com': 'admin_promosi',
    'dpmptspluwu@gmail.com': 'admin_oss',
  };

  const handleIdentifierChange = (val: string) => {
    setIdentifier(val);
    const cleanEmail = val.trim().toLowerCase();
    if (OFFICIAL_EMAIL_ROLE_MAP[cleanEmail]) {
      setMainRoleCategory('admin');
      setAdminSpecificRole(OFFICIAL_EMAIL_ROLE_MAP[cleanEmail] as any);
    }
  };

  // ── Auto Search Citizen when NIK is typed ──
  const handleNikInputChange = async (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 16);
    setOtpNik(clean);
    setOtpError(null);
    setCitizenFound(null);

    if (clean.length === 16) {
      setIsSearchingCitizen(true);
      try {
        const { data, error } = await supabase
          .from('mpp_citizens')
          .select('*')
          .eq('nik', clean)
          .maybeSingle();

        if (data && !error) {
          setCitizenFound(data);
          setOtpFullName(data.full_name || '');
          setOtpPhone(data.phone_number || data.phone || '');
        }
      } catch (err) {
        console.error('Error fetching citizen:', err);
      } finally {
        setIsSearchingCitizen(false);
      }
    }
  };

  // ── Send OTP for Masyarakat ──
  const handleSendOtpMasyarakat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otpNik.length !== 16) {
      setOtpError('NIK wajib 16 digit angka sesuai KTP');
      return;
    }

    const cleanPhone = otpPhone.replace(/[^\d+]/g, '');
    if (!citizenFound && (!cleanPhone || cleanPhone.length < 9)) {
      setOtpError('Nomor WhatsApp wajib diisi untuk verifikasi OTP');
      return;
    }
    if (!citizenFound && (!otpFullName || otpFullName.trim().length < 3)) {
      setOtpError('Nama lengkap wajib diisi minimal 3 karakter');
      return;
    }

    setIsSendingOtp(true);
    setOtpError(null);

    try {
      let endpoint = '/api/kiosk/send-otp';
      let body: any = { nik: otpNik };

      if (!citizenFound) {
        endpoint = '/api/kiosk/send-otp-new';
        body = {
          nik: otpNik,
          phone: cleanPhone,
          full_name: otpFullName.trim(),
          gender: 'Laki-laki',
          occupation: 'Wiraswasta / Pelaku Usaha'
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Gagal mengirim kode OTP');
      }

      setIsOtpSent(true);
      setCountdown(60);
      if (data.demoOtp) {
        setDemoOtpPreview(data.demoOtp);
      }
      if (data.citizen) {
        setCitizenFound(data.citizen);
      }
    } catch (err: any) {
      setOtpError(err.message || 'Gagal mengirim kode OTP. Silakan coba lagi.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // ── Verify OTP for Masyarakat ──
  const handleVerifyOtpMasyarakat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otpCode.length < 4) {
      setOtpError('Masukkan 4 digit kode OTP yang telah dikirim ke WhatsApp Anda');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);

    try {
      const res = await fetch('/api/kiosk/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nik: otpNik,
          otp: otpCode.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Kode OTP salah atau telah kadaluarsa');
      }

      const citizenData = data.citizen || citizenFound || { nik: otpNik, full_name: otpFullName };
      const citizenName = citizenData.full_name || otpFullName || 'Warga Kab. Luwu';

      // Persist citizen session
      if (data.sessionToken) {
        document.cookie = `sb-access-token=${data.sessionToken}; path=/; max-age=86400; SameSite=None; Secure`;
        localStorage.setItem("luwu_session_token", data.sessionToken);
      }
      localStorage.setItem("luwu_user_role", "masyarakat");
      localStorage.setItem("luwu_user_nik", otpNik);
      localStorage.setItem("luwu_user_name", citizenName);
      localStorage.setItem("luwu_citizen_data", JSON.stringify(citizenData));
      localStorage.setItem(`mpp_verified_otp_${otpNik}`, 'true');
      localStorage.setItem(`mpp_verified_otp_phone_${otpNik}`, citizenData.phone_number || otpPhone);
      localStorage.setItem(`mpp_citizen_name_${otpNik}`, citizenName);

      // Auto update active profile context
      setActiveProfile({
        id: `citizen-${otpNik}`,
        role: "masyarakat",
        nik: otpNik,
        full_name: citizenName,
        phone: citizenData.phone_number || otpPhone,
        whatsapp: citizenData.phone_number || otpPhone,
        ...citizenData
      });

      setIsSuccess(true);
      setTimeout(() => {
        window.location.replace('/masyarakat-dashboard');
      }, 700);
    } catch (err: any) {
      setOtpError(err.message || 'Verifikasi OTP gagal. Silakan periksa kembali kode OTP Anda.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const currentEffectiveRole = mainRoleCategory === 'investor' 
    ? 'investor' 
    : adminSpecificRole;

  // ── Password-based Submit (For Investor & Admin) ──
  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setIsSuccess(false);
    
    try {
      let finalEmail = identifier.trim();
      const cleanEmail = finalEmail.toLowerCase();
      let effectiveRole = currentEffectiveRole;

      if (OFFICIAL_EMAIL_ROLE_MAP[cleanEmail]) {
        effectiveRole = OFFICIAL_EMAIL_ROLE_MAP[cleanEmail];
        setMainRoleCategory('admin');
        setAdminSpecificRole(effectiveRole as any);
      }

      let { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: finalEmail,
        password
      });

      // Auto-register in development/preview if needed
      if (signInError && signInError.message.includes('Invalid login credentials')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: finalEmail,
          password,
          options: {
            data: {
              role: effectiveRole,
              full_name: effectiveRole
            }
          }
        });
        
        if (!signUpError && signUpData?.session) {
           data = signUpData as any;
           signInError = null;
           
           if (signUpData.user) {
              const { data: profile } = await supabase.from('profiles').select('*').eq('id', signUpData.user.id).maybeSingle();
              if (!profile) {
                 await supabase.from('profiles').insert({ id: signUpData.user.id, role: effectiveRole, full_name: effectiveRole });
              }
           }
        }
      }

      if (signInError) throw signInError;

      if (data?.session) {
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=86400; SameSite=None; Secure`;
        localStorage.setItem("luwu_session_token", data.session.access_token);
        localStorage.setItem("luwu_user_role", effectiveRole);
        localStorage.setItem("luwu_user_email", cleanEmail);
        
        await supabase.auth.setSession(data.session);

        if (OFFICIAL_EMAIL_ROLE_MAP[cleanEmail] || effectiveRole) {
          try {
            await supabase.from('profiles').upsert({
              id: data.session.user.id,
              role: effectiveRole,
              full_name: effectiveRole === 'admin_puptr' ? 'Admin Dinas PUPTR (Tata Ruang & Studio GIS)'
                       : effectiveRole === 'admin_pertanian' ? 'Admin Dinas Pertanian (Lahan LP2B)'
                       : effectiveRole === 'admin_dalak' ? 'Bidang Pengendalian Pelaksanaan & Pengawasan'
                       : effectiveRole === 'admin_data' ? 'Bidang Perencanaan, Pengembangan Iklim & Data'
                       : effectiveRole === 'admin_promosi' ? 'Bidang Promosi & Penanaman Modal'
                       : effectiveRole === 'admin_oss' ? 'Bidang Penyelenggaraan Pelayanan Perizinan'
                       : effectiveRole === 'admin_mpp' ? 'Admin MPP (Pengelola Mal Pelayanan Publik)'
                       : (data.session.user.user_metadata?.full_name || data.session.user.user_metadata?.company_name || cleanEmail.split('@')[0])
            });
          } catch (e) {}
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.session.user.id)
          .maybeSingle();

        const activeRole = profile?.role || effectiveRole;
        if (!activeRole) {
          throw new Error(t('auth.roleVerifyFailed', 'Gagal memverifikasi akun. Profil atau peran tidak ditemukan.'));
        }

        setIsSuccess(true);
        setTimeout(() => {
          if (activeRole === 'investor') {
            window.location.replace('/investor-dashboard');
          } else {
            window.location.replace('/dashboard');
          }
        }, 800);
      }
    } catch (err: any) {
      setError(err.message || t('auth.loginFailed', 'Login gagal, periksa email dan kata sandi.'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-center py-6 sm:py-10 px-3 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300 font-sans">
      {/* Background Ambience Accent */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-2 sm:px-0">
        <div className="flex justify-center mb-3 sm:mb-4">
          <div className="p-2 sm:p-2.5 bg-gradient-to-br from-white/90 via-emerald-50/50 to-slate-100/80 dark:from-slate-800/90 dark:via-slate-800/60 dark:to-slate-900/90 rounded-2xl border border-emerald-500/30 shadow-xl shadow-emerald-500/10 backdrop-blur-md flex items-center gap-3">
            <img 
              src={LUWU_LOGO_BASE64} 
              alt="Logo Resmi Kabupaten Luwu" 
              className="h-10 sm:h-12 w-auto object-contain drop-shadow-sm" 
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col text-left pr-1 border-l border-slate-200 dark:border-slate-700/80 pl-3">
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">PEMKAB LUWU</span>
              <span className="text-xs sm:text-sm font-black tracking-tight text-slate-900 dark:text-white">MPP Simpurusiang</span>
            </div>
          </div>
        </div>
        <h2 className="text-center text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-1 font-display">
          {t('auth.portalTitle', 'Portal Masuk Terpadu')}
        </h2>
        <p className="text-center text-xs text-slate-600 dark:text-slate-400 font-medium max-w-xs sm:max-w-sm mx-auto">
          {t('appSubtitle', 'Kabupaten Luwu • Satu Pintu Investasi & Layanan Publik')}
        </p>
      </div>

      <div className="mt-4 sm:mt-5 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-1 sm:px-0">
        <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800/90 shadow-2xl rounded-3xl backdrop-blur-xl overflow-hidden transition-all">
          
          {/* Top Gradient Accent Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500" />

          <div className="p-5 sm:p-7">
            {/* SEGMENTED PILL ROLE SELECTOR WITH ZERO TRUNCATION */}
            <div className="mb-5 p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 grid grid-cols-3 gap-1 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setMainRoleCategory('masyarakat');
                  setIdentifier('');
                  setError(null);
                  setOtpError(null);
                }}
                className={`py-2 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap ${
                  mainRoleCategory === 'masyarakat'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-md ring-2 ring-emerald-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Users size={13} className="shrink-0 text-emerald-500" />
                <span>Warga</span>
                <span className="px-1 py-0.2 text-[9px] font-mono bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded font-bold">OTP</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMainRoleCategory('investor');
                  setIdentifier('');
                  setError(null);
                  setOtpError(null);
                }}
                className={`py-2 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap ${
                  mainRoleCategory === 'investor'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-md ring-2 ring-emerald-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Building2 size={13} className="shrink-0 text-emerald-500" />
                <span>Investor</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMainRoleCategory('admin');
                  setIdentifier('');
                  setError(null);
                  setOtpError(null);
                }}
                className={`py-2 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap ${
                  mainRoleCategory === 'admin'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-md ring-2 ring-emerald-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Shield size={13} className="shrink-0 text-indigo-500" />
                <span>Admin</span>
              </button>
            </div>

          {/* ════════════════════════════════════════════════════════════════
              SCHEME A: MASYARAKAT LOGIN (OTP VALIDATION ONLY - NO PASSWORD)
             ════════════════════════════════════════════════════════════════ */}
          {mainRoleCategory === 'masyarakat' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Masuk instan tanpa kata sandi! Cukup masukkan 16-digit NIK dan kode OTP validasi WhatsApp.
                </span>
              </div>

              {!isOtpSent ? (
                <form onSubmit={handleSendOtpMasyarakat} className="space-y-4">
                  {/* NIK INPUT */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                        Nomor Induk Kependudukan (NIK)
                      </label>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        otpNik.length === 16 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400' : 'text-slate-400'
                      }`}>
                        {otpNik.length}/16
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={16}
                        required
                        value={otpNik}
                        onChange={(e) => handleNikInputChange(e.target.value)}
                        placeholder="Contoh: 7317xxxxxxxxxxxx"
                        className="block w-full pl-10 pr-10 py-2.5 sm:py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950/60 text-slate-900 dark:text-white placeholder-slate-400 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {isSearchingCitizen && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Citizen Auto-fill or New Registration Fields */}
                  {citizenFound ? (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1 animate-in fade-in">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Data Warga Terverifikasi</span>
                      </div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{citizenFound.full_name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        WhatsApp: {citizenFound.phone_number || citizenFound.phone ? `••••${(citizenFound.phone_number || citizenFound.phone).slice(-4)}` : 'Nomor terdaftar'}
                      </p>
                    </div>
                  ) : otpNik.length === 16 ? (
                    <div className="space-y-3 pt-1 animate-in fade-in">
                      <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-xs text-blue-700 dark:text-blue-300">
                        NIK baru terdeteksi. Lengkapi nama & nomor WhatsApp untuk menerima OTP.
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Nama Lengkap Sesuai KTP <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={otpFullName}
                          onChange={(e) => setOtpFullName(e.target.value)}
                          placeholder="Contoh: Muhammad Fadli"
                          className="block w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950/60 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Phone className="h-4 w-4" />
                          </div>
                          <input
                            type="tel"
                            inputMode="tel"
                            required
                            value={otpPhone}
                            onChange={(e) => setOtpPhone(e.target.value.replace(/[^\d+]/g, ''))}
                            placeholder="Contoh: 081234567890"
                            className="block w-full pl-9 pr-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950/60 text-slate-900 dark:text-white text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {otpError && (
                    <div className="flex items-start gap-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-3 rounded-xl text-xs">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <span>{otpError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSendingOtp || otpNik.length !== 16}
                    className="w-full min-h-[46px] sm:min-h-[48px] flex justify-center items-center gap-2 py-3 px-4 border border-emerald-400/30 rounded-xl shadow-md shadow-emerald-900/20 text-xs sm:text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {isSendingOtp ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengirim Kode OTP...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <MessageSquare size={16} />
                        <span>Kirim Kode OTP WhatsApp</span>
                      </div>
                    )}
                  </button>
                </form>
              ) : (
                /* OTP CODE VERIFICATION FORM */
                <form onSubmit={handleVerifyOtpMasyarakat} className="space-y-4 animate-in fade-in">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                    <p className="text-slate-500 dark:text-slate-400">Kode OTP 4-digit telah dikirim ke nomor WhatsApp pemohon.</p>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200">NIK: {otpNik}</p>
                  </div>

                  {demoOtpPreview && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/60 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold">Kode OTP Demo: </span>
                        <span className="font-mono text-sm font-black tracking-widest">{demoOtpPreview}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOtpCode(demoOtpPreview)}
                        className="px-2 py-1 bg-amber-200 dark:bg-amber-800 rounded text-[11px] font-bold cursor-pointer"
                      >
                        Gunakan
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Masukkan 4-Digit Kode OTP
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        autoFocus
                        required
                        value={otpCode}
                        onChange={(e) => {
                          setOtpCode(e.target.value.replace(/\D/g, ''));
                          setOtpError(null);
                        }}
                        placeholder="••••"
                        className="block w-full pl-10 pr-3.5 py-3 text-center tracking-[0.5em] font-mono text-lg font-black border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {otpError && (
                    <div className="flex items-start gap-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-3 rounded-xl text-xs">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <span>{otpError}</span>
                    </div>
                  )}

                  {isSuccess && (
                    <div className="flex items-start gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-3 rounded-xl text-xs">
                      <LogIn size={16} className="shrink-0 mt-0.5" />
                      <span>OTP Terverifikasi! Mengarahkan ke Dashboard Masyarakat...</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOtpSent(false);
                        setOtpCode('');
                        setOtpError(null);
                      }}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Ubah NIK
                    </button>

                    <button
                      type="submit"
                      disabled={isVerifyingOtp || otpCode.length < 4}
                      className="flex-1 py-3 px-4 rounded-xl shadow-md text-xs sm:text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isVerifyingOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Memverifikasi...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Verifikasi & Masuk</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-center pt-2">
                    {countdown > 0 ? (
                      <span className="text-[11px] text-slate-500 font-mono">
                        Kirim ulang kode dalam {countdown} detik
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendOtpMasyarakat()}
                        className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCw size={12} />
                        Kirim Ulang Kode OTP WhatsApp
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SCHEME B: INVESTOR & ADMIN LOGIN (EMAIL & PASSWORD)
             ════════════════════════════════════════════════════════════════ */}
          {mainRoleCategory !== 'masyarakat' && (
            <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmitPassword}>
              
              {/* SUB-ROLE SELECTOR FOR ADMIN DINAS */}
              {mainRoleCategory === 'admin' && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('auth.loginAs', 'Pilih Instansi / Bidang Dinas')}
                  </label>
                  <select
                    value={adminSpecificRole}
                    onChange={(e) => {
                      const newRole = e.target.value as any;
                      setAdminSpecificRole(newRole);
                      setIdentifier('');
                    }}
                    className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors cursor-pointer"
                  >
                    <option value="admin_puptr">Dinas PUPTR (Tata Ruang & Studio GIS)</option>
                    <option value="admin_pertanian">Dinas Pertanian (Verifikasi Lahan LP2B)</option>
                    <option value="admin_dalak">Bidang Pengendalian & Pengawasan (Dalak)</option>
                    <option value="admin_oss">Bidang Pelayanan Perizinan (OSS)</option>
                    <option value="admin_promosi">Bidang Promosi & Penanaman Modal</option>
                    <option value="admin_data">Bidang Perencanaan & Data</option>
                    <option value="admin_mpp">Admin MPP (Pengelola Mal Pelayanan Publik)</option>
                  </select>
                </div>
              )}

              {/* IDENTIFIER FIELD (EMAIL) */}
              <div>
                <label htmlFor="investor-identifier" className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {t('auth.emailLabel', 'Alamat Email')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <input
                    id="investor-identifier"
                    name="identifier"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    value={identifier}
                    onChange={(e) => handleIdentifierChange(e.target.value)}
                    maxLength={255}
                    className="block w-full pl-10 pr-3.5 py-2.5 sm:py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-xs sm:text-sm font-sans"
                    placeholder={
                      mainRoleCategory === 'admin'
                        ? adminSpecificRole === 'admin_puptr'
                          ? 'puptr@luwukab.go.id'
                          : adminSpecificRole === 'admin_pertanian'
                          ? 'pertanian@luwukab.go.id'
                          : adminSpecificRole === 'admin_dalak'
                          ? 'dalakluwu@gmail.com'
                          : adminSpecificRole === 'admin_oss'
                          ? 'dpmptspluwu@gmail.com'
                          : adminSpecificRole === 'admin_promosi'
                          ? 'promosiluwu@gmail.com'
                          : adminSpecificRole === 'admin_mpp'
                          ? 'adminmpp@luwukab.go.id'
                          : 'dataluwu@gmail.com'
                        : 'investor@perusahaan.com'
                    }
                  />
                </div>
              </div>

              {/* PASSWORD FIELD WITH TOGGLE SHOW/HIDE */}
              <div>
                <label htmlFor="investor-password" className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {t('auth.password', 'Kata Sandi')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <input
                    id="investor-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-11 py-2.5 sm:py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-xs sm:text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-3 rounded-xl text-xs">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {isSuccess && (
                <div className="flex items-start gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-3 rounded-xl text-xs">
                  <LogIn size={16} className="shrink-0 mt-0.5" />
                  <span>{t('auth.loginSuccess', 'Login sukses, mengarahkan ke dashboard...')}</span>
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting || !identifier || !password}
                  className="w-full min-h-[46px] sm:min-h-[48px] flex justify-center items-center gap-2 py-3 px-4 border border-emerald-400/30 rounded-xl shadow-md shadow-emerald-900/20 text-xs sm:text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn size={16} />
                      <span>{t('auth.loginBtn', 'Masuk ke Portal')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
          
          {/* NAVIGATION LINKS */}
          <div className="mt-5 text-center flex flex-col gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            {/* Registration Link Button (Exclusively for Investors) */}
            {mainRoleCategory === 'investor' && (
              <button
                type="button"
                onClick={() => navigate('/register?tab=investor')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer py-2 px-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20 w-full"
              >
                {t('auth.registerInvestorLink', 'Belum punya akun? Daftar Portal Investor')}
              </button>
            )}

            <button 
              type="button"
              onClick={() => {
                try {
                  if (!document.fullscreenElement) {
                    requestSmartFullscreen();
                  }
                } catch (e) {}
                navigate('/?skipSplash=true&fullscreen=true');
              }}
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer py-1"
            >
              <ArrowLeft size={13} />
              <span>{t('auth.backToHome', 'Kembali ke Beranda')}</span>
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
