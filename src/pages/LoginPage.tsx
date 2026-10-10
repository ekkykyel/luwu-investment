import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Lock, 
  CreditCard, 
  LogIn, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  KeyRound, 
  ArrowLeft,
  Shield
} from 'lucide-react';
import { LUWU_LOGO_BASE64 } from '@/lib/logoBase64';
import { signInMasyarakatWithNikPassword } from '@/services/authService';
import { ActivateAccountModal } from '@/components/Auth/ActivateAccountModal';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);

  const handleNikChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 16);
    setNik(clean);
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nik.length !== 16) {
      setError('NIK harus tepat 16 digit angka sesuai KTP.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await signInMasyarakatWithNikPassword(nik, password);
      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => {
          const redirectParam = new URLSearchParams(location.search).get('redirect');
          if (redirectParam === 'form-pkkpr') {
            window.location.replace('/masyarakat-dashboard?tab=pkkpr&open_pkkpr=true');
          } else {
            window.location.replace('/masyarakat-dashboard');
          }
        }, 600);
      } else {
        setError(result.error || 'Login gagal. Periksa NIK dan kata sandi Anda.');
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal terhubung ke server autentikasi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-base text-slate-900 dark:text-white flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Ambience Accent */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-4">
          <div className="p-2.5 bg-white/90 dark:bg-surface/90 rounded-2xl border border-emerald-500/30 shadow-xl backdrop-blur-md flex items-center gap-3">
            <img 
              src={LUWU_LOGO_BASE64} 
              alt="Logo Pemkab Luwu" 
              className="h-11 w-auto object-contain" 
            />
            <div className="flex flex-col text-left pr-1 border-l border-slate-200 dark:border-slate-800 pl-3">
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
                PEMKAB LUWU
              </span>
              <span className="text-xs sm:text-sm font-black tracking-tight text-slate-900 dark:text-white">
                Portal Perizinan & MPP
              </span>
            </div>
          </div>
        </div>

        <h2 className="text-center text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-1 font-display">
          Masuk Akun Pemohon
        </h2>
        <p className="text-center text-xs text-slate-600 dark:text-slate-400 font-medium">
          Masuk dengan NIK dan Kata Sandi untuk akses layanan PKKPR
        </p>
      </div>

      <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/95 dark:bg-surface/95 border border-slate-200/90 dark:border-slate-800/90 shadow-2xl rounded-3xl backdrop-blur-xl overflow-hidden p-6 sm:p-7">
          <div className="h-1.5 w-full -mt-6 -mx-6 mb-6 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-600" />

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Masukkan 16 digit NIK dan kata sandi akun perizinan Anda.
              </span>
            </div>

            {/* Input NIK */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Nomor Induk Kependudukan (NIK)
                </label>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  nik.length === 16 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400' : 'text-slate-400'
                }`}>
                  {nik.length}/16
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
                  value={nik}
                  onChange={(e) => handleNikChange(e.target.value)}
                  placeholder="Contoh: 7317xxxxxxxxxxxx"
                  className="block w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white text-gray-900 placeholder-gray-400 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Masukkan minimal 6 karakter kata sandi"
                  className="block w-full pl-10 pr-10 py-2.5 sm:py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white text-gray-900 placeholder-gray-400 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Alert Error */}
            {error && (
              <div className="flex items-start gap-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-3 rounded-xl text-xs">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Alert Success */}
            {isSuccess && (
              <div className="flex items-start gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-3 rounded-xl text-xs">
                <LogIn size={16} className="shrink-0 mt-0.5" />
                <span>Login berhasil! Mengarahkan ke dashboard...</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || nik.length !== 16 || password.length < 6}
              className="w-full min-h-[46px] flex justify-center items-center gap-2 py-3 px-4 border border-emerald-400/30 rounded-xl shadow-md text-xs sm:text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses Masuk...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn size={16} />
                  <span>Masuk ke Dashboard</span>
                </div>
              )}
            </button>

            {/* Link Aktivasi Akun Lama */}
            <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800/80 mt-3 space-y-2">
              <button
                type="button"
                onClick={() => setIsActivateModalOpen(true)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
              >
                <KeyRound size={13} className="shrink-0 text-indigo-500" />
                <span>Pernah daftar PKKPR sebelumnya? Klik di sini untuk buat password akun</span>
              </button>

              <div className="flex items-center justify-center gap-3 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                <button
                  type="button"
                  onClick={() => navigate('/mpp')}
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  Ambil Antrean Online
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="hover:underline flex items-center gap-1"
                >
                  <ArrowLeft size={11} />
                  <span>Beranda</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Modal Aktivasi Akun */}
      <ActivateAccountModal
        isOpen={isActivateModalOpen}
        onClose={() => setIsActivateModalOpen(false)}
        onSuccess={(activatedNik) => {
          setNik(activatedNik);
          setError(null);
        }}
        initialIdentifier={nik}
      />
    </div>
  );
};

export default LoginPage;
