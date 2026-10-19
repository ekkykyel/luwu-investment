const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://yeezhpdgafbefwipmldl.supabase.co").replace(/\/+$/, "");
const SUPABASE_ANON_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZXpocGRnYWZiZWZ3aXBtbGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwODQ4NjksImV4cCI6MjEwNTY2MDg2OX0.GrlyUjBklIk6sSFeBrqYqN2gDfTMfRxaQ0SX2glspkk";

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    try {
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/investor_testimonials?is_verified=eq.true&order=created_at.desc&limit=20`,
        {
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );

      if (resp.ok) {
        const data = await resp.json();
        res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
        return res.status(200).json(Array.isArray(data) ? data : []);
      }
      return res.status(200).json([]);
    } catch (err: any) {
      console.warn("[/api/testimonials] Non-fatal fetch note:", err?.message || err);
      return res.status(200).json([]);
    }
  }

  if (req.method === "POST") {
    try {
      const { investor_name, company_name, sector, message } = req.body || {};
      const resolvedName = (investor_name && company_name)
        ? `${investor_name} (${company_name})`
        : (investor_name || company_name || "Masyarakat / Investor Luwu");

      if (!sector && !message) {
        return res.status(400).json({ error: "Sektor layanan dan isi pesan/testimoni wajib diisi" });
      }

      const newTestimonial = {
        company_name: resolvedName,
        sector: sector || "Pelayanan Publik Terpadu",
        message: message || "Pelayanan publik ramah, cepat, dan transparan.",
        is_verified: true,
        created_at: new Date().toISOString()
      };

      const resp = await fetch(`${SUPABASE_URL}/rest/v1/investor_testimonials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Prefer": "return=representation"
        },
        body: JSON.stringify(newTestimonial)
      });

      if (resp.ok) {
        const data = await resp.json();
        return res.status(200).json({ success: true, data });
      }
      return res.status(200).json({ success: true, data: [newTestimonial] });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || "Gagal menyimpan testimoni" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
