import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const GLOBAL_JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || "+uGO889dVvBQryEybsaAml7WcgVSMG5YgC7qgQcph1BOGAVKpqJrm81H024M7cvMXAyWSBGeppEeaMLUdkNHlQ==";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./_supabaseConfig.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");

  // CORS Preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-access-token");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
      message: "Metode tidak diizinkan."
    });
  }

  const { username, email, password, role } = req.body ?? {};
  const rawIdentifier = (username || email || "").trim();

  // Validasi input awal
  if (!rawIdentifier || !password) {
    return res.status(400).json({
      success: false,
      error: "Email dan password wajib diisi",
      code: "MISSING_CREDENTIALS",
      message: "Email dan kata sandi wajib diisi."
    });
  }

  // Alias pemetaan dinas resmi Pemkab Luwu
  const aliasMap: Record<string, string> = {
    "adminmpp": "adminmpp@luwukab.go.id",
    "mpp": "adminmpp@luwukab.go.id",
    "superadmin": "superadmin@luwu.go.id",
    "operator": "operator@luwu.go.id",
    "puptr": "puptr@luwukab.go.id",
    "adminpuptr": "puptr@luwukab.go.id",
    "pertanian": "pertanian@luwukab.go.id",
    "adminpertanian": "pertanian@luwukab.go.id",
    "dalak": "dalakluwu@gmail.com",
    "admindalak": "dalakluwu@gmail.com",
    "promosi": "promosiluwu@gmail.com",
    "adminpromosi": "promosiluwu@gmail.com",
    "data": "dataluwu@gmail.com",
    "admindata": "dataluwu@gmail.com",
    "oss": "dpmptspluwu@gmail.com",
    "adminoss": "dpmptspluwu@gmail.com",
    "investor": "investor@luwu.go.id",
    "masyarakat": "masyarakat@luwu.go.id",
  };

  const lowerInput = rawIdentifier.toLowerCase();
  const effectiveEmail = aliasMap[lowerInput] || (rawIdentifier.includes("@") ? rawIdentifier : `${lowerInput}@luwu.go.id`);

  try {
    let authData: any = null;
    let authError: any = null;

    // 1. Coba otentikasi via Supabase Auth jika client key tersedia
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: { persistSession: false, autoRefreshToken: false }
        });

        const resAuth = await supabase.auth.signInWithPassword({
          email: effectiveEmail,
          password: password,
        });

        authData = resAuth.data;
        authError = resAuth.error;

        if (authError) {
          console.warn("[api/auth/login] Supabase auth notice:", authError.message);
        }
      } catch (sbCallErr: any) {
        authError = sbCallErr;
        console.warn("[api/auth/login] Supabase signIn exception:", sbCallErr?.message);
      }
    }

    // 2. Kredensial dinas darurat / offline seed fallback
    let mappedRole = "Operator";
    let userId = "user-session-id";
    let userEmail = effectiveEmail;
    let tokenSession = authData?.session || null;
    let profile: any = null;

    if (authError || !authData?.user) {
      if ((lowerInput === "superadmin@luwu.go.id" || lowerInput === "superadmin") && (password === "SuperAdmin123!" || password === "Operator123!")) {
        mappedRole = "Super Admin";
        userEmail = "superadmin@luwu.go.id";
        userId = "offline-super-admin-uuid-00001";
      } else if ((lowerInput === "puptr@luwukab.go.id" || lowerInput === "adminpuptr@luwukab.go.id" || lowerInput === "puptr@luwu.go.id" || lowerInput === "adminpuptr") && (password === "Puptr123!" || password === "Operator123!")) {
        mappedRole = "Admin PUPTR";
        userEmail = "puptr@luwukab.go.id";
        userId = "offline-puptr-uuid-00003";
      } else if ((lowerInput === "pertanian@luwukab.go.id" || lowerInput === "adminpertanian@luwukab.go.id" || lowerInput === "pertanian@luwu.go.id" || lowerInput === "adminpertanian") && (password === "Pertanian123!" || password === "Operator123!")) {
        mappedRole = "Admin Pertanian";
        userEmail = "pertanian@luwukab.go.id";
        userId = "offline-pertanian-uuid-00004";
      } else if ((lowerInput === "dalakluwu@gmail.com" || lowerInput === "admindalak@luwukab.go.id" || lowerInput === "dalak@luwukab.go.id" || lowerInput === "admindalak") && (password === "Dalak123!" || password === "Operator123!")) {
        mappedRole = "Admin Dalak";
        userEmail = "dalakluwu@gmail.com";
        userId = "offline-dalak-uuid-00005";
      } else if ((lowerInput === "promosiluwu@gmail.com" || lowerInput === "adminpromosi@luwukab.go.id" || lowerInput === "promosi@luwukab.go.id" || lowerInput === "adminpromosi") && (password === "Promosi123!" || password === "Operator123!")) {
        mappedRole = "Admin Promosi";
        userEmail = "promosiluwu@gmail.com";
        userId = "offline-promosi-uuid-00006";
      } else if ((lowerInput === "dataluwu@gmail.com" || lowerInput === "admindata@luwukab.go.id" || lowerInput === "data@luwukab.go.id" || lowerInput === "admindata") && (password === "Data123!" || password === "Operator123!")) {
        mappedRole = "Admin Data";
        userEmail = "dataluwu@gmail.com";
        userId = "offline-data-uuid-00007";
      } else if ((lowerInput === "dpmptspluwu@gmail.com" || lowerInput === "adminoss@luwukab.go.id" || lowerInput === "oss@luwukab.go.id" || lowerInput === "adminoss") && (password === "Oss123!" || password === "Operator123!")) {
        mappedRole = "Admin OSS";
        userEmail = "dpmptspluwu@gmail.com";
        userId = "offline-oss-uuid-00008";
      } else if ((lowerInput === "adminmpp@luwukab.go.id" || lowerInput === "mpp@luwukab.go.id" || lowerInput === "adminmpp" || lowerInput === "nilambintangselatan@gmail.com") && (password === "adminmpp@26" || password === "Mpp123!" || password === "Operator123!")) {
        mappedRole = "Admin MPP";
        userEmail = "adminmpp@luwukab.go.id";
        userId = "offline-mpp-uuid-00009";
      } else if ((lowerInput === "investor@luwu.go.id" || lowerInput === "investor") && (password === "Investor123!" || password === "Operator123!")) {
        mappedRole = "Investor";
        userEmail = "investor@luwu.go.id";
        userId = "offline-investor-uuid-00010";
      } else if ((lowerInput === "masyarakat@luwu.go.id" || lowerInput === "masyarakat") && (password === "Masyarakat123!" || password === "Operator123!")) {
        mappedRole = "Masyarakat";
        userEmail = "masyarakat@luwu.go.id";
        userId = "offline-masyarakat-uuid-00011";
      } else if (lowerInput === "operator@luwu.go.id" && password === "Operator123!") {
        mappedRole = "Operator";
        userEmail = "operator@luwu.go.id";
        userId = "offline-operator-uuid-00002";
      } else {
        // Kredensial tidak valid -> WAJIB kembalikan 401 (Bukan 500)
        return res.status(401).json({
          success: false,
          error: "Email atau kata sandi tidak valid",
          code: "INVALID_CREDENTIALS",
          message: "Email atau kata sandi tidak valid. Periksa kembali akun Anda."
        });
      }
    } else {
      // Autentikasi Supabase berhasil
      userEmail = authData.user.email || effectiveEmail;
      userId = authData.user.id;
      tokenSession = authData.session;

      const userMetadataRole = authData.user.user_metadata?.role || "";
      const norm = (userMetadataRole || "").toLowerCase().replace(/[\s_-]+/g, "");
      const userEmailLower = userEmail.toLowerCase();

      if (norm === "superadmin" || norm === "super" || userEmailLower.includes("superadmin")) {
        mappedRole = "Super Admin";
      } else if (norm === "admin_puptr" || norm === "adminpuptr" || norm === "puptr" || userEmailLower.includes("puptr")) {
        mappedRole = "Admin PUPTR";
      } else if (norm === "admin_pertanian" || norm === "adminpertanian" || norm === "pertanian" || userEmailLower.includes("pertanian")) {
        mappedRole = "Admin Pertanian";
      } else if (norm === "admin_dalak" || norm === "admindalak" || norm === "dalak" || userEmailLower.includes("dalak")) {
        mappedRole = "Admin Dalak";
      } else if (norm === "admin_oss" || norm === "adminoss" || norm === "oss" || userEmailLower.includes("dpmptsp") || userEmailLower.includes("oss")) {
        mappedRole = "Admin OSS";
      } else if (norm === "admin_promosi" || norm === "adminpromosi" || norm === "promosi" || userEmailLower.includes("promosi")) {
        mappedRole = "Admin Promosi";
      } else if (norm === "admin_data" || norm === "admindata" || norm === "data" || userEmailLower.includes("dataluwu")) {
        mappedRole = "Admin Data";
      } else if (norm === "admin_mpp" || norm === "adminmpp" || norm === "mpp" || userEmailLower.includes("mpp")) {
        mappedRole = "Admin MPP";
      } else if (norm === "investor" || userEmailLower.includes("investor")) {
        mappedRole = "Investor";
      } else if (norm === "masyarakat") {
        mappedRole = "Masyarakat";
      } else {
        mappedRole = "Operator";
      }

      profile = {
        id: userId,
        email: userEmail,
        role: mappedRole,
        full_name: authData.user.user_metadata?.full_name || mappedRole
      };
    }

    // Validasi kecocokan role bila ada request spesifik
    const normReqRole = role ? String(role).toLowerCase().replace(/[\s_]+/g, "") : "";
    const normMappedRole = String(mappedRole).toLowerCase().replace(/[\s_]+/g, "");
    const isOperatorGate = normReqRole === "operator" || normReqRole === "superadmin";

    if (role && !isOperatorGate && normReqRole !== normMappedRole && normMappedRole !== "superadmin") {
      return res.status(403).json({
        success: false,
        error: "Role mismatch",
        code: "ROLE_MISMATCH",
        message: `Akses ditolak. Email terdaftar sebagai ${mappedRole}, bukan ${role}.`
      });
    }

    // Terbitkan JWT internal aplikasi
    const token = jwt.sign(
      { role: mappedRole, username: userEmail, sub: userId },
      GLOBAL_JWT_SECRET,
      { expiresIn: "12h" }
    );

    return res.status(200).json({
      success: true,
      message: `Login ${mappedRole} berhasil.`,
      token,
      role: mappedRole,
      user: profile || { id: userId, email: userEmail, role: mappedRole },
      session: tokenSession,
      supabase_token: tokenSession?.access_token || null
    });
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error("[api/auth/login] Unexpected error:", errorMsg);
    return res.status(500).json({
      success: false,
      error: "Terjadi kesalahan pada server",
      code: "INTERNAL_ERROR",
      message: "Terjadi kesalahan pada server autentikasi.",
      detail: process.env.NODE_ENV === "development" ? errorMsg : undefined
    });
  }
}
