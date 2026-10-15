import { LUWU_LOGO_BASE64 } from "@/lib/logoBase64";
import { requestSmartFullscreen } from "../../utils/fullscreen";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, User, Building2, Mail, FileText, Lock, CheckCircle2, ChevronRight, AlertCircle, Phone, ArrowLeft, Eye, EyeOff, Globe, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { checkFieldUniqueness, getMasyarakatDummyEmail } from '../../services/authService';

const daftarNegara = [
  "Indonesia", "Amerika Serikat", "Inggris Raya", "Jepang", "China", "Singapura", "Malaysia", "Korea Selatan",
  "Australia", "Belanda", "Jerman", "Prancis", "Uni Emirat Arab", "Arab Saudi", "Taiwan", "Hong Kong",
  "Afghanistan", "Afrika Selatan", "Albania", "Aljazair", "Andorra", "Angola", "Antigua dan Barbuda", "Argentina", "Armenia", "Austria", "Azerbaijan",
  "Bahama", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgia", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia dan Herzegovina", "Botswana", "Brasil", "Brunei Darussalam", "Bulgaria", "Burkina Faso", "Burundi",
  "Ceko", "Chad", "Chili", "Denmark", "Djibouti", "Dominika", "Ekuador", "El Salvador", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Filipina", "Finlandia", "Gabon", "Gambia", "Georgia", "Ghana", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guinea Khatulistiwa", "Guyana",
  "Haiti", "Honduras", "Hungaria", "India", "Irak", "Iran", "Irlandia", "Islandia", "Israel", "Italia",
  "Jamaika", "Kamboja", "Kamerun", "Kanada", "Kazakhstan", "Kenya", "Kepulauan Marshall", "Kepulauan Solomon", "Kirgizstan", "Kiribati", "Kolombia", "Komoro", "Republik Kongo", "Kosta Rika", "Kroasia", "Kuba", "Kuwait",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lituania", "Luksemburg",
  "Madagaskar", "Makedonia Utara", "Maladewa", "Malawi", "Mali", "Malta", "Maroko", "Mauritania", "Mauritius", "Meksiko", "Mesir", "Mikronesia", "Moldova", "Monako", "Mongolia", "Montenegro", "Mozambik", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Niger", "Nigeria", "Nikaragua", "Norwegia", "Oman",
  "Pakistan", "Palau", "Panama", "Pantai Gading", "Papua Nugini", "Paraguay", "Peru", "Polandia", "Portugal", "Qatar",
  "Republik Afrika Tengah", "Republik Demokratik Kongo", "Republik Dominika", "Rumania", "Rusia", "Rwanda",
  "Saint Kitts dan Nevis", "Saint Lucia", "Saint Vincent dan Grenadines", "Samoa", "San Marino", "Sao Tome dan Principe", "Selandia Baru", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Siprus", "Slovakia", "Slovenia", "Somalia", "Spanyol", "Sri Lanka", "Sudan", "Sudan Selatan", "Suriah", "Suriname", "Swedia", "Swiss",
  "Tajikistan", "Tanjung Verde", "Tanzania", "Thailand", "Timor Leste", "Togo", "Tonga", "Trinidad dan Tobago", "Tunisia", "Turki", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraina", "Uruguay", "Uzbekistan", "Vanuatu", "Vatikan", "Venezuela", "Vietnam", "Yaman", "Yordania", "Yunani", "Zambia", "Zimbabwe"
];

export default function InvestorRegistrationForm() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // Role selection: 'investor' | 'masyarakat'
  const [roleType, setRoleType] = useState<'investor' | 'masyarakat'>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') === 'masyarakat' || params.get('role') === 'masyarakat' ? 'masyarakat' : 'investor';
  });

  // Form states
  const [fullName, setFullName] = useState('');
  const [nik, setNik] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [negara, setNegara] = useState('Indonesia');
  const [email, setEmail] = useState('');
  const [nib, setNib] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // Uniqueness detection states
  const [fieldConflicts, setFieldConflicts] = useState<{
    nik?: string;
    nib?: string;
    whatsapp?: string;
    email?: string;
  }>({});
  const [isCheckingUnique, setIsCheckingUnique] = useState(false);
  const [conflictSummaryMessage, setConflictSummaryMessage] = useState<string | null>(null);

  const nikTimerRef = useRef<any>(null);
  const nibTimerRef = useRef<any>(null);
  const phoneTimerRef = useRef<any>(null);
  const emailTimerRef = useRef<any>(null);

  const statusModal = negara === 'Indonesia' ? 'PMDN' : 'PMA';

  const isSubmitDisabled = useMemo(() => {
    if (isSubmitting || isCheckingUnique) return true;
    if (!fullName.trim()) return true;
    if (!password || password.length < 6) return true;
    if (nik.replace(/\D/g, '').length !== 16) return true;
    if (roleType === 'investor') {
      if (!companyName.trim()) return true;
      if (nib.replace(/\D/g, '').length !== 13) return true;
      if (!email.trim() || !email.includes('@')) return true;
    }
    // Cegah submit jika ada konflik NIK, NIB, WhatsApp, atau Email
    if (fieldConflicts.nik || fieldConflicts.nib || fieldConflicts.whatsapp || fieldConflicts.email) return true;
    return false;
  }, [isSubmitting, isCheckingUnique, fullName, password, email, nik, roleType, companyName, nib, fieldConflicts]);

  const triggerCheckNikUnique = (cleanVal: string) => {
    if (nikTimerRef.current) clearTimeout(nikTimerRef.current);
    if (cleanVal.length !== 16) {
      setFieldConflicts(prev => ({ ...prev, nik: undefined }));
      return;
    }

    nikTimerRef.current = setTimeout(async () => {
      setIsCheckingUnique(true);
      const res = await checkFieldUniqueness({ nik: cleanVal, context: 'registration' });
      setIsCheckingUnique(false);

      if (res.conflicts.nik) {
        setFieldConflicts(prev => ({
          ...prev,
          nik: `NIK ${cleanVal} telah terdaftar. Masukkan NIK yang lain, atau silakan Masuk.`
        }));
        setConflictSummaryMessage('NIK, NIB, atau Nomor WhatsApp telah terdaftar. Masukkan NIK, NIB, dan Nomor WhatsApp yang lain.');
      } else {
        setFieldConflicts(prev => ({ ...prev, nik: undefined }));
        setConflictSummaryMessage(null);
      }
    }, 350);
  };

  const handleValidateNik = (val: string) => {
    const cleanVal = val.replace(/\D/g, '').slice(0, 16);
    setNik(cleanVal);
    if (cleanVal.length > 0 && cleanVal.length !== 16) {
      setError('NIK harus tepat 16 digit angka sesuai KTP.');
    } else {
      setError('');
      if (cleanVal.length === 16) {
        triggerCheckNikUnique(cleanVal);
      }
    }
  };

  const triggerCheckNibUnique = (cleanVal: string) => {
    if (nibTimerRef.current) clearTimeout(nibTimerRef.current);
    if (cleanVal.length !== 13) {
      setFieldConflicts(prev => ({ ...prev, nib: undefined }));
      return;
    }

    nibTimerRef.current = setTimeout(async () => {
      setIsCheckingUnique(true);
      const res = await checkFieldUniqueness({ nib: cleanVal, context: 'registration' });
      setIsCheckingUnique(false);

      if (res.conflicts.nib) {
        setFieldConflicts(prev => ({
          ...prev,
          nib: `NIB ${cleanVal} telah terdaftar. Masukkan NIB yang lain, atau silakan Masuk.`
        }));
        setConflictSummaryMessage('NIK, NIB, atau Nomor WhatsApp telah terdaftar. Masukkan NIK, NIB, dan Nomor WhatsApp yang lain.');
      } else {
        setFieldConflicts(prev => ({ ...prev, nib: undefined }));
        setConflictSummaryMessage(null);
      }
    }, 350);
  };

  const handleValidateNib = (val: string) => {
    const cleanVal = val.replace(/\D/g, '').slice(0, 13);
    setNib(cleanVal);
    if (cleanVal.length > 0 && cleanVal.length !== 13) {
      setError(t('nibVerification.errorNibLength', 'NIB harus tepat 13 digit angka dari OSS RBA.'));
    } else {
      setError('');
      if (cleanVal.length === 13) {
        triggerCheckNibUnique(cleanVal);
      }
    }
  };

  const triggerCheckPhoneUnique = (val: string) => {
    if (phoneTimerRef.current) clearTimeout(phoneTimerRef.current);
    const cleanPhone = val.replace(/[^\d+]/g, '');
    if (cleanPhone.length < 10) {
      setFieldConflicts(prev => ({ ...prev, whatsapp: undefined }));
      return;
    }

    phoneTimerRef.current = setTimeout(async () => {
      setIsCheckingUnique(true);
      const res = await checkFieldUniqueness({ whatsapp: cleanPhone, context: 'registration' });
      setIsCheckingUnique(false);

      if (res.conflicts.whatsapp) {
        setFieldConflicts(prev => ({
          ...prev,
          whatsapp: `Nomor WhatsApp ${cleanPhone} telah terdaftar. Masukkan Nomor WhatsApp yang lain.`
        }));
        setConflictSummaryMessage('NIK, NIB, atau Nomor WhatsApp telah terdaftar. Masukkan NIK, NIB, dan Nomor WhatsApp yang lain.');
      } else {
        setFieldConflicts(prev => ({ ...prev, whatsapp: undefined }));
        setConflictSummaryMessage(null);
      }
    }, 400);
  };

  const triggerCheckEmailUnique = (val: string) => {
    if (emailTimerRef.current) clearTimeout(emailTimerRef.current);
    const cleanEmail = val.trim().toLowerCase();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setFieldConflicts(prev => ({ ...prev, email: undefined }));
      return;
    }

    emailTimerRef.current = setTimeout(async () => {
      setIsCheckingUnique(true);
      const res = await checkFieldUniqueness({ email: cleanEmail, context: 'registration' });
      setIsCheckingUnique(false);

      if (res.conflicts.email) {
        setFieldConflicts(prev => ({
          ...prev,
          email: `Email ${cleanEmail} telah terdaftar. Masukkan email lain atau silakan Masuk.`
        }));
      } else {
        setFieldConflicts(prev => ({ ...prev, email: undefined }));
      }
    }, 450);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanNik = nik.replace(/\D/g, '').slice(0, 16);
    const finalEmail = (roleType === 'investor' || email.trim())
      ? email.trim().toLowerCase()
      : getMasyarakatDummyEmail(cleanNik);

    if (roleType === 'investor' && (!finalEmail || !finalEmail.includes('@'))) {
      setError('Harap masukkan alamat email perusahaan yang valid.');
      return;
    }
    if (cleanNik.length !== 16) {
      setError('NIK wajib 16 digit angka sesuai KTP.');
      return;
    }
    if (roleType === 'investor') {
      if (nib.replace(/\D/g, '').length !== 13) {
        setError(t('nibVerification.errorNibLength', 'NIB Perusahaan harus tepat 13 digit dari OSS-RBA.'));
        return;
      }
      if (!companyName.trim()) {
        setError('Nama Perusahaan / Institusi wajib diisi.');
        return;
      }
    }
    if (password.length < 6) {
      setError(t('register.errorPassword', 'Kata sandi minimal 6 karakter.'));
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      // Validasi unik menyeluruh sebelum memproses pendaftaran
      const fullCheck = await checkFieldUniqueness({
        nik: cleanNik,
        nib: roleType === 'investor' ? nib.trim() : undefined,
        whatsapp: whatsapp.trim(),
        email: finalEmail,
        context: 'registration'
      });

      if (!fullCheck.isUnique) {
        const cMsg = fullCheck.message || 'NIK, NIB, atau Nomor WhatsApp telah terdaftar. Masukkan NIK, NIB, dan Nomor WhatsApp yang lain.';
        setError(cMsg);
        setConflictSummaryMessage(cMsg);
        setFieldConflicts({
          nik: fullCheck.conflicts.nik ? `NIK ${cleanNik} telah terdaftar. Masukkan NIK yang lain.` : undefined,
          nib: fullCheck.conflicts.nib ? `NIB ${nib} telah terdaftar. Masukkan NIB yang lain.` : undefined,
          whatsapp: fullCheck.conflicts.whatsapp ? `Nomor WhatsApp ${whatsapp} telah terdaftar. Masukkan Nomor WhatsApp yang lain.` : undefined,
          email: fullCheck.conflicts.email ? `Email ${finalEmail} telah terdaftar. Masukkan email lain.` : undefined
        });
        setIsSubmitting(false);
        return;
      }

      // Pemisahan Jalur Registrasi (Role-Based)
      const signUpOptions = roleType === 'investor' 
        ? {
            data: {
              full_name: fullName.trim().toUpperCase(),
              nik: cleanNik,
              role: 'investor',
              company_name: companyName.trim(),
              nib: nib.trim(),
              negara_asal: negara,
              status_modal: statusModal,
              whatsapp: whatsapp.trim(),
              no_whatsapp: whatsapp.trim()
            }
          }
        : {
            data: {
              full_name: fullName.trim().toUpperCase(),
              nik: cleanNik,
              role: 'masyarakat',
              phone: whatsapp.trim(),
              whatsapp: whatsapp.trim(),
              no_whatsapp: whatsapp.trim()
            }
          };

      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: finalEmail,
        password: password,
        options: signUpOptions
      });

      if (signUpErr) {
        throw signUpErr;
      }

      // Bersihkan semua stale session di localStorage (Anti Ghost-Session)
      if (typeof window !== 'undefined') {
        localStorage.removeItem("luwu_session_token");
        localStorage.removeItem("luwu_user_role");
        localStorage.removeItem("luwu_user_email");
      }

      setIsSubmitting(false);
      setIsSuccess(true);
    } catch (err: any) {
      let errMsg = err?.message || t('register.errorDefault', 'Gagal melakukan registrasi, periksa kembali data Anda.');
      if (typeof errMsg === 'string' && (errMsg.toLowerCase().includes('already registered') || errMsg.toLowerCase().includes('already exists'))) {
        errMsg = 'NIK, NIB, atau Nomor WhatsApp telah terdaftar. Masukkan NIK, NIB, dan Nomor WhatsApp yang lain, atau silakan Masuk ke portal.';
        setConflictSummaryMessage(errMsg);
      }
      setError(errMsg);
      setIsSubmitting(false);
    }
  };

  return (
    <div id="investor-registration-page" className="min-h-screen bg-slate-50 dark:bg-base text-slate-900 dark:text-white flex flex-col justify-center py-6 sm:py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      {/* Background Ambience Accent */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-2 sm:px-0">
        <div className="flex justify-center mb-3 sm:mb-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="p-2 sm:p-2.5 bg-gradient-to-br from-white/90 via-emerald-50/50 to-slate-100/80 dark:from-slate-800/90 dark:via-slate-800/60 dark:to-slate-900/90 rounded-2xl border border-emerald-500/30 shadow-xl shadow-black/25 backdrop-blur-md flex items-center gap-3"
            id="secure-shield-icon-container"
          >
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
          </motion.div>
        </div>
        <h2 id="registration-title" className="text-center text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-1">
          {roleType === 'investor' ? t('register.title', 'Registrasi Akun Investor / Pelaku Usaha') : 'Registrasi Akun Masyarakat / Pemohon'}
        </h2>
        <p id="registration-subtitle" className="text-center text-xs text-slate-600 dark:text-slate-400 font-medium max-w-xs sm:max-w-sm mx-auto px-2">
          {roleType === 'investor' 
            ? t('register.subtitle', 'Akses fasilitas perizinan investasi corporate, data spasial terpadu, dan pendampingan DPMPTSP Kabupaten Luwu.')
            : 'Pendaftaran mandiri untuk antrian pelayanan publik MPP dan pengajuan permohonan ruang / PKKPR non-komersial.'}
        </p>
      </div>

      <div className="mt-4 sm:mt-5 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-2 sm:px-0">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="bg-white/95 dark:bg-surface/95 border border-slate-200/90 dark:border-slate-800/90 shadow-2xl rounded-3xl backdrop-blur-xl overflow-hidden transition-all"
          id="registration-card"
        >
          {/* Top Gradient Accent Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500" />

          <div className="p-5 sm:p-7">
          {isSuccess ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-6"
              id="success-state-container"
            >
              <div className="flex justify-center mb-4">
                <CheckCircle2 size={52} className="text-emerald-600 dark:text-emerald-400 animate-bounce" id="success-check-icon" />
              </div>
              <h3 id="success-title" className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                {roleType === 'investor' ? 'Registrasi Akun Investor Berhasil!' : 'Registrasi Akun Masyarakat Berhasil!'}
              </h3>
              <p id="success-desc" className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-5">
                {roleType === 'investor' 
                  ? 'Akun investor Anda telah terdaftar. Silakan masuk untuk mengakses portal investasi & PKKPR Berusaha.'
                  : 'Akun masyarakat Anda telah aktif. Silakan masuk untuk mengambil antrian MPP atau mengajukan permohonan.'}
              </p>
              <button
                id="btn-go-to-portal"
                onClick={() => {
                  window.location.replace(roleType === 'investor' ? '/investor-dashboard' : '/masyarakat-dashboard');
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-md shadow-black/25"
              >
                <span>{roleType === 'investor' ? 'Masuk ke Dashboard Investor' : 'Masuk ke Dashboard Masyarakat'}</span>
                <ChevronRight size={16} />
              </button>
            </motion.div>
          ) : (
            <form id="investor-registration-form" className="space-y-4 sm:space-y-4.5" onSubmit={handleSubmit}>

              {/* Role Selection Tabs */}
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setRoleType('investor')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    roleType === 'investor'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  🏢 Investor (Pelaku Usaha)
                </button>
                <button
                  type="button"
                  onClick={() => setRoleType('masyarakat')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    roleType === 'masyarakat'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  👤 Masyarakat (Warga)
                </button>
              </div>

              {/* 1. Full Name */}
              <div>
                <label htmlFor="reg-full-name" className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {roleType === 'investor' ? t('register.fullName', 'Nama Lengkap Pimpinan / Pemohon') : 'Nama Lengkap (Sesuai KTP)'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <input
                    id="reg-full-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value.toUpperCase())}
                    className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-base/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-xs sm:text-sm uppercase"
                    placeholder="CONTOH: BUDI SANTOSO"
                  />
                </div>
              </div>

              {/* 2. NIK (16 Digit Wajib) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="reg-nik" className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    Nomor Induk Kependudukan (NIK 16 Digit) <span className="text-rose-500">*</span>
                  </label>
                  {isCheckingUnique && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" /> Memeriksa...
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <input
                    id="reg-nik"
                    type="text"
                    required
                    maxLength={16}
                    value={nik}
                    onChange={(e) => handleValidateNik(e.target.value)}
                    onBlur={() => {
                      if (nik.length === 16) triggerCheckNikUnique(nik);
                    }}
                    className={`block w-full pl-10 pr-3.5 py-2.5 border rounded-xl bg-white dark:bg-base/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-colors text-xs sm:text-sm font-mono tracking-wider ${
                      fieldConflicts.nik 
                        ? 'border-rose-500 focus:ring-rose-500 bg-rose-50/20 dark:bg-rose-950/20' 
                        : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
                    }`}
                    placeholder="7317xxxxxxxxxxxx"
                  />
                </div>
                {fieldConflicts.nik && (
                  <p className="mt-1 text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                    <AlertCircle size={13} className="shrink-0" />
                    <span>{fieldConflicts.nik}</span>
                  </p>
                )}
              </div>

              {/* Investor Specific: Company Name, Asal Negara, NIB */}
              {roleType === 'investor' && (
                <>
                  {/* Company Name */}
                  <div>
                    <label htmlFor="reg-company-name" className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                      {t('register.companyName', 'Nama Perusahaan / Institusi')} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                        <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <input
                        id="reg-company-name"
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-base/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-xs sm:text-sm"
                        placeholder="PT. Luwu Maju Sejahtera"
                      />
                    </div>
                  </div>

                  {/* Asal Negara */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                        {t('investor_origin', 'Asal Negara')}
                      </label>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        statusModal === 'PMDN' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30' 
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30'
                      }`}>
                        {statusModal === 'PMDN' ? '🇮🇩 PMDN (Dalam Negeri)' : '🌐 PMA (Penanaman Modal Asing)'}
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                        <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <select
                        value={negara}
                        onChange={(e) => setNegara(e.target.value)}
                        className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-base/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-xs sm:text-sm font-medium cursor-pointer"
                      >
                        {daftarNegara.map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* NIB (13 Digit) */}
                  <div>
                    <label htmlFor="reg-nib" className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                      {t('register.nib', 'Nomor Induk Berusaha (NIB) Perusahaan')} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <input
                        id="reg-nib"
                        type="text"
                        required
                        maxLength={13}
                        value={nib}
                        onChange={(e) => handleValidateNib(e.target.value)}
                        onBlur={() => {
                          if (nib.length === 13) triggerCheckNibUnique(nib);
                        }}
                        className={`block w-full pl-10 pr-3.5 py-2.5 border rounded-xl bg-white dark:bg-base/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-colors text-xs sm:text-sm font-mono tracking-wider ${
                          fieldConflicts.nib
                            ? 'border-rose-500 focus:ring-rose-500 bg-rose-50/20 dark:bg-rose-950/20'
                            : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
                        }`}
                        placeholder="Contoh: 1234567890123"
                      />
                    </div>
                    {fieldConflicts.nib ? (
                      <p className="mt-1 text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                        <AlertCircle size={13} className="shrink-0" />
                        <span>{fieldConflicts.nib}</span>
                      </p>
                    ) : (
                      <p id="nib-help-text" className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
                        <span>Wajib 13 digit angka resmi terbitan OSS RBA untuk perizinan investasi & tata ruang.</span>
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* 3. Alamat Email */}
              <div>
                <label htmlFor="reg-email" className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {roleType === 'investor' ? 'Alamat Email Resmi Perusahaan' : 'Alamat Email'} {roleType === 'investor' ? <span className="text-rose-500">*</span> : <span className="text-slate-400 font-normal text-xs ml-1">(Opsional)</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <input
                    id="reg-email"
                    type="email"
                    required={roleType === 'investor'}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      triggerCheckEmailUnique(e.target.value);
                    }}
                    onBlur={() => triggerCheckEmailUnique(email)}
                    className={`block w-full pl-10 pr-3.5 py-2.5 border rounded-xl bg-white dark:bg-base/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-colors text-xs sm:text-sm ${
                      fieldConflicts.email
                        ? 'border-rose-500 focus:ring-rose-500 bg-rose-50/20 dark:bg-rose-950/20'
                        : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
                    }`}
                    placeholder={roleType === 'investor' ? 'investor@perusahaan.co.id' : 'warga@email.com (opsional)'}
                  />
                </div>
                {fieldConflicts.email && (
                  <p className="mt-1 text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                    <AlertCircle size={13} className="shrink-0" />
                    <span>{fieldConflicts.email}</span>
                  </p>
                )}
              </div>

              {/* 4. WhatsApp Kontak */}
              <div>
                <label htmlFor="reg-whatsapp" className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Nomor WhatsApp / Narahubung <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                  </div>
                  <input
                    id="reg-whatsapp"
                    type="tel"
                    inputMode="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => {
                      setWhatsapp(e.target.value);
                      triggerCheckPhoneUnique(e.target.value);
                    }}
                    onBlur={() => triggerCheckPhoneUnique(whatsapp)}
                    className={`block w-full pl-10 pr-3.5 py-2.5 border rounded-xl bg-white dark:bg-base/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-colors text-xs sm:text-sm ${
                      fieldConflicts.whatsapp
                        ? 'border-rose-500 focus:ring-rose-500 bg-rose-50/20 dark:bg-rose-950/20'
                        : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
                    }`}
                    placeholder="Contoh: 081234567890"
                  />
                </div>
                {fieldConflicts.whatsapp && (
                  <p className="mt-1 text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                    <AlertCircle size={13} className="shrink-0" />
                    <span>{fieldConflicts.whatsapp}</span>
                  </p>
                )}
              </div>

              {/* 5. Password with Show/Hide Toggle */}
              <div>
                <label htmlFor="reg-password" className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {t('register.password', 'Kata Sandi Akun')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <input
                    id="reg-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-11 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-base/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-xs sm:text-sm"
                    placeholder="Minimal 6 karakter"
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

              {/* Notifikasi Konflik Unik / Terdaftar */}
              {conflictSummaryMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 shadow-sm">
                  <AlertCircle size={18} className="shrink-0 text-rose-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold mb-1">Data Sudah Terdaftar</p>
                    <p className="text-[11px] leading-relaxed mb-2">{conflictSummaryMessage}</p>
                    <button
                      type="button"
                      onClick={() => {
                        requestSmartFullscreen();
                        navigate(`/login?role=${roleType}`);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                    >
                      <span>Masuk / Login Sekarang</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              )}

              {/* Error messages */}
              {error && (
                <div id="registration-error-container" className="flex items-start gap-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-3 rounded-xl text-xs">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  id="reg-submit-btn"
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="w-full min-h-[46px] sm:min-h-[48px] flex justify-center items-center gap-2 py-3 px-4 border border-emerald-400/30 rounded-xl shadow-md shadow-black/25 text-xs sm:text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer group"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" id="submit-spinner" />
                      <span>{t('register.btnLoading', 'Memverifikasi Data NIB...')}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      <span>{t('register.btnSubmit', 'Daftar Akun Investor Corporate')}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-4 text-center pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    requestSmartFullscreen();
                    navigate(`/login?role=investor`);
                  }}
                  className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer"
                >
                  {t('register.alreadyHaveAccount', 'Sudah punya akun investor? Masuk ke Portal')}
                </button>
              </div>
            </form>
          )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// feat: implement dynamic dependent dropdown for wilayah
// ux polish: dual-option camera and gallery for ktp registration
// hotfix: fix floating navbar, apply light mode to auth, and translate OSS simulator

