import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { data, error } = await supabase
      .from('kpbu_projects')
      .select('*')
      .eq('is_active', true)
      .order('urutan', { ascending: true });

    if (error) throw error;
    return res.status(200).json({ data });
  } catch (err) {
    return res.status(500).json({ error: 'Gagal mengambil data KPBU' });
  }
}
