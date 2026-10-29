const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1];
const supabaseKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('eoffice_persuratan').select('*').limit(1);
  console.log('eoffice_persuratan:', error || (data.length ? Object.keys(data[0]) : 'Empty'));
  
  const { data: d2, error: e2 } = await supabase.from('perizinan_pbg').select('*').limit(1);
  console.log('perizinan_pbg:', e2 || (d2.length ? Object.keys(d2[0]) : 'Empty'));
}
check();
