-- Migration: Add ESG Compliance and Audit Trail columns to investments table
-- Description: Adds tracking columns for ESG environmental risk, spatial intersection layer ID, spatial overrides, justification, authorized user, and local labor commitment.

ALTER TABLE public.investments
ADD COLUMN IF NOT EXISTS esg_environmental_risk TEXT,
ADD COLUMN IF NOT EXISTS intersected_layer_id TEXT,
ADD COLUMN IF NOT EXISTS is_spatial_override BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS override_document_ref TEXT,
ADD COLUMN IF NOT EXISTS override_justification TEXT,
ADD COLUMN IF NOT EXISTS override_by_user UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS komitmen_tenaga_lokal INTEGER DEFAULT 0;
