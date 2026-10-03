-- ====================================================================================
-- SCRIPT UNTUK MENGAKTIFKAN "ON DELETE CASCADE" PADA TABEL RELASI INVESTASI
-- ====================================================================================

DO $$ 
DECLARE 
    fk_record record;
BEGIN
    -- 1. Drop semua foreign key yang mengarah ke tabel investments
    FOR fk_record IN 
        SELECT tc.table_name, tc.constraint_name 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND ccu.table_name = 'investments'
    LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', fk_record.table_name, fk_record.constraint_name);
    END LOOP;

    -- 2. Tambahkan kembali foreign key dengan aturan ON DELETE CASCADE
    
    -- gis_potensi_investasi (Kolom: id)
    ALTER TABLE gis_potensi_investasi
    ADD CONSTRAINT gis_potensi_investasi_id_fkey
    FOREIGN KEY (id) REFERENCES investments(id) ON DELETE CASCADE;

    -- financials (Kolom: project_id)
    ALTER TABLE financials
    ADD CONSTRAINT financials_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES investments(id) ON DELETE CASCADE;

    -- legalities (Kolom: project_id)
    ALTER TABLE legalities
    ADD CONSTRAINT legalities_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES investments(id) ON DELETE CASCADE;

    -- locations (Kolom: project_id)
    ALTER TABLE locations
    ADD CONSTRAINT locations_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES investments(id) ON DELETE CASCADE;

    -- media_assets (Kolom: project_id)
    ALTER TABLE media_assets
    ADD CONSTRAINT media_assets_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES investments(id) ON DELETE CASCADE;

    -- investment_scores (Kolom: project_id)
    ALTER TABLE investment_scores
    ADD CONSTRAINT investment_scores_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES investments(id) ON DELETE CASCADE;

END $$;

