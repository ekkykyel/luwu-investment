import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./_supabaseConfig.js";

const DEFAULT_COMMODITY_TICKER = [
  { symbol: 'CC=F', shortName: 'Kakao (Cocoa)', regularMarketPrice: 125000, regularMarketChange: 2500, regularMarketChangePercent: 2.04 },
  { symbol: 'KC=F', shortName: 'Kopi Robusta', regularMarketPrice: 68000, regularMarketChange: -1200, regularMarketChangePercent: -1.73 },
  { symbol: 'LOCAL_CENGKEH', shortName: 'Cengkeh Luwu', regularMarketPrice: 135000, regularMarketChange: 1500, regularMarketChangePercent: 1.12 },
  { symbol: 'LOCAL_RUMPUT_LAUT', shortName: 'Rumput Laut Kering', regularMarketPrice: 24500, regularMarketChange: 500, regularMarketChangePercent: 2.08 },
  { symbol: 'LOCAL_SAWIT', shortName: 'Tandan Buah Segar Sawit', regularMarketPrice: 2850, regularMarketChange: 45, regularMarketChangePercent: 1.60 },
  { symbol: 'LOCAL_PADI', shortName: 'Gabah Kering Panen (GKP)', regularMarketPrice: 6500, regularMarketChange: 100, regularMarketChangePercent: 1.56 },
  { symbol: 'LOCAL_JAGUNG', shortName: 'Jagung Pipilan Kering', regularMarketPrice: 5800, regularMarketChange: -50, regularMarketChangePercent: -0.85 },
  { symbol: 'LOCAL_LADA', shortName: 'Lada Putih/Hitam', regularMarketPrice: 95000, regularMarketChange: 2000, regularMarketChangePercent: 2.15 },
  { symbol: 'LOCAL_EMAS', shortName: 'Emas Murni Logam Mulia', regularMarketPrice: 1350000, regularMarketChange: 12000, regularMarketChangePercent: 0.90 },
  { symbol: 'IDR=X', shortName: 'USD/IDR', regularMarketPrice: 15850, regularMarketChange: -25, regularMarketChangePercent: -0.16 }
];

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
      // 1. Query Supabase site_settings for updated market_ticker_data
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/site_settings?setting_key=eq.market_ticker_data&select=setting_value`,
        {
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );

      if (resp.ok) {
        const rows = await resp.json();
        if (Array.isArray(rows) && rows.length > 0 && rows[0].setting_value) {
          let val = rows[0].setting_value;
          if (typeof val === "string") {
            try {
              val = JSON.parse(val);
            } catch {
              // ignore
            }
          }
          if (Array.isArray(val) && val.length > 0) {
            res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
            return res.status(200).json(val);
          }
        }
      }

      // 2. Return standard Luwu commodity ticker baseline
      res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
      return res.status(200).json(DEFAULT_COMMODITY_TICKER);
    } catch (err: any) {
      console.warn("[/api/market-ticker] Error:", err?.message || err);
      return res.status(200).json(DEFAULT_COMMODITY_TICKER);
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
