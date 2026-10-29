-- Migration: PostGIS Mapbox Vector Tile (MVT) Generation Functions
-- Generates binary .pbf tiles dynamically on the fly via PostGIS ST_AsMVT & ST_AsMVTGeom

-- 1. RTRW / Zoning MVT Function
CREATE OR REPLACE FUNCTION public.get_rtrw_mvt(z integer, x integer, y integer)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  mvt bytea;
BEGIN
  WITH mvtdata AS (
    SELECT 
      id,
      COALESCE(keterangan, rpluwu2009, 'Zonasi') AS keterangan,
      COALESCE(rpluwu2009, keterangan, 'Zonasi') AS rpluwu2009,
      COALESCE(fill_opacity, 1) AS fill_opacity,
      COALESCE(stroke, '#00aaff') AS stroke,
      COALESCE(stroke_width, 2) AS stroke_width,
      ST_AsMVTGeom(
        ST_Transform(geom, 3857),
        ST_TileEnvelope(z, x, y),
        4096,
        256,
        true
      ) AS geom
    FROM public.gis_zonasi
    WHERE geom IS NOT NULL
      AND ST_Intersects(geom, ST_Transform(ST_TileEnvelope(z, x, y), 4326))
  )
  SELECT ST_AsMVT(mvtdata.*, 'rtrw', 4096, 'geom') INTO mvt
  FROM mvtdata;

  RETURN COALESCE(mvt, ''::bytea);
END;
$$;

-- 2. RBI (Rupa Bumi Indonesia) MVT Function
CREATE OR REPLACE FUNCTION public.get_rbi_mvt(z integer, x integer, y integer)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  mvt bytea;
BEGIN
  WITH 
  road_data AS (
    SELECT 
      id,
      COALESCE(nama_ruas, nama, 'Jalan') AS name,
      COALESCE(keterangan, fungsi, 'Jalan Utama') AS tipe,
      ST_AsMVTGeom(
        ST_Transform(geom, 3857),
        ST_TileEnvelope(z, x, y),
        4096,
        256,
        true
      ) AS geom
    FROM public.gis_jalan
    WHERE geom IS NOT NULL
      AND ST_Intersects(geom, ST_Transform(ST_TileEnvelope(z, x, y), 4326))
  ),
  admin_data AS (
    SELECT 
      id,
      COALESCE(nama_desa, name, 'Wilayah') AS name,
      COALESCE(kecamatan, '') AS kecamatan,
      ST_AsMVTGeom(
        ST_Transform(geom, 3857),
        ST_TileEnvelope(z, x, y),
        4096,
        256,
        true
      ) AS geom
    FROM public.gis_desa
    WHERE geom IS NOT NULL
      AND ST_Intersects(geom, ST_Transform(ST_TileEnvelope(z, x, y), 4326))
  ),
  mvt_roads AS (
    SELECT ST_AsMVT(road_data.*, 'rbi_jalan', 4096, 'geom') AS tile FROM road_data
  ),
  mvt_admin AS (
    SELECT ST_AsMVT(admin_data.*, 'rbi_admin', 4096, 'geom') AS tile FROM admin_data
  )
  SELECT 
    COALESCE(mvt_roads.tile, ''::bytea) || 
    COALESCE(mvt_admin.tile, ''::bytea)
  INTO mvt
  FROM mvt_roads, mvt_admin;

  RETURN COALESCE(mvt, ''::bytea);
END;
$$;

-- 3. Generic Spatial MVT RPC Function
CREATE OR REPLACE FUNCTION public.get_spatial_layer_mvt(p_table text, z integer, x integer, y integer)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_sql text;
  v_mvt bytea;
  v_safe_table text;
BEGIN
  IF p_table IS NULL OR p_table NOT LIKE 'gis_%' THEN
    RETURN ''::bytea;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = p_table
  ) THEN
    RETURN ''::bytea;
  END IF;

  v_safe_table := quote_ident(p_table);

  v_sql := format('
    WITH mvtdata AS (
      SELECT 
        id,
        t.*,
        ST_AsMVTGeom(
          ST_Transform(t.geom, 3857),
          ST_TileEnvelope(%s, %s, %s),
          4096,
          256,
          true
        ) AS mvt_geom
      FROM public.%I t
      WHERE t.geom IS NOT NULL
        AND ST_Intersects(t.geom, ST_Transform(ST_TileEnvelope(%s, %s, %s), 4326))
    )
    SELECT ST_AsMVT(mvtdata.*, %L, 4096, ''mvt_geom'')
    FROM mvtdata;
  ', z, x, y, v_safe_table, z, x, y, p_table);

  EXECUTE v_sql INTO v_mvt;
  RETURN COALESCE(v_mvt, ''::bytea);
EXCEPTION
  WHEN OTHERS THEN
    RETURN ''::bytea;
END;
$$;

-- Grant permissions to public roles
GRANT EXECUTE ON FUNCTION public.get_rtrw_mvt(integer, integer, integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_rbi_mvt(integer, integer, integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_spatial_layer_mvt(text, integer, integer, integer) TO anon, authenticated, service_role;
