import { supabase } from '../lib/supabaseClient';

export interface SpatialOverrideRecord {
  id?: string;
  pkkpr_id: string;
  overridden_by?: string;
  overridden_by_name?: string;
  conflict_type: 'LP2B_OVERLAP' | 'LAHAN_BASAH' | 'SEPADAN_SUNGAI' | 'KAWASAN_HUTAN' | 'MANGROVE' | 'TAMBAK' | 'LAINNYA';
  overlap_area_sqm?: number;
  overlap_area_ha?: number;
  justification: string;
  bap_reference_no?: string;
  overlap_geometry?: any;
  created_at?: string;
}

/**
 * Record a formal spatial conflict override into Supabase spatial_overrides table
 * with automatic fallback to localStorage and cross-table synchronization.
 */
export async function recordSpatialOverride(
  overrideData: SpatialOverrideRecord
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    const payload = {
      pkkpr_id: overrideData.pkkpr_id,
      conflict_type: overrideData.conflict_type,
      overlap_area_sqm: overrideData.overlap_area_sqm || 0,
      overlap_area_ha: overrideData.overlap_area_ha || (overrideData.overlap_area_sqm ? Number((overrideData.overlap_area_sqm / 10000).toFixed(4)) : 0),
      justification: overrideData.justification,
      bap_reference_no: overrideData.bap_reference_no || undefined,
      overridden_by_name: overrideData.overridden_by_name || 'Admin Dinas PUPTR',
      overlap_geometry: overrideData.overlap_geometry || null,
      created_at: new Date().toISOString()
    };

    // 1. Save to Supabase spatial_overrides table
    const { data, error } = await supabase
      .from('spatial_overrides')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.warn('[spatialOverridesService] Supabase insert note:', error.message);
    }

    // 2. Also update pkkpr application table notes & BAP reference in gis_pkkpr & investments
    try {
      await Promise.allSettled([
        supabase
          .from('gis_pkkpr')
          .update({
            catatan_teknis: `[SPATIAL OVERRIDE - ${overrideData.conflict_type}]: ${overrideData.justification} (BAP: ${overrideData.bap_reference_no || 'Terlampir'})`,
            berita_acara_pertanian_num: overrideData.bap_reference_no || undefined,
            updated_at: new Date().toISOString()
          })
          .eq('id', overrideData.pkkpr_id),

        supabase
          .from('investments')
          .update({
            override_justification: `[SPATIAL OVERRIDE - ${overrideData.conflict_type}]: ${overrideData.justification}`,
            berita_acara_num: overrideData.bap_reference_no || undefined,
            updated_at: new Date().toISOString()
          })
          .eq('id', overrideData.pkkpr_id)
      ]);
    } catch (e) {
      console.warn('[spatialOverridesService] Sync to applications failed:', e);
    }

    // 3. Fallback LocalStorage Sync for instant offline capability
    try {
      const existingRaw = localStorage.getItem('luwu_spatial_overrides');
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const newRecord = data || { id: `override-${Date.now()}`, ...payload };
      existing.unshift(newRecord);
      localStorage.setItem('luwu_spatial_overrides', JSON.stringify(existing));
    } catch (e) {
      console.warn('[spatialOverridesService] LocalStorage cache error:', e);
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('[spatialOverridesService] Error recording spatial override:', err);
    return { success: false, error: err.message || 'Gagal menyimpan spatial override' };
  }
}

/**
 * Fetch spatial conflict override history for a given application ID
 */
export async function getSpatialOverrides(pkkprId: string): Promise<SpatialOverrideRecord[]> {
  try {
    const { data, error } = await supabase
      .from('spatial_overrides')
      .select('*')
      .eq('pkkpr_id', pkkprId)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('[spatialOverridesService] Supabase query fallback:', err);
  }

  // Fallback to localStorage
  try {
    const existingRaw = localStorage.getItem('luwu_spatial_overrides');
    if (existingRaw) {
      const existing: SpatialOverrideRecord[] = JSON.parse(existingRaw);
      return existing.filter(item => item.pkkpr_id === pkkprId);
    }
  } catch (e) {
    console.warn('[spatialOverridesService] LocalStorage read error:', e);
  }

  return [];
}
