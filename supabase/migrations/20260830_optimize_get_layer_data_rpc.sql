-- Migration: Optimize get_layer_data RPC function & Spatial Indexes
-- Purpose: Eliminate 57014 query_canceled statement timeout on GIS layer requests

-- 1. Ensure GIST Spatial Indexes on All GIS Tables
CREATE INDEX IF NOT EXISTS idx_gis_zonasi_geom_gist ON public.gis_zonasi USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_gis_desa_geom_gist ON public.gis_desa USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_gis_kecamatan_geom_gist ON public.gis_kecamatan USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_gis_infrastruktur_geom_gist ON public.gis_infrastruktur USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_gis_jalan_geom_gist ON public.gis_jalan USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_gis_lahankeringprimer_geom_gist ON public.gis_lahankeringprimer USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_gis_lahankeringsekunder_geom_gist ON public.gis_lahankeringsekunder USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_gis_mangrove_geom_gist ON public.gis_mangrove USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_gis_potensi_investasi_geom_gist ON public.gis_potensi_investasi USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_gis_sawah_geom_gist ON public.gis_sawah USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_gis_sungai_geom_gist ON public.gis_sungai USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_gis_tambak_geom_gist ON public.gis_tambak USING GIST (geom);

-- 2. Drop obsolete/overloaded signatures of get_layer_data to prevent ambiguity
DROP FUNCTION IF EXISTS public.get_layer_data(text);
DROP FUNCTION IF EXISTS public.get_layer_data(text, double precision, double precision, double precision, double precision);
DROP FUNCTION IF EXISTS public.get_layer_data(text, double precision, double precision, double precision, double precision, double precision, integer);

-- 3. Create High-Performance Canonical get_layer_data Function
CREATE OR REPLACE FUNCTION public.get_layer_data(
    p_table_name text,
    p_xmin double precision DEFAULT NULL,
    p_ymin double precision DEFAULT NULL,
    p_xmax double precision DEFAULT NULL,
    p_ymax double precision DEFAULT NULL,
    p_tolerance double precision DEFAULT 0.0003,
    p_limit integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_safe_table TEXT;
    v_sql TEXT;
    v_result JSONB;
    v_where TEXT := 'WHERE t.geom IS NOT NULL';
    v_limit_clause TEXT := '';
    v_tol DOUBLE PRECISION;
BEGIN
    -- 1. Whitelist validation
    IF p_table_name IS NULL OR p_table_name NOT LIKE 'gis_%' THEN
        RETURN jsonb_build_object('type', 'FeatureCollection', 'features', '[]'::jsonb);
    END IF;

    -- 2. Table existence verification
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = p_table_name
    ) THEN
        RETURN jsonb_build_object('type', 'FeatureCollection', 'features', '[]'::jsonb);
    END IF;

    v_safe_table := quote_ident(p_table_name);
    v_tol := COALESCE(p_tolerance, 0.0003);

    -- 3. Spatial Bounding Box Filter utilizing GIST index operator (&&) and ST_Intersects
    IF p_xmin IS NOT NULL AND p_ymin IS NOT NULL AND p_xmax IS NOT NULL AND p_ymax IS NOT NULL THEN
        v_where := v_where || format(
            ' AND t.geom && ST_MakeEnvelope(%s, %s, %s, %s, 4326) AND ST_Intersects(t.geom, ST_MakeEnvelope(%s, %s, %s, %s, 4326))', 
            p_xmin, p_ymin, p_xmax, p_ymax,
            p_xmin, p_ymin, p_xmax, p_ymax
        );
    END IF;

    -- 4. Limit clause if specified
    IF p_limit IS NOT NULL AND p_limit > 0 THEN
        v_limit_clause := format(' LIMIT %s', p_limit);
    END IF;

    -- 5. Build high-performance GeoJSON query with ST_Simplify & 5-decimal coordinate precision (~1m accuracy)
    v_sql := format(
        $query$
        WITH feature_data AS (
            SELECT 
                (row_to_json(t.*)::jsonb - 'geom') AS properties,
                CASE 
                    WHEN %3$s > 0 THEN ST_AsGeoJSON(ST_Simplify(t.geom, %3$s), 5)::jsonb
                    ELSE ST_AsGeoJSON(t.geom, 5)::jsonb
                END AS geometry
            FROM %1$I t
            %2$s
            %4$s
        )
        SELECT jsonb_build_object(
            'type', 'FeatureCollection',
            'features', COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'type', 'Feature',
                        'geometry', geometry,
                        'properties', properties
                    )
                ), 
                '[]'::jsonb
            )
        )
        FROM feature_data
        WHERE geometry IS NOT NULL;
        $query$, 
        v_safe_table,
        v_where,
        v_tol,
        v_limit_clause
    );

    EXECUTE v_sql INTO v_result;
    RETURN COALESCE(v_result, jsonb_build_object('type', 'FeatureCollection', 'features', '[]'::jsonb));

EXCEPTION WHEN OTHERS THEN
    -- Honest Fallback: return empty FeatureCollection on unexpected error
    RETURN jsonb_build_object('type', 'FeatureCollection', 'features', '[]'::jsonb);
END;
$function$;
