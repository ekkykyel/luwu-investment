// Import from pre-built CJS bundle (esbuild output) — NOT raw TypeScript source
// server.ts (17K+ lines) cannot be resolved by Vercel's internal TS compiler
// dist/server.cjs is included via vercel.json includeFiles
// @ts-ignore
import serverModule from "../dist/server.cjs";
const app = (serverModule as any)?.default || serverModule;

// Catch-all serverless function handler for Vercel
export default async function handler(req: any, res: any) {
  try {
    // If Vercel rewrote req.url to '/api', restore original requested path from x-matched-path for Express router
    if (req.url === "/api" || req.url === "/api/" || req.url?.startsWith("/api?")) {
      const originalPath = req.headers?.["x-matched-path"] || req.headers?.["x-forwarded-uri"];
      if (originalPath && !originalPath.startsWith("/api/health") && !originalPath.startsWith("/api/auth/login")) {
        const queryIndex = req.url.indexOf("?");
        const queryStr = queryIndex !== -1 ? req.url.slice(queryIndex) : "";
        req.url = originalPath + queryStr;
      }
    }

    if (typeof app === "function") {
      return app(req, res);
    }

    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ success: true, data: [], message: "Serverless fallback OK" });
  } catch (err: any) {
    console.warn("[Vercel Handler Exception]:", err?.message || err);
    if (!res.headersSent) {
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({ success: false, data: [], error: err?.message || "Handler error" });
    }
  }
}

