import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE credentials");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkPolicies() {
  console.log("Checking RLS Policies for 'media_assets'...");
  const { data: mediaPol, error: mediaErr } = await supabase.rpc('get_pg_policies', { table_name: 'media_assets' });
  if (mediaErr) {
    console.error("RPC failed, we might need to use direct query if exposed, doing direct REST API query? No. Let's try direct postgres connection via URL if possible.");
  }
}

checkPolicies();
