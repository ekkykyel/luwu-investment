-- Migration: Add Performance Indexes & Update RBAC Roles for PUPTR and Pertanian
-- Description: Updates profiles role mappings and creates indexes on profiles (email, role, nik) and investments (nib, plot_number, status, clearance statuses, GIST spatial).

-- 1. Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Update RBAC Roles in profiles table
UPDATE public.profiles 
SET role = 'admin_puptr', full_name = 'Admin Dinas PUPTR' 
WHERE LOWER(email) = 'puptr@luwukab.go.id';

UPDATE public.profiles 
SET role = 'admin_pertanian', full_name = 'Admin Dinas Pertanian' 
WHERE LOWER(email) = 'pertanian@luwukab.go.id';

-- 3. Ensure required columns exist on public.investments
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS nib TEXT;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS plot_number TEXT;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS certificate_number TEXT;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS pertanian_status TEXT;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS pertanian_rejection_notes TEXT;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS berita_acara_num TEXT;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS override_justification TEXT;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS geom GEOMETRY;

-- 4. Profiles Table Indexes (RBAC Role, Email, NIK)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_nik ON public.profiles (nik);

-- 5. Investments Table Indexes (NIB Master-Key Lookups & Clearance Statuses)
CREATE INDEX IF NOT EXISTS idx_investments_nib ON public.investments (nib);
CREATE INDEX IF NOT EXISTS idx_investments_plot_number ON public.investments (plot_number);
CREATE INDEX IF NOT EXISTS idx_investments_certificate_number ON public.investments (certificate_number);
CREATE INDEX IF NOT EXISTS idx_investments_status ON public.investments (status);
CREATE INDEX IF NOT EXISTS idx_investments_pertanian_status ON public.investments (pertanian_status);

-- 6. GIS Potensi Investasi Indexes
CREATE INDEX IF NOT EXISTS idx_gis_potensi_investasi_nib ON public.gis_potensi_investasi (nib);
CREATE INDEX IF NOT EXISTS idx_gis_potensi_investasi_nomor_sertifikat ON public.gis_potensi_investasi (nomor_sertifikat);
CREATE INDEX IF NOT EXISTS idx_gis_potensi_investasi_status ON public.gis_potensi_investasi (status);
CREATE INDEX IF NOT EXISTS idx_gis_potensi_investasi_status_pkkpr ON public.gis_potensi_investasi (status_pkkpr);

-- 7. PostGIS GIST Spatial Indexes
CREATE INDEX IF NOT EXISTS idx_investments_geom_gist ON public.investments USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_gis_potensi_investasi_geom_gist ON public.gis_potensi_investasi USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_gis_infrastruktur_geom_gist ON public.gis_infrastruktur USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_gis_zonasi_geom_gist ON public.gis_zonasi USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_gis_sawah_geom_gist ON public.gis_sawah USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_gis_jalan_geom_gist ON public.gis_jalan USING GIST (geom);
