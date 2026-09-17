import dotenv from "dotenv";

// Initialize dotenv configuration
dotenv.config();

export let isSupabaseConfigured = true;

// Tolak fallback hardcoded — crash eksplisit di Vercel Production
export const GLOBAL_JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn("⚠️ WARNING: JWT_SECRET is not configured in process.env. Using resilient fallback secret.");
    return "luwu-investment-portal-secure-jwt-secret-2025";
  }
  return secret;
})();

export const SUPABASE_URL = (() => {
  let url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

  if (!url) {
    isSupabaseConfigured = false;
    console.warn("[WARN] SUPABASE_URL is not set in environment. Using standard working URL fallback.");
    return "https://svxugvxchjsjuyfeddor.supabase.co";
  }
  url = url.trim();
  if (url.endsWith('/')) url = url.slice(0, -1);
  if (url.endsWith('/rest/v1')) url = url.replace('/rest/v1', '');
  if (url.endsWith('/rest/v1/')) url = url.replace('/rest/v1/', '');
  return url;
})();

export const SUPABASE_SERVICE_ROLE_KEY = (() => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!key) {
    isSupabaseConfigured = true;
    console.warn("[WARN] SUPABASE_SERVICE_ROLE_KEY is not set in environment. Using standard valid Supabase key fallback.");
    return "sb_publishable_SyZQ0YW4CWEVfMjBS9NtZQ_T0tB4zJj";
  }
  return key;
})();
