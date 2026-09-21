-- Migration: Add Dalak Workspace columns to investment_interests
-- Description: Adds tracking columns for field site visits, Satgas coordination, and land owner mediation (Bidang Pengendalian/Dalak).

ALTER TABLE public.investment_interests
ADD COLUMN IF NOT EXISTS jadwal_site_visit TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS laporan_dalak TEXT,
ADD COLUMN IF NOT EXISTS dalak_admin_id UUID REFERENCES auth.users(id);
