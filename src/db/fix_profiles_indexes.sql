-- Fix for Supabase profiles table query performance & bottleneck prevention
-- Run this in Supabase SQL Editor if full table scans occur on profiles table

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_nik ON public.profiles (nik);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
