-- ====================================================================================
-- MIGRASI 019: POSTGIS DYNAMIC SPATIAL DIFFERENCE UNTUK ALIH FUNGSI LP2B
-- DINAS PERTANIAN KABUPATEN LUWU
-- ====================================================================================
-- Deskripsi:
-- 1. Menyediakan tabel audit 'lp2b_clearance_audit' untuk mencatat jejak spasial alih fungsi.
-- 2. Fungsi PostGIS 'execute_lp2b_spatial_difference' untuk mengeksekusi ST_Difference
--    secara presisi saat BAP Pertanian disetujui, mencegah sliver polygons & menjaga topologi.
-- 3. Fungsi rollback 'rollback_lp2b_spatial_difference' untuk mengembalikan poligon sawah jika izin dibatalkan.
-- ====================================================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- ------------------------------------------------------------------------------------
-- 1. TABEL AUDIT SPASIAL LP2B (NON-DESTRUCTIVE AUDIT TRAIL)
-- ------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lp2b_clearance_audit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    permohonan_id TEXT NOT NULL,
    berita_acara_num TEXT NOT NULL,
    surat_rekomendasi_num TEXT,
    sawah_id TEXT,
    original_area_m2 NUMERIC,
    cut_area_m2 NUMERIC,
    remaining_area_m2 NUMERIC,
    replacement_land_ratio TEXT DEFAULT '1:1',
    permohonan_geom GEOMETRY,
    cut_polygon_geom GEOMETRY,
    notes TEXT,
    executed_by TEXT DEFAULT 'admin_pertanian',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index spasial dan foreign key lookup
CREATE INDEX IF NOT EXISTS idx_lp2b_audit_permohonan ON public.lp2b_clearance_audit(permohonan_id);
CREATE INDEX IF NOT EXISTS idx_lp2b_audit_geom ON public.lp2b_clearance_audit USING GIST(cut_polygon_geom);

-- RLS & Kebijakan Keamanan
ALTER TABLE public.lp2b_clearance_audit ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'lp2b_clearance_audit' AND policyname = 'Allow read for all authenticated users'
  ) THEN
    CREATE POLICY "Allow read for all authenticated users" 
    ON public.lp2b_clearance_audit FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'lp2b_clearance_audit' AND policyname = 'Allow insert for authenticated users'
  ) THEN
    CREATE POLICY "Allow insert for authenticated users" 
    ON public.lp2b_clearance_audit FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;


-- ------------------------------------------------------------------------------------
-- 2. FUNGSI POSTGIS: execute_lp2b_spatial_difference
-- ------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.execute_lp2b_spatial_difference(
    p_permohonan_id TEXT,
    p_ba_num TEXT,
    p_sr_num TEXT DEFAULT '',
    p_notes TEXT DEFAULT '',
    p_replacement_ratio TEXT DEFAULT '1:1',
    p_executed_by TEXT DEFAULT 'admin_pertanian'
)
RETURNS JSON AS $$
DECLARE
    v_permohonan_geom GEOMETRY;
    v_sawah RECORD;
    v_diff_geom GEOMETRY;
    v_cut_geom GEOMETRY;
    v_orig_area NUMERIC;
    v_cut_area NUMERIC;
    v_rem_area NUMERIC;
    v_cut_count INT := 0;
    v_total_cut_area NUMERIC := 0;
BEGIN
    -- 1. Ambil geometri permohonan dari gis_pkkpr atau investments
    SELECT ST_SetSRID(geom::geometry, 4326) INTO v_permohonan_geom 
    FROM public.gis_pkkpr 
    WHERE id = p_permohonan_id AND geom IS NOT NULL
    LIMIT 1;

    IF v_permohonan_geom IS NULL THEN
        SELECT ST_SetSRID(geometry::geometry, 4326) INTO v_permohonan_geom 
        FROM public.investments 
        WHERE id = p_permohonan_id AND geometry IS NOT NULL
        LIMIT 1;
    END IF;

    IF v_permohonan_geom IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Geometri permohonan tidak ditemukan atau bernilai NULL pada database.'
        );
    END IF;

    -- Pastikan geometri permohonan valid
    v_permohonan_geom := ST_MakeValid(v_permohonan_geom);

    -- 2. Iterasi setiap poligon sawah yang beririsan (ST_Intersects)
    FOR v_sawah IN 
        SELECT id, geom, luas_m2 
        FROM public.gis_sawah 
        WHERE geom IS NOT NULL AND ST_Intersects(geom, v_permohonan_geom)
    LOOP
        -- Hitung geometri potongan yang tumpang tindih
        v_cut_geom := ST_CollectionExtract(ST_MakeValid(ST_Intersection(v_sawah.geom, v_permohonan_geom)), 3);
        
        IF v_cut_geom IS NOT NULL AND NOT ST_IsEmpty(v_cut_geom) THEN
            v_orig_area := COALESCE(v_sawah.luas_m2, ROUND(ST_Area(v_sawah.geom::geography)::numeric, 2));
            v_cut_area := ROUND(ST_Area(v_cut_geom::geography)::numeric, 2);

            -- Hanya proses jika luas potongan > 0.1 m2 (menghindari sliver/noise)
            IF v_cut_area > 0.1 THEN
                -- Eksekusi ST_Difference
                v_diff_geom := ST_CollectionExtract(ST_MakeValid(ST_Difference(v_sawah.geom, v_permohonan_geom)), 3);

                IF v_diff_geom IS NOT NULL AND NOT ST_IsEmpty(v_diff_geom) THEN
                    v_diff_geom := ST_Multi(v_diff_geom);
                    v_rem_area := ROUND(ST_Area(v_diff_geom::geography)::numeric, 2);

                    -- Update tabel master gis_sawah
                    UPDATE public.gis_sawah
                    SET 
                        geom = v_diff_geom,
                        luas_m2 = v_rem_area,
                        description = json_build_object(
                            '@type', 'html',
                            'value', format('PL = Sawah LP2B<br>Luas_m2 = %s<br>Post Alih Fungsi = %s (%s)', v_rem_area, p_ba_num, now()::date)
                        )::text
                    WHERE id = v_sawah.id;
                ELSE
                    -- Jika poligon sawah habis total terpotong
                    v_rem_area := 0;
                    DELETE FROM public.gis_sawah WHERE id = v_sawah.id;
                END IF;

                -- Catat ke audit trail
                INSERT INTO public.lp2b_clearance_audit (
                    permohonan_id,
                    berita_acara_num,
                    surat_rekomendasi_num,
                    sawah_id,
                    original_area_m2,
                    cut_area_m2,
                    remaining_area_m2,
                    replacement_land_ratio,
                    permohonan_geom,
                    cut_polygon_geom,
                    notes,
                    executed_by
                ) VALUES (
                    p_permohonan_id,
                    p_ba_num,
                    p_sr_num,
                    v_sawah.id::text,
                    v_orig_area,
                    v_cut_area,
                    v_rem_area,
                    p_replacement_ratio,
                    v_permohonan_geom,
                    v_cut_geom,
                    p_notes,
                    p_executed_by
                );

                v_cut_count := v_cut_count + 1;
                v_total_cut_area := v_total_cut_area + v_cut_area;
            END IF;
        END IF;
    END LOOP;

    -- 3. Update status permohonan di gis_pkkpr dan investments
    UPDATE public.gis_pkkpr
    SET 
        status_pkkpr = 'Approved_Pertanian',
        berita_acara_pertanian_num = p_ba_num,
        catatan_teknis = format('[REKOMENDASI ALIH FUNGSI LP2B TERBIT - %s]: %s', p_ba_num, p_notes),
        updated_at = now()
    WHERE id = p_permohonan_id;

    UPDATE public.investments
    SET 
        status = 'Approved_Pertanian',
        pertanian_status = 'APPROVED',
        berita_acara_num = p_ba_num,
        surat_rekomendasi_num = p_sr_num,
        override_justification = format('[REKOMENDASI ALIH FUNGSI LP2B TERBIT - %s]: %s', p_ba_num, p_notes),
        updated_at = now()
    WHERE id = p_permohonan_id;

    RETURN json_build_object(
        'success', true,
        'permohonan_id', p_permohonan_id,
        'berita_acara_num', p_ba_num,
        'surat_rekomendasi_num', p_sr_num,
        'cut_polygons_count', v_cut_count,
        'total_cut_area_m2', v_total_cut_area,
        'total_cut_area_ha', ROUND((v_total_cut_area / 10000.0)::numeric, 4),
        'message', format('Operasi ST_Difference berhasil. %s poligon LP2B terpotong seluas %s m2.', v_cut_count, v_total_cut_area)
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'detail', 'Terjadi kesalahan saat memproses operasi spasial ST_Difference.'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ------------------------------------------------------------------------------------
-- 3. FUNGSI ROLLBACK: rollback_lp2b_spatial_difference
-- ------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rollback_lp2b_spatial_difference(
    p_permohonan_id TEXT,
    p_admin_id TEXT DEFAULT 'admin_pertanian'
)
RETURNS JSON AS $$
DECLARE
    v_audit RECORD;
    v_restored_count INT := 0;
    v_restored_geom GEOMETRY;
BEGIN
    FOR v_audit IN 
        SELECT * FROM public.lp2b_clearance_audit 
        WHERE permohonan_id = p_permohonan_id
    LOOP
        -- Gabungkan kembali potongan sawah dengan poligon sawah asal (ST_Union)
        IF EXISTS (SELECT 1 FROM public.gis_sawah WHERE id::text = v_audit.sawah_id) THEN
            UPDATE public.gis_sawah
            SET 
                geom = ST_Multi(ST_CollectionExtract(ST_MakeValid(ST_Union(geom, v_audit.cut_polygon_geom)), 3)),
                luas_m2 = v_audit.original_area_m2
            WHERE id::text = v_audit.sawah_id;
        ELSE
            -- Jika poligon sawah sebelumnya sempat terhapus total
            INSERT INTO public.gis_sawah (
                id,
                geom,
                luas_m2,
                name
            ) VALUES (
                v_audit.sawah_id,
                ST_Multi(v_audit.cut_polygon_geom),
                v_audit.original_area_m2,
                'Sawah LP2B (Restored)'
            );
        END IF;

        v_restored_count := v_restored_count + 1;
    END LOOP;

    -- Hapus entri audit karena sudah di-rollback
    DELETE FROM public.lp2b_clearance_audit WHERE permohonan_id = p_permohonan_id;

    RETURN json_build_object(
        'success', true,
        'permohonan_id', p_permohonan_id,
        'restored_count', v_restored_count,
        'message', format('Berhasil memulihkan %s poligon sawah LP2B.', v_restored_count)
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
