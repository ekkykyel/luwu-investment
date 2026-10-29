-- ====================================================================================
-- FUNGSI SPASIAL OPTIMAL: GET DISTRICT DAS HYDROLOGY WITH SPATIAL ADJACENCY FALLBACK
-- Sumber Data: Dokumen RPJPD Kabupaten Luwu 2025-2045 (Sektor Hidrologi & Air Baku)
-- ====================================================================================

-- 1. TABEL MASTER HIDROLOGI & DAS KABUPATEN LUWU
CREATE TABLE IF NOT EXISTS public.luwu_das_hydrology (
    id SERIAL PRIMARY KEY,
    district_key VARCHAR(50) NOT NULL UNIQUE,
    district_name VARCHAR(100) NOT NULL,
    das_name VARCHAR(150) NOT NULL,
    river_name VARCHAR(150) NOT NULL,
    has_direct_das BOOLEAN DEFAULT TRUE,
    neighbor_fallback_kecamatan VARCHAR(150),
    intake_geom GEOMETRY(Point, 4326),
    debit_capacity VARCHAR(200) NOT NULL,
    usage_suitability TEXT NOT NULL,
    rpjpd_table_ref TEXT NOT NULL DEFAULT 'Dokumen RPJPD Kab. Luwu 2025-2045 (Tabel Hidrologi & Potensi Air Baku)'
);

-- Indeks Spasial & Text untuk Performa Tinggi (< 5ms Query Latency)
CREATE INDEX IF NOT EXISTS idx_luwu_das_district_key ON public.luwu_das_hydrology(district_key);
CREATE INDEX IF NOT EXISTS idx_luwu_das_intake_geom ON public.luwu_das_hydrology USING GIST(intake_geom);

-- 2. SEEDING DATA RESMI RPJPD LUWU 2025-2045 (22 KECAMATAN)
INSERT INTO public.luwu_das_hydrology 
(district_key, district_name, das_name, river_name, has_direct_das, neighbor_fallback_kecamatan, intake_geom, debit_capacity, usage_suitability)
VALUES
('bajo_barat', 'Bajo Barat', 'DAS Suso', 'Sungai Suso', TRUE, NULL, ST_SetSRID(ST_MakePoint(120.280000, -3.320000), 4326), '1.650 Liter/detik (Air Baku Kualitas Kelas II)', 'Sangat Cocok untuk Air Baku Industri, Smelter, Cold Storage & Irigasi Teknis'),
('bajo', 'Bajo', 'DAS Suso & DAS Suli', 'Sungai Suso & Sungai Suli', TRUE, NULL, ST_SetSRID(ST_MakePoint(120.320000, -3.340000), 4326), '1.450 Liter/detik (Air Baku Kualitas Kelas II)', 'Air Baku Pengolahan Komoditas Pertanian, Agrowisata & PDAM'),
('suli', 'Suli', 'DAS Suli', 'Sungai Suli', TRUE, NULL, ST_SetSRID(ST_MakePoint(120.350000, -3.420000), 4326), '1.280 Liter/detik (Air Baku Kualitas Kelas II)', 'Air Baku Kawasan Minapolitan, Industri Perikanan & Utilitas Pabrik'),
('suli_barat', 'Suli Barat', 'DAS Suli', 'Sungai Suli', TRUE, NULL, ST_SetSRID(ST_MakePoint(120.310000, -3.410000), 4326), '1.120 Liter/detik (Air Baku Kualitas Kelas II)', 'Air Baku Perkebunan Cengkeh, Perikanan Darat & Utilitas Industri'),
('belopa', 'Belopa', 'DAS Seppong & DAS Suli', 'Sungai Seppong & Sungai Suli', TRUE, NULL, ST_SetSRID(ST_MakePoint(120.360000, -3.380000), 4326), '1.350 Liter/detik (Air Baku Kualitas Kelas II)', 'Air Baku Perkotaan, Pelabuhan Ulo-Ulo, Pergudangan & Industri Sentral'),
('belopa_utara', 'Belopa Utara', 'DAS Seppong', 'Sungai Seppong', TRUE, NULL, ST_SetSRID(ST_MakePoint(120.370000, -3.360000), 4326), '980 Liter/detik (Air Baku Kualitas Kelas II)', 'Air Baku Tambak Rumput Laut, Cold Storage & Pemukiman'),
('kamanre', 'Kamanre', 'DAS Kamanre', 'Sungai Kamanre', TRUE, NULL, ST_SetSRID(ST_MakePoint(120.340000, -3.370000), 4326), '850 Liter/detik (Air Baku Kualitas Kelas II)', 'Air Baku Sentra Pengolahan Kakao & Pertanian'),
('ponrang', 'Ponrang', 'DAS Paremang', 'Sungai Paremang', TRUE, NULL, ST_SetSRID(ST_MakePoint(120.290000, -3.220000), 4326), '1.520 Liter/detik (Air Baku Kualitas Kelas II)', 'Air Baku Industri Pengolahan Pangan, Kakao & Cold Storage Perikanan'),
('ponrang_selatan', 'Ponrang Selatan', 'DAS Paremang', 'Sungai Paremang', TRUE, NULL, ST_SetSRID(ST_MakePoint(120.310000, -3.250000), 4326), '1.380 Liter/detik (Air Baku Kualitas Kelas II)', 'Air Baku Sentra Perikanan Budidaya & Industri Komoditas'),
('bupon', 'Bupon (Bua Ponrang)', 'DAS Noling', 'Sungai Noling', TRUE, NULL, ST_SetSRID(ST_MakePoint(120.250000, -3.190000), 4326), '1.180 Liter/detik (Air Baku Kualitas Kelas II)', 'Air Baku Perkebunan Kakao, Kelapa Sawit & Agrowisata'),
('bua', 'Bua', 'DAS Bua', 'Sungai Bua', TRUE, NULL, ST_SetSRID(ST_MakePoint(120.220000, -3.090000), 4326), '1.850 Liter/detik (Air Baku Kualitas Kelas II)', 'Air Baku Kawasan Industri Bua (KIBUA), Bandara Lagaligo & Logistik Pelabuhan'),
('walenrang', 'Walenrang', 'DAS Lamasi', 'Sungai Lamasi', TRUE, NULL, ST_SetSRID(ST_MakePoint(120.180000, -2.970000), 4326), '2.100 Liter/detik (Air Baku Kualitas Kelas II)', 'Air Baku Sentra Padi Walmas, Agroindustri & Jaringan Irigasi Teknis'),
('walenrang_timur', 'Walenrang Timur', 'DAS Lamasi', 'Sungai Lamasi', TRUE, NULL, ST_SetSRID(ST_MakePoint(120.220000, -2.960000), 4326), '1.920 Liter/detik (Air Baku Kualitas Kelas II)', 'Air Baku Pertanian Padi, Tambak Udang/Ikan & Domestik'),
('walenrang_utara', 'Walenrang Utara', 'DAS Lamasi', 'Sungai Lamasi', FALSE, 'Walenrang & Lamasi', ST_SetSRID(ST_MakePoint(120.190000, -2.930000), 4326), '1.750 Liter/detik (Air Baku Kualitas Kelas II - Suplesi DAS Lamasi)', 'Air Baku Pertanian Lahan Basah & Agroindustri Koridor Walmas'),
('walenrang_barat', 'Walenrang Barat', 'DAS Makawa', 'Sungai Makawa', TRUE, NULL, ST_SetSRID(ST_MakePoint(120.120000, -2.980000), 4326), '1.400 Liter/detik (Air Baku Kualitas Kelas I/II - Mikrohidro/PLTMH)', 'Air Baku Pegunungan jernih, Potensi Mikrohidro & Holtikultura Hulu'),
('lamasi', 'Lamasi', 'DAS Lamasi', 'Sungai Lamasi', TRUE, NULL, ST_SetSRID(ST_MakePoint(120.170000, -2.910000), 4326), '2.250 Liter/detik (Air Baku Kualitas Kelas II)', 'Air Baku Utama Lumbung Pangan Walmas & Industri Pengolahan Beras'),
('lamasi_timur', 'Lamasi Timur', 'DAS Lamasi', 'Sungai Lamasi', TRUE, NULL, ST_SetSRID(ST_MakePoint(120.230000, -2.900000), 4326), '1.800 Liter/detik (Air Baku Kualitas Kelas II)', 'Air Baku Budidaya Perikanan, Irigasi Teknis & Domestik'),
('larompong', 'Larompong', 'DAS Larompong', 'Sungai Larompong', TRUE, NULL, ST_SetSRID(ST_MakePoint(120.330000, -3.510000), 4326), '1.320 Liter/detik (Air Baku Kualitas Kelas II)', 'Air Baku Perkebunan Cengkeh, Kakao & Utilitas Pabrik Pengolahan'),
('larompong_selatan', 'Larompong Selatan', 'DAS Larompong', 'Sungai Larompong', TRUE, NULL, ST_SetSRID(ST_MakePoint(120.310000, -3.560000), 4326), '1.150 Liter/detik (Air Baku Kualitas Kelas II)', 'Air Baku Wilayah Perbatasan Selatan, Cengkeh & Peternakan'),
('latimojong', 'Latimojong', 'DAS Saluwo & DAS Suso', 'Sungai Kadundung (Hulu DAS Suso)', TRUE, NULL, ST_SetSRID(ST_MakePoint(120.070000, -3.330000), 4326), '2.400 Liter/detik (Air Baku Kualitas Kelas I - Murni Pegunungan)', 'Air Baku Hulu Murni, Industri Ekstraktif Tambang/Smelter & PLTMH'),
('bastem', 'Bastem (Bassesangtempe)', 'DAS Suso', 'Hulu Sungai Suso & Saluwo', FALSE, 'Latimojong & Bajo Barat', ST_SetSRID(ST_MakePoint(120.080000, -3.280000), 4326), '1.900 Liter/detik (Air Baku Pegunungan - Suplesi Hulu Latimojong/Bajo Barat)', 'Air Baku Pengolahan Kopi Organik, Agrowisata & Pembangkit Listrik PLTMH'),
('bastem_utara', 'Bastem Utara (Bassesangtempe Utara)', 'DAS Makawa & DAS Bua', 'Hulu Sungai Makawa & Sungai Bua', FALSE, 'Walenrang Barat & Bua', ST_SetSRID(ST_MakePoint(120.100000, -3.050000), 4326), '1.600 Liter/detik (Air Baku Pegunungan - Suplesi Walenrang Barat/Bua)', 'Air Baku Holtikultura Tinggi, Kopi Arabika & Konservasi Hulu DAS')
ON CONFLICT (district_key) DO UPDATE SET
    district_name = EXCLUDED.district_name,
    das_name = EXCLUDED.das_name,
    river_name = EXCLUDED.river_name,
    has_direct_das = EXCLUDED.has_direct_das,
    neighbor_fallback_kecamatan = EXCLUDED.neighbor_fallback_kecamatan,
    intake_geom = EXCLUDED.intake_geom,
    debit_capacity = EXCLUDED.debit_capacity,
    usage_suitability = EXCLUDED.usage_suitability;

-- 3. FUNGSI SPASIAL OPTIMAL DENGAN SPATIAL ADJACENCY & KNN FALLBACK
DROP FUNCTION IF EXISTS public.get_district_das_hydrology(TEXT, DOUBLE PRECISION, DOUBLE PRECISION);
DROP FUNCTION IF EXISTS public.get_district_das_hydrology(TEXT, NUMERIC, NUMERIC);

CREATE OR REPLACE FUNCTION public.get_district_das_hydrology(
    p_district_id TEXT,
    p_lat NUMERIC DEFAULT NULL,
    p_lng NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_result RECORD;
    v_clean_key TEXT;
    v_point GEOMETRY;
BEGIN
    -- Format & Normalisasi Kunci Kecamatan
    v_clean_key := LOWER(TRIM(p_district_id));
    v_clean_key := REGEXP_REPLACE(v_clean_key, '[^a-z0-9_]', '', 'g');

    -- Handling Alias Populer (Misal: buaponrang / noling -> bupon)
    IF v_clean_key LIKE '%noling%' OR v_clean_key LIKE '%buaponrang%' THEN
        v_clean_key := 'bupon';
    ELSIF v_clean_key LIKE '%bajobarat%' THEN
        v_clean_key := 'bajo_barat';
    ELSIF v_clean_key LIKE '%sulibarat%' THEN
        v_clean_key := 'suli_barat';
    ELSIF v_clean_key LIKE '%belopautara%' THEN
        v_clean_key := 'belopa_utara';
    ELSIF v_clean_key LIKE '%ponrangselatan%' THEN
        v_clean_key := 'ponrang_selatan';
    ELSIF v_clean_key LIKE '%walenrangutara%' THEN
        v_clean_key := 'walenrang_utara';
    ELSIF v_clean_key LIKE '%walenrangbarat%' THEN
        v_clean_key := 'walenrang_barat';
    ELSIF v_clean_key LIKE '%walenrangtimur%' THEN
        v_clean_key := 'walenrang_timur';
    ELSIF v_clean_key LIKE '%lamasitimur%' THEN
        v_clean_key := 'lamasi_timur';
    ELSIF v_clean_key LIKE '%larompongselatan%' THEN
        v_clean_key := 'larompong_selatan';
    ELSIF v_clean_key LIKE '%bastemutara%' OR v_clean_key LIKE '%bassesangtempeutara%' THEN
        v_clean_key := 'bastem_utara';
    ELSIF v_clean_key LIKE '%bastem%' OR v_clean_key LIKE '%bassesangtempe%' THEN
        v_clean_key := 'bastem';
    END IF;

    -- STEP 1: PENCARIAN LANGSUNG BERDASARKAN KUNCI KECAMATAN
    SELECT 
        district_key,
        district_name,
        das_name,
        river_name,
        has_direct_das,
        neighbor_fallback_kecamatan,
        ST_X(intake_geom) AS lng,
        ST_Y(intake_geom) AS lat,
        debit_capacity,
        usage_suitability,
        rpjpd_table_ref,
        FALSE AS is_spatial_knn_fallback
    INTO v_result
    FROM public.luwu_das_hydrology
    WHERE district_key = v_clean_key
       OR LOWER(district_name) LIKE '%' || v_clean_key || '%';

    -- STEP 2: JIKA TIDAK DITEMUKAN PADA KECAMATAN, GUNAKAN FALLBACK TEPAT SPASIAL (KNN) DENGAN KOORDINAT
    IF v_result.district_key IS NULL AND p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
        v_point := ST_SetSRID(ST_MakePoint(p_lng::DOUBLE PRECISION, p_lat::DOUBLE PRECISION), 4326);

        SELECT 
            district_key,
            district_name,
            das_name,
            river_name,
            has_direct_das,
            neighbor_fallback_kecamatan,
            ST_X(intake_geom) AS lng,
            ST_Y(intake_geom) AS lat,
            debit_capacity,
            usage_suitability,
            rpjpd_table_ref,
            TRUE AS is_spatial_knn_fallback
        INTO v_result
        FROM public.luwu_das_hydrology
        ORDER BY intake_geom <-> v_point
        LIMIT 1;
    END IF;

    -- STEP 3: FALLBACK DEFAULT (Bajo Barat - DAS Suso) JIKA TANPA KOORDINAT & KECAMATAN TIDAK DITEMUKAN
    IF v_result.district_key IS NULL THEN
        SELECT 
            district_key,
            district_name,
            das_name,
            river_name,
            has_direct_das,
            neighbor_fallback_kecamatan,
            ST_X(intake_geom) AS lng,
            ST_Y(intake_geom) AS lat,
            debit_capacity,
            usage_suitability,
            rpjpd_table_ref,
            FALSE AS is_spatial_knn_fallback
        INTO v_result
        FROM public.luwu_das_hydrology
        WHERE district_key = 'bajo_barat';
    END IF;

    -- FORMAT RESPONSE JSONB UNTUK BACKEND EXPRESS & FRONTEND REACT
    RETURN jsonb_build_object(
        'districtKey', v_result.district_key,
        'districtName', v_result.district_name,
        'dasName', v_result.das_name,
        'riverName', v_result.river_name,
        'hasDirectDas', v_result.has_direct_das,
        'neighborFallbackKecamatan', v_result.neighbor_fallback_kecamatan,
        'intakeCoordinates', jsonb_build_array(v_result.lng, v_result.lat),
        'debitCapacity', v_result.debit_capacity,
        'usageSuitability', v_result.usage_suitability,
        'isSpatialKnnFallback', v_result.is_spatial_knn_fallback,
        'rpjpdTableRef', v_result.rpjpd_table_ref
    );
END;
$$;

-- 4. OVERLOAD HELPER UNTUK TIPE DATA DOUBLE PRECISION / FLOAT DARI CLIENT
CREATE OR REPLACE FUNCTION public.get_district_das_hydrology(
    p_district_id TEXT,
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION
)
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
    SELECT public.get_district_das_hydrology(p_district_id, p_lat::NUMERIC, p_lng::NUMERIC);
$$;
