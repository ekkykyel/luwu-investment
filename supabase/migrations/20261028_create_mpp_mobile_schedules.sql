-- Migration: Create real table public.mpp_mobile_schedules for MPP Simpurusiang
-- Purpose: Store dynamic Mobile Public Service (Mobil Pelayanan Keliling & Gerai Hub Kecamatan) schedules
-- Doctrine: Zero Dummy Policy (no fictitious seed rows; managed strictly by Admin MPP via PortalMppManagement)

CREATE TABLE IF NOT EXISTS public.mpp_mobile_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kecamatan text NOT NULL,
  lokasi text NOT NULL,
  hari_operasional text NOT NULL,
  jam_operasional text NOT NULL,
  layanan_tersedia text[] NOT NULL DEFAULT '{}'::text[],
  kuota_harian integer NOT NULL DEFAULT 50,
  penanggung_jawab text DEFAULT NULL,
  kontak_petugas text DEFAULT NULL,
  catatan_warga text DEFAULT NULL,
  is_active boolean NOT NULL DEFAULT true,
  urutan integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mpp_mobile_schedules_active_order
  ON public.mpp_mobile_schedules (is_active, urutan ASC, kecamatan ASC);

CREATE OR REPLACE FUNCTION public.trg_set_mpp_mobile_schedules_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_mpp_mobile_schedules_updated_at ON public.mpp_mobile_schedules;
CREATE TRIGGER set_mpp_mobile_schedules_updated_at
  BEFORE UPDATE ON public.mpp_mobile_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_set_mpp_mobile_schedules_updated_at();

ALTER TABLE public.mpp_mobile_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read mpp_mobile_schedules" ON public.mpp_mobile_schedules;
CREATE POLICY "Public can read mpp_mobile_schedules"
  ON public.mpp_mobile_schedules
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin and service can manage mpp_mobile_schedules" ON public.mpp_mobile_schedules;
CREATE POLICY "Admin and service can manage mpp_mobile_schedules"
  ON public.mpp_mobile_schedules
  FOR ALL
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mpp_mobile_schedules TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
