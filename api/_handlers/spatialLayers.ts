const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://yeezhpdgafbefwipmldl.supabase.co").replace(/\/+$/, "");
const SUPABASE_ANON_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZXpocGRnYWZiZWZ3aXBtbGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwODQ4NjksImV4cCI6MjEwNTY2MDg2OX0.GrlyUjBklIk6sSFeBrqYqN2gDfTMfRxaQ0SX2glspkk";

const BASE_LAYERS = [
  { id: "layer_kecamatan", name: "Batas Administrasi Kecamatan", category: "Batas Wilayah", table: "gis_kecamatan" },
  { id: "layer_desa", name: "Batas Administrasi Desa", category: "Batas Wilayah", table: "gis_desa" },
  { id: "layer_jalan", name: "Jaringan Jalan", category: "Infrastruktur", table: "gis_jalan" },
  { id: "layer_infrastruktur", name: "Infrastruktur Strategis", category: "Infrastruktur", table: "gis_infrastruktur" },
  { id: "layer_sawah", name: "Lahan Pertanian Basah (Sawah)", category: "Tata Ruang", table: "gis_sawah" },
  { id: "layer_mangrove", name: "Kawasan Hutan Mangrove", category: "Lingkungan", table: "gis_mangrove" },
  { id: "layer_tambak", name: "Kawasan Perikanan Tambak", category: "Perikanan", table: "gis_tambak" },
  { id: "layer_zonasi", name: "RTRW / Zonasi Pola Ruang", category: "Tata Ruang", table: "gis_zonasi" }
];

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Parse target layer ID if requested like /api/spatial-layers/:id or /api/spatial-layers?id=...
  const urlParts = (req.url || "").split("?")[0].split("/").filter(Boolean);
  const layerIdParam = urlParts.length > 2 ? urlParts[2] : (req.query?.id || req.query?.layerId);
  const isObjectFormat = req.query?.format === "object";

  // If requesting a specific layer ID
  if (layerIdParam && layerIdParam !== "spatial-layers") {
    let targetTable = layerIdParam.startsWith("layer_") ? "gis_" + layerIdParam.replace("layer_", "") : layerIdParam;
    if (targetTable === "gis_land_use_zoning" || targetTable === "gis_pola_ruang") targetTable = "gis_zonasi";
    if (targetTable === "gis_tanah_kering_primer" || targetTable === "gis_lahan_kering_primer") targetTable = "gis_lahankeringprimer";
    if (targetTable === "gis_tanah_kering_sekunder" || targetTable === "gis_lahan_kering_sekunder") targetTable = "gis_lahankeringsekunder";
    if (targetTable === "gis_potensi") targetTable = "gis_potensi_investasi";

    try {
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/${targetTable}?select=*&limit=500`, {
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
        }
      });

      if (resp.ok) {
        const rows = await resp.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const features = rows.map((row: any, idx: number) => {
            let geom = row.geom || row.geometry;
            if (typeof geom === "string") {
              try { geom = JSON.parse(geom); } catch {}
            }
            const fid = row.id ?? `${targetTable}_${idx + 1}`;
            const { geom: _g, geometry: _geom, ...props } = row;
            return {
              type: "Feature",
              id: fid,
              geometry: geom || null,
              properties: { ...props, id: fid, layer_id: targetTable }
            };
          }).filter((f: any) => f.geometry !== null);

          const featureColl = { type: "FeatureCollection", features };
          res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=300");
          return res.status(200).json({
            id: layerIdParam,
            layerId: layerIdParam,
            success: true,
            isAvailable: true,
            geojson: featureColl,
            data: featureColl
          });
        }
      }

      // Honest fallback when table is empty or error
      return res.status(200).json({
        id: layerIdParam,
        layerId: layerIdParam,
        success: true,
        isAvailable: false,
        geojson: { type: "FeatureCollection", features: [] },
        data: { type: "FeatureCollection", features: [] }
      });
    } catch (err: any) {
      console.warn(`[/api/spatial-layers/${layerIdParam}] Error:`, err?.message || err);
      return res.status(200).json({
        id: layerIdParam,
        layerId: layerIdParam,
        success: true,
        isAvailable: false,
        geojson: { type: "FeatureCollection", features: [] },
        data: { type: "FeatureCollection", features: [] }
      });
    }
  }

  // General spatial-layers list (format=object or array)
  try {
    const [kecResp, desaResp] = await Promise.allSettled([
      fetch(`${SUPABASE_URL}/rest/v1/gis_kecamatan?select=id,name,kecamatan,geom,geojson&limit=100`, {
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` }
      }),
      fetch(`${SUPABASE_URL}/rest/v1/gis_desa?select=id,desa,nama_desa,name,kecamatan,WADMKC,geom,geojson,luas_gis,luas,jum_pdd,kepadatan&limit=300`, {
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` }
      })
    ]);

    let districtsData: any[] = [];
    let villagesData: any[] = [];
    let kecFeatures: any[] = [];
    let desaFeatures: any[] = [];

    if (kecResp.status === "fulfilled" && kecResp.value.ok) {
      const rows = await kecResp.value.json();
      if (Array.isArray(rows)) {
        districtsData = rows.map((r: any) => ({
          id: String(r.id),
          name: r.kecamatan || r.name || `Kecamatan ${r.id}`,
          districtId: String(r.id)
        }));
        kecFeatures = rows.map((r: any) => ({
          type: "Feature",
          geometry: r.geom || r.geojson || null,
          properties: { ...r, id: String(r.id), name: r.kecamatan || r.name }
        })).filter((f: any) => f.geometry !== null);
      }
    }

    if (desaResp.status === "fulfilled" && desaResp.value.ok) {
      const rows = await desaResp.value.json();
      if (Array.isArray(rows)) {
        villagesData = rows.map((r: any) => ({
          id: String(r.id),
          name: r.desa || r.nama_desa || r.name || `Desa ${r.id}`,
          districtId: String(r.kecamatan || r.WADMKC || "")
        }));
        desaFeatures = rows.map((r: any) => ({
          type: "Feature",
          geometry: r.geom || r.geojson || null,
          properties: { ...r, id: String(r.id), name: r.desa || r.nama_desa || r.name }
        })).filter((f: any) => f.geometry !== null);
      }
    }

    const layers = BASE_LAYERS.map(bl => {
      let features: any[] = [];
      if (bl.id === "layer_kecamatan") features = kecFeatures;
      if (bl.id === "layer_desa") features = desaFeatures;

      return {
        id: bl.id,
        name: bl.name,
        category: bl.category,
        isActive: bl.id === "layer_kecamatan" || bl.id === "layer_desa",
        geojson: { type: "FeatureCollection", features }
      };
    });

    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=300");

    if (isObjectFormat) {
      return res.status(200).json({
        investments: [],
        districts: districtsData,
        villages: villagesData,
        infrastructure: [],
        layers
      });
    }

    return res.status(200).json(layers);
  } catch (err: any) {
    console.warn("[/api/spatial-layers] General error:", err?.message || err);
    if (isObjectFormat) {
      return res.status(200).json({
        investments: [],
        districts: [],
        villages: [],
        infrastructure: [],
        layers: []
      });
    }
    return res.status(200).json([]);
  }
}
