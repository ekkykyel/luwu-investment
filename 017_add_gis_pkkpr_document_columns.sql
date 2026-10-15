-- Migration: Add document legalitas URLs and setup storage bucket for PKKPR
ALTER TABLE public.gis_pkkpr 
ADD COLUMN IF NOT EXISTS sertifikat_tanah_url TEXT,
ADD COLUMN IF NOT EXISTS surat_pengantar_desa_url TEXT,
ADD COLUMN IF NOT EXISTS berkas_legalitas_gabungan_url TEXT;

-- Create public bucket 'pkkpr_documents' if it does not exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('pkkpr_documents', 'pkkpr_documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for pkkpr_documents bucket
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public Access Read pkkpr_documents'
    ) THEN
        CREATE POLICY "Public Access Read pkkpr_documents"
        ON storage.objects FOR SELECT
        TO public
        USING ( bucket_id = 'pkkpr_documents' );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public Access Insert pkkpr_documents'
    ) THEN
        CREATE POLICY "Public Access Insert pkkpr_documents"
        ON storage.objects FOR INSERT
        TO public
        WITH CHECK ( bucket_id = 'pkkpr_documents' );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Auth Update Access pkkpr_documents'
    ) THEN
        CREATE POLICY "Auth Update Access pkkpr_documents"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING ( bucket_id = 'pkkpr_documents' );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Auth Delete Access pkkpr_documents'
    ) THEN
        CREATE POLICY "Auth Delete Access pkkpr_documents"
        ON storage.objects FOR DELETE
        TO authenticated
        USING ( bucket_id = 'pkkpr_documents' );
    END IF;
END $$;
