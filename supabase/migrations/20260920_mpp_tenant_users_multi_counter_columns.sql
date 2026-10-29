-- Migration: Add multi-counter teller support to mpp_tenant_users
ALTER TABLE public.mpp_tenant_users ADD COLUMN IF NOT EXISTS counter_name VARCHAR(100);
ALTER TABLE public.mpp_tenant_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;
ALTER TABLE public.mpp_tenant_users ADD COLUMN IF NOT EXISTS officer_name VARCHAR(255);
