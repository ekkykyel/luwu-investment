-- =========================================================================
-- Migration 023: Membuka Akses RLS UPDATE dan INSERT pada Tabel gis_jalan
-- Eksekusi di Supabase SQL Editor untuk memungkinkan Editor Spasial PUPTR
-- melakukan pembaruan geometri jaringan jalan secara langsung.
-- =========================================================================

-- 1. Pastikan Row Level Security aktif
ALTER TABLE public.gis_jalan ENABLE ROW LEVEL SECURITY;

-- 2. Kebijakan SELECT (Akses Baca Publik & Terautentikasi)
DROP POLICY IF EXISTS "Enable SELECT for anon and authenticated" ON public.gis_jalan;
DROP POLICY IF EXISTS "Allow read access for all users" ON public.gis_jalan;
CREATE POLICY "Enable SELECT for anon and authenticated" 
ON public.gis_jalan 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- 3. Kebijakan UPDATE (Akses Ubah Geometri & Atribut Ruas Jalan)
DROP POLICY IF EXISTS "Enable UPDATE for anon and authenticated" ON public.gis_jalan;
DROP POLICY IF EXISTS "Allow update access for all users" ON public.gis_jalan;
CREATE POLICY "Enable UPDATE for anon and authenticated" 
ON public.gis_jalan 
FOR UPDATE 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- 4. Kebijakan INSERT (Akses Tambah Ruas Jalan Baru)
-- Catatan PostgreSQL: Klausa INSERT hanya mengizinkan WITH CHECK, tidak boleh menggunakan USING
DROP POLICY IF EXISTS "Enable INSERT for anon and authenticated" ON public.gis_jalan;
DROP POLICY IF EXISTS "Allow insert access for all users" ON public.gis_jalan;
CREATE POLICY "Enable INSERT for anon and authenticated" 
ON public.gis_jalan 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- 5. Kebijakan DELETE (Akses Hapus Ruas Jalan)
DROP POLICY IF EXISTS "Enable DELETE for anon and authenticated" ON public.gis_jalan;
DROP POLICY IF EXISTS "Allow delete access for all users" ON public.gis_jalan;
CREATE POLICY "Enable DELETE for anon and authenticated" 
ON public.gis_jalan 
FOR DELETE 
TO anon, authenticated 
USING (true);
