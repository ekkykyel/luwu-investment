-- ========================================================================
-- MIGRATION 020: PostGIS Database Trigger for Automated ST_Difference
-- Target Tables: permohonan_perubahan_lahan, gis_sawah, layer_lahan_basah
-- Kabupaten Luwu - Dinas Pertanian & Dinas PUPTR
-- ========================================================================

-- 1. Pastikan tabel permohonan_perubahan_lahan ada (atau dibuat jika belum ada)
CREATE TABLE IF NOT EXISTS public.permohonan_perubahan_lahan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_permohonan VARCHAR(100) UNIQUE,
    nama_pemohon VARCHAR(255),
    jenis_permohonan VARCHAR(100) DEFAULT 'Alih Fungsi LP2B/Lahan Basah',
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'pending', 'approved', 'rejected'
    catatan_pertanian TEXT,
    rasio_pengganti NUMERIC(5,2) DEFAULT 1.0,
    geom GEOMETRY(Geometry, 4326),
    geojson JSONB,
    approved_at TIMESTAMPTZ,
    approved_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index spasial GIST
CREATE INDEX IF NOT EXISTS idx_permohonan_perubahan_lahan_geom_gist 
ON public.permohonan_perubahan_lahan USING GIST (geom);

-- 2. Pastikan tabel audit potongan spasial tersedia (Non-Destructive Compliance)
CREATE TABLE IF NOT EXISTS public.lp2b_clearance_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permohonan_id UUID,
    nomor_permohonan VARCHAR(100),
    layer_name VARCHAR(100) NOT NULL, -- 'gis_sawah' atau 'layer_lahan_basah'
    target_feature_id TEXT NOT NULL,
    original_geom GEOMETRY(Geometry, 4326) NOT NULL,
    cut_geom GEOMETRY(Geometry, 4326) NOT NULL,
    resulting_geom GEOMETRY(Geometry, 4326),
    original_area_m2 NUMERIC(15,2),
    cut_area_m2 NUMERIC(15,2),
    remaining_area_m2 NUMERIC(15,2),
    action_type VARCHAR(50) DEFAULT 'ST_DIFFERENCE_TRIGGER',
    approved_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp2b_clearance_audit_geom_gist 
ON public.lp2b_clearance_audit USING GIST (original_geom);

-- 3. Fungsi Inti Eksekusi Spasial ST_Difference dengan Proteksi Topologi
CREATE OR REPLACE FUNCTION public.fn_execute_spatial_difference_on_approval()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_applicant_geom GEOMETRY(Geometry, 4326);
    v_sawah_record RECORD;
    v_lahan_basah_record RECORD;
    v_diff_geom GEOMETRY;
    v_clean_diff_geom GEOMETRY(Geometry, 4326);
    v_orig_area NUMERIC;
    v_diff_area NUMERIC;
    v_cut_area NUMERIC;
    v_min_area_threshold NUMERIC := 1.0; -- Ambang batas sliver (1 m²)
BEGIN
    -- Validasi apakah status berubah menjadi 'approved'
    IF (NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved')) THEN
        
        -- Dapatkan geometri pemohon (prioritas: kolom geom -> parsing geojson)
        IF NEW.geom IS NOT NULL THEN
            v_applicant_geom := ST_SetSRID(NEW.geom, 4326);
        ELSIF NEW.geojson IS NOT NULL THEN
            BEGIN
                v_applicant_geom := ST_SetSRID(ST_GeomFromGeoJSON(NEW.geojson::text), 4326);
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING '[TRIGGER LP2B] Gagal konversi GeoJSON ke Geometri: %', SQLERRM;
                RETURN NEW;
            END;
        END IF;

        -- Validasi geometri pemohon menggunakan MakeValid dan SnapToGrid
        IF v_applicant_geom IS NULL OR ST_IsEmpty(v_applicant_geom) THEN
            RAISE WARNING '[TRIGGER LP2B] Geometri permohonan kosong/invalid. Melewatkan pemotongan spasial.';
            RETURN NEW;
        END IF;

        -- Normalisasi topologi geometri pemohon (Ekstrak hanya Poligon/MultiPoligon)
        v_applicant_geom := ST_CollectionExtract(
            ST_MakeValid(ST_SnapToGrid(v_applicant_geom, 0.000001)), 
            3
        );

        --------------------------------------------------------------------
        -- A. EKSEKUSI ST_DIFFERENCE PADA TABEL 'gis_sawah'
        --------------------------------------------------------------------
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gis_sawah') THEN
            FOR v_sawah_record IN 
                SELECT id, geom 
                FROM public.gis_sawah 
                WHERE geom IS NOT NULL 
                  AND ST_Intersects(geom, v_applicant_geom)
            LOOP
                BEGIN
                    -- Hitung luas asli dalam meter persegi (menggunakan proyeksi geography / WGS84)
                    v_orig_area := ST_Area(v_sawah_record.geom::geography);

                    -- Eksekusi ST_Difference dengan proteksi validitas
                    v_diff_geom := ST_Difference(
                        ST_CollectionExtract(ST_MakeValid(ST_SnapToGrid(v_sawah_record.geom, 0.000001)), 3),
                        v_applicant_geom
                    );

                    -- Ekstrak hanya elemen bertipe Polygon/MultiPolygon (code 3)
                    v_clean_diff_geom := ST_Multi(
                        ST_CollectionExtract(
                            ST_MakeValid(ST_SnapToGrid(v_diff_geom, 0.000001)), 
                            3
                        )
                    );

                    -- Hitung luas sisa dan luas yang terpotong
                    IF v_clean_diff_geom IS NOT NULL AND NOT ST_IsEmpty(v_clean_diff_geom) THEN
                        v_diff_area := ST_Area(v_clean_diff_geom::geography);
                    ELSE
                        v_diff_area := 0;
                    END IF;

                    v_cut_area := GREATEST(0, v_orig_area - v_diff_area);

                    -- 1. Catat Audit Log
                    INSERT INTO public.lp2b_clearance_audit (
                        permohonan_id,
                        nomor_permohonan,
                        layer_name,
                        target_feature_id,
                        original_geom,
                        cut_geom,
                        resulting_geom,
                        original_area_m2,
                        cut_area_m2,
                        remaining_area_m2,
                        approved_by,
                        notes
                    ) VALUES (
                        NEW.id,
                        NEW.nomor_permohonan,
                        'gis_sawah',
                        v_sawah_record.id::text,
                        v_sawah_record.geom,
                        v_applicant_geom,
                        v_clean_diff_geom,
                        v_orig_area,
                        v_cut_area,
                        v_diff_area,
                        NEW.approved_by,
                        'Otomatis via Database Trigger saat permohonan disetujui'
                    );

                    -- 2. Update atau Hapus Layer GIS Sawah
                    IF v_clean_diff_geom IS NULL OR ST_IsEmpty(v_clean_diff_geom) OR v_diff_area < v_min_area_threshold THEN
                        -- Jika seluruh poligon sawah terpotong habis, hapus baris
                        DELETE FROM public.gis_sawah WHERE id = v_sawah_record.id;
                    ELSE
                        -- Update dengan geometri sisa yang baru
                        UPDATE public.gis_sawah 
                        SET geom = v_clean_diff_geom
                        WHERE id = v_sawah_record.id;
                    END IF;

                EXCEPTION WHEN OTHERS THEN
                    RAISE WARNING '[TRIGGER LP2B gis_sawah Error] ID %: %', v_sawah_record.id, SQLERRM;
                END;
            END LOOP;
        END IF;

        --------------------------------------------------------------------
        -- B. EKSEKUSI ST_DIFFERENCE PADA TABEL 'layer_lahan_basah' / 'gis_lahan_basah'
        --------------------------------------------------------------------
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'layer_lahan_basah') THEN
            FOR v_lahan_basah_record IN 
                SELECT id, geom 
                FROM public.layer_lahan_basah 
                WHERE geom IS NOT NULL 
                  AND ST_Intersects(geom, v_applicant_geom)
            LOOP
                BEGIN
                    v_orig_area := ST_Area(v_lahan_basah_record.geom::geography);

                    v_diff_geom := ST_Difference(
                        ST_CollectionExtract(ST_MakeValid(ST_SnapToGrid(v_lahan_basah_record.geom, 0.000001)), 3),
                        v_applicant_geom
                    );

                    v_clean_diff_geom := ST_Multi(
                        ST_CollectionExtract(
                            ST_MakeValid(ST_SnapToGrid(v_diff_geom, 0.000001)), 
                            3
                        )
                    );

                    IF v_clean_diff_geom IS NOT NULL AND NOT ST_IsEmpty(v_clean_diff_geom) THEN
                        v_diff_area := ST_Area(v_clean_diff_geom::geography);
                    ELSE
                        v_diff_area := 0;
                    END IF;

                    v_cut_area := GREATEST(0, v_orig_area - v_diff_area);

                    INSERT INTO public.lp2b_clearance_audit (
                        permohonan_id,
                        nomor_permohonan,
                        layer_name,
                        target_feature_id,
                        original_geom,
                        cut_geom,
                        resulting_geom,
                        original_area_m2,
                        cut_area_m2,
                        remaining_area_m2,
                        approved_by,
                        notes
                    ) VALUES (
                        NEW.id,
                        NEW.nomor_permohonan,
                        'layer_lahan_basah',
                        v_lahan_basah_record.id::text,
                        v_lahan_basah_record.geom,
                        v_applicant_geom,
                        v_clean_diff_geom,
                        v_orig_area,
                        v_cut_area,
                        v_diff_area,
                        NEW.approved_by,
                        'Otomatis via Database Trigger saat permohonan disetujui'
                    );

                    IF v_clean_diff_geom IS NULL OR ST_IsEmpty(v_clean_diff_geom) OR v_diff_area < v_min_area_threshold THEN
                        DELETE FROM public.layer_lahan_basah WHERE id = v_lahan_basah_record.id;
                    ELSE
                        UPDATE public.layer_lahan_basah 
                        SET geom = v_clean_diff_geom
                        WHERE id = v_lahan_basah_record.id;
                    END IF;

                EXCEPTION WHEN OTHERS THEN
                    RAISE WARNING '[TRIGGER LP2B layer_lahan_basah Error] ID %: %', v_lahan_basah_record.id, SQLERRM;
                END;
            END LOOP;
        END IF;

    END IF;

    RETURN NEW;
END;
$$;

-- 4. Pasang Trigger pada Tabel permohonan_perubahan_lahan
DROP TRIGGER IF EXISTS trg_permohonan_perubahan_lahan_spatial_diff ON public.permohonan_perubahan_lahan;

CREATE TRIGGER trg_permohonan_perubahan_lahan_spatial_diff
AFTER UPDATE OF status ON public.permohonan_perubahan_lahan
FOR EACH ROW
WHEN (NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved')
EXECUTE FUNCTION public.fn_execute_spatial_difference_on_approval();

-- 5. Kompatibilitas Trigger untuk tabel `gis_pkkpr` jika alur alih fungsi menggunakan tabel PKKPR
DROP TRIGGER IF EXISTS trg_gis_pkkpr_lp2b_spatial_diff ON public.gis_pkkpr;

CREATE OR REPLACE FUNCTION public.fn_execute_spatial_difference_on_pkkpr_approval()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (NEW.clearance_status = 'approved' AND (OLD.clearance_status IS DISTINCT FROM 'approved')) THEN
        -- Delegasikan eksekusi fungsi spasial
        PERFORM public.execute_lp2b_spatial_difference(
            NEW.id,
            COALESCE(NEW.approved_by, 'Admin Dinas Pertanian'),
            COALESCE(NEW.notes, 'Persetujuan BAP Alih Fungsi LP2B via gis_pkkpr'),
            COALESCE(NEW.rasio_pengganti, 1.0)
        );
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[TRIGGER gis_pkkpr Error]: %', SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_gis_pkkpr_lp2b_spatial_diff
AFTER UPDATE OF clearance_status ON public.gis_pkkpr
FOR EACH ROW
WHEN (NEW.clearance_status = 'approved' AND OLD.clearance_status IS DISTINCT FROM 'approved')
EXECUTE FUNCTION public.fn_execute_spatial_difference_on_pkkpr_approval();
