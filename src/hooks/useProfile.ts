import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient.js';

// In-memory module-level cache to eliminate re-fetching on component re-mounts
let memoryCachedProfile: any = null;

const PROFILE_CACHE_KEY = 'luwu_cached_profile_data';

export function useProfile() {
  const [profile, setProfileState] = useState<any>(() => {
    if (memoryCachedProfile) return memoryCachedProfile;
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
    return null;
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
    // If we already have a cached profile and skipCacheCheck is false, do not block loading
    if (!skipCacheCheck && memoryCachedProfile) {
      setIsProfileLoading(false);
    } else {
      setIsProfileLoading(true);
    }

    try {
      // Restore session manually from cookie or localStorage to bypass iframe restrictions
      let token = localStorage.getItem("luwu_session_token") || localStorage.getItem("sb-access-token");
      let sbToken = null;
      const match = typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)sb-access-token=([^;]+)/) : null;
      if (match) sbToken = match[1];
      const activeToken = token || sbToken;

      let user: any = null;
      if (activeToken) {
        try {
          const resUser = await supabase.auth.getUser();
          if (resUser?.error) {
            // Token is invalid/expired, clear stale token from localStorage to prevent repetitive 500 CORS loops
            localStorage.removeItem("luwu_session_token");
            localStorage.removeItem("sb-access-token");
          } else {
            user = resUser?.data?.user || null;
          }
        } catch (authErr) {
          // Catch auth network/CORS error on invalid token
          localStorage.removeItem("luwu_session_token");
          localStorage.removeItem("sb-access-token");
        }
      }

      const effectiveUser = user || { id: "offline-user", email: localStorage.getItem("luwu_user_email") || "" };
      if (user) {
        // Fast single query for user profile
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

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
          'superadmin@luwu.go.id': 'superadmin',
          'superadmin@luwukab.go.id': 'superadmin'
        };

        const mappedRole = OFFICIAL_EMAIL_ROLE_MAP[userEmail];
        const finalRole = mappedRole || prof.role || meta.role || 'investor';

        // If official email role differs from DB, auto-sync profile in Supabase
        if (mappedRole && prof.role !== mappedRole) {
          try {
            await supabase.from('profiles').upsert({
              id: effectiveUser.id,
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
          id: effectiveUser.id,
          email: effectiveUser.email,
          ...meta,
          ...prof,
          role: finalRole,
          no_whatsapp: extractedPhone || meta.no_whatsapp || prof.no_whatsapp || "",
          whatsapp: extractedPhone || meta.whatsapp || prof.whatsapp || "",
          phone: extractedPhone || meta.phone || prof.phone || "",
          kecamatan: prof.kecamatan || meta.kecamatan || "",
          desa: prof.desa || meta.desa || "",
        };

        saveProfileToCache(combinedProfile);
      } else if (localStorage.getItem("luwu_session_token") || localStorage.getItem("luwu_user_role")) {
        const localEmail = localStorage.getItem("luwu_user_email") || "";
        const localRole = localStorage.getItem("luwu_user_role") || "admin_dalak";
        const localNik = localStorage.getItem("luwu_user_nik") || "";
        const localName = localStorage.getItem("luwu_user_name") || "";
        let citizenData: any = {};
        try {
          const rawCit = localStorage.getItem("luwu_citizen_data");
          if (rawCit) citizenData = JSON.parse(rawCit);
        } catch (e) {}

        const combinedProfile = {
          id: localRole === 'masyarakat' ? `citizen-${localNik || 'guest'}` : "offline-user",
          email: localEmail || (localRole === 'masyarakat' ? `warga_${localNik || 'user'}@luwukab.go.id` : ''),
          role: localRole,
          nik: localNik || citizenData.nik || "",
          full_name: localName || citizenData.full_name || (localRole === 'masyarakat' ? 'Warga Kab. Luwu' : localRole === 'admin_dalak' ? 'Bidang Pengendalian Pelaksanaan & Pengawasan' : 'Administrator'),
          phone: citizenData.phone_number || citizenData.phone || "",
          whatsapp: citizenData.phone_number || citizenData.whatsapp || "",
          no_whatsapp: citizenData.phone_number || citizenData.no_whatsapp || "",
          gender: citizenData.gender || citizenData.jenis_kelamin || "Laki-laki",
          occupation: citizenData.occupation || citizenData.pekerjaan || "Wiraswasta / Pelaku Usaha",
          kecamatan: citizenData.kecamatan || "",
          desa: citizenData.desa || "",
          ...citizenData
        };
        saveProfileToCache(combinedProfile as any);
      } else {
        // --- Seamless Login Handoff from MPP Portal ---
        let mppTokenFound = false;
        if (typeof window !== 'undefined' && window.localStorage) {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('mpp_verified_otp_') && !key.includes('_phone_')) {
              const storedNik = key.replace('mpp_verified_otp_', '');
              if (localStorage.getItem(key) === 'true') {
                const storedPhone = localStorage.getItem(`mpp_verified_otp_phone_${storedNik}`) || '';
                const combinedProfile = {
                  id: `citizen-${storedNik}`,
                  email: `warga_${storedNik}@luwukab.go.id`,
                  role: "masyarakat",
                  nik: storedNik,
                  phone: storedPhone,
                  whatsapp: storedPhone,
                  no_whatsapp: storedPhone,
                  full_name: localStorage.getItem(`mpp_citizen_name_${storedNik}`) || 'Pemohon Layanan MPP',
                  is_mpp_otp_session: true
                };
                saveProfileToCache(combinedProfile as any);
                mppTokenFound = true;
                break;
              }
            }
          }
        }
        
        if (!mppTokenFound) {
          saveProfileToCache(null);
        }
      }
    } catch {
      // Clean fallback for unauthenticated / offline states
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
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
