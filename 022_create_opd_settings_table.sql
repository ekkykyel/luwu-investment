-- ========================================================================
-- MIGRATION 022: Create opd_settings Table for OPD Configuration & BAP Data
-- Target Table: opd_settings
-- Pemerintah Kabupaten Luwu
-- ========================================================================

CREATE TABLE IF NOT EXISTS public.opd_settings (
    opd_key VARCHAR(100) PRIMARY KEY,
    data_bap_lp2b JSONB,
    settings JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on opd_key
CREATE INDEX IF NOT EXISTS idx_opd_settings_key ON public.opd_settings (opd_key);

-- Enable Row Level Security
ALTER TABLE public.opd_settings ENABLE ROW LEVEL SECURITY;

-- Allow public / authenticated read & write
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'opd_settings' AND policyname = 'Allow public read opd_settings'
    ) THEN
        CREATE POLICY "Allow public read opd_settings" 
        ON public.opd_settings FOR SELECT 
        TO public 
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'opd_settings' AND policyname = 'Allow public all opd_settings'
    ) THEN
        CREATE POLICY "Allow public all opd_settings" 
        ON public.opd_settings FOR ALL 
        TO public 
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;
