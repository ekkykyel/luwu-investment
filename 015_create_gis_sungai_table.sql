-- Migration: Create Spatial Table public.gis_sungai with PostGIS GIST Index
-- Description: Maps river networks, ordo sungai, and river border buffer zones (Garis Sempadan Sungai) for PBG/PKKPR validation.

-- 1. Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Create public.gis_sungai table
CREATE TABLE IF NOT EXISTS public.gis_sungai (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_sungai TEXT,
  ordo_sungai TEXT,
  lebar_sempadan INTEGER DEFAULT 15,
  geom GEOMETRY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create spatial GIST index on geom column for fast spatial intersection queries
CREATE INDEX IF NOT EXISTS idx_gis_sungai_geom_gist ON public.gis_sungai USING GIST (geom);

-- 4. Enable Row Level Security (RLS) and grant public read access
ALTER TABLE public.gis_sungai ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'gis_sungai' AND policyname = 'Allow public read access to gis_sungai'
  ) THEN
    CREATE POLICY "Allow public read access to gis_sungai" ON public.gis_sungai
      FOR SELECT USING (true);
  END IF;
END $$;
