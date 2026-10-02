-- Migration: Add kategori_pengaduan to public.pengaduan
-- Description: Adds a categorized column for public complaints/grievances to make sorting and triage enterprise-grade.

ALTER TABLE public.pengaduan 
ADD COLUMN IF NOT EXISTS kategori_pengaduan TEXT;
