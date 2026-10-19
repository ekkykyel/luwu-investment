// Catch-all serverless function: meneruskan semua /api/* ke Express (dist/server.cjs)
let cachedApp: any = null;
let loadError: any = null;

function unwrap(mod: any) {
  let m = mod;
  for (let i = 0; i < 3 && m && typeof m !== "function"; i++) {
    m = m.default ?? m.app;
  }
  return typeof m === "function" ? m : null;
}

async function getExpressApp() {
  if (cachedApp) return cachedApp;
  if (loadError) throw loadError;
  try {
    // @ts-ignore
    const mod = await import("../dist/server.cjs");
    const app = unwrap(mod);
    if (!app) throw new Error("dist/server.cjs tidak mengekspor fungsi Express");
    cachedApp = app;
    return app;
  } catch (err) {
    loadError = err;
    console.error("[Vercel CatchAll] gagal memuat dist/server.cjs:", err);
    throw err;
  }
}

export default async function handler(req: any, res: any) {
  try {
    const app = await getExpressApp();
    return app(req, res);
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err?.message || "Server failed to start" });
    }
  }
}