import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://yeezhpdgafbefwipmldl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZXpocGRnYWZiZWZ3aXBtbGRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDA4NDg2OSwiZXhwIjoyMTA1NjYwODY5fQ.zj_4YRbhVhdq8KPaX0SlVPU8EY2IEfLv3N9bUWmgmjQ'
);

export default async function handler(req: any, res: any) {
  const { id } = req.query;

  // 1. GET: Fetch Investment Readiness Pillars (SSOT Supabase)
  if (req.method === 'GET') {
    try {
      const isAll = req.query.all === 'true';
      let query = supabase.from('investment_readiness_pillars').select('*').order('urutan', { ascending: true });
      if (!isAll) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json({ data: data || [] });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal mengambil data pilar kesiapan investasi', data: [] });
    }
  }

  // 2. PUT: Update readiness pillar (Admin only)
  if (req.method === 'PUT') {
    try {
      const targetId = id || req.body?.id || req.body?.pillar_id;
      if (!targetId) {
        return res.status(400).json({ error: 'ID pilar wajib disediakan' });
      }

      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString()
      };
      const allowedFields = [
        'badge', 'short_label', 'title', 'subtitle', 'accent_color', 'accent_bg',
        'score', 'readiness_rating', 'tagline', 'blueprint_standard', 'luwu_readiness_status',
        'key_metrics', 'strategic_points', 'primary_action_label', 'secondary_action_label',
        'urutan', 'is_active'
      ];
      for (const field of allowedFields) {
        if (req.body?.[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      const isUUID = String(targetId).includes('-');
      const query = supabase.from('investment_readiness_pillars').update(updateData);
      const { data, error } = isUUID
        ? await query.eq('id', targetId).select()
        : await query.eq('pillar_id', targetId).select();

      if (error) throw error;
      return res.status(200).json({ data: data?.[0] });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal memperbarui pilar kesiapan investasi' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
