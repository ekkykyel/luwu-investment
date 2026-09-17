-- Migrasi Database Supabase: Menambahkan kolom status_publikasi pada tabel gis_infrastruktur
-- Silakan jalankan script ini di menu "SQL Editor" pada Supabase Dashboard Anda.

ALTER TABLE public.gis_infrastruktur 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'Draft';

-- Jika tabel menggunakan RLS, pastikan policy untuk update mengizinkan kolom ini
-- (Opsional, jika belum ada RLS yang cover update status)
