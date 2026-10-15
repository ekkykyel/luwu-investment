-- ========================================================================
-- MIGRATION 021: Automated Pre-Validation & Geometry Healing Trigger
-- (Auto ST_MakeValid, ST_SnapToGrid, MultiPolygon Normalization)
-- Target Tables: permohonan_perubahan_lahan, gis_pkkpr, gis_sawah, layer_lahan_basah
-- Pemerintah Kabupaten Luwu - Dinas Pertanian & Dinas PUPTR
-- ========================================================================

-- 1. Fungsi Validasi & Pemulihan Geometri Otomatis (Sanitization & Topology Healing)
CREATE OR REPLACE FUNCTION public.fn_auto_sanitize_and_validate_geometry()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_raw_geom GEOMETRY;
    v_healed_geom GEOMETRY;
    v_polygon_only GEOMETRY;
BEGIN
    -- A. Tangani input jika kolom 'geom' atau 'geometry' diberikan
    IF NEW.geom IS NOT NULL THEN
        v_raw_geom := NEW.geom;
    ELSIF NEW.geojson IS NOT NULL THEN
        BEGIN
            v_raw_geom := ST_GeomFromGeoJSON(NEW.geojson::text);
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING '[PRE-VALIDATION] Format GeoJSON tidak valid: %', SQLERRM;
            v_raw_geom := NULL;
        END;
    END IF;

    -- B. Jika ada geometri yang masuk, lakukan pemulihan topologi OGC standard
    IF v_raw_geom IS NOT NULL AND NOT ST_IsEmpty(v_raw_geom) THEN
        -- 1. Paksa SRID 4326 (WGS 84)
        v_raw_geom := ST_SetSRID(v_raw_geom, 4326);

        -- 2. Snap to grid mikro (0.000001 deg ~ 0.1 meter) untuk membersihkan floating-point drift
        v_healed_geom := ST_SnapToGrid(v_raw_geom, 0.000001);

        -- 3. Cek validitas: Jika invalid (self-intersection, bowtie, collinear), perbaiki dengan ST_MakeValid
        IF NOT ST_IsValid(v_healed_geom) THEN
            v_healed_geom := ST_MakeValid(v_healed_geom);
        END IF;

        -- 4. Ekstrak hanya elemen 2D Poligon / MultiPoligon (membuang degenerate points/lines)
        v_polygon_only := ST_CollectionExtract(v_healed_geom, 3);

        -- 5. Jika hasil ekstraksi valid, konversikan ke MultiPolygon standar
        IF v_polygon_only IS NOT NULL AND NOT ST_IsEmpty(v_polygon_only) THEN
            NEW.geom := ST_Multi(v_polygon_only);
        ELSE
            -- Jika geometri bukan poligon, simpan geometri hasil MakeValid
            NEW.geom := v_healed_geom;
        END IF;

        -- 6. Sinkronkan kembali kolom geojson jika tabel memiliki kolom geojson
        BEGIN
            NEW.geojson := ST_AsGeoJSON(NEW.geom)::jsonb;
        EXCEPTION WHEN OTHERS THEN
            -- Abaikan jika kolom geojson bukan tipe jsonb
            NULL;
        END;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[PRE-VALIDATION ERROR] Gagal sanitasi geometri: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 2. Pasang Trigger BEFORE INSERT OR UPDATE pada 'permohonan_perubahan_lahan'
DROP TRIGGER IF EXISTS trg_prevalidate_geom_permohonan_perubahan_lahan ON public.permohonan_perubahan_lahan;

CREATE TRIGGER trg_prevalidate_geom_permohonan_perubahan_lahan
BEFORE INSERT OR UPDATE OF geom, geojson ON public.permohonan_perubahan_lahan
FOR EACH ROW
EXECUTE FUNCTION public.fn_auto_sanitize_and_validate_geometry();

-- 3. Pasang Trigger BEFORE INSERT OR UPDATE pada 'gis_pkkpr'
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gis_pkkpr') THEN
        DROP TRIGGER IF EXISTS trg_prevalidate_geom_gis_pkkpr ON public.gis_pkkpr;
        
        CREATE TRIGGER trg_prevalidate_geom_gis_pkkpr
        BEFORE INSERT OR UPDATE OF geom ON public.gis_pkkpr
        FOR EACH ROW
        EXECUTE FUNCTION public.fn_auto_sanitize_and_validate_geometry();
    END IF;
END $$;

-- 4. Pasang Trigger BEFORE INSERT OR UPDATE pada 'gis_sawah'
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gis_sawah') THEN
        DROP TRIGGER IF EXISTS trg_prevalidate_geom_gis_sawah ON public.gis_sawah;
        
        CREATE TRIGGER trg_prevalidate_geom_gis_sawah
        BEFORE INSERT OR UPDATE OF geom ON public.gis_sawah
        FOR EACH ROW
        EXECUTE FUNCTION public.fn_auto_sanitize_and_validate_geometry();
    END IF;
END $$;

-- 5. Skrip Pembersihan Massal (One-Time Topology Healing) untuk data eksisting
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gis_sawah') THEN
        UPDATE public.gis_sawah
        SET geom = ST_Multi(ST_CollectionExtract(ST_MakeValid(ST_SnapToGrid(geom, 0.000001)), 3))
        WHERE geom IS NOT NULL AND NOT ST_IsValid(geom);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'permohonan_perubahan_lahan') THEN
        UPDATE public.permohonan_perubahan_lahan
        SET geom = ST_Multi(ST_CollectionExtract(ST_MakeValid(ST_SnapToGrid(geom, 0.000001)), 3))
        WHERE geom IS NOT NULL AND NOT ST_IsValid(geom);
    END IF;
END $$;
