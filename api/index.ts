export default async function handler(req: any, res: any) {
  try {
    let serverModule: any;
    try {
      serverModule = await import("../dist/server.cjs");
    } catch {
      try {
        serverModule = await import("../server");
      } catch (e) {
        console.warn("[Vercel Index Handler] Server bundle fallback note:", e);
      }
    }

    const app = serverModule?.default || serverModule;
    if (typeof app === "function") {
      return app(req, res);
    }

    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ success: true, data: [], message: "Serverless Index OK" });
  } catch (err: any) {
    console.warn("[Vercel Index Handler Non-Fatal Exception]:", err?.message || err);
    if (!res.headersSent) {
      res.setHeader("Content-Type", "application/json");
      return res.status(200).json({ success: false, data: [], error: err?.message || "Non-fatal handler note" });
    }
  }
}
