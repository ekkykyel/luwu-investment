require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('gis_zonasi').select('geom').eq('keterangan', 'Kawasan Industri');
  if (data) {
    console.log(JSON.stringify(data));
  }
}
run();
