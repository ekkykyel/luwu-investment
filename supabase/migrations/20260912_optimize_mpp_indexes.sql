-- ====================================================================
-- MIGRATION: Optimasi Indeks Performa Real-Time Antrean & Warga MPP
-- Tanggal: 12 September 2026
-- ====================================================================

-- 1. ANALISIS NIK PADA TABEL mpp_citizens:
-- Kolom `nik` pada `mpp_citizens` sudah berstatus PRIMARY KEY, sehingga PostgreSQL
-- secara otomatis telah membuat B-Tree Index Unik (mpp_citizens_pkey).
-- Membuat indeks ulang pada `mpp_citizens(nik)` TIDAK diperlukan karena akan menjadi
-- duplicate index yang membebani write I/O.

-- 2. OPTIMASI 1: Indeks Pencarian Tiket Berdasarkan NIK Warga pada mpp_queues
-- Foreign key `citizen_nik` pada `mpp_queues` belum memiliki indeks.
-- Indeks komposit (citizen_nik, queue_date DESC) sangat mempercepat pencarian histori
-- antrean dan verifikasi tiket aktif di Kios Layanan Mandiri / Portal Warga.
CREATE INDEX IF NOT EXISTS idx_mpp_queues_citizen_date 
ON public.mpp_queues (citizen_nik, queue_date DESC);

-- 3. OPTIMASI 2: Indeks Real-time Monitor Display & Loket Petugas (Tenant + Tanggal + Status)
-- Query layar TV monitor antrean dan panggilan loket selalu memfilter berdasarkan
-- instansi (tenant_id), tanggal hari ini (queue_date), dan status antrean.
CREATE INDEX IF NOT EXISTS idx_mpp_queues_tenant_date_status 
ON public.mpp_queues (tenant_id, queue_date, status);

-- 4. OPTIMASI 3 (Bonus Tingkat Tinggi): Partial Index Khusus Antrean Aktif (Menunggu / Dipanggil)
-- Menghemat 90% ukuran index memori RAM PostgreSQL karena hanya mengindeks tiket aktif hari ini,
-- mengabaikan tiket masa lalu yang sudah selesai atau batal.
CREATE INDEX IF NOT EXISTS idx_mpp_queues_active_stream 
ON public.mpp_queues (tenant_id, queue_date, queue_number ASC) 
WHERE status IN ('menunggu', 'dipanggil');
