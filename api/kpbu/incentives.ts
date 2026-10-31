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
    const [incentives, config] = await Promise.all([
      supabase
        .from('investment_incentives')
        .select('*')
        .eq('is_active', true)
        .order('urutan', { ascending: true }),
      supabase
        .from('kpbu_config')
        .select('key, value, value_json')
    ]);

    if (incentives.error) throw incentives.error;
    if (config.error) throw config.error;

    const configMap = Object.fromEntries(
      (config.data || []).map(c => [c.key, c.value_json ?? c.value])
    );

    return res.status(200).json({
      data: incentives.data,
      config: configMap
    });
  } catch (err) {
    return res.status(500).json({ error: 'Gagal mengambil data insentif' });
  }
}
