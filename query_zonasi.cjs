require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('gis_zonasi').select('*');
  if (data) {
    data.forEach(d => console.log(d.id, d.keterangan));
  }
}
run();
