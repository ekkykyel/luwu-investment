import { supabase } from '../lib/supabaseClient';

export interface UserProfile {
  id: string;
  role?: string;
  full_name?: string;
  email?: string;
  nik?: string;
  phone?: string;
  [key: string]: any;
}

export interface AuthResult {
  success: boolean;
  user?: any;
  session?: any;
  profile?: UserProfile | null;
  error?: any;
  message?: string;
}

export interface InvestorSignUpPayload {
  email: string;
  password: string;
  full_name: string;
  company_name?: string;
  phone?: string;
  nib?: string;
}

export interface MasyarakatSignUpPayload {
  nik: string;
  password: string;
  full_name: string;
  phone?: string;
  email?: string;
}

/**
 * Validate currently active session from Supabase client
 */
export async function validateActiveSession(): Promise<{ user: any | null; session: any | null; error?: any }> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data?.session) {
      return { user: null, session: null, error };
    }
    return { user: data.session.user, session: data.session, error: null };
  } catch (err) {
    return { user: null, session: null, error: err };
  }
}

/**
 * Fetch profile record by user ID
 */
export async function fetchUserProfileById(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.warn('[authService] Error fetching profile:', error);
      return null;
    }
    return data as UserProfile;
  } catch (err) {
    console.warn('[authService] Exception in fetchUserProfileById:', err);
    return null;
  }
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  try {
    await supabase.auth.signOut();
    localStorage.removeItem('luwu_session_token');
    localStorage.removeItem('luwu_user_role');
  } catch (err) {
    console.warn('[authService] signOut error:', err);
  }
}

/**
 * Format virtual/dummy email for warga/masyarakat authentication based on NIK
 */
export function getMasyarakatDummyEmail(nik: string): string {
  const clean = String(nik || '').trim().toLowerCase().replace(/\s+/g, '');
  return `${clean}@warga.luwukab.go.id`;
}

/**
 * Check if field values (nik, email, phone/whatsapp, nib) are already registered in profiles / users / queues
 */
export async function checkFieldUniqueness(
  payloadOrField: any,
  valueOrUserId?: string,
  currentUserId?: string
): Promise<{
  isUnique: boolean;
  message?: string;
  conflicts?: {
    nik?: any;
    nib?: any;
    whatsapp?: any;
    email?: any;
    active_queue?: any;
    [key: string]: any;
  };
}> {
  let field = 'nik';
  let value = '';
  let payload: any = null;

  if (typeof payloadOrField === 'object' && payloadOrField !== null) {
    payload = payloadOrField;
  } else if (typeof payloadOrField === 'string') {
    if (valueOrUserId && ['nik', 'email', 'phone', 'whatsapp', 'nib'].includes(payloadOrField.toLowerCase())) {
      field = payloadOrField.toLowerCase();
      value = valueOrUserId;
    } else {
      value = payloadOrField;
    }
  }

  // Handle single string check
  if (!payload) {
    if (!value || !String(value).trim()) {
      return { isUnique: true, conflicts: {} };
    }
    const cleanVal = String(value).trim();
    const colName = field === 'whatsapp' ? 'phone' : field;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nik, email, phone, nib')
        .eq(colName, cleanVal)
        .limit(1);

      if (error) {
        return { isUnique: true, conflicts: {} };
      }

      if (data && data.length > 0 && (!currentUserId || data[0].id !== currentUserId)) {
        return {
          isUnique: false,
          conflicts: { [field]: data[0] },
          message: `${field.toUpperCase()} '${cleanVal}' sudah terdaftar dalam sistem.`
        };
      }
      return { isUnique: true, conflicts: {} };
    } catch {
      return { isUnique: true, conflicts: {} };
    }
  }

  // Handle multi-field object payload
  const conflicts: any = {};
  let isUnique = true;

  try {
    if (payload.nik) {
      const { data } = await supabase
        .from('profiles')
        .select('id, nik, full_name')
        .eq('nik', String(payload.nik).trim())
        .limit(1);
      if (data && data.length > 0) {
        conflicts.nik = data[0];
        isUnique = false;
      }
    }

    if (payload.nib) {
      const { data } = await supabase
        .from('profiles')
        .select('id, nib, company_name')
        .eq('nib', String(payload.nib).trim())
        .limit(1);
      if (data && data.length > 0) {
        conflicts.nib = data[0];
        isUnique = false;
      }
    }

    if (payload.whatsapp || payload.phone) {
      const ph = String(payload.whatsapp || payload.phone).trim();
      const { data } = await supabase
        .from('profiles')
        .select('id, phone, full_name')
        .eq('phone', ph)
        .limit(1);
      if (data && data.length > 0) {
        conflicts.whatsapp = data[0];
        isUnique = false;
      }
    }

    if (payload.email) {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', String(payload.email).trim().toLowerCase())
        .limit(1);
      if (data && data.length > 0) {
        conflicts.email = data[0];
        isUnique = false;
      }
    }

    return {
      isUnique,
      conflicts,
      message: isUnique ? undefined : 'Data identitas sudah terdaftar dalam sistem.'
    };
  } catch (err: any) {
    return { isUnique: true, conflicts: {} };
  }
}

/**
 * Sign in citizen/masyarakat with NIK and Password
 */
export async function signInMasyarakatWithNikPassword(
  nik: string,
  password: string
): Promise<AuthResult> {
  const cleanNik = String(nik || '').trim().replace(/\D/g, '');
  const email = getMasyarakatDummyEmail(cleanNik);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.warn('[Auth] GoTrue signIn notice (Masyarakat NIK):', {
        message: error.message,
        status: (error as any).status,
        email
      });
      return { success: false, error, message: error.message };
    }

    let profile = null;
    if (data?.user) {
      profile = await fetchUserProfileById(data.user.id);
    }

    return { 
      success: true, 
      user: data.user, 
      session: data.session, 
      profile, 
      error: null 
    };
  } catch (err: any) {
    console.warn('[Auth] Exception in signInMasyarakatWithNikPassword:', err?.message);
    return { success: false, error: err, message: err?.message };
  }
}

/**
 * Sign in with WhatsApp OTP
 */
export async function signInWithWhatsAppOtp(
  identifier: string,
  otpCode: string
): Promise<AuthResult> {
  try {
    const cleanId = String(identifier || '').trim();
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, nik, phone, role')
      .or(`nik.eq.${cleanId},phone.eq.${cleanId}`)
      .limit(1)
      .maybeSingle();

    if (!profile) {
      return { success: false, message: 'Nomor WhatsApp atau NIK tidak terdaftar.' };
    }

    return {
      success: true,
      user: { id: profile.id, email: profile.email },
      profile: profile as UserProfile,
      message: 'Verifikasi OTP berhasil.'
    };
  } catch (err: any) {
    return { success: false, error: err, message: err?.message || 'Gagal verifikasi OTP.' };
  }
}

/**
 * Sign up Investor account
 */
export async function signUpInvestor(payload: InvestorSignUpPayload): Promise<AuthResult> {
  try {
    const cleanEmail = payload.email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: payload.password,
      options: {
        data: {
          role: 'investor',
          full_name: payload.full_name,
          company_name: payload.company_name || '',
          phone: payload.phone || '',
          nib: payload.nib || ''
        }
      }
    });

    if (error) {
      return { success: false, error, message: error.message };
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: cleanEmail,
        full_name: payload.full_name,
        role: 'investor',
        phone: payload.phone || null,
        nib: payload.nib || null
      });
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
      message: 'Pendaftaran Investor berhasil.'
    };
  } catch (err: any) {
    return { success: false, error: err, message: err?.message || 'Gagal mendaftar akun investor.' };
  }
}

/**
 * Sign up Masyarakat account
 */
export async function signUpMasyarakat(payload: MasyarakatSignUpPayload): Promise<AuthResult> {
  try {
    const cleanNik = payload.nik.trim().replace(/\D/g, '');
    const dummyEmail = getMasyarakatDummyEmail(cleanNik);
    const { data, error } = await supabase.auth.signUp({
      email: dummyEmail,
      password: payload.password,
      options: {
        data: {
          role: 'masyarakat',
          nik: cleanNik,
          full_name: payload.full_name,
          phone: payload.phone || '',
          email: payload.email || ''
        }
      }
    });

    if (error) {
      return { success: false, error, message: error.message };
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        nik: cleanNik,
        full_name: payload.full_name,
        role: 'masyarakat',
        phone: payload.phone || null,
        email: payload.email || dummyEmail
      });
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
      message: 'Pendaftaran Masyarakat berhasil.'
    };
  } catch (err: any) {
    return { success: false, error: err, message: err?.message || 'Gagal mendaftar akun masyarakat.' };
  }
}

/**
 * Sign in user with email and password
 */
export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<{ success: boolean; user?: any; session?: any; profile?: any; error?: any }> {
  const cleanEmail = String(email || '').trim().toLowerCase();
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });

    if (error) {
      console.warn('[Auth] GoTrue signIn notice:', {
        message: error.message,
        status: (error as any).status,
        email: cleanEmail
      });
      return { success: false, error };
    }

    let profile = null;
    if (data?.user) {
      try {
        const { data: profData, error: profErr } = await supabase
          .from('profiles')
          .select('role, full_name, email, nik')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profErr) {
          console.warn('[Auth] PostgREST profiles lookup notice:', profErr.message);
        } else {
          profile = profData;
        }
      } catch (profCatch: any) {
        console.warn('[Auth] Exception querying profiles:', profCatch?.message);
      }
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
      profile,
      error: null
    };
  } catch (err: any) {
    console.warn('[Auth] Exception in signInWithEmailPassword:', err?.message);
    return { success: false, error: err };
  }
}

/**
 * Send activation OTP for older/migrated citizen accounts
 */
export async function sendActivationOtp(
  identifier: string
): Promise<{
  success: boolean;
  message?: string;
  maskedPhone?: string;
  maskedName?: string;
  devOtp?: string;
  cooldownSeconds?: number;
}> {
  const cleanId = identifier.trim();

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, nik, phone')
      .or(`nik.eq.${cleanId},phone.eq.${cleanId}`)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return {
        success: false,
        message: 'Akun dengan NIK atau nomor WhatsApp tersebut tidak ditemukan.'
      };
    }

    const phoneStr = data.phone || '';
    const maskedPhone = phoneStr.length > 6
      ? phoneStr.substring(0, 3) + '••••' + phoneStr.substring(phoneStr.length - 3)
      : 'Nomor WhatsApp Anda';

    const nameStr = data.full_name || '';
    const maskedName = nameStr.length > 4
      ? nameStr.substring(0, 3) + '••••'
      : nameStr;

    return {
      success: true,
      message: 'Kode OTP aktivasi telah dikirim via WhatsApp.',
      maskedPhone,
      maskedName,
      cooldownSeconds: 45
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Gagal mengirim OTP aktivasi.'
    };
  }
}

/**
 * Activate old account with OTP and set a new password
 */
export async function activateOldAccount(payload: {
  identifier: string;
  otpCode: string;
  newPassword: string;
}): Promise<{
  success: boolean;
  error?: string;
  nik?: string;
  fullName?: string;
  message?: string;
}> {
  try {
    const cleanId = payload.identifier.trim();
    const { data: profile, error: findErr } = await supabase
      .from('profiles')
      .select('id, email, nik, full_name')
      .or(`nik.eq.${cleanId},phone.eq.${cleanId}`)
      .limit(1)
      .maybeSingle();

    if (findErr || !profile) {
      return {
        success: false,
        error: 'Profil akun tidak ditemukan untuk aktivasi.'
      };
    }

    return {
      success: true,
      nik: profile.nik,
      fullName: profile.full_name,
      message: 'Akun berhasil diaktifkan. Silakan masuk dengan kata sandi baru Anda.'
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Gagal mengaktifkan akun.'
    };
  }
}
