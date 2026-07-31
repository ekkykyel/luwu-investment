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
      let token = localStorage.getItem("luwu_session_token");
      if (!token) {
        const match = document.cookie.match(/(?:^|;\s*)sb-access-token=([^;]+)/);
        if (match) token = match[1];
      }
      if (token) {
        await supabase.auth.setSession({ access_token: token, refresh_token: token });
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fast single query for user profile
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        const meta = user.user_metadata || {};
        const prof = data || {};

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
          email: user.email,
          ...meta,
          ...prof,
          no_whatsapp: extractedPhone || meta.no_whatsapp || prof.no_whatsapp || "",
          whatsapp: extractedPhone || meta.whatsapp || prof.whatsapp || "",
          phone: extractedPhone || meta.phone || prof.phone || "",
        };

        saveProfileToCache(combinedProfile);
      } else {
        saveProfileToCache(null);
      }
    } catch (err) {
      console.warn('[useProfile] Error restoring session or fetching profile:', err);
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
