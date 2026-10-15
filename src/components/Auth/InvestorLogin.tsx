import { LUWU_LOGO_BASE64 } from "@/lib/logoBase64";
import { requestSmartFullscreen } from "../../utils/fullscreen";
import { useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { 
  Building2, 
  Mail, 
  Lock, 
  LogIn, 
  ChevronRight, 
  ChevronDown,
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
  Sparkles,
  MapPin
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useProfile } from '../../hooks/useProfile';
import { signInMasyarakatWithNikPassword } from '../../services/authService';
import { ActivateAccountModal } from './ActivateAccountModal';

export const ADMIN_ROLE_DETAILS: Record<string, { label: string; email: string; aliases: string[] }> = {
  admin_promosi: {
    label: 'Bidang Promosi & Penanaman Modal',
    email: 'promosiluwu@gmail.com',
    aliases: ['promosiluwu@gmail.com', 'promosi@luwukab.go.id']
  },
  admin_puptr: {
    label: 'Dinas PUPTR (Tata Ruang & Studio GIS)',
    email: 'puptr@luwukab.go.id',
    aliases: ['puptr@luwukab.go.id', 'adminpuptr@luwukab.go.id', 'tataruangluwu@gmail.com']
  },
  admin_pertanian: {
    label: 'Dinas Pertanian (Verifikasi Lahan LP2B)',
    email: 'pertanian@luwukab.go.id',
    aliases: ['pertanian@luwukab.go.id', 'adminpertanian@luwukab.go.id', 'distanluwu@gmail.com']
  },
  admin_dalak: {
    label: 'Bidang Pengendalian & Pengawasan (Dalak)',
    email: 'dalakluwu@gmail.com',
    aliases: ['dalakluwu@gmail.com', 'dalak@luwukab.go.id']
  },
  admin_oss: {
    label: 'Bidang Penyelenggaraan Pelayanan Perizinan (OSS)',
    email: 'dpmptspluwu@gmail.com',
    aliases: ['dpmptspluwu@gmail.com', 'officialdpmptspluwu@gmail.com', 'oss@luwukab.go.id']
  },
  admin_data: {
    label: 'Bidang Perencanaan, Pengembangan Iklim & Data',
    email: 'dataluwu@gmail.com',
    aliases: ['dataluwu@gmail.com', 'data@luwukab.go.id']
  },
  admin_mpp: {
    label: 'Admin MPP (Pengelola Mal Pelayanan Publik)',
    email: 'adminmpp@luwukab.go.id',
    aliases: ['adminmpp@luwukab.go.id', 'mppluwu@gmail.com']
  }
};

export const ROLE_LABELS: Record<string, string> = {
  investor: 'Investor',
  masyarakat: 'Warga',
  admin_promosi: 'Bidang Promosi & Penanaman Modal',
  admin_puptr: 'Dinas PUPTR (Tata Ruang & Studio GIS)',
  admin_pertanian: 'Dinas Pertanian (Verifikasi Lahan LP2B)',
  admin_dalak: 'Bidang Pengendalian & Pengawasan (Dalak)',
  admin_oss: 'Bidang Penyelenggaraan Pelayanan Perizinan (OSS)',
  admin_data: 'Bidang Perencanaan, Pengembangan Iklim & Data',
  admin_mpp: 'Admin MPP (Pengelola Mal Pelayanan Publik)',
  superadmin: 'Super Administrator'
};

export function getKnownRoleFromEmail(email: string): string | null {
  const clean = email.trim().toLowerCase();
  for (const [roleKey, details] of Object.entries(ADMIN_ROLE_DETAILS)) {
    if (details.email.toLowerCase() === clean || details.aliases.some(a => a.toLowerCase() === clean)) {
      return roleKey;
    }
  }
  return null;
}

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

  const [adminSpecificRole, setAdminSpecificRole] = useState<'admin_puptr' | 'admin_pertanian' | 'admin_dalak' | 'admin_data' | 'admin_promosi' | 'admin_oss' | 'admin_mpp'>('admin_promosi');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // ─── Masyarakat NIK + Password States ───
  const [wargaNik, setWargaNik] = useState('');
  const [wargaPassword, setWargaPassword] = useState('');
  const [showWargaPassword, setShowWargaPassword] = useState(false);
  const [wargaError, setWargaError] = useState<string | null>(null);
  const [isSubmittingWarga, setIsSubmittingWarga] = useState(false);
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);

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
    'adminmpp@luwukab.go.id': 'admin_mpp',
    'mppluwu@gmail.com': 'admin_mpp',
    'mpp@luwukab.go.id': 'admin_mpp',
    'nilambintangselatan@gmail.com': 'admin_mpp',
  };

  // ── Role Barometer Discrepancy Notifier ──
  const notifyRoleMismatch = ({
    message,
    suggestedCategory,
    suggestedAdminRole
  }: {
    message: string;
    suggestedCategory?: 'masyarakat' | 'investor' | 'admin';
    suggestedAdminRole?: string;
  }) => {
    const fullMsg = `Silahkan Sesuaikan Role Anda: ${message}`;
    setError(fullMsg);
    Swal.fire({
      title: 'Silahkan Sesuaikan Role Anda',
      html: `
        <div class="text-left text-sm text-slate-300 space-y-3">
          <div class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-start gap-2.5">
            <span class="text-xl shrink-0">⚠️</span>
            <p class="leading-relaxed text-xs">${message}</p>
          </div>
          <p class="text-[11px] text-slate-400">Pilihan role pada halaman portal ini bertindak sebagai barometer kontrol. Mohon sesuaikan opsi masuk dengan akun Anda.</p>
        </div>
      `,
      icon: 'warning',
      confirmButtonText: suggestedCategory || suggestedAdminRole ? 'Sesuaikan Role Sekarang' : 'Mengerti',
      showCancelButton: true,
      cancelButtonText: 'Tutup',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#475569',
      background: '#0f172a',
      color: '#f8fafc'
    }).then((result) => {
      if (result.isConfirmed) {
        if (suggestedCategory) {
          setMainRoleCategory(suggestedCategory);
          setError(null);
        }
        if (suggestedAdminRole && ADMIN_ROLE_DETAILS[suggestedAdminRole]) {
          setMainRoleCategory('admin');
          setAdminSpecificRole(suggestedAdminRole as any);
          setError(null);
        }
      }
    });
  };

  const handleIdentifierChange = (val: string) => {
    setIdentifier(val);
    setError(null);
  };

  // ── Handle NIK Change & Auto Check ──
  const handleWargaNikChange = (val: string) => {
    // Barometer check: Deteksi jika user memasukkan email di tab Warga
    if (val.includes('@')) {
      const cleanEmail = val.trim().toLowerCase();
      const knownRole = getKnownRoleFromEmail(cleanEmail);
      const targetLabel = knownRole ? (ADMIN_ROLE_DETAILS[knownRole]?.label || 'Admin OPD') : 'Investor / Admin';
      notifyRoleMismatch({
        message: `Anda memasukkan alamat email pada menu Warga. Akun email ini diperuntukkan untuk login ${targetLabel}. Silakan sesuaikan pilihan role Anda.`,
        suggestedCategory: knownRole ? 'admin' : 'investor',
        suggestedAdminRole: knownRole || undefined
      });
      return;
    }

    const clean = val.replace(/\D/g, '').slice(0, 16);
    setWargaNik(clean);
    setWargaError(null);
  };

  // ── Submit NIK + Password for Masyarakat ──
  const handleLoginMasyarakat = async (e: React.FormEvent) => {
    e.preventDefault();
    setWargaError(null);
    const cleanNik = wargaNik.replace(/\D/g, '').trim();

    if (cleanNik.length !== 16) {
      setWargaError('Nomor Induk Kependudukan (NIK) wajib tepat 16 digit angka sesuai KTP.');
      return;
    }
    if (!wargaPassword || wargaPassword.length < 6) {
      setWargaError('Kata sandi wajib diisi minimal 6 karakter.');
      return;
    }

    setIsSubmittingWarga(true);
    try {
      // Barometer check: Pastikan bukan akun terdaftar sebagai Investor atau Admin di profiles
      const { data: profData } = await supabase
        .from('profiles')
        .select('id, role, full_name, email, nik')
        .eq('nik', cleanNik)
        .maybeSingle();

      if (profData && profData.role && profData.role !== 'masyarakat') {
        const isInvestor = profData.role === 'investor';
        const roleLabel = isInvestor ? 'Investor' : (ADMIN_ROLE_DETAILS[profData.role]?.label || 'Administrator OPD');
        notifyRoleMismatch({
          message: `NIK ${cleanNik} terdaftar dalam sistem sebagai akun ${roleLabel}. Akses ditolak pada portal Warga. Silakan sesuaikan role login Anda.`,
          suggestedCategory: isInvestor ? 'investor' : 'admin',
          suggestedAdminRole: isInvestor ? undefined : profData.role
        });
        setWargaError(`Silahkan Sesuaikan Role Anda: NIK ini terdaftar sebagai ${roleLabel}.`);
        setIsSubmittingWarga(false);
        return;
      }

      // Otentikasi resmi Supabase Auth melalui helper dummy email (<nik>@warga.simpurusiang.go.id)
      const res = await signInMasyarakatWithNikPassword(cleanNik, wargaPassword);
      if (!res.success) {
        throw new Error(res.error || 'NIK atau Kata Sandi salah. Pastikan Anda telah terdaftar.');
      }

      setIsSuccess(true);

      // Handle Post-Login Redirection:
      // If redirect=form-pkkpr exists, automatically push/navigate user to PKKPR application form
      const searchParams = new URLSearchParams(location.search);
      const redirectParam = searchParams.get('redirect');
      const targetDestination = redirectParam === 'form-pkkpr'
        ? '/masyarakat-dashboard?tab=pkkpr&open_pkkpr=true'
        : '/masyarakat-dashboard';

      setTimeout(() => {
        window.location.replace(targetDestination);
      }, 300);
    } catch (err: any) {
      setWargaError(err.message || 'Gagal masuk. Silakan periksa kembali NIK dan Kata Sandi Anda.');
    } finally {
      setIsSubmittingWarga(false);
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

      // ── BAROMETER KONTROL PENENTUAN ROLE ──
      const knownAdminRole = getKnownRoleFromEmail(cleanEmail);

      // Check 1: User memilih tab Investor, namun email yang dimasukkan adalah akun resmi Admin OPD
      if (mainRoleCategory === 'investor' && knownAdminRole) {
        const adminLabel = ADMIN_ROLE_DETAILS[knownAdminRole]?.label || 'Administrator OPD';
        notifyRoleMismatch({
          message: `Akun email "${cleanEmail}" terdaftar sebagai ${adminLabel}, bukan Investor. Silakan pilih tab Admin dan sesuaikan bidang dinas Anda.`,
          suggestedCategory: 'admin',
          suggestedAdminRole: knownAdminRole
        });
        setIsSubmitting(false);
        return;
      }

      // Check 2: User memilih tab Admin, namun email yang dimasukkan terdaftar untuk OPD / bidang dinas lain
      if (mainRoleCategory === 'admin' && knownAdminRole && knownAdminRole !== adminSpecificRole) {
        const chosenLabel = ADMIN_ROLE_DETAILS[adminSpecificRole]?.label || adminSpecificRole;
        const actualLabel = ADMIN_ROLE_DETAILS[knownAdminRole]?.label || knownAdminRole;
        notifyRoleMismatch({
          message: `Anda memilih role "${chosenLabel}", tetapi akun email yang dimasukkan terdaftar untuk "${actualLabel}". Silakan sesuaikan pilihan Masuk Sebagai Anda.`,
          suggestedCategory: 'admin',
          suggestedAdminRole: knownAdminRole
        });
        setIsSubmitting(false);
        return;
      }

      // Check 3: Pre-check profil di database jika email terdaftar
      try {
        const { data: existingProf } = await supabase
          .from('profiles')
          .select('id, role, email')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (existingProf?.role) {
          const profRole = existingProf.role;
          if (mainRoleCategory === 'investor' && profRole.startsWith('admin_')) {
            const adminLabel = ADMIN_ROLE_DETAILS[profRole]?.label || profRole;
            notifyRoleMismatch({
              message: `Akun email ini terdaftar sebagai ${adminLabel}, bukan Investor. Silakan pilih tab Admin dan sesuaikan bidang dinas Anda.`,
              suggestedCategory: 'admin',
              suggestedAdminRole: profRole
            });
            setIsSubmitting(false);
            return;
          }
          if (mainRoleCategory === 'admin' && profRole === 'investor') {
            notifyRoleMismatch({
              message: `Akun email ini terdaftar sebagai Investor, bukan Administrator. Silakan pilih tab Investor untuk masuk.`,
              suggestedCategory: 'investor'
            });
            setIsSubmitting(false);
            return;
          }
          if (mainRoleCategory === 'admin' && profRole.startsWith('admin_') && profRole !== adminSpecificRole && profRole !== 'superadmin') {
            const chosenLabel = ADMIN_ROLE_DETAILS[adminSpecificRole]?.label || adminSpecificRole;
            const actualLabel = ADMIN_ROLE_DETAILS[profRole]?.label || profRole;
            notifyRoleMismatch({
              message: `Anda memilih role "${chosenLabel}", tetapi profil akun ini terdaftar untuk "${actualLabel}". Silakan sesuaikan pilihan Masuk Sebagai Anda.`,
              suggestedCategory: 'admin',
              suggestedAdminRole: profRole
            });
            setIsSubmitting(false);
            return;
          }
        }
      } catch (checkErr) {
        console.warn('Pre-check profiles error:', checkErr);
      }

      let data: any = null;
      let signInError: any = null;

      try {
        const res = await supabase.auth.signInWithPassword({
          email: finalEmail,
          password
        });
        data = res.data;
        signInError = res.error;
        if (signInError) {
          console.warn('[Auth] GoTrue signIn notice:', {
            message: signInError.message,
            status: signInError.status,
            email: finalEmail
          });
        }
      } catch (callErr: any) {
        signInError = callErr;
        console.warn('[Auth] Exception in supabase.auth.signInWithPassword:', callErr?.message);
      }

      // Fallback ke Backend Auth Route (/api/auth/login) jika Supabase GoTrue mengalami kendala (Database error, Invalid API key, 500, 401)
      if (signInError && (
        signInError.message?.includes('Database error') ||
        signInError.message?.includes('Invalid API key') ||
        signInError.message?.includes('API key') ||
        signInError.status === 500 ||
        signInError.status === 401 ||
        signInError.status === 403
      )) {
        try {
          console.info('[Login Fallback] Mengalihkan autentikasi ke backend API server...');
          const apiRes = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: finalEmail,
              password,
              role: effectiveRole
            })
          });
          const apiJson = await apiRes.json();
          if (apiJson.success) {
            localStorage.setItem('luwu_session_token', apiJson.token);
            localStorage.setItem('luwu_user_role', apiJson.role || effectiveRole);
            if (apiJson.session?.access_token && !apiJson.session.access_token.startsWith('direct_db_')) {
              try {
                await supabase.auth.setSession({
                  access_token: apiJson.session.access_token,
                  refresh_token: apiJson.session.refresh_token
                });
              } catch (sessErr) {
                console.warn('[Auth] Supabase setSession notice:', sessErr);
              }
            }
            signInError = null;
            data = {
              user: {
                id: apiJson.session?.user?.id || 'admin-backend-id',
                email: finalEmail,
                user_metadata: { role: apiJson.role || effectiveRole }
              },
              session: apiJson.session || { access_token: apiJson.token }
            };
          } else {
            signInError = new Error(apiJson.message || 'Kredensial tidak valid');
          }
        } catch (apiErr) {
          console.warn('[Auth] Backend API fallback notice:', apiErr);
        }
      }

      // Auto-register in development/preview if needed
      if (signInError && signInError.message?.includes('Invalid login credentials')) {
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

      const authUser = data?.user || (data?.session ? data.session.user : null);

      if (authUser) {
        // Query user's profile directly from Supabase profiles using user.id
        let profile: any = null;
        try {
          const { data: profData, error: profErr } = await supabase
            .from('profiles')
            .select('role, full_name, email, nik')
            .eq('id', authUser.id)
            .maybeSingle();

          if (profErr) {
            console.warn('[Auth] PostgREST profiles lookup notice:', profErr.message);
          } else {
            profile = profData;
          }
        } catch (profCatch: any) {
          console.warn('[Auth] Exception querying profiles:', profCatch?.message);
        }

        const activeRole = profile?.role || authUser.user_metadata?.role || effectiveRole;

        // Post-auth validation against chosen role barometer
        if (mainRoleCategory === 'investor' && activeRole && activeRole.startsWith('admin_')) {
          await supabase.auth.signOut();
          const adminLabel = ADMIN_ROLE_DETAILS[activeRole]?.label || 'Administrator OPD';
          notifyRoleMismatch({
            message: `Akun Anda terverifikasi sebagai ${adminLabel}. Silahkan sesuaikan role Anda dengan memilih tab Admin.`,
            suggestedCategory: 'admin',
            suggestedAdminRole: activeRole
          });
          setIsSubmitting(false);
          return;
        }

        if (mainRoleCategory === 'admin') {
          if (activeRole === 'investor') {
            await supabase.auth.signOut();
            notifyRoleMismatch({
              message: `Akun Anda terdaftar sebagai Investor, bukan Administrator. Silahkan sesuaikan role Anda dengan memilih tab Investor.`,
              suggestedCategory: 'investor'
            });
            setIsSubmitting(false);
            return;
          }

          if (activeRole && activeRole.startsWith('admin_') && activeRole !== adminSpecificRole && activeRole !== 'superadmin') {
            await supabase.auth.signOut();
            const chosenLabel = ADMIN_ROLE_DETAILS[adminSpecificRole]?.label || adminSpecificRole;
            const actualLabel = ADMIN_ROLE_DETAILS[activeRole]?.label || activeRole;
            notifyRoleMismatch({
              message: `Anda memilih role "${chosenLabel}", tetapi akun Anda adalah "${actualLabel}". Silahkan sesuaikan pilihan Masuk Sebagai Anda.`,
              suggestedCategory: 'admin',
              suggestedAdminRole: activeRole
            });
            setIsSubmitting(false);
            return;
          }
        }

        // Hapus Ketergantungan localStorage (Anti Ghost-Session)
        if (typeof window !== 'undefined') {
          localStorage.removeItem("luwu_session_token");
          localStorage.removeItem("sb-access-token");
          localStorage.removeItem("luwu_user_role");
          localStorage.removeItem("luwu_user_email");
        }

        if (OFFICIAL_EMAIL_ROLE_MAP[cleanEmail] || activeRole) {
          try {
            await supabase.from('profiles').upsert({
              id: authUser.id,
              role: activeRole,
              full_name: activeRole === 'admin_puptr' ? 'Admin Dinas PUPTR (Tata Ruang & Studio GIS)'
                       : activeRole === 'admin_pertanian' ? 'Admin Dinas Pertanian (Lahan LP2B)'
                       : activeRole === 'admin_dalak' ? 'Bidang Pengendalian Pelaksanaan & Pengawasan'
                       : activeRole === 'admin_data' ? 'Bidang Perencanaan, Pengembangan Iklim & Data'
                       : activeRole === 'admin_promosi' ? 'Bidang Promosi & Penanaman Modal'
                       : activeRole === 'admin_oss' ? 'Bidang Penyelenggaraan Pelayanan Perizinan'
                       : activeRole === 'admin_mpp' ? 'Admin MPP (Pengelola Mal Pelayanan Publik)'
                       : (authUser.user_metadata?.full_name || authUser.user_metadata?.company_name || cleanEmail.split('@')[0])
            });
          } catch (e) {}
        }

        setIsSuccess(true);
        setTimeout(() => {
          // Logika Routing Dinamis Saat Login:
          // Jika role === 'investor', arahkan pengguna ke rute <InvestorPortalDashboard/>.
          // Jika role === 'masyarakat', arahkan pengguna ke rute <MasyarakatDashboard/>.
          if (activeRole === 'investor') {
            window.location.replace('/investor-dashboard');
          } else if (activeRole === 'masyarakat') {
            const redirectParam = new URLSearchParams(location.search).get('redirect');
            if (redirectParam === 'form-pkkpr') {
              window.location.replace('/masyarakat-dashboard?tab=pkkpr&open_pkkpr=true');
            } else {
              window.location.replace('/masyarakat-dashboard');
            }
          } else if (activeRole === 'admin_puptr') {
            window.location.replace('/dashboard?tab=verifikasi_pkkpr');
          } else if (activeRole === 'admin_pertanian') {
            window.location.replace('/dashboard?tab=verifikasi_pertanian');
          } else if (activeRole === 'admin_oss') {
            window.location.replace('/dashboard?tab=overview_perizinan');
          } else if (activeRole === 'admin_dalak') {
            window.location.replace('/dashboard?tab=pengaduan');
          } else if (activeRole === 'admin_promosi') {
            window.location.replace('/dashboard?tab=loi_verify');
          } else if (activeRole === 'admin_data') {
            window.location.replace('/dashboard?tab=spatial_analytics');
          } else if (activeRole === 'admin_mpp') {
            window.location.replace('/admin/beranda');
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
    <div className="min-h-screen bg-slate-50 dark:bg-base text-slate-900 dark:text-white flex flex-col justify-center py-6 sm:py-10 px-3 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300 font-sans">
      {/* Background Ambience Accent */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-2 sm:px-0">
        <div className="flex justify-center mb-3 sm:mb-4">
          <div className="p-2 sm:p-2.5 bg-gradient-to-br from-white/90 via-emerald-50/50 to-slate-100/80 dark:from-slate-800/90 dark:via-slate-800/60 dark:to-slate-900/90 rounded-2xl border border-emerald-500/30 shadow-xl shadow-black/25 backdrop-blur-md flex items-center gap-3">
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
          {t('auth.portalTitle', 'Dashboard Portal Login')}
        </h2>
        <p className="text-center text-xs text-slate-600 dark:text-slate-400 font-medium max-w-xs sm:max-w-sm mx-auto">
          {t('appSubtitle', 'Kabupaten Luwu • Satu Pintu Investasi & Layanan Publik')}
        </p>
      </div>

      <div className="mt-4 sm:mt-5 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-1 sm:px-0">
        <div className="bg-white/95 dark:bg-surface/95 border border-slate-200/90 dark:border-slate-800/90 shadow-2xl rounded-3xl backdrop-blur-xl overflow-hidden transition-all">
          
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
                  setWargaError(null);
                }}
                className={`py-2 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap ${
                  mainRoleCategory === 'masyarakat'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-md border border-emerald-500/50 ring-2 ring-emerald-500/30 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Users size={13} className="shrink-0 text-emerald-500" />
                <span>Warga</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMainRoleCategory('investor');
                  setIdentifier('');
                  setError(null);
                  setWargaError(null);
                }}
                className={`py-2 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap ${
                  mainRoleCategory === 'investor'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-md border border-emerald-500/50 ring-2 ring-emerald-500/30 font-bold'
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
                  setWargaError(null);
                }}
                className={`py-2 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap ${
                  mainRoleCategory === 'admin'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-md border border-emerald-500/50 ring-2 ring-emerald-500/30 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Shield size={13} className="shrink-0 text-emerald-500" />
                <span>Admin</span>
              </button>
            </div>

          {/* ════════════════════════════════════════════════════════════════
              SCHEME A: MASYARAKAT LOGIN (NIK + PASSWORD AUTHENTICATION)
             ════════════════════════════════════════════════════════════════ */}
          {mainRoleCategory === 'masyarakat' && (
            <form onSubmit={handleLoginMasyarakat} className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Silakan masuk menggunakan NIK dan Kata Sandi yang telah didaftarkan.
                </span>
              </div>

              {new URLSearchParams(location.search).get('redirect') === 'form-pkkpr' && (
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>
                    Otentikasi Diperlukan: Anda akan langsung dialihkan ke Formulir Permohonan PKKPR setelah berhasil masuk.
                  </span>
                </div>
              )}

              {/* NIK INPUT */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    Nomor Induk Kependudukan (NIK)
                  </label>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    wargaNik.length === 16 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400' : 'text-slate-400'
                  }`}>
                    {wargaNik.length}/16
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
                    value={wargaNik}
                    onChange={(e) => handleWargaNikChange(e.target.value)}
                    placeholder="Contoh: 7317xxxxxxxxxxxx"
                    className="block w-full pl-10 pr-4 py-2.5 sm:py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-base/60 text-slate-900 dark:text-white placeholder-slate-400 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* PASSWORD INPUT */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Kata Sandi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <input
                    type={showWargaPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={wargaPassword}
                    onChange={(e) => {
                      setWargaPassword(e.target.value);
                      setWargaError(null);
                    }}
                    placeholder="Masukkan minimal 6 karakter kata sandi"
                    className="block w-full pl-10 pr-10 py-2.5 sm:py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-base/60 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWargaPassword(!showWargaPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showWargaPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {wargaError && (
                <div className="flex items-start gap-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-3 rounded-xl text-xs">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{wargaError}</span>
                </div>
              )}

              {isSuccess && (
                <div className="flex items-start gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-3 rounded-xl text-xs">
                  <LogIn size={16} className="shrink-0 mt-0.5" />
                  <span>
                    {new URLSearchParams(location.search).get('redirect') === 'form-pkkpr'
                      ? 'Login berhasil! Mengarahkan ke Formulir PKKPR...'
                      : 'Login berhasil! Mengarahkan ke Dashboard Masyarakat...'}
                  </span>
                </div>
              )}

              {/* STANDARD MASUK SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isSubmittingWarga || wargaNik.length !== 16 || wargaPassword.length < 6}
                className="w-full min-h-[46px] sm:min-h-[48px] flex justify-center items-center gap-2 py-3 px-4 border border-emerald-400/30 rounded-xl shadow-md shadow-black/25 text-xs sm:text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer"
              >
                {isSubmittingWarga ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses Masuk...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn size={16} />
                    <span>Masuk</span>
                  </div>
                )}
              </button>

              <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800/80 mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => setIsActivateModalOpen(true)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                >
                  <KeyRound size={13} className="shrink-0 text-indigo-500" />
                  <span>Pernah daftar PKKPR sebelumnya? Klik di sini untuk buat password akun</span>
                </button>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Belum memiliki akun warga?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/mpp')}
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    Ambil Antrean Online & Buat Akun
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SCHEME B: INVESTOR & ADMIN LOGIN (EMAIL & PASSWORD)
             ════════════════════════════════════════════════════════════════ */}
          {mainRoleCategory !== 'masyarakat' && (
            <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmitPassword}>
              
              {/* SUB-ROLE SELECTOR FOR ADMIN DINAS */}
              {mainRoleCategory === 'admin' && (
                <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-base/60 border border-slate-200/90 dark:border-slate-800 animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    {t('auth.loginAs', 'Masuk Sebagai')}
                  </label>
                  <div className="relative">
                    <select
                      value={adminSpecificRole}
                      onChange={(e) => {
                        const newRole = e.target.value as any;
                        setAdminSpecificRole(newRole);
                        setError(null);
                      }}
                      className="block w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-surface text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors cursor-pointer appearance-none pr-10"
                    >
                      <option value="admin_promosi">Bidang Promosi & Penanaman Modal</option>
                      <option value="admin_puptr">Dinas PUPTR (Tata Ruang & Studio GIS)</option>
                      <option value="admin_pertanian">Dinas Pertanian (Verifikasi Lahan LP2B)</option>
                      <option value="admin_dalak">Bidang Pengendalian & Pengawasan (Dalak)</option>
                      <option value="admin_oss">Bidang Penyelenggaraan Pelayanan Perizinan (OSS)</option>
                      <option value="admin_data">Bidang Perencanaan, Pengembangan Iklim & Data</option>
                      <option value="admin_mpp">Admin MPP (Pengelola Mal Pelayanan Publik)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                      <ChevronDown size={16} />
                    </div>
                  </div>
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
                    className="block w-full pl-10 pr-3.5 py-2.5 sm:py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-base/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-xs sm:text-sm font-sans"
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
                    className="block w-full pl-10 pr-11 py-2.5 sm:py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-base/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-xs sm:text-sm"
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
                <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs animate-in fade-in duration-200 ${
                  error.includes('Silahkan Sesuaikan Role Anda')
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 shadow-sm'
                    : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400'
                }`}>
                  <AlertCircle size={17} className={`shrink-0 mt-0.5 ${
                    error.includes('Silahkan Sesuaikan Role Anda') ? 'text-amber-600 dark:text-amber-400' : 'text-rose-500'
                  }`} />
                  <div className="space-y-1">
                    <p className="font-bold text-xs">
                      {error.includes('Silahkan Sesuaikan Role Anda') ? 'Silahkan Sesuaikan Role Anda' : 'Gagal Masuk'}
                    </p>
                    <p className="text-[11px] leading-relaxed opacity-95">
                      {error.replace(/^Silahkan Sesuaikan Role Anda:\s*/i, '')}
                    </p>
                  </div>
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
                  className="w-full min-h-[46px] sm:min-h-[48px] flex justify-center items-center gap-2 py-3 px-4 border border-emerald-400/30 rounded-xl shadow-md shadow-black/25 text-xs sm:text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn size={16} />
                      <span>{t('auth.loginBtn', 'MASUK')}</span>
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
              <span>{t('auth.backToHome', 'Kembali ke Landing Page')}</span>
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* MODAL AKTIVASI AKUN LAMA (MIGRASI WA OTP KE PASSWORD) */}
      <ActivateAccountModal
        isOpen={isActivateModalOpen}
        onClose={() => setIsActivateModalOpen(false)}
        onSuccess={(activatedNik) => {
          setWargaNik(activatedNik);
          setMainRoleCategory('masyarakat');
          setWargaError(null);
        }}
        initialIdentifier={wargaNik || identifier}
      />
    </div>
  );
}

