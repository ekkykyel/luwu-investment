-- Migration: Add gender and occupation to mpp_citizens for IKM Report requirements (Permen PAN & RB No. 14 Tahun 2017)

ALTER TABLE public.mpp_citizens
ADD COLUMN IF NOT EXISTS gender VARCHAR(50),
ADD COLUMN IF NOT EXISTS occupation VARCHAR(100);

-- Provide initial default values if you want to backfill existing records (optional)
-- UPDATE public.mpp_citizens SET gender = 'Tidak Diketahui' WHERE gender IS NULL;
