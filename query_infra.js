require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('gis_infrastruktur').select('id, properties, geometry').limit(10);
  console.log(JSON.stringify(data, null, 2));
}
run();
