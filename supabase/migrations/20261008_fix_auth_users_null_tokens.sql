-- ==============================================================================
-- MIGRASI PERBAIKAN: MENGATASI "Database error querying schema" PADA SUPABASE AUTH
-- ==============================================================================
-- Penyebab: GoTrue Auth server (v2.197+) gagal melakukan validasi skema jika
-- terdapat nilai NULL pada kolom token di tabel auth.users (akibat manual SQL insert/update).
-- Solusi: Update semua kolom token NULL menjadi empty string ('') agar query GoTrue valid.

UPDATE auth.users 
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE 
  confirmation_token IS NULL OR
  recovery_token IS NULL OR
  email_change_token_new IS NULL OR
  email_change IS NULL OR
  phone_change IS NULL OR
  phone_change_token IS NULL OR
  email_change_token_current IS NULL OR
  reauthentication_token IS NULL;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
