-- =========================================================================
-- MIGRATION: 20260917_detect_wilayah_rpc.sql
-- PURPOSE: Supabase PostGIS RPC Function for Automatic Administrative Location Detection
-- AUTHOR: GovTech Luwu Investment Web GIS Team
-- =========================================================================

-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- -------------------------------------------------------------------------
-- RPC FUNCTION: detect_wilayah_from_geojson
-- Accepts a GeoJSON Geometry object (JSONB) from client (KML/KMZ upload)
-- Performs spatial intersection (ST_Intersects) against gis_desa and gis_kecamatan
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION detect_wilayah_from_geojson(user_geojson jsonb)
RETURNS TABLE (
  kecamatan_id text,
  nama_kecamatan text,
  desa_id text,
  nama_desa text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(k.id::text, k.id_kecamatan::text, '')::text AS kecamatan_id,
    COALESCE(k.nama_kecamatan::text, k.name::text, k.kecamatan::text, '')::text AS nama_kecamatan,
    COALESCE(d.id::text, d.id_desa::text, '')::text AS desa_id,
    COALESCE(d.nama_desa::text, d.name::text, d.desa::text, '')::text AS nama_desa
  FROM gis_desa d
  LEFT JOIN gis_kecamatan k ON (
    d.kecamatan_id::text = k.id::text OR 
    d.id_kecamatan::text = k.id::text OR
    d.id_kecamatan::text = k.id_kecamatan::text OR
    LOWER(TRIM(REGEXP_REPLACE(d.kecamatan, '^(kec\.?|kecamatan)\s*', '', 'i'))) = LOWER(TRIM(REGEXP_REPLACE(k.nama_kecamatan, '^(kec\.?|kecamatan)\s*', '', 'i'))) OR
    LOWER(TRIM(REGEXP_REPLACE(d.kecamatan, '^(kec\.?|kecamatan)\s*', '', 'i'))) = LOWER(TRIM(REGEXP_REPLACE(k.name, '^(kec\.?|kecamatan)\s*', '', 'i')))
  )
  WHERE ST_Intersects(
    d.geom, 
    ST_SetSRID(ST_GeomFromGeoJSON(user_geojson::text), 4326)
  )
  LIMIT 1;
END;
$$;

-- Grant execute permissions to public/authenticated users
GRANT EXECUTE ON FUNCTION detect_wilayah_from_geojson(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION detect_wilayah_from_geojson(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION detect_wilayah_from_geojson(jsonb) TO service_role;

COMMENT ON FUNCTION detect_wilayah_from_geojson(jsonb) IS 
'Spasial PostGIS RPC untuk mengidentifikasi Kecamatan dan Desa Kabupaten Luwu berdasarkan input GeoJSON KML/KMZ.';
