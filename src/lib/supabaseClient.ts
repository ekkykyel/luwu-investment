/// <reference types="vite/client" />
import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://svxugvxchjsjuyfeddor.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_SyZQ0YW4CWEVfMjBS9NtZQ_T0tB4zJj";

const supabaseUrl = 
  (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL)) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  DEFAULT_SUPABASE_URL;

const supabaseAnonKey = 
  (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_ANON_KEY || process.env?.SUPABASE_ANON_KEY)) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  DEFAULT_SUPABASE_ANON_KEY;

const urlStr = (supabaseUrl || "").trim();
if (!urlStr || (!urlStr.startsWith("http://") && !urlStr.startsWith("https://"))) {
  throw new Error("Invalid or missing VITE_SUPABASE_URL");
}

export const supabase = createClient(urlStr, supabaseAnonKey || DEFAULT_SUPABASE_ANON_KEY);

/**
 * Handles Supabase errors, automatically clearing local auth session if JWT is expired (PGRST303)
 */
export async function handleSupabaseError(error: any): Promise<boolean> {
  if (!error) return false;
  const isJwtExpired = 
    error.code === 'PGRST303' || 
    (typeof error.message === 'string' && error.message.toLowerCase().includes('jwt expired'));

  if (isJwtExpired) {
    console.warn('[SupabaseClient] JWT expired (PGRST303). Clearing stale local session...');
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Ignore cleanup error
    }
    return true;
  }
  return false;
}

const layerDataMemoryCache: Record<string, Promise<any>> = {};

/**
 * Safe fetch layer data wrapper:
 * 1. Deduplikasi request (In-Memory Promise Cache) untuk mencegah infinite loop / request storm.
 * 2. Murni panggil Supabase PostGIS RPC 'get_layer_data' (Timeout 12s).
 * 3. Jika RPC tidak merespons, query langsung tabel Supabase (PostgREST) dan susun FeatureCollection.
 * 4. Jika koneksi database terputus/offline, gunakan static JSON lokal /public/${tableName}.json.
 * 5. Fallback jujur (Honest Fallback) mengembalikan array/FeatureCollection kosong [] jika semua sumber data kosong/gagal.
 */
export async function safeFetchLayerData(tableName: string, timeoutMs = 12000): Promise<any> {
  if (!tableName) return { type: "FeatureCollection", features: [] };

  // Return existing in-flight / resolved request to deduplicate concurrent calls
  if (layerDataMemoryCache[tableName]) {
    return layerDataMemoryCache[tableName];
  }

  const fetchPromise = (async () => {
    // ATTEMPT 1: Ambil langsung dari Supabase PostGIS RPC ('get_layer_data')
    try {
      const rpcPromise = Promise.resolve(
        supabase.rpc('get_layer_data', { p_table_name: tableName })
      ).catch((err) => ({ data: null, error: err }));

      const timeoutPromise = new Promise<{ data: any; error: any }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error('RPC_TIMEOUT') }), timeoutMs)
      );

      const res = await Promise.race([rpcPromise, timeoutPromise]);
      if (res && res.data && !res.error) {
        const isFeatureCollection = res.data?.type === 'FeatureCollection' && Array.isArray(res.data?.features);
        const isArray = Array.isArray(res.data);
        const count = isFeatureCollection ? res.data.features.length : (isArray ? res.data.length : 1);
        
        if (count > 0) {
          console.log(`✅ [Supabase RPC] Berhasil tarik data layer ${tableName}:`, count, 'item');
          return res.data;
        }
      }
    } catch (err) {
      console.warn(`[safeFetchLayerData] Supabase RPC gagal untuk ${tableName}, mencoba query tabel langsung...`);
    }

    // ATTEMPT 2: Fallback to local static JSON file first for GIS layers to prevent PostgREST 520 memory crashes
    const urlsToTry = [`/${tableName}.json`, `./${tableName}.json`];
    for (const url of urlsToTry) {
      try {
        const staticRes = await fetch(url, {
          headers: { Accept: "application/json" }
        });
        if (staticRes.ok) {
          const json = await staticRes.json();
          if (json && (json.features?.length > 0 || (Array.isArray(json) && json.length > 0))) {
            return json;
          }
        }
      } catch {}
    }

    // ATTEMPT 3: Query Supabase PostgREST table safely for non-spatial or small tables
    if (!tableName.startsWith("gis_jalan") && !tableName.startsWith("gis_desa") && !tableName.startsWith("gis_kecamatan")) {
      try {
        const fromPromise = Promise.resolve(
          supabase.from(tableName).select('id, name, created_at').limit(500)
        ).catch((err) => ({ data: null, error: err }));

        const timeoutPromise2 = new Promise<{ data: any; error: any }>((resolve) =>
          setTimeout(() => resolve({ data: null, error: new Error('TABLE_QUERY_TIMEOUT') }), 4000)
        );

        const fromRes = await Promise.race([fromPromise, timeoutPromise2]);
        if (fromRes && fromRes.data && !fromRes.error && Array.isArray(fromRes.data) && fromRes.data.length > 0) {
          return fromRes.data;
        }
      } catch (tableErr) {
        // quiet fallback
      }
    }

    console.warn(`⚠️ [safeFetchLayerData] Tidak ada data ditemukan untuk layer: ${tableName} (Honest Fallback)`);
    return { type: "FeatureCollection", features: [] };
  })();

  layerDataMemoryCache[tableName] = fetchPromise;
  return fetchPromise;
}

/**
 * Management session tokens (Cookie & LocalStorage)
 */
export function setAuthSessionToken(token: string) {
  if (!token) return;
  try {
    document.cookie = `sb-access-token=${token}; path=/; max-age=86400; SameSite=None; Secure`;
  } catch {}
  try {
    localStorage.setItem("sb-access-token", token);
    localStorage.setItem("luwu_session_token", token);
  } catch {}
}

export function clearAuthSessionToken() {
  try {
    document.cookie = 'sb-access-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None; Secure;';
  } catch {}
  try {
    localStorage.removeItem("sb-access-token");
    localStorage.removeItem("luwu_session_token");
    localStorage.removeItem("luwu_user_role");
  } catch {}
}

export function getStoredAuthToken(): string | null {
  try {
    const match = typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)sb-access-token=([^;]+)/) : null;
    if (match && match[1]) return match[1];
  } catch {}
  try {
    if (typeof localStorage !== 'undefined') {
      const local = localStorage.getItem("sb-access-token") || localStorage.getItem("luwu_session_token");
      if (local) return local;
    }
  } catch {}
  return null;
}