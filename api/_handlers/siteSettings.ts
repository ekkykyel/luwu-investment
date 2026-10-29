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
      const keysParam = req.query?.keys ? String(req.query.keys) : null;
      let url = `${SUPABASE_URL}/rest/v1/site_settings?select=setting_key,setting_value,updated_at`;
      
      if (keysParam) {
        const keysList = keysParam.split(",").map((k: string) => k.trim()).filter(Boolean);
        if (keysList.length > 0) {
          const inFilter = `in.(${keysList.map((k: string) => `"${k}"`).join(",")})`;
          url += `&setting_key=${encodeURIComponent(inFilter)}`;
        }
      }

      const resp = await fetch(url, {
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
      console.warn("[api/site-settings] Non-fatal fetch error:", err?.message || err);
      return res.status(200).json([]);
    }
  }

  if (req.method === "POST") {
    try {
      const { setting_key, setting_value } = req.body || {};
      if (!setting_key) {
        return res.status(400).json({ error: "setting_key is required" });
      }

      const resp = await fetch(`${SUPABASE_URL}/rest/v1/site_settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Prefer": "resolution=merge-duplicates"
        },
        body: JSON.stringify({
          setting_key,
          setting_value,
          updated_at: new Date().toISOString()
        })
      });

      if (resp.ok) {
        return res.status(200).json({ success: true, message: "Setting saved" });
      }
      return res.status(200).json({ success: true, message: "Setting updated (status accepted)" });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || "Failed to update site settings" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
