-- Migration 025: Add SLA timestamps and revision notes to gis_pkkpr
ALTER TABLE public.gis_pkkpr
ADD COLUMN IF NOT EXISTS pertanian_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS puptr_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS catatan_revisi TEXT;

-- Also add to investments table for fallback tracking
ALTER TABLE public.investments
ADD COLUMN IF NOT EXISTS pertanian_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS puptr_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS catatan_revisi TEXT;
