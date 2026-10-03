-- Migration: Add 9 IKM indicators to mpp_skm table

ALTER TABLE public.mpp_skm
ADD COLUMN IF NOT EXISTS q1_persyaratan INTEGER CHECK (q1_persyaratan >= 1 AND q1_persyaratan <= 4),
ADD COLUMN IF NOT EXISTS q2_prosedur INTEGER CHECK (q2_prosedur >= 1 AND q2_prosedur <= 4),
ADD COLUMN IF NOT EXISTS q3_waktu INTEGER CHECK (q3_waktu >= 1 AND q3_waktu <= 4),
ADD COLUMN IF NOT EXISTS q4_biaya INTEGER CHECK (q4_biaya >= 1 AND q4_biaya <= 4),
ADD COLUMN IF NOT EXISTS q5_produk INTEGER CHECK (q5_produk >= 1 AND q5_produk <= 4),
ADD COLUMN IF NOT EXISTS q6_kompetensi INTEGER CHECK (q6_kompetensi >= 1 AND q6_kompetensi <= 4),
ADD COLUMN IF NOT EXISTS q7_perilaku INTEGER CHECK (q7_perilaku >= 1 AND q7_perilaku <= 4),
ADD COLUMN IF NOT EXISTS q8_sarpras INTEGER CHECK (q8_sarpras >= 1 AND q8_sarpras <= 4),
ADD COLUMN IF NOT EXISTS q9_pengaduan INTEGER CHECK (q9_pengaduan >= 1 AND q9_pengaduan <= 4);
