-- ============================================================================
-- GOV-ECOSYSTEM-LUWU: MISSING TABLES MIGRATION (gis_potensi & loi_tickets)
-- Migration: 20260927_create_missing_tables.sql
-- ============================================================================

-- 1. Tabel Potensi GIS Spasial
CREATE TABLE IF NOT EXISTS public.gis_potensi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    kategori VARCHAR(100),
    deskripsi TEXT,
    geometry GEOMETRY(Geometry, 4326),
    geom GEOMETRY(Geometry, 4326),
    properties JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS & Policy for gis_potensi
ALTER TABLE public.gis_potensi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read gis_potensi" ON public.gis_potensi;
CREATE POLICY "Allow public read gis_potensi" 
ON public.gis_potensi 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert update gis_potensi" ON public.gis_potensi;
CREATE POLICY "Allow authenticated insert update gis_potensi" 
ON public.gis_potensi 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 2. Tabel LOI (Letter of Intent) Tickets
CREATE TABLE IF NOT EXISTS public.loi_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_ticket VARCHAR(100) UNIQUE NOT NULL,
    investor_name VARCHAR(255),
    company_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    potensi_id UUID,
    potensi_name VARCHAR(255),
    nilai_investasi NUMERIC,
    sektor VARCHAR(100),
    deskripsi TEXT,
    catatan_investor TEXT,
    status VARCHAR(50) DEFAULT 'SUBMITTED',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for quick lookups
CREATE INDEX IF NOT EXISTS idx_loi_tickets_status ON public.loi_tickets(status);
CREATE INDEX IF NOT EXISTS idx_loi_tickets_email ON public.loi_tickets(email);
CREATE INDEX IF NOT EXISTS idx_loi_tickets_created_at ON public.loi_tickets(created_at DESC);

-- Enable RLS & Policy for loi_tickets
ALTER TABLE public.loi_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read loi_tickets" ON public.loi_tickets;
CREATE POLICY "Allow public read loi_tickets" 
ON public.loi_tickets 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow public insert loi_tickets" ON public.loi_tickets;
CREATE POLICY "Allow public insert loi_tickets" 
ON public.loi_tickets 
FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update loi_tickets" ON public.loi_tickets;
CREATE POLICY "Allow authenticated update loi_tickets" 
ON public.loi_tickets 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Reload PostGREST Schema Cache
NOTIFY pgrst, 'reload schema';
