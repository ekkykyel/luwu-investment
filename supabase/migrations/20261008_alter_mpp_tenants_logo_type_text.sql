-- ==============================================================================
-- MIGRASI SKEMA DATABASE MPP: UBAH TIPE DATA LOGO MENJADI TEXT
-- Mengatasi issue 'too long type character (500)' pada penyimpanan link logo/gambar
-- ==============================================================================

ALTER TABLE IF EXISTS public.mpp_tenants 
  ALTER COLUMN logo TYPE TEXT;

-- Pastikan kolom foto pada layanan dan fasilitas juga bertipe TEXT
ALTER TABLE IF EXISTS public.mpp_services 
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

ALTER TABLE IF EXISTS public.mpp_facilities 
  ALTER COLUMN image_url TYPE TEXT;

COMMENT ON COLUMN public.mpp_tenants.logo IS 'Public URL atau storage reference logo resmi gerai instansi (TEXT type)';
