-- ============================================================================
-- Migration: 20261027_sync_4bidang_dalak_and_pkkpr_schema.sql
-- Purpose: Synchronize schema columns across the 4 Bidang DPMPTSP workflow
--          (Promosi -> Perencanaan & Data -> Perizinan OSS -> Pengawasan DALAK)
--          and Cross-OPD PKKPR clearance (PUPTR, Pertanian, ATR/BPN).
-- ============================================================================

-- 1. Ensure DALAK field inspection & follow-up columns exist on public.pengaduan
ALTER TABLE IF EXISTS public.pengaduan
  ADD COLUMN IF NOT EXISTS kategori_pengaduan TEXT,
  ADD COLUMN IF NOT EXISTS jadwal_site_visit TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS laporan_dalak TEXT,
  ADD COLUMN IF NOT EXISTS dalak_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW());

-- 2. Ensure Estafet & KYC / DALAK columns exist on public.investment_interests
ALTER TABLE IF EXISTS public.investment_interests
  ADD COLUMN IF NOT EXISTS catatan_admin TEXT,
  ADD COLUMN IF NOT EXISTS jadwal_site_visit TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS laporan_dalak TEXT,
  ADD COLUMN IF NOT EXISTS dalak_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW());

-- 3. Upgrade base table public.pkkpr_permohonan with default PK & SLA/TTE workflow columns
ALTER TABLE IF EXISTS public.pkkpr_permohonan
  ALTER COLUMN id SET DEFAULT (gen_random_uuid())::character varying;

ALTER TABLE IF EXISTS public.pkkpr_permohonan
  ADD COLUMN IF NOT EXISTS status_permohonan CHARACTER VARYING,
  ADD COLUMN IF NOT EXISTS nomor_permohonan CHARACTER VARYING,
  ADD COLUMN IF NOT EXISTS no_pertek_bpn CHARACTER VARYING,
  ADD COLUMN IF NOT EXISTS pertanian_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS puptr_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS catatan_revisi TEXT,
  ADD COLUMN IF NOT EXISTS is_tte_signed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tte_document_url TEXT;

UPDATE public.pkkpr_permohonan
SET status_permohonan = COALESCE(status_permohonan, status_pkkpr)
WHERE status_permohonan IS NULL;

-- 4. Expand auto-updatable view public.gis_pkkpr (preserving exact first 7 columns)
--    Every column maps 1-to-1 to a unique base column in public.pkkpr_permohonan so
--    PostgreSQL & PostgREST natively support SELECT, INSERT, UPDATE, and DELETE.
CREATE OR REPLACE VIEW public.gis_pkkpr AS
SELECT
  id,
  nama_permohonan,
  status_permohonan,
  geom_postgis AS geom,
  geometry_json,
  created_at,
  updated_at,
  jenis_permohonan,
  nib_oss,
  nama_badan_usaha,
  nama_pemohon,
  nik_pemohon,
  no_whatsapp,
  sektor,
  kecamatan,
  desa_kelurahan,
  luas_m2,
  luas_ha,
  nama_berkas_kmz,
  berkas_kmz_url,
  status_pkkpr,
  pertek_puptr_num,
  berita_acara_pertanian_num,
  sk_pkkpr_num,
  catatan_teknis,
  user_id,
  created_by,
  sertifikat_tanah_url,
  surat_pengantar_desa_url,
  berkas_legalitas_gabungan_url,
  jenis_alas_hak,
  file_alas_hak_url,
  jenis_pengajuan_pkkpr,
  kategori_pengajuan,
  file_siteplan_url,
  rencana_luas_bgn,
  status_pertek_bpn,
  no_pertek_bpn,
  catatan_pertek_bpn,
  file_pertek_bpn_url,
  verified_by_bpn,
  verified_at_bpn,
  pertanian_approved_at,
  puptr_approved_at,
  published_at,
  catatan_revisi,
  is_tte_signed,
  tte_document_url,
  nomor_permohonan
FROM public.pkkpr_permohonan;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gis_pkkpr TO anon, authenticated, service_role;

-- Reload PostgREST schema cache automatically so API recognizes new columns immediately
NOTIFY pgrst, 'reload schema';
