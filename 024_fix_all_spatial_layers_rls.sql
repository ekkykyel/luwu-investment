-- =========================================================================
-- Migration 024: Kebijakan RLS Universal Seluruh Layer Spasial Luwu
-- Membuka Akses SELECT, UPDATE, INSERT, dan DELETE untuk role
-- anon dan authenticated pada seluruh tabel spasial PostGIS Kabupaten Luwu.
-- =========================================================================

-- =========================================================================
-- 1. gis_zonasi (Pola Ruang / RTRW)
-- =========================================================================
ALTER TABLE public.gis_zonasi ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable SELECT for anon and authenticated" ON public.gis_zonasi;
DROP POLICY IF EXISTS "Allow read access for all users" ON public.gis_zonasi;
CREATE POLICY "Enable SELECT for anon and authenticated" ON public.gis_zonasi FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Enable UPDATE for anon and authenticated" ON public.gis_zonasi;
DROP POLICY IF EXISTS "Allow update access for all users" ON public.gis_zonasi;
CREATE POLICY "Enable UPDATE for anon and authenticated" ON public.gis_zonasi FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable INSERT for anon and authenticated" ON public.gis_zonasi;
DROP POLICY IF EXISTS "Allow insert access for all users" ON public.gis_zonasi;
CREATE POLICY "Enable INSERT for anon and authenticated" ON public.gis_zonasi FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable DELETE for anon and authenticated" ON public.gis_zonasi;
DROP POLICY IF EXISTS "Allow delete access for all users" ON public.gis_zonasi;
CREATE POLICY "Enable DELETE for anon and authenticated" ON public.gis_zonasi FOR DELETE TO anon, authenticated USING (true);

-- =========================================================================
-- 2. gis_sawah (Lahan Pertanian Basah & LP2B)
-- =========================================================================
ALTER TABLE public.gis_sawah ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable SELECT for anon and authenticated" ON public.gis_sawah;
DROP POLICY IF EXISTS "Allow read access for all users" ON public.gis_sawah;
CREATE POLICY "Enable SELECT for anon and authenticated" ON public.gis_sawah FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Enable UPDATE for anon and authenticated" ON public.gis_sawah;
DROP POLICY IF EXISTS "Allow update access for all users" ON public.gis_sawah;
CREATE POLICY "Enable UPDATE for anon and authenticated" ON public.gis_sawah FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable INSERT for anon and authenticated" ON public.gis_sawah;
DROP POLICY IF EXISTS "Allow insert access for all users" ON public.gis_sawah;
CREATE POLICY "Enable INSERT for anon and authenticated" ON public.gis_sawah FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable DELETE for anon and authenticated" ON public.gis_sawah;
DROP POLICY IF EXISTS "Allow delete access for all users" ON public.gis_sawah;
CREATE POLICY "Enable DELETE for anon and authenticated" ON public.gis_sawah FOR DELETE TO anon, authenticated USING (true);

-- =========================================================================
-- 3. gis_mangrove (Hutan Lindung Mangrove & Pesisir)
-- =========================================================================
ALTER TABLE public.gis_mangrove ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable SELECT for anon and authenticated" ON public.gis_mangrove;
DROP POLICY IF EXISTS "Allow read access for all users" ON public.gis_mangrove;
CREATE POLICY "Enable SELECT for anon and authenticated" ON public.gis_mangrove FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Enable UPDATE for anon and authenticated" ON public.gis_mangrove;
DROP POLICY IF EXISTS "Allow update access for all users" ON public.gis_mangrove;
CREATE POLICY "Enable UPDATE for anon and authenticated" ON public.gis_mangrove FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable INSERT for anon and authenticated" ON public.gis_mangrove;
DROP POLICY IF EXISTS "Allow insert access for all users" ON public.gis_mangrove;
CREATE POLICY "Enable INSERT for anon and authenticated" ON public.gis_mangrove FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable DELETE for anon and authenticated" ON public.gis_mangrove;
DROP POLICY IF EXISTS "Allow delete access for all users" ON public.gis_mangrove;
CREATE POLICY "Enable DELETE for anon and authenticated" ON public.gis_mangrove FOR DELETE TO anon, authenticated USING (true);

-- =========================================================================
-- 4. gis_tambak (Kawasan Budidaya Tambak & Pesisir)
-- =========================================================================
ALTER TABLE public.gis_tambak ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable SELECT for anon and authenticated" ON public.gis_tambak;
DROP POLICY IF EXISTS "Allow read access for all users" ON public.gis_tambak;
CREATE POLICY "Enable SELECT for anon and authenticated" ON public.gis_tambak FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Enable UPDATE for anon and authenticated" ON public.gis_tambak;
DROP POLICY IF EXISTS "Allow update access for all users" ON public.gis_tambak;
CREATE POLICY "Enable UPDATE for anon and authenticated" ON public.gis_tambak FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable INSERT for anon and authenticated" ON public.gis_tambak;
DROP POLICY IF EXISTS "Allow insert access for all users" ON public.gis_tambak;
CREATE POLICY "Enable INSERT for anon and authenticated" ON public.gis_tambak FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable DELETE for anon and authenticated" ON public.gis_tambak;
DROP POLICY IF EXISTS "Allow delete access for all users" ON public.gis_tambak;
CREATE POLICY "Enable DELETE for anon and authenticated" ON public.gis_tambak FOR DELETE TO anon, authenticated USING (true);

-- =========================================================================
-- 5. gis_lahankeringprimer (Kawasan Lindung & Hutan Primer)
-- =========================================================================
ALTER TABLE public.gis_lahankeringprimer ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable SELECT for anon and authenticated" ON public.gis_lahankeringprimer;
DROP POLICY IF EXISTS "Allow read access for all users" ON public.gis_lahankeringprimer;
CREATE POLICY "Enable SELECT for anon and authenticated" ON public.gis_lahankeringprimer FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Enable UPDATE for anon and authenticated" ON public.gis_lahankeringprimer;
DROP POLICY IF EXISTS "Allow update access for all users" ON public.gis_lahankeringprimer;
CREATE POLICY "Enable UPDATE for anon and authenticated" ON public.gis_lahankeringprimer FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable INSERT for anon and authenticated" ON public.gis_lahankeringprimer;
DROP POLICY IF EXISTS "Allow insert access for all users" ON public.gis_lahankeringprimer;
CREATE POLICY "Enable INSERT for anon and authenticated" ON public.gis_lahankeringprimer FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable DELETE for anon and authenticated" ON public.gis_lahankeringprimer;
DROP POLICY IF EXISTS "Allow delete access for all users" ON public.gis_lahankeringprimer;
CREATE POLICY "Enable DELETE for anon and authenticated" ON public.gis_lahankeringprimer FOR DELETE TO anon, authenticated USING (true);

-- =========================================================================
-- 6. gis_lahankeringsekunder (Lahan Kering Sekunder & Perkebunan)
-- =========================================================================
ALTER TABLE public.gis_lahankeringsekunder ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable SELECT for anon and authenticated" ON public.gis_lahankeringsekunder;
DROP POLICY IF EXISTS "Allow read access for all users" ON public.gis_lahankeringsekunder;
CREATE POLICY "Enable SELECT for anon and authenticated" ON public.gis_lahankeringsekunder FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Enable UPDATE for anon and authenticated" ON public.gis_lahankeringsekunder;
DROP POLICY IF EXISTS "Allow update access for all users" ON public.gis_lahankeringsekunder;
CREATE POLICY "Enable UPDATE for anon and authenticated" ON public.gis_lahankeringsekunder FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable INSERT for anon and authenticated" ON public.gis_lahankeringsekunder;
DROP POLICY IF EXISTS "Allow insert access for all users" ON public.gis_lahankeringsekunder;
CREATE POLICY "Enable INSERT for anon and authenticated" ON public.gis_lahankeringsekunder FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable DELETE for anon and authenticated" ON public.gis_lahankeringsekunder;
DROP POLICY IF EXISTS "Allow delete access for all users" ON public.gis_lahankeringsekunder;
CREATE POLICY "Enable DELETE for anon and authenticated" ON public.gis_lahankeringsekunder FOR DELETE TO anon, authenticated USING (true);

-- =========================================================================
-- 7. gis_sungai (Hidrologi & Sungai Utama)
-- =========================================================================
ALTER TABLE public.gis_sungai ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable SELECT for anon and authenticated" ON public.gis_sungai;
DROP POLICY IF EXISTS "Allow read access for all users" ON public.gis_sungai;
CREATE POLICY "Enable SELECT for anon and authenticated" ON public.gis_sungai FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Enable UPDATE for anon and authenticated" ON public.gis_sungai;
DROP POLICY IF EXISTS "Allow update access for all users" ON public.gis_sungai;
CREATE POLICY "Enable UPDATE for anon and authenticated" ON public.gis_sungai FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable INSERT for anon and authenticated" ON public.gis_sungai;
DROP POLICY IF EXISTS "Allow insert access for all users" ON public.gis_sungai;
CREATE POLICY "Enable INSERT for anon and authenticated" ON public.gis_sungai FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable DELETE for anon and authenticated" ON public.gis_sungai;
DROP POLICY IF EXISTS "Allow delete access for all users" ON public.gis_sungai;
CREATE POLICY "Enable DELETE for anon and authenticated" ON public.gis_sungai FOR DELETE TO anon, authenticated USING (true);

-- =========================================================================
-- 8. gis_pkkpr (Plotting PKKPR & Kesesuaian Ruang)
-- =========================================================================
ALTER TABLE public.gis_pkkpr ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable SELECT for anon and authenticated" ON public.gis_pkkpr;
DROP POLICY IF EXISTS "Allow read access for all users" ON public.gis_pkkpr;
CREATE POLICY "Enable SELECT for anon and authenticated" ON public.gis_pkkpr FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Enable UPDATE for anon and authenticated" ON public.gis_pkkpr;
DROP POLICY IF EXISTS "Allow update access for all users" ON public.gis_pkkpr;
CREATE POLICY "Enable UPDATE for anon and authenticated" ON public.gis_pkkpr FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable INSERT for anon and authenticated" ON public.gis_pkkpr;
DROP POLICY IF EXISTS "Allow insert access for all users" ON public.gis_pkkpr;
CREATE POLICY "Enable INSERT for anon and authenticated" ON public.gis_pkkpr FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable DELETE for anon and authenticated" ON public.gis_pkkpr;
DROP POLICY IF EXISTS "Allow delete access for all users" ON public.gis_pkkpr;
CREATE POLICY "Enable DELETE for anon and authenticated" ON public.gis_pkkpr FOR DELETE TO anon, authenticated USING (true);

-- =========================================================================
-- 9. gis_infrastruktur (Infrastruktur Wilayah & Utilitas)
-- =========================================================================
ALTER TABLE public.gis_infrastruktur ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable SELECT for anon and authenticated" ON public.gis_infrastruktur;
DROP POLICY IF EXISTS "Allow read access for all users" ON public.gis_infrastruktur;
CREATE POLICY "Enable SELECT for anon and authenticated" ON public.gis_infrastruktur FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Enable UPDATE for anon and authenticated" ON public.gis_infrastruktur;
DROP POLICY IF EXISTS "Allow update access for all users" ON public.gis_infrastruktur;
CREATE POLICY "Enable UPDATE for anon and authenticated" ON public.gis_infrastruktur FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable INSERT for anon and authenticated" ON public.gis_infrastruktur;
DROP POLICY IF EXISTS "Allow insert access for all users" ON public.gis_infrastruktur;
CREATE POLICY "Enable INSERT for anon and authenticated" ON public.gis_infrastruktur FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable DELETE for anon and authenticated" ON public.gis_infrastruktur;
DROP POLICY IF EXISTS "Allow delete access for all users" ON public.gis_infrastruktur;
CREATE POLICY "Enable DELETE for anon and authenticated" ON public.gis_infrastruktur FOR DELETE TO anon, authenticated USING (true);

-- =========================================================================
-- 10. gis_potensi_investasi (Lahan Potensi Investasi Luwu)
-- =========================================================================
ALTER TABLE public.gis_potensi_investasi ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable SELECT for anon and authenticated" ON public.gis_potensi_investasi;
DROP POLICY IF EXISTS "Allow read access for all users" ON public.gis_potensi_investasi;
CREATE POLICY "Enable SELECT for anon and authenticated" ON public.gis_potensi_investasi FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Enable UPDATE for anon and authenticated" ON public.gis_potensi_investasi;
DROP POLICY IF EXISTS "Allow update access for all users" ON public.gis_potensi_investasi;
CREATE POLICY "Enable UPDATE for anon and authenticated" ON public.gis_potensi_investasi FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable INSERT for anon and authenticated" ON public.gis_potensi_investasi;
DROP POLICY IF EXISTS "Allow insert access for all users" ON public.gis_potensi_investasi;
CREATE POLICY "Enable INSERT for anon and authenticated" ON public.gis_potensi_investasi FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable DELETE for anon and authenticated" ON public.gis_potensi_investasi;
DROP POLICY IF EXISTS "Allow delete access for all users" ON public.gis_potensi_investasi;
CREATE POLICY "Enable DELETE for anon and authenticated" ON public.gis_potensi_investasi FOR DELETE TO anon, authenticated USING (true);

-- =========================================================================
-- 11. gis_kecamatan & gis_desa (Batas Wilayah Administrasi)
-- =========================================================================
ALTER TABLE public.gis_kecamatan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable SELECT for anon and authenticated" ON public.gis_kecamatan;
CREATE POLICY "Enable SELECT for anon and authenticated" ON public.gis_kecamatan FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Enable UPDATE for anon and authenticated" ON public.gis_kecamatan;
CREATE POLICY "Enable UPDATE for anon and authenticated" ON public.gis_kecamatan FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Enable INSERT for anon and authenticated" ON public.gis_kecamatan;
CREATE POLICY "Enable INSERT for anon and authenticated" ON public.gis_kecamatan FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Enable DELETE for anon and authenticated" ON public.gis_kecamatan;
CREATE POLICY "Enable DELETE for anon and authenticated" ON public.gis_kecamatan FOR DELETE TO anon, authenticated USING (true);

ALTER TABLE public.gis_desa ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable SELECT for anon and authenticated" ON public.gis_desa;
CREATE POLICY "Enable SELECT for anon and authenticated" ON public.gis_desa FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Enable UPDATE for anon and authenticated" ON public.gis_desa;
CREATE POLICY "Enable UPDATE for anon and authenticated" ON public.gis_desa FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Enable INSERT for anon and authenticated" ON public.gis_desa;
CREATE POLICY "Enable INSERT for anon and authenticated" ON public.gis_desa FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Enable DELETE for anon and authenticated" ON public.gis_desa;
CREATE POLICY "Enable DELETE for anon and authenticated" ON public.gis_desa FOR DELETE TO anon, authenticated USING (true);
