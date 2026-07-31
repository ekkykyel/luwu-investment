import { requestSmartFullscreen } from "../../utils/fullscreen.js";
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Building2, Mail, Lock, LogIn, ChevronRight, AlertCircle, ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient.js';
import { isMobileOrAndroidDevice } from '../../hooks/useDeviceAutomation.js';

export default function InvestorLogin() {
  const { t } = useTranslation();

  const [isFullscreen, setIsFullscreen] = useState(false);

  const [loginRole, setLoginRole] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    if (roleParam === 'investor') return 'investor';
    if (roleParam === 'masyarakat') return 'masyarakat';
    return 'admin_dalak'; // default for admin
  });
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);


  // Auto-set role from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    if (roleParam === 'masyarakat') {
      setLoginRole('masyarakat');
      setIdentifier('');
    } else if (roleParam) {
      setLoginRole(roleParam);
      setIdentifier('');
    }
  }, []);

  // Auto-fullscreen on first interaction when login page opens (Mobile/Android ONLY)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleFirstInteraction = () => {
      if (!isMobileOrAndroidDevice()) return; // Desktop/Laptop exception

      if (!document.fullscreenElement) {
        const elem = document.documentElement as any;
        requestSmartFullscreen();
      }
    };

    window.addEventListener("click", handleFirstInteraction, { once: true });
    window.addEventListener("touchstart", handleFirstInteraction, { once: true });
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setIsSuccess(false);
    
    try {
      let finalEmail = identifier.trim();
      
      // If role is masyarakat, the identifier is a NIK. Convert it to the dummy email.
      if (loginRole === 'masyarakat') {
        const cleanNik = finalEmail.split('@')[0].trim();
        if (!/^\d{16}$/.test(cleanNik)) {
           setError(t('auth.nikError', 'NIK harus berupa 16 digit angka'));
           setIsSubmitting(false);
           return;
        }
        finalEmail = `${cleanNik}@warga.luwukab.go.id`;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: finalEmail,
        password
      });

      if (signInError) throw signInError;

      if (data?.session) {
        // Set cookie so middleware detects it immediately
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=86400; SameSite=None; Secure`;
        
        // Save to localStorage so global fetch interceptors and helpers can read it
        localStorage.setItem("luwu_session_token", data.session.access_token);
        
        // Register session in memory immediately
        await supabase.auth.setSession(data.session);

        // Validate user role before redirecting
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.session.user.id)
          .single();

        if (profileError || !profile) {
          throw new Error(t('auth.roleVerifyFailed', 'Gagal memverifikasi akun. Profil atau peran tidak ditemukan.'));
        }

        undefined;
        
        setIsSuccess(true);
        // Route to dashboard after a brief delay
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || t('auth.loginFailed', 'Login gagal, periksa email dan password.'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-6 sm:py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Top Header Controls: Back to Landing Page & Fullscreen Toggle */}
      <div className="w-full max-w-md mx-auto px-4 mb-4 flex items-center justify-between relative z-20">
        <button
          type="button"
          onClick={() => {
            try {
              if (!document.fullscreenElement) {
                const elem = document.documentElement as any;
                requestSmartFullscreen()
              }
            } catch (e) {}
            window.location.href = "/?skipSplash=true&fullscreen=true";
          }}
          className="flex items-center gap-2 px-3.5 py-2 min-h-[44px] bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700/80 text-xs font-semibold transition-all cursor-pointer shadow-md active:scale-95"
        >
          <ArrowLeft size={16} />
          <span>{t('auth.backToHome', 'Kembali ke Landing Page')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (!document.fullscreenElement) {
              const elem = document.documentElement as any;
              requestSmartFullscreen()
            } else {
              (window as any).__lastExitFullscreenTime = Date.now();
              document.exitFullscreen().catch(() => {});
            }
          }}
          className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] bg-slate-900/90 hover:bg-slate-800 text-emerald-400 rounded-xl border border-slate-700/80 text-xs font-bold transition-all cursor-pointer shadow-md active:scale-95"
          title={isFullscreen ? "Keluar Layar Penuh" : "Mode Layar Penuh"}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          <span>{isFullscreen ? "Keluar Penuh" : "Layar Penuh"}</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-blue-600/20 text-blue-500 rounded-2xl">
            <Building2 size={32} />
          </div>
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-white mb-2">
          {t('auth.portalTitle', 'Login Portal Dashboard')}
        </h2>
        <p className="text-center text-sm text-slate-400">
          {loginRole === 'masyarakat' 
            ? t('auth.subtitleMasyarakat', 'Masyarakat/Publik') 
            : loginRole === 'investor'
            ? t('auth.subtitleInvestor', 'Investor/Mitra Bisnis')
            : t('auth.subtitleAdmin', 'Admin OSS, Admin Dalak, Admin Data & Admin Promosi')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/80 border border-slate-800 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 backdrop-blur-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* Dropdown Role Login */}
            {new URLSearchParams(window.location.search).get('role') !== 'masyarakat' && new URLSearchParams(window.location.search).get('role') !== 'investor' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('auth.loginAs', 'Masuk Sebagai')}</label>
              <select
                value={loginRole}
                onChange={(e) => {
                  setLoginRole(e.target.value);
                  setIdentifier(''); // Reset input when changing roles
                }}
                className="block w-full pl-3 pr-10 py-2.5 border border-slate-700 rounded-xl bg-slate-950/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors sm:text-sm appearance-none"
              >
                <option value="admin_dalak">{t('auth.roleDalak', 'Admin - Bidang Dalak')}</option>
                <option value="admin_promosi">{t('auth.rolePromosi', 'Admin - Bidang Promosi')}</option>
                <option value="admin_oss">{t('auth.roleOss', 'Admin - Bidang Perizinan (OSS)')}</option>
                <option value="admin_data">{t('auth.roleData', 'Admin - Perencanaan & Data')}</option>
              </select>
            </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300">
                {loginRole === 'masyarakat' ? t('auth.nikLabel', 'Nomor Induk Kependudukan (NIK)') : t('auth.emailLabel', 'Alamat Email')}
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type={loginRole === 'masyarakat' ? 'text' : 'email'}
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  maxLength={loginRole === 'masyarakat' ? 16 : 255}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-xl bg-slate-950/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors sm:text-sm"
                  placeholder={loginRole === 'masyarakat' ? t('auth.nikPlaceholder', 'Masukkan 16 digit NIK...') : t('auth.emailPlaceholder', 'email@domain.com')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">
                {t('auth.password', 'Password')}
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-xl bg-slate-950/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-xs">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {isSuccess && (
              <div className="flex items-start gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs">
                <LogIn size={16} className="shrink-0 mt-0.5" />
                <span>{t('auth.loginSuccess', 'Login sukses, mengarahkan ke dashboard...')}</span>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSubmitting || !identifier || !password}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={18} />
                    {t('auth.loginBtn', 'Sign In')}
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center flex flex-col gap-3">
            
            <button 
              type="button"
              onClick={() => {
                try {
                  if (!document.fullscreenElement) {
                    const elem = document.documentElement as any;
                    requestSmartFullscreen()
                  }
                } catch (e) {}
                window.location.href = '/?skipSplash=true&fullscreen=true';
              }}
              className="text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              {t('auth.backToHome', 'Kembali ke Landing Page')}
            </button>
          </div>
        </div>
      </div>
      {/* ux tweak: nuke email for citizens, use nik-based dummy email */}
      {/* feat: implement unified role-based login gateway */}
    </div>
  );
}

// ux polish: contextual login routing and hero button text
