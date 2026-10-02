import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('mpp_document_tracking').select('*, queue:mpp_queues(*, citizen:mpp_citizens(*), service:mpp_services(*), tenant:mpp_tenants(*))').limit(1);
  console.log(data, error);
}
run();
