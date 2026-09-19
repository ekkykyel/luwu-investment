import { LUWU_LOGO_BASE64 } from "@/lib/logoBase64";
import { requestSmartFullscreen } from "../../utils/fullscreen";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, User, Building2, Mail, FileText, Lock, CheckCircle2, ChevronRight, AlertCircle, Phone, ArrowLeft, Eye, EyeOff, Globe } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

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

  // Form states for Investor Registration
  const [fullName, setFullName] = useState('');
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

  const statusModal = negara === 'Indonesia' ? 'PMDN' : 'PMA';

  const isSubmitDisabled = useMemo(() => {
    if (isSubmitting) return true;
    if (!fullName.trim()) return true;
    if (!password || password.length < 6) return true;
    if (!email.trim() || !email.includes('@')) return true;
    if (!companyName.trim()) return true;
    if (nib.replace(/\D/g, '').length !== 13) return true;
    return false;
  }, [isSubmitting, fullName, password, email, companyName, nib]);

  const handleValidateNib = (val: string) => {
    const cleanVal = val.replace(/\D/g, '').slice(0, 13);
    setNib(cleanVal);
    if (cleanVal.length > 0 && cleanVal.length !== 13) {
      setError(t('nibVerification.errorNibLength', 'NIB harus tepat 13 digit angka dari OSS RBA.'));
    } else {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalEmail = email.trim().toLowerCase();

    if (!finalEmail || !finalEmail.includes('@')) {
      setError('Harap masukkan alamat email yang valid.');
      return;
    }
    if (nib.replace(/\D/g, '').length !== 13) {
      setError(t('nibVerification.errorNibLength', 'NIB Perusahaan harus tepat 13 digit.'));
      return;
    }
    if (!companyName.trim()) {
      setError('Nama Perusahaan wajib diisi.');
      return;
    }
    if (password.length < 6) {
      setError(t('register.errorPassword', 'Kata sandi minimal 6 karakter.'));
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const metaData = {
        full_name: fullName.trim().toUpperCase(),
        role: 'investor',
        email: finalEmail,
        company_name: companyName.trim(),
        nib: nib.trim(),
        negara_asal: negara,
        status_modal: statusModal,
        whatsapp: whatsapp.trim(),
        no_whatsapp: whatsapp.trim()
      };

      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: finalEmail,
        password: password,
        options: {
          data: metaData
        }
      });

      if (signUpErr) {
        throw signUpErr;
      }

      if (data?.user) {
        const profilePayload = {
          id: data.user.id,
          full_name: fullName.trim().toUpperCase(),
          role: 'investor',
          email: finalEmail,
          company_name: companyName.trim(),
          nib: nib.trim(),
          negara_asal: negara,
          status_modal: statusModal,
          whatsapp: whatsapp.trim(),
          no_whatsapp: whatsapp.trim()
        };

        try {
          await fetch('/api/profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profilePayload)
          });
        } catch {
          try {
            await supabase.from('profiles').upsert(profilePayload);
          } catch (profErr) {
            console.warn('Profile upsert warning:', profErr);
          }
        }
      }

      if (data?.session) {
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=86400; SameSite=None; Secure`;
        localStorage.setItem("luwu_session_token", data.session.access_token);
        localStorage.setItem("luwu_user_role", 'investor');
        localStorage.setItem("luwu_user_email", finalEmail);
      }

      setIsSubmitting(false);
      setIsSuccess(true);
    } catch (err: any) {
      let errMsg = err?.message || t('register.errorDefault', 'Gagal melakukan registrasi, periksa kembali data Anda.');
      if (typeof errMsg === 'string' && (errMsg.toLowerCase().includes('already registered') || errMsg.toLowerCase().includes('already exists'))) {
        errMsg = 'Akun dengan email ini sudah terdaftar. Silakan masuk ke portal.';
      }
      setError(errMsg);
      setIsSubmitting(false);
    }
  };

  return (
    <div id="investor-registration-page" className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-center py-6 sm:py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
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
            className="p-2 sm:p-2.5 bg-gradient-to-br from-white/90 via-emerald-50/50 to-slate-100/80 dark:from-slate-800/90 dark:via-slate-800/60 dark:to-slate-900/90 rounded-2xl border border-emerald-500/30 shadow-xl shadow-emerald-500/10 backdrop-blur-md flex items-center gap-3"
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
          {t('register.title', 'Registrasi Akun Investor / Pelaku Usaha')}
        </h2>
        <p id="registration-subtitle" className="text-center text-xs text-slate-600 dark:text-slate-400 font-medium max-w-xs sm:max-w-sm mx-auto px-2">
          {t('register.subtitle', 'Akses fasilitas perizinan investasi corporate, data spasial terpadu, dan pendampingan DPMPTSP Kabupaten Luwu.')}
        </p>
      </div>

      <div className="mt-4 sm:mt-5 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-2 sm:px-0">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800/90 shadow-2xl rounded-3xl backdrop-blur-xl overflow-hidden transition-all"
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
                {t('register.successTitle', 'Registrasi Akun Investor Berhasil!')}
              </h3>
              <p id="success-desc" className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-5">
                {t('register.successDescInvestor', 'Akun investor Anda telah aktif. Masuk ke portal untuk mulai mengurus perizinan dan investasi.')}
              </p>
              <button
                id="btn-go-to-portal"
                onClick={() => {
                  window.location.replace('/dashboard');
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-md shadow-emerald-900/20"
              >
                <span>{t('register.btnGoDashboard', 'Masuk ke Dashboard')}</span>
                <ChevronRight size={16} />
              </button>
            </motion.div>
          ) : (
            <form id="investor-registration-form" className="space-y-4 sm:space-y-4.5" onSubmit={handleSubmit}>

              {/* 1. Full Name */}
              <div>
                <label htmlFor="reg-full-name" className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {t('register.fullName', 'Nama Lengkap Pimpinan / Pemohon')} <span className="text-rose-500">*</span>
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
                    className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-xs sm:text-sm uppercase"
                    placeholder="CONTOH: BUDI SANTOSO"
                  />
                </div>
              </div>

              {/* 2. Company Name */}
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
                    className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-xs sm:text-sm"
                    placeholder="PT. Luwu Maju Sejahtera"
                  />
                </div>
              </div>

              {/* 3. Field Negara Asal & Status PMA/PMDN */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    {t('investor_origin', 'Asal Negara')}
                  </label>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    statusModal === 'PMDN' 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30' 
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30'
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
                    className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-xs sm:text-sm font-medium cursor-pointer"
                  >
                    {daftarNegara.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. Email Perusahaan */}
              <div>
                <label htmlFor="reg-email" className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {t('register.email', 'Email Perusahaan / Korespondensi')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-xs sm:text-sm"
                    placeholder="investor@perusahaan.com"
                  />
                </div>
              </div>

              {/* 5. NIB */}
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
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    maxLength={13}
                    value={nib}
                    onChange={(e) => handleValidateNib(e.target.value)}
                    className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-xs sm:text-sm"
                    placeholder="Contoh: 1234567890123 (13 Digit)"
                  />
                </div>
                <p id="nib-help-text" className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
                  <span>Wajib 13 digit angka resmi terbitan OSS RBA untuk perizinan investasi & tata ruang.</span>
                </p>
              </div>

              {/* 6. WhatsApp Kontak */}
              <div>
                <label htmlFor="reg-whatsapp" className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Nomor WhatsApp / Narahubung
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                  </div>
                  <input
                    id="reg-whatsapp"
                    type="tel"
                    inputMode="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-xs sm:text-sm"
                    placeholder="Contoh: 081234567890"
                  />
                </div>
              </div>

              {/* 7. Password with Show/Hide Toggle */}
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
                    className="block w-full pl-10 pr-11 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-xs sm:text-sm"
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
                  className="w-full min-h-[46px] sm:min-h-[48px] flex justify-center items-center gap-2 py-3 px-4 border border-emerald-400/30 rounded-xl shadow-md shadow-emerald-900/20 text-xs sm:text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer group"
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

