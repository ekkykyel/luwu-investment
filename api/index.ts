import app from "../server";

export default async function handler(req: any, res: any) {
  try {
    if (typeof app === "function") {
      return app(req, res);
    }
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ success: true, data: [], message: "Serverless Index OK" });
  } catch (err: any) {
    console.warn("[Vercel Index Handler Exception]:", err?.message || err);
    if (!res.headersSent) {
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({ success: false, data: [], error: err?.message || "Handler error" });
    }
  }
}

