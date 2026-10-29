-- ==============================================================================
-- Migration: 20260918_mpp_facilities_rls.sql
-- Description: Standardizes mpp_facilities schema, enables Row-Level Security (RLS),
--              and grants public read access to guest/anon sessions and full access
--              to authenticated administrative personnel.
-- ==============================================================================

-- 1. Create table mpp_facilities if it doesn't already exist
CREATE TABLE IF NOT EXISTS public.mpp_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    floor TEXT DEFAULT 'Lantai 1',
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_mpp_facilities_created_at ON public.mpp_facilities(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_mpp_facilities_name ON public.mpp_facilities(name);

-- 3. Enable Row-Level Security
ALTER TABLE public.mpp_facilities ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing conflicting policies if any to prevent duplicate errors
DROP POLICY IF EXISTS "Allow public read access for mpp_facilities" ON public.mpp_facilities;
DROP POLICY IF EXISTS "Allow authenticated insert for mpp_facilities" ON public.mpp_facilities;
DROP POLICY IF EXISTS "Allow authenticated update for mpp_facilities" ON public.mpp_facilities;
DROP POLICY IF EXISTS "Allow authenticated delete for mpp_facilities" ON public.mpp_facilities;
DROP POLICY IF EXISTS "Allow authenticated full access for mpp_facilities" ON public.mpp_facilities;
DROP POLICY IF EXISTS "Allow public read-only access for mpp_facilities" ON public.mpp_facilities;

-- 5. Create Permissive Policy for Public Guest Reading (anon & authenticated)
CREATE POLICY "Allow public read access for mpp_facilities"
ON public.mpp_facilities
FOR SELECT
TO anon, authenticated
USING (true);

-- 6. Create Policy for Authenticated Admin Operations (Insert, Update, Delete)
CREATE POLICY "Allow authenticated full access for mpp_facilities"
ON public.mpp_facilities
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 7. Grant necessary permissions on table
GRANT SELECT ON public.mpp_facilities TO anon;
GRANT ALL ON public.mpp_facilities TO authenticated;
GRANT ALL ON public.mpp_facilities TO service_role;

-- 8. Seed the 9 Official Standard Facilities if table is empty or missing them
INSERT INTO public.mpp_facilities (name, floor, description, image_url)
SELECT 
    'Executive Lounge & Ruang Tunggu VIP',
    'Lantai 1',
    'Fasilitas ruang tunggu eksklusif berstandar hotel berbintang di MPP Simpurusiang Kabupaten Luwu. Didesain untuk memberikan relaksasi maksimal bagi pemohon izin, perwakilan korporasi, dan calon investor dengan suasana tenang, penyejuk ruangan sentral, sajian kopi khas pegunungan Luwu, serta stasiun pengisian daya gawai berkecepatan tinggi.',
    'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=1200'
WHERE NOT EXISTS (
    SELECT 1 FROM public.mpp_facilities WHERE LOWER(name) LIKE '%lounge%' OR LOWER(name) LIKE '%vip%'
);

INSERT INTO public.mpp_facilities (name, floor, description, image_url)
SELECT 
    'Ruang Laktasi & Ibu Menyusui',
    'Lantai 1',
    'Fasilitas privat, higienis, dan ramah keluarga di MPP Simpurusiang Kabupaten Luwu. Menyediakan lingkungan yang tenang, aman, dan berhawa sejuk bagi ibu yang sedang menyusui atau memompa ASI saat mengurus layanan publik, dilengkapi wastafel cuci tangan steril, kulkas penyimpanan ASI, serta meja ganti popok khusus.',
    'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&q=80&w=1200'
WHERE NOT EXISTS (
    SELECT 1 FROM public.mpp_facilities WHERE LOWER(name) LIKE '%laktasi%' OR LOWER(name) LIKE '%menyusui%'
);

INSERT INTO public.mpp_facilities (name, floor, description, image_url)
SELECT 
    'Kids Play Zone & Arena Bermain Anak',
    'Lantai 1',
    'Wahana interaktif ramah anak yang dirancang aman, bersih, dan mendidik. Dilengkapi alas busa anti-benturan berstandar SNI, aneka mainan edukatif kayu, buku bergambar satwa endemik Luwu, serta pengawasan CCTV agar orang tua dapat mengurus perizinan dengan tenang tanpa khawatir sang buah hati rewel.',
    'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&q=80&w=1200'
WHERE NOT EXISTS (
    SELECT 1 FROM public.mpp_facilities WHERE LOWER(name) LIKE '%kids%' OR LOWER(name) LIKE '%anak%'
);

INSERT INTO public.mpp_facilities (name, floor, description, image_url)
SELECT 
    'Galeri Promosi UMKM & Produk Unggulan Luwu',
    'Lantai 1',
    'Etalase kebanggaan produk lokal unggulan hasil karya pelaku usaha mikro, kecil, dan menengah binaan Kabupaten Luwu. Menampilkan komoditas kopi khas Latimojong & Bastem, kerajinan tenun tradisional, aneka olahan sagu premium, hingga produk panganan kemasan bersertifikat halal dan izin edar resmi P-IRT.',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200'
WHERE NOT EXISTS (
    SELECT 1 FROM public.mpp_facilities WHERE LOWER(name) LIKE '%umkm%' OR LOWER(name) LIKE '%galeri%'
);

INSERT INTO public.mpp_facilities (name, floor, description, image_url)
SELECT 
    'Musholla & Sarana Ibadah Representatif',
    'Lantai 1 & 2',
    'Ruang ibadah yang luas, bersih, dan hening untuk kenyamanan beribadah para pengunjung serta aparatur pelayanan publik. Dilengkapi tempat wudhu terpisah untuk pria dan wanita dengan sirkulasi air yang lancar, sajadah tebal bersih, mukena/sarung terawat, penyejuk ruangan, serta penunjuk arah kiblat akurat.',
    'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80&w=1200'
WHERE NOT EXISTS (
    SELECT 1 FROM public.mpp_facilities WHERE LOWER(name) LIKE '%musholla%' OR LOWER(name) LIKE '%ibadah%'
);

INSERT INTO public.mpp_facilities (name, floor, description, image_url)
SELECT 
    'E-Kiosk Antrean & Layanan Mandiri Digital',
    'Lantai 1',
    'Anjungan digital layar sentuh interaktif untuk pengambilan tiket nomor antrean terintegrasi, pendaftaran online, cetak mandiri bukti tanda terima perizinan, hingga penelusuran status berkas (tracking status) melalui pemindaian kode QR secara cepat tanpa perlu antre di loket informasi.',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200'
WHERE NOT EXISTS (
    SELECT 1 FROM public.mpp_facilities WHERE LOWER(name) LIKE '%kiosk%' OR LOWER(name) LIKE '%mandiri%'
);

INSERT INTO public.mpp_facilities (name, floor, description, image_url)
SELECT 
    'Pojok Baca Digital & Ruang Literasi',
    'Lantai 2',
    'Ruang literasi modern hasil kolaborasi dengan Dinas Perpustakaan dan Kearsipan Daerah Kabupaten Luwu. Menyediakan tablet e-library dengan ribuan koleksi buku digital, majalah terbitan berkala pemerintah, buku statistik investasi daerah, serta sudut membaca yang estetik dan tenang.',
    'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=1200'
WHERE NOT EXISTS (
    SELECT 1 FROM public.mpp_facilities WHERE LOWER(name) LIKE '%baca%' OR LOWER(name) LIKE '%literasi%'
);

INSERT INTO public.mpp_facilities (name, floor, description, image_url)
SELECT 
    'Fasilitas Ramah Disabilitas & Jalur Prioritas',
    'Lantai 1 & 2',
    'Dedikasi penuh MPP Simpurusiang dalam mewujudkan pelayanan publik inklusif tanpa diskriminasi. Menyediakan ramp landai berkursi roda, jalur pemandu tuna netra (guiding block), toilet khusus difabel dengan pegangan pengaman, kursi roda gratis di pintu masuk, loket meja rendah, serta petugas pendamping khusus.',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1200'
WHERE NOT EXISTS (
    SELECT 1 FROM public.mpp_facilities WHERE LOWER(name) LIKE '%disabilitas%' OR LOWER(name) LIKE '%difabel%'
);

INSERT INTO public.mpp_facilities (name, floor, description, image_url)
SELECT 
    'Helpdesk Konsultasi & Meja Pengaduan Terpadu',
    'Lantai 1',
    'Kanal tatap muka langsung bagi pemohon layanan yang membutuhkan advokasi perizinan, konsultasi regulasi investasi daerah, klarifikasi berkas teknis, maupun penyampaian saran dan aduan pelayanan yang langsung ditindaklanjuti oleh Tim Satgas Pengawasan Internal dan terhubung ke sistem nasional SP4N-LAPOR!.',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1200'
WHERE NOT EXISTS (
    SELECT 1 FROM public.mpp_facilities WHERE LOWER(name) LIKE '%pengaduan%' OR LOWER(name) LIKE '%helpdesk%'
);
