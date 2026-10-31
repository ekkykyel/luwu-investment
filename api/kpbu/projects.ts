import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  const { id } = req.query;

  // 1. GET: Fetch projects
  if (req.method === 'GET') {
    try {
      const isAll = req.query.all === 'true';
      let query = supabase.from('kpbu_projects').select('*').order('urutan', { ascending: true });
      if (!isAll) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json({ data: data || [] });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal mengambil data KPBU' });
    }
  }

  // 2. POST: Insert new project
  if (req.method === 'POST') {
    try {
      const { nama_proyek, sektor, estimasi_capex, estimasi_capex_label, skema, status_tahap, fasilitas, urutan, is_active } = req.body || {};
      if (!nama_proyek) {
        return res.status(400).json({ error: 'nama_proyek wajib diisi' });
      }

      const { data, error } = await supabase
        .from('kpbu_projects')
        .insert([{
          nama_proyek,
          sektor: sektor || 'Lainnya',
          estimasi_capex: Number(estimasi_capex) || 0,
          estimasi_capex_label: estimasi_capex_label || 'Rp 0',
          skema: skema || 'KPBU',
          status_tahap: status_tahap || 'Tahap Penyiapan OBC',
          fasilitas: Array.isArray(fasilitas) ? fasilitas : [],
          urutan: Number(urutan) || 1,
          is_active: is_active ?? true,
          updated_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      return res.status(201).json({ data: data?.[0] });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal menambahkan proyek KPBU' });
    }
  }

  // 3. PUT: Update project
  if (req.method === 'PUT') {
    try {
      const targetId = id || req.body?.id;
      if (!targetId) {
        return res.status(400).json({ error: 'ID proyek wajib disediakan' });
      }

      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString()
      };
      const allowedFields = ['nama_proyek', 'sektor', 'estimasi_capex', 'estimasi_capex_label', 'skema', 'status_tahap', 'fasilitas', 'urutan', 'is_active'];
      for (const field of allowedFields) {
        if (req.body?.[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      const { data, error } = await supabase
        .from('kpbu_projects')
        .update(updateData)
        .eq('id', targetId)
        .select();

      if (error) throw error;
      return res.status(200).json({ data: data?.[0] });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal memperbarui proyek KPBU' });
    }
  }

  // 4. DELETE: Remove project
  if (req.method === 'DELETE') {
    try {
      const targetId = id || req.body?.id;
      if (!targetId) {
        return res.status(400).json({ error: 'ID proyek wajib disediakan' });
      }

      const { error } = await supabase
        .from('kpbu_projects')
        .delete()
        .eq('id', targetId);

      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Proyek berhasil dihapus' });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Gagal menghapus proyek KPBU' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
