export default async function handler(req: any, res: any) {
  // WAJIB set header JSON & no-store di awal
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  // Health check harus RINGAN — tidak boleh query database
  // Hanya cek status sistem dan env variables kritis
  const supabaseUrl = process.env.SUPABASE_URL || 
                      process.env.VITE_SUPABASE_URL || 
                      process.env.NEXT_PUBLIC_SUPABASE_URL || '';

  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 
                      process.env.SUPABASE_SERVICE_ROLE_KEY || 
                      process.env.SUPABASE_ANON_KEY || 
                      process.env.VITE_SUPABASE_ANON_KEY || 
                      process.env.SUPABASE_PUBLISHABLE_KEY || '';

  const checks = {
    status: 'ok',
    service: 'investluwu-hub-api',
    timestamp: new Date().toISOString(),
    env: {
      supabase_url: Boolean(supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'),
      supabase_key: Boolean(supabaseKey && supabaseKey.length > 10),
      node_env: process.env.NODE_ENV ?? 'production',
    },
    version: process.env.npm_package_version ?? '1.0.0',
  };

  // Jika env kritis tidak ada, kembalikan 503 (bukan 500)
  if (!checks.env.supabase_url || !checks.env.supabase_key) {
    return res.status(503).json({
      ...checks,
      status: 'degraded',
      reason: 'Missing required environment variables (SUPABASE_URL or SUPABASE_KEY)',
    });
  }

  return res.status(200).json(checks);
}
