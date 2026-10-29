-- ============================================================================
-- SKEMA TABEL BERITA (NEWS) & KEBIJAKAN ROW-LEVEL SECURITY (RLS) SUPABASE
-- Portal Mal Pelayanan Publik (MPP) Simpurusiang - Pemkab Luwu
-- ============================================================================

-- 1. Buat Tabel News jika belum ada
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
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Buat Index untuk Performa Query Cepat
CREATE INDEX IF NOT EXISTS idx_news_status_created_at ON public.news(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON public.news(category);
CREATE INDEX IF NOT EXISTS idx_news_is_pinned ON public.news(is_pinned);

-- 3. Aktifkan Row-Level Security (RLS)
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- 4. Buat Kebijakan RLS (Public Read & Admin Write)
-- Kebijakan 1: Akses Baca Publik (Anonim & Terautentikasi dapat membaca berita published)
DROP POLICY IF EXISTS "Allow public read published news" ON public.news;
CREATE POLICY "Allow public read published news"
ON public.news
FOR SELECT
USING (
    status = 'published' 
    OR auth.role() = 'authenticated'
);

-- Kebijakan 2: Akses Manajemen Berita (Admin / Authenticated dapat Insert, Update, Delete)
DROP POLICY IF EXISTS "Allow authenticated admin manage news" ON public.news;
CREATE POLICY "Allow authenticated admin manage news"
ON public.news
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Trigger Pembaruan Kolom updated_at secara Otomatis
CREATE OR REPLACE FUNCTION update_news_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_news_updated_at ON public.news;
CREATE TRIGGER trg_news_updated_at
    BEFORE UPDATE ON public.news
    FOR EACH ROW
    EXECUTE FUNCTION update_news_updated_at();
