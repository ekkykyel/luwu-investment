import { supabase } from '../lib/supabaseClient';

export interface UserProfile {
  id: string;
  user_id?: string;
  email?: string;
  role: 'masyarakat' | 'investor' | string;
  full_name?: string;
  company_name?: string;
  nik?: string;
  nib?: string;
  no_whatsapp?: string;
  phone?: string;
  kecamatan?: string;
  desa?: string;
  [key: string]: any;
}

export interface InvestorSignUpPayload {
  email: string;
  password: string;
  fullName: string;
  nik: string;
  companyName: string;
  nib: string;
  negara?: string;
  statusModal?: string;
  whatsapp?: string;
}

export interface MasyarakatSignUpPayload {
  email: string;
  password: string;
  fullName: string;
  nik: string;
  whatsapp?: string;
  kecamatan?: string;
  desa?: string;
}

export interface AuthResult {
  success: boolean;
  user?: any;
  profile?: UserProfile | null;
  role?: string;
  targetUrl?: string;
  error?: string;
}

/**
 * 1. Validasi Sesi Aktif Langsung ke Backend Supabase (Anti Ghost-Session)
 * Wajib memanggil supabase.auth.getUser() tanpa membaca data otentikasi dari localStorage.
 */
export async function validateActiveSession(): Promise<{ user: any | null; error: any | null }> {
  try {
    let { data: { user }, error } = await supabase.auth.getUser();

    // Pemulihan sesi dari cookie jika state in-memory baru saja di-load
    if (!user && typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)sb-access-token=([^;]+)/);
      if (match && match[1]) {
        try {
          await supabase.auth.setSession({ access_token: match[1], refresh_token: match[1] });
          const retry = await supabase.auth.getUser();
          user = retry?.data?.user || null;
          if (user) error = null;
        } catch (e) {}
      }
    }

    return { user: user || null, error };
  } catch (err) {
    return { user: null, error: err };
  }
}

/**
 * 2. Fetch User Profile dari tabel public.profiles berdasarkan user.id (Single Source of Truth)
 */
export async function fetchUserProfileById(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      return data as UserProfile;
    }
    return null;
  } catch (err) {
    console.warn('[authService] Error fetching profile by ID:', err);
    return null;
  }
}

/**
 * 3. Registrasi Investor (Landing Page)
 * Wajib menyertakan metadata options: { data: { full_name, nik, role: 'investor', ... } }
 */
export async function signUpInvestor(payload: InvestorSignUpPayload): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      options: {
        data: {
          full_name: payload.fullName.trim().toUpperCase(),
          nik: payload.nik.trim(),
          role: 'investor',
          company_name: payload.companyName.trim(),
          nib: payload.nib.trim(),
          negara_asal: payload.negara || 'Indonesia',
          status_modal: payload.statusModal || 'PMDN',
          whatsapp: payload.whatsapp?.trim() || '',
          no_whatsapp: payload.whatsapp?.trim() || ''
        }
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      user: data.user,
      role: 'investor',
      targetUrl: '/investor-dashboard'
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal mendaftar sebagai investor.' };
  }
}

/**
 * 4. Registrasi Masyarakat (Kios Mandiri / Portal Online)
 * TIDAK menyertakan metadata role (Trigger Database otomatis assign 'masyarakat')
 */
export async function signUpMasyarakat(payload: MasyarakatSignUpPayload): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      options: {
        data: {
          full_name: payload.fullName.trim().toUpperCase(),
          nik: payload.nik.trim(),
          whatsapp: payload.whatsapp?.trim() || '',
          no_whatsapp: payload.whatsapp?.trim() || '',
          kecamatan: payload.kecamatan || '',
          desa: payload.desa || ''
        }
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      user: data.user,
      role: 'masyarakat',
      targetUrl: '/masyarakat-dashboard'
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal mendaftar akun masyarakat.' };
  }
}

/**
 * 5. Sign-In Email/Password dengan Pengecekan Role Dinamis ke Tabel profiles
 */
export async function signInWithEmailPassword(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });

    if (error || !data.user) {
      return { success: false, error: error?.message || 'Kredensial tidak valid.' };
    }

    // Set cookie untuk server-side middleware
    if (data.session?.access_token && typeof document !== 'undefined') {
      document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=86400; SameSite=None; Secure`;
    }

    // Fetch role langsung dari tabel profiles menggunakan user.id
    const profile = await fetchUserProfileById(data.user.id);
    const resolvedRole = profile?.role || data.user.user_metadata?.role || 'masyarakat';

    let targetUrl = '/masyarakat-dashboard';
    if (resolvedRole === 'investor') {
      targetUrl = '/investor-dashboard';
    } else if (resolvedRole === 'admin_puptr') {
      targetUrl = '/dashboard?tab=verifikasi_pkkpr';
    } else if (resolvedRole === 'admin_pertanian') {
      targetUrl = '/dashboard?tab=verifikasi_pertanian';
    } else if (resolvedRole === 'admin_oss') {
      targetUrl = '/dashboard?tab=overview_perizinan';
    } else if (resolvedRole === 'admin_dalak') {
      targetUrl = '/dashboard?tab=pengaduan';
    } else if (resolvedRole === 'admin_promosi') {
      targetUrl = '/dashboard?tab=loi_verify';
    } else if (resolvedRole.startsWith('admin_') || resolvedRole === 'superadmin') {
      targetUrl = '/dashboard';
    }

    return {
      success: true,
      user: data.user,
      profile,
      role: resolvedRole,
      targetUrl
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal terhubung ke server autentikasi.' };
  }
}

/**
 * 6. Sign-In WhatsApp OTP untuk Masyarakat
 */
export async function signInWithWhatsAppOtp(nik: string, otp: string): Promise<AuthResult> {
  try {
    const res = await fetch('/api/kiosk/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nik: nik.replace(/\D/g, ''), otp: otp.trim() })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.message || 'Kode OTP salah atau telah kadaluarsa.' };
    }

    const accessToken = data.session?.access_token || data.accessToken || data.sessionToken;
    const refreshToken = data.session?.refresh_token || data.refreshToken || accessToken;

    if (accessToken) {
      try {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      } catch (e) {}
      if (typeof document !== 'undefined') {
        document.cookie = `sb-access-token=${accessToken}; path=/; max-age=604800; SameSite=Lax`;
      }
      if (typeof window !== 'undefined') {
        sessionStorage.setItem("sb-access-token", accessToken);
        localStorage.setItem("sb-access-token", accessToken);
        localStorage.setItem("mpp_verified_nik", nik.replace(/\D/g, ''));
      }

      // Explicitly wait for session to be active in Supabase client
      for (let attempt = 0; attempt < 10; attempt++) {
        const { data: sessionCheck } = await supabase.auth.getSession();
        if (sessionCheck?.session) break;
        await new Promise(r => setTimeout(r, 100));
      }
    }

    const user = data.user || (data.session ? data.session.user : null);
    return {
      success: true,
      user,
      role: 'masyarakat',
      targetUrl: '/masyarakat-dashboard'
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal memverifikasi OTP.' };
  }
}

/**
 * 7. Sign-Out Terpusat (Membersihkan Session, Cookie, & Storage)
 */
export async function signOutUser(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.warn('[authService] Supabase signOut error:', e);
  }

  if (typeof document !== 'undefined') {
    document.cookie = 'sb-access-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None; Secure;';
  }

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem('luwu_cached_profile_data');
      localStorage.removeItem('luwu_session_token');
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('luwu_user_role');
      localStorage.removeItem('luwu_user_email');
    } catch (e) {}
  }
}
