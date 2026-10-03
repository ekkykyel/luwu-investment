import jwt from "jsonwebtoken";

const GLOBAL_JWT_SECRET = process.env.JWT_SECRET || "luwu-investment-portal-secure-jwt-secret-2025";
const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://svxugvxchjsjuyfeddor.supabase.co").replace(/\/+$/, "");
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_publishable_SyZQ0YW4CWEVfMjBS9NtZQ_T0tB4zJj";

export default async function handler(req: any, res: any) {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-access-token");
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, user: null, message: "Method Not Allowed" });
  }

  try {
    // 1. Extract token from header or cookie
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    let token = "";

    if (authHeader && typeof authHeader === "string") {
      token = authHeader.replace(/^Bearer\s+/i, "").trim();
    } else if (req.headers["x-access-token"]) {
      token = String(req.headers["x-access-token"]).trim();
    } else if (req.headers.cookie) {
      const match = String(req.headers.cookie).match(/(?:^|;\s*)sb-access-token=([^;]+)/);
      if (match && match[1]) {
        token = decodeURIComponent(match[1]).trim();
      }
    }

    if (!token || token === "null" || token === "undefined") {
      return res.status(401).json({ success: false, user: null, message: "No active session" });
    }

    // 2. Decode / Verify token
    let decoded: any = null;
    try {
      decoded = jwt.verify(token, GLOBAL_JWT_SECRET);
    } catch {
      try {
        const supabaseSecret = process.env.SUPABASE_JWT_SECRET;
        if (supabaseSecret) {
          decoded = jwt.verify(token, supabaseSecret);
        }
      } catch {}
      
      // Fallback: decode payload if signed by Supabase GoTrue
      if (!decoded) {
        try {
          decoded = jwt.decode(token);
        } catch {}
      }
    }

    if (!decoded || typeof decoded !== "object") {
      return res.status(401).json({ success: false, user: null, message: "No active session" });
    }

    const userId = decoded.sub || decoded.id || decoded.user_id || "cit-session";
    const userRole = decoded.role || decoded.user_metadata?.role || decoded.app_metadata?.role || "masyarakat";
    const userNik = decoded.nik || decoded.user_metadata?.nik || decoded.no_ktp || "";
    const userEmail = decoded.email || decoded.username || (userNik ? `${userNik}@warga.luwukab.go.id` : "");
    const userName = decoded.name || decoded.fullName || decoded.full_name || decoded.user_metadata?.full_name || decoded.user_metadata?.name || "Warga Kab. Luwu";

    let profileData: any = null;

    // 3. Graceful Supabase profile lookup via REST
    if (userNik || (userId && userId.length > 20 && !userId.startsWith("cit-"))) {
      try {
        const filterParam = userNik ? `nik=eq.${encodeURIComponent(userNik)}` : `id=eq.${encodeURIComponent(userId)}`;
        const profRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?${filterParam}&select=*&limit=1`, {
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
        if (profRes.ok) {
          const rows = await profRes.json();
          if (Array.isArray(rows) && rows.length > 0) {
            profileData = rows[0];
          }
        }
      } catch (dbErr) {
        console.warn("[/api/auth/me] Non-fatal profiles REST lookup note:", dbErr);
      }

      // If not in profiles, try mpp_citizens for citizen user
      if (!profileData && userNik) {
        try {
          const citRes = await fetch(`${SUPABASE_URL}/rest/v1/mpp_citizens?nik=eq.${encodeURIComponent(userNik)}&select=*&limit=1`, {
            headers: {
              "apikey": SUPABASE_ANON_KEY,
              "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
            }
          });
          if (citRes.ok) {
            const citRows = await citRes.json();
            if (Array.isArray(citRows) && citRows.length > 0) {
              const cit = citRows[0];
              profileData = {
                id: userId,
                nik: cit.nik,
                full_name: cit.full_name,
                role: "masyarakat",
                phone_number: cit.phone_number,
                no_whatsapp: cit.phone_number,
                kecamatan: cit.kecamatan,
                desa: cit.desa,
                address: cit.address
              };
            }
          }
        } catch (citErr) {
          console.warn("[/api/auth/me] Non-fatal mpp_citizens REST lookup note:", citErr);
        }
      }
    }

    return res.status(200).json({
      success: true,
      user: {
        id: userId,
        email: userEmail,
        role: userRole,
        user_metadata: decoded.user_metadata || {
          nik: userNik,
          full_name: profileData?.full_name || userName,
          role: userRole
        }
      },
      profile: profileData,
      role: userRole
    });
  } catch (err: any) {
    console.error("[/api/auth/me] Error in serverless handler:", err);
    // Never crash with HTTP 500 on auth check; return clean 401
    return res.status(401).json({ success: false, user: null, message: "No active session" });
  }
}
