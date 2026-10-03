import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

// In-memory module-level cache to eliminate re-fetching on component re-mounts
let memoryCachedProfile: any = null;

const PROFILE_CACHE_KEY = 'luwu_cached_profile_data';

export function useProfile() {
  const [profile, setProfileState] = useState<any>(() => {
    try {
      const stored = sessionStorage.getItem(PROFILE_CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        memoryCachedProfile = parsed;
        return parsed;
      }
    } catch (e) {
      // Ignore sessionStorage read errors
    }
    return memoryCachedProfile || null;
  });

  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(!memoryCachedProfile);

  const saveProfileToCache = (newProfile: any) => {
    memoryCachedProfile = newProfile;
    if (newProfile) {
      try {
        sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(newProfile));
      } catch (e) {
        // Ignore sessionStorage write errors
      }
    } else {
      try {
        sessionStorage.removeItem(PROFILE_CACHE_KEY);
      } catch (e) {
        // Ignore
      }
    }
    setProfileState(newProfile);
  };

  const fetchProfile = useCallback(async (skipCacheCheck = false) => {
    if (!skipCacheCheck && memoryCachedProfile) {
      setIsProfileLoading(false);
    } else {
      setIsProfileLoading(true);
    }

    try {
      // Sesi selalu divalidasi langsung ke backend Supabase Auth (Anti Ghost-Session)
      let { data: { user }, error: authErr } = await supabase.auth.getUser();

      if (!user) {
        const match = typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)sb-access-token=([^;]+)/) : null;
        if (match && match[1]) {
          try {
            await supabase.auth.setSession({ access_token: match[1], refresh_token: match[1] });
            const retry = await supabase.auth.getUser();
            user = retry?.data?.user || null;
            if (user) authErr = null;
          } catch (e) {}
        }
      }

      // Check if citizen is logged in via NIK session (Prevent session kickout for OTP citizens)
      const storedCitizenNik = typeof window !== 'undefined' ? (localStorage.getItem('luwu_user_nik') || localStorage.getItem('mpp_verified_nik') || sessionStorage.getItem('luwu_user_nik') || sessionStorage.getItem('mpp_verified_nik')) : null;
      if (storedCitizenNik && /^\d{16}$/.test(storedCitizenNik)) {
        const citizenName = (typeof window !== 'undefined' ? (localStorage.getItem('luwu_user_name') || localStorage.getItem('mpp_verified_name') || sessionStorage.getItem('luwu_user_name')) : "") || 'Masyarakat Luwu';
        const citizenPhone = (typeof window !== 'undefined' ? (localStorage.getItem('luwu_user_phone') || localStorage.getItem('mpp_citizen_phone') || sessionStorage.getItem('luwu_user_phone')) : "") || '';
        const citizenProfile = {
          id: user?.id || `cit-${storedCitizenNik}`,
          email: user?.email || `${storedCitizenNik}@warga.luwukab.go.id`,
          nik: storedCitizenNik,
          full_name: citizenName,
          nama: citizenName,
          role: 'masyarakat',
          phone_number: citizenPhone,
          phone: citizenPhone,
          no_whatsapp: citizenPhone
        };
        saveProfileToCache(citizenProfile);
        setIsProfileLoading(false);
        return citizenProfile;
      }

      if (authErr || !user) {
        if (authErr && (authErr.message?.toLowerCase().includes('refresh token') || authErr.message?.toLowerCase().includes('jwt') || authErr.status === 400 || authErr.status === 401 || authErr.status === 403)) {
          if (typeof document !== 'undefined') {
            document.cookie = 'sb-access-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None; Secure;';
          }
          try {
            sessionStorage.removeItem(PROFILE_CACHE_KEY);
            localStorage.removeItem('sb-access-token');
          } catch (e) {}
        }
        saveProfileToCache(null);
        return null;
      }

      // Single Source of Truth: Fetch profil dari tabel profiles menggunakan valid user.id UUID
      const isValidUuid = (id?: string) => Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
      let data: any = null;
      if (isValidUuid(user.id)) {
        const res = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        data = res.data;
      }

      const meta = user.user_metadata || {};
      const prof = data || {};

      const userEmail = (user.email || '').toLowerCase().trim();
      const OFFICIAL_EMAIL_ROLE_MAP: Record<string, string> = {
        'puptr@luwukab.go.id': 'admin_puptr',
        'adminpuptr@luwukab.go.id': 'admin_puptr',
        'puptr@luwu.go.id': 'admin_puptr',
        'tataruangluwu@gmail.com': 'admin_puptr',
        'pertanian@luwukab.go.id': 'admin_pertanian',
        'adminpertanian@luwukab.go.id': 'admin_pertanian',
        'pertanian@luwu.go.id': 'admin_pertanian',
        'distanluwu@gmail.com': 'admin_pertanian',
        'dalakluwu@gmail.com': 'admin_dalak',
        'admindalak@luwukab.go.id': 'admin_dalak',
        'dalak@luwukab.go.id': 'admin_dalak',
        'dalak@luwu.go.id': 'admin_dalak',
        'dataluwu@gmail.com': 'admin_data',
        'admindata@luwukab.go.id': 'admin_data',
        'data@luwukab.go.id': 'admin_data',
        'data@luwu.go.id': 'admin_data',
        'promosiluwu@gmail.com': 'admin_promosi',
        'adminpromosi@luwukab.go.id': 'admin_promosi',
        'promosi@luwukab.go.id': 'admin_promosi',
        'promosi@luwu.go.id': 'admin_promosi',
        'dpmptspluwu@gmail.com': 'admin_oss',
        'adminoss@luwukab.go.id': 'admin_oss',
        'oss@luwukab.go.id': 'admin_oss',
        'oss@luwu.go.id': 'admin_oss',
        'adminmpp@luwukab.go.id': 'admin_mpp',
        'mppluwu@gmail.com': 'admin_mpp',
        'mpp@luwukab.go.id': 'admin_mpp',
        'nilambintangselatan@gmail.com': 'admin_mpp',
        'superadmin@luwu.go.id': 'superadmin',
        'superadmin@luwukab.go.id': 'superadmin'
      };

      const mappedRole = OFFICIAL_EMAIL_ROLE_MAP[userEmail];
      const finalRole = mappedRole || prof.role || meta.role || 'masyarakat';

      // If official email role differs from DB, auto-sync profile in Supabase
      if (mappedRole && prof.role !== mappedRole) {
        try {
          await supabase.from('profiles').upsert({
            id: user.id,
            role: mappedRole,
            full_name: mappedRole === 'admin_puptr' ? 'Admin Dinas PUPTR (Tata Ruang & Studio GIS)'
                     : mappedRole === 'admin_pertanian' ? 'Admin Dinas Pertanian (Lahan LP2B)'
                     : mappedRole === 'admin_dalak' ? 'Bidang Pengendalian Pelaksanaan & Pengawasan'
                     : mappedRole === 'admin_data' ? 'Bidang Perencanaan, Pengembangan Iklim & Data'
                     : mappedRole === 'admin_promosi' ? 'Bidang Promosi & Penanaman Modal'
                     : mappedRole === 'admin_mpp' ? 'Admin MPP (Pengelola Mal Pelayanan Publik)'
                     : 'Bidang Penyelenggaraan Pelayanan Perizinan'
          });
        } catch (syncErr) {
          console.warn('[useProfile] Auto-sync profile role failed:', syncErr);
        }
      }

      const extractedPhone =
        prof.no_whatsapp ||
        prof.whatsapp ||
        prof.phone ||
        prof.no_hp ||
        prof.telepon ||
        meta.no_whatsapp ||
        meta.whatsapp ||
        meta.phone ||
        meta.no_hp ||
        meta.telepon ||
        "";

      const combinedProfile = {
        id: user.id,
        user_id: user.id,
        email: user.email,
        ...meta,
        ...prof,
        role: finalRole,
        full_name: prof.full_name || meta.full_name || (finalRole === 'masyarakat' ? 'Warga Kab. Luwu' : (user.email?.split('@')[0] || '')),
        nik: prof.nik || meta.nik || "",
        no_whatsapp: extractedPhone || meta.no_whatsapp || prof.no_whatsapp || "",
        whatsapp: extractedPhone || meta.whatsapp || prof.whatsapp || "",
        phone: extractedPhone || meta.phone || prof.phone || "",
        kecamatan: prof.kecamatan || meta.kecamatan || "",
        desa: prof.desa || meta.desa || "",
      };

      saveProfileToCache(combinedProfile);
      return combinedProfile;
    } catch {
      saveProfileToCache(null);
      return null;
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();

    // Dengarkan perubahan state auth Supabase secara real-time
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        fetchProfile(true);
      } else if (event === 'SIGNED_OUT') {
        saveProfileToCache(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const refreshProfile = useCallback(() => {
    return fetchProfile(true);
  }, [fetchProfile]);

  const clearProfile = useCallback(() => {
    saveProfileToCache(null);
  }, []);

  return {
    profile,
    isProfileLoading,
    refreshProfile,
    clearProfile,
    setProfile: saveProfileToCache
  };
}
