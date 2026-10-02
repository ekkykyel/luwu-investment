-- ====================================================================================
-- MIGRASI 018: MASTER SINKRONISASI OTOMATIS & INTEGRASI DATABASE SUPABASE
-- PEMKAB LUWU - SISTEM INFORMASI POTENSI & PERIZINAN INVESTASI TERPADU
-- ====================================================================================

-- ------------------------------------------------------------------------------------
-- 0. PASTIKAN KOLOM PENDUKUNG TERSEDIA PADA TABEL 'investments'
-- ------------------------------------------------------------------------------------
-- Menambahkan kolom secara aman jika belum ada (tidak merusak/menghapus data lama)
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS area_ha numeric DEFAULT 0;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS investment_value numeric DEFAULT 0;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS land_status text DEFAULT 'Sertifikat Hak Milik';
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS status text DEFAULT 'Published';
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS contact_pic text DEFAULT 'DPMPTSP Luwu';
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS phone_number text DEFAULT '-';
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS photo_url text DEFAULT '';
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ------------------------------------------------------------------------------------
-- 1. TRIGGER SINKRONISASI OTOMATIS: INVESTMENTS -> GIS_POTENSI_INVESTASI
-- ------------------------------------------------------------------------------------
-- Memastikan setiap kali data diinput/diedit di 'investments', geometri PostGIS
-- dan atribut spasial di 'gis_potensi_investasi' otomatis ter-update secara konsisten.

CREATE OR REPLACE FUNCTION public.trg_sync_investments_to_gis_potensi()
RETURNS TRIGGER AS $$
DECLARE
  v_geom geometry := NULL;
  v_slug text;
BEGIN
  -- Generate Slug otomatis dari nama proyek jika belum ada
  v_slug := LOWER(REGEXP_REPLACE(COALESCE(NEW.name, 'potensi-investasi'), '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := TRIM(BOTH '-' FROM v_slug);

  -- Hitung Point Geometri PostGIS jika koordinat latitude & longitude tersedia
  IF NEW.longitude IS NOT NULL AND NEW.latitude IS NOT NULL 
     AND NEW.longitude != 0 AND NEW.latitude != 0 THEN
    v_geom := ST_SetSRID(ST_MakePoint(NEW.longitude::float8, NEW.latitude::float8), 4326);
  END IF;

  -- Upsert ke tabel gis_potensi_investasi
  INSERT INTO public.gis_potensi_investasi (
    id,
    nama_potensi,
    slug,
    sektor_utama,
    sub_sektor,
    deskripsi_singkat,
    jenis_komoditas,
    geom
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.name, 'Potensi Investasi'),
    v_slug,
    COALESCE(NEW.sector, 'Lainnya'),
    COALESCE(NEW.sub_sector, ''),
    COALESCE(NEW.description, 'Potensi investasi di Kabupaten Luwu'),
    COALESCE(NEW.sector, ''),
    v_geom
  )
  ON CONFLICT (id) DO UPDATE SET
    nama_potensi = EXCLUDED.nama_potensi,
    slug = EXCLUDED.slug,
    sektor_utama = EXCLUDED.sektor_utama,
    sub_sektor = EXCLUDED.sub_sektor,
    deskripsi_singkat = COALESCE(EXCLUDED.deskripsi_singkat, gis_potensi_investasi.deskripsi_singkat),
    geom = COALESCE(EXCLUDED.geom, gis_potensi_investasi.geom);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang Trigger pada tabel 'investments'
DROP TRIGGER IF EXISTS trg_auto_sync_investments_to_gis ON public.investments;
CREATE TRIGGER trg_auto_sync_investments_to_gis
AFTER INSERT OR UPDATE ON public.investments
FOR EACH ROW EXECUTE FUNCTION public.trg_sync_investments_to_gis_potensi();


-- ------------------------------------------------------------------------------------
-- 2. TRIGGER SINKRONISASI SEBALIKNYA: GIS_POTENSI_INVESTASI -> INVESTMENTS
-- ------------------------------------------------------------------------------------
-- Jika ada analis GIS yang menggeser titik atau mengedit geometri langsung di PostGIS,
-- koordinat latitude & longitude di tabel 'investments' otomatis sinkron seketika.

CREATE OR REPLACE FUNCTION public.trg_sync_gis_potensi_to_investments()
RETURNS TRIGGER AS $$
DECLARE
  v_lat float8 := NULL;
  v_lng float8 := NULL;
BEGIN
  IF NEW.geom IS NOT NULL THEN
    v_lng := ST_X(ST_Centroid(NEW.geom));
    v_lat := ST_Y(ST_Centroid(NEW.geom));
  END IF;

  -- Update koordinat dan deskripsi di tabel investments jika record sudah ada
  UPDATE public.investments
  SET
    latitude = COALESCE(v_lat, latitude),
    longitude = COALESCE(v_lng, longitude),
    name = COALESCE(NEW.nama_potensi, name),
    sector = COALESCE(NEW.sektor_utama, sector),
    sub_sector = COALESCE(NEW.sub_sektor, sub_sector),
    description = COALESCE(NEW.deskripsi_singkat, description)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_sync_gis_to_investments ON public.gis_potensi_investasi;
CREATE TRIGGER trg_auto_sync_gis_to_investments
AFTER UPDATE OF geom, nama_potensi, sektor_utama, sub_sektor, deskripsi_singkat ON public.gis_potensi_investasi
FOR EACH ROW EXECUTE FUNCTION public.trg_sync_gis_potensi_to_investments();


-- ------------------------------------------------------------------------------------
-- 3. SQL VIEW TERPADU: v_investments_complete
-- ------------------------------------------------------------------------------------
-- Menyatukan tabel 'investments', 'gis_potensi_investasi', serta 5 tabel anak
-- (financials, legalities, locations, media_assets, investment_scores) dalam 1 kueri kilat.

CREATE OR REPLACE VIEW public.v_investments_complete AS
SELECT 
  i.id,
  i.name,
  i.sector,
  i.sub_sector,
  i.district_id,
  i.village_id,
  i.latitude,
  i.longitude,
  i.investment_value,
  i.area_ha,
  i.land_status,
  i.status,
  COALESCE(i.description, g.deskripsi_singkat, '') AS description,
  g.deskripsi_singkat,
  i.contact_pic,
  i.phone_number,
  i.photo_url,
  i.created_at,
  i.updated_at,
  -- Konversi Geometri Spasial PostGIS menjadi GeoJSON murni
  CASE 
    WHEN g.geom IS NOT NULL THEN ST_AsGeoJSON(g.geom)::json
    WHEN i.longitude IS NOT NULL AND i.latitude IS NOT NULL 
    THEN json_build_object('type', 'Point', 'coordinates', json_build_array(i.longitude, i.latitude))
    ELSE NULL
  END AS spatial_geometry,
  -- Agregasi Data Finansial
  COALESCE(
    (SELECT json_agg(f) FROM public.financials f WHERE f.project_id::text = i.id::text),
    '[]'::json
  ) AS financials,
  -- Agregasi Legalitas & Tata Ruang
  COALESCE(
    (SELECT json_agg(l) FROM public.legalities l WHERE l.project_id::text = i.id::text),
    '[]'::json
  ) AS legalities,
  -- Agregasi Alamat Detail
  COALESCE(
    (SELECT json_agg(loc) FROM public.locations loc WHERE loc.project_id::text = i.id::text),
    '[]'::json
  ) AS locations,
  -- Agregasi Media (Foto, Video & Dokumen)
  COALESCE(
    (SELECT json_agg(m) FROM public.media_assets m WHERE m.project_id::text = i.id::text),
    '[]'::json
  ) AS media_assets,
  -- Agregasi Skor Investasi AI
  COALESCE(
    (SELECT json_agg(s) FROM public.investment_scores s WHERE s.project_id::text = i.id::text),
    '[]'::json
  ) AS investment_scores
FROM public.investments i
LEFT JOIN public.gis_potensi_investasi g ON g.id::text = i.id::text;


-- ------------------------------------------------------------------------------------
-- 4. AKTIFKAN SUPABASE REALTIME REPLICATION (AMAN DARI DUPLIKASI)
-- ------------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'investments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.investments;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'gis_potensi_investasi'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.gis_potensi_investasi;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'gis_pkkpr'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.gis_pkkpr;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'mpp_queues'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mpp_queues;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'news'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.news;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Catatan Realtime: %', SQLERRM;
END $$;


-- ------------------------------------------------------------------------------------
-- 5. KONSISTENSI DATA PERFORMA INDEXING
-- ------------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_investments_district_id ON public.investments(district_id);
CREATE INDEX IF NOT EXISTS idx_investments_sector ON public.investments(sector);
CREATE INDEX IF NOT EXISTS idx_investments_status ON public.investments(status);

CREATE INDEX IF NOT EXISTS idx_gis_potensi_geom ON public.gis_potensi_investasi USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_gis_pkkpr_geom ON public.gis_pkkpr USING GIST(geom);

CREATE INDEX IF NOT EXISTS idx_financials_project_id ON public.financials(project_id);
CREATE INDEX IF NOT EXISTS idx_legalities_project_id ON public.legalities(project_id);
CREATE INDEX IF NOT EXISTS idx_locations_project_id ON public.locations(project_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_project_id ON public.media_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_investment_scores_project_id ON public.investment_scores(project_id);
