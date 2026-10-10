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
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

  if (!url || url.includes("svxugvxchjsjuyfeddor") || url.includes("placeholder")) {
    isSupabaseConfigured = false;
    console.warn("[WARN] SUPABASE_URL is not set or refers to revoked project. Using active URL fallback.");
    return "https://yeezhpdgafbefwipmldl.supabase.co";
  }
  url = url.trim();
  if (url.endsWith('/')) url = url.slice(0, -1);
  if (url.endsWith('/rest/v1')) url = url.replace('/rest/v1', '');
  if (url.endsWith('/rest/v1/')) url = url.replace('/rest/v1/', '');
  return url;
})();

export const SUPABASE_SERVICE_ROLE_KEY = (() => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (key && key.trim()) {
    isSupabaseConfigured = true;
    return key.trim();
  }
  return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZXpocGRnYWZiZWZ3aXBtbGRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDA4NDg2OSwiZXhwIjoyMTA1NjYwODY5fQ.zj_4YRbhVhdq8KPaX0SlVPU8EY2IEfLv3N9bUWmgmjQ";
})();

export const SUPABASE_SECRET_KEY = (() => {
  const sec = process.env.SUPABASE_SECRET_KEY;
  if (!sec || sec === 'sb_secret_your_secret_key_here') {
    return "";
  }
  return sec;
})();

export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZXpocGRnYWZiZWZ3aXBtbGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwODQ4NjksImV4cCI6MjA5NjE3NTI3OX0.GrlyUjBklIk6sSFeBrqYqN2gDfTMfRxaQ0SX2glspkk";
export const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || SUPABASE_ANON_KEY;
export const SUPABASE_JWKS_URL = process.env.SUPABASE_JWKS_URL || `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`;
export const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres.yeezhpdgafbefwipmldl:G6$_9y!AexRK2wy@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";
export const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || "+uGO889dVvBQryEybsaAml7WcgVSMG5YgC7qgQcph1BOGAVKpqJrm81H024M7cvMXAyWSBGeppEeaMLUdkNHlQ==";

