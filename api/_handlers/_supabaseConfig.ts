/**
 * Centralized Supabase Configuration & URL Sanitizer for Vercel Serverless Functions.
 *
 * Problem Solved:
 * When SUPABASE_URL in Vercel Environment Variables is set to a PostgreSQL Connection URI
 * (e.g. postgresql://postgres.yeezhpdgafbefwipmldl:G6$_9y!AexRK2wy@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres),
 * any WHATWG fetch(`${SUPABASE_URL}/rest/v1/...`) throws a fatal TypeError:
 * "Request cannot be constructed from a URL that includes credentials"
 *
 * This utility safely sanitizes any PostgreSQL DSN, strips credentials, extracts the project ref,
 * and always produces a clean, standard HTTPS REST URL (e.g. https://yeezhpdgafbefwipmldl.supabase.co).
 */

export const DEFAULT_SUPABASE_PROJECT_REF = "yeezhpdgafbefwipmldl";
export const DEFAULT_SUPABASE_REST_URL = `https://${DEFAULT_SUPABASE_PROJECT_REF}.supabase.co`;
export const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZXpocGRnYWZiZWZ3aXBtbGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwODQ4NjksImV4cCI6MjEwNTY2MDg2OX0.GrlyUjBklIk6sSFeBrqYqN2gDfTMfRxaQ0SX2glspkk";

/**
 * Robustly sanitizes an input string to ensure it is a valid HTTP/HTTPS Supabase REST base URL.
 */
export function sanitizeSupabaseUrl(rawUrl?: string | null): string {
  const raw = (rawUrl || "").trim();
  if (!raw) return DEFAULT_SUPABASE_REST_URL;

  // 1. If it's already a clean HTTPS/HTTP Supabase URL without credentials or pooler host
  if (
    (raw.startsWith("https://") || raw.startsWith("http://")) &&
    !raw.includes("@") &&
    !raw.includes("pooler.supabase.com")
  ) {
    let clean = raw.replace(/\/+$/, "");
    if (clean.endsWith("/rest/v1")) {
      clean = clean.replace(/\/rest\/v1$/, "");
    }
    // Discard placeholder or revoked project refs
    if (clean.includes("svxugvxchjsjuyfeddor") || clean.includes("placeholder")) {
      return DEFAULT_SUPABASE_REST_URL;
    }
    return clean;
  }

  // 2. If it's a PostgreSQL connection string (pooler or direct)
  // Format: postgresql://postgres.yeezhpdgafbefwipmldl:secret@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
  const dsnUserMatch = raw.match(/postgres(?:ql)?:\/\/(?:postgres\.([a-z0-9_-]+)|([^:@/]+))(?::[^@]*)?@/i);
  if (dsnUserMatch) {
    const candidate = dsnUserMatch[1] || (dsnUserMatch[2] && dsnUserMatch[2] !== "postgres" ? dsnUserMatch[2] : null);
    if (candidate && candidate.length > 5 && candidate !== "svxugvxchjsjuyfeddor") {
      return `https://${candidate}.supabase.co`;
    }
  }

  // 3. Check for postgres.<project_ref> anywhere in the string
  const refMatch = raw.match(/postgres\.([a-z0-9]{15,30})/i);
  if (refMatch && refMatch[1] && refMatch[1] !== "svxugvxchjsjuyfeddor") {
    return `https://${refMatch[1]}.supabase.co`;
  }

  // 4. Check for <project_ref>.supabase.co anywhere in the string
  const hostMatch = raw.match(/([a-z0-9]{15,30})\.supabase\.co/i);
  if (hostMatch && hostMatch[1] && hostMatch[1] !== "svxugvxchjsjuyfeddor") {
    return `https://${hostMatch[1]}.supabase.co`;
  }

  // 5. Fallback to active SSOT Supabase Project
  return DEFAULT_SUPABASE_REST_URL;
}

/**
 * Returns a valid Supabase anon or service key for REST calls.
 */
export function getSupabaseAnonKey(): string {
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    DEFAULT_SUPABASE_ANON_KEY
  ).trim();

  if (!key || key.includes("your_anon_key") || key.includes("placeholder")) {
    return DEFAULT_SUPABASE_ANON_KEY;
  }
  return key;
}

export const SUPABASE_URL = sanitizeSupabaseUrl(
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL
);

export const SUPABASE_ANON_KEY = getSupabaseAnonKey();
