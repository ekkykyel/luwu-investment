-- ==========================================
-- SKEMA DATABASE MAL PELAYANAN PUBLIK (MPP)
-- ==========================================

-- 1. Tabel Master Data Warga (Single Identity)
CREATE TABLE IF NOT EXISTS public.mpp_citizens (
    nik VARCHAR(16) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone_number VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabel Tenant (Instansi/Gerai)
CREATE TABLE IF NOT EXISTS public.mpp_tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE, -- Contoh: BPN, SAMSAT (Untuk prefix antrian)
    logo VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Tabel Petugas (Admin Tenant / Staff)
CREATE TABLE IF NOT EXISTS public.mpp_tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.mpp_tenants(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'staff', -- admin, staff
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, tenant_id)
);

-- 4. Tabel Layanan (Katalog per Gerai)
CREATE TABLE IF NOT EXISTS public.mpp_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.mpp_tenants(id) ON DELETE CASCADE,
    service_name VARCHAR(255) NOT NULL,
    requirements TEXT,
    is_long_process BOOLEAN DEFAULT FALSE, -- TRUE jika butuh tracking E-LACAK
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Tabel Antrian (Transaksi Harian)
CREATE TABLE IF NOT EXISTS public.mpp_queues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.mpp_tenants(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.mpp_services(id) ON DELETE CASCADE,
    citizen_nik VARCHAR(16) NOT NULL REFERENCES public.mpp_citizens(nik) ON DELETE RESTRICT,
    queue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    queue_number INTEGER NOT NULL,
    ticket_code VARCHAR(100) NOT NULL, -- Format: {TENANT_CODE}-{DATE}-{NUM}
    status VARCHAR(50) NOT NULL DEFAULT 'menunggu', -- menunggu, dipanggil, dilayani, selesai_langsung, masuk_tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(tenant_id, queue_date, queue_number) -- Memastikan nomor urut unik per tenant per hari
);

-- 6. Tabel Induk Dokumen E-Lacak (Untuk layanan panjang)
CREATE TABLE IF NOT EXISTS public.mpp_document_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID NOT NULL REFERENCES public.mpp_queues(id) ON DELETE CASCADE,
    tracking_code VARCHAR(100) NOT NULL UNIQUE, -- Resi E-LACAK
    current_status VARCHAR(100) NOT NULL DEFAULT 'Berkas Masuk',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. Tabel Riwayat E-Lacak (Timeline pergerakan)
CREATE TABLE IF NOT EXISTS public.mpp_tracking_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_id UUID NOT NULL REFERENCES public.mpp_document_tracking(id) ON DELETE CASCADE,
    status_description TEXT NOT NULL,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. Tabel Survei Kepuasan Masyarakat (SKM)
CREATE TABLE IF NOT EXISTS public.mpp_skm (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID NOT NULL REFERENCES public.mpp_queues(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.mpp_tenants(id) ON DELETE CASCADE,
    citizen_nik VARCHAR(16) NOT NULL REFERENCES public.mpp_citizens(nik) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(queue_id) -- 1 layanan hanya bisa diulas 1 kali
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.mpp_citizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpp_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpp_tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpp_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpp_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpp_document_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpp_tracking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpp_skm ENABLE ROW LEVEL SECURITY;

-- Untuk keperluan pengembangan awal, kita beri akses READ untuk anon, dan FULL untuk authenticated
CREATE POLICY "Enable read access for all users" ON public.mpp_tenants FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.mpp_services FOR SELECT USING (true);

-- Dan allow all untuk authenticated users (admin/petugas) sementara sebelum role-based auth kompleks diimplementasi
CREATE POLICY "Enable all for authenticated users" ON public.mpp_citizens FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.mpp_tenant_users FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.mpp_services FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.mpp_queues FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.mpp_document_tracking FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.mpp_tracking_history FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.mpp_skm FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.mpp_tenants FOR ALL TO authenticated USING (true);

-- Insert Dummy Tenants untuk contoh
INSERT INTO public.mpp_tenants (name, code) VALUES 
('DPMPTSP (Perizinan)', 'DPMPTSP'),
('Dinas Kependudukan dan Catatan Sipil', 'DISDUKCAPIL'),
('Badan Pertanahan Nasional', 'BPN')
ON CONFLICT (code) DO NOTHING;
