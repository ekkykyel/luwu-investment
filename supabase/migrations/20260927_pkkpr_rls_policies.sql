-- ============================================================================
-- GOV-ECOSYSTEM-LUWU: SUPABASE ROW LEVEL SECURITY (RLS) & RBAC POLICIES
-- Migration: 20260927_pkkpr_rls_policies.sql
-- Single Source of Truth for PKKPR Spatial Licensing & Workflow Security
-- ============================================================================

-- 1. Buat Tabel pkkpr_permohonan jika belum ada (Single Source of Truth Workflow)
CREATE TABLE IF NOT EXISTS public.pkkpr_permohonan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_permohonan TEXT UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    pemohon_name TEXT NOT NULL,
    pemohon_email TEXT,
    pemohon_phone TEXT,
    nama_kegiatan TEXT NOT NULL,
    sektor_kegiatan TEXT,
    desa_name TEXT,
    kecamatan_name TEXT,
    status_permohonan TEXT NOT NULL DEFAULT 'REVIEW_PUPTR' CHECK (
        status_permohonan IN (
            'REVIEW_PUPTR',
            'ESCALATED_PERTANIAN',
            'REJECTED_PERTANIAN',
            'PERTEK_PERTANIAN',
            'REJECTED_FINAL',
            'PROSES_OSS',
            'IZIN_TERBIT'
        )
    ),
    luas_m2 NUMERIC,
    luas_ha NUMERIC,
    geom JSONB,
    geometry_json JSONB,
    koordinat_poligon JSONB,
    berita_acara_pertanian_num TEXT,
    surat_rekomendasi_pertanian_num TEXT,
    bap_penolakan_url TEXT,
    bap_pertek_url TEXT,
    pertek_puptr_num TEXT,
    bap_ktr_data JSONB,
    sk_pkkpr_num TEXT,
    tte_document_url TEXT,
    is_tte_signed BOOLEAN DEFAULT FALSE,
    catatan_teknis TEXT,
    override_justification TEXT,
    updated_by TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexing untuk akselerasi query dan filter RLS
CREATE INDEX IF NOT EXISTS idx_pkkpr_status ON public.pkkpr_permohonan(status_permohonan);
CREATE INDEX IF NOT EXISTS idx_pkkpr_user_id ON public.pkkpr_permohonan(user_id);
CREATE INDEX IF NOT EXISTS idx_pkkpr_created_at ON public.pkkpr_permohonan(created_at DESC);

-- 2. Buat Tabel pkkpr_audit_logs untuk Rekam Jejak Transparan & Anti-Manipulasi
CREATE TABLE IF NOT EXISTS public.pkkpr_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permohonan_id UUID NOT NULL,
    nomor_permohonan TEXT,
    old_status TEXT,
    new_status TEXT NOT NULL,
    action_type TEXT NOT NULL DEFAULT 'STATUS_CHANGE',
    changed_by TEXT,
    changed_by_user_id TEXT,
    changed_by_role TEXT,
    changed_by_email TEXT,
    notes TEXT,
    metadata JSONB,
    timestamp TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pkkpr_audit_permohonan_id ON public.pkkpr_audit_logs(permohonan_id);
CREATE INDEX IF NOT EXISTS idx_pkkpr_audit_timestamp ON public.pkkpr_audit_logs(timestamp DESC);

-- ============================================================================
-- 3. FUNGSI TRIGGER AUDIT OTOMATIS (AUDIT LOG TRIGGER)
-- Mencatat setiap transisi status_permohonan secara otomatis ke pkkpr_audit_logs
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_pkkpr_status_change()
RETURNS TRIGGER AS $$
DECLARE
    current_user_jwt_role TEXT;
    current_user_jwt_email TEXT;
    current_actor_id TEXT;
    action_notes TEXT;
BEGIN
    -- Ekstraksi metadata pengguna dari JWT Supabase Auth saat ini
    current_user_jwt_role := COALESCE(
        current_setting('request.jwt.claims', true)::jsonb ->> 'role',
        current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role',
        current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role',
        'SYSTEM_WORKFLOW'
    );
    
    current_user_jwt_email := COALESCE(
        current_setting('request.jwt.claims', true)::jsonb ->> 'email',
        current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'email',
        'system@luwukab.go.id'
    );
    
    current_actor_id := COALESCE(
        auth.uid()::text,
        NEW.updated_by,
        'SYSTEM_DAEMON'
    );

    -- Catat INSERT baru
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.pkkpr_audit_logs (
            permohonan_id,
            nomor_permohonan,
            old_status,
            new_status,
            action_type,
            changed_by,
            changed_by_user_id,
            changed_by_role,
            changed_by_email,
            notes,
            metadata,
            timestamp
        ) VALUES (
            NEW.id,
            NEW.nomor_permohonan,
            NULL,
            NEW.status_permohonan,
            'PERMOHONAN_MASUK',
            current_actor_id,
            current_actor_id,
            current_user_jwt_role,
            current_user_jwt_email,
            COALESCE(NEW.catatan_teknis, 'Inisiasi permohonan baru'),
            jsonb_build_object('luas_m2', NEW.luas_m2, 'desa', NEW.desa_name, 'kecamatan', NEW.kecamatan_name),
            TIMEZONE('utc'::text, NOW())
        );
    -- Catat UPDATE yang mengubah status_permohonan
    ELSIF (TG_OP = 'UPDATE' AND OLD.status_permohonan IS DISTINCT FROM NEW.status_permohonan) THEN
        action_notes := COALESCE(
            NEW.catatan_teknis, 
            NEW.override_justification, 
            format('Perubahan status dari %s ke %s', OLD.status_permohonan, NEW.status_permohonan)
        );

        INSERT INTO public.pkkpr_audit_logs (
            permohonan_id,
            nomor_permohonan,
            old_status,
            new_status,
            action_type,
            changed_by,
            changed_by_user_id,
            changed_by_role,
            changed_by_email,
            notes,
            metadata,
            timestamp
        ) VALUES (
            NEW.id,
            NEW.nomor_permohonan,
            OLD.status_permohonan,
            NEW.status_permohonan,
            'WORKFLOW_STATUS_TRANSITION',
            current_actor_id,
            current_actor_id,
            current_user_jwt_role,
            current_user_jwt_email,
            action_notes,
            jsonb_build_object(
                'previous_status', OLD.status_permohonan,
                'new_status', NEW.status_permohonan,
                'berita_acara_pertanian', NEW.berita_acara_pertanian_num,
                'pertek_puptr', NEW.pertek_puptr_num,
                'sk_pkkpr', NEW.sk_pkkpr_num,
                'is_tte_signed', NEW.is_tte_signed
            ),
            TIMEZONE('utc'::text, NOW())
        );
    END IF;

    -- Update kolom updated_at otomatis
    NEW.updated_at := TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang Trigger pada Tabel pkkpr_permohonan
DROP TRIGGER IF EXISTS trg_pkkpr_status_audit ON public.pkkpr_permohonan;
CREATE TRIGGER trg_pkkpr_status_audit
    BEFORE INSERT OR UPDATE ON public.pkkpr_permohonan
    FOR EACH ROW
    EXECUTE FUNCTION public.log_pkkpr_status_change();


-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES PADA pkkpr_permohonan
-- ============================================================================

-- Aktifkan RLS
ALTER TABLE public.pkkpr_permohonan ENABLE ROW LEVEL SECURITY;

-- Helper Function: Mengecek apakah role aktif adalah salah satu dari target roles
CREATE OR REPLACE FUNCTION public.current_user_has_role(VARIADIC target_roles text[])
RETURNS boolean AS $$
DECLARE
    jwt_role text;
    user_meta_role text;
    app_meta_role text;
BEGIN
    jwt_role := lower(COALESCE(current_setting('request.jwt.claims', true)::jsonb ->> 'role', ''));
    user_meta_role := lower(COALESCE(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role', ''));
    app_meta_role := lower(COALESCE(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role', ''));

    -- Superadmin bypass
    IF jwt_role IN ('superadmin', 'super_admin') 
       OR user_meta_role IN ('superadmin', 'super_admin') 
       OR app_meta_role IN ('superadmin', 'super_admin') THEN
        RETURN true;
    END IF;

    -- Cek kecocokan target roles
    FOR i IN 1 .. array_length(target_roles, 1) LOOP
        IF jwt_role = lower(target_roles[i]) 
           OR user_meta_role = lower(target_roles[i]) 
           OR app_meta_role = lower(target_roles[i]) THEN
            RETURN true;
        END IF;
    END LOOP;

    RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Bersihkan policy lama jika ada
DROP POLICY IF EXISTS "ServiceRoleAccessPolicy" ON public.pkkpr_permohonan;
DROP POLICY IF EXISTS "SuperadminAccessPolicy" ON public.pkkpr_permohonan;
DROP POLICY IF EXISTS "PuptrAccessPolicy" ON public.pkkpr_permohonan;
DROP POLICY IF EXISTS "PertanianAccessPolicy" ON public.pkkpr_permohonan;
DROP POLICY IF EXISTS "OssAccessPolicy" ON public.pkkpr_permohonan;
DROP POLICY IF EXISTS "ApplicantAccessPolicy" ON public.pkkpr_permohonan;
DROP POLICY IF EXISTS "ApplicantInsertPolicy" ON public.pkkpr_permohonan;

-- 4.1 Service Role (Backend Server API Bypass)
CREATE POLICY "ServiceRoleAccessPolicy"
ON public.pkkpr_permohonan
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4.2 Super Admin Full Access Policy
CREATE POLICY "SuperadminAccessPolicy"
ON public.pkkpr_permohonan
FOR ALL
TO authenticated
USING (
    public.current_user_has_role('superadmin', 'super_admin')
)
WITH CHECK (
    public.current_user_has_role('superadmin', 'super_admin')
);

-- 4.3 PuptrAccessPolicy (Admin Dinas PUPTR)
-- Hak Akses: Membaca & Mengubah baris dengan status 'REVIEW_PUPTR', 'REJECTED_PERTANIAN', 'PERTEK_PERTANIAN'
CREATE POLICY "PuptrAccessPolicy"
ON public.pkkpr_permohonan
FOR ALL
TO authenticated
USING (
    public.current_user_has_role('admin_puptr', 'puptr', 'dinas_puptr')
    AND status_permohonan IN ('REVIEW_PUPTR', 'REJECTED_PERTANIAN', 'PERTEK_PERTANIAN')
)
WITH CHECK (
    public.current_user_has_role('admin_puptr', 'puptr', 'dinas_puptr')
    AND status_permohonan IN ('REVIEW_PUPTR', 'ESCALATED_PERTANIAN', 'REJECTED_FINAL', 'PROSES_OSS')
);

-- 4.4 PertanianAccessPolicy (Admin Dinas Pertanian)
-- Hak Akses: HANYA dapat membaca & mengubah data berstatus 'ESCALATED_PERTANIAN'
CREATE POLICY "PertanianAccessPolicy"
ON public.pkkpr_permohonan
FOR ALL
TO authenticated
USING (
    public.current_user_has_role('admin_pertanian', 'pertanian', 'dinas_pertanian')
    AND status_permohonan = 'ESCALATED_PERTANIAN'
)
WITH CHECK (
    public.current_user_has_role('admin_pertanian', 'pertanian', 'dinas_pertanian')
    AND status_permohonan IN ('ESCALATED_PERTANIAN', 'REJECTED_PERTANIAN', 'PERTEK_PERTANIAN')
);

-- 4.5 OssAccessPolicy (Admin DPMPTSP / OSS)
-- Hak Akses: HANYA dapat membaca & mengubah data berstatus 'PROSES_OSS' dan 'IZIN_TERBIT'
CREATE POLICY "OssAccessPolicy"
ON public.pkkpr_permohonan
FOR ALL
TO authenticated
USING (
    public.current_user_has_role('admin_oss', 'admin_dpmptsp', 'oss', 'dpmptsp')
    AND status_permohonan IN ('PROSES_OSS', 'IZIN_TERBIT')
)
WITH CHECK (
    public.current_user_has_role('admin_oss', 'admin_dpmptsp', 'oss', 'dpmptsp')
    AND status_permohonan IN ('PROSES_OSS', 'IZIN_TERBIT')
);

-- 4.6 ApplicantAccessPolicy (Pemohon / Investor)
-- Hak Akses: Hanya dapat membaca data miliknya sendiri di mana user_id = auth.uid()
CREATE POLICY "ApplicantAccessPolicy"
ON public.pkkpr_permohonan
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR pemohon_email = (current_setting('request.jwt.claims', true)::jsonb ->> 'email')
);

-- 4.7 ApplicantInsertPolicy (Pengajuan Permohonan Baru oleh Investor)
CREATE POLICY "ApplicantInsertPolicy"
ON public.pkkpr_permohonan
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
    AND status_permohonan = 'REVIEW_PUPTR'
);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES PADA pkkpr_audit_logs
-- ============================================================================

ALTER TABLE public.pkkpr_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "AuditServiceRoleAccessPolicy" ON public.pkkpr_audit_logs;
DROP POLICY IF EXISTS "AuditAdminAccessPolicy" ON public.pkkpr_audit_logs;
DROP POLICY IF EXISTS "AuditApplicantAccessPolicy" ON public.pkkpr_audit_logs;

CREATE POLICY "AuditServiceRoleAccessPolicy"
ON public.pkkpr_audit_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "AuditAdminAccessPolicy"
ON public.pkkpr_audit_logs
FOR SELECT
TO authenticated
USING (
    public.current_user_has_role('superadmin', 'super_admin', 'admin_puptr', 'admin_pertanian', 'admin_oss', 'admin_dpmptsp')
);

CREATE POLICY "AuditApplicantAccessPolicy"
ON public.pkkpr_audit_logs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.pkkpr_permohonan p
        WHERE p.id = pkkpr_audit_logs.permohonan_id
        AND (p.user_id = auth.uid() OR p.pemohon_email = (current_setting('request.jwt.claims', true)::jsonb ->> 'email'))
    )
);

-- Selesai
COMMENT ON TABLE public.pkkpr_permohonan IS 'Tabel Single Source of Truth Permohonan PKKPR dengan RLS Berbasis Role OPD';
COMMENT ON TABLE public.pkkpr_audit_logs IS 'Tabel Log Audit Transisi Status PKKPR Anti-Manipulasi';
