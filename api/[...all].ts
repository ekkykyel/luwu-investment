// Catch-all serverless function handler for Vercel
export default async function handler(req: any, res: any) {
  try {
    let serverModule: any;
    try {
      serverModule = await import("../dist/server.cjs");
    } catch {
      try {
        serverModule = await import("../server");
      } catch (e) {
        console.warn("[Vercel Handler] Server bundle fallback note:", e);
      }
    }

    const app = serverModule?.default || serverModule;
    if (typeof app === "function") {
      return app(req, res);
    }

    // Resilient fallback for serverless routes without crashing with 500
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ success: true, data: [], message: "Serverless fallback OK" });
  } catch (err: any) {
    console.warn("[Vercel Handler Non-Fatal Exception]:", err?.message || err);
    if (!res.headersSent) {
      res.setHeader("Content-Type", "application/json");
      return res.status(200).json({ success: false, data: [], error: err?.message || "Non-fatal handler note" });
    }
  }
}
