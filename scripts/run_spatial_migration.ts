import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL environment variable is not defined");
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  try {
    await client.connect();
    console.log("Connected to PostgreSQL database");

    const sql = `
      -- 1. Add Spatial and Media columns
      ALTER TABLE public.pengaduan 
      ADD COLUMN IF NOT EXISTS latitude FLOAT,
      ADD COLUMN IF NOT EXISTS longitude FLOAT,
      ADD COLUMN IF NOT EXISTS bukti_foto_url TEXT;

      -- 2. Create Storage Bucket for Evidence (Note: This might need to be run in Supabase SQL editor directly if permissions are restricted for pg client)
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('pengaduan_evidence', 'pengaduan_evidence', true)
      ON CONFLICT (id) DO NOTHING;

      -- 3. Storage Security Policies
      -- Re-creating policies
      DROP POLICY IF EXISTS "Public can upload evidence" ON storage.objects;
      CREATE POLICY "Public can upload evidence" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pengaduan_evidence');
      
      DROP POLICY IF EXISTS "Anyone can view evidence" ON storage.objects;
      CREATE POLICY "Anyone can view evidence" ON storage.objects FOR SELECT USING (bucket_id = 'pengaduan_evidence');
    `;

    await client.query(sql);
    console.log("Database migration for spatial pengaduan successful!");

  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await client.end();
  }
}

main();
