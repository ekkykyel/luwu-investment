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

import { safeFetchWithBackoff } from "./globalApiRetry";

const layerDataMemoryCache: Record<string, Promise<any>> = {};

/**
 * Clears in-memory layer cache for specific table or all layers.
 */
export function clearLayerDataCache(tableName?: string): void {
  if (tableName) {
    delete layerDataMemoryCache[tableName];
  } else {
    for (const key of Object.keys(layerDataMemoryCache)) {
      delete layerDataMemoryCache[key];
    }
  }
}

/**
 * Converts Supabase spatial rows (with geometry/geometry_json/geom/coordinates) into a standard GeoJSON FeatureCollection.
 */
export function convertRowsToGeoJSON(rows: any[], tableName: string): any {
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return { type: "FeatureCollection", features: [] };
  }

  // If already a FeatureCollection
  if (rows.length === 1 && rows[0]?.type === "FeatureCollection" && Array.isArray(rows[0]?.features)) {
    return rows[0];
  }

  const features: any[] = [];

  for (const row of rows) {
    if (!row) continue;
    if (row.type === "Feature" && row.geometry) {
      features.push(row);
      continue;
    }

    let geometry: any = row.geometry_json || row.geometry || row.geom || row.geojson || null;
    if (typeof geometry === "string") {
      try {
        geometry = JSON.parse(geometry);
      } catch {
        geometry = null;
      }
    }

    // Fallback coordinates for point tables (e.g. gis_infrastruktur, gis_potensi_investasi)
    if (!geometry && (row.longitude || row.lng) && (row.latitude || row.lat)) {
      const lng = Number(row.longitude || row.lng);
      const lat = Number(row.latitude || row.lat);
      if (!isNaN(lng) && !isNaN(lat)) {
        geometry = {
          type: "Point",
          coordinates: [lng, lat]
        };
      }
    }

    if (!geometry || !geometry.type) {
      continue;
    }

    const { geometry: _g, geometry_json: _gj, geom: _gm, geojson: _go, ...properties } = row;

    features.push({
      type: "Feature",
      id: row.id || row.gid || `feat_${Math.random().toString(36).slice(2, 8)}`,
      properties: {
        ...properties,
        _tableName: tableName,
        id: row.id || row.gid,
        name: row.name || row.nama || row.NAMOBJ || row.namobj || row.KECAMATAN || row.kecamatan || row.DESA || row.desa || row.keterangan || ""
      },
      geometry
    });
  }

  return {
    type: "FeatureCollection",
    features
  };
}

/**
 * Safe fetch layer data wrapper:
 * 1. Deduplikasi request (In-Memory Promise Cache) untuk mencegah infinite loop / request storm.
 * 2. Query Supabase langsung melalui client SDK (@supabase/supabase-js) sebagai Single Source of Truth (Zero 500 Route Error).
 * 3. Jika RPC get_layer_data tersedia, gunakan sebagai pelengkap.
 * 4. Fallback ke static JSON lokal /public/${tableName}.json jika offline.
 * 5. Fallback jujur (Honest Fallback) mengembalikan FeatureCollection kosong [] jika database kosong.
 */
export async function safeFetchLayerData(tableName: string, timeoutMs = 12000): Promise<any> {
  if (!tableName) return { type: "FeatureCollection", features: [] };

  const cleanTableName = tableName.replace('/api/spatial/', '').replace('/api/spatial-layers/', '').replace(/^\//, '').replace('.json', '');

  // Return existing in-flight / resolved request to deduplicate concurrent calls
  if (layerDataMemoryCache[cleanTableName]) {
    return layerDataMemoryCache[cleanTableName];
  }

  const fetchPromise = (async () => {
    // ATTEMPT 1: Query Supabase table directly via client SDK (Fast, Reliable, Zero Vercel/Proxy 500 error)
    try {
      const queryPromise = Promise.resolve(
        supabase.from(cleanTableName).select('*').limit(3000)
      ).catch((err) => ({ data: null, error: err }));

      const timeoutPromise = new Promise<{ data: any; error: any }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error('TABLE_QUERY_TIMEOUT') }), timeoutMs)
      );

      const res = await Promise.race([queryPromise, timeoutPromise]);
      if (res && res.data && !res.error && Array.isArray(res.data) && res.data.length > 0) {
        const geojson = convertRowsToGeoJSON(res.data, cleanTableName);
        if (geojson.features && geojson.features.length > 0) {
          console.log(`✅ [Direct Supabase Query] Berhasil tarik data layer ${cleanTableName}:`, geojson.features.length, 'fitur');
          return geojson;
        }
      }
    } catch (err) {
      console.warn(`[safeFetchLayerData] Direct query gagal untuk ${cleanTableName}, mencoba RPC...`);
    }

    // ATTEMPT 2: Coba Supabase PostGIS RPC ('get_layer_data')
    try {
      const rpcPromise = Promise.resolve(
        supabase.rpc('get_layer_data', { p_table_name: cleanTableName })
      ).catch((err) => ({ data: null, error: err }));

      const timeoutPromiseRpc = new Promise<{ data: any; error: any }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error('RPC_TIMEOUT') }), 4000)
      );

      const resRpc = await Promise.race([rpcPromise, timeoutPromiseRpc]);
      if (resRpc && resRpc.data && !resRpc.error) {
        const isFeatureCollection = resRpc.data?.type === 'FeatureCollection' && Array.isArray(resRpc.data?.features);
        const count = isFeatureCollection ? resRpc.data.features.length : (Array.isArray(resRpc.data) ? resRpc.data.length : 0);
        
        if (count > 0) {
          console.log(`✅ [Supabase RPC] Berhasil tarik data layer ${cleanTableName}:`, count, 'item');
          return isFeatureCollection ? resRpc.data : convertRowsToGeoJSON(resRpc.data, cleanTableName);
        }
      }
    } catch (err) {
      // quiet RPC error
    }

    // ATTEMPT 3: Fallback ke local static JSON file jika Supabase offline
    const urlsToTry = [`/${cleanTableName}.json`, `./${cleanTableName}.json`];
    for (const url of urlsToTry) {
      try {
        const staticRes = await safeFetchWithBackoff(url, {
          headers: { Accept: "application/json" },
          maxRetries: 1,
          initialDelayMs: 200
        });
        if (staticRes && staticRes.ok) {
          const json = await staticRes.json();
          if (json && (json.features?.length > 0 || (Array.isArray(json) && json.length > 0))) {
            return json.type === 'FeatureCollection' ? json : convertRowsToGeoJSON(json, cleanTableName);
          }
        }
      } catch {}
    }

    console.warn(`⚠️ [safeFetchLayerData] Tidak ada data ditemukan untuk layer: ${cleanTableName} (Honest Fallback)`);
    return { type: "FeatureCollection", features: [] };
  })();

  layerDataMemoryCache[cleanTableName] = fetchPromise;
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