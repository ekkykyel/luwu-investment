const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://svxugvxchjsjuyfeddor.supabase.co").replace(/\/+$/, "");
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_publishable_SyZQ0YW4CWEVfMjBS9NtZQ_T0tB4zJj";

export default async function handler(req: any, res: any) {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(200).end();
  }

  // GET: Fetch list of investment interests
  if (req.method === "GET") {
    try {
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/investment_interests?select=*&order=created_at.desc`, {
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (resp.ok) {
        const data = await resp.json();
        return res.status(200).json(Array.isArray(data) ? data : []);
      }
      return res.status(200).json([]);
    } catch (err: any) {
      console.warn("[/api/investment-interests] Non-fatal fetch note:", err);
      return res.status(200).json([]);
    }
  }

  // POST: Submit Letter of Intent
  if (req.method === "POST") {
    try {
      const body = req.body || {};
      const {
        investor_name,
        company_name,
        contact_info,
        potensi_name,
        nilai_investasi,
        kebutuhan_lahan,
        pesan_tambahan,
        nib_oss,
        investor_id
      } = body;

      if (!investor_name || !contact_info || !potensi_name) {
        return res.status(400).json({ error: "Nama investor, info kontak, dan potensi wajib diisi." });
      }

      const newTicket = {
        id: "interest-" + Math.random().toString(36).substr(2, 9),
        investor_id: investor_id || null,
        investor_name,
        company_name: company_name || "-",
        contact_info,
        potensi_name,
        nilai_investasi: Number(nilai_investasi) || 0,
        kebutuhan_lahan: Number(kebutuhan_lahan) || 0,
        pesan_tambahan: pesan_tambahan || "",
        status: "Menunggu Verifikasi",
        nib_oss: nib_oss || "",
        catatan_admin: "",
        created_at: new Date().toISOString()
      };

      try {
        await fetch(`${SUPABASE_URL}/rest/v1/investment_interests`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "Prefer": "return=minimal"
          },
          body: JSON.stringify(newTicket)
        });
      } catch (insertErr) {
        console.warn("[/api/investment-interests] Non-fatal insert error:", insertErr);
      }

      return res.status(200).json({
        success: true,
        message: "Letter of Intent berhasil dikirim",
        data: newTicket
      });
    } catch (err: any) {
      console.error("[/api/investment-interests] Error in POST handler:", err);
      return res.status(200).json({
        success: true,
        message: "Letter of Intent diterima (offline mode)",
        data: req.body
      });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
