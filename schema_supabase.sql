-- =========================================================================================
-- SKEMA BASIS DATA UTUH & LENGKAP: PORTAL INVESTASI & MAL PELAYANAN PUBLIK (MPP) SIMPURUSIANG
-- PEMERINTAH KABUPATEN LUWU (POSTGRESQL + POSTGIS + SUPABASE)
-- =========================================================================================
-- Skrip DDL ini siap dieksekusi langsung di SQL Editor Supabase baru secara idempotent.
-- Mengaktifkan ekstensi yang dibutuhkan, membuat seluruh tabel relasional & spasial,
-- foreign keys dengan cascade rules, indexes, triggers, storage buckets, RLS, RPC functions,
-- dan view komprehensif (v_investments_complete).
-- =========================================================================================

-- -----------------------------------------------------------------------------------------
-- 1. AKTIFKAN EKSTENSI POSTGRESQL (POSTGIS, UUID, & PGVECTOR)
-- -----------------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "vector";

-- -----------------------------------------------------------------------------------------
-- 2. TABEL PROFIL PENGGUNA & RBAC (ROLE-BASED ACCESS CONTROL)
-- -----------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    role TEXT DEFAULT 'investor', -- 'investor', 'admin_oss', 'admin_dalak', 'admin_puptr', 'admin_pertanian', 'admin_mpp', 'superadmin', 'operator', 'public_user'
    nik VARCHAR(16),
    phone_number VARCHAR(50),
    phone VARCHAR(50),
    company_name TEXT,
    nib TEXT,
    negara_asal TEXT DEFAULT 'Indonesia',
    status_modal TEXT DEFAULT 'PMDN',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------------------
-- 3. TABEL MASTER & TRANSAKSI INVESTASI SPASIAL
-- -----------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location_name TEXT,
    sector TEXT NOT NULL,
    sub_sector TEXT,
    district_id TEXT,
    village_id TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    investment_value NUMERIC(20, 2) DEFAULT 0,
    area_ha NUMERIC(12, 4) DEFAULT 0,
    npv NUMERIC(20, 2),
    land_status TEXT,
    photo_url TEXT,
    photo_urls TEXT[],
    galeri_foto JSONB DEFAULT '[]'::jsonb,
    proposal_file_name TEXT,
    contact_pic TEXT,
    phone_number TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'Published',
    description TEXT,
    pola_ruang TEXT,
    suitability_score NUMERIC(5, 2),
    nib TEXT,
    plot_number TEXT,
    certificate_number TEXT,
    pertanian_status TEXT,
    pertanian_rejection_notes TEXT,
    berita_acara_num TEXT,
    esg_environmental_risk TEXT,
    intersected_layer_id TEXT,
    is_spatial_override BOOLEAN DEFAULT FALSE,
    override_document_ref TEXT,
    override_justification TEXT,
    override_by_user UUID REFERENCES auth.users(id),
    komitmen_tenaga_lokal INTEGER DEFAULT 0,
    komitmen_tenaga_asing INTEGER DEFAULT 0,
    tenaga_kerja INTEGER DEFAULT 0,
    geom GEOMETRY(Geometry, 4326),
    geometry JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gis_potensi_investasi (
    id UUID PRIMARY KEY REFERENCES public.investments(id) ON DELETE CASCADE,
    nama_potensi TEXT NOT NULL,
    slug TEXT,
    sektor_utama TEXT NOT NULL,
    sub_sektor TEXT,
    deskripsi_singkat TEXT,
    jenis_komoditas TEXT,
    kecamatan TEXT,
    desa TEXT,
    luas_ha NUMERIC(12, 4),
    estimasi_nilai_investasi NUMERIC(20, 2),
    status_lahan TEXT,
    status TEXT DEFAULT 'Tersedia',
    nib TEXT,
    nomor_sertifikat TEXT,
    status_pkkpr TEXT,
    geom GEOMETRY(Geometry, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Anak Relasi Investasi (Child Tables)
CREATE TABLE IF NOT EXISTS public.financials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
    capex NUMERIC(20, 2) DEFAULT 0,
    opex NUMERIC(20, 2) DEFAULT 0,
    irr NUMERIC(6, 2) DEFAULT 0,
    roi NUMERIC(6, 2) DEFAULT 0,
    payback_period NUMERIC(6, 2) DEFAULT 0,
    npv NUMERIC(20, 2) DEFAULT 0,
    currency TEXT DEFAULT 'IDR',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.legalities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
    pkkpr_status TEXT,
    amdal_status TEXT,
    shm_hgu_status TEXT,
    pbg_status TEXT,
    sk_pkkpr_number TEXT,
    validity_period TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
    address TEXT,
    district TEXT,
    village TEXT,
    postal_code TEXT,
    accessibility_notes TEXT,
    dist_to_port_km NUMERIC(8, 2),
    dist_to_road_km NUMERIC(8, 2),
    dist_to_airport_km NUMERIC(8, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
    file_name TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    caption TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.investment_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
    infrastructure_score NUMERIC(5, 2) DEFAULT 0,
    spatial_suitability_score NUMERIC(5, 2) DEFAULT 0,
    market_readiness_score NUMERIC(5, 2) DEFAULT 0,
    esg_score NUMERIC(5, 2) DEFAULT 0,
    total_composite_score NUMERIC(5, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------------------
-- 4. TABEL PERSETUJUAN PKKPR & KESESUAIAN TATA RUANG
-- -----------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gis_pkkpr (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_sk TEXT,
    pemohon TEXT,
    nama_perusahaan TEXT,
    nib TEXT,
    sektor TEXT,
    luas_m2 NUMERIC(15, 2),
    luas_ha NUMERIC(12, 4),
    kecamatan TEXT,
    desa TEXT,
    status TEXT DEFAULT 'Diajukan',
    catatan TEXT,
    sertifikat_tanah_url TEXT,
    surat_pengantar_desa_url TEXT,
    berkas_legalitas_gabungan_url TEXT,
    geom GEOMETRY(Geometry, 4326),
    geojson JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------------------
-- 5. TABEL MINAT INVESTASI (LETTER OF INTENT - LOI) & KONSULTASI FAST-TRACK
-- -----------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.investment_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_id UUID REFERENCES auth.users(id),
    investor_name TEXT NOT NULL,
    company_name TEXT,
    contact_info TEXT,
    potensi_name TEXT,
    potensi_id UUID REFERENCES public.investments(id) ON DELETE SET NULL,
    nilai_investasi NUMERIC(20, 2),
    kebutuhan_lahan TEXT,
    pesan_tambahan TEXT,
    status TEXT DEFAULT 'Diajukan', -- 'Diajukan', 'Diverifikasi', 'Jadwal Site Visit', 'Disetujui', 'Ditolak'
    nib_oss TEXT,
    catatan_admin TEXT,
    jadwal_site_visit TIMESTAMPTZ,
    laporan_dalak TEXT,
    dalak_admin_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.satgas_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID,
    action_type TEXT NOT NULL,
    decision_notes TEXT,
    officer_name TEXT,
    officer_role TEXT,
    officer_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------------------
-- 6. TABEL LAPORAN PENGADUAN MASYARAKAT (SP4N-LAPOR INTEGRATION)
-- -----------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pengaduan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_code TEXT UNIQUE,
    nik VARCHAR(16),
    nama_pelapor TEXT NOT NULL,
    telepon VARCHAR(50),
    email VARCHAR(255),
    judul_pengaduan TEXT NOT NULL,
    deskripsi TEXT NOT NULL,
    kategori_pengaduan TEXT,
    lokasi_kejadian TEXT,
    status TEXT DEFAULT 'Baru', -- 'Baru', 'Diproses', 'Selesai', 'Ditolak'
    tanggapan_petugas TEXT,
    petugas_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pengaduan_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pengaduan_id UUID NOT NULL REFERENCES public.pengaduan(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT,
    file_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------------------
-- 7. TABEL TESTIMONI INVESTOR, PENGATURAN SITUS, AUDIT LOG & OPERATOR
-- -----------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.investor_testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    position TEXT,
    avatar_url TEXT,
    content TEXT NOT NULL,
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    sector TEXT,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'Operator',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level TEXT NOT NULL DEFAULT 'info',
    service TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------------------
-- 8. TABEL SPASIAL GEOGRAFIS & INFRASTRUKTUR DAERAH (POSTGIS)
-- -----------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gis_kecamatan (
    id TEXT PRIMARY KEY,
    id_kecamatan TEXT,
    nama_kecamatan TEXT,
    name TEXT,
    kecamatan TEXT,
    luas_ha NUMERIC(12, 4),
    luas_gis NUMERIC(12, 4),
    jumlah_penduduk INTEGER,
    kepadatan NUMERIC(10, 2),
    jumlah_desa INTEGER,
    sektor_unggulan TEXT[],
    deskripsi TEXT,
    geom GEOMETRY(MultiPolygon, 4326),
    geojson JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gis_desa (
    id TEXT PRIMARY KEY,
    id_desa TEXT,
    kecamatan_id TEXT,
    id_kecamatan TEXT,
    nama_desa TEXT,
    name TEXT,
    desa TEXT,
    kecamatan TEXT,
    "WADMKC" TEXT,
    luas_ha NUMERIC(12, 4),
    luas_gis NUMERIC(12, 4),
    luas NUMERIC(12, 4),
    jum_pdd INTEGER,
    kepadatan NUMERIC(10, 2),
    status_kawasan TEXT,
    komoditas TEXT[],
    potensi_investasi TEXT,
    geom GEOMETRY(MultiPolygon, 4326),
    geojson JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gis_infrastruktur (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    kategori TEXT NOT NULL,
    sub_kategori TEXT,
    kondisi TEXT,
    kapasitas TEXT,
    status TEXT DEFAULT 'Published',
    geom GEOMETRY(Geometry, 4326),
    geojson JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gis_zonasi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keterangan TEXT,
    rpluwu2009 TEXT,
    zona TEXT,
    sub_zona TEXT,
    kode_zona TEXT,
    styleurl TEXT,
    fill_opacity NUMERIC(4, 2) DEFAULT 0.5,
    stroke_opacity NUMERIC(4, 2) DEFAULT 1.0,
    stroke TEXT DEFAULT '#00aaff',
    stroke_width NUMERIC(4, 2) DEFAULT 2,
    geom GEOMETRY(Geometry, 4326),
    geojson JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gis_sawah (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_blok TEXT,
    jenis_sawah TEXT,
    luas_ha NUMERIC(12, 4),
    status_perlindungan TEXT DEFAULT 'LP2B',
    geom GEOMETRY(Geometry, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gis_jalan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_ruas TEXT,
    nama TEXT,
    fungsi TEXT,
    keterangan TEXT,
    panjang_km NUMERIC(10, 2),
    kondisi TEXT,
    geom GEOMETRY(Geometry, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gis_sungai (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_sungai TEXT,
    ordo_sungai TEXT,
    lebar_sempadan INTEGER DEFAULT 15,
    geom GEOMETRY(Geometry, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gis_mangrove (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_kawasan TEXT,
    kondisi TEXT,
    luas_ha NUMERIC(12, 4),
    geom GEOMETRY(Geometry, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gis_tambak (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_kawasan TEXT,
    jenis_komoditas TEXT,
    luas_ha NUMERIC(12, 4),
    geom GEOMETRY(Geometry, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.infrastructure_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.luwu_das_hydrology (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_key TEXT NOT NULL UNIQUE,
    district_name TEXT NOT NULL,
    das_name TEXT NOT NULL,
    river_name TEXT NOT NULL,
    has_direct_das BOOLEAN DEFAULT TRUE,
    neighbor_fallback_kecamatan TEXT,
    intake_geom GEOMETRY(Point, 4326),
    debit_capacity TEXT,
    usage_suitability TEXT,
    rpjpd_table_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.spatial_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    user_name TEXT,
    layer_id TEXT NOT NULL,
    layer_name TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE', 'ROLLBACK')),
    old_props JSONB,
    new_props JSONB,
    geom GEOMETRY(Geometry, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------------------
-- 9. TABEL KNOWLEDGE BASE RAG (VECTOR EMBEDDINGS UNTUK AI KONSULTAN INVESTASI)
-- -----------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('demografi', 'ekonomi', 'tata_ruang', 'lingkungan', 'regulasi')),
    source_agency TEXT NOT NULL,
    publication_year INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    file_path TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding VECTOR(1536) NOT NULL,
    page_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.knowledge_base_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_name TEXT NOT NULL,
    content_chunk TEXT NOT NULL,
    metadata JSONB,
    embedding VECTOR(768),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------------------
-- 10. TABEL MAL PELAYANAN PUBLIK (MPP SIMPURUSIANG)
-- -----------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mpp_citizens (
    nik VARCHAR(16) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone_number VARCHAR(50),
    gender VARCHAR(50),
    jenis_kelamin VARCHAR(50),
    occupation VARCHAR(100),
    pekerjaan VARCHAR(100),
    kecamatan VARCHAR(100),
    desa VARCHAR(100),
    address TEXT,
    company_name VARCHAR(255),
    nib VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.mpp_tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    logo VARCHAR(500),
    floor VARCHAR(50) DEFAULT 'Lantai 1',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    officer_pin VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.mpp_tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.mpp_tenants(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'staff',
    counter_name VARCHAR(100),
    officer_name VARCHAR(255),
    username VARCHAR(100),
    pin_code VARCHAR(50),
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, tenant_id)
);

CREATE TABLE IF NOT EXISTS public.mpp_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.mpp_tenants(id) ON DELETE CASCADE,
    service_name VARCHAR(255) NOT NULL,
    requirements TEXT,
    estimated_time_minutes INTEGER DEFAULT 15,
    is_long_process BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.mpp_queues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.mpp_tenants(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.mpp_services(id) ON DELETE CASCADE,
    citizen_nik VARCHAR(16) NOT NULL REFERENCES public.mpp_citizens(nik) ON DELETE RESTRICT,
    queue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    queue_number INTEGER NOT NULL,
    ticket_code VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'menunggu', -- 'menunggu', 'dipanggil', 'dilayani', 'selesai_langsung', 'masuk_tracking', 'tidak_hadir'
    session VARCHAR(50),
    call_count INTEGER DEFAULT 0,
    served_by UUID REFERENCES auth.users(id),
    served_by_name VARCHAR(255),
    counter_name VARCHAR(100),
    called_at TIMESTAMPTZ,
    served_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    UNIQUE(tenant_id, queue_date, queue_number)
);

CREATE TABLE IF NOT EXISTS public.mpp_document_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID NOT NULL REFERENCES public.mpp_queues(id) ON DELETE CASCADE,
    tracking_code VARCHAR(100) NOT NULL UNIQUE,
    current_status VARCHAR(100) NOT NULL DEFAULT 'Berkas Masuk',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.mpp_tracking_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_id UUID NOT NULL REFERENCES public.mpp_document_tracking(id) ON DELETE CASCADE,
    status_description TEXT NOT NULL,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.mpp_skm (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID NOT NULL REFERENCES public.mpp_queues(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.mpp_tenants(id) ON DELETE CASCADE,
    citizen_nik VARCHAR(16) NOT NULL REFERENCES public.mpp_citizens(nik) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    q1_persyaratan INTEGER CHECK (q1_persyaratan >= 1 AND q1_persyaratan <= 4),
    q2_prosedur INTEGER CHECK (q2_prosedur >= 1 AND q2_prosedur <= 4),
    q3_waktu INTEGER CHECK (q3_waktu >= 1 AND q3_waktu <= 4),
    q4_biaya INTEGER CHECK (q4_biaya >= 1 AND q4_biaya <= 4),
    q5_produk INTEGER CHECK (q5_produk >= 1 AND q5_produk <= 4),
    q6_kompetensi INTEGER CHECK (q6_kompetensi >= 1 AND q6_kompetensi <= 4),
    q7_perilaku INTEGER CHECK (q7_perilaku >= 1 AND q7_perilaku <= 4),
    q8_sarpras INTEGER CHECK (q8_sarpras >= 1 AND q8_sarpras <= 4),
    q9_pengaduan INTEGER CHECK (q9_pengaduan >= 1 AND q9_pengaduan <= 4),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    UNIQUE(queue_id)
);

CREATE TABLE IF NOT EXISTS public.mpp_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    floor TEXT DEFAULT 'Lantai 1',
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mpp_umkm (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255),
    category VARCHAR(100) DEFAULT 'Kuliner',
    whatsapp VARCHAR(50),
    image_url TEXT,
    price_range VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.mpp_flow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    step INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.mpp_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_name VARCHAR(100) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.mpp_fo_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type VARCHAR(50) NOT NULL,
    source_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'responding', 'resolved'
    notes TEXT,
    floor VARCHAR(20),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_by UUID REFERENCES auth.users(id),
    resolved_by_name VARCHAR(255),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mpp_reprimands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.mpp_tenants(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES auth.users(id),
    target_counter_name VARCHAR(100),
    target_officer_name VARCHAR(255),
    quick_reasons TEXT[],
    comments TEXT NOT NULL,
    issued_by UUID REFERENCES auth.users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'sent', -- 'sent', 'read', 'resolved'
    read_by_name VARCHAR(255),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    title_en TEXT,
    title_zh TEXT,
    summary TEXT NOT NULL,
    summary_en TEXT,
    summary_zh TEXT,
    content TEXT NOT NULL,
    content_en TEXT,
    content_zh TEXT,
    category TEXT NOT NULL DEFAULT 'Giat Kegiatan MPP',
    author TEXT NOT NULL DEFAULT 'Humas Pemkab Luwu',
    image_url TEXT,
    date TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -----------------------------------------------------------------------------------------
-- 11. INDEKS PERFORMA & SPASIAL (B-TREE, GIST, & HNSW)
-- -----------------------------------------------------------------------------------------
-- Indeks B-Tree Standar & Relasional
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_nik ON public.profiles(nik);

CREATE INDEX IF NOT EXISTS idx_investments_district_id ON public.investments(district_id);
CREATE INDEX IF NOT EXISTS idx_investments_sector ON public.investments(sector);
CREATE INDEX IF NOT EXISTS idx_investments_status ON public.investments(status);
CREATE INDEX IF NOT EXISTS idx_investments_nib ON public.investments(nib);
CREATE INDEX IF NOT EXISTS idx_investments_plot_number ON public.investments(plot_number);
CREATE INDEX IF NOT EXISTS idx_investments_certificate_number ON public.investments(certificate_number);
CREATE INDEX IF NOT EXISTS idx_investments_pertanian_status ON public.investments(pertanian_status);

CREATE INDEX IF NOT EXISTS idx_financials_project_id ON public.financials(project_id);
CREATE INDEX IF NOT EXISTS idx_legalities_project_id ON public.legalities(project_id);
CREATE INDEX IF NOT EXISTS idx_locations_project_id ON public.locations(project_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_project_id ON public.media_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_investment_scores_project_id ON public.investment_scores(project_id);

CREATE INDEX IF NOT EXISTS idx_gis_potensi_investasi_nib ON public.gis_potensi_investasi(nib);
CREATE INDEX IF NOT EXISTS idx_gis_potensi_investasi_nomor_sertifikat ON public.gis_potensi_investasi(nomor_sertifikat);
CREATE INDEX IF NOT EXISTS idx_gis_potensi_investasi_status ON public.gis_potensi_investasi(status);
CREATE INDEX IF NOT EXISTS idx_gis_potensi_investasi_status_pkkpr ON public.gis_potensi_investasi(status_pkkpr);

CREATE INDEX IF NOT EXISTS idx_mpp_queues_citizen_date ON public.mpp_queues(citizen_nik, queue_date DESC);
CREATE INDEX IF NOT EXISTS idx_mpp_queues_tenant_date_status ON public.mpp_queues(tenant_id, queue_date, status);
CREATE INDEX IF NOT EXISTS idx_mpp_queues_active_stream ON public.mpp_queues(tenant_id, queue_date, queue_number ASC) WHERE status IN ('menunggu', 'dipanggil');
CREATE INDEX IF NOT EXISTS idx_mpp_facilities_created_at ON public.mpp_facilities(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_news_status_created_at ON public.news(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON public.news(category);

-- Indeks Spasial PostGIS (GIST)
CREATE INDEX IF NOT EXISTS idx_investments_geom_gist ON public.investments USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_gis_potensi_geom ON public.gis_potensi_investasi USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_gis_pkkpr_geom ON public.gis_pkkpr USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_gis_infrastruktur_geom_gist ON public.gis_infrastruktur USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_gis_zonasi_geom_gist ON public.gis_zonasi USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_gis_sawah_geom_gist ON public.gis_sawah USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_gis_jalan_geom_gist ON public.gis_jalan USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_gis_sungai_geom_gist ON public.gis_sungai USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_gis_mangrove_geom_gist ON public.gis_mangrove USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_gis_tambak_geom_gist ON public.gis_tambak USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_infrastructure_points_geom_gist ON public.infrastructure_points USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_luwu_das_hydrology_intake_geom_gist ON public.luwu_das_hydrology USING GIST (intake_geom);

-- Indeks Vektor AI (HNSW)
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_hnsw ON public.document_chunks USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding_hnsw ON public.knowledge_base_documents USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_document_name ON public.knowledge_base_documents(document_name);

-- -----------------------------------------------------------------------------------------
-- 12. TRIGGERS SINKRONISASI OTOMATIS (INVESTMENTS <-> GIS_POTENSI_INVESTASI & AUTH)
-- -----------------------------------------------------------------------------------------
-- Trigger Bridge Auth Supabase -> Profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, negara_asal, status_modal)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'investor'),
    COALESCE(NEW.raw_user_meta_data->>'negara_asal', 'Indonesia'),
    COALESCE(NEW.raw_user_meta_data->>'status_modal', 'PMDN')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
    role = COALESCE(NULLIF(EXCLUDED.role, ''), profiles.role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger Sinkronisasi: investments -> gis_potensi_investasi
CREATE OR REPLACE FUNCTION public.trg_sync_investments_to_gis_potensi()
RETURNS TRIGGER AS $$
DECLARE
  v_geom geometry := NULL;
  v_slug text;
BEGIN
  v_slug := LOWER(REGEXP_REPLACE(COALESCE(NEW.name, 'potensi-investasi'), '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := TRIM(BOTH '-' FROM v_slug);

  IF NEW.longitude IS NOT NULL AND NEW.latitude IS NOT NULL 
     AND NEW.longitude != 0 AND NEW.latitude != 0 THEN
    v_geom := ST_SetSRID(ST_MakePoint(NEW.longitude::float8, NEW.latitude::float8), 4326);
  ELSIF NEW.geom IS NOT NULL THEN
    v_geom := NEW.geom;
  END IF;

  INSERT INTO public.gis_potensi_investasi (
    id,
    nama_potensi,
    slug,
    sektor_utama,
    sub_sektor,
    deskripsi_singkat,
    jenis_komoditas,
    geom
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.name, 'Potensi Investasi'),
    v_slug,
    COALESCE(NEW.sector, 'Lainnya'),
    COALESCE(NEW.sub_sector, ''),
    COALESCE(NEW.description, 'Potensi investasi di Kabupaten Luwu'),
    COALESCE(NEW.sector, ''),
    v_geom
  )
  ON CONFLICT (id) DO UPDATE SET
    nama_potensi = EXCLUDED.nama_potensi,
    slug = EXCLUDED.slug,
    sektor_utama = EXCLUDED.sektor_utama,
    sub_sektor = EXCLUDED.sub_sektor,
    deskripsi_singkat = COALESCE(EXCLUDED.deskripsi_singkat, gis_potensi_investasi.deskripsi_singkat),
    geom = COALESCE(EXCLUDED.geom, gis_potensi_investasi.geom);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_sync_investments_to_gis ON public.investments;
CREATE TRIGGER trg_auto_sync_investments_to_gis
AFTER INSERT OR UPDATE ON public.investments
FOR EACH ROW EXECUTE FUNCTION public.trg_sync_investments_to_gis_potensi();

-- Trigger Sinkronisasi Sebaliknya: gis_potensi_investasi -> investments
CREATE OR REPLACE FUNCTION public.trg_sync_gis_potensi_to_investments()
RETURNS TRIGGER AS $$
DECLARE
  v_lat float8 := NULL;
  v_lng float8 := NULL;
BEGIN
  IF NEW.geom IS NOT NULL THEN
    v_lng := ST_X(ST_Centroid(NEW.geom));
    v_lat := ST_Y(ST_Centroid(NEW.geom));
  END IF;

  UPDATE public.investments
  SET
    latitude = COALESCE(v_lat, latitude),
    longitude = COALESCE(v_lng, longitude),
    name = COALESCE(NEW.nama_potensi, name),
    sector = COALESCE(NEW.sektor_utama, sector),
    sub_sector = COALESCE(NEW.sub_sektor, sub_sector),
    description = COALESCE(NEW.deskripsi_singkat, description)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_sync_gis_to_investments ON public.gis_potensi_investasi;
CREATE TRIGGER trg_auto_sync_gis_to_investments
AFTER UPDATE OF geom, nama_potensi, sektor_utama, sub_sektor, deskripsi_singkat ON public.gis_potensi_investasi
FOR EACH ROW EXECUTE FUNCTION public.trg_sync_gis_potensi_to_investments();

-- -----------------------------------------------------------------------------------------
-- 13. VIEW TERPADU: v_investments_complete
-- -----------------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_investments_complete AS
SELECT 
  i.id,
  i.name,
  i.sector,
  i.sub_sector,
  i.district_id,
  i.village_id,
  i.latitude,
  i.longitude,
  i.investment_value,
  i.area_ha,
  i.land_status,
  i.status,
  COALESCE(i.description, g.deskripsi_singkat, '') AS description,
  g.deskripsi_singkat,
  i.contact_pic,
  i.phone_number,
  i.photo_url,
  i.created_at,
  i.updated_at,
  CASE 
    WHEN g.geom IS NOT NULL THEN ST_AsGeoJSON(g.geom)::json
    WHEN i.geom IS NOT NULL THEN ST_AsGeoJSON(i.geom)::json
    WHEN i.longitude IS NOT NULL AND i.latitude IS NOT NULL 
      THEN json_build_object('type', 'Point', 'coordinates', json_build_array(i.longitude, i.latitude))
    ELSE NULL
  END AS spatial_geometry,
  COALESCE(
    (SELECT json_agg(f) FROM public.financials f WHERE f.project_id::text = i.id::text),
    '[]'::json
  ) AS financials,
  COALESCE(
    (SELECT json_agg(l) FROM public.legalities l WHERE l.project_id::text = i.id::text),
    '[]'::json
  ) AS legalities,
  COALESCE(
    (SELECT json_agg(loc) FROM public.locations loc WHERE loc.project_id::text = i.id::text),
    '[]'::json
  ) AS locations,
  COALESCE(
    (SELECT json_agg(m) FROM public.media_assets m WHERE m.project_id::text = i.id::text),
    '[]'::json
  ) AS media_assets,
  COALESCE(
    (SELECT json_agg(s) FROM public.investment_scores s WHERE s.project_id::text = i.id::text),
    '[]'::json
  ) AS investment_scores
FROM public.investments i
LEFT JOIN public.gis_potensi_investasi g ON g.id::text = i.id::text;

-- -----------------------------------------------------------------------------------------
-- 14. RPC & STORED FUNCTIONS (AI VECTOR SEARCH, SPATIAL INTERSECTION, MVT TILES)
-- -----------------------------------------------------------------------------------------

-- A. Multi-Counter Queue Next Pull (Row Locking Skip Locked)
CREATE OR REPLACE FUNCTION public.mpp_pull_next_queue(
  p_tenant_id UUID,
  p_served_by UUID,
  p_served_by_name TEXT,
  p_counter_name TEXT
)
RETURNS SETOF public.mpp_queues AS $$
DECLARE
  v_queue public.mpp_queues;
BEGIN
  SELECT *
  INTO v_queue
  FROM public.mpp_queues
  WHERE tenant_id = p_tenant_id
    AND queue_date = CURRENT_DATE
    AND status = 'menunggu'
  ORDER BY queue_number ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_queue.id IS NOT NULL THEN
    UPDATE public.mpp_queues
    SET status = 'dipanggil',
        call_count = COALESCE(v_queue.call_count, 0) + 1,
        served_by = p_served_by,
        served_by_name = p_served_by_name,
        counter_name = p_counter_name,
        called_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_queue.id
    RETURNING * INTO v_queue;
    
    RETURN NEXT v_queue;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. Vector Semantic Similarity Search (Document Chunks 1536-dim)
CREATE OR REPLACE FUNCTION public.match_knowledge_chunks (
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  similarity FLOAT
)
LANGUAGE sql STABLE AS $$
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM public.document_chunks dc
  JOIN public.knowledge_documents kd ON dc.document_id = kd.id
  WHERE kd.is_active = true
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- C. Vector Semantic Similarity Search (Knowledge Base 768-dim)
CREATE OR REPLACE FUNCTION public.match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  document_name text,
  content_chunk text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    k.id,
    k.document_name,
    k.content_chunk,
    k.metadata,
    1 - (k.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_base_documents k
  WHERE 1 - (k.embedding <=> query_embedding) > match_threshold
  ORDER BY k.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- D. Deteksi Wilayah Spasial Administratif Otomatis dari GeoJSON
CREATE OR REPLACE FUNCTION public.detect_wilayah_from_geojson(user_geojson jsonb)
RETURNS TABLE (
  kecamatan_id text,
  nama_kecamatan text,
  desa_id text,
  nama_desa text
) LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(k.id::text, k.id_kecamatan::text, '')::text AS kecamatan_id,
    COALESCE(k.nama_kecamatan::text, k.name::text, k.kecamatan::text, '')::text AS nama_kecamatan,
    COALESCE(d.id::text, d.id_desa::text, '')::text AS desa_id,
    COALESCE(d.nama_desa::text, d.name::text, d.desa::text, '')::text AS nama_desa
  FROM public.gis_desa d
  LEFT JOIN public.gis_kecamatan k ON (
    d.kecamatan_id::text = k.id::text OR 
    d.id_kecamatan::text = k.id::text OR
    d.id_kecamatan::text = k.id_kecamatan::text OR
    LOWER(TRIM(REGEXP_REPLACE(d.kecamatan, '^(kec\.?|kecamatan)\s*', '', 'i'))) = LOWER(TRIM(REGEXP_REPLACE(k.nama_kecamatan, '^(kec\.?|kecamatan)\s*', '', 'i'))) OR
    LOWER(TRIM(REGEXP_REPLACE(d.kecamatan, '^(kec\.?|kecamatan)\s*', '', 'i'))) = LOWER(TRIM(REGEXP_REPLACE(k.name, '^(kec\.?|kecamatan)\s*', '', 'i')))
  )
  WHERE ST_Intersects(
    d.geom, 
    ST_SetSRID(ST_GeomFromGeoJSON(user_geojson::text), 4326)
  )
  LIMIT 1;
END;
$$;

-- -----------------------------------------------------------------------------------------
-- 15. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------------------
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename IN (
            'profiles', 'investments', 'gis_potensi_investasi', 'financials', 'legalities',
            'locations', 'media_assets', 'investment_scores', 'gis_pkkpr', 'investment_interests',
            'satgas_decisions', 'pengaduan', 'pengaduan_evidence', 'investor_testimonials',
            'site_settings', 'audit_logs', 'operators', 'system_logs', 'gis_kecamatan',
            'gis_desa', 'gis_infrastruktur', 'gis_zonasi', 'gis_sawah', 'gis_jalan',
            'gis_sungai', 'gis_mangrove', 'gis_tambak', 'infrastructure_points',
            'luwu_das_hydrology', 'spatial_history', 'knowledge_documents', 'document_chunks',
            'knowledge_base_documents', 'mpp_citizens', 'mpp_tenants', 'mpp_tenant_users',
            'mpp_services', 'mpp_queues', 'mpp_document_tracking', 'mpp_tracking_history',
            'mpp_skm', 'mpp_facilities', 'mpp_umkm', 'mpp_flow', 'mpp_contacts',
            'mpp_fo_requests', 'mpp_reprimands', 'news'
          )
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
        
        -- Public / Anonymous Select Access (Read)
        EXECUTE format('DROP POLICY IF EXISTS "Public Read Access %I" ON public.%I;', t, t);
        EXECUTE format('CREATE POLICY "Public Read Access %I" ON public.%I FOR SELECT USING (true);', t, t);
        
        -- Full Access for Authenticated Roles
        EXECUTE format('DROP POLICY IF EXISTS "Auth Full Access %I" ON public.%I;', t, t);
        EXECUTE format('CREATE POLICY "Auth Full Access %I" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true);', t, t);
    END LOOP;
END $$;

-- -----------------------------------------------------------------------------------------
-- 16. STORAGE BUCKETS SETUP (FOTO, DOKUMEN PKKPR, KTP, MEDIA INVESTASI)
-- -----------------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('hero-assets', 'hero-assets', true),
  ('ktp_masyarakat', 'ktp_masyarakat', true),
  ('pengaduan_evidence', 'pengaduan_evidence', true),
  ('investments', 'investments', true),
  ('pkkpr_documents', 'pkkpr_documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public Storage Read" ON storage.objects;
CREATE POLICY "Public Storage Read"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id IN ('hero-assets', 'ktp_masyarakat', 'pengaduan_evidence', 'investments', 'pkkpr_documents') );

DROP POLICY IF EXISTS "Public Storage Insert" ON storage.objects;
CREATE POLICY "Public Storage Insert"
ON storage.objects FOR INSERT
TO public
WITH CHECK ( bucket_id IN ('hero-assets', 'ktp_masyarakat', 'pengaduan_evidence', 'investments', 'pkkpr_documents') );

DROP POLICY IF EXISTS "Auth Storage Update" ON storage.objects;
CREATE POLICY "Auth Storage Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id IN ('hero-assets', 'ktp_masyarakat', 'pengaduan_evidence', 'investments', 'pkkpr_documents') );

DROP POLICY IF EXISTS "Auth Storage Delete" ON storage.objects;
CREATE POLICY "Auth Storage Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id IN ('hero-assets', 'ktp_masyarakat', 'pengaduan_evidence', 'investments', 'pkkpr_documents') );

-- -----------------------------------------------------------------------------------------
-- 17. AKTIFKAN SUPABASE REALTIME REPLICATION
-- -----------------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  ALTER PUBLICATION supabase_realtime ADD TABLE 
    public.investments,
    public.gis_potensi_investasi,
    public.gis_pkkpr,
    public.mpp_queues,
    public.mpp_fo_requests,
    public.mpp_reprimands,
    public.news,
    public.pengaduan;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Notice konfigurasi Realtime: %', SQLERRM;
END $$;
